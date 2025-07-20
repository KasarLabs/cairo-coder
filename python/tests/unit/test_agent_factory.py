"""
Unit tests for Agent Factory.

Tests the agent creation and configuration functionality including
default agents, custom agents, and agent caching.
"""

from unittest.mock import Mock, patch

import pytest

from cairo_coder.core.agent_factory import (
    AgentFactory,
    AgentFactoryConfig,
    DefaultAgentConfigurations,
    create_agent_factory,
)
from cairo_coder.core.config import AgentConfiguration
from cairo_coder.core.rag_pipeline import RagPipeline
from cairo_coder.core.types import DocumentSource, Message


class TestAgentFactory:
    """Test suite for AgentFactory."""

    @pytest.fixture
    def factory_config(self, mock_vector_store_config, mock_config_manager, sample_agent_configs):
        """Create an agent factory configuration."""
        return AgentFactoryConfig(
            vector_store_config=mock_vector_store_config,
            config_manager=mock_config_manager,
            default_agent_config=sample_agent_configs["default"],
            agent_configs=sample_agent_configs,
        )

    @pytest.fixture
    def agent_factory(self, factory_config):
        """Create an AgentFactory instance."""
        return AgentFactory(factory_config)

    def test_create_agent_default(self, mock_vector_store_config):
        """Test creating a default agent."""
        query = "How do I create a Cairo contract?"
        history = [Message(role="user", content="Hello")]

        with patch(
            "cairo_coder.core.agent_factory.RagPipelineFactory.create_pipeline"
        ) as mock_create:
            mock_pipeline = Mock(spec=RagPipeline)
            mock_create.return_value = mock_pipeline

            agent = AgentFactory.create_agent(
                query=query, history=history, vector_store_config=mock_vector_store_config
            )

            assert agent == mock_pipeline
            mock_create.assert_called_once()
            call_args = mock_create.call_args[1]
            assert call_args["name"] == "default_agent"
            assert call_args["vector_store_config"] == mock_vector_store_config
            assert set(call_args["sources"]) == {
                DocumentSource.CAIRO_BOOK,
                DocumentSource.STARKNET_DOCS,
            }
            assert call_args["max_source_count"] == 10
            assert call_args["similarity_threshold"] == 0.4

    def test_create_agent_with_custom_sources(self, mock_vector_store_config):
        """Test creating agent with custom sources."""
        query = "How do I use Scarb?"
        history = []
        sources = [DocumentSource.SCARB_DOCS]

        with patch(
            "cairo_coder.core.agent_factory.RagPipelineFactory.create_pipeline"
        ) as mock_create:
            mock_pipeline = Mock(spec=RagPipeline)
            mock_create.return_value = mock_pipeline

            agent = AgentFactory.create_agent(
                query=query,
                history=history,
                vector_store_config=mock_vector_store_config,
                sources=sources,
                max_source_count=5,
                similarity_threshold=0.6,
            )

            assert agent == mock_pipeline
            mock_create.assert_called_once_with(
                name="default_agent",
                vector_store_config=mock_vector_store_config,
                vector_db=None,
                sources=sources,
                max_source_count=5,
                similarity_threshold=0.6,
            )

    @pytest.mark.asyncio
    async def test_create_agent_by_id(self, mock_vector_store_config, mock_config_manager):
        """Test creating agent by ID."""
        query = "How do I create a contract?"
        history = [Message(role="user", content="Hello")]
        agent_id = "test_agent"

        with patch(
            "cairo_coder.core.agent_factory.AgentFactory._create_pipeline_from_config"
        ) as mock_create:
            mock_pipeline = Mock(spec=RagPipeline)
            mock_create.return_value = mock_pipeline

            agent = AgentFactory.create_agent_by_id(
                query=query,
                history=history,
                agent_id=agent_id,
                vector_store_config=mock_vector_store_config,
                config_manager=mock_config_manager,
            )

            assert agent == mock_pipeline
            mock_config_manager.get_agent_config.assert_called_once_with(agent_id)
            mock_create.assert_called_once()

    @pytest.mark.asyncio
    async def test_create_agent_by_id_not_found(
        self, mock_vector_store_config, mock_config_manager
    ):
        """Test creating agent by ID when agent not found."""
        mock_config_manager.get_agent_config.side_effect = KeyError("Agent not found")

        query = "How do I create a contract?"
        history = []
        agent_id = "nonexistent_agent"

        with pytest.raises(ValueError, match="Agent configuration not found"):
            AgentFactory.create_agent_by_id(
                query=query,
                history=history,
                agent_id=agent_id,
                vector_store_config=mock_vector_store_config,
                config_manager=mock_config_manager,
            )

    @pytest.mark.asyncio
    def test_get_or_create_agent_cache_miss(self, agent_factory):
        """Test get_or_create_agent with cache miss."""
        query = "Test query"
        history = []
        agent_id = "test_agent"

        with patch.object(agent_factory, "create_agent_by_id") as mock_create:
            mock_pipeline = Mock(spec=RagPipeline)
            mock_create.return_value = mock_pipeline

            agent = agent_factory.get_or_create_agent(
                agent_id=agent_id, query=query, history=history
            )

            assert agent == mock_pipeline
            mock_create.assert_called_once_with(
                query=query,
                history=history,
                agent_id=agent_id,
                vector_store_config=agent_factory.vector_store_config,
                config_manager=agent_factory.config_manager,
                mcp_mode=False,
                vector_db=None,
            )

            # Verify agent was cached
            cache_key = f"{agent_id}_False"
            assert cache_key in agent_factory._agent_cache
            assert agent_factory._agent_cache[cache_key] == mock_pipeline

    @pytest.mark.asyncio
    async def test_get_or_create_agent_cache_hit(self, agent_factory):
        """Test get_or_create_agent with cache hit."""
        query = "Test query"
        history = []
        agent_id = "test_agent"

        # Pre-populate cache
        mock_pipeline = Mock(spec=RagPipeline)
        cache_key = f"{agent_id}_False"
        agent_factory._agent_cache[cache_key] = mock_pipeline

        with patch.object(agent_factory, "create_agent_by_id") as mock_create:
            agent = agent_factory.get_or_create_agent(
                agent_id=agent_id, query=query, history=history
            )

            assert agent == mock_pipeline
            # Should not call create_agent_by_id since it's cached
            mock_create.assert_not_called()

    def test_clear_cache(self, agent_factory):
        """Test clearing the agent cache."""
        # Populate cache
        agent_factory._agent_cache["test_key"] = Mock()
        assert len(agent_factory._agent_cache) == 1

        # Clear cache
        agent_factory.clear_cache()
        assert len(agent_factory._agent_cache) == 0

    def test_get_available_agents(self, agent_factory):
        """Test getting available agent IDs."""
        available_agents = agent_factory.get_available_agents()

        assert "test_agent" in available_agents
        assert "scarb_agent" in available_agents
        assert len(available_agents) >= 2  # At least these two agents should be available

    def test_get_agent_info(self, agent_factory):
        """Test getting agent information."""
        info = agent_factory.get_agent_info("test_agent")

        assert info["id"] == "test_agent"
        assert info["name"] == "Test Agent"
        assert info["description"] == "Test agent for testing"
        assert info["sources"] == ["cairo_book"]
        assert info["max_source_count"] == 5
        assert info["similarity_threshold"] == 0.5

    def test_get_agent_info_not_found(self, agent_factory):
        """Test getting agent information for non-existent agent."""
        with pytest.raises(ValueError, match="Agent not found"):
            agent_factory.get_agent_info("nonexistent_agent")

    def test_infer_sources_from_query_scarb(self):
        """Test inferring sources from Scarb-related query."""
        query = "How do I configure Scarb for my project?"

        sources = AgentFactory._infer_sources_from_query(query)

        assert DocumentSource.SCARB_DOCS in sources

    def test_infer_sources_from_query_foundry(self):
        """Test inferring sources from Foundry-related query."""
        query = "How do I use forge test command?"

        sources = AgentFactory._infer_sources_from_query(query)

        assert DocumentSource.STARKNET_FOUNDRY in sources

    def test_infer_sources_from_query_openzeppelin(self):
        """Test inferring sources from OpenZeppelin-related query."""
        query = "How do I implement ERC20 token with OpenZeppelin?"

        sources = AgentFactory._infer_sources_from_query(query)

        assert DocumentSource.OPENZEPPELIN_DOCS in sources

    def test_infer_sources_from_query_default(self):
        """Test inferring sources from generic query."""
        query = "How do I create a function?"

        sources = AgentFactory._infer_sources_from_query(query)

        assert DocumentSource.CAIRO_BOOK in sources
        assert DocumentSource.STARKNET_DOCS in sources

    def test_infer_sources_from_query_multiple(self):
        """Test inferring sources from query with multiple relevant sources."""
        query = "How do I test Cairo contracts with Foundry and OpenZeppelin?"

        sources = AgentFactory._infer_sources_from_query(query)

        assert DocumentSource.STARKNET_FOUNDRY in sources
        assert DocumentSource.OPENZEPPELIN_DOCS in sources
        assert DocumentSource.CAIRO_BOOK in sources

    @pytest.mark.asyncio
    async def test_create_pipeline_from_config_general(self, mock_vector_store_config):
        """Test creating pipeline from general agent configuration."""
        agent_config = AgentConfiguration(
            id="general_agent",
            name="General Agent",
            description="General purpose agent",
            sources=[DocumentSource.CAIRO_BOOK],
            max_source_count=10,
            similarity_threshold=0.4,
        )

        with patch(
            "cairo_coder.core.agent_factory.RagPipelineFactory.create_pipeline"
        ) as mock_create:
            mock_pipeline = Mock(spec=RagPipeline)
            mock_create.return_value = mock_pipeline

            pipeline = AgentFactory._create_pipeline_from_config(
                agent_config=agent_config,
                vector_store_config=mock_vector_store_config,
                query="Test query",
                history=[],
            )

            assert pipeline == mock_pipeline
            mock_create.assert_called_once_with(
                name="General Agent",
                vector_store_config=mock_vector_store_config,
                sources=[DocumentSource.CAIRO_BOOK],
                max_source_count=10,
                similarity_threshold=0.4,
                contract_template=None,
                test_template=None,
                vector_db=None,
            )

    @pytest.mark.asyncio
    async def test_create_pipeline_from_config_scarb(self, mock_vector_store_config):
        """Test creating pipeline from Scarb agent configuration."""
        agent_config = AgentConfiguration(
            id="scarb_assistant",
            name="Scarb Assistant",
            description="Scarb-specific agent",
            sources=[DocumentSource.SCARB_DOCS],
            max_source_count=5,
            similarity_threshold=0.4,
        )

        with patch(
            "cairo_coder.core.agent_factory.RagPipelineFactory.create_scarb_pipeline"
        ) as mock_create:
            mock_pipeline = Mock(spec=RagPipeline)
            mock_create.return_value = mock_pipeline

            pipeline = AgentFactory._create_pipeline_from_config(
                agent_config=agent_config,
                vector_store_config=mock_vector_store_config,
                query="Test query",
                history=[],
            )

            assert pipeline == mock_pipeline
            mock_create.assert_called_once_with(
                name="Scarb Assistant",
                vector_store_config=mock_vector_store_config,
                sources=[DocumentSource.SCARB_DOCS],
                max_source_count=5,
                similarity_threshold=0.4,
                contract_template=None,
                test_template=None,
                vector_db=None,
            )


class TestDefaultAgentConfigurations:
    """Test suite for DefaultAgentConfigurations."""

    def test_get_default_agent(self):
        """Test getting default agent configuration."""
        config = DefaultAgentConfigurations.get_default_agent()

        assert config.id == "default"
        assert config.name == "Cairo Assistant"
        assert "General-purpose Cairo programming assistant" in config.description
        assert DocumentSource.CAIRO_BOOK in config.sources
        assert DocumentSource.STARKNET_DOCS in config.sources
        assert config.max_source_count == 5
        assert config.similarity_threshold == 0.35
        assert config.contract_template is not None
        assert config.test_template is not None

    def test_get_scarb_agent(self):
        """Test getting Scarb agent configuration."""
        config = DefaultAgentConfigurations.get_scarb_agent()

        assert config.id == "scarb_assistant"
        assert config.name == "Scarb Assistant"
        assert "Scarb build tool" in config.description
        assert config.sources == [DocumentSource.SCARB_DOCS]
        assert config.max_source_count == 5
        assert config.similarity_threshold == 0.35
        assert config.contract_template is None
        assert config.test_template is None


class TestAgentFactoryConfig:
    """Test suite for AgentFactoryConfig."""

    def test_agent_factory_config_creation(self):
        """Test creating agent factory configuration."""
        mock_vector_store_config = Mock()
        mock_config_manager = Mock()
        default_config = Mock()
        agent_configs = {"test": Mock()}

        config = AgentFactoryConfig(
            vector_store_config=mock_vector_store_config,
            config_manager=mock_config_manager,
            default_agent_config=default_config,
            agent_configs=agent_configs,
        )

        assert config.vector_store_config == mock_vector_store_config
        assert config.config_manager == mock_config_manager
        assert config.default_agent_config == default_config
        assert config.agent_configs == agent_configs

    def test_agent_factory_config_defaults(self, mock_vector_store_config):
        """Test agent factory configuration with defaults."""
        config = AgentFactoryConfig(
            vector_store_config=mock_vector_store_config, config_manager=Mock()
        )

        assert config.default_agent_config is None
        assert config.agent_configs == {}


class TestCreateAgentFactory:
    """Test suite for create_agent_factory function."""

    def test_create_agent_factory_defaults(self, mock_vector_store_config):
        """Test creating agent factory with defaults."""

        with patch("cairo_coder.core.agent_factory.ConfigManager") as mock_config_class:
            mock_config_manager = Mock()
            mock_config_class.return_value = mock_config_manager

            factory = create_agent_factory(mock_vector_store_config)

            assert isinstance(factory, AgentFactory)
            assert factory.vector_store_config == mock_vector_store_config
            assert factory.config_manager == mock_config_manager

            # Check default agents are configured
            available_agents = factory.get_available_agents()
            assert "default" in available_agents
            assert "scarb_assistant" in available_agents

    def test_create_agent_factory_with_custom_config(self, mock_vector_store_config):
        """Test creating agent factory with custom configuration."""
        mock_config_manager = Mock()

        custom_agents = {
            "custom_agent": AgentConfiguration(
                id="custom_agent",
                name="Custom Agent",
                description="Custom agent for testing",
                sources=[DocumentSource.CAIRO_BOOK],
                max_source_count=5,
                similarity_threshold=0.5,
            )
        }

        factory = create_agent_factory(
            vector_store_config=mock_vector_store_config,
            config_manager=mock_config_manager,
            custom_agents=custom_agents,
        )

        assert isinstance(factory, AgentFactory)
        assert factory.vector_store_config == mock_vector_store_config
        assert factory.config_manager == mock_config_manager

        # Check custom agent is included
        available_agents = factory.get_available_agents()
        assert "custom_agent" in available_agents
        assert "default" in available_agents  # Default agents should still be there

    def test_create_agent_factory_custom_agent_override(self, mock_vector_store_config):
        """Test creating agent factory with custom agent overriding default."""

        # Override default agent
        custom_agents = {
            "default": AgentConfiguration(
                id="default",
                name="Custom Default Agent",
                description="Overridden default agent",
                sources=[DocumentSource.SCARB_DOCS],
                max_source_count=3,
                similarity_threshold=0.7,
            )
        }

        factory = create_agent_factory(
            vector_store_config=mock_vector_store_config, custom_agents=custom_agents
        )

        # Check that the default agent was overridden
        info = factory.get_agent_info("default")
        assert info["name"] == "Custom Default Agent"
        assert info["description"] == "Overridden default agent"
        assert info["sources"] == ["scarb_docs"]
        assert info["max_source_count"] == 3
        assert info["similarity_threshold"] == 0.7
