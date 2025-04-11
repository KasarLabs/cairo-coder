/**
 * Common types and interfaces used across the ingester package
 */

/**
 * Maximum size for a section in characters
 * This is to avoid embedding large sections, which is limited by OpenAI.
 * The limit is 8192 tokens, therefore 20000 characters should be safe at 1token~=4 characters.
 */
export const MAX_SECTION_SIZE = 20000;

/**
 * Interface representing a book page with name and content
 */
export interface BookPageDto {
  /** The name of the page (usually the file path without extension) */
  name: string;

  /** The content of the page */
  content: string;
}

/**
 * Configuration for a book ingester
 */
export type BookConfig = {
  /** The owner of the repository */
  repoOwner: string;

  /** The name of the repository */
  repoName: string;

  /** The file extension of the documentation files */
  fileExtension: string;

  /** The size of each chunk in characters */
  chunkSize: number;

  /** The overlap between chunks in characters */
  chunkOverlap: number;

  /** The base URL for the documentation */
  baseUrl: string;

  /** The suffix for the documentation files */
  urlSuffix: string;
};

/**
 * Interface representing a section of content with title and optional anchor
 */
export interface ParsedSection {
  /** The title of the section */
  title: string;

  /** The content of the section */
  content: string;

  /** Optional anchor for linking to the section */
  anchor?: string;
}
