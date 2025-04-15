import * as path from 'path';
import { BookConfig } from '../utils/types';
import { MarkdownIngester } from './MarkdownIngester';
import { DocumentSource } from '@starknet-agent/agents/types/index';

/**
 * Ingester for the Cairo By Example documentation
 *
 * This ingester downloads the Cairo By Example documentation from GitHub releases,
 * processes the markdown files, and creates chunks for the vector store.
 */
export class CairoByExampleIngester extends MarkdownIngester {
  /**
   * Constructor for the Cairo By Example ingester
   */
  constructor() {
    // Define the configuration for Cairo By Example
    const config: BookConfig = {
      repoOwner: 'enitrat',
      repoName: 'cairo-by-example',
      fileExtension: '.md',
      chunkSize: 4096,
      chunkOverlap: 512,
      baseUrl: 'https://enitrat.github.io/cairo-by-example',
      urlSuffix: '.html',
    };

    super(config, DocumentSource.CAIRO_BY_EXAMPLE);
  }

  /**
   * Get the directory path for extracting files
   *
   * @returns string - Path to the extract directory
   */
  protected getExtractDir(): string {
    return path.join(__dirname, '..', '..', 'temp', 'cairo-by-example');
  }
}
