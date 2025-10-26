import re
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path
from typing import Optional, Protocol


class IWebsiteTarget(Protocol):
    """A protocol defining the interface for a website ingestion target."""

    @property
    def name(self) -> str:
        """Unique identifier for this target."""
        ...

    @property
    def base_url(self) -> str:
        """Base URL to start crawling from."""
        ...

    def get_include_url_patterns(self) -> Optional[list[str]]:
        """Get regex patterns for URLs to include."""
        ...

    def get_exclude_url_patterns(self) -> Optional[list[str]]:
        """Get regex patterns for URLs to exclude."""
        ...

    def filter_content(self, content: str) -> bool:
        """Return True if content should be kept, False to filter out."""
        ...

    def process_content(self, content: str) -> str:
        """Post-process content (e.g., remove unwanted sections)."""
        ...

    def get_default_output_path(self) -> Path:
        """Get the default output path for this target."""
        ...


def _default_filter(content: str) -> bool:
    """Accept all content by default."""
    return True


def _default_processor(content: str) -> str:
    """Pass through content unchanged by default."""
    return content


@dataclass
class WebTargetConfig:
    """A dataclass implementation of the IWebsiteTarget protocol.

    This class uses composition to bundle together URL patterns, filtering
    logic, and content processing logic. It structurally satisfies the
    IWebsiteTarget protocol without explicit inheritance.

    Example:
        >>> def my_filter(content: str) -> bool:
        ...     return "2025" in content
        >>> target = WebTargetConfig(
        ...     name="example",
        ...     base_url="https://example.com",
        ...     content_filter=my_filter
        ... )
    """

    name: str
    base_url: str
    include_patterns: Optional[list[str]] = None
    exclude_patterns: Optional[list[str]] = None
    content_filter: Callable[[str], bool] = _default_filter
    content_processor: Callable[[str], str] = _default_processor

    def get_include_url_patterns(self) -> Optional[list[str]]:
        return self.include_patterns

    def get_exclude_url_patterns(self) -> Optional[list[str]]:
        return self.exclude_patterns

    def filter_content(self, content: str) -> bool:
        return self.content_filter(content)

    def process_content(self, content: str) -> str:
        return self.content_processor(content)

    def get_default_output_path(self) -> Path:
        import os
        return Path(f"{os.getcwd()}/src/cairo_coder_tools/ingestion/generated/{self.name}.md")


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
    # Remove "Join our newsletter" section and everything after it until next header
    # Match any header level (##, ###, ####, etc.)
    content = re.sub(
        r'^#{2,}\s*Join our newsletter.*?(?=^#{2,}|\Z)',
        '',
        content,
        flags=re.DOTALL | re.IGNORECASE | re.MULTILINE,
    )

    # Remove "May also interest you" section and everything after it
    # Match any header level (##, ###, ####, etc.)
    content = re.sub(
        r'^#{2,}\s*May also interest you.*?(?=^#{2,}|\Z)',
        '',
        content,
        flags=re.DOTALL | re.IGNORECASE | re.MULTILINE,
    )

    # Also try to catch variations without markdown headers (plain text)
    content = re.sub(
        r'Join our newsletter.*?(?=\n\n[A-Z]|\Z)', '', content, flags=re.DOTALL | re.IGNORECASE
    )

    content = re.sub(
        r'May also interest you.*?(?=\n\n[A-Z]|\Z)', '', content, flags=re.DOTALL | re.IGNORECASE
    )

    # Clean up multiple newlines
    content = re.sub(r'\n{3,}', '\n\n', content)

    return content.strip()


# ============================================================================
# Predefined Targets
# ============================================================================

STARKNET_BLOG = WebTargetConfig(
    name="starknet-blog",
    base_url="https://www.starknet.io/blog",
    exclude_patterns=[r'video/$'],  # Exclude URLs ending with video/
    content_filter=is_2025_blog_entry,
    content_processor=clean_blog_content,
)

PREDEFINED_TARGETS: dict[str, IWebsiteTarget] = {
    STARKNET_BLOG.name: STARKNET_BLOG,
}
