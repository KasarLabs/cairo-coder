import { DocumentSource } from '../types';
import type { BookConfig, BookPageDto } from '../utils/types';
import { logger } from '../utils/logger';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec as execCallback } from 'child_process';
import { MarkdownIngester } from './MarkdownIngester';
import { processDocFiles } from '../utils/fileUtils';

/**
 * Ingester for Dojo documentation
 *
 * This ingester downloads the Dojo Book repository and processes all markdown
 * documentation files from the docs directory.
 */
export class DojoDocsIngester extends MarkdownIngester {
  private static readonly BASE_URL = 'https://book.dojoengine.org';

  constructor() {
    const config: BookConfig = {
      repoName: 'book',
      repoOwner: 'dojoengine',
      fileExtension: '.md',
      chunkSize: 4096,
      chunkOverlap: 512,
      baseUrl: DojoDocsIngester.BASE_URL,
      urlSuffix: '',
      useUrlMapping: true,
    };
    super(config, DocumentSource.DOJO_DOCS);
  }

  /**
   * Get the directory path for extracting files
   *
   * @returns string - Path to the extract directory
   */
  protected getExtractDir(): string {
    const { getTempDir } = require('../utils/paths');
    return getTempDir('dojo-docs');
  }

  /**
   * Download and extract the Dojo Book repository
   *
   * @returns Promise<BookPageDto[]> - Array of book pages
   */
  protected override async downloadAndExtractDocs(): Promise<BookPageDto[]> {
    const extractDir = this.getExtractDir();
    const repoUrl = `https://github.com/${this.config.repoOwner}/${this.config.repoName}.git`;

    logger.info(`Cloning Dojo Book repository from ${repoUrl}`);

    // Clone the repository
    const exec = promisify(execCallback);
    try {
      await fs.rm(extractDir, { recursive: true, force: true });
      await exec(`git clone ${repoUrl} ${extractDir}`);
    } catch (error) {
      logger.error('Error cloning Dojo repository:', error);
      throw new Error('Failed to clone Dojo repository');
    }

    logger.info('Dojo repository cloned successfully.');

    // Process all markdown files from the docs directory
    const docsDir = path.join(extractDir, 'docs');

    logger.info(`Processing documentation files in ${docsDir}`);
    const pages = await processDocFiles(this.config, docsDir);

    logger.info(`Processed ${pages.length} documentation pages from Dojo Book`);

    return pages;
  }
}
