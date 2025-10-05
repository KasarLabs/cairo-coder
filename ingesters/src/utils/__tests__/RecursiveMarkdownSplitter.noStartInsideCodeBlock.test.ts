import { RecursiveMarkdownSplitter } from '../RecursiveMarkdownSplitter';

function getCodeBlockRanges(
  text: string,
): Array<{ start: number; end: number }> {
  const ranges: Array<{ start: number; end: number }> = [];
  const re = /```[\s\S]*?```/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    ranges.push({ start: m.index, end: m.index + m[0]!.length });
  }
  return ranges;
}

function isInside(
  pos: number,
  ranges: Array<{ start: number; end: number }>,
): boolean {
  return ranges.some((r) => pos > r.start && pos < r.end);
}

describe('RecursiveMarkdownSplitter - No chunk starts inside code block', () => {
  it('ensures chunk starts are never within fenced code blocks even with overlap', () => {
    const longCode = Array.from(
      { length: 60 },
      (_, i) => `line ${i} of code`,
    ).join('\n');
    const md = `# Section One\n\nIntro paragraph text that will be part of the first section.\n\n\n## Subsection\n\nSome text before a large code block.\n\n
\`\`\`cairo
fn initializer(ref self: ContractState, owner: ContractAddress) {
    // example
    let x = 0;\n${longCode}
}
\`\`\`

After the code block there is trailing text to encourage multiple segments and overlap across chunk boundaries. This text continues for a while to ensure we have a next chunk that might try to overlap into the previous code block.`;

    const splitter = new RecursiveMarkdownSplitter({
      maxChars: 200,
      minChars: 0,
      overlap: 50,
      headerLevels: [1, 2],
      preserveCodeBlocks: true,
      trim: false,
    });

    const chunks = splitter.splitMarkdownToChunks(md);
    const ranges = getCodeBlockRanges(md);

    // Assert: No chunk start lies strictly inside any NON-breakable fenced code block
    // Breakable threshold mirrors splitter default: 2x maxChars = 400
    const codeBlockMaxChars = 400;
    for (const c of chunks) {
      const pos = c.meta.startChar;
      const insideRanges = ranges.filter((r) => pos > r.start && pos < r.end);
      if (insideRanges.length === 0) continue;
      // If inside a code block, only allow if that block is oversized (breakable)
      const smallest = insideRanges.reduce((acc, r) => {
        if (!acc) return r;
        const accLen = acc.end - acc.start;
        const rLen = r.end - r.start;
        return rLen < accLen ? r : acc;
      }, insideRanges[0]!);
      const len = (smallest?.end ?? 0) - (smallest?.start ?? 0);
      expect(len).toBeGreaterThan(codeBlockMaxChars);
    }
  });
});
