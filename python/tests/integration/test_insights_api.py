"""
Integration tests for the /v1/insights API endpoints.

These tests rely on an ephemeral Postgres database via testcontainers and are
skipped unless RUN_DB_TESTS=1 is set.
"""

from __future__ import annotations

import asyncio
import json as _json
from datetime import datetime, timedelta, timezone
from uuid import UUID

import pytest

pytestmark = pytest.mark.db


class TestInsightsAPI:
    def test_get_queries_success(self, client, populated_db_connection):
        now = datetime.now(timezone.utc)
        start = (now - timedelta(hours=6)).isoformat()
        end = (now + timedelta(minutes=5)).isoformat()

        resp = client.get(
            "/v1/insights/queries",
            params={"start_date": start, "end_date": end, "limit": 10, "offset": 0},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data and "total" in data
        assert data["total"] >= 3
        assert len(data["items"]) <= 10
        assert all("id" in item and "query" in item for item in data["items"])  # shape check

    def test_get_queries_with_filters(self, client, populated_db_connection):
        now = datetime.now(timezone.utc)
        start = (now - timedelta(hours=1)).isoformat()
        end = (now + timedelta(minutes=5)).isoformat()

        resp = client.get(
            "/v1/insights/queries",
            params={
                "start_date": start,
                "end_date": end,
                "agent_id": "cairo-coder",
                "limit": 100,
                "offset": 0,
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] >= 1
        assert all(item["agent_id"] == "cairo-coder" for item in data["items"])

    def test_get_queries_not_found(self, client, populated_db_connection):
        now = datetime.now(timezone.utc)
        start = (now - timedelta(days=10)).isoformat()
        end = (now - timedelta(days=9)).isoformat()

        resp = client.get(
            "/v1/insights/queries",
            params={"start_date": start, "end_date": end, "limit": 100, "offset": 0},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 0
        assert data["items"] == []

    def test_get_queries_validation_error(self, client):
        # Missing start_date
        resp = client.get("/v1/insights/queries", params={"end_date": datetime.now(timezone.utc).isoformat()})
        assert resp.status_code == 422

    async def test_trigger_analysis_success(self, client, test_db_pool, mock_analysis_runner, populated_db_connection):
        now = datetime.now(timezone.utc)
        payload = {
            "start_date": (now - timedelta(hours=6)).isoformat(),
            "end_date": now.isoformat(),
            "agent_id": None,
        }

        resp = client.post("/v1/insights/analyze", json=payload)
        assert resp.status_code == 202
        body = resp.json()
        assert "analysis_id" in body and "status" in body

        analysis_id = UUID(body["analysis_id"])  # validate UUID format

        async def _get_status():
            async with test_db_pool.acquire() as conn:
                row = await conn.fetchrow("SELECT status, analysis_result FROM query_analyses WHERE id = $1", analysis_id)
                return (row["status"], row["analysis_result"]) if row else (None, None)

        # Confirm job record exists (may already be completed on fast paths)
        status, result = await _get_status()
        assert status in {"pending", "completed"}

        # Wait for background task to complete
        for _ in range(50):  # ~2.5s
            status, result = await _get_status()
            if status == "completed":
                break
            await asyncio.sleep(0.05)

        assert status == "completed"
        if isinstance(result, str):
            result = _json.loads(result)
        assert isinstance(result, dict)
        assert "count" in result

    async def test_trigger_analysis_failure(self, client, test_db_pool, monkeypatch):
        # Configure the patched runner to raise an error for this test
        import cairo_coder.server.insights_api as insights_module

        def _raise(_queries):
            raise RuntimeError("boom")

        monkeypatch.setattr(insights_module, "run_analysis_from_queries", _raise)

        now = datetime.now(timezone.utc)
        payload = {
            "start_date": (now - timedelta(hours=6)).isoformat(),
            "end_date": now.isoformat(),
            "agent_id": "cairo-coder",
        }

        resp = client.post("/v1/insights/analyze", json=payload)
        assert resp.status_code == 202
        analysis_id = resp.json()["analysis_id"]

        async def _get_status():
            async with test_db_pool.acquire() as conn:
                row = await conn.fetchrow("SELECT status, error_message FROM query_analyses WHERE id = $1", UUID(analysis_id))
                return (row["status"], row["error_message"]) if row else (None, None)

        # Wait for failure status
        status, err = None, None
        for _ in range(50):
            status, err = await _get_status()
            if status == "failed":
                break
            await asyncio.sleep(0.05)

        assert status == "failed"
        assert "boom" in err

    def test_list_analyses(self, client, populated_db_connection):
        resp = client.get("/v1/insights/analyses")
        assert resp.status_code == 200
        items = resp.json()
        assert isinstance(items, list)
        assert all("id" in it and "status" in it for it in items)

    async def test_get_single_analysis(self, client, populated_db_connection, test_db_pool):
        # Grab an existing analysis id
        async with test_db_pool.acquire() as conn:
            analysis_id = await conn.fetchval("SELECT id FROM query_analyses ORDER BY created_at DESC LIMIT 1")

        resp = client.get(f"/v1/insights/analyses/{analysis_id}")
        assert resp.status_code == 200
        data = resp.json()
        assert str(analysis_id) == data["id"]
        assert "status" in data

    def test_get_single_analysis_not_found(self, client):
        random_id = "00000000-0000-0000-0000-000000000001"
        resp = client.get(f"/v1/insights/analyses/{random_id}")
        assert resp.status_code == 404
        assert resp.json()["detail"] == "Analysis job not found"


class TestDataIngestion:
    async def test_chat_completion_logs_interaction_to_db(self, client, test_db_pool):
        # Make a non-streaming chat completion request
        payload = {
            "messages": [{"role": "user", "content": "Hello"}],
            "stream": False,
        }
        resp = client.post("/v1/chat/completions", json=payload)
        assert resp.status_code == 200

        # Poll DB until record appears
        count = 0
        for _ in range(50):
            async with test_db_pool.acquire() as conn:
                count = await conn.fetchval("SELECT COUNT(*) FROM user_interactions")
            if count >= 1:
                break
            await asyncio.sleep(0.05)

        assert count >= 1

        # Verify content matches request/response shape
        async with test_db_pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT agent_id, query, generated_answer
                FROM user_interactions
                ORDER BY created_at DESC LIMIT 1
                """
            )

        assert row["agent_id"] == "cairo-coder"
        assert row["query"] == "Hello"
        assert isinstance(row["generated_answer"], str) and len(row["generated_answer"]) > 0

    async def test_streaming_chat_completion_logs_interaction_to_db(self, client, test_db_pool):
        """
        Verify that a user interaction is logged after a streaming response is fully consumed.
        """
        payload = {
            "messages": [{"role": "user", "content": "Hello streaming"}],
            "stream": True,
        }
        # The `with` statement ensures the full request/response cycle completes
        with client.stream("POST", "/v1/chat/completions", json=payload) as response:
            assert response.status_code == 200
            # Consume the stream to trigger the background task at the end
            response.read()

        # Poll the database to wait for the background task to complete
        count = 0
        for _ in range(50):  # Wait up to ~2.5 seconds
            async with test_db_pool.acquire() as conn:
                count = await conn.fetchval("SELECT COUNT(*) FROM user_interactions")
            if count >= 1:
                break
            await asyncio.sleep(0.05)

        assert count >= 1, "Interaction was not logged for streaming request"

        # Verify the logged data
        async with test_db_pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT query, generated_answer
                FROM user_interactions
                ORDER BY created_at DESC LIMIT 1
                """
            )
        assert row["query"] == "Hello streaming"
        assert "Hello! I'm Cairo Coder" in row["generated_answer"]
