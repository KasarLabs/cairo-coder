[module] core::array
[doc] A contiguous collection of elements of the same type in memory, written `Array`. Arrays have O(1) indexing, O(1) push and O(1) pop (from the front). Arrays can only be mutated by appending to the end or popping from the front.
[url] https://docs.starknet.io/build/corelib/core-array

[functions]

- type Array; | A collection of elements of the same type contiguous in memory.
- #[derive(Drop)] pub struct ArrayIter { array: Array, } | An iterator struct over an array collection.
- trait ArrayTrait | Constructs a new, empty `Array`.
- extern_types | | | | |:---|:---| | [Array](./core-array-Array) | A collection of elements of the same type contiguous in memory. |
- impls | | | | |:---|:---| | [SpanIndex](./core-array-SpanIndex) | — |
- struct Span { pub(crate) snapshot: Array, } | A span is a view into a contiguous collection of the same type - such as `Array`. It is a structure with a single field that holds a snapshot of an array. `Span` implements the `Copy` and the `Drop` traits.
- impl SpanIndex of IndexView, u32, @T>; | Returns a snapshot of the element at the given index.
- struct SpanIter { span: Span, } | An iterator struct over a span collection.
- trait SpanTrait | Pops a value from the front of the span. Returns `Some(@value)` if the array is not empty, `None` otherwise.
- structs | | | | |:---|:---| | [Span](./core-array-Span) | A span is a view into a contiguous collection of the same type - such as `Array` . It is a structure with a single field that holds a snapshot of an array. `Span` implements the `Copy` and the... | | [SpanIter](./core-array-SpanIter) | An iterator struct over a span collection. | | [ArrayIter](./core-array-ArrayIter) | An iterator struct over an array collection. |
- trait ToSpanTrait | `ToSpanTrait` converts a data structure into a span of its data.
- traits | | | | |:---|:---| | [ToSpanTrait](./core-array-ToSpanTrait) | `ToSpanTrait` converts a data structure into a span of its data. | | [ArrayTrait](./core-array-ArrayTrait) | — | | [SpanTrait](./core-array-SpanTrait) | — |

[module] core::assert
[doc] Panics if `cond` is false with the given `felt252` as error message.
[url] https://docs.starknet.io/build/corelib/core-assert

[module] core::blake
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-blake

[functions]

- blake2s_compress(state: Box, byte_count: u32, msg: Box) -> Box nopanic; [nopanic,extern] | The blake2s compress function, which takes a state, a byte count, and a message, and returns a new state. `byte_count` should be the total number of bytes hashed after hashing the current `msg`.
- blake2s_finalize(state: Box, byte_count: u32, msg: Box) -> Box nopanic; [nopanic,extern] | A variant of `blake2s_compress` for the final block of the message. The input `msg` must always be exactly 16 `u32` elements, padded with zeros if necessary, regardless of the value of `byte_count`. Using any padding scheme other than zero-padding will produce a different hash output.
- extern_functions | | | | |:---|:---| | [blake2s_compress](./core-blake-blake2s_compress) | The blake2s compress function, which takes a state, a byte count, and a message, and returns a new state. `byte_count` should be the total number of bytes hashed after hashing the current `msg` . | | [blake2s_finalize](./core-blake-blake2s_finalize) | A variant of `blake2s_compress` for the final block of the message. The input `msg` must always be exactly 16 `u32` elements, padded with zeros if necessary, regardless of the value of... |

[module] core::blake overview
[doc] | | | |:---|:---| | [blake2s_compress](./core-blake-blake2s_compress) | The blake2s compress function, which takes a state, a byte count, and a message, and returns a new state. `byte_count` should be the total number of bytes hashed after hashing the current `msg` . | | [blake2s_finalize](./core-blake-blake2s_finalize) | A variant of `blake2s_compress` for the final block of the message. The input `msg` must always be exactly 16 `u32` elements, padded with zeros if necessary, regardless of the value of... |
[url] https://docs.starknet.io/build/corelib/core-blake

[module] core::bool
[doc] `bool` enum representing either `false` or `true`.
[url] https://docs.starknet.io/build/corelib/core-bool

[module] core::boolean
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-boolean

[functions]

- trait BoolTrait> | Returns `Some(t)` if the `bool` is `true`, `None` otherwise.
- traits | | | | |:---|:---| | [BoolTrait](./core-boolean-BoolTrait) | — |

[module] core::boolean overview
[doc] Boolean operations. The `bool` type is a primitive type in Cairo representing a boolean value that can be either `true` or `false`. This module provides trait implementations for boolean operations.
[url] https://docs.starknet.io/build/corelib/core-boolean

[module] core::box
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-box

[functions]

- type Box; | A `Box` is a type that points to a wrapped value. It allows for cheap moving around of the value, as its size is small, and may wrap a large size.
- trait BoxTrait | Creates a new `Box` with the given value. Allocates space in the boxed segment for the provided value and returns a `Box` that points to it.
- extern_types | | | | |:---|:---| | [Box](./core-box-Box) | A `Box` is a type that points to a wrapped value. It allows for cheap moving around of the value, as its size is small, and may wrap a large size. |
- traits | | | | |:---|:---| | [BoxTrait](./core-box-BoxTrait) | — |

[module] core::byte_array
[doc] `ByteArray` is designed to handle large sequences of bytes with operations like appending, concatenation, and accessing individual bytes. It uses a structure that combines an `Array` of `bytes31` for full words and a `felt252` for handling partial words, optimizing for both space and performance.
[url] https://docs.starknet.io/build/corelib/core-byte_array

[functions]

- const BYTE_ARRAY_MAGIC: felt252 = 1997209042069643135709344952807065910992472029923670688473712229447419591075; | A magic constant for identifying serialization of `ByteArray` variables. An array of `felt252` with this magic value as one of the `felt252` indicates that you should expect right after it a serialized `ByteArray`. This is currently used mainly for prints and panics.
- #[derive(Drop, Clone, PartialEq, Serde, Default)] pub struct ByteArray { pub(crate) data: Array, pub(crate) pending_word: felt252, pub(crate) pending_word_len: u32, } | Byte array type.
- impl ByteArrayImpl of ByteArrayTrait; | Functions associated with the `ByteArray` type.
- #[derive(Drop, Clone)] pub struct ByteArrayIter { ba: ByteArray, current_index: IntRange, } | An iterator struct over a ByteArray.
- trait ByteArrayTrait | Appends a single word of `len` bytes to the end of the `ByteArray`. This function assumes that: 1. `word` could be validly converted to a `bytes31` which has no more than `len` bytes of data. 2. len ByteArray fn append_byte(ref self: ByteArray, byte: u8) let mut ba = ""; ba.append_byte(0); assert!(ba == "0"); fn len(self: ByteArray) -> u32 let ba: ByteArray = "byte array"; let len = ba.len(); assert!(len == 10); fn at(self: ByteArray, index: u32) -> Option let ba: ByteArray = "byte array"; let byte = ba.at(0).unwrap(); assert!(byte == 98); fn rev(self: ByteArray) -> ByteArray let ba: ByteArray = "123"; let rev_ba = ba.rev(); assert!(rev_ba == "321"); fn append_word_rev(ref self: ByteArray, word: felt252, len: u32) let mut ba: ByteArray = ""; ba.append_word_rev('123', 3); assert!(ba == "321");
- constants | | | | |:---|:---| | [BYTE_ARRAY_MAGIC](./core-byte_array-BYTE_ARRAY_MAGIC) | A magic constant for identifying serialization of `ByteArray` variables. An array of `felt252` with this magic value as one of the `felt252` indicates that you should expect right after it a... |
- impls | | | | |:---|:---| | [ByteArrayImpl](./core-byte_array-ByteArrayImpl) | Functions associated with the `ByteArray` type. |
- structs | | | | |:---|:---| | [ByteArray](./core-byte_array-ByteArray) | Byte array type. | | [ByteArrayIter](./core-byte_array-ByteArrayIter) | An iterator struct over a ByteArray. |
- traits | | | | |:---|:---| | [ByteArrayTrait](./core-byte_array-ByteArrayTrait) | — |

[module] core::bytes_31
[doc] Definitions and utilities for the `bytes31` type. The `bytes31` type is a compact, indexable 31-byte type.
[url] https://docs.starknet.io/build/corelib/core-bytes_31

[functions]

- type bytes31; | Represents a 31-byte fixed-size byte type.
- impl Bytes31Impl of Bytes31Trait; | A trait for accessing a specific byte of a `bytes31` type.
- trait Bytes31Trait | Returns the byte at the given index (LSB's index is 0). Assumes that `index u8
- extern_types | | | | |:---|:---| | [bytes31](./core-bytes_31-bytes31) | Represents a 31-byte fixed-size byte type. |
- impls | | | | |:---|:---| | [Bytes31Impl](./core-bytes_31-Bytes31Impl) | A trait for accessing a specific byte of a `bytes31` type. |
- traits | | | | |:---|:---| | [Bytes31Trait](./core-bytes_31-Bytes31Trait) | — |

[module] core::circuit
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-circuit

[functions]

- enum AddInputResult { Done: CircuitData, More: CircuitInputAccumulator, } | The result of filling an input in the circuit instance's data. This enum represents the state of input filling process, indicating whether all inputs have been provided or more are needed.
- trait AddInputResultTrait | Adds an input value to the circuit instance.
- type AddMod; | Builtin for modular addition operations.
- type Circuit; | A type that creates a circuit from a tuple of outputs. This type represents a complete circuit instance, constructed from its output gates. The type parameter `Outputs` defines the structure of the circuit's outputs.
- circuit_add, +CircuitElementTrait>( lhs: CircuitElement, rhs: CircuitElement, ) -> CircuitElement> | Creates a new circuit element representing addition modulo p of two input circuits. This function combines two circuit elements using modular addition, creating a new circuit element that represents their sum modulo the circuit's modulus.
- circuit_inverse>( input: CircuitElement, ) -> CircuitElement> | Creates a new circuit element representing the multiplicative inverse modulo p of an input circuit. This function creates a new circuit element representing the multiplicative inverse of the input element modulo the circuit's modulus. The operation will fail during evaluation if the input is not invertible (not coprime with the modulus).
- circuit_mul, +CircuitElementTrait>( lhs: CircuitElement, rhs: CircuitElement, ) -> CircuitElement> | Creates a new circuit element representing multiplication modulo p of two input circuits. This function combines two circuit elements using modular multiplication, creating a new circuit element that represents their product modulo the circuit's modulus.
- circuit_sub, +CircuitElementTrait>( lhs: CircuitElement, rhs: CircuitElement, ) -> CircuitElement> | Creates a new circuit element representing subtraction modulo p of two input circuits. This function combines two circuit elements using modular subtraction, creating a new circuit element that represents their difference modulo the circuit's modulus.
- trait CircuitDefinition | A trait for defining a circuit's structure and behavior. This trait is used to define the structure of a circuit, including its inputs, gates, and outputs. It provides the foundation for circuit evaluation. The `CES` type parameter represents a tuple of `CircuitElement`s that together define the circuit's structure.
- struct CircuitElement {} | A wrapper for circuit elements, used to construct circuits. This type provides a generic wrapper around different circuit components (inputs, gates) and enables composition of circuit elements through arithmetic operations. The type parameter `T` defines the specific role of the element in the circuit.
- impl CircuitElementCopy of Copy>;
- impl CircuitElementDrop of Drop>;
- trait CircuitElementTrait | A marker trait for keeping track of which types are valid circuit elements. This trait is implemented for all valid circuit components including inputs and gates. It provides type safety when composing circuit elements.
- type CircuitInput; | Defines an input for a circuit. Represents an input signal in the circuit, indexed by `N`. Each input must be assigned a value before circuit evaluation.
- trait CircuitInputs | Initializes a new circuit instance with inputs. This function creates a new input accumulator for the circuit, which can then be used to add input values sequentially.
- type CircuitModulus; | A type that can be used as a circuit modulus (a u384 that is not zero or one). The modulus defines the finite field over which the circuit operates. It must be: - A 384-bit number (represented as four 96-bit limbs) - Not zero or one - Typically a prime number for cryptographic applications
- trait CircuitOutputsTrait | A trait for retrieving output values from a circuit evaluation. This trait provides methods to access the output values of a circuit after successful evaluation.
- type ConstOne = BoundedInt;
- type ConstZero = BoundedInt; | Expose the const required by the libfunc to allow the compiler const reusage.
- impl DestructFailureGuarantee of Destruct;
- enums | | | | |:---|:---| | [AddInputResult](./core-circuit-AddInputResult) | The result of filling an input in the circuit instance's data. This enum represents the state of input filling process, indicating whether all inputs have been provided or more are needed. |
- trait EvalCircuitTrait | Evaluates the circuit with the given modulus.
- extern_types | | | | |:---|:---| | [RangeCheck96](./core-circuit-RangeCheck96) | Range check builtin for 96-bit operations. | | [AddMod](./core-circuit-AddMod) | Builtin for modular addition operations. | | [MulMod](./core-circuit-MulMod) | Builtin for modular multiplication operations. | | [CircuitModulus](./core-circuit-CircuitModulus) | A type that can be used as a circuit modulus (a u384 that is not zero or one). The modulus defines the finite field over which the circuit operates. It must be:... | | [Circuit](./core-circuit-Circuit) | A type that creates a circuit from a tuple of outputs. This type represents a complete circuit instance, constructed from its output gates. The type parameter `Outputs`... | | [CircuitInput](./core-circuit-CircuitInput) | Defines an input for a circuit. Represents an input signal in the circuit, indexed by `N` . Each input must be assigned a value before circuit evaluation. |
- free_functions | | | | |:---|:---| | [circuit_add](./core-circuit-circuit_add) | Creates a new circuit element representing addition modulo p of two input circuits. This function combines two circuit elements using modular addition, creating a new circuit... | | [circuit_sub](./core-circuit-circuit_sub) | Creates a new circuit element representing subtraction modulo p of two input circuits. This function combines two circuit elements using modular subtraction, creating a new circuit... | | [circuit_inverse](./core-circuit-circuit_inverse) | Creates a new circuit element representing the multiplicative inverse modulo p of an input circuit. This function creates a new circuit element representing the multiplicative inverse of the input... | | [circuit_mul](./core-circuit-circuit_mul) | Creates a new circuit element representing multiplication modulo p of two input circuits. This function combines two circuit elements using modular multiplication, creating a new circuit... |
- impls | | | | |:---|:---| | [CircuitElementDrop](./core-circuit-CircuitElementDrop) | — | | [CircuitElementCopy](./core-circuit-CircuitElementCopy) | — | | [DestructFailureGuarantee](./core-circuit-DestructFailureGuarantee) | — |
- type MulMod; | Builtin for modular multiplication operations.
- type RangeCheck96; | Range check builtin for 96-bit operations.
- structs | | | | |:---|:---| | [u384](./core-circuit-u384) | A 384-bit unsigned integer, used for circuit values. | | [CircuitElement](./core-circuit-CircuitElement) | A wrapper for circuit elements, used to construct circuits. This type provides a generic wrapper around different circuit components (inputs, gates)... |
- traits | | | | |:---|:---| | [CircuitElementTrait](./core-circuit-CircuitElementTrait) | A marker trait for keeping track of which types are valid circuit elements. This trait is implemented for all valid circuit components including inputs and gates.... | | [CircuitDefinition](./core-circuit-CircuitDefinition) | A trait for defining a circuit's structure and behavior. This trait is used to define the structure of a circuit, including its inputs,... | | [CircuitOutputsTrait](./core-circuit-CircuitOutputsTrait) | A trait for retrieving output values from a circuit evaluation. This trait provides methods to access the output values of a circuit after successful evaluation.... | | [CircuitInputs](./core-circuit-CircuitInputs) | — | | [AddInputResultTrait](./core-circuit-AddInputResultTrait) | — | | [EvalCircuitTrait](./core-circuit-EvalCircuitTrait) | — |
- type_aliases | | | | |:---|:---| | [u96](./core-circuit-u96) | A 96-bit unsigned integer type used as the basic building block for multi-limb arithmetic. | | [ConstZero](./core-circuit-ConstZero) | Expose the const required by the libfunc to allow the compiler const reusage. | | [ConstOne](./core-circuit-ConstOne) | — |
- #[derive(Copy, Drop, Debug, PartialEq)] pub struct u384 { pub limb0: BoundedInt, pub limb1: BoundedInt, pub limb2: BoundedInt, pub limb3: BoundedInt, } | A 384-bit unsigned integer, used for circuit values.
- type u96 = BoundedInt; | A 96-bit unsigned integer type used as the basic building block for multi-limb arithmetic.

[module] core::circuit overview
[doc] Efficient modular arithmetic computations using arithmetic circuits. This module provides a type-safe way to perform modular arithmetic operations using arithmetic circuits. It is particularly useful for implementing cryptographic algorithms and other computations that require efficient modular arithmetic with large numbers.
[url] https://docs.starknet.io/build/corelib/core-circuit

[module] core::clone
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-clone

[functions]

- trait Clone | A common trait for the ability to explicitly duplicate an object. Differs from `Copy` in that `Copy` is implicit and inexpensive, while `Clone` is always explicit and may or may not be expensive. Since `Clone` is more general than `Copy`, you can automatically make anything `Copy` be `Clone` as well.
- traits | | | | |:---|:---| | [Clone](./core-clone-Clone) | A common trait for the ability to explicitly duplicate an object. Differs from `Copy` in that `Copy` is implicit and inexpensive, while `Clone` is always explicit and may or may not be expensive.... |

[module] core::cmp
[doc] Utilities for comparing and ordering values. This module contains functions that rely on the `PartialOrd` trait for comparing values.
[url] https://docs.starknet.io/build/corelib/core-cmp

[functions]

- free_functions | | | | |:---|:---| | [min](./core-cmp-min) | Takes two comparable values `a` and `b` and returns the smaller of the two values.... | | [max](./core-cmp-max) | Takes two comparable values `a` and `b` and returns the greater of the two values.... | | [minmax](./core-cmp-minmax) | Takes two comparable values `a` and `b` and returns a tuple with the smaller value and the greater value.... |
- max, +Drop, +Copy>(a: T, b: T) -> T | Takes two comparable values `a` and `b` and returns the greater of the two values.
- min, +Drop, +Copy>(a: T, b: T) -> T | Takes two comparable values `a` and `b` and returns the smaller of the two values.
- minmax, +Drop, +Copy>(a: T, b: T) -> (T, T) | Takes two comparable values `a` and `b` and returns a tuple with the smaller value and the greater value.

[module] core::debug
[doc] Utilities related to printing of values at runtime. The recommended way of printing values is by using the `Display` and `Debug` traits available in the [`fmt`](./core-fmt) module. The items in this module are not public, and are not recommended for use.
[url] https://docs.starknet.io/build/corelib/core-debug

[functions]

- free_functions | | | | |:---|:---| | [print_byte_array_as_string](./core-debug-print_byte_array_as_string) | Prints a `ByteArray` as a string.... |
- print_byte_array_as_string(self: ByteArray) | Prints a `ByteArray` as a string.

[module] core::dict
[doc] A dictionary-like data structure that maps `felt252` keys to values of any type. The `Felt252Dict` provides efficient key-value storage with operations for inserting, retrieving, and updating values. Each operation creates a new entry that can be validated through a process called squashing.
[url] https://docs.starknet.io/build/corelib/core-dict

[functions]

- extern_types | | | | |:---|:---| | [Felt252Dict](./core-dict-Felt252Dict) | A dictionary that maps `felt252` keys to a value of any type. | | [SquashedFelt252Dict](./core-dict-SquashedFelt252Dict) | A dictionary in a squashed state. It cannot be mutated anymore. | | [Felt252DictEntry](./core-dict-Felt252DictEntry) | An intermediate type that is returned after calling the `entry` method that consumes ownership of the dictionary. This ensures that the dictionary cannot be mutated until the entry is... |
- type Felt252Dict; | A dictionary that maps `felt252` keys to a value of any type.
- type Felt252DictEntry; | An intermediate type that is returned after calling the `entry` method that consumes ownership of the dictionary. This ensures that the dictionary cannot be mutated until the entry is finalized, which restores ownership of the dictionary.
- trait Felt252DictEntryTrait | Basic trait for the `Felt252DictEntryTrait` type.
- trait Felt252DictTrait | Basic trait for the `Felt252Dict` type.
- type SquashedFelt252Dict; | A dictionary in a squashed state. It cannot be mutated anymore.
- trait SquashedFelt252DictTrait | Returns an array of `(key, first_value, last_value)` tuples. The first value is always 0.
- traits | | | | |:---|:---| | [Felt252DictTrait](./core-dict-Felt252DictTrait) | Basic trait for the `Felt252Dict` type. | | [Felt252DictEntryTrait](./core-dict-Felt252DictEntryTrait) | Basic trait for the `Felt252DictEntryTrait` type. | | [SquashedFelt252DictTrait](./core-dict-SquashedFelt252DictTrait) | — |

[module] core::ec
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-ec

[functions]

- ec_point_unwrap(p: NonZero) -> (felt252, felt252) nopanic; [nopanic,extern] | Unwraps a non-zero point into its (x, y) coordinates.
- type EcOp;
- type EcPoint; | A point on the STARK curve. Points can be created using `EcPointTrait::new` or `EcPointTrait::new_from_x`. The zero point represents the point at infinity.
- impl EcPointImpl of EcPointTrait; | Creates a new EC point from its (x, y) coordinates.
- trait EcPointTrait | Creates a new EC point from its (x, y) coordinates.
- type EcState; | Elliptic curve state. Use this to perform multiple point operations efficiently. Initialize with `EcStateTrait::init`, add points with `EcStateTrait::add` or `EcStateTrait::add_mul`, and finalize with `EcStateTrait::finalize`.
- impl EcStateImpl of EcStateTrait; | Initializes an EC computation with the zero point.
- trait EcStateTrait | Initializes an EC computation with the zero point.
- extern_functions | | | | |:---|:---| | [ec_point_unwrap](./core-ec-ec_point_unwrap) | Unwraps a non-zero point into its (x, y) coordinates. |
- extern_types | | | | |:---|:---| | [EcOp](./core-ec-EcOp) | — | | [EcPoint](./core-ec-EcPoint) | A point on the STARK curve. Points can be created using `EcPointTrait::new` or `EcPointTrait::new_from_x` . The zero point represents the point at infinity. | | [EcState](./core-ec-EcState) | Elliptic curve state. Use this to perform multiple point operations efficiently. Initialize with `EcStateTrait::init` , add points with `EcStateTrait::add` or `EcStateTrait::add_mul`... |
- impls | | | | |:---|:---| | [EcStateImpl](./core-ec-EcStateImpl) | — | | [EcPointImpl](./core-ec-EcPointImpl) | — |
- modules | | | | |:---|:---| | [stark_curve](./core-ec-stark_curve) | — |
- type NonZeroEcPoint = NonZero; | A non-zero point on the STARK curve (cannot be the point at infinity).
- stark_curve | | | | |:---|:---| | [ALPHA](./core-ec-stark_curve-ALPHA) | The STARK Curve is defined by the equation y² ≡ x³ + α·x + β (mod p). | | [BETA](./core-ec-stark_curve-BETA) | The STARK Curve is defined by the equation y² ≡ x³ + α·x + β (mod p). | | [ORDER](./core-ec-stark_curve-ORDER) | The order (number of points) of the STARK Curve. | | [GEN_X](./core-ec-stark_curve-GEN_X) | The x coordinate of the generator point used in the ECDSA signature. | | [GEN_Y](./core-ec-stark_curve-GEN_Y) | The y coordinate of the generator point used in the ECDSA signature. |
- traits | | | | |:---|:---| | [EcStateTrait](./core-ec-EcStateTrait) | — | | [EcPointTrait](./core-ec-EcPointTrait) | — |
- type_aliases | | | | |:---|:---| | [NonZeroEcPoint](./core-ec-NonZeroEcPoint) | A non-zero point on the STARK curve (cannot be the point at infinity). |

[module] core::ec::stark_curve
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-ec-stark_curve

[functions]

- const ALPHA: felt252 = 1; | The STARK Curve is defined by the equation y² ≡ x³ + α·x + β (mod p).
- const BETA: felt252 = 3141592653589793238462643383279502884197169399375105820974944592307816406665; | The STARK Curve is defined by the equation y² ≡ x³ + α·x + β (mod p).
- constants | | | | |:---|:---| | [ALPHA](./core-ec-stark_curve-ALPHA) | The STARK Curve is defined by the equation y² ≡ x³ + α·x + β (mod p). | | [BETA](./core-ec-stark_curve-BETA) | The STARK Curve is defined by the equation y² ≡ x³ + α·x + β (mod p). | | [ORDER](./core-ec-stark_curve-ORDER) | The order (number of points) of the STARK Curve. | | [GEN_X](./core-ec-stark_curve-GEN_X) | The x coordinate of the generator point used in the ECDSA signature. | | [GEN_Y](./core-ec-stark_curve-GEN_Y) | The y coordinate of the generator point used in the ECDSA signature. |
- const GEN_X: felt252 = 874739451078007766457464989774322083649278607533249481151382481072868806602; | The x coordinate of the generator point used in the ECDSA signature.
- const GEN_Y: felt252 = 152666792071518830868575557812948353041420400780739481342941381225525861407; | The y coordinate of the generator point used in the ECDSA signature.
- const ORDER: felt252 = 3618502788666131213697322783095070105526743751716087489154079457884512865583; | The order (number of points) of the STARK Curve.

[module] core::ecdsa
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-ecdsa

[functions]

- check_ecdsa_signature | Verifies an ECDSA signature against a message hash and public key. Note: the verification algorithm implemented by this function slightly deviates from the standard ECDSA. While this does not allow to create valid signatures if one does not possess the private key, it means that the signature algorithm used should be modified accordingly. This function validates that `s` and `r` are not 0 or equal to the curve order, but does not check that `r, s bool
- free_functions | | | | |:---|:---| | [check_ecdsa_signature](./core-ecdsa-check_ecdsa_signature) | Verifies an ECDSA signature against a message hash and public key. Note: the verification algorithm implemented by this function slightly deviates from the standard ECDSA.... | | [recover_public_key](./core-ecdsa-recover_public_key) | Recovers the public key from an ECDSA signature and message hash. Given a valid ECDSA signature, the original message hash, and the y-coordinate parity of point... |
- recover_public_key( message_hash: felt252, signature_r: felt252, signature_s: felt252, y_parity: bool, ) -> Option | Recovers the public key from an ECDSA signature and message hash. Given a valid ECDSA signature, the original message hash, and the y-coordinate parity of point R, this function recovers the signer's public key. This is useful in scenarios where you need to verify a message has been signed by a specific public key.

[module] core::enums
[doc] | | | |:---|:---| | [bool](./core-bool) | `bool` enum representing either `false` or `true` . | | [never](./core-never) | — |
[url] https://docs.starknet.io/build/corelib/core-enums

[module] core::extern_functions
[doc] | | | |:---|:---| | [felt252_div](./core-felt252_div) | Performs division on `felt252` values in Cairo's finite field. Unlike regular integer division, `felt252` division returns a field element n that satisfies... |
[url] https://docs.starknet.io/build/corelib/core-extern_functions

[module] core::extern_types
[doc] | | | |:---|:---| | [RangeCheck](./core-RangeCheck) | General purpose implicits. | | [SegmentArena](./core-SegmentArena) | — | | [felt252](./core-felt252) | `felt252` is the basic field element used in Cairo. It corresponds to an integer in the range 0 ≤ x < P where P is a very large prime number currently equal to 2^251 + 17⋅2^192 + 1.... |
[url] https://docs.starknet.io/build/corelib/core-extern_types

[module] core::felt252
[doc] `felt252` is the basic field element used in Cairo. It corresponds to an integer in the range 0 ≤ x < P where P is a very large prime number currently equal to 2^251 + 17⋅2^192 + 1. Any operation that uses `felt252` will be computed modulo P.
[url] https://docs.starknet.io/build/corelib/core-felt252

[module] core::felt252_div
[doc] Performs division on `felt252` values in Cairo's finite field. Unlike regular integer division, `felt252` division returns a field element n that satisfies the equation: n \* rhs ≡ lhs (mod P), where P is the `felt252` prime.
[url] https://docs.starknet.io/build/corelib/core-felt252_div

[module] core::fmt
[doc] Functionality for formatting values. The main components of this module are: - `Error`: A type representing formatting errors. - `Formatter`: A struct that holds the configuration and buffer for formatting. - `Display`: A trait for standard formatting using the empty format (`{}`). - `Debug`: A trait for debug formatting using the empty format (`{:?}`). - `LowerHex`: A trait for hex formatting in lower case.
[url] https://docs.starknet.io/build/corelib/core-fmt

[functions]

- trait Debug | A trait for debug formatting, using the empty format (`{:?}`).
- trait Display | A trait for standard formatting, using the empty format ("{}").
- #[derive(Drop)] pub struct Error {} | Dedicated type for representing formatting errors.
- #[derive(Default, Drop)] pub struct Formatter { pub buffer: ByteArray, } | Configuration for formatting.
- into_felt252_based | Implementations for `Debug` and `LowerHex` for types that can be converted into `felt252` using the `Into` trait.
- trait LowerHex | A trait for hex formatting in lower case, using the empty format (`{:x}`).
- modules | | | | |:---|:---| | [into_felt252_based](./core-fmt-into_felt252_based) | Implementations for `Debug` and `LowerHex` for types that can be converted into `felt252` using the `Into` trait.... |
- structs | | | | |:---|:---| | [Error](./core-fmt-Error) | Dedicated type for representing formatting errors. | | [Formatter](./core-fmt-Formatter) | Configuration for formatting. |
- traits | | | | |:---|:---| | [Display](./core-fmt-Display) | A trait for standard formatting, using the empty format (`{}`).... | | [Debug](./core-fmt-Debug) | A trait for debug formatting, using the empty format (`{:?}`).... | | [LowerHex](./core-fmt-LowerHex) | A trait for hex formatting in lower case, using the empty format (`{:x}`). |

[module] core::free_functions
[doc] | | | |:---|:---| | [panic_with_felt252](./core-panic_with_felt252) | Panics with the given `felt252` as error message.... | | [panic_with_const_felt252](./core-panic_with_const_felt252) | Panics with the given const argument `felt252` as error message.... | | [assert](./core-assert) | Panics if `cond` is false with the given `felt252` as error message.... |
[url] https://docs.starknet.io/build/corelib/core-free_functions

[module] core::gas
[doc] Utilities for handling gas in Cairo code.
[url] https://docs.starknet.io/build/corelib/core-gas

[functions]

- type BuiltinCosts; | Type representing the table of the costs of the different builtin usages.
- extern_functions | | | | |:---|:---| | [withdraw_gas](./core-gas-withdraw_gas) | Withdraws gas from the `GasBuiltin` to handle the success case flow. Returns `Some(())` if there is sufficient gas to handle the success case, otherwise returns `None` .... | | [withdraw_gas_all](./core-gas-withdraw_gas_all) | Same as `withdraw_gas` , but directly receives `BuiltinCosts` , which enables optimizations by removing the need for repeated internal calls for fetching the table of constants that may... | | [redeposit_gas](./core-gas-redeposit_gas) | Returns unused gas into the gas builtin. Useful for cases where different branches take different amounts of gas, but gas withdrawal is the same for both. | | [get_builtin_costs](./core-gas-get_builtin_costs) | Returns the `BuiltinCosts` table to be used in `withdraw_gas_all` . | | [gas_reserve_create](./core-gas-gas_reserve_create) | Creates a new gas reserve by withdrawing the specified amount from the gas counter. Returns `Some(GasReserve)` if there is sufficient gas, otherwise returns `None` . | | [gas_reserve_utilize](./core-gas-gas_reserve_utilize) | Adds the gas stored in the reserve back to the gas counter. The reserve is consumed in the process. |
- extern_types | | | | |:---|:---| | [BuiltinCosts](./core-gas-BuiltinCosts) | Type representing the table of the costs of the different builtin usages. | | [GasBuiltin](./core-gas-GasBuiltin) | The gas builtin. This type is used to handle gas in the Cairo code. Contains the amount of gas available for the current run. | | [GasReserve](./core-gas-GasReserve) | Represents a gas reserve. Gas reserves can be created at any point using gas from the gas counter, and can be utilized at a later point in time. |
- gas_reserve_create(amount: u128) -> Option implicits(RangeCheck, GasBuiltin) nopanic; [nopanic,extern] | Creates a new gas reserve by withdrawing the specified amount from the gas counter. Returns `Some(GasReserve)` if there is sufficient gas, otherwise returns `None`.
- gas_reserve_utilize(reserve: GasReserve) implicits(GasBuiltin) nopanic; [nopanic,extern] | Adds the gas stored in the reserve back to the gas counter. The reserve is consumed in the process.
- type GasBuiltin; | The gas builtin. This type is used to handle gas in the Cairo code. Contains the amount of gas available for the current run.
- type GasReserve; | Represents a gas reserve. Gas reserves can be created at any point using gas from the gas counter, and can be utilized at a later point in time.
- get_builtin_costs() -> BuiltinCosts nopanic; [nopanic,extern] | Returns the `BuiltinCosts` table to be used in `withdraw_gas_all`.
- redeposit_gas() implicits(GasBuiltin) nopanic; [nopanic,extern] | Returns unused gas into the gas builtin. Useful for cases where different branches take different amounts of gas, but gas withdrawal is the same for both.
- withdraw_gas() -> Option implicits(RangeCheck, GasBuiltin) nopanic; [nopanic,extern] | Withdraws gas from the `GasBuiltin` to handle the success case flow. Returns `Some(())` if there is sufficient gas to handle the success case, otherwise returns `None`.
- withdraw_gas_all(costs: BuiltinCosts) -> Option implicits(RangeCheck, GasBuiltin) nopanic; [nopanic,extern] | Same as `withdraw_gas`, but directly receives `BuiltinCosts`, which enables optimizations by removing the need for repeated internal calls for fetching the table of constants that may internally happen in calls to `withdraw_gas`. Should be used with caution.

[module] core::hash
[doc] Generic hashing support. This module provides a hash state abstraction that can be updated with values and finalized to produce a hash. This allows for flexible and efficient hashing of any type with different hash functions. The simplest way to make a type hashable is to use `#[derive(Hash)]`. Hashing a value is done by initiating a `HashState` corresponding to a hash function, updating it with the value, and then finalizing it to get the hash result.
[url] https://docs.starknet.io/build/corelib/core-hash

[functions]

- trait Hash> | A trait for values that can be hashed. This trait should be implemented for any type that can be included in a hash calculation. The most common way to implement this trait is by using `#[derive(Hash)]`.
- trait HashStateExTrait | Extension trait for hash state accumulators. This trait adds the `update_with` method to hash states, allowing you to directly hash values of any type T that implements `Hash`, rather than having to manually convert values to felt252 first. This provides a more ergonomic API when working with complex types.
- trait HashStateTrait | A trait for hash state accumulators. Provides methods to update a hash state with new values and finalize it into a hash result.
- into_felt252_based | Implementation for `Hash` for types that can be converted into `felt252` using the `Into` trait.
- trait LegacyHash | A trait for hashing values using a `felt252` as hash state, used for backwards compatibility. NOTE: Implement `Hash` instead of this trait if possible.
- modules | | | | |:---|:---| | [into_felt252_based](./core-hash-into_felt252_based) | Implementation for `Hash` for types that can be converted into `felt252` using the `Into` trait.... |
- traits | | | | |:---|:---| | [HashStateTrait](./core-hash-HashStateTrait) | A trait for hash state accumulators. Provides methods to update a hash state with new values and finalize it into a hash result. | | [Hash](./core-hash-Hash) | A trait for values that can be hashed. This trait should be implemented for any type that can be included in a hash calculation. The most common way to implement this trait is by using... | | [LegacyHash](./core-hash-LegacyHash) | A trait for hashing values using a `felt252` as hash state, used for backwards compatibility. NOTE: Implement `Hash` instead of this trait if possible. | | [HashStateExTrait](./core-hash-HashStateExTrait) | Extension trait for hash state accumulators. This trait adds the `update_with` method to hash states, allowing you to directly hash values of any type T that implements `Hash`... |

[module] core::integer
[doc] Integer types and operations. This module provides the built-in integer types and their associated operations.
[url] https://docs.starknet.io/build/corelib/core-integer

[functions]

- type Bitwise;
- trait BoundedInt | Trait for getting the maximal and minimal values of an integer type.
- extern_functions | | | | |:---|:---| | [u128_overflowing_add](./core-integer-u128_overflowing_add) | — | | [u128_overflowing_sub](./core-integer-u128_overflowing_sub) | — | | [u128_sqrt](./core-integer-u128_sqrt) | — | | [u128_safe_divmod](./core-integer-u128_safe_divmod) | — | | [u128_byte_reverse](./core-integer-u128_byte_reverse) | — | | [u8_overflowing_add](./core-integer-u8_overflowing_add) | — | | [u8_overflowing_sub](./core-integer-u8_overflowing_sub) | — | | [u8_wide_mul](./core-integer-u8_wide_mul) | — | | [u8_sqrt](./core-integer-u8_sqrt) | — | | [u8_safe_divmod](./core-integer-u8_safe_divmod) | — | | [u16_overflowing_add](./core-integer-u16_overflowing_add) | — | | [u16_overflowing_sub](./core-integer-u16_overflowing_sub) | — | | [u16_wide_mul](./core-integer-u16_wide_mul) | — | | [u16_sqrt](./core-integer-u16_sqrt) | — | | [u16_safe_divmod](./core-integer-u16_safe_divmod) | — | | [u32_overflowing_add](./core-integer-u32_overflowing_add) | — | | [u32_overflowing_sub](./core-integer-u32_overflowing_sub) | — | | [u32_wide_mul](./core-integer-u32_wide_mul) | — | | [u32_sqrt](./core-integer-u32_sqrt) | — | | [u32_safe_divmod](./core-integer-u32_safe_divmod) | — | | [u64_overflowing_add](./core-integer-u64_overflowing_add) | — | | [u64_overflowing_sub](./core-integer-u64_overflowing_sub) | — | | [u64_wide_mul](./core-integer-u64_wide_mul) | — | | [u64_sqrt](./core-integer-u64_sqrt) | — | | [u64_safe_divmod](./core-integer-u64_safe_divmod) | — | | [u256_sqrt](./core-integer-u256_sqrt) | — | | [i8_wide_mul](./core-integer-i8_wide_mul) | — | | [i8_diff](./core-integer-i8_diff) | If `lhs` >= `rhs` returns `Ok(lhs - rhs)` else returns `Err(2**8 + lhs - rhs)` . | | [i16_wide_mul](./core-integer-i16_wide_mul) | — | | [i16_diff](./core-integer-i16_diff) | If `lhs` >= `rhs` returns `Ok(lhs - rhs)` else returns `Err(2**16 + lhs - rhs)` . | | [i32_wide_mul](./core-integer-i32_wide_mul) | — | | [i32_diff](./core-integer-i32_diff) | If `lhs` >= `rhs` returns `Ok(lhs - rhs)` else returns `Err(2**32 + lhs - rhs)` . | | [i64_wide_mul](./core-integer-i64_wide_mul) | — | | [i64_diff](./core-integer-i64_diff) | If `lhs` >= `rhs` returns `Ok(lhs - rhs)` else returns `Err(2**64 + lhs - rhs)` . | | [i128_diff](./core-integer-i128_diff) | If `lhs` >= `rhs` returns `Ok(lhs - rhs)` else returns `Err(2**128 + lhs - rhs)` . |
- extern_types | | | | |:---|:---| | [u128](./core-integer-u128) | The 128-bit unsigned integer type. | | [U128MulGuarantee](./core-integer-U128MulGuarantee) | A type that contains 4 u128s (a, b, c, d) and guarantees that `a * b = 2**128 * c + d` . The guarantee is verified by `u128_mul_guarantee_verify` , which is the only way to destruct this... | | [Bitwise](./core-integer-Bitwise) | — | | [u8](./core-integer-u8) | The 8-bit unsigned integer type. | | [u16](./core-integer-u16) | The 16-bit unsigned integer type. | | [u32](./core-integer-u32) | The 32-bit unsigned integer type. | | [u64](./core-integer-u64) | The 64-bit unsigned integer type. | | [i8](./core-integer-i8) | The 8-bit signed integer type. | | [i16](./core-integer-i16) | The 16-bit signed integer type. | | [i32](./core-integer-i32) | The 32-bit signed integer type. | | [i64](./core-integer-i64) | The 64-bit signed integer type. | | [i128](./core-integer-i128) | The 128-bit signed integer type. |
- free_functions | | | | |:---|:---| | [u128_wrapping_add](./core-integer-u128_wrapping_add) | — | | [u128_wrapping_sub](./core-integer-u128_wrapping_sub) | — | | [u128_wide_mul](./core-integer-u128_wide_mul) | Multiplies two u128s and returns `(high, low)` - the 128-bit parts of the result. | | [u128_overflowing_mul](./core-integer-u128_overflowing_mul) | — | | [u8_wrapping_add](./core-integer-u8_wrapping_add) | — | | [u8_wrapping_sub](./core-integer-u8_wrapping_sub) | — | | [u16_wrapping_add](./core-integer-u16_wrapping_add) | — | | [u16_wrapping_sub](./core-integer-u16_wrapping_sub) | — | | [u32_wrapping_add](./core-integer-u32_wrapping_add) | — | | [u32_wrapping_sub](./core-integer-u32_wrapping_sub) | — | | [u64_wrapping_add](./core-integer-u64_wrapping_add) | — | | [u64_wrapping_sub](./core-integer-u64_wrapping_sub) | — | | [u256_overflowing_add](./core-integer-u256_overflowing_add) | — | | [u256_overflowing_sub](./core-integer-u256_overflowing_sub) | — | | [u256_overflow_sub](./core-integer-u256_overflow_sub) | — | | [u256_overflowing_mul](./core-integer-u256_overflowing_mul) | — | | [u256_overflow_mul](./core-integer-u256_overflow_mul) | — | | [u256_wide_mul](./core-integer-u256_wide_mul) | — | | [u512_safe_div_rem_by_u256](./core-integer-u512_safe_div_rem_by_u256) | Calculates division with remainder of a u512 by a non-zero u256. |
- type i128; | The 128-bit signed integer type.
- type i16; | The 16-bit signed integer type.
- type i32; | The 32-bit signed integer type.
- type i64; | The 64-bit signed integer type.
- type i8; | The 8-bit signed integer type.
- trait NumericLiteral
- structs | | | | |:---|:---| | [u256](./core-integer-u256) | The 256-bit unsigned integer type. The `u256` type is composed of two 128-bit parts: the low part [ 0, 128) and the high part [ 128, 256). | | [u512](./core-integer-u512) | — |
- traits | | | | |:---|:---| | [NumericLiteral](./core-integer-NumericLiteral) | — | | [BoundedInt](./core-integer-BoundedInt) | Trait for getting the maximal and minimal values of an integer type. |
- type u128; | The 128-bit unsigned integer type.
- u128_byte_reverse(input: u128) -> u128 implicits(Bitwise) nopanic; [nopanic,extern]
- u128_overflowing_mul(lhs: u128, rhs: u128) -> (u128, bool)
- type U128MulGuarantee; | A type that contains 4 u128s (a, b, c, d) and guarantees that `a * b = 2**128 * c + d`. The guarantee is verified by `u128_mul_guarantee_verify`, which is the only way to destruct this type. This way, one can trust that the guarantee holds although it has not yet been verified.
- type u16; | The 16-bit unsigned integer type.
- #[derive(Copy, Drop, Hash, PartialEq, Serde)] pub struct u256 { pub low: u128, pub high: u128, } | The 256-bit unsigned integer type. The `u256` type is composed of two 128-bit parts: the low part [0, 128) and the high part [128, 256).
- u256_overflow_mul(lhs: u256, rhs: u256) -> (u256, bool)
- u256_overflow_sub(lhs: u256, rhs: u256) -> (u256, bool)
- u256_overflowing_mul(lhs: u256, rhs: u256) -> (u256, bool)
- type u32; | The 32-bit unsigned integer type.
- #[derive(Copy, Drop, Hash, PartialEq, Serde)] pub struct u512 { pub limb0: u128, pub limb1: u128, pub limb2: u128, pub limb3: u128, }
- u512_safe_div_rem_by_u256(lhs: u512, rhs: NonZero) -> (u512, u256) | Calculates division with remainder of a u512 by a non-zero u256.
- type u64; | The 64-bit unsigned integer type.
- type u8; | The 8-bit unsigned integer type.

[template:unsigned_int] T in {u8,u16,u32,u64,u128,u256}
[functions]

- T_overflowing_add(lhs: T, rhs: T) -> Result implicits(RangeCheck) nopanic;
- T_overflowing_sub(lhs: T, rhs: T) -> Result implicits(RangeCheck) nopanic;
- T_sqrt(value: T) -> T implicits(RangeCheck) nopanic;

[template:template_2] T in {u8,u16,u32,u64,u128,u256,i8,i16,i32,i64}
[functions]

- T_wide_mul(lhs: T, rhs: T) -> T nopanic;

[template:unsigned_int] T in {u8,u16,u32,u64,u128}
[functions]

- T_safe_divmod(lhs: T, rhs: NonZero) -> (T, T) implicits(RangeCheck) nopanic;
- T_wrapping_add(lhs: T, rhs: T) -> T
- T_wrapping_sub(lhs: T, rhs: T) -> T

[template:signed_int] T in {i8,i16,i32,i64,i128}
[functions]

- T_diff(lhs: T, rhs: T) -> Result implicits(RangeCheck) nopanic;

[module] core::internal
[doc] | | | |:---|:---| | [bounded_int](./core-internal-bounded_int) | — |
[url] https://docs.starknet.io/build/corelib/core-internal

[functions]

- bounded_int | | | | |:---|:---| | [UnitInt](./core-internal-bounded_int-UnitInt) | — |
- struct DestructWith> { pub value: T, } | Wrapper type to ensure that a type `T` is destructed using a specific `Destruct` impl.
- struct DropWith> { pub value: T, } | Wrapper type to ensure that a type `T` is dropped using a specific `Drop` impl.
- enums | | | | |:---|:---| | [OptionRev](./core-internal-OptionRev) | Same as `Option` , except that the order of the variants is reversed. This is used as the return type of some libfuncs for efficiency reasons. | | [LoopResult](./core-internal-LoopResult) | The return type for loops with an early return. |
- extern_functions | | | | |:---|:---| | [revoke_ap_tracking](./core-internal-revoke_ap_tracking) | — | | [require_implicit](./core-internal-require_implicit) | Function to enforce that `Implicit` is used by a function calling it. Note: This extern function is not mapped to a Sierra function, and all usages of it are removed during compilation. |
- #[derive(Destruct)] pub struct InferDestruct { pub value: T, } | Helper to have the same interface as `DestructWith` while inferring the `Destruct` implementation.
- #[derive(Drop)] pub struct InferDrop { pub value: T, } | Helper to have the same interface as `DropWith` while inferring the `Drop` implementation.
- enum LoopResult { Normal: N, EarlyReturn: E, } | The return type for loops with an early return.
- modules | | | | |:---|:---| | [bounded_int](./core-internal-bounded_int) | — |
- enum OptionRev { None, Some: T, } | Same as `Option`, except that the order of the variants is reversed. This is used as the return type of some libfuncs for efficiency reasons.
- require_implicit() implicits(Implicit) nopanic; [nopanic,extern] | Function to enforce that `Implicit` is used by a function calling it. Note: This extern function is not mapped to a Sierra function, and all usages of it are removed during compilation.
- revoke_ap_tracking() nopanic; [nopanic,extern]
- structs | | | | |:---|:---| | [DropWith](./core-internal-DropWith) | Wrapper type to ensure that a type `T` is dropped using a specific `Drop` impl. | | [InferDrop](./core-internal-InferDrop) | Helper to have the same interface as `DropWith` while inferring the `Drop` implementation. | | [DestructWith](./core-internal-DestructWith) | Wrapper type to ensure that a type `T` is destructed using a specific `Destruct` impl. | | [InferDestruct](./core-internal-InferDestruct) | Helper to have the same interface as `DestructWith` while inferring the `Destruct` implementation. |

[module] core::internal::bounded_int
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-internal-bounded_int

[functions]

- trait AddHelper | A helper trait for adding two `BoundedInt` instances.
- bounded_int_add(lhs: Lhs, rhs: Rhs) -> Result nopanic; [nopanic,extern]
- bounded_int_constrain(value: T) -> Result implicits(RangeCheck) nopanic; [nopanic,extern]
- bounded_int_div_rem(lhs: Lhs, rhs: NonZero) -> (DivT, RemT) implicits(RangeCheck) nopanic; [nopanic,extern]
- bounded_int_is_zero(value: T) -> IsZeroResult nopanic; [nopanic,extern]
- bounded_int_mul(lhs: Lhs, rhs: Rhs) -> Result nopanic; [nopanic,extern]
- bounded_int_sub(lhs: Lhs, rhs: Rhs) -> Result nopanic; [nopanic,extern]
- bounded_int_trim_max(value: T) -> OptionRev nopanic; [nopanic,extern]
- bounded_int_trim_min(value: T) -> OptionRev nopanic; [nopanic,extern]
- trait ConstrainHelper | A helper trait for constraining a `BoundedInt` instance.
- trait DivRemHelper | A helper trait for dividing two `BoundedInt` instances.
- downcast(x: FromType) -> Option implicits(RangeCheck) nopanic; [nopanic,extern] | Downcasts `FromType` to `ToType` - for types where conversion may fail. If done for wrong types would cause a compiler panic at the Sierra stage.
- extern_functions | | | | |:---|:---| | [upcast](./core-internal-bounded_int-upcast) | Upcasts `FromType` to `ToType` - for types where conversion is always legal. If done for wrong types would cause a compiler panic at the Sierra stage. | | [downcast](./core-internal-bounded_int-downcast) | Downcasts `FromType` to `ToType` - for types where conversion may fail. If done for wrong types would cause a compiler panic at the Sierra stage. | | [bounded_int_add](./core-internal-bounded_int-bounded_int_add) | — | | [bounded_int_constrain](./core-internal-bounded_int-bounded_int_constrain) | — | | [bounded_int_div_rem](./core-internal-bounded_int-bounded_int_div_rem) | — | | [bounded_int_is_zero](./core-internal-bounded_int-bounded_int_is_zero) | — | | [bounded_int_mul](./core-internal-bounded_int-bounded_int_mul) | — | | [bounded_int_sub](./core-internal-bounded_int-bounded_int_sub) | — | | [bounded_int_trim_max](./core-internal-bounded_int-bounded_int_trim_max) | — | | [bounded_int_trim_min](./core-internal-bounded_int-bounded_int_trim_min) | — |
- trait MulHelper | A helper trait for multiplying two `BoundedInt` instances.
- trait NegateHelper | A helper trait for negating a `BoundedInt` instance.
- trait SubHelper | A helper trait for subtracting two `BoundedInt` instances.
- traits | | | | |:---|:---| | [AddHelper](./core-internal-bounded_int-AddHelper) | A helper trait for adding two `BoundedInt` instances. | | [SubHelper](./core-internal-bounded_int-SubHelper) | A helper trait for subtracting two `BoundedInt` instances. | | [MulHelper](./core-internal-bounded_int-MulHelper) | A helper trait for multiplying two `BoundedInt` instances. | | [DivRemHelper](./core-internal-bounded_int-DivRemHelper) | A helper trait for dividing two `BoundedInt` instances. | | [ConstrainHelper](./core-internal-bounded_int-ConstrainHelper) | A helper trait for constraining a `BoundedInt` instance. | | [TrimMinHelper](./core-internal-bounded_int-TrimMinHelper) | A helper trait for trimming a `BoundedInt` instance min value. | | [TrimMaxHelper](./core-internal-bounded_int-TrimMaxHelper) | A helper trait for trimming a `BoundedInt` instance max value. | | [NegateHelper](./core-internal-bounded_int-NegateHelper) | A helper trait for negating a `BoundedInt` instance. |
- trait TrimMaxHelper | A helper trait for trimming a `BoundedInt` instance max value.
- trait TrimMinHelper | A helper trait for trimming a `BoundedInt` instance min value.
- type_aliases | | | | |:---|:---| | [UnitInt](./core-internal-bounded_int-UnitInt) | — |
- type UnitInt = BoundedInt;
- upcast(x: FromType) -> ToType nopanic; [nopanic,extern] | Upcasts `FromType` to `ToType` - for types where conversion is always legal. If done for wrong types would cause a compiler panic at the Sierra stage.

[module] core::iter
[doc] Composable external iteration. If you've found yourself with a collection of some kind, and needed to perform an operation on the elements of said collection, you'll quickly run into 'iterators'. Iterators are heavily used in idiomatic code, so it's worth becoming familiar with them. Before explaining more, let's talk about how this module is structured:
[url] https://docs.starknet.io/build/corelib/core-iter

[functions]

- adapters | | | | |:---|:---| | [zip](./core-iter-adapters-zip) | — | | [peekable](./core-iter-adapters-peekable) | — |
- modules | | | | |:---|:---| | [adapters](./core-iter-adapters) | — | | [traits](./core-iter-traits) | — |
- traits | | | | |:---|:---| | [collect](./core-iter-traits-collect) | — | | [iterator](./core-iter-traits-iterator) | — |

[module] core::iter::adapters
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-iter-adapters

[functions]

- modules | | | | |:---|:---| | [zip](./core-iter-adapters-zip) | — | | [peekable](./core-iter-adapters-peekable) | — |
- peekable | | | | |:---|:---| | [PeekableTrait](./core-iter-adapters-peekable-PeekableTrait) | — |
- zip | | | | |:---|:---| | [zip](./core-iter-adapters-zip-zip) | Converts the arguments to iterators and zips them. See the documentation of `Iterator::zip` for more.... |

[module] core::iter::adapters::peekable
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-iter-adapters-peekable

[functions]

- trait PeekableTrait+Copy+Drop> | Returns a copy of the next() value without advancing the iterator. Like `next`, if there is a value, it is wrapped in a `Some(T)`. But if the iteration is over, `None` is returned.
- traits | | | | |:---|:---| | [PeekableTrait](./core-iter-adapters-peekable-PeekableTrait) | — |

[module] core::iter::adapters::zip
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-iter-adapters-zip

[functions]

- free_functions | | | | |:---|:---| | [zip](./core-iter-adapters-zip-zip) | Converts the arguments to iterators and zips them. See the documentation of `Iterator::zip` for more.... |
- zip, impl BIntoIter: IntoIterator, +Destruct, +Destruct, >( a: A, b: B, ) -> Zip | Converts the arguments to iterators and zips them. See the documentation of `Iterator::zip` for more.

[module] core::iter::traits
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-iter-traits

[functions]

- collect | | | | |:---|:---| | [Extend](./core-iter-traits-collect-Extend) | Extend a collection with the contents of an iterator. Iterators produce a series of values, and collections can also be thought of as a series of values. The `Extend`... | | [FromIterator](./core-iter-traits-collect-FromIterator) | Conversion from an [`Iterator`](./core-iter-traits-iterator-Iterator) . By implementing `FromIterator` for a type, you define how it will be... | | [IntoIterator](./core-iter-traits-collect-IntoIterator) | Conversion into an [`Iterator`](./core-iter-traits-iterator-Iterator) . By implementing `IntoIterator` for a type, you define how it will be... |
- iterator | | | | |:---|:---| | [Iterator](./core-iter-traits-iterator-Iterator) | A trait for dealing with iterators. This is the main iterator trait. For more about the concept of iterators generally, please see the [module-level documentation](./core-iter)... |
- modules | | | | |:---|:---| | [collect](./core-iter-traits-collect) | — | | [iterator](./core-iter-traits-iterator) | — |

[module] core::iter::traits::collect
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-iter-traits-collect

[functions]

- trait Extend | Extend a collection with the contents of an iterator. Iterators produce a series of values, and collections can also be thought of as a series of values. The `Extend` trait bridges this gap, allowing you to extend a collection by including the contents of that iterator. When extending a collection with an already existing key, that entry is updated or, in the case of collections that permit multiple entries with equal keys, that entry is inserted.
- trait FromIterator | Conversion from an [`Iterator`](./core-iter-traits-iterator-Iterator). By implementing `FromIterator` for a type, you define how it will be created from an iterator. This is common for types which describe a collection of some kind. If you want to create a collection from the contents of an iterator, the `Iterator::collect()` method is preferred. However, when you need to specify the container type, `FromIterator::from_iter()` can be more readable than using a turbofish (e.g. `::>()`). See the `Iterator::collect()` documentation for more examples of its use. See also: [`IntoIterator`](./core-iter-traits-collect-IntoIterator).
- trait IntoIterator | Conversion into an [`Iterator`](./core-iter-traits-iterator-Iterator). By implementing `IntoIterator` for a type, you define how it will be converted to an iterator. This is common for types which describe a collection of some kind. One benefit of implementing `IntoIterator` is that your type will work with Cairo's `for` loop syntax. See also: [`FromIterator`](./core-iter-traits-collect-FromIterator).
- traits | | | | |:---|:---| | [Extend](./core-iter-traits-collect-Extend) | Extend a collection with the contents of an iterator. Iterators produce a series of values, and collections can also be thought of as a series of values. The `Extend`... | | [FromIterator](./core-iter-traits-collect-FromIterator) | Conversion from an [`Iterator`](./core-iter-traits-iterator-Iterator) . By implementing `FromIterator` for a type, you define how it will be... | | [IntoIterator](./core-iter-traits-collect-IntoIterator) | Conversion into an [`Iterator`](./core-iter-traits-iterator-Iterator) . By implementing `IntoIterator` for a type, you define how it will be... |

[module] core::iter::traits::iterator
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-iter-traits-iterator

[functions]

- trait Iterator | A trait for dealing with iterators. This is the main iterator trait. For more about the concept of iterators generally, please see the [module-level documentation](./core-iter). In particular, you may want to know how to [implement `Iterator`](./core-iter).
- traits | | | | |:---|:---| | [Iterator](./core-iter-traits-iterator-Iterator) | A trait for dealing with iterators. This is the main iterator trait. For more about the concept of iterators generally, please see the [module-level documentation](./core-iter)... |

[module] core::keccak
[doc] Keccak-256 cryptographic hash function implementation.
[url] https://docs.starknet.io/build/corelib/core-keccak

[functions]

- cairo_keccak(ref input: Array, last_input_word: u64, last_input_num_bytes: u32) -> u256 | Computes the Keccak-256 hash of a byte sequence with custom padding. This function allows hashing arbitrary byte sequences by providing the input as 64-bit words in little-endian format and a final partial word.
- compute_keccak_byte_array(arr: ByteArray) -> u256 | Computes the Keccak-256 hash of a `ByteArray`.
- free_functions | | | | |:---|:---| | [keccak_u256s_le_inputs](./core-keccak-keccak_u256s_le_inputs) | Computes the Keccak-256 hash of multiple `u256` values in little-endian format.... | | [keccak_u256s_be_inputs](./core-keccak-keccak_u256s_be_inputs) | Computes the Keccak-256 hash of multiple `u256` values in big-endian format.... | | [cairo_keccak](./core-keccak-cairo_keccak) | Computes the Keccak-256 hash of a byte sequence with custom padding. This function allows hashing arbitrary byte sequences by providing the input as... | | [compute_keccak_byte_array](./core-keccak-compute_keccak_byte_array) | Computes the Keccak-256 hash of a `ByteArray` .... |
- keccak_u256s_be_inputs(mut input: Span) -> u256 | Computes the Keccak-256 hash of multiple `u256` values in big-endian format.
- keccak_u256s_le_inputs(mut input: Span) -> u256 | Computes the Keccak-256 hash of multiple `u256` values in little-endian format.

[module] core::math
[doc] Mathematical operations and utilities. Provides extended GCD, modular inverse, and modular arithmetic operations.
[url] https://docs.starknet.io/build/corelib/core-math

[functions]

- egcd, +Drop, +Add, +Mul, +DivRem, +core::num::traits::Zero, +core::num::traits::One, +TryInto>, >( a: NonZero, b: NonZero, ) -> (T, T, T, bool) | Computes the extended GCD and Bezout coefficients for two numbers. Uses the Extended Euclidean algorithm to find (g, s, t, sub_direction) where `g = gcd(a, b)`. The relationship between inputs and outputs is: - If `sub_direction` is true: `g = s * a - t * b` - If `sub_direction` is false: `g = t * b - s * a`
- free_functions | | | | |:---|:---| | [egcd](./core-math-egcd) | Computes the extended GCD and Bezout coefficients for two numbers. Uses the Extended Euclidean algorithm to find (g, s, t, sub_direction) where `g = gcd(a, b)` .... | | [inv_mod](./core-math-inv_mod) | Computes the modular multiplicative inverse of `a` modulo `n` . Returns `s` such that `a*s ≡ 1 (mod n)` where `s` is between `1` and `n-1` inclusive, or `None` if `gcd(a,n) > 1`... | | [u256_inv_mod](./core-math-u256_inv_mod) | Returns the inverse of `a` modulo `n` , or `None` if `a` is not invertible modulo `n` . All `a` s will be considered not invertible for `n == 1` .... | | [u256_div_mod_n](./core-math-u256_div_mod_n) | Returns `a / b (mod n)` , or `None` if `b` is not invertible modulo `n` .... | | [u256_mul_mod_n](./core-math-u256_mul_mod_n) | Returns `a * b (mod n)` .... |
- inv_mod, +Drop, +Add, +Sub, +Mul, +DivRem, +core::num::traits::Zero, +core::num::traits::One, +TryInto>, >( a: NonZero, n: NonZero, ) -> Option | Computes the modular multiplicative inverse of `a` modulo `n`. Returns `s` such that `a*s ≡ 1 (mod n)` where `s` is between `1` and `n-1` inclusive, or `None` if `gcd(a,n) > 1` (inverse doesn't exist).
- u256_div_mod_n(a: u256, b: u256, n: NonZero) -> Option | Returns `a / b (mod n)`, or `None` if `b` is not invertible modulo `n`.
- u256_inv_mod(a: u256, n: NonZero) -> Option> | Returns the inverse of `a` modulo `n`, or `None` if `a` is not invertible modulo `n`. All `a`s will be considered not invertible for `n == 1`.
- u256_mul_mod_n(a: u256, b: u256, n: NonZero) -> u256 | Returns `a * b (mod n)`.

[module] core::metaprogramming
[doc] Metaprogramming utilities.
[url] https://docs.starknet.io/build/corelib/core-metaprogramming

[functions]

- traits | | | | |:---|:---| | [TypeEqual](./core-metaprogramming-TypeEqual) | A trait that can be used to disable implementations based on the types of the generic args. Assumes that `TypeEqualImpl` is the only implementation of this trait.... |
- trait TypeEqual | A trait that can be used to disable implementations based on the types of the generic args. Assumes that `TypeEqualImpl` is the only implementation of this trait. Primarily used for optimizations by enabling type-specific implementations. Since `TypeEqualImpl` is the only implementation, adding `-TypeEqual` as a trait bound ensures the implementation is only available when T and U are different types.

[module] core::modules
[doc] | | | |:---|:---| | [traits](./core-traits) | Core traits for various operations. This module provides a collection of essential traits that define common behavior patterns for Cairo types.... | | [boolean](./core-boolean) | Boolean operations. The `bool` type is a primitive type in Cairo representing a boolean value that can be either `true` or `false`... | | [circuit](./core-circuit) | Efficient modular arithmetic computations using arithmetic circuits. This module provides a type-safe way to perform modular arithmetic operations using... | | [blake](./core-blake) | — | | [box](./core-box) | `Box` is a smart pointer that allows for:... | | [nullable](./core-nullable) | A wrapper type for handling optional values. `Nullable` is a wrapper type that can either contain a value stored in a `Box`... | | [array](./core-array) | A contiguous collection of elements of the same type in memory, written `Array` . Arrays have O (1) indexing, O (1) push and O (1) pop (from the front).... | | [dict](./core-dict) | A dictionary-like data structure that maps `felt252` keys to values of any type. The `Felt252Dict` provides efficient key-value storage with operations for inserting,... | | [result](./core-result) | Error handling with the `Result` type. [`Result`](./core-result-Result) is the type used for returning and propagating errors. It is an enum with the variants, `Ok(T)` , representing... | | [option](./core-option) | Optional values. The [`Option`](./core-option-Option) type represents an optional value: every [`Option`](./core-option-Option) is either [`Some`](./core-option#some) and... | | [clone](./core-clone) | The `Clone` trait provides the ability to duplicate instances of types that cannot be 'implicitly copied'. In Cairo, some simple types are "implicitly copyable": when you assign them or pass them as... | | [ec](./core-ec) | Functions and constructs related to elliptic curve operations on the STARK curve. This module provides implementations for various elliptic curve operations tailored for the STARK curve.... | | [ecdsa](./core-ecdsa) | Elliptic Curve Digital Signature Algorithm (ECDSA) for the STARK curve. This module provides implementations for ECDSA signature verification and public key recovery... | | [integer](./core-integer) | Integer types and operations. This module provides the built-in integer types and their associated operations.... | | [cmp](./core-cmp) | Utilities for comparing and ordering values. This module contains functions that rely on the `PartialOrd` trait for comparing values.... | | [gas](./core-gas) | Utilities for handling gas in Cairo code. | | [math](./core-math) | Mathematical operations and utilities. Provides extended GCD, modular inverse, and modular arithmetic operations. | | [num](./core-num) | — | | [ops](./core-ops) | Overloadable operators. Implementing these traits allows you to overload certain operators. Note: Other overloadable operators are also defined in the [`core::traits`](./core-traits) module.... | | [panics](./core-panics) | Core panic mechanism. This module provides the core panic functionality used for error handling in Cairo. It defines the basic types and functions used to trigger and manage panics, which... | | [hash](./core-hash) | Generic hashing support. This module provides a hash state abstraction that can be updated with values and finalized to... | | [keccak](./core-keccak) | Keccak-256 cryptographic hash function implementation.... | | [pedersen](./core-pedersen) | Pedersen hash related traits implementations. This module provides an implementation of the Pedersen hash function, which is a collision-resistant cryptographic hash function. The `HashState`... | | [qm31](./core-qm31) | Definition for the `qm31` type. Only available for local proofs. The implementations defined in this module can be accessed by using the traits directly. | | [serde](./core-serde) | Serialization and deserialization of data structures. This module provides traits and implementations for converting Cairo types into a sequence of `felt252`... | | [sha256](./core-sha256) | Implementation of the SHA-256 cryptographic hash function. This module provides functions to compute SHA-256 hashes of data. The input data can be an array of 32-bit words, or a `ByteArray` .... | | [poseidon](./core-poseidon) | Poseidon hash related traits implementations and functions. This module provides cryptographic hash functions based on the Poseidon permutation.... | | [debug](./core-debug) | Utilities related to printing of values at runtime. The recommended way of printing values is by using the `Display` and `Debug` traits available in the [`fmt`](./core-fmt)... | | [fmt](./core-fmt) | Functionality for formatting values. The main components of this module are:... | | [starknet](./core-starknet) | Functionalities for interacting with the Starknet network.... | | [internal](./core-internal) | — | | [zeroable](./core-zeroable) | Types and traits for handling non-zero values and zero checking operations. This module provides the [`NonZero`](./core-zeroable-NonZero) wrapper type which guarantees that a value is never zero.... | | [bytes_31](./core-bytes_31) | Definitions and utilities for the `bytes31` type. The `bytes31` type is a compact, indexable 31-byte type.... | | [byte_array](./core-byte_array) | `ByteArray` is designed to handle large sequences of bytes with operations like appending, concatenation, and accessing individual bytes. It uses a structure that combines an `Array` of `bytes31`... | | [string](./core-string) | — | | [iter](./core-iter) | Composable external iteration. If you've found yourself with a collection of some kind, and needed to perform an operation on the elements of said collection, you'll quickly run... | | [metaprogramming](./core-metaprogramming) | Metaprogramming utilities. | | [testing](./core-testing) | Measurement of gas consumption for testing purpose. This module provides the `get_available_gas` function, useful for asserting the amount of gas consumed by a particular operation or function call.... | | [to_byte_array](./core-to_byte_array) | ASCII representation of numeric types for `ByteArray` manipulation. This module enables conversion of numeric values into their ASCII string representation,... |
[url] https://docs.starknet.io/build/corelib/core-modules

[module] core::never
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-never

[module] core::nullable
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-nullable

[functions]

- enums | | | | |:---|:---| | [FromNullableResult](./core-nullable-FromNullableResult) | Represents the result of matching a `Nullable` value. Used to safely handle both null and non-null cases when using `match_nullable` on a `Nullable` . |
- extern_functions | | | | |:---|:---| | [null](./core-nullable-null) | — | | [match_nullable](./core-nullable-match_nullable) | — |
- extern_types | | | | |:---|:---| | [Nullable](./core-nullable-Nullable) | A type that can either be null or contain a boxed value. |
- enum FromNullableResult { Null, NotNull: Box, } | Represents the result of matching a `Nullable` value. Used to safely handle both null and non-null cases when using `match_nullable` on a `Nullable`.
- match_nullable(value: Nullable) -> FromNullableResult nopanic; [nopanic,extern]
- null() -> Nullable nopanic; [nopanic,extern]
- type Nullable; | A type that can either be null or contain a boxed value.
- trait NullableTrait | Wrapper for `Deref::deref`. Prefer using `Deref::deref` directly. This function exists for backwards compatibility.
- traits | | | | |:---|:---| | [NullableTrait](./core-nullable-NullableTrait) | — |

[module] core::num
[doc] | | | |:---|:---| | [traits](./core-num-traits) | — |
[url] https://docs.starknet.io/build/corelib/core-num

[functions]

- modules | | | | |:---|:---| | [traits](./core-num-traits) | — |
- traits | | | | |:---|:---| | [zero](./core-num-traits-zero) | Traits for types with an additive identity element. | | [one](./core-num-traits-one) | Traits for types with a multiplicative identity element. | | [bit_size](./core-num-traits-bit_size) | Utilities for determining the bit size of types. | | [ops](./core-num-traits-ops) | — | | [bounded](./core-num-traits-bounded) | Defines minimum and maximum values for numeric types. |

[module] core::num::traits
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-num-traits

[functions]

- bit_size | Utilities for determining the bit size of types.
- bounded | Defines minimum and maximum values for numeric types.
- modules | | | | |:---|:---| | [zero](./core-num-traits-zero) | Traits for types with an additive identity element. | | [one](./core-num-traits-one) | Traits for types with a multiplicative identity element. | | [bit_size](./core-num-traits-bit_size) | Utilities for determining the bit size of types. | | [ops](./core-num-traits-ops) | — | | [bounded](./core-num-traits-bounded) | Defines minimum and maximum values for numeric types. |
- one | Traits for types with a multiplicative identity element.
- ops | | | | |:---|:---| | [checked](./core-num-traits-ops-checked) | Safe arithmetic operations with overflow/underflow checking. This module provides traits for performing arithmetic operations with explicit overflow and underflow protection. These operations return... | | [divrem](./core-num-traits-ops-divrem) | — | | [overflowing](./core-num-traits-ops-overflowing) | Arithmetic operations with overflow detection. This module provides traits for performing arithmetic operations that explicitly track potential numeric overflow conditions. | | [pow](./core-num-traits-ops-pow) | Trait and implementations for raising a value to a power. This module provides efficient exponentiation operations for numeric types using... | | [saturating](./core-num-traits-ops-saturating) | Saturating arithmetic operations for numeric types. This module provides traits and implementations for arithmetic operations that saturate at the numeric type's boundaries instead of overflowing. | | [wrapping](./core-num-traits-ops-wrapping) | Arithmetic operations with overflow and underflow wrapping. This module provides traits for performing arithmetic operations that wrap around at the... | | [sqrt](./core-num-traits-ops-sqrt) | Square root operation for unsigned numeric types. | | [widemul](./core-num-traits-ops-widemul) | Trait for performing multiplication that results in a wider type. This module provides the `WideMul` trait which enables multiplication operations... | | [widesquare](./core-num-traits-ops-widesquare) | Wide square operation. This module provides the `WideSquare` trait which enables squaring operations that return a result type with double the bit width of the input type.... |
- traits | [Traits](./core-num-traits-traits) --- | | | |:---|:---| | [Zero](./core-num-traits-zero-Zero) | Defines an additive identity element for `T` .[...](./core-num-traits-zero-Zero) | | [One](./core-num-traits-one-One) | Defines a multiplicative identity element for `T` .[...](./core-num-traits-one-One) | | [BitSize](./core-num-traits-bit_size-BitSize) | A trait used to retrieve the size of a type in bits.[...](./core-num-traits-bit_size-BitSize) | | [Bounded](./core-num-traits-bounded-Bounded) | A trait defining minimum and maximum bounds for numeric types. This trait only supports types that can have constant values.[...](./core-num-traits-bounded-Bounded) | | [CheckedAdd](./core-num-traits-ops-checked-CheckedAdd) | Performs addition that returns `None` instead of wrapping around on overflow.[...](./core-num-traits-ops-checked-CheckedAdd) | | [CheckedMul](./core-num-traits-ops-checked-CheckedMul) | Performs multiplication that returns `None` instead of wrapping around on underflow or overflow.[...](./core-num-traits-ops-checked-CheckedMul) | | [CheckedSub](./core-num-traits-ops-checked-CheckedSub) | Performs subtraction that returns `None` instead of wrapping around on underflow.[...](./core-num-traits-ops-checked-CheckedSub) | | [OverflowingAdd](./core-num-traits-ops-overflowing-OverflowingAdd) | Performs addition with a flag for overflow.[...](./core-num-traits-ops-overflowing-OverflowingAdd) | | [OverflowingMul](./core-num-traits-ops-overflowing-OverflowingMul) | Performs multiplication with a flag for overflow.[...](./core-num-traits-ops-overflowing-OverflowingMul) | | [OverflowingSub](./core-num-traits-ops-overflowing-OverflowingSub) | Performs subtraction with a flag for overflow.[...](./core-num-traits-ops-overflowing-OverflowingSub) | | [Pow](./core-num-traits-ops-pow-Pow) | Raises a value to the power of `exp` . Note that `0⁰` ( `pow(0, 0)` ) returns `1` . Mathematically this is undefined.[...](./core-num-traits-ops-pow-Pow) | | [SaturatingAdd](./core-num-traits-ops-saturating-SaturatingAdd) | Performs addition that saturates at the numeric bounds instead of overflowing.[...](./core-num-traits-ops-saturating-SaturatingAdd) | | [SaturatingMul](./core-num-traits-ops-saturating-SaturatingMul) | Performs multiplication that saturates at the numeric bounds instead of overflowing.[...](./core-num-traits-ops-saturating-SaturatingMul) | | [SaturatingSub](./core-num-traits-ops-saturating-SaturatingSub) | Performs subtraction that saturates at the numeric bounds instead of overflowing.[...](./core-num-traits-ops-saturating-SaturatingSub) | | [Sqrt](./core-num-traits-ops-sqrt-Sqrt) | A trait for computing the square root of a number.[...](./core-num-traits-ops-sqrt-Sqrt) | | [WideMul](./core-num-traits-ops-widemul-WideMul) | A trait for types that can be multiplied together to produce a wider type. This trait enables multiplication operations where the result type has double[...](./core-num-traits-ops-widemul-WideMul) | | [WideSquare](./core-num-traits-ops-widesquare-WideSquare) | A trait for a type that can be squared to produce a wider type. This trait enables squaring operations where the result type has double[...](./core-num-traits-ops-widesquare-WideSquare) | | [WrappingAdd](./core-num-traits-ops-wrapping-WrappingAdd) | Performs addition that wraps around on overflow.[...](./core-num-traits-ops-wrapping-WrappingAdd) | | [WrappingMul](./core-num-traits-ops-wrapping-WrappingMul) | Performs multiplication that wraps around on overflow.[...](./core-num-traits-ops-wrapping-WrappingMul) | | [WrappingSub](./core-num-traits-ops-wrapping-WrappingSub) | Performs subtraction that wraps around on overflow.[...](./core-num-traits-ops-wrapping-WrappingSub) |
- zero | Traits for types with an additive identity element.

[module] core::num::traits::bit_size
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-num-traits-bit_size

[functions]

- trait BitSize | A trait used to retrieve the size of a type in bits.
- traits | | | | |:---|:---| | [BitSize](./core-num-traits-bit_size-BitSize) | A trait used to retrieve the size of a type in bits. |

[module] core::num::traits::bounded
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-num-traits-bounded

[functions]

- trait Bounded | A trait defining minimum and maximum bounds for numeric types. This trait only supports types that can have constant values.
- traits | | | | |:---|:---| | [Bounded](./core-num-traits-bounded-Bounded) | A trait defining minimum and maximum bounds for numeric types. This trait only supports types that can have constant values. |

[module] core::num::traits::one
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-num-traits-one

[functions]

- trait One | Defines a multiplicative identity element for `T`.
- traits | | | | |:---|:---| | [One](./core-num-traits-one-One) | Defines a multiplicative identity element for `T` .... |

[module] core::num::traits::ops
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-num-traits-ops

[functions]

- checked | Safe arithmetic operations with overflow/underflow checking. This module provides traits for performing arithmetic operations with explicit overflow and underflow protection. These operations return `None` when an overflow or underflow occurs, allowing you to handle these cases gracefully without panicking.
- divrem | | | | |:---|:---| | [DivRem](./core-num-traits-ops-divrem-DivRem) | Performs truncated division and remainder. `T` – dividend type (left-hand operand) `U` – divisor type (right-hand operand, must be wrapped in `NonZero` at call-site)... |
- modules | | | | |:---|:---| | [checked](./core-num-traits-ops-checked) | Safe arithmetic operations with overflow/underflow checking. This module provides traits for performing arithmetic operations with explicit overflow and underflow protection. These operations return... | | [divrem](./core-num-traits-ops-divrem) | — | | [overflowing](./core-num-traits-ops-overflowing) | Arithmetic operations with overflow detection. This module provides traits for performing arithmetic operations that explicitly track potential numeric overflow conditions. | | [pow](./core-num-traits-ops-pow) | Trait and implementations for raising a value to a power. This module provides efficient exponentiation operations for numeric types using... | | [saturating](./core-num-traits-ops-saturating) | Saturating arithmetic operations for numeric types. This module provides traits and implementations for arithmetic operations that saturate at the numeric type's boundaries instead of overflowing. | | [wrapping](./core-num-traits-ops-wrapping) | Arithmetic operations with overflow and underflow wrapping. This module provides traits for performing arithmetic operations that wrap around at the... | | [sqrt](./core-num-traits-ops-sqrt) | Square root operation for unsigned numeric types. | | [widemul](./core-num-traits-ops-widemul) | Trait for performing multiplication that results in a wider type. This module provides the `WideMul` trait which enables multiplication operations... | | [widesquare](./core-num-traits-ops-widesquare) | Wide square operation. This module provides the `WideSquare` trait which enables squaring operations that return a result type with double the bit width of the input type.... |
- overflowing | Arithmetic operations with overflow detection. This module provides traits for performing arithmetic operations that explicitly track potential numeric overflow conditions.
- pow | Trait and implementations for raising a value to a power. This module provides efficient exponentiation operations for numeric types using the square-and-multiply algorithm, which achieves logarithmic time complexity O(log n).
- saturating | Saturating arithmetic operations for numeric types. This module provides traits and implementations for arithmetic operations that saturate at the numeric type's boundaries instead of overflowing.
- sqrt | Square root operation for unsigned numeric types.
- widemul | Trait for performing multiplication that results in a wider type. This module provides the `WideMul` trait which enables multiplication operations that return a result type with double the bit width of the input types. This is particularly useful when you need to perform multiplication without worrying about overflow, as the result type can hold the full range of possible values.
- widesquare | Wide square operation. This module provides the `WideSquare` trait which enables squaring operations that return a result type with double the bit width of the input type. This is particularly useful when you need to square a number without worrying about overflow, as the result type can hold the full range of possible values.
- wrapping | Arithmetic operations with overflow and underflow wrapping. This module provides traits for performing arithmetic operations that wrap around at the boundary of the type in case of overflow or underflow. This is particularly useful when you want to: - Perform arithmetic operations without panicking on overflow/underflow - Implement modular arithmetic - Handle cases where overflow is expected and desired

[module] core::num::traits::ops::checked
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-num-traits-ops-checked

[functions]

- trait CheckedAdd | Performs addition that returns `None` instead of wrapping around on overflow.
- trait CheckedMul | Performs multiplication that returns `None` instead of wrapping around on underflow or overflow.
- trait CheckedSub | Performs subtraction that returns `None` instead of wrapping around on underflow.
- traits | | | | |:---|:---| | [CheckedAdd](./core-num-traits-ops-checked-CheckedAdd) | Performs addition that returns `None` instead of wrapping around on overflow.... | | [CheckedSub](./core-num-traits-ops-checked-CheckedSub) | Performs subtraction that returns `None` instead of wrapping around on underflow.... | | [CheckedMul](./core-num-traits-ops-checked-CheckedMul) | Performs multiplication that returns `None` instead of wrapping around on underflow or overflow.... |

[module] core::num::traits::ops::divrem
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-num-traits-ops-divrem

[functions]

- trait DivRem | Performs truncated division and remainder. `T` – dividend type (left-hand operand) `U` – divisor type (right-hand operand, must be wrapped in `NonZero` at call-site) The division truncates toward zero, like Cairo’s `/` and `%`.
- traits | | | | |:---|:---| | [DivRem](./core-num-traits-ops-divrem-DivRem) | Performs truncated division and remainder. `T` – dividend type (left-hand operand) `U` – divisor type (right-hand operand, must be wrapped in `NonZero` at call-site)... |

[module] core::num::traits::ops::overflowing
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-num-traits-ops-overflowing

[functions]

- trait OverflowingAdd | Performs addition with a flag for overflow.
- trait OverflowingMul | Performs multiplication with a flag for overflow.
- trait OverflowingSub | Performs subtraction with a flag for overflow.
- traits | | | | |:---|:---| | [OverflowingAdd](./core-num-traits-ops-overflowing-OverflowingAdd) | Performs addition with a flag for overflow.... | | [OverflowingSub](./core-num-traits-ops-overflowing-OverflowingSub) | Performs subtraction with a flag for overflow.... | | [OverflowingMul](./core-num-traits-ops-overflowing-OverflowingMul) | Performs multiplication with a flag for overflow.... |

[module] core::num::traits::ops::pow
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-num-traits-ops-pow

[functions]

- trait Pow | Raises a value to the power of `exp`. Note that `0⁰` (`pow(0, 0)`) returns `1`. Mathematically this is undefined.
- traits | | | | |:---|:---| | [Pow](./core-num-traits-ops-pow-Pow) | Raises a value to the power of `exp` . Note that `0⁰` ( `pow(0, 0)` ) returns `1` . Mathematically this is undefined.... |

[module] core::num::traits::ops::saturating
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-num-traits-ops-saturating

[functions]

- trait SaturatingAdd | Performs addition that saturates at the numeric bounds instead of overflowing.
- trait SaturatingMul | Performs multiplication that saturates at the numeric bounds instead of overflowing.
- trait SaturatingSub | Performs subtraction that saturates at the numeric bounds instead of overflowing.
- traits | | | | |:---|:---| | [SaturatingAdd](./core-num-traits-ops-saturating-SaturatingAdd) | Performs addition that saturates at the numeric bounds instead of overflowing.... | | [SaturatingSub](./core-num-traits-ops-saturating-SaturatingSub) | Performs subtraction that saturates at the numeric bounds instead of overflowing.... | | [SaturatingMul](./core-num-traits-ops-saturating-SaturatingMul) | Performs multiplication that saturates at the numeric bounds instead of overflowing.... |

[module] core::num::traits::ops::sqrt
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-num-traits-ops-sqrt

[functions]

- trait Sqrt | A trait for computing the square root of a number.
- traits | | | | |:---|:---| | [Sqrt](./core-num-traits-ops-sqrt-Sqrt) | A trait for computing the square root of a number.... |

[module] core::num::traits::ops::widemul
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-num-traits-ops-widemul

[functions]

- traits | | | | |:---|:---| | [WideMul](./core-num-traits-ops-widemul-WideMul) | A trait for types that can be multiplied together to produce a wider type. This trait enables multiplication operations where the result type has double... |
- trait WideMul | A trait for types that can be multiplied together to produce a wider type. This trait enables multiplication operations where the result type has double the bit width of the input types, preventing overflow in cases where the result would exceed the input type's maximum value.

[module] core::num::traits::ops::widesquare
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-num-traits-ops-widesquare

[functions]

- traits | | | | |:---|:---| | [WideSquare](./core-num-traits-ops-widesquare-WideSquare) | A trait for a type that can be squared to produce a wider type. This trait enables squaring operations where the result type has double... |
- trait WideSquare | A trait for a type that can be squared to produce a wider type. This trait enables squaring operations where the result type has double the bit width of the input type, preventing overflow in cases where the result would exceed the input type's maximum value.

[module] core::num::traits::ops::wrapping
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-num-traits-ops-wrapping

[functions]

- traits | | | | |:---|:---| | [WrappingAdd](./core-num-traits-ops-wrapping-WrappingAdd) | Performs addition that wraps around on overflow.... | | [WrappingSub](./core-num-traits-ops-wrapping-WrappingSub) | Performs subtraction that wraps around on overflow.... | | [WrappingMul](./core-num-traits-ops-wrapping-WrappingMul) | Performs multiplication that wraps around on overflow.... |
- trait WrappingAdd | Performs addition that wraps around on overflow.
- trait WrappingMul | Performs multiplication that wraps around on overflow.
- trait WrappingSub | Performs subtraction that wraps around on overflow.

[module] core::num::traits::zero
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-num-traits-zero

[functions]

- traits | | | | |:---|:---| | [Zero](./core-num-traits-zero-Zero) | Defines an additive identity element for `T` .... |
- trait Zero | Defines an additive identity element for `T`.

[module] core::ops
[doc] Overloadable operators. Implementing these traits allows you to overload certain operators. Note: Other overloadable operators are also defined in the [`core::traits`](./core-traits) module. Only operators backed by traits can be overloaded. For example, the addition assignment operator (`+=`) can be overloaded through the `AddAssign` trait, but since the assignment operator (`=`) has no backing trait, there is no way of overloading its semantics. Additionally, this module does not provide any mechanism to create new operators. Implementations of operator traits should be unsurprising in their respective contexts, keeping in mind their usual meanings and operator precedence. For example, when implementing `MulAssign`, the operation should have some resemblance to multiplication assignment.
[url] https://docs.starknet.io/build/corelib/core-ops

[functions]

- arith | Assignment operator traits for arithmetic operations. This module provides traits for implementing assignment operators like `+=`, `-=`, `*=`, `/=` and `%=`. These traits allow types to define how they handle arithmetic operations that modify values in place.
- deref | Dereferencing traits for transparent access to wrapped values. This module provides traits that enable accessing the content of wrapped types as if they were the inner type directly. This is particularly useful for: - Smart pointers and wrapper types (e.g., `Box`) - Nested data structures - Enum variants sharing common fields
- function | Function traits and types. This module defines traits for function-like types that can be called. The two main traits are: - [`FnOnce`](./core-ops-function-FnOnce) - For single-use functions that consume their environment - [`Fn`](./core-ops-function-Fn) - For reusable functions that can be called multiple times
- index | Indexing traits for indexing operations on collections. This module provides traits for implementing the indexing operator `[]`, offering two distinct approaches to access elements in collections: - [`IndexView`](./core-ops-index-IndexView) - For snapshot-based access - [`Index`](./core-ops-index-Index) - For reference-based access
- modules | | | | |:---|:---| | [index](./core-ops-index) | Indexing traits for indexing operations on collections. This module provides traits for implementing the indexing operator `[]` , offering two distinct approaches to access elements in collections:... | | [range](./core-ops-range) | Range and iteration utilities. This module provides functionality for creating and iterating over ranges of values. A range represents an interval of values from a start point to an end point.... | | [arith](./core-ops-arith) | Assignment operator traits for arithmetic operations. This module provides traits for implementing assignment operators like `+=` , `-=` , `*=` , `/=` and `%=`... | | [deref](./core-ops-deref) | Dereferencing traits for transparent access to wrapped values. This module provides traits that enable accessing the content of wrapped types... | | [function](./core-ops-function) | Function traits and types. This module defines traits for function-like types that can be called. The two main traits are:... |
- range | Range and iteration utilities. This module provides functionality for creating and iterating over ranges of values. A range represents an interval of values from a start point to an end point.
- structs | [Structs](./core-ops-structs) --- | | | |:---|:---| | [Range](./core-ops-range-Range) | A (half-open) range bounded inclusively below and exclusively above ( `start..end` ). The range `start..end` contains all values with `start = end` .[...](./core-ops-range-Range) | | [RangeInclusive](./core-ops-range-RangeInclusive) | Represents the range start, end .[...](./core-ops-range-RangeInclusive) | | [RangeInclusiveIterator](./core-ops-range-RangeInclusiveIterator) | [...](./core-ops-range-RangeInclusiveIterator) | | [RangeIterator](./core-ops-range-RangeIterator) | Represents an iterator located at `cur` , whose end is `end` ( `cur <= end` ).[...](./core-ops-range-RangeIterator) |
- traits | [Traits](./core-ops-traits) --- | | | |:---|:---| | [AddAssign](./core-ops-arith-AddAssign) | The addition assignment operator `+=` .[...](./core-ops-arith-AddAssign) | | [DivAssign](./core-ops-arith-DivAssign) | The division assignment operator `/=` .[...](./core-ops-arith-DivAssign) | | [MulAssign](./core-ops-arith-MulAssign) | The multiplication assignment operator `*=` .[...](./core-ops-arith-MulAssign) | | [RemAssign](./core-ops-arith-RemAssign) | The remainder assignment operator `%=` .[...](./core-ops-arith-RemAssign) | | [SubAssign](./core-ops-arith-SubAssign) | The subtraction assignment operator `-=` .[...](./core-ops-arith-SubAssign) | | [Deref](./core-ops-deref-Deref) | A trait for dereferencing a value to provide transparent access to its contents. Implementing this trait allows a type to behave like its inner type, enabling direct access to[...](./core-ops-deref-Deref) | | [DerefMut](./core-ops-deref-DerefMut) | A trait for dereferencing in mutable contexts. This trait is similar to `Deref` but specifically handles cases where the value accessed is mutable. Despite its name, `DerefMut`[...](./core-ops-deref-DerefMut) | | [Fn](./core-ops-function-Fn) | The version of the call operator that takes a by-snapshot receiver. Instances of `Fn` can be called repeatedly. `Fn` is implemented automatically by closures whose captured variables are all `Copy`[...](./core-ops-function-Fn) | | [FnOnce](./core-ops-function-FnOnce) | The version of the call operator that takes a by-value receiver. Instances of `FnOnce` can be called, but might not be callable multiple[...](./core-ops-function-FnOnce) | | [Index](./core-ops-index-Index) | A trait for indexing operations ( `container[index]` ) where the input type is mutated. This trait should be implemented when you want to implement indexing operations on a type that's[...](./core-ops-index-Index) | | [IndexView](./core-ops-index-IndexView) | A trait for indexing operations ( `container[index]` ) where the input type is not modified. `container[index]` is syntactic sugar for `container.index(index)` .[...](./core-ops-index-IndexView) | | [RangeInclusiveTrait](./core-ops-range-RangeInclusiveTrait) | [...](./core-ops-range-RangeInclusiveTrait) | | [RangeTrait](./core-ops-range-RangeTrait) | [...](./core-ops-range-RangeTrait) |

[module] core::ops::arith
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-ops-arith

[functions]

- trait AddAssign | The addition assignment operator `+=`.
- trait DivAssign | The division assignment operator `/=`.
- trait MulAssign | The multiplication assignment operator `*=`.
- trait RemAssign | The remainder assignment operator `%=`.
- trait SubAssign | The subtraction assignment operator `-=`.
- traits | | | | |:---|:---| | [AddAssign](./core-ops-arith-AddAssign) | The addition assignment operator `+=` . | | [DivAssign](./core-ops-arith-DivAssign) | The division assignment operator `/=` . | | [MulAssign](./core-ops-arith-MulAssign) | The multiplication assignment operator `*=` . | | [RemAssign](./core-ops-arith-RemAssign) | The remainder assignment operator `%=` . | | [SubAssign](./core-ops-arith-SubAssign) | The subtraction assignment operator `-=` . |

[module] core::ops::deref
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-ops-deref

[functions]

- trait Deref | A trait for dereferencing a value to provide transparent access to its contents. Implementing this trait allows a type to behave like its inner type, enabling direct access to the inner type's fields. Note: The `Deref` mechanism is limited and cannot be used to implicitly convert a type to its target type when passing arguments to functions. For example, if you have a function that takes an `Inner`, you cannot pass an `Outer` to it even if `Outer` implements `Deref`.
- trait DerefMut | A trait for dereferencing in mutable contexts. This trait is similar to `Deref` but specifically handles cases where the value accessed is mutable. Despite its name, `DerefMut` does NOT allow modifying the inner value - it only indicates that the container itself is mutable.
- traits | | | | |:---|:---| | [Deref](./core-ops-deref-Deref) | A trait for dereferencing a value to provide transparent access to its contents. Implementing this trait allows a type to behave like its inner type, enabling direct access to... | | [DerefMut](./core-ops-deref-DerefMut) | A trait for dereferencing in mutable contexts. This trait is similar to `Deref` but specifically handles cases where the value accessed is mutable. Despite its name, `DerefMut`... |

[module] core::ops::function
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-ops-function

[functions]

- trait Fn | The version of the call operator that takes a by-snapshot receiver. Instances of `Fn` can be called repeatedly. `Fn` is implemented automatically by closures whose captured variables are all `Copy`. Additionally, for any type `F` that implements `Fn`, `@F` implements `Fn`, too. Since [`FnOnce`](./core-ops-function-FnOnce) is implemented for all implementers of `Fn`, any instance of `Fn` can be used as a parameter where a [`FnOnce`](./core-ops-function-FnOnce) is expected. Use `Fn` as a bound when you want to accept a parameter of function-like type and need to call it repeatedly. If you do not need such strict requirements, use [`FnOnce`](./core-ops-function-FnOnce) as bounds.
- trait FnOnce | The version of the call operator that takes a by-value receiver. Instances of `FnOnce` can be called, but might not be callable multiple times. Because of this, if the only thing known about a type is that it implements `FnOnce`, it can only be called once. `FnOnce` is implemented automatically by closures that might consume captured variables.
- traits | | | | |:---|:---| | [Fn](./core-ops-function-Fn) | The version of the call operator that takes a by-snapshot receiver. Instances of `Fn` can be called repeatedly. `Fn` is implemented automatically by closures whose captured variables are all `Copy`... | | [FnOnce](./core-ops-function-FnOnce) | The version of the call operator that takes a by-value receiver. Instances of `FnOnce` can be called, but might not be callable multiple... |

[module] core::ops::index
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-ops-index

[functions]

- trait Index | A trait for indexing operations (`container[index]`) where the input type is mutated. This trait should be implemented when you want to implement indexing operations on a type that's mutated by a read access. This is useful for any type depending on a [`Felt252Dict`](./core-dict-Felt252Dict), where dictionary accesses are modifying the data structure itself. `container[index]` is syntactic sugar for `container.index(index)`.
- trait IndexView | A trait for indexing operations (`container[index]`) where the input type is not modified. `container[index]` is syntactic sugar for `container.index(index)`.
- traits | | | | |:---|:---| | [IndexView](./core-ops-index-IndexView) | A trait for indexing operations ( `container[index]` ) where the input type is not modified. `container[index]` is syntactic sugar for `container.index(index)` .... | | [Index](./core-ops-index-Index) | A trait for indexing operations ( `container[index]` ) where the input type is mutated. This trait should be implemented when you want to implement indexing operations on a type that's... |

[module] core::ops::range
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-ops-range

[functions]

- #[derive(Clone, Drop, PartialEq)] pub struct Range { pub start: T, pub end: T, } | A (half-open) range bounded inclusively below and exclusively above (`start..end`). The range `start..end` contains all values with `start = end`.
- #[derive(Clone, Drop, PartialEq)] pub struct RangeInclusive { pub start: T, pub end: T, } | Represents the range start, end.
- #[derive(Clone, Drop)] pub struct RangeInclusiveIterator { pub(crate) cur: T, pub(crate) end: T, pub(crate) exhausted: bool, }
- trait RangeInclusiveTrait+PartialOrd> | Returns `true` if `item` is contained in the range.
- RangeIterator | Represents an iterator located at `cur`, whose end is `end` (`cur < end`).
- trait RangeTrait+PartialOrd> | Returns `true` if `item` is contained in the range.
- structs | | | | |:---|:---| | [Range](./core-ops-range-Range) | A (half-open) range bounded inclusively below and exclusively above ( `start..end` ). The range `start..end` contains all values with `start = end` .... | | [RangeInclusive](./core-ops-range-RangeInclusive) | Represents the range start, end . | | [RangeInclusiveIterator](./core-ops-range-RangeInclusiveIterator) | — | | [RangeIterator](./core-ops-range-RangeIterator) | Represents an iterator located at `cur` , whose end is `end` ( `cur <= end` ). |
- traits | | | | |:---|:---| | [RangeInclusiveTrait](./core-ops-range-RangeInclusiveTrait) | — | | [RangeTrait](./core-ops-range-RangeTrait) | — |

[module] core::option
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-option

[functions]

- impl DestructOption, -Drop>> of Destruct>;
- enums | | | | |:---|:---| | [Option](./core-option-Option) | The `Option` enum representing either `Some(value)` or `None` . |
- impls | | | | |:---|:---| | [DestructOption](./core-option-DestructOption) | — |
- enum Option { Some: T, None, } | The `Option` enum representing either `Some(value)` or `None`.
- #[derive(Drop)] pub struct OptionIter { inner: Option, } | An iterator over the value in the [`Some`](./core-option#some) variant of an [`Option`](./core-option-Option). The iterator yields one value if the [`Option`](./core-option-Option) is a [`Some`](./core-option#some), otherwise none. This struct is created by the `into_iter` method on [`Option`](./core-option-Option) (provided by the [`IntoIterator`](./core-iter-traits-collect-IntoIterator) trait).
- trait OptionTrait | A trait for handling `Option` related operations.
- structs | | | | |:---|:---| | [OptionIter](./core-option-OptionIter) | An iterator over the value in the [`Some`](./core-option#some) variant of an [`Option`](./core-option-Option) . The iterator yields one value if the [`Option`](./core-option-Option) is a... |
- traits | | | | |:---|:---| | [OptionTrait](./core-option-OptionTrait) | A trait for handling `Option` related operations. |

[module] core::panic_with_const_felt252
[doc] Panics with the given const argument `felt252` as error message.
[url] https://docs.starknet.io/build/corelib/core-panic_with_const_felt252

[module] core::panic_with_felt252
[doc] Panics with the given `felt252` as error message.
[url] https://docs.starknet.io/build/corelib/core-panic_with_felt252

[module] core::panics
[doc] Core panic mechanism. This module provides the core panic functionality used for error handling in Cairo. It defines the basic types and functions used to trigger and manage panics, which are Cairo's mechanism for handling unrecoverable errors. Panics can be triggered in several ways: Using the `panic` function:
[url] https://docs.starknet.io/build/corelib/core-panics

[functions]

- enums | | | | |:---|:---| | [PanicResult](./core-panics-PanicResult) | Result type for operations that can trigger a panic. |
- extern_functions | | | | |:---|:---| | [panic](./core-panic_with_felt252) | Triggers an immediate panic with the provided data and terminates execution.... |
- free_functions | | | | |:---|:---| | [panic_with_byte_array](./core-panics-panic_with_byte_array) | Panics with a `ByteArray` message. Constructs a panic message by prepending the `BYTE_ARRAY_MAGIC` value and serializing the provided `ByteArray` into the panic data.... |
- panic_with_byte_array(err: ByteArray) -> never | Panics with a `ByteArray` message. Constructs a panic message by prepending the `BYTE_ARRAY_MAGIC` value and serializing the provided `ByteArray` into the panic data.
- enum PanicResult { Ok: T, Err: (Panic, Array), } | Result type for operations that can trigger a panic.
- structs | | | | |:---|:---| | [Panic](./core-panics-Panic) | Represents a panic condition in Cairo. A `Panic` is created when the program encounters an unrecoverable error condition and needs to terminate execution. |

[module] core::pedersen
[doc] Pedersen hash related traits implementations. This module provides an implementation of the Pedersen hash function, which is a collision-resistant cryptographic hash function. The `HashState` struct represents the state of a Pedersen hash computation. It contains a single `felt252` field `state` that holds the current hash value. The `PedersenTrait` provides a `new` method to create a new `HashState` from a base value. The `HashStateTrait` defined in the Hash module provides the `update` and `finalize` methods to update the hash state and obtain the final hash value, respectively.
[url] https://docs.starknet.io/build/corelib/core-pedersen

[functions]

- extern_functions | | | | |:---|:---| | pedersen | — |
- extern_types | | | | |:---|:---| | [Pedersen](./core-pedersen-Pedersen) | — |
- #[derive(Copy, Drop, Debug)] pub struct HashState { pub state: felt252, } | Represents the current state of a Pedersen hash computation. The state is maintained as a single `felt252` value, which is updated through the `HashStateTrait::finalize` method.
- impls | | | | |:---|:---| | [PedersenImpl](./core-pedersen-PedersenImpl) | A trait for creating a new Pedersen hash state. |
- impl PedersenImpl of PedersenTrait; | A trait for creating a new Pedersen hash state.
- trait PedersenTrait | Creates a new Pedersen hash state with the given base value.
- structs | | | | |:---|:---| | [HashState](./core-pedersen-HashState) | Represents the current state of a Pedersen hash computation. The state is maintained as a single `felt252` value, which is updated through the `HashStateTrait::finalize` method. |
- traits | | | | |:---|:---| | [PedersenTrait](./core-pedersen-PedersenTrait) | — |

[module] core::poseidon
[doc] Poseidon hash related traits implementations and functions. This module provides cryptographic hash functions based on the Poseidon permutation. The Poseidon hash function is an arithmetic-friendly hash function optimized for use in zero-knowledge proof systems. This module implements the Poseidon hash using a sponge construction for arbitrary-length inputs.
[url] https://docs.starknet.io/build/corelib/core-poseidon

[functions]

- extern_functions | | | | |:---|:---| | [hades_permutation](./core-poseidon-hades_permutation) | — |
- extern_types | | | | |:---|:---| | [Poseidon](./core-poseidon-Poseidon) | — |
- free_functions | | | | |:---|:---| | [poseidon_hash_span](./core-poseidon-poseidon_hash_span) | Computes the Poseidon hash on the given span input. Applies the sponge construction to digest many elements. To distinguish between use cases, the capacity element is initialized to 0.... |
- hades_permutation(s0: felt252, s1: felt252, s2: felt252) -> (felt252, felt252, felt252) implicits(Poseidon) nopanic; [nopanic,extern]
- #[derive(Copy, Drop, Debug)] pub struct HashState { pub s0: felt252, pub s1: felt252, pub s2: felt252, pub odd: bool, } | State for Poseidon hash.
- impls | | | | |:---|:---| | [PoseidonImpl](./core-poseidon-PoseidonImpl) | A trait for creating a new Poseidon hash state. |
- type Poseidon;
- poseidon_hash_span(mut span: Span) -> felt252 | Computes the Poseidon hash on the given span input. Applies the sponge construction to digest many elements. To distinguish between use cases, the capacity element is initialized to 0. To distinguish between different input sizes always pads with 1, and possibly with another 0 to complete to an even-sized input.
- impl PoseidonImpl of PoseidonTrait; | A trait for creating a new Poseidon hash state.
- trait PoseidonTrait | Creates an initial state with all fields set to 0.
- structs | | | | |:---|:---| | [HashState](./core-poseidon-HashState) | State for Poseidon hash. |
- traits | | | | |:---|:---| | [PoseidonTrait](./core-poseidon-PoseidonTrait) | — |

[module] core::qm31
[doc] Definition for the `qm31` type. Only available for local proofs. The implementations defined in this module can be accessed by using the traits directly.
[url] https://docs.starknet.io/build/corelib/core-qm31

[functions]

- extern_functions | | | | |:---|:---| | [qm31_const](./core-qm31-qm31_const) | Returns a `qm31` given its values as constants. |
- extern_types | | | | |:---|:---| | [qm31](./core-qm31-qm31) | The `qm31` type, defining an extension field over 4 `m31` s. |
- type m31 = BoundedInt; | The field for the Mersenne prime with `n` 31.
- m31_ops | Additional `m31` actions for specific implementations based on `qm31` opcode.
- modules | | | | |:---|:---| | [m31_ops](./core-qm31-m31_ops) | Additional `m31` actions for specific implementations based on `qm31` opcode. |
- type qm31; | The `qm31` type, defining an extension field over 4 `m31`s.
- qm31_const() -> qm31 nopanic; [nopanic,extern] | Returns a `qm31` given its values as constants.
- trait QM31Trait | Returns a new `qm31` composed of the given parts.
- traits | | | | |:---|:---| | [QM31Trait](./core-qm31-QM31Trait) | — |
- type_aliases | | | | |:---|:---| | [m31](./core-qm31-m31) | The field for the Mersenne prime with `n` 31. |

[module] core::qm31::m31_ops
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-qm31-m31_ops

[functions]

- extern_functions | | | | |:---|:---| | [m31_add](./core-qm31-m31_ops-m31_add) | Addition of `m31` s in field. | | [m31_div](./core-qm31-m31_ops-m31_div) | Division of `m31` s in field. | | [m31_mul](./core-qm31-m31_ops-m31_mul) | Multiplication of `m31` s in field. | | [m31_sub](./core-qm31-m31_ops-m31_sub) | Subtraction of `m31` s in field. |
- m31_add(a: BoundedInt, b: BoundedInt) -> BoundedInt nopanic; [nopanic,extern] | Addition of `m31`s in field.
- m31_div(a: BoundedInt, b: NonZero>) -> BoundedInt nopanic; [nopanic,extern] | Division of `m31`s in field.
- m31_mul(a: BoundedInt, b: BoundedInt) -> BoundedInt nopanic; [nopanic,extern] | Multiplication of `m31`s in field.
- m31_sub(a: BoundedInt, b: BoundedInt) -> BoundedInt nopanic; [nopanic,extern] | Subtraction of `m31`s in field.

[module] core::RangeCheck
[doc] General purpose implicits.
[url] https://docs.starknet.io/build/corelib/core-RangeCheck

[module] core::result
[doc] Error handling with the `Result` type. [`Result`](./core-result-Result) is the type used for returning and propagating errors. It is an enum with the variants, `Ok(T)`, representing success and containing a value, and `Err(E)`, representing error and containing an error value.
[url] https://docs.starknet.io/build/corelib/core-result

[functions]

- enums | | | | |:---|:---| | [Result](./core-result-Result) | The type used for returning and propagating errors. It is an enum with the variants `Ok: T` , representing success and containing a value, and `Err: E` , representing error and containing an... |
- enum Result { Ok: T, Err: E, } | The type used for returning and propagating errors. It is an enum with the variants `Ok: T`, representing success and containing a value, and `Err: E`, representing error and containing an error value.
- trait ResultTrait | Returns the contained `Ok` value, consuming the `self` value.
- traits | | | | |:---|:---| | [ResultTrait](./core-result-ResultTrait) | — |

[module] core::SegmentArena
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-SegmentArena

[module] core::serde
[doc] Serialization and deserialization of data structures. This module provides traits and implementations for converting Cairo types into a sequence of `felt252` values (serialization) and back (deserialization). When passing values between Cairo and an external environment, serialization and deserialization are necessary to convert Cairo's data types into a sequence of `felt252` values, as `felt252` is the fundamental type of the language.
[url] https://docs.starknet.io/build/corelib/core-serde

[functions]

- into_felt252_based
- modules | | | | |:---|:---| | [into_felt252_based](./core-serde-into_felt252_based) | — |
- trait Serde | A trait that allows for serializing and deserializing values of any type. The `Serde` trait defines two core operations: - `serialize`: Converts a value into a sequence of `felt252`s - `deserialize`: Reconstructs a value from a sequence of `felt252`s
- traits | | | | |:---|:---| | [Serde](./core-serde-Serde) | A trait that allows for serializing and deserializing values of any type. The `Serde` trait defines two core operations:... |

[module] core::sha256
[doc] Implementation of the SHA-256 cryptographic hash function. This module provides functions to compute SHA-256 hashes of data. The input data can be an array of 32-bit words, or a `ByteArray`.
[url] https://docs.starknet.io/build/corelib/core-sha256

[functions]

- compute_sha256_byte_array(arr: ByteArray) -> [u32; 8] | Computes the SHA-256 hash of the input `ByteArray`.
- compute_sha256_u32_array( mut input: Array, last_input_word: u32, last_input_num_bytes: u32, ) -> [u32; 8] | Computes the SHA-256 hash of an array of 32-bit words.
- free_functions | | | | |:---|:---| | [compute_sha256_u32_array](./core-sha256-compute_sha256_u32_array) | Computes the SHA-256 hash of an array of 32-bit words.... | | [compute_sha256_byte_array](./core-sha256-compute_sha256_byte_array) | Computes the SHA-256 hash of the input `ByteArray` .... |

[module] core::starknet
[doc] Functionalities for interacting with the Starknet network.
[url] https://docs.starknet.io/build/corelib/core-starknet

[functions]

- account | Account module defining the `Call` struct and the [`AccountContract`](./core-starknet-account-AccountContract) trait. The `Call` struct represents a call to a contract, with the following fields: - `to`: The address of the contract to call. - `selector`: The entry point selector in the called contract. - `calldata`: The calldata to pass to the entry point.
- class_hash | The `ClassHash` type represents a Starknet contract class hash, with a value range of `[0, 2**251)`. A variable of type `ClassHash` can be created from a `felt252` value using the `class_hash_const` function, or using the `TryInto` trait.
- constants | | | | |:---|:---| | [VALIDATED](./core-starknet-VALIDATED) | The expected return value of the `__validate__` function in account contracts. This constant is used to indicate that a transaction validation was successful.... |
- contract_address | The `ContractAddress` type represents a Starknet contract address, with a value range of `[0, 2**251)`. A variable of type `ContractAddress` can be created from a `felt252` value using the `contract_address_const` function, or using the `TryInto` trait.
- deployment
- eth_address | Ethereum address type for working with Ethereum primitives. This module provides the [`EthAddress`](./core-starknet-eth_address-EthAddress) type, which is used when interacting with Ethereum primitives, such as signatures and L1 L2 messages.
- eth_signature | Utilities for Ethereum signature verification and address recovery. This module provides functionality for working with Ethereum signatures. It implements verification of Ethereum signatures against addresses and conversion of public keys to Ethereum addresses.
- event | Event handling traits for Starknet smart contracts. This module provides traits for serializing, deserializing and emitting events on Starknet. The [`Event`](./core-starknet-event-Event) trait handles the serialization of event types, while the `EventEmitter` trait provides the capability to emit events from Starknet contracts.
- extern_functions | [Extern functions](./core-starknet-extern_functions) --- | | | |:---|:---| | [contract_address_const](./core-starknet-contract_address-contract_address_const) | Returns a `ContractAddress` given a `felt252` value.[...](./core-starknet-contract_address-contract_address_const) |
- extern_types | | | | |:---|:---| | [System](./core-starknet-System) | — |
- free_functions | [Free functions](./core-starknet-free_functions) --- | | | |:---|:---| | [get_block_info](./core-starknet-info-get_block_info) | Returns the block information for the current block.[...](./core-starknet-info-get_block_info) | | [get_block_number](./core-starknet-info-get_block_number) | Returns the number of the current block.[...](./core-starknet-info-get_block_number) | | [get_block_timestamp](./core-starknet-info-get_block_timestamp) | Returns the timestamp of the current block.[...](./core-starknet-info-get_block_timestamp) | | [get_caller_address](./core-starknet-info-get_caller_address) | Returns the address of the caller contract.[...](./core-starknet-info-get_caller_address) | | [get_contract_address](./core-starknet-info-get_contract_address) | Returns the address of the contract being executed.[...](./core-starknet-info-get_contract_address) | | [get_execution_info](./core-starknet-info-get_execution_info) | Returns the execution info for the current execution.[...](./core-starknet-info-get_execution_info) | | [get_tx_info](./core-starknet-info-get_tx_info) | Returns the transaction information for the current transaction.[...](./core-starknet-info-get_tx_info) |
- info | Information about the Starknet execution environment. This module provides access to runtime information about the current transaction, block, and execution context in a Starknet smart contract. It enables contracts to access execution context data.
- modules | | | | |:---|:---| | [storage_access](./core-starknet-storage_access) | Storage access primitives for Starknet contract storage. This module provides abstractions over the system calls for reading from and writing to Starknet... | | [syscalls](./core-starknet-syscalls) | Utilities for interacting with the Starknet OS. Writing smart contracts requires various associated operations, such as calling another contract... | | [contract_address](./core-starknet-contract_address) | The `ContractAddress` type represents a Starknet contract address, with a value range of `[0, 2**251)` . A variable of type `ContractAddress` can be created from a `felt252` value using the... | | [secp256_trait](./core-starknet-secp256_trait) | Elliptic Curve Digital Signature Algorithm (ECDSA) for Secp256k1 and Secp256r1 curves. This module provides traits and functions for working with ECDSA signatures... | | [secp256k1](./core-starknet-secp256k1) | Functions and constructs related to elliptic curve operations on the secp256k1 curve. This module provides functionality for performing operations on the secp256k1 elliptic curve,... | | [secp256r1](./core-starknet-secp256r1) | Functions and constructs related to elliptic curve operations on the secp256r1 curve. This module provides functionality for performing operations on the NIST P-256 (also known as... | | [eth_address](./core-starknet-eth_address) | Ethereum address type for working with Ethereum primitives. This module provides the [`EthAddress`](./core-starknet-eth_address-EthAddress) type, which is used when interacting with Ethereum... | | [eth_signature](./core-starknet-eth_signature) | Utilities for Ethereum signature verification and address recovery. This module provides functionality for working with Ethereum signatures.... | | [class_hash](./core-starknet-class_hash) | The `ClassHash` type represents a Starknet contract class hash, with a value range of `[0, 2**251)` . A variable of type `ClassHash` can be created from a `felt252` value using the... | | [event](./core-starknet-event) | Event handling traits for Starknet smart contracts. This module provides traits for serializing, deserializing and emitting events on Starknet. The [`Event`](./core-starknet-event-Event)... | | [account](./core-starknet-account) | Account module defining the `Call` struct and the [`AccountContract`](./core-starknet-account-AccountContract) trait. The `Call`... | | [storage](./core-starknet-storage) | Storage-related types and traits for Cairo contracts. This module implements the storage system for Starknet contracts, providing high-level... | | [deployment](./core-starknet-deployment) | — | | [testing](./core-starknet-testing) | Testing utilities for Starknet contracts. This module provides functions for testing Starknet contracts. The functions... | | [info](./core-starknet-info) | Information about the Starknet execution environment. This module provides access to runtime information about the current transaction,... |
- secp256_trait | Elliptic Curve Digital Signature Algorithm (ECDSA) for Secp256k1 and Secp256r1 curves. This module provides traits and functions for working with ECDSA signatures on the Secp256k1 and the Secp256r1 curves. It includes utilities for creating and validating signatures, as well as recovering public keys from signatures.
- secp256k1 | Functions and constructs related to elliptic curve operations on the secp256k1 curve. This module provides functionality for performing operations on the secp256k1 elliptic curve, commonly used in cryptographic applications such as Bitcoin and Ethereum. It implements the traits defined in the `secp256_trait` module to ensure consistent behavior across different secp256 curve implementations. Curve information: - Base field: q = 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f - Scalar field: r = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141 - Curve equation: y^2 = x^3 + 7
- secp256r1 | Functions and constructs related to elliptic curve operations on the secp256r1 curve. This module provides functionality for performing operations on the NIST P-256 (also known as secp256r1) elliptic curve. It implements the traits defined in the `secp256_trait` module to ensure consistent behavior across different secp256 curve implementations. Curve information: - Base field: q = 0xffffffff00000001000000000000000000000000ffffffffffffffffffffffff - Scalar field: r = 0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551 - a = -3 - b = 0x5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604b - Curve equation: y^2 = x^3 + ax + b
- storage | Storage-related types and traits for Cairo contracts. This module implements the storage system for Starknet contracts, providing high-level abstractions for persistent data storage. It offers a type-safe interface for reading and writing to Starknet storage through the `StoragePointerReadAccess` and `StoragePointerWriteAccess` traits, along with useful storage-only collection types like [`Vec`](./core-starknet-storage-vec-Vec) and [`Map`](./core-starknet-storage-map-Map).
- storage_access | Storage access primitives for Starknet contract storage. This module provides abstractions over the system calls for reading from and writing to Starknet contract storage. It includes traits and implementations for storing various data types efficiently.
- structs | [Structs](./core-starknet-structs) --- | | | |:---|:---| | [EthAddress](./core-starknet-eth_address-EthAddress) | An Ethereum address, 20 bytes in length.[...](./core-starknet-eth_address-EthAddress) | | [ExecutionInfo](./core-starknet-info-v2-ExecutionInfo) | The same as `ExecutionInfo` , but with the `TxInfo` field replaced with `v2::TxInfo` .[...](./core-starknet-info-v2-ExecutionInfo) | | [ResourceBounds](./core-starknet-info-v2-ResourceBounds) | V3 transactions resources used for enabling the fee market.[...](./core-starknet-info-v2-ResourceBounds) | | [TxInfo](./core-starknet-info-v2-TxInfo) | Extended information about the current transaction.[...](./core-starknet-info-v2-TxInfo) | | [BlockInfo](./core-starknet-info-BlockInfo) | Information about the current block.[...](./core-starknet-info-BlockInfo) |
- type SyscallResult = Result>; | The `Result` type for a syscall.
- trait SyscallResultTrait | Trait for handling syscall results.
- syscalls | Utilities for interacting with the Starknet OS. Writing smart contracts requires various associated operations, such as calling another contract or accessing the contract’s storage, that standalone programs do not require. Cairo supports these operations by using system calls. System calls enable a contract to require services from the Starknet OS. You can use system calls in a function to get information that depends on the broader state of Starknet, such as the current timestamp or the address of the caller, but also to modify the state of Starknet by, for example, storing values in a contract's storage or deploying new contracts.
- type System;
- testing | Testing utilities for Starknet contracts. This module provides functions for testing Starknet contracts. The functions allow manipulation of blockchain state and storage variables during tests, as well as inspection of emitted events and messages. Note: The functions in this module can only be used with the `cairo-test` testing framework. If you are using Starknet Foundry, refer to its documentation.
- traits | | | | |:---|:---| | [SyscallResultTrait](./core-starknet-SyscallResultTrait) | Trait for handling syscall results. |
- type_aliases | | | | |:---|:---| | [SyscallResult](./core-starknet-SyscallResult) | The `Result` type for a syscall. |
- const VALIDATED: felt252 = 370462705988; | The expected return value of the `__validate__` function in account contracts. This constant is used to indicate that a transaction validation was successful. Account contracts must return this value from their `__validate__` function to signal that the transaction should proceed.

[module] core::starknet::account
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-starknet-account

[functions]

- trait AccountContract | A trait for account contracts that support class declarations (only `__validate__` and `__execute__` are mandatory for an account). This trait assumes that the calldata for invoke transactions is `Array`. This is the network standard following SNIP6. It is not enforced by Starknet, but deviating from the standard interface may lead to incompatibility with standard tooling.
- #[derive(Copy, Drop, Serde)] pub struct AccountContractDispatcher { pub contract_address: ContractAddress, }
- trait AccountContractDispatcherTrait | An entry point that is called to check if the account is willing to pay for the declaration of the class with the given hash. The entry point should return `starknet::VALIDATED` if the account is willing to pay for the declaration.
- #[derive(Copy, Drop, Serde)] pub struct AccountContractLibraryDispatcher { pub class_hash: ClassHash, }
- #[derive(Copy, Drop, Serde)] pub struct AccountContractSafeDispatcher { pub contract_address: ContractAddress, }
- trait AccountContractSafeDispatcherTrait | An entry point that is called to check if the account is willing to pay for the declaration of the class with the given hash. The entry point should return `starknet::VALIDATED` if the account is willing to pay for the declaration.
- #[derive(Copy, Drop, Serde)] pub struct AccountContractSafeLibraryDispatcher { pub class_hash: ClassHash, }
- #[derive(Drop, Copy, Serde, Debug)] pub struct Call { pub to: ContractAddress, pub selector: felt252, pub calldata: Span, } | A struct representing a call to a contract.
- structs | | | | |:---|:---| | [Call](./core-starknet-account-Call) | A struct representing a call to a contract. | | [AccountContractDispatcher](./core-starknet-account-AccountContractDispatcher) | — | | [AccountContractLibraryDispatcher](./core-starknet-account-AccountContractLibraryDispatcher) | — | | [AccountContractSafeLibraryDispatcher](./core-starknet-account-AccountContractSafeLibraryDispatcher) | — | | [AccountContractSafeDispatcher](./core-starknet-account-AccountContractSafeDispatcher) | — |
- traits | | | | |:---|:---| | [AccountContract](./core-starknet-account-AccountContract) | A trait for account contracts that support class declarations (only `__validate__` and `__execute__` are mandatory for an account). This trait assumes that the calldata for invoke transactions is... | | [AccountContractDispatcherTrait](./core-starknet-account-AccountContractDispatcherTrait) | — | | [AccountContractSafeDispatcherTrait](./core-starknet-account-AccountContractSafeDispatcherTrait) | — |

[module] core::starknet::class_hash
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-starknet-class_hash

[functions]

- class_hash_const() -> ClassHash nopanic; [nopanic,extern] | Returns a `ClassHash` given a `felt252` value.
- type ClassHash; | Represents a Starknet contract class hash. The value range of this type is `[0, 2**251)`.
- extern_functions | | | | |:---|:---| | [class_hash_const](./core-starknet-class_hash-class_hash_const) | Returns a `ClassHash` given a `felt252` value.... |
- extern_types | | | | |:---|:---| | [ClassHash](./core-starknet-class_hash-ClassHash) | Represents a Starknet contract class hash. The value range of this type is `[0, 2**251)` . |

[module] core::starknet::contract_address
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-starknet-contract_address

[functions]

- contract_address_const() -> ContractAddress nopanic; [nopanic,extern] | Returns a `ContractAddress` given a `felt252` value.
- type ContractAddress; | Represents a Starknet contract address. The value range of this type is `[0, 2**251)`.
- extern_functions | | | | |:---|:---| | [contract_address_const](./core-starknet-contract_address-contract_address_const) | Returns a `ContractAddress` given a `felt252` value.... |
- extern_types | | | | |:---|:---| | [ContractAddress](./core-starknet-contract_address-ContractAddress) | Represents a Starknet contract address. The value range of this type is `[0, 2**251)` . |

[module] core::starknet::eth_address
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-starknet-eth_address

[functions]

- #[derive(Copy, Drop, Hash, PartialEq)] pub struct EthAddress { address: felt252, } | An Ethereum address, 20 bytes in length.
- structs | | | | |:---|:---| | [EthAddress](./core-starknet-eth_address-EthAddress) | An Ethereum address, 20 bytes in length. |

[module] core::starknet::eth_signature
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-starknet-eth_signature

[functions]

- free_functions | | | | |:---|:---| | [verify_eth_signature](./core-starknet-eth_signature-verify_eth_signature) | Asserts that an Ethereum signature is valid for a given message hash and Ethereum address. Also verifies that the `r` and `s` components of the signature are in the range `[1, N)` ,... | | [is_eth_signature_valid](./core-starknet-eth_signature-is_eth_signature_valid) | Validates an Ethereum signature against a message hash and Ethereum address. Similar to `verify_eth_signature` but returns a `Result` instead of panicking. Also verifies that `r` and `s`... | | [public_key_point_to_eth_address](./core-starknet-eth_signature-public_key_point_to_eth_address) | Converts a public key point to its corresponding Ethereum address. The Ethereum address is calculated by taking the Keccak-256 hash of the public key coordinates... |
- is_eth_signature_valid( msg_hash: u256, signature: Signature, eth_address: EthAddress, ) -> Result | Validates an Ethereum signature against a message hash and Ethereum address. Similar to `verify_eth_signature` but returns a `Result` instead of panicking. Also verifies that `r` and `s` components of the signature are in the range `[1, N)`, where N is the size of the curve.
- public_key_point_to_eth_address, +Secp256Trait, +Secp256PointTrait, >( public_key_point: Secp256Point, ) -> EthAddress | Converts a public key point to its corresponding Ethereum address. The Ethereum address is calculated by taking the Keccak-256 hash of the public key coordinates and taking the last 20 big-endian bytes.
- verify_eth_signature(msg_hash: u256, signature: Signature, eth_address: EthAddress) | Asserts that an Ethereum signature is valid for a given message hash and Ethereum address. Also verifies that the `r` and `s` components of the signature are in the range `[1, N)`, where N is the size of the curve.

[module] core::starknet::event
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-starknet-event

[functions]

- trait Event | A trait for handling serialization and deserialization of events. Events in Starknet are stored in transaction receipts as a combination of keys and data fields. This trait provides the methods needed to serialize event data into these fields and deserialize them back into their original form. This trait can easily be derived using the `#[derive(starknet::Event)]` attribute. Fields can be marked as keys using the `#[key]` attribute to serialize them as event keys.
- trait EventEmitter | A trait for emitting Starknet events.
- traits | | | | |:---|:---| | [Event](./core-starknet-event-Event) | A trait for handling serialization and deserialization of events. Events in Starknet are stored in transaction receipts as a combination of keys and data fields.... | | [EventEmitter](./core-starknet-event-EventEmitter) | A trait for emitting Starknet events.... |

[module] core::starknet::info
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-starknet-info

[functions]

- #[derive(Copy, Drop, Debug, Serde)] pub struct BlockInfo { pub block_number: u64, pub block_timestamp: u64, pub sequencer_address: ContractAddress, } | Information about the current block.
- free_functions | | | | |:---|:---| | [get_block_info](./core-starknet-info-get_block_info) | Returns the block information for the current block.... | | [get_block_number](./core-starknet-info-get_block_number) | Returns the number of the current block.... | | [get_block_timestamp](./core-starknet-info-get_block_timestamp) | Returns the timestamp of the current block.... | | [get_caller_address](./core-starknet-info-get_caller_address) | Returns the address of the caller contract. Returns `0` if there is no caller—for example, when a transaction begins execution inside an account contract. Note: This function returns the direct... | | [get_contract_address](./core-starknet-info-get_contract_address) | Returns the address of the contract being executed.... | | [get_execution_info](./core-starknet-info-get_execution_info) | Returns the execution info for the current execution.... | | [get_tx_info](./core-starknet-info-get_tx_info) | Returns the transaction information for the current transaction.... |
- get_block_info() -> Box | Returns the block information for the current block.
- get_block_number() -> u64 | Returns the number of the current block.
- get_block_timestamp() -> u64 | Returns the timestamp of the current block.
- get_caller_address() -> ContractAddress | Returns the address of the caller contract. Returns `0` if there is no caller—for example, when a transaction begins execution inside an account contract. Note: This function returns the direct caller. If you're interested in the account that initiated the transaction, use `get_execution_info().tx_info.unbox().account_contract_address` instead.
- get_contract_address() -> ContractAddress | Returns the address of the contract being executed.
- get_execution_info() -> Box | Returns the execution info for the current execution.
- get_tx_info() -> Box | Returns the transaction information for the current transaction.
- modules | | | | |:---|:---| | [v2](./core-starknet-info-v2) | The extended version of the `get_execution_info` syscall result. |
- structs | | | | |:---|:---| | [BlockInfo](./core-starknet-info-BlockInfo) | Information about the current block. |
- v2 | The extended version of the `get_execution_info` syscall result.

[module] core::starknet::info::v2
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-starknet-info-v2

[functions]

- #[derive(Copy, Drop, Debug)] pub struct ExecutionInfo { pub block_info: Box, pub tx_info: Box, pub caller_address: ContractAddress, pub contract_address: ContractAddress, pub entry_point_selector: felt252, } | The same as `ExecutionInfo`, but with the `TxInfo` field replaced with `v2::TxInfo`.
- #[derive(Copy, Drop, Debug, Serde)] pub struct ResourceBounds { pub resource: felt252, pub max_amount: u64, pub max_price_per_unit: u128, } | V3 transactions resources used for enabling the fee market.
- structs | | | | |:---|:---| | [ExecutionInfo](./core-starknet-info-v2-ExecutionInfo) | The same as `ExecutionInfo` , but with the `TxInfo` field replaced with `v2::TxInfo` . | | [ResourceBounds](./core-starknet-info-v2-ResourceBounds) | V3 transactions resources used for enabling the fee market. | | [TxInfo](./core-starknet-info-v2-TxInfo) | Extended information about the current transaction. |
- #[derive(Copy, Drop, Debug, Serde)] pub struct TxInfo { pub version: felt252, pub account_contract_address: ContractAddress, pub max_fee: u128, pub signature: Span, pub transaction_hash: felt252, pub chain_id: felt252, pub nonce: felt252, pub resource_bounds: Span, pub tip: u128, pub paymaster_data: Span, pub nonce_data_availability_mode: u32, pub fee_data_availability_mode: u32, pub account_deployment_data: Span, } | Extended information about the current transaction.

[module] core::starknet::secp256_trait
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-starknet-secp256_trait

[functions]

- free_functions | | | | |:---|:---| | [signature_from_vrs](./core-starknet-secp256_trait-signature_from_vrs) | Creates an ECDSA signature from the `v` , `r` , and `s` values. `v` is the sum of an odd number and the parity of the y coordinate of the ec point whose x coordinate is `r` .... | | [is_signature_entry_valid](./core-starknet-secp256_trait-is_signature_entry_valid) | Checks whether the given `value` is in the range [ 1, N), where N is the size of the curve. For ECDSA signatures to be secure, both `r` and `s` components must be in the range [ 1, N),... | | [is_valid_signature](./core-starknet-secp256_trait-is_valid_signature) | Checks whether a signature is valid given a public key point and a message hash.... | | [recover_public_key](./core-starknet-secp256_trait-recover_public_key) | Recovers the public key associated with a given signature and message hash. Returns the public key as a point on the curve.... |
- is_signature_entry_valid, impl Secp256Impl: Secp256Trait, >( value: u256, ) -> bool | Checks whether the given `value` is in the range [1, N), where N is the size of the curve. For ECDSA signatures to be secure, both `r` and `s` components must be in the range [1, N), where N is the order of the curve. Enforcing this range prevents signature malleability attacks where an attacker could create multiple valid signatures for the same message by adding multiples of N. This function validates that a given value meets this requirement.
- is_valid_signature, impl Secp256Impl: Secp256Trait, +Secp256PointTrait, >( msg_hash: u256, r: u256, s: u256, public_key: Secp256Point, ) -> bool | Checks whether a signature is valid given a public key point and a message hash.
- recover_public_key, impl Secp256Impl: Secp256Trait, +Secp256PointTrait, >( msg_hash: u256, signature: Signature, ) -> Option | Recovers the public key associated with a given signature and message hash. Returns the public key as a point on the curve.
- trait Secp256PointTrait | A trait for performing operations on Secp256{k/r}1 curve points. Provides operations needed for elliptic curve cryptography, including point addition and scalar multiplication.
- trait Secp256Trait | A trait for interacting with Secp256{k/r}1 curves. Provides operations needed to work with Secp256k1 and Secp256r1 elliptic curves. It includes methods for accessing curve parameters and creating curve points.
- #[derive(Copy, Drop, Debug, PartialEq, Serde, Hash)] pub struct Signature { pub r: u256, pub s: u256, pub y_parity: bool, } | Represents a Secp256{k/r}1 ECDSA signature. This struct holds the components of an ECDSA signature: `r`, `s`, and `y_parity`.
- signature_from_vrs(v: u32, r: u256, s: u256) -> Signature | Creates an ECDSA signature from the `v`, `r`, and `s` values. `v` is the sum of an odd number and the parity of the y coordinate of the ec point whose x coordinate is `r`. See https://eips.ethereum.org/EIPS/eip-155 for more details.
- structs | | | | |:---|:---| | [Signature](./core-starknet-secp256_trait-Signature) | Represents a Secp256{k/r}1 ECDSA signature. This struct holds the components of an ECDSA signature: `r` , `s` , and `y_parity` . |
- traits | | | | |:---|:---| | [Secp256Trait](./core-starknet-secp256_trait-Secp256Trait) | A trait for interacting with Secp256{k/r}1 curves. Provides operations needed to work with Secp256k1 and Secp256r1 elliptic curves.... | | [Secp256PointTrait](./core-starknet-secp256_trait-Secp256PointTrait) | A trait for performing operations on Secp256{k/r}1 curve points. Provides operations needed for elliptic curve cryptography, including point addition and scalar multiplication.... |

[module] core::starknet::secp256k1
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-starknet-secp256k1

[functions]

- extern_types | | | | |:---|:---| | [Secp256k1Point](./core-starknet-secp256k1-Secp256k1Point) | A point on the secp256k1 curve. |
- type Secp256k1Point; | A point on the secp256k1 curve.

[module] core::starknet::secp256r1
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-starknet-secp256r1

[functions]

- extern_types | | | | |:---|:---| | [Secp256r1Point](./core-starknet-secp256r1-Secp256r1Point) | Represents a point on the secp256r1 elliptic curve. |
- type Secp256r1Point; | Represents a point on the secp256r1 elliptic curve.

[module] core::starknet::storage
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-starknet-storage

[functions]

- impls | | | | |:---|:---| | [SubPointersDeref](./core-starknet-storage-SubPointersDeref) | This makes the sub-pointers members directly accessible from a pointer to the parent struct. | | [SubPointersMutDeref](./core-starknet-storage-SubPointersMutDeref) | This makes the sub-pointers members directly accessible from a pointer to the parent struct. | | [StorableStoragePointerReadAccess](./core-starknet-storage-StorableStoragePointerReadAccess) | Simple implementation of `StoragePointerReadAccess` for any type that implements `Store` for any offset. | | [StorageNodeDeref](./core-starknet-storage-StorageNodeDeref) | This makes the storage node members directly accessible from a path to the parent struct. | | [StorageNodeMutDeref](./core-starknet-storage-StorageNodeMutDeref) | This makes the storage node members directly accessible from a path to the parent struct. |
- trait IntoIterRange | Trait for turning collection of values into an iterator over a specific range.
- map | Key-value storage mapping implementation for Starknet contracts. This module provides the core mapping functionality used in Starknet smart contracts, enabling persistent key-value storage. Unlike traditional hash tables, storage mappings do not store the key data itself. Instead, they use the hash of the key to compute a storage slot address where the corresponding value is stored.
- modules | | | | |:---|:---| | [map](./core-starknet-storage-map) | Key-value storage mapping implementation for Starknet contracts. This module provides the core mapping functionality used in Starknet smart contracts,... | | [storage_base](./core-starknet-storage-storage_base) | Core abstractions for contract storage management. This module provides the types and traits for handling contract storage internally... | | [vec](./core-starknet-storage-vec) | Vector-like storage collection for persisting data in contract storage. This module provides a vector-like collection that stores elements in contract storage.... | | [storage_node](./core-starknet-storage-storage_node) | Storage nodes provide a way to structure contract storage data, reflecting their structure in the storage address computation of their members. They are special structs that can contain any... | | [sub_pointers](./core-starknet-storage-sub_pointers) | — |
- #[phantom] pub struct Mutable {} | A wrapper around different storage related types, indicating that the instance is mutable, i.e. originally created from a `ref` contract state.
- struct PendingStoragePath { **hash_state**: HashState, **pending_key**: felt252, } | A struct for delaying the creation of a storage path, used for lazy evaluation in storage nodes.
- trait PendingStoragePathTrait | A trait for creating a `PendingStoragePath` from a `StoragePath` hash state and a key.
- impl StorableStoragePointerReadAccess, > of StoragePointerReadAccess>; | Simple implementation of `StoragePointerReadAccess` for any type that implements `Store` for any offset.
- storage_base | Core abstractions for contract storage management. This module provides the types and traits for handling contract storage internally within the Cairo core library. Most developers should not need to implement these traits directly, as they are primarily used by the storage system implementation. If you're writing a regular Starknet contract, you should use the high-level storage traits and types, interacting with the members of the storage struct directly.
- storage_node | Storage nodes provide a way to structure contract storage data, reflecting their structure in the storage address computation of their members. They are special structs that can contain any storable type and are marked with the `#[starknet::storage_node]` attribute.
- trait StorageAsPath | Trait for creating a new `StoragePath` from a storage member.
- trait StorageAsPointer | Trait for converting a storage member to a `StoragePointer0Offset`.
- impl StorageNodeDeref> of Deref>; | This makes the storage node members directly accessible from a path to the parent struct.
- impl StorageNodeMutDeref> of Deref>>; | This makes the storage node members directly accessible from a path to the parent struct.
- struct StoragePath { **hash_state**: HashState, } | An intermediate struct to store a hash state, in order to be able to hash multiple values and get the final address. Storage path should have two interfaces, if `T` is storable then it should implement `StorageAsPointer` in order to be able to get the address of the storage path. Otherwise, if `T` is not storable then it should implement some kind of updating trait, e.g. `StoragePathEntry`.
- trait StoragePathMutableConversion | Converts a `StoragePath>` to a `StoragePath`. This is useful to expose functions implemented for `StoragePath` on a `StoragePath>`.
- struct StoragePointer { pub **storage_pointer_address**: StorageBaseAddress, pub **storage_pointer_offset**: u8, } | A pointer to an address in storage, can be used to read and write values, if the generic type supports it (e.g. basic types like `felt252`).
- struct StoragePointer0Offset { pub **storage_pointer_address**: StorageBaseAddress, } | Same as `StoragePointer`, but with `offset` 0, which allows for some optimizations.
- trait StoragePointerReadAccess | Trait for accessing the values in storage using a `StoragePointer`.
- trait StoragePointerWriteAccess | Trait for writing values to storage using a `StoragePointer`.
- structs | | | | |:---|:---| | [StoragePointer](./core-starknet-storage-StoragePointer) | A pointer to an address in storage, can be used to read and write values, if the generic type supports it (e.g. basic types like `felt252` ). | | [StoragePointer0Offset](./core-starknet-storage-StoragePointer0Offset) | Same as `StoragePointer` , but with `offset` 0, which allows for some optimizations. | | [StoragePath](./core-starknet-storage-StoragePath) | An intermediate struct to store a hash state, in order to be able to hash multiple values and get the final address. Storage path should have two interfaces, if `T`... | | [PendingStoragePath](./core-starknet-storage-PendingStoragePath) | A struct for delaying the creation of a storage path, used for lazy evaluation in storage nodes. | | [Mutable](./core-starknet-storage-Mutable) | A wrapper around different storage related types, indicating that the instance is mutable, i.e. originally created from a `ref` contract state. |
- sub_pointers | | | | |:---|:---| | [SubPointers](./core-starknet-storage-sub_pointers-SubPointers) | Similar to storage node, but for structs which are stored sequentially in the storage. In contrast to storage node, the fields of the struct are just at an offset from the base address of the struct. | | [SubPointersForward](./core-starknet-storage-sub_pointers-SubPointersForward) | A trait for implementing `SubPointers` for types which are not a `StoragePointer` , such as `StorageBase` and `StoragePath` . | | [SubPointersMut](./core-starknet-storage-sub_pointers-SubPointersMut) | A mutable version of `SubPointers` , works the same way, but on `Mutable` . | | [SubPointersMutForward](./core-starknet-storage-sub_pointers-SubPointersMutForward) | A trait for implementing `SubPointersMut` for types which are not a `StoragePointer` , such as `StorageBase` and `StoragePath` . |
- impl SubPointersDeref> of Deref>; | This makes the sub-pointers members directly accessible from a pointer to the parent struct.
- impl SubPointersMutDeref> of Deref>>; | This makes the sub-pointers members directly accessible from a pointer to the parent struct.
- traits | | | | |:---|:---| | [StorageAsPointer](./core-starknet-storage-StorageAsPointer) | Trait for converting a storage member to a `StoragePointer0Offset` . | | [StoragePointerReadAccess](./core-starknet-storage-StoragePointerReadAccess) | Trait for accessing the values in storage using a `StoragePointer` .... | | [StoragePointerWriteAccess](./core-starknet-storage-StoragePointerWriteAccess) | Trait for writing values to storage using a `StoragePointer` .... | | [StorageAsPath](./core-starknet-storage-StorageAsPath) | Trait for creating a new `StoragePath` from a storage member. | | [PendingStoragePathTrait](./core-starknet-storage-PendingStoragePathTrait) | A trait for creating a `PendingStoragePath` from a `StoragePath` hash state and a key. | | [StoragePathMutableConversion](./core-starknet-storage-StoragePathMutableConversion) | — | | [IntoIterRange](./core-starknet-storage-IntoIterRange) | Trait for turning collection of values into an iterator over a specific range. | | [ValidStorageTypeTrait](./core-starknet-storage-ValidStorageTypeTrait) | Trait that ensures a type is valid for storage in Starknet contracts. This trait is used to enforce that only specific types, such as those implementing `Store` or acting as a `StorageNode`... |
- trait ValidStorageTypeTrait | Trait that ensures a type is valid for storage in Starknet contracts. This trait is used to enforce that only specific types, such as those implementing `Store` or acting as a `StorageNode`, can be a part of a storage hierarchy. Any type that does not implement this trait cannot be used in a storage struct.
- vec | Vector-like storage collection for persisting data in contract storage. This module provides a vector-like collection that stores elements in contract storage. Unlike memory arrays, storage vectors persist data onchain, meaning that values can be retrieved even after the end of the current context.

[module] core::starknet::storage_access
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-starknet-storage_access

[functions]

- extern_functions | | | | |:---|:---| | [storage_base_address_const](./core-starknet-storage_access-storage_base_address_const) | Returns a `StorageBaseAddress` given a constant `felt252` value. The value is validated to be in the range `[0, 2**251 - 256)` at compile time.... | | [storage_base_address_from_felt252](./core-starknet-storage_access-storage_base_address_from_felt252) | Returns a `StorageBaseAddress` given a `felt252` value. Wraps around the value if it is not in the range `[0, 2**251 - 256)` . | | [storage_address_from_base_and_offset](./core-starknet-storage_access-storage_address_from_base_and_offset) | Sums the base address and the offset to return a storage address. | | [storage_address_from_base](./core-starknet-storage_access-storage_address_from_base) | Converts a `StorageBaseAddress` into a `StorageAddress` . This should be used through the high-level `Into` trait. |
- extern_types | | | | |:---|:---| | [StorageAddress](./core-starknet-storage_access-StorageAddress) | Represents the address of a storage value in a Starknet contract. The value range of this type is `[0, 2**251)` . | | [StorageBaseAddress](./core-starknet-storage_access-StorageBaseAddress) | Represents a base storage address that can be combined with offsets. The value range of this type is `[0, 2**251 - 256)` . |
- storage_address_from_base(base: StorageBaseAddress) -> StorageAddress nopanic; [nopanic,extern] | Converts a `StorageBaseAddress` into a `StorageAddress`. This should be used through the high-level `Into` trait.
- storage_address_from_base_and_offset(base: StorageBaseAddress, offset: u8) -> StorageAddress nopanic; [nopanic,extern] | Sums the base address and the offset to return a storage address.
- storage_base_address_const() -> StorageBaseAddress nopanic; [nopanic,extern] | Returns a `StorageBaseAddress` given a constant `felt252` value. The value is validated to be in the range `[0, 2**251 - 256)` at compile time.
- storage_base_address_from_felt252(addr: felt252) -> StorageBaseAddress implicits(RangeCheck) nopanic; [nopanic,extern] | Returns a `StorageBaseAddress` given a `felt252` value. Wraps around the value if it is not in the range `[0, 2**251 - 256)`.
- type StorageAddress; | Represents the address of a storage value in a Starknet contract. The value range of this type is `[0, 2**251)`.
- type StorageBaseAddress; | Represents a base storage address that can be combined with offsets. The value range of this type is `[0, 2**251 - 256)`.
- trait Store | Trait for types that can be stored in Starknet contract storage. The `Store` trait enables types to be stored in and retrieved from Starknet's contract storage. Cairo implements `Store` for most primitive types. However, collection types (arrays, dicts, etc.) do not implement `Store` directly. Instead, use specialized storage types, such as [`Vec`](./core-starknet-storage-vec-Vec) or [`Map`](./core-starknet-storage-map-Map).
- trait StorePacking | Trait for efficient packing of values into optimized storage representations. This trait enables bit-packing of complex types into simpler storage types to reduce gas costs by minimizing the number of storage slots used. When a type implements `StorePacking`, the compiler automatically uses `StoreUsingPacking` to handle storage operations. As such, a type cannot implement both `Store` and `StorePacking`.
- traits | | | | |:---|:---| | [Store](./core-starknet-storage_access-Store) | Trait for types that can be stored in Starknet contract storage. The `Store` trait enables types to be stored in and retrieved from Starknet's contract storage. Cairo implements `Store`... | | [StorePacking](./core-starknet-storage_access-StorePacking) | Trait for efficient packing of values into optimized storage representations. This trait enables bit-packing of complex types into simpler storage types to reduce gas costs... |

[module] core::starknet::storage::map
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-starknet-storage-map

[functions]

- #[phantom] pub struct Map {} | A persistent key-value store in contract storage. This type cannot be instantiated as it is marked with `#[phantom]`. This is by design: `Map` is a compile-time type that only exists to provide type information for the compiler. It represents a mapping in storage, but the actual storage operations are handled by the [`StorageMapReadAccess`](./core-starknet-storage-map-StorageMapReadAccess), [`StorageMapWriteAccess`](./core-starknet-storage-map-StorageMapWriteAccess), and [`StoragePathEntry`](./core-starknet-storage-map-StoragePathEntry) traits.
- trait StorageMapReadAccess | Provides direct read access to values in a storage [`Map`](./core-starknet-storage-map-Map).
- trait StorageMapWriteAccess | Provides direct write access to values in a storage [`Map`](./core-starknet-storage-map-Map). Enables directly storing values in the contract's storage at the address of the given key.
- trait StoragePathEntry | Computes storage paths for accessing [`Map`](./core-starknet-storage-map-Map) entries. The storage path combines the variable's base path with the key's hash to create a unique identifier for the storage slot. This path can then be used for subsequent read or write operations, or advanced further by chaining the `entry` method.
- structs | | | | |:---|:---| | [Map](./core-starknet-storage-map-Map) | A persistent key-value store in contract storage. This type cannot be instantiated as it is marked with `#[phantom]` . This is by design: `Map`... |
- traits | | | | |:---|:---| | [StorageMapReadAccess](./core-starknet-storage-map-StorageMapReadAccess) | Provides direct read access to values in a storage [`Map`](./core-starknet-storage-map-Map) .... | | [StorageMapWriteAccess](./core-starknet-storage-map-StorageMapWriteAccess) | Provides direct write access to values in a storage [`Map`](./core-starknet-storage-map-Map) . Enables directly storing values in the contract's storage at the address of the given key.... | | [StoragePathEntry](./core-starknet-storage-map-StoragePathEntry) | Computes storage paths for accessing [`Map`](./core-starknet-storage-map-Map) entries. The storage path combines the variable's base path with the key's hash to create a unique... |

[module] core::starknet::storage::storage_base
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-starknet-storage-storage_base

[functions]

- struct FlattenedStorage {} | A type that represents a flattened storage, i.e. a storage object which does not have any effect on the path taken into consideration when computing the address of the storage object.
- struct StorageBase { pub **base_address**: felt252, } | A struct for holding an address to initialize a storage path with. The members (not direct members, but accessible using `deref`) of a contract state are either `StorageBase` or `FlattenedStorage` instances, with the generic type representing the type of the stored member.
- trait StorageTrait | A trait for creating the struct containing the `StorageBase` or `FlattenedStorage` of all the members of a contract state.
- trait StorageTraitMut | A trait for creating the struct containing the mutable `StorageBase` or `FlattenedStorage` of all the members of a contract state.
- structs | | | | |:---|:---| | [FlattenedStorage](./core-starknet-storage-storage_base-FlattenedStorage) | A type that represents a flattened storage, i.e. a storage object which does not have any effect on the path taken into consideration when computing the address of the storage object. | | [StorageBase](./core-starknet-storage-storage_base-StorageBase) | A struct for holding an address to initialize a storage path with. The members (not direct members, but accessible using `deref` ) of a contract state are either `StorageBase` or `FlattenedStorage`... |
- traits | | | | |:---|:---| | [StorageTrait](./core-starknet-storage-storage_base-StorageTrait) | A trait for creating the struct containing the `StorageBase` or `FlattenedStorage` of all the members of a contract state. | | [StorageTraitMut](./core-starknet-storage-storage_base-StorageTraitMut) | A trait for creating the struct containing the mutable `StorageBase` or `FlattenedStorage` of all the members of a contract state. |

[module] core::starknet::storage::storage_node
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-starknet-storage-storage_node

[functions]

- trait StorageNode | A trait that given a storage path of a struct, generates the storage node of this struct.
- trait StorageNodeMut | A mutable version of `StorageNode`, works the same way, but on `Mutable`.
- traits | | | | |:---|:---| | [StorageNode](./core-starknet-storage-storage_node-StorageNode) | A trait that given a storage path of a struct, generates the storage node of this struct. | | [StorageNodeMut](./core-starknet-storage-storage_node-StorageNodeMut) | A mutable version of `StorageNode` , works the same way, but on `Mutable` . |

[module] core::starknet::storage::sub_pointers
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-starknet-storage-sub_pointers

[functions]

- trait SubPointers | Similar to storage node, but for structs which are stored sequentially in the storage. In contrast to storage node, the fields of the struct are just at an offset from the base address of the struct.
- trait SubPointersForward | A trait for implementing `SubPointers` for types which are not a `StoragePointer`, such as `StorageBase` and `StoragePath`.
- trait SubPointersMut | A mutable version of `SubPointers`, works the same way, but on `Mutable`.
- trait SubPointersMutForward | A trait for implementing `SubPointersMut` for types which are not a `StoragePointer`, such as `StorageBase` and `StoragePath`.
- traits | | | | |:---|:---| | [SubPointers](./core-starknet-storage-sub_pointers-SubPointers) | Similar to storage node, but for structs which are stored sequentially in the storage. In contrast to storage node, the fields of the struct are just at an offset from the base address of the struct. | | [SubPointersForward](./core-starknet-storage-sub_pointers-SubPointersForward) | A trait for implementing `SubPointers` for types which are not a `StoragePointer` , such as `StorageBase` and `StoragePath` . | | [SubPointersMut](./core-starknet-storage-sub_pointers-SubPointersMut) | A mutable version of `SubPointers` , works the same way, but on `Mutable` . | | [SubPointersMutForward](./core-starknet-storage-sub_pointers-SubPointersMutForward) | A trait for implementing `SubPointersMut` for types which are not a `StoragePointer` , such as `StorageBase` and `StoragePath` . |

[module] core::starknet::storage::vec
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-starknet-storage-vec

[functions]

- trait MutableVecTrait | Provides mutable access to elements in a storage [`Vec`](./core-starknet-storage-vec-Vec). This trait extends the read functionality with methods to append new elements and modify existing ones.
- structs | | | | |:---|:---| | [Vec](./core-starknet-storage-vec-Vec) | Represents a dynamic array in contract storage. This type is zero-sized and cannot be instantiated. Vectors can only be used in storage contexts and manipulated using the associated `VecTrait` and... | | [VecIter](./core-starknet-storage-vec-VecIter) | An iterator struct over a `Vec` in storage. |
- traits | | | | |:---|:---| | [MutableVecTrait](./core-starknet-storage-vec-MutableVecTrait) | Provides mutable access to elements in a storage [`Vec`](./core-starknet-storage-vec-Vec) . This trait extends the read functionality with methods to append new elements and modify existing ones. | | [VecTrait](./core-starknet-storage-vec-VecTrait) | Provides read-only access to elements in a storage [`Vec`](./core-starknet-storage-vec-Vec) . This trait enables retrieving elements and checking the vector's length without... |
- #[phantom] pub struct Vec {} | Represents a dynamic array in contract storage. This type is zero-sized and cannot be instantiated. Vectors can only be used in storage contexts and manipulated using the associated `VecTrait` and `MutableVecTrait` traits.
- #[derive(Drop)] pub struct VecIter> { vec: T, current_index: IntRange, } | An iterator struct over a `Vec` in storage.
- trait VecTrait | Provides read-only access to elements in a storage [`Vec`](./core-starknet-storage-vec-Vec). This trait enables retrieving elements and checking the vector's length without modifying the underlying storage.

[module] core::starknet::syscalls
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-starknet-syscalls

[functions]

- call_contract_syscall(address: ContractAddress, entry_point_selector: felt252, calldata: Span) -> Result, Array> implicits(GasBuiltin, System) nopanic; [nopanic,extern] | Calls a given contract.
- deploy_syscall(class_hash: ClassHash, contract_address_salt: felt252, calldata: Span, deploy_from_zero: bool) -> Result), Array> implicits(GasBuiltin, System) nopanic; [nopanic,extern] | Deploys a new instance of a previously declared class.
- emit_event_syscall(keys: Span, data: Span) -> Result> implicits(GasBuiltin, System) nopanic; [nopanic,extern] | Emits an event.
- extern_functions | | | | |:---|:---| | [call_contract_syscall](./core-starknet-syscalls-call_contract_syscall) | Calls a given contract.... | | [deploy_syscall](./core-starknet-syscalls-deploy_syscall) | Deploys a new instance of a previously declared class.... | | [emit_event_syscall](./core-starknet-syscalls-emit_event_syscall) | Emits an event.... | | [get_block_hash_syscall](./core-starknet-syscalls-get_block_hash_syscall) | Returns the hash of the block with the given number.... | | [get_execution_info_syscall](./core-starknet-syscalls-get_execution_info_syscall) | Gets information about the currently executing block and the transactions within it. For a complete description of this information, see `Execution information` . When an account’s `__validate__` ,... | | [get_execution_info_v2_syscall](./core-starknet-syscalls-get_execution_info_v2_syscall) | Gets information about the current execution, version 2. This syscall should not be called directly. Instead, use `starknet::info::get_execution_info` .... | | [library_call_syscall](./core-starknet-syscalls-library_call_syscall) | Calls the requested function in any previously declared class.... | | [send_message_to_l1_syscall](./core-starknet-syscalls-send_message_to_l1_syscall) | Sends a message to L1.... | | [storage_read_syscall](./core-starknet-syscalls-storage_read_syscall) | Gets the value of a key in the storage of the calling contract.... | | [storage_write_syscall](./core-starknet-syscalls-storage_write_syscall) | Sets the value of a key in the storage of the calling contract.... | | [replace_class_syscall](./core-starknet-syscalls-replace_class_syscall) | Replaces the class hash of the current contract, instantly modifying its entrypoints. The new class becomes effective only after the current function call completes.... | | [get_class_hash_at_syscall](./core-starknet-syscalls-get_class_hash_at_syscall) | Gets the class hash of the contract at the given address.... | | [keccak_syscall](./core-starknet-syscalls-keccak_syscall) | Computes the keccak of the input.... | | [sha256_process_block_syscall](./core-starknet-syscalls-sha256_process_block_syscall) | Computes the next SHA-256 state of the input with the given state.... | | [meta_tx_v0_syscall](./core-starknet-syscalls-meta_tx_v0_syscall) | Invokes the given entry point as a v0 meta transaction.... |
- get_block_hash_syscall(block_number: u64) -> Result> implicits(GasBuiltin, System) nopanic; [nopanic,extern] | Returns the hash of the block with the given number.
- get_class_hash_at_syscall(contract_address: ContractAddress) -> Result> implicits(GasBuiltin, System) nopanic; [nopanic,extern] | Gets the class hash of the contract at the given address.
- get_execution_info_syscall() -> Result, Array> implicits(GasBuiltin, System) nopanic; [nopanic,extern] | Gets information about the currently executing block and the transactions within it. For a complete description of this information, see `Execution information`. When an account’s `__validate__`, `__validate_deploy__`, or `__validate_declare__` function calls `get_execution_info`, the return values for `block_timestamp` and `block_number` are modified as follows: - `block_timestamp` returns the hour, rounded down to the nearest hour. - `block_number` returns the block number, rounded down to the nearest multiple of 100.
- get_execution_info_v2_syscall() -> Result, Array> implicits(GasBuiltin, System) nopanic; [nopanic,extern] | Gets information about the current execution, version 2. This syscall should not be called directly. Instead, use `starknet::info::get_execution_info`.
- keccak_syscall(input: Span) -> Result> implicits(GasBuiltin, System) nopanic; [nopanic,extern] | Computes the keccak of the input. - The input must be a multiple of 1088 bits (== 17 u64 words) - The input must be pre-padded following the Keccak padding rule (pad10\*1): 1. Add a '1' bit 2. Add zero or more '0' bits 3. Add a final '1' bit The total length after padding must be a multiple of 1088 bits
- library_call_syscall(class_hash: ClassHash, function_selector: felt252, calldata: Span) -> Result, Array> implicits(GasBuiltin, System) nopanic; [nopanic,extern] | Calls the requested function in any previously declared class.
- meta_tx_v0_syscall(address: ContractAddress, entry_point_selector: felt252, calldata: Span, signature: Span) -> Result, Array> implicits(GasBuiltin, System) nopanic; [nopanic,extern] | Invokes the given entry point as a v0 meta transaction. - The signature is replaced with the given signature. - The caller is the OS (address 0). - The transaction version is replaced by 0. - The transaction hash is replaced by the corresponding version-0 transaction hash.
- replace_class_syscall(class_hash: ClassHash) -> Result> implicits(GasBuiltin, System) nopanic; [nopanic,extern] | Replaces the class hash of the current contract, instantly modifying its entrypoints. The new class becomes effective only after the current function call completes. The remaining code in the current function will continue executing from the old class. The new class will be used: - In subsequent transactions - If the contract is called via `call_contract` syscall later in the same transaction
- send_message_to_l1_syscall(to_address: felt252, payload: Span) -> Result> implicits(GasBuiltin, System) nopanic; [nopanic,extern] | Sends a message to L1.
- sha256_process_block_syscall(state: Sha256StateHandle, input: Box) -> Result> implicits(GasBuiltin, System) nopanic; [nopanic,extern] | Computes the next SHA-256 state of the input with the given state.
- storage_read_syscall(address_domain: u32, address: StorageAddress) -> Result> implicits(GasBuiltin, System) nopanic; [nopanic,extern] | Gets the value of a key in the storage of the calling contract.
- storage_write_syscall(address_domain: u32, address: StorageAddress, value: felt252) -> Result> implicits(GasBuiltin, System) nopanic; [nopanic,extern] | Sets the value of a key in the storage of the calling contract.

[module] core::starknet::testing
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-starknet-testing

[functions]

- cheatcode(input: Span) -> Span nopanic; [nopanic,extern] | A general cheatcode function used to simplify implementation of Starknet testing functions. This is the base function used by testing utilities to interact with the test environment. External users can implement custom cheatcodes by injecting a custom `CairoHintProcessor` in the runner.
- extern_functions | | | | |:---|:---| | [cheatcode](./core-starknet-testing-cheatcode) | A general cheatcode function used to simplify implementation of Starknet testing functions. This is the base function used by testing utilities to interact with the test... |
- free_functions | | | | |:---|:---| | [set_block_number](./core-starknet-testing-set_block_number) | Sets the block number to the provided value.... | | [set_caller_address](./core-starknet-testing-set_caller_address) | Sets the caller address to the provided value.... | | [set_contract_address](./core-starknet-testing-set_contract_address) | Sets the contract address to the provided value.... | | [set_sequencer_address](./core-starknet-testing-set_sequencer_address) | Sets the sequencer address to the provided value.... | | [set_block_timestamp](./core-starknet-testing-set_block_timestamp) | Sets the block timestamp to the provided value.... | | [set_version](./core-starknet-testing-set_version) | Sets the version to the provided value.... | | [set_account_contract_address](./core-starknet-testing-set_account_contract_address) | Sets the account contract address.... | | [set_max_fee](./core-starknet-testing-set_max_fee) | Sets the transaction max fee.... | | [set_transaction_hash](./core-starknet-testing-set_transaction_hash) | Sets the transaction hash.... | | [set_chain_id](./core-starknet-testing-set_chain_id) | Set the transaction chain id.... | | [set_nonce](./core-starknet-testing-set_nonce) | Set the transaction nonce.... | | [set_signature](./core-starknet-testing-set_signature) | Set the transaction signature.... | | [set_block_hash](./core-starknet-testing-set_block_hash) | Set the hash for a block.... | | [pop_log_raw](./core-starknet-testing-pop_log_raw) | Pop the earliest unpopped logged event for the contract.... | | [pop_log](./core-starknet-testing-pop_log) | Pop the earliest unpopped logged event for the contract as the requested type.... | | [pop_l2_to_l1_message](./core-starknet-testing-pop_l2_to_l1_message) | Pop the earliest unpopped l2 to l1 message for the contract.... |
- pop_l2_to_l1_message(address: ContractAddress) -> Option)> | Pop the earliest unpopped l2 to l1 message for the contract.
- pop_log>(address: ContractAddress) -> Option | Pop the earliest unpopped logged event for the contract as the requested type.
- pop_log_raw(address: ContractAddress) -> Option, Span)> | Pop the earliest unpopped logged event for the contract.
- set_account_contract_address(address: ContractAddress) | Sets the account contract address.
- set_block_hash(block_number: u64, value: felt252) | Set the hash for a block.
- set_block_number(block_number: u64) | Sets the block number to the provided value.
- set_block_timestamp(block_timestamp: u64) | Sets the block timestamp to the provided value.
- set_caller_address(address: ContractAddress) | Sets the caller address to the provided value.
- set_chain_id(chain_id: felt252) | Set the transaction chain id.
- set_contract_address(address: ContractAddress) | Sets the contract address to the provided value.
- set_max_fee(fee: u128) | Sets the transaction max fee.
- set_nonce(nonce: felt252) | Set the transaction nonce.
- set_sequencer_address(address: ContractAddress) | Sets the sequencer address to the provided value.
- set_signature(signature: Span) | Set the transaction signature.
- set_transaction_hash(hash: felt252) | Sets the transaction hash.
- set_version(version: felt252) | Sets the version to the provided value.

[module] core::string
[doc] | | | |:---|:---| | [StringLiteral](./core-string-StringLiteral) | — |
[url] https://docs.starknet.io/build/corelib/core-string

[functions]

- StringLiteral | Fully qualified path: [core](./core.md)::[string](./core-string.md)::[StringLiteral](./core-string-StringLiteral.md)
- trait StringLiteral
- traits | | | | |:---|:---| | [StringLiteral](./core-string-StringLiteral) | — |

[module] core::testing
[doc] Measurement of gas consumption for testing purpose. This module provides the `get_available_gas` function, useful for asserting the amount of gas consumed by a particular operation or function call. By calling `get_available_gas` before and after the operation, you can calculate the exact amount of gas used.
[url] https://docs.starknet.io/build/corelib/core-testing

[functions]

- extern_functions | | | | |:---|:---| | [get_available_gas](./core-testing-get_available_gas) | Returns the amount of gas available in the `GasBuiltin` . Useful for asserting that a certain amount of gas was consumed. Note: The actual gas consumption observed by calls to `get_available_gas`... | | [get_unspent_gas](./core-testing-get_unspent_gas) | Returns the amount of gas available in the `GasBuiltin` , as well as the amount of gas unused in the local wallet. Useful for asserting that a certain amount of gas was used.... |
- get_available_gas | Returns the amount of gas available in the `GasBuiltin`. Useful for asserting that a certain amount of gas was consumed. Note: The actual gas consumption observed by calls to `get_available_gas` is only exact immediately before calls to `withdraw_gas`.
- get_unspent_gas | Returns the amount of gas available in the `GasBuiltin`, as well as the amount of gas unused in the local wallet. Useful for asserting that a certain amount of gas was used. Note: This function call costs exactly `2300` gas, so this may be ignored in calculations.

[module] core::to_byte_array
[doc] ASCII representation of numeric types for `ByteArray` manipulation. This module enables conversion of numeric values into their ASCII string representation, with support for different numeric bases and efficient appending to existing `ByteArray`.
[url] https://docs.starknet.io/build/corelib/core-to_byte_array

[functions]

- trait AppendFormattedToByteArray | A trait for appending the ASCII representation of a number to an existing `ByteArray`.
- trait FormatAsByteArray | A trait for formatting values into their ASCII string representation in a `ByteArray`.
- traits | | | | |:---|:---| | [AppendFormattedToByteArray](./core-to_byte_array-AppendFormattedToByteArray) | A trait for appending the ASCII representation of a number to an existing `ByteArray` . | | [FormatAsByteArray](./core-to_byte_array-FormatAsByteArray) | A trait for formatting values into their ASCII string representation in a `ByteArray` . |

[module] core::traits
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/core-traits

[functions]

- trait Add | The addition operator `+`.
- trait AddEq
- trait BitAnd | The bitwise AND operator `&`.
- trait BitNot | The bitwise NOT operator `~`.
- trait BitOr | The bitwise OR operator `|`.
- trait BitXor | The bitwise XOR operator `^`.
- trait Copy | A trait for copying values. By default, variables in Cairo have 'move semantics', meaning they are moved when used. However, types implementing `Copy` have 'copy semantics', allowing the value to be duplicated instead of moved.
- trait Default | A trait for giving a type a useful default value. Cairo implements `Default` for various primitives types.
- trait Destruct | A trait that allows for custom destruction behavior of a type. In Cairo, values must be explicitly handled - they cannot be silently dropped. Types can only go out of scope in two ways: 1. Implement `Drop` - for types that can be discarded trivially 2. Implement `Destruct` - for types that need cleanup when destroyed. Typically, any type that contains a `Felt252Dict` must implement `Destruct`, as the `Felt252Dict` needs to be "squashed" when going out of scope to ensure a program is sound.
- trait Div | The division operator `/`. Types implementing this trait support the division operation via the `/` operator.
- trait DivEq
- trait DivRem | Performs truncated division and remainder. This trait provides a way to efficiently compute both the quotient and remainder in a single operation. The division truncates towards zero, matching the behavior of the `/` and `%` operators.
- trait Drop | A trait for types that can be safely dropped. Types implementing `Drop` can be automatically discarded when they go out of scope. The drop operation is a no-op - it simply indicates to the compiler that this type can be safely discarded.
- trait Felt252DictValue | A trait that must be implemented for any type that will be stored as a value in a `Felt252Dict`. When working with dictionaries in Cairo, we need a way to represent "empty" or "uninitialized" slots. This trait provides a zero-like default value that is returned when accessing a key that hasn't been explicitly set.
- trait Index
- trait IndexView
- trait Into | A value-to-value conversion that consumes the input value. Note: This trait must not fail. If the conversion can fail, use [`TryInto`](./core-traits-TryInto).
- trait Mul | The multiplication operator `*`.
- trait MulEq
- trait Neg | The unary negation operator `-`.
- trait Not | The unary logical negation operator `!`.
- trait PanicDestruct | A trait that allows for destruction of a value in case of a panic. This trait is automatically implemented from the `Destruct` implementation for a type.
- trait PartialEq | Trait for comparisons using the equality operator. Implementing this trait for types provides the `==` and `!=` operators for those types.
- trait PartialOrd | Trait for comparing types that form a partialorder. The `lt`, `le`, `gt`, and `ge` methods of this trait can be called using the ``, and `>=` operators, respectively. PartialOrd is not derivable, but can be implemented manually
- trait Rem | The remainder operator `%`. Types implementing this trait support the remainder operation via the `%` operator.
- trait RemEq
- trait Sub | The subtraction operator `-`.
- trait SubEq
- trait TryInto | Simple and safe type conversions that may fail in a controlled way under some circumstances. This is useful when you are doing a type conversion that may trivially succeed but may also need special handling. For example, there is no way to convert an [`i64`](./core-integer-i64) into an [`i32`](./core-integer-i32) using the [`Into`](./core-traits-Into) trait, because an [`i64`](./core-integer-i64) may contain a value that an [`i32`](./core-integer-i32) cannot represent and so the conversion would lose data. This might be handled by truncating the [`i64`](./core-integer-i64) to an [`i32`](./core-integer-i32) or by simply returning `Bounded::::MAX`, or by some other method. The [`Into`](./core-traits-Into) trait is intended for perfect conversions, so the `TryInto` trait informs the programmer when a type conversion could go bad and lets them decide how to handle it.

[module] core::traits overview
[doc] Core traits for various operations. This module provides a collection of essential traits that define common behavior patterns for Cairo types.
[url] https://docs.starknet.io/build/corelib/core-traits

[module] core::type_aliases
[doc] | | | |:---|:---| | [usize](./core-usize) | `usize` is an alias for `u32` type. |
[url] https://docs.starknet.io/build/corelib/core-type_aliases

[module] core::usize
[doc] `usize` is an alias for `u32` type.
[url] https://docs.starknet.io/build/corelib/core-usize

[module] core::zeroable
[doc] Types and traits for handling non-zero values and zero checking operations. This module provides the [`NonZero`](./core-zeroable-NonZero) wrapper type which guarantees that a value is never zero. The `Zeroable` trait is meant for internal use only. The public-facing equivalent is the [`Zero`](./core-num-traits-zero-Zero) trait.
[url] https://docs.starknet.io/build/corelib/core-zeroable

[functions]

- extern_types | | | | |:---|:---| | [NonZero](./core-zeroable-NonZero) | A wrapper type for non-zero values of type T. This type guarantees that the wrapped value is never zero. |
- type NonZero; | A wrapper type for non-zero values of type T. This type guarantees that the wrapped value is never zero.

[module] Introduction to the Corelib documentation
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/Introduction to the Corelib documentation

[functions]

- Introduction to the Corelib documentation | The Cairo core library, also known as _Corelib_, provides the foundational building blocks for writing provable programs in Cairo. It offers essential utilities, data structures, mathematical functions, cryptographic tools, and system interactions making it suitable for both onchain and offchain development. Whether you are working on Starknet smart contracts, cryptographic applications, or general-purpose Cairo programs, the corelib provides the fundamental tools needed.

[module] Overview of core::box
[doc] `Box` is a smart pointer that allows for: - Storing values of arbitrary size while maintaining a fixed-size pointer - Enabling recursive types that would otherwise have infinite size - Moving large data structures efficiently by passing pointers instead of copying values
[url] https://docs.starknet.io/build/corelib/core-box

[module] Overview of core::clone
[doc] The `Clone` trait provides the ability to duplicate instances of types that cannot be 'implicitly copied'. In Cairo, some simple types are "implicitly copyable": when you assign them or pass them as arguments, the receiver will get a copy, leaving the original value in place. These types do not require allocation to copy, and are not at risk of accessing un-allocated memory, so the compiler considers them cheap and safe to copy. For other types, copies must be made explicitly, by convention implementing the [`Clone`](./core-clone-Clone) trait and calling the `Clone::clone` method.
[url] https://docs.starknet.io/build/corelib/core-clone

[module] Overview of core::ec
[doc] Functions and constructs related to elliptic curve operations on the STARK curve. This module provides implementations for various elliptic curve operations tailored for the STARK curve. Curve information: - Curve equation: y² ≡ x³ + α·x + β (mod p) - α = 1 - β = 0x6f21413efbe40de150e596d72f7a8c5609ad26c15c915c1f4cdfcb99cee9e89 - p = 0x0800000000000011000000000000000000000000000000000000000000000001 = 2^251 + 17 \* 2^192 + 1 Generator point: - x = 0x1ef15c18599971b7beced415a40f0c7deacfd9b0d1819e03d723d8bc943cfca - y = 0x5668060aa49730b7be4801df46ec62de53ecd11abe43a32873000c36e8dc1f
[url] https://docs.starknet.io/build/corelib/core-ec

[module] Overview of core::ecdsa
[doc] Elliptic Curve Digital Signature Algorithm (ECDSA) for the STARK curve. This module provides implementations for ECDSA signature verification and public key recovery specifically tailored for the STARK curve. Curve information: - Curve equation: y² ≡ x³ + α·x + β (mod p) - α = 1 - β = 0x6f21413efbe40de150e596d72f7a8c5609ad26c15c915c1f4cdfcb99cee9e89 - p = 0x0800000000000011000000000000000000000000000000000000000000000001 = 2^251 + 17 \* 2^192 + 1 Generator point: - x = 0x1ef15c18599971b7beced415a40f0c7deacfd9b0d1819e03d723d8bc943cfca - y = 0x5668060aa49730b7be4801df46ec62de53ecd11abe43a32873000c36e8dc1f
[url] https://docs.starknet.io/build/corelib/core-ecdsa

[module] Overview of core::nullable
[doc] A wrapper type for handling optional values. `Nullable` is a wrapper type that can either contain a value stored in a `Box` or be null. It provides a safe way to handle optional values without the risk of dereferencing null pointers. This makes it particularly useful in dictionaries that store complex data structures that don't implement the `Felt252DictValue` trait; instead, they can be wrapped inside a `Nullable`.
[url] https://docs.starknet.io/build/corelib/core-nullable

[module] Overview of core::option
[doc] Optional values. The [`Option`](./core-option-Option) type represents an optional value: every [`Option`](./core-option-Option) is either [`Some`](./core-option#some) and contains a value, or [`None`](./core-option#none), and does not. [`Option`](./core-option-Option) types are very common in Cairo code, as they have a number of uses: - Initial values - Return values for functions that are not defined over their entire input range (partial functions) - Return value for otherwise reporting simple errors, where [`None`](./core-option#none) is returned on error - Optional struct fields - Optional function arguments
[url] https://docs.starknet.io/build/corelib/core-option

[module] panic
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/panic

[functions]

- panic | Triggers an immediate panic with the provided data and terminates execution.

[module] pedersen
[doc] No module summary available.
[url] https://docs.starknet.io/build/corelib/pedersen

[functions]

- pedersen | Computes the Pedersen hash of two `felt252` values.
