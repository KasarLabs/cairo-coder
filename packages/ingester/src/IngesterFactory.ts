import { DocumentSource } from './types';
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

      case 'corelib_docs':
        const {
          CoreLibDocsIngester,
        } = require('./ingesters/CoreLibDocsIngester');
        return new CoreLibDocsIngester();

      case 'scarb_docs':
        const { ScarbDocsIngester } = require('./ingesters/ScarbDocsIngester');
        return new ScarbDocsIngester();

      case 'starknet_js':
        const {
          StarknetJSIngester,
        } = require('./ingesters/StarknetJSIngester');
        return new StarknetJSIngester();

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
    const sources = Object.values(DocumentSource);
    return sources;
  }
}
