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
import { SkillsIngester } from './ingesters/SkillsIngester';
import {
  getAvailableSourcesFromConfig,
  getSourceConfig,
  type SourceConfig,
} from './utils/sourceConfig';

/**
 * Map of ingester class names to their constructors
 *
 * This allows the factory to instantiate ingesters based on the
 * class name specified in the sources.json config file.
 */
const INGESTER_CLASSES: Record<string, new () => BaseIngester> = {
  CairoBookIngester,
  StarknetDocsIngester,
  StarknetFoundryIngester,
  CairoByExampleIngester,
  OpenZeppelinDocsIngester,
  CoreLibDocsIngester,
  ScarbDocsIngester,
  StarknetJSIngester,
  StarknetBlogIngester,
  DojoDocsIngester,
  SkillsIngester,
};

/**
 * Factory class for creating ingesters
 *
 * This class is responsible for creating the appropriate ingester based on the source.
 * It follows the Factory pattern to encapsulate the creation logic and make it easier
 * to add new ingesters in the future.
 *
 * Configuration is loaded from config/sources.json, which defines metadata and
 * BookConfig for each source. The actual ingester implementations remain in
 * separate class files for custom processing logic.
 */
export class IngesterFactory {
  /**
   * Create an ingester for the specified source
   *
   * @param source - The document source identifier
   * @returns An instance of the appropriate ingester
   * @throws Error if the source is not supported or ingester class not found
   */
  public static createIngester(source: DocumentSource): BaseIngester {
    // Load config to validate the source exists
    const sourceConfig = getSourceConfig(source);
    const IngesterClass = INGESTER_CLASSES[sourceConfig.ingesterClass];

    if (!IngesterClass) {
      throw new Error(
        `Ingester class '${sourceConfig.ingesterClass}' not found for source '${source}'`,
      );
    }

    return new IngesterClass();
  }

  /**
   * Get all available ingester sources
   *
   * Sources are loaded from the config/sources.json file.
   *
   * @returns Array of available document sources
   */
  public static getAvailableSources(): DocumentSource[] {
    return getAvailableSourcesFromConfig();
  }

  /**
   * Get metadata about a source
   *
   * @param source - The document source identifier
   * @returns Source configuration including name, description, and config
   */
  public static getSourceMetadata(source: DocumentSource): SourceConfig {
    return getSourceConfig(source);
  }

  /**
   * Check if a source is supported
   *
   * @param source - The document source identifier to check
   * @returns true if the source is supported
   */
  public static isSourceSupported(source: string): boolean {
    try {
      getSourceConfig(source as DocumentSource);
      return true;
    } catch {
      return false;
    }
  }
}
