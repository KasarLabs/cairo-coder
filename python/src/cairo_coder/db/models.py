"""
Pydantic models representing rows stored in the query insights database tables.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from pydantic import BaseModel, Field


class UserInteraction(BaseModel):
    """Represents a record in the user_interactions table."""

    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    agent_id: str
    mcp_mode: bool = False
    chat_history: Optional[list[dict[str, Any]]] = None
    query: str
    generated_answer: Optional[str] = None
    retrieved_sources: Optional[list[dict[str, Any]]] = None
    llm_usage: Optional[dict[str, Any]] = None


class QueryAnalysis(BaseModel):
    """Represents a record in the query_analyses table."""

    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "pending"
    analysis_parameters: dict[str, Any]
    analysis_result: Optional[dict[str, Any]] = None
    error_message: Optional[str] = None
