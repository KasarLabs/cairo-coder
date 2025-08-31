import subprocess
from pathlib import Path

import structlog

from .base_summarizer import BaseSummarizer
from .dpsy_summarizer import (
    configure_dspy,
    make_chunks,
    massively_summarize,
    merge_markdown_files,
)

logger = structlog.get_logger(__name__)


class MdbookSummarizer(BaseSummarizer):
    """Summarizer for mdbook-based documentation repositories"""

    def clone_repository(self) -> Path:
        """Clone the repository using git"""
        repo_path = self.temp_dir / "repo"

        if self.config.branch:
            cmd = ["git", "clone", "--depth", "1", "--branch", self.config.branch, self.config.repo_url, str(repo_path)]
        else:
            cmd = ["git", "clone", "--depth", "1", self.config.repo_url, str(repo_path)]

        subprocess.run(cmd, check=True, capture_output=True, text=True)

        return repo_path

    def build_documentation(self, repo_path: Path) -> Path:
        """Build the mdbook documentation"""
        if self.config.subdirectory:
            # Move to the subdirectory
            repo_path = repo_path / self.config.subdirectory

        # Check if mdbook is installed
        try:
            subprocess.run(["mdbook", "--version"], check=True, capture_output=True)
        except (subprocess.CalledProcessError, FileNotFoundError):
            # Install mdbook if not present
            print("Installing mdbook...")
            subprocess.run([
                "cargo", "install", "mdbook"
            ], check=True)

        # Find the mdbook root (could be in root or docs/ subdirectory)
        mdbook_root = repo_path
        if (repo_path / "docs" / "book.toml").exists():
            mdbook_root = repo_path / "docs"
        elif not (repo_path / "book.toml").exists():
            raise RuntimeError("No book.toml found in repository root or docs/ directory")

        # Add [output.markdown] to book.toml if it doesn't exist
        book_toml_path = mdbook_root / "book.toml"
        book_toml_content = book_toml_path.read_text()

        if "[output.markdown]" not in book_toml_content:
            with open(book_toml_path, "a") as f:
                f.write("\n[output.markdown]\n")

        # Build the book
        subprocess.run(["mdbook", "build"], cwd=mdbook_root, check=True)

        # mdbook typically outputs to book/ directory
        book_path = mdbook_root / "book" / "markdown"
        if not book_path.exists():
            raise RuntimeError(f"Expected book output at {book_path} but it doesn't exist")

        logger.info(f"Built mdbook at {book_path}")

        return book_path

    def extract_and_merge_content(self, docs_path: Path) -> str:
        """Extract and merge markdown content from the built mdbook"""
        # mdbook outputs markdown, but we need to work with the source markdown
        # The src directory is at the same level as the book output
        if not docs_path.exists():
            raise RuntimeError(f"Expected markdown source at {docs_path} but it doesn't exist")

        # Find all markdown files
        markdown_files = list(docs_path.rglob("*.md"))

        if not markdown_files:
            raise RuntimeError("No markdown files found in src directory")

        # Merge all markdown files
        merged_content = merge_markdown_files(str(docs_path))
        logger.info(f"Merged {len(markdown_files)} markdown files into one file of size {len(merged_content)}")

        return merged_content

    def summarize_content(self, content: str) -> str:
        """Summarize the content using dspy-summarizer"""
        # Configure dspy with the default provider
        configure_dspy()

        # Create chunks from the content
        chunks = make_chunks(content, target_chunk_size=2000)

        logger.info(f"Created {len(chunks)} chunks of content to process.")

        # Determine the title from the repository
        repo_name = self.config.repo_url.split('/')[-1].replace('.git', '')
        title = f"# {repo_name} Documentation Summary"

        logger.info(f"Summarizing {len(chunks)} chunks of content into {self.config.output_path}.")

        # Use massively_summarize function
        return massively_summarize(toc_path=[title], chunks=chunks)
