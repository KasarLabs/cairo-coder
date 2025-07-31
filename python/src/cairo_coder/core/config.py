"""Configuration data models for Cairo Coder."""

from dataclasses import dataclass, field

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
class AgentConfiguration:
    """Configuration for a specific agent."""

    id: str
    name: str
    description: str
    sources: list[DocumentSource] = field(default_factory=list)
    max_source_count: int = 5
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
            # We enable all sources, as the QueryProcessor is given the task to narrow them down.
            sources=list(DocumentSource),
            max_source_count=5,
            similarity_threshold=0.4,
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
            max_source_count=5,
            similarity_threshold=0.3,  # Lower threshold for Scarb-specific queries
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
    agents: dict[str, AgentConfiguration] = field(default_factory=dict)
    default_agent_id: str = "cairo-coder"

    def __post_init__(self) -> None:
        """Initialize default agents on top of custom ones."""
        self.agents = {**self.agents, **{
                "cairo-coder": AgentConfiguration.default_cairo_coder(),
                "default": AgentConfiguration.default_cairo_coder(),
                "scarb-assistant": AgentConfiguration.scarb_assistant(),
            }}
