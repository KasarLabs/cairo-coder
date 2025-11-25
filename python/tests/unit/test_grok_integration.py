"""
Unit tests for Grok (Web/X) augmentation in the RAG pipeline.

These tests verify that:
- Grok is invoked when `starknet_blog` is among sources
- The Grok summary is injected as a virtual first document for generation
- SOURCES events include Grok citation URLs and exclude the Grok summary doc
- Grok does not run when not requested; failures do not pollute SOURCES
"""

from unittest.mock import AsyncMock

import dspy
import pytest

from cairo_coder.core.types import Document, DocumentSource
from cairo_coder.dspy.grok_search import GrokSearchProgram

# A small subset of the real Grok response shared for mocks
GROK_ANSWER = (
    "### What is Vesu?\n\nVesu is a fully open, permissionless, and non-custodial crypto lending protocol"
)
GROK_CITATIONS = [
    "https://vesu.xyz/vaults",
    "https://vesu.xyz/",
    "https://x.com/vesuxyz?lang=en",
]


def _make_grok_summary_doc(answer: str) -> Document:
    return Document(
        page_content=answer,
        metadata={
            "name": "grok-answer",
            "title": "Grok Web/X Summary",
            "source": DocumentSource.STARKNET_BLOG,
            "source_display": "Grok Web/X",
            "url": "",
            "sourceLink": "",
            "is_virtual": True,
        },
    )

@pytest.mark.asyncio
async def test_grok_citations_emitted_in_sources_and_summary_excluded(
    pipeline
):
    # Mock Grok module on the pipeline instance
    grok_doc = _make_grok_summary_doc(GROK_ANSWER)
    grok_prediction = dspy.Prediction(documents=[grok_doc])
    grok_prediction.set_lm_usage({})
    pipeline.grok_search.aforward = AsyncMock(return_value=grok_prediction)
    pipeline.grok_search.last_citations = list(GROK_CITATIONS)

    # Stream to get SOURCES event
    events = []
    async for ev in pipeline.aforward_streaming(
        "What's vesu and how can I get yield on it?",
        sources=[DocumentSource.STARKNET_BLOG],
    ):
        events.append(ev)

    sources_event = next(e for e in events if e.type.value == "sources")
    items = sources_event.data

    # The Grok virtual doc should not be listed as a source
    assert all(i["metadata"]["title"] != "Grok Web/X Summary" for i in items)

    # Vector sources should be present
    vector_urls = [i["metadata"]["url"] for i in items if i["metadata"].get("url")]
    assert any("book.cairo-lang.org" in url for url in vector_urls)

    # Grok citations should be appended as URLs
    for url in GROK_CITATIONS:
        assert url in vector_urls


@pytest.mark.asyncio
async def test_grok_summary_is_first_in_generation_context(
    pipeline
):
    # Mock Grok module on the pipeline instance
    grok_doc = _make_grok_summary_doc(GROK_ANSWER)
    grok_prediction = dspy.Prediction(documents=[grok_doc])
    grok_prediction.set_lm_usage({})
    pipeline.grok_search.aforward = AsyncMock(return_value=grok_prediction)
    pipeline.grok_search.last_citations = list(GROK_CITATIONS)

    await pipeline.aforward(
        "What's vesu and how can I get yield on it?",
        sources=[DocumentSource.STARKNET_BLOG],
    )

    # Inspect the generation context to confirm virtual doc has no header
    _, kwargs = pipeline.generation_program.aforward.call_args
    context = kwargs["context"]
    # Virtual documents should NOT have headers to prevent citation
    assert "## Grok Web/X Summary" not in context
    assert "*Source: Grok Web/X*" not in context
    # But the content should still be present
    assert GROK_ANSWER in context


@pytest.mark.asyncio
async def test_grok_not_triggered_without_starknet_blog(
    pipeline
):
    pipeline.grok_search.aforward = AsyncMock()

    await pipeline.aforward("test query", sources=[DocumentSource.CAIRO_BOOK])
    pipeline.grok_search.aforward.assert_not_called()


@pytest.mark.asyncio
async def test_grok_failure_does_not_pollute_sources(
    pipeline
):
    # Force Grok to fail
    pipeline.grok_search.aforward = AsyncMock(side_effect=Exception("Grok failed"))

    events = []
    async for ev in pipeline.aforward_streaming(
        "What's vesu and how can I get yield on it?",
        sources=[DocumentSource.STARKNET_BLOG],
    ):
        events.append(ev)

    sources_event = next(e for e in events if e.type.value == "sources")
    items = sources_event.data
    urls = [i["metadata"].get("url", "") for i in items]

    # None of the Grok citations should be present on failure
    assert all(url not in urls for url in GROK_CITATIONS)

def test_extract_urls_from_text_markdown_and_bare():
    text = (
        "Ekubo offers up to [35% APY](https://app.ekubo.org/) on BTC pairs.\n"
        "See community thread: https://x.com/user/status/12345 and details at "
        "[Troves](https://app.troves.fi/). Duplicate: https://app.ekubo.org/"
    )

    urls = GrokSearchProgram._extract_urls_from_text(text)

    assert urls[0] == "https://app.ekubo.org/"
    assert "https://x.com/user/status/12345" in urls
    assert "https://app.troves.fi/" in urls
    # Deduplication preserves first occurrence
    assert urls.count("https://app.ekubo.org/") == 1


def test_extract_urls_strips_trailing_punctuations():
    text = "Check https://example.com/path). And [ref](https://site.org/page)."
    urls = GrokSearchProgram._extract_urls_from_text(text)
    assert "https://example.com/path" in urls
    assert "https://site.org/page" in urls
