# cairo-book Documentation Summary

Introduction to Cairo

What is Cairo?

# What is Cairo?

## Overview

Cairo is a programming language designed to enable computational integrity through mathematical proofs, leveraging STARK technology. It allows programs to prove that they have executed correctly, even on untrusted machines. This capability is crucial for scenarios where verifiable computation is essential.

## Core Technology and Applications

- **STARK Technology:** Cairo is built upon STARKs (Scalable Transparent ARguments of Knowledge), a modern form of Probabilistically Checkable Proofs, to transform computational claims into verifiable constraint systems. The ultimate goal of Cairo is to generate mathematical proofs that can be verified efficiently and with absolute certainty.
- **Starknet:** The primary application of Cairo is Starknet, a Layer 2 scaling solution for Ethereum. Starknet utilizes Cairo's proof system to allow computations to be executed off-chain, with a STARK proof generated and then verified on the Ethereum mainnet. This significantly enhances scalability while maintaining security, as it avoids the need for every participant to verify every computation.
- **Beyond Blockchain:** Cairo's potential extends to any domain requiring efficient verification of computations, not just blockchain.

## Design Philosophy

- **Provable Programs:** Cairo is a general-purpose programming language specifically engineered for creating provable programs. It abstracts away the underlying cryptographic complexities, allowing developers to focus on program logic without needing deep expertise in cryptography or complex mathematics.
- **Rust Inspiration:** The language is strongly inspired by Rust, aiming for a developer-friendly experience.
- **Performance:** Powered by a Rust VM and a next-generation prover, Cairo offers fast execution and proof generation, making it suitable for building provable applications.

## Target Audience

This book is intended for developers with a basic understanding of programming concepts who wish to learn Cairo for building smart contracts on Starknet or for other applications requiring verifiable computation.

Getting Started with the Cairo Book

# Getting Started with the Cairo Book

This section outlines recommended reading paths through the Cairo book based on your background and goals.

## For General-Purpose Developers

Focus on chapters 1-12, which cover core language features and programming concepts without deep dives into smart contract specifics.

## For New Smart Contract Developers

Read the book from beginning to end to build a solid foundation in both Cairo language fundamentals and smart contract development principles.

## For Experienced Smart Contract Developers

A focused path is recommended:

- Chapters 1-3: Cairo basics
- Chapter 8: Cairo's trait and generics system
- Chapter 15: Smart contract development
- Reference other chapters as needed.

### Prerequisites

Basic programming knowledge (variables, functions, data structures) is assumed. Prior experience with Rust is helpful but not required.

Cairo's Architecture

# Cairo's Architecture

Cairo is a STARK-friendly Von Neumann architecture designed for generating validity proofs for arbitrary computations. It is optimized for the STARK proof system but remains compatible with other proof systems. Cairo features a Turing-complete process virtual machine.

## Components of Cairo

Cairo comprises three primary components:

1.  **Cairo Compiler:** Transforms Cairo source code into Cairo bytecode (instructions and metadata), often referred to as compilation artifacts.
2.  **Cairo Virtual Machine (CairoVM):** Executes the compilation artifacts, processing instructions to produce the AIR private input (execution trace and memory) and AIR public input (initial/final states, public memory, configuration data).
3.  **Cairo Prover and Verifier:** The prover generates a proof using the AIR inputs, and the verifier asynchronously verifies the proof against the AIR public input.

## Arithmetic Intermediate Representation (AIR)

AIR is an arithmetization technique fundamental to proof systems. While STARKs use AIRs, other systems might employ different techniques like R1CS or PLONKish arithmetization.

Getting Started with Cairo

Introduction and Setup

# Introduction and Setup

## Installing Cairo

Cairo is installed using `starkup`, a command-line tool for managing Cairo versions and associated tools. An internet connection is required for the download.

### Installing `starkup` on Linux or MacOs

Open a terminal and run the following command:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.starkup.dev | sh
```

This script installs the `starkup` tool, which in turn installs the latest stable versions of Cairo, Scarb, and Starknet Foundry. A success message will appear upon completion:

```bash
starkup: Installation complete.
```

### Verifying Installations

After `starkup` completes, open a new terminal session and verify the installations:

```bash
$ scarb --version
scarb 2.12.0 (639d0a65e 2025-08-04)
cairo: 2.12.0 (https://crates.io/crates/cairo-lang-compiler/2.12.0)
sierra: 1.7.0

$ snforge --version
snforge 0.48.0
```

## Scarb

Scarb is Cairo's build toolchain and package manager, inspired by Rust's Cargo. It bundles the Cairo compiler and language server, simplifying code building, dependency management, and providing LSP support for the VSCode Cairo 1 extension.

## Starknet Foundry

Starknet Foundry is a toolchain for Cairo programs and Starknet smart contract development, offering features for writing and running tests, deploying contracts, and interacting with the Starknet network.

## VSCode Extension

Install the Cairo VSCode extension from the [VSCode Marketplace][vsc extension] for syntax highlighting, code completion, and other features. Ensure `Enable Language Server` and `Enable Scarb` are ticked in the extension settings.

[vsc extension]: https://marketplace.visualstudio.com/items?itemName=starkware.cairo1

## Cairo Editions

Cairo uses editions (prelude versions) to manage available functions and traits. The `edition` is specified in the `Scarb.toml` file. New projects typically use the latest edition.

| Version              | Details                                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `2024-07`            | [details for 2024-07](https://community.starknet.io/t/cairo-v2-7-0-is-coming/114362#the-2024_07-edition-3)                     |
| `2023-11`            | [details for 2023-11](https://community.starknet.io/t/cairo-v2-5-0-is-out/112807#the-pub-keyword-9)                            |
| `2023-10` / `2023-1` | [details for 2023-10](https://community.starknet.io/t/cairo-v2-4-0-is-out/109275#editions-and-the-introduction-of-preludes-10) |

## Getting Help

For questions about Starknet or Cairo, use the [Starknet Discord server][discord].

[discord]: https://discord.gg/starknet-community

## Starknet AI Agent

The Starknet AI Agent, trained on Cairo and Starknet documentation, assists with related questions. It can be accessed at [Starknet Agent][agent gpt].

[agent gpt]: https://agent.starknet.id/

Creating Your First Cairo Project

# Creating Your First Cairo Project

To begin writing your first Cairo program, you'll need to set up a project directory and initialize a new project using Scarb.

## Creating a Project Directory

It's recommended to create a dedicated directory for your Cairo projects. You can do this using the following commands in your terminal:

For Linux, macOS, and PowerShell on Windows:

```shell
mkdir ~/cairo_projects
cd ~/cairo_projects
```

For Windows CMD:

```cmd
> mkdir "%USERPROFILE%\cairo_projects"
> cd /d "%USERPROFILE%\cairo_projects"
```

## Creating a Project with Scarb

Once you are in your projects directory, you can create a new Scarb project. Scarb will prompt you to choose a test runner; `Starknet Foundry` is the recommended default.

```bash
scarb new hello_world
```

This command generates a new directory named `hello_world` containing the following files and directories:

- `Scarb.toml`: The project's manifest file.
- `src/lib.cairo`: The main library file.
- `tests/`: A directory for tests.

Scarb also initializes a Git repository. You can skip this with the `--no-vcs` flag during project creation.

### `Scarb.toml` Configuration

The `Scarb.toml` file is written in TOML format and defines your project's configuration. A typical `Scarb.toml` for a basic project looks like this:

```toml
[package]
name = "hello_world"
version = "0.1.0"
edition = "2024_07"

# See more keys and their definitions at https://docs.swmansion.com/scarb/docs/reference/manifest.html

[dependencies]
starknet = "2.12.0"

[dev-dependencies]
snforge_std = "0.48.0"
assert_macros = "2.12.0"

[[target.starknet-contract]]
sierra = true

[scripts]
test = "snforge test"
```

### Project Structure

Scarb enforces a standard project structure:

```txt
├── Scarb.toml
├── src
│   ├── lib.cairo
│   └── hello_world.cairo
```

All source code should reside within the `src` directory. The top-level directory is for non-code related files like READMEs and configuration.

### Writing Your First Program

To create a simple "Hello, World!" program, you'll modify the `src/lib.cairo` and create a new file `src/hello_world.cairo`.

First, update `src/lib.cairo` to declare the `hello_world` module:

```cairo,noplayground
mod hello_world;
```

Then, create `src/hello_world.cairo` with the following content:

```cairo
#[executable]
fn main() {
    println!("Hello, World!");
}
```

This code defines an executable function `main` that prints "Hello, World!" to the console.

## Building a Scarb Project

To build your project, navigate to the project's root directory (e.g., `hello_world`) and run:

```bash
scarb build
```

This command compiles your Cairo code. The output will indicate the compilation progress and completion.

## Setting Up an Executable Project (Example: `prime_prover`)

For projects intended to be executable programs (not libraries or Starknet contracts), you need to configure `Scarb.toml` to define an executable target and potentially disable gas tracking.

Create a new project:

```bash
scarb new prime_prover
cd prime_prover
```

Modify `Scarb.toml` to include an executable target and the `cairo_execute` dependency:

```toml
[package]
name = "prime_prover"
version = "0.1.0"
edition = "2024_07"

[cairo]
enable-gas = false

[dependencies]
cairo_execute = "2.12.0"

[[target.executable]]
name = "main"
function = "prime_prover::main"
```

- `[[target.executable]]`: Specifies that the package compiles to an executable.
- `name = "main"`: Sets the executable's name.
- `function = "prime_prover::main"`: Defines the entry point function.
- `[cairo] enable-gas = false`: Disables gas tracking, necessary for executables.

Writing and Running Basic Programs

# Writing and Running Basic Programs

You can run the `main` function of your Cairo program using the `scarb execute` command. This command first compiles your code and then executes it.

```shell
$ scarb execute
  Compiling hello_world v0.1.0 (listings/ch01-getting-started/no_listing_01_hello_world/Scarb.toml)
    Finished `dev` profile target(s) in 1 second
   Executing hello_world
Hello, World!

```

If `Hello, world!` is printed to your terminal, you have successfully written and executed your first Cairo program.

## Anatomy of a Cairo Program

A basic Cairo program consists of functions, with `main` being a special entry point.

### The `main` Function

The `main` function is the starting point for execution in any executable Cairo program.

```cairo,noplayground
fn main() {

}
```

- `fn main()`: Declares a function named `main` that takes no parameters and returns nothing. Parameters would be placed inside the parentheses `()`.
- `{}`: Encloses the function body. The opening curly bracket is typically placed on the same line as the function declaration, separated by a space.

### The `println!` Macro

The body of the `main` function often contains code to perform actions, such as printing output to the screen.

```cairo,noplayground
    println!("Hello, World!");
```

Key points about this line:

- **Indentation**: Cairo style uses four spaces for indentation.
- **Macro Call**: `println!` calls a Cairo macro. The exclamation mark `!` signifies a macro call, distinguishing it from a regular function call (e.g., `println`). Macros may not follow all the same rules as functions.
- **String Argument**: `"Hello, world!"` is a string literal passed as an argument to the `println!` macro.
- **Semicolon**: The line ends with a semicolon `;`, indicating the end of the expression. Most lines of Cairo code require a semicolon.

Building a Primality Prover

# Building a Primality Prover

## Proving That A Number Is Prime

This section introduces key Cairo concepts and the process of generating zero-knowledge proofs locally using the Stwo prover. We will implement a classic mathematical problem suited for zero-knowledge proofs: proving that a number is prime. This project will cover functions, control flow, executable targets, Scarb workflows, and proving statements.

To build a project using Scarb, you can use `scarb build` to generate compiled Sierra code. To execute a Cairo program, use the `scarb execute` command. The commands are cross-platform.

To enable execution and proving, add the following to your `Scarb.toml` file:

```toml
[dependencies]
cairo_execute = "2.12.0"
```

### Writing the Prime-Checking Logic

We will implement a program to check if a number is prime using a simple trial division algorithm. Replace the contents of `src/lib.cairo` with the following code:

<span class="filename">Filename: src/lib.cairo</span>

```cairo
/// Checks if a number is prime
///
/// # Arguments
///
/// * `n` - The number to check
///
/// # Returns
///
/// * `true` if the number is prime
/// * `false` if the number is not prime
fn is_prime(n: u32) -> bool {
    if n <= 1 {
        return false;
    }
    if n == 2 {
        return true;
    }
    if n % 2 == 0 {
        return false;
    }
    let mut i = 3;
    loop {
        if i * i > n {
            return true;
        }
        if n % i == 0 {
            return false;
        }
        i += 2;
    }
}

// Executable entry point
#[executable]
fn main(input: u32) -> bool {
    is_prime(input)
}
```

#### Explanation of the Code:

The `is_prime` function:

- Accepts a `u32` (unsigned 32-bit integer) and returns a `bool`.
- Handles edge cases: numbers less than or equal to 1 are not prime, 2 is prime, and even numbers greater than 2 are not prime.
- Utilizes a loop to test odd divisors up to the square root of `n`. If no divisors are found, the number is determined to be prime.

The `main` function:

- Is marked with `#[executable]`, designating it as the program's entry point.
- Receives input from the user and returns a boolean indicating primality.
- Calls the `is_prime` function to perform the primality check.

Conclusion and Resources

# Conclusion and Resources

Congratulations on building your first Cairo program! You've successfully:

- Defined executable targets in `Scarb.toml`.
- Written functions and control flow in Cairo.
- Used `scarb execute` to run programs and generate execution traces.
- Proved and verified computations with `scarb prove` and `scarb verify`.

Experiment with different inputs or modify the primality check. For instance, the following code demonstrates a check that panics if the input exceeds 1,000,000:

```bash
$ scarb execute -p prime_prover --print-program-output --arguments 1000001
   Compiling prime_prover v0.1.0 (listings/ch01-getting-started/prime_prover2/Scarb.toml)
    Finished `dev` profile target(s) in 1 second
   Executing prime_prover
error: Panicked with "Input too large, must be <= 1,000,000".

```

If the program panics, no proof can be generated, and thus, verification is not possible.

## Additional Resources

To continue your journey with Cairo, explore these resources:

- **Cairo Playground:** An online environment for writing, compiling, debugging, and proving Cairo code without any setup. It's useful for experimenting with code snippets and observing their compilation to Sierra and Casm.
- **Cairo Core Library Docs:** Documentation for Cairo's standard library, providing essential types, traits, and utilities available in every Cairo project.
- **Cairo Package Registry:** A hub for reusable Cairo libraries like Alexandria and Open Zeppelin Contracts for Cairo, which can be integrated using Scarb.
- **Scarb Documentation:** Official documentation for Cairo's package manager and build tool, covering package management, dependencies, builds, and project configuration.

For the latest information, ensure you are using Cairo version 2.12.0 and Starknet Foundry version 0.48.0 or later. You can find the book's source code and contribute on its [GitHub repository](https://github.com/cairo-book/cairo-book).

Cairo Language Fundamentals

Cairo Language Fundamentals

# Cairo Language Fundamentals

## Keywords and Built-ins

Cairo has several types of keywords and built-in functions:

### Keywords

- **`type`**: Defines a type alias.
- **`use`**: Brings symbols into scope.
- **`while`**: Loops conditionally based on an expression's result.
- **`self`**: Refers to the method subject.
- **`super`**: Refers to the parent module of the current module.

### Reserved Keywords

These keywords are reserved for future use and should not be used for defining items to ensure forward compatibility: `Self`, `do`, `dyn`, `for`, `hint`, `in`, `macro`, `move`, `static_assert`, `static`, `try`, `typeof`, `unsafe`, `where`, `with`, `yield`.

### Built-in Functions

These functions have special purposes and should not be used as names for other items:

- **`assert`**: Checks a boolean expression; triggers `panic` if false.
- **`panic`**: Acknowledges an error and terminates the program.

## Operators and Symbols

Cairo uses various operators and symbols for different purposes.

### Operators

Operators have specific explanations and may be overloadable with associated traits:

| Operator | Example                    | Explanation                              | Overloadable? |
| :------- | :------------------------- | :--------------------------------------- | :------------ | -------------------------------- | ------- | --------------------------- | --- |
| `!`      | `!expr`                    | Logical complement                       | `Not`         |
| `~`      | `~expr`                    | Bitwise NOT                              | `BitNot`      |
| `!=`     | `expr != expr`             | Non-equality comparison                  | `PartialEq`   |
| `%`      | `expr % expr`              | Arithmetic remainder                     | `Rem`         |
| `%=`     | `var %= expr`              | Arithmetic remainder and assignment      | `RemEq`       |
| `&`      | `expr & expr`              | Bitwise AND                              | `BitAnd`      |
| `&&`     | `expr && expr`             | Short-circuiting logical AND             |               |
| `*`      | `expr * expr`              | Arithmetic multiplication                | `Mul`         |
| `*=`     | `var *= expr`              | Arithmetic multiplication and assignment | `MulEq`       |
| `@`      | `@var`                     | Snapshot                                 |               |
| `*`      | `*var`                     | Desnap                                   |               |
| `+`      | `expr + expr`              | Arithmetic addition                      | `Add`         |
| `+=`     | `var += expr`              | Arithmetic addition and assignment       | `AddEq`       |
| `,`      | `expr, expr`               | Argument and element separator           |               |
| `-`      | `-expr`                    | Arithmetic negation                      | `Neg`         |
| `-`      | `expr - expr`              | Arithmetic subtraction                   | `Sub`         |
| `-=`     | `var -= expr`              | Arithmetic subtraction and assignment    | `SubEq`       |
| `->`     | `fn(...) -> type`, `       | ...                                      | -> type`      | Function and closure return type |         |
| `.`      | `expr.ident`               | Member access                            |               |
| `/`      | `expr / expr`              | Arithmetic division                      | `Div`         |
| `/=`     | `var /= expr`              | Arithmetic division and assignment       | `DivEq`       |
| `:`      | `pat: type`, `ident: type` | Constraints                              |               |
| `:`      | `ident: expr`              | Struct field initializer                 |               |
| `;`      | `expr;`                    | Statement and item terminator            |               |
| `<`      | `expr < expr`              | Less than comparison                     | `PartialOrd`  |
| `<=`     | `expr <= expr`             | Less than or equal to comparison         | `PartialOrd`  |
| `=`      | `var = expr`               | Assignment                               |               |
| `==`     | `expr == expr`             | Equality comparison                      | `PartialEq`   |
| `=>`     | `pat => expr`              | Part of match arm syntax                 |               |
| `>`      | `expr > expr`              | Greater than comparison                  | `PartialOrd`  |
| `>=`     | `expr >= expr`             | Greater than or equal to comparison      | `PartialOrd`  |
| `^`      | `expr ^ expr`              | Bitwise exclusive OR                     | `BitXor`      |
| `        | `                          | `expr                                    | expr`         | Bitwise OR                       | `BitOr` |
| `        |                            | `                                        | `expr         |                                  | expr`   | Short-circuiting logical OR |     |
| `?`      | `expr?`                    | Error propagation                        |               |

### Non-Operator Symbols

These symbols have specific meanings when used alone or within paths:

| Symbol                                  | Explanation                               |
| :-------------------------------------- | :---------------------------------------- |
| `..._u8`, `..._usize`, `..._bool`, etc. | Numeric literal of specific type          |
| `\"...\"`                               | String literal                            |
| `'...'`                                 | Short string, 31 ASCII characters maximum |
| `_`                                     | “Ignored” pattern binding                 |

#### Path-Related Syntax

| Symbol               | Explanation                                                      |
| :------------------- | :--------------------------------------------------------------- |
| `ident::ident`       | Namespace path                                                   |
| `super::path`        | Path relative to the parent of the current module                |
| `trait::method(...)` | Disambiguating a method call by naming the trait that defines it |

#### Generic Type Parameter Syntax

| Symbol                         | Explanation                                                                                                  |
| :----------------------------- | :----------------------------------------------------------------------------------------------------------- |
| `path<...>`                    | Specifies parameters to generic type in a type (e.g., `Array<u8>`)                                           |
| `path::<...>`, `method::<...>` | Specifies parameters to a generic type, function, or method in an expression; often referred to as turbofish |

## Statements and Expressions

Cairo functions consist of a series of statements, optionally ending in an expression.

- **Statements**: Instructions that perform an action but do not return a value. Example: `let y = 6;`.
- **Expressions**: Evaluate to a resulting value.

Attempting to assign a statement to a variable results in an error, as statements do not return values.

```cairo
#[executable]
fn main() {
    // let x = (let y = 6); // This is an error
}
```

## Comments

Comments are ignored by the compiler and used for human readability.

### Single-line Comments

Start with `//` and continue to the end of the line.

```cairo
// This is a single-line comment
```

### Multi-line Comments

Each line must start with `//`.

```cairo
// This is a
// multi-line comment
```

Comments can also appear at the end of a line of code:

```cairo
fn main() -> felt252 {
    1 + 4 // return the sum of 1 and 4
}
```

### Item-level Documentation

Prefixed with `///`, these comments document specific items like functions or traits. They can include descriptions, usage examples, and panic conditions.

````cairo
/// Returns the sum of `arg1` and `arg2`.
/// `arg1` cannot be zero.
///
/// # Panics
///
/// This function will panic if `arg1` is `0`.
///
/// # Examples
///
/// ```
/// let a: felt252 = 2;
/// let b: felt252 = 3;
/// let c: felt252 = add(a, b);
/// assert!(c == a + b, "Should equal a + b");
/// ```
fn add(arg1: felt252, arg2: felt252) -> felt252 {
    assert!(arg1 != 0, "Cannot be zero");
    arg1 + arg2
}
````

## Common Programming Patterns and Potential Vulnerabilities

Certain programming patterns can lead to unintended behavior if not handled carefully.

### Operator Precedence in Expressions

Ensure expressions involving `&&` and `||` are properly parenthesized to control precedence.

```cairo
// ❌ buggy: ctx.coll_ok and ctx.debt_ok are only required in Recovery
assert!(
    mode == Mode::None || mode == Mode::Recovery && ctx.coll_ok && ctx.debt_ok,
    "EMERGENCY_MODE"
);

// ✅ fixed
assert!(
    (mode == Mode::None || mode == Mode::Recovery) && (ctx.coll_ok && ctx.debt_ok),
    "EMERGENCY_MODE"
);
```

### Unsigned Loop Underflow

Using unsigned integers (`u32`) for loop counters can lead to underflow panics if decremented below zero. Use signed integers (`i32`) for counters that might handle negative values.

```cairo
// ✅ prefer signed counters or explicit break
let mut i: i32 = (n.try_into().unwrap()) - 1;
while i >= 0 { // This would never trigger if `i` was a u32.
    // ...
    i -= 1;
}
```

### Bit-packing into `felt252`

When packing multiple fields into a single `felt252`, ensure the total bit size does not exceed 251 bits and check the bounds of each field before packing.

```cairo
fn pack_order(book_id: u256, tick_u24: u256, index_u40: u256) -> felt252 {
    // width checks
    assert!(book_id < (1_u256 * POW_2_187), "BOOK_OVER");
    assert!(tick_u24 < (1_u256 * POW_2_24),  "TICK_OVER");
    assert!(index_u40 < (1_u256 * POW_2_40), "INDEX_OVER");

    let packed: u256 =
        (book_id * POW_2_64) + (tick_u24 * POW_2_40) + index_u40;
    packed.try_into().expect("PACK_OVERFLOW")
}
```

## Hashing

Cairo supports hashing using Pedersen and Poseidon hash functions.

### Initialization and Usage

1.  Initialize the hash state:
    - Poseidon: `PoseidonTrait::new() -> HashState`
    - Pedersen: `PedersenTrait::new(base: felt252) -> HashState`
2.  Update the state using `update(self: HashState, value: felt252) -> HashState` or `update_with(self: S, value: T) -> S`.
3.  Finalize the hash: `finalize(self: HashState) -> felt252`.

### Poseidon Hash Example

```cairo
use core::hash::{HashStateExTrait, HashStateTrait};
use core::poseidon::PoseidonTrait;

#[derive(Drop, Hash)]
struct StructForHash {
    first: felt252,
    second: felt252,
    third: (u32, u32),
    last: bool,
}

#[executable]
fn main() -> felt252 {
    let struct_to_hash = StructForHash { first: 0, second: 1, third: (1, 2), last: false };

    let hash = PoseidonTrait::new().update_with(struct_to_hash).finalize();
    hash
}
```

### Pedersen Hash Example

Pedersen hashing requires an initial base state.

```cairo
use core::hash::{HashStateExTrait, HashStateTrait};
use core::pedersen::PedersenTrait;

#[derive(Drop, Hash, Serde, Copy)]
struct StructForHash {
    first: felt252,
    second: felt252,
    third: (u32, u32),
    last: bool,
}

#[executable]
fn main() -> (felt252, felt252) {
    let struct_to_hash = StructForHash { first: 0, second: 1, third: (1, 2), last: false };

    // hash1 is the result of hashing a struct with a base state of 0
    let hash1 = PedersenTrait::new(0).update_with(struct_to_hash).finalize();

    let mut serialized_struct: Array<felt252> = ArrayTrait::new();
    Serde::serialize(@struct_to_hash, ref serialized_struct);
    let first_element = serialized_struct.pop_front().unwrap();
    let mut state = PedersenTrait::new(first_element);

    for value in serialized_struct {
        state = state.update(value);
    }

    // hash2 is the result of hashing only the fields of the struct
    let hash2 = state.finalize();

    (hash1, hash2)
}
```

## Printing and Formatting

Cairo provides macros for printing and string formatting.

- `print!` and `println!`: Use the `Display` trait for basic data types. For custom types, you need to implement `Display` or use the `Debug` trait.
- `format!`: Similar to `println!`, but returns a `ByteArray` instead of printing. It's more readable than manual string concatenation and uses snapshots, preventing ownership transfer.

```cairo
#[executable]
fn main() {
    let s1: ByteArray = "tic";
    let s2: ByteArray = "tac";
    let s3: ByteArray = "toe";
    let s = s1 + "-" + s2 + "-" + s3; // Consumes s1, s2, s3

    let s1: ByteArray = "tic";
    let s2: ByteArray = "tac";
    let s3: ByteArray = "toe";
    let s = format!("{s1}-{s2}-{s3}"); // s1, s2, s3 are not consumed
    // or
    let s = format!("{}-{}-{}", s1, s2, s3);

    println!("{}", s);
}
```

### Printing Custom Data Types

If `Display` is not implemented for a custom type, `print!` or `println!` will result in an error: `Trait has no implementation in context: core::fmt::Display::<package_name::struct_name>`.

## Range Check Builtin

The Range Check builtin verifies that field elements fall within specific ranges, crucial for integer types and bounded arithmetic.

### Variants

- **Standard Range Check**: Verifies values in the range `[0, 2^128 - 1]`.
- **Range Check 96**: Verifies values in the range `[0, 2^96 - 1]`.

### Purpose and Importance

While range checking can be implemented in pure Cairo, it's highly inefficient (approx. 384 instructions per check vs. 1.5 instructions for the builtin). This makes the builtin essential for performance.

### Cells Organization

The Range Check builtin uses a dedicated memory segment with the following characteristics:

- **Valid values**: Field elements in the range `[0, 2^128 - 1]`.
- **Error conditions**: Values ≥ 2^128 or relocatable addresses.

Variables, Scope, and Mutability

# Variables, Scope, and Mutability

Cairo enforces an immutable memory model by default, meaning variables are immutable. However, the language provides mechanisms to handle mutability when needed.

## Mutability

By default, variables in Cairo are immutable. Once a value is bound to a name, it cannot be changed. Attempting to reassign a value to an immutable variable results in a compile-time error.

```cairo,does_not_compile
#[executable]
fn main() {
    let x = 5;
    println!("The value of x is: {}", x);
    x = 6; // This line will cause a compile-time error
    println!("The value of x is: {}", x);
}
```

This immutability helps prevent bugs by ensuring that values do not change unexpectedly. However, variables can be made mutable by prefixing them with the `mut` keyword. This signals intent and allows the variable's value to be changed.

```cairo
#[executable]
fn main() {
    let mut x = 5;
    println!("The value of x is: {}", x);
    x = 6;
    println!("The value of x is: {}", x);
}
```

When a variable is declared as `mut`, the underlying memory is still immutable, but the variable can be reassigned to refer to a new value. This is implemented as syntactic sugar, equivalent to variable shadowing at a lower level, but without the ability to change the variable's type.

## Constants

Constants are similar to immutable variables but have key differences:

- They are always immutable; `mut` cannot be used.
- Declared using `const` instead of `let`.
- Type annotations are required.
- They can only be declared in the global scope.
- They can only be initialized with constant expressions, not runtime values.

Cairo's naming convention for constants is all uppercase with underscores.

```cairo,noplayground
struct AnyStruct {
    a: u256,
    b: u32,
}

enum AnyEnum {
    A: felt252,
    B: (usize, u256),
}

const ONE_HOUR_IN_SECONDS: u32 = 3600;
const ONE_HOUR_IN_SECONDS_2: u32 = 60 * 60;
const STRUCT_INSTANCE: AnyStruct = AnyStruct { a: 0, b: 1 };
const ENUM_INSTANCE: AnyEnum = AnyEnum::A('any enum');
const BOOL_FIXED_SIZE_ARRAY: [bool; 2] = [true, false];
```

Constants are useful for values that are known at compile time and used across multiple parts of the program.

## Shadowing

Shadowing occurs when a new variable is declared with the same name as a previous variable. The new variable

Data Types

# Data Types

Every value in Cairo is of a certain _data type_, which tells Cairo what kind of data is being specified so it knows how to work with that data. Cairo is a _statically typed_ language, meaning that the compiler must know the types of all variables at compile time. The compiler can usually infer the desired type based on the value and its usage. In cases where many types are possible, a conversion method can be used to specify the desired output type.

```cairo
#[executable]
fn main() {
    let x: felt252 = 3;
    let y: u32 = x.try_into().unwrap();
}
```

## Scalar Types

A _scalar_ type represents a single value. Cairo has three primary scalar types: `felt252`, integers, and booleans.

### Felt Type (`felt252`)

In Cairo, if the type of a variable or argument is not specified, it defaults to a field element, represented by the keyword `felt252`. A field element is an integer in the range $0 \leq x < P$, where $P$ is a large prime number ($2^{251} + 17 \cdot 2^{192} + 1$). Operations like addition, subtraction, and multiplication are performed modulo $P$. Division in Cairo is defined such that $\frac{x}{y} \cdot y = x$ always holds.

### Integer Types

Integer types are recommended over `felt252` for added security features like overflow and underflow checks. An integer is a number without a fractional component. The size of the integer is indicated by the number of bits used for storage.

**Unsigned Integer Types:**

| Length  | Type    |
| ------- | ------- |
| 8-bit   | `u8`    |
| 16-bit  | `u16`   |
| 32-bit  | `u32`   |
| 64-bit  | `u64`   |
| 128-bit | `u128`  |
| 256-bit | `u256`  |
| 32-bit  | `usize` |

`usize` is currently an alias for `u32`. Unsigned integers cannot contain negative numbers, and operations resulting in a negative value will cause a panic.

**Signed Integer Types:**

Cairo also provides signed integers with the prefix `i`, ranging from `i8` to `i128`. Each signed variant can store numbers from $-(2^{n-1})$ to $2^{n-1} - 1$, where `n` is the number of bits.

**Integer Literals:**

Integer literals can be represented in decimal, hexadecimal, octal, or binary formats. Type suffixes (e.g., `57_u8`) can be used for explicit type designation. Visual separators (`_`) improve readability.

| Numeric literals | Example   |
| ---------------- | --------- |
| Decimal          | `98222`   |
| Hex              | `0xff`    |
| Octal            | `0o04321` |
| Binary           | `0b01`    |

**`u256` Type:**

`u256` requires 4 more bits than `felt252` and is internally represented as a struct: `u256 { low: u128, high: u128 }`.

**Numeric Operations:**

Cairo supports basic arithmetic operations: addition, subtraction, multiplication, division (truncates towards zero), and remainder.

```cairo
#[executable]
fn main() {
    // addition
    let sum = 5_u128 + 10_u128;

    // subtraction
    let difference = 95_u128 - 4_u128;

    // multiplication
    let product = 4_u128 * 30_u128;

    // division
    let quotient = 56_u128 / 32_u128; //result is 1
    let quotient = 64_u128 / 32_u128; //result is 2

    // remainder
    let remainder = 43_u128 % 5_u128; // result is 3
}
```

### The Boolean Type (`bool`)

A Boolean type has two possible values: `true` and `false`. It is one `felt252` in size. Boolean values must be declared using `true` or `false` literals, not integer literals.

```cairo
#[executable]
fn main() {
    let t = true;
    let f: bool = false; // with explicit type annotation
}
```

### String Types

Cairo handles strings using two methods: short strings with simple quotes and `ByteArray` with double quotes.

#### Short strings

Short strings are ASCII strings where each character is encoded on one byte. They are represented using `felt252` and are limited to 31 characters. They can be represented as hexadecimal values or directly using simple quotes.

```cairo
# #[executable]
fn main() {
    let my_first_char = 'C';
    let my_first_char_in_hex = 0x43;

    let my_first_string = 'Hello world';
#     let my_first_string_in_hex = 0x48656C6C6F20776F726C64;
#
#     let long_string: ByteArray = "this is a string which has more than 31 characters";
# }
```

#### Byte Array Strings

For strings longer than 31 characters, Cairo's Core Library provides a `ByteArray` type. It is implemented as an array of `bytes31` words and a pending `felt252` word for remaining bytes.

```cairo
# #[executable]
# fn main() {
#     let my_first_char = 'C';
#     let my_first_char_in_hex = 0x43;
#
#     let my_first_string = 'Hello world';
#     let my_first_string_in_hex = 0x48656C6C6F20776F726C64;

#     let long_string: ByteArray = "this is a string which has more than 31 characters";
# }
```

## Compound Types

### The Tuple Type

A tuple groups together values of various types into a single compound type. Tuples have a fixed length.

```cairo
#[executable]
fn main() {
    let tup: (u32, f64, u8) = (500, 6.4, 1);
    let (x, y, z) = tup;
    println!("The value of y is {}", y);
}
```

## The `Copy` Trait

The `Copy` trait allows simple types to be duplicated by copying, without allocating new memory. This bypasses Cairo's default "move" semantics. Types like `Array` and `Felt252Dict` cannot implement `Copy`. Basic types implement `Copy` by default.

To implement `Copy` for a custom type, use the `#[derive(Copy)]` annotation. The type and all its components must implement `Copy`.

```cairo,ignore_format
#[derive(Copy, Drop)]
struct Point {
    x: u128,
    y: u128,
}

#[executable]
fn main() {
    let p1 = Point { x: 5, y: 10 };
    foo(p1);
    foo(p1);
}

fn foo(p: Point) { // do something with p
}
```

## Serialization and Deserialization

Serialization is the process of transforming data structures into a format that can be stored or transmitted. Deserialization is the reverse process.

### Data types using at most 252 bits

These types (`ContractAddress`, `EthAddress`, `StorageAddress`, `ClassHash`, unsigned integers up to 252 bits, `bytes31`, `felt252`, signed integers) are serialized as a single-member list containing one `felt252` value. Negative values are serialized as $P-x$.

### Data types using more than 252 bits

Types like `u256`, `u512`, arrays, spans, enums, structs, tuples, and byte arrays have non-trivial serialization.

**Serialization of Structs:**

Struct serialization is determined by the order and types of its members.

```cairo,noplayground
struct MyStruct {
    a: u256,
    b: felt252,
    c: Array<felt252>
}
```

Serialization of `MyStruct { a: 2, b: 5, c: [1,2,3] }` results in `[2,0,5,3,1,2,3]`.

**Serialization of Byte Arrays:**

A `ByteArray` consists of `data` (an array of 31-byte chunks) and `pending_word` (remaining bytes) with its length.

**Example 1 (short string):** `hello` (0x68656c6c6f)

```cairo,noplayground
0, // Number of 31-byte words in the data array.
0x68656c6c6f, // Pending word
5 // Length of the pending word, in bytes
```

## Type Conversion

Cairo uses the `try_into` and `into` methods from the `TryInto` and `Into` traits for type conversion.

### Into

The `Into` trait is used for fallible conversions where success is guaranteed. Call `var.into()` on the source value. The new variable's type must be explicitly defined.

```cairo
#[executable]
fn main() {
    let my_u8: u8 = 10;
    let my_u16: u16 = my_u8.into();
    let my_u32: u32 = my_u16.into();
    let my_u64: u64 = my_u32.into();
    let my_u128: u128 = my_u64.into();

    let my_felt252 = 10;
    let my_u256: u256 = my_felt252.into();
    let my_other_felt252: felt252 = my_u8.into();
    let my_third_felt252: felt252 = my_u16.into();
}
```

### TryInto

The `TryInto` trait is used for fallible conversions, returning `Option<T>`. Call `var.try_into()` on the source value. The new variable's type must be explicitly defined.

```cairo
#[executable]
fn main() {
    let my_u256: u256 = 10;
    let my_felt252: felt252 = my_u256.try_into().unwrap();
    let my_u128: u128 = my_felt252.try_into().unwrap();
    let my_u64: u64 = my_u128.try_into().unwrap();
    let my_u32: u32 = my_u64.try_into().unwrap();
    let my_16: u16 = my_u32.try_into().unwrap();
    let my_u8: u8 = my_16.try_into().unwrap();

    let my_large_u16: u16 = 2048;
    // This will panic:
    // let my_large_u8: u8 = my_large_u16.try_into().unwrap();
}
```

## Debugging with `Debug` and `Display` Traits

### `Debug` for Debugging Purposes

The `Debug` trait allows printing instances of a type for debugging. It is required for `assert_xx!` macros in tests.

```cairo
#[derive(Copy, Drop, Debug)]
struct Point {
    x: u8,
    y: u8,
}

#[executable]
fn main() {
    let p = Point { x: 1, y: 3 };
    println!("{:?}", p);
}
```

### `Display` for User-Facing Output

The `Display` trait enables formatting output for direct end-user consumption using the `{}` placeholder. It's not automatically derived for structs due to ambiguity in formatting possibilities.

```cairo
use core::fmt::{Display, Error, Formatter};

#[derive(Copy, Drop)]
struct Point {
    x: u8,
    y: u8,
}

impl PointDisplay of Display<Point> {
    fn fmt(self: @Point, ref f: Formatter) -> Result<(), Error> {
        let x = *self.x;
        let y = *self.y;
        writeln!(f, "Point ({x}, {y})")
    }
}

#[executable]
fn main() {
    let p = Point { x: 1, y: 3 };
    println!("{}", p); // Output: Point: (1, 3)
}
```

### Print in Hexadecimal

Integer values can be printed in hexadecimal using the `{:x}` notation. The `LowerHex` trait is implemented for common types.

### Print Debug Traces

This refers to using the `Debug` trait for printing detailed information, especially during debugging.

## `Default` for Default Values

The `Default` trait allows the creation of a default value for a type, commonly zero. All primitive types implement `Default`. For composite types, all elements must implement `Default`. For enums, a default variant must be declared with `#[default]`.

```cairo
#[derive(Default, Drop)]
struct A {
    item1: felt252,
    item2: u64,
}

#[derive(Default, Drop, PartialEq)]
enum CaseWithDefault {
    A: felt252,
    B: u128,
    #[default]
    C: u64,
}

#[executable]
fn main() {
    let defaulted: A = Default::default();
    assert!(defaulted.item1 == 0_felt252, "item1 mismatch");
    assert!(defaulted.item2 == 0_u64, "item2 mismatch");

    let default_case: CaseWithDefault = Default::default();
    assert!(default_case == CaseWithDefault::C(0_u64), "case mismatch");
}
```

## `PartialEq` for Equality Comparisons

The `PartialEq` trait enables equality comparisons using the `==` and `!=` operators.

Functions

# Functions

Functions are a fundamental part of Cairo code. The `main` function serves as the entry point for many programs, and the `fn` keyword is used to declare new functions. Cairo conventionally uses snake case for function and variable names.

```cairo
fn another_function() {
    println!("Another function.");
}

#[executable]
fn main() {
    println!("Hello, world!");
    another_function();
}
```

Functions are defined using `fn` followed by the function name, parentheses, and a body enclosed in curly brackets. Functions can be called by their name followed by parentheses. The order of definition does not matter as long as they are in a visible scope.

## Parameters

Functions can accept parameters, which are variables declared in the function's signature. Arguments are the concrete values passed to parameters when a function is called.

```cairo
#[executable]
fn main() {
    another_function(5);
}

fn another_function(x: felt252) {
    println!("The value of x is: {}", x);
}
```

Parameters must have their types declared in the function signature. This aids the compiler in providing better error messages and reduces the need for type annotations elsewhere.

Multiple parameters are separated by commas:

```cairo
#[executable]
fn main() {
    print_labeled_measurement(5, "h");
}

fn print_labeled_measurement(value: u128, unit_label: ByteArray) {
    println!("The measurement is: {value}{unit_label}");
}
```

### Named Parameters

Named parameters allow specifying argument names during function calls for improved readability:

```cairo
fn foo(x: u8, y: u8) {}

#[executable]
fn main() {
    let first_arg = 3;
    let second_arg = 4;
    foo(x: first_arg, y: second_arg);
    let x = 1;
    let y = 2;
    foo(:x, :y)
}
```

## Statements and Expressions

Statements, like `let y = 6`, do not return a value. Expressions, such as `5 + 6`, evaluate to a value. Function calls and code blocks enclosed in curly brackets are also expressions.

A code block can be an expression:

```cairo
#[executable]
fn main() {
    let y = {
        let x = 3;
        x + 1
    };

    println!("The value of y is: {}", y);
}
```

In this example, the block evaluates to `4`, which is then bound to `y`. Expressions do not end with a semicolon; adding one turns them into statements.

## Functions with Return Values

Functions can return values to the caller. The return type is specified after an arrow (`->`), and the value of the last expression in the function body is implicitly returned. The `return` keyword can be used for early returns.

```cairo
fn five() -> u32 {
    5
}

#[executable]
fn main() {
    let x = five();
    println!("The value of x is: {}", x);
}
```

The `five` function returns `5` as a `u32`.

```cairo
#[executable]
fn main() {
    let x = plus_one(5);

    println!("The value of x is: {}", x);
}

fn plus_one(x: u32) -> u32 {
    x + 1
}
```

Adding a semicolon to the last expression in a function that's supposed to return a value will cause a compilation error, as it turns the expression into a statement, which returns the unit type `()`.

```cairo,does_not_compile
#[executable]
fn main() {
    let x = plus_one(5);

    println!("The value of x is: {}", x);
}

fn plus_one(x: u32) -> u32 {
    x + 1; // This semicolon causes an error
}
```

### Const Functions

Functions evaluable at compile time can be declared with `const fn`. This restricts the types and expressions allowed within the function body.

```cairo
use core::num::traits::Pow;

const BYTE_MASK: u16 = 2_u16.pow(8) - 1;

#[executable]
fn main() {
    let my_value = 12345;
    let first_byte = my_value & BYTE_MASK;
    println!("first_byte: {}", first_byte);
}
```

The `pow` function, marked as `const`, can be used in constant expressions.

Control Flow

# Control Flow

The ability to run some code depending on whether a condition is true and to run some code repeatedly while a condition is true are basic building blocks in most programming languages. The most common constructs that let you control the flow of execution of Cairo code are if expressions and loops.

## `if` Expressions

An `if` expression allows you to branch your code depending on conditions. You provide a condition and then state, “If this condition is met, run this block of code. If the condition is not met, do not run this block of code.”

```cairo
#[executable]
fn main() {
    let number = 3;

    if number == 5 {
        println!("condition was true and number = {}", number);
    } else {
        println!("condition was false and number = {}", number);
    }
}
```

All `if` expressions start with the keyword `if`, followed by a condition. The condition must be a `bool`. Optionally, an `else` expression can be included to provide an alternative block of code to execute should the condition evaluate to `false`. If no `else` expression is provided and the condition is `false`, the program skips the `if` block.

```cairo
#[executable]
fn main() {
    let number = 3;

    if number != 0 {
        println!("number was something other than zero");
    }
}
```

### Handling Multiple Conditions with `else if`

You can use multiple conditions by combining `if` and `else` in an `else if` expression. Cairo checks each `if` expression in turn and executes the first body for which the condition evaluates to `true`.

```cairo
#[executable]
fn main() {
    let number = 3;

    if number == 12 {
        println!("number is 12");
    } else if number == 3 {
        println!("number is 3");
    } else if number - 2 == 1 {
        println!("number minus 2 is 1");
    } else {
        println!("number not found");
    }
}
```

### Using `if` in a `let` Statement

Because `if` is an expression, it can be used on the right side of a `let` statement to assign the outcome to a variable.

```cairo
#[executable]
fn main() {
    let condition = true;
    let number = if condition {
        5
    } else {
        6
    };

    if number == 5 {
        println!("condition was true and number is {}", number);
    }
}
```

## Repetition with Loops

Cairo provides `loop`, `while`, and `for` loops for executing code blocks repeatedly.

### Repeating Code with `loop`

The `loop` keyword executes a block of code over and over again until explicitly stopped with `break` or until the program runs out of gas.

```cairo
#[executable]
fn main() {
    let mut i: usize = 0;
    loop {
        if i > 10 {
            break;
        }
        if i == 5 {
            i += 1;
            continue;
        }
        println!("i = {}", i);
        i += 1;
    }
}
```

#### Returning Values from Loops

A `loop` can return a value by specifying it after the `break` expression.

```cairo
#[executable]
fn main() {
    let mut counter = 0;

    let result = loop {
        if counter == 10 {
            break counter * 2;
        }
        counter += 1;
    };

    println!("The result is {}", result);
}
```

### Conditional Loops with `while`

A `while` loop runs a block of code as long as a condition remains `true`.

```cairo
#[executable]
fn main() {
    let mut number = 3;

    while number != 0 {
        println!("{number}!");
        number -= 1;
    }

    println!("LIFTOFF!!!");
}
```

### Looping Through a Collection with `for`

The `for` loop provides a concise and safe way to iterate over the elements of a collection.

```cairo
#[executable]
fn main() {
    let a = [10, 20, 30, 40, 50].span();

    for element in a {
        println!("the value is: {element}");
    }
}
```

Ranges can also be used with `for` loops.

```cairo
#[executable]
fn main() {
    for number in 1..4_u8 {
        println!("{number}!");
    }
    println!("Go!!!");
}
```

## Equivalence Between Loops and Recursive Functions

Loops and recursive functions can achieve similar repetition of code. A `loop` can be transformed into a recursive function by calling the function within itself.

```cairo
#[executable]
fn main() -> felt252 {
    recursive_function(0)
}

fn recursive_function(mut x: felt252) -> felt252 {
    if x == 2 {
        x
    } else {
        recursive_function(x + 1)
    }
}
```

Enums and Pattern Matching

# Enums and Pattern Matching

Enums allow you to create a type that has a few possible variants. You can define enums and instantiate them with specific values.

## Enum Variants with Data

Each enum variant can hold associated data. This data can be of different types for different variants.

```cairo, noplayground
# #[derive(Drop)]
# enum Direction {
#     North: u128,
#     East: u128,
#     South: u128,
#     West: u128,
# }
#
# #[executable]
# fn main() {
    let direction = Direction::North(10);
# }
```

### Enums Combined with Custom Types

Enums can store custom data types, including tuples or other structs/enums.

```cairo, noplayground
#[derive(Drop)]
enum Message {
    Quit,
    Echo: felt252,
    Move: (u128, u128),
}
```

### Trait Implementations for Enums

Traits can be implemented for enums to define associated methods.

```cairo, noplayground
trait Processing {
    fn process(self: Message);
}

impl ProcessingImpl of Processing {
    fn process(self: Message) {
        match self {
            Message::Quit => { println!("quitting") },
            Message::Echo(value) => { println!("echoing {}", value) },
            Message::Move((x, y)) => { println!("moving from {} to {}", x, y) },
        }
    }
}
```

## The `Option` Enum

The `Option<T>` enum represents an optional value, with variants `Some(T)` and `None`.

```cairo,noplayground
enum Option<T> {
    Some: T,
    None,
}
```

It helps prevent bugs by explicitly handling the absence of a value.

### Example: Finding a Value

Functions can return `Option<usize>` to indicate success or failure.

```cairo,noplayground
fn find_value_recursive(mut arr: Span<felt252>, value: felt252, index: usize) -> Option<usize> {
    match arr.pop_front() {
        Some(index_value) => { if (*index_value == value) {
            return Some(index);
        } },
        None => { return None; },
    }

    find_value_recursive(arr, value, index + 1)
}

fn find_value_iterative(mut arr: Span<felt252>, value: felt252) -> Option<usize> {
    for (idx, array_value) in arr.into_iter().enumerate() {
        if (*array_value == value) {
            return Some(idx);
        }
    }
    None
}
```

## The `Match` Control Flow Construct

The `match` expression allows comparing a value against a series of patterns and executing code based on the match. It ensures all possible cases are handled.

### Basic `match` Example

```cairo,noplayground
enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter,
}

fn value_in_cents(coin: Coin) -> felt252 {
    match coin {
        Coin::Penny => 1,
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter => 25,
    }
}
```

### Patterns That Bind to Values

`match` arms can bind to parts of values, allowing extraction of data from enum variants.

```cairo,noplayground

#[derive(Drop, Debug)] // Debug so we can inspect the state in a minute
enum UsState {
    Alabama,
    Alaska,
}

#[derive(Drop)]
enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter: UsState,
}

fn value_in_cents(coin: Coin) -> felt252 {
    match coin {
        Coin::Penny => 1,
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter(state) => {
            println!("State quarter from {:?}!", state);
            25
        },
    }
}
```

### Matching with `Option<T>`

`match` can be used to handle `Option<T>` variants.

```cairo
fn plus_one(x: Option<u8>) -> Option<u8> {
    match x {
        Some(val) => Some(val + 1),
        None => None,
    }
}

#[executable]
fn main() {
    let five: Option<u8> = Some(5);
    let six: Option<u8> = plus_one(five);
    let none = plus_one(None);
}
```

### Matches Are Exhaustive

Cairo requires `match` patterns to cover all possible cases, preventing bugs like unhandled `None` values.

```cairo,noplayground
fn plus_one(x: Option<u8>) -> Option<u8> {
    match x {
        Some(val) => Some(val + 1),
    }
}
```

This code will produce a compilation error because the `None` case is not handled.

### Catch-all with the `_` Placeholder

The `_` pattern matches any value without binding it, useful for default actions.

```cairo,noplayground
fn vending_machine_accept(coin: Coin) -> bool {
    match coin {
        Coin::Dime => true,
        _ => false,
    }
}
```

### Multiple Patterns with the `|` Operator

The `|` operator allows matching multiple patterns in a single arm.

```cairo,noplayground
fn vending_machine_accept(coin: Coin) -> bool {
    match coin {
        Coin::Dime | Coin::Quarter => true,
        _ => false,
    }
}
```

### Matching Tuples

Tuples can be matched, allowing complex pattern matching.

```cairo,noplayground
#[derive(Drop)]
enum DayType {
    Week,
    Weekend,
    Holiday,
}

fn vending_machine_accept(c: (DayType, Coin)) -> bool {
    match c {
        (DayType::Week, _) => true,
        (_, Coin::Dime) | (_, Coin::Quarter) => true,
        (_, _) => false,
    }
}
```

```cairo,noplayground
fn vending_week_machine(c: (DayType, Coin)) -> bool {
    match c {
        (DayType::Week, Coin::Quarter) => true,
        _ => false,
    }
}
```

### Matching `felt252` and Integer Variables

`felt252` and integer variables can be matched, with restrictions on ranges and sequential coverage. The first arm must be 0.

Traits and Generic Programming

# Traits and Generic Programming

Generics allow us to replace specific types with a placeholder that represents multiple types, thereby removing code duplication. Functions can accept parameters of a generic type, enabling the same code to operate on various concrete types. Traits, on the other hand, define shared behavior in an abstract way. By combining traits with generic types, we can constrain generic types to accept only those that exhibit specific behaviors.

## Removing Duplication with Functions and Generics

To reduce code duplication, we can first extract common logic into functions. This technique can then be extended to generic functions. For instance, a function to find the largest number in an array can be generalized to work with any type that supports comparison.

## Trait Bounds

Trait bounds are constraints applied to generic types, specifying the traits a type must implement to be used with a particular function or type. For example, to find the smallest element in a list of generic type `T`, `T` must implement `PartialOrd` for comparison, `Copy` for element access, and `Drop` for proper memory management.

### Anonymous Generic Implementation Parameters

When a trait implementation is only used as a constraint and not directly in the function body, we can use the `+` operator for anonymous generic implementation parameters. For example, `+PartialOrd<T>` is equivalent to `impl TPartialOrd: PartialOrd<T>`.

## Structs with Generic Types

Structs can also utilize generic type parameters. A struct definition can include type parameters within angle brackets, which can then be used for fields within the struct. For example, a `Wallet<T>` struct can have a `balance` field of type `T`.

## Generic Methods

Methods can be implemented on structs and enums using generic types. Traits can define methods that operate on generic types, and implementations provide the specific behavior for those methods. Constraints can be applied to these generic types within method definitions.

## Defining a Trait

A trait defines a set of method signatures that represent shared behavior. Types can implement these traits to provide their own specific behavior for these methods. Traits are similar to interfaces in other languages.

### Generic Traits

Traits can be generic, accepting type parameters. This allows a trait to define behavior for a generic type `T`. Implementations of such traits provide the concrete behavior for specific types.

## Implementing a Trait on a Type

Implementing a trait on a type involves using the `impl` keyword, followed by an implementation name, the `of` keyword, and the trait name. If the trait is generic, the generic type is specified in angle brackets. The `impl` block contains the method signatures from the trait, with the specific behavior for that type filled in.

### Default Implementations

Traits can provide default implementations for methods. Implementors can either use the default implementation or override it with their own. Default implementations can call other methods within the same trait, potentially simplifying the required implementation for concrete types.

## Associated Items

Associated items are definitions tied to a trait, including associated types and associated constants.

### Associated Types

Associated types are type aliases within traits, allowing implementers to choose the concrete types to use. This makes trait definitions cleaner and more flexible. For example, a `Pack` trait might have an associated type `Result` whose concrete type is determined by the implementation.

### Associated Constants

Associated constants are constants defined within a trait and implemented for specific types. They provide a way to bind constant values to traits, ensuring consistency and improving code organization. For instance, a `Shape` trait could have an associated constant `SIDES`.

### Associated Implementations

Associated implementations allow declaring that a trait implementation must exist for an associated type, enforcing relationships between types and implementations at the trait level.

Ownership, Memory, and References

# Ownership, Memory, and References

Cairo utilizes a linear type system where each value must be used exactly once, either by being destroyed or moved. This system statically prevents operations that could lead to runtime errors, such as writing to the same memory cell twice.

## Cairo's Ownership System

In Cairo, ownership applies to variables, not values. Values themselves are immutable and can be referenced by multiple variables. The linear type system serves two primary purposes:

- Ensuring code is provable and verifiable.
- Abstracting the immutable memory of the Cairo VM.

### Moving Values

Moving a value means passing it to another function. The original variable is then destroyed and can no longer be used. Complex types like `Array` are moved when passed to functions. Attempting to use a variable after its value has been moved results in a compile-time error, enforcing that types must implement the `Copy` trait to be passed by value multiple times.

```cairo
// Example of moving an array
fn foo(mut arr: Array<u128>) {
    arr.pop_front();
}

#[executable]
fn main() {
    let arr: Array<u128> = array![];
    // foo(arr); // This line would cause a compile error if uncommented, as 'arr' is moved
    // foo(arr); // This second call would also fail
}
```

The compilation error for attempting to move a value twice highlights the need for the `Copy` trait:

```shell
$ scarb execute
   Compiling no_listing_02_pass_array_by_value v0.1.0 (...)
warn: Unhandled `#[must_use]` type `core::option::Option::<core::integer::u128>`
 --> .../lib.cairo:3:5
    arr.pop_front();
    ^^^^^^^^^^^^^^^

error: Variable was previously moved.
 --> .../lib.cairo:10:9
    foo(arr);
        ^^^
note: variable was previously used here:
  --> .../lib.cairo:9:9
    foo(arr);
        ^^^
note: Trait has no implementation in context: core::traits::Copy::<core::array::Array::<core::integer::u128>>.

error: could not compile `no_listing_02_pass_array_by_value` due to previous error
error: `scarb` command exited with error
```

### Value Destruction

Values can also be _destroyed_. This process ensures that resources are correctly released. For example, `Felt252Dict` must be "squashed" upon destruction for provability, a process enforced by the type system.

#### No-op Destruction: The `Drop` Trait

Types implementing the `Drop` trait are automatically destroyed when they go out of scope. This destruction is a no-op, simply indicating to the compiler that the type can be safely discarded.

```cairo
#[derive(Drop)]
struct A {}

#[executable]
fn main() {
    A {}; // No error, 'A' is automatically dropped.
}
```

Without `#[derive(Drop)]`, attempting to let a type go out of scope without explicit destruction would result in a compile error.

#### Destruction with Side-effects: The `Destruct` Trait

When a value is destroyed, the compiler first attempts to call its `drop` method. If that method doesn't exist, it calls the `destruct` method provided by the `Destruct` trait.

### References and Snapshots

References allow data to be accessed without copying, improving performance by passing pointers instead of entire data structures.

#### Using Boxes for Performance

`Box<T>` acts as a smart pointer, allowing data to be passed by reference (pointer) instead of by value. This is particularly beneficial for large data structures, as it avoids costly memory copies. When data within a `Box` is mutated, a new `Box` is created, requiring a copy of the data.

```cairo
#[derive(Drop)]
struct Cart {
    paid: bool,
    items: u256,
    buyer: ByteArray,
}

fn pass_data(cart: Cart) {
    println!("{} is shopping today and bought {} items", cart.buyer, cart.items);
}

fn pass_pointer(cart: Box<Cart>) {
    let cart = cart.unbox();
    println!("{} is shopping today and bought {} items", cart.buyer, cart.items);
}

#[executable]
fn main() {
    let new_struct = Cart { paid: true, items: 1, buyer: "Eli" };
    pass_data(new_struct);

    let new_box = BoxTrait::new(Cart { paid: false, items: 2, buyer: "Uri" });
    pass_pointer(new_box);
}
```

Smart pointers in Cairo offer memory management features beyond simple references, enforcing type checking and ownership rules for memory safety. They can prevent issues like null dereferences and provide efficient data passing.

**Note on References vs. Snapshots:**

- References (`ref`) must be used on mutable variables and allow mutation.
- Snapshots (`@`) are immutable views of data and cannot be mutated directly. Operations like `*n += 1` are invalid on references; `n += 1` should be used.

When attempting to modify an array passed to a function, a mutable reference (`ref`) is necessary. Snapshots are unsuitable for mutation.

```cairo
// Example using mutable references for array modification
fn give_and_take(ref arr: Array<u128>, n: u128) -> u128 {
    arr.append(n);
    arr.pop_front().unwrap_or(0)
}

fn main() {
    let mut arr1: Array<u128> = array![1, 2, 3];
    let elem = give_and_take(ref arr1, 4);
    println!("{}", elem); // Output: 1
}
```

Structs, Methods, and Associated Functions

# Structs, Methods, and Associated Functions

### Defining Methods

Methods are similar to functions but are defined within the context of a struct (or enum) and have `self` as their first parameter, representing the instance of the type. They are organized using traits and `impl` blocks.

```cairo, noplayground
#[derive(Copy, Drop)]
struct Rectangle {
    width: u64,
    height: u64,
}

trait RectangleTrait {
    fn area(self: @Rectangle) -> u64;
}

impl RectangleImpl of RectangleTrait {
    fn area(self: @Rectangle) -> u64 {
        (*self.width) * (*self.height)
    }
}

#[executable]
fn main() {
    let rect1 = Rectangle { width: 30, height: 50 };
    println!("Area is {}", rect1.area());
}
```

The `self` parameter can be passed by ownership, snapshot (`@`), or reference (`ref`). Using methods provides a clear way to organize functionality related to a type.

### Methods with Several Parameters

Methods can accept additional parameters. For instance, a `can_hold` method can determine if one rectangle fits within another.

```cairo
#[generate_trait]
impl RectangleImpl of RectangleTrait {
    fn area(self: @Rectangle) -> u64 {
        *self.width * *self.height
    }

    fn scale(ref self: Rectangle, factor: u64) {
        self.width *= factor;
        self.height *= factor;
    }

    fn can_hold(self: @Rectangle, other: @Rectangle) -> bool {
        *self.width > *other.width && *self.height > *other.height
    }
}

#[executable]
fn main() {
    let rect1 = Rectangle { width: 30, height: 50 };
    let rect2 = Rectangle { width: 10, height: 40 };
    let rect3 = Rectangle { width: 60, height: 45 };

    println!("Can rect1 hold rect2? {}", rect1.can_hold(@rect2));
    println!("Can rect1 hold rect3? {}", rect1.can_hold(@rect3));
}
```

### Associated Functions

Associated functions are functions defined within an `impl` block that are not methods (i.e., they don't take `self` as the first parameter). They are often used as constructors.

To call an associated function, use the `::` syntax with the type name (e.g., `RectangleTrait::new(30, 50)`).

```cairo
#[generate_trait]
impl RectangleImpl of RectangleTrait {
    fn area(self: @Rectangle) -> u64 {
        (*self.width) * (*self.height)
    }

    fn new(width: u64, height: u64) -> Rectangle {
        Rectangle { width, height }
    }

    fn square(size: u64) -> Rectangle {
        Rectangle { width: size, height: size }
    }

    fn avg(lhs: @Rectangle, rhs: @Rectangle) -> Rectangle {
        Rectangle {
            width: ((*lhs.width) + (*rhs.width)) / 2, height: ((*lhs.height) + (*rhs.height)) / 2,
        }
    }
}

#[executable]
fn main() {
    let rect1 = RectangleTrait::new(30, 50);
    let rect2 = RectangleTrait::square(10);

    println!(
        "The average Rectangle of {:?} and {:?} is {:?}",
        @rect1,
        @rect2,
        RectangleTrait::avg(@rect1, @rect2),
    );
}
```

### Struct Update Syntax

This syntax allows creating a new struct instance by copying most fields from an existing instance, while specifying new values for a subset of fields.

```cairo
#[derive(Drop)]
struct User {
    active: bool,
    username: ByteArray,
    email: ByteArray,
    sign_in_count: u64,
}

#[executable]
fn main() {
    let user1 = User {
        email: "someone@example.com", username: "someusername123", active: true, sign_in_count: 1,
    };

    let user2 = User {
        email: "another@example.com",
        ..user1 // Uses remaining fields from user1
    };
}
```

### Field Init Shorthand

When struct fields and function parameters share the same names, you can use shorthand to initialize the struct.

```cairo
struct User {
    active: bool,
    username: ByteArray,
    email: ByteArray,
    sign_in_count: u64,
}

fn build_user_short(email: ByteArray, username: ByteArray) -> User {
    User { active: true, username, email, sign_in_count: 1 }
}
```

### Dictionaries and the `Destruct` Trait

Dictionaries in Cairo must be "squashed" when destructed. To enforce this, they implement the `Destruct` trait. If a struct contains a dictionary and does not implement `Destruct`, it will not compile when going out of scope. Deriving `Destruct` resolves this by automatically squashing the dictionary.

```cairo
use core::dict::Felt252Dict;

#[derive(Destruct)]
struct A {
    dict: Felt252Dict<u128>,
}

#[executable]
fn main() {
    A { dict: Default::default() }; // Compiles after deriving Destruct
}
```

Error Handling

## Error Handling

This chapter explores Cairo's error handling techniques, focusing on creating adaptable and maintainable programs. We'll cover pattern matching with the `Result` enum, ergonomic error propagation using the `?` operator, and handling recoverable errors with `unwrap` or `expect`.

## Unrecoverable Errors with `panic`

In Cairo, unexpected issues can lead to runtime errors that terminate the program. The `panic` function from the core library acknowledges these errors and stops execution. Panics can occur inadvertently (e.g., array out-of-bounds access) or deliberately by calling `panic`.

When a panic occurs, the program terminates abruptly. The `panic` function accepts an array, which can include an error message, and initiates an unwind process to ensure program soundness before termination.

Here's how to call `panic` and return the error code `2`:

<span class="filename">Filename: src/lib.cairo</span>

```cairo
#[executable]
fn main() {
    let mut data = array![2];

    if true {
        panic(data);
    }
    println!("This line isn't reached");
}
```

## Recoverable Errors with `Result`

Many errors are not severe enough to warrant program termination. Functions might fail for reasons that can be handled gracefully, such as integer overflow during addition. Cairo uses the `Result` enum for this purpose.

### The `Result` Enum

The `Result` enum is defined with two variants: `Ok(T)` for success and `Err(E)` for failure, where `T` is the success type and `E` is the error type.

```cairo,noplayground
enum Result<T, E> {
    Ok: T,
    Err: E,
}
```

### The `ResultTrait`

The `ResultTrait` provides methods for interacting with `Result` values:

```cairo,noplayground
trait ResultTrait<T, E> {
    fn expect<+Drop<E>>(self: Result<T, E>, err: felt252) -> T;
    fn unwrap<+Drop<E>>(self: Result<T, E>) -> T;
    fn expect_err<+Drop<T>>(self: Result<T, E>, err: felt252) -> E;
    fn unwrap_err<+Drop<T>>(self: Result<T, E>) -> E;
    fn is_ok(self: @Result<T, E>) -> bool;
    fn is_err(self: @Result<T, E>) -> bool;
}
```

- **`expect` and `unwrap`**: Both extract the value from `Ok(x)`. `expect` allows a custom panic message, while `unwrap` uses a default one. If the `Result` is `Err`, they panic.
- **`expect_err` and `unwrap_err`**: Both extract the value from `Err(x)`. `expect_err` allows a custom panic message, while `unwrap_err` uses a default one. If the `Result` is `Ok`, they panic.
- **`is_ok`**: Returns `true` if the `Result` is `Ok`, `false` otherwise.
- **`is_err`**: Returns `true` if the `Result` is `Err`, `false` otherwise.

The `<+Drop<T>>` and `<+Drop<E>>` constraints indicate that these methods require a `Drop` trait implementation for the generic types.

Consider a function that handles potential overflow during `u128` addition:

```cairo,noplayground
fn u128_overflowing_add(a: u128, b: u128) -> Result<u128, u128>;
```

This function returns `Ok(sum)` if successful or `Err(overflowed_value)` if an overflow occurs.

Example of converting `Result` to `Option`:

```cairo,noplayground
fn u128_checked_add(a: u128, b: u128) -> Option<u128> {
    match u128_overflowing_add(a, b) {
        Ok(r) => Some(r),
        Err(r) => None,
    }
}
```

Example of parsing a `felt252` to `u8`:

```cairo,noplayground
fn parse_u8(s: felt252) -> Result<u8, felt252> {
    match s.try_into() {
        Some(value) => Ok(value),
        None => Err('Invalid integer'),
    }
}
```

### Propagating Errors

Instead of handling errors within a function, you can return the error to the calling code for it to decide how to manage it. This is known as error propagation.

Listing 9-1 demonstrates propagating errors using a `match` expression:

```cairo, noplayground
// A hypothetical function that might fail
fn parse_u8(input: felt252) -> Result<u8, felt252> {
    let input_u256: u256 = input.into();
    if input_u256 < 256 {
        Result::Ok(input.try_into().unwrap())
    } else {
        Result::Err('Invalid Integer')
    }
}

fn mutate_byte(input: felt252) -> Result<u8, felt252> {
    let input_to_u8 = match parse_u8(input) {
        Result::Ok(num) => num,
        Result::Err(err) => { return Result::Err(err); },
    };
    let res = input_to_u8 - 1;
    Result::Ok(res)
}
```

<span class="caption">Listing 9-1: A function that returns errors to the calling code using a `match` expression.</span>

### A Shortcut for Propagating Errors: the `?` Operator

The `?` operator simplifies error propagation. Listing 9-2 shows the `mutate_byte` function using the `?` operator:

```cairo, noplayground
# // A hypothetical function that might fail
# fn parse_u8(input: felt252) -> Result<u8, felt252> {
#     let input_u256: u256 = input.into();
#     if input_u256 < 256 {
#         Result::Ok(input.try_into().unwrap())
#     } else {
#         Result::Err('Invalid Integer')
#     }
# }
#
fn mutate_byte(input: felt252) -> Result<u8, felt252> {
    let input_to_u8: u8 = parse_u8(input)?;
    let res = input_to_u8 - 1;
    Ok(res)
}
#
# #[cfg(test)]
# mod tests {
#     use super::*;
#     #[test]
#     fn test_function_2() {
#         let number: felt252 = 258;
#         match mutate_byte(number) {
#             Ok(value) => println!("Result: {}", value),
#             Err(e) => println!("Error: {}", e),
#         }
#     }
# }
```

<span class="caption">Listing 9-2: A function that returns errors to the calling code using the `?` operator.</span>

The `?` operator, when applied to a `Result`, unwraps the `Ok` value or returns the `Err` value early from the function. If applied to an `Option`, it unwraps the `Some` value or returns `None` early.

#### Where The `?` Operator Can Be Used

The `?` operator can only be used in functions whose return type is compatible with the `Result` or `Option` being operated on. Using `?` on a `Result` requires the function to return a `Result`, and using `?` on an `Option` requires the function to return an `Option`.

Listing 9-3 demonstrates a compilation error when using `?` in a `main` function (which returns `()`):

```cairo
# //TAG: does_not_compile
#
#[executable]
fn main() {
    let some_num = parse_u8(258)?;
}
#
fn parse_u8(input: felt252) -> Result<u8, felt252> {
    let input_u256: u256 = input.into();
    if input_u256 < 256 {
        Result::Ok(input.try_into().unwrap())
    } else {
        Result::Err('Invalid Integer')
    }
}
```

<span class="caption">Listing 9-3: Attempting to use the `?` in a `main` function that returns `()` won’t compile.</span>

The error message indicates that `?` is restricted to functions returning `Option` or `Result`. To fix this, either change the function's return type to be compatible or use a `match` expression to handle the `Result` or `Option` explicitly.

### Summary

Cairo handles errors using the `Result` enum (`Ok` or `Err`) and the `panic` function for unrecoverable errors. The `ResultTrait` provides methods for managing `Result` values. Error propagation is facilitated by the `?` operator, which simplifies handling errors by returning them to the caller or unwrapping successful values, leading to more concise and ergonomic code.

Advanced Features and Patterns

# Advanced Features and Patterns

Contract Development

# Contract Development

## Storage Variables

Storage variables are used to store persistent data on the blockchain. They are defined within a special `Storage` struct annotated with the `#[storage]` attribute.

When accessing a storage variable, such as `let x = self.owner;`, we interact with a `StorageBase` type. This `StorageBase` represents the base location of the variable in the contract's storage. From this base address, pointers to the variable's fields or the variable itself can be obtained. Operations like `read` and `write`, defined in the `Store` trait, are then used on these pointers. These operations are transparent to the developer, as the compiler translates struct field accesses into the appropriate `StoragePointer` manipulations.

## Storage Mappings

For storage mappings, an intermediate type called `StoragePath` is introduced. A `StoragePath` represents a chain of storage nodes and struct fields that form a path to a specific storage slot.

The process to access a value within a mapping, for example, a `Map<ContractAddress, u128>`, involves the following steps:

1.  Start at the `StorageBase` of the `Map` and convert it into a `StoragePath`.
2.  Traverse the `StoragePath` to reach the desired value using the `entry` method. For a `Map`, the `entry` method hashes the current path with the next key to generate the subsequent `StoragePath`.
3.  Repeat step 2 until the `StoragePath` points to the target value. The final value is then converted into a `StoragePointer`.
4.  Finally, the value can be read or written at that pointer.

Note that types like `ContractAddress` must be converted to a `StoragePointer` before they can be read from or written to.

Cairo Circuits and Low-Level Operations

# Cairo Circuits and Low-Level Operations

## Combining Circuit Elements and Gates

Circuit elements can be combined using predefined functions like `circuit_add`, `circuit_sub`, `circuit_mul`, and `circuit_inverse`. For example, to represent the circuit `a * (a + b)`:

```cairo, noplayground
# use core::circuit::{
#     AddInputResultTrait, CircuitElement, CircuitInput, CircuitInputs, CircuitModulus,
#     CircuitOutputsTrait, EvalCircuitTrait, circuit_add, circuit_mul, u384,
# };
#
# // Circuit: a * (a + b)
# // witness: a = 10, b = 20
# // expected output: 10 * (10 + 20) = 300
# fn eval_circuit() -> (u384, u384) {
#     let a = CircuitElement::<CircuitInput<0>> {};
#     let b = CircuitElement::<CircuitInput<1>> {};
#
    let add = circuit_add(a, b);
    let mul = circuit_mul(a, add);
#
#     let output = (mul,);
#
#     let mut inputs = output.new_inputs();
#     inputs = inputs.next([10, 0, 0, 0]);
#     inputs = inputs.next([20, 0, 0, 0]);
#
#     let instance = inputs.done();
#
#     let bn254_modulus = TryInto::<
#         _, CircuitModulus,
#     >::try_into([0x6871ca8d3c208c16d87cfd47, 0xb85045b68181585d97816a91, 0x30644e72e131a029, 0x0])
#         .unwrap();
#
#     let res = instance.eval(bn254_modulus).unwrap();
#
#     let add_output = res.get_output(add);
#     let circuit_output = res.get_output(mul);
#
#     assert!(add_output == u384 { limb0: 30, limb1: 0, limb2: 0, limb3: 0 }, "add_output");
#     assert!(circuit_output == u384 { limb0: 300, limb1: 0, limb2: 0, limb3: 0 }, "circuit_output");
#
#     (add_output, circuit_output)
# }
#
# #[executable]
# fn main() {
#     eval_circuit();
# }
```

## Assigning Input Values

To assign values to circuit inputs, the `new_inputs` function is called on the circuit's output, followed by `next` calls for each input. The `AddInputResult` enum manages the state of input assignment:

```cairo
pub enum AddInputResult<C> {
    /// All inputs have been filled.
    Done: CircuitData<C>,
    /// More inputs are needed to fill the circuit instance's data.
    More: CircuitInputAccumulator<C>,
}
```

A `u384` value is represented as an array of four `u96`. For instance, initializing `a` to 10 and `b` to 20:

```cairo, noplayground
# use core::circuit::{
#     AddInputResultTrait, CircuitElement, CircuitInput, CircuitInputs, CircuitModulus,
#     CircuitOutputsTrait, EvalCircuitTrait, circuit_add, circuit_mul, u384,
# };
#
# // Circuit: a * (a + b)
# // witness: a = 10, b = 20
# // expected output: 10 * (10 + 20) = 300
# fn eval_circuit() -> (u384, u384) {
#     let a = CircuitElement::<CircuitInput<0>> {};
#     let b = CircuitElement::<CircuitInput<1>> {};
#
#     let add = circuit_add(a, b);
#     let mul = circuit_mul(a, add);
#
#     let output = (mul,);
#
    let mut inputs = output.new_inputs();
    inputs = inputs.next([10, 0, 0, 0]);
    inputs = inputs.next([20, 0, 0, 0]);

    let instance = inputs.done();
#
#     let bn254_modulus = TryInto::<
#         _, CircuitModulus,
#     >::try_into([0x6871ca8d3c208c16d87cfd47, 0xb85045b68181585d97816a91, 0x30644e72e131a029, 0x0])
#         .unwrap();
#
#     let res = instance.eval(bn254_modulus).unwrap();
#
#     let add_output = res.get_output(add);
#     let circuit_output = res.get_output(mul);
#
#     assert!(add_output == u384 { limb0: 30, limb1: 0, limb2: 0, limb3: 0 }, "add_output");
#     assert!(circuit_output == u384 { limb0: 300, limb1: 0, limb2: 0, limb3: 0 }, "circuit_output");
#
#     (add_output, circuit_output)
# }
#
# #[executable]
# fn main() {
#     eval_circuit();
# }
```

## Low-Level Modular Arithmetic Operations

The `add` function demonstrates a low-level modular addition using `UInt384` and the `ModBuiltin`. It utilizes `run_mod_p_circuit` to perform the calculation `c = x + y (mod p)`.

```cairo
from starkware.cairo.common.cairo_builtins import UInt384, ModBuiltin
from starkware.cairo.common.modulo import run_mod_p_circuit
from starkware.cairo.lang.compiler.lib.registers import get_fp_and_pc

func add{range_check96_ptr: felt*, add_mod_ptr: ModBuiltin*, mul_mod_ptr: ModBuiltin*}(
    x: UInt384*, y: UInt384*, p: UInt384*
) -> UInt384* {
    let (_, pc) = get_fp_and_pc();

    // Define pointers to the offsets tables, which come later in the code
    pc_label:
    let add_mod_offsets_ptr = pc + (add_offsets - pc_label);
    let mul_mod_offsets_ptr = pc + (mul_offsets - pc_label);

    // Load x and y into the range_check96 segment, which doubles as our values table
    // x takes slots 0-3, y takes 4-7—each UInt384 is 4 words of 96 bits
    assert [range_check96_ptr + 0] = x.d0;
    assert [range_check96_ptr + 1] = x.d1;
    assert [range_check96_ptr + 2] = x.d2;
    assert [range_check96_ptr + 3] = x.d3;
    assert [range_check96_ptr + 4] = y.d0;
    assert [range_check96_ptr + 5] = y.d1;
    assert [range_check96_ptr + 6] = y.d2;
    assert [range_check96_ptr + 7] = y.d3;

    // Fire up the modular circuit: 1 addition, no multiplications
    // The builtin deduces c = x + y (mod p) and writes it to offsets 8-11
    run_mod_p_circuit(
        p=[p],
        values_ptr=cast(range_check96_ptr, UInt384*),
        add_mod_offsets_ptr=add_mod_offsets_ptr,
        add_mod_n=1,
        mul_mod_offsets_ptr=mul_mod_offsets_ptr,
        mul_mod_n=0,
    );

    // Bump the range_check96_ptr forward: 8 input words + 4 output words = 12 total
    let range_check96_ptr = range_check96_ptr + 12;

    // Return a pointer to the result, sitting in the last 4 words
    return cast(range_check96_ptr - 4, UInt384*);

    // Offsets for AddMod: point to x (0), y (4), and the result (8)
    add_offsets:
    dw 0;  // x starts at offset 0
    dw 4;  // y starts at offset 4
    dw 8;  // result c starts at offset 8

    // No offsets needed for MulMod here
    mul_offsets:
}
```

Data Structures and Collections

Arrays

# Arrays

An array is a collection of elements of the same type. In Cairo, arrays are implemented using the `ArrayTrait` from the core library. It's important to note that arrays in Cairo have limited modification options; they function as queues where values cannot be directly modified after being added. Elements can only be appended to the end and removed from the front.

## Creating an Array

Arrays are created using the `ArrayTrait::new()` call. You can optionally specify the type of elements the array will hold.

```cairo
#[executable]
fn main() {
    let mut a = ArrayTrait::new();
    a.append(0);
    a.append(1);
    a.append(2);
}
```

To explicitly define the type of elements:

```cairo, noplayground
let mut arr = ArrayTrait::<u128>::new();
```

Or:

```cairo, noplayground
let mut arr:Array<u128> = ArrayTrait::new();
```

The `array!` macro provides a more concise way to initialize arrays with known values at compile time:

Without `array!`:

```cairo
    let mut arr = ArrayTrait::new();
    arr.append(1);
    arr.append(2);
    arr.append(3);
    arr.append(4);
    arr.append(5);
```

With `array!`:

```cairo
    let arr = array![1, 2, 3, 4, 5];
```

## Updating an Array

### Adding Elements

Elements are added to the end of an array using the `append()` method.

```cairo
# #[executable]
# fn main() {
#     let mut a = ArrayTrait::new();
#     a.append(0);
    a.append(1);
#     a.append(2);
# }
```

### Removing Elements

Elements can only be removed from the front of an array using the `pop_front()` method. This method returns an `Option` containing the removed element or `None` if the array is empty.

```cairo
#[executable]
fn main() {
    let mut a = ArrayTrait::new();
    a.append(10);
    a.append(1);
    a.append(2);

    let first_value = a.pop_front().unwrap();
    println!("The first value is {}", first_value);
}
```

Cairo's memory immutability means array elements cannot be modified in place. Operations like `append` and `pop_front` do not mutate memory but update pointers.

## Reading Elements from an Array

Elements can be accessed using the `get()` or `at()` methods, or the subscripting operator `[]`.

### `get()` Method

The `get()` method returns an `Option<Box<@T>>`. It returns `Some(snapshot)` if the element exists at the given index, and `None` otherwise. This is useful for handling potential out-of-bounds access gracefully.

```cairo
#[executable]
fn main() -> u128 {
    let mut arr = ArrayTrait::<u128>::new();
    arr.append(100);
    let index_to_access =
        1; // Change this value to see different results, what would happen if the index doesn't exist?
    match arr.get(index_to_access) {
        Some(x) => {
            *x
                .unbox() // Don't worry about * for now, if you are curious see Chapter 4.2 #desnap operator
            // It basically means "transform what get(idx) returned into a real value"
        },
        None => { panic!("out of bounds") },
    }
}
```

### `at()` Method

The `at()` method and the `[]` operator provide direct access to an element. They return a snapshot of the element, unwrapped from its box. If the index is out of bounds, a panic occurs. Use this when out-of-bounds access should be a fatal error.

```cairo
#[executable]
fn main() {
    let mut a = ArrayTrait::new();
    a.append(0);
    a.append(1);

    // using the `at()` method
    let first = *a.at(0);
    assert!(first == 0);
    // using the subscripting operator
    let second = *a[1];
    assert!(second == 1);
}
```

## Size-related Methods

- `len()`: Returns the number of elements in the array (type `usize`).
- `is_empty()`: Returns `true` if the array is empty, `false` otherwise.

## Storing Multiple Types with Enums

To store elements of different types in an array, you can define an `Enum` to represent the different possible data types.

```cairo
#[derive(Copy, Drop)]
enum Data {
    Integer: u128,
    Felt: felt252,
    Tuple: (u32, u32),
}

#[executable]
fn main() {
    let mut messages: Array<Data> = array![];
    messages.append(Data::Integer(100));
    messages.append(Data::Felt('hello world'));
    messages.append(Data::Tuple((10, 30)));
}
```

## Span

`Span` is a struct representing a snapshot of an `Array`, providing safe, read-only access. It supports all `Array` methods except `append()`.

To create a `Span` from an `Array`, use the `span()` method:

```cairo
#[executable]
fn main() {
    let mut array: Array<u8> = ArrayTrait::new();
    array.span();
}
```

Dictionaries (Felt252Dict)

# Dictionaries (Felt252Dict)

Cairo provides a dictionary-like type, `Felt252Dict<T>`, which stores unique key-value pairs. Keys are restricted to `felt252`, while the value type `T` can be specified. This data structure is useful for organizing data when arrays are insufficient and for simulating mutability.

## Basic Use of Dictionaries

The `Felt252DictTrait` trait provides core dictionary operations:

1.  `insert(felt252, T) -> ()`: Writes values to a dictionary.
2.  `get(felt252) -> T`: Reads values from a dictionary.

New dictionaries can be created using `Default::default()`. When a key is accessed for the first time, its value is initialized to zero. There is no direct way to delete data from a dictionary.

### Example: Basic Dictionary Operations

```cairo
use core::dict::Felt252Dict;

#[executable]
fn main() {
    let mut balances: Felt252Dict<u64> = Default::default();

    balances.insert('Alex', 100);
    balances.insert('Maria', 200);

    let alex_balance = balances.get('Alex');
    assert!(alex_balance == 100, "Balance is not 100");

    let maria_balance = balances.get('Maria');
    assert!(maria_balance == 200, "Balance is not 200");
}
```

### Example: Updating Dictionary Values

`Felt252Dict<T>` allows updating values for existing keys:

```cairo
use core::dict::Felt252Dict;

#[executable]
fn main() {
    let mut balances: Felt252Dict<u64> = Default::default();

    // Insert Alex with 100 balance
    balances.insert('Alex', 100);
    // Check that Alex has indeed 100 associated with him
    let alex_balance = balances.get('Alex');
    assert!(alex_balance == 100, "Alex balance is not 100");

    // Insert Alex again, this time with 200 balance
    balances.insert('Alex', 200);
    // Check the new balance is correct
    let alex_balance_2 = balances.get('Alex');
    assert!(alex_balance_2 == 200, "Alex balance is not 200");
}
```

## Dictionaries Underneath

Cairo's memory is immutable. `Felt252Dict<T>` simulates mutability by storing a list of entries. Each entry represents an access (read/write/update) and contains:

1.  `key`: The key for the pair.
2.  `previous_value`: The value held at `key` before this entry.
3.  `new_value`: The new value held at `key` after this entry.

An `Entry<T>` struct is defined as:

```cairo,noplayground
struct Entry<T> {
    key: felt252,
    previous_value: T,
    new_value: T,
}
```

Each interaction with the dictionary registers a new entry. A `get` operation records an entry with no change, while an `insert` records the new value and the previous one. This approach avoids rewriting memory, instead creating new memory cells per interaction.

### Example: Entry List Generation

Consider the following operations:

```cairo
# use core::dict::Felt252Dict;
#
# struct Entry<T> {
#     key: felt252,
#     previous_value: T,
#     new_value: T,
# }
#
# #[executable]
# fn main() {
#     let mut balances: Felt252Dict<u64> = Default::default();
    balances.insert('Alex', 100_u64);
    balances.insert('Maria', 50_u64);
    balances.insert('Alex', 200_u64);
    balances.get('Maria');
# }
```

This produces the following entry list:

|  key  | previous | new |
| :---: | -------- | --- |
| Alex  | 0        | 100 |
| Maria | 0        | 50  |
| Alex  | 100      | 200 |
| Maria | 50       | 50  |

This implementation has a worst-case time complexity of O(n) for each operation, where n is the number of entries, due to the need to scan the entry list. This is necessary for the STARK proof system's verification process, specifically for "dictionary squashing".

## Squashing Dictionaries

Squashing verifies the integrity of dictionary operations by reviewing the entry list. For a given key, it checks that the `new_value` of the i-th entry matches the `previous_value` of the (i+1)-th entry. This process reduces the entry list to its final state.

### Example: Squashing Reduction

Given this entry list:

|   key   | previous | new |
| :-----: | -------- | --- |
|  Alex   | 0        | 150 |
|  Maria  | 0        | 100 |
| Charles | 0        | 70  |
|  Maria  | 100      | 250 |
|  Alex   | 150      | 40  |
|  Alex   | 40       | 300 |
|  Maria  | 250      | 190 |
|  Alex   | 300      | 90  |

After squashing, it becomes:

|   key   | previous | new |
| :-----: | -------- | --- |
|  Alex   | 0        | 90  |
|  Maria  | 0        | 190 |
| Charles | 0        | 70  |

Squashing is automatically called via the `Destruct<T>` trait implementation when a `Felt252Dict<T>` goes out of scope.

## Entry and Finalize

The `entry` and `finalize` methods allow manual interaction with dictionary entries, mimicking internal operations.

- `entry(self: Felt252Dict<T>, key: felt252) -> (Felt252DictEntry<T>, T)`: Creates a new entry for a given key, taking ownership of the dictionary and returning the entry and its previous value.
- `finalize(self: Felt252DictEntry<T>, new_value: T) -> Felt252Dict<T>`: Inserts the updated entry back into the dictionary and returns ownership.

### Example: Custom `get` Implementation

```cairo,noplayground
use core::dict::{Felt252Dict, Felt252DictEntryTrait};

fn custom_get<T, +Felt252DictValue<T>, +Drop<T>, +Copy<T>>(
    ref dict: Felt252Dict<T>, key: felt252,
) -> T {
    // Get the new entry and the previous value held at `key`
    let (entry, prev_value) = dict.entry(key);

    // Store the value to return
    let return_value = prev_value;

    // Update the entry with `prev_value` and get back ownership of the dictionary
    dict = entry.finalize(prev_value);

    // Return the read value
    return_value
}
```

### Example: Custom `insert` Implementation

```cairo,noplayground
use core::dict::{Felt252Dict, Felt252DictEntryTrait};

fn custom_insert<T, +Felt252DictValue<T>, +Destruct<T>, +Drop<T>>(
    ref dict: Felt252Dict<T>, key: felt252, value: T,
) {
    // Get the last entry associated with `key`
    // Notice that if `key` does not exist, `_prev_value` will
    // be the default value of T.
    let (entry, _prev_value) = dict.entry(key);

    // Insert `entry` back in the dictionary with the updated value,
    // and receive ownership of the dictionary
    dict = entry.finalize(value);
}
```

## Dictionaries of Types not Supported Natively

The `Felt252Dict<T>` requires `T` to implement `Felt252DictValue<T>`, which provides a `zero_default` method. This is implemented for basic types but not for complex types like arrays or structs (`u256`).

To store unsupported types, wrap them in `Nullable<T>`, which uses `Box<T>` to manage memory in a dedicated segment.

### Example: Storing `Span<felt252>` in a Dictionary

```cairo
use core::dict::Felt252Dict;
use core::nullable::{FromNullableResult, NullableTrait, match_nullable};

#[executable]
fn main() {
    // Create the dictionary
    let mut d: Felt252Dict<Nullable<Span<felt252>>> = Default::default();

    // Create the array to insert
    let a = array![8, 9, 10];

    // Insert it as a `Span`
    d.insert(0, NullableTrait::new(a.span()));

    // Get value back
    let val = d.get(0);

    // Search the value and assert it is not null
    let span = match match_nullable(val) {
        FromNullableResult::Null => panic!("No value found"),
        FromNullableResult::NotNull(val) => val.unbox(),
    };

    // Verify we are having the right values
    assert!(*span.at(0) == 8, "Expecting 8");
    assert!(*span.at(1) == 9, "Expecting 9");
    assert!(*span.at(2) == 10, "Expecting 10");
}
```

## Using Arrays inside Dictionaries

Storing and modifying arrays in dictionaries requires careful handling due to `Array<T>` not implementing the `Copy<T>` trait.

Directly using `get` on an array in a dictionary will cause a compiler error. Instead, dictionary entries must be used to access and modify arrays.

### Example: Reading an Array Entry

```cairo,noplayground
fn get_array_entry(ref dict: Felt252Dict<Nullable<Array<u8>>>, index: felt252) -> Span<u8> {
    let (entry, _arr) = dict.entry(index);
    let mut arr = _arr.deref_or(array![]);
    let span = arr.span();
    dict = entry.finalize(NullableTrait::new(arr));
    span
}
```

### Example: Appending to an Array in a Dictionary

```cairo,noplayground
fn append_value(ref dict: Felt252Dict<Nullable<Array<u8>>>, index: felt252, value: u8) {
    let (entry, arr) = dict.entry(index);
    let mut unboxed_val = arr.deref_or(array![]);
    unboxed_val.append(value);
    dict = entry.finalize(NullableTrait::new(unboxed_val));
}
```

### Complete Example: Array Manipulation in Dictionary

```cairo
use core::dict::{Felt252Dict, Felt252DictEntryTrait};
use core::nullable::NullableTrait;

fn append_value(ref dict: Felt252Dict<Nullable<Array<u8>>>, index: felt252, value: u8) {
    let (entry, arr) = dict.entry(index);
    let mut unboxed_val = arr.deref_or(array![]);
    unboxed_val.append(value);
    dict = entry.finalize(NullableTrait::new(unboxed_val));
}

fn get_array_entry(ref dict: Felt252Dict<Nullable<Array<u8>>>, index: felt252) -> Span<u8> {
    let (entry, _arr) = dict.entry(index);
    let mut arr = _arr.deref_or(array![]);
    let span = arr.span();
    dict = entry.finalize(NullableTrait::new(arr));
    span
}

#[executable]
fn main() {
    let arr = array![20, 19, 26];
    let mut dict: Felt252Dict<Nullable<Array<u8>>> = Default::default();
    dict.insert(0, NullableTrait::new(arr));
    println!("Before insertion: {:?}", get_array_entry(ref dict, 0));

    append_value(ref dict, 0, 30);

    println!("After insertion: {:?}", get_array_entry(ref dict, 0));
}
```

## Nested Mappings

Dictionaries can be nested to create multi-dimensional mappings. For example, `Map<ContractAddress, Map<u64, u64>>` can represent a mapping from user addresses to their warehouses, where each warehouse maps item IDs to quantities.

```cairo, noplayground
# use starknet::ContractAddress;
#
# #[starknet::interface]
# trait IWarehouseContract<TState> {
#     fn set_quantity(ref self: TState, item_id: u64, quantity: u64);
#     fn get_item_quantity(self: @TState, address: ContractAddress, item_id: u64) -> u64;
# }
#
# #[starknet::contract]
# mod WarehouseContract {
#     use starknet::storage::{
#         Map, StoragePathEntry, StoragePointerReadAccess, StoragePointerWriteAccess,
#     };
#     use starknet::{ContractAddress, get_caller_address};
#
    #[storage]
    struct Storage {
        user_warehouse: Map<ContractAddress, Map<u64, u64>>,
    }
#
#     #[abi(embed_v0)]
#     impl WarehouseContractImpl of super::IWarehouseContract<ContractState> {
#         fn set_quantity(ref self: ContractState, item_id: u64, quantity: u64) {
#             let caller = get_caller_address();
#             self.user_warehouse.entry(caller).entry(item_id).write(quantity);
#         }
#
#         fn get_item_quantity(self: @ContractState, address: ContractAddress, item_id: u64) -> u64 {
#             self.user_warehouse.entry(address).entry(item_id).read()
#         }
#     }
# }
```

## Storage Address Computation for Mappings

The storage address for a mapping value is computed using `h(sn_keccak(variable_name), k)` for a single key `k`, and `h(...h(h(sn_keccak(variable_name), k_1), k_2), ..., k_n)` for multiple keys, where `h` is the Pedersen hash. If a key is a struct, its elements are used as keys. The struct must implement the `Hash` trait.

## Summary

- `Felt252Dict<T>` provides key-value storage with `felt252` keys.
- It simulates mutability using an entry list.
- Operations like `insert`, `get`, `entry`, and `finalize` are available.
- Squashing verifies data integrity.
- Complex types can be stored using `Nullable<T>`.
- Arrays can be manipulated within dictionaries using entry-based access.
- Nested mappings are supported for complex data structures.

Structs

# Structs

## Using Structs to Structure Related Data

A struct, or structure, is a custom data type that lets you package together and name multiple related values that make up a meaningful group. If you’re familiar with an object-oriented language, a struct is like an object’s data attributes. Structs, along with enums, are the building blocks for creating new types in your program’s domain to take full advantage of Cairo's compile-time type checking.

Structs are similar to tuples in that both hold multiple related values, and the pieces can be different types. Unlike with tuples, in a struct you’ll name each piece of data, which we call fields, so it’s clear what the values mean. This naming makes structs more flexible than tuples, as you don’t have to rely on the order of the data to specify or access the values of an instance.

## Defining and Instantiating Structs

To define a struct, we use the keyword `struct` and name the entire struct. A struct’s name should describe the significance of the pieces of data being grouped together. Inside curly brackets, we define the names and types of the fields.

```cairo, noplayground
#[derive(Drop)]
struct User {
    active: bool,
    username: ByteArray,
    email: ByteArray,
    sign_in_count: u64,
}
```

You can derive multiple traits on structs, such as `Drop`, `PartialEq` for comparison, and `Debug` for debug-printing.

To use a struct after defining it, we create an instance by specifying concrete values for each field. We do this by stating the struct name followed by curly brackets containing `key: value` pairs, where keys are field names. The fields don't need to be in the same order as declared in the struct definition.

```cairo
#[derive(Drop)]
struct User {
    active: bool,
    username: ByteArray,
    email: ByteArray,
    sign_in_count: u64,
}

#[executable]
fn main() {
    let user1 = User {
        active: true, username: "someusername123", email: "someone@example.com", sign_in_count: 1,
    };
    let user2 = User {
        sign_in_count: 1, username: "someusername123", active: true, email: "someone@example.com",
    };
}
```

## Accessing, Mutating, and Updating Structs

To get a specific value from a struct, we use dot notation. For example, to access `user1`'s email address, we use `user1.email`.

If an instance is mutable, we can change a value using dot notation and assignment. The entire instance must be mutable; Cairo doesn’t allow marking only certain fields as mutable.

```cairo
# #[derive(Drop)]
# struct User {
#     active: bool,
#     username: ByteArray,
#     email: ByteArray,
#     sign_in_count: u64,
# }
#[executable]
fn main() {
    let mut user1 = User {
        active: true, username: "someusername123", email: "someone@example.com", sign_in_count: 1,
    };
    user1.email = "anotheremail@example.com";
}
```

We can use struct update syntax to create a new instance using most of the values from an existing instance. The `..instance` syntax must come last.

```cairo
# use core::byte_array;
# #[derive(Drop)]
# struct User {
#     active: bool,
#     username: ByteArray,
#     email: ByteArray,
#     sign_in_count: u64,
# }
#[executable]
fn main() {
    let user1 = User {
        email: "someone@example.com", username: "someusername123", active: true, sign_in_count: 1,
    };

    let user2 = User { email: "another@example.com", ..user1 };
}
```

The struct update syntax moves data. If fields of moved types (like `ByteArray`) are not re-specified in the new instance, the original instance becomes invalid. Fields implementing `Copy` are copied.

## Example: Structs vs. Separate Variables and Tuples

Consider a program to calculate the area of a rectangle. Without structs, we might use separate variables.

```cairo
#[executable]
fn main() {
    let width = 30;
    let height = 10;
    let area = area(width, height);
    println!("Area is {}", area);
}

fn area(width: u64, height: u64) -> u64 {
    width * height
}
```

This works, but the `area` function signature `fn area(width: u64, height: u64) -> u64` doesn't clearly indicate that `width` and `height` are related to a single rectangle.

Refactoring with tuples can group them:

```cairo
#[executable]
fn main() {
    let rectangle = (30, 10);
    let area = area(rectangle);
    println!("Area is {}", area);
}

fn area(dimension: (u64, u64)) -> u64 {
    let (x, y) = dimension;
    x * y
}
```

While better, using named fields in structs provides more clarity and flexibility than tuples for grouping related data.

Enums

# Enums

Enums, short for "enumerations," are a way to define a custom data type that consists of a fixed set of named values, called _variants_. Enums are useful for representing a collection of related values where each value is distinct and has a specific meaning.

## Enum Variants and Values

Here's a simple example of an enum with variants that do not have associated values:

```cairo, noplayground
#[derive(Drop)]
enum Direction {
    North,
    East,
    South,
    West,
}
```

A variant can be instantiated using the following syntax:

```cairo, noplayground
# #[derive(Drop)]
# enum Direction {
#     North,
#     East,
#     South,
#     West,
# }
#
# #[executable]
# fn main() {
    let direction = Direction::North;
# }
```

Variants can also have associated values. For example, to store the degree of a direction:

```cairo, noplayground
#[derive(Drop)]
enum Direction {
    North: u128,
    East: u128,
    South: u128,
    West: u128,
}
#
# #[executable]
# fn main() {
#     let direction = Direction::North(10);
# }
```

A common and particularly useful enum is `Option<T>`, which represents that a value can either be something (`Some(T)`) or nothing (`None`). Cairo does not have null pointers; `Option` should be used to represent the possibility of a missing value.

## Recursive Types

Recursive types, where a type can contain another value of the same type, pose a compile-time challenge because Cairo needs to know the size of a type. To enable recursive types, a `box` (which has a known size) can be inserted into the type definition.

An example of a recursive type is a binary tree. The following code demonstrates an attempt to implement a binary tree that won't compile initially due to the recursive nature:

```cairo, noplayground
#[derive(Copy, Drop)]
enum BinaryTree {
    Leaf: u32,
    Node: (u32, BinaryTree, BinaryTree),
}

#[executable]
fn main() {
    let leaf1 = BinaryTree::Leaf(1);
    let leaf2 = BinaryTree::Leaf(2);
    let leaf3 = BinaryTree::Leaf(3);
    let node = BinaryTree::Node((4, leaf2, leaf3));
    let _root = BinaryTree::Node((5, leaf1, node));
}
```

Smart Pointers and Memory Management

# Smart Pointers and Memory Management

Cairo's memory is organized into segments. Smart pointers, such as `Felt252Dict<T>` and `Array<T>`, manage these memory segments, offering metadata and additional guarantees. For instance, `Array<T>` tracks its length to prevent overwrites and ensure elements are appended correctly.

## The `Box<T>` Type for Pointer Manipulation

The primary smart pointer in Cairo is `Box<T>`. It allows data to be stored in a dedicated "boxed segment" of the Cairo VM, with only a pointer residing in the execution segment. Instantiating a `Box<T>` appends the data of type `T` to the boxed segment.

`Box<T>` is useful in two main scenarios:

1.  When a type's size is unknown at compile time, and a fixed size is required.
2.  For efficiently transferring ownership of large amounts of data without copying, by storing the data in the boxed segment and only moving the pointer.

### Storing Data in the Boxed Segment with `Box<T>`

The `Box<T>` type facilitates storing data in the boxed segment.

```cairo
#[executable]
fn main() {
    let b = BoxTrait::new(5_u128);
    println!("b = {}", b.unbox())
}
```

This example stores the `u128` value `5` in the boxed segment. While storing a single value this way is uncommon, `Box<T>` is crucial for enabling complex type definitions.

### Enabling Recursive Types with Boxes

Types with recursive structures can be problematic if they directly contain themselves, as their size cannot be determined at compile time. Using `Box<T>` resolves this by storing recursive data in the boxed segment. The `Box<T>` acts as a pointer, and its size is constant regardless of the data it points to.

Consider the `BinaryTree` enum:

```cairo
mod display;
use display::DebugBinaryTree;

#[derive(Copy, Drop)]
enum BinaryTree {
    Leaf: u32,
    Node: (u32, Box<BinaryTree>, Box<BinaryTree>),
}


#[executable]
fn main() {
    let leaf1 = BinaryTree::Leaf(1);
    let leaf2 = BinaryTree::Leaf(2);
    let leaf3 = BinaryTree::Leaf(3);
    let node = BinaryTree::Node((4, BoxTrait::new(leaf2), BoxTrait::new(leaf3)));
    let root = BinaryTree::Node((5, BoxTrait::new(leaf1), BoxTrait::new(node)));

    println!("{:?}", root);
}
```

In this modified `BinaryTree` definition, the `Node` variant contains `(u32, Box<BinaryTree>, Box<BinaryTree>)`. This structure ensures that the `Node` variant has a known, fixed size (a `u32` plus two pointers), breaking the infinite recursion and allowing the compiler to determine the size of `BinaryTree`.

### Implementing `Destruct` for Memory Management

For structs containing types like `Felt252Dict<T>`, the `Destruct<T>` trait must be implemented to define how the struct goes out of scope.

```cairo
#
# use core::dict::Felt252Dict;
# use core::nullable::NullableTrait;
# use core::num::traits::WrappingAdd;
#
# trait MemoryVecTrait<V, T> {
#     fn new() -> V;
#     fn get(ref self: V, index: usize) -> Option<T>;
#     fn at(ref self: V, index: usize) -> T;
#     fn push(ref self: V, value: T) -> ();
#     fn set(ref self: V, index: usize, value: T);
#     fn len(self: @V) -> usize;
# }
#
# struct MemoryVec<T> {
#     data: Felt252Dict<Nullable<T>>,
#     len: usize,
# }
#
impl DestructMemoryVec<T, +Drop<T>> of Destruct<MemoryVec<T>> {
    fn destruct(self: MemoryVec<T>) nopanic {
        self.data.squash();
    }
}
```

Serialization and Iteration

# Serialization and Iteration

## Serialization of `u256`

A `u256` value in Cairo is serialized as two `felt252` values:

- The first `felt252` contains the 128 least significant bits (low part).
- The second `felt252` contains the 128 most significant bits (high part).

Examples:

- `u256` with value 2 serializes as `[2,0]`.
- `u256` with value \( 2^{128} \) serializes as `[0,1]`.
- `u256` with value \( 2^{129}+2^{128}+20 \) serializes as `[20,3]`.

## Serialization of `u512`

The `u512` type is a struct containing four `felt252` members, each representing a 128-bit limb.

## Serialization of Arrays and Spans

Arrays and spans are serialized as:
`<array/span_length>, <first_serialized_member>,..., <last_serialized_member>`

For example, an array of `u256` values `array![10, 20, POW_2_128]` (where `POW_2_128` is \( 2^{128} \)) serializes to `[3,10,0,20,0,0,1]`.

```cairo, noplayground
let POW_2_128: u256 = 0x100000000000000000000000000000000
let array: Array<u256> = array![10, 20, POW_2_128]
```

## Serialization of Enums

Enums are serialized as:
`<index_of_enum_variant>,<serialized_variant>`

Enum variant indices are 0-based.

**Example 1:**

```cairo,noplayground
enum Week {
    Sunday: (), // Index=0.
    Monday: u256, // Index=1.
}
```

| Instance          | Index | Type   | Serialization |
| ----------------- | ----- | ------ | ------------- |
| `Week::Sunday`    | `0`   | unit   | `[0]`         |
| `Week::Monday(5)` | `1`   | `u256` | `[1,5,0]`     |

**Example 2:**

```cairo,noplayground
enum MessageType {
    A,
    #[default]
    B: u128,
    C
}
```

| Instance            | Index | Type   | Serialization |
| ------------------- | ----- | ------ | ------------- |
| `MessageType::A`    | `1`   | unit   | `[0]`         |
| `MessageType::B(6)` | `0`   | `u128` | `[1,6]`       |
| `MessageType::C`    | `2`   | unit   | `[2]`         |

The `#[default]` attribute does not affect serialization.

## Serialization of Structs and Tuples

Structs and tuples are serialized by serializing their members sequentially in the order they appear in their definition.

## Iteration Traits (`Iterator` and `IntoIterator`)

The `Iterator` and `IntoIterator` traits facilitate iteration over collections in Cairo.

- **`Iterator<T>` trait:** Defines a `next` function that returns an `Option<Self::Item>`.
- **`IntoIterator<T>` trait:** Defines an `into_iter` method that converts a collection into an iterator. It has an associated type `IntoIter` representing the iterator type.
- **Associated Implementation:** The `Iterator: Iterator<Self::IntoIter>` declaration within `IntoIterator` ensures that the returned iterator type (`IntoIter`) itself implements the `Iterator` trait.

This design guarantees type-safe iteration and improves code ergonomics.

```cairo, noplayground
// Collection type that contains a simple array
#[derive(Drop)]
pub struct ArrayIter<T> {
    array: Array<T>,
}

// T is the collection type
pub trait Iterator<T> {
    type Item;
    fn next(ref self: T) -> Option<Self::Item>;
}

impl ArrayIterator<T> of Iterator<ArrayIter<T>> {
    type Item = T;
    fn next(ref self: ArrayIter<T>) -> Option<T> {
        self.array.pop_front()
    }
}

/// Turns a collection of values into an iterator
pub trait IntoIterator<T> {
    /// The iterator type that will be created
    type IntoIter;
    impl Iterator: Iterator<Self::IntoIter>;

    fn into_iter(self: T) -> Self::IntoIter;
}

impl ArrayIntoIterator<T> of IntoIterator<Array<T>> {
    type IntoIter = ArrayIter<T>;
    fn into_iter(self: Array<T>) -> ArrayIter<T> {
        ArrayIter { array: self }
    }
}
```

Advanced Language Features

Ownership, References, and Snapshots

# Ownership, References, and Snapshots

Cairo's ownership system can be inconvenient when you need to use a value in a function without moving it or returning it explicitly. To address this, Cairo provides references and snapshots.

## References and Snapshots

Passing values into and out of functions can be tedious, especially when you want to retain ownership of the original value. While returning multiple values using tuples is possible, it's verbose. References and snapshots allow functions to use values without taking ownership, eliminating the need to return them.

### Snapshots

Snapshots provide an immutable view of a value at a specific point in execution, bypassing the strict rules of the linear type system. They are passed by value, meaning the entire snapshot is copied to the function's stack. For large data structures, `Box<T>` can be used to avoid copying if mutation is not required.

The `@` syntax creates a snapshot, and functions can accept snapshots as parameters, indicated by `@` in the function signature. When a function parameter that is a snapshot goes out of scope, the snapshot is dropped, but the underlying original value remains unaffected.

```cairo
#[executable]
fn main() {
    let arr1: Array<u128> = array![];

    let (arr2, len) = calculate_length(arr1);
}

fn calculate_length(arr: Array<u128>) -> (Array<u128>, usize) {
    let length = arr.len(); // len() returns the length of an array

    (arr, length)
}
```

```cairo
let second_length = calculate_length(@arr1); // Calculate the current length of the array
```

```cairo, noplayground
fn calculate_area(
    rec_snapshot: @Rectangle // rec_snapshot is a snapshot of a Rectangle
) -> u64 {
    *rec_snapshot.height * *rec_snapshot.width
} // Here, rec_snapshot goes out of scope and is dropped.
// However, because it is only a view of what the original `rec` contains, the original `rec` can still be used.
```

### Desnap Operator

The `desnap` operator `*` converts a snapshot back into a regular variable. This operation is only possible for `Copy` types and is a free operation as it reuses the old value without modification.

```cairo
#[derive(Drop)]
struct Rectangle {
    height: u64,
    width: u64,
}

#[executable]
fn main() {
    let rec = Rectangle { height: 3, width: 10 };
    let area = calculate_area(@rec);
    println!("Area: {}", area);
}

fn calculate_area(rec: @Rectangle) -> u64 {
    // As rec is a snapshot to a Rectangle, its fields are also snapshots of the fields types.
    // We need to transform the snapshots back into values using the desnap operator `*`.
    // This is only possible if the type is copyable, which is the case for u64.
    // Here, `*` is used for both multiplying the height and width and for desnapping the snapshots.
    *rec.height * *rec.width
}
```

Generics

# Generics

Generics enable the creation of definitions for item declarations, such as structs and functions, that can operate on many different concrete data types. This allows for writing reusable code that works with multiple types, thus avoiding code duplication and enhancing maintainability. In Cairo, generics can be used when defining functions, structs, enums, traits, implementations, and methods.

## Generic Functions

Making a function generic means it can operate on different types, avoiding the need for multiple, type-specific implementations. Generics are placed in the function signature.

For example, a function to find the largest list can be implemented once using generics:

```cairo
// Specify generic type T between the angulars
fn largest_list<T>(l1: Array<T>, l2: Array<T>) -> Array<T> {
    if l1.len() > l2.len() {
        l1
    } else {
        l2
    }
}

#[executable]
fn main() {
    let mut l1 = array![1, 2];
    let mut l2 = array![3, 4, 5];

    // There is no need to specify the concrete type of T because
    // it is inferred by the compiler
    let l3 = largest_list(l1, l2);
}
```

## Generic Methods and Traits

Cairo allows defining generic methods within generic traits. Consider a `Wallet` struct with generic types for balance and address:

```cairo,noplayground
struct Wallet<T, U> {
    balance: T,
    address: U,
}
```

A trait can be defined to mix two wallets of potentially different generic types. An initial naive implementation might not compile due to how instances are dropped:

```cairo,noplayground
// This does not compile!
trait WalletMixTrait<T1, U1> {
    fn mixup<T2, U2>(self: Wallet<T1, U1>, other: Wallet<T2, U2>) -> Wallet<T1, U2>;
}

impl WalletMixImpl<T1, U1> of WalletMixTrait<T1, U1> {
    fn mixup<T2, U2>(self: Wallet<T1, U1>, other: Wallet<T2, U2>) -> Wallet<T1, U2> {
        Wallet { balance: self.balance, address: other.address }
    }
}
```

This fails because the compiler needs to know how to drop the generic types `T2` and `U2` if they are not used or if they implement `Drop`. The corrected implementation requires specifying that the generic types implement the `Drop` trait:

```cairo
trait WalletMixTrait<T1, U1> {
    fn mixup<T2, +Drop<T2>, U2, +Drop<U2>>(
        self: Wallet<T1, U1>, other: Wallet<T2, U2>,
    ) -> Wallet<T1, U2>;
}

impl WalletMixImpl<T1, +Drop<T1>, U1, +Drop<U1>> of WalletMixTrait<T1, U1> {
    fn mixup<T2, +Drop<T2>, U2, +Drop<U2>>(
        self: Wallet<T1, U1>, other: Wallet<T2, U2>,
    ) -> Wallet<T1, U2> {
        Wallet { balance: self.balance, address: other.address }
    }
}
```

Traits and Implementations

# Traits and Implementations

## `#[generate_trait]` Attribute

The `#[generate_trait]` attribute can be placed above a trait implementation. It instructs the compiler to automatically generate the corresponding trait definition, eliminating the need for explicit trait definition when the trait is not intended for reuse.

```cairo
#[derive(Copy, Drop)]
struct Rectangle {
    width: u64,
    height: u64,
}

#[generate_trait]
impl RectangleImpl of RectangleTrait {
    fn area(self: @Rectangle) -> u64 {
        (*self.width) * (*self.height)
    }
}

#[executable]
fn main() {
    let rect1 = Rectangle { width: 30, height: 50 };
    println!("Area is {}", rect1.area());
}
```

## Snapshots and References

Methods can accept `self` as a snapshot (`@`) if they don't modify the instance, or as a mutable reference (`ref self`) to allow modifications.

```cairo
#[generate_trait]
impl RectangleImpl of RectangleTrait {
    fn area(self: @Rectangle) -> u64 {
        (*self.width) * (*self.height)
    }
    fn scale(ref self: Rectangle, factor: u64) {
        self.width *= factor;
        self.height *= factor;
    }
}

#[executable]
fn main() {
    let mut rect2 = Rectangle { width: 10, height: 20 };
    rect2.scale(2);
    println!("The new size is (width: {}, height: {})", rect2.width, rect2.height);
}
```

## Default Implementations

Traits can provide default behavior for methods, allowing implementers to either use the default or override it.

```cairo
// In src/lib.cairo
mod aggregator {
    pub trait Summary<T> {
        fn summarize(self: @T) -> ByteArray {
            "(Read more...)"
        }
    }

    #[derive(Drop)]
    pub struct NewsArticle {
        pub headline: ByteArray,
        pub location: ByteArray,
        pub author: ByteArray,
        pub content: ByteArray,
    }

    impl NewsArticleSummary of Summary<NewsArticle> {}

    #[derive(Drop)]
    pub struct Tweet {
        pub username: ByteArray,
        pub content: ByteArray,
        pub reply: bool,
        pub retweet: bool,
    }

    impl TweetSummary of Summary<Tweet> {
        fn summarize(self: @Tweet) -> ByteArray {
            format!("{}: {}", self.username, self.content)
        }
    }
}

use aggregator::{NewsArticle, Summary};

#[executable]
fn main() {
    let news = NewsArticle {
        headline: "Cairo has become the most popular language for developers",
        location: "Worldwide",
        author: "Cairo Digger",
        content: "Cairo is a new programming language for zero-knowledge proofs",
    };

    println!("New article available! {}", news.summarize());
}
```

This code prints `New article available! (Read more...)`.

## Managing and Using External Traits

To use trait methods, ensure the relevant traits and their implementations are imported. This might involve importing both the trait and its implementation if they are in separate modules.

## Impl Aliases

Implementations can be aliased upon import, which is useful for instantiating generic implementations with concrete types.

```cairo
trait Two<T> {
    fn two() -> T;
}

mod one_based {
    pub impl TwoImpl<
        T, +Copy<T>, +Drop<T>, +Add<T>, impl One: core::num::traits::One<T>,
    > of super::Two<T> {
        fn two() -> T {
            One::one() + One::one()
        }
    }
}

pub impl U8Two = one_based::TwoImpl<u8>;
pub impl U128Two = one_based::TwoImpl<u128>;
```

This allows a generic implementation to be defined privately while exposing specific instantiations publicly.

## Negative Impls

Negative implementations allow a trait to be implemented for types that _do not_ implement another specified trait. For example, a `Consumer` trait could be implemented for any type `T` that does not implement the `Producer` trait.

## Associated Types (Experimental)

Cairo 2.9 offers an experimental feature to specify associated types of traits using `experimental-features = ["associated_item_constraints"]` in `Scarb.toml`. This can be used, for instance, to define a `filter` function for arrays where the closure's return type is constrained to `bool`.

```cairo
#[generate_trait]
impl ArrayFilterExt of ArrayFilterExtTrait {
    fn filter<
        T,
        +Copy<T>,
        +Drop<T>,
        F,
        +Drop<F>,
        impl func: core::ops::Fn<F, (T,)>[Output: bool],
        +Drop<func::Output>,
    >(
        self: Array<T>, f: F,
    ) -> Array<T> {
        let mut output: Array<T> = array![];
        for elem in self {
            if f(elem) {
                output.append(elem);
            }
        }
        output
    }
}
```

## Manual `Destruct` Implementation

For generic structs containing types that require specific cleanup (like `Felt252Dict`), a manual implementation of the `Destruct` trait might be necessary if `#[derive(Destruct)]` is not sufficient or applicable.

```cairo
impl UserDatabaseDestruct<T, +Drop<T>, +Felt252DictValue<T>> of Destruct<UserDatabase<T>> {
    fn destruct(self: UserDatabase<T>) nopanic {
        self.balances.squash();
    }
}
```

Advanced Type System Features

# Negative Implementations

Negative implementations, also known as negative traits or negative bounds, allow expressing that a type does not implement a certain trait when defining a generic trait implementation. This enables writing implementations applicable only when another implementation does not exist in the current scope.

To use this feature, you must enable it in your `Scarb.toml` file with `experimental-features = ["negative_impls"]` under the `[package]` section.

Consider a scenario where you want all types to implement the `Consumer` trait by default, but restrict types that are already `Producer`s from being `Consumer`s. Negative implementations can enforce this.

```cairo
#[derive(Drop)]
struct ProducerType {}

#[derive(Drop, Debug)]
struct AnotherType {}

#[derive(Drop, Debug)]
struct AThirdType {}

trait Producer<T> {
    fn produce(self: T) -> u32;
}

trait Consumer<T> {
    fn consume(self: T, input: u32);
}

impl ProducerImpl of Producer<ProducerType> {
    fn produce(self: ProducerType) -> u32 {
        42
    }
}

// This implementation consumes if the type T does NOT implement Producer<T>
impl TConsumerImpl<T, +core::fmt::Debug<T>, +Drop<T>, -Producer<T>> of Consumer<T> {
    fn consume(self: T, input: u32) {
        println!("{:?} consumed value: {}", self, input);
    }
}

#[executable]
fn main() {
    let producer = ProducerType {};
    let another_type = AnotherType {};
    let third_type = AThirdType {};
    let production = producer.produce();

    // producer.consume(production); // Invalid: ProducerType does not implement Consumer
    another_type.consume(production);
    third_type.consume(production);
}
```

In this example, `ProducerType` implements `Producer`. `AnotherType` and `AThirdType` do not. The `Consumer` trait is implemented for any type `T` that derives `Debug` and `Drop`, and crucially, does _not_ implement `Producer`. Consequently, `producer.consume(production)` is invalid, while `another_type.consume(production)` and `third_type.consume(production)` are valid.

Function Safety and Panics

## Function Safety and Panics

## `nopanic` Notation

The `nopanic` notation indicates that a function will never panic. Only `nopanic` functions can be called within another function annotated as `nopanic`.

A function guaranteed to never panic:

```cairo,noplayground
fn function_never_panic() -> felt252 nopanic {
    42
}
```

This function will always return `42` and is guaranteed not to panic.

Conversely, a function declared as `nopanic` but containing code that might panic will result in a compilation error. For example, using `assert!` or equality checks (`==`) within a `nopanic` function is not allowed:

```cairo,noplayground
fn function_never_panic() nopanic {
    assert!(1 == 1, "what");
}
```

Compiling such a function yields an error indicating that a `nopanic` function calls another function that may panic.

## `panic_with` Attribute

The `panic_with` attribute can be applied to functions returning `Option` or `Result`. It takes two arguments: the data to be used as the panic reason and the name for a generated wrapper function. This creates a wrapper that panics with the specified data if the annotated function returns `None` or `Err`.

Example:

```cairo
#[panic_with('value is 0', wrap_not_zero)]
fn wrap_if_not_zero(value: u128) -> Option<u128> {
    if value == 0 {
        None
    } else {
        Some(value)
    }
}

#[executable]
fn main() {
    wrap_if_not_zero(0); // this returns None
    wrap_not_zero(0); // this panics with 'value is 0'
}
```

Storage Optimization and Modularity

# Storage Optimization and Modularity

## Storage Packing

The `StorePacking` trait allows for optimizing storage by packing multiple fields into a single storage variable. This is achieved using bitwise operations:

- **Shifts:** `TWO_POW_8` and `TWO_POW_40` are used for left shifts during packing and right shifts during unpacking.
- **Masks:** `MASK_8` and `MASK_32` are used to isolate specific variables during unpacking.
- **Type Conversion:** Variables are converted to `u128` to enable bitwise operations.

This technique is applicable to any set of fields whose combined bit sizes fit within a packed storage type (e.g., `u256`, `u512`). Custom structs and packing/unpacking logic can be defined.

The compiler automatically utilizes the `StoreUsingPacking` implementation of the `Store` trait if a type implements `StorePacking`. A crucial detail is that the type produced by `StorePacking::pack` must also implement `Store` for `StoreUsingPacking` to function correctly. Typically, packing is done into `felt252` or `u256`, but custom types must also implement `Store`.

```rust
// Example demonstrating storage packing (conceptual, actual implementation details may vary)
const TWO_POW_8: u128 = 1 << 8;
const TWO_POW_40: u128 = 1 << 40;
const MASK_8: u128 = (1 << 8) - 1;
const MASK_32: u128 = (1 << 32) - 1;

#[derive(Copy, Drop, Serde)]
struct MyStruct {
    field1: u8,
    field2: u32,
    field3: u8,
}

impl MyStruct {
    fn pack(self: MyStruct) -> u128 {
        let mut packed: u128 = 0;
        packed |= (self.field1 as u128) << 40; // field1 at bits 40-47
        packed |= (self.field2 as u128) << 8;  // field2 at bits 8-39
        packed |= self.field3 as u128;         // field3 at bits 0-7
        packed
    }

    fn unpack(packed: u128) -> MyStruct {
        let field1 = ((packed >> 40) & MASK_8) as u8;
        let field2 = ((packed >> 8) & MASK_32) as u32;
        let field3 = (packed & MASK_8) as u8;
        MyStruct { field1, field2, field3 }
    }
}
```

## Components

Components offer a Lego-like approach to building smart contracts by providing modular add-ons. They encapsulate reusable logic and storage, allowing developers to easily incorporate specific functionalities into their contracts without reimplementing them. This separation of core contract logic from additional features enhances modularity and reduces potential bugs.

Functional Programming: Closures and Iterators

# Functional Programming: Closures and Iterators

Closures are anonymous functions that can be stored in variables or passed as arguments to other functions. Unlike regular functions, closures have the ability to capture values from the scope in which they are defined. This allows for code reuse and behavior customization.

> Note: Closures were introduced in Cairo 2.9 and are still under development.

## Understanding Closures

Closures provide a way to define behavior inline, without needing to create a separate named function. They are particularly useful when working with collections, error handling, or any situation where a function needs to be passed as a parameter to customize behavior.

Under the hood, closures are implemented using the `FnOnce` and `Fn` traits. `FnOnce` is for closures that consume captured variables, while `Fn` is for closures that capture only copyable variables.

## Implementing Your Functional Programming Patterns with Closures

Closures can be passed as function arguments, a mechanism heavily utilized in functional programming through functions like `map`, `filter`, and `reduce`.

Here's a potential implementation of `map` to apply a function to all items in an array:

```cairo, noplayground
#[generate_trait]
impl ArrayExt of ArrayExtTrait {
    // Needed in Cairo 2.11.4 because of a bug in inlining analysis.
    #[inline(never)]
    fn map<T, +Drop<T>, F, +Drop<F>, impl func: core::ops::Fn<F, (T,)>, +Drop<func::Output>>(
        self: Array<T>, f: F,
    ) -> Array<func::Output> {
        let mut output: Array<func::Output> = array![];
        for elem in self {
            output.append(f(elem));
        }
        output
    }
}

#[generate_trait]
impl ArrayFilterExt of ArrayFilterExtTrait {
    // Needed in Cairo 2.11.4 because of a bug in inlining analysis.
    #[inline(never)]
    fn filter<
        T,
        +Copy<T>,
        +Drop<T>,
        F,
        +Drop<F>,
        impl func: core::ops::Fn<F, (T,)>[Output: bool],
        +Drop<func::Output>,
    >(
        self: Array<T>, f: F,
    ) -> Array<T> {
        let mut output: Array<T> = array![];
        for elem in self {
            if f(elem) {
                output.append(elem);
            }
        }
        output
    }
}

#[executable]
fn main() {
    let double = |value| value * 2;
    println!("Double of 2 is {}", double(2_u8));
    println!("Double of 4 is {}", double(4_u8));

    // This won't work because `value` type has been inferred as `u8`.
    //println!("Double of 6 is {}", double(6_u16));

    let sum = |x: u32, y: u32, z: u16| {
        x + y + z.into()
    };
    println!("Result: {}", sum(1, 2, 3));

    let x = 8;
    let my_closure = |value| {
        x * (value + 3)
    };

    println!("my_closure(1) = {}", my_closure(1));

    let double = array![1, 2, 3].map(|item: u32| item * 2);
    let another = array![1, 2, 3].map(|item: u32| {
        let x: u64 = item.into();
        x * x
    });

    println!("double: {:?}", double);
    println!("another: {:?}", another);

    let even = array![3, 4, 5, 6].filter(|item: u32| item % 2 == 0);
    println!("even: {:?}", even);
}
```

Resource Management and Memory Safety

# Resource Management and Memory Safety

While Cairo's memory model is immutable, the `Felt252Dict<T>` type can be used to simulate mutable data structures, effectively hiding the complexity of the underlying memory model.

## Smart Pointers

Smart pointers are data structures that act like pointers but include additional metadata and capabilities. They originated in C++ and are also found in languages like Rust. In Cairo, smart pointers ensure memory is not addressed in an unsafe manner that could lead to unprovable programs. They achieve this through strict type checking and ownership rules, providing a safe way to access memory.

Operator Overloading and Hashing

# Operator Overloading and Hashing

## Operator Overloading

Operator overloading allows redefining standard operators (like `+`, `-`) for user-defined types, making code syntax more intuitive. In Cairo, this is achieved by implementing specific traits associated with each operator. However, it should be used judiciously to avoid confusion and maintainability issues.

For example, combining two `Potion` structs, which have `health` and `mana` fields, can be done using the `+` operator by implementing the `Add<Potion>` trait:

```cairo
struct Potion {
    health: felt252,
    mana: felt252,
}

impl PotionAdd of Add<Potion> {
    fn add(lhs: Potion, rhs: Potion) -> Potion {
        Potion { health: lhs.health + rhs.health, mana: lhs.mana + rhs.mana }
    }
}

#[executable]
fn main() {
    let health_potion: Potion = Potion { health: 100, mana: 0 };
    let mana_potion: Potion = Potion { health: 0, mana: 100 };
    let super_potion: Potion = health_potion + mana_potion;
    // Both potions were combined with the `+` operator.
    assert!(super_potion.health == 100);
    assert!(super_potion.mana == 100);
}
```

## Hashing

### When to Use Them?

Pedersen was the first hash function used on Starknet, often for computing storage variable addresses. However, Poseidon is now the recommended hash function as it is cheaper and faster when working with STARK proofs.

### Working with Hashes

The `Hash` trait is implemented for all types that can be converted to `felt252`. For custom structs, deriving `Hash` allows them to be hashed easily, provided all their fields are themselves hashable. Structs containing unhashable types like `Array<T>` or `Felt252Dict<T>` cannot derive `Hash`.

The `HashStateTrait` and `HashStateExTrait` define basic methods for managing hash states: initializing, updating with values, and finalizing the computation.

```cairo,noplayground
/// A trait for hash state accumulators.
trait HashStateTrait<S> {
    fn update(self: S, value: felt252) -> S;
    fn finalize(self: S) -> felt252;
}

/// Extension trait for hash state accumulators.
trait HashStateExTrait<S, T> {
    /// Updates the hash state with the given value.
    fn update_with(self: S, value: T) -> S;
}

/// A trait for values that can be hashed.
trait Hash<T, S, +HashStateTrait<S>> {
    /// Updates the hash state with the given value.
    fn update_state(state: S, value: T) -> S;
}
```

### Advanced Hashing: Hashing Arrays with Poseidon

To hash a `Span<felt252>` or a struct containing one, use the built-in function `poseidon_hash_span`. This is necessary for types like `Array<felt252>` which cannot derive `Hash` directly.

First, import the necessary traits and function:

```cairo,noplayground
use core::hash::{HashStateExTrait, HashStateTrait};
use core::poseidon::{PoseidonTrait, poseidon_hash_span};
```

Define the struct. Deriving `Hash` on this struct would fail due to the `Array<felt252>` field.

```cairo, noplayground
#[derive(Drop)]
struct StructForHashArray {
    first: felt252,
    second: felt252,
    third: Array<felt252>,
}
```

The following example demonstrates hashing this struct. A `HashState` is initialized and updated with the `felt252` fields. Then, `poseidon_hash_span` is used on the `Span` of the `Array<felt252>` to compute its hash, which is then used to update the main hash state. Finally, `finalize()` computes the overall hash.

```cairo
# use core::hash::{HashStateExTrait, HashStateTrait};
# use core::poseidon::{PoseidonTrait, poseidon_hash_span};
#
# #[derive(Drop)]
# struct StructForHashArray {
#     first: felt252,
#     second: felt252,
#     third: Array<felt252>,
# }
#
#[executable]
fn main() {
    let struct_to_hash = StructForHashArray { first: 0, second: 1, third: array![1, 2, 3, 4, 5] };

    let mut hash = PoseidonTrait::new().update(struct_to_hash.first).update(struct_to_hash.second);
    let hash_felt252 = hash.update(poseidon_hash_span(struct_to_hash.third.span())).finalize();
}
```

Function Inlining and Output

# Function Inlining and Output

## Function Inlining

Function inlining is an optimization technique where the body of a function is directly inserted into the code at the call site, rather than making a traditional function call. This can improve performance by eliminating the overhead associated with function calls, such as stack manipulation and jumps.

### How Inlining Works

The Cairo compiler handles inlining by default. When a function is inlined, its instructions are directly executed at the point of the call. This is evident in the generated Sierra and Casm code, where inlined functions do not involve a `call` instruction.

**Example:**

Consider a program with an inlined function and a non-inlined function:

```cairo
#[executable]
fn main() {
    inlined();
    not_inlined();
}

#[inline(always)]
fn inlined() -> felt252 {
    'inlined'
}

#[inline(never)]
fn not_inlined() -> felt252 {
    'not inlined'
}
```

The corresponding Sierra code for this example shows a `function_call` for `not_inlined` but not for `inlined`.

### Benefits and Drawbacks

- **Benefits:**

  - Reduces function call overhead.
  - Can enable further compiler optimizations by exposing the inlined code to the surrounding context.

- **Drawbacks:**
  - Can increase code size if the inlined function is large and used multiple times.
  - Manual application of the `#[inline(always)]` attribute is generally not recommended, as the compiler is effective at determining when inlining is beneficial. Use it only for fine-tuning.

## Printing

Cairo provides macros for printing data to the console, useful for program execution and debugging.

### Standard Data Types

Two macros are available for printing standard data types:

- `println!`: Prints output followed by a newline.
- `print!`: Prints output on the same line.

Both macros accept a `ByteArray` string as the first argument. This string can be a simple message or include placeholders for formatting values.

#### Placeholders

Placeholders within the string can be used in two ways:

- Empty curly brackets `{}`: These are replaced by the subsequent arguments in order.
- Curly brackets with variable names `{variable_name}`: These are replaced by the value of the specified variable.

These placeholder methods can be mixed.

**Example:**

```cairo
#[executable]
fn main() {
    let a = 10;
    let b = 20;
    let c = 30;

    println!("Hello world!");
    println!("{} {} {}", a, b, c); // Output: 10 20 30
    println!("{c} {a} {}", b); // Output: 30 10 20
}
```

Deref Coercion

# Deref Coercion

Deref coercion is a mechanism in Cairo that allows types implementing the `Deref` trait to be treated as instances of their target types. This is particularly useful for simplifying access to nested data structures and enabling method calls defined on the target type.

## Understanding Deref Coercion with an Example

Let's consider a generic wrapper type `Wrapper<T>` that wraps a value of type `T`. By implementing the `Deref` trait for `Wrapper<T>`, we can access the members of the wrapped type `T` directly through an instance of `Wrapper<T>`.

```cairo
#[derive(Drop, Copy)]
struct UserProfile {
    username: felt252,
    email: felt252,
    age: u16,
}

#[derive(Drop, Copy)]
struct Wrapper<T> {
    value: T,
}

impl DerefWrapper<T> of Deref<Wrapper<T>> {
    type Target = T;
    fn deref(self: Wrapper<T>) -> T {
        self.value
    }
}
```

This implementation of `Deref` for `Wrapper<T>` simply returns the wrapped `value`.

## Practical Application of Deref Coercion

When you have an instance of `Wrapper<UserProfile>`, deref coercion allows you to access fields like `username` and `age` directly, as if you were operating on a `UserProfile` instance.

```cairo
#[executable]
fn main() {
    let wrapped_profile = Wrapper {
        value: UserProfile { username: 'john_doe', email: 'john@example.com', age: 30 },
    };
    // Access fields directly via deref coercion
    println!("Username: {}", wrapped_profile.username);
    println!("Current age: {}", wrapped_profile.age);
}
```

## Restricting Deref Coercion to Mutable Variables

The `DerefMut` trait, similar to `Deref`, enables coercion but is specifically applicable to mutable variables. It's important to note that `DerefMut` does not inherently provide mutable access to the underlying data; it's about the mutability context of the variable itself.

```cairo, noplayground
//TAG: does_not_compile

use core::ops::DerefMut;

#[derive(Drop, Copy)]
struct UserProfile {
    username: felt252,
    email: felt252,
    age: u16,
}

#[derive(Drop, Copy)]
struct Wrapper<T> {
    value: T,
}

impl DerefMutWrapper<T, +Copy<T>> of DerefMut<Wrapper<T>> {
    type Target = T;
    fn deref_mut(ref self: Wrapper<T>) -> T {
        self.value
    }
}

fn error() {
    let wrapped_profile = Wrapper {
        value: UserProfile { username: 'john_doe', email: 'john@example.com', age: 30 },
    };
    // Uncommenting the next line will cause a compilation error
    println!("Username: {}", wrapped_profile.username);
}

#[executable]
fn main() {
    let mut wrapped_profile = Wrapper {
        value: UserProfile { username: 'john_doe', email: 'john@example.com', age: 30 },
    };

    println!("Username: {}", wrapped_profile.username);
    println!("Current age: {}", wrapped_profile.age);
}
```

Attempting to use `DerefMut` with an immutable variable will result in a compilation error, as the compiler cannot find the member `username` on the `Wrapper` type directly.

```plaintext
$ scarb build
   Compiling no_listing_09_deref_coercion_example v0.1.0 (listings/ch12-advanced-features/no_listing_09_deref_mut_example/Scarb.toml)
error: Type "no_listing_09_deref_coercion_example::Wrapper::<no_listing_09_deref_coercion_example::UserProfile>" has no member "username"
 --> listings/ch12-advanced-features/no_listing_09_deref_mut_example/src/lib.cairo:32:46
    println!("Username: {}", wrapped_profile.username);
                                             ^^^^^^^^

error: could not compile `no_listing_09_deref_coercion_example` due to previous error
```

To resolve this, the variable `wrapped_profile` must be declared as mutable.

```cairo, noplayground
//TAG: does_not_compile

use core::ops::DerefMut;

#[derive(Drop, Copy)]
struct UserProfile {
    username: felt252,
    email: felt252,
    age: u16,
}

#[derive(Drop, Copy)]
struct Wrapper<T> {
    value: T,
}

impl DerefMutWrapper<T, +Copy<T>> of DerefMut<Wrapper<T>> {
    type Target = T;
    fn deref_mut(ref self: Wrapper<T>) -> T {
        self.value
    }
}

fn error() {
    let wrapped_profile = Wrapper {
        value: UserProfile { username: 'john_doe', email: 'john@example.com', age: 30 },
    };
    // Uncommenting the next line will cause a compilation error
    println!("Username: {}", wrapped_profile.username);
}

#[executable]
fn main() {
    let mut wrapped_profile = Wrapper {
        value: UserProfile { username: 'john_doe', email: 'john@example.com', age: 30 },
    };

    println!("Username: {}", wrapped_profile.username);
    println!("Current age: {}", wrapped_profile.age);
}
```

## Calling Methods via Deref Coercion

Deref coercion extends beyond member access to method calls. If a type `A` dereferences to type `B`, and `B` has a method, you can call that method directly on an instance of `A`.

```cairo
struct MySource {
    pub data: u8,
}

struct MyTarget {
    pub data: u8,
}

#[generate_trait]
impl TargetImpl of TargetTrait {
    fn foo(self: MyTarget) -> u8 {
        self.data
    }
}

impl SourceDeref of Deref<MySource> {
    type Target = MyTarget;
    fn deref(self: MySource) -> MyTarget {
        MyTarget { data: self.data }
    }
}

#[executable]
fn main() {
    let source = MySource { data: 5 };
    // Thanks to the Deref impl, we can call foo directly on MySource
    let res = source.foo();
    assert!(res == 5);
}
```

In this example, `MySource` dereferences to `MyTarget`, which has a method `foo`. This allows `foo` to be called directly on `source`.

## Summary

The `Deref` and `DerefMut` traits facilitate deref coercion, enabling transparent conversion between types. This simplifies access to underlying data in nested or wrapped structures and allows calling methods defined on the target type. Deref coercion is particularly beneficial when working with generic types and abstractions, reducing boilerplate code.

Associated Types and Data Packing

# Associated Types and Data Packing

## Constraint Traits on Associated Items

Associated items are an experimental feature. To use them, add `experimental-features = ["associated_item_constraints"]` to your `Scarb.toml`.

You can constrain associated items of a trait based on a generic parameter's type using the `[AssociatedItem: ConstrainedValue]` syntax after a trait bound.

For example, to implement an `extend` method for collections that ensures the iterator's element type matches the collection's element type, you can use `[Iterator::Item: A]` as a constraint.

```cairo
trait Extend<T, A> {
    fn extend<I, +core::iter::Iterator<I>[Item: A], +Destruct<I>>(ref self: T, iterator: I);
}

impl ArrayExtend<T, +Drop<T>> of Extend<Array<T>, T> {
    fn extend<I, +core::iter::Iterator<I>[Item: T], +Destruct<I>>(ref self: Array<T>, iterator: I) {
        for item in iterator {
            self.append(item);
        }
    }
}
```

## `TypeEqual` Trait for Type Equality Constraints

The `TypeEqual` trait from `core::metaprogramming` allows constraints based on type equality.

### Excluding Specific Types

`TypeEqual` can be used with negative implementations to exclude specific types from a trait implementation.

```cairo
trait SafeDefault<T> {
    fn safe_default() -> T;
}

#[derive(Drop, Default)]
struct SensitiveData {
    secret: felt252,
}

// Implement SafeDefault for all types EXCEPT SensitiveData
impl SafeDefaultImpl<
    T, +Default<T>, -core::metaprogramming::TypeEqual<T, SensitiveData>,
> of SafeDefault<T> {
    fn safe_default() -> T {
        Default::default()
    }
}

#[executable]
fn main() {
    let _safe: u8 = SafeDefault::safe_default();
    let _unsafe: SensitiveData = Default::default(); // Allowed
    // This would cause a compile error:
    // let _dangerous: SensitiveData = SafeDefault::safe_default();
}
```

### Ensuring Matching Associated Types

`TypeEqual` is useful for ensuring two types have equal associated types, especially in generic functions.

```cairo
trait StateMachine {
    type State;
    fn transition(ref state: Self::State);
}

#[derive(Copy, Drop)]
struct StateCounter {
    counter: u8,
}

impl TA of StateMachine {
    type State = StateCounter;
    fn transition(ref state: StateCounter) {
        state.counter += 1;
    }
}

impl TB of StateMachine {
    type State = StateCounter;
    fn transition(ref state: StateCounter) {
        state.counter *= 2;
    }
}

fn combine<
    impl A: StateMachine,
    impl B: StateMachine,
    +core::metaprogramming::TypeEqual<A::State, B::State>,
>(
    ref self: A::State,
) {
    A::transition(ref self);
    B::transition(ref self);
}

#[executable]
fn main() {
    let mut initial = StateCounter { counter: 0 };
    combine::<TA, TB>(ref initial);
}
```

## Data Packing with Associated Types

Associated types can simplify function signatures compared to explicitly defining generic type parameters for return types.

Consider a `PackGeneric` trait that requires explicit generic parameters for the input and output types:

```cairo
fn foo<T, U, +PackGeneric<T, U>>(self: T, other: T) -> U {
    self.pack_generic(other)
}
```

A `Pack` trait using an associated type `Result` allows for a more concise function signature:

```cairo
trait Pack<T> {
    type Result;
    fn pack(self: T, other: T) -> Self::Result;
}

impl PackU32Impl of Pack<u32> {
    type Result = u64;

    fn pack(self: u32, other: u32) -> Self::Result {
        let shift: u64 = 0x100000000; // 2^32
        self.into() * shift + other.into()
    }
}

fn bar<T, impl PackImpl: Pack<T>>(self: T, b: T) -> PackImpl::Result {
    PackImpl::pack(self, b)
}
```

Both approaches achieve the same result:

```cairo
trait Pack<T> {
    type Result;
    fn pack(self: T, other: T) -> Self::Result;
}

impl PackU32Impl of Pack<u32> {
    type Result = u64;

    fn pack(self: u32, other: u32) -> Self::Result {
        let shift: u64 = 0x100000000; // 2^32
        self.into() * shift + other.into()
    }
}

fn bar<T, impl PackImpl: Pack<T>>(self: T, b: T) -> PackImpl::Result {
    PackImpl::pack(self, b)
}

trait PackGeneric<T, U> {
    fn pack_generic(self: T, other: T) -> U;
}

impl PackGenericU32 of PackGeneric<u32, u64> {
    fn pack_generic(self: u32, other: u32) -> u64 {
        let shift: u64 = 0x100000000; // 2^32
        self.into() * shift + other.into()
    }
}

fn foo<T, U, +PackGeneric<T, U>>(self: T, other: T) -> U {
    self.pack_generic(other)
}

#[executable]
fn main() {
    let a: u32 = 1;
    let b: u32 = 1;

    let x = foo(a, b);
    let y = bar(a, b);

    // result is 2^32 + 1
    println!("x: {}", x);
    println!("y: {}", y);
}
```

Modules and Project Organization

Project Setup with Scarb

# Project Setup with Scarb

## Scarb.toml Configuration

The `Scarb.toml` file configures your Scarb project. Key sections include:

- **`[package]`**: Defines the package name, version, and Cairo edition.
- **`[cairo]`**: Contains Cairo-specific configurations, like enabling gas.
- **`[dependencies]`**: Lists external packages (crates) your project depends on. These can be specified using Git URLs with optional `rev`, `branch`, or `tag`.
- **`[dev-dependencies]`**: Lists dependencies required only for development and testing (e.g., `snforge_std`, `assert_macros`).
- **`[[target.executable]]`**: Specifies executable targets, including the entry point function.
- **`[[target.starknet-contract]]`**: (Optional) Used for building Starknet smart contracts.
- **`[script]`**: (Optional) Defines custom scripts, often used for testing with `snforge`.

### Example Scarb.toml for a Cairo Program

```toml
[package]
name = "hello_world"
version = "0.1.0"
edition = "2024_07"

[cairo]
enable-gas = false

[dependencies]
cairo_execute = "2.12.0"

[[target.executable]]
name = "hello_world_main"
function = "hello_world::hello_world::main"
```

## Managing Dependencies

Scarb manages external packages (crates) through Git repositories.

### Adding Dependencies

- **Manual Addition**: Declare dependencies in the `[dependencies]` section of `Scarb.toml` with their Git URL. For specific versions, use `rev`, `branch`, or `tag`.
  `cairo
    [dependencies]
alexandria_math = { git = "https://github.com/keep-starknet-strange/alexandria.git" }
    `
- **`scarb add` command**: Use `scarb add <package_name>` to automatically update `Scarb.toml`. For development dependencies, use `scarb add --dev <package_name>`.

### Removing Dependencies

- Remove the corresponding line from `Scarb.toml` or use the `scarb rm <package_name>` command.

### Building with Dependencies

Run `scarb build` to fetch and compile all declared dependencies.

## Using the Glob Operator (`*`)

The glob operator (`*`) can be used in `use` statements to bring all public items from a path into the current scope. Use with caution as it can make it harder to track item origins.

```rust
use core::num::traits::*;
```

Core Concepts: Packages, Crates, and Modules

# Core Concepts: Packages, Crates, and Modules

As programs grow, organizing code into modules and files becomes crucial for clarity and maintainability. Larger projects can extract parts into separate crates, which act as external dependencies. Cairo's module system facilitates this organization and controls code scope.

## Key Components of the Module System

- **Packages:** A Scarb feature for building, testing, and sharing crates.
- **Crates:** A compilation unit consisting of a tree of modules. The crate root is typically defined in `lib.cairo`.
- **Modules and `use`:** Keywords that manage item organization and scope.
- **Paths:** Names used to refer to items like structs, functions, or modules.

## Packages and Crates

### What is a Crate?

A crate is a subset of a package compiled by Cairo. It includes the package's source code, starting from the crate root, and crate-level compiler settings (e.g., `edition` in `Scarb.toml`). Crates can contain modules defined in various files.

### What is the Crate Root?

The crate root is the `lib.cairo` file, which serves as the entry point for the Cairo compiler and forms the root module of the crate. Modules are further explained in the "Defining Modules to Control Scope" chapter.

### What is a Package?

A Cairo package is a directory containing:

- A `Scarb.toml` manifest file with a `[package]` section.
- Associated source code.

A package can contain other packages, each with its own `Scarb.toml`.

### Creating a Package with Scarb

The `scarb new` command creates a new Cairo package:

```bash
scarb new my_package
```

This generates a directory structure like:

```
my_package/
├── Scarb.toml
└── src/
    └── lib.cairo
```

- `src/`: Contains all Cairo source files.
- `lib.cairo`: The default crate root module and package entry point.
- `Scarb.toml`: The package manifest file for metadata and configuration.

Example `Scarb.toml`:

```toml
[package]
name = "my_package"
version = "0.1.0"
edition = "2024_07"

[executable]

[cairo]
enable-gas = false

[dependencies]
cairo_execute = "2.12.0"
```

Additional `.cairo` files can be added to `src/` or its subdirectories to organize code into multiple files.

Module Paths and Navigation

# Module Paths and Navigation

When organizing code, Cairo follows specific rules for module declaration and navigation.

## Declaring Modules and Submodules

- **Crate Root**: The compiler starts by looking in the crate root file (`src/lib.cairo`).
- **Declaring Modules**: In the crate root, modules are declared using `mod <name>;`. The compiler searches for the module's code in:
  - Inline, within curly brackets:
    ```cairo,noplayground
    // crate root file (src/lib.cairo)
    mod garden {
        // code defining the garden module goes here
    }
    ```
  - In the file `src/<name>.cairo`.
- **Declaring Submodules**: In files other than the crate root (e.g., `src/garden.cairo`), submodules are declared similarly (e.g., `mod vegetables;`). The compiler searches within the parent module's directory:
  - Inline, within curly brackets:
    ```cairo,noplayground
    // src/garden.cairo file
    mod vegetables {
        // code defining the vegetables submodule goes here
    }
    ```
  - In the file `src/<parent_module>/<submodule_name>.cairo`.

## Paths for Referring to Items

To reference code within modules, Cairo uses paths, similar to filesystem navigation. Paths consist of identifiers separated by double colons (`::`).

There are two forms of paths:

- **Absolute Path**: Starts from the crate root, beginning with the crate name.
- **Relative Path**: Starts from the current module.

### Example: Absolute and Relative Paths

Consider a crate with nested modules `front_of_house` and `hosting`, containing the function `add_to_waitlist`. To call this function from `eat_at_restaurant` within the same crate:

<span class="filename">Filename: src/lib.cairo</span>

```cairo,noplayground
mod front_of_house {
    mod hosting {
        fn add_to_waitlist() {}
        fn seat_at_table() {}
    }

    mod serving {
        fn take_order() {}
        fn serve_order() {}
        fn take_payment() {}
    }
}

pub fn eat_at_restaurant() {
    // Absolute path
    crate::front_of_house::hosting::add_to_waitlist();

    // Relative path
    front_of_house::hosting::add_to_waitlist();
}
```

- The **absolute path** starts with `crate::`, referencing the crate root.
- The **relative path** starts from the current module (where `eat_at_restaurant` is defined) and directly accesses `front_of_house`.

## Starting Relative Paths with `super`

Relative paths can also start from the parent module using the `super` keyword, analogous to `..` in filesystems. This is useful for referencing items in a parent module, especially when the module structure might change.

### Example: Using `super`

In the following example, `fix_incorrect_order` within the `back_of_house` module calls `deliver_order` from its parent module:

<span class="filename">Filename: src/lib.cairo</span>

```cairo,noplayground
fn deliver_order() {}

mod back_of_house {
    fn fix_incorrect_order() {
        cook_order();
        super::deliver_order();
    }

    fn cook_order() {}
}
```

Here, `super::deliver_order()` references the `deliver_order` function defined in the module containing `back_of_house`.

Visibility and Privacy Rules

# Visibility and Privacy Rules

Modules allow us to organize code within a crate and control the privacy of items. By default, all items within a module are private, meaning they can only be accessed by the current module and its descendants.

## Modules and Privacy

- **Default Privacy**: Code within a module is private by default. This means it's only accessible within that module and its submodules.
- **Public Modules**: To make a module public, declare it using `pub mod`. This allows parent modules to refer to it.
- **Public Items**: To make items (like functions, structs, etc.) within a module public, use the `pub` keyword before their declarations. Making a module public does not automatically make its contents public.
- **`pub(crate)`**: This keyword restricts visibility to only the current crate.

For example, consider a crate structure:

```text
backyard/
├── Scarb.toml
└── src
    ├── garden
    │   └── vegetables.cairo
    ├── garden.cairo
    └── lib.cairo
```

The crate root `src/lib.cairo` might contain:

```cairo
pub mod garden;
use crate::garden::vegetables::Asparagus;

#[executable]
fn main() {
    let plant = Asparagus {};
    println!("I'm growing {:?}!", plant);
}
```

The `garden` module, defined in `src/garden.cairo`, would be declared as:

```cairo,noplayground
pub mod vegetables;
```

And `src/garden/vegetables.cairo` would contain:

```cairo,noplayground
#[derive(Drop, Debug)]
pub struct Asparagus {}
```

The `use crate::garden::vegetables::Asparagus;` line in `lib.cairo` brings the `Asparagus` type into scope.

## Exposing Paths with the `pub` Keyword

When items are private, they cannot be accessed from outside their defining module, even if the module itself is public. To allow access, both the module (if necessary for external access) and the specific items within it must be declared `pub`.

Consider a scenario where `eat_at_restaurant` needs to call `add_to_waitlist` from a nested module:

```cairo,noplayground
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }
}

pub fn eat_at_restaurant() {
    // Absolute path
    crate::front_of_house::hosting::add_to_waitlist(); // Compiles

    // Relative path
    front_of_house::hosting::add_to_waitlist(); // Compiles
}
```

In this example, `mod hosting` is declared `pub` to be accessible from `front_of_house`, and `add_to_waitlist` is declared `pub` to be callable from `eat_at_restaurant`.

## `use` Keyword for Shortcuts

The `use` keyword creates shortcuts to items, reducing the need to repeat long paths. For instance, `use crate::garden::vegetables::Asparagus;` allows you to refer to `Asparagus` directly within its scope.

## Example: Private Struct Fields

While a struct can be public, its fields remain private by default.

```cairo
pub mod rectangle {
    #[derive(Copy, Drop)]
    pub struct Rectangle {
        width: u64, // Private field
        height: u64 // Private field
    }
}

fn main() {
    // This would not compile because width and height are private:
    // let r = rectangle::Rectangle { width: 10, height: 20 };
    // println!("{}", r.width);
}
```

To make the fields accessible, they would also need to be marked with `pub`.

Using the `use` Keyword for Imports and Re-exports

# Using the `use` Keyword for Imports and Re-exports

The `use` keyword allows you to bring paths into the current scope, creating shorter and less repetitive ways to refer to items. This is similar to creating a symbolic link. The `use` statement is scoped to the block in which it appears.

## Bringing Paths into Scope with the `use` Keyword

To simplify calls to functions that are deep within modules, you can bring their module into scope. For example, `use crate::front_of_house::hosting;` allows you to call `hosting::add_to_waitlist()` instead of the full path.

```cairo
// section "Defining Modules to Control Scope"

mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }
}
use crate::front_of_house::hosting;

pub fn eat_at_restaurant() {
    hosting::add_to_waitlist(); // ✅ Shorter path
}
```

A `use` statement only applies within its scope. If a function using a `use` statement is moved to a different scope (e.g., a child module), the shortcut will no longer apply, leading to a compiler error.

## Creating Idiomatic `use` Paths

It is idiomatic in Cairo (following Rust conventions) to bring a function's parent module into scope with `use` and then call the function using the module name (e.g., `hosting::add_to_waitlist()`). This makes it clear that the function is not locally defined while reducing path repetition.

Conversely, when bringing types like structs, enums, or traits into scope, it's idiomatic to specify the full path to the item itself.

```cairo
use core::num::traits::BitSize;

#[executable]
fn main() {
    let u8_size: usize = BitSize::<u8>::bits();
    println!("A u8 variable has {} bits", u8_size)
}
```

### Providing New Names with the `as` Keyword

If you need to bring two items with the same name into the same scope, or if you simply want to use a shorter name, you can use the `as` keyword to create an alias.

```cairo
use core::array::ArrayTrait as Arr;

#[executable]
fn main() {
    let mut arr = Arr::new(); // ArrayTrait was renamed to Arr
    arr.append(1);
}
```

### Importing Multiple Items from the Same Module

To import several items from the same module cleanly, you can use curly braces `{}` to list them.

```cairo
// Assuming we have a module called `shapes` with the structures `Square`, `Circle`, and `Triangle`.
mod shapes {
    #[derive(Drop)]
    pub struct Square {
        pub side: u32,
    }

    #[derive(Drop)]
    pub struct Circle {
        pub radius: u32,
    }

    #[derive(Drop)]
    pub struct Triangle {
        pub base: u32,
        pub height: u32,
    }
}

// We can import the structures `Square`, `Circle`, and `Triangle` from the `shapes` module like
// this:
use shapes::{Circle, Square, Triangle};

// Now we can directly use `Square`, `Circle`, and `Triangle` in our code.
#[executable]
fn main() {
    let sq = Square { side: 5 };
    let cr = Circle { radius: 3 };
    let tr = Triangle { base: 5, height: 2 };
    // ...
}
```

## Re-exporting Names in Module Files

Re-exporting makes an item that is brought into scope with `use` also available for others to bring into their scope, by using `pub use`. This means the item is available in the current scope and can be re-exported from that scope.

```cairo
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }
}

pub use crate::front_of_house::hosting;

fn eat_at_restaurant() {
    hosting::add_to_waitlist();
}
```

Structuring Modules in Separate Files

# Structuring Modules in Separate Files

## Organizing Modules

Modules in Cairo are used to group related functionality, making code easier to manage and navigate. You define a module using the `mod` keyword, followed by the module name and a block of code enclosed in curly braces `{}`. Inside modules, you can define other modules, functions, structs, enums, and more.

The `src/lib.cairo` (or `src/main.cairo` for binaries) file serves as the crate root, forming a module named after the crate itself at the root of the module tree.

### Example: Nested Modules

Consider organizing a restaurant application's logic:

<span class="filename">Filename: src/lib.cairo</span>

```cairo,noplayground
mod front_of_house {
    mod hosting {
        fn add_to_waitlist() {}
        fn seat_at_table() {}
    }

    mod serving {
        fn take_order() {}
        fn serve_order() {}
        fn take_payment() {}
    }
}
```

<span class="caption">Listing 7-1: A `front_of_house` module containing other modules that then contain functions</span>

This structure creates a module tree where `hosting` and `serving` are children of `front_of_house`, and siblings to each other.

### Module Tree Representation

The module tree visually represents the relationships between modules:

```text
restaurant
 └── front_of_house
     ├── hosting
     │   ├── add_to_waitlist
     │   └── seat_at_table
     └── serving
         ├── take_order
         ├── serve_order
         └── take_payment
```

<span class="caption">Listing 7-2: The module tree for the code in Listing 7-1</span>

This organization is analogous to a file system's directory structure, allowing for logical grouping and easy navigation of code.

## Separating Modules into Files

As modules grow, it's beneficial to move their definitions into separate files to maintain code clarity and organization.

### Extracting a Module to a New File

1.  **Declare the module in the parent file:** In the parent file (e.g., `src/lib.cairo`), replace the module's body with a `mod module_name;` declaration.
2.  **Create the module's file:** Create a new file named `src/module_name.cairo` and place the original module's content within it.

**Example:** Moving `front_of_house` from `src/lib.cairo`:

<span class="filename">Filename: src/lib.cairo</span>

```cairo,noplayground
mod front_of_house;
use crate::front_of_house::hosting;

fn eat_at_restaurant() {
    hosting::add_to_waitlist();
}
```

<span class="caption">Listing 7-14: Declaring the `front_of_house` module whose body will be in `src/front_of_house.cairo`</span>

<span class="filename">Filename: src/front_of_house.cairo</span>

```cairo,noplayground
pub mod hosting {
    pub fn add_to_waitlist() {}
}
```

<span class="caption">Listing 7-15: Definitions inside the `front_of_house` module in `src/front_of_house.cairo`</span>

### Extracting a Child Module

To extract a child module (e.g., `hosting` within `front_of_house`):

1.  **Update the parent module file:** In `src/front_of_house.cairo`, replace the child module's body with `pub mod child_module_name;`.
2.  **Create a directory for the parent:** Create a directory named after the parent module (e.g., `src/front_of_house/`).
3.  **Create the child module file:** Inside this directory, create a file named after the child module (e.g., `src/front_of_house/hosting.cairo`) and place its definitions there.

**Example:** Moving `hosting` into its own file:

<span class="filename">Filename: src/front_of_house.cairo</span>

```cairo,noplayground
pub mod hosting;
```

<span class="filename">Filename: src/front_of_house/hosting.cairo</span>

```cairo,noplayground
pub fn add_to_waitlist() {}
```

The compiler uses the file and directory structure to determine the module tree. The `mod` declaration acts as a pointer to where the module's code resides, not as an include directive. This allows for a clean separation of concerns, with the module tree structure remaining consistent regardless of whether module code is in a single file or spread across multiple files.

Advanced Topics: Traits and Component Integration

# Advanced Topics: Traits and Component Integration

## Module Organization and Trait Implementation

When organizing code into modules, if a trait's implementation resides in a different module than the trait itself, explicit imports are necessary.

```cairo,noplayground
// Here T is an alias type which will be provided during implementation
pub trait ShapeGeometry<T> {
    fn boundary(self: T) -> u64;
    fn area(self: T) -> u64;
}

mod rectangle {
    // Importing ShapeGeometry is required to implement this trait for Rectangle
    use super::ShapeGeometry;

    #[derive(Copy, Drop)]
    pub struct Rectangle {
        pub height: u64,
        pub width: u64,
    }

    // Implementation RectangleGeometry passes in <Rectangle>
    // to implement the trait for that type
    impl RectangleGeometry of ShapeGeometry<Rectangle> {
        fn boundary(self: Rectangle) -> u64 {
            2 * (self.height + self.width)
        }
        fn area(self: Rectangle) -> u64 {
            self.height * self.width
        }
    }
}

mod circle {
    // Importing ShapeGeometry is required to implement this trait for Circle
    use super::ShapeGeometry;

    #[derive(Copy, Drop)]
    pub struct Circle {
        pub radius: u64,
    }

    // Implementation CircleGeometry passes in <Circle>
    // to implement the imported trait for that type
    impl CircleGeometry of ShapeGeometry<Circle> {
        fn boundary(self: Circle) -> u64 {
            (2 * 314 * self.radius) / 100
        }
        fn area(self: Circle) -> u64 {
            (314 * self.radius * self.radius) / 100
        }
    }
}
use circle::Circle;
use rectangle::Rectangle;

#[executable]
fn main() {
    let rect = Rectangle { height: 5, width: 7 };
    println!("Rectangle area: {}", ShapeGeometry::area(rect)); //35
    println!("Rectangle boundary: {}", ShapeGeometry::boundary(rect)); //24

    let circ = Circle { radius: 5 };
    println!("Circle area: {}", ShapeGeometry::area(circ)); //78
    println!("Circle boundary: {}", ShapeGeometry::boundary(circ)); //31
}
```

## Contract Integration

Contracts integrate components using **impl aliases** to instantiate a component's generic impl with the contract's concrete state.

```cairo,noplayground
    #[abi(embed_v0)]
    impl OwnableImpl = OwnableComponent::OwnableImpl<ContractState>;

    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;
```

This mechanism embeds the component's logic into the contract's ABI. The compiler automatically generates a `HasComponent` trait implementation, bridging the contract's and component's states.

## Specifying Component Dependencies

Components can specify dependencies on other components using trait bounds. This restricts an `impl` block to be available only for contracts that already contain the required component.

For example, a dependency on an `Ownable` component is specified with `impl Owner: ownable_component::HasComponent<TContractState>`, ensuring the `TContractState` has access to the `Ownable` component.

While this mechanism can be verbose, it leverages Cairo's trait system to manage component interactions. When a component is embedded in a contract, other components within the same contract can access it.

Macros, Attributes, and Compiler Internals

Cairo Attributes

# Cairo Attributes

This section details various attributes available in Cairo, used to modify the behavior or provide hints to the compiler for items like functions, structs, and enums.

## Core Attributes

- **`#[derive(...)]`**: Automatically implements a specified trait for a type.
- **`#[inline]`**: A hint to the compiler to perform an inline expansion of the annotated function.
  - **`#[inline(always)]`**: A stronger hint to systematically inline the function.
  - **`#[inline(never)]`**: A hint to never inline the function.
    Note: These attributes are hints and may be ignored by the compiler. Inlining can reduce execution steps by avoiding function call overhead but may increase code size. It is particularly beneficial for small, frequently called functions.
- **`#[must_use]`**: Indicates that the return value of a function or a specific returned type must be used by the caller.
- **`#[generate_trait]`**: Instructs the compiler to automatically generate a trait definition for the associated implementation block. This is useful for reducing boilerplate, especially for private implementation blocks, and can be used in conjunction with `#[abi(per_item)]`.
- **`#[available_gas(...)]`**: Sets the maximum amount of gas allowed for the execution of the annotated function.
- **`#[panic_with('...', wrapper_name)]`**: Creates a wrapper for the annotated function. This wrapper will cause a panic with the specified error data if the original function returns `None` or `Err`.
- **`#[test]`**: Marks a function as a test function, intended to be run by the testing framework.
- **`#[cfg(...)]`**: A configuration attribute used for conditional compilation, commonly employed to include test modules (e.g., `#[cfg(test)]`).
- **`#[should_panic]`**: Specifies that a test function is expected to panic. The test will only pass if the annotated function indeed panics.

## Contract ABI Attributes

- **`#[abi(embed_v0)]`**: Used within an `impl` block to define that the functions within this block should be exposed as contract entrypoints, implementing a trait.
- **`#[abi(per_item)]`**: Allows for the individual definition of the entrypoint type for functions within an `impl` block. This attribute is often used with `#[generate_trait]`. When `#[abi(per_item)]` is used, public functions must be annotated with `#[external(v0)]` to be exposed; otherwise, they are treated as private.

  ```cairo
  #[starknet::contract]
  mod ContractExample {
      #[storage]
      struct Storage {}

      #[abi(per_item)]
      #[generate_trait]
      impl SomeImpl of SomeTrait {
          #[constructor]
          // this is a constructor function
          fn constructor(ref self: ContractState) {}

          #[external(v0)]
          // this is a public function
          fn external_function(ref self: ContractState, arg1: felt252) {}

          #[l1_handler]
          // this is a l1_handler function
          fn handle_message(ref self: ContractState, from_address: felt252, arg: felt252) {}

          // this is an internal function
          fn internal_function(self: @ContractState) {}
      }
  }
  ```

- **`#[external(v0)]`**: Used to explicitly define a function as external when the `#[abi(per_item)]` attribute is applied to the implementation block.

## Event Attributes

- **`#[flat]`**: Applied to an enum variant of the `Event` enum. It signifies that the variant should not be nested during serialization and its name should be ignored, which is useful for composability with Starknet components.
- **`#[key]`**: Designates an `Event` enum field as indexed. This allows for more efficient querying and filtering of events based on this field.

Cairo Macros

# Cairo Macros

M মনোMacros in Cairo are a powerful metaprogramming feature that allows you to write code which generates other code. This is distinct from functions, which are executed at runtime. Macros are expanded by the compiler before the code is interpreted, enabling capabilities like implementing traits at compile time or accepting a variable number of arguments.

## The Difference Between Macros and Functions

While both macros and functions help reduce code duplication, macros offer additional flexibility:

- **Variable Arguments**: Macros can accept any number of arguments, unlike functions which require a fixed signature.
- **Compile-Time Execution**: Macros are expanded during compilation, allowing them to generate code that affects the program's structure, such as implementing traits.

However, macro definitions are generally more complex than function definitions due to the indirection involved in writing code that writes code. Additionally, macros must be defined or brought into scope _before_ they are called.

## Declarative Inline Macros for General Metaprogramming

Declarative macros, often referred to as plain "macros," allow you to write code that resembles a `match` expression. They compare patterns against the structure of the source code passed to the macro and replace it with associated code during compilation.

### Defining and Using Declarative Macros

Macros are defined using the `macro` keyword. The syntax for patterns in macro definitions differs from value matching, as it operates on Cairo source code structure.

A common example is an array-building macro:

```cairo
macro make_array {
    ($($x:expr), *) => {
        {
            let mut arr = $defsite::ArrayTrait::new();
            $(arr.append($x);)*
            arr
        }
    };
}
#
# #[cfg(test)]
# #[test]
# fn test_make_array() {
#     let a = make_array![1, 2, 3];
#     let expected = array![1, 2, 3];
#     assert_eq!(a, expected);
# }
#
# mod hygiene_demo {
#     // A helper available at the macro definition site
#     fn def_bonus() -> u8 {
#         10
#     }
#
#     // Adds the defsite bonus, regardless of what exists at the callsite
#     pub macro add_defsite_bonus {
#         ($x: expr) => { $x + $defsite::def_bonus() };
#     }
#
#     // Adds the callsite bonus, resolved where the macro is invoked
#     pub macro add_callsite_bonus {
#         ($x: expr) => { $x + $callsite::bonus() };
#     }
#
#     // Exposes a variable to the callsite using `expose!`.
#     pub macro apply_and_expose_total {
#         ($base: expr) => {
#             let total = $base + 1;
#             expose!(let exposed_total = total;);
#         };
#     }
#
#     // A helper macro that reads a callsite-exposed variable
#     pub macro read_exposed_total {
#         () => { $callsite::exposed_total };
#     }
#
#     // Wraps apply_and_expose_total and then uses another inline macro
#     // that accesses the exposed variable via `$callsite::...`.
#     pub macro wrapper_uses_exposed {
#         ($x: expr) => {
#             {
#                 $defsite::apply_and_expose_total!($x);
#                 $defsite::read_exposed_total!()
#             }
#         };
#     }
# }
#
# use hygiene_demo::{
#     add_callsite_bonus, add_defsite_bonus, apply_and_expose_total, wrapper_uses_exposed,
# };
# #[cfg(test)]
# #[test]
# fn test_hygiene_e2e() {
#
#     // Callsite defines its own `bonus` — used only by callsite-resolving macro
#     let bonus = | | -> u8 {
#         20
#     };
#     let price: u8 = 5;
#     assert_eq!(add_defsite_bonus!(price), 15); // uses defsite::def_bonus() = 10
#     assert_eq!(add_callsite_bonus!(price), 25); // uses callsite::bonus() = 20
#
#     // Call in statement position; it exposes `exposed_total` at the callsite
#     apply_and_expose_total!(3);
#     assert_eq!(exposed_total, 4);
#
#     // A macro invoked by another macro can access exposed values via `$callsite::...`
#     let w = wrapper_uses_exposed!(7);
#     assert_eq!(w, 8);
# }
#
#
```

When calling `make_array![1, 2, 3]`, the pattern `$($x:expr), *` matches `1`, `2`, and `3`. The expansion `$(arr.append($x);)*` then generates `arr.append(1); arr.append(2); arr.append(3);`.

### Hygiene, `$defsite`/`$callsite`, and `expose!`

Cairo's inline macros are hygienic, meaning names introduced within the macro don't leak into the call site unless explicitly exposed. Name resolution can target either the macro definition site (`$defsite::`) or the call site (`$callsite::`).

Macros are expected to expand to a single expression. If a macro defines multiple statements, they should be wrapped in a `{}` block.

An end-to-end example demonstrating these concepts:

```cairo
# macro make_array {
#     ($($x:expr), *) => {
#         {
#             let mut arr = $defsite::ArrayTrait::new();
#             $(arr.append($x);)*
#             arr
#         }
#     };
# }
#
# #[cfg(test)]
# #[test]
# fn test_make_array() {
#     let a = make_array![1, 2, 3];
#     let expected = array![1, 2, 3];
#     assert_eq!(a, expected);
# }
#
mod hygiene_demo {
    // A helper available at the macro definition site
    fn def_bonus() -> u8 {
        10
    }

    // Adds the defsite bonus, regardless of what exists at the callsite
    pub macro add_defsite_bonus {
        ($x: expr) => { $x + $defsite::def_bonus() };
    }

    // Adds the callsite bonus, resolved where the macro is invoked
    pub macro add_callsite_bonus {
        ($x: expr) => { $x + $callsite::bonus() };
    }

    // Exposes a variable to the callsite using `expose!`.
    pub macro apply_and_expose_total {
        ($base: expr) => {
            let total = $base + 1;
            expose!(let exposed_total = total;);
        };
    }

    // A helper macro that reads a callsite-exposed variable
    pub macro read_exposed_total {
        () => { $callsite::exposed_total };
    }

    // Wraps apply_and_expose_total and then uses another inline macro
    // that accesses the exposed variable via `$callsite::...`.
    pub macro wrapper_uses_exposed {
        ($x: expr) => {
            {
                $defsite::apply_and_expose_total!($x);
                $defsite::read_exposed_total!()
            }
        };
    }
}
#
# use hygiene_demo::{
#     add_callsite_bonus, add_defsite_bonus, apply_and_expose_total, wrapper_uses_exposed,
# };
# #[cfg(test)]
# #[test]
# fn test_hygiene_e2e() {
#
#     // Callsite defines its own `bonus` — used only by callsite-resolving macro
#     let bonus = | | -> u8 {
#         20
#     };
#     let price: u8 = 5;
#     assert_eq!(add_defsite_bonus!(price), 15); // uses defsite::def_bonus() = 10
#     assert_eq!(add_callsite_bonus!(price), 25); // uses callsite::bonus() = 20
#
#     // Call in statement position; it exposes `exposed_total` at the callsite
#     apply_and_expose_total!(3);
#     assert_eq!(exposed_total, 4);
#
#     // A macro invoked by another macro can access exposed values via `$callsite::...`
#     let w = wrapper_uses_exposed!(7);
#     assert_eq!(w, 8);
# }
#
#
```

### Enabling Inline Macros

To use user-defined inline macros, enable the experimental feature in your `Scarb.toml`:

```toml
# [package]
# name = "listing_inline_macros"
# version = "0.1.0"
# edition = "2024_07"
#
experimental-features = ["user_defined_inline_macros"]
#
# [cairo]
#
# [dependencies]
# cairo_execute = "2.12.0"
#
# [dev-dependencies]
# snforge_std = "0.48.0"
# assert_macros = "2.12.0"
#
# [scripts]
# test = "snforge test"
#
# [tool.scarb]
# allow-prebuilt-plugins = ["snforge_std"]
```

## Procedural Macros

Procedural macros are Rust functions that transform Cairo code. They operate on `TokenStream` and return `ProcMacroResult`. They are defined using attributes like `#[inline_macro]`, `#[attribute_macro]`, and `#[derive_macro]`.

To use procedural macros, you need a Rust toolchain and a project structure including `Cargo.toml`, `Scarb.toml`, and `src/lib.rs`. The `Cargo.toml` specifies Rust dependencies and `crate-type = ["cdylib"]`, while `Scarb.toml` defines the package as a `[cairo-plugin]`.

### Expression Macros

Expression macros transform Cairo expressions. An example is a compile-time power function (`pow!`) implemented using Rust crates like `cairo-lang-macro` and `bigdecimal`.

### Derive Macros

Derive macros automate trait implementations for types. For instance, a `#[derive(HelloMacro)]` can automatically implement a `Hello` trait for a struct, generating a `hello()` function.

### Attribute Macros

Attribute macros are versatile and can be applied to various code items. They take an additional `attr` argument for attribute arguments, enabling actions like renaming structs or modifying function signatures.

## Common Macros

Several built-in macros are available for common tasks:

| Macro Name               | Description                                            |
| ------------------------ | ------------------------------------------------------ |
| `assert!`                | Evaluates a Boolean and panics if `false`.             |
| `assert_eq!`             | Evaluates an equality and panics if not equal.         |
| `assert_ne!`             | Evaluates an equality and panics if equal.             |
| `format!`                | Formats a string and returns a `ByteArray`.            |
| `write!`                 | Writes formatted strings to a formatter.               |
| `writeln!`               | Writes formatted strings to a formatter on a new line. |
| `get_dep_component!`     | Retrieves component state from a snapshot.             |
| `get_dep_component_mut!` | Retrieves mutable component state from a reference.    |
| `component!`             | Embeds a component inside a Starknet contract.         |

Comments are also supported using `//` for line comments.

Compiler Internals and Optimizations

# Inlining in Cairo

Inlining is a common code optimization technique that involves replacing a function call at the call site with the actual code of the called function. This eliminates the overhead associated with function calls, potentially improving performance by reducing the number of instructions executed, though it may increase the total program size. Considerations for inlining include function size, parameters, call frequency, and impact on compiled code size.

## The `inline` Attribute

In Cairo, the `#[inline]` attribute suggests whether the Sierra code of an attributed function should be directly injected into the caller's context instead of using a `function_call` libfunc. This feature is experimental, and its syntax and capabilities may evolve. Item-producing macros (structs, enums, functions, etc.) are not yet supported; procedural macros are preferred for attributes, derives, and crate-wide transformations.

> Inlining is often a tradeoff between the number of steps and code length. Use the `inline` attribute cautiously where it is appropriate.

## Inlining Decision Process

For functions without explicit inline directives, the Cairo compiler uses a heuristic approach. The decision to inline is based on the function's complexity, primarily relying on the `DEFAULT_INLINE_SMALL_FUNCTIONS_THRESHOLD`. The compiler estimates a function's "weight" using `ApproxCasmInlineWeight` to gauge the complexity of the generated Cairo Assembly (CASM) statements. Functions with a weight below the threshold are typically inlined.

The compiler also considers the raw statement count; functions with fewer statements than the threshold are usually inlined to optimize small, frequently called functions. Very simple functions (e.g., those that only call another function or return a constant) are always inlined. Conversely, functions with complex control flow (like `Match`) or those ending with a `Panic` are generally not inlined.

## Inlining Example

Consider the following program demonstrating inlining:

```cairo
#[executable]
fn main() -> felt252 {
    inlined() + not_inlined()
}

#[inline(always)]
fn inlined() -> felt252 {
    1
}

#[inline(never)]
fn not_inlined() -> felt252 {
    2
}
```

<span class="caption">Listing 12-5: A small Cairo program that adds the return value of 2 functions, with one of them being inlined</span>

In this example, the `inlined` function, annotated with `#[inline(always)]`, has its code directly injected into `main`. However, because its return value is not used, the compiler optimizes `main` by skipping the `inlined` function's code altogether, reducing code length and execution steps.

The `not_inlined` function, annotated with `#[inline(never)]`, is called normally using the `function_call` libfunc. The Sierra code execution for `main` would involve calling `not_inlined`, storing its result, and then dropping it as it's unused. Finally, a unit type `()` is returned as `main` doesn't explicitly return a value.

## Summary

Inlining is a valuable compiler optimization that can eliminate the overhead of function calls by injecting Sierra code directly into the caller's context. When used effectively, it can reduce the number of steps and potentially the code length, as demonstrated in the example.

Testing and Debugging

Introduction to Cairo Testing and Debugging

# Introduction to Cairo Testing and Debugging

## Executing the Program

To test a Cairo program, you can use the `scarb execute` command. This command runs the program and displays its output.

**Example:** Executing a primality test program with the input `17`.

```bash
scarb execute -p prime_prover --print-program-output --arguments 17
```

- `-p prime_prover`: Specifies the package name.
- `--print-program-output`: Displays the program's result.
- `--arguments 17`: Passes `17` as input to the program.

The output indicates success (0 for no panic) and the program's result (1 for true, meaning 17 is prime).

```bash
# Example output for 17 (prime)
$ scarb execute -p prime_prover --print-program-output --arguments 17
   Compiling prime_prover v0.1.0 (listings/ch01-getting-started/prime_prover/Scarb.toml)
    Finished `dev` profile target(s) in 1 second
   Executing prime_prover
Program output:
1
```

Try with other numbers:

```bash
$ scarb execute -p prime_prover --print-program-output --arguments 4
[0, 0]  # 4 is not prime

$ scarb execute -p prime_prover --print-program-output --arguments 23
[0, 1]  # 23 is prime
```

Execution artifacts, such as `air_public_input.json`, `air_private_input.json`, `trace.bin`, and `memory.bin`, are generated in the `./target/execute/prime_prover/execution1/` directory.

## Generating a Zero-Knowledge Proof

Cairo 2.10 integrates the Stwo prover via Scarb, enabling direct generation of zero-knowledge proofs.

To generate a proof for a specific execution (e.g., `execution1`), use the `scarb prove` command:

```bash
$ scarb prove --execution-id 1
     Proving prime_prover
warn: soundness of proof is not yet guaranteed by Stwo, use at your own risk
Saving proof to: target/execute/prime_prover/execution1/proof/proof.json
```

This command generates a proof that the primality check was computed correctly without revealing the input.

Understanding and Resolving Cairo Errors

# Understanding and Resolving Cairo Errors

This section details common error messages encountered in Cairo development and provides guidance on how to resolve them.

## Common Cairo Errors

### `Variable not dropped.`

This error occurs when a variable of a type that does not implement the `Drop` trait goes out of scope without being explicitly destroyed. Ensure that variables requiring destruction implement either the `Drop` trait or the `Destruct` trait. Refer to the "Ownership" section for more details.

### `Variable was previously moved.`

This message indicates that you are attempting to use a variable whose ownership has already been transferred to another function. For types that do not implement the `Copy` trait, they are passed by value, transferring ownership. Such variables cannot be reused in the original context after ownership transfer. Consider using the `clone` method in these scenarios.

### `error: Trait has no implementation in context: core::fmt::Display::<package_name::struct_name>`

This error arises when trying to print an instance of a custom data type using `{}` placeholders with `print!` or `println!`. To fix this, either manually implement the `Display` trait for your type or derive the `Debug` trait (using `#[derive(Debug)]`) and use `:?` placeholders for printing.

### `Got an exception while executing a hint: Hint Error: Failed to deserialize param #x.`

This error signifies that an entrypoint was called without the expected arguments. Verify that the arguments provided to the entrypoint are correct. A common pitfall involves `u256` variables, which are composed of two `u128` values; when calling a function expecting a `u256`, you must provide two arguments.

### `Item path::item is not visible in this context.`

This error means that while the path to an item is correct, there's a visibility issue. By default, all items in Cairo are private to their parent modules. To resolve this, declare the necessary modules and items along the path using `pub(crate)` or `pub` to grant access.

### `Identifier not found.`

This is a general error that can indicate:

- A variable is being used before its declaration. Ensure variables are declared using `let`.
- The path used to bring an item into scope is incorrect. Verify that you are using valid paths.

## Starknet Components Related Error Messages

### `Trait not found. Not a trait.`

This error can occur when an implementation block for a component is not imported correctly into your contract. Ensure you follow the correct syntax for importing:

```cairo,noplayground
#[abi(embed_v0)]
impl IMPL_NAME = PATH_TO_COMPONENT::EMBEDDED_NAME<ContractState>
```

Testing Fundamentals: Writing and Running Tests

# Testing Fundamentals: Writing and Running Tests

Correctness in Cairo programs is crucial, and while the type system helps, it cannot catch everything. Cairo provides built-in support for writing tests to verify program behavior.

## The Purpose of Tests

Tests are Cairo functions designed to verify that other code functions as intended. A typical test function involves three steps:

1.  **Set up**: Prepare any necessary data or state.
2.  **Run**: Execute the code being tested.
3.  **Assert**: Verify that the results match expectations.

## Anatomy of a Test Function

Cairo offers several features for writing tests:

- `#[test]` attribute: Marks a function as a test.
- `assert!` macro: Checks if a condition is true.
- `assert_eq!`, `assert_ne!`, `assert_lt!`, `assert_le!`, `assert_gt!`, `assert_ge!` macros: For comparing values. These require `assert_macros` as a dev dependency.
- `#[should_panic]` attribute: Asserts that a test function panics.

### The `#[test]` Attribute

A function annotated with `#[test]` is recognized by the test runner. The `scarb test` command executes these functions.

```cairo,noplayground
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        let result = add(2, 2); // Assuming 'add' is a function in the outer scope
        assert_eq!(result, 4);
    }
}
```

### The `#[cfg(test)]` Attribute

The `#[cfg(test)]` attribute ensures that the code within the annotated module (typically `mod tests`) is compiled only when running tests. This is necessary for test code that might not be valid in other compilation contexts.

```cairo,noplayground
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        let result = add(2, 2);
        assert_eq!(result, 4);
    }
}
```

### Testing Private Functions

Cairo allows testing private functions. Items within child modules (like the `tests` module) can access items in their ancestor modules.

```cairo,noplayground
// Filename: src/lib.cairo
pub fn add(a: u32, b: u32) -> u32 {
    internal_adder(a, 2)
}

fn internal_adder(a: u32, b: u32) -> u32 {
    a + b
}

#[cfg(test)]
mod tests {
    use super::*; // Brings internal_adder into scope

    #[test]
    fn test_private_function() {
        // The test can call the private function directly
        assert_eq!(4, internal_adder(2, 2));
    }
}
```

## Running Tests

The `scarb test` command compiles and runs all functions annotated with `#[test]` in the project. The output provides details on passed, failed, ignored, and filtered tests.

Example output:

```shell
$ scarb test
...
Collected 2 test(s) from listing_10_01 package
Running 2 test(s) from src/
[PASS] listing_10_01::other_tests::exploration (l1_gas: ~0, l1_data_gas: ~0, l2_gas: ~40000)
[PASS] listing_10_01::tests::it_works (l1_gas: ~0, l1_data_gas: ~0, l2_gas: ~40000)
Tests: 2 passed, 0 failed, 0 ignored, 0 filtered out
```

## Examples

### Testing Conversions

This example tests a `parse_u8` function that converts `felt252` to `u8`.

```cairo,noplayground
fn parse_u8(s: felt252) -> Result<u8, felt252> {
    match s.try_into() {
        Some(value) => Ok(value),
        None => Err('Invalid integer'),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_felt252_to_u8() {
        let number: felt252 = 5;
        // should not panic
        let res = parse_u8(number).unwrap();
    }

    #[test]
    #[should_panic]
    fn test_felt252_to_u8_panic() {
        let number: felt252 = 256;
        // should panic
        let res = parse_u8(number).unwrap();
    }
}
```

### Testing Struct Methods

This tests a `can_hold` method on a `Rectangle` struct.

```cairo,noplayground
#[derive(Drop)]
struct Rectangle {
    width: u64,
    height: u64,
}

trait RectangleTrait {
    fn can_hold(self: @Rectangle, other: @Rectangle) -> bool;
}

impl RectangleImpl of RectangleTrait {
    fn can_hold(self: @Rectangle, other: @Rectangle) -> bool {
        *self.width > *other.width && *self.height > *other.height
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn larger_can_hold_smaller() {
        let larger = Rectangle { height: 7, width: 8 };
        let smaller = Rectangle { height: 1, width: 5 };

        assert!(larger.can_hold(@smaller), "rectangle cannot hold");
    }
}

#[cfg(test)]
mod tests2 {
    use super::*;

    #[test]
    fn smaller_cannot_hold_larger() {
        let larger = Rectangle { height: 7, width: 8 };
        let smaller = Rectangle { height: 1, width: 5 };

        assert!(!smaller.can_hold(@larger), "rectangle cannot hold");
    }
}
```

### Testing Starknet Contracts

Tests for Starknet contracts can be written using `snforge_std` and can either deploy the contract or interact with its internal state for testing.

```cairo,noplayground
use snforge_std::{
    ContractClassTrait, DeclareResultTrait, EventSpyAssertionsTrait, declare, load, spy_events,
    start_cheat_caller_address, stop_cheat_caller_address,
};
use starknet::storage::StoragePointerReadAccess;
use starknet::{ContractAddress, contract_address_const};
use crate::pizza::PizzaFactory::{Event as PizzaEvents, PizzaEmission};
use crate::pizza::PizzaFactory::{InternalTrait};
use crate::pizza::{IPizzaFactoryDispatcher, IPizzaFactoryDispatcherTrait, PizzaFactory};

fn owner() -> ContractAddress {
    contract_address_const::<'owner'>()
}

fn deploy_pizza_factory() -> (IPizzaFactoryDispatcher, ContractAddress) {
    let contract = declare("PizzaFactory").unwrap().contract_class();
    let owner: ContractAddress = contract_address_const::<'owner'>();
    let constructor_calldata = array![owner.into()];
    let (contract_address, _) = contract.deploy(@constructor_calldata).unwrap();
    let dispatcher = IPizzaFactoryDispatcher { contract_address };
    (dispatcher, contract_address)
}

#[test]
fn test_constructor() {
    let (pizza_factory, pizza_factory_address) = deploy_pizza_factory();

    let pepperoni_count = load(pizza_factory_address, selector!("pepperoni"), 1);
    let pineapple_count = load(pizza_factory_address, selector!("pineapple"), 1);
    assert_eq!(pepperoni_count, array![10]);
    assert_eq!(pineapple_count, array![10]);
    assert_eq!(pizza_factory.get_owner(), owner());
}

#[test]
fn test_change_owner_should_change_owner() {
    let (pizza_factory, pizza_factory_address) = deploy_pizza_factory();
    let new_owner: ContractAddress = contract_address_const::<'new_owner'>();
    assert_eq!(pizza_factory.get_owner(), owner());
    start_cheat_caller_address(pizza_factory_address, owner());
    pizza_factory.change_owner(new_owner);
    assert_eq!(pizza_factory.get_owner(), new_owner);
}

#[test]
#[should_panic(expected: "Only the owner can set ownership")]
fn test_change_owner_should_panic_when_not_owner() {
    let (pizza_factory, pizza_factory_address) = deploy_pizza_factory();
    let not_owner = contract_address_const::<'not_owner'>();
    start_cheat_caller_address(pizza_factory_address, not_owner);
    pizza_factory.change_owner(not_owner);
    stop_cheat_caller_address(pizza_factory_address);
}

#[test]
#[should_panic(expected: "Only the owner can make pizza")]
fn test_make_pizza_should_panic_when_not_owner() {
    let (pizza_factory, pizza_factory_address) = deploy_pizza_factory();
    let not_owner = contract_address_const::<'not_owner'>();
    start_cheat_caller_address(pizza_factory_address, not_owner);
    pizza_factory.make_pizza();
}

#[test]
fn test_make_pizza_should_increment_pizza_counter() {
    // Setup
    let (pizza_factory, pizza_factory_address) = deploy_pizza_factory();
    start_cheat_caller_address(pizza_factory_address, owner());
    let mut spy = spy_events();

    // When
    pizza_factory.make_pizza();

    // Then
    let expected_event = PizzaEvents::PizzaEmission(PizzaEmission { counter: 1 });
    assert_eq!(pizza_factory.count_pizza(), 1);
    spy.assert_emitted(@array![(pizza_factory_address, expected_event)]);
}

#[test]
fn test_set_as_new_owner_direct() {
    let mut state = PizzaFactory::contract_state_for_testing();
    let owner: ContractAddress = contract_address_const::<'owner'>();
    state.set_owner(owner);
    assert_eq!(state.owner.read(), owner);
}
```

Assertions and Test Verification

# Assertions and Test Verification

The `assert!` macro is used to verify that a condition in a test evaluates to `true`. If the condition is `false`, the macro calls `panic()` with a provided message, causing the test to fail.

## `assert_eq!` and `assert_ne!` Macros

These macros provide a convenient way to test for equality (`assert_eq!`) or inequality (`assert_ne!`) between two values. They are preferred over using `assert!(left == right)` because they print the differing values upon failure, aiding in debugging.

To use these macros with custom types like structs or enums, they must implement the `PartialEq` and `Debug` traits. These traits can often be derived using `#[derive(Debug, PartialEq)]`.

**Example using `assert_eq!` and `assert_ne!`:**

```cairo, noplayground
pub fn add_two(a: u32) -> u32 {
    a + 2
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_adds_two() {
        assert_eq!(4, add_two(2));
    }

    #[test]
    fn wrong_check() {
        assert_ne!(0, add_two(2));
    }
}
```

When an `assert_eq!` fails, it provides a detailed message showing the expected and actual values. For instance, if `add_two` incorrectly returned `5` for an input of `2`, the failure message would indicate `4: 4` and `add_two(2): 5`.

## `assert_lt!`, `assert_le!`, `assert_gt!`, and `assert_ge!` Macros

These macros are used for comparison tests:

- `assert_lt!`: Checks if the first value is strictly less than the second.
- `assert_le!`: Checks if the first value is less than or equal to the second.
- `assert_gt!`: Checks if the first value is strictly greater than the second.
- `assert_ge!`: Checks if the first value is greater than or equal to the second.

To use these macros with custom types, the `PartialOrd` trait must be implemented. The `Copy` trait may also be necessary if instances are used multiple times.

**Example using comparison macros:**

```cairo, noplayground
#[derive(Drop, Copy, Debug, PartialEq)]
struct Dice {
    number: u8,
}

impl DicePartialOrd of PartialOrd<Dice> {
    fn lt(lhs: Dice, rhs: Dice) -> bool {
        lhs.number < rhs.number
    }

    fn le(lhs: Dice, rhs: Dice) -> bool {
        lhs.number <= rhs.number
    }

    fn gt(lhs: Dice, rhs: Dice) -> bool {
        lhs.number > rhs.number
    }

    fn ge(lhs: Dice, rhs: Dice) -> bool {
        lhs.number >= rhs.number
    }
}

#[cfg(test)]
#[test]
fn test_struct_equality() {
    let first_throw = Dice { number: 5 };
    let second_throw = Dice { number: 2 };
    let third_throw = Dice { number: 6 };
    let fourth_throw = Dice { number: 5 };

    assert_gt!(first_throw, second_throw);
    assert_ge!(first_throw, fourth_throw);
    assert_lt!(second_throw, third_throw);
    assert_le!(
        first_throw, fourth_throw, "{:?},{:?} should be lower or equal", first_throw, fourth_throw,
    );
}
```

## Adding Custom Failure Messages

Optional arguments can be provided to assertion macros (`assert!`, `assert_eq!`, `assert_ne!`) to include custom failure messages. These arguments are formatted using the `format!` macro syntax, allowing for detailed explanations when a test fails.

**Example with a custom message:**

```cairo, noplayground
    #[test]
    fn it_adds_two() {
        assert_eq!(4, add_two(2), "Expected {}, got add_two(2)={}", 4, add_two(2));
    }
```

This results in a more informative error message upon failure, such as "Expected 4, got add_two(2)=5".

Advanced Testing Techniques: Panics and Ignoring Tests

# Advanced Testing Techniques: Panics and Ignoring Tests

## Handling Panics in Tests

Cairo provides mechanisms to handle and test for panics, which are runtime errors that halt program execution.

### `panic!` Macro

The `panic!` macro is a convenient way to halt execution and signal an error. It can accept a string literal as an argument, allowing for longer error messages than the 31-character limit of `panic_with_felt252`.

```cairo
#[executable]
fn main() {
    if true {
        panic!("2");
    }
    println!("This line isn't reached");
}
```

### `panic_with_felt252` Function

For a more idiomatic approach, `panic_with_felt252` can be used. It takes a `felt252` value as an argument, making it a concise way to express intent, especially when a simple error code is sufficient.

```cairo
use core::panic_with_felt252;

#[executable]
fn main() {
    panic_with_felt252(2);
}
```

## Testing for Panics with `should_panic`

The `#[should_panic]` attribute can be added to a test function to assert that the test is expected to panic. The test passes if a panic occurs and fails if no panic occurs.

Consider a `Guess` struct where the `new` method panics if the input value is out of range:

```cairo
#[derive(Drop)]
struct Guess {
    value: u64,
}

pub trait GuessTrait {
    fn new(value: u64) -> Guess;
}

impl GuessImpl of GuessTrait {
    fn new(value: u64) -> Guess {
        if value < 1 || value > 100 {
            panic!("Guess must be >= 1 and <= 100");
        }

        Guess { value }
    }
}
```

A test to verify this panic behavior would look like:

```cairo
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[should_panic]
    fn greater_than_100() {
        GuessTrait::new(200);
    }
}
```

If the code within a `#[should_panic]` test does not panic, the test will fail with a message like "Expected to panic, but no panic occurred".

### Precise `should_panic` Tests

To make `#[should_panic]` tests more robust, you can specify an `expected` string. The test will only pass if the panic message contains the specified text.

```cairo
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[should_panic(expected: "Guess must be <= 100")]
    fn greater_than_100() {
        GuessTrait::new(200);
    }
}
```

If the panic message does not match the `expected` string, the test will fail, indicating the mismatch.

## Ignoring Tests

Tests that are time-consuming or not relevant for regular runs can be ignored using the `#[ignore]` attribute.

```cairo
#[cfg(test)]
mod tests {
    #[test]
    fn it_works() {
        // ...
    }

    #[test]
    #[ignore]
    fn expensive_test() { // code that takes an hour to run
    }
}
```

When tests are ignored, they are marked as `[IGNORE]` in the output. To run all tests, including ignored ones, use the `scarb test --include-ignored` command.

## Running Single Tests

To run only specific tests, you can pass the test function's name as an argument to `scarb test`. Partial names can also be used to run multiple tests matching the pattern.

```shell
$ scarb test add_two_and_two
```

This command will execute only the `add_two_and_two` test. The output will indicate tests that were filtered out.

Test Organization: Unit vs. Integration Tests

# Test Organization: Unit vs. Integration Tests

Tests in Cairo can be broadly categorized into two main types: unit tests and integration tests. Both are crucial for ensuring code correctness, both in isolation and when components interact.

## Unit Tests

Unit tests focus on verifying individual units of code in isolation. This allows for quick pinpointing of issues within a specific module or function.

### Location and Structure

Unit tests are typically placed within the `src` directory, in the same file as the code they are testing. The convention is to create a module named `tests` within the file and annotate it with `#[cfg(test]]`.

The `#[cfg(test]]` attribute instructs the compiler to only compile and run this code when `scarb test` is invoked, not during a regular build (`scarb build`). This prevents test code from being included in the final compiled artifact, saving space and compile time.

**Example Unit Test:**

```cairo
pub fn add(left: usize, right: usize) -> usize {
    left + right
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        let result = add(2, 2);
        assert_eq!(result, 4);
    }
}
```

## Integration Tests

Integration tests validate how different parts of your library work together. They simulate how an external user would interact with your code, using only the public interface.

### The `tests` Directory

Integration tests reside in a top-level directory named `tests`, parallel to the `src` directory. `scarb` automatically recognizes this directory and compiles each file within it as a separate crate.

**Directory Structure Example:**

```shell
adder
├── Scarb.lock
├── Scarb.toml
├── src
│   └── lib.cairo
└── tests
    └── integration_test.cairo
```

**Example Integration Test:**

To test a function `add_two` from the `adder` crate:

```cairo
// tests/integration_tests.cairo
use adder::add_two;

#[test]
fn it_adds_two() {
    assert_eq!(4, add_two(2));
}
```

Note the `use adder::add_two;` statement, which is necessary to bring the library's functionality into the scope of the separate integration test crate. Unlike unit tests, files in the `tests` directory do not require the `#[cfg(test]]` attribute, as `scarb` handles their compilation context.

### Running and Filtering Tests

When you run `scarb test`, the output is divided into sections, first for integration tests (one section per file in `tests/`) and then for unit tests. If any test fails, subsequent sections may not run.

You can filter tests using the `-f` flag with `scarb test`. For example, `scarb test -f integration_tests::internal` runs a specific integration test function, while `scarb test -f integration_tests` runs all tests within files containing "integration_tests" in their path.

### Organizing Integration Tests with Submodules

As integration tests grow, you can organize them into multiple files within the `tests` directory. Each file is compiled as a separate crate.

**Example with a common helper:**

If you create `tests/common.cairo` with a `setup` function:

```cairo
// tests/common.cairo
pub fn setup() {
    println!("Setting up tests...");
}
```

And `tests/integration_tests.cairo` calls it:

```cairo
// tests/integration_tests.cairo
use tests::common::setup;
use adder::it_adds_two;

#[test]
fn internal() {
    setup(); // Call helper function
    assert!(it_adds_two(2, 2) == 4, "internal_adder failed");
}
```

Running `scarb test` would produce a section for `common.cairo` even if it contains no tests.

To treat the entire `tests` directory as a single crate, you can add a `tests/lib.cairo` file:

```cairo
// tests/lib.cairo
mod common;
mod integration_tests;
```

This structure consolidates the tests into a single crate, allowing helper functions like `setup` to be imported and used without generating a separate output section for the helper file itself. The `scarb test` output will then reflect a single `adder_tests` crate.

## Summary

Cairo provides robust testing capabilities through unit and integration tests. Unit tests ensure the correctness of isolated code units, often accessing private details. Integration tests validate the interaction of multiple components using the public API, mimicking external usage. Both are essential for reliable software development, complementing Cairo's type system in preventing bugs.

Testing Cairo Components

# Testing Cairo Components

Testing components differs from testing contracts. Contracts are tested against a specific state, either by deployment or by direct manipulation of `ContractState`. Components, being generic and not deployable on their own, require different testing approaches.

## Testing the Component by Deploying a Mock Contract

The most straightforward method to test a component is by integrating it into a mock contract solely for testing. This allows testing the component within a contract's context and using a Dispatcher to call its entry points.

### Counter Component Example

Consider a simple `CounterComponent` that allows incrementing a counter:

```cairo, noplayground
#[starknet::component]
pub mod CounterComponent {
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};

    #[storage]
    pub struct Storage {
        value: u32,
    }

    #[embeddable_as(CounterImpl)]
    pub impl Counter<TContractState, +HasComponent<TContractState>> of super::ICounter<ComponentState<TContractState>> {
        fn get_counter(self: @ComponentState<TContractState>) -> u32 {
            self.value.read()
        }

        fn increment(ref self: ComponentState<TContractState>) {
            self.value.write(self.value.read() + 1);
        }
    }
}
```

### Mock Contract Definition

A mock contract for testing the `CounterComponent` can be defined as follows:

```cairo, noplayground
#[starknet::contract]
mod MockContract {
    use super::counter::CounterComponent;

    component!(path: CounterComponent, storage: counter, event: CounterEvent);

    #[storage]
    struct Storage {
        #[substorage(v0)]
        counter: CounterComponent::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        CounterEvent: CounterComponent::Event,
    }

    #[abi(embed_v0)]
    impl CounterImpl = CounterComponent::CounterImpl<ContractState>;
}
```

This mock contract embeds the component and exposes its entry points. An interface is also defined for external interaction:

```cairo, noplayground
#[starknet::interface]
pub trait ICounter<TContractState> {
    fn get_counter(self: @TContractState) -> u32;
    fn increment(ref self: TContractState);
}
```

Tests can then be written by deploying this mock contract and calling its entry points:

```cairo, noplayground
use starknet::SyscallResultTrait;
use starknet::syscalls::deploy_syscall;
use super::MockContract;
use super::counter::{ICounterDispatcher, ICounterDispatcherTrait};

fn setup_counter() -> ICounterDispatcher {
    let (address, _) = deploy_syscall(
        MockContract::TEST_CLASS_HASH.try_into().unwrap(), 0, array![].span(), false,
    )
        .unwrap_syscall();
    ICounterDispatcher { contract_address: address }
}

#[test]
fn test_constructor() {
    let counter = setup_counter();
    assert_eq!(counter.get_counter(), 0);
}

#[test]
fn test_increment() {
    let counter = setup_counter();
    counter.increment();
    assert_eq!(counter.get_counter(), 1);
}
```

## Testing Components Without Deploying a Contract

Components utilize genericity for reusable storage and logic. When a contract embeds a component, a `HasComponent` trait is generated, making component methods accessible. By providing a concrete `TContractState` that implements `HasComponent` to `ComponentState`, component methods can be invoked directly without deploying a mock contract.

### Using Type Aliases for Testing

Define a type alias for `ComponentState` using a concrete `ContractState` (e.g., `MockContract::ContractState`):

```cairo, noplayground
type TestingState = CounterComponent::ComponentState<MockContract::ContractState>;

impl TestingStateDefault of Default<TestingState> {
    fn default() -> TestingState {
        CounterComponent::component_state_for_testing()
    }
}

#[test]
fn test_increment() {
    let mut counter: TestingState = Default::default();

    counter.increment();
    counter.increment();

    assert_eq!(counter.get_counter(), 2);
}
```

This `TestingState` type alias allows direct invocation of component methods. The `component_state_for_testing` function creates an instance of `TestingState` for testing.

This approach is more lightweight and allows testing internal component functions not trivially exposed externally.

## Testing Contract Internals

### Accessing Internal Functions with `contract_state_for_testing`

The `contract_state_for_testing` function allows direct interaction with a contract's `ContractState` without deployment. This is useful for testing internal functions and storage variables.

```cairo,noplayground
use crate::pizza::PizzaFactory::{InternalTrait};
use crate::pizza::{IPizzaFactoryDispatcher, IPizzaFactoryDispatcherTrait, PizzaFactory};

#[test]
fn test_set_as_new_owner_direct() {
    let mut state = PizzaFactory::contract_state_for_testing();
    let owner: ContractAddress = contract_address_const::<'owner'>();
    state.set_owner(owner);
    assert_eq!(state.owner.read(), owner);
}
```

This function creates a `ContractState` instance, enabling calls to functions that accept `ContractState` as a parameter, and direct access to storage variables after importing necessary traits.

### Mocking Caller Address with `start_cheat_caller_address`

The `start_cheat_caller_address` function allows mocking the caller's address to test access control logic.

```cairo,noplayground
# use snforge_std::{
#     ContractClassTrait, DeclareResultTrait, EventSpyAssertionsTrait, declare, load, spy_events,
#     start_cheat_caller_address, stop_cheat_caller_address,
# };
# use starknet::storage::StoragePointerReadAccess;
# use starknet::{ContractAddress, contract_address_const};
# use crate::pizza::PizzaFactory::{Event as PizzaEvents, PizzaEmission};
# use crate::pizza::PizzaFactory::{InternalTrait};
# use crate::pizza::{IPizzaFactoryDispatcher, IPizzaFactoryDispatcherTrait, PizzaFactory};
#
# fn owner() -> ContractAddress {
#     contract_address_const::<'owner'>()
# }
#
# fn deploy_pizza_factory() -> (IPizzaFactoryDispatcher, ContractAddress) {
#     let contract = declare("PizzaFactory").unwrap().contract_class();
#
#     let owner: ContractAddress = contract_address_const::<'owner'>();
#     let constructor_calldata = array![owner.into()];
#
#     let (contract_address, _) = contract.deploy(@constructor_calldata).unwrap();
#
#     let dispatcher = IPizzaFactoryDispatcher { contract_address };
#
#     (dispatcher, contract_address)
# }
#
#[test]
fn test_change_owner_should_change_owner() {
    let (pizza_factory, pizza_factory_address) = deploy_pizza_factory();

    let new_owner: ContractAddress = contract_address_const::<'new_owner'>();
    assert_eq!(pizza_factory.get_owner(), owner());

    start_cheat_caller_address(pizza_factory_address, owner());

    pizza_factory.change_owner(new_owner);

    assert_eq!(pizza_factory.get_owner(), new_owner);
}

#[test]
#[should_panic(expected: "Only the owner can set ownership")]
fn test_change_owner_should_panic_when_not_owner() {
    let (pizza_factory, pizza_factory_address) = deploy_pizza_factory();
    let not_owner = contract_address_const::<'not_owner'>();
    start_cheat_caller_address(pizza_factory_address, not_owner);
    pizza_factory.change_owner(not_owner);
    stop_cheat_caller_address(pizza_factory_address);
}
```

### Capturing Events with `spy_events`

The `spy_events` function captures emitted events, allowing assertions on their parameters and verifying contract behavior, such as incrementing counters or restricting actions to the owner.

```cairo,noplayground
# use snforge_std::{
#     ContractClassTrait, DeclareResultTrait, EventSpyAssertionsTrait, declare, load, spy_events,
#     start_cheat_caller_address, stop_cheat_caller_address,
# };
# use starknet::storage::StoragePointerReadAccess;
# use starknet::{ContractAddress, contract_address_const};
# use crate::pizza::PizzaFactory::{Event as PizzaEvents, PizzaEmission};
# use crate::pizza::PizzaFactory::{InternalTrait};
# use crate::pizza::{IPizzaFactoryDispatcher, IPizzaFactoryDispatcherTrait, PizzaFactory};
#
# fn owner() -> ContractAddress {
#     contract_address_const::<'owner'>()
# }
#
# fn deploy_pizza_factory() -> (IPizzaFactoryDispatcher, ContractAddress) {
#     let contract = declare("PizzaFactory").unwrap().contract_class();
#
#     let owner: ContractAddress = contract_address_const::<'owner'>();
#     let constructor_calldata = array![owner.into()];
#
#     let (contract_address, _) = contract.deploy(@constructor_calldata).unwrap();
#
#     let dispatcher = IPizzaFactoryDispatcher { contract_address };
#
#     (dispatcher, contract_address)
# }
#
#[test]
#[should_panic(expected: "Only the owner can make pizza")]
fn test_make_pizza_should_panic_when_not_owner() {
    let (pizza_factory, pizza_factory_address) = deploy_pizza_factory();
    let not_owner = contract_address_const::<'not_owner'>();
    start_cheat_caller_address(pizza_factory_address, not_owner);

    pizza_factory.make_pizza();
}

#[test]
fn test_make_pizza_should_increment_pizza_counter() {
    // Setup
    let (pizza_factory, pizza_factory_address) = deploy_pizza_factory();
    start_cheat_caller_address(pizza_factory_address, owner());
    let mut spy = spy_events();

    // When
    pizza_factory.make_pizza();

    // Then
    let expected_event = PizzaEvents::PizzaEmission(PizzaEmission { counter: 1 });
    assert_eq!(pizza_factory.count_pizza(), 1);
    spy.assert_emitted(@array![(pizza_factory_address, expected_event)]);
}
```

Testing Smart Contracts with Frameworks

## Testing Smart Contracts with Frameworks

To test smart contracts using Starknet Foundry, you first need to configure your Scarb project. This involves adding `snforge_std` as a dev dependency in your `Scarb.toml` file and setting up a script for testing.

### Configuring Scarb Project with Starknet Foundry

Modify your `Scarb.toml` file to include Starknet Foundry:

```toml,noplayground
[dev-dependencies]
snforge_std = "0.48.0" # Use the latest version

[scripts]
test = "snforge test"

[tool.scarb]
allow-pre-built-plugins = ["snforge_std"]
```

This configuration ensures that running `scarb test` will execute `snforge test`. After configuring `Scarb.toml`, install Starknet Foundry following the official documentation.

### Testing Flow with Starknet Foundry

The typical workflow for testing a contract with Starknet Foundry involves these steps:

1.  **Declare the contract class**: Identify the contract by its name.
2.  **Serialize constructor calldata**: Prepare the constructor arguments.
3.  **Deploy the contract**: Obtain the contract's address.
4.  **Interact with the contract**: Call its entrypoints to test various scenarios.

The command to run these tests is `snforge test`, which is executed via `scarb test` due to the project configuration. Test outputs typically include success status and estimated gas consumption.

Profiling and Performance Analysis

### Profiling and Performance Analysis

To profile your Cairo code, you can use the `snforge test --build-profile` command. This command generates trace files for passing tests in the `_snfoundry_trace_` directory and corresponding output files in the `_profile_` directory.

To analyze a profile, run the `go tool pprof -http=":8000" path/to/profile/output.pb.gz` command. This starts a web server at the specified port for analysis.

Consider the following `sum_n` function and its test:

```cairo
fn sum_n(n: usize) -> usize {
    let mut i = 0;
    let mut sum = 0;
    while i <= n {
        sum += i;
        i += 1;
    }
    sum
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[available_gas(2000000)]
    fn test_sum_n() {
        let result = sum_n(10);
        assert!(result == 55, "result is not 55");
    }
}
```

After generating the trace and profile output, the `go tool pprof` web server provides valuable information:

- **Function Calls:** `snforge` simulates contract calls, so a test function with multiple calls to a contract function will still register as one call in the profiler.
- **Cairo Steps:** The execution of `sum_n` uses 256 Cairo steps.

<div align="center">
    <img src="pprof-steps.png" alt="pprof number of steps" width="800px"/>
</div>

The Cairo Profiler also offers insights into memory holes and builtins usage, with ongoing development for additional features.

[Profiling]: https://foundry-rs.github.io/starknet-foundry/snforge-advanced-features/profiling.html
[Cairo Profiler]: https://github.com/software-mansion/cairo-profiler
[go]: https://go.dev/doc/install
[Graphviz]: https://www.graphviz.org/download/

Quizzes and Summaries

# Quizzes and Summaries

### How to Write Tests

1.  **What is the annotation you add to a function to indicate that it's a test?**
    `#[test]`

2.  **Let's say you have a function with the type signature:**

    ```cairo
    fn f(x: usize) -> Result<usize, ByteArray>;
    ```

    **And you want to test that `f(0)` should return `Err(_)`. Which of the following is _NOT_ a valid way to test that?**

    ```cairo
    #[test]
    #[should_err]
    fn test() -> Result<usize, String> {
        f(0)
    }
    ```

    _Note: `should_err` does not exist in Cairo — tests that return `Result` will pass even if the result is an `Err`._

3.  **Does the test pass?**

    ```cairo
    fn division_operation(number1: u16, number2: u16) -> u16 {
        if number2 == 0 {
            panic!("ZeroDivisionError not allowed!");
        }
        let result = number1 / number2;
        result
    }

    #[cfg(test)]
    mod tests {
        use super::{division_operation};

        #[test]
        #[should_panic(expected: ("Zerodivisionerror not allowed!",))]
        fn test_division_operation() {
            division_operation(10, 0);
        }
    }
    ```

    **No**. The expected string `"Zerodivisionerror not allowed!"` should be exactly the same as the panic string `"ZeroDivisionError not allowed!"`.

4.  **What is the output when these tests are run with the command `scarb cairo-test -f test_`?**

    ```cairo
    #[cfg(test)]
    mod tests {
        #[test]
        #[ignore]
        fn test_addition() {
            assert_ne!((5 + 4), 5);
        }

        #[test]
        fn division_function() {
            assert_eq!((10_u8 / 5), 2);
        }

        #[test]
        fn test_multiplication() {
            assert_ne!((3 * 2), 8);
            assert_eq!((5 * 5), 25);
        }

        #[test]
        fn test_subtraction() {
            assert!((12 - 11) == 1, "The first argument was false");
        }
    }
    ```

    `test result: ok. 2 passed; 0 failed; 1 ignored; 1 filtered out;`
    _Explanation: `test_addition` is ignored. `division_function` is filtered out because its name doesn't match the filter `test_`. `test*multiplication`and`test_subtraction` pass.*

Starknet Smart Contracts

Introduction to Starknet and Smart Contracts

# Introduction to Starknet and Smart Contracts

## What are Smart Contracts?

Smart contracts are programs deployed on a blockchain, consisting of storage and functions. They execute based on specific inputs and can modify or read the blockchain's storage. Each smart contract has a unique address and can hold tokens. While the term "smart contract" is a misnomer, they are fundamental to blockchain applications.

### Programming Languages and Compilation

Different blockchains use different languages for smart contracts. Ethereum primarily uses Solidity, compiled into bytecode. Starknet uses Cairo, which is compiled into Sierra and then Cairo Assembly (CASM).

### Characteristics of Smart Contracts

- **Permissionless:** Anyone can deploy a smart contract.
- **Transparent:** Data stored by the contract is publicly accessible.
- **Composable:** Developers can write contracts that interact with other contracts.

Smart contracts can only access on-chain data. For external data, they require oracles. Standards like `ERC20` (for tokens) and `ERC721` (for NFTs) facilitate interoperability.

## Use Cases for Smart Contracts

Smart contracts enable a wide range of applications:

### Decentralized Finance (DeFi)

Enables financial applications like lending/borrowing, decentralized exchanges (DEXs), stablecoins, and more, without traditional intermediaries.

### Tokenization

Facilitates the creation and trading of digital tokens representing real-world assets (e.g., real estate, art), enabling fractional ownership and increased liquidity.

### Voting

Creates secure, transparent, and immutable voting systems where votes are tallied automatically on the blockchain.

### Royalties

Automates the distribution of royalties to content creators based on consumption or sales.

### Decentralized Identities (DIDs)

Allows individuals to manage their digital identities securely and control the sharing of personal information.

## The Rise of Starknet and Cairo

Ethereum's success led to scalability issues (high transaction costs). Layer 2 (L2) solutions aim to address this. Starknet is a validity rollup L2 that uses STARKs for cryptographic proofs of computation correctness, offering significant scalability potential.

### Cairo and Starknet's VM

Cairo is a language designed for STARKs, enabling "provable code" for Starknet. Starknet utilizes its own Virtual Machine (VM), distinct from the EVM, offering greater flexibility. This, combined with native account abstraction, enables advanced features like "Smart Accounts" and new use cases such as transparent AI and fully on-chain blockchain games.

## Cairo Programs vs. Starknet Smart Contracts

Starknet contracts are a superset of Cairo programs. While Cairo programs have a `main` function as an entry point, Starknet contracts have one or more functions that serve as entry points and have access to Starknet's state.

### Smart Wallets and Account Abstraction

Interacting with Starknet often requires tools like Starkli. Account Abstraction allows for more complex account logic, referred to as "Smart Wallets", which are essential for functionalities like voting contracts. Preparing and funding these accounts is a prerequisite for interaction.

Starknet Contract Fundamentals

# Starknet Contract Fundamentals

## Defining a Starknet Contract

Starknet contracts are defined within modules annotated with the `#[starknet::contract]` attribute. Other related attributes include `#[starknet::interface]`, `#[starknet::component]`, `#[starknet::embeddable]`, `#[embeddable_as(...)]`, `#[storage]`, `#[event]`, and `#[constructor]`.

## Anatomy of a Simple Contract

A contract encapsulates state and logic within a module marked with `#[starknet::contract]`. The state is defined in a `Storage` struct, and logic is implemented in functions that interact with this state.

```cairo,noplayground
#[starknet::interface]
trait ISimpleStorage<TContractState> {
    fn set(ref self: TContractState, x: u128);
    fn get(self: @TContractState) -> u128;
}

#[starknet::contract]
mod SimpleStorage {
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};

    #[storage]
    struct Storage {
        stored_data: u128,
    }

    #[abi(embed_v0)]
    impl SimpleStorage of super::ISimpleStorage<ContractState> {
        fn set(ref self: ContractState, x: u128) {
            self.stored_data.write(x);
        }

        fn get(self: @ContractState) -> u128 {
            self.stored_data.read()
        }
    }
}
```

### The Interface: The Contract's Blueprint

Interfaces, defined using `#[starknet::interface]` on a trait, specify the functions a contract exposes. They use a generic `TContractState` for the contract's state. Functions with `ref self` can modify state (external), while those with `@self` are read-only (view).

```cairo,noplayground
#[starknet::interface]
trait ISimpleStorage<TContractState> {
    fn set(ref self: TContractState, x: u128);
    fn get(self: @TContractState) -> u128;
}
```

## Public Functions

Public functions are exposed externally. They are defined within an `impl` block annotated with `#[abi(embed_v0)]` or as standalone functions with `#[external(v0)]`.

- **External Functions**: Use `ref self: ContractState`, allowing state modification.
- **View Functions**: Use `@self: ContractState`, restricting state modification through `self` at compile time.

```cairo,noplayground
    #[abi(embed_v0)]
    impl SimpleStorage of super::ISimpleStorage<ContractState> {
        fn set(ref self: ContractState, x: u128) {
            self.stored_data.write(x);
        }

        fn get(self: @ContractState) -> u128 {
            self.stored_data.read()
        }
    }
```

**Note:** While the compiler enforces some restrictions for view functions, Starknet itself does not guarantee immutability for view functions called within a transaction. Always be cautious.

## Private Functions

Functions not marked as `#[external(v0)]` or within an `#[abi(embed_v0)]` block are private (internal). They can only be called from within the contract. They can be grouped in a `#[generate_trait]` impl block or defined as free functions.

```cairo,noplayground
    #[generate_trait]
    impl InternalFunctions of InternalFunctionsTrait {
        fn _store_name(ref self: ContractState, user: ContractAddress, name: felt252) {
            // ... implementation ...
        }
    }
```

## Constructors

Constructors, marked with `#[constructor]`, run only once during contract deployment to initialize the contract's state. A contract can have only one constructor.

```cairo,noplayground
    #[constructor]
    fn constructor(ref self: ContractState, owner: Person) {
        self.names.entry(owner.address).write(owner.name);
        self.total_names.write(1);
    }
```

## Contract Storage

Contract storage is a persistent map of `2^251` slots, each holding a `felt252`. Storage addresses are computed based on variable names and types. Common storage types include `Map` and `Vec`.

- **Accessing State**: Use `.read()` to retrieve a value and `.write()` to store or update a value.

```cairo,noplayground
            self.stored_data.read()
            self.stored_data.write(x);
```

## Contract Events

Events inform the outside world about contract changes. They are defined in an enum annotated with `#[event]` and emitted using `self.emit()`.

```cairo,noplayground
    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        BookAdded: BookAdded,
        #[flat]
        FieldUpdated: FieldUpdated,
        BookRemoved: BookRemoved,
    }
```

## Starknet Types

Starknet provides specialized types for blockchain interactions:

- `ContractAddress`: Represents a deployed contract's address.
- `StorageAddress`: Represents a location within a contract's storage.
- `EthAddress`: Represents a 20-byte Ethereum address for cross-chain applications.

## Contract Classes and Instances

- **Contract Class**: The definition of a contract's code.
- **Contract Instance**: A deployed contract with its own storage.

## Contract Address Computation

A contract address is computed using a hash of prefix, deployer address, salt, class hash, and constructor calldata hash.

## Class Hash Computation

A class hash is the chain hash of its components: version, entry points, ABI hash, and Sierra program hash.

Starknet System Calls

# Starknet System Calls

System calls enable a contract to request services from the Starknet OS, providing access to broader Starknet state beyond local variables. The following system calls are available in Cairo 1.0:

- `get_block_hash`
- `get_execution_info`
- `call_contract`
- `deploy`
- `emit_event`
- `library_call`
- `send_message_to_L1`
- `get_class_hash_at`
- `replace_class`
- `storage_read`
- `storage_write`
- `keccak`
- `sha256_process_block`

## `get_block_hash`

### Syntax

```cairo,noplayground
pub extern fn get_block_hash_syscall(
    block_number: u64,
) -> SyscallResult<felt252> implicits(GasBuiltin, System) nopanic;
```

### Description

Retrieves the hash of a specific Starknet block within the range of `[first_v0_12_0_block, current_block - 10]`.

### Return Values

Returns the hash of the specified block.

### Error Messages

- `Block number out of range`: `block_number` is greater than `current_block - 10`.
- `0`: `block_number` is less than the first block number of v0.12.0.

## `get_execution_info`

### Syntax

```cairo,noplayground
pub extern fn get_execution_info_syscall() -> SyscallResult<
    Box<starknet::info::ExecutionInfo>,
> implicits(GasBuiltin, System) nopanic;
```

### Description

Fetches information about the original transaction. In Cairo 1.0, all block, transaction, and execution context getters are consolidated into this single system call.

### Arguments

None.

### Return Values

Returns a struct containing the execution info.

## `call_contract`

### Syntax

```cairo,noplayground
pub extern fn call_contract_syscall(
    address: ContractAddress, entry_point_selector: felt252, calldata: Span<felt252>,
) -> SyscallResult<Span<felt252>> implicits(GasBuiltin, System) nopanic;
```

### Description

Calls a specified contract with the given address, entry point selector, and call arguments.

_Note: Internal calls cannot return `Err(_)`as this is not handled by the sequencer or Starknet OS. Failure of`call*contract_syscall` results in the entire transaction being reverted.*

### Arguments

- `address`: The address of the contract to call.
- `entry_point_selector`: The selector for a function within the contract, computable with the `selector!` macro.
- `calldata`: The calldata array.

### Return Values

The call response, of type `SyscallResult<Span<felt252>>`.

## `deploy`

### Syntax

```cairo,noplayground
pub extern fn deploy_syscall(
    class_hash: ClassHash,
    contract_address_salt: felt252,
    calldata: Span<felt252>,
    deploy_from_zero: bool,
) -> SyscallResult<(ContractAddress, Span<felt252>)> implicits(GasBuiltin, System) nopanic;
```

### Description

Deploys a new instance of a previously declared class.

### Arguments

- `class_hash`: The class hash of the contract to deploy.
- `contract_address_salt`: An arbitrary value used in the computation of the contract's address.
- `calldata`: The constructor's calldata.
- `deploy_from_zero`: A flag for contract address computation. If not set, the caller's address is used; otherwise, 0 is used.

### Return Values

A tuple containing the deployed contract's address and the constructor's response array.

## `emit_event`

### Syntax

```cairo,noplayground
pub extern fn emit_event_syscall(
    keys: Span<felt252>, data: Span<felt252>,
) -> SyscallResult<()> implicits(GasBuiltin, System) nopanic;
```

### Description

Emits an event with specified keys and data. Keys are analogous to Ethereum event topics, and data contains the event payload.

### Arguments

- `keys`: The event's keys.
- `data`: The event's data.

### Return Values

None.

### Example

```cairo,noplayground
let keys = ArrayTrait::new();
keys.append('key');
keys.append('deposit');
let values = ArrayTrait::new();
values.append(1);
values.append(2);
values.append(3);
emit_event_syscall(keys, values).unwrap_syscall();
```

## `library_call`

### Syntax

```cairo,noplayground
pub extern fn library_call_syscall(
    class_hash: ClassHash, function_selector: felt252, calldata: Span<felt252>,
) -> SyscallResult<Span<felt252>> implicits(GasBuiltin, System) nopanic;
```

### Description

Executes the logic of another class within the context of the caller. Requires the class hash, function selector, and serialized calldata.

## `get_class_hash_at`

### Syntax

```cairo,noplayground
pub extern fn get_class_hash_at_syscall(
    contract_address: ContractAddress,
) -> SyscallResult<ClassHash> implicits(GasBuiltin, System) nopanic;
```

### Description

Retrieves the class hash of the contract at the given address.

### Arguments

- `contract_address`: The address of the deployed contract.

### Return Values

The class hash of the contract's originating code.

## `replace_class`

### Syntax

```cairo,noplayground
pub extern fn replace_class_syscall(
    class_hash: ClassHash,
) -> SyscallResult<()> implicits(GasBuiltin, System) nopanic;
```

### Description

Replaces the class of the calling contract with the class specified by `class_hash`. The replacement takes effect from the next transaction onwards or subsequent calls within the same transaction after the replacement.

### Arguments

- `class_hash`: The hash of the class to use as a replacement.

### Return Values

None.

## `storage_read`

### Syntax

```cairo,noplayground
pub extern fn storage_read_syscall(
    address_domain: u32, address: StorageAddress,
) -> SyscallResult<felt252> implicits(GasBuiltin, System) nopanic;
```

### Description

Reads a value from the contract's storage at the specified address domain and storage address.

### Return Values

The value read from storage as a `felt252`.

Contract Storage Management

# Contract Storage Management

Starknet contracts manage their state through contract storage, which can be accessed in two primary ways:

1.  **High-level storage variables**: Declared in a `Storage` struct annotated with `#[storage]`. This is the recommended approach for structured data.
2.  **Low-level system calls**: Using `storage_read_syscall` and `storage_write_syscall` for direct access to any storage key.

## Declaring and Using Storage Variables

Storage variables are declared within a `struct` annotated with `#[storage]`. This attribute enables the compiler to generate code for interacting with blockchain state. Any type implementing the `Store` trait can be used.

```cairo
#[storage]
struct Storage {
    owner: Person,
    expiration: Expiration,
}
```

### Accessing Storage Variables

Automatically generated `read` and `write` functions are available for each storage variable. For compound types like structs, you can access individual members directly.

To read a variable:

```cairo
let owner_data = self.owner.read();
```

To write a variable:

```cairo
self.owner.write(new_owner_data);
```

When working with struct members, you can read/write them directly:

```cairo
// Reading a specific member of a struct
fn get_owner_name(self: @ContractState) -> felt252 {
    self.owner.name.read()
}
```

## Storing Custom Types with the `Store` Trait

To store custom types (structs, enums) in storage, they must implement the `Store` trait. This can be achieved by deriving it:

```cairo
#[derive(Drop, Serde, starknet::Store)]
pub struct Person {
    address: ContractAddress,
    name: felt252,
}
```

Enums used in storage must also implement `Store` and define a default variant using `#[default]`:

```cairo
#[derive(Copy, Drop, Serde, starknet::Store)]
pub enum Expiration {
    Finite: u64,
    #[default]
    Infinite,
}
```

Both `Drop` and `Serde` are required for proper serialization/deserialization.

### Structs Storage Layout

Struct members are stored contiguously in storage, in the order they are defined. The first member is at the struct's base address, and subsequent members follow.

| Fields    | Address                     |
| --------- | --------------------------- |
| `owner`   | `owner.__base_address__`    |
| `address` | `owner.__base_address__ +1` |

### Enums Storage Layout

Enums store their variant's index (starting from 0) and any associated values. The index is stored at the enum's base address. If a variant has associated data, it's stored at the next address.

For `Expiration`:

- `Finite` (index 0) with a `u64` value:
  | Element | Address |
  | ---------------------------- | --------------------------------- |
  | Variant index (0 for Finite) | `expiration.__base_address__` |
  | Associated `u64` limit date | `expiration.__base_address__ + 1` |
- `Infinite` (index 1):
  | Element | Address |
  | ------------------------------ | ----------------------------- |
  | Variant index (1 for Infinite) | `expiration.__base_address__` |

## Storage Nodes

Storage nodes are special structs annotated with `#[starknet::storage_node]` that can contain storage-specific types like `Map` or `Vec`. They act as intermediate nodes in storage address calculations and can only exist within contract storage.

```cairo
#[starknet::storage_node]
struct ProposalNode {
    title: felt252,
    description: felt252,
    yes_votes: u32,
    no_votes: u32,
    voters: Map<ContractAddress, bool>,
}
```

Accessing members of a storage node involves navigating through its fields:

```cairo
let mut proposal = self.proposals.entry(proposal_id);
proposal.title.write(title);
```

## Low-Level Storage Access (Syscalls)

Direct access to storage can be done via system calls:

### `storage_read_syscall`

Reads a value from a specified storage address.

- **Arguments**: `address_domain` (currently `0` for onchain mode), `address` (the storage address).
- **Return**: `SyscallResult<felt252>`.

```cairo
use starknet::storage_access::storage_base_address_from_felt252;

let storage_address = storage_base_address_from_felt252(3534535754756246375475423547453);
storage_read_syscall(0, storage_address).unwrap_syscall();
```

### `storage_write_syscall`

Writes a value to a specified storage address.

- **Arguments**: `address_domain` (currently `0`), `address` (storage address), `value` (`felt252`).
- **Return**: `SyscallResult<()>`.

```cairo
pub extern fn storage_write_syscall(
    address_domain: u32, address: StorageAddress, value: felt252,
) -> SyscallResult<()> implicits(GasBuiltin, System) nopanic;
```

## Storing Key-Value Pairs with Mappings

Mappings (`Map<K, V>`) associate keys with values in storage. They compute storage slot addresses based on the hash of the key, rather than storing keys directly. Iteration over keys is not possible.

To declare a mapping:

```cairo
user_values: Map<ContractAddress, u64>,
```

To access or modify entries:

```cairo
// Writing to a mapping
self.user_values.entry(caller).write(amount);

// Reading from a mapping
let value = self.user_values.entry(address).read();
```

Nested mappings are supported:

```cairo
user_warehouse: Map<ContractAddress, Map<u64, u64>>,
```

Access requires chaining `entry` calls: `self.user_warehouse.entry(caller).entry(item_id).write(quantity);`

## Storing Ordered Collections with Vectors

Vectors (`Vec<T>`) store ordered collections in storage. Unlike memory arrays (`Array<T>`), `Vec<T>` is a phantom type for storage.

To declare a vector:

```cairo
addresses: Vec<ContractAddress>,
```

Operations include:

- `push(value)`: Appends an element.
- `get(index)`: Returns an optional storage pointer to the element at `index`.
- `len()`: Returns the number of elements.
- `pop()`: Removes and returns the last element.
- Indexing (`vec[index]`): Accesses an element (panics if out of bounds).

```cairo
// Appending to a vector
self.addresses.push(caller);

// Getting an element by index
self.addresses.get(index).map(|ptr| ptr.read());

// Modifying an element
self.addresses[index].write(new_address);
```

To retrieve all elements, iterate and append to a memory `Array<T>`.

## Addresses of Storage Variables

Storage variable addresses are computed using `sn_keccak` hashes of variable names.

- **Single values**: `sn_keccak(variable_name)`.
- **Structs/Enums**: Base address is `sn_keccak(variable_name)`; layout depends on type structure.
- **Maps/Vecs**: Address computed relative to a base address using keys/indices.
- **Storage Nodes**: Address computed via a chain of hashes reflecting the node structure.

The base address of a storage variable can be accessed via `__base_address__`.

## Optimizing Storage Costs with Bit-packing

Storage operations are costly. Bit-packing combines multiple variables into fewer storage slots to reduce gas costs. Integers can be combined if their total bit size fits within a larger integer type. Bitwise operators (`<<`, `>>`, `&`, `|`) are used for packing and unpacking.

For example, packing `u8`, `u32`, and `u64` (total 104 bits) into a single `u128` slot:

```cairo
struct Sizes {
    tiny: u8,
    small: u32,
    medium: u64,
}
```

The storage slot would store these packed values, requiring bitwise operations for access.

Contract Interaction and Communication

# Contract Interaction and Communication

Smart contracts require external triggers, such as user actions or calls from other contracts, to execute. This inter-contract communication enables the development of complex applications. Understanding the Application Binary Interface (ABI), calling conventions, and inter-contract communication mechanisms is crucial.

## Contract Class ABI

The Contract Class ABI defines the interface of a contract, specifying callable functions, their parameters, and return types. It facilitates communication by encoding and decoding data according to the contract's interface. External sources typically use a JSON representation of the ABI.

Functions are identified by their selectors, computed as `sn_keccak(function_name)`. Unlike some languages, function overloading based on parameters is not supported in Cairo, making the function name's hash a unique identifier.

### Encoding and Decoding

At the blockchain's low-level CASM instruction level, data is represented as `felt252`. The ABI dictates how higher-level types are serialized into `felt252` sequences for contract calls and deserialized back upon receiving data.

## The Dispatcher Pattern

The dispatcher pattern simplifies contract interaction by using a generated struct that wraps a contract address and implements a trait derived from the contract's ABI. This provides a type-safe way to call functions on other contracts.

The compiler automatically generates dispatchers for defined interfaces. For example, an `IERC20` interface might yield `IERC20Dispatcher` and `IERC20SafeDispatcher`.

- **Contract Dispatchers**: Wrap a contract address for calling functions on deployed contracts.
- **Safe Dispatchers**: Allow callers to handle potential errors (panics) during function execution, returning a `Result` type.

Under the hood, dispatchers utilize system calls like `starknet::syscalls::call_contract_syscall`.

### Contract Dispatcher Example

A contract can use a dispatcher to interact with another contract, such as an ERC20 token. The dispatcher struct holds the target contract's address and implements the generated trait. Its function implementations serialize arguments, perform the `call_contract_syscall`, and deserialize the results.

```cairo
#[starknet::contract]
mod TokenWrapper {
    use starknet::{ContractAddress, get_caller_address};
    use super::ITokenWrapper; // Assuming ITokenWrapper is defined elsewhere
    use super::{IERC20Dispatcher, IERC20DispatcherTrait};

    #[storage]
    struct Storage {}

    #[abi(embed_v0)]
    impl TokenWrapper of ITokenWrapper<ContractState> {
        fn token_name(self: @ContractState, contract_address: ContractAddress) -> felt252 {
            IERC20Dispatcher { contract_address }.name()
        }

        fn transfer_token(
            ref self: ContractState,
            address: ContractAddress,
            recipient: ContractAddress,
            amount: u256,
        ) -> bool {
            let erc20_dispatcher = IERC20Dispatcher { contract_address: address };
            erc20_dispatcher.transfer_from(get_caller_address(), recipient, amount)
        }
    }
}
```

### Handling Errors with Safe Dispatchers

Safe dispatchers return a `Result<T, Array<felt252>>`, where `T` is the expected return type and `Array<felt252>` contains the panic reason if the call fails. This allows for custom error handling logic.

```cairo
#[feature("safe_dispatcher")]
fn interact_with_failable_contract() -> u32 {
    let contract_address = 0x123.try_into().unwrap();
    // Use the Safe Dispatcher
    let faillable_dispatcher = IFailableContractSafeDispatcher { contract_address }; // Assuming IFailableContractSafeDispatcher exists
    let response: Result<u32, Array<felt252>> = faillable_dispatcher.can_fail(); // Assuming can_fail() exists

    // Match the result to handle success or failure
    match response {
        Result::Ok(x) => x, // Return the value on success
        Result::Err(_panic_reason) => {
            // Handle the error, e.g., log it or return a default value
            0 // Return 0 in case of failure
        },
    }
}
```

Certain critical failures, such as calls to non-existent contracts or class hashes, or failures within `deploy` or `replace_class` syscalls, may still result in immediate transaction reverts and cannot be caught by safe dispatchers.

## Calling Contracts using Low-Level Calls

Directly using `starknet::syscalls::call_contract_syscall` offers more control over data serialization and error handling than the dispatcher pattern.

Arguments must be serialized into a `Span<felt252>`, typically using the `Serde` trait. The syscall returns a serialized array of values that must be manually deserialized.

```cairo
#[starknet::contract]
mod TokenWrapper {
    use starknet::{ContractAddress, SyscallResultTrait, get_caller_address, syscalls};
    use super::ITokenWrapper; // Assuming ITokenWrapper is defined elsewhere

    #[storage]
    struct Storage {}

    impl TokenWrapper of ITokenWrapper<ContractState> {
        fn transfer_token(
            ref self: ContractState,
            address: ContractAddress,
            recipient: ContractAddress,
            amount: u256,
        ) -> bool {
            let mut call_data: Array<felt252> = array![];
            Serde::serialize(@get_caller_address(), ref call_data);
            Serde::serialize(@recipient, ref call_data);
            Serde::serialize(@amount, ref call_data);

            let mut res = syscalls::call_contract_syscall(
                address, selector!("transfer_from"), call_data.span(),
            )
                .unwrap_syscall();

            Serde::<bool>::deserialize(ref res).unwrap()
        }
    }
}
```

## Executing Code from Another Class (Library Calls)

Library calls allow a contract to execute logic from another class within its own execution context, affecting its own state. This differs from contract calls, where the called logic executes in the context of the called contract.

When Contract A uses a library call to execute logic from Class B:

- `get_caller_address()` in B's logic returns the caller of A.
- `get_contract_address()` in B's logic returns the address of A.
- Storage updates in B's logic update A's storage.

### Library Dispatchers

Similar to contract dispatchers, library dispatchers wrap a `ClassHash` and use `starknet::syscalls::library_call_syscall`.

```cairo
// Assuming an interface IERC20 is defined
trait IERC20DispatcherTrait<T> {
    fn name(self: T) -> felt252;
    fn transfer(self: T, recipient: ContractAddress, amount: u256);
}

#[derive(Copy, Drop, starknet::Store, Serde)]
struct IERC20LibraryDispatcher {
    class_hash: starknet::ClassHash,
}

impl IERC20LibraryDispatcherImpl of IERC20DispatcherTrait<IERC20LibraryDispatcher> {
    fn name(self: IERC20LibraryDispatcher) -> felt252 {
        // starknet::syscalls::library_call_syscall is called here
        // ... implementation details ...
        unimplemented!()
    }
    fn transfer(self: IERC20LibraryDispatcher, recipient: ContractAddress, amount: u256) {
        // starknet::syscalls::library_call_syscall is called here
        // ... implementation details ...
        unimplemented!()
    }
}
```

### Using the Library Dispatcher

A contract can execute logic from another class by instantiating a library dispatcher with the target class's hash and calling its functions. Storage modifications will apply to the calling contract.

```cairo
#[starknet::interface]
trait IValueStore<TContractState> {
    fn set_value(ref self: TContractState, value: u128);
    fn get_value(self: @TContractState) -> u128;
}

#[starknet::contract]
mod ValueStoreExecutor {
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use starknet::{ClassHash, ContractAddress};
    use super::{IValueStoreDispatcherTrait, IValueStoreLibraryDispatcher};

    #[storage]
    struct Storage {
        logic_library: ClassHash,
        value: u128, // This contract's storage
    }

    #[constructor]
    fn constructor(ref self: ContractState, logic_library: ClassHash) {
        self.logic_library.write(logic_library);
    }

    #[abi(embed_v0)]
    impl ValueStoreExecutor of super::IValueStore<ContractState> {
        fn set_value(ref self: ContractState, value: u128) {
            // Calls set_value in ValueStoreLogic's class context, updating self.value
            IValueStoreLibraryDispatcher { class_hash: self.logic_library.read() }
                .set_value(value);
        }

        fn get_value(self: @ContractState) -> u128 {
            // Calls get_value in ValueStoreLogic's class context, reading self.value
            IValueStoreLibraryDispatcher { class_hash: self.logic_library.read() }.get_value()
        }
    }

    #[external(v0)]
    fn get_value_local(self: @ContractState) -> u128 {
        self.value.read() // Reads the local storage directly
    }
}
```

### Calling Classes using Low-Level Calls

The `starknet::syscalls::library_call_syscall` can be used directly for more granular control. It requires the class hash, function selector, and serialized arguments.

```cairo
#[starknet::contract]
mod ValueStore {
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use starknet::{ClassHash, SyscallResultTrait, syscalls};

    #[storage]
    struct Storage {
        logic_library: ClassHash,
        value: u128,
    }

    #[constructor]
    fn constructor(ref self: ContractState, logic_library: ClassHash) {
        self.logic_library.write(logic_library);
    }

    #[external(v0)]
    fn set_value(ref self: ContractState, value: u128) -> bool {
        let mut call_data: Array<felt252> = array![];
        Serde::serialize(@value, ref call_data);

        let mut res = syscalls::library_call_syscall(
            self.logic_library.read(), selector!("set_value"), call_data.span(),
        )
            .unwrap_syscall();

        Serde::<bool>::deserialize(ref res).unwrap()
    }

    #[external(v0)]
    fn get_value(self: @ContractState) -> u128 {
        self.value.read()
    }
}
```

Starknet Components

# Starknet Components

Components are reusable modules that can incorporate logic, storage, and events, extendable without code duplication. They function like Lego blocks, allowing you to enrich contracts by plugging in pre-written modules. A component's code becomes part of the contract it's embedded in, meaning components cannot be deployed independently.

## What's in a Component?

Similar to contracts, components can contain:

- Storage variables
- Events
- External and internal functions

## Creating Components

To create a component:

1.  Define it in its own module decorated with `#[starknet::component]`.
2.  Declare a `Storage` struct and an `Event` enum within this module.
3.  Define the component's interface by declaring a trait with `#[starknet::interface]`.
4.  Implement the component's logic in an `impl` block marked with `#[embeddable_as(name)]`. This `impl` block typically implements the interface trait.

```cairo
// Example of an embeddable impl for a component
#[embeddable_as(name)]
impl ComponentName<
    TContractState, +HasComponent<TContractState>,
> of super::InterfaceName<ComponentState<TContractState>> {
    // Component functions implementation
}
```

Functions within these `impl` blocks expect arguments like `ref self: ComponentState<TContractState>` (for state-modifying functions) or `self: @ComponentState<TContractState>` (for view functions). This makes the `impl` generic over `TContractState`, allowing its use in any contract that implements the `HasComponent` trait.

Internal functions can be defined in a separate `impl` block without the `#[embeddable_as]` attribute; they are not exposed externally but can be used within the embedding contract.

## Migrating a Contract to a Component

To migrate a contract to a component, make the following changes:

- Add the `#[starknet::component]` attribute to the module.
- Add the `#[embeddable_as(name)]` attribute to the `impl` block to be embedded.
- Add generic parameters `TContractState` and `+HasComponent<TContractState>` to the `impl` block.
- Change `self` arguments within the `impl` block from `ContractState` to `ComponentState<TContractState>`.

## Using Components Inside a Contract

To integrate a component into a contract:

1.  Declare it using the `component!()` macro, specifying its path, a name for its storage variable in the contract, and a name for its event variant.
2.  Add the component's storage and event types to the contract's `Storage` and `Event` structs, respectively. The storage variable must be annotated with `#[substorage(v0)]`.
3.  Embed the component's logic by instantiating its generic `impl` with a concrete `ContractState` using an `impl` alias annotated with `#[abi(embed_v0)]`.

```cairo
#[starknet::contract]
mod MyContract {
    // Declare the component
    component!(path: MyComponent, storage: my_comp_storage, event: MyComponentEvent);

    // Embed the component's logic
    #[abi(embed_v0)]
    impl MyComponentImpl = MyComponent::MyComponentImpl<ContractState>;

    #[storage]
    struct Storage {
        // Contract's own storage
        my_data: u128,
        // Component's storage, annotated with substorage
        #[substorage(v0)]
        my_comp_storage: MyComponent::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        // Contract's own events
        MyDataUpdated: MyDataUpdated,
        // Component's events
        MyComponentEvent: MyComponent::Event,
    }

    // ... rest of the contract
}
```

The component's functions can then be called externally using a dispatcher instantiated with the contract's address.

## Component Dependencies

Components can depend on other components. A component cannot be embedded within another component directly, but it can utilize another component's functionality. This is achieved by adding a generic constraint to the `impl` block that requires the `TContractState` to implement the `HasComponent` trait of the dependency component.

Within the `impl` block, the `get_dep_component!` macro (for read access) or `get_dep_component_mut!` macro (for mutable access) is used to access the state of the dependent component.

```cairo
// Example of a component depending on another (Ownable)
#[starknet::component]
pub mod OwnableCounterComponent {
    use super::OwnableComponent; // Assuming OwnableComponent is in scope
    use OwnableComponent::{HasComponent as OwnerHasComponent}; // Alias for clarity

    #[storage]
    pub struct Storage {
        value: u32,
    }

    #[embeddable_as(OwnableCounterImpl)]
    impl OwnableCounter<
        TContractState,
        +HasComponent<TContractState>,
        +Drop<TContractState>,
        impl Owner: OwnerHasComponent<TContractState>, // Dependency constraint
    > of super::IOwnableCounter<ComponentState<TContractState>> {
        fn get_counter(self: @ComponentState<TContractState>) -> u32 {
            self.value.read()
        }

        fn increment(ref self: ComponentState<TContractState>) {
            // Accessing the dependent component's state
            let ownable_comp = get_dep_component!(@self, Owner);
            ownable_comp.assert_only_owner(); // Using a function from the dependency
            self.value.write(self.value.read() + 1);
        }
    }
}
```

## Example: An Ownable Component

This example demonstrates an `Ownable` component that manages contract ownership.

### Interface (`IOwnable`)

```cairo
#[starknet::interface]
trait IOwnable<TContractState> {
    fn owner(self: @TContractState) -> ContractAddress;
    fn transfer_ownership(ref self: TContractState, new_owner: ContractAddress);
    fn renounce_ownership(ref self: TContractState);
}
```

### Component Implementation (`OwnableComponent`)

```cairo
#[starknet::component]
pub mod OwnableComponent {
    use core::num::traits::Zero;
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use starknet::{ContractAddress, get_caller_address};
    // Assuming Errors enum is defined elsewhere or in scope
    // use super::Errors;

    #[storage]
    pub struct Storage {
        owner: ContractAddress,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        OwnershipTransferred: OwnershipTransferred,
    }

    #[derive(Drop, starknet::Event)]
    struct OwnershipTransferred {
        previous_owner: ContractAddress,
        new_owner: ContractAddress,
    }

    // Embeddable implementation of the interface
    #[embeddable_as(OwnableImpl)]
    impl Ownable<
        TContractState, +HasComponent<TContractState>,
    > of super::IOwnable<ComponentState<TContractState>> {
        fn owner(self: @ComponentState<TContractState>) -> ContractAddress {
            self.owner.read()
        }

        fn transfer_ownership(
            ref self: ComponentState<TContractState>, new_owner: ContractAddress,
        ) {
            // assert!(!new_owner.is_zero(), Errors::ZERO_ADDRESS_OWNER); // Assuming Errors enum
            self.assert_only_owner();
            self._transfer_ownership(new_owner);
        }

        fn renounce_ownership(ref self: ComponentState<TContractState>) {
            self.assert_only_owner();
            self._transfer_ownership(Zero::zero());
        }
    }

    // Internal functions implementation
    #[generate_trait]
    pub impl InternalImpl<
        TContractState, +HasComponent<TContractState>,
    > of InternalTrait<TContractState> {
        fn initializer(ref self: ComponentState<TContractState>, owner: ContractAddress) {
            self._transfer_ownership(owner);
        }

        fn assert_only_owner(self: @ComponentState<TContractState>) {
            let owner: ContractAddress = self.owner.read();
            let caller: ContractAddress = get_caller_address();
            // assert!(!caller.is_zero(), Errors::ZERO_ADDRESS_CALLER); // Assuming Errors enum
            // assert!(caller == owner, Errors::NOT_OWNER); // Assuming Errors enum
        }

        fn _transfer_ownership(
            ref self: ComponentState<TContractState>, new_owner: ContractAddress,
        ) {
            let previous_owner: ContractAddress = self.owner.read();
            self.owner.write(new_owner);
            self
                .emit(
                    OwnershipTransferred { previous_owner: previous_owner, new_owner: new_owner },
                );
        }
    }
}
```

## Components Under the Hood

Components leverage "embeddable impls." An `impl` of a Starknet interface trait can be made embeddable using `#[starknet::embeddable]` or `#[starknet::embeddable_as(name)]`. When embedded, these impls add entry points to a contract's ABI.

Components build on this by providing generic component logic. When a component is used in a contract, the `component!()` macro automatically generates a `HasComponent<TContractState>` trait. This trait provides functions like `get_component` and `get_component_mut` to bridge between the contract's generic `TContractState` and the component's specific `ComponentState<TContractState>`. The `#[embeddable_as(name)]` attribute on the component's `impl` block defines how the compiler generates the final embeddable impl that adapts the `ComponentState` arguments to the contract's `ContractState`.

## Stacking Components

The true power of components lies in their composability. Multiple components can be stacked together in a single contract, each adding its features. Libraries like OpenZeppelin provide pre-built, audited components for common functionalities (e.g., ERC20, Access Control, Pausable) that developers can combine to build complex contracts efficiently.

Contract Upgradeability

# Contract Upgradeability

Starknet's upgradeability mechanism relies on the distinction between contract classes (the code) and contract instances (deployed contracts with their own storage). Multiple contracts can share the same class, and a contract can be upgraded to a new class.

## How Upgradeability Works in Starknet

A contract class is represented by a `ClassHash`. Before a contract can be deployed, its class hash must be declared. A contract instance is a deployed contract associated with a specific class, possessing its own storage.

## Replacing Contract Classes

### The `replace_class_syscall`

The `replace_class` system call allows a deployed contract to update its source code by changing its associated class hash. To implement this, an entry point in the contract should execute `starknet::syscalls::replace_class_syscall` with the new class hash.

```cairo
use core::num::traits::Zero;
use starknet::{ClassHash, syscalls};

fn upgrade(new_class_hash: ClassHash) {
    assert!(!new_class_hash.is_zero(), "Class hash cannot be zero");
    syscalls::replace_class_syscall(new_class_hash).unwrap();
}
```

<span class="caption">Listing: Exposing `replace_class_syscall` to update the contract's class</span>

If a contract is deployed without a dedicated upgrade mechanism, its class hash can still be replaced using library calls.

### Class Hash Management Example

The `ClassHash` type represents the hash of a contract's code. It's used to deploy multiple contracts from the same code or to upgrade a contract.

```cairo
use starknet::ClassHash;

#[starknet::interface]
pub trait IClassHashExample<TContractState> {
    fn get_implementation_hash(self: @TContractState) -> ClassHash;
    fn upgrade(ref self: TContractState, new_class_hash: ClassHash);
}

#[starknet::contract]
mod ClassHashExample {
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use starknet::syscalls::replace_class_syscall;
    use super::ClassHash;

    #[storage]
    struct Storage {
        implementation_hash: ClassHash,
    }

    #[constructor]
    fn constructor(ref self: ContractState, initial_class_hash: ClassHash) {
        self.implementation_hash.write(initial_class_hash);
    }

    #[abi(embed_v0)]
    impl ClassHashExampleImpl of super::IClassHashExample<ContractState> {
        fn get_implementation_hash(self: @ContractState) -> ClassHash {
            self.implementation_hash.read()
        }

        fn upgrade(ref self: ContractState, new_class_hash: ClassHash) {
            replace_class_syscall(new_class_hash).unwrap();
            self.implementation_hash.write(new_class_hash);
        }
    }
}
```

## OpenZeppelin's Upgradeable Component

OpenZeppelin Contracts for Cairo offers the `UpgradeableComponent` to simplify adding upgradeability. It's often used with the `OwnableComponent` for access control, restricting upgrades to the contract owner.

### Usage

The `UpgradeableComponent` provides:

- An internal `upgrade` function for safe class replacement.
- An `Upgraded` event emitted upon successful upgrade.
- Protection against upgrading to a zero class hash.

```cairo
#[starknet::contract]
mod UpgradeableContract {
    use openzeppelin_access::ownable::OwnableComponent;
    use openzeppelin_upgrades::UpgradeableComponent;
    use openzeppelin_upgrades::interface::IUpgradeable;
    use starknet::{ClassHash, ContractAddress};

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);
    component!(path: UpgradeableComponent, storage: upgradeable, event: UpgradeableEvent);

    // Ownable Mixin
    #[abi(embed_v0)]
    impl OwnableMixinImpl = OwnableComponent::OwnableMixinImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    // Upgradeable
    impl UpgradeableInternalImpl = UpgradeableComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        #[substorage(v0)]
        upgradeable: UpgradeableComponent::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        #[flat]
        UpgradeableEvent: UpgradeableComponent::Event,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        self.ownable.initializer(owner);
    }

    #[abi(embed_v0)]
    impl UpgradeableImpl of IUpgradeable<ContractState> {
        fn upgrade(ref self: ContractState, new_class_hash: ClassHash) {
            // This function can only be called by the owner
            self.ownable.assert_only_owner();

            // Replace the class hash upgrading the contract
            self.upgradeable.upgrade(new_class_hash);
        }
    }
}
```

<span class="caption">Listing: Integrating OpenZeppelin's Upgradeable component in a contract</span>

## Security Considerations

Upgrades are sensitive operations requiring careful consideration:

- **API Changes:** Modifications to function signatures can break integrations.
- **Storage Changes:** Altering storage variable names, types, or organization can lead to data loss or corruption. Collisions can occur if storage slots are reused.
- **Backwards Compatibility:** Ensure compatibility with previous versions, especially when upgrading OpenZeppelin Contracts.

Always ensure that only authorized roles can perform upgrades, pauses, or other critical functions. Use components like `OwnableComponent` to guard these privileged paths.

```cairo
// components
component!(path: OwnableComponent, storage: ownable);
component!(path: UpgradeableComponent, storage: upgradeable, event: UpgradeableEvent);

#[abi(embed_v0)]
impl OwnableImpl = OwnableComponent::OwnableImpl<ContractState>;
impl InternalUpgradeableImpl = UpgradeableComponent::InternalImpl<ContractState>;

#[event]
fn Upgraded(new_class_hash: felt252) {}

fn upgrade(ref self: ContractState, new_class_hash: ClassHash) {
    self.ownable.assert_only_owner();
    self.upgradeable._upgrade(new_class_hash);
    Upgraded(new_class_hash); // emit explicit upgrade event
}
```

L1-L2 Messaging

# L1-L2 Messaging

Starknet features a distinct `L1-L2` messaging system, separate from its consensus mechanism and state update submissions. This system enables "cross-chain" transactions, allowing smart contracts on different chains to interact. For instance, computations performed on one chain can be utilized on another. Bridges on Starknet heavily rely on this `L1-L2` messaging.

Key characteristics of Starknet's messaging system:

- **Asynchronous**: Results of messages sent to the other chain cannot be awaited within the contract code execution.
- **Asymmetric**:
  - `L1->L2`: Messages are automatically delivered to the target L2 contract by the Starknet sequencer.
  - `L2->L1`: Only the hash of the message is sent to L1 by the sequencer; it must be consumed manually via an L1 transaction.

## The StarknetMessaging Contract

The core component of the `L1-L2` messaging system is the [`StarknetCore`][starknetcore etherscan] contract deployed on Ethereum. Within `StarknetCore`, the `StarknetMessaging` contract is responsible for passing messages between Starknet and Ethereum. It exposes an interface with functions to send messages to L2, receive messages from L2 on L1, and cancel messages.

```js
interface IStarknetMessaging is IStarknetMessagingEvents {

    function sendMessageToL2(
        uint256 toAddress,
        uint256 selector,
        uint256[] calldata payload
    ) external returns (bytes32);

    function consumeMessageFromL2(uint256 fromAddress, uint256[] calldata payload)
        external
        returns (bytes32);

    function startL1ToL2MessageCancellation(
        uint256 toAddress,
        uint256 selector,
        uint256[] calldata payload,
        uint256 nonce
    ) external;

    function cancelL1ToL2Message(
        uint256 toAddress,
        uint256 selector,
        uint256[] calldata payload,
        uint256 nonce
    ) external;
}
```

<span class="caption"> Starknet messaging contract interface</span>

### Sending Messages from Ethereum to Starknet (L1->L2)

To send messages from Ethereum to Starknet, your Solidity contracts must call the `sendMessageToL2` function of the `StarknetMessaging` contract. The Starknet sequencer monitors logs emitted by `StarknetMessaging` and executes an `L1HandlerTransaction` to call the target L2 contract. This process typically takes 1-2 minutes.

**Fees**:

- A minimum of 20,000 wei must be sent with the message to register its hash in Ethereum's storage.
- Additional L1 fees are required for the `L1HandlerTransaction` to cover deserialization and processing costs on L2. These fees can be estimated using tools like `starkli` or `snforge`.

The `sendMessageToL2` function signature is:

```js
function sendMessageToL2(
    uint256 toAddress,
    uint256 selector,
    uint256[] calldata payload
) external override returns (bytes32);
```

- `toAddress`: The target contract address on L2.
- `selector`: The selector of the function on the L2 contract. This function must be annotated with `#[l1_handler]`.
- `payload`: An array of `felt252` values (represented as `uint256` in Solidity).

**Example (Solidity)**:

```js
// Sends a message on Starknet with a single felt.
function sendMessageFelt(
    uint256 contractAddress,
    uint256 selector,
    uint256 myFelt
)
    external
    payable
{
    // We "serialize" here the felt into a payload, which is an array of uint256.
    uint256[] memory payload = new uint256[](1);
    payload[0] = myFelt;

    // msg.value must always be >= 20_000 wei.
    _snMessaging.sendMessageToL2{value: msg.value}(
        contractAddress,
        selector,
        payload
    );
}
```

On the Starknet side, functions intended to receive L1 messages must be annotated with `#[l1_handler]`. It's crucial to verify the sender's address (`from_address`) to ensure messages originate from trusted L1 contracts.

**Example (Cairo)**:

```cairo,noplayground
#[l1_handler]
fn msg_handler_felt(ref self: ContractState, from_address: felt252, my_felt: felt252) {
    assert!(from_address == self.allowed_message_sender.read(), "Invalid message sender");

    // You can now use the data, automatically deserialized from the message payload.
    assert!(my_felt == 123, "Invalid value");
}
```

### Sending Messages from Starknet to Ethereum (L2->L1)

To send messages from Starknet to Ethereum, use the `send_message_to_l1_syscall` within your Cairo contracts. This syscall sends messages to the `StarknetMessaging` contract on L1. These messages are not automatically consumed; they require a manual call to `consumeMessageFromL2` on L1.

**Example (Cairo)**:

```cairo,noplayground
        fn send_message_felt(ref self: ContractState, to_address: EthAddress, my_felt: felt252) {
            // Note here, we "serialize" my_felt, as the payload must be
            // a `Span<felt252>`.
            syscalls::send_message_to_l1_syscall(to_address.into(), array![my_felt].span())
                .unwrap();
        }
```

The `send_message_to_l1_syscall` arguments are:

- `class_hash`: The hash of the class you want to use.
- `function_selector`: A selector for a function within that class, computed with the `selector!` macro.
- `calldata`: The calldata.

**Example (Cairo `send_message_to_l1` syscall)**:

```cairo,noplayground
pub extern fn send_message_to_l1_syscall(
    to_address: felt252, payload: Span<felt252>,
) -> SyscallResult<()> implicits(GasBuiltin, System) nopanic;
```

On L1, your Solidity contract must call `consumeMessageFromL2`, providing the L2 contract address that sent the message and the payload. The `consumeMessageFromL2` function verifies the message's integrity.

**Example (Solidity)**:

```js
function consumeMessageFelt(
    uint256 fromAddress,
    uint256[] calldata payload
)
    external
{
    let messageHash = _snMessaging.consumeMessageFromL2(fromAddress, payload);

    // You can use the message hash if you want here.

    // We expect the payload to contain only a felt252 value (which is a uint256 in Solidity).
    require(payload.length == 1, "Invalid payload");

    uint256 my_felt = payload[0];

    // From here, you can safely use `my_felt` as the message has been verified by StarknetMessaging.
    require(my_felt > 0, "Invalid value");
}
```

Note that `consumeMessageFromL2` uses `msg.sender` internally to compute the message hash, so the Solidity contract calling it must match the `to_address` provided in the L2 `send_message_to_l1_syscall`.

## Cairo Serde

When sending messages between L1 and L2, data must be serialized into an array of `felt252`. Since `felt252` is slightly smaller than Solidity's `uint256`, careful serialization is required to avoid message failure. Values exceeding the maximum `felt252` limit will cause messages to be stuck.

For example, a `u256` type in Cairo is represented as:

```cairo,does_not_compile
struct u256 {
    low: u128,
    high: u128,
}
```

This `u256` will be serialized into **two** `felt252` values (one for `low`, one for `high`). Therefore, sending a single `u256` from L1 to L2 requires a payload with two `uint256` elements in Solidity.

**Example (Solidity serialization of `u256`)**:

```js
uint256[] memory payload = new uint256[](2);
// Let's send the value 1 as a u256 in cairo: low = 1, high = 0.
payload[0] = 1;
payload[1] = 0;
```

For more details, refer to the [Starknet documentation][starknet messaging doc] or the [detailed guide][glihm messaging guide].

[starknetcore etherscan]: https://etherscan.io/address/0xc662c410C0ECf747543f5bA90660f6ABeBD9C8c4
[IStarknetMessaging]: https://github.com/starkware-libs/cairo-lang/blob/4e233516f52477ad158bc81a86ec2760471c1b65/src/starkware/starknet/eth/IStarknetMessaging.sol#L6
[messaging contract]: https://github.com/glihm/starknet-messaging-dev/blob/main/solidity/src/ContractMsg.sol
[starknet addresses]: https://docs.starknet.io/documentation/tools/important_addresses/
[starknet messaging doc]: https://docs.starknet.io/documentation/architecture_and_concepts/Network_Architecture/messaging-mechanism/
[glihm messaging guide]: https://github.com/glihm/starknet-messaging-dev

Oracles and Randomness

# Oracles and Randomness

Oracles are essential for bringing off-chain data to the Starknet blockchain, enabling smart contracts to access real-world information like asset prices or weather data. Verifiable Random Functions (VRFs) provided by oracles are crucial for applications requiring unpredictable randomness, such as gaming or NFT generation, ensuring fairness and transparency.

## Oracles

Oracles act as secure intermediaries, transmitting external data to blockchains and smart contracts. This section details interactions with the Pragma oracle on Starknet.

### Pragma Oracle for Price Feeds

Pragma is a zero-knowledge oracle providing verifiable off-chain data on Starknet.

#### Setting Up Your Contract for Price Feeds

1.  **Add Pragma as a Project Dependency**:
    Edit your `Scarb.toml` file:
    ```toml
    [dependencies]
    pragma_lib = { git = "https://github.com/astraly-labs/pragma-lib"
    ```

Development Tools and Best Practices

# Development Tools and Best Practices

### Starkli Tooling

Ensure your `starkli` version is up-to-date. The recommended version is `0.3.6`. You can check your version with `starkli --version` and upgrade using `starkliup` or `starkliup -v 0.3.6`.

To retrieve a smart wallet's class hash using `starkli`, use:

```bash
starkli class-hash-at <SMART_WALLET_ADDRESS> --rpc http://0.0.0.0:5050
```

### Contract Deployment

Declare contracts using the `starkli declare` command:

```bash
starkli declare target/dev/listing_99_12_vote_contract_Vote.contract_class.json --rpc http://0.0.0.0:5050 --account katana-0
```

If you encounter `compiler-version` errors, ensure `starkli` is updated or specify the compiler version using `--compiler-version x.y.z`.

The class hash for a contract can be verified. For example, `0x06974677a079b7edfadcd70aa4d12aac0263a4cda379009fca125e0ab1a9ba52` is a known class hash.

The `--rpc` flag points to the RPC endpoint (e.g., from `katana`), and `--account` specifies the signing account. Transactions on local nodes finalize immediately, while testnets may take seconds.

### Smart Contract Best Practices

#### Deployment Safety

- **`deploy_syscall(deploy_from_zero=true)` Collisions**: Setting `deploy_from_zero` to `true` can lead to collisions if multiple contracts are deployed with identical calldata. Use `deploy_from_zero=false` unless deterministic deployment from zero is explicitly intended.
- **Avoid `get_caller_address().is_zero()` Checks**: These checks, inherited from Solidity, are ineffective on Starknet as `get_caller_address()` never returns the zero address.

#### Bridging Safety (L1-L2 Interactions)

- **L1 Handler Caller Validation**: Entrypoints marked with `#[l1_handler]` are callable from L1. It is crucial to validate the caller address to ensure calls originate from trusted L1 contracts.

  ```cairo, noplayground
  #[l1_handler]
  fn handle_deposit(
      ref self: ContractState,
      from_address: ContractAddress,
      account: ContractAddress,
      amount: u256
  ) {
      let l1_bridge = self._l1_bridge.read();
      assert!(!l1_bridge.is_zero(), 'UNINIT_BRIDGE');
      assert!(from_address == l1_bridge, 'ONLY_L1_BRIDGE');
      // credit account…
  }
  ```

#### Economic/DoS & Griefing Vulnerabilities

- **Unbounded Loops**: User-controlled iterations in functions (e.g., claims, batch withdrawals) can exceed Starknet's step limit. Cap the number of iterations or implement pagination to split work across multiple transactions. An unbounded list of items in storage, for instance, could be exploited to make a function run indefinitely until it hits the execution step limit.

Cairo Virtual Machine (VM) and Execution

Introduction to Cairo and its Virtual Machine (VM)

# Introduction to Cairo and its Virtual Machine (VM)

Cairo programs are compiled by the Cairo Compiler and then executed by the Cairo Virtual Machine (VM). The VM generates an execution trace used by the Prover to create a STARK proof, which is later verified by a Verifier. The upcoming chapters will detail the Cairo VM's architecture, memory model, execution model, builtins, hints, and the runner.

## Virtual Machine

A Virtual Machine (VM) is a software emulation of a physical computer, providing a complete programming environment through an API for program execution. Every VM has an Instruction Set Architecture (ISA) for expressing programs, which can be a standard ISA (like RISC-V) or a dedicated one (like Cairo assembly, CASM).

There are two types of VMs:

- **System Virtual Machines**: Emulate an operating system (e.g., Xen, VMWare).
- **Process Virtual Machines**: Provide the environment for a single user-level process. The Java Virtual Machine (JVM) is a well-known example. A Java program is compiled to Java bytecode, which the JVM verifies for safety. The bytecode is then either interpreted or Just-In-Time (JIT) compiled to machine code during execution.

Cairo VM Architecture and Execution Flow

# Cairo VM Architecture and Execution Flow

## Execution Model

The CPU architecture of the Cairo VM defines how the VM processes instructions and changes its state, mirroring a physical CPU's fetch-decode-execute cycle. The VM's execution model is defined by its registers, a unique instruction set architecture, and the VM's state transition function.

### Registers

The Cairo VM has three dedicated registers:

- **`pc` (Program Counter):** Holds the memory address of the next instruction. It's incremented after most instructions, but jump and call instructions can alter it.
- **`ap` (Allocation Pointer):** Acts as a stack pointer, typically pointing to the next free memory cell. Many instructions increment `ap` by 1.
- **`fp` (Frame Pointer):** Provides a stable reference for the current function's execution context (stack frame). It's set to the current `ap` when a function is called, allowing reliable access to arguments and return addresses.

The state of the VM at any moment is defined by the values of these three registers.

## Instructions and Opcodes

A Cairo instruction is a 64-bit field element containing three 16-bit signed offsets (`off_dst`, `off_op0`, `off_op1`) and 15 boolean flags that dictate register usage, operations, and state updates.

The VM supports three core opcodes:

1.  **`CALL`**: Saves the current context (`fp` and return `pc`) to the stack and initiates a function call.
2.  **`RET`**: Restores the caller's context from the stack, executing a function return.
3.  **`ASSERT_EQ`**: Enforces an equality constraint.

### Cairo Assembly (CASM)

CASM is the human-readable assembly language for Cairo, representing machine instructions textually. Each line of CASM corresponds to a specific instruction.

## State Transition

The state of the Cairo VM at step \(i\) is defined by \((pc*i, ap_i, fp_i)\). The **state transition function** deterministically computes the next state \((pc*{i+1}, ap*{i+1}, fp*{i+1})\) based on the current state and the fetched instruction. This process is part of the algebraic constraints in the Cairo AIR; if all steps satisfy the constraints, a proof can be generated.

Each step checks one instruction and enforces its semantics as algebraic constraints. For example, an instruction might load values from memory, perform a computation, write to memory, and update the `pc`, `ap`, and `fp` registers. These rules are deterministic, ensuring a single valid next state. If any step violates the constraints, the execution cannot be proven.

### Deterministic and Non-deterministic Cairo Machine

- **Deterministic Machine:** Used by the prover. It takes a trace and the whole memory, verifying that the transition between consecutive states is valid. It returns `accept` if all transitions are valid, `reject` otherwise.
- **Non-deterministic Machine:** Used by the verifier. It takes the initial and final states and public memory. It returns `accept` if a valid trace and memory extension exist that the deterministic machine accepts. This allows for succinct, zero-knowledge verification.

The Cairo Runner is the entrypoint for running a Cairo program and generating the AIR inputs needed for proof.

## Circuit Evaluation

To evaluate a circuit and obtain results, you first initialize inputs by calling `next` on each `CircuitInputAccumulator` variant. After initialization, the `done` function provides the complete circuit data.

Define the modulus (e.g., BN254 prime field modulus) using `CircuitModulus`. The evaluation is performed using `instance.eval(bn254_modulus).unwrap()`. Results for specific gates can be retrieved using `res.get_output(gate_element)`.

```cairo
# use core::circuit::{
#     AddInputResultTrait, CircuitElement, CircuitInput, CircuitInputs, CircuitModulus,
#     CircuitOutputsTrait, EvalCircuitTrait, circuit_add, circuit_mul, u384,
# };
#
# // Circuit: a * (a + b)
# // witness: a = 10, b = 20
# // expected output: 10 * (10 + 20) = 300
# fn eval_circuit() -> (u384, u384) {
#     let a = CircuitElement::<CircuitInput<0>> {};
#     let b = CircuitElement::<CircuitInput<1>> {};
#
#     let add = circuit_add(a, b);
#     let mul = circuit_mul(a, add);
#
#     let output = (mul,);
#
#     let mut inputs = output.new_inputs();
#     inputs = inputs.next([10, 0, 0, 0]);
#     inputs = inputs.next([20, 0, 0, 0]);
#
#     let instance = inputs.done();
#
#     let bn254_modulus = TryInto::<_,
#         CircuitModulus,
#     >::try_into([0x6871ca8d3c208c16d87cfd47, 0xb85045b68181585d97816a91, 0x30644e72e131a029, 0x0])
#         .unwrap();
#
    let res = instance.eval(bn254_modulus).unwrap();
#
#     let add_output = res.get_output(add);
#     let circuit_output = res.get_output(mul);
#
#     assert!(add_output == u384 { limb0: 30, limb1: 0, limb2: 0, limb3: 0 }, "add_output");
#     assert!(circuit_output == u384 { limb0: 300, limb1: 0, limb2: 0, limb3: 0 }, "circuit_output");
#
#     (add_output, circuit_output)
# }
#
# #[executable]
# fn main() {
#     eval_circuit();
# }
```

## Program Execution Flow

A Cairo program `prgm.cairo` is compiled into `prgm.json`, containing Cairo bytecode (encoded CASM and extra data). The Cairo VM interprets this CASM and generates an execution trace. This trace data is then used by the Cairo Prover to generate a STARK proof, verifying the program's correct execution.

Each instruction and its arguments increment the Program Counter (PC) by 1. Instructions like `call` and `ret` manage a function stack.

- **`call rel offset`**: Increments the PC by `offset` and jumps to the new location.
- **`ret`**: Jumps back to the instruction immediately following the corresponding `call`.

For example:

- `call rel 3` increments PC by 3, then `call rel 9` increments PC by 9.
- `[ap + 0] = 2, ap++` stores `2` in the next free memory cell pointed to by `ap` and increments `ap`.
- `ret` jumps back after the `call` instruction.

## Memory Model

The Cairo VM follows a Von Neumann architecture where a single memory space stores both program instructions and data. The memory is non-deterministic and read-only for the verifier.

### Relocatable Values and Memory Space

Relocatable values are represented as `Segment:Offset`. After execution, these values are converted into a contiguous linear memory address space using a relocation table. The relocation table maps segment identifiers to their starting indices in the linear memory.

Example memory and relocation table:

```
Addr  Value
-----------
// Segment 0
0:0   5189976364521848832
0:1   10
...
// Segment 1
1:0   2:0
...
// Segment 2
2:0   110
```

**From relocation value to one contiguous memory address space:**

```
Addr  Value
-----------
1     5189976364521848832
2     10
...
13    22
14    23
...
22    110
```

**Relocation table:**

```
segment_id  starting_index
----------------------------
0            1
1            13
2            22
```

Cairo VM Memory Model

# Cairo VM Memory Model

The Cairo VM memory model is designed to be efficient for proof generation, functioning as a write-once system. This contrasts with traditional read-write memory models found in systems like the EVM.

## Overview

In the Cairo VM, memory is crucial not only for storing temporary values during execution but also for recording memory accesses within trace cells to facilitate proof generation. The model prioritizes streamlining the STARK proving process.

## Non-Deterministic Read-only Memory

Cairo employs a non-deterministic, read-only memory model, which effectively behaves as a write-once memory:

1.  **Non-determinism**: Memory addresses and their values are asserted by the prover rather than being managed by a traditional memory system. For instance, the prover asserts that value `7` is stored at address `x`, without needing to explicitly check its existence.
2.  **Read-only**: Once a value is written to a memory address, it cannot be overwritten. Subsequent operations can only read or verify the existing value.

The memory address space is contiguous; if addresses `x` and `y` are accessed, no address between them can be skipped. The cost of using Cairo's memory is primarily determined by the number of memory accesses, not the number of addresses used. Rewriting to an existing cell incurs a similar cost to writing to a new one. This write-once characteristic simplifies constraint formulation for proving program correctness.

## Memory Segments

Cairo organizes memory addresses into **segments**, allowing for dynamic expansion while ensuring immutability after writing. Each memory address is initially associated with a **relocatable value**, represented as `<segment_id>:<offset>`. At the end of execution, these relocatable values are transformed into a single, contiguous memory address space, accompanied by a **relocation table**.

Cairo's memory model includes the following segments:

- **Program Segment**: Stores the bytecode (instructions) of the Cairo program. The Program Counter (`pc`) starts at the beginning of this segment. This segment has a fixed size during execution.
- **Execution Segment**: Stores execution data such as temporary variables, function call frames, and pointers. The Allocation Pointer (`ap`) and Frame Pointer (`fp`) start in this segment.
- **Builtin Segment**: Stores builtins actively used by the program. Each builtin has its own dedicated segment, allocated dynamically.
- **User Segment**: Stores program outputs, arrays, and dynamically allocated data structures.

Segments 1 onwards (Execution, Builtin, User) have dynamic address spaces whose lengths are unknown until program completion.

The standard layout of memory segments is:

1.  Segment 0: Program Segment
2.  Segment 1: Execution Segment
3.  Segment 2 to x: Builtin Segments
4.  Segment x + 1 to y: User Segments

The number of builtin and user segments is dynamic.

## Relocation

During execution, memory addresses are managed with relocatable values. At the end of execution, these are mapped to a single, contiguous linear memory address space. A relocation table provides context for this linear space.

Consider the following Cairo Zero program example:

```cairo
%builtins output

func main(output_ptr: felt*) -> (output_ptr: felt*) {

    // We are allocating three different values to segment 1.
    [ap] = 10, ap++;
    [ap] = 100, ap++;
    [ap] = [ap - 2] + [ap - 1], ap++;

    // We set value of output_ptr to the address of where the output will be stored.
    // This is part of the output builtin requirement.
    [ap] = output_ptr, ap++;

    // Asserts that output_ptr equals to 110.
    assert [output_ptr] = 110;

    // Returns the output_ptr + 1 as the next unused memory address.
    return (output_ptr=output_ptr + 1);
}
```

This program stores `10`, `100`, and `110` (the sum) in Segment 1. The `output_ptr` also interacts with the output builtin, which handles a dedicated memory region for program outputs.

## Built-in Segments (Output and Segment Arena)

### Output Builtin

The Output Builtin manages a dedicated memory region, often referred to as **public memory**, where program outputs are stored. These outputs are made available in the proof system for verification. The output segment is a contiguous block of cells, and all its cells are public and accessible to verifiers.

Its role in STARK proofs includes:

1.  **Public Commitment**: Values written to `output_ptr` are committed in the public memory as part of the proof.
2.  **Proof Structure**: The output segment is included in the public input of a trace, with its boundaries tracked for verification.
3.  **Verification Process**: Verifiers extract and hash the output segment to create a commitment, allowing verification without re-execution.

### Segment Arena Builtin

The Segment Arena builtin manages dynamic memory segments, such as those used for dictionaries. It tracks segment allocations, their sizes, and ensures rules like each segment being allocated and finalized exactly once are followed. Snapshots of the Segment Arena show how segments are allocated and potentially how errors occur due to invalid states or inconsistent tracking of segments and squashing operations.

Key validation rules for the Segment Arena include:

- Each segment must be allocated and finalized exactly once.
- All cell values must be valid field elements.
- Segment sizes must be non-negative.
- Squashing operations must maintain sequential order.
- Info segment entries must correspond to segment allocations.

Cairo Builtins: Cryptographic and Arithmetic Operations

### Cairo Builtins: Cryptographic and Arithmetic Operations

The Cairo Virtual Machine (VM) provides several built-in components that facilitate cryptographic and arithmetic operations, essential for smart contract development and ZK-proofs. These built-ins are optimized for efficiency and security within the Cairo execution environment.

#### Keccak Builtin

The Keccak builtin computes the Keccak-256 hash of a given input.

##### Syscall Signature

```cairo,noplayground
pub extern fn keccak_syscall(
    input: Span<u64>,
) -> SyscallResult<u256> implicits(GasBuiltin, System) nopanic;
```

##### Description

Computes the Keccak-256 hash of a given input.

##### Arguments

- `input`: A `Span<u64>` representing the Keccak-256 input.

##### Return Values

- `SyscallResult<u256>`: The computed hash result.

##### Deduction Property

This builtin utilizes a block of 8 input cells and 8 output cells. The Keccak-f1600 permutation is computed on the entire state when any of the output cells are read. This computation happens only once per block and its result is cached.

##### Error Conditions

- If any input cell contains a value exceeding 200 bits (≥ 2^200).
- If any input cell contains a relocatable value (pointer) instead of a field element.
- If an output cell is read before all eight input cells have been initialized.

#### ECDSA Builtin

The ECDSA (Elliptic Curve Digital Signature Algorithm) builtin verifies cryptographic signatures on the STARK curve. It is primarily used to validate that a message hash was signed by the holder of a specific private key.

##### Memory Organization

The ECDSA builtin has a dedicated memory segment for storing public keys and message hashes as field elements, alongside a Signature Dictionary that maps public key offsets to their corresponding signatures.

##### Cell Layout in the Memory Segment

The ECDSA segment arranges cells in pairs:

- **Even offsets** (0, 2, 4, ...) store public keys.
- **Odd offsets** (1, 3, 5, ...) store message hashes.
  Each public key at offset `2n` is associated with a message hash at offset `2n+1`.

##### Signature Verification Process

Before using the ECDSA builtin, signatures must be explicitly registered in the signature dictionary. The VM performs signature verification when the program writes values to the ECDSA segment:

1.  When a public key is written at offset `2n`, the VM checks if it matches the key used to create the signature registered at that offset.
2.  When a message hash is written at offset `2n+1`, the VM verifies that it matches the hash that was signed.
    If either check fails, the VM throws an error immediately.

##### Error Conditions

- **Invalid Hash Error**: Occurs when a program writes a hash that does not match the hash that was signed with the corresponding public key.
- **Invalid Public Key Error**: Occurs when a program writes a public key that does not match the public key used to create the signature.

#### Poseidon Builtin

The Poseidon builtin computes cryptographic hashes using the Poseidon hash function, which is specifically optimized for zero-knowledge proofs and efficient computation in algebraic circuits. It uses the Hades permutation strategy.

##### Cells Organization

The Poseidon builtin operates with a dedicated memory segment and follows a deduction property pattern with 6 consecutive cells:

- **Input cells [0-2]**: Store input state for the Hades permutation.
- **Output cells [3-5]**: Store computed permutation results.

##### How it Works

Each operation works with a block of 3 inputs followed by 3 outputs. When a program reads any output cell, the VM applies the Hades permutation to the input cells and populates all three output cells with the results.

##### Single Value Hashing Example

For hashing a single value (e.g., 42):

1.  The program writes the value to the first input cell (position 3:0).
2.  The other input cells remain at their default value (0).
3.  When reading the output cell (3:3), the VM:
    - Takes the initial state (42, 0, 0).
    - Applies padding: (42+1, 0, 0) = (43, 0, 0).
    - Computes the Hades permutation.
    - Stores the result in output cell 3:3.

##### Sequence Hashing Example

For hashing a sequence of values (e.g., 73, 91):

1.  The program writes values to the first two input cells (positions 3:6 and 3:7).
2.  Upon reading any output cell, the VM:
    - Takes the state (73, 91, 0).
    - Applies appropriate padding: (73, 91+1, 0).
    - Computes the Hades permutation.
    - Stores all three results in the output cells (3:9, 3:10, 3:11).

##### Error Condition

The Poseidon builtin can throw an error if a program attempts to write a relocatable value (pointer) to an input cell. Input validation occurs at the time the output is read, consistent with the deduction property pattern.

#### Mod Builtin (AddMod, MulMod)

The Mod Builtin handles modular arithmetic operations—specifically addition and multiplication—on field elements within a given modulus `p`. It comes in two derivations: `AddModBuiltin` for addition and `MulModBuiltin` for multiplication.

##### Under the Hood

- **Word Size**: Numbers are broken into 96-bit chunks, aligning with the `range_check96` system. A `UInt384` typically uses four 96-bit words.
- **`AddMod`**: Computes `c ≡ a + b (mod p)`. The quotient `k` (number of times `p` is subtracted to wrap the result) is limited to 2. It can solve for missing operands (e.g., find `a` given `b`, `c`, and `p`) by testing `k=0` or `k=1`.
- **`MulMod`**: Computes `c ≡ a * b (mod p)`. It uses the extended GCD algorithm for deduction. Multiplication can produce larger intermediate values, so it has higher default quotient bounds compared to `AddMod`.

##### Error Conditions

- **`MissingOperand`**: If an operand is missing when required for computation.
- **`ZeroDivisor`**: If `b` and `p` are not coprime for `MulMod`, as this prevents a unique solution.
- **Range Check Failure**: If any 96-bit word of an operand exceeds `2^96`.

#### Pedersen Builtin

The Pedersen builtin is dedicated to computing the Pedersen hash of two field elements (felts).

##### Cells Organization

The Pedersen builtin has its own dedicated memory segment and is organized in triplets of cells:

- **Input cells**: Must store field elements (felts); relocatable values (pointers) are forbidden.
- **Output cell**: The value is deduced from the input cells. When an instruction attempts to read the output cell, the VM computes the Pedersen hash of the two input cells and writes the result to the output cell.

##### Error Conditions

- An output cell is read before all input cells have been initialized.
- An input cell contains a relocatable value (pointer) instead of a field element.

#### Other Builtins

The Cairo VM implements a variety of other built-ins, each serving specific purposes in computation and proof generation. The following table lists them:

| Builtin         | Description                                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------ |
| [Output]        | Stores all the public memory needed to generate a STARK proof (input & output values, builtin pointers...).              |
| [Range Check]   | Verify that a felt `x` is within the bounds `[0, 2**128)`.                                                               |
| [Bitwise]       | Computes the bitwise AND, XOR and OR of two felts `a` and `b`. `a & b`, `a ^ b` and `a \| b`.                            |
| [EC OP]         | Performs Elliptic Curve OPerations - For two points on the STARK curve `P`, `Q` and a scalar `m`, computes `R = P + mQ`. |
| [Range Check96] | Verify that a felt `x` is within the bounds `[0, 2**96)`.                                                                |
| [Segment Arena] | Manages the Cairo dictionaries. Not used in Cairo Zero.                                                                  |
| [Gas]           | Manages the available gas during the run. Used by Starknet to handle its gas usage and avoid DoS.                        |
| [System]        | Manages the Starknet syscalls & cheatcodes.                                                                              |

[output]: ch204-02-00-output.md
[pedersen]: ch204-02-01-pedersen.md
[rc]: ch204-02-02-range-check.md
[ecdsa]: ch204-02-03-ecdsa.md
[bitwise]: ch204-02-04-bitwise.md
[ec_op]: ch204-02-05-ec-op.md
[keccak]: ch204-02-06-keccak.md
[poseidon]: ch204-02-07-poseidon.md
[rc96]: ch204-02-08-range-check-96.md
[seg_are]: ch204-02-09-segment-arena.md
[add_mod]: ch204-02-10-add-mod.md
[mul_mod]: ch204-02-11-mul-mod.md
[gas]: ch204-02-12-gas.md
[system]: ch204-02-13-system.md

Cairo Builtins: Specialized Functions

# Cairo Builtins: Specialized Functions

Builtins in Cairo are analogous to Ethereum precompiles, offering primitive operations implemented in the client's language rather than relying solely on VM opcodes. The Cairo architecture is flexible, allowing builtins to be added or removed as needed, leading to different VM layouts. Adding builtins introduces constraints to the CPU AIR, which can increase verification time. This chapter details how builtins function, the existing builtins, and their purposes.

## How Builtins Work

A builtin enforces specific constraints on Cairo memory to perform specialized tasks, such as hash computations. Each builtin operates on a dedicated memory segment, which maps to a fixed address range. This interaction method is known as "memory-mapped I/O," where specific memory address ranges are dedicated to builtins. Cairo programs interact with builtins by reading from or writing to these designated memory cells.

Builtin constraints can be categorized into two types: "validation property" and "deduction property." Builtins with a deduction property are typically divided into blocks of cells, where some cells are constrained by a validation property. If a defined property is not met, the Cairo VM will halt execution.

### Validation Property

A validation property defines the constraints a value must satisfy before it can be written to a builtin's memory cell. For instance, the Range Check builtin only accepts field elements (felts) and verifies that they fall within the range `[0, 2**128)`. A program can write to the Range Check builtin only if these constraints hold true.

The Range Check builtin validates values immediately upon writing to a cell, enabling early detection of out-of-range values.

#### Valid Operation Example

In this example, three values are successfully written to the Range Check segment: `0`, `256`, and `2^128-1`. All these values are within the permitted range `[0, 2^128-1]`.

![Range Check builtin segment with valid values](range-check-builtin-valid.png)

#### Out-of-Range Error Example

This example shows an attempt to write `2^128` to cell `2:2`, exceeding the maximum allowed value. The VM immediately throws an out-of-range error.

![Range Check error: Value exceeds maximum range](range-check-builtin-error1.png)

#### Invalid Type Error Example

Here, a relocatable address (pointer to cell `1:7`) is written to the Range Check segment. Since the builtin only accepts field elements, the VM throws an error.

![Range Check error: Value is a relocatable address](range-check-builtin-error2.png)

## Bitwise Builtin

The Bitwise Builtin facilitates bitwise operations—AND (`&`), XOR (`^`), and OR (`|`)—on field elements. It supports tasks requiring bit-level manipulation.

### How It Works

The Bitwise builtin uses a dedicated memory segment. Each operation involves a block of 5 cells:

| Offset | Description   | Role   |
| ------ | ------------- | ------ |
| 0      | x value       | Input  |
| 1      | y value       | Input  |
| 2      | x & y result  | Output |
| 3      | x ^ y result  | Output |
| 4      | x \| y result | Output |

For example, if `x = 5` (binary `101`) and `y = 3` (binary `011`):

- `5 & 3 = 1` (binary `001`)
- `5 ^ 3 = 6` (binary `110`)
- `5 | 3 = 7` (binary `111`)

### Example Usage

This Cairo function demonstrates the use of the Bitwise Builtin:

```cairo
from starkware.cairo.common.cairo_builtins import BitwiseBuiltin

func bitwise_ops{bitwise_ptr: BitwiseBuiltin*}(x: felt, y: felt) -> (and: felt, xor: felt, or: felt) {
    assert [bitwise_ptr] = x;        // Input x
    assert [bitwise_ptr + 1] = y;    // Input y
    let and = [bitwise_ptr + 2];     // x & y
    let xor = [bitwise_ptr + 3];     // x ^ y
    let or = [bitwise_ptr + 4];      // x | y
    let bitwise_ptr = bitwise_ptr + 5;
    return (and, xor, or);
}
```

## EC OP Builtin

The EC OP (Elliptic Curve Operation) builtin performs elliptic curve operations on the STARK curve, specifically computing `R = P + mQ`, where `P` and `Q` are points on the curve and `m` is a scalar. Each point is represented by its x and y coordinates as a pair of field elements.

### Cells Organization

The EC OP builtin uses a dedicated memory segment. Each operation is defined by a block of 7 cells:

| Offset | Description    | Role   |
| ------ | -------------- | ------ |
| 0      | P.x coordinate | Input  |
| 1      | P.y coordinate | Input  |
| 2      | Q.x coordinate | Input  |
| 3      | Q.y coordinate | Input  |
| 4      | m scalar value | Input  |
| 5      | R.x coordinate | Output |
| 6      | R.y coordinate | Output |

The first five cells are inputs provided by the program, and the last two cells are outputs computed by the VM upon reading.

#### Valid Operation Example

This example shows a correctly configured EC OP builtin operation with all input values set.

![EC OP builtin segment with complete input values](ecop-segment.png)

When the program reads cells at offsets 5 and 6, the VM computes `R = P + mQ` and returns the resulting coordinates.

#### Error Condition Example

This example illustrates an error condition where the program attempts to read the output cells with incomplete inputs.

![Incomplete input values in EC OP builtin segment](ecop-invalid-inputs.png)

The VM cannot compute `R = P + mQ` because the coordinates for point `Q` are missing. The EC OP builtin fails if any input value is invalid or missing. All five input cells must contain valid field elements before the output cells are accessed.

## Keccak Builtin

The Keccak builtin implements the core functionality of the SHA-3 hash functions, specifically the keccak-f1600 permutation. This is crucial for Ethereum compatibility, as Keccak-256 is used in various cryptographic operations.

### Cells Organization

The Keccak builtin uses a dedicated memory segment organized in blocks of 16 cells:

| Cell Range    | Purpose           | Description                                            |
| ------------- | ----------------- | ------------------------------------------------------ |
| First 8 cells | Input state `s`   | Each cell stores 200 bits of the 1600-bit input state  |
| Next 8 cells  | Output state `s'` | Each cell stores 200 bits of the 1600-bit output state |

The builtin processes each block independently with the following rules:

1.  **Input validation**: Each input cell must hold a valid field element (0 ≤ value < 2^200).
2.  **Lazy computation**: The output state is computed only when an output cell is accessed.
3.  **Caching**: Computed results are cached to avoid redundant calculations.

#### Example Operation

![Keccak builtin segment with a complete operation](keccak-segment.png)

## Mod Builtin

The Mod builtin is designed for modular arithmetic operations, specifically computing `a % b` and `a // b` (integer division). It leverages the Range Check builtin to validate values and ensure they fall within specific bounds, typically `[0, 2**96)`.

### How It Works

The Mod builtin operates on a dedicated memory segment. For each modular arithmetic operation, it uses a block of 3 cells:

| Offset | Description | Role   |
| ------ | ----------- | ------ |
| 0      | `a` value   | Input  |
| 1      | `b` value   | Input  |
| 2      | `a % b`     | Output |

The VM computes `a % b` and `a // b` when the output cell is accessed. The values `a` and `b` are validated against the `range_check96_ptr` to ensure they are within the `[0, 2**96)` range.

Another design choice is the batch size, which is often just 1 in practice. The builtin can process multiple operations at once—`batch_size` triplets of `a`, `b`, and `c`—but keeping it at 1 simplifies things for most cases. It’s like handling one addition or multiplication at a time, which is plenty for many programs, though the option to scale up is there if you need it.

Why tie the values table to `range_check96_ptr`? It’s about efficiency again. The VM’s range-checking system is already set up to monitor that segment, so using it for the builtin’s values—like `a`, `b`, and `c`—means those numbers get validated automatically.

## Segment Arena Builtin

The Segment Arena builtin enhances Cairo VM's memory management by tracking segment endpoints, simplifying memory operations involving segment allocation and finalization.

### Cells Organization

Each Segment Arena builtin instance manages state using blocks of 3 cells:

- First cell: Base address of the info pointer.
- Second cell: Current number of allocated segments.
- Third cell: Current number of finalized segments.

This structure works in conjunction with an Info segment, also organized in blocks of 3 cells:

- First cell: Base address of the segment.
- Second cell: End address of the segment (when finalized).
- Third cell: Current number of finalized segments (squashing index).

![Segment Arena builtin segment](segment-arena.png)

Cairo Compilation: Sierra and Casm

# Cairo Compilation: Sierra and Casm

## Sierra and Casm

Sierra (Safe Intermediate Representation) is an intermediate representation used in Starknet contracts since version v0.11.0. After compilation from Cairo, contracts are in Sierra format. This Sierra code is then compiled by the sequencer into Cairo Assembly (Casm), which is executed by the Starknet OS.

## Why Casm is Needed

Starknet, as a validity rollup, requires proofs for block execution using STARKs. STARKs work with polynomial constraints, necessitating a translation layer from smart contract execution to these constraints. Cairo, and its assembly language Casm, provide this layer by translating Cairo semantics into polynomial constraints, enabling the proof of block validity.

## Safe Casm

To ensure provability, Sierra is compiled into a subset of Casm called "safe Casm." Safe Casm guarantees provable execution for all inputs. This is achieved by avoiding constructs like `assert` in favor of `if/else` to ensure graceful failures and deterministic execution. For example, a `find_element` function that might fail if the element is not found cannot be directly compiled to safe Casm.

## Compilation of Loops and Recursion

In Cairo, loops and recursion are compiled into similar low-level representations. Compiling examples to Sierra reveals that loops are often translated into recursive functions within the Sierra statements. To observe this, one can enable `sierra-text = true` in `Scarb.toml` and run `scarb build`.

## Sierra Code Structure

Sierra files are structured into three main parts:

1.  **Type and libfunc declarations:** Definitions of data types and library functions used.
2.  **Statements:** The sequence of operations forming the program.
3.  **Function declarations:** Mapping of function definitions to their corresponding statements.

The statements in Sierra code correspond to the order of function declarations in the Cairo program. For instance, the `main` function's statements are located between specific line numbers, followed by the statements for other functions.

### Example: Inlining in Sierra

Consider a program with inlined and non-inlined functions. The Sierra code shows how function calls are represented. For example, `function_call<user@main::main::not_inlined>()` is used to execute a non-inlined function. The execution then proceeds through `felt252_const`, `store_temp`, and `felt252_add` libfuncs. Inlined code might use different variable IDs due to prior assignments. The `return` instruction of called functions is often omitted in favor of integrating their results into the calling function's logic.

#### Casm Code Example

Here's a corresponding Casm code snippet for the described program:

```cairo,noplayground
1	call rel 3
2	ret
3	call rel 9
4	[ap + 0] = 1, ap++
5	[ap + 0] = [ap + -1] + [ap + -2], ap++
6	ret
7	[ap + 0] = 1, ap++
8	ret
9	[ap + 0] = 2, ap++
10	ret
11	ret
```

This Casm code involves instructions like `call rel`, `ret`, and memory operations (`[ap + offset] = value, ap++`).

Security and Provability in Cairo

### Security and Provability in Cairo

Cairo 1.0's compiled Casm (Common Assembly) is designed to ensure provability, a key difference from Cairo 0 where certain execution paths might not be provable. Malicious provers can exploit non-provable paths to deceive users, for example, by falsely claiming an element is not in an array when it actually is.

#### Provability and Malicious Provers

- **Happy Flow (Element Present):** The safe Casm verifies that the array at a given index contains the requested element.
- **Unhappy Flow (Element Absent):** In Cairo 0, this path was often not provable. In Cairo 1.0, the entire array must be traversed to verify the element's absence.

#### Gas Metering Complications

Sierra's gas metering introduces further challenges. A prover might exploit situations where the user has enough gas for the "happy flow" but not the "unhappy flow" (element not found). This could allow the execution to halt mid-search, enabling the prover to falsely claim the element is absent.

To address this, the plan is to require users to have sufficient gas for the unhappy flow before initiating operations like `find_element`.

#### Hints in Cairo

Smart contracts written in Cairo for Starknet cannot include user-defined hints. While Cairo 0 allowed only whitelisted hints, Cairo 1.0's Sierra to Casm compilation process strictly determines the hints in use, ensuring only "safe" Casm is generated. This eliminates the possibility of non-compiler-generated hints. Future native Cairo versions might support hint syntax similar to Cairo 0, but this will not be available in Starknet smart contracts. L3s built on Starknet might utilize such functionality.

Cairo Runner and Proof Generation

# Cairo Runner and Proof Generation

The Cairo Runner is the primary executable program responsible for orchestrating the execution of compiled Cairo programs. It implements the theoretical Cairo machine, integrating the memory model, execution model, builtins, and hints. Currently, it is implemented in Rust by LambdaClass and is available as both a standalone binary and a library.

## Runner Modes

The Cairo Runner can operate in different modes tailored to specific execution purposes, taking compiled Cairo bytecode and hints to produce an execution trace and memory, which then serve as inputs for the STARK prover.

### Execution Mode

In this mode, the runner executes the program to completion, including hints and the Cairo VM's state transition function. This mode is primarily for debugging or testing program logic without the overhead of proof generation. It simulates the program step-by-step, using hints for nondeterministic values, and constructs the complete state trace and final memory. The output comprises the trace, memory, and initial/final register states (`pc`, `ap`, `fp`). Execution halts upon failure of any hint or instruction check.

### Proof Mode

This mode extends Execution Mode by not only running the program but also preparing the necessary inputs for proof generation. It is the standard mode for production use cases where a proof of execution is required. As the runner executes the program, it logs the VM state at each step, building the execution trace and final memory state. Upon completion, the memory dump and sequential register states (composing the execution trace) can be extracted.

Advanced Topics and Utilities

Development Tools and Utilities

# Development Tools and Utilities

This section covers useful development tools provided by the Cairo project, including automatic formatting, quick warning fixes, a linter, and IDE integration.

## Automatic Formatting with `scarb fmt`

Scarb projects can be formatted using the `scarb fmt` command. For direct Cairo binary usage, `cairo-format` can be used. This tool is often used in collaborative projects to maintain a consistent code style.

To format a Cairo project, navigate to the project directory and run:

```bash
scarb fmt
```

Code sections that should not be formatted can be marked with `#[cairofmt::skip]`:

```cairo, noplayground
#[cairofmt::skip]
let table: Array<ByteArray> = array![
    "oxo",
    "xox",
    "oxo",
];
```

## IDE Integration Using `cairo-language-server`

The Cairo community recommends using `cairo-language-server` for IDE integration. This tool provides compiler-centric utilities and communicates using the Language Server Protocol (LSP).

Cryptography and Zero-Knowledge Proofs

# Cryptography and Zero-Knowledge Proofs

## Hash Functions in Cairo

Cairo's core library offers two hash functions: Pedersen and Poseidon.

### Pedersen Hash

Pedersen hash functions are based on elliptic curve cryptography. They perform operations on points along an elliptic curve, which are easy to compute in one direction but computationally infeasible to reverse due to the Elliptic Curve Discrete Logarithm Problem (ECDLP).

### Poseidon Hash

Poseidon is a family of hash functions optimized for efficiency in algebraic circuits, making it suitable for Zero-Knowledge proof systems like STARKs (used in Cairo). It employs a sponge construction and a three-element state permutation.

## Arithmetic Circuits in Zero-Knowledge Proof Systems

Zero-knowledge proof systems allow a prover to demonstrate the validity of a computation to a verifier without revealing private inputs. Statements must be converted into a representation suitable for the proof system.

### zk-SNARKs Approach

zk-SNARKs utilize arithmetic circuits over a finite field \(F_p\), with constraints represented as equations. A witness is an assignment of signals satisfying these constraints. Proofs verify knowledge of a witness without revealing private signals.

### zk-STARKs Approach

STARKs, used by Cairo, employ an Algebraic Intermediate Representation (AIR) consisting of polynomial constraints, rather than arithmetic circuits. Cairo's ability to emulate arithmetic circuits allows for the implementation of zk-SNARKs verifiers within STARK proofs.

## Implementing Arithmetic Circuits in Cairo

Cairo provides circuit constructs in the `core::circuit` module for building arithmetic circuits. These circuits utilize builtins for operations like addition and multiplication modulo \(p\).

### Basic Arithmetic Gates

- `AddMod` builtin for addition modulo \(p\)
- `MulMod` builtin for multiplication modulo \(p\)

These enable the construction of gates such as `AddModGate`, `SubModGate`, `MulModGate`, and `InvModGate`.

### Example Circuit: `a * (a + b)`

The following code demonstrates the creation and evaluation of a circuit that computes \(a \cdot (a + b)\\) over the BN254 prime field:

```cairo, noplayground
use core::circuit::{
    AddInputResultTrait, CircuitElement, CircuitInput, CircuitInputs, CircuitModulus,
    CircuitOutputsTrait, EvalCircuitTrait, circuit_add, circuit_mul, u384,
};

// Circuit: a * (a + b)
// witness: a = 10, b = 20
// expected output: 10 * (10 + 20) = 300
fn eval_circuit() -> (u384, u384) {
    let a = CircuitElement::<CircuitInput<0>> {};
    let b = CircuitElement::<CircuitInput<1>> {};

    let add = circuit_add(a, b);
    let mul = circuit_mul(a, add);

    let output = (mul,);

    let mut inputs = output.new_inputs();
    inputs = inputs.next([10, 0, 0, 0]);
    inputs = inputs.next([20, 0, 0, 0]);

    let instance = inputs.done();

    let bn254_modulus = TryInto::<
        _, CircuitModulus,
    >::try_into([0x6871ca8d3c208c16d87cfd47, 0xb85045b68181585d97816a91, 0x30644e72e131a029, 0x0])
        .unwrap();

    let res = instance.eval(bn254_modulus).unwrap();

    let add_output = res.get_output(add);
    let circuit_output = res.get_output(mul);

    assert!(add_output == u384 { limb0: 30, limb1: 0, limb2: 0, limb3: 0 }, "add_output");
    assert!(circuit_output == u384 { limb0: 300, limb1: 0, limb2: 0, limb3: 0 }, "circuit_output");

    (add_output, circuit_output)
}

#[executable]
fn main() {
    eval_circuit();
}
```

The process involves defining inputs, describing the circuit, specifying outputs, assigning values, defining the modulus, evaluating the circuit, and retrieving output values.

## Modular Arithmetic Builtin

The Mod Builtin optimizes modular arithmetic operations, crucial for cryptographic protocols and zero-knowledge proofs, by reducing computational overhead compared to pure Cairo implementations. It is implicitly used when working with Arithmetic Circuits.

### Structure and Operation

The Mod Builtin uses seven input cells: four for the modulus `p` (as a multi-word integer), and others for operands and results. It processes operations in batches, ensuring `op(a, b) = c + k * p`, where `k` is a quotient within bounds. The `run_mod_p_circuit` function orchestrates these operations. Values are typically kept under `2^96` using `range_check96_ptr`.

### Modular Addition Example

The `AddMod` builtin can be used to compute `x + y (mod p)` for `UInt384` values, as illustrated in Cairo Zero code.

Oracles

# Oracles

Oracles are an experimental Scarb feature that allows an external helper process to perform computations and provide values to the Cairo VM. These values are then constrained within the Cairo program, becoming part of the proof. Oracles are available for Cairo executables run with `--experimental-oracles` and are not supported in Starknet contracts.

> Note: This "oracle" system is distinct from Smart Contract Oracles, though the concept of using external processes for data in a constrained system is similar.

## Why use Oracles?

Oracles introduce non-determinism to the Cairo VM, enabling the prover to assign arbitrary values to memory cells. This allows for the injection of external data without implementing complex algorithms directly in Cairo. For instance, instead of implementing a square-root algorithm, one can obtain the square root from an oracle and then simply assert the mathematical property (e.g., `sqrt * sqrt == number`).

## What We’ll Build

We will create a Cairo executable that interacts with two oracle endpoints: one for integer square roots and another for decomposing a number into little-endian bytes. A Rust process will implement these endpoints, communicating with Cairo via standard input/output using the `stdio:` protocol supported by Scarb's executor.

The complete example is located in the `listing_oracles/` directory.

## The Cairo Package

The `Scarb.toml` manifest declares an executable package, depends on `cairo_execute` for running with Scarb, and includes the `oracle` crate for `oracle::invoke`.

<span class="caption">Filename: listing_oracles/Scarb.toml</span>

```toml
[package]
name = "example"
version = "0.1.0"
edition = "2024_07"
publish = false

[dependencies]
cairo_execute = "2.12.0"
oracle = "0.1.0-dev.4"

[executable]

[cairo]
enable-gas = false

[dev-dependencies]
cairo_test = "2"
```

The Cairo code defines helper functions to call the Rust oracle using a `stdio:...` connection string. After each call, it asserts properties to maintain the program's soundness.

<span class="caption">Filename: listing_oracles/src/lib.cairo</span>

```cairo
use core::num::traits::Pow;

// Call into the Rust oracle to get the square root of an integer.
fn sqrt_call(x: u64) -> oracle::Result<u64> {
    oracle::invoke("stdio:cargo -q run --manifest-path ./src/my_oracle/Cargo.toml", 'sqrt', (x,))
}

// Call into the Rust oracle to convert an integer to little-endian bytes.
fn to_le_bytes(val: u64) -> oracle::Result<Array<u8>> {
    oracle::invoke(
        "stdio:cargo -q run --manifest-path ./src/my_oracle/Cargo.toml", 'to_le_bytes', (val,),
    )
}

fn oracle_calls(x: u64) -> Result<(), oracle::Error> {
    let sqrt = sqrt_call(x)?;
    // CONSTRAINT: sqrt * sqrt == x
    assert!(sqrt * sqrt == x, "Expected sqrt({x}) * sqrt({x}) == x, got {sqrt} * {sqrt} == {x}");
    println!("Computed sqrt({x}) = {sqrt}");

    let bytes = to_le_bytes(x)?;
    // CONSTRAINT: sum(bytes_i * 256^i) == x
    let mut recomposed_val = 0;
    for (i, byte) in bytes.span().into_iter().enumerate() {
        recomposed_val += (*byte).into() * 256_u64.pow(i.into());
    }
    assert!(
        recomposed_val == x,
        "Expected recomposed value {recomposed_val} == {x}, got {recomposed_val}"
    );
    println!("le_bytes decomposition of {x}) = {:?}", bytes.span());

    Ok(())
}

#[executable]
fn main(x: u64) -> bool {
    match oracle_calls(x) {
        Ok(()) => true,
        Err(e) => panic!("Oracle call failed: {e:?}"),
    }
}
```

### Key Concepts in Cairo Oracle Interaction

1.  **`oracle::invoke` Function**: This function is used for all oracle interactions. It takes a `connection` string (specifying the transport and process, e.g., `stdio:` with a Cargo command), a `selector` (the endpoint name defined in Rust), and a tuple of inputs. The return type is `oracle::Result<T>`, allowing for explicit error handling.
2.  **Constraining Oracle Outputs**: It is crucial to immediately constrain the values returned by the oracle. For the square root, this involves asserting `sqrt * sqrt == x`. For byte decomposition, the value is recomputed from its bytes and asserted to equal the original number. These assertions are vital for the soundness of the ZK-proof, preventing a malicious prover from injecting arbitrary values.

## The Rust Oracle

The Rust side implements the oracle endpoints. The `cairo_oracle_server` crate handles input decoding and output encoding back to Cairo.

<span class="caption">Filename: listing_oracles/src/my_oracle/Cargo.toml</span>

```toml
[package]
name = "my_oracle"
version = "0.1.0"
edition = "2021"
publish = false

[dependencies]
anyhow = "1"
cairo-oracle-server = "0.1"
starknet-core = "0.11"
```

<span class="caption">Filename: listing_oracles/src/my_oracle/src/main.rs</span>

```rust, noplayground
use anyhow::ensure;
use cairo_oracle_server::Oracle;
use std::process::ExitCode;

fn main() -> ExitCode {
    Oracle::new()
        .provide("sqrt", |value: u64| {
            let sqrt = (value as f64).sqrt() as u64;
            ensure!(
                sqrt * sqrt == value,
                "Cannot compute integer square root of {value}"
            );
            Ok(sqrt)
        })
        .provide("to_le_bytes", |value: u64| {
            let value_bytes = value.to_le_bytes();
            Ok(value_bytes.to_vec())
        })
        .run()
}
```

The `sqrt` endpoint computes the integer square root, rejecting inputs without an exact square root. The `to_le_bytes` endpoint returns the little-endian byte representation of a `u64`.

## Running the Example

To run the example, navigate to the example directory and execute the following command:

```bash
scarb execute --experimental-oracles --print-program-output --arguments 25000000
```

This command will execute the program with oracles enabled, printing the output. The program should return `1`, indicating success. It calls the oracle for `sqrt(25000000)`, verifies the result, decomposes `25000000` into bytes, and verifies the recomposition.

To observe an error, try a non-perfect square like `27`:

```bash
scarb execute --experimental-oracles --print-program-output --arguments 27
```

The `sqrt` endpoint will return an error, which propagates to Cairo, causing the program to panic.

## Summary

This example demonstrates how to offload computations to an external process and incorporate the results into a Cairo proof. This pattern is useful for integrating fast, flexible helpers during client-side proving. Remember that oracles are an experimental feature, intended for runners only, and all data received from them must be rigorously validated within the Cairo code.

Appendices and References

# Appendices and References

## Appendix A - Keywords

The following list contains keywords reserved for current or future use by the Cairo language. There are three main categories: strict, loose, and reserved. A fourth category includes functions from the core library; while their names aren't reserved, it's good practice to avoid using them as identifiers.

### Strict Keywords

These keywords can only be used in their correct contexts and cannot be used as names for items.

- `as` - Rename import
- `break` - Exit a loop immediately
- `const` - Define constant items
- `continue` - Continue to the next loop iteration
- `else` - Fallback for `if` and `if let` control flow constructs
- `enum` - Define an enumeration
- `extern` - Function defined at the compiler level that can be compiled to CASM
- `false` - Boolean false literal
- `fn` - Define a function
- `if` - Branch based on the result of a conditional expression
- `impl` - Implement inherent or trait functionality
- `implicits` - Special kind of function parameters required for certain actions
- `let` - Bind a variable
- `loop` - Loop unconditionally
- `match` - Match a value to patterns
- `mod` - Define a module
- `mut` - Denote variable mutability
- `nopanic` - Functions marked with this notation will never panic.
- `of` - Implement a trait
- `pub` - Denote public visibility in items (structs, fields, enums, consts, traits, impl blocks, modules)
- `ref` - Parameter passed implicitly returned at the end of a function
- `return` - Return from function
- `struct` - Define a structure
- `trait` - Define a trait
- `true` - Boolean true literal

## Appendix B - Syntax

This section details the usage of specific syntax elements in Cairo.

### Tuples

Tuples are used for grouping multiple values.

| Syntax            | Description                                                                                  |
| :---------------- | :------------------------------------------------------------------------------------------- |
| `()`              | Empty tuple (unit), both literal and type.                                                   |
| `(expr)`          | Parenthesized expression.                                                                    |
| `(expr,)`         | Single-element tuple expression.                                                             |
| `(type,)`         | Single-element tuple type.                                                                   |
| `(expr, ...)`     | Tuple expression.                                                                            |
| `(type, ...)`     | Tuple type.                                                                                  |
| `expr(expr, ...)` | Function call expression; also used to initialize tuple `struct`s and tuple `enum` variants. |

### Curly Braces

Curly braces `{}` have specific contexts in Cairo.

| Context      | Explanation      |
| :----------- | :--------------- |
| `{...}`      | Block expression |
| `Type {...}` | `struct` literal |

## Appendix C - Derivable Traits

The `derive` attribute automatically generates code to implement a default trait on a struct or enum. The following traits from the standard library are compatible with the `derive` attribute.

### Hashing with `Hash`

Deriving the `Hash` trait allows structs and enums to be easily hashed. For a type to derive `Hash`, all its fields or variants must themselves be hashable.

### Starknet Storage with `starknet::Store`

The `starknet::Store` trait is applicable when building on Starknet. It enables a type to be used in smart contract storage by automatically implementing the necessary read and write functions.

## Appendix D - The Cairo Prelude

The Cairo prelude is a collection of commonly used modules, functions, data types, and traits automatically included in every Cairo module without explicit import statements. It provides essential building blocks for Cairo programs and smart contracts.

The core library prelude is defined in the `lib.cairo` file of the corelib crate. It includes:

- **Data types:** Integers, booleans, arrays, dictionaries, etc.
- **Traits:** Behaviors for arithmetic, comparison, and serialization operations.
- **Operators:** Arithmetic, logical, and bitwise operators.
- **Utility functions:** Helpers for arrays, maps, boxing, and more.
