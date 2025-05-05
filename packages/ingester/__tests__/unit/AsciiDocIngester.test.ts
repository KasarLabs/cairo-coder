import { Document } from '@langchain/core/documents';
import { BookChunk, DocumentSource } from '@cairo-coder/agents/types/index';
import {
  AsciiDocIngester,
  AsciiDocIngesterConfig,
} from '../../src/ingesters/AsciiDocIngester';
import { BookConfig, BookPageDto, ParsedSection } from '../../src/utils/types';

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

  public exposedConvertCodeBlock(
    codeContent: string,
    language: string = '',
  ): string {
    // @ts-ignore - accessing private method for testing
    return this.convertCodeBlock(codeContent, language);
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
      },
      playbookPath: 'test-playbook.yml',
      outputDir: '/tmp/output',
      restructuredDir: '/tmp/restructured',
      source: 'test_source' as DocumentSource,
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
      expect(result[0].title).toBe('Title');
      expect(result[0].content).toContain('This is some content.');
      expect(result[0].content).toContain('Section 1');
      expect(result[0].content).toContain('Section 2');
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
      expect(result[0].title).toBe('Title');
      expect(result[0].content).toContain('This is some content.');
      expect(result[1].title).toBe('Section 1');
      expect(result[1].content).toContain('This is section 1 content.');
      expect(result[2].title).toBe('Section 2');
      expect(result[2].content).toContain('This is section 2 content.');
    });
  });

  describe('splitAsciiDocIntoSections', () => {
    it('should split AsciiDoc content into sections', () => {
      const content = `= Title

This is some content.

== Section 1

This is section 1 content.

== Section 2

This is section 2 content.`;

      const result = ingester.exposedSplitAsciiDocIntoSections(content, true);

      expect(result.length).toBe(3);
      expect(result[0].title).toBe('Title');
      expect(result[0].content).toContain('This is some content.');
      expect(result[1].title).toBe('Section 1');
      expect(result[1].content).toContain('This is section 1 content.');
      expect(result[2].title).toBe('Section 2');
      expect(result[2].content).toContain('This is section 2 content.');
    });

    it('should handle nested sections', () => {
      const content = `= Title

This is some content.

== Section 1

This is section 1 content.

=== Subsection 1.1

This is subsection 1.1 content.

== Section 2

This is section 2 content.`;

      const result = ingester.exposedSplitAsciiDocIntoSections(content, true);

      expect(result.length).toBe(4);
      expect(result[0].title).toBe('Title');
      expect(result[0].content).toContain('This is some content.');
      expect(result[1].title).toBe('Section 1');
      expect(result[1].content).toContain('This is section 1 content.');
      expect(result[2].title).toBe('Subsection 1.1');
      expect(result[2].content).toContain('This is subsection 1.1 content.');
      expect(result[3].title).toBe('Section 2');
      expect(result[3].content).toContain('This is section 2 content.');
    });

    it('should handle code blocks', () => {
      const content = `= Title

This is some content.

[source,cairo]
----
== This is not a real header
function hello() {
    return "world";
}
----

== Section 1

This is section 1 content.`;

      const result = ingester.exposedSplitAsciiDocIntoSections(content, true);

      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0].title).toBe('Title');
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

  describe('createChunks', () => {
    it('should create chunks from book pages', async () => {
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
            {
              title: 'Section 2.1',
              content: 'This is section 2.1 content.',
              anchor: 'section-2-1',
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

This is page 2 content.

== Section 2.1

This is section 2.1 content.`,
        },
      ];

      const chunks = await ingester.exposedCreateChunks(pages);

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0]).toBeInstanceOf(Document);

      // Check metadata
      expect(chunks[0].metadata.name).toBe('page1');
      expect(chunks[0].metadata.source).toBe('test_source');
    });
  });
});
