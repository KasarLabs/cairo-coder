import { RecursiveMarkdownSplitter } from '../RecursiveMarkdownSplitter';

describe('RecursiveMarkdownSplitter - sourceLink mapping with overlap', () => {
  it('should use segment start (no-overlap) to resolve sourceLink so it is never undefined', () => {
    const splitter = new RecursiveMarkdownSplitter({
      maxChars: 60,
      minChars: 0,
      overlap: 20,
      headerLevels: [1, 2, 3],
    });

    const md = `---

Sources:

- https://example.com/a

---

# Title

Paragraph one is long enough to cause splitting when combined with overlap. This ensures chunk starts may fall before the source range while the segment starts after it.`;

    const chunks = splitter.splitMarkdownToChunks(md);
    expect(chunks.length).toBeGreaterThan(1);
    // All non-ROOT chunks (after first header) should have a sourceLink
    for (const c of chunks) {
      if (c.meta.title !== 'ROOT') {
        expect(c.meta.sourceLink).toBe('https://example.com/a');
      }
    }
  });
});
