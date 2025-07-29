# cairo-docs Documentation Summary

Core Data Structures

Core Data Structures: Arrays and Spans

# Core Data Structures: Arrays and Spans

Cairo provides two primary contiguous collection types: `Array<T>` and `Span<T>`.

## Array<T>

An `Array<T>` is a collection of elements of the same type that are contiguous in memory. It offers O(1) indexing, push, and pop operations (from the front). Mutations are restricted to appending to the end or popping from the front.

Arrays can be created using `ArrayTrait::new()` or the `array!` macro:

```cairo
// Using ArrayTrait::new()
let arr: Array<usize> = ArrayTrait::new();

// Using the array! macro
let arr: Array<usize> = array![];
let arr: Array<usize> = array![1, 2, 3, 4, 5];
```

### Array Trait Functions

- **`new<T>() -> Array<T>`**: Constructs a new, empty `Array<T>`.
  ```cairo
  let arr: Array<u32> = ArrayTrait::new();
  let arr = ArrayTrait::<u128>::new();
  ```
- **`append<T>(ref self: Array<T>, value: T)`**: Adds a value of type `T` to the end of the array.
  ```cairo
  let mut arr: Array<u8> = array![1, 2];
  arr.append(3);
  assert!(arr == array![1, 2, 3]);
  ```
- **`append_span<T, T, +Clone<T>, +Drop<T>>(ref self: Array<T>, span: Span<T>)`**: Adds a span to the end of the array.
  ```cairo
  let mut arr: Array<u8> = array![];
  arr.append_span(array![1, 2, 3].span());
  assert!(arr == array![1, 2, 3]);
  ```
- **`pop_front<T, T>() -> Option<T>`**: Pops a value from the front of the array, returning `Some(value)` if not empty, `None` otherwise.
  ```cairo
  let mut arr = array![2, 3, 4];
  assert!(arr.pop_front() == Some(2));
  ```
- **`pop_front_consume<T, T>(self: Array<T>) -> Option<(Array<T>, T)>`**: Pops a value from the front, returning the remaining array and the value.
  ```cairo
  let arr = array![2, 3, 4];
  assert!(arr.pop_front_consume() == Some((array![3, 4], 2)));
  ```
- **`get<T, T>(self: @Array<T>, index: u32) -> Option<Box<@T>>`**: Returns a snapshot of the element at the given index if it exists.
  ```cairo
  let arr = array![2, 3, 4];
  assert!(arr.get(1).unwrap().unbox() == @3);
  ```
- **`at<T, T>(self: @Array<T>, index: u32) -> @T`**: Returns a snapshot of the element at the given index. Panics if the index is out of bounds.
  ```cairo
  let mut arr: Array<usize> = array![3,4,5,6];
  assert!(arr.at(1) == @4);
  ```
- **`len<T, T>(self: @Array<T>) -> u32`**: Returns the length of the array.
  ```cairo
  let arr = array![2, 3, 4];
  assert!(arr.len() == 3);
  ```
- **`is_empty<T, T>(self: @Array<T>) -> bool`**: Returns `true` if the array is empty, `false` otherwise.
  ```cairo
  let mut arr = array![];
  assert!(arr.is_empty());
  ```
- **`span<T, T>(snapshot: @Array<T>) -> Span<T>`**: Returns a span of the array.
  ```cairo
  let arr: Array<u8> = array![1, 2, 3];
  let span: Span<u8> = arr.span();
  ```

## Span<T>

A `Span<T>` is a view into a contiguous collection of the same type, like an `Array`. It holds a snapshot of an array and implements `Copy` and `Drop`.

```cairo
pub struct Span<T> {
    pub(crate) snapshot: Array<T>,
}
```

### Span Indexing

Spans implement `IndexView` for indexing:

```cairo
// Using the index operator
let span: @Span<u8> = @array![1, 2, 3].span();
let element: @u8 = span[0];
assert!(element == @1);
```

### Span Trait Functions

- **`pop_front<T, T>(ref self: Span<T>) -> Option<@T>`**: Pops a value from the front of the span.
  ```cairo
  let mut span = array![1, 2, 3].span();
  assert!(span.pop_front() == Some(@1));
  ```
- **`pop_back<T, T>(ref self: Span<T>) -> Option<@T>`**: Pops a value from the back of the span.
  ```cairo
  let mut span = array![1, 2, 3].span();
  assert!(span.pop_back() == Some(@3));
  ```
- **`multi_pop_front<T, T, SIZE>(ref self: Span<T>) -> Option<Box<[T; SIZE]>>`**: Pops multiple values from the front.
  ```cairo
  let mut span = array![1, 2, 3].span();
  let result = *(span.multi_pop_front::<2>().unwrap());
  let unboxed_result = result.unbox();
  assert!(unboxed_result == [1, 2]);
  ```
- **`multi_pop_back<T, T, SIZE>(ref self: Span<T>) -> Option<Box<[T; SIZE]>>`**: Pops multiple values from the back.
  ```cairo
  let mut span = array![1, 2, 3].span();
  let result = *(span.multi_pop_back::<2>().unwrap());
  let unboxed_result = result.unbox();
  assert!(unboxed_result == [2, 3]);
  ```
- **`get<T, T>(self: Span<T>, index: u32) -> Option<Box<@T>>`**: Returns a snapshot of the element at the given index if it exists.
  ```cairo
  let span = array![2, 3, 4];
  assert!(span.get(1).unwrap().unbox() == @3);
  ```
- **`at<T, T>(self: Span<T>, index: u32) -> @T`**: Returns a snapshot of the element at the given index. Panics if the index is out of bounds.
  ```cairo
  let span = array![2, 3, 4].span();
  assert!(span.at(1) == @3);
  ```
- **`slice<T, T>(self: Span<T>, start: u32, length: u32) -> Span<T>`**: Returns a new span from the specified start index and length.
  ```cairo
  let span = array![1, 2, 3].span();
  assert!(span.slice(1, 2) == array![2, 3].span());
  ```
- **`len<T, T>(self: Span<T>) -> u32`**: Returns the length of the span.
  ```cairo
  let span = array![2, 3, 4].span();
  assert!(span.len() == 3);
  ```
- **`is_empty<T, T>(self: Span<T>) -> bool`**: Returns `true` if the span is empty, `false` otherwise.
  ```cairo
  let span: Span<felt252> = array![].span();
  assert!(span.is_empty());
  ```

## ToSpanTrait<C, T>

This trait converts a data structure into a span of its data.

- **`span<C, T, C, T>(self: @C) -> Span<T>`**: Returns a span pointing to the data in the input.
  ```cairo
  fn span<C, T, C, T>(self: @C) -> Span<T>
  ```

Core Data Structures: Boxes

# Box

`Box<T>` is a smart pointer that allows for:

- Storing values of arbitrary size while maintaining a fixed-size pointer.
- Enabling recursive types that would otherwise have infinite size.
- Moving large data structures efficiently by passing pointers instead of copying values.

### Creating and Unboxing

You can create a new box using `BoxTrait::new` and retrieve the wrapped value using `unbox`.

```cairo
let boxed = BoxTrait::new(42);
let unboxed = boxed.unbox();
```

### Working with Large Structures

`Box<T>` is useful for managing larger data structures.

```cairo
let large_array = array![1, 2, 3, 4, 5];
let boxed_array = BoxTrait::new(large_array);
```

### Recursive Data Structures

`Box<T>` enables the creation of recursive data structures.

```cairo
#[derive(Copy, Drop, Debug)]
enum BinaryTree {
    Leaf: u32,
    Node: (u32, Box<BinaryTree>, Box<BinaryTree>)
}

let leaf = BinaryTree::Leaf(1);
let node = BinaryTree::Node((2, BoxTrait::new(leaf), BoxTrait::new(leaf)));
println!("{:?}", node);
```

### `as_snapshot`

The `as_snapshot` method converts a snapshot of a `Box` into a `Box` of a snapshot, which is useful for non-copyable structures.

```cairo
let snap_boxed_arr = @BoxTraits::new(array![1, 2, 3]);
let boxed_snap_arr = snap_boxed_arr.as_snapshot();
let snap_arr = boxed_snap_arr.unbox();
```

The function signature is:

<pre><code class="language-cairo">fn as_snapshot&lt;T, T&gt;(self: @Box&lt;T&gt;) -&gt; <a href="core-box-Box.html">Box&lt;@T&gt;</a></code></pre>

Core Data Structures: ByteArrays

# Core Data Structures: ByteArrays

`ByteArray` is a data structure designed to handle sequences of bytes efficiently. It combines an `Array` of `bytes31` for full words and a `felt252` for partial words, optimizing for both space and performance.

## BYTE_ARRAY_MAGIC

A magic constant used for identifying the serialization of `ByteArray` variables. It's a `felt252` value that, when present in an array of `felt252`, indicates that a serialized `ByteArray` follows.

```cairo
pub const BYTE_ARRAY_MAGIC: felt252 = 1997209042069643135709344952807065910992472029923670688473712229447419591075;
```

## ByteArray

A struct representing a byte array.

```cairo
#[derive(Drop, Clone, PartialEq, Serde, Default)]
pub struct ByteArray {
    pub(crate) data: Array<bytes31>,
    pub(crate) pending_word: felt252,
    pub(crate) pending_word_len: u32,
}
```

## ByteArrayImpl

Provides functions associated with the `ByteArray` type.

### append_word

Appends a single word of `len` bytes to the end of the `ByteArray`. Assumes `word` can be converted to `bytes31` with `len` bytes and `len <= BYTES_IN_BYTES31`.

```cairo
fn append_word(ref self: ByteArray, word: felt252, len: u32)
```

### append

Appends another `ByteArray` to the end of the current one.

```cairo
fn append(ref self: ByteArray, other: ByteArray)
```

### concat

Concatenates two `ByteArray` instances and returns a new `ByteArray`.

```cairo
fn concat(left: ByteArray, right: ByteArray) -> ByteArray
```

### append_byte

Appends a single byte to the end of the `ByteArray`.

```cairo
fn append_byte(ref self: ByteArray, byte: u8)
```

### len

Returns the length of the `ByteArray`.

```cairo
fn len(self: ByteArray) -> u32
```

### at

Returns an `Option<u8>` containing the byte at the specified index, or `None` if the index is out of bounds.

```cairo
fn at(self: ByteArray, index: u32) -> Option<u8>
```

### rev

Returns a new `ByteArray` with the elements in reverse order.

```cairo
fn rev(self: ByteArray) -> ByteArray
```

### append_word_rev

Appends the reverse of a given word to the end of the `ByteArray`. Assumes `len < 31` and `word` is validly convertible to `bytes31` of length `len`.

```cairo
fn append_word_rev(ref self: ByteArray, word: felt252, len: u32)
```

## ByteArrayTrait

Defines the interface for `ByteArray` operations.

### append_word

Appends a single word of `len` bytes to the end of the `ByteArray`.

```cairo
fn append_word(ref self: ByteArray, word: felt252, len: u32)
```

### append

Appends a `ByteArray` to the end of another `ByteArray`.

```cairo
fn append(ref self: ByteArray, other: ByteArray)
```

### concat

Concatenates two `ByteArray` instances and returns the result.

```cairo
fn concat(left: ByteArray, right: ByteArray) -> ByteArray
```

### append_byte

Appends a single byte to the end of the `ByteArray`.

```cairo
fn append_byte(ref self: ByteArray, byte: u8)
```

### len

Returns the length of the `ByteArray`.

```cairo
fn len(self: ByteArray) -> u32
```

### at

Returns an `Option<u8>` containing the byte at the specified index, or `None` if the index is out of bounds.

```cairo
fn at(self: ByteArray, index: u32) -> Option<u8>
```

### rev

Returns a new `ByteArray` with the elements in reverse order.

```cairo
fn rev(self: ByteArray) -> ByteArray
```

### append_word_rev

Appends the reverse of a given word to the end of the `ByteArray`. Assumes `len < 31` and `word` is validly convertible to `bytes31` of length `len`.

```cairo
fn append_word_rev(ref self: ByteArray, word: felt252, len: u32)
```

## ByteArrayIter

An iterator struct over a `ByteArray`.

```cairo
#[derive(Drop, Clone)]
pub struct ByteArrayIter {
    ba: ByteArray,
    current_index: IntRange<u32>,
}
```

## bytes31

A fixed-size type representing 31 bytes.

```cairo
pub extern type bytes31;
```

### Bytes31Impl::at

Returns the byte at the given index (LSB's index is 0). Assumes `index < BYTES_IN_BYTES31`.

```cairo
fn at(self: bytes31, index: u32) -> u8
```

### Bytes31Trait::at

Returns the byte at the given index (LSB's index is 0). Assumes `index < BYTES_IN_BYTES31`.

```cairo
fn at(self: bytes31, index: u32) -> u8
```

## Usage Examples

Creating a `ByteArray` from a string literal:

```cairo
let s = "Hello";
```

Using the `format!` macro:

```cairo
let max_tps:u16 = 850;
let s = format!("Starknet's max TPS is: {}", max_tps);
```

Appending bytes:

```cairo
let mut ba: ByteArray = "";
ba.append_byte(0x41); // Appending 'A'
```

Concatenating `ByteArray` instances:

```cairo
let s = "Hello";
let message = s + " world!";
```

Accessing bytes by index:

```cairo
let mut ba: ByteArray = "ABC";
let first_byte = ba[0];
assert!(first_byte == 0x41);
```

Core Data Structures: Dictionaries

# Felt252Dict

A dictionary-like data structure that maps `felt252` keys to values of any type. It provides efficient key-value storage with operations for inserting, retrieving, and updating values. Each operation creates a new entry that can be validated through a process called squashing.

## Creation

A new dictionary can be created using the `Default::default` method:

```cairo
use core::dict::Felt252Dict;

let mut dict: Felt252Dict<u8> = Default::default();
```

## Felt252DictTrait

This trait provides basic functionality for the `Felt252Dict` type.

### insert

Inserts the given value for the given key.

```cairo
use core::dict::Felt252Dict;

let mut dict: Felt252Dict<u8> = Default::default();
dict.insert(0, 10);
```

### get

Returns the value stored at the given key. If no value was previously inserted at this key, returns the default value for type T.

```cairo
use core::dict::Felt252Dict;

let mut dict: Felt252Dict<u8> = Default::default();
dict.insert(0, 10);
let value = dict.get(0);
assert!(value == 10);
```

### entry

Retrieves the last entry for a certain key. This method takes ownership of the dictionary and returns the entry to update, as well as the previous value at the given key.

```cairo
use core::dict::Felt252Dict;

let mut dict: Felt252Dict<u8> = Default::default();
dict.insert(0, 10);
let (entry, prev_value) = dict.entry(0);
assert!(prev_value == 10);
```

### squash

Squashes a dictionary and returns the associated `SquashedFelt252Dict`.

```cairo
use core::dict::Felt252Dict;

let mut dict: Felt252Dict<u8> = Default::default();
dict.insert(0, 10);
let squashed_dict = dict.squash();
```

# Felt252DictEntry

An intermediate type returned after calling the `entry` method. It consumes ownership of the dictionary, ensuring it cannot be mutated until the entry is finalized.

```cairo
pub extern type Felt252DictEntry<T>;
```

## Felt252DictEntryTrait

This trait provides basic functionality for the `Felt252DictEntry` type.

### finalize

Finalizes the changes made to a dictionary entry and returns ownership of the dictionary. This method does not require the dictionary's value type to be copyable.

```cairo
use core::dict::Felt252DictEntryTrait;
use core::dict::Felt252Dict;
use core::array::Array;
use core::nullable::NullableTrait;

// Create a dictionary that stores arrays
let mut dict: Felt252Dict<Nullable<Array<felt252>>> = Default::default();

let a = array![1, 2, 3];
dict.insert(0, NullableTrait::new(a));

let (entry, prev_value) = dict.entry(0);
let new_value = NullableTrait::new(array![4, 5, 6]);
dict = entry.finalize(new_value);
assert!(prev_value == a);
assert!(dict.get(0) == new_value);
```

# SquashedFelt252Dict

A dictionary in a squashed state, which means it cannot be mutated anymore.

```cairo
pub extern type SquashedFelt252Dict<T>;
```

## SquashedFelt252DictTrait

This trait provides functionality for `SquashedFelt252Dict`.

### into_entries

Returns an array of `(key, first_value, last_value)` tuples. The `first_value` is always 0.

```cairo
let squashed_dict = dict.squash();
let entries = squashed_dict.entries();
```

Core Data Structures: Options

# Core Data Structures: Options

Optional values are represented by the `Option<T>` enum, which can either be `Some(value)` or `None`. This is a common pattern in Cairo for handling cases where a value might be absent, such as initial values, partial functions, simple error reporting, optional struct fields, or optional function arguments.

```cairo
// Example of a function returning an Option
fn divide(numerator: u64, denominator: u64) -> Option<u64> {
    if denominator == 0 {
        None
    } else {
        Some(numerator / denominator)
    }
}

// Pattern matching to handle Option
let result = divide(2, 3);
match result {
    Some(x) => println!("Result: {x}"),
    None    => println!("Cannot divide by 0"),
}
```

## Option Variants

### `Some(T)`

Represents the presence of a value of type `T`.

```cairo
Some: T
```

### `None`

Represents the absence of a value.

```cairo
None
```

## OptionRev

`OptionRev` is similar to `Option`, but with the variant order reversed. It's used for efficiency in some libfuncs.

```cairo
pub enum OptionRev {
    None,
    Some: T,
}
```

### `OptionRev::None`

```cairo
None
```

### `OptionRev::Some(T)`

```cairo
Some: T
```

## The Question Mark Operator (`?`)

The `?` operator simplifies handling `Option` types by propagating `None` values early out of functions that return `Option`.

```cairo
// Without '?'
fn add_last_numbers_verbose(mut array: Array<u32>) -> Option<u32> {
    let a = array.pop_front();
    let b = array.pop_front();
    match (a, b) {
        (Some(x), Some(y)) => Some(x + y),
        _ => None,
    }
}

// With '?'
fn add_last_numbers_concise(mut array: Array<u32>) -> Option<u32> {
    Some(array.pop_front()? + array.pop_front()?)
}
```

## Method Overview

### Querying the Variant

- `is_some()`: Returns `true` if the `Option` is `Some`.
- `is_none()`: Returns `true` if the `Option` is `None`.
- `is_some_and(predicate)`: Returns `true` if `Some` and the value matches the predicate.
- `is_none_or(predicate)`: Returns `true` if `None` or the value matches the predicate.

### Extracting the Contained Value

- `expect(message)`: Returns the contained value or panics with a message.
- `unwrap()`: Returns the contained value or panics.
- `unwrap_or(default)`: Returns the contained value or a default value.
- `unwrap_or_default()`: Returns the contained value or the default value of the type `T`.
- `unwrap_or_else(closure)`: Returns the contained value or computes it using a closure.

### Transforming Contained Values

- `map(closure)`: Transforms `Option<T>` to `Option<U>` by applying a closure to the `Some` value.
- `map_or(default, closure)`: Returns a default value or the result of a closure applied to the `Some` value.
- `map_or_else(default_closure, map_closure)`: Returns the result of a default closure or a mapping closure applied to the `Some` value.
- `ok_or(err_value)`: Transforms `Some(v)` to `Ok(v)` and `None` to `Err(err_value)`.
- `ok_or_else(err_closure)`: Transforms `Some(v)` to `Ok(v)` and `None` to `Err(err_value)` computed by a closure.

### Boolean Operators

- `and(other_option)`: Returns `None` if self is `None`, otherwise returns `other_option`.
- `or(other_option)`: Returns `self` if it's `Some`, otherwise returns `other_option`.
- `xor(other_option)`: Returns `Some` if exactly one of `self` or `other_option` is `Some`.
- `and_then(closure)`: Returns `None` if self is `None`, otherwise calls the closure with the value.
- `or_else(closure)`: Returns `self` if it's `Some`, otherwise calls the closure.

### Other Methods

- `take()`: Takes the value out of the option, leaving `None` in its place.
- `filter(predicate)`: Returns `Some(value)` if the predicate is true for the `Some` value, otherwise `None`.
- `flatten()`: Converts `Option<Option<T>>` to `Option<T>`.

```cairo
// Example: map
let maybe_some_string: Option<ByteArray> = Some("Hello, World!");
let maybe_some_len = maybe_some_string.map(|s: ByteArray| s.len()); // maybe_some_len is Some(13)

// Example: unwrap_or
let option_val = Some(123);
assert!(option_val.unwrap_or(456) == 123);
let none_val: Option<u32> = None;
assert!(none_val.unwrap_or(456) == 456);

// Example: ok_or
assert_eq!(Some('foo').ok_or(0), Ok('foo'));
let option: Option<felt252> = None;
assert_eq!(option.ok_or(0), Err(0));

// Example: and_then
use core::num::traits::CheckedMul;
let option: Option<ByteArray> = checked_mul(2_u32, 2_u32)
    .and_then(|v| Some(format!("{}", v))); // option is Some("4")

// Example: filter
let is_even = |n: @u32| -> bool { *n % 2 == 0 };
assert_eq!(Some(4).filter(is_even), Some(4));
assert_eq!(Some(3).filter(is_even), None);

// Example: flatten
let x: Option<Option<u32>> = Some(Some(6));
assert_eq!(Some(6), x.flatten());
```

Core Data Structures: Results

# Core Data Structures: Results

The `Result` type is used for returning and propagating errors. It's an enum with two variants:

- `Ok(T)`: Represents success and contains a value of type `T`.
- `Err(E)`: Represents an error and contains an error value of type `E`.

Functions return `Result` when errors are expected and recoverable.

```cairo
enum Result<T, E> {
   Ok: T,
   Err: E,
}
```

Functions might be defined and used like this:

```cairo
fn parse_version(header: felt252) -> Result<felt252, felt252> {
    match header {
        0 => Ok(0),
        1 => Ok(1),
        _ => Err('invalid version'),
    }
}

let version = parse_version(1);
match version {
    Ok(v) => println!("working with version {}", v),
    Err(e) => println!("error parsing version: {:?}", e)
}
```

## Querying the Variant

- `is_ok`: Returns `true` if the `Result` is `Ok`.
- `is_err`: Returns `true` if the `Result` is `Err`.

## Extracting Contained Values

These methods extract the contained value when the `Result` is `Ok`:

- `expect(err: felt252)`: Returns the contained `Ok` value, panicking with a provided message if it's `Err`.
  ```cairo
  let result: Result<felt252, felt252> = Ok(123);
  assert!(result.expect('no value') == 123);
  ```
- `unwrap()`: Returns the contained `Ok` value, panicking with a generic message if it's `Err`.
  ```cairo
  let result: Result<felt252, felt252> = Ok(123);
  assert!(result.unwrap() == 123);
  ```
- `unwrap_or(default: T)`: Returns the contained `Ok` value or a provided default.

  ```cairo
  let result: Result<felt252, felt252> = Ok(123);
  assert!(result.unwrap_or(456) == 123);

  let result: Result<felt252, felt252> = Err('no value');
  assert!(result.unwrap_or(456) == 456);
  ```

- `unwrap_or_default()`: Returns the contained `Ok` value or `Default::<T>::default()`.

  ```cairo
  let result: Result<felt252, felt252> = Ok(123);
  assert!(result.unwrap_or_default() == 123);

  let result: Result<felt252, felt252> = Err('no value');
  assert!(result.unwrap_or_default() == 0);
  ```

- `unwrap_or_else(f)`: Returns the contained `Ok` value or computes it from a closure.
  ```cairo
  assert!(Ok(2).unwrap_or_else(|e: ByteArray| e.len()) == 2);
  assert!(Err("foo").unwrap_or_else(|e: ByteArray| e.len()) == 3);
  ```

These methods extract the contained value when the `Result` is `Err`:

- `expect_err(err: felt252)`: Returns the contained `Err` value, panicking with a provided message if it's `Ok`.
  ```cairo
  let result: Result<felt252, felt252> = Err('no value');
  assert!(result.expect_err('result is ok') == 'no value');
  ```
- `unwrap_err()`: Returns the contained `Err` value, panicking with a generic message if it's `Ok`.
  ```cairo
  let result: Result<felt252, felt252> = Err('no value');
  assert!(result.unwrap_err() == 'no value');
  ```

## Transforming Contained Values

These methods transform `Result` to `Option`:

- `ok()`: Converts `Result<T, E>` into `Option<T>`, mapping `Ok(v)` to `Some(v)` and `Err(e)` to `None`.

  ```cairo
  let x: Result<u32, ByteArray> = Ok(2);
  assert!(x.ok() == Some(2));

  let x: Result<u32, ByteArray> = Err("Nothing here");
  assert!(x.ok().is_none());
  ```

- `err()`: Converts `Result<T, E>` into `Option<E>`, mapping `Ok(v)` to `None` and `Err(e)` to `Some(e)`.

  ```cairo
  let x: Result<u32, ByteArray> = Err("Nothing here");
  assert!(x.err() == Some("Nothing here"));

  let x: Result<u32, ByteArray> = Ok(2);
  assert!(x.err().is_none());
  ```

- `map(f)`: Transforms `Result<T, E>` into `Result<U, E>` by applying the provided function to the contained value of `Ok` and leaving `Err` values unchanged.

  ```cairo
  let inputs: Array<Result<u32, ByteArray>> = array![
      Ok(1), Err("error"), Ok(3), Ok(4),
  ];
  for i in inputs {
      match i.map(|i| i * 2) {
          Ok(x) => println!("{x}"),
          Err(e) => println!("{e}"),
      }
  }
  ```

- `map_err(op)`: Transforms `Result<T, E>` into `Result<T, F>` by applying the provided function to the contained value of `Err` and leaving `Ok` values unchanged.

  ```cairo
  let stringify  = |x: u32| -> ByteArray { format!("error code: {x}") };
  let x: Result<u32, u32> = Ok(2);
  assert!(x.map_err(stringify) == Result::<u32, ByteArray>::Ok(2));

  let x: Result<u32, u32> = Err(13);
  assert!(x.map_err(stringify) == Err("error code: 13"));
  ```

- `map_or(default, f)`: Applies `f` to the contained `Ok` value, or returns `default` if it's `Err`.
- `map_or_else(default, f)`: Applies `f` to the contained `Ok` value, or applies a fallback function to the `Err` value.

## Boolean Operators

These methods treat `Result` as a boolean value (`Ok` as true, `Err` as false):

- `and(other)`: Returns `other` if `self` is `Ok`, otherwise returns `self`'s `Err`.

  ```cairo
  let x: Result<u32, ByteArray> = Ok(2);
  let y: Result<ByteArray, ByteArray> = Err("late error");
  assert!(x.and(y) == Err("late error"));

  let x: Result<u32, ByteArray> = Err("early error");
  let y: Result<ByteArray, ByteArray> = Ok("foo");
  assert!(x.and(y) == Err("early error"));

  let x: Result<u32, ByteArray> = Err("not a 2");
  let y: Result<ByteArray, ByteArray> = Err("late error");
  assert!(x.and(y) == Err("not a 2"));

  let x: Result<u32, ByteArray> = Ok(2);
  let y: Result<ByteArray, ByteArray> = Ok("different result type");
  assert!(x.and(y) == Ok("different result type"));
  ```

- `or(other)`: Returns `self` if `self` is `Ok`, otherwise returns `other`.
- `and_then(op)`: Calls `op` if `self` is `Ok`, otherwise returns `self`'s `Err`.

  ```cairo
  use core::num::traits::CheckedMul;

  fn sq_then_string(x: u32) -> Result<ByteArray, ByteArray> {
      let res = x.checked_mul(x).ok_or("overflowed");
      res.and_then(|v| Ok(format!("{}", v)))
  }

  let x = sq_then_string(4);
  assert!(x == Ok("16"));

  let y = sq_then_string(65536);
  assert!(y == Err("overflowed"));
  ```

- `or_else(op)`: Calls `op` if `self` is `Err`, otherwise returns `self`'s `Ok`.

## The Question Mark Operator (`?`)

The `?` operator simplifies error propagation by automatically returning the `Err` value from a function if encountered, or unwrapping the `Ok` value.

## PanicResult

`PanicResult` is a specialized `Result` type for operations that can trigger a panic.

```cairo
pub enum PanicResult {
    Ok: T,
    Err: (Panic, Array<felt252>),
}
```

### Variants

- `Ok(T)`
- `Err((Panic, Array<felt252>))`

## Panic Function

The `panic` function triggers an immediate panic with provided data and terminates execution.

```cairo
pub extern fn panic(data: Array<felt252>) -> never;
```

Core Data Structures: Boolean Operations

# Core Data Structures: Boolean Operations

The `bool` type in Cairo represents a boolean value, which can be either `true` or `false`.

## `bool` Enum

The `bool` enum has two variants: `False` and `True`.

### Variants

#### `False`

```cairo
False
```

#### `True`

```cairo
True
```

## `BoolTrait`

This trait provides additional functionality for the `bool` type.

### `then_some`

This function returns `Some(t)` if the `bool` is `true`, and `None` otherwise.

**Examples:**

```cairo
use core::boolean::BoolTrait;

let bool_value = true;
let result = bool_value.then_some(42_u8);
assert!(result == Some(42));

let bool_value = false;
let result = bool_value.then_some(42_u8);
assert!(result == None);
```

```cairo
// Example from BoolTrait definition
assert!(false.then_some(0) == None);
assert!(true.then_some(0) == Some(0));
```

## Boolean Operations

Basic boolean operations are supported.

**Examples:**

```cairo
let value = true;
assert!(value == true);
assert!(!value == false);
```

Core Data Structures: Nullable Types

# Core Data Structures: Nullable Types

A wrapper type for handling optional values.
`Nullable<T>` is a wrapper type that can either contain a value stored in a `Box<T>` or be null. It provides a safe way to handle optional values without the risk of dereferencing null pointers. This makes it particularly useful in dictionaries that store complex data structures that don't implement the `Felt252DictValue` trait; instead, they can be wrapped inside a `Nullable`.

## Nullable

A type that can either be null or contain a boxed value.

```cairo
pub extern type Nullable<T>;
```

## NullableTrait

Trait for nullable types.

### new

Creates a new non-null `Nullable` with the given value.

```cairo
fn new<T, T>(value: T) -> Nullable<T>
```

### is_null

Returns `true` if the value is null.

```cairo
fn is_null<T, T>(self: @Nullable<T>) -> bool
```

### deref

Wrapper for `Deref::deref`. Prefer using `Deref::deref` directly. This function exists for backwards compatibility.

```cairo
fn deref<T, T>(nullable: Nullable<T>) -> T
```

### deref_or

Returns the contained value if not null, or returns the provided default value.

```cairo
fn deref_or<T, T, +Drop<T>>(self: Nullable<T>, default: T) -> T
```

### as_snapshot

Creates a new `Nullable` containing a snapshot of the value. This is useful when working with non-copyable types inside a `Nullable`.

```cairo
fn as_snapshot<T, T>(self: @Nullable<T>) -> Nullable<@T>
```

## FromNullableResult

Represents the result of matching a `Nullable` value. Used to safely handle both null and non-null cases when using `match_nullable` on a `Nullable`.

```cairo
pub enum FromNullableResult {
    Null,
    NotNull: Box<T>,
}
```

## Extern functions

### null

Creates a null `Nullable`.

```cairo
pub extern fn null() -> Nullable<T> nopanic;
```

### match_nullable

Matches a `Nullable` value.

```cairo
pub extern fn match_nullable(value: Nullable<T>) -> FromNullableResult<T> nopanic;
```

Core Data Structures: Ranges

### Range

A (half-open) range bounded inclusively below and exclusively above (`start..end`). The range `start..end` contains all values with `start <= x < end`. It is empty if `start >= end`.

#### `contains`

Checks if a given item is within the range.

```cairo
assert!(!(3..5).contains(@2));
assert!( (3..5).contains(@3));
assert!( (3..5).contains(@4));
assert!(!(3..5).contains(@5));

assert!(!(3..3).contains(@3));
assert!(!(3..2).contains(@3));
```

#### `is_empty`

Returns `true` if the range contains no items.

```cairo
assert!(!(3_u8..5_u8).is_empty());
assert!( (3_u8..3_u8).is_empty());
assert!( (3_u8..2_u8).is_empty());
```

Core Data Structures: Gas Management

### Gas Reserve

A `GasReserve` represents a reserve of gas that can be created and utilized.

#### `gas_reserve_create`

Creates a new gas reserve by withdrawing a specified amount from the gas counter. Returns `Some(GasReserve)` if sufficient gas is available, otherwise returns `None`.

```cairo
pub extern fn gas_reserve_create(amount: u128) -> Option<GasReserve> implicits(RangeCheck, GasBuiltin) nopanic;
```

#### `gas_reserve_utilize`

Adds the gas stored in the reserve back to the gas counter, consuming the reserve.

```cairo
pub extern fn gas_reserve_utilize(reserve: GasReserve) implicits(GasBuiltin) nopanic;
```

### Other Gas Management Functions

#### `get_builtin_costs`

Returns the `BuiltinCosts` table used in `withdraw_gas_all`.

```cairo
pub extern fn get_builtin_costs() -> BuiltinCosts nopanic;
```

#### `redeposit_gas`

Returns unused gas into the gas builtin. This is useful when different execution branches consume varying amounts of gas, but the initial gas withdrawal is the same for all.

```cairo
pub extern fn redeposit_gas() implicits(GasBuiltin) nopanic;
```

Core Data Structures: Loop Control

# Core Data Structures: Loop Control

## LoopResult

`LoopResult` is the return type for loops that support early returns.

### Variants

- **Normal**: Represents the normal completion of a loop.
  ```cairo
  Normal: N
  ```
- **EarlyReturn**: Represents an early return from a loop.
  ```cairo
  EarlyReturn: E
  ```

Core Data Structures: Hashing and Cryptography

# Core Data Structures: Hashing and Cryptography

## HashState for Poseidon Hashing

The `HashState` struct maintains the state for a Poseidon hash computation.

```rust
#[derive(Copy, Drop, Debug)]
pub struct HashState {
    pub s0: felt252,
    pub s1: felt252,
    pub s2: felt252,
    pub odd: bool,
}
```

### Members

#### `s0`

The first state element.

```rust
pub s0: felt252
```

#### `s1`

The second state element.

```rust
pub s1: felt252
```

Core Data Structures: Serialization

## Serialization

The `Serde` trait in Cairo allows for the serialization and deserialization of data structures into sequences of `felt252` values.

### `serialize`

Serializes a value into a sequence of `felt252`s.

**Signature:**

```cairo
fn serialize<T, T>(self: @T, ref output: Array<felt252>)
```

**Examples:**

- **Simple Types (u8, u16, u32, u64, u128):** These are serialized into a single `felt252`.
  ```cairo
  let value: u8 = 42;
  let mut output: Array<felt252> = array![];
  value.serialize(ref output);
  assert!(output == array![42]); // Single value
  ```
- **Compound Types (u256):** These may be serialized into multiple `felt252` values.
  ```cairo
  let value: u256 = u256 { low: 1, high: 2 };
  let mut output: Array<felt252> = array![];
  value.serialize(ref output);
  assert!(output == array![1, 2]); // Two `felt252`s: low and high
  ```
  Another example for `u256`:
  ```cairo
  let value: u256 = 1;
  let mut serialized: Array<felt252> = array![];
  value.serialize(ref serialized);
  assert!(serialized == array![1, 0]); // `serialized` contains the [low, high] parts of the `u256` value
  ```

### `deserialize`

Deserializes a value from a sequence of `felt252`s. If the value cannot be deserialized, returns `None`.

**Signature:**

```cairo
fn deserialize(ref serialized: Span<felt252>) -> Option<Point>
```

_(Note: The provided chunk shows a signature for `Point` specifically. The general signature would be `fn deserialize<T>(ref serialized: Span<felt252>) -> Option<T>`)_

**Examples:**

- **Simple Types (u8, u16, u32, u64, u128):**
  ```cairo
  // Assuming a similar serialization structure as above for simple types
  // Example for deserializing a u8:
  // let serialized_data: Span<felt252> = array![42].span();
  // let deserialized_value: Option<u8> = deserialize(ref serialized_data);
  // assert!(deserialized_value == Some(42));
  ```
- **Compound Types (u256):**
  ```cairo
  // Assuming a similar serialization structure as above for u256
  // Example for deserializing a u256:
  // let serialized_data: Span<felt252> = array![1, 2].span();
  // let deserialized_value: Option<u256> = deserialize(ref serialized_data);
  // assert!(deserialized_value == Some(u256 { low: 1, high: 2 }));
  ```

### Implementing `Serde`

#### Using the `Derive` Macro

In most cases, you can use the `#[derive(Serde)]` attribute to automatically generate the implementation for your type:

```cairo
#[derive(Serde)]
struct Point {
    x: u32,
    y: u32
}
```

#### Manual Implementation

Should you need to customize the serialization behavior for a type in a way that derive does not support, you can implement the `Serde` trait yourself:

```cairo
impl PointSerde of Serde<Point> {
    fn serialize(self: @Point, ref output: Array<felt252>) {
        output.append((*self.x).into());
        output.append((*self.y).into());
    }

    fn deserialize(ref serialized: Span<felt252>) -> Option<Point> {
        let x = (*serialized.pop_front()?).try_into()?;
        let y = (*serialized.pop_front()?).try_into()?;

        Some(Point { x, y })
    }
}
```

Core Data Structures: Starknet Specific Structures

### Map

A persistent key-value store in contract storage. This type cannot be instantiated as it is marked with `#[phantom]`.

### Traits

- **StorageMapReadAccess**: Provides direct read access to values in a storage `Map`.
- **StorageMapWriteAccess**: Provides direct write access to values in a storage `Map`, enabling direct storage of values at the address of a given key.
- **StoragePathEntry**: Computes storage paths for accessing `Map` entries by combining the variable's base path with the key's hash.

### Modules

- **map**: Implements key-value storage mapping for Starknet contracts.
- **storage_base**: Provides core abstractions for contract storage management, including types and traits for internal storage handling.

Core Data Structures: Basic Types and Utilities

## Core Data Structures: Basic Types and Utilities

### Comparison Utilities (`core::cmp`)

This module provides functions for comparing and ordering values based on the `PartialOrd` trait.

#### `max`

Takes two comparable values `a` and `b` and returns the larger of the two values.

```cairo
use core::cmp::max;

assert!(max(0, 1) == 1);
```

```cairo
pub fn max<T, +PartialOrd<T>, +Drop<T>, +Copy<T>>(a: T, b: T) -> T
```

#### `min`

Takes two comparable values `a` and `b` and returns the smaller of the two values.

```cairo
use core::cmp::min;

assert!(min(0, 1) == 0);
```

```cairo
pub fn min<T, +PartialOrd<T>, +Drop<T>, +Copy<T>>(a: T, b: T) -> T
```

#### `minmax`

Takes two comparable values `a` and `b` and returns a tuple with the smaller value and the greater value.

```cairo
use core::cmp::minmax;

assert!(minmax(0, 1) == (0, 1));
assert!(minmax(1, 0) == (0, 1));
```

```cairo
pub fn minmax<T, +PartialOrd<T>, +Drop<T>, +Copy<T>>(a: T, b: T) -> (T, T)
```

### Integer Types

#### `usize`

An alias for `u32`, commonly used for sizes and counts.

```cairo
pub type usize = u32;
```

### Zeroable Types (`core::zeroable`)

This module deals with types that are guaranteed to be non-zero.

#### `NonZero<T>`

A wrapper type for non-zero values of type `T`. It ensures that the wrapped value is never zero.

```cairo
pub extern type NonZero<T>;
```

Numeric Types and Operations

Introduction to Cairo Numeric Types

### Bounded Trait

The `Bounded` trait, located at `core::num::traits::bounded`, defines minimum and maximum bounds for numeric types. This trait is applicable only to types that support constant values.

#### Constants

- `MIN`: Represents the minimum value for a type `T`.
- `MAX`: Represents the maximum value for a type `T`.

##### Example for MAX

```cairo
use core::num::traits::Bounded;

let max = Bounded::<u8>::MAX;
assert!(max == 255);
```

Unsigned Integer Types and Operations

# Unsigned Integer Types and Operations

Cairo provides several unsigned integer types for various needs in smart contract development.

## Integer Types

The following unsigned integer types are available:

- `u8`: The 8-bit unsigned integer type.
- `u16`: The 16-bit unsigned integer type.
- `u32`: The 32-bit unsigned integer type.
- `u64`: The 64-bit unsigned integer type.
- `u128`: The 128-bit unsigned integer type.
- `u256`: The 256-bit unsigned integer type, composed of two 128-bit parts (`low` and `high`).
- `u512`: A 512-bit unsigned integer type, composed of four 128-bit parts (`limb0`, `limb1`, `limb2`, `limb3`).

## Operations

Integer types support a range of operations:

### Basic Arithmetic

- Addition (`Add`), Subtraction (`Sub`), Multiplication (`Mul`), Division (`Div`), Remainder (`Rem`), and `DivRem`.

### Bitwise Operations

- Bitwise AND (`BitAnd`), OR (`BitOr`), XOR (`BitXor`), and NOT (`BitNot`).

### Comparison

- Equality (`PartialEq`) and Partial Ordering (`PartialOrd`).

### Checked Arithmetic

- `CheckedAdd`, `CheckedSub`, `CheckedMul`: These operations return `None` if an overflow occurs.

### Wrapping Arithmetic

- `WrappingAdd`, `WrappingSub`, `WrappingMul`: These operations wrap around on overflow.

### Overflowing Arithmetic

- `OverflowingAdd`, `OverflowingSub`, `OverflowingMul`: These operations return the result and a boolean indicating whether an overflow occurred.

## Examples

Basic operators:

```cairo
let a: u8 = 5;
let b: u8 = 10;
assert_eq!(a + b, 15);
assert_eq!(a * b, 50);
assert_eq!(a & b, 0);
assert!(a < b);
```

Checked operations:

```cairo
use core::num::traits::{CheckedAdd, Bounded};

let max: u8 = Bounded::MAX;
assert!(max.checked_add(1_u8).is_none());
```

## Conversions

Integers can be converted between types using:

- `TryInto`: For conversions that may fail (e.g., converting a larger integer to a smaller one where overflow might occur).
- `Into`: For infallible conversions, typically to wider integer types.

Signed Integer Types and Operations

# Signed Integer Types and Operations

This section details the signed integer types available in Cairo and their associated operations.

## i8

The 8-bit signed integer type.

Fully qualified path: [core](./core.md)::[integer](./core-integer.md)::[i8](./core-integer-i8.md)

```cairo
pub extern type i8;
```

### i8_diff

If `lhs` >= `rhs` returns `Ok(lhs - rhs)` else returns `Err(2**8 + lhs - rhs)`.

Fully qualified path: [core](./core.md)::[integer](./core-integer.md)::[i8_diff](./core-integer-i8_diff.md)

```cairo
pub extern fn i8_diff(lhs: i8, rhs: i8) -> Result<u8, u8> implicits(RangeCheck) nopanic;
```

### i8_wide_mul

Fully qualified path: [core](./core.md)::[integer](./core-integer.md)::[i8_wide_mul](./core-integer-i8_wide_mul.md)

```cairo
pub extern fn i8_wide_mul(lhs: i8, rhs: i8) -> i16 nopanic;
```

## i16

The 16-bit signed integer type.

Fully qualified path: [core](./core.md)::[integer](./core-integer.md)::[i16](./core-integer-i16.md)

<pre><code class="language-cairo">pub extern type i16;</code></pre>

### i16_diff

If `lhs` >= `rhs` returns `Ok(lhs - rhs)` else returns `Err(2**16 + lhs - rhs)`.

Fully qualified path: [core](./core.md)::[integer](./core-integer.md)::[i16_diff](./core-integer-i16_diff.md)

<pre><code class="language-cairo">pub extern fn i16_diff(lhs: <a href="core-integer-i16.html">i16</a>, rhs: <a href="core-integer-i16.html">i16</a>) -> <a href="core-result-Result.html">Result&lt;u16, u16&gt;</a> implicits(RangeCheck) nopanic;</code></pre>

### i16_wide_mul

Fully qualified path: [core](./core.md)::[integer](./core-integer.md)::[i16_wide_mul](./core-integer-i16_wide_mul.md)

<pre><code class="language-cairo">pub extern fn i16_wide_mul(lhs: <a href="core-integer-i16.html">i16</a>, rhs: <a href="core-integer-i16.html">i16</a>) -> <a href="core-integer-i32.html">i32</a> nopanic;</code></pre>

## i32

The 32-bit signed integer type.

Fully qualified path: [core](./core.md)::[integer](./core-integer.md)::[i32](./core-integer-i32.md)

<pre><code class="language-cairo">pub extern type i32;</code></pre>

### i32_diff

If `lhs` >= `rhs` returns `Ok(lhs - rhs)` else returns `Err(2**32 + lhs - rhs)`.

Fully qualified path: [core](./core.md)::[integer](./core-integer.md)::[i32_diff](./core-integer-i32_diff.md)

<pre><code class="language-cairo">pub extern fn i32_diff(lhs: <a href="core-integer-i32.html">i32</a>, rhs: <a href="core-integer-i32.html">i32</a>) -> <a href="core-result-Result.html">Result&lt;u32, u32&gt;</a> implicits(RangeCheck) nopanic;</code></pre>

### i32_wide_mul

Fully qualified path: [core](./core.md)::[integer](./core-integer.md)::[i32_wide_mul](./core-integer-i32_wide_mul.md)

<pre><code class="language-cairo">pub extern fn i32_wide_mul(lhs: <a href="core-integer-i32.html">i32</a>, rhs: <a href="core-integer-i32.html">i32</a>) -> <a href="core-integer-i64.html">i64</a> nopanic;</code></pre>

## i64

The 64-bit signed integer type.

Fully qualified path: [core](./core.md)::[integer](./core-integer.md)::[i64](./core-integer-i64.md)

<pre><code class="language-cairo">pub extern type i64;</code></pre>

### i64_diff

If `lhs` >= `rhs` returns `Ok(lhs - rhs)` else returns `Err(2**64 + lhs - rhs)`.

Fully qualified path: [core](./core.md)::[integer](./core-integer.md)::[i64_diff](./core-integer-i64_diff.md)

<pre><code class="language-cairo">pub extern fn i64_diff(lhs: <a href="core-integer-i64.html">i64</a>, rhs: <a href="core-integer-i64.html">i64</a>) -> <a href="core-result-Result.html">Result&lt;u64, u64&gt;</a> implicits(RangeCheck) nopanic;</code></pre>

### i64_wide_mul

Fully qualified path: [core](./core.md)::[integer](./core-integer.md)::[i64_wide_mul](./core-integer-i64_wide_mul.md)

<pre><code class="language-cairo">pub extern fn i64_wide_mul(lhs: <a href="core-integer-i64.html">i64</a>, rhs: <a href="core-integer-i64.html">i64</a>) -> <a href="core-integer-i128.html">i128</a> nopanic;</code></pre>

## i128

The 128-bit signed integer type.

Fully qualified path: [core](./core.md)::[integer](./core-integer.md)::[i128](./core-integer-i128.md)

<pre><code class="language-cairo">pub extern type i128;</code></pre>

### i128_diff

If `lhs` >= `rhs` returns `Ok(lhs - rhs)` else returns `Err(2**128 + lhs - rhs)`.

Fully qualified path: [core](./core.md)::[integer](./core-integer.md)::[i128_diff](./core-integer-i128_diff.md)

<pre><code class="language-cairo">pub extern fn i128_diff(lhs: <a href="core-integer-i128.html">i128</a>, rhs: <a href="core-integer-i128.html">i128</a>) -> <a href="core-result-Result.html">Result&lt;u128, u128&gt;</a> implicits(RangeCheck) nopanic;</code></pre>

Field Element Types and Operations

# Field Element Types and Operations

### felt252

`felt252` is the fundamental field element in Cairo, representing an integer `x` such that `0 <= x < P`, where `P` is a large prime number (2^251 + 17\*2^192 + 1). All operations involving `felt252` are performed modulo `P`.

```cairo
pub extern type felt252;
```

#### `felt252_div`

This function performs division on `felt252` values. It returns a field element `n` that satisfies `n * rhs ≡ lhs (mod P)`.

```cairo
use core::felt252_div;

// Division with 0 remainder works the same way as integer division.
assert!(felt252_div(4, 2) == 2);

// Division with non 0 remainder returns a field element n where n * 3 ≡ 4 (mod P)
assert!(felt252_div(4, 3) ==
1206167596222043737899107594365023368541035738443865566657697352045290673495);
```

### m31

`m31` represents a field element for the Mersenne prime with `n=31`. Its values are in the range `[0, 2147483646]`.

```cairo
pub type m31 = BoundedInt<0, 2147483646>;
```

#### Operations on m31

The `m31_ops` module provides arithmetic operations for `m31` elements:

- **Addition:** `m31_add`
  ```cairo
  extern fn m31_add(a: BoundedInt<0, 2147483646>, b: BoundedInt<0, 2147483646>) -> BoundedInt<0, 2147483646> nopanic;
  ```
- **Subtraction:** `m31_sub`
  ```cairo
  extern fn m31_sub(a: BoundedInt<0, 2147483646>, b: BoundedInt<0, 2147483646>) -> BoundedInt<0, 2147483646> nopanic;
  ```
- **Multiplication:** `m31_mul`
  ```cairo
  extern fn m31_mul(a: BoundedInt<0, 2147483646>, b: BoundedInt<0, 2147483646>) -> BoundedInt<0, 2147483646> nopanic;
  ```
- **Division:** `m31_div`
  ```cairo
  extern fn m31_div(a: BoundedInt<0, 2147483646>, b: NonZero<BoundedInt<0, 2147483646>>) -> BoundedInt<0, 2147483646> nopanic;
  ```

### qm31

`qm31` is an extension field defined over four `m31` elements.

```cairo
pub extern type qm31;
```

Arithmetic Operation Traits (Checked, Overflowing, Saturating, Wrapping)

# Arithmetic Operation Traits (Checked, Overflowing, Saturating, Wrapping)

This section details various arithmetic operation traits that handle overflow and underflow conditions in different ways: checked, overflowing, saturating, and wrapping.

## Checked Operations

Safe arithmetic operations with overflow/underflow checking. These operations return `None` when an overflow or underflow occurs, allowing for graceful handling without panics.

### `CheckedAdd`

Performs addition that returns `None` instead of wrapping around on overflow.

```cairo
use core::num::traits::CheckedAdd;

let result = 1_u8.checked_add(2);
assert!(result == Some(3));

let result = 255_u8.checked_add(1);
assert!(result == None); // Overflow
```

### `CheckedSub`

Performs subtraction that returns `None` instead of wrapping around on underflow.

```cairo
use core::num::traits::CheckedSub;

let result = 1_u8.checked_sub(1);
assert!(result == Some(0));

let result = 1_u8.checked_sub(2);
assert!(result == None); // Underflow
```

### `CheckedMul`

Performs multiplication that returns `None` instead of wrapping around on underflow or overflow.

```cairo
use core::num::traits::CheckedMul;

let result = 10_u8.checked_mul(20);
assert!(result == Some(200));

let result = 10_u8.checked_mul(30);
assert!(result == None); // Overflow
```

## Overflowing Operations

Arithmetic operations with overflow detection. These operations explicitly track potential numeric overflow conditions and return a boolean flag along with the result.

### `OverflowingAdd`

Performs addition with a flag for overflow. Returns a tuple of the sum and a boolean indicating overflow.

```cairo
use core::num::traits::OverflowingAdd;

let (result, is_overflow) = 1_u8.overflowing_add(255_u8);
assert!(result == 0);
assert!(is_overflow);
```

### `OverflowingSub`

Performs subtraction with a flag for overflow. Returns a tuple of the difference and a boolean indicating underflow.

```cairo
use core::num::traits::OverflowingSub;

let (result, is_underflow) = 1_u8.overflowing_sub(2_u8);
assert!(result == 255);
assert!(is_underflow);
```

### `OverflowingMul`

Performs multiplication with a flag for overflow. Returns a tuple of the product and a boolean indicating overflow.

```cairo
use core::num::traits::OverflowingMul;

let (result, is_overflow) = 1_u8.overflowing_mul(2_u8);
assert!(result == 2);
assert!(!is_overflow);
```

## Saturating Operations

Saturating arithmetic operations for numeric types. These operations saturate at the numeric type's boundaries instead of overflowing.

### `SaturatingAdd`

Performs addition that saturates at the numeric bounds instead of overflowing.

```cairo
use core::num::traits::SaturatingAdd;

assert!(255_u8.saturating_add(1_u8) == 255);
```

### `SaturatingSub`

Performs subtraction that saturates at the numeric bounds instead of overflowing.

```cairo
use core::num::traits::SaturatingSub;

assert!(1_u8.saturating_sub(2_u8) == 0);
```

### `SaturatingMul`

Performs multiplication that saturates at the numeric bounds instead of overflowing.

```cairo
use core::num::traits::SaturatingMul;

assert!(100_u8.saturating_mul(3_u8) == 255);
```

## Wrapping Operations

Arithmetic operations with overflow and underflow wrapping. These operations wrap around at the boundary of the type in case of overflow or underflow.

### `WrappingAdd`

Performs addition that wraps around on overflow.

```cairo
use core::num::traits::WrappingAdd;

let result = 255_u8.wrapping_add(1);
assert!(result == 0);

let result = 100_u8.wrapping_add(200);
assert!(result == 44); // (100 + 200) % 256 = 44
```

### `WrappingSub`

Performs subtraction that wraps around on overflow.

```cairo
use core::num::traits::WrappingSub;

let result = 0_u8.wrapping_sub(1);
assert!(result == 255);

let result = 100_u8.wrapping_sub(150);
assert!(result == 206);
```

### `WrappingMul`

Performs multiplication that wraps around on overflow.

```cairo
use core::num::traits::WrappingMul;

let result = 10_u8.wrapping_mul(30);
assert!(result == 44); // (10 * 30) % 256 = 44

let result = 200_u8.wrapping_mul(2);
assert!(result == 144); // (200 * 2) % 256 = 144
```

Advanced Numeric Operations (Division, Remainder, Square Root, Wide Multiplication)

# Advanced Numeric Operations (Division, Remainder, Square Root, Wide Multiplication)

This section covers advanced numeric operations including wide multiplication, square root calculations, safe division and remainder operations, and overflowing arithmetic for various integer types.

## Wide Multiplication

### `WideMul` Trait

This trait enables multiplication operations where the result type has double the bit width of the input types, preventing overflow.

```cairo
pub trait WideMul<Lhs, Rhs>
```

The `wide_mul` function computes this:

```cairo
fn wide_mul<Lhs, Rhs, Lhs, Rhs>(self: Lhs, other: Rhs) -> WideMul<Lhs, Rhs>Target
```

**Available Implementations:**

- `i8` → `i16`
- `i16` → `i32`
- `i32` → `i64`
- `i64` → `i128`
- `u8` → `u16`
- `u16` → `u32`
- `u32` → `u64`
- `u64` → `u128`
- `u128` → `u256`
- `u256` → `u512`

### Specific Wide Multiplication Functions

- **`u32_wide_mul`**: Multiplies two `u32` values, returning a `u64`.
  ```cairo
  pub extern fn u32_wide_mul(lhs: u32, rhs: u32) -> u64 nopanic;
  ```
- **`u64_wide_mul`**: Multiplies two `u64` values, returning a `u128`.
  ```cairo
  pub extern fn u64_wide_mul(lhs: u64, rhs: u64) -> u128 nopanic;
  ```
- **`u128_wide_mul`**: Multiplies two `u128` values and returns `(high, low)` - the 128-bit parts of the result.
- **`u256_wide_mul`**: Multiplies two `u256` values, returning a `u512`.
  ```cairo
  pub fn u256_wide_mul(a: u256, b: u256) -> u512;
  ```
- **`i8_wide_mul`**: Multiplies two `i8` values, returning an `i16`.
- **`i16_wide_mul`**: Multiplies two `i16` values, returning an `i32`.
- **`i32_wide_mul`**: Multiplies two `i32` values, returning an `i64`.
- **`i64_wide_mul`**: Multiplies two `i64` values, returning an `i128`.

### `WideSquare` Trait

This trait enables squaring operations where the result type has double the bit width of the input type.

```cairo
pub trait WideSquare<T>
```

The `wide_square` function computes this:

```cairo
fn wide_square<T, T>(self: T) -> WideSquare<T>Target
```

**Available Implementations:**

- `i8` → `i16`
- `i16` → `i32`
- `i32` → `i64`
- `i64` → `i128`
- `u8` → `u16`
- `u16` → `u32`
- `u32` → `u64`

## Square Root

### `Sqrt` Trait

A trait for computing the square root of a number.

```cairo
pub trait Sqrt<T>
```

The `sqrt` function computes this:

```cairo
fn sqrt<T, T>(self: T) -> Sqrt<T>Target
```

### Square Root Functions

- **`u32_sqrt`**: Computes the square root of a `u32`, returning a `u16`.
  ```cairo
  pub extern fn u32_sqrt(value: u32) -> u16 implicits(RangeCheck) nopanic;
  ```
- **`u64_sqrt`**: Computes the square root of a `u64`, returning a `u32`.
  ```cairo
  pub extern fn u64_sqrt(value: u64) -> u32 implicits(RangeCheck) nopanic;
  ```
- **`u128_sqrt`**: Computes the square root of a `u128`, returning a `u64`.
  ```cairo
  pub extern fn u128_sqrt(value: u128) -> u64 implicits(RangeCheck) nopanic;
  ```
- **`u256_sqrt`**: Computes the square root of a `u256`, returning a `u128`.
  ```cairo
  pub extern fn u256_sqrt(a: u256) -> u128 implicits(RangeCheck) nopanic;
  ```

## Division and Remainder

### `DivRem` Trait

This trait provides a way to efficiently compute both the quotient and remainder in a single operation.

```cairo
pub trait DivRem<T, U>
```

The `div_rem` function computes this:

```cairo
fn div_rem<T, U, T, U>(self: T, other: NonZero<U>) -> (DivRem<T, U>Quotient, DivRem<T, U>Remainder)
```

### Safe Division and Remainder Functions

- **`u32_safe_divmod`**: Safely computes division and remainder for `u32`.
  ```cairo
  pub extern fn u32_safe_divmod(lhs: u32, rhs: NonZero<u32>) -> (u32, u32) implicits(RangeCheck) nopanic;
  ```
- **`u64_safe_divmod`**: Safely computes division and remainder for `u64`.
  ```cairo
  pub extern fn u64_safe_divmod(lhs: u64, rhs: NonZero<u64>) -> (u64, u64) implicits(RangeCheck) nopanic;
  ```
- **`u128_safe_divmod`**: Safely computes division and remainder for `u128`.
  ```cairo
  pub extern fn u128_safe_divmod(lhs: u128, rhs: NonZero<u128>) -> (u128, u128) implicits(RangeCheck) nopanic;
  ```

## Overflowing Arithmetic

These functions perform arithmetic operations, returning a tuple of the result and a boolean indicating overflow, or a `Result` type.

- **`u16_overflowing_add`**: Adds two `u16` values with overflow detection.
- **`u16_overflowing_sub`**: Subtracts two `u16` values with overflow detection.
- **`u32_overflowing_add`**: Adds two `u32` values with overflow detection.
  ```cairo
  pub extern fn u32_overflowing_add(lhs: u32, rhs: u32) -> Result<u32, u32> implicits(RangeCheck) nopanic;
  ```
- **`u32_overflowing_sub`**: Subtracts two `u32` values with overflow detection.
  ```cairo
  pub extern fn u32_overflowing_sub(lhs: u32, rhs: u32) -> Result<u32, u32> implicits(RangeCheck) nopanic;
  ```
- **`u64_overflowing_add`**: Adds two `u64` values with overflow detection.
  ```cairo
  pub extern fn u64_overflowing_add(lhs: u64, rhs: u64) -> Result<u64, u64> implicits(RangeCheck) nopanic;
  ```
- **`u64_overflowing_sub`**: Subtracts two `u64` values with overflow detection.
  ```cairo
  pub extern fn u64_overflowing_sub(lhs: u64, rhs: u64) -> Result<u64, u64> implicits(RangeCheck) nopanic;
  ```
- **`u128_overflowing_mul`**: Multiplies two `u128` values, returning the result and a boolean indicating overflow.
  ```cairo
  pub fn u128_overflowing_mul(lhs: u128, rhs: u128) -> (u128, bool)
  ```
- **`u128_overflowing_sub`**: Subtracts two `u128` values with overflow detection.
  ```cairo
  pub extern fn u128_overflowing_sub(lhs: u128, rhs: u128) -> Result<u128, u128> implicits(RangeCheck) nopanic;
  ```
- **`u256_overflowing_add`**: Adds two `u256` values with overflow detection.
  ```cairo
  pub fn u256_overflowing_add(lhs: u256, rhs: u256) -> (u256, bool);
  ```
- **`u256_overflowing_sub`**: Subtracts two `u256` values with overflow detection.
  ```cairo
  pub fn u256_overflowing_sub(lhs: u256, rhs: u256) -> (u256, bool);
  ```
- **`u256_overflowing_mul`**: Multiplies two `u256` values with overflow detection.
  ```cairo
  pub fn u256_overflowing_mul(lhs: u256, rhs: u256) -> (u256, bool);
  ```

## Signed Differences

These functions compute the difference between two signed integers, returning a `Result` to handle cases where the subtraction would underflow.

- **`i8_diff`**: Computes the difference `lhs - rhs` for `i8`. Returns `Ok(lhs - rhs)` if `lhs >= rhs`, otherwise `Err(2**8 + lhs - rhs)`.
  ```cairo
  pub fn i8_diff(lhs: i8, rhs: i8) -> Result<i8, i8>;
  ```
- **`i16_diff`**: Computes the difference `lhs - rhs` for `i16`. Returns `Ok(lhs - rhs)` if `lhs >= rhs`, otherwise `Err(2**16 + lhs - rhs)`.
  ```cairo
  pub fn i16_diff(lhs: i16, rhs: i16) -> Result<i16, i16>;
  ```
- **`i32_diff`**: Computes the difference `lhs - rhs` for `i32`. Returns `Ok(lhs - rhs)` if `lhs >= rhs`, otherwise `Err(2**32 + lhs - rhs)`.
  ```cairo
  pub fn i32_diff(lhs: i32, rhs: i32) -> Result<i32, i32>;
  ```
- **`i64_diff`**: Computes the difference `lhs - rhs` for `i64`. Returns `Ok(lhs - rhs)` if `lhs >= rhs`, otherwise `Err(2**64 + lhs - rhs)`.
  ```cairo
  pub fn i64_diff(lhs: i64, rhs: i64) -> Result<i64, i64>;
  ```
- **`i128_diff`**: Computes the difference `lhs - rhs` for `i128`. Returns `Ok(lhs - rhs)` if `lhs >= rhs`, otherwise `Err(2**128 + lhs - rhs)`.
  ```cairo
  pub fn i128_diff(lhs: i128, rhs: i128) -> Result<i128, i128>;
  ```

Type Conversions and Utility Traits

# Type Conversions and Utility Traits

## BitSize

A trait used to retrieve the size of a type in bits.

### bits

Returns the bit size of `T` as a `usize`.

```cairo
use core::num::traits::BitSize;

let bits = BitSize::<u8>::bits();
assert!(bits == 8);
```

## Bounded

A trait defining minimum and maximum bounds for numeric types. This trait only supports types that can have constant values.

### MIN

Returns the minimum value for type `T`.

```cairo
use core::num::traits::Bounded;

let min = Bounded::<u8>::MIN;
assert!(min == 0);
```

## AppendFormattedToByteArray

A trait for appending the ASCII representation of a number to an existing `ByteArray`.

### append_formatted_to_byte_array

Appends the formatted number to a `ByteArray`.

```cairo
use core::to_byte_array::AppendFormattedToByteArray;

let mut buffer = "Count: ";
let num: u32 = 42;
num.append_formatted_to_byte_array(ref buffer, 10);
assert!(buffer == "Count: 42");
```

## FormatAsByteArray

A trait for formatting values into their ASCII string representation in a `ByteArray`.

### format_as_byte_array

Returns a new `ByteArray` containing the ASCII representation of the value.

```cairo
use core::to_byte_array::FormatAsByteArray;

let num: u32 = 42;
let formatted = num.format_as_byte_array(16);
assert!(formatted, "2a");
```

Traits and Operator Overloading

Core Concepts of Traits and Operator Overloading

# Core Concepts of Traits and Operator Overloading

Traits in Cairo define common behavior patterns for types, enabling concepts like operator overloading.

## Memory Management Traits

- **`Copy`**: Enables value semantics, allowing values to be copied instead of moved.
- **`Drop`**: Allows types to define custom cleanup behavior when they go out of scope.
- **`Destruct`**: Provides custom destruction behavior for types that cannot be dropped.
- **`PanicDestruct`**: Handles the destruction of a value during a panic scenario.

## Arithmetic Operations

- **`Add`**: Implements the addition operator `+`.
  ```cairo
  assert!(12 + 1 == 13);
  ```
  Signature: `fn add<T, T>(lhs: T, rhs: T) -> T`
- **`AddEq`**: Implements the addition assignment operator `+=`.
  Signature: `fn add_eq<T, T>(ref self: T, other: T)`
- **`Sub`**: Implements the subtraction operator `-`.
- **`SubEq`**: Implements the subtraction assignment operator `-=`.
- **`Mul`**: Implements the multiplication operator `*`.
- **`MulEq`**: Implements the multiplication assignment operator `*=`.
  Signature: `fn mul_eq<T, T>(ref self: T, other: T)`
- **`Div`**: Implements the division operator `/`.
- **`DivEq`**: Implements the division assignment operator `/=`.
- **`Rem`**: Implements the remainder operator `%`.
- **`RemEq`**: Implements the remainder assignment operator `%=`.
- **`DivRem`**: Performs truncated division and remainder efficiently.
- **`Neg`**: Implements the unary negation operator `-`.

  ```cairo
  #[derive(Copy, Drop, PartialEq)]
  enum Sign {
      Negative,
      Zero,
      Positive,
  }

  impl SignNeg of Neg<Sign> {
      fn neg(a: Sign) -> Sign {
          match a {
              Sign::Negative => Sign::Positive,
              Sign::Zero => Sign::Zero,
              Sign::Positive => Sign::Negative,
          }
      }
  }
  assert!(-Sign::Positive == Sign::Negative);
  ```

  Signature: `fn neg<T, T>(a: T) -> T`

## Bitwise Operations

- **`BitAnd`**: Implements the bitwise AND operator `&`.

  ```cairo
  use core::traits::BitAnd;

  #[derive(Drop, PartialEq)]
  struct Scalar {
      inner: bool,
  }

  impl BitAndScalar of BitAnd<Scalar> {
      fn bitand(lhs: Scalar, rhs: Scalar) -> Scalar {
         Scalar { inner: lhs.inner & rhs.inner }
      }
  }
  assert!(Scalar { inner: true } & Scalar { inner: true } == Scalar { inner: true });
  ```

  Signature: `fn bitand<T, T>(lhs: T, rhs: T) -> T`

- **`BitOr`**: Implements the bitwise OR operator `|`.
- **`BitXor`**: Implements the bitwise XOR operator `^`.
- **`BitNot`**: Implements the bitwise NOT operator `~`.

## Comparison

- **`PartialEq`**: Enables equality comparisons using `==` and `!=`.

  ```cairo
  #[derive(Copy, Drop)]
  struct Point {
      x: u32,
      y: u32
  }

  impl PointEq of PartialEq<Point> {
      fn eq(lhs: @Point, rhs: @Point) -> bool {
          lhs.x == rhs.x && lhs.y == rhs.y
      }
  }
  let p1 = Point { x: 1, y: 2 };
  let p2 = Point { x: 1, y: 2 };
  assert!(p1 == p2);
  ```

- **`PartialOrd`**: Enables ordering comparisons using `<`, `<=`, `>`, and `>=`.

## Type Conversion

- **`Into`**: Provides infallible value-to-value conversion that consumes the input.

  ```caskell
  #[derive(Copy, Drop, PartialEq)]
  struct Color {
      // Packed as 0x00RRGGBB
      value: u32,
  }

  impl RGBIntoColor of Into<(u8, u8, u8), Color> {
      fn into(self: (u8, u8, u8)) -> Color {
          let (r, g, b) = self;
          let value = (r.into() * 0x10000_u32) +
                     (g.into() * 0x100_u32) +
                     b.into();
          Color { value }
      }
  }
  let orange: Color = (255_u8, 128_u8, 0_u8).into();
  assert!(orange == Color { value: 0x00FF8000_u32 });
  ```

- **`TryInto`**: Provides fallible type conversion that may fail.
  Signature: `fn try_into<T, S, T, S>(self: T) -> Option<S>`

## Utility Traits

- **`Default`**: Provides a default value for a type.
- **`Felt252DictValue`**: Enables types to be used as values in `Felt252Dict`, providing a default "empty" state.
  Signature: `fn zero_default<T, T>() -> T`
- **`Index`**: Supports indexing operations (`container[index]`) where the input type is mutated.
  Signature: `fn index<C, I, V, C, I, V>(ref self: C, index: I) -> V`
- **`IndexView`**: Supports indexing operations (`container[index]`) for read-only access.
  Signature: `fn index<C, I, V, C, I, V>(self: @C, index: I) -> V`
- **`Clone`**: Enables explicit duplication of an object. Differs from `Copy` as it may be expensive.
  ```cairo
  let arr = array![1, 2, 3];
  assert!(arr == arr.clone());
  ```
  Signature: `fn clone<T, T>(self: @T) -> T`
- **`Not`**: Implements the unary logical negation operator `!`.

  ```cairo
  #[derive(Drop, PartialEq)]
  enum Answer {
      Yes,
      No,
  }

  impl AnswerNot of Not<Answer> {
      fn not(a: Answer) -> Answer {
          match a {
              Answer::Yes => Answer::No,
              Answer::No => Answer::Yes,
          }
      }
  }
  assert!(!Answer::Yes == Answer::No);
  ```

  Signature: `fn not<T, T>(a: T) -> T`

Value Semantics: Copying, Defaulting, and Destruction

# Value Semantics: Copying, Defaulting, and Destruction

## Copying Semantics

In Cairo, some simple types are "implicitly copyable," meaning they are duplicated when assigned or passed as arguments. These types are considered cheap and safe to copy as they don't require allocation.

For other types, explicit copying is necessary, typically by implementing the `Clone` trait and calling its `clone()` method. The `#[derive(Clone)]` attribute can automatically generate this implementation.

```cairo
let arr = array![1, 2, 3];
let cloned_arr = arr.clone();
assert!(arr == cloned_arr);
```

```cairo
#[derive(Clone, Drop)]
struct Sheep {
   name: ByteArray,
   age: u8,
}

fn main() {
   let dolly = Sheep {
       name: "Dolly",
       age: 6,
   };

   let cloned_sheep = dolly.clone();  // Famous cloned sheep!
}
```

Types implementing `Copy` have "copy semantics," allowing values to be duplicated instead of moved. This trait can be automatically derived using `#[derive(Copy)]`. Most basic types implement `Copy` by default.

**Without `Copy` (move semantics):**

```cairo
#[derive(Drop)]
struct Point {
    x: u128,
    y: u128,
}

fn main() {
    let p1 = Point { x: 5, y: 10 };
    foo(p1);
    foo(p1); // error: Variable was previously moved.
}

fn foo(p: Point) {}
```

**With `Copy` (copy semantics):**

```cairo
#[derive(Copy, Drop)]
struct Point {
    x: u128,
    y: u128,
}

fn main() {
    let p1 = Point { x: 5, y: 10 };
    foo(p1);
    foo(p1); // works: `p1` is copied when passed to `foo`
}

fn foo(p: Point) {}
```

## Default Semantics

The `Default` trait provides a useful default value for a type. Cairo implements `Default` for various primitive types. This trait can be derived using `#[derive(Default)]` if all fields of a type also implement `Default`.

For enums, the `#[default]` attribute specifies which unit variant will be the default.

```cairo
#[derive(Default)]
enum Kind {
    #[default]
    A,
    B,
    C,
}
```

To implement `Default` manually, provide an implementation for the `default()` method.

```cairo
#[derive(Copy, Drop)]
enum Kind {
    A,
    B,
    C,
}

impl DefaultKind of Default<Kind> {
    fn default() -> Kind { Kind::A }
}
```

The `default()` function returns the "default value" for a type, which is often an initial or identity value.

```cairo
let i: i8 = Default::default();
let (x, y): (Option<ByteArray>, u64) = Default::default();
let (a, b, (c, d)): (i32, u32, (bool, bool)) = Default::default();
```

## Destruction Semantics

The `Destruct` trait allows for custom destruction behavior. Values in Cairo must be explicitly handled and cannot be silently dropped. Types can go out of scope by:

1.  Implementing `Drop` for types that can be trivially discarded.
2.  Implementing `Destruct` for types that require cleanup, such as those containing a `Felt252Dict` which needs to be "squashed."

`Destruct` can often be derived from the `Drop` and `Destruct` implementations of a type's fields.

A struct containing a `Felt252Dict` must implement `Destruct`:

```cairo
use core::dict::Felt252Dict;

#[derive(Destruct, Default)]
struct ResourceManager {
    resources: Felt252Dict<u32>,
    count: u32,
}

#[generate_trait]
impl ResourceManagerImpl of ResourceManagerTrait {
   fn add_resource(ref self: ResourceManager, resource_id: felt252, amount: u32) {
       assert!(self.resources.get(resource_id) == 0, "Resource already exists");
       self.resources.insert(resource_id, amount);
       self.count += amount;
   }
}

let mut manager = Default::default();
manager.add_resource(1, 100);
// When manager goes out of scope, Destruct is called.
```

The `Drop` trait is defined as:

```cairo
pub trait Drop<T>
```

## Felt252DictValue

This trait is required for types stored as values in a `Felt252Dict`. It provides a zero-like default value for uninitialized slots. This trait is implemented only for primitive scalar types and `Nullable<T>`, and cannot be implemented manually. To use custom types, wrap them in `Nullable<T>`.

```cairo
use core::dict::Felt252Dict;

#[derive(Copy, Drop, Default)]
struct Counter {
    value: u32,
}

// u8 already implements Felt252DictValue
let mut dict: Felt252Dict<u8> = Default::default();
assert!(dict.get(123) == 0);

// Counter is wrapped in a Nullable
let mut counters: Felt252Dict<Nullable<Counter>> = Default::default();

let maybe_counter: Nullable<Counter> = counters.get(123);
assert!(maybe_counter.deref_or(Default::default()).value == 0);
```

The `Felt252DictValue` trait is defined as:

```cairo
pub trait Felt252DictValue<T>
```

## usize Type Alias

`usize` is an alias for the `u32` type.

Arithmetic and Assignment Operations

# Arithmetic and Assignment Operations

This section covers arithmetic operations and their assignment counterparts, including traits for addition, subtraction, multiplication, division, and remainder operations. It also touches upon overflow detection for subtraction.

## Arithmetic Operations

### Addition (`+`)

Implemented via the `Add` trait, which defines the `add` function.

```cairo
assert!(1_u8 + 2_u8 == 3_u8);
```

### Subtraction (`-`)

Implemented via the `Sub` trait, which defines the `sub` function.

```cairo
assert!(3_u8 - 2_u8 == 1_u8);
```

### Multiplication (`*`)

Implemented via the `Mul` trait, which defines the `mul` function.

```cairo
assert!(3_u8 * 2_u8 == 6_u8);
```

### Division (`/`)

Implemented via the `Div` trait, which defines the `div` function.

```cairo
assert!(4_u8 / 2_u8 == 2_u8);
```

### Remainder (`%`)

Implemented via the `Rem` trait, which defines the `rem` function.

```cairo
assert!(3_u8 % 2_u8 == 1_u8);
```

## Assignment Operations

### Addition Assignment (`+=`)

Implemented via the `AddAssign` trait, which defines the `add_assign` function.

```cairo
let mut x: u8 = 3;
x += x;
assert!(x == 6);
```

### Subtraction Assignment (`-=`)

Implemented via the `SubAssign` trait, which defines the `sub_assign` function.

```cairo
let mut x: u8 = 3;
x -= x;
assert!(x == 0);
```

### Multiplication Assignment (`*=`)

Implemented via the `MulAssign` trait, which defines the `mul_assign` function.

```cairo
let mut x: u8 = 3;
x *= x;
assert!(x == 9);
```

### Division Assignment (`/=`)

Implemented via the `DivAssign` trait, which defines the `div_assign` function.

### Remainder Assignment (`%=`)

Implemented via the `RemAssign` trait, which defines the `rem_assign` function.

```cairo
let mut x: u8 = 3;
x %= x;
assert!(x == 0);
```

## Overflow Detection

### Overflowing Subtraction (`OverflowingSub`)

This trait provides the `overflowing_sub` function, which returns a tuple containing the difference and a boolean indicating if an overflow occurred. If an overflow happens, the wrapped value is returned.

```cairo
fn overflowing_sub<T, T>(self: T, v: T) -> (T, bool)
```

Bitwise and Logical Operations

### Bitwise AND (`&`)

The `BitAnd` trait enables the bitwise AND operation.

```cairo
fn bitand<T, T>(lhs: T, rhs: T) -> T
```

### Bitwise NOT (`~`)

The `BitNot` trait implements the bitwise NOT operation.

**Trait Definition:**

```cairo
pub trait BitNot<T>
```

**Trait Function:**

```cairo
fn bitnot<T, T>(a: T) -> T
```

**Example:**

```cairo
use core::traits::BitNot;

#[derive(Drop, PartialEq)]
struct Wrapper {
    u8: u8,
}

impl BitNotWrapper of BitNot<Wrapper> {
    fn bitnot(a: Wrapper) -> Wrapper {
        Wrapper { u8: ~a.u8 }
    }
}

assert!(~Wrapper { u8: 0 } == Wrapper { u8 : 255 });
assert!(~Wrapper { u8: 1 } == Wrapper { u8 : 254 });
```

```cairo
assert!(~1_u8 == 254);
```

### Bitwise OR (`|`)

The `BitOr` trait supports the bitwise OR operation.

**Trait Definition:**

```cairo
pub trait BitOr<T>
```

**Trait Function:**

```cairo
fn bitor<T, T>(lhs: T, rhs: T) -> T
```

**Example:**

```cairo
use core::traits::BitOr;

#[derive(Drop, PartialEq)]
struct Scalar {
    inner: bool,
}

impl BitOrScalar of BitOr<Scalar> {
    fn bitor(lhs: Scalar, rhs: Scalar) -> Scalar {
        Scalar { inner: lhs.inner | rhs.inner }
    }
}

assert!(Scalar { inner: true } | Scalar { inner: true } == Scalar { inner: true });
assert!(Scalar { inner: true } | Scalar { inner: false } == Scalar { inner: true });
assert!(Scalar { inner: false } | Scalar { inner: true } == Scalar { inner: true });
assert!(Scalar { inner: false } | Scalar { inner: false } == Scalar { inner: false });
```

```cairo
assert!(1_u8 | 2_u8 == 3);
```

### Bitwise XOR (`^`)

The `BitXor` trait provides the bitwise XOR operation.

**Trait Definition:**

```cairo
pub trait BitXor<T>
```

**Trait Function:**

```cairo
fn bitxor<T, T>(lhs: T, rhs: T) -> T
```

**Example:**

```cairo
use core::traits::BitXor;

#[derive(Drop, PartialEq)]
struct Scalar {
    inner: bool,
}

impl BitXorScalar of BitXor<Scalar> {
    fn bitxor(lhs: Scalar, rhs: Scalar) -> Scalar {
        Scalar { inner: lhs.inner ^ rhs.inner }
    }
}

assert!(Scalar { inner: true } ^ Scalar { inner: true } == Scalar { inner: false });
assert!(Scalar { inner: true } ^ Scalar { inner: false } == Scalar { inner: true });
assert!(Scalar { inner: false } ^ Scalar { inner: true } == Scalar { inner: true });
assert!(Scalar { inner: false } ^ Scalar { inner: false } == Scalar { inner: false });
```

```cairo
assert!(1_u8 ^ 2_u8 == 3);
```

Comparison and Ordering

# Comparison and Ordering

## PartialEq

The `PartialEq` trait is used for equality comparisons. It provides the `eq` method for the `==` operator and the `ne` method for the `!=` operator.

### eq

Returns whether `lhs` and `rhs` are equal.

```cairo
assert!(1 == 1);
```

### ne

Returns whether `lhs` and `rhs` are not equal.

```cairo
assert!(0 != 1);
```

## PartialOrd

The `PartialOrd` trait is for types that form a partial order. Its methods (`lt`, `le`, `gt`, `ge`) correspond to the `<`, `<=`, `>`, and `>=` operators, respectively. `PartialOrd` is not derivable and must be implemented manually.

### Implementing PartialOrd

This example shows how to implement `PartialOrd` for a custom `Point` struct, comparing points based on their squared Euclidean distance from the origin. Only the `lt` method needs to be implemented; the others are derived automatically.

```cairo
#[derive(Copy, Drop, PartialEq)]
struct Point {
    x: u32,
    y: u32,
}

impl PointPartialOrd of PartialOrd<Point> {
    fn lt(lhs: Point, rhs: Point) -> bool {
        let lhs_dist = lhs.x * lhs.x + lhs.y * lhs.y;
        let rhs_dist = rhs.x * rhs.x + rhs.y * rhs.y;
        lhs_dist < rhs_dist
    }
}

let p1 = Point { x: 1, y: 1 }; // distance = 2
let p2 = Point { x: 2, y: 2 }; // distance = 8

assert!(p1 < p2);
assert!(p1 <= p2);
assert!(p2 > p1);
assert!(p2 >= p1);
```

### lt

Tests less than (`<` operator).

```cairo
assert_eq!(1 < 1, false);
assert_eq!(1 < 2, true);
assert_eq!(2 < 1, false);
```

### le

Tests less than or equal to (`<=` operator).

```cairo
assert_eq!(1 <= 1, true);
assert_eq!(1 <= 2, true);
assert_eq!(2 <= 1, false);
```

### gt

Tests greater than (`>` operator).

```cairo
assert_eq!(1 > 1, false);
assert_eq!(1 > 2, false);
assert_eq!(2 > 1, true);
```

### ge

Tests greater than or equal to (`>=` operator).

```cairo
assert_eq!(1 >= 1, true);
assert_eq!(1 >= 2, false);
assert_eq!(2 >= 1, true);
```

Accessing Data: Dereferencing and Indexing

# Dereferencing

The `core::ops::deref` module provides traits for transparent access to wrapped values, allowing types to behave like their inner types.

## Deref

The `Deref` trait enables read-only access to a wrapped value. Implementing `Deref` allows a type to directly access the fields of its inner type. However, it cannot be used for implicit type conversions when passing arguments to functions.

**Example:**

```cairo
struct Wrapper<T> { inner: T }

impl WrapperDeref<T> of Deref<Wrapper<T>> {
    type Target = T;
    fn deref(self: Wrapper<T>) -> T { self.inner }
}

let wrapped = Wrapper { inner: 42 };
assert!(wrapped.deref() == 42);
```

- **Trait functions:**
  - `deref`: Returns the dereferenced value.
- **Trait types:**
  - `Target`: The type of the dereferenced value.

## DerefMut

The `DerefMut` trait is for dereferencing in mutable contexts. It indicates that the container itself is mutable, but it does not allow modifying the inner value directly.

**Example:**

```cairo
#[derive(Copy, Drop)]
struct MutWrapper<T> {
    value: T
}

impl MutWrapperDerefMut<T, +Copy<T>> of DerefMut<MutWrapper<T>> {
    type Target = T;
    fn deref_mut(ref self: MutWrapper<T>) -> T {
        self.value
    }
}

// This will work since x is mutable
let mut x = MutWrapper { value: 42 };
let val = x.deref_mut();
assert!(val == 42);

// This would fail to compile since y is not mutable
// let y = MutWrapper { value: 42 };
// let val = y.deref_mut(); // Compile error
```

- **Trait functions:**
  - `deref_mut`: Returns the dereferenced value.
- **Trait types:**
  - `Target`: The type of the dereferenced value.

# Indexing

The `core::ops::index` module provides traits for implementing the indexing operator `[]` on collections, offering two approaches: `IndexView` for read-only access and `Index` for mutable access.

## IndexView

The `IndexView` trait allows indexing operations where the input type is not modified. `container[index]` is syntactic sugar for `container.index(index)`.

**Example:**

```cairo
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

impl NucleotideIndex of IndexView<NucleotideCount, Nucleotide> {
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

- **Trait functions:**
  - `index`: Performs the indexing operation. May panic if the index is out of bounds.
- **Trait types:**
  - `Target`: The returned type after indexing.

## Index

The `Index` trait is for indexing operations where the input type is mutated. This is useful for types that depend on a `Felt252Dict`, where dictionary accesses modify the data structure. `container[index]` is syntactic sugar for `container.index(index)`.

**Example:**

```cairo
use core::ops::Index;

#[derive(Drop, Copy, Default)]
struct Stack {
    items: Array<u128>,
    len: usize,
}

impl StackIndex of Index<Stack, usize> {
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

- **Trait functions:**
  - `index`: Performs the indexing operation. May panic if the index is out of bounds.
- **Trait types:**
  - `Target`: The returned type after indexing.

**When to use which trait:**

- Use `IndexView` for read-only access where the collection is not mutated.
- Use `Index` when the input type needs to be passed as `ref`, typically for types like `Felt252Dict`.

Only one of these traits should be implemented for any given type.

Callable Types: Function Call Traits

# Callable Types: Function Call Traits

This section details traits for function-like types that can be called.

## `Fn` Trait

The `Fn` trait represents the version of the call operator that takes a by-snapshot receiver. Instances implementing `Fn` can be called repeatedly.

- **Implementation:** `Fn` is automatically implemented by closures whose captured variables are all `Copy`. Additionally, for any type `F` that implements `Fn`, `@F` also implements `Fn`.
- **Relationship with `FnOnce`:** Since `FnOnce` is implemented for all `Fn` implementers, any `Fn` instance can be used where `FnOnce` is expected.
- **Usage:** Use `Fn` as a bound when you need to accept a parameter of a function-like type and call it repeatedly. If such strict requirements are not necessary, `FnOnce` is a more suitable bound.

### Examples

**Calling a closure:**

```cairo
let square = |x| x * x;
assert_eq!(square(5), 25);
```

**Using an `Fn` parameter:**

```cairo
fn call_with_one<F, +Drop<F>, +core::ops::Fn<F, (usize,)>[Output: usize]>(func: F) -> usize {
   func(1)
}

let double = |x| x * 2;
assert_eq!(call_with_one(double), 2);
```

### Trait Definition

Fully qualified path: `core::ops::function::Fn`

```cairo
pub trait Fn<T, Args>
```

### Trait Functions

#### `call`

Performs the call operation.

```cairo
fn call<T, Args, T, Args>(self: @T, args: Args) -> Fn<T, Args>Output
```

### Trait Types

#### `Output`

The returned type after the call operator is used.

## `FnOnce` Trait

The `FnOnce` trait represents the version of the call operator that takes a by-value receiver. Instances implementing `FnOnce` can be called, but might not be callable multiple times, potentially consuming their captured variables.

- **Implementation:** `FnOnce` is automatically implemented by closures that might consume captured variables.

### Examples

```cairo
fn consume_with_relish<
    F, O, +Drop<F>, +core::ops::FnOnce<F, ()>[Output: O], +core::fmt::Display<O>, +Drop<O>,
>(func: F) {
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

### Trait Definition

Fully qualified path: `core::ops::function::FnOnce`

```cairo
pub trait FnOnce<T, Args>
```

### Trait Functions

#### `call`

Performs the call operation.

```cairo
fn call<T, Args, T, Args>(self: T, args: Args) -> FnOnce<T, Args>Output
```

### Trait Types

#### `Output`

The returned type after the call operator is used.

Formatting and Debugging

## Formatting and Debugging

The `core::fmt` module provides functionality for formatting values, including traits for debugging and display.

### Debug Trait

The `Debug` trait is used for debug formatting, utilizing the empty format specifier `"{:?}"`.

```cairo
pub trait Debug<T>
```

#### `fmt` Function

The `fmt` function within the `Debug` trait is responsible for the debug formatting process.

```cairo
fn fmt<T, T>(self: @T, ref f: Formatter) -> Result<(), Error>
```

**Example:**

```cairo
let word: ByteArray = "123";
println!("{:?}", word);
```

### Display Trait

The `Display` trait is used for standard formatting, employing the empty format specifier `"{}"`.

```cairo
pub trait Display<T>
```

#### `fmt` Function

The `fmt` function associated with the `Display` trait handles the standard formatting.

```cairo
fn fmt<T, T>(self: @T, ref f: Formatter) -> Result<(), Error>
```

**Example:**

```cairo
let word: ByteArray = "123";
println!("{}", word);
```

### LowerHex Trait

The `LowerHex` trait enables hexadecimal formatting in lowercase, using the format specifier `"{:x}"`.

```cairo
pub trait LowerHex<T>
```

#### `fmt` Function

The `fmt` function for `LowerHex` performs the lowercase hexadecimal formatting.

```cairo
fn fmt<T, T>(self: @T, ref f: Formatter) -> Result<(), Error>
```

### Error Struct

The `Error` struct is a dedicated type for representing errors that occur during the formatting process.

```cairo
#[derive(Drop)]
pub struct Error {}
```

### Formatter Struct

The `Formatter` struct manages the configuration and buffer for formatting operations.

```cairo
#[derive(Default, Drop)]
pub struct Formatter {
    pub buffer: ByteArray,
}
```

#### `buffer` Member

The `buffer` member of the `Formatter` struct holds the pending result of formatting operations.

```cairo
pub buffer: ByteArray
```

Type Conversion and Utilities

### Type Conversion and Utilities

The `TryInto` trait is reflexive, meaning `TryInto<T, T>` is implemented for all types `T`. It is also implemented for all types that implement the `Into` trait.

#### `TryInto` Trait

The `TryInto` trait allows for attempting a conversion between types, returning `None` if the conversion fails.

**Signature:**

```cairo
pub trait TryInto<T, S>
```

**Function:** `try_into`
Attempts to convert the input type `T` into the output type `S`. Returns `None` in the event of a conversion error.

**Examples:**

Converting chess coordinates (like 'e4') into a validated position:

```cairo
#[derive(Copy, Drop, PartialEq)]
 struct Position {
     file: u8, // Column a-h (0-7)
     rank: u8, // Row 1-8 (0-7)
 }

 impl TupleTryIntoPosition of TryInto<(u8, u8), Position> {
    fn try_into(self: (u8, u8)) -> Option<Position> {
        let (file_char, rank) = self;

        // Validate rank is between 1 and 8
        if rank < 1 || rank > 8 {
            return None;
        }

        // Validate and convert file character (a-h) to number (0-7)
        if file_char < 'a' || file_char > 'h' {
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

Converting between numeric types:

```cairo
let a: Option<u8> = 1_u16.try_into();
assert!(a == Some(1));
let b: Option<u8> = 256_u16.try_into();
assert!(b == None);
```

Metaprogramming and Hashing

### Hash Traits

The Cairo standard library provides several traits for managing hashing:

- **`Hash`**: This trait is for values that can be hashed. It should be implemented for any type that can be included in a hash calculation.
- **`HashStateTrait`**: This trait defines the interface for hash state accumulators, providing methods to update the state with new values and finalize it into a hash result.
- **`HashStateExTrait`**: An extension trait for hash state accumulators that adds the `update_with` method, allowing direct hashing of any type `T` that implements `Hash`.
- **`into_felt252_based`**: This is an implementation of the `Hash` trait for types that can be converted into `felt252` using the `Into` trait.
- **`LegacyHash`**: A trait for hashing values using `felt252` as the hash state. It is noted that `Hash` should be implemented instead of `LegacyHash` when possible, for backwards compatibility.

Result Type Handling

### Checking Result State

- `is_ok()`: Returns `true` if the `Result` is `Ok`.
  ```cairo
  fn is_ok<T, E, T, E>(self: @Result<T, E>) -> bool
  ```
- `is_err()`: Returns `true` if the `Result` is `Err`.
  ```cairo
  fn is_err<T, E, T, E>(self: @Result<T, E>) -> bool
  ```
- `into_is_ok()`: Returns `true` if the `Result` is `Ok`, consuming the value.
  ```cairo
  fn into_is_ok<T, E, T, E, +Destruct<T>, +Destruct<E>>(self: Result<T, E>) -> bool
  ```
- `into_is_err()`: Returns `true` if the `Result` is `Err`, consuming the value.
  ```cairo
  fn into_is_err<T, E, T, E, +Destruct<T>, +Destruct<E>>(self: Result<T, E>) -> bool
  ```

### Converting to Option

- `ok()`: Converts `Result<T, E>` to `Option<T>`.

### Chaining and Transforming Results

- `and_then()`: Calls `op` if the result is `Ok`, otherwise returns the `Err` value of `self`.
  ```cairo
  fn and_then<T, E, T, E, U, F, +Drop<F>, +core::ops::FnOnce<F, (T,)>[Output: Result<U, E>]>(
      self: Result<T, E>, op: F,
  ) -> Result<U, E>
  ```
- `or()`: Returns `other` if the result is `Err`, otherwise returns the `Ok` value of `self`.

  ```cairo
  fn or<T, E, T, E, F, +Drop<T>, +Drop<F>, +Destruct<E>>(
      self: Result<T, E>, other: Result<T, F>,
  ) -> Result<T, F>
  ```

  Examples:

  ```cairo
  let x: Result<u32, ByteArray> = Ok(2);
  let y: Result<u32, ByteArray> = Err("late error");
  assert!(x.or(y) == Ok(2));

  let x: Result<u32, ByteArray> = Err("early error");
  let y: Result<u32, ByteArray> = Ok(2);
  assert!(x.or(y) == Ok(2));

  let x: Result<u32, ByteArray> = Err("not a 2");
  let y: Result<u32, ByteArray> = Err("late error");
  assert!(x.or(y) == Err("late error"));

  let x: Result<u32, ByteArray> = Ok(2);
  let y: Result<u32, ByteArray> = Ok(100);
  assert!(x.or(y) == Ok(2));
  ```

- `or_else()`: Calls `op` if the result is `Err`, otherwise returns the `Ok` value of `self`.

  ```cairo
  fn or_else<T, E, T, E, F, +Drop<F>, +core::ops::FnOnce<F, (E,)>(Output: Result<T, E>)>(
      self: Result<T, E>, op: F,
  ) -> Result<T, E>
  ```

  Examples:

  ```cairo
  let x: Result::<u32, ByteArray> = Result::<u32, ByteArray>::Err("bad input")
      .or_else(|_e| Ok(42));
  assert!(x == Ok(42));

  let y: Result::<u32, ByteArray> = Result::<u32, ByteArray>::Err("bad input")
      .or_else(|_e| Err("not 42"));
  assert!(y == Err("not 42"));

  let z: Result::<u32, ByteArray> = Result::<u32, ByteArray>::Ok(100)
      .or_else(|_e| Ok(42));
  assert!(z == Ok(100));
  ```

- `map()`: Applies function `f` to the contained value if `Ok`, otherwise returns the `Err` value.
  ```cairo
  fn map<T, E, T, E, U, F, +Drop<F>, +core::ops::FnOnce<F, (T,)>[Output: U]>(
      self: Result<T, E>, f: F,
  ) -> Result<U, E>
  ```
- `map_or()`: Returns the provided default if `Err`, or applies function `f` to the `Ok` value.

  ```cairo
  fn map_or<
      T, E, T, E, U, F, +Destruct<E>, +Destruct<U>, +Drop<F>, +core::ops::FnOnce<F, (T,)>[Output: U],
  >(
      self: Result<T, E>, default: U, f: F,
  ) -> U
  ```

  Examples:

  ```cairo
  let x: Result<_, ByteArray> = Ok("foo");
  assert!(x.map_or(42, |v: ByteArray| v.len()) == 3);

  let x: Result<_, ByteArray> = Err("bar");
  assert!(x.map_or(42, |v: ByteArray| v.len()) == 42);
  ```

- `map_or_else()`: Applies fallback function `default` if `Err`, or function `f` if `Ok`.

  ```cairo
  fn map_or_else<T, E, T, E, U, F, +Destruct<E>, +Destruct<U>, +Drop<F>, +core::ops::FnOnce<F, (T,)>(Output: U)>(
      self: Result<T, E>, default: F, f: F,
  ) -> U
  ```

  Examples:

  ```cairo
  let k = 21;

  let x: Result<ByteArray, _> = Ok("foo");
  assert!(x.map_or_else(|_e: ByteArray| k * 2, |v: ByteArray| v.len()) == 3);

  let x: Result<_, ByteArray> = Err("bar");
  assert!(x.map_or_else(|_e: ByteArray| k * 2, |v: ByteArray| v.len()) == 42);
  ```

Cryptographic Algorithms

Elliptic Curve Cryptography (EC)

# cairo-docs Documentation Summary

## Cryptographic Algorithms

### Elliptic Curve Cryptography (EC)

This section is currently empty as no relevant content chunks were provided.

EC Point Manipulation

# EC Point Manipulation

Points on the elliptic curve can be created using `EcPointTrait::new` or `EcPointTrait::new_from_x`. The zero point represents the point at infinity.

## Creating EC Points

### `EcPointTrait::new`

Creates a new EC point from its (x, y) coordinates. Returns `None` if the point (x, y) is not on the curve.

```cairo
let point = EcPointTrait::new(
    x: 336742005567258698661916498343089167447076063081786685068305785816009957563,
    y: 1706004133033694959518200210163451614294041810778629639790706933324248611779,
).unwrap();
```

### `EcPointTrait::new_nz`

Creates a new NonZero EC point from its (x, y) coordinates.

```cairo
// Example usage would be similar to new, but returning a NonZero type
```

### `EcPointTrait::new_from_x`

Creates a new EC point from its x coordinate. Returns `None` if no point with the given x-coordinate exists on the curve. Panics if `x` is 0, as this would be the point at infinity.

```cairo
let valid = EcPointTrait::new_from_x(1);
assert!(valid.is_some());
let invalid = EcPointTrait::new_from_x(0);
assert!(invalid.is_none());
```

### `EcPointTrait::new_nz_from_x`

Creates a new NonZero EC point from its x coordinate.

```cairo
// Example usage would be similar to new_from_x, but returning a NonZero type
```

## Retrieving Coordinates

### `EcPointTrait::coordinates`

Returns the coordinates of the EC point. Panics if the point is the point at infinity.

```cairo
let point_nz = EcPointTrait::new_nz_from_x(1).unwrap();
let (x, _y) = point_nz.coordinates();
assert!(x == 1);
```

### `EcPointTrait::x`

Returns the x coordinate of the EC point. Panics if the point is the point at infinity.

```cairo
let point_nz = EcPointTrait::new_nz_from_x(1).unwrap();
let x = point_nz.x();
assert!(x == 1);
```

### `EcPointTrait::y`

Returns the y coordinate of the EC point. Panics if the point is the point at infinity.

```cairo
let gen_point =
EcPointTrait::new_nz_from_x(0x1ef15c18599971b7beced415a40f0c7deacfd9b0d1819e03d723d8bc943cfca).unwrap();
let y = gen_point.y();
assert!(y == 0x5668060aa49730b7be4801df46ec62de53ecd11abe43a32873000c36e8dc1f);
```

## Scalar Multiplication

### `EcPointTrait::mul`

Computes the product of an EC point by the given scalar.

```cairo
fn mul(self: EcPoint, scalar: felt252) -> EcPoint;
```

EC State Management

# EcState

Elliptic curve state. Use this to perform multiple point operations efficiently. Initialize with `EcStateTrait::init`, add points with `EcStateTrait::add` or `EcStateTrait::add_mul`, and finalize with `EcStateTrait::finalize`.

```cairo
pub extern type EcState;
```

# EcStateTrait

```cairo
pub trait EcStateTrait
```

## Trait functions

### init

Initializes an EC computation with the zero point.

```cairo
fn init() -> EcState;
```

Example:

```cairo
let mut state = EcStateTrait::init();
```

### add

Adds a point to the computation.

```cairo
fn add(ref self: EcState, p: NonZero<EcPoint>);
```

### sub

Subtracts a point from the computation.

```cairo
fn sub(ref self: EcState, p: NonZero<EcPoint>);
```

### add_mul

Adds the product `p * scalar` to the state.

```cairo
fn add_mul(ref self: EcState, scalar: felt252, p: NonZero<EcPoint>);
```

### finalize_nz

Finalizes the EC computation and returns the result as a non-zero point.

```cairo
fn finalize_nz(self: EcState) -> Option<NonZero<EcPoint>>;
```

Returns:

- `Option<NonZeroEcPoint>` - The resulting point, or None if the result is the zero point.
  Panics if the result is the point at infinity.

### finalize

Finalizes the EC computation and returns the result. Returns the zero point if the computation results in the point at infinity.

```cairo
fn finalize(self: EcState) -> EcPoint;
```

# EcStateImpl

Implements `EcStateTrait`.

```cairo
pub impl EcStateImpl of EcStateTrait;
```

## Impl functions

### init

Initializes an EC computation with the zero point.

```cairo
fn init() -> EcState;
```

Example:

```cairo
let mut state = EcStateTrait::init();
```

STARK Curve Operations

# STARK Curve Operations

The STARK Curve is defined by the equation $y^2 \equiv x^3 + \alpha \cdot x + \beta \pmod{p}$.

## Constants

The following constants define the STARK curve:

- **ALPHA**: $\alpha = 1$
  ```cairo
  pub const ALPHA: felt252 = 1;
  ```
- **BETA**: $\beta = 0x6f21413efbe40de150e596d72f7a8c5609ad26c15c915c1f4cdfcb99cee9e89$
  ```cairo
  pub const BETA: felt252 = 3141592653589793238462643383279502884197169399375105820974944592307816406665;
  ```
- **GEN_X**: The x-coordinate of the generator point.
  ```cairo
  pub const GEN_X: felt252 = 874739451078007766457464989774322083649278607533249481151382481072868806602;
  ```
- **GEN_Y**: The y-coordinate of the generator point.
  ```cairo
  pub const GEN_Y: felt252 = 152666792071518830868575557812948353041420400780739481342941381225525861407;
  ```
- **ORDER**: The order (number of points) of the STARK Curve.
  ```cairo
  pub const ORDER: felt252 = 3618502788666131213697322783095070105526743751716087489154079457884512865583;
  ```

## Operations and Examples

### `ec_point_unwrap`

Unwraps a non-zero point into its (x, y) coordinates.

```cairo
pub extern fn ec_point_unwrap(p: NonZero<EcPoint>) -> (felt252, felt252) nopanic;
```

### Examples

#### Creating Points and Basic Operations

```cairo
// Create a point from coordinates
let point = EcPointTrait::new(
    x: 336742005567258698661916498343089167447076063081786685068305785816009957563,
    y: 1706004133033694959518200210163451614294041810778629639790706933324248611779,
).unwrap();

// Perform scalar multiplication
let result = point.mul(2);

// Add points
let sum = point + result;

// Subtract points
let diff = result - point;
```

#### Using EC State for Batch Operations

```cairo
let p = EcPointTrait::new_from_x(1).unwrap();
let p_nz = p.try_into().unwrap();

// Initialize state
let mut state = EcStateTrait::init();

// Add points and scalar multiplications
state.add(p_nz);
state.add_mul(1, p_nz);

// Get the final result
let _result = state.finalize();
```

Secp256k1/r1 Curve Operations

# Secp256k1/r1 Curve Operations

## Secp256Trait

A trait for interacting with Secp256{k/r}1 curves. It provides methods for accessing curve parameters and creating curve points.

### Examples

```cairo
use starknet::secp256k1::Secp256k1Point;
use starknet::secp256_trait::Secp256Trait;
use starknet::SyscallResultTrait;

assert!(
    Secp256Trait::<
        Secp256k1Point,
    >::get_curve_size() == 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141,
);

let generator = Secp256Trait::<Secp256k1Point>::get_generator_point();

let generator = Secp256Trait::<
Secp256k1Point,
>::secp256_ec_new_syscall(
0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798,
0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8,
)
.unwrap_syscall();

let random_point = Secp256Trait::<
Secp256k1Point,
>::secp256_ec_get_point_from_x_syscall(
0x4aebd3099c618202fcfe16ae7770b0c49ab5eadf74b754204a3bb6060e44eff3, true,
);
```

### Trait Functions

- `get_curve_size()`: Returns the order (size) of the curve's underlying field.
- `get_generator_point()`: Returns the generator point (G) for the curve.
- `secp256_ec_new_syscall(x: u256, y: u256)`: Creates a new curve point from its x and y coordinates. Returns `None` if the provided coordinates don't represent a valid point on the curve.
- `secp256_ec_get_point_from_x_syscall(x: u256, y_parity: bool)`: Creates a curve point given its x-coordinate and y-parity. `y_parity` determines if the odd (true) or even (false) y value is chosen. Returns `Some(point)` if a point exists, `None` otherwise.

## Secp256PointTrait

A trait for performing operations on Secp256{k/r}1 curve points. It provides operations needed for elliptic curve cryptography, including point addition and scalar multiplication.

### Examples

```cairo
use starknet::SyscallResultTrait;
use starknet::secp256k1::Secp256k1Point;
use starknet::secp256_trait::Secp256PointTrait;
use starknet::secp256_trait::Secp256Trait;

let generator = Secp256Trait::<Secp256k1Point>::get_generator_point();

assert!(
    Secp256PointTrait::get_coordinates(generator)
        .unwrap_syscall() == (
            0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798,
            0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8,
        ),
);

let point = Secp256PointTrait::add(generator, generator);
let other_point = Secp256PointTrait::mul(generator, 2);
```

### Trait Functions

- `get_coordinates(self)`: Returns the x and y coordinates of the curve point.
- `add(self, other)`: Performs elliptic curve point addition of `self` and `other`.
- `mul(self, scalar: u256)`: Performs scalar multiplication of `self` by the given `scalar`.

## Secp256k1Point

A point on the secp256k1 curve.

The secp256k1 module provides functionality for operations on this curve, commonly used in cryptographic applications.
Curve parameters:

- Base field: q = 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f
- Scalar field: r = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141
- Curve equation: y^2 = x^3 + 7

## Secp256r1Point

Represents a point on the secp256r1 elliptic curve (NIST P-256).

The secp256r1 module provides functionality for operations on this curve.
Curve parameters:

- Base field: q = 0xffffffff00000001000000000000000000000000ffffffffffffffffffffffff
- Scalar field: r = 0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551
- a = -3
- b = 0x5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604b
- Curve equation: y^2 = x^3 + ax + b

## Signature

Represents a Secp256{k/r}1 ECDSA signature.

### Members

- `r`: u256
- `s`: u256
- `y_parity`: bool - The parity of the y coordinate of the elliptic curve point whose x coordinate is `r`. `true` means odd. Some systems use `v` instead of `y_parity`.

### Free Functions

- `signature_from_vrs(v, r, s)`: Creates an ECDSA signature from `v`, `r`, and `s` values. `v` is related to the y-coordinate parity.
- `is_signature_entry_valid(value)`: Checks whether `value` is in the range [1, N), where N is the curve size. This is crucial for ECDSA security to prevent malleability attacks. Returns `true` if valid, `false` otherwise.
- `is_valid_signature(public_key_point, message_hash, signature)`: Checks whether a signature is valid given a public key point and a message hash.
- `recover_public_key(message_hash, signature)`: Recovers the public key associated with a given signature and message hash.

Hashing Algorithms

# Hashing Algorithms

## BLAKE2s

The `core::blake` module provides functions for the BLAKE2s hashing algorithm.

### `blake2s_compress`

This function compresses data using the BLAKE2s algorithm. It takes a state, a byte count, and a message, returning a new state. The `byte_count` should represent the total number of bytes hashed after processing the current `msg`.

<pre><code class="language-cairo">pub extern fn blake2s_compress(state: Box&lt;u32; 8]&gt;, byte_count: u32, msg: Box&lt;u32; 16]&gt;) -> Box&lt;u32; 8]&gt; nopanic;</code></pre>

### `blake2s_finalize`

This function is similar to `blake2s_compress` but is specifically used for the final block of a message.

<pre><code class="language-cairo">pub extern fn blake2s_finalize(state: Box&lt;u32; 8]&gt;, byte_count: u32, msg: Box&lt;u32; 16]&gt;) -> Box&lt;u32; 8]&gt; nopanic;</code></pre>

## Legacy Hashing

The `core::hash` module includes `LegacyHash` for backwards compatibility. It uses a `felt252` as the hash state. It is recommended to implement the `Hash` trait instead of `LegacyHash` when possible.

### `LegacyHash::hash`

This trait function hashes a value using a `felt252` state.

<pre><code class="language-cairo">fn hash&lt;T, T&gt;(state: felt252, value: T) -> felt252</code></pre>

Example usage:

```cairo
use core::pedersen::PedersenTrait;
use core::hash::LegacyHash;

let hash = LegacyHash::hash(0, 1);
```

## Generic Hashing

The `core::hash` module provides a generic hashing abstraction. It allows for flexible and efficient hashing of any type by maintaining a hash state that can be updated and finalized.

### `#[derive(Hash)]`

The simplest way to make a type hashable is by deriving the `Hash` trait.

### Hash State

A `HashState` can be initialized for a specific hash function (e.g., Pedersen, Poseidon), updated with values, and then finalized to produce a hash result.

Example using Pedersen and Poseidon:

```cairo
use core::pedersen::PedersenTrait;
use core::poseidon::PoseidonTrait;

#[derive(Copy, Drop, Hash)]
struct Person {
    id: u32,
    phone: u64,
}

fn main() {
  let person1 = Person { id: 1, phone: 555_666_7777 };
  let person2 = Person { id: 2, phone: 555_666_7778 };

  // Example assertions for distinct hashes
  assert!(
      PedersenTrait::new(0)
          .update_with(person1)
          .finalize() != PedersenTrait::new(0)
          .update_with(person2)
          .finalize(),
  );
  assert!(
      PoseidonTrait::new()
          .update_with(person1)
          .finalize() != PoseidonTrait::new()
          .update_with(person2)
          .finalize(),
  );
}
```

General Hashing Traits

# General Hashing Traits

This section details traits related to hashing in Cairo, focusing on how to include types in hash calculations and manage hash states.

## Hash Trait

The `Hash` trait is for types that can be included in a hash calculation. The most common way to implement this trait is by using `#[derive(Hash)]`.

Fully qualified path: [core](./core.md)::[hash](./core-hash.md)::[Hash](./core-hash-Hash.md)

```cairo
pub trait Hash<T, S, +HashStateTrait<S>>
```

### update_state

Updates the hash state with the given value and returns a new hash state.

#### Examples

```cairo
use core::pedersen::PedersenTrait;
use core::hash::Hash;

let mut state = PedersenTrait::new(0);
let new_state = Hash::update_state(state, 1);
```

Fully qualified path: [core](./core.md)::[hash](./core-hash.md)::[Hash](./core-hash-Hash.md)::[update_state](./core-hash-Hash.md#update_state)

```cairo
fn update_state<T, S, +HashStateTrait<S>, T, S, +HashStateTrait<S>>(state: S, value: T) -> S
```

## HashStateExTrait

An extension trait for hash state accumulators. It adds the `update_with` method to hash states, allowing direct hashing of values of any type `T` that implements `Hash`, without manual conversion to `felt252`.

Fully qualified path: [core](./core.md)::[hash](./core-hash.md)::[HashStateExTrait](./core-hash-HashStateExTrait.md)

```cairo
pub trait HashStateExTrait<S, T>
```

### update_with

Updates the hash state with the given value and returns the updated state.

#### Examples

```cairo
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

Fully qualified path: [core](./core.md)::[hash](./core-hash.md)::[HashStateExTrait](./core-hash-HashStateExTrait.md)::[update_with](./core-hash-HashStateExTrait.md#update_with)

```cairo
fn update_with<S, T, S, T>(self: S, value: T) -> S
```

## HashStateTrait

A trait for hash state accumulators, providing methods to update a hash state with new values and finalize it into a hash result.

Fully qualified path: [core](./core.md)::[hash](./core-hash.md)::[HashStateTrait](./core-hash-HashStateTrait.md)

```cairo
pub trait HashStateTrait<S>
```

### update

Updates the current hash state `self` with the given `felt252` value and returns a new hash state.

#### Examples

```cairo
use core::pedersen::PedersenTrait;
use core::hash::HashStateTrait;

let mut state = PedersenTrait::new(0);
state = state.update(1);
```

Fully qualified path: [core](./core.md)::[hash](./core-hash.md)::[HashStateTrait](./core-hash-HashStateTrait.md)::[update](./core-hash-HashStateTrait.md#update)

```cairo
fn update<S, S>(self: S, value: <a href="core-felt252.html">felt252</a>) -> S
```

### finalize

Takes the current state `self` and returns the hash result.

#### Examples

```cairo
use core::pedersen::PedersenTrait;
use core::hash::HashStateTrait;

let mut state = PedersenTrait::new(0);
let hash = state.finalize();
```

Fully qualified path: [core](./core.md)::[hash](./core-hash.md)::[HashStateTrait](./core-hash-HashStateTrait.md)::[finalize](./core-hash-HashStateTrait.md#finalize)

```cairo
fn finalize<S, S>(self: S) -> <a href="core-felt252.html">felt252</a>
```

## LegacyHash

A trait for hashing values using a `felt252` as hash state, intended for backwards compatibility. It is recommended to implement `Hash` instead of this trait when possible.

Pedersen Hash

# Pedersen Hash

The Pedersen hash is a collision-resistant cryptographic hash function.

## HashState

Represents the current state of a Pedersen hash computation. The state is maintained as a single `felt252` value, which is updated through the `HashStateTrait::finalize` method.

Fully qualified path: `core::pedersen::HashState`

<pre><code class="language-cairo">#[derive(Copy, Drop, Debug)]
pub struct HashState {
    pub state: felt252,
}</code></pre>

### state

The current hash state.

Fully qualified path: `core::pedersen::HashState::state`

<pre><code class="language-cairo">pub state: felt252</code></pre>

## PedersenTrait

Trait for Pedersen hash related operations.

Fully qualified path: `core::pedersen::PedersenTrait`

<pre><code class="language-cairo">pub trait PedersenTrait</code></pre>

### new

Creates a new Pedersen hash state with the given base value.

Fully qualified path: `core::pedersen::PedersenTrait::new`

<pre><code class="language-cairo">fn new(base: felt252) -> HashState</code></pre>

#### Examples

```cairo
use core::pedersen::PedersenTrait;

let mut state = PedersenTrait::new(0);
assert!(state.state == 0);
```

## PedersenImpl

A trait implementation for creating a new Pedersen hash state.

Fully qualified path: `core::pedersen::PedersenImpl`

<pre><code class="language-cairo">pub impl PedersenImpl of PedersenTrait;</code></pre>

### new

Creates a new Pedersen hash state with the given base value.

Fully qualified path: `core::pedersen::PedersenImpl::new`

<pre><code class="language-cairo">fn new(base: felt252) -> HashState</code></pre>

## pedersen function

Computes the Pedersen hash of two `felt252` values.

Fully qualified path: `core::pedersen::pedersen`

<pre><code class="language-cairo">pub extern fn pedersen(a: felt252, b: felt252) -> felt252 implicits(Pedersen) nopanic;</code></pre>

## Usage Example

```cairo
use core::hash::HashStateTrait;
use core::pedersen::PedersenTrait;

let mut state = PedersenTrait::new(0);
state = state.update(1);
state = state.update(2);
let hash = state.finalize();
assert!(hash == 0x07546be9ecb576c12cd00962356afd90b615d8ef50605bc13badfd1fd218c0d5);
```

Poseidon Hash

# Poseidon Hash

The Poseidon hash module provides cryptographic hash functions based on the Poseidon permutation, optimized for zero-knowledge proof systems. It implements the Poseidon hash using a sponge construction for arbitrary-length inputs.

## HashState

The `HashState` struct represents the state for the Poseidon hash.

```cairo
pub s1: felt252
pub s2: felt252
pub odd: bool
```

## PoseidonTrait

This trait defines the interface for Poseidon hashing operations.

### new

Creates an initial state with all fields set to 0.

```cairo
use core::poseidon::PoseidonTrait;

let mut state = PoseidonTrait::new();
```

## PoseidonImpl

This trait provides an implementation for creating a new Poseidon hash state.

### new

Creates an initial state with all fields set to 0.

```cairo
use core::poseidon::PoseidonTrait;

let mut state = PoseidonTrait::new();
```

## poseidon_hash_span

Computes the Poseidon hash on the given span input. It applies the sponge construction to digest multiple elements. The capacity element is initialized to 0.

To distinguish between different input sizes, it pads with 1, and possibly another 0 to complete to an even-sized input.

```cairo
let span = [1, 2].span();
let hash = poseidon_hash_span(span);

assert!(hash == 0x0371cb6995ea5e7effcd2e174de264b5b407027a75a231a70c2c8d196107f0e7);
```

## hades_permutation

This function performs the Hades permutation, a core component of the Poseidon hash.

```cairo
pub extern fn hades_permutation(s0: felt252, s1: felt252, s2: felt252) -> (felt252, felt252, felt252) implicits(Poseidon) nopanic;
```

## Poseidon

An extern type representing the Poseidon hash.

```cairo
pub extern type Poseidon;
```

Keccak Hash

# Keccak Hash

The `core::keccak` module provides functions for computing Keccak-256 hashes.

## `cairo_keccak`

Computes the Keccak-256 hash of a byte sequence with custom padding. This function allows hashing arbitrary byte sequences by providing the input as 64-bit words in little-endian format and a final partial word.

**Arguments:**

- `input`: Array of complete 64-bit words in little-endian format.
- `last_input_word`: Final partial word (if any).
- `last_input_num_bytes`: Number of valid bytes in the final word (0-7).

**Returns:**

The 32-byte Keccak-256 hash as a little-endian `u256`.

**Panics:**

Panics if `last_input_num_bytes` is greater than 7.

**Examples:**

```cairo
use core::keccak::cairo_keccak;

// Hash "Hello world!" by splitting into 64-bit words in little-endian
let mut input = array![0x6f77206f6c6c6548]; // a full 8-byte word
let hash = cairo_keccak(ref input, 0x21646c72, 4); // 4 bytes of the last word
assert!(hash == 0xabea1f2503529a21734e2077c8b584d7bee3f45550c2d2f12a198ea908e1d0ec);
```

## `compute_keccak_byte_array`

Computes the Keccak-256 hash of a `ByteArray`.

**Arguments:**

- `arr`: The input bytes to hash.

**Returns:**

The 32-byte Keccak-256 hash as a little-endian `u256`.

**Examples:**

```cairo
use core::keccak::compute_keccak_byte_array;

let text: ByteArray = "Hello world!";
let hash = compute_keccak_byte_array(@text);
assert!(hash == 0xabea1f2503529a21734e2077c8b584d7bee3f45550c2d2f12a198ea908e1d0ec);
```

## Other Keccak Functions

The module also includes:

- `keccak_u256s_le_inputs`: Computes the Keccak-256 hash of multiple `u256` values in little-endian format.
- `keccak_u256s_be_inputs`: Computes the Keccak-256 hash of multiple `u256` values in big-endian format.

SHA-256 Hash

## SHA-256 Hash Functions

Implementation of the SHA-256 cryptographic hash function. This module provides functions to compute SHA-256 hashes of data. The input data can be an array of 32-bit words, or a `ByteArray`.

### `compute_sha256_byte_array`

Computes the SHA-256 hash of the input `ByteArray`.

```cairo
pub fn compute_sha256_byte_array(arr: ByteArray) -> u32; 8]
```

### `compute_sha256_u32_array`

Computes the SHA-256 hash of an array of 32-bit words.

**Arguments:**

- `input` - An array of `u32` values to hash
- `last_input_word` - The final word when input is not word-aligned
- `last_input_num_bytes` - Number of bytes in the last input word (must be less than 4)

**Returns:**
The SHA-256 hash of the `input array` + `last_input_word` as big endian.

**Examples:**

```cairo
use core::sha256::compute_sha256_u32_array;

let hash = compute_sha256_u32_array(array![0x68656c6c], 0x6f, 1);
assert!(hash == [0x2cf24dba, 0x5fb0a30e, 0x26e83b2a, 0xc5b9e29e, 0x1b161e5c, 0x1fa7425e,
0x73043362, 0x938b9824]);
```

```cairo
pub fn compute_sha256_u32_array(mut input: <a href="core-array-Array.html">Array&lt;u32&gt;</a>, last_input_word: <a href="core-integer-u32.html">u32</a>, last_input_num_bytes: <a href="core-integer-u32.html">u32</a>) -> u32; 8]
```

Signature Operations

# cairo-docs Documentation Summary

## Cryptographic Algorithms

### Signature Operations

ECDSA Signature Verification and Recovery

# ECDSA Signature Verification and Recovery

The Elliptic Curve Digital Signature Algorithm (ECDSA) for the STARK curve provides functionalities for signature verification and public key recovery.

The STARK curve has the following parameters:

- Equation: $y^2 \equiv x^3 + \alpha \cdot x + \beta \pmod{p}$
- $\alpha = 1$
- $\beta = 0x6f21413efbe40de150e596d72f7a8c5609ad26c15c915c1f4cdfcb99cee9e89$
- $p = 0x0800000000000011000000000000000000000000000000000000000000000001 = 2^{251} + 17 \cdot 2^{192} + 1$

The generator point is:

- x: $0x1ef15c18599971b7beced415a40f0c7deacfd9b0d1819e03d723d8bc943cfca$
- y: $0x5668060aa49730b7be4801df46ec62de53ecd11abe43a32873000c36e8dc1f$

## ECDSA Signature Verification (`check_ecdsa_signature`)

Verifies an ECDSA signature against a message hash and public key.

**Note:** The verification algorithm implemented slightly deviates from the standard ECDSA. While this does not allow creating valid signatures without the private key, it means the signature algorithm should be modified accordingly. This function validates that `s` and `r` are not 0 or equal to the curve order, but does not check that `r, s < stark_curve::ORDER`, which should be checked by the caller.

**Arguments:**

- `message_hash`: The hash of the signed message.
- `public_key`: The x-coordinate of the signer's public key point on the STARK curve.
- `signature_r`: The r component of the ECDSA signature (x-coordinate of point R).
- `signature_s`: The s component of the ECDSA signature.

**Returns:**

`true` if the signature is valid, `false` otherwise.

**Example:**

```cairo
use core::ecdsa::check_ecdsa_signature;

let message_hash = 0x2d6479c0758efbb5aa07d35ed5454d728637fceab7ba544d3ea95403a5630a8;
let pubkey = 0x1ef15c18599971b7beced415a40f0c7deacfd9b0d1819e03d723d8bc943cfca;
let r = 0x6ff7b413a8457ef90f326b5280600a4473fef49b5b1dcdfcd7f42ca7aa59c69;
let s = 0x23a9747ed71abc5cb956c0df44ee8638b65b3e9407deade65de62247b8fd77;
assert!(check_ecdsa_signature(message_hash, pubkey, r, s));
```

## Public Key Recovery (`recover_public_key`)

Recovers the public key from an ECDSA signature and message hash.

Given a valid ECDSA signature, the original message hash, and the y-coordinate parity of point R, this function recovers the signer's public key. This is useful in scenarios where you need to verify a message has been signed by a specific public key.

**Arguments:**

- `message_hash`: The hash of the signed message.
- `signature_r`: The r component of the ECDSA signature (x-coordinate of point R).
- `signature_s`: The s component of the ECDSA signature.
- `y_parity`: The parity of the y-coordinate of point R (`true` for odd, `false` for even).

**Returns:**

`Some(public_key)` containing the x-coordinate of the recovered public key point if the signature is valid, `None` otherwise.

**Example:**

```cairo
use core::ecdsa::recover_public_key;

let message_hash = 0x503f4bea29baee10b22a7f10bdc82dda071c977c1f25b8f3973d34e6b03b2c;
let signature_r = 0xbe96d72eb4f94078192c2e84d5230cde2a70f4b45c8797e2c907acff5060bb;
let signature_s = 0x677ae6bba6daf00d2631fab14c8acf24be6579f9d9e98f67aa7f2770e57a1f5;
assert!(
    recover_public_key(:message_hash, :signature_r, :signature_s, y_parity: false)
        .unwrap() == 0x7b7454acbe7845da996377f85eb0892044d75ae95d04d3325a391951f35d2ec,
)
```

Ethereum Signature Handling

# Ethereum Signature Handling

Utilities for Ethereum signature verification and address recovery. This module provides functionality for working with Ethereum signatures, including verification against addresses and conversion of public keys to Ethereum addresses.

## Free Functions

### `is_eth_signature_valid`

Validates an Ethereum signature against a message hash and Ethereum address. It returns a `Result` instead of panicking and also verifies that `r` and `s` components are in the range `[1, N)`.

```cairo
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

### `public_key_point_to_eth_address`

Converts a public key point to its corresponding Ethereum address. The Ethereum address is calculated by taking the Keccak-256 hash of the public key coordinates and taking the last 20 big-endian bytes.

```cairo
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

### `verify_eth_signature`

Asserts that an Ethereum signature is valid for a given message hash and Ethereum address. It also verifies that the `r` and `s` components of the signature are in the range `[1, N)`, where N is the size of the curve.

Panics if the signature components are out of range or if the recovered address does not match the provided address.

```cairo
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

Circuit Definition and Evaluation

Circuit Definition and Core Components

# Circuit Definition and Core Components

## CircuitElement

`CircuitElement<T>` is a generic wrapper for circuit components, used to construct circuits. It wraps inputs and gates, enabling composition through arithmetic operations. The type parameter `T` specifies the element's role.

```cairo
pub struct CircuitElement<T> {}
```

### Implementations

- `CircuitElementCopy`: Implements the `Copy` trait for `CircuitElement<T>`.
- `CircuitElementDrop`: Implements the `Drop` trait for `CircuitElement<T>`.

## CircuitDefinition

`CircuitDefinition<CES>` is a trait for defining a circuit's structure and behavior, including its inputs, gates, and outputs. `CES` represents a tuple of `CircuitElement`s defining the circuit's structure.

```cairo
pub trait CircuitDefinition<CES>
```

### Trait types

#### CircuitType

The internal circuit type, representing a tuple of `CircuitElement`s.

```cairo
type CircuitType;
```

## Circuit

`Circuit<Outputs>` creates a circuit from a tuple of outputs, representing a complete circuit instance. The `Outputs` type parameter defines the structure of the circuit's outputs.

```cairo
pub extern type Circuit<Outputs>;
```

## AddMod

`AddMod` is a builtin type for modular addition operations.

```cairo
pub extern type AddMod;
```

## AddInputResultTrait

This trait provides methods for managing circuit inputs.

### `next`

Adds an input value to the circuit and returns the updated `AddInputResult`.

```cairo
fn next<C, C, Value, +IntoCircuitInputValue<Value>, +Drop<Value>>(
    self: AddInputResult<C>, value: Value,
) -> AddInputResult<C>
```

### `done`

Finalizes the input process and returns the circuit data. Panics if not all required inputs have been filled.

```cairo
fn done<C, C>(self: AddInputResult<C>) -> CircuitData<C>
```

## CircuitInput

`CircuitInput<N>` defines an input for a circuit, indexed by `N`. Each input must be assigned a value before circuit evaluation.

## CircuitModulus

`CircuitModulus` is a type usable as a circuit modulus (a `u384` that is not zero or one), defining the finite field for operations.

## u96

A 96-bit unsigned integer type used as a basic building block for multi-limb arithmetic.

```cairo
pub type u96 = BoundedInt<0, 79228162514264337593543950335>;
```

## Basic Arithmetic Example

Demonstrates modular arithmetic operations: `(a + b) * c mod p`.

```cairo
use core::circuit::{
   CircuitElement, EvalCircuitTrait, CircuitOutputsTrait, CircuitInput, CircuitModulus,
   AddInputResultTrait, CircuitInputs, circuit_add, circuit_mul,
};

// Compute (a + b) * c mod p
let a = CircuitElement::<CircuitInput<0>> {};
let b = CircuitElement::<CircuitInput<1>> {};
let c = CircuitElement::<CircuitInput<2>> {};

let sum = circuit_add(a, b);
let result = circuit_mul(sum, c);

// Evaluate with inputs [3, 6, 2] modulo 7
let modulus = TryInto::<_, CircuitModulus>::try_into([7, 0, 0, 0]).unwrap();
let outputs = (result,)
    .new_inputs()
    .next([3, 0, 0, 0])
    .next([6, 0, 0, 0])
    .next([2, 0, 0, 0])
    .done()
    .eval(modulus)
    .unwrap();

// Result: (3 + 6) * 2 mod 7 = 4
assert!(outputs.get_output(result) == 4.into());
```

Circuit Input Management

### Circuit Input Management

The `AddInputResult` enum tracks the state of the circuit input filling process.

<pre><code class="language-cairo">pub enum AddInputResult {
    Done: CircuitData&lt;C&gt;,
    More: CircuitInputAccumulator&lt;C&gt;,
}</code></pre>

#### `AddInputResult` Variants

- **`Done`**: Indicates all inputs have been provided, returning `CircuitData`.
- **`More`**: Signifies that more inputs are required, returning `CircuitInputAccumulator`.

#### `AddInputResultTrait`

This trait provides functionality to manage circuit inputs.

##### `next` Function

This function adds an input value to the circuit instance.

- **Arguments**: `value` - The input value to add.
- **Returns**: A new `AddInputResult` which can be used to add further inputs or finalize the process.
- **Panics**: If all inputs have already been filled.

Circuit Arithmetic Operations

### circuit_add

Combines two circuit elements using modular addition.

#### Arguments

- `lhs` - Left-hand side circuit element
- `rhs` - Right-hand side circuit element

#### Returns

A new circuit element representing `(lhs + rhs) mod p`

#### Examples

```cairo
let a = CircuitElement::<CircuitInput<0>> {};
let b = CircuitElement::<CircuitInput<1>> {};
let sum = circuit_add(a, b);
```

```cairo
pub fn circuit_add<Lhs, Rhs, +CircuitElementTrait<Lhs>, +CircuitElementTrait<Rhs>>(
    lhs: CircuitElement<Lhs>, rhs: CircuitElement<Rhs>,
) -> CircuitElement<AddModGate<Lhs, Rhs>>
```

### circuit_sub

Combines two circuit elements using modular subtraction.

#### Arguments

- `lhs` - Left-hand side circuit element (minuend)
- `rhs` - Right-hand side circuit element (subtrahend)

#### Returns

A new circuit element representing `(lhs - rhs) mod p`

#### Examples

```cairo
let a = CircuitElement::<CircuitInput<0>> {};
let b = CircuitElement::<CircuitInput<1>> {};
let diff = circuit_sub(a, b);
```

```cairo
pub fn circuit_sub<Lhs, Rhs, +CircuitElementTrait<Lhs>, +CircuitElementTrait<Rhs>>(
    lhs: CircuitElement<Lhs>, rhs: CircuitElement<Rhs>,
)
```

### circuit_inverse

Computes the multiplicative inverse modulo p of an input circuit element.

#### Arguments

- `input` - Circuit element to compute the inverse of

#### Returns

A new circuit element representing `input^(-1) mod p`

#### Examples

```cairo
let a = CircuitElement::<CircuitInput<0>> {};
let inv_a = circuit_inverse(a);
```

```cairo
pub fn circuit_inverse<Input, +CircuitElementTrait<Input>>(
    input: CircuitElement<Input>,
) -> CircuitElement<InverseGate<Input>>
```

### circuit_mul

Combines two circuit elements using modular multiplication.

#### Arguments

- `lhs` - Left-hand side circuit element
- `rhs` - Right-hand side circuit element

#### Returns

A new circuit element representing `(lhs * rhs) mod p`

#### Examples

```cairo
let a = CircuitElement::<CircuitInput<0>> {};
let b = CircuitElement::<CircuitInput<1>> {};
let product = circuit_mul(a, b);
```

```cairo
pub fn circuit_mul<Lhs, Rhs, +CircuitElementTrait<Lhs>, +CircuitElementTrait<Rhs>>(
    lhs: CircuitElement<Lhs>, rhs: CircuitElement<Rhs>,
) -> CircuitElement<MulModGate<Lhs, Rhs>>
```

Circuit Evaluation and Modulus

# Circuit Evaluation and Modulus

The `EvalCircuitTrait` defines the interface for evaluating circuits with a given modulus.

## EvalCircuitTrait

This trait is implemented for circuits that can be evaluated.

### eval

Evaluates the circuit with the given modulus.

- **Arguments**:
  - `modulus`: The modulus to use for arithmetic operations.
- **Returns**:
  - A `Result` containing either the circuit outputs or a failure indication.

```cairo
fn eval<C, C>(
    self: CircuitData<C>, modulus: CircuitModulus,
) -> Result<CircuitOutputs<C>, (CircuitPartialOutputs<C>, CircuitFailureGuarantee)>
```

### eval_ex

Evaluates the circuit with an explicit descriptor and modulus.

- **Arguments**:
  - `descriptor`: The circuit descriptor.
  - `modulus`: The modulus to use for arithmetic operations.
- **Returns**:
  - A `Result` containing either the circuit outputs or a failure indication.

```cairo
fn eval_ex<C, C>(
    self: CircuitData<C>, descriptor: CircuitDescriptor<C>, modulus: CircuitModulus,
) -> Result<CircuitOutputs<C>, (CircuitPartialOutputs<C>, CircuitFailureGuarantee)>
```

Core Traits and Types for Circuits

# Core Traits and Types for Circuits

## CircuitElementTrait

A marker trait used to identify valid circuit components, including inputs and gates. It ensures type safety when composing circuit elements.

```cairo
pub trait CircuitElementTrait<T>
```

## CircuitInput

Defines an input for a circuit, indexed by `N`. Each input must be assigned a value before circuit evaluation.

```cairo
pub extern type CircuitInput<const N>;
```

## CircuitInputs

A trait for initializing a circuit with inputs. It provides a method to create a new input accumulator.

### new_inputs

Initializes a new circuit instance with inputs.

```cairo
fn new_inputs<CES, CES, impl CD: CircuitDefinition<CES>, +Drop<CES>>(
    self: CES,
) -> AddInputResult<CircuitType>
```

## CircuitModulus

A type representing a modulus for a circuit, which must be a non-zero, non-one 384-bit number. This typically is a prime number for cryptographic applications.

```cairo
pub extern type CircuitModulus;
```

## CircuitOutputsTrait

A trait for retrieving output values from a circuit evaluation. It provides a method to access specific output values.

### get_output

Gets the output value for a specific circuit element.

```cairo
fn get_output<Outputs, OutputElement, Outputs, OutputElement>(
    self: Outputs, output: OutputElement,
) -> u384
```

## u384

A 384-bit unsigned integer type used for circuit values.

```cairo
#[derive(Copy, Drop, Debug, PartialEq)]
pub struct u384 {
    pub limb0: BoundedInt<0, 79228162514264337593543950335>,
```

Starknet Contract Development

Starknet Contract Development Fundamentals

# Starknet Contract Development Fundamentals

Cairo provides a rich set of modules for Starknet contract development, covering various functionalities from basic data structures to advanced cryptographic operations and Starknet-specific interactions.

## Core Cairo Modules

The `core` module encompasses fundamental data types and utilities:

### Data Structures

- `array`: Dynamic data structures for storing and managing sequences of values.
- `dict`: Key-value storage structures.
- `option`: Represents optional values.
- `result`: Used for error handling.

### Numerical and Mathematical Modules

- `integer`: Fixed-size integer operations (e.g., `u8`, `u16`, `u32`, `u64`).
- `math`: Core mathematical functions.
- `ops`: Arithmetic and logical operators.
- `num`: Numeric utilities and traits.
- `cmp`: Comparisons and ordering.

### Cryptography and Hashing

- `hash`: Generic hash utilities.
- `poseidon`, `pedersen`, `keccak`, `sha256`: Cryptographic hash functions.
- `ecdsa`: Signature verification and elliptic curve cryptography.

### Other Utilities

- `debug`: Debugging tools.
- `fmt`: String formatting utilities.
- `serde`: Serialization and deserialization.
- `metaprogramming`: Advanced compile-time utilities.
- `zeroable`: Zero-initialized types.

## Starknet-Specific Modules

These modules provide essential functionalities for interacting with the Starknet network:

### Starknet Core Utilities

- `starknet`: Essential utilities for writing smart contracts.
- `syscalls`: Low-level Starknet system interactions.
- `storage`: On-chain storage management.
- `event`: Emitting events for contract execution tracking.
- `contract_address`: Starknet contract address utilities.
- `account`: Account contract functionality.

### Key Starknet Types and Traits

#### `Call`

Represents a call to a contract, with fields for the target contract address, entry point selector, and calldata.

```cairo
#[derive(Drop, Copy, Serde, Debug)]
pub struct Call {
    pub to: ContractAddress,
    pub selector: felt252,
    pub calldata: Span<felt252>,
}
```

#### `AccountContract`

A trait for account contracts that support class declarations. It defines mandatory entry points `__validate__` and `__execute__`.

```cairo
pub trait AccountContract<TContractState>
```

##### `__validate_declare__`

Checks if the account is willing to pay for a class declaration.

```cairo
fn __validate_declare__<TContractState, TContractState>(
    self: @TContractState, class_hash: felt252,
) -> felt252
```

##### `__validate__`

Checks if the account is willing to pay for executing a set of calls.

```cairo
fn __validate__<TContractState, TContractState>(
    ref self: TContractState, calls: Array<Call>,
) -> felt252
```

##### `__execute__`

Executes a given set of calls.

```cairo
fn __execute__<TContractState, TContractState>(
    ref self: TContractState, calls: Array<Call>,
) -> Array<Span<felt252>>
```

#### `AccountContractDispatcher`

A dispatcher for interacting with account contracts.

```cairo
#[derive(Copy, Drop, Serde)]
pub struct AccountContractDispatcher {
    pub contract_address: ContractAddress,
}
```

#### `AccountContractDispatcherTrait`

Trait functions for `AccountContractDispatcher`.

```cairo
pub trait AccountContractDispatcherTrait<T>
```

##### `__validate_declare__`

```cairo
fn __validate_declare__<T, T>(self: T, class_hash: felt252) -> felt252
```

##### `__validate__`

```cairo
fn __validate__<T, T>(self: T, calls: Array<Call>) -> felt252
```

##### `__execute__`

```cairo
fn __execute__<T, T>(self: T, calls: Array<Call>) -> Array<Span<felt252>>
```

#### `AccountContractSafeDispatcher`

A safer dispatcher for account contracts.

```cairo
#[derive(Copy, Drop, Serde)]
pub struct AccountContractSafeDispatcher {
    pub contract_address: ContractAddress,
}
```

#### `AccountContractSafeDispatcherTrait`

Trait functions for `AccountContractSafeDispatcher`.

```cairo
pub trait AccountContractSafeDispatcherTrait<T>
```

##### `__validate_declare__`

```cairo
fn __validate_declare__<T, T>(self: T, class_hash: felt252) -> Result<felt252, Array<felt252>>
```

##### `__validate__`

```cairo
fn __validate__<T, T>(self: T, calls: Array<Call>) -> Result<felt252, Array<felt252>>
```

##### `__execute__`

```cairo
fn __execute__<T, T>(self: T, calls: Array<Call>) -> Result<Array<Span<felt252>>, Array<felt252>>
```

#### `BlockInfo`

Information about the current block.

```cairo
#[derive(Copy, Drop, Debug, Serde)]
pub struct BlockInfo {
    pub block_number: u64,
    pub block_timestamp: u64,
    pub sequencer_address: ContractAddress,
}
```

##### `block_number`

The number (height) of this block.

```cairo
pub block_number: u64
```

##### `block_timestamp`

The time the sequencer began building the block, in seconds since the Unix epoch.

```cairo
pub block_timestamp: u64
```

##### `sequencer_address`

The Starknet address of the block's sequencer.

```cairo
pub sequencer_address: ContractAddress
```

#### `ContractAddress`

Represents a Starknet contract address, with a value range of `[0, 2**251)`.

```cairo
pub extern type ContractAddress;
```

##### `contract_address_const`

Returns a `ContractAddress` given a `felt252` value.

```cairo
use starknet::contract_address::contract_address_const;

let contract_address = contract_address_const::<0x0>();
```

```cairo
pub extern fn contract_address_const() -> ContractAddress nopanic;
```

#### `EthAddress`

An Ethereum address, 20 bytes in length.

```cairo
#[derive(Copy, Drop, Hash, PartialEq)]
pub struct EthAddress {
    address: felt252,
}
```

#### `Event`

A trait for handling serialization and deserialization of events.

```cairo
pub trait Event<T>
```

##### `append_keys_and_data`

Serializes the keys and data for event emission.

```cairo
fn append_keys_and_data<T, T>(self: @T, ref keys: Array<felt252>, ref data: Array<felt252>)
```

##### `deserialize`

Deserializes event keys and data back into the original event structure.

```cairo
fn deserialize<T, T>(ref keys: Span<felt252>, ref data: Span<felt252>) -> Option<T>
```

#### `EventEmitter`

A trait for emitting Starknet events.

```cairo
pub trait EventEmitter<T, TEvent>
```

##### `emit`

Emits an event.

```cairo
fn emit<T, TEvent, T, TEvent, S, +Into<S, TEvent>>(ref self: T, event: S)
```

### Useful Functions

#### `compute_sha256_byte_array`

Computes the SHA-256 hash of the input `ByteArray`.

```cairo
use core::sha256::compute_sha256_byte_array;

let data = "Hello";
let hash = compute_sha256_byte_array(@data);
assert!(hash == [0x185f8db3, 0x2271fe25, 0xf561a6fc, 0x938b2e26, 0x4306ec30, 0x4eda5180,
0x7d17648, 0x26381969]);
```

#### `SyscallResultTrait::unwrap_syscall`

Unwraps a syscall result, yielding the content of an `Ok`, or panics with the syscall error message if it's an `Err`.

```cairo
let result = starknet::syscalls::get_execution_info_v2_syscall();
let info = result.unwrap_syscall();
```

#### `get_block_info`

Returns the block information for the current block.

```cairo
// Example usage would go here, but the chunk only provides the function signature context.
```

#### `is_eth_signature_valid`

Validates an Ethereum signature against a message hash and Ethereum address.

```cairo
// Example usage would go here, but the chunk only provides the function signature context.
```

## Constants

- `starknet::VALIDATED`: The expected return value of a Starknet account's `__validate__` function in case of success.

```cairo
pub const VALIDATED: felt252 = 370462705988;
```

Interacting with the Starknet Environment

# Interacting with the Starknet Environment

This module provides access to runtime information about the current transaction, block, and execution context in a Starknet smart contract. It enables contracts to access execution context data.

## Getting Block Information

The `starknet::get_block_info()` function retrieves information about the current block.

```cairo
use starknet::get_block_info;

let block_info = get_block_info().unbox();

let block_number = block_info.block_number;
let block_timestamp = block_info.block_timestamp;
let sequencer = block_info.sequencer_address;
```

### `get_block_number()`

Returns the number of the current block.

```cairo
use starknet::get_block_number;

let block_number = get_block_number();
```

### `get_block_timestamp()`

Returns the timestamp of the current block.

```cairo
use starknet::get_block_timestamp;

let block_timestamp = get_block_timestamp();
```

## Getting Execution Context

### `get_caller_address()`

Returns the address of the caller contract. It returns `0` if there is no caller (e.g., when a transaction begins execution inside an account contract).

Note: This function returns the direct caller. For the account that initiated the transaction, use `get_execution_info().tx_info.unbox().account_contract_address`.

```cairo
use starknet::get_caller_address;

let caller = get_caller_address();
```

### `get_contract_address()`

Returns the address of the contract being executed.

```cairo
use starknet::get_contract_address;

let contract_address = get_contract_address();
```

### `get_execution_info()`

Returns the execution info for the current execution.

```cairo
use starknet::get_execution_info;

let execution_info = get_execution_info().unbox();

// Access various execution context information
let caller = execution_info.caller_address;
let contract = execution_info.contract_address;
let selector = execution_info.entry_point_selector;
```

## Getting Transaction Information

### `get_tx_info()`

Returns the transaction information for the current transaction.

```cairo
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

## Class Hash and Contract Address

### `class_hash_const`

The `class_hash_const` function returns a `ClassHash` given a `felt252` value.

```cairo
use starknet::class_hash::class_hash_const;

let class_hash = class_hash_const::<0x123>();
```

The `ClassHash` type represents a Starknet contract class hash, with a value range of `[0, 2**251)`.

### `ContractAddress`

The `ContractAddress` type represents a Starknet contract address, with a value range of `[0, 2**251)`.

### `contract_address_const`

Returns a `ContractAddress` given a `felt252` value.

## Extended Execution Info (v2)

The `v2::ExecutionInfo` struct provides extended execution information, including `v2::TxInfo`.

### `v2::ExecutionInfo`

```cairo
#[derive(Copy, Drop, Debug)]
pub struct ExecutionInfo {
    pub block_info: Box<BlockInfo>,
    pub tx_info: Box<TxInfo>,
    pub caller_address: ContractAddress,
    pub contract_address: ContractAddress,
    pub entry_point_selector: felt252,
}
```

### `v2::TxInfo`

This struct contains extended transaction information, including fields for V3 transactions like `resource_bounds`, `tip`, `paymaster_data`, `nonce_data_availability_mode`, `fee_data_availability_mode`, and `account_deployment_data`.

```cairo
#[derive(Copy, Drop, Debug, Serde)]
pub struct TxInfo {
    pub version: felt252,
    pub account_contract_address: ContractAddress,
    pub max_fee: u128,
    pub signature: Span<felt252>,
    pub transaction_hash: felt252,
    pub chain_id: felt252,
    pub nonce: felt252,
    pub resource_bounds: Span<ResourceBounds>,
    pub tip: u128,
    pub paymaster_data: Span<felt252>,
    pub nonce_data_availability_mode: u32,
    pub fee_data_availability_mode: u32,
    pub account_deployment_data: Span<felt252>,
}
```

### `v2::ResourceBounds`

Used for V3 transactions to specify resource limits.

```cairo
#[derive(Copy, Drop, Debug, Serde)]
pub struct ResourceBounds {
    pub resource: felt252,
    pub max_amount: u64,
    pub max_price_per_unit: u128,
}
```

Starknet Contract Storage: Core Concepts

# Starknet Contract Storage: Core Concepts

## StoragePath

An intermediate struct used to store a hash state, enabling the hashing of multiple values to determine a final storage address. It contains a `__hash_state__` member.

```cairo
pub struct StoragePath<T> {
    __hash_state__: HashState,
}
```

## StoragePointer

A pointer to a specific address in storage, used for reading and writing values. It comprises a base address and an offset.

```cairo
pub struct StoragePointer<T> {
    pub __storage_pointer_address__: StorageBaseAddress,
    pub __storage_pointer_offset__: u8,
}
```

`StoragePointer0Offset` is an optimized version with an offset of 0.

## StorageBase

A struct that holds an address to initialize a storage path. Its members (or accessible members via `deref`) are either `StorageBase` or `FlattenedStorage` instances.

```cairo
pub struct StorageBase<T> {
    pub __base_address__: felt252,
}
```

## Storage Collections

Starknet contract storage exclusively uses `Map` and `Vec` for collections. Memory collections like `Felt252Dict` and `Array` cannot be used directly in storage.

## The `Store` Trait

The `Store` trait enables types to be stored in and retrieved from Starknet's contract storage. Most primitive types implement this trait. Custom types can derive it using `#[derive(Drop, starknet::Store)]`, provided they do not contain collections.

```cairo
pub trait Store<T>
```

It provides functions for reading and writing values, with or without offsets, and for determining a type's storage size.

## Storage Nodes

`StorageNode` and `StorageNodeMut` traits are used to structure contract storage data. They generate a storage node from a storage path, reflecting the data's structure in address computation. For members within a storage node, the address is computed using a hash chain: `h(sn_keccak(variable_name), sn_keccak(member_name))`.

## SubPointers

For structs stored sequentially in storage, `SubPointers` and `SubPointersMut` traits provide access to members at an offset from the struct's base address, unlike storage nodes where members are accessed via hashed paths.

## Address Calculation

Storage addresses are calculated deterministically:

- **Single value**: `sn_keccak` hash of the variable name.
- **Composite types**: `sn_keccak` hash of the variable name for the base address, followed by sequential storage of members.
- **Storage nodes**: A chain of hashes representing the node structure.
- **`Map`/`Vec`**: Relative to the storage base address, combined with keys or indices.

## Mutable Access

The `Mutable<T>` wrapper indicates mutable access to storage. Traits like `StorageNodeMut`, `SubPointersMut`, and `StorageTraitMut` facilitate mutable operations.

## Lazy Evaluation

`PendingStoragePath` is utilized for the lazy evaluation of storage paths, particularly within storage nodes, meaning storage addresses are computed only when members are accessed.

Starknet Storage Data Structures: Maps and Vectors

# Starknet Storage Data Structures: Maps and Vectors

Starknet contracts utilize persistent key-value stores and dynamic arrays for data storage.

## Map

A `Map` is a persistent key-value store in contract storage. It is a compile-time type used to provide type information for the compiler, as it cannot be instantiated directly. Actual storage operations are handled by `StorageMapReadAccess`, `StorageMapWriteAccess`, and `StoragePathEntry` traits.

```cairo
#[phantom]
pub struct Map<K, V> {}
```

### Interacting with `Map`

Maps can be accessed directly using `StorageMapReadAccess` and `StorageMapWriteAccess`, or through path-based access using `StoragePathEntry`.

- **Direct Access:**

  - `StorageMapReadAccess`: Provides direct read access.
    ```cairo
    // Read from single mapping
    let balance = self.balances.read(address);
    // Read from nested mapping
    let allowance = self.allowances.entry(owner).read(spender);
    ```
  - `StorageMapWriteAccess`: Provides direct write access.
    ```cairo
    // Write to single mapping
    self.balances.write(address, 100);
    // Write to nested mapping
    self.allowances.entry(owner).write(spender, 50);
    ```

- **Path-based Access:**
  - `StoragePathEntry`: Computes storage paths for map entries.
    ```cairo
    // Get the storage path for the balance of a specific address
    let balance_path = self.balances.entry(address);
    ```

### Storage Address Computation

Storage addresses are computed using hash functions:

- Single key: `address = h(sn_keccak(variable_name), k) mod N`
- Nested keys: `address = h(h(...h(h(sn_keccak(variable_name), k₁), k₂)...), kₙ) mod N`

## Vec

A `Vec` represents a dynamic array in contract storage, persisting data on-chain. It consists of the vector length at the base address and elements stored at `h(base_address, index)`.

### Interacting with `Vec`

Vectors can be accessed via `VecTrait` (read-only) and `MutableVecTrait` (mutable).

- **Read-only Access (`VecTrait`):**

  - `len()`: Returns the number of elements.
    ```cairo
    fn is_empty(self: @ContractState) -> bool {
        self.numbers.len() == 0
    }
    ```

- **Mutable Access (`MutableVecTrait`):**
  - `get(index)`: Returns a mutable storage path to the element at the specified index.
    ```cairo
    fn set_number(ref self: ContractState, index: u64, number: u256) -> bool {
        if let Some(ptr) = self.numbers.get(index) {
            ptr.write(number);
            true
        } else {
            false
        }
    }
    ```
  - `at(index)`: Returns a mutable storage path to the element at the specified index (panics if out of bounds).
    ```cairo
    fn set_number(ref self: ContractState, index: u64, number: u256) {
        self.numbers.at(index).write(number);
    }
    ```
  - `append()`: Returns a mutable storage path to write a new element at the end.
    ```cairo
    fn push_number(ref self: ContractState, number: u256) {
        self.numbers.append().write(number);
    }
    ```
  - `allocate()`: Allocates space for a new element at the end, returning a mutable storage path (preferred over deprecated `append`).

### Storage Layout

- Vector length: Stored at the base storage address (`sn_keccak(variable_name)`).
- Elements: Stored at addresses computed as `h(base_address, index)`.

### Examples

Basic usage:

```cairo
use starknet::storage::{Vec, VecTrait, MutableVecTrait, StoragePointerReadAccess,
StoragePointerWriteAccess};

#[storage]
struct Storage {
    numbers: Vec<u256>,
}

fn store_number(ref self: ContractState, number: u256) {
    // Append new number
    self.numbers.push(number);

    // Read first number
    let first = self.numbers[0].read();

    // Get current length
    let size = self.numbers.len();
}
```

Loading numbers into a memory array:

```cairo
use starknet::storage::{Vec, VecTrait, StoragePointerReadAccess};

fn to_array(self: @ContractState) -> Array<u256> {
    let mut arr = array![];

    let len = self.numbers.len();
    for i in 0..len {
        arr.append(self.numbers[i].read());
    }
    arr
}
```

Memory Management and Utilities

Gas Management Utilities

# Gas Management Utilities

## Gas Builtin and Reserves

- **`GasBuiltin`**: This type handles gas in Cairo code and stores the available gas.
- **`GasReserve`**: Represents a gas reserve that can be created and utilized.

## Gas Management Functions

### Withdrawing Gas

- **`withdraw_gas`**: Withdraws gas from `GasBuiltin` for success case flow. Returns `Some(())` if sufficient gas, otherwise `None`.
- **`withdraw_gas_all`**: Similar to `withdraw_gas`, but accepts `BuiltinCosts` for optimization.

### Redepositing Gas

- **`redeposit_gas`**: Returns unused gas back to the `GasBuiltin`.

### Accessing Builtin Costs

- **`get_builtin_costs`**: Returns the `BuiltinCosts` table for use with `withdraw_gas_all`.

### Gas Reserve Operations

- **`gas_reserve_create`**: Creates a new gas reserve by withdrawing gas from the counter. Returns `Some(GasReserve)` if successful, otherwise `None`.
- **`gas_reserve_utilize`**: Adds gas from a reserve back to the gas counter, consuming the reserve.

## Extern Types

- **`BuiltinCosts`**: Represents the table of costs for different builtin usages.

Memory Management and Utilities

# Memory Management and Utilities

This section details utilities related to memory management and internal functions within the Cairo documentation.

## Extern Functions

### `require_implicit`

This function enforces the use of `Implicit` by the calling function. It is an extern function not mapped to a Sierra function and is removed during compilation.

```cairo
pub extern fn require_implicit() implicits(Implicit) nopanic;
```

### `revoke_ap_tracking`

This is an extern function used for revoking AP tracking.

```cairo
pub extern fn revoke_ap_tracking() nopanic;
```

## Structs

### `DropWith`

A wrapper type that ensures a type `T` is dropped using a specific `Drop` implementation.

### `InferDrop`

A helper type that provides the same interface as `DropWith` while inferring the `Drop` implementation.

### `DestructWith`

A wrapper type that ensures a type `T` is destructed using a specific `Destruct` implementation.

### `InferDestruct`

A helper type that provides the same interface as `DestructWith` while inferring the `Destruct` implementation.

Panic Handling

# Panic Handling

## panic_with_byte_array

Panics with a `ByteArray` message. Constructs a panic message by prepending the `BYTE_ARRAY_MAGIC` value and serializing the provided `ByteArray` into the panic data.

### Examples

```cairo
use core::panics::panic_with_byte_array;

let error_msg = "An error occurred";
panic_with_byte_array(@error_msg);
```

The fully qualified path is `core::panics::panic_with_byte_array`.

## General Panic Mechanism

The `core::panics` module provides the core panic functionality for error handling in Cairo. It defines types and functions to trigger and manage panics, which are used for unrecoverable errors.

Panics can be triggered in several ways:

- Using the `panic` function:

  ```cairo
  use core::panics::panic;

  panic(array!['An error occurred']);
  ```

- Using the `panic!` macro:
  ```cairo
  panic!("Panic message");
  ```
  This macro internally converts the message into a `ByteArray` and uses `panic_with_byte_array`.

The fully qualified path for the module is `core::panics`.

Core Traits

### DivEq

#### `div_eq`

Performs a division equality operation.

<pre><code class="language-cairo">fn div_eq&lt;T, T&gt;(ref self: T, other: T)</code></pre>

### DivRem

Performs truncated division and remainder, returning both the quotient and remainder in a single operation. The division truncates towards zero.

#### `div_rem`

Performs the `/` and the `%` operations, returning both the quotient and remainder.

##### Examples

```cairo
assert!(DivRem::div_rem(7_u32, 3) == (2, 1));
```

```cairo
assert!(DivRem::div_rem(12_u32, 10) == (1, 2));
```

### Drop

A trait for types that can be safely dropped when they go out of scope.

#### Deriving

This trait can be automatically derived using `#[derive(Drop)]`. Most basic types implement `Drop` by default, except for `Felt252Dict`.

#### Examples

Without `Drop`:

```cairo
struct Point {
    x: u128,
    y: u128,
}

fn foo(p: Point) {} // Error: `p` cannot be dropped
```

With `Drop`:

```cairo
#[derive(Drop)]
struct Point {
    x: u128,
    y: u128,
}

fn foo(p: Point) {} // OK: `p` is dropped at the end of the function
```

Iterators and Collections

The `Iterator` Trait and its Core Functionality

# The `Iterator` Trait and its Core Functionality

## `Iterator` Trait

The `Iterator` trait is the core of composable external iteration. It defines how to iterate over a sequence of elements.

<pre><code class="language-cairo">pub trait Iterator&lt;T&gt;</code></pre>

### `next`

Advances the iterator and returns the next value. Returns `None` when iteration is finished.

#### Examples

```cairo
let mut iter = [1, 2, 3].span().into_iter();

// A call to next() returns the next value...
assert_eq!(Some(@1), iter.next());
assert_eq!(Some(@2), iter.next());
assert_eq!(Some(@3), iter.next());

// ... and then None once it's over.
assert_eq!(None, iter.next());

// More calls may or may not return `None`. Here, they always will.
assert_eq!(None, iter.next());
assert_eq!(None, iter.next());
```

<pre><code class="language-cairo">fn next&lt;T, T&gt;(ref self: T) -&gt; <a href="core-option-Option.html">Option&lt;Iterator&lt;T&gt;Item&gt;</a></code></pre>

### `count`

Consumes the iterator, counting the number of iterations and returning it.

#### Overflow Behavior

The method does no guarding against overflows, so counting elements of an iterator with more than [`Bounded::<usize>::MAX`](./core-num-traits-bounded-Bounded.md) elements either produces the wrong result or panics.

#### Panics

This function might panic if the iterator has more than [`Bounded::<usize>::MAX`](./core-num-traits-bounded-Bounded.md) elements.

#### Examples

```cairo
let mut a = array![1, 2, 3].into_iter();
assert_eq!(a.count(), 3);

let mut a = array![1, 2, 3, 4, 5].into_iter();
assert_eq!(a.count(), 5);
```

<pre><code class="language-cairo">fn count&lt;T, T, +Destruct&lt;T&gt;, +Destruct&lt;Self::Item&gt;&gt;(self: T) -&gt; <a href="core-integer-u32.html">u32</a></code></pre>

### `last`

Consumes the iterator, returning the last element.

#### Examples

```cairo
let mut a = array![1, 2, 3].into_iter();
assert_eq!(a.last(), Option::Some(3));

let mut a = array![].into_iter();
assert_eq!(a.last(), Option::None);
```

<pre><code class="language-cairo">fn last&lt;T, T, +Destruct&lt;T&gt;, +Destruct&lt;Self::Item&gt;&gt;(self: T) -&gt; <a href="core-option-Option.html">Option&lt;Iterator&lt;T&gt;Item&gt;</a></code></pre>

### `advance_by`

Advances the iterator by `n` elements.

`advance_by(n)` will return `Ok(())` if the iterator successfully advances by `n` elements, or a `Err(NonZero<usize>)` with value `k` if `None` is encountered, where `k` is remaining number of steps that could not be advanced because the iterator ran out.

#### Examples

```cairo
let mut iter = array![1_u8, 2, 3, 4].into_iter();

assert_eq!(iter.advance_by(2), Ok(()));
assert_eq!(iter.next(), Some(3));
assert_eq!(iter.advance_by(0), Ok(()));
assert_eq!(iter.advance_by(100), Err(99));
```

<pre><code class="language-cairo">fn advance_by&lt;T, T, +Destruct&lt;T&gt;, +Destruct&lt;Self::Item&gt;&gt;(
    ref self: T, n: <a href="core-integer-u32.html">u32</a>,
) -&gt; <a href="core-result-Result.html">Result&lt;(), NonZero&lt;u32&gt;&gt;</a></code></pre>

### `nth`

Returns the `n`th element of the iterator.

Note that all preceding elements, as well as the returned element, will be consumed from the iterator. `nth()` will return `None` if `n` is greater than or equal to the length of the iterator.

#### Examples

Basic usage:

```cairo
let mut iter = array![1, 2, 3].into_iter();
assert_eq!(iter.nth(1), Some(2));
```

Calling `nth()` multiple times doesn't rewind the iterator:

```cairo
let mut iter = array![1, 2, 3].into_iter();

assert_eq!(iter.nth(1), Some(2));
assert_eq!(iter.nth(1), None);
```

<pre><code class="language-cairo">fn nth&lt;T, T, +Destruct&lt;T&gt;, +Destruct&lt;Self::Item&gt;&gt;(
    ref self: T, n: u32,
) -&gt; <a href="core-option-Option.html">Option&lt;Iterator&lt;T&gt;Item&gt;</a></code></pre>

### `fold`

Applies a closure to an accumulator and each element of the iterator, returning the final accumulator value.

#### Examples

```cairo
let mut iter = array![1, 2, 3].into_iter();

// the sum of all of the elements of the array
let sum = iter.fold(0, |acc, x| acc + x);

assert_eq!(sum, 6);
```

```cairo
let mut numbers = array![1, 2, 3, 4, 5].span();

let mut result = 0;

// for loop:
for i in numbers{
    result = result + (*i);
};

// fold:
let mut numbers_iter = numbers.into_iter();
let result2 = numbers_iter.fold(0, |acc, x| acc + (*x));

// they're the same
assert_eq!(result, result2);
```

<pre><code class="language-cairo">fn fold&lt;
    T,
    T,
    B,
    F,
    +core::ops::Fn&lt;F, (B, Self::Item)&gt;[Output: B],
    +Destruct&lt;T&gt;,
    +Destruct&lt;F&gt;,
    +Destruct&lt;B&gt;,
&gt;(
    ref self: T, init: B, f: F,
) -&gt; B</code></pre>

### `any`

Tests if any element of the iterator matches a predicate. Short-circuits on the first `true`.

#### Examples

```cairo
assert!(array![1, 2, 3].into_iter().any(|x| x == 2));

assert!(!array![1, 2, 3].into_iter().any(|x| x > 5));
```

<pre><code class="language-cairo">fn any&lt;
    T,
    T,
    P,
    +core::ops::Fn&lt;P, (Self::Item,)&gt;[Output: bool],
    +Destruct&lt;P&gt;,
    +Destruct&lt;T&gt;,
    +Destruct&lt;Self::Item&gt;,
&gt;(
    ref self: T, predicate: P,
) -&gt; <a href="core-bool.html">bool</a></code></pre>

### `all`

Tests if every element of the iterator matches a predicate. Short-circuits on the first `false`.

#### Examples

```cairo
assert!(array![1, 2, 3].into_iter().all(|x| x > 0));

assert!(!array![1, 2, 3].into_iter().all(|x| x > 2));
```

<pre><code class="language-cairo">fn all&lt;
    T,
    T,
    P,
    +core::ops::Fn&lt;P, (Self::Item,)&gt;[Output: bool],
    +Destruct&lt;P&gt;,
    +Destruct&lt;T&gt;,
    +Destruct&lt;Self::Item&gt;,
&gt;(
    ref self: T, predicate: P,
) -&gt; <a href="core-bool.html">bool</a></code></pre>

### `find`

Searches for an element of an iterator that satisfies a predicate. Returns `Some(element)` for the first match, or `None` if no element matches.

#### Examples

Basic usage:

```cairo
let mut iter = array![1, 2, 3].into_iter();

assert_eq!(iter.find(|x| *x == 2), Option::Some(2));

assert_eq!(iter.find(|x| *x == 5), Option::None);
```

Stopping at the first `true`:

```cairo
let mut iter = array![1, 2, 3].into_iter();

assert_eq!(iter.find(|x| *x == 2), Option::Some(2));

// we can still use `iter`, as there are more elements.
assert_eq!(iter.next(), Option::Some(3));
```

Note that `iter.find(f)` is equivalent to `iter.filter(f).next()`.

## `IntoIterator` Trait

Converts something into an `Iterator`. This is common for types that describe a collection. Implementing `IntoIterator` allows a type to work with Cairo's `for` loop syntax.

### Examples

Basic usage:

```cairo
let mut iter = array![1, 2, 3].into_iter();

assert!(Some(1) == iter.next());
assert!(Some(2) == iter.next());
assert!(Some(3) == iter.next());
assert!(None == iter.next());
```

Implementing `IntoIterator` for your type:

```cairo
// A sample collection, that's just a wrapper over `Array<u32>`
#[derive(Drop, Debug)]
struct MyCollection {
    arr: Array<u32>
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
impl MyCollectionIntoIterator of IntoIterator<MyCollection> {
    type IntoIter = core::array::ArrayIter<u32>;
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

Cairo de-sugars a `for` loop into calls to `into_iter()` and `next()`:

```cairo
let values = array![1, 2, 3, 4, 5];

for x in values {
    println!("{x}");
}
```

becomes:

```cairo
let values = array![1, 2, 3, 4, 5];
{
    let mut iter = IntoIterator::into_iter(values);
    let result = loop {
            let mut next = 0;
            match iter.next() {
                Some(val) => next = val,
                None => {
                    break;
                },
            };
            let x = next;
            let () = { println!("{x}"); };
        };
    result
}
```

All `Iterator`s implement `IntoIterator` by returning themselves.

## `FromIterator` Trait

Creates a value from an iterator.

### Examples

```cairo
let iter = (0..5_u32).into_iter();

let v = FromIterator::from_iter(iter);

assert_eq!(v, array![0, 1, 2, 3, 4]);
```

<pre><code class="language-cairo">pub trait FromIterator&lt;T, A&gt;</code></pre>

<pre><code class="language-cairo">fn from_iter&lt;
    T,
    A,
    T,
    A,
    I,
    impl IntoIter: IntoIterator&lt;I&gt;,
    +TypeEqual&lt;IntoIter::Iterator::Item, A&gt;,
    +Destruct&lt;IntoIter::IntoIter&gt;,
    +Destruct&lt;I&gt;,
&gt;(
    iter: I,
) -&gt; T</code></pre>

Iterator Adapters and Transformation Methods

# Iterator Adapters and Transformation Methods

Iterators, along with iterator adapters, are lazy. This means that creating an iterator does not perform any actions until `next` is called. This can be a point of confusion if an iterator is created solely for its side effects. For instance, the `map` method calls a closure on each element it iterates over, but if the iterator is not consumed, the closure will not execute.

## Common Iterator Adapters

Functions that accept an `Iterator` and return another `Iterator` are often referred to as 'iterator adapters'. Some common examples include `map`, `enumerate`, and `zip`.

### `peekable`

Creates an iterator that allows peeking at the next element without consuming it. The `peek` method returns `Some(value)` if there is a next element, or `None` if the iterator is exhausted. Peeking does advance the underlying iterator.

```cairo
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

### `map`

Transforms an iterator by applying a closure to each element. It takes a closure that accepts an element of type `A` and returns a value of type `B`, producing a new iterator yielding elements of type `B`.

```cairo
let mut iter = array![1, 2, 3].into_iter().map(|x| 2 * x);

assert!(iter.next() == Some(2));
assert!(iter.next() == Some(4));
assert!(iter.next() == Some(6));
assert!(iter.next() == None);
```

### `enumerate`

Creates an iterator that yields pairs of the current iteration count (as a `usize`) and the element from the original iterator. The count starts at 0.

```cairo
let mut iter = array!['a', 'b', 'c'].into_iter().enumerate();

assert_eq!(iter.next(), Some((0, 'a')));
assert_eq!(iter.next(), Some((1, 'b')));
assert_eq!(iter.next(), Some((2, 'c')));
assert_eq!(iter.next(), None);
```

### `filter`

Creates an iterator that yields only the elements for which a given closure returns `true`. The closure takes each element as a snapshot.

```cairo
let a = array![0_u32, 1, 2];

let mut iter = a.into_iter().filter(|x| *x > 0);

assert_eq!(iter.next(), Option::Some(1));
assert_eq!(iter.next(), Option::Some(2));
assert_eq!(iter.next(), Option::None);
```

### `zip`

Combines two iterators into a single iterator of pairs. Each pair contains an element from the first iterator and an element from the second. If either iterator is exhausted, the zipped iterator stops.

```cairo
let mut iter = array![1, 2, 3].into_iter().zip(array![4, 5, 6].into_iter());

assert_eq!(iter.next(), Some((1, 4)));
assert_eq!(iter.next(), Some((2, 5)));
assert_eq!(iter.next(), Some((3, 6)));
assert_eq!(iter.next(), None);
```

### `chain`

Concatenates two iterators, yielding elements from the first iterator followed by elements from the second.

```cairo
let a: Array<u8> = array![7, 8, 9];
let b: Range<u8> = 0..5;

let mut iter = a.into_iter().chain(b.into_iter());

assert_eq!(iter.next(), Option::Some(7));
assert_eq!(iter.next(), Option::Some(8));
assert_eq!(iter.next(), Option::Some(9));
assert_eq!(iter.next(), Option::Some(0));
assert_eq!(iter.next(), Option::Some(1));
assert_eq!(iter.next(), Option::Some(2));
assert_eq!(iter.next(), Option::Some(3));
assert_eq!(iter.next(), Option::Some(4));
assert_eq!(iter.next(), Option::None);
```

### `take`

Creates an iterator that yields at most `n` elements from the underlying iterator. It stops when `n` elements have been yielded or when the underlying iterator is exhausted.

```cairo
let mut iter = array![1, 2, 3].into_iter().take(2);

assert_eq!(iter.next(), Some(1));
assert_eq!(iter.next(), Some(2));
assert_eq!(iter.next(), None);
```

### `collect`

Consumes an iterator and transforms it into a collection. The type of collection can be specified using type annotations or the 'turbofish' syntax (`::<Type>`).

```cairo
let doubled = array![1, 2, 3].into_iter().map(|x| x * 2).collect::<Array<u32>>();

assert_eq!(array![2, 4, 6], doubled);
```

### `fold`

Applies a closure to an accumulator and each element of the iterator, returning the final accumulator value. It requires an initial value for the accumulator.

### `sum`

Calculates the sum of all elements in an iterator. For an empty iterator, it returns the zero value of the element type. This method may panic on overflow for primitive integer types.

```cairo
let mut iter = array![1, 2, 3].into_iter();
let sum: usize = iter.sum();

assert_eq!(sum, 6);
```

### `product`

Calculates the product of all elements in an iterator. For an empty iterator, it returns the one value of the element type. This method may panic on overflow for primitive integer types.

```cairo
fn factorial(n: u32) -> u32 {
    (1..=n).into_iter().product()
}
assert_eq!(factorial(0), 1);
assert_eq!(factorial(5), 120);
```

### `nth`

Retrieves the `n`-th element of an iterator, consuming elements up to that point. Returns `None` if the iterator has fewer than `n+1` elements.

```cairo
let mut iter = array![1, 2, 3].into_iter();
assert_eq!(iter.nth(1), Some(2)); // Consumes 0 and 1, returns 2
assert_eq!(iter.next(), Some(3)); // Returns the next element
assert_eq!(iter.nth(10), None); // Iterator exhausted
```

### `find`

Searches for an element in an iterator that satisfies a predicate (a closure returning a boolean). It returns the first element for which the predicate is true, wrapped in `Some`, or `None` if no such element is found.

```cairo
let numbers = array![1, 2, 3, 4, 5];
let found = numbers.into_iter().find(|&x| x % 2 == 0);
assert_eq!(found, Some(2));
```

Traits for Iterator Interaction

# Traits for Iterator Interaction

## Extend

Extend a collection with the contents of an iterator. Iterators produce a series of values, and collections can also be thought of as a series of values. The `Extend` trait bridges this gap, allowing you to extend a collection by including the contents of that iterator. When extending a collection with an already existing key, that entry is updated or, in the case of collections that permit multiple entries with equal keys, that entry is inserted.

### Examples

Basic usage:

```cairo
let mut arr = array![1, 2];

arr.extend(array![3, 4, 5]);

assert_eq!(arr, array![1, 2, 3, 4, 5]);
```

### `extend` function signature

<pre><code class="language-cairo">fn extend&lt;
    T,
    A,
    T,
    A,
    I,
    impl IntoIter: IntoIterator&lt;I&gt;,
    +TypeEqual&lt;IntoIter::Iterator::Item, A&gt;,
    +Destruct&lt;IntoIter::IntoIter&gt;,
    +Destruct&lt;I&gt;,
&gt;(
    ref self: T, iter: I,
)</code></pre>

## FromIterator

Conversion from an [`Iterator`](./core-iter-traits-iterator-Iterator.md). By implementing `FromIterator` for a type, you define how it will be created from an iterator. This is common for types which describe a collection of some kind. If you want to create a collection from the contents of an iterator, the `Iterator::collect()` method is preferred. However, when you need to specify the container type, `FromIterator::from_iter()` can be more readable than using a turbofish (e.g. `::<Array<_>>()`).

### Examples

Basic usage:

```cairo
let v = FromIterator::from_iter(0..5_u32);

assert_eq!(v, array![0, 1, 2, 3, 4]);
```

Implementing `FromIterator` for your type:

```cairo
use core::metaprogramming::TypeEqual;

// A sample collection, that's just a wrapper over Array<T>
#[derive(Drop, Debug)]
struct MyCollection {
    arr: Array<u32>,
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
implement MyCollectionFromIterator of FromIterator<MyCollection, u32> {
    fn from_iter<I, impl IntoIter: IntoIterator<I>, +TypeEqual<IntoIter::Iterator::Item, u32>, +Destruct<IntoIter::IntoIter>, +Destruct<I>>(
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
let c = FromIterator::<MyCollection>::from_iter(iter);

assert_eq!(c.arr, array![0, 1, 2, 3, 4]);
```

## IntoIterator

Conversion into an [`Iterator`](./core-iter-traits-iterator-Iterator.md). By implementing `IntoIterator` for a type, you define how it will be created from an iterator.

### `into_iter` function

Creates an iterator from a value.

### Examples

```cairo
let mut iter = array![1, 2, 3].into_iter();

assert_eq!(Some(1), iter.next());
assert_eq!(Some(2), iter.next());
assert_eq!(Some(3), iter.next());
assert_eq!(None, iter.next());
```

### `into_iter` function signature

<pre><code class="language-cairo">fn into_iter&lt;T, T&gt;(self: T) -&gt; <a href="core-iter-traits-collect-IntoIterator.html">IntoIterator&lt;T&gt;IntoIter</a></code></pre>

### `IntoIter` type

The iterator type that will be created.

Custom Iterators and `for` Loops

### Custom Iterators

Cairo allows the creation of custom iterators. An example is the `Counter` iterator, which counts from 1 to 5.

```cairo
// First, the struct:

/// An iterator which counts from one to five
#[derive(Drop)]
struct Counter {
    count: usize,
}

// we want our count to start at one, so let's add a new() method to help.
// This isn't strictly necessary, but is convenient. Note that we start
// `count` at zero, we'll see why in `next()`'s implementation below.
#[generate_trait]
impl CounterImpl of CounterTrait {
    fn new() -> Counter {
        Counter { count: 0 }
    }
}

// Then, we implement `Iterator` for our `Counter`:

impl CounterIter of core::iter::Iterator<Counter> {
    // we will be counting with usize
    type Item = usize;

    // next() is the only required method
    fn next(ref self: Counter) -> Option<Self::Item> {
        // Increment our count. This is why we started at zero.
        self.count += 1;

        // Check to see if we've finished counting or not.
        if self.count < 6 {
            Some(self.count)
        } else {
            None
        }
    }
}

// And now we can use it!

let mut counter = CounterTrait::new();

assert!(counter.next() == Some(1));
assert!(counter.next() == Some(2));
assert!(counter.next() == Some(3));
assert!(counter.next() == Some(4));
assert!(counter.next() == Some(5));
assert!(counter.next() == None);
```

### `for` Loops and `IntoIterator`

Cairo's `for` loop is syntactic sugar for iterators. It automatically calls `next()` on an iterator until it returns `None`.

```cairo
let values = array![1, 2, 3, 4, 5];

for x in values {
    println!("{x}");
}
```

This loop iterates over the `values` array and prints each element. The `for` loop implicitly handles the iterator creation and consumption.

## Ranges and Range Iteration

This module provides functionality for creating and iterating over ranges of values.

## Range Operator Forms

The `start..end` operator form represents a range from `start` (inclusive) to `end` (exclusive). It is empty if `start >= end`.

```cairo
assert!((3..5) == core::ops::Range { start: 3, end: 5 });

let mut sum = 0;
for i in 3..6 {
    sum += i;
}
assert!(sum == 3 + 4 + 5);
```

### `core::ops::range::Range<T>`

A half-open range bounded inclusively below and exclusively above (`start..end`). The range `start..end` contains all values with `start <= x < end`.

**Members:**

- `start`: The lower bound of the range (inclusive).
- `end`: The upper bound of the range (exclusive).

### `core::ops::range::RangeIterator<T>`

Represents an iterator located at `cur`, whose end is `end` (`cur <= end`).

### `core::ops::range::RangeInclusive<T>`

Represents a range from `start` to `end`, both inclusive.

**Members:**

- `start`: The lower bound of the range (inclusive).
- `end`: The upper bound of the range (inclusive).

### `core::ops::range::RangeInclusiveTrait<T>`

**Trait functions:**

- `contains(item: @T) -> bool`: Returns `true` if `item` is contained in the range.

  ```cairo
  assert!(!(3..=5).contains(@2));
  assert!( (3..=5).contains(@3));
  assert!( (3..=5).contains(@4));
  assert!( (3..=5).contains(@5));
  assert!(!(3..=5).contains(@6));

  assert!( (3..=3).contains(@3));
  assert!(!(3..=2).contains(@3));
  ```

- `is_empty() -> bool`: Returns `true` if the range contains no items.
  ```cairo
  assert!(!(3_u8..=5_u8).is_empty());
  assert!(!(3_u8..=3_u8).is_empty());
  assert!( (3_u8..=2_u8).is_empty());
  ```

### `core::ops::range::RangeTrait<T>`

**Trait functions:**

- `contains(item: @T) -> bool`: Returns `true` if `item` is contained in the range.

Handling `Option` and `Result` in Iteration

## Iterating over `Option`

An `Option<T>` can be iterated over. The iterator yields a single value if the `Option` is `Some(v)`, and no values if it is `None`. This is facilitated by the `into_iter` method, which creates an `OptionIter` struct.

### `Option` Methods

The `Option` type provides several methods for chaining operations and transforming values:

- `and`, `or`, `xor`: Perform logical operations based on the presence of values.
- `and_then`, `or_else`: Take functions to conditionally produce new `Option` values.

### Extracting Values from `Option`

The `OptionTrait` provides methods to extract the contained value:

- `unwrap()`: Returns the contained `Some` value. Panics if the `Option` is `None`.
- `expect(err)`: Returns the contained `Some` value. Panics with a custom message if the `Option` is `None`.

```cairo
// Example for expect
let option = Some(123);
let value = option.expect('no value');
assert!(value == 123);

// Example for unwrap
let option = Some(123);
let value = option.unwrap();
assert!(value == 123);
```

## Iterating over `Result`

A `Result<T, E>` can also be iterated over. The iterator yields a single value if the `Result` is `Ok(v)`, and no values if it is `Err(e)`.

### Error Propagation with `Result`

The `?` operator simplifies error propagation in functions returning `Result`. It unwraps an `Ok` value or returns the `Err` early.

```cairo
use core::integer::u8_overflowing_add;

// Without '?'
fn add_three_numbers(a: u8, b: u8, c: u8) -> Result<u8, u8> {
    match u8_overflowing_add(a, b) {
        Ok(sum_ab) => {
            match u8_overflowing_add(sum_ab, c) {
                Ok(total) => Ok(total),
                Err(e) => Err(e),
            }
        },
        Err(e) => Err(e),
    }
}

// With '?'
fn add_three_numbers_2(a: u8, b: u8, c: u8) -> Result<u8, u8> {
    let total = u8_overflowing_add(u8_overflowing_add(a, b)?, c)?;
    Ok(total)
}
```

## Panic Handling

This section details the panic mechanisms available in Cairo.

### `panic_with_const_felt252`

Panics with a given `const felt252` argument as the error message.

#### Examples

```cairo
use core::panic_with_const_felt252;

panic_with_const_felt252::<'error message'>();
```

#### Signature

<pre><code class="language-cairo">pub fn panic_with_const_felt252&lt;ERR_CODE&gt;() -> <a href="core-never.html">never</a></code></pre>

## `panic_with_felt252`

Panics with a given `felt252` as the error message.

### Examples

```cairo
use core::panic_with_felt252;

panic_with_felt252('error message');
```

### Signature

<pre><code class="language-cairo">pub fn panic_with_felt252(err_code: <a href="core-felt252.html">felt252</a>) -> <a href="core-never.html">never</a></code></pre>

## `panic`

Triggers an immediate panic with the provided data and terminates execution.

### Examples

```cairo
use core::panics::panic;

panic(array!['An error occurred']);
```

Starknet Storage Iteration

# Starknet Storage Iteration

## Trait: `IntoIterRange<T>`

This trait allows for creating iterators over ranges of collections.

### Functions

#### `into_iter_range`

Creates an iterator over a specified range from a collection.

```cairo
fn into_iter_range<T, T>(self: T, range: Range<u64>) -> IntoIterRange<T>IntoIter
```

#### `into_iter_full_range`

Creates an iterator over the entire range of a collection.

```cairo
fn into_iter_full_range<T, T>(self: T) -> IntoIterRange<T>IntoIter
```

### Type

#### `IntoIter`

An associated type representing the iterator.

```cairo
type IntoIter;
```

## Mutable Vector Operations

The `MutableVecTrait` provides methods for manipulating mutable vectors in Starknet storage.

### `allocate`

Allocates storage space for a new element in the vector. This is useful when adding nested structures or when not immediately writing a value.

```cairo
fn allocate<T, T>(self: T) -> StoragePath<Mutable<MutableVecTrait<T>::ElementType>>
```

### `push`

Appends a new value to the end of the vector. This operation increments the vector's length and writes the value to the new storage location.

```cairo
fn push<T, T, +Drop<Self::ElementType>, +starknet::Store<Self::ElementType>>(
    self: T, value: Self::ElementType,
)
```

Testing Utilities

# Testing Utilities

The `starknet::testing` module provides utilities for testing Starknet contracts, allowing manipulation of blockchain state and inspection of emitted events and messages. These functions are intended for use with the `cairo-test` framework.

## Event Handling

### `pop_log`

Pops the earliest unpopped logged event for the contract as the requested type.

```cairo
#[starknet::contract]
mod contract {
   #[event]
   #[derive(Copy, Drop, Debug, PartialEq, starknet::Event)]
   pub enum Event {
      Event1: felt252,
      Event2: u128,
   }
   // ...
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

**Signature:**

```cairo
pub fn pop_log<T, +starknet::Event<T>>(address: ContractAddress) -> Option<T>
```

### `pop_log_raw`

Pops the earliest unpopped logged event for the contract, returning keys and data as spans.

**Signature:**

```cairo
pub fn pop_log_raw(address: ContractAddress) -> Option<(Span<felt252>, Span<felt252>)>
```

## State Manipulation

### `set_block_number`

Sets the block number to the provided value.

**Signature:**

```cairo
pub fn set_block_number(block_number: u64)
```

### `set_block_timestamp`

Sets the block timestamp to the provided value.

**Signature:**

```cairo
pub fn set_block_timestamp(block_timestamp: u64)
```

### `set_sequencer_address`

Sets the sequencer address to the provided value.

**Signature:**

```cairo
pub fn set_sequencer_address(address: ContractAddress)
```

### `set_caller_address`

Sets the caller address to the provided value.

**Signature:**

```cairo
pub fn set_caller_address(address: ContractAddress)
```

### `set_contract_address`

Sets the contract address to the provided value.

**Signature:**

```cairo
pub fn set_contract_address(address: ContractAddress)
```

### `set_version`

Sets the version to the provided value.

**Signature:**

```cairo
pub fn set_version(version: felt252)
```

### `set_account_contract_address`

Sets the account contract address.

**Signature:**

```cairo
pub fn set_account_contract_address(address: ContractAddress)
```

### `set_max_fee`

Sets the transaction max fee.

**Signature:**

```cairo
pub fn set_max_fee(fee: u128)
```

### `set_transaction_hash`

Sets the transaction hash.

**Signature:**

```cairo
pub fn set_transaction_hash(hash: felt252)
```

### `set_chain_id`

Sets the transaction chain id.

**Signature:**

```cairo
pub fn set_chain_id(chain_id: felt252)
```

### `set_nonce`

Sets the transaction nonce.

**Signature:**

```cairo
pub fn set_nonce(nonce: felt252)
```

### `set_signature`

Sets the transaction signature.

**Signature:**

```cairo
pub fn set_signature(signature: Span<felt252>)
```

### `set_block_hash`

Sets the hash for a block.

**Signature:**

```cairo
pub fn set_block_hash(block_number: u64, value: felt252)
```

## Gas Measurement

### `get_available_gas`

Returns the amount of gas available in the `GasBuiltin`. This is useful for asserting gas consumption.

```cairo
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

    assert!(gas_after - gas_before < 100_000);
}
```

**Signature:**

```cairo
pub extern fn get_available_gas() -> u128 implicits(GasBuiltin) nopanic;
```

### `get_unspent_gas`

Returns the amount of gas available in the `GasBuiltin` and the unused gas in the local wallet.

```cairo
use core::testing::get_unspent_gas;

fn gas_heavy_function() {
    // ... some gas-intensive code
}

fn test_gas_consumption() {
    let gas_before = get_unspent_gas();
    gas_heavy_function();
    let gas_after = get_unspent_gas();
    assert!(gas_after - gas_before < 100_000);
}
```

**Signature:**

```cairo
pub extern fn get_unspent_gas() -> u128 implicits(GasBuiltin) nopanic;
```

General Library Overview

Core Cairo Library Features

### Formatting Traits

The core library provides several traits for formatting:

- **`Display`**: For standard formatting using the empty format ("{}").
- **`Debug`**: For debug formatting using the empty format ("{:?}").
- **`LowerHex`**: For hex formatting in lowercase using the empty format ("{:x}").

### Free Functions

The core library includes several free functions for error handling and assertions:

- **`panic_with_felt252`**: Panics with a given `felt252` as the error message.
- **`panic_with_const_felt252`**: Panics with a given const `felt252` as the error message.
- **`assert`**: Panics if the condition `cond` is false, using a given `felt252` as the error message.

### Gas Related Types

The core library defines types related to gas management:

- **`BuiltinCosts`**: Represents the table of costs for different builtin usages.
  ```rust
  pub extern type BuiltinCosts;
  ```
- **`GasBuiltin`**: The gas builtin, used to handle gas in Cairo code and contains the amount of gas available for the current run.
  ```rust
  pub extern type GasBuiltin;
  ```
- **`GasReserve`**: Represents a gas reserve, allowing gas to be created from the gas counter and utilized later.
  ```rust
  pub extern type GasReserve;
  ```

### Importing and Using the Core Library

The core library is available by default in all Cairo packages. Features can be accessed by importing specific modules:

```rust
use core::array::Array;

fn main() {
    let mut arr = Array::new();
    arr.append(42);
}
```

Gas Management in Cairo

## Gas Management in Cairo

This section details utilities for handling gas in Cairo code.

### `withdraw_gas()`

Withdraws gas from the `GasBuiltin` to handle the success case flow. It returns `Some(())` if there is sufficient gas, otherwise `None`.

```cairo
// The success branch is the following lines, the failure branch is the `panic` caused by the
// `unwrap` call.
withdraw_gas().unwrap();
```

```cairo
// Direct handling of `withdraw_gas`.
match withdraw_gas() {
    Some(()) => success_case(),
    None => cheap_not_enough_gas_case(),
}
```

Fully qualified path: [core](./core.md)::[gas](./core-gas.md)::[withdraw_gas](./core-gas-withdraw_gas.md)

```cairo
pub extern fn withdraw_gas() -> Option<()> implicits(RangeCheck, GasBuiltin) nopanic;
```

### `withdraw_gas_all()`

Similar to `withdraw_gas`, but directly receives `BuiltinCosts`. This allows for optimizations by avoiding repeated internal calls to fetch the table of constants. Use with caution.

Fully qualified path: [core](./core.md)::[gas](./core-gas.md)::[withdraw_gas_all](./core-gas-withdraw_gas_all.md)

```cairo
pub extern fn withdraw_gas_all(costs: BuiltinCosts) -> Option<()> implicits(RangeCheck, GasBuiltin) nopanic;
```

Data Serialization and Deserialization

### Serialization and Deserialization

The `core::serde` module provides traits and implementations for converting Cairo types into a sequence of `felt252` values (serialization) and back (deserialization). This is necessary for passing values between Cairo and external environments, as `felt252` is the fundamental type in Cairo.

#### The `Serde` Trait

All types intended for serialization must implement the `Serde` trait. This trait defines core operations for both simple types (serializing to a single `felt252`) and compound types (requiring multiple `felt252` values).

##### Example: Deserializing `u256`

```cairo
let mut serialized: Span<felt252> = array![1, 0].span();
let value: u256 = Serde::deserialize(ref serialized).unwrap();
assert!(value == 1);
```

The `deserialize` function has the following signature:

<pre><code class="language-cairo">fn deserialize&lt;T, T&gt;(ref serialized: Span&lt;felt252&gt;) -> Option&lt;T&gt;</code></pre>
