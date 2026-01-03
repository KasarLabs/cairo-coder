import { describe, it, expect, beforeEach } from 'bun:test';
import {
  clearConfigCache,
  getAvailableSourcesFromConfig,
  getBookConfig,
  getSourceConfig,
  loadSourcesConfig,
} from '../src/utils/sourceConfig';
import { DocumentSource } from '../src/types';

describe('sourceConfig', () => {
  beforeEach(() => {
    clearConfigCache();
  });

  it('loads sources.json and exposes known sources', () => {
    const config = loadSourcesConfig();
    const cairoConfig = config.sources[DocumentSource.CAIRO_BOOK];

    expect(cairoConfig).toBeDefined();
    expect(cairoConfig.name).toBeTruthy();
    expect(cairoConfig.config.fileExtensions).toBeInstanceOf(Array);
  });

  it('returns per-source config and book config helpers', () => {
    const config = loadSourcesConfig();
    const sourceConfig = getSourceConfig(DocumentSource.CAIRO_BOOK);
    const bookConfig = getBookConfig(DocumentSource.CAIRO_BOOK);

    expect(sourceConfig).toEqual(config.sources[DocumentSource.CAIRO_BOOK]);
    expect(bookConfig).toEqual(config.sources[DocumentSource.CAIRO_BOOK].config);
  });

  it('returns all available sources from config', () => {
    const sources = getAvailableSourcesFromConfig().slice().sort();
    const expected = Object.values(DocumentSource).slice().sort();

    expect(sources).toEqual(expected);
  });

  it('caches config between loads and can be cleared', () => {
    const first = loadSourcesConfig();
    const second = loadSourcesConfig();

    expect(first).toBe(second);

    clearConfigCache();
    const third = loadSourcesConfig();

    expect(third).not.toBe(first);
  });
});
