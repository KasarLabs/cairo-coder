"""Tests for LangSmith migration utilities."""

from __future__ import annotations

import uuid
from urllib.parse import urlparse

import pytest

from cairo_coder_tools.datasets.migrate_langsmith import transform_run_to_interaction

# Import test fixtures from integration tests
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


def test_transform_run_to_interaction_simple():
    """Test transformation with no chat history."""
    from datetime import datetime, timezone

    run_id_str = str(uuid.uuid4())
    run = {
        "run_id": run_id_str,
        "query": "What is Cairo?",
        "chat_history": [],
        "output": "Cairo is a programming language...",
        "mcp_mode": False,
        "created_at": "2025-01-15T10:30:00Z",
    }

    interaction = transform_run_to_interaction(run)

    assert str(interaction.id) == run_id_str
    assert interaction.query == "What is Cairo?"
    assert interaction.chat_history is None  # Empty list becomes None
    assert interaction.generated_answer == "Cairo is a programming language..."
    assert interaction.mcp_mode is False
    assert interaction.created_at == datetime(2025, 1, 15, 10, 30, 0, tzinfo=timezone.utc)


def test_transform_run_to_interaction_with_history():
    """Test transformation with chat history."""
    run_id_str = str(uuid.uuid4())
    run = {
        "run_id": run_id_str,
        "query": "How do I deploy it?",
        "chat_history": [
            {"role": "user", "content": "What is Cairo?"},
            {"role": "assistant", "content": "Cairo is a programming language..."},
        ],
        "output": "You can deploy using...",
        "mcp_mode": True,
    }

    interaction = transform_run_to_interaction(run)

    assert str(interaction.id) == run_id_str
    assert interaction.query == "How do I deploy it?"
    assert interaction.chat_history == [
        {"role": "user", "content": "What is Cairo?"},
        {"role": "assistant", "content": "Cairo is a programming language..."},
    ]
    assert interaction.generated_answer == "You can deploy using..."
    assert interaction.mcp_mode is True


def test_transform_run_to_interaction_missing_run_id():
    """Test that missing run_id raises ValueError."""
    run = {
        "query": "Test query",
        "chat_history": [],
        "output": "Test output",
    }

    with pytest.raises(ValueError, match="missing 'run_id'"):
        transform_run_to_interaction(run)


def test_transform_run_to_interaction_missing_query():
    """Test that missing query field raises ValueError."""
    run = {
        "run_id": str(uuid.uuid4()),
        "chat_history": [],
        "output": "Test output",
    }

    with pytest.raises(ValueError, match="has no query field"):
        transform_run_to_interaction(run)


def test_transform_run_to_interaction_invalid_uuid():
    """Test that invalid run_id raises ValueError."""
    run = {
        "run_id": "not-a-uuid",
        "query": "Test query",
        "chat_history": [],
        "output": "Test output",
    }

    with pytest.raises(ValueError, match="Invalid run_id format"):
        transform_run_to_interaction(run)


def test_transform_run_to_interaction_defaults():
    """Test that missing optional fields use defaults."""
    from datetime import datetime, timezone

    run_id = str(uuid.uuid4())
    run = {
        "run_id": run_id,
        "query": "Test query",
        # mcp_mode, output, and created_at missing
    }

    before_migration = datetime.now(timezone.utc)
    interaction = transform_run_to_interaction(run)
    after_migration = datetime.now(timezone.utc)

    assert str(interaction.id) == run_id
    assert interaction.query == "Test query"
    assert interaction.mcp_mode is False  # Default
    assert interaction.generated_answer == ""  # Default
    assert interaction.retrieved_sources is None
    assert interaction.llm_usage is None
    # Verify created_at defaults to migration time (within a reasonable window)
    assert before_migration <= interaction.created_at <= after_migration


def test_transform_run_to_interaction_with_timestamp():
    """Test that created_at timestamp is preserved from LangSmith run."""
    from datetime import datetime, timezone

    run_id = str(uuid.uuid4())
    original_timestamp = datetime(2025, 1, 10, 15, 45, 30, tzinfo=timezone.utc)

    run = {
        "run_id": run_id,
        "query": "Test query",
        "mcp_mode": False,
        "output": "Test output",
        "created_at": original_timestamp.isoformat(),
    }

    interaction = transform_run_to_interaction(run)

    # Verify the original timestamp is preserved exactly
    assert interaction.created_at == original_timestamp


def test_transform_run_to_interaction_with_datetime_object():
    """Test that created_at works with datetime objects."""
    from datetime import datetime, timezone

    run_id = str(uuid.uuid4())
    original_timestamp = datetime(2025, 1, 10, 15, 45, 30, tzinfo=timezone.utc)

    run = {
        "run_id": run_id,
        "query": "Test query",
        "mcp_mode": False,
        "output": "Test output",
        "created_at": original_timestamp,  # Pass as datetime object
    }

    interaction = transform_run_to_interaction(run)

    # Verify the original timestamp is preserved
    assert interaction.created_at == original_timestamp


@pytest.mark.asyncio
async def test_migrate_runs(test_db_pool, db_connection):
    """Test migration with direct format (query + chat_history)."""
    from datetime import datetime, timezone

    from cairo_coder_tools.datasets.migrate_langsmith import migrate_runs

    run_id = str(uuid.uuid4())
    timestamp = datetime(2025, 1, 15, 14, 30, 0, tzinfo=timezone.utc)

    # New format with query + chat_history
    runs = [
        {
            "run_id": run_id,
            "query": "How do I deploy a contract?",
            "chat_history": [
                {"role": "user", "content": "What is Cairo?"},
                {"role": "assistant", "content": "Cairo is a programming language..."},
            ],
            "output": "You can deploy using Scarb...",
            "mcp_mode": False,
            "created_at": timestamp.isoformat(),
        }
    ]

    stats = await migrate_runs(runs)

    assert stats["runs_processed"] == 1
    assert stats["inserted"] == 1
    assert stats["updated"] == 0
    assert stats["failed"] == 0

    # Verify data in database
    row = await db_connection.fetchrow(
        "SELECT * FROM user_interactions WHERE id = $1", uuid.UUID(run_id)
    )
    assert row is not None
    assert row["query"] == "How do I deploy a contract?"
    assert row["generated_answer"] == "You can deploy using Scarb..."
    assert row["created_at"] == timestamp

    # Verify chat_history is preserved
    import json
    chat_history = row["chat_history"]
    if isinstance(chat_history, str):
        chat_history = json.loads(chat_history)
    assert len(chat_history) == 2
    assert chat_history[0]["role"] == "user"
    assert chat_history[0]["content"] == "What is Cairo?"


@pytest.mark.asyncio
async def test_migrate_runs_with_invalid_data(test_db_pool):
    """Test that invalid runs are counted as failed."""
    from datetime import datetime, timezone

    from cairo_coder_tools.datasets.migrate_langsmith import migrate_runs

    valid_run_id = str(uuid.uuid4())
    runs = [
        {
            "run_id": valid_run_id,
            "query": "Valid query",
            "mcp_mode": False,
            "output": "Valid output",
            "created_at": datetime(2025, 1, 10, 10, 0, 0, tzinfo=timezone.utc).isoformat(),
        },
        {
            "run_id": "invalid-uuid",  # Invalid UUID
            "query": "Query",
            "mcp_mode": False,
            "output": "Output",
            "created_at": datetime(2025, 1, 11, 10, 0, 0, tzinfo=timezone.utc).isoformat(),
        },
        {
            "run_id": str(uuid.uuid4()),
            # Missing query field
            "mcp_mode": False,
            "output": "Output",
            "created_at": datetime(2025, 1, 12, 10, 0, 0, tzinfo=timezone.utc).isoformat(),
        },
    ]

    stats = await migrate_runs(runs)

    assert stats["runs_processed"] == 1  # Only the valid one processed
    assert stats["inserted"] == 1  # Only the valid one inserted
    assert stats["updated"] == 0
    assert stats["failed"] == 2  # Two invalid runs failed


@pytest.mark.asyncio
async def test_migrate_runs_upsert(test_db_pool, db_connection):
    """Test that migrate_runs performs upsert (update on conflict)."""
    from datetime import datetime, timezone

    from cairo_coder_tools.datasets.migrate_langsmith import migrate_runs

    run_id = str(uuid.uuid4())
    timestamp = datetime(2025, 1, 15, 14, 30, 0, tzinfo=timezone.utc)

    # First insert
    runs = [
        {
            "run_id": run_id,
            "query": "Original query",
            "chat_history": [],
            "output": "Original answer",
            "mcp_mode": False,
            "created_at": timestamp.isoformat(),
        }
    ]

    stats1 = await migrate_runs(runs)
    assert stats1["inserted"] == 1
    assert stats1["updated"] == 0

    # Update the same run
    runs_updated = [
        {
            "run_id": run_id,
            "query": "Updated query",
            "chat_history": [{"role": "user", "content": "Previous context"}],
            "output": "Updated answer",
            "mcp_mode": True,
            "created_at": timestamp.isoformat(),
        }
    ]

    stats2 = await migrate_runs(runs_updated)
    assert stats2["inserted"] == 0
    assert stats2["updated"] == 1

    # Verify updated data
    row = await db_connection.fetchrow(
        "SELECT * FROM user_interactions WHERE id = $1", uuid.UUID(run_id)
    )
    assert row["query"] == "Updated query"
    assert row["generated_answer"] == "Updated answer"
    assert row["mcp_mode"] is True
