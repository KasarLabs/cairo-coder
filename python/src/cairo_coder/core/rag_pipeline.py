"""
RAG Pipeline orchestration for Cairo Coder.

This module implements the RagPipeline class that orchestrates the three-stage
RAG workflow: Query Processing → Document Retrieval → Generation.
"""

import os
from collections.abc import AsyncGenerator
from dataclasses import dataclass
from typing import Any, Optional

import dspy
from dspy.utils.callback import BaseCallback
from langsmith import traceable

from cairo_coder.core.config import VectorStoreConfig
from cairo_coder.core.types import (
    Document,
    DocumentSource,
    Message,
    ProcessedQuery,
    StreamEvent,
    StreamEventType,
)
from cairo_coder.dspy.document_retriever import DocumentRetrieverProgram
from cairo_coder.dspy.generation_program import GenerationProgram, McpGenerationProgram
from cairo_coder.dspy.query_processor import QueryProcessorProgram
from cairo_coder.dspy.retrieval_judge import RetrievalJudge
from cairo_coder.utils.logging import get_logger

logger = get_logger(__name__)

SOURCE_PREVIEW_MAX_LEN = 200


# 1. Define a custom callback class that extends BaseCallback class
class AgentLoggingCallback(BaseCallback):
    def on_module_start(
        self,
        call_id: str,
        instance: Any,
        inputs: dict[str, Any],
    ) -> None:
        logger.debug("Starting module", call_id=call_id, inputs=inputs)

    # 2. Implement on_module_end handler to run a custom logging code.
    def on_module_end(self, call_id: str, outputs: dict[str, Any], exception: Exception | None) -> None:
        step = "Reasoning" if self._is_reasoning_output(outputs) else "Acting"
        logger.debug(f"== {step} Step ===")
        for k, v in outputs.items():
            logger.debug(f"  {k}: {v}")
        logger.debug("\n")

    def _is_reasoning_output(self, outputs: dict[str, Any]) -> bool:
        return any(k.startswith("Thought") for k in outputs if isinstance(k, str))


class LangsmithTracingCallback(BaseCallback):
    @traceable()
    def on_lm_start(self, call_id: str, instance: Any, inputs: dict[str, Any]) -> None:
        pass

    @traceable()
    def on_lm_end(self, call_id: str, outputs: dict[str, Any], exception: Exception | None) -> None:
        pass


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
    sources: list[DocumentSource] | None = None
    contract_template: Optional[str] = None
    test_template: Optional[str] = None
    enable_llm_judge: bool = True
    llm_judge_threshold: float = 0.4
    retrieval_judge: RetrievalJudge | None = None


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

        # Initialize retrieval judge if enabled
        self.retrieval_judge: RetrievalJudge | None = None
        if config.enable_llm_judge:
            self.retrieval_judge = config.retrieval_judge or RetrievalJudge(
                threshold=config.llm_judge_threshold
            )

        # Pipeline state
        self._current_processed_query: ProcessedQuery | None = None
        self._current_documents: list[Document] = []

    def _process_query_and_retrieve_docs(
        self,
        query: str,
        chat_history_str: str,
        sources: list[DocumentSource] | None = None,
    ) -> tuple[ProcessedQuery, list[Document]]:
        processed_query =  self.query_processor.forward(query=query, chat_history=chat_history_str)
        self._current_processed_query = processed_query

        # Use provided sources or fall back to processed query sources
        retrieval_sources = sources or processed_query.resources
        documents = self.document_retriever.forward(
            processed_query=processed_query, sources=retrieval_sources
        )

        # Apply LLM judge if enabled
        if self.retrieval_judge is not None:
            try:
                with dspy.context(lm=dspy.LM("gemini/gemini-2.5-flash-lite", max_tokens=10000)):
                    documents = self.retrieval_judge.forward(query=query, documents=documents)
            except Exception as e:
                logger.warning(
                    "Retrieval judge failed (sync), using all documents",
                    error=str(e),
                    exc_info=True,
                )
                # documents already contains all retrieved docs, no action needed

        self._current_documents = documents

        return processed_query, documents


    async def _aprocess_query_and_retrieve_docs(
        self,
        query: str,
        chat_history_str: str,
        sources: list[DocumentSource] | None = None,
    ) -> tuple[ProcessedQuery, list[Document]]:
        """Process query and retrieve documents - shared async logic."""
        processed_query = await self.query_processor.aforward(query=query, chat_history=chat_history_str)
        self._current_processed_query = processed_query

        # Use provided sources or fall back to processed query sources
        retrieval_sources = sources or processed_query.resources
        documents = await self.document_retriever.aforward(
            processed_query=processed_query, sources=retrieval_sources
        )

        # Apply LLM judge if enabled
        if self.retrieval_judge is not None:
            try:
                with dspy.context(lm=dspy.LM("gemini/gemini-2.5-flash-lite", max_tokens=10000)):
                    documents = await self.retrieval_judge.aforward(query=query, documents=documents)
            except Exception as e:
                logger.warning(
                    "Retrieval judge failed (async), using all documents",
                    error=str(e),
                    exc_info=True,
                )
                # documents already contains all retrieved docs, no action needed

        self._current_documents = documents

        return processed_query, documents

    # Waits for streaming to finish before returning the response
    @traceable(name="RagPipeline", run_type="chain")
    def forward(
        self,
        query: str,
        chat_history: list[Message] | None = None,
        mcp_mode: bool = False,
        sources: list[DocumentSource] | None = None,
    ) -> dspy.Prediction:
        chat_history_str = self._format_chat_history(chat_history or [])
        processed_query, documents = self._process_query_and_retrieve_docs(
            query, chat_history_str, sources
        )
        logger.info(f"Processed query: {processed_query.original} and retrieved {len(documents)} doc titles: {[doc.metadata.get('title') for doc in documents]}")

        if mcp_mode:
            return self.mcp_generation_program.forward(documents)

        context = self._prepare_context(documents, processed_query)

        return self.generation_program.forward(
            query=query, context=context, chat_history=chat_history_str
        )

    # Waits for streaming to finish before returning the response
    @traceable(name="RagPipeline", run_type="chain")
    async def aforward(
        self,
        query: str,
        chat_history: list[Message] | None = None,
        mcp_mode: bool = False,
        sources: list[DocumentSource] | None = None,
    ) -> dspy.Prediction:
        chat_history_str = self._format_chat_history(chat_history or [])
        processed_query, documents = await self._aprocess_query_and_retrieve_docs(
            query, chat_history_str, sources
        )
        logger.info(f"Processed query: {processed_query.original[:100]}... and retrieved {len(documents)} doc titles: {[doc.metadata.get('title') for doc in documents]}")

        if mcp_mode:
            return self.mcp_generation_program.forward(documents)

        context = self._prepare_context(documents, processed_query)

        return await self.generation_program.aforward(
            query=query, context=context, chat_history=chat_history_str
        )

    async def forward_streaming(
        self,
        query: str,
        chat_history: list[Message] | None = None,
        mcp_mode: bool = False,
        sources: list[DocumentSource] | None = None,
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
        try:
            # Stage 1: Process query
            yield StreamEvent(type=StreamEventType.PROCESSING, data="Processing query...")

            chat_history_str = self._format_chat_history(chat_history or [])

            # Stage 2: Retrieve documents
            yield StreamEvent(type=StreamEventType.PROCESSING, data="Retrieving relevant documents...")

            processed_query, documents = await self._aprocess_query_and_retrieve_docs(
                query, chat_history_str, sources
            )

            # Emit sources event
            yield StreamEvent(type=StreamEventType.SOURCES, data=self._format_sources(documents))

            if mcp_mode:
                # MCP mode: Return raw documents
                yield StreamEvent(type=StreamEventType.PROCESSING, data="Formatting documentation...")

                mcp_prediction = self.mcp_generation_program.forward(documents)
                yield StreamEvent(type=StreamEventType.RESPONSE, data=mcp_prediction.answer)
            else:
                # Normal mode: Generate response
                yield StreamEvent(type=StreamEventType.PROCESSING, data="Generating response...")

                # Prepare context for generation
                context = self._prepare_context(documents, processed_query)

                # Stream response generation
                async for chunk in self.generation_program.forward_streaming(
                    query=query, context=context, chat_history=chat_history_str
                ):
                    yield StreamEvent(type=StreamEventType.RESPONSE, data=chunk)

            # Pipeline completed
            yield StreamEvent(type=StreamEventType.END, data=None)

        except Exception as e:
            # Handle pipeline errors
            import traceback
            traceback.print_exc()
            logger.error("Pipeline error", error=e)
            yield StreamEvent(StreamEventType.ERROR, data=f"Pipeline error: {str(e)}")

    def get_lm_usage(self) -> dict[str, dict[str, int]]:
        """
        Get the total number of tokens used by the LLM.
        """
        generation_usage = self.generation_program.get_lm_usage()
        query_usage = self.query_processor.get_lm_usage()

        # Get retrieval judge usage if available
        judge_usage = {}
        if self.retrieval_judge:
            judge_usage = self.retrieval_judge.get_lm_usage()

        # Additive merge strategy
        merged_usage = {}

        # Helper function to merge usage dictionaries
        def merge_usage_dict(target: dict, source: dict) -> None:
            for model_name, metrics in source.items():
                if model_name not in target:
                    target[model_name] = {}
                for metric_name, value in metrics.items():
                    target[model_name][metric_name] = target[model_name].get(metric_name, 0) + value

        merge_usage_dict(merged_usage, generation_usage)
        merge_usage_dict(merged_usage, query_usage)
        merge_usage_dict(merged_usage, judge_usage)

        return merged_usage

    def _format_chat_history(self, chat_history: list[Message]) -> str:
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

    def _format_sources(self, documents: list[Document]) -> list[dict[str, Any]]:
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
                "title": doc.metadata.get("title", "Untitled"),
                "url": doc.metadata.get("url", "#"),
                "source_display": doc.metadata.get("source_display", "Unknown Source"),
                "content_preview": doc.page_content[:SOURCE_PREVIEW_MAX_LEN]
                + ("..." if len(doc.page_content) > SOURCE_PREVIEW_MAX_LEN else ""),
            }
            sources.append(source_info)

        return sources

    def _prepare_context(self, documents: list[Document], processed_query: ProcessedQuery) -> str:
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
            source_name = doc.metadata.get("source_display", "Unknown Source")
            title = doc.metadata.get("title", f"Document {i}")
            url = doc.metadata.get("url", "#")

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

    def get_current_state(self) -> dict[str, Any]:
        """
        Get current pipeline state for debugging.

        Returns:
            Dictionary with current pipeline state
        """
        return {
            "processed_query": self._current_processed_query,
            "documents_count": len(self._current_documents),
            "documents": self._current_documents,
            "config": {
                "name": self.config.name,
                "max_source_count": self.config.max_source_count,
                "similarity_threshold": self.config.similarity_threshold,
                "sources": self.config.sources,
                "enable_llm_judge": self.config.enable_llm_judge,
                "llm_judge_threshold": self.config.llm_judge_threshold,
            },
        }


class RagPipelineFactory:
    """Factory for creating RAG Pipeline instances."""

    @staticmethod
    def create_pipeline(
        name: str,
        vector_store_config: VectorStoreConfig,
        query_processor: QueryProcessorProgram | None = None,
        document_retriever: DocumentRetrieverProgram | None = None,
        generation_program: GenerationProgram | None = None,
        mcp_generation_program: McpGenerationProgram | None = None,
        max_source_count: int = 5,
        similarity_threshold: float = 0.4,
        sources: list[DocumentSource] | None = None,
        contract_template: Optional[str] = None,
        test_template: Optional[str] = None,
        vector_db: Any = None,  # SourceFilteredPgVectorRM instance
        enable_llm_judge: bool = True,
        llm_judge_threshold: float = 0.4,
        retrieval_judge: RetrievalJudge | None = None,
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
            vector_db: Optional pre-initialized vector database instance
            enable_llm_judge: Whether to enable LLM-based retrieval judge
            llm_judge_threshold: Minimum score for documents to pass judge
            retrieval_judge: Optional pre-initialized retrieval judge

        Returns:
            Configured RagPipeline instance
        """
        from cairo_coder.dspy import (
            DocumentRetrieverProgram,
            create_generation_program,
            create_mcp_generation_program,
            create_query_processor,
        )

        # Create default components if not provided
        if query_processor is None:
            query_processor = create_query_processor()

        if document_retriever is None:
            document_retriever = DocumentRetrieverProgram(
                vector_store_config=vector_store_config,
                vector_db=vector_db,
                max_source_count=max_source_count,
                similarity_threshold=similarity_threshold,
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
            test_template=test_template,
            enable_llm_judge=enable_llm_judge,
            llm_judge_threshold=llm_judge_threshold,
            retrieval_judge=retrieval_judge,
        )

        rag_program = RagPipeline(config)
        # Load optimizer
        compiled_program_path = "optimizers/results/optimized_rag.json"
        if not os.path.exists(compiled_program_path):
            raise FileNotFoundError(f"{compiled_program_path} not found")
        rag_program.load(compiled_program_path)

        return rag_program

    @staticmethod
    def create_scarb_pipeline(
        name: str, vector_store_config: VectorStoreConfig, **kwargs: Any
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
        kwargs.setdefault("sources", [DocumentSource.SCARB_DOCS])
        kwargs.setdefault("max_source_count", 5)

        return RagPipelineFactory.create_pipeline(
            name=name,
            vector_store_config=vector_store_config,
            generation_program=scarb_generation_program,
            **kwargs,
        )


def create_rag_pipeline(name: str, vector_store_config: VectorStoreConfig, **kwargs: Any) -> RagPipeline:
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
