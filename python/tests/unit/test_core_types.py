"""Unit tests for core type contracts."""

from cairo_coder.core.types import DocumentMetadata, DocumentSource


def test_document_source_includes_cairo_skills() -> None:
    """DocumentSource should expose the cairo_skills source."""
    assert DocumentSource.CAIRO_SKILLS.value == "cairo_skills"


def test_document_metadata_includes_skill_fields() -> None:
    """DocumentMetadata should include skill metadata annotations."""
    annotations = DocumentMetadata.__annotations__

    assert annotations["skillId"] is str
    assert annotations["fullContent"] is str
