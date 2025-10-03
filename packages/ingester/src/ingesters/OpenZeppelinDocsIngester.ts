import * as fs from 'fs/promises';
import * as path from 'path';
import { Document } from '@langchain/core/documents';
import { BookChunk, DocumentSource } from '@cairo-coder/agents/types/index';
import { BookConfig } from '../utils/types';
import { logger } from '@cairo-coder/agents/utils/index';
import { MarkdownIngester } from './MarkdownIngester';
import { VectorStore } from '@cairo-coder/agents/db/postgresVectorStore';
import { calculateHash } from '../utils/contentUtils';
import {
  RecursiveMarkdownSplitter,
  SplitOptions,
} from '../utils/RecursiveMarkdownSplitter';

/**
 * Ingester for the OpenZeppelin documentation
 *
 * This ingester processes the pre-crawled OpenZeppelin documentation
 * from a local markdown file and creates chunks for the vector store.
 */
export class OpenZeppelinDocsIngester extends MarkdownIngester {
  /**
   * Constructor for the OpenZeppelin Docs ingester
   */
  constructor() {
    // Define the configuration for OpenZeppelin Docs
    const config: BookConfig = {
      repoOwner: 'OpenZeppelin',
      repoName: 'cairo-contracts',
      fileExtension: '.md',
      chunkSize: 4096,
      chunkOverlap: 512,
      baseUrl: 'https://docs.openzeppelin.com/contracts-cairo',
      urlSuffix: '',
      useUrlMapping: false,
    };

    super(config, DocumentSource.OPENZEPPELIN_DOCS);
  }

  /**
   * Read the pre-crawled OpenZeppelin documentation file
   */
  async readSummaryFile(): Promise<string> {
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
      'openzeppelin_docs_summary.md',
    );

    logger.info(`Reading OpenZeppelin documentation from ${summaryPath}`);
    const text = await fs.readFile(summaryPath, 'utf-8');
    return text;
  }

  /**
   * Chunk the OpenZeppelin summary file using RecursiveMarkdownSplitter
   *
   * This function takes the markdown content and splits it using a recursive
   * strategy that respects headers, code blocks, and maintains overlap between chunks.
   *
   * @param text - The markdown content to chunk
   * @returns Promise<Document<BookChunk>[]> - Array of document chunks
   */
  async chunkSummaryFile(text: string): Promise<Document<BookChunk>[]> {
    logger.info(
      'Using RecursiveMarkdownSplitter to chunk OpenZeppelin documentation',
    );

    // Configure the splitter with appropriate settings
    const splitOptions: SplitOptions = {
      maxChars: 2048,
      minChars: 500,
      overlap: 256,
      headerLevels: [1, 2], // Split on H1 and H2 headers
      preserveCodeBlocks: true,
      idPrefix: 'openzeppelin-docs',
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
   * OpenZeppelin specific processing based on the pre-crawled markdown file
   * @param vectorStore
   */
  public async process(vectorStore: VectorStore): Promise<void> {
    try {
      // 1. Read the pre-crawled documentation
      const text = await this.readSummaryFile();

      // 2. Create chunks from the documentation
      const chunks = await this.chunkSummaryFile(text);

      logger.info(
        `Created ${chunks.length} chunks from OpenZeppelin documentation`,
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
    return path.join(__dirname, '..', '..', 'temp', 'openzeppelin-docs');
  }

  /**
   * Override cleanupDownloadedFiles since we don't download anything
   */
  protected async cleanupDownloadedFiles(): Promise<void> {
    // No cleanup needed as we're reading from a local file
    logger.info('No cleanup needed - using local summary file');
  }
}
