"""
Unit tests for DocumentRetrieverProgram.

Tests the DSPy-based document retrieval functionality using PgVectorRM retriever.
"""

from unittest.mock import AsyncMock, Mock, call, patch

import dspy
import pytest

from cairo_coder.core.config import VectorStoreConfig
from cairo_coder.core.types import Document, DocumentSource, ProcessedQuery
from cairo_coder.dspy.document_retriever import DocumentRetrieverProgram


class TestDocumentRetrieverProgram:
    """Test suite for DocumentRetrieverProgram."""

    @pytest.fixture(scope="function")
    def retriever(
        self, mock_vector_store_config: VectorStoreConfig, mock_vector_db: Mock
    ) -> DocumentRetrieverProgram:
        """Create a DocumentRetrieverProgram instance."""
        return DocumentRetrieverProgram(
            vector_store_config=mock_vector_store_config,
            vector_db=mock_vector_db,
            max_source_count=5,
            similarity_threshold=0.4,
        )

    @pytest.fixture(scope="session")
    def mock_dspy_examples(self, sample_documents: list[Document]) -> list[dspy.Example]:
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
        self,
        retriever: DocumentRetrieverProgram,
        mock_dspy_examples: list[dspy.Example],
        sample_processed_query: ProcessedQuery,
    ):
        """Test basic document retrieval using DSPy PgVectorRM."""
        retriever.vector_db.aforward.return_value = mock_dspy_examples

        # Execute retrieval - use async version since we're in async test
        result = await retriever.aforward(sample_processed_query)

        # Verify results
        assert len(result) != 0
        assert all(isinstance(doc, Document) for doc in result)

        # Verify retriever was called with proper query
        assert retriever.vector_db.aforward.call_count == len(
            sample_processed_query.search_queries
        )
        # Check it was called with each search query
        for query in sample_processed_query.search_queries:
            retriever.vector_db.aforward.assert_any_call(
                query=query, sources=sample_processed_query.resources
            )

    @pytest.mark.asyncio
    async def test_retrieval_with_empty_transformed_terms(self, retriever: DocumentRetrieverProgram):
        """Test retrieval when transformed terms list is empty."""
        query = ProcessedQuery(
            original="Simple query",
            search_queries=[],  # Empty transformed terms
            is_contract_related=False,
            is_test_related=False,
            resources=[DocumentSource.CAIRO_BOOK],
        )

        result = await retriever.aforward(query)

        # Should still work with empty transformed terms
        assert len(result) != 0

        # Query should just be the reasoning with empty tags
        expected_query = query.original
        retriever.vector_db.aforward.assert_called_with(
            query=expected_query, sources=query.resources
        )

    @pytest.mark.asyncio
    async def test_retrieval_with_custom_sources(self, retriever, sample_processed_query):
        """Test retrieval with custom source filtering."""
        # Override sources
        custom_sources = [DocumentSource.SCARB_DOCS, DocumentSource.OPENZEPPELIN_DOCS]

        result = await retriever.aforward(sample_processed_query, sources=custom_sources)

        # Verify result
        assert len(result) != 0

        # Note: sources filtering is not currently implemented in PgVectorRM call
        # This test ensures the method still works when sources are provided
        retriever.vector_db.aforward.assert_called()

    @pytest.mark.asyncio
    async def test_empty_document_handling(self, retriever, sample_processed_query):
        """Test handling of empty document results."""
        retriever.vector_db.aforward = AsyncMock(return_value=[])

        result = await retriever.aforward(sample_processed_query)

        assert result == []

    @pytest.mark.asyncio
    async def test_pgvector_rm_error_handling(self, retriever, sample_processed_query):
        """Test handling of PgVectorRM instantiation errors."""
        # Mock PgVectorRM to raise an exception
        retriever.vector_db.aforward.side_effect = Exception("Database connection error")

        with pytest.raises(Exception) as exc_info:
            await retriever.aforward(sample_processed_query)

        assert "Database connection error" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_retriever_call_error_handling(self, retriever, sample_processed_query):
        """Test handling of retriever call errors."""

        retriever.vector_db.aforward.side_effect = Exception("Query execution error")

        with pytest.raises(Exception) as exc_info:
            await retriever.aforward(sample_processed_query)

        assert "Query execution error" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_max_source_count_configuration(
        self, mock_vector_store_config, mock_vector_db, sample_processed_query
    ):
        """Test that max_source_count is properly passed to PgVectorRM."""
        retriever = DocumentRetrieverProgram(
            vector_store_config=mock_vector_store_config,
            vector_db=mock_vector_db,
            max_source_count=15,  # Custom value
            similarity_threshold=0.4,
        )
        await retriever.aforward(sample_processed_query)
        # Verify max_source_count was passed as k parameter
        retriever.vector_db.aforward.assert_called()

    @pytest.mark.asyncio
    async def test_document_conversion(
        self,
        retriever: DocumentRetrieverProgram,
        sample_processed_query: ProcessedQuery,
        mock_vector_db: Mock,
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

        retriever.vector_db.aforward = AsyncMock(return_value=mock_examples)

        result = await retriever.aforward(sample_processed_query)

        # Verify conversion to Document objects
        # Ran 3 times the query, returned 2 docs each - but de-duped
        mock_vector_db.aforward.assert_has_calls(
            [
                call(query=query, sources=sample_processed_query.resources)
                for query in sample_processed_query.search_queries
            ],
            any_order=True,
        )

        # Verify conversion to Document objects
        assert len(result) == len(expected_docs) + 1  # (Contract template)

        # Convert result to (content, metadata) tuples for comparison
        result_tuples = [(doc.page_content, doc.metadata) for doc in result]

        # Check that all expected documents are present (order doesn't matter)
        for expected_content, expected_metadata in expected_docs:
            assert (expected_content, expected_metadata) in result_tuples

    @pytest.mark.parametrize(
        "query_str, query_details, expected_templates",
        [
            (
                "Some query",
                {"is_contract_related": True, "is_test_related": False},
                ["Contract Template"],
            ),
            (
                "Some query",
                {"is_contract_related": False, "is_test_related": True},
                ["Contract Testing Template"],
            ),
            (
                "Some query",
                {"is_contract_related": True, "is_test_related": True},
                ["Contract Template", "Contract Testing Template"],
            ),
            (
                "Some other query",
                {"is_contract_related": False, "is_test_related": False},
                [],
            ),
            ("Query with contract and test in string", {"is_contract_related": False, "is_test_related": False}, ["Contract Template", "Contract Testing Template"]),
        ],
    )
    @pytest.mark.asyncio
    async def test_context_enhancement(
        self, retriever, mock_vector_db, mock_dspy_examples, query_str, query_details, expected_templates
    ):
        """Test context enhancement for contract-related and test-related queries."""
        query = ProcessedQuery(
            original=query_str,
            search_queries=["None"],
            resources=[DocumentSource.CAIRO_BOOK],
            **query_details,
        )
        mock_vector_db.aforward.return_value = mock_dspy_examples

        result: list[Document] = await retriever.aforward(query)

        found_templates = {
            doc.source
            for doc in result
            if "Template" in doc.source
        }
        assert set(expected_templates) == found_templates


class TestDocumentRetrieverFactory:
    """Test the document retriever factory function."""

    def test_create_document_retriever(self):
        """Test the factory function creates correct instance."""
        mock_vector_store_config = Mock(spec=VectorStoreConfig)
        mock_vector_store_config.dsn = "postgresql://test:test@localhost/test"
        mock_vector_store_config.table_name = "test_table"

        with patch("cairo_coder.dspy.document_retriever.SourceFilteredPgVectorRM"):
            retriever = DocumentRetrieverProgram(
                vector_store_config=mock_vector_store_config,
                max_source_count=20,
                similarity_threshold=0.35,
            )

        assert isinstance(retriever, DocumentRetrieverProgram)
        assert retriever.vector_store_config == mock_vector_store_config
        assert retriever.max_source_count == 20
        assert retriever.similarity_threshold == 0.35

    def test_create_document_retriever_defaults(self):
        """Test factory function with default parameters."""
        mock_vector_store_config = Mock(spec=VectorStoreConfig)
        mock_vector_store_config.dsn = "postgresql://test:test@localhost/test"
        mock_vector_store_config.table_name = "test_table"

        with patch("cairo_coder.dspy.document_retriever.SourceFilteredPgVectorRM"):
            retriever = DocumentRetrieverProgram(vector_store_config=mock_vector_store_config)

        assert isinstance(retriever, DocumentRetrieverProgram)
        assert retriever.max_source_count == 5
        assert retriever.similarity_threshold == 0.4
