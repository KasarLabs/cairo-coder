import * as path from 'path';
import { DocumentSource } from '@cairo-coder/agents/types/index';
import { BookConfig, BookPageDto } from '../utils/types';
import { processDocFiles } from '../utils/fileUtils';
import { logger } from '@cairo-coder/agents/utils/index';
import { exec as execCallback } from 'child_process';
import { promisify } from 'util';
import { MarkdownIngester } from './MarkdownIngester';

/**
 * Ingester for the Scarb documentation
 *
 * This ingester downloads the Scarb documentation from the GitHub repository,
 * processes the markdown files from the website/docs directory, and creates chunks for the vector store.
 */
export class ScarbDocsIngester extends MarkdownIngester {
  /**
   * Constructor for the Scarb docs ingester
   */
  constructor() {
    // Define the configuration for the Scarb documentation
    const config: BookConfig = {
      repoOwner: 'software-mansion',
      repoName: 'scarb',
      fileExtension: '.md',
      chunkSize: 4096,
      chunkOverlap: 512,
    };

    super(config, DocumentSource.SCARB_DOCS);
  }

  /**
   * Get the directory path for extracting files
   *
   * @returns string - Path to the extract directory
   */
  protected getExtractDir(): string {
    return path.join(__dirname, '..', '..', 'temp', 'scarb-docs');
  }

  /**
   * Download and extract the repository
   *
   * @returns Promise<BookPageDto[]> - Array of book pages
   */
  protected async downloadAndExtractDocs(): Promise<BookPageDto[]> {
    const extractDir = this.getExtractDir();
    const repoUrl = `https://github.com/${this.config.repoOwner}/${this.config.repoName}.git`;

    logger.info(`Cloning repository from ${repoUrl}`);

    // Clone the repository
    const exec = promisify(execCallback);
    try {
      await exec(`git clone ${repoUrl} ${extractDir}`);
    } catch (error) {
      logger.error('Error cloning repository:', error);
      throw new Error('Failed to clone repository');
    }

    logger.info('Repository cloned successfully.');

    // Process the markdown files from website/docs directory
    const docsDir = path.join(extractDir, 'website', 'docs');
    const pages = await processDocFiles(this.config, docsDir);

    logger.info(`Processed ${pages.length} documentation pages from Scarb`);

    return pages;
  }
}
