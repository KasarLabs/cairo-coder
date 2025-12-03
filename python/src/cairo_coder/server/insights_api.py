"""
Router exposing the Query Insights API endpoints.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

import structlog
from fastapi import APIRouter
from pydantic import BaseModel

from cairo_coder.db.repository import get_interactions

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/v1/insights", tags=["Insights"])


class QueryResponse(BaseModel):
    """Subset of `UserInteraction` returned through the API."""

    id: UUID
    created_at: datetime
    agent_id: str
    query: str
    chat_history: list[dict[str, Any]]
    output: str | None
    conversation_id: str | None = None
    user_id: str | None = None


class PaginatedQueryResponse(BaseModel):
    """Paginated list of raw queries."""

    items: list[QueryResponse]
    total: int
    limit: int
    offset: int


@router.get("/queries", response_model=PaginatedQueryResponse)
async def get_raw_queries(
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    agent_id: str | None = None,
    query_text: str | None = None,
    conversation_id: str | None = None,
    user_id: str | None = None,
    limit: int = 100,
    offset: int = 0,
) -> PaginatedQueryResponse:
    """Return raw user queries.

    If start_date and end_date are not provided, returns the last N queries
    ordered by creation time (where N is the limit parameter).

    Use conversation_id to filter queries belonging to a specific conversation.
    Use user_id to filter queries belonging to a specific user.
    """
    items, total = await get_interactions(
        start_date, end_date, agent_id, limit, offset, query_text, conversation_id, user_id
    )
    # Map generated_answer to output for API response
    responses = [
        QueryResponse(
            id=item["id"],
            created_at=item["created_at"],
            agent_id=item["agent_id"],
            query=item["query"],
            chat_history=item["chat_history"] or [],
            output=item.get("generated_answer"),
            conversation_id=item.get("conversation_id"),
            user_id=item.get("user_id"),
        )
        for item in items
    ]
    return PaginatedQueryResponse(items=responses, total=total, limit=limit, offset=offset)
