"""
Agent Factory for Cairo Coder.

This module implements the AgentFactory class that creates and configures
RAG Pipeline agents based on agent IDs and configurations.
"""

from typing import Dict, List, Optional
import asyncio
from dataclasses import dataclass, field

from cairo_coder.core.types import Document, DocumentSource, Message
from cairo_coder.core.rag_pipeline import RagPipeline, RagPipelineFactory
from cairo_coder.core.config import AgentConfiguration, VectorStoreConfig
from cairo_coder.config.manager import ConfigManager


@dataclass
class AgentFactoryConfig:
    """Configuration for Agent Factory."""
    vector_store_config: VectorStoreConfig
    config_manager: ConfigManager
    default_agent_config: Optional[AgentConfiguration] = None
    agent_configs: Dict[str, AgentConfiguration] = field(default_factory=dict)


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
        self.config = config
        self.vector_store_config = config.vector_store_config
        self.config_manager = config.config_manager
        self.agent_configs = config.agent_configs
        self.default_agent_config = config.default_agent_config

        # Cache for created agents to avoid recreation
        self._agent_cache: Dict[str, RagPipeline] = {}

    @staticmethod
    def create_agent(
        query: str,
        history: List[Message],
        vector_store_config: VectorStoreConfig,
        mcp_mode: bool = False,
        sources: Optional[List[DocumentSource]] = None,
        max_source_count: int = 10,
        similarity_threshold: float = 0.4
    ) -> RagPipeline:
        """
        Create a default agent for general Cairo programming assistance.

        Args:
            query: User's query (used for agent optimization)
            history: Chat history (used for context)
            vector_store_config: Vector store configuration for document retrieval
            mcp_mode: Whether to use MCP mode
            sources: Optional document sources filter
            max_source_count: Maximum documents to retrieve
            similarity_threshold: Minimum similarity for documents

        Returns:
            Configured RagPipeline instance
        """
        # Determine appropriate sources based on query if not provided
        if sources is None:
            sources = AgentFactory._infer_sources_from_query(query)

        # Create pipeline with appropriate configuration
        pipeline = RagPipelineFactory.create_pipeline(
            name="default_agent",
            vector_store_config=vector_store_config,
            sources=sources,
            max_source_count=max_source_count,
            similarity_threshold=similarity_threshold
        )

        return pipeline

    @staticmethod
    async def create_agent_by_id(
        query: str,
        history: List[Message],
        agent_id: str,
        vector_store_config: VectorStoreConfig,
        config_manager: Optional[ConfigManager] = None,
        mcp_mode: bool = False
    ) -> RagPipeline:
        """
        Create an agent based on a specific agent ID configuration.

        Args:
            query: User's query
            history: Chat history
            agent_id: Specific agent identifier
            vector_store_config: Vector store for document retrieval
            config_manager: Optional configuration manager
            mcp_mode: Whether to use MCP mode

        Returns:
            Configured RagPipeline instance

        Raises:
            ValueError: If agent_id is not found in configuration
        """
        # Load agent configuration
        if config_manager is None:
            config_manager = ConfigManager()

        try:
            agent_config = config_manager.get_agent_config(agent_id)
        except KeyError:
            raise ValueError(f"Agent configuration not found for ID: {agent_id}")

        # Create pipeline based on agent configuration
        pipeline = await AgentFactory._create_pipeline_from_config(
            agent_config=agent_config,
            vector_store_config=vector_store_config,
            query=query,
            history=history,
            mcp_mode=mcp_mode
        )

        return pipeline

    async def get_or_create_agent(
        self,
        agent_id: str,
        query: str,
        history: List[Message],
        mcp_mode: bool = False
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
        agent = await self.create_agent_by_id(
            query=query,
            history=history,
            agent_id=agent_id,
            vector_store_config=self.vector_store_config,
            config_manager=self.config_manager,
            mcp_mode=mcp_mode
        )

        # Cache the agent
        self._agent_cache[cache_key] = agent

        return agent

    def clear_cache(self):
        """Clear the agent cache."""
        self._agent_cache.clear()

    def get_available_agents(self) -> List[str]:
        """
        Get list of available agent IDs.

        Returns:
            List of configured agent IDs
        """
        return list(self.agent_configs.keys())

    def get_agent_info(self, agent_id: str) -> Dict[str, any]:
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
            'id': config.id,
            'name': config.name,
            'description': config.description,
            'sources': [source.value for source in config.sources],
            'max_source_count': config.max_source_count,
            'similarity_threshold': config.similarity_threshold,
            'contract_template': config.contract_template,
            'test_template': config.test_template
        }

    @staticmethod
    def _infer_sources_from_query(query: str) -> List[DocumentSource]:
        """
        Infer appropriate documentation sources from the query.

        Args:
            query: User's query

        Returns:
            List of relevant DocumentSource values
        """
        query_lower = query.lower()
        sources = []

        # Source-specific keywords
        source_keywords = {
            DocumentSource.SCARB_DOCS: ['scarb', 'build', 'package', 'dependency', 'toml'],
            DocumentSource.STARKNET_FOUNDRY: ['foundry', 'forge', 'cast', 'test', 'anvil'],
            DocumentSource.OPENZEPPELIN_DOCS: ['openzeppelin', 'oz', 'token', 'erc', 'standard'],
            DocumentSource.CORELIB_DOCS: ['corelib', 'core', 'builtin', 'primitive'],
            DocumentSource.CAIRO_BY_EXAMPLE: ['example', 'tutorial', 'guide', 'walkthrough'],
            DocumentSource.STARKNET_DOCS: ['starknet', 'account', 'transaction', 'fee', 'l2', 'contract'],
            DocumentSource.CAIRO_BOOK: ['cairo', 'syntax', 'language', 'type', 'variable']
        }

        # Check for specific source keywords
        for source, keywords in source_keywords.items():
            if any(keyword in query_lower for keyword in keywords):
                sources.append(source)

        # Default to Cairo Book and Starknet Docs if no specific sources found
        if not sources:
            sources = [DocumentSource.CAIRO_BOOK, DocumentSource.STARKNET_DOCS]

        return sources

    @staticmethod
    async def _create_pipeline_from_config(
        agent_config: AgentConfiguration,
        vector_store_config: VectorStoreConfig,
        query: str,
        history: List[Message],
        mcp_mode: bool = False
    ) -> RagPipeline:
        """
        Create a RAG Pipeline from agent configuration.

        Args:
            agent_config: Agent configuration
            vector_store: Vector store for document retrieval
            query: User's query
            history: Chat history
            mcp_mode: Whether to use MCP mode

        Returns:
            Configured RagPipeline instance
        """
        # Determine pipeline type based on agent configuration
        pipeline_type = "general"
        if agent_config.id == "scarb_assistant":
            pipeline_type = "scarb"

        # Create pipeline with agent-specific configuration
        if pipeline_type == "scarb":
            pipeline = RagPipelineFactory.create_scarb_pipeline(
                name=agent_config.name,
                vector_store_config=vector_store_config,
                sources=agent_config.sources or [DocumentSource.SCARB_DOCS],
                max_source_count=agent_config.max_source_count,
                similarity_threshold=agent_config.similarity_threshold,
                contract_template=agent_config.contract_template,
                test_template=agent_config.test_template
            )
        else:
            pipeline = RagPipelineFactory.create_pipeline(
                name=agent_config.name,
                vector_store_config=vector_store_config,
                sources=agent_config.sources,
                max_source_count=agent_config.max_source_count,
                similarity_threshold=agent_config.similarity_threshold,
                contract_template=agent_config.contract_template,
                test_template=agent_config.test_template
            )

        return pipeline


class DefaultAgentConfigurations:
    """
    Default agent configurations for common use cases.
    """

    @staticmethod
    def get_default_agent() -> AgentConfiguration:
        """Get the default general-purpose agent configuration."""
        return AgentConfiguration(
            id="default",
            name="Cairo Assistant",
            description="General-purpose Cairo programming assistant",
            sources=[DocumentSource.CAIRO_BOOK, DocumentSource.STARKNET_DOCS],
            max_source_count=5,
            similarity_threshold=0.35,
            contract_template="""
When writing Cairo contracts:
1. Use #[starknet::contract] for contract modules
2. Define storage with #[storage] struct
3. Use #[external(v0)] for external functions
4. Use #[view] for read-only functions
5. Include proper error handling
6. Follow Cairo naming conventions
            """,
            test_template="""
When writing Cairo tests:
1. Use #[test] for test functions
2. Include proper setup and teardown
3. Test both success and failure cases
4. Use descriptive test names
5. Include assertions with clear messages
            """
        )

    @staticmethod
    def get_scarb_agent() -> AgentConfiguration:
        """Get the Scarb-specific agent configuration."""
        return AgentConfiguration(
            id="scarb_assistant",
            name="Scarb Assistant",
            description="Specialized assistant for Scarb build tool",
            sources=[DocumentSource.SCARB_DOCS],
            max_source_count=5,
            similarity_threshold=0.35,
            contract_template=None,
            test_template=None
        )

def create_agent_factory(
    vector_store_config: VectorStoreConfig,
    config_manager: Optional[ConfigManager] = None,
    custom_agents: Optional[Dict[str, AgentConfiguration]] = None
) -> AgentFactory:
    """
    Create an AgentFactory with default configurations.

    Args:
        vector_store: Vector store for document retrieval
        config_manager: Optional configuration manager
        custom_agents: Optional custom agent configurations

    Returns:
        Configured AgentFactory instance
    """
    if config_manager is None:
        config_manager = ConfigManager()

    # Load default agent configurations
    default_configs = {
        "default": DefaultAgentConfigurations.get_default_agent(),
        "scarb_assistant": DefaultAgentConfigurations.get_scarb_agent(),
    }

    # Add custom agents if provided
    if custom_agents:
        default_configs.update(custom_agents)

    # Create factory configuration
    factory_config = AgentFactoryConfig(
        vector_store_config=vector_store_config,
        config_manager=config_manager,
        default_agent_config=default_configs["default"],
        agent_configs=default_configs
    )

    return AgentFactory(factory_config)
