import { describe, expect, it } from 'bun:test';
import { DocumentSource, type BookChunk } from '../src/types';

describe('types', () => {
  it('exposes cairo_skills document source', () => {
    expect(String(DocumentSource.CAIRO_SKILLS)).toBe('cairo_skills');
  });

  it('supports optional skillId on BookChunk', () => {
    const withoutSkillId: BookChunk = {
      name: 'example',
      title: 'Example',
      chunkNumber: 0,
      contentHash: 'hash',
      uniqueId: 'id',
      sourceLink: 'https://example.com',
      source: DocumentSource.CAIRO_SKILLS,
    };
    const withSkillId: BookChunk = {
      ...withoutSkillId,
      skillId: 'skill-1',
    };

    expect(withoutSkillId.skillId).toBeUndefined();
    expect(withSkillId.skillId).toBe('skill-1');
  });
});
