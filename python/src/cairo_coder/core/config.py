"""Configuration data models for Cairo Coder."""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Union

import dspy

from .types import DocumentSource


@dataclass
class VectorStoreConfig:
    """Configuration for vector store connection."""
    host: str
    port: int
    database: str
    user: str
    password: str
    table_name: str
    embedding_dimension: int = 2048  # text-embedding-3-large dimension
    similarity_measure: str = "cosine"  # cosine, dot_product, euclidean

    @property
    def dsn(self) -> str:
        """Get PostgreSQL connection string."""
        return f"postgresql://{self.user}:{self.password}@{self.host}:{self.port}/{self.database}"

@dataclass
class RagSearchConfig:
    """Configuration for RAG search pipeline."""
    name: str
    vector_store: Any  # VectorStore instance
    contract_template: Optional[str] = None
    test_template: Optional[str] = None
    max_source_count: int = 10
    similarity_threshold: float = 0.4
    sources: Optional[Union[DocumentSource, List[DocumentSource]]] = None
    retrieval_program: Optional[dspy.Module] = None
    generation_program: Optional[dspy.Module] = None

    def __post_init__(self) -> None:
        """Ensure sources is a list if provided."""
        if self.sources and isinstance(self.sources, DocumentSource):
            self.sources = [self.sources]


@dataclass
class AgentConfiguration:
    """Configuration for a specific agent."""
    id: str
    name: str
    description: str
    sources: List[DocumentSource] = field(default_factory=list)
    contract_template: Optional[str] = None
    test_template: Optional[str] = None
    max_source_count: int = 10
    similarity_threshold: float = 0.4
    retrieval_program_name: str = "default"
    generation_program_name: str = "default"

    @classmethod
    def default_cairo_coder(cls) -> "AgentConfiguration":
        """Get default Cairo Coder agent configuration."""
        return cls(
            id="cairo-coder",
            name="Cairo Coder",
            description="General Cairo programming assistant",
            sources=[
                DocumentSource.CAIRO_BOOK,
                DocumentSource.STARKNET_DOCS,
                DocumentSource.CAIRO_BY_EXAMPLE,
                DocumentSource.CORELIB_DOCS
            ],
            contract_template="""
You are helping write a Cairo smart contract. Consider:
- Contract structure with #[contract] attribute
- Storage variables and access patterns
- External/view functions and their signatures
- Event definitions and emissions
- Error handling and custom errors
- Interface implementations
""",
            test_template="""
You are helping write Cairo tests. Consider:
- Test module structure with #[cfg(test)]
- Test functions with #[test] attribute
- Assertions and test utilities
- Mock contracts and test fixtures
- Test coverage and edge cases
""",
        )

    @classmethod
    def scarb_assistant(cls) -> "AgentConfiguration":
        """Get Scarb Assistant agent configuration."""
        return cls(
            id="scarb-assistant",
            name="Scarb Assistant",
            description="Specialized assistant for Scarb build tool",
            sources=[DocumentSource.SCARB_DOCS],
            retrieval_program_name="scarb_retrieval",
            generation_program_name="scarb_generation",
            similarity_threshold=0.3  # Lower threshold for Scarb-specific queries
        )


@dataclass
class Config:
    """Main application configuration."""
    # Database
    vector_store: VectorStoreConfig

    # Server settings
    host: str = "0.0.0.0"
    port: int = 3001
    debug: bool = False

    # TODO: because only set with defaults at post-init, should not be there.
    # Agent configurations
    agents: Dict[str, AgentConfiguration] = field(default_factory=dict)
    default_agent_id: str = "cairo-coder"

    def __post_init__(self) -> None:
        """Initialize default agents on top of custom ones."""
        self.agents.update({
            "cairo-coder": AgentConfiguration.default_cairo_coder(),
            "scarb-assistant": AgentConfiguration.scarb_assistant()
        })
