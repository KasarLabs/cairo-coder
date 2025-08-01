# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cairo Coder is an open-source Cairo language code generation service using Retrieval-Augmented Generation (RAG) with the DSPy framework. It transforms natural language requests into functional Cairo smart contracts and programs.

## Essential Commands

### Installation and Setup

- `curl -LsSf https://astral.sh/uv/install.sh | sh` - Install uv package manager
- `uv sync` - Install all dependencies
- `cp .env.example .env` - Set up environment variables (from root directory)

### Development

- `uv run cairo-coder` - Start the FastAPI server
- `uv run pytest` - Run all tests
- `uv run pytest tests/unit/test_query_processor.py::test_specific` - Run specific test
- `uv run pytest -k "test_name"` - Run tests matching pattern
- `uv run pytest --cov=src/cairo_coder` - Run tests with coverage
- `trunk check --fix` - Run linting and auto-fix issues
- `uv run ty check` - Run type checking

### Docker Operations

- `docker compose up postgres` - Start PostgreSQL database
- `docker compose up backend` - Start the API server
- `docker compose run ingester` - Run documentation ingestion

### Optimization and Evaluation

- `marimo run optimizers/generation_optimizer.py` - Run generation optimizer notebook
- `marimo run optimizers/rag_pipeline_optimizer.py` - Run full pipeline optimizer
- `uv run starklings_evaluate` - Evaluate against Starklings dataset
- `uv run cairo-coder-summarize <repo-url>` - Summarize documentation

## High-Level Architecture

### DSPy-Based RAG Pipeline

Cairo Coder uses a three-stage RAG pipeline implemented with DSPy modules:

1. **Query Processing** (`src/cairo_coder/dspy/query_processor.py`):

   - Uses `CairoQueryAnalysis` signature with ChainOfThought
   - Extracts search terms and identifies relevant documentation sources
   - Detects if query is contract/test related

2. **Document Retrieval** (`src/cairo_coder/dspy/document_retriever.py`):

   - Custom `SourceFilteredPgVectorRM` extends DSPy's retriever
   - Queries PostgreSQL with pgvector for similarity search
   - Supports source filtering and metadata extraction

3. **Answer Generation** (`src/cairo_coder/dspy/generation_program.py`):
   - `CairoCodeGeneration` signature for code synthesis
   - Streaming support via async generators
   - MCP mode for raw documentation retrieval

### Agent-Based Architecture

- **Agent Registry** (`src/cairo_coder/agents/registry.py`): Lightweight enum-based registry of available agents
- **Agent Factory** (`src/cairo_coder/core/agent_factory.py`): Creates agents from the registry with caching
- **Agents**: Two built-in agents - Cairo Coder (general purpose) and Scarb Assistant (Scarb-specific)
- **Pipeline Factory**: Creates optimized RAG pipelines loading from `optimizers/results/`

### FastAPI Server

- **OpenAI-Compatible API** (`src/cairo_coder/server/app.py`):
  - `/v1/chat/completions` - Legacy endpoint
  - `/v1/agents/{agent_id}/chat/completions` - Agent-specific
  - Supports streaming (SSE) and MCP mode via headers
- **Lifecycle Management**: Connection pooling, resource cleanup
- **Error Handling**: OpenAI-compatible error responses

### Optimization Framework

- **DSPy Optimizers**: MIPROv2 for prompt tuning
- **Datasets**: Generated from Starklings exercises
- **Metrics**: Code compilation success, relevance scores
- **Marimo Notebooks**: Reactive optimization workflows with MLflow tracking

## Development Guidelines

### Code Organization

- Follow DSPy patterns: Signatures → Modules → Programs
- Use dependency injection for testability (e.g., vector_db parameter)
- Prefer async/await for I/O operations
- Type hints required (enforced by mypy)

### Adding New Features

1. **New Agent**: Add an entry to `agents/registry.py` with `AgentId` enum and `AgentSpec` in the registry
2. **New DSPy Module**: Create signature, implement forward/aforward methods
3. **New Optimizer**: Create Marimo notebook, define metrics, use MIPROv2

### Configuration Management

- All configuration comes from environment variables (see `.env.example` in root)
- Agents are configured in the registry in `agents/registry.py`

## Important Notes

- Always load optimized programs from `optimizers/results/` in production
- Use `uv` for all dependency management (not pip/poetry)
- Structlog for JSON logging (`get_logger(__name__)`)
- DSPy tracks token usage via `lm.get_usage()`
- MLflow experiments logged to `mlruns/` directory

## Working with the test suite

This document provides guidelines for interacting with the Python test suite. Adhering to these patterns is crucial for maintaining a clean, efficient, and scalable testing environment.

### 1. Running Tests

All test commands should be run from the `python/` directory.

- **Run all tests:**

  ```bash
  uv run pytest
  ```

- **Run tests in a specific file:**

  ```bash
  uv run pytest tests/unit/test_rag_pipeline.py
  ```

- **Run a specific test by name (using `-k`):**
  ```bash
  uv run pytest -k "test_mcp_mode_pipeline_execution"
  ```

### 2. Test Architecture

The test suite is divided into two main categories:

- `tests/unit/`: For testing individual classes or functions in isolation. These tests should be fast and rely heavily on mocks to prevent external dependencies (like databases or APIs).
- `tests/integration/`: For testing how multiple components work together. This is primarily for testing the FastAPI server endpoints using `fastapi.testclient.TestClient`. These tests are slower and verify the contracts between different parts of the application.

### 3. The Golden Rule: `conftest.py` is King

**`python/tests/conftest.py` is the single source of truth for all shared fixtures, mocks, and test data.**

- **Before adding any new mock or helper, check `conftest.py` first.** It is highly likely a suitable fixture already exists.
- **NEVER define a reusable fixture in an individual test file.** All shared fixtures **must** reside in `conftest.py`. This is non-negotiable for maintainability.

### 4. Key Fixtures to Leverage

Familiarize yourself with these core fixtures defined in `conftest.py`. Use them whenever possible.

- `client`: An instance of `TestClient` for making requests to the FastAPI app in **integration tests**.
- `mock_agent`: A powerful, pre-configured mock of a RAG pipeline agent. It has mock implementations for `forward`, `aforward`, and `forward_streaming`.
- `mock_agent_factory`: A mock of the `AgentFactory` used in server tests to control which agent is created.
- `mock_vector_db`: A mock of `SourceFilteredPgVectorRM` for testing the document retrieval layer without a real database.
- `mock_lm`: A mock of a `dspy` language model for testing DSPy programs (`QueryProcessorProgram`, `GenerationProgram`) without making real API calls.
- `sample_documents`, `sample_processed_query`: Consistent, reusable data fixtures for your tests.

### 5. Guidelines for Adding & Modifying Tests

- **Adding a New Test File:**

  - If you are testing a single class's methods or a utility function, create a new file in `tests/unit/`.
  - If you are testing a new API endpoint or a flow that involves multiple components, add it to the appropriate file in `tests/integration/`.

- **Avoiding Code Duplication (DRY):**

  - If you find yourself writing several tests that differ only by their input values, you **must** use parametrization.
  - **Pattern:** Use `@pytest.mark.parametrize`. See `tests/unit/test_document_retriever.py` for a canonical example of how this is done effectively.

- **Adding New Mocks or Test Data:**

  - If the mock or data will be used in more than one test function, add it to `conftest.py` as a new fixture.
  - If it's truly single-use, you may define it within the test function itself, but be certain it won't be needed elsewhere.

- **Things to Be Careful About:**
  - **Fixture Dependencies:** Understand that some fixtures depend on others (e.g., `client` depends on `mock_agent_factory`). Modifying a base fixture can have cascading effects on tests that use dependent fixtures.
  - **Unit vs. Integration Mocks:** Do not use `TestClient` (`client` fixture) in unit tests. Unit tests should mock the direct dependencies of the class they are testing, not the entire application.
  - **Removing Tests:** Only remove tests for code that has been removed. If you are refactoring, ensure that the new tests provide equivalent or better coverage than the ones being replaced. The recent refactoring that merged `test_server.py` into `test_openai_server.py` and `test_server_integration.py` is a key example of this pattern.
