import * as path from 'path';
import { BookConfig } from '../utils/types';
import { MarkdownIngester } from './MarkdownIngester';
import { DocumentSource } from '@cairo-coder/agents/types/index';

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
      baseUrl: 'https://book.cairo-lang.org',
      urlSuffix: '.html',
    };

    super(config, DocumentSource.CAIRO_BOOK);
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
