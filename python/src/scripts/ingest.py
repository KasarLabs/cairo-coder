#!/usr/bin/env python3
"""Data ingestion CLI for Cairo Coder.

This module provides commands for ingesting documentation from various sources
into a format suitable for the RAG pipeline.
"""

import asyncio
import re
import resource
from enum import Enum
from pathlib import Path
from typing import Optional

import structlog
import typer
from dotenv import load_dotenv

from cairo_coder_tools.ingestion.base_summarizer import SummarizerConfig
from cairo_coder_tools.ingestion.crawler import DocsCrawler
from cairo_coder_tools.ingestion.header_fixer import HeaderFixer
from cairo_coder_tools.ingestion.summarizer_factory import DocumentationType, SummarizerFactory


def is_2025_blog_entry(content: str) -> bool:
    """Check if content is a blog entry from 2025.

    Looks for patterns like:
        Home  /  Blog
        Apr 3, 2025 ·    3 min read
    OR
        Home  /  Blog
        Share this post:
        Jul 29, 2025
    """
    import re

    # Pattern 1: Month Day, Year · X min read
    # Example: "Apr 3, 2025 ·    3 min read"
    pattern1 = r'Home\s+/\s+Blog.*?(\w+\s+\d+,\s+(\d{4}))\s*·'

    # Pattern 2: Month Day, Year (without the · min read)
    # Example: "Jul 29, 2025" after "Share this post:"
    pattern2 = r'Home\s+/\s+Blog.*?Share this post:.*?(\w+\s+\d+,\s+(\d{4}))'

    # Pattern 3: Just Month Day, Year with min read
    # Example: "Nov 26, 2024 ·    3 min read"
    pattern3 = r'(\w+\s+\d+,\s+(\d{4}))\s*·.*?min read'

    for pattern in [pattern1, pattern2, pattern3]:
        matches = re.findall(pattern, content, re.DOTALL | re.IGNORECASE)
        for match in matches:
            year = match[1] if len(match) > 1 else match[-1]
            if year == '2025':
                return True

    return False


def clean_blog_content(content: str) -> str:
    """Remove unwanted sections from blog content.

    Removes:
    - "Join our newsletter" section and its content
    - "May also interest you" section and its content
    """
    import re

    # Remove "Join our newsletter" section and everything after it until next header
    # Match any header level (##, ###, ####, etc.)
    content = re.sub(
        r'^#{2,}\s*Join our newsletter.*?(?=^#{2,}|\Z)',
        '',
        content,
        flags=re.DOTALL | re.IGNORECASE | re.MULTILINE
    )

    # Remove "May also interest you" section and everything after it
    # Match any header level (##, ###, ####, etc.)
    content = re.sub(
        r'^#{2,}\s*May also interest you.*?(?=^#{2,}|\Z)',
        '',
        content,
        flags=re.DOTALL | re.IGNORECASE | re.MULTILINE
    )

    # Also try to catch variations without markdown headers (plain text)
    content = re.sub(
        r'Join our newsletter.*?(?=\n\n[A-Z]|\Z)',
        '',
        content,
        flags=re.DOTALL | re.IGNORECASE
    )

    content = re.sub(
        r'May also interest you.*?(?=\n\n[A-Z]|\Z)',
        '',
        content,
        flags=re.DOTALL | re.IGNORECASE
    )

    # Clean up multiple newlines
    content = re.sub(r'\n{3,}', '\n\n', content)

    return content.strip()

# Load environment variables
load_dotenv()

logger = structlog.get_logger(__name__)

app = typer.Typer(help="Cairo Coder Documentation Ingestion CLI")


class TargetRepo(str, Enum):
    """Predefined target repositories for Git ingestion"""

    CORELIB_DOCS = "https://github.com/starkware-libs/cairo-docs"
    CAIRO_BOOK = "https://github.com/cairo-book/cairo-book"
    # Add more repositories as needed


class TargetWebsite(str, Enum):
    """Predefined target websites for web crawling"""

    STARKNET_BLOG_2025 = "https://www.starknet.io/blog"
    # Add more websites as needed


@app.command(name="from-git")
def from_git(
    repo_url: str = typer.Argument(help="GitHub repository URL to summarize."),
    doc_type: DocumentationType = typer.Option(
        DocumentationType.MDBOOK, "--type", "-t", help="Documentation type"
    ),
    branch: Optional[str] = typer.Option(None, "--branch", "-b", help="Git branch to use"),
    subdirectory: Optional[str] = typer.Option(
        None, "--subdirectory", "-s", help="Subdirectory to use"
    ),
    output: Path = typer.Option(Path("summary.md"), "--output", "-o", help="Output file path"),
    verbose: bool = typer.Option(False, "--verbose", "-v", help="Enable verbose output"),
) -> None:
    """Ingest documentation from a Git repository.

    Clones a Git repository, builds the documentation (if needed), and generates
    a consolidated summary using LLM-based summarization.
    """

    # Set file descriptor limit for the current process
    try:
        current_soft, current_hard = resource.getrlimit(resource.RLIMIT_NOFILE)
        new_limit = min(4096, current_hard)  # Don't exceed hard limit
        resource.setrlimit(resource.RLIMIT_NOFILE, (new_limit, current_hard))
        logger.info(f"Raised file descriptor limit from {current_soft} to {new_limit}")
    except (ValueError, OSError) as e:
        logger.warning(f"Could not raise file descriptor limit: {e}")
        logger.warning(
            "You may want to run 'ulimit -n 4096' in your terminal before running this script"
        )

    # Check for predefined targets
    if repo_url.upper().replace("-", "_") in [t.name for t in TargetRepo]:
        target = TargetRepo[repo_url.upper().replace("-", "_")]
        repo_url = target.value
        if verbose:
            typer.echo(f"Using predefined target: {target.name} -> {repo_url}")

    # Create configuration
    config = SummarizerConfig(
        repo_url=repo_url, branch=branch, subdirectory=subdirectory, output_path=output
    )

    # Create and run summarizer
    try:
        typer.echo(f"Creating {doc_type.value} summarizer for {repo_url}...")
        summarizer = SummarizerFactory.create(doc_type, config)

        typer.echo("Processing documentation...")
        if verbose:
            typer.echo(f"  - Cloning from branch: {branch}")
            typer.echo(f"  - Output will be saved to: {output}")

        output_path = summarizer.process()

        typer.echo(
            typer.style(f"✓ Summary successfully generated at: {output_path}", fg=typer.colors.GREEN)
        )

    except Exception as e:
        import traceback

        traceback.print_exc()
        typer.echo(typer.style(f"✗ Error: {str(e)}", fg=typer.colors.RED), err=True)
        raise typer.Exit(code=1) from e


@app.command(name="from-web")
def from_web(
    url: str = typer.Argument(help="Base URL of website to crawl, or predefined target name."),
    output: Path = typer.Option(Path("doc_dump.md"), "--output", "-o", help="Output file path"),
    content_filter: Optional[str] = typer.Option(
        None,
        "--content-filter",
        "-f",
        help="Filter content by this string (e.g., '2025' to only keep pages containing '2025')",
    ),
    include_patterns: Optional[str] = typer.Option(
        None,
        "--include-patterns",
        "-i",
        help="Comma-separated regex patterns for URLs to include (e.g., '/blog/,/docs/')",
    ),
) -> None:
    """Ingest documentation from a website by crawling.

    Crawls a documentation website starting from the base URL, extracts content,
    and compiles it into a single markdown file.

    Examples:
        # Use predefined target for StarkNet 2025 blog posts
        uv run ingest from-web starknet-blog-2025 --output starknet_blog_2025.md

        # Crawl StarkNet blog manually with filter
        uv run ingest from-web https://www.starknet.io/blog --content-filter="2025"

        # Crawl docs with URL filtering
        uv run ingest from-web https://example.com --include-patterns="/docs/,/api/"
    """

    # Check for predefined website targets
    actual_url = url
    auto_filter_func = None
    auto_processor_func = None
    auto_exclude_patterns = None
    auto_output = None

    if url.upper().replace("-", "_") in [t.name for t in TargetWebsite]:
        target = TargetWebsite[url.upper().replace("-", "_")]
        actual_url = target.value

        # Apply automatic settings for specific targets
        if target == TargetWebsite.STARKNET_BLOG_2025:
            auto_filter_func = is_2025_blog_entry
            auto_processor_func = clean_blog_content
            auto_exclude_patterns = [r'video\/$']  # Exclude URLs ending with video/
            auto_output = Path("starknet_blog_2025.md")
            typer.echo(f"Using predefined target: {target.name.lower().replace('_', '-')}")
            typer.echo(f"  URL: {actual_url}")
            typer.echo(f"  Auto-filter: 2025 blog entries")
            typer.echo(f"  Auto-cleanup: Removing newsletter and interest sections")
            typer.echo(f"  Auto-exclude: Skipping /video/ URLs")
            if output == Path("doc_dump.md"):  # Only use auto output if user didn't specify
                output = auto_output
                typer.echo(f"  Output: {output}")

    # Parse include patterns if provided
    include_pattern_list = None
    if include_patterns:
        include_pattern_list = [p.strip() for p in include_patterns.split(",")]

    # Use auto exclude patterns if available
    exclude_pattern_list = auto_exclude_patterns

    # Create content filter function
    content_filter_func = None
    if content_filter:
        # Manual filter takes precedence
        def filter_func(content: str) -> bool:
            return content_filter in content

        content_filter_func = filter_func
    elif auto_filter_func:
        # Use auto filter from predefined target
        content_filter_func = auto_filter_func

    # Use content processor from predefined target if available
    content_processor_func = auto_processor_func

    async def run_crawler() -> None:
        async with DocsCrawler(
            base_url=actual_url,
            include_patterns=include_pattern_list,
            exclude_url_patterns=exclude_pattern_list,
            content_filter=content_filter_func,
            content_processor=content_processor_func,
        ) as crawler:
            output_path = await crawler.run(output)
            typer.echo(
                typer.style(
                    f"✓ Documentation successfully crawled and saved to: {output_path}",
                    fg=typer.colors.GREEN,
                )
            )

    try:
        asyncio.run(run_crawler())
    except Exception as e:
        import traceback

        traceback.print_exc()
        typer.echo(typer.style(f"✗ Error: {str(e)}", fg=typer.colors.RED), err=True)
        raise typer.Exit(code=1) from e


@app.command(name="list-targets")
def list_targets() -> None:
    """List available predefined targets for ingestion."""
    typer.echo("Git Repository Targets (use with 'from-git'):")
    for target in TargetRepo:
        typer.echo(f"  - {target.name.lower().replace('_', '-')}: {target.value}")

    typer.echo("\nWebsite Targets (use with 'from-web'):")
    for target in TargetWebsite:
        name = target.name.lower().replace('_', '-')
        typer.echo(f"  - {name}: {target.value}")
        # Show special features for specific targets
        if target == TargetWebsite.STARKNET_BLOG_2025:
            typer.echo(f"    → Skips video URLs (ending with /video/)")
            typer.echo(f"    → Filters for 2025 blog entries only")
            typer.echo(f"    → Removes 'Join our newsletter' sections")
            typer.echo(f"    → Removes 'May also interest you' sections")


@app.command(name="list-types")
def list_types() -> None:
    """List supported documentation types."""
    typer.echo("Supported documentation types:")
    for doc_type in DocumentationType:
        typer.echo(f"  - {doc_type.value}")


@app.command(name="fix-headers")
def fix_headers(
    input_file: Path = typer.Argument(help="Path to the markdown file to fix"),
    output_file: Optional[Path] = typer.Option(
        None,
        "--output",
        "-o",
        help="Output file path. If not specified, overwrites the input file",
    ),
    keywords: Optional[str] = typer.Option(
        None,
        "--keywords",
        "-k",
        help="Comma-separated list of keywords to fix (e.g., 'Examples,Arguments,Returns')",
    ),
    no_interactive: bool = typer.Option(
        False,
        "--no-interactive",
        "-n",
        help="Apply fixes without asking for confirmation",
    ),
) -> None:
    """Fix markdown headers that should be subsections of their parent headers.

    This utility fixes headers that are at the wrong level, making them proper
    subsections of their parent headers.
    """

    # Validate input file
    if not input_file.exists():
        typer.echo(
            typer.style(
                f"✗ Error: Input file '{input_file}' does not exist", fg=typer.colors.RED
            ),
            err=True,
        )
        raise typer.Exit(code=1)

    if input_file.suffix.lower() not in [".md", ".markdown"]:
        typer.echo(
            typer.style(
                f"⚠ Warning: Input file '{input_file}' does not appear to be a markdown file",
                fg=typer.colors.YELLOW,
            )
        )

    # Parse keywords if provided
    keywords_list = None
    if keywords:
        keywords_list = [k.strip() for k in keywords.split(",")]
        typer.echo(f"Using custom keywords: {keywords_list}")

    # Create header fixer
    fixer = HeaderFixer(keywords_to_fix=keywords_list)

    # Process the file
    try:
        typer.echo(f"Processing: {input_file}")
        changes_made = fixer.process_file(
            input_path=input_file, output_path=output_file, interactive=not no_interactive
        )

        if not changes_made and output_file and output_file != input_file:
            # If no changes but user specified different output, copy the file
            import shutil

            shutil.copy2(input_file, output_file)
            typer.echo(f"No changes needed. File copied to: {output_file}")

    except Exception as e:
        typer.echo(typer.style(f"✗ Error: {str(e)}", fg=typer.colors.RED), err=True)
        raise typer.Exit(code=1) from e


if __name__ == "__main__":
    app()
