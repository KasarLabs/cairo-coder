import { DocumentSource } from '../types';
import type { BookConfig, BookPageDto } from '../utils/types';
import { logger } from '../utils/logger';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec as execCallback } from 'child_process';
import { MarkdownIngester } from './MarkdownIngester';
import { processDocFiles } from '../utils/fileUtils';

export class DojoDocsIngester extends MarkdownIngester {
  constructor() {
    const config: BookConfig = {
      repoName: 'book',
      repoOwner: 'dojoengine',
      fileExtension: '.md',
      chunkSize: 4096,
      chunkOverlap: 512,
      baseUrl: 'https://dojoengine.org/sdk/javascript',
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
    return getTempDir('dojo-js-docs');
  }

  /**
   * Download and extract the repository
   *
   * @returns Promise<BookPageDto[]> - Array of book pages
   */
  protected override async downloadAndExtractDocs(): Promise<BookPageDto[]> {
    const extractDir = this.getExtractDir();
    const repoUrl = `https://github.com/${this.config.repoOwner}/${this.config.repoName}.git`;

    logger.info(`Cloning repository from ${repoUrl}`);

    // Clone the repository
    const exec = promisify(execCallback);
    try {
      await fs.rm(extractDir, { recursive: true, force: true });
      await exec(`git clone ${repoUrl} ${extractDir}`);
    } catch (error) {
      logger.error('Error cloning repository:', error);
      throw new Error('Failed to clone repository');
    }

    logger.info('Repository cloned successfully.');

    // Process the markdown files from docs/pages/client/sdk directory
    const docsDir = path.join(extractDir, 'docs');

    // Log what files exist in the directory
    logger.info(`Looking for files in: ${docsDir}`);
    const allFiles = await fs.readdir(docsDir);
    logger.info(`Found ${allFiles.length} files: ${allFiles.join(', ')}`);

    let pages = await processDocFiles(this.config, docsDir);
    logger.info(`Processed ${pages.length} total pages before filtering`);

    logger.info(
      `Processed ${pages.length} documentation pages from Dojo JS (javascript only)`,
    );

    return pages;
  }
}
