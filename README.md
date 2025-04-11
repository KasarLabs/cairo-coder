# 🚀 Starknet Agent - An AI-powered search engine for the Starknet Ecosystem 🔎 <!-- omit in toc -->

<!-- ![preview](.assets/perplexica-screenshot.png) -->

## Table of Contents <!-- omit in toc -->

- [Credits](#credits)
- [Overview](#overview)
- [Preview](#preview)
- [Features](#features)
- [Installation](#installation)
  - [Getting Started with Docker (Recommended)](#getting-started-with-docker-recommended)
- [Architecture](#architecture)
  - [Project Structure](#project-structure)
  - [RAG Pipeline](#rag-pipeline)
  - [Ingestion System](#ingestion-system)
  - [Database](#database)
  - [Real-time Communication](#real-time-communication)
- [Development](#development)
- [Upcoming Features](#upcoming-features)
- [Contribution](#contribution)

## Credits

This project was originally forked from [Perplexica](https://github.com/ItzCrazyKns/Perplexica), an open-source AI search engine. We've adapted and expanded upon their work to create a specialized tool for the Starknet ecosystem. We're grateful for their initial contribution which provided a base foundation for Starknet Agent.

## Overview

Starknet Agent is an open-source AI-powered searching tool specifically designed for the Starknet Ecosystem. It uses advanced Retrieval-Augmented Generation (RAG) to search and understand the Starknet documentation, Cairo Book, and other resources, providing clear and accurate answers to your queries about Starknet and Cairo.

## Preview

<!-- ![video-preview](.assets/perplexica-preview.gif) -->

## Features

- **RAG-based Search**: Uses Retrieval-Augmented Generation to provide accurate, source-cited answers to your questions.
- **Multiple Focus Modes**: Special modes to better answer specific types of questions:
  - **Starknet Ecosystem**: Searches the entire Starknet Ecosystem, including all resources below.
  - **Cairo Book**: Searches the [Cairo Book](https://book.cairo-lang.org) for answers.
  - **Starknet Docs**: Searches the [Starknet documentation](https://docs.starknet.io) for answers.
  - **Starknet Foundry**: Searches the [Starknet Foundry documentation](https://foundry-rs.github.io/starknet-foundry/) for answers.
  - **Cairo By Example**: Searches the Cairo By Example resource for answers.
  - **OpenZeppelin Docs**: Searches the OpenZeppelin documentation for Starknet-related information.
- **Source Citations**: All answers include citations to the source material, allowing you to verify the information.
- **Real-time Streaming**: Responses are streamed in real-time as they're generated.
- **Chat History**: Your conversation history is preserved for context in follow-up questions.
- **Modular Architecture**: Easily extensible to include additional documentation sources.

## Installation

There are mainly 2 ways of installing Starknet Agent - With Docker, Without Docker. Using Docker is highly recommended.

### Getting Started with Docker (Recommended)

1. Ensure Docker is installed and running on your system.
2. Clone the Starknet Agent repository:

   ```bash
   git clone https://github.com/cairo-book/starknet-agent.git
   ```

3. After cloning, navigate to the directory containing the project files.

4. Setup your database on [MongoDB Atlas](https://www.mongodb.com/products/platform/atlas-vector-search).

   - Create a new cluster.
   - Create a new database, e.g. `cairo-chatbot`.
   - Create a new collection inside the database that will store the embeddings. e.g. `chunks`.
   - Create a vectorSearch index named **default** on the collection (tab `Atlas Search`). Example index configuration:
     ```json
     {
       "fields": [
         {
           "numDimensions": 2048,
           "path": "embedding",
           "similarity": "cosine",
           "type": "vector"
         },
         {
           "path": "source",
           "type": "filter"
         }
       ]
     }
     ```

5. Inside the packages/backend package, copy the `sample.config.toml` file to a `config.toml`. For development setups, you need only fill in the following fields:

   - `OPENAI`: Your OpenAI API key. **You only need to fill this if you wish to use OpenAI's models**.
   - `ANTHROPIC`: Your Anthropic API key. **You only need to fill this if you wish to use Anthropic models**.

     **Note**: You can change these after starting Starknet Agent from the settings dialog.

   - `SIMILARITY_MEASURE`: The similarity measure to use (This is filled by default; you can leave it as is if you are unsure about it.)
   - Databases:
     - `VECTOR_DB`: This is the database for the entire Starknet Ecosystem, that aggregates all the other databases. You will need to fill this with your own database URL. example:
     ```toml
         [VECTOR_DB]
         MONGODB_URI = "mongodb+srv://mongo:..."
         DB_NAME = "cairo-chatbot"
         COLLECTION_NAME = "chunks"
     ```
   - Models: The `[HOSTED_MODE]` table defines the underlying LLM model used. We recommend using:

   ```toml
      [HOSTED_MODE]
      DEFAULT_CHAT_PROVIDER = "anthropic"
      DEFAULT_CHAT_MODEL = "Claude 3.5 Sonnet"
      DEFAULT_EMBEDDING_PROVIDER = "openai"
      DEFAULT_EMBEDDING_MODEL = "Text embedding 3 large"
   ```

6. Generate the embeddings for the databases. You can do this by running `turbo run generate-embeddings`. If you followed the example above, you will need to run the script with option `6 (Everything)` to generate embeddings for all the documentation sources.

   ```bash
   turbo run generate-embeddings
   ```

7. Run the development server with turbo.

   ```bash
   turbo dev
   ```

8. Wait a few minutes for the setup to complete. You can access Starknet Agent at http://localhost:3000 in your web browser.

**Note**: After the containers are built, you can start Starknet Agent directly from Docker without having to open a terminal.

## Architecture

Starknet Agent uses a modern architecture based on Retrieval-Augmented Generation (RAG) to provide accurate, source-cited answers to questions about Starknet and Cairo.

### Project Structure

The project is organized as a monorepo with multiple packages:

- **packages/agents/**: Core RAG agent implementation
  - Contains the pipeline for processing queries, retrieving documents, and generating answers
  - Implements the RAG pipeline in a modular, extensible way
- **packages/backend/**: Express server with WebSocket support
  - Handles API endpoints and WebSocket connections for real-time communication
  - Manages configuration and environment settings
- **packages/ui/**: Next.js frontend application
  - Provides a modern, responsive user interface
  - Implements real-time streaming of responses
- **packages/ingester/**: Data ingestion tools for documentation sources
  - Uses a template method pattern with a `BaseIngester` abstract class
  - Implements source-specific ingesters for different documentation sources
- **packages/typescript-config/**: Shared TypeScript configuration

### RAG Pipeline

The RAG pipeline is implemented in the `packages/agents/src/pipeline/` directory and consists of several key components:

1. **Query Processor**: Processes user queries and prepares them for document retrieval
2. **Document Retriever**: Retrieves relevant documents from the vector database
3. **Answer Generator**: Generates answers based on the retrieved documents
4. **RAG Pipeline**: Orchestrates the entire RAG process

### Ingestion System

The ingestion system is designed to be modular and extensible, allowing for easy addition of new documentation sources:

- **BaseIngester**: Abstract class that defines the template method pattern for ingestion
- **Source-specific Ingesters**: Implementations for different documentation sources
- **Ingestion Process**: Downloads, processes, and stores documentation in the vector database

Currently supported documentation sources:

- Cairo Book
- Starknet Docs
- Starknet Foundry
- Cairo By Example
- OpenZeppelin Docs

### Database

Starknet Agent uses MongoDB Atlas with vector search capabilities for similarity search:

- **Vector Database**: Stores document embeddings for efficient similarity search
- **Multiple Databases**: Separate databases for different focus modes
- **Vector Search**: Uses cosine similarity to find relevant documents

### Real-time Communication

The real-time communication system is implemented using WebSockets:

- **WebSocket Server**: Handles real-time communication between the frontend and backend
- **Message Handler**: Processes messages and manages the RAG pipeline
- **Connection Manager**: Manages WebSocket connections and sessions

## Development

For development, you can use the following commands:

- **Start Development Server**: `turbo dev`
- **Build for Production**: `turbo build`
- **Run Tests**: `turbo test`
- **Generate Embeddings**: `turbo generate-embeddings`
- **Generate Embeddings (Non-Interactive)**: `turbo generate-embeddings:yes`

To add a new documentation source:

1. Create a new ingester by extending the `BaseIngester` class
2. Implement the required methods for downloading and processing the documentation
3. Register the new ingester in the `IngesterFactory`
4. Update the configuration to include the new database

### Automated Embedding Generation

The project includes a GitHub Actions workflow that automatically generates embeddings:

- Runs weekly (Sunday at 00:00 UTC)
- Can be manually triggered from the GitHub Actions UI
- Uses repository secrets for configuration

For more information about the CI workflows, see the [GitHub Workflows README](.github/workflows/README.md).

## Upcoming Features

- [✅] Expanding coverage of Starknet-related resources
- [✅] Enhanced UI with more customization options
- [ ] Improved search algorithms for better document retrieval
- [ ] Adding an Autonomous Agent Mode for more precise answers

## Contribution

For more information on contributing to Starknet Agent, please read the [CONTRIBUTING.md](CONTRIBUTING.md) file to learn more about the project and how you can contribute to it.

We welcome contributions in the following areas:

- Adding new documentation sources
- Improving the RAG pipeline
- Enhancing the UI
- Adding new features
- Fixing bugs
- Improving documentation
