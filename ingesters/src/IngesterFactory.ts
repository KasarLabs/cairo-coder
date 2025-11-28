import { DocumentSource } from './types';
import { BaseIngester } from './BaseIngester';
import { CairoBookIngester } from './ingesters/CairoBookIngester';
import { StarknetDocsIngester } from './ingesters/StarknetDocsIngester';
import { StarknetFoundryIngester } from './ingesters/StarknetFoundryIngester';
import { CairoByExampleIngester } from './ingesters/CairoByExampleIngester';
import { OpenZeppelinDocsIngester } from './ingesters/OpenZeppelinDocsIngester';
import { CoreLibDocsIngester } from './ingesters/CoreLibDocsIngester';
import { ScarbDocsIngester } from './ingesters/ScarbDocsIngester';
import { StarknetJSIngester } from './ingesters/StarknetJSIngester';
import { StarknetBlogIngester } from './ingesters/StarknetBlogIngester';
import { DojoDocsIngester } from './ingesters/DojoDocsIngester';

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
        return new CairoBookIngester();

      case 'starknet_docs':
        return new StarknetDocsIngester();

      case 'starknet_foundry':
        return new StarknetFoundryIngester();

      case 'cairo_by_example':
        return new CairoByExampleIngester();

      case 'openzeppelin_docs':
        return new OpenZeppelinDocsIngester();

      case 'corelib_docs':
        return new CoreLibDocsIngester();

      case 'scarb_docs':
        return new ScarbDocsIngester();

      case 'starknet_blog':
        return new StarknetBlogIngester();

      case 'dojo_docs':
        return new DojoDocsIngester();

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
