"""
Unit tests for GenerationProgram.

Tests the DSPy-based code generation functionality including Cairo code generation,
Scarb configuration, and MCP mode document formatting.
"""

from unittest.mock import AsyncMock, patch

import dspy
import pytest
from dspy.adapters.chat_adapter import AdapterParseError

from cairo_coder.agents.registry import AgentId
from cairo_coder.core.types import Message, Role
from cairo_coder.dspy.generation_program import (
    CairoCodeGeneration,
    GenerationProgram,
    ScarbGeneration,
    SkillGeneration,
    SkillGenerationProgram,
    create_generation_program,
    create_mcp_generation_program,
)


@pytest.fixture(scope="function")
def generation_program(mock_lm):
    """Create a GenerationProgram instance."""
    return GenerationProgram(program_type=AgentId.CAIRO_CODER)

class TestGenerationProgram:
    """Test suite for GenerationProgram."""

    @pytest.fixture
    def starknet_generation_program(self, mock_lm):
        """Create a Starknet-specific GenerationProgram instance."""
        return GenerationProgram(program_type=AgentId.STARKNET)

    @pytest.mark.asyncio
    async def test_general_code_generation(self, generation_program):
        """Test general Cairo code generation for both sync and async."""
        query = "How do I create a simple Cairo contract?"
        context = "Cairo contracts use #[starknet::contract] attribute..."

        result = await generation_program.acall(query, context)

        # Result should be a dspy.Predict object with an answer attribute
        assert hasattr(result, "answer")
        assert isinstance(result.answer, str)
        assert len(result.answer) > 0
        assert "cairo" in result.answer.lower()

        generation_program.generation_program.acall.assert_called_once()
        call_args = generation_program.generation_program.acall.call_args[1]
        assert call_args["query"] == query
        assert "cairo" in call_args["context"].lower()
        assert call_args["chat_history"] == ""

    @pytest.mark.asyncio
    async def test_generation_with_chat_history(self, generation_program):
        """Test code generation with chat history for both sync and async."""
        query = "How do I add storage to that contract?"
        context = "Storage variables are defined with #[storage]..."
        chat_history = "Previous conversation about contracts"

        result = await generation_program.acall(query, context, chat_history)

        # Result should be a dspy.Predict object with an answer attribute
        assert hasattr(result, "answer")
        assert isinstance(result.answer, str)
        assert len(result.answer) > 0

        # Verify chat history was passed to the mocked inner program
        assert generation_program.generation_program.acall.call_args[1]["chat_history"] == chat_history

    @pytest.mark.asyncio
    async def test_starknet_generation_program(self, starknet_generation_program):
        """Test Starknet-specific code generation for both sync and async."""
        with patch.object(
            starknet_generation_program, "generation_program"
        ) as mock_program:
            mock_program.acall = AsyncMock(return_value=dspy.Prediction(
                answer='Here\'s your Scarb configuration:\n\n```toml\n[package]\nname = "my-project"\nversion = "0.1.0"\n```'
            ))
            query = "How do I configure Scarb for my project?"
            context = "Scarb configuration documentation..."

            result = await starknet_generation_program.acall(query, context)

            # Result should be a dspy.Predict object with an answer attribute
            assert hasattr(result, "answer")
            assert isinstance(result.answer, str)
            assert (
                "scarb" in result.answer.lower() or "toml" in result.answer.lower()
            )
            mock_program.acall.assert_called_once()

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


class TestSkillGenerationProgram:
    """Test suite for SkillGenerationProgram."""

    @pytest.fixture
    def skill_program(self, mock_lm):
        """Create a SkillGenerationProgram instance."""
        return SkillGenerationProgram()

    @pytest.mark.asyncio
    async def test_skill_generation_program(self, skill_program):
        """Test async SKILL.md generation."""
        skill_output = """---
name: cairo-storage-patterns
description: Build Cairo storage modules with clear access patterns.
---

Use storage structs with dedicated read/write functions.
"""
        with patch.object(skill_program, "generation_program") as mock_program:
            mock_program.acall = AsyncMock(return_value=dspy.Prediction(skill=skill_output))
            result = await skill_program.acall(
                query="Create a skill for Cairo storage patterns",
                context="Storage variables use #[storage] and should have explicit accessors.",
            )

        assert result.skill == skill_output
        assert result.skill.startswith("---\nname:")
        assert "description:" in result.skill
        assert "\n---\n" in result.skill
        mock_program.acall.assert_called_once()

    def test_skill_generation_signature_fields(self):
        """Test that the signature has the expected fields."""
        signature = SkillGeneration

        assert "query" in signature.model_fields
        assert "context" in signature.model_fields
        assert "skill" in signature.model_fields

        query_field = signature.model_fields["query"]
        context_field = signature.model_fields["context"]
        skill_field = signature.model_fields["skill"]

        assert query_field.json_schema_extra["__dspy_field_type"] == "input"
        assert context_field.json_schema_extra["__dspy_field_type"] == "input"
        assert skill_field.json_schema_extra["__dspy_field_type"] == "output"

    @pytest.mark.asyncio
    async def test_skill_generation_empty_context(self, skill_program):
        """Test SKILL.md generation when no documents are retrieved."""
        empty_context = "No relevant documentation found."
        skill_output = """---
name: cairo-empty-context-skill
description: Handle empty retrieval context for skill generation.
---

Explain that no relevant docs were found and provide general guidance.
"""
        with patch.object(skill_program, "generation_program") as mock_program:
            mock_program.acall = AsyncMock(return_value=dspy.Prediction(skill=skill_output))
            result = await skill_program.acall(
                query="Generate a Cairo skill from available context",
                context=empty_context,
            )

        assert result.skill == skill_output
        mock_program.acall.assert_called_once_with(
            query="Generate a Cairo skill from available context",
            context=empty_context,
        )


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
        assert "the cairo code that solves" in answer_desc.lower()


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
        program = create_generation_program(AgentId.CAIRO_CODER)
        assert isinstance(program, GenerationProgram)
        assert program.program_type == AgentId.CAIRO_CODER.value

        # Test starknet program
        program = create_generation_program(AgentId.STARKNET)
        assert isinstance(program, GenerationProgram)
        assert program.program_type == AgentId.STARKNET.value

    def test_create_mcp_generation_program(self):
        """Test the MCP generation program factory function."""
        program = create_mcp_generation_program()
        assert isinstance(program, SkillGenerationProgram)


class TestForwardRetries:
    """Test suite for forward retry logic."""

    @pytest.mark.asyncio
    async def test_forward_retry_logic(self, generation_program):
        """Test that forward retries AdapterParseError up to 3 times."""
        # Mock the generation_program to raise AdapterParseError
        side_effect = [
            AdapterParseError(
                "Parse error 1", CairoCodeGeneration, "", "test response", None
            ),
            AdapterParseError(
                "Parse error 2", CairoCodeGeneration, "", "test response", None
            ),
            dspy.Prediction(answer="Success"),
        ]
        generation_program.generation_program.acall = AsyncMock(side_effect=side_effect)

        # Should succeed after 2 retries
        result = await generation_program.acall("test query", "test context")

        # Verify forward was called 3 times (2 failures + 1 success)
        assert generation_program.generation_program.acall.call_count == 3
        assert result is not None
        assert result.answer == "Success"

    @pytest.mark.asyncio
    async def test_forward_max_retries_exceeded(self, generation_program):
        """Test that forward raises AdapterParseError after max retries."""

        # Mock the generation_program to always raise AdapterParseError
        side_effect = [
            AdapterParseError(
                "Parse error", CairoCodeGeneration, "", "test response", None
            ),
            AdapterParseError(
                "Parse error", CairoCodeGeneration, "", "test response", None
            ),
            AdapterParseError(
                "Parse error", CairoCodeGeneration, "", "test response", None
            ),
            AdapterParseError(
                "Parse error", CairoCodeGeneration, "", "test response", None
            ),
        ]
        generation_program.generation_program.acall = AsyncMock(side_effect=side_effect)

        # Should raise after 3 attempts
        with pytest.raises(AdapterParseError):
            await generation_program.acall("test query", "test context")

            # Verify forward was called exactly 3 times
            assert generation_program.generation_program.acall.call_count == 3

    @pytest.mark.asyncio
    async def test_forward_other_exceptions_not_retried(self, generation_program):
        """Test that forward doesn't retry non-AdapterParseError exceptions."""

        # Mock the generation_program to raise a different exception
        side_effect = [
            ValueError("Some other error"),
        ]
        generation_program.generation_program.acall = AsyncMock(side_effect=side_effect)

        # Should raise immediately without retries
        with pytest.raises(ValueError):
            await generation_program.acall("test query", "test context")

        # Verify forward was called only once
        assert generation_program.generation_program.acall.call_count == 1


    @pytest.mark.asyncio
    async def test_should_extract_code_before_raising(self, generation_program):
        """Test that code is extracted before raising AdapterParseError."""
        # Mock the generation_program to raise AdapterParseError
        side_effect = [
            AdapterParseError(
                "Parse error", CairoCodeGeneration, "", "test response", None
            ),
            AdapterParseError(
                "Parse error", CairoCodeGeneration, "", "test response", None
            ),
            AdapterParseError(
                "Parse error", CairoCodeGeneration, "```cairo\nfn main() {}\n```", "test response", None
            ),
        ]
        generation_program.generation_program.acall = AsyncMock(side_effect=side_effect)

        response = await generation_program.acall("test query", "test context")
        assert response.answer == "\nfn main() {}\n"
