/**
 * Source Configuration Loader
 *
 * Loads ingester configurations from the external sources.json file.
 */

import * as fs from 'fs';
import { type BookConfig } from './types';
import { type DocumentSource } from '../types';
import { getRepoPath } from './paths';

/**
 * Configuration for a single documentation source
 */
export interface SourceConfig {
  /** Human-readable name of the source */
  name: string;
  /** Description of what this source contains */
  description: string;
  /** The ingester class name to use */
  ingesterClass: string;
  /** Book configuration for the ingester */
  config: BookConfig;
}

/**
 * Root structure of the sources.json file
 */
export interface SourcesConfig {
  $schema?: string;
  sources: Record<DocumentSource, SourceConfig>;
}

// Cache for loaded config
let cachedConfig: SourcesConfig | null = null;

/**
 * Get the path to the sources.json config file
 */
function getConfigPath(): string {
  return getRepoPath('ingesters', 'config', 'sources.json');
}

/**
 * Load the sources configuration from the JSON file
 *
 * @returns The parsed sources configuration
 * @throws Error if the config file cannot be read or parsed
 */
export function loadSourcesConfig(): SourcesConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const configPath = getConfigPath();

  try {
    const configContent = fs.readFileSync(configPath, 'utf-8');
    cachedConfig = JSON.parse(configContent) as SourcesConfig;
    return cachedConfig;
  } catch (error) {
    throw new Error(
      `Failed to load sources config from ${configPath}: ${error}`,
    );
  }
}

/**
 * Get configuration for a specific source
 *
 * @param source - The document source identifier
 * @returns The source configuration
 * @throws Error if the source is not found in the config
 */
export function getSourceConfig(source: DocumentSource): SourceConfig {
  const config = loadSourcesConfig();
  const sourceConfig = config.sources[source];

  if (!sourceConfig) {
    throw new Error(`Source '${source}' not found in sources.json config`);
  }

  return sourceConfig;
}

/**
 * Get the BookConfig for a specific source
 *
 * @param source - The document source identifier
 * @returns The book configuration for the source
 */
export function getBookConfig(source: DocumentSource): BookConfig {
  return getSourceConfig(source).config;
}

/**
 * Get all available source identifiers from the config
 *
 * @returns Array of document source identifiers
 */
export function getAvailableSourcesFromConfig(): DocumentSource[] {
  const config = loadSourcesConfig();
  return Object.keys(config.sources) as DocumentSource[];
}

/**
 * Clear the cached configuration (useful for testing)
 */
export function clearConfigCache(): void {
  cachedConfig = null;
}
