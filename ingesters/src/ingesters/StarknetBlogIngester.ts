import axios from 'axios';
import { load, type Cheerio } from 'cheerio';
import type { AnyNode, Element } from 'domhandler';
import { NodeHtmlMarkdown } from 'node-html-markdown';
import { Document } from '@langchain/core/documents';
import { gunzipSync } from 'zlib';
import { type BookChunk, DocumentSource } from '../types';
import { type BookConfig, type BookPageDto } from '../utils/types';
import { MarkdownIngester } from './MarkdownIngester';
import { logger } from '../utils/logger';
import { calculateHash } from '../utils/contentUtils';
import {
  RecursiveMarkdownSplitter,
  type SplitOptions,
} from '../utils/RecursiveMarkdownSplitter';
import { getTempDir, getPythonPath } from '../utils/paths';
import * as fs from 'fs/promises';

const USER_AGENT = 'cairo-coder-ingester';
const CONCURRENCY = 4;
const MAX_RETRIES = 5;
const TIMEOUT_MS = 30_000;
const REQUEST_DELAY_MS = 300;
const REQUEST_JITTER_MS = 200;
const MAX_CRAWL_PAGES = 200;
const ALLOWED_YEARS = new Set([2025, 2026]);
const MIN_RETRY_DELAY_MS = 1_000;
const MAX_RETRY_DELAY_MS = 60_000;
const MIN_MARKDOWN_LENGTH = 30;
const MAX_SITEMAP_DEPTH = 5;
let globalBackoffUntil = 0;

// Cache for URLs that are confirmed NOT 2025/2026 blog posts
// This avoids re-fetching and re-processing pages on subsequent runs
const EXCLUDED_URLS_CACHE_FILE = getPythonPath(
  'src',
  'cairo_coder_tools',
  'ingestion',
  'generated',
  'starknet-blog-excluded-urls.json',
);

/**
 * Simple cache for excluded URLs (non-2025/2026 blog posts).
 * Persists to disk so subsequent runs skip already-checked pages.
 */
class ExcludedUrlsCache {
  private urls: Set<string> = new Set();
  private dirty = false;

  async load(): Promise<void> {
    try {
      const content = await fs.readFile(EXCLUDED_URLS_CACHE_FILE, 'utf8');
      const data = JSON.parse(content);
      if (Array.isArray(data.excludedUrls)) {
        this.urls = new Set(data.excludedUrls);
        logger.info(`Loaded ${this.urls.size} excluded URLs from cache`);
      }
    } catch {
      // Cache file doesn't exist or is invalid - start fresh
      this.urls = new Set();
      logger.debug('No existing excluded URLs cache found, starting fresh');
    }
  }

  async save(): Promise<void> {
    if (!this.dirty) return;
    try {
      const data = {
        updatedAt: new Date().toISOString(),
        excludedUrls: Array.from(this.urls).sort(),
      };
      await fs.writeFile(EXCLUDED_URLS_CACHE_FILE, JSON.stringify(data, null, 2));
      this.dirty = false;
      logger.info(`Saved ${this.urls.size} excluded URLs to cache`);
    } catch (error) {
      logger.warn(`Failed to save excluded URLs cache: ${String(error)}`);
    }
  }

  has(url: string): boolean {
    return this.urls.has(url);
  }

  add(url: string): void {
    if (!this.urls.has(url)) {
      this.urls.add(url);
      this.dirty = true;
    }
  }

  get size(): number {
    return this.urls.size;
  }
}

// Global cache instance
const excludedUrlsCache = new ExcludedUrlsCache();

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

    // Reset global backoff state for fresh crawl
    globalBackoffUntil = 0;

    // Load excluded URLs cache to skip already-checked pages
    await excludedUrlsCache.load();

    const baseUrl = this.config.baseUrl;
    const discoveredUrls = await discoverUrls(baseUrl);

    if (discoveredUrls.length === 0) {
      throw new Error('No URLs discovered for Starknet blog crawl');
    }

    const filteredUrls = filterUrls(discoveredUrls, baseUrl);

    if (filteredUrls.length === 0) {
      throw new Error('No URLs remaining after Starknet blog filtering');
    }

    // Filter out URLs that are already in the excluded cache
    const urlsToProcess = filteredUrls.filter((url) => !excludedUrlsCache.has(url));
    const skippedFromCache = filteredUrls.length - urlsToProcess.length;

    if (skippedFromCache > 0) {
      logger.info(
        `Skipping ${skippedFromCache} URLs from cache, processing ${urlsToProcess.length} URLs`,
      );
    } else {
      logger.info(`Processing ${urlsToProcess.length} Starknet blog URLs`);
    }

    const results = await mapWithConcurrency(
      urlsToProcess,
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

    // Save updated cache
    await excludedUrlsCache.save();

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

        logger.debug(
          `Creating chunk for ${page.name}: title="${chunk.meta.title || page.name}", sourceLink="${sourceLink}"`,
        );

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
    const processed = processUrl(url, base, baseUrl);
    if (!processed || seen.has(processed)) continue;
    seen.add(processed);
    validUrls.push(processed);
  }

  logger.info(`Found ${validUrls.length} valid URLs from sitemap`);
  return validUrls;
}

async function parseSitemap(
  sitemapUrl: string,
  depth = 0,
  visited = new Set<string>(),
): Promise<string[]> {
  if (depth > MAX_SITEMAP_DEPTH) {
    logger.warn(`Sitemap recursion depth exceeded for ${sitemapUrl}`);
    return [];
  }

  const normalizedUrl = sitemapUrl.toLowerCase();
  if (visited.has(normalizedUrl)) {
    logger.debug(`Skipping already visited sitemap: ${sitemapUrl}`);
    return [];
  }
  visited.add(normalizedUrl);

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
      const nested = await parseSitemap(loc, depth + 1, visited);
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
      responseType: 'arraybuffer',
      validateStatus: () => true,
    });

    if (response.status >= 200 && response.status < 300) {
      const contentType = response.headers['content-type'] ?? '';
      const isGzip = /gzip/i.test(contentType) || url.endsWith('.gz');
      const data = response.data;
      let buffer: Buffer;
      if (Buffer.isBuffer(data)) {
        buffer = data;
      } else if (typeof data === 'string') {
        buffer = Buffer.from(data);
      } else {
        buffer = Buffer.from(data as ArrayBuffer);
      }
      if (isGzip) {
        try {
          return gunzipSync(buffer).toString('utf8');
        } catch (error) {
          logger.debug(`Failed to gunzip sitemap ${url}: ${String(error)}`);
          return null;
        }
      }
      return buffer.toString('utf8');
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
  const startUrl = processUrl(baseUrl, base, baseUrl);
  if (!startUrl) return [];

  const queue: string[] = [startUrl];
  visited.add(startUrl);

  while (queue.length > 0 && visited.size < MAX_CRAWL_PAGES) {
    const current = queue.shift();
    if (!current) continue;

    const html = await fetchHtml(current);
    if (!html) continue;

    const $ = load(html);
    $('a[href], link[href]').each((_, element) => {
      if (visited.size >= MAX_CRAWL_PAGES) return;

      const href = $(element).attr('href');
      if (!href) return;

      const processed = processUrl(href, base, baseUrl, current);
      if (!processed || visited.has(processed)) return;

      visited.add(processed);
      queue.push(processed);
    });
  }

  logger.info(`Discovered ${visited.size} pages by crawling`);
  return Array.from(visited);
}

function filterUrls(urls: string[], baseUrl: string): string[] {
  const base = new URL(baseUrl);
  const seen = new Set<string>();
  const filtered: string[] = [];

  for (const url of urls) {
    const processed = processUrl(url, base, baseUrl);
    if (!processed || !isBlogPostPath(processed, baseUrl)) continue;
    if (seen.has(processed)) continue;
    seen.add(processed);
    filtered.push(processed);
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
    // Add to cache so we don't re-check this URL on future runs
    excludedUrlsCache.add(url);
    return null;
  }

  const cleaned = cleanBlogMarkdown(markdown);
  if (!cleaned || cleaned.length < MIN_MARKDOWN_LENGTH) {
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
      await waitForGlobalBackoff();
      const response = await axios.get(url, {
        headers: { 'User-Agent': USER_AGENT },
        timeout: TIMEOUT_MS,
        validateStatus: () => true,
      });

      const contentType = response.headers['content-type'] ?? '';
      if (response.status === 200 && contentType.includes('text/html')) {
        await sleep(REQUEST_DELAY_MS + randomJitter(REQUEST_JITTER_MS));
        return response.data as string;
      }

      if (response.status === 429 || response.status >= 500) {
        lastError = `Status ${response.status}`;
        const retryAfter = response.headers['retry-after'];
        const delayMs = computeRetryDelay(retryAfter, attempt);
        scheduleGlobalBackoff(delayMs);
        await sleep(delayMs);
        continue;
      }

      // Log non-retryable failures (404, 403, etc.) for debugging stale sitemap entries
      if (response.status !== 200) {
        logger.debug(`Non-retryable status ${response.status} for ${url}`);
      } else if (!contentType.includes('text/html')) {
        logger.debug(`Non-HTML content-type "${contentType}" for ${url}`);
      }
      return null;
    } catch (error) {
      lastError = String(error);
      const delayMs = computeRetryDelay(undefined, attempt);
      scheduleGlobalBackoff(delayMs);
      await sleep(delayMs);
    }
  }

  logger.debug(
    `Failed to fetch ${url} after ${MAX_RETRIES} attempts: ${lastError}`,
  );
  return null;
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

  const publishedYear = extractPublishedYearFromDom($);

  $(
    'script, style, noscript, nav, header, footer, aside, img, svg, iframe',
  ).remove();

  // Remove boilerplate elements (but never remove html, head, or body)
  $('*')
    .not('html, head, body')
    .each((_, element) => {
      const node = $(element);
      const idClass = `${node.attr('id') ?? ''} ${node.attr('class') ?? ''}`.toLowerCase();
      if (BOILERPLATE_KEYWORDS.some((keyword) => idClass.includes(keyword))) {
        node.remove();
      }
    });

  let mainContent: Cheerio<AnyNode> | null = null;

  // Try main content selectors first
  for (const selector of MAIN_CONTENT_SELECTORS) {
    const element = $(selector).first();
    if (element.length && element.text().trim().length > 100) {
      mainContent = element;
      break;
    }
  }

  // Fallback: find largest content div (excluding nav/sidebar/etc)
  if (!mainContent) {
    let bestDiv = null;
    let bestLength = 0;
    $('div').each((_, element) => {
      const node = $(element);
      const textLength = node.text().trim().length;
      if (textLength < 200) return;

      const idClass = `${node.attr('id') ?? ''} ${node.attr('class') ?? ''}`.toLowerCase();
      if (
        ['nav', 'menu', 'sidebar', 'header', 'footer'].some((kw) =>
          idClass.includes(kw),
        )
      ) {
        return;
      }

      if (textLength > bestLength) {
        bestLength = textLength;
        bestDiv = node;
      }
    });
    mainContent = bestDiv;
  }

  // Last resort: use body
  mainContent = mainContent ?? $('body').first();

  const htmlFragment = mainContent ? ($.html(mainContent) ?? '') : '';
  const markdown = NodeHtmlMarkdown.translate(htmlFragment);
  const normalizedMarkdown = normalizeMarkdown(markdown);
  const finalPublishedYear =
    publishedYear ?? extractPublishedYearFromMarkdown(normalizedMarkdown);

  return {
    markdown: normalizedMarkdown,
    title,
    publishedYear: finalPublishedYear,
  };
}

function extractPublishedYearFromDom(
  $: ReturnType<typeof load>,
): number | null {
  // Try meta tags
  for (const selector of PUBLISHED_META_SELECTORS) {
    const year = parseYear($(selector).attr('content'));
    if (year) return year;
  }

  // Try <time> elements
  const timeYear = parseYear($('time[datetime]').first().attr('datetime')) ??
    parseYear($('time').first().text());
  if (timeYear) return timeYear;

  // Try JSON-LD structured data
  return extractPublishedYearFromJsonLd($);
}

function extractPublishedYearFromMarkdown(markdown: string): number | null {
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

  // Remove "This article was also published on..." line
  cleaned = cleaned.replace(
    /This article was also published on[^\n]*\.?\n*/gi,
    '',
  );

  // Remove Author section (typically "Author" followed by name and bio)
  cleaned = cleaned.replace(
    /#{0,6}\s*Authors?\s*\n[\s\S]*?(?=#{1,6}\s|\n{3,}|$)/gi,
    '',
  );

  // Truncate at "Join our newsletter" - everything after is boilerplate
  const newsletterIdx = cleaned.search(/Join our newsletter/i);
  if (newsletterIdx !== -1) {
    cleaned = cleaned.slice(0, newsletterIdx);
  }

  // Truncate at "May also interest you" - everything after is related posts
  const mayInterestIdx = cleaned.search(/May also interest you/i);
  if (mayInterestIdx !== -1) {
    cleaned = cleaned.slice(0, mayInterestIdx);
  }

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

function isBlogPostPath(url: string, baseUrl: string): boolean {
  const basePath = new URL(baseUrl).pathname.replace(/\/$/, '');
  const path = new URL(url).pathname.replace(/\/$/, '');
  if (path === basePath) return false;
  if (!path.startsWith(basePath)) return false;

  const remainder = path.slice(basePath.length).replace(/^\/+/, '');
  return remainder.length > 0 && !remainder.startsWith('page/');
}

/**
 * Process URL: normalize, validate, and canonicalize in one pass.
 * Returns the canonical URL string if valid, null otherwise.
 */
function processUrl(
  url: string,
  base: URL,
  baseUrl: string,
  currentUrl?: string,
): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url, currentUrl);
  } catch {
    return null;
  }

  // Normalize: remove hash and query params, trailing slash
  parsed.hash = '';
  parsed.search = '';

  // Canonicalize: force protocol and host to match base
  parsed.protocol = base.protocol;
  const parsedHost = parsed.host.startsWith('www.')
    ? parsed.host.slice(4)
    : parsed.host;
  const baseHost = base.host.startsWith('www.') ? base.host.slice(4) : base.host;

  // Validate: must be same host and under base path
  if (parsedHost !== baseHost) return null;

  const basePath = base.pathname.replace(/\/$/, '');
  const urlPath = parsed.pathname.replace(/\/$/, '');
  if (basePath && !urlPath.startsWith(basePath)) return null;

  // Check exclusion patterns
  if (
    DEFAULT_EXCLUDE_PATTERNS.some((pattern) => pattern.test(parsed.pathname))
  ) {
    return null;
  }

  parsed.host = base.host;
  const normalized = parsed.toString();
  return normalized.endsWith('/') && parsed.pathname !== '/'
    ? normalized.slice(0, -1)
    : normalized;
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

function computeRetryDelay(
  retryAfter: string | number | undefined,
  attempt: number,
): number {
  let delayMs = 2 ** attempt * 1000; // Exponential backoff default

  if (retryAfter !== undefined) {
    const raw = String(retryAfter).trim();
    const seconds = Number.parseInt(raw, 10);

    if (!Number.isNaN(seconds)) {
      delayMs = seconds * 1000;
    } else {
      const parsedDate = Date.parse(raw);
      if (!Number.isNaN(parsedDate)) {
        delayMs = parsedDate - Date.now();
      }
    }
  }

  return Math.max(MIN_RETRY_DELAY_MS, Math.min(delayMs, MAX_RETRY_DELAY_MS));
}

function scheduleGlobalBackoff(delayMs: number): void {
  const target = Date.now() + delayMs + randomJitter(delayMs * 0.1);
  if (target > globalBackoffUntil) {
    globalBackoffUntil = target;
  }
}

async function waitForGlobalBackoff(): Promise<void> {
  const now = Date.now();
  if (globalBackoffUntil > now) {
    await sleep(globalBackoffUntil - now);
  }
}

function randomJitter(maxJitterMs: number): number {
  if (maxJitterMs <= 0) return 0;
  return Math.floor(Math.random() * maxJitterMs);
}

function extractPublishedYearFromJsonLd(
  $: ReturnType<typeof load>,
): number | null {
  const scripts = $('script[type="application/ld+json"]');
  for (const element of scripts.toArray()) {
    const text = $(element).text().trim();
    if (!text) continue;

    try {
      const parsed = JSON.parse(text);
      const year = findYearInJsonLd(parsed, 0);
      if (year) return year;
    } catch {
      continue;
    }
  }
  return null;
}

function findYearInJsonLd(value: unknown, depth: number): number | null {
  if (depth > 6 || !value || typeof value !== 'object') return null;

  if (Array.isArray(value)) {
    for (const entry of value) {
      const year = findYearInJsonLd(entry, depth + 1);
      if (year) return year;
    }
    return null;
  }

  const record = value as Record<string, unknown>;

  // Check date fields first (most likely to have publication date)
  for (const key of ['datePublished', 'dateCreated', 'dateModified']) {
    if (typeof record[key] === 'string') {
      const year = parseYear(record[key] as string);
      if (year) return year;
    }
  }

  // Check @graph property (common in JSON-LD)
  if (record['@graph']) {
    const year = findYearInJsonLd(record['@graph'], depth + 1);
    if (year) return year;
  }

  // Recursively check all other values
  for (const val of Object.values(record)) {
    const year = findYearInJsonLd(val, depth + 1);
    if (year) return year;
  }

  return null;
}

export const __testing = {
  cleanBlogMarkdown,
  ensureTitleInMarkdown,
  extractContent,
};
