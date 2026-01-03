"""
Refactored unit tests for RAG Pipeline using proper pytest fixtures.

Tests the pipeline orchestration functionality including query processing,
document retrieval, response generation, and retrieval judge feature.
"""

from unittest.mock import AsyncMock, Mock, patch

import dspy
import pytest

from cairo_coder.core.rag_pipeline import (
    RagPipeline,
    RagPipelineFactory,
)
from cairo_coder.core.types import (
    Document,
    DocumentSource,
    Message,
    Role,
    StreamEventType,
)
from cairo_coder.dspy.retrieval_judge import RetrievalJudge


# Helper functions for test data creation
def create_custom_documents(specs):
    """Create documents with specific titles and content."""
    documents = []
    for title, content, source in specs:
        doc = Document(
            page_content=content,
            metadata={
                "title": title,
                "source": source,
                "sourceLink": f"https://example.com/{source}",
                "source_display": source.replace("_", " ").title(),
            },
        )
        documents.append(doc)
    return documents


def create_custom_retrieval_judge(score_map, threshold=0.4):
    """Create a mock RetrievalJudge with custom scoring."""
    judge = Mock(spec=RetrievalJudge)

    def filter_docs(query: str, documents: list[Document]) -> list[Document]:
        """Filter documents based on score_map."""
        filtered = []
        for doc in documents:
            title = doc.title
            score = score_map.get(title, 0.5)

            # Add judge metadata
            doc.metadata["llm_judge_score"] = score
            doc.metadata["llm_judge_reason"] = f"Document '{title}' scored {score} for relevance"

            # Filter based on threshold
            if score >= judge.threshold:
                filtered.append(doc)

        return filtered

    async def async_filter_docs(query: str, documents: list[Document]) -> list[Document]:
        """Async version of filter_docs."""
        return filter_docs(query, documents)

    judge.forward = Mock(side_effect=filter_docs)
    judge.acall = AsyncMock(side_effect=async_filter_docs)
    judge.threshold = threshold

    return judge


class TestRagPipeline:
    """Test suite for RagPipeline."""

    @pytest.mark.asyncio
    async def test_async_pipeline_execution(self, pipeline):
        """Test async pipeline execution."""
        result = await pipeline.acall("How to write Cairo contracts?")

        # Verify async components were called
        pipeline.query_processor.acall.assert_called_once()
        pipeline.document_retriever.acall.assert_called_once()
        pipeline.generation_program.acall.assert_called_once()

        # Verify result
        assert result.answer == "Here's how to write Cairo contracts..."

    @pytest.mark.asyncio
    async def test_streaming_pipeline_execution(self, pipeline):
        """Test streaming pipeline execution."""
        events = []
        async for event in pipeline.aforward_streaming("How to write Cairo contracts?"):
            events.append(event)

        # Verify event sequence
        event_types = [e.type for e in events]
        assert StreamEventType.PROCESSING in event_types
        assert StreamEventType.SOURCES in event_types
        assert StreamEventType.RESPONSE in event_types
        assert StreamEventType.FINAL_RESPONSE in event_types
        assert StreamEventType.END in event_types

    @pytest.mark.asyncio
    async def test_mcp_mode_execution(self, pipeline):
        """Test MCP mode pipeline execution."""
        result = await pipeline.acall("How to write Cairo contracts?", mcp_mode=True)

        # Verify MCP program was used
        pipeline.mcp_generation_program.acall.assert_called_once()
        assert "Cairo contracts are defined using #[starknet::contract]" in result.answer

    @pytest.mark.asyncio
    async def test_pipeline_with_chat_history(self, pipeline):
        """Test pipeline with chat history."""
        chat_history = [
            Message(role=Role.USER, content="Previous question"),
            Message(role=Role.ASSISTANT, content="Previous answer"),
        ]

        await pipeline.acall("Follow-up question", chat_history=chat_history)

        # Verify chat history was formatted and passed
        call_args = pipeline.query_processor.acall.call_args
        assert "User: Previous question" in call_args[1]["chat_history"]
        assert "Assistant: Previous answer" in call_args[1]["chat_history"]

    @pytest.mark.asyncio
    async def test_pipeline_with_custom_sources(self, pipeline):
        """Test pipeline with custom sources."""
        sources = [DocumentSource.SCARB_DOCS]
        await pipeline.acall("Scarb question", sources=sources)

        # Verify sources were passed to retriever
        call_args = pipeline.document_retriever.acall.call_args[1]
        assert call_args["sources"] == sources

    @pytest.mark.asyncio
    async def test_empty_documents_handling(self, pipeline):
        """Test pipeline handling of empty document list."""
        # Configure retriever to return empty prediction
        empty_prediction = dspy.Prediction(documents=[])
        empty_prediction.set_lm_usage({})
        pipeline.document_retriever.acall.return_value = empty_prediction

        await pipeline.acall("test query")

        # Verify generation was called with "No relevant documentation found"
        call_args = pipeline.generation_program.acall.call_args
        assert "No relevant documentation found" in call_args[1]["context"]

    @pytest.mark.asyncio
    async def test_pipeline_error_handling(self, pipeline):
        """Test pipeline error handling."""
        # Configure pipeline's retriever to fail
        pipeline.document_retriever.acall.side_effect = Exception("Retrieval error")

        events = []
        async for event in pipeline.aforward_streaming("test query"):
            events.append(event)

        # Should have an error event
        error_events = [e for e in events if e.type == StreamEventType.ERROR]
        assert len(error_events) == 1
        assert "Retrieval error" in error_events[0].data


class TestRagPipelineWithJudge:
    """Tests for RAG Pipeline with Retrieval Judge feature."""

    @patch("cairo_coder.core.rag_pipeline.RetrievalJudge")
    @pytest.mark.asyncio
    async def test_judge_enabled_filters_documents(
        self, mock_judge_class, pipeline
    ):
        """Test that judge filters out low-scoring documents."""
        # Create documents with varying relevance
        docs = create_custom_documents(
            [
                ("Cairo Contracts", "Cairo contract content", "cairo_book"),
                ("Python Guide", "Python content", "python_docs"),
                ("Cairo Storage", "Cairo storage content", "cairo_book"),
            ]
        )
        # Return prediction with documents - modify the pipeline's document retriever
        dr_prediction = dspy.Prediction(documents=docs)
        dr_prediction.set_lm_usage({})
        pipeline.document_retriever.acall.return_value = dr_prediction

        # Setup judge with specific scores
        judge = create_custom_retrieval_judge(
            {
                "Cairo Contracts": 0.8,
                "Python Guide": 0.2,  # Below threshold
                "Cairo Storage": 0.7,
            }
        )
        # Configure the mock instance that the pipeline will use

        async def judge_acall_with_prediction(query, documents):
            result_docs = await judge.acall(query, documents)
            prediction = dspy.Prediction(documents=result_docs)
            prediction.set_lm_usage({})
            return prediction

        pipeline.retrieval_judge.acall.side_effect = judge_acall_with_prediction
        pipeline.retrieval_judge.threshold = judge.threshold

        await pipeline.acall("Cairo question")

        # Verify judge was called
        pipeline.retrieval_judge.acall.assert_called_once()

        # Verify context only contains high-scoring docs
        call_args = pipeline.generation_program.acall.call_args
        context = call_args[1]["context"]
        assert "Cairo contract content" in context
        assert "Cairo storage content" in context
        assert "Python content" not in context

    @patch("cairo_coder.core.rag_pipeline.RetrievalJudge")
    @pytest.mark.asyncio
    async def test_judge_disabled_passes_all_documents(
        self, mock_judge_class, sample_documents, pipeline
    ):
        """Test that when judge fails, all documents are passed through."""
        # Mock the judge to fail
        pipeline.retrieval_judge.acall.side_effect = Exception("Judge failed")

        await pipeline.acall("test query")

        # Verify judge exists
        assert pipeline.retrieval_judge is not None

        # All documents should be in context (because judge failed)
        call_args = pipeline.generation_program.acall.call_args
        context = call_args[1]["context"]
        for doc in sample_documents:
            assert doc.page_content in context

    @pytest.mark.parametrize("threshold", [0.0, 0.4, 0.6, 0.9])
    @patch("cairo_coder.core.rag_pipeline.RetrievalJudge")
    @pytest.mark.asyncio
    async def test_judge_threshold_parameterization(
        self, mock_judge_class, threshold, sample_documents, pipeline
    ):
        """Test different judge thresholds."""
        # Return prediction with documents
        dr_prediction = dspy.Prediction(documents=sample_documents)
        dr_prediction.set_lm_usage({})
        pipeline.document_retriever.acall.return_value = dr_prediction

        # Judge with scores: 0.9, 0.8, 0.7, 0.6 (based on sample_documents)
        score_map = {
            "Introduction to Cairo": 0.9,
            "What is Starknet": 0.8,
            "Scarb Overview": 0.7,
            "OpenZeppelin Cairo": 0.6,
        }

        judge = create_custom_retrieval_judge(score_map, threshold=threshold)

        async def judge_acall_with_prediction(query, documents):
            result_docs = await judge.acall(query, documents)
            prediction = dspy.Prediction(documents=result_docs)
            prediction.set_lm_usage({})
            return prediction

        pipeline.retrieval_judge.acall.side_effect = judge_acall_with_prediction
        pipeline.retrieval_judge.threshold = judge.threshold

        result = await pipeline.acall("test query")

        # Count filtered docs based on threshold
        scores = [0.9, 0.8, 0.7, 0.6]
        expected_count = sum(1 for score in scores if score >= threshold)

        # Verify judge was called
        pipeline.retrieval_judge.acall.assert_called_once()

        # Access filtered docs from the returned Prediction
        filtered_docs = result.documents
        assert len(filtered_docs) == expected_count

        # Verify all filtered docs meet threshold
        for doc in filtered_docs:
            assert doc.metadata.get("llm_judge_score", 0) >= threshold

    @patch("cairo_coder.core.rag_pipeline.RetrievalJudge")
    @pytest.mark.asyncio
    async def test_judge_failure_fallback(self, mock_judge_class, sample_documents, pipeline):
        """Test fallback when judge fails."""
        # Create failing judge
        pipeline.retrieval_judge.acall.side_effect = Exception("Judge failed")

        # Should not raise, should use all docs
        await pipeline.acall("test query")

        # All documents should be passed through
        call_args = pipeline.generation_program.acall.call_args
        context = call_args[1]["context"]
        for doc in sample_documents:
            assert doc.page_content in context

    @patch("cairo_coder.core.rag_pipeline.RetrievalJudge")
    @pytest.mark.asyncio
    async def test_judge_parse_error_handling(
        self, mock_judge_class, pipeline
    ):
        """Test handling of parse errors in judge scores."""
        docs = create_custom_documents(
            [
                ("Doc1", "Content1", "source1"),
                ("Doc2", "Content2", "source2"),
            ]
        )
        # Return prediction with documents
        dr_prediction = dspy.Prediction(documents=docs)
        dr_prediction.set_lm_usage({})
        pipeline.document_retriever.acall.return_value = dr_prediction

        # Create judge that returns invalid score
        async def filter_with_parse_error(query, documents):
            # First doc gets invalid score, second gets valid
            documents[0].metadata["llm_judge_score"] = "invalid"  # Will cause parse error
            documents[0].metadata["llm_judge_reason"] = "Parse error"

            documents[1].metadata["llm_judge_score"] = 0.8
            documents[1].metadata["llm_judge_reason"] = "Good doc"

            # In the real implementation, docs with parse errors are now DROPPED.
            # The mock's side effect must replicate the real judge's behavior.
            prediction = dspy.Prediction(documents=[documents[1]])
            prediction.set_lm_usage({})
            return prediction

        pipeline.retrieval_judge.acall.side_effect = filter_with_parse_error
        pipeline.retrieval_judge.threshold = 0.5

        await pipeline.acall("test query")

        # The doc with the parse error ("Content1") should be dropped and not in the context.
        call_args = pipeline.generation_program.acall.call_args
        context = call_args[1]["context"]
        assert "Content1" not in context
        assert "Content2" in context

    @pytest.mark.asyncio
    @patch("cairo_coder.core.rag_pipeline.RetrievalJudge")
    async def test_async_judge_execution(self, mock_judge_class, pipeline, mock_retrieval_judge):
        """Test async execution with judge."""
        pipeline.retrieval_judge.acall.side_effect = mock_retrieval_judge.acall

        result = await pipeline.acall("test query")

        # Verify async judge was called
        pipeline.retrieval_judge.acall.assert_called_once()
        assert result.answer == "Here's how to write Cairo contracts..."

    @patch("cairo_coder.core.rag_pipeline.RetrievalJudge")
    @pytest.mark.asyncio
    async def test_streaming_with_judge(self, mock_judge_class, pipeline, mock_retrieval_judge, sample_documents):
        """Test streaming execution with judge."""
        # Return prediction with documents
        dr_prediction = dspy.Prediction(documents=sample_documents)
        dr_prediction.set_lm_usage({})
        pipeline.document_retriever.acall.return_value = dr_prediction

        # Set up judge to return prediction
        async def judge_acall_with_prediction(query, documents):
            result_docs = await mock_retrieval_judge.acall(query, documents)
            prediction = dspy.Prediction(documents=result_docs)
            prediction.set_lm_usage({})
            return prediction

        pipeline.retrieval_judge.acall.side_effect = judge_acall_with_prediction

        events = []
        async for event in pipeline.aforward_streaming("test query"):
            events.append(event)

        # Verify judge was called
        pipeline.retrieval_judge.acall.assert_called_once()

        # Verify filtered sources in event
        sources_event = next(e for e in events if e.type == "sources")
        # Should only have 1 doc (Introduction to Cairo with score 0.9)
        assert len(sources_event.data) == 1
        assert sources_event.data[0]["metadata"]["title"] == "Introduction to Cairo"

    @patch("cairo_coder.core.rag_pipeline.RetrievalJudge")
    @pytest.mark.asyncio
    async def test_judge_metadata_enrichment(
        self, mock_judge_class, pipeline
    ):
        """Test that judge adds metadata to documents."""
        docs = create_custom_documents([("Test Doc", "Test content", "test_source")])
        # Return prediction with documents
        dr_prediction = dspy.Prediction(documents=docs)
        dr_prediction.set_lm_usage({})
        pipeline.document_retriever.acall.return_value = dr_prediction

        judge = create_custom_retrieval_judge({"Test Doc": 0.75})

        async def judge_acall_with_prediction(query, documents):
            result_docs = await judge.acall(query, documents)
            prediction = dspy.Prediction(documents=result_docs)
            prediction.set_lm_usage({})
            return prediction

        pipeline.retrieval_judge.acall.side_effect = judge_acall_with_prediction

        await pipeline.acall("test query")

        # Check that judge was called and documents have metadata
        pipeline.retrieval_judge.acall.assert_called_once()

        # Verify that generation received the filtered document with metadata
        gen_call_args = pipeline.generation_program.acall.call_args[1]
        context = gen_call_args["context"]

        # The document should be in the context (score 0.75 is above threshold)
        assert "Test content" in context


class TestRagPipelineFactory:
    """Tests for RagPipelineFactory."""

    def test_create_pipeline_has_judge_enabled(self, mock_vector_store_config, mock_vector_db):
        """Test factory creates pipeline with judge parameters."""
        with (
            patch.object(RagPipeline, "load"),
            patch("cairo_coder.dspy.DocumentRetrieverProgram") as mock_retriever_class,
        ):

            # Mock DocumentRetrieverProgram to return a mock retriever
            mock_retriever = Mock()
            mock_retriever.vector_db = mock_vector_db
            mock_retriever_class.return_value = mock_retriever

            pipeline = RagPipelineFactory.create_pipeline(
                name="test",
                vector_store_config=mock_vector_store_config,
                sources=list(DocumentSource),
                generation_program=Mock(),
                query_processor=Mock(),
                mcp_generation_program=Mock(),
            )

            assert isinstance(pipeline.retrieval_judge, RetrievalJudge)



class TestPipelineHelperMethods:
    """Tests for pipeline helper methods."""

    def test_format_chat_history(self, rag_pipeline):
        """Test chat history formatting."""
        messages = [
            Message(role=Role.USER, content="Question 1"),
            Message(role=Role.ASSISTANT, content="Answer 1"),
            Message(role=Role.USER, content="Question 2"),
        ]

        formatted = rag_pipeline._format_chat_history(messages)

        assert "User: Question 1" in formatted
        assert "Assistant: Answer 1" in formatted
        assert "User: Question 2" in formatted

    def test_format_empty_chat_history(self, rag_pipeline):
        """Test formatting empty chat history."""
        formatted = rag_pipeline._format_chat_history([])
        assert formatted == ""

    def test_format_sources(self, rag_pipeline):
        """Test source formatting for events."""
        docs = [
            Document(
                page_content="x" * 300,  # Long content
                metadata={
                    "title": "Test Doc",
                    "sourceLink": "https://example.com",
                },
            )
        ]

        sources = rag_pipeline._format_sources(docs)

        assert len(sources) == 1
        assert sources[0]["metadata"]["title"] == "Test Doc"
        assert sources[0]["metadata"]["url"] == "https://example.com"

    def test_format_sources_with_sourcelink(self, rag_pipeline):
        """Test that sourceLink is properly mapped to url for frontend compatibility."""
        docs = [
            Document(
                page_content="Test content",
                metadata={
                    "title": "Cairo Book - Getting Started",
                    "sourceLink": "https://book.cairo-lang.org/ch01-01-installation.html#installation",
                    "source": "cairo_book",
                },
            ),
            Document(
                page_content="Another doc",
                metadata={
                    "title": "No SourceLink Doc",
                    "sourceLink": "https://example.com",
                    "source": "starknet_docs",
                },
            ),
        ]

        sources = rag_pipeline._format_sources(docs)

        assert len(sources) == 2
        # First doc should have url mapped from sourceLink
        assert sources[0]["metadata"]["url"] == "https://book.cairo-lang.org/ch01-01-installation.html#installation"
        assert sources[0]["metadata"]["title"] == "Cairo Book - Getting Started"

        # Second doc should have fallback url
        assert sources[1]["metadata"]["url"] == "https://example.com"
        assert sources[1]["metadata"]["title"] == "No SourceLink Doc"

    def test_prepare_context_headers_with_and_without_links(self, rag_pipeline):
        """Headers should use markdown links when URL present and plain titles otherwise."""
        docs = [
            Document(
                page_content="Linked content",
                metadata={
                    "title": "Linked Doc",
                    "source_display": "Docs",
                    "sourceLink": "https://example.com/linked",
                },
            ),
            Document(
                page_content="Unlinked content",
                metadata={
                    "title": "Unlinked Doc",
                    "source_display": "Docs",
                },
            ),
        ]

        context = rag_pipeline._prepare_context(docs)
        assert "## [Linked Doc](https://example.com/linked)" in context
        assert "*Source: Docs*" in context
        assert "## Unlinked Doc" in context

    def test_format_sources_deduplicates_urls(self, rag_pipeline):
        """Duplicate URLs should be deduplicated in sources output."""
        url = "https://example.com/dup"
        docs = [
            Document(page_content="A", metadata={"title": "A1", "sourceLink": url}),
            Document(page_content="B", metadata={"title": "A2", "sourceLink": url}),
        ]

        sources = rag_pipeline._format_sources(docs)
        urls = [s["metadata"].get("url", "") for s in sources]
        assert urls.count(url) == 1

    def test_format_sources_title_fallback(self, rag_pipeline):
        """Missing document titles should fall back to a human-friendly domain."""
        doc = Document(
            page_content="Some content",
            metadata={
                "sourceLink": "https://docs.example.com/path/to/page",
            },
        )

        sources = rag_pipeline._format_sources([doc])

        assert len(sources) == 1
        assert sources[0]["metadata"]["title"] == "Page"
        assert sources[0]["metadata"]["url"] == "https://docs.example.com/path/to/page"

    def test_prepare_context_excludes_virtual_document_headers(self, rag_pipeline):
        """Virtual documents should not have headers to prevent citation."""
        docs = [
            Document(
                page_content="Real documentation content",
                metadata={
                    "title": "Real Doc",
                    "source_display": "Docs",
                    "sourceLink": "https://example.com/real",
                    "is_virtual": False,
                },
            ),
            Document(
                page_content="Virtual content with [inline link](https://example.com/inline)",
                metadata={
                    "title": "Virtual Summary",
                    "source_display": "Virtual Source",
                    "sourceLink": "",
                    "is_virtual": True,
                },
            ),
        ]

        context = rag_pipeline._prepare_context(docs)

        # Real document should have header
        assert "## [Real Doc](https://example.com/real)" in context
        assert "*Source: Docs*" in context

        # Virtual document should NOT have header or source label
        assert "Virtual Summary" not in context
        assert "Virtual Source" not in context

        # But virtual document content should still be present
        assert "Virtual content with [inline link](https://example.com/inline)" in context

    # Define reusable usage constants to keep tests DRY
    _QUERY_USAGE_MINI = {
        "gpt-4o-mini": {"prompt_tokens": 200, "completion_tokens": 100, "total_tokens": 300}
    }
    _GEN_USAGE_FULL = {
        "gpt-4o": {"prompt_tokens": 1000, "completion_tokens": 500, "total_tokens": 1500}
    }

    @pytest.mark.asyncio
    async def test_prediction_to_pipeline_result_uses_usage(
        self, sample_processed_query, sample_documents
    ):
        """PipelineResult should use the usage attached to the Prediction."""
        prediction = dspy.Prediction(
            processed_query=sample_processed_query,
            documents=sample_documents,
            grok_citations=[],
            answer="Test answer",
            formatted_sources=[],
        )
        prediction.set_lm_usage(self._QUERY_USAGE_MINI)

        pipeline_result = RagPipeline.prediction_to_pipeline_result(prediction)

        assert pipeline_result.usage == self._QUERY_USAGE_MINI

    @pytest.mark.asyncio
    @patch("cairo_coder.core.rag_pipeline.dspy.track_usage")
    async def test_streaming_uses_usage_tracker(
        self, mock_track_usage, pipeline_config, sample_processed_query, sample_documents
    ):
        """Streaming should take usage from DSPy's usage tracker."""
        from contextlib import contextmanager

        from cairo_coder.core.types import StreamEventType
        expected_usage = self._GEN_USAGE_FULL

        class DummyTracker:
            def get_total_tokens(self):
                return expected_usage

        @contextmanager
        def fake_track_usage():
            yield DummyTracker()

        mock_track_usage.side_effect = fake_track_usage

        # Set up query processor and document retriever
        qp_prediction = dspy.Prediction(processed_query=sample_processed_query)
        pipeline_config.query_processor.acall = AsyncMock(return_value=qp_prediction)

        dr_prediction = dspy.Prediction(documents=sample_documents)
        pipeline_config.document_retriever.acall = AsyncMock(return_value=dr_prediction)

        async def mock_streaming(*args, **kwargs):
            yield dspy.streaming.StreamResponse(
                predict_name="GenerationProgram",
                signature_field_name="answer",
                chunk="Test ",
                is_last_chunk=False,
            )
            yield dspy.streaming.StreamResponse(
                predict_name="GenerationProgram",
                signature_field_name="answer",
                chunk="answer",
                is_last_chunk=True,
            )
            yield dspy.Prediction(answer="Test answer")

        pipeline_config.generation_program.aforward_streaming = mock_streaming

        # Patch the RetrievalJudge
        with patch("cairo_coder.core.rag_pipeline.RetrievalJudge") as mock_judge_class:
            judge_prediction = dspy.Prediction(documents=sample_documents)
            mock_judge = Mock()
            mock_judge.acall = AsyncMock(return_value=judge_prediction)
            mock_judge_class.return_value = mock_judge

            pipeline = RagPipeline(pipeline_config)

            # Execute the pipeline and capture the END event which contains PipelineResult
            pipeline_result = None
            async for event in pipeline.aforward_streaming(
                query="How do I create a Cairo contract?", mcp_mode=False
            ):
                if event.type == StreamEventType.END:
                    pipeline_result = event.data
                    break

        assert pipeline_result is not None
        assert pipeline_result.usage == expected_usage


class TestConvenienceFunctions:
    """Tests for convenience functions."""

    def test_create_pipeline_with_defaults(self, mock_vector_store_config):
        """Test creating pipeline with default components."""
        with (patch("cairo_coder.dspy.DocumentRetrieverProgram") as mock_create_dr,):
            mock_create_dr.return_value = Mock()

            mock_gp = (Mock(),)
            mock_qp = (Mock(),)
            mock_mcp = (Mock(),)
            pipeline = RagPipelineFactory.create_pipeline(
                name="test_pipeline",
                vector_store_config=mock_vector_store_config,
                sources=list(DocumentSource),
                query_processor=mock_qp,
                generation_program=mock_gp,
                mcp_generation_program=mock_mcp,
            )

            assert isinstance(pipeline, RagPipeline)
            assert pipeline.config.name == "test_pipeline"
            assert pipeline.config.vector_store_config == mock_vector_store_config
            assert pipeline.config.max_source_count == 5
            assert pipeline.config.similarity_threshold == 0.4

            # Verify factory functions were called
            mock_create_dr.assert_called_once_with(
                vector_store_config=mock_vector_store_config,
                max_source_count=5,
                similarity_threshold=0.4,
                vector_db=None,
            )

    def test_create_pipeline_with_custom_components(self, mock_vector_store_config):
        """Test creating pipeline with custom components."""
        custom_query_processor = Mock()
        custom_document_retriever = Mock()
        custom_generation_program = Mock()
        custom_mcp_program = Mock()

        pipeline = RagPipelineFactory.create_pipeline(
            name="custom_pipeline",
            vector_store_config=mock_vector_store_config,
            query_processor=custom_query_processor,
            document_retriever=custom_document_retriever,
            generation_program=custom_generation_program,
            mcp_generation_program=custom_mcp_program,
            max_source_count=20,
            similarity_threshold=0.6,
            sources=[DocumentSource.CAIRO_BOOK],
        )

        assert isinstance(pipeline, RagPipeline)
        assert pipeline.config.name == "custom_pipeline"
        assert pipeline.config.query_processor == custom_query_processor
        assert pipeline.config.document_retriever == custom_document_retriever
        assert pipeline.config.generation_program == custom_generation_program
        assert pipeline.config.mcp_generation_program == custom_mcp_program
        assert pipeline.config.max_source_count == 20
        assert pipeline.config.similarity_threshold == 0.6
        assert pipeline.config.sources == [DocumentSource.CAIRO_BOOK]
