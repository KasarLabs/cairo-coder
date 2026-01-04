import * as fs from 'fs/promises';
import * as path from 'path';
import { exec as execCallback } from 'child_process';
import { promisify } from 'util';
import { type BookConfig } from '../utils/types';
import { MarkdownIngester } from './MarkdownIngester';
import { type BookChunk, DocumentSource } from '../types';
import { Document } from '@langchain/core/documents';
import { VectorStore } from '../db/postgresVectorStore';
import { type VectorStoreUpdateOptions } from '../utils/vectorStoreUtils';
import { logger } from '../utils/logger';
import { calculateHash } from '../utils/contentUtils';
import { getPythonPath } from '../utils/paths';
import { parseMdxFile, type ParsedMdxDoc } from '../utils/MdxParser';
import { formatAsApiIndex } from '../utils/ApiIndexFormatter';

/**
 * Ingester for the Cairo Core Library documentation
 *
 * This ingester pulls structured corelib MDX docs from starknet-docs,
 * formats them into a compact API index, and creates module-level chunks.
 */
export class CoreLibDocsIngester extends MarkdownIngester {
  /**
   * Constructor for the Cairo Core Library ingester
   */
  constructor() {
    // Define the configuration for the Cairo Core Library
    const config: BookConfig = {
      repoOwner: 'starknet-io',
      repoName: 'starknet-docs',
      fileExtensions: ['.mdx'],
      chunkSize: 4096,
      chunkOverlap: 512,
      baseUrl: 'https://docs.starknet.io/build/corelib',
      urlSuffix: '',
      useUrlMapping: true,
      sourceDir: 'build/corelib',
    };

    super(config, DocumentSource.CORELIB_DOCS);
  }

  /**
   * Clone the corelib documentation repository
   */
  private async cloneRepo(): Promise<string> {
    const extractDir = this.getExtractDir();
    const repoUrl = `https://github.com/${this.config.repoOwner}/${this.config.repoName}.git`;
    const exec = promisify(execCallback);

    logger.info(`Cloning repository from ${repoUrl}`);

    await fs.rm(extractDir, { recursive: true, force: true }).catch(() => {});
    await exec(`git clone --depth 1 ${repoUrl} ${extractDir}`);

    logger.info('Repository cloned successfully.');
    return extractDir;
  }

  /**
   * Read and parse all corelib MDX files into structured docs
   */
  private async parseCorelibMdx(repoPath: string): Promise<ParsedMdxDoc[]> {
    const sourceDir = this.config.sourceDir ?? 'build/corelib';
    const corelibDir = path.join(repoPath, sourceDir);
    const mdxFiles = await this.collectMdxFiles(corelibDir);
    logger.info(`Found ${mdxFiles.length} corelib MDX files.`);

    const docs: ParsedMdxDoc[] = [];
    for (const filePath of mdxFiles) {
      const content = await fs.readFile(filePath, 'utf8');
      const relativePath = path
        .relative(corelibDir, filePath)
        .split(path.sep)
        .join('/');
      docs.push(parseMdxFile(content, relativePath));
    }

    return docs;
  }

  /**
   * Collect MDX files from a directory (recursively).
   */
  private async collectMdxFiles(directory: string): Promise<string[]> {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        const nested = await this.collectMdxFiles(fullPath);
        files.push(...nested);
      } else if (
        entry.isFile() &&
        this.config.fileExtensions.includes(
          path.extname(entry.name).toLowerCase(),
        )
      ) {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * Save formatted API index to the generated corelib summary file
   */
  private async saveApiIndex(apiIndex: string): Promise<void> {
    const summaryPath = getPythonPath(
      'src',
      'cairo_coder_tools',
      'ingestion',
      'generated',
      'corelib_summary.md',
    );

    await fs.mkdir(path.dirname(summaryPath), { recursive: true });
    await fs.writeFile(summaryPath, apiIndex, 'utf8');
    logger.info(`Saved API index to ${summaryPath}`);
  }

  /**
   * Chunk the API index by module blocks
   */
  private chunkApiIndex(apiIndex: string): Document<BookChunk>[] {
    const blocks = apiIndex
      .split(/\n{2,}(?=\[module\]\s+)/)
      .map((block) => block.trim())
      .filter(Boolean);

    return blocks.map((block) => {
      const moduleMatch = block.match(/^\[module\]\s+(.+)$/m);
      const modulePath = moduleMatch ? moduleMatch[1].trim() : 'corelib';
      const urlMatch = block.match(/^\[url\]\s+(.+)$/m);
      const sourceLink = urlMatch ? urlMatch[1].trim() : this.config.baseUrl;
      const contentHash = calculateHash(block);

      return new Document<BookChunk>({
        pageContent: block,
        metadata: {
          name: modulePath,
          title: modulePath,
          chunkNumber: 0,
          contentHash,
          uniqueId: `${modulePath}-0`,
          sourceLink,
          source: this.source,
        },
      });
    });
  }

  /**
   * Core Library specific processing based on the structured MDX docs
   * @param vectorStore
   */
  public override async process(
    vectorStore: VectorStore,
    options?: VectorStoreUpdateOptions,
  ): Promise<void> {
    try {
      // 1. Clone the repository
      const repoPath = await this.cloneRepo();

      // 2. Parse corelib MDX files
      const docs = await this.parseCorelibMdx(repoPath);

      // 3. Format as compact API index
      const apiIndex = formatAsApiIndex(docs);

      // 4. Save the API index to disk
      await this.saveApiIndex(apiIndex);

      // 5. Create chunks from the API index
      const chunks = this.chunkApiIndex(apiIndex);

      logger.info(
        `Created ${chunks.length} chunks from core library documentation`,
      );

      // 6. Update the vector store with the chunks
      await this.updateVectorStore(vectorStore, chunks, options);

      // 7. Clean up cloned repo
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
    const { getTempDir } = require('../utils/paths');
    return getTempDir('corelib-docs');
  }

  /**
   * Clean up cloned repository files
   */
  protected override async cleanupDownloadedFiles(): Promise<void> {
    const extractDir = this.getExtractDir();
    await fs.rm(extractDir, { recursive: true, force: true });
    logger.info(`Deleted downloaded corelib docs from ${extractDir}`);
  }
}
