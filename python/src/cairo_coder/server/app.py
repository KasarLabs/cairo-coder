"""
FastAPI server for Cairo Coder - Python rewrite of TypeScript backend.

This module implements the FastAPI application that replicates the functionality
of the TypeScript backend at packages/backend/src/, providing the same OpenAI-compatible
API endpoints and behaviors.
"""

import json
import time
import uuid
from collections.abc import AsyncGenerator

import dspy
from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, validator

from cairo_coder.config.manager import ConfigManager
from cairo_coder.core.agent_factory import create_agent_factory
from cairo_coder.core.config import VectorStoreConfig
from cairo_coder.core.rag_pipeline import (
    AgentLoggingCallback,
    LangsmithTracingCallback,
    RagPipeline,
)
from cairo_coder.core.types import Message
from cairo_coder.utils.logging import get_logger, setup_logging

# Configure structured logging
setup_logging()
logger = get_logger(__name__)


# OpenAI-compatible Request/Response Models
class ChatMessage(BaseModel):
    """OpenAI-compatible chat message."""

    role: str = Field(..., description="Message role: system, user, or assistant")
    content: str = Field(..., description="Message content")
    name: str | None = Field(None, description="Optional name for the message")


class ChatCompletionRequest(BaseModel):
    """OpenAI-compatible chat completion request."""

    messages: list[ChatMessage] = Field(..., description="List of messages")
    model: str = Field("cairo-coder", description="Model to use")
    max_tokens: int | None = Field(None, description="Maximum tokens to generate")
    temperature: float | None = Field(None, description="Temperature for generation")
    top_p: float | None = Field(None, description="Top-p for generation")
    n: int | None = Field(1, description="Number of completions")
    stop: str | list[str] | None = Field(None, description="Stop sequences")
    presence_penalty: float | None = Field(None, description="Presence penalty")
    frequency_penalty: float | None = Field(None, description="Frequency penalty")
    logit_bias: dict[str, float] | None = Field(None, description="Logit bias")
    user: str | None = Field(None, description="User identifier")
    stream: bool = Field(False, description="Whether to stream responses")

    @validator("messages")
    def validate_messages(self, v):
        if not v:
            raise ValueError("Messages array cannot be empty")
        if v[-1].role != "user":
            raise ValueError("Last message must be from user")
        return v


class ChatCompletionChoice(BaseModel):
    """OpenAI-compatible chat completion choice."""

    index: int = Field(..., description="Choice index")
    message: ChatMessage | None = Field(None, description="Generated message")
    delta: ChatMessage | None = Field(None, description="Delta for streaming")
    finish_reason: str | None = Field(None, description="Reason for finishing")


class ChatCompletionUsage(BaseModel):
    """OpenAI-compatible usage statistics."""

    prompt_tokens: int = Field(..., description="Tokens in prompt")
    completion_tokens: int = Field(..., description="Tokens in completion")
    total_tokens: int = Field(..., description="Total tokens")


class ChatCompletionResponse(BaseModel):
    """OpenAI-compatible chat completion response."""

    id: str = Field(..., description="Response ID")
    object: str = Field("chat.completion", description="Object type")
    created: int = Field(..., description="Creation timestamp")
    model: str = Field("cairo-coder", description="Model used")
    choices: list[ChatCompletionChoice] = Field(..., description="Completion choices")
    usage: ChatCompletionUsage | None = Field(None, description="Usage statistics")


class AgentInfo(BaseModel):
    """Agent information model."""

    id: str = Field(..., description="Agent ID")
    name: str = Field(..., description="Agent name")
    description: str = Field(..., description="Agent description")
    sources: list[str] = Field(..., description="Document sources")


class ErrorDetail(BaseModel):
    """OpenAI-compatible error detail."""

    message: str = Field(..., description="Error message")
    type: str = Field(..., description="Error type")
    code: str | None = Field(None, description="Error code")
    param: str | None = Field(None, description="Parameter name")


class ErrorResponse(BaseModel):
    """OpenAI-compatible error response."""

    error: ErrorDetail = Field(..., description="Error details")


class CairoCoderServer:
    """
    FastAPI server for Cairo Coder that replicates TypeScript backend functionality.

    This server provides the same OpenAI-compatible API endpoints as the original
    TypeScript backend, maintaining full compatibility while using the Python
    DSPy-based RAG pipeline.
    """

    def __init__(
        self, vector_store_config: VectorStoreConfig, config_manager: ConfigManager | None = None
    ):
        """
        Initialize the Cairo Coder server.

        Args:
            vector_store: Vector store for document retrieval
            config_manager: Optional configuration manager
        """
        self.vector_store_config = vector_store_config
        self.config_manager = config_manager or ConfigManager()
        self.agent_factory = create_agent_factory(
            vector_store_config=vector_store_config, config_manager=self.config_manager
        )

        # Initialize FastAPI app
        self.app = FastAPI(
            title="Cairo Coder",
            description="OpenAI-compatible API for Cairo programming assistance",
            version="1.0.0",
        )

        # Configure CORS - allow all origins like TypeScript backend
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

        # Token tracking for usage statistics
        self.token_tracker = TokenTracker()

        # Setup routes
        self._setup_routes()

        # TODO: This is the place where we should select the proper LLM configuration.
        # TODO: For now we just Hard-code DSPY - GEMINI
        dspy.configure(lm=dspy.LM("gemini/gemini-2.5-flash", max_tokens=30000))
        dspy.configure(callbacks=[AgentLoggingCallback(), LangsmithTracingCallback()])
        dspy.configure(track_usage=True)

    def _setup_routes(self):
        """Setup FastAPI routes matching TypeScript backend."""

        @self.app.get("/")
        async def health_check():
            """Health check endpoint - matches TypeScript backend."""
            return {"status": "ok"}

        @self.app.get("/v1/agents")
        async def list_agents():
            """List all available agents."""
            try:
                available_agents = self.agent_factory.get_available_agents()
                agents_info = []

                for agent_id in available_agents:
                    try:
                        info = self.agent_factory.get_agent_info(agent_id)
                        agents_info.append(
                            AgentInfo(
                                id=info["id"],
                                name=info["name"],
                                description=info["description"],
                                sources=info["sources"],
                            )
                        )
                    except Exception as e:
                        logger.warning("Failed to get agent info", agent_id=agent_id, error=str(e))

                return agents_info
            except Exception as e:
                logger.error("Failed to list agents", error=str(e))
                raise HTTPException(
                    status_code=500,
                    detail=ErrorResponse(
                        error=ErrorDetail(
                            message="Failed to list agents",
                            type="server_error",
                            code="internal_error",
                        )
                    ).dict()) from e

        @self.app.post("/v1/agents/{agent_id}/chat/completions")
        async def agent_chat_completions(
            agent_id: str,
            request: ChatCompletionRequest,
            req: Request,
            mcp: str | None = Header(None),
            x_mcp_mode: str | None = Header(None, alias="x-mcp-mode"),
        ):
            """Agent-specific chat completions - matches TypeScript backend."""
            # Validate agent exists
            try:
                self.agent_factory.get_agent_info(agent_id)
            except ValueError as e:
                raise HTTPException(
                    status_code=404,
                    detail=ErrorResponse(
                        error=ErrorDetail(
                            message=f"Agent '{agent_id}' not found",
                            type="invalid_request_error",
                            code="agent_not_found",
                            param="agent_id",
                        )
                    ).dict()) from e

            # Determine MCP mode
            mcp_mode = bool(mcp or x_mcp_mode)

            return await self._handle_chat_completion(request, req, agent_id, mcp_mode)

        @self.app.post("/v1/chat/completions")
        async def v1_chat_completions(
            request: ChatCompletionRequest,
            req: Request,
            mcp: str | None = Header(None),
            x_mcp_mode: str | None = Header(None, alias="x-mcp-mode"),
        ):
            """Legacy chat completions endpoint - matches TypeScript backend."""
            # Determine MCP mode
            mcp_mode = bool(mcp or x_mcp_mode)

            return await self._handle_chat_completion(request, req, None, mcp_mode)

        @self.app.post("/chat/completions")
        async def chat_completions(
            request: ChatCompletionRequest,
            req: Request,
            mcp: str | None = Header(None),
            x_mcp_mode: str | None = Header(None, alias="x-mcp-mode"),
        ):
            """Legacy chat completions endpoint - matches TypeScript backend."""
            # Determine MCP mode
            mcp_mode = bool(mcp or x_mcp_mode)

            return await self._handle_chat_completion(request, req, None, mcp_mode)

    async def _handle_chat_completion(
        self,
        request: ChatCompletionRequest,
        req: Request,
        agent_id: str | None = None,
        mcp_mode: bool = False,
    ):
        """Handle chat completion request - replicates TypeScript chatCompletionHandler."""
        try:
            # Convert messages to internal format
            messages = []
            for msg in request.messages:
                if msg.role == "user":
                    messages.append(Message(role="user", content=msg.content))
                elif msg.role == "assistant":
                    messages.append(Message(role="assistant", content=msg.content))
                elif msg.role == "system":
                    messages.append(Message(role="system", content=msg.content))

            # Get last user message as query
            query = request.messages[-1].content

            # Create agent
            if agent_id:
                agent = await self.agent_factory.get_or_create_agent(
                    agent_id=agent_id,
                    query=query,
                    history=messages[:-1],  # Exclude last message
                    mcp_mode=mcp_mode,
                )
            else:
                agent = self.agent_factory.create_agent(
                    query=query,
                    history=messages[:-1],  # Exclude last message
                    vector_store_config=self.vector_store_config,
                    mcp_mode=mcp_mode,
                )

            # Handle streaming vs non-streaming
            if request.stream:
                return StreamingResponse(
                    self._stream_chat_completion(agent, query, messages[:-1], mcp_mode),
                    media_type="text/event-stream",
                    headers={
                        "Cache-Control": "no-cache",
                        "Connection": "keep-alive",
                        "X-Accel-Buffering": "no",
                    },
                )
            return self._generate_chat_completion(agent, query, messages[:-1], mcp_mode)

        except ValueError as e:
            raise HTTPException(
                status_code=400,
                detail=ErrorResponse(
                    error=ErrorDetail(
                        message=str(e), type="invalid_request_error", code="invalid_request"
                    )
                ).dict()) from e

        except Exception as e:
            import traceback

            traceback.print_exc()
            logger.error("Error in chat completion", error=str(e))
            raise HTTPException(
                status_code=500,
                detail=ErrorResponse(
                    error=ErrorDetail(
                        message="Internal server error", type="server_error", code="internal_error"
                    )
                ).dict()) from e

    async def _stream_chat_completion(
        self, agent, query: str, history: list[Message], mcp_mode: bool
    ) -> AsyncGenerator[str, None]:
        """Stream chat completion response - replicates TypeScript streaming."""
        response_id = str(uuid.uuid4())
        created = int(time.time())

        # Send initial chunk
        initial_chunk = {
            "id": response_id,
            "object": "chat.completion.chunk",
            "created": created,
            "model": "cairo-coder",
            "choices": [{"index": 0, "delta": {"role": "assistant"}, "finish_reason": None}],
        }
        yield f"data: {json.dumps(initial_chunk)}\n\n"

        # Process agent and stream responses
        content_buffer = ""

        try:
            async for event in agent.forward_streaming(
                query=query, chat_history=history, mcp_mode=mcp_mode
            ):
                if event.type == "sources":
                    pass
                elif event.type == "response":
                    content_buffer += event.data

                    # Send content chunk
                    chunk = {
                        "id": response_id,
                        "object": "chat.completion.chunk",
                        "created": created,
                        "model": "cairo-coder",
                        "choices": [
                            {"index": 0, "delta": {"content": event.data}, "finish_reason": None}
                        ],
                    }
                    yield f"data: {json.dumps(chunk)}\n\n"
                elif event.type == "end":
                    break

        except Exception as e:
            logger.error("Error in streaming", error=str(e))
            error_chunk = {
                "id": response_id,
                "object": "chat.completion.chunk",
                "created": created,
                "model": "cairo-coder",
                "choices": [
                    {
                        "index": 0,
                        "delta": {"content": f"\n\nError: {str(e)}"},
                        "finish_reason": "stop",
                    }
                ],
            }
            yield f"data: {json.dumps(error_chunk)}\n\n"

        # Send final chunk
        final_chunk = {
            "id": response_id,
            "object": "chat.completion.chunk",
            "created": created,
            "model": "cairo-coder",
            "choices": [{"index": 0, "delta": {}, "finish_reason": "stop"}],
        }
        yield f"data: {json.dumps(final_chunk)}\n\n"
        yield "data: [DONE]\n\n"

    def _generate_chat_completion(
        self, agent: RagPipeline, query: str, history: list[Message], mcp_mode: bool
    ) -> ChatCompletionResponse:
        """Generate non-streaming chat completion response."""
        response_id = str(uuid.uuid4())
        created = int(time.time())

        # Process agent and collect response
        # Create random session id
        thread_id = str(uuid.uuid4())
        langsmith_extra = {"metadata": {"thread_id": thread_id}}
        response = agent.forward(
            query=query, chat_history=history, mcp_mode=mcp_mode, langsmith_extra=langsmith_extra
        )

        answer = response.answer

        # TODO: Use DSPy to calculate token usage.
        # Calculate token usage (simplified)
        lm_usage = response.get_lm_usage()
        # Aggregate, for all entries, together the prompt_tokens, completion_tokens, total_tokens fields
        total_prompt_tokens = sum(entry.get("prompt_tokens", 0) for entry in lm_usage.values())
        total_completion_tokens = sum(
            entry.get("completion_tokens", 0) for entry in lm_usage.values()
        )
        total_tokens = sum(entry.get("total_tokens", 0) for entry in lm_usage.values())

        return ChatCompletionResponse(
            id=response_id,
            created=created,
            choices=[
                ChatCompletionChoice(
                    index=0,
                    message=ChatMessage(role="assistant", content=answer),
                    finish_reason="stop",
                )
            ],
            usage=ChatCompletionUsage(
                prompt_tokens=total_prompt_tokens,
                completion_tokens=total_completion_tokens,
                total_tokens=total_tokens,
            ),
        )


class TokenTracker:
    """Simple token tracker for usage statistics."""

    def __init__(self):
        self.sessions = {}

    def track_tokens(self, session_id: str, prompt_tokens: int, completion_tokens: int):
        """Track token usage for a session."""
        if session_id not in self.sessions:
            self.sessions[session_id] = {
                "prompt_tokens": 0,
                "completion_tokens": 0,
                "total_tokens": 0,
            }

        self.sessions[session_id]["prompt_tokens"] += prompt_tokens
        self.sessions[session_id]["completion_tokens"] += completion_tokens
        self.sessions[session_id]["total_tokens"] += prompt_tokens + completion_tokens

    def get_session_usage(self, session_id: str) -> dict[str, int]:
        """Get session token usage."""
        return self.sessions.get(
            session_id, {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}
        )


def create_app(
    vector_store_config: VectorStoreConfig, config_manager: ConfigManager | None = None
) -> FastAPI:
    """
    Create FastAPI application.

    Args:
        vector_store: Vector store for document retrieval
        config_manager: Optional configuration manager

    Returns:
        Configured FastAPI application
    """
    server = CairoCoderServer(vector_store_config, config_manager)
    return server.app


def get_vector_store_config() -> VectorStoreConfig:
    """
    Dependency to get vector store instance.

    Returns:
        Vector store instance
    """
    # This would be configured based on your setup
    from cairo_coder.core.config import VectorStoreConfig

    config = ConfigManager.load_config()

    # Load from environment or config

    return VectorStoreConfig(
        host=config.vector_store.host,
        port=config.vector_store.port,
        database=config.vector_store.database,
        user=config.vector_store.user,
        password=config.vector_store.password,
        table_name=config.vector_store.table_name,
        similarity_measure=config.vector_store.similarity_measure,
    )


# Create FastAPI app instance
app = create_app(get_vector_store_config())


def main():
    import argparse

    import uvicorn

    parser = argparse.ArgumentParser(description="Cairo Coder Server")
    parser.add_argument("--dev", action="store_true", help="Enable development mode with reload")
    parser.add_argument("--workers", type=int, default=5, help="Number of workers to run")
    args = parser.parse_args()

    ConfigManager.load_config()
    # TODO: configure DSPy with the proper LM.
    # TODO: Find a proper pattern for it?
    # TODO: multi-model management?
    uvicorn.run(
        "cairo_coder.server.app:app",
        host="0.0.0.0",
        port=3001,
        reload=args.dev,
        log_level="info",
        workers=args.workers,
    )


if __name__ == "__main__":
    main()
