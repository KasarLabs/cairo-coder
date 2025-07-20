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
            reasoning="I need to create a Cairo contract",
            is_contract_related=True,
            is_test_related=False,
            resources=[DocumentSource.CAIRO_BOOK, DocumentSource.STARKNET_DOCS],
        )

    @pytest.fixture
    def retriever(self, mock_vector_store_config: VectorStoreConfig) -> DocumentRetrieverProgram:
        """Create a DocumentRetrieverProgram instance."""
        return DocumentRetrieverProgram(
            vector_store_config=mock_vector_store_config,
            max_source_count=5,
            similarity_threshold=0.4,
        )

    @pytest.fixture
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
        mock_vector_store_config: VectorStoreConfig,
        mock_dspy_examples: list[dspy.Example],
        sample_processed_query: ProcessedQuery,
    ):
        """Test basic document retrieval using DSPy PgVectorRM."""

        # Mock OpenAI client
        with patch("cairo_coder.dspy.document_retriever.openai.OpenAI") as mock_openai_class:
            mock_openai_client = Mock()
            mock_openai_class.return_value = mock_openai_client

            # Mock PgVectorRM
            with patch(
                "cairo_coder.dspy.document_retriever.SourceFilteredPgVectorRM"
            ) as mock_pgvector_rm:
                mock_retriever_instance = Mock(return_value=mock_dspy_examples)
                mock_retriever_instance.forward = Mock(return_value=mock_dspy_examples)
                mock_retriever_instance.aforward = AsyncMock(return_value=mock_dspy_examples)
                mock_pgvector_rm.return_value = mock_retriever_instance

                # Mock dspy module
                mock_dspy = Mock()

                with patch("cairo_coder.dspy.document_retriever.dspy", mock_dspy):
                    # Execute retrieval - use async version since we're in async test
                    result = await retriever.aforward(sample_processed_query)

                    # Verify results
                    assert len(result) != 0
                    assert all(isinstance(doc, Document) for doc in result)

                    # Verify SourceFilteredPgVectorRM was instantiated correctly
                    mock_pgvector_rm.assert_called_once_with(
                        db_url=mock_vector_store_config.dsn,
                        pg_table_name=mock_vector_store_config.table_name,
                        openai_client=mock_openai_client,
                        content_field="content",
                        fields=["id", "content", "metadata"],
                        k=5,  # max_source_count
                        sources=sample_processed_query.resources,  # Include sources from query
                    )

                    # Verify retriever was called with proper query
                    # Since we're using async, check aforward was called
                    assert mock_retriever_instance.aforward.call_count == len(sample_processed_query.search_queries)
                    # Check it was called with each search query
                    for query in sample_processed_query.search_queries:
                        mock_retriever_instance.aforward.assert_any_call(query)

    @pytest.mark.asyncio
    async def test_retrieval_with_empty_transformed_terms(
        self, retriever: DocumentRetrieverProgram, mock_vector_store_config: VectorStoreConfig, mock_dspy_examples: list[dspy.Example]
    ):
        """Test retrieval when transformed terms list is empty."""
        query = ProcessedQuery(
            original="Simple query",
            search_queries=[],  # Empty transformed terms
            reasoning="Simple reasoning",
            is_contract_related=False,
            is_test_related=False,
            resources=[DocumentSource.CAIRO_BOOK],
        )

        with patch("cairo_coder.dspy.document_retriever.openai.OpenAI") as mock_openai_class:
            mock_openai_client = Mock()
            mock_openai_class.return_value = mock_openai_client

            with patch(
                "cairo_coder.dspy.document_retriever.SourceFilteredPgVectorRM"
            ) as mock_pgvector_rm:
                mock_retriever_instance = Mock(return_value=mock_dspy_examples)
                mock_retriever_instance.forward = Mock(return_value=mock_dspy_examples)
                mock_retriever_instance.aforward = AsyncMock(return_value=mock_dspy_examples)
                mock_pgvector_rm.return_value = mock_retriever_instance

                # Mock dspy module
                mock_dspy = Mock()
                mock_settings = Mock()
                mock_settings.configure = Mock()
                mock_dspy.settings = mock_settings

                with patch("cairo_coder.dspy.document_retriever.dspy", mock_dspy):
                    result = await retriever.aforward(query)

                    # Should still work with empty transformed terms
                    assert len(result) != 0

                    # Query should just be the reasoning with empty tags
                    expected_query = "Simple reasoning"
                    mock_retriever_instance.aforward.assert_called_once_with(expected_query)

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

            with patch(
                "cairo_coder.dspy.document_retriever.SourceFilteredPgVectorRM"
            ) as mock_pgvector_rm:
                mock_retriever_instance = Mock(return_value=mock_dspy_examples)
                mock_retriever_instance.forward = Mock(return_value=mock_dspy_examples)
                mock_retriever_instance.aforward = AsyncMock(return_value=mock_dspy_examples)
                mock_pgvector_rm.return_value = mock_retriever_instance

                # Mock dspy module
                mock_dspy = Mock()
                mock_settings = Mock()
                mock_settings.configure = Mock()
                mock_dspy.settings = mock_settings

                with patch("cairo_coder.dspy.document_retriever.dspy", mock_dspy):
                    result = await retriever.aforward(sample_processed_query, sources=custom_sources)

                    # Verify result
                    assert len(result) != 0

                    # Note: sources filtering is not currently implemented in PgVectorRM call
                    # This test ensures the method still works when sources are provided
                    mock_retriever_instance.aforward.assert_called()

    @pytest.mark.asyncio
    async def test_empty_document_handling(self, retriever, sample_processed_query):
        """Test handling of empty document results."""

        with patch("cairo_coder.dspy.document_retriever.openai.OpenAI") as mock_openai_class:
            mock_openai_client = Mock()
            mock_openai_class.return_value = mock_openai_client

            with patch(
                "cairo_coder.dspy.document_retriever.SourceFilteredPgVectorRM"
            ) as mock_pgvector_rm:
                mock_retriever_instance = Mock(return_value=[])  # Empty results
                mock_retriever_instance.forward = Mock(return_value=[])
                mock_retriever_instance.aforward = AsyncMock(return_value=[])
                mock_pgvector_rm.return_value = mock_retriever_instance
                # Mock dspy module
                mock_dspy = Mock()
                mock_settings = Mock()
                mock_settings.configure = Mock()
                mock_dspy.settings = mock_settings

                with patch("cairo_coder.dspy.document_retriever.dspy", mock_dspy):
                    result = await retriever.aforward(sample_processed_query)

                    assert result == []

    @pytest.mark.asyncio
    async def test_pgvector_rm_error_handling(
        self, retriever, mock_vector_store_config, sample_processed_query
    ):
        """Test handling of PgVectorRM instantiation errors."""

        with patch("cairo_coder.dspy.document_retriever.openai.OpenAI") as mock_openai_class:
            mock_openai_client = Mock()
            mock_openai_class.return_value = mock_openai_client

            with patch(
                "cairo_coder.dspy.document_retriever.SourceFilteredPgVectorRM"
            ) as mock_pgvector_rm:
                # Mock PgVectorRM to raise an exception
                mock_pgvector_rm.side_effect = Exception("Database connection error")

                with pytest.raises(Exception) as exc_info:
                    await retriever.aforward(sample_processed_query)

                assert "Database connection error" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_retriever_call_error_handling(
        self, retriever, mock_vector_store_config, sample_processed_query
    ):
        """Test handling of retriever call errors."""

        with patch("cairo_coder.dspy.document_retriever.openai.OpenAI") as mock_openai_class:
            mock_openai_client = Mock()
            mock_openai_class.return_value = mock_openai_client

            with patch(
                "cairo_coder.dspy.document_retriever.SourceFilteredPgVectorRM"
            ) as mock_pgvector_rm:
                mock_retriever_instance = Mock(side_effect=Exception("Query execution error"))
                mock_retriever_instance.forward = Mock(side_effect=Exception("Query execution error"))
                mock_retriever_instance.aforward = AsyncMock(side_effect=Exception("Query execution error"))
                mock_pgvector_rm.return_value = mock_retriever_instance

                # Mock dspy module
                mock_dspy = Mock()
                mock_settings = Mock()
                mock_settings.configure = Mock()
                mock_dspy.settings = mock_settings

                with patch("cairo_coder.dspy.document_retriever.dspy", mock_dspy):
                    with pytest.raises(Exception) as exc_info:
                        await retriever.aforward(sample_processed_query)

                    assert "Query execution error" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_max_source_count_configuration(
        self, mock_vector_store_config, sample_processed_query
    ):
        """Test that max_source_count is properly passed to PgVectorRM."""
        retriever = DocumentRetrieverProgram(
            vector_store_config=mock_vector_store_config,
            max_source_count=15,  # Custom value
            similarity_threshold=0.4,
        )

        with patch("cairo_coder.dspy.document_retriever.openai.OpenAI") as mock_openai_class:
            mock_openai_client = Mock()
            mock_openai_class.return_value = mock_openai_client

            with patch(
                "cairo_coder.dspy.document_retriever.SourceFilteredPgVectorRM"
            ) as mock_pgvector_rm:
                mock_retriever_instance = Mock()
                mock_retriever_instance.forward = Mock(return_value=[])
                mock_retriever_instance.aforward = AsyncMock(return_value=[])
                mock_pgvector_rm.return_value = mock_retriever_instance
                # Mock dspy module
                mock_dspy = Mock()
                mock_settings = Mock()
                mock_settings.configure = Mock()
                mock_dspy.settings = mock_settings

                with patch("cairo_coder.dspy.document_retriever.dspy", mock_dspy):
                    await retriever.aforward(sample_processed_query)

                    # Verify max_source_count was passed as k parameter
                    mock_pgvector_rm.assert_called_once_with(
                        db_url=mock_vector_store_config.dsn,
                        pg_table_name=mock_vector_store_config.table_name,
                        openai_client=mock_openai_client,
                        content_field="content",
                        fields=["id", "content", "metadata"],
                        k=15,  # Should match max_source_count
                        sources=sample_processed_query.resources,  # Include sources from query
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

            with patch(
                "cairo_coder.dspy.document_retriever.SourceFilteredPgVectorRM"
            ) as mock_pgvector_rm:
                mock_retriever_instance = Mock(return_value=mock_examples)
                mock_retriever_instance.forward = Mock(return_value=mock_examples)
                mock_retriever_instance.aforward = AsyncMock(return_value=mock_examples)
                mock_pgvector_rm.return_value = mock_retriever_instance

                # Mock dspy module
                mock_dspy = Mock()
                mock_settings = Mock()
                mock_settings.configure = Mock()
                mock_dspy.settings = mock_settings

                with patch("cairo_coder.dspy.document_retriever.dspy", mock_dspy):
                    result = await retriever.aforward(sample_processed_query)

                    # Verify conversion to Document objects
                    # Ran 3 times the query, returned 2 docs each - but de-duped
                    mock_retriever_instance.aforward.assert_has_calls(
                        [call(query) for query in sample_processed_query.search_queries],
                        any_order=True,
                    )

                    # Verify conversion to Document objects
                    assert len(result) == len(expected_docs) + 1  # (Contract template)

                    # Convert result to (content, metadata) tuples for comparison
                    result_tuples = [(doc.page_content, doc.metadata) for doc in result]

                    # Check that all expected documents are present (order doesn't matter)
                    for expected_content, expected_metadata in expected_docs:
                        assert (expected_content, expected_metadata) in result_tuples

    @pytest.mark.asyncio
    async def test_contract_context_enhancement(
        self, retriever, mock_vector_store_config, mock_dspy_examples
    ):
        """Test context enhancement for contract-related queries."""
        # Create a contract-related query
        query = ProcessedQuery(
            original="How do I create a contract with storage?",
            search_queries=["contract", "storage"],
            reasoning="I need to create a contract with storage",
            is_contract_related=True,
            is_test_related=False,
            resources=[DocumentSource.CAIRO_BOOK],
        )

        with patch("cairo_coder.dspy.document_retriever.openai.OpenAI") as mock_openai_class:
            mock_openai_client = Mock()
            mock_openai_class.return_value = mock_openai_client

            with patch(
                "cairo_coder.dspy.document_retriever.SourceFilteredPgVectorRM"
            ) as mock_pgvector_rm:
                mock_retriever_instance = Mock(return_value=mock_dspy_examples)
                mock_retriever_instance.forward = Mock(return_value=mock_dspy_examples)
                mock_retriever_instance.aforward = AsyncMock(return_value=mock_dspy_examples)
                mock_pgvector_rm.return_value = mock_retriever_instance

                # Mock dspy module
                mock_dspy = Mock()
                mock_settings = Mock()
                mock_settings.configure = Mock()
                mock_dspy.settings = mock_settings

                with patch("cairo_coder.dspy.document_retriever.dspy", mock_dspy):
                    result = await retriever.aforward(query)

                    # Verify contract template was added to context
                    contract_template_found = False
                    for doc in result:
                        if doc.metadata.get("source") == "contract_template":
                            contract_template_found = True
                            # Verify it contains the contract template content
                            assert "The content inside the <contract> tag" in doc.page_content
                            assert "#[starknet::contract]" in doc.page_content
                            assert "#[storage]" in doc.page_content
                            break

                    assert contract_template_found, (
                        "Contract template should be added for contract-related queries"
                    )

    @pytest.mark.asyncio
    async def test_test_context_enhancement(
        self, retriever, mock_vector_store_config, mock_dspy_examples
    ):
        """Test context enhancement for test-related queries."""
        # Create a test-related query
        query = ProcessedQuery(
            original="How do I write tests for Cairo contracts?",
            search_queries=["test", "cairo"],
            reasoning="I need to write tests for a Cairo contract",
            is_contract_related=False,
            is_test_related=True,
            resources=[DocumentSource.CAIRO_BOOK],
        )

        with patch("cairo_coder.dspy.document_retriever.openai.OpenAI") as mock_openai_class:
            mock_openai_client = Mock()
            mock_openai_class.return_value = mock_openai_client

            with patch(
                "cairo_coder.dspy.document_retriever.SourceFilteredPgVectorRM"
            ) as mock_pgvector_rm:
                mock_retriever_instance = Mock(return_value=mock_dspy_examples)
                mock_retriever_instance.forward = Mock(return_value=mock_dspy_examples)
                mock_retriever_instance.aforward = AsyncMock(return_value=mock_dspy_examples)
                mock_pgvector_rm.return_value = mock_retriever_instance

                # Mock dspy module
                mock_dspy = Mock()
                mock_settings = Mock()
                mock_settings.configure = Mock()
                mock_dspy.settings = mock_settings

                with patch("cairo_coder.dspy.document_retriever.dspy", mock_dspy):
                    result = await retriever.aforward(query)

                    # Verify test template was added to context
                    test_template_found = False
                    for doc in result:
                        if doc.metadata.get("source") == "test_template":
                            test_template_found = True
                            # Verify it contains the test template content
                            assert (
                                "The content inside the <contract_test> tag is the test code for the 'Registry' contract. It is assumed"
                                in doc.page_content
                            )
                            assert (
                                "that the contract is part of a package named 'registry'. When writing tests, follow the important rules."
                                in doc.page_content
                            )
                            assert "#[test]" in doc.page_content
                            assert "assert(" in doc.page_content
                            break

                    assert test_template_found, (
                        "Test template should be added for test-related queries"
                    )

    @pytest.mark.asyncio
    async def test_both_templates_enhancement(
        self, retriever, mock_vector_store_config, mock_dspy_examples
    ):
        """Test context enhancement when query relates to both contracts and tests."""
        # Create a query that mentions both contracts and tests
        query = ProcessedQuery(
            original="How do I create a contract and write tests for it?",
            search_queries=["contract", "test"],
            reasoning="I need to create a contract and write tests for it",
            is_contract_related=True,
            is_test_related=True,
            resources=[DocumentSource.CAIRO_BOOK],
        )

        with patch("cairo_coder.dspy.document_retriever.openai.OpenAI") as mock_openai_class:
            mock_openai_client = Mock()
            mock_openai_class.return_value = mock_openai_client

            with patch(
                "cairo_coder.dspy.document_retriever.SourceFilteredPgVectorRM"
            ) as mock_pgvector_rm:
                mock_retriever_instance = Mock(return_value=mock_dspy_examples)
                mock_retriever_instance.forward = Mock(return_value=mock_dspy_examples)
                mock_retriever_instance.aforward = AsyncMock(return_value=mock_dspy_examples)
                mock_pgvector_rm.return_value = mock_retriever_instance

                # Mock dspy module
                mock_dspy = Mock()
                mock_settings = Mock()
                mock_settings.configure = Mock()
                mock_dspy.settings = mock_settings

                with patch("cairo_coder.dspy.document_retriever.dspy", mock_dspy):
                    result = await retriever.aforward(query)

                    # Verify both templates were added
                    contract_template_found = False
                    test_template_found = False

                    for doc in result:
                        if doc.metadata.get("source") == "contract_template":
                            contract_template_found = True
                        elif doc.metadata.get("source") == "test_template":
                            test_template_found = True

                    assert contract_template_found, (
                        "Contract template should be added for contract-related queries"
                    )
                    assert test_template_found, (
                        "Test template should be added for test-related queries"
                    )

    @pytest.mark.asyncio
    async def test_no_template_enhancement(
        self, retriever, mock_vector_store_config, mock_dspy_examples
    ):
        """Test that no templates are added for unrelated queries."""
        # Create a query that's not related to contracts or tests
        query = ProcessedQuery(
            original="What is Cairo programming language?",
            search_queries=["cairo", "programming"],
            reasoning="I need to know what Cairo is",
            is_contract_related=False,
            is_test_related=False,
            resources=[DocumentSource.CAIRO_BOOK],
        )

        with patch("cairo_coder.dspy.document_retriever.openai.OpenAI") as mock_openai_class:
            mock_openai_client = Mock()
            mock_openai_class.return_value = mock_openai_client

            with patch(
                "cairo_coder.dspy.document_retriever.SourceFilteredPgVectorRM"
            ) as mock_pgvector_rm:
                mock_retriever_instance = Mock(return_value=mock_dspy_examples)
                mock_retriever_instance.forward = Mock(return_value=mock_dspy_examples)
                mock_retriever_instance.aforward = AsyncMock(return_value=mock_dspy_examples)
                mock_pgvector_rm.return_value = mock_retriever_instance

                # Mock dspy module
                mock_dspy = Mock()
                mock_settings = Mock()
                mock_settings.configure = Mock()
                mock_dspy.settings = mock_settings

                with patch("cairo_coder.dspy.document_retriever.dspy", mock_dspy):
                    result = await retriever.aforward(query)

                    # Verify no templates were added
                    template_sources = [doc.metadata.get("source") for doc in result]
                    assert "contract_template" not in template_sources, (
                        "Contract template should not be added for non-contract queries"
                    )
                    assert "test_template" not in template_sources, (
                        "Test template should not be added for non-test queries"
                    )


class TestDocumentRetrieverFactory:
    """Test the document retriever factory function."""

    def test_create_document_retriever(self):
        """Test the factory function creates correct instance."""
        mock_vector_store_config = Mock(spec=VectorStoreConfig)

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

        retriever = DocumentRetrieverProgram(vector_store_config=mock_vector_store_config)

        assert isinstance(retriever, DocumentRetrieverProgram)
        assert retriever.max_source_count == 5
        assert retriever.similarity_threshold == 0.4
