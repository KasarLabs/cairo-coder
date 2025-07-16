"""
DSPy Programs for Cairo Coder.

This package contains DSPy-based programs for the Cairo Coder RAG pipeline:
- QueryProcessorProgram: Transforms user queries into structured search terms
- DocumentRetrieverProgram: Retrieves and ranks relevant documents
- GenerationProgram: Generates Cairo code responses from retrieved context
"""

from .query_processor import QueryProcessorProgram, create_query_processor
from .document_retriever import DocumentRetrieverProgram
from .generation_program import (
    GenerationProgram,
    McpGenerationProgram,
    create_generation_program,
    create_mcp_generation_program,
)

__all__ = [
    "QueryProcessorProgram",
    "create_query_processor",
    "DocumentRetrieverProgram",
    "GenerationProgram",
    "McpGenerationProgram",
    "create_generation_program",
    "create_mcp_generation_program",
]
