import axios from 'axios';
import { afterEach, describe, expect, it, vi } from 'bun:test';
import {
  CairoSkillsIngester,
  parseFrontmatter,
  parseGitHubUrl,
} from '../src/ingesters/CairoSkillsIngester';
import { DocumentSource } from '../src/types';
import { type BookPageDto } from '../src/utils/types';

type SkillConfig = {
  id: string;
  url: string;
};

class TestCairoSkillsIngester extends CairoSkillsIngester {
  public setSkills(skills: SkillConfig[]): void {
    this.skills = skills;
  }

  public exposedDownloadAndExtractDocs(): Promise<BookPageDto[]> {
    return this.downloadAndExtractDocs();
  }

  public exposedCreateChunks(
    pages: BookPageDto[],
  ): ReturnType<CairoSkillsIngester['createChunks']> {
    return this.createChunks(pages);
  }

  public exposedCleanupDownloadedFiles(): Promise<void> {
    return this.cleanupDownloadedFiles();
  }
}

const toBase64 = (value: string): string =>
  Buffer.from(value).toString('base64');

describe('CairoSkillsIngester', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('parseGitHubUrl', () => {
    it('parses /tree/ directory URLs', () => {
      expect(
        parseGitHubUrl(
          'https://github.com/feltroidprime/cairo-skills/tree/main/skills/benchmarking-cairo',
        ),
      ).toEqual({
        owner: 'feltroidprime',
        repo: 'cairo-skills',
        ref: 'main',
        path: 'skills/benchmarking-cairo',
        isFile: false,
      });
    });

    it('parses /blob/ URLs with commit refs', () => {
      expect(
        parseGitHubUrl(
          'https://github.com/keep-starknet-strange/starknet-agentic/blob/3454ca28ac6bd34eda96dc2faa43d89a5126e93c/skills/starknet-defi/SKILL.md',
        ),
      ).toEqual({
        owner: 'keep-starknet-strange',
        repo: 'starknet-agentic',
        ref: '3454ca28ac6bd34eda96dc2faa43d89a5126e93c',
        path: 'skills/starknet-defi/SKILL.md',
        isFile: true,
      });
    });

    it('throws on unsupported urls', () => {
      expect(() => parseGitHubUrl('https://example.com/not-github')).toThrow();
    });
  });

  describe('parseFrontmatter', () => {
    it('extracts YAML frontmatter fields and strips the block from content', () => {
      const markdown = `---
name: "Test Skill"
description: "A test description"
keywords: [foo, bar]
---
# Hello
World`;

      const parsed = parseFrontmatter(markdown);

      expect(parsed.frontmatter).toEqual({
        name: 'Test Skill',
        description: 'A test description',
        keywords: ['foo', 'bar'],
      });
      expect(parsed.content).toBe('# Hello\nWorld');
    });

    it('returns original content and empty frontmatter without markers', () => {
      const markdown = '# No frontmatter\n\nBody';
      const parsed = parseFrontmatter(markdown);

      expect(parsed.frontmatter).toEqual({});
      expect(parsed.content).toBe(markdown);
    });
  });

  describe('downloadAndExtractDocs', () => {
    it('returns one page per skill and concatenates directory markdown with SKILL.md first', async () => {
      const ingester = new TestCairoSkillsIngester();
      ingester.setSkills([
        {
          id: 'dir-skill',
          url: 'https://github.com/acme/skills/tree/main/skills/dir-skill',
        },
        {
          id: 'file-skill',
          url: 'https://github.com/acme/skills/blob/1234abcd/skills/file-skill/SKILL.md',
        },
      ]);

      vi.spyOn(axios, 'get').mockImplementation(async (url: string | URL) => {
        const key = String(url);
        const responses: Record<string, unknown> = {
          'https://api.github.com/repos/acme/skills/contents/skills/dir-skill?ref=main':
            [
              {
                type: 'file',
                name: 'README.md',
                path: 'skills/dir-skill/README.md',
              },
              {
                type: 'file',
                name: 'SKILL.md',
                path: 'skills/dir-skill/SKILL.md',
              },
              {
                type: 'dir',
                name: 'extras',
                path: 'skills/dir-skill/extras',
              },
            ],
          'https://api.github.com/repos/acme/skills/contents/skills/dir-skill/extras?ref=main':
            [
              {
                type: 'file',
                name: 'notes.md',
                path: 'skills/dir-skill/extras/notes.md',
              },
            ],
          'https://api.github.com/repos/acme/skills/contents/skills/dir-skill/SKILL.md?ref=main':
            {
              type: 'file',
              name: 'SKILL.md',
              path: 'skills/dir-skill/SKILL.md',
              encoding: 'base64',
              content: toBase64('# Skill Main\nMain content'),
            },
          'https://api.github.com/repos/acme/skills/contents/skills/dir-skill/extras/notes.md?ref=main':
            {
              type: 'file',
              name: 'notes.md',
              path: 'skills/dir-skill/extras/notes.md',
              encoding: 'base64',
              content: toBase64('# Notes\nExtra content'),
            },
          'https://api.github.com/repos/acme/skills/contents/skills/dir-skill/README.md?ref=main':
            {
              type: 'file',
              name: 'README.md',
              path: 'skills/dir-skill/README.md',
              encoding: 'base64',
              content: toBase64('# Readme\nReadme content'),
            },
          'https://api.github.com/repos/acme/skills/contents/skills/file-skill/SKILL.md?ref=1234abcd':
            {
              type: 'file',
              name: 'SKILL.md',
              path: 'skills/file-skill/SKILL.md',
              encoding: 'base64',
              content: toBase64('# Single File\nOnly content'),
            },
        };

        if (!(key in responses)) {
          throw new Error(`Unexpected URL in test: ${key}`);
        }

        return { data: responses[key] } as any;
      });

      const pages = await ingester.exposedDownloadAndExtractDocs();

      expect(pages).toHaveLength(2);
      expect(pages.map((page) => page.name).sort()).toEqual([
        'dir-skill',
        'file-skill',
      ]);

      const directoryPage = pages.find((page) => page.name === 'dir-skill');
      expect(directoryPage).toBeDefined();
      expect(
        directoryPage?.content.startsWith('# Skill Main\nMain content'),
      ).toBe(true);
    });

    it('fetches markdown files in parallel while preserving order', async () => {
      const ingester = new TestCairoSkillsIngester();
      ingester.setSkills([
        {
          id: 'parallel-skill',
          url: 'https://github.com/acme/skills/tree/main/skills/parallel-skill',
        },
      ]);

      let inFlightRequests = 0;
      let maxInFlightRequests = 0;
      const contentByPath: Record<string, string> = {
        'skills/parallel-skill/SKILL.md': '# Skill Main\nMain content',
        'skills/parallel-skill/README.md': '# Readme\nReadme content',
        'skills/parallel-skill/notes.md': '# Notes\nNotes content',
      };

      vi.spyOn(axios, 'get').mockImplementation(async (url: string | URL) => {
        const key = String(url);

        if (
          key ===
          'https://api.github.com/repos/acme/skills/contents/skills/parallel-skill?ref=main'
        ) {
          return {
            data: [
              {
                type: 'file',
                name: 'README.md',
                path: 'skills/parallel-skill/README.md',
              },
              {
                type: 'file',
                name: 'SKILL.md',
                path: 'skills/parallel-skill/SKILL.md',
              },
              {
                type: 'file',
                name: 'notes.md',
                path: 'skills/parallel-skill/notes.md',
              },
            ],
          } as any;
        }

        const pathMatch = key.match(
          /^https:\/\/api\.github\.com\/repos\/acme\/skills\/contents\/(.+)\?ref=main$/,
        );
        if (!pathMatch || !pathMatch[1]) {
          throw new Error(`Unexpected URL in test: ${key}`);
        }

        const path = decodeURIComponent(pathMatch[1]);
        const fileContent = contentByPath[path];
        if (!fileContent) {
          throw new Error(`Unexpected file path in test: ${path}`);
        }

        inFlightRequests += 1;
        maxInFlightRequests = Math.max(maxInFlightRequests, inFlightRequests);
        await new Promise((resolve) => setTimeout(resolve, 10));
        inFlightRequests -= 1;

        return {
          data: {
            type: 'file',
            name: path.split('/').pop(),
            path,
            encoding: 'base64',
            content: toBase64(fileContent),
          },
        } as any;
      });

      const pages = await ingester.exposedDownloadAndExtractDocs();

      expect(pages).toHaveLength(1);
      expect(maxInFlightRequests).toBeGreaterThan(1);
      expect(pages[0]?.content).toBe(
        [
          '# Skill Main\nMain content',
          '# Notes\nNotes content',
          '# Readme\nReadme content',
        ].join('\n\n'),
      );
    });

    it('stops recursive directory traversal when maximum depth is exhausted', async () => {
      const ingester = new TestCairoSkillsIngester();
      ingester.setSkills([
        {
          id: 'deep-skill',
          url: 'https://github.com/acme/skills/tree/main/skills/deep-skill',
        },
      ]);

      const deepPathPrefix = 'skills/deep-skill';
      const tooDeepPath = `${deepPathPrefix}/level-1/level-2/level-3/level-4/level-5/level-6`;

      vi.spyOn(axios, 'get').mockImplementation(async (url: string | URL) => {
        const key = String(url);
        const responses: Record<string, unknown> = {
          [`https://api.github.com/repos/acme/skills/contents/${deepPathPrefix}?ref=main`]:
            [
              {
                type: 'file',
                name: 'SKILL.md',
                path: `${deepPathPrefix}/SKILL.md`,
              },
              {
                type: 'dir',
                name: 'level-1',
                path: `${deepPathPrefix}/level-1`,
              },
            ],
          [`https://api.github.com/repos/acme/skills/contents/${deepPathPrefix}/level-1?ref=main`]:
            [
              {
                type: 'dir',
                name: 'level-2',
                path: `${deepPathPrefix}/level-1/level-2`,
              },
            ],
          [`https://api.github.com/repos/acme/skills/contents/${deepPathPrefix}/level-1/level-2?ref=main`]:
            [
              {
                type: 'dir',
                name: 'level-3',
                path: `${deepPathPrefix}/level-1/level-2/level-3`,
              },
            ],
          [`https://api.github.com/repos/acme/skills/contents/${deepPathPrefix}/level-1/level-2/level-3?ref=main`]:
            [
              {
                type: 'dir',
                name: 'level-4',
                path: `${deepPathPrefix}/level-1/level-2/level-3/level-4`,
              },
            ],
          [`https://api.github.com/repos/acme/skills/contents/${deepPathPrefix}/level-1/level-2/level-3/level-4?ref=main`]:
            [
              {
                type: 'dir',
                name: 'level-5',
                path: `${deepPathPrefix}/level-1/level-2/level-3/level-4/level-5`,
              },
            ],
          [`https://api.github.com/repos/acme/skills/contents/${deepPathPrefix}/level-1/level-2/level-3/level-4/level-5?ref=main`]:
            [
              {
                type: 'dir',
                name: 'level-6',
                path: tooDeepPath,
              },
            ],
          [`https://api.github.com/repos/acme/skills/contents/${deepPathPrefix}/SKILL.md?ref=main`]:
            {
              type: 'file',
              name: 'SKILL.md',
              path: `${deepPathPrefix}/SKILL.md`,
              encoding: 'base64',
              content: toBase64('# Root Skill\nTop level only'),
            },
        };

        if (!(key in responses)) {
          throw new Error(`Unexpected URL in test: ${key}`);
        }

        return { data: responses[key] } as any;
      });

      const pages = await ingester.exposedDownloadAndExtractDocs();

      expect(pages).toHaveLength(1);
      expect(pages[0]?.name).toBe('deep-skill');
      expect(pages[0]?.content).toContain('# Root Skill\nTop level only');
      expect(pages[0]?.content).not.toContain('level-6');
      expect(axios.get).not.toHaveBeenCalledWith(
        `https://api.github.com/repos/acme/skills/contents/${tooDeepPath}?ref=main`,
        expect.anything(),
      );
    });
  });

  describe('createChunks', () => {
    it('creates search chunks and one full-doc row per skill with expected metadata', async () => {
      const ingester = new TestCairoSkillsIngester();
      ingester.setSkills([
        {
          id: 'skill-a',
          url: 'https://github.com/acme/skills/tree/main/skills/skill-a',
        },
      ]);

      const markdown = `---
name: "Skill A"
description: "A concise summary"
keywords: [cairo, testing]
---
# Intro
Line one.

## Details
Line two.`;

      const chunks = await ingester.exposedCreateChunks([
        {
          name: 'skill-a',
          content: markdown,
        },
      ]);

      const searchChunks = chunks.filter(
        (chunk) => chunk.metadata.chunkNumber >= 0,
      );
      expect(searchChunks.length).toBeGreaterThan(0);
      for (const chunk of searchChunks) {
        expect(chunk.metadata.source).toBe(DocumentSource.CAIRO_SKILLS);
        expect(chunk.metadata.skillId).toBe('skill-a');
        expect(chunk.metadata.chunkNumber).toBeGreaterThanOrEqual(0);
        expect(chunk.metadata.uniqueId).toMatch(/^skill-skill-a-\d+$/);
      }

      const fullDocRows = chunks.filter(
        (chunk) => chunk.metadata.chunkNumber === -1,
      );
      expect(fullDocRows).toHaveLength(1);
      expect(fullDocRows[0]?.metadata.uniqueId).toBe('skill-skill-a-full');
      expect(fullDocRows[0]?.pageContent).toBe('Skill A: A concise summary');
      expect(fullDocRows[0]?.pageContent.includes('# Intro')).toBe(false);
      expect(fullDocRows[0]?.metadata.fullContent).toBe(markdown);
    });
  });

  describe('cleanupDownloadedFiles', () => {
    it('does not throw', async () => {
      const ingester = new TestCairoSkillsIngester();
      await ingester.exposedCleanupDownloadedFiles();
      expect(true).toBe(true);
    });
  });
});
