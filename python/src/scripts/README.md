# Cairo Coder Scripts

This directory contains the main CLI entrypoints for Cairo Coder workflows. All business logic has been moved to the `cairo_coder` library package for better maintainability and reusability.

## Available Commands

Cairo Coder provides three main CLI tools for different workflows:

### 1. `eval` - Evaluation Tool

Evaluate Cairo Coder's performance using various test suites.

```bash
# Run Starklings evaluation
uv run eval --runs 3 --output-dir ./results

# Evaluate specific category
uv run eval --category "intro" --max-concurrent 5

# Full options
uv run eval --help
```

**Key Features:**
- Evaluates Cairo Coder against Starklings exercises
- Generates detailed reports with success rates
- Supports concurrent evaluation for speed
- Configurable API endpoints and models

### 2. `ingest` - Data Ingestion Tool

Ingest documentation from various sources into a format suitable for the RAG pipeline.

```bash
# Ingest from a Git repository
uv run ingest from-git https://github.com/cairo-book/cairo-book \
    --type mdbook \
    --output cairo_book_summary.md

# Crawl a website using predefined target (automatically filters for 2025)
uv run ingest from-web starknet-blog-2025

# Or crawl manually with custom filter
uv run ingest from-web https://www.starknet.io/blog \
    --content-filter="2025" \
    --output starknet_blog_2025.md

# Fix markdown headers
uv run ingest fix-headers input.md --output output.md

# List available options
uv run ingest list-targets
uv run ingest list-types
```

**Key Features:**
- Git repository ingestion with LLM summarization
- Web crawling with filtering capabilities
- Support for mdbook and other documentation types
- Header fixing utilities for better formatting

### 3. `dataset` - Dataset Management Tool

Extract, generate, and analyze datasets for Cairo Coder.

```bash
# Extract QA pairs from LangSmith exports
uv run dataset extract starknet-agent \
    --input export.jsonl \
    --output qa_pairs.json

uv run dataset extract cairo-coder \
    --input traces.jsonl \
    --output pairs.json \
    --only-generated-answers

# Generate synthetic datasets
uv run dataset generate starklings \
    --output starklings_dataset.json

# Analyze a dataset with LLM
uv run dataset analyze \
    --input qa_pairs.json \
    --output analysis.json \
    --model "openrouter/x-ai/grok-4-fast:free"
```

**Key Features:**
- Extract QA pairs from various export formats
- Generate datasets from Starklings exercises
- LLM-powered dataset analysis
- De-duplication and filtering

## Architecture

The refactored architecture follows these principles:

1. **Separation of Concerns**: Business logic lives in `cairo_coder/`, scripts are just thin entrypoints
2. **Workflow-Oriented**: Commands are organized by workflow (eval, ingest, dataset) not by implementation
3. **Reusability**: All logic can be imported and used programmatically

### Directory Structure

```
python/src/
├── cairo_coder/              # Main library package
│   ├── dspy/                # DSPy RAG pipeline
│   ├── server/              # FastAPI server
│   ├── datasets/            # Dataset extractors (existing)
│   └── ...
├── cairo_coder_tools/       # Tools library package
│   ├── evals/               # Evaluation logic
│   │   └── starklings/      # Starklings evaluation suite
│   ├── ingestion/           # Data ingestion logic
│   │   ├── crawler.py       # Web crawler
│   │   └── ...              # Summarizers, etc.
│   └── datasets/            # Dataset analysis utilities
│       └── analysis.py      # LLM-based analysis
└── scripts/                 # CLI entrypoints only
    ├── eval.py             # Evaluation CLI
    ├── ingest.py           # Ingestion CLI
    └── dataset.py          # Dataset CLI
```

## Migration Guide

If you were using the old scripts, here's how to migrate:

| Old Command | New Command |
|------------|-------------|
| `uv run starklings_evaluate` | `uv run eval` |
| `uv run cairo-coder-summarize` | `uv run ingest from-git` |
| `uv run docs-crawler` | `uv run ingest from-web` |
| `uv run filter_2025_blogs` | `uv run ingest from-web starknet-blog-2025` |
| `uv run cairo-coder-datasets extract` | `uv run dataset extract` |
| `uv run cairo-coder-datasets generate` | `uv run dataset generate` |
| N/A | `uv run dataset analyze` (new!) |

## Getting Help

Each command has detailed help text:

```bash
uv run eval --help
uv run ingest --help
uv run dataset --help
```

For subcommands:

```bash
uv run ingest from-git --help
uv run dataset extract --help
```

## Development

To add new functionality:

1. Add the core logic to the appropriate module in `cairo_coder/`
2. Add a new subcommand or option to the relevant CLI in `scripts/`
3. Update this README

This keeps the codebase maintainable and testable.
