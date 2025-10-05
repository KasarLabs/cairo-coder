import { Document } from '@langchain/core/documents';
import { VectorStore } from './db/postgresVectorStore';
import { DocumentSource, type BookChunk } from './types';
import {
  type BookConfig,
  type BookPageDto,
  type ParsedSection,
} from './utils/types';
import {
  updateVectorStore as updateVectorStoreUtil,
  type VectorStoreUpdateOptions,
} from './utils/vectorStoreUtils';
import { logger } from './utils/logger';

/**
 * Abstract base class for all document ingesters
 *
 * This class defines the common interface that all specific ingesters should implement.
 * It provides a template method pattern for the ingestion process, with specific steps
 * that can be customized by subclasses.
 */
export abstract class BaseIngester {
  protected config: BookConfig;
  protected source: DocumentSource;

  /**
   * Constructor for the base ingester
   *
   * @param config - Configuration for the ingester
   * @param source - The document source identifier
   */
  constructor(config: BookConfig, source: DocumentSource) {
    this.config = config;
    this.source = source;
  }

  /**
   * Main ingestion method - template method that defines the ingestion process
   *
   * @param vectorStore - The vector store to add documents to
   */
  public async process(
    vectorStore: VectorStore,
    options?: VectorStoreUpdateOptions,
  ): Promise<void> {
    try {
      // 1. Download and extract documentation
      const pages = await this.downloadAndExtractDocs();

      // 2. Create chunks from the documentation
      const chunks = await this.createChunks(pages);

      // 3. Update the vector store with the chunks
      await this.updateVectorStore(vectorStore, chunks, options);

      // 4. Clean up any temporary files
      await this.cleanupDownloadedFiles();
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Download and extract documentation from the source
   * This method should be implemented by each specific ingester
   */
  protected abstract downloadAndExtractDocs(): Promise<BookPageDto[]>;

  /**
   * Create chunks from the documentation pages
   * This method can be overridden by specific ingesters if needed
   */
  protected abstract createChunks(
    pages: BookPageDto[],
    splitSections?: boolean,
  ): Promise<Document<BookChunk>[]>;

  /**
   * Update the vector store with the chunks
   * This method can be overridden by specific ingesters if needed
   */
  protected async updateVectorStore(
    vectorStore: VectorStore,
    chunks: Document<BookChunk>[],
    options?: VectorStoreUpdateOptions,
  ): Promise<void> {
    // Default implementation uses the shared updateVectorStore function
    await updateVectorStoreUtil(vectorStore, chunks, this.source, options);
  }

  /**
   * Clean up any temporary files created during the ingestion process
   * This method can be overridden by specific ingesters if needed
   */
  protected abstract cleanupDownloadedFiles(): Promise<void>;

  /**
   * Handle errors that occur during the ingestion process
   * This method can be overridden by specific ingesters if needed
   */
  protected handleError(error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error in ${this.source} ingestion: ${errorMessage}`);
    if (error instanceof Error && error.stack) {
      logger.error('Stack trace:', error.stack);
    }
    throw error;
  }

  /**
   * Parse a page into sections
   * This method can be overridden by specific ingesters if needed
   */
  protected abstract parsePage(
    content: string,
    split: boolean,
  ): ParsedSection[];
}
