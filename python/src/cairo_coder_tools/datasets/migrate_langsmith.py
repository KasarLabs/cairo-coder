"""
Migration utilities for importing LangSmith runs into the PostgreSQL database.

This module provides functions to transform LangSmith run data into the
UserInteraction format and persist it to the database with idempotent behavior.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from cairo_coder.agents.registry import AgentId
import structlog

from cairo_coder.db.models import UserInteraction
from cairo_coder.db.repository import migrate_user_interaction

logger = structlog.get_logger(__name__)


def transform_run_to_interaction(run: dict[str, Any]) -> UserInteraction:
    """
    Transform a LangSmith run to a UserInteraction.

    LangSmith data format:
    {
        "run_id": "UUID",
        "query": "current query",
        "chat_history": [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}],
        "output": "generated response",
        "mcp_mode": false,
        "created_at": "2025-01-15T10:30:00Z"
    }

    This directly maps to UserInteraction, no transformation needed.

    Args:
        run: Dictionary containing run data from LangSmith

    Returns:
        UserInteraction model ready for database insertion

    Raises:
        ValueError: If run data is invalid or missing required fields
    """
    # Validate required fields
    if not run.get("run_id"):
        raise ValueError("Run missing 'run_id' field")

    if "query" not in run:
        raise ValueError(f"Run {run['run_id']} has no query field")

    # Convert run_id to UUID
    try:
        run_id = uuid.UUID(run["run_id"])
    except (ValueError, TypeError) as e:
        raise ValueError(f"Invalid run_id format: {run['run_id']}") from e

    # Parse created_at timestamp if available
    created_at = datetime.now(timezone.utc)
    if "created_at" in run:
        try:
            created_at_value = run["created_at"]
            if isinstance(created_at_value, str):
                created_at = datetime.fromisoformat(created_at_value.replace('Z', '+00:00'))
            elif isinstance(created_at_value, datetime):
                created_at = created_at_value
        except (ValueError, TypeError) as e:
            logger.warning(
                "Failed to parse created_at, using migration time",
                run_id=run["run_id"],
                created_at=run.get("created_at"),
                error=str(e),
            )

    # Get chat_history, ensure it's a list
    chat_history = run.get("chat_history")
    if chat_history and not isinstance(chat_history, list):
        logger.warning(
            "Invalid chat_history format, using empty list",
            run_id=run["run_id"],
            chat_history_type=type(chat_history).__name__,
        )
        chat_history = []

    # Create UserInteraction directly from run data
    is_mcp_mode = run.get("mcp_mode", False)
    default_agent_id = AgentId.CAIRO_CODER.value if is_mcp_mode else AgentId.STARKNET.value
    resolved_agent_id = run.get("agent_id", default_agent_id)

    return UserInteraction(
        id=run_id,
        created_at=created_at,
        agent_id=resolved_agent_id,
        mcp_mode=is_mcp_mode,
        chat_history=chat_history if chat_history else None,
        query=run["query"],
        generated_answer=run.get("output", ""),
        retrieved_sources=None,  # Not available from LangSmith export
        llm_usage=None,  # Not available from LangSmith export
    )


async def migrate_runs(runs: list[dict[str, Any]]) -> dict[str, int]:
    """
    Migrate a list of LangSmith runs to the database.

    Expected format: {run_id, query, chat_history, output, mcp_mode, created_at}

    This function uses upsert behavior - existing records will be updated
    with new data, and new records will be inserted.

    Args:
        runs: List of run dictionaries from LangSmith

    Returns:
        Dictionary with migration statistics:
        {
            "runs_processed": total number of runs processed,
            "inserted": number of new records created,
            "updated": number of existing records updated,
            "failed": number of errors
        }
    """
    stats = {
        "runs_processed": 0,
        "inserted": 0,
        "updated": 0,
        "failed": 0,
    }

    for run in runs:
        try:
            interaction = transform_run_to_interaction(run)

            was_modified, was_inserted = await migrate_user_interaction(interaction)

            if was_modified:
                if was_inserted:
                    stats["inserted"] += 1
                else:
                    stats["updated"] += 1

            stats["runs_processed"] += 1

        except ValueError as e:
            logger.warning("Skipping invalid run", error=str(e), run_id=run.get("run_id"))
            stats["failed"] += 1
        except Exception as e:
            logger.error(
                "Failed to process run",
                error=str(e),
                run_id=run.get("run_id"),
                exc_info=True,
            )
            stats["failed"] += 1

    logger.info("Migration completed", **stats)
    return stats
