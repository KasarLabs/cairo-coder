import axios from 'axios';
import { load, type Cheerio, type Element } from 'cheerio';
import { NodeHtmlMarkdown } from 'node-html-markdown';
import { Document } from '@langchain/core/documents';
import { type BookChunk, DocumentSource } from '../types';
import { type BookConfig, type BookPageDto } from '../utils/types';
import { MarkdownIngester } from './MarkdownIngester';
import { logger } from '../utils/logger';
import { calculateHash } from '../utils/contentUtils';
import {
  RecursiveMarkdownSplitter,
  type SplitOptions,
} from '../utils/RecursiveMarkdownSplitter';

const USER_AGENT = 'cairo-coder-ingester';
const CONCURRENCY = 4;
const MAX_RETRIES = 5;
const TIMEOUT_MS = 30_000;
const REQUEST_DELAY_MS = 300;
const MAX_CRAWL_PAGES = 200;
const ALLOWED_YEARS = new Set([2025, 2026]);

const DEFAULT_EXCLUDE_PATTERNS: RegExp[] = [
  /\/admin/i,
  /\/api\//i,
  /\/login/i,
  /\/search/i,
  /\/tag\//i,
  /\/category\//i,
  /\/author\//i,
  /\/user\//i,
  /\/wp-admin/i,
  /\/wp-content/i,
  /\/wp-includes/i,
  /\/_next\//i,
  /\/static\//i,
  /\/assets\//i,
  /\/js\//i,
  /\/css\//i,
  /\/images\//i,
  /\/feed/i,
  /\/rss/i,
  /\/atom/i,
  /\/sitemap/i,
  /\/robots\.txt/i,
  /\bmailto:/i,
  /\btel:/i,
  /#/, // fragments handled separately, but keep as guard
  /\.css$/i,
  /\/video\/?$/i,
];

const MAIN_CONTENT_SELECTORS = [
  'main',
  'article',
  '[role="main"]',
  '.content',
  '.doc-content',
  '.markdown-body',
  '.docs-content',
  '.documentation',
  '.post-content',
  '.entry-content',
  '.page-content',
  '#content',
  '.container-fluid',
  '.container',
  '.wrapper',
];

const BOILERPLATE_KEYWORDS = [
  'navbar',
  'sidebar',
  'nav-bar',
  'side-bar',
  'menu',
  'toc',
  'breadcrumb',
  'footer',
  'header',
];

const PUBLISHED_META_SELECTORS = [
  'meta[property="article:published_time"]',
  'meta[name="article:published_time"]',
  'meta[property="article:published"]',
  'meta[name="publish_date"]',
  'meta[name="pubdate"]',
  'meta[name="date"]',
  'meta[property="og:pubdate"]',
];

const MONTH_REGEX =
  /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+\d{1,2},\s+(\d{4})/i;

/**
 * Ingester for Starknet blog posts (2025/2026).
 */
export class StarknetBlogIngester extends MarkdownIngester {
  constructor() {
    const config: BookConfig = {
      repoOwner: 'starknet',
      repoName: 'starknet-blog',
      fileExtensions: ['.md'],
      chunkSize: 4096,
      chunkOverlap: 512,
      baseUrl: 'https://www.starknet.io/blog',
      urlSuffix: '',
      useUrlMapping: true,
    };

    super(config, DocumentSource.STARKNET_BLOG);
  }

  protected override async downloadAndExtractDocs(): Promise<BookPageDto[]> {
    logger.info('Crawling Starknet blog posts for 2025-2026');

    const baseUrl = this.config.baseUrl;
    const discoveredUrls = await discoverUrls(baseUrl);

    if (discoveredUrls.length === 0) {
      throw new Error('No URLs discovered for Starknet blog crawl');
    }

    const filteredUrls = filterUrls(discoveredUrls, baseUrl);

    if (filteredUrls.length === 0) {
      throw new Error('No URLs remaining after Starknet blog filtering');
    }

    logger.info(`Processing ${filteredUrls.length} Starknet blog URLs`);

    const results = await mapWithConcurrency(
      filteredUrls,
      CONCURRENCY,
      async (url) => {
        const page = await fetchAndProcessPage(url, baseUrl);
        if (!page) {
          return null;
        }
        return page;
      },
    );

    const pages = results.filter((page): page is BookPageDto => page !== null);

    logger.info(`Collected ${pages.length} Starknet blog posts for ingestion`);
    return pages;
  }

  protected override async createChunks(
    pages: BookPageDto[],
  ): Promise<Document<BookChunk>[]> {
    logger.info('Creating chunks from Starknet blog pages');

    const chunks: Document<BookChunk>[] = [];
    const splitOptions: SplitOptions = {
      maxChars: 2048,
      minChars: 500,
      overlap: 256,
      headerLevels: [1, 2, 3],
      preserveCodeBlocks: true,
      trim: true,
    };

    for (const page of pages) {
      const pageId = sanitizePageId(page.name);
      const splitter = new RecursiveMarkdownSplitter({
        ...splitOptions,
        idPrefix: `starknet-blog-${pageId}`,
      });
      const pageChunks = splitter.splitMarkdownToChunks(page.content);
      const pageSource = this.buildSourceLink(page.name);

      pageChunks.forEach((chunk) => {
        const contentHash = calculateHash(chunk.content);
        const uniqueId = chunk.meta.uniqueId;
        const sourceLink = pageSource;

        chunks.push(
          new Document<BookChunk>({
            pageContent: chunk.content,
            metadata: {
              name: page.name,
              title: chunk.meta.title || page.name,
              chunkNumber: chunk.meta.chunkNumber,
              contentHash,
              uniqueId,
              sourceLink,
              source: this.source,
            },
          }),
        );
      });
    }

    logger.info(`Created ${chunks.length} chunks from Starknet blog pages`);
    return chunks;
  }

  protected getExtractDir(): string {
    const { getTempDir } = require('../utils/paths');
    return getTempDir('starknet-blog');
  }

  protected override async cleanupDownloadedFiles(): Promise<void> {
    logger.info('No cleanup needed - Starknet blog crawl is in-memory');
  }

  private buildSourceLink(pageName: string): string {
    const baseUrl = this.config.baseUrl.replace(/\/$/, '');
    const trimmed = pageName.replace(/^\/+/, '');
    return trimmed ? `${baseUrl}/${trimmed}` : baseUrl;
  }
}

async function discoverUrls(baseUrl: string): Promise<string[]> {
  const sitemapUrls = await discoverUrlsFromSitemap(baseUrl);
  if (sitemapUrls.length > 0) {
    return sitemapUrls;
  }

  return discoverUrlsByCrawling(baseUrl);
}

async function discoverUrlsFromSitemap(baseUrl: string): Promise<string[]> {
  const sitemapUrl = new URL('/sitemap.xml', baseUrl).toString();
  logger.info(`Checking for sitemap at ${sitemapUrl}`);

  const urls = await parseSitemap(sitemapUrl);
  const base = new URL(baseUrl);
  const seen = new Set<string>();
  const validUrls: string[] = [];

  for (const url of urls) {
    if (!url) continue;
    const normalized = normalizeUrl(url);
    if (!isValidUrl(normalized, base)) continue;
    const canonical = canonicalizeUrl(normalized, baseUrl);
    if (seen.has(canonical)) continue;
    seen.add(canonical);
    validUrls.push(canonical);
  }

  logger.info(`Found ${validUrls.length} valid URLs from sitemap`);
  return validUrls;
}

async function parseSitemap(sitemapUrl: string): Promise<string[]> {
  const sitemapContent = await fetchSitemap(sitemapUrl);
  if (!sitemapContent) {
    return [];
  }

  const locMatches = sitemapContent.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi);
  const locs = Array.from(locMatches, (match) => decodeXml(match[1] ?? ''));

  if (/sitemapindex/i.test(sitemapContent)) {
    const nestedUrls: string[] = [];
    for (const loc of locs) {
      if (!loc) continue;
      const nested = await parseSitemap(loc);
      nestedUrls.push(...nested);
    }
    return nestedUrls;
  }

  return locs;
}

async function fetchSitemap(url: string): Promise<string | null> {
  try {
    const response = await axios.get(url, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: TIMEOUT_MS,
      validateStatus: () => true,
    });

    if (response.status >= 200 && response.status < 300) {
      return response.data as string;
    }
  } catch (error) {
    logger.debug(`Failed to fetch sitemap ${url}: ${String(error)}`);
  }

  return null;
}

async function discoverUrlsByCrawling(baseUrl: string): Promise<string[]> {
  logger.info('Falling back to crawling for URL discovery');
  const base = new URL(baseUrl);
  const visited = new Set<string>();
  const queue: string[] = [normalizeUrl(baseUrl)];
  visited.add(normalizeUrl(baseUrl));

  while (queue.length > 0 && visited.size < MAX_CRAWL_PAGES) {
    const current = queue.shift();
    if (!current) continue;

    const html = await fetchHtml(current);
    if (!html) continue;

    const links = extractLinks(html, current);
    for (const link of links) {
      if (visited.size >= MAX_CRAWL_PAGES) break;
      const canonical = canonicalizeUrl(link, baseUrl);
      if (!isValidUrl(canonical, base)) continue;
      if (visited.has(canonical)) continue;
      visited.add(canonical);
      queue.push(canonical);
    }
  }

  logger.info(`Discovered ${visited.size} pages by crawling`);
  return Array.from(visited);
}

function filterUrls(urls: string[], baseUrl: string): string[] {
  const base = new URL(baseUrl);
  const seen = new Set<string>();
  const filtered: string[] = [];

  for (const url of urls) {
    const normalized = normalizeUrl(url);
    const canonical = canonicalizeUrl(normalized, baseUrl);
    if (!isValidUrl(canonical, base)) continue;
    if (!isBlogPostPath(canonical, baseUrl)) continue;
    if (seen.has(canonical)) continue;
    seen.add(canonical);
    filtered.push(canonical);
  }

  return filtered.sort();
}

async function fetchAndProcessPage(
  url: string,
  baseUrl: string,
): Promise<BookPageDto | null> {
  const html = await fetchHtml(url);
  if (!html) {
    logger.debug(`Skipping ${url}: failed to fetch HTML`);
    return null;
  }

  const { markdown, title, publishedYear } = extractContent(html, url);

  if (!publishedYear || !ALLOWED_YEARS.has(publishedYear)) {
    logger.debug(`Skipping ${url}: not a 2025/2026 blog post`);
    return null;
  }

  const cleaned = cleanBlogMarkdown(markdown);
  if (!cleaned || cleaned.length < 50) {
    logger.debug(`Skipping ${url}: extracted markdown too small`);
    return null;
  }

  const content = ensureTitleInMarkdown(title, cleaned);
  const pageName = buildPageName(url, baseUrl);

  return {
    name: pageName,
    content,
  };
}

async function fetchHtml(url: string): Promise<string | null> {
  let lastError = 'Unknown error';

  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    try {
      const response = await axios.get(url, {
        headers: { 'User-Agent': USER_AGENT },
        timeout: TIMEOUT_MS,
        validateStatus: () => true,
      });

      const contentType = response.headers['content-type'] ?? '';
      if (response.status === 200 && contentType.includes('text/html')) {
        await sleep(REQUEST_DELAY_MS);
        return response.data as string;
      }

      if (response.status === 429 || response.status >= 500) {
        lastError = `Status ${response.status}`;
        const retryAfter = response.headers['retry-after'];
        const delayMs = retryAfter
          ? Number.parseInt(String(retryAfter), 10) * 1000
          : 2 ** attempt * 1000;
        await sleep(delayMs);
        continue;
      }

      return null;
    } catch (error) {
      lastError = String(error);
      const delayMs = 2 ** attempt * 1000;
      await sleep(delayMs);
    }
  }

  logger.debug(`Failed to fetch ${url} after ${MAX_RETRIES} attempts: ${lastError}`);
  return null;
}

function extractLinks(html: string, baseUrl: string): string[] {
  const $ = load(html);
  const links = new Set<string>();

  $('a[href], link[href]').each((_, element) => {
    const href = $(element).attr('href');
    if (!href) return;

    try {
      const absoluteUrl = new URL(href, baseUrl).toString();
      links.add(normalizeUrl(absoluteUrl));
    } catch {
      return;
    }
  });

  return Array.from(links);
}

function extractContent(
  html: string,
  url: string,
): { markdown: string; title: string; publishedYear: number | null } {
  const $ = load(html);

  const title =
    $('meta[property="og:title"]').attr('content')?.trim() ||
    $('title').first().text().trim() ||
    $('h1').first().text().trim() ||
    url;

  $('script, style, noscript, nav, header, footer, aside, img, svg, iframe').remove();

  $('*').each((_, element) => {
    const node = $(element);
    const id = node.attr('id')?.toLowerCase() ?? '';
    const className = (node.attr('class') ?? '').toLowerCase();

    if (BOILERPLATE_KEYWORDS.some((keyword) => id.includes(keyword))) {
      node.remove();
      return;
    }

    if (BOILERPLATE_KEYWORDS.some((keyword) => className.includes(keyword))) {
      node.remove();
    }
  });

  let mainContent: Cheerio<Element> | null = null;
  for (const selector of MAIN_CONTENT_SELECTORS) {
    const element = $(selector).first();
    if (element.length === 0) continue;
    const textLength = element.text().trim().length;
    if (textLength > 100) {
      mainContent = element;
      break;
    }
  }

  if (!mainContent || mainContent.length === 0) {
    let bestDiv = null;
    let bestLength = 0;
    $('div').each((_, element) => {
      const node = $(element);
      const textLength = node.text().trim().length;
      if (textLength < 200) return;
      const className = (node.attr('class') ?? '').toLowerCase();
      const id = (node.attr('id') ?? '').toLowerCase();
      if (
        ['nav', 'menu', 'sidebar', 'header', 'footer'].some((kw) =>
          className.includes(kw) || id.includes(kw),
        )
      ) {
        return;
      }
      if (textLength > bestLength) {
        bestLength = textLength;
        bestDiv = node;
      }
    });
    mainContent = bestDiv ?? null;
  }

  if (!mainContent || mainContent.length === 0) {
    const body = $('body').first();
    mainContent = body.length > 0 ? body : null;
  }

  const htmlFragment = mainContent ? $.html(mainContent) ?? '' : '';
  const markdown = NodeHtmlMarkdown.translate(htmlFragment);
  const publishedYear = extractPublishedYear($, markdown);

  return {
    markdown: normalizeMarkdown(markdown),
    title,
    publishedYear,
  };
}

function extractPublishedYear(
  $: ReturnType<typeof load>,
  markdown: string,
): number | null {
  for (const selector of PUBLISHED_META_SELECTORS) {
    const content = $(selector).attr('content');
    const year = parseYear(content);
    if (year) return year;
  }

  const timeElement = $('time[datetime]').first();
  const timeAttr = timeElement.attr('datetime');
  const timeYear = parseYear(timeAttr);
  if (timeYear) return timeYear;

  const timeText = $('time').first().text().trim();
  const timeTextYear = parseYear(timeText);
  if (timeTextYear) return timeTextYear;

  const snippet = markdown.slice(0, 2000);
  const match = snippet.match(MONTH_REGEX);
  if (match && match[2]) {
    const year = Number.parseInt(match[2], 10);
    return Number.isNaN(year) ? null : year;
  }

  return null;
}

function parseYear(value?: string | null): number | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.valueOf())) {
    return parsed.getUTCFullYear();
  }

  const match = value.match(/(\d{4})/);
  if (match) {
    const year = Number.parseInt(match[1] ?? '', 10);
    return Number.isNaN(year) ? null : year;
  }

  return null;
}

function cleanBlogMarkdown(markdown: string): string {
  let cleaned = markdown;

  cleaned = cleaned.replace(
    /^#{2,}\s*Join our newsletter[\s\S]*?(?=^#{2,}|\Z)/gim,
    '',
  );
  cleaned = cleaned.replace(
    /^#{2,}\s*May also interest you[\s\S]*?(?=^#{2,}|\Z)/gim,
    '',
  );

  cleaned = cleaned.replace(
    /Join our newsletter[\s\S]*?(?=\n\n[A-Z]|\Z)/gi,
    '',
  );
  cleaned = cleaned.replace(
    /May also interest you[\s\S]*?(?=\n\n[A-Z]|\Z)/gi,
    '',
  );

  return normalizeMarkdown(cleaned).trim();
}

function normalizeMarkdown(markdown: string): string {
  return markdown
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^---+\n/gm, '')
    .replace(/^\.{3,}\n/gm, '')
    .trim();
}

function ensureTitleInMarkdown(title: string, markdown: string): string {
  const trimmed = markdown.trim();
  if (trimmed.startsWith('# ')) {
    return trimmed;
  }

  return `# ${title}\n\n${trimmed}`.trim();
}

function buildPageName(url: string, baseUrl: string): string {
  const base = new URL(baseUrl);
  const parsed = new URL(url);
  const basePath = base.pathname.replace(/\/$/, '');
  let path = parsed.pathname;

  if (basePath && path.startsWith(basePath)) {
    path = path.slice(basePath.length);
  }

  path = path.replace(/^\/+/, '').replace(/\/+$/, '');
  return path || 'index';
}

function sanitizePageId(pageName: string): string {
  return pageName.replace(/[^a-zA-Z0-9-_]/g, '-');
}

function isValidUrl(url: string, baseUrl: URL): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  if (normalizeHost(parsed.host) !== normalizeHost(baseUrl.host)) return false;

  const basePath = baseUrl.pathname.replace(/\/$/, '');
  const urlPath = parsed.pathname.replace(/\/$/, '');
  if (basePath && !urlPath.startsWith(basePath)) return false;

  return !DEFAULT_EXCLUDE_PATTERNS.some((pattern) => pattern.test(parsed.pathname));
}

function isBlogPostPath(url: string, baseUrl: string): boolean {
  const basePath = new URL(baseUrl).pathname.replace(/\/$/, '');
  const path = new URL(url).pathname.replace(/\/$/, '');
  if (path === basePath) return false;
  if (!path.startsWith(basePath)) return false;

  const remainder = path.slice(basePath.length).replace(/^\/+/, '');
  return remainder.length > 0 && !remainder.startsWith('page/');
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    parsed.search = '';
    const normalized = parsed.toString();
    return normalized.endsWith('/') && parsed.pathname !== '/'
      ? normalized.slice(0, -1)
      : normalized;
  } catch {
    return url;
  }
}

function canonicalizeUrl(url: string, baseUrl: string): string {
  try {
    const parsed = new URL(url);
    const base = new URL(baseUrl);
    parsed.protocol = base.protocol;
    parsed.host = base.host;
    parsed.hash = '';
    parsed.search = '';
    const normalized = parsed.toString();
    return normalized.endsWith('/') && parsed.pathname !== '/'
      ? normalized.slice(0, -1)
      : normalized;
  } catch {
    return url;
  }
}

function normalizeHost(host: string): string {
  return host.startsWith('www.') ? host.slice(4) : host;
}

function decodeXml(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;

  const workers = Array.from({ length: concurrency }, async () => {
    while (true) {
      const current = index;
      index += 1;
      if (current >= items.length) break;
      results[current] = await mapper(items[current] as T, current);
    }
  });

  await Promise.all(workers);
  return results;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
