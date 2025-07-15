"""
Shared test fixtures and utilities for Cairo Coder tests.

This module provides common fixtures and utilities used across multiple test files
to reduce code duplication and ensure consistency.
"""

import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch
from typing import List, Dict, Any, Optional, AsyncGenerator
from pathlib import Path
import json

from cairo_coder.core.types import (
    Document, DocumentSource, Message, ProcessedQuery, StreamEvent
)
from cairo_coder.core.config import AgentConfiguration, Config, VectorStoreConfig
from cairo_coder.core.vector_store import VectorStore
from cairo_coder.config.manager import ConfigManager
from cairo_coder.core.agent_factory import AgentFactory
from cairo_coder.core.rag_pipeline import RagPipeline


# =============================================================================
# Common Mock Fixtures
# =============================================================================

@pytest.fixture
def mock_vector_store():
    """
    Create a mock vector store with commonly used methods.

    This fixture provides an enhanced mock with pre-configured methods
    that are commonly used across tests.
    """
    mock_store = Mock(spec=VectorStore)
    mock_store.similarity_search = AsyncMock(return_value=[])
    mock_store.add_documents = AsyncMock()
    mock_store.delete_by_source = AsyncMock()
    mock_store.count_by_source = AsyncMock(return_value=0)
    mock_store.close = AsyncMock()
    mock_store.get_pool_status = AsyncMock(return_value={"status": "healthy"})
    mock_config = Mock(spec=VectorStoreConfig)
    mock_config.dsn = "postgresql://test_user:test_pass@localhost:5432/test_db"
    mock_config.table_name = "test_table"
    mock_store.config = mock_config
    return mock_store


@pytest.fixture
def mock_config_manager():
    """
    Create a mock configuration manager with standard configuration.

    Returns a mock ConfigManager with commonly used configuration values.
    """
    manager = Mock(spec=ConfigManager)
    manager.load_config.return_value = Config(
        llm={
            "openai": {"api_key": "test-key"},
            "default_provider": "openai"
        },
        vector_store=VectorStoreConfig(
            host="localhost",
            port=5432,
            database="test_db",
            user="test_user",
            password="test_pass",
            table_name="test_table"
        )
    )
    manager.get_agent_config.return_value = AgentConfiguration(
        id="test_agent",
        name="Test Agent",
        description="Test agent for testing",
        sources=[DocumentSource.CAIRO_BOOK],
        max_source_count=5,
        similarity_threshold=0.5
    )
    manager.dsn = "postgresql://test_user:test_pass@localhost:5432/test_db"
    return manager


@pytest.fixture
def mock_lm():
    """
    Create a mock language model for DSPy programs.

    This fixture provides a mock LM that can be used with DSPy programs
    for testing without making actual API calls.
    """
    mock_lm = Mock()
    mock_lm.generate = Mock(return_value=["Generated response"])
    mock_lm.__call__ = Mock(return_value=["Generated response"])
    return mock_lm


@pytest.fixture
def mock_agent_factory():
    """
    Create a mock agent factory with standard agent configurations.

    Returns a mock AgentFactory with common agent configurations.
    """
    factory = Mock(spec=AgentFactory)
    factory.get_available_agents.return_value = [
        "default", "scarb_assistant", "starknet_assistant", "openzeppelin_assistant"
    ]
    factory.get_agent_info.return_value = {
        "id": "default",
        "name": "Cairo Coder",
        "description": "General Cairo programming assistant",
        "sources": ["cairo_book", "cairo_docs"],
        "max_source_count": 10,
        "similarity_threshold": 0.4
    }
    factory.create_agent = Mock()
    factory.get_or_create_agent = AsyncMock()
    factory.clear_cache = Mock()
    return factory


@pytest.fixture
def mock_agent():
    """
    Create a mock agent (RAG pipeline) with standard forward method.

    Returns a mock agent that yields common StreamEvent objects.
    """
    agent = Mock(spec=RagPipeline)

    async def mock_forward(query: str, chat_history: Optional[List[Message]] = None,
                          mcp_mode: bool = False, **kwargs) -> AsyncGenerator[StreamEvent, None]:
        """Mock forward method that yields standard stream events."""
        events = [
            StreamEvent(type="processing", data="Processing query..."),
            StreamEvent(type="sources", data=[{"title": "Test Doc", "url": "#"}]),
            StreamEvent(type="response", data="Test response from mock agent"),
            StreamEvent(type="end", data=None)
        ]
        for event in events:
            yield event

    agent.forward = mock_forward
    return agent


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


# =============================================================================
# Sample Data Fixtures
# =============================================================================

@pytest.fixture
def sample_documents():
    """
    Create a collection of sample documents for testing.

    Returns a list of Document objects with various sources and metadata.
    """
    return [
        Document(
            page_content="Cairo is a programming language for writing provable programs.",
            metadata={
                'source': 'cairo_book',
                'score': 0.9,
                'title': 'Introduction to Cairo',
                'url': 'https://book.cairo-lang.org/ch01-00-getting-started.html',
                'source_display': 'Cairo Book'
            }
        ),
        Document(
            page_content="Starknet is a validity rollup (also known as a ZK rollup).",
            metadata={
                'source': 'starknet_docs',
                'score': 0.8,
                'title': 'What is Starknet',
                'url': 'https://docs.starknet.io/documentation/architecture_and_concepts/Network_Architecture/overview/',
                'source_display': 'Starknet Docs'
            }
        ),
        Document(
            page_content="Scarb is the Cairo package manager and build tool.",
            metadata={
                'source': 'scarb_docs',
                'score': 0.7,
                'title': 'Scarb Overview',
                'url': 'https://docs.swmansion.com/scarb/',
                'source_display': 'Scarb Docs'
            }
        ),
        Document(
            page_content="OpenZeppelin provides secure smart contract libraries for Cairo.",
            metadata={
                'source': 'openzeppelin_docs',
                'score': 0.6,
                'title': 'OpenZeppelin Cairo',
                'url': 'https://docs.openzeppelin.com/contracts-cairo/',
                'source_display': 'OpenZeppelin Docs'
            }
        )
    ]


@pytest.fixture
def sample_processed_query():
    """
    Create a sample processed query for testing.

    Returns a ProcessedQuery object with standard test data.
    """
    return ProcessedQuery(
        original="How do I create a Cairo contract?",
        transformed=["cairo contract", "smart contract creation", "cairo programming"],
        is_contract_related=True,
        is_test_related=False,
        resources=[DocumentSource.CAIRO_BOOK, DocumentSource.STARKNET_DOCS]
    )


@pytest.fixture
def sample_messages():
    """
    Create sample chat messages for testing.

    Returns a list of Message objects representing a conversation.
    """
    return [
        Message(role="system", content="You are a helpful Cairo programming assistant."),
        Message(role="user", content="How do I create a smart contract in Cairo?"),
        Message(role="assistant", content="To create a smart contract in Cairo, you need to..."),
        Message(role="user", content="Can you show me an example?")
    ]


@pytest.fixture
def sample_agent_configs():
    """
    Create sample agent configurations for testing.

    Returns a dictionary of AgentConfiguration objects.
    """
    return {
        "default": AgentConfiguration(
            id="default",
            name="Cairo Coder",
            description="General Cairo programming assistant",
            sources=[DocumentSource.CAIRO_BOOK, DocumentSource.STARKNET_DOCS],
            max_source_count=10,
            similarity_threshold=0.4
        ),
        "test_agent": AgentConfiguration(
            id="test_agent",
            name="Test Agent",
            description="Test agent for testing",
            sources=[DocumentSource.CAIRO_BOOK],
            max_source_count=5,
            similarity_threshold=0.5
        ),
        "scarb_agent": AgentConfiguration(
            id="scarb_agent",
            name="Scarb Agent",
            description="Scarb build tool and package manager agent",
            sources=[DocumentSource.SCARB_DOCS],
            max_source_count=5,
            similarity_threshold=0.5
        ),
        "scarb_assistant": AgentConfiguration(
            id="scarb_assistant",
            name="Scarb Assistant",
            description="Scarb build tool and package manager assistant",
            sources=[DocumentSource.SCARB_DOCS],
            max_source_count=5,
            similarity_threshold=0.5
        ),
        "starknet_assistant": AgentConfiguration(
            id="starknet_assistant",
            name="Starknet Assistant",
            description="Starknet-specific development assistant",
            sources=[DocumentSource.STARKNET_DOCS, DocumentSource.STARKNET_FOUNDRY],
            max_source_count=8,
            similarity_threshold=0.45
        ),
        "openzeppelin_assistant": AgentConfiguration(
            id="openzeppelin_assistant",
            name="OpenZeppelin Assistant",
            description="OpenZeppelin Cairo contracts assistant",
            sources=[DocumentSource.OPENZEPPELIN_DOCS],
            max_source_count=6,
            similarity_threshold=0.5
        )
    }


@pytest.fixture
def sample_config():
    """
    Create a sample configuration object for testing.

    Returns a Config object with standard test values.
    """
    return Config(
        providers={
            "openai": {"api_key": "test-openai-key", "model": "gpt-4"},
            "anthropic": {"api_key": "test-anthropic-key", "model": "claude-3-sonnet"},
            "google": {"api_key": "test-google-key", "model": "gemini-1.5-pro"},
            "default_provider": "openai"
        },
        vector_db=VectorStoreConfig(
            host="localhost",
            port=5432,
            database="cairo_coder_test",
            user="test_user",
            password="test_password"
        ),
        agents={
            "default": {
                "sources": ["cairo_book", "starknet_docs"],
                "max_source_count": 10,
                "similarity_threshold": 0.4
            }
        },
        logging={
            "level": "INFO",
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        }
    )


@pytest.fixture
def sample_embeddings():
    """
    Create sample embeddings for testing.

    Returns a list of float vectors representing document embeddings.
    """
    return [
        [0.1, 0.2, 0.3, 0.4, 0.5],  # Cairo document embedding
        [0.2, 0.3, 0.4, 0.5, 0.6],  # Starknet document embedding
        [0.3, 0.4, 0.5, 0.6, 0.7],  # Scarb document embedding
        [0.4, 0.5, 0.6, 0.7, 0.8],  # OpenZeppelin document embedding
    ]


# =============================================================================
# Test Configuration Fixtures
# =============================================================================

@pytest.fixture
def temp_config_file(tmp_path):
    """
    Create a temporary configuration file for testing.

    Returns the path to a temporary TOML configuration file.
    """
    config_content = """
[providers.openai]
api_key = "test-openai-key"
model = "gpt-4"

[providers.anthropic]
api_key = "test-anthropic-key"
model = "claude-3-sonnet"

[providers]
default_provider = "openai"

[vector_db]
host = "localhost"
port = 5432
database = "cairo_coder_test"
user = "test_user"
password = "test_password"

[agents.default]
sources = ["cairo_book", "starknet_docs"]
max_source_count = 10
similarity_threshold = 0.4

[logging]
level = "INFO"
format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
"""

    config_file = tmp_path / "test_config.toml"
    config_file.write_text(config_content)
    return config_file


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
        "POSTGRES_PASSWORD": "test_password"
    }

    for key, value in test_vars.items():
        monkeypatch.setenv(key, value)

    return test_vars


# =============================================================================
# Utility Functions
# =============================================================================

def create_test_document(content: str, source: str = "cairo_book",
                        score: float = 0.8, **metadata) -> Document:
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
        'source': source,
        'score': score,
        'title': f'Test Document from {source}',
        'url': f'https://example.com/{source}',
        'source_display': source.replace('_', ' ').title()
    }
    base_metadata.update(metadata)

    return Document(page_content=content, metadata=base_metadata)


def create_test_message(role: str, content: str) -> Message:
    """
    Create a test message with the specified role and content.

    Args:
        role: Message role (system, user, assistant)
        content: Message content

    Returns:
        Message object
    """
    return Message(role=role, content=content)


def create_test_processed_query(original: str, transformed: List[str] = None,
                               is_contract_related: bool = False,
                               is_test_related: bool = False,
                               resources: List[DocumentSource] = None) -> ProcessedQuery:
    """
    Create a test processed query with specified parameters.

    Args:
        original: Original query string
        transformed: List of transformed search terms
        is_contract_related: Whether query is contract-related
        is_test_related: Whether query is test-related
        resources: List of document sources

    Returns:
        ProcessedQuery object
    """
    if transformed is None:
        transformed = [original.lower()]
    if resources is None:
        resources = [DocumentSource.CAIRO_BOOK]

    return ProcessedQuery(
        original=original,
        transformed=transformed,
        is_contract_related=is_contract_related,
        is_test_related=is_test_related,
        resources=resources
    )


async def create_test_stream_events(response_text: str = "Test response") -> AsyncGenerator[StreamEvent, None]:
    """
    Create a test stream of events for testing streaming functionality.

    Args:
        response_text: The response text to stream

    Yields:
        StreamEvent objects
    """
    events = [
        StreamEvent(type="processing", data="Processing query..."),
        StreamEvent(type="sources", data=[{"title": "Test Doc", "url": "#"}]),
        StreamEvent(type="response", data=response_text),
        StreamEvent(type="end", data=None)
    ]

    for event in events:
        yield event


# =============================================================================
# Parametrized Fixtures
# =============================================================================

@pytest.fixture(params=[
    DocumentSource.CAIRO_BOOK,
    DocumentSource.STARKNET_DOCS,
    DocumentSource.SCARB_DOCS,
    DocumentSource.OPENZEPPELIN_DOCS,
    DocumentSource.CAIRO_BY_EXAMPLE
])
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
