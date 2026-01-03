"""
Asyncpg session management for the Query Insights persistence layer.
"""

from __future__ import annotations

import asyncio

import asyncpg
import structlog

from cairo_coder.core.config import load_config
from cairo_coder.core.constants import MAX_POOL_SIZE, MIN_POOL_SIZE

logger = structlog.get_logger(__name__)

# Maintain one pool per running event loop to avoid cross-loop usage issues
pools: dict[int, asyncpg.Pool] = {}


async def get_pool() -> asyncpg.Pool:
    """Return an asyncpg connection pool bound to the current event loop.

    FastAPI's TestClient and AnyIO can run application code across different
    event loops. Using a single cached pool may lead to cross-loop errors.
    To prevent this, we maintain a pool per loop.
    """
    loop = asyncio.get_running_loop()
    key = id(loop)
    pool = pools.get(key)
    if pool is None:
        config = load_config()
        try:
            pool = await asyncpg.create_pool(
                dsn=config.vector_store.dsn,
                min_size=MIN_POOL_SIZE,
                max_size=MAX_POOL_SIZE,
            )
            pools[key] = pool
            logger.info("Database connection pool created successfully.")
        except Exception as exc:  # pragma: no cover - defensive logging
            logger.error("Failed to create database connection pool", error=str(exc))
            raise
    return pool


async def close_pool() -> None:
    """Close the asyncpg connection pool if it is active."""
    import contextlib

    # Close and clear all pools
    global pools
    for p in list(pools.values()):
        with contextlib.suppress(Exception):
            await p.close()
    pools.clear()
    logger.info("Database connection pool(s) closed.")


async def execute_schema_scripts() -> None:
    """Ensure the tables required for the insights platform exist."""
    pool = await get_pool()
    async with pool.acquire() as connection:
        # Ensure pgcrypto is available for gen_random_uuid()
        await connection.execute(
            "CREATE EXTENSION IF NOT EXISTS pgcrypto;"
        )
        await connection.execute(
            """
            CREATE TABLE IF NOT EXISTS user_interactions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                agent_id VARCHAR(50) NOT NULL,
                mcp_mode BOOLEAN NOT NULL DEFAULT FALSE,
                conversation_id VARCHAR(100),
                user_id VARCHAR(100),
                chat_history JSONB,
                query TEXT NOT NULL,
                generated_answer TEXT,
                retrieved_sources JSONB,
                llm_usage JSONB
            );
            """
        )
        # Migration: add conversation_id column if it doesn't exist (for existing tables)
        await connection.execute(
            """
            ALTER TABLE user_interactions
            ADD COLUMN IF NOT EXISTS conversation_id VARCHAR(100);
            """
        )
        # Migration: add user_id column if it doesn't exist (for existing tables)
        await connection.execute(
            """
            ALTER TABLE user_interactions
            ADD COLUMN IF NOT EXISTS user_id VARCHAR(100);
            """
        )
        await connection.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_interactions_created_at
                ON user_interactions(created_at);
            CREATE INDEX IF NOT EXISTS idx_interactions_agent_id
                ON user_interactions(agent_id);
            CREATE INDEX IF NOT EXISTS idx_interactions_conversation_id
                ON user_interactions(conversation_id);
            CREATE INDEX IF NOT EXISTS idx_interactions_user_id
                ON user_interactions(user_id);
            """
        )
    logger.info("Database schema initialized.")
