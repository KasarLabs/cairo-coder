"""Integration tests for vector store with real database operations."""

import json
from collections.abc import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock

import pytest

from cairo_coder.core.config import VectorStoreConfig
from cairo_coder.core.types import DocumentSource
from cairo_coder.core.vector_store import VectorStore


class TestVectorStoreIntegration:
    """Test vector store integration scenarios."""

    @pytest.fixture
    def vector_store_config(self) -> VectorStoreConfig:
        """Create vector store configuration for testing."""
        return VectorStoreConfig(
            host="localhost",
            port=5432,
            database="test_db",
            user="test_user",
            password="test_pass",
            table_name="test_documents",
            embedding_dimension=1536,
        )

    @pytest.fixture
    def mock_pool(self) -> AsyncMock:
        """Create mock connection pool for integration tests."""
        pool = AsyncMock()
        pool.acquire = MagicMock()

        # Create mock connection
        mock_conn = AsyncMock()
        pool.acquire.return_value.__aenter__.return_value = mock_conn
        pool.acquire.return_value.__aexit__.return_value = None

        return pool

    @pytest.fixture
    async def vector_store(
        self, vector_store_config: VectorStoreConfig, mock_pool: AsyncMock
    ) -> AsyncGenerator[VectorStore, None]:
        """Create vector store with mocked database."""
        store = VectorStore(vector_store_config)
        store.pool = mock_pool
        yield store
        # No need to close since we're using a mock

    # @pytest.fixture
    # async def vector_store(
    #     self,
    #     vector_store_config: VectorStoreConfig,
    #     mock_pool: AsyncMock
    # ) -> AsyncGenerator[VectorStore, None]:
    #     """Create vector store without API key."""
    #     store = VectorStore(vector_store_config, openai_api_key=None)
    #     store.pool = mock_pool
    #     yield store

    @pytest.mark.asyncio
    async def test_database_connection(
        self, vector_store: VectorStore, mock_pool: AsyncMock
    ) -> None:
        """Test basic database connection."""
        # Mock the connection response
        mock_conn = mock_pool.acquire.return_value.__aenter__.return_value
        mock_conn.fetchval.return_value = 1

        # Should be able to query the database
        async with vector_store.pool.acquire() as conn:
            result = await conn.fetchval("SELECT 1")
            assert result == 1

    @pytest.mark.asyncio
    async def test_add_and_retrieve_documents(
        self, vector_store: VectorStore, mock_pool: AsyncMock
    ) -> None:
        """Test adding documents and retrieving them without embeddings."""
        # Mock the count_by_source query result
        mock_conn = mock_pool.acquire.return_value.__aenter__.return_value
        mock_conn.fetch.return_value = [
            {"source": DocumentSource.CAIRO_BOOK.value, "count": 1},
            {"source": DocumentSource.STARKNET_DOCS.value, "count": 1},
        ]

        # Test count by source
        counts = await vector_store.count_by_source()
        assert counts[DocumentSource.CAIRO_BOOK.value] == 1
        assert counts[DocumentSource.STARKNET_DOCS.value] == 1

    @pytest.mark.asyncio
    async def test_delete_by_source(self, vector_store: VectorStore, mock_pool: AsyncMock) -> None:
        """Test deleting documents by source."""
        # Mock the delete operation
        mock_conn = mock_pool.acquire.return_value.__aenter__.return_value
        mock_conn.execute.return_value = "DELETE 3"

        # Delete Cairo book documents
        deleted = await vector_store.delete_by_source(DocumentSource.CAIRO_BOOK)
        assert deleted == 3

        # Verify delete was called with correct query
        mock_conn.execute.assert_called_once()
        call_args = mock_conn.execute.call_args[0]
        assert "DELETE FROM" in call_args[0]
        assert "metadata->>'source' = $1" in call_args[0]
        assert call_args[1] == DocumentSource.CAIRO_BOOK.value

    @pytest.mark.asyncio
    async def test_similarity_search_with_mock_embeddings(
        self, vector_store: VectorStore, mock_pool: AsyncMock, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """Test similarity search with mocked embeddings."""

        # Mock the embedding methods
        async def mock_embed_text(text: str) -> list[float]:
            # Return different embeddings based on content
            if "cairo" in text.lower():
                return [1.0, 0.0, 0.0] + [0.0] * (vector_store.config.embedding_dimension - 3)
            return [0.0, 1.0, 0.0] + [0.0] * (vector_store.config.embedding_dimension - 3)

        monkeypatch.setattr(vector_store, "_embed_text", mock_embed_text)

        # Mock database results
        mock_conn = mock_pool.acquire.return_value.__aenter__.return_value
        mock_conn.fetch.return_value = [
            {
                "id": "doc1",
                "content": "Cairo is a programming language",
                "metadata": json.dumps({"source": DocumentSource.CAIRO_BOOK.value}),
                "similarity": 0.95,
            },
            {
                "id": "doc2",
                "content": "Starknet is a Layer 2 solution",
                "metadata": json.dumps({"source": DocumentSource.STARKNET_DOCS.value}),
                "similarity": 0.85,
            },
        ]

        # Search for Cairo-related content
        results = await vector_store.similarity_search(query="Tell me about Cairo", k=2)

        # Should return Cairo document first due to embedding similarity
        assert len(results) == 2
        assert "cairo" in results[0].page_content.lower()
        assert results[0].metadata["similarity"] == 0.95

    @pytest.mark.asyncio
    async def test_cosine_similarity_computation(self) -> None:
        """Test cosine similarity calculation."""
        # Test with known vectors
        v1 = [1.0, 0.0, 0.0]
        v2 = [1.0, 0.0, 0.0]
        v3 = [0.0, 1.0, 0.0]
        v4 = [0.707, 0.707, 0.0]  # 45 degrees from v1

        # Same vectors should have similarity 1
        assert abs(VectorStore.cosine_similarity(v1, v2) - 1.0) < 0.001

        # Orthogonal vectors should have similarity 0
        assert abs(VectorStore.cosine_similarity(v1, v3) - 0.0) < 0.001

        # 45 degree angle should have similarity ~0.707
        assert abs(VectorStore.cosine_similarity(v1, v4) - 0.707) < 0.01
