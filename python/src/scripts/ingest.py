#!/usr/bin/env python3
"""Data ingestion CLI for Cairo Coder.

This module provides commands for ingesting documentation from various sources
into a format suitable for the RAG pipeline.
"""

import asyncio
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
from cairo_coder_tools.ingestion.web_targets import (
    PREDEFINED_TARGETS,
    IWebsiteTarget,
    WebTargetConfig,
)

# Load environment variables
load_dotenv()

logger = structlog.get_logger(__name__)

app = typer.Typer(help="Cairo Coder Documentation Ingestion CLI")


class TargetRepo(str, Enum):
    """Predefined target repositories for Git ingestion"""

    CORELIB_DOCS = "https://github.com/starkware-libs/cairo-docs"
    CAIRO_BOOK = "https://github.com/cairo-book/cairo-book"
    # Add more repositories as needed


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
    output: Optional[Path] = typer.Option(
        None, "--output", "-o", help="Output file path (uses target default if not specified)"
    ),
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
        # Use predefined target for StarkNet 2025/2026 blog posts
        uv run ingest from-web starknet-blog

        # Crawl StarkNet blog manually with filter
        uv run ingest from-web https://www.starknet.io/blog --content-filter="2025"

        # Crawl docs with URL filtering
        uv run ingest from-web https://example.com --include-patterns="/docs/,/api/"
    """

    target: IWebsiteTarget

    # Check if this is a predefined target
    if url in PREDEFINED_TARGETS:
        target = PREDEFINED_TARGETS[url]
        typer.echo(f"Using predefined target: {target.name}")
        typer.echo(f"  URL: {target.base_url}")
        if target.get_exclude_url_patterns():
            typer.echo(f"  Exclude patterns: {target.get_exclude_url_patterns()}")
        # Show details for specific targets
        if target.name == "starknet-blog":
            typer.echo("  Content filter: 2025/2026 blog entries only")
            typer.echo("  Content processor: removes newsletter/interest sections")
    else:
        # Create a generic target on the fly for custom URLs
        include_pattern_list = None
        if include_patterns:
            include_pattern_list = [p.strip() for p in include_patterns.split(",")]

        # Create content filter function if provided
        content_filter_func = None
        if content_filter:

            def filter_func(content: str) -> bool:
                return content_filter in content

            content_filter_func = filter_func

        target = WebTargetConfig(
            name=url.split("/")[-1] or "custom",
            base_url=url,
            include_patterns=include_pattern_list,
            content_filter=content_filter_func if content_filter_func else lambda _: True,
        )

    # Use target's default output path if user didn't specify one
    if output is None:
        output = target.get_default_output_path()
        typer.echo(f"  Output: {output}")

    async def run_crawler() -> None:
        async with DocsCrawler(target=target) as crawler:
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
    for name, target in PREDEFINED_TARGETS.items():
        typer.echo(f"  - {name}: {target.base_url}")
        if target.get_exclude_url_patterns():
            typer.echo(f"    → Excludes URLs matching: {', '.join(target.get_exclude_url_patterns())}")


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
