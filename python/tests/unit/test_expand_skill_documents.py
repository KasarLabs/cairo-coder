"""Unit tests for RagPipeline skill document expansion."""

import json
from unittest.mock import AsyncMock, Mock

import pytest

from cairo_coder.core.types import Document, DocumentSource


def make_skill_chunk(skill_id: str, chunk_number: int = 0) -> Document:
    """Create a cairo_skills chunk document."""
    return Document(
        page_content=f"Chunk {chunk_number} for skill {skill_id}",
        metadata={
            "source": DocumentSource.CAIRO_SKILLS,
            "skillId": skill_id,
            "title": f"Skill {skill_id} chunk {chunk_number}",
            "uniqueId": f"skill-{skill_id}-{chunk_number}",
        },
    )


def make_non_skill_document(title: str) -> Document:
    """Create a non-skill document."""
    return Document(
        page_content=f"Non-skill content: {title}",
        metadata={
            "source": DocumentSource.CAIRO_BOOK,
            "title": title,
            "sourceLink": "https://book.cairo-lang.org/",
        },
    )


def make_full_document_row(skill_id: str, full_content: str) -> dict:
    """Create a DB row for a full skill document."""
    return {
        "content": f"Summary for {skill_id}",
        "metadata": {
            "source": DocumentSource.CAIRO_SKILLS,
            "skillId": skill_id,
            "title": f"Skill {skill_id}",
            "uniqueId": f"skill-{skill_id}-full",
            "fullContent": full_content,
        },
    }


@pytest.mark.asyncio
async def test_no_skill_chunks_passthrough(pipeline):
    """Documents without cairo_skills source are returned unchanged."""
    vector_db = Mock()
    vector_db.afetch_by_unique_ids = AsyncMock(return_value=[])
    pipeline.document_retriever.vector_db = vector_db

    original_docs = [
        make_non_skill_document("Doc A"),
        make_non_skill_document("Doc B"),
    ]
    expanded_docs = await pipeline._expand_skill_documents(original_docs)

    assert expanded_docs is original_docs
    vector_db.afetch_by_unique_ids.assert_not_called()


@pytest.mark.asyncio
async def test_single_skill_chunk_expanded(pipeline):
    """A single skill chunk is replaced by a full skill document."""
    vector_db = Mock()
    vector_db.afetch_by_unique_ids = AsyncMock(
        return_value=[make_full_document_row("loops", "FULL skill loops content")]
    )
    pipeline.document_retriever.vector_db = vector_db

    skill_chunk = make_skill_chunk("loops", 1)
    expanded_docs = await pipeline._expand_skill_documents([skill_chunk])

    vector_db.afetch_by_unique_ids.assert_awaited_once_with(["skill-loops-full"])
    assert len(expanded_docs) == 1
    assert expanded_docs[0].page_content == "FULL skill loops content"
    assert expanded_docs[0].metadata["skillId"] == "loops"
    assert expanded_docs[0].metadata["uniqueId"] == "skill-loops-full"


@pytest.mark.asyncio
async def test_multiple_chunks_same_skill_dedup(pipeline):
    """Multiple chunks for one skill become one full document."""
    vector_db = Mock()
    vector_db.afetch_by_unique_ids = AsyncMock(
        return_value=[make_full_document_row("arrays", "FULL arrays content")]
    )
    pipeline.document_retriever.vector_db = vector_db

    docs = [
        make_skill_chunk("arrays", 0),
        make_skill_chunk("arrays", 1),
        make_skill_chunk("arrays", 2),
    ]
    expanded_docs = await pipeline._expand_skill_documents(docs)

    assert len(expanded_docs) == 1
    assert expanded_docs[0].page_content == "FULL arrays content"
    assert expanded_docs[0].metadata["skillId"] == "arrays"


@pytest.mark.asyncio
async def test_non_skill_docs_preserved(pipeline):
    """Non-skill documents are preserved in count and order."""
    vector_db = Mock()
    vector_db.afetch_by_unique_ids = AsyncMock(
        return_value=[make_full_document_row("traits", "FULL traits content")]
    )
    pipeline.document_retriever.vector_db = vector_db

    non_skill_1 = make_non_skill_document("First non-skill")
    non_skill_2 = make_non_skill_document("Second non-skill")
    docs = [non_skill_1, make_skill_chunk("traits", 0), non_skill_2]

    expanded_docs = await pipeline._expand_skill_documents(docs)

    non_skill_docs = [
        document
        for document in expanded_docs
        if document.metadata.get("source") != DocumentSource.CAIRO_SKILLS
    ]
    assert non_skill_docs == [non_skill_1, non_skill_2]
    assert len(non_skill_docs) == 2


@pytest.mark.asyncio
async def test_graceful_degradation_no_full_doc(pipeline):
    """If no full row is found, original skill chunks are kept."""
    vector_db = Mock()
    vector_db.afetch_by_unique_ids = AsyncMock(return_value=[])
    pipeline.document_retriever.vector_db = vector_db

    docs = [make_skill_chunk("storage", 0), make_skill_chunk("storage", 1)]
    expanded_docs = await pipeline._expand_skill_documents(docs)

    assert expanded_docs == docs


@pytest.mark.asyncio
async def test_mixed_found_and_not_found(pipeline):
    """Found skills are expanded; missing skills keep original chunks."""
    vector_db = Mock()
    vector_db.afetch_by_unique_ids = AsyncMock(
        return_value=[make_full_document_row("macros", "FULL macros content")]
    )
    pipeline.document_retriever.vector_db = vector_db

    macros_chunk = make_skill_chunk("macros", 0)
    memory_chunk_1 = make_skill_chunk("memory", 0)
    memory_chunk_2 = make_skill_chunk("memory", 1)
    docs = [macros_chunk, memory_chunk_1, memory_chunk_2]

    expanded_docs = await pipeline._expand_skill_documents(docs)

    assert any(
        document.metadata.get("uniqueId") == "skill-macros-full"
        and document.page_content == "FULL macros content"
        for document in expanded_docs
    )
    assert memory_chunk_1 in expanded_docs
    assert memory_chunk_2 in expanded_docs
    assert macros_chunk not in expanded_docs


@pytest.mark.asyncio
async def test_fetch_exception_returns_original_documents(pipeline):
    """If fetching full docs fails, the original list is returned unchanged."""
    vector_db = Mock()
    vector_db.afetch_by_unique_ids = AsyncMock(side_effect=RuntimeError("db unavailable"))
    pipeline.document_retriever.vector_db = vector_db

    original_docs = [make_skill_chunk("iterators", 0), make_non_skill_document("Reference")]
    expanded_docs = await pipeline._expand_skill_documents(original_docs)

    assert expanded_docs is original_docs


@pytest.mark.asyncio
async def test_metadata_string_deserialization(pipeline):
    """String metadata rows are deserialized before creating full docs."""
    metadata = {
        "source": DocumentSource.CAIRO_SKILLS,
        "skillId": "enums",
        "title": "Enums",
        "uniqueId": "skill-enums-full",
        "fullContent": "FULL enums content",
    }
    vector_db = Mock()
    vector_db.afetch_by_unique_ids = AsyncMock(
        return_value=[{"content": "summary", "metadata": json.dumps(metadata)}]
    )
    pipeline.document_retriever.vector_db = vector_db

    expanded_docs = await pipeline._expand_skill_documents([make_skill_chunk("enums", 0)])

    assert len(expanded_docs) == 1
    assert expanded_docs[0].page_content == "FULL enums content"
    assert expanded_docs[0].metadata["skillId"] == "enums"
