import { RecursiveMarkdownSplitter } from '../RecursiveMarkdownSplitter';

describe('RecursiveMarkdownSplitter - Sources block activeSource mapping', () => {
  it('assigns sourceLink from first URL in Sources block to subsequent chunks', () => {
    const splitter = new RecursiveMarkdownSplitter({
      maxChars: 120,
      minChars: 0,
      overlap: 0,
      headerLevels: [1, 2],
    });

    const text = `
  ---

Sources:

- https://www.starknet.io/cairo-book/ch00-00-introduction.html
- https://www.starknet.io/cairo-book/ch00-01-foreword.html

---

# The Cairo Book: Introduction and Learning Resources

Some introduction text.

---

Sources:

- https://www.starknet.io/cairo-book/

---

## About The Cairo Book

More details here.`;

    const chunks = splitter.splitMarkdownToChunks(text);

    // Find chunk under the first H1
    const introChunk = chunks.find((c) =>
      c.content.includes(
        '# The Cairo Book: Introduction and Learning Resources',
      ),
    );
    expect(introChunk).toBeDefined();
    expect(introChunk!.meta.sourceLink).toBe(
      'https://www.starknet.io/cairo-book/ch00-00-introduction.html',
    );

    // Find chunk under the second header (H2), after second Sources block
    const aboutChunk = chunks.find((c) =>
      c.content.includes('## About The Cairo Book'),
    );
    expect(aboutChunk).toBeDefined();
    expect(aboutChunk!.meta.sourceLink).toBe(
      'https://www.starknet.io/cairo-book/',
    );
  });
});
