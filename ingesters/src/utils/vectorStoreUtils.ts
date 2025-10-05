import { Document } from '@langchain/core/documents';
import { createInterface } from 'readline';
import { VectorStore } from '../db/postgresVectorStore';
import { type BookChunk, DocumentSource } from '../types';
import { logger } from './logger';

export interface VectorStoreUpdateOptions {
  /** Skip the confirmation prompt when updating the vector store. */
  autoConfirm?: boolean;
  /** Inject a custom confirmation handler (handy for tests/CLIs). */
  confirmFn?: (question: string) => Promise<boolean>;
}

const CONFIRMATION_PROMPT =
  'Are you sure you want to update the vector store? (y/n)';

const defaultConfirmFn = async (question: string): Promise<boolean> => {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answer = await new Promise<string>((resolve) => {
    rl.question(question, (response: string) => {
      rl.close();
      resolve(response.trim().toLowerCase());
    });
  });

  return answer === 'y';
};

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
  contentChanged: Document<BookChunk>[];
  metadataOnlyChanged: Document<BookChunk>[];
  chunksToRemove: string[];
} {
  const storedDataMap = new Map(
    storedChunkHashes.map((chunk) => [chunk.uniqueId, chunk.metadata]),
  );
  const freshChunksMap = new Map(
    freshChunks.map((chunk) => [chunk.metadata.uniqueId, chunk]),
  );

  const contentChanged: Document<BookChunk>[] = [];
  const metadataOnlyChanged: Document<BookChunk>[] = [];

  for (const fresh of freshChunks) {
    const stored = storedDataMap.get(fresh.metadata.uniqueId);
    if (!stored) {
      // New doc: requires full insert + embedding
      contentChanged.push(fresh);
      continue;
    }

    const storedHash = stored.contentHash;
    const freshHash = fresh.metadata.contentHash;
    if (storedHash !== freshHash) {
      // Content changed: re-embed and upsert fully
      contentChanged.push(fresh);
      continue;
    }

    // Content same, check if any metadata field differs
    const keys = new Set<keyof BookChunk>([
      ...(Object.keys(stored) as (keyof BookChunk)[]),
      ...(Object.keys(fresh.metadata) as (keyof BookChunk)[]),
    ]);

    let metaDiffers = false;
    for (const key of keys) {
      // Ignore contentHash here since we already know it's equal
      if (key === 'contentHash') continue;
      if (stored[key] !== fresh.metadata[key]) {
        metaDiffers = true;
        break;
      }
    }
    if (metaDiffers) {
      metadataOnlyChanged.push(fresh);
    }
  }

  // Find chunks that need to be removed (no longer exist in fresh chunks)
  const chunksToRemove = storedChunkHashes
    .filter((stored) => !freshChunksMap.has(stored.uniqueId))
    .map((stored) => stored.uniqueId);

  return { contentChanged, metadataOnlyChanged, chunksToRemove };
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
 * @param options - Behavioural overrides (e.g., auto-confirm updates)
 */
export async function updateVectorStore(
  vectorStore: VectorStore,
  chunks: Document<BookChunk>[],
  source: DocumentSource,
  options?: VectorStoreUpdateOptions,
): Promise<void> {
  // Get stored chunk hashes for the source
  const storedChunkHashes =
    await vectorStore.getStoredBookPagesMetadata(source);

  // Find chunks to update and remove
  const { contentChanged, metadataOnlyChanged, chunksToRemove } =
    findChunksToUpdateAndRemove(chunks, storedChunkHashes);

  logger.info(
    `Found ${storedChunkHashes.length} stored chunks for source: ${source}. ${contentChanged.length} content changes, ${metadataOnlyChanged.length} metadata-only changes, and ${chunksToRemove.length} removals`,
  );

  if (
    contentChanged.length === 0 &&
    metadataOnlyChanged.length === 0 &&
    chunksToRemove.length === 0
  ) {
    logger.info('No changes to update or remove');
    return;
  }

  let confirmed = false;
  if (options?.autoConfirm) {
    logger.info('Auto-confirm enabled, skipping vector store prompt');
    confirmed = true;
  } else {
    const confirmFn = options?.confirmFn ?? defaultConfirmFn;
    confirmed = await confirmFn(CONFIRMATION_PROMPT);
  }

  if (!confirmed) {
    logger.info('Update cancelled');
    return;
  }

  // Remove chunks that no longer exist
  if (chunksToRemove.length > 0) {
    await vectorStore.removeBookPages(chunksToRemove, source);
  }

  // Update chunks that have changed
  if (contentChanged.length > 0) {
    await vectorStore.addDocuments(contentChanged, {
      ids: contentChanged.map((chunk) => chunk.metadata.uniqueId),
    });
  }

  if (metadataOnlyChanged.length > 0) {
    await vectorStore.updateDocumentsMetadata(metadataOnlyChanged, {
      ids: metadataOnlyChanged.map((chunk) => chunk.metadata.uniqueId),
    });
  }

  logger.info(
    `Updated ${contentChanged.length} content chunks, ${metadataOnlyChanged.length} metadata-only chunks, and removed ${chunksToRemove.length} chunks for source: ${source}.`,
  );
}
