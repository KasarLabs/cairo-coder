import { createAnchor } from '../src/utils/contentUtils';

describe('createAnchor', () => {
  it('should handle undefined input', () => {
    expect(createAnchor(undefined)).toBe('');
  });

  it('should convert text to lowercase', () => {
    expect(createAnchor('UPPERCASE TEXT')).toBe('uppercase-text');
  });

  it('should remove non-word characters', () => {
    expect(createAnchor('Special @#$% Characters!')).toBe('special-characters');
  });

  it('should convert spaces to hyphens', () => {
    expect(createAnchor('Text with spaces')).toBe('text-with-spaces');
  });

  it('should convert multiple spaces to single hyphen', () => {
    expect(createAnchor('Text   with   multiple    spaces')).toBe(
      'text-with-multiple-spaces',
    );
  });

  it('should convert multiple hyphens to single hyphen', () => {
    expect(createAnchor('Text---with---hyphens')).toBe('text-with-hyphens');
  });

  it('should remove leading and trailing hyphens', () => {
    expect(createAnchor('--Text with hyphens--')).toBe('text-with-hyphens');
  });

  it('should handle complex cases', () => {
    expect(createAnchor('  Complex @#$% CASE   with 123  ')).toBe(
      'complex-case-with-123',
    );
  });
});
