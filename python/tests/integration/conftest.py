"""
Integration-specific fixtures.

- Streaming patches to avoid LLM calls while exercising SSE path.
- An integration client that injects a real RagPipeline wired to mocks.
"""

from unittest.mock import AsyncMock, Mock

import dspy
import pytest

from cairo_coder.agents.registry import AgentId


@pytest.fixture
def patch_dspy_streaming_error(monkeypatch, real_pipeline):
    """Patch dspy.streamify to raise an error mid-stream and provide StreamListener.

    Also patches the real_pipeline's generation_program.aforward_streaming to raise errors.
    """
    import dspy

    class FakeStreamResponse:  # unused but parity if code inspects it
        def __init__(self, chunk: str):
            self.chunk = chunk

    class FakeStreamListener:
        def __init__(self, signature_field_name: str):  # noqa: ARG002
            pass

    monkeypatch.setattr(
        dspy,
        "streaming",
        type("S", (), {"StreamResponse": FakeStreamResponse, "StreamListener": FakeStreamListener}),
    )

    def fake_streamify(_program, stream_listeners=None):  # noqa: ARG001
        def runner(**kwargs):  # noqa: ARG001
            async def gen():
                raise RuntimeError("unhandled errors in a TaskGroup (1 sub-exception)")
                yield "unreachable"  # pragma: no cover

            return gen()

        return runner

    monkeypatch.setattr(dspy, "streamify", fake_streamify)

    # Also patch the real_pipeline's streaming method to raise an error
    async def _error_streaming(query: str, context: str, chat_history: str | None = None):
        raise RuntimeError("unhandled errors in a TaskGroup (1 sub-exception)")
        yield "unreachable"  # pragma: no cover

    real_pipeline.generation_program.aforward_streaming = _error_streaming


@pytest.fixture
def real_pipeline(mock_query_processor, mock_vector_store_config, mock_vector_db):
    """Create RagPipeline with mocked components to avoid external calls."""
    from cairo_coder.core.rag_pipeline import RagPipeline, RagPipelineConfig
    from cairo_coder.dspy.generation_program import (
        create_generation_program,
        create_mcp_generation_program,
    )

    pipeline = RagPipeline(
        RagPipelineConfig(
            name="it-real",
            vector_store_config=mock_vector_store_config,
            query_processor=mock_query_processor,
            document_retriever=__import__("cairo_coder.dspy.document_retriever", fromlist=["DocumentRetrieverProgram"]).DocumentRetrieverProgram(
                vector_store_config=mock_vector_store_config,
                vector_db=mock_vector_db,
                max_source_count=3,
                similarity_threshold=0.1,
            ),
            generation_program=create_generation_program(AgentId.CAIRO_CODER),
            mcp_generation_program=create_mcp_generation_program(),
            sources=list(__import__("cairo_coder.core.types", fromlist=["DocumentSource"]).DocumentSource),
            max_source_count=3,
            similarity_threshold=0.1,
        )
    )

    # Avoid LLM calls in the judge and non-streaming generation
    from unittest.mock import AsyncMock, Mock

    pipeline.retrieval_judge.aforward = AsyncMock(side_effect=lambda query, documents: documents)
    pipeline.retrieval_judge.get_lm_usage = Mock(return_value={})

    # Patch non-streaming generation to mimic conversation turns using chat_history
    import dspy as _dspy

    async def _fake_gen_aforward(query: str, context: str, chat_history: str | None = None):
        lines = [ln for ln in (chat_history or "").split("\n") if ln.strip()]
        # Mimic the test's selection based on number of prior message pairs
        responses = [
            "Hello! I'm Cairo Coder, ready to help with Cairo programming.",
            "To create a contract, use the #[contract] attribute on a module.",
            "You can deploy it using Scarb with the deploy command.",
        ]
        idx = min((len(lines)) // 2, len(responses) - 1)
        return _dspy.Prediction(answer=responses[idx])

    async def _fake_gen_aforward_streaming(query: str, context: str, chat_history: str | None = None):
        yield dspy.streaming.StreamResponse(predict_name="GenerationProgram", signature_field_name="answer", chunk="Hello! I'm Cairo Coder, ", is_last_chunk=False)
        yield dspy.streaming.StreamResponse(predict_name="GenerationProgram", signature_field_name="answer", chunk="ready to help with Cairo programming.", is_last_chunk=True)
        yield dspy.Prediction(answer="Hello! I'm Cairo Coder, ready to help with Cairo programming.")

    pipeline.generation_program.aforward = AsyncMock(side_effect=_fake_gen_aforward)
    pipeline.generation_program.aforward_streaming =_fake_gen_aforward_streaming
    pipeline.generation_program.get_lm_usage = Mock(return_value={})

    # Patch MCP generation to a deterministic simple string as tests expect
    pipeline.mcp_generation_program.aforward = AsyncMock(
        return_value=_dspy.Prediction(answer="Cairo is a programming language")
    )
    pipeline.mcp_generation_program.forward = lambda documents: _dspy.Prediction(
        answer="Cairo is a programming language"
    )

    return pipeline

@pytest.fixture
def patch_suggestion_program(monkeypatch):
    """Patch SuggestionGeneration to return mock suggestions."""
    import dspy

    mock_suggestion_program = Mock(spec=dspy.Predict)
    mock_suggestion_program.aforward = AsyncMock(return_value=dspy.Prediction(suggestions=[
        "How do I deploy this contract to testnet?",
        "What are the best practices for contract security?",
        "Can you explain how storage works in Cairo contracts?",
        "How do I write tests for this contract?",
    ]))

    # Patch dspy.Predict to return our mock when called with SuggestionGeneration
    original_predict = dspy.Predict

    def mock_predict_constructor(signature):
        from cairo_coder.dspy.suggestion_program import SuggestionGeneration
        if signature is SuggestionGeneration or signature == SuggestionGeneration:
            return mock_suggestion_program
        return original_predict(signature)

    monkeypatch.setattr("dspy.Predict", mock_predict_constructor)


@pytest.fixture(scope="function")
async def test_db_pool(postgres_container):
    """Asyncpg pool connected to the ephemeral Postgres.

    Creates schema directly to avoid cross-loop pool reuse with the app.
    """
    import asyncpg  # local import to avoid import at collection when skipped

    raw_dsn = postgres_container.get_connection_url()
    # Convert SQLAlchemy-style DSN to asyncpg-compatible DSN
    dsn = raw_dsn.replace("postgresql+psycopg2", "postgresql")
    pool = await asyncpg.create_pool(dsn=dsn, min_size=1, max_size=5)

    async with pool.acquire() as connection:
        await connection.execute(
            """
            CREATE EXTENSION IF NOT EXISTS pgcrypto;
            CREATE TABLE IF NOT EXISTS user_interactions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                agent_id VARCHAR(50) NOT NULL,
                mcp_mode BOOLEAN NOT NULL DEFAULT FALSE,
                chat_history JSONB,
                query TEXT NOT NULL,
                generated_answer TEXT,
                retrieved_sources JSONB,
                llm_usage JSONB
            );
            """
        )
        await connection.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_interactions_created_at
                ON user_interactions(created_at);
            CREATE INDEX IF NOT EXISTS idx_interactions_agent_id
                ON user_interactions(agent_id);
            """
        )

    try:
        yield pool
    finally:
        await pool.close()


@pytest.fixture()
async def db_connection(test_db_pool):
    """Function-scoped connection with a clean state per test.

    - Truncates tables before each test
    - Wraps operations in a transaction and rolls back at teardown
    """
    async with test_db_pool.acquire() as conn:
        # Ensure clean tables and commit immediately so other connections can see it
        await conn.execute("TRUNCATE TABLE user_interactions RESTART IDENTITY;")
        # No explicit transaction to allow visibility from the app connection
        yield conn


@pytest.fixture()
async def populated_db_connection(db_connection):
    """Populate DB with sample interactions and analyses before yielding connection."""
    import uuid
    from datetime import datetime, timedelta, timezone

    now = datetime.now(timezone.utc)

    # Insert sample interactions
    import json as _json

    interactions = [
        {
            "id": uuid.uuid4(),
            "created_at": now - timedelta(hours=4),
            "agent_id": "cairo-coder",
            "mcp_mode": False,
            "chat_history": _json.dumps([]),
            "query": "What is Cairo?",
            "generated_answer": "Cairo is a programming language",
            "retrieved_sources": None,
            "llm_usage": None,
        },
        {
            "id": uuid.uuid4(),
            "created_at": now - timedelta(hours=2),
            "agent_id": "starknet-agent",
            "mcp_mode": True,
            "chat_history": _json.dumps([]),
            "query": "How to deploy a contract?",
            "generated_answer": "Use Starknet CLI",
            "retrieved_sources": None,
            "llm_usage": None,
        },
        {
            "id": uuid.uuid4(),
            "created_at": now - timedelta(minutes=30),
            "agent_id": "cairo-coder",
            "mcp_mode": False,
            "chat_history": _json.dumps([]),
            "query": "Storage variables?",
            "generated_answer": "Use #[storage]",
            "retrieved_sources": None,
            "llm_usage": None,
        },
    ]

    for it in interactions:
        await db_connection.execute(
            """
            INSERT INTO user_interactions (
                id, created_at, agent_id, mcp_mode, chat_history, query, generated_answer, retrieved_sources, llm_usage
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
            """,
            it["id"],
            it["created_at"],
            it["agent_id"],
            it["mcp_mode"],
            it["chat_history"],
            it["query"],
            it["generated_answer"],
            it["retrieved_sources"],
            it["llm_usage"],
        )

    return db_connection
