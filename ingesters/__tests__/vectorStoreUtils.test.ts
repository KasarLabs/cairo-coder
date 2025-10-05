import { type BookChunk, DocumentSource } from '../src/types';
import { findChunksToUpdateAndRemove } from '../src/utils/vectorStoreUtils';
import { Document } from '@langchain/core/documents';

describe('findChunksToUpdateAndRemove', () => {
  it('should correctly identify chunks to update and remove', () => {
    const freshChunks: Document<BookChunk>[] = [
      {
        metadata: {
          name: '1',
          title: '1',
          chunkNumber: 1,
          source: DocumentSource.CAIRO_BOOK,
          uniqueId: '1',
          contentHash: 'hash1',
          sourceLink: 'https://example.com/1',
        },
        pageContent: 'Some Content 1',
      },
      {
        metadata: {
          name: '2',
          title: '2',
          chunkNumber: 2,
          source: DocumentSource.CAIRO_BOOK,
          uniqueId: '2',
          contentHash: 'hash2_updated',
          sourceLink: 'https://example.com/2',
        },
        pageContent: 'Some Content 2',
      },
      {
        metadata: {
          name: '4',
          title: '4',
          chunkNumber: 4,
          source: DocumentSource.CAIRO_BOOK,
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
          name: '1',
          title: '1',
          chunkNumber: 1,
          source: DocumentSource.CAIRO_BOOK,
          uniqueId: '1',
          contentHash: 'hash1',
          sourceLink: 'https://example.com/1',
        },
      },
      {
        uniqueId: '2',
        contentHash: 'hash2',
        metadata: {
          name: '2',
          title: '2',
          chunkNumber: 2,
          source: DocumentSource.CAIRO_BOOK,
          uniqueId: '2',
          contentHash: 'hash2',
          sourceLink: 'https://example.com/2',
        },
      },
      {
        uniqueId: '3',
        contentHash: 'hash3',
        metadata: {
          name: '3',
          title: '3',
          chunkNumber: 3,
          source: DocumentSource.CAIRO_BOOK,
          uniqueId: '3',
          contentHash: 'hash3',
          sourceLink: 'https://example.com/3',
        },
      },
    ];

    const result = findChunksToUpdateAndRemove(freshChunks, storedChunkHashes);

    expect(result.contentChanged).toEqual([
      {
        metadata: {
          name: '2',
          title: '2',
          chunkNumber: 2,
          source: DocumentSource.CAIRO_BOOK,
          uniqueId: '2',
          contentHash: 'hash2_updated',
          sourceLink: 'https://example.com/2',
        },
        pageContent: 'Some Content 2',
      },
      {
        metadata: {
          name: '4',
          title: '4',
          chunkNumber: 4,
          source: DocumentSource.CAIRO_BOOK,
          uniqueId: '4',
          contentHash: 'hash4',
          sourceLink: 'https://example.com/4',
        },
        pageContent: 'Some Content 3',
      },
    ]);
    expect(result.metadataOnlyChanged).toEqual([]);
    expect(result.chunksToRemove).toEqual(['3']);
  });

  it('should return empty arrays when no updates or removals are needed', () => {
    const freshChunks: Document<BookChunk>[] = [
      {
        pageContent: 'Some Content 1',
        metadata: {
          name: '1',
          title: '1',
          chunkNumber: 1,
          source: DocumentSource.CAIRO_BOOK,
          uniqueId: '1',
          contentHash: 'hash1',
          sourceLink: 'https://example.com/1',
        },
      },
      {
        pageContent: 'Some Content 2',
        metadata: {
          name: '2',
          title: '2',
          chunkNumber: 2,
          source: DocumentSource.CAIRO_BOOK,
          uniqueId: '2',
          contentHash: 'hash2',
          sourceLink: 'https://example.com/2',
        },
      },
    ];

    const storedChunkHashes = [
      {
        uniqueId: '1',
        metadata: {
          name: '1',
          title: '1',
          chunkNumber: 1,
          source: DocumentSource.CAIRO_BOOK,
          uniqueId: '1',
          contentHash: 'hash1',
          sourceLink: 'https://example.com/1',
        },
      },
      {
        uniqueId: '2',
        metadata: {
          name: '2',
          title: '2',
          chunkNumber: 2,
          source: DocumentSource.CAIRO_BOOK,
          uniqueId: '2',
          contentHash: 'hash2',
          sourceLink: 'https://example.com/2',
        },
      },
    ];

    const result = findChunksToUpdateAndRemove(freshChunks, storedChunkHashes);

    expect(result.contentChanged).toEqual([]);
    expect(result.metadataOnlyChanged).toEqual([]);
    expect(result.chunksToRemove).toEqual([]);
  });

  it('should handle empty inputs correctly', () => {
    const result = findChunksToUpdateAndRemove([], []);
    expect(result.contentChanged).toEqual([]);
    expect(result.metadataOnlyChanged).toEqual([]);
    expect(result.chunksToRemove).toEqual([]);
  });

  it('should detect metadata changes even when content hash is the same', () => {
    const freshChunks: Document<BookChunk>[] = [
      {
        metadata: {
          name: '1',
          title: 'Updated Title',
          chunkNumber: 1,
          source: DocumentSource.CAIRO_BOOK,
          uniqueId: '1',
          contentHash: 'hash1',
          sourceLink: 'https://example.com/1-updated',
        },
        pageContent: 'Some Content 1',
      },
    ];

    const storedChunkHashes = [
      {
        uniqueId: '1',
        metadata: {
          name: '1',
          title: 'Original Title',
          chunkNumber: 1,
          source: DocumentSource.CAIRO_BOOK,
          uniqueId: '1',
          contentHash: 'hash1',
          sourceLink: 'https://example.com/1',
        },
      },
    ];

    const result = findChunksToUpdateAndRemove(freshChunks, storedChunkHashes);

    // Should update metadata-only because metadata changed (sourceLink and title)
    expect(result.metadataOnlyChanged).toEqual([
      {
        metadata: {
          name: '1',
          title: 'Updated Title',
          chunkNumber: 1,
          source: DocumentSource.CAIRO_BOOK,
          uniqueId: '1',
          contentHash: 'hash1',
          sourceLink: 'https://example.com/1-updated',
        },
        pageContent: 'Some Content 1',
      },
    ]);
    expect(result.contentChanged).toEqual([]);
    expect(result.chunksToRemove).toEqual([]);
  });
});
