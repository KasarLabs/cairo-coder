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

from cairo_coder.core.types import DocumentSource

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
        retrieved_sources=[
            {"page_content": "Cairo", "metadata": {"source": DocumentSource.CAIRO_BOOK}}
        ],
        llm_usage={"model": {"prompt_tokens": 1, "completion_tokens": 1, "total_tokens": 2}},
    )

    await create_user_interaction(interaction)

    row = await db_connection.fetchrow("SELECT * FROM user_interactions WHERE id = $1", interaction.id)
    assert row is not None
    assert row["agent_id"] == "cairo-coder"
    assert row["query"] == "Hello"


@pytest.mark.asyncio
async def test_create_user_interaction_with_conversation_id(test_db_pool, db_connection):
    """Test that conversation_id is stored correctly."""
    from cairo_coder.db.models import UserInteraction
    from cairo_coder.db.repository import create_user_interaction

    conversation_id = "abc123def456"
    interaction = UserInteraction(
        agent_id="cairo-coder",
        mcp_mode=False,
        conversation_id=conversation_id,
        chat_history=[{"role": "user", "content": "Hello"}],
        query="Hello",
        generated_answer="Hi",
    )

    await create_user_interaction(interaction)

    row = await db_connection.fetchrow("SELECT * FROM user_interactions WHERE id = $1", interaction.id)
    assert row is not None
    assert row["conversation_id"] == conversation_id


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
        uuid.uuid4(), now - timedelta(hours=4), "cairo-coder", False, "How to deploy a contract",
        uuid.uuid4(), now - timedelta(hours=2), "starknet-agent", True, "Write a test for my contract",
        uuid.uuid4(), now - timedelta(minutes=30), "cairo-coder", False, "Deploy my contract to testnet",
    )

    # Fetch all
    items, total = await get_interactions(now - timedelta(days=1), now + timedelta(minutes=1), None, 100, 0)
    assert total == 3
    assert len(items) == 3

    # Filter by agent
    items, total = await get_interactions(now - timedelta(days=1), now + timedelta(minutes=1), "cairo-coder", 100, 0)
    assert total == 2
    assert all(it["agent_id"] == "cairo-coder" for it in items)

    # Filter by query text (case-insensitive)
    items, total = await get_interactions(now - timedelta(days=1), now + timedelta(minutes=1), None, 100, 0, query_text="deploy")
    assert total == 2
    assert all("deploy" in it["query"].lower() for it in items)

    # Filter by query text with no matches
    items, total = await get_interactions(now - timedelta(days=1), now + timedelta(minutes=1), None, 100, 0, query_text="nonexistent")
    assert total == 0
    assert items == []

    # Combine agent_id and query_text filters
    items, total = await get_interactions(now - timedelta(days=1), now + timedelta(minutes=1), "cairo-coder", 100, 0, query_text="deploy")
    assert total == 2
    assert all(it["agent_id"] == "cairo-coder" and "deploy" in it["query"].lower() for it in items)

    # Pagination
    items_page_1, _ = await get_interactions(now - timedelta(days=1), now + timedelta(minutes=1), None, 2, 0)
    items_page_2, _ = await get_interactions(now - timedelta(days=1), now + timedelta(minutes=1), None, 2, 2)
    assert len(items_page_1) == 2
    assert len(items_page_2) == 1

    # No match with date range
    items, total = await get_interactions(now - timedelta(days=10), now - timedelta(days=9), None, 100, 0)
    assert total == 0
    assert items == []

    # No dates provided - should return all items ordered by created_at DESC
    items, total = await get_interactions(None, None, None, 100, 0)
    assert total == 3
    assert len(items) == 3
    # Verify DESC order (most recent first)
    assert items[0]["created_at"] > items[1]["created_at"]
    assert items[1]["created_at"] > items[2]["created_at"]

    # No dates with limit
    items, total = await get_interactions(None, None, None, 2, 0)
    assert total == 3
    assert len(items) == 2

    # No dates but with agent filter
    items, total = await get_interactions(None, None, "cairo-coder", 100, 0)
    assert total == 2
    assert all(it["agent_id"] == "cairo-coder" for it in items)


@pytest.mark.asyncio
async def test_get_interactions_filter_by_conversation_id(test_db_pool, db_connection):
    """Test that interactions can be filtered by conversation_id."""
    from cairo_coder.db.repository import get_interactions

    now = datetime.now(timezone.utc)
    conv_id_1 = "conversation-aaa"
    conv_id_2 = "conversation-bbb"

    # Seed records with different conversation IDs
    await db_connection.execute(
        """
        INSERT INTO user_interactions (id, created_at, agent_id, mcp_mode, query, conversation_id)
        VALUES ($1, $2, $3, $4, $5, $6),
               ($7, $8, $9, $10, $11, $12),
               ($13, $14, $15, $16, $17, $18),
               ($19, $20, $21, $22, $23, $24)
        """,
        uuid.uuid4(), now - timedelta(hours=3), "cairo-coder", False, "First message conv 1", conv_id_1,
        uuid.uuid4(), now - timedelta(hours=2), "cairo-coder", False, "Second message conv 1", conv_id_1,
        uuid.uuid4(), now - timedelta(hours=1), "cairo-coder", False, "First message conv 2", conv_id_2,
        uuid.uuid4(), now - timedelta(minutes=30), "cairo-coder", False, "No conversation", None,
    )

    # Filter by conversation_id 1
    items, total = await get_interactions(None, None, None, 100, 0, conversation_id=conv_id_1)
    assert total == 2
    assert all(it["conversation_id"] == conv_id_1 for it in items)

    # Filter by conversation_id 2
    items, total = await get_interactions(None, None, None, 100, 0, conversation_id=conv_id_2)
    assert total == 1
    assert items[0]["conversation_id"] == conv_id_2

    # Verify conversation_id is returned in results
    items, total = await get_interactions(None, None, None, 100, 0)
    assert total == 4
    conv_ids = [it.get("conversation_id") for it in items]
    assert conv_id_1 in conv_ids
    assert conv_id_2 in conv_ids
    assert None in conv_ids


@pytest.mark.asyncio
async def test_create_user_interaction_with_user_id(test_db_pool, db_connection):
    """Test that user_id is stored correctly."""
    from cairo_coder.db.models import UserInteraction
    from cairo_coder.db.repository import create_user_interaction

    user_id = "hashed_user_abc123"
    interaction = UserInteraction(
        agent_id="cairo-coder",
        mcp_mode=False,
        user_id=user_id,
        chat_history=[{"role": "user", "content": "Hello"}],
        query="Hello",
        generated_answer="Hi",
    )

    await create_user_interaction(interaction)

    row = await db_connection.fetchrow("SELECT * FROM user_interactions WHERE id = $1", interaction.id)
    assert row is not None
    assert row["user_id"] == user_id


@pytest.mark.asyncio
async def test_get_interactions_filter_by_user_id(test_db_pool, db_connection):
    """Test that interactions can be filtered by user_id."""
    from cairo_coder.db.repository import get_interactions

    now = datetime.now(timezone.utc)
    user_id_1 = "hashed_user_aaa"
    user_id_2 = "hashed_user_bbb"

    # Seed records with different user IDs
    await db_connection.execute(
        """
        INSERT INTO user_interactions (id, created_at, agent_id, mcp_mode, query, user_id)
        VALUES ($1, $2, $3, $4, $5, $6),
               ($7, $8, $9, $10, $11, $12),
               ($13, $14, $15, $16, $17, $18),
               ($19, $20, $21, $22, $23, $24)
        """,
        uuid.uuid4(), now - timedelta(hours=3), "cairo-coder", False, "First message user 1", user_id_1,
        uuid.uuid4(), now - timedelta(hours=2), "cairo-coder", False, "Second message user 1", user_id_1,
        uuid.uuid4(), now - timedelta(hours=1), "cairo-coder", False, "First message user 2", user_id_2,
        uuid.uuid4(), now - timedelta(minutes=30), "cairo-coder", False, "No user", None,
    )

    # Filter by user_id 1
    items, total = await get_interactions(None, None, None, 100, 0, user_id=user_id_1)
    assert total == 2
    assert all(it["user_id"] == user_id_1 for it in items)

    # Filter by user_id 2
    items, total = await get_interactions(None, None, None, 100, 0, user_id=user_id_2)
    assert total == 1
    assert items[0]["user_id"] == user_id_2

    # Verify user_id is returned in results
    items, total = await get_interactions(None, None, None, 100, 0)
    assert total == 4
    user_ids = [it.get("user_id") for it in items]
    assert user_id_1 in user_ids
    assert user_id_2 in user_ids
    assert None in user_ids


@pytest.mark.asyncio
async def test_migrate_user_interaction_upsert(test_db_pool, db_connection):
    """Test that migrate_user_interaction performs upsert (insert or update)."""
    from cairo_coder.db.models import UserInteraction
    from cairo_coder.db.repository import migrate_user_interaction

    interaction_id = uuid.uuid4()
    interaction = UserInteraction(
        id=interaction_id,
        agent_id="cairo-coder",
        mcp_mode=False,
        chat_history=[{"role": "user", "content": "First question"}],
        query="Second question",
        generated_answer="Answer here",
        retrieved_sources=None,
        llm_usage=None,
    )

    # First migration should insert
    was_modified, was_inserted = await migrate_user_interaction(interaction)
    assert was_modified is True
    assert was_inserted is True

    # Verify it's in the database
    row = await db_connection.fetchrow("SELECT * FROM user_interactions WHERE id = $1", interaction_id)
    assert row is not None
    assert row["query"] == "Second question"
    assert row["generated_answer"] == "Answer here"

    # Second migration with same ID but different data should update
    interaction_updated = UserInteraction(
        id=interaction_id,
        agent_id="cairo-coder",
        mcp_mode=True,  # Changed
        chat_history=[{"role": "user", "content": "First question"}],
        query="Updated question",  # Changed
        generated_answer="Updated answer",  # Changed
        retrieved_sources=None,
        llm_usage=None,
    )

    was_modified_again, was_inserted_again = await migrate_user_interaction(interaction_updated)
    assert was_modified_again is True
    assert was_inserted_again is False  # Updated, not inserted

    # Verify data was updated
    row_updated = await db_connection.fetchrow("SELECT * FROM user_interactions WHERE id = $1", interaction_id)
    assert row_updated is not None
    assert row_updated["query"] == "Updated question"
    assert row_updated["generated_answer"] == "Updated answer"
    assert row_updated["mcp_mode"] is True

    # Verify still only one record
    count = await db_connection.fetchval("SELECT COUNT(*) FROM user_interactions WHERE id = $1", interaction_id)
    assert count == 1
