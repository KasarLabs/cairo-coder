import { logger } from './logger';

// Public API interfaces
/**
 * Options controlling how markdown is split into chunks. Two high-level modes exist:
 *
 * - Default mode (splitFullPage: false):
 *   Recursively splits by headers (per headerLevels), paragraphs, and lines to respect
 *   maxChars. Applies minChars-based merging and backward overlap. Avoids splitting
 *   inside non-breakable code fences when possible.
 *
 */
export interface SplitOptions {
  /** Maximum characters per chunk (UTF-16 .length), not counting overlap. Default: 2048 */
  maxChars?: number;
  /** Minimum characters per chunk. Chunks smaller than this will be merged with adjacent chunks. Default: 500 */
  minChars?: number;
  /** Characters of backward overlap between consecutive chunks. Default: 256 */
  overlap?: number;
  /** Which header levels are allowed as primary split points. Default: [1, 2] */
  headerLevels?: (1 | 2 | 3)[];
  /** If true, do not split inside fenced code blocks. Default: true */
  preserveCodeBlocks?: boolean;
  /** If a fenced code block exceeds this size, allow splitting inside it (fallback). Default: 2x maxChars */
  codeBlockMaxChars?: number;
  /** If a new opening fence appears while one is open, fallback-close the previous block. Default: true */
  fallbackCloseOnNestedOpen?: boolean;
  /** Optional prefix for generated unique IDs */
  idPrefix?: string;
  /** Whether to trim whitespace around chunks. Default: true */
  trim?: boolean;
}

export interface ChunkMeta {
  /** Title derived from the last seen header among the configured levels */
  title: string;
  /** Index of this chunk for the given title (0-based) */
  chunkNumber: number;
  /** Globally unique ID: `${slug(title)}-${chunkNumber}` (plus idPrefix if provided) */
  uniqueId: string;
  /** Inclusive start & exclusive end character offsets in the original string */
  startChar: number;
  endChar: number;
  /** Full header path stack (e.g., ["Intro", "Goals"]) */
  headerPath: string[];
  /** Optional source URL inferred from special "Sources" blocks */
  sourceLink?: string;
}

export interface Chunk {
  content: string;
  meta: ChunkMeta;
}

// Internal data structures
interface HeaderToken {
  level: number; // 1..6
  text: string;
  start: number; // index in original string
  end: number;
}

interface CodeBlockToken {
  start: number;
  end: number;
  fenceChar: '`' | '~';
  fenceLen: number;
  closed: boolean;
  breakable: boolean;
  infoString?: string; // e.g. "ts", "python"
}

interface Segment {
  start: number;
  end: number;
}

interface Tokens {
  headers: HeaderToken[];
  codeBlocks: CodeBlockToken[];
  sourceRanges: Array<{ start: number; end: number; url: string }>;
}

/**
 * Splits markdown into semantic chunks with metadata.
 *
 * Modes
 * - Default: recursive splitting by headers/paragraphs/lines to satisfy maxChars, with overlap and
 *   minChars-based merging, while respecting code blocks.
 */
export class RecursiveMarkdownSplitter {
  private readonly options: Required<SplitOptions>;

  constructor(options: SplitOptions = {}) {
    this.options = {
      maxChars: options.maxChars ?? 2048,
      minChars: options.minChars ?? 500,
      overlap: options.overlap ?? 256,
      headerLevels: options.headerLevels ?? [1, 2],
      preserveCodeBlocks: options.preserveCodeBlocks ?? true,
      codeBlockMaxChars:
        options.codeBlockMaxChars ?? (options.maxChars ?? 2048) * 2,
      fallbackCloseOnNestedOpen: options.fallbackCloseOnNestedOpen ?? true,
      idPrefix: options.idPrefix ?? '',
      trim: options.trim ?? true,
    };

    // Validate options
    if (this.options.maxChars <= 0) {
      throw new Error(
        `maxChars must be positive, got ${this.options.maxChars}`,
      );
    }
    if (this.options.minChars < 0) {
      throw new Error(
        `minChars must be non-negative, got ${this.options.minChars}`,
      );
    }
    if (this.options.overlap < 0) {
      throw new Error(
        `overlap must be non-negative, got ${this.options.overlap}`,
      );
    }
    if (this.options.overlap >= this.options.maxChars) {
      throw new Error(
        `Overlap (${this.options.overlap}) must be less than maxChars (${this.options.maxChars})`,
      );
    }
    if (this.options.minChars >= this.options.maxChars) {
      throw new Error(
        `minChars (${this.options.minChars}) must be less than maxChars (${this.options.maxChars})`,
      );
    }
    if (this.options.headerLevels.length === 0) {
      throw new Error('headerLevels must contain at least one level');
    }
    if (this.options.headerLevels.some((level) => level < 1 || level > 6)) {
      throw new Error('headerLevels must contain values between 1 and 6');
    }
  }

  /**
   * Split markdown into chunks
   */
  public splitMarkdownToChunks(markdown: string): Chunk[] {
    // Handle empty input
    if (!markdown || markdown.trim().length === 0) {
      return [];
    }

    // Normalize line endings
    const normalizedMarkdown = markdown.replace(/\r\n/g, '\n');

    // Tokenize the markdown
    const tokens = this.tokenize(normalizedMarkdown);

    // Recursively split into segments
    const rootSegment: Segment = { start: 0, end: normalizedMarkdown.length };
    const segments = this.recursivelySplit(
      rootSegment,
      normalizedMarkdown,
      tokens,
    );

    // Merge small segments to avoid tiny chunks
    const mergedSegments = this.mergeSmallSegments(
      segments,
      normalizedMarkdown,
      tokens.codeBlocks,
    );

    // Apply overlap and assemble chunks
    const rawChunks = this.assembleChunksWithOverlap(
      mergedSegments,
      normalizedMarkdown,
      tokens.codeBlocks,
    );

    // Remove empty chunks
    const nonEmptyChunks = rawChunks.filter(
      (chunk) => chunk.content.trim().length > 0,
    );

    // Attach metadata
    return this.attachMetadata(
      nonEmptyChunks,
      normalizedMarkdown,
      tokens.headers,
      tokens.sourceRanges,
    );
  }

  /**
   * Tokenize markdown to extract headers and code blocks
   */
  private tokenize(markdown: string): Tokens {
    const headers: HeaderToken[] = [];
    const codeBlocks: CodeBlockToken[] = [];
    const sourceRanges = this.parseSourceRanges(markdown);

    // Find all headers
    // Allow up to 3 leading spaces before ATX headers per CommonMark
    const headerRegex = /^\s{0,3}(#{1,6})\s+(.+?)(?:\s*#*)?$/gm;
    let match: RegExpExecArray | null;

    while ((match = headerRegex.exec(markdown)) !== null) {
      const level = match[1]!.length;
      const text = match[2]!.trim();
      const start = match.index;
      const end = match.index + match[0].length;

      headers.push({ level, text, start, end });
    }

    // Find all code blocks
    this.findCodeBlocks(markdown, codeBlocks);

    // Filter out headers that are inside non-breakable code blocks
    // Allow headers inside oversized or malformed (breakable) code blocks
    const filteredHeaders = headers.filter((header) => {
      return !codeBlocks.some(
        (block) =>
          header.start >= block.start &&
          header.end <= block.end &&
          !block.breakable,
      );
    });

    return { headers: filteredHeaders, codeBlocks, sourceRanges };
  }

  /**
   * Parse Sources blocks and compute active source ranges used for meta.sourceLink.
   *
   * Format:
   * ---\n
   * Sources:\n
   * - https://example.com/a\n
   * - https://example.com/b\n
   * ---
   *
   * The active source becomes the first URL in the list and applies from the end of the closing
   * '---' until the start of the next Sources block (or EOF). This mapping is used during metadata
   * attachment to set the chunk's sourceLink.
   */
  private parseSourceRanges(
    markdown: string,
  ): Array<{ start: number; end: number; url: string }> {
    const lines = markdown.split('\n');
    const ranges: Array<{ start: number; end: number; url: string }> = [];

    // Build cumulative char index per line start
    const lineStartIdx: number[] = new Array(lines.length);
    let acc = 0;
    for (let i = 0; i < lines.length; i++) {
      lineStartIdx[i] = acc;
      acc += lines[i]!.length + 1; // +1 for \n
    }

    const isDashLine = (s: string) => /^\s*---\s*$/.test(s);
    const isSourcesHeader = (s: string) => /^\s*Sources:\s*$/i.test(s);
    const firstUrlInList = (startLine: number): string | undefined => {
      for (let j = startLine; j < lines.length; j++) {
        const l = lines[j]!;
        if (isDashLine(l)) break; // stop at closing ---
        const m = l.match(/^\s*[-*]\s+(\S+)/);
        if (m) {
          const url = m[1]!;
          if (/^https?:\/\//i.test(url)) return url;
        }
      }
      return undefined;
    };

    // Locate all source blocks (start/end + first URL)
    const blocks: Array<{
      blockStartLine: number;
      blockEndLine: number;
      firstUrl?: string;
    }> = [];
    for (let i = 0; i < lines.length; i++) {
      if (!isDashLine(lines[i]!)) continue;
      // Scan ahead for Sources: header within the dashed block
      let j = i + 1;
      // Skip blank lines
      while (j < lines.length && /^\s*$/.test(lines[j]!)) j++;
      if (j < lines.length && isSourcesHeader(lines[j]!)) {
        // Find closing ---
        let k = j + 1;
        while (k < lines.length && !isDashLine(lines[k]!)) k++;
        if (k < lines.length && isDashLine(lines[k]!)) {
          const firstUrl = firstUrlInList(j + 1);
          blocks.push({ blockStartLine: i, blockEndLine: k, firstUrl });
          i = k; // advance to end of block
        }
      }
    }

    // Build ranges from blocks
    if (blocks.length === 0) return ranges;
    const docLen = markdown.length;
    for (let b = 0; b < blocks.length; b++) {
      const block = blocks[b]!;
      const nextBlock = blocks[b + 1];

      const blockEndLineIdx = block.blockEndLine;
      const blockEndAbs = lineStartIdx[blockEndLineIdx] ?? 0;
      const blockEndLineStr = lines[blockEndLineIdx] ?? '';
      const start = blockEndAbs + blockEndLineStr.length + 1; // after closing --- newline

      const nextStart = nextBlock
        ? (lineStartIdx[nextBlock.blockStartLine] ?? docLen)
        : docLen;

      const url = block.firstUrl || '';
      if (url && start < nextStart) {
        ranges.push({ start, end: nextStart, url });
      }
    }

    return ranges;
  }

  /**
   * Find all fenced code blocks in the markdown
   */
  private findCodeBlocks(markdown: string, codeBlocks: CodeBlockToken[]): void {
    const lines = markdown.split('\n');
    let inCodeBlock = false;
    let currentBlock:
      | (Partial<CodeBlockToken> & { fenceChar: '`' | '~'; fenceLen: number })
      | null = null;
    let charIndex = 0;

    const openRe = /^\s{0,3}([`~]{3,})(.*)$/; // allow up to 3 leading spaces
    const makeCloseRe = (ch: '`' | '~', n: number) =>
      new RegExp(`^\\s{0,3}(${ch === '`' ? '\\`' : '~'}{${n},})\\s*$`);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] as string;
      const open = line.match(openRe);

      if (!inCodeBlock) {
        if (open) {
          const fenceStr = open[1] as string;
          const ch = (fenceStr[0] === '`' ? '`' : '~') as '`' | '~';
          const len = fenceStr.length;
          const info = (open[2] || '').trim() || undefined;
          inCodeBlock = true;
          currentBlock = {
            start: charIndex,
            fenceChar: ch,
            fenceLen: len,
            infoString: info,
          };
        }
      } else {
        const ch = currentBlock!.fenceChar;
        const n = currentBlock!.fenceLen;
        const closeRe = makeCloseRe(ch, n);
        if (closeRe.test(line)) {
          const end = charIndex + line.length;
          const token: CodeBlockToken = {
            start: currentBlock!.start!,
            end,
            fenceChar: ch,
            fenceLen: n,
            closed: true,
            breakable: false,
            infoString: currentBlock!.infoString,
          };
          codeBlocks.push(token);
          inCodeBlock = false;
          currentBlock = null;
        } else if (this.options.fallbackCloseOnNestedOpen && open) {
          // Nested opening while open: fallback-close previous as malformed
          const end = Math.max(0, charIndex - 1);
          const malformed: CodeBlockToken = {
            start: currentBlock!.start!,
            end,
            fenceChar: currentBlock!.fenceChar,
            fenceLen: currentBlock!.fenceLen,
            closed: false,
            breakable: true,
            infoString: currentBlock!.infoString,
          };
          codeBlocks.push(malformed);

          // Start new block at current line
          const fenceStr = open[1] as string;
          const ch2 = (fenceStr[0] === '`' ? '`' : '~') as '`' | '~';
          const len2 = fenceStr.length;
          const info2 = (open[2] || '').trim() || undefined;
          currentBlock = {
            start: charIndex,
            fenceChar: ch2,
            fenceLen: len2,
            infoString: info2,
          };
          inCodeBlock = true;
        }
      }

      charIndex += line.length + 1;
    }

    if (currentBlock && inCodeBlock) {
      logger.warn('Unclosed code block detected (EOF). Marking as breakable');
      const token: CodeBlockToken = {
        start: currentBlock.start!,
        end: markdown.length,
        fenceChar: currentBlock.fenceChar,
        fenceLen: currentBlock.fenceLen,
        closed: false,
        breakable: true,
        infoString: currentBlock.infoString,
      };
      codeBlocks.push(token);
    }

    // Set breakable on large closed blocks
    const maxSize = this.options.codeBlockMaxChars ?? this.options.maxChars * 2;
    for (const b of codeBlocks) {
      if (b.closed) {
        const size = b.end - b.start;
        if (size > maxSize) b.breakable = true;
      }
    }
  }

  /**
   * Recursively split a segment into smaller segments
   */
  private recursivelySplit(
    segment: Segment,
    markdown: string,
    tokens: Tokens,
  ): Segment[] {
    const segmentText = markdown.slice(segment.start, segment.end);

    // Base case: segment is within size limit
    if (segmentText.length <= this.options.maxChars) {
      return [segment];
    }

    // Try to split by headers
    const headerSplits = this.splitByHeaders(segment, markdown, tokens);
    if (headerSplits.length > 1) {
      return headerSplits.flatMap((s) =>
        this.recursivelySplit(s, markdown, tokens),
      );
    }

    // Try to split by paragraphs
    const paragraphSplits = this.splitByParagraphs(
      segment,
      markdown,
      tokens.codeBlocks,
    );
    if (paragraphSplits.length > 1) {
      return paragraphSplits.flatMap((s) =>
        this.recursivelySplit(s, markdown, tokens),
      );
    }

    // Try to split by lines
    const lineSplits = this.splitByLines(segment, markdown, tokens.codeBlocks);
    if (lineSplits.length > 1) {
      return lineSplits.flatMap((s) =>
        this.recursivelySplit(s, markdown, tokens),
      );
    }

    // Cannot split further - return as is (may exceed maxChars)
    if (segmentText.length > this.options.maxChars) {
      // Check if it's a single code block
      const isCodeBlock = tokens.codeBlocks.some(
        (block) => block.start <= segment.start && block.end >= segment.end,
      );
      if (isCodeBlock) {
        logger.warn(
          `Code block exceeds maxChars (${segmentText.length} > ${this.options.maxChars})`,
        );
      } else {
        logger.warn(
          `Segment exceeds maxChars and cannot be split further (${segmentText.length} > ${this.options.maxChars})`,
        );
      }
    }

    return [segment];
  }

  /**
   * Try to split segment by headers
   */
  private splitByHeaders(
    segment: Segment,
    markdown: string,
    tokens: Tokens,
  ): Segment[] {
    // Find headers within this segment that are configured split levels
    const segmentHeaders = tokens.headers.filter(
      (h) =>
        h.start >= segment.start &&
        h.end <= segment.end &&
        this.options.headerLevels.includes(h.level as 1 | 2 | 3),
    );

    if (segmentHeaders.length === 0) {
      return [segment];
    }

    // Sort by position
    segmentHeaders.sort((a, b) => a.start - b.start);

    const segments: Segment[] = [];

    // Handle content before first header
    if (segmentHeaders[0]!.start > segment.start) {
      segments.push({ start: segment.start, end: segmentHeaders[0]!.start });
    }

    // Process each header
    for (let i = 0; i < segmentHeaders.length; i++) {
      const header = segmentHeaders[i]!;
      const nextHeader =
        i + 1 < segmentHeaders.length ? segmentHeaders[i + 1] : null;

      // Determine where this header's section ends
      const sectionEnd = nextHeader ? nextHeader.start : segment.end;

      // Create segment starting from this header
      segments.push({ start: header.start, end: sectionEnd });
    }

    // Validate: ensure complete coverage with no gaps or overlaps
    if (segments.length > 0) {
      // Check first segment starts at segment beginning
      if (segments[0]!.start !== segment.start) {
        logger.error(
          `First segment doesn't start at segment beginning: ${segments[0]!.start} vs ${segment.start}`,
        );
      }

      // Check last segment ends at segment end
      if (segments[segments.length - 1]!.end !== segment.end) {
        logger.error(
          `Last segment doesn't end at segment end: ${segments[segments.length - 1]!.end} vs ${segment.end}`,
        );
      }

      // Check for gaps or overlaps between consecutive segments
      for (let i = 1; i < segments.length; i++) {
        if (segments[i]!.start !== segments[i - 1]!.end) {
          logger.error(
            `Gap or overlap detected between segments: ${segments[i - 1]!.end} to ${segments[i]!.start}`,
          );
        }
      }
    }

    return segments.length > 1 ? segments : [segment];
  }

  /**
   * Try to split segment by paragraphs (double newlines)
   */
  private splitByParagraphs(
    segment: Segment,
    markdown: string,
    codeBlocks: CodeBlockToken[],
  ): Segment[] {
    const segmentText = markdown.slice(segment.start, segment.end);
    const segments: Segment[] = [];

    // Find paragraph boundaries (double newlines)
    const paragraphRegex = /\n\n+/g;
    let currentStart = 0;
    let match: RegExpExecArray | null;
    const splitPoints: number[] = [];

    // Collect all valid split points
    while ((match = paragraphRegex.exec(segmentText)) !== null) {
      const splitPointAbs = segment.start + match.index + match[0].length;
      const enclosing = this.getEnclosingCodeBlock(splitPointAbs, codeBlocks);
      if (!enclosing || enclosing.breakable) {
        splitPoints.push(match.index + match[0].length);
      }
    }

    // Create segments based on split points
    for (const splitPoint of splitPoints) {
      segments.push({
        start: segment.start + currentStart,
        end: segment.start + splitPoint,
      });
      currentStart = splitPoint;
    }

    // Add final segment if there's remaining content
    if (currentStart < segmentText.length) {
      segments.push({
        start: segment.start + currentStart,
        end: segment.end,
      });
    }

    return segments.length > 1 ? segments : [segment];
  }

  /**
   * Try to split segment by lines
   */
  private splitByLines(
    segment: Segment,
    markdown: string,
    codeBlocks: CodeBlockToken[],
  ): Segment[] {
    const segmentText = markdown.slice(segment.start, segment.end);
    const lines = segmentText.split('\n');
    const segments: Segment[] = [];

    let currentStart = segment.start;
    let currentLength = 0;
    let lineStart = segment.start;

    for (let i = 0; i < lines.length; i++) {
      const lineLength = lines[i]!.length + 1; // +1 for newline

      if (
        currentLength + lineLength > this.options.maxChars &&
        currentLength > 0
      ) {
        // Check if we can split here
        const enclosing = this.getEnclosingCodeBlock(lineStart, codeBlocks);
        if (!enclosing || enclosing.breakable) {
          segments.push({
            start: currentStart,
            end: lineStart,
          });
          currentStart = lineStart;
          currentLength = lineLength;
        } else {
          currentLength += lineLength;
        }
      } else {
        currentLength += lineLength;
      }

      lineStart += lineLength;
    }

    // Add final segment
    if (currentStart < segment.end) {
      segments.push({
        start: currentStart,
        end: segment.end,
      });
    }

    return segments.length > 1 ? segments : [segment];
  }

  /**
   * Check if a position is inside a code block
   */
  private isInsideCodeBlock(
    position: number,
    codeBlocks: CodeBlockToken[],
  ): boolean {
    return this.getEnclosingCodeBlock(position, codeBlocks) !== null;
  }

  private getEnclosingCodeBlock(
    position: number,
    codeBlocks: CodeBlockToken[],
  ): CodeBlockToken | null {
    for (const block of codeBlocks) {
      if (position > block.start && position < block.end) return block;
    }
    return null;
  }

  /**
   * Merge segments that are too small with adjacent segments
   */
  private mergeSmallSegments(
    segments: Segment[],
    markdown: string,
    codeBlocks: CodeBlockToken[],
  ): Segment[] {
    if (segments.length <= 1) return segments;

    const mergedSegments: Segment[] = [];
    let currentSegment: Segment | null = null;

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]!;
      const segmentLength = segment.end - segment.start;
      const isLastSegment = i === segments.length - 1;

      if (currentSegment === null) {
        currentSegment = { ...segment };
      } else {
        const currentLength = currentSegment.end - currentSegment.start;
        const combinedLength =
          currentSegment.end - currentSegment.start + segmentLength;

        // Determine if we should merge
        const shouldMerge =
          // Either segment is too small
          ((segmentLength < this.options.minChars ||
            currentLength < this.options.minChars) &&
            // And merging won't exceed maxChars
            combinedLength <= this.options.maxChars) ||
          // OR this is the last segment and it's too small
          (isLastSegment && segmentLength < this.options.minChars);

        if (shouldMerge) {
          // Merge by extending current segment
          currentSegment.end = segment.end;
        } else {
          // Don't merge - push current and start new
          mergedSegments.push(currentSegment);
          currentSegment = { ...segment };
        }
      }
    }

    // Don't forget the last segment
    if (currentSegment !== null) {
      // Special handling for final segment if it's still too small
      const currentLength = currentSegment.end - currentSegment.start;
      if (currentLength < this.options.minChars && mergedSegments.length > 0) {
        // Try to merge with previous segment
        const lastMerged = mergedSegments[mergedSegments.length - 1]!;
        const combinedLength =
          lastMerged.end - lastMerged.start + currentLength;

        if (combinedLength <= this.options.maxChars * 1.5) {
          // Allow some flexibility for the final merge to avoid tiny final chunks
          lastMerged.end = currentSegment.end;
        } else {
          // Can't merge without significantly exceeding limits
          mergedSegments.push(currentSegment);
        }
      } else {
        mergedSegments.push(currentSegment);
      }
    }

    // Final pass: adjust boundaries so that no segment starts or ends inside a non-breakable code block,
    // and ensure segments are non-overlapping and ordered.
    const finalSegments: Segment[] = [];
    let prevEnd: number | null = null;

    for (const segment of mergedSegments) {
      let start = segment.start;
      let end = segment.end;

      // If end falls inside a non-breakable code block, advance it to the block end
      for (const block of codeBlocks) {
        if (end > block.start && end < block.end && !block.breakable) {
          end = block.end;
          break;
        }
      }

      // If start falls inside a non-breakable code block, move start to the block end
      for (const block of codeBlocks) {
        if (start > block.start && start < block.end && !block.breakable) {
          start = block.end;
          break;
        }
      }

      // Ensure monotonic, non-overlapping segments
      if (prevEnd !== null && start < prevEnd) {
        start = prevEnd;
      }

      if (start < end) {
        finalSegments.push({ start, end });
        prevEnd = end;
      }
    }

    return finalSegments;
  }

  /**
   * Assemble chunks with overlap handling
   */
  private assembleChunksWithOverlap(
    segments: Segment[],
    markdown: string,
    codeBlocks: CodeBlockToken[],
  ): Array<{
    content: string;
    start: number;
    end: number;
    overlapStart?: number;
  }> {
    if (segments.length === 0) return [];

    const chunks: Array<{
      content: string;
      start: number;
      end: number;
      overlapStart?: number;
    }> = [];

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]!;

      // Compute absolute start with overlap, but never start inside a non-breakable code block
      let chunkStartAbs = segment.start;
      if (i > 0 && this.options.overlap > 0) {
        const prevSegment = segments[i - 1]!;
        const desired = Math.max(
          prevSegment.end -
            Math.min(this.options.overlap, prevSegment.end - prevSegment.start),
          prevSegment.start,
        );
        chunkStartAbs = desired;
        const enclosing = this.getEnclosingCodeBlock(chunkStartAbs, codeBlocks);
        if (enclosing && !enclosing.breakable) {
          // Move start to end of the enclosing non-breakable block
          chunkStartAbs = enclosing.end;
        }
      }

      // Extract content from chunkStartAbs to segment.end
      let content = markdown.slice(chunkStartAbs, segment.end);

      chunks.push({
        content: this.options.trim ? content.trim() : content,
        start: chunkStartAbs,
        end: segment.end,
        overlapStart: i > 0 ? segment.start : undefined,
      });
    }

    return chunks;
  }

  /**
   * Attach metadata to chunks
   */
  private attachMetadata(
    rawChunks: Array<{ content: string; start: number; end: number }>,
    markdown: string,
    headers: HeaderToken[],
    sourceRanges?: Array<{ start: number; end: number; url: string }>,
  ): Chunk[] {
    const chunks: Chunk[] = [];
    const titleCounts = new Map<string, number>();

    for (const rawChunk of rawChunks) {
      // Determine title from the deepest configured header level that applies
      let title = 'ROOT';
      let headerPath: string[] = [];

      // Build full header path from all headers strictly before the end of this chunk
      // Do not include a header that starts exactly at the end boundary; it belongs to the next segment.
      const allHeadersBeforeOrAtEnd = headers.filter(
        (h) => h.start < rawChunk.end,
      );
      const headerStack: { level: number; text: string }[] = [];

      for (const header of allHeadersBeforeOrAtEnd) {
        // Pop headers from stack that are same or lower level
        while (
          headerStack.length > 0 &&
          headerStack[headerStack.length - 1]!.level >= header.level
        ) {
          headerStack.pop();
        }
        headerStack.push({ level: header.level, text: header.text });
      }

      headerPath = headerStack.map((h) => h.text);

      // Prefer the deepest header among the configured levels (e.g., H2 if [1,2])
      let preferredTitle: string | undefined;
      for (let i = headerStack.length - 1; i >= 0; i--) {
        const lvl = headerStack[i]!.level as 1 | 2 | 3;
        if (this.options.headerLevels.includes(lvl)) {
          preferredTitle = headerStack[i]!.text;
          break;
        }
      }

      if (preferredTitle) {
        title = preferredTitle;
      } else if (headerStack.length > 0) {
        // Fallback to the deepest header regardless of level if none match configured levels
        title = headerStack[headerStack.length - 1]!.text;
      }

      // Track chunk numbers per title (0-based)
      const count = titleCounts.get(title) || 0;
      titleCounts.set(title, count + 1);

      // Generate unique ID using 0-based numbering
      const slug = this.slugify(title);
      const uniqueId = this.options.idPrefix
        ? `${this.options.idPrefix}-${slug}-${count}`
        : `${slug}-${count}`;

      // Determine sourceLink based on active source ranges.
      // Strategy:
      // 1) Prefer a range that contains the anchor position (segment start if available, else chunk start)
      // 2) Otherwise, if any range starts within this chunk, select the last one (closest to chunk end)
      // 3) Otherwise, if any range overlaps this chunk at all, select the one with the latest start
      let sourceLink: string | undefined = undefined;
      if (sourceRanges && sourceRanges.length > 0) {
        const anchorPos = (rawChunk as any).overlapStart ?? rawChunk.start;

        // Step 1: range that contains anchor
        let active = sourceRanges.find(
          (r) => anchorPos >= r.start && anchorPos < r.end,
        );

        // Step 2: range that starts within the chunk [start, end)
        if (!active) {
          let candidate:
            | { start: number; end: number; url: string }
            | undefined;
          for (const r of sourceRanges) {
            if (r.start >= rawChunk.start && r.start < rawChunk.end) {
              if (!candidate || r.start > candidate.start) candidate = r;
            }
          }
          if (candidate) active = candidate;
        }

        // Step 3: any overlapping range; choose the one with the latest start
        if (!active) {
          let candidate:
            | { start: number; end: number; url: string }
            | undefined;
          for (const r of sourceRanges) {
            const overlaps = r.start < rawChunk.end && r.end > rawChunk.start;
            if (overlaps) {
              if (!candidate || r.start > candidate.start) candidate = r;
            }
          }
          if (candidate) active = candidate;
        }

        if (active) {
          sourceLink = active.url;
        }
      }

      logger.debug(`Chunk Title: ${title}, Source link: ${sourceLink}`);

      chunks.push({
        content: rawChunk.content,
        meta: {
          title,
          chunkNumber: count,
          uniqueId,
          startChar: rawChunk.start,
          endChar: rawChunk.end,
          headerPath,
          sourceLink,
        },
      });
    }

    return chunks;
  }

  /**
   * Convert a string to a slug
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove non-word characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }
}

// Export the main function as well for convenience
export function splitMarkdownToChunks(
  markdown: string,
  opts?: SplitOptions,
): Chunk[] {
  const splitter = new RecursiveMarkdownSplitter(opts);
  return splitter.splitMarkdownToChunks(markdown);
}
