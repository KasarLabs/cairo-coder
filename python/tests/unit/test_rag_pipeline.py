"""
Unit tests for RAG Pipeline.

Tests the pipeline orchestration functionality including query processing,
document retrieval, and response generation.
"""

from unittest.mock import AsyncMock, Mock, patch

import pytest
import dspy
from cairo_coder.core.rag_pipeline import (
    RagPipeline,
    RagPipelineConfig,
    RagPipelineFactory,
    create_rag_pipeline,
)
from cairo_coder.core.types import Document, DocumentSource, Message, ProcessedQuery, Role
from cairo_coder.dspy.document_retriever import DocumentRetrieverProgram
from cairo_coder.dspy.generation_program import GenerationProgram, McpGenerationProgram
from cairo_coder.dspy.query_processor import QueryProcessorProgram

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

@pytest.fixture(scope='function')
def mock_pgvector_rm():
    """Patch the vector database for the document retriever."""
    with patch("cairo_coder.dspy.document_retriever.SourceFilteredPgVectorRM") as mock_pgvector_rm:
        mock_instance = Mock()
        mock_instance.aforward = AsyncMock(return_value=[])
        mock_instance.forward = Mock(return_value=[])
        mock_pgvector_rm.return_value = mock_instance
        yield mock_pgvector_rm


@pytest.fixture(scope='session')
def mock_embedder():
    """Mock the embedder."""
    with patch("cairo_coder.dspy.document_retriever.dspy.Embedder") as mock_embedder:
        mock_embedder.return_value = Mock()
        yield mock_embedder


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

    @pytest.fixture
    def mock_generation_program(self):
        """Create a mock generation program."""
        program = Mock(spec=GenerationProgram)

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
    async def test_normal_pipeline_execution(self, pipeline: RagPipeline):
        """Test normal pipeline execution with generation."""
        query = "How do I create a Cairo contract?"

        events = []
        async for event in pipeline.forward_streaming(query=query):
            events.append(event)

        # Verify event sequence
        event_types = [event.type for event in events]
        assert "processing" in event_types
        assert "sources" in event_types
        assert "response" in event_types
        assert "end" in event_types

        # Verify sources event
        sources_event = next(e for e in events if e.type == "sources")
        assert isinstance(sources_event.data, list)
        assert len(sources_event.data) == 2
        assert sources_event.data[0]["title"] == "Cairo Contracts"
        assert sources_event.data[1]["title"] == "Storage Variables"

        # Verify response events
        response_events = [e for e in events if e.type == "response"]
        assert len(response_events) == 3  # Three chunks from mock

        # Verify end event
        end_event = next(e for e in events if e.type == "end")
        assert end_event.data is None

    @pytest.mark.asyncio
    async def test_mcp_mode_pipeline_execution(self, pipeline):
        """Test MCP mode pipeline execution."""
        query = "How do I create a Cairo contract?"

        events = []
        async for event in pipeline.forward_streaming(query=query, mcp_mode=True):
            events.append(event)

        # Verify event sequence
        event_types = [event.type for event in events]
        assert "processing" in event_types
        assert "sources" in event_types
        assert "response" in event_types
        assert "end" in event_types

        # Verify MCP response
        response_events = [e for e in events if e.type == "response"]
        assert len(response_events) == 1
        response_data = response_events[0].data
        assert "## 1. Cairo Contracts" in response_data
        assert "Cairo Book" in response_data
        assert "Storage Variables" in response_data

    @pytest.mark.asyncio
    async def test_pipeline_with_chat_history(self, pipeline):
        """Test pipeline execution with chat history."""
        query = "How do I add storage to that contract?"
        chat_history = [
            Message(role=Role.USER, content="How do I create a contract?"),
            Message(role=Role.ASSISTANT, content="Here's how to create a contract..."),
        ]

        events = []
        async for event in pipeline.forward_streaming(query=query, chat_history=chat_history):
            events.append(event)

        # Verify pipeline executed successfully
        assert len(events) > 0
        assert events[-1].type == "end"

        # Verify chat history was formatted and passed
        pipeline.query_processor.aforward.assert_called_once()
        call_args = pipeline.query_processor.aforward.call_args
        assert "User:" in call_args[1]["chat_history"]
        assert "Assistant:" in call_args[1]["chat_history"]

    @pytest.mark.asyncio
    async def test_pipeline_with_custom_sources(self, pipeline):
        """Test pipeline execution with custom sources."""
        query = "How do I configure Scarb?"
        sources = [DocumentSource.SCARB_DOCS]

        events = []
        async for event in pipeline.forward_streaming(query=query, sources=sources):
            events.append(event)

        # Verify custom sources were used
        pipeline.document_retriever.aforward.assert_called_once()
        call_args = pipeline.document_retriever.aforward.call_args[1]
        assert call_args["sources"] == sources

    @pytest.mark.asyncio
    async def test_pipeline_error_handling(self, pipeline):
        """Test pipeline error handling."""
        # Mock an error in document retrieval
        pipeline.document_retriever.aforward.side_effect = Exception("Retrieval error")
        pipeline.document_retriever.forward.side_effect = Exception("Retrieval error")

        query = "How do I create a contract?"

        events = []
        async for event in pipeline.forward_streaming(query=query):
            events.append(event)

        # Should have an error event
        error_events = [e for e in events if e.type == "error"]
        assert len(error_events) == 1
        assert "error" in error_events[0].data.lower()

    def test_format_chat_history(self, pipeline):
        """Test chat history formatting."""
        messages = [
            Message(role=Role.USER, content="How do I create a contract?"),
            Message(role=Role.ASSISTANT, content="Here's how..."),
            Message(role=Role.USER, content="How do I add storage?"),
        ]

        formatted = pipeline._format_chat_history(messages)

        assert "User: How do I create a contract?" in formatted
        assert "Assistant: Here's how..." in formatted
        assert "User: How do I add storage?" in formatted
        assert formatted.count("User:") == 2
        assert formatted.count("Assistant:") == 1

    def test_format_empty_chat_history(self, pipeline):
        """Test formatting empty chat history."""
        formatted = pipeline._format_chat_history([])
        assert formatted == ""

    def test_format_sources(self, pipeline):
        """Test source formatting."""
        documents = [
            Document(
                page_content="This is a long document content that should be truncated when creating preview..."
                + "x" * 200,
                metadata={
                    "title": "Test Document",
                    "url": "https://example.com",
                    "source_display": "Test Source",
                },
            )
        ]

        sources = pipeline._format_sources(documents)

        assert len(sources) == 1
        source = sources[0]
        assert source["title"] == "Test Document"
        assert source["url"] == "https://example.com"
        assert source["source_display"] == "Test Source"
        assert len(source["content_preview"]) <= 203  # 200 chars + "..."
        assert source["content_preview"].endswith("...")

    def test_prepare_context(self, pipeline):
        """Test context preparation."""
        documents = [
            Document(
                page_content="Cairo contracts are defined using #[starknet::contract].",
                metadata={
                    "title": "Cairo Contracts",
                    "url": "https://book.cairo-lang.org/contracts",
                    "source_display": "Cairo Book",
                },
            )
        ]

        processed_query = ProcessedQuery(
            original="How do I create a Cairo contract?",
            reasoning="I need to create a Cairo contract",
            search_queries=["cairo", "contract"],
            is_contract_related=True,
            is_test_related=False,
            resources=[DocumentSource.CAIRO_BOOK],
        )

        context = pipeline._prepare_context(documents, processed_query)

        assert "## 1. Cairo Contracts" in context
        assert "Source: Cairo Book" in context
        assert "starknet::contract" in context

    def test_prepare_context_empty_documents(self, pipeline):
        """Test context preparation with empty documents."""
        processed_query = ProcessedQuery(
            original="Test query",
            reasoning="I need to write tests for a Cairo contract",
            search_queries=["test"],
            is_contract_related=False,
            is_test_related=False,
            resources=[],
        )

        context = pipeline._prepare_context([], processed_query)
        assert "No relevant documentation found." in context

    def test_prepare_context_with_templates(self, pipeline):
        """Test context preparation with templates."""
        # Set templates in config
        pipeline.config.contract_template = "Contract template content"
        pipeline.config.test_template = "Test template content"

        documents = [Document(page_content="Test doc", metadata={})]

        # Test contract template
        processed_query = ProcessedQuery(
            original="Contract query",
            reasoning="I need to create a Cairo contract",
            search_queries=["contract"],
            is_contract_related=True,
            is_test_related=False,
            resources=[],
        )

        context = pipeline._prepare_context(documents, processed_query)
        assert "Contract Development Guidelines:" in context
        assert "Contract template content" in context

        # Test test template
        processed_query = ProcessedQuery(
            original="Test query",
            search_queries=["test"],
            reasoning="I need to write tests for a Cairo contract",
            is_contract_related=False,
            is_test_related=True,
            resources=[],
        )

        context = pipeline._prepare_context(documents, processed_query)
        assert "Testing Guidelines:" in context
        assert "Test template content" in context

    def test_get_current_state(self, pipeline):
        """Test getting current pipeline state."""
        # Set some state
        pipeline._current_processed_query = ProcessedQuery(
            original="test",
            search_queries=["test"],
            reasoning="I need to write tests for a Cairo contract",
            is_contract_related=False,
            is_test_related=False,
            resources=[],
        )
        pipeline._current_documents = [Document(page_content="test", metadata={})]

        state = pipeline.get_current_state()

        assert state["processed_query"] is not None
        assert state["documents_count"] == 1
        assert len(state["documents"]) == 1
        assert state["config"]["name"] == "test_pipeline"
        assert state["config"]["max_source_count"] == 10
        assert state["config"]["similarity_threshold"] == 0.4

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


class TestRagPipelineFactory:
    """Test suite for RagPipelineFactory."""

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

    def test_create_scarb_pipeline(self, mock_vector_store_config, mock_pgvector_rm: Mock):
        """Test creating Scarb-specific pipeline."""
        with patch("cairo_coder.dspy.create_generation_program") as mock_create_gp:
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
                name="convenience_pipeline",
                vector_store_config=mock_vector_store_config,
                max_source_count=15,
            )

            mock_create.assert_called_once_with(
                "convenience_pipeline", mock_vector_store_config, max_source_count=15
            )


class TestRagPipelineConfig:
    """Test suite for RagPipelineConfig."""

    def test_pipeline_config_creation(self):
        """Test creating pipeline configuration."""
        mock_vector_store_config = Mock()
        mock_query_processor = Mock()
        mock_document_retriever = Mock()
        mock_generation_program = Mock()
        mock_mcp_program = Mock()

        config = RagPipelineConfig(
            name="test_config",
            vector_store_config=mock_vector_store_config,
            query_processor=mock_query_processor,
            document_retriever=mock_document_retriever,
            generation_program=mock_generation_program,
            mcp_generation_program=mock_mcp_program,
            max_source_count=15,
            similarity_threshold=0.5,
            sources=[DocumentSource.CAIRO_BOOK],
            contract_template="Contract template",
            test_template="Test template",
        )

        assert config.name == "test_config"
        assert config.vector_store_config == mock_vector_store_config
        assert config.query_processor == mock_query_processor
        assert config.document_retriever == mock_document_retriever
        assert config.generation_program == mock_generation_program
        assert config.mcp_generation_program == mock_mcp_program
        assert config.max_source_count == 15
        assert config.similarity_threshold == 0.5
        assert config.sources == [DocumentSource.CAIRO_BOOK]
        assert config.contract_template == "Contract template"
        assert config.test_template == "Test template"

    def test_pipeline_config_defaults(self):
        """Test pipeline configuration with default values."""
        config = RagPipelineConfig(
            name="default_config",
            vector_store_config=Mock(),
            query_processor=Mock(),
            document_retriever=Mock(),
            generation_program=Mock(),
            mcp_generation_program=Mock(),
        )

        assert config.max_source_count == 10
        assert config.similarity_threshold == 0.4
        assert config.sources is None
        assert config.contract_template is None
        assert config.test_template is None
