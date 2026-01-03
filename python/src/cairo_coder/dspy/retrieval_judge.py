"""
DSPy Retrieval Judge for Cairo Coder.

This module implements a retrieval judge that scores retrieved documents
for usefulness with respect to the user query, filtering out low-scoring documents.
"""

from __future__ import annotations

import asyncio
from collections.abc import Sequence
import os
from typing import Any

import structlog
from langsmith import traceable

import dspy
from cairo_coder.core.constants import SIMILARITY_THRESHOLD
from cairo_coder.core.types import Document, combine_usage
from cairo_coder.dspy.document_retriever import CONTRACT_TEMPLATE_TITLE, TEST_TEMPLATE_TITLE

logger = structlog.get_logger(__name__)

TEMPLATE_TITLES = {CONTRACT_TEMPLATE_TITLE, TEST_TEMPLATE_TITLE}
JUDGE_DOCUMENT_PREVIEW_MAX_LEN = 1000
LLM_JUDGE_SCORE_KEY = "llm_judge_score"
LLM_JUDGE_REASON_KEY = "llm_judge_reason"


# Note: examples here should be auto-generated from using an optimizer.
class RetrievalRecallPrecision(dspy.Signature):
    """
    Goal
    ----
    Given a user query and a single technical resource (content + minimal metadata),
    judge how useful the resource is for answering the query.

    How to read inputs
    ------------------
    - query: what the user needs. Extract the main intent (task / concept / error) and key entities
      (e.g., Cairo, Starknet, snforge/sncast/scarb tools, contracts, paymaster, fees, S-Two, STARK Proofs, etc.).
    - system_resource: the resource text.

    Definitions
    -----------
    DIRECTLY RELEVANT: Explains or solves the exact thing asked (same feature/API/version/tool/error/code/concept),
    or provides working code/templates/tests that can be applied immediately.
    CONTEXTUALLY USEFUL: Not a direct answer but gives correct background, patterns, or adjacent
    details that help (e.g., components used by ERC-20/721, Cairo syntax needed for the task,
    Starknet lifecycle when the query is about confirmations, etc.).
    NOT USEFUL:stale/obsolete, unrelated topic, not related to the query.

    Decision rubric (apply in order)
    --------------------------------
    1) Match: Does the resource target the same task/concept/error/tool? (yes/no/partial)
    2) Specificity: Does it include concrete API names, code, commands, flags, fields, or examples that can be used?
    3) Coverage: Does it cover key sub-questions implied by the query (e.g., security, fees, lifecycle, types)?

    Scoring anchors (pick the closest; interpolate if needed)
    ---------------------------------------------------------
    1.00  Exact how-to / spec / error-fix / code sample for this query & correct version Can be directly leveraged to answer the query.
    0.75  Mostly on-point with usable details; may miss a minor part or be slightly tangent but still useful.
    0.50  Indirect context that helps learning or setup, not a direct answer.
    0.25  Weakly related mention(s); very little actionable value.
    0.00  Unrelated or misleading.

    Cairo/Starknet notes (apply silently)
    -------------------------------------
    - Code/templates/tests are always useful if they can be adapted (even if not the exact contract).
    - Prefer resources mentioning: snforge, sncast, scarb, Starknet tx structure/lifecycle, paymaster,
      account abstraction, fees, ABI/Sierra/Casm, common components (ERC20/721), and Cairo core libs.

    Examples (style only; do not copy text)
    ---------------------------------------
    - Query: “explain paymaster on Starknet tx”
      Good reasoning: “Resource <Paymaster spec 0.14>: details the paymaster flow and required fields in the
      tx payload with examples, matching Starknet ≥0.14 — directly answers.” → 0.90–1.00
    - Query: “Explain saturating_sub”
      Good reasoning: “Resource <Cairo core arithmetic>: documents `saturating_sub` with examples; directly answers.” → 1.00
    - Query: “ERC721 policy token on Starknet”
      Context reasoning: “Resource <Components in Cairo>: explains components/modularity used when composing
      ERC721; helpful context but not full implementation.” → ~0.50
    - Query: “fees structure in Starknet”
      Not useful: “Resource <General L1 gas primer>: EVM-only overview; no Starknet specifics.” → 0.00–0.25
    - QUERY: "How to write a S-Two AIR"
      Context reasoning: "Resource <Mersenne Prime>: explains what the Mersenne Prime is and how it's used in S-Two” → ~0.50
    """

    query: str = dspy.InputField()
    system_resource: str = dspy.InputField(
        desc="Single resource text (content + minimal metadata/title)"
    )
    reasoning: str = dspy.OutputField(
        desc="A short sentence, on why a selected resource will be useful. If it's not selected, reason about why it's not going to be useful. Start by Resource <resource_title>..."
    )
    resource_note: float = dspy.OutputField(
        desc="Float in [0.0, 1.0] per the scoring anchors."
    )


DEFAULT_THRESHOLD = SIMILARITY_THRESHOLD
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

        if os.getenv("OPTIMIZER_RUN"):
            return
        # Load optimizer
        compiled_program_path = "optimizers/results/optimized_rater.json"
        if not os.path.exists(compiled_program_path):
            raise FileNotFoundError(f"{compiled_program_path} not found")
        self.rater.load(compiled_program_path)

    @traceable(
        name="RetrievalJudge", run_type="llm", metadata={"llm_provider": dspy.settings.lm}
    )
    async def aforward(self, query: str, documents: list[Document]) -> dspy.Prediction:
        """Async judge."""
        if not documents:
            return dspy.Prediction(documents=documents)

        keep_docs, judged_indices, judged_payloads = self._split_templates_and_prepare_docs(
            documents
        )

        aggregated_usage = {}

        # TODO: can we use dspy.Parallel here instead of asyncio gather?
        if judged_payloads:
            try:
                # Judge concurrently
                async def judge_one(doc_string: str):
                    return await self.rater.aforward(query=query, system_resource=doc_string)

                results = await asyncio.gather(
                    *[judge_one(ds) for ds in judged_payloads], return_exceptions=True
                )

                # Aggregate usage from results
                for res in results:
                    if isinstance(res, dspy.Prediction):
                        aggregated_usage = combine_usage(aggregated_usage, res.get_lm_usage() or {})

                self._attach_scores_and_filter_async(
                    query=query,
                    documents=documents,
                    judged_indices=judged_indices,
                    results=results,
                    keep_docs=keep_docs,
                )
            except Exception as e:
                logger.error(
                    "Retrieval judge failed (async), returning all docs",
                    error=str(e),
                    exc_info=True,
                )
                return dspy.Prediction(documents=documents)

        pred = dspy.Prediction(documents=keep_docs)
        pred.set_lm_usage(aggregated_usage)
        return pred

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
    def _document_to_string(
        title: str, content: str, max_len: int = JUDGE_DOCUMENT_PREVIEW_MAX_LEN
    ) -> str:
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
