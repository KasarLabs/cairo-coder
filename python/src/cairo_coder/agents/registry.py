"""
Agent Registry for Cairo Coder.

A lightweight enum-based registry that replaces the configuration-based
agent system with a simple, in-memory registry of available agents.

Programs are created lazily at build time to avoid expensive DSPy
initialization at module import time.
"""

from collections.abc import Callable
from dataclasses import dataclass
from enum import Enum
from typing import Any

from cairo_coder.core.config import VectorStoreConfig
from cairo_coder.core.constants import MAX_SOURCE_COUNT, SIMILARITY_THRESHOLD
from cairo_coder.core.rag_pipeline import RagPipeline, RagPipelineFactory
from cairo_coder.core.types import DocumentSource
from cairo_coder.dspy.document_retriever import SourceFilteredPgVectorRM


class AgentId(str, Enum):
    """Available agent identifiers."""

    CAIRO_CODER = "cairo-coder"
    STARKNET = "starknet-agent"


# Type alias for factory functions that create DSPy programs
ProgramFactory = Callable[[], Any]


@dataclass
class AgentSpec:
    """
    Specification for an agent.

    Programs are created lazily via factory functions to avoid
    expensive DSPy initialization at module import time.
    """

    name: str
    description: str
    sources: list[DocumentSource]
    pipeline_builder: Callable[..., RagPipeline]
    # Factory functions for lazy program creation
    query_processor_factory: ProgramFactory
    generation_program_factory: ProgramFactory
    mcp_generation_program_factory: ProgramFactory
    max_source_count: int = MAX_SOURCE_COUNT
    similarity_threshold: float = SIMILARITY_THRESHOLD

    def build(
        self, vector_db: SourceFilteredPgVectorRM, vector_store_config: VectorStoreConfig
    ) -> RagPipeline:
        """
        Build a RagPipeline instance from this specification.

        Programs are created lazily here, not at module import time.

        Args:
            vector_db: Pre-initialized vector database instance
            vector_store_config: Vector store configuration

        Returns:
            Configured RagPipeline instance
        """
        # Create programs lazily at build time
        return self.pipeline_builder(
            name=self.name,
            vector_store_config=vector_store_config,
            vector_db=vector_db,
            sources=self.sources,
            max_source_count=self.max_source_count,
            similarity_threshold=self.similarity_threshold,
            query_processor=self.query_processor_factory(),
            generation_program=self.generation_program_factory(),
            mcp_generation_program=self.mcp_generation_program_factory(),
        )


def _create_cairo_coder_generation_program() -> Any:
    """Factory for Cairo Coder generation program."""
    from cairo_coder.dspy.generation_program import create_generation_program

    return create_generation_program(AgentId.CAIRO_CODER)


def _create_starknet_generation_program() -> Any:
    """Factory for Starknet generation program."""
    from cairo_coder.dspy.generation_program import create_generation_program

    return create_generation_program(AgentId.STARKNET)


def _create_query_processor() -> Any:
    """Factory for query processor."""
    from cairo_coder.dspy.query_processor import create_query_processor

    return create_query_processor()


def _create_mcp_generation_program() -> Any:
    """Factory for MCP generation program."""
    from cairo_coder.dspy.generation_program import create_mcp_generation_program

    return create_mcp_generation_program()


# The global registry of available agents
# Programs are NOT created here - they are created lazily in build()
registry: dict[AgentId, AgentSpec] = {
    AgentId.CAIRO_CODER: AgentSpec(
        name="Cairo Coder",
        description="General Cairo programming assistant",
        sources=list(DocumentSource),  # All sources
        pipeline_builder=RagPipelineFactory.create_pipeline,
        query_processor_factory=_create_query_processor,
        generation_program_factory=_create_cairo_coder_generation_program,
        mcp_generation_program_factory=_create_mcp_generation_program,
        max_source_count=MAX_SOURCE_COUNT,
        similarity_threshold=SIMILARITY_THRESHOLD,
    ),
    AgentId.STARKNET: AgentSpec(
        name="Starknet Agent",
        description="Assistant for the Starknet ecosystem (contracts, tools, docs).",
        sources=list(DocumentSource),
        pipeline_builder=RagPipelineFactory.create_pipeline,
        query_processor_factory=_create_query_processor,
        generation_program_factory=_create_starknet_generation_program,
        mcp_generation_program_factory=_create_mcp_generation_program,
        max_source_count=MAX_SOURCE_COUNT,
        similarity_threshold=SIMILARITY_THRESHOLD,
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
