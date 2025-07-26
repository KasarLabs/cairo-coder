"""
Refactored unit tests for RAG Pipeline using proper pytest fixtures.

Tests the pipeline orchestration functionality including query processing,
document retrieval, response generation, and retrieval judge feature.
"""

from unittest.mock import AsyncMock, Mock, patch

from cairo_coder.dspy.document_retriever import DocumentRetrieverProgram
from cairo_coder.dspy.generation_program import McpGenerationProgram
from cairo_coder.dspy.query_processor import QueryProcessorProgram
import dspy
import pytest

from cairo_coder.core.rag_pipeline import (
    RagPipeline,
    RagPipelineConfig,
    RagPipelineFactory,
    create_rag_pipeline,
)
from cairo_coder.core.types import Document, DocumentSource, Message, ProcessedQuery, Role
from cairo_coder.dspy.retrieval_judge import RetrievalJudge
from tests.fixtures.rag_pipeline import (
    make_documents as _make_documents,
)
from tests.fixtures.rag_pipeline import (
    make_processed_query as _make_processed_query,
)
from tests.fixtures.rag_pipeline import (
    mock_document_retriever as _mock_document_retriever,
)
from tests.fixtures.rag_pipeline import (
    mock_retrieval_judge as _mock_retrieval_judge,
)
from tests.fixtures.rag_pipeline import (
    pipeline_config_factory as _pipeline_config_factory,
)
from tests.fixtures.rag_pipeline import (
    pipeline_factory as _pipeline_factory,
)


# Helper function to merge usage dictionaries
def merge_usage_dict(sources: list[dict]) -> dict:
    """Merge usage dictionaries."""
    merged_usage = {}
    for source in sources:
        for model_name, metrics in source.items():
            if model_name not in merged_usage:
                merged_usage[model_name] = {}
            for metric_name, value in metrics.items():
                merged_usage[model_name][metric_name] = merged_usage[model_name].get(metric_name, 0) + value
    return merged_usage


class TestRagPipeline:
    """Test suite for RagPipeline."""

    @pytest.fixture
    def mock_query_processor(self):
        """Create a mock query processor."""
        processor = Mock(spec=QueryProcessorProgram)
        mock_res = ProcessedQuery(
            original="How do I create a Cairo contract?",
            search_queries=["cairo", "contract", "create"],
            reasoning="I need to create a Cairo contract",
            is_contract_related=True,
            is_test_related=False,
            resources=[DocumentSource.CAIRO_BOOK, DocumentSource.STARKNET_DOCS],
        )
        processor.forward.return_value = mock_res
        processor.aforward = AsyncMock(return_value=mock_res)
        processor.get_lm_usage.return_value = {}
        return processor

    @pytest.fixture
    def mock_document_retriever(self):
        """Create a mock document retriever."""
        retriever = Mock(spec=DocumentRetrieverProgram)
        mock_return_value = [
            Document(
                    page_content="Cairo contracts are defined using #[starknet::contract].",
                    metadata={
                        "title": "Cairo Contracts",
                        "url": "https://book.cairo-lang.org/contracts",
                        "source_display": "Cairo Book",
                    },
                ),
                Document(
                    page_content="Storage variables use #[storage] attribute.",
                    metadata={
                        "title": "Storage Variables",
                        "url": "https://docs.starknet.io/storage",
                        "source_display": "Starknet Documentation",
                    },
                ),
            ]
        retriever.aforward = AsyncMock(return_value=mock_return_value)
        retriever.forward = Mock(return_value=mock_return_value)
        retriever.get_lm_usage.return_value = {}
        return retriever

        # Verify components were called
        query_processor.forward.assert_called_once()
        document_retriever.forward.assert_called_once()
        generation_program.forward.assert_called_once()

        async def mock_streaming(*args, **kwargs):
            chunks = [
                "Here's how to create a Cairo contract:\n\n",
                "```cairo\n#[starknet::contract]\n",
                "mod SimpleContract {\n    // Implementation\n}\n```",
            ]
            for chunk in chunks:
                yield chunk

        program.forward_streaming = mock_streaming
        program.get_lm_usage.return_value = {}
        return program

    @pytest.fixture
    def mock_mcp_generation_program(self):
        """Create a mock MCP generation program."""
        program = Mock(spec=McpGenerationProgram)
        mock_res = """
## 1. Cairo Contracts

**Source:** Cairo Book
**URL:** https://book.cairo-lang.org/contracts

Cairo contracts are defined using #[starknet::contract].

---

## 2. Storage Variables

**Source:** Starknet Documentation
**URL:** https://docs.starknet.io/storage

Storage variables use #[storage] attribute.
"""
        program.forward.return_value = dspy.Prediction(answer=mock_res)
        program.get_lm_usage.return_value = {}
        return program

    @pytest.fixture
    def pipeline_config(
        self,
        mock_vector_store_config,
        mock_query_processor,
        mock_document_retriever,
        mock_generation_program,
        mock_mcp_generation_program,
    ):
        """Create a pipeline configuration."""
        return RagPipelineConfig(
            name="test_pipeline",
            vector_store_config=mock_vector_store_config,
            query_processor=mock_query_processor,
            document_retriever=mock_document_retriever,
            generation_program=mock_generation_program,
            mcp_generation_program=mock_mcp_generation_program,
            max_source_count=10,
            similarity_threshold=0.4,
        )

    @pytest.fixture
    def pipeline(self, pipeline_config):
        """Create a RagPipeline instance."""
        return RagPipeline(pipeline_config)

    @pytest.mark.asyncio
    async def test_async_pipeline_execution(self, query_processor, document_retriever, generation_program):
        """Test async pipeline execution."""
        config = _pipeline_config_factory(
            query_processor=query_processor,
            document_retriever=document_retriever,
            generation_program=generation_program,
        )
        pipeline = _pipeline_factory(config)

        result = await pipeline.aforward("How to write Cairo contracts?")

        # Verify async components were called
        query_processor.aforward.assert_called_once()
        document_retriever.aforward.assert_called_once()
        generation_program.aforward.assert_called_once()

        # Verify result
        assert result.answer == "Here's how to write Cairo contracts..."

    @pytest.mark.asyncio
    async def test_streaming_pipeline_execution(self, pipeline_config):
        """Test streaming pipeline execution."""
        pipeline = _pipeline_factory(pipeline_config)

        events = []
        async for event in pipeline.forward_streaming("How to write Cairo contracts?"):
            events.append(event)

        # Verify event sequence
        event_types = [e.type for e in events]
        assert "processing" in event_types
        assert "sources" in event_types
        assert "response" in event_types
        assert "end" in event_types

    def test_mcp_mode_execution(self, pipeline_config, mcp_generation_program):
        """Test MCP mode pipeline execution."""
        config = _pipeline_config_factory(
            mcp_generation_program=mcp_generation_program,
        )
        pipeline = _pipeline_factory(config)

        result = pipeline.forward("How to write Cairo contracts?", mcp_mode=True)

        # Verify MCP program was used
        mcp_generation_program.forward.assert_called_once()
        assert result.answer == "MCP formatted docs"

    def test_pipeline_with_chat_history(self, pipeline_config):
        """Test pipeline with chat history."""
        pipeline = _pipeline_factory(pipeline_config)

        chat_history = [
            Message(role=Role.USER, content="Previous question"),
            Message(role=Role.ASSISTANT, content="Previous answer"),
        ]

        pipeline.forward("Follow-up question", chat_history=chat_history)

        # Verify chat history was formatted and passed
        call_args = pipeline_config.query_processor.forward.call_args
        assert "User: Previous question" in call_args[1]["chat_history"]
        assert "Assistant: Previous answer" in call_args[1]["chat_history"]

    def test_pipeline_with_custom_sources(self, pipeline_config):
        """Test pipeline with custom sources."""
        pipeline = _pipeline_factory(pipeline_config)

        sources = [DocumentSource.SCARB_DOCS]
        pipeline.forward("Scarb question", sources=sources)

        # Verify sources were passed to retriever
        call_args = pipeline_config.document_retriever.forward.call_args[1]
        assert call_args["sources"] == sources

    def test_empty_documents_handling(self, query_processor, generation_program):
        """Test pipeline handling of empty document list."""
        # Create retriever that returns empty list
        empty_retriever = _mock_document_retriever([])

        config = _pipeline_config_factory(
            query_processor=query_processor,
            document_retriever=empty_retriever,
            generation_program=generation_program,
        )
        pipeline = _pipeline_factory(config)

        pipeline.forward("test query")

        # Verify generation was called with "No relevant documentation found"
        call_args = generation_program.forward.call_args
        assert "No relevant documentation found" in call_args[1]["context"]

    @pytest.mark.asyncio
    async def test_pipeline_error_handling(self, query_processor, generation_program):
        """Test pipeline error handling."""
        # Create failing retriever
        failing_retriever = Mock()
        failing_retriever.aforward.side_effect = Exception("Retrieval error")

        config = _pipeline_config_factory(
            query_processor=query_processor,
            document_retriever=failing_retriever,
            generation_program=generation_program,
        )
        pipeline = _pipeline_factory(config)

        events = []
        async for event in pipeline.forward_streaming("test query"):
            events.append(event)

        # Should have an error event
        error_events = [e for e in events if e.type == "error"]
        assert len(error_events) == 1
        assert "Retrieval error" in error_events[0].data


class TestRagPipelineWithJudge:
    """Tests for RAG Pipeline with Retrieval Judge feature."""

    @patch("dspy.LM")
    @patch("dspy.context")
    @patch("cairo_coder.core.rag_pipeline.RetrievalJudge")
    def test_judge_enabled_filters_documents(self, mock_judge_class, mock_dspy_context, mock_dspy_lm, patch_dspy_parallel, query_processor, generation_program):
        """Test that judge filters out low-scoring documents."""
        # Create documents with varying relevance
        docs = _make_documents([
            ("Cairo Contracts", "Cairo contract content", "cairo_book"),
            ("Python Guide", "Python content", "python_docs"),
            ("Cairo Storage", "Cairo storage content", "cairo_book"),
        ])

        # Setup judge with specific scores
        judge = _mock_retrieval_judge({
            "Cairo Contracts": 0.8,
            "Python Guide": 0.2,  # Below threshold
            "Cairo Storage": 0.7,
        })
        mock_judge_class.return_value = judge

        config = _pipeline_config_factory(
            query_processor=query_processor,
            document_retriever=_mock_document_retriever(docs),
            generation_program=generation_program,
        )
        pipeline = _pipeline_factory(config)

        pipeline.forward("Cairo question")

        # Verify judge was called
        judge.forward.assert_called_once()

        # Verify context only contains high-scoring docs
        call_args = generation_program.forward.call_args
        context = call_args[1]["context"]
        assert "Cairo contract content" in context
        assert "Cairo storage content" in context
        assert "Python content" not in context

    @patch("dspy.LM")
    @patch("dspy.context")
    def test_judge_disabled_passes_all_documents(self, mock_dspy_context, mock_dspy_lm, documents, generation_program):
        """Test that when judge fails, all documents are passed through."""
        # Mock the judge to fail
        with patch("cairo_coder.core.rag_pipeline.RetrievalJudge") as mock_judge_class:
            judge = Mock()
            judge.forward.side_effect = Exception("Judge failed")
            judge.aforward.side_effect = Exception("Judge failed")
            mock_judge_class.return_value = judge

            config = _pipeline_config_factory(
                document_retriever=_mock_document_retriever(documents),
                generation_program=generation_program,
            )
            pipeline = _pipeline_factory(config)

            pipeline.forward("test query")

            # Verify judge exists
            assert pipeline.retrieval_judge is not None

            # All documents should be in context (because judge failed)
            call_args = generation_program.forward.call_args
            context = call_args[1]["context"]
            for doc in documents:
                assert doc.page_content in context

    @pytest.mark.parametrize("threshold", [0.0, 0.4, 0.6, 0.9])
    @patch("dspy.LM")
    @patch("dspy.context")
    @patch("cairo_coder.core.rag_pipeline.RetrievalJudge")
    def test_judge_threshold_parameterization(self, mock_judge_class, mock_dspy_context, mock_dspy_lm, threshold, patch_dspy_parallel, documents):
        """Test different judge thresholds."""
        # Judge with scores: 0.9, 0.3, 0.1, 0.8
        judge = _mock_retrieval_judge(threshold=threshold)
        mock_judge_class.return_value = judge

        config = _pipeline_config_factory(
            document_retriever=_mock_document_retriever(documents),
        )
        pipeline = _pipeline_factory(config)

        pipeline.forward("test query")

        # Count filtered docs based on threshold
        expected_count = sum(1 for score in [0.9, 0.3, 0.1, 0.8] if score >= threshold)

        # Verify judge was called
        judge.forward.assert_called_once()

        # Check that the pipeline stored the correct number of filtered documents
        assert hasattr(pipeline, "_current_documents")
        filtered_docs = pipeline._current_documents
        assert len(filtered_docs) == expected_count

        # Verify all filtered docs meet threshold
        for doc in filtered_docs:
            assert doc.metadata.get("llm_judge_score", 0) >= threshold

    @patch("dspy.LM")
    @patch("dspy.context")
    @patch("cairo_coder.core.rag_pipeline.RetrievalJudge")
    def test_judge_failure_fallback(self, mock_judge_class, mock_dspy_context, mock_dspy_lm, documents, generation_program):
        """Test fallback when judge fails."""
        # Create failing judge
        judge = Mock(spec=RetrievalJudge)
        judge.forward.side_effect = Exception("Judge failed")
        judge.aforward.side_effect = Exception("Judge failed")
        mock_judge_class.return_value = judge

        config = _pipeline_config_factory(
            document_retriever=_mock_document_retriever(documents),
            generation_program=generation_program,
        )
        pipeline = _pipeline_factory(config)

        # Should not raise, should use all docs
        pipeline.forward("test query")

        # All documents should be passed through
        call_args = generation_program.forward.call_args
        context = call_args[1]["context"]
        for doc in documents:
            assert doc.page_content in context

    @patch("dspy.LM")
    @patch("dspy.context")
    @patch("cairo_coder.core.rag_pipeline.RetrievalJudge")
    def test_judge_parse_error_handling(self, mock_judge_class, mock_dspy_context, mock_dspy_lm, patch_dspy_parallel, generation_program):
        """Test handling of parse errors in judge scores."""
        docs = _make_documents([
            ("Doc1", "Content1", "source1"),
            ("Doc2", "Content2", "source2"),
        ])

        # Create judge that returns invalid score
        judge = Mock(spec=RetrievalJudge)

        def filter_with_parse_error(query, documents):
            # First doc gets invalid score, second gets valid
            documents[0].metadata["llm_judge_score"] = "invalid"  # Will cause parse error
            documents[0].metadata["llm_judge_reason"] = "Parse error"

            documents[1].metadata["llm_judge_score"] = 0.8
            documents[1].metadata["llm_judge_reason"] = "Good doc"

            # In the real implementation, docs with parse errors are now DROPPED.
            # The mock's side effect must replicate the real judge's behavior.
            return [documents[1]]

        judge.forward = Mock(side_effect=filter_with_parse_error)
        judge.threshold = 0.5
        mock_judge_class.return_value = judge

        config = _pipeline_config_factory(
            document_retriever=_mock_document_retriever(docs),
            generation_program=generation_program,
        )
        pipeline = _pipeline_factory(config)

        pipeline.forward("test query")

        # The doc with the parse error ("Content1") should be dropped and not in the context.
        call_args = generation_program.forward.call_args
        context = call_args[1]["context"]
        assert "Content1" not in context
        assert "Content2" in context

    @pytest.mark.asyncio
    @patch("dspy.LM")
    @patch("dspy.context")
    @patch("cairo_coder.core.rag_pipeline.RetrievalJudge")
    async def test_async_judge_execution(self, mock_judge_class, mock_dspy_context, mock_dspy_lm, patch_dspy_parallel, documents):
        """Test async execution with judge."""
        judge = _mock_retrieval_judge()
        mock_judge_class.return_value = judge

        config = _pipeline_config_factory(
            document_retriever=_mock_document_retriever(documents),
        )
        pipeline = _pipeline_factory(config)

        result = await pipeline.aforward("test query")

        # Verify async judge was called
        judge.aforward.assert_called_once()
        assert result.answer == "Here's how to write Cairo contracts..."

    @pytest.mark.asyncio
    @patch("dspy.LM")
    @patch("dspy.context")
    @patch("cairo_coder.core.rag_pipeline.RetrievalJudge")
    async def test_streaming_with_judge(self, mock_judge_class, mock_dspy_context, mock_dspy_lm, patch_dspy_parallel, documents):
        """Test streaming execution with judge."""
        judge = _mock_retrieval_judge()
        mock_judge_class.return_value = judge

        config = _pipeline_config_factory(
            document_retriever=_mock_document_retriever(documents),
        )
        pipeline = _pipeline_factory(config)

        events = []
        async for event in pipeline.forward_streaming("test query"):
            events.append(event)

        # Verify judge was called
        judge.aforward.assert_called_once()

        # Verify filtered sources in event
        sources_event = next(e for e in events if e.type == "sources")
        # Should only have 2 docs (Cairo-related ones based on default mock scores)
        assert len(sources_event.data) == 2

    @patch("dspy.LM")
    @patch("dspy.context")
    @patch("cairo_coder.core.rag_pipeline.RetrievalJudge")
    def test_judge_metadata_enrichment(self, mock_judge_class, mock_dspy_context, mock_dspy_lm, patch_dspy_parallel, generation_program):
        """Test that judge adds metadata to documents."""
        docs = _make_documents([("Test Doc", "Test content", "test_source")])
        judge = _mock_retrieval_judge({"Test Doc": 0.75})
        mock_judge_class.return_value = judge

        config = _pipeline_config_factory(
            document_retriever=_mock_document_retriever(docs),
            generation_program=generation_program,
        )
        pipeline = _pipeline_factory(config)

        pipeline.forward("test query")

        # Check that judge was called and documents have metadata
        judge.forward.assert_called_once()

        # Verify that generation received the filtered document with metadata
        gen_call_args = generation_program.forward.call_args[1]
        context = gen_call_args["context"]

        # The document should be in the context (score 0.75 is above threshold)
        assert "Test content" in context

    @patch("cairo_coder.core.rag_pipeline.RetrievalJudge")
    def test_get_lm_usage(self, mock_retrieval_judge_class):
        # Mock generation program to return usage, mock retrieval judge to return usage, mock query processor to return usage
        generation_program = Mock()
        query_processor = Mock()
        retrieval_judge = Mock()
        retrieval_judge.get_lm_usage = Mock(return_value={"model/name": {"prompt_tokens": 200, "completion_tokens": 150}})
        generation_program.get_lm_usage = Mock(return_value={"model/name": {"prompt_tokens": 100, "completion_tokens": 50}})
        query_processor.get_lm_usage = Mock(return_value={"model/name": {"prompt_tokens": 300, "completion_tokens": 250}})

        # Configure the class mock to return our instance mock
        mock_retrieval_judge_class.return_value = retrieval_judge

        docs = _make_documents([("Test Doc", "Test content", "test_source")])
        config = _pipeline_config_factory(
            query_processor=query_processor,
            document_retriever=_mock_document_retriever(docs),
            generation_program=generation_program,
        )
        pipeline = _pipeline_factory(config)

        usage = pipeline.get_lm_usage()
        assert usage == {"model/name": {"prompt_tokens": 600, "completion_tokens": 450}}


class TestRagPipelineFactory:
    """Tests for RagPipelineFactory."""

    def test_create_pipeline_with_judge_params(self, mock_vector_store_config, mock_pgvector_rm):
        """Test factory creates pipeline with judge parameters."""
        with (
            patch("cairo_coder.core.rag_pipeline.os.path.exists", return_value=True),
            patch.object(RagPipeline, "load"),
            patch("cairo_coder.core.rag_pipeline.DocumentRetrieverProgram") as mock_retriever,
            patch("cairo_coder.core.rag_pipeline.QueryProcessorProgram"),
            patch("cairo_coder.core.rag_pipeline.GenerationProgram"),
            patch("cairo_coder.core.rag_pipeline.McpGenerationProgram"),
        ):
            # Make retriever use the mocked pgvector
            mock_retriever.return_value.vector_db = mock_pgvector_rm

            pipeline = RagPipelineFactory.create_pipeline(
                name="test",
                vector_store_config=mock_vector_store_config,
            )

            assert isinstance(pipeline.retrieval_judge, RetrievalJudge)

    def test_create_pipeline_judge_disabled(self, mock_vector_store_config, mock_pgvector_rm):
        """Test factory with judge disabled."""
        with (
            patch("cairo_coder.core.rag_pipeline.os.path.exists", return_value=True),
            patch.object(RagPipeline, "load"),
            patch("cairo_coder.core.rag_pipeline.DocumentRetrieverProgram") as mock_retriever,
            patch("cairo_coder.core.rag_pipeline.QueryProcessorProgram"),
            patch("cairo_coder.core.rag_pipeline.GenerationProgram"),
            patch("cairo_coder.core.rag_pipeline.McpGenerationProgram"),
        ):
            # Make retriever use the mocked pgvector
            mock_retriever.return_value.vector_db = mock_pgvector_rm

            pipeline = RagPipelineFactory.create_pipeline(
                name="test",
                vector_store_config=mock_vector_store_config,
            )

            assert pipeline.retrieval_judge is not None

    def test_optimizer_file_missing_error(self, mock_vector_store_config, mock_pgvector_rm):
        """Test error when optimizer file is missing."""
        with (
            patch("cairo_coder.core.rag_pipeline.os.path.exists", return_value=False),
            patch("cairo_coder.core.rag_pipeline.DocumentRetrieverProgram") as mock_retriever,
            patch("cairo_coder.core.rag_pipeline.QueryProcessorProgram"),
            patch("cairo_coder.core.rag_pipeline.GenerationProgram"),
            patch("cairo_coder.core.rag_pipeline.McpGenerationProgram"),
        ):
            # Make retriever use the mocked pgvector
            mock_retriever.return_value.vector_db = mock_pgvector_rm

            with pytest.raises(FileNotFoundError, match="optimized_rag.json not found"):
                RagPipelineFactory.create_pipeline(
                    name="test",
                    vector_store_config=mock_vector_store_config,
                )


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
                    "url": "https://example.com",
                    "source_display": "Test Source",
                },
            )
        ]

        sources = rag_pipeline._format_sources(docs)

        assert len(sources) == 1
        assert sources[0]["title"] == "Test Doc"
        assert len(sources[0]["content_preview"]) == 203  # 200 + "..."
        assert sources[0]["content_preview"].endswith("...")

    def test_prepare_context_with_templates(self):
        """Test context preparation with templates."""
        config = _pipeline_config_factory(
            contract_template="Contract guidelines",
            test_template="Test guidelines"
        )
        pipeline = _pipeline_factory(config)

        docs = _make_documents([("Doc", "Content", "source")])

        # Contract-related query
        query = _make_processed_query(is_contract_related=True)
        context = pipeline._prepare_context(docs, query)
        assert "Contract Development Guidelines:" in context
        assert "Contract guidelines" in context

        # Test-related query
        query = _make_processed_query(is_test_related=True, is_contract_related=False)
        context = pipeline._prepare_context(docs, query)
        assert "Testing Guidelines:" in context
        assert "Test guidelines" in context

    def test_get_current_state(self, documents):
        """Test pipeline state retrieval."""
        config = _pipeline_config_factory()
        pipeline = _pipeline_factory(config)

        # Set internal state
        pipeline._current_processed_query = _make_processed_query()
        pipeline._current_documents = documents

        state = pipeline.get_current_state()

        assert state["processed_query"] is not None
        assert state["documents_count"] == 4
        assert len(state["documents"]) == 4
        assert state["config"]["name"] == "test-pipeline"

    # Define reusable usage constants to keep tests DRY
    _QUERY_USAGE_MINI = {
        "gpt-4o-mini": {"prompt_tokens": 200, "completion_tokens": 100, "total_tokens": 300}
    }
    _GEN_USAGE_MINI = {
        "gpt-4o-mini": {"prompt_tokens": 1000, "completion_tokens": 500, "total_tokens": 1500}
    }
    _GEN_USAGE_FULL = {
        "gpt-4o": {"prompt_tokens": 1000, "completion_tokens": 500, "total_tokens": 1500}
    }


    @pytest.mark.parametrize(
        "query_usage, generation_usage, expected_usage",
        [
            pytest.param(
                _QUERY_USAGE_MINI,
                _GEN_USAGE_MINI,
                merge_usage_dict([_QUERY_USAGE_MINI, _GEN_USAGE_MINI]),
                id="same_model_aggregation",
            ),
            pytest.param(
                _QUERY_USAGE_MINI,
                _GEN_USAGE_FULL,
                merge_usage_dict([_QUERY_USAGE_MINI, _GEN_USAGE_FULL]),
                id="different_model_aggregation",
            ),
            pytest.param({}, {}, {}, id="empty_usage"),
            pytest.param(
                _QUERY_USAGE_MINI, {}, _QUERY_USAGE_MINI, id="partial_empty_usage"
            ),
        ],
    )
    def test_get_lm_usage_aggregation(
        self, pipeline, query_usage, generation_usage, expected_usage
    ):
        """Tests that get_lm_usage correctly aggregates token usage from its components."""
        # The RAG pipeline implementation merges dictionaries with query_usage taking precedence
        pipeline.query_processor.get_lm_usage.return_value = query_usage
        pipeline.generation_program.get_lm_usage.return_value = generation_usage

        result = pipeline.get_lm_usage()

        pipeline.query_processor.get_lm_usage.assert_called_once()
        pipeline.generation_program.get_lm_usage.assert_called_once()

        assert result == expected_usage

    @pytest.mark.asyncio
    @pytest.mark.parametrize(
        "mcp_mode, expected_usage",
        [
            pytest.param(True, _QUERY_USAGE_MINI, id="mcp_mode"),
            pytest.param(
                False, merge_usage_dict([_QUERY_USAGE_MINI, _GEN_USAGE_FULL]), id="normal_mode"
            ),
        ],
    )
    async def test_get_lm_usage_after_streaming(
        self, pipeline, mcp_mode, expected_usage
    ):
        """Tests that get_lm_usage works correctly after a streaming execution."""
        # To test token aggregation, we mock the return values of sub-components'
        # get_lm_usage methods. The test logic simulates which components would
        # be "active" in each mode by setting others to return empty usage.
        pipeline.query_processor.get_lm_usage.return_value = self._QUERY_USAGE_MINI
        if mcp_mode:
            pipeline.generation_program.get_lm_usage.return_value = {}
            # MCP program doesn't use an LM, so its usage is empty
            pipeline.mcp_generation_program.get_lm_usage.return_value = {}
        else:
            pipeline.generation_program.get_lm_usage.return_value = self._GEN_USAGE_FULL
            pipeline.mcp_generation_program.get_lm_usage.return_value = {}

        # Execute the pipeline to ensure the full flow is invoked.
        async for _ in pipeline.forward_streaming(
            query="How do I create a Cairo contract?", mcp_mode=mcp_mode
        ):
            pass

        result = pipeline.get_lm_usage()

        assert result == expected_usage
        pipeline.query_processor.get_lm_usage.assert_called()
        pipeline.generation_program.get_lm_usage.assert_called()


class TestConvenienceFunctions:
    """Tests for convenience functions."""

    def test_create_pipeline_with_defaults(self, mock_vector_store_config):
        """Test creating pipeline with default components."""
        with (
            patch("cairo_coder.dspy.create_query_processor") as mock_create_qp,
            patch("cairo_coder.dspy.DocumentRetrieverProgram") as mock_create_dr,
            patch("cairo_coder.dspy.create_generation_program") as mock_create_gp,
            patch("cairo_coder.dspy.create_mcp_generation_program") as mock_create_mcp,
        ):
            mock_create_qp.return_value = Mock()
            mock_create_dr.return_value = Mock()
            mock_create_gp.return_value = Mock()
            mock_create_mcp.return_value = Mock()

            pipeline = RagPipelineFactory.create_pipeline(
                name="test_pipeline", vector_store_config=mock_vector_store_config
            )

            assert isinstance(pipeline, RagPipeline)
            assert pipeline.config.name == "test_pipeline"
            assert pipeline.config.vector_store_config == mock_vector_store_config
            assert pipeline.config.max_source_count == 5
            assert pipeline.config.similarity_threshold == 0.4

            # Verify factory functions were called
            mock_create_qp.assert_called_once()
            mock_create_dr.assert_called_once_with(
                vector_store_config=mock_vector_store_config,
                max_source_count=5,
                similarity_threshold=0.4,
                vector_db=None,
            )
            mock_create_gp.assert_called_once_with("general")
            mock_create_mcp.assert_called_once()

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
            contract_template="Custom contract template",
            test_template="Custom test template",
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
        assert pipeline.config.contract_template == "Custom contract template"
        assert pipeline.config.test_template == "Custom test template"

    def test_create_scarb_pipeline(self, mock_vector_store_config):
        """Test creating Scarb-specific pipeline."""
        with patch("cairo_coder.dspy.create_generation_program") as mock_create_gp, patch(
            "cairo_coder.dspy.document_retriever.SourceFilteredPgVectorRM"
        ):
            mock_scarb_program = Mock()
            mock_create_gp.return_value = mock_scarb_program

            pipeline = RagPipelineFactory.create_scarb_pipeline(
                name="scarb_pipeline", vector_store_config=mock_vector_store_config
            )

            assert isinstance(pipeline, RagPipeline)
            assert pipeline.config.name == "scarb_pipeline"
            assert pipeline.config.sources == [DocumentSource.SCARB_DOCS]
            assert pipeline.config.max_source_count == 5

            # Verify Scarb generation program was created
            mock_create_gp.assert_called_with("scarb")

    def test_create_rag_pipeline_convenience_function(self, mock_vector_store_config):
        """Test the convenience function for creating RAG pipeline."""
        with patch(
            "cairo_coder.core.rag_pipeline.RagPipelineFactory.create_pipeline"
        ) as mock_create:
            mock_create.return_value = Mock()

            create_rag_pipeline(
                name="test",
                vector_store_config=mock_vector_store_config,
            )

            mock_create.assert_called_once_with(
                "test", mock_vector_store_config
            )
