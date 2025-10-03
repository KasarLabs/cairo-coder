import * as fs from 'fs/promises';
import * as path from 'path';
import axios from 'axios';
import AdmZip from 'adm-zip';
import { Document } from '@langchain/core/documents';
import { BookChunk, DocumentSource } from '@cairo-coder/agents/types/index';
import { BaseIngester } from '../BaseIngester';
import { BookConfig, BookPageDto, ParsedSection } from '../utils/types';
import { processDocFiles } from '../utils/fileUtils';
import {
  isInsideCodeBlock,
  calculateHash,
  createAnchor,
  addSectionWithSizeLimit,
} from '../utils/contentUtils';
import { logger } from '@cairo-coder/agents/utils/index';

/**
 * Abstract ingester for Markdown-based documentation
 *
 * This ingester handles documentation in Markdown format, providing common
 * functionality for downloading, processing, and chunking markdown files.
 */
export abstract class MarkdownIngester extends BaseIngester {
  /**
   * Constructor for the Markdown ingester
   *
   * @param config - Book configuration
   * @param source - Document source identifier
   */
  constructor(config: BookConfig, source: DocumentSource) {
    super(config, source);
  }

  /**
   * Download and extract documentation from a GitHub release
   * Assumes the repo has a release with a markdown-output.zip asset
   * Override this method in the ingester to download and extract docs from a different source
   *
   * @returns Promise<BookPageDto[]> - Array of book pages
   */
  protected async downloadAndExtractDocs(): Promise<BookPageDto[]> {
    logger.info(`Downloading and extracting ${this.source}`);

    // Get the latest release information
    const latestReleaseUrl = `https://api.github.com/repos/${this.config.repoOwner}/${this.config.repoName}/releases/latest`;
    const response = await axios.get(latestReleaseUrl);
    const latestRelease = response.data;

    // Find the markdown-output.zip asset
    const zipAsset = latestRelease.assets.find(
      (asset: any) => asset.name === 'markdown-output.zip',
    );

    if (!zipAsset) {
      throw new Error('ZIP asset not found in the latest release.');
    }

    // Download the ZIP file
    const zipUrl = zipAsset.browser_download_url;
    logger.info(`Downloading ZIP file from ${zipUrl}`);
    const zipResponse = await axios.get(zipUrl, {
      responseType: 'arraybuffer',
    });
    const zipData = zipResponse.data;

    // Extract the ZIP file
    const zipFile = new AdmZip(zipData);
    const extractDir = this.getExtractDir();
    zipFile.extractAllTo(extractDir, true);

    logger.info('ZIP file downloaded and extracted successfully.');

    // Process the markdown files
    const srcDir = path.join(extractDir, 'book/markdown');
    const pages = await processDocFiles(this.config, srcDir);

    return pages;
  }

  /**
   * Get the directory path for extracting files
   *
   * @returns string - Path to the extract directory
   */
  protected abstract getExtractDir(): string;

  /**
   * Create chunks from book pages
   *
   * @param pages - Array of book pages
   * @returns Promise<Document<BookChunk>[]> - Array of document chunks
   */
  protected async createChunks(
    pages: BookPageDto[],
  ): Promise<Document<BookChunk>[]> {
    logger.info(
      `Creating chunks from ${this.source} pages based on markdown sections`,
    );
    const chunks: Document<BookChunk>[] = [];

    for (const page of pages) {
      const localChunks = this.createChunkFromPage(page.name, page.content);
      chunks.push(...localChunks);
    }
    return chunks;
  }

  /**
   * Create a chunk from a single page
   */
  protected createChunkFromPage(
    page_name: string,
    page_content: string,
  ): Document<BookChunk>[] {
    // Sanitize code blocks to avoid parsing issues
    const localChunks = [];
    const sanitizedContent = this.sanitizeCodeBlocks(page_content);

    // Parse the page into sections
    const sections = this.parsePage(sanitizedContent, true);

    // Create a document for each section
    sections.forEach((section: ParsedSection, index: number) => {
      const hash: string = calculateHash(section.content);

      // If useUrlMapping is true, map to specific page URLs with anchors.
      // If useUrlMapping is false, only use the baseUrl.
      let sourceLink = '';

      if (this.config.useUrlMapping) {
        // Map to specific page URLs with anchors
        const anchor = section.anchor || createAnchor(section.title);
        sourceLink = `${this.config.baseUrl}/${page_name}${this.config.urlSuffix}${anchor ? `#${anchor}` : ''}`;
      } else {
        // Only use the baseUrl
        sourceLink = this.config.baseUrl;
      }

      localChunks.push(
        new Document<BookChunk>({
          pageContent: section.content,
          metadata: {
            name: page_name,
            title: section.title,
            chunkNumber: index,
            contentHash: hash,
            uniqueId: `${page_name}-${index}`,
            sourceLink,
            source: this.source,
          },
        }),
      );
    });
    return localChunks;
  }

  /**
   * Clean up downloaded files
   */
  protected async cleanupDownloadedFiles(): Promise<void> {
    const extractDir = this.getExtractDir();
    await fs.rm(extractDir, { recursive: true, force: true });
    logger.info(`Deleted downloaded markdown files from ${extractDir}`);
  }

  /**
   * Sanitize code blocks in markdown content
   *
   * @param content - The markdown content to sanitize
   * @returns string - The sanitized content
   */
  protected sanitizeCodeBlocks(content: string): string {
    const lines = content.split('\n');
    let isInCodeBlock = false;
    const sanitizedLines = lines.filter((line) => {
      if (line.trim().startsWith('```')) {
        isInCodeBlock = !isInCodeBlock;
        return true;
      }
      if (isInCodeBlock) {
        return !line.trim().startsWith('# ') && line.trim() !== '#';
      }
      return true;
    });
    return sanitizedLines.join('\n');
  }

  /**
   * Parse a markdown page into sections
   *
   * @param content - The markdown content to parse
   * @param split - Whether to split the content into sections
   * @returns ParsedSection[] - Array of parsed sections
   */
  protected parsePage(
    content: string,
    split: boolean = false,
  ): ParsedSection[] {
    if (split) {
      return this.splitMarkdownIntoSections(content);
    }

    // If not splitting, create a single section from the content
    const headerRegex = /^(#{1,2})\s+(.+)$/gm;
    let match;
    if ((match = headerRegex.exec(content)) !== null) {
      const sections: ParsedSection[] = [];
      addSectionWithSizeLimit(
        sections,
        match[2],
        content,
        20000,
        createAnchor(match[2]),
      );
      return sections;
    }

    return [];
  }

  /**
   * Split markdown content into sections based on headers
   *
   * @param content - The markdown content to split
   * @returns ParsedSection[] - Array of parsed sections
   */
  protected splitMarkdownIntoSections(content: string): ParsedSection[] {
    const headerRegex = /^(#{1,2})\s+(.+)$/gm;
    const sections: ParsedSection[] = [];
    let lastIndex = 0;
    let lastTitle = '';
    let match;

    while ((match = headerRegex.exec(content)) !== null) {
      if (!isInsideCodeBlock(content, match.index)) {
        if (lastIndex < match.index) {
          const sectionContent = content.slice(lastIndex, match.index).trim();
          addSectionWithSizeLimit(sections, lastTitle, sectionContent, 20000);
        }
        lastTitle = match[2];
        lastIndex = match.index;
      }
    }

    // Add the last section
    if (lastIndex < content.length) {
      const sectionContent = content.slice(lastIndex).trim();
      addSectionWithSizeLimit(sections, lastTitle, sectionContent, 20000);
    }

    return sections;
  }
}
