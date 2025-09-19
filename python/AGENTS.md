# AGENTS & Testing Fixtures

This repo uses a unified, deterministic testing infrastructure to keep tests fast, reliable, and easy to extend. Use the shared fixtures instead of ad‑hoc mocks or local test classes.

## Quick Rules

- One shared fixture source for unit tests: `python/tests/conftest.py`
- Integration‑only fixtures live in: `python/tests/integration/conftest.py`
- One vector DB mock: `mock_vector_db`. Override FastAPI with:
  `server.app.dependency_overrides[get_vector_db] = lambda: mock_vector_db`
- One TestClient per scope:
  - Unit client uses `mock_agent_factory` and `mock_vector_db`.
  - Integration client injects a real `RagPipeline` wired to `mock_query_processor` + `mock_vector_db` (via the same `mock_agent_factory`).
- Replace ad‑hoc stubs with shared fixtures: `sample_processed_query`, `mock_query_processor`, `sample_documents`, and `mock_returned_documents` (built from `sample_documents`).

## DSPy/LLM Behavior

- Streaming: integration patches `dspy.streamify` to emit deterministic chunks (e.g., "Hello ", "world").
- Non‑streaming: generation programs return deterministic text in integration fixtures.
- Retrieval judge: pass‑through (or controlled) in tests to avoid external LLM calls.
- Deterministic LM usage: mocks return `get_lm_usage -> {}` by default. Assert API shapes, not token counts.

## Unit vs Integration

- Unit tests

  - Import from `python/tests/conftest.py`.
  - Use the unit `client` fixture.
  - Validate response shape, headers, error handling; set per‑test factory behavior via `side_effect` or `return_value`.

- Integration tests
  - Import from `python/tests/integration/conftest.py`.
  - Use the integration `client` fixture.
  - Exercise end‑to‑end paths (SSE streaming, MCP mode, multi‑turn) with real `RagPipeline` and mocked I/O.

## Avoid Over‑Mocking

- Do not create bespoke factories/classes in tests. Use `mock_agent_factory` and configure it per test.
- Do not duplicate document sets; use `sample_documents` and derive `mock_returned_documents` from it.
- Keep overrides minimal and local to the test.

## After Changes

1. Run `pytest python/tests/integration`
2. Run `pytest python/tests/unit`
3. Fix fallout; keep fixtures deterministic.
4. If you add an agent/pipeline, update this file with how to inject/mock it in tests.
