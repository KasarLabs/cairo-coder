import { type BookPageDto } from '../src/shared';
import { MarkdownIngester } from '../src/ingesters/MarkdownIngester';
import { DocumentSource } from '../src/types';

// Create a concrete implementation of the abstract MarkdownIngester for testing
class TestMarkdownIngester extends MarkdownIngester {
  protected getExtractDir(): string {
    return '/tmp/test-extract-dir';
  }
}

// Create an instance for testing with baseUrl and useUrlMapping
const markdownIngester = new TestMarkdownIngester(
  {
    repoOwner: 'test',
    repoName: 'test',
    baseUrl: 'https://test.com',
    fileExtensions: ['md'],
    urlSuffix: '.html',
    chunkSize: 1000,
    chunkOverlap: 100,
    useUrlMapping: true,
  },
  DocumentSource.CAIRO_BOOK,
);

describe('splitMarkdownIntoSections', () => {
  it('should split content with multiple headers of different levels', () => {
    const content = `# Title 1
Some content
## Subtitle
More content
### Section
Even more content`;

    const result = markdownIngester['splitMarkdownIntoSections'](content);

    expect(result).toEqual([
      { title: 'Title 1', content: '# Title 1\nSome content' },
      {
        title: 'Subtitle',
        content: '## Subtitle\nMore content\n### Section\nEven more content',
      },
    ]);
  });

  it('should handle content with no headers', () => {
    const content = 'Just some plain text without headers.';
    const result = markdownIngester['splitMarkdownIntoSections'](content);
    expect(result).toEqual([
      { title: '', content: 'Just some plain text without headers.' },
    ]);
  });

  it('should handle content with only one header', () => {
    const content = '# Single Header\nWith some content';
    const result = markdownIngester['splitMarkdownIntoSections'](content);
    expect(result).toEqual([
      { title: 'Single Header', content: '# Single Header\nWith some content' },
    ]);
  });

  it('should handle empty content', () => {
    const content = '';
    const result = markdownIngester['splitMarkdownIntoSections'](content);
    expect(result).toEqual([]);
  });

  it('should handle content with headers but no content', () => {
    const content = '# Header 1\n## Header 2\n### Header 3';
    const result = markdownIngester['splitMarkdownIntoSections'](content);
    expect(result).toEqual([
      {
        title: 'Header 1',
        content: '# Header 1',
        anchor: undefined,
      },
      {
        title: 'Header 2',
        content: '## Header 2\n### Header 3',
        anchor: undefined,
      },
    ]);
  });

  it('should not split on headers inside code blocks', () => {
    const content = `# Main Title
Some content
\`\`\`
# This is not a header
code line 1
code line 2
\`\`\`
## Real Subtitle
More content
\`\`\`
# println!("This is a hidden line");
# println!("This is a visible line");
\`\`\`
### Another Section
Final content`;

    const result = markdownIngester['splitMarkdownIntoSections'](content);

    expect(result).toEqual([
      {
        title: 'Main Title',
        content: `# Main Title
Some content
\`\`\`
# This is not a header
code line 1
code line 2
\`\`\``,
      },
      {
        title: 'Real Subtitle',
        content: `## Real Subtitle
More content
\`\`\`
# println!("This is a hidden line");
# println!("This is a visible line");
\`\`\`
### Another Section
Final content`,
      },
    ]);
  });
});

describe('createChunks', () => {
  it('should create chunks from multiple pages', async () => {
    const pages: BookPageDto[] = [
      {
        name: 'page1',
        content: '# Title 1\nContent 1\n## Subtitle\nMore content',
      },
      {
        name: 'page2',
        content: '# Title 2\nContent 2',
      },
    ];

    const result = await markdownIngester['createChunks'](pages);

    expect(result).toHaveLength(3);
    expect(result[0]!.pageContent).toBe('# Title 1\nContent 1');
    expect(result[0]!.metadata).toMatchObject({
      name: 'page1',
      title: 'Title 1',
      chunkNumber: 0,
    });
    expect(result[1]!.pageContent).toBe('## Subtitle\nMore content');
    expect(result[1]!.metadata).toMatchObject({
      name: 'page1',
      title: 'Subtitle',
      chunkNumber: 1,
    });
    expect(result[2]!.pageContent).toBe('# Title 2\nContent 2');
    expect(result[2]!.metadata).toMatchObject({
      name: 'page2',
      title: 'Title 2',
      chunkNumber: 0,
    });
  });

  it('should handle empty pages', async () => {
    const pages: BookPageDto[] = [{ name: 'empty', content: '' }];

    const result = await markdownIngester['createChunks'](pages);

    expect(result).toHaveLength(0);
  });
});

describe('sanitizeCodeBlocks', () => {
  it('should remove hidden lines from code blocks', () => {
    const input = `
Some regular text

\`\`\`rust
# fn main() {
#     let my_first_char = 'C';
#     let my_first_char_in_hex = 0x43;
#
#     let my_first_string = 'Hello world';
#     let my_first_string_in_hex = 0x48656C6C6F20776F726C64;
#
    let long_string: ByteArray = "this is a string which has more than 31 characters";
# }
\`\`\`

More regular text
`;

    const expected = `
Some regular text

\`\`\`rust
    let long_string: ByteArray = "this is a string which has more than 31 characters";
\`\`\`

More regular text
`;

    const result = markdownIngester['sanitizeCodeBlocks'](input);
    expect(result).toBe(expected);
  });
});

describe('URL sourcing and generation', () => {
  it('should generate correct sourceLinks for documentation pages', async () => {
    const pages: BookPageDto[] = [
      {
        name: 'page1',
        content: '# Title 1\nContent 1\n## Subtitle\nMore content',
      },
      {
        name: 'page2',
        content: '# Title 2\nContent 2',
      },
    ];

    const result = await markdownIngester['createChunks'](pages);

    expect(result).toHaveLength(3);

    // Check first chunk from page1
    expect(result[0]!.metadata.sourceLink).toBe(
      'https://test.com/page1.html#title-1',
    );
    expect(result[0]!.metadata.name).toBe('page1');
    expect(result[0]!.metadata.source).toBe(DocumentSource.CAIRO_BOOK);

    // Check second chunk from page1
    expect(result[1]!.metadata.sourceLink).toBe(
      'https://test.com/page1.html#subtitle',
    );

    // Check chunk from page2
    expect(result[2]!.metadata.sourceLink).toBe(
      'https://test.com/page2.html#title-2',
    );
  });

  it('should handle nested paths in URLs', async () => {
    const pages: BookPageDto[] = [
      {
        name: 'guides/advanced/custom-accounts',
        content: '# Custom Accounts\nContent here',
      },
    ];

    const result = await markdownIngester['createChunks'](pages);

    expect(result).toHaveLength(1);
    expect(result[0]!.metadata.sourceLink).toBe(
      'https://test.com/guides/advanced/custom-accounts.html#custom-accounts',
    );
  });

  it('should generate unique IDs correctly', async () => {
    const pages: BookPageDto[] = [
      {
        name: 'test-page',
        content: '# Section 1\nContent\n## Section 2\nMore content',
      },
    ];

    const result = await markdownIngester['createChunks'](pages);

    expect(result).toHaveLength(2);
    expect(result[0]!.metadata.uniqueId).toBe('test-page-0');
    expect(result[1]!.metadata.uniqueId).toBe('test-page-1');
  });

  it('should calculate content hash for each chunk', async () => {
    const pages: BookPageDto[] = [
      {
        name: 'test-page',
        content: '# Section 1\nContent',
      },
    ];

    const result = await markdownIngester['createChunks'](pages);

    expect(result).toHaveLength(1);
    expect(result[0]!.metadata.contentHash).toBeDefined();
    expect(typeof result[0]!.metadata.contentHash).toBe('string');
    expect(result[0]!.metadata.contentHash.length).toBeGreaterThan(0);
  });

  it('should create anchors from section titles', async () => {
    const pages: BookPageDto[] = [
      {
        name: 'page',
        content: '# Getting Started\nIntro\n## Advanced Topics\nDetails',
      },
    ];

    const result = await markdownIngester['createChunks'](pages);

    expect(result).toHaveLength(2);
    expect(result[0]!.metadata.sourceLink).toContain('#getting-started');
    expect(result[1]!.metadata.sourceLink).toContain('#advanced-topics');
  });

  it('should only use baseUrl when useUrlMapping is false', async () => {
    const ingesterNoMapping = new TestMarkdownIngester(
      {
        repoOwner: 'test',
        repoName: 'test',
        baseUrl: 'https://docs.example.com',
        fileExtensions: ['md'],
        urlSuffix: '.html',
        chunkSize: 1000,
        chunkOverlap: 100,
        useUrlMapping: false,
      },
      DocumentSource.CAIRO_BOOK,
    );

    const pages: BookPageDto[] = [
      {
        name: 'guides/advanced/custom-accounts',
        content:
          '# Custom Accounts\nContent here\n## Configuration\nMore details',
      },
    ];

    const result = await ingesterNoMapping['createChunks'](pages);

    expect(result).toHaveLength(2);
    // Both chunks should only have the baseUrl, no page path or anchor
    expect(result[0]!.metadata.sourceLink).toBe('https://docs.example.com');
    expect(result[1]!.metadata.sourceLink).toBe('https://docs.example.com');
  });

  it('should reconstruct full online URL when useUrlMapping is true', async () => {
    const ingesterWithMapping = new TestMarkdownIngester(
      {
        repoOwner: 'test',
        repoName: 'test',
        baseUrl: 'https://docs.starknet.io',
        fileExtensions: ['md'],
        urlSuffix: '',
        chunkSize: 1000,
        chunkOverlap: 100,
        useUrlMapping: true,
      },
      DocumentSource.CAIRO_BOOK,
    );

    const pages: BookPageDto[] = [
      {
        name: 'learn/s-two/air-development/hello-zk-world',
        content: '# Hello ZK World\nIntroduction\n## Setup\nSetup details',
      },
    ];

    const result = await ingesterWithMapping['createChunks'](pages);

    expect(result).toHaveLength(2);

    // First chunk: baseUrl + pageName + anchor from section title
    expect(result[0]!.metadata.sourceLink).toBe(
      'https://docs.starknet.io/learn/s-two/air-development/hello-zk-world#hello-zk-world',
    );

    // Second chunk: baseUrl + pageName + anchor from section title
    expect(result[1]!.metadata.sourceLink).toBe(
      'https://docs.starknet.io/learn/s-two/air-development/hello-zk-world#setup',
    );
  });

  it('should reconstruct URL with urlSuffix when useUrlMapping is true', async () => {
    const ingesterWithSuffix = new TestMarkdownIngester(
      {
        repoOwner: 'test',
        repoName: 'test',
        baseUrl: 'https://book.cairo-lang.org',
        fileExtensions: ['md'],
        urlSuffix: '.html',
        chunkSize: 1000,
        chunkOverlap: 100,
        useUrlMapping: true,
      },
      DocumentSource.CAIRO_BOOK,
    );

    const pages: BookPageDto[] = [
      {
        name: 'ch02-01-variables-and-mutability',
        content: '# Variables and Mutability\nContent here',
      },
    ];

    const result = await ingesterWithSuffix['createChunks'](pages);

    expect(result).toHaveLength(1);

    // Should include baseUrl + pageName + urlSuffix + anchor
    expect(result[0]!.metadata.sourceLink).toBe(
      'https://book.cairo-lang.org/ch02-01-variables-and-mutability.html#variables-and-mutability',
    );
  });
});
