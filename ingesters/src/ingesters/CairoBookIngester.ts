import { type BookConfig } from '../utils/types';
import { MarkdownIngester } from './MarkdownIngester';
import { type BookChunk, DocumentSource } from '../types';
import { Document } from '@langchain/core/documents';
import { VectorStore } from '../db/postgresVectorStore';
import { type VectorStoreUpdateOptions } from '../utils/vectorStoreUtils';
import { logger } from '../utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';
import { calculateHash } from '../utils/contentUtils';
import {
  RecursiveMarkdownSplitter,
  type SplitOptions,
} from '../utils/RecursiveMarkdownSplitter';
import { getPythonPath } from '../utils/paths';

/**
 * Ingester for the Cairo Book documentation
 *
 * This ingester downloads the Cairo Book documentation from GitHub releases,
 * processes the markdown files, and creates chunks for the vector store.
 */
export class CairoBookIngester extends MarkdownIngester {
  /**
   * Constructor for the Cairo Book ingester
   */
  constructor() {
    // Define the configuration for the Cairo Book
    const config: BookConfig = {
      repoOwner: 'cairo-book',
      repoName: 'cairo-book',
      fileExtensions: ['.md'],
      chunkSize: 4096,
      chunkOverlap: 512,
      baseUrl: 'https://book.cairo-lang.org',
      urlSuffix: '.html',
      useUrlMapping: true,
    };

    super(config, DocumentSource.CAIRO_BOOK);
  }

  /**
   * Read the pre-summarized core library documentation file
   */
  async readSummaryFile(): Promise<string> {
    const summaryPath = getPythonPath(
      'src',
      'cairo_coder_tools',
      'ingestion',
      'generated',
      'cairo_book_summary.md',
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
  async chunkSummaryFile(text: string): Promise<Document<BookChunk>[]> {
    // Configure the splitter with appropriate settings
    const splitOptions: SplitOptions = {
      maxChars: 2048,
      minChars: 500,
      overlap: 256,
      headerLevels: [1, 2, 3], // Split on H1/H2/H3 (title uses deepest)
      preserveCodeBlocks: true,
      idPrefix: 'cairo-book',
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
          sourceLink: chunk.meta.sourceLink || this.config.baseUrl,
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
  public override async process(
    vectorStore: VectorStore,
    options?: VectorStoreUpdateOptions,
  ): Promise<void> {
    try {
      // 1. Read the pre-summarized documentation
      const text = await this.readSummaryFile();

      // 2. Create chunks from the documentation
      const chunks = await this.chunkSummaryFile(text);

      logger.info(
        `Created ${chunks.length} chunks from Cairo Book documentation`,
      );

      // 3. Update the vector store with the chunks
      await this.updateVectorStore(vectorStore, chunks, options);

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
    const { getTempDir } = require('../utils/paths');
    return getTempDir('corelib-docs');
  }

  /**
   * Override cleanupDownloadedFiles since we don't download anything
   */
  protected override async cleanupDownloadedFiles(): Promise<void> {
    // No cleanup needed as we're reading from a local file
    logger.info('No cleanup needed - using local summary file');
  }
}
