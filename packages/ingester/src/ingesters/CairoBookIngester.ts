import * as path from 'path';
import { BookConfig, BookPageDto } from '../utils/types';
import { MarkdownIngester } from './MarkdownIngester';
import { BookChunk, DocumentSource } from '@cairo-coder/agents/types/index';
import { Document } from '@langchain/core/documents';
import { VectorStore } from '@cairo-coder/agents/db/postgresVectorStore';

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
      fileExtension: '.md',
      chunkSize: 4096,
      chunkOverlap: 512,
    };

    super(config, DocumentSource.CAIRO_BOOK);
  }

  async downloadLLMSFullFile(): Promise<string> {
    const url = 'https://book.cairo-lang.org/llms-full.txt';
    const response = await fetch(url);
    const text = await response.text();
    return text;
  }

  async chunkLLMSFullFile(text: string): Promise<Document<BookChunk>[]> {
    return super.createChunkFromPage('cairo-book', text);
  }

  /**
   * Cairo-Book specific processing based on the LLMS full file - which is a sanitized version of
   * the book for LLMs consumption, reducing the amount of noise in the corpus.
   * @param vectorStore
   */
  public async process(vectorStore: VectorStore): Promise<void> {
    try {
      // 1. Download and extract documentation
      const text = await this.downloadLLMSFullFile();

      // 2. Create chunks from the documentation
      const chunks = await this.chunkLLMSFullFile(text);

      // 3. Update the vector store with the chunks
      await this.updateVectorStore(vectorStore, chunks);

      // 4. Clean up any temporary files
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
    return path.join(__dirname, '..', '..', 'temp', 'cairo-book');
  }
}
