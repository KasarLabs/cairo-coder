import * as fs from 'fs/promises';
import * as path from 'path';
import { BookConfig } from '../utils/types';
import { MarkdownIngester } from './MarkdownIngester';
import { BookChunk, DocumentSource } from '../types';
import { Document } from '@langchain/core/documents';
import { VectorStore } from '../db/postgresVectorStore';
import { logger } from '../utils/logger';
import { calculateHash } from '../utils/contentUtils';
import {
  RecursiveMarkdownSplitter,
  SplitOptions,
} from '../utils/RecursiveMarkdownSplitter';

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
      repoOwner: 'enitrat',
      repoName: 'cairo-docs',
      fileExtension: '.md',
      chunkSize: 4096,
      chunkOverlap: 512,
      baseUrl: 'https://docs.starknet.io/build/corelib/intro',
      urlSuffix: '',
      useUrlMapping: false,
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
      'src',
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
   * Chunk the core library summary file using RecursiveMarkdownSplitter
   *
   * This function takes the markdown content and splits it using a recursive
   * strategy that respects headers, code blocks, and maintains overlap between chunks.
   *
   * @param text - The markdown content to chunk
   * @returns Promise<Document<BookChunk>[]> - Array of document chunks
   */
  async chunkCorelibSummaryFile(text: string): Promise<Document<BookChunk>[]> {
    logger.info(
      'Using RecursiveMarkdownSplitter to chunk Core Library documentation',
    );

    // Configure the splitter with appropriate settings
    const splitOptions: SplitOptions = {
      maxChars: 2048,
      minChars: 500,
      overlap: 256,
      headerLevels: [1, 2], // Split on H1 and H2 headers
      preserveCodeBlocks: true,
      idPrefix: 'corelib',
      trim: true,
    };

    // Create the splitter and split the content
    const splitter = new RecursiveMarkdownSplitter(splitOptions);
    const chunks = splitter.splitMarkdownToChunks(text);

    logger.info(
      `Created ${chunks.length} chunks using RecursiveMarkdownSplitter`,
    );

    // Convert chunks to Document<BookChunk> format
    const localChunks: Document<BookChunk>[] = chunks.map((chunk) => {
      const contentHash = calculateHash(chunk.content);

      return new Document<BookChunk>({
        pageContent: chunk.content,
        metadata: {
          name: chunk.meta.title,
          title: chunk.meta.title,
          chunkNumber: chunk.meta.chunkNumber, // Already 0-based
          contentHash: contentHash,
          uniqueId: chunk.meta.uniqueId,
          sourceLink: this.config.baseUrl,
          source: this.source,
        },
      });
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
