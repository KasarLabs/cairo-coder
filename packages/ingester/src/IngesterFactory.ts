import { DocumentSource } from '@cairo-coder/agents/types/index';
import { BaseIngester } from './BaseIngester';
import { BookConfig } from './utils/types';

/**
 * Factory class for creating ingesters
 *
 * This class is responsible for creating the appropriate ingester based on the source.
 * It follows the Factory pattern to encapsulate the creation logic and make it easier
 * to add new ingesters in the future.
 */
export class IngesterFactory {
  /**
   * Create an ingester for the specified source
   *
   * @param source - The document source identifier
   * @returns An instance of the appropriate ingester
   * @throws Error if the source is not supported
   */
  public static createIngester(source: DocumentSource): BaseIngester {
    switch (source) {
      case 'cairo_book':
        // Import dynamically to avoid circular dependencies
        const { CairoBookIngester } = require('./ingesters/CairoBookIngester');
        return new CairoBookIngester();

      case 'starknet_docs':
        const {
          StarknetDocsIngester,
        } = require('./ingesters/StarknetDocsIngester');
        return new StarknetDocsIngester();

      case 'starknet_foundry':
        const {
          StarknetFoundryIngester,
        } = require('./ingesters/StarknetFoundryIngester');
        return new StarknetFoundryIngester();

      case 'cairo_by_example':
        const {
          CairoByExampleIngester,
        } = require('./ingesters/CairoByExampleIngester');
        return new CairoByExampleIngester();

      case 'openzeppelin_docs':
        const {
          OpenZeppelinDocsIngester,
        } = require('./ingesters/OpenZeppelinDocsIngester');
        return new OpenZeppelinDocsIngester();

      default:
        throw new Error(`Unsupported source: ${source}`);
    }
  }

  /**
   * Get all available ingester sources
   *
   * @returns Array of available document sources
   */
  public static getAvailableSources(): DocumentSource[] {
    return [
      DocumentSource.CAIRO_BOOK,
      DocumentSource.STARKNET_DOCS,
      DocumentSource.STARKNET_FOUNDRY,
      DocumentSource.CAIRO_BY_EXAMPLE,
      DocumentSource.OPENZEPPELIN_DOCS,
    ];
  }
}
