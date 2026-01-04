import axios from 'axios';
import { afterEach, describe, expect, it, vi } from 'bun:test';
import {
  StarknetBlogIngester,
  __testing,
} from '../src/ingesters/StarknetBlogIngester';
import { type BookPageDto } from '../src/utils/types';

const BASE_URL = 'https://www.starknet.io/blog';
const SITEMAP_URL = 'https://www.starknet.io/sitemap.xml';

type MockResponse = {
  status: number;
  data: string;
  headers: Record<string, string>;
};

class TestStarknetBlogIngester extends StarknetBlogIngester {
  public exposedDownloadAndExtractDocs(): Promise<BookPageDto[]> {
    return this.downloadAndExtractDocs();
  }

  public exposedCreateChunks(
    pages: BookPageDto[],
  ): ReturnType<StarknetBlogIngester['createChunks']> {
    return this.createChunks(pages);
  }
}

const buildHtml = (options: {
  title: string;
  metaDate?: string;
  timeDate?: string;
  headerTimeDate?: string;
  jsonLdDate?: string;
  bodyText?: string;
}): string => {
  const { title, metaDate, timeDate, headerTimeDate, jsonLdDate, bodyText } =
    options;
  return `<!doctype html>
<html>
<head>
  <title>${title}</title>
  ${metaDate ? `<meta property="article:published_time" content="${metaDate}">` : ''}
  ${jsonLdDate ? `<script type="application/ld+json">${JSON.stringify({ datePublished: jsonLdDate })}</script>` : ''}
</head>
<body>
  ${headerTimeDate ? `<header><time datetime="${headerTimeDate}">${headerTimeDate}</time></header>` : ''}
  <main>
    <h1>${title}</h1>
    ${timeDate ? `<time datetime="${timeDate}">${timeDate}</time>` : ''}
    <p>${bodyText ?? 'Body content goes here.'}</p>
    <h2>Join our newsletter</h2>
    <p>Subscribe for updates.</p>
    <h2>May also interest you</h2>
    <p>Other posts.</p>
  </main>
</body>
</html>`;
};

const buildSitemap = (
  urls: string[],
): string => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${url}</loc></url>`).join('\n')}
</urlset>`;

const mockAxiosGet = (responses: Map<string, MockResponse>) => {
  return vi
    .spyOn(axios, 'get')
    .mockImplementation(async (url: string | any) => {
      const key = typeof url === 'string' ? url : String(url);
      const response = responses.get(key);
      if (response) {
        return response as any;
      }

      return {
        status: 404,
        data: '',
        headers: { 'content-type': 'text/html' },
      } as any;
    });
};

describe('StarknetBlogIngester (crawler)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('filters to 2025/2026 posts and strips boilerplate sections', async () => {
    const sitemap = buildSitemap([
      'https://starknet.io/blog/post-2025',
      'https://www.starknet.io/blog/post-2026',
      'https://www.starknet.io/blog/post-2024',
      'https://www.starknet.io/blog',
      'https://www.starknet.io/blog/tag/something',
    ]);

    const responses = new Map<string, MockResponse>([
      [
        SITEMAP_URL,
        {
          status: 200,
          data: sitemap,
          headers: { 'content-type': 'application/xml' },
        },
      ],
      [
        'https://www.starknet.io/blog/post-2025',
        {
          status: 200,
          data: buildHtml({
            title: 'Post 2025',
            metaDate: '2025-05-01T00:00:00Z',
          }),
          headers: { 'content-type': 'text/html' },
        },
      ],
      [
        'https://www.starknet.io/blog/post-2026',
        {
          status: 200,
          data: buildHtml({
            title: 'Post 2026',
            metaDate: '2026-06-01T00:00:00Z',
          }),
          headers: { 'content-type': 'text/html' },
        },
      ],
      [
        'https://www.starknet.io/blog/post-2024',
        {
          status: 200,
          data: buildHtml({
            title: 'Post 2024',
            metaDate: '2024-03-01T00:00:00Z',
          }),
          headers: { 'content-type': 'text/html' },
        },
      ],
    ]);

    mockAxiosGet(responses);

    const ingester = new TestStarknetBlogIngester();
    const pages = await ingester.exposedDownloadAndExtractDocs();

    expect(pages.map((page) => page.name).sort()).toEqual([
      'post-2025',
      'post-2026',
    ]);

    pages.forEach((page) => {
      expect(page.content).not.toContain('Join our newsletter');
      expect(page.content).not.toContain('May also interest you');
      expect(page.content.toLowerCase()).not.toContain('newsletter');
      expect(page.content.toLowerCase()).not.toContain('may also interest you');
      expect(page.content).not.toMatch(/(^|\n)#+\s*Authors?\b/i);
      expect(page.content.startsWith('# ')).toBe(true);
    });
  });

  it.each([
    {
      label: 'meta tag',
      html: buildHtml({
        title: 'Meta Date',
        metaDate: '2025-02-10T00:00:00Z',
      }),
    },
    {
      label: 'time element',
      html: buildHtml({
        title: 'Time Date',
        timeDate: '2026-04-12T00:00:00Z',
      }),
    },
    {
      label: 'json-ld',
      html: buildHtml({
        title: 'JsonLd Date',
        jsonLdDate: '2025-11-01T00:00:00Z',
      }),
    },
    {
      label: 'header time element',
      html: buildHtml({
        title: 'Header Time',
        headerTimeDate: '2025-08-09T00:00:00Z',
      }),
    },
    {
      label: 'markdown text',
      html: buildHtml({
        title: 'Text Date',
        bodyText: 'Apr 3, 2025 · 3 min read',
      }),
    },
  ])('includes posts when year is detected via $label', async ({ html }) => {
    const sitemap = buildSitemap(['https://www.starknet.io/blog/year-test']);
    const responses = new Map<string, MockResponse>([
      [
        SITEMAP_URL,
        {
          status: 200,
          data: sitemap,
          headers: { 'content-type': 'application/xml' },
        },
      ],
      [
        'https://www.starknet.io/blog/year-test',
        {
          status: 200,
          data: html,
          headers: { 'content-type': 'text/html' },
        },
      ],
    ]);

    mockAxiosGet(responses);

    const ingester = new TestStarknetBlogIngester();
    const pages = await ingester.exposedDownloadAndExtractDocs();

    expect(pages).toHaveLength(1);
    expect(pages[0]?.name).toBe('year-test');
    expect(pages[0]?.content).not.toContain('Join our newsletter');
    expect(pages[0]?.content).not.toContain('May also interest you');
    expect(pages[0]?.content?.toLowerCase()).not.toContain('newsletter');
    expect(pages[0]?.content?.toLowerCase()).not.toContain(
      'may also interest you',
    );
    expect(pages[0]?.content).not.toMatch(/(^|\n)#+\s*Authors?\b/i);
  });

  it('creates chunks with page-scoped source links and stable IDs', async () => {
    const ingester = new TestStarknetBlogIngester();
    const pages: BookPageDto[] = [
      {
        name: 'posts/2025/hello-world',
        content: '# Hello World\n\nSome content here.',
      },
      {
        name: 'scaling-bitcoin',
        content:
          '# Scaling Bitcoin\n\n## Overview\n\nContent about Bitcoin.\n\n## Technical Details\n\nMore details here.',
      },
    ];

    const chunks = await ingester.exposedCreateChunks(pages);

    expect(chunks.length).toBeGreaterThan(0);
    chunks.forEach((chunk) => {
      // Verify sourceLink is never undefined or empty
      expect(chunk.metadata.sourceLink).toBeDefined();
      expect(chunk.metadata.sourceLink).not.toBe('');
      expect(chunk.metadata.sourceLink).toContain(
        'https://www.starknet.io/blog/',
      );

      // Verify sourceLink matches the page name
      expect(chunk.metadata.sourceLink).toContain(chunk.metadata.name);

      // Verify uniqueId starts with the correct prefix
      expect(chunk.metadata.uniqueId).toContain('starknet-blog-');
    });

    // Test specific page sources
    const helloWorldChunks = chunks.filter(
      (c) => c.metadata.name === 'posts/2025/hello-world',
    );
    expect(helloWorldChunks.length).toBeGreaterThan(0);
    helloWorldChunks.forEach((chunk) => {
      expect(chunk.metadata.sourceLink).toBe(
        'https://www.starknet.io/blog/posts/2025/hello-world',
      );
    });

    const scalingBitcoinChunks = chunks.filter(
      (c) => c.metadata.name === 'scaling-bitcoin',
    );
    expect(scalingBitcoinChunks.length).toBeGreaterThan(0);
    scalingBitcoinChunks.forEach((chunk) => {
      expect(chunk.metadata.sourceLink).toBe(
        'https://www.starknet.io/blog/scaling-bitcoin',
      );
    });
  });
});

describe('StarknetBlogIngester (real page integration)', () => {
  const REAL_PAGE_URL =
    'https://www.starknet.io/blog/starknet-2025-year-in-review';
  const REAL_PAGE_URL_SLASH = `${REAL_PAGE_URL}/`;
  const REAL_PAGE_NAME = 'starknet-2025-year-in-review';

  it(
    'processes real page through ingester extraction logic',
    async () => {
      const realResponse = await axios.get(REAL_PAGE_URL_SLASH, {
        headers: { 'User-Agent': 'cairo-coder-ingester-test' },
        timeout: 30000,
      });

      expect(realResponse.status).toBe(200);
      const html = realResponse.data as string;
      expect(html).toContain('Starknet');

      vi.spyOn(axios, 'get').mockImplementation(
        async (url: string | any, config?: any) => {
          const key = typeof url === 'string' ? url : String(url);
          if (key === SITEMAP_URL) {
            return {
              status: 200,
              data: buildSitemap([REAL_PAGE_URL_SLASH]),
              headers: { 'content-type': 'application/xml' },
            } as any;
          }

          if (key === REAL_PAGE_URL || key === REAL_PAGE_URL_SLASH) {
            return {
              status: 200,
              data: html,
              headers: { 'content-type': 'text/html' },
            } as any;
          }

          return {
            status: 404,
            data: '',
            headers: { 'content-type': 'text/html' },
          } as any;
        },
      );

      const ingester = new TestStarknetBlogIngester();
      const pages = await ingester.exposedDownloadAndExtractDocs();
      const page = pages.find((entry) => entry.name === REAL_PAGE_NAME);

      const { markdown, title, publishedYear } = __testing.extractContent(
        html,
        REAL_PAGE_URL,
      );
      const cleaned = __testing.cleanBlogMarkdown(markdown);
      const expectedContent = __testing.ensureTitleInMarkdown(title, cleaned);

      expect(title).toContain('Starknet');
      expect(publishedYear).toBe(2025);

      expect(page).toBeDefined();
      expect(page?.content.startsWith('# ')).toBe(true);
      expect(page?.content).toContain('Starknet');
      expect(page?.content).toContain('2025');
      expect(page?.content).not.toContain('Join our newsletter');
      expect(page?.content).not.toContain('May also interest you');
      expect(page?.content.toLowerCase()).not.toContain('newsletter');
      expect(page?.content.toLowerCase()).not.toContain(
        'may also interest you',
      );
      expect(page?.content).not.toMatch(/(^|\n)#+\s*Authors?\b/i);
      expect(page?.content).toBe(expectedContent);
      expect(expectedContent.toLowerCase()).not.toContain('newsletter');
      expect(expectedContent.toLowerCase()).not.toContain(
        'may also interest you',
      );
      expect(expectedContent).not.toMatch(/(^|\n)#+\s*Authors?\b/i);
    },
    { timeout: 30000 },
  );
});
