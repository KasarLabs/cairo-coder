import { IngesterFactory } from '../src/IngesterFactory';
import { CairoBookIngester } from '../src/ingesters/CairoBookIngester';
import { StarknetDocsIngester } from '../src/ingesters/StarknetDocsIngester';
import { StarknetFoundryIngester } from '../src/ingesters/StarknetFoundryIngester';
import { CairoByExampleIngester } from '../src/ingesters/CairoByExampleIngester';
import { OpenZeppelinDocsIngester } from '../src/ingesters/OpenZeppelinDocsIngester';
import { BaseIngester } from '../src/BaseIngester';
import { DocumentSource } from '@cairo-coder/agents/types/index';

// Mock the ingesters
jest.mock('../src/ingesters/CairoBookIngester');
jest.mock('../src/ingesters/StarknetDocsIngester');
jest.mock('../src/ingesters/StarknetFoundryIngester');
jest.mock('../src/ingesters/CairoByExampleIngester');
jest.mock('../src/ingesters/OpenZeppelinDocsIngester');

describe('IngesterFactory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createIngester', () => {
    it('should create a CairoBookIngester for cairo_book source', () => {
      const ingester = IngesterFactory.createIngester(
        DocumentSource.CAIRO_BOOK,
      );

      expect(ingester).toBeInstanceOf(CairoBookIngester);
      expect(CairoBookIngester).toHaveBeenCalledTimes(1);
    });

    it('should create a StarknetDocsIngester for starknet_docs source', () => {
      const ingester = IngesterFactory.createIngester(
        DocumentSource.STARKNET_DOCS,
      );

      expect(ingester).toBeInstanceOf(StarknetDocsIngester);
      expect(StarknetDocsIngester).toHaveBeenCalledTimes(1);
    });

    it('should create a StarknetFoundryIngester for starknet_foundry source', () => {
      const ingester = IngesterFactory.createIngester(
        DocumentSource.STARKNET_FOUNDRY,
      );

      expect(ingester).toBeInstanceOf(StarknetFoundryIngester);
      expect(StarknetFoundryIngester).toHaveBeenCalledTimes(1);
    });

    it('should create a CairoByExampleIngester for cairo_by_example source', () => {
      const ingester = IngesterFactory.createIngester(
        DocumentSource.CAIRO_BY_EXAMPLE,
      );

      expect(ingester).toBeInstanceOf(CairoByExampleIngester);
      expect(CairoByExampleIngester).toHaveBeenCalledTimes(1);
    });

    it('should create an OpenZeppelinDocsIngester for openzeppelin_docs source', () => {
      const ingester = IngesterFactory.createIngester(
        DocumentSource.OPENZEPPELIN_DOCS,
      );

      expect(ingester).toBeInstanceOf(OpenZeppelinDocsIngester);
      expect(OpenZeppelinDocsIngester).toHaveBeenCalledTimes(1);
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
        'cairo_book',
        'starknet_docs',
        'starknet_foundry',
        'cairo_by_example',
        'openzeppelin_docs',
      ]);
    });
  });
});
