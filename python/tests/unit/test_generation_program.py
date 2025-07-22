"""
Unit tests for GenerationProgram.

Tests the DSPy-based code generation functionality including Cairo code generation,
Scarb configuration, and MCP mode document formatting.
"""

from unittest.mock import AsyncMock, Mock, patch

import dspy
import pytest

from cairo_coder.core.types import Document, Message, Role
from cairo_coder.dspy.generation_program import (
    CairoCodeGeneration,
    GenerationProgram,
    McpGenerationProgram,
    ScarbGeneration,
    create_generation_program,
    create_mcp_generation_program,
)


class TestGenerationProgram:
    """Test suite for GenerationProgram."""

    @pytest.fixture
    def mock_lm(self):
        """Configure DSPy with a mock language model for testing."""
        mock = Mock()
        # Mock for sync calls
        mock.return_value = dspy.Prediction(
            answer="Here's a Cairo contract example:\n\n```cairo\n#[starknet::contract]\nmod SimpleContract {\n    // Contract implementation\n}\n```\n\nThis contract demonstrates basic Cairo syntax."
        )
        # Mock for async calls
        mock.aforward = AsyncMock(return_value=dspy.Prediction(
            answer="Here's a Cairo contract example:\n\n```cairo\n#[starknet::contract]\nmod SimpleContract {\n    // Contract implementation\n}\n```\n\nThis contract demonstrates basic Cairo syntax."
        ))

        with patch("dspy.ChainOfThought") as mock_cot:
            mock_cot.return_value = mock
            yield mock

    @pytest.fixture
    def generation_program(self, mock_lm):
        """Create a GenerationProgram instance."""
        return GenerationProgram(program_type="general")

    @pytest.fixture
    def scarb_generation_program(self, mock_lm):
        """Create a Scarb-specific GenerationProgram instance."""
        return GenerationProgram(program_type="scarb")

    @pytest.fixture
    def mcp_generation_program(self):
        """Create an MCP GenerationProgram instance."""
        return McpGenerationProgram()

    @pytest.fixture
    def sample_documents(self):
        """Create sample documents for testing."""
        return [
            Document(
                page_content="Cairo contracts are defined using #[starknet::contract] attribute.",
                metadata={
                    "source": "cairo_book",
                    "title": "Cairo Contracts",
                    "url": "https://book.cairo-lang.org/contracts",
                    "source_display": "Cairo Book",
                },
            ),
            Document(
                page_content="Storage variables are defined with #[storage] attribute.",
                metadata={
                    "source": "starknet_docs",
                    "title": "Storage Variables",
                    "url": "https://docs.starknet.io/storage",
                    "source_display": "Starknet Documentation",
                },
            ),
        ]

    def test_general_code_generation(self, generation_program):
        """Test general Cairo code generation."""
        query = "How do I create a simple Cairo contract?"
        context = "Cairo contracts use #[starknet::contract] attribute..."

        result = generation_program.forward(query, context)

        # Result should be a dspy.Predict object with an answer attribute
        assert hasattr(result, "answer")
        assert isinstance(result.answer, str)
        assert len(result.answer) > 0
        assert "cairo" in result.answer.lower()

        # Verify the generation program was called with correct parameters
        generation_program.generation_program.aforward.assert_called_once()
        call_args = generation_program.generation_program.aforward.call_args[1]
        assert call_args["query"] == query
        assert "cairo" in call_args["context"].lower()
        assert call_args["chat_history"] == ""

    def test_generation_with_chat_history(self, generation_program):
        """Test code generation with chat history."""
        query = "How do I add storage to that contract?"
        context = "Storage variables are defined with #[storage]..."
        chat_history = "Previous conversation about contracts"

        result = generation_program.forward(query, context, chat_history)

        # Result should be a dspy.Predict object with an answer attribute
        assert hasattr(result, "answer")
        assert isinstance(result.answer, str)
        assert len(result.answer) > 0

        # Verify chat history was passed
        call_args = generation_program.generation_program.aforward.call_args[1]
        assert call_args["chat_history"] == chat_history

    def test_scarb_generation_program(self, scarb_generation_program):
        """Test Scarb-specific code generation."""
        with patch.object(scarb_generation_program, "generation_program") as mock_program:
            mock_program.aforward = AsyncMock(return_value=dspy.Prediction(
                answer='Here\'s your Scarb configuration:\n\n```toml\n[package]\nname = "my-project"\nversion = "0.1.0"\n```'
            ))

            query = "How do I configure Scarb for my project?"
            context = "Scarb configuration documentation..."

            result = scarb_generation_program.forward(query, context)

            # Result should be a dspy.Predict object with an answer attribute
            assert hasattr(result, "answer")
            assert isinstance(result.answer, str)
            assert "scarb" in result.answer.lower() or "toml" in result.answer.lower()
            mock_program.aforward.assert_called_once()

    def test_format_chat_history(self, generation_program):
        """Test chat history formatting."""
        messages = [
            Message(role=Role.USER, content="How do I create a contract?"),
            Message(role=Role.ASSISTANT, content="Here's how to create a contract..."),
            Message(role=Role.USER, content="How do I add storage?"),
            Message(role=Role.ASSISTANT, content="Storage is added with #[storage]..."),
            Message(role=Role.USER, content="Can I add events?"),
            Message(role=Role.ASSISTANT, content="Yes, events are defined with..."),
        ]

        formatted = generation_program._format_chat_history(messages)

        assert "User:" in formatted
        assert "Assistant:" in formatted
        assert "contract" in formatted
        assert "storage" in formatted

        # Should limit to last 5 messages
        lines = formatted.split("\n")
        assert len(lines) <= 5

    def test_format_empty_chat_history(self, generation_program):
        """Test formatting empty chat history."""
        formatted = generation_program._format_chat_history([])
        assert formatted == ""

        formatted = generation_program._format_chat_history(None)
        assert formatted == ""


class TestMcpGenerationProgram:
    """Test suite for McpGenerationProgram."""

    @pytest.fixture
    def mcp_program(self):
        """Create an MCP GenerationProgram instance."""
        return McpGenerationProgram()

    @pytest.fixture
    def sample_documents(self):
        """Create sample documents for testing."""
        return [
            Document(
                page_content="Cairo contracts are defined using #[starknet::contract] attribute.",
                metadata={
                    "source": "cairo_book",
                    "title": "Cairo Contracts",
                    "url": "https://book.cairo-lang.org/contracts",
                    "source_display": "Cairo Book",
                },
            ),
            Document(
                page_content="Storage variables are defined with #[storage] attribute.",
                metadata={
                    "source": "starknet_docs",
                    "title": "Storage Variables",
                    "url": "https://docs.starknet.io/storage",
                    "source_display": "Starknet Documentation",
                },
            ),
        ]

    def test_mcp_document_formatting(self, mcp_program, sample_documents):
        """Test MCP mode document formatting."""
        answer = mcp_program.forward(sample_documents).answer

        assert isinstance(answer, str)
        assert len(answer) > 0

        # Verify document structure
        assert "## 1. Cairo Contracts" in answer
        assert "## 2. Storage Variables" in answer
        assert "**Source:** Cairo Book" in answer
        assert "**Source:** Starknet Documentation" in answer
        assert "**URL:** https://book.cairo-lang.org/contracts" in answer
        assert "**URL:** https://docs.starknet.io/storage" in answer

        # Verify content is included
        assert "starknet::contract" in answer
        assert "#[storage]" in answer

    def test_mcp_empty_documents(self, mcp_program):
        """Test MCP mode with empty documents."""
        result = mcp_program.forward([])

        assert result.answer == "No relevant documentation found."

    def test_mcp_documents_with_missing_metadata(self, mcp_program):
        """Test MCP mode with documents missing metadata."""
        documents = [Document(page_content="Some Cairo content", metadata={})]  # Missing metadata

        answer = mcp_program.forward(documents).answer

        assert isinstance(answer, str)
        assert "Some Cairo content" in answer
        assert "Document 1" in answer  # Default title
        assert "Unknown Source" in answer  # Default source
        assert "**URL:** #" in answer  # Default URL


class TestCairoCodeGeneration:
    """Test suite for CairoCodeGeneration signature."""

    def test_signature_fields(self):
        """Test that the signature has the correct fields."""
        signature = CairoCodeGeneration

        # Check model fields exist
        assert "chat_history" in signature.model_fields
        assert "query" in signature.model_fields
        assert "context" in signature.model_fields
        assert "answer" in signature.model_fields

        # Check field types
        chat_history_field = signature.model_fields["chat_history"]
        query_field = signature.model_fields["query"]
        context_field = signature.model_fields["context"]
        answer_field = signature.model_fields["answer"]

        assert chat_history_field.json_schema_extra["__dspy_field_type"] == "input"
        assert query_field.json_schema_extra["__dspy_field_type"] == "input"
        assert context_field.json_schema_extra["__dspy_field_type"] == "input"
        assert answer_field.json_schema_extra["__dspy_field_type"] == "output"

    def test_field_descriptions(self):
        """Test that fields have meaningful descriptions."""
        signature = CairoCodeGeneration

        chat_history_desc = signature.model_fields["chat_history"].json_schema_extra["desc"]
        query_desc = signature.model_fields["query"].json_schema_extra["desc"]
        context_desc = signature.model_fields["context"].json_schema_extra["desc"]
        answer_desc = signature.model_fields["answer"].json_schema_extra["desc"]

        assert "conversation context" in chat_history_desc.lower()
        assert "cairo" in query_desc.lower()
        assert "documentation" in context_desc.lower()
        assert "cairo code" in answer_desc.lower()
        assert "explanations" in answer_desc.lower()


class TestScarbGeneration:
    """Test suite for ScarbGeneration signature."""

    def test_signature_fields(self):
        """Test that the signature has the correct fields."""
        signature = ScarbGeneration

        # Check model fields exist
        assert "chat_history" in signature.model_fields
        assert "query" in signature.model_fields
        assert "context" in signature.model_fields
        assert "answer" in signature.model_fields

        # Check field types
        answer_field = signature.model_fields["answer"]
        assert answer_field.json_schema_extra["__dspy_field_type"] == "output"

    def test_field_descriptions(self):
        """Test that fields have meaningful descriptions."""
        signature = ScarbGeneration

        query_desc = signature.model_fields["query"].json_schema_extra["desc"]
        context_desc = signature.model_fields["context"].json_schema_extra["desc"]
        answer_desc = signature.model_fields["answer"].json_schema_extra["desc"]

        assert "scarb" in query_desc.lower()
        assert "scarb" in context_desc.lower()
        assert "scarb" in answer_desc.lower()
        assert "toml" in answer_desc.lower()


class TestFactoryFunctions:
    """Test suite for factory functions."""

    def test_create_generation_program(self):
        """Test the generation program factory function."""
        # Test general program
        program = create_generation_program("general")
        assert isinstance(program, GenerationProgram)
        assert program.program_type == "general"

        # Test scarb program
        program = create_generation_program("scarb")
        assert isinstance(program, GenerationProgram)
        assert program.program_type == "scarb"

        # Test default program
        program = create_generation_program()
        assert isinstance(program, GenerationProgram)
        assert program.program_type == "general"

    def test_create_mcp_generation_program(self):
        """Test the MCP generation program factory function."""
        program = create_mcp_generation_program()
        assert isinstance(program, McpGenerationProgram)
