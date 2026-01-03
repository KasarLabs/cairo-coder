"""Unit tests for RetrievalJudge module."""

from unittest.mock import AsyncMock, MagicMock

import dspy
import pytest

from cairo_coder.core.types import Document
from cairo_coder.dspy.retrieval_judge import RetrievalJudge
from cairo_coder.dspy.templates import CONTRACT_TEMPLATE_TITLE, TEST_TEMPLATE_TITLE


class TestRetrievalJudge:
    """Test RetrievalJudge functionality."""

    @pytest.fixture
    def sample_documents(self):
        """Create sample documents for testing."""
        return [
            Document(
                page_content="Cairo is a programming language for writing provable programs.",
                metadata={"title": "Cairo Introduction", "source": "cairo_book"},
            ),
            Document(
                page_content="Starknet is a Layer 2 network on Ethereum.",
                metadata={"title": "Starknet Overview", "source": "starknet_docs"},
            ),
            Document(
                page_content="Python is a high-level programming language.",
                metadata={"title": "Python Guide", "source": "python_docs"},
            ),
        ]

    @pytest.mark.asyncio
    async def test_retrieval_judge_initialization(self):
        """Test RetrievalJudge initialization."""
        judge = RetrievalJudge()
        assert judge.threshold == 0.4
        assert judge.parallel_threads == 5
        assert isinstance(judge.rater, dspy.Predict)

    @pytest.mark.asyncio
    async def test_aforward_empty_documents(self):
        """Test forward with empty document list."""
        judge = RetrievalJudge()
        prediction = await judge.acall("test query", [])
        assert isinstance(prediction, dspy.Prediction)
        assert prediction.documents == []

    @pytest.mark.asyncio
    async def test_aforward_with_mocked_rater(self, sample_documents):
        """Test forward method with mocked rater execution."""
        # Mock rater.acall to return per-document results
        judge = RetrievalJudge()
        judge.rater.acall = AsyncMock(side_effect=[
            MagicMock(resource_note=0.8, reasoning="Resource Cairo Introduction is highly relevant"),
            MagicMock(resource_note=0.3, reasoning="Resource Starknet Overview is somewhat relevant"),
            MagicMock(resource_note=0.1, reasoning="Resource Python Guide is not relevant"),
        ])

        documents = sample_documents
        prediction = await judge.acall("How to write Cairo programs?", documents)
        filtered_docs = prediction.documents

        # Assertions
        assert len(filtered_docs) == 1  # Only first doc passes threshold
        assert filtered_docs[0].metadata["llm_judge_score"] == 0.8
        assert "highly relevant" in filtered_docs[0].metadata["llm_judge_reason"]

        # rater.acall was invoked for each doc
        assert judge.rater.acall.await_count == 3

    @pytest.mark.asyncio
    async def test_forward_with_parse_error(self, sample_documents):
        """Test forward handling parse errors gracefully by dropping the invalid doc."""
        judge = RetrievalJudge()
        judge.rater.acall = AsyncMock(side_effect=[
            MagicMock(resource_note="invalid", reasoning="Some reasoning"),  # Invalid score
            MagicMock(resource_note=0.7, reasoning="Valid result"),
        ])
        documents = sample_documents[:2]
        prediction = await judge.acall("test query", documents)
        filtered_docs = prediction.documents

        # Should only keep the doc that was successfully parsed and scored above threshold.
        assert len(filtered_docs) == 1
        assert filtered_docs[0] is documents[1]  # Check it's the second document
        assert filtered_docs[0].metadata["llm_judge_score"] == 0.7

        # The doc that failed parsing should have error metadata but not be in the final list.
        assert "llm_judge_score" in documents[0].metadata
        assert documents[0].metadata["llm_judge_score"] == 0.0
        assert documents[0].metadata["llm_judge_reason"] == "Parse error"

    @pytest.mark.asyncio
    async def test_aforward_with_exception(self, sample_documents):
        """Test forward handling exceptions by returning all documents."""
        judge = RetrievalJudge()
        judge.rater.acall = AsyncMock(side_effect=Exception("Parallel execution failed"))
        documents = sample_documents
        prediction = await judge.acall("test query", documents)
        filtered_docs = prediction.documents

        # Should return all documents on failure
        assert len(filtered_docs) == len(documents)
        assert filtered_docs == documents

    @pytest.mark.asyncio
    async def test_aforward_with_contract_and_test_templates(self, sample_documents):
        """Test forward with contract template."""
        judge = RetrievalJudge()
        prediction = await judge.acall(
            "test query",
            [
                Document(
                    page_content="",
                    metadata={"title": CONTRACT_TEMPLATE_TITLE, "source": CONTRACT_TEMPLATE_TITLE},
                ),
                Document(
                    page_content="",
                    metadata={"title": TEST_TEMPLATE_TITLE, "source": TEST_TEMPLATE_TITLE},
                ),
            ],
        )
        result = prediction.documents
        assert result == [
            Document(
                page_content="",
                metadata={"title": CONTRACT_TEMPLATE_TITLE, "source": CONTRACT_TEMPLATE_TITLE},
            ),
            Document(
                page_content="",
                metadata={"title": TEST_TEMPLATE_TITLE, "source": TEST_TEMPLATE_TITLE},
            ),
        ]

    @pytest.mark.asyncio
    async def test_aforward_with_contract_template(self, sample_documents):
        """Test async forward with contract template."""
        judge = RetrievalJudge()
        prediction = await judge.acall(
            "test query",
            [
                Document(
                    page_content="",
                    metadata={"title": CONTRACT_TEMPLATE_TITLE, "source": CONTRACT_TEMPLATE_TITLE},
                ),
                Document(
                    page_content="",
                    metadata={"title": TEST_TEMPLATE_TITLE, "source": TEST_TEMPLATE_TITLE},
                ),
            ],
        )
        result = prediction.documents
        assert result == [
            Document(
                page_content="",
                metadata={"title": CONTRACT_TEMPLATE_TITLE, "source": CONTRACT_TEMPLATE_TITLE},
            ),
            Document(
                page_content="",
                metadata={"title": TEST_TEMPLATE_TITLE, "source": TEST_TEMPLATE_TITLE},
            ),
        ]


    @pytest.mark.asyncio
    async def test_score_clamping(self, sample_documents):
        """Test that scores are properly clamped to [0,1] range."""
        judge = RetrievalJudge()
        judge.rater.acall = AsyncMock(side_effect=[
            MagicMock(resource_note=1.5, reasoning="Score too high"),
            MagicMock(resource_note=-0.3, reasoning="Score too low"),
            MagicMock(resource_note=0.5, reasoning="Valid score"),
        ])
        documents = sample_documents
        prediction = await judge.acall("test", documents)
        filtered_docs = prediction.documents

        # Check scores are clamped and filtering works
        assert len(filtered_docs) == 2  # Only 2 docs pass threshold of 0.4

        # Check the scores of all documents (including filtered out ones)
        assert documents[0].metadata["llm_judge_score"] == 1.0  # Clamped from 1.5
        assert documents[1].metadata["llm_judge_score"] == 0.0  # Clamped from -0.3
        assert documents[2].metadata["llm_judge_score"] == 0.5  # Valid score

        # Check filtered docs only contain those above threshold
        assert all(doc.metadata["llm_judge_score"] >= 0.4 for doc in filtered_docs)

    def test_document_string_preparation(self):
        """Test document string preparation includes title and truncates content."""
        judge = RetrievalJudge()

        # Create document with long content
        long_content = "x" * 2000

        # Directly test the string builder
        doc_string = judge._document_to_string("Test Doc", long_content)
        assert "Title: Test Doc" in doc_string
        assert len(doc_string) < 1200  # Should be truncated
        assert doc_string.endswith("...")
