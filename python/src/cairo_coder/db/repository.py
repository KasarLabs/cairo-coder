"""
Data access helpers for the Query Insights persistence layer.
"""

from __future__ import annotations

import json
from datetime import datetime
from typing import Any

import structlog

from cairo_coder.db.models import UserInteraction
from cairo_coder.db.session import get_pool

logger = structlog.get_logger(__name__)


def _serialize_json_field(value: Any) -> str | None:
    """
    Serialize a Python object to JSON string for database storage.

    Args:
        value: Python object to serialize (dict, list, etc.)

    Returns:
        JSON string or None if value is None/empty
    """
    if value is None:
        return None
    return json.dumps(value)


def _normalize_json_field(value: Any, default: Any = None) -> Any:
    """
    Normalize a JSON field from database (may be string or already parsed).

    Args:
        value: Value from database (string, dict, list, or None)
        default: Default value to use if parsing fails or value is None

    Returns:
        Parsed JSON object or default value
    """
    if value is None:
        return default
    if isinstance(value, str):
        try:
            return json.loads(value)
        except (json.JSONDecodeError, TypeError):
            return default
    return value


def _normalize_row(row: dict | None, fields_with_defaults: dict[str, Any]) -> dict | None:
    """
    Parse stringified JSON fields in a row dictionary and apply defaults for None values.

    Args:
        row: Dictionary from database row (or None)
        fields_with_defaults: Mapping of field names to default values

    Returns:
        Normalized dictionary with parsed JSON fields, or None if input row is None
    """
    if row is None:
        return None

    d = dict(row)
    for field, default_val in fields_with_defaults.items():
        d[field] = _normalize_json_field(d.get(field), default_val)
    return d


async def create_user_interaction(interaction: UserInteraction) -> None:
    """Persist a user interaction in the database."""
    pool = await get_pool()
    try:
        async with pool.acquire() as connection:
            await connection.execute(
                """
                INSERT INTO user_interactions (
                    id,
                    agent_id,
                    mcp_mode,
                    conversation_id,
                    chat_history,
                    query,
                    generated_answer,
                    retrieved_sources,
                    llm_usage
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                """,
                interaction.id,
                interaction.agent_id,
                interaction.mcp_mode,
                interaction.conversation_id,
                _serialize_json_field(interaction.chat_history),
                interaction.query,
                interaction.generated_answer,
                _serialize_json_field(interaction.retrieved_sources),
                _serialize_json_field(interaction.llm_usage),
            )
        logger.debug("User interaction logged successfully", interaction_id=str(interaction.id))
    except Exception as exc:  # pragma: no cover - defensive logging
        logger.error("Failed to log user interaction", error=str(exc), exc_info=True)


async def get_interactions(
    start_date: datetime | None,
    end_date: datetime | None,
    agent_id: str | None,
    limit: int,
    offset: int,
    query_text: str | None = None,
    conversation_id: str | None = None,
) -> tuple[list[dict[str, Any]], int]:
    """Fetch paginated interactions matching the supplied filters.

    If start_date and end_date are not provided, returns the last N interactions
    ordered by created_at DESC.
    """
    pool = await get_pool()
    async with pool.acquire() as connection:
        params: list[Any] = []
        filters = []

        if start_date is not None:
            params.append(start_date)
            filters.append(f"created_at >= ${len(params)}")

        if end_date is not None:
            params.append(end_date)
            filters.append(f"created_at <= ${len(params)}")

        if agent_id:
            params.append(agent_id)
            filters.append(f"agent_id = ${len(params)}")

        if query_text:
            params.append(f"%{query_text}%")
            filters.append(f"query ILIKE ${len(params)}")

        if conversation_id:
            params.append(conversation_id)
            filters.append(f"conversation_id = ${len(params)}")

        where_clause = "WHERE " + " AND ".join(filters) if filters else ""

        count_query = f"""
            SELECT COUNT(*)
            FROM user_interactions
            {where_clause}
        """
        total = await connection.fetchval(count_query, *params)

        params.extend([limit, offset])
        limit_placeholder = len(params) - 1
        offset_placeholder = len(params)
        data_query = f"""
            SELECT id, created_at, agent_id, query, chat_history, generated_answer, conversation_id
            FROM user_interactions
            {where_clause}
            ORDER BY created_at DESC
            LIMIT ${limit_placeholder}
            OFFSET ${offset_placeholder}
        """
        rows = await connection.fetch(data_query, *params)

    # Normalize JSON fields that may be returned as strings by asyncpg
    items = [_normalize_row(dict(row), {"chat_history": []}) for row in rows]
    return items, int(total)


async def migrate_user_interaction(interaction: UserInteraction) -> tuple[bool, bool]:
    """
    Persist a user interaction for migration purposes with upsert behavior.

    Uses ON CONFLICT DO UPDATE to override existing entries based on the ID.
    This allows re-running migrations to update data if needed.

    Args:
        interaction: UserInteraction model with pre-set ID from LangSmith

    Returns:
        Tuple of (was_modified, was_inserted) where:
        - was_modified: True if any action was taken (insert or update)
        - was_inserted: True if inserted, False if updated
    """
    pool = await get_pool()
    try:
        async with pool.acquire() as connection:
            # Single upsert round-trip; infer insert vs update via system column
            row = await connection.fetchrow(
                """
                INSERT INTO user_interactions (
                    id,
                    created_at,
                    agent_id,
                    mcp_mode,
                    conversation_id,
                    chat_history,
                    query,
                    generated_answer,
                    retrieved_sources,
                    llm_usage
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT (id) DO UPDATE SET
                    created_at = EXCLUDED.created_at,
                    agent_id = EXCLUDED.agent_id,
                    mcp_mode = EXCLUDED.mcp_mode,
                    conversation_id = EXCLUDED.conversation_id,
                    chat_history = EXCLUDED.chat_history,
                    query = EXCLUDED.query,
                    generated_answer = EXCLUDED.generated_answer,
                    retrieved_sources = EXCLUDED.retrieved_sources,
                    llm_usage = EXCLUDED.llm_usage
                RETURNING (xmax = 0) AS inserted
                """,
                interaction.id,
                interaction.created_at,
                interaction.agent_id,
                interaction.mcp_mode,
                interaction.conversation_id,
                _serialize_json_field(interaction.chat_history),
                interaction.query,
                interaction.generated_answer,
                _serialize_json_field(interaction.retrieved_sources),
                _serialize_json_field(interaction.llm_usage),
            )

            if row is None:
                logger.warning("Unexpected: no result from upsert", interaction_id=str(interaction.id))
                return False, False

            was_inserted = bool(row["inserted"]) if "inserted" in row else False
            if was_inserted:
                logger.debug("User interaction inserted", interaction_id=str(interaction.id))
            else:
                logger.debug("User interaction updated", interaction_id=str(interaction.id))
            return True, was_inserted
    except Exception as exc:  # pragma: no cover - defensive logging
        logger.error("Failed to migrate user interaction", error=str(exc), exc_info=True)
        raise

