"""
Pydantic models representing rows stored in the query insights database tables.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from pydantic import BaseModel, Field

from cairo_coder.core.types import RetrievedSourceData


class UserInteraction(BaseModel):
    """Represents a record in the user_interactions table."""

    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    agent_id: str
    mcp_mode: bool = False
    conversation_id: Optional[str] = None
    user_id: Optional[str] = None
    chat_history: Optional[list[dict[str, Any]]] = None
    query: str
    generated_answer: Optional[str] = None
    retrieved_sources: Optional[list[RetrievedSourceData]] = None
    llm_usage: Optional[dict[str, Any]] = None
