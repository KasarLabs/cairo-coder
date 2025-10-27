"""
Unit tests for cairo_coder.db.repository using an ephemeral Postgres DB.

These tests use the shared DB fixtures from tests/integration/conftest.py and run
by default. They are automatically skipped if Docker is unavailable.

To skip these tests explicitly, use: pytest -m "not db"
"""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse

import pytest

# Import shared fixtures from integration conftest
pytest_plugins = ["tests.integration.conftest"]

pytestmark = pytest.mark.db


@pytest.fixture(autouse=True)
def configure_test_db_env(postgres_container, monkeypatch):
    """Auto-configure environment variables for DB tests."""
    raw_dsn = postgres_container.get_connection_url()
    dsn = raw_dsn.replace("postgresql+psycopg2", "postgresql")
    parsed = urlparse(dsn)

    monkeypatch.setenv("POSTGRES_HOST", parsed.hostname or "127.0.0.1")
    monkeypatch.setenv("POSTGRES_PORT", str(parsed.port or 5432))
    monkeypatch.setenv("POSTGRES_DB", (parsed.path or "/postgres").lstrip("/"))
    monkeypatch.setenv("POSTGRES_USER", parsed.username or "postgres")
    monkeypatch.setenv("POSTGRES_PASSWORD", parsed.password or "postgres")
    monkeypatch.setenv("POSTGRES_TABLE_NAME", "documents")


@pytest.mark.asyncio
async def test_create_user_interaction(test_db_pool, db_connection):
    from cairo_coder.db.models import UserInteraction
    from cairo_coder.db.repository import create_user_interaction

    interaction = UserInteraction(
        agent_id="cairo-coder",
        mcp_mode=False,
        chat_history=[{"role": "user", "content": "Hello"}],
        query="Hello",
        generated_answer="Hi",
        retrieved_sources=[{"pageContent": "Cairo", "metadata": {"source": "cairo_book"}}],
        llm_usage={"model": {"prompt_tokens": 1, "completion_tokens": 1, "total_tokens": 2}},
    )

    await create_user_interaction(interaction)

    row = await db_connection.fetchrow("SELECT * FROM user_interactions WHERE id = $1", interaction.id)
    assert row is not None
    assert row["agent_id"] == "cairo-coder"
    assert row["query"] == "Hello"


@pytest.mark.asyncio
async def test_get_interactions(test_db_pool, db_connection):
    from cairo_coder.db.repository import get_interactions

    now = datetime.now(timezone.utc)
    # Seed 3 records
    await db_connection.execute(
        """
        INSERT INTO user_interactions (id, created_at, agent_id, mcp_mode, query)
        VALUES ($1, $2, $3, $4, $5),
               ($6, $7, $8, $9, $10),
               ($11, $12, $13, $14, $15)
        """,
        uuid.uuid4(), now - timedelta(hours=4), "cairo-coder", False, "Q1",
        uuid.uuid4(), now - timedelta(hours=2), "starknet-agent", True, "Q2",
        uuid.uuid4(), now - timedelta(minutes=30), "cairo-coder", False, "Q3",
    )

    # Fetch all
    items, total = await get_interactions(now - timedelta(days=1), now + timedelta(minutes=1), None, 100, 0)
    assert total == 3
    assert len(items) == 3

    # Filter by agent
    items, total = await get_interactions(now - timedelta(days=1), now + timedelta(minutes=1), "cairo-coder", 100, 0)
    assert total == 2
    assert all(it["agent_id"] == "cairo-coder" for it in items)

    # Pagination
    items_page_1, _ = await get_interactions(now - timedelta(days=1), now + timedelta(minutes=1), None, 2, 0)
    items_page_2, _ = await get_interactions(now - timedelta(days=1), now + timedelta(minutes=1), None, 2, 2)
    assert len(items_page_1) == 2
    assert len(items_page_2) == 1

    # No match
    items, total = await get_interactions(now - timedelta(days=10), now - timedelta(days=9), None, 100, 0)
    assert total == 0
    assert items == []


@pytest.mark.asyncio
async def test_create_and_get_analysis_job(test_db_pool, db_connection):
    from cairo_coder.db.repository import create_analysis_job, get_analysis_job_by_id

    params = {"start_date": "2024-01-01T00:00:00Z", "end_date": "2024-01-02T00:00:00Z", "agent_id": None}
    job_id = await create_analysis_job(params)
    assert isinstance(job_id, uuid.UUID)

    job = await get_analysis_job_by_id(job_id)
    assert job is not None
    assert job["status"] == "pending"
    assert job["analysis_parameters"]["start_date"] == "2024-01-01T00:00:00Z"


@pytest.mark.asyncio
async def test_update_analysis_job(test_db_pool, db_connection):
    from cairo_coder.db.repository import (
        create_analysis_job,
        get_analysis_job_by_id,
        update_analysis_job,
    )

    job_id = await create_analysis_job({"a": 1})
    await update_analysis_job(job_id, "completed", result={"ok": True})
    job = await get_analysis_job_by_id(job_id)
    assert job is not None
    assert job["status"] == "completed"
    assert job["analysis_result"] == {"ok": True}

    job_id2 = await create_analysis_job({"b": 2})
    await update_analysis_job(job_id2, "failed", error="boom")
    job2 = await get_analysis_job_by_id(job_id2)
    assert job2 is not None
    assert job2["status"] == "failed"
    assert job2["error_message"] == "boom"


@pytest.mark.asyncio
async def test_get_analysis_jobs(test_db_pool, db_connection):
    from cairo_coder.db.repository import create_analysis_job, get_analysis_jobs

    # Insert several jobs
    for i in range(3):
        await create_analysis_job({"i": i})

    jobs = await get_analysis_jobs()
    assert len(jobs) == 3
    # Jobs ordered by created_at desc
    created_at_values = [j["created_at"] for j in jobs]
    assert created_at_values == sorted(created_at_values, reverse=True)
