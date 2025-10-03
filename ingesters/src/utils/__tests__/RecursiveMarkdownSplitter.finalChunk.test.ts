import { RecursiveMarkdownSplitter } from '../RecursiveMarkdownSplitter';

describe('RecursiveMarkdownSplitter - Final chunk handling', () => {
  it('should deterministically handle final tiny chunks', () => {
    const splitter = new RecursiveMarkdownSplitter({
      maxChars: 100,
      minChars: 50,
      overlap: 10,
      headerLevels: [1, 2],
      trim: true,
    });

    // Text that will create a tiny final chunk
    const text = `# Section One
This is the first section with enough content to meet the minimum character requirement.

# Section Two
This is the second section with enough content to meet the minimum character requirement.

# Section Three
Tiny bit.`;

    const chunks = splitter.splitMarkdownToChunks(text);

    // Debug output
    console.log(
      'Chunks:',
      chunks.map((c) => ({
        title: c.meta.title,
        length: c.content.length,
        preview: c.content.substring(0, 30).replace(/\n/g, '\\n'),
      })),
    );

    // The final tiny chunk should be merged with the previous one
    const lastChunk = chunks[chunks.length - 1];

    // Verify the tiny content was handled appropriately
    const hasTinyContent = chunks.some((c) => c.content.includes('Tiny bit'));
    expect(hasTinyContent).toBe(true);

    // The tiny section should not be on its own
    const tinyChunk = chunks.find((c) => c.meta.title === 'Section Three');
    if (tinyChunk) {
      expect(tinyChunk.content.length).toBeGreaterThanOrEqual(50); // Should meet minChars
    }
  });

  it('should handle multiple tiny segments at the end', () => {
    const splitter = new RecursiveMarkdownSplitter({
      maxChars: 100,
      minChars: 40,
      overlap: 0,
      headerLevels: [1],
      trim: true,
    });

    const text = `# Main Section
This is the main section with sufficient content to be a proper chunk.

# Tiny 1
Small.

# Tiny 2
Also small.

# Tiny 3
Very small.`;

    const chunks = splitter.splitMarkdownToChunks(text);

    // All tiny sections should be merged together
    expect(chunks.length).toBe(2);

    const lastChunk = chunks[chunks.length - 1]!;
    expect(lastChunk.content).toContain('Tiny 1');
    expect(lastChunk.content).toContain('Tiny 2');
    expect(lastChunk.content).toContain('Tiny 3');
  });

  it('should not exceed maxChars significantly when merging final chunk', () => {
    const splitter = new RecursiveMarkdownSplitter({
      maxChars: 50,
      minChars: 30,
      overlap: 0,
      headerLevels: [1],
      trim: true,
    });

    const text = `# Section One
This section has exactly the right amount of content.

# Section Two
This section also has exactly the right amount of content.

# Tiny
End.`;

    const chunks = splitter.splitMarkdownToChunks(text);

    // Check that tiny chunks are handled appropriately
    const lastChunk = chunks[chunks.length - 1]!;

    // If there's a tiny chunk, it should either be merged or meet minChars
    if (lastChunk.meta.title === 'Tiny') {
      expect(lastChunk.content.length).toBeGreaterThanOrEqual(30);
    }

    // No chunk should be excessively large
    chunks.forEach((chunk) => {
      expect(chunk.content.length).toBeLessThanOrEqual(75); // 1.5x maxChars
    });
  });

  it('should handle edge case where all segments are tiny', () => {
    const splitter = new RecursiveMarkdownSplitter({
      maxChars: 100,
      minChars: 50,
      overlap: 0,
      headerLevels: [1],
      trim: true,
    });

    const text = `# A
Short.

# B
Brief.

# C
Tiny.`;

    const chunks = splitter.splitMarkdownToChunks(text);

    // All should be merged into one chunk
    expect(chunks.length).toBe(1);
    expect(chunks[0]!.content).toContain('# A');
    expect(chunks[0]!.content).toContain('# B');
    expect(chunks[0]!.content).toContain('# C');
  });

  it('should preserve code blocks when merging final chunks', () => {
    const splitter = new RecursiveMarkdownSplitter({
      maxChars: 100,
      minChars: 50,
      overlap: 0,
      preserveCodeBlocks: true,
      trim: true,
    });

    const text = `# Section One
Content before code block.

\`\`\`python
def hello():
    print("Hello")
\`\`\`

# Tiny Section
End.`;

    const chunks = splitter.splitMarkdownToChunks(text);

    // Code block should be preserved intact
    const codeChunk = chunks.find((c) => c.content.includes('def hello()'));
    expect(codeChunk).toBeDefined();
    expect(codeChunk!.content).toMatch(/```python[\s\S]*?```/);
  });
});
