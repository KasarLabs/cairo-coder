import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import { Document } from '@langchain/core/documents';
import {
  BookChunk,
  DocumentSource,
  VectorStore,
} from '@starknet-agent/agents/index';
import { BookConfig, BookPageDto } from '../utils/types';
import logger from '@starknet-agent/agents/utils/logger';
import { AsciiDocIngesterConfig } from './AsciiDocIngester';
import { AsciiDocIngester } from './AsciiDocIngester';

/**
 * Ingester for the OpenZeppelin documentation
 *
 * This ingester processes the OpenZeppelin documentation using the AsciiDoc format,
 * with special handling for the cairo-contracts/1.0.0 path structure.
 */
export class OpenZeppelinDocsIngester extends AsciiDocIngester {
  /**
   * Constructor for the OpenZeppelin Docs ingester
   */
  constructor() {
    // Define the configuration for OpenZeppelin Docs
    const config: BookConfig = {
      repoOwner: 'OpenZeppelin',
      repoName: 'cairo-contracts',
      fileExtension: '.adoc',
      chunkSize: 4096,
      chunkOverlap: 512,
      baseUrl: 'https://docs.openzeppelin.com',
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
      playbookPath: path.join(packageRoot, 'asciidoc', 'oz-playbook.yml'),
      outputDir: path.join(packageRoot, 'antora-output'),
      restructuredDir: path.join(packageRoot, 'oz-docs-restructured'),
      source: DocumentSource.OPENZEPPELIN_DOCS,
    };
    super(asciiDocIngesterConfig);
  }

  /**
   * Custom processDocFiles function for OpenZeppelin docs
   * This preserves the special handling for the cairo-contracts/1.0.0 path
   *
   * @param config - Book configuration
   * @param directory - Directory to process
   * @returns Promise<BookPageDto[]> - Array of book pages
   */
  protected async processDocFilesCustom(
    config: BookConfig,
    directory: string,
  ): Promise<BookPageDto[]> {
    try {
      logger.info(`Processing OpenZeppelin doc files in ${directory}`);
      const pages: BookPageDto[] = [];

      async function processDirectory(dir: string) {
        const entries = await fsPromises.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            // Recursively process subdirectories
            await processDirectory(fullPath);
          } else if (
            entry.isFile() &&
            path.extname(entry.name).toLowerCase() === config.fileExtension
          ) {
            // Process AsciiDoc files
            const content = await fsPromises.readFile(fullPath, 'utf8');

            // Get the relative path of the file from the base directory - which reflects the online website directory structure
            const relativePath = path.relative(directory, fullPath);

            // Inject cairo-contracts/1.0.0 in the fullPath to reflect online website directory structure
            // This is the special handling for OpenZeppelin docs
            const adaptedFullPageName = path.join(
              'contracts-cairo',
              '1.0.0',
              relativePath,
            );

            pages.push({
              name: path
                .relative(directory, adaptedFullPageName)
                .replace(config.fileExtension, ''),
              content,
            });
          }
        }
      }

      await processDirectory(directory);
      return pages;
    } catch (err) {
      console.error('Error processing directory:', (err as Error).message);
      throw new Error(`Failed to process directory: ${(err as Error).message}`);
    }
  }

  /**
   * createChunks function for OpenZeppelin docs
   * Pages are not split into sections because this gives bad results otherwise.
   *
   * @param pages - Array of book pages
   * @returns Promise<Document<BookChunk>[]> - Array of document chunks
   */
  protected async createChunks(
    pages: BookPageDto[],
  ): Promise<Document<BookChunk>[]> {
    return super.createChunks(pages, false);
  }
}
