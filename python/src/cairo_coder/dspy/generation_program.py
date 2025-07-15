"""
DSPy Generation Program for Cairo Coder.

This module implements the GenerationProgram that generates Cairo code responses
based on user queries and retrieved documentation context.
"""

from typing import List, Optional, AsyncGenerator
import asyncio

import dspy
from dspy import InputField, OutputField, Signature

from cairo_coder.core.types import Document, Message, StreamEvent


class CairoCodeGeneration(Signature):
    """
    Generate Cairo smart contract code based on context and user query.
    
    This signature defines the input-output interface for the code generation step
    of the RAG pipeline, focusing on Cairo/Starknet development.
    """
    
    chat_history: Optional[str] = InputField(
        desc="Previous conversation context for continuity and better understanding",
        default=""
    )
    
    query: str = InputField(
        desc="User's specific Cairo programming question or request for code generation"
    )
    
    context: str = InputField(
        desc="Retrieved Cairo documentation, examples, and relevant information to inform the response"
    )
    
    answer: str = OutputField(
        desc="Complete Cairo code solution with explanations, following Cairo syntax and best practices. Include code examples, explanations, and step-by-step guidance."
    )


class ScarbGeneration(Signature):
    """
    Generate Scarb configuration, commands, and troubleshooting guidance.
    
    This signature is specialized for Scarb build tool related queries.
    """
    
    chat_history: Optional[str] = InputField(
        desc="Previous conversation context",
        default=""
    )
    
    query: str = InputField(
        desc="User's Scarb-related question or request"
    )
    
    context: str = InputField(
        desc="Scarb documentation and examples relevant to the query"
    )
    
    answer: str = OutputField(
        desc="Scarb commands, TOML configurations, or troubleshooting steps with proper formatting and explanations"
    )


class GenerationProgram(dspy.Module):
    """
    DSPy module for generating Cairo code responses from retrieved context.
    
    This module uses Chain of Thought reasoning to produce high-quality Cairo code
    and explanations based on user queries and documentation context.
    """
    
    def __init__(self, program_type: str = "general"):
        """
        Initialize the GenerationProgram.
        
        Args:
            program_type: Type of generation program ("general" or "scarb")
        """
        super().__init__()
        self.program_type = program_type
        
        # Initialize the appropriate generation program
        if program_type == "scarb":
            self.generation_program = dspy.ChainOfThought(
                ScarbGeneration,
                rationale_field=dspy.OutputField(
                    prefix="Reasoning: Let me analyze the Scarb requirements step by step.",
                    desc="Step-by-step analysis of the Scarb task and solution approach"
                )
            )
        else:
            self.generation_program = dspy.ChainOfThought(
                CairoCodeGeneration,
                rationale_field=dspy.OutputField(
                    prefix="Reasoning: Let me analyze the Cairo requirements step by step.",
                    desc="Step-by-step analysis of the Cairo programming task and solution approach"
                )
            )
        
        # Templates for different types of requests
        self.contract_template = """
When generating Cairo contract code, follow these guidelines:
1. Use proper Cairo syntax and imports
2. Include #[starknet::contract] attribute for contracts
3. Define storage variables with #[storage] attribute
4. Use #[external(v0)] for external functions
5. Use #[view] for read-only functions
6. Include proper error handling
7. Add clear comments explaining the code
8. Follow Cairo naming conventions (snake_case)
"""
        
        self.test_template = """
When generating Cairo test code, follow these guidelines:
1. Use #[test] attribute for test functions
2. Include necessary imports (assert, testing utilities)
3. Use descriptive test names that explain what is being tested
4. Include setup and teardown code if needed
5. Test both success and failure cases
6. Use proper assertion methods
7. Add comments explaining test scenarios
"""
    
    def forward(self, query: str, context: str, chat_history: Optional[str] = None) -> str:
        """
        Generate Cairo code response based on query and context.
        
        Args:
            query: User's Cairo programming question
            context: Retrieved documentation and examples
            chat_history: Previous conversation context (optional)
            
        Returns:
            Generated Cairo code response with explanations
        """
        if chat_history is None:
            chat_history = ""
        
        # Enhance context with appropriate template
        enhanced_context = self._enhance_context(query, context)
        
        # Execute the generation program
        result = self.generation_program(
            query=query,
            context=enhanced_context,
            chat_history=chat_history
        )
        
        return result.answer
    
    async def forward_streaming(self, query: str, context: str, 
                              chat_history: Optional[str] = None) -> AsyncGenerator[str, None]:
        """
        Generate Cairo code response with streaming support.
        
        Args:
            query: User's Cairo programming question
            context: Retrieved documentation and examples
            chat_history: Previous conversation context (optional)
            
        Yields:
            Chunks of the generated response
        """
        if chat_history is None:
            chat_history = ""
        
        # Enhance context with appropriate template
        enhanced_context = self._enhance_context(query, context)
        
        # For now, simulate streaming by yielding the complete response
        # In a real implementation, this would use DSPy's streaming capabilities
        try:
            result = self.generation_program(
                query=query,
                context=enhanced_context,
                chat_history=chat_history
            )
            
            # Simulate streaming by chunking the response
            response = result.answer
            chunk_size = 50  # Characters per chunk
            
            for i in range(0, len(response), chunk_size):
                chunk = response[i:i + chunk_size]
                yield chunk
                # Small delay to simulate streaming
                await asyncio.sleep(0.01)
                
        except Exception as e:
            yield f"Error generating response: {str(e)}"
    
    def _enhance_context(self, query: str, context: str) -> str:
        """
        Enhance context with appropriate templates based on query type.
        
        Args:
            query: User's query
            context: Retrieved documentation context
            
        Returns:
            Enhanced context with relevant templates
        """
        enhanced_context = context
        query_lower = query.lower()
        
        # Add contract template for contract-related queries
        if any(keyword in query_lower for keyword in ['contract', 'storage', 'external', 'interface']):
            enhanced_context = self.contract_template + "\n\n" + enhanced_context
        
        # Add test template for test-related queries
        if any(keyword in query_lower for keyword in ['test', 'testing', 'assert', 'mock']):
            enhanced_context = self.test_template + "\n\n" + enhanced_context
        
        return enhanced_context
    
    def _format_chat_history(self, chat_history: List[Message]) -> str:
        """
        Format chat history for inclusion in the generation prompt.
        
        Args:
            chat_history: List of previous messages
            
        Returns:
            Formatted chat history string
        """
        if not chat_history:
            return ""
        
        formatted_history = []
        for message in chat_history[-5:]:  # Keep last 5 messages for context
            role = "User" if message.role == "user" else "Assistant"
            formatted_history.append(f"{role}: {message.content}")
        
        return "\n".join(formatted_history)


class McpGenerationProgram(dspy.Module):
    """
    Special generation program for MCP (Model Context Protocol) mode.
    
    This program returns raw documentation without LLM generation,
    useful for integration with other tools that need Cairo documentation.
    """
    
    def __init__(self):
        super().__init__()
    
    def forward(self, documents: List[Document]) -> str:
        """
        Format documents for MCP mode response.
        
        Args:
            documents: List of retrieved documents
            
        Returns:
            Formatted documentation string
        """
        if not documents:
            return "No relevant documentation found."
        
        formatted_docs = []
        for i, doc in enumerate(documents, 1):
            source = doc.metadata.get('source_display', 'Unknown Source')
            url = doc.metadata.get('url', '#')
            title = doc.metadata.get('title', f'Document {i}')
            
            formatted_doc = f"""
## {i}. {title}

**Source:** {source}
**URL:** {url}

{doc.page_content}

---
"""
            formatted_docs.append(formatted_doc)
        
        return "\n".join(formatted_docs)


def create_generation_program(program_type: str = "general") -> GenerationProgram:
    """
    Factory function to create a GenerationProgram instance.
    
    Args:
        program_type: Type of generation program ("general" or "scarb")
        
    Returns:
        Configured GenerationProgram instance
    """
    return GenerationProgram(program_type=program_type)


def create_mcp_generation_program() -> McpGenerationProgram:
    """
    Factory function to create an MCP GenerationProgram instance.
    
    Returns:
        Configured McpGenerationProgram instance
    """
    return McpGenerationProgram()


def load_optimized_programs(programs_dir: str = "optimized_programs") -> dict:
    """
    Load DSPy programs with pre-optimized prompts and demonstrations.
    
    Args:
        programs_dir: Directory containing optimized program files
        
    Returns:
        Dictionary of loaded optimized programs
    """
    import os
    
    programs = {}
    
    # Program configurations
    program_configs = {
        'general_generation': {'type': 'general', 'fallback': GenerationProgram()},
        'scarb_generation': {'type': 'scarb', 'fallback': GenerationProgram('scarb')},
        'mcp_generation': {'type': 'mcp', 'fallback': McpGenerationProgram()}
    }
    
    for program_name, config in program_configs.items():
        program_path = os.path.join(programs_dir, f"{program_name}.json")
        
        if os.path.exists(program_path):
            try:
                # Load optimized program with learned prompts and demos
                programs[program_name] = dspy.load(program_path)
            except Exception as e:
                print(f"Error loading optimized program {program_name}: {e}")
                programs[program_name] = config['fallback']
        else:
            # Use fallback program
            programs[program_name] = config['fallback']
    
    return programs