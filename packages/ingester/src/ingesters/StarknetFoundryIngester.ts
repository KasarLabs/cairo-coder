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

const exec = promisify(execCallback);

/**
 * Ingester for the Starknet Foundry documentation
 *
 * This ingester downloads the Starknet Foundry documentation from GitHub releases,
 * builds the mdbook, processes the markdown files, and creates chunks for the vector store.
 */
export class StarknetFoundryIngester extends MarkdownIngester {
  /**
   * Constructor for the Starknet Foundry ingester
   */
  constructor() {
    // Define the configuration for the Starknet Foundry
    const config: BookConfig = {
      repoOwner: 'foundry-rs',
      repoName: 'starknet-foundry',
      fileExtension: '.md',
      chunkSize: 4096,
      chunkOverlap: 512,
      baseUrl: 'https://foundry-rs.github.io/starknet-foundry',
      urlSuffix: '.html',
    };

    super(config, DocumentSource.STARKNET_FOUNDRY);
  }

  /**
   * Get the directory path for extracting files
   *
   * @returns string - Path to the extract directory
   */
  protected getExtractDir(): string {
    return path.join(__dirname, '..', '..', 'temp', 'starknet-foundry');
  }

  /**
   * Download and extract the Starknet Foundry documentation
   *
   * @returns Promise<BookPageDto[]> - Array of book pages
   */
  protected async downloadAndExtractDocs(): Promise<BookPageDto[]> {
    logger.info('Downloading and processing Starknet Foundry docs');
    const extractDir = this.getExtractDir();

    // Download and extract the repository
    await this.downloadAndExtractRepo(extractDir);

    // Update book.toml configuration
    await this.updateBookConfig(extractDir);

    // Build the mdbook
    await this.buildMdBook(extractDir);

    // Process the markdown files
    const srcDir = path.join(extractDir, 'docs', 'book', 'markdown');
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

    // Find the extracted directory (it has a prefix like foundry-rs-starknet-foundry-v0.1.0-alpha)
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
    const bookTomlPath = path.join(extractDir, 'docs', 'book.toml');

    try {
      let bookToml = await fs.readFile(bookTomlPath, 'utf8');

      // Add optional = true to [output.linkcheck] if it exists
      if (bookToml.includes('[output.linkcheck]')) {
        bookToml = bookToml.replace(
          '[output.linkcheck]',
          '[output.linkcheck]\noptional = true',
        );
      } else {
        bookToml += '\n[output.linkcheck]\noptional = true\n';
      }

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
    const docsDir = path.join(extractDir, 'docs');

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

      await exec('mdbook build', { cwd: docsDir });
      logger.info('mdbook build completed successfully');
    } catch (error) {
      logger.error('Error building mdbook:', error);
      throw error;
    }
  }
}
