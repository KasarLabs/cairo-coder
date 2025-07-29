import { BookConfig, BookPageDto } from '../utils/types';
import { MarkdownIngester } from './MarkdownIngester';
import {
  BookChunk,
  DocumentSource,
  ParsedSection,
} from '@cairo-coder/agents/types/index';
import { Document } from '@langchain/core/documents';
import { VectorStore } from '@cairo-coder/agents/db/postgresVectorStore';
import { logger } from '@cairo-coder/agents/utils/index';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  addSectionWithSizeLimit,
  calculateHash,
  createAnchor,
} from '../utils/contentUtils';

/**
 * Ingester for the Cairo Book documentation
 *
 * This ingester downloads the Cairo Book documentation from GitHub releases,
 * processes the markdown files, and creates chunks for the vector store.
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
      fileExtension: '.md',
      chunkSize: 4096,
      chunkOverlap: 512,
    };

    super(config, DocumentSource.CAIRO_BOOK);
  }

  /**
   * Read the pre-summarized core library documentation file
   */
  async readSummaryFile(): Promise<string> {
    const summaryPath = path.join(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      '..',
      'python',
      'scripts',
      'summarizer',
      'generated',
      'cairo_book_summary.md',
    );

    logger.info(`Reading core library summary from ${summaryPath}`);
    const text = await fs.readFile(summaryPath, 'utf-8');
    return text;
  }

  /**
   * Chunk the core library summary file by H1 headers
   *
   * This function takes the markdown content and splits it into sections
   * based on H1 headers (# Header). Each section becomes a separate chunk
   * with its content hashed for uniqueness.
   *
   * @param text - The markdown content to chunk
   * @returns Promise<Document<BookChunk>[]> - Array of document chunks, one per H1 section
   */
  async chunkSummaryFile(text: string): Promise<Document<BookChunk>[]> {
    const content = text;
    const sections: ParsedSection[] = [];

    // We can't use a simple global regex, as it will incorrectly match commented
    // lines inside code blocks. Instead, we'll parse line-by-line to find
    // "real" headers, while keeping track of whether we're inside a code block.

    const realHeaders: { title: string; startIndex: number }[] = [];
    const lines = content.split('\n');
    let inCodeBlock = false;
    let charIndex = 0;

    for (const line of lines) {
      // Toggle the state if we encounter a code block fence
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
      }

      // A real H1 header is a line that starts with '# ' and is NOT in a code block.
      // We use a specific regex to ensure it's a proper H1.
      const h1Match = line.match(/^#{1,2}\s+(.+)$/);
      if (!inCodeBlock && h1Match) {
        realHeaders.push({
          title: h1Match[1].trim(),
          startIndex: charIndex,
        });
      }

      // Move the character index forward, accounting for the newline character
      charIndex += line.length + 1;
    }

    // If no H1 headers were found, treat the entire content as one section.
    if (realHeaders.length === 0) {
      logger.debug(
        'No H1 headers found, creating single section from entire content',
      );
      addSectionWithSizeLimit(
        sections,
        'Core Library Documentation',
        content.trim(),
        20000,
        createAnchor('Core Library Documentation'),
      );
    } else {
      // Process each valid H1 header found
      for (let i = 0; i < realHeaders.length; i++) {
        const header = realHeaders[i];
        const headerTitle = header.title;
        const headerStartIndex = header.startIndex;

        // Determine the end of this section (start of next header or end of content)
        const nextHeaderIndex =
          i < realHeaders.length - 1
            ? realHeaders[i + 1].startIndex
            : content.length;

        // Extract section content from the start of the header line to before the next header
        const sectionContent = content
          .slice(headerStartIndex, nextHeaderIndex)
          .trim();

        logger.debug(`Adding section: ${headerTitle}`);

        addSectionWithSizeLimit(
          sections,
          headerTitle,
          sectionContent,
          20000,
          createAnchor(headerTitle),
        );
      }
    }

    const localChunks: Document<BookChunk>[] = [];

    // Create a document for each section
    sections.forEach((section: ParsedSection, index: number) => {
      const hash: string = calculateHash(section.content);
      localChunks.push(
        new Document<BookChunk>({
          pageContent: section.content,
          metadata: {
            name: section.title,
            title: section.title,
            chunkNumber: index,
            contentHash: hash,
            uniqueId: `${section.title}-${index}`,
            sourceLink: ``,
            source: this.source, // Using placeholder for 'this.source'
          },
        }),
      );
    });

    return localChunks;
  }

  /**
   * Core Library specific processing based on the pre-summarized markdown file
   * @param vectorStore
   */
  public async process(vectorStore: VectorStore): Promise<void> {
    try {
      // 1. Read the pre-summarized documentation
      const text = await this.readSummaryFile();

      // 2. Create chunks from the documentation
      const chunks = await this.chunkSummaryFile(text);

      logger.info(
        `Created ${chunks.length} chunks from Cairo Book documentation`,
      );

      // 3. Update the vector store with the chunks
      await this.updateVectorStore(vectorStore, chunks);

      // 4. Clean up any temporary files (no temp files in this case)
      await this.cleanupDownloadedFiles();
    } catch (error) {
      this.handleError(error);
    }
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
   * Override cleanupDownloadedFiles since we don't download anything
   */
  protected async cleanupDownloadedFiles(): Promise<void> {
    // No cleanup needed as we're reading from a local file
    logger.info('No cleanup needed - using local summary file');
  }
}
