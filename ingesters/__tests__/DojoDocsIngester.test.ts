import { describe, it, expect } from 'bun:test';
import { DojoDocsIngester } from '../src/ingesters/DojoDocsIngester';
import { DocumentSource } from '../src/types';

describe('DojoDocsIngester', () => {
  it('should be configured correctly for Dojo documentation', () => {
    const ingester = new DojoDocsIngester();

    // Check that it has the correct configuration
    expect(ingester).toBeDefined();
    // @ts-ignore - accessing config for testing purposes
    expect(ingester.config).toEqual({
      repoOwner: 'dojoengine',
      repoName: 'book',
      fileExtensions: ['.md', '.mdx'],
      chunkSize: 4096,
      chunkOverlap: 512,
      baseUrl: 'https://book.dojoengine.org',
      urlSuffix: '',
      useUrlMapping: true,
    });
    // @ts-ignore - accessing source for testing purposes
    expect(ingester.source).toBe(DocumentSource.DOJO_DOCS);
  });

  it('should have correct extract directory', () => {
    const ingester = new DojoDocsIngester();

    // @ts-ignore - accessing private method for testing
    const extractDir = ingester.getExtractDir();

    expect(extractDir).toBeDefined();
    expect(extractDir).toContain('dojo-docs');
  });

  it('should process markdown content correctly', () => {
    const ingester = new DojoDocsIngester();

    // Test markdown content
    const testContent = `## Getting Started

Dojo is a provable game engine and toolchain for building onchain games.

\`\`\`bash
$ sozo init my-game
\`\`\`

This command creates a new Dojo project.

## Installation

Install the required dependencies.`;

    // @ts-ignore - accessing private method for testing
    const chunks = ingester.createChunkFromPage('getting-started', testContent);

    expect(chunks).toBeDefined();
    expect(chunks.length).toBeGreaterThan(0);

    // Check that chunks have correct metadata
    const firstChunk = chunks[0];
    expect(firstChunk).toBeDefined();
    expect(firstChunk!.metadata.name).toBe('getting-started');
    expect(firstChunk!.metadata.source).toBe(DocumentSource.DOJO_DOCS);
    expect(firstChunk!.metadata.sourceLink).toContain(
      'https://book.dojoengine.org',
    );
  });

  it('should split content into multiple sections based on headers', () => {
    const ingester = new DojoDocsIngester();

    // Test content with multiple headers
    const processedContent = `## Introduction

Dojo is a provable game engine and toolchain for building onchain games.

## Installation

Install Dojo using the following command:

\`\`\`bash
$ curl -L https://install.dojoengine.org | bash
\`\`\`

## Configuration

Configure your Dojo project settings in the Scarb.toml file.`;

    // @ts-ignore - accessing private method for testing
    const chunks = ingester.createChunkFromPage(
      'getting-started',
      processedContent,
    );

    expect(chunks).toBeDefined();
    expect(chunks.length).toBeGreaterThanOrEqual(3);

    // Check that we have chunks for each section
    const titles = chunks.map((chunk) => chunk.metadata.title);
    expect(titles).toContain('Introduction');
    expect(titles).toContain('Installation');
    expect(titles).toContain('Configuration');
  });

  it('should sanitize code blocks correctly', () => {
    const ingester = new DojoDocsIngester();

    // Test content with code blocks
    const testContent = `## Example

Here's an example:

\`\`\`cairo
# This is a comment in code
fn main() {
    println!("Hello");
}
\`\`\`

That was the example.`;

    // @ts-ignore - accessing private method for testing
    const sanitized = ingester.sanitizeCodeBlocks(testContent);

    expect(sanitized).toBeDefined();
    expect(sanitized).toContain('```cairo');
    expect(sanitized).toContain('fn main()');
  });

  it('should generate correct URLs with useUrlMapping', () => {
    const ingester = new DojoDocsIngester();

    const testContent = `## Components

Components are the building blocks of your Dojo entities.`;

    // @ts-ignore - accessing private method for testing
    const chunks = ingester.createChunkFromPage(
      'core-concepts/entities',
      testContent,
    );

    expect(chunks).toBeDefined();
    expect(chunks.length).toBeGreaterThan(0);

    // All chunks should have the correct source link format
    chunks.forEach((chunk) => {
      expect(chunk.metadata.sourceLink).toContain(
        'https://book.dojoengine.org',
      );
      expect(chunk.metadata.sourceLink).toContain('core-concepts/entities');
      expect(chunk.metadata.source).toBe(DocumentSource.DOJO_DOCS);
    });
  });
});
