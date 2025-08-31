import shutil
import tempfile
from abc import ABC, abstractmethod
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import typer

from .header_fixer import HeaderFixer


@dataclass
class SummarizerConfig:
    """Configuration for a summarizer"""

    repo_url: str
    branch: Optional[str]
    subdirectory: Optional[str]
    output_path: Path = Path("scripts/summarizer/generated/summary.md")


class BaseSummarizer(ABC):
    """Abstract base class for documentation summarizers using template method pattern"""

    def __init__(self, config: SummarizerConfig):
        self.config = config
        self.temp_dir: Optional[Path] = None
        self.header_fixer = HeaderFixer()

    def process(self) -> Path:
        """Template method that defines the summarization workflow"""
        try:
            # Step 1: Clone the repository
            self.temp_dir = self._create_temp_dir()
            repo_path = self.clone_repository()

            # Step 2: Build the documentation (if needed)
            docs_path = self.build_documentation(repo_path)

            # Step 3: Extract and merge content
            merged_content = self.extract_and_merge_content(docs_path)

            # Step 4: Summarize the content
            summary = self.summarize_content(merged_content)

            # Step 5: Fix headers that are out of place
            fixed_summary = self.header_fixer.fix_headers(summary)

            # Step 6: Display diff and ask user choice
            self.header_fixer.display_diff(summary, fixed_summary)

            # Step 7: Save the chosen version
            if summary != fixed_summary:  # Only ask if there are changes
                if typer.confirm("Do you want to apply the header fixes?", default=True):
                    typer.echo(typer.style("✓ Applying header fixes...", fg=typer.colors.GREEN))
                    output_path = self.save_summary(fixed_summary)
                else:
                    typer.echo(typer.style("✓ Keeping original version...", fg=typer.colors.YELLOW))
                    output_path = self.save_summary(summary)
            else:
                output_path = self.save_summary(summary)

            return output_path

        finally:
            # Cleanup
            self._cleanup()

    @abstractmethod
    def clone_repository(self) -> Path:
        """Clone the repository and return the path to the cloned repo"""
        pass

    @abstractmethod
    def build_documentation(self, repo_path: Path) -> Path:
        """Build the documentation and return the path to the built docs"""
        pass

    @abstractmethod
    def extract_and_merge_content(self, docs_path: Path) -> str:
        """Extract and merge documentation content into a single string"""
        pass

    @abstractmethod
    def summarize_content(self, content: str) -> str:
        """Summarize the content using dspy-summarizer"""
        pass

    def save_summary(self, summary: str) -> Path:
        """Save the summary to the output path"""
        self.config.output_path.parent.mkdir(parents=True, exist_ok=True)
        self.config.output_path.write_text(summary)
        return self.config.output_path

    def _create_temp_dir(self) -> Path:
        """Create a temporary directory for processing"""
        return Path(tempfile.mkdtemp())

    def _cleanup(self):
        """Clean up temporary files"""
        if self.temp_dir and self.temp_dir.exists():
            shutil.rmtree(self.temp_dir)
