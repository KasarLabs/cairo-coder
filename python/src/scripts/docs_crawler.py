#!/usr/bin/env python3
"""Documentation Snapshot Crawler - Extract clean documentation content from websites."""

import argparse
import asyncio
import logging
import re
import xml.etree.ElementTree as ET
from collections import deque
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
from urllib.parse import urljoin, urlparse, urlunparse

import aiohttp
from bs4 import BeautifulSoup
from markdownify import markdownify
from tqdm.asyncio import tqdm

# Configuration
UA = "NotebookLM-prep-crawler/1.1 (+contact: you@example.com)"
OUT_FILE = Path("doc_dump")
CONCURRENCY = 4  # Reduced from 6 to avoid rate limits
MAX_RETRIES = 5
TIMEOUT = 30
MAX_CRAWL_PAGES = 100

# URL patterns to exclude (non-documentation paths)
EXCLUDE_PATTERNS = [
    r'/admin', r'/api/', r'/login', r'/search', r'/tag/', r'/category/',
    r'/author/', r'/user/', r'/wp-admin', r'/wp-content', r'/wp-includes',
    r'/_next/', r'/static/', r'/assets/', r'/js/', r'/css/', r'/images/',
    r'/feed', r'/rss', r'/atom', r'/sitemap', r'/robots\.txt',
    r'mailto:', r'tel:', r'/#', r'\.css$'
]

# Common documentation content selectors
DOC_SELECTORS = [
    'main', 'article', '[role="main"]', '.content', '.doc-content',
    '.gitbook-page', '.markdown-body', '.docs-content', '.documentation',
    '.post-content', '.entry-content', '.page-content', '#content',
    '.container-fluid', '.container', '.wrapper'
]

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class DocsCrawler:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip('/') + '/'
        self.domain = urlparse(self.base_url).netloc
        self.discovered_urls: list[str] = []
        self.fetched_pages: dict[str, dict] = {}
        self.session: Optional[aiohttp.ClientSession] = None
        self.semaphore = asyncio.Semaphore(CONCURRENCY)

    async def __aenter__(self):
        timeout = aiohttp.ClientTimeout(total=TIMEOUT)
        self.session = aiohttp.ClientSession(
            headers={'User-Agent': UA},
            timeout=timeout
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    def is_valid_url(self, url: str) -> bool:
        """Check if URL should be included."""
        parsed = urlparse(url)
        base_parsed = urlparse(self.base_url)

        # Same host only
        if parsed.netloc != base_parsed.netloc:
            return False

        # Must be a child of the base URL path
        base_path = base_parsed.path.rstrip('/')
        url_path = parsed.path.rstrip('/')
        if base_path and not url_path.startswith(base_path):
            return False

        # No query strings
        if parsed.query:
            return False

        # Check exclude patterns
        path = parsed.path
        return not any(re.search(pattern, path, re.IGNORECASE) for pattern in EXCLUDE_PATTERNS)

    def normalize_url(self, url: str) -> str:
        """Remove fragment and normalize URL."""
        parsed = urlparse(url)
        return urlunparse(parsed._replace(fragment=''))

    async def fetch_sitemap(self, url: str) -> Optional[str]:
        """Fetch a sitemap XML file."""
        try:
            async with self.session.get(url) as response:
                if response.status == 200:
                    return await response.text()
        except Exception as e:
            logger.debug(f"Failed to fetch sitemap {url}: {e}")
        return None

    async def parse_sitemap(self, sitemap_url: str) -> list[str]:
        """Parse sitemap and extract URLs, handling nested sitemaps."""
        urls = []
        sitemap_content = await self.fetch_sitemap(sitemap_url)

        if not sitemap_content:
            return urls

        try:
            root = ET.fromstring(sitemap_content)

            # Handle sitemap index (nested sitemaps)
            sitemap_locs = root.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}sitemap/{http://www.sitemaps.org/schemas/sitemap/0.9}loc')
            if sitemap_locs:
                logger.info(f"Found sitemap index with {len(sitemap_locs)} nested sitemaps")
                for loc in sitemap_locs:
                    nested_urls = await self.parse_sitemap(loc.text)
                    urls.extend(nested_urls)

            # Handle regular urlset
            url_locs = root.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}url/{http://www.sitemaps.org/schemas/sitemap/0.9}loc')
            urls.extend([loc.text for loc in url_locs if loc.text])

        except ET.ParseError as e:
            logger.error(f"Failed to parse sitemap: {e}")

        return urls

    async def discover_urls_from_sitemap(self) -> list[str]:
        """Try to discover URLs from sitemap."""
        sitemap_url = urljoin(self.base_url, '/sitemap.xml')
        logger.info(f"Checking for sitemap at: {sitemap_url}")

        urls = await self.parse_sitemap(sitemap_url)

        # Filter and normalize URLs
        valid_urls = []
        seen = set()

        for url in urls:
            if self.is_valid_url(url):
                normalized = self.normalize_url(url)
                if normalized not in seen:
                    seen.add(normalized)
                    valid_urls.append(normalized)

        logger.info(f"Found {len(valid_urls)} valid URLs from sitemap")
        return valid_urls

    async def crawl_page(self, url: str, visited: set[str]) -> set[str]:
        """Crawl a single page and extract links."""
        new_urls = set()

        try:
            async with self.session.get(url) as response:
                if response.status != 200:
                    return new_urls

                html = await response.text()
                soup = BeautifulSoup(html, 'lxml')

                # Extract all links
                for tag in soup.find_all(['a', 'link']):
                    href = tag.get('href')
                    if href:
                        absolute_url = urljoin(url, href)
                        normalized = self.normalize_url(absolute_url)

                        if (self.is_valid_url(normalized) and
                            normalized not in visited and
                            len(visited) + len(new_urls) < MAX_CRAWL_PAGES):
                            new_urls.add(normalized)

        except Exception as e:
            logger.debug(f"Failed to crawl {url}: {e}")

        return new_urls

    async def discover_urls_by_crawling(self) -> list[str]:
        """Fallback: discover URLs by crawling from base URL."""
        logger.info("Falling back to crawling...")

        visited = set()
        queue = deque([self.base_url])
        visited.add(self.base_url)

        while queue and len(visited) < MAX_CRAWL_PAGES:
            current_url = queue.popleft()
            new_urls = await self.crawl_page(current_url, visited)

            for url in new_urls:
                if url not in visited:
                    visited.add(url)
                    queue.append(url)

        logger.info(f"Discovered {len(visited)} pages by crawling")
        return list(visited)

    def sort_urls_logically(self, urls: list[str]) -> list[str]:
        """Sort URLs in logical order for documentation."""
        def sort_key(url: str) -> tuple:
            parsed = urlparse(url)
            path = parsed.path.strip('/')

            # Special cases for root/home pages
            if not path or path in ['docs', 'documentation']:
                return (0, 0, path)

            segments = path.split('/')
            # Main section (first segment), depth, full path
            main_section = segments[0] if segments else ''
            return (1, len(segments), main_section, path)

        return sorted(urls, key=sort_key)

    async def fetch_page(self, url: str) -> dict:
        """Fetch a single page with retries."""
        async with self.semaphore:
            for attempt in range(MAX_RETRIES):
                try:
                    async with self.session.get(url) as response:
                        content_type = response.headers.get('Content-Type', '')

                        if response.status == 200 and 'text/html' in content_type:
                            html = await response.text()
                            return {
                                'url': url,
                                'status': response.status,
                                'content': html,
                                'error': None
                            }
                        return {
                            'url': url,
                            'status': response.status,
                            'content': None,
                            'error': f"Status {response.status} or non-HTML content"
                        }

                except asyncio.TimeoutError:
                    error = "Timeout"
                except Exception as e:
                    error = str(e)

                if attempt < MAX_RETRIES - 1:
                    await asyncio.sleep(2 ** attempt)  # Exponential backoff

            return {
                'url': url,
                'status': None,
                'content': None,
                'error': error
            }

    def extract_content(self, html: str, url: str) -> tuple[str, str]:
        """Extract main content from HTML and convert to Markdown."""
        soup = BeautifulSoup(html, 'lxml')

        # Get title
        title_tag = soup.find('title')
        title = title_tag.get_text(strip=True) if title_tag else urlparse(url).path

        # Remove boilerplate elements
        for tag in soup.find_all(['script', 'style', 'noscript', 'nav',
                                 'header', 'footer', 'aside', 'img', 'svg', 'iframe']):
            tag.decompose()

        # Try to find main content
        main_content = None

        # Strategy 1: Common doc selectors
        for selector in DOC_SELECTORS:
            element = soup.select_one(selector)
            if element and len(element.get_text(strip=True)) > 100:
                main_content = element
                break

        # Strategy 2: Largest div
        if not main_content:
            all_divs = soup.find_all('div')
            valid_divs = [
                div for div in all_divs
                if len(div.get_text(strip=True)) > 200 and
                not any(kw in (div.get('class', []) + [div.get('id', '')])
                       for kw in ['nav', 'menu', 'sidebar', 'header', 'footer'])
            ]
            if valid_divs:
                main_content = max(valid_divs, key=lambda d: len(d.get_text(strip=True)))

        # Strategy 3: Fallback to body
        if not main_content:
            main_content = soup.find('body') or soup

        # Convert to markdown
        markdown = markdownify(str(main_content), heading_style="ATX", strip=['a'])

        # Clean up markdown
        markdown = re.sub(r'\n{3,}', '\n\n', markdown)  # Multiple newlines
        markdown = re.sub(r'^---+\n', '', markdown)  # Leading separators
        markdown = re.sub(r'^\.\.\.+\n', '', markdown)  # YAML-like markers

        return title, markdown.strip()

    async def fetch_all_pages(self) -> None:
        """Fetch all discovered pages concurrently."""
        logger.info(f"Fetching {len(self.discovered_urls)} pages...")

        tasks = [self.fetch_page(url) for url in self.discovered_urls]

        results = []
        for f in tqdm.as_completed(tasks, total=len(tasks)):
            result = await f
            results.append(result)

        # Store results in order
        url_to_result = {r['url']: r for r in results}
        for url in self.discovered_urls:
            self.fetched_pages[url] = url_to_result.get(url, {})

    def compile_markdown(self) -> str:
        """Compile all pages into a single Markdown document."""
        logger.info("Compiling markdown...")

        # Document header
        date_str = datetime.now(timezone.utc).strftime('%Y-%m-%d')
        lines = [
            f"# {self.domain} — Snapshot ({date_str})",
            "",
            "Clean documentation content extracted from sitemap.",
            "",
            "---",
            ""
        ]

        # Process each page
        for url in self.discovered_urls:
            page_data = self.fetched_pages.get(url, {})

            if page_data.get('content'):
                title, markdown = self.extract_content(page_data['content'], url)

                if not markdown or len(markdown.strip()) < 50:
                    markdown = "*No content extracted.*"

                lines.extend([
                    f"**Source URL:** {url}",
                    "",
                    f"## {title}",
                    "",
                    markdown,
                    "",
                    "---",
                    ""
                ])
            else:
                # Skip pages that failed to fetch or returned non-HTML content
                error = page_data.get('error', 'Unknown error')
                logger.info(f"Skipping {url}: {error}")

        return '\n'.join(lines)

    async def run(self) -> None:
        """Main execution flow."""
        logger.info(f"Starting documentation crawler for: {self.base_url}")

        # Discovery phase
        self.discovered_urls = await self.discover_urls_from_sitemap()

        if not self.discovered_urls:
            self.discovered_urls = await self.discover_urls_by_crawling()
            self.discovered_urls = self.sort_urls_logically(self.discovered_urls)

        if not self.discovered_urls:
            logger.error("No URLs discovered!")
            return

        logger.info(f"Processing {len(self.discovered_urls)} URLs in order:")
        for i, url in enumerate(self.discovered_urls[:10], 1):
            logger.info(f"  {i}. {url}")
        if len(self.discovered_urls) > 10:
            logger.info(f"  ... and {len(self.discovered_urls) - 10} more")

        # Fetch phase
        await self.fetch_all_pages()

        # Compile and save
        markdown_content = self.compile_markdown()

        # Save markdown
        markdown_path = OUT_FILE.with_suffix('.md')
        logger.info(f"Saving markdown to: {markdown_path}")
        markdown_path.write_text(markdown_content, encoding='utf-8')
        logger.info(f"Markdown file size: {len(markdown_content):,} bytes")


def main():
    parser = argparse.ArgumentParser(
        description="Documentation Snapshot Crawler - Extract clean documentation content from websites",
        epilog="""
Examples:
  uv run docs-crawler https://docs.example.com
        """,
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument('base_url', help='Base URL of the documentation site (e.g., https://docs.example.com)')

    args = parser.parse_args()

    async def run_crawler(base_url: str):
        async with DocsCrawler(base_url) as crawler:
            await crawler.run()
    return asyncio.run(run_crawler(args.base_url))


if __name__ == '__main__':
    main()
