import * as fsPromises from 'fs/promises';
import * as path from 'path';
import { Document } from '@langchain/core/documents';
import { type BookChunk, DocumentSource } from '../types';
import { VectorStore } from '../db/postgresVectorStore';
import { type BookConfig, type BookPageDto } from '../utils/types';
import { logger } from '../utils/logger';
import {
  type AsciiDocIngesterConfig,
  AsciiDocIngester,
} from './AsciiDocIngester';
import { getRepoPath } from '../utils/paths';

const OZ_DOCS_VERSION = '2.x';

/**
 * Ingester for the OpenZeppelin documentation
 *
 * This ingester processes the OpenZeppelin documentation using the AsciiDoc format,
 * with special handling for the cairo-contracts/2.0.0 path structure.
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
      fileExtensions: ['.adoc'],
      chunkSize: 4096,
      chunkOverlap: 512,
      baseUrl: 'https://docs.openzeppelin.com',
      urlSuffix: '',
      useUrlMapping: false,
    };

    const ingesterRoot = getRepoPath('ingesters');

    const asciiDocIngesterConfig: AsciiDocIngesterConfig = {
      bookConfig: config,
      playbookPath: path.join(ingesterRoot, 'asciidoc', 'oz-playbook.yml'),
      outputDir: path.join(ingesterRoot, 'antora-output'),
      restructuredDir: path.join(ingesterRoot, 'oz-docs-restructured'),
      source: DocumentSource.OPENZEPPELIN_DOCS,
    };
    super(asciiDocIngesterConfig);
  }

  /**
   * Custom processDocFiles function for OpenZeppelin docs
   * This preserves the special handling for the cairo-contracts/2.0.0 path
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
          for (const fileExtension of config.fileExtensions) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
              // Recursively process subdirectories
              await processDirectory(fullPath);
            } else if (
              entry.isFile() &&
              path.extname(entry.name).toLowerCase() === fileExtension // TODO: handle multiple extensions
            ) {
              // Process AsciiDoc files
              const content = await fsPromises.readFile(fullPath, 'utf8');

              // Get the relative path of the file from the base directory - which reflects the online website directory structure
              const relativePath = path.relative(directory, fullPath);

              // Inject cairo-contracts/2.0.0 in the fullPath to reflect online website directory structure
              // This is the special handling for OpenZeppelin docs
              const adaptedFullPageName = path
                .join('contracts-cairo', OZ_DOCS_VERSION, relativePath)
                .replace(fileExtension, '');

              pages.push({
                name: adaptedFullPageName,
                content,
              });
            }
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
  protected override async createChunks(
    pages: BookPageDto[],
  ): Promise<Document<BookChunk>[]> {
    return super.createChunks(pages, true);
  }
}
