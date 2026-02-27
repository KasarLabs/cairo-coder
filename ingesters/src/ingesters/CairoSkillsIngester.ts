import * as fs from 'fs';
import * as nodePath from 'path';
import axios from 'axios';
import { Document } from '@langchain/core/documents';
import { BaseIngester } from '../BaseIngester';
import { type BookChunk, DocumentSource } from '../types';
import {
  addSectionWithSizeLimit,
  calculateHash,
  isInsideCodeBlock,
} from '../utils/contentUtils';
import { logger } from '../utils/logger';
import { getRepoPath } from '../utils/paths';
import {
  type BookConfig,
  type BookPageDto,
  type ParsedSection,
} from '../utils/types';

type SkillConfig = {
  id: string;
  url: string;
};

type ParsedGitHubUrl = {
  owner: string;
  repo: string;
  ref: string;
  path: string;
  isFile: boolean;
};

type SkillFrontmatter = {
  name?: string;
  description?: string;
  keywords?: string[];
};

type FrontmatterResult = {
  frontmatter: SkillFrontmatter;
  content: string;
};

type GitHubEntry = {
  type: 'file' | 'dir';
  name: string;
  path: string;
};

type GitHubFileResponse = {
  type: 'file';
  name: string;
  path: string;
  content: string;
  encoding: string;
};

const GITHUB_HOST = 'github.com';
const FRONTMATTER_REGEX = /^---\s*\n([\s\S]*?)\n---\s*\n?/;
const MAX_MARKDOWN_COLLECTION_DEPTH = 5;
const MAX_CONCURRENT_FILE_FETCHES = 5;

function stripWrappingQuotes(input: string): string {
  return input.replace(/^["']|["']$/g, '');
}

export function parseGitHubUrl(url: string): ParsedGitHubUrl {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error(`Invalid GitHub URL: ${url}`);
  }

  if (parsedUrl.hostname !== GITHUB_HOST) {
    throw new Error(`Unsupported GitHub host: ${parsedUrl.hostname}`);
  }

  const segments = parsedUrl.pathname.split('/').filter(Boolean);
  if (segments.length < 5) {
    throw new Error(`Unsupported GitHub URL format: ${url}`);
  }

  const owner = segments[0];
  const repo = segments[1];
  const kind = segments[2];
  const ref = segments[3];
  const repoPath = decodeURIComponent(segments.slice(4).join('/'));

  if (!owner || !repo || !ref || !repoPath) {
    throw new Error(`Unsupported GitHub URL format: ${url}`);
  }

  if (kind === 'tree') {
    return { owner, repo, ref, path: repoPath, isFile: false };
  }

  if (kind === 'blob') {
    return { owner, repo, ref, path: repoPath, isFile: true };
  }

  throw new Error(`Unsupported GitHub URL format: ${url}`);
}

export function parseFrontmatter(markdown: string): FrontmatterResult {
  // Intentionally narrow parser: we only consume simple scalar `name`,
  // `description`, and `keywords` fields used by skill metadata.
  // Unsupported YAML constructs are ignored by design.
  const match = markdown.match(FRONTMATTER_REGEX);

  if (!match || !match[1]) {
    return { frontmatter: {}, content: markdown };
  }

  const frontmatterBlock = match[1];
  const parsedFrontmatter: SkillFrontmatter = {};
  const lines = frontmatterBlock.split('\n');
  let activeListKey: keyof SkillFrontmatter | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    if (
      activeListKey === 'keywords' &&
      trimmed.startsWith('- ') &&
      parsedFrontmatter.keywords
    ) {
      parsedFrontmatter.keywords.push(stripWrappingQuotes(trimmed.slice(2)));
      continue;
    }

    const keyValueMatch = trimmed.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!keyValueMatch || !keyValueMatch[1]) {
      activeListKey = null;
      continue;
    }

    const key = keyValueMatch[1];
    const rawValue = keyValueMatch[2] ?? '';

    activeListKey = null;

    if (key === 'name' || key === 'description') {
      parsedFrontmatter[key] = stripWrappingQuotes(rawValue);
      continue;
    }

    if (key === 'keywords') {
      if (!rawValue) {
        parsedFrontmatter.keywords = [];
        activeListKey = 'keywords';
        continue;
      }

      const arrayMatch = rawValue.match(/^\[(.*)\]$/);
      if (arrayMatch) {
        const listContent = arrayMatch[1] ?? '';
        parsedFrontmatter.keywords = listContent
          .split(',')
          .map((item) => stripWrappingQuotes(item.trim()))
          .filter(Boolean);
      }
    }
  }

  return {
    frontmatter: parsedFrontmatter,
    content: markdown.slice(match[0].length),
  };
}

export class CairoSkillsIngester extends BaseIngester {
  protected skills: SkillConfig[];

  constructor() {
    const config: BookConfig = {
      repoOwner: 'cairo-skills',
      repoName: 'cairo-skills',
      fileExtensions: ['.md'],
      chunkSize: 4096,
      chunkOverlap: 512,
      baseUrl: '',
      urlSuffix: '',
      useUrlMapping: false,
    };

    super(config, DocumentSource.CAIRO_SKILLS);
    this.skills = this.loadSkillsConfig();
  }

  protected override async downloadAndExtractDocs(): Promise<BookPageDto[]> {
    logger.info('Downloading Cairo skills from GitHub');

    const pages: BookPageDto[] = [];

    for (const skill of this.skills) {
      try {
        const parsedUrl = parseGitHubUrl(skill.url);

        const markdown = parsedUrl.isFile
          ? await this.fetchGitHubFileContent(
              parsedUrl.owner,
              parsedUrl.repo,
              parsedUrl.path,
              parsedUrl.ref,
            )
          : await this.fetchGitHubDirectoryContent(
              parsedUrl.owner,
              parsedUrl.repo,
              parsedUrl.path,
              parsedUrl.ref,
            );

        pages.push({
          name: skill.id,
          content: markdown,
        });
      } catch (error) {
        logger.error(
          `Failed to ingest cairo skill '${skill.id}' from ${skill.url}: ${error}`,
        );
      }
    }

    return pages;
  }

  protected override async createChunks(
    pages: BookPageDto[],
  ): Promise<Document<BookChunk>[]> {
    logger.info('Creating Cairo skill chunks');

    const chunks: Document<BookChunk>[] = [];

    for (const page of pages) {
      const sourceLink = this.getSkillUrl(page.name);
      const { frontmatter, content } = parseFrontmatter(page.content);
      const sanitizedContent = this.sanitizeCodeBlocks(content);
      const sections = this.parsePage(sanitizedContent, true);
      const normalizedSections =
        sections.length > 0
          ? sections
          : [{ title: page.name, content: sanitizedContent }];

      normalizedSections.forEach((section, index) => {
        chunks.push(
          new Document<BookChunk>({
            pageContent: section.content,
            metadata: {
              name: page.name,
              title: section.title,
              chunkNumber: index,
              contentHash: calculateHash(section.content),
              uniqueId: `skill-${page.name}-${index}`,
              sourceLink,
              source: DocumentSource.CAIRO_SKILLS,
              skillId: page.name,
            },
          }),
        );
      });

      const frontmatterName = frontmatter.name?.trim() || page.name;
      const description = frontmatter.description?.trim() || '';
      const summaryContent = `${frontmatterName}: ${description}`.trim();

      chunks.push(
        new Document<BookChunk>({
          pageContent: summaryContent,
          metadata: {
            name: page.name,
            title: frontmatterName,
            chunkNumber: -1,
            contentHash: calculateHash(page.content),
            uniqueId: `skill-${page.name}-full`,
            sourceLink,
            source: DocumentSource.CAIRO_SKILLS,
            skillId: page.name,
            fullContent: page.content,
          },
        }),
      );
    }

    return chunks;
  }

  protected override async cleanupDownloadedFiles(): Promise<void> {
    // No temporary files are created for this ingester.
  }

  protected override parsePage(
    content: string,
    split: boolean = false,
  ): ParsedSection[] {
    if (split) {
      return this.splitMarkdownIntoSections(content);
    }

    const headerRegex = /^(#{1,2})\s+(.+)$/gm;
    const match = headerRegex.exec(content);
    if (!match || !match[2]) {
      return [];
    }

    const sections: ParsedSection[] = [];
    addSectionWithSizeLimit(sections, match[2], content, 20000);
    return sections;
  }

  private loadSkillsConfig(): SkillConfig[] {
    const configPath = getRepoPath('ingesters', 'config', 'skills.json');
    const configContent = fs.readFileSync(configPath, 'utf-8');
    const parsedConfig = JSON.parse(configContent) as {
      skills?: SkillConfig[];
    };

    if (!Array.isArray(parsedConfig.skills)) {
      throw new Error(`Invalid skills config at ${configPath}`);
    }

    return parsedConfig.skills;
  }

  private buildGitHubHeaders(): Record<string, string> {
    const token = process.env.GITHUB_TOKEN;

    return {
      Accept: 'application/vnd.github+json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private async fetchGitHubContents(
    owner: string,
    repo: string,
    repoPath: string,
    ref: string,
  ): Promise<GitHubEntry[] | GitHubFileResponse> {
    const encodedPath = repoPath
      .split('/')
      .filter(Boolean)
      .map((segment) => encodeURIComponent(segment))
      .join('/');
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}?ref=${encodeURIComponent(ref)}`;
    const response = await axios.get(apiUrl, {
      headers: this.buildGitHubHeaders(),
    });

    return response.data as GitHubEntry[] | GitHubFileResponse;
  }

  private async fetchGitHubFileContent(
    owner: string,
    repo: string,
    repoPath: string,
    ref: string,
  ): Promise<string> {
    const contentResponse = await this.fetchGitHubContents(
      owner,
      repo,
      repoPath,
      ref,
    );

    if (
      Array.isArray(contentResponse) ||
      contentResponse.type !== 'file' ||
      contentResponse.encoding !== 'base64'
    ) {
      throw new Error(
        `Expected file response for ${owner}/${repo}/${repoPath}`,
      );
    }

    return Buffer.from(contentResponse.content, 'base64').toString('utf-8');
  }

  private async fetchGitHubDirectoryContent(
    owner: string,
    repo: string,
    repoPath: string,
    ref: string,
  ): Promise<string> {
    const markdownFiles = await this.collectMarkdownFiles(
      owner,
      repo,
      repoPath,
      ref,
      MAX_MARKDOWN_COLLECTION_DEPTH,
    );

    const orderedMarkdownFiles = this.sortMarkdownFiles(markdownFiles);
    const markdownContent: string[] = new Array(orderedMarkdownFiles.length);

    for (
      let startIndex = 0;
      startIndex < orderedMarkdownFiles.length;
      startIndex += MAX_CONCURRENT_FILE_FETCHES
    ) {
      const batch = orderedMarkdownFiles.slice(
        startIndex,
        startIndex + MAX_CONCURRENT_FILE_FETCHES,
      );
      const batchContents = await Promise.all(
        batch.map((markdownFile) =>
          this.fetchGitHubFileContent(owner, repo, markdownFile, ref),
        ),
      );

      batchContents.forEach((content, offset) => {
        markdownContent[startIndex + offset] = content;
      });
    }

    return markdownContent.join('\n\n');
  }

  private async collectMarkdownFiles(
    owner: string,
    repo: string,
    repoPath: string,
    ref: string,
    maxDepth: number,
  ): Promise<string[]> {
    if (maxDepth < 0) {
      logger.warn(
        `Skipping markdown collection for ${owner}/${repo}/${repoPath}: maximum directory depth reached`,
      );
      return [];
    }

    const contents = await this.fetchGitHubContents(owner, repo, repoPath, ref);
    if (!Array.isArray(contents)) {
      if (contents.path.toLowerCase().endsWith('.md')) {
        return [contents.path];
      }
      return [];
    }

    const markdownFiles: string[] = [];

    for (const item of contents) {
      if (item.type === 'file' && item.path.toLowerCase().endsWith('.md')) {
        markdownFiles.push(item.path);
        continue;
      }

      if (item.type === 'dir') {
        const nestedMarkdownFiles = await this.collectMarkdownFiles(
          owner,
          repo,
          item.path,
          ref,
          maxDepth - 1,
        );
        markdownFiles.push(...nestedMarkdownFiles);
      }
    }

    return markdownFiles;
  }

  private sortMarkdownFiles(files: string[]): string[] {
    return [...files].sort((a, b) => {
      const aIsSkill = nodePath.basename(a).toLowerCase() === 'skill.md';
      const bIsSkill = nodePath.basename(b).toLowerCase() === 'skill.md';

      if (aIsSkill !== bIsSkill) {
        return aIsSkill ? -1 : 1;
      }

      return a.localeCompare(b);
    });
  }

  private getSkillUrl(skillId: string): string {
    return this.skills.find((skill) => skill.id === skillId)?.url ?? '';
  }

  private sanitizeCodeBlocks(content: string): string {
    const lines = content.split('\n');
    let insideCodeBlock = false;
    const sanitized = lines.filter((line) => {
      if (line.trim().startsWith('```')) {
        insideCodeBlock = !insideCodeBlock;
        return true;
      }

      if (insideCodeBlock) {
        return !line.trim().startsWith('# ') && line.trim() !== '#';
      }

      return true;
    });

    return sanitized.join('\n');
  }

  private splitMarkdownIntoSections(content: string): ParsedSection[] {
    const headerRegex = /^(#{1,2})\s+(.+)$/gm;
    const sections: ParsedSection[] = [];
    let lastIndex = 0;
    let lastTitle = '';
    let match: RegExpExecArray | null;

    while ((match = headerRegex.exec(content)) !== null) {
      if (!isInsideCodeBlock(content, match.index)) {
        if (lastIndex < match.index) {
          const sectionContent = content.slice(lastIndex, match.index).trim();
          addSectionWithSizeLimit(sections, lastTitle, sectionContent, 20000);
        }

        lastTitle = match[2] ?? '';
        lastIndex = match.index;
      }
    }

    if (lastIndex < content.length) {
      const sectionContent = content.slice(lastIndex).trim();
      addSectionWithSizeLimit(sections, lastTitle, sectionContent, 20000);
    }

    return sections;
  }
}
