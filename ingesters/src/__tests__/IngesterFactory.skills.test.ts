import { IngesterFactory } from '../IngesterFactory';
import { DocumentSource } from '../types';
import { SkillsIngester } from '../ingesters/SkillsIngester';
import { getSourceConfig } from '../utils/sourceConfig';

describe('IngesterFactory cairo_skills wiring', () => {
  it('loads cairo_skills source config with SkillsIngester metadata', () => {
    const sourceConfig = getSourceConfig(DocumentSource.CAIRO_SKILLS);

    expect(sourceConfig.name).toBe('Cairo Skills');
    expect(sourceConfig.ingesterClass).toBe('SkillsIngester');
    expect(sourceConfig.config).toEqual({
      repoOwner: '',
      repoName: '',
      fileExtensions: ['.md'],
      chunkSize: 4096,
      chunkOverlap: 512,
      baseUrl: '',
      urlSuffix: '',
      useUrlMapping: false,
    });
  });

  it('creates a SkillsIngester for cairo_skills', () => {
    const ingester = IngesterFactory.createIngester(
      DocumentSource.CAIRO_SKILLS,
    );

    expect(ingester).toBeInstanceOf(SkillsIngester);
  });
});
