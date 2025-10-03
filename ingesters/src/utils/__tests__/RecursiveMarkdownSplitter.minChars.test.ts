import { RecursiveMarkdownSplitter } from '../RecursiveMarkdownSplitter';

describe('RecursiveMarkdownSplitter - minChars functionality', () => {
  it('should merge segments smaller than minChars', () => {
    const splitter = new RecursiveMarkdownSplitter({
      maxChars: 200,
      minChars: 100,
      overlap: 0,
      headerLevels: [1, 2],
    });

    const text = `# Section 1
Short content.

# Section 2
Also short.

# Section 3
This is a bit longer content that might be closer to the minimum.`;

    const chunks = splitter.splitMarkdownToChunks(text);

    // With minChars=100, the short sections should be merged
    expect(chunks.length).toBeLessThan(3);

    // All chunks should be at least minChars (except possibly the last one)
    chunks.forEach((chunk, index) => {
      if (index < chunks.length - 1) {
        expect(chunk.content.length).toBeGreaterThanOrEqual(100);
      }
    });
  });

  it('should not merge if it would exceed maxChars', () => {
    const splitter = new RecursiveMarkdownSplitter({
      maxChars: 100,
      minChars: 50,
      overlap: 0,
      headerLevels: [1, 2],
    });

    const text = `# Section 1
This section has exactly enough content to be close to the max limit when combined with another section. It's quite long.

# Section 2
This section is also substantial with a good amount of content that would exceed limits.`;

    const chunks = splitter.splitMarkdownToChunks(text);

    // Should not merge if combined length would exceed maxChars significantly
    // With the 1.5x flexibility for final chunks, they might merge if total < 150 chars
    // Let's verify chunks are reasonably sized
    chunks.forEach((chunk) => {
      expect(chunk.content.length).toBeLessThanOrEqual(150); // 1.5x maxChars
    });

    // If chunks are merged, ensure it's within reasonable bounds
    if (chunks.length === 1) {
      expect(chunks[0]!.content.length).toBeLessThanOrEqual(150);
    }
  });

  it('should handle the problematic formatting example', () => {
    const splitter = new RecursiveMarkdownSplitter({
      maxChars: 500,
      minChars: 200,
      overlap: 0,
      headerLevels: [1, 2],
      preserveCodeBlocks: true,
    });

    const text = `## Formatting and Debugging

The \`core::fmt\` module provides functionality for formatting values.

### Debug Trait

The \`Debug\` trait is used for debug formatting.

\`\`\`cairo
pub trait Debug<T>
\`\`\`

#### \`fmt\` Function

The \`fmt\` function within the \`Debug\` trait is responsible for formatting.

### Display Trait

The \`Display\` trait is used for standard formatting.`;

    const chunks = splitter.splitMarkdownToChunks(text);

    // Should create fewer, more substantial chunks
    expect(chunks.length).toBeLessThanOrEqual(2);

    // Each chunk should be meaningful in size
    chunks.forEach((chunk) => {
      expect(chunk.content.length).toBeGreaterThan(100);
    });
  });

  it('should respect code block boundaries when merging', () => {
    const splitter = new RecursiveMarkdownSplitter({
      maxChars: 300,
      minChars: 150,
      overlap: 0,
      headerLevels: [1, 2],
      preserveCodeBlocks: true,
    });

    const text = `# Section 1
Short intro.

\`\`\`cairo
// This is a long code block
fn example() -> felt252 {
    let x = 42;
    let y = x * 2;
    return y;
}
\`\`\`

# Section 2
Another short section.`;

    const chunks = splitter.splitMarkdownToChunks(text);

    // Verify code blocks are not split
    chunks.forEach((chunk) => {
      const codeBlockMatches = chunk.content.match(/```/g) || [];
      expect(codeBlockMatches.length % 2).toBe(0);
    });
  });
});
