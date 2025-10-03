import { DocumentSource, type BookChunk } from '../src/types';
import { type Document } from '@langchain/core/documents';

describe('StarknetDocsIngester', () => {
  it('should be refactored to use MDX format', () => {
    const {
      StarknetDocsIngester,
    } = require('../src/ingesters/StarknetDocsIngester');

    const ingester = new StarknetDocsIngester();

    // Check that it has the correct configuration
    expect(ingester).toBeDefined();
    // @ts-ignore - accessing protected property for testing
    expect(ingester.config).toEqual({
      repoOwner: 'starknet-io',
      repoName: 'starknet-docs',
      fileExtension: '.mdx',
      chunkSize: 4096,
      chunkOverlap: 512,
      baseUrl: 'https://docs.starknet.io',
      urlSuffix: '',
      useUrlMapping: true,
    });
    expect(ingester.source).toBe(DocumentSource.STARKNET_DOCS);
  });

  it('should extract title from frontmatter', () => {
    const {
      StarknetDocsIngester,
    } = require('../src/ingesters/StarknetDocsIngester');

    const ingester = new StarknetDocsIngester();

    // Test MDX content with frontmatter title
    const testContent = `---
title: "Setting up your environment"
---

Let's first set up a Rust project with S-two.

\`\`\`bash
$ cargo new stwo-example
\`\`\`

We need to specify the nightly Rust compiler to use S-two.

## Configuration

Some configuration details here.
`;

    // @ts-ignore - accessing private method for testing
    const result = ingester.extractFrontmatterAndProcess(testContent);

    expect(result.title).toBe('Setting up your environment');
    expect(result.content).not.toContain('---');
    expect(result.content).not.toContain('title:');
    expect(result.content).toContain("Let's first set up a Rust project");
  });

  it('should use frontmatter title for chunks without headers', () => {
    const {
      StarknetDocsIngester,
    } = require('../src/ingesters/StarknetDocsIngester');

    const ingester = new StarknetDocsIngester();

    // Test content with frontmatter but no markdown headers
    const testContent = `Let's first set up a Rust project with S-two.

\`\`\`bash
$ cargo new stwo-example
\`\`\`

We need to specify the nightly Rust compiler.`;

    // @ts-ignore - accessing private method for testing
    const chunks = ingester.createChunksFromPage(
      'learn/test-page',
      testContent,
      'https://docs.starknet.io/learn/test-page',
      'Setting up your environment',
    );

    expect(chunks).toBeDefined();
    expect(chunks.length).toBeGreaterThanOrEqual(1);

    // The first chunk should have the frontmatter title
    expect(chunks[0].metadata.title).toBe('Setting up your environment');
    expect(chunks[0].pageContent).toContain(
      "Let's first set up a Rust project",
    );
  });

  it('should combine frontmatter title with section headers', () => {
    const {
      StarknetDocsIngester,
    } = require('../src/ingesters/StarknetDocsIngester');

    const ingester = new StarknetDocsIngester();

    // Test content with both frontmatter title and section headers
    const processedContent = `Let's first set up a Rust project with S-two.

## Configuration

Some configuration details here.

## Dependencies

Add dependencies to your project.`;

    // @ts-ignore - accessing private method for testing
    const chunks: Document<BookChunk>[] = ingester.createChunksFromPage(
      'learn/test-page',
      processedContent,
      'https://docs.starknet.io/learn/test-page',
      'Setting up your environment',
    );

    expect(chunks).toBeDefined();
    expect(chunks.length).toBeGreaterThan(1);

    // The first chunk should use the frontmatter title
    const firstChunk = chunks[0]!;
    expect(firstChunk.metadata.title).toBe('Setting up your environment');

    // Subsequent chunks should have their section titles
    const configChunk = chunks.find(
      (chunk) => chunk.metadata.title === 'Configuration',
    );
    expect(configChunk).toBeDefined();

    const depsChunk = chunks.find(
      (chunk) => chunk.metadata.title === 'Dependencies',
    );
    expect(depsChunk).toBeDefined();
  });
});
