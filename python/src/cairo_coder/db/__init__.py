"""
Database utilities for the Cairo Coder server.

This package exposes helpers for initializing the asyncpg connection pool and
provides Pydantic representations used when persisting query insights data.
"""

from .models import UserInteraction
from .repository import (
    create_user_interaction,
    get_interactions,
)
from .session import close_pool, execute_schema_scripts, get_pool

__all__ = [
    "UserInteraction",
    "create_user_interaction",
    "get_interactions",
    "close_pool",
    "execute_schema_scripts",
    "get_pool",
]
