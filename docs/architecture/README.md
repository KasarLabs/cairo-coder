# Starknet Agent's Architecture

Starknet Agent's architecture consists of the following key components:

## Core Components

1. **Backend Service**: The central server that handles API requests, WebSocket connections, and orchestrates the interaction between the UI and the agent system.

2. **Agent System**: A modular system that processes user queries, retrieves relevant information, and generates responses using RAG (Retrieval-Augmented Generation) techniques.

3. **Ingester**: Responsible for downloading, processing, and indexing content from various Starknet ecosystem resources into vector databases.

4. **UI**: A Next.js-based frontend that provides a chat interface for users to interact with the Starknet Agent.

## Technical Components

1. **RAG Pipeline**: The core information retrieval and response generation system that:

   - Processes and reformulates user queries
   - Retrieves relevant documents using vector search
   - Generates comprehensive responses with citations

2. **LLMs (Large Language Models)**: Used throughout the system for:

   - Query understanding and reformulation
   - Response generation
   - Source citation

3. **Vector Databases**: MongoDB Atlas with vector search capabilities stores embeddings of content chunks from various Starknet resources.

4. **Embedding Models**: Convert text into vector representations for similarity search, using models like OpenAI's text-embedding models.

## Package Structure

The project is organized into the following packages:

1. **backend**: Contains the server implementation, WebSocket handlers, and API routes.
2. **agents**: Implements the RAG pipeline, query processing, document retrieval, and answer generation.
3. **ingester**: Provides tools to download, process, and index content from Starknet ecosystem resources.
4. **ui**: Implements the user interface using Next.js and React.
5. **typescript-config**: Shared TypeScript configuration for the project.

## Focus Modes

Starknet Agent supports multiple focus modes, each targeting specific resources:

1. **Starknet Ecosystem**: Searches across all indexed Starknet resources.
2. **Cairo Book**: Focuses on the Cairo programming language book.
3. **Starknet Docs**: Concentrates on the official Starknet documentation.
4. **Starknet Foundry**: Targets the Starknet Foundry documentation.
5. **Cairo By Example**: Searches the Cairo By Example resource.

For a more detailed explanation of how these components work together, see [WORKING.md](https://github.com/cairo-book/starknet-agent/tree/master/docs/architecture/WORKING.md).
