"""
Integration tests for OpenAI-compatible FastAPI server.

This module tests the FastAPI server with more realistic scenarios,
including actual vector store and config manager integration.
"""

import concurrent.futures
from unittest.mock import AsyncMock, Mock, patch

import pytest

from cairo_coder.config.manager import ConfigManager
from cairo_coder.core.agent_factory import AgentFactory
from cairo_coder.core.config import VectorStoreConfig
from cairo_coder.server.app import create_app, get_vector_store_config


class TestServerIntegration:
    """Integration tests for the server."""

    @pytest.fixture(scope="function")
    def mock_agent_factory(self, mock_agent):
        """Patch create_agent_factory and return the mock factory."""
        with patch("cairo_coder.server.app.create_agent_factory") as mock_factory_creator:
            factory = Mock(spec=AgentFactory)
            agents_data = {
                "default": {
                    "id": "default",
                    "name": "Cairo Coder",
                    "description": "General Cairo programming assistant",
                    "sources": ["cairo_book", "cairo_docs"],
                },
                "scarb-assistant": {
                    "id": "scarb-assistant",
                    "name": "Scarb Assistant",
                    "description": "Starknet-specific programming help",
                    "sources": ["scarb_docs"],
                },
            }
            factory.get_available_agents.return_value = list(agents_data.keys())

            def get_agent_info(agent_id, **kwargs):
                if agent_id in agents_data:
                    return agents_data[agent_id]
                raise ValueError(f"Agent {agent_id} not found")

            factory.get_agent_info.side_effect = get_agent_info
            factory.create_agent.return_value = mock_agent
            factory.get_or_create_agent = Mock(return_value=mock_agent)
            mock_factory_creator.return_value = factory
            yield factory

    @pytest.fixture(scope="function")
    def app(self, mock_vector_store_config, mock_config_manager, mock_agent_factory):
        """Create a test FastAPI application."""
        app = create_app(mock_vector_store_config, mock_config_manager)
        app.dependency_overrides[get_vector_store_config] = lambda: mock_vector_store_config
        return app

    def test_health_check_integration(self, client):
        """Test health check endpoint in integration context."""
        response = client.get("/")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}

    def test_full_agent_workflow(self, client, mock_agent_factory):
        """Test complete agent workflow from listing to chat."""
        # First, list available agents
        response = client.get("/v1/agents")
        assert response.status_code == 200

        agents = response.json()
        assert len(agents) == 2
        assert any(agent["id"] == "default" for agent in agents)
        assert any(agent["id"] == "scarb-assistant" for agent in agents)

        # Mock the agent to return a specific response for this test
        mock_response = Mock()
        mock_response.answer = "Smart contract response."
        mock_response.get_lm_usage.return_value = {
            "gemini/gemini-2.5-flash": {
                "prompt_tokens": 10,
                "completion_tokens": 20,
                "total_tokens": 30,
            }
        }
        mock_agent = Mock()
        mock_agent.aforward = AsyncMock(return_value=mock_response)
        mock_agent_factory.create_agent.return_value = mock_agent

        # Test chat completion with default agent
        response = client.post(
            "/v1/chat/completions",
            json={
                "messages": [{"role": "user", "content": "How do I create a smart contract?"}],
                "stream": False,
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["choices"][0]["message"]["content"] == "Smart contract response."

    def test_multiple_conversation_turns(self, client, mock_agent_factory, mock_agent):
        """Test handling multiple conversation turns."""
        conversation_responses = [
            "Hello! I'm Cairo Coder, ready to help with Cairo programming.",
            "To create a contract, use the #[contract] attribute on a module.",
            "You can deploy it using Scarb with the deploy command.",
        ]

        async def mock_aforward(query: str, chat_history=None, mcp_mode=False, **kwargs):
            history_length = len(chat_history) if chat_history else 0
            response_idx = min(history_length // 2, len(conversation_responses) - 1)

            mock_response = Mock()
            mock_response.answer = conversation_responses[response_idx]
            mock_response.get_lm_usage.return_value = {}
            return mock_response

        mock_agent.aforward = mock_aforward
        mock_agent_factory.create_agent.return_value = mock_agent

        # Test conversation flow
        messages = [{"role": "user", "content": "Hello"}]
        response = client.post("/v1/chat/completions", json={"messages": messages, "stream": False})
        assert response.status_code == 200
        data = response.json()
        assert data["choices"][0]["message"]["content"] == conversation_responses[0]

        messages.append({"role": "assistant", "content": data["choices"][0]["message"]["content"]})
        messages.append({"role": "user", "content": "How do I create a contract?"})
        response = client.post("/v1/chat/completions", json={"messages": messages, "stream": False})
        assert response.status_code == 200
        data = response.json()
        assert data["choices"][0]["message"]["content"] == conversation_responses[1]

    def test_streaming_integration(self, client, mock_agent_factory, mock_agent):
        """Test streaming response integration."""

        async def mock_forward_streaming(query: str, chat_history=None, mcp_mode=False, **kwargs):
            chunks = [
                "To create a Cairo contract, ",
                "you need to use the #[contract] attribute ",
                "on a module. This tells the compiler ",
                "that the module contains contract code.",
            ]
            for chunk in chunks:
                yield {"type": "response", "data": chunk}
            yield {"type": "end", "data": ""}

        mock_agent.forward_streaming = mock_forward_streaming
        mock_agent_factory.create_agent.return_value = mock_agent

        response = client.post(
            "/v1/chat/completions",
            json={
                "messages": [{"role": "user", "content": "How do I create a contract?"}],
                "stream": True,
            },
        )
        assert response.status_code == 200
        assert "text/event-stream" in response.headers.get("content-type", "")

    def test_error_handling_integration(self, client, mock_agent_factory):
        """Test error handling in integration context."""
        mock_agent_factory.get_agent_info.side_effect = ValueError("Agent not found")
        response = client.post(
            "/v1/agents/nonexistent-agent/chat/completions",
            json={"messages": [{"role": "user", "content": "Hello"}]},
        )
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert "error" in data["detail"]

        # Test with invalid request
        response = client.post(
            "/v1/chat/completions",
            json={"messages": []},  # Empty messages should fail validation
        )
        assert response.status_code == 422  # Validation error

    def test_cors_integration(self, client):
        """Test CORS headers in integration context."""
        response = client.get("/", headers={"Origin": "https://example.com"})
        assert response.status_code == 200
        assert "access-control-allow-origin" in response.headers

    def test_mcp_mode_integration(self, client, mock_agent_factory, mock_agent):
        """Test MCP mode in integration context."""
        async def mock_forward_streaming(query: str, chat_history=None, mcp_mode=False, **kwargs):
            if mcp_mode:
                yield {
                    "type": "sources",
                    "data": [
                        {
                            "pageContent": "Cairo contract example",
                            "metadata": {"source": "cairo-book", "page": 10},
                        }
                    ],
                }
            else:
                yield {"type": "response", "data": "Regular response"}
            yield {"type": "end", "data": ""}

        mock_agent.forward_streaming = mock_forward_streaming
        mock_agent_factory.create_agent.return_value = mock_agent

        response = client.post(
            "/v1/chat/completions",
            json={"messages": [{"role": "user", "content": "Test MCP"}], "stream": True},
            headers={"x-mcp-mode": "true"},
        )
        assert response.status_code == 200

    def test_concurrent_requests(self, client):
        """Test handling concurrent requests."""

        def make_request(request_id):
            """Make a single request."""
            response = client.post(
                "/v1/chat/completions",
                json={
                    "messages": [{"role": "user", "content": f"Request {request_id}"}],
                    "stream": False,
                },
            )
            return response.status_code, request_id

        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            futures = [executor.submit(make_request, i) for i in range(5)]
            results = [future.result() for future in concurrent.futures.as_completed(futures)]

        assert len(results) == 5
        for status_code, _request_id in results:
            assert status_code == 200

    def test_large_request_handling(self, client):
        """Test handling of large requests."""
        large_content = "How do I create a contract? " * 1000  # Large query

        response = client.post(
            "/v1/chat/completions",
            json={"messages": [{"role": "user", "content": large_content}], "stream": False},
        )
        assert response.status_code in [200, 413]


class TestServerStartup:
    """Test server startup and configuration."""

    def test_server_startup_with_mocked_dependencies(self, mock_vector_store_config):
        """Test that server can start with mocked dependencies."""
        mock_config_manager = Mock(spec=ConfigManager)

        with patch("cairo_coder.server.app.create_agent_factory"):
            app = create_app(mock_vector_store_config, mock_config_manager)
            assert app.title == "Cairo Coder"
            assert app.version == "1.0.0"
            assert app.description == "OpenAI-compatible API for Cairo programming assistance"

    def test_server_main_function_configuration(self):
        """Test the server's main function configuration."""
        from cairo_coder.server.app import (
            CairoCoderServer,
            TokenTracker,
            create_app,
        )

        assert create_app is not None
        assert CairoCoderServer is not None
        assert TokenTracker is not None

        # Test that we can create an app instance
        with patch("cairo_coder.server.app.create_agent_factory"), patch(
            "cairo_coder.server.app.get_vector_store_config"
        ) as mock_get_config:
            mock_get_config.return_value = Mock(spec=VectorStoreConfig)
            app = create_app(mock_get_config())

            # Verify the app is a FastAPI instance
            from fastapi import FastAPI

            assert isinstance(app, FastAPI)
