# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

For information on how to work in the Python part of this project, see `python/CLAUDE.md`.

## Project Overview

Cairo Coder is an open-source Cairo language code generation service using Retrieval-Augmented Generation (RAG) to transform natural language requests into functional Cairo smart contracts and programs. It was adapted from the Starknet Agent project.

## Essential Commands

### Development

- `pnpm install` - Install dependencies (requires Node.js 20+ and pnpm 9+)
- `pnpm dev` - Start all services in development mode with hot reload
- `pnpm build` - Build all packages for production
- `pnpm clean` - Clean package build files
- `pnpm clean:all` - Clean all build files and node_modules

### Testing

- `pnpm test` - Run all tests across packages
- `pnpm --filter @cairo-coder/agents test` - Run tests for specific package
- `pnpm --filter @cairo-coder/agents test -- -t "test name"` - Run specific test
- `pnpm --filter @cairo-coder/backend check-types` - Type check specific package

### Documentation Ingestion

- `pnpm generate-embeddings` - Interactive ingestion of documentation sources
- `pnpm generate-embeddings:yes` - Non-interactive ingestion (for CI/CD)

### Docker Operations

- `docker compose up postgres backend` - Start main services
- `docker compose up ingester` - Run documentation ingestion

## High-Level Architecture

### Monorepo Structure

- **packages/agents**: Core RAG pipeline orchestrating query processing, document retrieval, and code generation
- **packages/backend**: Express API server providing OpenAI-compatible endpoints
- **packages/ingester**: Documentation processing system using template method pattern
- **packages/typescript-config**: Shared TypeScript configuration

### Key Design Patterns

1. **RAG Pipeline** (packages/agents/src/core/pipeline/):

   - `QueryProcessor`: Reformulates user queries for better retrieval
   - `DocumentRetriever`: Searches pgvector database using similarity measures
   - `AnswerGenerator`: Generates Cairo code from retrieved documents
   - `McpPipeline`: Special mode returning raw documents without generation

2. **Ingester System** (packages/ingester/src/ingesters/):

   - `BaseIngester`: Abstract class implementing template method pattern
   - Source-specific ingesters extend base class for each documentation source
   - Factory pattern (`IngesterFactory`) creates appropriate ingester instances

3. **Multi-Provider LLM Support**:
   - Configurable providers: OpenAI, Anthropic, Google Gemini
   - Provider abstraction in agents package handles model differences
   - Streaming and non-streaming response modes

### Configuration

- Copy `packages/agents/sample.config.toml` to `config.toml`
- Required configurations:
  - LLM provider API keys (OPENAI, GEMINI, ANTHROPIC)
  - Database connection in [VECTOR_DB] section
  - Model selection in [PROVIDERS] section
- Environment variables:
  - Root `.env`: PostgreSQL initialization (POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB)
  - `packages/backend/.env`: Optional LangSmith tracing configuration

### Database Architecture

- PostgreSQL with pgvector extension for vector similarity search
- Embedding storage for documentation chunks
- Configurable similarity measures (cosine, dot product, euclidean)

## Development Guidelines

### Code Organization

- Follow existing patterns in neighboring files
- Use dependency injection for testability
- Mock external dependencies (LLMs, databases) in tests
- Prefer editing existing files over creating new ones
- Follow template method pattern for new ingesters

### Testing Approach

- Jest for all testing
- Test files in `__tests__/` directories
- Mock LLM calls and database operations
- Test each ingester implementation separately
- Use descriptive test names explaining behavior

### Adding New Documentation Sources

1. Create new ingester extending `BaseIngester` in packages/ingester/src/ingesters/
2. Implement required abstract methods
3. Register in `IngesterFactory`
4. Update configuration if needed

### MCP (Model Context Protocol) Mode

- Special mode activated via `x-mcp-mode: true` header
- Returns raw documentation chunks without LLM generation
- Useful for integration with other tools needing Cairo documentation
