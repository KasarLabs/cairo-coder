import { formatAsApiIndex } from '../ApiIndexFormatter';
import { ParsedMdxDoc } from '../MdxParser';

describe('ApiIndexFormatter', () => {
  it('formats modules, templates, and sections', () => {
    const docs: ParsedMdxDoc[] = [
      {
        title: 'core::integer',
        description: 'Unsigned integer ops.',
        signature: '',
        examples: [],
        traitFunctions: [],
        sourceUrl: 'https://docs.starknet.io/build/corelib/core-integer',
        fileName: 'core-integer.mdx',
      },
      {
        title: 'core::integer::u8_overflowing_add',
        description: 'Add with overflow.',
        signature:
          'extern fn u8_overflowing_add(a: u8, b: u8) -> Result<u8, u8> nopanic;',
        examples: [],
        traitFunctions: [],
        sourceUrl: 'https://docs.starknet.io/build/corelib/core-integer-u8',
        fileName: 'core-integer-u8-overflowing-add.mdx',
      },
      {
        title: 'core::integer::u16_overflowing_add',
        description: 'Add with overflow.',
        signature:
          'extern fn u16_overflowing_add(a: u16, b: u16) -> Result<u16, u16> nopanic;',
        examples: [],
        traitFunctions: [],
        sourceUrl: 'https://docs.starknet.io/build/corelib/core-integer-u16',
        fileName: 'core-integer-u16-overflowing-add.mdx',
      },
      {
        title: 'core::integer::u32_overflowing_add',
        description: 'Add with overflow.',
        signature:
          'extern fn u32_overflowing_add(a: u32, b: u32) -> Result<u32, u32> nopanic;',
        examples: [],
        traitFunctions: [],
        sourceUrl: 'https://docs.starknet.io/build/corelib/core-integer-u32',
        fileName: 'core-integer-u32-overflowing-add.mdx',
      },
      {
        title: 'core::integer::NumericLiteral',
        description: 'Numeric literal conversions.',
        signature:
          'trait NumericLiteral<T> { fn from_int(value: felt252) -> T; }',
        examples: [],
        traitFunctions: [
          {
            name: 'from_int',
            description: 'Create from literal.',
            signature: 'fn from_int(value: felt252) -> T;',
          },
        ],
        sourceUrl:
          'https://docs.starknet.io/build/corelib/core-integer-numericliteral',
        fileName: 'core-integer-numericliteral.mdx',
      },
      {
        title: 'core::integer::u256',
        description: '256-bit integer.',
        signature: 'struct u256 { low: u128, high: u128 }',
        examples: [],
        traitFunctions: [],
        sourceUrl: 'https://docs.starknet.io/build/corelib/core-integer-u256',
        fileName: 'core-integer-u256.mdx',
      },
      {
        title: 'core::option::Option',
        description: 'Optional value.',
        signature: 'enum Option<T> { Some: T, None }',
        examples: [],
        traitFunctions: [],
        sourceUrl: 'https://docs.starknet.io/build/corelib/core-option',
        fileName: 'core-option.mdx',
      },
      {
        title: 'core::array::append',
        description: 'Append an element.',
        signature: 'fn append(array: Array<T>, value: T) -> Array<T>;',
        examples: [],
        traitFunctions: [],
        sourceUrl: 'https://docs.starknet.io/build/corelib/core-array-append',
        fileName: 'core-array-append.mdx',
      },
    ];

    const output = formatAsApiIndex(docs);

    expect(output).toContain('[module] core::integer');
    expect(output).toContain('[doc] Unsigned integer ops.');
    expect(output).toContain(
      '[url] https://docs.starknet.io/build/corelib/core-integer',
    );
    expect(output).toContain('[template:unsigned_int] T in {u8,u16,u32}');
    expect(output).toContain(
      'T_overflowing_add(a: T, b: T) -> Result<T, T> nopanic;',
    );
    expect(output).toContain('[traits]');
    expect(output).toContain('NumericLiteral');
    expect(output).toContain('fn from_int');
    expect(output).toContain('[structs]');
    expect(output).toContain('u256');
    expect(output).toContain('[enums]');
    expect(output).toContain('Option');
    expect(output).toContain('[module] core::array');
    expect(output).toContain(
      '[url] https://docs.starknet.io/build/corelib/core-array',
    );
  });
});
