import { describe, it, expect, beforeEach } from 'bun:test';
import { IngesterFactory } from '../src/IngesterFactory';
import { CairoBookIngester } from '../src/ingesters/CairoBookIngester';
import { StarknetDocsIngester } from '../src/ingesters/StarknetDocsIngester';
import { StarknetFoundryIngester } from '../src/ingesters/StarknetFoundryIngester';
import { CairoByExampleIngester } from '../src/ingesters/CairoByExampleIngester';
import { OpenZeppelinDocsIngester } from '../src/ingesters/OpenZeppelinDocsIngester';
import { BaseIngester } from '../src/BaseIngester';
import { DocumentSource } from '../src/types';

// Note: Bun test doesn't support mocking constructors the same way Jest does.
// The key behavior being tested is that the factory returns the correct instance type,
// which is verified by toBeInstanceOf checks.

describe('IngesterFactory', () => {
  describe('createIngester', () => {
    it('should create a CairoBookIngester for cairo_book source', () => {
      const ingester = IngesterFactory.createIngester(
        DocumentSource.CAIRO_BOOK,
      );

      expect(ingester).toBeInstanceOf(CairoBookIngester);
    });

    it('should create a StarknetDocsIngester for starknet_docs source', () => {
      const ingester = IngesterFactory.createIngester(
        DocumentSource.STARKNET_DOCS,
      );

      expect(ingester).toBeInstanceOf(StarknetDocsIngester);
    });

    it('should create a StarknetFoundryIngester for starknet_foundry source', () => {
      const ingester = IngesterFactory.createIngester(
        DocumentSource.STARKNET_FOUNDRY,
      );

      expect(ingester).toBeInstanceOf(StarknetFoundryIngester);
    });

    it('should create a CairoByExampleIngester for cairo_by_example source', () => {
      const ingester = IngesterFactory.createIngester(
        DocumentSource.CAIRO_BY_EXAMPLE,
      );

      expect(ingester).toBeInstanceOf(CairoByExampleIngester);
    });

    it('should create an OpenZeppelinDocsIngester for openzeppelin_docs source', () => {
      const ingester = IngesterFactory.createIngester(
        DocumentSource.OPENZEPPELIN_DOCS,
      );

      expect(ingester).toBeInstanceOf(OpenZeppelinDocsIngester);
    });

    it('should throw an error for an unknown source', () => {
      expect(() => {
        // @ts-ignore - Testing with invalid source
        IngesterFactory.createIngester('unknown_source');
      }).toThrow('Unsupported source: unknown_source');
    });
  });

  describe('getAvailableSources', () => {
    it('should return an array of available sources', () => {
      const sources = IngesterFactory.getAvailableSources();

      expect(sources).toEqual([
        DocumentSource.CAIRO_BOOK,
        DocumentSource.STARKNET_DOCS,
        DocumentSource.STARKNET_FOUNDRY,
        DocumentSource.CAIRO_BY_EXAMPLE,
        DocumentSource.OPENZEPPELIN_DOCS,
        DocumentSource.CORELIB_DOCS,
        DocumentSource.SCARB_DOCS,
        // DocumentSource.STARKNET_JS is commented out in the enum
        DocumentSource.STARKNET_BLOG,
        DocumentSource.DOJO_DOCS,
      ]);
    });
  });
});
