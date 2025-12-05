<div align="center">
  <img src="./cairo-coder.png" alt="Cairo Coder MCP Logo" width="300"/>

[![npm version](https://img.shields.io/npm/v/@kasarlabs/cairo-coder-api.svg)](https://www.npmjs.com/package/@kasarlabs/cairo-coder-api)
[![npm downloads](https://img.shields.io/npm/dm/@kasarlabs/cairo-coder-api.svg)](https://www.npmjs.com/package/@kasarlabs/cairo-coder-api)
[![GitHub stars](https://img.shields.io/github/stars/kasarlabs/cairo-coder.svg)](https://github.com/kasarlabs/cairo-coder/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

# Cairo Coder

The most powerful open-source [CairoLang](https://www.cairo-lang.org/) generator.

## Table of Contents <!-- omit in toc -->

- [Use Cairo Coder for Free](#use-cairo-coder-for-free)
- [Credits](#credits)
- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [API Usage](#api-usage)
- [Architecture](#architecture)
- [Development](#development)
- [Contribution](#contribution)

## Use Cairo Coder for Free

Cairo Coder is free to use up to a certain limit, hosted by Kasar Labs. You can use it either as an MCP that enhances your agentic tools, or as a standalone API. [Get an API Key now](https://www.cairo-coder.com/).

## Credits

This project is based on [Starknet Agent](https://github.com/cairo-book/starknet-agent), an open-source AI search engine for the Starknet ecosystem. We've adapted and focused the technology to create a specialized tool for Cairo code generation. We're grateful for these initial contributions which provided a strong foundation for Cairo Coder.

## Overview

Cairo Coder is an intelligent code generation service that makes writing Cairo smart contracts and programs faster and easier than ever. It uses an advanced, optimizable Retrieval-Augmented Generation (RAG) pipeline built with DSPy to understand Cairo's syntax, patterns, and best practices, providing high-quality, functional Cairo code based on natural language descriptions.

## Features

- **Cairo Code Generation**: Transforms natural language requests into functional Cairo code.
- **DSPy RAG Architecture**: Uses a structured and optimizable RAG pipeline for accurate, well-documented code.
- **OpenAI Compatible API**: Interface compatible with the OpenAI API format for easy integration.
- **Multi-LLM Support**: Works with OpenAI, Anthropic, Google Gemini, and other providers.
- **Source-Informed Generation**: Code is generated based on up-to-date Cairo documentation, ensuring correctness.
- **MCP Support**: Supports the MCP protocol for easy integration with Agentic tools. See [cairo-coder-mcp](https://github.com/KasarLabs/cairo-coder-mcp) for more information.

## Installation

Using Docker is highly recommended for a streamlined setup.

1.  **Clone the Repository**

    ```bash
    git clone https://github.com/KasarLabs/cairo-coder.git
    cd cairo-coder
    ```

2.  **Configure the Application**

    Copy the environment template and fill in your credentials:

    ```bash
    cp .env.example .env
    ```

    Edit the `.env` file with your credentials:

    - Database credentials (defaults provided above for local development)
    - LLM API keys (at least one required: `GEMINI_API_KEY` is recommended)
    - Optional: `XAI_API_KEY` for Grok search functionality
    - Optional: `LANGSMITH_*` variables for monitoring

3.  **Run the Ingester (First Time Setup)**

    The ingester populates the vector database with documentation:

    ```bash
    docker compose up postgres ingester --build
    ```

    Wait for the ingester to complete before proceeding.

4.  **Run the Application**

    Start the Cairo Coder service:

    ```bash
    docker compose up postgres backend --build
    ```

    The API will be available at `http://localhost:3001/v1/chat/completions`.

## API Usage

Cairo Coder provides a simple REST API compatible with the OpenAI format for easy integration.

### Endpoint: `POST /v1/chat/completions`

### Request Format

```bash
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "cairo-coder",
    "messages": [
      {
        "role": "user",
        "content": "How do I implement a counter contract in Cairo?"
      }
    ]
  }'
```

For a full list of parameters and agent-specific endpoints, see the [API Documentation](./API_DOCUMENTATION.md).

## Architecture

Cairo Coder uses a modern architecture based on Retrieval-Augmented Generation (RAG) to provide accurate, functional Cairo code.

### Project Structure

The project is organized as a monorepo with multiple components:

- **python/**: The core RAG agent and API server implementation using DSPy and FastAPI.
- **ingesters/**: (TypeScript/Bun) Data ingestion tools for Cairo documentation sources.
- **docker-compose.yml**: Orchestrates postgres, backend, and ingester services.

### RAG Pipeline (Python/DSPy)

The RAG pipeline is implemented in the `python/src/cairo_coder/core/` directory and consists of several key DSPy modules:

1.  **QueryProcessorProgram**: Analyzes user queries to extract semantic search queries and identify relevant documentation sources.
2.  **DocumentRetrieverProgram**: Retrieves relevant Cairo documentation from the vector database.
3.  **RetrievalJudge**: LLM-based judge that scores retrieved documents for relevance, filtering out low-quality results.
4.  **GenerationProgram**: Generates Cairo code and explanations based on the retrieved context.
5.  **RagPipeline**: Orchestrates the entire RAG process, chaining the modules together.

## Development

### Python Service

For local development of the Python service:

1.  **Setup Environment**:

    ```bash
    cd python

    # Install uv package manager (if not already installed)
    curl -LsSf https://astral.sh/uv/install.sh | sh

    # Install dependencies
    uv sync
    ```

2.  **Start Database** (from root directory):

    ```bash
    # From root directory
    docker compose up postgres
    ```

3.  **Run Ingester** (first time setup, from root directory):

    ```bash
    # From root directory
    cd ingesters
    bun install
    bun run generate-embeddings:yes
    cd ..
    ```

4.  **Run Server** (from python directory):

    ```bash
    cd python
    uv run cairo-coder --dev
    ```

5.  **Run Tests** (from python directory):
    ```bash
    cd python
    uv run pytest
    ```

### Starklings Evaluation

A script is included to evaluate the agent's performance on the Starklings exercises.

> Note: we recommend pre-warming the compilation cache by running `cd fixtures/runner_crate && scarb build` before running the evaluation.

```bash
# From python directory
cd python
uv run starklings_evaluate
```

Results are saved in the `python/starklings_results/` directory.

## Contribution

We welcome contributions to Cairo Coder! Whether you're fixing bugs, improving documentation, adding new features, or expanding our knowledge base, your help is appreciated.
