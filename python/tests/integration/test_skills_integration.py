"""Integration tests for cairo_skills full-document expansion in the RAG pipeline."""

import json
from unittest.mock import AsyncMock

import dspy
import pytest

SKILL_ID = "benchmarking-cairo"
SKILL_FULL_CONTENT = (
    "---\nname: Cairo Benchmarking\n"
    "description: Profile and benchmark Cairo functions using cairo-profiler.\n"
    "---\n\n"
    "# Cairo Benchmarking\n\nUse cairo-profiler to profile your Cairo functions.\n"
)
SKILL_SOURCE_LINK = (
    "https://github.com/feltroidprime/cairo-skills/tree/main/skills/benchmarking-cairo"
)


def _docker_available() -> bool:
    """Return True when Docker daemon is reachable for TestClient fixture setup."""
    try:
        import docker

        docker.from_env().ping()
        return True
    except Exception:
        return False


HAS_DOCKER = _docker_available()


def _make_skill_example() -> dspy.Example:
    """Return a cairo_skills chunk as retrieved by vector DB search."""
    return dspy.Example(
        content="Benchmark Cairo with cairo-profiler",
        metadata={
            "source": "cairo_skills",
            "skillId": SKILL_ID,
            "title": "Cairo Benchmarking",
            "uniqueId": f"skill-{SKILL_ID}-0",
            "sourceLink": SKILL_SOURCE_LINK,
        },
    )


def _make_full_doc_row() -> dict:
    """Return a full skill row as fetched by unique id."""
    return {
        "content": "Cairo Benchmarking: Profile and benchmark Cairo functions.",
        "metadata": {
            "source": "cairo_skills",
            "skillId": SKILL_ID,
            "title": "Cairo Benchmarking",
            "uniqueId": f"skill-{SKILL_ID}-full",
            "fullContent": SKILL_FULL_CONTENT,
            "sourceLink": SKILL_SOURCE_LINK,
        },
    }


def _configure_mock_vector_db(mock_vector_db) -> None:
    """Configure vector DB mocks for skill chunk retrieval + full-doc expansion."""
    mock_vector_db.aforward = AsyncMock(return_value=[_make_skill_example()])
    mock_vector_db.afetch_by_unique_ids = AsyncMock(return_value=[_make_full_doc_row()])


def _extract_sources_event(stream_text: str) -> dict | None:
    """Extract the first SSE sources event payload from streamed response text."""
    for line in stream_text.split("\n"):
        if not line.startswith("data: "):
            continue
        payload = line[6:]
        if payload == "[DONE]":
            continue
        parsed = json.loads(payload)
        if parsed.get("type") == "sources":
            return parsed
    return None


@pytest.mark.asyncio
async def test_full_pipeline_skill_expansion(real_pipeline, mock_vector_db):
    """Full pipeline should replace skill chunks with the full skill markdown."""
    _configure_mock_vector_db(mock_vector_db)

    result = await real_pipeline.acall("How do I benchmark Cairo functions?")
    skill_documents = [
        doc for doc in result.documents if doc.metadata.get("source") == "cairo_skills"
    ]

    assert len(skill_documents) == 1
    assert skill_documents[0].page_content == SKILL_FULL_CONTENT
    assert skill_documents[0].metadata["skillId"] == SKILL_ID
    mock_vector_db.afetch_by_unique_ids.assert_awaited_once_with([f"skill-{SKILL_ID}-full"])


@pytest.mark.skipif(not HAS_DOCKER, reason="Docker daemon unavailable for client fixture")
def test_chat_completions_includes_cairo_skills_in_sources(client, mock_vector_db):
    """Streaming /chat/completions should emit skill source in formatted sources."""
    _configure_mock_vector_db(mock_vector_db)

    response = client.post(
        "/v1/chat/completions",
        json={
            "messages": [{"role": "user", "content": "How do I benchmark Cairo functions?"}],
            "stream": True,
        },
    )

    assert response.status_code == 200
    sources_event = _extract_sources_event(response.text)
    assert sources_event is not None
    assert isinstance(sources_event.get("data"), list)

    sources = sources_event["data"]
    assert any(
        source.get("metadata", {}).get("title") == "Cairo Benchmarking" for source in sources
    )
    assert any(
        source.get("metadata", {}).get("url") == SKILL_SOURCE_LINK for source in sources
    )
    assert any(
        "cairo-skills" in source.get("metadata", {}).get("url", "") for source in sources
    )


@pytest.mark.asyncio
async def test_mcp_mode_includes_full_skill_content_in_context(real_pipeline, mock_vector_db):
    """MCP mode should include expanded full skill markdown in generation context."""
    _configure_mock_vector_db(mock_vector_db)
    captured_context: list[str] = []

    async def _capture_context(query: str, context: str):
        captured_context.append(context)
        prediction = dspy.Prediction(skill="# Cairo Benchmarking Skill\nContent")
        prediction.set_lm_usage({})
        return prediction

    real_pipeline.mcp_generation_program.acall = AsyncMock(side_effect=_capture_context)

    result = await real_pipeline.acall(
        "How do I benchmark Cairo functions?", mcp_mode=True
    )

    assert captured_context
    assert SKILL_FULL_CONTENT in captured_context[0]
    assert "Cairo Benchmarking Skill" in result.answer
