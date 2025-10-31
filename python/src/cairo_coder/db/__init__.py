"""
Database utilities for the Cairo Coder server.

This package exposes helpers for initializing the asyncpg connection pool and
provides Pydantic representations used when persisting query insights data.
"""

from .models import QueryAnalysis, UserInteraction
from .repository import (
    create_analysis_job,
    create_user_interaction,
    get_analysis_job_by_id,
    get_analysis_jobs,
    get_interactions,
    update_analysis_job,
)
from .session import close_pool, execute_schema_scripts, get_pool

__all__ = [
    "QueryAnalysis",
    "UserInteraction",
    "create_analysis_job",
    "create_user_interaction",
    "get_analysis_job_by_id",
    "get_analysis_jobs",
    "get_interactions",
    "update_analysis_job",
    "close_pool",
    "execute_schema_scripts",
    "get_pool",
]
