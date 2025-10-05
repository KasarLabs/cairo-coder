import { Document } from '@langchain/core/documents';
import { describe, expect, it, vi } from 'bun:test';
import { type BookChunk, DocumentSource } from '../src/types';
import {
  findChunksToUpdateAndRemove,
  updateVectorStore,
} from '../src/utils/vectorStoreUtils';

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

describe('updateVectorStore', () => {
  const chunk = new Document<BookChunk>({
    pageContent: 'content',
    metadata: {
      name: 'page',
      title: 'Title',
      chunkNumber: 0,
      contentHash: 'hash',
      uniqueId: 'page-0',
      sourceLink: 'https://example.com/page',
      source: DocumentSource.CAIRO_BOOK,
    },
  });

  const makeVectorStore = () => {
    const getStoredBookPagesMetadata = vi.fn().mockResolvedValue([]);
    const removeBookPages = vi.fn().mockResolvedValue(undefined);
    const addDocuments = vi.fn().mockResolvedValue(undefined);
    const updateDocumentsMetadata = vi.fn().mockResolvedValue(undefined);

    return {
      store: {
        getStoredBookPagesMetadata,
        removeBookPages,
        addDocuments,
        updateDocumentsMetadata,
      } as unknown,
      spies: {
        getStoredBookPagesMetadata,
        removeBookPages,
        addDocuments,
        updateDocumentsMetadata,
      },
    };
  };

  it('skips confirmation when autoConfirm is true', async () => {
    const { store, spies } = makeVectorStore();

    await updateVectorStore(store as any, [chunk], DocumentSource.CAIRO_BOOK, {
      autoConfirm: true,
    });

    expect(spies.getStoredBookPagesMetadata).toHaveBeenCalledTimes(1);
    expect(spies.addDocuments).toHaveBeenCalledWith([chunk], {
      ids: ['page-0'],
    });
    expect(spies.removeBookPages).not.toHaveBeenCalled();
  });

  it('aborts when confirmation handler returns false', async () => {
    const confirmFn = vi.fn().mockResolvedValue(false);
    const { store, spies } = makeVectorStore();

    await updateVectorStore(store as any, [chunk], DocumentSource.CAIRO_BOOK, {
      confirmFn,
    });

    expect(confirmFn).toHaveBeenCalledTimes(1);
    expect(spies.addDocuments).not.toHaveBeenCalled();
    expect(spies.removeBookPages).not.toHaveBeenCalled();
  });
});
