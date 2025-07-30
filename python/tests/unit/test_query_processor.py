"""
Unit tests for QueryProcessorProgram.

Tests the DSPy-based query processing functionality including search term extraction,
resource identification, and query categorization.
"""

from unittest.mock import AsyncMock, patch

import dspy
import pytest

from cairo_coder.core.types import DocumentSource, ProcessedQuery
from cairo_coder.dspy.query_processor import CairoQueryAnalysis, QueryProcessorProgram


class TestQueryProcessorProgram:
    """Test suite for QueryProcessorProgram."""

    @pytest.fixture
    def processor(self):
        """Create a QueryProcessorProgram instance with mocked LM."""
        return QueryProcessorProgram()

    def test_contract_query_processing(self, processor, mock_lm):
        """Test processing of contract-related queries."""
        prediction = dspy.Prediction(
            search_queries=["cairo, contract, storage, variable"],
            resources=["cairo_book", "starknet_docs"],
            reasoning="I need to create a Cairo contract",
        )
        mock_lm.forward.return_value = prediction
        mock_lm.aforward.return_value = prediction

        query = "How do I define storage variables in a Cairo contract?"

        result = processor.forward(query)

        assert isinstance(result, ProcessedQuery)
        assert result.original == query
        assert result.is_contract_related is True
        assert result.is_test_related is False
        assert isinstance(result.search_queries, list)
        assert len(result.search_queries) > 0
        assert isinstance(result.resources, list)
        assert all(isinstance(r, DocumentSource) for r in result.resources)

    def test_resource_validation(self, processor: QueryProcessorProgram):
        """Test validation of resource strings."""
        # Test valid resources
        resources: list[str] = ["cairo_book", "starknet_docs", "openzeppelin_docs"]
        validated = processor._validate_resources(resources)

        assert DocumentSource.CAIRO_BOOK in validated
        assert DocumentSource.STARKNET_DOCS in validated
        assert DocumentSource.OPENZEPPELIN_DOCS in validated

        # Test invalid resources with fallback
        resources: list[str] = ["invalid_source", "another_invalid"]
        validated = processor._validate_resources(resources)

        assert validated == [DocumentSource.CAIRO_BOOK]  # Default fallback

        # Test mixed valid and invalid
        resources: list[str] = ["cairo_book", "invalid_source", "starknet_docs"]
        validated = processor._validate_resources(resources)

        assert DocumentSource.CAIRO_BOOK in validated
        assert DocumentSource.STARKNET_DOCS in validated
        assert len(validated) == 2

    @pytest.mark.parametrize(
        "query, expected",
        [
            ("How do I write tests for Cairo?", True),
            ("Unit testing best practices", True),
            ("How to assert in Cairo tests?", True),
            ("Mock setup for integration tests", True),
            ("Test fixture configuration", True),
            ("How to create a contract?", False),
            ("What are Cairo data types?", False),
            ("StarkNet deployment guide", False),
        ],
    )
    def test_test_detection(self, processor, query, expected):
        """Test detection of test-related queries."""
        assert processor._is_test_query(query) is expected

    def test_empty_query_handling(self, processor):
        """Test handling of empty or whitespace queries."""
        with patch.object(processor, "retrieval_program") as mock_program:
            mock_program.aforward = AsyncMock(
                return_value=dspy.Prediction(
                    search_queries=[], resources=[], reasoning="Empty query"
                )
            )

            result = processor.forward("")

            assert result.original == ""
            assert result.resources == [DocumentSource.CAIRO_BOOK]  # Default fallback


class TestCairoQueryAnalysis:
    """Test suite for CairoQueryAnalysis signature."""

    def test_signature_fields(self):
        """Test that the signature has the correct fields."""
        signature = CairoQueryAnalysis

        # Check model fields exist
        assert "chat_history" in signature.model_fields
        assert "query" in signature.model_fields
        assert "search_queries" in signature.model_fields
        assert "resources" in signature.model_fields

        # Check field types
        chat_history_field = signature.model_fields["chat_history"]
        query_field = signature.model_fields["query"]
        search_terms_field = signature.model_fields["search_queries"]
        resources_field = signature.model_fields["resources"]

        assert chat_history_field.json_schema_extra["__dspy_field_type"] == "input"
        assert query_field.json_schema_extra["__dspy_field_type"] == "input"
        assert search_terms_field.json_schema_extra["__dspy_field_type"] == "output"
        assert resources_field.json_schema_extra["__dspy_field_type"] == "output"

    def test_field_descriptions(self):
        """Test that fields have meaningful descriptions."""
        signature = CairoQueryAnalysis

        chat_history_desc = signature.model_fields["chat_history"].json_schema_extra["desc"]
        query_desc = signature.model_fields["query"].json_schema_extra["desc"]
        search_queries_desc = signature.model_fields["search_queries"].json_schema_extra["desc"]
        resources_desc = signature.model_fields["resources"].json_schema_extra["desc"]

        assert "conversation context" in chat_history_desc.lower()
        assert "cairo" in query_desc.lower()
        assert "search queries" in search_queries_desc.lower()
        assert "documentation sources" in resources_desc.lower()

        # Check that resources field lists valid sources
        assert "cairo_book" in resources_desc
        assert "starknet_docs" in resources_desc
        assert "scarb_docs" in resources_desc
