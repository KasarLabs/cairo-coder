import * as path from 'path';
import { Document } from '@langchain/core/documents';
import { BookChunk, DocumentSource } from '@cairo-coder/agents/types/index';
import { BookConfig, BookPageDto, ParsedSection } from '../utils/types';
import { logger } from '@cairo-coder/agents/utils/index';
import { exec as execCallback } from 'child_process';
import { promisify } from 'util';
import { MarkdownIngester } from './MarkdownIngester';
import * as fs from 'fs/promises';
import { calculateHash, addSectionWithSizeLimit } from '../utils/contentUtils';

/**
 * Ingester for the Starknet documentation
 *
 * This ingester downloads the Starknet documentation from the GitHub repository,
 * processes the MDX files from the build/, learn/, and secure/ directories,
 * and creates chunks for the vector store.
 */
export class StarknetDocsIngester extends MarkdownIngester {
  // Explicitly skipping corelib ingestion (has its own ingester) and StarknetByExample ingestion (has its own ingester as well)
  private static readonly DOCS_FOLDERS = [
    'build/quickstart',
    'learn',
    'secure',
  ];
  private static readonly BASE_URL = 'https://docs.starknet.io';

  /**
   * Constructor for the Starknet docs ingester
   */
  constructor() {
    // Define the configuration for the Starknet documentation
    const config: BookConfig = {
      repoOwner: 'starknet-io',
      repoName: 'starknet-docs',
      fileExtension: '.mdx',
      chunkSize: 4096,
      chunkOverlap: 512,
      baseUrl: 'https://docs.starknet.io',
      urlSuffix: '',
      useUrlMapping: true,
    };

    super(config, DocumentSource.STARKNET_DOCS);
  }

  /**
   * Get the directory path for extracting files
   *
   * @returns string - Path to the extract directory
   */
  protected getExtractDir(): string {
    return path.join(__dirname, '..', '..', 'temp', 'starknet-docs');
  }

  /**
   * Download and extract the repository
   *
   * @returns Promise<BookPageDto[]> - Array of book pages
   */
  protected async downloadAndExtractDocs(): Promise<BookPageDto[]> {
    const extractDir = this.getExtractDir();
    const repoUrl = `https://github.com/${this.config.repoOwner}/${this.config.repoName}.git`;

    logger.info(`Cloning repository from ${repoUrl}`);

    // Clone the repository
    const exec = promisify(execCallback);
    try {
      // remove extractDir if it exists
      await fs.rm(extractDir, { recursive: true, force: true });
      await exec(`git clone ${repoUrl} ${extractDir}`);
    } catch (error) {
      logger.error('Error cloning repository:', error);
      throw new Error('Failed to clone repository');
    }

    logger.info('Repository cloned successfully.');

    // Process the MDX files from specified directories
    const pages: BookPageDto[] = [];

    for (const folder of StarknetDocsIngester.DOCS_FOLDERS) {
      const docsDir = path.join(extractDir, folder);
      try {
        const folderPages = await this.processDocFiles(this.config, docsDir);
        pages.push(...folderPages);
        logger.info(`Processed ${folderPages.length} pages from ${folder}/`);
      } catch (error) {
        logger.warn(`Could not process folder ${folder}: ${error}`);
      }
    }

    logger.info(
      `Processed ${pages.length} total documentation pages from Starknet`,
    );

    return pages;
  }

  /**
   * Process documentation files from a directory
   *
   * @param directory - The directory to process
   * @returns Promise<BookPageDto[]> - Array of book pages
   */
  private async processDocFiles(
    config: BookConfig,
    directory: string,
  ): Promise<BookPageDto[]> {
    const pages: BookPageDto[] = [];

    async function processDirectory(dir: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Recursively process subdirectories
          await processDirectory(fullPath);
        } else if (
          entry.isFile() &&
          path.extname(entry.name).toLowerCase() === config.fileExtension
        ) {
          // Process MDX files
          const content = await fs.readFile(fullPath, 'utf8');

          // Remove the repository path to get relative path
          const relativePath = path.relative(directory, fullPath);
          const pageName = relativePath.replace('.mdx', '');

          pages.push({
            name: pageName,
            content,
          });
        }
      }
    }

    await processDirectory(directory);
    return pages;
  }

  /**
   * Create chunks from book pages with proper URL mapping
   *
   * @param pages - Array of book pages
   * @returns Promise<Document<BookChunk>[]> - Array of document chunks
   */
  protected async createChunks(
    pages: BookPageDto[],
  ): Promise<Document<BookChunk>[]> {
    logger.info(
      `Creating chunks from ${this.source} pages based on MDX sections`,
    );
    const chunks: Document<BookChunk>[] = [];

    for (const page of pages) {
      // Generate the source URL based on the page name
      const sourceUrl = this.generateSourceUrl(page.name);

      // Extract frontmatter title and process content
      const { title: frontmatterTitle, content: processedContent } =
        this.extractFrontmatterAndProcess(page.content);

      // Create chunks from the page
      const localChunks = this.createChunksFromPage(
        page.name,
        processedContent,
        sourceUrl,
        frontmatterTitle,
      );
      chunks.push(...localChunks);
    }

    return chunks;
  }

  /**
   * Generate the source URL for a documentation page
   *
   * @param pageName - The name/path of the page
   * @returns string - The full URL to the documentation page
   */
  private generateSourceUrl(pageName: string): string {
    // The pageName is relative to the docs folder (e.g., "learn/s-two/air-development/writing-a-simple-air/hello-zk-world")
    // Convert to URL format
    const urlPath = pageName.replace(/\\/g, '/');
    return `${StarknetDocsIngester.BASE_URL}/${urlPath}`;
  }

  /**
   * Extract frontmatter title and process MDX content
   *
   * @param content - The raw MDX content
   * @returns Object with title and processed content
   */
  private extractFrontmatterAndProcess(content: string): {
    title: string | null;
    content: string;
  } {
    // Extract frontmatter if present (content between --- markers at the start)
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
    const frontmatterMatch = content.match(frontmatterRegex);

    let title: string | null = null;
    let processedContent = content;

    if (frontmatterMatch) {
      // Extract the frontmatter content
      const frontmatterContent = frontmatterMatch[1];

      // Parse title from frontmatter
      const titleMatch = frontmatterContent.match(
        /^title:\s*["']?(.+?)["']?\s*$/m,
      );
      if (titleMatch) {
        title = titleMatch[1];
      }

      // Remove the frontmatter from content
      processedContent = content.replace(frontmatterRegex, '');
    }

    // Remove MDX-specific components that don't contribute to documentation
    // For example: import statements, export statements
    processedContent = processedContent.replace(/^import\s+.*$/gm, '');
    processedContent = processedContent.replace(/^export\s+.*$/gm, '');

    return {
      title,
      content: processedContent.trim(),
    };
  }

  /**
   * Create chunks from a single page with URL
   */
  private createChunksFromPage(
    page_name: string,
    page_content: string,
    sourceUrl: string,
    frontmatterTitle: string | null = null,
  ): Document<BookChunk>[] {
    const localChunks = [];
    const sanitizedContent = this.sanitizeCodeBlocks(page_content);

    // Parse the page into sections
    let sections = this.parsePage(sanitizedContent, true);

    // If we have a frontmatter title and sections exist
    if (frontmatterTitle && sections.length > 0) {
      // If the first section doesn't have a title (or has an empty title), use the frontmatter title
      if (!sections[0].title || sections[0].title === '') {
        sections[0].title = frontmatterTitle;
      } else {
        // If there's already a title in the first section, prepend a new section with the frontmatter title
        // This ensures the frontmatter title is preserved as the main page title
        const firstSectionContent = sections[0].content;
        if (
          firstSectionContent &&
          !firstSectionContent.startsWith(`# ${sections[0].title}`)
        ) {
          // The content doesn't start with a header, so we can use frontmatter title for the first chunk
          sections[0].title = frontmatterTitle;
        }
      }
    } else if (frontmatterTitle && sections.length === 0) {
      // If there are no sections but we have content and a frontmatter title, create a single section
      sections = [
        {
          title: frontmatterTitle,
          content: sanitizedContent,
          anchor: undefined,
        },
      ];
    }

    // Create a document for each section
    sections.forEach((section, index: number) => {
      logger.debug(
        `Processed a section with title: ${section.title} and content length: ${section.content.length} from page: ${page_name}`,
      );
      const hash: string = calculateHash(section.content);
      localChunks.push(
        new Document<BookChunk>({
          pageContent: section.content,
          metadata: {
            name: page_name,
            title: section.title,
            chunkNumber: index,
            contentHash: hash,
            uniqueId: `${page_name}-${index}`,
            sourceLink: sourceUrl,
            source: this.source,
          },
        }),
      );
    });

    return localChunks;
  }
}
