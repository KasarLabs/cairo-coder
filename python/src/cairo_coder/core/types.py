"""Core type definitions for Cairo Coder."""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


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


@dataclass
class ProcessedQuery:
    """Processed query with extracted information."""

    original: str
    search_queries: list[str]
    is_contract_related: bool = False
    is_test_related: bool = False
    resources: list[DocumentSource] = field(default_factory=list)


@dataclass(frozen=True)
class Document:
    """Document with content and metadata."""

    page_content: str
    metadata: dict[str, Any] = field(default_factory=dict)

    @property
    def source(self) -> str | None:
        """Get document source from metadata."""
        return self.metadata.get("source")

    @property
    def title(self) -> str | None:
        """Get document title from metadata."""
        return self.metadata.get("title")

    @property
    def url(self) -> str | None:
        """Get document URL from metadata."""
        return self.metadata.get("url")

    def __hash__(self) -> int:
        """Make Document hashable by using page_content and a frozen representation of metadata."""
        # Convert metadata dict to a sorted tuple of key-value pairs for hashing
        metadata_items = tuple(sorted(self.metadata.items())) if self.metadata else ()
        return hash((self.page_content, metadata_items))


@dataclass
class RagInput:
    """Input for RAG pipeline."""

    query: str
    chat_history: list[Message]
    sources: DocumentSource | list[DocumentSource]

    def __post_init__(self) -> None:
        """Ensure sources is a list."""
        if isinstance(self.sources, DocumentSource):
            self.sources = [self.sources]


class StreamEventType(str, Enum):
    """Types of stream events."""

    SOURCES = "sources"
    RESPONSE = "response"
    END = "end"
    ERROR = "error"


@dataclass
class StreamEvent:
    """Streaming event for real-time updates."""

    type: StreamEventType
    data: Any
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


class AgentRequest(BaseModel):
    """Request for agent processing."""

    query: str
    chat_history: list[Message] = Field(default_factory=list)
    agent_id: str | None = None
    mcp_mode: bool = False
    sources: list[DocumentSource] | None = None

    class Config:
        use_enum_values = True


class AgentResponse(BaseModel):
    """Response from agent processing."""

    success: bool
    error: ErrorResponse | None = None
