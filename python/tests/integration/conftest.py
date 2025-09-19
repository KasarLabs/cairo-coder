"""
Integration-specific fixtures.

- Streaming patches to avoid LLM calls while exercising SSE path.
- An integration client that injects a real RagPipeline wired to mocks.
"""

import pytest
from fastapi.testclient import TestClient

from cairo_coder.server.app import get_agent_factory, get_vector_db


@pytest.fixture
def patch_dspy_streaming_success(monkeypatch):
    """Patch dspy.streamify to emit token-like chunks and provide StreamListener.

    Yields two chunks: "Hello " and "world".
    """
    import dspy

    class FakeStreamResponse:
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
                yield FakeStreamResponse("Hello ")
                yield FakeStreamResponse("world")

            return gen()

        return runner

    monkeypatch.setattr(dspy, "streamify", fake_streamify)


@pytest.fixture
def patch_dspy_streaming_error(monkeypatch):
    """Patch dspy.streamify to raise an error mid-stream and provide StreamListener."""
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


@pytest.fixture(autouse=True)
def _patch_dspy_streaming_default(monkeypatch):
    """Default safe streaming patch for all integration tests.

    Ensures no real LLM streaming is attempted unless a test overrides it.
    """
    import dspy

    class FakeStreamResponse:
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
                yield FakeStreamResponse("Hello ")
                yield FakeStreamResponse("world")

            return gen()

        return runner

    monkeypatch.setattr(dspy, "streamify", fake_streamify)


@pytest.fixture
def real_pipeline(mock_query_processor, mock_vector_store_config, mock_vector_db, mock_embedder):
    """Create RagPipeline with mocked components to avoid external calls."""
    from cairo_coder.core.rag_pipeline import RagPipeline, RagPipelineConfig
    from cairo_coder.dspy.generation_program import create_generation_program, create_mcp_generation_program

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
            generation_program=create_generation_program(),
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

    pipeline.generation_program.aforward = AsyncMock(side_effect=_fake_gen_aforward)
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
def client(server, real_pipeline, mock_vector_db, mock_agent_factory):
    """Integration-level client with pipeline injection.

    Overrides FastAPI dependencies:
    - get_vector_db -> shared mock_vector_db
    - get_agent_factory -> shared mock_agent_factory returning real_pipeline
    """
    # Configure the reusable mock factory to return the real pipeline
    mock_agent_factory.get_or_create_agent.return_value = real_pipeline
    mock_agent_factory.get_available_agents.return_value = [
        "cairo-coder",
        "scarb-assistant",
    ]

    server.app.dependency_overrides[get_vector_db] = lambda: mock_vector_db
    server.app.dependency_overrides[get_agent_factory] = lambda: mock_agent_factory
    return TestClient(server.app)
