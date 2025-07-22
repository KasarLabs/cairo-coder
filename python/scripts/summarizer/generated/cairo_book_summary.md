# cairo-book Documentation Summary

Introduction to Cairo

What is Cairo?

# What is Cairo?

## Core Concepts

Cairo is a programming language designed to leverage mathematical proofs for computational integrity. It enables programs to prove they have performed computations correctly, even on untrusted machines. The language is built on STARK technology, which transforms computational claims into constraint systems, with the ultimate goal of generating verifiable mathematical proofs that can be efficiently verified with certainty.

## Applications

Cairo's primary application is Starknet, a Layer 2 scaling solution for Ethereum. Starknet utilizes Cairo's proof system to address scalability challenges: computations are executed off-chain by a prover, who generates a STARK proof. This proof is then verified by an Ethereum smart contract, requiring significantly less computational power than re-executing the original computations. This allows for massive scalability while maintaining security.

Beyond blockchain, Cairo's verifiable computation capabilities can benefit any scenario where computational integrity needs efficient verification.

Learning Cairo

# Learning Cairo

This book is designed for developers with a basic understanding of programming concepts. While prior experience with Rust can be helpful due to similarities, it is not required.

## Learning Paths

### For General-Purpose Developers

Focus on chapters 1-12 for core language features and programming concepts, excluding deep dives into smart contract specifics.

### For New Smart Contract Developers

Read the book from beginning to end to establish a strong foundation in both Cairo fundamentals and smart contract development.

### For Experienced Smart Contract Developers

Follow a focused path:

- Chapters 1-3 for Cairo basics.
- Chapter 8 for Cairo's trait and generics system.
- Chapter 15 for smart contract development.
- Reference other chapters as needed.

## Prerequisites

Basic programming knowledge, including variables, functions, and common data structures, is assumed.

Cairo's Foundation

# Cairo's Foundation

Proof systems like zk-SNARKs utilize arithmetic circuits over a finite field \\(F_p\\), employing constraints at specific gates represented by equations:

\\[
(a_1 \\cdot s_1 + ... + a_n \\cdot s_n) \\cdot (b_1 \\cdot s_1 + ... + b_n \\cdot s_n) + (c_1 \\cdot s_1 + ... + c_n \\cdot s_n) = 0 \mod p
\\]

Here, \\(s_1, ..., s_n\\) are signals, and \\(a_i, b_i, c_i\\) are coefficients. A witness is an assignment of signals that satisfies all circuit constraints. zk-SNARK proofs leverage this to prove knowledge of a witness without revealing private input signals, ensuring prover honesty and privacy.

In contrast, STARKs, which Cairo employs, use an Algebraic Intermediate Representation (AIR). AIR defines computations through polynomial constraints. By enabling emulated arithmetic circuits, Cairo can facilitate the implementation of zk-SNARKs proof verification within STARK proofs.

Resources and Setup

# Resources and Setup

This guide assumes the use of Cairo version 2.11.4 and Starknet Foundry version 0.39.0. For installation or updates, refer to the "Installation" section of Chapter 1.

## Additional Resources

- **Cairo Playground**: A browser-based environment for writing, compiling, debugging, and proving Cairo code without local setup. It's useful for experimenting with code snippets and observing their compilation to Sierra and Casm.
- **Cairo Core Library Docs**: Documentation for Cairo's standard library, which includes essential types, traits, and utilities available in all Cairo projects.
- **Cairo Package Registry**: Hosts reusable Cairo libraries like Alexandria and Open Zeppelin Contracts for Cairo, manageable through Scarb for streamlined development.
- **Scarb Documentation**: Official documentation for Cairo's package manager and build tool, covering package creation, dependency management, builds, and project configuration.

Setting up the Cairo Development Environment

Introduction to the Cairo Development Environment

# Introduction to the Cairo Development Environment

Installing Cairo Development Tools

# Installing Cairo Development Tools

The first step to getting started with Cairo is to install the necessary development tools. This involves installing `starkup`, a command-line tool for managing Cairo versions, which in turn installs Scarb (Cairo's build toolchain and package manager) and Starknet Foundry.

## Installing `starkup`

`starkup` helps manage Cairo, Scarb, and Starknet Foundry.

### On Linux or macOS

Open a terminal and run the following command:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.starkup.dev | sh
```

This command downloads and runs an installation script. Upon successful installation, you will see:

```bash
starkup: Installation complete.
```

## Scarb and Starknet Foundry

Scarb is Cairo's package manager and build system, inspired by Rust's Cargo. It bundles the Cairo compiler and language server, simplifying tasks like building code, managing dependencies, and providing Language Server Protocol (LSP) support for IDEs.

Starknet Foundry is a toolchain for developing Cairo programs and Starknet smart contracts, offering features for writing and running tests, deploying contracts, and interacting with the Starknet network.

### Verifying Installations

After `starkup` installation, open a new terminal session and verify the installations:

```bash
$ scarb --version
scarb 2.11.4 (c0ef5ec6a 2025-04-09)
cairo: 2.11.4 (https://crates.io/crates/cairo-lang-compiler/2.11.4)
sierra: 1.7.0

$ snforge --version
snforge 0.39.0
```

## VSCode Extension

Cairo offers a VSCode extension that provides syntax highlighting, code completion, and other development features.

### Installation and Configuration

1.  Install the Cairo extension from the [VSCode Marketplace][vsc extension].
2.  Open the extension's settings in VSCode.
3.  Enable the `Enable Language Server` and `Enable Scarb` options.

[vsc extension]: https://marketplace.visualstudio.com/items?itemName=starkware.cairo1

Creating and Structuring Cairo Projects

# Creating and Structuring Cairo Projects

## Creating a Project Directory

It is recommended to create a dedicated directory for your Cairo projects. For Linux, macOS, and PowerShell on Windows, use:

```shell
mkdir ~/cairo_projects
cd ~/cairo_projects
```

For Windows CMD, use:

```cmd
> mkdir "%USERPROFILE%\cairo_projects"
> cd /d "%USERPROFILE%\cairo_projects"
```

## Creating a Project with Scarb

Once you are in your project directory, you can create a new Cairo project using Scarb:

```bash
scarb new hello_world
```

Configuring Cairo Projects with Scarb.toml

# Configuring Cairo Projects with Scarb.toml

Scarb uses the `Scarb.toml` file, written in TOML format, to configure Cairo projects.

## Project Manifest (`Scarb.toml`)

The `Scarb.toml` file contains essential information for Scarb to compile your project.

### `[package]` Section

This section defines the package's metadata:

- `name`: The name of the package.
- `version`: The package version.
- `edition`: The edition of the Cairo prelude to use.

### `[dependencies]` Section

This section lists the project's dependencies, which are referred to as crates in Cairo. For example, `starknet = "2.11.4"` or `cairo_execute = "2.11.4"`.

### `[dev-dependencies]` Section

Dependencies required for development and testing, but not for the production build. Examples include `snforge_std` and `assert_macros` for testing with Starknet Foundry, or `cairo_test`.

### `[cairo]` Section

This section allows for Cairo-specific configurations.

- `enable-gas = false`: Disables gas tracking, which is necessary for executable targets as gas is specific to Starknet contracts.

### Target Configurations

Cairo projects can be configured to build different types of targets.

#### `[[target.starknet-contract]]`

This section is used to build Starknet smart contracts. It typically includes `sierra = true`.

#### `[[target.executable]]`

This section specifies that the package compiles to a Cairo executable.

- `name`: The name of the executable.
- `function`: The entry point function for the executable.

### `[scripts]` Section

This section allows defining custom scripts. A default script for running tests using `snforge` is often included as `test = "snforge test"`.

## Example `Scarb.toml` Configurations

### Default `scarb new` Output (with Starknet Foundry)

When creating a new project with Starknet Foundry, `scarb new` generates a `Scarb.toml` file similar to this:

<span class="filename">Filename: Scarb.toml</span>

```toml
[package]
name = "hello_world"
version = "0.1.0"
edition = "2024_07"

# See more keys and their definitions at https://docs.swmansion.com/scarb/docs/reference/manifest.html

[dependencies]
starknet = "2.11.4"

[dev-dependencies]
snforge_std = "0.44.0"
assert_macros = "2.11.4"

[[target.starknet-contract]]
sierra = true

[scripts]
test = "snforge test"
```

### Modified `Scarb.toml` for Executable Programs

To create an executable program that can be proven, `Scarb.toml` needs to be modified to define an executable target and include necessary plugins like `cairo_execute`.

<span class="filename">Filename: Scarb.toml</span>

```toml
[package]
name = "prime_prover"
version = "0.1.0"
edition = "2024_07"

[cairo]
enable-gas = false

[dependencies]
cairo_execute = "2.11.4"


[[target.executable]]
name = "main"
function = "prime_prover::main"
```

Managing Cairo Project Dependencies

# Managing Cairo Project Dependencies

Dependencies are managed in the `Scarb.toml` file.

## Declaring Dependencies

You can declare dependencies within a `[dependencies]` section. If you need to import multiple packages, list them all under a single `[dependencies]` section. Development dependencies can be declared in a separate `[dev-dependencies]` section.

The following example shows importing a specific branch, which is deprecated and should not be used:

```cairo
[dependencies]
alexandria_math = { git = "https://github.com/keep-starknet-strange/alexandria.git", branch = "cairo-v2.3.0-rc0" }
```

## Fetching and Compiling

To fetch all external dependencies and compile your package, run:

```bash
scarb build
```

## Adding and Removing Dependencies

You can add dependencies using the `scarb add` command, which automatically updates your `Scarb.toml` file. For development dependencies, use `scarb add --dev`. To remove a dependency, either manually edit `Scarb.toml` or use the `scarb rm` command.

## The Glob Operator

To bring all public items defined in a path into scope, use the `*` glob operator:

```rust
use core::num::traits::*;
```

Be cautious when using the glob operator, as it can make it harder to track the origin of names used in your code. It is often used in testing scenarios.

Cairo Project Structure and Execution

Project Creation and Structure

# Project Creation and Structure

A Cairo package is a directory containing a `Scarb.toml` manifest file and associated source code. You can create a new Cairo package using the `scarb new` command:

```bash
scarb new my_package
```

This command generates a new package directory with the following structure:

```text
my_package/
├── Scarb.toml
└── src
    └── lib.cairo
```

- `src/`: The main directory for Cairo source files.
- `src/lib.cairo`: The default root module of the crate, serving as the main entry point.
- `Scarb.toml`: The package manifest file containing metadata and configuration like dependencies, name, version, and authors.

The `Scarb.toml` file typically looks like this:

```toml
[package]
name = "my_package"
version = "0.1.0"
edition = "2024_07"

[executable]

[cairo]
enable-gas = false

[dependencies]
cairo_execute = "2.11.4"
```

You can organize your code into multiple Cairo source files by creating additional `.cairo` files within the `src` directory or its subdirectories. For example, you might have `src/lib.cairo` declare modules that are implemented in other files like `src/hello_world.cairo`.

```cairo
// src/lib.cairo
mod hello_world;
```

```cairo
// src/hello_world.cairo
#[executable]
fn main() {
    println!("Hello, World!");
}
```

To build your project, navigate to the project's root directory and run:

```bash
scarb build
```

Building and Running Cairo Programs

# Building and Running Cairo Programs

To build a Cairo project, use the `scarb build` command, which generates the compiled Sierra code. To execute a Cairo program, use the `scarb execute` command. These commands are consistent across different operating systems.

## Running the "Hello, World!" Program

Executing `scarb execute` will compile and run the program. The expected output is:

```shell
$ scarb execute
   Compiling hello_world v0.1.0 (listings/ch01-getting-started/no_listing_01_hello_world/Scarb.toml)
    Finished `dev` profile target(s) in 4 seconds
   Executing hello_world
Hello, World!

```

If "Hello, World!" is printed, the program has run successfully.

## Anatomy of a Cairo Program

A basic Cairo program includes a `main` function, which is the entry point:

```cairo,noplayground
fn main() {

}
```

- `fn main()`: Declares a function named `main` with no parameters and no return value. The function body must be enclosed in curly brackets `{}`.
- `println!("Hello, World!");`: This macro prints the string "Hello, World!" to the terminal.

For consistent code style, the `scarb fmt` command can be used for automatic formatting.

Zero-Knowledge Proof Generation

# Zero-Knowledge Proof Generation

To generate a zero-knowledge proof for the primality check program, you first need to execute the program to create the necessary artifacts.

## Executing the Program

You can run the program using the `scarb execute` command, providing the package name and input arguments. For example, to check if 17 is prime:

```bash
scarb execute -p prime_prover --print-program-output --arguments 17
```

- `-p prime_prover`: Specifies the package name.
- `--print-program-output`: Displays the program's result.
- `--arguments 17`: Passes 17 as the input number.

The output will indicate success (0) and the primality result (1 for prime, 0 for not prime).

```bash
$ scarb execute -p prime_prover --print-program-output --arguments 17
   Compiling prime_prover v0.1.0 (listings/ch01-getting-started/prime_prover/Scarb.toml)
    Finished `dev` profile target(s) in 4 seconds
   Executing prime_prover
Program output:
1


$ scarb execute -p prime_prover --print-program-output --arguments 4
[0, 0]  # 4 is not prime
$ scarb execute -p prime_prover --print-program-output --arguments 23
[0, 1]  # 23 is prime
```

This execution generates files such as `air_public_input.json`, `air_private_input.json`, `trace.bin`, and `memory.bin` in the `./target/execute/prime_prover/execution1/` directory, which are required for proving.

## Generating a Zero-Knowledge Proof

Cairo 2.10 integrates the Stwo prover via Scarb, enabling direct proof generation. To create the proof, use the `scarb prove` command, referencing the execution ID:

```bash
$ scarb prove --execution-id 1
     Proving prime_prover
warn: soundness of proof is not yet guaranteed by Stwo, use at your own risk
Saving proof to: target/execute/prime_prover/execution1/proof/proof.json
```

The generated proof will be saved in `target/execute/prime_prover/execution1/proof/proof.json`.

Basic Cairo Programming Concepts

Cairo Keywords, Operators, and Symbols

# Cairo Keywords, Operators, and Symbols

Cairo keywords are reserved for current or future use and are categorized into strict, loose, and reserved.

## Strict Keywords

These keywords can only be used in their correct contexts and cannot be used as names of any items.

- `as`: Rename import
- `break`: Exit a loop immediately
- `const`: Define constant items
- `continue`: Continue to the next loop iteration
- `else`: Fallback for `if` and `if let` control flow constructs
- `enum`: Define an enumeration
- `extern`: Function defined at the compiler level that can be compiled to CASM
- `false`: Boolean false literal
- `fn`: Define a function
- `if`: Branch based on the result of a conditional expression
- `impl`: Implement inherent or trait functionality
- `implicits`: Special kind of function parameters that are required to perform certain actions
- `let`: Bind a variable
- `loop`: Loop unconditionally
- `match`: Match a value to patterns
- `mod`: Define a module
- `mut`: Denote variable mutability
- `nopanic`: Functions marked with this notation mean that the function will never panic.
- `of`: Implement a trait
- `pub`: Denote public visibility in items, such as struct and struct fields, enums, consts, traits and impl blocks, or modules
- `ref`: Parameter passed implicitly returned at the end of a function
- `return`: Return from function
- `struct`: Define a structure
- `trait`: Define a trait
- `true`: Boolean true literal
- `type`: Define a type alias
- `use`: Bring symbols into scope
- `while`: loop conditionally based on the result of an expression

## Loose Keywords

These keywords are associated with a specific behaviour, but can also be used to define items.

- `self`: Method subject
- `super`: Parent module of the current module

## Reserved Keywords

These keywords aren't used yet, but they are reserved for future use. It is recommended not to use them to ensure forward compatibility.

- `Self`
- `do`
- `dyn`
- `for`
- `hint`
- `in`
- `macro`
- `move`
- `static_assert`
- `static`
- `try`
- `typeof`
- `unsafe`
- `where`
- `with`
- `yield`

## Built-in Functions

Cairo provides specific built-in functions. Using their names for other items is not recommended.

- `assert`: Checks a boolean expression; panics if false.
- `panic`: Terminates the program due to an error.

## Operators

| Operator | Example           | Explanation                           | Overloadable Trait |
| -------- | ----------------- | ------------------------------------- | ------------------ | ---------- | ------- | --------------------------- | --- |
| `+`      | `expr + expr`     | Arithmetic addition                   | `Add`              |
| `+=`     | `var += expr`     | Arithmetic addition and assignment    | `AddEq`            |
| `,`      | `expr, expr`      | Argument and element separator        |                    |
| `-`      | `-expr`           | Arithmetic negation                   | `Neg`              |
| `-`      | `expr - expr`     | Arithmetic subtraction                | `Sub`              |
| `-=`     | `var -= expr`     | Arithmetic subtraction and assignment | `SubEq`            |
| `->`     | `fn(...) -> type` | Function and closure return type      |                    |
| `.`      | `expr.ident`      | Member access                         |                    |
| `/`      | `expr / expr`     | Arithmetic division                   | `Div`              |
| `/=`     | `var /= expr`     | Arithmetic division and assignment    | `DivEq`            |
| `:`      | `pat: type`       | Type annotation                       |                    |
| `:`      | `ident: expr`     | Struct field initializer              |                    |
| `;`      | `expr;`           | Statement and item terminator         |                    |
| `<`      | `expr < expr`     | Less than comparison                  | `PartialOrd`       |
| `<=`     | `expr <= expr`    | Less than or equal to comparison      | `PartialOrd`       |
| `=`      | `var = expr`      | Assignment                            |                    |
| `==`     | `expr == expr`    | Equality comparison                   | `PartialEq`        |
| `=>`     | `pat => expr`     | Part of match arm syntax              |                    |
| `>`      | `expr > expr`     | Greater than comparison               | `PartialOrd`       |
| `>=`     | `expr >= expr`    | Greater than or equal to comparison   | `PartialOrd`       |
| `^`      | `expr ^ expr`     | Bitwise exclusive OR                  | `BitXor`           |
| `        | `                 | `expr                                 | expr`              | Bitwise OR | `BitOr` |
| `        |                   | `                                     | `expr              |            | expr`   | Short-circuiting logical OR |     |
| `?`      | `expr?`           | Error propagation                     |                    |

## Non-Operator Symbols

### Stand-Alone Syntax

| Symbol                                  | Explanation                               |
| --------------------------------------- | ----------------------------------------- |
| `..._u8`, `..._usize`, `..._bool`, etc. | Numeric literal of specific type          |
| `"..."`                                 | String literal                            |
| `'...'`                                 | Short string, 31 ASCII characters maximum |
| `_`                                     | “Ignored” pattern binding                 |

### Path-Related Syntax

| Symbol               | Explanation                                                      |
| -------------------- | ---------------------------------------------------------------- |
| `ident::ident`       | Namespace path                                                   |
| `super::path`        | Path relative to the parent of the current module                |
| `trait::method(...)` | Disambiguating a method call by naming the trait that defines it |

### Generic Type Parameters

| Symbol                         | Explanation                                                                                                  |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `path<...>`                    | Specifies parameters to generic type in a type (e.g., `Array<u8>`)                                           |
| `path::<...>`, `method::<...>` | Specifies parameters to a generic type, function, or method in an expression; often referred to as turbofish |

### Tuples

| Symbol        | Explanation                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------- |
| `()`          | Empty tuple (aka unit), both literal and type                                               |
| `(expr)`      | Parenthesized expression                                                                    |
| `(expr,)`     | Single-element tuple expression                                                             |
| `(type,)`     | Single-element tuple type                                                                   |
| `(expr, ...)` | Tuple expression                                                                            |
| `(type, ...)` | Tuple type                                                                                  |
| `expr(...)`   | Function call expression; also used to initialize tuple `struct`s and tuple `enum` variants |

### Curly Braces

| Context      | Explanation      |
| ------------ | ---------------- |
| `{...}`      | Block expression |
| `Type {...}` | `struct` literal |

Cairo Macros and Printing

# Cairo Macros and Printing

Cairo provides several macros for various purposes, including assertions, formatting, and interacting with components. Some key macros are:

- `assert!`: Evaluates a Boolean and panics if `false`.
- `assert_eq!`: Evaluates an equality and panics if not equal.
- `assert_ne!`: Evaluates an equality and panics if equal.
- `assert_lt!`: Evaluates a comparison and panics if greater or equal.
- `assert_le!`: Evaluates a comparison and panics if greater.
- `assert_gt!`: Evaluates a comparison and panics if lower or equal.
- `assert_ge!`: Evaluates a comparison and panics if lower.
- `format!`: Formats a string and returns a `ByteArray`.
- `write!`: Writes formatted strings in a formatter.
- `writeln!`: Writes formatted strings in a formatter on a new line.
- `get_dep_component!`: Returns the requested component state from a snapshot.
- `get_dep_component_mut!`: Returns the requested component state from a reference.
- `component!`: Macro used in Starknet contracts to embed a component inside a contract.

For printing, Cairo offers two main macros:

- `println!`: Prints text to the screen, followed by a new line. It can accept formatted strings using placeholders `{}`.
- `print!`: Similar to `println!`, but prints inline without a new line.

Both macros use the `Display` trait for formatting. If you need to print custom data types, you must implement the `Display` trait for them.

Example of using `println!`:

```cairo
#[executable]
fn main() {
    let a = 10;
    let b = 20;
    let c = 30;

    println!("Hello world!");
    println!("{} {} {}", a, b, c); // 10 20 30
    println!("{c} {a} {}", b); // 30 10 20
}
```

The `format!` macro is used for string formatting without printing directly. It returns a `ByteArray` containing the formatted string. This is useful for string concatenation and can be more readable than using the `+` operator.

Example of using `format!`:

```cairo
#[executable]
fn main() {
    let s1: ByteArray = "tic";
    let s2: ByteArray = "tac";
    let s3: ByteArray = "toe";
    let s = format!("{s1}-{s2}-{s3}");
    let s = format!("{}-{}-{}", s1, s2, s3);

    println!("{}", s);
}
```

When printing custom data types that do not implement `Display`, you will encounter an error. You can resolve this by manually implementing the `Display` trait or by using the `Debug` trait for debugging purposes.

Core Cairo Programming Concepts

# Core Cairo Programming Concepts

Cairo programs are built using variables, basic types, functions, comments, and control flow. Understanding these fundamental concepts is crucial for writing Cairo code.

## Variables and Mutability

Cairo variables are immutable by default, meaning their value cannot be changed after being bound. This immutability is a core aspect of Cairo's memory model, which prevents certain classes of bugs by ensuring values don't change unexpectedly. To make a variable mutable, the `mut` keyword must be used.

Attempting to reassign a value to an immutable variable results in a compile-time error:

```cairo,does_not_compile
#[executable]
fn main() {
    let x = 5;
    println!("The value of x is: {}", x);
    x = 6;
    println!("The value of x is: {}", x);
}

```

When `mut` is used, the variable can be reassigned:

```cairo
#[executable]
fn main() {
    let mut x = 5;
    println!("The value of x is: {}", x);
    x = 6;
    println!("The value of x is: {}", x);
}
```

## Constants

Constants are similar to immutable variables but have key differences:

- They are declared using the `const` keyword.
- The type of the value must always be annotated.
- They can only be declared in the global scope.
- They can only be set to a constant expression, not a value computed at runtime.

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

## Shadowing

Shadowing occurs when a new variable is declared with the same name as a previous one, effectively hiding the original variable. This is done using the `let` keyword again.

```cairo
#[executable]
fn main() {
    let x = 5;
    let x = x + 1;
    {
        let x = x * 2;
        println!("Inner scope x value is: {}", x);
    }
    println!("Outer scope x value is: {}", x);
}
```

Shadowing differs from `mut` because it allows changing the variable's type and does not require `mut` to reassign. The compiler treats shadowing as creating a new variable.

## Statements and Expressions

- **Statements** perform actions but do not return a value. `let` bindings are statements.
- **Expressions** evaluate to a value. Mathematical operations and function calls are expressions.

A statement cannot be assigned to a variable:

```cairo, noplayground
#[executable]
fn main() {
    let x = (let y = 6);
}
```

Blocks of code enclosed in curly braces can be expressions if they don't end with a semicolon:

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

## Functions with Return Values

Functions can return values. The return type is specified after an arrow (`->`). The final expression in a function body is its return value.

## Comments

Comments are used for explanations and are ignored by the compiler.

- Single-line comments start with `//`.
- Multi-line comments require `//` on each line.

```cairo,noplayground
// This is a single-line comment.

/*
This is a
multi-line comment.
*/
```

Item-level documentation comments, prefixed with `///`, provide detailed explanations for specific code items like functions, including usage examples and panic conditions.

````cairo,noplayground
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
/// assert(c == a + b, "Should equal a + b");
/// ```
fn add(arg1: felt252, arg2: felt252) -> felt252 {
    assert(arg1 != 0, 'Cannot be zero');
    arg1 + arg2
}
````

Program Execution and Advanced Topics

# Program Execution and Advanced Topics

To define an executable entry point for a Cairo program, use the `#[executable]` attribute on a function, typically named `main`. This function takes input and returns output.

## Writing the Prime-Checking Logic

A sample program demonstrates checking if a number is prime using a trial division algorithm.

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
    let mut is_prime = true;
    loop {
        if i * i > n {
            break;
        }
        if n % i == 0 {
            is_prime = false;
            break;
        }
        i += 2;
    }
    is_prime
}

// Executable entry point
#[executable]
fn main(input: u32) -> bool {
    is_prime(input)
}
```

The `is_prime` function handles edge cases (≤ 1, 2, even numbers) and iterates through odd divisors up to the square root of the input. The `main` function, marked with `#[executable]`, calls `is_prime` with user input.

## Execution Flow and Memory Management

Each instruction and its arguments increment the Program Counter (PC) by 1. The `call` and `ret` instructions manage function calls and returns, enabling a function stack.

- `call rel <offset>`: Jumps to an instruction relative to the current PC.
- `ret`: Returns execution to the instruction following the `call`.

Memory operations use the Allocation Pointer (`ap`). For example:

- `[ap + 0] = value, ap++`: Stores `value` in the memory cell pointed to by `ap` and increments `ap`.
- `[ap + 0] = [ap + -1] + [ap + -2], ap++`: Reads values from memory cells relative to `ap`, performs an addition, stores the result, and increments `ap`.

## Execution and Proof Generation Considerations

The `scarb execute` command runs Cairo programs. For instance, `scarb execute -p prime_prover --print-program-output --arguments 1000001` can execute the prime checker.

Changing the data type from `u32` to `u128` allows for a larger input range. However, implementing checks, such as panicking if input exceeds a certain limit (e.g., 1,000,000), prevents proof generation for invalid inputs, as a panicked execution cannot be proven.

Data Types in Cairo

Introduction to Cairo Data Types

# Introduction to Cairo Data Types

Every value in Cairo is of a certain _data type_, which informs Cairo how to work with that data. Data types can be categorized into scalars and compounds.

Cairo is a statically typed language, meaning that the type of each variable must be known at compile time.

Scalar Data Types (Integers, felt252, Booleans, Strings)

# Scalar Data Types (Integers, felt252, Booleans, Strings)

Cairo requires all variables to have a known type at compile time. While the compiler can often infer types, explicit type annotations or conversion methods can be used when necessary.

```cairo
#[executable]
fn main() {
    let x: felt252 = 3;
    let y: u32 = x.try_into().unwrap();
}
```

## Scalar Types

Scalar types represent single values. Cairo has three primary scalar types: `felt252`, integers, and booleans.

### Felt Type

The default type for variables and arguments in Cairo, if not specified, is `felt252`. This represents a field element, an integer in the range \( 0 \leq x < P \), where \( P \) is a large prime number (\( {2^{251}} + 17 \cdot {2^{192}} + 1 \)). Operations on `felt252` are performed modulo \( P \).

Division in Cairo is defined such that \( \frac{x}{y} \cdot y = x \). If \( y \) does not divide \( x \) as integers, the result will be a value that satisfies this equation in the finite field. For example, \( \frac{1}{2} \) in Cairo is \( \frac{P+1}{2} \).

### Integer Types

It is recommended to use integer types over `felt252` for added security features like overflow and underflow checks. Integers are numbers without a fractional component, and their type declaration specifies the number of bits used for storage.

The built-in unsigned integer types in Cairo are:

| Length  | Unsigned |
| ------- | -------- |
| 8-bit   | `u8`     |
| 16-bit  | `u16`    |
| 32-bit  | `u32`    |
| 64-bit  | `u64`    |
| 128-bit | `u128`   |
| 256-bit | `u256`   |
| 32-bit  | `usize`  |

<br>
<div align="center"><span class="caption">Table 3-1: Integer Types in Cairo.</span></div>

The `usize` type is currently an alias for `u32`. Unsigned integers cannot hold negative numbers; attempting to subtract a larger number from a smaller one will cause a panic.

```cairo
fn sub_u8s(x: u8, y: u8) -> u8 {
    x - y
}

#[executable]
fn main() {
    sub_u8s(1, 3);
}
```

The `u256` type requires 4 more bits than `felt252` and is implemented as a struct: `u256 {low: u128, high: u128}`.

Cairo also supports signed integers with the prefix `i` (e.g., `i8` to `i128`). A signed integer of `n` bits can represent numbers from \( -({2^{n - 1}}) \) to \( {2^{n - 1}} - 1 \). For example, `i8` ranges from -128 to 127.

Integer literals can be written in decimal, hexadecimal, octal, or binary formats, with optional type suffixes and underscores for readability:

| Numeric literals | Example   |
| ---------------- | --------- |
| Decimal          | `98222`   |
| Hex              | `0xff`    |
| Octal            | `0o04321` |
| Binary           | `0b01`    |

<br>
<div align="center"><span class="caption">Table 3-2: Integer Literals in Cairo.</span></div>

When choosing an integer type, estimate the maximum possible value. `usize` is typically used for indexing collections.

Cairo supports standard numeric operations: addition, subtraction, multiplication, division, and remainder. Integer division truncates towards zero.

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

### The Boolean Type

The `bool` type in Cairo has two possible values: `true` and `false`. A `bool` occupies the size of one `felt252`. Boolean variables must be initialized with `true` or `false` literals, not integer equivalents like `0` or `1`. Booleans are primarily used in control flow structures like `if` expressions.

```cairo
#[executable]
fn main() {
    let t = true;

    let f: bool = false; // with explicit type annotation
}
```

### String Types

Cairo does not have a built-in native string type but supports strings through two mechanisms: short strings and `ByteArray`.

#### Short strings

Short strings are ASCII strings where each character is encoded on one byte. They are represented using single quotes (`' '`) and utilize the `felt252` type. A `felt252` can store up to 31 ASCII characters (248 bits), as it is 251 bits in size. Short strings can be represented as hexadecimal values or directly as characters.

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

For strings longer than 31 characters or when byte sequence operations are needed, Cairo's Core Library provides the `ByteArray` type. It is implemented using an array of `bytes31` words and a buffer for incomplete words, abstracting the underlying memory management. `ByteArray` strings are enclosed in double quotes (`" "`).

```cairo
# #[executable]
# fn main() {
#     let my_first_char = 'C';
#     let my_first_char_in_hex = 0x43;
#
#     let my_first_string = 'Hello world';
#     let my_first_string_in_hex = 0x48656C6C6F20776F726C64;
#
    let long_string: ByteArray = "this is a string which has more than 31 characters";
# }
```

Compound Data Types (Tuples, Arrays)

# Compound Data Types (Tuples, Arrays)

## Tuples

Tuples are a way to group multiple values of potentially different types into a single compound type. They are defined using parentheses. Each position in a tuple has a specific type.

```cairo
#[executable]
fn main() {
    let tup: (u32, u64, bool) = (10, 20, true);
}
```

You can destructure a tuple to access its individual values:

```cairo
#[executable]
fn main() {
    let tup = (500, 6, true);

    let (x, y, z) = tup;

    if y == 6 {
        println!("y is 6!");
    }
}
```

You can also declare and destructure a tuple simultaneously:

```cairo
#[executable]
fn main() {
    let (x, y): (felt252, felt252) = (2, 3);
}
```

### The Unit Type `()`

The unit type, represented by `()`, is a tuple with no elements. It signifies that an expression returns no meaningful value.

### Refactoring with Tuples

Tuples can be used to group related data, improving code readability. For example, grouping width and height for a rectangle:

```cairo
#[executable]
fn main() {
    let rectangle = (30, 10); // (width, height)
    let area = area(rectangle);
    println!("Area is {}", area);
}

fn area(dimension: (u64, u64)) -> u64 {
    let (width, height) = dimension;
    width * height
}
```

## Fixed-Size Arrays

Fixed-size arrays are collections where all elements must have the same type. They are defined using square brackets, specifying the element type and the number of elements.

The syntax for an array's type is `[element_type; number_of_elements]`.

```cairo
#[executable]
fn main() {
    let arr1: [u64; 5] = [1, 2, 3, 4, 5];
}
```

Fixed-size arrays are efficient for storing data with a known, unchanging size, such as lookup tables. They differ from the dynamically sized `Array<T>` type provided by the core library.

You can initialize an array with a default value for all elements:

```cairo
let a = [3; 5]; // Creates an array of 5 elements, all initialized to 3.
```

An example using an array for month names:

```cairo
let months = [
    'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
    'October', 'November', 'December',
];
```

Variable Declaration, Mutability, and Shadowing

# Variable Declaration, Mutability, and Shadowing

In Cairo, you can declare variables using the `let` keyword. Shadowing allows you to declare a new variable with the same name as a previous one, effectively "shadowing" the older variable. This is useful for reusing variable names, especially when changing types.

For example, you can shadow a `u64` variable with a `felt252` variable:

```cairo
#[executable]
fn main() {
    let x: u64 = 2;
    println!("The value of x is {} of type u64", x);
    let x: felt252 = x.into(); // converts x to a felt, type annotation is required.
    println!("The value of x is {} of type felt252", x);
}
```

However, mutability (`mut`) does not allow changing the type of a variable. Attempting to assign a value of a different type to a mutable variable will result in a compile-time error.

```cairo,does_not_compile
#[executable]
fn main() {
    let mut x: u64 = 2;
    println!("The value of x is: {}", x);
    x = 5_u8; // This line causes a compile-time error
    println!("The value of x is: {}", x);
}
```

The error message indicates that the expected type (`u64`) does not match the found type (`u8`):

```shell
$ scarb execute
  Compiling no_listing_05_mut_cant_change_type v0.1.0 (listings/ch02-common-programming-concepts/no_listing_05_mut_cant_change_type/Scarb.toml)
error: Unexpected argument type. Expected: "core::integer::u64", found: "core::integer::u8".
 --> listings/ch02-common-programming-concepts/no_listing_05_mut_cant_change_type/src/lib.cairo:7:9
    x = 5_u8;
        ^^^^

error: could not compile `no_listing_05_mut_cant_change_type` due to previous error
error: `scarb metadata` exited with error

```

This demonstrates that while shadowing allows for type changes by declaring a new variable, mutability enforces that the variable retains its original type.

Type Conversion and Arithmetic Operations

# Type Conversion and Arithmetic Operations

Cairo provides generic traits for converting between types: `Into` and `TryInto`.

## Into

The `Into` trait is used for infallible type conversions. To perform a conversion, call `var.into()` on the source value. The target variable's type must be explicitly defined.

```cairo
#[executable]
fn main() {
    let my_u8: u8 = 10;
    let my_u16: u16 = my_u8.into();
    let my_u32: u32 = my_u16.into();
    let my_u64: u64 = my_u32.into();
    let my_u128: u128 = my_u64.into();

    let my_felt252 = 10;
    // As a felt252 is smaller than a u256, we can use the into() method
    let my_u256: u256 = my_felt252.into();
    let my_other_felt252: felt252 = my_u8.into();
    let my_third_felt252: felt252 = my_u16.into();
}
```

## TryInto

The `TryInto` trait is used for fallible type conversions, returning `Option<T>`, as the target type might not fit the source value. To perform the conversion, call `var.try_into()` on the source value. The new variable's type must also be explicitly defined.

```cairo
#[executable]
fn main() {
    let my_u256: u256 = 10;

    // Since a u256 might not fit in a felt252, we need to unwrap the Option<T> type
    let my_felt252: felt252 = my_u256.try_into().unwrap();
    let my_u128: u128 = my_felt252.try_into().unwrap();
    let my_u64: u64 = my_u128.try_into().unwrap();
    let my_u32: u32 = my_u64.try_into().unwrap();
    let my_u16: u16 = my_u32.try_into().unwrap();
    let my_u8: u8 = my_u16.try_into().unwrap();

    let my_large_u16: u16 = 2048;
    let my_large_u8: u8 = my_large_u16.try_into().unwrap(); // panics with 'Option::unwrap failed.'
}
```

Special Data Types and Concepts (u256, Range Check, Recursive Types)

# Special Data Types and Concepts (u256, Range Check, Recursive Types)

## Recursive Types

Defining a recursive data type in Cairo, where a variant directly contains another value of the same type, leads to a compilation error. This is because Cairo cannot determine the fixed size required to store such a type, as it would theoretically have an "infinite size."

For example, a `BinaryTree` defined with a `Node` variant that holds child nodes of type `BinaryTree` will fail to compile:

```plaintext
error: Recursive type "(core::integer::u32, listing_recursive_types_wrong::BinaryTree, listing_recursive_types_wrong::BinaryTree)" has infinite size.
 --> listings/ch12-advanced-features/listing_recursive_types_wrong/src/lib.cairo:6:5
    Node: (u32, BinaryTree, BinaryTree),
    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

error: Recursive type "listing_recursive_types_wrong::BinaryTree" has infinite size.
 --> listings/ch12-advanced-features/listing_recursive_types_wrong/src/lib.cairo:11:17
    let leaf1 = BinaryTree::Leaf(1);
                ^^^^^^^^^^^^^^^^^^^
```

## Range Check Builtin

The Range Check builtin is crucial for verifying that field elements fall within specific bounds, which is essential for Cairo's integer types and operations.

### Purpose and Importance

This builtin ensures that values adhere to bounded constraints. While range checking can be implemented in pure Cairo, it is significantly less efficient. A pure Cairo implementation might require hundreds of instructions for a single check, whereas the builtin's cost is equivalent to approximately 1.5 instructions. This efficiency makes it vital for bounded arithmetic and other operations requiring value range verification.

### Variants

Two variants of the Range Check builtin exist:

- **Standard Range Check**: Verifies values in the range $[0, 2^{128}-1]$.
- **Range Check 96**: Verifies values in the range $[0, 2^{96}-1]$.

This section focuses on the standard variant, but the principles apply to both.

### Cells Organization

The Range Check builtin utilizes a dedicated memory segment with specific validation properties:

- **Valid values**: Field elements within the range $[0, 2^{128}-1]$.
- **Error conditions**: Values greater than or equal to $2^{128}$ or relocatable addresses.

Working with Data Types (Printing, Examples)

# Working with Data Types (Printing, Examples)

## Printing and Concatenating Strings

The `write!` macro can be used to concatenate multiple strings on the same line and then print the result.

```cairo
use core::fmt::Formatter;

#[executable]
fn main() {
    let mut formatter: Formatter = Default::default();
    let a = 10;
    let b = 20;
    write!(formatter, "hello");
    write!(formatter, "world");
    write!(formatter, " {a} {b}");

    println!("{}", formatter.buffer); // helloworld 10 20
}
```

## Implementing the `Display` Trait

You can implement the `Display` trait for custom structs to define how they should be printed.

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
    println!("{}", p); // Point: (1, 3)
}
```

_Note: Printing complex data types using `Display` might require additional steps. For debugging complex data types, consider using the `Debug` trait._

## Printing in Hexadecimal

By default, the `Display` trait prints integers in decimal. To print them in hexadecimal, use the `{:x}` notation.

Cairo implements the `LowerHex` trait for common types like unsigned integers, `felt252`, `NonZero`, `ContractAddress`, and `ClassHash`. You can also implement `LowerHex` for custom types similarly to how the `Display` trait is implemented.

Functions in Cairo

Defining and Calling Functions

# Defining and Calling Functions

Functions are a fundamental part of Cairo code. The `fn` keyword is used to declare new functions, and Cairo conventionally uses snake case (all lowercase with underscores separating words) for function and variable names.

## Defining Functions

A function is defined using the `fn` keyword, followed by the function name, parentheses `()`, and curly braces `{}` to enclose the function body. For example:

```cairo
fn another_function() {
    println!("Another function.");
}
```

## Calling Functions

Functions can be called by using their name followed by parentheses. A function can be called from anywhere in the program as long as it is defined within a visible scope. The order of definition in the source code does not matter.

```cairo
#[executable]
fn main() {
    println!("Hello, world!");
    another_function();
}
```

When the above code is executed, the output is:

```shell
$ scarb execute
   Compiling no_listing_15_functions v0.1.0 (listings/ch02-common-programming-concepts/no_listing_15_functions/Scarb.toml)
    Finished `dev` profile target(s) in 3 seconds
   Executing no_listing_15_functions
Hello, world!
Another function.


```

## Abstracting with Functions

Functions can be used to abstract code, making it more reusable and easier to maintain. This is particularly useful for eliminating code duplication.

Consider a function `largest` that finds the largest number in an array of `u8` values:

```cairo
fn largest(ref number_list: Array<u8>) -> u8 {
    let mut largest = number_list.pop_front().unwrap();

    while let Some(number) = number_list.pop_front() {
        if number > largest {
            largest = number;
        }
    }

    largest
}

#[executable]
fn main() {
    let mut number_list = array![34, 50, 25, 100, 65];

    let result = largest(ref number_list);
    println!("The largest number is {}", result);

    let mut number_list = array![102, 34, 255, 89, 54, 2, 43, 8];

    let result = largest(ref number_list);
    println!("The largest number is {}", result);
}
```

This `largest` function takes an array `number_list` by reference and returns a `u8` value. The process of creating such a function involves:

- Identifying duplicated code.
- Extracting the duplicated code into a function body, defining its inputs (parameters) and return values in the function signature.
- Replacing the original duplicated code with calls to the newly created function.

Function Parameters and Return Values

# Function Parameters and Return Values

Functions can accept parameters, which are variables declared in the function's signature. When calling a function, concrete values called arguments are provided for these parameters.

## Parameters

Parameters must have their types declared in the function signature.

```cairo
#[executable]
fn main() {
    another_function(5);
}

fn another_function(x: felt252) {
    println!("The value of x is: {}", x);
}
```

Output:

```shell
$ scarb execute
   Compiling no_listing_16_single_param v0.1.0 (listings/ch02-common-programming-concepts/no_listing_16_single_param/Scarb.toml)
    Finished `dev` profile target(s) in 4 seconds
   Executing no_listing_16_single_param
The value of x is: 5


```

### Multiple Parameters

Multiple parameters are separated by commas.

```cairo
fn print_labeled_measurement(value: u128, unit_label: ByteArray) {
    println!("The measurement is: {value}{unit_label}");
}

#[executable]
fn main() {
    print_labeled_measurement(5, "h");
}
```

Output:

```shell
$ scarb execute
   Compiling no_listing_17_multiple_params v0.1.0 (listings/ch02-common-programming-concepts/no_listing_17_multiple_params/Scarb.toml)
    Finished `dev` profile target(s) in 5 seconds
   Executing no_listing_17_multiple_params
The measurement is: 5h


```

### Named Parameters

Named parameters allow specifying argument names during function calls for improved readability. The syntax is `parameter_name: value`. If a variable has the same name as the parameter, `:parameter_name` can be used.

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

## Return Values

Functions can return values. The return type is specified after the parameter list using `-> type`. If the last expression in a function's body does not end with a semicolon, it is implicitly returned.

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

Output:

```shell
$ scarb execute
   Compiling no_listing_20_function_return_values v0.1.0 (listings/ch02-common-programming-concepts/no_listing_22_function_return_values/Scarb.toml)
    Finished `dev` profile target(s) in 3 seconds
   Executing no_listing_20_function_return_values
The value of x is: 5


```

Alternatively, an explicit `return` keyword can be used.

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

Adding a semicolon to the last expression changes it from an expression to a statement, which would result in an error if it were the intended return value.

Compile-Time Functions

# Compile-Time Functions

Functions that can be evaluated at compile time can be marked as `const` using the `const fn` syntax. This allows the function to be called from a constant context and interpreted by the compiler at compile time.

Declaring a function as `const` restricts the types that arguments and the return type may use, and limits the function body to constant expressions.

Several functions in the core library are marked as `const`. Here's an example from the core library showing the `pow` function implemented as a `const fn`:

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

In this example, `pow` is a `const` function, allowing it to be used in a constant expression to define `mask` at compile time. Here's a snippet of how `pow` is defined in the core library using `const fn`:

Note that declaring a function as `const` has no effect on existing uses; it only imposes restrictions for constant contexts.

Code Reusability and Internal Functions

# Code Reusability and Internal Functions

Functions not marked with `#[external(v0)]` or within an `#[abi(embed_v0)]` block are considered private (or internal) and can only be called from within the same contract.

These internal functions can be organized in two ways:

1.  **Grouped in a dedicated `impl` block:** This allows for easy importing of internal functions into embedding contracts.
2.  **Added as free functions** within the contract module.

Both methods are equivalent, and the choice depends on code readability and usability.

```cairo,noplayground
# use starknet::ContractAddress;
#
# #[starknet::interface]
# pub trait INameRegistry<TContractState> {
#     fn store_name(ref self: TContractState, name: felt252);
#     fn get_name(self: @TContractState, address: ContractAddress) -> felt252;
# }
#
# #[starknet::contract]
# mod NameRegistry {
#     use starknet::storage::{
#         Map, StoragePathEntry, StoragePointerReadAccess, StoragePointerWriteAccess,
#     };
#     use starknet::{ContractAddress, get_caller_address};
#
#     #[storage]
#     struct Storage {
#         names: Map<ContractAddress, felt252>,
#         total_names: u128,
#     }
#
#     #[derive(Drop, Serde, starknet::Store)]
#     pub struct Person {
#         address: ContractAddress,
#         name: felt252,
#     }
#
#     #[constructor]
#     fn constructor(ref self: ContractState, owner: Person) {
#         self.names.entry(owner.address).write(owner.name);
#         self.total_names.write(1);
#     }
#
#     // Public functions inside an impl block
#     #[abi(embed_v0)]
#     impl NameRegistry of super::INameRegistry<ContractState> {
#         fn store_name(ref self: ContractState, name: felt252) {
#             let caller = get_caller_address();
#             self._store_name(caller, name);
#         }
#
#         fn get_name(self: @ContractState, address: ContractAddress) -> felt252 {
#             self.names.entry(address).read()
#         }
#     }
#
#     // Standalone public function
#     #[external(v0)]
#     fn get_contract_name(self: @ContractState) -> felt252 {
#         'Name Registry'
#     }
#
    // Could be a group of functions about a same topic
    #[generate_trait]
    impl InternalFunctions of InternalFunctionsTrait {
        fn _store_name(ref self: ContractState, user: ContractAddress, name: felt252) {
            let total_names = self.total_names.read();

            self.names.entry(user).write(name);

            self.total_names.write(total_names + 1);
        }
    }

    // Free function
    fn get_total_names_storage_address(self: @ContractState) -> felt252 {
        self.total_names.__base_address__
    }
# }
#
```

Function Execution Details

# Function Execution Details

### Function Calls and Execution Flow

The `function_call` libfunc is used to execute functions. When a function is called, its code is executed, and return values are stored. The execution flow can be affected by whether a function is inlined or not.

For example, calling a function `not_inlined` might involve:

```cairo,noplayground
09	felt252_const<2>() -> ([0])
10	store_temp<felt252>([0]) -> ([0])
```

This code uses `felt252_const<2>` to get the value 2 and `store_temp<felt252>` to store it.

### Inlined vs. Non-Inlined Functions

Inlined functions have their code directly inserted into the calling function's execution path. This can affect variable IDs if a variable with the same ID already exists.

Consider the Sierra statements for an `inlined` function:

```cairo,noplayground
01	felt252_const<1>() -> ([1])
02	store_temp<felt252>([1]) -> ([1])
```

Here, the value 1 is stored in variable `[1]` because `[0]` might already be in use.

The return values of called functions are not executed prematurely. Instead, they are processed, and the final result is returned. For instance, adding values from variables `[0]` and `[1]`:

```cairo,noplayground
03	felt252_add([1], [0]) -> ([2])
04	store_temp<felt252>([2]) -> ([2])
05	return([2])
```

### Casm Code Example

The following Casm code illustrates the execution of a program involving function calls:

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

This code demonstrates `call` and `ret` instructions, along with memory operations using `ap++` for storing values.

Cairo Functions Quiz

# Cairo Functions Quiz

The keyword for declaring a new function in Cairo is: `fn`

A function must declare the types of its parameters. For example, function `f` could be corrected by adding `u8` type to the `x` parameter like this: `fn f(x:u8)`.

In Cairo, a curly-brace block like `{ /* ... */ }` is:

1. An expression
2. A statement
3. A syntactic scope

The following program compiles and prints `3`:

```rust
fn f(x: usize) -> usize { x + 1 }
fn main() {
  println!("{}", f({
    let y = 1;
    y + 1
  }));
}
```

Control Flow in Cairo

Conditional Logic (`if` expressions)

# Conditional Logic (`if` expressions)

An `if` expression in Cairo allows for branching code execution based on a condition. The syntax involves the `if` keyword followed by a boolean condition, and a block of code to execute if the condition is true. An optional `else` block can be provided for execution when the condition is false.

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

Cairo strictly requires conditions to be of type `bool`. Unlike some other languages, it does not automatically convert non-boolean types to booleans. For example, an `if` condition cannot be a numeric literal like `3`.

```cairo
#[executable]
fn main() {
    let number = 3;

    if number != 0 {
        println!("number was something other than zero");
    }
}
```

## Handling Multiple Conditions with `else if`

Multiple conditions can be handled by chaining `if` and `else` into `else if` expressions. The code block corresponding to the first true condition is executed.

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

## Using `if` in a `let` Statement

Since `if` is an expression in Cairo, its result can be assigned to a variable using a `let` statement. Both the `if` and `else` blocks must return the same type.

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

Looping Constructs (`loop`, `while`, `for`)

# Looping Constructs (`loop`, `while`, `for`)

Cairo provides several ways to execute code repeatedly.

## The `loop` Construct

The `loop` keyword executes a block of code indefinitely until explicitly stopped. You can interrupt a `loop` using `ctrl-c` or by using the `break` keyword within the loop.

```cairo
#[executable]
fn main() {
    loop {
        println!("again!");
    }
}
```

Cairo's gas mechanism prevents infinite loops in practice by limiting computation. The `--available-gas` flag can be used to set a gas limit, which will stop the program if it's exceeded. This is crucial for smart contracts to prevent unbounded execution.

A `loop` can also return a value. This is achieved by placing the value after the `break` keyword.

```cairo
fn main() {
    let mut counter = 0;
    let result = loop {
        counter += 1;
        if counter == 10 {
            break counter * 2;
        }
    };
    println!("The result is {}", result);
}
```

## Conditional Loops with `while`

The `while` loop executes a block of code as long as a given condition remains true. This is useful for repeating actions until a specific state is reached.

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

While `while` loops are effective, iterating over collections using a manual index with `while` can be error-prone and less efficient due to bounds checking on each iteration. For example:

```cairo
#[executable]
fn main() {
    let a = [10, 20, 30, 40, 50].span();
    let mut index = 0;

    while index < 5 {
        println!("the value is: {}", a[index]);
        index += 1;
    }
}
```

## Looping Through a Collection with `for`

The `for` loop provides a more concise and safer way to iterate over the elements of a collection.

```cairo
#[executable]
fn main() {
    let a = [10, 20, 30, 40, 50].span();

    for element in a {
        println!("the value is: {element}");
    }
}
```

This approach avoids manual index management and potential errors associated with incorrect bounds checking.

Loop Control and Iteration

# Loop Control and Iteration

## Breaking out of a Loop

The `break` keyword can be used to exit a loop prematurely.

```cairo
#[executable]
fn main() {
    let mut i: usize = 0;
    loop {
        if i > 10 {
            break;
        }
        println!("i = {}", i);
        i += 1;
    }
}
```

## Continuing to the Next Iteration

The `continue` keyword skips the rest of the current loop iteration and proceeds to the next one.

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

Executing this program will not print the value of `i` when it is equal to `5`.

## Returning Values from Loops

A `loop` can return a value. This is achieved by placing the value after the `break` keyword.

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

Loop Compilation and Recursion

Loops and recursive functions are fundamental control flow mechanisms in Cairo, allowing for code repetition.

### Using `Range` for Iteration

The `for` loop is generally preferred for its safety and conciseness. The `Range` type from the core library generates numbers in a sequence, making iteration straightforward.

```cairo
#[executable]
fn main() {
    for number in 1..4_u8 {
        println!("{number}!");
    }
    println!("Go!!!");
}
```

This code iterates from 1 up to (but not including) 4, printing each number.

### Infinite Loops and `break`

The `loop` keyword creates an infinite loop that can be exited using the `break` keyword.

```cairo
#[executable]
fn main() -> felt252 {
    let mut x: felt252 = 0;
    loop {
        if x == 2 {
            break;
        } else {
            x += 1;
        }
    }
    x
}
```

In this example, the loop continues incrementing `x` until it equals 2, at which point it breaks and returns `x`.

### Equivalence Between Loops and Recursive Functions

Loops and recursive functions are conceptually interchangeable. A loop can be transformed into a recursive function by having the function call itself.

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

This recursive function achieves the same result as the `loop` example, incrementing `x` until it reaches 2.

### Compilation to Sierra

In Cairo, loops and recursive functions are compiled into very similar low-level representations in Sierra. To observe this, you can enable Sierra text output in your `Scarb.toml`:

```toml
[lib]
sierra-text = true
```

After running `scarb build`, the generated Sierra code for equivalent loop and recursive function examples will show striking similarities, indicating that the compiler optimizes loops into recursive function calls at the Sierra level.

Pattern Matching (`match`, `if let`, `while let`)

# Pattern Matching (`match`, `if let`, `while let`)

Cairo offers powerful control flow constructs for pattern matching, enabling concise and expressive code.

## The `match` Control Flow Construct

The `match` expression allows you to compare a value against a series of patterns and execute code based on the first matching pattern. The compiler enforces that all possible cases are handled, ensuring completeness.

### Example: Matching an Enum

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

### Matching Multiple Patterns

Multiple patterns can be combined using the `|` operator:

```cairo,noplayground
fn vending_machine_accept(coin: Coin) -> bool {
    match coin {
        Coin::Dime | Coin::Quarter => true,
        _ => false,
    }
}
```

### Matching Tuples

Tuples can be matched by specifying patterns for each element:

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

The wildcard `_` can be used to ignore specific tuple elements.

### Matching `felt252` and Integer Variables

You can match against `felt252` and integer variables, useful for ranges. Restrictions apply: only integers fitting into a single `felt252` are supported, the first arm must be 0, and arms must cover sequential segments contiguously.

```cairo,noplayground
fn roll(value: u8) {
    match value {
        0 | 1 | 2 => println!("you won!"),
        3 => println!("you can roll again!"),
        _ => println!("you lost..."),
    }
}
```

_Note: These restrictions are planned to be relaxed in future Cairo versions._

## Concise Control Flow with `if let`

The `if let` syntax provides a more concise way to handle values that match a single pattern, ignoring others. It's syntactic sugar for a `match` that executes code for one pattern and ignores the rest.

### Example: Handling `Some` Variant

```cairo
# #[executable]
# fn main() {
    let number = Some(5);
    if let Some(max) = number {
        println!("The maximum is configured to be {}", max);
    }
# }
```

This is less verbose than a `match` that requires a catch-all `_` arm. `if let` can also include an `else` block for non-matching cases.

```cairo
# #[derive(Drop)]
# enum Coin {
#     Penny,
#     Nickel,
#     Dime,
#     Quarter,
# }
#
# #[executable]
# fn main() {
    let coin = Coin::Quarter;
    let mut count = 0;
    if let Coin::Quarter = coin {
        println!("You got a quarter!");
    } else {
        count += 1;
    }
#     println!("{}", count);
# }
```

## `while let` for Looping

The `while let` syntax allows looping over a collection of values, executing a block of code for each value that matches a specified pattern.

### Example: Popping from a Collection

```cairo
#[executable]
fn main() {
    let mut arr = array![1, 2, 3, 4, 5, 6, 7, 8, 9];
    let mut sum = 0;
    while let Some(value) = arr.pop_front() {
        sum += value;
    }
    println!("{}", sum);
}
```

This offers a more concise and idiomatic way to loop compared to traditional `while` loops with explicit `Option` handling. However, like `if let`, it sacrifices the exhaustive checking of `match`.

Review and Project Organization

# Review and Project Organization

Collections in Cairo

Introduction to Cairo Arrays

# Introduction to Cairo Arrays

An array in Cairo is a collection of elements of the same type. It can be used by leveraging the `ArrayTrait` from the core library. Arrays in Cairo function as queues, meaning their values cannot be modified after creation. Elements can only be appended to the end and removed from the front, due to the immutability of memory slots once written.

## Creating an Array

Arrays are instantiated using `ArrayTrait::new()`. You can optionally specify the type of elements the array will hold during instantiation or by defining the variable type.

```cairo
#[executable]
fn main() {
    let mut a = ArrayTrait::new();
    a.append(0);
    a.append(1);
    a.append(2);
}
```

Explicit type definition examples:

```cairo, noplayground
let mut arr = ArrayTrait::<u128>::new();
```

```cairo, noplayground
let mut arr:Array<u128> = ArrayTrait::new();
```

Array Creation and Structure

# Array Creation and Structure

## `array!` Macro

The `array!` macro simplifies the creation of arrays with known values at compile time. It expands to code that appends items sequentially, reducing verbosity compared to manually declaring and appending.

**Without `array!`:**

```cairo
    let mut arr = ArrayTrait::new();
    arr.append(1);
    arr.append(2);
    arr.append(3);
    arr.append(4);
    arr.append(5);
```

**With `array!`:**

```cairo
    let arr = array![1, 2, 3, 4, 5];
```

## Storing Multiple Types with Enums

To store elements of different types within an array, you can define a custom data type using an `Enum`.

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

A `Span` represents a snapshot of an `Array`, providing safe, read-only access to its elements without modifying the original array. This is useful for data integrity and avoiding borrowing issues. All `Array` methods, except `append()`, can be used with `Span`.

Array Operations and Manipulation

# Array Operations and Manipulation

## Adding Elements

Elements can be added to the end of an array using the `append()` method.

```cairo
# #[executable]
# fn main() {
#     let mut a = ArrayTrait::new();
#     a.append(0);
    a.append(1);
#     a.append(2);
# }
```

## Removing Elements

Elements can only be removed from the front of an array using the `pop_front()` method. This method returns an `Option` which can be unwrapped to get the removed element, or `None` if the array is empty.

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

The above code will print `The first value is 10`.

Cairo's memory immutability means elements cannot be modified in place. Operations like `append` and `pop_front` work by updating pointers, not by mutating memory cells.

## Reading Elements from an Array

Array elements can be accessed using the `get()` or `at()` methods. `arr.at(index)` is equivalent to `arr[index]`.

### `get()` Method

The `get()` method returns an `Option<Box<@T>>`. It returns a snapshot of the element at the specified index if it exists, otherwise `None`. This is useful for handling potential out-of-bounds access gracefully.

### `set()` Method

The `set()` method allows updating a value at a specific index. It asserts that the index is within the array's bounds before performing the update.

```cairo,noplayground
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
# impl DestructMemoryVec<T, +Drop<T>> of Destruct<MemoryVec<T>> {
#     fn destruct(self: MemoryVec<T>) nopanic {
#         self.data.squash();
#     }
# }
#
# impl MemoryVecImpl<T, +Drop<T>, +Copy<T>> of MemoryVecTrait<MemoryVec<T>, T> {
#     fn new() -> MemoryVec<T> {
#         MemoryVec { data: Default::default(), len: 0 }
#     }
#
#     fn get(ref self: MemoryVec<T>, index: usize) -> Option<T> {
#         if index < self.len() {
#             Some(self.data.get(index.into()).deref())
#         } else {
#             None
#         }
#     }
#
#     fn at(ref self: MemoryVec<T>, index: usize) -> T {
#         assert!(index < self.len(), "Index out of bounds");
#         self.data.get(index.into()).deref()
#     }
#
#     fn push(ref self: MemoryVec<T>, value: T) -> () {
#         self.data.insert(self.len.into(), NullableTrait::new(value));
#         self.len.wrapping_add(1_usize);
#     }
    fn set(ref self: MemoryVec<T>, index: usize, value: T) {
        assert!(index < self.len(), "Index out of bounds");
        self.data.insert(index.into(), NullableTrait::new(value));
    }
#     fn len(self: @MemoryVec<T>) -> usize {
#         *self.len
#     }
# }
#
#
```

Accessing Array Elements and Safety

# Accessing Array Elements and Safety

## Fixed-Size Arrays

Fixed-size arrays store their elements contiguously in the program bytecode. Accessing elements is efficient. There are two primary ways to access elements:

### Deconstruction

Similar to tuples, fixed-size arrays can be deconstructed into individual variables.

```cairo
#[executable]
fn main() {
    let my_arr = [1, 2, 3, 4, 5];

    // Accessing elements of a fixed-size array by deconstruction
    let [a, b, c, _, _] = my_arr;
    println!("c: {}", c); // c: 3
}
```

### Using `Span` and Indexing

Converting a fixed-size array to a `Span` allows for indexing. This conversion is free.

```cairo
#[executable]
fn main() {
    let my_arr = [1, 2, 3, 4, 5];

    // Accessing elements of a fixed-size array by index
    let my_span = my_arr.span();
    println!("my_span[2]: {}", my_span[2]); // my_span[2]: 3
}
```

Calling `.span()` once and reusing the `Span` is recommended for repeated accesses.

## Dynamic Arrays

Dynamic arrays offer methods for accessing elements, with different safety guarantees.

### `get()` Method

The `get()` method returns an `Option<Box<T>>`, allowing for safe access that handles out-of-bounds indices by returning `None`.

```cairo
#[executable]
fn main() -> u128 {
    let mut arr = ArrayTrait::<u128>::new();
    arr.append(100);
    let index_to_access = 1; // Change this value to see different results, what would happen if the index doesn't exist?
    match arr.get(index_to_access) {
        Some(x) => {
            *x // Don't worry about * for now, if you are curious see Chapter 4.2 #desnap operator
            // It basically means "transform what get(idx) returned into a real value"
        },
        None => { panic!("out of bounds") },
    }
}
```

### `at()` Method and Subscripting Operator

The `at()` method and the subscripting operator (`[]`) provide direct access to array elements. They return a snapshot to the element, which can be dereferenced using `unbox()`. If the index is out of bounds, these methods cause a panic. Use them when out-of-bounds access should halt execution.

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

In summary:

- Use `get()` for safe access where out-of-bounds conditions are handled gracefully.
- Use `at()` or the subscripting operator (`[]`) when a panic is desired for out-of-bounds access.

## Size-related Methods

The `len()` method returns the number of elements in an array as a `usize`.

Testing and Verification

# Testing and Verification

Dictionaries in Cairo

Introduction to Cairo Dictionaries

### Introduction to Cairo Dictionaries

Cairo provides a dictionary-like data type, `Felt252Dict<T>`, which represents a collection of unique key-value pairs. This structure is known by various names in other programming languages, such as maps, hash tables, or associative arrays.

`Felt252Dict<T>` is particularly useful for organizing data when a simple array indexing is insufficient and for simulating mutable memory. In Cairo, the key type is restricted to `felt252`, while the value type `T` can be specified.

The core operations for `Felt252Dict<T>` are defined in the `Felt252DictTrait`, including:

- `insert(felt252, T) -> ()`: Writes a value to the dictionary.
- `get(felt252) -> T`: Reads a value from the dictionary.

Here's an example demonstrating the basic usage of dictionaries to map individuals to their balances:

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

Internal Implementation of `Felt252Dict`

# Internal Implementation of `Felt252Dict`

## Memory Model and Entry List

Cairo's memory system is immutable. To simulate mutability for dictionaries, `Felt252Dict<T>` is implemented as a list of entries. Each entry records an interaction with a key-value pair.

### `Entry<T>` Structure

An `Entry<T>` has three fields:

- `key`: The identifier for the key-value pair.
- `previous_value`: The value held at `key` before the current operation.
- `new_value`: The new value held at `key` after the current operation.

The structure is defined as:

```cairo,noplayground
struct Entry<T> {
    key: felt252,
    previous_value: T,
    new_value: T,
}
```

## Operation Logging

Every interaction with a `Felt252Dict<T>` registers a new `Entry<T>`:

- **`get`**: Registers an entry where `previous_value` and `new_value` are the same, indicating no state change.
- **`insert`**: Registers an entry where `new_value` is the inserted element. `previous_value` is the last value for that key; if it's the first entry for the key, `previous_value` is zero.

This method avoids rewriting memory, instead creating new memory cells for each operation.

### Example Log

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

These operations produce the following list of entries:

| key   | previous | new |
| :---- | -------- | --- |
| Alex  | 0        | 100 |
| Maria | 0        | 50  |
| Alex  | 100      | 200 |
| Maria | 50       | 50  |

When a key does not exist in the dictionary, its value defaults to zero. This is managed by the `zero_default` method from the `Felt252DictValue<T>` trait.

Dictionary Operations and Methods

# Dictionary Operations and Methods

Cairo's `Felt252Dict<T>` type provides a way to work with key-value pairs, overcoming the immutability of Cairo's memory by allowing updates to stored values.

## Basic Operations: `insert` and `get`

You can create a new dictionary instance using `Default::default()` and manage its contents with methods like `insert` and `get`, which are defined in the `Felt252DictTrait` trait.

The `insert` method adds or updates a value associated with a key. The `get` method retrieves the value for a given key. Notably, `Felt252Dict<T>` allows you to "rewrite" a stored value by inserting a new value for an existing key.

Here's an example demonstrating how to insert and update values for a user's balance:

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

## Advanced Operations: `entry` and `finalize`

The `entry` and `finalize` methods, also part of `Felt252DictTrait<T>`, provide finer control over dictionary updates, allowing you to replicate internal operations.

### The `entry` Method

The `entry` method takes ownership of the dictionary and a key, returning a `Felt252DictEntry<T>` and the previous value associated with the key. This prepares an entry for modification.

```cairo,noplayground
fn entry(self: Felt252Dict<T>, key: felt252) -> (Felt252DictEntry<T>, T) nopanic
```

### The `finalize` Method

The `finalize` method takes a `Felt252DictEntry<T>` and a new value, then returns the updated dictionary. This effectively applies the changes to the entry.

```cairo,noplayground
fn finalize(self: Felt252DictEntry<T>, new_value: T) -> Felt252Dict<T>
```

#### Implementing `custom_get`

You can implement a `get` functionality using `entry` and `finalize` by retrieving the previous value and then finalizing the entry with that same value to return it.

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

#### Implementing `custom_insert`

Similarly, `custom_insert` uses `entry` to get the entry for a key and then `finalize` to update it with a new value. If the key doesn't exist, `entry` provides a default value for `T`.

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

Storing Complex Data Types (Arrays and Structs)

# Storing Complex Data Types (Arrays and Structs)

Dictionaries in Cairo natively support common data types like `felt252` and `bool`. However, more complex types such as arrays and structs (including `u256`) do not implement the necessary traits (like `Copy` or `zero_default`) for direct use in dictionaries. To store these types, you need to wrap them using `Nullable<T>` and `Box<T>`.

## Using `Nullable<T>` and `Box<T>`

`Nullable<T>` is a smart pointer that can hold a value or be `null`. It uses `Box<T>` to store the wrapped value in a dedicated `boxed_segment` memory. This allows types that don't natively support dictionary operations to be stored.

### Storing Arrays in Dictionaries

When storing an array, you can use `Nullable<T>` and `Box<T>`. For example, to store a `Span<felt252>`:

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

### Challenges with Reading Arrays

Directly using the `get` method to retrieve an array from a dictionary will result in a compiler error because `Array<T>` does not implement the `Copy<T>` trait, which `get` requires for copying the value.

```cairo
use core::dict::Felt252Dict;
use core::nullable::{FromNullableResult, match_nullable};

#[executable]
fn main() {
    let arr = array![20, 19, 26];
    let mut dict: Felt252Dict<Nullable<Array<u8>>> = Default::default();
    dict.insert(0, NullableTrait::new(arr));
    println!("Array: {:?}", get_array_entry(ref dict, 0));
}

fn get_array_entry(ref dict: Felt252Dict<Nullable<Array<u8>>>, index: felt252) -> Span<u8> {
    let val = dict.get(0); // This will cause a compiler error
    let arr = match match_nullable(val) {
        FromNullableResult::Null => panic!("No value!"),
        FromNullableResult::NotNull(val) => val.unbox(),
    };
    arr.span()
}
```

The error message indicates the missing `Copy` implementation:

```shell
error: Trait has no implementation in context: core::traits::Copy::<core::nullable::Nullable::<core::array::Array::<core::integer::u8>>>.
 --> listings/ch03-common-collections/no_listing_15_dict_of_array_attempt_get/src/lib.cairo:14:20
    let val = dict.get(0); // This will cause a compiler error
                   ^^^
```

### Correctly Accessing and Modifying Arrays using `entry`

To correctly read or modify arrays in a dictionary, use the `entry` method. This provides a reference without copying.

To read an array:

```cairo,noplayground
fn get_array_entry(ref dict: Felt252Dict<Nullable<Array<u8>>>, index: felt252) -> Span<u8> {
    let (entry, _arr) = dict.entry(index);
    let mut arr = _arr.deref_or(array![]);
    let span = arr.span();
    // Finalize the entry to keep the (potentially modified) array in the dictionary
    dict = entry.finalize(NullableTrait::new(arr));
    span
}
```

Note: The array must be converted to a `Span` before finalizing the entry, as `NullableTrait::new(arr)` moves the array.

To modify an array (e.g., append a value):

```cairo,noplayground
fn append_value(ref dict: Felt252Dict<Nullable<Array<u8>>>, index: felt252, value: u8) {
    let (entry, arr) = dict.entry(index);
    let mut unboxed_val = arr.deref_or(array![]);
    unboxed_val.append(value);
    dict = entry.finalize(NullableTrait::new(unboxed_val));
}
```

### Complete Example

This example demonstrates insertion, reading, and appending to an array stored in a dictionary:

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

The `Nullable<T>` type is essential for dictionaries storing types that do not implement the `zero_default` method of the `Felt252DictValue<T>` trait.

Memory Management and Dictionary Squashing

# Memory Management and Dictionary Squashing

The `Felt252Dict<T>` in Cairo is implemented by scanning the entire entry list for the most recent entry with a matching key for each read/write operation. This results in a worst-case time complexity of O(n), where n is the number of entries. The `previous_value` field is crucial for the "dictionary squashing" process, a mechanism required by the STARK proof system to verify computational integrity and adherence to Cairo's restrictions.

## Squashing Dictionaries

Dictionary squashing verifies that a `Felt252Dict<T>` has not been tampered with by checking the coherence of dictionary access throughout program execution. The process involves iterating through all entries for a specific key in their insertion order. It confirms that the `new_value` of the i-th entry matches the `previous_value` of the (i+1)-th entry.

For example, an entry list like:
| key | previous | new |
| :------ | :------- | :-- |
| Alex | 0 | 150 |
| Maria | 0 | 100 |
| Charles | 0 | 70 |
| Maria | 100 | 250 |
| Alex | 150 | 40 |
| Alex | 40 | 300 |
| Maria | 250 | 190 |
| Alex | 300 | 90 |

Would be reduced after squashing to:
| key | previous | new |
| :------ | :------- | :-- |
| Alex | 0 | 90 |
| Maria | 0 | 190 |
| Charles | 0 | 70 |

Any deviation from this sequence would cause squashing to fail at runtime.

## Dictionary Destruction and the `Destruct` Trait

Dictionaries in Cairo must be squashed upon destruction to prove the sequence of accesses. To ensure this happens automatically, dictionaries implement the `Destruct` trait. This trait differs from `Drop` in that `Destruct` generates new CASM, whereas `Drop` is a no-op. For most types, `Drop` and `Destruct` are synonymous, but `Felt252Dict<T>` actively uses `Destruct`.

If a struct contains a `Felt252Dict` and does not implement `Destruct` (either directly or via `derive`), it cannot be dropped, leading to a compile-time error.

Consider this code:

```cairo
use core::dict::Felt252Dict;

struct A {
    dict: Felt252Dict<u128>,
}

#[executable]
fn main() {
    A { dict: Default::default() };
}
```

This fails to compile with an error indicating the variable is not dropped because `A` implements neither `Drop` nor `Destruct`.

To resolve this, you can derive the `Destruct` trait:

```cairo
use core::dict::Felt252Dict;

#[derive(Destruct)]
struct A {
    dict: Felt252Dict<u128>,
}

#[executable]
fn main() {
    A { dict: Default::default() }; // This now compiles
}
```

With `#[derive(Destruct)]`, the dictionary is automatically squashed when `A` goes out of scope, allowing the program to compile successfully.

Interactive Quizzes

# Interactive Quizzes

The following code snippets are interactive quizzes to test your understanding of dictionaries in Cairo.

<div class="quiz-placeholder" data-quiz-name="&quot;ch03-02-dictionaries&quot;" data-quiz-questions="{&quot;questions&quot;:[{&quot;context&quot;:&quot;The code compiles and runs without panicking because `get` returns the default value for `u64` when the key is not found.\\nThe value of `john_balance` is `0 + 100 = 100`.\\n&quot;,&quot;id&quot;:&quot;8b538a1f-0cf9-4c57-8304-c4b07e0134dd&quot;,&quot;type&quot;:&quot;Tracing&quot;,&quot;answer&quot;:{&quot;doesCompile&quot;:true,&quot;stdout&quot;:&quot;100&quot;},&quot;prompt&quot;:{&quot;program&quot;:&quot;use core::dict::Felt252Dict;\\n\\nfn main() {\\n    let mut balances: Felt252Dict&lt;u64&gt; = Default::default();\\n    balances.insert('Alex', 100);\\n    balances.insert('Maria', 200);\\n    let john_balance = balances.get('John') + 100;\\n    println!(\\\&quot;{
```
use core::dict::Felt252Dict;

fn main() {
let mut balances: Felt252Dict<u64> = Default::default();
balances.insert('Alex', 100);
balances.insert('Maria', 200);
let john_balance = balances.get('John') + 100;
println!(&quot;{}&quot;, john_balance);
}

````
&quot;}},{&quot;context&quot;:&quot;We could store a Span&lt;T&gt; in the dictionary because it implements the Copy&lt;T&gt; trait.\\nHowever, the `zero_default` method is not implemented for Span&lt;T&gt; which thus must be wrapped inside a Nullable&lt;T&gt; type.\\nFor this reason the code will not compile.\\n&quot;,&quot;id&quot;:&quot;af5bc548-fb84-487f-958e-0622d242dc6f&quot;,&quot;type&quot;:&quot;Tracing&quot;,&quot;answer&quot;:{&quot;doesCompile&quot;:false},&quot;prompt&quot;:{&quot;program&quot;:&quot;use core::dict::Felt252Dict;\\n\\nfn main() {\\n    let mut dict: Felt252Dict&lt;Span&lt;felt252&gt;&gt; = Default::default();\\n    let a = array![8, 9, 10];\\n    dict.insert('my_span', a.span());\\n    let my_span = d.get('my_span');\\n    println!(\\\&quot;{:?}\\&quot;, *my_span.at(0));\\n}\\n&quot;}},{&quot;context&quot;:&quot;The value type of this dictionary is `u64`, which is an unsigned integer. So the variable `alex_balance` is an unsigned integer that can't be negative.\\nThe subtraction operation will cause a runtime panic.\\n&quot;,&quot;id&quot;:&quot;8fe876cf-4373-42ca-ae2c-4d13ae23dbed&quot;,&quot;type&quot;:&quot;MultipleChoice&quot;,&quot;answer&quot;:{&quot;answer&quot;:&quot;There will be a runtime panic.&quot;},&quot;prompt&quot;:{&quot;distractors&quot;:[&quot;Alex : -50&quot;,&quot;Alex : 0&quot;,&quot;Alex : 100&quot;],&quot;prompt&quot;:&quot;What will be the output of this code snippet?\\n```\\nuse core::dict::Felt252Dict;\\n\\nfn main() {\\n    let mut balances: Felt252Dict&lt;u64&gt; = Default::default();\\n    balances.insert('Alex', 200);\\n    balances.insert('Maria', 200);\\n    balances.insert('Alex', 100);\\n    let alex_balance = balances.get('Alex') - 150;\\n    balances.insert('Alex', alex_balance);\\n    println!(\\\&quot;Alex : {}\\&quot;, alex_balance);\\n}\\n```\\n&quot;}},{&quot;context&quot;:&quot;The `entry` method returns a tuple with the entry and the value.  We can mutate this value, and then\\nfinalize the entry with this new value, which restores ownership of the dictionary in the calling\\ncontext.\\n&quot;,&quot;id&quot;:&quot;f78d9b38-1d3a-4b00-a014-9c618070738c&quot;,&quot;type&quot;:&quot;MultipleChoice&quot;,&quot;answer&quot;:{&quot;answer&quot;:&quot;`let (entry, my_array) = dict.entry(key);`&quot;},&quot;prompt&quot;:{&quot;distractors&quot;:[&quot;`let my_array = dict.entry(key);`&quot;,&quot;`let mut my_array = dict.entry(key);`&quot;,&quot;None of these options are correct: Arrays can't be mutated inside Dicts.&quot;],&quot;prompt&quot;:&quot;We want to write a function to append a value to an array stored in a dictionary.\\nChoose the right line of code to make the function below work as expected.\\n\\n```\\nfn append_value(ref dict: Felt252Dict&lt;Nullable&lt;Array&lt;u8&gt;&gt;&gt;, key: felt252, value_to_append: u8) {\\n    // insert the right line here\\n    let mut my_array_unboxed = my_array.deref_or(array![]);\\n    my_array_unboxed.append(value_to_append);\\n    dict = entry.finalize(NullableTrait::new(my_array_unboxed));\\n}\\n```\\n&quot;}},{&quot;context&quot;:&quot;Squashing only keeps the last entry for each key. In this case, the table will only contain the entries for 'John', 'Alex', 'Maria', and 'Alicia'.\\n&quot;,&quot;id&quot;:&quot;d643e8df-2b76-4d2a-bb1f-1a00e53ec8df&quot;,&quot;type&quot;:&quot;MultipleChoice&quot;,&quot;answer&quot;:{&quot;answer&quot;:&quot;4&quot;},&quot;prompt&quot;:{&quot;distractors&quot;:[&quot;6&quot;,&quot;3&quot;,&quot;0&quot;],&quot;prompt&quot;:&quot;Let's consider the following instructions and the associated entry table:\\n```\\nbalances.insert('Alex', 100);\\nbalances.insert('Maria', 200);\\nbalances.insert('John', 300);\\nbalances.insert('Alex', 50);\\nbalances.insert('Maria', 150);\\nbalances.insert('Alicia', 250);\\n```\\nAfter squashing, how many entries will the table contain?\\n&quot;}}]}"></div>

Ownership, References, and Snapshots

Value Movement and Resource Management

# Value Movement and Resource Management

In Cairo, managing values and resources efficiently is crucial, especially when variables go out of scope or are passed between functions. This involves understanding ownership, value movement, and the roles of traits like `Drop`, `Destruct`, `Clone`, and `Copy`.

## Resource Management with `Drop` and `Destruct`

When variables go out of scope, their resources need to be managed. The `Drop` trait handles no-op destruction, simply indicating that a type can be safely destroyed. The `Destruct` trait is for destruction with side effects, such as squashing dictionaries to ensure provability. If a type doesn't implement `Drop`, the compiler attempts to call `destruct`.

*   **`Drop` Trait:** Allows types to be automatically destroyed when they go out of scope. Deriving `Drop` is possible for most types, except those containing dictionaries.
    ```cairo
    #[derive(Drop)]
    struct A {}

    #[executable]
    fn main() {
        A {}; // No error due to #[derive(Drop)]
    }
    ```
*   **`Destruct` Trait:** Handles destruction with side effects. For example, `Felt252Dict` must be squashed. Types containing dictionaries, like `UserDatabase`, often require a manual `Destruct` implementation.
    ```cairo
    // Example for UserDatabase containing a Felt252Dict
    impl UserDatabaseDestruct<T, +Drop<T>, +Felt252DictValue<T>> of Destruct<UserDatabase<T>> {
        fn destruct(self: UserDatabase<T>) nopanic {
            self.balances.squash();
        }
    }
    ```

## Moving Values and Ownership

Moving a value transfers ownership from one variable to another. The original variable becomes invalid and cannot be used further.

*   **Arrays and Movement:** Complex types like `Array` are moved when passed to functions. Attempting to use a moved value results in a compile-time error, often indicating that the `Copy` trait is missing.
    ```cairo,does_not_compile
    fn foo(mut arr: Array<u128>) {
        arr.pop_front();
    }

    #[executable]
    fn main() {
        let arr: Array<u128> = array![];
        foo(arr); // arr is moved here
        foo(arr); // Error: Variable was previously moved.
    }
    ```
*   **Return Values:** Returning values from functions also constitutes a move.
    ```cairo
    #[derive(Drop)]
    struct A {}

    #[executable]
    fn main() {
        let a1 = gives_ownership();
        let a2 = A {};
        let a3 = takes_and_gives_back(a2);
    }

    fn gives_ownership() -> A {
        let some_a = A {};
        some_a
    }

    fn takes_and_gives_back(some_a: A) -> A {
        some_a
    }
    ```

## Duplicating Values with `Clone` and `Copy`

These traits allow for creating copies of values.

*   **`Clone` Trait:** Provides the `clone` method for explicit deep copying. Deriving `Clone` calls `clone` on each component.
    ```cairo
    #[derive(Clone, Drop)]
    struct A {
        item: felt252,
    }

    #[executable]
    fn main() {
        let first_struct = A { item: 2 };
        let second_struct = first_struct.clone();
        assert!(second_struct.item == 2, "Not equal");
    }
    ```
    Arrays can also be cloned:
    ```cairo
    #[executable]
    fn main() {
        let arr1: Array<u128> = array![];
        let arr2 = arr1.clone(); // Deep copy
    }
    ```
*   **`Copy` Trait:** Allows values to be duplicated. Deriving `Copy` requires all parts of the type to also implement `Copy`. When a value is copied, the original remains valid.
    ```cairo
    #[derive(Copy, Drop)]
    struct A {
        item: felt252,
    }

    #[executable]
    fn main() {
        let first_struct = A { item: 2 };
        let second_struct = first_struct; // Value is copied
        assert!(second_struct.item == 2, "Not equal");
        assert!(first_struct.item == 2, "Not Equal"); // first_struct is still valid
    }
    ```

## Performance with `Box<T>`

Using `Box<T>` allows passing pointers to data, which can significantly improve performance by avoiding the copying of large data structures. Instead of copying the entire data, only a pointer is passed.

*   **Passing by Pointer:** Using `Box<T>` and `unbox()` allows function calls to operate on data via a pointer.
    ```cairo
    #[derive(Drop)]
    struct Cart {
        paid: bool,
        items: u256,
        buyer: ByteArray,
    }

    fn pass_pointer(cart: Box<Cart>) {
        let cart = cart.unbox();
        println!("{} is shopping today and bought {} items", cart.buyer, cart.items);
    }

    #[executable]
    fn main() {
        let new_box = BoxTrait::new(Cart { paid: false, items: 2, buyer: "Uri" });
        pass_pointer(new_box);
    }
    ```
    This is contrasted with passing by value (`Cart`), which would involve copying the entire `Cart` struct.

Accessing Values: References and Snapshots

# Accessing Values: References and Snapshots

In Cairo, when you pass a value to a function, ownership of that value is moved. If you want to use the value again after the function call, you must return it, which can be cumbersome. To address this, Cairo offers **snapshots** and **mutable references**, which allow you to access values without taking ownership.

## Snapshots

A snapshot provides an immutable view of a value at a specific point in the program's execution. It's like a look into the past, as memory cells remain unchanged.

### Creating and Using Snapshots

You create a snapshot using the `@` operator. When you pass a snapshot to a function, the function receives a copy of the snapshot, not a pointer. The original value's ownership is not affected.

```cairo
#[derive(Drop)]
struct Rectangle {
    height: u64,
    width: u64,
}

#[executable]
fn main() {
    let mut rec = Rectangle { height: 3, width: 10 };
    let first_snapshot = @rec; // Take a snapshot of `rec` at this point in time
    rec.height = 5; // Mutate `rec` by changing its height
    let first_area = calculate_area(first_snapshot); // Calculate the area of the snapshot
    let second_area = calculate_area(@rec); // Calculate the current area
    println!("The area of the rectangle when the snapshot was taken is {}", first_area);
    println!("The current area of the rectangle is {}", second_area);
}

fn calculate_area(rec: @Rectangle) -> u64 {
    *rec.height * *rec.width
}
````

In this example, `calculate_area` takes a snapshot (`@Rectangle`). Accessing fields of a snapshot yields snapshots of those fields, which need to be "desnapped" using `*` to get their values. This works directly for `Copy` types like `u64`.

### The Desnap Operator

The `*` operator is used to convert a snapshot back into a value. This is only possible for types that implement the `Copy` trait.

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
    // We need to transform the snapshots back into values using the desnap operator `*`.
    // This is only possible if the type is copyable, which is the case for u64.
    *rec.height * *rec.width
}
```

### Immutability of Snapshots

Attempting to modify a value through a snapshot results in a compilation error because snapshots are immutable views.

```cairo,does_not_compile
#[derive(Copy, Drop)]
struct Rectangle {
    height: u64,
    width: u64,
}

#[executable]
fn main() {
    let rec = Rectangle { height: 3, width: 10 };
    flip(@rec);
}

fn flip(rec: @Rectangle) {
    let temp = rec.height;
    rec.height = rec.width; // Error: Cannot assign to immutable field
    rec.width = temp;      // Error: Cannot assign to immutable field
}
```

## Mutable References

Mutable references allow you to modify a value while retaining ownership in the calling context. They are created using the `ref` keyword.

### Using Mutable References

To use a mutable reference, the variable must be declared with `mut`, and the `ref` keyword must be used both when passing the variable to the function and in the function signature.

```cairo
#[derive(Drop)]
struct Rectangle {
    height: u64,
    width: u64,
}

#[executable]
fn main() {
    let mut rec = Rectangle { height: 3, width: 10 };
    flip(ref rec);
    println!("height: {}, width: {}", rec.height, rec.width);
}

fn flip(ref rec: Rectangle) {
    let temp = rec.height;
    rec.height = rec.width;
    rec.width = temp;
}
```

When a function takes a mutable reference, it operates on a local copy of the data, which is implicitly returned to the caller at the end of the function's execution. This ensures that the original variable remains valid and can be used after the function call.

Advanced Topics and Practical Applications

# Advanced Topics and Practical Applications

Structs in Cairo

Understanding Structs in Cairo

# Understanding Structs in Cairo

Creating and Instantiating Structs

# Creating and Instantiating Structs

Structs are custom data types that group related values, similar to tuples but with named fields for clarity and flexibility. They are defined using the `struct` keyword, followed by the struct name and fields enclosed in curly braces.

```cairo
#[derive(Drop)]
struct User {
    active: bool,
    username: ByteArray,
    email: ByteArray,
    sign_in_count: u64,
}
```

Instances of structs are created by specifying values for each field using key-value pairs within curly braces. The order of fields in the instance does not need to match the definition.

```cairo
let user1 = User {
    active: true, username: "someusername123", email: "someone@example.com", sign_in_count: 1,
};
let user2 = User {
    sign_in_count: 1, username: "someusername123", active: true, email: "someone@example.com",
};
```

## Using the Field Init Shorthand

When function parameters have the same names as struct fields, the field init shorthand can be used to simplify instantiation.

```cairo
fn build_user_short(email: ByteArray, username: ByteArray) -> User {
    User { active: true, username, email, sign_in_count: 1 }
}
```

## Creating Instances from Other Instances with Struct Update Syntax

The struct update syntax (`..`) allows creating a new instance by copying most fields from an existing instance, while specifying new values for only a few.

```cairo
let user2 = User { email: "another@example.com", ..user1 };
```

This syntax copies the remaining fields from `user1` into `user2`, making the code more concise.

Interacting with Structs

# Interacting with Structs

To access a specific value from a struct instance, use dot notation. For example, to access `user1`'s email address, use `user1.email`. If the instance is mutable, you can change a field's value using dot notation and assignment.

```cairo
# #[derive(Drop)]
# struct User {
#     active: bool, username: ByteArray, email: ByteArray,
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

Note that the entire instance must be mutable; Cairo does not allow marking only certain fields as mutable.

## Creating New Instances

A new struct instance can be created as the last expression in a function to implicitly return it. The `build_user` function demonstrates this, initializing fields with provided values and setting defaults for others.

```cairo
# #[derive(Drop)]
# struct User {
#     active: bool, username: ByteArray, email: ByteArray,
#     sign_in_count: u64,
# }
# #[executable]
# fn main() {
#     let mut user1 = User {
#         active: true, username: "someusername123", email: "someone@example.com", sign_in_count: 1,
#     };
#     user1.email = "anotheremail@example.com";
# }
fn build_user(email: ByteArray, username: ByteArray) -> User {
    User { active: true, username: username, email: email, sign_in_count: 1 }
}
```

## Struct Update Syntax

The struct update syntax allows creating a new instance using values from an existing instance, specifying only the fields that differ. The `..instance_name` syntax copies the remaining fields.

```cairo
# #[derive(Drop)]
# struct User {
#     active: bool, username: ByteArray, email: ByteArray,
#     sign_in_count: u64,
# }
# #[executable]
# fn main() {
#     let mut user1 = User {
#         active: true, username: "someusername123", email: "someone@example.com", sign_in_count: 1,
#     };
#     user1.email = "anotheremail@example.com";
# }
#
# fn build_user(email: ByteArray, username: ByteArray) -> User {
#     User { active: true, username: username, email: email, sign_in_count: 1 }
# }
#
fn build_user_short(email: ByteArray, username: ByteArray) -> User {
    User { active: true, username, email, sign_in_count: 1 }
}

# Example usage of struct update syntax:
# let user2 = User { email: String::from("another@example.com"), ..user1 };
```

When using struct update syntax, the original instance may become invalid if fields that do not implement the `Copy` trait (like `ByteArray`) are moved. Fields implementing `Copy` are duplicated.

Advanced Struct Features

# Advanced Struct Features

Structs in Practice: Examples and Exercises

# Structs in Practice: Examples and Exercises

This section demonstrates the practical application of structs in Cairo through an example of a generic user database.

## User Database Example

The `UserDatabase<T>` struct is a generic type representing a database of users, where `T` is the type of the user balances.

### `UserDatabase` Struct Definition

The `UserDatabase<T>` struct has the following members:

- `users_updates`: Tracks the number of updates made to the user database.
- `balances`: A mapping from user identifiers ( `felt252`) to their balances (type `T`).

### `UserDatabaseTrait` and Implementation

The core functionality of the `UserDatabase` is defined by the `UserDatabaseTrait`.

#### Defined Methods:

- `new()`: Creates a new instance of `UserDatabase`.
- `update_user(name: felt252, balance: T)`: Updates a user's balance and increments the `users_updates` count.
- `get_balance(name: felt252)`: Retrieves a user's balance.

#### Generic Type `T` Requirements:

For `UserDatabase<T>` to work with `Felt252Dict<T>`, the generic type `T` must satisfy the following trait bounds:

1.  `Copy<T>`: Required for retrieving values from a `Felt252Dict<T>`.
2.  `Felt252DictValue<T>`: The value type must implement this trait.
3.  `Drop<T>`: Required for inserting values into the dictionary.

#### Implementation Details:

The implementation of `UserDatabaseTrait` for `UserDatabase<T>` is shown below, incorporating the necessary trait bounds:

```cairo,noplayground
impl UserDatabaseImpl<T, +Felt252DictValue<T>> of UserDatabaseTrait<T> {
    // Creates a database
    fn new() -> UserDatabase<T> {
        UserDatabase { users_updates: 0, balances: Default::default() }
    }

    // Get the user's balance
    fn get_balance<+Copy<T>>(ref self: UserDatabase<T>, name: felt252) -> T {
        self.balances.get(name)
    }

    // Add a user
    fn update_user<+Drop<T>>(ref self: UserDatabase<T>, name: felt252, balance: T) {
        self.balances.insert(name, balance);
        self.users_updates += 1;
    }
}
```

Methods and Associated Functions

Defining Methods in Cairo

# Defining Methods in Cairo

Methods in Cairo are similar to functions, declared with `fn`, and can have parameters and return values. They are defined within the context of a struct or enum, with the first parameter always being `self`, representing the instance on which the method is called.

## Defining Methods on Structs

To define methods within a struct's context, you use an `impl` block for a trait that defines the methods. The first parameter of a method is `self`, which can be taken by ownership, snapshot (`@`), or mutable reference (`ref`).

```cairo
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

Method syntax is used to call methods on an instance: `instance.method_name(arguments)`.

## The `#[generate_trait]` Attribute

To simplify method definition without needing to explicitly define a trait, Cairo provides the `#[generate_trait]` attribute. This attribute automatically generates the trait definition, allowing you to focus solely on the implementation.

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

Methods can accept `self` as a snapshot (`@`) if they don't modify the instance, or as a mutable reference (`ref`) to modify it.

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

## Methods with Several Parameters

Methods can accept multiple parameters, including other instances of the same type.

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

Associated Functions in Cairo

# Associated Functions in Cairo

Associated functions are functions defined within an `impl` block that are tied to a specific type. It's good practice to group functions related to the same type within the same `impl` block.

Unlike methods, associated functions do not necessarily take `self` as their first parameter. This allows them to be called without an instance of the type, often serving as constructors or utility functions related to the type.

A common use case for associated functions that are not methods is to act as constructors. While `new` is a conventional name, it's not a reserved keyword. The following example demonstrates `new` for creating a `Rectangle`, `square` for creating a square `Rectangle`, and `avg` for calculating the average of two `Rectangle` instances:

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

Calling Methods and Associated Functions

# Calling Methods and Associated Functions

Associated functions are called using the `::` syntax with the struct name, for example, `RectangleTrait::square(3)`. This syntax is also used for namespaces created by modules.

Methods can be called directly on the type they are defined for. If a type implements `Deref` to another type, methods defined on the target type can be called directly on the source type instance due to deref coercion. This simplifies access to nested data structures and reduces boilerplate code.

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

Each struct can have multiple `trait` and `impl` blocks, allowing methods to be separated into different blocks, although this is not always necessary.

Syntax and Related Topics

# Syntax and Related Topics

Enums and Pattern Matching

Introduction to Enums

# Introduction to Enums

No content available for this section.

Enum Variants and Associated Data

# Enum Variants and Associated Data

Enums in Cairo allow variants to have associated data, enabling them to represent more complex states.

## Defining Variants with Associated Data

Variants can be defined to hold specific data types.

### Primitive and Tuple Data

```cairo, noplayground
#[derive(Drop)]
enum Direction {
    North: u128,
    East: u128,
    South: u128,
    West: u128,
}

#[derive(Drop)]
enum Message {
    Quit,
    Echo: felt252,
    Move: (u128, u128),
}
```

These variants can be instantiated with their respective data:

```cairo, noplayground
let direction = Direction::North(10);
let message = Message::Echo("hello");
let movement = Message::Move((10, 20));
```

### Custom Data in Variants

Enums can also associate custom types, such as other enums or structs, with their variants.

```cairo,noplayground
#[derive(Drop, Debug)]
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
```

## Using Associated Data with `match`

The `match` control flow construct can destructure enum variants and bind their associated data to variables.

```cairo,noplayground
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

## Trait Implementations for Enums

Traits can be implemented for enums to define associated behaviors.

```cairo,noplayground
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

Common Cairo Enums (`Option`, `Result`)

# Common Cairo Enums (`Option`, `Result`)

## The `Option` Enum and Its Advantages

The `Option` enum is a standard Cairo enum that represents the concept of an optional value. It has two variants: `Some: T` and `None`. `Some: T` indicates that there's a value of type `T`, while `None` represents the absence of a value.

```cairo,noplayground
enum Option<T> {
    Some: T,
    None,
}
```

The `Option` enum is helpful because it allows you to explicitly represent the possibility of a value being absent, making your code more expressive and easier to reason about. Using `Option` can also help prevent bugs caused by using uninitialized or unexpected `null` values.

Here is a function which returns the index of the first element of an array with a given value, or `None` if the element is not present, demonstrating two approaches:

- Recursive approach with `find_value_recursive`.
- Iterative approach with `find_value_iterative`.

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
    let mut result = None;
    let mut index = 0;

    while let Some(array_value) = arr.pop_front() {
        if (*array_value == value) {
            result = Some(index);
            break;
        }

        index += 1;
    }

    result
}
```

The `match` Expression

### The `match` Expression

The `match` expression in Cairo is similar to a conditional expression used with `if`, but it can evaluate any type, not just booleans. It consists of the `match` keyword followed by an expression, and then arms. Each arm has a pattern and code separated by `=>`.

When a `match` expression runs, it compares the value of the expression against the pattern of each arm in order. If a pattern matches the value, the associated code is executed. If a pattern does not match, execution proceeds to the next arm. The value of the expression in the matching arm becomes the return value of the entire `match` expression.

For single-line expressions in an arm, curly braces are not typically used. However, if an arm requires multiple lines of code, curly braces must be used, and a comma must follow the arm. The last expression within the curly braces is the value returned for that arm.

```cairo,noplayground
fn value_in_cents(coin: Coin) -> felt252 {
    match coin {
        Coin::Penny => {
            println!("Lucky penny!");
            1
        },
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter => 25,
    }
}
```

`match` with Enum Variants

### `match` with Enum Variants

When using `match` with enums, you can bind the inner value of a variant to a variable. For example, if `state` is an `UsState` enum, a match arm like `Coin::Quarter(state)` will bind the inner `UsState` value to the `state` variable. This allows you to use the inner value in the match arm's code.

You can print the debug form of an enum value using the `{:?}` formatting syntax with the `println!` macro.

#### Matching with `Option<T>`

The `match` expression can also be used to handle `Option<T>` variants, similar to other enums. For instance, a function that adds 1 to an `Option<u8>` can be written as:

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

In this example:

- `Some(val) => Some(val + 1)`: If `x` is `Some(5)`, `val` is bound to `5`, and the arm returns `Some(5 + 1)`, which is `Some(6)`.
- `None => None`: If `x` is `None`, this arm matches, and the function returns `None`.

#### Matches Are Exhaustive

`match` expressions in Cairo must cover all possible patterns for the type being matched. If a pattern is missing, the code will not compile. For example, if a `match` on `Option<u8>` only includes the `Some(val)` arm and omits `None`, the compiler will report a "Missing match arm" error.

```cairo,noplayground
fn plus_one(x: Option<u8>) -> Option<u8> {
    match x {
        Some(val) => Some(val + 1),
    } // Error: `None` not covered.
}
```

The `_` placeholder can be used to ignore values or patterns that are not needed.

Advanced `match` Features

# Advanced `match` Features

Matches in Cairo are exhaustive, meaning all possibilities must be handled. This prevents errors like assuming a value exists when it might be null, avoiding the "billion-dollar mistake".

## Catch-all with the `_` Placeholder

The `_` pattern matches any value without binding to it. It's used as the last arm in a `match` expression for a default action.

For example, a `vending_machine_accept` function that only accepts `Coin::Dime`:

```cairo,noplayground
fn vending_machine_accept(coin: Coin) -> bool {
    match coin {
        Coin::Dime => true,
        _ => false,
    }
}
```

This example is exhaustive because the `_` arm handles all other values.

## Multiple Patterns with the `|` Operator

The `|` operator allows matching multiple patterns within a single `match` arm.

Enums vs. Structs and Best Practices

# Enums vs. Structs and Best Practices

There is no content available for this section.

Modules and Packages

Introduction to Cairo Modules and Packages

# Introduction to Cairo Modules and Packages

Cairo's module system helps manage code organization and scope. Key features include:

- **Packages:** A Scarb feature for building, testing, and sharing crates.
- **Crates:** A compilation unit consisting of a tree of modules with a root directory and a root module (often `lib.cairo`).
- **Modules and use:** Control item organization and scope.
- **Paths:** Names used to identify items like structs, functions, or modules.

## Packages and Crates

### What is a Crate?

A crate is a subset of a package compiled by Cairo. It includes:

- The package's source code, identified by its name and crate root (the entry point).
- Package metadata for crate-level compiler settings (e.g., `edition` in `Scarb.toml`).

Crates can contain modules, which can be defined in separate files compiled with the crate.

Module Structure, Paths, and Visibility

# Module Structure, Paths, and Visibility

Modules allow organizing code within a crate for readability and reuse, and they control item privacy. Code within a module is private by default, meaning it's only accessible by the current module and its descendants.

## Declaring Modules and Submodules

- **Crate Root**: The compiler starts by looking in the crate root file (`src/lib.cairo`).
- **Module Declaration**: Declare a module using `mod module_name;`.

  - The compiler looks for the module's code inline within curly braces `{}` in the same file.
  - Alternatively, it looks in a file named `src/module_name.cairo` (for top-level modules) or `src/parent_module/module_name.cairo` (for submodules).

  ```cairo,noplayground
  // crate root file (src/lib.cairo)
  mod garden {
      // code defining the garden module goes here
  }
  ```

  ```cairo,noplayground
  // src/garden.cairo file
  mod vegetables {
      // code defining the vegetables submodule goes here
  }
  ```

- **Module Tree**: Modules form a tree structure, with the crate root at the top. Siblings are modules defined within the same parent module. A parent module contains its child modules.

## Paths for Referring to Items

Paths are used to access items within the module tree, similar to navigating a filesystem.

- **Absolute Path**: Starts from the crate root, beginning with the crate name.
  - Example: `crate::front_of_house::hosting::add_to_waitlist();`
- **Relative Path**: Starts from the current module.
  - Example: `front_of_house::hosting::add_to_waitlist();`
- **`super` Keyword**: Used to start a relative path from the parent module.
  - Example: `super::deliver_order();`

## Privacy and the `pub` Keyword

Items are private by default. The `pub` keyword makes items accessible from outside their parent module.

- **Public Modules**: `pub mod module_name` makes the module accessible to ancestor modules.
- **Public Functions/Items**: `pub fn function_name()` makes the function accessible.
- **Public Structs**: `pub struct StructName` makes the struct public, but its fields remain private by default. Fields can be made public individually using `pub` before their declaration.
- **Public Enums**: `pub enum EnumName` makes the enum and all its variants public.

**Example of making items public:**

```cairo,noplayground
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }
}

pub fn eat_at_restaurant() {
    // Absolute path
    crate::front_of_house::hosting::add_to_waitlist(); // ✅ Compiles

    // Relative path
    front_of_house::hosting::add_to_waitlist(); // ✅ Compiles
}
```

## Summary

Cairo's module system organizes code and controls privacy. Items are private by default, and `pub` is used to expose modules, functions, structs, enums, and their fields. Paths (absolute, relative, and using `super`) are used to reference these items across the module tree.

The `use` Keyword: Shortcuts, Aliasing, and Re-exporting

# The `use` Keyword: Shortcuts, Aliasing, and Re-exporting

Having to write out the full paths to call functions or refer to types can be repetitive. The `use` keyword allows you to create shortcuts for these paths, making your code more concise.

## Bringing Paths into Scope with `use`

The `use` keyword brings a path into the current scope, allowing you to use a shorter name. This is similar to creating a symbolic link.

```cairo
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

Note that a `use` statement only applies to the scope in which it is declared. If you move the function to a different module, the shortcut will no longer be available in that new scope.

## Creating Idiomatic `use` Paths

It is idiomatic to bring a module into scope and then call its functions using the module name, rather than bringing the function itself directly into scope.

```cairo
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }
}
use crate::front_of_house::hosting::add_to_waitlist; // Unidiomatic for functions

pub fn eat_at_restaurant() {
    add_to_waitlist();
}
```

However, for structs, enums, and traits, it is idiomatic to bring the item itself into scope:

```cairo
use core::num::traits::BitSize;

#[executable]
fn main() {
    let u8_size: usize = BitSize::<u8>::bits();
    println!("A u8 variable has {} bits", u8_size)
}
```

## Providing New Names with the `as` Keyword

If you need to bring multiple items with the same name into scope, or if you simply want to rename an item, you can use the `as` keyword to create an alias.

```cairo
use core::array::ArrayTrait as Arr;

#[executable]
fn main() {
    let mut arr = Arr::new(); // ArrayTrait was renamed to Arr
    arr.append(1);
}
```

## Importing Multiple Items from the Same Module

To import multiple items from the same module, you can use curly braces `{}` to list them.

```cairo
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

use shapes::{Circle, Square, Triangle};

#[executable]
fn main() {
    let sq = Square { side: 5 };
    let cr = Circle { radius: 3 };
    let tr = Triangle { base: 5, height: 2 };
}
```

## Re-exporting Names in Module Files

Re-exporting makes an item available in a new scope and also allows other code to bring that item into their scope using the `pub` keyword.

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

This allows external code to access `add_to_waitlist` via `crate::hosting::add_to_waitlist()` instead of the longer original path.

## Using External Packages in Cairo with Scarb

Scarb allows you to use external packages by declaring them in the `[dependencies]` section of your `Scarb.toml` file, specifying the Git repository URL.

```cairo
[dependencies]
alexandria_math = { git = "https://github.com/keep-starknet-strange/alexandria.git" }
```

Organizing Modules into Separate Files

# Organizing Modules into Separate Files

When modules become large, you can move their definitions to separate files to improve code navigation. The Cairo compiler uses a convention to map module declarations to files.

## Separating a Top-Level Module

To extract a module (e.g., `front_of_house`) from the crate root file (`src/lib.cairo`):

1.  **Modify the crate root file:** Remove the module's body and leave only the `mod` declaration.
    <span class="filename">Filename: src/lib.cairo</span>

    ```cairo,noplayground
    mod front_of_house;
    use crate::front_of_house::hosting;

    fn eat_at_restaurant() {
        hosting::add_to_waitlist();
    }
    ```

    <span class="caption">Listing 7-14: Declaring the `front_of_house` module whose body will be in `src/front_of_house.cairo`</span>

2.  **Create the module's file:** Place the removed module code into a new file named `src/front_of_house.cairo`. The compiler automatically associates this file with the `front_of_house` module declared in the crate root.
    <span class="filename">Filename: src/front_of_house.cairo</span>

    ```cairo,noplayground
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }
    ```

    <span class="caption">Listing 7-15: Definitions inside the `front_of_house` module in `src/front_of_house.cairo`</span>

## Separating a Nested Module

To extract a child module (e.g., `hosting` within `front_of_house`) to its own file:

1.  **Modify the parent module file:** Change `src/front_of_house.cairo` to only declare the child module.
    <span class="filename">Filename: src/front_of_house.cairo</span>

    ```cairo,noplayground
    pub mod hosting;
    ```

2.  **Create the child module's file:** Create a new directory that mirrors the parent's path in the module tree (e.g., `src/front_of_house/`) and place the child module's file within it (e.g., `src/front_of_house/hosting.cairo`).
    <span class="filename">Filename: src/front_of_house/hosting.cairo</span>

    ```cairo,noplayground
    pub fn add_to_waitlist() {}
    ```

The compiler's file-to-module mapping follows the module tree structure. Using `mod` is not an include operation; it declares a module's existence and location within the tree. Once declared, other files reference its items using paths. This approach allows for organizing code into separate files as modules grow, without altering the module tree's functionality.

Generics in Cairo

Introduction to Generics in Cairo

# Introduction to Generics in Cairo

Generics are a tool in Cairo that allow us to create abstract stand-ins for concrete types or other properties. This enables us to express behavior without knowing the exact types that will be used when the code is compiled and run. Functions can accept parameters of a generic type, similar to how they accept parameters with unknown values, allowing the same code to operate on multiple concrete types. An example of this is the `Option<T>` enum encountered in Chapter 6.

Generics help remove code duplication by enabling the replacement of specific types with a placeholder that represents multiple types. While the compiler generates specific definitions for each concrete type that replaces a generic type, thus reducing development time, it's important to note that code duplication still occurs at the compile level. This can lead to an increase in contract size, particularly when using generics for multiple types in Starknet contracts.

Before delving into the syntax of generics, let's consider how to eliminate duplication by extracting a function. This involves replacing specific values with a placeholder that represents multiple values. By understanding how to identify and extract duplicated code into a function, we can better recognize situations where generics can be applied to further reduce duplication.

Consider a program designed to find the largest number in an array of `u8`:

```cairo
#[executable]
fn main() {
    let mut number_list: Array<u8> = array![34, 50, 25, 100, 65];

    let mut largest = number_list.pop_front().unwrap();

    while let Some(number) = number_list.pop_front() {
        if number > largest {
            largest = number;
        }
    }

    println!("The largest number is {}", largest);
}
```

This code initializes an array of `u8`, extracts the first element as the initial `largest` value, and then iterates through the remaining elements. If a number greater than the current `largest` is found, `largest` is updated. After processing all numbers, `largest` holds the maximum value.

If we need to find the largest number in a second array, we could duplicate the existing code:

```cairo
#[executable]
fn main() {
    let mut number_list: Array<u8> = array![34, 50, 25, 100, 65];

    let mut largest = number_list.pop_front().unwrap();

    while let Some(number) = number_list.pop_front() {
        if number > largest {
            largest = number;
        }
    }

    println!("The largest number is {}", largest);

    let mut number_list: Array<u8> = array![102, 34, 255, 89, 54, 2, 43, 8];

    let mut largest = number_list.pop_front().unwrap();

    while let Some(number) = number_list.pop_front() {
        if number > largest {
            largest = number;
        }
    }

    println!("The largest number is {}", largest);
}
```

This duplication highlights the need for a more efficient approach, which generics provide.

Defining Generic Functions, Structs, and Enums

# Defining Generic Functions, Structs, and Enums

Generics in Cairo allow for the creation of reusable code that can operate on various concrete data types, thereby reducing duplication and enhancing maintainability. This applies to functions, structs, enums, traits, and implementations.

## Generic Functions

Generic functions can operate on different types without requiring separate implementations for each. This is achieved by specifying type parameters in the function signature.

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

To handle operations that require specific capabilities from generic types (like comparison or copying), trait bounds are used. For instance, `PartialOrd<T>` enables comparison, `Copy<T>` allows copying, and `Drop<T>` manages resource cleanup.

```cairo
// Given a list of T get the smallest one
// The PartialOrd trait implements comparison operations for T
fn smallest_element<T, impl TPartialOrd: PartialOrd<T>>(list: @Array<T>) -> T {
    // This represents the smallest element through the iteration
    // Notice that we use the desnap (*) operator
    let mut smallest = *list[0];

    // The index we will use to move through the list
    let mut index = 1;

    // Iterate through the whole list storing the smallest
    while index < list.len() {
        if *list[index] < smallest {
            smallest = *list[index];
        }
        index = index + 1;
    }

    smallest
}

#[executable]
fn main() {
    let list: Array<u8> = array![5, 3, 10];

    // We need to specify that we are passing a snapshot of `list` as an argument
    let s = smallest_element(@list);
    assert!(s == 3);
}
```

When a generic type `T` requires `Copy` and `Drop` traits for operations within a generic function, these trait bounds must be explicitly included in the function signature.

```cairo
fn smallest_element<T, impl TPartialOrd: PartialOrd<T>, impl TCopy: Copy<T>, impl TDrop: Drop<T>>(
    list: @Array<T>,
) -> T {
    let mut smallest = *list[0];
    let mut index = 1;

    while index < list.len() {
        if *list[index] < smallest {
            smallest = *list[index];
        }
        index = index + 1;
    }

    smallest
}
```

### Anonymous Generic Implementation Parameter (`+` Operator)

Trait implementations can be specified anonymously using the `+` operator for generic type parameters when the implementation itself is not directly used in the function body, only its constraint.

```cairo
fn smallest_element<T, +PartialOrd<T>, +Copy<T>, +Drop<T>>(list: @Array<T>) -> T {
#     let mut smallest = *list[0];
#     let mut index = 1;
#     loop {
#         if index >= list.len() {
#             break smallest;
#         }
#         if *list[index] < smallest {
#             smallest = *list[index];
#         }
#         index = index + 1;
#     }
# }
```

## Structs

Structs can be defined with generic type parameters for their fields.

```cairo
#[derive(Drop)]
struct Wallet<T> {
    balance: T,
}

#[executable]
fn main() {
    let w = Wallet { balance: 3 };
}
```

This is equivalent to manually implementing the `Drop` trait for the struct, provided the generic type `T` also implements `Drop`.

Structs can also accommodate multiple generic types.

```cairo
#[derive(Drop)]
struct Wallet<T, U> {
    balance: T,
    address: U,
}

#[executable]
fn main() {
    let w = Wallet { balance: 3, address: 14 };
}
```

## Enums

Enums can also be defined with generic type parameters for their variants.

```cairo,noplayground
enum Option<T> {
    Some: T,
    None,
}
```

Enums can also utilize multiple generic types, as seen in the `Result<T, E>` enum.

```cairo,noplayground
enum Result<T, E> {
    Ok: T,
    Err: E,
}
```

Implementing Generic Methods and Traits

# Implementing Generic Methods and Traits

Methods can be implemented on generic structs and enums, utilizing their generic types. Traits can also be defined with generic types, requiring generic types in both trait and implementation definitions.

## Generic Methods on Generic Structs

A `Wallet<T>` struct can have methods defined, such as `balance`, which returns the generic type `T`. This involves defining a trait, like `WalletTrait<T>`, and then implementing it for the struct.

```cairo
#[derive(Copy, Drop)]
struct Wallet<T> {
    balance: T,
}

trait WalletTrait<T> {
    fn balance(self: @Wallet<T>) -> T;
}

impl WalletImpl<T, +Copy<T>> of WalletTrait<T> {
    fn balance(self: @Wallet<T>) -> T {
        return *self.balance;
    }
}

#[executable]
fn main() {
    let w = Wallet { balance: 50 };
    assert!(w.balance() == 50);
}
```

Constraints can be applied to generic types when defining methods. For example, methods can be implemented only for `Wallet<u128>`.

```cairo
#[derive(Copy, Drop)]
struct Wallet<T> {
    balance: T,
}

/// Generic trait for wallets
trait WalletTrait<T> {
    fn balance(self: @Wallet<T>) -> T;
}

impl WalletImpl<T, +Copy<T>> of WalletTrait<T> {
    fn balance(self: @Wallet<T>) -> T {
        return *self.balance;
    }
}

/// Trait for wallets of type u128
trait WalletReceiveTrait {
    fn receive(ref self: Wallet<u128>, value: u128);
}

impl WalletReceiveImpl of WalletReceiveTrait {
    fn receive(ref self: Wallet<u128>, value: u128) {
        self.balance += value;
    }
}

#[executable]
fn main() {
    let mut w = Wallet { balance: 50 };
    assert!(w.balance() == 50);

    w.receive(100);
    assert!(w.balance() == 150);
}
```

## Generic Methods in Generic Traits

Generic methods can be defined within generic traits. When combining generic types from multiple structs, ensuring all generic types implement `Drop` is crucial for compilation, especially if instances are dropped within the method.

The following demonstrates a trait `WalletMixTrait<T1, U1>` with a `mixup` method that combines two wallets of potentially different generic types into a new wallet. The implementation requires `Drop` constraints on the generic types involved.

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

## Associated Types vs. Separate Generic Parameters

When defining generic functions that operate on types with specific return types (e.g., packing two `u32` into a `u64`), associated types in traits can offer a cleaner syntax compared to defining separate generic parameters for the return type.

A function `foo` using `PackGeneric<T, U>`:

```cairo
fn foo<T, U, +PackGeneric<T, U>>(self: T, other: T) -> U {
    self.pack_generic(other)
}
```

Compared to a function `bar` using an associated type `Result` in the `Pack<T>` trait:

```cairo
fn bar<T, impl PackImpl: Pack<T>>(self: T, b: T) -> PackImpl::Result {
    PackImpl::pack(self, b)
}
```

Traits in Cairo

Introduction to Traits

# Introduction to Traits

A trait defines a set of methods that can be implemented by a type. These methods can be called on instances of the type when this trait is implemented. Traits, when combined with generic types, define functionality that a particular type has and can share with other types, allowing for the definition of shared behavior in an abstract way.

Trait bounds can be used to specify that a generic type must possess certain behaviors. Traits are similar to interfaces found in other programming languages, though some differences exist. While traits can be defined without generic types, they are most powerful when used in conjunction with them.

## Defining a Trait

A type's behavior is determined by the methods callable on it. Different types share common behavior if the same methods can be invoked on all of them. Trait definitions serve to group method signatures, thereby defining a set of behaviors essential for a specific purpose.

Defining and Implementing Traits

# Defining and Implementing Traits

Traits define shared behavior that can be implemented across different types.

## Defining a Trait

A trait is declared using the `trait` keyword, followed by its name. Inside the trait definition, you declare method signatures. These signatures specify the behavior without providing an implementation, ending with a semicolon. Traits can be made public using `pub` so they can be used by other crates.

```cairo,noplayground
# #[derive(Drop, Clone)]
# struct NewsArticle {
#     headline: ByteArray,
#     location: ByteArray,
#     author: ByteArray,
#     content: ByteArray,
# }
#
pub trait Summary {
    fn summarize(self: @NewsArticle) -> ByteArray;
}
```

The `ByteArray` type is used for strings in Cairo.

## Implementing a Trait

To implement a trait for a type, use the `impl` keyword, followed by an implementation name, the `of` keyword, and the trait name. If the trait is generic, specify the generic type in angle brackets. Inside the implementation block, provide the method bodies for the trait's methods.

```cairo,noplayground
# mod aggregator {
#     pub trait Summary<T> {
#         fn summarize(self: @T) -> ByteArray;
#     }
#
    #[derive(Drop)]
    pub struct NewsArticle {
        pub headline: ByteArray,
        pub location: ByteArray,
        pub author: ByteArray,
        pub content: ByteArray,
    }

    impl NewsArticleSummary of Summary<NewsArticle> {
        fn summarize(self: @NewsArticle) -> ByteArray {
            format!("{} by {} ({})", self.headline, self.author, self.location)
        }
    }

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
# }
#
# use aggregator::{NewsArticle, Summary, Tweet};
#
# #[executable]
# fn main() {
#     let news = NewsArticle {
#         headline: "Cairo has become the most popular language for developers",
#         location: "Worldwide",
#         author: "Cairo Digger",
#         content: "Cairo is a new programming language for zero-knowledge proofs",
#     };
#
#     let tweet = Tweet {
#         username: "EliBenSasson",
#         content: "Crypto is full of short-term maximizing projects. \n @Starknet and @StarkWareLtd are about long-term vision maximization.",
#         reply: false,
#         retweet: false,
#     }; // Tweet instantiation
#
#     println!("New article available! {}", news.summarize());
#     println!("New tweet! {}", tweet.summarize());
# }
#
#
```

Users of a crate must bring the trait into scope to use its methods on their types.

## Generic Traits

Traits can be generic over types. This allows a single trait definition to describe behavior for any type that implements it.

```cairo,noplayground
# mod aggregator {
    pub trait Summary<T> {
        fn summarize(self: @T) -> ByteArray;
    }
#
#     #[derive(Drop)]
#     pub struct NewsArticle {
#         pub headline: ByteArray,
#         pub location: ByteArray,
#         pub author: ByteArray,
#         pub content: ByteArray,
#     }
#
#     impl NewsArticleSummary of Summary<NewsArticle> {
#         fn summarize(self: @NewsArticle) -> ByteArray {
#             format!("{} by {} ({})", self.headline, self.author, self.location)
#         }
#     }
#
#     #[derive(Drop)]
#     pub struct Tweet {
#         pub username: ByteArray,
#         pub content: ByteArray,
#         pub reply: bool,
#         pub retweet: bool,
#     }
#
#     impl TweetSummary of Summary<Tweet> {
#         fn summarize(self: @Tweet) -> ByteArray {
#             format!("{}: {}", self.username, self.content)
#         }
#     }
# }
#
# use aggregator::{NewsArticle, Summary, Tweet};
#
# #[executable]
# fn main() {
#     let news = NewsArticle {
#         headline: "Cairo has become the most popular language for developers",
#         location: "Worldwide",
#         author: "Cairo Digger",
#         content: "Cairo is a new programming language for zero-knowledge proofs",
#     };
#
#     let tweet = Tweet {
#         username: "EliBenSasson",
#         content: "Crypto is full of short-term maximizing projects. \n @Starknet and @StarkWareLtd are about long-term vision maximization.",
#         reply: false,
#         retweet: false,
#     }; // Tweet instantiation
#
#     println!("New article available! {}", news.summarize());
#     println!("New tweet! {}", tweet.summarize());
# }
#
#
```

## Default Implementations

Traits can provide default behavior for their methods. Types implementing the trait can then choose to override these defaults or use them as is.

```cairo
# mod aggregator {
    pub trait Summary<T> {
        fn summarize(self: @T) -> ByteArray {
            "(Read more...)".into()
        }
    }
#
#     #[derive(Drop)]
#     pub struct NewsArticle {
#         pub headline: ByteArray,
#         pub location: ByteArray,
#         pub author: ByteArray,
#         pub content: ByteArray,
#     }
#
#     impl NewsArticleSummary of Summary<NewsArticle> {}
#
#     #[derive(Drop)]
#     pub struct Tweet {
#         pub username: ByteArray,
#         pub content: ByteArray,
#         pub reply: bool,
#         pub retweet: bool,
#     }
#
#     impl TweetSummary of Summary<Tweet> {
#         fn summarize(self: @Tweet) -> ByteArray {
#             format!("(Read more from {}...)", Self::summarize_author(self))
#         }
#         fn summarize_author(self: @Tweet) -> ByteArray {
#             format!("@{}", self.username)
#         }
#     }
# }
#
# use aggregator::{NewsArticle, Summary};
#
# #[executable]
# fn main() {
#     let news = NewsArticle {
#         headline: "Cairo has become the most popular language for developers",
#         location: "Worldwide",
#         author: "Cairo Digger",
#         content: "Cairo is a new programming language for zero-knowledge proofs",
#     };
#
#     println!("New article available! {}", news.summarize());
# }
#
#
```

A default implementation can also call other methods defined within the trait, provided those methods are also implemented by the type.

```cairo
# mod aggregator {
#     pub trait Summary<T> {
#         fn summarize(
#             self: @T,
#         ) -> ByteArray {
#             format!("(Read more from {}...)", Self::summarize_author(self))
#         }
#         fn summarize_author(self: @T) -> ByteArray;
#     }
#
#     #[derive(Drop)]
#     pub struct Tweet {
#         pub username: ByteArray,
#         pub content: ByteArray,
#         pub reply: bool,
#         pub retweet: bool,
#     }
#
    impl TweetSummary of Summary<Tweet> {
        fn summarize_author(self: @Tweet) -> ByteArray {
            format!("@{}", self.username)
        }
    }
# }
#
# use aggregator::{Summary, Tweet};
#
# #[executable]
# fn main() {
#     let tweet = Tweet {
#         username: "EliBenSasson",
#         content: "Crypto is full of short-term maximizing projects. \n @Starknet and @StarkWareLtd are about long-term vision maximization.",
#         reply: false,
#         retweet: false,
#     };
#
#     println!("1 new tweet: {}", tweet.summarize());
# }
#
#
```

## The `PartialEq` Trait

The `PartialEq` trait allows types to be compared for equality. It can be derived for structs and enums.

When `PartialEq` is derived:

- For structs, two instances are equal only if all their fields are equal.
- For enums, each variant is equal to itself and not equal to other variants.

You can also implement `PartialEq` manually for custom equality logic. For example, two rectangles can be considered equal if they have the same area.

```cairo
#[derive(Copy, Drop)]
struct Rectangle {
    width: u64,
    height: u64,
}

impl PartialEqImpl of PartialEq<Rectangle> {
    fn eq(lhs: @Rectangle, rhs: @Rectangle) -> bool {
        (*lhs.width) * (*lhs.height) == (*rhs.width) * (*rhs.height)
    }

    fn ne(lhs: @Rectangle, rhs: @Rectangle) -> bool {
        (*lhs.width) * (*lhs.height) != (*rhs.width) * (*rhs.height)
    }
}

#[executable]
fn main() {
    let rect1 = Rectangle { width: 30, height: 50 };
    let rect2 = Rectangle { width: 50, height: 30 };

    println!("Are rect1 and rect2 equal? {}", rect1 == rect2);
}
```

The `PartialEq` trait is necessary for using the `assert_eq!` macro in tests.

```cairo
#[derive(PartialEq, Drop)]
struct A {
    item: felt252,
}

#[executable]
fn main() {
    let first_struct = A { item: 2 };
    let second_struct = A { item: 2 };
    assert!(first_struct == second_struct, "Structs are different");
}
```

## Serialization with `Serde`

`Serde` provides trait implementations for `serialize` and `deserialize` functions, enabling the transformation of data structures into arrays and vice-versa.

Using Traits and External Implementations

# Using Traits and External Implementations

To use trait methods, you must import the correct traits and their implementations. If trait implementations are in separate modules, you might need to import both the trait and its implementation.

## Default Implementations

Traits can provide default implementations for their methods. If a type implements a trait without overriding a method, the default implementation is used.

For example, to use a default implementation of the `summarize` method for `NewsArticle`, you can specify an empty `impl` block:

```cairo
// Assuming Summary trait and NewsArticle struct are defined elsewhere
impl NewsArticleSummary of Summary<NewsArticle> {}
```

This allows calling the `summarize` method on `NewsArticle` instances, which will use the default behavior:

```cairo
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

## Managing and Using External Trait

When trait implementations are defined in different modules than the trait itself, explicit imports are necessary.

Consider `Listing 8-6`, where `ShapeGeometry` is implemented for `Rectangle` and `Circle` in their respective modules:

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

In this example, `CircleGeometry` and `RectangleGeometry` do not need to be public. The compiler finds the appropriate implementation for the public `ShapeGeometry` trait.

## Impl Aliases

Implementations can be aliased when imported, which is useful for instantiating generic implementations with concrete types. This allows exposing specific implementations publicly while keeping the generic implementation private.

```cairo,noplayground
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

This approach, shown in `Listing 8-7`, avoids code duplication and maintains a clean public API.

## Contract Interfaces and Implementations

Traits ensure that contract implementations adhere to their declared interfaces. A compilation error occurs if an implementation's function signature does not match the trait's. For instance, an incorrect `set` function signature in an `ISimpleStorage` implementation would fail to compile.

```cairo,noplayground
    #[abi(embed_v0)]
    impl SimpleStorage of super::ISimpleStorage<ContractState> {
        // Incorrect signature: expected 2 parameters, got 1
        fn set(ref self: ContractState) {}
        fn get(self: @ContractState) -> u128 {
            self.stored_data.read()
        }
    }
```

The compiler would report an error like: "The number of parameters in the impl function `SimpleStorage::set` is incompatible with `ISimpleStorage::set`. Expected: 2, actual: 1."

Core Cairo Traits

# Core Cairo Traits

## `Debug` for Debugging

The `Debug` trait allows instances of a type to be printed for debugging purposes. It can be derived using `#[derive(Debug)]` and is required by `assert_xx!` macros in tests.

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

## `Default` for Default Values

The `Default` trait enables the creation of a default value for a type, typically zero. Primitive types implement `Default` by default. For composite types, all elements must implement `Default`. Enums require a `#[default]` attribute on one variant.

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

The `PartialEq` trait enables equality comparisons between instances of a type using the `==` and `!=` operators.

## `Copy` Trait

The `Copy` trait allows types to be duplicated by copying felts, bypassing Cairo's default move semantics. It's implemented for types where duplication is safe and efficient. Basic types implement `Copy` by default. Custom types can derive `Copy` if all their components also implement `Copy`.

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

Trait Bounds and Generics

# Trait Bounds and Generics

Trait bounds allow you to specify which traits a generic type must implement, ensuring that the generic type can be used safely within the function's logic.

## Ensuring Droppability with Trait Bounds

When a function operates on generic types, the compiler needs to guarantee that certain operations are possible. For instance, if a function needs to drop a generic array `Array<T>`, it must ensure that `T` itself is droppable. This is achieved by adding a trait bound to the generic type.

Consider the `largest_list` function, which returns the longer of two arrays. Initially, it might fail if `T` is not guaranteed to be droppable. The corrected function signature includes a trait bound for `Drop`:

```cairo
fn largest_list<T, impl TDrop: Drop<T>>(l1: Array<T>, l2: Array<T>) -> Array<T> {
    if l1.len() > l2.len() {
        l1
    } else {
        l2
    }
}
```

This signature ensures that any type `T` used with `largest_list` must implement the `Drop` trait.

## Constraints for Generic Types

Adding trait bounds not only satisfies compiler requirements but also enables more effective function logic. For example, to find the smallest element in a list of a generic type `T`, `T` must implement the `PartialOrd` trait to allow comparisons.

## Using `TypeEqual` for Associated Types

Trait bounds can also enforce constraints on associated types of generic types. The `TypeEqual` trait from `core::metaprogramming` can be used to ensure that associated types of different generic types are the same.

In the following example, the `combine` function requires that the `State` associated types of `StateMachine` implementations `A` and `B` are equal:

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

This example demonstrates how `TypeEqual` ensures that both `TA` and `TB` use the same `State` type (`StateCounter`) before their `transition` methods are called within `combine`.

Associated Items

# Associated Items

Associated items are definitions that are logically related to an implementation. Every associated item kind comes in two varieties: definitions that contain the actual implementation and declarations that declare signatures for definitions.

## Associated Types

Associated types are type aliases within traits that allow trait implementers to choose the actual types to use. This keeps trait definitions clean and flexible, as the concrete type is chosen by the implementer and doesn't need to be specified when using the trait.

Consider the `Pack` trait:

```cairo, noplayground
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

Using associated types, `bar` is defined more concisely than a generic approach like `foo`:

```cairo, noplayground
# trait Pack<T> {
#     type Result;
#
#     fn pack(self: T, other: T) -> Self::Result;
# }
#
# impl PackU32Impl of Pack<u32> {
#     type Result = u64;
#
#     fn pack(self: u32, other: u32) -> Self::Result {
#         let shift: u64 = 0x100000000; // 2^32
#         self.into() * shift + other.into()
#     }
# }
#
fn bar<T, impl PackImpl: Pack<T>>(self: T, b: T) -> PackImpl::Result {
    PackImpl::pack(self, b)
}
#
# trait PackGeneric<T, U> {
#     fn pack_generic(self: T, other: T) -> U;
# }
#
# impl PackGenericU32 of PackGeneric<u32, u64> {
#     fn pack_generic(self: u32, other: u32) -> u64 {
#         let shift: u64 = 0x100000000; // 2^32
#         self.into() * shift + other.into()
#     }
# }
#
# fn foo<T, U, +PackGeneric<T, U>>(self: T, other: T) -> U {
#     self.pack_generic(other)
# }
#
# #[executable]
# fn main() {
#     let a: u32 = 1;
#     let b: u32 = 1;
#
#     let x = foo(a, b);
#     let y = bar(a, b);
#
#     // result is 2^32 + 1
#     println!("x: {}", x);
#     println!("y: {}", y);
# }
#
#
```

## Associated Constants

Associated constants are constants associated with a type, declared using the `const` keyword in a trait and defined in its implementation.

```cairo, noplayground
trait Shape<T> {
    const SIDES: u32;
    fn describe() -> ByteArray;
}

struct Triangle {}

impl TriangleShape of Shape<Triangle> {
    const SIDES: u32 = 3;
    fn describe() -> ByteArray {
        "I am a triangle."
    }
}

struct Square {}

impl SquareShape of Shape<Square> {
    const SIDES: u32 = 4;
    fn describe() -> ByteArray {
        "I am a square."
    }
}

fn print_shape_info<T, impl ShapeImpl: Shape<T>>() {
    println!("I have {} sides. {}", ShapeImpl::SIDES, ShapeImpl::describe());
}

#[executable]
fn main() {
    print_shape_info::<Triangle>();
    print_shape_info::<Square>();
}

```

Benefits of associated constants include keeping constants tied to traits, enabling compile-time checks, and ensuring consistency.

## Associated Implementations

Associated implementations allow declaring that a trait implementation must exist for an associated type. This enforces relationships between types and implementations at the trait level, ensuring type safety and consistency, particularly in generic programming.

Additionally, associated items can be constrained based on generic parameters using the `[AssociatedItem: ConstrainedValue]` syntax. For example, to ensure an iterator's elements match a collection's type:

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

Advanced Trait Features

# Advanced Trait Features

## Default Implementations

Default implementations allow traits to provide functionality that implementors can optionally override. This enables traits to offer a base level of functionality, requiring implementors to only define specific methods.

Traits can call other methods within the same trait, even those without default implementations. This allows for a modular design where a trait provides extensive functionality based on a minimal set of required methods.

```cairo
# mod aggregator {
    pub trait Summary<T> {
        fn summarize(
            self: @T,
        ) -> ByteArray {
            format!("(Read more from {}...)", Self::summarize_author(self))
        }
        fn summarize_author(self: @T) -> ByteArray;
    }
#
#     #[derive(Drop)]
#     pub struct Tweet {
#         pub username: ByteArray,
#         pub content: ByteArray,
#         pub reply: bool,
#         pub retweet: bool,
#     }
#
#     impl TweetSummary of Summary<Tweet> {
#         fn summarize_author(self: @Tweet) -> ByteArray {
#             format!("@{}", self.username)
#         }
#     }
# }
#
# use aggregator::{Summary, Tweet};
#
# #[executable]
# fn main() {
#     let tweet = Tweet {
#         username: "EliBenSasson",
#         content: "Crypto is full of short-term maximizing projects.
 @Starknet and @StarkWareLtd are about long-term vision maximization.",
#         reply: false,
#         retweet: false,
#     };
#
#     println!("1 new tweet: {}", tweet.summarize());
# }
#
#
```

To use this version of `Summary`, only `summarize_author` needs to be defined when implementing the trait for a type.

## Negative Implementations

Negative implementations (or negative traits/bounds) allow expressing that a type does _not_ implement a trait when defining an implementation for a generic type. This enables conditional implementations based on the absence of another implementation in the current scope.

For example, to prevent a type from being both a `Producer` and a `Consumer`, negative implementations can be used. A `ProducerType` can implement `Producer`, while other types that do not implement `Producer` can be granted a default `Consumer` implementation.

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

    // producer.consume(production); Invalid: ProducerType does not implement Consumer
    another_type.consume(production);
    third_type.consume(production);
}
```

**Note:** This feature requires enabling `experimental-features = ["negative_impls"]` in `Scarb.toml`.

## `TypeEqual` Trait

The `TypeEqual` trait from `core::metaprogramming` facilitates constraints based on type equality. While often achievable with generic arguments and associated type constraints, `TypeEqual` is useful in advanced scenarios.

### Excluding Specific Types from Implementations

`TypeEqual` can be used with negative implementations to exclude specific types from a trait implementation. For instance, a `SafeDefault` trait can be implemented for all types with a `Default` trait, except for a `SensitiveData` type.

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

### Ensuring Type Equality

`TypeEqual` is also useful for ensuring that two types are equal, particularly when dealing with associated types.

Associated Implementations and Iteration

# Associated Implementations and Iteration

The `Iterator` and `IntoIterator` traits from the Cairo core library demonstrate the utility of associated implementations.

### `Iterator` and `IntoIterator` Traits

- **`IntoIterator` Trait**: This trait is responsible for converting a collection into an iterator.
- **`IntoIter` Associated Type**: This associated type specifies the concrete iterator type that will be generated by `into_iter`. This allows different collections to define their own specialized and efficient iterator types.
- **Associated Implementation `Iterator: Iterator<Self::IntoIter>`**: This is the core concept. It establishes a contract at the trait level, ensuring that the type specified by `IntoIter` must itself implement the `Iterator` trait. This binding is enforced across all implementations of `IntoIterator`.

### Benefits of Associated Implementations

This design pattern provides significant advantages:

- **Type-Safe Iteration**: Guarantees that the `into_iter` method will always return a type that conforms to the `Iterator` trait, enabling type-safe iteration without explicit type annotations.
- **Code Ergonomics**: Simplifies the iteration process by abstracting away the specific iterator type.

### Example Implementation

The following code illustrates these traits with `ArrayIter<T>` as the collection type:

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

Verification and Debugging

# Verification and Debugging

Error Handling in Cairo

Introduction to Error Handling in Cairo

# Introduction to Error Handling in Cairo

Unrecoverable Errors: Panic and Related Concepts

# Unrecoverable Errors: Panic and Related Concepts

In Cairo, unrecoverable errors are handled using the `panic` mechanism, which terminates the program's execution. Panics can be triggered intentionally by calling the `panic` function or inadvertently through runtime errors like out-of-bounds array access. When a panic occurs, the program unwinds, dropping variables and squashing dictionaries to ensure a safe termination.

## Triggering Panics

There are several ways to trigger a panic in Cairo:

### The `panic` Function

The `panic` function from the core library can be used to explicitly halt execution and signal an error. It accepts an array of `felt252` elements, which can convey error information.

```cairo
use core::panic;

#[executable]
fn main() {
    let mut data = array![2]; // Example error code

    if true {
        panic(data);
    }
    println!("This line isn't reached");
}
```

Executing this code results in:

```shell
$ scarb execute
   Compiling no_listing_01_panic v0.1.0 (listings/ch09-error-handling/no_listing_01_panic/Scarb.toml)
    Finished `dev` profile target(s) in 5 seconds
   Executing no_listing_01_panic
error: Panicked with 0x2.

```

### `core::panic_with_felt252`

This function provides a more concise way to panic with a single `felt252` error message.

```cairo
use core::panic_with_felt252;

#[executable]
fn main() {
    panic_with_felt252(2); // Panics with error code 2
}
```

This yields the same error output as the `panic` function.

### The `panic!` Macro

The `panic!` macro offers a convenient syntax for panicking, especially when a simple string message is sufficient. It can accept string literals longer than 31 bytes, unlike `panic_with_felt252`.

```cairo
#[executable]
fn main() {
    if true {
        panic!("2"); // Panics with the string "2"
    }
    println!("This line isn't reached");
}
```

A longer error message is also possible:

```cairo, noplayground
panic!("the error for panic! macro is not limited to 31 characters anymore");
```

## `nopanic` Notation

The `nopanic` notation can be used to declare that a function is guaranteed not to panic. Only functions marked with `nopanic` can be called within another `nopanic` function.

```cairo,noplayground
fn function_never_panic() -> felt252 nopanic {
    42 // This function is guaranteed to return 42 and never panic.
}
```

Attempting to call a function that might panic from a `nopanic` function will result in a compile-time error:

```shell
$ scarb execute
   Compiling no_listing_04_nopanic_wrong v0.1.0 (listings/ch09-error-handling/no_listing_05_nopanic_wrong/Scarb.toml)
error: Function is declared as nopanic but calls a function that may panic.
 --> listings/ch09-error-handling/no_listing_05_nopanic_wrong/src/lib.cairo:4:12
    assert(1 == 1, 'what');
           ^^^^^^

error: Function is declared as nopanic but calls a function that may panic.
 --> listings/ch09-error-handling/no_listing_05_nopanic_wrong/src/lib.cairo:4:5
    assert(1 == 1, 'what');
    ^^^^^^^^^^^^^^^^^^^^^^

error: could not compile `no_listing_04_nopanic_wrong` due to previous error
error: `scarb metadata` exited with error

```

Note that `assert` and equality checks (`==`) can themselves cause panics.

## `panic_with` Attribute

The `#[panic_with]` attribute can be applied to functions returning `Option` or `Result`. It generates a wrapper function that panics with a specified reason if the original function returns `None` or `Err`.

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
    wrap_if_not_zero(0); // This returns None
    wrap_not_zero(0); // This panics with 'value is 0'
}
```

Recoverable Errors: The Result Type

# Recoverable Errors: The Result Type

Most errors in programming are not severe enough to warrant program termination. In such cases, functions can return an error or a wrapped result instead of causing undefined behavior or halting the process. Cairo uses the `Result` enum for this purpose.

## The `Result` Enum

The `Result` enum, defined with two variants, `Ok` and `Err`, is used to represent operations that may either succeed or fail.

```cairo,noplayground
enum Result<T, E> {
    Ok: T,
    Err: E,
}
```

Here, `T` represents the type of the value returned on success, and `E` represents the type of the error value returned on failure.

## The `ResultTrait`

The `ResultTrait` trait provides essential methods for interacting with `Result<T, E>` values. These include methods for extracting values, checking the variant, and handling panics.

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

- `expect(err)` and `unwrap()`: Both return the value within `Ok`. `expect` allows a custom panic message, while `unwrap` uses a default one.
- `expect_err(err)` and `unwrap_err()`: Both return the value within `Err`. `expect_err` allows a custom panic message, while `unwrap_err` uses a default one.
- `is_ok()`: Returns `true` if the `Result` is `Ok`.
- `is_err()`: Returns `true` if the `Result` is `Err`.

The `<+Drop<T>>` and `<+Drop<E>>` syntax denotes generic type constraints, requiring a `Drop` trait implementation for the types `T` and `E`.

## Using `Result` for Error Handling

Functions can return a `Result` type, allowing callers to handle success or failure using pattern matching.

For example, `u128_overflowing_add` returns a `Result<u128, u128>`:

```cairo,noplayground
fn u128_overflowing_add(a: u128, b: u128) -> Result<u128, u128>;
```

This function returns `Ok(sum)` if the addition is successful, and `Err(overflowed_value)` if it overflows.

A function like `u128_checked_add` can convert this `Result` to an `Option`:

```cairo,noplayground
fn u128_checked_add(a: u128, b: u128) -> Option<u128> {
    match u128_overflowing_add(a, b) {
        Ok(r) => Some(r),
        Err(r) => None,
    }
}
```

Another example is `parse_u8`, which converts a `felt252` to a `u8`:

```cairo,noplayground
fn parse_u8(s: felt252) -> Result<u8, felt252> {
    match s.try_into() {
        Some(value) => Ok(value),
        None => Err('Invalid integer'),
    }
}
```

## The `?` Operator

The `?` operator provides a concise way to handle recoverable errors. If an expression returns a `Result` and the result is `Err`, the `?` operator immediately returns the error from the current function. If the result is `Ok`, it unwraps the value and continues execution.

```cairo,noplayground
fn do_something_with_parse_u8(input: felt252) -> Result<u8, felt252> {
    let input_to_u8: u8 = parse_u8(input)?; // Propagates error if parse_u8 fails
    // DO SOMETHING
    let res = input_to_u8 - 1;
    Ok(res)
}
```

This operator simplifies error propagation, making the code cleaner by allowing the caller to manage errors.

Common Error Messages and Resolutions

# Common Error Messages and Resolutions

This section lists common error messages encountered in Cairo and provides guidance on how to resolve them.

## Variable Management Errors

- **`Variable not dropped.`**: This error occurs when a variable of a type that does not implement the `Drop` trait goes out of scope without being destroyed.

  - **Resolution**: Ensure that variables requiring destruction at the end of a function's execution implement either the `Drop` trait or the `Destruct` trait. Refer to the [Ownership](ch04-01-what-is-ownership.md#destroying-values---example-with-feltdict) section for more details.

- **`Variable was previously moved.`**: This error indicates that you are attempting to use a variable whose ownership has already been transferred to another function. When a variable does not implement the `Copy` trait, it is passed by value, transferring ownership.
  - **Resolution**: Use the `clone` method if you need to use the variable's value after its ownership has been transferred.

## Type and Trait Errors

- **`error: Trait has no implementation in context: core::fmt::Display::<package_name::struct_name>`**: This error arises when trying to print an instance of a custom data type using `{}` placeholders in `print!` or `println!` macros.

  - **Resolution**: Manually implement the `Display` trait for your type, or apply `derive(Debug)` to your type and use `{:?}` placeholders to print the instance.

- **`Got an exception while executing a hint: Hint Error: Failed to deserialize param #x.`**: This error signifies that an entrypoint was called without the expected arguments.

  - **Resolution**: Verify that the arguments provided when calling an entrypoint are correct. For `u256` variables (which are structs of two `u128`), you need to pass two values when calling a function that expects a `u256`.

- **`Item path::item is not visible in this context.`**: This error means the path to an item is correct, but there's a visibility issue. By default, items are private to their parent modules.

  - **Resolution**: Declare the item and all modules in its path with `pub(crate)` or `pub` to grant access.

- **`Identifier not found.`**: This is a general error that might indicate:
  - A variable is used before declaration.
  - An incorrect path is used to bring an item into scope.
  - **Resolution**: Ensure variables are declared using `let` before use and that paths to items are valid.

## Starknet Components Related Error Messages

- **`Trait not found. Not a trait.`**: This error can occur if a component's `impl` block is not imported correctly in your contract.

  - **Resolution**: Ensure you follow the correct syntax for importing component implementations:

  ```cairo,noplayground
  #[abi(embed_v0)]
  impl IMPL_NAME = PATH_TO_COMPONENT::EMBEDDED_NAME<ContractState>
  ```

Testing in Cairo

Introduction to Cairo Testing

# Introduction to Cairo Testing

Writing and Running Basic Tests

# Writing and Running Basic Tests

A test in Cairo is a function annotated with the `#[test]` attribute. This attribute signals to the test runner that the function should be executed as a test.

## Project Setup and Running Tests

To begin, create a new project using Scarb:

```shell
scarb new adder
```

This creates a basic project structure:

```
adder
├── Scarb.toml
└── src
    └── lib.cairo
```

The `scarb test` command is used to compile and run all tests within the project.

## Defining a Test Function

A simple test function is defined by adding the `#[test]` attribute before the `fn` keyword. For example:

<span class="filename">Filename: src/lib.cairo</span>

```cairo, noplayground
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

<span class="caption">Listing 10-1: A simple test function</span>

The `#[cfg(test)]` attribute ensures that the `tests` module and its contents are only compiled when running tests. The `use super::*;` line brings items from the parent module into the scope of the `tests` module.

## Assertions in Tests

Tests often use assertion macros like `assert_eq!` to verify expected outcomes. `assert_eq!(a, b)` checks if `a` is equal to `b`.

## Test Execution Output

When `scarb test` is run, it compiles and executes the annotated test functions. The output indicates which tests are running, their status (e.g., `[PASS]`), and a summary of the results.

```shell
$ scarb test
     Running test listing_10_01 (snforge test)
   Compiling test(listings/ch10-testing-cairo-programs/listing_10_01/Scarb.toml)
    Finished `dev` profile target(s) in 8 seconds
[WARNING] File = /Users/msaug/workspace/cairo-book/listings/ch10-testing-cairo-programs/listing_10_01/target/dev/listing_10_01_unittest.test.starknet_artifacts.json missing when it should be existing, perhaps due to Scarb problem.


Collected 2 test(s) from listing_10_01 package
Running 2 test(s) from src/
[PASS] listing_10_01::tests::it_works (l1_gas: ~0, l1_data_gas: ~0, l2_gas: ~40000)
[PASS] listing_10_01::other_tests::exploration (l1_gas: ~0, l1_data_gas: ~0, l2_gas: ~40000)
Tests: 2 passed, 0 failed, 0 skipped, 0 ignored, 0 filtered out
```

## Renaming Test Functions

Test function names can be changed to be more descriptive. For instance, renaming `it_works` to `exploration`:

```cairo, noplayground
    #[test]
    fn exploration() {
        let result = 2 + 2;
        assert_eq!(result, 4);
    }
```

Running `scarb test` again will show the new name in the output.

## Filtering Tests

It's possible to run only specific tests by passing their names (or parts of their names) as arguments to `scarb test`. For example, `scarb test add_two` would run tests whose names contain "add_two". Tests that do not match the filter are reported as "filtered out".

Assertion Macros in Cairo

# Assertion Macros in Cairo

Cairo provides several macros to help assert conditions during testing, ensuring code behaves as expected.

## The `assert!` Macro

The `assert!` macro is used to verify that a condition evaluates to `true`. If the condition is `false`, the macro causes the test to fail by calling `panic()` with a specified message.

Consider the `Rectangle` struct and its `can_hold` method:

<span class="filename">Filename: src/lib.cairo</span>

```cairo, noplayground
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
```

<span class="caption">Listing 10-3: Using the `Rectangle` struct and its `can_hold` method from Chapter 5</span>

A test using `assert!` can verify the `can_hold` method:

```cairo, noplayground
# #[derive(Drop)]
# struct Rectangle {
#     width: u64,
#     height: u64,
# }
#
# trait RectangleTrait {
#     fn can_hold(self: @Rectangle, other: @Rectangle) -> bool;
# }
#
# impl RectangleImpl of RectangleTrait {
#     fn can_hold(self: @Rectangle, other: @Rectangle) -> bool {
#         *self.width > *other.width && *self.height > *other.height
#     }
# }
#
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
# #[cfg(test)]
# mod tests2 {
#     use super::*;
#
#     #[test]
#     fn smaller_cannot_hold_larger() {
#         let larger = Rectangle { height: 7, width: 8 };
#         let smaller = Rectangle { height: 1, width: 5 };
#
#         assert!(!smaller.can_hold(@larger), "rectangle cannot hold");
#     }
# }
```

## `assert_eq!` and `assert_ne!` Macros

These macros are convenient for testing equality (`assert_eq!`) and inequality (`assert_ne!`) between two values. They provide more detailed failure messages than `assert!` by printing the values being compared.

The `add_two` function and its tests:

<span class="filename">Filename: src/lib.cairo</span>

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

<span class="caption">Listing 10-5: Testing the function `add_two` using `assert_eq!` and `assert_ne!` macros</span>

When an assertion fails, these macros display the `left` and `right` values. For these macros to work, the compared types must implement the `PartialEq` and `Debug` traits. Deriving these traits using `#[derive(PartialEq, Debug)]` is usually sufficient.

Example with structs:

```cairo, noplayground
#[derive(Drop, Debug, PartialEq)]
struct MyStruct {
    var1: u8,
    var2: u8,
}

#[cfg(test)]
#[test]
fn test_struct_equality() {
    let first = MyStruct { var1: 1, var2: 2 };
    let second = MyStruct { var1: 1, var2: 2 };
    let third = MyStruct { var1: 1, var2: 3 };

    assert_eq!(first, second);
    assert_eq!(first, second, "{:?},{:?} should be equal", first, second);
    assert_ne!(first, third);
    assert_ne!(first, third, "{:?},{:?} should not be equal", first, third);
}
```

## `assert_lt!`, `assert_le!`, `assert_gt!`, and `assert_ge!` Macros

These macros facilitate comparison tests:

- `assert_lt!`: Checks if the left value is strictly less than the right value.
- `assert_le!`: Checks if the left value is less than or equal to the right value.
- `assert_gt!`: Checks if the left value is strictly greater than the right value.
- `assert_ge!`: Checks if the left value is greater than or equal to the right value.

These macros require the types to implement comparison traits like `PartialOrd`. The `Dice` struct example demonstrates this:

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

<span class="caption">Listing 10-6: Example of tests that use the `assert_xx!` macros for comparisons</span>

Note that the `Dice` struct also derives `Copy` to allow multiple uses in comparisons.

## Adding Custom Failure Messages

Optional arguments can be passed to assertion macros to provide custom failure messages. These arguments are processed by the `format!` macro, allowing for formatted strings with placeholders.

Example with a custom message for `assert_eq!`:

```cairo, noplayground
    #[test]
    fn it_adds_two() {
        assert_eq!(4, add_two(2), "Expected {}, got add_two(2)={}", 4, add_two(2));
    }
```

This results in a more informative error message upon test failure, detailing the expected versus actual values.

Handling Test Failures and Panics

# Handling Test Failures and Panics

Tests fail when the code being tested panics. Each test runs in its own thread, and if that thread dies, the test is marked as failed.

## Making Tests Fail

You can create a test that fails by using assertion macros like `assert!` with a condition that is false. For example, `assert!(result == 6, "Make this test fail")` will cause the test to fail with the provided message.

When a test fails, the output will indicate `[FAIL]` for that specific test, followed by a "Failure data" section detailing the reason for the failure, often including the panic message.

```cairo, noplayground
#[cfg(test)]
mod tests {
    #[test]
    fn exploration() {
        let result = 2 + 2;
        assert_eq!(result, 4);
    }

    #[test]
    fn another() {
        let result = 2 + 2;
        assert!(result == 6, "Make this test fail");
    }
}
```

## Checking for Panics with `should_panic`

To verify that your code handles error conditions correctly by panicking, you can use the `#[should_panic]` attribute on a test function. This test will pass if the code within the function panics, and fail if it does not.

Consider a `Guess` struct where the `new` function panics if the input value is out of range:

```cairo, noplayground
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

A test for this would look like:

```cairo, noplayground
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

If the `new` function is modified to not panic when it should, the `#[should_panic]` test will fail.

## Making `should_panic` More Precise

The `#[should_panic]` attribute can be made more precise by providing an `expected` parameter, which specifies a substring that must be present in the panic message.

For example, if the `new` function panics with different messages for out-of-bounds values:

```cairo, noplayground
impl GuessImpl of GuessTrait {
    fn new(value: u64) -> Guess {
        if value < 1 {
            panic!("Guess must be >= 1");
        } else if value > 100 {
            panic!("Guess must be <= 100");
        }
        Guess { value }
    }
}
```

A precise test would be:

```cairo, noplayground
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

If the panic message does not match the `expected` string, the test will fail, indicating the mismatch between the actual and expected panic messages.

Advanced Testing Features (Ignoring, Specific Tests)

### Ignoring Specific Tests

To exclude time-consuming tests from regular runs of `scarb test`, you can use the `#[ignore]` attribute. This attribute is placed above the `#[test]` attribute for the test function you wish to exclude.

```cairo, noplayground
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

    #[test]
    #[ignore]
    fn expensive_test() { // code that takes an hour to run
    }
}
```

When `scarb test` is executed, tests marked with `#[ignore]` will not be run.

Organizing Tests: Unit vs. Integration

# Organizing Tests: Unit vs. Integration

Tests in Cairo can be broadly categorized into two main types: unit tests and integration tests. This distinction helps in systematically verifying the correctness of code, both in isolation and when components interact.

## Unit Tests

Unit tests are designed to test individual units of code, such as functions or modules, in isolation. This allows for quick identification of issues within specific components.

### Location and Structure

Unit tests are typically placed within the `src` directory, in the same file as the code they are testing. The convention is to create a module named `tests` within the file and annotate it with `#[cfg(test)]`.

The `#[cfg(test)]` attribute instructs Cairo to compile and run this code only when the `scarb test` command is executed, not during a regular build (`scarb build`). This prevents test code from being included in the final compiled artifact, saving compile time and reducing the artifact's size.

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

### Testing Private Functions

Cairo's privacy rules allow unit tests to access and test private functions. Since the `tests` module is a child module of the code it's testing, it can use items from its parent modules.

**Example of Testing a Private Function:**

```cairo
pub fn add(a: u32, b: u32) -> u32 {
    internal_adder(a, 2)
}

fn internal_adder(a: u32, b: u32) -> u32 {
    a + b
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn add() {
        assert_eq!(4, internal_adder(2, 2));
    }
}
```

In this example, `internal_adder` is a private function. The `tests` module uses `use super::internal_adder;` to bring it into scope and test it.

## Integration Tests

Integration tests focus on verifying how different modules or components of your code work together. They treat your code as an external user would, interacting with it through its public interface.

### Location and Execution

Integration tests are placed in a separate directory, typically named `tests/`, outside of the `src` directory. Because they are in a different location, they do not require the `#[cfg(test)]` attribute.

To run integration tests, you use the `scarb test` command, often with a filter to target specific test modules within the `tests/` directory.

Running Integration Tests

# Running Integration Tests

Integration tests verify that different parts of your library work together correctly. They are structured similarly to unit tests but are placed in a `tests` directory at the top level of your project, alongside the `src` directory.

### The `tests` Directory

Scarb automatically looks for integration tests in the `tests` directory. Each file within this directory is compiled as an individual crate. To create an integration test, create a `tests` directory and a file (e.g., `integration_tests.cairo`) within it.

**Directory Structure Example:**

```shell
adder
├── Scarb.lock
├── Scarb.toml
├── src
│   └── lib.cairo
└── tests
    └── integration_tests.cairo
```

**Example `tests/integration_tests.cairo`:**

```cairo, noplayground
use adder::add_two;

#[test]
fn it_adds_two() {
    assert_eq!(4, add_two(2));
}
```

In integration tests, you need to bring your library's functions into scope using `use`, unlike unit tests which can use `super`.

### Running Integration Tests

Run integration tests using the `scarb test` command. Scarb compiles files in the `tests` directory only when this command is executed. The output will show sections for both unit and integration tests.

```shell
$ scarb test
     Running test adder (snforge test)
    Blocking waiting for file lock on registry db cache
    Blocking waiting for file lock on registry db cache
   Compiling test(listings/ch10-testing-cairo-programs/no_listing_09_integration_test/Scarb.toml)
   Compiling test(listings/ch10-testing-cairo-programs/no_listing_09_integration_test/Scarb.toml)
    Finished `dev` profile target(s) in 19 seconds
[WARNING] File = /Users/msaug/workspace/cairo-book/listings/ch10-testing-cairo-programs/no_listing_09_integration_test/target/dev/adder_unittest.test.starknet_artifacts.json missing when it should be existing, perhaps due to Scarb problem.
[WARNING] File = /Users/msaug/workspace/cairo-book/listings/ch10-testing-cairo-programs/no_listing_09_integration_test/target/dev/adder_integrationtest.test.starknet_artifacts.json missing when it should be existing, perhaps due to Scarb problem.


Collected 2 test(s) from adder package
Running 1 test(s) from tests/
[PASS] adder_integrationtest::integration_tests::it_adds_two (l1_gas: ~0, l1_data_gas: ~0, l2_gas: ~40000)
Running 1 test(s) from src/
[PASS] adder::tests::internal (l1_gas: ~0, l1_data_gas: ~0, l2_gas: ~40000)
Tests: 2 passed, 0 failed, 0 skipped, 0 ignored, 0 filtered out

```

### Filtering Tests

You can filter tests using the `-f` option with `scarb test`. To run a specific integration test function, use its full path (e.g., `scarb test -f integration_tests::internal`). To run all tests from a specific file, use the filename (e.g., `scarb test -f integration_tests`).

### Submodules in Integration Tests

To organize integration tests, you can create multiple files in the `tests` directory. Each file acts as a separate crate. If you need to share helper functions across test files, you can create a `tests/common.cairo` file and import its functions. However, each file in `tests` is compiled separately, unlike files in `src`.

To have the `tests` directory behave as a single crate, create a `tests/lib.cairo` file that declares the other test files as modules:

**Example `tests/lib.cairo`:**

```cairo, noplayground
mod common;
mod integration_tests;
```

This setup allows helper functions to be imported and used without being tested themselves, and the output of `scarb test` will reflect this organization.

Quizzes

# Quizzes

This section contains quizzes related to testing in Cairo. The quizzes cover topics such as identifying test annotations, writing tests for functions returning `Result`, and understanding test output.

## Quiz: How to Write Tests

This quiz assesses your understanding of writing tests in Cairo. It includes questions on:

- The annotation used to mark a function as a test.
- Valid ways to test functions that return a `Result` type, specifically checking for an `Err` variant.
- The conditions under which a test with `#[should_panic]` passes, particularly concerning the expected panic message.
- Interpreting the output of `scarb cairo-test` when tests are filtered, ignored, or pass/fail.

Smart Contracts on Starknet

Introduction to Smart Contracts

# Introduction to Smart Contracts

This chapter provides a high-level introduction to smart contracts, their applications, and the reasons for using Cairo and Starknet.

## Smart Contracts - Introduction

Smart contracts are programs deployed on a blockchain, gaining prominence with Ethereum. They are essentially code and instructions that execute based on inputs. Key components include storage and functions. Users interact with them via blockchain transactions. Smart contracts have their own addresses and can hold tokens.

Different blockchains use different programming languages: Solidity for Ethereum and Cairo for Starknet. Compilation also differs: Solidity compiles to bytecode, while Cairo compiles to Sierra and then Cairo Assembly (CASM).

## Smart Contracts - Characteristics

Smart contracts are:

- **Permissionless**: Anyone can deploy them.
- **Transparent**: Stored data and code are publicly accessible.
- **Composable**: They can interact with other smart contracts.

Smart contracts can only access blockchain-specific data; external data requires third-party software called oracles. Standards like ERC20 (for tokens) and ERC721 (for NFTs) facilitate interoperability between contracts.

## Smart Contracts - Use Cases

Smart contracts have diverse applications:

### DeFi (Decentralized Finance)

Enable financial applications without traditional intermediaries, including lending/borrowing, decentralized exchanges (DEXs), on-chain derivatives, and stablecoins.

### Tokenization

Facilitate the creation of digital tokens for real-world assets like real estate or art, enabling fractional ownership and easier trading.

### Voting

Create secure and transparent voting systems where votes are immutably recorded on the blockchain, with results tallied automatically.

### Royalties

Automate royalty payments for creators, distributing earnings automatically upon content sale or consumption.

### Decentralized Identities (DIDs)

Manage digital identities, allowing users to control personal information and securely share it, with contracts verifying authenticity and managing access.

The use cases for smart contracts are continually expanding, with Starknet and Cairo playing a role in this evolution.

Starknet and Scalability

# Starknet and Scalability

The success of Ethereum led to high transaction costs, necessitating solutions for scalability. The blockchain trilemma highlights the trade-off between scalability, decentralization, and security. Ethereum prioritizes decentralization and security, acting as a settlement layer, while complex computations are offloaded to Layer 2 (L2) networks.

## Layer 2 Solutions

L2s batch and compress transactions, compute new states, and settle results on Ethereum (L1). Two primary types exist:

- **Optimistic Rollups:** New states are considered valid by default, with a 7-day challenge period for detecting malicious transactions.
- **Validity Rollups (e.g., Starknet):** Utilize cryptography, specifically STARKs, to cryptographically prove the correctness of computed states. This approach offers significantly higher scalability potential than optimistic rollups.

Starkware's STARKs technology is a key enabler for Starknet's scalability. For a deeper understanding of Starknet's architecture, refer to the official [Starknet documentation](https://docs.starknet.io/documentation/architecture_and_concepts/).

Cairo Smart Contract Example

# Cairo Smart Contract Example

## Dice Game Contract Overview

This contract implements a dice game where players guess a number between 1 and 6. The contract owner can control the active game window. To determine winners, the owner requests a random number from the Pragma VRF oracle via `request_randomness_from_pragma`. The `receive_random_words` callback function stores this number. Players call `process_game_winners` to check if their guess matches the random number (modulo 6, plus 1), triggering `GameWinner` or `GameLost` events.

## Code Example

```cairo
#[starknet::contract]
mod DiceGame {
    use openzeppelin::access::ownable::OwnableComponent;
    use openzeppelin::token::erc20::interface::{ERC20ABIDispatcher, ERC20ABIDispatcherTrait};
    use pragma_lib::abi::{IRandomnessDispatcher, IRandomnessDispatcherTrait};
    use starknet::storage::{
        Map, StoragePathEntry, StoragePointerReadAccess, StoragePointerWriteAccess,
    };
    use starknet::{
        ContractAddress, contract_address_const, get_block_number, get_caller_address,
        get_contract_address,
    };

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);

    #[abi(embed_v0)]
    impl OwnableImpl = OwnableComponent::OwnableImpl<ContractState>;
    impl InternalImpl = OwnableComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        user_guesses: Map<ContractAddress, u8>,
        pragma_vrf_contract_address: ContractAddress,
        game_window: bool,
        min_block_number_storage: u64,
        last_random_number: felt252,
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        GameWinner: ResultAnnouncement,
        GameLost: ResultAnnouncement,
        #[flat]
        OwnableEvent: OwnableComponent::Event,
    }

    #[derive(Drop, starknet::Event)]
    struct ResultAnnouncement {
        caller: ContractAddress,
        guess: u8,
        random_number: u256,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        pragma_vrf_contract_address: ContractAddress,
        owner: ContractAddress,
    ) {
        self.ownable.initializer(owner);
        self.pragma_vrf_contract_address.write(pragma_vrf_contract_address);
        self.game_window.write(true);
    }

    #[abi(embed_v0)]
    impl DiceGame of super::IDiceGame<ContractState> {
        fn guess(ref self: ContractState, guess: u8) {
            assert(self.game_window.read(), 'GAME_INACTIVE');
            assert(guess >= 1 && guess <= 6, 'INVALID_GUESS');

            let caller = get_caller_address();
            self.user_guesses.entry(caller).write(guess);
        }

        fn toggle_play_window(ref self: ContractState) {
            self.ownable.assert_only_owner();

            let current: bool = self.game_window.read();
            self.game_window.write(!current);
        }

        fn get_game_window(self: @ContractState) -> bool {
            self.game_window.read()
        }

        fn process_game_winners(ref self: ContractState) {
            assert(!self.game_window.read(), 'GAME_ACTIVE');
            assert(self.last_random_number.read() != 0, 'NO_RANDOM_NUMBER_YET');

            let caller = get_caller_address();
            let user_guess: u8 = self.user_guesses.entry(caller).read();
            let reduced_random_number: u256 = self.last_random_number.read().into() % 6 + 1;

            if user_guess == reduced_random_number.try_into().unwrap() {
                self
                    .emit(
                        Event::GameWinner(
                            ResultAnnouncement {
                                caller: caller,
                                guess: user_guess,
                                random_number: reduced_random_number,
                            },
                        ),
                    );
            } else {
                self
                    .emit(
                        Event::GameLost(
                            ResultAnnouncement {
                                caller: caller,
                                guess: user_guess,
                                random_number: reduced_random_number,
                            },
                        ),
                    );
            }
        }
    }

    #[abi(embed_v0)]
    impl PragmaVRFOracle of super::IPragmaVRF<ContractState> {
        fn get_last_random_number(self: @ContractState) -> felt252 {
            let last_random = self.last_random_number.read();
            last_random
        }

        fn request_randomness_from_pragma(
            ref self: ContractState,
            seed: u64,
            callback_address: ContractAddress,
            callback_fee_limit: u128,
            publish_delay: u64,
            num_words: u64,
            calldata: Array<felt252>,
        ) {
            self.ownable.assert_only_owner();

            let randomness_contract_address = self.pragma_vrf_contract_address.read();
            let randomness_dispatcher = IRandomnessDispatcher {
                contract_address: randomness_contract_address,
            };

            // Approve the randomness contract to transfer the callback fee
            // You would need to send some ETH to this contract first to cover the fees
            let eth_dispatcher = ERC20ABIDispatcher {
                contract_address: contract_address_const::<
                    0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7,
                >() // ETH Contract Address
            };
            eth_dispatcher
                .approve(
                    randomness_contract_address,
                    (callback_fee_limit + callback_fee_limit / 5).into(),
                );

            // Request the randomness
            randomness_dispatcher
                .request_random(
                    seed, callback_address, callback_fee_limit, publish_delay, num_words, calldata,
                );

            let current_block_number = get_block_number();
            self.min_block_number_storage.write(current_block_number + publish_delay);
        }

        fn receive_random_words(
            ref self: ContractState,
            requester_address: ContractAddress,
            request_id: u64,
            random_words: Span<felt252>,
            calldata: Array<felt252>,
        ) {
            // Have to make sure that the caller is the Pragma Randomness Oracle contract
            let caller_address = get_caller_address();
            assert(
                caller_address == self.pragma_vrf_contract_address.read(),
                'caller not randomness contract',
            );
            // and that the current block is within publish_delay of the request block
            let current_block_number = get_block_number();
            let min_block_number = self.min_block_number_storage.read();
            assert(min_block_number <= current_block_number, 'block number issue');

            let random_word = *random_words.at(0);
            self.last_random_number.write(random_word);
        }

        fn withdraw_extra_fee_fund(ref self: ContractState, receiver: ContractAddress) {
            self.ownable.assert_only_owner();
            let eth_dispatcher = ERC20ABIDispatcher {
                contract_address: contract_address_const::<
                    0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7,
                >() // ETH Contract Address
            };
            let balance = eth_dispatcher.balance_of(get_contract_address());
            eth_dispatcher.transfer(receiver, balance);
        }
    }
}
```

Deploying and Interacting with Starknet Contracts

# Deploying and Interacting with Starknet Contracts

Interacting with Starknet contracts involves deploying them and then either calling or invoking their functions.

## Calling vs. Invoking Contracts

- **Calling contracts:** Used for external functions that only read from the contract's state. These operations do not alter the network's state and therefore do not require fees or signing.
- **Invoking contracts:** Used for external functions that can write to the contract's state. These operations alter the network's state and require fees and signing.

## Using the `katana` Local Starknet Node

For local development and testing, `katana` is recommended. It allows you to perform all necessary Starknet operations locally.

### Installing and Running `katana`

1.  **Installation:** Refer to the "Using Katana" chapter of the Dojo Engine for installation instructions.
2.  **Version Check:** Ensure your `katana` version matches the specified version (e.g., `katana 1.0.9-dev (38b3c2a6)`). Upgrade if necessary using the same installation guide.
    ```bash
    $ katana --version
    ```
3.  **Starting the Node:** Once installed, start the local Starknet node by running:
    ```bash
    katana
    ```

You can also use the Goerli Testnet, but `katana` is preferred for local development. A complete tutorial for `katana` is available in the Starknet Docs' "Using a development network" chapter.

Starknet Contract Fundamentals

Introduction to Starknet and Cairo

# Introduction to Starknet and Cairo

## Cairo and Starknet

Cairo is a language specifically designed for STARKs, enabling **provable code**. Starknet utilizes its own virtual machine (VM), diverging from competitors that use the EVM. This allows for greater flexibility and innovation. Key advantages include:

- Reduced transaction costs.
- Native account abstraction for "Smart Accounts" and complex transaction flows.
- Support for emerging use cases like **transparent AI** and on-chain **blockchain games**.
- Optimized for STARK proof capabilities for enhanced scalability.

## Cairo Programs vs. Starknet Contracts

Starknet contracts are a superset of Cairo programs, meaning prior Cairo knowledge is applicable.

A standard Cairo program requires a `main` function as its entry point:

```cairo
fn main() {}
```

In contrast, Starknet contracts, which are executed by the sequencer and have access to Starknet's state, do not have a `main` function. Instead, they feature one or multiple functions that serve as entry points.

Starknet Contract Structure and Core Attributes

# Starknet Contract Structure and Core Attributes

Starknet contracts are defined within modules annotated with the `#[starknet::contract]` attribute.

## Anatomy of a Simple Contract

A Starknet contract encapsulates state and logic within a module. The state is defined using a `struct` annotated with `#[storage]`, and the logic is implemented in functions that interact with this state.

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

### Contract State

The contract's state is defined within a `struct` annotated with `#[storage]`. This struct is initialized empty and holds the contract's persistent data.

### Contract Interface

Interfaces define the contract's public API. They are defined using traits annotated with `#[starknet::interface]`. Functions declared in an interface are public and callable from outside the contract.

```cairo,noplayground
#[starknet::interface]
trait INameRegistry<TContractState> {
    fn store_name(ref self: TContractState, name: felt252);
    fn get_name(self: @TContractState, address: ContractAddress) -> felt252;
}
```

The `self` parameter in interface functions, often generic like `TContractState`, indicates that the function can access the contract's state. The `ref` keyword signifies that the state may be modified.

### Constructor

A contract can have only one constructor, named `constructor` and annotated with `#[constructor]`. It initializes the contract's state and can accept arguments for deployment. The `constructor` function must take `self` as its first argument, typically by reference (`ref`) to modify the state.

### Public Functions

Public functions are accessible externally. They can be defined within an `impl` block annotated with `#[abi(embed_v0)]` (implementing an interface) or as standalone functions with the `#[external(v0)]` attribute.

Functions within `#[abi(embed_v0)]` implement the contract's interface and are entry points. Functions annotated with `#[external(v0)]` are also public.

Both types of public functions must accept `self` as their first argument.

#### External Functions

External functions, specifically those where `self` is passed by reference (`ref self: ContractState`), grant both read and write access to storage variables, allowing state modification.

Cairo Attributes and Function Signatures

# Cairo Attributes and Function Signatures

The following table outlines common Cairo attributes and their functionalities:

| Attribute          | Explanation                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------ |
| `#[abi(embed_v0)]` | Defines an implementation of a trait, exposing its functions as contract entrypoints.                        |
| `#[abi(per_item)]` | Allows individual definition of the entrypoint type for functions within an implementation.                  |
| `#[external(v0)]`  | Defines an external function when `#[abi(per_item)]` is used.                                                |
| `#[flat]`          | Defines a non-nested `Event` enum variant, ignoring the variant name during serialization for composability. |
| `#[key]`           | Defines an indexed `Event` enum field for more efficient event querying and filtering.                       |

The following symbols are used in the context of calling or defining macros:

| Symbol     | Explanation                   |
| ---------- | ----------------------------- |
| `print!`   | Inline printing.              |
| `println!` | Print on a new line.          |
| `array!`   | Instantiate and fill arrays.  |
| `panic!`   | Calls `panic` with a message. |

Contract State Management and Functionality

# Contract State Management and Functionality

## Constructors

Constructors are special functions that execute only once during contract deployment to initialize the contract's state. The example shows a `constructor` that initializes `names` and `total_names` storage variables.

```cairo,noplayground
# use starknet::ContractAddress;
#
# #[starknet::interface]
# pub trait INameRegistry<TContractState> {
#     fn store_name(ref self: TContractState, name: felt252);
#     fn get_name(self: @TContractState, address: ContractAddress) -> felt252;
# }
#
# #[starknet::contract]
# mod NameRegistry {
#     use starknet::storage::{
#         Map, StoragePathEntry, StoragePointerReadAccess, StoragePointerWriteAccess,
#     };
#     use starknet::{ContractAddress, get_caller_address};
#
#     #[storage]
#     struct Storage {
#         names: Map<ContractAddress, felt252>,
#         total_names: u128,
#     }
#
#     #[derive(Drop, Serde, starknet::Store)]
#     pub struct Person {
#         address: ContractAddress,
#         name: felt252,
#     }
#
    #[constructor]
    fn constructor(ref self: ContractState, owner: Person) {
        self.names.entry(owner.address).write(owner.name);
        self.total_names.write(1);
    }
#
#     // Public functions inside an impl block
#     #[abi(embed_v0)]
#     impl NameRegistry of super::INameRegistry<ContractState> {
#         fn store_name(ref self: ContractState, name: felt252) {
#             let caller = get_caller_address();
#             self._store_name(caller, name);
#         }
#
#         fn get_name(self: @ContractState, address: ContractAddress) -> felt252 {
#             self.names.entry(address).read()
#         }
#     }
#
#     // Standalone public function
#     #[external(v0)]
#     fn get_contract_name(self: @ContractState) -> felt252 {
#         'Name Registry'
#     }
#
#     // Could be a group of functions about a same topic
#     #[generate_trait]
#     impl InternalFunctions of InternalFunctionsTrait {
#         fn _store_name(ref self: ContractState, user: ContractAddress, name: felt252) {
#             let total_names = self.total_names.read();
#
#             self.names.entry(user).write(name);
#
#             self.total_names.write(total_names + 1);
#         }
#     }
#
#     // Free function
#     fn get_total_names_storage_address(self: @ContractState) -> felt252 {
#         self.total_names.__base_address__
#     }
# }
#
#
```

## Voting Mechanism

The `Vote` contract manages voting with constants `YES` (1) and `NO` (0). It registers voters and allows them to cast a vote once. The state is updated to record votes and mark voters as having voted, emitting a `VoteCast` event. Unauthorized attempts, like unregistered users voting or voting again, trigger an `UnauthorizedAttempt` event.

```cairo,noplayground
/// Core Library Imports for the Traits outside the Starknet Contract
use starknet::ContractAddress;

/// Trait defining the functions that can be implemented or called by the Starknet Contract
#[starknet::interface]
trait VoteTrait<T> {
    /// Returns the current vote status
    fn get_vote_status(self: @T) -> (u8, u8, u8, u8);
    /// Checks if the user at the specified address is allowed to vote
    fn voter_can_vote(self: @T, user_address: ContractAddress) -> bool;
    /// Checks if the specified address is registered as a voter
    fn is_voter_registered(self: @T, address: ContractAddress) -> bool;
    /// Allows a user to vote
    fn vote(ref self: T, vote: u8);
}

/// Starknet Contract allowing three registered voters to vote on a proposal
#[starknet::contract]
mod Vote {
    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
        StoragePointerWriteAccess,
    };
    use starknet::{ContractAddress, get_caller_address};

    const YES: u8 = 1_u8;
    const NO: u8 = 0_u8;

    #[storage]
    struct Storage {
        yes_votes: u8,
        no_votes: u8,
        can_vote: Map<ContractAddress, bool>,
        registered_voter: Map<ContractAddress, bool>,
    }

    #[constructor]
    fn constructor (
        ref self: ContractState,
        voter_1: ContractAddress,
        voter_2: ContractAddress,
        voter_3: ContractAddress,
    ) {
        self._register_voters(voter_1, voter_2, voter_3);

        self.yes_votes.write(0_u8);
        self.no_votes.write(0_u8);
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        VoteCast: VoteCast,
        UnauthorizedAttempt: UnauthorizedAttempt,
    }

    #[derive(Drop, starknet::Event)]
    struct VoteCast {
        voter: ContractAddress,
        vote: u8,
    }

    #[derive(Drop, starknet::Event)]
    struct UnauthorizedAttempt {
        unauthorized_address: ContractAddress,
    }

    #[abi(embed_v0)]
    impl VoteImpl of super::VoteTrait<ContractState> {
        fn get_vote_status(self: @ContractState) -> (u8, u8, u8, u8) {
            let (n_yes, n_no) = self._get_voting_result();
            let (yes_percentage, no_percentage) = self._get_voting_result_in_percentage();
            (n_yes, n_no, yes_percentage, no_percentage)
        }

        fn voter_can_vote(self: @ContractState, user_address: ContractAddress) -> bool {
            self.can_vote.read(user_address)
        }

        fn is_voter_registered(self: @ContractState, address: ContractAddress) -> bool {
            self.registered_voter.read(address)
        }

        fn vote(ref self: ContractState, vote: u8) {
            assert!(vote == NO || vote == YES, "VOTE_0_OR_1");
            let caller: ContractAddress = get_caller_address();
            self._assert_allowed(caller);
            self.can_vote.write(caller, false);

            if (vote == NO) {
                self.no_votes.write(self.no_votes.read() + 1_u8);
            }
            if (vote == YES) {
                self.yes_votes.write(self.yes_votes.read() + 1_u8);
            }

            self.emit(VoteCast { voter: caller, vote: vote });
        }
    }

    #[generate_trait]
    impl InternalFunctions of InternalFunctionsTrait {
        fn _register_voters (
            ref self: ContractState,
            voter_1: ContractAddress,
            voter_2: ContractAddress,
            voter_3: ContractAddress,
        ) {
            self.registered_voter.write(voter_1, true);
            self.can_vote.write(voter_1, true);

            self.registered_voter.write(voter_2, true);
            self.can_vote.write(voter_2, true);

            self.registered_voter.write(voter_3, true);
            self.can_vote.write(voter_3, true);
        }
    }

    #[generate_trait]
    impl AssertsImpl of AssertsTrait {
        fn _assert_allowed(ref self: ContractState, address: ContractAddress) {
            let is_voter: bool = self.registered_voter.read((address));
            let can_vote: bool = self.can_vote.read((address));

            if (!can_vote) {
                self.emit(UnauthorizedAttempt { unauthorized_address: address });
            }

            assert!(is_voter, "USER_NOT_REGISTERED");
            assert!(can_vote, "USER_ALREADY_VOTED");
        }
    }

    #[generate_trait]
    impl VoteResultFunctionsImpl of VoteResultFunctionsTrait {
        fn _get_voting_result(self: @ContractState) -> (u8, u8) {
            let n_yes: u8 = self.yes_votes.read();
            let n_no: u8 = self.no_votes.read();

            (n_yes, n_no)
        }

        fn _get_voting_result_in_percentage(self: @ContractState) -> (u8, u8) {
            let n_yes: u8 = self.yes_votes.read();
            let n_no: u8 = self.no_votes.read();

            let total_votes: u8 = n_yes + n_no;

            if (total_votes == 0_u8) {
                return (0, 0);
            }
            let yes_percentage: u8 = (n_yes * 100_u8) / (total_votes);
            let no_percentage: u8 = (n_no * 100_u8) / (total_votes);

            (yes_percentage, no_percentage)
        }
    }
}
```

## Access Control

Access control restricts access to contract features based on roles. The pattern involves defining roles (e.g., `owner`, `role_a`) and assigning them to users. Functions can then be restricted to specific roles using guard functions.

```cairo,noplayground
#[starknet::contract]
mod access_control_contract {
    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
        StoragePointerWriteAccess,
    };
    use starknet::{ContractAddress, get_caller_address};

    trait IContract<TContractState> {
        fn is_owner(self: @TContractState) -> bool;
        fn is_role_a(self: @TContractState) -> bool;
        fn only_owner(self: @TContractState);
        fn only_role_a(self: @TContractState);
        fn only_allowed(self: @TContractState);
        fn set_role_a(ref self: TContractState, _target: ContractAddress, _active: bool);
        fn role_a_action(ref self: ContractState);
        fn allowed_action(ref self: ContractState);
    }

    #[storage]
    struct Storage {
        // Role 'owner': only one address
        owner: ContractAddress,
        // Role 'role_a': a set of addresses
        role_a: Map<ContractAddress, bool>,
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        self.owner.write(get_caller_address());
    }

    // Guard functions to check roles

    impl Contract of IContract<ContractState> {
        #[inline(always)]
        fn is_owner(self: @ContractState) -> bool {
            self.owner.read() == get_caller_address()
        }

        #[inline(always)]
        fn is_role_a(self: @ContractState) -> bool {
            self.role_a.read(get_caller_address())
        }

        #[inline(always)]
        fn only_owner(self: @ContractState) {
            assert!(Self::is_owner(self), "Not owner");
        }

        #[inline(always)]
        fn only_role_a(self: @ContractState) {
            assert!(Self::is_role_a(self), "Not role A");
        }

        // You can easily combine guards to perform complex checks
        fn only_allowed(self: @ContractState) {
            assert!(Self::is_owner(self) || Contract::is_role_a(self), "Not allowed");
        }

        // Functions to manage roles

        fn set_role_a(ref self: ContractState, _target: ContractAddress, _active: bool) {
            Self::only_owner(@self);
            self.role_a.write(_target, _active);
        }

        // You can now focus on the business logic of your contract
        // and reduce the complexity of your code by using guard functions

        fn role_a_action(ref self: ContractState) {
            Self::only_role_a(@self);
            // ...
        }

        fn allowed_action(ref self: ContractState) {
            Self::only_allowed(@self);
            // ...
        }
    }
}
```

Starknet System Calls

# Starknet System Calls

## Call Contract

This system call invokes a specified function in another contract.

### Arguments

- `address`: The address of the contract to call.
- `entry_point_selector`: The selector for the function, computed using `selector!`.
- `calldata`: The array of call arguments.

### Return Values

Returns a `SyscallResult<Span<felt252>>` representing the call response.

### Notes

- Internal calls cannot return `Err(_)`.
- Failure of `call_contract_syscall` results in transaction reversion.
- This is a lower-level syntax; use contract interfaces for a more straightforward approach when available.

## Deploy

Deploys a new instance of a previously declared contract class.

### Syntax

```cairo,noplayground
pub extern fn deploy_syscall(
    class_hash: ClassHash,
    contract_address_salt: felt252,
    calldata: Span<felt252>,
    deploy_from_zero: bool,
) -> SyscallResult<(ContractAddress, Span<felt252>)> implicits(GasBuiltin, System) nopanic;
```

### Arguments

- `class_hash`: The hash of the contract class to deploy.
- `contract_address_salt`: An arbitrary value used in the contract address computation.
- `calldata`: The constructor's calldata.
- `deploy_from_zero`: A flag for contract address computation; uses caller address if false, 0 if true.

### Return Values

Returns the contract address and calldata.

## Get Class Hash At

Retrieves the class hash of the contract at a specified address.

### Syntax

```cairo,noplayground
pub extern fn get_class_hash_at_syscall(
    contract_address: ContractAddress,
) -> SyscallResult<ClassHash> implicits(GasBuiltin, System) nopanic;
```

### Arguments

- `contract_address`: The address of the deployed contract.

### Return Values

Returns the class hash of the contract's originating code.

## Replace Class

Replaces the class of the calling contract with a new one.

### Syntax

```cairo,noplayground
pub extern fn replace_class_syscall(
    class_hash: ClassHash,
) -> SyscallResult<()> implicits(GasBuiltin, System) nopanic;
```

### Arguments

- `class_hash`: The hash of the replacement class.

### Notes

- The code executing from the old class will finish.
- The new class is used from the next transaction onwards or subsequent `call_contract` calls.

## Storage Read

Reads a value from storage.

### Syntax

```cairo,noplayground
pub extern fn storage_read_syscall(
    address_domain: u32, address: StorageAddress,
) -> SyscallResult<felt252> implicits(GasBuiltin, System) nopanic;
```

Contract Classes, Addressing, and Deployment

# Contract Classes, Addressing, and Deployment

Starknet distinguishes between a contract's definition (class) and its deployed instance. A contract class is the blueprint, while a contract instance is a deployed contract tied to a specific class.

## Contract Classes

### Components of a Cairo Class Definition

A class definition includes:

- **Contract Class Version**: Currently supported version is 0.1.0.
- **External Functions Entry Points**: Pairs of `(_selector_, _function_idx_)`, where `_selector_` is the `starknet_keccak` hash of the function name and `_function_idx_` is the function's index in the Sierra program.
- **L1 Handlers Entry Points**: Entry points for handling L1 messages.
- **Constructors Entry Points**: Currently, only one constructor is allowed.
- **ABI**: A string representing the contract's ABI. Its hash affects the class hash. The "honest" ABI is the JSON serialization produced by the Cairo compiler.
- **Sierra Program**: An array of field elements representing the Sierra instructions.

### Class Hash

Each class is uniquely identified by its class hash, which is the chain hash of its components:

```
class_hash = h(
    contract_class_version,
    external_entry_points,
    l1_handler_entry_points,
    constructor_entry_points,
    abi_hash,
    sierra_program_hash
)
```

Where `h` is the Poseidon hash function. The hash of an entry point array is `h(selector_1, index_1, ..., selector_n, index_n)`. The `sierra_program_hash` is the Poseidon hash of the program's bytecode array. The `contract_class_version` is the ASCII encoding of `CONTRACT_CLASS_V0.1.0` for domain separation.

### Working with Classes

- **Declare**: Use the `DECLARE` transaction to introduce new classes to Starknet's state.
- **Deploy**: Use the `deploy` system call to deploy a new instance of a declared class.
- **Library Call**: Use the `library_call` system call to utilize a declared class's functionality without deploying an instance, similar to Ethereum's `delegatecall`.

## Contract Instances

### Contract Nonce

A contract instance has a nonce, which is the count of transactions originating from that address plus one. The initial nonce for an account deployed via `DEPLOY_ACCOUNT` is `0`.

### Contract Address

A contract address is a unique identifier computed as a chain hash of:

- `prefix`: The ASCII encoding of `STARKNET_CONTRACT_ADDRESS`.
- `deployer_address`: `0` for `DEPLOY_ACCOUNT` transactions, or determined by the `deploy_from_zero` parameter for the `deploy` system call.
- `salt`: Provided by the transaction sender.
- `class_hash`: The hash of the contract's class definition.
- `constructor_calldata_hash`: The hash of the constructor's input arguments.

The address is computed using the Pedersen hash function:

```
contract_address = pedersen(
    “STARKNET_CONTRACT_ADDRESS",
    deployer_address,
    salt,
    class_hash,
    constructor_calldata_hash)
```

## Class Hash Example

The `ClassHash` type represents the hash of a contract class, enabling multiple contracts to share the same code and facilitating upgrades.

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

Advanced Contract Patterns and Examples

# Advanced Contract Patterns and Examples

No content available for this section.

Contract State and Storage

Introduction to Cairo Contract Storage

# Introduction to Cairo Contract Storage

The contract's storage is a persistent storage space where data can be read, written, modified, and persisted. It is structured as a map containing $2^{251}$ slots, with each slot being a `felt252` initialized to 0.

## Storage Slot Identification

Each storage slot is uniquely identified by a `felt252` value, referred to as the storage address. This address is computed based on the variable's name and parameters, which are influenced by the variable's type. For further details on the computation of these addresses, refer to the ["Addresses of Storage Variables"][storage addresses] section.

Accessing and Modifying Contract State

# Accessing and Modifying Contract State

Functions can access the contract's state using the `self: ContractState` object, which abstracts underlying system calls like `storage_read_syscall` and `storage_write_syscall`. The compiler uses `ref` and `@` modifiers on `self` to distinguish view and external functions.

The `#[storage]` attribute is used to annotate the `Storage` struct, enabling interaction with the blockchain state. The `#[abi(embed_v0)]` attribute is required to expose functions defined in an implementation block to the outside world.

## Accessing and Modifying Storage Variables

Two primary methods are used to interact with contract state:

- **`read()`**: This method is called on a storage variable to retrieve its value. It takes no arguments for simple variables.
  ```cairo
  // Example for a simple variable
  self.stored_data.read()
  ```
- **`write(value)`**: This method is used to update the value of a storage variable. It takes the new value as an argument. For complex types like mappings, it may require additional arguments (e.g., key and value).
  ```cairo
  // Example for a simple variable
  self.stored_data.write(x);
  ```

When `self` is a snapshot of `ContractState` (e.g., in view functions), only read access is permitted, and events cannot be emitted.

### Accessing Members of Storage Structs

For storage variables that are structs, you can access and modify individual members directly by calling `read` and `write` on those members. This is more efficient than reading or writing the entire struct at once.

```cairo
// Reading a member of a struct
self.owner.name.read()

// Writing to a member of a struct
self.owner.name.write(new_name);
```

The `Storage` struct can contain various types, including other structs, enums, and specialized types like Storage Mappings, Vectors, and Nodes.

### Direct Storage Access (Syscalls)

While the `ContractState` abstraction is preferred, direct access to storage can be achieved using system calls:

- **`storage_read_syscall(address_domain: u32, address: StorageAddress)`**: Reads a value from a specified storage address.

  ```cairo
  use starknet::storage_access::storage_base_address_from_felt252;

  let storage_address = storage_base_address_from_felt252(3534535754756246375475423547453);
  storage_read_syscall(0, storage_address).unwrap_syscall();
  ```

- **`storage_write_syscall(address_domain: u32, address: StorageAddress, value: felt252)`**: Writes a value to a specified storage address.

The `address_domain` parameter is used to separate data availability modes, with domain `0` currently representing the onchain mode.

You can access the base address of a storage variable using the `__base_address__` attribute.

Defining Contract State with `#[storage]`

# Defining Contract State with `#[storage]`

Contract state in Starknet is managed through a special struct named `Storage`, which must be annotated with the `#[storage]` attribute. This struct defines the variables that will be persisted in the contract's storage.

```cairo, noplayground
#[storage]
struct Storage {
    owner: Person,
    expiration: Expiration,
}
```

## Storage Variable Types

Complex types like structs and enums can be used as storage variables, provided they implement the `Drop`, `Serde`, and `starknet::Store` traits.

### Enums in Storage

Enums used in contract storage must implement the `Store` trait. This can typically be achieved by deriving it, as long as all associated types also implement `Store`.

Crucially, enums in storage **must** define a default variant. This default variant is returned when a storage slot is read but has not yet been written to, preventing runtime errors.

Here's an example of an enum suitable for storage:

```cairo, noplayground
#[derive(Copy, Drop, Serde, starknet::Store)]
pub enum Expiration {
    Finite: u64,
    #[default]
    Infinite,
}
```

Storage Layout and Representation of Custom Types

# Storage Layout and Representation of Custom Types

To store custom types in contract storage, they must implement the `starknet::Store` trait. Most core library types already implement this trait. However, memory collections like `Array<T>` and `Felt252Dict<T>` cannot be stored directly; `Vec<T>` and `Map<K, V>` should be used instead.

## Storing Custom Types with the `Store` Trait

For user-defined types like structs or enums, the `Store` trait must be explicitly implemented. This is typically done using the `#[derive(starknet::Store)]` attribute. All members of the struct must also implement the `Store` trait for this derivation to succeed.

Additionally, custom types often need to derive `Drop` and `Serde` for proper serialization and deserialization of arguments and outputs.

```cairo, noplayground
#[derive(Drop, Serde, starknet::Store)]
pub struct Person {
    address: ContractAddress,
    name: felt252,
}

#[derive(Copy, Drop, Serde, starknet::Store)]
pub enum Expiration {
    Finite: u64,
    #[default]
    Infinite,
}
```

## Structs Storage Layout

Structs are stored in storage as a sequence of primitive types. The elements are laid out in the order they are defined within the struct. The first element resides at the struct's base address, computed as specified in the "Addresses of Storage Variables" section, and subsequent elements are stored at contiguous addresses.

For a `Person` struct with `address` and `name` fields, the layout is:

| Fields  | Address                      |
| ------- | ---------------------------- |
| address | `owner.__base_address__`     |
| name    | `owner.__base_address__ + 1` |

Tuples are stored similarly, with the first element at the base address and subsequent elements contiguously.

## Enums Storage Layout

Enums are stored by their variant's index and any associated values. The index starts at 0 for the first variant and increments for each subsequent variant. If a variant has an associated value, it is stored immediately after the variant's index.

For the `Expiration` enum:

**Finite variant:**
| Element | Address |
| ---------------------------- | --------------------------------- |
| Variant index (0 for Finite) | `expiration.__base_address__` |
| Associated limit date | `expiration.__base_address__ + 1` |

**Infinite variant:**
| Element | Address |
| ------------------------------ | ----------------------------- |
| Variant index (1 for Infinite) | `expiration.__base_address__` |

The `#[default]` attribute on a variant (e.g., `Infinite`) specifies the value returned when reading an uninitialized enum from storage.

## Storage Nodes

Storage nodes are special structs that can contain storage-specific types like `Map`, `Vec`, or other storage nodes. They can only exist within contract storage and are used for creating complex storage layouts, grouping related data, and improving code organization.

Storage nodes are defined with the `#[starknet::storage_node]` attribute.

```cairo, noplayground
#[starknet::storage_node]
struct ProposalNode {
    title: felt252,
    description: felt252,
    yes_votes: u32,
    no_votes: u32,
    voters: Map<ContractAddress, bool>,
}
```

## Modeling of the Contract Storage in the Core Library

The core library models contract storage using `StoragePointers` and `StoragePaths` to manage storage variable retrieval. Each storage variable can be represented as a `StoragePointer`, which includes:

- The base address of the variable in storage.
- An offset relative to the base address for the specific storage slot.

This system facilitates address calculations within the contract's storage space, especially for nested or complex types.

Working with Storage Nodes, Maps, and Vectors

# Working with Storage Nodes, Maps, and Vectors

You can access storage variables using automatically generated `read` and `write` functions. For structs, individual members can be accessed directly. Custom types like structs and enums must implement the `Store` trait, which can be done using `#[derive(starknet::Store)]` or a manual implementation.

## Addresses of Storage Variables

The address of a storage variable is computed using `sn_keccak` hash of its name. For complex types, the storage layout is determined by the type's structure.

- **Single Values**: Address is `sn_keccak` hash of the variable's name.
- **Composed Values (tuples, structs, enums)**: Base address is `sn_keccak` hash of the variable's name. Storage layout depends on the type's structure.
- **Storage Nodes**: Address is a chain of hashes reflecting the node's structure. For a member `m` in `variable_name`, the path is `h(sn_keccak(variable_name), sn_keccak(m))`, where `h` is the Pedersen hash.
- **Maps and Vecs**: Address is computed relative to the storage base address (`sn_keccak` hash of the variable's name) and the keys/indices.

Structs are stored as sequences of primitive types, while enums store the variant index and associated values. Storage nodes are special structs containing storage-specific types like `Map` or `Vec`, and can only exist within contract storage.

## Storing Key-Value Pairs with Mappings

Storage mappings associate keys with values in contract storage. They do not store key data directly; instead, the hash of the key computes the storage slot address for the value. This means iteration over keys is not possible.

## Working with Vectors

To retrieve an element from a `Vec`, use the `at` or `get` methods to obtain a storage pointer to the element at a specific index, then call `read`. `at` panics if the index is out of bounds, while `get` returns `None`.

```cairo
# use starknet::ContractAddress;
#
# #[starknet::interface]
# trait IAddressList<TState> {
#     fn register_caller(ref self: TState);
#     fn get_n_th_registered_address(self: @TState, index: u64) -> Option<ContractAddress>;
#     fn get_all_addresses(self: @TState) -> Array<ContractAddress>;
#     fn modify_nth_address(ref self: TState, index: u64, new_address: ContractAddress);
# }
#
# #[starknet::contract]
# mod AddressList {
#     use starknet::storage::{
#         MutableVecTrait, StoragePointerReadAccess, StoragePointerWriteAccess, Vec, VecTrait,
#     };
#     use starknet::{ContractAddress, get_caller_address};
#
#     #[storage]
#     struct Storage {
#         addresses: Vec<ContractAddress>,
#     }
#
#     impl AddressListImpl of super::IAddressList<ContractState> {
#         fn register_caller(ref self: ContractState) {
#             let caller = get_caller_address();
#             self.addresses.push(caller);
#         }
#
#         fn get_n_th_registered_address(
#             self: @ContractState, index: u64,
#         ) -> Option<ContractAddress> {
#             if let Some(storage_ptr) = self.addresses.get(index) {
#                 return Some(storage_ptr.read());
#             }
#             return None;
#         }
#
#         fn get_all_addresses(self: @ContractState) -> Array<ContractAddress> {
#             let mut addresses = array![];
#             for i in 0..self.addresses.len() {
#                 addresses.append(self.addresses.at(i).read());
#             }
#             addresses
#         }
#
        fn modify_nth_address(ref self: ContractState, index: u64, new_address: ContractAddress) {
            let mut storage_ptr = self.addresses.at(index);
            storage_ptr.write(new_address);
        }
#     }
# }
#
#
```

To retrieve all elements of a `Vec`, iterate through its indices, read each value, and append it to a memory `Array<T>`. Conversely, you cannot store a memory `Array<T>` directly in storage; you must iterate over its elements and append them to a storage `Vec<T>`.

To modify the address stored at a specific index of a `Vec`:

```cairo
# use starknet::ContractAddress;
#
# #[starknet::interface]
# trait IAddressList<TState> {
#     fn register_caller(ref self: TState);
#     fn get_n_th_registered_address(self: @TState, index: u64) -> Option<ContractAddress>;
#     fn get_all_addresses(self: @TState) -> Array<ContractAddress>;
#     fn modify_nth_address(ref self: TState, index: u64, new_address: ContractAddress);
# }
#
# #[starknet::contract]
# mod AddressList {
#     use starknet::storage::{
#         MutableVecTrait, StoragePointerReadAccess, StoragePointerWriteAccess, Vec, VecTrait,
#     };
#     use starknet::{ContractAddress, get_caller_address};
#
#     #[storage]
#     struct Storage {
#         addresses: Vec<ContractAddress>,
#     }
#
#     impl AddressListImpl of super::IAddressList<ContractState> {
#         fn register_caller(ref self: ContractState) {
#             let caller = get_caller_address();
#             self.addresses.push(caller);
#         }
#
#         fn get_n_th_registered_address(
#             self: @ContractState, index: u64,
#         ) -> Option<ContractAddress> {
#             if let Some(storage_ptr) = self.addresses.get(index) {
#                 return Some(storage_ptr.read());
#             }
#             return None;
#         }
#
#         fn get_all_addresses(self: @ContractState) -> Array<ContractAddress> {
#             let mut addresses = array![];
#             for i in 0..self.addresses.len() {
#                 addresses.append(self.addresses.at(i).read());
#             }
#             addresses
#         }
#
        fn modify_nth_address(ref self: ContractState, index: u64, new_address: ContractAddress) {
            let mut storage_ptr = self.addresses.at(index);
            storage_ptr.write(new_address);
        }
#     }
# }
#
#
```

Advanced Storage Concepts and System Calls

# Advanced Storage Concepts and System Calls

There is no content available for this section.

Examples and Best Practices

# Examples and Best Practices

Storage Mappings and Vectors

Storage Mappings

# Storage Mappings

Mappings in Cairo, declared using the `Map` type from `core::starknet::storage`, are used for persistent key-value storage in contracts. Unlike memory dictionaries like `Felt252Dict`, `Map` is a phantom type specifically designed for contract storage and has limitations: it cannot be instantiated as a regular variable, used as a function parameter, or included in regular structs. It can only be declared as a storage variable within a contract's storage struct.

Mappings do not inherently track length or whether a key-value pair exists; all unassigned values default to `0`. To remove an entry, set its value to the type's default.

## Declaring and Using Storage Mappings

To declare a mapping, specify the key and value types within angle brackets, e.g., `Map<ContractAddress, u64>`.

```cairo
#[starknet::contract]
mod UserValues {
    use starknet::storage::Map;
    use starknet::{ContractAddress, get_caller_address};

    #[storage]
    struct Storage {
        user_values: Map<ContractAddress, u64>,
    }

    impl UserValuesImpl of super::IUserValues<ContractState> {
        fn set(ref self: ContractState, amount: u64) {
            let caller = get_caller_address();
            self.user_values.entry(caller).write(amount);
        }

        fn get(self: @ContractState, address: ContractAddress) -> u64 {
            self.user_values.entry(address).read()
        }
    }
}
```

To read a value, obtain the storage pointer for the key using `.entry(key)` and then call `.read()`:

```cairo
fn get(self: @ContractState, address: ContractAddress) -> u64 {
    self.user_values.entry(address).read()
}
```

To write a value, obtain the storage pointer for the key using `.entry(key)` and then call `.write(value)`:

```cairo
fn set(ref self: ContractState, amount: u64) {
    let caller = get_caller_address();
    self.user_values.entry(caller).write(amount);
}
```

## Nested Mappings

Mappings can be nested to create more complex data structures. For example, a mapping can store multiple items and their quantities for each user:

```cairo
#[starknet::contract]
mod WarehouseContract {
    use starknet::storage::Map;
    use starknet::{ContractAddress, get_caller_address};

    #[storage]
    struct Storage {
        user_warehouse: Map<ContractAddress, Map<u64, u64>>,
    }

    impl WarehouseContractImpl of super::IWarehouseContract<ContractState> {
        fn set_quantity(ref self: ContractState, item_id: u64, quantity: u64) {
            let caller = get_caller_address();
            self.user_warehouse.entry(caller).entry(item_id).write(quantity);
        }

        fn get_item_quantity(self: @ContractState, address: ContractAddress, item_id: u64) -> u64 {
            self.user_warehouse.entry(address).entry(item_id).read()
        }
    }
}
```

Accessing nested mappings involves chaining `.entry()` calls, for example: `self.user_warehouse.entry(caller).entry(item_id).write(quantity)`.

Storage Vectors

# Storage Vectors

The `Vec<T>` type from the `core::starknet::storage` module allows storing collections of values in contract storage. To use it, you need to import `VecTrait` and `MutableVecTrait` for read and write operations.

It's important to note that `Array<T>` is a memory type and cannot be directly stored in contract storage. `Vec<T>` is a phantom type for storage but has limitations: it cannot be instantiated as a regular variable, used as a function parameter, or included as a member in regular structs. To work with its full contents, elements must be copied to and from a memory `Array<T>`.

## Declaring and Using Storage Vectors

To declare a storage vector, use `Vec<T>` with the element type in angle brackets. The `push` method adds an element to the end of the vector.

```cairo, noplayground
# use starknet::ContractAddress;
#
# #[starknet::interface]
# trait IAddressList<TState> {
#     fn register_caller(ref self: TState);
#     fn get_n_th_registered_address(self: @TState, index: u64) -> Option<ContractAddress>;
#     fn get_all_addresses(self: @TState) -> Array<ContractAddress>;
#     fn modify_nth_address(ref self: TState, index: u64, new_address: ContractAddress);
# }
#
#[starknet::contract]
mod AddressList {
    use starknet::storage::{
        MutableVecTrait, StoragePointerReadAccess, StoragePointerWriteAccess, Vec, VecTrait,
    };
    use starknet::{ContractAddress, get_caller_address};

    #[storage]
    struct Storage {
        addresses: Vec<ContractAddress>,
    }

    impl AddressListImpl of super::IAddressList<ContractState> {
        fn register_caller(ref self: ContractState) {
            let caller = get_caller_address();
            self.addresses.push(caller);
        }

        fn get_n_th_registered_address(
            self: @ContractState, index: u64,
        ) -> Option<ContractAddress> {
            if let Some(storage_ptr) = self.addresses.get(index) {
                return Some(storage_ptr.read());
            }
            return None;
        }

        fn get_all_addresses(self: @ContractState) -> Array<ContractAddress> {
            let mut addresses = array![];
            for i in 0..self.addresses.len() {
                addresses.append(self.addresses.at(i).read());
            }
            addresses
        }

        fn modify_nth_address(ref self: ContractState, index: u64, new_address: ContractAddress) {
            let mut storage_ptr = self.addresses.at(index);
            storage_ptr.write(new_address);
        }
    }
}
```

<span class="caption">Listing 15-3: Declaring a storage `Vec` in the Storage struct</span>

Elements can be accessed by index using `get(index)` which returns a `StoragePointerReadAccess`, and modified using `at(index)` which returns a `StoragePointerWriteAccess`.

Starknet Address Types

# Starknet Address Types

Starknet provides specialized types for interacting with the blockchain, including addresses for contracts, storage, and Ethereum compatibility.

## Contract Address

The `ContractAddress` type represents the unique identifier of a deployed contract on Starknet. It is used for calling other contracts, verifying caller identities, and managing access control.

```cairo
use starknet::{ContractAddress, get_caller_address};

#[starknet::interface]
pub trait IAddressExample<TContractState> {
    fn get_owner(self: @TContractState) -> ContractAddress;
    fn transfer_ownership(ref self: TContractState, new_owner: ContractAddress);
}

#[starknet::contract]
mod AddressExample {
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use super::{ContractAddress, get_caller_address};

    #[storage]
    struct Storage {
        owner: ContractAddress,
    }

    #[constructor]
    fn constructor(ref self: ContractState, initial_owner: ContractAddress) {
        self.owner.write(initial_owner);
    }

    #[abi(embed_v0)]
    impl AddressExampleImpl of super::IAddressExample<ContractState> {
        fn get_owner(self: @ContractState) -> ContractAddress {
            self.owner.read()
        }

        fn transfer_ownership(ref self: ContractState, new_owner: ContractAddress) {
            let caller = get_caller_address();
            assert(caller == self.owner.read(), 'Only owner can transfer');
            self.owner.write(new_owner);
        }
    }
}
```

Contract addresses in Starknet have a value range of `[0, 2^251)`, which is enforced by the type system. A `ContractAddress` can be created from a `felt252` using the `TryInto` trait.

## Storage Address

The `StorageAddress` type denotes the location of a value within a contract's storage. While typically managed by storage systems (like `Map` and `Vec`), understanding it is crucial for advanced storage patterns. Each value in the `Storage` struct has a `StorageAddress` that can be accessed directly.

```cairo
#[starknet::contract]
mod StorageExample {
    use starknet::storage_access::StorageAddress;

    #[storage]
    struct Storage {
        value: u256,
    }

    // This is an internal function that demonstrates StorageAddress usage
    // In practice, you rarely need to work with StorageAddress directly
    fn read_from_storage_address(address: StorageAddress) -> felt252 {
        starknet::syscalls::storage_read_syscall(0, address).unwrap()
    }
}
```

Storage addresses share the same value range as contract addresses `[0, 2^251)`. The related `StorageBaseAddress` type has a slightly smaller range `[0, 2^251 - 256)` to accommodate offset calculations.

## Ethereum Address

The `EthAddress` type represents a 20-byte Ethereum address, primarily used for cross-chain applications on Starknet, such as L1-L2 messaging and token bridges.

```cairo
use starknet::EthAddress;

#[starknet::interface]
pub trait IEthAddressExample<TContractState> {
    fn set_l1_contract(ref self: TContractState, l1_contract: EthAddress);
    fn send_message_to_l1(ref self: TContractState, recipient: EthAddress, amount: felt252);
}

#[starknet::contract]
mod EthAddressExample {
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use starknet::syscalls::send_message_to_l1_syscall;
    use super::EthAddress;

    #[storage]
    struct Storage {
        l1_contract: EthAddress,
    }

    #[abi(embed_v0)]
    impl EthAddressExampleImpl of super::IEthAddressExample<ContractState> {
        fn set_l1_contract(ref self: ContractState, l1_contract: EthAddress) {
            self.l1_contract.write(l1_contract);
        }

        fn send_message_to_l1(ref self: ContractState, recipient: EthAddress, amount: felt252) {
            // Send a message to L1 with recipient and amount
            let payload = array![recipient.into(), amount];
            send_message_to_l1_syscall(self.l1_contract.read().into(), payload.span()).unwrap();
        }
    }

    #[l1_handler]
    fn handle_message_from_l1(ref self: ContractState, from_address: felt252, amount: felt252) {
        // Verify the message comes from the expected L1 contract
        assert(from_address == self.l1_contract.read().into(), 'Invalid L1 sender');
        // Process the message...
    }
}
```

Contract Functions and Entrypoints

Public, External, and View Functions

# Public, External, and View Functions

In Starknet, functions are categorized based on their accessibility and state-mutating capabilities:

- **Public Function:** Exposed to the outside world, callable from both external transactions and within the contract itself. In the example, `set` and `get` are public functions.
- **External Function:** A public function that can be invoked via a Starknet transaction and can mutate the contract's state. `set` is an example of an external function.
- **View Function:** A public function that is generally read-only and cannot mutate the contract's state. This restriction is enforced by the compiler.

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

To ensure the contract implementation aligns with its interface (defined as a trait, e.g., `ISimpleStorage`), public functions must be defined within an implementation of that trait.

State Mutability and Function Behavior

# State Mutability and Function Behavior

## View Functions

View functions are public functions that accept `self: ContractState` as a snapshot, allowing only read access to storage variables. They restrict writes to storage through `self`, leading to compilation errors if attempted. The compiler marks their state mutability as `view`, preventing any state modification via `self`.

```cairo,noplayground
# use starknet::ContractAddress;
#
# #[starknet::interface]
# pub trait INameRegistry<TContractState> {
#     fn store_name(ref self: TContractState, name: felt252);
#     fn get_name(self: @TContractState, address: ContractAddress) -> felt252;
# }
#
# #[starknet::contract]
# mod NameRegistry {
#     use starknet::storage::{
#         Map, StoragePathEntry, StoragePointerReadAccess, StoragePointerWriteAccess,
#     };
#     use starknet::{ContractAddress, get_caller_address};
#
#     #[storage]
#     struct Storage {
#         names: Map<ContractAddress, felt252>,
#         total_names: u128,
#     }
#
#     #[derive(Drop, Serde, starknet::Store)]
#     pub struct Person {
#         address: ContractAddress,
#         name: felt252,
#     }
#
#     #[constructor]
#     fn constructor(ref self: ContractState, owner: Person) {
#         self.names.entry(owner.address).write(owner.name);
#         self.total_names.write(1);
#     }
#
#     // Public functions inside an impl block
#     #[abi(embed_v0)]
#     impl NameRegistry of super::INameRegistry<ContractState> {
#         fn store_name(ref self: ContractState, name: felt252) {
#             let caller = get_caller_address();
#             self._store_name(caller, name);
#         }
#
        fn get_name(self: @ContractState, address: ContractAddress) -> felt252 {
            self.names.entry(address).read()
        }
#     }
#
#     // Standalone public function
#     #[external(v0)]
#     fn get_contract_name(self: @ContractState) -> felt252 {
#         'Name Registry'
#     }
#
#     // Could be a group of functions about a same topic
#     #[generate_trait]
#     impl InternalFunctions of InternalFunctionsTrait {
#         fn _store_name(ref self: ContractState, user: ContractAddress, name: felt252) {
#             let total_names = self.total_names.read();
#
#             self.names.entry(user).write(name);
#
#             self.total_names.write(total_names + 1);
#         }
#     }
#
#     // Free function
#     fn get_total_names_storage_address(self: @ContractState) -> felt252 {
#         self.total_names.__base_address__
#     }
# }
#
#
```

Defining Entrypoints with Cairo Attributes

# Defining Entrypoints with Cairo Attributes

Standalone public functions can be defined outside of an `impl` block using the `#[external(v0)]` attribute. This automatically generates an entry in the contract ABI, making these functions callable from outside the contract. The first parameter of such functions must be `self`.

The `#[generate_trait]` attribute automatically generates a trait definition for an implementation block, simplifying the process of defining functions without explicit trait definitions. It is often used for private `impl` blocks.

The `#[abi(per_item)]` attribute, when applied to an `impl` block (often in conjunction with `#[generate_trait]`), allows for individual function entrypoint definitions. Functions within such an `impl` block must be annotated with `#[external(v0)]` to be exposed as public entrypoints; otherwise, they are treated as private.

```cairo
// Example of a standalone public function
#[external(v0)]
fn get_contract_name(self: @ContractState) -> felt252 {
    'Name Registry'
}

// Example using #[abi(per_item)] and #[external(v0)]
#[starknet::contract]
mod ContractExample {
    #[storage]
    struct Storage {}

    #[abi(per_item)]
    #[generate_trait]
    impl SomeImpl of SomeTrait {
        #[constructor]
        fn constructor(ref self: ContractState) {}

        #[external(v0)]
        fn external_function(ref self: ContractState, arg1: felt252) {}

        #[l1_handler]
        fn handle_message(ref self: ContractState, from_address: felt252, arg: felt252) {}

        fn internal_function(self: @ContractState) {}
    }
}
```

Entrypoint Types and Contract Interaction Patterns

# Entrypoint Types and Contract Interaction Patterns

Contracts interact with each other in Cairo using the **dispatcher** pattern. This involves a specific type that implements methods to call functions of another contract, automatically handling data encoding and decoding. The JSON ABI is crucial for correctly encoding and decoding data when interacting with smart contracts, as seen in block explorers.

## Entrypoints

Entrypoints are functions exposed in a contract's ABI that can be called from outside the contract. There are three types of entrypoints in Starknet contracts:

- **Public Functions**: These are the most common entrypoints. They are exposed as either `view` (read-only) or `external` (state-mutating), depending on their state mutability. Note that a `view` function might still modify the contract's state if it uses low-level calls not enforced for immutability by the compiler.
- **Constructor**: An optional, unique entrypoint called only once during contract deployment.
- **L1-Handlers**: Functions that can only be triggered by the sequencer after receiving a message from the L1 network, which includes an instruction to call a contract.

A function entrypoint is represented by a selector and a `function_idx` within a Cairo contract class.

Events in Starknet Contracts

Defining Events in Starknet Contracts

# Defining Events in Starknet Contracts

Events are custom data structures emitted by a smart contract during execution, stored in transaction receipts for external tools to parse and index.

Events are defined within an enum annotated with `#[event]`, which must be named `Event`. Each variant of this enum represents a distinct event that can be emitted by the contract, with its associated data being any struct or enum that implements the `starknet::Event` trait, achieved by adding `#[derive(starknet::Event)]`.

```cairo
#[event]
#[derive(Drop, starknet::Event)]
pub enum Event {
    BookAdded: BookAdded,
    #[flat]
    FieldUpdated: FieldUpdated,
    BookRemoved: BookRemoved,
}

#[derive(Drop, starknet::Event)]
pub struct BookAdded {
    pub id: u32,
    pub title: felt252,
    #[key]
    pub author: felt252,
}

#[derive(Drop, starknet::Event)]
pub enum FieldUpdated {
    Title: UpdatedTitleData,
    Author: UpdatedAuthorData,
}

#[derive(Drop, starknet::Event)]
pub struct UpdatedTitleData {
    #[key]
    pub id: u32,
    pub new_title: felt252,
}

#[derive(Drop, starknet::Event)]
pub struct UpdatedAuthorData {
    #[key]
    pub id: u32,
    pub new_author: felt252,
}

#[derive(Drop, starknet::Event)]
pub struct BookRemoved {
    pub id: u32,
}
```

The `#[key]` attribute can be applied to event data fields. These "key" fields are stored separately from data fields, enabling external tools to filter events based on these keys.

Emitting Events and Contract Interactions

# Emitting Events and Contract Interactions

Starknet contracts can emit events to signal state changes or important occurrences. These events can be filtered and retrieved using methods like `starknet_getEvents`.

## Emitting Events using `emit_event_syscall`

The `emit_event_syscall` is a low-level function for emitting events.

### Syntax

```cairo
pub extern fn emit_event_syscall(
    keys: Span<felt252>, data: Span<felt252>,
) -> SyscallResult<()> implicits(GasBuiltin, System) nopanic;
```

### Description

This function emits an event with a specified set of keys and data. The `keys` argument is analogous to Ethereum's event topics, allowing for event filtering. The `data` argument contains the event's payload.

### Example

The following example demonstrates emitting an event with two keys and three data elements:

```cairo
let keys = ArrayTrait::new();
keys.append('key');
keys.append('deposit');
let values = ArrayTrait::new();
values.append(1);
values.append(2);
values.append(3);
emit_event_syscall(keys, values).unwrap_syscall();
```

## Emitting Events using `self.emit()`

A more convenient way to emit events is by using the `self.emit()` method, which takes an event data structure as a parameter.

### Defining Events

Events are defined using `struct` or `enum` types, annotated with `#[starknet::Event]`.

- **Keys:** Fields marked with `#[key]` are considered event keys, used for filtering.
- **Data:** Fields not marked with `#[key]` are part of the event data.
- **Variant Names:** For enums, the variant name is used as the first event key to represent the event's name.

### The `#[flat]` Attribute

The `#[flat]` attribute can be applied to enum variants to flatten the event structure. When used, the inner variant's name becomes the event name instead of the outer enum variant's name. This is useful for nested event structures.

### Example of Emitting Events

This example defines three events: `BookAdded`, `FieldUpdated`, and `BookRemoved`. `BookAdded` and `BookRemoved` use simple structs, while `FieldUpdated` uses an enum of structs. The `author` field in `BookAdded` is marked as a key. The `FieldUpdated` enum variant is marked with `#[flat]`.

```cairo
#[starknet::interface]
pub trait IEventExample<TContractState> {
    fn add_book(ref self: TContractState, id: u32, title: felt252, author: felt252);
    fn change_book_title(ref self: TContractState, id: u32, new_title: felt252);
    fn change_book_author(ref self: TContractState, id: u32, new_author: felt252);
    fn remove_book(ref self: TContractState, id: u32);
}

#[starknet::contract]
mod EventExample {
    #[storage]
    struct Storage {}

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        BookAdded: BookAdded,
        #[flat]
        FieldUpdated: FieldUpdated,
        BookRemoved: BookRemoved,
    }

    #[derive(Drop, starknet::Event)]
    pub struct BookAdded {
        pub id: u32,
        pub title: felt252,
        #[key]
        pub author: felt252,
    }

    #[derive(Drop, starknet::Event)]
    pub enum FieldUpdated {
        Title: UpdatedTitleData,
        Author: UpdatedAuthorData,
    }

    #[derive(Drop, starknet::Event)]
    pub struct UpdatedTitleData {
        #[key]
        pub id: u32,
        pub new_title: felt252,
    }

    #[derive(Drop, starknet::Event)]
    pub struct UpdatedAuthorData {
        #[key]
        pub id: u32,
        pub new_author: felt252,
    }

    #[derive(Drop, starknet::Event)]
    pub struct BookRemoved {
        pub id: u32,
    }

    #[abi(embed_v0)]
    impl EventExampleImpl of super::IEventExample<ContractState> {
        fn add_book(ref self: ContractState, id: u32, title: felt252, author: felt252) {
            // ... logic to add a book in the contract storage ...
            self.emit(BookAdded { id, title, author });
        }

        fn change_book_title(ref self: ContractState, id: u32, new_title: felt252) {
            self.emit(FieldUpdated::Title(UpdatedTitleData { id, new_title }));
        }

        fn change_book_author(ref self: ContractState, id: u32, new_author: felt252) {
            self.emit(FieldUpdated::Author(UpdatedAuthorData { id, new_author }));
        }

        fn remove_book(ref self: ContractState, id: u32) {
            self.emit(BookRemoved { id });
        }
    }
}
```

Event Data and Transaction Receipts

# Event Data and Transaction Receipts

To understand how events are stored in transaction receipts, let's examine two examples:

### Example 1: Add a book

When invoking the `add_book` function with `id` = 42, `title` = 'Misery', and `author` = 'S. King', the transaction receipt's "events" section will contain:

```json
"events": [
    {
      "from_address": "0x27d07155a12554d4fd785d0b6d80c03e433313df03bb57939ec8fb0652dbe79",
      "keys": [
        "0x2d00090ebd741d3a4883f2218bd731a3aaa913083e84fcf363af3db06f235bc",
        "0x532e204b696e67"
      ],
      "data": [
        "0x2a",
        "0x4d6973657279"
      ]
    }
  ]
```

In this receipt:

- `from_address`: The address of the smart contract.
- `keys`: Contains serialized key fields of the emitted event.
  - The first key is the selector of the event name (`selector!("BookAdded")`).
  - The second key (`0x532e204b696e67 = 'S. King'`) is the `author` field, marked with `#[key]`.
- `data`: Contains serialized data fields of the event.
  - The first item (`0x2a = 42`) is the `id` field.
  - The second item (`0x4d6973657279 = 'Misery'`) is the `title` field.

### Example 2: Update a book author

When invoking `change_book_author` with `id` = 42 and `new_author` = 'Stephen King', which emits a `FieldUpdated` event, the transaction receipt's "events" section will show:

```json
"events": [
    {
      "from_address": "0x27d07155a12554d4fd785d0b6d80c03e433313df03bb57939ec8fb0652dbe79",
      "keys": [
        "0x1b90a4a3fc9e1658a4afcd28ad839182217a69668000c6104560d6db882b0e1",
        "0x2a"
      ],
      "data": [
        "0x5374657068656e204b696e67"
      ]
    }
  ]
```

In this receipt for the `FieldUpdated` event:

- `from_address`: The address of the smart contract.
- `keys`: Contains serialized key fields.
  - The first key is the selector for `FieldUpdated`.
  - The second key (`0x2a`) is the `id` of the book being updated.
- `data`: Contains serialized data fields.
  - The `data` field (`0x5374657068656e204b696e67 = 'Stephen King'`) is the new author's name.

Interacting with Starknet Contracts

Introduction to Starknet Contract Interaction

# Introduction to Starknet Contract Interaction

Mechanisms for Interacting with Starknet Contracts

# Mechanisms for Interacting with Starknet Contracts

A smart contract requires an external trigger to execute. Interaction between contracts enables complex applications. This chapter covers interacting with smart contracts, the Application Binary Interface (ABI), calling contracts, and contract communication. It also details using classes as libraries.

## Contract Class ABI

The Contract Class Application Binary Interface (ABI) is the high-level specification of a contract's interface. It details callable functions, their parameters, and return values, enabling external communication through data encoding and decoding. A JSON representation, generated from the contract class, is typically used by external sources.

## Calling Contracts Using the Contract Dispatcher

Contract dispatchers are structs that wrap a contract address and implement a generated trait for the contract's interface. The implementation includes:

- Serialization of function arguments into a `felt252` array (`__calldata__`).
- A low-level contract call using `contract_call_syscall` with the contract address, function selector, and `__calldata__`.
- Deserialization of the returned value.

The following example demonstrates a contract that interacts with an ERC20 contract, calling its `name` and `transfer_from` functions:

```cairo,noplayground
# use starknet::ContractAddress;
#
# #[starknet::interface]
# trait IERC20<TContractState> {
#     fn name(self: @TContractState) -> felt252;
#
#     fn symbol(self: @TContractState) -> felt252;
#
#     fn decimals(self: @TContractState) -> u8;
#
#     fn total_supply(self: @TContractState) -> u256;
#
#     fn balance_of(self: @TContractState, account: ContractAddress) -> u256;
#
#     fn allowance(self: @TContractState, owner: ContractAddress, spender: ContractAddress) -> u256;
#
#     fn transfer(ref self: TContractState, recipient: ContractAddress, amount: u256) -> bool;
#
#     fn transfer_from(
#         ref self: TContractState, sender: ContractAddress, recipient: ContractAddress, amount: u256,
#     ) -> bool;
#
#     fn approve(ref self: TContractState, spender: ContractAddress, amount: u256) -> bool;
# }
#
# #[starknet::interface]
# trait ITokenWrapper<TContractState> {
#     fn token_name(self: @TContractState, contract_address: ContractAddress) -> felt252;
#
#     fn transfer_token(
#         ref self: TContractState,
#         address: ContractAddress,
#         recipient: ContractAddress,
#         amount: u256,
#     ) -> bool;
# }
#
# //**** Specify interface here ****//
#[starknet::contract]
mod TokenWrapper {
    use starknet::{ContractAddress, get_caller_address};
    use super::ITokenWrapper;
    use super::{IERC20Dispatcher, IERC20DispatcherTrait};

    #[storage]
    struct Storage {}

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
#
#
```

## Handling Errors with Safe Dispatchers

Safe dispatchers return a `Result<T, Array<felt252>>`, allowing for error handling. However, certain scenarios still cause immediate transaction reverts, including failures in Cairo Zero contract calls, library calls to non-existent classes, calls to non-existent contract addresses, and various `deploy` or `replace_class` syscall failures.

## Calling Contracts using Low-Level Calls

The `call_contract_syscall` provides direct control over serialization and deserialization for contract calls. Arguments must be serialized into a `Span<felt252>`. The call returns serialized values that need manual deserialization.

The following example demonstrates calling the `transfer_from` function of an ERC20 contract using `call_contract_syscall`:

```cairo,noplayground
use starknet::ContractAddress;

#[starknet::interface]
trait ITokenWrapper<TContractState> {
    fn transfer_token(
        ref self: TContractState,
        address: ContractAddress,
        recipient: ContractAddress,
        amount: u256,
    ) -> bool;
}

#[starknet::contract]
mod TokenWrapper {
    use starknet::{ContractAddress, SyscallResultTrait, get_caller_address, syscalls};
    use super::ITokenWrapper;

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

To use this syscall, provide the contract address, the function selector, and serialized call arguments.

## Executing Code from Another Class (Library Calls)

Library calls allow a contract to execute logic from another class within its own context, updating its own state, unlike contract calls which execute in the context of the called contract.

When contract A calls contract B:

- The execution context is B's.
- `get_caller_address()` in B returns A's address.
- `get_contract_address()` in B returns B's address.
- Storage updates in B affect B's storage.

Using Starkli for Contract Interaction

# Using Starkli for Contract Interaction

This section outlines how to deploy a contract and interact with its functions using the `starkli` command-line tool.

## Deploying a Contract

The following command deploys a voting contract and registers specified voter addresses as eligible. The constructor arguments are the addresses of the voters.

```bash
starkli deploy <class_hash_of_the_contract_to_be_deployed> <voter_0_address> <voter_1_address> <voter_2_address> --rpc http://0.0.0.0:5050 --account katana-0
```

An example deployment command:

```bash
starkli deploy 0x06974677a079b7edfadcd70aa4d12aac0263a4cda379009fca125e0ab1a9ba52 0x03ee9e18edc71a6df30ac3aca2e0b02a198fbce19b7480a63a0d71cbd76652e0 0x033c627a3e5213790e246a917770ce23d7e562baa5b4d2917c23b1be6d91961c 0x01d98d835e43b032254ffbef0f150c5606fa9c5c9310b1fae370ab956a7919f5 --rpc http://0.0.0.0:5050 --account katana-0
```

After deployment, the contract will be available at a specific address (e.g., `0x05ea3a690be71c7fcd83945517f82e8861a97d42fca8ec9a2c46831d11f33349`), which will differ for each deployment.

## Voter Eligibility Verification

The voting contract includes functions to verify voter eligibility: `voter_can_vote` and `is_voter_registered`. These are external read functions, meaning they do not modify the contract's state.

- `is_voter_registered`: Checks if a given address is registered as an eligible voter.
- `voter_can_vote`: Checks if a voter at a specific address is eligible to vote (i.e., registered and has not yet voted).

These functions can be called using the `starkli call` command. The `call` command is for read-only functions and does not require signing, unlike the `invoke` command which is used for state-modifying functions.

```bash+
starkli call 0x05ea3a690be71c7fcd83945517f82e8861a97d42fca8ec9a2c46831d11f33349 voter_can_vote 0x03ee9e18edc71a6df30ac3aca2e0b02a198fbce19b7480a63a0d71cbd76652e0 --rpc http://0.0.0.0:5050
```

Practical Application: Interacting with Oracles and ERC20 Contracts

# Practical Application: Interacting with Oracles and ERC20 Contracts

The Pragma oracle provides price feeds for various token pairs. When consuming these feeds, it's important to note that Pragma returns values with a decimal factor of 6 or 8. To convert these values to a required decimal factor, divide by $10^n$, where $n$ is the decimal factor.

An example contract interacting with the Pragma oracle and an ERC20 contract (like ETH) is provided. This contract imports `IPragmaABIDispatcher` and `ERC20ABIDispatcher`. It defines a constant for the `ETH/USD` token pair and storage for the Pragma contract address and the product price in USD. The `buy_item` function retrieves the ETH price from the oracle, calculates the required ETH amount, checks the caller's ETH balance using `balance_of` from the ERC20 contract, and then transfers the ETH using `transfer_from`.

## Interacting with Starknet Contracts using `starkli`

The `starkli` tool can be used to interact with Starknet contracts. The general syntax involves specifying the contract address, the function to call, and the function's input.

### Checking Voter Eligibility

To check if a voter is eligible, you can use the `call` command with the `is_voter_registered` function.

```bash
starkli call 0x05ea3a690be71c7fcd83945517f82e8861a97d42fca8ec9a2c46831d11f33349 is_voter_registered 0x03ee9e18edc71a6df30ac3aca2e0b02a198fbce19b7480a63a0d71cbd76652e0 --rpc http://0.0.0.0:5050
```

This command returns `1` (true) if the voter is registered. Calling with an unregistered address returns `0` (false).

### Casting a Vote

To cast a vote, use the `invoke` command with the `vote` function, providing `1` for Yes or `0` for No as input. This operation requires a fee and the transaction must be signed.

```bash
# Voting Yes
starkli invoke 0x05ea3a690be71c7fcd83945517f82e8861a97d42fca8ec9a2c46831d11f33349 vote 1 --rpc http://0.0.0.0:5050 --account katana-0

# Voting No
starkli invoke 0x05ea3a690be71c7fcd83945517f82e8861a97d42fca8ec9a2c46831d11f33349 vote 0 --rpc http://0.0.0.0:5050 --account katana-0
```

After invoking, you can check the transaction status using:

```bash
starkli transaction <TRANSACTION_HASH> --rpc http://0.0.0.0:5050
```

### Handling Double Voting Errors

Attempting to vote twice with the same signer results in a `ContractError` with the reason `USER_ALREADY_VOTED`. This can be confirmed by inspecting the `katana` node's output, which provides more detailed error messages.

```
Transaction execution error: "Error in the called contract (0x03ee9e18edc71a6df30ac3aca2e0b02a198fbce19b7480a63a0d71cbd76652e0):\n    Error at pc=0:81:\n    Got an exception while executing a hint: Custom Hint Error: Execution failed. Failure reason: \"USER_ALREADY_VOTED\".\n    ...\n"
```

The contract logic includes an assertion: `assert!(can_vote, "USER_ALREADY_VOTED");`.

To manage multiple signers for voting, create Signer and Account Descriptors for each account, deriving Signers from private keys and Account Descriptors from public keys, smart wallet addresses, and the smart wallet class hash.

Dispatchers and Library Calls

Understanding Cairo Dispatchers

# Understanding Cairo Dispatchers

Cairo utilizes dispatcher patterns to facilitate interactions between contracts and libraries. These dispatchers abstract the complexity of low-level system calls, providing a type-safe interface for contract interactions.

## Types of Dispatchers

There are two primary categories of dispatchers:

- **Contract Dispatchers**: Such as `IERC20Dispatcher` and `IERC20SafeDispatcher`, these wrap a `ContractAddress` and are used to invoke functions on other deployed contracts.
- **Library Dispatchers**: Such as `IERC20LibraryDispatcher` and `IERC20SafeLibraryDispatcher`, these wrap a class hash and are used to call functions within classes. Their usage will be detailed in a subsequent chapter.

The `'Safe'` variants of these dispatchers offer the capability to manage and handle potential errors that might arise during the execution of a call.

Under the hood, dispatchers leverage the `contract_call_syscall`. This system call allows for the invocation of functions on other contracts by providing the contract address, the function selector, and the necessary arguments. The dispatcher pattern simplifies this process, abstracting the syscall's intricacies.

## The Dispatcher Pattern Example (`IERC20`)

The compiler automatically generates dispatcher structs and traits for given interfaces. Below is an example for an `IERC20` interface exposing a `name` view function and a `transfer` external function:

```cairo,noplayground
use starknet::ContractAddress;

trait IERC20DispatcherTrait<T> {
    fn name(self: T) -> felt252;
    fn transfer(self: T, recipient: ContractAddress, amount: u256);
}

#[derive(Copy, Drop, starknet::Store, Serde)]
struct IERC20Dispatcher {
    pub contract_address: starknet::ContractAddress,
}

impl IERC20DispatcherImpl of IERC20DispatcherTrait<IERC20Dispatcher> {
    fn name(self: IERC20Dispatcher) -> felt252 {
        let mut __calldata__ = core::traits::Default::default();

        let mut __dispatcher_return_data__ = starknet::syscalls::call_contract_syscall(
            self.contract_address, selector!("name"), core::array::ArrayTrait::span(@__calldata__),
        );
        let mut __dispatcher_return_data__ = starknet::SyscallResultTrait::unwrap_syscall(
            __dispatcher_return_data__,
        );
        core::option::OptionTrait::expect(
            core::serde::Serde::<felt252>::deserialize(ref __dispatcher_return_data__),
            'Returned data too short',
        )
    }
    fn transfer(self: IERC20Dispatcher, recipient: ContractAddress, amount: u256) {
        let mut __calldata__ = core::traits::Default::default();
        core::serde::Serde::<ContractAddress>::serialize(@recipient, ref __calldata__);
        core::serde::Serde::<u256>::serialize(@amount, ref __calldata__);

        let mut __dispatcher_return_data__ = starknet::syscalls::call_contract_syscall(
            self.contract_address,
            selector!("transfer"),
            core::array::ArrayTrait::span(@__calldata__),
        );
        let mut __dispatcher_return_data__ = starknet::SyscallResultTrait::unwrap_syscall(
            __dispatcher_return_data__,
        );
        ()
    }
}
```

Interacting with Other Contracts via Dispatchers

# Interacting with Other Contracts via Dispatchers

The dispatcher pattern provides a structured way to call functions on other contracts. It involves using a struct that wraps the target contract's address and implements a dispatcher trait, which is automatically generated from the contract's ABI. This approach leverages Cairo's trait system for type-safe interactions.

## Dispatcher Pattern

Functions in Cairo are identified by selectors, which are derived from function names using `sn_keccak(function_name)`. Dispatchers abstract the process of computing these selectors and making low-level system calls or RPC interactions.

When a contract interface is defined, the Cairo compiler automatically generates and exports dispatchers. For example, an `IERC20` interface would generate an `IERC20Dispatcher` struct and an `IERC20DispatcherTrait`.

```cairo
// Example usage of a dispatcher
#[starknet::interface]
pub trait IERC20<TState> {
    fn name(self: @TState) -> felt252;
    fn transfer(ref self: TState, recipient: felt252, amount: u256);
}

// ... inside a contract ...
// let contract_address = 0x123.try_into().unwrap();
// let erc20_dispatcher = IERC20Dispatcher { contract_address };
// let name = erc20_dispatcher.name();
// erc20_dispatcher.transfer(recipient_address, amount);
```

## Handling Errors with Safe Dispatchers

'Safe' dispatchers, such as `IERC20SafeDispatcher`, enable calling contracts to gracefully handle potential execution errors. If a function called via a safe dispatcher panics, the execution returns to the caller, and the safe dispatcher returns a `Result::Err` containing the panic reason.

Consider the following example using a hypothetical `IFailableContract` interface:

```cairo,noplayground
#[starknet::interface]
pub trait IFailableContract<TState> {
    fn can_fail(self: @TState) -> u32;
}

#[feature("safe_dispatcher")]
fn interact_with_failable_contract() -> u32 {
    let contract_address = 0x123.try_into().unwrap();
    // Use the Safe Dispatcher
    let faillable_dispatcher = IFailableContractSafeDispatcher { contract_address };
    let response: Result<u32, Array<felt252>> = faillable_dispatcher.can_fail();

    // Match the result to handle success or failure
    match response {
        Result::Ok(x) => x, // Return the value on success
        Result::Err(_panic_reason) => {
            // Handle the error, e.g., log it or return a default value
            // The panic_reason is an array of felts detailing the error
            0 // Return 0 in case of failure
        },
    }
}
```

Leveraging Library Calls for Logic Execution

# Leveraging Library Calls for Logic Execution

When a contract (A) uses a library call to invoke the logic of another class (B), the execution context remains that of contract A. This means that functions like `get_caller_address()` and `get_contract_address()` within B's logic will return values pertaining to A's context. Similarly, any storage updates made within B's class will affect A's storage.

Library calls can be implemented using a dispatcher pattern, similar to contract dispatchers but utilizing a class hash instead of a contract address. The primary difference in the underlying mechanism is the use of `library_call_syscall` instead of `call_contract_syscall`.

## Library Dispatcher Example

Listing 16-5 demonstrates a simplified `IERC20LibraryDispatcher` and its associated trait and implementation:

```cairo
use starknet::ContractAddress;

trait IERC20DispatcherTrait<T> {
    fn name(self: T) -> felt252;
    fn transfer(self: T, recipient: ContractAddress, amount: u256);
}

#[derive(Copy, Drop, starknet::Store, Serde)]
struct IERC20LibraryDispatcher {
    class_hash: starknet::ClassHash,
}

impl IERC20LibraryDispatcherImpl of IERC20DispatcherTrait< IERC20LibraryDispatcher> {
    fn name(
        self: IERC20LibraryDispatcher,
    ) -> felt252 { // starknet::syscalls::library_call_syscall  is called in here
    }
    fn transfer(
        self: IERC20LibraryDispatcher, recipient: ContractAddress, amount: u256,
    ) { // starknet::syscalls::library_call_syscall  is called in here
    }
}
```

This example illustrates how to set up a dispatcher for library calls, enabling the execution of logic from another class within the current contract's context.

Practical Examples of Dispatchers and Library Calls

# Practical Examples of Dispatchers and Library Calls

This section demonstrates practical examples of using dispatchers and low-level calls for interacting with Cairo contracts.

## Using Library Dispatchers

This example defines two contracts: `ValueStoreLogic` for the core logic and `ValueStoreExecutor` to execute that logic. `ValueStoreExecutor` imports and uses `IValueStoreLibraryDispatcher` to make library calls to `ValueStoreLogic`.

```cairo,noplayground
#[starknet::interface]
trait IValueStore<TContractState> {
    fn set_value(ref self: TContractState, value: u128);
    fn get_value(self: @TContractState) -> u128;
}

#[starknet::contract]
mod ValueStoreLogic {
    use starknet::ContractAddress;
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};

    #[storage]
    struct Storage {
        value: u128,
    }

    #[abi(embed_v0)]
    impl ValueStore of super::IValueStore<ContractState> {
        fn set_value(ref self: ContractState, value: u128) {
            self.value.write(value);
        }

        fn get_value(self: @ContractState) -> u128 {
            self.value.read()
        }
    }
}

#[starknet::contract]
mod ValueStoreExecutor {
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use starknet::{ClassHash, ContractAddress};
    use super::{IValueStoreDispatcherTrait, IValueStoreLibraryDispatcher};

    #[storage]
    struct Storage {
        logic_library: ClassHash,
        value: u128,
    }

    #[constructor]
    fn constructor(ref self: ContractState, logic_library: ClassHash) {
        self.logic_library.write(logic_library);
    }

    #[abi(embed_v0)]
    impl ValueStoreExecutor of super::IValueStore<ContractState> {
        fn set_value(ref self: ContractState, value: u128) {
            IValueStoreLibraryDispatcher { class_hash: self.logic_library.read() }
                .set_value((value));
        }

        fn get_value(self: @ContractState) -> u128 {
            IValueStoreLibraryDispatcher { class_hash: self.logic_library.read() }.get_value()
        }
    }

    #[external(v0)]
    fn get_value_local(self: @ContractState) -> u128 {
        self.value.read()
    }
}
```

When `set_value` is called on `ValueStoreExecutor`, it performs a library call to `ValueStoreLogic.set_value`, updating `ValueStoreExecutor`'s storage. Similarly, `get_value` calls `ValueStoreLogic.get_value`, retrieving the value from `ValueStoreExecutor`'s context. Consequently, both `get_value` and `get_value_local` return the same value as they access the same storage slot.

## Calling Classes using Low-Level Calls (`library_call_syscall`)

An alternative to dispatchers is using the `library_call_syscall` directly, which offers more control over serialization, deserialization, and error handling.

The following example demonstrates calling the `set_value` function of a `ValueStore` contract using `library_call_syscall`:

```cairo,noplayground
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

Data Serialization for Starknet

Cairo Data Serialization Fundamentals

# Cairo Data Serialization Fundamentals

Serialization is the process of converting data structures into a format that can be easily stored or transmitted. In Cairo, this is primarily handled by the `Serde` trait.

## Serialization and Deserialization with `Serde`

The `Serde` trait allows for the conversion of Cairo data structures into an array of `felt252` (serialization) and back from an array of `felt252` (deserialization).

For a struct to be serialized, it must derive both `Serde` and `Drop`.

**Serialization Example:**

```cairo
#[derive(Serde, Drop)]
struct A {
    item_one: felt252,
    item_two: felt252,
}

#[executable]
fn main() {
    let first_struct = A { item_one: 2, item_two: 99 };
    let mut output_array = array![];
    first_struct.serialize(ref output_array);
    panic(output_array);
}
```

Running this example outputs `[2, 99 ('c'), ]`, showing the struct serialized into an array.

**Deserialization Example:**

```cairo
#[derive(Serde, Drop)]
struct A {
    item_one: felt252,
    item_two: felt252,
}

#[executable]
fn main() {
    let first_struct = A { item_one: 2, item_two: 99 };
    let mut output_array = array![];
    first_struct.serialize(ref output_array);
    let mut span_array = output_array.span();
    let deserialized_struct: A = Serde::<A>::deserialize(ref span_array).unwrap();
}
```

## Serialization in Starknet Interactions

When interacting with other contracts, such as using `library_call_syscall`, arguments must be serialized into a `Span<felt252>`. The `Serde` trait is used for this serialization. The results of such calls are also serialized values that need to be deserialized.

## Cairo VM Data Representation

The Cairo VM fundamentally operates with `felt252` (252-bit field elements).

- Data types that fit within 252 bits are represented by a single `felt252`.
- Data types larger than 252 bits are represented by a list of `felt252`.

Therefore, to correctly formulate transaction calldata, especially for arguments larger than 252 bits, one must understand how to serialize them into lists of `felt252`.

Starknet Serialization and Syscalls

# Starknet Serialization and Syscalls

No content available for this section.

Serialization of Primitive and Composite Types

# Serialization of Primitive and Composite Types

## Data Types Using At Most 252 Bits

The following Cairo data types are serialized as a single-member list containing one `felt252` value:

- `ContractAddress`
- `EthAddress`
- `StorageAddress`
- `ClassHash`
- Unsigned integers: `u8`, `u16`, `u32`, `u64`, `u128`, `usize`
- `bytes31`
- `felt252`
- Signed integers: `i8`, `i16`, `i32`, `i64`, `i128`
  - Negative values (`-x`) are serialized as `P-x`, where `P = 2^{251} + 17*2^{192} + 1`.

## Data Types Using More Than 252 Bits

These types have non-trivial serialization:

- Unsigned integers larger than 252 bits: `u256`, `u512`
- Arrays and spans
- Enums
- Structs and tuples
- Byte arrays (strings)

### Serialization of `u256`

A `u256` value is represented by two `felt252` values:

- The first `felt252` is the 128 least significant bits (low part).
- The second `felt252` is the 128 most significant bits (high part).

Examples:

- `u256(2)` serializes to `[2,0]`.
- `u256(2^{128})` serializes to `[0,1]`.
- `u256(2^{129} + 2^{128} + 20)` serializes to `[20,3]`.

### Serialization of `u512`

A `u512` value is a struct containing four `felt252` members, each representing a 128-bit limb.

### Serialization of Arrays and Spans

Arrays and spans are serialized as `<array/span_length>, <first_serialized_member>,..., <last_serialized_member>`.

Example for `array![10, 20, u256(2^{128})]`:

`[3, 10, 0, 20, 0, 0, 1]`

### Serialization of Enums

Enums are serialized as `<index_of_enum_variant>,<serialized_variant>`.

**Example 1:**

```cairo
enum Week {
    Sunday: (),
    Monday: u256,
}
```

- `Week::Sunday` serializes to `[0]`.
- `Week::Monday(5)` serializes to `[1, 5, 0]`.

**Example 2:**

```cairo
enum MessageType {
    A,
    #[default]
    B: u128,
    C
}
```

- `MessageType::A` serializes to `[0]`.
- `MessageType::B(6)` serializes to `[1, 6]`.
- `MessageType::C` serializes to `[2]`.

### Serialization of Structs and Tuples

Structs and tuples are serialized by serializing their members sequentially in the order they appear in their definition.

Example for `MyStruct { a: u256, b: felt252, c: Array<felt252> }`:

```cairo
struct MyStruct {
    a: u256,
    b: felt252,
    c: Array<felt252>
}
```

For `MyStruct { a: 2, b: 5, c: [1,2,3] }`, the serialization is `[2, 0, 5, 3, 1, 2, 3]`.

### Serialization of Byte Arrays

A byte array (string) consists of:

- `data: Array<felt252>`: Contains 31-byte chunks.
- `pending_word: felt252`: Remaining bytes (at most 30).
- `pending_word_len: usize`: Number of bytes in `pending_word`.

**Example 1: String "hello" (5 bytes)**

Serialization: `[0, 0x68656c6c6f, 5]`

Simplifying Serialization with Starknet Tools

No content is available for this section.

Optimizing Storage and Bitwise Operations

# Optimizing Storage and Bitwise Operations

Optimizing storage usage in Cairo smart contracts is crucial for reducing gas costs, as storage updates are a significant contributor to transaction expenses. By packing multiple values into fewer storage slots, developers can decrease the gas cost for users.

## Optimizing Storage Costs

The core principle of storage optimization is **bit-packing**: using the minimum number of bits necessary to store data. This is particularly important in smart contracts where storage is expensive. Packing multiple variables into fewer storage slots directly reduces the gas cost associated with storage updates.

## Integer Structure and Bitwise Operators

An integer is represented by a specific number of bits (e.g., a `u8` uses 8 bits). Multiple integers can be combined into a larger integer type if the larger type's bit size is sufficient to hold the sum of the smaller integers' bit sizes (e.g., two `u8`s and one `u16` can fit into a `u32`).

This packing and unpacking process relies on bitwise operators:

- **Shifting:** Multiplying or dividing an integer by a power of 2 shifts its binary representation to the left or right, respectively.
- **Masking (AND operator):** Applying a mask isolates specific bits within an integer.
- **Combining (OR operator):** Adding two integers using the bitwise OR operator merges their bit patterns.

These operators allow for the efficient packing of multiple smaller data types into a larger one and the subsequent unpacking of the packed data.

## Bit-packing in Cairo

Starknet's contract storage is a map with 2<sup>251</sup> slots, each initialized to 0 and storing a `felt252`. To minimize gas costs, variables should be packed to occupy fewer storage slots.

For example, a `Sizes` struct containing a `u8`, a `u32`, and a `u64` (totaling 104 bits) can be packed into a single `u128` (128 bits), which is less than a full storage slot.

```cairo,noplayground
struct Sizes {
    tiny: u8,
    small: u32,
    medium: u64,
}
```

### Packing and Unpacking Example

To pack these variables into a `u128`, they are successively shifted left and summed. To unpack, they are successively shifted right and masked to isolate each value.

### The `StorePacking` Trait

Cairo provides the `StorePacking<T, PackedT>` trait to manage the packing and unpacking of struct fields into fewer storage slots. `T` is the type to be packed, and `PackedT` is the destination type. The trait requires implementing `pack` and `unpack` functions.

Here's an implementation for the `Sizes` struct:

```cairo,noplayground
use starknet::storage_access::StorePacking;

#[derive(Drop, Serde)]
struct Sizes {
    tiny: u8,
    small: u32,
    medium: u64,
}

const TWO_POW_8: u128 = 0x100;
const TWO_POW_40: u128 = 0x10000000000;

const MASK_8: u128 = 0xff;
const MASK_32: u128 = 0xffffffff;

impl SizesStorePacking of StorePacking<Sizes, u128> {
    fn pack(value: Sizes) -> u128 {
        value.tiny.into() + (value.small.into() * TWO_POW_8) + (value.medium.into() * TWO_POW_40)
    }

    fn unpack(value: u128) -> Sizes {
        let tiny = value & MASK_8;
        let small = (value / TWO_POW_8) & MASK_32;
        let medium = (value / TWO_POW_40);

        Sizes {
            tiny: tiny.try_into().unwrap(),
            small: small.try_into().unwrap(),
            medium: medium.try_into().unwrap(),
        }
    }
}

#[starknet::contract]
mod SizeFactory {
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use super::Sizes;
    use super::SizesStorePacking; //don't forget to import it!

    #[storage]
    struct Storage {
        remaining_sizes: Sizes,
    }

    #[abi(embed_v0)]
    fn update_sizes(ref self: ContractState, sizes: Sizes) {
        // This will automatically pack the
        // struct into a single u128
        self.remaining_sizes.write(sizes);
    }


    #[abi(embed_v0)]
    fn get_sizes(ref self: ContractState) -> Sizes {
        // this will automatically unpack the
        // packed-representation into the Sizes struct
        self.remaining_sizes.read()
    }
}
```

The `StorePacking` trait, when implemented and used with storage `read` and `write` operations, automatically handles the packing and unpacking of the struct's data.

Cairo Components

Introduction to Cairo Components

# Introduction to Cairo Components

Cairo Components are modular add-ons that encapsulate reusable functionality, allowing developers to incorporate specific features into their contracts without reimplementing common logic. This approach separates core contract logic from additional functionalities, making development less painful and bug-prone.

Defining and Implementing Cairo Components

# Defining and Implementing Cairo Components

Components in Cairo are modular pieces of logic, storage, and events that can be reused across multiple contracts. They function like Lego blocks, allowing you to extend a contract's functionality without duplicating code. A component is a separate module that cannot be deployed independently; its logic becomes part of the contract it's embedded into.

## What's in a Component?

A component is similar to a contract and can contain:

- Storage variables
- Events
- External and internal functions

However, a component cannot be deployed on its own. Its code is integrated into the contract that embeds it.

## Creating Components

To create a component:

1.  **Define the component module:** Decorate a module with `#[starknet::component]`. Within this module, declare a `Storage` struct and an `Event` enum.
2.  **Define the component interface:** Declare a trait with the `#[starknet::interface]` attribute. This trait defines the signatures of functions accessible externally, enabling interaction via the dispatcher pattern.
3.  **Implement the component logic:** Use an `impl` block marked with `#[embeddable_as(name)]` for the component's external logic. This `impl` block typically implements the interface trait.

Internal functions, not meant for external access, can be defined in an `impl` block without the `#[embeddable_as]` attribute. These internal functions are usable within the embedding contract but are not part of its ABI.

Functions within these `impl` blocks expect arguments like `ref self: ComponentState<TContractState>` for state-modifying functions or `self: @ComponentState<TContractState>` for view functions. This genericity over `TContractState` allows the component to be used in any contract.

### Example: An Ownable Component

**Interface:**

```cairo,noplayground
#[starknet::interface]
trait IOwnable<TContractState> {
    fn owner(self: @TContractState) -> ContractAddress;
    fn transfer_ownership(ref self: TContractState, new_owner: ContractAddress);
    fn renounce_ownership(ref self: TContractState);
}
```

**Component Definition:**

```cairo,noplayground
#[starknet::component]
pub mod ownable_component {
    use core::num::traits::Zero;
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use starknet::{ContractAddress, get_caller_address};
    use super::Errors;

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

    #[embeddable_as(Ownable)]
    impl OwnableImpl<TContractState, +HasComponent<TContractState>> of super::IOwnable<ComponentState<TContractState>> {
        fn owner(self: @ComponentState<TContractState>) -> ContractAddress {
            self.owner.read()
        }

        fn transfer_ownership(
            ref self: ComponentState<TContractState>, new_owner: ContractAddress,
        ) {
            assert(!new_owner.is_zero(), Errors::ZERO_ADDRESS_OWNER);
            self.assert_only_owner();
            self._transfer_ownership(new_owner);
        }

        fn renounce_ownership(ref self: ComponentState<TContractState>) {
            self.assert_only_owner();
            self._transfer_ownership(Zero::zero());
        }
    }

    #[generate_trait]
    pub impl InternalImpl<TContractState, +HasComponent<TContractState>> of InternalTrait<TContractState> {
        fn initializer(ref self: ComponentState<TContractState>, owner: ContractAddress) {
            self._transfer_ownership(owner);
        }

        fn assert_only_owner(self: @ComponentState<TContractState>) {
            let owner: ContractAddress = self.owner.read();
            let caller: ContractAddress = get_caller_address();
            assert(!caller.is_zero(), Errors::ZERO_ADDRESS_CALLER);
            assert(caller == owner, Errors::NOT_OWNER);
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

## A Closer Look at the `impl` Block

The `#[embeddable_as(name)]` attribute marks an `impl` as embeddable and specifies the name used to refer to the component within a contract. The implementation is generic over `ComponentState<TContractState>`, requiring `TContractState` to implement `HasComponent<T>`. This trait, automatically generated, bridges between the contract's state (`TContractState`) and the component's state (`ComponentState<TContractState>`), enabling access to component state via `get_component` and `get_component_mut`.

The compiler generates an `#[starknet::embeddable]` impl that adapts the component's functions to use `TContractState` instead of `ComponentState<TContractState>`, making the component's interface directly callable from the contract.

Access to storage and events within a component is handled through `ComponentState<TContractState>`, using methods like `self.storage_var_name.read()` or `self.emit(...)`.

Integrating and Composing Cairo Components

# Integrating and Composing Cairo Components

Components allow for the reuse of existing logic within new contracts. They can also be composed, allowing one component to depend on another.

## Integrating a Component into a Contract

To integrate a component into your contract, follow these steps:

1.  **Declare the component:** Use the `component!()` macro, specifying the component's path, the name for its storage variable in the contract, and the name for its event variant.
    ```cairo
    component!(path: ownable_component, storage: ownable, event: OwnableEvent);
    ```
2.  **Add storage and events:** Include the component's storage and events in the contract's `Storage` and `Event` definitions. The storage variable must be annotated with `#[substorage(v0)]`.

    ```cairo
    #[storage]
    struct Storage {
        counter: u128,
        #[substorage(v0)]
        ownable: ownable_component::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        OwnableEvent: ownable_component::Event,
    }
    ```

3.  **Embed the component's logic:** Use an impl alias annotated with `#[abi(embed_v0)]` to instantiate the component's generic impl with the contract's `ContractState`. This exposes the component's functions externally.
    ```cairo
    #[abi(embed_v0)]
    impl OwnableImpl = ownable_component::Ownable<ContractState>;
    ```

Interacting with the component's functions externally is done via a dispatcher instantiated with the contract's address.

**Example of a contract integrating the `Ownable` component:**

```cairo,noplayground
#[starknet::contract]
mod OwnableCounter {
    use listing_01_ownable::component::ownable_component;
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};

    component!(path: ownable_component, storage: ownable, event: OwnableEvent);

    #[abi(embed_v0)]
    impl OwnableImpl = ownable_component::Ownable<ContractState>;

    impl OwnableInternalImpl = ownable_component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        counter: u128,
        #[substorage(v0)]
        ownable: ownable_component::Storage,
    }


    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        OwnableEvent: ownable_component::Event,
    }


    #[abi(embed_v0)]
    fn foo(ref self: ContractState) {
        self.ownable.assert_only_owner();
        self.counter.write(self.counter.read() + 1);
    }
}
```

## Stacking Components and Dependencies

Components can be composed by having one component depend on another. This is achieved by adding trait bounds to the component's `impl` block, specifying that it requires another component's `HasComponent` trait.

### Specifying Dependencies

A component can depend on another by adding a named trait bound for the dependency's `HasComponent` trait.

```cairo,noplayground
    impl OwnableCounter<
        TContractState,
        +HasComponent<TContractState>,
        +Drop<TContractState>,
        impl Owner: ownable_component::HasComponent<TContractState>, // Dependency specified here
    > of super::IOwnableCounter<ComponentState<TContractState>> {
        // ...
    }
```

This `impl Owner: ownable_component::HasComponent<TContractState>` bound ensures that the `TContractState` type has access to the `ownable_component`.

### Using Dependencies

Once a dependency is specified, its functions and state can be accessed using macros:

- `get_dep_component!(@self, DependencyName)`: For read-only access.
- `get_dep_component_mut!(@self, DependencyName)`: For mutable access.

**Example of a component depending on `Ownable`:**

```cairo,noplayground
#[starknet::component]
mod OwnableCounterComponent {
    use listing_03_component_dep::owner::ownable_component;
    use listing_03_component_dep::owner::ownable_component::InternalImpl;
    use starknet::ContractAddress;
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};

    #[storage]
    pub struct Storage {
        value: u32,
    }

    #[embeddable_as(OwnableCounterImpl)]
    impl OwnableCounter<
        TContractState,
        +HasComponent<TContractState>,
        +Drop<TContractState>,
        impl Owner: ownable_component::HasComponent<TContractState>,
    > of super::IOwnableCounter<ComponentState<TContractState>> {
        fn get_counter(self: @ComponentState<TContractState>) -> u32 {
            self.value.read()
        }

        fn increment(ref self: ComponentState<TContractState>) {
            let ownable_comp = get_dep_component!(@self, Owner); // Accessing dependency
            ownable_comp.assert_only_owner();
            self.value.write(self.value.read() + 1);
        }

        fn transfer_ownership(
            ref self: ComponentState<TContractState>, new_owner: ContractAddress,
        ) {
            // Direct call to dependency's function
            self.transfer_ownership(new_owner);
        }
    }
}
```

## Key Takeaways

- **Embeddable Impls:** Allow injecting component logic into contracts, modifying ABIs and adding entry points.
- **`component!()` Macro:** Simplifies component integration by declaring its path, storage, and event names.
- **`HasComponent` Trait:** Automatically generated by the compiler when a component is used, bridging the contract's state and the component's state.
- **Impl Aliases:** Used to instantiate generic component impls with a contract's concrete `ContractState`.
- **Component Dependencies:** Achieved via trait bounds on `impl` blocks, enabling composition by allowing components to leverage functionality from other components using `get_dep_component!` or `get_dep_component_mut!`.

Cairo Circuits and Gate Operations

# Cairo Circuits and Gate Operations

## Evaluating a Circuit

The evaluation of a circuit involves passing input signals through each gate to obtain output values. This can be done using the `eval` function with a specified modulus.

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
    let res = instance.eval(bn254_modulus).unwrap();
#
#     let add_output = res.get_output(add);
#     let circuit_output = res.get_output(mul);
#
#     assert(add_output == u384 { limb0: 30, limb1: 0, limb2: 0, limb3: 0 }, 'add_output');
#     assert(circuit_output == u384 { limb0: 300, limb1: 0, limb2: 0, limb3: 0 }, 'circuit_output');
#
#     (add_output, circuit_output)
# }
#
# #[executable]
# fn main() {
#     eval_circuit();
# }
```

## Retrieving Gate Outputs

The value of any specific output or intermediate gate can be retrieved from the evaluation results using the `get_output` function, passing the `CircuitElement` instance of the desired gate.

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
    let add_output = res.get_output(add);
    let circuit_output = res.get_output(mul);

    assert(add_output == u384 { limb0: 30, limb1: 0, limb2: 0, limb3: 0 }, 'add_output');
    assert(circuit_output == u384 { limb0: 300, limb1: 0, limb2: 0, limb3: 0 }, 'circuit_output');
#
#     (add_output, circuit_output)
# }
#
# #[executable]
# fn main() {
#     eval_circuit();
# }
```

Cairo Procedural Macros

# Cairo Procedural Macros

Testing Cairo Components

Testing Cairo Components

# Testing Components

Testing components differs from testing contracts because components cannot be deployed independently and lack a `ContractState` object. To test them, you can integrate them into a mock contract or directly invoke their methods using a concrete `ComponentState` object.

## Testing the Component by Deploying a Mock Contract

The most straightforward way to test a component is by embedding it within a mock contract solely for testing purposes. This allows you to test the component within a contract's context and use a Dispatcher to interact with its entry points.

First, define the component. For example, a `CounterComponent`:

```cairo, noplayground
#[starknet::component]
pub mod CounterComponent {
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};

    #[storage]
    pub struct Storage {
        value: u32,
    }

    #[embeddable_as(CounterImpl)]
    impl Counter<
        TContractState, +HasComponent<TContractState>,
    > of super::ICounter<ComponentState<TContractState>> {
        fn get_counter(self: @ComponentState<TContractState>) -> u32 {
            self.value.read()
        }

        fn increment(ref self: ComponentState<TContractState>) {
            self.value.write(self.value.read() + 1);
        }
    }
}
```

Next, create a mock contract that embeds this component:

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

Define an interface for interacting with the mock contract:

```cairo, noplayground
#[starknet::interface]
pub trait ICounter<TContractState> {
    fn get_counter(self: @TContractState) -> u32;
    fn increment(ref self: TContractState);
}
```

Finally, write tests by deploying the mock contract and calling its entry points:

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

Components utilize genericity, allowing their logic and storage to be embedded in multiple contracts. When a contract embeds a component, a `HasComponent` trait is generated, making the component's methods accessible. By providing a concrete `TContractState` that implements `HasComponent` to the `ComponentState` struct, you can invoke component methods directly on this object without deploying a mock contract.

To achieve this, first define a type alias for a concrete `ComponentState` implementation. Using the `MockContract::ContractState` type from the previous example:

```caskell
type TestingState = CounterComponent::ComponentState<MockContract::ContractState>;

// You can derive even `Default` on this type alias
impl TestingStateDefault of Default<TestingState> {
    fn default() -> TestingState {
        CounterComponent::component_state_for_testing()
    }
}
```

This `TestingState` type alias represents a concrete instance of `ComponentState`. Since `MockContract` embeds `CounterComponent`, the methods defined in `CounterImpl` are now usable on a `TestingState` object.

Instantiate a `TestingState` object using `component_state_for_testing()`:

```cairo, noplayground
# use CounterComponent::CounterImpl;
# use super::MockContract;
# use super::counter::CounterComponent;
#
# type TestingState = CounterComponent::ComponentState<MockContract::ContractState>;
#
# // You can derive even `Default` on this type alias
# impl TestingStateDefault of Default<TestingState> {
#     fn default() -> TestingState {
#         CounterComponent::component_state_for_testing()
#     }
# }
#
#[test]
fn test_increment() {
    let mut counter: TestingState = Default::default();

    counter.increment();
    counter.increment();

    assert_eq!(counter.get_counter(), 2);
}
```

This method is more lightweight and allows testing internal component functions not trivially exposed externally.

Performance Testing and Analysis

# Performance Testing and Analysis

To analyze performance profiles, run `go tool pprof -http=":8000" path/to/profile/output.pb.gz`. This command starts a web server for analysis.

Consider the following `sum_n` function and its test case:

```cairo, noplayground
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

After generating the trace file and profile output, `go tool pprof` provides useful information:

- **Function Calls**: The test includes one function call, representing the test function itself. Multiple calls to `sum_n` within the test function still count as one call because `snforge` simulates a contract call.

- **Cairo Steps**: The execution of the `sum_n` function uses 256 Cairo steps.
  <div align="center">
      <img src="pprof-steps.png" alt="pprof number of steps" width="800px"/>
  </div>

Additional information such as memory holes and builtins usage is also available. The Cairo Profiler is under active development with plans for more features.

Circuit Input Management

# Circuit Input Management

After defining a circuit and its outputs, the next step is to assign values to each input. In Cairo, circuits operate with a 384-bit modulus, meaning a single `u384` value is represented as a fixed array of four `u96` values.

## Assigning Input Values

The `new_inputs` and `next` functions are used to manage circuit inputs. These functions return a variant of the `AddInputResult` enum, which indicates whether all inputs have been filled or if more are needed.

```cairo, noplayground
pub enum AddInputResult<C> {
    /// All inputs have been filled.
    Done: CircuitData<C>,
    /// More inputs are needed to fill the circuit instance's data.
    More: CircuitInputAccumulator<C>,
}
```

The following example demonstrates initializing inputs `a` and `b` to 10 and 20, respectively, within a circuit that calculates `a * (a + b)`:

```cairo, noplayground
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

    assert(add_output == u384 { limb0: 30, limb1: 0, limb2: 0, limb3: 0 }, 'add_output');
    assert(circuit_output == u384 { limb0: 300, limb1: 0, limb2: 0, limb3: 0 }, 'circuit_output');

    (add_output, circuit_output)
}

#[executable]
fn main() {
    eval_circuit();
}
```

Contract Upgradeability

# Contract Upgradeability

Starknet offers native contract upgradeability through a syscall that updates the contract's source code, eliminating the need for proxy patterns.

## How Upgradeability Works in Starknet

Understanding Starknet's upgradeability requires differentiating between a contract and its contract class.

- **Contract Classes:** Represent the source code of a program. They are identified by a class hash. Multiple contracts can be instances of the same class. A class must be declared before a contract instance of that class can be deployed.
- **Contract Instances:** Deployed contracts that are associated with a specific class hash and have their own storage.

## Replacing Contract Classes

### The `replace_class_syscall`

The `replace_class` syscall enables a deployed contract to update its associated class hash. To implement this, an entry point in the contract should execute the `replace_class_syscall` with the new class hash.

```cairo,noplayground
use core::num::traits::Zero;
use starknet::{ClassHash, syscalls};

fn upgrade(new_class_hash: ClassHash) {
    assert!(!new_class_hash.is_zero(), 'Class hash cannot be zero');
    syscalls::replace_class_syscall(new_class_hash).unwrap();
}
```

<span class="caption">Listing 17-3: Exposing `replace_class_syscall` to update the contract's class</span>

If a contract is deployed without this explicit mechanism, its class hash can still be replaced using `library_call`.

### OpenZeppelin's Upgradeable Component

OpenZeppelin Contracts for Cairo provides the `Upgradeable` component, which can be integrated into a contract to facilitate upgradeability. This component relies on an audited library for a secure upgrade process.

**Usage Example:**

To restrict who can upgrade a contract, access control mechanisms like OpenZeppelin's `Ownable` component are commonly used. The following example integrates `UpgradeableComponent` with `OwnableComponent` to allow only the contract owner to perform upgrades.

```cairo,noplayground
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

<span class="caption">Listing 17-4 Integrating OpenZeppelin's Upgradeable component in a contract</span>

The `UpgradeableComponent` offers:

- An internal `upgrade` function for safe class replacement.
- An `Upgraded` event emitted upon successful upgrade.
- Protection against upgrading to a zero class hash.

## Security Considerations

Upgrades are critical operations requiring careful security review:

- **API Changes:** Modifications to function signatures (e.g., arguments) can break integrations with other contracts or off-chain systems.
- **Storage Changes:** Altering storage variable names, types, or organization can lead to data loss or corruption. Ensure storage slots are managed carefully (e.g., by prepending component names to variables).
- **Storage Collisions:** Avoid reusing storage slots, especially when integrating multiple components.
- **Backward Compatibility:** Verify backward compatibility when upgrading between different versions of OpenZeppelin Contracts.

L1-L2 Messaging

Understanding L1-L2 Messaging in StarkNet

# Understanding L1-L2 Messaging in StarkNet

StarkNet features a distinct L1-L2 messaging system, separate from its consensus and state update mechanisms. This system enables smart contracts on L1 to interact with L2 contracts, and vice versa, facilitating cross-chain transactions. For instance, computations performed on one chain can be utilized on the other.

## Use Cases

Bridges on StarkNet heavily rely on L1-L2 messaging. Depositing tokens into an L1 bridge contract automatically triggers the minting of the same token on L2. DeFi pooling is another significant application.

## Key Characteristics

StarkNet's messaging system is characterized by being:

- **Asynchronous**: Contracts cannot await message results from the other chain during their execution.
- **Asymmetric**:
  - **L1 to L2**: The StarkNet sequencer automatically delivers messages to the target L2 contract.
  - **L2 to L1**: Only the message hash is sent to L1 by the sequencer. Manual consumption via an L1 transaction is required.

## The StarknetMessaging Contract

The StarknetMessaging contract is central to this system.

L1 to L2 Communication Flow

# L1 to L2 Communication Flow

The `StarknetCore` contract on Ethereum, specifically its `StarknetMessaging` component, facilitates communication between L1 and L2. The `StarknetMessaging` contract adheres to the `IStarknetMessaging` interface, which defines functions for sending messages to L2, consuming messages from L2 on L1, and managing message cancellations.

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

## Sending Messages from Ethereum to Starknet

To send messages from Ethereum (L1) to Starknet (L2), your Solidity contracts must invoke the `sendMessageToL2` function of the `StarknetMessaging` contract. This involves specifying the target L2 contract address, the function selector (which must be annotated with `#[l1_handler]` on L2), and the message payload as an array of `uint256` (representing `felt252`).

A minimum of 20,000 wei must be sent with the transaction to cover the cost of registering the message hash on Ethereum. Additionally, sufficient fees must be paid for the `L1HandlerTransaction` executed by the Starknet sequencer to process the message on L2.

The sequencer monitors logs from the `StarknetMessaging` contract. Upon detecting a message, it constructs and executes an `L1HandlerTransaction` to call the specified function on the target L2 contract. This process typically takes 1-2 minutes.

### Example: Sending a Single Felt

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

### Receiving Messages on Starknet

On the Starknet side, functions intended to receive L1 messages must be marked with the `#[l1_handler]` attribute. The payload data is automatically deserialized into the appropriate Cairo types.

```cairo
    #[l1_handler]
    fn msg_handler_felt(ref self: ContractState, from_address: felt252, my_felt: felt252) {
        assert(from_address == self.allowed_message_sender.read(), 'Invalid message sender');

        // You can now use the data, automatically deserialized from the message payload.
        assert(my_felt == 123, 'Invalid value');
    }
```

L2 to L1 Communication Flow

# L2 to L1 Communication Flow

When sending messages from Starknet (L2) to Ethereum (L1), the `send_message_to_l1_syscall` is used in Cairo contracts. This syscall includes the message parameters in the proof's output, making them accessible to the `StarknetCore` contract on L1 once the state update is processed.

## Sending Messages from Starknet

The `send_message_to_l1_syscall` function has the following signature:

```cairo,noplayground
pub extern fn send_message_to_l1_syscall(
    to_address: felt252, payload: Span<felt252>,
) -> SyscallResult<()> implicits(GasBuiltin, System) nopanic;
```

It takes the recipient's L1 address (`to_address`) and the message payload (`payload`) as arguments.

**Example:**

```cairo,noplayground
let payload = ArrayTrait::new();
payload.append(1);
payload.append(2);
send_message_to_l1_syscall(payload.span(), 3423542542364363).unwrap_syscall();
```

## Consuming Messages on L1

Messages sent from L2 to L1 must be consumed manually on L1. This involves a Solidity contract calling the `consumeMessageFromL2` function of the `StarknetMessaging` contract. The L2 contract address (which is the `to_address` used in the L2 syscall) and the payload must be passed to this function.

The `consumeMessageFromL2` function verifies the message integrity. The `StarknetCore` contract uses `msg.sender` to compute the message hash, which must match the `to_address` provided during the L2 `send_message_to_l1_syscall`.

**Example of consuming a message in Solidity:**

```js
function consumeMessageFelt(
    uint256 fromAddress,
    uint256[] calldata payload
)
    external
{
    let messageHash = _snMessaging.consumeMessageFromL2(fromAddress, payload);

    // We expect the payload to contain only a felt252 value (which is a uint256 in Solidity).
    require(payload.length == 1, "Invalid payload");

    uint256 my_felt = payload[0];

    // From here, you can safely use `my_felt` as the message has been verified by StarknetMessaging.
    require(my_felt > 0, "Invalid value");
}
```

Message Data and External Integration

# Message Data and External Integration

## Message Serialization

Cairo contracts process serialized data exclusively as arrays of `felt252`. Since `felt252` is slightly smaller than Solidity's `uint256`, values exceeding the `felt252` maximum limit will result in stuck messages.

A `uint256` in Cairo is represented by a struct containing two `u128` fields: `low` and `high`. Consequently, a single `uint256` value must be serialized into two `felt252` values.

```cairo,does_not_compile
struct u256 {
    low: u128,
    high: u128,
}
```

For example, to send the value 1 as a `uint256` to Cairo (where `low = 1` and `high = 0`), the payload from L1 would include two values:

```js
uint256[] memory payload = new uint256[](2);
// Let's send the value 1 as a u256 in cairo: low = 1, high = 0.
payload[0] = 1;
payload[1] = 0;
```

For further details on the messaging mechanism, refer to the [Starknet documentation][starknet messaging doc] and the [detailed guide here][glihm messaging guide].

## Price Feeds

Price feeds, powered by oracles, integrate real-world pricing data into the blockchain. This data is aggregated from multiple trusted external sources, such as cryptocurrency exchanges and financial data providers.

This section will use Pragma Oracle to demonstrate reading the `ETH/USD` price feed and showcase a mini-application utilizing this data.

[starknet messaging doc]: https://docs.starknet.io/documentation/architecture_and_concepts/Network_Architecture/messaging-mechanism/
[glihm messaging guide]: https://github.com/glihm/starknet-messaging-dev

Oracles and Randomness

Oracle Integration for Price Feeds

# Oracle Integration for Price Feeds

[Pragma Oracle](https://www.pragma.build/) is a zero-knowledge oracle that provides verifiable off-chain data on the Starknet blockchain.

## Setting Up Your Contract for Price Feeds

### Add Pragma as a Project Dependency

To integrate Pragma into your Cairo smart contract, add the following to your project's `Scarb.toml` file:

```toml
[dependencies]
pragma_lib = { git = "https://github.com/astraly-labs/pragma-lib" }
```

### Creating a Price Feed Contract

Define a contract interface that includes the necessary Pragma price feed entry point. The `get_asset_price` function is crucial for interacting with the Pragma oracle.

```cairo,noplayground
#[starknet::interface]
pub trait IPriceFeedExample<TContractState> {
    fn buy_item(ref self: TContractState);
    fn get_asset_price(self: @TContractState, asset_id: felt252) -> u128;
}
```

### Import Pragma Dependencies

Include the following imports in your contract module:

```cairo,noplayground
use pragma_lib::abi::{IPragmaABIDispatcher, IPragmaABIDispatcherTrait};
use pragma_lib::types::{DataType, PragmaPricesResponse};
use starknet::contract_address::contract_address_const;
use starknet::get_caller_address;
use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
use super::{ContractAddress, IPriceFeedExample};

const ETH_USD: felt252 = 19514442401534788;
const EIGHT_DECIMAL_FACTOR: u256 = 100000000;
```

### Required Price Feed Function Implementation

The `get_asset_price` function retrieves the asset's price from Pragma Oracle. It calls `get_data_median` with `DataType::SpotEntry(asset_id)` and returns the price.

```cairo,noplayground
fn get_asset_price(self: @ContractState, asset_id: felt252) -> u128 {
    // Retrieve the oracle dispatcher
    let oracle_dispatcher = IPragmaABIDispatcher {
        contract_address: self.pragma_contract.read(),
    };

    // Call the Oracle contract, for a spot entry
    let output: PragmaPricesResponse = oracle_dispatcher
        .get_data_median(DataType::SpotEntry(asset_id));

    return output.price;
}
```

## Example Application Using Pragma Price Feed

The following contract demonstrates how to use the Pragma oracle to fetch the ETH/USD price and use it in a transaction.

```cairo,noplayground
#[starknet::contract]
mod PriceFeedExample {
    use openzeppelin::token::erc20::interface::{ERC20ABIDispatcher, ERC20ABIDispatcherTrait};
    use pragma_lib::abi::{IPragmaABIDispatcher, IPragmaABIDispatcherTrait};
    use pragma_lib::types::{DataType, PragmaPricesResponse};
    use starknet::contract_address::contract_address_const;
    use starknet::get_caller_address;
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use super::{ContractAddress, IPriceFeedExample};

    const ETH_USD: felt252 = 19514442401534788;
    const EIGHT_DECIMAL_FACTOR: u256 = 100000000;

    #[storage]
    struct Storage {
        pragma_contract: ContractAddress,
        product_price_in_usd: u256,
    }

    #[constructor]
    fn constructor(ref self: ContractState, pragma_contract: ContractAddress) {
        self.pragma_contract.write(pragma_contract);
        self.product_price_in_usd.write(100);
    }

    #[abi(embed_v0)]
    impl PriceFeedExampleImpl of IPriceFeedExample<ContractState> {
        fn buy_item(ref self: ContractState) {
            let caller_address = get_caller_address();
            let eth_price = self.get_asset_price(ETH_USD).into();
            let product_price = self.product_price_in_usd.read();

            // Calculate the amount of ETH needed
            let eth_needed = product_price * EIGHT_DECIMAL_FACTOR / eth_price;

            let eth_dispatcher = ERC20ABIDispatcher {
                contract_address: contract_address_const::<
                    0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7,
                >() // ETH Contract Address
            };

            // Transfer the ETH to the caller
            eth_dispatcher
                .transfer_from(
                    caller_address,
                    contract_address_const::<
                        0x0237726d12d3c7581156e141c1b132f2db9acf788296a0e6e4e9d0ef27d092a2,
                    >(),
                    eth_needed,
                );
        }

        fn get_asset_price(self: @ContractState, asset_id: felt252) -> u128 {
            // Retrieve the oracle dispatcher
            let oracle_dispatcher = IPragmaABIDispatcher {
                contract_address: self.pragma_contract.read(),
            };

            // Call the Oracle contract, for a spot entry
            let output: PragmaPricesResponse = oracle_dispatcher
                .get_data_median(DataType::SpotEntry(asset_id));

            return output.price;
        }
    }
}
```

Verifiable Randomness with Oracles

# Verifiable Randomness with Oracles

Generating truly unpredictable randomness on-chain is challenging due to the deterministic nature of blockchains. Verifiable Random Functions (VRFs) provided by oracles offer a solution, guaranteeing that randomness cannot be predicted or tampered with, which is crucial for applications like gaming and NFTs.

## Overview on VRFs

VRFs use a secret key and a nonce to generate an output that appears random. While technically pseudo-random, it's practically impossible to predict without the secret key. VRFs also produce a proof that allows anyone to verify the correctness of the generated random number.

## Generating Randomness with Pragma

[Pragma](https://www.pragma.build/), an oracle on Starknet, provides a solution for generating random numbers using VRFs.

### Add Pragma as a Dependency

To use Pragma, add it to your `Scarb.toml` file:

```toml
[dependencies]
pragma_lib = { git = "https://github.com/astraly-labs/pragma-lib" }
```

### Define the Contract Interface

The following interfaces are used for Pragma VRF and a simple dice game:

```cairo,noplayground
use starknet::ContractAddress;

#[starknet::interface]
pub trait IPragmaVRF<TContractState> {
    fn get_last_random_number(self: @TContractState) -> felt252;
    fn request_randomness_from_pragma(
        ref self: TContractState,
        seed: u64,
        callback_address: ContractAddress,
        callback_fee_limit: u128,
        publish_delay: u64,
        num_words: u64,
        calldata: Array<felt252>,
    );
    fn receive_random_words(
        ref self: TContractState,
        requester_address: ContractAddress,
        request_id: u64,
        random_words: Span<felt252>,
        calldata: Array<felt252>,
    );
    fn withdraw_extra_fee_fund(ref self: TContractState, receiver: ContractAddress);
}

#[starknet::interface]
pub trait IDiceGame<TContractState> {
    fn guess(ref self: TContractState, guess: u8);
    fn toggle_play_window(ref self: TContractState);
    fn get_game_window(self: @TContractState) -> bool;
    fn process_game_winners(ref self: TContractState);
}
```

### Description of Key `IPragmaVRF` Entrypoints and Their Inputs

The `request_randomness_from_pragma` function initiates a request for verifiable randomness. It emits an event that triggers off-chain actions: randomness generation and on-chain submission via the `receive_random_words` callback.

#### `request_randomness_from_pragma` Inputs:

- `seed`: A unique value to initialize randomness generation.
- `callback_address`: The contract address for the `receive_random_words` callback.
- `callback_fee_limit`: Maximum gas for the callback execution.
- `publish_delay`: Minimum delay (in blocks) before fulfilling the request.
- `num_words`: The number of random values to receive.
- `calldata`: Additional data for the callback.

#### `receive_random_words` Inputs:

- `requester_address`: The contract address that requested randomness.
- `request_id`: A unique identifier for the request.
- `random_words`: An array of generated random values.
- `calldata`: Data passed with the initial request.

### Dice Game Contract

A simple dice game contract example utilizes Pragma VRF.

#### NB: Fund Your Contract After Deployment to Utilize Pragma VRF

After deploying your contract, ensure it has sufficient ETH to cover the costs of generating random numbers and executing the callback function. For more details, refer to the [Pragma docs](https://docs.pragma.build/Resources/Starknet/randomness/randomness).

Oracles and Contract Funding

# Oracles and Contract Funding

Starknet Development Tools

# Starknet Development Tools

This section covers useful development tools provided by the Cairo project and Starknet ecosystem.

## Compiler Diagnostics

The Cairo compiler provides helpful diagnostics for common errors:

- **`Plugin diagnostic: name is not a substorage member in the contract's Storage. Consider adding to Storage:`**: This error indicates that a component's storage was not added to the contract's storage. To fix this, add the path to the component's storage, annotated with `#[substorage(v0)]`, to your contract's storage.
- **`Plugin diagnostic: name is not a nested event in the contract's Event enum. Consider adding to the Event enum:`**: Similar to the storage error, this means a component's events were not added to the contract's events. Ensure the path to the component's events is included in your contract's events.

## Automatic Formatting with `scarb fmt`

Scarb projects can be automatically formatted using the `scarb fmt` command. For direct Cairo binary usage, `cairo-format` can be used. This tool is often used in collaborative projects to maintain a consistent code style.

To format a Cairo project, navigate to the project directory and run:

```bash
scarb fmt
```

To exclude specific code sections from formatting, use the `#[cairofmt::skip]` attribute:

```cairo, noplayground
#[cairofmt::skip]
let table: Array<ByteArray> = array![
    "oxo",
    "xox",
    "oxo",
];
```

## IDE Integration Using `cairo-language-server`

The `cairo-language-server` is recommended for integrating Cairo with Integrated Development Environments (IDEs). It implements the Language Server Protocol (LSP), enabling communication between IDEs and programming languages. This server powers features like autocompletion, jump-to-definition, and inline error display in IDEs such as Visual Studio Code (via the `vscode-cairo` extension).

If you have Scarb installed, the Cairo VSCode extension should work out-of-the-box without manual installation of the language server.

## Local Starknet Node with `katana`

`katana` is a tool that starts a local Starknet node with predeployed accounts. These accounts can be used for deploying and interacting with contracts.

```bash
# Example command to start katana (specific command may vary)
# katana [options]
```

The output of `katana` typically lists prefunded accounts with their addresses, private keys, and public keys. Before interacting with contracts, voter accounts need to be registered and funded. For detailed information on account operations and Account Abstraction, refer to the Starknet documentation.

## Interacting with Starknet using `starkli`

`starkli` is a command-line tool for interacting with Starknet. Ensure your `starkli` version matches the required version (e.g., `0.3.6`). You can upgrade `starkli` using `starkliup`.

### Smart Wallets

You can retrieve the smart wallet class hash using:

```bash
starkli class-hash-at <SMART_WALLET_ADDRESS> --rpc http://0.0.0.0:5050
```

### Contract Deployment

Before deploying, contracts must be declared using `starkli declare`:

```bash
starkli declare target/dev/listing_99_12_vote_contract_Vote.contract_class.json --rpc http://0.0.0.0:5050 --account katana-0
```

- The `--rpc` flag specifies the RPC endpoint (e.g., provided by `katana`).
- The `--account` flag specifies the account for signing transactions.
- If encountering `compiler-version` errors, use the `--compiler-version x.y.z` flag or upgrade `starkli`.

The class hash for a contract might look like: `0x06974677a079b7edfadcd70aa4d12aac0263a4cda379009fca125e0ab1a9ba52`. Transactions on local nodes finalize immediately, while on testnets, finality may take a few seconds.

ERC20 Token Contracts

# ERC20 Token Contracts

The ERC20 standard on Starknet provides a uniform interface for fungible tokens, ensuring predictable interactions across the ecosystem. OpenZeppelin Contracts for Cairo offers an audited implementation of this standard.

## The Basic ERC20 Contract

This contract demonstrates the core structure for creating a token with a fixed supply using OpenZeppelin's components.

```cairo,noplayground
#[starknet::contract]
pub mod BasicERC20 {
    use openzeppelin_token::erc20::{DefaultConfig, ERC20Component, ERC20HooksEmptyImpl};
    use starknet::ContractAddress;

    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    // ERC20 Mixin
    #[abi(embed_v0)]
    impl ERC20MixinImpl = ERC20Component::ERC20MixinImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc20: ERC20Component::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC20Event: ERC20Component::Event,
    }

    #[constructor]
    fn constructor(ref self: ContractState, initial_supply: u256, recipient: ContractAddress) {
        let name = "MyToken";
        let symbol = "MTK";

        self.erc20.initializer(name, symbol);
        self.erc20.mint(recipient, initial_supply);
    }
}
```

This contract embeds the `ERC20Component` for core ERC20 logic. The constructor initializes the token's name and symbol and mints the initial supply to the deployer, resulting in a fixed total supply.

### Mintable and Burnable Token

This extension adds functions to mint new tokens and burn existing ones, allowing the token supply to change after deployment. It utilizes `OwnableComponent` for access control.

```cairo,noplayground
#[starknet::contract]
pub mod MintableBurnableERC20 {
    use openzeppelin_access::ownable::OwnableComponent;
    use openzeppelin_token::erc20::{DefaultConfig, ERC20Component, ERC20HooksEmptyImpl};
    use starknet::ContractAddress;

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);
    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    // Ownable Mixin
    #[abi(embed_v0)]
    impl OwnableMixinImpl = OwnableComponent::OwnableMixinImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    // ERC20 Mixin
    #[abi(embed_v0)]
    impl ERC20MixinImpl = ERC20Component::ERC20MixinImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        #[substorage(v0)]
        erc20: ERC20Component::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        #[flat]
        ERC20Event: ERC20Component::Event,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        let name = "MintableBurnableToken";
        let symbol = "MBT";

        self.erc20.initializer(name, symbol);
        self.ownable.initializer(owner);
    }

    #[external(v0)]
    fn mint(ref self: ContractState, recipient: ContractAddress, amount: u256) {
        // Only owner can mint new tokens
        self.ownable.assert_only_owner();
        self.erc20.mint(recipient, amount);
    }

    #[external(v0)]
    fn burn(ref self: ContractState, amount: u256) {
        // Any token holder can burn their own tokens
        let caller = starknet::get_caller_address();
        self.erc20.burn(caller, amount);
    }
}
```

The `mint` function is restricted to the owner, allowing them to increase the total supply. The `burn` function enables any token holder to reduce the supply by destroying their tokens.

### Pausable Token with Access Control

This implementation adds a security model with role-based permissions and an emergency pause feature using `AccessControlComponent`, `PausableComponent`, and `SRC5Component`.

```cairo,noplayground
#[starknet::contract]
pub mod PausableERC20 {
    use openzeppelin_access::accesscontrol::AccessControlComponent;
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_security::pausable::PausableComponent;
    use openzeppelin_token::erc20::{DefaultConfig, ERC20Component};
    use starknet::ContractAddress;

    const PAUSER_ROLE: felt252 = selector!("PAUSER_ROLE");
    const MINTER_ROLE: felt252 = selector!("MINTER_ROLE");

    component!(path: AccessControlComponent, storage: accesscontrol, event: AccessControlEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);
    component!(path: PausableComponent, storage: pausable, event: PausableEvent);
    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    // AccessControl
    #[abi(embed_v0)]
    impl AccessControlImpl =
        AccessControlComponent::AccessControlImpl<ContractState>;
    impl AccessControlInternalImpl = AccessControlComponent::InternalImpl<ContractState>;

    // SRC5
    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;

    // Pausable
    #[abi(embed_v0)]
    impl PausableImpl = PausableComponent::PausableImpl<ContractState>;
    impl PausableInternalImpl = PausableComponent::InternalImpl<ContractState>;

    // ERC20
    #[abi(embed_v0)]
    impl ERC20MixinImpl = ERC20Component::ERC20MixinImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        accesscontrol: AccessControlComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
        #[substorage(v0)]
        pausable: PausableComponent::Storage,
        #[substorage(v0)]
        erc20: ERC20Component::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        AccessControlEvent: AccessControlComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
        #[flat]
        PausableEvent: PausableComponent::Event,
        #[flat]
        ERC20Event: ERC20Component::Event,
    }

    // ERC20 Hooks implementation
    impl ERC20HooksImpl of ERC20Component::ERC20HooksTrait<ContractState> {
        fn before_update (
            ref self: ERC20Component::ComponentState<ContractState>,
            from: ContractAddress,
            recipient: ContractAddress,
            amount: u256,
        ) {
            let contract_state = self.get_contract();
            // Check that the contract is not paused
            contract_state.pausable.assert_not_paused();
        }
    }

    #[constructor]
    fn constructor(ref self: ContractState, admin: ContractAddress) {
        let name = "PausableToken";
        let symbol = "PST";

        self.erc20.initializer(name, symbol);

        // Grant admin role
        self.accesscontrol.initializer();
        self.accesscontrol._grant_role(AccessControlComponent::DEFAULT_ADMIN_ROLE, admin);

        // Grant specific roles to admin
        self.accesscontrol._grant_role(PAUSER_ROLE, admin);
        self.accesscontrol._grant_role(MINTER_ROLE, admin);
    }

    #[external(v0)]
    fn pause(ref self: ContractState) {
        self.accesscontrol.assert_only_role(PAUSER_ROLE);
        self.pausable.pause();
    }

    #[external(v0)]
    fn unpause(ref self: ContractState) {
        self.accesscontrol.assert_only_role(PAUSER_ROLE);
        self.pausable.unpause();
    }

    #[external(v0)]
    fn mint(ref self: ContractState, recipient: ContractAddress, amount: u256) {
        self.accesscontrol.assert_only_role(MINTER_ROLE);
        self.erc20.mint(recipient, amount);
    }
}
```

This contract defines `PAUSER_ROLE` and `MINTER_ROLE`. The `pause` and `unpause` functions are restricted to addresses with the `PAUSER_ROLE`, while `mint` is restricted to addresses with the `MINTER_ROLE`. The `before_update` hook ensures that token transfers are blocked when the contract is paused. The constructor grants all roles to the deployer.

Smart Contract Security Best Practices

# Smart Contract Security Best Practices

Developing secure smart contracts is crucial, as errors can lead to significant asset loss or functional failures. Smart contracts operate in a public environment, making them susceptible to exploitation by malicious actors.

## Mindset

Cairo is designed to be a safe language, encouraging developers to handle all possible cases. Security vulnerabilities in Starknet often arise from the design of smart contract flows rather than language-specific issues. Adopting a security-first mindset, considering all potential scenarios, is the initial step towards writing secure code.

### Viewing Smart Contracts as Finite State Machines

Smart contracts can be conceptualized as finite state machines. Each transaction represents a state transition. The constructor defines the initial states, and external functions facilitate transitions between these states. Transactions are atomic, succeeding or failing without partial changes.

### Input Validation

The `assert!` and `panic!` macros are essential for validating conditions before executing actions. These validations can cover:

- Caller-provided inputs.
- Execution prerequisites.
- Invariants (conditions that must always hold true).
- Return values from external function calls.

For instance, `assert!` can verify sufficient funds before a withdrawal, preventing the transaction if the condition is not met.

```cairo,noplayground
    impl Contract of IContract<ContractState> {
        fn withdraw(ref self: ContractState, amount: u256) {
            let current_balance = self.balance.read();

            assert!(self.balance.read() >= amount, "Insufficient funds");

            self.balance.write(current_balance - amount);
        }
```

These checks enforce constraints, clearly defining the boundaries for state transitions and ensuring the contract operates within expected limits.

## Recommendations

### Checks-Effects-Interactions Pattern

This pattern, while primarily known for preventing reentrancy attacks on Ethereum, is also recommended for Starknet contracts. It dictates the order of operations within functions:

1.  **Checks**: Validate all conditions and inputs before any state modifications.
2.  **Effects**: Perform all internal state changes.
3.  **Interactions**: Execute external calls to other contracts last.

Testing Smart Contracts with Starknet Foundry

Introduction to Smart Contract Testing and Starknet Foundry

### Introduction to Smart Contract Testing and Starknet Foundry

#### The Need for Smart Contract Testing

Testing smart contracts is a critical part of the development process, ensuring they behave as expected and are secure. While the `scarb` command-line tool is useful for testing standalone Cairo programs and functions, it lacks the functionality required for testing smart contracts that necessitate control over the contract state and execution context. Therefore, Starknet Foundry, a smart contract development toolchain for Starknet, is introduced to address these needs.

#### Example: PizzaFactory Contract

Throughout this chapter, the `PizzaFactory` contract serves as an example to demonstrate writing tests with Starknet Foundry.

```cairo,noplayground
use starknet::ContractAddress;

#[starknet::interface]
pub trait IPizzaFactory<TContractState> {
    fn increase_pepperoni(ref self: TContractState, amount: u32);
    fn increase_pineapple(ref self: TContractState, amount: u32);
    fn get_owner(self: @TContractState) -> ContractAddress;
    fn change_owner(ref self: ContractState, new_owner: ContractAddress);
    fn make_pizza(ref self: ContractState);
    fn count_pizza(self: @TContractState) -> u32;
}

#[starknet::contract]
pub mod PizzaFactory {
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use starknet::{ContractAddress, get_caller_address};
    use super::IPizzaFactory;

    #[storage]
    pub struct Storage {
        pepperoni: u32,
        pineapple: u32,
        pub owner: ContractAddress,
        pizzas: u32,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        self.pepperoni.write(10);
        self.pineapple.write(10);
        self.owner.write(owner);
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        PizzaEmission: PizzaEmission,
    }

    #[derive(Drop, starknet::Event)]
    pub struct PizzaEmission {
        pub counter: u32,
    }

    #[abi(embed_v0)]
    impl PizzaFactoryimpl of super::IPizzaFactory<ContractState> {
        fn increase_pepperoni(ref self: ContractState, amount: u32) {
            assert!(amount != 0, "Amount cannot be 0");
            self.pepperoni.write(self.pepperoni.read() + amount);
        }

        fn increase_pineapple(ref self: ContractState, amount: u32) {
            assert!(amount != 0, "Amount cannot be 0");
            self.pineapple.write(self.pineapple.read() + amount);
        }

        fn make_pizza(ref self: ContractState) {
            assert!(self.pepperoni.read() > 0, "Not enough pepperoni");
            assert!(self.pineapple.read() > 0, "Not enough pineapple");

            let caller: ContractAddress = get_caller_address();
            let owner: ContractAddress = self.get_owner();

            assert!(caller == owner, "Only the owner can make pizza");

            self.pepperoni.write(self.pepperoni.read() - 1);
            self.pineapple.write(self.pineapple.read() - 1);
            self.pizzas.write(self.pizzas.read() + 1);

            self.emit(PizzaEmission { counter: self.pizzas.read() });
        }

        fn get_owner(self: @ContractState) -> ContractAddress {
            self.owner.read()
        }

        fn change_owner(ref self: ContractState, new_owner: ContractAddress) {
            self.set_owner(new_owner);
        }

        fn count_pizza(self: @ContractState) -> u32 {
            self.pizzas.read()
        }
    }

    #[generate_trait]
    pub impl InternalImpl of InternalTrait {
        fn set_owner(ref self: ContractState, new_owner: ContractAddress) {
            let caller: ContractAddress = get_caller_address();
            assert!(caller == self.get_owner(), "Only the owner can set ownership");

            self.owner.write(new_owner);
        }
    }
}
```

Project Setup and Contract Deployment with Starknet Foundry

# Project Setup and Contract Deployment with Starknet Foundry

## Configuring your Scarb project with Starknet Foundry

To use Starknet Foundry as your testing tool, add it as a dev dependency in your `Scarb.toml` file. The `scarb test` command can be configured to execute `snforge test` by setting the `test` script in `Scarb.toml`.

```toml,noplayground
[dev-dependencies]
snforge_std = "0.39.0"

[scripts]
test = "snforge test"

[tool.scarb]
allow-prebuilt-plugins = ["snforge_std"]
```

After configuring your project, install Starknet Foundry following the official documentation.

## Testing Smart Contracts with Starknet Foundry

The `scarb test` command, when configured as above, will execute `snforge test`. The typical testing flow for a contract involves:

1.  Declaring the contract's class.
2.  Serializing the constructor calldata.
3.  Deploying the contract and obtaining its address.
4.  Interacting with the contract's entrypoints to test scenarios.

### Deploying the Contract to Test

Testing Smart Contract State, Functions, and Events

# Testing Smart Contract State, Functions, and Events

When testing smart contracts with Starknet Foundry, it's essential to verify their state, functions, and events. This involves deploying the contract, interacting with its functions, and asserting expected outcomes.

### Testing Contract State

To test the initial state of a contract, you can use the `load` function from `snforge_std` to read storage variables directly. This is useful even if these variables are not exposed through public entrypoints.

```cairo,noplayground
# use snforge_std::{
#     ContractClassTrait, DeclareResultTrait, EventSpyAssertionsTrait, declare, load, spy_events,
#     start_cheat_caller_address, stop_cheat_caller_address,
# };
# use starknet::storage::StoragePointerReadAccess;
#
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
fn test_constructor() {
    let (pizza_factory, pizza_factory_address) = deploy_pizza_factory();

    let pepperoni_count = load(pizza_factory_address, selector!("pepperoni"), 1);
    let pineapple_count = load(pizza_factory_address, selector!("pineapple"), 1);
    assert_eq!(pepperoni_count, array![10]);
    assert_eq!(pineapple_count, array![10]);
    assert_eq!(pizza_factory.get_owner(), owner());
}
```

### Testing Contract Functions and Ownership

To test functions that have access control, such as changing ownership, you can use `start_cheat_caller_address` to mock the caller's address. This allows you to simulate calls made by the owner and by unauthorized users, asserting the expected behavior (e.g., successful owner change or a panic for unauthorized attempts).

```cairo,noplayground
# use snforge_std::{
#     ContractClassTrait, DeclareResultTrait, EventSpyAssertionsTrait, declare, load, spy_events,
#     start_cheat_caller_address, stop_cheat_caller_address,
# };
# use starknet::storage::StoragePointerReadAccess;
#
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

### Testing Emitted Events

To verify that events are emitted correctly, you can use the `spy_events` function. This function captures emitted events, allowing you to assert that they were emitted with the expected parameters. This is often combined with testing function logic, such as incrementing a counter when a pizza is made.

```cairo,noplayground
# use snforge_std::{
#     ContractClassTrait, DeclareResultTrait, EventSpyAssertionsTrait, declare, load, spy_events,
#     start_cheat_caller_address, stop_cheat_caller_address,
# };
# use starknet::storage::StoragePointerReadAccess;
#
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
# #[test]
# #[should_panic(expected: "Only the owner can make pizza")]
# fn test_make_pizza_should_panic_when_not_owner() {
#     let (pizza_factory, pizza_factory_address) = deploy_pizza_factory();
#     let not_owner = contract_address_const::<'not_owner'>();
#     start_cheat_caller_address(pizza_factory_address, not_owner);
#
#     pizza_factory.make_pizza();
# }
#
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

Unit Testing Internal Contract Logic

# Unit Testing Internal Contract Logic

Starknet Foundry provides a way to test the internal logic of a contract without deploying it by using the `contract_state_for_testing` function. This function creates an instance of the `ContractState` struct, which contains zero-sized fields corresponding to the contract's storage variables. This allows direct access and modification of these variables.

To use this functionality, you need to manually import the traits that define access to the storage variables. Once these imports are in place, you can interact with the contract's internal functions directly.

For example, to test the `set_owner` function and read the `owner` storage variable:

```cairo
use crate::pizza::PizzaFactory::{InternalTrait};
use crate::pizza::{IPizzaFactoryDispatcher, IPizzaFactoryDispatcherTrait, PizzaFactory};
use starknet::{ContractAddress, contract_address_const};

#[test]
fn test_set_as_new_owner_direct() {
    let mut state = PizzaFactory::contract_state_for_testing();
    let owner: ContractAddress = contract_address_const::<'owner'>();
    state.set_owner(owner);
    assert_eq!(state.owner.read(), owner);
}
```

This approach is mutually exclusive with deploying the contract. If you deploy the contract, you interact via the dispatcher; if you test internal functions, you interact directly with the `ContractState` object.

Running tests with `scarb test` will show results for tests that use this method, such as `test_set_as_new_owner_direct`.

Static Analysis and Functional Language Features in Testing

# Static Analysis and Functional Language Features in Testing

No content available for this section.

Closures in Cairo

What are Closures in Cairo?

# Closures in Cairo

## What are Closures in Cairo?

Closures are anonymous functions that can be stored in variables or passed as arguments to other functions. They allow for code reuse and behavior customization by capturing values from their defining scope. This makes them particularly useful for passing behavior as a parameter to other functions, especially when working with collections, error handling, or customizing function behavior.

> Note: Closures were introduced in Cairo 2.9 and are still under development. Future versions will introduce more features.

Defining and Using Closures

# Defining and Using Closures

Closures in Cairo are anonymous functions that can capture values from their enclosing scope. They are defined using the `|parameters| body` syntax.

## Closure Syntax and Type Inference

The syntax for closures is similar to functions, with parameters enclosed in pipes (`|`) and the body following. Type annotations for parameters and return values are optional, as the compiler can infer them from the context.

```cairo
// Function definition for comparison
fn  add_one_v1   (x: u32) -> u32 { x + 1 }

// Fully annotated closure
let add_one_v2 = |x: u32| -> u32 { x + 1 };

// Closure with inferred types
let add_one_v3 = |x| { x + 1 };
let add_one_v4 = |x| x + 1; // Brackets optional for single-expression bodies
```

When types are not explicitly annotated, Cairo infers them based on usage. If the compiler cannot infer types, it may require explicit annotations or values to be provided.

## Example Usage

Closures can be used for concise inline logic, especially with collection methods.

```cairo
// Example of a closure capturing a variable from its environment
let x = 8;
let my_closure = |value| {
    x * (value + 3)
};
println!("my_closure(1) = {}", my_closure(1)); // Output: my_closure(1) = 32

// Using closures with array methods
let numbers = array![1, 2, 3];
let doubled = numbers.map(|item: u32| item * 2);
println!("doubled: {:?}", doubled); // Output: doubled: [2, 4, 6]

let squared = numbers.map(|item: u32| {
    let x: u64 = item.into();
    x * x
});
println!("squared: {:?}", squared); // Output: squared: [1, 4, 9]

let even_numbers = array![3, 4, 5, 6].filter(|item: u32| item % 2 == 0);
println!("even_numbers: {:?}", even_numbers); // Output: even_numbers: [4, 6]

// Example with multiple parameters and type inference
let sum = |x: u32, y: u32, z: u16| {
    x + y + z.into()
};
println!("Sum result: {}", sum(1, 2, 3)); // Output: Sum result: 6

// Note: Type inference can be strict.
let double = |value| value * 2;
println!("Double of 2 is {}", double(2_u8)); // Inferred as u8
// println!("Double of 6 is {}", double(6_u16)); // This would fail as type is inferred as u8
```

Closure Type Inference and Traits

# Closure Type Inference and Annotation

Closures in Cairo generally do not require explicit type annotations for their parameters or return values, unlike `fn` functions. This is because closures are typically used in narrow, internal contexts rather than as part of a public interface. The compiler can infer these types, similar to how it infers variable types, though annotations can be added for explicitness.

```cairo
# fn generate_workout(intensity: u32, random_number: u32) {
    let expensive_closure = |num: u32| -> u32 {
        num
    };
#
#     if intensity < 25 {
#         println!("Today, do {} pushups!", expensive_closure(intensity));
#         println!("Next, do {} situps!", expensive_closure(intensity));
#     } else {
#         if random_number == 3 {
#             println!("Take a break today! Remember to stay hydrated!");
#         } else {
#             println!("Today, run for {} minutes!", expensive_closure(intensity));
#         }
#     }
# }
#
# #[executable]
# fn main() {
#     let simulated_user_specified_value = 10;
#     let simulated_random_number = 7;
#
#     generate_workout(simulated_user_specified_value, simulated_random_number);
# }
```

If a closure's types are inferred, they are locked in by the first call. Attempting to call it with a different type will result in a compile-time error.

```cairo, noplayground
# //TAG: does_not_compile
# #[executable]
# fn main() {
    let example_closure = |x| x;

    let s = example_closure(5_u64);
    let n = example_closure(5_u32);
# }
```

The compiler error arises because the closure `example_closure` is first called with a `u64`, inferring `x` and the return type as `u64`. A subsequent call with `u32` violates this inferred type.

## Closure Traits (`FnOnce`, `Fn`, `FnMut`)

Closures implement traits based on how they handle captured environment values:

1.  **`FnOnce`**: Implemented by closures that can be called once. This includes closures that move captured values out of their body. All closures implement `FnOnce`.
2.  **`Fn`**: Implemented by closures that do not move or mutate captured values, or capture nothing. These can be called multiple times without affecting their environment.
3.  **`FnMut`**: Implemented by closures that might mutate captured values but do not move them out of their body. These can also be called multiple times.

The `unwrap_or_else` method on `OptionTrait<T>` demonstrates the use of `FnOnce`:

```cairo, ignore
pub impl OptionTraitImpl<T> of OptionTrait<T> {
    #[inline]
    fn unwrap_or_else<F, +Drop<F>, impl func: core::ops::FnOnce<F, ()>[Output: T], +Drop<func::Output>>(
        self: Option<T>, f: F,
    ) -> T {
        match self {
            Some(x) => x,
            None => f(),
        }
    }
}
```

The trait bound `impl func: core::ops::FnOnce<F, ()>[Output: T]` signifies that the closure `f` is called at most once, which aligns with the `unwrap_or_else` logic where `f` is only executed if the `Option` is `None`.

Closures for Array Transformations

# Closures for Array Transformations

Closures are essential for implementing functional programming patterns like `map` and `filter` for arrays. They can be passed as arguments to these functions, allowing for flexible data transformations.

## `map` Operation

The `map` function applies a given closure to each element of an array, producing a new array with the results. The element type of the output array is determined by the return type of the closure.

```cairo
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
```

Example usage:

```cairo
    let double = array![1, 2, 3].map(|item: u32| item * 2);
    let another = array![1, 2, 3].map(|item: u32| {
        let x: u64 = item.into();
        x * x
    });

    println!("double: {:?}" , double);
    println!("another: {:?}" , another);
```

## `filter` Operation

The `filter` function creates a new array containing only the elements from the original array for which the provided closure returns `true`. The closure must have a return type of `bool`.

```cairo
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
```

Example usage:

```cairo
    let even = array![3, 4, 5, 6].filter(|item: u32| item % 2 == 0);
    println!("even: {:?}" , even);
```

Closure Behavior and Limitations

# Closure Behavior and Limitations

Closures in Cairo can capture bindings from their enclosing scope. This means a closure can access and use variables defined outside of its own body.

For instance, the following closure `my_closure` uses the binding `x` from its surrounding environment to compute its result:

```cairo
# #[generate_trait]
# impl ArrayExt of ArrayExtTrait {
#     // Needed in Cairo 2.11.4 because of a bug in inlining analysis.
#     #[inline(never)]
#     fn map<T, +Drop<T>, F, +Drop<F>, impl func: core::ops::Fn<F, (T,)>, +Drop<func::Output>>(
#         self: Array<T>, f: F,
#     ) -> Array<func::Output> {
#         let mut output: Array<func::Output> = array![];
#         for elem in self {
#             output.append(f(elem));
#         }
#         output
#     }
# }
#
# #[generate_trait]
# impl ArrayFilterExt of ArrayFilterExtTrait {
#     // Needed in Cairo 2.11.4 because of a bug in inlining analysis.
#     #[inline(never)]
#     fn filter<
#         T,
#         +Copy<T>,
#         +Drop<T>,
#         F,
#         +Drop<F>,
#         impl func: core::ops::Fn<F, (T,)>[Output: bool],
#         +Drop<func::Output>,
#     >(
#         self: Array<T>, f: F,
#     ) -> Array<T> {
#         let mut output: Array<T> = array![];
#         for elem in self {
#             if f(elem) {
#                 output.append(elem);
#             }
#         }
#         output
#     }
# }
#
# #[executable]
# fn main() {
#     let double = |value| value * 2;
#     println!("Double of 2 is {}", double(2_u8));
#     println!("Double of 4 is {}", double(4_u8));
#
#     // This won't work because `value` type has been inferred as `u8`.
#     //println!("Double of 6 is {}", double(6_u16));
#
#     let sum = |x: u32, y: u32, z: u16| {
#         x + y + z.into()
#     };
#     println!("Result: {}", sum(1, 2, 3));
#
    let x = 8;
    let my_closure = |value| {
        x * (value + 3)
    };

    println!("my_closure(1) = {}", my_closure(1));
#
#     let double = array![1, 2, 3].map(|item: u32| item * 2);
#     let another = array![1, 2, 3].map(|item: u32| {
#         let x: u64 = item.into();
#         x * x
#     });
#
#     println!("double: {:?}", double);
#     println!("another: {:?}", another);
#
#     let even = array![3, 4, 5, 6].filter(|item: u32| item % 2 == 0);
#     println!("even: {:?}", even);
# }
```

The arguments for a closure are placed between pipes (`|`). Type annotations for arguments and return values are generally inferred from usage. If a closure is used with inconsistent types, a `Type annotations needed` error will occur, prompting the user to specify the types. The closure body can be a single expression without braces `{}` or a multi-line expression enclosed in braces `{}`.

Custom Data Structures in Cairo

Custom Data Structures and Type Conversions

# Custom Data Structures and Type Conversions

Cairo allows the definition of custom data structures using `structs`. These structures can hold fields of various types, including other custom types.

## Conversions of Custom Types

Cairo supports defining type conversions for custom types, similar to built-in types.

### `Into` Trait

The `Into` trait enables defining conversions where the compiler can infer the target type. This typically requires explicitly stating the target type during conversion.

```cairo
#[derive(Drop, PartialEq)]
struct Rectangle {
    width: u64,
    height: u64,
}

#[derive(Drop)]
struct Square {
    side_length: u64,
}

impl SquareIntoRectangle of Into<Square, Rectangle> {
    fn into(self: Square) -> Rectangle {
        Rectangle { width: self.side_length, height: self.side_length }
    }
}

#[executable]
fn main() {
    let square = Square { side_length: 5 };
    // Compiler will complain if you remove the type annotation
    let result: Rectangle = square.into();
    let expected = Rectangle { width: 5, height: 5 };
    assert!(
        result == expected,
        "A square is always convertible to a rectangle with the same width and height!",
    );
}
```

### `TryInto` Trait

The `TryInto` trait allows for fallible conversions, returning an `Option` or `Result`.

```cairo
#[derive(Drop)]
struct Rectangle {
    width: u64,
    height: u64,
}

#[derive(Drop, PartialEq)]
struct Square {
    side_length: u64,
}

impl RectangleIntoSquare of TryInto<Rectangle, Square> {
    fn try_into(self: Rectangle) -> Option<Square> {
        if self.height == self.width {
            Some(Square { side_length: self.height })
        } else {
            None
        }
    }
}

#[executable]
fn main() {
    let rectangle = Rectangle { width: 8, height: 8 };
    let result: Square = rectangle.try_into().unwrap();
    let expected = Square { side_length: 8 };
    assert!(
        result == expected,
        "Rectangle with equal width and height should be convertible to a square.",
    );

    let rectangle = Rectangle { width: 5, height: 8 };
    let result: Option<Square> = rectangle.try_into();
    assert!(
        result.is_none(),
        "Rectangle with different width and height should not be convertible to a square.",
    );
}
```

## Handling Custom Data Structures with `Felt252Dict`

When a struct contains a `Felt252Dict<T>` member, it requires manual implementation of the `Destruct<T>` trait to manage the dictionary's lifecycle. This is because `Felt252Dict` cannot be automatically dropped.

```cairo
// Example of Destruct implementation for MemoryVec
// (Full MemoryVec implementation omitted for brevity)
struct MemoryVec<T> {
    data: Felt252Dict<Nullable<T>>,
    len: usize,
}

impl<T, +Drop<T>> Destruct<MemoryVec<T>> of Destruct<MemoryVec<T>> {
    fn destruct(self: MemoryVec<T>) nopanic {
        self.data.squash();
    }
}
```

## Formatting Custom Types with `Display`

To format custom types for user consumption, the `Display` trait must be implemented. This trait provides a `fmt` method that defines how the struct's data should be represented as a string.

```cairo
use core::fmt::{Display, Error, Formatter};

#[derive(Copy, Drop)]
struct Point {
    x: u8,
    y: u8,
}

impl PointDisplay of Display<Point> {
    fn fmt(self: @Point, ref f: Formatter) -> Result<(), Error> {
        let str: ByteArray = format!("Point ({}, {})", *self.x, *self.y);
        f.buffer.append(@str);
        Ok(())
    }
}

#[executable]
fn main() {
    let p = Point { x: 1, y: 3 };
    println!("{} {}", p.x, p.y); // Expected output: Point (1, 3)
}
```

The `write!` and `writeln!` macros can also be used with a `Formatter` to write formatted strings.

## Deref Coercion

The `Deref` trait allows types to be treated as references to another type. This enables accessing the fields of a wrapped type directly through the wrapper.

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

impl<T> DerefWrapper<T> of Deref<Wrapper<T>> {
    type Target = T;
    fn deref(self: Wrapper<T>) -> T {
        self.value
    }
}

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

### Restricting Deref Coercion to Mutable Variables

The `DerefMut` trait, when implemented, only applies to mutable variables. However, it does not inherently provide mutable access to the underlying data.

Mutable Data Structures: Dictionaries and Dynamic Arrays

# Mutable Data Structures: Dictionaries and Dynamic Arrays

Cairo's standard arrays (`Array<T>`) are immutable, meaning elements cannot be modified after insertion. This limitation is problematic for mutable data structures. For instance, updating an element at a specific index or removing an element from an array is not directly supported.

```cairo,noplayground
    let mut level_players = array![5, 1, 10];
```

To overcome this, Cairo provides a built-in dictionary type, `Felt252Dict<T>`, which can simulate mutable data structures. Dictionaries can be members of structs, allowing for more complex data management.

## Dictionaries as Struct Members

A `Felt252Dict<T>` can be included as a member within a struct to manage collections of data that require modification. For example, a user database could be implemented using a struct containing a dictionary to store user balances.

```cairo,noplayground
struct UserDatabase<T> {
    users_updates: u64,
    balances: Felt252Dict<T>,
}

trait UserDatabaseTrait<T> {
    fn new() -> UserDatabase<T>;
    fn update_user<+Drop<T>>(ref self: UserDatabase<T>, name: felt252, balance: T);
    fn get_balance<+Copy<T>>(ref self: UserDatabase<T>, name: felt252) -> T;
}
```

## Simulating a Dynamic Array with Dictionaries

A dynamic array should support operations such as appending items, accessing items by index, setting values at specific indices, and returning the current length. This behavior can be defined using a trait.

```cairo,noplayground
trait MemoryVecTrait<V, T> {
    fn new() -> V;
    fn get(ref self: V, index: usize) -> Option<T>;
    fn at(ref self: V, index: usize) -> T;
    fn push(ref self: V, value: T) -> ();
    fn set(ref self: V, index: usize, value: T);
    fn len(self: @V) -> usize;
}
```

The core library includes a `Vec<T>` for storage, but a custom implementation like `MemoryVec` can be created using `Felt252Dict` for mutability.

### Implementing a Dynamic Array in Cairo

Our `MemoryVec` struct uses a `Felt252Dict<Nullable<T>>` to store data, mapping indices (felts) to values, and a `len` field to track the number of elements.

```cairo,noplayground
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
struct MemoryVec<T> {
    data: Felt252Dict<Nullable<T>>,
    len: usize,
}
```

The implementation of the `MemoryVecTrait` methods is as follows:

```cairo,noplayground
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
# impl DestructMemoryVec<T, +Drop<T>> of Destruct<MemoryVec<T>> {
#     fn destruct(self: MemoryVec<T>) nopanic {
#         self.data.squash();
#     }
# }
#
impl MemoryVecImpl<T, +Drop<T>, +Copy<T>> of MemoryVecTrait<MemoryVec<T>, T> {
    fn new() -> MemoryVec<T> {
        MemoryVec { data: Default::default(), len: 0 }
    }

    fn get(ref self: MemoryVec<T>, index: usize) -> Option<T> {
        if index < self.len() {
            Some(self.data.get(index.into()).deref())
        } else {
            None
        }
    }

    fn at(ref self: MemoryVec<T>, index: usize) -> T {
        assert!(index < self.len(), "Index out of bounds");
        self.data.get(index.into()).deref()
    }

    fn push(ref self: MemoryVec<T>, value: T) -> () {
        self.data.insert(self.len.into(), NullableTrait::new(value));
        self.len.wrapping_add(1_usize);
    }
    fn set(ref self: MemoryVec<T>, index: usize, value: T) {
        assert!(index < self.len(), "Index out of bounds");
        self.data.insert(index.into(), NullableTrait::new(value));
    }
    fn len(self: @MemoryVec<T>) -> usize {
        *self.len
    }
}
```

This implementation allows for dynamic array-like behavior by leveraging the mutability of `Felt252Dict`.

Stack Data Structure Implementation

# Stack Data Structure Implementation

A Stack is a LIFO (Last-In, First-Out) collection where elements are added and removed from the same end, known as the top.

## Stack Operations Interface

The necessary operations for a stack are:

- Push an item to the top of the stack.
- Pop an item from the top of the stack.
- Check if the stack is empty.

This can be defined by the following trait:

```cairo,noplayground
trait StackTrait<S, T> {
    fn push(ref self: S, value: T);
    fn pop(ref self: S) -> Option<T>;
    fn is_empty(self: @S) -> bool;
}
```

## Mutable Stack Implementation in Cairo

A stack can be implemented in Cairo using a `Felt252Dict<T>` to store the stack elements and a `usize` field to track the stack's length.

The `NullableStack` struct is defined as:

```cairo,noplayground
struct NullableStack<T> {
    data: Felt252Dict<Nullable<T>>,
    len: usize,
}
```

### Implementing `push` and `pop`

The `push` function inserts an element at the index indicated by `len` and increments `len`. The `pop` function decrements `len` and then retrieves the element at the new `len` index.

```cairo,noplayground
#
# use core::dict::Felt252Dict;
# use core::nullable::{FromNullableResult, NullableTrait, match_nullable};
#
# trait StackTrait<S, T> {
#     fn push(ref self: S, value: T);
#     fn pop(ref self: S) -> Option<T>;
#     fn is_empty(self: @S) -> bool;
# }
#
# struct NullableStack<T> {
#     data: Felt252Dict<Nullable<T>>,
#     len: usize,
# }
#
# impl DestructNullableStack<T, +Drop<T>> of Destruct<NullableStack<T>> {
#     fn destruct(self: NullableStack<T>) nopanic {
#         self.data.squash();
#     }
# }
#
#
impl NullableStackImpl<T, +Drop<T>, +Copy<T>> of StackTrait<NullableStack<T>, T> {
    fn push(ref self: NullableStack<T>, value: T) {
        self.data.insert(self.len.into(), NullableTrait::new(value));
        self.len += 1;
    }

    fn pop(ref self: NullableStack<T>) -> Option<T> {
        if self.is_empty() {
            return None;
        }
        self.len -= 1;
        Some(self.data.get(self.len.into()).deref())
    }

    fn is_empty(self: @NullableStack<T>) -> bool {
        *self.len == 0
    }
}
```

The full implementation, along with other data structures, is available in the Alexandria library.

Recursive Data Structures

# Recursive Data Structures

Recursive data structures allow a value of a type to contain another value of the same type. This poses a compile-time challenge because Cairo needs to know the exact size of a type, and infinite nesting could make this impossible. To address this, a `Box<T>` can be used within the recursive type definition, as `Box<T>` has a known size (it's a pointer).

## Binary Tree Example

A binary tree is a data structure where each node has at most two children: a left child and a right child. A leaf node has no children.

### Initial Attempt (Fails Compilation)

An initial attempt to define a binary tree might look like this:

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

This code fails because the `BinaryTree` type, as defined, does not have a known size due to the direct nesting of `BinaryTree` within `Node`.

### Solution with `Box<T>`

To make the recursive type compilable, `Box<T>` is used to store the recursive variants. `Box<T>` is a pointer, and its size is constant regardless of the data it points to. This breaks the infinite recursion chain, allowing the compiler to determine the type's size.

The corrected `BinaryTree` definition and usage are as follows:

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

In this version, the `Node` variant contains `(u32, Box<BinaryTree>, Box<BinaryTree>)`. This means a `Node` stores a `u32` and two pointers to `BinaryTree` values, which are stored separately. This approach ensures that the `Node` variant has a known size, enabling the `BinaryTree` type to compile.

Smart Pointers in Cairo

Introduction to Cairo's Memory Model and Smart Pointers

# Introduction to Cairo's Memory Model and Smart Pointers

A pointer is a variable that contains a memory address, pointing to other data. Pointers can lead to bugs and security vulnerabilities, such as referencing unassigned memory, causing crashes. To prevent these issues, Cairo employs Smart Pointers.

Smart pointers are data structures that behave like pointers but include additional metadata and capabilities. Originating in C++ and also present in languages like Rust, smart pointers in Cairo ensure memory is accessed safely and provably by enforcing strict type checking and ownership rules, thus preventing unsafe memory addressing that could compromise a program's provability.

Understanding `Box<T>` in Cairo

# Understanding `Box<T>` in Cairo

## What is `Box<T>`?

The principal smart pointer type in Cairo is `Box<T>`. It allows you to store data in a specific memory segment called the "boxed segment." When you create a `Box<T>`, the data of type `T` is appended to this segment, and the execution segment holds only a pointer to the boxed data.

## When to Use `Box<T>`

You will typically use `Box<T>` in the following situations:

- **Unknown Compile-Time Size:** When you have a type whose size cannot be determined at compile time, and you need to use a value of that type in a context requiring a fixed size.
- **Efficient Large Data Transfer:** When you need to transfer ownership of a large amount of data and want to ensure it is not copied during the transfer.

Performance and Recursive Types with `Box<T>`

# Performance and Recursive Types with `Box<T>`

Storing large amounts of data directly can be slow due to memory copying. Using `Box<T>` improves performance by storing the data in the boxed segment, allowing only a small pointer to be copied.

### Using a `Box<T>` to Store Data in the Boxed Segment

A `Box<T>` can be used to store data in the boxed segment. This is useful for optimizing the transfer of large data.

```cairo
#[executable]
fn main() {
    let b = BoxTrait::new(5_u128);
    println!("b = {}", b.unbox())
}
```

This code snippet demonstrates storing a `u128` value in the boxed segment using `BoxTrait::new()`. While storing a single value in a box isn't common, it illustrates the mechanism.

### Enabling Recursive Types with Boxes

Boxes are essential for defining recursive types, which would otherwise be disallowed due to their potentially infinite size.

The `Deref` Trait and Deref Coercion

# The `Deref` Trait and Deref Coercion

The `Deref` trait allows a type to be treated like a reference to another type. This enables deref coercion, which permits accessing the members of a wrapped type directly through the wrapper itself.

## Practical Example: `Wrapper<T>`

Consider a generic wrapper type `Wrapper<T>` designed to wrap another type `T`.

```cairo, noplayground
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
```

To facilitate access to the wrapped value, the `Deref` trait is implemented for `Wrapper<T>`:

```cairo, noplayground
impl DerefWrapper<T> of Deref<Wrapper<T>> {
    type Target = T;
    fn deref(self: Wrapper<T>) -> T {
        self.value
    }
}
```

This implementation of `deref` simply returns the wrapped value. As a result, instances of `Wrapper<T>` can directly access the members of the inner type `T` through deref coercion.

For instance, when `Wrapper<UserProfile>` is used, its fields can be accessed as if they were directly on `UserProfile`:

```cairo, noplayground
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

Smart Pointers: Quiz and Key Concepts

# Smart Pointers: Quiz and Key Concepts

## Key Concepts of Smart Pointers

Smart pointers in Cairo offer capabilities beyond simple references, including memory management, strict type checking, and ownership rules to ensure memory safety. They prevent issues like null dereferences and access to uninitialized memory. Examples include `Box` and `Nullable`.

## Quiz Insights

- **What smart pointers are NOT:** Smart pointers are _not_ types that store a reference to a value without providing automatic memory management or ownership tracking. They actively help prevent memory issues and enable efficient data handling.
- **Smart Pointer Assignment Behavior:** When a smart pointer is assigned to a new variable, only the pointer is copied, not the data it points to. Both variables then refer to the same data. Re-instantiating the original pointer does not affect the variable holding the copied pointer.

  ```cairo
  #[derive(Drop)]
  struct Student {
      name: ByteArray,
      age: u8,
      id: u32
  }

  fn main() {
      let mut student1 = BoxTrait::new(Student { name: "Peter", age: 12, id: 12345 });
      let student2 = student1;
      student1 = BoxTrait::new(Student { name: "James", age: 18, id: 56789 });
      println!("{}", student2.unbox().name);
  }
  ```

  Running this code prints "Peter".

- **Array Indexing Errors:** Attempting to access an array element out of bounds (e.g., the fifth element of a four-element array) results in a panic with an "Index out of bounds" error.

Operator Overloading in Cairo

# Operator Overloading in Cairo

Operator overloading allows the redefinition of standard operators for user-defined types, making code more intuitive by enabling operations on custom types using familiar syntax. In Cairo, this is achieved by implementing specific traits associated with each operator.

It's important to use operator overloading judiciously to avoid making code harder to maintain.

## Implementing Operator Overloading

To overload an operator, you implement the corresponding trait for your custom type. For example, to overload the addition operator (`+`) for a `Potion` struct, you implement the `Add` trait.

### Example: Combining Potions

Consider a `Potion` struct with `health` and `mana` fields. Combining two potions should add their respective fields.

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
    assert(super_potion.health == 100, '');
    assert(super_potion.mana == 100, '');
}
```

In this example, the `add` function within the `impl Add<Potion>` block takes two `Potion` instances (`lhs` and `rhs`) and returns a new `Potion` with the combined health and mana values. Overloading an operator requires specifying the concrete type being overloaded, as shown with `Add<Potion>`.

## Overloadable Operators in Cairo

The following table lists operators, their examples, explanations, and the corresponding overloadable traits in Cairo:

| Operator | Example        | Explanation                              | Overloadable? |
| -------- | -------------- | ---------------------------------------- | ------------- |
| `!`      | `!expr`        | Logical complement                       | `Not`         |
| `~`      | `~expr`        | Bitwise NOT                              | `BitNot`      |
| `!=`     | `expr != expr` | Non-equality comparison                  | `PartialEq`   |
| `%`      | `expr % expr`  | Arithmetic remainder                     | `Rem`         |
| `%=`     | `var %= expr`  | Arithmetic remainder and assignment      | `RemEq`       |
| `&`      | `expr & expr`  | Bitwise AND                              | `BitAnd`      |
| `&&`     | `expr && expr` | Short-circuiting logical AND             |               |
| `*`      | `expr * expr`  | Arithmetic multiplication                | `Mul`         |
| `*=`     | `var *= expr`  | Arithmetic multiplication and assignment | `MulEq`       |
| `@`      | `@var`         | Snapshot                                 |               |
| `*`      | `*var`         | Desnap                                   |               |

Hashing in Cairo

Introduction to Hashing in Cairo

# Introduction to Hashing in Cairo

Pedersen and Poseidon Hash Functions

# Pedersen and Poseidon Hash Functions

Hashing is the process of converting input data of any length into a fixed-size value, known as a hash. This transformation is deterministic, meaning the same input always yields the same hash. Hash functions are crucial for data storage, cryptography, data integrity verification, and are frequently used in smart contracts, particularly with Merkle trees.

Cairo's core library provides two native hash functions: Pedersen and Poseidon.

## Pedersen Hash Function

Pedersen hash functions are cryptographic algorithms based on elliptic curve cryptography. They perform operations on points along an elliptic curve, making them easy to compute in one direction but computationally difficult to reverse, based on the Elliptic Curve Discrete Logarithm Problem (ECDLP). This one-way property ensures their security for cryptographic purposes.

## Poseidon Hash Function

Poseidon is a family of hash functions optimized for efficiency within algebraic circuits, making it ideal for Zero-Knowledge proof systems like STARKs (and thus Cairo). It employs a "sponge construction" using the Hades permutation. Cairo's Poseidon implementation uses a three-element state permutation with specific parameters.

## When to Use Them

Pedersen was initially used on Starknet for tasks like computing storage variable addresses (e.g., in `LegacyMap`). However, Poseidon is now recommended for Cairo programs as it is cheaper and faster when working with STARK proofs.

## Working with Hashes in Cairo

The `core::hash` module provides the necessary traits and functions for hashing.

### The `Hash` Trait

The `Hash` trait is implemented for types convertible to `felt252`, including `felt252` itself. For structs, deriving `Hash` allows them to be hashed if all their fields are hashable. Types like `Array<T>` or `Felt252Dict<T>` prevent deriving `Hash`.

### Hash State Traits

`HashStateTrait` and `HashStateExTrait` define methods for managing hash states:

- `update(self: S, value: felt252) -> S`: Updates the hash state with a `felt252` value.
- `finalize(self: S) -> felt252`: Completes the hash computation and returns the final hash value.
- `update_with(self: S, value: T) -> S`: Updates the hash state with a value of type `T`.

```cairo
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

### Hashing Examples

To hash data, you first initialize a hash state using `PoseidonTrait::new()` or `PedersenTrait::new(base: felt252)`. Then, you update the state using `update` or `update_with`, and finally call `finalize`.

#### Poseidon Hashing Example

This example demonstrates hashing a struct using the Poseidon function.

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

#### Pedersen Hashing Example

Pedersen requires a base state. You can either hash the struct with an arbitrary base state or serialize it into an array to hash its elements sequentially.

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

    while let Some(value) = serialized_struct.pop_front() {
        state = state.update(value);
    }

    // hash2 is the result of hashing only the fields of the struct
    let hash2 = state.finalize();

    (hash1, hash2)
}
```

## Poseidon Builtin

The Poseidon builtin computes cryptographic hashes using the Poseidon hash function, optimized for zero-knowledge proofs and algebraic circuits. It utilizes the Hades permutation strategy, combining full and partial rounds for security and performance in STARK proofs.

Poseidon offers:

- Better performance than Pedersen for multiple inputs.
- A ZK-friendly design optimized for constraints in ZK proof systems.
- Strong cryptographic security.

### Cells Organization

The Poseidon builtin uses a dedicated memory segment and follows a deduction property:

- **Input cells [0-2]:** Store input state for the Hades permutation.
- **Output cells [3-5]:** Store the computed permutation results.

Each operation involves 6 consecutive cells (3 inputs, 3 outputs). Reading an output cell triggers the VM to apply the Hades permutation to the input cells and populate the output cells.

#### Single Value Hashing Example

For hashing a single value (e.g., 42):

1.  The value is written to the first input cell (position 3:0).
2.  Other input cells default to 0.
3.  When an output cell (e.g., 3:3) is read, the VM computes the permutation.

Implementing Hashing in Cairo

### Hashing Arrays with Poseidon

To hash an `Array<felt252>` or a struct containing a `Span<felt252>`, you can use the built-in function `poseidon_hash_span(mut span: Span<felt252>) -> felt252`.

First, import the required traits and function:

```cairo,noplayground
use core::hash::{HashStateExTrait, HashStateTrait};
use core::poseidon::{PoseidonTrait, poseidon_hash_span};
```

Define the struct. Note that deriving the `Hash` trait for a struct with a non-hashable field like `Span<felt252>` will result in an error.

```cairo, noplayground
#[derive(Drop)]
struct StructForHashArray {
    first: felt252,
    second: felt252,
    third: Array<felt252>,
}
```

The following example demonstrates hashing a struct containing an array. A `HashState` is initialized and updated with the struct's fields. The hash of the `Array<felt252>` is computed using `poseidon_hash_span` on its span, and then this hash is used to update the main `HashState` before finalizing.

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
#
#
```

Function Inlining and Macros

Function Inlining: Concepts, Attributes, and Performance

## Function Inlining: Concepts, Attributes, and Performance

Inlining is a code optimization technique where a function call is replaced with the actual code of the called function at the call site. This eliminates function call overhead, potentially improving performance by reducing executed instructions, though it may increase program size.

### The `inline` Attribute

The `inline` attribute in Cairo suggests whether the Sierra code of a function should be injected into the caller's context instead of using a `function_call` libfunc. The attribute has three variants:

- `#[inline]`: Suggests performing an inline expansion.
- `#[inline(always)]`: Suggests that an inline expansion should always be performed.
- `#[inline(never)]`: Suggests that an inline expansion should never be performed.

These attributes are hints and may be ignored by the compiler, although `#[inline(always)]` is rarely ignored. Annotating functions with `#[inline(always)]` can reduce the total steps required for function calls by avoiding the overhead of calling and argument passing.

However, inlining can increase code size due to code duplication at call sites. It is most beneficial for small, frequently called functions, especially those with many arguments, as inlining large functions can significantly increase code length.

### Inlining Decision Process

The Cairo compiler uses heuristics for functions without explicit inline directives. It calculates a function's "weight" using `ApproxCasmInlineWeight` to estimate the generated Cairo Assembly (CASM) statements. If the weight is below a threshold, the function is inlined. Functions with fewer raw statements than the threshold are also typically inlined.

Special cases include very simple functions (e.g., those that only call another function or return a constant), which are always inlined. Conversely, functions with complex control flow or those ending with `Panic` are generally not inlined.

### Inlining Example

Listing 12-5 demonstrates inlining:

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

The corresponding Sierra code shows that `not_inlined` is called using `call rel 9`, while `inlined`'s code is directly injected (inlined) without a `call` instruction.

### Additional Optimizations Example

Listing 12-6 shows a program where an inlined function's return value is unused:

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

<span class="caption">Listing 12-6: A small Cairo program that calls `inlined` and `not_inlined` and doesn't return any value.</span>

In this case, the compiler optimized the `main` function by omitting the `inlined` function's code entirely because its return value was not used. This reduced code length and execution steps. The `not_inlined` function was called normally using `function_call`.

Inline Macros and Compile-Time Generation

# Inline Macros and Compile-Time Generation

Procedural Macros in Cairo

# Procedural Macros in Cairo

Procedural macros in Cairo allow you to write code that generates other code at compile time, extending Cairo's capabilities through metaprogramming.

## The Difference Between Macros and Functions

Macros, unlike functions, can:

- Accept a variable number of parameters.
- Operate at compile time, enabling actions like trait implementation, which functions cannot do as they are called at runtime.

However, Cairo macros are more complex to write and maintain because they are written in Rust and operate on Cairo code.

## Cairo Procedural Macros are Rust Functions

Procedural macros in Cairo are essentially Rust functions that transform Cairo code. These functions take Cairo code as input and return modified Cairo code. Implementing macros requires a package with both `Cargo.toml` (for macro implementation dependencies) and `Scarb.toml` (to mark the package as a macro).

The core types manipulated by these functions are:

- `TokenStream`: Represents a sequence of Cairo tokens (smallest code units like keywords, identifiers, operators).

## Creating an expression Macros

To create an expression macro, you can leverage Rust crates like `cairo_lang_macro`, `cairo_lang_parser`, and `cairo_lang_syntax`. These crates allow manipulation of Cairo syntax at compile time.

An example is the `pow` macro from the Alexandria library, which computes a number raised to a power at compile time. The macro implementation parses the input tokens to extract the base and exponent, performs the calculation using `BigDecimal::pow`, and returns the result as a `TokenStream`.

```rust, noplayground
use bigdecimal::{num_traits::pow, BigDecimal};
use cairo_lang_macro::{inline_macro, Diagnostic, ProcMacroResult, TokenStream};
use cairo_lang_parser::utils::SimpleParserDatabase;

#[inline_macro]
pub fn pow(token_stream: TokenStream) -> ProcMacroResult {
    let db = SimpleParserDatabase::default();
    let (parsed, _diag) = db.parse_virtual_with_diagnostics(token_stream);

    // extracting the args from the parsed input
    let macro_args: Vec<String> = parsed
        .descendants(&db)
        .next()
        .unwrap()
        .get_text(&db)
        .trim_matches(|c| c == '(' || c == ')')
        .split(',')
        .map(|s| s.trim().to_string())
        .collect();

    if macro_args.len() != 2 {
        return ProcMacroResult::new(TokenStream::empty()).with_diagnostics(
            Diagnostic::error(format!("Expected two arguments, got {:?}", macro_args)).into(),
        );
    }

    // getting the value from the base arg
    let base: BigDecimal = match macro_args[0].parse() {
        Ok(val) => val,
        Err(_) => {
            return ProcMacroResult::new(TokenStream::empty())
                .with_diagnostics(Diagnostic::error("Invalid base value").into());
        }
    };

    // getting the value from the exponent arg
    let exp: usize = match macro_args[1].parse() {
        Ok(val) => val,
        Err(_) => {
            return ProcMacroResult::new(TokenStream::empty())
                .with_diagnostics(Diagnostic::error("Invalid exponent value").into());
        }
    };

    // base^exp
    let result: BigDecimal = pow(base, exp);

    ProcMacroResult::new(TokenStream::new(result.to_string()))
}
```

Derive and Attribute Macros in Cairo

# Derive and Attribute Macros in Cairo

Derive and attribute macros in Cairo allow for custom code generation, automating repetitive tasks and extending the language's capabilities.

## Derive Macros

Derive macros enable the automatic implementation of traits for types. When a type is annotated with `#[derive(TraitName)]`, the macro:

1.  Receives the type's structure.
2.  Applies custom logic to generate the trait implementation.
3.  Outputs the generated implementation code.

This process eliminates the need for manual, repetitive trait implementations.

### Creating a Derive Macro

The following example demonstrates a derive macro that implements a `Hello` trait, which includes a `hello()` function that prints "Hello, StructName!".

First, the `Hello` trait needs to be defined:

```cairo
trait Hello<T> {
    fn hello(self: @T);
}
```

The macro implementation (`hello_macro`) parses the input token stream, extracts the struct name, and generates the `Hello` trait implementation for that struct.

```rust, noplayground
use cairo_lang_macro::{derive_macro, ProcMacroResult, TokenStream};
use cairo_lang_parser::utils::SimpleParserDatabase;
use cairo_lang_syntax::node::kind::SyntaxKind::{TerminalStruct, TokenIdentifier};

#[derive_macro]
pub fn hello_macro(token_stream: TokenStream) -> ProcMacroResult {
    let db = SimpleParserDatabase::default();
    let (parsed, _diag) = db.parse_virtual_with_diagnostics(token_stream);
    let mut nodes = parsed.descendants(&db);

    let mut struct_name = String::new();
    for node in nodes.by_ref() {
        if node.kind(&db) == TerminalStruct {
            struct_name = nodes
                .find(|node| node.kind(&db) == TokenIdentifier)
                .unwrap()
                .get_text(&db);
            break;
        }
    }

    ProcMacroResult::new(TokenStream::new(indoc::formatdoc! {r#"
            impl SomeHelloImpl of Hello<{0}> {{
                fn hello(self: @{0}) {{
                    println!("Hello {0}!");
                }}
            }}
        "#, struct_name}))
}
```

To use this macro, add `hello_macro = { path = "path/to/hello_macro" }` to your `Scarb.toml`'s `[dependencies]` and apply it to a struct:

```cairo, noplayground
#[derive(HelloMacro, Drop, Destruct)]
struct SomeType {}
```

Then, the `hello()` function can be called on an instance of `SomeType`:

```cairo, noplayground
# #[executable]
# fn main() {
    let a = SomeType {};
    a.hello();
#
#     let res = pow!(10, 2);
#     println!("res : {}", res);
#
#     let _a = RenamedType {};
# }
#
# #[derive(HelloMacro, Drop, Destruct)]
# struct SomeType {}
#
# #[rename]
# struct OldType {}
#
# trait Hello<T> {
#     fn hello(self: @T);
# }
#
#
```

_Note: The `Hello` trait must be defined or imported in the code._

## Attribute Macros

Attribute-like macros offer more flexibility than derive macros, as they can be applied to various items, including functions, not just structs and enums. They are useful for diverse code generation tasks like renaming items, modifying function signatures, or executing code conditionally.

Attribute macros have a signature that accepts two `TokenStream` arguments: `attr` for attribute arguments and `code` for the item the attribute is applied to.

```rust, noplayground
#[attribute_macro]
pub fn attribute(attr: TokenStream, code: TokenStream) -> ProcMacroResult {}
```

### Creating an Attribute Macro

The following example shows a `rename` attribute macro that renames a struct.

```rust, noplayground
use cairo_lang_macro::attribute_macro;
use cairo_lang_macro::{ProcMacroResult, TokenStream};

#[attribute_macro]
pub fn rename(_attr: TokenStream, token_stream: TokenStream) -> ProcMacroResult {
    ProcMacroResult::new(TokenStream::new(
        token_stream
            .to_string()
            .replace("struct OldType", "#[derive(Drop)]\n struct RenamedType"),
    ))
}
```

To use this macro, add `rename_macro = { path = "path/to/rename_macro" }` to your `Scarb.toml` and apply it to a struct:

```cairo
# #[executable]
# fn main() {
#     let a = SomeType {};
#     a.hello();
#
#     let res = pow!(10, 2);
#     println!("res : {}", res);
#
#     let _a = RenamedType {};
# }
#
# #[derive(HelloMacro, Drop, Destruct)]
# struct SomeType {}
#
#[rename]
struct OldType {}
#
# trait Hello<T> {
#     fn hello(self: @T);
# }
#
#
```

Project Configuration and Macro Usage

## Project Configuration and Macro Usage

To define and use macros in Cairo projects, specific configurations are required in your project manifests.

### Macro Definition Project Configuration

For the project that defines the macro, the configuration involves both `Cargo.toml` and `Scarb.toml`.

**`Cargo.toml` Requirements:**
The `Cargo.toml` file must include `crate-type = ["cdylib"]` under the `[lib]` target and list `cairo-lang-macro` in `[dependencies]`.

```toml
[package]
name = "pow"
version = "0.1.0"
edition = "2021"
publish = false

[lib]
crate-type = ["cdylib"]

[dependencies]
bigdecimal = "0.4.5"
cairo-lang-macro = "0.1.1"
cairo-lang-parser = "2.11.4"
cairo-lang-syntax = "2.11.4"

[workspace]
```

**`Scarb.toml` Requirements:**
The `Scarb.toml` file must define a `[cairo-plugin]` target type.

```toml
[package]
name = "pow"
version = "0.1.0"

[cairo-plugin]
```

Additionally, the project needs a Rust library file (`src/lib.rs`) that implements the procedural macro API. Notably, the project defining the macro does not require any Cairo code.

### Using Your Macro in Another Project

To use a macro defined in another package, add that package to the `[dependencies]` section of your project's `Scarb.toml`.

**Example `Scarb.toml` for Using Macros:**

```toml
[package]
name = "no_listing_15_procedural_macro"
version = "0.1.0"
edition = "2024_07"

# See more keys and their definitions at https://docs.swmansion.com/scarb/docs/reference/manifest.html

[dependencies]
cairo_execute = "2.11.4"
pow = { path = "../no_listing_16_procedural_macro_expression" }
hello_macro = { path = "../no_listing_17_procedural_macro_derive" }
rename_macro = { path = "../no_listing_18_procedural_macro_attribute" }


[dev-dependencies]
cairo_test = "2.11.4"

[cairo]
enable-gas = false


[[target.executable]]
name = "main"
function = "no_listing_15_procedural_macro::main"
```

### Expression Macros

Expression macros offer enhanced capabilities beyond regular functions, allowing them to:

- Accept a variable number of arguments.
- Handle arguments of different types.

Cairo Virtual Machine (VM)

Introduction to the Cairo Virtual Machine

# Introduction to the Cairo Virtual Machine

Ever wondered how your Cairo programs were executed?

First, they are compiled by the Cairo Compiler, then executed by the Cairo Virtual Machine, or _Cairo VM_ for short, which generates a trace of execution, used by the Prover to generate a STARK proof of that execution. This proof can later be verified by a Verifier.

The following chapters will go deep inside the inner workings of the Cairo VM. We'll cover its architecture, its memory model, and its execution model. Next, we'll explore builtins and hints, their purpose, and how they work. Finally, we'll look at the runner, which orchestrates the execution of a Cairo program.

## Virtual Machine

Virtual Machines (VMs) are software emulations of physical computers. They provide a complete programming environment through an API which includes everything required for the correct execution of programs above it.

Every virtual machine API includes an instruction set architecture (ISA) in which to express programs. It could be the same instruction set as some physical machine (e.g. RISC-V), or a dedicated one implemented in the VM (e.g. Cairo assembly, CASM).

Those that emulate an OS are called _System Virtual Machines_, such as Xen and VMWare. We're not interested in them here.

The other ones we're interested in are _Process Virtual Machines_. They provide the environment needed by a single user-level process.

### Process Virtual Machines (Example: JVM)

The most well-known process VM might be the Java Virtual Machine (JVM).

- Given a Java program `prgm.java`, it is compiled into a class `prgm.class`, containing _Java bytecode_ (JVM instructions and metadata).
- The JVM verifies that the bytecode is safe to run.
- The bytecode is either interpreted (slow) or compiled to machine code just in time (JIT, fast).
- If using JIT, the bytecode is translated to machine code while executing the program.
- Java programs could also be directly compiled to a specific CPU architecture (read machine code) through a process called _ahead-of-time compilation_ (AOT).

### Process Virtual Machines (Cairo VM)

The Cairo VM is also a process VM, similar to the JVM, with one significant difference: Java and its JVM are designed for (platform-independent) general-purpose computing, while Cairo and its Cairo VM are specifically designed for (platform-independent) _provable_ general-purpose computing.

- A Cairo program `prgm.cairo` is compiled into compilation artifacts `prgm.json`, containing _Cairo bytecode_ (encoded CASM, the Cairo instruction set, and extra data).
- As seen in the [introduction](ch00-00-introduction.md), Cairo Zero directly compiles to CASM while Cairo first compiles to _Sierra_ and then to a safe subset of CASM.
- The Cairo VM _interprets_ the provided CASM and generates a trace of the program execution.
- The obtained trace data can be fed to the Cairo Prover in order to generate a STARK proof, allowing to prove the correct execution of the program. Creating this _validity proof_ is the main purpose of Cairo.

Cairo VM Architecture and Instruction Set

# Cairo VM Architecture and Instruction Set

Cairo is a STARK-friendly Von Neumann architecture designed for generating validity proofs for arbitrary computations. It is optimized for the STARK proof system but compatible with other backends. The Cairo Virtual Machine (CairoVM) is a core component of the Cairo ecosystem, responsible for processing compilation artifacts and executing instructions.

## Cairo VM Components

The Cairo ecosystem consists of three main components:

1.  **The Cairo compiler**: Transforms Cairo source code into Cairo bytecode, also known as compilation artifacts.
2.  **The Cairo Virtual Machine (CairoVM)**: Executes the compilation artifacts, producing the Arithmetic Intermediate Representation (AIR) private input (witness) and AIR public input required for proof generation.
3.  **The Cairo prover and verifier**: Verifies that the constraints defined by the Cairo AIR hold for the CairoVM outputs.

## Cairo Machine

The Cairo machine is a theoretical model defining a Von Neumann architecture for proving arbitrary computations. It is characterized by two core models:

- **CPU (Execution Model)**: Specifies the Instruction Set Architecture (ISA), including the instruction set, registers (`pc`, `ap`, `fp`), and the state transition algorithm.
- **Memory Model**: Defines how the CPU interacts with memory, which stores both program and instruction data.

Cairo implements a custom zero-knowledge ISA (ZK-ISA) optimized for proof generation and verification, unlike general-purpose ISAs.

### Deterministic and Non-deterministic Cairo Machine

The Cairo machine exists in two versions:

- **Deterministic machine**: Used by the prover. It takes a trace and memory, verifying state transitions. It returns `accept` if all transitions are valid, `reject` otherwise.
- **Non-deterministic machine**: Used by the verifier. It relies on the deterministic machine and takes the initial state.

## Instructions and Opcodes

A Cairo **instruction** is a 64-bit field element representing a single computational step. It contains three 16-bit signed offsets (`off_dst`, `off_op0`, `off_op1`) and 15 boolean flags that dictate register usage for addressing, arithmetic operations, and register updates (`pc`, `ap`, `fp`).

The VM supports three primary opcodes:

1.  **`CALL`**: Initiates a function call, saving the current context (`fp` and return `pc`) to the stack.
2.  **`RET`**: Executes a function return, restoring the caller's context from the stack.
3.  **`ASSERT_EQ`**: Enforces an equality constraint.

## Cairo Assembly (CASM)

CASM is the human-readable assembly language for Cairo, representing machine instructions. Developers write in high-level Cairo, and the compiler translates it into CASM. CASM instructions can also be written manually, with examples like `[fp + 1] = [ap - 2] + 5` or `jmp rel 17 if [ap] != 0`.

Cairo VM Memory Model

# Cairo VM Memory Model

The Cairo VM memory model is designed to efficiently represent memory values for STARK proof generation. It possesses two primary characteristics:

### Non-Determinism

In Cairo, memory addresses and their values are not managed by a traditional memory system. Instead, the prover asserts the location and the values stored at those addresses. This means the prover directly states "at memory address X, the value Y is stored," eliminating the need for explicit checks as found in read-write memory models.

### Read-Only and Write-Once

Cairo's memory is read-only, meaning values do not change once set during program execution. This effectively makes it a write-once memory model: once a value is assigned to an address, it cannot be overwritten. Subsequent operations are limited to reading or verifying the existing value.

### Contiguous Memory Space

The memory address space in Cairo is contiguous. If a program accesses memory addresses `x` and `y`, it cannot skip any addresses located between `x` and `y`.

### Relocatable Values and Contiguous Address Space

Relocatable values, which are initially stored in different segments, are transformed into a single contiguous memory address space using a relocation table. This table provides context by mapping segment identifiers to their starting indices.

For instance, a program might output values stored across different segments. After execution, these are resolved into a linear address space.

**Example Relocatable Values:**

```
Addr  Value

// Segment 0
0:0   5189976364521848832
0:1   10
0:2   5189976364521848832
0:3   100
0:4   5201798304953696256
0:5   5191102247248822272
0:6   5189976364521848832
0:7   110
0:8   4612389708016484351
0:9   5198983563776458752
0:10  1
0:11  2345108766317314046
⋮
// Segment 1
1:0   2:0
1:1   3:0
1:2   4:0
1:3   10
1:4   100
1:5   110
1:6   2:0
1:7   110
1:8   2:1
⋮
// Segment 2
2:0   110
```

**From Relocation Value to One Contiguous Memory Address Space:**

```
Addr  Value
-----------
1     5189976364521848832
2     10
3     5189976364521848832
4     100
5     5201798304953696256
6     5191102247248822272
7     5189976364521848832
8     110
9     4612389708016484351
10    5198983563776458752
11    1
12    2345108766317314046
13    22
14    23
15    23
16    10
17    100
18    110
19    22
20    110
21    23
22    110
```

**Relocation Table:**

```
segment_id  starting_index
----------------------------
0            1
1            13
2            22
3            23
4            23
```

Cairo Intermediate Representations and the VM

# Cairo Intermediate Representations and the VM

Starting with Starknet Alpha v0.11.0, compiled Cairo contracts produce an intermediate representation called Safe Intermediate Representation (Sierra). The sequencer then compiles Sierra into Cairo Assembly (Casm) for execution by the Starknet OS.

## Why Casm?

Starknet, as a validity rollup, requires proofs for block execution. STARK proofs operate on polynomial constraints. Cairo bridges this gap by translating Cairo instructions into polynomial constraints that enforce correct execution according to its defined semantics, enabling the proof of block validity.

## Sierra Code Structure

A Sierra file consists of three main parts:

1.  **Type and libfunc declarations**: Defines the types and library functions used.
2.  **Statements**: The core instructions of the program.
3.  **Function declarations**: Declares the functions within the program.

The statements in the Sierra code directly correspond to the order of function declarations.

### Example Sierra Code Breakdown

Consider the following Sierra code:

```cairo,noplayground
// type declarations
type felt252 = felt252 [storable: true, drop: true, dup: true, zero_sized: false]

// libfunc declarations
libfunc function_call<user@main::main::not_inlined> = function_call<user@main::main::not_inlined>
libfunc felt252_const<1> = felt252_const<1>
libfunc store_temp<felt252> = store_temp<felt252>
libfunc felt252_add = felt252_add
libfunc felt252_const<2> = felt252_const<2>

// statements
00 function_call<user@main::main::not_inlined>() -> ([0])
01 felt252_const<1>() -> ([1])
02 store_temp<felt252>([1]) -> ([1])
03 felt252_add([1], [0]) -> ([2])
04 store_temp<felt252>([2]) -> ([2])
05 return([2])
06 felt252_const<1>() -> ([0])
07 store_temp<felt252>([0]) -> ([0])
08 return([0])
09 felt252_const<2>() -> ([0])
10 store_temp<felt252>([0]) -> ([0])
11 return([0])

// funcs
main::main::main@0() -> (felt252)
main::main::inlined@6() -> (felt252)
main::main::not_inlined@9() -> (felt252)
```

This code demonstrates:

- The `main` function starts at line 0 and returns a `felt252` on line 5.
- The `inlined` function starts at line 6 and returns a `felt252` on line 8.
- The `not_inlined` function starts at line 9 and returns a `felt252` on line 11.

The statements for the `main` function are located between lines 0 and 5:

```cairo,noplayground
00 function_call<user@main::main::not_inlined>() -> ([0])
01 felt252_const<1>() -> ([1])
02 store_temp<felt252>([1]) -> ([1])
03 felt252_add([1], [0]) -> ([2])
04 store_temp<felt252>([2]) -> ([2])
05 return([2])
```

Cairo VM Architecture and Components

Introduction to Cairo VM and its Purpose

# Introduction to Cairo VM and its Purpose

Cairo Language and Provability

# Cairo Language and Provability

## Sierra and Provability

Sierra acts as an intermediary layer between user code and the provable statement, ensuring that all transactions are eventually provable.

### Safe Casm

The mechanism by which Sierra guarantees provability is by compiling Sierra instructions into a subset of Casm known as "safe Casm." The critical property of safe Casm is its provability for all possible inputs.

A key consideration in designing the Sierra to Casm compiler is handling potential failures gracefully. For instance, using `if/else` instructions is preferred over `assert` to ensure that all failures are handled without breaking provability.

#### Example: `find_element` Function

Consider the `find_element` function from the Cairo Zero common library:

```cairo
func find_element{range_check_ptr}(array_ptr: felt*, elm_size, n_elms, key) -> (elm_ptr: felt*) {
    alloc_locals;
    local index;
    % {
        ...
    %}
    assert_nn_le(a=index, b=n_elms - 1);
    tempvar elm_ptr = array_ptr + elm_size * index;
    assert [elm_ptr] = key;
    return (elm_ptr=elm_ptr);
}
```

This function, as written, can only execute correctly if the requested element exists within the array. If the element is not found, the `assert` statements would fail for all possible hint values, rendering the code non-provable.

The Sierra to Casm compiler is designed to prevent the generation of such non-provable Casm. Furthermore, simply substituting `assert` with `if/else` is insufficient, as it can lead to non-deterministic execution, where the same input might produce different results depending on hint values.

Cairo VM Memory Model

# Cairo VM Memory Model

Cairo's memory model is designed for efficiency in proof generation, differing from the EVM's read-write model. It requires only 5 trace cells per memory access, making the cost proportional to the number of accesses rather than addresses used. Rewriting to an existing memory cell has a similar cost to writing to a new one. This model simplifies proving program correctness by enforcing immutability of allocated memory after the first write.

## Introduction to Segments

Cairo organizes memory addresses into **segments**, allowing dynamic expansion of memory segments at runtime while ensuring allocated memory remains immutable.

1.  **Relocatable Values**: During runtime, memory addresses are grouped into segments, each with a unique identifier and an offset, represented as `<segment_id>:<offset>`.
2.  **Relocation Table**: At the end of execution, these relocatable values are transformed into a single, contiguous memory address space, with a separate relocation table providing context.

### Segment Values

Cairo's memory model includes the following segments:

- **Program Segment**: Stores the bytecode (instructions) of a Cairo program. The Program Counter (`pc`) starts here.
- **Execution Segment**: Stores runtime data such as temporary variables, function call frames, and pointers. The Allocation Pointer (`ap`) and Frame Pointer (`fp`) start here.
- **Builtin Segment**: Stores actively used builtins. Each builtin has its own dynamically allocated segment.
- **User Segment**: Stores program outputs, arrays, and dynamically allocated data structures.

All segments except the Program Segment have dynamic address spaces. The Program Segment has a fixed size during execution.

### Segment Layout

The segments are ordered in memory as follows:

1.  **Segment 0**: Program Segment
2.  **Segment 1**: Execution Segment
3.  **Segment 2 to x**: Builtin Segments (dynamic)
4.  **Segment x + 1 to y**: User Segments (dynamic)

The number of builtin and user segments varies depending on the program.

# Relocation Example

The following Cairo Zero program demonstrates segment definition and relocation:

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

This example shows values being allocated to Segment 1 using the `ap` (allocation pointer). The `output_ptr` is set to a memory address, and an assertion verifies its value. Finally, the updated `output_ptr` is returned. At the end of execution, these relocatable values are converted into a contiguous memory space.

Cairo VM Execution and Performance

# Cairo VM Execution and Performance

The state of the Cairo VM at any step `i` is defined by the tuple `(pc_i, ap_i, fp_i)`. The **state transition function** deterministically computes the next state `(pc_{i+1}, ap_{i+1}, fp_{i+1})` based on the current state and the instruction fetched from memory, mirroring a CPU's fetch-decode-execute cycle.

Each step of the execution is an atomic process that checks one instruction and enforces its semantics as algebraic constraints within the Cairo AIR. For instance, an instruction might load values from memory, perform an operation (add, multiply), write the result to memory, and update registers like `pc` and `ap`.

These transition rules are deterministic. If at any point the constraints are not satisfied (e.g., an illegal state transition), the execution cannot be proven.

## Builtins

Builtins are predefined, optimized low-level execution units embedded within the Cairo architecture. They significantly enhance performance compared to implementing the same logic using Cairo's instruction set.

Cairo VM CPU and Instructions

# Cairo VM CPU and Instructions

The Cairo VM CPU architecture dictates instruction processing and state changes, mirroring a physical CPU. It operates on a Von Neumann architecture, with instructions and data sharing the same memory space. The execution follows a **fetch-decode-execute cycle**.

## Registers

Registers are high-speed storage locations crucial for immediate data processing. The Cairo VM's state is defined by three registers:

- **`pc` (Program Counter)**: Stores the memory address of the next instruction. It typically increments after each instruction but can be modified by jump or call instructions.
- **`ap` (Allocation Pointer)**: Acts as a stack pointer, usually indicating the next available memory cell. Instructions often increment `ap` by 1.
- **`fp` (Frame Pointer)**: Provides a fixed reference for the current function's stack frame, allowing access to arguments and return addresses at stable negative offsets from `fp`. `fp` is set to the current `ap` value upon function calls.

Cairo VM Builtins

Introduction to Cairo VM Builtins

# Introduction to Cairo VM Builtins

Builtins in the Cairo VM are analogous to Ethereum precompiles, representing primitive operations implemented in the client's language rather than EVM opcodes. The Cairo architecture allows for flexible addition or removal of builtins, leading to different layouts. Builtins add constraints to the CPU AIR, which can increase verification time.

## How Builtins Work

A builtin enforces constraints on Cairo memory to perform specific tasks, such as computing a hash. Each builtin operates on a dedicated memory segment, accessible via memory-mapped I/O, where specific memory address ranges are dedicated to builtins. Interaction with a builtin occurs by reading or writing to these corresponding memory cells.

Builtin constraints are categorized into two main types: "validation property" and "deduction property." Builtins with a deduction property are typically split into blocks of cells, where some cells are constrained by a validation property. If a defined property does not hold, the Cairo VM will panic.

### Validation Property

A validation property defines the constraints a value must satisfy before being written to a builtin's memory cell. For instance, the Range Check builtin only accepts felts within the range `[0, 2**128)`. Writing a value to the Range Check builtin is only permitted if these constraints are met.

## Builtins List

The Cairo VM implements several builtins, each with a specific purpose. The following table outlines these builtins:

| Builtin     | Description                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------- |
| Output      | Stores public memory required for STARK proof generation (input/output values, builtin pointers, etc.). |
| Pedersen    | Computes the Pedersen hash `h` of two felts `a` and `b` (`h = Pedersen(a, b)`).                         |
| Range Check | Verifies that a felt `x` is within the bounds `[0, 2**128)`.                                            |
| ECDSA       | Verifies ECDSA signatures for a given public key and message. Primarily used by Cairo Zero.             |

Hashing Builtins

# Hashing Builtins

## Pedersen Builtin

The Pedersen builtin computes the Pedersen hash of two field elements (felts) efficiently within the Cairo VM.

### Cells Organization

The Pedersen builtin uses a dedicated segment organized in triplets of cells: two input cells and one output cell.

- **Input cells**: Must store field elements (felts). Relocatable values (pointers) are not allowed.
- **Output cell**: The value is deduced from the input cells. When an output cell is read, the VM computes the Pedersen hash of the two input cells and writes the result.

**Example Snapshots:**

- **Valid State**: Input cells contain felts, and the output cell has been computed after being read.
- **Pending Computation**: Input cells are filled, but the output cell is empty as it hasn't been read yet.

## Keccak Builtin

The Keccak builtin implements the core functionality of the SHA-3 family of hash functions, specifically the keccak-f1600 permutation, which is crucial for Ethereum compatibility.

### Cells Organization

The Keccak builtin utilizes a dedicated memory segment structured in blocks of 16 consecutive cells:

- **First 8 cells**: Store the 1600-bit input state `s`, with each cell holding 200 bits.
- **Next 8 cells**: Store the 1600-bit output state `s'`, with each cell holding 200 bits.

### Rules and Operations

1.  **Input Validation**: Each input cell must contain a valid field element (0 ≤ value < 2^200).
2.  **Lazy Computation**: The output state is computed only when an output cell is accessed.
3.  **Caching**: Computed results are cached to avoid redundant calculations for subsequent accesses within the same block.

Cryptographic Builtins

# Cryptographic Builtins

This section details the cryptographic builtins available in the Cairo VM, which are essential for performing cryptographic operations efficiently.

## ECDSA Builtin

The ECDSA (Elliptic Curve Digital Signature Algorithm) builtin is used to verify cryptographic signatures on the STARK curve, primarily to validate that a message hash was signed by the holder of a specific private key.

### Memory Organization

The ECDSA builtin utilizes a dedicated memory segment and a signature dictionary:

1.  **Memory Segment**: Stores public keys and message hashes as field elements.
    - **Cell Layout**:
      - Even offsets (`2n`): Store public keys.
      - Odd offsets (`2n+1`): Store message hashes.
      - A public key at offset `2n` pairs with a message hash at offset `2n+1`.
2.  **Signature Dictionary**: Maps public key offsets to their corresponding signatures.

### Signature Verification Process

Signatures must be registered in the signature dictionary before use. The VM verifies signatures when values are written to the ECDSA segment:

- Writing a public key at offset `2n` checks if it matches the signature's key.
- Writing a message hash at offset `2n+1` verifies it against the signed hash.
- Failures result in immediate VM errors.

## EC OP Builtin

The EC OP (Elliptic Curve Operation) builtin performs elliptic curve operations on the STARK curve, specifically computing `R = P + mQ`, where P and Q are points on the curve and m is a scalar.

### Cells Organization

Each EC OP operation uses a block of 7 cells:

- **Input Cells (Offsets 0-4)**:
  - `0`: P.x coordinate
  - `1`: P.y coordinate
  - `2`: Q.x coordinate
  - `3`: Q.y coordinate
  - `4`: m scalar value
- **Output Cells (Offsets 5-6)**:
  - `5`: R.x coordinate
  - `6`: R.y coordinate

The VM computes the output coordinates when the output cells are read, provided all input cells contain valid field elements. Incomplete or invalid input values will cause the builtin to fail.

## Keccak Builtin

The Keccak builtin computes the Keccak-256 hash of a given input.

### Syntax

```cairo,noplayground
pub extern fn keccak_syscall(
    input: Span<u64>,
) -> SyscallResult<u256> implicits(GasBuiltin, System) nopanic;
```

### Description

Computes the Keccak-256 hash of a `Span<u64>` input and returns the hash as a `u256`.

### Error Conditions

The Keccak builtin throws an error if:

- Any input cell value exceeds 200 bits (≥ 2^200).
- Any input cell contains a relocatable value (pointer).
- An output cell is read before all eight input cells are initialized.

## Poseidon Builtin

The Poseidon builtin is a hash function optimized for zero-knowledge proof systems, offering a balance between security and efficiency.

Arithmetic and Bitwise Builtins

# Arithmetic and Bitwise Builtins

## Bitwise Builtin

The Bitwise Builtin in the Cairo VM supports bitwise operations: AND (`&`), XOR (`^`), and OR (`|`) on field elements. It operates on a dedicated memory segment using a 5-cell block for each operation: input `x`, input `y`, output `x & y`, output `x ^ y`, and output `x | y`.

### Example Usage

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

## Arithmetic Builtins (AddMod, MulMod)

The `AddMod` and `MulMod` builtins support modular arithmetic operations. They work with `UInt384` types, which are represented as four 96-bit words, aligning with the `range_check96` builtin.

### AddMod

`AddMod` computes modular addition `c ≡ a + b mod(p)`. It has a limited quotient `k` (typically 0 or 1) because the sum of two numbers near the modulus `p` does not exceed `2p - 2`.

### MulMod

`MulMod` computes modular multiplication `c ≡ a * b mod(p)`. It supports a higher quotient bound (up to `2^384`) to handle potentially large products. It uses the extended GCD algorithm for deduction, flagging `ZeroDivisor` errors if `b` and `p` are not coprime.

### Example Usage (AddMod)

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

Memory and Output Builtins

# Memory and Output Builtins

The **Output Builtin** in the Cairo VM manages the output segment of memory using the `output_ptr`. It acts as a bridge to the external world through public memory, enabling verifiable outputs.

## Memory Organization

The output segment is a contiguous block of cells, starting at a base address. All cells within this segment are public and can be written to and read from without specific constraints. The segment grows as the program writes values.

## Role in STARK Proofs

The Output Builtin's integration with public memory is crucial for STARK proof construction and verification:

1.  **Public Commitment**: Values written to `output_ptr` are committed in the public memory as part of the proof.
2.  **Proof Structure**: The output segment is included in the public input of a trace, with its boundaries tracked for verification.
3.  **Verification Process**: Verifiers hash the output segment to create a commitment, allowing verification without re-execution.

## Implementation References

References for the Output Builtin implementation:

- [TypeScript Output Builtin](https://github.com/kkrt-labs/cairo-vm-ts/blob/58fd07d81cff4a4bb45c30ab99976ba66f0576ad/src/builtins/output.ts#L4)
- [Python Output Builtin](https://github.com/starkware-libs/cairo-lang/blob/0e4dab8a6065d80d1c726394f5d9d23cb451706a/src/starkware/cairo/lang/vm/output_builtin_runner.py)

Builtin Properties, Errors, and Implementations

# Builtin Properties, Errors, and Implementations

## Pedersen Builtin

### Errors

1.  **Missing Input Data**: Reading cell 3:2 throws an error if an input cell (e.g., 3:0) is empty, as the VM cannot compute a hash without complete input.
2.  **Relocatable Values**: Reading cell 3:5 throws an error if an input cell (e.g., 3:4) contains a relocatable value (memory address), as the Pedersen builtin only accepts field elements.

These errors manifest when the output cell is read. A more robust implementation could validate input cells upon writing to reject relocatable values immediately.

### Implementation References

- [TypeScript Pedersen Builtin](https://github.com/kkrt-labs/cairo-vm-ts/blob/58fd07d81cff4a4bb45c30ab99976ba66f0576ad/src/builtins/pedersen.ts#L4)
- [Python Pedersen Builtin](https://github.com/starkware-libs/cairo-lang/blob/0e4dab8a6065d80d1c726394f5d9d23cb451706a/src/starkware/cairo/lang/builtins/hash/hash_builtin_runner.py)
- [Rust Pedersen Builtin](https://github.com/lambdaclass/cairo-vm/blob/41476335884bf600b62995f0c005be7d384eaec5/vm/src/vm/runners/builtin_runner/hash.rs)
- [Go Pedersen Builtin](https://github.com/NethermindEth/cairo-vm-go/blob/dc02d614497f5e59818313e02d2d2f321941cbfa/pkg/vm/builtins/pedersen.go)
- [Zig Pedersen Builtin](https://github.com/keep-starknet-strange/ziggy-starkdust/blob/55d83e61968336f6be93486d7acf8530ba868d7e/src/vm/builtins/builtin_runner/hash.zig)

## Range Check Builtin

### Properties

- **Validation Timing**: Validates values immediately upon cell write, unlike builtins with deduction properties.

### Valid Operation Example

- Writes `0`, `256`, and `2^128-1` to the Range Check segment, all within the permitted range `[0, 2^128-1]`.

### Errors

1.  **Out-of-Range Error**: Occurs when attempting to write a value exceeding the maximum allowed (`2^128`).
2.  **Invalid Type Error**: Occurs when attempting to write a relocatable address (memory pointer) instead of a field element.

### Implementation References

- [TypeScript Signature Builtin](https://github.com/kkrt-labs/cairo-vm-ts/blob/58fd07d81cff4a4bb45c30ab99976ba66f0576ad/src/builtins/ecdsa.ts)
- [Python Signature Builtin](https://github.com/starkware-libs/cairo-lang/blob/0e4dab8a6065d80d1c726394f5d9d23cb451706a/src/starkware/cairo/lang/builtins/signature/signature_builtin_runner.py)
- [Rust Signature Builtin](https://github.com/lambdaclass/cairo-vm/blob/41476335884bf600b62995f0c005be7d384eaec5/vm/src/vm/runners/builtin_runner/signature.rs)
- [Go Signature Builtin](https://github.com/NethermindEth/cairo-vm-go/blob/dc02d614497f5e59818313e02d2d2f321941cbfa/pkg/vm/builtins/ecdsa.go)
- [Zig Signature Builtin](https://github.com/keep-starknet-strange/ziggy-starkdust/blob/55d83e61968336f6be93486d7acf8530ba868d7e/src/vm/builtins/builtin_runner/signature.zig)

## ECDSA Signature Builtin

### Errors

1.  **Hash Mismatch**: An error occurs if the hash written at an offset does not match the hash originally signed with a given public key.
2.  **Invalid Public Key**: An error occurs if the public key written at an offset does not match the public key used to create the signature.

### Implementation References

- [TypeScript Signature Builtin](https://github.com/kkrt-labs/cairo-vm-ts/blob/58fd07d81cff4a4bb45c30ab99976ba66f0576ad/src/builtins/ecdsa.ts)
- [Python Signature Builtin](https://github.com/starkware-libs/cairo-lang/blob/0e4dab8a6065d80d1c726394f5d9d23cb451706a/src/starkware/cairo/lang/builtins/signature/signature_builtin_runner.py)
- [Rust Signature Builtin](https://github.com/lambdaclass/cairo-vm/blob/41476335884bf600b62995f0c005be7d384eaec5/vm/src/vm/runners/builtin_runner/signature.rs)
- [Go Signature Builtin](https://github.com/NethermindEth/cairo-vm-go/blob/dc02d614497f5e59818313e02d2d2f321941cbfa/pkg/vm/builtins/ecdsa.go)
- [Zig Signature Builtin](https://github.com/keep-starknet-strange/ziggy-starkdust/blob/55d83e61968336f6be93486d7acf8530ba868d7e/src/vm/builtins/builtin_runner/signature.zig)

## Poseidon Builtin

### Hashing Examples

- **Single Value Hashing**: Takes an initial state (e.g., `(42, 0, 0)`), applies padding `(43, 0, 0)`, computes the Hades permutation, and stores the result in an output cell. The first component of the result is the hash output.
- **Sequence Hashing**: For inputs `(73, 91)`, the VM takes the state `(73, 91, 0)`, applies padding `(73, 91+1, 0)`, computes the Hades permutation, and stores all three resulting components in output cells. These can be used for further computation or chaining.

### Error Condition

- **Relocatable Value Input**: An error occurs when trying to write a relocatable value (memory address) to an input cell, as the Poseidon builtin only operates on field elements. Input validation happens upon reading the output.

### Implementation References

- [TypeScript Poseidon Builtin](https://github.com/kkrt-labs/cairo-vm-ts/blob/58fd07d81cff4a4bb45c30ab99976ba66f0576ad/src/builtins/poseidon.ts)
- [Python Poseidon Builtin](https://github.com/starkware-libs/cairo-lang/blob/0e4dab8a6065d80d1c726394f5d9d23cb451706a/src/starkware/cairo/lang/builtins/poseidon/poseidon_builtin_runner.py)

## Mod Builtin (AddMod, MulMod)

### Operation Example (AddMod)

- Takes `UInt384` values `x`, `y`, and modulus `p`.
- Writes `x` and `y` to the values table.
- Uses offsets `[0, 4, 8]` to point to `x`, `y`, and the result `c`.
- `run_mod_p_circuit` computes `x + y (mod p)` and stores the result at offset 8.
- Example: `p = 5`, `x = 3`, `y = 4`. Values table `[3, 4, 2]`. `3 + 4 = 7`, `7 mod 5 = 2`, matching `c`.

### Errors

- **Missing Operand**: If `x` is missing a word.
- **Zero Divisor**: If `b` and `p` are not coprime for `MulMod` and `a` is unknown.
- **Range Check Failure**: If any word exceeds `2^96`.

## Segment Arena Builtin

### Segment Arena States

- **Valid State (Snapshot 1)**: Demonstrates dictionary allocation where `info_ptr` points to a new info segment, `n_dicts` increments, the info segment grows, and a new dictionary segment `<3:0>` is allocated.
- **Valid State (Snapshot 2)**: Shows allocation of another dictionary, info segment growth, squashed dictionaries with end addresses set, sequential squashing indices, and unfinished dictionaries with `0` end addresses.

### Error Conditions

1.  **Invalid State (Non-relocatable `info_ptr`)**: Occurs when `info_ptr` contains a non-relocatable value (e.g., `ABC`), triggering an error upon accessing the info segment.
2.  **Inconsistent State**: Occurs when `n_squashed` is greater than `n_segments`.

### Key Validation Rules

- Each segment must be allocated and finalized exactly once.
- All cell values must be valid field elements.
- Segment sizes must be non-negative.
- Squashing operations must maintain sequential order.
- Info segment entries must correspond to segment allocations.

### Implementation References

- [TypeScript Segment Arena Builtin](https://github.com/kkrt-labs/cairo-vm-ts/blob/58fd07d81cff4a4bb45c30ab99976ba66f0576ad/src/builtins/segment_arena.ts)
- [Python Segment Arena Builtin](https://github.com/starkware-libs/cairo-lang/blob/0e4dab8a6065d80d1c726394f5d9d23cb451706a/src/starkware/cairo/lang/builtins/segment_arena/segment_arena_builtin_runner.py)
- [Rust Segment Arena Builtin](https://github.com/lambdaclass/cairo-vm/blob/41476335884bf600b62995f0c005be7d384eaec5/vm/src/vm/runners/builtin_runner/segment_arena.rs)
- [Go Segment Arena Builtin](https://github.com/NethermindEth/cairo-vm-go/blob/dc02d614497f5e59818313e02d2d2f321941cbfa/pkg/vm/builtins/segment_arena.go)
- [Zig Segment Arena Builtin](https://github.com/keep-starknet-strange/ziggy-starkdust/blob/55d83e61968336f6be93486d7acf8530ba868d7e/src/vm/builtins/builtin_runner/segment_arena.zig)

Hints and the Cairo Runner

# Hints and the Cairo Runner

Cairo supports nondeterministic programming through "hints," which allow the prover to set memory values. This mechanism accelerates operations that are cheaper to verify than to execute, such as complex arithmetic, by having the prover compute the result and constraining it. Hints are not part of the proved trace, making their execution "free" from the verifier's perspective. However, constraints are crucial to ensure the prover's honesty and prevent security issues from underconstrained programs.

## Hints in Cairo

Smart contracts written in Cairo cannot contain user-defined hints. The hints used are determined by the Sierra to Casm compiler, which ensures only "safe" Casm is generated. While future native Cairo might support hints, they will not be available in Starknet smart contracts.

Security considerations arise with hints, particularly concerning gas metering. If a user lacks sufficient gas for an "unhappy flow" (e.g., searching for an element that isn't present), a malicious prover could exploit this to lie about the outcome. The proposed solution is to require users to have enough gas for the unhappy flow before execution.

## The Cairo Runner

The Cairo Runner orchestrates the execution of compiled Cairo programs, implementing the Cairo machine's memory, execution, builtins, and hints. It is written in Rust by LambdaClass and is available as a standalone binary or library.

### Runner Modes

The Cairo Runner operates in two primary modes:

- **Execution Mode:** This mode executes the program to completion, including hints and VM state transitions. It's useful for debugging and testing logic without the overhead of proof generation. The output includes the execution trace, memory state, and register states. The runner halts if any hint or instruction check fails.
- **Proof Mode:** This mode executes the program and prepares the necessary inputs for proof generation. It records the VM state at each step to build the execution trace and final memory. After execution, the memory dump and sequential register states can be extracted to form the execution trace for proof generation.

Cairo Language Features and Resources

Cairo Language Features and Attributes

# Cairo Language Features and Attributes

Cairo provides several attributes that offer hints to the compiler or enable specific functionalities:

| Attribute                            | Description                                                                                                           |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `#[inline(never)]`                   | Hints to the compiler to never inline the annotated function.                                                         |
| `#[must_use]`                        | Hints to the compiler that the return value of a function or a specific returned type must be used.                   |
| `#[generate_trait]`                  | Automatically generates a trait for an `impl`.                                                                        |
| `#[available_gas(...)]`              | Sets the maximum amount of gas available to execute a function.                                                       |
| `#[panic_with('...', wrapper_name)]` | Creates a wrapper for the annotated function that panics with the given data if the function returns `None` or `Err`. |
| `#[test]`                            | Marks a function as a test function.                                                                                  |
| `#[cfg(...)]`                        | A configuration attribute, commonly used to configure a `tests` module with `#[cfg(test)]`.                           |
| `#[should_panic]`                    | Specifies that a test function should necessarily panic.                                                              |

## Hashing with `Hash`

The `Hash` trait can be derived on structs and enums, allowing them to be hashed easily. For a type to derive `Hash`, all its fields or variants must also be hashable. More information is available in the [Hashes section](ch12-04-hash.md).

## Starknet Storage with `starknet::Store`

Relevant for Starknet development, the `starknet::Store` trait enables a type to be used in smart contract storage by automatically implementing necessary read and write functions. Detailed information can be found in the [Contract storage section](ch101-01-00-contract-storage.md).

## Implementing Arithmetic Circuits in Cairo

Cairo's circuit constructs are available in the `core::circuit` module. Arithmetic circuits utilize builtins like `AddMod` and `MulMod` for operations modulo a prime `p`. This enables the creation of basic arithmetic gates: `AddModGate`, `SubModGate`, `MulModGate`, and `InvModGate`.

An example of a circuit computing \\(a \cdot (a + b)\\\) over the BN254 prime field is provided:

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
    let a = CircuitElement::<CircuitInput<0>> {};
    let b = CircuitElement::<CircuitInput<1>> {};
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
#     assert(add_output == u384 { limb0: 30, limb1: 0, limb2: 0, limb3: 0 }, 'add_output');
#     assert(circuit_output == u384 { limb0: 300, limb1: 0, limb2: 0, limb3: 0 }, 'circuit_output');
#
#     (add_output, circuit_output)
# }
#
# #[executable]
# fn main() {
#     eval_circuit();
# }
```

## Cairo Prelude

The Cairo prelude is a collection of commonly used modules, functions, data types, and traits that are automatically available in every Cairo module. It includes primitive data types (integers, bools, arrays, dicts), traits for operations (arithmetic, comparison, serialization), operators, and utility functions for common tasks. The prelude is defined in the `lib.cairo` file of the corelib crate.

Cairo's Core Libraries and Data Handling

# Cairo's Core Libraries and Data Handling

Cairo Editions and Prelude Management

# Cairo Editions and Prelude Management

The core library prelude provides fundamental programming constructs and operations for Cairo programs, making them available without explicit imports. This enhances developer experience by preventing repetition.

## Prelude Versions and Editions

You can select the prelude version by specifying the edition in your `Scarb.toml` file. For example, `edition = "2024_07"` loads the prelude from July 2024. New projects created with `scarb new` automatically include `edition = "2024_07"`. Different prelude versions expose different functions and traits, so specifying the correct edition is crucial. It's generally recommended to use the latest edition for new projects and migrate to newer editions as they become available.

### Available Cairo Editions

| Version              | Details                                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `2024-07`            | [details for 2024-07](https://community.starknet.io/t/cairo-v2-7-0-is-coming/114362#the-2024_07-edition-3)                     |
| `2023-11`            | [details for 2023-11](https://community.starknet.io/t/cairo-v2-5-0-is-out/112807#the-pub-keyword-9)                            |
| `2023-10` / `2023-1` | [details for 2023-10](https://community.starknet.io/t/cairo-v2-4-0-is-out/109275#editions-and-the-introduction-of-preludes-10) |

Sierra: The Intermediate Layer for Provability

# Sierra: The Intermediate Layer for Provability

What is proven is the correct Casm execution, regardless of what the user sends to the Starknet sequencer. This necessitates a Sierra -> Casm compiler to translate user code into Casm.

## Why Sierra is Needed

Sierra serves as an additional layer between user code and the provable code (Casm) to address limitations in Cairo and requirements for decentralized L2s.

### Reverted Transactions, Unsatisfiable AIRs, and DoS Attacks

- **Sequencer Compensation:** Sequencers must be compensated for work done, even on reverted transactions. Sending transactions that fail after extensive computation is a DoS attack if the sequencer cannot charge for the work.
- **Provability Limitations:** Sequencers cannot determine if a transaction will fail without executing it (similar to solving the halting problem).
- **Validity Rollups:** Including failed transactions, as done in Ethereum, is not straightforward in validity rollups.
- **Cairo Zero Issues:** Without a separating layer, users could write unprovable code (e.g., `assert 0=1`). Such code translates to unsatisfiable polynomial constraints, halting any Casm execution containing it and preventing proof generation.

AIR: Enabling Program Proofs

# AIR: Enabling Program Proofs

AIR stands for **Arithmetic Intermediate Representation**. It is an arithmetization technique that converts a computational statement into a set of polynomial equations, which form the basis of proof systems like STARKs.

## AIR Inputs and Proof Generation

The AIR's private input consists of the **execution trace** and the **memory**. The public input includes the **initial and final states**, **public memory**, and configuration data. The prover uses these inputs to generate a proof, which the verifier can then check asynchronously.

## AIRs in Cairo

Cairo utilizes a set of AIRs to represent the **Cairo machine**, a Turing-complete machine for the Cairo ISA. This allows for the proving of arbitrary code executed on the Cairo machine. Each component of the Cairo machine, such as the CPU, Memory, and Builtins, has a corresponding AIR. Writing efficient AIRs is crucial for the performance of proof generation and verification.

Applications of Cairo

# Applications of Cairo

Cairo Whitepaper Summary

# Cairo Whitepaper Summary

## The Cairo whitepaper

The original paper introducing Cairo by StarkWare explains Cairo as a language for writing provable programs, details its architecture, and shows how it enables scalable, verifiable computation without relying on trusted setups. You can find the paper at [https://eprint.iacr.org/2021/1063.pdf](https://eprint.iacr.org/2021/1063.pdf).
