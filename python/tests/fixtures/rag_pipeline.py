"""Fixtures for RAG Pipeline tests."""

from typing import Any
from unittest.mock import AsyncMock, Mock, patch

import dspy

from cairo_coder.core.config import VectorStoreConfig
from cairo_coder.core.rag_pipeline import RagPipeline, RagPipelineConfig
from cairo_coder.core.types import Document, DocumentSource, ProcessedQuery
from cairo_coder.dspy.document_retriever import DocumentRetrieverProgram
from cairo_coder.dspy.generation_program import GenerationProgram, McpGenerationProgram
from cairo_coder.dspy.query_processor import QueryProcessorProgram
from cairo_coder.dspy.retrieval_judge import RetrievalJudge


def make_processed_query(
    original: str = "How to write Cairo smart contracts?",
    search_queries: list[str] | None = None,
    reasoning: str = "User wants to learn about Cairo smart contracts",
    is_contract_related: bool = True,
    is_test_related: bool = False,
    resources: list[DocumentSource] | None = None,
) -> ProcessedQuery:
    """Factory function to create ProcessedQuery instances for testing."""
    if search_queries is None:
        search_queries = ["cairo smart contract", "cairo contract syntax"]
    if resources is None:
        resources = [DocumentSource.CAIRO_BOOK]

    return ProcessedQuery(
        original=original,
        search_queries=search_queries,
        reasoning=reasoning,
        is_contract_related=is_contract_related,
        is_test_related=is_test_related,
        resources=resources,
    )


def make_documents(
    doc_specs: list[tuple[str, str, str]] | None = None
) -> list[Document]:
    """
    Factory function to create Document instances for testing.

    Args:
        doc_specs: List of (title, content, source) tuples.
                  If None, returns default set of documents.

    Returns:
        List of Document instances
    """
    if doc_specs is None:
        doc_specs = [
            (
                "Cairo Smart Contracts",
                "Cairo smart contracts use the #[starknet::contract] attribute...",
                "cairo_book"
            ),
            (
                "Starknet Overview",
                "Starknet is a Layer 2 scaling solution for Ethereum...",
                "starknet_docs"
            ),
            (
                "Python Basics",
                "Python is a programming language used for many applications...",
                "python_docs"
            ),
            (
                "Cairo Storage",
                "Cairo storage variables are defined with #[storage] attribute...",
                "cairo_book"
            ),
        ]

    documents = []
    for title, content, source in doc_specs:
        doc = Document(
            page_content=content,
            metadata={"title": title, "source": source}
        )
        documents.append(doc)

    return documents


def mock_retrieval_judge(
    score_map: dict[str, float] | None = None,
    default_score: float = 0.5,
    threshold: float = 0.4,
) -> Mock:
    """
    Create a mock RetrievalJudge with configurable scoring.

    Args:
        score_map: Mapping of document title to score (0-1).
                  If None, uses default scoring.
        default_score: Default score for documents not in score_map.

    Returns:
        Mock RetrievalJudge instance
    """
    if score_map is None:
        score_map = {
            "Cairo Smart Contracts": 0.9,
            "Cairo Storage": 0.8,
            "Starknet Overview": 0.3,
            "Python Basics": 0.1,
        }

    judge = Mock(spec=RetrievalJudge)

    def filter_docs(query: str, documents: list[Document]) -> list[Document]:
        """Filter documents based on score_map."""
        filtered = []
        for doc in documents:
            title = doc.metadata.get("title", "")
            score = score_map.get(title, default_score)

            # Add judge metadata
            doc.metadata["llm_judge_score"] = score
            doc.metadata["llm_judge_reason"] = f"Document '{title}' scored {score} for relevance"

            # Filter based on threshold (default 0.4)
            if score >= judge.threshold:
                filtered.append(doc)

        return filtered

    async def async_filter_docs(query: str, documents: list[Document]) -> list[Document]:
        """Async version of filter_docs."""
        return filter_docs(query, documents)

    # Make forward return a list properly
    def mock_forward(query: str, documents: list[Document]) -> list[Document]:
        return filter_docs(query, documents)

    judge.forward = Mock(side_effect=mock_forward)
    judge.aforward = AsyncMock(side_effect=async_filter_docs)
    judge.threshold = threshold

    return judge


def mock_query_processor(
    processed_query: ProcessedQuery | None = None
) -> Mock:
    """Create a mock QueryProcessorProgram."""
    processor = Mock(spec=QueryProcessorProgram)

    if processed_query is None:
        processed_query = make_processed_query()

    processor.forward = Mock(return_value=processed_query)
    processor.aforward = AsyncMock(return_value=processed_query)

    return processor


def mock_document_retriever(
    documents: list[Document] | None = None
) -> Mock:
    """Create a mock DocumentRetrieverProgram."""
    retriever = Mock(spec=DocumentRetrieverProgram)

    if documents is None:
        documents = make_documents()

    retriever.forward = Mock(return_value=documents)
    retriever.aforward = AsyncMock(return_value=documents)

    return retriever


def mock_generation_program(
    answer: str = "Here's how to write Cairo contracts..."
) -> Mock:
    """Create a mock GenerationProgram."""
    program = Mock(spec=GenerationProgram)

    program.forward = Mock(return_value=dspy.Prediction(answer=answer))
    program.aforward = AsyncMock(return_value=dspy.Prediction(answer=answer))

    async def mock_streaming(*args, **kwargs):
        yield "Here's how to write "
        yield "Cairo contracts..."

    program.forward_streaming = Mock(return_value=mock_streaming())

    return program


def mock_mcp_program() -> Mock:
    """Create a mock McpGenerationProgram."""
    program = Mock(spec=McpGenerationProgram)
    program.forward = Mock(return_value=dspy.Prediction(answer="MCP formatted docs"))
    return program


def pipeline_config_factory(
    enable_llm_judge: bool = True,
    llm_judge_threshold: float = 0.4,
    retrieval_judge: RetrievalJudge | None = None,
    query_processor: QueryProcessorProgram | None = None,
    document_retriever: DocumentRetrieverProgram | None = None,
    generation_program: GenerationProgram | None = None,
    mcp_generation_program: McpGenerationProgram | None = None,
    **overrides: Any
) -> RagPipelineConfig:
    """
    Factory to create RagPipelineConfig with sensible defaults.

    Args:
        enable_llm_judge: Whether to enable the retrieval judge
        llm_judge_threshold: Minimum score threshold for documents
        retrieval_judge: Optional pre-configured judge instance
        query_processor: Optional query processor instance
        document_retriever: Optional document retriever instance
        generation_program: Optional generation program instance
        mcp_generation_program: Optional MCP generation program instance
        **overrides: Additional config overrides

    Returns:
        Configured RagPipelineConfig instance
    """
    # Create default mocks if not provided
    if query_processor is None:
        query_processor = mock_query_processor()
    if document_retriever is None:
        document_retriever = mock_document_retriever()
    if generation_program is None:
        generation_program = mock_generation_program()
    if mcp_generation_program is None:
        mcp_generation_program = mock_mcp_program()

    # Create vector store config
    vector_store_config = VectorStoreConfig(
        host="localhost",
        port=5432,
        database="test_db",
        user="test_user",
        password="test_pass",
        table_name="test_table",
    )

    config_args = {
        "name": "test-pipeline",
        "vector_store_config": vector_store_config,
        "query_processor": query_processor,
        "document_retriever": document_retriever,
        "generation_program": generation_program,
        "mcp_generation_program": mcp_generation_program,
        "enable_llm_judge": enable_llm_judge,
        "llm_judge_threshold": llm_judge_threshold,
        "retrieval_judge": retrieval_judge,
        "max_source_count": 10,
        "similarity_threshold": 0.4,
    }

    # Apply overrides
    config_args.update(overrides)

    return RagPipelineConfig(**config_args)


def pipeline_factory(
    config: RagPipelineConfig | None = None,
) -> RagPipeline:
    """
    Factory to create RagPipeline instances for testing.

    Args:
        config: Pipeline configuration. If None, uses default config.

    Returns:
        RagPipeline instance
    """
    if config is None:
        config = pipeline_config_factory()

    # Always patch optimizer loading for tests
    with patch.object(RagPipeline, 'load'):
        return RagPipeline(config)
