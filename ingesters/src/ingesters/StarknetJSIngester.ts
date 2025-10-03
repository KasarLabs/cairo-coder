import * as path from 'path';
import { exec as execCallback } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import { BookConfig, BookPageDto, ParsedSection } from '../utils/types';
import { MarkdownIngester } from './MarkdownIngester';
import { DocumentSource } from '../types';
import { logger } from '../utils/logger';

export class StarknetJSIngester extends MarkdownIngester {
  private static readonly SKIPPED_DIRECTORIES = ['pictures', 'doc_scripts'];

  constructor() {
    const config: BookConfig = {
      repoOwner: 'starknet-io',
      repoName: 'starknet.js',
      fileExtension: '.md',
      chunkSize: 4096,
      chunkOverlap: 512,
      baseUrl: 'https://starknetjs.com/docs/next/guides',
      urlSuffix: '',
      useUrlMapping: true,
    };

    super(config, DocumentSource.STARKNET_JS);
  }

  protected getExtractDir(): string {
    const { getTempDir } = require('../utils/paths');
    return getTempDir('starknet-js-guides');
  }

  protected async downloadAndExtractDocs(): Promise<BookPageDto[]> {
    const extractDir = this.getExtractDir();
    const repoUrl = `https://github.com/${this.config.repoOwner}/${this.config.repoName}.git`;
    const exec = promisify(execCallback);

    try {
      // Clone the repository
      // TODO: Consider sparse clone optimization for efficiency:
      // git clone --depth 1 --filter=blob:none --sparse ${repoUrl} ${extractDir}
      // cd ${extractDir} && git sparse-checkout set www/docs/guides
      logger.info(`Cloning repository from ${repoUrl}...`);
      await exec(`git clone ${repoUrl} ${extractDir}`);
      logger.info('Repository cloned successfully');

      // Navigate to the guides directory
      const docsDir = path.join(extractDir, 'www', 'docs', 'guides');

      // Process markdown files from the guides directory
      const pages: BookPageDto[] = [];
      await this.processDirectory(docsDir, docsDir, pages);

      logger.info(
        `Processed ${pages.length} markdown files from StarknetJS guides`,
      );
      return pages;
    } catch (error) {
      logger.error('Error downloading StarknetJS guides:', error);
      throw new Error('Failed to download and extract StarknetJS guides');
    }
  }

  private async processDirectory(
    dir: string,
    baseDir: string,
    pages: BookPageDto[],
  ): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip configured directories
        if (StarknetJSIngester.SKIPPED_DIRECTORIES.includes(entry.name)) {
          logger.debug(`Skipping directory: ${entry.name}`);
          continue;
        }
        // Recursively process subdirectories
        await this.processDirectory(fullPath, baseDir, pages);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        // Read the markdown file
        const content = await fs.readFile(fullPath, 'utf-8');

        // Create relative path without extension for the name
        const relativePath = path.relative(baseDir, fullPath);
        const name = relativePath.replace(/\.md$/, '');

        pages.push({
          name,
          content,
        });

        logger.debug(`Processed file: ${name}`);
      }
    }
  }

  protected parsePage(
    content: string,
    split: boolean = false,
  ): ParsedSection[] {
    // Strip frontmatter before parsing
    const strippedContent = this.stripFrontmatter(content);
    return super.parsePage(strippedContent, split);
  }

  public stripFrontmatter(content: string): string {
    // Remove YAML frontmatter if present (delimited by --- at start and end)
    const frontmatterRegex = /^---\n[\s\S]*?\n---\n?/;
    return content.replace(frontmatterRegex, '').trimStart();
  }

  // Use default chunking; baseUrl/urlSuffix in config will provide website links
}
