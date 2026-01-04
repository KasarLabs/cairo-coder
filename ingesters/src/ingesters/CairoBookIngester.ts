import * as fs from 'fs/promises';
import * as path from 'path';
import axios from 'axios';
import AdmZip from 'adm-zip';
import { type BookChunk, DocumentSource } from '../types';
import { type BookConfig, type BookPageDto } from '../utils/types';
import { processDocFiles } from '../utils/fileUtils';
import { logger } from '../utils/logger';
import { exec as execCallback } from 'child_process';
import { promisify } from 'util';
import { MarkdownIngester } from './MarkdownIngester';

const exec = promisify(execCallback);

/**
 * Ingester for the Cairo Book documentation
 *
 * This ingester downloads the Cairo Book documentation from GitHub releases,
 * builds the mdbook, processes the markdown files, and creates chunks for the vector store.
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
      fileExtensions: ['.md'],
      chunkSize: 4096,
      chunkOverlap: 512,
      baseUrl: 'https://book.cairo-lang.org',
      urlSuffix: '.html',
      useUrlMapping: true,
    };

    super(config, DocumentSource.CAIRO_BOOK);
  }

  /**
   * Get the directory path for extracting files
   *
   * @returns string - Path to the extract directory
   */
  protected getExtractDir(): string {
    const { getTempDir } = require('../utils/paths');
    return getTempDir('cairo-book');
  }

  /**
   * Download and extract the Cairo Book documentation
   *
   * @returns Promise<BookPageDto[]> - Array of book pages
   */
  protected override async downloadAndExtractDocs(): Promise<BookPageDto[]> {
    logger.info('Downloading and processing Cairo Book docs');
    const extractDir = this.getExtractDir();
    // clear extract dir
    await fs.rm(extractDir, { recursive: true, force: true });

    // Download and extract the repository
    await this.downloadAndExtractRepo(extractDir);

    // Update book.toml configuration
    await this.updateBookConfig(extractDir);

    // Build the mdbook
    await this.buildMdBook(extractDir);

    // Process the markdown files
    const srcDir = path.join(extractDir, 'book', 'markdown');
    const pages = await processDocFiles(this.config, srcDir);

    return pages;
  }

  /**
   * Download and extract the repository
   *
   * @param extractDir - The directory to extract to
   */
  private async downloadAndExtractRepo(extractDir: string): Promise<void> {
    const latestReleaseUrl = `https://api.github.com/repos/${this.config.repoOwner}/${this.config.repoName}/releases/latest`;
    const response = await axios.get(latestReleaseUrl);
    const latestRelease = response.data;
    const zipUrl = latestRelease.zipball_url;

    logger.info(`Downloading repository from ${zipUrl}`);
    const zipResponse = await axios.get(zipUrl, {
      responseType: 'arraybuffer',
    });
    const zipData = zipResponse.data;

    const zipFile = new AdmZip(zipData);
    zipFile.extractAllTo(extractDir, true);

    // Find the extracted directory (it has a prefix like cairo-book-cairo-book-v2.0.0)
    const files = await fs.readdir(extractDir);
    const repoDir = files.find((file) =>
      file.startsWith(`${this.config.repoOwner}-${this.config.repoName}`),
    );

    if (!repoDir) {
      throw new Error('Repository directory not found in the extracted files.');
    }

    // Move all contents from the nested directory to the extract directory
    const nestedDir = path.join(extractDir, repoDir);
    const nestedFiles = await fs.readdir(nestedDir);

    for (const file of nestedFiles) {
      const srcPath = path.join(nestedDir, file);
      const destPath = path.join(extractDir, file);
      await fs.rename(srcPath, destPath);
    }

    // Remove the now-empty nested directory
    await fs.rmdir(nestedDir);

    logger.info('Repository downloaded and extracted successfully.');
  }

  /**
   * Update the book.toml configuration
   *
   * @param extractDir - The directory containing the book.toml file
   */
  private async updateBookConfig(extractDir: string): Promise<void> {
    const bookTomlPath = path.join(extractDir, 'book.toml');

    try {
      let bookToml = await fs.readFile(bookTomlPath, 'utf8');

      // Remove the quiz-cairo preprocessor section if it exists
      bookToml = bookToml.replace(
        /\[preprocessor\.quiz-cairo\][\s\S]*?(?=\n\[|$)/g,
        '',
      );

      // Remove the cairo preprocessor section if it exists
      bookToml = bookToml.replace(
        /\[preprocessor\.cairo\][\s\S]*?(?=\n\[|$)/g,
        '',
      );

      // Remove the gettext preprocessor section if it exists
      bookToml = bookToml.replace(
        /\[preprocessor\.gettext\][\s\S]*?(?=\n\[|$)/g,
        '',
      );

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
  }

  /**
   * Build the mdbook
   *
   * @param extractDir - The directory containing the mdbook
   */
  private async buildMdBook(extractDir: string): Promise<void> {
    try {
      logger.info('Building mdbook...');
      try {
        await exec('mdbook --version');
      } catch (error) {
        logger.error('mdbook is not installed on this system');
        throw new Error(
          'mdbook is not installed. Please install mdbook to continue: https://rust-lang.github.io/mdBook/guide/installation.html',
        );
      }

      await exec('mdbook build', { cwd: extractDir });
      logger.info('mdbook build completed successfully');
    } catch (error) {
      logger.error('Error building mdbook:', error);
      throw error;
    }
  }
}
