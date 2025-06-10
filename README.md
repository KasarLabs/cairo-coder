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
  - [Endpoint](#endpoint)
  - [Request Format](#request-format)
  - [Response Format](#response-format)
- [Architecture](#architecture)
  - [Project Structure](#project-structure)
  - [RAG Pipeline](#rag-pipeline)
  - [Ingestion System](#ingestion-system)
- [Development](#development)
- [Contribution](#contribution)

## Credits

This project is based on [Starknet Agent](https://github.com/cairo-book/starknet-agent), an open-source AI search engine for the Starknet ecosystem. We've adapted and focused the technology to create a specialized tool for Cairo code generation. We're grateful for these initial contributions which provided a strong foundation for Cairo Coder.

## Overview

Cairo Coder is an intelligent code generation service that makes writing Cairo smart contracts and programs faster and easier than ever. It uses advanced Retrieval-Augmented Generation (RAG) to understand Cairo's syntax, patterns, and best practices, providing high-quality, functional Cairo code based on natural language descriptions.

## Features

- **Cairo Code Generation**: Transforms natural language requests into functional Cairo code
- **RAG-based Architecture**: Uses Retrieval-Augmented Generation to provide accurate, well-documented code
- **OpenAI Compatible API**: Interface compatible with the OpenAI API format for easy integration
- **Multiple LLM Support**: Works with OpenAI, Anthropic, and Google models
- **Source-Informed Generation**: Code is generated based on Cairo documentation, ensuring correctness


## Installation

There are mainly 2 ways of installing Cairo Coder - With Docker, Without Docker. Using Docker is highly recommended.

1. Ensure Docker is installed and running on your system.
2. Clone the Cairo Coder repository:

   ```bash
   git clone https://github.com/KasarLabs/cairo-coder.git
   ```

3. After cloning, navigate to the directory containing the project files.

   ```bash
   cd cairo-coder
   ```

4. Install dependencies:

   ```bash
   pnpm install
   ```


5. Inside the packages/agents package, copy the `sample.config.toml` file to a `config.toml`. For development setups, you need only fill in the following fields:

   - `OPENAI`: Your OpenAI API key. **You only need to fill this if you wish to use OpenAI's models**.
   - `GEMINI`: Your Gemini API key. **You only need to fill this if you wish to use Gemini models**.
   - `SIMILARITY_MEASURE`: The similarity measure to use (This is filled by default; you can leave it as is if you are unsure about it.)
   - Models: The `[PROVIDERS]` table defines the underlying LLM model used. We recommend using:

   ```toml
      [PROVIDERS]
      DEFAULT_CHAT_PROVIDER = "gemini"
      DEFAULT_CHAT_MODEL = "Gemini Flash 2.5"
      DEFAULT_FAST_CHAT_PROVIDER = "gemini"
      DEFAULT_FAST_CHAT_MODEL = "Gemini Flash 2.5"
      DEFAULT_EMBEDDING_PROVIDER = "openai"
      DEFAULT_EMBEDDING_MODEL = "Text embedding 3 large"
   ```

6. **Configure PostgreSQL Database**

   Cairo Coder uses PostgreSQL with pgvector for storing and retrieving vector embeddings. You need to configure both the database initialization and the application connection settings:

   **a. Database Container Initialization** (`.env` file):
   Create a `.env` file in the root directory with the following PostgreSQL configuration:

   ```
   POSTGRES_USER="YOUR_POSTGRES_USER"
   POSTGRES_PASSWORD="YOUR_POSTGRES_PASSWORD"
   POSTGRES_DB="YOUR_POSTGRES_DB"
   ```

   This file is used by Docker to initialize the PostgreSQL container when it first starts.

   **b. Application Connection Settings** (`config.toml` file):

   In the `packages/agents/config.toml` file, configure the database connection section:

   ```toml
    [VECTOR_DB]
    POSTGRES_USER="YOUR_POSTGRES_USER"
    POSTGRES_PASSWORD="YOUR_POSTGRES_PASSWORD"
    POSTGRES_DB="YOUR_POSTGRES_DB"
    POSTGRES_HOST="postgres"
    POSTGRES_PORT="5432"
   ```

   This configuration is used by the backend and ingester services to connect to the database.
   Note that `POSTGRES_HOST` is set to ```"postgres"``` and `POSTGRES_PORT` to ```"5432"```, which are the container's name and port in docker-compose.yml.

   **Important:** Make sure to use the same password, username and db's name in both files. The first file initializes the database, while the second is used by your application to connect to it.


7. **Configure LangSmith (Optional)**

   Cairo Coder can use LangSmith to record and monitor LLM calls. This step is optional but recommended for development and debugging.
   
   - Create an account at [LangSmith](https://smith.langchain.com/)
   - Create a new project in the LangSmith dashboard
   - Retrieve your API credentials
   - Create a `.env` file in the `packages/backend` directory with the following variables:
   ```
   LANGSMITH_TRACING=true
   LANGSMITH_ENDPOINT="https://api.smith.langchain.com"
   LANGSMITH_API_KEY="<your-api-key>"
   LANGCHAIN_PROJECT="<your-project-name>"
   ```
   - Add the `.env` in an env_file section in the backend service of the docker-compose.yml 

   With this configuration, all LLM calls and chain executions will be logged to your LangSmith project, allowing you to debug, analyze, and improve the system's performance.


9. Run the application using one of the following methods:

   ```bash
   docker compose up postgres backend
   ```

8. The API will be available at http://localhost:3001/v1/chat/completions

## Running the Ingester

After you have the main application running, you might need to run the ingester to process and embed documentation from various sources. The ingester is configured as a separate profile in the docker-compose file and can be executed as follows:

   ```bash
   docker compose up ingester
   ```

Once the ingester completes its task, the vector database will be populated with embeddings from all the supported documentation sources, making them available for RAG-based code generation requests to the API.

## API Usage

Cairo Coder provides a simple REST API compatible with the OpenAI format for easy integration.

### Endpoint

```
POST /v1/chat/completions
```

### Request Format

Example of a simple request:

```bash
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemini-2.5-flash",
    "messages": [
      {
        "role": "user",
        "content": "How do I implement storage in Cairo?"
      }
    ]
  }'
```

The API accepts all standard OpenAI Chat Completions parameters.

**Supported Parameters:**
- `model`: Model identifier (string)
- `messages`: Array of message objects with `role` and `content`
- `temperature`: Controls randomness (0-2, default: 0.7)
- `top_p`: Nucleus sampling parameter (0-1, default: 1)
- `n`: Number of completions (default: 1)
- `stream`: Enable streaming responses (boolean, default: false)
- `max_tokens`: Maximum tokens in response
- `stop`: Stop sequences (string or array)
- `presence_penalty`: Penalty for token presence (-2 to 2)
- `frequency_penalty`: Penalty for token frequency (-2 to 2)
- `logit_bias`: Token bias adjustments
- `user`: User identifier
- `response_format`: Response format specification


### Response Format

#### Standard Mode Response

```json
{
  "id": "chatcmpl-123456",
  "object": "chat.completion",
  "created": 1717273561,
  "model": "gemini-2.5-flash",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "#[starknet::contract]\nmod ERC20 {\n    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};\n    \n    #[storage]\n    struct Storage {\n        name: felt252,\n        symbol: felt252,\n        total_supply: u256,\n        balances: Map<ContractAddress, u256>,\n    }\n    // ... contract implementation\n}"
      },
      "logprobs": null,
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 45,
    "completion_tokens": 120,
    "total_tokens": 165
  }
}
```

## Architecture

Cairo Coder uses a modern architecture based on Retrieval-Augmented Generation (RAG) to provide accurate, functional Cairo code based on natural language descriptions.

### Project Structure

The project is organized as a monorepo with multiple packages:

- **packages/agents/**: Core RAG agent implementation
  - Contains the pipeline for processing queries, retrieving documents, and generating code
  - Implements the RAG pipeline in a modular, extensible way
- **packages/backend/**: Express server with API endpoints
  - Handles API endpoints for code generation requests
  - Manages configuration and environment settings
- **packages/ingester/**: Data ingestion tools for Cairo documentation sources
  - Uses a template method pattern with a `BaseIngester` abstract class
  - Implements source-specific ingesters for different documentation sources
- **packages/typescript-config/**: Shared TypeScript configuration

### RAG Pipeline

The RAG pipeline is implemented in the `packages/agents/src/core/pipeline/` directory and consists of several key components:

1. **Query Processor**: Processes user requests and prepares them for document retrieval
2. **Document Retriever**: Retrieves relevant Cairo documentation from the vector database
3. **Code Generator**: Generates Cairo code based on the retrieved documents
4. **RAG Pipeline**: Orchestrates the entire RAG process

### Ingestion System

The ingestion system is designed to be modular and extensible, allowing for easy addition of new documentation sources:

- **BaseIngester**: Abstract class that defines the template method pattern for ingestion
- **Source-specific Ingesters**: Implementations for different Cairo documentation sources
- **Ingestion Process**: Downloads, processes, and stores documentation in the vector database

Currently supported documentation sources include:

- Cairo Book
- Cairo Foundry documentation
- Cairo By Examples

## Development

For development, you can use the following commands:

- **Start Development Server**: `pnpm dev`
- **Build for Production**: `pnpm build`
- **Run Tests**: `pnpm turbo run test`
- **Generate Embeddings**: `pnpm generate-embeddings`
- **Generate Embeddings (Non-Interactive)**: `pnpm generate-embeddings:yes`
- **Clean package build files**: `pnpm clean`
- **Clean node_modules**: `pnpm clean:all`

To add a new documentation source:

1. Create a new ingester by extending the `BaseIngester` class
2. Implement the required methods for downloading and processing the documentation
3. Register the new ingester in the `IngesterFactory`
4. Update the configuration to include the new database

## Contribution

We welcome contributions to Cairo Coder! Whether you're fixing bugs, improving documentation, adding new features, or expanding our knowledge base, your help is appreciated.
