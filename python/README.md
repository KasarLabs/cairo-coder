# Cairo Coder Python Implementation

This is the Python implementation of Cairo Coder using the DSPy framework for structured AI programming.

## Overview

Cairo Coder is an AI-powered code generation service specifically designed for the Cairo programming language. It uses Retrieval-Augmented Generation (RAG) to transform natural language requests into functional Cairo smart contracts and programs.

## Features

- Multi-stage RAG pipeline with query processing, document retrieval, and code generation
- DSPy-based structured AI programming for optimizable prompts
- Support for multiple LLM providers (OpenAI, Anthropic, Google Gemini)
- PostgreSQL vector store integration for efficient document retrieval
- FastAPI microservice with WebSocket support for real-time streaming
- Agent-based architecture for specialized Cairo assistance

## Installation

```bash
cd python

# Install uv package manager (if not already installed)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install dependencies
uv sync
```

## Configuration

Cairo Coder uses environment variables for all sensitive configuration like API keys and database credentials. The `.env` file in the root directory is the single source of truth.

```bash
# From the root directory
# Create .env file with required environment variables
# See main README.md for required variables
```

## Running the Service

### Locally

1. Set the database host for local development:

```bash
export POSTGRES_HOST=localhost
```

2. Start the PostgreSQL database:

```bash
# From root directory
docker compose up postgres
```

3. (Optional) Fill the database:

```bash
# From root directory
cd ingesters
bun install
bun run generate-embeddings:yes
cd ..
```

4. Start the FastAPI server (from python directory):

```bash
cd python
uv run cairo-coder
```

Or with development mode (auto-reload):

```bash
cd python
uv run cairo-coder --dev
```

### Dockerized

All configuration is handled automatically via Docker Compose. From the root directory:

```bash
# First time setup
docker compose up postgres ingester --build

# Run the service
docker compose up postgres backend --build
```

4. Send a request to the server

```bash
 curl -X POST "http://localhost:3001/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Write a simple Cairo contract that implements a counter. Make it safe with library Openzeppelin"
      }
    ]
  }'
```

## Development

```bash
# Run tests
uv run pytest

# Run linting
trunk check --fix

# Type checking
uv run ty check
```

## Architecture

The Python implementation maintains the same RAG pipeline architecture as the TypeScript version:

1. **Query Processing**: Transforms user queries into search terms and identifies relevant resources
2. **Document Retrieval**: Searches the vector database and reranks results by similarity
3. **Answer Generation**: Generates Cairo code solutions using retrieved context

The service runs as a microservice that communicates with the TypeScript backend via HTTP/WebSocket.
