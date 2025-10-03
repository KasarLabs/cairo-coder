import { logger } from './logger';

// Public API interfaces
export interface SplitOptions {
  /** Maximum characters per chunk (UTF-16 .length), not counting overlap. Default: 2048 */
  maxChars?: number;
  /** Minimum characters per chunk. Chunks smaller than this will be merged with adjacent chunks. Default: 500 */
  minChars?: number;
  /** Characters of backward overlap between consecutive chunks. Default: 256 */
  overlap?: number;
  /** Which header levels are allowed as primary split points. Default: [1, 2] */
  headerLevels?: (1 | 2)[];
  /** If true, do not split inside fenced code blocks. Default: true */
  preserveCodeBlocks?: boolean;
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
  fence: '```' | '~~~';
  infoString?: string; // e.g. "ts", "python"
}

interface Segment {
  start: number;
  end: number;
}

interface Tokens {
  headers: HeaderToken[];
  codeBlocks: CodeBlockToken[];
}

export class RecursiveMarkdownSplitter {
  private readonly options: Required<SplitOptions>;

  constructor(options: SplitOptions = {}) {
    this.options = {
      maxChars: options.maxChars ?? 2048,
      minChars: options.minChars ?? 500,
      overlap: options.overlap ?? 256,
      headerLevels: options.headerLevels ?? [1, 2],
      preserveCodeBlocks: options.preserveCodeBlocks ?? true,
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
   * Main entry point to split markdown into chunks
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
    );
  }

  /**
   * Tokenize markdown to extract headers and code blocks
   */
  private tokenize(markdown: string): Tokens {
    const headers: HeaderToken[] = [];
    const codeBlocks: CodeBlockToken[] = [];

    // Find all headers
    const headerRegex = /^(#{1,6})\s+(.+?)(?:\s*#*)?$/gm;
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

    // Filter out headers that are inside code blocks
    const filteredHeaders = headers.filter((header) => {
      return !codeBlocks.some(
        (block) => header.start >= block.start && header.end <= block.end,
      );
    });

    return { headers: filteredHeaders, codeBlocks };
  }

  /**
   * Find all fenced code blocks in the markdown
   */
  private findCodeBlocks(markdown: string, codeBlocks: CodeBlockToken[]): void {
    const lines = markdown.split('\n');
    let inCodeBlock = false;
    let currentBlock: Partial<CodeBlockToken> | null = null;
    let charIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const fenceMatch = line!.match(/^(```+|~~~+)(.*)$/);

      if (fenceMatch) {
        const fence = fenceMatch[1]!.substring(0, 3) as '```' | '~~~';

        if (!inCodeBlock) {
          // Starting a code block
          inCodeBlock = true;
          currentBlock = {
            start: charIndex,
            fence,
            infoString: fenceMatch[2]!.trim() || undefined,
          };
        } else if (currentBlock && line!.startsWith(currentBlock.fence!)) {
          // Ending a code block
          currentBlock.end = charIndex + line!.length;
          codeBlocks.push(currentBlock as CodeBlockToken);
          inCodeBlock = false;
          currentBlock = null;
        }
      }

      charIndex += line!.length + 1; // +1 for newline
    }

    // Handle unclosed code block
    if (currentBlock && inCodeBlock) {
      logger.warn(
        'Unclosed code block detected, treating remaining content as plain text',
      );
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
        this.options.headerLevels.includes(h.level as 1 | 2),
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
      const splitPoint = segment.start + match.index + match[0].length;
      // Check if split point is inside a code block
      if (!this.isInsideCodeBlock(splitPoint, codeBlocks)) {
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
        if (!this.isInsideCodeBlock(lineStart, codeBlocks)) {
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
    return codeBlocks.some(
      (block) => position >= block.start && position < block.end,
    );
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

    // Final pass: ensure no segment ends in the middle of a code block
    const finalSegments: Segment[] = [];
    for (const segment of mergedSegments) {
      let adjustedEnd = segment.end;

      // Check if segment end is inside a code block
      for (const block of codeBlocks) {
        if (segment.end > block.start && segment.end < block.end) {
          // Extend to include the entire code block
          adjustedEnd = block.end;
          break;
        }
      }

      finalSegments.push({
        start: segment.start,
        end: adjustedEnd,
      });
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
      let content = markdown.slice(segment.start, segment.end);
      let chunkStart = segment.start;

      // For chunks after the first, prepend overlap from previous segment
      if (i > 0 && this.options.overlap > 0) {
        const prevSegment = segments[i - 1]!;
        const prevContent = markdown.slice(prevSegment.start, prevSegment.end);

        // Calculate how much overlap to take from the previous segment
        const overlapLength = Math.min(
          this.options.overlap,
          prevContent.length,
        );
        let overlapStart = prevContent.length - overlapLength;

        // Check if the overlap would start in the middle of a code block
        const overlapAbsoluteStart = prevSegment.start + overlapStart;
        for (const block of codeBlocks) {
          if (
            overlapAbsoluteStart > block.start &&
            overlapAbsoluteStart < block.end
          ) {
            // Overlap would start inside a code block
            if (block.end <= prevSegment.end) {
              // The code block ends within the previous segment
              // Start overlap after the code block to avoid duplication
              const blockEndInSegment = block.end - prevSegment.start;
              if (blockEndInSegment < prevContent.length) {
                overlapStart = blockEndInSegment;
              }
            }
            break;
          }
        }

        // Extract overlap text from the adjusted position
        const overlapText = prevContent.slice(overlapStart);

        // Prepend overlap to current content
        content = overlapText + content;

        // Track where the actual content starts (including overlap)
        chunkStart = prevSegment.start + overlapStart;
      }

      chunks.push({
        content: this.options.trim ? content.trim() : content,
        start: chunkStart, // Now reflects the actual start including overlap
        end: segment.end,
        overlapStart: i > 0 ? segment.start : undefined, // Original segment start for reference
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
  ): Chunk[] {
    const chunks: Chunk[] = [];
    const titleCounts = new Map<string, number>();

    for (const rawChunk of rawChunks) {
      // Find the last header before or within this chunk that's in our configured levels
      let title = 'ROOT';
      let headerPath: string[] = [];

      // Build full header path from all headers up to the end of this chunk
      const allHeadersBeforeEnd = headers.filter((h) => h.start < rawChunk.end);
      const headerStack: { level: number; text: string }[] = [];

      for (const header of allHeadersBeforeEnd) {
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

      // Find title from configured levels - check headers within the chunk first
      const headersInChunk = headers.filter(
        (h) =>
          h.start >= rawChunk.start &&
          h.start < rawChunk.end &&
          this.options.headerLevels.includes(h.level as 1 | 2),
      );

      if (headersInChunk.length > 0) {
        // Use the first configured header within the chunk
        title = headersInChunk[0]!.text;
      } else {
        // Otherwise, use the last configured header before the chunk
        for (let i = headerStack.length - 1; i >= 0; i--) {
          if (
            this.options.headerLevels.includes(headerStack[i]!.level as 1 | 2)
          ) {
            title = headerStack[i]!.text;
            break;
          }
        }
      }

      // Track chunk numbers per title (0-based)
      const count = titleCounts.get(title) || 0;
      titleCounts.set(title, count + 1);

      // Generate unique ID using 0-based numbering
      const slug = this.slugify(title);
      const uniqueId = this.options.idPrefix
        ? `${this.options.idPrefix}-${slug}-${count}`
        : `${slug}-${count}`;

      chunks.push({
        content: rawChunk.content,
        meta: {
          title,
          chunkNumber: count,
          uniqueId,
          startChar: rawChunk.start,
          endChar: rawChunk.end,
          headerPath,
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
