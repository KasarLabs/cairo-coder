import { findChunksToUpdateAndRemove } from '../src/utils/vectorStoreUtils';
import { Document } from '@langchain/core/documents';

describe('findChunksToUpdateAndRemove', () => {
  it('should correctly identify chunks to update and remove', () => {
    const freshChunks: Document<Record<string, any>>[] = [
      {
        metadata: { uniqueId: '1', contentHash: 'hash1' },
        pageContent: 'Some Content 1',
      },
      {
        metadata: { uniqueId: '2', contentHash: 'hash2_updated' },
        pageContent: 'Some Content 2',
      },
      {
        metadata: { uniqueId: '4', contentHash: 'hash4' },
        pageContent: 'Some Content 3',
      },
    ];

    const storedChunkHashes = [
      { uniqueId: '1', contentHash: 'hash1' },
      { uniqueId: '2', contentHash: 'hash2' },
      { uniqueId: '3', contentHash: 'hash3' },
    ];

    const result = findChunksToUpdateAndRemove(freshChunks, storedChunkHashes);

    expect(result.chunksToUpdate).toEqual([
      {
        metadata: { uniqueId: '2', contentHash: 'hash2_updated' },
        pageContent: 'Some Content 2',
      },
      {
        metadata: { uniqueId: '4', contentHash: 'hash4' },
        pageContent: 'Some Content 3',
      },
    ]);
    expect(result.chunksToRemove).toEqual(['3']);
  });

  it('should return empty arrays when no updates or removals are needed', () => {
    const freshChunks: Document<Record<string, any>>[] = [
      {
        metadata: { uniqueId: '1', contentHash: 'hash1' },
        pageContent: 'Some Content 1',
      },
      {
        metadata: { uniqueId: '2', contentHash: 'hash2' },
        pageContent: 'Some Content 2',
      },
    ];

    const storedChunkHashes = [
      { uniqueId: '1', contentHash: 'hash1' },
      { uniqueId: '2', contentHash: 'hash2' },
    ];

    const result = findChunksToUpdateAndRemove(freshChunks, storedChunkHashes);

    expect(result.chunksToUpdate).toEqual([]);
    expect(result.chunksToRemove).toEqual([]);
  });

  it('should handle empty inputs correctly', () => {
    const result = findChunksToUpdateAndRemove([], []);

    expect(result.chunksToUpdate).toEqual([]);
    expect(result.chunksToRemove).toEqual([]);
  });
});
