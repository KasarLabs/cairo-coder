"""
RAG Pipeline orchestration for Cairo Coder.

This module implements the RagPipeline class that orchestrates the three-stage
RAG workflow: Query Processing → Document Retrieval → Generation.
"""

from collections.abc import AsyncGenerator
from dataclasses import dataclass
from typing import Any

import dspy
import langsmith as ls
import structlog
from dspy.adapters import XMLAdapter
from langsmith import traceable

from cairo_coder.core.config import VectorStoreConfig
from cairo_coder.core.types import (
    Document,
    DocumentSource,
    Message,
    ProcessedQuery,
    StreamEvent,
    StreamEventType,
    title_from_url,
)
from cairo_coder.dspy.document_retriever import DocumentRetrieverProgram
from cairo_coder.dspy.generation_program import GenerationProgram, McpGenerationProgram
from cairo_coder.dspy.grok_search import GrokSearchProgram
from cairo_coder.dspy.query_processor import QueryProcessorProgram
from cairo_coder.dspy.retrieval_judge import RetrievalJudge

logger = structlog.get_logger(__name__)

SOURCE_PREVIEW_MAX_LEN = 200


@dataclass
class RagPipelineConfig:
    """Configuration for RAG Pipeline."""

    name: str
    vector_store_config: VectorStoreConfig
    query_processor: QueryProcessorProgram
    document_retriever: DocumentRetrieverProgram
    generation_program: GenerationProgram
    mcp_generation_program: McpGenerationProgram
    sources: list[DocumentSource]
    max_source_count: int = 10
    similarity_threshold: float = 0.4


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
        self.retrieval_judge = RetrievalJudge()
        self.grok_search = GrokSearchProgram()
        self._grok_citations: list[str] = []

        # Pipeline state
        self._current_processed_query: ProcessedQuery | None = None
        self._current_documents: list[Document] = []

    async def _aprocess_query_and_retrieve_docs(
        self,
        query: str,
        chat_history_str: str,
        sources: list[DocumentSource] | None = None,
    ) -> tuple[ProcessedQuery, list[Document]]:
        """Process query and retrieve documents - shared async logic."""
        processed_query = await self.query_processor.aforward(
            query=query, chat_history=chat_history_str
        )
        self._current_processed_query = processed_query

        # Use provided sources or fall back to processed query sources
        retrieval_sources = sources or processed_query.resources
        documents = await self.document_retriever.aforward(
            processed_query=processed_query, sources=retrieval_sources
        )

        # Optional Grok web/X augmentation: activate when STARKNET_BLOG is among sources.
        try:
            if DocumentSource.STARKNET_BLOG in retrieval_sources:
                grok_docs = await self.grok_search.aforward(processed_query, chat_history_str)
                self._grok_citations = list(self.grok_search.last_citations)
                if grok_docs:
                    documents.extend(grok_docs)
                grok_summary_doc = next((d for d in grok_docs if d.metadata.get("name") == "grok-answer"), None)
            else:
                self._grok_citations = []
                grok_summary_doc = None
        except Exception as e:
            logger.warning("Grok augmentation failed; continuing without it", error=str(e), exc_info=True)
            grok_summary_doc = None
            self._grok_citations = []

        try:
            with dspy.context(
                lm=dspy.LM("gemini/gemini-flash-lite-latest", max_tokens=10000, temperature=0.5),
                adapter=XMLAdapter(),
            ):
                documents = await self.retrieval_judge.aforward(query=query, documents=documents)
        except Exception as e:
            logger.warning(
                "Retrieval judge failed (async), using all documents",
                error=str(e),
                exc_info=True,
            )
            # documents already contains all retrieved docs, no action needed

        # Ensure Grok summary is present and first in order (for generation context)
        try:
            if grok_summary_doc is not None:
                if grok_summary_doc in documents:
                    documents = [grok_summary_doc] + [d for d in documents if d is not grok_summary_doc]
                else:
                    documents = [grok_summary_doc] + documents
        except Exception:
            pass

        self._current_documents = documents

        return processed_query, documents

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
        logger.info(
            f"Processed query: {processed_query.original[:100]}... and retrieved {len(documents)} doc titles: {[doc.metadata.get('title') for doc in documents]}"
        )

        if mcp_mode:
            return await self.mcp_generation_program.aforward(documents)

        context = self._prepare_context(documents)

        return await self.generation_program.aforward(
            query=query, context=context, chat_history=chat_history_str
        )


    async def aforward_streaming(
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
            yield StreamEvent(
                type=StreamEventType.PROCESSING, data="Retrieving relevant documents..."
            )

            processed_query, documents = await self._aprocess_query_and_retrieve_docs(
                query, chat_history_str, sources
            )

            # Emit sources event
            yield StreamEvent(type=StreamEventType.SOURCES, data=self._format_sources(documents))

            if mcp_mode:
                # MCP mode: Return raw documents
                yield StreamEvent(
                    type=StreamEventType.PROCESSING, data="Formatting documentation..."
                )

                mcp_prediction = self.mcp_generation_program(documents)
                # Emit single response plus a final response event for clients that rely on it
                yield StreamEvent(type=StreamEventType.RESPONSE, data=mcp_prediction.answer)
                yield StreamEvent(type=StreamEventType.FINAL_RESPONSE, data=mcp_prediction.answer)
            else:
                # Normal mode: Generate response
                yield StreamEvent(type=StreamEventType.PROCESSING, data="Generating response...")

                # Prepare context for generation
                context = self._prepare_context(documents)

                # Stream response generation. Use ChatAdapter for streaming, which performs better.
                with dspy.context(
                    adapter=dspy.adapters.ChatAdapter()
                ), ls.trace(name="GenerationProgramStreaming", run_type="llm", inputs={"query": query, "chat_history": chat_history_str, "context": context}) as rt:
                        chunk_accumulator = ""
                        final_text: str | None = None
                        async for chunk in self.generation_program.aforward_streaming(
                            query=query, context=context, chat_history=chat_history_str
                        ):
                            if isinstance(chunk, dspy.streaming.StreamResponse):
                                # Incremental token
                                # Emit thinking events for reasoning field, response events for answer field
                                if chunk.signature_field_name == "reasoning":
                                    yield StreamEvent(type=StreamEventType.REASONING, data=chunk.chunk)
                                elif chunk.signature_field_name == "answer":
                                    chunk_accumulator += chunk.chunk
                                    yield StreamEvent(type=StreamEventType.RESPONSE, data=chunk.chunk)
                                else:
                                    logger.warning(f"Unknown signature field name: {chunk.signature_field_name}")
                            elif isinstance(chunk, dspy.Prediction):
                                # Final complete answer
                                final_text = getattr(chunk, "answer", None) or chunk_accumulator
                                yield StreamEvent(type=StreamEventType.FINAL_RESPONSE, data=final_text)
                                rt.end(outputs={"output": final_text})

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
        Format documents for the frontend-friendly sources event.

        Produces a flat structure with `title` and `url` keys for each source,
        mapping either `metadata.sourceLink` or `metadata.url` to the `url` field.

        Args:
            documents: List of retrieved documents

        Returns:
            List of dicts: [{"title": str, "url": str}, ...]
        """
        sources: list[dict[str, str]] = []
        seen_urls: set[str] = set()


        # 1) Vector store and other docs (skip Grok summary virtual doc)
        for doc in documents:
            if doc.metadata.get("name") == "grok-answer" or doc.metadata.get("is_virtual"):
                continue
            url = doc.source_link or doc.metadata.get("url") or ""
            if not url:
                logger.warning(f"Document {doc.title} has no source link")
                to_append = {"metadata": {"title": doc.title, "url": "", "source_type": "documentation"}}
                sources.append(to_append)
                continue
            if url in seen_urls:
                continue
            to_append = {"metadata": {"title": doc.title, "url": url, "source_type": "documentation"}}
            sources.append(to_append)
            seen_urls.add(url)

        # 2) Append Grok citations (raw URLs)
        for url in self._grok_citations:
            if not url:
                continue
            if url in seen_urls:
                continue
            sources.append({"metadata": {"title": title_from_url(url), "url": url, "source_type": "web_search"}})
            seen_urls.add(url)

        return sources

    def _prepare_context(self, documents: list[Document]) -> str:
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

        for doc in documents:
            source_name = doc.metadata.get("source_display", "Unknown Source")
            title = doc.metadata.get("title", "Untitled Document")
            url = doc.metadata.get("url") or doc.metadata.get("sourceLink", "")
            is_virtual = doc.metadata.get("is_virtual", False)

            # For virtual documents (like Grok summaries), include content without a header
            # This prevents the LLM from citing the container instead of the actual sources
            if is_virtual:
                context_parts.append(doc.page_content)
                context_parts.append("")
                context_parts.append("---")
                context_parts.append("")
                continue

            # For real documents, include header with URL if available
            if url:
                context_parts.append(f"## [{title}]({url})")
            else:
                context_parts.append(f"## {title}")

            context_parts.append(f"*Source: {source_name}*")
            context_parts.append("")

            context_parts.append(doc.page_content)
            context_parts.append("")
            context_parts.append("---")
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
            },
        }


class RagPipelineFactory:
    """Factory for creating RAG Pipeline instances."""

    @staticmethod
    def create_pipeline(
        name: str,
        vector_store_config: VectorStoreConfig,
        sources: list[DocumentSource],
        query_processor: QueryProcessorProgram,
        generation_program: GenerationProgram,
        mcp_generation_program: McpGenerationProgram,
        document_retriever: DocumentRetrieverProgram | None = None,
        max_source_count: int = 5,
        similarity_threshold: float = 0.4,
        vector_db: Any = None,  # SourceFilteredPgVectorRM instance
    ) -> RagPipeline:
        """
        Create a RAG Pipeline with default or provided components.

        Args:
            name: Pipeline name
            vector_store: Vector store for document retrieval
            query_processor: Query processor
            generation_program: Generation program
            mcp_generation_program: "Generation" program to use if in MCP mode
            document_retriever: Optional document retriever (creates default if None)
            max_source_count: Maximum documents to retrieve
            similarity_threshold: Minimum similarity for document inclusion
            sources: Sources to use for retrieval.
            vector_db: Optional pre-initialized vector database instance

        Returns:
            Configured RagPipeline instance
        """
        from cairo_coder.dspy import DocumentRetrieverProgram

        if document_retriever is None:
            document_retriever = DocumentRetrieverProgram(
                vector_store_config=vector_store_config,
                vector_db=vector_db,
                max_source_count=max_source_count,
                similarity_threshold=similarity_threshold,
            )

        # Create configuration
        config = RagPipelineConfig(
            name=name,
            vector_store_config=vector_store_config,
            query_processor=query_processor,
            document_retriever=document_retriever,
            generation_program=generation_program,
            mcp_generation_program=mcp_generation_program,
            sources=sources,
            max_source_count=max_source_count,
            similarity_threshold=similarity_threshold,
        )

        return RagPipeline(config)
