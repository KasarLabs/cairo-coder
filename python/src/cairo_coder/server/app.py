"""
FastAPI server for Cairo Coder.

This module implements the FastAPI application that provides OpenAI-compatible
API endpoints and behaviors.
"""

import argparse
import json
import os
import time
import uuid
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

import dspy
import langsmith as ls
import structlog
import uvicorn
from dspy.adapters import ChatAdapter, XMLAdapter
from fastapi import BackgroundTasks, Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, field_validator

from cairo_coder.config.manager import ConfigManager
from cairo_coder.core.agent_factory import AgentFactory, create_agent_factory
from cairo_coder.core.config import VectorStoreConfig
from cairo_coder.core.rag_pipeline import RagPipeline
from cairo_coder.core.types import Message, Role, StreamEventType
from cairo_coder.dspy.document_retriever import SourceFilteredPgVectorRM
from cairo_coder.dspy.suggestion_program import SuggestionGeneration
from cairo_coder.db import session as db_session
from cairo_coder.db.models import UserInteraction
from cairo_coder.db.repository import create_user_interaction
from cairo_coder.server.insights_api import router as insights_router
from cairo_coder.utils.logging import setup_logging

# Configure structured logging
setup_logging(os.environ.get("LOG_LEVEL", "INFO"), os.environ.get("LOG_FORMAT", "console"))
logger = structlog.get_logger(__name__)

# Global vector DB instance managed by FastAPI lifecycle
_vector_db: SourceFilteredPgVectorRM | None = None
_agent_factory: AgentFactory | None = None


# OpenAI-compatible Request/Response Models
class ChatMessage(BaseModel):
    """OpenAI-compatible chat message."""

    role: Role = Field(..., description="Message role: system, user, or assistant")
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

    @field_validator("messages")
    @classmethod
    def validate_messages(cls, v):
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


class SuggestionRequest(BaseModel):
    """Request model for generating conversation suggestions."""

    chat_history: list[ChatMessage] = Field(..., description="Conversation history to generate suggestions from")


class SuggestionResponse(BaseModel):
    """Response model for conversation suggestions."""

    suggestions: list[str] = Field(..., description="List of 4-5 follow-up suggestions")


async def log_interaction_task(
    agent_id: str,
    mcp_mode: bool,
    query: str,
    chat_history: list[Message],
    response: ChatCompletionResponse,
    agent: RagPipeline,
) -> None:
    """Background task that persists a user interaction."""
    sources_data = [
        {"page_content": doc.page_content, "metadata": doc.metadata}
        for doc in agent.last_retrieved_documents
    ]

    # Convert Message objects to dicts for JSON serialization
    chat_history_dicts = [
        {"role": msg.role.value if hasattr(msg.role, "value") else msg.role, "content": msg.content}
        for msg in chat_history
    ] if chat_history else None

    interaction = UserInteraction(
        agent_id=agent_id,
        mcp_mode=mcp_mode,
        chat_history=chat_history_dicts,
        query=query,
        generated_answer=response.choices[0].message.content if response.choices else None,
        retrieved_sources=sources_data,
        llm_usage=agent.get_lm_usage(),
    )
    await create_user_interaction(interaction)


class CairoCoderServer:
    """
    FastAPI server for Cairo Coder that replicates TypeScript backend functionality.

    This server provides the same OpenAI-compatible API endpoints as the original
    TypeScript backend, maintaining full compatibility while using the Python
    DSPy-based RAG pipeline.
    """

    def __init__(
        self, vector_store_config: VectorStoreConfig
    ):
        """
        Initialize the Cairo Coder server.

        Args:
            vector_store_config: Configuration of the vector store to use
        """
        self.vector_store_config = vector_store_config

        # Initialize FastAPI app with lifespan
        self.app = FastAPI(
            title="Cairo Coder",
            description="OpenAI-compatible API for Cairo programming assistance",
            version="1.0.0",
            lifespan=lifespan,
        )

        # Configure CORS - allow all origins like TypeScript backend
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

        self.app.include_router(insights_router)

        # Setup routes
        self._setup_routes()

        embedder = dspy.Embedder("gemini/gemini-embedding-001", dimensions=3072, batch_size=512)
        dspy.configure(
            lm=dspy.LM("gemini/gemini-flash-latest", max_tokens=30000, cache=False),
            adapter=ChatAdapter(),
            embedder=embedder,
            track_usage=True,
        )

    def _setup_routes(self):
        """Setup FastAPI routes matching TypeScript backend."""

        @self.app.get("/")
        async def health_check():
            """Health check endpoint - matches TypeScript backend."""
            return {"status": "ok"}

        @self.app.get("/v1/agents")
        async def list_agents(
            agent_factory: AgentFactory = Depends(get_agent_factory),
        ):
            """List all available agents."""
            try:
                # Create agent factory with injected vector_db
                available_agents = agent_factory.get_available_agents()
                agents_info = []

                for agent_id in available_agents:
                    try:
                        info = agent_factory.get_agent_info(agent_id=agent_id)
                        agents_info.append(
                            AgentInfo(
                                id=info["id"],
                                name=info["name"],
                                description=info["description"],
                                sources=info["sources"],
                            )
                        )
                    except Exception as e:
                        logger.warning(
                            "Failed to get agent info", agent_id=agent_id, error=str(e), exc_info=True
                        )

                return agents_info
            except Exception as e:
                logger.error("Failed to list agents", error=str(e), exc_info=True)
                raise HTTPException(
                    status_code=500,
                    detail=ErrorResponse(
                        error=ErrorDetail(
                            message="Failed to list agents",
                            type="server_error",
                            code="internal_error",
                        )
                    ).dict(),
                ) from e

        @self.app.post("/v1/agents/{agent_id}/chat/completions")
        async def agent_chat_completions(
            agent_id: str,
            request: ChatCompletionRequest,
            req: Request,
            background_tasks: BackgroundTasks,
            mcp: str | None = Header(None),
            x_mcp_mode: str | None = Header(None, alias="x-mcp-mode"),
            vector_db: SourceFilteredPgVectorRM = Depends(get_vector_db),
            agent_factory: AgentFactory = Depends(get_agent_factory),
        ):
            """Agent-specific chat completions"""
            # Create agent factory to validate agent exists
            try:
                agent_factory.get_agent_info(agent_id=agent_id)
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
                    ).dict(),
                ) from e

            # Determine MCP mode
            mcp_mode = bool(mcp or x_mcp_mode)

            return await self._handle_chat_completion(
                request, req, background_tasks, agent_factory, agent_id, mcp_mode, vector_db
            )

        @self.app.post("/v1/chat/completions")
        async def v1_chat_completions(
            request: ChatCompletionRequest,
            req: Request,
            background_tasks: BackgroundTasks,
            mcp: str | None = Header(None),
            x_mcp_mode: str | None = Header(None, alias="x-mcp-mode"),
            vector_db: SourceFilteredPgVectorRM = Depends(get_vector_db),
            agent_factory: AgentFactory = Depends(get_agent_factory),
        ):
            """Legacy chat completions endpoint"""
            # Determine MCP mode
            mcp_mode = bool(mcp or x_mcp_mode)

            return await self._handle_chat_completion(
                request, req, background_tasks, agent_factory, None, mcp_mode, vector_db
            )

        @self.app.post("/chat/completions")
        async def chat_completions(
            request: ChatCompletionRequest,
            req: Request,
            background_tasks: BackgroundTasks,
            mcp: str | None = Header(None),
            x_mcp_mode: str | None = Header(None, alias="x-mcp-mode"),
            vector_db: SourceFilteredPgVectorRM = Depends(get_vector_db),
            agent_factory: AgentFactory = Depends(get_agent_factory),
        ):
            """Legacy chat completions endpoint."""
            # Determine MCP mode
            mcp_mode = bool(mcp or x_mcp_mode)

            return await self._handle_chat_completion(
                request, req, background_tasks, agent_factory, None, mcp_mode, vector_db
            )

        @self.app.post("/v1/suggestions", response_model=SuggestionResponse)
        async def generate_suggestions(request: SuggestionRequest):
            """Generate follow-up conversation suggestions based on chat history."""
            try:
                formatted_history = self._format_chat_history_for_suggestions(request.chat_history)
                suggestion_program = dspy.Predict(SuggestionGeneration)
                with dspy.context(
                    lm=dspy.LM("gemini/gemini-flash-lite-latest", max_tokens=10000), adapter=XMLAdapter()
                ):
                    result = await suggestion_program.aforward(chat_history=formatted_history)
                suggestions = result.suggestions if isinstance(result.suggestions, list) else []
                return SuggestionResponse(suggestions=suggestions)

            except Exception as e:
                logger.error("Error generating suggestions", error=str(e), exc_info=True)
                raise HTTPException(
                    status_code=500,
                    detail=ErrorResponse(
                        error=ErrorDetail(
                            message="Failed to generate suggestions",
                            type="server_error",
                            code="internal_error",
                        )
                    ).dict(),
                ) from e

    async def _handle_chat_completion(
        self,
        request: ChatCompletionRequest,
        req: Request,
        background_tasks: BackgroundTasks,
        agent_factory: AgentFactory,
        agent_id: str | None = None,
        mcp_mode: bool = False,
        vector_db: SourceFilteredPgVectorRM | None = None,
    ):
        """Handle chat completion request."""
        try:
            # Convert messages to internal format
            messages = []
            for msg in request.messages:
                messages.append(Message(role=msg.role, content=msg.content))

            # Get last user message as query
            query = request.messages[-1].content

            # Determine agent ID (fallback to cairo-coder)
            effective_agent_id = agent_id or "cairo-coder"

            # Create agent
            agent = agent_factory.get_or_create_agent(
                agent_id=effective_agent_id,
                mcp_mode=mcp_mode,
            )

            # Handle streaming vs non-streaming
            if request.stream:
                return StreamingResponse(
                    self._stream_chat_completion(agent, query, messages[:-1], mcp_mode, effective_agent_id),
                    media_type="text/event-stream",
                    headers={
                        "Cache-Control": "no-cache",
                        "Connection": "keep-alive",
                        "X-Accel-Buffering": "no",
                    },
                )
            chat_history = messages[:-1]
            response = await self._generate_chat_completion(agent, query, chat_history, mcp_mode)

            background_tasks.add_task(
                log_interaction_task,
                agent_id=effective_agent_id,
                mcp_mode=mcp_mode,
                query=query,
                chat_history=chat_history,
                response=response,
                agent=agent,
            )

            return response

        except ValueError as e:
            raise HTTPException(
                status_code=400,
                detail=ErrorResponse(
                    error=ErrorDetail(
                        message=str(e), type="invalid_request_error", code="invalid_request"
                    )
                ).dict(),
            ) from e

        except Exception as e:
            logger.error("Error in chat completion", error=str(e), exc_info=True)
            raise HTTPException(
                status_code=500,
                detail=ErrorResponse(
                    error=ErrorDetail(
                        message="Internal server error", type="server_error", code="internal_error"
                    )
                ).model_dump(),
            ) from e

    async def _stream_chat_completion(
        self, agent: RagPipeline, query: str, history: list[Message], mcp_mode: bool, agent_id: str
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
            with ls.trace(name="RagPipelineStreaming", run_type="chain", inputs={"query": query, "chat_history": history, "mcp_mode": mcp_mode}) as rt:
                async for event in agent.aforward_streaming(
                    query=query, chat_history=history, mcp_mode=mcp_mode
                ):
                    if event.type == StreamEventType.SOURCES:
                        # Emit sources event for clients to display
                        sources_chunk = {
                            "type": "sources",
                            "data": event.data,
                        }
                        yield f"data: {json.dumps(sources_chunk)}\n\n"
                    elif event.type == StreamEventType.REASONING:
                        # Emit thinking event for clients to display
                        reasoning_chunk = {
                            "type": "reasoning",
                            "data": event.data,
                        }
                        yield f"data: {json.dumps(reasoning_chunk)}\n\n"
                    elif event.type == StreamEventType.PROCESSING:
                        # Emit processing event for clients to display
                        processing_chunk = {
                            "type": "processing",
                            "data": event.data,
                        }
                        yield f"data: {json.dumps(processing_chunk)}\n\n"
                    elif event.type == StreamEventType.RESPONSE:
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
                    elif event.type == StreamEventType.FINAL_RESPONSE:
                        # Emit an explicit final response event for clients
                        final_event = {
                            "type": "final_response",
                            "data": event.data,
                        }
                        yield f"data: {json.dumps(final_event)}\n\n"
                    elif event.type == StreamEventType.ERROR:
                        # Emit an error as a final delta and stop
                        error_chunk = {
                            "id": response_id,
                            "object": "chat.completion.chunk",
                            "created": created,
                            "model": "cairo-coder",
                            "choices": [
                                {
                                    "index": 0,
                                    "delta": {"content": f"\n\nError: {event.data}"},
                                    "finish_reason": "stop",
                                }
                            ],
                        }
                        yield f"data: {json.dumps(error_chunk)}\n\n"
                        break
                    elif event.type == StreamEventType.END:
                        break
                rt.end(outputs={"output": content_buffer})

        except Exception as e:
            logger.error("Error during agent streaming", error=str(e), exc_info=True)
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

        # Log interaction after streaming completes
        # Create a mock response object for logging
        response = ChatCompletionResponse(
            id=response_id,
            created=created,
            choices=[
                ChatCompletionChoice(
                    index=0,
                    message=ChatMessage(role=Role.ASSISTANT, content=content_buffer),
                    finish_reason="stop",
                )
            ],
            usage={"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
        )
        try:
            await log_interaction_task(agent_id, mcp_mode, query, history, response, agent)
        except Exception as log_error:
            logger.error("Failed to log streaming interaction", error=str(log_error), exc_info=True)

    def _format_chat_history_for_suggestions(self, chat_history: list[ChatMessage]) -> str:
        """
        Format chat history for suggestion generation.

        Args:
            chat_history: List of chat messages

        Returns:
            Formatted chat history string
        """
        if not chat_history:
            return ""

        formatted = []
        for msg in chat_history:
            role = "User" if msg.role == "user" else "Assistant"
            formatted.append(f"{role}: {msg.content}")

        return "\n".join(formatted)

    async def _generate_chat_completion(
        self, agent: RagPipeline, query: str, history: list[Message], mcp_mode: bool
    ) -> ChatCompletionResponse:
        """Generate non-streaming chat completion response."""
        response_id = str(uuid.uuid4())
        created = int(time.time())

        # Process agent and collect response
        response: dspy.Prediction = await agent.aforward(
            query=query, chat_history=history, mcp_mode=mcp_mode
        )

        answer = response.answer

        # Somehow this is not always returning something (None). In that case, we're not capable of getting the
        # tracked usage.
        lm_usage = response.get_lm_usage()
        logger.info(f"LM usage from response: {lm_usage}")

        if not lm_usage:
            logger.warning("No LM usage data available, setting defaults to 0")
            total_prompt_tokens = 0
            total_completion_tokens = 0
            total_tokens = 0
        else:
            # Aggregate, for all entries, together the prompt_tokens, completion_tokens, total_tokens fields
            total_prompt_tokens = sum(entry.get("prompt_tokens", 0) for entry in lm_usage.values())
            total_completion_tokens = sum(
                entry.get("completion_tokens", 0) for entry in lm_usage.values()
            )
            total_tokens = sum(entry.get("total_tokens", 0) for entry in lm_usage.values())
            logger.info(f"Token usage - prompt: {total_prompt_tokens}, completion: {total_completion_tokens}, total: {total_tokens}")

        logger.info(
            "Chat completion generated",
            prompt_tokens=total_prompt_tokens,
            completion_tokens=total_completion_tokens,
            total_tokens=total_tokens,
            response_id=response_id,
        )

        return ChatCompletionResponse(
            id=response_id,
            created=created,
            choices=[
                ChatCompletionChoice(
                    index=0,
                    message=ChatMessage(role=Role.ASSISTANT, content=answer),
                    finish_reason="stop",
                )
            ],
            usage=ChatCompletionUsage(
                prompt_tokens=total_prompt_tokens,
                completion_tokens=total_completion_tokens,
                total_tokens=total_tokens,
            ),
        )


def create_app(
    vector_store_config: VectorStoreConfig
) -> FastAPI:
    """
    Create FastAPI application.

    Args:
        vector_store: Vector store for document retrieval

    Returns:
        Configured FastAPI application
    """
    server = CairoCoderServer(vector_store_config)
    server.app.router.lifespan_context = lifespan
    return server.app


def get_vector_store_config() -> VectorStoreConfig:
    """
    Dependency to get vector store instance.

    Returns:
        Vector store instance
    """
    config = ConfigManager.load_config()
    return VectorStoreConfig(
        host=config.vector_store.host,
        port=config.vector_store.port,
        database=config.vector_store.database,
        user=config.vector_store.user,
        password=config.vector_store.password,
        table_name=config.vector_store.table_name,
        similarity_measure=config.vector_store.similarity_measure,
    )


async def get_vector_db() -> SourceFilteredPgVectorRM:
    """
    FastAPI dependency to get the vector DB instance.

    Returns:
        The singleton vector DB instance

    Raises:
        RuntimeError: If vector DB is not initialized
    """
    if _vector_db is None:
        raise RuntimeError("Vector DB not initialized. This should not happen.")
    return _vector_db


async def get_agent_factory() -> AgentFactory:
    if _agent_factory is None:
        raise RuntimeError("Agent Factory not initialized.")
    return _agent_factory


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage application lifecycle - initialize and cleanup resources.

    Args:
        app: FastAPI application instance
    """
    global _vector_db, _agent_factory

    logger.info("Starting Cairo Coder server - initializing resources")

    # Initialize SQL persistence layer
    await db_session.get_pool()
    await db_session.execute_schema_scripts()

    # Load config once
    config = ConfigManager.load_config()
    vector_store_config = config.vector_store

    # embedding_func will default to dspy.settings.embedder (configured in __init__)
    _vector_db = SourceFilteredPgVectorRM(
        db_url=vector_store_config.dsn,
        pg_table_name=vector_store_config.table_name,
        content_field="content",
        fields=["id", "content", "metadata"],
        k=5,  # Default k, will be overridden by retriever
        include_similarity=True,
    )

    # Ensure connection pool is initialized
    await _vector_db._ensure_pool()

    # Initialize Agent Factory with vector DB and config
    _agent_factory = create_agent_factory(vector_db=_vector_db, vector_store_config=vector_store_config)

    logger.info("Vector DB and Agent Factory initialized successfully")

    yield  # Server is running

    # Cleanup
    logger.info("Shutting down Cairo Coder server - cleaning up resources")

    await db_session.close_pool()

    if _vector_db and _vector_db.pool:
        await _vector_db.pool.close()
        _vector_db.pool = None
        logger.info("Vector DB connection pool closed")

    _vector_db = None
    _agent_factory = None

def create_app_factory():
    """Factory function for creating the app, used by uvicorn in reload mode."""
    return create_app(get_vector_store_config())

def main():
    parser = argparse.ArgumentParser(description="Cairo Coder Server")
    parser.add_argument("--dev", action="store_true", help="Enable development mode with reload")
    parser.add_argument("--workers", type=int, default=5, help="Number of workers to run")
    args = parser.parse_args()

    uvicorn.run(
        "cairo_coder.server.app:create_app_factory",
        host="0.0.0.0",
        port=3001,
        reload=args.dev,
        log_level="info",
        workers=args.workers,
        factory=True,
    )

if __name__ == "__main__":
    # Create FastAPI app instance
    main()
