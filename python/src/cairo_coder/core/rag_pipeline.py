"""
RAG Pipeline orchestration for Cairo Coder.

This module implements the RagPipeline class that orchestrates the three-stage
RAG workflow: Query Processing → Document Retrieval → Generation.
"""

import os
from typing import AsyncGenerator, List, Optional, Dict, Any
import asyncio
from dataclasses import dataclass

from cairo_coder.core.config import VectorStoreConfig
from cairo_coder.core.llm import AgentLoggingCallback
import dspy

from cairo_coder.core.types import (
    Document,
    DocumentSource,
    Message,
    ProcessedQuery,
    StreamEvent
)
from cairo_coder.dspy.query_processor import QueryProcessorProgram
from cairo_coder.dspy.document_retriever import DocumentRetrieverProgram
from cairo_coder.dspy.generation_program import GenerationProgram, McpGenerationProgram
from cairo_coder.utils.logging import get_logger

logger = get_logger(__name__)

@dataclass
class RagPipelineConfig:
    """Configuration for RAG Pipeline."""
    name: str
    vector_store_config: VectorStoreConfig
    query_processor: QueryProcessorProgram
    document_retriever: DocumentRetrieverProgram
    generation_program: GenerationProgram
    mcp_generation_program: McpGenerationProgram
    max_source_count: int = 10
    similarity_threshold: float = 0.4
    sources: Optional[List[DocumentSource]] = None
    contract_template: Optional[str] = None
    test_template: Optional[str] = None


class RagPipeline(dspy.Module):
    """
    Main RAG pipeline that orchestrates the three-stage workflow.

    This pipeline chains query processing, document retrieval, and generation
    to provide comprehensive Cairo programming assistance.
    """

    def __init__(self, config: RagPipelineConfig):
        """
        Initialize the RAG Pipeline.

        Args:
            config: RagPipelineConfig with all necessary components
        """
        super().__init__()
        self.config = config

        # Initialize DSPy modules for each stage
        self.query_processor = config.query_processor
        self.document_retriever = config.document_retriever
        self.generation_program = config.generation_program
        self.mcp_generation_program = config.mcp_generation_program

        # Pipeline state
        self._current_processed_query: Optional[ProcessedQuery] = None
        self._current_documents: List[Document] = []

    # Waits for streaming to finish before returning the response
    def forward(
        self,
        query: str,
        chat_history: Optional[List[Message]] = None,
        mcp_mode: bool = False,
        sources: Optional[List[DocumentSource]] = None
    ) -> dspy.Predict:
        chat_history_str = self._format_chat_history(chat_history or [])
        processed_query = self.query_processor.forward(
            query=query,
            chat_history=chat_history_str
        )
        logger.info("Processed query", processed_query=processed_query)
        self._current_processed_query = processed_query

        # Use provided sources or fall back to processed query sources
        retrieval_sources = sources or processed_query.resources
        documents = self.document_retriever.forward(
            processed_query=processed_query,
            sources=retrieval_sources
        )
        self._current_documents = documents

        if mcp_mode:
            raw_response = self.mcp_generation_program.forward(documents)
            return raw_response

        context = self._prepare_context(documents, processed_query)
        response = self.generation_program.forward(
            query=query,
            context=context,
            chat_history=chat_history_str
        )

        return response


    async def forward_streaming(
        self,
        query: str,
        chat_history: Optional[List[Message]] = None,
        mcp_mode: bool = False,
        sources: Optional[List[DocumentSource]] = None
    ) -> AsyncGenerator[StreamEvent, None]:
        """
        Execute the complete RAG pipeline with streaming support.

        Args:
            query: User's Cairo/Starknet programming question
            chat_history: Previous conversation messages
            mcp_mode: Return raw documents without generation
            sources: Optional source filtering

        Yields:
            StreamEvent objects for real-time updates
        """
        # TODO: This is the place where we should select the proper LLM configuration.
        # TODO: For now we just Hard-code DSPY - GEMINI
        try:
            # Stage 1: Process query
            yield StreamEvent(type="processing", data="Processing query...")

            chat_history_str = self._format_chat_history(chat_history or [])
            processed_query = self.query_processor.forward(
                query=query,
                chat_history=chat_history_str
            )
            logger.info("Processed query", processed_query=processed_query)
            self._current_processed_query = processed_query

            # Use provided sources or fall back to processed query sources
            retrieval_sources = sources or processed_query.resources

            # Stage 2: Retrieve documents
            yield StreamEvent(type="processing", data="Retrieving relevant documents...")

            documents = self.document_retriever.forward(
                processed_query=processed_query,
                sources=retrieval_sources
            )
            self._current_documents = documents

            # Emit sources event
            yield StreamEvent(type="sources", data=self._format_sources(documents))

            if mcp_mode:
                # MCP mode: Return raw documents
                yield StreamEvent(type="processing", data="Formatting documentation...")

                raw_response = self.mcp_generation_program.forward(documents)
                yield StreamEvent(type="response", data=raw_response)
            else:
                # Normal mode: Generate response
                yield StreamEvent(type="processing", data="Generating response...")

                # Prepare context for generation
                context = self._prepare_context(documents, processed_query)

                # Stream response generation
                async for chunk in self.generation_program.forward_streaming(
                    query=query,
                    context=context,
                    chat_history=chat_history_str
                ):
                    yield StreamEvent(type="response", data=chunk)

            # Pipeline completed
            yield StreamEvent(type="end", data=None)

        except Exception as e:
            # Handle pipeline errors
            yield StreamEvent(
                type="error",
                data=f"Pipeline error: {str(e)}"
            )

    def get_lm_usage(self) -> Dict[str, int]:
        """
        Get the total number of tokens used by the LLM.
        """
        generation_usage = self.generation_program.get_lm_usage()
        query_usage = self.query_processor.get_lm_usage()
        # merge both dictionaries
        return {**generation_usage, **query_usage}


    def _format_chat_history(self, chat_history: List[Message]) -> str:
        """
        Format chat history for processing.

        Args:
            chat_history: List of previous messages

        Returns:
            Formatted chat history string
        """
        if not chat_history:
            return ""

        formatted_messages = []
        for message in chat_history[-10:]:  # Keep last 10 messages
            role = "User" if message.role == "user" else "Assistant"
            formatted_messages.append(f"{role}: {message.content}")

        return "\n".join(formatted_messages)

    def _format_sources(self, documents: List[Document]) -> List[Dict[str, Any]]:
        """
        Format documents for sources event.

        Args:
            documents: List of retrieved documents

        Returns:
            List of formatted source information
        """
        sources = []
        for doc in documents:
            source_info = {
                'title': doc.metadata.get('title', 'Untitled'),
                'url': doc.metadata.get('url', '#'),
                'source_display': doc.metadata.get('source_display', 'Unknown Source'),
                'content_preview': doc.page_content[:200] + ('...' if len(doc.page_content) > 200 else '')
            }
            sources.append(source_info)

        return sources

    def _prepare_context(self, documents: List[Document], processed_query: ProcessedQuery) -> str:
        """
        Prepare context for generation from retrieved documents.

        Args:
            documents: Retrieved documents
            processed_query: Processed query information

        Returns:
            Formatted context string
        """
        if not documents:
            return "No relevant documentation found."

        context_parts = []

        # Add templates if applicable

        # Add retrieved documentation
        context_parts.append("Relevant Documentation:")
        context_parts.append("")

        for i, doc in enumerate(documents, 1):
            source_name = doc.metadata.get('source_display', 'Unknown Source')
            title = doc.metadata.get('title', f'Document {i}')
            url = doc.metadata.get('url', '#')

            context_parts.append(f"## {i}. {title}")
            context_parts.append(f"Source: {source_name}")
            context_parts.append(f"URL: {url}")
            context_parts.append("")
            context_parts.append(doc.page_content)
            context_parts.append("")
            context_parts.append("---")
            context_parts.append("")

        if processed_query.is_contract_related and self.config.contract_template:
            context_parts.append("Contract Development Guidelines:")
            context_parts.append(self.config.contract_template)
            context_parts.append("")

        if processed_query.is_test_related and self.config.test_template:
            context_parts.append("Testing Guidelines:")
            context_parts.append(self.config.test_template)
            context_parts.append("")

        return "\n".join(context_parts)

    def get_current_state(self) -> Dict[str, Any]:
        """
        Get current pipeline state for debugging.

        Returns:
            Dictionary with current pipeline state
        """
        return {
            'processed_query': self._current_processed_query,
            'documents_count': len(self._current_documents),
            'documents': self._current_documents,
            'config': {
                'name': self.config.name,
                'max_source_count': self.config.max_source_count,
                'similarity_threshold': self.config.similarity_threshold,
                'sources': self.config.sources
            }
        }


class RagPipelineFactory:
    """Factory for creating RAG Pipeline instances."""

    @staticmethod
    def create_pipeline(
        name: str,
        vector_store_config: VectorStoreConfig,
        query_processor: Optional[QueryProcessorProgram] = None,
        document_retriever: Optional[DocumentRetrieverProgram] = None,
        generation_program: Optional[GenerationProgram] = None,
        mcp_generation_program: Optional[McpGenerationProgram] = None,
        max_source_count: int = 10,
        similarity_threshold: float = 0.4,
        sources: Optional[List[DocumentSource]] = None,
        contract_template: Optional[str] = None,
        test_template: Optional[str] = None
    ) -> RagPipeline:
        """
        Create a RAG Pipeline with default or provided components.

        Args:
            name: Pipeline name
            vector_store: Vector store for document retrieval
            query_processor: Optional query processor (creates default if None)
            document_retriever: Optional document retriever (creates default if None)
            generation_program: Optional generation program (creates default if None)
            mcp_generation_program: Optional MCP program (creates default if None)
            max_source_count: Maximum documents to retrieve
            similarity_threshold: Minimum similarity for document inclusion
            sources: Default document sources
            contract_template: Template for contract-related queries
            test_template: Template for test-related queries

        Returns:
            Configured RagPipeline instance
        """
        from cairo_coder.dspy import (
            create_query_processor,
            DocumentRetrieverProgram,
            create_generation_program,
            create_mcp_generation_program
        )

        # Create default components if not provided
        if query_processor is None:
            query_processor = create_query_processor()

        if document_retriever is None:
            document_retriever = DocumentRetrieverProgram(
                vector_store_config=vector_store_config,
                max_source_count=max_source_count,
                similarity_threshold=similarity_threshold
            )

        if generation_program is None:
            generation_program = create_generation_program("general")

        if mcp_generation_program is None:
            mcp_generation_program = create_mcp_generation_program()

        # Create configuration
        config = RagPipelineConfig(
            name=name,
            vector_store_config=vector_store_config,
            query_processor=query_processor,
            document_retriever=document_retriever,
            generation_program=generation_program,
            mcp_generation_program=mcp_generation_program,
            max_source_count=max_source_count,
            similarity_threshold=similarity_threshold,
            sources=sources,
            contract_template=contract_template,
            test_template=test_template
        )

        rag_program = RagPipeline(config)
        # Load optimizer
        COMPILED_PROGRAM_PATH = "optimizers/results/optimized_rag.json"
        if not os.path.exists(COMPILED_PROGRAM_PATH):
            raise FileNotFoundError(f"{COMPILED_PROGRAM_PATH} not found")
        rag_program.load(COMPILED_PROGRAM_PATH)

        return rag_program

    @staticmethod
    def create_scarb_pipeline(
        name: str,
        vector_store_config: VectorStoreConfig,
        **kwargs
    ) -> RagPipeline:
        """
        Create a Scarb-specialized RAG Pipeline.

        Args:
            name: Pipeline name
            vector_store_config: Vector store for document retrieval
            **kwargs: Additional configuration options

        Returns:
            Configured RagPipeline for Scarb queries
        """
        from cairo_coder.dspy import create_generation_program

        # Create Scarb-specific generation program
        scarb_generation_program = create_generation_program("scarb")

        # Set Scarb-specific defaults
        kwargs.setdefault('sources', [DocumentSource.SCARB_DOCS])
        kwargs.setdefault('max_source_count', 5)

        return RagPipelineFactory.create_pipeline(
            name=name,
            vector_store_config=vector_store_config,
            generation_program=scarb_generation_program,
            **kwargs
        )


def create_rag_pipeline(
    name: str,
    vector_store_config: VectorStoreConfig,
    **kwargs
) -> RagPipeline:
    """
    Convenience function to create a RAG Pipeline.

    Args:
        name: Pipeline name
        vector_store_config: Vector store for document retrieval
        **kwargs: Additional configuration options

    Returns:
        Configured RagPipeline instance
    """
    return RagPipelineFactory.create_pipeline(name, vector_store_config, **kwargs)
