"""Tests for PostgreSQL vector store integration."""

import json
from typing import Any, Dict, List
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from cairo_coder.core.config import VectorStoreConfig
from cairo_coder.core.types import Document, DocumentSource
from cairo_coder.core.vector_store import VectorStore


class TestVectorStore:
    """Test vector store functionality."""

    @pytest.fixture
    def config(self) -> VectorStoreConfig:
        """Create test configuration."""
        return VectorStoreConfig(
            host="localhost",
            port=5432,
            database="test_db",
            user="test_user",
            password="test_pass",
            table_name="test_documents",
            similarity_measure="cosine"
        )

    @pytest.fixture
    def vector_store(self, config: VectorStoreConfig) -> VectorStore:
        """Create vector store instance."""
        # Don't provide API key for unit tests
        return VectorStore(config, openai_api_key=None)

    @pytest.fixture
    def mock_pool(self) -> AsyncMock:
        """Create mock connection pool."""
        pool = AsyncMock()
        pool.acquire = MagicMock()
        pool.acquire.return_value.__aenter__ = AsyncMock()
        pool.acquire.return_value.__aexit__ = AsyncMock()
        return pool

    @pytest.fixture
    def mock_embedding_response(self) -> Dict[str, Any]:
        """Create mock embedding response."""
        return {
            "data": [
                {"embedding": [0.1, 0.2, 0.3, 0.4, 0.5]}
            ]
        }

    @pytest.mark.asyncio
    async def test_initialize(self, vector_store: VectorStore) -> None:
        """Test vector store initialization."""
        with patch("cairo_coder.core.vector_store.asyncpg.create_pool") as mock_create_pool:
            mock_pool = MagicMock()

            # Make create_pool return a coroutine
            async def async_return(*args, **kwargs):
                return mock_pool

            mock_create_pool.side_effect = async_return

            await vector_store.initialize()

            assert vector_store.pool is mock_pool
            mock_create_pool.assert_called_once_with(
                dsn=vector_store.config.dsn,
                min_size=2,
                max_size=10,
                command_timeout=60
            )

    @pytest.mark.asyncio
    async def test_close(self, vector_store: VectorStore, mock_pool: AsyncMock) -> None:
        """Test closing vector store."""
        vector_store.pool = mock_pool

        await vector_store.close()

        mock_pool.close.assert_called_once()
        assert vector_store.pool is None

    @pytest.mark.asyncio
    async def test_similarity_search(
        self,
        vector_store: VectorStore,
        mock_pool: AsyncMock
    ) -> None:
        """Test similarity search functionality."""
        # Mock embedding generation
        with patch.object(vector_store, "_embed_text") as mock_embed:
            mock_embed.return_value = [0.1, 0.2, 0.3, 0.4, 0.5]

            # Mock database results
            mock_conn = AsyncMock()
            mock_pool.acquire.return_value.__aenter__.return_value = mock_conn

            mock_rows = [
                {
                    "id": "doc1",
                    "content": "Cairo programming guide",
                    "metadata": json.dumps({"source": "cairo_book", "title": "Guide"}),
                    "similarity": 0.95
                },
                {
                    "id": "doc2",
                    "content": "Starknet documentation",
                    "metadata": json.dumps({"source": "starknet_docs", "title": "Docs"}),
                    "similarity": 0.85
                }
            ]
            mock_conn.fetch.return_value = mock_rows

            vector_store.pool = mock_pool

            # Perform search
            results = await vector_store.similarity_search(
                query="How to write Cairo contracts?",
                k=5
            )

            # Verify results
            assert len(results) == 2
            assert results[0].page_content == "Cairo programming guide"
            assert results[0].metadata["source"] == "cairo_book"
            assert results[0].metadata["similarity"] == 0.95
            assert results[1].page_content == "Starknet documentation"
            assert results[1].metadata["source"] == "starknet_docs"

            # Verify query construction
            mock_embed.assert_called_once_with("How to write Cairo contracts?")
            mock_conn.fetch.assert_called_once()
            call_args = mock_conn.fetch.call_args[0]
            assert "SELECT" in call_args[0]
            assert "embedding <=> $1::vector" in call_args[0]  # Cosine similarity
            assert call_args[2] == 5  # k parameter

    @pytest.mark.asyncio
    async def test_similarity_search_with_sources(
        self,
        vector_store: VectorStore,
        mock_pool: AsyncMock
    ) -> None:
        """Test similarity search with source filtering."""
        with patch.object(vector_store, "_embed_text") as mock_embed:
            mock_embed.return_value = [0.1, 0.2, 0.3, 0.4, 0.5]

            mock_conn = AsyncMock()
            mock_pool.acquire.return_value.__aenter__.return_value = mock_conn
            mock_conn.fetch.return_value = []

            vector_store.pool = mock_pool

            # Search with single source
            await vector_store.similarity_search(
                query="test",
                k=5,
                sources=DocumentSource.CAIRO_BOOK
            )

            # Verify source filtering in query
            call_args = mock_conn.fetch.call_args[0]
            assert "WHERE metadata->>'source' = ANY($2::text[])" in call_args[0]
            assert call_args[2] == ["cairo_book"]  # Source values
            assert call_args[3] == 5  # k parameter

            # Search with multiple sources
            await vector_store.similarity_search(
                query="test",
                k=3,
                sources=[DocumentSource.CAIRO_BOOK, DocumentSource.STARKNET_DOCS]
            )

            call_args = mock_conn.fetch.call_args[0]
            assert call_args[2] == ["cairo_book", "starknet_docs"]
            assert call_args[3] == 3

    @pytest.mark.asyncio
    async def test_add_documents(
        self,
        vector_store: VectorStore,
        mock_pool: AsyncMock
    ) -> None:
        """Test adding documents to vector store."""
        with patch.object(vector_store, "_embed_texts") as mock_embed:
            mock_embed.return_value = [
                [0.1, 0.2, 0.3],
                [0.4, 0.5, 0.6]
            ]

            mock_conn = AsyncMock()
            mock_pool.acquire.return_value.__aenter__.return_value = mock_conn

            vector_store.pool = mock_pool

            # Add documents without IDs
            documents = [
                Document(
                    page_content="Cairo contract example",
                    metadata={"source": "cairo_book", "chapter": 1}
                ),
                Document(
                    page_content="Starknet deployment guide",
                    metadata={"source": "starknet_docs", "section": "deployment"}
                )
            ]

            await vector_store.add_documents(documents)

            # Verify embedding generation
            mock_embed.assert_called_once_with([
                "Cairo contract example",
                "Starknet deployment guide"
            ])

            # Verify database insertion
            mock_conn.executemany.assert_called_once()
            call_args = mock_conn.executemany.call_args[0]
            assert "INSERT INTO test_documents" in call_args[0]
            assert "content, embedding, metadata" in call_args[0]

            # Check inserted data
            rows = call_args[1]
            assert len(rows) == 2
            assert rows[0][0] == "Cairo contract example"
            assert rows[0][1] == [0.1, 0.2, 0.3]
            assert json.loads(rows[0][2])["source"] == "cairo_book"

    @pytest.mark.asyncio
    async def test_add_documents_with_ids(
        self,
        vector_store: VectorStore,
        mock_pool: AsyncMock
    ) -> None:
        """Test adding documents with specific IDs."""
        with patch.object(vector_store, "_embed_texts") as mock_embed:
            mock_embed.return_value = [[0.1, 0.2, 0.3]]

            mock_conn = AsyncMock()
            mock_pool.acquire.return_value.__aenter__.return_value = mock_conn

            vector_store.pool = mock_pool

            documents = [
                Document(
                    page_content="Test document",
                    metadata={"source": "test"}
                )
            ]
            ids = ["custom-id-123"]

            await vector_store.add_documents(documents, ids)

            # Verify upsert query
            call_args = mock_conn.executemany.call_args[0]
            assert "ON CONFLICT (id) DO UPDATE" in call_args[0]

            rows = call_args[1]
            assert rows[0][0] == "custom-id-123"  # Custom ID

    @pytest.mark.asyncio
    async def test_delete_by_source(
        self,
        vector_store: VectorStore,
        mock_pool: AsyncMock
    ) -> None:
        """Test deleting documents by source."""
        mock_conn = AsyncMock()
        mock_pool.acquire.return_value.__aenter__.return_value = mock_conn
        mock_conn.execute.return_value = "DELETE 42"

        vector_store.pool = mock_pool

        count = await vector_store.delete_by_source(DocumentSource.CAIRO_BOOK)

        assert count == 42
        mock_conn.execute.assert_called_once()
        call_args = mock_conn.execute.call_args[0]
        assert "DELETE FROM test_documents" in call_args[0]
        assert "WHERE metadata->>'source' = $1" in call_args[0]
        assert call_args[1] == "cairo_book"

    @pytest.mark.asyncio
    async def test_count_by_source(
        self,
        vector_store: VectorStore,
        mock_pool: AsyncMock
    ) -> None:
        """Test counting documents by source."""
        mock_conn = AsyncMock()
        mock_pool.acquire.return_value.__aenter__.return_value = mock_conn
        mock_conn.fetch.return_value = [
            {"source": "cairo_book", "count": 150},
            {"source": "starknet_docs", "count": 75},
            {"source": "scarb_docs", "count": 30}
        ]

        vector_store.pool = mock_pool

        counts = await vector_store.count_by_source()

        assert counts == {
            "cairo_book": 150,
            "starknet_docs": 75,
            "scarb_docs": 30
        }

        mock_conn.fetch.assert_called_once()
        call_args = mock_conn.fetch.call_args[0]
        assert "GROUP BY metadata->>'source'" in call_args[0]
        assert "ORDER BY count DESC" in call_args[0]

    def test_cosine_similarity(self) -> None:
        """Test cosine similarity calculation."""
        a = [1.0, 0.0, 0.0]
        b = [0.0, 1.0, 0.0]
        c = [1.0, 0.0, 0.0]

        # Orthogonal vectors
        similarity_ab = VectorStore.cosine_similarity(a, b)
        assert abs(similarity_ab - 0.0) < 0.001

        # Identical vectors
        similarity_ac = VectorStore.cosine_similarity(a, c)
        assert abs(similarity_ac - 1.0) < 0.001

        # Arbitrary vectors
        d = [1.0, 2.0, 3.0]
        e = [4.0, 5.0, 6.0]
        similarity_de = VectorStore.cosine_similarity(d, e)
        assert 0.0 < similarity_de < 1.0
