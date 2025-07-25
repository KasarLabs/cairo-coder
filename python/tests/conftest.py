"""Shared pytest fixtures for the Cairo Coder test suite.

- Deduplicates fixture creation that was scattered across files.
- Wraps helper factories from tests.fixtures.rag_pipeline into pytest fixtures.
- Provides isolated MonkeyPatch-based patches (e.g., for dspy.Parallel).
"""

from __future__ import annotations

import asyncio
import os
import tempfile
from collections.abc import AsyncGenerator, Generator
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, Mock, patch

import dspy
import pytest
import toml
from fastapi.testclient import TestClient

from cairo_coder.config.manager import ConfigManager
from cairo_coder.core.agent_factory import AgentFactory
from cairo_coder.core.config import AgentConfiguration, Config, VectorStoreConfig
from cairo_coder.core.types import (
    Document,
    DocumentSource,
    Message,
    ProcessedQuery,
    Role,
    StreamEvent,
    StreamEventType,
)
from cairo_coder.dspy.document_retriever import SourceFilteredPgVectorRM
from cairo_coder.server.app import CairoCoderServer, get_agent_factory

# Import helper factories (not pytest fixtures) from the existing helper module
from tests.fixtures.rag_pipeline import (
    make_documents as _make_documents,
)
from tests.fixtures.rag_pipeline import (
    make_processed_query as _make_processed_query,
)
from tests.fixtures.rag_pipeline import (
    mock_document_retriever as _mock_document_retriever,
)
from tests.fixtures.rag_pipeline import (
    mock_generation_program as _mock_generation_program,
)
from tests.fixtures.rag_pipeline import (
    mock_mcp_program as _mock_mcp_program,
)
from tests.fixtures.rag_pipeline import (
    mock_query_processor as _mock_query_processor,
)
from tests.fixtures.rag_pipeline import (
    mock_retrieval_judge as _mock_retrieval_judge,
)
from tests.fixtures.rag_pipeline import (
    pipeline_config_factory as _pipeline_config_factory,
)
from tests.fixtures.rag_pipeline import (
    pipeline_factory as _pipeline_factory,
)

# =============================================================================
# Common Mock Fixtures
# =============================================================================

@pytest.fixture(scope="session")
def mock_returned_documents():
    """Create a mock vector database instance for dependency injection."""
    return [
        dspy.Example(
            content="Cairo is a programming language for writing provable programs.",
            metadata={"source": "cairo_book", "score": 0.9, "chapter": 1},
        ),
        dspy.Example(
            content="Starknet is a validity rollup (also known as a ZK rollup).",
            metadata={"source": "starknet_docs", "score": 0.8, "section": "overview"},
        ),
        dspy.Example(
            content="OpenZeppelin provides secure smart contract libraries for Cairo.",
            metadata={"source": "openzeppelin_docs", "score": 0.7},
        ),
    ]

@pytest.fixture(scope="function")
def mock_vector_db(mock_returned_documents):
    """Create a mock vector database for dependency injection."""
    mock_db = Mock(spec=SourceFilteredPgVectorRM)

    # Mock the async pool
    mock_db.pool = AsyncMock()
    mock_db._ensure_pool = AsyncMock()

    # Mock the forward method
    mock_db.forward = Mock(return_value=mock_returned_documents)

    # Mock the async forward method
    mock_db.aforward = AsyncMock(return_value=mock_returned_documents)

    # Mock sources attribute
    mock_db.sources = []

    return mock_db


@pytest.fixture(scope="session")
def mock_config_manager():
    """
    Create a mock configuration manager with standard configuration.

    Returns a mock ConfigManager with commonly used configuration values.
    """
    manager = Mock(spec=ConfigManager)
    manager.load_config.return_value = Config(
        vector_store=VectorStoreConfig(
            host="localhost",
            port=5432,
            database="test_db",
            user="test_user",
            password="test_pass",
            table_name="test_table",
        )
    )
    manager.get_agent_config.return_value = AgentConfiguration(
        id="test_agent",
        name="Test Agent",
        description="Test agent for testing",
        sources=[DocumentSource.CAIRO_BOOK],
        max_source_count=5,
        similarity_threshold=0.5,
    )
    manager.dsn = "postgresql://test_user:test_pass@localhost:5432/test_db"
    return manager


@pytest.fixture(scope="function")
def mock_lm():
    """
    Create a mock language model for DSPy programs.

    This fixture provides a mock LM that can be used with DSPy programs
    for testing without making actual API calls. It patches `dspy.ChainOfThought`
    and returns a configurable mock.
    """
    with patch("dspy.ChainOfThought") as mock_cot:
        mock_program = Mock()
        # Mock for sync calls
        mock_program.forward.return_value = dspy.Prediction(
            answer="Here's a Cairo contract example:\n\n```cairo\n#[starknet::contract]\nmod SimpleContract {\n    // Contract implementation\n}\n```\n\nThis contract demonstrates basic Cairo syntax."
        )
        mock_program.return_value = dspy.Prediction(
            answer="Here's a Cairo contract example:\n\n```cairo\n#[starknet::contract]\nmod SimpleContract {\n    // Contract implementation\n}\n```\n\nThis contract demonstrates basic Cairo syntax."
        )
        # Mock for async calls - use AsyncMock for coroutine
        mock_program.aforward = AsyncMock(
            return_value=dspy.Prediction(
                answer="Here's a Cairo contract example:\n\n```cairo\n#[starknet::contract]\nmod SimpleContract {\n    // Contract implementation\n}\n```\n\nThis contract demonstrates basic Cairo syntax."
            )
        )
        mock_cot.return_value = mock_program
        yield mock_program


@pytest.fixture
def mock_agent_factory(mock_agent: Mock, sample_agent_configs: dict[str, AgentConfiguration]):
    """
    Create a mock agent factory with standard agent configurations.

    Returns a mock AgentFactory with common agent configurations.
    """
    factory = Mock(spec=AgentFactory)
    factory.get_available_agents.return_value = list(sample_agent_configs.keys())

    def get_agent_info(agent_id, **kwargs):
        if agent_id in sample_agent_configs:
            agent_config = sample_agent_configs[agent_id]
            return {
                "id": agent_config.id,
                "name": agent_config.name,
                "description": agent_config.description,
                "sources": [s.value for s in agent_config.sources],
                "max_source_count": agent_config.max_source_count,
                "similarity_threshold": agent_config.similarity_threshold,
            }
        raise ValueError(f"Agent '{agent_id}' not found")

    factory.get_agent_info.side_effect = get_agent_info

    factory.create_agent.return_value = mock_agent
    factory.get_or_create_agent.return_value = mock_agent
    factory.clear_cache = Mock()
    return factory


@pytest.fixture
def mock_agent():
    """Create a mock agent with OpenAI-specific forward method."""
    mock_agent = AsyncMock()

    async def mock_forward_streaming(
        query: str, chat_history: list[Message] | None = None, mcp_mode: bool = False
    ):
        """Mock agent forward_streaming method that yields StreamEvent objects."""
        if mcp_mode:
            # MCP mode returns sources
            yield StreamEvent(
                type=StreamEventType.SOURCES,
                data=[
                    {
                        "pageContent": "Cairo is a programming language",
                        "metadata": {"source": "cairo-docs", "page": 1},
                    }
                ],
            )
            yield StreamEvent(type=StreamEventType.RESPONSE, data="Cairo is a programming language")
        else:
            # Normal mode returns response
            yield StreamEvent(type=StreamEventType.RESPONSE, data="Hello! I'm Cairo Coder.")
            yield StreamEvent(type=StreamEventType.RESPONSE, data=" How can I help you?")
        yield StreamEvent(type=StreamEventType.END, data="")

    def mock_forward(query: str, chat_history: list[Message] | None = None, mcp_mode: bool = False):
        """Mock agent forward method that returns a Predict object."""
        mock_predict = Mock()

        # Set up the answer attribute based on mode
        if mcp_mode:
            mock_predict.answer = "Cairo is a programming language"
        else:
            mock_predict.answer = "Hello! I'm Cairo Coder. How can I help you?"

        # Set up the get_lm_usage method
        mock_predict.get_lm_usage = Mock(
            return_value={
                "gemini/gemini-2.5-flash": {
                    "prompt_tokens": 100,
                    "completion_tokens": 200,
                    "total_tokens": 300,
                }
            }
        )

        return mock_predict

    async def mock_aforward(query: str, chat_history: list[Message] | None = None, mcp_mode: bool = False):
        """Mock agent aforward method that returns a Predict object."""
        return mock_forward(query, chat_history, mcp_mode)

    # Assign both sync and async forward methods
    mock_agent.forward = mock_forward
    mock_agent.aforward = mock_aforward
    mock_agent.forward_streaming = mock_forward_streaming
    return mock_agent


@pytest.fixture
def mock_pool():
    """
    Create a mock database connection pool.

    Returns a mock pool with standard database operations.
    """
    pool = AsyncMock()
    mock_conn = AsyncMock()
    mock_conn.execute = AsyncMock()
    mock_conn.fetch = AsyncMock()
    mock_conn.fetchrow = AsyncMock()
    mock_conn.fetchval = AsyncMock()

    # Create a proper context manager for acquire
    pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
    pool.acquire.return_value.__aexit__ = AsyncMock(return_value=None)

    pool.release = AsyncMock()
    pool.close = AsyncMock()
    return pool


@pytest.fixture
def server(mock_vector_store_config, mock_config_manager, mock_agent_factory):
    """Create a CairoCoderServer instance for testing."""
    return CairoCoderServer(mock_vector_store_config, mock_config_manager)


@pytest.fixture
def client(server, mock_agent_factory):
    """Create a test client for the server."""
    from cairo_coder.server.app import get_vector_db

    async def mock_get_vector_db():
        mock_db = AsyncMock()
        mock_db.pool = AsyncMock()
        mock_db._ensure_pool = AsyncMock()
        mock_db.sources = []
        return mock_db

    async def mock_get_agent_factory():
        return mock_agent_factory

    server.app.dependency_overrides[get_vector_db] = mock_get_vector_db
    server.app.dependency_overrides[get_agent_factory] = mock_get_agent_factory
    return TestClient(server.app)


@pytest.fixture(scope="session")
def mock_embedder():
    """Mock the embedder."""
    with patch("cairo_coder.dspy.document_retriever.dspy.Embedder") as mock_embedder:
        mock_embedder.return_value = Mock()
        yield mock_embedder


# =============================================================================
# Sample Data Fixtures
# =============================================================================


@pytest.fixture(scope="session")
def sample_processed_query():
    """Create a sample processed query."""
    return ProcessedQuery(
        original="How do I create a Cairo contract?",
        search_queries=["cairo", "contract", "create"],
        reasoning="I need to create a Cairo contract",
        is_contract_related=True,
        is_test_related=False,
        resources=[DocumentSource.CAIRO_BOOK, DocumentSource.STARKNET_DOCS],
    )


@pytest.fixture(scope="session")
def sample_documents():
    """
    Create a collection of sample documents for testing.

    Returns a list of Document objects with various sources and metadata.
    """
    return [
        Document(
            page_content="Cairo is a programming language for writing provable programs.",
            metadata={
                "source": "cairo_book",
                "score": 0.9,
                "title": "Introduction to Cairo",
                "url": "https://book.cairo-lang.org/ch01-00-getting-started.html",
                "source_display": "Cairo Book",
            },
        ),
        Document(
            page_content="Starknet is a validity rollup (also known as a ZK rollup).",
            metadata={
                "source": "starknet_docs",
                "score": 0.8,
                "title": "What is Starknet",
                "url": "https://docs.starknet.io/documentation/architecture_and_concepts/Network_Architecture/overview/",
                "source_display": "Starknet Docs",
            },
        ),
        Document(
            page_content="Scarb is the Cairo package manager and build tool.",
            metadata={
                "source": "scarb_docs",
                "score": 0.7,
                "title": "Scarb Overview",
                "url": "https://docs.swmansion.com/scarb/",
                "source_display": "Scarb Docs",
            },
        ),
        Document(
            page_content="OpenZeppelin provides secure smart contract libraries for Cairo.",
            metadata={
                "source": "openzeppelin_docs",
                "score": 0.6,
                "title": "OpenZeppelin Cairo",
                "url": "https://docs.openzeppelin.com/contracts-cairo/",
                "source_display": "OpenZeppelin Docs",
            },
        ),
    ]


@pytest.fixture
def sample_messages():
    """
    Create sample chat messages for testing.

    Returns a list of Message objects representing a conversation.
    """
    return [
        Message(role=Role.SYSTEM, content="You are a helpful Cairo programming assistant."),
        Message(role=Role.USER, content="How do I create a smart contract in Cairo?"),
        Message(
            role=Role.ASSISTANT, content="To create a smart contract in Cairo, you need to..."
        ),
        Message(role=Role.USER, content="Can you show me an example?"),
    ]


@pytest.fixture
def sample_agent_configs():
    """
    Create sample agent configurations for testing.

    Returns a dictionary of AgentConfiguration objects.
    """
    return {
        "cairo-coder": AgentConfiguration(
            id="cairo-coder",
            name="Cairo Coder",
            description="Cairo programming assistant",
            sources=[DocumentSource.CAIRO_BOOK, DocumentSource.STARKNET_DOCS],
            max_source_count=10,
            similarity_threshold=0.4,
        ),
        "default": AgentConfiguration(
            id="default",
            name="Cairo Coder",
            description="General Cairo programming assistant",
            sources=[DocumentSource.CAIRO_BOOK, DocumentSource.STARKNET_DOCS],
            max_source_count=10,
            similarity_threshold=0.4,
        ),
        "test_agent": AgentConfiguration(
            id="test_agent",
            name="Test Agent",
            description="Test agent for testing",
            sources=[DocumentSource.CAIRO_BOOK],
            max_source_count=5,
            similarity_threshold=0.5,
        ),
        "scarb_agent": AgentConfiguration(
            id="scarb_agent",
            name="Scarb Agent",
            description="Scarb build tool and package manager agent",
            sources=[DocumentSource.SCARB_DOCS],
            max_source_count=5,
            similarity_threshold=0.5,
        ),
        "scarb-assistant": AgentConfiguration(
            id="scarb-assistant",
            name="Scarb Assistant",
            description="Scarb build tool and package manager assistant",
            sources=[DocumentSource.SCARB_DOCS],
            max_source_count=5,
            similarity_threshold=0.5,
        ),
        "starknet_assistant": AgentConfiguration(
            id="starknet_assistant",
            name="Starknet Assistant",
            description="Starknet-specific development assistant",
            sources=[DocumentSource.STARKNET_DOCS, DocumentSource.STARKNET_FOUNDRY],
            max_source_count=8,
            similarity_threshold=0.45,
        ),
        "openzeppelin_assistant": AgentConfiguration(
            id="openzeppelin_assistant",
            name="OpenZeppelin Assistant",
            description="OpenZeppelin Cairo contracts assistant",
            sources=[DocumentSource.OPENZEPPELIN_DOCS],
            max_source_count=6,
            similarity_threshold=0.5,
        ),
    }


# =============================================================================
# Test Configuration Fixtures
# =============================================================================


@pytest.fixture(scope="session")
def sample_config_file() -> Generator[Path, None, None]:
    """Create a temporary config file for testing."""
    config_data = {
        "VECTOR_DB": {
            "POSTGRES_HOST": "test-db.example.com",
            "POSTGRES_PORT": 5433,
            "POSTGRES_DB": "test_cairo",
            "POSTGRES_USER": "test_user",
            "POSTGRES_PASSWORD": "test_password",
            "POSTGRES_TABLE_NAME": "test_documents",
            "SIMILARITY_MEASURE": "cosine",
        },
    }

    with tempfile.NamedTemporaryFile(mode="w", suffix=".toml", delete=False) as f:
        toml.dump(config_data, f)
        temp_path = Path(f.name)

    yield temp_path

    # Cleanup
    os.unlink(temp_path)


@pytest.fixture
def test_env_vars(monkeypatch):
    """
    Set up test environment variables.

    Sets common environment variables used in tests.
    """
    test_vars = {
        "OPENAI_API_KEY": "test-openai-key",
        "ANTHROPIC_API_KEY": "test-anthropic-key",
        "GOOGLE_API_KEY": "test-google-key",
        "POSTGRES_HOST": "localhost",
        "POSTGRES_PORT": "5432",
        "POSTGRES_DB": "cairo_coder_test",
        "POSTGRES_USER": "test_user",
        "POSTGRES_PASSWORD": "test_password",
    }

    for key, value in test_vars.items():
        monkeypatch.setenv(key, value)

    return test_vars


# =============================================================================
# Utility Functions
# =============================================================================


def create_test_document(
    content: str, source: str = "cairo_book", score: float = 0.8, **metadata
) -> Document:
    """
    Create a test document with standard metadata.

    Args:
        content: The document content
        source: Document source
        score: Similarity score
        **metadata: Additional metadata

    Returns:
        Document object with the provided content and metadata
    """
    base_metadata = {
        "source": source,
        "score": score,
        "title": f"Test Document from {source}",
        "url": f"https://example.com/{source}",
        "source_display": source.replace("_", " ").title(),
    }
    base_metadata.update(metadata)

    return Document(page_content=content, metadata=base_metadata)


async def create_test_stream_events(
    response_text: str = "Test response",
) -> AsyncGenerator[StreamEvent, None]:
    """
    Create a test stream of events for testing streaming functionality.

    Args:
        response_text: The response text to stream

    Yields:
        StreamEvent objects
    """
    events = [
        StreamEvent(type=StreamEventType.PROCESSING, data="Processing query..."),
        StreamEvent(type=StreamEventType.SOURCES, data=[{"title": "Test Doc", "url": "#"}]),
        StreamEvent(type=StreamEventType.RESPONSE, data=response_text),
        StreamEvent(type=StreamEventType.END, data=None),
    ]

    for event in events:
        yield event


# =============================================================================
# Parametrized Fixtures
# =============================================================================


@pytest.fixture(
    params=[
        DocumentSource.CAIRO_BOOK,
        DocumentSource.STARKNET_DOCS,
        DocumentSource.SCARB_DOCS,
        DocumentSource.OPENZEPPELIN_DOCS,
        DocumentSource.CAIRO_BY_EXAMPLE,
    ]
)
def document_source(request):
    """Parametrized fixture for testing with different document sources."""
    return request.param


@pytest.fixture(params=[0.3, 0.4, 0.5, 0.6, 0.7])
def similarity_threshold(request):
    """Parametrized fixture for testing with different similarity thresholds."""
    return request.param


@pytest.fixture(params=[5, 10, 15, 20])
def max_source_count(request):
    """Parametrized fixture for testing with different max source counts."""
    return request.param


# =============================================================================
# Event Loop Fixture
# =============================================================================


@pytest.fixture(scope="session")
def event_loop():
    """
    Create an event loop for the test session.

    This fixture ensures that async tests have access to an event loop.
    """
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


# =============================================================================
# Cleanup Fixtures
# =============================================================================


@pytest.fixture(autouse=True)
def cleanup_mocks():
    """
    Automatically clean up mocks after each test.

    This fixture ensures that mock state doesn't leak between tests.
    """
    yield
    # Any cleanup code can go here if needed
    pass


# =============================================================================
# RAG Pipeline Fixtures
# =============================================================================


@pytest.fixture
def documents():
    """Create sample documents for testing."""
    return _make_documents()


@pytest.fixture
def query_processor():
    """Mocked QueryProcessorProgram."""
    return _mock_query_processor()


@pytest.fixture
def document_retriever(documents):
    """Mocked DocumentRetrieverProgram returning our `documents` by default."""
    return _mock_document_retriever(documents)


@pytest.fixture
def generation_program():
    """Mocked GenerationProgram."""
    return _mock_generation_program()


@pytest.fixture
def mcp_generation_program():
    """Mocked McpGenerationProgram."""
    return _mock_mcp_program()


@pytest.fixture
def retrieval_judge():
    """Default mocked RetrievalJudge with sensible scores."""
    return _mock_retrieval_judge()


@pytest.fixture
def pipeline_config(query_processor, document_retriever, generation_program, mcp_generation_program):
    """RagPipelineConfig with LLM judge disabled by default (override in tests as needed)."""
    return _pipeline_config_factory(
        enable_llm_judge=False,
        query_processor=query_processor,
        document_retriever=document_retriever,
        generation_program=generation_program,
        mcp_generation_program=mcp_generation_program,
    )


@pytest.fixture
def rag_pipeline(pipeline_config):
    """Instantiate a RagPipeline using the config fixture."""
    return _pipeline_factory(pipeline_config)


# ---------------------------
# External service / patch fixtures
# ---------------------------

@pytest.fixture
def patch_dspy_parallel(monkeypatch):
    """
    Patch dspy.Parallel to a dummy callable so no real parallel LLM work is triggered in unit tests.

    Returns the MagicMock so tests can assert call counts if desired.
    """
    dummy_parallel = MagicMock()

    def _factory(num_threads: int = 10):
        return dummy_parallel

    monkeypatch.setattr("dspy.Parallel", _factory)
    return dummy_parallel


@pytest.fixture
def mock_vector_store_config() -> VectorStoreConfig:
    """Provide a simple VectorStoreConfig for factory tests."""
    return VectorStoreConfig(
        host="localhost",
        port=5432,
        database="test_db",
        user="test_user",
        password="test_pass",
        table_name="test_table",
    )


@pytest.fixture(scope='session')
def mock_dspy_examples(sample_documents: list[Document]) -> list[dspy.Example]:
    """Create mock DSPy Example objects from sample documents."""
    examples = []
    for doc in sample_documents:
        example = Mock(spec=dspy.Example)
        example.content = doc.page_content
        example.metadata = doc.metadata
        examples.append(example)
    return examples



@pytest.fixture(scope='function')
def mock_pgvector_rm(mock_dspy_examples: list[dspy.Example]):
    """Patch the vector database for the document retriever."""
    with patch("cairo_coder.dspy.document_retriever.SourceFilteredPgVectorRM") as mock_pgvector_rm:
        mock_instance = Mock()
        mock_instance.aforward = AsyncMock(return_value=mock_dspy_examples)
        mock_instance.forward = Mock(return_value=mock_dspy_examples)
        mock_pgvector_rm.return_value = mock_instance
        yield mock_pgvector_rm

# ---------------------------
# Convenience fixtures used by some tests
# ---------------------------

@pytest.fixture
def processed_query():
    """Default processed query."""
    return _make_processed_query()


# Async generator helper for streaming if needed in future tests
@pytest.fixture
def async_event_collector():
    """Utility to collect async generator outputs into a list."""

    async def _collect(async_gen):
        items = []
        async for item in async_gen:
            items.append(item)
        return items

    return _collect
