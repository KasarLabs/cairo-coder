import { Document } from '@langchain/core/documents';
import { createInterface } from 'readline';
import { VectorStore } from '../db/postgresVectorStore';
import { BookChunk, DocumentSource } from '../types';
import { logger } from './logger';
import { YES_MODE } from '../generateEmbeddings';

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
  freshChunks: Document<BookChunk>[],
  storedChunkHashes: {
    uniqueId: string;
    metadata: BookChunk;
  }[],
): {
  chunksToUpdate: Document<BookChunk>[];
  chunksToRemove: string[];
} {
  const storedDataMap = new Map(
    storedChunkHashes.map((chunk) => [chunk.uniqueId, chunk.metadata]),
  );
  const freshChunksMap = new Map(
    freshChunks.map((chunk) => [chunk.metadata.uniqueId, chunk]),
  );

  // Find chunks that need to be updated (content or metadata has changed)
  const chunksToUpdate = freshChunks.filter((chunk) => {
    const storedMetadata = storedDataMap.get(chunk.metadata.uniqueId);
    if (!storedMetadata) {
      // New chunk that doesn't exist in storage
      return true;
    }
    // Update if content hash changed or any metadata field changed
    for (const key in chunk.metadata) {
      if (
        storedMetadata[key as keyof BookChunk] !==
        chunk.metadata[key as keyof BookChunk]
      ) {
        return true;
      }
    }
    return false;
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
  const storedChunkHashes =
    await vectorStore.getStoredBookPagesMetadata(source);

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
