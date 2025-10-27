"""
Data access helpers for the Query Insights persistence layer.
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime
from typing import Any

import structlog

from cairo_coder.db.models import UserInteraction
from cairo_coder.db.session import get_pool

logger = structlog.get_logger(__name__)


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
                    chat_history,
                    query,
                    generated_answer,
                    retrieved_sources,
                    llm_usage
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                """,
                interaction.id,
                interaction.agent_id,
                interaction.mcp_mode,
                json.dumps(interaction.chat_history) if interaction.chat_history else None,
                interaction.query,
                interaction.generated_answer,
                json.dumps(interaction.retrieved_sources) if interaction.retrieved_sources else None,
                json.dumps(interaction.llm_usage) if interaction.llm_usage else None,
            )
        logger.debug("User interaction logged successfully", interaction_id=str(interaction.id))
    except Exception as exc:  # pragma: no cover - defensive logging
        logger.error("Failed to log user interaction", error=str(exc), exc_info=True)


async def get_interactions(
    start_date: datetime,
    end_date: datetime,
    agent_id: str | None,
    limit: int,
    offset: int,
) -> tuple[list[dict[str, Any]], int]:
    """Fetch paginated interactions matching the supplied filters."""
    pool = await get_pool()
    async with pool.acquire() as connection:
        params: list[Any] = [start_date, end_date]
        agent_filter = ""
        if agent_id:
            agent_filter = "AND agent_id = $3"
            params.append(agent_id)

        count_query = f"""
            SELECT COUNT(*)
            FROM user_interactions
            WHERE created_at >= $1
              AND created_at <= $2
              {agent_filter}
        """
        total = await connection.fetchval(count_query, *params)

        params.extend([limit, offset])
        limit_placeholder = len(params) - 1
        offset_placeholder = len(params)
        data_query = f"""
            SELECT id, created_at, agent_id, query, chat_history
            FROM user_interactions
            WHERE created_at >= $1
              AND created_at <= $2
              {agent_filter}
            ORDER BY created_at DESC
            LIMIT ${limit_placeholder}
            OFFSET ${offset_placeholder}
        """
        rows = await connection.fetch(data_query, *params)
    return [dict(row) for row in rows], int(total)


async def create_analysis_job(params: dict[str, Any]) -> uuid.UUID:
    """Insert a new analysis job and return its identifier."""
    pool = await get_pool()
    async with pool.acquire() as connection:
        job_id = await connection.fetchval(
            """
            INSERT INTO query_analyses (status, analysis_parameters)
            VALUES ('pending', $1)
            RETURNING id
            """,
            json.dumps(params),
        )
    return job_id


async def update_analysis_job(
    job_id: uuid.UUID,
    status: str,
    result: dict[str, Any] | None = None,
    error: str | None = None,
) -> None:
    """Update an existing analysis job record."""
    pool = await get_pool()
    async with pool.acquire() as connection:
        await connection.execute(
            """
            UPDATE query_analyses
            SET status = $1,
                analysis_result = $2,
                error_message = $3
            WHERE id = $4
            """,
            status,
            json.dumps(result) if result is not None else None,
            error,
            job_id,
        )


async def get_analysis_jobs(limit: int = 100) -> list[dict[str, Any]]:
    """Return a list of analysis jobs ordered by recency."""
    pool = await get_pool()
    async with pool.acquire() as connection:
        rows = await connection.fetch(
            """
            SELECT id, created_at, status, analysis_parameters
            FROM query_analyses
            ORDER BY created_at DESC
            LIMIT $1
            """,
            limit,
        )
    return [dict(row) for row in rows]


async def get_analysis_job_by_id(job_id: uuid.UUID) -> dict[str, Any] | None:
    """Fetch a single analysis job by its identifier."""
    pool = await get_pool()
    async with pool.acquire() as connection:
        row = await connection.fetchrow(
            """
            SELECT id,
                   created_at,
                   status,
                   analysis_parameters,
                   analysis_result,
                   error_message
            FROM query_analyses
            WHERE id = $1
            """,
            job_id,
        )
    return dict(row) if row is not None else None
