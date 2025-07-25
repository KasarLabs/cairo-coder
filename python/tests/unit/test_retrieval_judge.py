"""Unit tests for RetrievalJudge module."""

from unittest.mock import MagicMock, patch

import dspy
import pytest

from cairo_coder.core.types import Document
from cairo_coder.dspy.document_retriever import CONTRACT_TEMPLATE_TITLE, TEST_TEMPLATE_TITLE
from cairo_coder.dspy.retrieval_judge import RetrievalJudge


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

    def test_retrieval_judge_initialization(self):
        """Test RetrievalJudge initialization."""
        judge = RetrievalJudge(threshold=0.5, parallel_threads=5)
        assert judge.threshold == 0.5
        assert judge.parallel_threads == 5
        assert isinstance(judge.rater, dspy.Predict)

    def test_forward_empty_documents(self):
        """Test forward with empty document list."""
        judge = RetrievalJudge()
        result = judge.forward("test query", [])
        assert result == []

    @patch("dspy.Parallel")
    def test_forward_with_mocked_parallel(self, mock_parallel_class, sample_documents):
        """Test forward method with mocked parallel execution."""
        # Setup mock
        mock_parallel_instance = MagicMock()
        mock_parallel_class.return_value = mock_parallel_instance

        # Create mock results
        mock_results = [
            MagicMock(
                resource_note=0.8, reasoning="Resource Cairo Introduction is highly relevant"
            ),
            MagicMock(
                resource_note=0.3, reasoning="Resource Starknet Overview is somewhat relevant"
            ),
            MagicMock(resource_note=0.1, reasoning="Resource Python Guide is not relevant"),
        ]
        mock_parallel_instance.return_value = mock_results

        # Test
        judge = RetrievalJudge(threshold=0.4)
        documents = sample_documents
        filtered_docs = judge.forward("How to write Cairo programs?", documents)

        # Assertions
        assert len(filtered_docs) == 1  # Only first doc passes threshold
        assert filtered_docs[0].metadata["llm_judge_score"] == 0.8
        assert "highly relevant" in filtered_docs[0].metadata["llm_judge_reason"]

        # Verify parallel was called correctly
        mock_parallel_class.assert_called_once_with(num_threads=5)
        mock_parallel_instance.assert_called_once()

    @patch("dspy.Parallel")
    def test_forward_with_parse_error(self, mock_parallel_class, sample_documents):
        """Test forward handling parse errors gracefully by dropping the invalid doc."""
        # Setup mock
        mock_parallel_instance = MagicMock()
        mock_parallel_class.return_value = mock_parallel_instance

        # Create results with parse error
        mock_results = [
            MagicMock(resource_note="invalid", reasoning="Some reasoning"),  # Invalid score
            MagicMock(resource_note=0.7, reasoning="Valid result"),
        ]
        mock_parallel_instance.return_value = mock_results

        # Test
        judge = RetrievalJudge(threshold=0.5)
        documents = sample_documents[:2]
        filtered_docs = judge.forward("test query", documents)

        # Should only keep the doc that was successfully parsed and scored above threshold.
        assert len(filtered_docs) == 1
        assert filtered_docs[0] is documents[1]  # Check it's the second document
        assert filtered_docs[0].metadata["llm_judge_score"] == 0.7

        # The document that failed parsing should have error metadata but not be in the final list.
        assert "llm_judge_score" in documents[0].metadata
        assert documents[0].metadata["llm_judge_score"] == 0.0
        assert documents[0].metadata["llm_judge_reason"] == "Parse error"

    @patch("dspy.Parallel")
    def test_forward_with_exception(self, mock_parallel_class, sample_documents):
        """Test forward handling exceptions by returning all documents."""
        # Setup mock to raise exception
        mock_parallel_class.side_effect = Exception("Parallel execution failed")

        # Test
        judge = RetrievalJudge()
        documents = sample_documents
        filtered_docs = judge.forward("test query", documents)

        # Should return all documents on failure
        assert len(filtered_docs) == len(documents)
        assert filtered_docs == documents

    @pytest.mark.asyncio
    async def test_aforward_empty_documents(self):
        """Test async forward with empty document list."""
        judge = RetrievalJudge()
        result = await judge.aforward("test query", [])
        assert result == []

    def test_forward_with_contract_and_test_templates(self, sample_documents):
        """Test forward with contract template."""
        judge = RetrievalJudge()
        result = judge.forward(
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
        result = await judge.aforward(
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
    async def test_aforward_with_mocked_rater(self, sample_documents):
        """Test async forward method with mocked rater."""
        judge = RetrievalJudge(threshold=0.5)

        # Mock the rater's acall method
        async def mock_acall(**kwargs):
            # Return different scores based on document content
            if "Cairo" in kwargs["system_resource"]:
                return MagicMock(resource_note=0.9, reasoning="Highly relevant to Cairo")
            if "Starknet" in kwargs["system_resource"]:
                return MagicMock(resource_note=0.6, reasoning="Somewhat relevant")
            return MagicMock(resource_note=0.2, reasoning="Not relevant")

        judge.rater.acall = mock_acall

        # Test
        documents = sample_documents
        filtered_docs = await judge.aforward("Cairo programming query", documents)

        # Should filter out Python doc (score 0.2 < threshold 0.5)
        assert len(filtered_docs) == 2
        assert all(doc.metadata["llm_judge_score"] >= 0.5 for doc in filtered_docs)

    @pytest.mark.asyncio
    async def test_aforward_with_exception(self, sample_documents):
        """Test async forward handling exceptions during judgment of a single document."""
        judge = RetrievalJudge(threshold=0.5)

        # Mock rater to raise exception for one document
        async def mock_acall(**kwargs):
            if "Starknet" in kwargs["system_resource"]:
                raise Exception("LLM call failed")
            return MagicMock(resource_note=0.9, reasoning="Highly relevant")

        judge.rater.acall = mock_acall

        # Test
        documents = sample_documents[:2]  # Using two docs for the test
        filtered_docs = await judge.aforward("test query", documents)

        # Should keep the document that was judged successfully and drop the one with an error.
        assert len(filtered_docs) == 1
        assert filtered_docs[0] is documents[0]
        assert "llm_judge_reason" in documents[1].metadata
        assert documents[1].metadata["llm_judge_reason"] == "Error during judgment"

    def test_score_clamping(self, sample_documents):
        """Test that scores are properly clamped to [0,1] range."""
        judge = RetrievalJudge()

        # Mock parallel execution with out-of-range scores
        with patch("dspy.Parallel") as mock_parallel_class:
            mock_parallel_instance = MagicMock()
            mock_parallel_class.return_value = mock_parallel_instance

            mock_results = [
                MagicMock(resource_note=1.5, reasoning="Score too high"),
                MagicMock(resource_note=-0.3, reasoning="Score too low"),
                MagicMock(resource_note=0.5, reasoning="Valid score"),
            ]
            mock_parallel_instance.return_value = mock_results

            documents = sample_documents
            filtered_docs = judge.forward("test", documents)

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
        doc = Document(page_content=long_content, metadata={"title": "Test Doc"})

        with patch("dspy.Parallel") as mock_parallel_class:
            mock_parallel_instance = MagicMock()
            mock_parallel_class.return_value = mock_parallel_instance
            mock_parallel_instance.return_value = [MagicMock(resource_note=0.5, reasoning="test")]

            judge.forward("test", [doc])

            # Get the batches that were created
            call_args = mock_parallel_instance.call_args[0][0]
            example = call_args[0][1]

            # Check document string format
            doc_string = example.system_resource
            assert "Title: Test Doc" in doc_string
            assert len(doc_string) < 1200  # Should be truncated
            assert doc_string.endswith("...")
