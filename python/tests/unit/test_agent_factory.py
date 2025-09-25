"""
Unit tests for Agent Factory.

Tests the agent creation and configuration functionality using
the lightweight agent registry.
"""

from unittest.mock import Mock, patch

import pytest

from cairo_coder.agents.registry import AgentId, get_agent_by_string_id, registry
from cairo_coder.core.agent_factory import AgentFactory, create_agent_factory
from cairo_coder.core.rag_pipeline import RagPipeline


class TestAgentFactory:
    """Test suite for AgentFactory."""

    @pytest.fixture
    def agent_factory(self, mock_vector_db, mock_vector_store_config):
        """Create an AgentFactory instance."""
        return AgentFactory(mock_vector_db, mock_vector_store_config)

    def test_get_or_create_agent_cache_miss(self, agent_factory, mock_vector_db, mock_vector_store_config):
        """Test get_or_create_agent with cache miss."""
        agent_id = "cairo-coder"

        with patch.object(registry[AgentId.CAIRO_CODER], "build") as mock_build:
            mock_pipeline = Mock(spec=RagPipeline)
            mock_build.return_value = mock_pipeline

            agent = agent_factory.get_or_create_agent(
                agent_id=agent_id
            )

            assert agent == mock_pipeline
            mock_build.assert_called_once_with(mock_vector_db, mock_vector_store_config)

            # Verify agent was cached
            cache_key = f"{agent_id}_False"
            assert cache_key in agent_factory._agent_cache
            assert agent_factory._agent_cache[cache_key] == mock_pipeline

    def test_get_or_create_agent_cache_hit(self, agent_factory):
        """Test get_or_create_agent with cache hit."""
        agent_id = "cairo-coder"

        # Pre-populate cache
        mock_pipeline = Mock(spec=RagPipeline)
        cache_key = f"{agent_id}_False"
        agent_factory._agent_cache[cache_key] = mock_pipeline

        with patch("cairo_coder.agents.registry.get_agent_by_string_id") as mock_get:
            agent = agent_factory.get_or_create_agent(
                agent_id=agent_id
            )

            assert agent == mock_pipeline
            # Should not call get_agent_by_string_id since it's cached
            mock_get.assert_not_called()

    def test_get_or_create_agent_invalid_id(self, agent_factory):
        """Test get_or_create_agent with invalid agent ID."""
        agent_id = "nonexistent"

        with pytest.raises(ValueError, match="Agent not found: nonexistent"):
            agent_factory.get_or_create_agent(
                agent_id=agent_id
            )

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

        assert "cairo-coder" in available_agents
        assert "scarb-assistant" in available_agents
        assert len(available_agents) == 2

    def test_get_agent_info(self, agent_factory):
        """Test getting agent information."""
        info = agent_factory.get_agent_info("cairo-coder")

        assert info["id"] == "cairo-coder"
        assert info["name"] == "Cairo Coder"
        assert info["description"] == "General Cairo programming assistant"
        assert len(info["sources"]) > 0
        assert info["max_source_count"] == 5
        assert info["similarity_threshold"] == 0.4

    def test_get_agent_info_scarb(self, agent_factory):
        """Test getting Scarb agent information."""
        info = agent_factory.get_agent_info("scarb-assistant")

        assert info["id"] == "scarb-assistant"
        assert info["name"] == "Scarb Assistant"
        assert info["description"] == "Specialized assistant for Scarb build tool"
        assert info["sources"] == ["scarb_docs"]
        assert info["max_source_count"] == 5
        assert info["similarity_threshold"] == 0.3

    def test_get_agent_info_not_found(self, agent_factory):
        """Test getting agent information for non-existent agent."""
        with pytest.raises(ValueError, match="Agent not found"):
            agent_factory.get_agent_info("nonexistent_agent")


class TestCreateAgentFactory:
    """Test suite for create_agent_factory function."""

    def test_create_agent_factory(self, mock_vector_db, mock_vector_store_config):
        """Test creating agent factory."""
        factory = create_agent_factory(mock_vector_db, mock_vector_store_config)

        assert isinstance(factory, AgentFactory)
        assert factory.vector_db == mock_vector_db
        assert factory.vector_store_config == mock_vector_store_config

        # Check default agents are available
        available_agents = factory.get_available_agents()
        assert "cairo-coder" in available_agents
        assert "scarb-assistant" in available_agents


class TestAgentRegistry:
    """Test suite for agent registry functionality."""

    def test_registry_contains_all_agents(self):
        """Test that registry contains all expected agents."""
        assert AgentId.CAIRO_CODER in registry
        assert AgentId.SCARB in registry
        assert len(registry) == 2

    def test_get_agent_by_string_id_valid(self):
        """Test getting agent by valid string ID."""
        enum_id, spec = get_agent_by_string_id("cairo-coder")
        assert enum_id == AgentId.CAIRO_CODER
        assert spec.name == "Cairo Coder"

        enum_id, spec = get_agent_by_string_id("scarb-assistant")
        assert enum_id == AgentId.SCARB
        assert spec.name == "Scarb Assistant"

    def test_get_agent_by_string_id_invalid(self):
        """Test getting agent by invalid string ID."""
        with pytest.raises(ValueError, match="Agent not found: invalid"):
            get_agent_by_string_id("invalid")

    @patch("cairo_coder.core.rag_pipeline.RagPipelineFactory.create_pipeline")
    def test_agent_spec_build_general(self, mock_create_pipeline, mock_vector_db, mock_vector_store_config):
        """Test building a general agent from spec."""
        spec = registry[AgentId.CAIRO_CODER]
        mock_pipeline = Mock(spec=RagPipeline)
        mock_create_pipeline.return_value = mock_pipeline

        pipeline = spec.build(mock_vector_db, mock_vector_store_config)

        assert pipeline == mock_pipeline
        mock_create_pipeline.assert_called_once()
        call_args = mock_create_pipeline.call_args[1]
        assert call_args["name"] == "Cairo Coder"
        assert call_args["vector_db"] == mock_vector_db
        assert call_args["vector_store_config"] == mock_vector_store_config

    @patch("cairo_coder.core.rag_pipeline.RagPipelineFactory.create_pipeline")
    def test_agent_spec_build_scarb(self, mock_create_scarb, mock_vector_db, mock_vector_store_config):
        """Test building a Scarb agent from spec."""
        spec = registry[AgentId.SCARB]
        mock_pipeline = Mock(spec=RagPipeline)
        mock_create_scarb.return_value = mock_pipeline

        pipeline = spec.build(mock_vector_db, mock_vector_store_config)

        assert pipeline == mock_pipeline
        mock_create_scarb.assert_called_once()
        call_args = mock_create_scarb.call_args[1]
        assert call_args["name"] == "Scarb Assistant"
        assert call_args["vector_db"] == mock_vector_db
        assert call_args["vector_store_config"] == mock_vector_store_config
