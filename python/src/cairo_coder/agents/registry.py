"""
Agent Registry for Cairo Coder.

A lightweight enum-based registry that replaces the configuration-based
agent system with a simple, in-memory registry of available agents.
"""

from dataclasses import dataclass
from enum import Enum

from cairo_coder.core.config import VectorStoreConfig
from cairo_coder.core.rag_pipeline import RagPipeline, RagPipelineFactory
from cairo_coder.core.types import DocumentSource
from cairo_coder.dspy.document_retriever import SourceFilteredPgVectorRM
from cairo_coder.dspy.generation_program import (
    create_generation_program,
    create_mcp_generation_program,
)
from cairo_coder.dspy.query_processor import create_query_processor


class AgentId(Enum):
    """Available agent identifiers."""

    CAIRO_CODER = "cairo-coder"
    SCARB = "scarb-assistant"


@dataclass
class AgentSpec:
    """Specification for an agent."""

    name: str
    description: str
    sources: list[DocumentSource]
    generation_program_type: AgentId
    max_source_count: int = 5
    similarity_threshold: float = 0.4

    def build(self, vector_db: SourceFilteredPgVectorRM, vector_store_config: VectorStoreConfig) -> RagPipeline:
        """
        Build a RagPipeline instance from this specification.

        Args:
            vector_db: Pre-initialized vector database instance
            vector_store_config: Vector store configuration

        Returns:
            Configured RagPipeline instance
        """
        match self.generation_program_type:
            case AgentId.SCARB:
                return RagPipelineFactory.create_pipeline(
                    name=self.name,
                    vector_store_config=vector_store_config,
                    sources=self.sources,
                    query_processor=create_query_processor(),
                    generation_program=create_generation_program("scarb"),
                    mcp_generation_program=create_mcp_generation_program(),
                    max_source_count=self.max_source_count,
                    similarity_threshold=self.similarity_threshold,
                    vector_db=vector_db,
                )
            case AgentId.CAIRO_CODER:
                return RagPipelineFactory.create_pipeline(
                    name=self.name,
                    vector_store_config=vector_store_config,
                    sources=self.sources,
                    query_processor=create_query_processor(),
                    generation_program=create_generation_program(),
                    mcp_generation_program=create_mcp_generation_program(),
                    max_source_count=self.max_source_count,
                    similarity_threshold=self.similarity_threshold,
                    vector_db=vector_db,
                )


# The global registry of available agents
registry: dict[AgentId, AgentSpec] = {
    AgentId.CAIRO_CODER: AgentSpec(
        name="Cairo Coder",
        description="General Cairo programming assistant",
        sources=list(DocumentSource),  # All sources
        generation_program_type=AgentId.CAIRO_CODER,
        max_source_count=5,
        similarity_threshold=0.4,
    ),
    AgentId.SCARB: AgentSpec(
        name="Scarb Assistant",
        description="Specialized assistant for Scarb build tool",
        sources=[DocumentSource.SCARB_DOCS],
        generation_program_type=AgentId.SCARB,
        max_source_count=5,
        similarity_threshold=0.3,  # Lower threshold for Scarb-specific queries
    ),
}


def get_agent_by_string_id(agent_id: str) -> tuple[AgentId, AgentSpec]:
    """
    Get agent by string ID.

    Args:
        agent_id: String agent ID (must match enum value)

    Returns:
        Tuple of (AgentId enum, AgentSpec)

    Raises:
        ValueError: If agent_id is not found
    """
    # Try to find matching enum by value
    for enum_id in AgentId:
        if enum_id.value == agent_id:
            return enum_id, registry[enum_id]

    raise ValueError(f"Agent not found: {agent_id}")
