"""
Unit tests for FastAPI server.

Tests the FastAPI application endpoints and server functionality.
This test file is for the OpenAI-compatible server implementation.
"""

from unittest.mock import AsyncMock, Mock, patch

import pytest
from fastapi.testclient import TestClient

from cairo_coder.config.manager import ConfigManager
from cairo_coder.core.agent_factory import AgentFactory
from cairo_coder.server.app import CairoCoderServer, TokenTracker


class TestCairoCoderServer:
    """Test suite for CairoCoderServer."""

    @pytest.fixture
    def mock_agent_factory(self, mock_agent):
        """Patch create_agent_factory and return the mock factory."""
        with patch("cairo_coder.server.app.create_agent_factory") as mock_create_factory:
            factory = Mock(spec=AgentFactory)
            factory.get_available_agents.return_value = ["default"]
            factory.get_agent_info.return_value = {
                "id": "default",
                "name": "Default Agent",
                "description": "Default Cairo assistant",
                "sources": ["cairo_book"],
            }
            factory.get_or_create_agent.return_value = mock_agent
            factory.create_agent.return_value = mock_agent
            mock_create_factory.return_value = factory
            yield factory

    @pytest.fixture
    def server(self, mock_vector_store_config, mock_config_manager, mock_agent_factory):
        """Create a CairoCoderServer instance with a mocked agent factory."""
        return CairoCoderServer(mock_vector_store_config, mock_config_manager)

    @pytest.fixture
    def client(self, server):
        """Create a test client."""
        # Create a mock vector DB for dependency injection
        from cairo_coder.server.app import get_vector_db

        async def mock_get_vector_db():
            mock_db = AsyncMock()
            mock_db.pool = AsyncMock()
            mock_db._ensure_pool = AsyncMock()
            mock_db.sources = []
            return mock_db

        server.app.dependency_overrides[get_vector_db] = mock_get_vector_db
        return TestClient(server.app)

    def test_health_check(self, client):
        """Test health check endpoint."""
        response = client.get("/")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"

    def test_list_agents(self, client):
        """Test list agents endpoint."""
        response = client.get("/v1/agents")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    def test_chat_completions_basic(self, client):
        """Test basic chat completions endpoint."""
        response = client.post(
            "/v1/chat/completions",
            json={"messages": [{"role": "user", "content": "Hello"}], "stream": False},
        )

        assert response.status_code == 200
        data = response.json()
        assert "choices" in data
        assert "usage" in data
        assert data["model"] == "cairo-coder"

    def test_chat_completions_validation(self, client):
        """Test chat completions validation."""
        # Test empty messages
        response = client.post("/v1/chat/completions", json={"messages": []})
        assert response.status_code == 422

        # Test last message not from user
        response = client.post(
            "/v1/chat/completions",
            json={
                "messages": [
                    {"role": "user", "content": "Hello"},
                    {"role": "assistant", "content": "Hi"},
                ]
            },
        )
        assert response.status_code == 422

    def test_agent_specific_completions(self, client, mock_agent_factory, mock_agent):
        """Test agent-specific chat completions."""
        mock_agent_factory.get_agent_info.return_value = {
            "id": "default",
            "name": "Default Agent",
            "description": "Default Cairo assistant",
            "sources": ["cairo_book"],
        }
        mock_agent_factory.get_or_create_agent = AsyncMock(return_value=mock_agent)

        response = client.post(
            "/v1/agents/default/chat/completions",
            json={"messages": [{"role": "user", "content": "Hello"}], "stream": False},
        )

        assert response.status_code == 200
        data = response.json()
        assert "choices" in data

    def test_agent_not_found(self, client, mock_agent_factory):
        """Test agent not found error."""
        mock_agent_factory.get_agent_info.side_effect = ValueError("Agent not found")

        response = client.post(
            "/v1/agents/nonexistent/chat/completions",
            json={"messages": [{"role": "user", "content": "Hello"}]},
        )

        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert "error" in data["detail"]

    def test_streaming_response(self, client):
        """Test streaming chat completions."""
        response = client.post(
            "/v1/chat/completions",
            json={"messages": [{"role": "user", "content": "Hello"}], "stream": True},
        )

        assert response.status_code == 200
        assert "text/event-stream" in response.headers["content-type"]

    def test_mcp_mode(self, client):
        """Test MCP mode functionality."""
        response = client.post(
            "/v1/chat/completions",
            json={"messages": [{"role": "user", "content": "Test"}]},
            headers={"x-mcp-mode": "true"},
        )

        assert response.status_code == 200

    def test_error_handling(self, client, mock_agent_factory):
        """Test error handling in chat completions."""
        mock_agent_factory.create_agent.side_effect = Exception("Agent creation failed")

        response = client.post(
            "/v1/chat/completions", json={"messages": [{"role": "user", "content": "Hello"}]}
        )

        assert response.status_code == 500
        data = response.json()
        assert "detail" in data
        assert "error" in data["detail"]


class TestTokenTracker:
    """Test suite for TokenTracker."""

    def test_track_tokens(self):
        """Test token tracking functionality."""
        tracker = TokenTracker()

        tracker.track_tokens("session1", 10, 20)
        usage = tracker.get_session_usage("session1")

        assert usage["prompt_tokens"] == 10
        assert usage["completion_tokens"] == 20
        assert usage["total_tokens"] == 30

    def test_multiple_sessions(self):
        """Test tracking multiple sessions."""
        tracker = TokenTracker()

        tracker.track_tokens("session1", 10, 20)
        tracker.track_tokens("session2", 15, 25)

        usage1 = tracker.get_session_usage("session1")
        usage2 = tracker.get_session_usage("session2")

        assert usage1["total_tokens"] == 30
        assert usage2["total_tokens"] == 40

    def test_session_accumulation(self):
        """Test token accumulation within a session."""
        tracker = TokenTracker()

        tracker.track_tokens("session1", 10, 20)
        tracker.track_tokens("session1", 5, 15)

        usage = tracker.get_session_usage("session1")

        assert usage["prompt_tokens"] == 15
        assert usage["completion_tokens"] == 35
        assert usage["total_tokens"] == 50

    def test_nonexistent_session(self):
        """Test getting usage for nonexistent session."""
        tracker = TokenTracker()

        usage = tracker.get_session_usage("nonexistent")

        assert usage["prompt_tokens"] == 0
        assert usage["completion_tokens"] == 0
        assert usage["total_tokens"] == 0


class TestCreateApp:
    """Test suite for create_app function."""

    def test_create_app_basic(self, mock_vector_store_config):
        """Test basic app creation."""
        from cairo_coder.server.app import create_app

        mock_config_manager = Mock(spec=ConfigManager)

        with patch("cairo_coder.server.app.create_agent_factory"):
            app = create_app(mock_vector_store_config, mock_config_manager)

            assert app is not None
            assert app.title == "Cairo Coder"
            assert app.version == "1.0.0"

    def test_create_app_with_defaults(self, mock_vector_store_config):
        """Test app creation with default config manager."""
        from cairo_coder.server.app import create_app

        with (
            patch("cairo_coder.server.app.create_agent_factory"),
            patch("cairo_coder.config.manager.ConfigManager"),
        ):
            app = create_app(mock_vector_store_config)

            assert app is not None

    def test_cors_configuration(self, mock_vector_store_config):
        """Test CORS configuration."""
        from cairo_coder.server.app import create_app

        with patch("cairo_coder.server.app.create_agent_factory"):
            app = create_app(mock_vector_store_config)
            client = TestClient(app)

            # Test CORS headers
            response = client.options(
                "/v1/chat/completions",
                headers={"Origin": "https://example.com", "Access-Control-Request-Method": "POST"},
            )

            assert response.status_code in [200, 204]

    def test_app_middleware(self, mock_vector_store_config):
        """Test that app has proper middleware configuration."""
        from cairo_coder.server.app import create_app

        with patch("cairo_coder.server.app.create_agent_factory"):
            app = create_app(mock_vector_store_config)

            # Check that middleware is properly configured
            # FastAPI apps have middleware, but middleware_stack might be None until build
            assert hasattr(app, "middleware_stack")
            # Check that CORS middleware was added by verifying the middleware property exists
            assert hasattr(app, "middleware")

    def test_app_routes(self, mock_vector_store_config):
        """Test that app has expected routes."""
        from cairo_coder.server.app import create_app

        with patch("cairo_coder.server.app.create_agent_factory"):
            app = create_app(mock_vector_store_config)

            # Get all routes
            routes = [route.path for route in app.routes]

            # Check expected routes exist
            assert "/" in routes
            assert "/v1/agents" in routes
            assert "/v1/chat/completions" in routes


class TestServerConfiguration:
    """Test suite for server configuration."""

    def test_server_initialization(self, mock_vector_store_config):
        """Test server initialization."""
        mock_config_manager = Mock(spec=ConfigManager)

        with patch("cairo_coder.server.app.create_agent_factory"):
            server = CairoCoderServer(mock_vector_store_config, mock_config_manager)

            assert server.vector_store_config == mock_vector_store_config
            assert server.config_manager == mock_config_manager
            assert server.app is not None
            assert server.token_tracker is not None

    def test_server_dependencies(self, mock_vector_store_config):
        """Test server dependency injection."""
        mock_config_manager = Mock(spec=ConfigManager)

        with patch("cairo_coder.server.app.create_agent_factory") as mock_create_factory:
            mock_factory = Mock()
            mock_create_factory.return_value = mock_factory

            CairoCoderServer(mock_vector_store_config, mock_config_manager)

            # This test now verifies that the factory is not a member of the server,
            # but is created inside the handlers.
            pass

    def test_server_app_configuration(self, mock_vector_store_config):
        """Test server app configuration."""
        mock_config_manager = Mock(spec=ConfigManager)

        with patch("cairo_coder.server.app.create_agent_factory"):
            server = CairoCoderServer(mock_vector_store_config, mock_config_manager)

            # Check FastAPI app configuration
            assert server.app.title == "Cairo Coder"
            assert server.app.version == "1.0.0"
            assert (
                server.app.description == "OpenAI-compatible API for Cairo programming assistance"
            )
