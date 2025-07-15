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
# Install uv package manager
curl -LsSf https://astral.sh/uv/install.sh | sh

# Create virtual environment
uv venv

# Install dependencies
uv pip install -e ".[dev]"
```

## Configuration

Copy `sample.config.toml` to `config.toml` and configure:

- LLM provider API keys
- Database connection settings
- Agent configurations

## Running the Service

```bash
# Start the FastAPI server
cairo-coder-api

# Or with uvicorn directly
uvicorn cairo_coder.api.server:app --reload
```

## Development

```bash
# Run tests
pytest

# Run linting
ruff check .

# Format code
black .

# Type checking
mypy .
```

## Architecture

The Python implementation maintains the same RAG pipeline architecture as the TypeScript version:

1. **Query Processing**: Transforms user queries into search terms and identifies relevant resources
2. **Document Retrieval**: Searches the vector database and reranks results by similarity
3. **Answer Generation**: Generates Cairo code solutions using retrieved context

The service runs as a microservice that communicates with the TypeScript backend via HTTP/WebSocket.
