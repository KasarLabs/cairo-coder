#!/usr/bin/env python3
import resource
from enum import Enum
from pathlib import Path
from typing import Optional

import structlog
import typer
from dotenv import load_dotenv

from scripts.summarizer.base_summarizer import SummarizerConfig
from scripts.summarizer.header_fixer import HeaderFixer
from scripts.summarizer.summarizer_factory import DocumentationType, SummarizerFactory

# Load environment variables
load_dotenv()

logger = structlog.get_logger(__name__)

app = typer.Typer(help="Cairo Coder Documentation Summarizer CLI")


class TargetRepo(str, Enum):
    """Predefined target repositories"""
    CORELIB_DOCS = "https://github.com/starkware-libs/cairo-docs"
    CAIRO_BOOK = "https://github.com/cairo-book/cairo-book"
    # Add more repositories as needed


@app.command()
def summarize(
    repo_url: str = typer.Argument(
        help="GitHub repository URL to summarize. Can be a predefined target or custom URL."
    ),
    doc_type: DocumentationType = typer.Option(
        DocumentationType.MDBOOK,
        "--type", "-t",
        help="Documentation type"
    ),
    branch: Optional[str] = typer.Option(
        None,
        "--branch", "-b",
        help="Git branch to use"
    ),
    subdirectory: Optional[str] = typer.Option(
        None,
        "--subdirectory", "-s",
        help="Subdirectory to use"
    ),
    output: Path = typer.Option(
        Path("summary.md"),
        "--output", "-o",
        help="Output file path"
    ),
    verbose: bool = typer.Option(
        False,
        "--verbose", "-v",
        help="Enable verbose output"
    )
):
    """Summarize documentation from a GitHub repository"""

    # Set file descriptor limit for the current process
    try:
        current_soft, current_hard = resource.getrlimit(resource.RLIMIT_NOFILE)
        new_limit = min(4096, current_hard)  # Don't exceed hard limit
        resource.setrlimit(resource.RLIMIT_NOFILE, (new_limit, current_hard))
        logger.info(f"Raised file descriptor limit from {current_soft} to {new_limit}")
    except (ValueError, OSError) as e:
        logger.warning(f"Could not raise file descriptor limit: {e}")
        logger.warning("You may want to run 'ulimit -n 4096' in your terminal before running this script")

    # Check for predefined targets
    if repo_url.upper().replace("-", "_") in [t.name for t in TargetRepo]:
        target = TargetRepo[repo_url.upper().replace("-", "_")]
        repo_url = target.value
        if verbose:
            typer.echo(f"Using predefined target: {target.name} -> {repo_url}")

    # Create configuration
    config = SummarizerConfig(
        repo_url=repo_url,
        branch=branch,
        subdirectory=subdirectory,
        output_path=output
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

        typer.echo(typer.style(
            f"✓ Summary successfully generated at: {output_path}",
            fg=typer.colors.GREEN
        ))

    except Exception as e:
        import traceback
        traceback.print_exc()
        typer.echo(typer.style(
            f"✗ Error: {str(e)}",
            fg=typer.colors.RED
        ), err=True)
        raise typer.Exit(code=1) from e


@app.command()
def list_targets():
    """List available predefined target repositories"""
    typer.echo("Available predefined targets:")
    for target in TargetRepo:
        typer.echo(f"  - {target.name.lower().replace('_', '-')}: {target.value}")


@app.command()
def list_types():
    """List supported documentation types"""
    typer.echo("Supported documentation types:")
    for doc_type in DocumentationType:
        typer.echo(f"  - {doc_type.value}")


@app.command()
def fix_headers(
    input_file: Path = typer.Argument(
        help="Path to the markdown file to fix"
    ),
    output_file: Optional[Path] = typer.Option(
        None,
        "--output", "-o",
        help="Output file path. If not specified, overwrites the input file"
    ),
    keywords: Optional[str] = typer.Option(
        None,
        "--keywords", "-k",
        help="Comma-separated list of keywords to fix (e.g., 'Examples,Arguments,Returns')"
    ),
    no_interactive: bool = typer.Option(
        False,
        "--no-interactive", "-n",
        help="Apply fixes without asking for confirmation"
    )
):
    """Fix markdown headers that should be subsections of their parent headers"""

    # Validate input file
    if not input_file.exists():
        typer.echo(typer.style(
            f"✗ Error: Input file '{input_file}' does not exist",
            fg=typer.colors.RED
        ), err=True)
        raise typer.Exit(code=1)

    if input_file.suffix.lower() not in ['.md', '.markdown']:
        typer.echo(typer.style(
            f"⚠ Warning: Input file '{input_file}' does not appear to be a markdown file",
            fg=typer.colors.YELLOW
        ))

    # Parse keywords if provided
    keywords_list = None
    if keywords:
        keywords_list = [k.strip() for k in keywords.split(',')]
        typer.echo(f"Using custom keywords: {keywords_list}")

    # Create header fixer
    fixer = HeaderFixer(keywords_to_fix=keywords_list)

    # Process the file
    try:
        typer.echo(f"Processing: {input_file}")
        changes_made = fixer.process_file(
            input_path=input_file,
            output_path=output_file,
            interactive=not no_interactive
        )

        if not changes_made and output_file and output_file != input_file:
            # If no changes but user specified different output, copy the file
            import shutil
            shutil.copy2(input_file, output_file)
            typer.echo(f"No changes needed. File copied to: {output_file}")

    except Exception as e:
        typer.echo(typer.style(
            f"✗ Error: {str(e)}",
            fg=typer.colors.RED
        ), err=True)
        raise typer.Exit(code=1) from e


if __name__ == "__main__":
    app()
