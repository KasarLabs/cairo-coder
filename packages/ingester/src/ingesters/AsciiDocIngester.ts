import * as fs from 'fs/promises';
import * as path from 'path';
import downdoc from 'downdoc';
import { Document } from '@langchain/core/documents';
import { BookChunk, DocumentSource } from '@cairo-coder/agents/types/index';
import { VectorStore } from '@cairo-coder/agents/db/postgresVectorStore';
import { BaseIngester } from '../BaseIngester';
import {
  BookConfig,
  BookPageDto,
  ParsedSection,
  MAX_SECTION_SIZE,
} from '../utils/types';
import {
  addSectionWithSizeLimit,
  calculateHash,
  createAnchor,
} from '../utils/contentUtils';
import { processDocFiles } from '../utils/fileUtils';
import { logger } from '@cairo-coder/agents/utils/index';
import { execSync } from 'child_process';
import * as fsSync from 'fs';

/**
 * Common interface for AsciiDoc ingester configuration
 */
export interface AsciiDocIngesterConfig {
  bookConfig: BookConfig;
  playbookPath: string;
  outputDir: string;
  restructuredDir: string;
  source: DocumentSource;
}

/**
 * Ingester for AsciiDoc-based documentation
 *
 * This ingester handles documentation in AsciiDoc format, using Antora for building
 * and processing the documentation.
 */
export abstract class AsciiDocIngester extends BaseIngester {
  private playbookPath: string;
  private outputDir: string;
  private restructuredDir: string;

  /**
   * Constructor for the AsciiDoc ingester
   *
   * @param config - AsciiDoc ingester configuration
   */
  constructor(config: AsciiDocIngesterConfig) {
    super(config.bookConfig, config.source);

    this.playbookPath = config.playbookPath;
    this.outputDir = config.outputDir;
    this.restructuredDir = config.restructuredDir;
  }

  /**
   * Build and extract documentation using Antora
   *
   * @returns Promise<BookPageDto[]> - Array of book pages
   */
  protected async downloadAndExtractDocs(): Promise<BookPageDto[]> {
    logger.info(`Building and extracting ${this.source} Docs`);

    // Run Antora to generate the documentation
    logger.info('Running Antora to build documentation');
    const antoraCommand = `antora ${this.playbookPath} --fetch`;

    // Find the package root by looking for package.json
    let packageRoot = __dirname;
    while (
      !fsSync.existsSync(path.join(packageRoot, 'package.json')) &&
      packageRoot !== '/'
    ) {
      packageRoot = path.dirname(packageRoot);
    }

    if (packageRoot === '/') {
      throw new Error('Could not find package.json in any parent directory');
    }

    try {
      execSync(antoraCommand, {
        cwd: packageRoot,
        stdio: 'inherit',
      });
      logger.info('Antora documentation generation completed successfully');
    } catch (error) {
      logger.error(
        'Error running Antora, but continuing with ingestion:',
        error,
      );
      // Create empty antora-output directory if it doesn't exist
      await fs.mkdir(this.outputDir, { recursive: true }).catch(() => {});
    } finally {
      await fs
        .rm(path.join(packageRoot, 'asciidoc', 'build'), {
          recursive: true,
          force: true,
        })
        .catch(() => {});
    }

    // Check if the output directory has any content
    try {
      const files = await fs.readdir(this.outputDir);
      if (files.length === 0) {
        logger.warn(
          'No files found in Antora output directory. Returning empty pages array.',
        );
        return [];
      }
    } catch (error) {
      logger.warn(
        'Could not read Antora output directory. Returning empty pages array.',
      );
      return [];
    }

    await this.restructureDocumentation(this.outputDir, this.restructuredDir);

    // Use custom processDocFiles function if provided, otherwise use the default
    if (this.processDocFilesCustom) {
      return await this.processDocFilesCustom(
        this.config,
        this.restructuredDir,
      );
    }

    return await processDocFiles(this.config, this.restructuredDir);
  }

  protected abstract processDocFilesCustom(
    config: BookConfig,
    directory: string,
  ): Promise<BookPageDto[]>;

  /**
   * Restructure the documentation files
   *
   * @param extractDir - Directory containing extracted files
   * @param targetDir - Target directory for restructured files
   * @returns Promise<string> - Path to the restructured directory
   */
  private async restructureDocumentation(
    extractDir: string,
    targetDir: string,
  ): Promise<string> {
    await fs.rm(targetDir, { recursive: true, force: true }).catch(() => {});
    await fs.mkdir(targetDir, { recursive: true });

    const hasRelevantFiles = await this.restructureFiles(extractDir, targetDir);

    if (!hasRelevantFiles) {
      // If no relevant files were found, remove the created target directory
      logger.info(
        `No relevant files found in ${extractDir}, removing target directory ${targetDir}`,
      );
      await fs.rmdir(targetDir, { recursive: true });
    }

    return targetDir;
  }

  /**
   * Restructure files from source to target directory
   *
   * @param sourceDir - Source directory
   * @param targetDir - Target directory
   * @param fileExtension - File extension to process
   * @returns Promise<boolean> - Whether relevant files were found
   */
  private async restructureFiles(
    sourceDir: string,
    targetDir: string,
    fileExtension: string = '.adoc',
  ): Promise<boolean> {
    const entries = await fs.readdir(sourceDir, { withFileTypes: true });
    let hasRelevantFiles = false;

    for (const entry of entries) {
      const sourcePath = path.join(sourceDir, entry.name);
      let targetPath = path.join(
        targetDir,
        entry.name.toLowerCase().replace(/_/g, '-'),
      );

      if (entry.isDirectory()) {
        if (entry.name === 'pages') {
          // If the directory is named 'pages', copy its contents directly to the parent
          const subDirHasRelevantFiles = await this.restructureFiles(
            sourcePath,
            targetDir,
            fileExtension,
          );
          if (subDirHasRelevantFiles) {
            hasRelevantFiles = true;
          }
        } else {
          const subDirHasRelevantFiles = await this.restructureFiles(
            sourcePath,
            targetPath,
            fileExtension,
          );
          if (subDirHasRelevantFiles) {
            hasRelevantFiles = true;
          }
        }
      } else if (entry.isFile() && path.extname(entry.name) === fileExtension) {
        if (entry.name.toLowerCase() === 'nav.adoc') {
          continue;
        }
        await fs.mkdir(path.dirname(targetPath), { recursive: true });
        await fs.copyFile(sourcePath, targetPath);
        hasRelevantFiles = true;
      }
    }

    return hasRelevantFiles;
  }

  /**
   * Create chunks from book pages
   *
   * @param pages - Array of book pages
   * @param splitSections - Whether to split the page into sections
   * @returns Promise<Document<BookChunk>[]> - Array of document chunks
   */
  protected async createChunks(
    pages: BookPageDto[],
    splitSections: boolean = false,
  ): Promise<Document<BookChunk>[]> {
    logger.info(
      `Creating chunks from ${this.source} pages based on AsciiDoc sections`,
    );
    const chunks: Document<BookChunk>[] = [];

    for (const page of pages) {
      // Parse the page into sections
      const sections = this.parsePage(page.content, splitSections);

      // Create a document for each section
      sections.forEach((section: ParsedSection, index: number) => {
        const hash: string = calculateHash(section.content);
        chunks.push(
          new Document<BookChunk>({
            pageContent: section.content,
            metadata: {
              name: page.name,
              title: section.title,
              chunkNumber: index,
              contentHash: hash,
              uniqueId: `${page.name}-${index}`,
              sourceLink: `${this.config.baseUrl}/${page.name}${this.config.urlSuffix}${
                section.anchor ? '#' + section.anchor : ''
              }`,
              source: this.source,
            },
          }),
        );
      });
    }

    return chunks;
  }

  /**
   * Clean up downloaded files
   */
  protected async cleanupDownloadedFiles(): Promise<void> {
    await fs
      .rm(this.outputDir, { recursive: true, force: true })
      .catch(() => {});
    await fs
      .rm(this.restructuredDir, { recursive: true, force: true })
      .catch(() => {});
    logger.info(
      `Deleted downloaded files from ${this.outputDir} and ${this.restructuredDir}`,
    );
  }

  /**
   * Parse a page into sections
   *
   * @param content - The content to parse
   * @param split - Whether to split the content into sections
   * @returns ParsedSection[] - Array of parsed sections
   */
  protected parsePage(
    content: string,
    split: boolean = false,
  ): ParsedSection[] {
    return this.splitAsciiDocIntoSections(content, split);
  }

  /**
   * Split AsciiDoc content into sections
   *
   * @param content - The content to split
   * @param split - Whether to split the content
   * @returns ParsedSection[] - Array of parsed sections
   */
  //TODO: check whether we can improve this by avoiding sub-subsections (H3)
  private splitAsciiDocIntoSections(
    content: string,
    split: boolean = false,
  ): ParsedSection[] {
    // Trim and convert code blocks regardless of mode
    content = content.trim();
    content = this.convertCodeBlocks(content);

    if (!split) {
      // Single section mode - treat entire content as one section
      const headerRegex = /^(?:\[#([^\]]+)\]\s*\n)?(=+)\s+(.+)$/m;
      const match = headerRegex.exec(content);
      const sections: ParsedSection[] = [];

      if (match) {
        const title = match[3];
        const anchor = match[1]; // Use custom anchor if present
        const markdownContent = downdoc(content);
        if (markdownContent) {
          addSectionWithSizeLimit(
            sections,
            title,
            markdownContent,
            MAX_SECTION_SIZE,
            anchor || createAnchor(title),
          );
        }
      }
      return sections;
    }

    // Split mode - divide content into multiple sections
    const headerRegex = /^(?:\[#([^\]]+)\]\s*\n)?(=+)\s+(.+)$/gm;
    const sections: ParsedSection[] = [];
    let lastIndex = 0;
    let lastTitle = '';
    let lastAnchor: string | undefined;
    let match;

    // Trim the content to remove leading/trailing whitespace
    content = content.trim();

    // Convert AsciiDoc code blocks to Markdown code blocks
    content = this.convertCodeBlocks(content);

    while ((match = headerRegex.exec(content)) !== null) {
      if (!this.isInsideCodeBlock(content, match.index)) {
        if (lastIndex < match.index) {
          const sectionContent = content.slice(lastIndex, match.index).trim();
          const markdownContent = downdoc(sectionContent);
          if (markdownContent) {
            addSectionWithSizeLimit(
              sections,
              lastTitle,
              markdownContent,
              MAX_SECTION_SIZE,
              lastAnchor,
            );
          }
        }
        lastAnchor = match[1]; // Capture the custom anchor if present
        lastTitle = match[3];
        lastIndex = match.index + match[0].length;
      }
    }

    // Add the last section
    if (lastIndex < content.length) {
      const sectionContent = content.slice(lastIndex).trim();
      if (sectionContent) {
        const markdownContent = downdoc(sectionContent);
        if (markdownContent) {
          addSectionWithSizeLimit(
            sections,
            lastTitle,
            markdownContent,
            MAX_SECTION_SIZE,
            lastAnchor,
          );
        }
      }
    }

    return sections;
  }

  /**
   * Convert AsciiDoc code blocks to Markdown code blocks
   *
   * @param content - The content to convert
   * @returns string - The converted content
   */
  private convertCodeBlocks(content: string): string {
    // Case 1: With language specification
    const languageCodeBlockRegex =
      /^\[source,(\w+)\]\s*^----$([\s\S]*?)^----$/gm;
    content = content.replace(
      languageCodeBlockRegex,
      (match, language, codeContent) => {
        return this.convertCodeBlock(codeContent, language);
      },
    );

    // Case 2: No language specification
    const simpleCodeBlockRegex = /^----$([\s\S]*?)^----$/gm;
    content = content.replace(simpleCodeBlockRegex, (match, codeContent) => {
      return this.convertCodeBlock(codeContent);
    });

    return content;
  }

  /**
   * Convert a single code block
   */
  private convertCodeBlock(codeContent: string, language: string = ''): string {
    // Remove only the leading and trailing newline characters
    codeContent = codeContent.replace(/^\n|\n$/g, '');

    return '```' + language + '\n' + codeContent + '\n```';
  }

  /**
   * Check if a position is inside a code block
   *
   * @param content - The content to check
   * @param position - The position to check
   * @returns boolean - Whether the position is inside a code block
   */
  private isInsideCodeBlock(content: string, index: number): boolean {
    const codeBlockRegex = /^(----|\`\`\`)$/gm;
    let isInside = false;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index >= index) {
        break;
      }
      isInside = !isInside;
    }

    return isInside;
  }
}
