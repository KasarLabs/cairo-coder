"""
DSPy Programs for Cairo Coder.

This package contains DSPy-based programs for the Cairo Coder RAG pipeline:
- QueryProcessorProgram: Transforms user queries into structured search terms
- DocumentRetrieverProgram: Retrieves and ranks relevant documents
- GenerationProgram: Generates Cairo code responses from retrieved context
- SuggestionProgram: Generates follow-up conversation suggestions
"""

from .document_retriever import DocumentRetrieverProgram
from .generation_program import (
    GenerationProgram,
    SkillGeneration,
    SkillGenerationProgram,
    create_generation_program,
    create_mcp_generation_program,
)
from .grok_search import GrokSearchProgram
from .query_processor import QueryProcessorProgram, create_query_processor
from .retrieval_judge import RetrievalJudge
from .suggestion_program import SuggestionGeneration

__all__ = [
    "QueryProcessorProgram",
    "create_query_processor",
    "DocumentRetrieverProgram",
    "GenerationProgram",
    "SkillGeneration",
    "SkillGenerationProgram",
    "create_generation_program",
    "create_mcp_generation_program",
    "RetrievalJudge",
    "SuggestionGeneration",
    "GrokSearchProgram",
]
