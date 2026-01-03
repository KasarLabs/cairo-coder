<div align="center">
  <img src="./cairo-coder.png" alt="Cairo Coder MCP Logo" width="300"/>

[![npm version](https://img.shields.io/npm/v/@kasarlabs/cairo-coder-api.svg)](https://www.npmjs.com/package/@kasarlabs/cairo-coder-api)
[![npm downloads](https://img.shields.io/npm/dm/@kasarlabs/cairo-coder-api.svg)](https://www.npmjs.com/package/@kasarlabs/cairo-coder-api)
[![GitHub stars](https://img.shields.io/github/stars/kasarlabs/cairo-coder.svg)](https://github.com/kasarlabs/cairo-coder/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

# Cairo Coder

The most powerful open-source [CairoLang](https://www.cairo-lang.org/) generator.

## Use Cairo Coder for Free

Cairo Coder is free to use up to a certain limit, hosted by Kasar Labs. You can use it either as an MCP that enhances your agentic tools, or as a standalone API. [Get an API Key now](https://www.cairo-coder.com/).

## Overview

Cairo Coder is an intelligent code generation service that makes writing Cairo smart contracts and programs faster and easier. It uses an advanced, optimizable Retrieval-Augmented Generation (RAG) pipeline built with DSPy to understand Cairo's syntax, patterns, and best practices.

### Features

- **Cairo Code Generation**: Transforms natural language requests into functional Cairo code
- **DSPy RAG Architecture**: Structured and optimizable RAG pipeline for accurate code generation
- **OpenAI Compatible API**: Drop-in replacement for OpenAI API format
- **Multi-LLM Support**: Works with OpenAI, Anthropic, Google Gemini, and other providers
- **Source-Informed Generation**: Code generated from up-to-date Cairo documentation
- **MCP Support**: Integration with agentic tools via [cairo-coder-mcp](https://github.com/KasarLabs/cairo-coder-mcp)

## Quick Start

### Using Docker (Recommended)

```bash
# Clone and configure
git clone https://github.com/KasarLabs/cairo-coder.git
cd cairo-coder
cp .env.example .env
# Edit .env with your API keys

# First time: populate vector database
docker compose up postgres ingester --build

# Run the service
docker compose up postgres backend --build
```

The API is available at `http://localhost:3001/v1/chat/completions`.

### API Usage

```bash
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "cairo-coder",
    "messages": [
      {"role": "user", "content": "How do I implement a counter contract in Cairo?"}
    ]
  }'
```

## Documentation

| Document                               | Description                                         |
| -------------------------------------- | --------------------------------------------------- |
| [API Reference](./docs/API.md)         | HTTP endpoints, request/response formats, streaming |
| [Architecture](./docs/ARCHITECTURE.md) | System design, RAG pipeline, project structure      |
| [CLAUDE.md](./CLAUDE.md)               | Agent instructions for development                  |

## Development

### Prerequisites

- Python 3.10+ with [uv](https://docs.astral.sh/uv/)
- [Bun](https://bun.sh/) for the ingester
- Docker for PostgreSQL

### Local Setup

```bash
# Start database
docker compose up postgres

# Setup Python backend
cd python
curl -LsSf https://astral.sh/uv/install.sh | sh
uv sync

# Run ingester (first time)
cd ../ingesters
bun install
bun run generate-embeddings:yes

# Start server
cd ../python
uv run cairo-coder --dev
```

### Running Tests

```bash
# Python tests
cd python
uv run pytest

# Ingester tests
cd ingesters
bun test
```

## Project Structure

```text
cairo-coder/
├── python/           # Python backend (FastAPI + DSPy RAG)
├── ingesters/        # TypeScript documentation ingester
├── docs/             # Documentation
└── docker-compose.yml
```

## Credits

This project is based on [Starknet Agent](https://github.com/cairo-book/starknet-agent), an open-source AI search engine for the Starknet ecosystem.

## Contributing

We welcome contributions! Whether you're fixing bugs, improving documentation, or adding new features, your help is appreciated.

## License

MIT License - see [LICENSE](./LICENSE) for details.
