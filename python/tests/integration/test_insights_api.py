"""
Integration tests for the /v1/insights API endpoints.

These tests rely on an ephemeral Postgres database via testcontainers and run
by default. They are automatically skipped if Docker is unavailable.

To skip these tests explicitly, use: pytest -m "not db"
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timedelta, timezone

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

    def test_get_queries_with_text_filter(self, client, populated_db_connection):
        """Test that query_text parameter filters results by text contained in the query."""
        now = datetime.now(timezone.utc)
        start = (now - timedelta(hours=6)).isoformat()
        end = (now + timedelta(minutes=5)).isoformat()

        # First, get all queries to verify we have data
        resp_all = client.get(
            "/v1/insights/queries",
            params={"start_date": start, "end_date": end, "limit": 100, "offset": 0},
        )
        assert resp_all.status_code == 200
        all_data = resp_all.json()
        assert all_data["total"] >= 3

        # Filter by text that should match at least one query
        resp = client.get(
            "/v1/insights/queries",
            params={
                "start_date": start,
                "end_date": end,
                "query_text": "Hello",
                "limit": 100,
                "offset": 0,
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        # Should have fewer results than unfiltered
        assert data["total"] <= all_data["total"]
        # All returned items should contain the search text (case-insensitive)
        assert all("hello" in item["query"].lower() for item in data["items"])

    def test_get_queries_with_text_filter_no_match(self, client, populated_db_connection):
        """Test that query_text parameter returns empty results when no matches exist."""
        now = datetime.now(timezone.utc)
        start = (now - timedelta(hours=6)).isoformat()
        end = (now + timedelta(minutes=5)).isoformat()

        resp = client.get(
            "/v1/insights/queries",
            params={
                "start_date": start,
                "end_date": end,
                "query_text": "xyz_nonexistent_query_text_xyz",
                "limit": 100,
                "offset": 0,
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 0
        assert data["items"] == []

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

    def test_get_queries_without_dates(self, client, populated_db_connection):
        """Test that queries can be fetched without providing start/end dates."""
        resp = client.get("/v1/insights/queries", params={"limit": 100, "offset": 0})
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] >= 3
        assert len(data["items"]) >= 3
        # Verify items are ordered by created_at DESC (most recent first)
        if len(data["items"]) >= 2:
            for i in range(len(data["items"]) - 1):
                item_current = datetime.fromisoformat(data["items"][i]["created_at"])
                item_next = datetime.fromisoformat(data["items"][i + 1]["created_at"])
                assert item_current >= item_next

    def test_get_queries_without_dates_with_limit(self, client, populated_db_connection):
        """Test that limit works correctly when dates are not provided."""
        resp = client.get("/v1/insights/queries", params={"limit": 2, "offset": 0})
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] >= 3
        assert len(data["items"]) == 2

    def test_get_queries_without_dates_with_filters(self, client, populated_db_connection):
        """Test that other filters work when dates are not provided."""
        resp = client.get(
            "/v1/insights/queries",
            params={"agent_id": "cairo-coder", "limit": 100, "offset": 0},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] >= 1
        assert all(item["agent_id"] == "cairo-coder" for item in data["items"])

    def test_get_queries_with_conversation_id_filter(self, client, db_connection):
        """Test that queries can be filtered by conversation_id."""
        import asyncio
        import json as _json
        import uuid
        from datetime import datetime, timedelta, timezone

        now = datetime.now(timezone.utc)
        conv_id = "test-conversation-123"

        # Seed records with and without conversation_id
        async def seed():
            await db_connection.execute(
                """
                INSERT INTO user_interactions (id, created_at, agent_id, mcp_mode, conversation_id, chat_history, query, generated_answer)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8),
                       ($9, $10, $11, $12, $13, $14, $15, $16),
                       ($17, $18, $19, $20, $21, $22, $23, $24)
                """,
                uuid.uuid4(), now - timedelta(hours=2), "cairo-coder", False, conv_id, _json.dumps([]), "First msg", "Response 1",
                uuid.uuid4(), now - timedelta(hours=1), "cairo-coder", False, conv_id, _json.dumps([{"role": "user", "content": "First msg"}]), "Second msg", "Response 2",
                uuid.uuid4(), now - timedelta(minutes=30), "cairo-coder", False, None, _json.dumps([]), "Other msg", "Other response",
            )

        asyncio.get_event_loop().run_until_complete(seed())

        # Filter by conversation_id
        resp = client.get(
            "/v1/insights/queries",
            params={"conversation_id": conv_id, "limit": 100, "offset": 0},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 2
        assert all(item["conversation_id"] == conv_id for item in data["items"])

    def test_get_queries_returns_conversation_id(self, client, db_connection):
        """Test that conversation_id is included in the response."""
        import asyncio
        import json as _json
        import uuid
        from datetime import datetime, timezone

        now = datetime.now(timezone.utc)
        conv_id = "response-test-conv-456"

        async def seed():
            await db_connection.execute(
                """
                INSERT INTO user_interactions (id, created_at, agent_id, mcp_mode, conversation_id, chat_history, query, generated_answer)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                """,
                uuid.uuid4(), now, "cairo-coder", False, conv_id, _json.dumps([]), "Test query", "Test response",
            )

        asyncio.get_event_loop().run_until_complete(seed())

        resp = client.get("/v1/insights/queries", params={"limit": 100, "offset": 0})
        assert resp.status_code == 200
        data = resp.json()

        # Find our seeded record and verify conversation_id is present
        matching = [item for item in data["items"] if item.get("conversation_id") == conv_id]
        assert len(matching) == 1
        assert matching[0]["conversation_id"] == conv_id


class TestDataIngestion:
    async def test_chat_completion_logs_interaction_to_db(self, client, test_db_pool):
        # Make a non-streaming chat completion request
        payload = {
            "messages": [{"role": "user", "content": "Hello"}],
            "stream": False,
        }

        async with test_db_pool.acquire() as conn:
            initial_count = await conn.fetchval("SELECT COUNT(*) FROM user_interactions")

        resp = client.post("/v1/chat/completions", json=payload)
        assert resp.status_code == 200

        # Poll DB until record appears
        count = 0
        for _ in range(50):
            async with test_db_pool.acquire() as conn:
                count = await conn.fetchval("SELECT COUNT(*) FROM user_interactions")
            if count >= initial_count + 1:
                break
            await asyncio.sleep(0.05)

        assert count >= initial_count + 1

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

        async with test_db_pool.acquire() as conn:
            initial_count = await conn.fetchval("SELECT COUNT(*) FROM user_interactions")

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
            if count >= initial_count + 1:
                break
            await asyncio.sleep(0.05)

        assert count >= initial_count + 1, "Interaction was not logged for streaming request"

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
