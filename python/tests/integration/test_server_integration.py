"""
Integration tests for OpenAI-compatible FastAPI server.

This module tests the FastAPI server with realistic scenarios,
including vector store and config manager integration, API contract
verification, and OpenAI compatibility checks.
"""

import concurrent.futures
import json
import uuid
from unittest.mock import Mock, patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

from cairo_coder.config.manager import ConfigManager
from cairo_coder.core.config import VectorStoreConfig
from cairo_coder.server.app import CairoCoderServer, create_app


class TestServerIntegration:
    """Integration tests for the server."""

    def test_health_check_integration(self, client: TestClient):
        """Test health check endpoint in integration context."""
        response = client.get("/")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}

    def test_list_agents(self, client: TestClient):
        """Test listing available agents."""
        response = client.get("/v1/agents")
        assert response.status_code == 200

        data = response.json()
        assert len(data) == 2  # cairo-coder, scarb-assistant
        agent_ids = {agent["id"] for agent in data}
        assert "cairo-coder" in agent_ids
        assert "scarb-assistant" in agent_ids

    def test_list_agents_error_handling(self, client: TestClient, mock_agent_factory: Mock):
        """Test error handling in list agents endpoint."""
        mock_agent_factory.get_available_agents.side_effect = Exception("Database error")

        response = client.get("/v1/agents")
        assert response.status_code == 500

        data = response.json()
        assert "detail" in data
        assert data["detail"]["error"]["message"] == "Failed to list agents"
        assert data["detail"]["error"]["type"] == "server_error"

    def test_full_agent_workflow(self, client: TestClient, mock_agent: Mock):
        """Test complete agent workflow from listing to chat."""
        # First, list available agents
        response = client.get("/v1/agents")
        assert response.status_code == 200

        agents = response.json()
        assert any(agent["id"] == "cairo-coder" for agent in agents)
        assert any(agent["id"] == "scarb-assistant" for agent in agents)

        # Note: Integration client injects a real pipeline; we assert response content shape,
        # not exact LLM text.

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
        content = data["choices"][0]["message"]["content"]
        assert isinstance(content, str) and len(content) > 0

    def test_multiple_conversation_turns(self, client: TestClient, mock_agent: Mock):
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

    def test_streaming_integration(
        self,
        client: TestClient,
        patch_dspy_streaming_success,
    ):
        """Test streaming response end-to-end using a real pipeline with low-level patches."""

        response = client.post(
            "/v1/chat/completions",
            json={"messages": [{"role": "user", "content": "hello"}], "stream": True},
        )
        assert response.status_code == 200
        assert "text/event-stream" in response.headers.get("content-type", "")

        # Gather streamed content
        chunks = []
        for line in response.text.split("\n"):
            if not line.startswith("data: "):
                continue
            data = line[6:]
            if data == "[DONE]":
                continue
            obj = json.loads(data)
            delta = obj.get("choices", [{}])[0].get("delta", {})
            if "content" in delta:
                chunks.append(delta["content"])

        assert "".join(chunks) == "Hello world"

    def test_error_handling_integration(self, client: TestClient, mock_agent_factory: Mock):
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

    def test_cors_integration(self, client: TestClient):
        """Test CORS headers in integration context."""
        response = client.get("/", headers={"Origin": "https://example.com"})
        assert response.status_code == 200
        assert "access-control-allow-origin" in response.headers

    def test_mcp_mode_integration(self, client: TestClient, mock_agent: Mock):
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

        response = client.post(
            "/v1/chat/completions",
            json={"messages": [{"role": "user", "content": "Test MCP"}], "stream": True},
            headers={"x-mcp-mode": "true"},
        )
        assert response.status_code == 200

    def test_concurrent_requests(self, client: TestClient):
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

    def test_large_request_handling(self, client: TestClient):
        """Test handling of large requests."""
        large_content = "How do I create a contract? " * 1000  # Large query

        response = client.post(
            "/v1/chat/completions",
            json={"messages": [{"role": "user", "content": large_content}], "stream": False},
        )
        assert response.status_code in [200, 413]

    def test_chat_completions_validation_empty_messages(self, client: TestClient):
        """Test validation of empty messages array."""
        response = client.post("/v1/chat/completions", json={"messages": []})
        assert response.status_code == 422  # Pydantic validation error

    def test_chat_completions_validation_last_message_not_user(self, client: TestClient):
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

    def test_agent_chat_completions_valid_agent(self, client: TestClient):
        """Test agent-specific chat completions with valid agent."""
        response = client.post(
            "/v1/agents/cairo-coder/chat/completions",
            json={"messages": [{"role": "user", "content": "Hello"}], "stream": False},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["model"] == "cairo-coder"
        assert len(data["choices"]) == 1

    def test_agent_chat_completions_invalid_agent(self, client: TestClient, mock_agent_factory: Mock):
        """Test agent-specific chat completions with invalid agent."""
        mock_agent_factory.get_agent_info.side_effect = ValueError("Agent not found")

        response = client.post(
            "/v1/agents/unknown-agent/chat/completions",
            json={"messages": [{"role": "user", "content": "Hello"}]},
        )

        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert "Agent 'unknown-agent' not found" in data["detail"]["error"]["message"]
        assert data["detail"]["error"]["type"] == "invalid_request_error"
        assert data["detail"]["error"]["code"] == "agent_not_found"

    def test_error_handling_agent_creation_failure(self, client: TestClient, mock_agent_factory: Mock):
        """Test error handling when agent creation fails."""
        mock_agent_factory.get_or_create_agent.side_effect = Exception("Agent creation failed")

        response = client.post(
            "/v1/chat/completions", json={"messages": [{"role": "user", "content": "Hello"}]}
        )

        assert response.status_code == 500
        data = response.json()
        assert "detail" in data
        assert data["detail"]["error"]["type"] == "server_error"

    def test_message_conversion(self, client: TestClient, mock_agent_factory: Mock, mock_agent: Mock):
        """Test proper conversion of messages to internal format."""
        client.post(
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

        # Verify agent was called with proper message conversion
        mock_agent_factory.get_or_create_agent.assert_called_once()
        call_args, call_kwargs = mock_agent_factory.get_or_create_agent.call_args

        # Check that history excludes the last message
        history = call_kwargs.get("history", [])
        assert len(history) == 3  # Excludes last user message

        # Check query is the last user message
        query = call_kwargs.get("query")
        assert query == "How are you?"

    def test_streaming_error_handling(
        self,
        client: TestClient,
        patch_dspy_streaming_error,
    ):
        """Test that streaming errors surface as an SSE error chunk using a real pipeline."""

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

    def test_request_id_generation(self, client: TestClient):
        """Test that unique request IDs are generated."""
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

        assert data1["id"] != data2["id"]
        uuid.UUID(data1["id"])  # Should not raise exception
        uuid.UUID(data2["id"])  # Should not raise exception


class TestServerStartup:
    """Test server startup and configuration."""

    def test_server_startup_with_mocked_dependencies(self, mock_vector_store_config: Mock):
        """Test that server can start with mocked dependencies."""
        Mock(spec=ConfigManager)

        with patch("cairo_coder.server.app.create_agent_factory"):
            app = create_app(mock_vector_store_config)
            assert app.title == "Cairo Coder"
            assert app.version == "1.0.0"
            assert app.description == "OpenAI-compatible API for Cairo programming assistance"

    def test_server_main_function_configuration(self):
        """Test the server's main function configuration."""
        assert create_app is not None
        assert CairoCoderServer is not None

        # Test that we can create an app instance
        with patch("cairo_coder.server.app.create_agent_factory"), patch(
            "cairo_coder.server.app.get_vector_store_config"
        ) as mock_get_config:
            mock_get_config.return_value = Mock(spec=VectorStoreConfig)
            app = create_app(mock_get_config())
            assert isinstance(app, FastAPI)

    def test_create_app_with_defaults(self, mock_vector_store_config: Mock):
        """Test create_app with default config manager."""
        with (
            patch("cairo_coder.server.app.create_agent_factory"),
            patch("cairo_coder.config.manager.ConfigManager") as mock_config_class,
        ):
            mock_config_class.return_value = Mock()
            app = create_app(mock_vector_store_config)

        assert isinstance(app, FastAPI)

    def test_cors_configuration(self, mock_vector_store_config: Mock):
        """Test CORS configuration."""
        with patch("cairo_coder.server.app.create_agent_factory"):
            app = create_app(mock_vector_store_config)
            client = TestClient(app)

            # Test CORS headers
            response = client.options(
                "/v1/chat/completions",
                headers={"Origin": "https://example.com", "Access-Control-Request-Method": "POST"},
            )

            assert response.status_code in [200, 204]

    def test_app_middleware(self, mock_vector_store_config: Mock):
        """Test that app has proper middleware configuration."""
        with patch("cairo_coder.server.app.create_agent_factory"):
            app = create_app(mock_vector_store_config)
            assert hasattr(app, "middleware_stack")
            assert hasattr(app, "middleware")

    def test_app_routes(self, mock_vector_store_config: Mock):
        """Test that app has expected routes."""
        with patch("cairo_coder.server.app.create_agent_factory"):
            app = create_app(mock_vector_store_config)
            routes = [route.path for route in app.routes]  # type: ignore
            assert "/" in routes
            assert "/v1/agents" in routes
            assert "/v1/chat/completions" in routes


class TestOpenAICompatibility:
    """Test suite for OpenAI API compatibility."""

    def test_openai_chat_completion_response_structure(self, client: TestClient):
        """Test that response structure matches OpenAI API."""
        response = client.post(
            "/v1/chat/completions",
            json={"messages": [{"role": "user", "content": "Hello"}], "stream": False},
        )
        assert response.status_code == 200
        data = response.json()

        required_fields = ["id", "object", "created", "model", "choices", "usage"]
        for field in required_fields:
            assert field in data

        choice = data["choices"][0]
        choice_fields = ["index", "message", "finish_reason"]
        for field in choice_fields:
            assert field in choice

        message = choice["message"]
        message_fields = ["role", "content"]
        for field in message_fields:
            assert field in message

        usage = data["usage"]
        usage_fields = ["prompt_tokens", "completion_tokens", "total_tokens"]
        for field in usage_fields:
            assert field in usage

    def test_openai_streaming_response_structure(self, client: TestClient):
        """Test that streaming response structure matches OpenAI API."""
        response = client.post(
            "/v1/chat/completions",
            json={"messages": [{"role": "user", "content": "Hello"}], "stream": True},
        )
        assert response.status_code == 200

        lines = response.text.strip().split("\n")
        chunks = []
        for line in lines:
            if line.startswith("data: "):
                data_str = line[6:]
                if data_str != "[DONE]":
                    chunks.append(json.loads(data_str))

        for chunk in chunks:
            required_fields = ["id", "object", "created", "model", "choices"]
            for field in required_fields:
                assert field in chunk
            assert chunk["object"] == "chat.completion.chunk"
            choice = chunk["choices"][0]
            choice_fields = ["index", "delta", "finish_reason"]
            for field in choice_fields:
                assert field in choice

    def test_openai_error_response_structure(self, client: TestClient, mock_agent_factory: Mock):
        """Test that error response structure matches OpenAI API."""
        mock_agent_factory.get_agent_info.side_effect = ValueError("Agent not found")
        response = client.post(
            "/v1/agents/invalid/chat/completions",
            json={"messages": [{"role": "user", "content": "Hello"}]},
        )
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        error = data["detail"]["error"]
        error_fields = ["message", "type", "code"]
        for field in error_fields:
            assert field in error
        assert error["type"] == "invalid_request_error"
        assert error["code"] == "agent_not_found"


class TestMCPModeCompatibility:
    """Test suite for MCP mode compatibility with TypeScript backend."""

    def test_mcp_mode_non_streaming_response(self, client: TestClient):
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

    def test_mcp_mode_streaming_response(self, client: TestClient):
        """Test MCP mode with streaming response."""
        response = client.post(
            "/v1/chat/completions",
            json={"messages": [{"role": "user", "content": "Test"}], "stream": True},
            headers={"x-mcp-mode": "true"},
        )
        assert response.status_code == 200
        assert "text/event-stream" in response.headers.get("content-type", "")

        lines = response.text.strip().split("\n")
        chunks = []
        for line in lines:
            if line.startswith("data: "):
                data_str = line[6:]
                if data_str != "[DONE]":
                    chunks.append(json.loads(data_str))

        assert len(chunks) > 0
        content_found = any(chunk["choices"][0]["delta"].get("content") for chunk in chunks)
        assert content_found

    def test_mcp_mode_header_variations(self, client: TestClient):
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

    def test_mcp_mode_agent_specific_endpoint(self, client: TestClient):
        """Test MCP mode with agent-specific endpoint."""
        response = client.post(
            "/v1/agents/cairo-coder/chat/completions",
            json={"messages": [{"role": "user", "content": "Cairo is a programming language"}]},
            headers={"x-mcp-mode": "true"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["choices"][0]["message"]["content"] == "Cairo is a programming language"
