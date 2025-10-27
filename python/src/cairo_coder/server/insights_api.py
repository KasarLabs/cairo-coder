"""
Router exposing the Query Insights API endpoints.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

import structlog
from fastapi import APIRouter, BackgroundTasks, HTTPException, status
from pydantic import BaseModel, Field

from cairo_coder.db.repository import (
    create_analysis_job,
    get_analysis_job_by_id,
    get_analysis_jobs,
    get_interactions,
    update_analysis_job,
)
from cairo_coder_tools.datasets.analysis import run_analysis_from_queries

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/v1/insights", tags=["Insights"])


class QueryResponse(BaseModel):
    """Subset of `UserInteraction` returned through the API."""

    id: UUID
    created_at: datetime
    agent_id: str
    query: str
    chat_history: list[dict[str, Any]]


class PaginatedQueryResponse(BaseModel):
    """Paginated list of raw queries."""

    items: list[QueryResponse]
    total: int
    limit: int
    offset: int


class AnalysisRequest(BaseModel):
    """Request body for triggering a new analysis job."""

    start_date: datetime
    end_date: datetime
    agent_id: str | None = Field(default=None)


class AnalysisMetadata(BaseModel):
    """Metadata about an analysis job."""

    id: UUID
    created_at: datetime
    status: str
    analysis_parameters: dict


class AnalysisResult(AnalysisMetadata):
    """Full representation of an analysis job including results or errors."""

    analysis_result: dict | None = None
    error_message: str | None = None


async def run_analysis_task(
    analysis_id: UUID, start_date: datetime, end_date: datetime, agent_id: str | None
) -> None:
    """Background job that performs query analysis."""
    logger.info(
        "Starting analysis task",
        analysis_id=str(analysis_id),
        start_date=start_date.isoformat(),
        end_date=end_date.isoformat(),
        agent_id=agent_id,
    )
    try:
        raw_items, _ = await get_interactions(
            start_date=start_date,
            end_date=end_date,
            agent_id=agent_id,
            limit=10_000,
            offset=0,
        )
        queries = [item["query"] for item in raw_items]

        if not queries:
            await update_analysis_job(
                analysis_id,
                "completed",
                result={"message": "No queries found in the specified range."},
            )
            logger.info("Analysis task completed with no data", analysis_id=str(analysis_id))
            return

        analysis_result = run_analysis_from_queries(queries)
        await update_analysis_job(analysis_id, "completed", result=analysis_result)
        logger.info("Analysis task completed successfully", analysis_id=str(analysis_id))
    except Exception as exc:  # pragma: no cover - defensive logging
        logger.error(
            "Analysis task failed", analysis_id=str(analysis_id), error=str(exc), exc_info=True
        )
        await update_analysis_job(analysis_id, "failed", error=str(exc))


@router.get("/queries", response_model=PaginatedQueryResponse)
async def get_raw_queries(
    start_date: datetime,
    end_date: datetime,
    agent_id: str | None = None,
    limit: int = 100,
    offset: int = 0,
) -> PaginatedQueryResponse:
    """Return raw user queries within the specified window."""
    items, total = await get_interactions(start_date, end_date, agent_id, limit, offset)
    responses = [QueryResponse(**item) for item in items]
    return PaginatedQueryResponse(items=responses, total=total, limit=limit, offset=offset)


@router.post("/analyze", status_code=status.HTTP_202_ACCEPTED)
async def trigger_new_analysis(
    request: AnalysisRequest,
    background_tasks: BackgroundTasks,
) -> dict:
    """Enqueue a new analysis job for the requested time range."""
    analysis_params = {
        "start_date": request.start_date.isoformat(),
        "end_date": request.end_date.isoformat(),
        "agent_id": request.agent_id,
    }
    analysis_id = await create_analysis_job(analysis_params)
    background_tasks.add_task(
        run_analysis_task,
        analysis_id,
        request.start_date,
        request.end_date,
        request.agent_id,
    )
    return {"analysis_id": analysis_id, "status": "pending"}


@router.get("/analyses", response_model=list[AnalysisMetadata])
async def list_analyses() -> list[AnalysisMetadata]:
    """Return recent analysis jobs."""
    jobs = await get_analysis_jobs()
    return [AnalysisMetadata(**job) for job in jobs]


@router.get("/analyses/{analysis_id}", response_model=AnalysisResult)
async def get_analysis_result(analysis_id: UUID) -> AnalysisResult:
    """Return a single analysis job."""
    job = await get_analysis_job_by_id(analysis_id)
    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Analysis job not found"
        )
    return AnalysisResult(**job)
