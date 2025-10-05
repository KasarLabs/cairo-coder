from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

import structlog

from .base_summarizer import BaseSummarizer
from .dpsy_summarizer import (
    configure_dspy,
    generate_markdown_toc,
    make_chunks,
    massively_summarize,
)

logger = structlog.get_logger(__name__)


@dataclass
class _DocPage:
    url: str
    content: str


class DocDumpSummarizer(BaseSummarizer):
    """Summarizer that reads a single doc-dump markdown file (with repeated '**Source URL:** ...' sections)
    and produces a hierarchical summary with per-section source URL lists.
    """

    def __init__(self, config):
        super().__init__(config)
        self._pages: list[_DocPage] = []

    def clone_repository(self) -> Path:
        """No-op clone for local files: return CWD as a base path."""
        return Path.cwd()

    def build_documentation(self, repo_path: Path) -> Path:
        """Treat repo_url as a path to the doc_dump markdown file."""
        doc_path = Path(self.config.repo_url)
        if not doc_path.exists():
            raise RuntimeError(f"Doc dump file not found: {doc_path}")
        if doc_path.suffix.lower() not in (".md", ".markdown"):
            logger.warning(f"Provided path does not look like markdown: {doc_path}")
        return doc_path

    def extract_and_merge_content(self, docs_path: Path) -> str:
        """Read and parse the doc dump into pages; return the raw text for optional downstream use."""
        text = docs_path.read_text()
        self._pages = self._parse_doc_dump(text)
        logger.info(f"Parsed {len(self._pages)} pages from doc dump")
        return text

    def summarize_content(self, content: str) -> str:
        """Chunk per page with URL metadata, summarize, then insert ToC and per-section sources."""
        if not self._pages:
            self._pages = self._parse_doc_dump(content)

        # Configure DSPy
        configure_dspy()

        # Build chunks and parallel metadata
        chunks: list[str] = []
        metas: list[dict] = []
        for page in self._pages:
            page_chunks = make_chunks(page.content, target_chunk_size=2000)
            chunks.extend(page_chunks)
            metas.extend({"source_url": page.url} for _ in page_chunks)

        if not chunks:
            raise RuntimeError("No chunks produced from doc dump")

        # Title from first page base
        title = self._infer_title(self._pages)
        logger.info(f"Summarizing {len(chunks)} chunks from doc dump into {self.config.output_path}")

        summary = massively_summarize(toc_path=[title], chunks=chunks, metas=metas)

        # Insert a Table of Contents below the top title
        lines = summary.splitlines()
        if lines and lines[0].lstrip().startswith('#'):
            toc_md = generate_markdown_toc(summary, toc_path=[title], max_level=3)
            insertion = ["", "## Table of Contents", "", toc_md, ""] if toc_md else []
            if insertion:
                summary = "\n".join([lines[0]] + insertion + lines[1:])

        return summary

    # Helpers
    @staticmethod
    def _parse_doc_dump(text: str) -> list[_DocPage]:
        """Split the doc dump by '**Source URL:**' markers and return pages."""
        # Find all '**Source URL:** <url>' markers
        pattern = re.compile(r"^\*\*Source URL:\*\*\s+(\S+)", re.MULTILINE)
        pages: list[_DocPage] = []
        matches = list(pattern.finditer(text))
        for i, m in enumerate(matches):
            url = m.group(1)
            start = m.end()
            end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
            # Trim surrounding '---' separators and whitespace
            content = text[start:end].strip()
            content = DocDumpSummarizer._strip_leading_trailing_separators(content)
            pages.append(_DocPage(url=url, content=content))
        return pages

    @staticmethod
    def _strip_leading_trailing_separators(s: str) -> str:
        lines = list(s.splitlines())
        # remove leading/trailing lines that are just '---'
        while lines and lines[0].strip() == '---':
            lines.pop(0)
        while lines and lines[-1].strip() == '---':
            lines.pop()
        return "\n".join(lines).strip()

    @staticmethod
    def _infer_title(pages: list[_DocPage]) -> str:
        if not pages:
            return "# Documentation Summary"
        first = pages[0].url.rstrip('/')
        # Use last path segment as name
        seg = first.split('/')[-1] or "documentation"
        name = seg.replace('-', ' ').title()
        return f"# {name} Documentation Summary"

