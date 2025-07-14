# Optimizers for Cairo Code Generation

Optimizers use AX-LLM's MiPRO to improve code generation and retrieval programs by refining prompts and selecting demonstrations from datasets.

## Tools and Scripts

- **optimize-generation.ts**: Runs MiPRO on the generation program.
  Command: `pnpm optimize-generation`

- **optimize-retrieval.ts**: Runs MiPRO on the retrieval program.
  Command: `pnpm optimize-retrieval`

- **generate-starklings-dataset.ts**: Generates dataset from Starklings exercises using vector search for context.
  Command: `pnpm generate-starklings-dataset`

## Setup

Prerequisites:

- PostgreSQL with pgvector running and documentation ingested: `docker compose up postgres` then `docker compose up ingester` - or ran locally.
- Git installed.
- GEMINI_API_KEY environment variable set.
- Scarb installed (v2.11.4+): `curl --proto '=https' --tlsv1.2 -sSf https://docs.swmansion.com/scarb/install.sh | sh`.

For local runs, update config.toml:

```toml
[VECTOR_DB]
POSTGRES_USER = "cairocoder"
POSTGRES_PASSWORD = "cairocoder"
POSTGRES_DB = "cairocoder"
POSTGRES_HOST = "localhost"
POSTGRES_PORT = "5455"
```

## Dataset Generation

The generator clones Starklings, parses exercises, retrieves/summarizes context from Cairo docs, and extracts solutions. Output: datasets/generation.dataset.ts.

Context summarization preserves code examples, syntax, and details while removing redundancy and useless tokens.

Troubleshooting:

- Database connection: Ensure PostgreSQL runs on port 5455 if accessed in docker or 5432 if accessed locally.
- No solution: Skipped automatically (normally, all exercises have solutions).
- Rate limits: Adjust batch size.

After generation, run optimization to evaluate code compilation.
