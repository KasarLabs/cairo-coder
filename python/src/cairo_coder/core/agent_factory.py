"""
Agent Factory for Cairo Coder.

This module implements the AgentFactory class that creates and configures
RAG Pipeline agents using the lightweight agent registry.
"""

from typing import Any

import structlog

from cairo_coder.agents.registry import get_agent_by_string_id
from cairo_coder.core.config import VectorStoreConfig
from cairo_coder.core.rag_pipeline import RagPipeline
from cairo_coder.core.types import Message
from cairo_coder.dspy.document_retriever import SourceFilteredPgVectorRM

logger = structlog.get_logger(__name__)


class AgentFactory:
    """
    Factory class for creating and configuring RAG Pipeline agents.

    This factory uses the lightweight agent registry to create appropriate
    RAG Pipelines based on agent IDs.
    """

    def __init__(self, vector_db: SourceFilteredPgVectorRM, vector_store_config: VectorStoreConfig):
        """
        Initialize the Agent Factory.

        Args:
            vector_db: Pre-initialized vector database instance
            vector_store_config: Vector store configuration
        """
        self.vector_db = vector_db
        self.vector_store_config = vector_store_config

        # Cache for created agents to avoid recreation
        self._agent_cache: dict[str, RagPipeline] = {}

    def get_or_create_agent(
        self, agent_id: str, mcp_mode: bool = False
    ) -> RagPipeline:
        """
        Get an existing agent from cache or create a new one.

        Args:
            agent_id: Agent identifier
            query: User's query (unused in new implementation)
            history: Chat history (unused in new implementation)
            mcp_mode: Whether to use MCP mode

        Returns:
            Cached or newly created RagPipeline instance
        """
        # Check cache first
        cache_key = f"{agent_id}_{mcp_mode}"
        if cache_key in self._agent_cache:
            return self._agent_cache[cache_key]

        # Get agent spec from registry
        _, spec = get_agent_by_string_id(agent_id)

        # Create new agent from spec
        agent = spec.build(self.vector_db, self.vector_store_config)

        # Cache the agent
        self._agent_cache[cache_key] = agent

        return agent

    def clear_cache(self) -> None:
        """Clear the agent cache."""
        self._agent_cache.clear()

    def get_available_agents(self) -> list[str]:
        """
        Get list of available agent IDs.

        Returns:
            List of configured agent IDs
        """
        # Return all agent enum values
        from cairo_coder.agents.registry import AgentId
        return [agent_id.value for agent_id in AgentId]

    def get_agent_info(self, agent_id: str) -> dict[str, Any]:
        """
        Get information about a specific agent.

        Args:
            agent_id: Agent identifier

        Returns:
            Dictionary with agent information

        Raises:
            ValueError: If agent_id is not found
        """
        enum_id, spec = get_agent_by_string_id(agent_id)

        return {
            "id": enum_id.value,
            "name": spec.name,
            "description": spec.description,
            "sources": [source.value for source in spec.sources],
            "max_source_count": spec.max_source_count,
            "similarity_threshold": spec.similarity_threshold,
        }


def create_agent_factory(vector_db: SourceFilteredPgVectorRM, vector_store_config: VectorStoreConfig) -> AgentFactory:
    """
    Create an AgentFactory with the given vector database and config.

    Args:
        vector_db: Pre-initialized vector database instance
        vector_store_config: Vector store configuration

    Returns:
        Configured AgentFactory instance
    """
    return AgentFactory(vector_db, vector_store_config)
