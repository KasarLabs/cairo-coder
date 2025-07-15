"""
Unit tests for DocumentRetrieverProgram.

Tests the DSPy-based document retrieval functionality using PgVectorRM retriever.
"""

from cairo_coder.core.config import VectorStoreConfig
import pytest
from unittest.mock import Mock, AsyncMock, patch, MagicMock
import numpy as np
import dspy

from cairo_coder.core.types import Document, DocumentSource, ProcessedQuery
from cairo_coder.core.vector_store import VectorStore
from cairo_coder.dspy.document_retriever import DocumentRetrieverProgram, create_document_retriever


class TestDocumentRetrieverProgram:
    """Test suite for DocumentRetrieverProgram."""

    @pytest.fixture
    def enhanced_sample_documents(self):
        """Create enhanced sample documents for testing with additional metadata."""
        return [
            Document(
                page_content="Cairo is a programming language for writing provable programs.",
                metadata={"source": "cairo_book", "score": 0.9, "chapter": 1},
            ),
            Document(
                page_content="Starknet is a validity rollup (also known as a ZK rollup).",
                metadata={"source": "starknet_docs", "score": 0.8, "section": "overview"},
            ),
            Document(
                page_content="OpenZeppelin provides secure smart contract libraries for Cairo.",
                metadata={"source": "openzeppelin_docs", "score": 0.7},
            ),
        ]

    @pytest.fixture
    def sample_processed_query(self):
        """Create a sample processed query."""
        return ProcessedQuery(
            original="How do I create a Cairo contract?",
            search_queries=["cairo", "contract", "create"],
            is_contract_related=True,
            is_test_related=False,
            resources=[DocumentSource.CAIRO_BOOK, DocumentSource.STARKNET_DOCS],
        )

    @pytest.fixture
    def retriever(self, mock_vector_store_config):
        """Create a DocumentRetrieverProgram instance."""
        return DocumentRetrieverProgram(
            vector_store_config=mock_vector_store_config, max_source_count=5, similarity_threshold=0.4
        )

    @pytest.fixture
    def mock_dspy_examples(self, sample_documents):
        """Create mock DSPy Example objects from sample documents."""
        examples = []
        for doc in sample_documents:
            example = Mock(spec=dspy.Example)
            example.content = doc.page_content
            example.metadata = doc.metadata
            examples.append(example)
        return examples

    @pytest.mark.asyncio
    async def test_basic_document_retrieval(
        self, retriever, mock_vector_store_config, mock_dspy_examples, sample_processed_query: ProcessedQuery
    ):
        """Test basic document retrieval using DSPy PgVectorRM."""

        # Mock OpenAI client
        with patch("cairo_coder.dspy.document_retriever.openai.OpenAI") as mock_openai_class:
            mock_openai_client = Mock()
            mock_openai_class.return_value = mock_openai_client

            # Mock PgVectorRM
            with patch("cairo_coder.dspy.document_retriever.PgVectorRM") as mock_pgvector_rm:
                mock_retriever_instance = Mock(return_value=mock_dspy_examples)
                mock_pgvector_rm.return_value = mock_retriever_instance

                # Mock dspy module
                mock_dspy = Mock()
                mock_settings = Mock()
                mock_settings.configure = Mock()
                mock_dspy.settings = mock_settings

                with patch("cairo_coder.dspy.document_retriever.dspy", mock_dspy):
                    # Execute retrieval
                    result = await retriever.forward(sample_processed_query)

                    # Verify results
                    assert len(result) != 0
                    assert all(isinstance(doc, Document) for doc in result)

                    # Verify PgVectorRM was instantiated correctly
                    mock_pgvector_rm.assert_called_once_with(
                        db_url=mock_vector_store_config.dsn,
                        pg_table_name=mock_vector_store_config.table_name,
                        openai_client=mock_openai_client,
                        content_field="content",
                        fields=["id", "content", "metadata"],
                        k=5,  # max_source_count
                    )

                    # Verify dspy.settings.configure was called
                    mock_settings.configure.assert_called_with(rm=mock_retriever_instance)

                    # Verify retriever was called with proper query
                    # Last call with the last search query
                    mock_retriever_instance.assert_called_with(sample_processed_query.search_queries.pop())

    @pytest.mark.asyncio
    async def test_retrieval_with_empty_transformed_terms(
        self, retriever, mock_vector_store_config, mock_dspy_examples
    ):
        """Test retrieval when transformed terms list is empty."""
        query = ProcessedQuery(
            original="Simple query",
            search_queries=[],  # Empty transformed terms
            is_contract_related=False,
            is_test_related=False,
            resources=[DocumentSource.CAIRO_BOOK],
        )

        with patch("cairo_coder.dspy.document_retriever.openai.OpenAI") as mock_openai_class:
            mock_openai_client = Mock()
            mock_openai_class.return_value = mock_openai_client

            with patch("cairo_coder.dspy.document_retriever.PgVectorRM") as mock_pgvector_rm:
                mock_retriever_instance = Mock(return_value=mock_dspy_examples)
                mock_pgvector_rm.return_value = mock_retriever_instance

                # Mock dspy module
                mock_dspy = Mock()
                mock_settings = Mock()
                mock_settings.configure = Mock()
                mock_dspy.settings = mock_settings

                with patch("cairo_coder.dspy.document_retriever.dspy", mock_dspy):
                    result = await retriever.forward(query)

                    # Should still work with empty transformed terms
                    assert len(result) != 0

                    # Query should just be the original query with empty tags
                    expected_query = "Simple query"
                    mock_retriever_instance.assert_called_once_with(expected_query)

    @pytest.mark.asyncio
    async def test_retrieval_with_custom_sources(
        self, retriever, mock_vector_store_config, mock_dspy_examples, sample_processed_query
    ):
        """Test retrieval with custom source filtering."""
        # Override sources
        custom_sources = [DocumentSource.SCARB_DOCS, DocumentSource.OPENZEPPELIN_DOCS]

        with patch("cairo_coder.dspy.document_retriever.openai.OpenAI") as mock_openai_class:
            mock_openai_client = Mock()
            mock_openai_class.return_value = mock_openai_client

            with patch("cairo_coder.dspy.document_retriever.PgVectorRM") as mock_pgvector_rm:
                mock_retriever_instance = Mock(return_value=mock_dspy_examples)
                mock_pgvector_rm.return_value = mock_retriever_instance

                # Mock dspy module
                mock_dspy = Mock()
                mock_settings = Mock()
                mock_settings.configure = Mock()
                mock_dspy.settings = mock_settings

                with patch("cairo_coder.dspy.document_retriever.dspy", mock_dspy):
                    result = await retriever.forward(sample_processed_query, sources=custom_sources)

                    # Verify result
                    assert len(result) != 0

                    # Note: sources filtering is not currently implemented in PgVectorRM call
                    # This test ensures the method still works when sources are provided
                    mock_retriever_instance.assert_called()

    @pytest.mark.asyncio
    async def test_empty_document_handling(
        self, retriever, sample_processed_query
    ):
        """Test handling of empty document results."""

        with patch("cairo_coder.dspy.document_retriever.openai.OpenAI") as mock_openai_class:
            mock_openai_client = Mock()
            mock_openai_class.return_value = mock_openai_client

            with patch("cairo_coder.dspy.document_retriever.PgVectorRM") as mock_pgvector_rm:
                mock_retriever_instance = Mock(return_value=[])  # Empty results
                mock_pgvector_rm.return_value = mock_retriever_instance
                # Mock dspy module
                mock_dspy = Mock()
                mock_settings = Mock()
                mock_settings.configure = Mock()
                mock_dspy.settings = mock_settings

                with patch("cairo_coder.dspy.document_retriever.dspy", mock_dspy):
                    result = await retriever.forward(sample_processed_query)

                    assert result == []

    @pytest.mark.asyncio
    async def test_pgvector_rm_error_handling(
        self, retriever, mock_vector_store_config, sample_processed_query
    ):
        """Test handling of PgVectorRM instantiation errors."""

        with patch("cairo_coder.dspy.document_retriever.openai.OpenAI") as mock_openai_class:
            mock_openai_client = Mock()
            mock_openai_class.return_value = mock_openai_client

            with patch("cairo_coder.dspy.document_retriever.PgVectorRM") as mock_pgvector_rm:
                # Mock PgVectorRM to raise an exception
                mock_pgvector_rm.side_effect = Exception("Database connection error")

                with pytest.raises(Exception) as exc_info:
                    await retriever.forward(sample_processed_query)

                assert "Database connection error" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_retriever_call_error_handling(
        self, retriever, mock_vector_store_config, sample_processed_query
    ):
        """Test handling of retriever call errors."""

        with patch("cairo_coder.dspy.document_retriever.openai.OpenAI") as mock_openai_class:
            mock_openai_client = Mock()
            mock_openai_class.return_value = mock_openai_client

            with patch("cairo_coder.dspy.document_retriever.PgVectorRM") as mock_pgvector_rm:
                mock_retriever_instance = Mock(side_effect=Exception("Query execution error"))
                mock_pgvector_rm.return_value = mock_retriever_instance

                # Mock dspy module
                mock_dspy = Mock()
                mock_settings = Mock()
                mock_settings.configure = Mock()
                mock_dspy.settings = mock_settings

                with patch("cairo_coder.dspy.document_retriever.dspy", mock_dspy):
                    with pytest.raises(Exception) as exc_info:
                        await retriever.forward(sample_processed_query)

                    assert "Query execution error" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_max_source_count_configuration(self, mock_vector_store_config, sample_processed_query):
        """Test that max_source_count is properly passed to PgVectorRM."""
        retriever = DocumentRetrieverProgram(
            vector_store_config=mock_vector_store_config,
            max_source_count=15,  # Custom value
            similarity_threshold=0.4,
        )

        with patch("cairo_coder.dspy.document_retriever.openai.OpenAI") as mock_openai_class:
            mock_openai_client = Mock()
            mock_openai_class.return_value = mock_openai_client

            with patch("cairo_coder.dspy.document_retriever.PgVectorRM") as mock_pgvector_rm:
                mock_retriever_instance = Mock()
                mock_retriever_instance = Mock(return_value=[])
                mock_pgvector_rm.return_value = mock_retriever_instance
                # Mock dspy module
                mock_dspy = Mock()
                mock_settings = Mock()
                mock_settings.configure = Mock()
                mock_dspy.settings = mock_settings

                with patch("cairo_coder.dspy.document_retriever.dspy", mock_dspy):
                    await retriever.forward(sample_processed_query)

                    # Verify max_source_count was passed as k parameter
                    mock_pgvector_rm.assert_called_once_with(
                        db_url=mock_vector_store_config.dsn,
                        pg_table_name=mock_vector_store_config.table_name,
                        openai_client=mock_openai_client,
                        content_field="content",
                        fields=["id", "content", "metadata"],
                        k=15,  # Should match max_source_count
                    )

    @pytest.mark.asyncio
    async def test_document_conversion(
        self,
        retriever: DocumentRetrieverProgram,
        mock_vector_store_config: VectorStoreConfig,
        sample_processed_query: ProcessedQuery,
    ):
        """Test conversion from DSPy Examples to Document objects."""

        # Create mock DSPy examples with specific content and metadata
        mock_examples = []
        expected_docs = [
            ("Test content 1", {"source": "test1", "title": "Test 1"}),
            ("Test content 2", {"source": "test2", "title": "Test 2"}),
        ]

        for content, metadata in expected_docs:
            example = Mock(spec=dspy.Example)
            example.content = content
            example.metadata = metadata
            mock_examples.append(example)

        with patch("cairo_coder.dspy.document_retriever.openai.OpenAI") as mock_openai_class:
            mock_openai_client = Mock()
            mock_openai_class.return_value = mock_openai_client

            with patch("cairo_coder.dspy.document_retriever.PgVectorRM") as mock_pgvector_rm:
                mock_retriever_instance = Mock(return_value=mock_examples)
                mock_pgvector_rm.return_value = mock_retriever_instance

                # Mock dspy module
                mock_dspy = Mock()
                mock_settings = Mock()
                mock_settings.configure = Mock()
                mock_dspy.settings = mock_settings

                with patch("cairo_coder.dspy.document_retriever.dspy", mock_dspy):
                    result = await retriever.forward(sample_processed_query)

                    # Verify conversion to Document objects
                    # Ran 3 times the query, returned 2 docs each
                    assert len(result) == len(expected_docs) * len(sample_processed_query.search_queries)

                    for i, doc in enumerate(result):
                        assert isinstance(doc, Document)
                        assert doc.page_content == expected_docs[i % 2][0]
                        assert doc.metadata == expected_docs[i % 2][1]


class TestDocumentRetrieverFactory:
    """Test the document retriever factory function."""

    def test_create_document_retriever(self):
        """Test the factory function creates correct instance."""
        mock_vector_store_config = Mock(spec=VectorStoreConfig)

        retriever = create_document_retriever(
            vector_store_config=mock_vector_store_config, max_source_count=20, similarity_threshold=0.35
        )

        assert isinstance(retriever, DocumentRetrieverProgram)
        assert retriever.vector_store_config == mock_vector_store_config
        assert retriever.max_source_count == 20
        assert retriever.similarity_threshold == 0.35

    def test_create_document_retriever_defaults(self):
        """Test factory function with default parameters."""
        mock_vector_store_config = Mock(spec=VectorStoreConfig)

        retriever = create_document_retriever(vector_store_config=mock_vector_store_config)

        assert isinstance(retriever, DocumentRetrieverProgram)
        assert retriever.max_source_count == 10
        assert retriever.similarity_threshold == 0.4
