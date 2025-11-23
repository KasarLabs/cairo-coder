"""
Grok Web/X Search module for Cairo Coder.

Uses the xAI SDK (agentic server‑side tools: web_search, x_search) to fetch
fresh context and a synthesized answer. The output is provided as a single
virtual Document for the generator and a list of citation URLs that the
pipeline emits via SOURCES.

Behavior:
- Activated upstream when DocumentSource.STARKNET_BLOG is in the requested sources.
- Returns one primary virtual Document containing the Grok-composed answer
  plus an inline source list inside the content.
- Does not create per-citation documents; citations are emitted via SOURCES.

Environment:
- Set XAI_API_KEY with a valid xAI API key.
"""

from __future__ import annotations

import hashlib
import os
import re
from urllib.parse import urlparse

import dspy
import structlog
from langsmith import traceable
from xai_sdk import AsyncClient as XaiClient
from xai_sdk.chat import Response, user
from xai_sdk.tools import web_search, x_search

from cairo_coder.core.types import Document, DocumentSource, ProcessedQuery

logger = structlog.get_logger(__name__)


DEFAULT_GROK_MODEL = "grok-4-fast"


def _sha1(text: str) -> str:
    return hashlib.sha1(text.encode("utf-8")).hexdigest()


def _mk_unique_id(prefix: str, content: str, idx: int = 0) -> str:
    return f"{prefix}-{_sha1(content)[:10]}-{idx}"



class GrokSearchProgram(dspy.Module):
    """
    DSPy module that queries xAI's Grok Responses API with web and X search tools.

    aforward returns a list[Document] suitable for inclusion in the RAG pipeline.
    """

    def __init__(
        self,
    ) -> None:
        super().__init__()
        api_key = os.getenv("XAI_API_KEY")
        if not api_key:
            raise RuntimeError("XAI_API_KEY must be set for GrokSearchProgram")
        self.client = XaiClient(api_key=api_key)
        self.last_citations: list[str] = []

    @staticmethod
    def _extract_urls_from_text(text: str) -> list[str]:
        """Extract HTTP/HTTPS URLs from markdown text.

        Supports both markdown links `[text](url)` and bare URLs. Deduplicates while
        preserving order and strips common trailing punctuation.
        """
        urls: list[str] = []
        # Markdown links
        for m in re.findall(r"\[[^\]]*\]\((https?://[^)\s]+)\)", text):
            urls.append(m.strip())
        # Bare URLs
        for m in re.findall(r"(?<!\()\bhttps?://[^\s)\]]+", text):
            urls.append(m.strip())

        seen: set[str] = set()
        result: list[str] = []
        for u in urls:
            u = u.rstrip(".,;:)")
            if u not in seen:
                seen.add(u)
                result.append(u)
        return result

    @staticmethod
    def _domain_from_url(url: str) -> str:
        try:
            return urlparse(url).netloc or url
        except Exception:
            return url

    @traceable(name="GrokSearchProgram", run_type="llm")
    async def aforward(self, processed_query: ProcessedQuery, chat_history: str) -> dspy.Prediction:
        formatted_query = f"""Answer the following query: {processed_query.original}. \
            Here is the chat history: {chat_history}, that might be relevant to the question. \
            For more context, here are some semantic terms associated with the question: \
            {', '.join(processed_query.search_queries)}. \
            Make sure that your final answer will contain links to the relevant sources used to construct your answer.
        """
        # TODO: track LM usage
        chat = self.client.chat.create(
            model=DEFAULT_GROK_MODEL,
            tools=[web_search(), x_search()],
        )
        logger.info(f"Formatted query: {formatted_query}")
        chat.append(user(formatted_query))
        response: Response = await chat.sample()
        answer: str = response.content
        # Extract citations from Grok's answer content (regex), not from response.citations
        citations_urls: list[str] = self._extract_urls_from_text(answer)
        self.last_citations = list(citations_urls or [])
        logger.info(f"Answer: {answer}")
        logger.info(f"Citations URLs: {citations_urls}")

        # Preserve Grok's inline links; optionally add a markdown list of sources
        answer_with_sources = answer
        cite_lines = []
        for url in citations_urls:
            domain = self._domain_from_url(url)
            cite_lines.append(f"- [{domain}]({url})")
        if cite_lines:
            answer_with_sources = f"{answer}\n\n**Sources used by Grok:**\n" + "\n".join(cite_lines)

        documents: list[Document] = []
        unique_id = _mk_unique_id("grok-answer", answer)
        documents.append(
            Document(
                page_content=answer_with_sources,
                metadata={
                    "name": "grok-answer",
                    "title": "Grok Web/X Summary",
                    "uniqueId": unique_id,
                    "contentHash": _sha1(answer_with_sources),
                    "chunkNumber": 0,
                    # Treat as Starknet blog related to gate activation
                    "source": DocumentSource.STARKNET_BLOG,
                    "source_display": "Grok Web/X",
                    "sourceLink": "",
                    "url": "",
                    "is_virtual": True,
                },
            )
        )

        prediction = dspy.Prediction(documents=documents)
        prediction.set_lm_usage({})
        return prediction
