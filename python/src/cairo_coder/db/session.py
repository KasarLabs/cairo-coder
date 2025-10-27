"""
Asyncpg session management for the Query Insights persistence layer.
"""

from __future__ import annotations

import asyncpg
import structlog

from cairo_coder.config.manager import ConfigManager

logger = structlog.get_logger(__name__)

pool: asyncpg.Pool | None = None


async def get_pool() -> asyncpg.Pool:
    """Return the global asyncpg connection pool, lazily creating it."""
    global pool
    if pool is None:
        config = ConfigManager.load_config()
        try:
            pool = await asyncpg.create_pool(
                dsn=config.vector_store.dsn,
                min_size=2,
                max_size=10,
            )
            logger.info("Database connection pool created successfully.")
        except Exception as exc:  # pragma: no cover - defensive logging
            logger.error("Failed to create database connection pool", error=str(exc))
            raise
    return pool


async def close_pool() -> None:
    """Close the asyncpg connection pool if it is active."""
    global pool
    if pool is not None:
        await pool.close()
        pool = None
        logger.info("Database connection pool closed.")


async def execute_schema_scripts() -> None:
    """Ensure the tables required for the insights platform exist."""
    pool = await get_pool()
    async with pool.acquire() as connection:
        await connection.execute(
            """
            CREATE TABLE IF NOT EXISTS user_interactions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                agent_id VARCHAR(50) NOT NULL,
                mcp_mode BOOLEAN NOT NULL DEFAULT FALSE,
                chat_history JSONB,
                query TEXT NOT NULL,
                generated_answer TEXT,
                retrieved_sources JSONB,
                llm_usage JSONB
            );
            """
        )
        await connection.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_interactions_created_at
                ON user_interactions(created_at);
            CREATE INDEX IF NOT EXISTS idx_interactions_agent_id
                ON user_interactions(agent_id);
            """
        )
        await connection.execute(
            """
            CREATE TABLE IF NOT EXISTS query_analyses (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                status VARCHAR(20) NOT NULL DEFAULT 'pending',
                analysis_parameters JSONB,
                analysis_result JSONB,
                error_message TEXT
            );
            """
        )
        await connection.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_analyses_created_at
                ON query_analyses(created_at);
            """
        )
    logger.info("Database schema initialized.")
