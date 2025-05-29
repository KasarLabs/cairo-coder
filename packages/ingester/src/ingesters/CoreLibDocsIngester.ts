import * as fs from 'fs/promises';
import * as path from 'path';
import axios from 'axios';
import AdmZip from 'adm-zip';
import { Document } from '@langchain/core/documents';
import {
  BookChunk,
  DocumentSource,
} from '@cairo-coder/agents/types/index';
import { BookConfig, BookPageDto, ParsedSection } from '../utils/types';
import { processDocFiles } from '../utils/fileUtils';
import { logger } from '@cairo-coder/agents/utils/index';
import { exec as execCallback } from 'child_process';
import { promisify } from 'util';
import { MarkdownIngester } from './MarkdownIngester';

/**
 * Ingester for the Cairo Book documentation
 *
 * This ingester downloads the Cairo Book documentation from GitHub releases,
 * processes the markdown files, and creates chunks for the vector store.
 */
export class CoreLibDocsIngester extends MarkdownIngester {
  /**
   * Constructor for the Cairo Book ingester
   */
  constructor() {
    // Define the configuration for the Cairo Book
    // TODO update with starkware repo once fixed
    const config: BookConfig = {
      repoOwner: 'enitrat',
      repoName: 'cairo-docs',
      fileExtension: '.md',
      chunkSize: 4096,
      chunkOverlap: 512,
    };

    super(config, DocumentSource.CORELIB_DOCS);
  }

  /**
   * Get the directory path for extracting files
   *
   * @returns string - Path to the extract directory
   */
  protected getExtractDir(): string {
    return path.join(__dirname, '..', '..', 'temp', 'corelib-docs');
  }

  /**
   * Download and extract the repository
   *
   * @param extractDir - The directory to extract to
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

    // Navigate to the core directory
    const coreDir = path.join(extractDir, 'core');

    // Update book.toml configuration
    const bookTomlPath = path.join(coreDir, 'book.toml');

    try {
      let bookToml = await fs.readFile(bookTomlPath, 'utf8');

      // Add [output.markdown] if it doesn't exist
      if (!bookToml.includes('[output.markdown]')) {
        bookToml += '\n[output.markdown]\n';
      }

      await fs.writeFile(bookTomlPath, bookToml);
      logger.info('Updated book.toml configuration');
    } catch (error) {
      logger.error('Error updating book.toml:', error);
      throw new Error('Failed to update book.toml configuration');
    }

    // Build the mdbook
    try {
      logger.info('Building mdbook...');
      try {
        await exec('mdbook --version');
      } catch (error) {
        logger.error('mdbook is not installed on this system');
        throw new Error('mdbook is required but not installed');
      }

      await exec('mdbook build', { cwd: coreDir });
      logger.info('mdbook built successfully');
    } catch (error) {
      logger.error('Error building mdbook:', error);
      throw new Error('Failed to build mdbook');
    }

    logger.info('Repository cloned and processed successfully.');

    // Process the markdown files
    const srcDir = path.join(coreDir, 'book/markdown');
    const pages = await processDocFiles(this.config, srcDir);

    return pages;
  }
}
