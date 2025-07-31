"""
Agent Factory for Cairo Coder.

This module implements the AgentFactory class that creates and configures
RAG Pipeline agents based on agent IDs and configurations.
"""

from dataclasses import dataclass, field
from typing import Any

from cairo_coder.config.manager import ConfigManager
from cairo_coder.core.config import AgentConfiguration, Config, VectorStoreConfig
from cairo_coder.core.rag_pipeline import RagPipeline, RagPipelineFactory
from cairo_coder.core.types import DocumentSource, Message
from cairo_coder.dspy.document_retriever import SourceFilteredPgVectorRM
from cairo_coder.utils.logging import get_logger

logger = get_logger(__name__)


@dataclass
class AgentFactoryConfig:
    """Configuration for Agent Factory."""

    vector_store_config: VectorStoreConfig
    vector_db: SourceFilteredPgVectorRM
    agent_configs: dict[str, AgentConfiguration] = field(default_factory=dict)
    full_config: Config | None = None


class AgentFactory:
    """
    Factory class for creating and configuring RAG Pipeline agents.

    This factory manages agent configurations and creates appropriate
    RAG Pipelines based on agent IDs and requirements.
    """

    def __init__(self, config: AgentFactoryConfig):
        """
        Initialize the Agent Factory.

        Args:
            config: AgentFactoryConfig with vector store and configurations
        """
        self.vector_store_config = config.vector_store_config
        self.vector_db = config.vector_db
        self.agent_configs = config.agent_configs
        self.full_config = config.full_config

        # Cache for created agents to avoid recreation
        self._agent_cache: dict[str, RagPipeline] = {}



    def get_or_create_agent(
        self, agent_id: str, query: str, history: list[Message], mcp_mode: bool = False
    ) -> RagPipeline:
        """
        Get an existing agent from cache or create a new one.

        Args:
            agent_id: Agent identifier
            query: User's query
            history: Chat history
            mcp_mode: Whether to use MCP mode

        Returns:
            Cached or newly created RagPipeline instance
        """
        # Check cache first
        cache_key = f"{agent_id}_{mcp_mode}"
        if cache_key in self._agent_cache:
            return self._agent_cache[cache_key]

        # Create new agent
        agent = self._create_agent_by_id(
            query=query,
            history=history,
            agent_id=agent_id,
            vector_store_config=self.vector_store_config,
            mcp_mode=mcp_mode,
            vector_db=self.vector_db,
            full_config=self.full_config,
        )

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
        return list(self.agent_configs.keys())

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
        if agent_id not in self.agent_configs:
            raise ValueError(f"Agent not found: {agent_id}")

        config = self.agent_configs[agent_id]
        return {
            "id": config.id,
            "name": config.name,
            "description": config.description,
            "sources": [source.value for source in config.sources],
            "max_source_count": config.max_source_count,
            "similarity_threshold": config.similarity_threshold,
        }


    @staticmethod
    def _create_agent_by_id(
        query: str,
        history: list[Message],
        agent_id: str,
        vector_store_config: VectorStoreConfig,
        mcp_mode: bool = False,
        vector_db: Any = None,
        full_config: Config | None = None,
    ) -> RagPipeline:
        """
        Create an agent based on a specific agent ID configuration.

        Args:
            query: User's query
            history: Chat history
            agent_id: Specific agent identifier
            vector_store_config: Vector store for document retrieval
            mcp_mode: Whether to use MCP mode
            vector_db: Optional pre-initialized vector database instance
            full_config: Optional pre-loaded configuration to avoid file I/O

        Returns:
            Configured RagPipeline instance

        Raises:
            ValueError: If agent_id is not found in configuration
        """
        if full_config is None:
            # Fallback to loading from file if not provided
            config_manager = ConfigManager()
            full_config = config_manager.load_config()
        
        config_manager = ConfigManager()
        try:
            agent_config = config_manager.get_agent_config(full_config, agent_id)
        except KeyError as e:
            raise ValueError(f"Agent configuration not found for ID: {agent_id}") from e

        # Create pipeline based on agent configuration
        return AgentFactory._create_pipeline_from_config(
            agent_config=agent_config,
            vector_store_config=vector_store_config,
            query=query,
            history=history,
            mcp_mode=mcp_mode,
            vector_db=vector_db,
        )

    @staticmethod
    def _create_pipeline_from_config(
        agent_config: AgentConfiguration,
        vector_store_config: VectorStoreConfig,
        query: str,
        history: list[Message],
        mcp_mode: bool = False,
        vector_db: Any = None,
    ) -> RagPipeline:
        """
        Create a RAG Pipeline from agent configuration.

        Args:
            agent_config: Agent configuration
            vector_store_config: Vector store for document retrieval
            query: User's query
            history: Chat history
            mcp_mode: Whether to use MCP mode
            vector_db: Optional pre-initialized vector database instance

        Returns:
            Configured RagPipeline instance
        """
        # Determine pipeline type based on agent configuration
        pipeline_type = "general"
        if agent_config.id == "scarb-assistant":
            pipeline_type = "scarb"

        # Create pipeline with agent-specific configuration
        if pipeline_type == "scarb":
            pipeline = RagPipelineFactory.create_scarb_pipeline(
                name=agent_config.name,
                vector_store_config=vector_store_config,
                sources=agent_config.sources or [DocumentSource.SCARB_DOCS],
                max_source_count=agent_config.max_source_count,
                similarity_threshold=agent_config.similarity_threshold,
                vector_db=vector_db,
            )
        else:
            pipeline = RagPipelineFactory.create_pipeline(
                name=agent_config.name,
                vector_store_config=vector_store_config,
                sources=agent_config.sources,
                max_source_count=agent_config.max_source_count,
                similarity_threshold=agent_config.similarity_threshold,
                vector_db=vector_db,
            )

        return pipeline


def create_agent_factory(
    vector_store_config: VectorStoreConfig,
    vector_db: SourceFilteredPgVectorRM,
    full_config: Config | None = None,
) -> AgentFactory:
    """
    Create an AgentFactory with default configurations.

    Args:
        vector_store_config: Vector store for document retrieval
        vector_db: Pre-initialized vector database instance
        full_config: Optional pre-loaded configuration to avoid file I/O

    Returns:
        Configured AgentFactory instance
    """
    # Load configuration if not provided
    if full_config is None:
        config_manager = ConfigManager()
        full_config = config_manager.load_config()
    
    # Use agent configs from the loaded configuration
    agent_configs = full_config.agents if full_config.agents else {
        "default": AgentConfiguration.default_cairo_coder(),
        "cairo-coder": AgentConfiguration.default_cairo_coder(),
        "scarb-assistant": AgentConfiguration.scarb_assistant(),
    }

    factory_config = AgentFactoryConfig(
        vector_store_config=vector_store_config,
        vector_db=vector_db,
        agent_configs=agent_configs,
        full_config=full_config,
    )

    return AgentFactory(factory_config)
