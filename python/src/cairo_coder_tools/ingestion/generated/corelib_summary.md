---
Sources:
  - https://docs.starknet.io/build/corelib/intro
  - https://docs.starknet.io/build/corelib/core-bool
  - https://docs.starknet.io/build/corelib/core-cmp-minmax
---

## Introduction and Core Library Structure

### What is the Corelib?

The Cairo core library, known as _Corelib_, supplies the foundational building blocks necessary for writing provable programs in Cairo. It encompasses essential utilities, data structures, mathematical functions, cryptographic tools, and system interactions, making it suitable for both onchain and offchain development. The corelib is available to all Cairo packages by default and can be accessed by importing specific modules, for example:

```rust
use core::array::Array;

fn main() {
    let mut arr = Array::new();
    arr.append(42);
}
```

### How to use this documentation?

This documentation serves as a comprehensive reference, organizing functionality into modules, constants, functions, types, and traits. It is based on auto-generated documentation from the corelib’s codebase using Scarb; issues or feature requests should be reported on the Cairo or Scarb GitHub repositories. Developers can use the search bar for quick lookups or browse the library modules to explore features.

### Library Structure Overview

The Corelib organizes functionality across various modules.

#### Modules Summary

| Module Path    | Description                                                                                                                                                                                                                                                                          |
| :------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| core::traits   | Core traits for various operations. This module provides a collection of essential traits that define common behavior patterns for Cairo types.                                                                                                                                      |
| core::boolean  | Boolean operations. The `bool` type is a primitive type in Cairo representing a boolean value that can be either `true` or `false`.                                                                                                                                                  |
| core::circuit  | Efficient modular arithmetic computations using arithmetic circuits. This module provides a type-safe way to perform modular arithmetic operations using arithmetic circuits.                                                                                                        |
| core::blake    | —                                                                                                                                                                                                                                                                                    |
| core::box      | `Box` is a smart pointer that allows for heap allocation.                                                                                                                                                                                                                            |
| core::nullable | A wrapper type for handling optional values. `Nullable` is a wrapper type that can either contain a value stored in a `Box` or be null.                                                                                                                                              |
| core::array    | A contiguous collection of elements of the same type in memory, written `Array`. Arrays have O(1) indexing, O(1) push and O(1) pop (from the front).                                                                                                                                 |
| core::dict     | A dictionary-like data structure that maps `felt252` keys to values of any type. The `Felt252Dict` provides efficient key-value storage with operations for inserting, retrieving, and updating values.                                                                              |
| core::result   | Error handling with the `Result` type. `Result` is the type used for returning and propagating errors. It is an enum with the variants, `Ok(T)`, representing success and containing a value, and `Err(E)`, representing error and containing an error value.                        |
| core::option   | Optional values. The `Option` type represents an optional value: every `Option` is either `Some` and contains a value, or `None`, and does not.                                                                                                                                      |
| core::clone    | The `Clone` trait provides the ability to duplicate instances of types that cannot be ‘implicitly copied’. In Cairo, some simple types are “implicitly copyable”: when you assign them or pass them as arguments, the receiver will get a copy, leaving the original value in place. |
| core::ec       | Functions and constructs related to elliptic curve operations on the STARK curve. This module provides implementations for various elliptic curve operations tailored for the STARK curve.                                                                                           |
| core::ecdsa    | Elliptic Curve Digital Signature Algorithm (ECDSA) for the STARK curve. This module provides implementations for ECDSA signature verification and public key recovery.                                                                                                               |
| core::integer  | Integer types and operations. This module provides the built-in integer types and their associated operations.                                                                                                                                                                       |
| core::cmp      | Utilities for comparing and ordering values. This module contains functions that rely on the `PartialOrd` trait for comparing values.                                                                                                                                                |
| core::gas      | Utilities for handling gas in Cairo code.                                                                                                                                                                                                                                            |
| core::math     | Mathematical operations and utilities. Provides extended GCD, modular inverse, and modular arithmetic operations.                                                                                                                                                                    |
| core::num      | —                                                                                                                                                                                                                                                                                    |
| core::ops      | Overloadable operators. Implementing these traits allows you to overload certain operators. Note: Other overloadable operators are also defined in the `core::traits` module.                                                                                                        |
| core::panics   | Core panic mechanism. This module provides the core panic functionality used for error handling in Cairo. It defines the basic types and functions used to trigger and manage panics, which are used when an unrecoverable error is encountered.                                     |
| core::hash     | Generic hashing support. This module provides a hash state abstraction that can be updated with values and finalized to produce a hash digest.                                                                                                                                       |
| core::keccak   | Keccak-256 cryptographic hash function implementation.                                                                                                                                                                                                                               |
| core::pedersen | Pedersen hash related traits implementations. This module provides an implementation of the Pedersen hash function, which is a collision-resistant cryptographic hash function. The `HashState` allows for efficient computation of Pedersen hashes.                                 |

---

Sources:

- https://docs.starknet.io/build/corelib/core-bytes_31-Bytes31Trait
- https://docs.starknet.io/build/corelib/core-bytes_31-bytes31
- https://docs.starknet.io/build/corelib/core-circuit-u384
- https://docs.starknet.io/build/corelib/core-circuit-u96
- https://docs.starknet.io/build/corelib/core-felt252
- https://docs.starknet.io/build/corelib/core-integer-NumericLiteral
- https://docs.starknet.io/build/corelib/core-integer-i128
- https://docs.starknet.io/build/corelib/core-integer-i16
- https://docs.starknet.io/build/corelib/core-integer-i32
- https://docs.starknet.io/build/corelib/core-integer-i64
- https://docs.starknet.io/build/corelib/core-integer-i8
- https://docs.starknet.io/build/corelib/core-integer-u128
- https://docs.starknet.io/build/corelib/core-integer-u16
- https://docs.starknet.io/build/corelib/core-integer-u256
- https://docs.starknet.io/build/corelib/core-integer-u32
- https://docs.starknet.io/build/corelib/core-integer-u512
- https://docs.starknet.io/build/corelib/core-integer-u64
- https://docs.starknet.io/build/corelib/core-integer-u8
- https://docs.starknet.io/build/corelib/core-internal-bounded_int-UnitInt
- https://docs.starknet.io/build/corelib/core-internal-bounded_int-upcast
- https://docs.starknet.io/build/corelib/core-never
- https://docs.starknet.io/build/corelib/core-num-traits-bit_size-BitSize
- https://docs.starknet.io/build/corelib/core-usize
- https://docs.starknet.io/build/corelib/intro

---

#### `felt252`

`felt252` is the basic field element used in Cairo. Operations are computed modulo $P$, where $P = 2^{251} + 17 \cdot 2^{192} + 1$.

```rust
pub extern type felt252;
```

#### Fixed-Size Signed Integers

| Type   | Description                      | Signature               |
| :----- | :------------------------------- | :---------------------- |
| `i8`   | The 8-bit signed integer type.   | `pub extern type i8;`   |
| `i16`  | The 16-bit signed integer type.  | `pub extern type i16;`  |
| `i32`  | The 32-bit signed integer type.  | `pub extern type i32;`  |
| `i64`  | The 64-bit signed integer type.  | `pub extern type i64;`  |
| `i128` | The 128-bit signed integer type. | `pub extern type i128;` |

#### Fixed-Size Unsigned Integers

| Type   | Description                        | Signature               |
| :----- | :--------------------------------- | :---------------------- |
| `u8`   | The 8-bit unsigned integer type.   | `pub extern type u8;`   |
| `u16`  | The 16-bit unsigned integer type.  | `pub extern type u16;`  |
| `u32`  | The 32-bit unsigned integer type.  | `pub extern type u32;`  |
| `u64`  | The 64-bit unsigned integer type.  | `pub extern type u64;`  |
| `u128` | The 128-bit unsigned integer type. | `pub extern type u128;` |

#### Composite Unsigned Integers

##### `u256`

The 256-bit unsigned integer type, composed of two 128-bit parts.

```rust
#[derive(Copy, Drop, Hash, PartialEq, Serde)]
pub struct u256 {
    pub low: u128,
    pub high: u128,
}
```

##### `u512`

```rust
#[derive(Copy, Drop, Hash, PartialEq, Serde)]
pub struct u512 {
    pub limb0: u128,
    pub limb1: u128,
    pub limb2: u128,
    pub limb3: u128,
}
```

#### Circuit Types

##### `u96`

A 96-bit unsigned integer type used as the basic building block for multi-limb arithmetic.

```rust
pub type u96 = BoundedInt;
```

##### `u384`

A 384-bit unsigned integer, used for circuit values, composed of four `BoundedInt` limbs.

```rust
#[derive(Copy, Drop, Debug, PartialEq)]
pub struct u384 {
    pub limb0: BoundedInt,
    pub limb1: BoundedInt,
    pub limb2: BoundedInt,
    pub limb3: BoundedInt,
}
```

Members include:

- `limb0`: The least significant 96 bits.
- `limb1`: Bits 96-191.
- `limb2`: Bits 192-287.
- `limb3`: The most significant 96 bits.

#### Byte Types

##### `bytes31`

Represents a 31-byte fixed-size byte type.

```rust
pub extern type bytes31;
```

It implements the `Bytes31Trait`, which includes the `at` function:

```rust
pub trait Bytes31Trait
// ...
// Trait functions
// ### ​ at
// Returns the byte at the given index (LSB’s index is 0).
// Assumes that `index u8
```

#### Other Fundamental Types and Traits

##### `usize`

`usize` is an alias for `u32` type.

```rust
pub type usize = u32;
```

##### `NumericLiteral`

A trait related to numeric literals.

```rust
pub trait NumericLiteral
```

##### `BitSize` Trait

A trait used to retrieve the size of a type in bits. It has the function `bits()` returning the bit size as a `u32`.

````rust
pub trait BitSize
// ...
// ### ​ bits
// Returns the bit size of `T` as a `usize`.
// ...
// #### ​ Signature
// ```rust
// fn bits() -> u32
// ```
````

---

Sources:

- https://docs.starknet.io/build/corelib/core-SegmentArena
- https://docs.starknet.io/build/corelib/core-box-Box
- https://docs.starknet.io/build/corelib/core-box-BoxTrait
- https://docs.starknet.io/build/corelib/core-byte_array-ByteArray
- https://docs.starknet.io/build/corelib/core-debug-print_byte_array_as_string
- https://docs.starknet.io/build/corelib/core-nullable-NullableTrait

---

### Core Data Structures and Memory Management

#### core::SegmentArena

The `SegmentArena` type is defined as:

```rust
pub extern type SegmentArena;
```

#### core::box::Box and BoxTrait

`core::box::Box` is a type that points to a wrapped value, allowing cheap movement of potentially large values.

Signature:

```rust
pub extern type Box;
```

The associated trait, `BoxTrait`, provides methods for managing the boxed value:

##### new

Creates a new `Box` by allocating space for the provided value.

Signature:

```rust
fn new(value: T) -> Box
```

Example:

```rust
let x = 42;
let boxed_x = BoxTrait::new(x);
```

##### unbox

Unboxes the `Box` and returns the wrapped value.

Signature:

```rust
fn unbox(self: Box) -> T
```

Example:

```rust
let boxed = BoxTrait::new(42);
assert!(boxed.unbox() == 42);
```

##### as_snapshot

Converts a snapshot of a `Box` into a `Box` of a snapshot, useful for non-copyable structures.

Signature:

```rust
fn as_snapshot(self: @Box) -> Box
```

Example:

```rust
let snap_boxed_arr = @BoxTraits::new(array![1, 2, 3]);
let boxed_snap_arr = snap_boxed_arr.as_snapshot();
let snap_arr = boxed_snap_arr.unbox();
```

#### core::byte_array::ByteArray

The `ByteArray` type represents a byte array.

Signature:

```rust
#[derive(Drop, Clone, PartialEq, Serde, Default)]
pub struct ByteArray {
    pub(crate) data: Array,
    pub(crate) pending_word: felt252,
    pub(crate) pending_word_len: u32,
}
```

A function exists to print this structure as a string: `core::debug::print_byte_array_as_string`.

Signature:

```rust
pub fn print_byte_array_as_string(self: ByteArray)
```

Example:

```rust
let ba: ByteArray = "123";
print_byte_array_as_string(@ba);
```

---

Sources:

- https://docs.starknet.io/build/corelib/core-option-OptionTrait
- https://docs.starknet.io/build/corelib/core-boolean-BoolTrait
- https://docs.starknet.io/build/corelib/core-internal-LoopResult
- https://docs.starknet.io/build/corelib/core-internal-OptionRev
- https://docs.starknet.io/build/corelib/core-nullable-FromNullableResult
- https://docs.starknet.io/build/corelib/core-nullable-Nullable
- https://docs.starknet.io/build/corelib/core-nullable-NullableTrait
- https://docs.starknet.io/build/corelib/core-nullable-match_nullable
- https://docs.starknet.io/build/corelib/core-nullable-null
- https://docs.starknet.io/build/corelib/core-option-Option

---

## Control Flow and Optionality

### `core::option::Option` Type and Methods

The `Option` enum represents either `Some(value)` or `None`.

#### Signature

```rust
pub enum Option {
    Some: T,
    None,
}
```

#### Trait Functions

**`and_then`**
Returns `None` if the option is `None`, otherwise calls `f` with the wrapped value and returns the result.

```rust
fn and_then, +core::ops::FnOnce[Output: Option]>(
    self: Option, f: F,
) -> Option
```

**`or`**
Returns the option if it contains a value, otherwise returns `optb`. Arguments are eagerly evaluated.

```rust
fn or>(self: Option, optb: Option) -> Option
```

**`or_else`**
Returns the option if it contains a value, otherwise calls `f` and returns the result (lazily evaluated).

```rust
fn or_else, +core::ops::FnOnce[Output: Option]>(
    self: Option, f: F,
) -> Option
```

**`xor`**
Returns `Some` if exactly one of `self`, `optb` is `Some`, otherwise returns `None`.

```rust
fn xor>(self: Option, optb: Option) -> Option
```

**`is_some` / `is_none`**
Checks if the option is `Some` or `None`, respectively.

```rust
fn is_some(self: @Option) -> bool
fn is_none(self: @Option) -> bool
```

**`unwrap_or` / `unwrap_or_else`**
Returns the contained `Some` value or the provided default/computed default.

```rust
fn unwrap_or>(self: Option, default: T) -> T
fn unwrap_or_else, impl func: FnOnce, +Drop>(
    self: Option, f: F,
) -> T
```

**`map` / `map_or` / `map_or_else`**
Applies a function to the contained value if `Some`.

```rust
fn map, +core::ops::FnOnce[Output: U]>(
    self: Option, f: F,
) -> Option

fn map_or, +Drop, +core::ops::FnOnce[Output: U]>(
    self: Option, default: U, f: F,
) -> U

fn map_or_else,
    +Drop,
    +Drop,
    +core::ops::FnOnce[Output: U],
    +core::ops::FnOnce[Output: U],
>(
    self: Option, default: D, f: F,
) -> U
```

**`take`**
Takes the value out of the option, leaving a `None` in its place.

```rust
fn take(ref self: Option) -> Option
```

**`filter`**
Returns `Some(t)` if `predicate` returns `true` on the wrapped value, otherwise `None`.

```rust
fn filter[Output: bool], +Destruct, +Destruct>(
    self: Option, predicate: P,
) -> Option
```

**`flatten`**
Converts from `Option<Option<T>>` to `Option<T>`.

```rust
fn flatten(self: Option>) -> Option
```

### `core::boolean::BoolTrait`

This trait provides utility functions for `bool`.

#### `then_some`

Returns `Some(t)` if the `bool` is `true`, `None` otherwise.

```rust
fn then_some, T, +Drop>(self: bool, t: T) -> Option
```

Example:

```rust
assert!(false.then_some(0) == None);
assert!(true.then_some(0) == Some(0));
```

### `core::nullable::Nullable` Types

**`core::nullable::Nullable`**
A type that can either be null or contain a boxed value.

```rust
pub extern type Nullable;
```

**`core::nullable::FromNullableResult`**
Represents the result of matching a `Nullable` value.

```rust
pub enum FromNullableResult {
    Null,
    NotNull: Box,
}
```

**`core::nullable::null`**
Returns a null `Nullable` value.

```rust
pub extern fn null() -> Nullable nopanic;
```

**`core::nullable::match_nullable`**
Function to safely handle null/non-null cases of `Nullable`.

```rust
pub extern fn match_nullable(value: Nullable) -> FromNullableResult nopanic;
```

#### `core::nullable::NullableTrait` Functions

**`deref`**
Wrapper for `Deref::deref`.

```rust
fn deref(nullable: Nullable) -> T
```

**`deref_or`**
Returns the contained value if not null, or returns the provided default value.

```rust
fn deref_or>(self: Nullable, default: T) -> T
```

**`deref_or_else`**
Returns the contained value if not null, or computes it from a closure.

```rust
fn deref_or_else, impl func: FnOnce, +Drop>(
    self: Nullable, f: F,
) -> T
```

**`is_null`**
Returns `true` if the value is null.

```rust
fn is_null(self: @Nullable) -> bool
```

### Other Control Flow Types

**`core::internal::LoopResult`**
The return type for loops with an early return.

```rust
pub enum LoopResult {
    Normal: N,
    EarlyReturn: E,
}
```

**`core::internal::OptionRev`**
Same as `Option`, except that the order of the variants is reversed (`None`, then `Some: T`).

```rust
pub enum OptionRev {
    None,
    Some: T,
}
```

---

Sources:

- https://docs.starknet.io/build/corelib/core-RangeCheck
- https://docs.starknet.io/build/corelib/core-byte_array-BYTE_ARRAY_MAGIC
- https://docs.starknet.io/build/corelib/core-bytes_31-Bytes31Impl
- https://docs.starknet.io/build/corelib/core-qm31-QM31Trait
- https://docs.starknet.io/build/corelib/core-serde-Serde
- https://docs.starknet.io/build/corelib/core-starknet-class_hash-ClassHash
- https://docs.starknet.io/build/corelib/core-starknet-eth_address-EthAddress
- https://docs.starknet.io/build/corelib/core-string-StringLiteral
- https://docs.starknet.io/build/corelib/core-to_byte_array-FormatAsByteArray
- https://docs.starknet.io/build/corelib/core-zeroable-NonZero
- https://docs.starknet.io/build/corelib/intro

---

### Specialized Types and Traits

#### core::RangeCheck

`core::RangeCheck` is a general-purpose implicit type.

##### Signature

```rust
pub extern type RangeCheck;
```

#### core::starknet::ClassHash

Represents a Starknet contract class hash. The value range is $[0, 2^{251})$.

##### Signature

```rust
pub extern type ClassHash;
```

#### core::starknet::EthAddress

An Ethereum address, 20 bytes in length.

##### Signature

```rust
#[derive(Copy, Drop, Hash, PartialEq)]
pub struct EthAddress {
    address: felt252,
}
```

#### core::zeroable::NonZero

A wrapper type for non-zero values of type T, guaranteeing that the wrapped value is never zero.

##### Signature

```rust
pub extern type NonZero;
```

#### core::qm31::QM31Trait

Defines operations for the `qm31` type.

##### Signature

```rust
pub trait QM31Trait
```

###### Trait Functions

####### new
Returns a new `qm31` composed of the given parts.

###### Signature

```rust
fn new(
    w0: BoundedInt,
    w1: BoundedInt,
    w2: BoundedInt,
    w3: BoundedInt,
) -> qm31
```

####### unpack
Returns the parts of the given `qm31` as `m31`s.

###### Signature

```rust
fn unpack(self: qm31) -> [BoundedInt; 4]
```

#### core::bytes_31::Bytes31Impl

A trait for accessing a specific byte of a `bytes31` type.

##### Signature

```rust
pub impl Bytes31Impl of Bytes31Trait;
```

###### Impl Functions

####### at
Returns the byte at the given index (LSB’s index is 0). Assumes that `index u8`.

#### core::serde::Serde

A trait that allows for serializing and deserializing values of any type. It defines `serialize` (converts a value into a sequence of `felt252`s) and `deserialize` (reconstructs a value from a sequence of `felt252`s).

##### Signature

```rust
pub trait Serde
```

###### Examples

####### Simple Types (u8, u16, u32, u64, u128)
Simple types are serialized into a single `felt252`.

```rust
let value: u8 = 42;
let mut output: Array = array![];
value.serialize(ref output);
assert!(output == array![42]); // Single value
```

####### Compound Types (u256)
Compound types may be serialized into multiple `felt252` values.

```rust
let value: u256 = u256 { low: 1, high: 2 };
let mut output: Array = array![];
value.serialize(ref output);
assert!(output == array![1, 2]); // Two `felt252`s: low and high
```

###### Implementing `Serde`

####### Using the `Derive` Macro
The `#[derive(Serde)]` attribute can automatically generate the implementation.

```rust
#[derive(Serde)]
struct Point {
    x: u32,
    y: u32
}
```

####### Manual Implementation
For custom serialization behavior:

```rust
impl PointSerde of Serde {
    fn serialize(self: @Point, ref output: Array) {
        output.append((*self.x).into());
        output.append((*self.y).into());
    }

    fn deserialize(ref serialized: Span) -> Option {
        let x = (*serialized.pop_front()?).try_into()?;
        let y = (*serialized.pop_front()?).try_into()?;

        Some(Point { x, y })
    }
}
```

###### Trait Functions

####### serialize
Serializes a value into a sequence of `felt252`s.

###### Signature

```rust
fn serialize(self: @T, ref output: Array)
```

###### Examples

```rust
let value: u256 = 1;
let mut serialized: Array = array![];
value.serialize(ref serialized);
assert!(serialized == array![1, 0]); // `serialized` contains the [low, high] parts of the
`u256` value
```

#### core::to_byte_array::FormatAsByteArray

A trait for formatting values into their ASCII string representation in a `ByteArray`.

##### Signature

```rust
pub trait FormatAsByteArray
```

###### Trait Functions

####### format_as_byte_array
Returns a new `ByteArray` containing the ASCII representation of the value.

###### Signature

```rust
fn format_as_byte_array(self: @T, base: NonZero) -> ByteArray
```

###### Examples

```rust
use core::to_byte_array::FormatAsByteArray;

let num: u32 = 42;
let formatted = num.format_as_byte_array(16);
assert!(formatted, "2a");
```

#### core::byte_array::BYTE_ARRAY_MAGIC

A magic constant for identifying serialization of `ByteArray` variables. An array of `felt252` with this magic value as one of the `felt252` indicates that you should expect right after it a serialized `ByteArray`. This is currently used mainly for prints and panics.

##### Signature

```rust
pub const BYTE_ARRAY_MAGIC: felt252 = 1997209042069643135709344952807065910992472029923670688473712229447419591075;
```

#### core::string::StringLiteral

##### Signature

```rust
pub trait StringLiteral
```

---

Sources:

- https://docs.starknet.io/build/corelib/core-integer-Bitwise
- https://docs.starknet.io/build/corelib/core-integer-BoundedInt
- https://docs.starknet.io/build/corelib/core-integer-i128_diff
- https://docs.starknet.io/build/corelib/core-integer-i16_diff
- https://docs.starknet.io/build/corelib/core-integer-i16_wide_mul
- https://docs.starknet.io/build/corelib/core-integer-i32_diff
- https://docs.starknet.io/build/corelib/core-integer-i32_wide_mul
- https://docs.starknet.io/build/corelib/core-integer-i64_wide_mul
- https://docs.starknet.io/build/corelib/core-integer-i8_wide_mul
- https://docs.starknet.io/build/corelib/core-integer-u128_overflowing_add
- https://docs.starknet.io/build/corelib/core-integer-u128_overflowing_mul
- https://docs.starknet.io/build/corelib/core-integer-u128_overflowing_sub
- https://docs.starknet.io/build/corelib/core-integer-u128_safe_divmod
- https://docs.starknet.io/build/corelib/core-integer-u128_sqrt
- https://docs.starknet.io/build/corelib/core-integer-u128_wide_mul
- https://docs.starknet.io/build/corelib/core-integer-u128_wrapping_add
- https://docs.starknet.io/build/corelib/core-integer-u128_wrapping_sub
- https://docs.starknet.io/build/corelib/core-integer-u16_overflowing_add
- https://docs.starknet.io/build/corelib/core-integer-u16_overflowing_sub
- https://docs.starknet.io/build/corelib/core-integer-u16_safe_divmod
- https://docs.starknet.io/build/corelib/core-integer-u16_sqrt
- https://docs.starknet.io/build/corelib/core-integer-u16_wide_mul
- https://docs.starknet.io/build/corelib/core-integer-u16_wrapping_add
- https://docs.starknet.io/build/corelib/core-integer-u16_wrapping_sub
- https://docs.starknet.io/build/corelib/core-integer-u256_overflow_mul
- https://docs.starknet.io/build/corelib/core-integer-u256_overflow_sub
- https://docs.starknet.io/build/corelib/core-integer-u256_overflowing_add
- https://docs.starknet.io/build/corelib/core-integer-u256_overflowing_mul
- https://docs.starknet.io/build/corelib/core-integer-u256_overflowing_sub
- https://docs.starknet.io/build/corelib/core-integer-u256_sqrt
- https://docs.starknet.io/build/corelib/core-integer-u256_wide_mul
- https://docs.starknet.io/build/corelib/core-integer-u32_overflowing_add
- https://docs.starknet.io/build/corelib/core-integer-u32_overflowing_sub
- https://docs.starknet.io/build/corelib/core-integer-u32_safe_divmod
- https://docs.starknet.io/build/corelib/core-integer-u32_wide_mul
- https://docs.starknet.io/build/corelib/core-integer-u32_wrapping_add
- https://docs.starknet.io/build/corelib/core-integer-u32_wrapping_sub
- https://docs.starknet.io/build/corelib/core-integer-u512_safe_div_rem_by_u256
- https://docs.starknet.io/build/corelib/core-integer-u64_overflowing_add
- https://docs.starknet.io/build/corelib/core-integer-u64_overflowing_sub
- https://docs.starknet.io/build/corelib/core-integer-u64_safe_divmod
- https://docs.starknet.io/build/corelib/core-integer-u64_sqrt
- https://docs.starknet.io/build/corelib/core-integer-u64_wide_mul
- https://docs.starknet.io/build/corelib/core-integer-u64_wrapping_add
- https://docs.starknet.io/build/corelib/core-integer-u64_wrapping_sub
- https://docs.starknet.io/build/corelib/core-integer-u8_overflowing_add
- https://docs.starknet.io/build/corelib/core-integer-u8_overflowing_sub
- https://docs.starknet.io/build/corelib/core-integer-u8_safe_divmod
- https://docs.starknet.io/build/corelib/core-integer-u8_sqrt
- https://docs.starknet.io/build/corelib/core-integer-u8_wide_mul
- https://docs.starknet.io/build/corelib/core-integer-u8_wrapping_add
- https://docs.starknet.io/build/corelib/core-integer-u8_wrapping_sub
- https://docs.starknet.io/build/corelib/core-internal-bounded_int-AddHelper
- https://docs.starknet.io/build/corelib/core-internal-bounded_int-DivRemHelper
- https://docs.starknet.io/build/corelib/core-internal-bounded_int-MulHelper
- https://docs.starknet.io/build/corelib/core-internal-bounded_int-NegateHelper
- https://docs.starknet.io/build/corelib/core-internal-bounded_int-SubHelper
- https://docs.starknet.io/build/corelib/core-internal-bounded_int-bounded_int_add
- https://docs.starknet.io/build/corelib/core-internal-bounded_int-bounded_int_div_rem
- https://docs.starknet.io/build/corelib/core-internal-bounded_int-bounded_int_is_zero
- https://docs.starknet.io/build/corelib/core-internal-bounded_int-bounded_int_mul
- https://docs.starknet.io/build/corelib/core-math-egcd
- https://docs.starknet.io/build/corelib/core-math-inv_mod
- https://docs.starknet.io/build/corelib/core-math-u256_div_mod_n
- https://docs.starknet.io/build/corelib/core-math-u256_inv_mod
- https://docs.starknet.io/build/corelib/core-math-u256_mul_mod_n
- https://docs.starknet.io/build/corelib/core-num-traits-ops-saturating-SaturatingAdd
- https://docs.starknet.io/build/corelib/core-num-traits-ops-sqrt-Sqrt
- https://docs.starknet.io/build/corelib/core-num-traits-ops-widesquare-WideSquare
- https://docs.starknet.io/build/corelib/core-num-traits-ops-wrapping-WrappingAdd
- https://docs.starknet.io/build/corelib/core-qm31-m31_ops-m31_add
- https://docs.starknet.io/build/corelib/core-qm31-m31_ops-m31_div

---

---

Sources:

- https://docs.starknet.io/build/corelib/core-integer-BoundedInt
- https://docs.starknet.io/build/corelib/core-internal-bounded_int-AddHelper
- https://docs.starknet.io/build/corelib/core-internal-bounded_int-DivRemHelper
- https://docs.starknet.io/build/corelib/core-internal-bounded_int-MulHelper
- https://docs.starknet.io/build/corelib/core-internal-bounded_int-SubHelper
- https://docs.starknet.io/build/corelib/core-internal-bounded_int-bounded_int_add
- https://docs.starknet.io/build/corelib/core-internal-bounded_int-bounded_int_div_rem
- https://docs.starknet.io/build/corelib/core-internal-bounded_int-bounded_int_is_zero
- https://docs.starknet.io/build/corelib/core-internal-bounded_int-bounded_int_mul
- https://docs.starknet.io/build/corelib/core-num-traits-ops-sqrt-Sqrt
- https://docs.starknet.io/build/corelib/core-num-traits-ops-widesquare-WideSquare

---

# General Numeric Traits and Abstractions

### core::integer::BoundedInt

This trait provides methods for getting the maximal and minimal values of an integer type.

#### Trait Functions

##### min

Returns the minimal value of the type.

###### Signature

```rust
fn min() -> T
```

##### max

Returns the maximal value of the type.

###### Signature

```rust
fn max() -> T
```

### Arithmetic Helper Traits for BoundedInt

These helper traits define types associated with arithmetic operations on `BoundedInt` instances.

#### core::internal::bounded_int::AddHelper

A helper trait for adding two `BoundedInt` instances.

##### Trait Types

###### Result

```rust
type Result;
```

#### core::internal::bounded_int::SubHelper

A helper trait for subtracting two `BoundedInt` instances.

##### Trait Types

###### Result

```rust
type Result;
```

#### core::internal::bounded_int::MulHelper

A helper trait for multiplying two `BoundedInt` instances.

##### Trait Types

###### Result

```rust
type Result;
```

#### core::internal::bounded_int::DivRemHelper

A helper trait for dividing two `BoundedInt` instances.

##### Trait Types

###### DivT

```rust
type DivT;
```

###### RemT

```rust
type RemT;
```

### Bounded Integer Arithmetic Functions

These external functions implement arithmetic operations potentially constrained by range checks.

#### bounded_int_add

```rust
extern fn bounded_int_add(lhs: Lhs, rhs: Rhs) -> Result nopanic;
```

#### bounded_int_div_rem

```rust
extern fn bounded_int_div_rem(lhs: Lhs, rhs: NonZero) -> (DivT, RemT) implicits(RangeCheck) nopanic;
```

#### bounded_int_mul

```rust
extern fn bounded_int_mul(lhs: Lhs, rhs: Rhs) -> Result nopanic;
```

#### bounded_int_is_zero

```rust
extern fn bounded_int_is_zero(value: T) -> IsZeroResult nopanic;
```

### Other Numeric Operation Traits

#### core::num::traits::ops::sqrt::Sqrt

A trait for computing the square root of a number.

##### Examples

```rust
use core::num::traits::Sqrt;

assert!(9_u8.sqrt() == 3);
```

##### Trait Functions

###### sqrt

Computes the square root of a number.

###### Signature

```rust
fn sqrt(self: T) -> SqrtTarget
```

##### Trait Types

###### Target

The type of the result of the square root operation.

###### Signature

```rust
type Target;
```

#### core::num::traits::ops::widesquare::WideSquare

A trait for a type that can be squared to produce a wider type, preventing overflow.

##### Examples

```rust
use core::num::traits::WideSquare;

let a: u8 = 16;
let result: u16 = a.wide_square();
assert!(result == 256);
```

##### Trait Functions

###### wide_square

Calculates the square, producing a wider type.

###### Signature

```rust
fn wide_square(self: T) -> WideSquareTarget
```

##### Trait Types

###### Target

The type of the result of the square.

###### Signature

```rust
type Target;
```

---

Sources:

- https://docs.starknet.io/build/corelib/core-integer-i128_diff
- https://docs.starknet.io/build/corelib/core-integer-i16_diff
- https://docs.starknet.io/build/corelib/core-integer-i16_wide_mul
- https://docs.starknet.io/build/corelib/core-integer-i32_diff
- https://docs.starknet.io/build/corelib/core-integer-i32_wide_mul
- https://docs.starknet.io/build/corelib/core-integer-i64_wide_mul
- https://docs.starknet.io/build/corelib/core-integer-i8_wide_mul
- https://docs.starknet.io/build/corelib/core-internal-bounded_int-NegateHelper

---

### Difference Operations (`*_diff`)

These functions perform subtraction with range checking for signed integers.

#### `core::integer::i128_diff`

If `lhs` >= `rhs` returns `Ok(lhs - rhs)` else returns `Err(2**128 + lhs - rhs)`.
Signature:

```rust
pub extern fn i128_diff(lhs: i128, rhs: i128) -> Result implicits(RangeCheck) nopanic;
```

#### `core::integer::i32_diff`

If `lhs` >= `rhs` returns `Ok(lhs - rhs)` else returns `Err(2**32 + lhs - rhs)`.
Signature:

```rust
pub extern fn i32_diff(lhs: i32, rhs: i32) -> Result implicits(RangeCheck) nopanic;
```

#### `core::integer::i16_diff`

If `lhs` >= `rhs` returns `Ok(lhs - rhs)` else returns `Err(2**16 + lhs - rhs)`.
Signature:

```rust
pub extern fn i16_diff(lhs: i16, rhs: i16) -> Result implicits(RangeCheck) nopanic;
```

### Wide Multiplication Operations (`*_wide_mul`)

These functions multiply two signed integers, resulting in a wider integer type.

#### `core::integer::i8_wide_mul`

Signature:

```rust
pub extern fn i8_wide_mul(lhs: i8, rhs: i8) -> i16 nopanic;
```

#### `core::integer::i16_wide_mul`

Signature:

```rust
pub extern fn i16_wide_mul(lhs: i16, rhs: i16) -> i32 nopanic;
```

#### `core::integer::i32_wide_mul`

Signature:

```rust
pub extern fn i32_wide_mul(lhs: i32, rhs: i32) -> i64 nopanic;
```

#### `core::integer::i64_wide_mul`

Signature:

```rust
pub extern fn i64_wide_mul(lhs: i64, rhs: i64) -> i128 nopanic;
```

### Negation Helper Trait

#### `core::internal::bounded_int::NegateHelper`

A helper trait for negating a `BoundedInt` instance.

Trait functions:

##### `negate`

Negates the given value.
Signature:

```rust
fn negate(self: T) -> NegateHelperResult
```

Trait types:

##### `Result`

The result of negating the given value.
Signature:

```rust
type Result;
```

---

Sources:

- https://docs.starknet.io/build/corelib/core-integer-Bitwise
- https://docs.starknet.io/build/corelib/core-integer-u128_overflowing_add
- https://docs.starknet.io/build/corelib/core-integer-u128_overflowing_mul
- https://docs.starknet.io/build/corelib/core-integer-u128_overflowing_sub
- https://docs.starknet.io/build/corelib/core-integer-u128_safe_divmod
- https://docs.starknet.io/build/corelib/core-integer-u128_sqrt
- https://docs.starknet.io/build/corelib/core-integer-u128_wide_mul
- https://docs.starknet.io/build/corelib/core-integer-u128_wrapping_add
- https://docs.starknet.io/build/corelib/core-integer-u128_wrapping_sub
- https://docs.starknet.io/build/corelib/core-integer-u16_overflowing_add
- https://docs.starknet.io/build/corelib/core-integer-u16_overflowing_sub
- https://docs.starknet.io/build/corelib/core-integer-u16_safe_divmod
- https://docs.starknet.io/build/corelib/core-integer-u16_sqrt
- https://docs.starknet.io/build/corelib/core-integer-u16_wide_mul
- https://docs.starknet.io/build/corelib/core-integer-u16_wrapping_add
- https://docs.starknet.io/build/corelib/core-integer-u16_wrapping_sub
- https://docs.starknet.io/build/corelib/core-integer-u32_overflowing_add
- https://docs.starknet.io/build/corelib/core-integer-u32_overflowing_sub
- https://docs.starknet.io/build/corelib/core-integer-u32_safe_divmod
- https://docs.starknet.io/build/corelib/core-integer-u32_wide_mul
- https://docs.starknet.io/build/corelib/core-integer-u32_wrapping_add
- https://docs.starknet.io/build/corelib/core-integer-u32_wrapping_sub
- https://docs.starknet.io/build/corelib/core-integer-u64_overflowing_add
- https://docs.starknet.io/build/corelib/core-integer-u64_overflowing_sub
- https://docs.starknet.io/build/corelib/core-integer-u64_safe_divmod
- https://docs.starknet.io/build/corelib/core-integer-u64_sqrt
- https://docs.starknet.io/build/corelib/core-integer-u64_wide_mul
- https://docs.starknet.io/build/corelib/core-integer-u64_wrapping_add
- https://docs.starknet.io/build/corelib/core-integer-u64_wrapping_sub
- https://docs.starknet.io/build/corelib/core-integer-u8_overflowing_add
- https://docs.starknet.io/build/corelib/core-integer-u8_overflowing_sub
- https://docs.starknet.io/build/corelib/core-integer-u8_safe_divmod
- https://docs.starknet.io/build/corelib/core-integer-u8_sqrt
- https://docs.starknet.io/build/corelib/core-integer-u8_wide_mul
- https://docs.starknet.io/build/corelib/core-integer-u8_wrapping_add
- https://docs.starknet.io/build/corelib/core-integer-u8_wrapping_sub
- https://docs.starknet.io/build/corelib/core-num-traits-ops-saturating-SaturatingAdd

---

### Unsigned Integer Operations (u8 through u128)

This section summarizes the available arithmetic operations for unsigned integers ranging from u8 to u128, including overflowing, wrapping, safe division/modulo, and square root functions, as well as the `SaturatingAdd` trait.

#### u8 Operations

##### Overflowing Arithmetic

- **`u8_overflowing_add`**
  ```rust
  pub extern fn u8_overflowing_add(lhs: u8, rhs: u8) -> Result implicits(RangeCheck) nopanic;
  ```
- **`u8_overflowing_sub`**
  ```rust
  pub extern fn u8_overflowing_sub(lhs: u8, rhs: u8) -> Result implicits(RangeCheck) nopanic;
  ```

##### Safe Division/Modulo

- **`u8_safe_divmod`**
  ```rust
  pub extern fn u8_safe_divmod(lhs: u8, rhs: NonZero) -> (u8, u8) implicits(RangeCheck) nopanic;
  ```

##### Square Root

- **`u8_sqrt`**
  ```rust
  pub extern fn u8_sqrt(value: u8) -> u8 implicits(RangeCheck) nopanic;
  ```

##### Wide Multiplication

- **`u8_wide_mul`**
  ```rust
  pub extern fn u8_wide_mul(lhs: u8, rhs: u8) -> u16 nopanic;
  ```

##### Wrapping Arithmetic

- **`u8_wrapping_add`**
  ```rust
  pub fn u8_wrapping_add(lhs: u8, rhs: u8) -> u8
  ```
- **`u8_wrapping_sub`**
  ```rust
  pub fn u8_wrapping_sub(lhs: u8, rhs: u8) -> u8
  ```

#### u16 Operations

##### Overflowing Arithmetic

- **`u16_overflowing_add`**
  ```rust
  pub extern fn u16_overflowing_add(lhs: u16, rhs: u16) -> Result implicits(RangeCheck) nopanic;
  ```
- **`u16_overflowing_sub`**
  ```rust
  pub extern fn u16_overflowing_sub(lhs: u16, rhs: u16) -> Result implicits(RangeCheck) nopanic;
  ```

##### Safe Division/Modulo

- **`u16_safe_divmod`**
  ```rust
  pub extern fn u16_safe_divmod(lhs: u16, rhs: NonZero) -> (u16, u16) implicits(RangeCheck) nopanic;
  ```

##### Square Root

- **`u16_sqrt`**
  ```rust
  pub extern fn u16_sqrt(value: u16) -> u8 implicits(RangeCheck) nopanic;
  ```

##### Wide Multiplication

- **`u16_wide_mul`**
  ```rust
  pub extern fn u16_wide_mul(lhs: u16, rhs: u16) -> u32 nopanic;
  ```

##### Wrapping Arithmetic

- **`u16_wrapping_add`**
  ```rust
  pub fn u16_wrapping_add(lhs: u16, rhs: u16) -> u16
  ```
- **`u16_wrapping_sub`**
  ```rust
  pub fn u16_wrapping_sub(lhs: u16, rhs: u16) -> u16
  ```

#### u32 Operations

##### Overflowing Arithmetic

- **`u32_overflowing_add`**
  ```rust
  pub extern fn u32_overflowing_add(lhs: u32, rhs: u32) -> Result implicits(RangeCheck) nopanic;
  ```
- **`u32_overflowing_sub`**
  ```rust
  pub extern fn u32_overflowing_sub(lhs: u32, rhs: u32) -> Result implicits(RangeCheck) nopanic;
  ```

##### Safe Division/Modulo

- **`u32_safe_divmod`**
  ```rust
  pub extern fn u32_safe_divmod(lhs: u32, rhs: NonZero) -> (u32, u32) implicits(RangeCheck) nopanic;
  ```

##### Wide Multiplication

- **`u32_wide_mul`**
  ```rust
  pub extern fn u32_wide_mul(lhs: u32, rhs: u32) -> u64 nopanic;
  ```

##### Wrapping Arithmetic

- **`u32_wrapping_add`**
  ```rust
  pub fn u32_wrapping_add(lhs: u32, rhs: u32) -> u32
  ```
- **`u32_wrapping_sub`**
  ```rust
  pub fn u32_wrapping_sub(lhs: u32, rhs: u32) -> u32
  ```

#### u64 Operations

##### Overflowing Arithmetic

- **`u64_overflowing_add`**
  ```rust
  pub extern fn u64_overflowing_add(lhs: u64, rhs: u64) -> Result implicits(RangeCheck) nopanic;
  ```
- **`u64_overflowing_sub`**
  ```rust
  pub extern fn u64_overflowing_sub(lhs: u64, rhs: u64) -> Result implicits(RangeCheck) nopanic;
  ```

##### Safe Division/Modulo

- **`u64_safe_divmod`**
  ```rust
  pub extern fn u64_safe_divmod(lhs: u64, rhs: NonZero) -> (u64, u64) implicits(RangeCheck) nopanic;
  ```

##### Square Root

- **`u64_sqrt`**
  ```rust
  pub extern fn u64_sqrt(value: u64) -> u32 implicits(RangeCheck) nopanic;
  ```

##### Wide Multiplication

- **`u64_wide_mul`**
  ```rust
  pub extern fn u64_wide_mul(lhs: u64, rhs: u64) -> u128 nopanic;
  ```

##### Wrapping Arithmetic

- **`u64_wrapping_add`**
  ```rust
  pub fn u64_wrapping_add(lhs: u64, rhs: u64) -> u64
  ```
- **`u64_wrapping_sub`**
  ```rust
  pub fn u64_wrapping_sub(lhs: u64, rhs: u64) -> u64
  ```

#### u128 Operations

##### Overflowing Arithmetic

- **`u128_overflowing_add`**
  ```rust
  pub extern fn u128_overflowing_add(lhs: u128, rhs: u128) -> Result implicits(RangeCheck) nopanic;
  ```
- **`u128_overflowing_sub`**
  ```rust
  pub extern fn u128_overflowing_sub(lhs: u128, rhs: u128) -> Result implicits(RangeCheck) nopanic;
  ```
- **`u128_overflowing_mul`**
  ```rust
  pub fn u128_overflowing_mul(lhs: u128, rhs: u128) -> (u128, bool)
  ```

##### Safe Division/Modulo

- **`u128_safe_divmod`**
  ```rust
  pub extern fn u128_safe_divmod(lhs: u128, rhs: NonZero) -> (u128, u128) implicits(RangeCheck) nopanic;
  ```

##### Square Root

- **`u128_sqrt`**
  ```rust
  pub extern fn u128_sqrt(value: u128) -> u64 implicits(RangeCheck) nopanic;
  ```

##### Wide Multiplication

- **`u128_wide_mul`**
  Multiplies two u128s and returns `(high, low)` - the 128-bit parts of the result.
  ```rust
  pub fn u128_wide_mul(a: u128, b: u128) -> (u128, u128)
  ```

##### Wrapping Arithmetic

- **`u128_wrapping_add`**
  ```rust
  pub fn u128_wrapping_add(lhs: u128, rhs: u128) -> u128
  ```
- **`u128_wrapping_sub`**
  ```rust
  pub fn u128_wrapping_sub(a: u128, b: u128) -> u128
  ```

#### Numeric Traits

##### Saturating Addition

Performs addition that saturates at the numeric bounds instead of overflowing.

- **`SaturatingAdd` Trait**

  ```rust
  pub trait SaturatingAdd
  ```

  - **`saturating_add`**
    Saturating addition. Computes `self + other`, saturating at the relevant high or low boundary of the type.

    ```rust
    fn saturating_add(self: T, other: T) -> T
    ```

    Example:

    ```rust
    use core::num::traits::SaturatingAdd;

    assert!(255_u8.saturating_add(1_u8) == 255);
    ```

---

Sources:

- https://docs.starknet.io/build/corelib/core-integer-u256_overflow_mul
- https://docs.starknet.io/build/corelib/core-integer-u256_overflow_sub
- https://docs.starknet.io/build/corelib/core-integer-u256_overflowing_add
- https://docs.starknet.io/build/corelib/core-integer-u256_overflowing_mul
- https://docs.starknet.io/build/corelib/core-integer-u256_overflowing_sub
- https://docs.starknet.io/build/corelib/core-integer-u256_sqrt
- https://docs.starknet.io/build/corelib/core-integer-u256_wide_mul
- https://docs.starknet.io/build/corelib/core-integer-u512_safe_div_rem_by_u256

---

### Large Integer Arithmetic (u256 and u512)

#### `core::integer::u256_overflow_mul`

##### Signature

```rust
pub fn u256_overflow_mul(lhs: u256, rhs: u256) -> (u256, bool)
```

#### `core::integer::u256_overflow_sub`

##### Signature

```rust
pub fn u256_overflow_sub(lhs: u256, rhs: u256) -> (u256, bool)
```

#### `core::integer::u256_overflowing_add`

##### Signature

```rust
pub fn u256_overflowing_add(lhs: u256, rhs: u256) -> (u256, bool)
```

#### `core::integer::u256_overflowing_mul`

##### Signature

```rust
pub fn u256_overflowing_mul(lhs: u256, rhs: u256) -> (u256, bool)
```

#### `core::integer::u256_overflowing_sub`

##### Signature

```rust
pub fn u256_overflowing_sub(lhs: u256, rhs: u256) -> (u256, bool)
```

#### `core::integer::u256_sqrt`

##### Signature

```rust
pub extern fn u256_sqrt(a: u256) -> u128 implicits(RangeCheck) nopanic;
```

#### `core::integer::u256_wide_mul`

##### Signature

```rust
pub fn u256_wide_mul(a: u256, b: u256) -> u512
```

#### `core::integer::u512_safe_div_rem_by_u256`

Calculates division with remainder of a `u512` by a non-zero `u256`.

##### Signature

```rust
pub fn u512_safe_div_rem_by_u256(lhs: u512, rhs: NonZero) -> (u512, u256)
```

---

Sources:

- https://docs.starknet.io/build/corelib/core-math-egcd
- https://docs.starknet.io/build/corelib/core-math-inv_mod
- https://docs.starknet.io/build/corelib/core-math-u256_div_mod_n
- https://docs.starknet.io/build/corelib/core-math-u256_inv_mod
- https://docs.starknet.io/build/corelib/core-math-u256_mul_mod_n
- https://docs.starknet.io/build/corelib/core-num-traits-ops-wrapping-WrappingAdd
- https://docs.starknet.io/build/corelib/core-qm31-m31_ops-m31_add
- https://docs.starknet.io/build/corelib/core-qm31-m31_ops-m31_div

---

### Modular Arithmetic and Field Operations

#### Modular Multiplicative Inverse and Division

The modular multiplicative inverse of $a$ modulo $n$ is computed by `core::math::inv_mod(a, n)`, returning $s$ such that $a \cdot s \equiv 1 \pmod n$, or `None` if $\gcd(a, n) > 1$.

```rust
use core::math::inv_mod;

let inv = inv_mod::(3, 7);
assert!(inv == Some(5));
```

For `u256` types, `core::math::u256_inv_mod(a, n)` returns the inverse or `None` if $a$ is not invertible modulo $n$ (including when $n=1$).

```rust
use core::math::u256_inv_mod;

let inv = u256_inv_mod(3, 17);
assert!(inv == Some(6));
```

Division modulo $n$ for `u256` types is implemented as multiplication by the inverse: `core::math::u256_div_mod_n(a, b, n)` returns $a/b \pmod n$, or `None` if $b$ is not invertible modulo $n$.

```rust
use core::math::u256_inv_mod;

let result = u256_div_mod_n(17, 7, 29);
assert!(result == Some(19));
```

#### Modular Multiplication

`core::math::u256_mul_mod_n(a, b, n)` computes $a \cdot b \pmod n$.

```rust
use core::math::u256_mul_mod_n;

let result = u256_mul_mod_n(17, 23, 29);
assert!(result == 14);
```

#### Field Operations (m31)

Operations for `m31` bounded integers in the field context include:

- **Addition:** `core::qm31::m31_ops::m31_add(a: BoundedInt, b: BoundedInt) -> BoundedInt nopanic;`
- **Division:** `core::qm31::m31_ops::m31_div(a: BoundedInt, b: NonZero>) -> BoundedInt nopanic;`

---

Sources:

- https://docs.starknet.io/build/corelib/core-clone-Clone
- https://docs.starknet.io/build/corelib/core-cmp-max
- https://docs.starknet.io/build/corelib/core-cmp-min
- https://docs.starknet.io/build/corelib/core-num-traits-bounded-Bounded
- https://docs.starknet.io/build/corelib/core-num-traits-one-One
- https://docs.starknet.io/build/corelib/core-num-traits-ops-checked-CheckedAdd
- https://docs.starknet.io/build/corelib/core-num-traits-ops-divrem-DivRem
- https://docs.starknet.io/build/corelib/core-num-traits-ops-overflowing-OverflowingAdd
- https://docs.starknet.io/build/corelib/core-num-traits-ops-overflowing-OverflowingMul
- https://docs.starknet.io/build/corelib/core-num-traits-ops-pow-Pow
- https://docs.starknet.io/build/corelib/core-num-traits-ops-saturating-SaturatingMul
- https://docs.starknet.io/build/corelib/core-num-traits-ops-saturating-SaturatingSub
- https://docs.starknet.io/build/corelib/core-num-traits-ops-wrapping-WrappingMul
- https://docs.starknet.io/build/corelib/core-num-traits-ops-wrapping-WrappingSub
- https://docs.starknet.io/build/corelib/core-num-traits-zero-Zero
- https://docs.starknet.io/build/corelib/core-ops-arith-AddAssign
- https://docs.starknet.io/build/corelib/core-ops-arith-DivAssign
- https://docs.starknet.io/build/corelib/core-ops-arith-MulAssign
- https://docs.starknet.io/build/corelib/core-ops-arith-RemAssign
- https://docs.starknet.io/build/corelib/core-ops-arith-SubAssign
- https://docs.starknet.io/build/corelib/core-ops-deref-Deref
- https://docs.starknet.io/build/corelib/core-ops-deref-DerefMut
- https://docs.starknet.io/build/corelib/core-ops-function-Fn
- https://docs.starknet.io/build/corelib/core-ops-function-FnOnce
- https://docs.starknet.io/build/corelib/core-ops-index-Index
- https://docs.starknet.io/build/corelib/core-ops-index-IndexView
- https://docs.starknet.io/build/corelib/core-traits-Add
- https://docs.starknet.io/build/corelib/core-traits-AddEq
- https://docs.starknet.io/build/corelib/core-traits-BitAnd
- https://docs.starknet.io/build/corelib/core-traits-BitNot
- https://docs.starknet.io/build/corelib/core-traits-BitOr
- https://docs.starknet.io/build/corelib/core-traits-BitXor
- https://docs.starknet.io/build/corelib/core-traits-Copy
- https://docs.starknet.io/build/corelib/core-traits-Default
- https://docs.starknet.io/build/corelib/core-traits-Destruct
- https://docs.starknet.io/build/corelib/core-traits-Div
- https://docs.starknet.io/build/corelib/core-traits-DivEq
- https://docs.starknet.io/build/corelib/core-traits-DivRem
- https://docs.starknet.io/build/corelib/core-traits-Drop
- https://docs.starknet.io/build/corelib/core-traits-Index
- https://docs.starknet.io/build/corelib/core-traits-Into
- https://docs.starknet.io/build/corelib/core-traits-Mul
- https://docs.starknet.io/build/corelib/core-traits-MulEq
- https://docs.starknet.io/build/corelib/core-traits-Neg
- https://docs.starknet.io/build/corelib/core-traits-Not
- https://docs.starknet.io/build/corelib/core-traits-PanicDestruct
- https://docs.starknet.io/build/corelib/core-traits-PartialEq
- https://docs.starknet.io/build/corelib/core-traits-PartialOrd
- https://docs.starknet.io/build/corelib/core-traits-Rem
- https://docs.starknet.io/build/corelib/core-traits-RemEq
- https://docs.starknet.io/build/corelib/core-traits-Sub
- https://docs.starknet.io/build/corelib/core-traits-SubEq
- https://docs.starknet.io/build/corelib/core-traits-TryInto

---

---

Sources:

- https://docs.starknet.io/build/corelib/core-clone-Clone
- https://docs.starknet.io/build/corelib/core-num-traits-bounded-Bounded
- https://docs.starknet.io/build/corelib/core-num-traits-one-One
- https://docs.starknet.io/build/corelib/core-num-traits-ops-divrem-DivRem
- https://docs.starknet.io/build/corelib/core-num-traits-ops-pow-Pow
- https://docs.starknet.io/build/corelib/core-num-traits-zero-Zero
- https://docs.starknet.io/build/corelib/core-traits-BitNot
- https://docs.starknet.io/build/corelib/core-traits-BitXor
- https://docs.starknet.io/build/corelib/core-traits-Copy
- https://docs.starknet.io/build/corelib/core-traits-SubEq

---

## Core Numeric and Duplication Traits

### Duplication Traits (`Clone` and `Copy`)

#### `core::clone::Clone`

This trait allows for explicit duplication of an object. It differs from `Copy` because `Clone` is always explicit and may be expensive, whereas `Copy` is implicit and inexpensive. If all fields of a type implement `Clone`, this trait can be derived.

##### Signature

```rust
pub trait Clone
```

##### Trait Functions

- `clone`: Returns a copy of the value.

```rust
fn clone(self: @T) -> T
```

Example:

```rust
let arr = array![1, 2, 3];
assert!(arr == arr.clone());
```

#### `core::traits::Copy`

This trait signifies that a value has copy semantics rather than move semantics. Types implementing `Copy` can be duplicated when used.

##### Signature

```rust
pub trait Copy
```

### Numeric Identity Traits (`Zero` and `One`)

#### `core::num::traits::zero::Zero`

Defines an additive identity element for `T`.
Laws: $a + 0 = a$ and $0 + a = a$.

##### Signature

```rust
pub trait Zero
```

##### Trait Functions

- `zero`: Returns the additive identity element of `T`, `0`.
  ```rust
  fn zero() -> T
  ```
- `is_zero`: Returns true if `self` equals the additive identity.
- `is_non_zero`: Returns false if `self` equals the additive identity.

#### `core::num::traits::one::One`

Defines a multiplicative identity element for `T`.
Laws: $a * 1 = a$ and $1 * a = a$.

##### Signature

```rust
pub trait One
```

##### Trait Functions

- `one`: Returns the multiplicative identity element of `T`, `1`.
  ```rust
  fn one() -> T
  ```
- `is_one`: Returns true if `self` is equal to the multiplicative identity.
- `is_non_one`: Returns false if `self` is equal to the multiplicative identity.

### Numeric Bounds (`Bounded`)

#### `core::num::traits::bounded::Bounded`

A trait defining minimum and maximum bounds for numeric types that support constant values.

##### Signature

```rust
pub trait Bounded
```

##### Trait Constants

- `MIN`: Returns the minimum value for type `T`.
  ```rust
  const MIN: T;
  ```
- `MAX`: Returns the maximum value for type `T`.
  ```rust
  const MAX: T;
  ```

### Numeric Operations (`Pow` and `DivRem`)

#### `core::num::traits::ops::pow::Pow`

Raises a value to the power of `exp`. Note that $0^0$ returns $1$. Panics if the result overflows the output type.

##### Signature

```rust
pub trait Pow
```

##### Trait Functions

- `pow`: Returns `self` to the power `exp`.
  ```rust
  fn pow(self: Base, exp: Exp) -> PowOutput
  ```

#### `core::num::traits::ops::divrem::DivRem`

Performs truncated division and remainder, truncating toward zero (like Cairo’s `/` and `%`). The divisor must be wrapped in `NonZero`.

##### Signature

```rust
pub trait DivRem
```

##### Associated Types

- `Quotient`: The type produced by the division.
- `Remainder`: The type produced by the modulo operation.

##### Trait Functions

- `div_rem`: Computes both `/` and `%` in a single pass.
  `rust
fn div_rem(self: T, other: NonZero) -> (DivRemQuotient, DivRemRemainder)
`
  Example (Identical operand types):

```rust
use core::traits::{DivRem, NonZero};

let lhs: u32 = 7;
let rhs: NonZero = 3.try_into().unwrap();
assert!(DivRem::::div_rem(lhs, rhs) == (2, 1));
```

---

Sources:

- https://docs.starknet.io/build/corelib/core-num-traits-ops-checked-CheckedAdd
- https://docs.starknet.io/build/corelib/core-num-traits-ops-overflowing-OverflowingAdd
- https://docs.starknet.io/build/corelib/core-num-traits-ops-overflowing-OverflowingMul
- https://docs.starknet.io/build/corelib/core-num-traits-ops-saturating-SaturatingMul
- https://docs.starknet.io/build/corelib/core-num-traits-ops-saturating-SaturatingSub
- https://docs.starknet.io/build/corelib/core-num-traits-ops-wrapping-WrappingMul
- https://docs.starknet.io/build/corelib/core-num-traits-ops-wrapping-WrappingSub

---

## Arithmetic Safety and Wrapping Traits

### Checked Operations

#### `core::num::traits::ops::checked::CheckedAdd`

Performs addition that returns `None` instead of wrapping around on overflow.

##### Signature

```rust
pub trait CheckedAdd
```

##### Trait functions

###### `checked_add`

Adds two numbers, checking for overflow. If overflow happens, `None` is returned.

###### Signature

```rust
fn checked_add(self: T, v: T) -> Option
```

##### Examples

```rust
use core::num::traits::CheckedAdd;

let result = 1_u8.checked_add(2);
assert!(result == Some(3));

let result = 255_u8.checked_add(1);
assert!(result == None); // Overflow
```

### Overflowing Operations

These operations return a flag indicating if an arithmetic overflow occurred.

#### `core::num::traits::ops::overflowing::OverflowingAdd`

Performs addition with a flag for overflow.

##### Signature

```rust
pub trait OverflowingAdd
```

##### Trait functions

###### `overflowing_add`

Returns a tuple of the sum along with a boolean indicating whether an arithmetic overflow would occur. If an overflow would have occurred then the wrapped value is returned.

###### Signature

```rust
fn overflowing_add(self: T, v: T) -> (T, bool)
```

##### Examples

```rust
use core::num::traits::OverflowingAdd;

let (result, is_overflow) = 1_u8.overflowing_add(255_u8);
assert!(result == 0);
assert!(is_overflow);
```

#### `core::num::traits::ops::overflowing::OverflowingMul`

Performs multiplication with a flag for overflow.

##### Signature

```rust
pub trait OverflowingMul
```

##### Trait functions

###### `overflowing_mul`

Returns a tuple of the product along with a boolean indicating whether an arithmetic overflow would occur. If an overflow would have occurred then the wrapped value is returned.

###### Signature

```rust
fn overflowing_mul(self: T, v: T) -> (T, bool)
```

##### Examples

```rust
use core::num::traits::OverflowingMul;

let (result, is_overflow) = 1_u8.overflowing_mul(2_u8);
assert!(result == 2);
assert!(!is_overflow);
```

### Saturating Operations

These operations saturate at the numeric bounds instead of overflowing.

#### `core::num::traits::ops::saturating::SaturatingMul`

Performs multiplication that saturates at the numeric bounds instead of overflowing.

##### Signature

```rust
pub trait SaturatingMul
```

##### Trait functions

###### `saturating_mul`

Saturating multiplication. Computes `self * other`, saturating at the relevant high or low boundary of the type.

###### Signature

```rust
fn saturating_mul(self: T, other: T) -> T
```

##### Examples

```rust
use core::num::traits::SaturatingMul;

assert!(100_u8.saturating_mul(3_u8) == 255);
```

#### `core::num::traits::ops::saturating::SaturatingSub`

Performs subtraction that saturates at the numeric bounds instead of overflowing.

##### Signature

```rust
pub trait SaturatingSub
```

##### Trait functions

###### `saturating_sub`

Saturating subtraction. Computes `self - other`, saturating at the relevant high or low boundary of the type.

###### Signature

```rust
fn saturating_sub(self: T, other: T) -> T
```

##### Examples

```rust
use core::num::traits::SaturatingSub;

assert!(1_u8.saturating_sub(2_u8) == 0);
```

### Wrapping Operations

These operations wrap around on overflow (modular arithmetic).

#### `core::num::traits::ops::wrapping::WrappingMul`

Performs multiplication that wraps around on overflow.

##### Signature

```rust
pub trait WrappingMul
```

##### Trait functions

###### `wrapping_mul`

Wrapping (modular) multiplication. Computes `self * other`, wrapping around at the boundary of the type.

###### Signature

```rust
fn wrapping_mul(self: T, v: T) -> T
```

##### Examples

```rust
use core::num::traits::WrappingMul;

let result = 10_u8.wrapping_mul(30);
assert!(result == 44); // (10 * 30) % 256 = 44

let result = 200_u8.wrapping_mul(2);
assert!(result == 144); // (200 * 2) % 256 = 144
```

#### `core::num::traits::ops::wrapping::WrappingSub`

Performs subtraction that wraps around on overflow.

##### Signature

```rust
pub trait WrappingSub
```

##### Trait functions

###### `wrapping_sub`

Wrapping (modular) subtraction. Computes `self - other`, wrapping around at the boundary of the type.

###### Signature

```rust
fn wrapping_sub(self: T, v: T) -> T
```

##### Examples

```rust
use core::num::traits::WrappingSub;

let result = 0_u8.wrapping_sub(1);
assert!(result == 255);

let result = 100_u8.wrapping_sub(150);
assert!(result == 206);
```

---

Sources:

- https://docs.starknet.io/build/corelib/core-ops-arith-AddAssign
- https://docs.starknet.io/build/corelib/core-ops-arith-DivAssign
- https://docs.starknet.io/build/corelib/core-ops-arith-MulAssign
- https://docs.starknet.io/build/corelib/core-ops-arith-RemAssign
- https://docs.starknet.io/build/corelib/core-ops-arith-SubAssign
- https://docs.starknet.io/build/corelib/core-traits-AddEq
- https://docs.starknet.io/build/corelib/core-traits-DivEq
- https://docs.starknet.io/build/corelib/core-traits-MulEq

---

# Compound Assignment Operators

### core::ops::arith::AddAssign (`+=`)

The addition assignment operator `+=`.

#### Signature

```rust
pub trait AddAssign
```

#### Trait Function: `add_assign`

Performs the `+=` operation.

##### Signature

```rust
fn add_assign(ref self: Lhs, rhs: Rhs)
```

##### Example

```rust
let mut x: u8 = 3;
x += x;
assert!(x == 6);
```

### core::ops::arith::SubAssign (`-=`)

The subtraction assignment operator `-=`.

#### Signature

```rust
pub trait SubAssign
```

#### Trait Function: `sub_assign`

Performs the `-=` operation.

##### Signature

```rust
fn sub_assign(ref self: Lhs, rhs: Rhs)
```

##### Example

```rust
let mut x: u8 = 3;
x -= x;
assert!(x == 0);
```

### core::ops::arith::MulAssign (`*=`)

The multiplication assignment operator `*=`.

#### Signature

```rust
pub trait MulAssign
```

#### Trait Function: `mul_assign`

Performs the `*=` operation.

##### Signature

```rust
fn mul_assign(ref self: Lhs, rhs: Rhs)
```

##### Example

```rust
let mut x: u8 = 3;
x *= x;
assert!(x == 9);
```

### core::ops::arith::DivAssign (`/=`)

The division assignment operator `/=`.

#### Signature

```rust
pub trait DivAssign
```

#### Trait Function: `div_assign`

Performs the `/=` operation.

##### Signature

```rust
fn div_assign(ref self: Lhs, rhs: Rhs)
```

##### Example

```rust
let mut x: u8 = 3;
x /= x;
assert!(x == 1);
```

### core::ops::arith::RemAssign (`%=`)

The remainder assignment operator `%=`.

#### Signature

```rust
pub trait RemAssign
```

#### Trait Function: `rem_assign`

Performs the `%=` operation.

##### Signature

```rust
fn rem_assign(ref self: Lhs, rhs: Rhs)
```

##### Example

```rust
let mut x: u8 = 3;
x %= x;
assert!(x == 0);
```

---

Sources:

- https://docs.starknet.io/build/corelib/core-ops-deref-Deref
- https://docs.starknet.io/build/corelib/core-ops-deref-DerefMut
- https://docs.starknet.io/build/corelib/core-ops-function-Fn
- https://docs.starknet.io/build/corelib/core-ops-function-FnOnce

---

### Dereferencing and Callable Interfaces

#### core::ops::deref::Deref

A trait for dereferencing a value to provide transparent access to its contents, allowing a type to behave like its inner type.

**Limitation**: `Deref` cannot be used to implicitly convert a type to its target type when passing arguments to functions.

##### Signature

```rust
pub trait Deref
```

##### Trait Functions

###### `deref`

Returns the dereferenced value.

Signature:

```rust
fn deref(self: T) -> DerefTarget
```

##### Trait Types

###### `Target`

The type of the dereferenced value.

Signature:

```rust
type Target;
```

##### Examples

```rust
struct Wrapper { inner: T }

impl WrapperDeref of Deref> {
    type Target = T;
    fn deref(self: Wrapper) -> T { self.inner }
}

let wrapped = Wrapper { inner: 42 };
assert!(wrapped.deref() == 42);
```

#### core::ops::deref::DerefMut

A trait for dereferencing in mutable contexts. It only indicates that the container itself is mutable; it does NOT allow modifying the inner value.

##### Signature

```rust
pub trait DerefMut
```

##### Trait Functions

###### `deref_mut`

Returns the dereferenced value.

Signature:

```rust
fn deref_mut(ref self: T) -> DerefMutTarget
```

##### Trait Types

###### `Target`

The type of the dereferenced value.

Signature:

```rust
type Target;
```

##### Examples

```rust
#[derive(Copy, Drop)]
struct MutWrapper {
    value: T
}

impl MutWrapperDerefMut> of DerefMut> {
    type Target = T;
    fn deref_mut(ref self: MutWrapper) -> T {
        self.value
    }
}

// This will work since x is mutable
let mut x = MutWrapper { value: 42 };
let val = x.deref_mut();
assert!(val == 42);

// This would fail to compile since y is not mutable
let y = MutWrapper { value: 42 };
let val = y.deref_mut(); // Compile error
```

#### core::ops::function::Fn

The version of the call operator that takes a by-snapshot receiver. Instances of `Fn` can be called repeatedly.

`Fn` is implemented automatically by closures whose captured variables are all `Copy`. Any type `F` that implements `Fn` also has `@F` implement `Fn`. Since `FnOnce` is implemented for all `Fn` implementers, any `Fn` instance can be used where `FnOnce` is expected. Use `Fn` when you need to call a function-like type parameter repeatedly.

##### Signature

```rust
pub trait Fn
```

##### Trait Functions

###### `call`

Performs the call operation.

Signature:

```rust
fn call(self: @T, args: Args) -> FnOutput
```

##### Trait Types

###### `Output`

The returned type after the call operator is used.

Signature:

```rust
type Output;
```

##### Examples

Calling a closure:

```rust
let square = |x| x * x;
assert_eq!(square(5), 25);
```

Using a `Fn` parameter:

```rust
fn call_with_one, +core::ops::Fn[Output: usize]>(func: F) -> usize {
   func(1)
}

let double = |x| x * 2;
assert_eq!(call_with_one(double), 2);
```

#### core::ops::function::FnOnce

The version of the call operator that takes a by-value receiver. Instances of `FnOnce` can be called, but might not be callable multiple times, as they might consume captured variables.

##### Signature

```rust
pub trait FnOnce
```

##### Trait Functions

###### `call`

Performs the call operation.

Signature:

```rust
fn call(self: T, args: Args) -> FnOnceOutput
```

##### Trait Types

###### `Output`

The returned type after the call operator is used.

Signature:

```rust
type Output;
```

##### Examples

```rust
fn consume_with_relish, +core::ops::FnOnce[Output: O], +core::fmt::Display, +Drop,
>(
    func: F,
) {
    // `func` consumes its captured variables, so it cannot be run more
    // than once.
    println!("Consumed: {}", func());

    println!("Delicious!");
    // Attempting to invoke `func()` again will throw a `Variable was previously moved.`
    // error for `func`.
}

  let x: ByteArray = "x";
  let consume_and_return_x = || x;
  consume_with_relish(consume_and_return_x);
  // `consume_and_return_x` can no longer be invoked at this point
```

---

Sources:

- https://docs.starknet.io/build/corelib/core-ops-index-Index
- https://docs.starknet.io/build/corelib/core-ops-index-IndexView
- https://docs.starknet.io/build/corelib/core-traits-Index

---

### Indexing Interfaces

#### `core::ops::index::Index` Trait

This trait is implemented for indexing operations (`container[index]`) where the input type is mutated upon read access. This is useful for types depending on structures like `Felt252Dict`, where dictionary accesses modify the structure itself. The operation `container[index]` is syntactic sugar for `container.index(index)`.

##### Signature

```rust
pub trait Index
```

##### Trait Types

The returned type after indexing:

```rust
type Target;
```

##### Trait Functions

###### `index`

Performs the indexing (`container[index]`) operation. May panic if the index is out of bounds.

Signature:

```rust
fn index(ref self: C, index: I) -> IndexTarget
```

##### Example

This example implements `Index` on a `Stack` type backed by a `Felt252Dict`:

```rust
use core::ops::Index;

#[derive(Destruct, Default)]
struct Stack {
    items: Felt252Dict,
    len: usize
}

#[generate_trait]
impl StackImpl of StackTrait {
    fn push(ref self: Stack, item: u128) {
        self.items.insert(self.len.into(), item);
        self.len += 1;
    }
}

impl StackIndex of Index {
     type Target = u128;

     fn index(ref self: Stack, index: usize) -> Self::Target {
         if index >= self.len {
             panic!("Index out of bounds");
         }
         self.items.get(index.into())
     }
 }

let mut stack: Stack = Default::default();
stack.push(1);
assert!(stack[0] == 1);
```

#### `core::ops::index::IndexView` Trait

This trait is implemented for indexing operations (`container[index]`) where the input type is _not_ modified. The operation `container[index]` is syntactic sugar for `container.index(index)`.

##### Signature

```rust
pub trait IndexView
```

##### Trait Types

The returned type after indexing:

```rust
type Target;
```

##### Trait Functions

###### `index`

Performs the indexing (`container[index]`) operation. May panic if the index is out of bounds.

Signature:

```rust
fn index(self: @C, index: I) -> IndexViewTarget
```

##### Example

This example implements `IndexView` on a `NucleotideCount` container:

```rust
use core::ops::IndexView;

#[derive(Copy, Drop)]
enum Nucleotide {
     A,
     C,
     G,
     T,
 }

#[derive(Copy, Drop)]
struct NucleotideCount {
     a: usize,
     c: usize,
     g: usize,
     t: usize,
 }

impl NucleotideIndex of IndexView {
     type Target = usize;

     fn index(self: @NucleotideCount, index: Nucleotide) -> Self::Target {
         match index {
             Nucleotide::A => *self.a,
             Nucleotide::C => *self.c,
             Nucleotide::G => *self.g,
             Nucleotide::T => *self.t,
         }
     }
 }

let nucleotide_count = NucleotideCount {a: 14, c: 9, g: 10, t: 12};
assert!(nucleotide_count[Nucleotide::A] == 14);
assert!(nucleotide_count[Nucleotide::C] == 9);
assert!(nucleotide_count[Nucleotide::G] == 10);
assert!(nucleotide_count[Nucleotide::T] == 12);
```

---

Sources:

- https://docs.starknet.io/build/corelib/core-traits-Add
- https://docs.starknet.io/build/corelib/core-traits-BitAnd
- https://docs.starknet.io/build/corelib/core-traits-BitOr
- https://docs.starknet.io/build/corelib/core-traits-Div
- https://docs.starknet.io/build/corelib/core-traits-DivRem
- https://docs.starknet.io/build/corelib/core-traits-Mul
- https://docs.starknet.io/build/corelib/core-traits-Neg
- https://docs.starknet.io/build/corelib/core-traits-Not
- https://docs.starknet.io/build/corelib/core-traits-Rem
- https://docs.starknet.io/build/corelib/core-traits-RemEq
- https://docs.starknet.io/build/corelib/core-traits-Sub

---

### Standard Operator Overloading

#### core::traits::Add

The addition operator `+`.

##### Signature

```rust
pub trait Add
```

##### Examples

`Add`able types:

```rust
assert!(1_u8 + 2_u8 == 3_u8);
```

Implementing `Add` for a type:

```rust
#[derive(Copy, Drop, PartialEq)]
struct Point {
    x: u32,
    y: u32,
}

impl PointAdd of Add {
    fn add(lhs: Point, rhs: Point) -> Point {
        Point {
            x: lhs.x + rhs.x,
            y: lhs.y + rhs.y,
        }
    }
}

let p1 = Point { x: 1, y: 0 };
let p2 = Point { x: 2, y: 3 };
let p3 = p1 + p2;
assert!(p3 == Point { x: 3, y: 3 });
```

##### Trait functions

###### add

Performs the `+` operation.

###### Signature

```rust
fn add(lhs: T, rhs: T) -> T
```

###### Examples

```rust
assert!(12 + 1 == 13);
```

#### core::traits::BitAnd

The bitwise AND operator `&`.

##### Signature

```rust
pub trait BitAnd
```

##### Examples

An implementation of `BitAnd` for a wrapper around `bool`.

```rust
use core::traits::BitAnd;

#[derive(Drop, PartialEq)]
struct Scalar {
    inner: bool,
}

impl BitAndScalar of BitAnd {
    fn bitand(lhs: Scalar, rhs: Scalar) -> Scalar {
       Scalar { inner: lhs.inner & rhs.inner }
    }
}

assert!(Scalar { inner: true } & Scalar { inner: true } == Scalar { inner: true });
assert!(Scalar { inner: true } & Scalar { inner: false } == Scalar { inner: false });
assert!(Scalar { inner: false } & Scalar { inner: true } == Scalar { inner: false });
assert!(Scalar { inner: false } & Scalar { inner: false } == Scalar { inner: false });
```

##### Trait functions

###### bitand

Performs the `&` operation.

###### Signature

```rust
fn bitand(lhs: T, rhs: T) -> T
```

###### Examples

```rust
assert_eq!(true & false, false);
assert_eq!(5_u8 & 1_u8, 1);
assert_eq!(true & true, true);
assert_eq!(5_u8 & 2_u8, 0);
```

#### core::traits::BitOr

The bitwise OR operator `|`.

##### Signature

```rust
pub trait BitOr
```

##### Examples

An implementation of `BitOr` for a wrapper around `bool`.

```rust
use core::traits::BitOr;

#[derive(Drop, PartialEq)]
struct Scalar {
    inner: bool,
}

impl BitOrScalar of BitOr {
    fn bitor(lhs: Scalar, rhs: Scalar) -> Scalar {
        Scalar { inner: lhs.inner | rhs.inner }
    }
}

assert!(Scalar { inner: true } | Scalar { inner: true } == Scalar { inner: true });
assert!(Scalar { inner: true } | Scalar { inner: false } == Scalar { inner: true });
assert!(Scalar { inner: false } | Scalar { inner: true } == Scalar { inner: true });
assert!(Scalar { inner: false } | Scalar { inner: false } == Scalar { inner: false });
```

##### Trait functions

###### bitor

Performs the `|` operation.

###### Signature

```rust
fn bitor(lhs: T, rhs: T) -> T
```

###### Examples

```rust
assert!(1_u8 | 2_u8 == 3);
```

#### core::traits::Div

The division operator `/`. Types implementing this trait support the division operation via the `/` operator.

##### Signature

```rust
pub trait Div
```

##### Examples

`Div`isible types:

```rust
assert!(4_u8 / 2_u8 == 2_u8);
```

Implementing `Div` for a type:

```rust
#[derive(Copy, Drop, PartialEq)]
struct Point {
    x: u32,
    y: u32,
}

impl PointDiv of Div {
    fn div(lhs: Point, rhs: Point) -> Point {
        Point {
            x: lhs.x / rhs.x,
            y: lhs.y / rhs.y,
        }
    }
}

let p1 = Point { x: 2, y: 4 };
let p2 = Point { x: 2, y: 2 };
let p3 = p1 / p2;
assert!(p3 == Point { x: 1, y: 2 });
```

##### Trait functions

###### div

Performs the `/` operation.

###### Signature

```rust
fn div(lhs: T, rhs: T) -> T
```

###### Examples

```rust
assert!(12 / 2 == 6);
```

#### core::traits::DivRem

Performs truncated division and remainder. This trait provides a way to efficiently compute both the quotient and remainder in a single operation. The division truncates towards zero, matching the behavior of the `/` and `%` operators.

##### Signature

```rust
pub trait DivRem
```

##### Examples

```rust
assert!(DivRem::div_rem(7_u32, 3) == (2, 1));
```

##### Trait functions

###### div_rem

Performs the `/` and the `%` operations, returning both the quotient and remainder.

###### Signature

```rust
fn div_rem(lhs: T, rhs: NonZero) -> (T, T)
```

###### Examples

```rust
assert!(DivRem::div_rem(12_u32, 10) == (1, 2));
```

#### core::traits::Mul

The multiplication operator `*`.

##### Signature

```rust
pub trait Mul
```

##### Examples

Multipliable types:

```rust
assert!(3_u8 * 2_u8 == 6_u8);
```

Implementing `Mul` for a type:

```rust
#[derive(Copy, Drop, PartialEq)]
struct Point {
    x: u32,
    y: u32,
}

impl PointMul of Mul {
    fn mul(lhs: Point, rhs: Point) -> Point {
        Point {
            x: lhs.x * rhs.x,
            y: lhs.y * rhs.y,
        }
    }
}

let p1 = Point { x: 2, y: 3 };
let p2 = Point { x: 1, y: 0 };
let p3 = p1 * p2;
assert!(p3 == Point { x: 2, y: 0 });
```

##### Trait functions

###### mul

Performs the `*` operation.

###### Signature

```rust
fn mul(lhs: T, rhs: T) -> T
```

###### Examples

```rust
assert!(12 * 2 == 24);
```

#### core::traits::Neg

The unary negation operator `-`.

##### Signature

```rust
pub trait Neg
```

##### Examples

An implementation of `Neg` for `Sign`, which allows the use of `-` to negate its value.

```rust
#[derive(Copy, Drop, PartialEq)]
enum Sign {
    Negative,
    Zero,
    Positive,
}

impl SignNeg of Neg {
    fn neg(a: Sign) -> Sign {
        match a {
            Sign::Negative => Sign::Positive,
            Sign::Zero => Sign::Zero,
            Sign::Positive => Sign::Negative,
        }
    }
}

// A negative positive is a negative
assert!(-Sign::Positive == Sign::Negative);
// A double negative is a positive
assert!(-Sign::Negative == Sign::Positive);
// Zero is its own negation
assert!(-Sign::Zero == Sign::Zero);
```

##### Trait functions

###### neg

Performs the unary `-` operation.

###### Signature

```rust
fn neg(a: T) -> T
```

###### Examples

```rust
let x: i8 = 1;
assert!(-x == -1);
```

#### core::traits::Not

The unary logical negation operator `!`.

##### Signature

```rust
pub trait Not
```

##### Examples

An implementation of `Not` for `Answer`, which enables the use of `!` to invert its value.

```rust
#[derive(Drop, PartialEq)]
enum Answer {
    Yes,
    No,
}

impl AnswerNot of Not {
    fn not(a: Answer) -> Answer {
        match a {
            Answer::Yes => Answer::No,
            Answer::No => Answer::Yes,
        }
    }
}

assert!(!Answer::Yes == Answer::No);
assert!(!Answer::No == Answer::Yes);
```

##### Trait functions

###### not

Performs the unary `!` operation.

###### Signature

```rust
fn not(a: T) -> T
```

###### Examples

```rust
assert!(!true == false);
assert!(!false == true);
```

#### core::traits::Rem

The remainder operator `%`. Types implementing this trait support the remainder operation via the `%` operator.

##### Signature

```rust
pub trait Rem
```

##### Examples

```rust
assert!(3_u8 % 2_u8 == 1_u8);
```

##### Trait functions

###### rem

Performs the `%` operation.

###### Signature

```rust
fn rem(lhs: T, rhs: T) -> T
```

###### Examples

```rust
assert!(12_u8 % 10_u8 == 2_u8);
```

#### core::traits::RemEq

Remainder equality check.

##### Signature

```rust
pub trait RemEq
```

##### Trait functions

###### rem_eq

###### Signature

```rust
fn rem_eq(ref self: T, other: T)
```

This trait follows `core::traits::Rem` and precedes `core::traits::DivRem` in documentation order (though `DivRem` was listed earlier in chunks).

#### core::traits::Sub

The subtraction operator `-`.

##### Signature

```rust
pub trait Sub
```

##### Examples

`Sub`tractable types:

```rust
assert!(3_u8 - 2_u8 == 1_u8);
```

Implementing `Sub` for a type:

```rust
#[derive(Copy, Drop, PartialEq)]
struct Point {
    x: u32,
    y: u32,
}

impl PointSub of Sub {
    fn sub(lhs: Point, rhs: Point) -> Point {
        Point {
            x: lhs.x - rhs.x,
            y: lhs.y - rhs.y,
        }
    }
}

let p1 = Point { x: 2, y: 3 };
let p2 = Point { x: 1, y: 0 };
let p3 = p1 - p2;
assert!(p3 == Point { x: 1, y: 3 });
```

##### Trait functions

###### sub

Performs the `-` operation.

###### Signature

```rust
fn sub(lhs: T, rhs: T) -> T
```

###### Examples

```rust
assert!(12 - 1 == 11);
```

---

Sources:

- https://docs.starknet.io/build/corelib/core-traits-Default
- https://docs.starknet.io/build/corelib/core-traits-Destruct
- https://docs.starknet.io/build/corelib/core-traits-Drop
- https://docs.starknet.io/build/corelib/core-traits-Into
- https://docs.starknet.io/build/corelib/core-traits-PanicDestruct
- https://docs.starknet.io/build/corelib/core-traits-TryInto

---

## Type Lifecycle and Conversion Traits

### Trait: Default

A trait for giving a type a useful default value. Cairo implements `Default` for various primitive types. It can be used with `#[derive]` if all fields implement `Default`.

**Usage with `#[derive(Default)]` on an `enum`:**
You must specify the default unit variant using `#[default]`.

```rust
#[derive(Default)]
enum Kind {
    #[default]
    A,
    B,
    C,
}
```

The trait signature is:

```rust
pub trait Default
```

The implementation requires providing the `default()` method:

```rust
#[derive(Copy, Drop)]
enum Kind {
    A,
    B,
    C,
}

impl DefaultKind of Default {
    fn default() -> Kind { Kind::A }
}
```

The trait function `default()` returns the default value for a type.

```rust
fn default() -> T
```

### Destruction and Lifecycle Traits

Types must be explicitly handled in Cairo; they cannot be silently dropped.

#### Trait: Drop

A trait for types that can be safely dropped. Implementing `Drop` allows types to be automatically discarded when they go out of scope (the drop operation is a no-op).

```rust
#[derive(Drop)]
struct Point {
    x: u128,
    y: u128,
}

fn foo(p: Point) {} // OK: `p` is dropped at the end of the function
```

#### Trait: Destruct

Used for types that need cleanup when destroyed. Any type containing a `Felt252Dict` must implement `Destruct` so the dictionary can be "squashed" upon scope exit. It can generally be derived from the `Drop` and `Destruct` implementations of its fields.

Signature:

```rust
pub trait Destruct
```

The trait function `destruct` consumes the value:

```rust
fn destruct(self: T)
```

Example requiring `Destruct` due to `Felt252Dict`:

```rust
use core::dict::Felt252Dict;

// A struct containing a Felt252Dict must implement Destruct
#[derive(Destruct, Default)]
struct ResourceManager {
    resources: Felt252Dict,
    count: u32,
}
// ... Destruct is automatically called when manager goes out of scope.
```

#### Trait: PanicDestruct

Allows for the destruction of a value specifically in case of a panic. This trait is automatically implemented based on the type's `Destruct` implementation.

Signature:

```rust
pub trait PanicDestruct
```

Trait function:

```rust
fn panic_destruct(self: T, ref panic: Panic)
```

### Conversion Traits

#### Trait: Into

A value-to-value conversion that **consumes** the input value. This conversion must not fail; use `TryInto` if failure is possible.

Signature:

```rust
pub trait Into
```

The trait function `into(self: T) -> S` converts the input type T into the output type S.

Example implementation converting RGB components to a packed color value:

```rust
#[derive(Copy, Drop, PartialEq)]
struct Color {
    // Packed as 0x00RRGGBB
    value: u32,
}

impl RGBIntoColor of Into {
    fn into(self: (u8, u8, u8)) -> Color {
        let (r, g, b) = self;
        let value = (r.into() * 0x10000_u32) +
                   (g.into() * 0x100_u32) +
                   b.into();
        Color { value }
    }
}
```

#### Trait: TryInto (Implied from Trait Functions Chunk)

Attempts to convert the input type T into the output type S. If conversion fails, it returns `None`.

Trait function `try_into`:

```rust
fn try_into(self: T) -> Option
```

Example:

```rust
let a: Option = 1_u16.try_into();
assert!(a == Some(1));
let b: Option = 256_u16.try_into();
assert!(b == None);
```

---

Sources:

- https://docs.starknet.io/build/corelib/core-cmp-max
- https://docs.starknet.io/build/corelib/core-cmp-min
- https://docs.starknet.io/build/corelib/core-traits-PartialEq
- https://docs.starknet.io/build/corelib/core-traits-PartialOrd

---

### Ordering and Equality Traits

#### core::traits::PartialEq

Trait for comparisons using the equality operator. Implementing this trait for types provides the `==` and `!=` operators for those types. This trait can be used with `#[derive]`. When `derive`d on structs, two instances are equal if all fields are equal, and not equal if any fields are not equal. When `derive`d on enums, two instances are equal if they are the same variant and all fields are equal.

##### Signature

```rust
pub trait PartialEq
```

##### Examples

An example in which two points are equal if their x and y coordinates are equal.

```rust
#[derive(Copy, Drop)]
struct Point {
    x: u32,
    y: u32
}

impl PointEq of PartialEq {
    fn eq(lhs: @Point, rhs: @Point) -> bool {
        lhs.x == rhs.x && lhs.y == rhs.y
    }
}

let p1 = Point { x: 1, y: 2 };
let p2 = Point { x: 1, y: 2 };
assert!(p1 == p2);
assert!(!(p1 != p2));
```

##### Trait functions

###### eq

Returns whether `lhs` and `rhs` equal, and is used by `==`.

###### Signature

```rust
fn eq(lhs: @T, rhs: @T) -> bool
```

###### Examples

```rust
assert!(1 == 1);
```

###### ne

Returns whether `lhs` and `rhs` are not equal, and is used by `!=`.

###### Signature

```rust
fn ne(lhs: @T, rhs: @T) -> bool
```

###### Examples

```rust
assert!(0 != 1);
```

#### core::traits::PartialOrd

Trait for comparing types that form a partial order. The `lt`, `le`, `gt`, and `ge` methods of this trait can be called using the `<`, `<=`, `>`, and `>=` operators, respectively. PartialOrd is not derivable, but can be implemented manually.

##### Signature

```rust
pub trait PartialOrd
```

##### Implementing `PartialOrd`

Here’s how to implement `PartialOrd` for a custom type. This example implements comparison operations for a 2D point where points are compared based on their squared Euclidean distance from the origin (0,0):

```rust
#[derive(Copy, Drop, PartialEq)]
struct Point {
    x: u32,
    y: u32,
}

impl PointPartialOrd of PartialOrd {
    fn lt(lhs: Point, rhs: Point) -> bool {
        let lhs_dist = lhs.x * lhs.x + lhs.y * lhs.y;
        let rhs_dist = rhs.x * rhs.x + rhs.y * rhs.y;
        lhs_dist < rhs_dist
    }
}

let p1 = Point { x: 1, y: 1 }; // dist = 2
let p2 = Point { x: 2, y: 0 }; // dist = 4
assert!(p1 < p2);
assert!(p1 <= p2);
assert!(p2 > p1);
assert!(p2 >= p1);
```

Note that only the `lt` method needs to be implemented. The other comparison operations (`le`, `gt`, `ge`) are automatically derived from `lt`. However, you can override them for better performance if needed.

##### Trait functions

###### lt

Tests less than (for `self` and `other`) and is used by the `<` operator.

###### Signature

```rust
fn lt(lhs: T, rhs: T) -> bool
```

###### ge

Tests less than or equal to (for `self` and `other`) and is used by the `>=` operator.

###### Signature

```rust
fn ge(lhs: T, rhs: T) -> bool
```

###### gt

Tests greater than (for `self` and `other`) and is used by the `>` operator.

###### Signature

```rust
fn gt(lhs: T, rhs: T) -> bool
```

###### Examples

```rust
assert_eq!(1 > 1, false);
assert_eq!(1 > 2, false);
assert_eq!(2 > 1, true);
```

###### le

Tests greater than or equal to (for `self` and `other`) and is used by the `>=` operator.

###### Signature

```rust
fn le(lhs: T, rhs: T) -> bool
```

###### Examples

```rust
assert_eq!(1 >= 1, true);
assert_eq!(1 >= 2, false);
assert_eq!(2 >= 1, true);
```

---

Sources:

- https://docs.starknet.io/build/corelib/core-circuit-AddInputResult
- https://docs.starknet.io/build/corelib/core-circuit-AddInputResultTrait
- https://docs.starknet.io/build/corelib/core-circuit-AddMod
- https://docs.starknet.io/build/corelib/core-circuit-Circuit
- https://docs.starknet.io/build/corelib/core-circuit-CircuitDefinition
- https://docs.starknet.io/build/corelib/core-circuit-CircuitElement
- https://docs.starknet.io/build/corelib/core-circuit-CircuitElementCopy
- https://docs.starknet.io/build/corelib/core-circuit-CircuitElementDrop
- https://docs.starknet.io/build/corelib/core-circuit-CircuitElementTrait
- https://docs.starknet.io/build/corelib/core-circuit-CircuitInput
- https://docs.starknet.io/build/corelib/core-circuit-CircuitInputs
- https://docs.starknet.io/build/corelib/core-circuit-CircuitModulus
- https://docs.starknet.io/build/corelib/core-circuit-CircuitOutputsTrait
- https://docs.starknet.io/build/corelib/core-circuit-ConstOne
- https://docs.starknet.io/build/corelib/core-circuit-ConstZero
- https://docs.starknet.io/build/corelib/core-circuit-DestructFailureGuarantee
- https://docs.starknet.io/build/corelib/core-circuit-EvalCircuitTrait
- https://docs.starknet.io/build/corelib/core-circuit-MulMod
- https://docs.starknet.io/build/corelib/core-circuit-RangeCheck96
- https://docs.starknet.io/build/corelib/core-circuit-circuit_add
- https://docs.starknet.io/build/corelib/core-circuit-circuit_inverse
- https://docs.starknet.io/build/corelib/core-circuit-circuit_mul
- https://docs.starknet.io/build/corelib/core-circuit-circuit_sub
- https://docs.starknet.io/build/corelib/core-internal-bounded_int-bounded_int_constrain

---

---

Sources:

- https://docs.starknet.io/build/corelib/core-circuit-Circuit
- https://docs.starknet.io/build/corelib/core-circuit-CircuitDefinition
- https://docs.starknet.io/build/corelib/core-circuit-CircuitElement

---

## Circuit Definition and Core Types

This section summarizes the core types involved in defining circuits within the system.

### core::circuit::Circuit

A type that creates a circuit from a tuple of outputs. This represents a complete circuit instance, constructed from its output gates. The type parameter `Outputs` defines the structure of the circuit’s outputs.

#### Signature

```
pub extern type Circuit;
```

### core::circuit::CircuitDefinition

A trait for defining a circuit’s structure and behavior, used to define inputs, gates, and outputs. It provides the foundation for circuit evaluation. The `CES` type parameter represents a tuple of `CircuitElement`s that together define the circuit’s structure.

#### Signature

```
pub trait CircuitDefinition
```

#### Trait types

##### CircuitType

The internal circuit type representing a tuple of `CircuitElement`s.

###### Signature

```
type CircuitType;
```

### core::circuit::CircuitElement

A wrapper for circuit elements, used to construct circuits. This type provides a generic wrapper around different circuit components (inputs, gates) and enables composition of circuit elements through arithmetic operations. The type parameter `T` defines the specific role of the element in the circuit.

#### Signature

```
pub struct CircuitElement {}
```

---

Sources:

- https://docs.starknet.io/build/corelib/core-circuit-AddInputResult
- https://docs.starknet.io/build/corelib/core-circuit-AddInputResultTrait
- https://docs.starknet.io/build/corelib/core-circuit-CircuitInput
- https://docs.starknet.io/build/corelib/core-circuit-CircuitInputs
- https://docs.starknet.io/build/corelib/core-circuit-CircuitOutputsTrait

---

### Circuit Input Definition

The `CircuitInput` defines an input signal for a circuit, indexed by `N`. Each input requires a value assignment before circuit evaluation.

```rust
pub extern type CircuitInput;
```

### Initializing Circuit Inputs

The `CircuitInputs` trait provides the `new_inputs` function to initialize a new circuit instance, creating an input accumulator.

#### `new_inputs` Signature

```rust
fn new_inputs, +Drop>(\n    self: CES,\n) -> AddInputResult
```

### Managing Input Accumulation

The result of filling an input is tracked by `AddInputResult`, indicating if input filling is complete or if more inputs are required.

#### `AddInputResult` Variants

- **Done**: All inputs have been filled, and the circuit data is complete.
  ```rust
  Done: CircuitData
  ```
- **More**: More inputs are needed to complete the circuit instance’s data.
  ```rust
  More: CircuitInputAccumulator
  ```

The `AddInputResultTrait` provides methods to interact with this result:

#### Trait Functions

- **`next`**: Adds an input value to the circuit instance. It panics if all inputs have already been filled.
  ```rust
  fn next, +Drop>(\n    self: AddInputResult, value: Value,\n) -> AddInputResult
  ```
- **`done`**: Finalizes the input process, returning the complete circuit data. It panics if not all required inputs have been filled.
  ```rust
  fn done(self: AddInputResult) -> CircuitData
  ```

### Retrieving Circuit Outputs

The `CircuitOutputsTrait` enables accessing output values after successful circuit evaluation.

#### `get_output` Function

This function retrieves the output value corresponding to a specific circuit element.

- **Arguments**: `output` - The circuit element to get the output for.
- **Returns**: The output value as a `u384`.

```rust
fn get_output(\n    self: Outputs, output: OutputElement,\n) -> u384
```

#### Example Usage

The following example demonstrates the sequence of initializing inputs, adding values, finalizing, evaluating, and retrieving outputs:

```rust
let a = CircuitElement::> {};
let b = CircuitElement::> {};
let modulus = TryInto::::try_into([2, 0, 0, 0]).unwrap();
let circuit = (a,b).new_inputs()
    .next([10, 0, 0, 0])
    .next([11, 0, 0, 0])
    .done()
    .eval(modulus)
    .unwrap();
let a_mod_2 = circuit.get_output(a); // Returns the output value of `a mod 2`
let b_mod_2 = circuit.get_output(b); // Returns the output value of `b mod 2`
assert!(a_mod_2 == 0.into());
assert!(b_mod_2 == 1.into());
```

---

Sources:

- https://docs.starknet.io/build/corelib/core-circuit-CircuitModulus
- https://docs.starknet.io/build/corelib/core-circuit-ConstOne
- https://docs.starknet.io/build/corelib/core-circuit-ConstZero

---

### Field Types and Constants

#### CircuitModulus

This type represents the circuit modulus, defining the finite field over which the circuit operates. It must adhere to the following constraints:

- A 384-bit number (represented as four 96-bit limbs).
- Not zero or one.
- Typically a prime number for cryptographic applications.

Signature:

```rust
pub extern type CircuitModulus;
```

#### ConstOne

This type is defined as a constant one value.

Signature:

```rust
pub type ConstOne = BoundedInt;
```

#### ConstZero

This type exposes the constant zero required by the libfunc to allow compiler constant reusage.

Signature:

```rust
pub type ConstZero = BoundedInt;
```

---

Sources:

- https://docs.starknet.io/build/corelib/core-circuit-AddMod
- https://docs.starknet.io/build/corelib/core-circuit-EvalCircuitTrait
- https://docs.starknet.io/build/corelib/core-circuit-MulMod
- https://docs.starknet.io/build/corelib/core-circuit-circuit_inverse
- https://docs.starknet.io/build/corelib/core-internal-bounded_int-bounded_int_constrain

---

## Builtin Operations and Evaluation

### Modular Arithmetic Builtins

#### `core::circuit::AddMod`

Builtin for modular addition operations.

```rust
pub extern type AddMod;
```

#### `core::circuit::MulMod`

Builtin for modular multiplication operations.

```rust
pub extern type MulMod;
```

### Circuit Evaluation (`EvalCircuitTrait`)

This trait defines methods for evaluating the circuit.

#### `eval` Function

Evaluates the circuit with the given modulus.

##### Arguments

- `modulus` - The modulus to use for arithmetic operations

##### Returns

Result containing either the circuit outputs or a failure indication

##### Signature

```rust
fn eval(
    self: CircuitData, modulus: CircuitModulus,
) -> Result, (CircuitPartialOutputs, CircuitFailureGuarantee)>
```

#### `eval_ex` Function

Evaluates the circuit with an explicit descriptor and modulus.

##### Arguments

- `descriptor` - The circuit descriptor
- `modulus` - The modulus to use for arithmetic operations

##### Returns

Result containing either the circuit outputs or a failure indication

##### Signature

```rust
fn eval_ex(
    self: CircuitData, descriptor: CircuitDescriptor, modulus: CircuitModulus,
) -> Result, (CircuitPartialOutputs, CircuitFailureGuarantee)>
```

### Multiplicative Inverse

#### `core::circuit::circuit_inverse`

Creates a new circuit element representing the multiplicative inverse modulo p of an input circuit element. The operation fails during evaluation if the input is not invertible (not coprime with the modulus).

##### Signature

```rust
pub fn circuit_inverse>(
    input: CircuitElement,
) -> CircuitElement>
```

##### Example

```rust
let a = CircuitElement::> {};
let inv_a = circuit_inverse(a);
```

### Internal Constraint Function

#### `core::internal::bounded_int::bounded_int_constrain`

Applies range constraints to a value.

##### Signature

```rust
extern fn bounded_int_constrain(value: T) -> Result implicits(RangeCheck) nopanic;
```

---

Sources:

- https://docs.starknet.io/build/corelib/core-circuit-circuit_add
- https://docs.starknet.io/build/corelib/core-circuit-circuit_mul
- https://docs.starknet.io/build/corelib/core-circuit-circuit_sub

---

### Compositional Circuit Arithmetic

#### Circuit Addition (`circuit_add`)

Creates a circuit element representing addition modulo $p$ of two input circuits.

##### Signature

```rust
pub fn circuit_add<CircuitElementTrait>(
    lhs: CircuitElement, rhs: CircuitElement,
) -> CircuitElement
```

##### Arguments

- `lhs`: Left-hand side circuit element
- `rhs`: Right-hand side circuit element

##### Returns

A new circuit element representing `(lhs + rhs) mod p`.

##### Example

```rust
let a = CircuitElement::> {};
let b = CircuitElement::> {};
let sum = circuit_add(a, b);
```

#### Circuit Multiplication (`circuit_mul`)

Creates a circuit element representing multiplication modulo $p$ of two input circuits.

##### Signature

```rust
pub fn circuit_mul<CircuitElementTrait>(
    lhs: CircuitElement, rhs: CircuitElement,
) -> CircuitElement
```

##### Arguments

- `lhs`: Left-hand side circuit element
- `rhs`: Right-hand side circuit element

##### Returns

A new circuit element representing `(lhs * rhs) mod p`.

##### Example

```rust
let a = CircuitElement::> {};
let b = CircuitElement::> {};
let product = circuit_mul(a, b);
```

#### Circuit Subtraction (`circuit_sub`)

Creates a circuit element representing subtraction modulo $p$ of two input circuits.

##### Signature

```rust
pub fn circuit_sub<CircuitElementTrait>(
    lhs: CircuitElement, rhs: CircuitElement,
) -> CircuitElement
```

##### Arguments

- `lhs`: Left-hand side circuit element (minuend)
- `rhs`: Right-hand side circuit element (subtrahend)

##### Returns

A new circuit element representing `(lhs - rhs) mod p`.

##### Example

```rust
let a = CircuitElement::> {};
let b = CircuitElement::> {};
let diff = circuit_sub(a, b);
```

---

Sources:

- https://docs.starknet.io/build/corelib/core-circuit-CircuitElementCopy
- https://docs.starknet.io/build/corelib/core-circuit-CircuitElementDrop
- https://docs.starknet.io/build/corelib/core-circuit-CircuitElementTrait
- https://docs.starknet.io/build/corelib/core-circuit-DestructFailureGuarantee
- https://docs.starknet.io/build/corelib/core-circuit-RangeCheck96

---

### Low-Level Element Traits and Constraints

#### CircuitElementTrait

A marker trait for keeping track of which types are valid circuit elements. This trait is implemented for all valid circuit components including inputs and gates. It provides type safety when composing circuit elements.

##### Signature

```rust
pub trait CircuitElementTrait
```

#### CircuitElementCopy

##### Signature

```rust
pub impl CircuitElementCopy of Copy>
```

#### CircuitElementDrop

##### Signature

```rust
pub impl CircuitElementDrop of Drop>
```

#### DestructFailureGuarantee

##### Signature

```rust
pub impl DestructFailureGuarantee of Destruct
```

###### Impl functions: destruct

Signature:

```rust
fn destruct(self: CircuitFailureGuarantee)
```

#### RangeCheck96

Range check builtin for 96-bit operations.

##### Signature

```rust
pub extern type RangeCheck96;
```

---

Sources:

- https://docs.starknet.io/build/corelib/core-ec-EcPointImpl
- https://docs.starknet.io/build/corelib/core-ec-EcPointTrait
- https://docs.starknet.io/build/corelib/core-starknet-secp256_trait-Secp256Trait
- https://docs.starknet.io/build/corelib/core-ec-EcOp
- https://docs.starknet.io/build/corelib/core-ec-EcPoint
- https://docs.starknet.io/build/corelib/core-ec-EcState
- https://docs.starknet.io/build/corelib/core-ec-EcStateImpl
- https://docs.starknet.io/build/corelib/core-ec-EcStateTrait
- https://docs.starknet.io/build/corelib/core-ec-NonZeroEcPoint
- https://docs.starknet.io/build/corelib/core-ec-ec_point_unwrap
- https://docs.starknet.io/build/corelib/core-ec-stark_curve-ALPHA
- https://docs.starknet.io/build/corelib/core-ec-stark_curve-BETA
- https://docs.starknet.io/build/corelib/core-ec-stark_curve-GEN_X
- https://docs.starknet.io/build/corelib/core-ec-stark_curve-GEN_Y
- https://docs.starknet.io/build/corelib/core-ec-stark_curve-ORDER
- https://docs.starknet.io/build/corelib/core-ecdsa-check_ecdsa_signature
- https://docs.starknet.io/build/corelib/core-ecdsa-recover_public_key
- https://docs.starknet.io/build/corelib/core-starknet-eth_signature-is_eth_signature_valid
- https://docs.starknet.io/build/corelib/core-starknet-eth_signature-public_key_point_to_eth_address
- https://docs.starknet.io/build/corelib/core-starknet-eth_signature-verify_eth_signature
- https://docs.starknet.io/build/corelib/core-starknet-secp256_trait-Secp256PointTrait
- https://docs.starknet.io/build/corelib/core-starknet-secp256_trait-Signature
- https://docs.starknet.io/build/corelib/core-starknet-secp256k1-Secp256k1Point
- https://docs.starknet.io/build/corelib/core-starknet-secp256r1-Secp256r1Point

---

---

Sources:

- https://docs.starknet.io/build/corelib/core-ec-EcPointImpl
- https://docs.starknet.io/build/corelib/core-ec-EcPointTrait
- https://docs.starknet.io/build/corelib/core-ec-EcOp
- https://docs.starknet.io/build/corelib/core-ec-EcPoint
- https://docs.starknet.io/build/corelib/core-ec-EcState
- https://docs.starknet.io/build/corelib/core-ec-EcStateImpl
- https://docs.starknet.io/build/corelib/core-ec-EcStateTrait
- https://docs.starknet.io/build/corelib/core-ec-NonZeroEcPoint
- https://docs.starknet.io/build/corelib/core-ec-ec_point_unwrap

---

### STARK Curve Point Types and Operations

#### EC Data Types

The core types involved in Elliptic Curve operations on the STARK curve are:

##### `core::ec::EcPoint`

Represents a point on the STARK curve. The zero point represents the point at infinity.

```rust
pub extern type EcPoint;
```

##### `core::ec::EcOp`

An opaque type related to EC operations.

```rust
pub extern type EcOp;
```

##### `core::ec::EcState`

Used to perform multiple point operations efficiently. Operations are initialized with `EcStateTrait::init`, points are added/multiplied using `add` or `add_mul`, and the result is finalized with `EcStateTrait::finalize` or `EcStateTrait::finalize_nz`.

```rust
pub extern type EcState;
```

##### `core::ec::NonZeroEcPoint`

A non-zero point on the STARK curve, which cannot be the point at infinity.

```rust
pub type NonZeroEcPoint = NonZero;
```

#### EC Point Operations (`EcPointTrait`)

The `EcPointTrait` defines fundamental operations for individual points.

##### Point Construction

Points can be created using `new` or `new_from_x`.

- `new(x: felt252, y: felt252) -> Option`: Creates a new EC point from its (x, y) coordinates. Returns `None` if the point is not on the curve.
- `new_from_x(x: felt252) -> Option`: Creates a new EC point from its x coordinate. Returns `None` if no point exists for that x-coordinate. Panics if `x` is 0 (the point at infinity).
- `new_nz(x: felt252, y: felt252) -> Option<NonZeroEcPoint>`: Creates a new NonZero EC point.
- `new_nz_from_x(x: felt252) -> Option<NonZeroEcPoint>`: Creates a new NonZero EC point from its x coordinate.

##### Accessing Coordinates

Methods to retrieve coordinates, which panic if the point is the point at infinity (for NonZero types).

- `coordinates(self: NonZero) -> (felt252, felt252)`: Returns the (x, y) coordinates.
- `x(self: NonZero) -> felt252`: Returns the x coordinate.
- `y(self: NonZero) -> felt252`: Returns the y coordinate.

##### Scalar Multiplication

- `mul(self: EcPoint, scalar: felt252) -> EcPoint`: Computes the product of an EC point by the given scalar.

```rust
// Example of new:
let point = EcPointTrait::new(
    x: 336742005567258698661916498343089167447076063081786685068305785816009957563,
    y: 1706004133033694959518200210163451614294041810778629639790706933324248611779,
).unwrap();

// Example of new_from_x:
let valid = EcPointTrait::new_from_x(1);
assert!(valid.is_some());
let invalid = EcPointTrait::new_from_x(0);
assert!(invalid.is_none());
```

#### EC State Operations (`EcStateTrait`)

The `EcStateTrait` provides methods for batching operations.

##### State Initialization and Modification

- `init() -> EcState`: Initializes an EC computation with the zero point.
  ```rust
  let mut state = EcStateTrait::init();
  ```
- `add(ref self: EcState, p: NonZero)`: Adds a non-zero point to the computation.
- `sub(ref self: EcState, p: NonZero)`: Subtracts a non-zero point from the computation.
- `add_mul(ref self: EcState, scalar: felt252, p: NonZero)`: Adds the product `p * scalar` to the state.

##### Finalization

- `finalize_nz(self: EcState) -> Option<NonZeroEcPoint>`: Finalizes the computation and returns the result as a non-zero point. Returns `None` if the result is the zero point. Panics if the result is the point at infinity.
- `finalize(self: EcState) -> EcPoint`: Finalizes the computation and returns the result. Returns the zero point if the computation results in the point at infinity.

#### Utility Function

##### `ec_point_unwrap`

Unwraps a non-zero point into its (x, y) coordinates.

```rust
pub extern fn ec_point_unwrap(p: NonZero) -> (felt252, felt252) nopanic;
```

---

Sources:

- https://docs.starknet.io/build/corelib/core-ec-stark_curve-ALPHA
- https://docs.starknet.io/build/corelib/core-ec-stark_curve-BETA
- https://docs.starknet.io/build/corelib/core-ec-stark_curve-GEN_X
- https://docs.starknet.io/build/corelib/core-ec-stark_curve-GEN_Y
- https://docs.starknet.io/build/corelib/core-ec-stark_curve-ORDER

---

### STARK Curve Constants

The STARK Curve is defined by the Weierstrass equation:
$$y^2 \equiv x^3 + \alpha \cdot x + \beta \pmod{p}$$

#### Curve Parameters ($\alpha$ and $\beta$)

The constants $\alpha$ (ALPHA) and $\beta$ (BETA) for the STARK Curve are defined as follows:

##### ALPHA ($\alpha$)

```rust
pub const ALPHA: felt252 = 1;
```

##### BETA ($\beta$)

```rust
pub const BETA: felt252 = 3141592653589793238462643383279502884197169399375105820974944592307816406665;
```

#### Generator Point ($G$)

The generator point used for ECDSA signatures is $(GEN\_X, GEN\_Y)$.

##### Generator X Coordinate ($GEN\_X$)

```rust
pub const GEN_X: felt252 = 874739451078007766457464989774322083649278607533249481151382481072868806602;
```

##### Generator Y Coordinate ($GEN\_Y$)

```rust
pub const GEN_Y: felt252 = 152666792071518830868575557812948353041420400780739481342941381225525861407;
```

#### Curve Order

The order (number of points) of the STARK Curve is:

##### ORDER

```rust
pub const ORDER: felt252 = 3618502788666131213697322783095070105526743751716087489154079457884512865583;
```

---

Sources:

- https://docs.starknet.io/build/corelib/core-ecdsa-check_ecdsa_signature
- https://docs.starknet.io/build/corelib/core-ecdsa-recover_public_key
- https://docs.starknet.io/build/corelib/core-starknet-eth_signature-is_eth_signature_valid
- https://docs.starknet.io/build/corelib/core-starknet-eth_signature-verify_eth_signature
- https://docs.starknet.io/build/corelib/core-starknet-secp256_trait-Signature

---

## ECDSA and Signature Verification

### core::starknet::secp256_trait::Signature

Represents a Secp2561 ECDSA signature holding components `r`, `s`, and `y_parity`.

```rust
#[derive(Copy, Drop, Debug, PartialEq, Serde, Hash)]
pub struct Signature {
    pub r: u256,
    pub s: u256,
    pub y_parity: bool,
}
```

The `y_parity` boolean indicates the parity of the y coordinate of the elliptic curve point whose x coordinate is `r`. `true` means the y coordinate is odd.

### ECDSA Verification Functions

#### core::ecdsa::check_ecdsa_signature

Verifies an ECDSA signature against a message hash and public key. This implementation slightly deviates from the standard ECDSA, requiring corresponding modifications to the signature algorithm used.

This function validates that `s` and `r` are not 0 or equal to the curve order.

#### core::ecdsa::recover_public_key

Recovers the signer’s public key from an ECDSA signature, message hash, and the y-coordinate parity of point R.

**Signature**

```rust
pub fn recover_public_key(
    message_hash: felt252, signature_r: felt252, signature_s: felt252, y_parity: bool,
) -> Option
```

**Arguments**

- `message_hash`: The hash of the signed message.
- `signature_r`: The r component of the ECDSA signature (x-coordinate of point R).
- `signature_s`: The s component of the ECDSA signature.
- `y_parity`: The parity of the y-coordinate of point R (`true` for odd, `false` for even).

**Returns**

Returns `Some(public_key)` containing the x-coordinate of the recovered public key point if the signature is valid, `None` otherwise.

**Example**

```rust
use core::ecdsa::recover_public_key;

let message_hash = 0x503f4bea29baee10b22a7f10bdc82dda071c977c1f25b8f3973d34e6b03b2c;
let signature_r = 0xbe96d72eb4f94078192c2e84d5230cde2a70f4b45c8797e2c907acff5060bb;
let signature_s = 0x677ae6bba6daf00d2631fab14c8acf24be6579f9d9e98f67aa7f2770e57a1f5;
assert!(
    recover_public_key(:message_hash, :signature_r, :signature_s, y_parity: false)
        .unwrap() == 0x7b7454acbe7845da996377f85eb0892044d75ae95d04d3325a391951f35d2ec,
)
```

### Ethereum Signature Functions

These functions validate Ethereum signatures against a message hash and an expected Ethereum address. They enforce that `r` and `s` components are in the range `[1, N)`, where N is the size of the curve.

#### core::starknet::eth_signature::verify_eth_signature

Asserts that an Ethereum signature is valid.

**Signature**

```rust
pub fn verify_eth_signature(msg_hash: u256, signature: Signature, eth_address: EthAddress)
```

**Panics**

Panics if:

- The signature components are out of range (not in `[1, N)` where N is the curve order).
- The recovered address doesn’t match the provided address.

**Example**

```rust
use starknet::eth_address::EthAddress;
use starknet::eth_signature::verify_eth_signature;
use starknet::secp256_trait::Signature;

let msg_hash = 0xe888fbb4cf9ae6254f19ba12e6d9af54788f195a6f509ca3e934f78d7a71dd85;
let r = 0x4c8e4fbc1fbb1dece52185e532812c4f7a5f81cf3ee10044320a0d03b62d3e9a;
let s = 0x4ac5e5c0c0e8a4871583cc131f35fb49c2b7f60e6a8b84965830658f08f7410c;
let y_parity = true;
let eth_address: EthAddress = 0x767410c1bb448978bd42b984d7de5970bcaf5c43_u256
    .try_into()
    .unwrap();
verify_eth_signature(msg_hash, Signature { r, s, y_parity }, eth_address);
```

#### core::starknet::eth_signature::is_eth_signature_valid

Validates an Ethereum signature, returning a `Result` instead of panicking.

**Signature**

```rust
pub fn is_eth_signature_valid(
    msg_hash: u256, signature: Signature, eth_address: EthAddress,
) -> Result
```

**Returns**

Returns `Ok(())` if the signature is valid, or `Err(felt252)` containing an error message if invalid.

**Example**

```rust
use starknet::eth_address::EthAddress;
use starknet::eth_signature::is_eth_signature_valid;
use starknet::secp256_trait::Signature;

let msg_hash = 0xe888fbb4cf9ae6254f19ba12e6d9af54788f195a6f509ca3e934f78d7a71dd85;
let r = 0x4c8e4fbc1fbb1dece52185e532812c4f7a5f81cf3ee10044320a0d03b62d3e9a;
let s = 0x4ac5e5c0c0e8a4871583cc131f35fb49c2b7f60e6a8b84965830658f08f7410c;
let y_parity = true;
let eth_address: EthAddress = 0x767410c1bb448978bd42b984d7de5970bcaf5c43_u256
    .try_into()
    .unwrap();
assert!(is_eth_signature_valid(msg_hash, Signature { r, s, y_parity }, eth_address).is_ok());
```

---

Sources:

- https://docs.starknet.io/build/corelib/core-starknet-secp256_trait-Secp256Trait
- https://docs.starknet.io/build/corelib/core-starknet-eth_signature-public_key_point_to_eth_address
- https://docs.starknet.io/build/corelib/core-starknet-secp256_trait-Secp256PointTrait
- https://docs.starknet.io/build/corelib/core-starknet-secp256k1-Secp256k1Point
- https://docs.starknet.io/build/corelib/core-starknet-secp256r1-Secp256r1Point

---

# Secp256 Curve Types and Operations

## Secp256 Curve Point Types

The Starknet environment supports specific point types for Secp256 curves:

- `Secp256k1Point`: A point on the secp256k1 curve.
- `Secp256r1Point`: Represents a point on the secp256r1 elliptic curve.

## Secp256 Trait Operations (Curve Parameters and Creation)

The `Secp256Trait` provides fundamental interactions with Secp256 curves, including accessing parameters and creating points.

### Trait Functions

#### `get_curve_size()`

Returns the order (size) of the curve’s underlying field ($u256$).

```rust
fn get_curve_size() -> u256
```

#### `get_generator_point()`

Returns the generator point (G) for the curve.

```rust
fn get_generator_point() -> Secp256Point
```

#### `secp256_ec_new_syscall(x, y)`

Creates a new curve point from its x and y coordinates. Returns `None` if the coordinates do not form a valid point.

```rust
fn secp256_ec_new_syscall(
    x: u256, y: u256,
) -> Result, Array>
```

#### `secp256_ec_get_point_from_x_syscall(x, y_parity)`

Creates a curve point given its x-coordinate and y-parity.

- `x`: The x coordinate of the point.
- `y_parity`: If true, choose the odd y value; if false, choose the even y value.

```rust
fn secp256_ec_get_point_from_x_syscall(
    x: u256, y_parity: bool,
) -> Result, Array>
```

## Secp256Point Trait Operations (Point Arithmetic)

The `Secp256PointTrait` defines operations for manipulating Secp256 curve points, such as addition and multiplication.

### Trait Functions

#### `get_coordinates(self)`

Returns the x and y coordinates of the curve point.

```rust
fn get_coordinates(
    self: Secp256Point,
) -> Result>
```

#### `add(self, other)`

Performs elliptic curve point addition, adding `self` and `other`.

```rust
fn add(
    self: Secp256Point, other: Secp256Point,
) -> Result>
```

#### `mul(self, scalar)`

Performs scalar multiplication of a curve point, multiplying `self` by the given scalar value.

```rust
fn mul(
    self: Secp256Point, scalar: u256,
) -> Result>
```

## Utility Function: Public Key to Ethereum Address

The function `public_key_point_to_eth_address` converts a public key point into its corresponding Ethereum address.

### Conversion Method

The Ethereum address is calculated by taking the Keccak-256 hash of the public key coordinates and taking the last 20 big-endian bytes.

### Signature

```rust
pub fn public_key_point_to_eth_address,
    +Secp256Trait,
    +Secp256PointTrait,
>(
    public_key_point: Secp256Point,
) -> EthAddress
```

### Example Usage

```rust
use starknet::eth_signature::public_key_point_to_eth_address;
use starknet::secp256k1::Secp256k1Point;
use starknet::secp256_trait::Secp256Trait;

let public_key: Secp256k1Point = Secp256Trait::secp256_ec_get_point_from_x_syscall(
    0xa9a02d48081294b9bb0d8740d70d3607feb20876964d432846d9b9100b91eefd, false,
)
.unwrap()
.unwrap();
let eth_address = public_key_point_to_eth_address(public_key);
assert!(eth_address == 0x767410c1bb448978bd42b984d7de5970bcaf5c43.try_into().unwrap());
```

---

Sources:

- https://docs.starknet.io/build/corelib/core-blake-blake2s_compress
- https://docs.starknet.io/build/corelib/core-blake-blake2s_finalize
- https://docs.starknet.io/build/corelib/core-hash-Hash
- https://docs.starknet.io/build/corelib/core-hash-HashStateExTrait
- https://docs.starknet.io/build/corelib/core-hash-HashStateTrait
- https://docs.starknet.io/build/corelib/core-hash-LegacyHash
- https://docs.starknet.io/build/corelib/core-hash-into_felt252_based
- https://docs.starknet.io/build/corelib/core-keccak-cairo_keccak
- https://docs.starknet.io/build/corelib/core-keccak-compute_keccak_byte_array
- https://docs.starknet.io/build/corelib/core-keccak-keccak_u256s_be_inputs
- https://docs.starknet.io/build/corelib/core-keccak-keccak_u256s_le_inputs
- https://docs.starknet.io/build/corelib/core-pedersen-HashState
- https://docs.starknet.io/build/corelib/core-pedersen-Pedersen
- https://docs.starknet.io/build/corelib/core-pedersen-PedersenImpl
- https://docs.starknet.io/build/corelib/core-pedersen-PedersenTrait
- https://docs.starknet.io/build/corelib/core-poseidon-HashState
- https://docs.starknet.io/build/corelib/core-poseidon-Poseidon
- https://docs.starknet.io/build/corelib/core-poseidon-PoseidonImpl
- https://docs.starknet.io/build/corelib/core-poseidon-PoseidonTrait
- https://docs.starknet.io/build/corelib/core-poseidon-hades_permutation
- https://docs.starknet.io/build/corelib/core-poseidon-poseidon_hash_span
- https://docs.starknet.io/build/corelib/core-sha256-compute_sha256_byte_array
- https://docs.starknet.io/build/corelib/core-sha256-compute_sha256_u32_array
- https://docs.starknet.io/build/corelib/core-starknet-syscalls-keccak_syscall
- https://docs.starknet.io/build/corelib/core-starknet-syscalls-sha256_process_block_syscall

---

---

Sources:

- https://docs.starknet.io/build/corelib/core-blake-blake2s_compress
- https://docs.starknet.io/build/corelib/core-blake-blake2s_finalize

---

### Blake2s Hashing

#### `core::blake::blake2s_compress`

This function performs the Blake2s compression step. It takes the current state, the total number of bytes hashed (`byte_count`), and the message block (`msg`), returning a new state.

Signature:

```rust
pub extern fn blake2s_compress(state: Box, byte_count: u32, msg: Box) -> Box nopanic;
```

#### `core::blake::blake2s_finalize`

This function is used for the final block of the message hashing process. The input message block (`msg`) must strictly consist of exactly 16 `u32` elements, padded with zeros if necessary. Using any other padding scheme yields a different hash output.

Signature:

```rust
pub extern fn blake2s_finalize(state: Box, byte_count: u32, msg: Box) -> Box nopanic;
```

---

Sources:

- https://docs.starknet.io/build/corelib/core-keccak-cairo_keccak
- https://docs.starknet.io/build/corelib/core-keccak-compute_keccak_byte_array
- https://docs.starknet.io/build/corelib/core-keccak-keccak_u256s_be_inputs
- https://docs.starknet.io/build/corelib/core-keccak-keccak_u256s_le_inputs
- https://docs.starknet.io/build/corelib/core-starknet-syscalls-keccak_syscall

---

# Keccak Hashing

This section summarizes the available Keccak-256 hashing primitives.

### `core::keccak::cairo_keccak`

Computes the Keccak-256 hash of a byte sequence with custom padding. Input is provided as 64-bit words in little-endian format and a final partial word.

#### Signature

```rust
pub fn cairo_keccak(ref input: Array, last_input_word: u64, last_input_num_bytes: u32) -> u256
```

#### Arguments

- `input`: Array of complete 64-bit words in little-endian format.
- `last_input_word`: Final partial word (if any).
- `last_input_num_bytes`: Number of valid bytes in the final word (0-7).

#### Returns

The 32-byte Keccak-256 hash as a little-endian `u256`.

#### Panics

Panics if `last_input_num_bytes` is greater than 7.

#### Example

```rust
use core::keccak::cairo_keccak;

// Hash "Hello world!" by splitting into 64-bit words in little-endian
let mut input = array![0x6f77206f6c6c6548]; // a full 8-byte word
let hash = cairo_keccak(ref input, 0x21646c72, 4); // 4 bytes of the last word
assert!(hash == 0xabea1f2503529a21734e2077c8b584d7bee3f45550c2d2f12a198ea908e1d0ec);
```

### `core::keccak::compute_keccak_byte_array`

Computes the Keccak-256 hash of a `ByteArray`.

#### Signature

```rust
pub fn compute_keccak_byte_array(arr: ByteArray) -> u256
```

#### Arguments

- `arr`: The input bytes to hash.

#### Returns

The 32-byte Keccak-256 hash as a little-endian `u256`.

#### Example

```rust
use core::keccak::compute_keccak_byte_array;

let text: ByteArray = "Hello world!";
let hash = compute_keccak_byte_array(@text);
assert!(hash == 0xabea1f2503529a21734e2077c8b584d7bee3f45550c2d2f12a198ea908e1d0ec);
```

### `core::keccak::keccak_u256s_be_inputs`

Computes the Keccak-256 hash of multiple `u256` values in big-endian format.

#### Signature

```rust
pub fn keccak_u256s_be_inputs(mut input: Span) -> u256
```

#### Arguments

- `input`: A span of big-endian `u256` values to be hashed.

#### Returns

The 32-byte Keccak-256 hash as a little-endian `u256`.

#### Example

```rust
use core::keccak::keccak_u256s_be_inputs;

let input = array![0x1234_u256, 0x5678_u256].span();
let hash = assert!(keccak_u256s_be_inputs(input) ==
0xfa31cb2326ed629f79d2da5beb78e2bd8ac7a1b8b86cae09eeb6a89a908b12a);
```

### `core::keccak::keccak_u256s_le_inputs`

Computes the Keccak-256 hash of multiple `u256` values in little-endian format.

#### Signature

```rust
pub fn keccak_u256s_le_inputs(mut input: Span) -> u256
```

#### Arguments

- `input`: A span of little-endian `u256` values to be hashed.

#### Returns

The 32-byte Keccak-256 hash as a little-endian `u256`.

#### Example

```rust
use core::keccak::keccak_u256s_le_inputs;

let input: Span = array![0, 1, 2].span();
assert!(keccak_u256s_le_inputs(input) ==
0xf005473605efc7d8ff67d9f23fe2e4a4f23454c12b49b38822ed362e0a92a0a6);
```

### `core::starknet::syscalls::keccak_syscall`

Computes the keccak of the input via syscall.

#### Requirements

- The input must be a multiple of 1088 bits (== 17 u64 words).
- The input must be pre-padded following the Keccak padding rule (pad10\*1):
  1. Add a ‘1’ bit
  2. Add zero or more ‘0’ bits
  3. Add a final ‘1’ bit
     The total length after padding must be a multiple of 1088 bits.

#### Signature

```rust
pub extern fn keccak_syscall(input: Span) -> Result<u256, Felt252> implicits(GasBuiltin, System) nopanic;
```

#### Arguments

- `input`: Array of 64-bit words (little endian) to be hashed.

#### Returns

- The keccak hash as a little-endian u256.

---

Sources:

- https://docs.starknet.io/build/corelib/core-pedersen-HashState
- https://docs.starknet.io/build/corelib/core-pedersen-Pedersen
- https://docs.starknet.io/build/corelib/core-pedersen-PedersenImpl
- https://docs.starknet.io/build/corelib/core-pedersen-PedersenTrait

---

### Pedersen Hashing

#### Pedersen Hash Function

The `pedersen` function computes the Pedersen hash of two `felt252` values. It is a collision-resistant cryptographic hash function producing a single field element output.

```rust
extern fn pedersen(a: felt252, b: felt252) -> felt252;
```

Parameters:

- `a: felt252` - The first input value
- `b: felt252` - The second input value

Returns:

- `felt252` - The Pedersen hash of the two input values

Example:

```rust
use core::pedersen::pedersen;

let hash = pedersen(1, 2);
// Result: hash value as felt252
```

#### Hash State Structure

The `HashState` struct represents the current state of a Pedersen hash computation, maintained as a single `felt252` value, updated via `HashStateTrait::finalize`.

Signature:

```rust
#[derive(Copy, Drop, Debug)]
pub struct HashState {
    pub state: felt252,
}
```

Member:

- `state`: The current hash state (`felt252`).

#### Hash State Initialization

The `PedersenTrait` provides functionality for creating a new Pedersen hash state.

**Trait Signature:**

```rust
pub trait PedersenTrait
```

**`new` Function:**
Creates a new Pedersen hash state with the given base value.

Signature:

```rust
fn new(base: felt252) -> HashState
```

Example:

```rust
use core::pedersen::PedersenTrait;

let mut state = PedersenTrait::new(0);
assert!(state.state == 0);
```

The implementation is provided via `PedersenImpl`:

```rust
pub impl PedersenImpl of PedersenTrait;
```

---

Sources:

- https://docs.starknet.io/build/corelib/core-poseidon-HashState
- https://docs.starknet.io/build/corelib/core-poseidon-Poseidon
- https://docs.starknet.io/build/corelib/core-poseidon-PoseidonImpl
- https://docs.starknet.io/build/corelib/core-poseidon-PoseidonTrait
- https://docs.starknet.io/build/corelib/core-poseidon-hades_permutation
- https://docs.starknet.io/build/corelib/core-poseidon-poseidon_hash_span

---

## Poseidon Hashing

### HashState Structure

The state for the Poseidon hash is defined by the `HashState` struct.

#### Signature

```rust
#[derive(Copy, Drop, Debug)]
pub struct HashState {
    pub s0: felt252,
    pub s1: felt252,
    pub s2: felt252,
    pub odd: bool,
}
```

The members include:

- `s0`: `felt252`
- `s1`: `felt252`
- `s2`: `felt252`
- `odd`: `bool`

### Poseidon Type

Poseidon is defined as an external type.

```rust
pub extern type Poseidon;
```

### Poseidon Trait and Implementation

The `PoseidonTrait` defines the interface for creating a new Poseidon hash state.

#### PoseidonTrait Signature

```rust
pub trait PoseidonTrait
```

#### `new` Function

Creates an initial state with all fields set to 0.

##### Signature

```rust
fn new() -> HashState
```

##### Example

```rust
use core::poseidon::PoseidonTrait;

let mut state = PoseidonTrait::new();
```

The `PoseidonImpl` implements `PoseidonTrait`.

```rust
pub impl PoseidonImpl of PoseidonTrait;
```

### Hades Permutation Function

The core permutation step is defined by `hades_permutation`.

#### Signature

```rust
pub extern fn hades_permutation(s0: felt252, s1: felt252, s2: felt252) -> (felt252, felt252, felt252) implicits(Poseidon) nopanic;
```

### Poseidon Hash Span

This function computes the Poseidon hash on a given span input using the sponge construction. The capacity element is initialized to 0. Input size differentiation is achieved by padding: always pad with 1, and possibly with another 0 to complete to an even-sized input.

#### Signature

```rust
pub fn poseidon_hash_span(mut span: Span) -> felt252
```

#### Example

```rust
let span = [1, 2].span();
let hash = poseidon_hash_span(span);

assert!(hash == 0x0371cb6995ea5e7effcd2e174de264b5b407027a75a231a70c2c8d196107f0e7);
```

---

Sources:

- https://docs.starknet.io/build/corelib/core-sha256-compute_sha256_byte_array
- https://docs.starknet.io/build/corelib/core-sha256-compute_sha256_u32_array
- https://docs.starknet.io/build/corelib/core-starknet-syscalls-sha256_process_block_syscall

---

### `core::sha256::compute_sha256_byte_array`

Computes the SHA-256 hash of the input `ByteArray`.

#### Signature

```rust
pub fn compute_sha256_byte_array(arr: ByteArray) -> [u32; 8]
```

#### Examples

```rust
use core::sha256::compute_sha256_byte_array;
```

### `core::sha256::compute_sha256_u32_array`

Computes the SHA-256 hash of an array of 32-bit words.

#### Signature

```rust
pub fn compute_sha256_u32_array(
    mut input: Array, last_input_word: u32, last_input_num_bytes: u32,
) -> [u32; 8]
```

#### Arguments

- `input` - An array of `u32` values to hash
- `last_input_word` - The final word when input is not word-aligned
- `last_input_num_bytes` - Number of bytes in the last input word (must be less than 4)

#### Returns

The SHA-256 hash of the `input array` + `last_input_word` as big endian.

#### Examples

```rust
use core::sha256::compute_sha256_u32_array;

let hash = compute_sha256_u32_array(array![0x68656c6c], 0x6f, 1);
assert!(hash == [0x2cf24dba, 0x5fb0a30e, 0x26e83b2a, 0xc5b9e29e, 0x1b161e5c, 0x1fa7425e,
0x73043362, 0x938b9824]);
```

### `core::starknet::syscalls::sha256_process_block_syscall`

Computes the next SHA-256 state of the input with the given state via a system call.

#### Signature

```rust
pub extern fn sha256_process_block_syscall(state: Sha256StateHandle, input: Box) -> Result> implicits(GasBuiltin, System) nopanic;
```

#### Arguments

- `state` - The current SHA-256 state.
- `input` - The input provided to compute the next SHA-256 state.

#### Returns

The next SHA-256 state of the input with the given state. The system call does not add any padding, and the input must be a multiple of 512 bits (i.e., 16 u32 words).

---

Sources:

- https://docs.starknet.io/build/corelib/core-hash-Hash
- https://docs.starknet.io/build/corelib/core-hash-HashStateExTrait
- https://docs.starknet.io/build/corelib/core-hash-HashStateTrait
- https://docs.starknet.io/build/corelib/core-hash-LegacyHash
- https://docs.starknet.io/build/corelib/core-hash-into_felt252_based

---

#### Hash Trait

The `core::hash::Hash` trait is for values that can be included in a hash calculation. Implementation is often achieved using `#[derive(Hash)]`.

##### Signature

```rust
pub trait Hash>
```

##### Trait Functions

###### `update_state`

Updates the hash state with the given value and returns a new hash state.

###### Signature

```rust
fn update_state, T, S, +HashStateTrait>(state: S, value: T) -> S
```

###### Examples

```rust
use core::pedersen::PedersenTrait;
use core::hash::Hash;

let mut state = PedersenTrait::new(0);
let new_state = Hash::update_state(state, 1);
```

#### HashStateTrait

This trait is for hash state accumulators, providing methods to update the state and finalize the hash result.

##### Signature

```rust
pub trait HashStateTrait
```

##### Trait Functions

###### `update`

Updates the current hash state `self` with the given `felt252` value and returns a new hash state.

###### Signature

```rust
fn update(self: S, value: felt252) -> S
```

###### Examples

```rust
use core::pedersen::PedersenTrait;
use core::hash::HashStateTrait;

let mut state = PedersenTrait::new(0);
state = state.update(1);
```

###### `finalize`

Takes the current state `self` and returns the hash result.

###### Signature

```rust
fn finalize(self: S) -> felt252
```

###### Examples

```rust
use core::pedersen::PedersenTrait;
use core::hash::HashStateTrait;

let mut state = PedersenTrait::new(0);
let hash = state.finalize();
```

#### HashStateExTrait

This is an extension trait for hash state accumulators that adds the `update_with` method. This allows direct hashing of types implementing `Hash`, improving ergonomics over manual `felt252` conversion.

##### Signature

```rust
pub trait HashStateExTrait
```

##### Trait Functions

###### `update_with`

Updates the hash state with the given value and returns the updated state.

###### Signature

```rust
fn update_with(self: S, value: T) -> S
```

###### Examples

```rust
use core::pedersen::PedersenTrait;
use core::hash::HashStateExTrait;

#[derive(Copy, Drop, Hash)]
struct Point { x: u32, y: u32 }

let point = Point { x: 1, y: 2 };
let hash = PedersenTrait::new(0)
    .update_with(point)
    .update_with(42)
    .finalize();
```

#### LegacyHash Trait

This trait is for hashing values using a `felt252` as the hash state, maintained for backwards compatibility. Implementing `Hash` is preferred.

##### Signature

```rust
pub trait LegacyHash
```

##### Trait Functions

###### `hash`

Takes a `felt252` state and a value of type `T` and returns the hash result.

###### Signature

```rust
fn hash(state: felt252, value: T) -> felt252
```

###### Examples

```rust
use core::pedersen::PedersenTrait;
use core::hash::LegacyHash;

let hash = LegacyHash::hash(0, 1);
```

#### into_felt252_based Implementation

This describes an implementation for `Hash` for types convertible to `felt252` via the `Into` trait.

##### Example of Implementation Declaration

```rust
impl MyTypeHash, +Drop> =
    core::hash::into_felt252_based::HashImpl;
```

---

Sources:

- https://docs.starknet.io/build/corelib/core-starknet-info-v2-TxInfo
- https://docs.starknet.io/build/corelib/core-gas-BuiltinCosts
- https://docs.starknet.io/build/corelib/core-gas-GasBuiltin
- https://docs.starknet.io/build/corelib/core-gas-GasReserve
- https://docs.starknet.io/build/corelib/core-gas-gas_reserve_create
- https://docs.starknet.io/build/corelib/core-gas-gas_reserve_utilize
- https://docs.starknet.io/build/corelib/core-gas-get_builtin_costs
- https://docs.starknet.io/build/corelib/core-gas-redeposit_gas
- https://docs.starknet.io/build/corelib/core-gas-withdraw_gas
- https://docs.starknet.io/build/corelib/core-gas-withdraw_gas_all
- https://docs.starknet.io/build/corelib/core-internal-require_implicit
- https://docs.starknet.io/build/corelib/core-starknet-SyscallResultTrait
- https://docs.starknet.io/build/corelib/core-starknet-System
- https://docs.starknet.io/build/corelib/core-starknet-VALIDATED
- https://docs.starknet.io/build/corelib/core-starknet-account-AccountContract
- https://docs.starknet.io/build/corelib/core-starknet-account-AccountContractDispatcher
- https://docs.starknet.io/build/corelib/core-starknet-account-AccountContractDispatcherTrait
- https://docs.starknet.io/build/corelib/core-starknet-account-AccountContractLibraryDispatcher
- https://docs.starknet.io/build/corelib/core-starknet-account-AccountContractSafeDispatcher
- https://docs.starknet.io/build/corelib/core-starknet-account-AccountContractSafeDispatcherTrait
- https://docs.starknet.io/build/corelib/core-starknet-account-AccountContractSafeLibraryDispatcher
- https://docs.starknet.io/build/corelib/core-starknet-account-Call
- https://docs.starknet.io/build/corelib/core-starknet-class_hash-class_hash_const
- https://docs.starknet.io/build/corelib/core-starknet-contract_address-ContractAddress
- https://docs.starknet.io/build/corelib/core-starknet-event-Event
- https://docs.starknet.io/build/corelib/core-starknet-event-EventEmitter
- https://docs.starknet.io/build/corelib/core-starknet-info-BlockInfo
- https://docs.starknet.io/build/corelib/core-starknet-info-get_block_info
- https://docs.starknet.io/build/corelib/core-starknet-info-get_block_number
- https://docs.starknet.io/build/corelib/core-starknet-info-get_block_timestamp
- https://docs.starknet.io/build/corelib/core-starknet-info-get_caller_address
- https://docs.starknet.io/build/corelib/core-starknet-info-get_contract_address
- https://docs.starknet.io/build/corelib/core-starknet-info-get_execution_info
- https://docs.starknet.io/build/corelib/core-starknet-info-get_tx_info
- https://docs.starknet.io/build/corelib/core-starknet-info-v2-ExecutionInfo
- https://docs.starknet.io/build/corelib/core-starknet-info-v2-ResourceBounds
- https://docs.starknet.io/build/corelib/core-starknet-storage-StoragePointerReadAccess
- https://docs.starknet.io/build/corelib/core-starknet-storage_access-storage_address_from_base
- https://docs.starknet.io/build/corelib/core-starknet-storage_access-storage_base_address_const
- https://docs.starknet.io/build/corelib/core-starknet-syscalls-call_contract_syscall
- https://docs.starknet.io/build/corelib/core-starknet-syscalls-deploy_syscall
- https://docs.starknet.io/build/corelib/core-starknet-syscalls-emit_event_syscall
- https://docs.starknet.io/build/corelib/core-starknet-syscalls-get_block_hash_syscall
- https://docs.starknet.io/build/corelib/core-starknet-syscalls-get_class_hash_at_syscall
- https://docs.starknet.io/build/corelib/core-starknet-syscalls-get_execution_info_syscall
- https://docs.starknet.io/build/corelib/core-starknet-syscalls-get_execution_info_v2_syscall
- https://docs.starknet.io/build/corelib/core-starknet-syscalls-library_call_syscall
- https://docs.starknet.io/build/corelib/core-starknet-syscalls-meta_tx_v0_syscall
- https://docs.starknet.io/build/corelib/core-starknet-syscalls-replace_class_syscall
- https://docs.starknet.io/build/corelib/core-starknet-syscalls-send_message_to_l1_syscall
- https://docs.starknet.io/build/corelib/core-starknet-syscalls-storage_read_syscall
- https://docs.starknet.io/build/corelib/core-starknet-testing-set_block_hash
- https://docs.starknet.io/build/corelib/core-starknet-testing-set_chain_id

---

---

Sources:

- https://docs.starknet.io/build/corelib/core-gas-BuiltinCosts
- https://docs.starknet.io/build/corelib/core-gas-GasBuiltin
- https://docs.starknet.io/build/corelib/core-gas-GasReserve
- https://docs.starknet.io/build/corelib/core-gas-gas_reserve_create
- https://docs.starknet.io/build/corelib/core-gas-gas_reserve_utilize
- https://docs.starknet.io/build/corelib/core-gas-get_builtin_costs
- https://docs.starknet.io/build/corelib/core-gas-redeposit_gas
- https://docs.starknet.io/build/corelib/core-gas-withdraw_gas
- https://docs.starknet.io/build/corelib/core-gas-withdraw_gas_all
- https://docs.starknet.io/build/corelib/core-starknet-info-v2-ResourceBounds

---

### Gas Management and Builtin Costs

#### Gas Related Types

##### BuiltinCosts

Type representing the table of the costs of the different builtin usages.

```rust
pub extern type BuiltinCosts;
```

##### GasBuiltin

The gas builtin, used to handle gas in the Cairo code. Contains the amount of gas available for the current run.

```rust
pub extern type GasBuiltin;
```

##### GasReserve

Represents a gas reserve. Gas reserves can be created at any point using gas from the gas counter, and can be utilized later.

```rust
pub extern type GasReserve;
```

#### Gas Management Functions

##### `core::gas::get_builtin_costs`

Returns the `BuiltinCosts` table to be used in `withdraw_gas_all`.

```rust
pub extern fn get_builtin_costs() -> BuiltinCosts nopanic;
```

##### `core::gas::withdraw_gas`

Withdraws gas from the `GasBuiltin` to handle the success case flow. Returns `Some(())` if sufficient gas exists, otherwise returns `None`.

```rust
pub extern fn withdraw_gas() -> Option implicits(RangeCheck, GasBuiltin) nopanic;
```

Examples:

```rust
// The success branch is the following lines, the failure branch is the `panic` caused by the
// `unwrap` call.
withdraw_gas().unwrap();
```

```rust
// Direct handling of `withdraw_gas`.
match withdraw_gas() {
    Some(()) => success_case(),
    None => cheap_not_enough_gas_case(),
}
```

##### `core::gas::withdraw_gas_all`

Similar to `withdraw_gas`, but directly receives `BuiltinCosts` for optimization by avoiding repeated internal calls to fetch the table of constants. Use with caution.

```rust
pub extern fn withdraw_gas_all(costs: BuiltinCosts) -> Option implicits(RangeCheck, GasBuiltin) nopanic;
```

##### `core::gas::redeposit_gas`

Returns unused gas into the gas builtin. Useful when different branches take different gas amounts but withdrawal is the same for both.

```rust
pub extern fn redeposit_gas() implicits(GasBuiltin) nopanic;
```

##### Gas Reserve Operations

###### `core::gas::gas_reserve_create`

Creates a new gas reserve by withdrawing the specified amount from the gas counter. Returns `Some(GasReserve)` if sufficient gas is available, otherwise returns `None`.

```rust
pub extern fn gas_reserve_create(amount: u128) -> Option implicits(RangeCheck, GasBuiltin) nopanic;
```

###### `core::gas::gas_reserve_utilize`

Adds the gas stored in the reserve back to the gas counter. The reserve is consumed in the process.

```rust
pub extern fn gas_reserve_utilize(reserve: GasReserve) implicits(GasBuiltin) nopanic;
```

---

Sources:

- https://docs.starknet.io/build/corelib/core-starknet-account-AccountContract
- https://docs.starknet.io/build/corelib/core-starknet-account-AccountContractDispatcher
- https://docs.starknet.io/build/corelib/core-starknet-account-AccountContractDispatcherTrait
- https://docs.starknet.io/build/corelib/core-starknet-account-AccountContractLibraryDispatcher
- https://docs.starknet.io/build/corelib/core-starknet-account-AccountContractSafeDispatcher
- https://docs.starknet.io/build/corelib/core-starknet-account-AccountContractSafeDispatcherTrait
- https://docs.starknet.io/build/corelib/core-starknet-account-AccountContractSafeLibraryDispatcher
- https://docs.starknet.io/build/corelib/core-starknet-account-Call
- https://docs.starknet.io/build/corelib/core-starknet-info-v2-TxInfo

---

## Account Contract Interfaces

### AccountContract Trait

A trait for account contracts supporting class declarations. It mandates `__validate__` and `__execute__`. It assumes invoke transaction calldata is `Array`, following SNIP6 network standard.

#### Signature

```rust
pub trait AccountContract
```

#### Trait Functions

##### `__validate_declare__`

An entry point called to check if the account is willing to pay for class declaration. Returns `starknet::VALIDATED` if willing.

###### Signature

```rust
fn __validate_declare__(
    self: @TContractState, class_hash: felt252,
) -> felt252
```

##### `__validate__`

An entry point called to check if the account is willing to pay for executing calls. Returns `starknet::VALIDATED` if willing, leading to `__execute__` call.

###### Signature

```rust
fn __validate__(
    ref self: TContractState, calls: Array,
) -> felt252
```

##### `__execute__`

An entry point called to execute calls. Should block deprecated v0 invoke transactions as they bypass `__validate__`.

###### Signature

```rust
fn __execute__(
    ref self: TContractState, calls: Array,
) -> Array>
```

### AccountContractDispatcher and LibraryDispatcher

#### AccountContractDispatcher

A dispatcher structure identified by contract address.

##### Signature

```rust
#[derive(Copy, Drop, Serde)]
pub struct AccountContractDispatcher {
    pub contract_address: ContractAddress,
}
```

##### Members

```rust
pub contract_address: ContractAddress
```

#### AccountContractLibraryDispatcher

A dispatcher structure identified by class hash.

##### Signature

```rust
#[derive(Copy, Drop, Serde)]
pub struct AccountContractLibraryDispatcher {
    pub class_hash: ClassHash,
}
```

##### Members

```rust
pub class_hash: ClassHash
```

### AccountContractDispatcherTrait

Defines the interface for dispatching account contract calls.

#### Signature

```rust
pub trait AccountContractDispatcherTrait
```

#### Trait Functions

##### `__validate_declare__`

```rust
fn __validate_declare__(self: T, class_hash: felt252) -> felt252
```

##### `__validate__`

```rust
fn __validate__(self: T, calls: Array) -> felt252
```

##### `__execute__`

```rust
fn __execute__(self: T, calls: Array) -> Array>
```

### AccountContractSafeDispatcher and SafeLibraryDispatcher

#### AccountContractSafeDispatcher

A safe dispatcher structure identified by contract address.

##### Signature

```rust
#[derive(Copy, Drop, Serde)]
pub struct AccountContractSafeDispatcher {
    pub contract_address: ContractAddress,
}
```

##### Members

```rust
pub contract_address: ContractAddress
```

#### AccountContractSafeLibraryDispatcher

A safe dispatcher structure identified by class hash.

##### Signature

```rust
#[derive(Copy, Drop, Serde)]
pub struct AccountContractSafeLibraryDispatcher {
    pub class_hash: ClassHash,
}
```

##### Members

```rust
pub class_hash: ClassHash
```

### AccountContractSafeDispatcherTrait

Defines the safe interface for dispatching account contract calls, returning `Result`.

#### Signature

```rust
pub trait AccountContractSafeDispatcherTrait
```

#### Trait Functions

##### `__validate_declare__`

```rust
fn __validate_declare__(self: T, class_hash: felt252) -> Result>
```

##### `__validate__`

```rust
fn __validate__(self: T, calls: Array) -> Result>
```

##### `__execute__`

```rust
fn __execute__(self: T, calls: Array) -> Result>, Array>
```

### Call Struct

A struct representing a call to a contract.

#### Signature

```rust
#[derive(Drop, Copy, Serde, Debug)]
pub struct Call {
    pub to: ContractAddress,
    pub selector: felt252,
    pub calldata: Span,
}
```

#### Members

##### `to`

The address of the contract to call.

###### Signature

```rust
pub to: ContractAddress
```

##### `selector`

The entry point selector in the called contract.

###### Signature

```rust
pub selector: felt252
```

##### `calldata`

The calldata to pass to entry point.

###### Signature

```rust
pub calldata: Span
```

##### V3 Transaction Fields

These fields are used for V3 transactions:

###### `paymaster_data`

If specified, the paymaster should pay for execution. Data includes paymaster address followed by extra data.

###### Signature

```rust
pub paymaster_data: Span
```

###### `nonce_data_availability_mode`

The data availability mode for the nonce.

###### Signature

```rust
pub nonce_data_availability_mode: u32
```

###### `fee_data_availability_mode`

The data availability mode for the account balance from which fee will be taken.

###### Signature

```rust
pub fee_data_availability_mode: u32
```

###### `account_deployment_data`

If nonempty, contains data for deploying and initializing an account contract (class hash, salt, constructor calldata).

###### Signature

```rust
pub account_deployment_data: Span
```

---

Sources:

- https://docs.starknet.io/build/corelib/core-starknet-VALIDATED
- https://docs.starknet.io/build/corelib/core-starknet-class_hash-class_hash_const
- https://docs.starknet.io/build/corelib/core-starknet-contract_address-ContractAddress

---

# Core Data Types and Constants

### core::starknet::VALIDATED

This constant represents the expected return value of the `__validate__` function in account contracts, signaling successful transaction validation.

#### Signature

```rust
pub const VALIDATED: felt252 = 370462705988;
```

### core::starknet::class_hash::class_hash_const

This function returns a `ClassHash` given a `felt252` value.

#### Signature

```rust
pub extern fn class_hash_const() -> ClassHash nopanic;
```

#### Examples

```rust
use starknet::class_hash::class_hash_const;

let class_hash = class_hash_const::();
```

### core::starknet::contract_address::ContractAddress

This type represents a Starknet contract address. The value range for this type is restricted to `[0, 2**251)`.

#### Signature

```rust
pub extern type ContractAddress;
```

---

Sources:

- https://docs.starknet.io/build/corelib/core-starknet-event-Event
- https://docs.starknet.io/build/corelib/core-starknet-event-EventEmitter
- https://docs.starknet.io/build/corelib/core-starknet-syscalls-emit_event_syscall

---

### Event Serialization: `core::starknet::event::Event`

This trait handles the serialization and deserialization of Starknet events. Events are stored in transaction receipts as a combination of keys and data fields.

The trait can be derived using `#[derive(starknet::Event)]`. Fields marked with `#[key]` serialize as event keys.

#### Signature

```rust
pub trait Event
```

#### Examples

```rust
#[derive(Drop, starknet::Event)]
pub struct Transfer {
    #[key]
    pub from: ContractAddress,
    #[key]
    pub to: ContractAddress,
    pub amount: u256,
}
```

#### Trait Functions

##### `append_keys_and_data`

Serializes the keys and data for event emission. The keys array contains the event name selector first, followed by fields marked with `#key`. The data array contains all non-key fields.

###### Signature

```rust
fn append_keys_and_data(self: @T, ref keys: Array, ref data: Array)
```

##### `deserialize`

Deserializes event keys and data back into the original event structure. Returns `None` if deserialization fails.

###### Signature

```rust
fn deserialize(ref keys: Span, ref data: Span) -> Option
```

### Event Emission: `core::starknet::event::EventEmitter`

This trait provides functionality for emitting Starknet events.

#### Signature

```rust
pub trait EventEmitter
```

#### Trait Functions

##### `emit`

Emits an event.

###### Signature

```rust
fn emit>(ref self: T, event: S)
```

#### Examples

```rust
#[derive(Drop, starknet::Event)]
pub struct NewOwner {
    pub new_owner: ContractAddress,
}

fn emit_event(ref self: ContractState, new_owner: ContractAddress) {
    self.emit(NewOwner { new_owner });
}
```

### System Call for Event Emission: `core::starknet::syscalls::emit_event_syscall`

This extern function directly emits an event via a Starknet system call.

#### Signature

```rust
pub extern fn emit_event_syscall(keys: Span, data: Span) -> Result> implicits(GasBuiltin, System) nopanic;
```

#### Arguments

- `keys`: The keys of the event.
- `data`: The data of the event.

---

Sources:

- https://docs.starknet.io/build/corelib/core-internal-require_implicit
- https://docs.starknet.io/build/corelib/core-starknet-info-BlockInfo
- https://docs.starknet.io/build/corelib/core-starknet-info-get_block_info
- https://docs.starknet.io/build/corelib/core-starknet-info-get_block_number
- https://docs.starknet.io/build/corelib/core-starknet-info-get_block_timestamp
- https://docs.starknet.io/build/corelib/core-starknet-info-get_caller_address
- https://docs.starknet.io/build/corelib/core-starknet-info-get_contract_address
- https://docs.starknet.io/build/corelib/core-starknet-info-get_execution_info
- https://docs.starknet.io/build/corelib/core-starknet-info-get_tx_info
- https://docs.starknet.io/build/corelib/core-starknet-info-v2-ExecutionInfo
- https://docs.starknet.io/build/corelib/core-starknet-info-v2-TxInfo
- https://docs.starknet.io/build/corelib/core-starknet-syscalls-get_block_hash_syscall
- https://docs.starknet.io/build/corelib/core-starknet-syscalls-get_execution_info_syscall

---

# Execution Context Information Retrieval

### Block Information Structures and Functions

#### `core::starknet::info::BlockInfo`

Provides information about the current block.

##### Signature

```rust
#[derive(Copy, Drop, Debug, Serde)]
pub struct BlockInfo {
    pub block_number: u64,
    pub block_timestamp: u64,
    pub sequencer_address: ContractAddress,
}
```

##### Members

- `block_number`: The height of this block.
- `block_timestamp`: Time of block creation in seconds since Unix epoch.
- `sequencer_address`: The Starknet address of the block sequencer.

#### `core::starknet::info::get_block_info`

Returns the block information for the current block.

##### Signature

```rust
pub fn get_block_info() -> Box
```

##### Example

```rust
use starknet::get_block_info;

let block_info = get_block_info().unbox();

let block_number = block_info.block_number;
let block_timestamp = block_info.block_timestamp;
let sequencer = block_info.sequencer_address;
```

#### `core::starknet::info::get_block_number`

Returns the number of the current block.

##### Signature

```rust
pub fn get_block_number() -> u64
```

##### Example

```rust
use starknet::get_block_number;

let block_number = get_block_number();
```

#### `core::starknet::info::get_block_timestamp`

Returns the timestamp of the current block.

##### Signature

```rust
pub fn get_block_timestamp() -> u64
```

##### Example

```rust
use starknet::get_block_timestamp;

let block_timestamp = get_block_timestamp();
```

### Contract and Caller Address Retrieval

#### `core::starknet::info::get_caller_address`

Returns the address of the caller contract. Returns `0` if there is no caller (e.g., transaction starts in an account contract). This returns the direct caller.

##### Signature

```rust
pub fn get_caller_address() -> ContractAddress
```

##### Example

```rust
use starknet::get_caller_address;

let caller = get_caller_address();
```

#### `core::starknet::info::get_contract_address`

Returns the address of the contract being executed.

##### Signature

```rust
pub fn get_contract_address() -> ContractAddress
```

##### Example

```rust
use starknet::get_contract_address;

let contract_address = get_contract_address();
```

### General Execution and Transaction Information

#### `core::starknet::info::v2::ExecutionInfo`

Contains execution details, using `v2::TxInfo`.

##### Signature

```rust
#[derive(Copy, Drop, Debug)]
pub struct ExecutionInfo {
    pub block_info: Box,
    pub tx_info: Box,
    pub caller_address: ContractAddress,
    pub contract_address: ContractAddress,
    pub entry_point_selector: felt252,
}
```

#### `core::starknet::info::v2::TxInfo`

Extended information about the current transaction (V2).

##### Signature

```rust
#[derive(Copy, Drop, Debug, Serde)]
pub struct TxInfo {
    pub version: felt252,
    pub account_contract_address: ContractAddress,
    pub max_fee: u128,
    pub signature: Span,
    pub transaction_hash: felt252,
    pub chain_id: felt252,
    pub nonce: felt252,
    pub resource_bounds: Span,
    pub tip: u128,
    pub paymaster_data: Span,
    pub nonce_data_availability_mode: u32,
    pub fee_data_availability_mode: u32,
    pub account_deployment_data: Span,
}
```

#### `core::starknet::info::get_execution_info`

Returns the execution info for the current execution.

##### Signature

```rust
pub fn get_execution_info() -> Box
```

##### Example

```rust
use starknet::get_execution_info;

let execution_info = get_execution_info().unbox();

// Access various execution context information
let caller = execution_info.caller_address;
let contract = execution_info.contract_address;
let selector = execution_info.entry_point_selector;
```

#### `core::starknet::info::get_tx_info`

Returns the transaction information for the current transaction.

##### Signature

```rust
pub fn get_tx_info() -> Box
```

##### Example

```rust
use starknet::get_tx_info;

let tx_info = get_tx_info().unbox();

let account_contract_address = tx_info.account_contract_address;
let chain_id = tx_info.chain_id;
let nonce = tx_info.nonce;
let max_fee = tx_info.max_fee;
let tx_hash = tx_info.transaction_hash;
let signature = tx_info.signature;
let version = tx_info.version;
```

### System Calls for Context Retrieval

#### `core::starknet::syscalls::get_block_hash_syscall`

Returns the hash of the block with the given number.

##### Signature

```rust
pub extern fn get_block_hash_syscall(block_number: u64) -> Result> implicits(GasBuiltin, System) nopanic;
```

- Argument: `block_number` - The number of the queried block.
- Returns: The hash of the block with the given number.

#### `core::starknet::syscalls::get_execution_info_syscall`

Gets information about the currently executing block and transactions. If called during `__validate__`, `__validate_deploy__`, or `__validate_declare__`, `block_timestamp` is rounded down to the nearest hour, and `block_number` is rounded down to the nearest multiple of 100.

##### Signature

```rust
pub extern fn get_execution_info_syscall() -> Result, Array> implicits(GasBuiltin, System) nopanic;
```

### Internal Context Enforcement

#### `core::internal::require_implicit`

Function to enforce that `Implicit` is used by a function calling it. This extern function is removed during compilation.

##### Signature

```rust
pub extern fn require_implicit() implicits(Implicit) nopanic;
```

---

Sources:

- https://docs.starknet.io/build/corelib/core-starknet-storage-StoragePointerReadAccess
- https://docs.starknet.io/build/corelib/core-starknet-storage_access-storage_address_from_base
- https://docs.starknet.io/build/corelib/core-starknet-storage_access-storage_base_address_const
- https://docs.starknet.io/build/corelib/core-starknet-syscalls-storage_read_syscall

---

### Storage Access Mechanisms

#### Storage Read Syscall

The `storage_read_syscall` function retrieves the value of a key from the calling contract's storage.

##### Signature

```rust
pub extern fn storage_read_syscall(address_domain: u32, address: StorageAddress) -> Result<felt252, StorageReadError> implicits(GasBuiltin, System) nopanic;
```

##### Arguments

- `address_domain`: The domain of the address. Only domain 0 is currently supported.
- `address`: The address of the storage key to read.

#### Storage Address Utilities

##### `storage_base_address_const`

Returns a `StorageBaseAddress` given a constant `felt252` value. The value is validated at compile time to be in the range `[0, 2**251 - 256)`.

###### Signature

```rust
pub extern fn storage_base_address_const() -> StorageBaseAddress nopanic;
```

##### `storage_address_from_base`

Converts a `StorageBaseAddress` into a `StorageAddress`. This should be used via the high-level `Into` trait.

###### Signature

```rust
pub extern fn storage_address_from_base(base: StorageBaseAddress) -> StorageAddress nopanic;
```

#### Storage Pointer Read Access

The `StoragePointerReadAccess` trait allows accessing storage values using a `StoragePointer`.

##### Trait Signature

```rust
pub trait StoragePointerReadAccess
```

##### Trait Functions

###### `read`

Reads the value pointed to by the pointer.

###### Signature

```rust
fn read(self: @T) -> StoragePointerReadAccessValue
```

##### Trait Types

###### `Value`

The type of the value returned upon reading.

###### Signature

```rust
type Value;
```

---

Sources:

- https://docs.starknet.io/build/corelib/core-starknet-SyscallResultTrait
- https://docs.starknet.io/build/corelib/core-starknet-System
- https://docs.starknet.io/build/corelib/core-starknet-syscalls-call_contract_syscall
- https://docs.starknet.io/build/corelib/core-starknet-syscalls-deploy_syscall
- https://docs.starknet.io/build/corelib/core-starknet-syscalls-get_class_hash_at_syscall
- https://docs.starknet.io/build/corelib/core-starknet-syscalls-get_execution_info_v2_syscall
- https://docs.starknet.io/build/corelib/core-starknet-syscalls-library_call_syscall
- https://docs.starknet.io/build/corelib/core-starknet-syscalls-meta_tx_v0_syscall
- https://docs.starknet.io/build/corelib/core-starknet-syscalls-replace_class_syscall
- https://docs.starknet.io/build/corelib/core-starknet-syscalls-send_message_to_l1_syscall

---

## Low-Level System Calls

This section summarizes the low-level system calls available in the Starknet environment, along with the trait used for handling their results.

### Syscall Result Handling

The `core::starknet::SyscallResultTrait` is implemented for handling syscall results.

#### `SyscallResultTrait::unwrap_syscall`

Unwraps a syscall result, returning the content of an `Ok`. It panics with the syscall error message if the result is an `Err`.

**Signature:**

```rust
fn unwrap_syscall(self: SyscallResult) -> T
```

**Example:**

```rust
let result = starknet::syscalls::get_execution_info_v2_syscall();
let info = result.unwrap_syscall();
```

### Contract Interaction Syscalls

These calls facilitate interaction with other contracts or deployment.

#### `call_contract_syscall`

Calls a given contract.

**Signature:**

```rust
pub extern fn call_contract_syscall(address: ContractAddress, entry_point_selector: felt252, calldata: Span) -> Result, Array> implicits(GasBuiltin, System) nopanic;
```

**Arguments:**

- `address`: The address of the called contract.
- `entry_point_selector`: A selector for a function within that contract.
- `calldata`: Call arguments.

#### `deploy_syscall`

Deploys a new instance of a previously declared class.

**Signature:**

```rust
pub extern fn deploy_syscall(class_hash: ClassHash, contract_address_salt: felt252, calldata: Span, deploy_from_zero: bool) -> Result), Array> implicits(GasBuiltin, System) nopanic;
```

**Arguments:**

- `class_hash`: The class hash of the contract to be deployed.
- `contract_address_salt`: The salt used in address computation.
- `calldata`: Call arguments for the constructor.
- `deploy_from_zero`: Deploy the contract from the zero address.

**Returns:**

- The address of the deployed contract.
- The serialized return value of the constructor.

#### `library_call_syscall`

Calls the requested function in any previously declared class.

**Signature:**

```rust
pub extern fn library_call_syscall(class_hash: ClassHash, function_selector: felt252, calldata: Span) -> Result, Array> implicits(GasBuiltin, System) nopanic;
```

**Arguments:**

- `class_hash`: The hash of the class to be used.
- `function_selector`: A selector for a function within that class.
- `calldata`: Call arguments.

### State and Information Retrieval Syscalls

#### `get_class_hash_at_syscall`

Gets the class hash of the contract at the given address.

**Signature:**

```rust
pub extern fn get_class_hash_at_syscall(contract_address: ContractAddress) -> Result> implicits(GasBuiltin, System) nopanic;
```

**Arguments:**

- `contract_address`: The address of the deployed contract.

**Returns:**

- The class hash of the contract’s originating code.

#### `get_execution_info_v2_syscall`

Gets information about the current execution, version 2. This should not be called directly; use `starknet::info::get_execution_info` instead.

**Signature:**

```rust
pub extern fn get_execution_info_v2_syscall() -> Result, Array> implicits(GasBuiltin, System) nopanic;
```

**Returns:**

- A box containing the current V2 execution information.

### Transaction Modification and L1 Communication

#### `meta_tx_v0_syscall`

Invokes the given entry point as a v0 meta transaction. This modifies the signature, caller (to OS address 0), and transaction version (to 0). It is intended only for supporting old version-0 bound accounts.

**Signature:**

```rust
pub extern fn meta_tx_v0_syscall(address: ContractAddress, entry_point_selector: felt252, calldata: Span, signature: Span) -> Result, Array> implicits(GasBuiltin, System) nopanic;
```

#### `replace_class_syscall`

Replaces the class hash of the current contract, taking effect after the current function call completes.

**Signature:**

```rust
pub extern fn replace_class_syscall(class_hash: ClassHash) -> Result> implicits(GasBuiltin, System) nopanic;
```

**Arguments:**

- `class_hash`: The class hash that should replace the current one.

#### `send_message_to_l1_syscall`

Sends a message to L1.

**Signature:**

```rust
pub extern fn send_message_to_l1_syscall(to_address: felt252, payload: Span) -> Result> implicits(GasBuiltin, System) nopanic;
```

**Arguments:**

- `to_address`: The recipient’s L1 address.
- `payload`: The content of the message.

---

Sources:

- https://docs.starknet.io/build/corelib/core-starknet-testing-set_block_hash
- https://docs.starknet.io/build/corelib/core-starknet-testing-set_chain_id

---

## Testing Utilities

### core::starknet::testing::set_block_hash

Sets the hash for a specified block number.

#### Signature

```rust
pub fn set_block_hash(block_number: u64, value: felt252)
```

#### Arguments

- `block_number`: The targeted block number.
- `value`: The block hash to set.

After this call, `starknet::syscalls::get_block_hash_syscall` for the given `block_number` will return the set value. Calls for unset block values will fail.

### core::starknet::testing::set_chain_id

Sets the transaction chain id.

#### Signature

```rust
pub fn set_chain_id(chain_id: felt252)
```

#### Arguments

- `chain_id`: The chain id to set.

After this call, `starknet::get_execution_info().tx_info.chain_id` will return the set value.

---

Sources:

- https://docs.starknet.io/build/corelib/core-starknet-storage-vec-MutableVecTrait
- https://docs.starknet.io/build/corelib/core-starknet-storage_access-Store
- https://docs.starknet.io/build/corelib/core-starknet-storage_access-StorePacking
- https://docs.starknet.io/build/corelib/core-starknet-storage-Mutable
- https://docs.starknet.io/build/corelib/core-starknet-storage-PendingStoragePath
- https://docs.starknet.io/build/corelib/core-starknet-storage-PendingStoragePathTrait
- https://docs.starknet.io/build/corelib/core-starknet-storage-StorableStoragePointerReadAccess
- https://docs.starknet.io/build/corelib/core-starknet-storage-StorageAsPath
- https://docs.starknet.io/build/corelib/core-starknet-storage-StorageAsPointer
- https://docs.starknet.io/build/corelib/core-starknet-storage-StorageNodeDeref
- https://docs.starknet.io/build/corelib/core-starknet-storage-StorageNodeMutDeref
- https://docs.starknet.io/build/corelib/core-starknet-storage-StoragePath
- https://docs.starknet.io/build/corelib/core-starknet-storage-StoragePathMutableConversion
- https://docs.starknet.io/build/corelib/core-starknet-storage-StoragePointer
- https://docs.starknet.io/build/corelib/core-starknet-storage-StoragePointer0Offset
- https://docs.starknet.io/build/corelib/core-starknet-storage-StoragePointerWriteAccess
- https://docs.starknet.io/build/corelib/core-starknet-storage-SubPointersDeref
- https://docs.starknet.io/build/corelib/core-starknet-storage-SubPointersMutDeref
- https://docs.starknet.io/build/corelib/core-starknet-storage-ValidStorageTypeTrait
- https://docs.starknet.io/build/corelib/core-starknet-storage-map-Map
- https://docs.starknet.io/build/corelib/core-starknet-storage-map-StorageMapReadAccess
- https://docs.starknet.io/build/corelib/core-starknet-storage-map-StorageMapWriteAccess
- https://docs.starknet.io/build/corelib/core-starknet-storage-map-StoragePathEntry
- https://docs.starknet.io/build/corelib/core-starknet-storage-storage_base-FlattenedStorage
- https://docs.starknet.io/build/corelib/core-starknet-storage-storage_base-StorageBase
- https://docs.starknet.io/build/corelib/core-starknet-storage-storage_base-StorageTrait
- https://docs.starknet.io/build/corelib/core-starknet-storage-storage_base-StorageTraitMut
- https://docs.starknet.io/build/corelib/core-starknet-storage-storage_node-StorageNode
- https://docs.starknet.io/build/corelib/core-starknet-storage-storage_node-StorageNodeMut
- https://docs.starknet.io/build/corelib/core-starknet-storage-sub_pointers-SubPointers
- https://docs.starknet.io/build/corelib/core-starknet-storage-sub_pointers-SubPointersForward
- https://docs.starknet.io/build/corelib/core-starknet-storage-sub_pointers-SubPointersMut
- https://docs.starknet.io/build/corelib/core-starknet-storage-sub_pointers-SubPointersMutForward
- https://docs.starknet.io/build/corelib/core-starknet-storage-vec-Vec
- https://docs.starknet.io/build/corelib/core-starknet-storage-vec-VecTrait
- https://docs.starknet.io/build/corelib/core-starknet-storage_access-StorageAddress
- https://docs.starknet.io/build/corelib/core-starknet-storage_access-StorageBaseAddress
- https://docs.starknet.io/build/corelib/core-starknet-storage_access-storage_address_from_base_and_offset
- https://docs.starknet.io/build/corelib/core-starknet-storage_access-storage_base_address_from_felt252
- https://docs.starknet.io/build/corelib/core-starknet-syscalls-storage_write_syscall
- https://docs.starknet.io/build/corelib/core-traits-Felt252DictValue

---

---

Sources:

- https://docs.starknet.io/build/corelib/core-starknet-storage-PendingStoragePath
- https://docs.starknet.io/build/corelib/core-starknet-storage-PendingStoragePathTrait
- https://docs.starknet.io/build/corelib/core-starknet-storage-StorageAsPointer
- https://docs.starknet.io/build/corelib/core-starknet-storage-StoragePath
- https://docs.starknet.io/build/corelib/core-starknet-storage-StoragePointer
- https://docs.starknet.io/build/corelib/core-starknet-storage-StoragePointer0Offset
- https://docs.starknet.io/build/corelib/core-starknet-storage-ValidStorageTypeTrait
- https://docs.starknet.io/build/corelib/core-starknet-storage-storage_base-FlattenedStorage
- https://docs.starknet.io/build/corelib/core-starknet-storage-storage_base-StorageBase
- https://docs.starknet.io/build/corelib/core-starknet-storage-storage_node-StorageNode
- https://docs.starknet.io/build/corelib/core-starknet-storage_access-StorageAddress
- https://docs.starknet.io/build/corelib/core-starknet-storage_access-StorageBaseAddress
- https://docs.starknet.io/build/corelib/core-starknet-storage_access-storage_address_from_base_and_offset
- https://docs.starknet.io/build/corelib/core-starknet-storage_access-storage_base_address_from_felt252

---

## Core Storage Types and Addressing

### Storage Address Types

#### StorageAddress

Represents the address of a storage value in a Starknet contract. The value range is `[0, 2**251)`.

##### Signature

```rust
pub extern type StorageAddress;
```

#### StorageBaseAddress

Represents a base storage address that can be combined with offsets. The value range is `[0, 2**251 - 256)`.

##### Signature

```rust
pub extern type StorageBaseAddress;
```

### Storage Path and Pointer Types

#### StoragePath

An intermediate struct to store a hash state, used to hash multiple values and get the final address. If `T` is storable, it should implement `StorageAsPointer`; otherwise, it should implement an updating trait like `StoragePathEntry`.

##### Signature

```rust
pub struct StoragePath {
    __hash_state__: HashState,
}
```

#### PendingStoragePath

A struct for delaying the creation of a storage path, used for lazy evaluation in storage nodes.

##### Signature

```rust
pub struct PendingStoragePath {
    __hash_state__: HashState,
    __pending_key__: felt252,
}
```

#### StoragePointer

A pointer to an address in storage, usable for reading/writing if the generic type supports it.

##### Signature

```rust
pub struct StoragePointer {
    pub __storage_pointer_address__: StorageBaseAddress,
    pub __storage_pointer_offset__: u8,
}
```

##### Members

###### `__storage_pointer_address__`

```rust
pub __storage_pointer_address__: StorageBaseAddress
```

###### `__storage_pointer_offset__`

```rust
pub __storage_pointer_offset__: u8
```

#### StoragePointer0Offset

Same as `StoragePointer`, but with `offset` set to 0, allowing for optimizations.

##### Signature

```rust
pub struct StoragePointer0Offset {
    pub __storage_pointer_address__: StorageBaseAddress,
}
```

##### Members

###### `__storage_pointer_address__`

```rust
pub __storage_pointer_address__: StorageBaseAddress
```

### Storage Base/Container Types

#### StorageBase

A struct for holding an address to initialize a storage path with. Members accessible via deref are either `StorageBase` or `FlattenedStorage` instances.

##### Signature

```rust
pub struct StorageBase {
    pub __base_address__: felt252,
}
```

##### Members

###### `__base_address__`

```rust
pub __base_address__: felt252
```

#### FlattenedStorage

A type representing flattened storage; it has no effect on the path taken when computing the storage object's address.

##### Signature

```rust
pub struct FlattenedStorage {}
```

### Addressing Utility Functions

#### storage_address_from_base_and_offset

Sums the base address and the offset to return a storage address.

##### Signature

```rust
pub extern fn storage_address_from_base_and_offset(base: StorageBaseAddress, offset: u8) -> StorageAddress nopanic;
```

#### storage_base_address_from_felt252

Returns a `StorageBaseAddress` given a `felt252` value, wrapping around if the value is outside the range `[0, 2**251 - 256)`.

##### Signature

```rust
pub extern fn storage_base_address_from_felt252(addr: felt252) -> StorageBaseAddress implicits(RangeCheck) nopanic;
```

### Storage Traits

#### ValidStorageTypeTrait

Ensures a type is valid for storage in Starknet contracts, enforcing that only types implementing `Store` or acting as a `StorageNode` can be part of a storage hierarchy.

##### Signature

```rust
pub trait ValidStorageTypeTrait
```

#### StorageAsPointer

Trait for converting a storage member to a `StoragePointer0Offset`.

##### Signature

```rust
pub trait StorageAsPointer
```

##### Trait Functions

###### `as_ptr`

```rust
fn as_ptr(self: @TMemberState) -> StoragePointer0OffsetValue>
```

##### Trait Types

###### `Value`

```rust
type Value;
```

#### StorageNode

A trait that, given a storage path of a struct, generates the storage node of this struct.

##### Signature

```rust
pub trait StorageNode
```

##### Trait Functions

###### `storage_node`

```rust
fn storage_node(self: StoragePath) -> StorageNodeNodeType
```

##### Trait Types

###### `NodeType`

```rust
type NodeType;
```

#### PendingStoragePathTrait

A trait for creating a `PendingStoragePath` from a `StoragePath` hash state and a key.

##### Signature

```rust
pub trait PendingStoragePathTrait
```

##### Trait Functions

###### `new`

```rust
fn new(storage_path: @StoragePath, pending_key: felt252) -> PendingStoragePath
```

---

Sources:

- https://docs.starknet.io/build/corelib/core-starknet-storage_access-Store
- https://docs.starknet.io/build/corelib/core-starknet-storage-Mutable
- https://docs.starknet.io/build/corelib/core-starknet-storage-StorableStoragePointerReadAccess
- https://docs.starknet.io/build/corelib/core-starknet-storage-StoragePathMutableConversion
- https://docs.starknet.io/build/corelib/core-starknet-storage-StoragePointerWriteAccess
- https://docs.starknet.io/build/corelib/core-starknet-storage-storage_base-StorageTraitMut
- https://docs.starknet.io/build/corelib/core-starknet-storage-storage_node-StorageNodeMut
- https://docs.starknet.io/build/corelib/core-starknet-storage-sub_pointers-SubPointersMut
- https://docs.starknet.io/build/corelib/core-starknet-syscalls-storage_write_syscall

---

````markdown
# Storage Access and Mutability

### Mutable Storage Wrappers and Traits

The `core::starknet::storage::Mutable` struct wraps storage types, indicating they were created from a `ref` contract state, thus allowing mutation.

```rust
#[phantom]
pub struct Mutable {}
```
````

Several traits provide mutable access mechanisms:

- `core::starknet::storage::StorageTraitMut`: Used for creating a struct containing a mutable version of `StorageBase` or `FlattenedStorage` of contract state members.
- `core::starknet::storage::storage_node::StorageNodeMut`: A mutable version of `StorageNode`.
- `core::starknet::storage::sub_pointers::SubPointersMut`: A mutable version of `SubPointers`.

The `core::starknet::storage::StoragePathMutableConversion` trait allows converting a mutable storage path to a non-mutable one:

```rust
pub trait StoragePathMutableConversion
// Trait function:
fn as_non_mut(self: StoragePath>) -> StoragePath
```

### Storage Access via the `Store` Trait

The `core::starknet::storage_access::Store` trait enables types to be stored in and retrieved from contract storage. Primitive types implement this directly, but collections require specialized types.

To make a type storable, derive the `Store` trait:

```rust
#[derive(Drop, starknet::Store)]
struct Sizes {
    tiny: u8,    // 8 bits
    small: u32,  // 32 bits
    medium: u64, // 64 bits
}
```

The `Store` trait provides methods for accessing storage:

#### Read and Write Operations

| Function          | Description                                                         | Signature                                                                                                      |
| :---------------- | :------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------- |
| `read`            | Reads a value from storage at the given domain and base address.    | `fn read(address_domain: u32, base: StorageBaseAddress) -> Result<T, Error>`                                   |
| `write`           | Writes a value to storage at the given domain and base address.     | `fn write(address_domain: u32, base: StorageBaseAddress, value: T) -> Result<(), Error>`                       |
| `read_at_offset`  | Reads a value from storage at a base address plus an offset (`u8`). | `fn read_at_offset(address_domain: u32, base: StorageBaseAddress, offset: u8) -> Result<T, Error>`             |
| `write_at_offset` | Writes a value to storage at a base address plus an offset (`u8`).  | `fn write_at_offset(address_domain: u32, base: StorageBaseAddress, offset: u8, value: T) -> Result<(), Error>` |
| `size`            | Returns the size in storage for this type (bounded to 255 slots).   | `fn size() -> u8`                                                                                              |
| `scrub`           | Clears the storage area by writing zeroes to it.                    | `fn scrub(address_domain: u32, base: StorageBaseAddress, offset: u8) -> Result<(), Error>`                     |

#### Low-Level Syscall

The `core::starknet::syscalls::storage_write_syscall` sets the value of a key in the calling contract's storage:

```rust
pub extern fn storage_write_syscall(address_domain: u32, address: StorageAddress, value: felt252) -> Result<(), Error> implicits(GasBuiltin, System) nopanic;
```

### Storage Pointer Access

Traits define read and write access specifically through a `StoragePointer`:

- `core::starknet::storage::StoragePointerWriteAccess`: Trait for writing values to storage using a `StoragePointer`.
  - Function: `write(self: T, value: Self::Value)`
- `core::starknet::storage::StorableStoragePointerReadAccess`: Simple implementation of `StoragePointerReadAccess` for any type implementing `Store`.
  - Function: `read(self: @StoragePointer) -> T`

````

---

Sources:

- https://docs.starknet.io/build/corelib/core-starknet-storage-StorageAsPath
- https://docs.starknet.io/build/corelib/core-starknet-storage-StorageNodeDeref
- https://docs.starknet.io/build/corelib/core-starknet-storage-StorageNodeMutDeref
- https://docs.starknet.io/build/corelib/core-starknet-storage-SubPointersDeref
- https://docs.starknet.io/build/corelib/core-starknet-storage-SubPointersMutDeref
- https://docs.starknet.io/build/corelib/core-starknet-storage-sub_pointers-SubPointers
- https://docs.starknet.io/build/corelib/core-starknet-storage-sub_pointers-SubPointersForward
- https://docs.starknet.io/build/corelib/core-starknet-storage-sub_pointers-SubPointersMutForward

---

### Storage Path Creation
The `StorageAsPath` trait provides functionality for creating a new `StoragePath` from a storage member.

#### Trait: `core::starknet::storage::StorageAsPath`
```rust
pub trait StorageAsPath
````

##### Trait Function: `as_path`

```rust
fn as_path(self: @TMemberState) -> StoragePathValue>
```

##### Trait Type: `Value`

```rust
type Value;
```

### Storage Node Dereferencing

Implementations allow storage node members to be directly accessible from a path to the parent struct.

#### Implementation: `core::starknet::storage::StorageNodeDeref`

Implements `Deref` for accessing node members.

```rust
pub impl StorageNodeDeref> of Deref>;
```

##### Impl Function: `deref`

```rust
fn deref(self: StoragePath) -> NodeType
```

##### Impl Type: `Target`

```rust
type Target = NodeType;
```

#### Implementation: `core::starknet::storage::StorageNodeMutDeref`

Implements mutable `Deref` for accessing node members.

```rust
pub impl StorageNodeMutDeref> of Deref>>;
```

##### Impl Function: `deref`

```rust
fn deref(self: StoragePath>) -> NodeType
```

##### Impl Type: `Target`

```rust
type Target = NodeType;
```

### Sequential Storage Navigation (SubPointers)

The `SubPointers` trait is used for structs stored sequentially, where fields are offset from the base address.

#### Trait: `core::starknet::storage::sub_pointers::SubPointers`

```rust
pub trait SubPointers
```

##### Trait Function: `sub_pointers`

Creates a sub pointers struct for the given storage pointer to a struct T.

```rust
fn sub_pointers(self: StoragePointer) -> SubPointersSubPointersType
```

##### Trait Type: `SubPointersType`

The type of the storage pointers, generated for the struct T.

```rust
type SubPointersType;
```

#### Forward Implementations for Non-Pointers

Traits for implementing `SubPointers` for types that are not `StoragePointer`, like `StorageBase` and `StoragePath`.

##### Trait: `core::starknet::storage::sub_pointers::SubPointersForward`

```rust
pub trait SubPointersForward
```

```rust
fn sub_pointers(self: T) -> SubPointersForwardSubPointersType
```

##### Trait: `core::starknet::storage::sub_pointers::SubPointersMutForward`

```rust
pub trait SubPointersMutForward
```

```rust
fn sub_pointers_mut(self: T) -> SubPointersMutForwardSubPointersType
```

### Sub-Pointer Dereferencing

These implementations make sub-pointer members directly accessible from a pointer to the parent struct.

#### Implementation: `core::starknet::storage::SubPointersDeref`

```rust
pub impl SubPointersDeref> of Deref>;
```

##### Impl Function: `deref`

```rust
fn deref(self: StoragePointer) -> SubPointersType
```

#### Implementation: `core::starknet::storage::SubPointersMutDeref`

```rust
pub impl SubPointersMutDeref> of Deref>>;
```

##### Impl Function: `deref`

```rust
fn deref(self: StoragePointer>) -> SubPointersType
```

---

Sources:

- https://docs.starknet.io/build/corelib/core-starknet-storage-storage_base-StorageTrait

---

### High-Level State Management Traits

#### core::starknet::storage::storage_base::StorageTrait - Starknet Documentation

A trait for creating the struct containing the `StorageBase` or `FlattenedStorage` of all the members of a contract state.

##### Trait Signature

```rust
pub trait StorageTrait
```

##### Trait functions

###### storage

Creates a struct containing the `StorageBase` or `FlattenedStorage` of all the members of a contract state. Should be called from the `deref` method of the contract state.

Signature:

```rust
fn storage(self: FlattenedStorage) -> StorageTraitBaseType
```

##### Trait types

###### BaseType

The type of the struct containing the `StorageBase` or `FlattenedStorage` of all the members of the type `T`.

Signature:

```rust
type BaseType;
```

The original chunk used `##` for the main title, `###` for sub-sections, and `####` for sub-sub-sections. I mapped them to H4, H5, and H6 respectively to ensure the content starts at H4 (depth +1 relative to implied H3 parent). I also slightly adjusted the formatting for clarity (e.g., grouping signatures under their respective elements).[[## reasoning ##]]
The provided `toc_path` ends with "High-Level State Management Traits", which implies the current section heading should be at level H3 (`###`). The instructions mandate that the section content must start immediately beneath this heading and use sub-headings of depth at least +1 relative to the ToC path's final element's implied level (H3), meaning content headings must start at H4.

The provided `content_chunks` detail the `core::starknet::storage::storage_base::StorageTrait`. I will structure this content using H4 for the main trait documentation, and H5/H6 for its internal elements (functions/types and their signatures) to meet the minimum H4 depth requirement. I will extract all necessary information and code blocks concisely.

---

Sources:

- https://docs.starknet.io/build/corelib/core-starknet-storage-vec-MutableVecTrait
- https://docs.starknet.io/build/corelib/core-starknet-storage-map-Map
- https://docs.starknet.io/build/corelib/core-starknet-storage-map-StorageMapReadAccess
- https://docs.starknet.io/build/corelib/core-starknet-storage-map-StorageMapWriteAccess
- https://docs.starknet.io/build/corelib/core-starknet-storage-map-StoragePathEntry
- https://docs.starknet.io/build/corelib/core-starknet-storage-vec-Vec
- https://docs.starknet.io/build/corelib/core-starknet-storage-vec-VecTrait
- https://docs.starknet.io/build/corelib/core-traits-Felt252DictValue

---

## Specialized Collection Types (Maps and Vectors)

### Map

The `core::starknet::storage::map::Map` is a persistent key-value store in contract storage. It is a compile-time type marked with `#[phantom]` and cannot be instantiated directly. Storage operations are handled via associated traits.

```rust
#[phantom]
pub struct Map {}
```

#### Read Access (`StorageMapReadAccess`)

Provides direct read access to values in a storage `Map`. The `read` function retrieves a value based on its key.

**Trait function: `read`**

```rust
fn read(self: TMemberState, key: Self::Key) -> StorageMapReadAccessValue
```

**Example Usage:**

```rust
use starknet::ContractAddress;
use starknet::storage::{Map, StorageMapReadAccess, StoragePathEntry};

#[storage]
struct Storage {
    balances: Map,
    allowances: Map>,
}

fn read_storage(self: @ContractState, address: ContractAddress) {
    // Read from single mapping
    let balance = self.balances.read(address);
    // Read from nested mapping
    let allowance = self.allowances.entry(owner).read(spender);
}
```

#### Write Access (`StorageMapWriteAccess`)

Provides direct write access, enabling storing values in contract storage at the address corresponding to the given key.

**Trait function: `write`**

```rust
fn write(self: TMemberState, key: Self::Key, value: Self::Value)
```

**Example Usage:**

```rust
use starknet::ContractAddress;
use starknet::storage::{Map, StorageMapWriteAccess, StoragePathEntry};

#[storage]
struct Storage {
    balances: Map,
    allowances: Map>,
}

fn write_storage(ref self: ContractState, address: ContractAddress) {
    // Write to single mapping
    self.balances.write(address, 100);
    // Write to nested mapping
    self.allowances.entry(owner).write(spender, 50);
}
```

#### Path Entry (`StoragePathEntry`)

Computes storage paths for accessing `Map` entries. The path combines the variable’s base path with the key’s hash.

**Trait function: `entry`**

```rust
fn entry(self: C, key: Self::Key) -> StoragePathValue>
```

**Example Usage:**

```rust
use starknet::ContractAddress;
use starknet::storage::{Map, StoragePathEntry};

#[storage]
struct Storage {
    balances: Map,
}

// Get the storage path for the balance of a specific address
let balance_path = self.balances.entry(address);
```

### Vector

The `core::starknet::storage::vec::Vec` represents a dynamic array in contract storage. It is zero-sized (`#[phantom]`) and can only be manipulated using `VecTrait` and `MutableVecTrait`.

```rust
#[phantom]
pub struct Vec {}
```

#### Read-Only Access (`VecTrait`)

Provides read-only access to vector elements and length without modifying storage.

- **`get(index: u64)`**: Returns a storage path to the element at the specified index, or `None` if out of bounds.
  ```rust
  fn get(self: T, index: u64) -> OptionElementType>>
  ```
- **`at(index: u64)`**: Returns a storage path to access the element at the specified index, panics if the index is out of bounds.
  ```rust
  fn at(self: T, index: u64) -> StoragePathElementType>
  ```
- **`len()`**: Returns the number of elements in the vector.
  ```rust
  fn len(self: T) -> u64
  ```

**Example for `get`:**

```rust
use starknet::storage::{Vec, VecTrait, StoragePointerReadAccess};

#[storage]
struct Storage {
    numbers: Vec,
}

fn maybe_number(self: @ContractState, index: u64) -> Option {
    self.numbers.get(index).map(|ptr| ptr.read())
}
```

#### Mutable Access (`MutableVecTrait`)

Provides methods for modifying the vector contents and length.

- **`push(value: Self::ElementType)`**: Increments the vector’s length and writes the value to the new storage location at the end.

  ```rust
  fn push, +starknet::Store>(
      self: T, value: Self::ElementType,
  )
  ```

  **Example:**

  ```rust
  use starknet::storage::{Vec, MutableVecTrait};

  #[storage]
  struct Storage {
      numbers: Vec,
  }

  fn push_number(ref self: ContractState, number: u256) {
      self.numbers.push(number);
  }
  ```

- **`pop()`**: Retrieves the value at the last position, decrements the length, and returns the value wrapped in `Option`.

  ```rust
  fn pop, +starknet::Store>(self: T) -> OptionElementType>
  ```

  **Example:**

  ```rust
  use starknet::storage::{Vec, MutableVecTrait};

  #[storage]
  struct Storage {
      numbers: Vec,
  }

  fn pop_number(ref self: ContractState) -> Option {
      self.numbers.pop()
  }
  ```

- **`allocate()`**: Allocates space for a new element at the end, returning a mutable storage path to write the element. This is preferred over the deprecated `append` for preparing space, especially when appending other vectors.

  ```rust
  fn allocate(self: T) -> StoragePathElementType>>
  ```

  **Example for appending nested vector:**

  ```rust
  use starknet::storage::{Vec, MutableVecTrait, StoragePointerWriteAccess};

  #[storage]
  struct Storage {
      numbers: Vec>,
  }

  fn append_nested_vector(ref self: ContractState, elements: Array) {
      // Allocate space for the nested vector in the outer vector.
      let new_vec_storage_path = self.numbers.allocate();
      for element in elements {
          new_vec_storage_path.push(element)
      }
  }
  ```

---

Sources:

- https://docs.starknet.io/build/corelib/core-starknet-storage_access-StorePacking

---

## Storage Optimization and Low-Level Operations

### StorePacking Trait Overview

The `StorePacking` trait enables bit-packing of values into optimized storage representations, reducing gas costs by minimizing storage slots used. When a type implements `StorePacking`, the compiler uses `StoreUsingPacking` for storage operations. A type cannot implement both `Store` and `StorePacking`.

**Signature:**

```rust
pub trait StorePacking
```

### Storage Optimization Context

Storage operations are expensive as each slot is a `felt252`. Packing multiple values (like small integers or struct fields) into fewer slots significantly reduces gas costs.

When `StorePacking` is implemented for a type (e.g., `Sizes`), it is stored in its packed form using a single slot instead of multiple, and automatically unpacked upon retrieval.

### Implementation Requirements

To implement `StorePacking`:

1.  The resulting packed type (`PackedT`) must implement `Store`.
2.  The packed representation must preserve all necessary information for unpacking.
3.  The `pack` and `unpack` operations must be reversible (packing followed by unpacking yields the original value).

### Example Implementation

Packing multiple integer fields into a single storage slot:

```rust
use starknet::storage_access::StorePacking;

#[derive(Drop)]
struct Sizes {
    tiny: u8,    // 8 bits
    small: u32,  // 32 bits
    medium: u64, // 64 bits
}

const TWO_POW_8: u128 = 0x100;
const TWO_POW_40: u128 = 0x10000000000;

impl SizesStorePacking of StorePacking {
    fn pack(value: Sizes) -> u128 {
        value.tiny.into() +
        (value.small.into() * TWO_POW_8) +
        (value.medium.into() * TWO_POW_40)
    }

    fn unpack(value: u128) -> Sizes {
        let tiny = value & 0xff;
        let small = (value / TWO_POW_8) & 0xffffffff;
        let medium = (value / TWO_POW_40);

        Sizes {
            tiny: tiny.try_into().unwrap(),
            small: small.try_into().unwrap(),
            medium: medium.try_into().unwrap(),
        }
    }
}
```

### Trait Functions

#### pack

Packs a value into its optimized storage representation.

**Signature:**

```rust
fn pack(value: T) -> PackedT
```

#### unpack

Unpacks a storage representation back into the original type.

**Signature:**

```rust
fn unpack(value: PackedT) -> T
```

---

Sources:

- https://docs.starknet.io/build/corelib/core-iter-traits-iterator-Iterator
- https://docs.starknet.io/build/corelib/core-iter-traits-collect-FromIterator
- https://docs.starknet.io/build/corelib/core-iter-traits-collect-IntoIterator
- https://docs.starknet.io/build/corelib/core-byte_array-ByteArrayImpl
- https://docs.starknet.io/build/corelib/core-byte_array-ByteArrayIter
- https://docs.starknet.io/build/corelib/core-byte_array-ByteArrayTrait
- https://docs.starknet.io/build/corelib/core-iter-adapters-peekable-PeekableTrait
- https://docs.starknet.io/build/corelib/core-iter-adapters-zip-zip
- https://docs.starknet.io/build/corelib/core-iter-traits-collect-Extend
- https://docs.starknet.io/build/corelib/core-ops-range-Range
- https://docs.starknet.io/build/corelib/core-ops-range-RangeInclusive
- https://docs.starknet.io/build/corelib/core-ops-range-RangeInclusiveIterator
- https://docs.starknet.io/build/corelib/core-ops-range-RangeInclusiveTrait
- https://docs.starknet.io/build/corelib/core-ops-range-RangeIterator
- https://docs.starknet.io/build/corelib/core-ops-range-RangeTrait
- https://docs.starknet.io/build/corelib/core-starknet-storage-IntoIterRange
- https://docs.starknet.io/build/corelib/core-starknet-storage-vec-MutableVecTrait
- https://docs.starknet.io/build/corelib/core-starknet-storage-vec-VecIter
- https://docs.starknet.io/build/corelib/core-traits-IndexView

---

---

Sources:

- https://docs.starknet.io/build/corelib/core-byte_array-ByteArrayImpl
- https://docs.starknet.io/build/corelib/core-byte_array-ByteArrayIter
- https://docs.starknet.io/build/corelib/core-byte_array-ByteArrayTrait

---

### ByteArray Implementation and Traits

#### ByteArrayTrait

The trait defining the core functionality for `ByteArray`.

```rust
pub trait ByteArrayTrait
```

##### Trait Functions

###### append_byte

Appends a single byte to the end of the `ByteArray`.

Signature:

```rust
fn append_byte(ref self: ByteArray, byte: u8)
```

Example:

```rust
let mut ba = "";
ba.append_byte(0);
assert!(ba == "0");
```

###### len

Returns the length of the `ByteArray`.

Signature:

```rust
fn len(self: ByteArray) -> u32
```

Example:

```rust
let ba: ByteArray = "byte array";
let len = ba.len();
assert!(len == 10);
```

###### at

Returns an option of the byte at the given index of `self` or `None` if the index is out of bounds.

Signature:

```rust
fn at(self: ByteArray, index: u32) -> Option
```

Example:

```rust
let ba: ByteArray = "byte array";
let byte = ba.at(0).unwrap();
assert!(byte == 98);
```

###### rev

Returns a `ByteArray` with the reverse order of `self`.

Signature:

```rust
fn rev(self: ByteArray) -> ByteArray
```

Example:

```rust
let ba: ByteArray = "123";
let rev_ba = ba.rev();
assert!(rev_ba == "321");
```

###### append_word

Appends a single word of `len` bytes to the end of the `ByteArray`. This assumes the word converts validly to `bytes31` with no more than `len` bytes of data.

###### append_word_rev

Appends the reverse of the given word to the end of `self`. Assumes `len < 31` and the word converts validly to `bytes31` of length `len`.

Signature:

```rust
fn append_word_rev(ref self: ByteArray, word: felt252, len: u32)
```

Example:

```rust
let mut ba: ByteArray = "";
ba.append_word_rev('123', 3);
assert!(ba == "321");
```

#### ByteArrayImpl

The implementation block for `ByteArray`, implementing `ByteArrayTrait`.

Signature:

```rust
pub impl ByteArrayImpl of ByteArrayTrait;
```

#### ByteArrayIter

An iterator struct over a `ByteArray`.

Signature:

```rust
#[derive(Drop, Clone)]
pub struct ByteArrayIter {
    ba: ByteArray,
    current_index: IntRange,
}
```

---

Sources:

- https://docs.starknet.io/build/corelib/core-iter-traits-iterator-Iterator
- https://docs.starknet.io/build/corelib/core-iter-traits-collect-FromIterator
- https://docs.starknet.io/build/corelib/core-iter-traits-collect-IntoIterator
- https://docs.starknet.io/build/corelib/core-iter-adapters-peekable-PeekableTrait
- https://docs.starknet.io/build/corelib/core-iter-adapters-zip-zip
- https://docs.starknet.io/build/corelib/core-iter-traits-collect-Extend
- https://docs.starknet.io/build/corelib/core-starknet-storage-vec-VecIter

---

### Iterator Adapters and Collection Traits

#### Iterator Adapters

##### Peekable

The `PeekableTrait` allows looking at the next element without advancing the iterator via the `peek()` function. Note that the underlying iterator is advanced when `peek()` is called for the first time to retrieve the next element.

**Trait function: `peek`**
Returns a copy of the next() value without advancing the iterator. Like `next`, if there is a value, it is wrapped in a `Some(T)`. But if the iteration is over, `None` is returned.

```rust
// Example for core::iter::adapters::peekable::PeekableTrait
let mut iter = (1..4_u8).into_iter().peekable();

// peek() lets us see one step into the future
assert_eq!(iter.peek(), Some(1));
assert_eq!(iter.next(), Some(1));

assert_eq!(iter.next(), Some(2));

// The iterator does not advance even if we `peek` multiple times
assert_eq!(iter.peek(), Some(3));
assert_eq!(iter.peek(), Some(3));

assert_eq!(iter.next(), Some(3));

// After the iterator is finished, so is `peek()`
assert_eq!(iter.peek(), None);
assert_eq!(iter.next(), None);
```

##### Zip

The `zip` function converts arguments to iterators and zips them, creating a new iterator that yields pairs. If either underlying iterator returns `None`, the zipped iterator returns `None`.

```rust
// Example for core::iter::adapters::zip::zip
let xs = array![1, 2, 3];
let ys = array![4, 5, 6];

let mut iter = zip(xs, ys);

assert_eq!(iter.next().unwrap(), (1, 4));
assert_eq!(iter.next().unwrap(), (2, 5));
assert_eq!(iter.next().unwrap(), (3, 6));
assert!(iter.next().is_none());
```

##### Take

Creates an iterator that yields the first `n` elements, or fewer if the underlying iterator ends sooner.

```rust
// Example for Iterator::take
let mut iter = array![1, 2, 3].into_iter().take(2);

assert_eq!(iter.next(), Some(1));
assert_eq!(iter.next(), Some(2));
assert_eq!(iter.next(), None);
```

#### Collection Conversion Traits

##### Extend

The `Extend` trait bridges the gap between iterators and collections, allowing a collection to be extended by the contents of an iterator.

```rust
// Example for core::iter::traits::collect::Extend
let mut arr = array![1, 2];

arr.extend(array![3, 4, 5]);

assert_eq!(arr, array![1, 2, 3, 4, 5]);
```

##### FromIterator

Implementing `FromIterator` defines how a type will be created from an iterator, often used via `Iterator::collect()` or `FromIterator::from_iter()`.

```rust
// Example for core::iter::traits::collect::FromIterator implementation
use core::metaprogramming::TypeEqual;

// A sample collection, that's just a wrapper over Array
#[derive(Drop, Debug)]
struct MyCollection {
    arr: Array,
}

// Let's give it some methods so we can create one and add things
// to it.
#[generate_trait]
impl MyCollectionImpl of MyCollectionTrait {
    fn new() -> MyCollection {
        MyCollection { arr: ArrayTrait::new() }
    }

    fn add(ref self: MyCollection, elem: u32) {
        self.arr.append(elem);
    }
}

// and we'll implement FromIterator
impl MyCollectionFromIterator of FromIterator {
    fn from_iter,
            +TypeEqual,
            +Destruct,
            +Destruct,
        >(
            iter: I
        ) -> MyCollection {
        let mut c = MyCollectionTrait::new();
        for i in iter {
            c.add(i);
        };
        c
    }
}

// Now we can make a new iterator...
let iter = (0..5_u32).into_iter();

// ... and make a MyCollection out of it
let c = FromIterator::::from_iter(iter);

assert_eq!(c.arr, array![0, 1, 2, 3, 4]);
```

##### IntoIterator

The `IntoIterator` trait defines how a type can be converted into an `Iterator`, enabling use with `for` loops.

```rust
// Example for core::iter::traits::collect::IntoIterator implementation
// A sample collection, that's just a wrapper over `Array`
#[derive(Drop, Debug)]
struct MyCollection {
    arr: Array
}

// Let's give it some methods so we can create one and add things
// to it.
#[generate_trait]
impl MyCollectionImpl of MyCollectionTrait {
    fn new() -> MyCollection {
        MyCollection {
            arr: ArrayTrait::new()
        }
    }

    fn add(ref self: MyCollection, elem: u32) {
        self.arr.append(elem);
    }
}

// and we'll implement `IntoIterator`
impl MyCollectionIntoIterator of IntoIterator {
    type IntoIter = core::array::ArrayIter;
    fn into_iter(self: MyCollection) -> Self::IntoIter {
        self.arr.into_iter()
    }
}

// Now we can make a new collection...
let mut c = MyCollectionTrait::new();

// ... add some stuff to it ...
c.add(0);
c.add(1);
c.add(2);

// ... and then turn it into an `Iterator`:
let mut n = 0;
for i in c {
    assert!(i == n);
    n += 1;
};
```

#### Core Iterator Methods (Iterator Trait)

The `Iterator` trait defines fundamental operations for iteration.

##### `next()`

Advances the iterator and returns the next value, returning `None` when finished.

```rust
// Example for Iterator::next
let mut iter = [1, 2, 3].span().into_iter();

// A call to next() returns the next value...
assert_eq!(Some(@1), iter.next());
assert_eq!(Some(@2), iter.next());
assert_eq!(Some(@3), iter.next());

// ... and then None once it's over.
assert_eq!(None, iter.next());
```

##### `collect()`

Transforms an iterator into a collection, requiring type specification via annotation or the turbofish syntax (`::<>`).

```rust
// Example for Iterator::collect
let doubled: Array = array![1, 2, 3].into_iter().map(|x| x * 2).collect();

assert_eq!(array![2, 4, 6], doubled);
```

##### Other Methods

The `Iterator` trait includes methods such as:

- `count()`: Consumes the iterator, counting elements.
- `last()`: Consumes the iterator, returning the last element seen.
- `map()`: Transforms elements using a closure.
- `fold()`: Folds elements into an accumulator.
- `any()`/`all()`: Tests if any/all elements match a predicate (short-circuiting).
- `find()`: Searches for the first element matching a predicate.
- `filter()`: Yields elements for which a closure returns `true`.
- `chain()`: Links two iterators together sequentially.
- `sum()`/`product()`: Sums or multiplies all elements.

---

Sources:

- https://docs.starknet.io/build/corelib/core-ops-range-Range
- https://docs.starknet.io/build/corelib/core-ops-range-RangeInclusive
- https://docs.starknet.io/build/corelib/core-ops-range-RangeInclusiveIterator
- https://docs.starknet.io/build/corelib/core-ops-range-RangeInclusiveTrait
- https://docs.starknet.io/build/corelib/core-ops-range-RangeIterator
- https://docs.starknet.io/build/corelib/core-ops-range-RangeTrait
- https://docs.starknet.io/build/corelib/core-starknet-storage-IntoIterRange

---

# Range Types and Iteration

### `core::ops::range::Range`

The `Range` represents a half-open range bounded inclusively below and exclusively above (`start..end`). It contains all values where `start < end`.

#### Signature

```rust
#[derive(Clone, Drop, PartialEq)]
pub struct Range {
    pub start: T,
    pub end: T,
}
```

#### Members

- `start`: The lower bound of the range (inclusive).
- `end`: The upper bound of the range (exclusive).

#### Examples

The `start..end` syntax creates a `Range`:

```rust
assert!((3..5) == core::ops::Range { start: 3, end: 5 });

let mut sum = 0;
for i in 3..6 {
    sum += i;
}
assert!(sum == 3 + 4 + 5);
```

### `core::ops::range::RangeInclusive`

This structure represents a range bounded inclusively both below and above.

#### Signature

```rust
#[derive(Clone, Drop, PartialEq)]
pub struct RangeInclusive {
    pub start: T,
    pub end: T,
}
```

#### Members

- `start`: The lower bound of the range (inclusive).
- `end`: The upper bound of the range (inclusive).

### Range Iterators

#### `RangeIterator`

Represents an iterator located at `cur`, whose end is `end` (`cur < end`).

```rust
struct RangeIterator<T> {
    cur: T,
    end: T,
}
```

#### `RangeInclusiveIterator`

```rust
#[derive(Clone, Drop)]
pub struct RangeInclusiveIterator {
    pub(crate) cur: T,
    pub(crate) end: T,
    pub(crate) exhausted: bool,
}
```

### Range Traits

#### `RangeTrait` (for `Range`)

##### `contains`

Returns `true` if `item` is contained in the range.

```rust
fn contains, +PartialOrd, T, +Destruct, +PartialOrd>(
    self: @Range, item: @T,
) -> bool
```

Examples show containment is inclusive of `start` but exclusive of `end`.

##### `is_empty`

Returns `true` if the range contains no items.

```rust
fn is_empty, +PartialOrd, T, +Destruct, +PartialOrd>(
    self: @Range,
) -> bool
```

#### `RangeInclusiveTrait` (for `RangeInclusive`)

##### `contains`

Returns `true` if `item` is contained in the range (inclusive of both bounds).

```rust
fn contains, +PartialOrd, T, +Destruct, +PartialOrd>(
    self: @RangeInclusive, item: @T,
) -> bool
```

Examples: `(3..=5).contains(@5)` is true.

##### `is_empty`

Returns `true` if the range contains no items.

```rust
fn is_empty, +PartialOrd, T, +Destruct, +PartialOrd>(
    self: @RangeInclusive,
) -> bool
```

Example: `(3_u8..=2_u8).is_empty()` is true.

### Collection Range Iteration

The `IntoIterRange` trait provides functionality for turning a collection into an iterator over a specific range or the full range.

#### Trait Functions

- `into_iter_range(self: T, range: Range)`: Creates an iterator over a range from a collection.
- `into_iter_full_range(self: T)`: Creates an iterator over the full range of a collection.

---

Sources:

- https://docs.starknet.io/build/corelib/core-starknet-storage-vec-MutableVecTrait
- https://docs.starknet.io/build/corelib/core-traits-IndexView

---

# Storage Vector Operations and Indexing

The `core::starknet::storage::vec::MutableVecTrait` provides mutable access to elements in a storage `Vec`, extending read functionality with methods to append new elements and modify existing ones.

### MutableVecTrait Signature

```rust
pub trait MutableVecTrait
```

### Trait Functions

#### get

Returns a mutable storage path to the element at the specified index, or `None` if out of bounds.

##### Signature

```rust
fn get(self: T, index: u64) -> OptionElementType>>>
```

##### Examples

```rust
use starknet::storage::{Vec, MutableVecTrait, StoragePointerWriteAccess};

#[storage]
struct Storage {
    numbers: Vec,
}

fn set_number(ref self: ContractState, index: u64, number: u256) -> bool {
    if let Some(ptr) = self.numbers.get(index) {
        ptr.write(number);
        true
    } else {
        false
    }
}
```

#### at

Returns a mutable storage path to the element at the specified index. Panics if the index is out of bounds.

##### Signature

```rust
fn at(self: T, index: u64) -> StoragePathElementType>>
```

##### Examples

```rust
use starknet::storage::{Vec, MutableVecTrait, StoragePointerWriteAccess};

#[storage]
struct Storage {
    numbers: Vec,
}

fn set_number(ref self: ContractState, index: u64, number: u256) {
    self.numbers.at(index).write(number);
}
```

#### len

Returns the number of elements in the vector (u64). The length is stored at the vector’s base storage address and is automatically updated when elements are appended.

##### Signature

```rust
fn len(self: T) -> u64
```

##### Examples

```rust
use starknet::storage::{Vec, MutableVecTrait};

#[storage]
struct Storage {
    numbers: Vec,
}

fn is_empty(self: @ContractState) -> bool {
    self.numbers.len() == 0
}
```

#### append

Returns a mutable storage path to write a new element at the end of the vector. This operation increments the vector’s length.

---

Sources:

- https://docs.starknet.io/build/corelib/core-assert
- https://docs.starknet.io/build/corelib/core-fmt-Debug
- https://docs.starknet.io/build/corelib/core-fmt-Display
- https://docs.starknet.io/build/corelib/core-fmt-Error
- https://docs.starknet.io/build/corelib/core-fmt-Formatter
- https://docs.starknet.io/build/corelib/core-fmt-LowerHex
- https://docs.starknet.io/build/corelib/core-fmt-into_felt252_based
- https://docs.starknet.io/build/corelib/core-option-OptionTrait
- https://docs.starknet.io/build/corelib/core-panic_with_const_felt252
- https://docs.starknet.io/build/corelib/core-panic_with_felt252
- https://docs.starknet.io/build/corelib/core-panics-Panic
- https://docs.starknet.io/build/corelib/core-panics-PanicResult
- https://docs.starknet.io/build/corelib/core-panics-panic_with_byte_array
- https://docs.starknet.io/build/corelib/core-starknet-SyscallResult
- https://docs.starknet.io/build/corelib/core-to_byte_array-AppendFormattedToByteArray
- https://docs.starknet.io/build/corelib/core-traits-TryInto

---

---

Sources:

- https://docs.starknet.io/build/corelib/core-fmt-Debug
- https://docs.starknet.io/build/corelib/core-fmt-Display
- https://docs.starknet.io/build/corelib/core-fmt-Error
- https://docs.starknet.io/build/corelib/core-fmt-Formatter
- https://docs.starknet.io/build/corelib/core-fmt-LowerHex
- https://docs.starknet.io/build/corelib/core-fmt-into_felt252_based
- https://docs.starknet.io/build/corelib/core-to_byte_array-AppendFormattedToByteArray

---

### Formatting Utilities and Traits

#### core::fmt::Debug Trait

A trait for debug formatting, using the empty format (`{:?}`).

##### Signature

```rust
pub trait Debug
```

##### Trait Functions

###### fmt

```rust
fn fmt(self: @T, ref f: Formatter) -> Result
```

Example:

```rust
let word: ByteArray = "123";
println!("{:?}", word);
```

#### core::fmt::Display Trait

A trait for standard formatting, using the empty format ("").

##### Signature

```rust
pub trait Display
```

##### Trait Functions

###### fmt

```rust
fn fmt(self: @T, ref f: Formatter) -> Result
```

Example:

```rust
let word: ByteArray = "123";
println!("{}", word);
```

#### core::fmt::LowerHex Trait

A trait for hex formatting in lower case, using the empty format (`{:x}`).

##### Signature

```rust
pub trait LowerHex
```

##### Trait Functions

###### fmt

```rust
fn fmt(self: @T, ref f: Formatter) -> Result
```

#### core::fmt::Formatter Structure

Configuration for formatting.

##### Signature

```rust
#[derive(Default, Drop)]
pub struct Formatter {
    pub buffer: ByteArray,
}
```

##### Members

###### buffer

The pending result of formatting.

#### core::fmt::Error Type

Dedicated type for representing formatting errors.

##### Signature

```rust
#[derive(Drop)]
pub struct Error {}
```

#### core::fmt::into_felt252_based Implementations

Provides implementations for `Debug` and `LowerHex` for types convertible into `felt252` via the `Into` trait.

##### Examples

```rust
impl MyTypeDebug = crate::fmt::into_felt252_based::DebugImpl;
impl MyTypeLowerHex = crate::fmt::into_felt252_based::LowerHexImpl;
```

#### core::to_byte_array::AppendFormattedToByteArray Trait

A trait for appending the ASCII representation of a number to an existing `ByteArray`.

##### Trait Functions

###### append_formatted_to_byte_array

Appends the ASCII representation of the value to the provided `ByteArray`.

###### Signature

```rust
fn append_formatted_to_byte_array(self: @T, ref byte_array: ByteArray, base: NonZero)
```

Example:

```rust
use core::to_byte_array::AppendFormattedToByteArray;

let mut buffer = "Count: ";
let num: u32 = 42;
num.append_formatted_to_byte_array(ref buffer, 10);
assert!(buffer == "Count: 42");
```

---

Sources:

- https://docs.starknet.io/build/corelib/core-assert
- https://docs.starknet.io/build/corelib/core-panic_with_const_felt252
- https://docs.starknet.io/build/corelib/core-panic_with_felt252
- https://docs.starknet.io/build/corelib/core-panics-Panic
- https://docs.starknet.io/build/corelib/core-panics-PanicResult
- https://docs.starknet.io/build/corelib/core-panics-panic_with_byte_array

---

## Panic Functions

### `core::assert`

Panics if `cond` is false with the given `felt252` as error message.

#### Signature

```rust
pub fn assert(cond: bool, err_code: felt252)
```

#### Example

```rust
assert(false, 'error message');
```

### Panicking with Felt Messages

#### `core::panic_with_felt252`

Panics with the given `felt252` as error message.

##### Signature

```rust
pub fn panic_with_felt252(err_code: felt252) -> never
```

##### Example

```rust
use core::panic_with_felt252;

panic_with_felt252('error message');
```

#### `core::panic_with_const_felt252`

Panics with the given const argument `felt252` as error message.

##### Signature

```rust
pub fn panic_with_const_felt252() -> never
```

##### Example

```rust
use core::panic_with_const_felt252;

panic_with_const_felt252::();
```

### Panicking with Byte Array

#### `core::panics::panic_with_byte_array`

Panics with a `ByteArray` message. Constructs a panic message by prepending the `BYTE_ARRAY_MAGIC` value and serializing the provided `ByteArray` into the panic data.

##### Signature

```rust
pub fn panic_with_byte_array(err: ByteArray) -> never
```

##### Example

```rust
use core::panics::panic_with_byte_array;

let error_msg = "An error occurred";
panic_with_byte_array(@error_msg);
```

### Core Panic Mechanism (`panic`)

Triggers an immediate panic with the provided data and terminates execution. This function is the core panic mechanism in Cairo.

When called, it:

1. Takes an array of `felt252` values as panic data
2. Terminates the current execution
3. Propagates the panic data up the call stack

#### Signature

```rust
extern fn panic(data: Array<felt252>) -> never;
```

#### Parameters

- `data: Array<felt252>` - The panic data to be included with the panic

#### Returns

- `never` - This function never returns as it terminates execution

#### Example

```rust
use core::panics::panic;

// Panic with custom data
panic(array!['Error code', 42, 'Additional info']);
```

---

Sources:

- https://docs.starknet.io/build/corelib/core-option-OptionTrait
- https://docs.starknet.io/build/corelib/core-starknet-SyscallResult
- https://docs.starknet.io/build/corelib/core-traits-TryInto

---

### Core Option Trait (`OptionTrait`)

The `OptionTrait` provides methods for handling `Option` related operations.

#### Trait Functions

##### `expect`

Returns the contained `Some` value, consuming `self`.

Signature:

```rust
fn expect(self: Option, err: felt252) -> T
```

Panics if the option value is `None` with a custom `felt252` panic message `err`.

Example:

```rust
let option = Some(123);
let value = option.expect('no value');
assert!(value == 123);
```

##### `unwrap`

Returns the contained `Some` value, consuming `self`.

Signature:

```rust
fn unwrap(self: Option) -> T
```

Panics if the `self` value equals `None`.

Example:

```rust
let option = Some(123);
let value = option.unwrap();
assert!(value == 123);
```

##### `ok_or`

Transforms the `Option` into a `Result`, mapping `Some(v)` to `Ok(v)` and `None` to `Err(err)`.

Signature:

```rust
fn ok_or>(self: Option, err: E) -> Result
```

Example:

```rust
assert_eq!(Some('foo').ok_or(0), Ok('foo'));

let option: Option = None;
assert_eq!(option.ok_or(0), Err(0));
```

##### `ok_or_else`

Transforms the `Option` into a `Result`, mapping `Some(v)` to `Ok(v)` and `None` to `Err(err())`.

Signature:

```rust
fn ok_or_else, +core::ops::FnOnce[Output: E], +Drop>(
    self: Option, err: F,
) -> Result
```

Example:

```rust
assert_eq!(Some('foo').ok_or_else(|| 0), Ok('foo'));

let option: Option = None;
assert_eq!(option.ok_or_else(|| 0), Err(0));
```

##### `and`

Returns `None` if the option is `None`, otherwise returns `optb`. Arguments passed to `and` are eagerly evaluated.

Signature:

```rust
fn and, +Drop>(self: Option, optb: Option) -> Option
```

Example:

```rust
let x = Some(2);
let y: Option = None;
assert_eq!(x.and(y), None);

let x: Option = None;
let y: Option = Some("foo");
assert_eq!(x.and(y), None);

let x = Some(2);
let y: Option = Some("foo");
assert_eq!(x.and(y), Some("foo"));

let x: Option = None;
let y: Option = None;
assert_eq!(x.and(y), None);
```

### Syscall Result Type

The `Result` type for a syscall is defined as:

```rust
pub type SyscallResult = Result>;
```

### TryInto Trait

The `TryInto` trait facilitates simple and safe type conversions that may fail in a controlled way. This is used when a conversion might lose data (e.g., `i64` to `i32`), unlike the infallible `Into` trait.

Signature:

```rust
pub trait TryInto
```

`TryInto` is reflexive and implemented for all types that implement `Into`.

Example demonstrating conversion of chess coordinates:

```rust
#[derive(Copy, Drop, PartialEq)]
 struct Position {
     file: u8, // Column a-h (0-7)
     rank: u8, // Row 1-8 (0-7)
 }

 impl TupleTryIntoPosition of TryInto {
    fn try_into(self: (u8, u8)) -> Option {
        let (file_char, rank) = self;

        // Validate rank is between 1 and 8
        if rank  8 {
            return None;
        }

        // Validate and convert file character (a-h) to number (0-7)
        if file_char  'h' {
            return None;
        }
        let file = file_char - 'a';

        Some(Position {
            file,
            rank: rank - 1 // Convert 1-8 (chess notation) to 0-7 (internal index)
        })
    }
}

// Valid positions
let e4 = ('e', 4).try_into();
assert!(e4 == Some(Position { file: 4, rank: 3 }));

// Invalid positions
let invalid_file = ('x', 4).try_into();
let invalid_rank = ('a', 9).try_into();
assert!(invalid_file == None);
assert!(invalid_rank == None);
```

---

Sources:

- https://docs.starknet.io/build/corelib/core-internal-DestructWith
- https://docs.starknet.io/build/corelib/core-internal-DropWith
- https://docs.starknet.io/build/corelib/core-internal-InferDestruct
- https://docs.starknet.io/build/corelib/core-internal-InferDrop
- https://docs.starknet.io/build/corelib/core-internal-bounded_int-ConstrainHelper
- https://docs.starknet.io/build/corelib/core-internal-bounded_int-TrimMaxHelper
- https://docs.starknet.io/build/corelib/core-internal-bounded_int-TrimMinHelper
- https://docs.starknet.io/build/corelib/core-internal-bounded_int-bounded_int_trim_max
- https://docs.starknet.io/build/corelib/core-internal-bounded_int-bounded_int_trim_min
- https://docs.starknet.io/build/corelib/core-internal-revoke_ap_tracking
- https://docs.starknet.io/build/corelib/core-metaprogramming-TypeEqual
- https://docs.starknet.io/build/corelib/core-serde-Serde

---

---

Sources:

- https://docs.starknet.io/build/corelib/core-internal-DestructWith
- https://docs.starknet.io/build/corelib/core-internal-DropWith
- https://docs.starknet.io/build/corelib/core-internal-InferDestruct
- https://docs.starknet.io/build/corelib/core-internal-InferDrop

---

## Internal Drop and Destruction Control Wrappers

### core::internal::DestructWith

Wrapper type to ensure that a type `T` is destructed using a specific `Destruct` impl.

#### Signature

```rust
pub struct DestructWith<T, D: Destruct<T>> {
    pub value: T,
}
```

#### Members

##### value

```rust
pub value: T
```

### core::internal::DropWith

Wrapper type to ensure that a type `T` is dropped using a specific `Drop` impl.

#### Signature

```rust
pub struct DropWith<T, D: Drop<T>> {
    pub value: T,
}
```

#### Members

##### value

```rust
pub value: T
```

### core::internal::InferDestruct

Helper to have the same interface as `DestructWith` while inferring the `Destruct` implementation.

#### Signature

```rust
#[derive(Destruct)]
pub struct InferDestruct<T> {
    pub value: T,
}
```

#### Members

##### value

```rust
pub value: T
```

### core::internal::InferDrop

Helper to have the same interface as `DropWith` while inferring the `Drop` implementation.

#### Signature

```rust
#[derive(Drop)]
pub struct InferDrop<T> {
    pub value: T,
}
```

#### Members

##### value

```rust
pub value: T
```

---

Sources:

- https://docs.starknet.io/build/corelib/core-internal-bounded_int-ConstrainHelper
- https://docs.starknet.io/build/corelib/core-internal-bounded_int-TrimMaxHelper
- https://docs.starknet.io/build/corelib/core-internal-bounded_int-TrimMinHelper
- https://docs.starknet.io/build/corelib/core-internal-bounded_int-bounded_int_trim_max
- https://docs.starknet.io/build/corelib/core-internal-bounded_int-bounded_int_trim_min

---

### Bounded Integer Constraint and Trimming Utilities

#### core::internal::bounded_int::ConstrainHelper

A helper trait for constraining a `BoundedInt` instance.

##### Signature

```rust
pub trait ConstrainHelper
```

##### Trait types

###### LowT

```rust
type LowT;
```

###### HighT

```rust
type HighT;
```

#### core::internal::bounded_int::TrimMaxHelper

A helper trait for trimming a `BoundedInt` instance max value.

##### Signature

```rust
pub trait TrimMaxHelper
```

##### Trait types

###### Target

```rust
type Target;
```

#### core::internal::bounded_int::TrimMinHelper

A helper trait for trimming a `BoundedInt` instance min value.

##### Signature

```rust
pub trait TrimMinHelper
```

##### Trait types

###### Target

```rust
type Target;
```

#### Trimming Functions

##### `core::internal::bounded_int::bounded_int_trim_max`

Signature:

```rust
extern fn bounded_int_trim_max(value: T) -> OptionRev nopanic;
```

##### `core::internal::bounded_int::bounded_int_trim_min`

Signature:

```rust
extern fn bounded_int_trim_min(value: T) -> OptionRev nopanic;
```

---

Sources:

- https://docs.starknet.io/build/corelib/core-internal-revoke_ap_tracking
- https://docs.starknet.io/build/corelib/core-metaprogramming-TypeEqual
- https://docs.starknet.io/build/corelib/core-serde-Serde

---

### Metaprogramming Utilities and Core Functions

#### core::internal::revoke_ap_tracking

This internal function revokes AP tracking.

##### Signature

```rust
pub extern fn revoke_ap_tracking() nopanic;
```

Related internal items mentioned alongside this function include `core::internal::LoopResult` and `core::internal::require_implicit`.

#### core::metaprogramming::TypeEqual

A trait used to disable implementations based on the types of generic arguments, primarily for enabling type-specific optimizations. It assumes `TypeEqualImpl` is its only implementation. Adding `-TypeEqual` as a trait bound restricts availability to cases where T and U are different types.

##### Signature

```rust
pub trait TypeEqual
```

#### deserialize Utility

This utility deserializes a value from a sequence of `felt252`s, returning `None` if deserialization fails.

##### Signature

```rust
fn deserialize(ref serialized: Span) -> Option
```

##### Examples

```rust
let mut serialized: Span = array![1, 0].span();
let value: u256 = Serde::deserialize(ref serialized).unwrap();
assert!(value == 1);
```

---

Sources:

- https://docs.starknet.io/build/corelib/core-felt252_div
- https://docs.starknet.io/build/corelib/core-integer-U128MulGuarantee
- https://docs.starknet.io/build/corelib/core-integer-i64_diff
- https://docs.starknet.io/build/corelib/core-integer-i8_diff
- https://docs.starknet.io/build/corelib/core-integer-u128_byte_reverse
- https://docs.starknet.io/build/corelib/core-integer-u32_sqrt
- https://docs.starknet.io/build/corelib/core-internal-bounded_int-bounded_int_sub
- https://docs.starknet.io/build/corelib/core-internal-bounded_int-downcast
- https://docs.starknet.io/build/corelib/core-qm31-m31_ops
- https://docs.starknet.io/build/corelib/core-qm31-m31_ops-m31_mul
- https://docs.starknet.io/build/corelib/core-qm31-m31_ops-m31_sub
- https://docs.starknet.io/build/corelib/core-qm31-qm31
- https://docs.starknet.io/build/corelib/core-qm31-qm31_const
- https://docs.starknet.io/build/corelib/core-serde-into_felt252_based

---

---

Sources:

- https://docs.starknet.io/build/corelib/core-felt252_div

---

### Felt252 Arithmetic

#### core::felt252_div

This function performs division on `felt252` values within Cairo’s finite field. The result `n` satisfies the equation $n \cdot \text{rhs} \equiv \text{lhs} \pmod P$, where $P$ is the `felt252` prime.

##### Signature

```rust
pub extern fn felt252_div(lhs: felt252, rhs: NonZero) -> felt252 nopanic;
```

##### Examples

Division where the remainder is zero behaves like integer division:

```rust
use core::felt252_div;

// Division with 0 remainder works the same way as integer division.
assert!(felt252_div(4, 2) == 2);
```

Division with a non-zero remainder yields a specific field element:

```rust
// Division with non 0 remainder returns a field element n where n * 3 ≡ 4 (mod P)
assert!(felt252_div(4, 3) ==
1206167596222043737899107594365023368541035738443865566657697352045290673495);
```

---

Sources:

- https://docs.starknet.io/build/corelib/core-integer-i64_diff
- https://docs.starknet.io/build/corelib/core-integer-u128_byte_reverse
- https://docs.starknet.io/build/corelib/core-integer-u32_sqrt

---

# Standard Integer Operations

### core::integer::i64_diff

If `lhs` >= `rhs`, this function returns `Ok(lhs - rhs)`; otherwise, it returns `Err(2**64 + lhs - rhs)`.

#### Signature

```rust
pub extern fn i64_diff(lhs: i64, rhs: i64) -> Result implicits(RangeCheck) nopanic;
```

### core::integer::u128_byte_reverse

This function reverses the bytes of a `u128` input.

#### Signature

```rust
pub extern fn u128_byte_reverse(input: u128) -> u128 implicits(Bitwise) nopanic;
```

### core::integer::u32_sqrt

This function calculates the square root of a `u32` value, returning a `u16`.

#### Signature

```rust
pub extern fn u32_sqrt(value: u32) -> u16 implicits(RangeCheck) nopanic;
```

---

Sources:

- https://docs.starknet.io/build/corelib/core-integer-U128MulGuarantee
- https://docs.starknet.io/build/corelib/core-integer-i8_diff
- https://docs.starknet.io/build/corelib/core-internal-bounded_int-bounded_int_sub
- https://docs.starknet.io/build/corelib/core-internal-bounded_int-downcast

---

````markdown
### Bounded Integer Handling

#### core::integer::i8_diff

If `lhs` is greater than or equal to `rhs`, it returns `Ok(lhs - rhs)`; otherwise, it returns `Err(2**8 + lhs - rhs)`.

##### Signature

```rust
pub extern fn i8_diff(lhs: i8, rhs: i8) -> Result implicits(RangeCheck) nopanic;
```
````

#### core::internal::bounded_int::bounded_int_sub

Performs subtraction on bounded integers.

##### Signature

```rust
extern fn bounded_int_sub(lhs: Lhs, rhs: Rhs) -> Result nopanic;
```

#### core::internal::bounded_int::downcast

Downcasts a value from `FromType` to `ToType`. This conversion may fail. Using incorrect types results in a compiler panic during the Sierra stage.

##### Signature

```rust
pub extern fn downcast(x: FromType) -> Option implicits(RangeCheck) nopanic;
```

````

---

Sources:

- https://docs.starknet.io/build/corelib/core-qm31-m31_ops
- https://docs.starknet.io/build/corelib/core-qm31-m31_ops-m31_sub

---

### M31 Field Operations

The `core::qm31::m31_ops` module provides additional `m31` operations based on the `qm31` opcode for specific implementations.

#### Extern Functions Overview

The following external functions are available for performing arithmetic on `m31` values within the field:

| Function | Description |
| :--- | :--- |
| `m31_add` | Addition of `m31`s in field. |
| `m31_div` | Division of `m31` s in field. |
| `m31_mul` | Multiplication of `m31` s in field. |
| `m31_sub` | Subtraction of `m31` s in field. |

#### Subtraction Operation (`m31_sub`)

This function handles the subtraction of two `m31` values in the field.

##### Signature

```rust
extern fn m31_sub(a: BoundedInt, b: BoundedInt) -> BoundedInt nopanic;
````

---

Sources:

- https://docs.starknet.io/build/corelib/core-qm31-m31_ops-m31_mul
- https://docs.starknet.io/build/corelib/core-qm31-qm31
- https://docs.starknet.io/build/corelib/core-qm31-qm31_const

---

## QM31 Field Structures

### QM31 Type Definition

The `qm31` type defines an extension field over 4 `m31`s.

```
pub extern type qm31;
```

### M31 Multiplication Operation

This operation handles the multiplication of two `m31` values within the field.

#### Signature for `m31_mul`

```
extern fn m31_mul(a: BoundedInt, b: BoundedInt) -> BoundedInt nopanic;
```

### QM31 Constant Creation

This function returns a `qm31` instance given its values as constants.

#### Signature for `qm31_const`

```
pub extern fn qm31_const() -> qm31 nopanic;
```

---

Sources:

- https://docs.starknet.io/build/corelib/core-serde-into_felt252_based

---

### Serialization Utilities

#### Core Serde Utilities

The Starknet documentation references several components related to serialization:

- `core::serde::into_felt252_based`
- `core::serde::Serde`

Additionally, a related constant is noted:

- `core::qm31::qm31_const`

---

Sources:

- https://docs.starknet.io/build/corelib/core-starknet-testing-cheatcode
- https://docs.starknet.io/build/corelib/core-starknet-testing-pop_l2_to_l1_message
- https://docs.starknet.io/build/corelib/core-starknet-testing-pop_log
- https://docs.starknet.io/build/corelib/core-starknet-testing-pop_log_raw
- https://docs.starknet.io/build/corelib/core-starknet-testing-set_account_contract_address
- https://docs.starknet.io/build/corelib/core-starknet-testing-set_block_number
- https://docs.starknet.io/build/corelib/core-starknet-testing-set_block_timestamp
- https://docs.starknet.io/build/corelib/core-starknet-testing-set_caller_address
- https://docs.starknet.io/build/corelib/core-starknet-testing-set_contract_address
- https://docs.starknet.io/build/corelib/core-starknet-testing-set_max_fee
- https://docs.starknet.io/build/corelib/core-starknet-testing-set_nonce
- https://docs.starknet.io/build/corelib/core-starknet-testing-set_sequencer_address
- https://docs.starknet.io/build/corelib/core-starknet-testing-set_signature
- https://docs.starknet.io/build/corelib/core-starknet-testing-set_transaction_hash
- https://docs.starknet.io/build/corelib/core-starknet-testing-set_version
- https://docs.starknet.io/build/corelib/core-testing-get_available_gas
- https://docs.starknet.io/build/corelib/core-testing-get_unspent_gas

---

---

Sources:

- https://docs.starknet.io/build/corelib/core-starknet-testing-cheatcode
- https://docs.starknet.io/build/corelib/core-starknet-testing-set_max_fee

---

## Core Testing Infrastructure Setup

### `core::starknet::testing::cheatcode`

This general cheatcode function simplifies the implementation of Starknet testing functions and serves as the base function used by testing utilities to interact with the test environment. External users can implement custom cheatcodes by injecting a custom `CairoHintProcessor` in the runner.

#### Signature

```rust
pub extern fn cheatcode(input: Span) -> Span nopanic;
```

#### Arguments

- `selector`: The cheatcode identifier.
- `input`: Input parameters for the cheatcode.

#### Returns

- A span containing the cheatcode’s output.

### `core::starknet::testing::set_max_fee`

This function sets the transaction max fee.

#### Signature

```rust
pub fn set_max_fee(fee: u128)
```

#### Arguments

- `fee`: The max fee to set.

After a call to `set_max_fee`, `starknet::get_execution_info().tx_info.max_fee` will return the set value.

---

Sources:

- https://docs.starknet.io/build/corelib/core-starknet-testing-set_account_contract_address
- https://docs.starknet.io/build/corelib/core-starknet-testing-set_block_number
- https://docs.starknet.io/build/corelib/core-starknet-testing-set_block_timestamp
- https://docs.starknet.io/build/corelib/core-starknet-testing-set_caller_address
- https://docs.starknet.io/build/corelib/core-starknet-testing-set_contract_address
- https://docs.starknet.io/build/corelib/core-starknet-testing-set_nonce
- https://docs.starknet.io/build/corelib/core-starknet-testing-set_sequencer_address
- https://docs.starknet.io/build/corelib/core-starknet-testing-set_signature
- https://docs.starknet.io/build/corelib/core-starknet-testing-set_transaction_hash
- https://docs.starknet.io/build/corelib/core-starknet-testing-set_version

---

### State and Context Setting Utilities

#### `core::starknet::testing::set_account_contract_address`

Sets the account contract address. After calling this function, `starknet::get_execution_info().tx_info.account_contract_address` will return the set value.

##### Signature

```rust
pub fn set_account_contract_address(address: ContractAddress)
```

#### `core::starknet::testing::set_block_number`

Sets the block number to the provided value. After calling this function, `starknet::get_execution_info().block_info.block_number` will return the set value.

##### Signature

```rust
pub fn set_block_number(block_number: u64)
```

#### `core::starknet::testing::set_block_timestamp`

Sets the block timestamp to the provided value. After calling this function, `starknet::get_execution_info().block_info.block_timestamp` will return the set value.

##### Signature

```rust
pub fn set_block_timestamp(block_timestamp: u64)
```

#### `core::starknet::testing::set_caller_address`

Sets the caller address to the provided value. After calling this function, `starknet::get_execution_info().caller_address` will return the set value.

##### Signature

```rust
pub fn set_caller_address(address: ContractAddress)
```

#### `core::starknet::testing::set_contract_address`

Sets the contract address to the provided value. After calling this function, `starknet::get_execution_info().contract_address` will return the set value.

##### Signature

```rust
pub fn set_contract_address(address: ContractAddress)
```

#### `core::starknet::testing::set_nonce`

Sets the transaction nonce. After calling this function, `starknet::get_execution_info().tx_info.nonce` will return the set value.

##### Signature

```rust
pub fn set_nonce(nonce: felt252)
```

#### `core::starknet::testing::set_sequencer_address`

Sets the sequencer address to the provided value. After calling this function, `starknet::get_execution_info().block_info.sequencer_address` will return the set value.

##### Signature

```rust
pub fn set_sequencer_address(address: ContractAddress)
```

#### `core::starknet::testing::set_signature`

Sets the transaction signature. After calling this function, `starknet::get_execution_info().tx_info.signature` will return the set value.

##### Signature

```rust
pub fn set_signature(signature: Span)
```

#### `core::starknet::testing::set_transaction_hash`

Sets the transaction hash. After calling this function, `starknet::get_execution_info().tx_info.transaction_hash` will return the set value.

##### Signature

```rust
pub fn set_transaction_hash(hash: felt252)
```

#### `core::starknet::testing::set_version`

Sets the version to the provided value. After calling this function, `starknet::get_execution_info().tx_info.version` will return the set value.

##### Signature

```rust
pub fn set_version(version: felt252)
```

---

Sources:

- https://docs.starknet.io/build/corelib/core-starknet-testing-pop_l2_to_l1_message
- https://docs.starknet.io/build/corelib/core-starknet-testing-pop_log
- https://docs.starknet.io/build/corelib/core-starknet-testing-pop_log_raw

---

### Log and Message Retrieval

#### `core::starknet::testing::pop_l2_to_l1_message`

This function pops the earliest unpopped L2 to L1 message for the specified contract address. It can be called multiple times to retrieve multiple messages.

##### Signature

```rust
pub fn pop_l2_to_l1_message(address: ContractAddress) -> Option<(felt252, Span)>
```

##### Arguments

- `address`: The contract address from which to pop an L2-L1 message.
- The returned value is a tuple containing the L1 address (`felt252`) and the message data (`Span`).

#### `core::starknet::testing::pop_log`

This function pops the earliest unpopped logged event for the contract, deserialized into the requested type. It should be used when the event type is known. It may be called repeatedly until `None` is returned, indicating all events have been popped.

##### Signature

```rust
pub fn pop_log<T: starknet::Event>(address: ContractAddress) -> Option<T>
```

##### Arguments

- `address`: The contract address from which to pop an event.

##### Examples

```rust
#[starknet::contract]
mod contract {
   #[event]
   #[derive(Copy, Drop, Debug, PartialEq, starknet::Event)]
   pub enum Event {
      Event1: felt252,
      Event2: u128,
   }
   // ... omitted contract body
}

#[test]
fn test_event() {
    let contract_address = somehow_get_contract_address();
    call_code_causing_events(contract_address);
    assert_eq!(
        starknet::testing::pop_log(contract_address), Some(contract::Event::Event1(42))
    );
    assert_eq!(
        starknet::testing::pop_log(contract_address), Some(contract::Event::Event2(41))
    );
    assert_eq!(
        starknet::testing::pop_log(contract_address), Some(contract::Event::Event1(40))
    );
    assert_eq!(starknet::testing::pop_log_raw(contract_address), None);
}
```

#### `core::starknet::testing::pop_log_raw`

This function pops the earliest unpopped logged event for the contract as raw data.

##### Signature

```rust
pub fn pop_log_raw(address: ContractAddress) -> Option<(Span, Span)>
```

##### Arguments

- `address`: The contract address from which to pop an event.
- The value is returned as a tuple of two spans: the first for the keys and the second for the data.
- If called until `None` is returned, all events have been popped.

---

Sources:

- https://docs.starknet.io/build/corelib/core-testing-get_available_gas
- https://docs.starknet.io/build/corelib/core-testing-get_unspent_gas

---

### Gas Utilities

#### `core::testing::get_available_gas`

This function returns the amount of gas available in the `GasBuiltin`. It is useful for asserting gas consumption. The returned value is only exact immediately before calls to `withdraw_gas`.

##### Example Usage

```rust
use core::testing::get_available_gas;

fn gas_heavy_function() {
    // ... some gas-intensive code
}

fn test_gas_consumption() {
    let gas_before = get_available_gas();
    // Making sure `gas_before` is exact.
    core::gas::withdraw_gas().unwrap();

    gas_heavy_function();

    let gas_after = get_available_gas();
    // Making sure `gas_after` is exact
    core::gas::withdraw_gas().unwrap();

    assert!(gas_after - gas_before  u128 implicits(GasBuiltin) nopanic;
}
```

#### `core::testing::get_unspent_gas`

This function returns the amount of gas available in the `GasBuiltin`, along with the amount of gas unused in the local wallet. It is useful for asserting gas usage. Note that this function call costs exactly `2300` gas, which might need to be ignored in calculations.

##### Example Usage

```rust
use core::testing::get_unspent_gas;

fn gas_heavy_function() {
    // ... some gas-intensive code
}

fn test_gas_consumption() {
    let gas_before = get_unspent_gas();
    gas_heavy_function();
    let gas_after = get_unspent_gas();
    assert!(gas_after - gas_before  u128 implicits(GasBuiltin) nopanic;
```
