"""
Unit tests for DocumentRetrieverProgram.

Tests the DSPy-based document retrieval functionality including vector search,
reranking, and metadata enhancement.
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch
import numpy as np

from cairo_coder.core.types import Document, DocumentSource, ProcessedQuery
from cairo_coder.core.vector_store import VectorStore
from cairo_coder.dspy.document_retriever import DocumentRetrieverProgram, create_document_retriever


class TestDocumentRetrieverProgram:
    """Test suite for DocumentRetrieverProgram."""

    @pytest.fixture
    def mock_embedding_client(self):
        """Create a mock OpenAI embedding client."""
        mock_client = Mock()
        mock_response = Mock()
        mock_response.data = [Mock(embedding=[0.1, 0.2, 0.3, 0.4, 0.5])]
        mock_client.embeddings.create = AsyncMock(return_value=mock_response)
        return mock_client

    @pytest.fixture
    def enhanced_sample_documents(self):
        """Create enhanced sample documents for testing with additional metadata."""
        return [
            Document(
                page_content="Cairo is a programming language for writing provable programs.",
                metadata={'source': 'cairo_book', 'score': 0.9, 'chapter': 1}
            ),
            Document(
                page_content="Starknet is a validity rollup (also known as a ZK rollup).",
                metadata={'source': 'starknet_docs', 'score': 0.8, 'section': 'overview'}
            ),
            Document(
                page_content="OpenZeppelin provides secure smart contract libraries for Cairo.",
                metadata={'source': 'openzeppelin_docs', 'score': 0.7}
            )
        ]

    @pytest.fixture
    def sample_processed_query(self):
        """Create a sample processed query."""
        return ProcessedQuery(
            original="How do I create a Cairo contract?",
            transformed=["cairo", "contract", "create"],
            is_contract_related=True,
            is_test_related=False,
            resources=[DocumentSource.CAIRO_BOOK, DocumentSource.STARKNET_DOCS]
        )

    @pytest.fixture
    def retriever(self, mock_vector_store):
        """Create a DocumentRetrieverProgram instance."""
        return DocumentRetrieverProgram(
            vector_store=mock_vector_store,
            max_source_count=5,
            similarity_threshold=0.4
        )

    @pytest.mark.asyncio
    async def test_basic_document_retrieval(self, retriever, mock_vector_store,
                                          sample_documents, sample_processed_query):
        """Test basic document retrieval without reranking."""
        # Setup mock vector store
        mock_vector_store.similarity_search.return_value = sample_documents

        # Execute retrieval
        result = await retriever.forward(sample_processed_query)

        # Verify results
        assert len(result) == 4
        assert all(isinstance(doc, Document) for doc in result)

        # Verify vector store was called correctly
        mock_vector_store.similarity_search.assert_called_once_with(
            query=sample_processed_query.original,
            k=10,  # max_source_count * 2
            sources=sample_processed_query.resources
        )

        # Verify metadata enhancement
        for doc in result:
            assert 'title' in doc.metadata
            assert 'url' in doc.metadata
            assert 'source_display' in doc.metadata

    @pytest.mark.asyncio
    async def test_retrieval_with_reranking(self, mock_vector_store, mock_embedding_client,
                                          sample_documents, sample_processed_query):
        """Test document retrieval with embedding-based reranking."""
        # Setup mock vector store and embedding client - use only first 3 documents for this test
        test_documents = sample_documents[:3]
        mock_vector_store.similarity_search.return_value = test_documents
        mock_vector_store.embedding_client = mock_embedding_client

        # Create retriever with embedding client
        retriever = DocumentRetrieverProgram(
            vector_store=mock_vector_store,
            max_source_count=5,
            similarity_threshold=0.4
        )

        # Mock embedding responses with realistic vectors
        query_response = Mock()
        query_response.data = [Mock(embedding=[1.0, 0.0, 0.0, 0.0, 0.0])]

        doc_response = Mock()
        doc_response.data = [
            Mock(embedding=[0.8, 0.0, 0.0, 0.0, 0.0]),  # Similarity: 0.8
            Mock(embedding=[0.0, 1.0, 0.0, 0.0, 0.0]),  # Similarity: 0.0
            Mock(embedding=[0.6, 0.0, 0.0, 0.0, 0.0])   # Similarity: 0.6
        ]

        mock_embedding_client.embeddings.create.side_effect = [query_response, doc_response]

        # Execute retrieval
        result = await retriever.forward(sample_processed_query)

        # Verify results are reranked by similarity (only docs above threshold 0.4)
        assert len(result) == 2  # First and third documents
        assert result[0].page_content == "Cairo is a programming language for writing provable programs."
        assert result[1].page_content == "Scarb is the Cairo package manager and build tool."

        # Verify embedding calls
        assert mock_embedding_client.embeddings.create.call_count == 2

    @pytest.mark.asyncio
    async def test_retrieval_with_custom_sources(self, retriever, mock_vector_store,
                                                sample_documents, sample_processed_query):
        """Test retrieval with custom source filtering."""
        mock_vector_store.similarity_search.return_value = sample_documents

        # Override sources
        custom_sources = [DocumentSource.SCARB_DOCS, DocumentSource.OPENZEPPELIN_DOCS]

        result = await retriever.forward(sample_processed_query, sources=custom_sources)

        # Verify vector store called with custom sources
        mock_vector_store.similarity_search.assert_called_once_with(
            query=sample_processed_query.original,
            k=10,
            sources=custom_sources
        )

    @pytest.mark.asyncio
    async def test_empty_document_handling(self, retriever, mock_vector_store, sample_processed_query):
        """Test handling of empty document results."""
        mock_vector_store.similarity_search.return_value = []

        result = await retriever.forward(sample_processed_query)

        assert result == []

    @pytest.mark.asyncio
    async def test_vector_store_error_handling(self, retriever, mock_vector_store, sample_processed_query):
        """Test handling of vector store errors."""
        mock_vector_store.similarity_search.side_effect = Exception("Database error")

        # Should handle error gracefully
        result = await retriever.forward(sample_processed_query)

        assert result == []

    @pytest.mark.asyncio
    async def test_embedding_error_handling(self, mock_vector_store, mock_embedding_client,
                                          sample_documents, sample_processed_query):
        """Test handling of embedding errors during reranking."""
        mock_vector_store.similarity_search.return_value = sample_documents
        mock_vector_store.embedding_client = mock_embedding_client

        # Mock embedding error
        mock_embedding_client.embeddings.create.side_effect = Exception("API error")

        retriever = DocumentRetrieverProgram(
            vector_store=mock_vector_store,
            max_source_count=5,
            similarity_threshold=0.4
        )

        # Should fall back to original documents with metadata attached
        result = await retriever.forward(sample_processed_query)

        assert len(result) == len(sample_documents)
        assert all(isinstance(doc, Document) for doc in result)
        # Verify metadata was attached despite embedding error
        for doc in result:
            assert 'title' in doc.metadata
            assert 'url' in doc.metadata
            assert 'source_display' in doc.metadata

    def test_cosine_similarity_calculation(self, retriever):
        """Test cosine similarity calculation."""
        vec1 = [1.0, 0.0, 0.0]
        vec2 = [0.0, 1.0, 0.0]
        vec3 = [1.0, 0.0, 0.0]

        # Orthogonal vectors
        assert retriever._cosine_similarity(vec1, vec2) == pytest.approx(0.0, abs=1e-6)

        # Identical vectors
        assert retriever._cosine_similarity(vec1, vec3) == pytest.approx(1.0, abs=1e-6)

        # Empty vectors
        assert retriever._cosine_similarity([], []) == 0.0
        assert retriever._cosine_similarity(vec1, []) == 0.0

    @pytest.mark.asyncio
    async def test_max_source_count_limiting(self, retriever, mock_vector_store, sample_processed_query):
        """Test limiting results by max_source_count."""
        # Create more documents than max_source_count
        many_documents = [
            Document(
                page_content=f"Document {i}",
                metadata={'source': 'cairo_book', 'score': 0.9 - i * 0.1}
            )
            for i in range(10)
        ]

        mock_vector_store.similarity_search.return_value = many_documents

        result = await retriever.forward(sample_processed_query)

        # Should be limited to max_source_count (5)
        assert len(result) == 5

    @pytest.mark.asyncio
    async def test_batch_embedding_processing(self, mock_vector_store, mock_embedding_client,
                                            sample_processed_query):
        """Test batch processing of embeddings."""
        # Create many documents to test batching
        many_documents = [
            Document(
                page_content=f"Document {i} content",
                metadata={'source': 'cairo_book'}
            )
            for i in range(150)  # More than batch size (100)
        ]

        mock_vector_store.similarity_search.return_value = many_documents
        mock_vector_store.embedding_client = mock_embedding_client

        retriever = DocumentRetrieverProgram(
            vector_store=mock_vector_store,
            max_source_count=200,
            similarity_threshold=0.0
        )

        # Mock embedding responses
        query_response = Mock()
        query_response.data = [Mock(embedding=[0.1, 0.2, 0.3, 0.4, 0.5])]

        # Mock batch responses
        batch1_response = Mock()
        batch1_response.data = [Mock(embedding=[0.1, 0.2, 0.3, 0.4, 0.5])] * 100

        batch2_response = Mock()
        batch2_response.data = [Mock(embedding=[0.1, 0.2, 0.3, 0.4, 0.5])] * 50

        mock_embedding_client.embeddings.create.side_effect = [
            query_response, batch1_response, batch2_response
        ]

        result = await retriever.forward(sample_processed_query)

        # Should process all documents in batches
        assert len(result) == 150
        assert mock_embedding_client.embeddings.create.call_count == 3  # Query + 2 batches


class TestDocumentRetrieverFactory:
    """Test the document retriever factory function."""

    def test_create_document_retriever(self):
        """Test the factory function creates correct instance."""
        mock_vector_store = Mock(spec=VectorStore)

        retriever = create_document_retriever(
            vector_store=mock_vector_store,
            max_source_count=20,
            similarity_threshold=0.6
        )

        assert isinstance(retriever, DocumentRetrieverProgram)
        assert retriever.vector_store == mock_vector_store
        assert retriever.max_source_count == 20
        assert retriever.similarity_threshold == 0.6

    def test_create_document_retriever_defaults(self):
        """Test factory function with default parameters."""
        mock_vector_store = Mock(spec=VectorStore)

        retriever = create_document_retriever(vector_store=mock_vector_store)

        assert isinstance(retriever, DocumentRetrieverProgram)
        assert retriever.max_source_count == 10
        assert retriever.similarity_threshold == 0.4
