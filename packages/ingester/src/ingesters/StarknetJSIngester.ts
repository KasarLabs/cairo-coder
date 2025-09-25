import * as path from 'path';
import { exec as execCallback } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import { BookConfig, BookPageDto, ParsedSection } from '../utils/types';
import { MarkdownIngester } from './MarkdownIngester';
import { DocumentSource, logger } from '@cairo-coder/agents';
import { Document } from '@langchain/core/documents';
import { BookChunk } from '@cairo-coder/agents/types/index';
import { calculateHash } from '../utils/contentUtils';

export class StarknetJSIngester extends MarkdownIngester {
  private static readonly SKIPPED_DIRECTORIES = ['pictures', 'doc_scripts'];

  constructor() {
    const config: BookConfig = {
      repoOwner: 'starknet-io',
      repoName: 'starknet.js',
      fileExtension: '.md',
      chunkSize: 4096,
      chunkOverlap: 512,
    };

    super(config, DocumentSource.STARKNET_JS);
  }

  protected getExtractDir(): string {
    return path.join(__dirname, '..', '..', 'temp', 'starknet-js-guides');
  }

  protected async downloadAndExtractDocs(): Promise<BookPageDto[]> {
    const extractDir = this.getExtractDir();
    const repoUrl = `https://github.com/${this.config.repoOwner}/${this.config.repoName}.git`;
    const exec = promisify(execCallback);

    try {
      // Clone the repository
      // TODO: Consider sparse clone optimization for efficiency:
      // git clone --depth 1 --filter=blob:none --sparse ${repoUrl} ${extractDir}
      // cd ${extractDir} && git sparse-checkout set www/docs/guides
      logger.info(`Cloning repository from ${repoUrl}...`);
      await exec(`git clone ${repoUrl} ${extractDir}`);
      logger.info('Repository cloned successfully');

      // Navigate to the guides directory
      const docsDir = path.join(extractDir, 'www', 'docs', 'guides');

      // Process markdown files from the guides directory
      const pages: BookPageDto[] = [];
      await this.processDirectory(docsDir, docsDir, pages);

      logger.info(
        `Processed ${pages.length} markdown files from StarknetJS guides`,
      );
      return pages;
    } catch (error) {
      logger.error('Error downloading StarknetJS guides:', error);
      throw new Error('Failed to download and extract StarknetJS guides');
    }
  }

  private async processDirectory(
    dir: string,
    baseDir: string,
    pages: BookPageDto[],
  ): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip configured directories
        if (StarknetJSIngester.SKIPPED_DIRECTORIES.includes(entry.name)) {
          logger.debug(`Skipping directory: ${entry.name}`);
          continue;
        }
        // Recursively process subdirectories
        await this.processDirectory(fullPath, baseDir, pages);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        // Read the markdown file
        const content = await fs.readFile(fullPath, 'utf-8');

        // Create relative path without extension for the name
        const relativePath = path.relative(baseDir, fullPath);
        const name = relativePath.replace(/\.md$/, '');

        pages.push({
          name,
          content,
        });

        logger.debug(`Processed file: ${name}`);
      }
    }
  }

  protected parsePage(
    content: string,
    split: boolean = false,
  ): ParsedSection[] {
    // Strip frontmatter before parsing
    const strippedContent = this.stripFrontmatter(content);
    return super.parsePage(strippedContent, split);
  }

  public stripFrontmatter(content: string): string {
    // Remove YAML frontmatter if present (delimited by --- at start and end)
    const frontmatterRegex = /^---\n[\s\S]*?\n---\n?/;
    return content.replace(frontmatterRegex, '').trimStart();
  }

  /**
   * Create chunks from a single page with a proper source link to GitHub
   * This overrides the default to attach a meaningful URL for UI display.
   */
  protected createChunkFromPage(
    page_name: string,
    page_content: string,
  ): Document<BookChunk>[] {
    const baseUrl =
      'https://github.com/starknet-io/starknet.js/blob/main/www/docs/guides';
    const pageUrl = `${baseUrl}/${page_name}.md`;

    const localChunks: Document<BookChunk>[] = [];
    const sanitizedContent = this.sanitizeCodeBlocks(
      this.stripFrontmatter(page_content),
    );

    const sections = this.parsePage(sanitizedContent, true);

    sections.forEach((section: ParsedSection, index: number) => {
      // Reuse hashing and metadata shape from parent implementation by constructing Document directly
      // Importantly, attach a stable page-level sourceLink for the UI
      const content = section.content;
      const title = section.title;
      const uniqueId = `${page_name}-${index}`;

      // Lightweight hash to keep parity with other ingesters without duplicating util impl
      const contentHash = calculateHash(content);

      localChunks.push(
        new Document<BookChunk>({
          pageContent: content,
          metadata: {
            name: page_name,
            title,
            chunkNumber: index,
            contentHash,
            uniqueId,
            sourceLink: pageUrl,
            source: this.source,
          },
        }),
      );
    });

    return localChunks;
  }
}
