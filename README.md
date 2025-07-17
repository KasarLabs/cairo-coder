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

- [Credits](#credits)
- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [API Usage](#api-usage)
- [Architecture](#architecture)
- [Development](#development)
- [Contribution](#contribution)

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

## Installation

Using Docker is highly recommended for a streamlined setup. For instructions on running the legacy TypeScript backend, see [`README_LEGACY.md`](./README_LEGACY.md).

1.  **Clone the Repository**

    ```bash
    git clone https://github.com/KasarLabs/cairo-coder.git
    cd cairo-coder
    ```

2.  **Configure PostgreSQL Database**

    Cairo Coder uses PostgreSQL with pgvector. You must configure both the Docker container initialization and the application connection settings.

    **a. Database Container Initialization (`.env` file):**
    Create a `.env` file in the root directory with the following content. This is used by Docker to initialize the database on its first run.

    ```
    POSTGRES_USER="cairocoder"
    POSTGRES_PASSWORD="YOUR_SECURE_PASSWORD"
    POSTGRES_DB="cairocoder"
    ```

    **b. Application Connection Settings (`python/config.toml`):**
    Copy the sample configuration file and update it with your database credentials and API keys.

    ```bash
    cp python/sample.config.toml python/config.toml
    ```

    Now, edit `python/config.toml` with configuration for the vector database.

    ```toml
    # python/config.toml
    [VECTOR_DB]
    POSTGRES_USER="cairocoder"
    POSTGRES_PASSWORD="cairocoder"
    POSTGRES_DB="cairocoder"
    POSTGRES_HOST="localhost"
    POSTGRES_PORT="5455"
    POSTGRES_TABLE_NAME="documents"
    SIMILARITY_MEASURE="cosine"
    ```

3.  **Configure LangSmith (Optional but Recommended)**
    To monitor and debug LLM calls, configure LangSmith.

    - Create an account at [LangSmith](https://smith.langchain.com/) and create a project.
    - Add your LangSmith credentials to `python/.env`:
      ```yaml
      LANGSMITH_TRACING=true
      LANGSMITH_ENDPOINT="https://api.smith.langchain.com"
      LANGSMITH_API_KEY="lsv2..."
      ```

4.  **Run the Application**
    Start the database and the Python backend service using Docker Compose:
    ```bash
    docker compose up postgres python-backend --build
    ```
    The API will be available at `http://localhost:3001/v1/chat/completions`.

## Running the Ingester

The ingester processes documentation sources and populates the vector database. It runs as a separate service.

```bash
docker compose up ingester
```

Once the ingester completes, the database will be populated with embeddings from all supported documentation sources, making them available for the RAG pipeline.

## API Usage

Cairo Coder provides a simple REST API compatible with the OpenAI format for easy integration.

### Endpoint: `POST /v1/chat/completions`

### Request Format:

```bash
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "cairo-coder",
    "messages": [
      {
        "role": "user",
        "content": "How do I implement storage in Cairo?"
      }
    ]
  }'
```

For a full list of parameters and agent-specific endpoints, see the [API Documentation](./packages/backend/API_DOCUMENTATION.md).

## Architecture

Cairo Coder uses a modern architecture based on Retrieval-Augmented Generation (RAG) to provide accurate, functional Cairo code.

### Project Structure

The project is organized as a monorepo with multiple packages:

- **python/**: The core RAG agent and API server implementation using DSPy and FastAPI.
- **packages/ingester/**: (TypeScript) Data ingestion tools for Cairo documentation sources.
- **packages/typescript-config/**: Shared TypeScript configuration.
- **(Legacy)** `packages/agents` & `packages/backend`: The original TypeScript implementation.

### RAG Pipeline (Python/DSPy)

The RAG pipeline is implemented in the `python/src/cairo_coder/core/` directory and consists of several key DSPy modules:

1.  **QueryProcessorProgram**: Analyzes user queries to extract search terms and identify relevant documentation sources.
2.  **DocumentRetrieverProgram**: Retrieves relevant Cairo documentation from the vector database.
3.  **GenerationProgram**: Generates Cairo code and explanations based on the retrieved context.
4.  **RagPipeline**: Orchestrates the entire RAG process, chaining the modules together.

## Development

### Python Service

For local development of the Python service, navigate to `python/` and run the following commands`

1.  **Setup Environment**:
    ```bash
    # Install uv package manager
      curl -LsSf https://astral.sh/uv/install.sh | sh
    ```
2.  **Run Server**:
    ```bash
      uv run cairo-coder --dev
    ```
3.  **Run Tests & Linting**:
    ```bash
      uv run pytest
    ```

### Starklings Evaluation

A script is included to evaluate the agent's performance on the Starklings exercises.

```bash
# Run a single evaluation round
uv run starklings_evaluate
```

Results are saved in the `starklings_results/` directory.

## Contribution

We welcome contributions to Cairo Coder! Whether you're fixing bugs, improving documentation, adding new features, or expanding our knowledge base, your help is appreciated.
