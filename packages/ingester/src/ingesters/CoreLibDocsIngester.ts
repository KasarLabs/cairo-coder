import * as fs from 'fs/promises';
import * as path from 'path';
import { BookConfig } from '../utils/types';
import { MarkdownIngester } from './MarkdownIngester';
import {
  BookChunk,
  DocumentSource,
  ParsedSection,
} from '@cairo-coder/agents/types/index';
import { Document } from '@langchain/core/documents';
import { VectorStore } from '@cairo-coder/agents/db/postgresVectorStore';
import { logger } from '@cairo-coder/agents/utils/index';
import {
  addSectionWithSizeLimit,
  calculateHash,
  createAnchor,
} from '../utils/contentUtils';

/**
 * Ingester for the Cairo Core Library documentation
 *
 * This ingester processes the pre-summarized Cairo Core Library documentation
 * from a local markdown file and creates chunks for the vector store.
 */
export class CoreLibDocsIngester extends MarkdownIngester {
  /**
   * Constructor for the Cairo Core Library ingester
   */
  constructor() {
    // Define the configuration for the Cairo Core Library
    const config: BookConfig = {
      repoOwner: 'starkware-libs',
      repoName: 'cairo-docs',
      fileExtension: '.md',
      chunkSize: 4096,
      chunkOverlap: 512,
    };

    super(config, DocumentSource.CORELIB_DOCS);
  }

  /**
   * Read the pre-summarized core library documentation file
   */
  async readCorelibSummaryFile(): Promise<string> {
    const summaryPath = path.join(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      '..',
      'python',
      'scripts',
      'summarizer',
      'generated',
      'corelib_summary.md',
    );

    logger.info(`Reading core library summary from ${summaryPath}`);
    const text = await fs.readFile(summaryPath, 'utf-8');
    return text;
  }

  /**
   * Chunk the core library summary file by H1 headers
   *
   * This function takes the markdown content and splits it into sections
   * based on H1 headers (# Header). Each section becomes a separate chunk
   * with its content hashed for uniqueness.
   *
   * @param text - The markdown content to chunk
   * @returns Promise<Document<BookChunk>[]> - Array of document chunks, one per H1 section
   */
  async chunkCorelibSummaryFile(text: string): Promise<Document<BookChunk>[]> {
    const content = text;
    const sections: ParsedSection[] = [];

    // Regex to match H1 headers (# Header)
    const headerRegex = /^(#{1})\s+(.+)$/gm;
    const matches = Array.from(content.matchAll(headerRegex));

    let lastSectionEndIndex = 0;

    // Process each H1 header found
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const headerTitle = match[2].trim();
      const headerStartIndex = match.index!;

      // Determine the end of this section (start of next header or end of content)
      const nextHeaderIndex =
        i < matches.length - 1 ? matches[i + 1].index! : content.length;

      // Extract section content from after the header to before the next header
      const sectionContent = content
        .slice(headerStartIndex, nextHeaderIndex)
        .trim();

      logger.debug(`Adding section: ${headerTitle}`);

      addSectionWithSizeLimit(
        sections,
        headerTitle,
        sectionContent,
        20000,
        createAnchor(headerTitle),
      );
    }

    // If no H1 headers found, treat the entire content as one section
    if (sections.length === 0) {
      logger.debug(
        'No H1 headers found, creating single section from entire content',
      );
      addSectionWithSizeLimit(
        sections,
        'Core Library Documentation',
        content,
        20000,
        createAnchor('Core Library Documentation'),
      );
    }

    const localChunks: Document<BookChunk>[] = [];

    // Create a document for each section
    sections.forEach((section: ParsedSection, index: number) => {
      const hash: string = calculateHash(section.content);
      localChunks.push(
        new Document<BookChunk>({
          pageContent: section.content,
          metadata: {
            name: section.title,
            title: section.title,
            chunkNumber: index,
            contentHash: hash,
            uniqueId: `${section.title}-${index}`,
            sourceLink: ``,
            source: this.source,
          },
        }),
      );
    });

    return localChunks;
  }

  /**
   * Core Library specific processing based on the pre-summarized markdown file
   * @param vectorStore
   */
  public async process(vectorStore: VectorStore): Promise<void> {
    try {
      // 1. Read the pre-summarized documentation
      const text = await this.readCorelibSummaryFile();

      // 2. Create chunks from the documentation
      const chunks = await this.chunkCorelibSummaryFile(text);

      logger.info(
        `Created ${chunks.length} chunks from core library documentation`,
      );

      // 3. Update the vector store with the chunks
      await this.updateVectorStore(vectorStore, chunks);

      // 4. Clean up any temporary files (no temp files in this case)
      await this.cleanupDownloadedFiles();
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get the directory path for extracting files
   *
   * @returns string - Path to the extract directory
   */
  protected getExtractDir(): string {
    return path.join(__dirname, '..', '..', 'temp', 'corelib-docs');
  }

  /**
   * Override cleanupDownloadedFiles since we don't download anything
   */
  protected async cleanupDownloadedFiles(): Promise<void> {
    // No cleanup needed as we're reading from a local file
    logger.info('No cleanup needed - using local summary file');
  }
}
