"""
Unit tests for GenerationProgram.

Tests the DSPy-based code generation functionality including Cairo code generation,
Scarb configuration, and MCP mode document formatting.
"""

import pytest
from unittest.mock import Mock, patch
import asyncio

import dspy

from cairo_coder.core.types import Document, Message
from cairo_coder.dspy.generation_program import (
    GenerationProgram, 
    McpGenerationProgram,
    CairoCodeGeneration,
    ScarbGeneration,
    create_generation_program,
    create_mcp_generation_program,
    load_optimized_programs
)


class TestGenerationProgram:
    """Test suite for GenerationProgram."""
    
    @pytest.fixture
    def mock_lm(self):
        """Configure DSPy with a mock language model for testing."""
        mock = Mock()
        mock.return_value = dspy.Prediction(
            answer="Here's a Cairo contract example:\n\n```cairo\n#[starknet::contract]\nmod SimpleContract {\n    // Contract implementation\n}\n```\n\nThis contract demonstrates basic Cairo syntax."
        )
        
        with patch('dspy.ChainOfThought') as mock_cot:
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
                    'source': 'cairo_book',
                    'title': 'Cairo Contracts',
                    'url': 'https://book.cairo-lang.org/contracts',
                    'source_display': 'Cairo Book'
                }
            ),
            Document(
                page_content="Storage variables are defined with #[storage] attribute.",
                metadata={
                    'source': 'starknet_docs',
                    'title': 'Storage Variables',
                    'url': 'https://docs.starknet.io/storage',
                    'source_display': 'Starknet Documentation'
                }
            )
        ]
    
    def test_general_code_generation(self, generation_program):
        """Test general Cairo code generation."""
        query = "How do I create a simple Cairo contract?"
        context = "Cairo contracts use #[starknet::contract] attribute..."
        
        result = generation_program.forward(query, context)
        
        assert isinstance(result, str)
        assert len(result) > 0
        assert "cairo" in result.lower()
        
        # Verify the generation program was called with correct parameters
        generation_program.generation_program.assert_called_once()
        call_args = generation_program.generation_program.call_args[1]
        assert call_args['query'] == query
        assert "cairo" in call_args['context'].lower()
        assert call_args['chat_history'] == ""
    
    def test_generation_with_chat_history(self, generation_program):
        """Test code generation with chat history."""
        query = "How do I add storage to that contract?"
        context = "Storage variables are defined with #[storage]..."
        chat_history = "Previous conversation about contracts"
        
        result = generation_program.forward(query, context, chat_history)
        
        assert isinstance(result, str)
        assert len(result) > 0
        
        # Verify chat history was passed
        call_args = generation_program.generation_program.call_args[1]
        assert call_args['chat_history'] == chat_history
    
    def test_contract_context_enhancement(self, generation_program):
        """Test context enhancement for contract-related queries."""
        query = "How do I create a contract with storage?"
        context = "Basic Cairo documentation..."
        
        result = generation_program.forward(query, context)
        
        # Verify contract template was added to context
        call_args = generation_program.generation_program.call_args[1]
        enhanced_context = call_args['context']
        assert "starknet::contract" in enhanced_context
        assert "#[storage]" in enhanced_context
        assert "external(v0)" in enhanced_context
    
    def test_test_context_enhancement(self, generation_program):
        """Test context enhancement for test-related queries."""
        query = "How do I write tests for Cairo contracts?"
        context = "Testing documentation..."
        
        result = generation_program.forward(query, context)
        
        # Verify test template was added to context
        call_args = generation_program.generation_program.call_args[1]
        enhanced_context = call_args['context']
        assert "#[test]" in enhanced_context
        assert "assert" in enhanced_context
        assert "test functions" in enhanced_context
    
    def test_scarb_generation_program(self, scarb_generation_program):
        """Test Scarb-specific code generation."""
        with patch.object(scarb_generation_program, 'generation_program') as mock_program:
            mock_program.return_value = dspy.Prediction(
                answer="Here's your Scarb configuration:\n\n```toml\n[package]\nname = \"my-project\"\nversion = \"0.1.0\"\n```"
            )
            
            query = "How do I configure Scarb for my project?"
            context = "Scarb configuration documentation..."
            
            result = scarb_generation_program.forward(query, context)
            
            assert isinstance(result, str)
            assert "scarb" in result.lower() or "toml" in result.lower()
            mock_program.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_streaming_generation(self, generation_program):
        """Test streaming code generation."""
        query = "How do I create a Cairo contract?"
        context = "Cairo contract documentation..."
        
        chunks = []
        async for chunk in generation_program.forward_streaming(query, context):
            chunks.append(chunk)
        
        # Verify streaming produces chunks
        assert len(chunks) > 0
        assert all(isinstance(chunk, str) for chunk in chunks)
        
        # Verify complete response can be reconstructed
        complete_response = "".join(chunks)
        assert len(complete_response) > 0
    
    @pytest.mark.asyncio
    async def test_streaming_with_chat_history(self, generation_program):
        """Test streaming generation with chat history."""
        query = "Add storage to that contract"
        context = "Storage documentation..."
        chat_history = "Previous: How to create contracts"
        
        chunks = []
        async for chunk in generation_program.forward_streaming(query, context, chat_history):
            chunks.append(chunk)
        
        assert len(chunks) > 0
        
        # Verify the generation program was called with chat history
        call_args = generation_program.generation_program.call_args[1]
        assert call_args['chat_history'] == chat_history
    
    @pytest.mark.asyncio
    async def test_streaming_error_handling(self, generation_program):
        """Test error handling in streaming generation."""
        with patch.object(generation_program, 'generation_program') as mock_program:
            mock_program.side_effect = Exception("Generation error")
            
            query = "How do I create a contract?"
            context = "Documentation..."
            
            chunks = []
            async for chunk in generation_program.forward_streaming(query, context):
                chunks.append(chunk)
            
            # Should yield error message
            assert len(chunks) == 1
            assert "error" in chunks[0].lower()
    
    def test_format_chat_history(self, generation_program):
        """Test chat history formatting."""
        messages = [
            Message(role="user", content="How do I create a contract?"),
            Message(role="assistant", content="Here's how to create a contract..."),
            Message(role="user", content="How do I add storage?"),
            Message(role="assistant", content="Storage is added with #[storage]..."),
            Message(role="user", content="Can I add events?"),
            Message(role="assistant", content="Yes, events are defined with..."),
        ]
        
        formatted = generation_program._format_chat_history(messages)
        
        assert "User:" in formatted
        assert "Assistant:" in formatted
        assert "contract" in formatted
        assert "storage" in formatted
        
        # Should limit to last 5 messages
        lines = formatted.split('\n')
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
                    'source': 'cairo_book',
                    'title': 'Cairo Contracts',
                    'url': 'https://book.cairo-lang.org/contracts',
                    'source_display': 'Cairo Book'
                }
            ),
            Document(
                page_content="Storage variables are defined with #[storage] attribute.",
                metadata={
                    'source': 'starknet_docs',
                    'title': 'Storage Variables',
                    'url': 'https://docs.starknet.io/storage',
                    'source_display': 'Starknet Documentation'
                }
            )
        ]
    
    def test_mcp_document_formatting(self, mcp_program, sample_documents):
        """Test MCP mode document formatting."""
        result = mcp_program.forward(sample_documents)
        
        assert isinstance(result, str)
        assert len(result) > 0
        
        # Verify document structure
        assert "## 1. Cairo Contracts" in result
        assert "## 2. Storage Variables" in result
        assert "**Source:** Cairo Book" in result
        assert "**Source:** Starknet Documentation" in result
        assert "**URL:** https://book.cairo-lang.org/contracts" in result
        assert "**URL:** https://docs.starknet.io/storage" in result
        
        # Verify content is included
        assert "starknet::contract" in result
        assert "#[storage]" in result
    
    def test_mcp_empty_documents(self, mcp_program):
        """Test MCP mode with empty documents."""
        result = mcp_program.forward([])
        
        assert result == "No relevant documentation found."
    
    def test_mcp_documents_with_missing_metadata(self, mcp_program):
        """Test MCP mode with documents missing metadata."""
        documents = [
            Document(
                page_content="Some Cairo content",
                metadata={}  # Missing metadata
            )
        ]
        
        result = mcp_program.forward(documents)
        
        assert isinstance(result, str)
        assert "Some Cairo content" in result
        assert "Document 1" in result  # Default title
        assert "Unknown Source" in result  # Default source
        assert "**URL:** #" in result  # Default URL


class TestCairoCodeGeneration:
    """Test suite for CairoCodeGeneration signature."""
    
    def test_signature_fields(self):
        """Test that the signature has the correct fields."""
        signature = CairoCodeGeneration
        
        # Check model fields exist
        assert 'chat_history' in signature.model_fields
        assert 'query' in signature.model_fields
        assert 'context' in signature.model_fields
        assert 'answer' in signature.model_fields
        
        # Check field types
        chat_history_field = signature.model_fields['chat_history']
        query_field = signature.model_fields['query']
        context_field = signature.model_fields['context']
        answer_field = signature.model_fields['answer']
        
        assert chat_history_field.json_schema_extra['__dspy_field_type'] == 'input'
        assert query_field.json_schema_extra['__dspy_field_type'] == 'input'
        assert context_field.json_schema_extra['__dspy_field_type'] == 'input'
        assert answer_field.json_schema_extra['__dspy_field_type'] == 'output'
    
    def test_field_descriptions(self):
        """Test that fields have meaningful descriptions."""
        signature = CairoCodeGeneration
        
        chat_history_desc = signature.model_fields['chat_history'].json_schema_extra['desc']
        query_desc = signature.model_fields['query'].json_schema_extra['desc']
        context_desc = signature.model_fields['context'].json_schema_extra['desc']
        answer_desc = signature.model_fields['answer'].json_schema_extra['desc']
        
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
        assert 'chat_history' in signature.model_fields
        assert 'query' in signature.model_fields
        assert 'context' in signature.model_fields
        assert 'answer' in signature.model_fields
        
        # Check field types
        answer_field = signature.model_fields['answer']
        assert answer_field.json_schema_extra['__dspy_field_type'] == 'output'
    
    def test_field_descriptions(self):
        """Test that fields have meaningful descriptions."""
        signature = ScarbGeneration
        
        query_desc = signature.model_fields['query'].json_schema_extra['desc']
        context_desc = signature.model_fields['context'].json_schema_extra['desc']
        answer_desc = signature.model_fields['answer'].json_schema_extra['desc']
        
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
    
    def test_load_optimized_programs(self):
        """Test loading optimized programs."""
        with patch('os.path.exists') as mock_exists:
            mock_exists.return_value = False  # No optimized programs exist
            
            programs = load_optimized_programs("test_dir")
            
            # Should return fallback programs
            assert 'general_generation' in programs
            assert 'scarb_generation' in programs
            assert 'mcp_generation' in programs
            
            assert isinstance(programs['general_generation'], GenerationProgram)
            assert isinstance(programs['scarb_generation'], GenerationProgram)
            assert isinstance(programs['mcp_generation'], McpGenerationProgram)
    
    def test_load_optimized_programs_with_files(self):
        """Test loading optimized programs when files exist."""
        with patch('os.path.exists') as mock_exists, \
             patch('dspy.load') as mock_load:
            
            mock_exists.return_value = True
            mock_load.return_value = Mock()  # Mock loaded program
            
            programs = load_optimized_programs("test_dir")
            
            # Should load optimized programs
            assert mock_load.call_count == 3
            assert 'general_generation' in programs
            assert 'scarb_generation' in programs
            assert 'mcp_generation' in programs
    
    def test_load_optimized_programs_with_errors(self):
        """Test loading optimized programs with load errors."""
        with patch('os.path.exists') as mock_exists, \
             patch('dspy.load') as mock_load:
            
            mock_exists.return_value = True
            mock_load.side_effect = Exception("Load error")
            
            programs = load_optimized_programs("test_dir")
            
            # Should fallback to default programs on error
            assert isinstance(programs['general_generation'], GenerationProgram)
            assert isinstance(programs['scarb_generation'], GenerationProgram)
            assert isinstance(programs['mcp_generation'], McpGenerationProgram)