import { createHash } from 'crypto';
import { MAX_SECTION_SIZE, type ParsedSection } from './types';

/**
 * Check if a given index is inside a code block in the content
 *
 * @param content - The content to check
 * @param index - The index to check
 * @returns boolean - True if the index is inside a code block, false otherwise
 */
export function isInsideCodeBlock(content: string, index: number): boolean {
  const codeBlockRegex = /```[\s\S]*?```/g;
  let match;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (index >= match.index && index < match.index + match[0].length) {
      return true;
    }
  }
  return false;
}

/**
 * Calculate a hash for the given content
 *
 * @param content - The content to hash
 * @returns string - The MD5 hash of the content
 */
export function calculateHash(content: string): string {
  return createHash('md5').update(content).digest('hex');
}

/**
 * Create an anchor from a title
 *
 * This function converts a title to a format suitable for use as an HTML anchor.
 * It follows common conventions for creating anchors from text:
 * - Convert to lowercase
 * - Remove non-word characters
 * - Convert spaces to hyphens
 * - Replace multiple hyphens with a single hyphen
 * - Remove leading and trailing hyphens
 *
 * @param title - The title to convert to an anchor
 * @returns string - The anchor
 */
//TODO: ensure this works with stuff lke https://docs.starknet.io/starknet-versions/pathfinder-versions/#0_6_6_2023_07_10_latest if required
export function createAnchor(title: string | undefined): string {
  if (!title) return '';

  return title
    .toLowerCase() // Convert to lowercase
    .replace(/[^\w\s-]/g, '') // Remove non-word characters (except spaces and hyphens)
    .replace(/\s+/g, '-') // Convert spaces to hyphens
    .replace(/-{2,}/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading and trailing hyphens
}

/**
 * Add a section to an array of sections, splitting it if it exceeds the maximum size
 *
 * @param sections - The array of sections to add to
 * @param title - The title of the section
 * @param content - The content of the section
 * @param maxSize - The maximum size of a section
 * @param anchor - Optional anchor for the section
 */
export function addSectionWithSizeLimit(
  sections: ParsedSection[],
  title: string,
  content: string,
  maxSize: number = MAX_SECTION_SIZE,
  anchor?: string,
): void {
  if (content.length <= maxSize) {
    sections.push({ title, content, anchor });
  } else {
    let startIndex = 0;
    while (startIndex < content.length) {
      const endIndex = startIndex + maxSize;
      const chunk = content.slice(startIndex, endIndex);
      sections.push({ title, content: chunk, anchor });
      startIndex = endIndex;
    }
  }
}
