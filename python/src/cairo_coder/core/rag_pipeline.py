"""
RAG Pipeline orchestration for Cairo Coder.

This module implements the RagPipeline class that orchestrates the three-stage
RAG workflow: Query Processing → Document Retrieval → Generation.
"""

import asyncio
import contextlib
import os
from collections.abc import AsyncGenerator
from dataclasses import dataclass
from typing import Any

import dspy
import langsmith as ls
import structlog
from dspy.adapters import XMLAdapter
from langsmith import traceable

from cairo_coder.core.config import VectorStoreConfig
from cairo_coder.core.constants import DEFAULT_JUDGE_LM, MAX_SOURCE_COUNT, SIMILARITY_THRESHOLD
from cairo_coder.core.types import (
    Document,
    DocumentSource,
    FormattedSource,
    Message,
    PipelineResult,
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
    max_source_count: int = MAX_SOURCE_COUNT
    similarity_threshold: float = SIMILARITY_THRESHOLD


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

    async def _aprocess_query_and_retrieve_docs(
        self,
        query: str,
        chat_history_str: str,
        sources: list[DocumentSource] | None = None,
    ) -> tuple[ProcessedQuery, list[Document], list[str]]:
        """
        Process query and retrieve documents - shared async logic.

        Returns:
            Tuple of (processed_query, documents, grok_citations)
        """
        qp_prediction = await self.query_processor.acall(
            query=query, chat_history=chat_history_str
        )
        processed_query = qp_prediction.processed_query

        # Use provided sources or fall back to processed query sources
        retrieval_sources = (
            processed_query.resources if sources is None else sources
        )
        dr_prediction = await self.document_retriever.acall(
            processed_query=processed_query, sources=retrieval_sources
        )
        documents = dr_prediction.documents

        # Optional Grok web/X augmentation: activate when STARKNET_BLOG is among sources.
        grok_citations: list[str] = []
        grok_summary_doc = None
        try:
            if DocumentSource.STARKNET_BLOG in retrieval_sources and not os.getenv("OPTIMIZER_RUN"):
                grok_pred = await self.grok_search.acall(processed_query, chat_history_str)
                grok_docs = grok_pred.documents

                grok_citations = list(self.grok_search.last_citations)
                if grok_docs:
                    documents.extend(grok_docs)
                grok_summary_doc = next((d for d in grok_docs if d.metadata.get("name") == "grok-answer"), None)
        except Exception as e:
            logger.warning("Grok augmentation failed; continuing without it", error=str(e), exc_info=True)

        try:
            with dspy.context(
                lm=dspy.LM(DEFAULT_JUDGE_LM, max_tokens=10000, temperature=0.5),
                adapter=XMLAdapter(),
            ):
                judge_pred = await self.retrieval_judge.acall(query=query, documents=documents)
                documents = judge_pred.documents
        except Exception as e:
            logger.warning(
                "Retrieval judge failed (async), using all documents",
                error=str(e),
                exc_info=True,
            )
            # documents already contains all retrieved docs, no action needed

        # Ensure Grok summary is present and first in order (for generation context)
        if grok_summary_doc is not None:
            if grok_summary_doc in documents:
                documents = [grok_summary_doc] + [
                    d for d in documents if d is not grok_summary_doc
                ]
            else:
                documents = [grok_summary_doc] + documents

        return processed_query, documents, grok_citations

    @traceable(name="RagPipeline", run_type="chain")
    async def aforward(
        self,
        query: str,
        chat_history: list[Message] | None = None,
        mcp_mode: bool = False,
        sources: list[DocumentSource] | None = None,
    ) -> dspy.Prediction:
        """
        Execute the RAG pipeline and return a DSPy Prediction.

        Args:
            query: User's Cairo/Starknet programming question
            chat_history: Previous conversation messages
            mcp_mode: Return raw documents without generation
            sources: Optional source filtering

        Returns:
            Prediction containing documents, answer, and formatted sources
        """
        chat_history_str = self._format_chat_history(chat_history or [])
        processed_query, documents, grok_citations = (
            await self._aprocess_query_and_retrieve_docs(query, chat_history_str, sources)
        )
        logger.info(
            f"Processed query: {processed_query.original[:100]}... and retrieved {len(documents)} doc titles: {[doc.metadata.get('title') for doc in documents]}"
        )

        if mcp_mode:
            result = await self.mcp_generation_program.acall(documents)
            return dspy.Prediction(
                processed_query=processed_query,
                documents=documents,
                grok_citations=grok_citations,
                answer=result.answer,
                formatted_sources=self._format_sources(documents, grok_citations),
            )

        context = self._prepare_context(documents)

        result = await self.generation_program.acall(
            query=query, context=context, chat_history=chat_history_str
        )

        return dspy.Prediction(
            processed_query=processed_query,
            documents=documents,
            grok_citations=grok_citations,
            answer=result.answer,
            formatted_sources=self._format_sources(documents, grok_citations),
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
        event_queue: asyncio.Queue[StreamEvent | None] = asyncio.Queue()

        async def _emit(event: StreamEvent) -> None:
            await event_queue.put(event)

        async def _run_pipeline() -> None:
            try:
                with dspy.track_usage() as usage_tracker:
                    # Stage 1: Process query
                    await _emit(
                        StreamEvent(type=StreamEventType.PROCESSING, data="Processing query...")
                    )

                    chat_history_str = self._format_chat_history(chat_history or [])

                    # Stage 2: Retrieve documents
                    await _emit(
                        StreamEvent(
                            type=StreamEventType.PROCESSING,
                            data="Retrieving relevant documents...",
                        )
                    )

                    processed_query, documents, grok_citations = (
                        await self._aprocess_query_and_retrieve_docs(
                            query, chat_history_str, sources
                        )
                    )

                    # Emit sources event
                    formatted_sources = self._format_sources(documents, grok_citations)
                    await _emit(StreamEvent(type=StreamEventType.SOURCES, data=formatted_sources))

                    final_answer: str | None = None

                    if mcp_mode:
                        # MCP mode: Return raw documents
                        await _emit(
                            StreamEvent(
                                type=StreamEventType.PROCESSING,
                                data="Formatting documentation...",
                            )
                        )

                        mcp_prediction = await self.mcp_generation_program.acall(documents)
                        final_answer = mcp_prediction.answer
                        # Emit single response plus a final response event for clients that rely on it
                        await _emit(
                            StreamEvent(type=StreamEventType.RESPONSE, data=mcp_prediction.answer)
                        )
                        await _emit(
                            StreamEvent(
                                type=StreamEventType.FINAL_RESPONSE, data=mcp_prediction.answer
                            )
                        )
                    else:
                        # Normal mode: Generate response
                        await _emit(
                            StreamEvent(
                                type=StreamEventType.PROCESSING,
                                data="Generating response...",
                            )
                        )

                        # Prepare context for generation
                        context = self._prepare_context(documents)

                        # Stream response generation. Use ChatAdapter for streaming, which performs better.
                        with dspy.context(
                            adapter=dspy.adapters.ChatAdapter()
                        ), ls.trace(
                            name="GenerationProgramStreaming",
                            run_type="llm",
                            inputs={
                                "query": query,
                                "chat_history": chat_history_str,
                                "context": context,
                            },
                        ) as rt:
                            chunk_accumulator = ""
                            async for chunk in self.generation_program.aforward_streaming(
                                query=query, context=context, chat_history=chat_history_str
                            ):
                                if isinstance(chunk, dspy.streaming.StreamResponse):
                                    # Incremental token
                                    # Emit thinking events for reasoning field, response events for answer field
                                    if chunk.signature_field_name == "reasoning":
                                        await _emit(
                                            StreamEvent(
                                                type=StreamEventType.REASONING, data=chunk.chunk
                                            )
                                        )
                                    elif chunk.signature_field_name == "answer":
                                        chunk_accumulator += chunk.chunk
                                        await _emit(
                                            StreamEvent(
                                                type=StreamEventType.RESPONSE, data=chunk.chunk
                                            )
                                        )
                                    else:
                                        logger.warning(
                                            "Unknown signature field name: %s",
                                            chunk.signature_field_name,
                                        )
                                elif isinstance(chunk, dspy.Prediction):
                                    # Final complete answer
                                    final_answer = getattr(chunk, "answer", None) or chunk_accumulator
                                    await _emit(
                                        StreamEvent(
                                            type=StreamEventType.FINAL_RESPONSE, data=final_answer
                                        )
                                    )
                                    rt.end(outputs={"output": final_answer})

                    # Pipeline completed - yield the final PipelineResult
                    pipeline_result = PipelineResult(
                        processed_query=processed_query,
                        documents=documents,
                        grok_citations=grok_citations,
                        usage=usage_tracker.get_total_tokens(),
                        answer=final_answer,
                        formatted_sources=formatted_sources,
                    )
                    await _emit(StreamEvent(type=StreamEventType.END, data=pipeline_result))

            except asyncio.CancelledError:
                raise
            except Exception as e:
                # Handle pipeline errors
                import traceback

                traceback.print_exc()
                logger.error("Pipeline error", error=e)
                await _emit(StreamEvent(StreamEventType.ERROR, data=f"Pipeline error: {str(e)}"))
            finally:
                await event_queue.put(None)

        pipeline_task = asyncio.create_task(_run_pipeline())

        try:
            while True:
                event = await event_queue.get()
                if event is None:
                    break
                yield event
        finally:
            if not pipeline_task.done():
                pipeline_task.cancel()
                with contextlib.suppress(asyncio.CancelledError):
                    await pipeline_task

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

    def _format_sources(
        self, documents: list[Document], grok_citations: list[str] | None = None
    ) -> list[FormattedSource]:
        """
        Format documents for the frontend-friendly sources event.

        Produces a flat structure with `title` and `url` keys for each source,
        mapping either `metadata.sourceLink` or `metadata.url` to the `url` field.

        Args:
            documents: List of retrieved documents
            grok_citations: Optional list of Grok citation URLs

        Returns:
            List of formatted sources with metadata
        """
        sources: list[FormattedSource] = []
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
        for url in grok_citations or []:
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

    @staticmethod
    def prediction_to_pipeline_result(prediction: dspy.Prediction) -> PipelineResult:
        """Convert a DSPy Prediction into a PipelineResult."""
        return PipelineResult(
            processed_query=prediction.processed_query,
            documents=prediction.documents,
            grok_citations=prediction.grok_citations,
            usage=prediction.get_lm_usage(),
            answer=prediction.answer,
            formatted_sources=prediction.formatted_sources,
        )


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
        similarity_threshold: float = SIMILARITY_THRESHOLD,
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
