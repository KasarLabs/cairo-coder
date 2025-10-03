# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

For detailed Python backend information, see `python/CLAUDE.md`.

## Project Overview

Cairo Coder is an open-source Cairo language code generation service using Retrieval-Augmented Generation (RAG) to transform natural language requests into functional Cairo smart contracts and programs.

### Technology Stack

- **Backend**: Python with DSPy framework for RAG pipeline (`python/`)
- **Ingester**: TypeScript/Bun for documentation processing (`ingesters/`)
- **Database**: PostgreSQL with pgvector extension
- **Runtime**: Bun for ingester, uv for Python backend

## Essential Commands

### Documentation Ingestion

```bash
# Install dependencies
cd ingesters && bun install

# Run interactive ingestion
bun run generate-embeddings

# Non-interactive (CI/CD)
bun run generate-embeddings:yes

# Run tests
bun test
```

### Python Backend

```bash
cd python

# Setup
curl -LsSf https://astral.sh/uv/install.sh | sh
uv sync

# Development
uv run cairo-coder              # Start FastAPI server
uv run pytest                   # Run all tests
uv run pytest -k "test_name"   # Run specific test
```

### Docker Operations

```bash
docker compose up postgres backend  # Start main services
docker compose up ingester         # Run documentation ingestion
```

## Architecture Overview

### Python Backend (DSPy RAG Pipeline)

The core RAG pipeline is implemented in Python using DSPy:

1. **Query Processing** - Extracts search terms and identifies relevant sources
2. **Document Retrieval** - Queries pgvector for similar documentation chunks
3. **Answer Generation** - Generates Cairo code with streaming support

**Key Locations:**

- Pipeline: `python/src/cairo_coder/dspy/`
- Agents: `python/src/cairo_coder/agents/registry.py`
- Server: `python/src/cairo_coder/server/app.py`

### Ingester System (TypeScript/Bun)

Documentation processing system that downloads, chunks, and embeds documentation:

**Structure:**

```text
ingesters/
├── src/
│   ├── ingesters/        # Source-specific ingesters
│   ├── db/              # PostgreSQL vector store
│   ├── config/          # Settings and env management
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utilities including path resolution
├── __tests__/           # Bun test suite
└── package.json         # Bun scripts (no build step)
```

**Key Design Patterns:**

1. **Template Method Pattern** (`BaseIngester`):

   - Abstract class defining ingestion workflow
   - Subclasses implement source-specific logic
   - Consistent processing pipeline across all sources

2. **Factory Pattern** (`IngesterFactory`):

   - Creates appropriate ingester for each documentation source
   - Uses static imports for better testability and Bun compatibility

3. **Path Resolution** (`utils/paths.ts`):
   - Automatically finds repository root via `.git` directory
   - All paths relative to repo root (no hardcoded absolute paths)
   - `getRepoPath()`, `getPythonPath()`, `getTempDir()` utilities

### Database Architecture

- **PostgreSQL with pgvector**: Vector similarity search
- **Embedding Storage**: 1536-dimensional vectors (OpenAI text-embedding-3-large)
- **Schema**: Content, metadata, embeddings, source filtering
- **Similarity Measures**: Cosine similarity (default)

### Integration Flow

```text
Python Summarizer → Generated Markdown → Ingester → PostgreSQL → RAG Pipeline → Code Generation
     (python/)            (python/src/scripts/         (ingesters/)     (pgvector)    (python/)
                          summarizer/generated/)
```

## Configuration

All configuration via environment variables (`.env` in root):

**Required:**

- `POSTGRES_*` - Database credentials
- `OPENAI_API_KEY` - For embeddings and LLM

**Optional:**

- `ANTHROPIC_API_KEY`, `GEMINI_API_KEY` - Alternative LLM providers
- `LANGSMITH_API_KEY` - Tracing/observability

## Development Guidelines

### Ingester Development

**Code Organization:**

- Follow template method pattern for new ingesters
- Use path utilities for all file operations (`getRepoPath()`, `getTempDir()`, `getPythonPath()`)
- Prefer editing existing files over creating new ones
- No compilation step - Bun runs TypeScript directly

**Testing:**

- Bun test framework (Jest-compatible API)
- Tests in `__tests__/` directories
- Focus on behavior, not implementation details
- Run: `bun test`

**Adding New Documentation Sources:**

1. Create ingester extending `BaseIngester` in `ingesters/src/ingesters/`
2. Implement abstract methods:
   - `downloadAndExtractDocs()` - Fetch documentation
   - `createChunks()` - Split into searchable chunks
   - `getExtractDir()` - Use `getTempDir()` for temp storage
   - `parsePage()` - Parse content into sections
3. Register in `IngesterFactory.createIngester()`
4. Add to `DocumentSource` enum in `types/index.ts`

**Example:**

```typescript
export class MyDocsIngester extends BaseIngester {
  constructor() {
    super(config, DocumentSource.MY_DOCS);
  }

  protected getExtractDir(): string {
    const { getTempDir } = require("../utils/paths");
    return getTempDir("my-docs");
  }

  // Implement other abstract methods...
}
```

### Python Backend Development

See `python/CLAUDE.md` for comprehensive Python guidelines including:

- DSPy module patterns
- Agent registry system
- Optimization workflows
- Test suite architecture

### Path Resolution

**Always use path utilities** (never hardcode paths):

```typescript
import { getRepoPath, getPythonPath, getTempDir } from "../utils/paths";

// ✅ Good
const envPath = getRepoPath(".env");
const summaryPath = getPythonPath(
  "src",
  "scripts",
  "summarizer",
  "generated",
  "file.md",
);
const tempDir = getTempDir("my-ingester");

// ❌ Bad
const envPath = path.join(__dirname, "../../../.env");
const summaryPath = "/Users/user/project/python/...";
```

## Key Documentation Sources

Current ingested sources (see `DocumentSource` enum):

- Cairo Book
- Starknet Docs
- Starknet Foundry
- Cairo by Example
- OpenZeppelin Contracts
- Core Library (summarized)
- Scarb Docs
- Starknet.js

## MCP (Model Context Protocol) Mode

- Activated via `x-mcp-mode: true` HTTP header
- Returns raw documentation chunks without LLM generation
- Useful for integration with other tools needing Cairo documentation
- Supported in Python backend endpoints
