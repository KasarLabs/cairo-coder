import axios from 'axios';
import { beforeEach, afterEach, describe, expect, it, vi } from 'bun:test';
import { StarknetBlogIngester } from '../src/ingesters/StarknetBlogIngester';
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
  bodyText?: string;
}): string => {
  const { title, metaDate, timeDate, bodyText } = options;
  return `<!doctype html>
<html>
<head>
  <title>${title}</title>
  ${metaDate ? `<meta property="article:published_time" content="${metaDate}">` : ''}
</head>
<body>
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

const buildSitemap = (urls: string[]): string => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${url}</loc></url>`).join('\n')}
</urlset>`;

const mockAxiosGet = (responses: Map<string, MockResponse>) => {
  return vi.spyOn(axios, 'get').mockImplementation(async (url) => {
    const key = typeof url === 'string' ? url : url.toString();
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
  beforeEach(() => {
    vi.restoreAllMocks();
  });

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
  });

  it('creates chunks with page-scoped source links and stable IDs', async () => {
    const ingester = new TestStarknetBlogIngester();
    const pages: BookPageDto[] = [
      {
        name: 'posts/2025/hello-world',
        content: '# Hello World\n\nSome content here.',
      },
    ];

    const chunks = await ingester.exposedCreateChunks(pages);

    expect(chunks.length).toBeGreaterThan(0);
    chunks.forEach((chunk) => {
      expect(chunk.metadata.name).toBe('posts/2025/hello-world');
      expect(chunk.metadata.sourceLink).toBe(
        'https://www.starknet.io/blog/posts/2025/hello-world',
      );
      expect(chunk.metadata.uniqueId.startsWith('starknet-blog-posts-2025-hello-world-')).toBe(
        true,
      );
    });
  });
});
