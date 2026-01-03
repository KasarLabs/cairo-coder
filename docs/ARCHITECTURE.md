# Cairo Coder Architecture

This document provides a high-level overview of Cairo Coder's architecture for developers and maintainers.

## Overview

Cairo Coder is an AI-powered code generation service for the Cairo programming language. It uses Retrieval-Augmented Generation (RAG) to transform natural language requests into functional Cairo smart contracts and programs.

## Technology Stack

| Component     | Technology                       | Purpose                                        |
| ------------- | -------------------------------- | ---------------------------------------------- |
| Backend       | Python 3.10+ with FastAPI        | API server and RAG pipeline                    |
| RAG Framework | DSPy                             | Structured prompt engineering and optimization |
| Ingester      | TypeScript/Bun                   | Documentation processing                       |
| Database      | PostgreSQL + pgvector            | Vector similarity search                       |
| LLM Providers | OpenAI, Anthropic, Google Gemini | Code generation                                |

## System Architecture

```text
                                    ┌─────────────────────┐
                                    │   Documentation     │
                                    │   Sources           │
                                    │  (Cairo Book, etc.) │
                                    └──────────┬──────────┘
                                               │
                                               ▼
┌─────────────────┐              ┌─────────────────────────┐
│    Ingester     │──────────────│      PostgreSQL         │
│  (TypeScript)   │   embed &    │      + pgvector         │
│                 │   store      │                         │
└─────────────────┘              └────────────┬────────────┘
                                              │
                                              │ retrieve
                                              ▼
┌─────────────────┐              ┌─────────────────────────┐
│     Client      │──────────────│    Python Backend       │
│   (API User)    │   HTTP/SSE   │    (FastAPI + DSPy)     │
└─────────────────┘              └────────────┬────────────┘
                                              │
                                              │ generate
                                              ▼
                                 ┌─────────────────────────┐
                                 │     LLM Provider        │
                                 │ (OpenAI/Anthropic/etc.) │
                                 └─────────────────────────┘
```

## RAG Pipeline

The core RAG pipeline consists of three stages:

```text
┌──────────────┐     ┌──────────────────┐     ┌────────────────┐
│    Query     │────▶│    Document      │────▶│   Generation   │
│  Processing  │     │   Retrieval      │     │    Program     │
└──────────────┘     └──────────────────┘     └────────────────┘
       │                      │                       │
       ▼                      ▼                       ▼
  Extract search        Query pgvector          Generate Cairo
  terms & identify      for similar docs        code with context
  relevant sources
```

### 1. Query Processing (`dspy/query_processor.py`)

- Analyzes user queries using DSPy's `ChainOfThought`
- Extracts semantic search queries
- Identifies relevant documentation sources
- Detects if query is contract/test related

### 2. Document Retrieval (`dspy/document_retriever.py`)

- Custom `SourceFilteredPgVectorRM` extends DSPy's retriever
- Queries PostgreSQL with pgvector for cosine similarity search
- Filters by documentation source
- Returns documents with metadata (title, URL, source)

### 3. Answer Generation (`dspy/generation_program.py`)

- Uses `CairoCodeGeneration` DSPy signature
- Generates Cairo code with explanations
- Supports streaming via async generators
- MCP mode returns raw documentation without LLM synthesis

## Project Structure

```text
cairo-coder/
├── python/                      # Python backend
│   ├── src/
│   │   ├── cairo_coder/
│   │   │   ├── agents/          # Agent registry
│   │   │   ├── core/            # Core types, config, RAG pipeline
│   │   │   ├── dspy/            # DSPy modules (query, retrieval, generation)
│   │   │   └── server/          # FastAPI application
│   │   └── scripts/             # CLI utilities
│   ├── tests/                   # Test suite
│   └── optimizers/              # DSPy optimization notebooks
│
├── ingesters/                   # TypeScript ingester
│   ├── src/
│   │   ├── ingesters/           # Source-specific ingesters
│   │   ├── db/                  # Vector store operations
│   │   ├── config/              # Settings
│   │   ├── types/               # TypeScript types
│   │   └── utils/               # Utilities (paths, markdown splitting)
│   └── __tests__/               # Bun tests
│
├── docs/                        # Documentation
└── docker-compose.yml           # Container orchestration
```

## Agent System

Agents are lightweight configurations that customize the RAG pipeline:

```python
# python/src/cairo_coder/agents/registry.py

class AgentId(str, Enum):
    CAIRO_CODER = "cairo-coder"
    STARKNET = "starknet-agent"

registry: dict[AgentId, AgentSpec] = {
    AgentId.CAIRO_CODER: AgentSpec(
        name="Cairo Coder",
        description="General Cairo programming assistant",
        sources=list(DocumentSource),  # All sources
        # ...
    ),
}
```

Each agent specifies:

- Name and description
- Documentation sources to search
- Pipeline builder with customizations
- Retrieval parameters (max sources, similarity threshold)

## Ingester System

The ingester downloads, chunks, and embeds documentation:

```text
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Download &    │────▶│   Chunk with    │────▶│   Embed &       │
│   Extract Docs  │     │   Metadata      │     │   Store         │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Design Patterns

1. **Template Method Pattern** (`BaseIngester`): Abstract class defining ingestion workflow
2. **Factory Pattern** (`IngesterFactory`): Creates appropriate ingester per source

### Adding a New Documentation Source

1. Create ingester extending `BaseIngester` in `ingesters/src/ingesters/`
2. Implement abstract methods:
   - `downloadAndExtractDocs()` - Fetch documentation
   - `createChunks()` - Split into searchable chunks
   - `getExtractDir()` - Temp storage location
   - `parsePage()` - Parse content into sections
3. Register in `IngesterFactory.createIngester()`
4. Add to `DocumentSource` enum in both:
   - `ingesters/src/types/index.ts`
   - `python/src/cairo_coder/core/types.py`
5. Update resource descriptions in `python/src/cairo_coder/dspy/query_processor.py`

## Database Schema

PostgreSQL with pgvector extension stores document embeddings:

| Column      | Type         | Description                               |
| ----------- | ------------ | ----------------------------------------- |
| `id`        | UUID         | Primary key                               |
| `content`   | TEXT         | Document text                             |
| `embedding` | VECTOR(1536) | OpenAI text-embedding-3-large             |
| `metadata`  | JSONB        | title, sourceLink, source, uniqueId, etc. |

Similarity search uses cosine distance:

```sql
SELECT * FROM documents
ORDER BY embedding <=> $query_embedding
LIMIT 10;
```

## Optimization Framework

DSPy enables automatic prompt optimization:

1. **Dataset**: Generated from Starklings exercises
2. **Metrics**: Code compilation success, relevance scores
3. **Optimizer**: MIPROv2 for few-shot prompt tuning
4. **Notebooks**: Marimo reactive notebooks with MLflow tracking

Optimized programs are saved to `python/optimizers/results/` and loaded in production.

## Configuration

All configuration via environment variables (`.env` in root):

**Required:**

- `POSTGRES_*` - Database credentials
- `OPENAI_API_KEY` - For embeddings (required) and LLM (optional)

**Optional:**

- `ANTHROPIC_API_KEY` - Anthropic Claude models
- `GEMINI_API_KEY` - Google Gemini models
- `LANGSMITH_API_KEY` - Tracing/observability
- `XAI_API_KEY` - Grok search functionality
