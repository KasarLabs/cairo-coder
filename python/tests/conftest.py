"""
Shared test fixtures and utilities for Cairo Coder tests.

This module provides common fixtures and utilities used across multiple test files
to reduce code duplication and ensure consistency.
"""

import os
from unittest.mock import AsyncMock, Mock, patch

import dspy
import pytest
from fastapi.testclient import TestClient

from cairo_coder.core.agent_factory import AgentFactory
from cairo_coder.core.config import VectorStoreConfig
from cairo_coder.core.types import (
    Document,
    DocumentSource,
    Message,
    ProcessedQuery,
    StreamEvent,
    StreamEventType,
)
from cairo_coder.dspy.document_retriever import DocumentRetrieverProgram, SourceFilteredPgVectorRM
from cairo_coder.dspy.generation_program import GenerationProgram, McpGenerationProgram
from cairo_coder.dspy.query_processor import QueryProcessorProgram
from cairo_coder.dspy.retrieval_judge import RetrievalJudge
from cairo_coder.server.app import CairoCoderServer, get_agent_factory


@pytest.fixture(scope="session")
def mock_returned_documents(sample_documents):
    """DSPy Examples derived from sample_documents for DRY content."""
    return [dspy.Example(content=doc.page_content, metadata=doc.metadata) for doc in sample_documents]

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
def mock_vector_store_config():
    """
    Create a mock vector store configuration.
    """
    mock_config = Mock(spec=VectorStoreConfig)
    mock_config.dsn = "postgresql://test_user:test_pass@localhost:5432/test_db"
    mock_config.table_name = "test_table"
    return mock_config

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

@pytest.fixture(scope="function")
def mock_lm_predict():
    """
    Create a mock language model for DSPy programs.

    This fixture provides a mock LM that can be used with DSPy programs
    for testing without making actual API calls. It patches `dspy.ChainOfThought`
    and returns a configurable mock.
    """
    with patch("dspy.Predict") as mock_cot:
        mock_program = Mock()
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
def mock_agent_factory(mock_agent: Mock):
    """
    Create a mock agent factory using the agent registry.

    Returns a mock AgentFactory.
    """
    factory = Mock(spec=AgentFactory)
    factory.get_available_agents.return_value = ["cairo-coder", "scarb-assistant"]

    def get_agent_info(agent_id, **kwargs):
        # Use the actual registry
        try:
            from cairo_coder.agents.registry import get_agent_by_string_id
            enum_id, spec = get_agent_by_string_id(agent_id)
            return {
                "id": enum_id.value,
                "name": spec.name,
                "description": spec.description,
                "sources": [s.value for s in spec.sources],
                "max_source_count": spec.max_source_count,
                "similarity_threshold": spec.similarity_threshold,
            }
        except ValueError as e:
            raise ValueError(f"Agent '{agent_id}' not found") from e

    factory.get_agent_info.side_effect = get_agent_info

    factory.get_or_create_agent.return_value = mock_agent
    factory.clear_cache = Mock()
    return factory


@pytest.fixture
def mock_agent():
    """Create a mock agent with OpenAI-specific forward method."""
    mock_agent = AsyncMock()

    async def mock_aforward_streaming(
        query: str, chat_history: list[Message] | None = None, mcp_mode: bool = False
    ):
        """Mock agent forward_astreaming method that yields StreamEvent objects."""
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

        # Deterministic LM usage for unit tests
        # Set up the get_lm_usage method
        mock_predict.get_lm_usage = Mock(
            return_value={
                "gemini/gemini-flash-latest": {
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
    mock_agent.aforward_streaming = mock_aforward_streaming
    return mock_agent


@pytest.fixture
def server(mock_vector_store_config):
    """Create a CairoCoderServer instance for testing."""
    return CairoCoderServer(mock_vector_store_config)


# =============================================================================
# Low-level pipeline fixtures (for integration tests)
# =============================================================================


@pytest.fixture
def client(server, mock_agent_factory, mock_vector_db):
    """Unit-level client: uses mock_agent_factory and shared mock_vector_db."""
    from cairo_coder.server.app import get_vector_db

    async def mock_get_agent_factory():
        return mock_agent_factory

    server.app.dependency_overrides[get_vector_db] = lambda: mock_vector_db
    server.app.dependency_overrides[get_agent_factory] = mock_get_agent_factory
    return TestClient(server.app)

# =============================================================================
# Sample Data Fixtures
# =============================================================================


@pytest.fixture(scope="session")
def sample_processed_query():
    """Create a sample processed query."""
    return ProcessedQuery(
        original="How do I create a Cairo contract?",
        search_queries=["cairo", "contract", "create"],
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


# =============================================================================
# Test Configuration Fixtures
# =============================================================================

@pytest.fixture(autouse=True)
def clean_config_env_vars(monkeypatch):
    """Automatically clean configuration-related environment variables before each test."""
    env_vars_to_clean = [
        "POSTGRES_HOST",
        "POSTGRES_PORT",
        "POSTGRES_DB",
        "POSTGRES_USER",
        "POSTGRES_PASSWORD",
        "POSTGRES_TABLE_NAME",
        "POSTGRES_ROOT_DB",
        "SIMILARITY_MEASURE",
        "HOST",
        "PORT",
        "DEBUG",
        "OPENAI_API_KEY",
        "ANTHROPIC_API_KEY",
        "GEMINI_API_KEY",
        "DEEPSEEK_API_KEY",
        "GROQ_API_KEY",
        "LANGSMITH_API_KEY",
        "LANGSMITH_TRACING",
        "LANGSMITH_ENDPOINT",
        "LANGSMITH_OTEL_ENABLED",
    ]

    # Store original values
    original_values = {}
    for var in env_vars_to_clean:
        original_values[var] = os.environ.get(var)
        monkeypatch.delenv(var, raising=False)

    yield

    # Restore original values after test
    for var, value in original_values.items():
        if value is not None:
            monkeypatch.setenv(var, value)

@pytest.fixture
def mock_query_processor(sample_processed_query):
    """Create a mock QueryProcessorProgram."""
    processor = Mock(spec=QueryProcessorProgram)
    processor.forward = Mock(return_value=sample_processed_query)
    processor.aforward = AsyncMock(return_value=sample_processed_query)
    processor.get_lm_usage = Mock(return_value={})
    return processor


@pytest.fixture
def mock_document_retriever(sample_documents):
    """Create a mock DocumentRetrieverProgram."""
    retriever = Mock(spec=DocumentRetrieverProgram)
    retriever.forward = Mock(return_value=sample_documents)
    retriever.aforward = AsyncMock(return_value=sample_documents)
    retriever.get_lm_usage = Mock(return_value={})
    return retriever


@pytest.fixture
def mock_generation_program():
    """Create a mock GenerationProgram."""
    program = Mock(spec=GenerationProgram)
    answer = "Here's how to write Cairo contracts..."
    program.forward = Mock(return_value=dspy.Prediction(answer=answer))
    program.aforward = AsyncMock(return_value=dspy.Prediction(answer=answer))
    program.get_lm_usage = Mock(return_value={})

    async def mock_streaming(*args, **kwargs):
        yield "Here's how to write "
        yield "Cairo contracts..."

    program.forward_streaming = Mock(return_value=mock_streaming())
    return program


@pytest.fixture
def mock_mcp_generation_program():
    """Create a mock McpGenerationProgram."""
    program = Mock(spec=McpGenerationProgram)
    mcp_answer = """
## 1. Cairo Contracts

**Source:** Cairo Book
**URL:** https://book.cairo-lang.org/contracts

Cairo contracts are defined using #[starknet::contract].

---

## 2. Storage Variables

**Source:** Starknet Documentation
**URL:** https://docs.starknet.io/storage

Storage variables use #[storage] attribute.
"""
    program.aforward = AsyncMock(return_value=dspy.Prediction(answer=mcp_answer))
    program.get_lm_usage = Mock(return_value={})
    return program


@pytest.fixture
def mock_retrieval_judge():
    """Create a mock RetrievalJudge with default scoring behavior."""
    judge = Mock(spec=RetrievalJudge)

    # Default score map for common test documents
    default_score_map = {
        "Introduction to Cairo": 0.9,
        "Cairo Smart Contracts": 0.9,
        "Cairo Storage": 0.8,
        "What is Starknet": 0.3,
        "Starknet Overview": 0.3,
        "Scarb Overview": 0.2,
        "OpenZeppelin Cairo": 0.2,
        "Python Guide": 0.2,
        "Python Basics": 0.1,
    }

    def filter_docs(query: str, documents: list[Document]) -> list[Document]:
        """Filter documents based on scores."""
        filtered = []
        for doc in documents:
            title = doc.metadata.get("title", "")
            score = default_score_map.get(title, 0.5)

            # Add judge metadata
            doc.metadata["llm_judge_score"] = score
            doc.metadata["llm_judge_reason"] = f"Document '{title}' scored {score} for relevance"

            # Filter based on threshold (default 0.4)
            if score >= judge.threshold:
                filtered.append(doc)

        return filtered

    async def async_filter_docs(query: str, documents: list[Document]) -> list[Document]:
        """Async version of filter_docs."""
        return filter_docs(query, documents)

    judge.forward = Mock(side_effect=filter_docs)
    judge.aforward = AsyncMock(side_effect=async_filter_docs)
    judge.threshold = 0.4
    judge.get_lm_usage = Mock(return_value={})

    return judge
