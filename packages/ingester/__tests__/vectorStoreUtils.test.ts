import { findChunksToUpdateAndRemove } from '../src/utils/vectorStoreUtils';
import { Document } from '@langchain/core/documents';

describe('findChunksToUpdateAndRemove', () => {
  it('should correctly identify chunks to update and remove', () => {
    const freshChunks: Document<Record<string, any>>[] = [
      {
        metadata: {
          uniqueId: '1',
          contentHash: 'hash1',
          sourceLink: 'https://example.com/1',
        },
        pageContent: 'Some Content 1',
      },
      {
        metadata: {
          uniqueId: '2',
          contentHash: 'hash2_updated',
          sourceLink: 'https://example.com/2',
        },
        pageContent: 'Some Content 2',
      },
      {
        metadata: {
          uniqueId: '4',
          contentHash: 'hash4',
          sourceLink: 'https://example.com/4',
        },
        pageContent: 'Some Content 3',
      },
    ];

    const storedChunkHashes = [
      {
        uniqueId: '1',
        contentHash: 'hash1',
        metadata: {
          uniqueId: '1',
          contentHash: 'hash1',
          sourceLink: 'https://example.com/1',
        },
      },
      {
        uniqueId: '2',
        contentHash: 'hash2',
        metadata: {
          uniqueId: '2',
          contentHash: 'hash2',
          sourceLink: 'https://example.com/2',
        },
      },
      {
        uniqueId: '3',
        contentHash: 'hash3',
        metadata: {
          uniqueId: '3',
          contentHash: 'hash3',
          sourceLink: 'https://example.com/3',
        },
      },
    ];

    const result = findChunksToUpdateAndRemove(freshChunks, storedChunkHashes);

    expect(result.chunksToUpdate).toEqual([
      {
        metadata: {
          uniqueId: '2',
          contentHash: 'hash2_updated',
          sourceLink: 'https://example.com/2',
        },
        pageContent: 'Some Content 2',
      },
      {
        metadata: {
          uniqueId: '4',
          contentHash: 'hash4',
          sourceLink: 'https://example.com/4',
        },
        pageContent: 'Some Content 3',
      },
    ]);
    expect(result.chunksToRemove).toEqual(['3']);
  });

  it('should return empty arrays when no updates or removals are needed', () => {
    const freshChunks: Document<Record<string, any>>[] = [
      {
        metadata: {
          uniqueId: '1',
          contentHash: 'hash1',
          sourceLink: 'https://example.com/1',
        },
        pageContent: 'Some Content 1',
      },
      {
        metadata: {
          uniqueId: '2',
          contentHash: 'hash2',
          sourceLink: 'https://example.com/2',
        },
        pageContent: 'Some Content 2',
      },
    ];

    const storedChunkHashes = [
      {
        uniqueId: '1',
        contentHash: 'hash1',
        metadata: {
          uniqueId: '1',
          contentHash: 'hash1',
          sourceLink: 'https://example.com/1',
        },
      },
      {
        uniqueId: '2',
        contentHash: 'hash2',
        metadata: {
          uniqueId: '2',
          contentHash: 'hash2',
          sourceLink: 'https://example.com/2',
        },
      },
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

  it('should detect metadata changes even when content hash is the same', () => {
    const freshChunks: Document<Record<string, any>>[] = [
      {
        metadata: {
          uniqueId: '1',
          contentHash: 'hash1',
          sourceLink: 'https://example.com/1-updated',
          title: 'Updated Title',
        },
        pageContent: 'Some Content 1',
      },
    ];

    const storedChunkHashes = [
      {
        uniqueId: '1',
        contentHash: 'hash1',
        metadata: {
          uniqueId: '1',
          contentHash: 'hash1',
          sourceLink: 'https://example.com/1',
          title: 'Original Title',
        },
      },
    ];

    const result = findChunksToUpdateAndRemove(freshChunks, storedChunkHashes);

    // Should update because metadata changed (sourceLink and title)
    expect(result.chunksToUpdate).toEqual([
      {
        metadata: {
          uniqueId: '1',
          contentHash: 'hash1',
          sourceLink: 'https://example.com/1-updated',
          title: 'Updated Title',
        },
        pageContent: 'Some Content 1',
      },
    ]);
    expect(result.chunksToRemove).toEqual([]);
  });
});
