# Starknet Agent Development Guide

## Project Overview

Starknet Agent is an AI-powered search engine for the Starknet ecosystem using Retrieval-Augmented Generation (RAG) to provide accurate, source-cited answers about Starknet and Cairo.

## Commands

- Build: `pnpm build` (all packages), `pnpm --filter @starknet-agent/agents build` (specific package)
- Dev: `pnpm dev` (starts backend with auto-reload)
- Test: `pnpm --filter @starknet-agent/agents test` or `pnpm --filter @starknet-agent/backend test`
- Single test: `pnpm --filter @starknet-agent/agents test -- -t "test name pattern"`
- Type check: `pnpm --filter @starknet-agent/backend check-types`
- Generate embeddings: `pnpm generate-embeddings` or `pnpm generate-embeddings:yes` (skip prompts)

## Architecture

- **Monorepo Structure**:
  - `packages/agents`: Core RAG pipeline (query processing, retrieval, answer generation)
  - `packages/backend`: Express server with WebSocket support
  - `packages/ingester`: Documentation processing and vector embedding generation
  - `packages/ui`: Next.js frontend with real-time chat interface
- **RAG Pipeline Flow**:
  1. Query Processing: Analyzes and reformulates queries
  2. Document Retrieval: Vector search for relevant documents
  3. Answer Generation: LLM-generated responses with source citations

## Code Style

- Naming: `camelCase` for variables/functions, `PascalCase` for classes (with `Ingester` suffix for ingesters), `UPPER_CASE` for constants, `I`-prefixed interfaces (e.g., `IAgentConfig`)
- Formatting: 2 spaces indentation, 100 char line limit, Prettier for consistency
- Imports: Group external imports first, then internal modules
- Error handling: Use try/catch for async operations, log errors with context
- Types: Use explicit typing for function parameters and return values, prefer interfaces over types
- Comments: Use JSDoc for functions/classes, especially in agent pipeline and ingester components

## Testing

- Jest for all testing (`pnpm test`)
- Mock external dependencies, especially LLM and database calls
- Test pipeline components individually
- Test each ingester implementation separately
- Use jest-mock-extended for mocking complex dependencies

## Development Workflow

- MongoDB Atlas required for vector database
- Create config.toml from sample.config.toml before starting
- Use turbo for task orchestration
- Follow template method pattern for adding new ingesters
