const DEFAULT_CORELIB_BASE_URL = 'https://docs.starknet.io/build/corelib/';

export interface TraitFunctionDoc {
  name: string;
  description: string;
  signature: string;
}

export interface ParsedMdxDoc {
  title: string;
  description: string;
  signature: string;
  examples: string[];
  traitFunctions: TraitFunctionDoc[];
  sourceUrl: string;
  fileName: string;
}

interface FrontmatterResult {
  frontmatter: Record<string, string>;
  content: string;
}

function extractFrontmatter(content: string): FrontmatterResult {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
  const match = content.match(frontmatterRegex);
  if (!match) {
    return { frontmatter: {}, content };
  }

  const frontmatterContent = match[1] ?? '';
  const frontmatter: Record<string, string> = {};
  for (const line of frontmatterContent.split(/\r?\n/)) {
    const parsed = line.match(/^([A-Za-z0-9_-]+):\s*(.+)\s*$/);
    if (!parsed) {
      continue;
    }
    const key = parsed[1];
    const rawValue = parsed[2] ?? '';
    const value = rawValue.replace(/^['"]|['"]$/g, '');
    frontmatter[key] = value;
  }

  return {
    frontmatter,
    content: content.replace(frontmatterRegex, ''),
  };
}

function stripMdxNoise(content: string): string {
  return content.replace(/^import\s+.*$/gm, '').replace(/^export\s+.*$/gm, '');
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractFirstParagraph(content: string): string {
  const lines = content.split(/\r?\n/);
  let inCodeBlock = false;
  const paragraphLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) {
      continue;
    }

    if (trimmed === '') {
      if (paragraphLines.length > 0) {
        break;
      }
      continue;
    }

    if (trimmed.startsWith('#')) {
      if (paragraphLines.length > 0) {
        break;
      }
      continue;
    }

    paragraphLines.push(trimmed);
  }

  return normalizeWhitespace(paragraphLines.join(' '));
}

function extractSectionBody(content: string, heading: string): string {
  const headingRegex = new RegExp(`^##\\s+${escapeRegex(heading)}\\s*$`, 'im');
  const match = content.match(headingRegex);
  if (!match || match.index === undefined) {
    return '';
  }

  const startIndex = match.index + match[0].length;
  const afterHeading = content.slice(startIndex);
  const nextHeadingMatch = afterHeading.match(/^##\s+/m);
  const section = nextHeadingMatch
    ? afterHeading.slice(0, nextHeadingMatch.index)
    : afterHeading;
  return section.trim();
}

function extractCodeBlocks(content: string): string[] {
  const blocks: string[] = [];
  const codeRegex = /```[^\n]*\n([\s\S]*?)\n```/g;
  let match: RegExpExecArray | null;
  while ((match = codeRegex.exec(content)) !== null) {
    const block = match[1]?.trim();
    if (block) {
      blocks.push(block);
    }
  }
  return blocks;
}

function extractFirstCodeBlock(content: string): string {
  const blocks = extractCodeBlocks(content);
  return blocks[0] ?? '';
}

function parseTraitFunctions(sectionBody: string): TraitFunctionDoc[] {
  if (!sectionBody) {
    return [];
  }

  const functions: TraitFunctionDoc[] = [];
  const matches = [...sectionBody.matchAll(/^###\s+(.+)$/gm)];

  if (matches.length === 0) {
    return functions;
  }

  for (let i = 0; i < matches.length; i += 1) {
    const match = matches[i];
    if (match.index === undefined) {
      continue;
    }
    const name = (match[1] ?? '').trim();
    if (!name) {
      continue;
    }
    const startIndex = match.index + match[0].length;
    const endIndex = matches[i + 1]?.index ?? sectionBody.length;
    const body = sectionBody.slice(startIndex, endIndex);
    functions.push({
      name,
      description: extractFirstParagraph(body),
      signature: extractFirstCodeBlock(body),
    });
  }

  return functions;
}

function buildSourceUrl(fileName: string): string {
  const normalized = fileName.replace(/\\/g, '/');
  const withoutExtension = normalized.replace(/\.mdx$/i, '');
  return `${DEFAULT_CORELIB_BASE_URL}${withoutExtension}`;
}

export function parseMdxFile(content: string, fileName: string): ParsedMdxDoc {
  const { frontmatter, content: body } = extractFrontmatter(content);
  const cleaned = stripMdxNoise(body);

  const title = frontmatter.title ?? '';
  const description = extractFirstParagraph(cleaned);

  const signatureSection = extractSectionBody(cleaned, 'Signature');
  const signature = extractFirstCodeBlock(signatureSection);

  let examplesSection = extractSectionBody(cleaned, 'Examples');
  if (!examplesSection) {
    examplesSection = extractSectionBody(cleaned, 'Example');
  }
  const examples = extractCodeBlocks(examplesSection);

  let traitSection = extractSectionBody(cleaned, 'Trait functions');
  if (!traitSection) {
    traitSection = extractSectionBody(cleaned, 'Trait Functions');
  }
  const traitFunctions = parseTraitFunctions(traitSection);

  return {
    title: title || '',
    description,
    signature,
    examples,
    traitFunctions,
    sourceUrl: buildSourceUrl(fileName),
    fileName,
  };
}
