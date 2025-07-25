"""
DSPy Generation Program for Cairo Coder.

This module implements the GenerationProgram that generates Cairo code responses
based on user queries and retrieved documentation context.
"""

from collections.abc import AsyncGenerator
from typing import Optional

import dspy
import structlog
from dspy import InputField, OutputField, Signature
from dspy.adapters.chat_adapter import AdapterParseError
from langsmith import traceable

from cairo_coder.core.types import Document, Message

logger = structlog.get_logger(__name__)


# TODO: Find a way to properly "erase" common mistakes like PrintTrait imports.
class CairoCodeGeneration(Signature):
    """
    Analyze a Cairo programming query and use the context to generate a high-quality Cairo code solution and explanations.
    Reason about how to properly solve the query, based on the input code (if any) and the context.

    When generating Cairo Code, all `starknet` imports should be included explicitly (e.g. use starknet::storage::*, use starknet::ContractAddress, etc.)
    However, most `core` library imports are already included (like panic, println, etc.) - dont include them if they're not explicitly mentioned in the context.
    """

    chat_history: Optional[str] = InputField(
        desc="Previous conversation context for continuity and better understanding", default=""
    )

    query: str = InputField(
        desc="User's specific Cairo programming question or request for code generation"
    )

    context: str = InputField(
        desc="Retrieved Cairo documentation, examples, and relevant information to inform the response. Use the context to inform the response - maximize using context's content."
    )

    answer: str = OutputField(
        desc="Complete Cairo code solution with explanations, following Cairo syntax and best practices. Include code examples, explanations, and step-by-step guidance."
    )


class ScarbGeneration(Signature):
    """
    Generate Scarb configuration, commands, and troubleshooting guidance.

    This signature is specialized for Scarb build tool related queries.
    """

    chat_history: Optional[str] = InputField(desc="Previous conversation context", default="")

    query: str = InputField(desc="User's Scarb-related question or request")

    context: str = InputField(desc="Scarb documentation and examples relevant to the query")

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
            )
        else:
            self.generation_program = dspy.ChainOfThought(
                CairoCodeGeneration,
            )

    def get_lm_usage(self) -> dict[str, int]:
        """
        Get the total number of tokens used by the LLM.
        """
        return self.generation_program.get_lm_usage()

    @traceable(name="GenerationProgram", run_type="llm")
    def forward(self, query: str, context: str, chat_history: Optional[str] = None) -> dspy.Prediction | None :
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

        # Execute the generation program
        max_retries = 3
        for attempt in range(max_retries):
            try:
                return self.generation_program.forward(query=query, context=context, chat_history=chat_history)
            except AdapterParseError as e:
                if attempt < max_retries - 1:
                        continue
                code = self._try_extract_code_from_response(e.lm_response)
                if code:
                    return dspy.Prediction(answer=code)
                else:
                    raise e
        return None

    @traceable(name="GenerationProgram", run_type="llm")
    async def aforward(self, query: str, context: str, chat_history: Optional[str] = None) -> dspy.Prediction | None :
        """
        Generate Cairo code response based on query and context - async
        """
        if chat_history is None:
            chat_history = ""

        # Execute the generation program with retries for AdapterParseError
        max_retries = 3
        for attempt in range(max_retries):
            try:
                return await self.generation_program.aforward(query=query, context=context, chat_history=chat_history)
            except AdapterParseError as e:
                if attempt < max_retries - 1:
                        continue
                code = self._try_extract_code_from_response(e.lm_response)
                if code:
                    return dspy.Prediction(answer=code)
                else:
                    raise e
        return None

    async def forward_streaming(
        self, query: str, context: str, chat_history: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """
        Generate Cairo code response with streaming support using DSPy's native streaming.

        Args:
            query: User's Cairo programming question
            context: Retrieved documentation and examples
            chat_history: Previous conversation context (optional)

        Yields:
            Chunks of the generated response
        """
        if chat_history is None:
            chat_history = ""

        # Create a streamified version of the generation program
        stream_generation = dspy.streamify(
            self.generation_program,
            stream_listeners=[dspy.streaming.StreamListener(signature_field_name="answer")],  # type: ignore
        )

        try:
            # Execute the streaming generation
            output_stream = stream_generation( # type: ignore
                query=query, context=context, chat_history=chat_history # type: ignore
            )

            # Process the stream and yield tokens
            is_cached = True
            async for chunk in output_stream:
                if isinstance(chunk, dspy.streaming.StreamResponse): # type: ignore
                    # No streaming if cached
                    is_cached = False
                    # Yield the actual token content
                    yield chunk.chunk
                elif isinstance(chunk, dspy.Prediction):
                    if is_cached:
                        yield chunk.answer
                    # Final output received - streaming is complete

        except Exception as e:
            yield f"Error generating response: {str(e)}"

    def _format_chat_history(self, chat_history: list[Message]) -> str:
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

    def _try_extract_code_from_response(self, response: str) -> str | None:
        """
        Try to extract Cairo code from the response.
        """
        if "```cairo" in response:
            return response.split("```cairo")[1].split("```")[0]

        return None


class McpGenerationProgram(dspy.Module):
    """
    Special generation program for MCP (Model Context Protocol) mode.

    This program returns raw documentation without LLM generation,
    useful for integration with other tools that need Cairo documentation.
    """

    def __init__(self):
        super().__init__()

    def forward(self, documents: list[Document]) -> dspy.Prediction:
        """
        Format documents for MCP mode response.

        Args:
            documents: List of retrieved documents

        Returns:
            Formatted documentation string
        """
        if not documents:
            return dspy.Prediction(answer="No relevant documentation found.")

        formatted_docs = []
        for i, doc in enumerate(documents, 1):
            source = doc.metadata.get("source_display", "Unknown Source")
            url = doc.metadata.get("url", "#")
            title = doc.metadata.get("title", f"Document {i}")

            formatted_doc = f"""
## {i}. {title}

**Source:** {source}
**URL:** {url}

{doc.page_content}

---
"""
            formatted_docs.append(formatted_doc)

        return dspy.Prediction(answer='\n'.join(formatted_docs))



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
