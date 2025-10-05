import { Document } from '@langchain/core/documents';
import { type BookChunk, DocumentSource } from '../src/types';
import {
  AsciiDocIngester,
  type AsciiDocIngesterConfig,
} from '../src/ingesters/AsciiDocIngester';
import {
  type BookConfig,
  type BookPageDto,
  type ParsedSection,
} from '../src/utils/types';

// Create a concrete implementation of AsciiDocIngester for testing
class TestAsciiDocIngester extends AsciiDocIngester {
  constructor(config: AsciiDocIngesterConfig) {
    super(config);
  }

  // Implement the abstract method
  protected async processDocFilesCustom(
    config: BookConfig,
    directory: string,
  ): Promise<BookPageDto[]> {
    return [];
  }

  // Expose protected methods for testing
  public exposedParsePage(
    content: string,
    split: boolean = false,
  ): ParsedSection[] {
    return this.parsePage(content, split);
  }

  public exposedCreateChunks(
    pages: BookPageDto[],
  ): Promise<Document<BookChunk>[]> {
    return this.createChunks(pages);
  }

  // Expose private methods for testing
  public exposedSplitAsciiDocIntoSections(
    content: string,
    split: boolean = true,
  ): ParsedSection[] {
    // @ts-ignore - accessing private method for testing
    return this.splitAsciiDocIntoSections(content, split);
  }

  public exposedConvertCodeBlocks(content: string): string {
    // @ts-ignore - accessing private method for testing
    return this.convertCodeBlocks(content);
  }

  public exposedIsInsideCodeBlock(content: string, index: number): boolean {
    // @ts-ignore - accessing private method for testing
    return this.isInsideCodeBlock(content, index);
  }
}

describe('AsciiDocIngester', () => {
  let ingester: TestAsciiDocIngester;

  beforeEach(() => {
    const config: AsciiDocIngesterConfig = {
      bookConfig: {
        repoOwner: 'test-owner',
        repoName: 'test-repo',
        fileExtension: '.adoc',
        chunkSize: 1000,
        chunkOverlap: 200,
        baseUrl: 'https://example.com',
        urlSuffix: '',
        useUrlMapping: false,
      },
      playbookPath: 'test-playbook.yml',
      outputDir: '/tmp/output',
      restructuredDir: '/tmp/restructured',
      source: DocumentSource.OPENZEPPELIN_DOCS,
    };

    ingester = new TestAsciiDocIngester(config);
  });

  describe('parsePage', () => {
    it('should parse a page without splitting', () => {
      const content = `= Title

This is some content.

== Section 1

This is section 1 content.

== Section 2

This is section 2 content.`;

      const result = ingester.exposedParsePage(content, false);

      expect(result.length).toBe(1);
      expect(result[0]!.title).toBe('Title');
      expect(result[0]!.content).toContain('This is some content.');
      expect(result[0]!.content).toContain('Section 1');
      expect(result[0]!.content).toContain('Section 2');
    });

    it('should parse a page with splitting', () => {
      const content = `= Title

This is some content.

== Section 1

This is section 1 content.

== Section 2

This is section 2 content.`;

      const result = ingester.exposedParsePage(content, true);

      expect(result.length).toBe(3);
      expect(result[0]!.title).toBe('Title');
      expect(result[0]!.content).toContain('This is some content.');
      expect(result[1]!.title).toBe('Section 1');
      expect(result[1]!.content).toContain('This is section 1 content.');
      expect(result[2]!.title).toBe('Section 2');
      expect(result[2]!.content).toContain('This is section 2 content.');
    });
  });

  describe('convertCodeBlocks', () => {
    it('should convert AsciiDoc code blocks to markdown format', () => {
      const content = `Here is some code:

[source,cairo]
----
function hello() {
    return "world";
}
----

And here is some more code:

[source,typescript]
----
function hello(): string {
    return "world";
}
----`;

      const result = ingester.exposedConvertCodeBlocks(content);

      expect(result).toContain('```cairo');
      expect(result).toContain('```typescript');
      expect(result).not.toContain('[source,cairo]');
      expect(result).not.toContain('[source,typescript]');
      expect(result).not.toContain('----');
    });

    it('should handle code blocks without language specification', () => {
      const content = `Here is some code:

----
function hello() {
    return "world";
}
----`;

      const result = ingester.exposedConvertCodeBlocks(content);

      expect(result).toContain('```');
      expect(result).not.toContain('----');
    });
  });

  describe('isInsideCodeBlock', () => {
    it('should correctly identify positions inside code blocks', () => {
      const content = `Here is some text.

[source,cairo]
----
function hello() {
    return "world";
}
----

More text here.`;

      // Position inside the code block
      const insidePosition = content.indexOf('function hello');
      expect(ingester.exposedIsInsideCodeBlock(content, insidePosition)).toBe(
        true,
      );

      // Position outside the code block
      const outsidePosition = content.indexOf('More text');
      expect(ingester.exposedIsInsideCodeBlock(content, outsidePosition)).toBe(
        false,
      );
    });
  });

  describe('URL sourcing and generation', () => {
    it('should generate correct sourceLinks for documentation pages', async () => {
      // Mock the parsePage method to return predictable sections
      jest.spyOn(ingester, 'exposedParsePage').mockImplementation((content) => {
        if (content.includes('Title 1')) {
          return [
            {
              title: 'Title 1',
              content: 'This is page 1 content.',
              anchor: 'title-1',
            },
            {
              title: 'Section 1.1',
              content: 'This is section 1.1 content.',
              anchor: 'section-1-1',
            },
          ];
        } else {
          return [
            {
              title: 'Title 2',
              content: 'This is page 2 content.',
              anchor: 'title-2',
            },
          ];
        }
      });

      const pages: BookPageDto[] = [
        {
          name: 'page1',
          content: `= Title 1

This is page 1 content.

== Section 1.1

This is section 1.1 content.`,
        },
        {
          name: 'page2',
          content: `= Title 2

This is page 2 content.`,
        },
      ];

      const chunks = await ingester.exposedCreateChunks(pages);

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0]).toBeInstanceOf(Document);

      // Check metadata
      expect(chunks[0]!.metadata.name).toBe('page1');
      expect(chunks[0]!.metadata.source).toBe(DocumentSource.OPENZEPPELIN_DOCS);
      expect(chunks[0]!.metadata.sourceLink).toBe(
        'https://example.com/page1#title-1',
      );

      // Second chunk is from the first page
      if (chunks.length > 1 && chunks[1]!.metadata.name === 'page1') {
        expect(chunks[1]!.metadata.sourceLink).toBe(
          'https://example.com/page1#section-1-1',
        );
      }
    });

    it('should handle nested paths in URLs', async () => {
      jest.spyOn(ingester, 'exposedParsePage').mockImplementation(() => {
        return [
          {
            title: 'Custom Accounts',
            content: 'Content here',
            anchor: 'custom-accounts',
          },
        ];
      });

      const pages: BookPageDto[] = [
        {
          name: 'guides/advanced/custom-accounts',
          content: '= Custom Accounts\nContent here',
        },
      ];

      const chunks = await ingester.exposedCreateChunks(pages);

      expect(chunks).toHaveLength(1);
      expect(chunks[0]!.metadata.sourceLink).toBe(
        'https://example.com/guides/advanced/custom-accounts#custom-accounts',
      );
    });

    it('should generate empty sourceLinks when baseUrl is not provided', async () => {
      const configNoUrl: AsciiDocIngesterConfig = {
        bookConfig: {
          repoOwner: 'test-owner',
          repoName: 'test-repo',
          fileExtension: '.adoc',
          chunkSize: 1000,
          chunkOverlap: 200,
          baseUrl: '',
          urlSuffix: '',
          useUrlMapping: false,
        },
        playbookPath: 'test-playbook.yml',
        outputDir: '/tmp/output',
        restructuredDir: '/tmp/restructured',
        source: DocumentSource.OPENZEPPELIN_DOCS,
      };

      const ingesterNoUrl = new TestAsciiDocIngester(configNoUrl);

      jest.spyOn(ingesterNoUrl, 'exposedParsePage').mockImplementation(() => {
        return [
          {
            title: 'Title',
            content: 'Content',
            anchor: 'title',
          },
        ];
      });

      const pages: BookPageDto[] = [
        {
          name: 'page1',
          content: '= Title\nContent',
        },
      ];

      const chunks = await ingesterNoUrl.exposedCreateChunks(pages);

      expect(chunks).toHaveLength(1);
      // When baseUrl is empty string, it builds URL without the base part
      expect(chunks[0]!.metadata.sourceLink).toBe('/page1#title');
    });

    it('should generate unique IDs correctly', async () => {
      const pages: BookPageDto[] = [
        {
          name: 'test-page',
          content: '= Section 1\nContent\n== Section 2\nMore content',
        },
      ];

      const chunks = await ingester.exposedCreateChunks(pages);

      // The actual parsing will create chunks based on the real parser
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0]!.metadata.uniqueId).toBe('test-page-0');
      if (chunks.length > 1) {
        expect(chunks[1]!.metadata.uniqueId).toBe('test-page-1');
      }
    });

    it('should calculate content hash for each chunk', async () => {
      jest.spyOn(ingester, 'exposedParsePage').mockImplementation(() => {
        return [
          {
            title: 'Section 1',
            content: 'Content',
            anchor: 'section-1',
          },
        ];
      });

      const pages: BookPageDto[] = [
        {
          name: 'test-page',
          content: '= Section 1\nContent',
        },
      ];

      const chunks = await ingester.exposedCreateChunks(pages);

      expect(chunks).toHaveLength(1);
      expect(chunks[0]!.metadata.contentHash).toBeDefined();
      expect(typeof chunks[0]!.metadata.contentHash).toBe('string');
      expect(chunks[0]!.metadata.contentHash.length).toBeGreaterThan(0);
    });

    it('should preserve custom anchors from AsciiDoc', async () => {
      const content = `[#custom-anchor-id]
= Title

Content here.`;

      const result = ingester.exposedParsePage(content, false);

      expect(result).toHaveLength(1);
      expect(result[0]!.anchor).toBe('custom-anchor-id');
      expect(result[0]!.title).toBe('Title');
    });
  });
});
