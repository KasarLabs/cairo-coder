import { type Document } from '@langchain/core/documents';

export const MAX_SECTION_SIZE = 20000;

export interface BookPageDto {
  name: string;
  content: string;
}

export type BookConfig = {
  repoOwner: string;
  repoName: string;
  fileExtensions: string;
  chunkSize: number;
  chunkOverlap: number;
};

/**
 * Interface representing a section of markdown content
 */
export interface ParsedSection {
  title: string;
  content: string;
  anchor?: string;
}

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

export function findChunksToUpdateAndRemove(
  freshChunks: Document<Record<string, any>>[],
  storedChunkHashes: { uniqueId: string; contentHash: string }[],
): {
  chunksToUpdate: Document<Record<string, any>>[];
  chunksToRemove: string[];
} {
  const storedHashesMap = new Map(
    storedChunkHashes.map((chunk) => [chunk.uniqueId, chunk.contentHash]),
  );
  const freshChunksMap = new Map(
    freshChunks.map((chunk) => [
      chunk.metadata.uniqueId,
      chunk.metadata.contentHash,
    ]),
  );

  const chunksToUpdate = freshChunks.filter((chunk) => {
    const storedHash = storedHashesMap.get(chunk.metadata.uniqueId);
    return storedHash !== chunk.metadata.contentHash;
  });

  const chunksToRemove = storedChunkHashes
    .filter((stored) => !freshChunksMap.has(stored.uniqueId))
    .map((stored) => stored.uniqueId);

  return { chunksToUpdate, chunksToRemove };
}
