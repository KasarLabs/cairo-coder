"""
Unit tests for QueryProcessorProgram.

Tests the DSPy-based query processing functionality including search term extraction,
resource identification, and query categorization.
"""

from unittest.mock import Mock, patch
import pytest
import dspy

from cairo_coder.core.types import DocumentSource, ProcessedQuery
from cairo_coder.dspy.query_processor import QueryProcessorProgram, CairoQueryAnalysis


class TestQueryProcessorProgram:
    """Test suite for QueryProcessorProgram."""

    @pytest.fixture
    def mock_lm(self):
        """Configure DSPy with a mock language model for testing."""
        mock = Mock()
        mock.return_value = dspy.Prediction(
            search_terms="cairo, contract, storage, variable",
            resources="cairo_book, starknet_docs"
        )

        with patch('dspy.ChainOfThought') as mock_cot:
            mock_cot.return_value = mock
            yield mock

    @pytest.fixture
    def processor(self, mock_lm):
        """Create a QueryProcessorProgram instance with mocked LM."""
        return QueryProcessorProgram()

    def test_contract_query_processing(self, processor):
        """Test processing of contract-related queries."""
        query = "How do I define storage variables in a Cairo contract?"

        result = processor.forward(query)

        assert isinstance(result, ProcessedQuery)
        assert result.original == query
        assert result.is_contract_related is True
        assert result.is_test_related is False
        assert isinstance(result.transformed, list)
        assert len(result.transformed) > 0
        assert isinstance(result.resources, list)
        assert all(isinstance(r, DocumentSource) for r in result.resources)

    def test_search_terms_parsing(self, processor):
        """Test parsing of search terms string."""
        # Test with quoted terms
        terms_str = '"cairo contract", storage, "external function"'
        parsed = processor._parse_search_terms(terms_str)

        assert "cairo contract" in parsed
        assert "storage" in parsed
        assert "external function" in parsed

        # Test with empty/whitespace terms
        terms_str = "cairo, , storage,  ,trait"
        parsed = processor._parse_search_terms(terms_str)

        assert "cairo" in parsed
        assert "storage" in parsed
        assert "trait" in parsed
        assert "" not in parsed

    def test_resource_validation(self, processor):
        """Test validation of resource strings."""
        # Test valid resources
        resources_str = "cairo_book, starknet_docs, openzeppelin_docs"
        validated = processor._validate_resources(resources_str)

        assert DocumentSource.CAIRO_BOOK in validated
        assert DocumentSource.STARKNET_DOCS in validated
        assert DocumentSource.OPENZEPPELIN_DOCS in validated

        # Test invalid resources with fallback
        resources_str = "invalid_source, another_invalid"
        validated = processor._validate_resources(resources_str)

        assert validated == [DocumentSource.CAIRO_BOOK]  # Default fallback

        # Test mixed valid and invalid
        resources_str = "cairo_book, invalid_source, starknet_docs"
        validated = processor._validate_resources(resources_str)

        assert DocumentSource.CAIRO_BOOK in validated
        assert DocumentSource.STARKNET_DOCS in validated
        assert len(validated) == 2

    def test_search_terms_enhancement(self, processor):
        """Test enhancement of search terms with query analysis."""
        query = "How do I implement token_transfer in my StarkNet contract?"
        base_terms = ["token", "transfer"]

        enhanced = processor._enhance_search_terms(query, base_terms)

        assert "token" in enhanced
        assert "transfer" in enhanced
        assert "starknet" in enhanced  # Should be added from query
        assert "contract" in enhanced  # Should be added from query
        assert "token_transfer" in enhanced  # Should be added (snake_case)

    def test_contract_detection(self, processor):
        """Test detection of contract-related queries."""
        contract_queries = [
            "How do I create a contract?",
            "What is a storage variable?",
            "How to implement a trait in Cairo?",
            "External function implementation",
            "Event emission in StarkNet"
        ]

        for query in contract_queries:
            assert processor._is_contract_query(query) is True

        non_contract_queries = [
            "What is Cairo language?",
            "How to install Scarb?",
            "Basic data types in Cairo"
        ]

        for query in non_contract_queries:
            assert processor._is_contract_query(query) is False

    def test_test_detection(self, processor):
        """Test detection of test-related queries."""
        test_queries = [
            "How do I write tests for Cairo?",
            "Unit testing best practices",
            "How to assert in Cairo tests?",
            "Mock setup for integration tests",
            "Test fixture configuration"
        ]

        for query in test_queries:
            assert processor._is_test_query(query) is True

        non_test_queries = [
            "How to create a contract?",
            "What are Cairo data types?",
            "StarkNet deployment guide"
        ]

        for query in non_test_queries:
            assert processor._is_test_query(query) is False

    def test_source_relevance_detection(self, processor):
        """Test detection of relevant sources based on query content."""
        # Test Scarb-related query
        scarb_query = "How to configure Scarb build profiles?"
        sources = processor._get_relevant_sources(scarb_query)
        assert DocumentSource.SCARB_DOCS in sources

        # Test OpenZeppelin-related query
        oz_query = "How to use OpenZeppelin ERC20 implementation?"
        sources = processor._get_relevant_sources(oz_query)
        assert DocumentSource.OPENZEPPELIN_DOCS in sources

        # Test Starknet Foundry-related query
        foundry_query = "How to use Foundry for Cairo testing?"
        sources = processor._get_relevant_sources(foundry_query)
        assert DocumentSource.STARKNET_FOUNDRY in sources

        # Test general query defaults to Cairo Book
        general_query = "What is a variable in Cairo?"
        sources = processor._get_relevant_sources(general_query)
        assert DocumentSource.CAIRO_BOOK in sources

    def test_empty_query_handling(self, processor):
        """Test handling of empty or whitespace queries."""
        with patch.object(processor, 'retrieval_program') as mock_program:
            mock_program.return_value = dspy.Prediction(
                search_terms="",
                resources=""
            )

            result = processor.forward("")

            assert result.original == ""
            assert result.resources == [DocumentSource.CAIRO_BOOK]  # Default fallback

    def test_malformed_dspy_output(self, processor):
        """Test handling of malformed DSPy output."""
        with patch.object(processor, 'retrieval_program') as mock_program:
            mock_program.return_value = dspy.Prediction(
                search_terms=None,
                resources=None
            )

            query = "How do I create a contract?"
            result = processor.forward(query)

            assert result.original == query
            assert result.resources == [DocumentSource.CAIRO_BOOK]  # Default fallback
            # Enhanced search terms should include "contract" from the query
            assert "contract" in [term.lower() for term in result.transformed]


class TestCairoQueryAnalysis:
    """Test suite for CairoQueryAnalysis signature."""

    def test_signature_fields(self):
        """Test that the signature has the correct fields."""
        signature = CairoQueryAnalysis

        # Check model fields exist
        assert 'chat_history' in signature.model_fields
        assert 'query' in signature.model_fields
        assert 'search_terms' in signature.model_fields
        assert 'resources' in signature.model_fields

        # Check field types
        chat_history_field = signature.model_fields['chat_history']
        query_field = signature.model_fields['query']
        search_terms_field = signature.model_fields['search_terms']
        resources_field = signature.model_fields['resources']

        assert chat_history_field.json_schema_extra['__dspy_field_type'] == 'input'
        assert query_field.json_schema_extra['__dspy_field_type'] == 'input'
        assert search_terms_field.json_schema_extra['__dspy_field_type'] == 'output'
        assert resources_field.json_schema_extra['__dspy_field_type'] == 'output'

    def test_field_descriptions(self):
        """Test that fields have meaningful descriptions."""
        signature = CairoQueryAnalysis

        chat_history_desc = signature.model_fields['chat_history'].json_schema_extra['desc']
        query_desc = signature.model_fields['query'].json_schema_extra['desc']
        search_terms_desc = signature.model_fields['search_terms'].json_schema_extra['desc']
        resources_desc = signature.model_fields['resources'].json_schema_extra['desc']

        assert "conversation context" in chat_history_desc.lower()
        assert "cairo" in query_desc.lower()
        assert "search terms" in search_terms_desc.lower()
        assert "documentation sources" in resources_desc.lower()

        # Check that resources field lists valid sources
        assert "cairo_book" in resources_desc
        assert "starknet_docs" in resources_desc
        assert "scarb_docs" in resources_desc
