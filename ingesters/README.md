# Starknet Agent Ingester

The ingester package is responsible for downloading, processing, and storing documentation from various sources for the Starknet Agent. It transforms documentation into chunks that can be embedded and stored in a vector database for retrieval by the RAG (Retrieval-Augmented Generation) system.

## Table of Contents

- [Overview](#overview)
- [Supported Documentation Sources](#supported-documentation-sources)
- [Architecture](#architecture)
- [Usage](#usage)
- [Adding a New Documentation Source](#adding-a-new-documentation-source)
- [Development](#development)

## Overview

The ingester package follows a modular design with the following components:

- **Base Ingester**: An abstract class that defines the common interface for all ingesters
- **Source-specific Ingesters**: Implementations for each documentation source
- **Utility Functions**: Shared utilities for file processing, content manipulation, and vector store operations
- **Factory**: A factory class for creating ingesters based on the source

## Supported Documentation Sources

The ingester currently supports the following documentation sources:

1. **Cairo Book** (`cairo_book`): The Cairo programming language book
2. **Starknet Docs** (`starknet_docs`): Official Starknet documentation
3. **Starknet Foundry** (`starknet_foundry`): Documentation for the Starknet Foundry testing framework
4. **Cairo By Example** (`cairo_by_example`): Examples of Cairo programming
5. **OpenZeppelin Docs** (`openzeppelin_docs`): OpenZeppelin documentation for Starknet
6. **Core Library Docs** (`corelib_docs`): Cairo core library documentation
7. **Scarb Docs** (`scarb_docs`): Scarb package manager documentation
8. **StarknetJS Guides** (`starknet_js`): StarknetJS guides and tutorials
9. **Starknet Blog** (`starknet_blog`): Starknet blog posts and announcements

## Architecture

The ingester package follows a template method pattern with the following components:

### BaseIngester

The `BaseIngester` abstract class defines the common interface for all ingesters:

```typescript
abstract class BaseIngester {
  // Template method that defines the ingestion process
  public async ingest(vectorStore: VectorStore): Promise<void>;

  // Abstract methods that must be implemented by subclasses
  protected abstract downloadAndExtractDocs(): Promise<BookPageDto[]>;
  protected abstract createChunks(
    pages: BookPageDto[],
  ): Promise<Document<BookChunk>[]>;
  protected abstract cleanupDownloadedFiles(): Promise<void>;
  protected abstract parsePage(
    content: string,
    split: boolean,
  ): ParsedSection[];

  // Methods with default implementations that can be overridden
  protected async updateVectorStore(
    vectorStore: VectorStore,
    chunks: Document<BookChunk>[],
  ): Promise<void>;
  protected handleError(error: unknown): void;
}
```

### IngesterFactory

The `IngesterFactory` class creates the appropriate ingester based on the source:

```typescript
class IngesterFactory {
  public static createIngester(source: DocumentSource): BaseIngester;
  public static getAvailableSources(): DocumentSource[];
}
```

### Utility Functions

The package includes several utility modules:

- **fileUtils.ts**: Functions for file operations
- **contentUtils.ts**: Functions for content processing
- **vectorStoreUtils.ts**: Functions for vector store operations
- **types.ts**: Common types and interfaces

### Chunking: RecursiveMarkdownSplitter

The `RecursiveMarkdownSplitter` splits markdown content into semantic chunks with metadata (title, unique ID, character offsets, source link). It supports two modes:

- Default mode (size-aware):
  - Recursively splits by headers (configurable levels), paragraphs, and lines to target `maxChars`.
  - Merges tiny segments when below `minChars` and applies backward `overlap` between chunks.
  - Respects fenced code blocks and avoids splitting inside non-breakable blocks when possible.

Example usage:

```ts
import { RecursiveMarkdownSplitter } from './src/utils/RecursiveMarkdownSplitter';

// Default mode
const splitter = new RecursiveMarkdownSplitter({
  maxChars: 2048,
  minChars: 500,
  overlap: 256,
  headerLevels: [1, 2, 3],
});
const chunks = splitter.splitMarkdownToChunks(markdown);
```

## Usage

To use the ingester package, run the embeddings generator script:

```bash
# Preferred (direct bun):
bun run src/generateEmbeddings.ts
# Non-interactive (yes to prompts):
bun run src/generateEmbeddings.ts -y
```

This will prompt you to select a documentation source to ingest (or use `-y` for all). You can also select "Everything" to ingest all sources.

## Adding a New Documentation Source

To add a new documentation source:

1. Create a new ingester class that extends `BaseIngester`
2. Implement the required abstract methods
3. Add the new source to the `IngesterFactory`
4. Update the `DocumentSource` type in the agents package

Example:

```typescript
// 1. Create a new ingester class
export class NewSourceIngester extends BaseIngester {
  constructor() {
    const config: BookConfig = {
      // Configure the new source
    };
    super(config, 'new_source');
  }

  // Implement the required methods
  protected async downloadAndExtractDocs(): Promise<BookPageDto[]> {
    // Implementation
  }

  // ... other required methods
}

// 2. Add the new source to the IngesterFactory
case 'new_source':
  const { NewSourceIngester } = require('./ingesters/NewSourceIngester');
  return new NewSourceIngester();
```

## Development

### Prerequisites

- Node.js 18+
- pnpm or bun

### Setup

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build
```

### Testing

```bash
# Run tests
pnpm test
```
