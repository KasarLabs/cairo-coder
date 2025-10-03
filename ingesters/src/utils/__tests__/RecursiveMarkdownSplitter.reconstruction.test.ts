import { RecursiveMarkdownSplitter } from '../RecursiveMarkdownSplitter';

describe('RecursiveMarkdownSplitter - Reconstruction Tests', () => {
  /**
   * These tests verify that when we split a document and then concatenate
   * the chunks (excluding overlaps), we get back the original content.
   * This ensures our splitting logic doesn't lose or duplicate content.
   */

  function reconstructFromChunks(
    chunks: Array<{
      content: string;
      start: number;
      end: number;
      overlapStart?: number;
    }>,
    original: string,
  ): string {
    if (chunks.length === 0) return '';

    let result = '';
    let lastEnd = 0;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]!;

      if (i === 0) {
        // First chunk - use entire content
        result = original.substring(chunk.start, chunk.end);
        lastEnd = chunk.end;
      } else if (chunk.overlapStart !== undefined) {
        // Subsequent chunks with overlap - append only the non-overlapped portion
        result += original.substring(chunk.overlapStart, chunk.end);
        lastEnd = chunk.end;
      } else {
        // No overlap tracking - shouldn't happen but handle gracefully
        result += original.substring(lastEnd, chunk.end);
        lastEnd = chunk.end;
      }
    }

    return result;
  }

  describe('Header splitting reconstruction', () => {
    it('should reconstruct document with single header', () => {
      const splitter = new RecursiveMarkdownSplitter({
        maxChars: 50,
        minChars: 0,
        overlap: 10,
        headerLevels: [1],
        trim: false, // Important for exact reconstruction
      });

      const original = `# Header One
This is the first section with some content.

More content in the first section.`;

      const chunks = splitter.splitMarkdownToChunks(original);

      // Extract the raw chunks before metadata attachment
      const rawChunks = (splitter as any).assembleChunksWithOverlap(
        (splitter as any).mergeSmallSegments(
          (splitter as any).recursivelySplit(
            { start: 0, end: original.length },
            original,
            (splitter as any).tokenize(original),
          ),
          original,
          (splitter as any).tokenize(original).codeBlocks,
        ),
        original,
        (splitter as any).tokenize(original).codeBlocks,
      );

      const reconstructed = reconstructFromChunks(rawChunks, original);
      expect(reconstructed).toBe(original);
    });

    it('should reconstruct document with multiple headers at same level', () => {
      const splitter = new RecursiveMarkdownSplitter({
        maxChars: 60,
        minChars: 0,
        overlap: 15,
        headerLevels: [1],
        trim: false,
      });

      const original = `# First Section
Content for the first section goes here.

# Second Section
Content for the second section goes here.

# Third Section
Content for the third section goes here.`;

      const chunks = splitter.splitMarkdownToChunks(original);

      // Extract raw chunks
      const rawChunks = (splitter as any).assembleChunksWithOverlap(
        (splitter as any).mergeSmallSegments(
          (splitter as any).recursivelySplit(
            { start: 0, end: original.length },
            original,
            (splitter as any).tokenize(original),
          ),
          original,
          (splitter as any).tokenize(original).codeBlocks,
        ),
        original,
        (splitter as any).tokenize(original).codeBlocks,
      );

      const reconstructed = reconstructFromChunks(rawChunks, original);
      expect(reconstructed).toBe(original);
    });

    it('should reconstruct document with nested headers', () => {
      const splitter = new RecursiveMarkdownSplitter({
        maxChars: 80,
        minChars: 0,
        overlap: 20,
        headerLevels: [1, 2],
        trim: false,
      });

      const original = `# Main Section
Introduction to the main section.

## Subsection 1
Details about subsection 1.

## Subsection 2
Details about subsection 2.

# Another Main Section
Content for another main section.`;

      const chunks = splitter.splitMarkdownToChunks(original);

      const rawChunks = (splitter as any).assembleChunksWithOverlap(
        (splitter as any).mergeSmallSegments(
          (splitter as any).recursivelySplit(
            { start: 0, end: original.length },
            original,
            (splitter as any).tokenize(original),
          ),
          original,
          (splitter as any).tokenize(original).codeBlocks,
        ),
        original,
        (splitter as any).tokenize(original).codeBlocks,
      );

      const reconstructed = reconstructFromChunks(rawChunks, original);
      expect(reconstructed).toBe(original);
    });

    it('should reconstruct document with headers at start', () => {
      const splitter = new RecursiveMarkdownSplitter({
        maxChars: 40,
        minChars: 0,
        overlap: 10,
        headerLevels: [1],
        trim: false,
      });

      const original = `# Header at Start
Content immediately after header.

More content here.`;

      const chunks = splitter.splitMarkdownToChunks(original);

      const rawChunks = (splitter as any).assembleChunksWithOverlap(
        (splitter as any).mergeSmallSegments(
          (splitter as any).recursivelySplit(
            { start: 0, end: original.length },
            original,
            (splitter as any).tokenize(original),
          ),
          original,
          (splitter as any).tokenize(original).codeBlocks,
        ),
        original,
        (splitter as any).tokenize(original).codeBlocks,
      );

      const reconstructed = reconstructFromChunks(rawChunks, original);
      expect(reconstructed).toBe(original);
    });

    it('should reconstruct document with content before first header', () => {
      const splitter = new RecursiveMarkdownSplitter({
        maxChars: 50,
        minChars: 0,
        overlap: 10,
        headerLevels: [1],
        trim: false,
      });

      const original = `Some preamble text before any headers.

# First Header
Content under first header.

# Second Header
Content under second header.`;

      const chunks = splitter.splitMarkdownToChunks(original);

      const rawChunks = (splitter as any).assembleChunksWithOverlap(
        (splitter as any).mergeSmallSegments(
          (splitter as any).recursivelySplit(
            { start: 0, end: original.length },
            original,
            (splitter as any).tokenize(original),
          ),
          original,
          (splitter as any).tokenize(original).codeBlocks,
        ),
        original,
        (splitter as any).tokenize(original).codeBlocks,
      );

      const reconstructed = reconstructFromChunks(rawChunks, original);
      expect(reconstructed).toBe(original);
    });

    it('should reconstruct document with consecutive headers', () => {
      const splitter = new RecursiveMarkdownSplitter({
        maxChars: 60,
        minChars: 0,
        overlap: 10,
        headerLevels: [1, 2],
        trim: false,
      });

      const original = `# Main Header
## Subheader 1
## Subheader 2
Content after headers.

## Subheader 3
More content.`;

      const chunks = splitter.splitMarkdownToChunks(original);

      const rawChunks = (splitter as any).assembleChunksWithOverlap(
        (splitter as any).mergeSmallSegments(
          (splitter as any).recursivelySplit(
            { start: 0, end: original.length },
            original,
            (splitter as any).tokenize(original),
          ),
          original,
          (splitter as any).tokenize(original).codeBlocks,
        ),
        original,
        (splitter as any).tokenize(original).codeBlocks,
      );

      const reconstructed = reconstructFromChunks(rawChunks, original);
      expect(reconstructed).toBe(original);
    });
  });

  describe('Code block reconstruction', () => {
    it('should reconstruct document with code blocks', () => {
      const splitter = new RecursiveMarkdownSplitter({
        maxChars: 60,
        minChars: 0,
        overlap: 15,
        preserveCodeBlocks: true,
        trim: false,
      });

      const original = `# Section with Code
Some text before code.

\`\`\`python
def hello():
    print("Hello, World!")
\`\`\`

Text after code block.`;

      const chunks = splitter.splitMarkdownToChunks(original);

      const rawChunks = (splitter as any).assembleChunksWithOverlap(
        (splitter as any).mergeSmallSegments(
          (splitter as any).recursivelySplit(
            { start: 0, end: original.length },
            original,
            (splitter as any).tokenize(original),
          ),
          original,
          (splitter as any).tokenize(original).codeBlocks,
        ),
        original,
        (splitter as any).tokenize(original).codeBlocks,
      );

      const reconstructed = reconstructFromChunks(rawChunks, original);
      expect(reconstructed).toBe(original);
    });

    it('should reconstruct document with large code block', () => {
      const splitter = new RecursiveMarkdownSplitter({
        maxChars: 50,
        minChars: 0,
        overlap: 10,
        preserveCodeBlocks: true,
        trim: false,
      });

      const original = `# Code Example
Here's a large code block:

\`\`\`javascript
// This is a large code block that exceeds maxChars
function complexFunction() {
    const result = performCalculation();
    return result;
}
\`\`\`

Text after the code.`;

      const chunks = splitter.splitMarkdownToChunks(original);

      const rawChunks = (splitter as any).assembleChunksWithOverlap(
        (splitter as any).mergeSmallSegments(
          (splitter as any).recursivelySplit(
            { start: 0, end: original.length },
            original,
            (splitter as any).tokenize(original),
          ),
          original,
          (splitter as any).tokenize(original).codeBlocks,
        ),
        original,
        (splitter as any).tokenize(original).codeBlocks,
      );

      const reconstructed = reconstructFromChunks(rawChunks, original);
      expect(reconstructed).toBe(original);
    });
  });

  describe('Complex document reconstruction', () => {
    it('should reconstruct a complex markdown document', () => {
      const splitter = new RecursiveMarkdownSplitter({
        maxChars: 100,
        minChars: 20,
        overlap: 25,
        headerLevels: [1, 2],
        preserveCodeBlocks: true,
        trim: false,
      });

      const original = `# Cairo Programming Guide

Welcome to the Cairo programming guide. This document covers the basics.

## Getting Started

To get started with Cairo, you need to understand the fundamentals.

### Installation

First, install the Cairo compiler:

\`\`\`bash
curl -L https://github.com/starkware-libs/cairo/releases/download/v2.0.0/cairo-lang-2.0.0.tar.gz | tar xz
cd cairo-lang-2.0.0
./install.sh
\`\`\`

### Your First Program

Here's a simple Cairo program:

\`\`\`cairo
fn main() {
    let x = 1;
    let y = 2;
    assert(x + y == 3, 'Math is broken!');
}
\`\`\`

## Advanced Topics

Once you understand the basics, you can explore advanced features.

### Memory Management

Cairo uses a unique memory model based on field elements.

### Smart Contracts

You can write smart contracts in Cairo for StarkNet.

## Conclusion

Cairo is a powerful language for writing provable programs.`;

      const chunks = splitter.splitMarkdownToChunks(original);

      const rawChunks = (splitter as any).assembleChunksWithOverlap(
        (splitter as any).mergeSmallSegments(
          (splitter as any).recursivelySplit(
            { start: 0, end: original.length },
            original,
            (splitter as any).tokenize(original),
          ),
          original,
          (splitter as any).tokenize(original).codeBlocks,
        ),
        original,
        (splitter as any).tokenize(original).codeBlocks,
      );

      const reconstructed = reconstructFromChunks(rawChunks, original);
      expect(reconstructed).toBe(original);
    });
  });
});
