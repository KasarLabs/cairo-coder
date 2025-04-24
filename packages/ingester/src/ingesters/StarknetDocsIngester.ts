import * as path from 'path';
import { Document } from '@langchain/core/documents';
import { BookConfig, BookPageDto, ParsedSection } from '../utils/types';
import { AsciiDocIngester, AsciiDocIngesterConfig } from './AsciiDocIngester';
import { processDocFiles } from '../utils/fileUtils';
import * as fs from 'fs';
import { BookChunk, DocumentSource } from '@cairo-coder/agents/types/index';

/**
 * Ingester for the Starknet documentation
 *
 * This ingester uses Antora to build the Starknet documentation from AsciiDoc sources,
 * processes the generated HTML files, and creates chunks for the vector store.
 */
export class StarknetDocsIngester extends AsciiDocIngester {
  /**
   * Constructor for the Starknet Docs ingester
   */
  constructor() {
    // Define the configuration for the Starknet Docs
    const config: BookConfig = {
      repoOwner: 'starknet-io',
      repoName: 'starknet-docs',
      fileExtension: '.adoc',
      chunkSize: 4096,
      chunkOverlap: 512,
      baseUrl: 'https://docs.starknet.io',
      urlSuffix: '',
    };

    // Find the package root by looking for package.json
    let packageRoot = __dirname;
    while (
      !fs.existsSync(path.join(packageRoot, 'package.json')) &&
      packageRoot !== '/'
    ) {
      packageRoot = path.dirname(packageRoot);
    }

    if (packageRoot === '/') {
      throw new Error('Could not find package.json in any parent directory');
    }

    const asciiDocIngesterConfig: AsciiDocIngesterConfig = {
      bookConfig: config,
      playbookPath: path.join(packageRoot, 'asciidoc', 'playbook.yml'),
      outputDir: path.join(packageRoot, 'antora-output'),
      restructuredDir: path.join(packageRoot, 'starknet-docs-restructured'),
      source: DocumentSource.STARKNET_DOCS,
    };

    super(asciiDocIngesterConfig);
  }

  protected async processDocFilesCustom(
    config: BookConfig,
    directory: string,
  ): Promise<BookPageDto[]> {
    return await processDocFiles(config, directory);
  }

  /**
   * createChunks function for Starknet docs
   * Pages are split into sections because for better results.
   *
   * @param pages - Array of book pages
   * @returns Promise<Document<BookChunk>[]> - Array of document chunks
   */
  protected async createChunks(
    pages: BookPageDto[],
  ): Promise<Document<BookChunk>[]> {
    return super.createChunks(pages, true);
  }
}
