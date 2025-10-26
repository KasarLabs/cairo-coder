import { RecursiveMarkdownSplitter } from '../RecursiveMarkdownSplitter';

describe('RecursiveMarkdownSplitter', () => {
  describe('Basic functionality', () => {
    it('should handle empty input', () => {
      const splitter = new RecursiveMarkdownSplitter();
      expect(splitter.splitMarkdownToChunks('')).toEqual([]);
      expect(splitter.splitMarkdownToChunks('   ')).toEqual([]);
    });

    it('should handle single small chunk', () => {
      const splitter = new RecursiveMarkdownSplitter({
        maxChars: 100,
        minChars: 0,
        overlap: 10,
      });
      const text = 'This is a small chunk of text.';
      const chunks = splitter.splitMarkdownToChunks(text);

      expect(chunks).toHaveLength(1);
      expect(chunks[0]!.content).toBe(text);
      expect(chunks[0]!.meta.title).toBe('ROOT');
      expect(chunks[0]!.meta.chunkNumber).toBe(0);
    });

    it('should throw error when overlap >= maxChars', () => {
      expect(() => {
        new RecursiveMarkdownSplitter({
          maxChars: 100,
          minChars: 0,
          overlap: 100,
        });
      }).toThrow('Overlap (100) must be less than maxChars (100)');
    });
  });

  describe('Header detection and splitting', () => {
    it('should split on H1 headers', () => {
      const splitter = new RecursiveMarkdownSplitter({
        maxChars: 50,
        minChars: 0,
        overlap: 0,
        headerLevels: [1],
      });

      const text = `# First Section
This is the first section content.

# Second Section
This is the second section content.`;

      const chunks = splitter.splitMarkdownToChunks(text);

      // Headers split the content, so we should have chunks for each section
      const firstSectionChunk = chunks.find(
        (c) => c.meta.title === 'First Section',
      );
      const secondSectionChunk = chunks.find(
        (c) => c.meta.title === 'Second Section',
      );

      expect(firstSectionChunk).toBeDefined();
      expect(secondSectionChunk).toBeDefined();
    });

    it('should split on both H1 and H2 headers', () => {
      const splitter = new RecursiveMarkdownSplitter({
        maxChars: 50,
        minChars: 0,
        overlap: 0,
        headerLevels: [1, 2],
      });

      const text = `# Main Section
Some intro text.

## Subsection 1
First subsection.

## Subsection 2
Second subsection.`;

      const chunks = splitter.splitMarkdownToChunks(text);

      expect(chunks.length).toBeGreaterThanOrEqual(3);
      expect(chunks[0]!.meta.title).toBe('Main Section');
      expect(chunks.find((c) => c.meta.title === 'Subsection 1')).toBeDefined();
      expect(chunks.find((c) => c.meta.title === 'Subsection 2')).toBeDefined();
    });

    it('should ignore headers inside code blocks', () => {
      const splitter = new RecursiveMarkdownSplitter({
        maxChars: 200,
        minChars: 0,
        overlap: 0,
      });

      const text = `# Real Header
Some content.

\`\`\`markdown
# This is not a real header
It's inside a code block
\`\`\`

More content.`;

      const chunks = splitter.splitMarkdownToChunks(text);

      expect(chunks).toHaveLength(1);
      expect(chunks[0]!.meta.title).toBe('Real Header');
      expect(chunks[0]!.content).toContain('# This is not a real header');
    });

    it('should handle headers with trailing hashes', () => {
      const splitter = new RecursiveMarkdownSplitter({
        maxChars: 100,
        minChars: 0,
        overlap: 10,
      });
      const text = '## Header with trailing hashes ##\nContent here.';
      const chunks = splitter.splitMarkdownToChunks(text);

      expect(chunks[0]!.meta.title).toBe('Header with trailing hashes');
    });

    it('should detect headers with up to 3 leading spaces', () => {
      const splitter = new RecursiveMarkdownSplitter({
        maxChars: 100,
        minChars: 0,
        overlap: 0,
        headerLevels: [1, 2],
      });
      const text = '   ## Indented H2 Header\nBody under indented header.';
      const chunks = splitter.splitMarkdownToChunks(text);
      expect(chunks.length).toBeGreaterThanOrEqual(1);
      expect(chunks[0]!.meta.title).toBe('Indented H2 Header');
    });

    it('should prefer deepest header of configured levels (e.g., H2) for title', () => {
      const splitter = new RecursiveMarkdownSplitter({
        maxChars: 80,
        minChars: 0,
        overlap: 0,
        headerLevels: [1, 2], // split only on H1/H2, but titles should use deepest header in path
      });

      const text = `# Chapter
Intro
## Some H2 Title
Some text in the H2
### Specific Topic
Detailed text that should belong to the H3.`;

      const chunks = splitter.splitMarkdownToChunks(text);
      expect(chunks.length).toBeGreaterThan(0);
      // Find a chunk that belongs to the H2 section
      const h2Chunk = chunks.find(
        (c) =>
          c.content.includes('Some text in the H2') ||
          c.content.includes('Specific Topic') ||
          c.content.includes('Detailed text'),
      );
      expect(h2Chunk).toBeDefined();
      // Title should be the deepest header among configured levels -> H2
      expect(h2Chunk!.meta.title).toBe('Some H2 Title');
    });
  });

  describe('Code block handling', () => {
    it('should not split inside code blocks', () => {
      const splitter = new RecursiveMarkdownSplitter({
        maxChars: 50,
        minChars: 0,
        overlap: 0,
        preserveCodeBlocks: true,
      });

      const text = `Some text before.

\`\`\`python
def long_function():
    # This is a long code block that exceeds maxChars
    print("This should not be split")
    return "Even though it's longer than 50 chars"
\`\`\`

Some text after.`;

      const chunks = splitter.splitMarkdownToChunks(text);

      // Verify code block is kept intact
      const codeBlockChunk = chunks.find((c) =>
        c.content.includes('def long_function()'),
      );
      expect(codeBlockChunk).toBeDefined();
      expect(codeBlockChunk!.content).toContain('```python');
      expect(codeBlockChunk!.content).toContain('```');
    });

    it('should handle tilde code fences', () => {
      const splitter = new RecursiveMarkdownSplitter({
        maxChars: 200,
        minChars: 0,
        overlap: 20,
      });

      const text = `Text before.

~~~javascript
const code = "This uses tilde fences";
~~~

Text after.`;

      const chunks = splitter.splitMarkdownToChunks(text);

      expect(chunks).toHaveLength(1);
      expect(chunks[0]!.content).toContain('~~~javascript');
      expect(chunks[0]!.content).toContain(
        'const code = "This uses tilde fences"',
      );
    });

    it('should handle nested code fences correctly', () => {
      const splitter = new RecursiveMarkdownSplitter({
        maxChars: 300,
        minChars: 0,
        overlap: 30,
      });

      const text = `\`\`\`markdown
Example with nested fences:
\`\`\`python
print("nested")
\`\`\`
End of example
\`\`\``;

      const chunks = splitter.splitMarkdownToChunks(text);

      expect(chunks).toHaveLength(1);
      expect(chunks[0]!.content).toContain('Example with nested fences');
    });
  });

  describe('Overlap handling', () => {
    it('should apply backward overlap correctly', () => {
      const splitter = new RecursiveMarkdownSplitter({
        maxChars: 50,
        minChars: 0,
        overlap: 10,
        headerLevels: [1],
      });

      const text = `# Section 1
This is the first section with some content.

# Section 2
This is the second section with more content.`;

      const chunks = splitter.splitMarkdownToChunks(text);

      expect(chunks.length).toBeGreaterThanOrEqual(2);

      // Check that second chunk contains overlap from first
      if (chunks.length >= 2) {
        // The overlap should be at the beginning of the second chunk
        const overlap = 10; // We set overlap to 10

        // Calculate expected overlap position
        const firstChunkEndIndex = chunks[0]!.meta.endChar;
        const secondChunkStartIndex = chunks[1]!.meta.startChar;

        // The start of second chunk should be overlap chars before the end of first chunk
        expect(firstChunkEndIndex - secondChunkStartIndex).toBeLessThanOrEqual(
          overlap,
        );
      }
    });

    it('should extend overlap to include entire code block', () => {
      const splitter = new RecursiveMarkdownSplitter({
        maxChars: 100,
        minChars: 0,
        overlap: 20,
        preserveCodeBlocks: true,
      });

      const text = `First part of content here.

\`\`\`
code block content
\`\`\`

Second part starts here and continues with more text.`;

      const chunks = splitter.splitMarkdownToChunks(text);

      // If there are multiple chunks, verify code block handling
      if (chunks.length > 1) {
        const codeBlockInFirst = chunks[0]!.content.includes('```');
        const codeBlockInSecond = chunks[1]!.content.includes('```');

        // Code block should be complete in whichever chunk it appears
        if (codeBlockInFirst) {
          expect(chunks[0]!.content).toMatch(/```[\s\S]*?```/);
        }
        if (codeBlockInSecond) {
          expect(chunks[1]!.content).toMatch(/```[\s\S]*?```/);
        }
      }
    });
  });

  describe('Metadata generation', () => {
    it('should generate correct unique IDs', () => {
      const splitter = new RecursiveMarkdownSplitter({
        maxChars: 50,
        minChars: 0,
        overlap: 5,
        idPrefix: 'test',
      });

      const text = `# My Section
This is content for the first section

# My Section
This is content for the second section with the same title`;

      const chunks = splitter.splitMarkdownToChunks(text);

      // Find all chunks with title "My Section"
      const mySectionChunks = chunks.filter(
        (c) => c.meta.title === 'My Section',
      );

      // Should have at least 2 chunks with this title
      expect(mySectionChunks.length).toBeGreaterThanOrEqual(2);

      // Check that they have different unique IDs with incrementing numbers
      const uniqueIds = mySectionChunks.map((c) => c.meta.uniqueId);
      expect(uniqueIds).toContain('test-my-section-0');
      expect(uniqueIds).toContain('test-my-section-1');
    });

    it('should track header paths correctly', () => {
      const splitter = new RecursiveMarkdownSplitter({
        maxChars: 50,
        minChars: 0,
        overlap: 10,
      });

      const text = `# Chapter 1
Intro to chapter one with some text

## Section 1.1
Content in section one point one

### Subsection 1.1.1
More content in the subsection

## Section 1.2
Other content in section one point two`;

      const chunks = splitter.splitMarkdownToChunks(text);

      // This should create multiple chunks due to the smaller maxChars
      expect(chunks.length).toBeGreaterThan(1);

      // Find chunks based on their unique content
      const section11Chunk = chunks.find((c) =>
        c.content.includes('section one point one'),
      );
      const subsectionChunk = chunks.find((c) =>
        c.content.includes('More content in the subsection'),
      );
      const section12Chunk = chunks.find((c) =>
        c.content.includes('section one point two'),
      );

      // Check that chunks have appropriate header paths
      if (section11Chunk) {
        expect(section11Chunk.meta.headerPath).toContain('Chapter 1');
        // Title should be Section 1.1 since that's the header for this content
        expect(section11Chunk.meta.title).toBe('Section 1.1');
      }

      if (subsectionChunk) {
        expect(subsectionChunk.meta.headerPath).toContain('Chapter 1');
        // The subsection content should have appropriate headers in path
        expect(
          subsectionChunk.meta.headerPath.some(
            (h) => h === 'Section 1.1' || h === 'Subsection 1.1.1',
          ),
        ).toBe(true);
      }

      if (section12Chunk) {
        expect(section12Chunk.meta.headerPath).toContain('Chapter 1');
        expect(section12Chunk.meta.title).toBe('Section 1.2');
      }
    });

    it('should handle chunk numbering per title', () => {
      const splitter = new RecursiveMarkdownSplitter({
        maxChars: 30,
        minChars: 0,
        overlap: 0,
      });

      const text = `# Long Section
This is a very long section that will definitely need to be split into multiple chunks because it exceeds our maximum character limit.`;

      const chunks = splitter.splitMarkdownToChunks(text);

      const longSectionChunks = chunks.filter(
        (c) => c.meta.title === 'Long Section',
      );
      expect(longSectionChunks.length).toBeGreaterThan(1);

      // Check sequential numbering
      longSectionChunks.forEach((chunk, index) => {
        expect(chunk.meta.chunkNumber).toBe(index);
      });
    });

    it('should slugify titles correctly', () => {
      const splitter = new RecursiveMarkdownSplitter({
        maxChars: 2048,
        minChars: 0,
        overlap: 256,
      });

      const text = `# Title with Special@#$ Characters!!!
Content`;

      const chunks = splitter.splitMarkdownToChunks(text);

      expect(chunks[0]!.meta.uniqueId).toBe('title-with-special-characters-0');
    });
  });

  describe('Splitting strategies', () => {
    it('should fall back to paragraph splitting', () => {
      const splitter = new RecursiveMarkdownSplitter({
        maxChars: 50,
        minChars: 0,
        overlap: 0,
      });

      const text = `First paragraph with some content here.

Second paragraph with more content here.

Third paragraph with even more content.`;

      const chunks = splitter.splitMarkdownToChunks(text);

      expect(chunks.length).toBeGreaterThanOrEqual(3);
    });

    it('should fall back to line splitting for very long lines', () => {
      const splitter = new RecursiveMarkdownSplitter({
        maxChars: 50,
        minChars: 0,
        overlap: 0,
      });

      // Create multiple lines that are each long but don't have paragraph breaks
      const longLine =
        'Line one that is quite long and exceeds our limit\n' +
        'Line two that is also very long and exceeds limit\n' +
        'Line three with even more text to ensure splitting';

      const chunks = splitter.splitMarkdownToChunks(longLine);

      expect(chunks.length).toBeGreaterThan(1);
    });
  });

  describe('Edge cases', () => {
    it('should handle documents with no headers', () => {
      const splitter = new RecursiveMarkdownSplitter({
        maxChars: 100,
        minChars: 0,
        overlap: 10,
      });

      const text =
        'Just plain text without any headers. ' +
        'This should still be chunked properly.';

      const chunks = splitter.splitMarkdownToChunks(text);

      expect(chunks.every((c) => c.meta.title === 'ROOT')).toBe(true);
    });

    it('should handle consecutive headers with no content', () => {
      const splitter = new RecursiveMarkdownSplitter({
        maxChars: 100,
        minChars: 0,
        overlap: 10,
      });

      const text = `# Header 1
# Header 2
# Header 3
Some content here.`;

      const chunks = splitter.splitMarkdownToChunks(text);

      // Should produce valid chunks even with empty sections
      expect(chunks.length).toBeGreaterThan(0);
      chunks.forEach((chunk) => {
        expect(chunk.content.length).toBeGreaterThan(0);
      });
    });

    it('should handle Windows line endings', () => {
      const splitter = new RecursiveMarkdownSplitter({
        maxChars: 100,
        minChars: 0,
        overlap: 10,
      });

      const text = '# Header\r\nContent with\r\nWindows line endings.';

      const chunks = splitter.splitMarkdownToChunks(text);

      expect(chunks).toHaveLength(1);
      expect(chunks[0]!.meta.title).toBe('Header');
      expect(chunks[0]!.content).not.toContain('\r');
    });

    it('should handle unclosed code blocks gracefully', () => {
      const splitter = new RecursiveMarkdownSplitter({
        maxChars: 100,
        minChars: 0,
        overlap: 10,
      });

      const text = `# Section
Some content.

\`\`\`python
This code block is never closed
and continues to the end`;

      const chunks = splitter.splitMarkdownToChunks(text);

      expect(chunks.length).toBeGreaterThan(0);
      // Should still produce valid output
    });
  });

  describe('Character offset tracking', () => {
    it('should track start and end character positions correctly', () => {
      const splitter = new RecursiveMarkdownSplitter({
        maxChars: 50,
        minChars: 0,
        overlap: 0,
      });

      const text = `# Section 1
Short content.

# Section 2
More content here.`;

      const chunks = splitter.splitMarkdownToChunks(text);

      chunks.forEach((chunk) => {
        expect(chunk.meta.startChar).toBeGreaterThanOrEqual(0);
        expect(chunk.meta.endChar).toBeGreaterThan(chunk.meta.startChar);
        expect(
          chunk.meta.endChar - chunk.meta.startChar,
        ).toBeGreaterThanOrEqual(chunk.content.length);
      });
    });
  });
});
