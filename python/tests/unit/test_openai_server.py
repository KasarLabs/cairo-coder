"""
Unit tests for OpenAI-compatible FastAPI server implementation.

This module tests the FastAPI server that replicates the TypeScript backend
functionality, ensuring API compatibility and correct behavior.
"""

import json
import uuid
from unittest.mock import Mock, patch

import pytest
from fastapi import FastAPI

from cairo_coder.core.agent_factory import AgentFactory
from cairo_coder.core.types import StreamEvent, StreamEventType
from cairo_coder.server.app import create_app


class TestCairoCoderServer:
    """Test suite for CairoCoderServer class."""

    @pytest.fixture
    def mock_agent_factory(self, mock_agent):
        """Patch create_agent_factory and return the mock factory."""
        with patch("cairo_coder.server.app.create_agent_factory") as mock_factory_creator:
            factory = Mock(spec=AgentFactory)
            factory.get_available_agents.return_value = ["cairo-coder"]
            factory.get_agent_info.return_value = {
                "id": "cairo-coder",
                "name": "Cairo Coder",
                "description": "Cairo programming assistant",
                "sources": ["cairo-docs"],
            }
            factory.get_or_create_agent.return_value = mock_agent
            factory.create_agent.return_value = mock_agent
            factory.get_or_create_agent = Mock(return_value=mock_agent)
            mock_factory_creator.return_value = factory

            yield factory

    def test_health_check(self, client):
        """Test health check endpoint."""
        response = client.get("/")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}

    def test_list_agents(self, client):
        """Test listing available agents."""
        response = client.get("/v1/agents")
        assert response.status_code == 200

        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == "cairo-coder"
        assert data[0]["name"] == "Cairo Coder"
        assert data[0]["description"] == "Cairo programming assistant"
        assert data[0]["sources"] == ["cairo-docs"]

    def test_list_agents_error_handling(self, client, mock_agent_factory):
        """Test error handling in list agents endpoint."""
        mock_agent_factory.get_available_agents.side_effect = Exception("Database error")

        response = client.get("/v1/agents")
        assert response.status_code == 500

        data = response.json()
        assert "detail" in data
        assert data["detail"]["error"]["message"] == "Failed to list agents"
        assert data["detail"]["error"]["type"] == "server_error"

    def test_chat_completions_validation_empty_messages(self, client):
        """Test validation of empty messages array."""
        response = client.post("/v1/chat/completions", json={"messages": []})
        assert response.status_code == 422  # Pydantic validation error

    def test_chat_completions_validation_last_message_not_user(self, client):
        """Test validation that last message must be from user."""
        response = client.post(
            "/v1/chat/completions",
            json={
                "messages": [
                    {"role": "user", "content": "Hello"},
                    {"role": "assistant", "content": "Hi there!"},
                ]
            },
        )
        assert response.status_code == 422  # Pydantic validation error

    def test_chat_completions_non_streaming(self, client):
        """Test non-streaming chat completions."""
        response = client.post(
            "/v1/chat/completions",
            json={"messages": [{"role": "user", "content": "Hello"}], "stream": False},
        )

        assert response.status_code == 200
        data = response.json()

        # Check OpenAI-compatible response structure
        assert "id" in data
        assert data["object"] == "chat.completion"
        assert "created" in data
        assert data["model"] == "cairo-coder"
        assert len(data["choices"]) == 1
        assert data["choices"][0]["index"] == 0
        assert data["choices"][0]["message"]["role"] == "assistant"
        assert (
            "Hello! I'm Cairo Coder. How can I help you?"
            in data["choices"][0]["message"]["content"]
        )
        assert data["choices"][0]["finish_reason"] == "stop"
        assert "usage" in data
        assert data["usage"]["total_tokens"] > 0

    def test_chat_completions_streaming(self, client):
        """Test streaming chat completions."""
        response = client.post(
            "/v1/chat/completions",
            json={"messages": [{"role": "user", "content": "Hello"}], "stream": True},
        )

        assert response.status_code == 200
        assert response.headers["content-type"] == "text/event-stream; charset=utf-8"

        # Parse streaming response
        lines = response.text.strip().split("\n")
        chunks = []
        for line in lines:
            if line.startswith("data: "):
                data_str = line[6:]  # Remove 'data: ' prefix
                if data_str != "[DONE]":
                    chunks.append(json.loads(data_str))

        # Verify streaming chunks
        assert len(chunks) > 0

        # Check first chunk structure
        first_chunk = chunks[0]
        assert first_chunk["object"] == "chat.completion.chunk"
        assert first_chunk["model"] == "cairo-coder"
        assert len(first_chunk["choices"]) == 1
        assert first_chunk["choices"][0]["index"] == 0
        assert first_chunk["choices"][0]["delta"]["role"] == "assistant"

        # Check final chunk has finish_reason
        final_chunk = chunks[-1]
        assert final_chunk["choices"][0]["finish_reason"] == "stop"

    def test_agent_chat_completions_valid_agent(self, client):
        """Test agent-specific chat completions with valid agent."""

        response = client.post(
            "/v1/agents/cairo-coder/chat/completions",
            json={"messages": [{"role": "user", "content": "Hello"}], "stream": False},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["model"] == "cairo-coder"
        assert len(data["choices"]) == 1

    def test_agent_chat_completions_invalid_agent(self, client, mock_agent_factory):
        """Test agent-specific chat completions with invalid agent."""
        mock_agent_factory.get_agent_info.side_effect = ValueError("Agent not found")

        response = client.post(
            "/v1/agents/unknown-agent/chat/completions",
            json={"messages": [{"role": "user", "content": "Hello"}]},
        )

        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert data["detail"]["error"]["message"] == "Agent 'unknown-agent' not found"
        assert data["detail"]["error"]["type"] == "invalid_request_error"
        assert data["detail"]["error"]["code"] == "agent_not_found"

    def test_mcp_mode_header_variants(self, client):
        """Test MCP mode with different header variants."""
        # Test with x-mcp-mode header
        response = client.post(
            "/v1/chat/completions",
            json={"messages": [{"role": "user", "content": "Cairo is a programming language"}]},
            headers={"x-mcp-mode": "true"},
        )
        assert response.status_code == 200

        # Test with mcp header
        response = client.post(
            "/v1/chat/completions",
            json={"messages": [{"role": "user", "content": "Test"}]},
            headers={"mcp": "true"},
        )
        assert response.status_code == 200

    def test_cors_headers(self, client):
        """Test CORS headers are properly set."""
        response = client.options(
            "/v1/chat/completions",
            headers={
                "Origin": "https://example.com",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type",
            },
        )

        # FastAPI with CORS middleware should handle OPTIONS automatically
        assert response.status_code in [200, 204]

    def test_error_handling_agent_creation_failure(self, client, mock_agent_factory):
        """Test error handling when agent creation fails."""
        mock_agent_factory.create_agent.side_effect = Exception("Agent creation failed")

        response = client.post(
            "/v1/chat/completions", json={"messages": [{"role": "user", "content": "Hello"}]}
        )

        assert response.status_code == 500
        data = response.json()
        assert "detail" in data
        assert data["detail"]["error"]["type"] == "server_error"

    def test_message_conversion(self, client, mock_agent_factory, mock_agent):
        """Test proper conversion of messages to internal format."""
        mock_agent_factory.create_agent.return_value = mock_agent

        response = client.post(
            "/v1/chat/completions",
            json={
                "messages": [
                    {"role": "system", "content": "You are a helpful assistant"},
                    {"role": "user", "content": "Hello"},
                    {"role": "assistant", "content": "Hi there!"},
                    {"role": "user", "content": "How are you?"},
                ]
            },
        )

        assert response.status_code == 200

        # Verify agent was called with proper message conversion
        mock_agent_factory.create_agent.assert_called_once()
        call_args, call_kwargs = mock_agent_factory.create_agent.call_args

        # Check that history excludes the last message
        history = call_kwargs.get("history", [])
        assert len(history) == 3  # Excludes last user message

        # Check query is the last user message
        query = call_kwargs.get("query")
        assert query == "How are you?"

    def test_streaming_error_handling(self, client, mock_agent_factory):
        """Test error handling during streaming."""
        mock_agent = Mock()

        async def mock_forward_streaming_error(*args, **kwargs):
            yield StreamEvent(type=StreamEventType.RESPONSE, data="Starting response...")
            raise Exception("Stream error")

        mock_agent.forward_streaming = mock_forward_streaming_error
        mock_agent_factory.create_agent.return_value = mock_agent

        response = client.post(
            "/v1/chat/completions",
            json={"messages": [{"role": "user", "content": "Hello"}], "stream": True},
        )

        assert response.status_code == 200

        # Parse streaming response to check error handling
        lines = response.text.strip().split("\n")
        chunks = []
        for line in lines:
            if line.startswith("data: "):
                data_str = line[6:]
                if data_str != "[DONE]":
                    chunks.append(json.loads(data_str))

        # Should have error chunk
        error_found = False
        for chunk in chunks:
            if chunk["choices"][0]["finish_reason"] == "stop":
                content = chunk["choices"][0]["delta"].get("content", "")
                if "Error:" in content:
                    error_found = True
                    break

        assert error_found

    def test_request_id_generation(self, client):
        """Test that unique request IDs are generated."""
        # Make two requests
        response1 = client.post(
            "/v1/chat/completions", json={"messages": [{"role": "user", "content": "Hello"}]}
        )

        response2 = client.post(
            "/v1/chat/completions", json={"messages": [{"role": "user", "content": "Hello"}]}
        )

        assert response1.status_code == 200
        assert response2.status_code == 200

        data1 = response1.json()
        data2 = response2.json()

        # IDs should be different
        assert data1["id"] != data2["id"]

        # Both should be valid UUIDs
        uuid.UUID(data1["id"])  # Should not raise exception
        uuid.UUID(data2["id"])  # Should not raise exception


class TestCreateApp:
    """Test suite for create_app function."""

    def test_create_app_returns_fastapi_instance(self, mock_vector_store_config, mock_config_manager):
        """Test that create_app returns a FastAPI instance."""
        with patch("cairo_coder.server.app.create_agent_factory"):
            app = create_app(mock_vector_store_config, mock_config_manager)

        assert isinstance(app, FastAPI)
        assert app.title == "Cairo Coder"
        assert app.version == "1.0.0"

    def test_create_app_with_defaults(self, mock_vector_store_config):
        """Test create_app with default config manager."""
        with (
            patch("cairo_coder.server.app.create_agent_factory"),
            patch("cairo_coder.config.manager.ConfigManager") as mock_config_class,
        ):
            mock_config_class.return_value = Mock()
            app = create_app(mock_vector_store_config)

        assert isinstance(app, FastAPI)


class TestTokenTracker:
    """Test suite for TokenTracker class."""

    def test_track_tokens_new_session(self):
        """Test tracking tokens for a new session."""
        from cairo_coder.server.app import TokenTracker

        tracker = TokenTracker()
        tracker.track_tokens("session1", 10, 20)

        usage = tracker.get_session_usage("session1")
        assert usage["prompt_tokens"] == 10
        assert usage["completion_tokens"] == 20
        assert usage["total_tokens"] == 30

    def test_track_tokens_existing_session(self):
        """Test tracking tokens for an existing session."""
        from cairo_coder.server.app import TokenTracker

        tracker = TokenTracker()
        tracker.track_tokens("session1", 10, 20)
        tracker.track_tokens("session1", 5, 15)

        usage = tracker.get_session_usage("session1")
        assert usage["prompt_tokens"] == 15
        assert usage["completion_tokens"] == 35
        assert usage["total_tokens"] == 50

    def test_get_session_usage_nonexistent(self):
        """Test getting usage for non-existent session."""
        from cairo_coder.server.app import TokenTracker

        tracker = TokenTracker()
        usage = tracker.get_session_usage("nonexistent")

        assert usage["prompt_tokens"] == 0
        assert usage["completion_tokens"] == 0
        assert usage["total_tokens"] == 0


class TestOpenAICompatibility:
    """Test suite for OpenAI API compatibility."""

    @pytest.fixture
    def mock_agent_factory(self, mock_agent):
        """Patch create_agent_factory and return the mock factory."""
        with patch("cairo_coder.server.app.create_agent_factory") as mock_factory_creator:
            factory = Mock(spec=AgentFactory)
            factory.get_available_agents.return_value = ["cairo-coder"]
            factory.get_agent_info.return_value = {
                "id": "cairo-coder",
                "name": "Cairo Coder",
                "description": "Cairo programming assistant",
                "sources": ["cairo-docs"],
            }
            factory.create_agent.return_value = mock_agent
            factory.get_or_create_agent = Mock(return_value=mock_agent)
            mock_factory_creator.return_value = factory
            yield factory

    def test_openai_chat_completion_response_structure(self, client):
        """Test that response structure matches OpenAI API."""
        response = client.post(
            "/v1/chat/completions",
            json={"messages": [{"role": "user", "content": "Hello"}], "stream": False},
        )

        assert response.status_code == 200
        data = response.json()

        # Check all required OpenAI fields
        required_fields = ["id", "object", "created", "model", "choices", "usage"]
        for field in required_fields:
            assert field in data

        # Check choice structure
        choice = data["choices"][0]
        choice_fields = ["index", "message", "finish_reason"]
        for field in choice_fields:
            assert field in choice

        # Check message structure
        message = choice["message"]
        message_fields = ["role", "content"]
        for field in message_fields:
            assert field in message

        # Check usage structure
        usage = data["usage"]
        usage_fields = ["prompt_tokens", "completion_tokens", "total_tokens"]
        for field in usage_fields:
            assert field in usage

    def test_openai_streaming_response_structure(self, client):
        """Test that streaming response structure matches OpenAI API."""
        response = client.post(
            "/v1/chat/completions",
            json={"messages": [{"role": "user", "content": "Hello"}], "stream": True},
        )

        assert response.status_code == 200

        # Parse streaming chunks
        lines = response.text.strip().split("\n")
        chunks = []
        for line in lines:
            if line.startswith("data: "):
                data_str = line[6:]
                if data_str != "[DONE]":
                    chunks.append(json.loads(data_str))

        # Check chunk structure
        for chunk in chunks:
            required_fields = ["id", "object", "created", "model", "choices"]
            for field in required_fields:
                assert field in chunk

            assert chunk["object"] == "chat.completion.chunk"

            choice = chunk["choices"][0]
            choice_fields = ["index", "delta", "finish_reason"]
            for field in choice_fields:
                assert field in choice

    def test_openai_error_response_structure(self, client, mock_agent_factory):
        """Test that error response structure matches OpenAI API."""
        # Test with invalid agent
        mock_agent_factory.get_agent_info.side_effect = ValueError("Agent not found")

        response = client.post(
            "/v1/agents/invalid/chat/completions",
            json={"messages": [{"role": "user", "content": "Hello"}]},
        )

        assert response.status_code == 404
        data = response.json()

        # Check error structure (FastAPI wraps in detail)
        assert "detail" in data
        error = data["detail"]["error"]

        error_fields = ["message", "type", "code"]
        for field in error_fields:
            assert field in error

        assert error["type"] == "invalid_request_error"
        assert error["code"] == "agent_not_found"


class TestMCPModeCompatibility:
    """Test suite for MCP mode compatibility with TypeScript backend."""

    @pytest.fixture
    def mock_agent_factory(self, mock_agent):
        """Setup mocks for MCP mode tests."""
        with patch("cairo_coder.server.app.create_agent_factory") as mock_factory_creator:
            factory = Mock(spec=AgentFactory)
            factory.get_available_agents = Mock(return_value=["cairo-coder"])
            factory.get_agent_info = Mock(
                return_value={
                    "id": "cairo-coder",
                    "name": "Cairo Coder",
                    "description": "Cairo programming assistant",
                    "sources": ["cairo-docs"],
                }
            )
            factory.create_agent.return_value = mock_agent
            factory.get_or_create_agent = Mock(return_value=mock_agent)
            mock_factory_creator.return_value = factory
            yield factory


    def test_mcp_mode_non_streaming_response(self, client):
        """Test MCP mode returns sources in non-streaming response."""
        response = client.post(
            "/v1/chat/completions",
            json={"messages": [{"role": "user", "content": "Test"}], "stream": False},
            headers={"x-mcp-mode": "true"},
        )

        assert response.status_code == 200
        data = response.json()

        assert "choices" in data
        assert data["choices"][0]["message"]["content"] == "Cairo is a programming language"

    def test_mcp_mode_streaming_response(self, client):
        """Test MCP mode with streaming response."""
        response = client.post(
            "/v1/chat/completions",
            json={"messages": [{"role": "user", "content": "Test"}], "stream": True},
            headers={"x-mcp-mode": "true"},
        )

        assert response.status_code == 200
        assert response.headers["content-type"] == "text/event-stream; charset=utf-8"

        # Parse streaming response
        lines = response.text.strip().split("\n")
        chunks = []
        for line in lines:
            if line.startswith("data: "):
                data_str = line[6:]
                if data_str != "[DONE]":
                    chunks.append(json.loads(data_str))

        # Should have content chunks
        assert len(chunks) > 0

        # Check for response content
        content_found = False
        for chunk in chunks:
            if chunk["choices"][0]["delta"].get("content"):
                content_found = True
                break

        assert content_found

    def test_mcp_mode_header_variations(self, client):
        """Test different MCP mode header variations."""
        # Test x-mcp-mode header
        response = client.post(
            "/v1/chat/completions",
            json={"messages": [{"role": "user", "content": "Test"}]},
            headers={"x-mcp-mode": "true"},
        )
        assert response.status_code == 200

        # Test mcp header
        response = client.post(
            "/v1/chat/completions",
            json={"messages": [{"role": "user", "content": "Test"}]},
            headers={"mcp": "true"},
        )
        assert response.status_code == 200

    def test_mcp_mode_agent_specific_endpoint(self, client):
        """Test MCP mode with agent-specific endpoint."""
        response = client.post(
            "/v1/agents/cairo-coder/chat/completions",
            json={"messages": [{"role": "user", "content": "Cairo is a programming language"}]},
            headers={"x-mcp-mode": "true"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["choices"][0]["message"]["content"] == "Cairo is a programming language"
