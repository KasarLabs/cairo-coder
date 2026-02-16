# CLAUDE.md

Agent instructions for working with Cairo Coder.

## Project Overview

Cairo Coder is a Cairo language code generation service using RAG (Retrieval-Augmented Generation) with DSPy.

**Stack:** Python/FastAPI backend, TypeScript/Bun ingester, PostgreSQL/pgvector database.

## Essential Commands

### Python Backend (from `python/` directory)

```bash
# Setup
curl -LsSf https://astral.sh/uv/install.sh | sh
uv sync

# Run server
uv run cairo-coder              # Start FastAPI server
uv run cairo-coder --dev        # Development mode with auto-reload

# Testing
uv run pytest                   # Run all tests
uv run pytest -k "test_name"    # Run specific test
uv run pytest --cov=src/cairo_coder  # With coverage

# Linting & Type Checking
trunk check --fix               # Lint and auto-fix
uv run ty check                 # Type checking
```

### Ingester (from `ingesters/` directory)

```bash
# Setup
bun install

# Run ingestion
bun run generate-embeddings      # Interactive
bun run generate-embeddings:yes  # Non-interactive (CI/CD)

# Testing
bun test
```

### Docker

```bash
# From root directory
docker compose up postgres backend   # Start services
docker compose up postgres ingester  # Run ingestion
```

## Key File Locations

| Component          | Location                                    |
| ------------------ | ------------------------------------------- |
| RAG Pipeline       | `python/src/cairo_coder/dspy/`              |
| Agent Registry     | `python/src/cairo_coder/agents/registry.py` |
| API Server         | `python/src/cairo_coder/server/app.py`      |
| Core Types         | `python/src/cairo_coder/core/types.py`      |
| Ingesters          | `ingesters/src/ingesters/`                  |
| Ingester Types     | `ingesters/src/types/index.ts`              |
| Optimized Programs | `python/optimizers/results/`                |

## Development Guidelines

### Python

- Use `uv` for all dependency management (not pip/poetry)
- Follow DSPy patterns: Signatures -> Modules -> Programs
- Type hints required (enforced by mypy)
- Use structlog for logging: `get_logger(__name__)`
- Async/await for I/O operations

### TypeScript/Ingester

- Bun runs TypeScript directly (no compilation step)
- Use path utilities: `getRepoPath()`, `getTempDir()`, `getPythonPath()`
- Never hardcode absolute paths
- Follow template method pattern for new ingesters

### Testing (Python)

- **Unit tests**: `tests/unit/` - Mock dependencies, fast
- **Integration tests**: `tests/integration/` - Use TestClient, test full flows
- **Fixtures**: All shared fixtures in `tests/conftest.py`
- Never duplicate fixtures in test files

Key fixtures: `client`, `mock_agent`, `mock_vector_db`, `mock_lm`, `sample_documents`

Always run tests before committing.

### Lint and formatting

Lints are managed by the Trunk tool, that can be run with `trunk check --fix`. Always lint and format before committing.

## Adding a New Documentation Source

1. **Ingester** (`ingesters/src/ingesters/`):

   - Create class extending `BaseIngester`
   - Implement: `downloadAndExtractDocs()`, `createChunks()`, `getExtractDir()`, `parsePage()`
   - Register in `IngesterFactory.createIngester()`

2. **Types**:

   - Add to `DocumentSource` enum in `ingesters/src/types/index.ts`
   - Add to `DocumentSource` enum in `python/src/cairo_coder/core/types.py`

3. **Query Processor**:

   - Update `RESOURCE_DESCRIPTIONS` in `python/src/cairo_coder/dspy/query_processor.py`

4. **Optimized Programs** (if applicable):

   - Update `python/optimizers/results/*.json` if prompts reference sources

5. **Run ingestion**:
   ```bash
   cd ingesters && bun run generate-embeddings
   ```

## Configuration

Environment variables in `.env` (root directory):

**Required:**

- `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- `OPENAI_API_KEY` - For embeddings

**Optional:**

- `ANTHROPIC_API_KEY`, `GEMINI_API_KEY` - Alternative LLM providers
- `LANGSMITH_API_KEY` - Tracing
- `XAI_API_KEY` - Grok search

## Common Tasks

### Fix a failing test

1. Run `uv run pytest -k "test_name" -v` to see failure details
2. Check fixtures in `tests/conftest.py` if mocking issues
3. Run `trunk check --fix` before committing

### Debug RAG pipeline

1. Enable tracing with `LANGSMITH_API_KEY`
2. Check `python/src/cairo_coder/dspy/` for pipeline logic
3. Use `uv run cairo-coder --dev` for hot reload during debugging

### Add a new LLM provider

1. Add API key to Configuration section above
2. Update agent registry in `python/src/cairo_coder/agents/registry.py`
3. Test with `uv run pytest -k "agent"`

## Constraints

- **Never use pip/poetry** - always use `uv` for Python dependencies
- **Never hardcode paths** in ingesters - use `getRepoPath()`, `getTempDir()`, `getPythonPath()`
- **Never duplicate fixtures** - all shared fixtures belong in `tests/conftest.py`
- **Never commit without linting** - run `trunk check --fix` first
- **Never skip type hints** - enforced by mypy

## Common Issues

| Error                                   | Solution                                                 |
| --------------------------------------- | -------------------------------------------------------- |
| `ModuleNotFoundError`                   | Run `uv sync` from `python/` directory                   |
| Embedding failures                      | Check `OPENAI_API_KEY` is set in `.env`                  |
| `bun: command not found`                | Install Bun: `curl -fsSL https://bun.sh/install \| bash` |
| Database connection refused             | Run `docker compose up postgres`                         |
| `DocumentSource` not found after adding | Update both TS and Python enum files (see above)         |
| Tests pass locally but fail in CI       | Check for hardcoded paths or missing env vars            |

## Architecture Reference

See `docs/ARCHITECTURE.md` for detailed system design and diagrams.

## API Reference

See `docs/API.md` for HTTP endpoint documentation.


# takopi-smithers configuration

@TAKOPI_SMITHERS.md

Additional notes:
- Workflow file: .smithers/workflow.tsx
- Supervisor config: .takopi-smithers/config.toml
