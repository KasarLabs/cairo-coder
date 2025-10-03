import { createAnchor, isInsideCodeBlock } from '../src/utils/contentUtils';

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

describe('isInsideCodeBlock', () => {
  const testContent = `
# Header

Some text

\`\`\`
code block
multi-line
\`\`\`

More text

\`\`\`typescript
function example() {
  console.log('Hello');
}
\`\`\`

Final text
`;

  it('should return true for indices inside code blocks', () => {
    expect(
      isInsideCodeBlock(testContent, testContent.indexOf('code block')),
    ).toBe(true);
    expect(
      isInsideCodeBlock(testContent, testContent.indexOf('multi-line')),
    ).toBe(true);
    expect(
      isInsideCodeBlock(testContent, testContent.indexOf('function example')),
    ).toBe(true);
  });

  it('should return false for indices outside code blocks', () => {
    expect(
      isInsideCodeBlock(testContent, testContent.indexOf('# Header')),
    ).toBe(false);
    expect(
      isInsideCodeBlock(testContent, testContent.indexOf('Some text')),
    ).toBe(false);
    expect(
      isInsideCodeBlock(testContent, testContent.indexOf('More text')),
    ).toBe(false);
    expect(
      isInsideCodeBlock(testContent, testContent.indexOf('Final text')),
    ).toBe(false);
  });

  it('should handle edge cases', () => {
    //@dev: we consider the backticks to be part of the code block
    expect(isInsideCodeBlock(testContent, testContent.indexOf('```'))).toBe(
      true,
    );
    expect(isInsideCodeBlock(testContent, testContent.indexOf('```') + 1)).toBe(
      true,
    );
    expect(
      isInsideCodeBlock(testContent, testContent.lastIndexOf('```') - 1),
    ).toBe(true);
    expect(isInsideCodeBlock(testContent, testContent.lastIndexOf('```'))).toBe(
      true,
    );
  });
});
