import { parseMdxFile } from '../MdxParser';

describe('MdxParser', () => {
  it('parses frontmatter, sections, and trait functions', () => {
    const content = `---
title: "core::integer::u128"
---
Unsigned 128-bit integer operations.

## Signature

\`\`\`cairo
extern fn u128_overflowing_add(a: u128, b: u128) -> Result<u128, u128> nopanic;
\`\`\`

## Examples

\`\`\`cairo
let (res, overflow) = u128_overflowing_add(1_u128, 2_u128);
\`\`\`

\`\`\`cairo
let (res, overflow) = u128_overflowing_add(0_u128, 0_u128);
\`\`\`

## Trait functions

### from_int
Creates a value from an integer literal.

\`\`\`cairo
fn from_int(value: felt252) -> T;
\`\`\`
`;

    const parsed = parseMdxFile(content, 'core-integer-u128.mdx');

    expect(parsed.title).toBe('core::integer::u128');
    expect(parsed.description).toBe('Unsigned 128-bit integer operations.');
    expect(parsed.signature).toContain('u128_overflowing_add');
    expect(parsed.examples).toHaveLength(2);
    expect(parsed.examples[0]).toContain('u128_overflowing_add');
    expect(parsed.traitFunctions).toHaveLength(1);
    expect(parsed.traitFunctions[0]!.name).toBe('from_int');
    expect(parsed.traitFunctions[0]!.description).toBe(
      'Creates a value from an integer literal.',
    );
    expect(parsed.traitFunctions[0]!.signature).toContain('from_int');
    expect(parsed.sourceUrl).toBe(
      'https://docs.starknet.io/build/corelib/core-integer-u128',
    );
  });
});
