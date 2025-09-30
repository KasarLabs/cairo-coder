import { Document } from '@langchain/core/documents';
import { createInterface } from 'readline';
import { VectorStore } from '@cairo-coder/agents/db/postgresVectorStore';
import { BookChunk, DocumentSource } from '@cairo-coder/agents/types/index';
import { logger } from '@cairo-coder/agents/utils/index';
import { YES_MODE } from '../generateEmbeddings';

/**
 * Compare two metadata objects for equality
 * Compares all fields except contentHash and uniqueId (which are compared separately)
 *
 * @param metadata1 - First metadata object
 * @param metadata2 - Second metadata object
 * @returns boolean - Whether the metadata objects are equal
 */
function areMetadataEqual(
  metadata1: Record<string, any>,
  metadata2: Record<string, any>,
): boolean {
  // Get all keys from both objects, excluding contentHash and uniqueId
  const excludeKeys = new Set(['contentHash', 'uniqueId']);
  const keys1 = Object.keys(metadata1).filter((k) => !excludeKeys.has(k));
  const keys2 = Object.keys(metadata2).filter((k) => !excludeKeys.has(k));

  // Check if they have the same number of keys
  if (keys1.length !== keys2.length) {
    return false;
  }

  // Check if all keys exist in both and have the same values
  for (const key of keys1) {
    if (!(key in metadata2)) {
      return false;
    }
    // Deep comparison for nested objects, simple comparison for primitives
    const val1 = metadata1[key];
    const val2 = metadata2[key];

    if (typeof val1 === 'object' && val1 !== null) {
      if (JSON.stringify(val1) !== JSON.stringify(val2)) {
        return false;
      }
    } else if (val1 !== val2) {
      return false;
    }
  }

  return true;
}

/**
 * Find chunks that need to be updated or removed based on content hashes and metadata
 *
 * This function compares fresh chunks with stored chunks and determines which
 * chunks need to be updated (content or metadata has changed) and which need to be removed
 * (no longer exist in the fresh chunks).
 *
 * @param freshChunks - Array of fresh Document objects
 * @param storedChunkHashes - Array of stored chunk hashes and metadata
 * @returns Object containing arrays of chunks to update and IDs of chunks to remove
 */
export function findChunksToUpdateAndRemove(
  freshChunks: Document<Record<string, any>>[],
  storedChunkHashes: {
    uniqueId: string;
    contentHash: string;
    metadata: Record<string, any>;
  }[],
): {
  chunksToUpdate: Document<Record<string, any>>[];
  chunksToRemove: string[];
} {
  const storedDataMap = new Map(
    storedChunkHashes.map((chunk) => [
      chunk.uniqueId,
      { contentHash: chunk.contentHash, metadata: chunk.metadata },
    ]),
  );
  const freshChunksMap = new Map(
    freshChunks.map((chunk) => [
      chunk.metadata.uniqueId,
      chunk.metadata.contentHash,
    ]),
  );

  // Find chunks that need to be updated (content or metadata has changed)
  const chunksToUpdate = freshChunks.filter((chunk) => {
    const storedData = storedDataMap.get(chunk.metadata.uniqueId);
    if (!storedData) {
      // New chunk that doesn't exist in storage
      return true;
    }
    // Update if content hash changed OR metadata changed
    return (
      storedData.contentHash !== chunk.metadata.contentHash ||
      !areMetadataEqual(storedData.metadata, chunk.metadata)
    );
  });

  // Find chunks that need to be removed (no longer exist in fresh chunks)
  const chunksToRemove = storedChunkHashes
    .filter((stored) => !freshChunksMap.has(stored.uniqueId))
    .map((stored) => stored.uniqueId);

  return { chunksToUpdate, chunksToRemove };
}

/**
 * Update the vector store with fresh chunks
 *
 * This function compares fresh chunks with stored chunks, removes chunks that
 * no longer exist, and updates chunks that have changed.
 *
 * @param vectorStore - The vector store to update
 * @param chunks - Array of fresh Document objects
 * @param source - The document source identifier
 */
export async function updateVectorStore(
  vectorStore: VectorStore,
  chunks: Document<BookChunk>[],
  source: DocumentSource,
): Promise<void> {
  // Get stored chunk hashes for the source
  const storedChunkHashes = await vectorStore.getStoredBookPagesHashes(source);

  // Find chunks to update and remove
  const { chunksToUpdate, chunksToRemove } = findChunksToUpdateAndRemove(
    chunks,
    storedChunkHashes,
  );

  logger.info(
    `Found ${storedChunkHashes.length} stored chunks for source: ${source}. ${chunksToUpdate.length} chunks to update and ${chunksToRemove.length} chunks to remove`,
  );

  if (chunksToUpdate.length === 0 && chunksToRemove.length === 0) {
    logger.info('No changes to update or remove');
    return;
  }

  // Skip prompt if YES_MODE is enabled
  let confirm = 'n';
  if (YES_MODE) {
    logger.info(
      'Yes mode enabled, automatically confirming vector store update',
    );
    confirm = 'y';
  } else {
    // prompt user to confirm
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    confirm = await new Promise<string>((resolve) => {
      rl.question(
        'Are you sure you want to update the vector store? (y/n)',
        (answer) => {
          rl.close();
          resolve(answer.trim().toLowerCase());
        },
      );
    });
  }

  if (confirm !== 'y') {
    logger.info('Update cancelled');
    return;
  }

  // Remove chunks that no longer exist
  if (chunksToRemove.length > 0) {
    await vectorStore.removeBookPages(chunksToRemove, source);
  }

  // Update chunks that have changed
  if (chunksToUpdate.length > 0) {
    await vectorStore.addDocuments(chunksToUpdate, {
      ids: chunksToUpdate.map((chunk) => chunk.metadata.uniqueId),
    });
  }

  logger.info(
    `Updated ${chunksToUpdate.length} chunks and removed ${chunksToRemove.length} chunks for source: ${source}.`,
  );
}
