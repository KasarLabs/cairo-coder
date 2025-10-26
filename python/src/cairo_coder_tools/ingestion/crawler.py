#!/usr/bin/env python3
"""Documentation Snapshot Crawler - Extract clean documentation content from websites."""

import asyncio
import logging
import os
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

from cairo_coder_tools.ingestion.web_targets import IWebsiteTarget

# Configuration
UA = "starknet-prep-crawler"
OUT_FILE = Path("doc_dump")
CONCURRENCY = 4
MAX_RETRIES = 6
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

# Respect LOG_LEVEL env var (e.g., DEBUG, INFO, WARNING)
_env_level = getattr(logging, str(os.environ.get("LOG_LEVEL", "INFO")).upper(), logging.INFO)
logging.basicConfig(level=_env_level, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class DocsCrawler:
    """Web crawler for documentation sites with filtering capabilities.

    Uses an IWebsiteTarget object to define crawling behavior.
    """

    def __init__(self, target: "IWebsiteTarget"):
        """Initialize the crawler.

        Args:
            target: IWebsiteTarget object defining crawling configuration and behavior
        """
        self.target = target
        self.base_url = target.base_url.rstrip('/') + '/'
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
        """Check if URL should be included during discovery (basic validation only)."""
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

        # Check default exclude patterns (common non-content paths)
        path = parsed.path
        return not any(re.search(pattern, path, re.IGNORECASE) for pattern in EXCLUDE_PATTERNS)

    def filter_urls(self, urls: list[str]) -> list[str]:
        """Filter URLs based on include/exclude patterns from the target.

        This is applied AFTER discovery and BEFORE fetching.

        Args:
            urls: List of discovered URLs

        Returns:
            Filtered list of URLs
        """
        filtered_urls = []
        include_patterns = self.target.get_include_url_patterns()
        exclude_patterns = self.target.get_exclude_url_patterns()

        for url in urls:
            parsed = urlparse(url)
            path = parsed.path

            if include_patterns and not any(re.search(pattern, path, re.IGNORECASE) for pattern in include_patterns):
                continue

            if exclude_patterns and any(re.search(pattern, path, re.IGNORECASE) for pattern in exclude_patterns):
                continue

            filtered_urls.append(url)

        return filtered_urls

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
            last_error = "Unknown error"
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

                        # Handle rate limiting (429) and server errors (5xx) with retry
                        if response.status == 429 or response.status >= 500:
                            last_error = f"Status {response.status}"
                            if attempt < MAX_RETRIES - 1:
                                wait_time = 2 ** attempt
                                logger.debug(f"Got {response.status} for {url}, retrying in {wait_time}s (attempt {attempt + 1}/{MAX_RETRIES})")
                                await asyncio.sleep(wait_time)
                                continue
                            logger.debug(f"Failed to fetch {url} after {MAX_RETRIES} attempts: {last_error}")

                        # For other non-200 statuses, return immediately (no retry)
                        return {
                            'url': url,
                            'status': response.status,
                            'content': None,
                            'error': f"Status {response.status} or non-HTML content"
                        }

                except asyncio.TimeoutError:
                    last_error = "Timeout"
                    if attempt < MAX_RETRIES - 1:
                        wait_time = 2 ** attempt
                        logger.debug(f"Timeout for {url}, retrying in {wait_time}s (attempt {attempt + 1}/{MAX_RETRIES})")
                        await asyncio.sleep(wait_time)
                        continue
                except Exception as e:
                    last_error = str(e)
                    if attempt < MAX_RETRIES - 1:
                        wait_time = 2 ** attempt
                        logger.debug(f"Error for {url}: {e}, retrying in {wait_time}s (attempt {attempt + 1}/{MAX_RETRIES})")
                        await asyncio.sleep(wait_time)
                        continue

            # All retries exhausted
            return {
                'url': url,
                'status': None,
                'content': None,
                'error': f"Failed after {MAX_RETRIES} attempts: {last_error}"
            }

    def extract_content(self, html: str, url: str) -> tuple[str, str]:
        """Extract main content from HTML and convert to Markdown."""
        soup = BeautifulSoup(html, 'lxml')

        # Get title
        title_tag = soup.find('title')
        title = title_tag.get_text(strip=True) if title_tag else urlparse(url).path

        # Remove boilerplate elements by tag name
        for tag in soup.find_all(['script', 'style', 'noscript', 'nav',
                                 'header', 'footer', 'aside', 'img', 'svg', 'iframe']):
            tag.decompose()

        # Remove elements with IDs or classes containing boilerplate keywords
        boilerplate_keywords = ['navbar', 'sidebar', 'nav-bar', 'side-bar', 'menu', 'toc', 'breadcrumb']
        # Collect tags to remove first, then decompose them
        tags_to_remove = []
        for tag in soup.find_all(True):  # Find all tags
            tag_id = tag.get('id', '').lower()
            tag_classes = ' '.join(tag.get('class', [])).lower()

            if any(keyword in tag_id or keyword in tag_classes for keyword in boilerplate_keywords):
                tags_to_remove.append(tag)

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
            ""
        ]

        # Process each page
        filtered_out = 0
        for url in self.discovered_urls:
            page_data = self.fetched_pages.get(url, {})

            if page_data.get('content'):
                title, markdown = self.extract_content(page_data['content'], url)

                # Apply content filter from target
                if not self.target.filter_content(markdown):
                    filtered_out += 1
                    continue

                # Apply content processor from target (e.g., remove unwanted sections)
                markdown = self.target.process_content(markdown)

                if not markdown or len(markdown.strip()) < 50:
                    markdown = "*No content extracted.*"

                # Add individual Sources block for this page
                lines.extend([
                    "---",
                    "Sources:",
                    f"  - {url}",
                    "---",
                    "",
                    f"## {title}",
                    "",
                    markdown,
                    "",
                ])
            else:
                # Skip pages that failed to fetch or returned non-HTML content
                error = page_data.get('error', 'Unknown error')
                logger.info(f"Skipping {url}: {error}")

        logger.info(f"Filtered out {filtered_out} pages based on content filter")
        return '\n'.join(lines)

    async def run(self, output_path: Optional[Path] = None) -> Path:
        """Main execution flow.

        Args:
            output_path: Optional output path for the markdown file

        Returns:
            Path to the generated markdown file
        """
        logger.info(f"Starting documentation crawler for: {self.base_url}")

        # Phase 1: Discovery - find all URLs
        self.discovered_urls = await self.discover_urls_from_sitemap()

        if not self.discovered_urls:
            self.discovered_urls = await self.discover_urls_by_crawling()
            self.discovered_urls = self.sort_urls_logically(self.discovered_urls)

        if not self.discovered_urls:
            logger.error("No URLs discovered!")
            raise RuntimeError("No URLs discovered")

        logger.info(f"Discovered {len(self.discovered_urls)} URLs")

        # Phase 2: Filtering - apply include/exclude patterns
        original_count = len(self.discovered_urls)
        self.discovered_urls = self.filter_urls(self.discovered_urls)
        filtered_count = original_count - len(self.discovered_urls)

        if filtered_count > 0:
            logger.info(f"Filtered out {filtered_count} URLs, {len(self.discovered_urls)} remaining")

        if not self.discovered_urls:
            logger.error("No URLs remaining after filtering!")
            raise RuntimeError("No URLs remaining after filtering")

        logger.info(f"Processing {len(self.discovered_urls)} URLs:")
        for i, url in enumerate(self.discovered_urls[:10], 1):
            logger.info(f"  {i}. {url}")
        if len(self.discovered_urls) > 10:
            logger.info(f"  ... and {len(self.discovered_urls) - 10} more")

        # Phase 3: Fetch - download the filtered URLs
        await self.fetch_all_pages()

        # Compile and save
        markdown_content = self.compile_markdown()

        # Save markdown
        output_path = OUT_FILE.with_suffix('.md') if output_path is None else Path(output_path)

        logger.info(f"Saving markdown to: {output_path}")
        output_path.write_text(markdown_content, encoding='utf-8')
        logger.info(f"Markdown file size: {len(markdown_content):,} bytes")

        return output_path
