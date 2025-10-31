"""Core type definitions for Cairo Coder."""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Optional, TypedDict

from pydantic import BaseModel


class Role(str, Enum):
    """Message role in conversation."""

    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class Message(BaseModel):
    """Chat message structure."""

    role: Role
    content: str
    name: str | None = None

    class Config:
        use_enum_values = True


class DocumentSource(str, Enum):
    """Available documentation sources."""

    CAIRO_BOOK = "cairo_book"
    STARKNET_DOCS = "starknet_docs"
    STARKNET_FOUNDRY = "starknet_foundry"
    CAIRO_BY_EXAMPLE = "cairo_by_example"
    OPENZEPPELIN_DOCS = "openzeppelin_docs"
    CORELIB_DOCS = "corelib_docs"
    SCARB_DOCS = "scarb_docs"
    STARKNET_JS = "starknet_js"
    STARKNET_BLOG = "starknet_blog"


class DocumentMetadata(TypedDict, total=False):
    """
    Metadata structure for documents, matching the TypeScript ingester format.

    All fields are optional (total=False) to maintain backward compatibility
    with existing code that may not provide all fields.
    """

    # Core identification fields
    name: str  # Page name (e.g., "ch01-01-installation")
    title: str  # Section title
    uniqueId: str  # Unique identifier (format: "{page_name}-{chunkNumber}")
    contentHash: str  # Hash of the content for change detection
    chunkNumber: int  # Index of this chunk within the page

    # Source fields
    source: DocumentSource  # DocumentSource value (e.g., "cairo_book")
    sourceLink: str  # Full URL to the source documentation

    # Additional metadata fields that may be present
    similarity: Optional[float]  # Similarity score from retrieval (if include_similarity=True)


@dataclass
class ProcessedQuery:
    """Processed query with extracted information."""

    original: str
    search_queries: list[str]
    is_contract_related: bool = False
    is_test_related: bool = False
    resources: list[DocumentSource] = field(default_factory=list)


# Helper to extract domain title
def title_from_url(url: str) -> str:
    try:
        import urllib.parse as _up

        parsed = _up.urlparse(url)

        # Try to extract a meaningful title from the path
        path = parsed.path.strip('/')
        if path:
            # Get the last segment of the path
            last_segment = path.split('/')[-1]
            # Remove file extensions
            last_segment = last_segment.rsplit('.', 1)[0]
            # Convert hyphens/underscores to spaces and title case
            if last_segment:
                return last_segment.replace('-', ' ').replace('_', ' ').title()

        # Fallback to netloc if path extraction fails
        host = parsed.netloc
        return host or url
    except Exception:
        return url

@dataclass(frozen=True)
class Document:
    """
    Document with content and metadata.

    The metadata field follows the DocumentMetadata structure defined by the TypeScript
    ingester, ensuring consistency across the Python and TypeScript codebases.
    """

    page_content: str
    metadata: DocumentMetadata = field(default_factory=dict)  # type: ignore[assignment]

    @property
    def source(self) -> str | None:
        """Get document source from metadata."""
        return self.metadata.get("source")

    @property
    def title(self) -> str | None:
        """Get document title from metadata."""
        title_fallback = title_from_url(self.source_link) if self.source_link else None
        return self.metadata.get("title", title_fallback or self.page_content[:20])

    @property
    def source_link(self) -> str | None:
        """Get document source link from metadata."""
        return self.metadata.get("sourceLink")

    def __hash__(self) -> int:
        """Make Document hashable by using page_content and a frozen representation of metadata."""
        # Convert metadata dict to a sorted tuple of key-value pairs for hashing
        metadata_items = tuple(sorted(self.metadata.items())) if self.metadata else ()
        return hash((self.page_content, metadata_items))

class StreamEventType(str, Enum):
    """Types of stream events."""

    SOURCES = "sources"
    PROCESSING = "processing"
    RESPONSE = "response"
    FINAL_RESPONSE = "final_response"
    REASONING = "reasoning"
    END = "end"
    ERROR = "error"


@dataclass
class StreamEvent:
    """Streaming event for real-time updates."""

    type: StreamEventType
    data: str | list[dict] | None
    timestamp: datetime = field(default_factory=datetime.now)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {"type": self.type.value, "data": self.data, "timestamp": self.timestamp.isoformat()}

@dataclass
class ErrorResponse:
    """Structured error response."""

    type: str  # "configuration_error", "database_error", etc.
    message: str
    details: dict[str, Any] | None = None
    timestamp: datetime = field(default_factory=datetime.now)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "type": self.type,
            "message": self.message,
            "details": self.details,
            "timestamp": self.timestamp.isoformat(),
        }
class AgentResponse(BaseModel):
    """Response from agent processing."""

    success: bool
    error: ErrorResponse | None = None
