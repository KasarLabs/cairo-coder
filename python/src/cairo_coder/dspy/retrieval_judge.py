"""
DSPy Retrieval Judge for Cairo Coder.

This module implements a retrieval judge that scores retrieved documents
for usefulness with respect to the user query, filtering out low-scoring documents.
"""

from __future__ import annotations

import asyncio
from collections.abc import Sequence
from typing import Any

import structlog
from langsmith import traceable

import dspy
from cairo_coder.core.types import Document
from cairo_coder.dspy.document_retriever import CONTRACT_TEMPLATE_TITLE, TEST_TEMPLATE_TITLE

logger = structlog.get_logger()

TEMPLATE_TITLES = {CONTRACT_TEMPLATE_TITLE, TEST_TEMPLATE_TITLE}
JUDGE_DOCUMENT_PREVIEW_MAX_LEN = 1000
LLM_JUDGE_SCORE_KEY = "llm_judge_score"
LLM_JUDGE_REASON_KEY = "llm_judge_reason"


class RetrievalRecallPrecision(dspy.Signature):
    """Compare a system's retrieval response to the query and rate how much it can be leveraged to answer the query.

    When asked to reason, enumerate key ideas in each response, and whether they are present in the expected output.

    A document is considered useful if it is directly relevant to the query, or if it is informative and can be useful for context. For example, if the query is about creating or fixing a smart contract, then, an example of a smart contract, even if not _directly_ related, is considered useful. If the query is about a specific Cairo language feature, then a document about that feature is considered useful.

    Contract and test templates are always considered useful.
    """

    query: str = dspy.InputField()
    system_resource: str = dspy.InputField(desc="Single resource text (content + minimal metadata/title)")
    reasoning: str = dspy.OutputField(
        desc="A short sentence, on why a selected resource will be useful. If it's not selected, reason about why it's not going to be useful. Start by Resource <resource_title>..."
    )
    resource_note: float = dspy.OutputField(
        desc="A note between 0 and 1.0 on how useful the resource is to directly answer the query. 0 being completely unrelated, 1.0 being very relevant, 0.5 being 'not directly related but still informative and can be useful for context'."
    )

DEFAULT_THRESHOLD = 0.4
DEFAULT_PARALLEL_THREADS = 5

class RetrievalJudge(dspy.Module):
    """
    LLM-based judge that scores retrieved documents for relevance to a query.

    This module evaluates each retrieved document using an LLM to determine
    if it's useful for answering the user's query. Documents scoring below
    the threshold are filtered out.
    """

    def __init__(self):
        """
        Initialize the RetrievalJudge.

        Args:
            threshold: Minimum score (0-1) for a document to be kept
            parallel_threads: Number of threads for parallel document processing
        """
        super().__init__()
        self.rater = dspy.Predict(RetrievalRecallPrecision)
        self.parallel_threads = DEFAULT_PARALLEL_THREADS
        self.threshold = DEFAULT_THRESHOLD

    @traceable(name="RetrievalJudge", run_type="llm")
    async def aforward(self, query: str, documents: list[Document]) -> list[Document]:
        """Async judge."""
        if not documents:
            return documents

        keep_docs, judged_indices, judged_payloads = self._split_templates_and_prepare_docs(documents)

        # TODO: can we use dspy.Parallel here instead of asyncio gather?
        if judged_payloads:
            try:
                # Judge concurrently
                async def judge_one(doc_string: str):
                    return await self.rater.acall(query=query, system_resource=doc_string)

                results = await asyncio.gather(
                    *[judge_one(ds) for ds in judged_payloads], return_exceptions=True
                )
                self._attach_scores_and_filter_async(
                    query=query,
                    documents=documents,
                    judged_indices=judged_indices,
                    results=results,
                    keep_docs=keep_docs,
                )
            except Exception as e:
                logger.error("Retrieval judge failed (async), returning all docs", error=str(e), exc_info=True)
                return documents

        return keep_docs

    def get_lm_usage(self) -> dict[str, int]:
        """
        Get the total number of tokens used by the LLM.
        """
        return self.rater.get_lm_usage()

    # =========================
    # Internal Helpers
    # =========================
    def _split_templates_and_prepare_docs(
        self, documents: Sequence[Document]
    ) -> tuple[list[Document], list[int], list[str]]:
        """
        Separate always-keep template docs and build judged payloads for others.

        Returns:
            keep_docs: list of documents already decided to keep
            judged_indices: indices of docs that will be judged
            judged_payloads: strings to send to the LLM for each judged doc
        """
        keep_docs: list[Document] = []
        judged_indices: list[int] = []
        judged_payloads: list[str] = []

        for idx, doc in enumerate(documents):
            title = doc.metadata.get("title", "Untitled")
            if title in TEMPLATE_TITLES:
                keep_docs.append(doc)
                continue

            judged_indices.append(idx)
            judged_payloads.append(self._document_to_string(title, doc.page_content))

        return keep_docs, judged_indices, judged_payloads

    @staticmethod
    def _document_to_string(title: str, content: str, max_len: int = JUDGE_DOCUMENT_PREVIEW_MAX_LEN) -> str:
        """Build the string seen by the judge for one doc."""
        preview = content[:max_len]
        if len(content) > max_len:
            preview += "[REST OF CONTENT TRUNCATED]..."
        return f"Title: {title}\n\n{preview}"

    def _attach_scores_and_filter(
        self,
        query: str,
        documents: Sequence[Document],
        judged_indices: Sequence[int],
        results: Sequence[Any],
        keep_docs: list[Document],
    ) -> None:
        """Attach scores from sync results and filter by threshold."""
        for idx, result in zip(judged_indices, results, strict=False):
            doc = documents[idx]
            self._process_single_result(doc, result, keep_docs)

        dropped = [d.metadata.get("title") for d in documents if d not in keep_docs]
        logger.info(
            "Retrieval judge completed (sync)",
            total_docs=len(documents),
            kept_docs=len(keep_docs),
            dropped_docs=dropped,
            kept_docs_titles=[d.metadata.get("title") for d in keep_docs],
            query=query[:120],
        )

    def _attach_scores_and_filter_async(
        self,
        query: str,
        documents: Sequence[Document],
        judged_indices: Sequence[int],
        results: Sequence[Any],
        keep_docs: list[Document],
    ) -> None:
        """Attach scores from async results and filter by threshold."""
        for idx, result in zip(judged_indices, results, strict=False):
            doc = documents[idx]
            # Handle exceptions propagated by gather
            if isinstance(result, Exception):
                logger.warning(
                    "Error judging document (async), keeping it", error=str(result), exc_info=True
                )
                doc.metadata[LLM_JUDGE_SCORE_KEY] = 1.0
                doc.metadata[LLM_JUDGE_REASON_KEY] = "Could not judge document. Keeping it."
                # Actually keep it, as the log claims.
                keep_docs.append(doc)
                continue

            self._process_single_result(doc, result, keep_docs)

        dropped = [d.metadata.get("title") for d in documents if d not in keep_docs]
        logger.info(
            "Retrieval judge completed (async)",
            total_docs=len(documents),
            kept_docs=len(keep_docs),
            dropped_docs=dropped,
            kept_docs_titles=[d.metadata.get("title") for d in keep_docs],
            query=query[:120],
        )

    def _process_single_result(self, doc: Document, result: Any, keep_docs: list[Document]) -> None:
        """Parse result, attach metadata, and decide to keep/drop."""
        try:
            score = float(result.resource_note)
            # clamp
            score = max(0.0, min(1.0, score))
            reason = getattr(result, "reasoning", "")
            doc.metadata[LLM_JUDGE_SCORE_KEY] = score
            doc.metadata[LLM_JUDGE_REASON_KEY] = reason

            if score >= self.threshold:
                keep_docs.append(doc)
                logger.debug(
                    "Document kept by judge",
                    title=doc.metadata.get("title"),
                    score=score,
                    reason=reason[:120],
                )
            else:
                logger.debug(
                    "Document dropped by judge",
                    title=doc.metadata.get("title"),
                    score=score,
                    reason=reason[:120],
                )

        except (ValueError, TypeError, AttributeError) as e:
            # Parsing failed; drop the document to be safe
            logger.warning(
                "Failed to parse judge score, dropping document",
                error=str(e),
                title=doc.metadata.get("title"),
                exc_info=True,
            )
            doc.metadata[LLM_JUDGE_SCORE_KEY] = 0.0
            doc.metadata[LLM_JUDGE_REASON_KEY] = "Parse error"
            # Do not append to keep_docs
