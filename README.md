# Cairo Coder - AI-Powered Cairo Code Generator

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
  - [Database](#database)
- [Development](#development)
- [Upcoming Features](#upcoming-features)
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
- **Streaming Response**: Support for response streaming for a responsive experience


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
   - `ANTHROPIC`: Your Anthropic API key. **You only need to fill this if you wish to use Anthropic models**.
   - `SIMILARITY_MEASURE`: The similarity measure to use (This is filled by default; you can leave it as is if you are unsure about it.)
   - Models: The `[HOSTED_MODE]` table defines the underlying LLM model used. We recommend using:

   ```toml
      [HOSTED_MODE]
      DEFAULT_CHAT_PROVIDER = "anthropic"
      DEFAULT_CHAT_MODEL = "Claude 3.5 Sonnet"
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
   POSTGRES_ROOT_DB="YOUR_POSTGRES_ROOT_DB"
   POSTGRES_HOST="localhost"
   POSTGRES_PORT="5432"
   ```
   
   This file is used by Docker to initialize the PostgreSQL container when it first starts. 
   The `POSTGRES_HOST` is set to "localhost" because this is from the database's own perspective.

   **b. Application Connection Settings** (`config.toml` file):
   
   In the `packages/agents/config.toml` file, configure the database connection section:
   
   ```toml
    [VECTOR_DB]
    POSTGRES_USER="YOUR_POSTGRES_USER"
    POSTGRES_PASSWORD="YOUR_POSTGRES_PASSWORD"
    POSTGRES_ROOT_DB="YOUR_POSTGRES_ROOT_DB"
    POSTGRES_HOST="postgres"
    POSTGRES_PORT="5432"
   ```
   
   This configuration is used by the backend and ingester services to connect to the database.
   Note that `POSTGRES_HOST` is set to "postgres", which is the service name in docker-compose.yml.
   
   **Important:** Make sure to use the same password in both files. The first file initializes the
   database, while the second is used by your application to connect to it.


7. Run the application using one of the following methods:

   ```bash
   docker-compose up --build
   ```

8. The API will be available at http://localhost:3000/generate.

## Running the Ingester

After you have the main application running, you might need to run the ingester to process and embed documentation from various sources. The ingester is configured as a separate profile in the docker-compose file and can be executed as follows:

   ```bash
   docker-compose --profile ingester up ingester
   ```

Once the ingester completes its task, the vector database will be populated with embeddings from all the supported documentation sources, making them available for RAG-based code generation requests to the API.

## API Usage

Cairo Coder provides a simple REST API compatible with the OpenAI format for easy integration.

### Endpoint

```
POST /generate
```

### Request Format

```json
{
  "model": "gemini-2.0-flash",
  "messages": [
    {
      "role": "system",
      "content": "You are a Cairo programming expert."
    },
    {
      "role": "user",
      "content": "Write a Cairo contract that implements a simple ERC-20 token."
    }
  ],
  "temperature": 0.7,
}
```

### Response Format

```json
{
  "id": "gen-123456",
  "object": "chat.completion",
  "created": 1717273561,
  "model": "gemini-2.0-flash",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "#[starknet::contract]\nmod ERC20 {\n    // Contract code here...\n}"
      },
      "finish_reason": "stop"
    }
  ]
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

### Database

Cairo Coder uses MongoDB Atlas with vector search capabilities for similarity search:

- **Vector Database**: Stores document embeddings for efficient similarity search
- **Vector Search**: Uses cosine similarity to find relevant Cairo documentation

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
