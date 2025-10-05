---

Sources:

- https://www.starknet.io/cairo-book/ch00-00-introduction.html
- https://www.starknet.io/cairo-book/ch00-01-foreword.html
- https://www.starknet.io/cairo-book/
- https://www.starknet.io/cairo-book/ch100-00-introduction-to-smart-contracts.html
- https://www.starknet.io/cairo-book/title-page.html

---

# Introduction to Cairo and The Cairo Book

## Book Overview and Resources

This version of the text assumes you’re using Cairo version 2.12.0 and Starknet Foundry version 0.48.0. The book is open source, supported by the Cairo Community, StarkWare, and Voyager.

Additional resources for mastering Cairo include:
*   **The Cairo Playground**: A browser-based environment for writing, compiling, debugging, and proving Cairo code without setup. It shows compilation into Sierra (Intermediate Representation) and Casm (Cairo Assembly).
*   **The Cairo Core Library Docs**: Documentation for the standard set of types, traits, and utilities built into the language.
*   **The Cairo Package Registry**: Hosts reusable libraries like Alexandria and Open Zeppelin Contracts for Cairo, integrated via Scarb.
*   **The Scarb documentation**: Official documentation for Cairo’s package manager and build tool.
*   **The Cairo whitepaper**: Explains Cairo as a language for writing provable programs and its architecture for scalable, verifiable computation.

## What is Cairo?

Cairo is a programming language designed specifically to leverage mathematical proofs for computational integrity, allowing programs to prove they executed correctly, even on untrusted machines.

*   **Foundation**: The language is built on STARK technology, a modern evolution of Probabilistically Checkable Proofs (PCPs), which transforms computational claims into verifiable constraint systems.
*   **Design**: Strongly inspired by Rust, Cairo abstracts away deep cryptographic complexities, allowing developers to focus on program logic while maintaining the full power of STARKs.
*   **Performance**: Powered by a Rust VM and a next-generation prover, Cairo execution and proof generation are very fast.

## Applications and Context

Cairo's primary application today is **Starknet**, a Layer 2 scaling solution for Ethereum.

*   **Scalability**: Starknet addresses the Blockchain Trilemma by offloading complex computations from Ethereum L1. It uses Cairo's proof system where computations are executed off-chain, and a STARK proof is generated. This proof is then verified on L1 using significantly less power than re-executing the computation, enabling massive scalability while maintaining security.
*   **General Purpose**: Beyond blockchain, Cairo can be used for any scenario where computational integrity needs efficient verification across different machines.

## Audience and Prerequisites

This book assumes basic programming knowledge (variables, functions, data structures). Prior Rust experience is helpful but not required.

The book caters to three main audiences with recommended reading paths:
1.  **General-Purpose Developers**: Focus on chapters 1-12 for core language features, avoiding deep smart contract specifics.
2.  **New Smart Contract Developers**: Read the book front to back for a solid foundation in both language and contract development.
3.  **Experienced Smart Contract Developers**: Focus on Cairo basics (Chapters 1-3), the trait/generics system (Chapter 8), and then smart contract development (Chapter 15+).

## References

*   Cairo CPU Architecture: https://eprint.iacr.org/2021/1063
*   Cairo, Sierra and Casm: https://medium.com/nethermind-eth/under-the-hood-of-cairo-1-0-exploring-sierra-7f32808421f5
*   State of non determinism: https://twitter.com/PapiniShahar/status/1638203716535713798

---

Sources:

- https://www.starknet.io/cairo-book/ch01-01-installation.html
- https://www.starknet.io/cairo-book/ch01-00-getting-started.html

---

# Setting Up the Development Environment

### Installing Core Tooling with `starkup`

The first step to setting up the environment is installing Cairo using `starkup`, a command line tool for managing Cairo versions and associated tools. `starkup` installs the latest stable versions of Cairo, Scarb, and Starknet Foundry.

**Scarb** is Cairo's build toolchain and package manager, inspired by Rust's Cargo. It handles building code (pure Cairo or Starknet contracts), dependency management, and provides LSP support for the VSCode Cairo 1 extension.

**Starknet Foundry** is a toolchain supporting features like writing and running tests, deploying contracts, and interacting with the Starknet network.

To install `starkup` on Linux or macOS, run the following command in the terminal:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.starkup.dev | sh
```

If successful, the output will show:
```
starkup: Installation complete.
```

### Verifying Toolchain Installation

After `starkup` completes, verify the installations of Scarb and Starknet Foundry in a new terminal session:

```bash
$ scarb --version
scarb 2.12.0 (639d0a65e 2025-08-04)
cairo: 2.12.0 (https://crates.io/crates/cairo-lang-compiler/2.12.0)
sierra: 1.7.0

$ snforge --version
snforge 0.48.0
```

### Configuring the VSCode Extension

Cairo provides a VSCode extension offering syntax highlighting and code completion. Install it from the VSCode Marketplace. After installation, navigate to the extension settings and ensure the following options are ticked:

*   `Enable Language Server`
*   `Enable Scarb`

---

Sources:

- https://www.starknet.io/cairo-book/ch01-02-hello-world.html
- https://www.starknet.io/cairo-book/ch07-01-packages-and-crates.html

---

## Scarb: Project Creation and Basic Execution

### Creating a Project Directory

You should start by making a directory for your Cairo code. For the examples in this book, making a *cairo_projects* directory in your home directory is suggested.

For Linux, macOS, and PowerShell on Windows, use:

```bash
mkdir ~/cairo_projects
cd ~/cairo_projects
```

For Windows CMD, use:

```cmd
> mkdir "%USERPROFILE%\cairo_projects"
> cd /d "%USERPROFILE%\cairo_projects"
```

### Initializing the Project

Navigate to your project directory and create a new project using Scarb:

```bash
scarb new hello_world
```

Scarb will prompt for a test runner setup; `❯ Starknet Foundry (default)` is generally preferred.

This command creates a directory named *hello_world* containing configuration files and source directories.

### Project Structure and Configuration

After running `scarb new hello_world`, navigate into the directory (`cd hello_world`). Scarb generates a *Scarb.toml* file, a *src* directory with *lib.cairo*, and a *tests* directory (which can be removed for simple executable programs). A Git repository is also initialized.

#### Scarb.toml Manifest

The *Scarb.toml* file uses TOML format for configuration. The initial structure for a Starknet contract project looks like this:

Filename: Scarb.toml

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

# ...
```

For a basic Cairo executable program instead of a contract, you can modify *Scarb.toml* to resemble the following:

Filename: Scarb.toml

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

#### Source File Organization

Scarb reserves the top-level directory for non-code content. Source files must reside in the *src* directory.

1.  Delete the content of *src/lib.cairo* and replace it with a module declaration:

```rust
mod hello_world;
```

2.  Create a new file named *src/hello_world.cairo* with the following code:

Filename: src/hello_world.cairo

```rust
#[executable]
fn main() {
    println!("Hello, World!");
}
```

The resulting structure is:

```
├── Scarb.toml
├── src
│   ├── lib.cairo
│   └── hello_world.cairo
```

### Building and Executing the Project

From the *hello_world* directory, build the project using:

```bash
$ scarb build
   Compiling hello_world v0.1.0 (listings/ch01-getting-started/no_listing_01_hello_world/Scarb.toml)
    Finished `dev` profile target(s) in 1 second
```

To run the compiled program, use `scarb execute`:

```bash
$ scarb execute
   Compiling hello_world v0.1.0 (listings/ch01-getting-started/no_listing_01_hello_world/Scarb.toml)
    Finished `dev` profile target(s) in 1 second
   Executing hello_world
Hello, World!
```

### Summary of Scarb Commands

*   Install Scarb versions using `asdf`.
*   Create a project using `scarb new`.
*   Build a project using `scarb build` to generate compiled Sierra code.
*   Execute a Cairo program using the `scarb execute` command.

Scarb commands are consistent across different operating systems.

---

Sources:

- https://www.starknet.io/cairo-book/ch01-03-proving-a-prime-number.html

---

## Guided Project: Implementing a Provable Program

This project introduces key Cairo concepts and the process of generating zero-knowledge proofs locally using the Stwo prover. We will implement a program to prove that a given number is prime using a trial division algorithm.

### Project Goal

The program will take an input number, check its primality, and then use Scarb to execute the program and generate a proof that the primality check was performed correctly.

### Setting Up a New Project

Ensure Scarb 2.12.0 or later is installed. Create and navigate into a new Scarb project:

```bash
scarb new prime_prover
cd prime_prover
```

The initial `Scarb.toml` file looks minimal:

Filename: Scarb.toml

```toml
[package]
name = "prime_prover"
version = "0.1.0"
edition = "2024_07"

[dependencies]

[dev-dependencies]
cairo_test = "2.12.0"
```

To create an executable program suitable for proving, update `Scarb.toml` to define an executable target and include the `cairo_execute` plugin:

Filename: Scarb.toml

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

The additions specify that the package compiles to an executable, disable gas tracking (necessary for executables), and include the necessary plugin for execution and proving.

### Writing the Prime-Checking Logic

We replace the contents of `src/lib.cairo` with the primality test logic and the executable entry point. The implementation uses trial division.

Filename: src/lib.cairo

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

The `is_prime` function handles edge cases (numbers $\le 1$, 2, and even numbers) and then iterates through odd divisors up to $\sqrt{n}$. The `main` function, marked with `#[executable]`, serves as the entry point, taking a `u32` input and returning the boolean result of `is_prime`.

*Note: Later modifications might change `u32` to `u128` for a larger range and add panicking behavior for inputs exceeding a certain limit (e.g., 1,000,000), which prevents proof generation if the program panics.*

### Executing the Program

We use `scarb execute` to run the program and view the output. The arguments are passed after `--arguments`.

```bash
scarb execute -p prime_prover --print-program-output --arguments 17
```

Execution output:

```
$ scarb execute -p prime_prover --print-program-output --arguments 17
   Compiling prime_prover v0.1.0 (listings/ch01-getting-started/prime_prover/Scarb.toml)
    Finished `dev` profile target(s) in 1 second
   Executing prime_prover
Program output:
1
```

The output `1` indicates `true` (17 is prime). If the input was 4, the output would be `[0, 0]` (false).

### Summary

This guided project demonstrated:
*   Defining executable targets in `Scarb.toml`.
*   Writing functions and control flow in Cairo.
*   Using `scarb execute` to run programs and generate execution traces.
*   The overall workflow for proving and verifying computations using `scarb prove` and `scarb verify` (though the latter commands are not explicitly run here, they are the next logical step).

---

Sources:

- https://www.starknet.io/cairo-book/ch07-04-bringing-paths-into-scope-with-the-use-keyword.html

---

## Advanced Scarb Features and Project Structure

### Dependency Management in Scarb

If you want to import multiple packages, create only one `[dependencies]` section in *Scarb.toml* and list all desired packages beneath it. Development dependencies are declared in a `[dev-dependencies]` section.

Run `scarb build` to fetch all external dependencies and compile your package.

Dependencies can also be managed via the command line:
*   Use `scarb add` to add a dependency, which automatically edits *Scarb.toml*.
*   Use `scarb add --dev` for development dependencies.
*   To remove a dependency, edit *Scarb.toml* or use the `scarb rm` command.

### The Glob Operator

To bring *all* public items defined in a path into scope, specify that path followed by the `*` glob operator in a `use` statement:

```rust
#![allow(unused)]
fn main() {
use core::num::traits::*;
}
```

This brings all public items defined in `core::num::traits` into the current scope. Use the glob operator carefully, as it can make it harder to trace where a name was defined. It is often used when testing to bring everything under test into the `tests` module.

---

Sources:

- https://www.starknet.io/cairo-book/ch100-00-introduction-to-smart-contracts.html
- https://www.starknet.io/cairo-book/ch103-06-01-deploying-and-interacting-with-a-voting-contract.html

---

# Cairo for Smart Contracts and Starknet

## Introduction to Smart Contracts

Smart contracts are programs deployed on a blockchain, gaining prominence with Ethereum. They are not inherently "smart" or "contracts," but rather code executed based on specific inputs. They consist of storage and functions, and users interact by initiating blockchain transactions. Smart contracts have their own address and can hold tokens.

### Programming Languages and Compilation

The language varies by blockchain; Solidity is common for EVM, while Cairo is used for Starknet. Compilation differs: Solidity compiles to bytecode, whereas Cairo compiles first to Sierra and then to Cairo Assembly (CASM).

### Smart Contract Use Cases

Smart contracts facilitate various applications:
*   **Tokenization:** Tokenizing real-world assets (real estate, art) to increase liquidity and enable fractional ownership.
*   **Voting:** Creating secure, transparent voting systems where results are tallied automatically.
*   **Royalties:** Automating royalty payments to creators upon content consumption or sale.
*   **Decentralized Identities (DIDs):** Managing digital identities, allowing users control over personal information sharing and access verification.

## The Rise of Starknet and Cairo

Before interacting with contracts (e.g., a voting contract), voter and admin accounts must be registered and funded on Starknet. Account Abstraction details are covered in the Starknet Docs.

### Setting up Starkli and Account Preparation

Aside from Scarb, you need **Starkli**, a command-line tool for Starknet interaction. Verify the version matches the required specification:

> Note: Please verify that the version of `starkli` match the specified version provided below.
>
> ```
> $ starkli --version
> 0.3.6 (8d6db8c)
> ```
>
> To upgrade `starkli` to `0.3.6`, use the `starkliup -v 0.3.6` command, or simply `starkliup` which installed the latest stable version.

The smart wallet class hash can be retrieved using the following command, noting the use of the `--rpc` flag pointing to the `katana` RPC endpoint:

```
starkli class-hash-at <SMART_WALLET_ADDRESS> --rpc http://0.0.0.0:5050
```

### Contract Deployment Workflow

Contracts must be declared before deployment using the `starkli declare` command:

```
starkli declare target/dev/listing_99_12_vote_contract_Vote.contract_class.json --rpc http://0.0.0.0:5050 --account katana-0
```

If a `compiler-version` error occurs due to version mismatch, you can specify the version using the `--compiler-version x.y.z` flag. Upgrading Starkli via `starkliup` is also recommended to resolve such issues.

---

Sources:

- https://www.starknet.io/cairo-book/ch02-05-control-flow.html
- https://www.starknet.io/cairo-book/ch02-02-data-types.html
- https://www.starknet.io/cairo-book/ch02-03-functions.html
- https://www.starknet.io/cairo-book/ch06-02-the-match-control-flow-construct.html
- https://www.starknet.io/cairo-book/ch02-01-variables-and-mutability.html
- https://www.starknet.io/cairo-book/ch11-01-closures.html
- https://www.starknet.io/cairo-book/ch05-01-defining-and-instantiating-structs.html
- https://www.starknet.io/cairo-book/ch12-08-printing.html
- https://www.starknet.io/cairo-book/appendix-03-derivable-traits.html
- https://www.starknet.io/cairo-book/ch05-03-method-syntax.html
- https://www.starknet.io/cairo-book/ch06-01-enums.html
- https://www.starknet.io/cairo-book/ch06-03-concise-control-flow-with-if-let-and-while-let.html
- https://www.starknet.io/cairo-book/ch12-04-hash.html
- https://www.starknet.io/cairo-book/ch03-01-arrays.html
- https://www.starknet.io/cairo-book/ch04-01-what-is-ownership.html
- https://www.starknet.io/cairo-book/ch05-02-an-example-program-using-structs.html
- https://www.starknet.io/cairo-book/ch102-04-serialization-of-cairo-types.html
- https://www.starknet.io/cairo-book/ch01-02-hello-world.html
- https://www.starknet.io/cairo-book/ch02-00-common-programming-concepts.html
- https://www.starknet.io/cairo-book/ch02-04-comments.html
- https://www.starknet.io/cairo-book/ch03-00-common-collections.html
- https://www.starknet.io/cairo-book/ch03-02-dictionaries.html
- https://www.starknet.io/cairo-book/ch05-00-using-structs-to-structure-related-data.html
- https://www.starknet.io/cairo-book/ch06-00-enums-and-pattern-matching.html
- https://www.starknet.io/cairo-book/ch08-00-generic-types-and-traits.html
- https://www.starknet.io/cairo-book/ch08-01-generic-data-types.html
- https://www.starknet.io/cairo-book/ch09-02-recoverable-errors.html
- https://www.starknet.io/cairo-book/ch11-00-functional-features.html

---

---

Sources:

- https://www.starknet.io/cairo-book/ch01-02-hello-world.html
- https://www.starknet.io/cairo-book/ch02-00-common-programming-concepts.html
- https://www.starknet.io/cairo-book/ch02-03-functions.html
- https://www.starknet.io/cairo-book/ch02-04-comments.html

---

## Cairo Program Structure and Fundamentals

### Anatomy of a Cairo Program

Every executable Cairo program begins execution in the `main` function.

The `main` function declaration:
```rust
fn main() {

}
```
*   The `main` function takes no parameters (if it did, they would be inside `()`).
*   The function body is enclosed in curly brackets `{}`.
*   It is standard style to place the opening curly bracket on the same line as the function declaration, separated by one space.
*   Cairo style dictates using four spaces for indentation.

The body of `main` often contains code that performs actions, such as printing to the terminal:
```rust
    println!("Hello, World!");
```
The `println!` syntax calls a Cairo macro; calling a function would omit the exclamation mark (e.g., `println`).

### Statements and Expressions

Cairo is an expression-based language, distinguishing between statements and expressions:

*   **Statements** are instructions that perform an action but do not return a value.
*   **Expressions** evaluate to a resultant value.

Function definitions are statements. Creating a variable assignment using `let` is also a statement, as shown in Listing 2-1:
```rust
#[executable]
fn main() {
    let y = 6;
}
```
Since statements do not return values, attempting to assign a `let` statement to another variable results in an error:
```rust
#[executable]
fn main() {
    let x = (let y = 6);
}
```

### Comments

Comments are ignored by the compiler but aid human readers.

**Standard Comments:**
Idiomatic comments start with two slashes (`//`) and continue until the end of the line. For multi-line comments, `//` must prefix every line:
```rust
// So we’re doing something complicated here, long enough that we need
// multiple lines of comments to do it! Whew! Hopefully, this comment will
// explain what’s going on.
```
Comments can also appear at the end of lines containing code:
```rust
#[executable]
fn main() -> felt252 {
    1 + 4 // return the sum of 1 and 4
}
```

**Item-level Documentation:**
These comments refer to specific items (functions, traits, etc.) and are prefixed with three slashes (`///`). They provide detailed descriptions, usage examples, and panic conditions.
```rust
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
```

---

Sources:

- https://www.starknet.io/cairo-book/ch02-01-variables-and-mutability.html
- https://www.starknet.io/cairo-book/ch04-01-what-is-ownership.html

---

### Variables, Mutability, and Scoping

Cairo uses an immutable memory model where once a memory cell is written to, it cannot be overwritten. Variables in Cairo are immutable by default.

#### Variables and Immutability

When a variable is immutable, its bound value cannot be changed. Attempting to reassign a value to an immutable variable results in a compile-time error.

To demonstrate this, if we use the following code:

Filename: src/lib.cairo

```rust
#[executable]
fn main() {
    let x = 5;
    println!("The value of x is: {}", x);
    x = 6;
    println!("The value of x is: {}", x);
}
```

Running the program yields an immutability error:

```
$ scarb execute
   Compiling no_listing_01_variables_are_immutable v0.1.0 (listings/ch02-common-programming-concepts/no_listing_01_variables_are_immutable/Scarb.toml)
error: Cannot assign to an immutable variable.
 --> listings/ch02-common-programming-concepts/no_listing_01_variables_are_immutable/src/lib.cairo:7:5
    x = 6;
    ^^^^^

error: could not compile `no_listing_01_variables_are_immutable` due to previous error
error: `scarb` command exited with error
```

This compile-time check prevents bugs where code relies on a value remaining constant when another part of the code unexpectedly changes it.

#### Making Variables Mutable

To allow a variable's value to change, you must add the `mut` keyword in front of the variable name. This signals intent to future readers. Although Cairo's memory is fundamentally immutable, declaring a variable as `mut` allows the value associated with the variable to change. Low-level analysis shows that variable mutation is implemented as syntactic sugar equivalent to variable shadowing, except the variable's type cannot change.

Example of using `mut`:

```rust
#[executable]
fn main() {
    let mut x = 5;
    println!("The value of x is: {}", x);
    x = 6;
    println!("The value of x is: {}", x);
}
```

Execution output:

```
$ scarb execute
   Compiling no_listing_02_adding_mut v0.1.0 (listings/ch02-common-programming-concepts/no_listing_02_adding_mut/Scarb.toml)
    Finished `dev` profile target(s) in 1 second
   Executing no_listing_02_adding_mut
The value of x is: 5
The value of x is: 6
```

#### Constants

*Constants* are similar to immutable variables but have key differences:
1.  They cannot be declared mutable (`mut` is disallowed).
2.  They are declared using the `const` keyword instead of `let`.
3.  The type of the value *must* always be annotated.
4.  They can only be declared in the global scope.
5.  They can only be set to a constant expression, not a value computed at runtime.

The naming convention for constants is all uppercase with underscores between words. Constants are valid for the entire time the program runs within their scope, making them useful for domain-specific values known throughout the application.

Example of constants declaration:

```rust
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

#### Shadowing

Variable shadowing occurs when a new variable is declared with the same name as a previous variable, effectively hiding the previous one. This is done by repeating the `let` keyword.

Shadowing allows for transformations on a value while keeping the variable immutable after those steps. Crucially, shadowing allows changing the variable's type, which `mut` does not permit.

Example demonstrating shadowing and scope:

```rust
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

Output:

```
$ scarb execute
   Compiling no_listing_03_shadowing v0.1.0 (listings/ch02-common-programming-concepts/no_listing_03_shadowing/Scarb.toml)
    Finished `dev` profile target(s) in 1 second
   Executing no_listing_03_shadowing
Inner scope x value is: 12
Outer scope x value is: 6
```

Shadowing allows type changes, unlike `mut`:

```rust
#[executable]
fn main() {
    let x: u64 = 2;
    println!("The value of x is {} of type u64", x);
    let x: felt252 = x.into(); // converts x to a felt, type annotation is required.
    println!("The value of x is {} of type felt252", x);
}
```

If we attempt to change the type using `mut`, a compile-time error occurs because the expected type (`u64`) does not match the assigned type (`u8`):

```rust
#[executable]
fn main() {
    let mut x: u64 = 2;
    println!("The value of x is: {}", x);
    x = 5_u8;
    println!("The value of x is: {}", x);
}
```

Error output:

```
$ scarb execute
   Compiling no_listing_05_mut_cant_change_type v0.1.0 (listings/ch02-common-programming-concepts/no_listing_05_mut_cant_change_type/Scarb.toml)
error: Unexpected argument type. Expected: "core::integer::u64", found: "core::integer::u8".
 --> listings/ch02-common-programming-concepts/no_listing_05_mut_cant_change_type/src/lib.cairo:7:9
    x = 5_u8;
        ^^^^

error: could not compile `no_listing_05_mut_cant_change_type` due to previous error
error: `scarb` command exited with error
```

#### Variable Scope

A *scope* is the range within a program for which an item is valid. A variable is valid from the point it is declared until it goes out of scope.

```rust
//TAG: ignore_fmt
#[executable]
fn main() {
    { // s is not valid here, it’s not yet declared
        let s = 'hello'; // s is valid from this point forward
        // do stuff with s
    } // this scope is now over, and s is no longer valid
}
```

Listing 4-1: A variable and the scope in which it is valid

##### Moving Values

*Moving* a value means passing it to another function. When this happens, the variable referring to that value in the original scope is destroyed and can no longer be used; a new variable is created to hold the value. Complex types, like Arrays, are moved when passed to another function.

Array example:

```rust
#[executable]
fn main() {
    let mut arr: Array<u128> = array![];
    arr.append(1);
    arr.append(2);
}
```

---

Sources:

- https://www.starknet.io/cairo-book/ch02-02-data-types.html

---

# Data Types: Scalars and Primitives
...
## Felt Type
...
### Unsigned Integers
...
This seems the safest interpretation of the conflicting requirements (explicit syntax vs relative depth based on ToC context).

The chunks start with `## Data Types - The Cairo Programming Language\n\n# Data Types\n\n...`. I must ignore this initial context and start with the required heading derived from the TOC path.

```markdown
# Data Types: Scalars and Primitives

Cairo is a *statically typed* language, which means that it must know the types of all variables at compile time. The compiler can usually infer the desired type based on the value and its usage. In cases when many types are possible, a conversion method can specify the desired output type:

```rust
#[executable]
fn main() {
    let x: felt252 = 3;
    let y: u32 = x.try_into().unwrap();
}
```

Scalar types represent a single value. Cairo has three primary scalar types: felts, integers, and booleans.

## Felt Type (`felt252`)

If the type of a variable or argument is not specified, it defaults to `felt252` (a field element). This is an integer in the range \\( 0 \\leq x < P \\), where \\( P = {2^{251}} + 17 \\cdot {2^{192}} + 1 \\). Results outside this range are computed $\\mod P$.

The most important difference from integer division is that Cairo division is defined to always satisfy \\( \\frac{x}{y} \\cdot y == x \\). For instance, \\( \\frac{1}{2} \\) results in \\( \\frac{P + 1}{2} \\).

## Integer Types

It is highly recommended to use integer types over `felt252` due to added security features against vulnerabilities like overflow/underflow. An integer type declares the number of bits used for storage.

### Unsigned Integers

Built-in unsigned integer types:

| Length | Unsigned |
| :--- | :--- |
| 8-bit | `u8` |
| 16-bit | `u16` |
| 32-bit | `u32` |
| 64-bit | `u64` |
| 128-bit | `u128` |
| 256-bit | `u256` |
| 32-bit | `usize` |

`usize` is currently an alias for `u32`. Since variables are unsigned, attempting to create a negative result causes a panic:

```rust
fn sub_u8s(x: u8, y: u8) -> u8 {
    x - y
}

#[executable]
fn main() {
    sub_u8s(1, 3);
}
```

`u256` is structured as a struct: `u256 {low: u128, high: u128}`.

### Signed Integers

Signed integers start with the prefix `i` (e.g., `i8` to `i128`). They store numbers from \\( -({2^{n - 1}}) \\) to \\( {2^{n - 1}} - 1 \\).

### Integer Literals and Numeric Operations

Integer literals can be written in Decimal, Hex (`0xff`), Octal (`0o04321`), or Binary (`0b01`). Type suffixes (e.g., `57_u8`) and visual separators (`_`) are supported.

Cairo supports basic mathematical operations. Integer division truncates toward zero.

```rust
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

## Boolean Type

The `bool` type has two values: `true` and `false`, and is one `felt252` in size. Declaration mandates using these literals; integer literals are disallowed.

```rust
#[executable]
fn main() {
    let t = true;

    let f: bool = false; // with explicit type annotation
}
```

## String Types

Cairo handles strings using short strings (simple quotes) or `ByteArray` (double quotes).

### Short Strings

Short strings are ASCII strings encoded on one byte per character, stored in a `felt252`. A short string is limited to 31 characters.

*   `'a'` is equivalent to `0x61`.
*   `0x616263` is equivalent to `'abc'`.

Examples of declaration:

```rust
#[executable]
fn main() {
    let my_first_char = 'C';
    let my_first_char_in_hex = 0x43;

    let my_first_string = 'Hello world';
    let my_first_string_in_hex = 0x48656C6C6F20776F726C64;

    let long_string: ByteArray = "this is a string which has more than 31 characters";
}
```
This covers all points concisely using H2/H3 subheadings relative to the H1 section start.

---

Sources:

- https://www.starknet.io/cairo-book/ch02-02-data-types.html
- https://www.starknet.io/cairo-book/ch03-01-arrays.html
- https://www.starknet.io/cairo-book/ch03-00-common-collections.html
- https://www.starknet.io/cairo-book/ch03-02-dictionaries.html

---

## Byte Array Strings

Cairo's Core Library provides a `ByteArray` type for handling strings and byte sequences longer than short strings. It is implemented using an array of `bytes31` words and a pending `felt252` word acting as a buffer.

Unlike short strings, `ByteArray` strings can contain more than 31 characters and are written using double quotes:

```cairo
#[executable]
fn main() {
    let my_first_char = 'C';
    let my_first_char_in_hex = 0x43;

    let my_first_string = 'Hello world';
    let my_first_string_in_hex = 0x48656C6C6F20776F726C64;

    let long_string: ByteArray = "this is a string which has more than 31 characters";
}
```

## The Tuple Type

A *tuple* groups together values of potentially varying types into one compound type. Tuples have a fixed length.

Tuples are created using a comma-separated list of values inside parentheses. Individual values can be accessed by *destructuring* the tuple using a pattern with `let`:

```cairo
#[executable]
fn main() {
    let tup: (u32, u64, bool) = (10, 20, true);
}
```

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

Destructuring can also happen during declaration:

```cairo
#[executable]
fn main() {
    let (x, y): (felt252, felt252) = (2, 3);
}
```

### The Unit Type ()

A *unit type* has only one value `()`, represented by an empty tuple. It has zero size and is guaranteed not to exist in compiled code. It is the implicit return value for expressions that return nothing.

## The Fixed Size Array Type

Fixed size arrays store multiple values where every element must have the same type. They are written as a comma-separated list inside square brackets. The type is specified as `[ElementType; Length]`.

```cairo
#[executable]
fn main() {
    let arr1: [u64; 5] = [1, 2, 3, 4, 5];
}
```

Arrays are efficient because their size is known at compile-time. They can be initialized concisely using `[initial_value; length]`:

```cairo
    let a = [3; 5];
```

### Accessing Fixed Size Arrays Elements

Elements can be accessed by deconstructing the array:

```cairo
#[executable]
fn main() {
    let my_arr = [1, 2, 3, 4, 5];

    // Accessing elements of a fixed-size array by deconstruction
    let [a, b, c, _, _] = my_arr;
    println!("c: {}", c); // c: 3
}
```

## Common Collections

Cairo provides common collection types, primarily Arrays and Dictionaries.

### Array Operations

Accessing elements can be done using the subscripting operator or the `at()` method, which both panic if the index is out of bounds (by using `unbox()`):

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

Use `get()` for graceful handling of out-of-bounds access. To determine size, use `len()` (returns `usize`), and check if empty with `is_empty()`.

The `array!` macro simplifies compile-time array creation:

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

To store multiple types in an array, an `Enum` must be used to define a custom data type:

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

### Span

`Span` is a struct representing a snapshot of an `Array`, providing safe, read-only access without modification. All `Array` methods, except `append()`, can be used with `Span`.

To create a `Span` from an `Array`, call the `span()` method:

```cairo
#[executable]
fn main() {
    let mut array: Array<u8> = ArrayTrait::new();
    array.span();
}
```

## Dictionaries

The `Felt252Dict<T>` data type represents key-value pairs where the key type is restricted to `felt252`. This structure is useful for organizing data where array indexing is insufficient, and it can simulate mutable memory.

The core functionality is implemented in `Felt252DictTrait`, including `insert(felt252, T)` and `get(felt252) -> T`.

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

---

Sources:

- https://www.starknet.io/cairo-book/appendix-03-derivable-traits.html
- https://www.starknet.io/cairo-book/ch02-02-data-types.html
- https://www.starknet.io/cairo-book/ch05-02-an-example-program-using-structs.html

---

### Type System Utilities: Traits and Conversions

#### Copy Trait

The `Copy` trait allows for the duplication of values. It can be derived on any type whose parts all implement `Copy`.

Example:
```rust
#[derive(Copy, Drop)]
struct A {
    item: felt252,
}

#[executable]
fn main() {
    let first_struct = A { item: 2 };
    let second_struct = first_struct;
    // Copy Trait prevents first_struct from moving into second_struct
    assert!(second_struct.item == 2, "Not equal");
    assert!(first_struct.item == 2, "Not Equal");
}
```

#### Debug for Printing and Debugging

The `Debug` trait enables debug formatting in format strings, indicated by adding `:?` within `{}` placeholders. It allows printing instances for inspection. The `Debug` trait is required when using `assert_xx!` macros in tests to print failing values.

Example:
```rust
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
Output from running this example:
```
scarb execute
Point { x: 1, y: 3 }
```

#### Default for Default Values

The `Default` trait allows creation of a default value of a type, most commonly zero for primitive types. If deriving `Default` on a composite type, all its elements must implement `Default`. For an `enum`, the default value must be declared using the `#[default]` attribute on one of its variants.

Example:
```rust
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

#### PartialEq for Equality Comparisons

The `PartialEq` trait allows comparison between instances using `==` and `!=`. When derived, two instances are equal only if all their fields are equal (for structs), or if they are the same variant (for enums). It is required for the `assert_eq!` macro in tests. Custom implementations are possible; for instance, two rectangles can be considered equal if they have the same area.

Example of custom implementation:
```rust
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

Example of derived usage:
```rust
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

#### Type Conversion

Cairo uses the `TryInto` and `Into` traits for type conversion.

##### Into

The `Into` trait is used for infallible conversions, typically when the source type is smaller than the destination type. Conversion is done via `var.into()`, and the new variable's type must be explicitly defined.

Example with built-in types:
```rust
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

Implementing `Into` for custom types:
```rust
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

##### TryInto

The `TryInto` trait is used for fallible conversions (e.g., when the target type might not fit the source value), returning `Option<T>`. Conversion is performed via `var.try_into()`.

Example with built-in types:
```rust
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

Implementing `TryInto` for custom types:
```rust
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

---

Sources:

- https://www.starknet.io/cairo-book/ch02-03-functions.html
- https://www.starknet.io/cairo-book/ch04-01-what-is-ownership.html
- https://www.starknet.io/cairo-book/ch08-00-generic-types-and-traits.html

---

## Functions: Definition and Execution

Cairo code conventionally uses *snake case* for function and variable names (lowercase with underscores separating words).

### Function Definition and Execution

Functions are declared using the `fn` keyword, followed by the name, parentheses, and curly brackets for the body:

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

Functions are called by their name followed by parentheses. The definition order does not matter as long as the function is defined within the scope of the caller.

### Parameters

Functions can accept *parameters*, which are variables in the function signature. The concrete values passed are called *arguments*. Parameter types must be declared in the signature.

Example with a single parameter:

```cairo
#[executable]
fn main() {
    another_function(5);
}

fn another_function(x: felt252) {
    println!("The value of x is: {}", x);
}
```

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

`ByteArray` is Cairo's internal type for string literals.

#### Named Parameters

Named parameters allow specifying arguments by name using the syntax `parameter_name: value`. If the variable name matches the parameter name, shorthand `:parameter_name` can be used:

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

### Statements and Expressions

Function bodies consist of a series of statements optionally ending in an expression. Statements (like `let y = 6;`) do not return a value, whereas expressions (like `5 + 6`) evaluate to a value. Function calls are expressions that evaluate to the function's return value or `()` (the unit type) if no value is returned.

A new scope block created with curly brackets is an expression, provided the last line does not end with a semicolon:

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

Adding a semicolon to the last line of a block turns it into a statement, making it return `()`, which can cause errors if a return value is expected.

### Functions with Return Values

Functions return values implicitly as the value of the final expression in the body, or explicitly using the `return` keyword. The return type is specified after an arrow (`->`):

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

If a function is declared to return a type (e.g., `u32`), the final expression must evaluate to that type. If it ends in a semicolon (becoming a statement), it returns `()`, causing an error if `u32` was expected.

#### Const Functions

Functions marked with `const fn` can be evaluated at compile time, restricting their body and types to constant expressions. This allows their use in constant contexts:

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

#### Returning Multiple Values

Cairo supports returning multiple values using a tuple. However, to avoid moving values passed into a function when they are needed afterwards, Cairo offers *references* and *snapshots*.

Example returning multiple values via a tuple:

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

Functions can also accept parameters by reference (using `ref`) to avoid moving the value out of the caller's scope, which is useful when the function needs to read the value but not consume it, or when abstracting logic over types like arrays:

```cairo
fn largest(ref number_list: Array<u8>) -> u8 {
    let mut largest = number_list.pop_front().unwrap();

    for number in number_list.span() {
        if *number > largest {
            largest = *number;
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

---

Sources:

- https://www.starknet.io/cairo-book/ch02-05-control-flow.html
- https://www.starknet.io/cairo-book/ch06-03-concise-control-flow-with-if-let-and-while-let.html

---

# Control Flow

Control flow allows running code based on conditions or repeating execution. The most common constructs in Cairo are `if` expressions and loops.

## `if` Expressions

An `if` expression branches code execution based on conditions.

### Basic Structure and Alternatives

An `if` expression starts with the keyword `if`, followed by a condition in curly brackets. An optional `else` expression provides code to run if the condition is false. If no `else` is provided, execution continues past the `if` block if the condition is false.

```rust
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

Running with `number = 3` yields:
```
$ scarb execute
   Compiling no_listing_24_if v0.1.0 (listings/ch02-common-programming-concepts/no_listing_27_if/Scarb.toml)
    Finished `dev` profile target(s) in 1 second
   Executing no_listing_24_if
condition was false and number = 3
```

### Condition Requirements and Errors

The condition in an `if` expression must evaluate to a `bool`. Cairo does not automatically convert non-Boolean types.

Attempting to use a non-Boolean value (like an integer) directly as a condition results in an error:

```rust
#[executable]
fn main() {
    let number = 3;

    if number {
        println!("number was three");
    }
}
```

This results in an error because Cairo infers the type should be `bool` but cannot create a `bool` from the numeric literal `3`. To check a number's value, explicit comparison is needed:

```rust
#[executable]
fn main() {
    let number = 3;

    if number != 0 {
        println!("number was something other than zero");
    }
}
```

### Handling Multiple Conditions with `else if`

Multiple conditions can be chained using `else if`. Cairo executes the block for the first condition that evaluates to `true` and skips the rest.

```rust
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

Output when `number = 3`:
```
$ scarb execute
   Compiling no_listing_25_else_if v0.1.0 (listings/ch02-common-programming-concepts/no_listing_30_else_if/Scarb.toml)
    Finished `dev` profile target(s) in 1 second
   Executing no_listing_25_else_if
number is 3
```

### Using `if` in a `let` Statement

Because `if` is an expression, its result can be assigned to a variable using `let`.

```rust
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

Cairo provides three loop constructs: `loop`, `while`, and `for`.

### Repeating Code with `loop`

The `loop` keyword runs a block of code repeatedly until explicitly stopped using `break`.

```rust
#[executable]
fn main() {
    loop {
        println!("again!");
    }
}
```

Infinite loops are prevented by a gas meter. If gas runs out, the program stops. To run long loops, use `--available-gas`.

The `break` keyword exits the loop. The `continue` keyword skips the rest of the current iteration and proceeds to the next one.

Example using `break` and `continue`:
```rust
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
Executing this program skips printing when `i` equals 5.

### Returning Values from Loops

A value can be returned from a `loop` by placing the value after the `break` keyword.

```rust
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
This prints: `The result is 20`.

### Conditional Loops with `while`

A `while` loop executes code as long as its condition remains `true`.

```rust
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

Using a `while` loop to iterate over collections by index (`while index < array_length`) is error-prone and slow due to runtime bounds checking.

The `for` loop is a safer and more concise alternative for iterating over collection elements.

```rust
#[executable]
fn main() {
    let a = [10, 20, 30, 40, 50].span();

    for element in a {
        println!("the value is: {element}");
    }
}
```

`for` loops can also use a `Range` to execute code a specific number of times:

```rust
#[executable]
fn main() {
    for number in 1..4_u8 {
        println!("{number}!");
    }
    println!("Go!!!");
}
```

## Equivalence Between Loops and Recursive Functions

Loops and recursive functions are conceptually equivalent and compile down to similar low-level representations in Sierra.

The following `loop` example:
```rust
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
Is equivalent to this recursive function:
```rust
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
Both run until `x == 2` is met.

## Concise Control Flow with `if let` and `while let`

### `if let`

`if let` combines `if` and `let` to handle values matching one pattern while ignoring others, reducing boilerplate compared to an exhaustive `match`.

```rust
#[executable]
fn main() {
    let number = Some(5);
    if let Some(max) = number {
        println!("The maximum is configured to be {}", max);
    }
}
```

### `while let`

`while let` loops as long as an expression matches a specified pattern.

```rust
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

### Let Chains

Let chains combine multiple pattern matches and boolean conditions within an `if let` or `while let` structure without nesting. Note that `else` is not yet supported for let chain expressions.

```rust
fn get_x() -> Option<u32> {
    Some(5)
}

fn get_y() -> Option<u32> {
    Some(8)
}

#[executable]
fn main() {
    // Using a let chain to combine pattern matching and additional conditions
    if let Some(x) = get_x() && x > 0 && let Some(y) = get_y() && y > 0 {
        let sum: u32 = x + y;
        println!("sum: {}", sum);
        return;
    }
    println!("x or y is not positive");
    // else is not supported yet;
}
```

### `let else`

`let else` allows refutable pattern matching in a `let` binding. If the pattern fails to match, the `else` block executes, which must diverge (e.g., using `return`, `break`, `panic!`).

```rust
#[derive(Drop)]
enum MyEnum {
    A: u32,
    B: u32,
}

fn foo(a: MyEnum) {
    let MyEnum::A(x) = a else {
        println!("Called with B");
        return;
    };
    println!("Called with A({x})");
}

#[executable]
fn main() {
    foo(MyEnum::A(42));
    foo(MyEnum::B(7));
}
```

## Practice Summary

To practice these concepts, try building programs to:
*   Generate the $n$-th Fibonacci number.
*   Compute the factorial of a number $n$.

---

Sources:

- https://www.starknet.io/cairo-book/ch05-01-defining-and-instantiating-structs.html
- https://www.starknet.io/cairo-book/ch05-00-using-structs-to-structure-related-data.html
- https://www.starknet.io/cairo-book/ch05-02-an-example-program-using-structs.html

---

## Structs and Custom Data Grouping

Structs are custom data types that package together and name multiple related values, forming a meaningful group. They are comparable to an object's data attributes in object-oriented languages. Structs, along with enums, are fundamental for creating new types and leveraging Cairo's compile-time type checking.

### Structs Versus Tuples

Structs are similar to tuples in that they hold multiple related values of potentially different types. However, structs name each piece of data (fields), making them more flexible than tuples, as access does not rely solely on data order.

The tuple approach can lead to less clear code, as seen when calculating the area of a rectangle using indices:

Filename: src/lib.cairo

```c
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

Using structs adds meaning by labeling the data, transforming the tuple into a named type where fields are explicitly named, such as `width` and `height`.

Filename: src/lib.cairo

```c
struct Rectangle {
    width: u64,
    height: u64,
}

#[executable]
fn main() {
    let rectangle = Rectangle { width: 30, height: 10 };
    let area = area(rectangle);
    println!("Area is {}", area);
}

fn area(rectangle: Rectangle) -> u64 {
    rectangle.width * rectangle.height
}
```

### Defining and Instantiating Structs

#### Struct Definition

To define a struct, use the `struct` keyword followed by the struct name. Inside curly brackets, define the names and types of the fields.

```c
#[derive(Drop)]
struct User {
    active: bool,
    username: ByteArray,
    email: ByteArray,
    sign_in_count: u64,
}
```
You can derive multiple traits on structs, such as `Drop`, `PartialEq` for comparison, and `Debug` for debug-printing.

#### Instance Creation

An instance is created by stating the struct name followed by curly brackets containing `key: value` pairs for each field. The order of fields in the instance definition does not need to match the order in the struct declaration.

```c
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
        active: true, username: "someusername123", email: "[email protected]", sign_in_count: 1,
    };
    let user2 = User {
        sign_in_count: 1, username: "someusername123", active: true, email: "[email protected]",
    };
}
```

### Accessing and Modifying Struct Data

#### Accessing Fields

Specific values are accessed using dot notation: `instance.field_name`.

#### Mutability

If an instance is mutable (declared with `let mut`), you can change a field's value using dot notation assignment. The entire instance must be mutable; Cairo does not allow marking only specific fields as mutable.

Filename: src/lib.cairo

```c
#[derive(Drop)]
struct User {
    active: bool,
    username: ByteArray,
    email: ByteArray,
    sign_in_count: u64,
}
#[executable]
fn main() {
    let mut user1 = User {
        active: true, username: "someusername123", email: "[email protected]", sign_in_count: 1,
    };
    user1.email = "[email protected]";
}

fn build_user(email: ByteArray, username: ByteArray) -> User {
    User { active: true, username: username, email: email, sign_in_count: 1 }
}

fn build_user_short(email: ByteArray, username: ByteArray) -> User {
    User { active: true, username, email, sign_in_count: 1 }
}
```
A new instance can be constructed as the last expression in a function body to implicitly return it.

### Struct Construction Shorthands

#### Field Init Shorthand

When a function parameter name is identical to the corresponding struct field name, you can use a shorthand syntax, omitting the `: field_name` part.

```c
fn build_user_short(email: ByteArray, username: ByteArray) -> User {
    User { active: true, username, email, sign_in_count: 1 }
}
```
This is equivalent to `username: username` and `email: email`.

#### Struct Update Syntax

To create a new instance based on an existing one, while overriding only a few fields, use struct update syntax (`..instance_name`). The remaining fields take their values from the specified instance. The `..` expression must come last.

Filename: src/lib.cairo

```c
use core::byte_array;
#[derive(Drop)]
struct User {
    active: bool,
    username: ByteArray,
    email: ByteArray,
    sign_in_count: u64,
}

#[executable]
fn main() {
    // --snip--

    let user1 = User {
        email: "[email protected]", username: "someusername123", active: true, sign_in_count: 1,
    };

    let user2 = User { email: "[email protected]", ..user1 };
}
```
This syntax uses `=` like an assignment because it moves data. If a field contains a non-`Copy` type (like `ByteArray`), the data for that field is moved from the original instance (`user1`) into the new instance (`user2`), invalidating `user1` for that field. If fields implement `Copy` (like `u64` or `bool`), the values are copied instead.

---

Sources:

- https://www.starknet.io/cairo-book/ch05-03-method-syntax.html

---

### Struct Methods and Associated Functions

Methods are declared using the `fn` keyword within a struct's context (via an `impl` block for a trait). Their first parameter must always be `self`, representing the instance on which the method is called.

#### Defining Methods

Methods are defined within an `impl` block for a trait associated with the struct. If a method takes ownership of the instance, it uses just `self` as the first parameter, typically when transforming the instance.

Listing 5-11 shows defining an `area` method:

```
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

Methods can accept additional parameters, such as the `can_hold` method which compares two `Rectangle` instances:

```
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

#### Associated Functions

Associated functions are functions defined inside an `impl` block that do not take `self` as their first parameter. They are associated with the type but do not require an instance to operate.

Associated functions are commonly used for constructors (often named `new`). They are called using the `::` syntax on the trait name.

```
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

---

Sources:

- https://www.starknet.io/cairo-book/ch06-02-the-match-control-flow-construct.html
- https://www.starknet.io/cairo-book/ch06-01-enums.html
- https://www.starknet.io/cairo-book/ch06-00-enums-and-pattern-matching.html
- https://www.starknet.io/cairo-book/ch06-03-concise-control-flow-with-if-let-and-while-let.html

---

# Enums and Pattern Matching

Enums (enumerations) allow defining a type by enumerating its possible variants. Enums are useful for representing a collection of related values where each value is distinct and has a specific meaning.

## Enum Variants and Data Association

Enum variants can exist without associated data, or they can store associated values.

### Variants Without Associated Data

Variants are named using PascalCase.

```rust
#[derive(Drop)]
enum Direction {
    North,
    East,
    South,
    West,
}

#[executable]
fn main() {
    let direction = Direction::North;
}
```

### Variants With Associated Data

Variants can be associated with specific data types, which can be the same type for all variants or different types for different variants.

Example associating a `u128` value:
```rust
#[derive(Drop)]
enum Direction {
    North: u128,
    East: u128,
    South: u128,
    West: u128,
}

#[executable]
fn main() {
    let direction = Direction::North(10);
}
```

Enums can store more complex, custom data structures:

```rust
#[derive(Drop)]
enum Message {
    Quit,
    Echo: felt252,
    Move: (u128, u128),
}
```
Here, `Quit` has no associated value, `Echo` holds a `felt252`, and `Move` holds a tuple of two `u128` values.

### Trait Implementations for Enums

Traits can be defined and implemented for custom enums, allowing methods to be associated with the enum type.

```rust
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

## The `Option<T>` Enum

The standard `Option<T>` enum expresses the concept of an optional value, preventing bugs from using uninitialized or unexpected null values. It has two variants:

```rust
enum Option<T> {
    Some: T,
    None,
}
```

This is useful when a function might not return a value, such as finding an element's index in an array:

```rust
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

## The `match` Control Flow Construct

The `match` expression compares a value against a series of patterns and executes code based on the first matching pattern. It functions like a coin-sorting machine: the value falls into the first pattern it fits.

An arm consists of a pattern, the `=>` operator, and the code to run. The result of the expression in the matching arm is the result of the entire `match` expression.

Example using a simple `Coin` enum:
```rust
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

If multiple lines of code are needed in an arm, curly brackets must be used, and the last expression's value is returned:

```rust
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

### Patterns That Bind to Values

Patterns can bind to parts of the value to extract inner data. For example, if a `Quarter` variant holds a `UsState`:

```rust
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
When `Coin::Quarter(state)` matches, `state` binds to the inner `UsState` value.

### Matching with `Option<T>`

`match` is used to safely handle `Option<T>` variants:

```rust
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

### Exhaustiveness and the `_` Placeholder

Matches in Cairo must be exhaustive; all possible cases must be covered. Forgetting a case results in a compilation error:

```rust
fn plus_one(x: Option<u8>) -> Option<u8> {
    match x {
        Some(val) => Some(val + 1),
    }
}
// This code will cause an error: error: Missing match arm: `None` not covered.
```

The `_` pattern acts as a catch-all for any value that hasn't matched previous arms, satisfying exhaustiveness without binding the value.

```rust
fn vending_machine_accept(coin: Coin) -> bool {
    match coin {
        Coin::Dime => true,
        _ => false,
    }
}
```
Note: There is no catch-all pattern in Cairo that allows you to use the value of the pattern.

### Multiple Patterns with the `|` Operator

The `|` (or) operator allows matching multiple patterns in a single arm:

```rust
fn vending_machine_accept(coin: Coin) -> bool {
    match coin {
        Coin::Dime | Coin::Quarter => true,
        _ => false,
    }
}
```

### Matching Tuples

Tuples can be matched against specific structures:

```rust
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
The `_` can be used within tuple matching to ignore parts of the tuple.

### Matching `felt252` and Integer Variables

Integers fitting into a single `felt252` can be matched, but restrictions apply:
1. The first arm must start at 0.
2. Each arm must cover a sequential segment contiguously.

```rust
fn roll(value: u8) {
    match value {
        0 | 1 | 2 => println!("you won!"),
        3 => println!("you can roll again!"),
        _ => println!("you lost..."),
    }
}
```

## `if let` as an Alternative

`if let` is syntactic sugar for a `match` that runs code for one pattern and ignores all others, thus losing the exhaustive checking that `match` enforces. An `else` block corresponds to the `_` case in a `match`.

```rust
#[derive(Drop)]
enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter,
}

#[executable]
fn main() {
    let coin = Coin::Quarter;
    let mut count = 0;
    if let Coin::Quarter = coin {
        println!("You got a quarter!");
    } else {
        count += 1;
    }
    println!("{}", count);
}
```

---

Sources:

- https://www.starknet.io/cairo-book/ch09-02-recoverable-errors.html

---

### Advanced Pattern Matching and Error Handling

#### Checking Result Variants Without Consumption

The `is_err` method takes a snapshot of a `Result<T, E>` value and returns `true` if the `Result` is the `Err` variant, and `false` if it is the `Ok` variant. These methods are useful for checking success or failure without consuming the `Result` value, allowing for further decision-making based on the variant.

The implementation of the `ResultTrait` can be found elsewhere.

#### Example: Handling Overflowing Addition

A function signature demonstrating error return for overflow might look like this:

```rust
fn u128_overflowing_add(a: u128, b: u128) -> Result<u128, u128>;
```

This function returns the sum in the `Ok` variant if addition succeeds, or the overflowed value in the `Err` variant if it overflows.

This `Result` can be used to create an `Option`-returning function that avoids panicking on overflow:

```rust
fn u128_checked_add(a: u128, b: u128) -> Option<u128> {
    match u128_overflowing_add(a, b) {
        Ok(r) => Some(r),
        Err(r) => None,
    }
}
```

In `u128_checked_add`, the `match` expression inspects the `Result`. If `Ok(r)`, it returns `Some(r)`; if `Err(r)`, it returns `None`.

#### Example: Parsing with Error Handling

Another common use case involves parsing, where failure results in an error type:

```rust
fn parse_u8(s: felt252) -> Result<u8, felt252> {
    match s.try_into() {
        Some(value) => Ok(value),
        None => Err('Invalid integer'),
    }
}
```

---

Sources:

- https://www.starknet.io/cairo-book/ch08-01-generic-data-types.html

---

### Generics and References

#### Example: Finding the Smallest Element with Generics

The following code attempts to find the smallest element in a list of generic type `T`, where `T` implements `PartialOrd`. The function receives a snapshot of the array (`@Array<T>`), which avoids the need for `T` to implement `Drop` for the array itself.

```rust
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

#### Trait Requirements for Generic Functions with Desnapping

When indexing on `list`, the result is a snap (`@T`). Using the desnap operator (`*`) converts `@T` to `T`. This copy operation requires that `T` implements the `Copy` trait. Furthermore, since variables of type `T` are now created within the function scope (via copying), `T` must also implement the `Drop` trait.

#### Corrected Function Signature

To make the function compile, both `Copy` and `Drop` traits must be explicitly required for the generic type `T`:

```rust
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

---

Sources:

- https://www.starknet.io/cairo-book/ch11-01-closures.html
- https://www.starknet.io/cairo-book/ch11-00-functional-features.html

---

# Closures

Cairo's design takes strong inspiration from functional programming, featuring constructs like closures and iterators. Closures are function-like constructs you can store in a variable or pass as arguments to other functions.

## Understanding Closures

Closures are anonymous functions that can capture values from the scope in which they are defined, allowing for code reuse and behavior customization. They were introduced in Cairo 2.9.

When writing Cairo programs, closures provide a way to define behavior inline without creating a separate named function, which is particularly valuable when working with collections or passing behavior as a parameter.

The following example demonstrates basic usage, array methods utilizing closures (`map`, `filter`), and capturing an environment variable (`x`):

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

## Closure Syntax and Type Inference

The closure's arguments are placed between pipes (`|`). Types for arguments and the return value are usually inferred from usage, unlike named functions where types form an explicit interface. The body is an expression, optionally enclosed in curly braces `{}` if it spans multiple lines.

Type annotations can be added for clarity:
```cairo
fn  add_one_v1   (x: u32) -> u32 { x + 1 }
let add_one_v2 = |x: u32| -> u32 { x + 1 };
let add_one_v3 = |x|             { x + 1 };
let add_one_v4 = |x|               x + 1  ;
```

The compiler infers one concrete type for parameters and the return value upon first use, locking the closure to that type. Subsequent attempts to use a different type will result in a type error.

```cairo
//TAG: does_not_compile
#[executable]
fn main() {
    let example_closure = |x| x;

    let s = example_closure(5_u64);
    let n = example_closure(5_u32);
}
```
The compiler infers `u64` from the first call (`s`), and the second call (`n`) fails because the closure implementation is locked to the `Fn` trait for `u64` arguments.

## Capturing the Environment

Closures can include bindings from their enclosing scope. For example, `my_closure` in the first code block uses the captured binding `x = 8`.

Note that, at the moment, closures are still not allowed to capture mutable variables, but this is expected to be supported in future Cairo versions.

---

Sources:

- https://www.starknet.io/cairo-book/ch12-04-hash.html
- https://www.starknet.io/cairo-book/ch102-04-serialization-of-cairo-types.html
- https://www.starknet.io/cairo-book/appendix-03-derivable-traits.html

---

# Data Serialization and Hashing

## Data Serialization using Serde

Serialization transforms data structures into a format for storage or transmission (e.g., an array), while deserialization reverses this process. The `Serde` trait provides `serialize` and `deserialize` implementations.

Deriving `Drop` is required when serializing a structure owned by the current scope, as `serialize` takes a snapshot.

### Example: Serializing a Struct

```rust
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
Running this results in `Run panicked with [2, 99 ('c'), ]`. Deserialization can convert the array back into the struct using `Serde::<A>::deserialize(ref span_array).unwrap()`.

## Serialization Details for Complex Types

### Types with Non-Trivial Serialization

Data types using more than 252 bits require special serialization handling:
*   Unsigned integers larger than 252 bits: `u256` and `u512`.
*   Arrays and spans.
*   Enums.
*   Structs and tuples.
*   Byte arrays (strings).

Basic types are serialized as a single-member list containing one `felt252` value.

### Serialization of `u256`

A `u256` value is represented by two `felt252` values:
1.  The 128 least significant bits (low part).
2.  The 128 most significant bits (high part).

| Decimal Value | Binary Split (High | Low) | Serialized Array |
| :--- | :--- | :--- | :--- |
| 2 | 0...0 | 0...10 | `[2, 0]` |
| $2^{128}$ | 0...01 | 0...0 | `[0, 1]` |
| $2^{129}+2^{128}+20$ | 0...011 | 0...10100 | `[20, 3]` |

### Serialization of `u512`

The `u512` type is a struct containing four `felt252` members, each representing a 128-bit limb.

### Serialization of Structs and Tuples

Members are serialized in the order they appear in the definition.

For `struct MyStruct { a: u256, b: felt252, c: Array<felt252> }`, if $a=2$, $b=5$, and $c=[1,2,3]$, the serialization is:
| Member | Type | Serialization |
| :--- | :--- | :--- |
| `a: 2` | `u256` | `[2,0]` |
| `b: 5` | `felt252` | `5` |
| `c: [1,2,3]` | `felt252` array of size 3 | `[3,1,2,3]` |

Total serialization: `[2,0,5,3,1,2,3]`.

### Serialization of Byte Arrays

A `ByteArray` (string) is serialized via a struct containing:
*   `data: Array<felt252>`: Contains 31-byte chunks, where each `felt252` holds 31 bytes.
*   `pending_word: felt252`: Remaining bytes (at most 30).
*   `pending_word_len: usize`: Length of `pending_word` in bytes.

**Example (`hello`, 5 bytes: `0x68656c6c6f`):**
```
0, // Number of 31-byte words in the data array.
0x68656c6c6f, // Pending word
5 // Length of the pending word, in bytes
```

## Hashing in Cairo

Hashing converts input data (message) of any length into a fixed-size hash value deterministically. This is crucial for Merkle trees and data integrity.

### Hash Functions in Cairo

The Cairo core library provides two native hash functions:

*   **Pedersen**: A cryptographic algorithm based on elliptic curve cryptography and the Elliptic Curve Discrete Logarithm Problem (ECDLP), ensuring one-way security.
*   **Poseidon**: Designed for efficiency in algebraic circuits, particularly for Zero-Knowledge proof systems like STARKs. It uses a sponge construction with a three-element state permutation.

### Using Hash Functions

To hash, import relevant traits. Hashing involves initialization, updating the state, and finalizing the result.

1.  **Initialization**: `PoseidonTrait::new() -> HashState` or `PedersenTrait::new(base: felt252) -> HashState`.
2.  **Update**: `update(self: HashState, value: felt252) -> HashState` or `update_with(self: S, value: T) -> S`.
3.  **Finalization**: `finalize(self: HashState) -> felt252`.

#### Poseidon Hashing Example (Requires `#[derive(Hash)]`)

```rust
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

Pedersen requires an initial `felt252` base state. Hashing a struct can involve serializing it first, or using `update_with` with an arbitrary base state.

```rust
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

### Advanced Hashing: Hashing Arrays with Poseidon

For hashing `Span<felt252>` or `Array<felt252>` within a structure (where deriving `Hash` might fail due to the array type), use the built-in function `poseidon_hash_span`.

```rust
use core::hash::{HashStateExTrait, HashStateTrait};
use core::poseidon::{PoseidonTrait, poseidon_hash_span};

#[derive(Drop)]
struct StructForHashArray {
    first: felt252,
    second: felt252,
    third: Array<felt252>,
}

#[executable]
fn main() {
    let struct_to_hash = StructForHashArray { first: 0, second: 1, third: array![1, 2, 3, 4, 5] };

    let mut hash = PoseidonTrait::new().update(struct_to_hash.first).update(struct_to_hash.second);
    let hash_felt252 = hash.update(poseidon_hash_span(struct_to_hash.third.span())).finalize();
}
```

---

Sources:

- https://www.starknet.io/cairo-book/ch12-08-printing.html

---

### Printing Standard Data Types

Cairo uses two macros for printing standard data types:

*   `println!`: prints on a new line.
*   `print!`: prints inline.

Both take a `ByteArray` string as the first parameter, which can contain placeholders `{}` for values given as subsequent parameters, or named placeholders `{variable_name}`.

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

These macros use the `Display` trait. Attempting to print complex data types without implementing `Display` results in an error.

### Formatting

The `format!` macro handles string formatting, returning a `ByteArray` instead of printing to the screen. It is preferred over string concatenation using the `+` operator because `format!` does not consume its parameters (it uses snapshots).

```cairo
use core::fmt::ByteArray;

#[executable]
fn main() {
    let s1: ByteArray = "tic";
    let s2: ByteArray = "tac";
    let s3: ByteArray = "toe";
    let s = s1 + "-" + s2 + "-" + s3;
    // using + operator consumes the strings, so they can't be used again!

    let s1: ByteArray = "tic";
    let s2: ByteArray = "tac";
    let s3: ByteArray = "toe";
    let s = format!("{s1}-{s2}-{s3}"); // s1, s2, s3 are not consumed by format!
    // or
    let s = format!("{}-{}-{}", s1, s2, s3);

    println!("{}", s);
}
```

### Printing Custom Data Types

Custom data types require manual implementation of the `Display` trait to be used with `{}` placeholders in printing macros. The trait signature is:

```cairo
trait Display<T> {
    fn fmt(self: @T, ref f: Formatter) -> Result<(), Error>;
}
```

The `Formatter` struct contains the `buffer: ByteArray` where the formatted output is appended.

Implementing `Display` for a custom `Point` struct using `format!`:

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
    println!("{}", p); // Point: (1, 3)
}
```

The `write!` and `writeln!` macros can also be used within the `fmt` implementation to write formatted strings directly to the `Formatter`'s buffer.

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

### Print in Hexadecimal

Integer values can be printed in hexadecimal format using the `{:x}` notation, which relies on the `LowerHex` trait. This trait is implemented for basic types, `felt252`, `NonZero`, and Starknet types like `ContractAddress` and `ClassHash`. The `LowerHex` trait can also be implemented for custom types.

### Print Debug Traces

The `Debug` trait allows printing complex data types, especially useful for debugging. It is used by adding `:?` within placeholders (e.g., `println!("{:?}", my_struct)`).

*   It is implemented by default for basic data types.
*   For complex data types, it can be derived using `#[derive(Debug)]`, provided all contained types also implement `Debug`.
*   `assert_xx!` macros in tests require implemented `Debug` traits for provided values.

---

Sources:

- https://www.starknet.io/cairo-book/ch03-02-dictionaries.html
- https://www.starknet.io/cairo-book/ch12-01-custom-data-structures.html
- https://www.starknet.io/cairo-book/ch04-01-what-is-ownership.html
- https://www.starknet.io/cairo-book/ch04-02-references-and-snapshots.html
- https://www.starknet.io/cairo-book/ch12-02-smart-pointers.html
- https://www.starknet.io/cairo-book/ch03-01-arrays.html
- https://www.starknet.io/cairo-book/ch102-04-serialization-of-cairo-types.html
- https://www.starknet.io/cairo-book/ch04-00-understanding-ownership.html
- https://www.starknet.io/cairo-book/ch05-02-an-example-program-using-structs.html

---

---

Sources:

- https://www.starknet.io/cairo-book/ch102-04-serialization-of-cairo-types.html
- https://www.starknet.io/cairo-book/ch03-01-arrays.html
- https://www.starknet.io/cairo-book/ch05-02-an-example-program-using-structs.html

---

# Core Data Structures and Serialization

## Arrays in Cairo

An array in Cairo is a collection of elements of the same type, utilizing the `ArrayTrait` trait from the core library. Arrays function as queues: their values cannot be modified once written, meaning elements can only be appended to the end and removed from the front.

### Creating an Array

Arrays are instantiated using `ArrayTrait::new()`. The type can be specified during instantiation:

```rust
#[executable]
fn main() {
    let mut a = ArrayTrait::new();
    a.append(0);
    a.append(1);
    a.append(2);
}
```

Type specification examples:
```rust
let mut arr = ArrayTrait::<u128>::new();
```
or
```rust
let mut arr:Array<u128> = ArrayTrait::new();
```

### Updating an Array

Elements are added to the end using `append()`:

```rust
#[executable]
fn main() {
    let mut a = ArrayTrait::new();
    a.append(0);
    a.append(1);
    a.append(2);
}
```

Elements are removed only from the front using `pop_front()`, which returns an `Option` containing the removed element or `None` if empty:

```rust
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

## Serialization Formats

### Array Serialization

Arrays are serialized in the format: `<array/span_length>, <first_serialized_member>,..., <last_serialized_member>`.

For an array of `u256` values like `array![10, 20, POW_2_128]`, where each `u256` is two `felt252` values, the serialization is: `[3,10,0,20,0,0,1]`.

### Enum Serialization

An enum is serialized as: `<index_of_enum_variant>,<serialized_variant>`. Enum variant indices are 0-based.

**Example 1 (`Week` enum):**
```rust
enum Week {
    Sunday: (), // Index=0.
    Monday: u256, // Index=1.
}
```
| Instance | Index | Type | Serialization |
| --- | --- | --- | --- |
| `Week::Sunday` | `0` | unit | `[0]` |
| `Week::Monday(5)` | `1` | `u256` | `[1,5,0]` |

**Example 2 (`MessageType` enum):**
```rust
enum MessageType {
    A,
    #[default]
    B: u128,
    C
}
```
| Instance | Index | Type | Serialization |
| --- | --- | --- | --- |
| `MessageType::A` | `0` | unit | `[0]` |
| `MessageType::B(6)` | `1` | `u128` | `[1,6]` |
| `MessageType::C` | `2` | unit | `[2]` |

### String Serialization (Long Strings)

For strings longer than 31 bytes, serialization involves 31-byte words, followed by a pending word and its length:

For the string `Long string, more than 31 characters.`:
```
1, // Number of 31-byte words in the array construct.
0x4c6f6e6720737472696e672c206d6f7265207468616e203331206368617261, // 31-byte word.
0x63746572732e, // Pending word
6 // Length of the pending word, in bytes
```

---

Sources:

- https://www.starknet.io/cairo-book/ch03-02-dictionaries.html
- https://www.starknet.io/cairo-book/ch12-01-custom-data-structures.html
- https://www.starknet.io/cairo-book/ch04-01-what-is-ownership.html

---

## Felt252Dict: Key-Value Storage Implementation

`Felt252Dict<T>` is a built-in dictionary type in Cairo that overcomes the limitation of immutable memory by simulating mutable key-value storage behavior.

### Basic Usage and Value Rewriting

Instances of `Felt252Dict<T>` can be created using `Default::default()`. Operations like insertion and retrieval are defined in the `Felt252DictTrait` trait, utilizing methods like `insert` and `get`.

`Felt252Dict<T>` effectively allows overwriting stored values for a given key. For example:

```
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

### Zero Initialization and Immutability Constraints

When a `Felt252Dict<T>` is instantiated, all keys are internally initialized to zero. Consequently, querying a non-existent key returns 0. This also means there is no mechanism to delete data from a dictionary.

### Dictionaries Underneath

To simulate mutability within Cairo's immutable memory system, `Felt252Dict<T>` is implemented as a list of entries, conceptually similar to `Array<Entry<T>>`. Each `Entry<T>` records an interaction and has three fields:

1. `key`: Identifies the key.
2. `previous_value`: The value held at `key` before this interaction.
3. `new_value`: The value held at `key` after this interaction.

```
struct Entry<T> {
    key: felt252,
    previous_value: T,
    new_value: T,
}
```

Every interaction generates a new `Entry<T>`:
*   `get`: Registers an entry where `previous_value` equals `new_value`.
*   `insert`: Registers an entry where `new_value` is the inserted element, and `previous_value` is the last value associated with the key (or zero if it's the first entry).

This approach avoids rewriting memory cells, instead creating new entries for every access. For example, sequential operations on 'Alex' (insert 100, insert 200) and 'Maria' (insert 50, then read) yield entries like:

| key | previous | new |
| --- | --- | --- |
| Alex | 0 | 100 |
| Maria | 0 | 50 |
| Alex | 100 | 200 |
| Maria | 50 | 50 |

### Dictionary Destruction and Squashing

For provability, dictionaries must be 'squashed' when destructed. Unlike the `Drop` trait, which is a no-op for dictionaries, the `Destruct` trait enforces this necessary side-effect.

Types containing dictionaries cannot derive `Drop`. If a struct contains a `Felt252Dict<T>`, it must implement `Destruct<T>` manually to call `self.balances.squash()`:

```
impl UserDatabaseDestruct<T, +Drop<T>, +Felt252DictValue<T>> of Destruct<UserDatabase<T>> {
    fn destruct(self: UserDatabase<T>) nopanic {
        self.balances.squash();
    }
}
```

### Interacting with Entries using `entry` and `finalize`

The `entry` method allows creating a new entry for a key, taking ownership of the dictionary and returning the entry type (`Felt252DictEntry<T>`) and the previous value.

```
fn entry(self: Felt252Dict<T>, key: felt252) -> (Felt252DictEntry<T>, T) nopanic
```

The `finalize` method inserts the entry back and returns ownership of the dictionary:

```
fn finalize(self: Felt252DictEntry<T>, new_value: T) -> Felt252Dict<T>
```

Implementing a custom `get` method using these tools involves reading the previous value and finalizing the entry with that same value:

```
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

Implementing custom `insert` is similar, but the `finalize` call uses the new `value` instead of the previous one.

### Dictionaries in Custom Structures

`Felt252Dict<T>` is fundamental for creating mutable custom data structures, such as implementing a mutable vector (`MemoryVec<T>`) or a user database (`UserDatabase<T>`).

For instance, in `MemoryVec<T>`, `set` overwrites a value at an index by inserting a new entry into the underlying dictionary:

```
fn set(ref self: MemoryVec<T>, index: usize, value: T) {
    assert!(index < self.len(), "Index out of bounds");
    self.data.insert(index.into(), NullableTrait::new(value));
}
```

---

Sources:

- https://www.starknet.io/cairo-book/ch04-01-what-is-ownership.html
- https://www.starknet.io/cairo-book/ch04-00-understanding-ownership.html
- https://www.starknet.io/cairo-book/ch04-02-references-and-snapshots.html

---

# Ownership Model and Type Traits

Cairo utilizes a linear type system where every value must be used exactly once, either by being *destroyed* or *moved*. This system statically ensures that operations that could cause runtime errors, such as writing twice to the same memory cell, are caught at compile time.

## Linear Type System and Usage

In a linear type system, any value must be used once. "Used" means the value is either destroyed or moved:
*   **Destruction** occurs when a variable goes out of scope, is destructured, or explicitly destroyed via `destruct()`.
*   **Moving** a value means passing it to another function.

Cairo's ownership model focuses on *variables*, not values, because the underlying memory is immutable. A value can be safely referred to by many variables, but variables themselves follow strict ownership rules:
1.  Each variable has exactly one owner at any time.
2.  When the owner goes out of scope, the variable is destroyed.

This system serves to ensure all code is provable and verifiable, abstracting the immutable memory of the Cairo VM. Attempting to use a variable after it has been moved results in a compile-time error, as demonstrated when trying to pass an `Array` to a function twice without implementing `Copy`:

```cairo
fn foo(mut arr: Array<u128>) {
    arr.pop_front();
}

#[executable]
fn main() {
    let arr: Array<u128> = array![];
    foo(arr);
    foo(arr);
}
```

## The `Copy` Trait

The `Copy` trait allows simple types to be duplicated by copying felts without allocating new memory segments, bypassing default move semantics.

*   Basic types implement `Copy` by default.
*   Types like `Array` and `Felt252Dict` cannot implement `Copy` because manipulating them across different scopes is forbidden by the type system.
*   Custom types that do not contain non-Copy components can implement `Copy` using `#[derive(Copy)]`.

If a type implements `Copy`, passing the variable transfers a copy, and the original variable remains valid, retaining ownership. For example, with a `Point` struct implementing `Copy`:

```cairo
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
If `Copy` is not derived, attempting to pass `p1` twice results in a compile-time error.

## Cloning and Return Values

For complex types like `Array` that cannot implement `Copy`, deep copying is achieved using the `.clone()` method. A call to `clone()` executes arbitrary code to copy the underlying value to new memory cells.

```cairo
#[executable]
fn main() {
    let arr1: Array<u128> = array![];
    let arr2 = arr1.clone();
}
```

Returning a value from a function is equivalent to *moving* it to the caller. The following example illustrates scope and moves:

```cairo
#[derive(Drop)]
struct A {}

#[executable]
fn main() {
    let a1 = gives_ownership();           // gives_ownership moves its return
                                          // value into a1

    let a2 = A {};                        // a2 comes into scope

    let a3 = takes_and_gives_back(a2);    // a2 is moved into
                                          // takes_and_gives_back, which also
                                          // moves its return value into a3

} // Here, a3 goes out of scope and is dropped. a2 was moved, so nothing
  // happens. a1 goes out of scope and is dropped.

fn gives_ownership() -> A {               // gives_ownership will move its
                                          // return value into the function
                                          // that calls it

    let some_a = A {};                    // some_a comes into scope

    some_a                                // some_a is returned and
                                          // moves ownership to the calling
                                          // function
}

// This function takes an instance some_a of A and returns it
fn takes_and_gives_back(some_a: A) -> A { // some_a comes into scope

    some_a                                // some_a is returned and
                                          // moves ownership to the calling
                                          // function
}
```

## Passing Variables to Functions

When passing a variable to a function, ownership rules dictate how the variable can be used afterward:
*   **Pass-by-value**: Ownership of the variable is transferred to the function.
*   **Snapshot (`@`)**: Ownership is retained by the caller, and the function receives an immutable view.
*   **Mutable Reference (`ref`)**: Ownership is retained by the caller, and the function receives a mutable view.

---

Sources:

- https://www.starknet.io/cairo-book/ch04-02-references-and-snapshots.html
- https://www.starknet.io/cairo-book/ch03-01-arrays.html

---

## Data Access Mechanisms: Snapshots and References

### Reading Elements from an Array

To access array elements, you can use `get()` or `at()` array methods. `arr.at(index)` is equivalent to using the subscripting operator `arr[index]`.

#### `get()` Method

The `get` function returns an `Option<Box<@T>>`. This returns a snapshot of the element if it exists, or `None` if the index is out of bounds, preventing panics.

Here is an example with the `get()` method:

```\n#[executable]\nfn main() -> u128 {\n    let mut arr = ArrayTrait::<u128>::new();\n    arr.append(100);\n    let index_to_access =\n        1; // Change this value to see different results, what would happen if the index doesn't exist?\n    match arr.get(index_to_access) {\n        Some(x) => {\n            *x\n                .unbox() // Don't worry about * for now, if you are curious see Chapter 4.2 #desnap operator\n            // It basically means "transform what get(idx) returned into a real value"\n        },\n        None => { panic!("out of bounds") },\n    }\n}\n```

### Snapshots

A snapshot (`@T`) is an immutable view of a value at a certain point in execution. They allow retaining ownership when passing data to functions, avoiding the need to return values to restore ownership. Snapshots are passed by value (copied), meaning the size of `@T` is the same as `T`.

Accessing fields of a snapshot yields snapshots of those fields, which must be desnapped using `*` to get the values, provided the field type implements `Copy`.

Attempting to modify values associated with snapshots results in a compiler error:

```\n#[derive(Copy, Drop)]\nstruct Rectangle {\n    height: u64,\n    width: u64,\n}\n\n#[executable]\nfn main() {\n    let rec = Rectangle { height: 3, width: 10 };\n    flip(@rec);\n}\n\nfn flip(rec: @Rectangle) {\n    let temp = rec.height;\n    rec.height = rec.width;\n    rec.width = temp;\n}\n```\n
#### Desnap Operator

The desnap operator `*` is the opposite of the `@` operator, used to convert a snapshot back into a regular variable. This is only possible for `Copy` types, and it is a completely free operation.

```\n#[derive(Drop)]\nstruct Rectangle {\n    height: u64,\n    width: u64,\n}\n\n#[executable]\nfn main() {\n    let rec = Rectangle { height: 3, width: 10 };\n    let area = calculate_area(@rec);\n    println!("Area: {}", area);\n}\n\nfn calculate_area(rec: @Rectangle) -> u64 {\n    // As rec is a snapshot to a Rectangle, its fields are also snapshots of the fields types.\n    // We need to transform the snapshots back into values using the desnap operator `*`.\n    // This is only possible if the type is copyable, which is the case for u64.\n    // Here, `*` is used for both multiplying the height and width and for desnapping the snapshots.\n    *rec.height * *rec.width\n}\n```\n
### Mutable References

To allow mutation while keeping ownership in the calling context, a *mutable reference* is used with the `ref` modifier. The variable must be declared mutable (`mut`) in the caller. Like snapshots, `ref` arguments are passed by value (copied) to the function, ensuring the function operates on a local version which is implicitly returned at the end of execution.

In Listing 4-5, a mutable reference swaps fields:

```\n#[derive(Drop)]\nstruct Rectangle {\n    height: u64,\n    width: u64,\n}\n\n#[executable]\nfn main() {\n    let mut rec = Rectangle { height: 3, width: 10 };\n    flip(ref rec);\n    println!("height: {}, width: {}", rec.height, rec.width);\n}\n\nfn flip(ref rec: Rectangle) {\n    let temp = rec.height;\n    rec.height = rec.width;\n    rec.width = temp;\n}\n```

---

Sources:

- https://www.starknet.io/cairo-book/ch12-01-custom-data-structures.html

---

# Simulating Dynamic Structures with Dictionaries

### Simulating a Dynamic Array with Dicts

A mutable dynamic array should support appending items, accessing items by index, setting values by index, and returning the current length. This interface can be defined as follows:

```rust
trait MemoryVecTrait<V, T> {
    fn new() -> V;
    fn get(ref self: V, index: usize) -> Option<T>;
    fn at(ref self: V, index: usize) -> T;
    fn push(ref self: V, value: T) -> ();
    fn set(ref self: V, index: usize, value: T);
    fn len(self: @V) -> usize;
}
```

To implement this, we use a `Felt252Dict<T>` to map indices to values, and a separate `len` field. The type `T` is wrapped in `Nullable` to allow using any type in the structure.

The structure definition and implementation are provided below:

```rust
use core::dict::Felt252Dict;
use core::nullable::NullableTrait;
use core::num::traits::WrappingAdd;

trait MemoryVecTrait<V, T> {
    fn new() -> V;
    fn get(ref self: V, index: usize) -> Option<T>;
    fn at(ref self: V, index: usize) -> T;
    fn push(ref self: V, value: T) -> ();
    fn set(ref self: V, index: usize, value: T);
    fn len(self: @V) -> usize;
}

struct MemoryVec<T> {
    data: Felt252Dict<Nullable<T>>,
    len: usize,
}

impl DestructMemoryVec<T, +Drop<T>> of Destruct<MemoryVec<T>> {
    fn destruct(self: MemoryVec<T>) nopanic {
        self.data.squash();
    }
}

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

### Simulating a Stack with Dicts

A Stack is a LIFO (Last-In, First-Out) collection. We define the necessary interface:

```rust
trait StackTrait<S, T> {
    fn push(ref self: S, value: T);
    fn pop(ref self: S) -> Option<T>;
    fn is_empty(self: @S) -> bool;
}
```

The stack structure, `NullableStack<T>`, also uses a dictionary for data storage and a length counter:

```rust
struct NullableStack<T> {
    data: Felt252Dict<Nullable<T>>,
    len: usize,
}
```

The implementation details for the stack trait methods are as follows:

```rust
use core::dict::Felt252Dict;
use core::nullable::{FromNullableResult, NullableTrait, match_nullable};

trait StackTrait<S, T> {
    fn push(ref self: S, value: T);
    fn pop(ref self: S) -> Option<T>;
    fn is_empty(self: @S) -> bool;
}

struct NullableStack<T> {
    data: Felt252Dict<Nullable<T>>,
    len: usize,
}

impl DestructNullableStack<T, +Drop<T>> of Destruct<NullableStack<T>> {
    fn destruct(self: NullableStack<T>) nopanic {
        self.data.squash();
    }
}

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

The `push` function inserts the element at the index equal to the current `len` and then increments `len`. The `pop` function decrements `len` (updating the stack top position) and then retrieves the value at the new `len` index.

---

Sources:

- https://www.starknet.io/cairo-book/ch12-02-smart-pointers.html
- https://www.starknet.io/cairo-book/ch03-02-dictionaries.html

---

# Smart Pointers and Recursive Types

## Smart Pointers Overview

A pointer is a variable holding a memory address. To prevent bugs and security vulnerabilities associated with unsafe memory access, Cairo uses *Smart Pointers*. These act like pointers but include extra metadata and capabilities, ensuring memory is accessed safely via strict type checking and ownership rules. Types like `Felt252Dict<T>` and `Array<T>` are examples of smart pointers, as they own a memory segment and manage access (e.g., arrays track their length). When an array is created, a new segment is allocated for its elements, and the array itself holds a pointer to that segment.

## The `Box<T>` Type

The principal smart pointer in Cairo is `Box<T>`. Instantiating `Box<T>` stores the data of type `T` in a dedicated memory area called the *boxed segment*. The execution segment only holds a pointer to this boxed data.

### Storing Data in the Boxed Segment

Boxes have minimal performance overhead but are useful when:
1.  The size of a type is unknown at compile time, and a fixed size is required.
2.  Transferring ownership of large data volumes, where copying the data is slow. Storing large data in a box means only the small pointer is copied during ownership transfer.

The syntax for creating and accessing a box is shown below:

```rust
#[executable]
fn main() {
    let b = BoxTrait::new(5_u128);
    println!("b = {}", b.unbox())
}
```
Listing 12-1: Storing a `u128` value in the boxed segment using a box

When instantiated, the value is stored in the boxed segment, and `b.unbox()` accesses it.

### Enabling Recursive Types with Boxes

Recursive types (where a type contains another value of itself) pose a problem because Cairo cannot determine their size at compile time. Since `Box<T>` always has a known size (the size of a pointer), inserting a box breaks the infinite recursive chain.

An example is defining a binary tree. An initial attempt fails because the `Node` variant holds another `BinaryTree` directly:

```rust
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

This is fixed by replacing the recursive type with `Box<T>`:

```rust
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
Listing 12-3: Defining a recursive Binary Tree using Boxes

The `Node` variant now holds `(u32, Box<BinaryTree>, Box<BinaryTree>)`, allowing the compiler to calculate the size.

### Using Boxes to Improve Performance

Passing pointers via boxes avoids copying large amounts of data when transferring ownership between functions. Only the pointer (a single value) is copied.

```rust
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
Listing 12-4: Storing large amounts of data in a box for performance.

When calling `pass_data`, the entire `Cart` struct is copied. When calling `pass_pointer`, only the pointer stored in `new_box` is copied. If the data in the box is mutated, a new `Box<T>` will be created, requiring the data to be copied into the new box.

## The `Nullable<T>` Type for Dictionaries

`Nullable<T>` is a smart pointer that can point to a value or be `null`. It is used primarily in dictionaries (`Felt252Dict<T>`) for types that do not implement the required `Felt252DictValue<T>` trait (specifically, the `zero_default` method). Complex types like arrays and structs (including `u256`) lack this implementation, making direct storage difficult.

`Nullable<T>` wraps the value inside a `Box<T>`, allowing complex types to be stored in dictionaries by utilizing the boxed segment.

For example, to store a `Span<felt252>` in a dictionary, you must use `Nullable<T>` wrapping a `Box<T>`:

```rust
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

//...
```
This approach is necessary because `Array<T>` does not implement the `Copy<T>` trait required for reading from a dictionary, whereas `Span<T>` does.

---

Sources:

- https://www.starknet.io/cairo-book/ch08-02-traits-in-cairo.html
- https://www.starknet.io/cairo-book/ch12-05-macros.html
- https://www.starknet.io/cairo-book/ch08-01-generic-data-types.html
- https://www.starknet.io/cairo-book/ch12-10-associated-items.html
- https://www.starknet.io/cairo-book/ch12-10-procedural-macros.html
- https://www.starknet.io/cairo-book/ch07-03-paths-for-referring-to-an-item-in-the-module-tree.html
- https://www.starknet.io/cairo-book/ch07-02-defining-modules-to-control-scope.html
- https://www.starknet.io/cairo-book/ch07-04-bringing-paths-into-scope-with-the-use-keyword.html
- https://www.starknet.io/cairo-book/ch12-09-deref-coercion.html
- https://www.starknet.io/cairo-book/ch11-01-closures.html
- https://www.starknet.io/cairo-book/ch05-03-method-syntax.html
- https://www.starknet.io/cairo-book/ch07-05-separating-modules-into-different-files.html
- https://www.starknet.io/cairo-book/ch08-00-generic-types-and-traits.html
- https://www.starknet.io/cairo-book/ch07-00-managing-cairo-projects-with-packages-crates-and-modules.html
- https://www.starknet.io/cairo-book/ch12-03-operator-overloading.html
- https://www.starknet.io/cairo-book/ch12-10-arithmetic-circuits.html
- https://www.starknet.io/cairo-book/appendix-02-operators-and-symbols.html
- https://www.starknet.io/cairo-book/appendix-03-derivable-traits.html
- https://www.starknet.io/cairo-book/ch02-04-comments.html
- https://www.starknet.io/cairo-book/ch12-00-advanced-features.html
- https://www.starknet.io/cairo-book/ch12-01-custom-data-structures.html
- https://www.starknet.io/cairo-book/ch12-02-smart-pointers.html
- https://www.starknet.io/cairo-book/ch12-04-hash.html

---

---

Sources:

- https://www.starknet.io/cairo-book/ch07-03-paths-for-referring-to-an-item-in-the-module-tree.html
- https://www.starknet.io/cairo-book/ch07-02-defining-modules-to-control-scope.html
- https://www.starknet.io/cairo-book/ch07-04-bringing-paths-into-scope-with-the-use-keyword.html
- https://www.starknet.io/cairo-book/ch07-05-separating-modules-into-different-files.html
- https://www.starknet.io/cairo-book/ch07-00-managing-cairo-projects-with-packages-crates-and-modules.html
- https://www.starknet.io/cairo-book/ch02-04-comments.html

---

# Modules, Paths, and Project Structure

As programs grow, organizing code by grouping related functionality into modules and separating concerns into distinct files becomes crucial. This organization clarifies where code resides and how features are implemented, facilitating reuse through encapsulation.

## Project Organization: Packages, Crates, and Modules

Cairo uses several concepts to manage large codebases:

*   **Packages:** A Scarb feature enabling building, testing, and sharing crates.
*   **Crates:** A tree of modules forming a single compilation unit. A crate has a root directory and a root module defined in `lib.cairo` within that directory.
*   **Modules and `use`:** Control the organization and scope of items.
*   **Paths:** Name items within the module tree.

A related concept is **scope**, the context where code is written, which defines which names are available. You cannot have two items with the same name in the same scope.

## Defining Modules and Controlling Scope

Modules let us organize code within a crate for readability and control privacy. Items within a module are private by default.

### Module Documentation

Module documentation comments provide an overview of the entire module, prefixed with `//!`, and are placed above the module they describe.

```cairo
//! # my_module and implementation
//!
//! This is an example description of my_module and some of its features.
//!
//! # Examples
//!
//! ```
//! mod my_other_module {
//!   use path::to::my_module;
//!
//!   fn foo() {
//!     my_module.bar();
//!   }
//! }
//! ```
mod my_module { // rest of implementation...
}
```

### Modules Cheat Sheet (Rules for Organization)

When organizing code, the compiler follows these rules:

1.  **Start from the crate root:** Compilation begins in the crate root file (`src/lib.cairo`).
2.  **Declaring modules (in crate root):** Use `mod garden;`. The compiler looks:
    *   Inline, within curly brackets replacing the semicolon.
    *   In the file `src/garden.cairo`.
3.  **Declaring submodules (in files other than crate root):** Use `mod vegetables;` in `src/garden.cairo`. The compiler looks:
    *   Inline, directly following `mod vegetables`, within curly brackets.
    *   In the file `src/garden/vegetables.cairo`.
4.  **Paths to code in modules:** Items are referenced using paths, e.g., `crate::garden::vegetables::Asparagus`.
5.  **Private vs public:** Code is private by default. Use `pub mod` to make a module public. Use `pub` before item declarations to make them public. `pub(crate)` restricts visibility to within the defining crate.
6.  **The `use` keyword:** Creates shortcuts to paths within a scope.

The module tree structure mirrors the filesystem directory tree. The crate root file forms the module named after the crate at the root of the module structure.

### Separating Modules into Different Files

When modules grow, their definitions can be moved to separate files.

*   If `mod front_of_house;` is declared in the crate root (`src/lib.cairo`), the compiler looks for its content in `src/front_of_house.cairo`.
*   For a submodule like `pub mod hosting;` declared in `src/front_of_house.cairo`, the compiler looks for its content in a directory named after the parent, i.e., `src/front_of_house/hosting.cairo`.

The `mod` keyword declares modules and tells Cairo where to look; it is not an "include" operation.

## Paths for Referring to Items

Paths name items in the module tree, similar to filesystem navigation.

A path can be:
*   **Absolute path:** Starts from the crate root, beginning with the crate name.
*   **Relative path:** Starts from the current module.

Both forms use double colons (`::`) as separators.

### Absolute vs. Relative Paths

To call a function like `add_to_waitlist` defined deep within nested modules:

```cairo
mod front_of_house {
    mod hosting {
        fn add_to_waitlist() {}
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

### Starting Relative Paths with `super`

The `super` keyword constructs a relative path starting from the parent module, analogous to `..` in filesystems.

```cairo
fn deliver_order() {}

mod back_of_house {
    fn fix_incorrect_order() {
        cook_order();
        super::deliver_order();
    }

    fn cook_order() {}
}
```

## Privacy and Visibility with `pub`

By default, code within a module is private to its parent modules. Items in child modules can see items in ancestor modules.

To expose items:

*   Mark the module declaration with `pub`. Making a module public only allows access to the module itself, not its contents.
*   Mark items within the module with `pub`.

For structs and enums:
*   `pub struct` makes the struct public, but its fields remain private unless explicitly marked `pub`.
*   `pub enum` makes the enum and all its variants public.

To allow an item to be visible only within the defining crate, use `pub(crate)`.

## Bringing Paths into Scope with the `use` Keyword

The `use` keyword creates shortcuts to paths within the current scope, reducing path repetition.

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

A `use` statement only applies to the scope in which it is declared.

### Idiomatic use of `use`

When bringing in functions, it is idiomatic to bring the parent module into scope, requiring the parent module name to be specified when calling the function, which clarifies the origin of the function.

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

For structs, enums, and traits, it is idiomatic to specify the full path when importing.

### Providing New Names with the `as` Keyword

If two items with the same name are brought into scope, the `as` keyword can create an alias:

```cairo
use core::array::ArrayTrait as Arr;

#[executable]
fn main() {
    let mut arr = Arr::new(); // ArrayTrait was renamed to Arr
    arr.append(1);
}
```

### Importing Multiple Items from the Same Module

Multiple items can be imported using curly braces `{}`:

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

### Re-exporting Names with `pub use`

Using `pub use` brings a name into scope and makes it available for others to import into their scope, effectively changing the public API structure without altering the internal structure.

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
This allows external code to use `crate::hosting::add_to_waitlist()` instead of the longer internal path.

---

Sources:

- https://www.starknet.io/cairo-book/ch08-01-generic-data-types.html
- https://www.starknet.io/cairo-book/ch08-00-generic-types-and-traits.html
- https://www.starknet.io/cairo-book/appendix-02-operators-and-symbols.html
- https://www.starknet.io/cairo-book/ch08-02-traits-in-cairo.html
- https://www.starknet.io/cairo-book/ch11-01-closures.html
- https://www.starknet.io/cairo-book/ch12-01-custom-data-structures.html
- https://www.starknet.io/cairo-book/ch12-02-smart-pointers.html

---

## Generics and Constrained Types

Generics in Cairo provide tools to handle the duplication of concepts by using abstract stand-ins for concrete types or other properties. This allows writing reusable code that works with many types, enhancing maintainability, although code duplication still exists at compile level, potentially increasing Starknet contract size.

### Syntax for Generics

Generics are defined using angle brackets `<...>` in various declarations:

*   **Definition**: `fn ident<...> ...`, `struct ident<...> ...`, `enum ident<...> ...`, `impl<...> ...`
*   **Specification**: `path::<...>` or `method::<...>` (turbofish) is used to specify parameters in an expression.

### Generic Functions

Functions can operate on generic types, avoiding multiple type-specific implementations. When defining a generic function, generics are placed in the signature.

For instance, a generic function signature:

```cairo
// Specify generic type T between the angulars
fn largest_list<T>(l1: Array<T>, l2: Array<T>) -> Array<T> {
    if l1.len() > l2.len() {
        l1
    } else {
        l2
    }
}
```

If operations like dropping an array of a generic type are required, the compiler needs assurance that the generic type `T` implements the necessary trait (like `Drop`). This is achieved using trait bounds:

```cairo
fn largest_list<T, impl TDrop: Drop<T>>(l1: Array<T>, l2: Array<T>) -> Array<T> {
    if l1.len() > l2.len() {
        l1
    } else {
        l2
    }
}
```

### Constraints for Generic Types (Trait Bounds)

Trait bounds constrain generic types to only accept types that implement a particular behavior. We saw this with `Drop<T>`.

#### Anonymous Generic Implementation Parameter (`+` Operator)

If the implementation of a required trait is not used in the function body, we can use the `+` operator to specify the constraint without naming the implementation (e.g., `+PartialOrd<T>` is equivalent to `impl TPartialOrd: PartialOrd<T>`).

An example using multiple constraints:

```cairo
fn smallest_element<T, +PartialOrd<T>, +Copy<T>, +Drop<T>>(list: @Array<T>) -> T {
    let mut smallest = *list[0];
    for element in list {
        if *element < smallest {
            smallest = *element;
        }
    }
    smallest
}
```

### Generic Data Types

Structs and enums can be defined using generic type parameters.

#### Generic Structs

Structs use `<>` syntax after the name to declare type parameters, which are then used as field types.

```cairo
#[derive(Drop)]
struct Wallet<T> {
    balance: T,
}
```

If implementing a trait for a generic struct, the implementation block must also declare generics and their constraints:

```cairo
struct Wallet<T> {
    balance: T,
}

impl WalletDrop<T, +Drop<T>> of Drop<Wallet<T>>;
```

Structs can have multiple generic types:

```cairo
#[derive(Drop)]
struct Wallet<T, U> {
    balance: T,
    address: U,
}
```

#### Generic Enums

Enums can hold generic data types in their variants, such as `Option<T>`:

```cairo
enum Option<T> {
    Some: T,
    None,
}
```

Or multiple generic types, like `Result<T, E>`:

```cairo
enum Result<T, E> {
    Ok: T,
    Err: E,
}
```

### Generic Methods

Methods can be implemented on generic types, using the type's generic parameters in the trait and impl definitions. Constraints can be specified on these generic types.

If a method involves combining two potentially different generic types, constraints must be applied to all involved types:

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

#### Associated Types and Type Equality

Generics can constrain types based on associated types using traits like `TypeEqual`. This ensures that different generic implementations share the same associated type.

```cairo
trait StateMachine {
    type State;
    fn transition(ref state: Self::State);
}

// ... TA and TB implementations use StateCounter as State ...

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
```

#### Generics in Closures

When using generics with closures (e.g., in array extension methods like `map`), the output type of the closure (an associated type of `Fn`) can differ from the input type `T`.

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

---

Sources:

- https://www.starknet.io/cairo-book/ch08-02-traits-in-cairo.html
- https://www.starknet.io/cairo-book/ch05-03-method-syntax.html
- https://www.starknet.io/cairo-book/ch12-10-associated-items.html
- https://www.starknet.io/cairo-book/appendix-03-derivable-traits.html
- https://www.starknet.io/cairo-book/ch11-01-closures.html
- https://www.starknet.io/cairo-book/ch12-04-hash.html

---

## Traits: Defining and Implementing Behavior

### Defining a Trait

A trait defines a set of methods that can be implemented by a type, grouping method signatures to define necessary behaviors. Traits are most useful when used with generic types to define shared behavior abstractly, allowing trait bounds to specify required functionality for generic types.

To declare a trait, use the `trait` keyword followed by the name. If it needs to be accessible by other crates, declare it as `pub`. Inside, declare method signatures ending with a semicolon. If the trait is generic, it includes a generic type parameter, like `pub trait Summary<T> { ... }`.

**Example of a non-generic trait definition:**
```cairo
#[derive(Drop, Clone)]
struct NewsArticle {
    headline: ByteArray,
    location: ByteArray,
    author: ByteArray,
    content: ByteArray,
}

pub trait Summary {
    fn summarize(self: @NewsArticle) -> ByteArray;
}

impl NewsArticleSummary of Summary {
    fn summarize(self: @NewsArticle) -> ByteArray {
        format!("{:?} by {:?} ({:?})", self.headline, self.author, self.location)
    }
}
```

### Implementing a Trait on a Type

Implementing a trait on a type involves using `impl ImplementationName of TraitName` followed by the type parameter in angle brackets (if generic). Within the block, method signatures are provided with their concrete implementation bodies.

**Example of implementing a generic trait:**
```cairo
mod aggregator {
    pub trait Summary<T> {
        fn summarize(self: @T) -> ByteArray;
    }

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
}

use aggregator::{NewsArticle, Summary, Tweet};

#[executable]
fn main() {
    let news = NewsArticle {
        headline: "Cairo has become the most popular language for developers",
        location: "Worldwide",
        author: "Cairo Digger",
        content: "Cairo is a new programming language for zero-knowledge proofs",
    };

    let tweet = Tweet {
        username: "EliBenSasson",
        content: "Crypto is full of short-term maximizing projects. \n @Starknet and @StarkWareLtd are about long-term vision maximization.",
        reply: false,
        retweet: false,
    }; // Tweet instantiation

    println!("New article available! {}", news.summarize());
    println!("New tweet! {}", tweet.summarize());
}
```

### Methods and `self` Parameter

Methods must have a parameter named `self` as their first parameter. The type of `self` defines what instance the method is called on. `self` can be passed by ownership, snapshot (`@`), or reference (mutable reference `ref self`).

If a method does not modify the instance, `self` is typically declared as a snapshot (`self: @Type`). If modification is needed, a mutable reference is used (`ref self: Type`).

Methods are defined within `impl` blocks, which organize capabilities associated with a type. While methods can be defined directly on types via traits, this is verbose.

### Avoiding Trait Definition with `#[generate_trait]`

To avoid manually defining a trait when it's only intended for implementation on a specific type, Cairo provides the `#[generate_trait]` attribute above the implementation block. This tells the compiler to generate the corresponding trait definition automatically.

**Example using `#[generate_trait]`:**
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

### Default Implementations

Traits can provide default behavior for methods. Implementors can either use the default by providing an empty `impl` block or override it by providing a custom implementation for that method signature.

**Example with default implementation:**
```cairo
mod aggregator {
    pub trait Summary<T> {
        fn summarize(self: @T) -> ByteArray {
            "(Read more...)"
        }
        fn summarize_author(self: @T) -> ByteArray; // Required implementation
    }

    #[derive(Drop)]
    pub struct Tweet {
        pub username: ByteArray,
        pub content: ByteArray,
        pub reply: bool,
        pub retweet: bool,
    }

    impl TweetSummary of Summary<Tweet> {
        fn summarize_author(self: @Tweet) -> ByteArray {
            format!("@{}", self.username)
        }
    }
}

use aggregator::{Summary, Tweet};

#[executable]
fn main() {
    let tweet = Tweet {
        username: "EliBenSasson",
        content: "Crypto is full of short-term maximizing projects. \n @Starknet and @StarkWareLtd are about long-term vision maximization.",
        reply: false,
        retweet: false,
    };

    println!("1 new tweet: {}", tweet.summarize());
}
```
In this case, `summarize` uses its default implementation because only `summarize_author` was implemented.

### Derivable Traits

The `derive` attribute generates code to implement a default trait on a type. Traits compatible with `derive` in the standard library include `Clone` (for deep copying) and `Drop` (for automatic resource cleanup like squashing Dictionaries via the `Destruct` trait).

**Example deriving `Clone` and `Drop`:**
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

---

Sources:

- https://www.starknet.io/cairo-book/ch12-10-associated-items.html
- https://www.starknet.io/cairo-book/ch12-03-operator-overloading.html
- https://www.starknet.io/cairo-book/ch08-02-traits-in-cairo.html

---

## Associated Items and Operator Overloading

### Operator Overloading

Operator overloading allows redefining standard operators (like `+`, `-`, `*`, `/`) for user-defined types by implementing the corresponding trait for that operator. This enhances code readability if used judiciously.

For example, combining two `Potion` structs (with `health` and `mana` fields) can be achieved by implementing the `Add` trait:

```
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

```
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

### Associated Items

Associated items are items declared in traits or definitions in implementations, including associated functions (methods), associated types, associated constants, and associated implementations. They are useful when logically related to the implementation.

#### Associated Types

Associated types are type aliases within traits, allowing trait implementers to choose the actual types. This keeps trait definitions flexible and clean.

Consider the `Pack` trait, where `Result` is an associated type placeholder:

```
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

Using associated types (as in `bar`) leads to cleaner function signatures compared to explicitly listing the result type as a generic parameter (as in `foo`).

#### Associated Constants

Associated constants are constants tied to a type, declared with `const` in a trait and defined in its implementation. For example, the `Shape` trait defines an associated constant `SIDES`:

```
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

This allows generic functions like `print_shape_info` to access type-specific constants.

#### Constraint Traits on Associated Items

Associated items can be constrained based on the generic parameter type using the `[AssociatedItem: ConstrainedValue]` syntax after a trait bound. This is experimental and requires `experimental-features = ["associated_item_constraints"]` in `Scarb.toml`.

An example is constraining an iterator's `Item` associated type within an `extend` method implementation to match the collection's element type:

```
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

---

Sources:

- https://www.starknet.io/cairo-book/ch12-05-macros.html
- https://www.starknet.io/cairo-book/ch12-10-procedural-macros.html
- https://www.starknet.io/cairo-book/ch08-02-traits-in-cairo.html

---

## Metaprogramming: Macros and Code Transformation

Macros are a family of features in Cairo that allow writing code that writes other code, known as metaprogramming. They expand to produce more code than written manually, useful for reducing boilerplate.

### Macros vs. Functions

Functions require declared parameter counts and types, and are called at runtime. Macros, however, can take a variable number of parameters (e.g., `println!`) and are expanded before the compiler interprets the code, allowing them to perform compile-time actions like trait implementation. A downside is that macro definitions must be in scope before they are called, and their definitions are generally more complex than function definitions.

### Declarative Inline Macros

The simplest form is the declarative macro, defined using the `macro` construct. It operates similarly to a `match` expression, comparing the input source code structure against patterns.

#### Defining Declarative Macros

Declarative macros allow matching code structure to associated code blocks that replace the macro invocation.

The following example shows a simplified definition of an array-building macro:

```c
macro make_array {
    ($($x:expr), *) => {
        {
            let mut arr = $defsite::ArrayTrait::new();
            $(arr.append($x);)*
            arr
        }
    };
}
```

When called as `make_array![1, 2, 3]`, the `$x` pattern matches `1`, `2`, and `3`. The expansion `$(arr.append($x);)*` generates an `append` call for each matched expression, expanding to:

```c
{
    let mut arr = ArrayTrait::new();
    arr.append(1);
    arr.append(2);
    arr.append(3);
    arr
}
```

#### Macro Pattern Syntax

Macro patterns are matched against Cairo source code structure. Key components include:
*   Parentheses enclose the whole matcher pattern.
*   `$dollar_sign` introduces a macro variable that captures matching code. `$x:expr` matches any Cairo expression and names it `$x`.
*   A comma following `$()` requires literal commas between matched expressions.
*   The `*` quantifier specifies the subpattern can repeat zero or more times.

#### Hygiene: `$defsite`, `$callsite`, and `expose!`

Cairo’s inline macros are hygienic, meaning names introduced in the definition do not leak into the call site unless explicitly exposed. Name resolution references the definition site or call site using `$defsite::` and `$callsite::`.

To use user-defined inline macros, you must enable the experimental feature in `Scarb.toml`:
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
Macros are expected to expand to a single expression; wrapping multiple statements in `{}` achieves this.

The following example demonstrates hygiene and name resolution:

```c
macro make_array {
    ($($x:expr), *) => {
        {
            let mut arr = $defsite::ArrayTrait::new();
            $(arr.append($x);)*
            arr
        }
    };
}

#[cfg(test)]
#[test]
fn test_make_array() {
    let a = make_array![1, 2, 3];
    let expected = array![1, 2, 3];
    assert_eq!(a, expected);
}

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

use hygiene_demo::{
    add_callsite_bonus, add_defsite_bonus, apply_and_expose_total, wrapper_uses_exposed,
};
#[cfg(test)]
#[test]
fn test_hygiene_e2e() {

    // Callsite defines its own `bonus` — used only by callsite-resolving macro
    let bonus = | | -> u8 {
        20
    };
    let price: u8 = 5;
    assert_eq!(add_defsite_bonus!(price), 15); // uses defsite::def_bonus() = 10
    assert_eq!(add_callsite_bonus!(price), 25); // uses callsite::bonus() = 20

    // Call in statement position; it exposes `exposed_total` at the callsite
    apply_and_expose_total!(3);
    assert_eq!(exposed_total, 4);

    // A macro invoked by another macro can access exposed values via `$callsite::...`
    let w = wrapper_uses_exposed!(7);
    assert_eq!(w, 8);
}
```
This demonstrates:
*   `$defsite::...` resolves to items next to the macro definition.
*   `$callsite::...` resolves to items visible where the macro is invoked.
*   `expose!` deliberately introduces new items into the call site, accessible via `$callsite::name`.

### Procedural Macros

Procedural macros are Rust functions that transform Cairo code. They are preferred over declarative macros when needing attributes/derives or advanced transformations requiring Rust logic. They operate on `TokenStream` (source code units) and return a `ProcMacroResult`.

#### Procedural Macro Types and Signatures

Macros are defined using one of three attributes:
*   `#[inline_macro]`: For function-like calls (e.g., `println!()`).
    ```c
    #[inline_macro]
    pub fn inline(code: TokenStream) -> ProcMacroResult {}
    ```
*   `#[attribute_macro]`: For custom attributes.
    ```c
    #[attribute_macro]
    pub fn attribute(attr: TokenStream, code: TokenStream) -> ProcMacroResult {}
    ```
*   `#[derive_macro]`: For automatic trait implementations.
    ```c
    #[derive_macro]
    pub fn derive(code: TokenStream) -> ProcMacroResult {}
    ```

#### Project Setup and Dependencies

Creating a procedural macro requires a Rust project structure with `Cargo.toml` (defining `crate-type = ["cdylib"]` and `cairo-lang-macro` dependency) and a Cairo project structure with `Scarb.toml` marking the package as a plugin:

`Cargo.toml` example:
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
cairo-lang-parser = "2.12.0"
cairo-lang-syntax = "2.12.0"

[workspace]
```

`Scarb.toml` example for the macro package:
```toml
[package]
name = "pow"
version = "0.1.0"

[cairo-plugin]
```

To use the macro, the consuming project adds the macro package to its `[dependencies]` in `Scarb.toml`, e.g., `pow = { path = "../path/to/pow" }`.

#### Expression Macros

If the goal is expression transformation, declarative inline macros are simpler. Procedural expression macros are used when Rust-powered parsing is needed.

#### Derive Macros

Derive macros generate custom trait implementations automatically. The macro receives the type's structure, generates the implementation logic, and outputs the code.

To implement the `Hello` trait using `HelloMacro`:

```c
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
            impl SomeHelloImpl of Hello<{0}> {
                fn hello(self: @{0}) {
                    println!("Hello {0}!");
                }
            }
        "#, struct_name}))
}
```
The trait `Hello` must be defined or imported in the consuming code.

#### Attribute Macros

Attribute macros can apply to any item (like functions) and use a second argument (`attr: TokenStream`) to receive the attribute arguments (e.g., `#[macro(arguments)]`).

An example creating a macro to rename a struct:

```c
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
Usage example in a Cairo file:
```c
#[executable]
fn main() {
    let a = SomeType {};
    a.hello();

    let res = pow!(10, 2);
    println!("res : {}", res);

    let _a = RenamedType {};
}

#[derive(HelloMacro, Drop, Destruct)]
struct SomeType {}

#[rename]
struct OldType {}

trait Hello<T> {
    fn hello(self: @T);
}
```

### Advanced Constraints: TypeEqual Trait

The `core::metaprogramming::TypeEqual` trait allows creating constraints based on type equality, useful in advanced scenarios like excluding specific types from a trait implementation.

To implement a trait for all types that implement `Default`, except for `SensitiveData`:

```c
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

---

Sources:

- https://www.starknet.io/cairo-book/ch12-09-deref-coercion.html
- https://www.starknet.io/cairo-book/ch11-01-closures.html
- https://www.starknet.io/cairo-book/ch12-10-arithmetic-circuits.html
- https://www.starknet.io/cairo-book/ch12-00-advanced-features.html

---

# Advanced Features: Deref Coercion, Closures, and Circuits

This section covers advanced language features including implicit type coercion via traits, the mechanics of closures, and the use of arithmetic circuits.

### Deref Coercion

Deref coercion simplifies interacting with nested or wrapped data structures by allowing an instance of one type (`T`) to implicitly behave like an instance of another type (`K`) if `T` implements the `Deref` or `DerefMut` traits to `K`.

The traits are defined as:

```cairo
pub trait Deref<T> {
    type Target;
    fn deref(self: T) -> Self::Target;
}

pub trait DerefMut<T> {
    type Target;
    fn deref_mut(ref self: T) -> Self::Target;
}
```

Implementing `Deref` for a wrapper type allows direct access to the wrapped type's members:

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

#[executable]
fn main() {
    let wrapped_profile = Wrapper {
        value: UserProfile { username: 'john_doe', email: '[email protected]', age: 30 },
    };
    // Access fields directly via deref coercion
    println!("Username: {}", wrapped_profile.username);
    println!("Current age: {}", wrapped_profile.age);
}
```

`DerefMut` only applies to mutable variables. Deref coercion also permits calling methods defined on the target type directly on the source instance:

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

### Closures

The way a closure handles captured values determines which `Fn` traits it implements:

1.  **`FnOnce`**: Implemented by all closures. Applies if the closure moves captured values out of its body (callable only once).
2.  **`Fn`**: Applies if the closure does not move captured values out and does not mutate them (callable multiple times).

The `unwrap_or_else` method on `OptionTrait<T>` uses `FnOnce` to constrain the provided closure `f`, as it is called at most once:

```cairo
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

Closures are extensively used for functional programming patterns like `map` and `filter` on arrays:

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

### Arithmetic Circuits

Arithmetic circuits are mathematical models representing polynomial computations over a field, consisting of input signals and arithmetic operations (addition/multiplication gates). Cairo supports emulated arithmetic circuits up to 384 bits, useful for implementing verification for proof systems or cryptographic primitives.

Cairo's circuit constructs are found in `core::circuit`. Basic operations include `circuit_add` and `circuit_mul`. The following example computes $a \cdot (a + b)$ over the BN254 prime field, where inputs $a=10$ and $b=20$:

```cairo
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

---

Sources:

- https://www.starknet.io/cairo-book/ch12-06-inlining-in-cairo.html
- https://www.starknet.io/cairo-book/ch12-10-arithmetic-circuits.html
- https://www.starknet.io/cairo-book/ch103-02-01-under-the-hood.html
- https://www.starknet.io/cairo-book/ch12-10-procedural-macros.html

---

---

Sources:

- https://www.starknet.io/cairo-book/ch103-02-01-under-the-hood.html

---

## Compiler Internals and Component Structure

### Components: Under the Hood

Components provide powerful modularity to Starknet contracts. This section dives deep into the compiler internals to explain the mechanisms that enable component composability.

### A Primer on Embeddable Impls

An impl of a Starknet interface trait (marked with `#[starknet::interface]`) can be made embeddable. Embeddable impls can be injected into any contract, adding new entry points and modifying the ABI of the contract.

Example demonstrating embeddable impls:
```rust
#[starknet::interface]
trait SimpleTrait<TContractState> {
    fn ret_4(self: @TContractState) -> u8;
}

#[starknet::embeddable]
impl SimpleImpl<TContractState> of SimpleTrait<TContractState> {
    fn ret_4(self: @TContractState) -> u8 {
        4
    }
}

#[starknet::contract]
mod simple_contract {
    #[storage]
    struct Storage {}

    #[abi(embed_v0)]
    impl MySimpleImpl = super::SimpleImpl<ContractState>;
}
```
By embedding `SimpleImpl`, we externally expose `ret4` in the contract's ABI.

### Inside Components: Generic Impls

Components build upon this embedding mechanism using generic impls, as seen in the component impl block syntax:

```rust
    #[embeddable_as(OwnableImpl)]
    impl Ownable<
        TContractState, +HasComponent<TContractState>,
    > of super::IOwnable<ComponentState<TContractState>> {
```

The key points are:
*   The generic impl `Ownable` requires the implementation of the `HasComponent<TContractState>` trait by the underlying contract.
*   This trait is automatically generated with the `component!()` macro when using a component inside a contract.
*   The compiler will generate an embeddable impl that wraps any function in `Ownable`.

---

Sources:

- https://www.starknet.io/cairo-book/ch12-06-inlining-in-cairo.html

---

# Function Inlining Mechanics and Performance Tuning

Inlining replaces a function call with the body of the called function at the call site, eliminating function call overhead, which can improve performance by reducing executed instructions, though it may increase total program size.

### The `inline` Attribute Hints

In Cairo, the `inline` attribute suggests whether the Sierra code should be injected directly into the caller's context instead of using a `function_call` libfunc.

The variants are:
*   `#[inline]`: Suggests performing an inline expansion.
*   `#[inline(always)]`: Suggests an inline expansion should always be performed.
*   `#[inline(never)]`: Suggests that an inline expansion should never be performed.

Note that the attribute is only a hint and may be ignored by the compiler, although `#[inline(always)]` is rarely ignored. Annotating functions with `#[inline(always)]` reduces the total number of steps required by avoiding the step-cost associated with function calls and argument handling.

### Compiler Heuristics for Default Inlining

For functions without explicit inline directives, the compiler uses a heuristic approach. The decision relies mostly on the threshold `DEFAULT_INLINE_SMALL_FUNCTIONS_THRESHOLD`.

The compiler calculates a function's complexity using the `ApproxCasmInlineWeight` struct, which estimates the generated Cairo Assembly (CASM) statements. If this weight falls below the threshold, the function is inlined. The raw statement count is also considered.

Special cases are handled:
*   Very simple functions (e.g., returning a constant or calling another function) are always inlined.
*   Functions with complex control flow (like `Match`) or those ending with `Panic` are generally not inlined.

### Performance Tradeoffs and Code Size

Inlining presents a trade-off between the number of execution steps and code length.
*   **Benefit:** More frequent calls benefit more from inlining as the step count decreases.
*   **Drawback:** Inlining large functions or using `#[inline]` or `#[inline(always)]` indiscriminately increases compile time and code length due to duplication of Sierra code at every call site.

Inlining is particularly useful for small functions, ideally those with many arguments. In cases where the return value of an inlined function is unused, the compiler may further optimize by omitting the inlined code entirely, reducing both code length and steps, as demonstrated in Listing 12-6.

### Inlining Mechanics Illustrated (Sierra and Casm)

When a function is *not* inlined (e.g., `not_inlined`), the Sierra code uses the `function_call` libfunc. When it *is* inlined (e.g., `inlined`), its Sierra statements are injected directly into the caller's sequence of statements, using different variable IDs to avoid conflicts.

In the Casm example (Listing 12-5), the non-inlined function involves `call rel X` and `ret` instructions to manage the function stack. The inlined function body, however, appears directly in the sequence without any `call` instruction, leading to fewer total instructions executed for that part of the logic.

**Example Code (Listing 12-5):**
```rust
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

**Example Code (Listing 12-6):**
```rust
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

Use inlining cautiously where appropriate, as the compiler handles default inlining, and manual application is usually only for fine-tuning.

---

Sources:

- https://www.starknet.io/cairo-book/ch12-10-arithmetic-circuits.html

---

### Arithmetic Circuit Definition and Evaluation

Arithmetic circuits in Cairo, particularly when emulating zk-SNARKs features, involve defining elements, combining them with gates, assigning inputs, specifying a modulus, and finally evaluating the circuit.

#### Combining Circuit Elements and Gates

Circuit elements can be combined using arithmetic operations. For instance, combining `CircuitElement<a>` and `CircuitElement<b>` with an addition gate results in `CircuitElement<AddModGate<a, b>>`. Direct combination functions are available:

*   `circuit_add`
*   `circuit_sub`
*   `circuit_mul`
*   `circuit_inverse`

Note that `CircuitElement<T>` where $T$ is an input or gate type, represents the circuit description, while `CircuitElement<{}>` (empty struct) represents a signal or intermediate element.

#### Example Circuit Definition: $a \cdot (a + b)$

The following example demonstrates defining inputs, intermediate calculations, and the final output structure:

```rust
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

    let bn254_modulus = TryInto::<\n        _, CircuitModulus,\n    >::try_into([0x6871ca8d3c208c16d87cfd47, 0xb85045b68181585d97816a91, 0x30644e72e131a029, 0x0])\n        .unwrap();

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

#### Input Assignment

Inputs are assigned sequentially using an accumulator pattern. The `new_inputs()` call initiates this process, returning an `AddInputResult<C>` enum:

```rust
pub enum AddInputResult<C> {
    /// All inputs have been filled.
    Done: CircuitData<C>,
    /// More inputs are needed to fill the circuit instance's data.
    More: CircuitInputAccumulator<C>,
}
```

Values for inputs (which are 384-bit, represented by four `u96` limbs) are assigned by calling `next()` on the accumulator until `done()` is called to obtain the full `CircuitData<C>`.

#### Modulus Definition

Circuits operate over a finite field modulus (up to 384-bit). A `CircuitModulus` must be defined for evaluation. The BN254 prime field modulus is specified as:

```rust
    let bn254_modulus = TryInto::<\n        _, CircuitModulus,\n    >::try_into([0x6871ca8d3c208c16d87cfd47, 0xb85045b68181585d97816a91, 0x30644e72e131a029, 0x0])\n        .unwrap();
```

#### Circuit Evaluation

The evaluation process passes the input signals through the defined gates according to the modulus specified. This is done via the `eval` method on the circuit instance:

```rust
    let res = instance.eval(bn254_modulus).unwrap();
```

After evaluation, the results of output gates (or any intermediate gates) can be retrieved using `get_output` on the result object, passing the corresponding `CircuitElement`:

```rust
    let add_output = res.get_output(add);
    let circuit_output = res.get_output(mul);
```

#### Context on Arithmetic Circuits in Cairo

zk-SNARKs use arithmetic circuits over a finite field $F_p$, defined by constraints of the form:
\[
(a_1 \cdot s_1 + ... + a_n \cdot s_n) \cdot (b_1 \cdot s_1 + ... + b_n \cdot s_n) + (c_1 \cdot s_1 + ... + c_n \cdot s_n) = 0 \mod p
\]
Where $s_i$ are signals and $a_i, b_i, c_i$ are coefficients. A witness is an assignment satisfying these constraints. Cairo implements these structures to allow for zk-SNARKs proof verification inside STARK proofs, although STARKs primarily use Algebraic Intermediate Representation (AIR) polynomial constraints.

### Circuit Verification and Proof System Comparison

---

Sources:

- https://www.starknet.io/cairo-book/ch12-10-procedural-macros.html

---

### Macro Implementation Details

The core code for macro implementation is written in Rust and relies on three primary Rust crates:
*   `cairo_lang_macro`: Specific to macro implementation.
*   `cairo_lang_parser`: Used for compiler parser functions.
*   `cairo_lang_syntax`: Related to the compiler syntax.

Since macro functions operate at the Cairo syntax level, logic from the syntax functions created for the Cairo compiler can be reused directly. For deeper understanding of concepts like the Cairo parser or syntax, consulting the Cairo compiler workshop is recommended.

#### Example: `pow` Macro Implementation

The `pow` function example demonstrates processing input to extract the base and exponent arguments to calculate $base^{exponent}$.

```rust
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

---

Sources:

- https://www.starknet.io/cairo-book/ch101-02-contract-functions.html
- https://www.starknet.io/cairo-book/ch100-00-introduction-to-smart-contracts.html
- https://www.starknet.io/cairo-book/ch100-01-contracts-classes-and-instances.html
- https://www.starknet.io/cairo-book/ch101-01-starknet-types.html
- https://www.starknet.io/cairo-book/ch101-03-contract-events.html
- https://www.starknet.io/cairo-book/ch102-01-contract-class-abi.html
- https://www.starknet.io/cairo-book/appendix-02-operators-and-symbols.html
- https://www.starknet.io/cairo-book/ch101-00-building-starknet-smart-contracts.html
- https://www.starknet.io/cairo-book/ch103-00-building-advanced-starknet-smart-contracts.html
- https://www.starknet.io/cairo-book/ch103-02-02-component-dependencies.html
- https://www.starknet.io/cairo-book/ch103-03-upgradeability.html
- https://www.starknet.io/cairo-book/ch103-06-01-deploying-and-interacting-with-a-voting-contract.html

---

---

Sources:

- https://www.starknet.io/cairo-book/ch100-00-introduction-to-smart-contracts.html
- https://www.starknet.io/cairo-book/ch100-01-contracts-classes-and-instances.html
- https://www.starknet.io/cairo-book/ch101-01-starknet-types.html
- https://www.starknet.io/cairo-book/ch103-00-building-advanced-starknet-smart-contracts.html

---

### Introduction to Cairo and Starknet Architecture

#### Smart Contract Fundamentals
Smart contracts are characterized as **permissionless** and **transparent**, allowing for **composability** where contracts interact with one another. They are restricted to accessing data only from their deployment blockchain, requiring external software called *oracles* to fetch external data (e.g., token prices). Common development standards include `ERC20` (for tokens like USDC) and `ERC721` (for NFTs like CryptoPunks). Primary use cases currently center around DeFi (decentralized finance applications like lending/DEXs) and Tokenization.

#### Cairo and Starknet Architecture
Cairo is a language developed specifically for STARKs, enabling the writing of **provable code** to verify computation correctness between states. Starknet utilizes its own Virtual Machine (VM) instead of the EVM, which offers benefits like decreased transaction costs, native account abstraction ("Smart Accounts"), and support for emerging use cases such as **transparent AI** and fully **on-chain blockchain games**.

#### Cairo Programs vs. Starknet Smart Contracts
Starknet contracts are a superset of Cairo programs. A standard Cairo program requires a `main` function as its entry point. In contrast, contracts deployed on Starknet lack a `main` function but possess one or multiple entry points. For the compiler to recognize a module as a Starknet contract, it must be annotated with the `#[starknet::contract]` attribute.

#### Contract Address and State
A contract instance maintains a **nonce**, representing the number of transactions originating from that address plus one. The **Contract Address** is a unique identifier calculated as a chain hash (using `pedersen`) of several components:
*   `prefix`: ASCII encoding of the constant string `STARKNET_CONTRACT_ADDRESS`.
*   `deployer_address`: Determined by the deployment transaction type (e.g., 0 for `DEPLOY_ACCOUNT`).
*   `salt`: A value ensuring unique addresses and thwarting replay attacks.
*   `class_hash`.
*   `constructor_calldata_hash`: Array hash of constructor inputs.

The computation follows:
```
contract_address = pedersen(
    “STARKNET_CONTRACT_ADDRESS”,
    deployer_address,
    salt,
    class_hash,
    constructor_calldata_hash)
```

#### Starknet Types: ContractAddress
The `ContractAddress` type represents the unique address of a deployed contract on Starknet, essential for cross-contract calls and access control checks.

```rust
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
            assert!(caller == self.owner.read(), "Only owner can transfer");
            self.owner.write(new_owner);
        }
    }
}
```

---

Sources:

- https://www.starknet.io/cairo-book/ch100-01-contracts-classes-and-instances.html
- https://www.starknet.io/cairo-book/ch101-02-contract-functions.html
- https://www.starknet.io/cairo-book/ch100-00-introduction-to-smart-contracts.html
- https://www.starknet.io/cairo-book/ch101-01-starknet-types.html
- https://www.starknet.io/cairo-book/ch103-02-02-component-dependencies.html
- https://www.starknet.io/cairo-book/ch103-03-upgradeability.html

---

### Contract Class Definition and Lifecycle

Starknet distinguishes between a **contract class**, which is the definition of the contract (the code), and a **contract instance**, which is a deployed contract having its own storage and callable by transactions.

#### Contract Classes and Instances

Contract classes are identified uniquely by their **class hash**. To introduce new classes to Starknet's state, the `DECLARE` transaction is used. Once declared, instances can be deployed using the `deploy` system call, or their functionality can be used without deployment via the `library_call` system call (analogous to `delegatecall`).

#### Components of a Cairo Class Definition

A contract class is defined by several components whose hashes contribute to the final class hash:

| Name | Notes |
| :--- | :--- |
| Contract class version | Currently supported version is 0.1.0. |
| Array of external functions entry points | Defined by `(_selector_, _function_idx_)`. Selector is `starknet_keccak` hash of the function name. |
| Array of L1 handlers entry points | - |
| Array of constructors entry points | The compiler currently allows only one constructor. |
| ABI | A string supplied by the user declaring the class. The ABI hash is `starknet_keccak(bytes(ABI, "UTF-8"))`. |
| Sierra program | An array of field elements representing the Sierra instructions. |

The **class hash** is computed using the Poseidon hash function ($h$):
$$
\text{class\_hash} = h(\text{contract\_class\_version}, \text{external\_entry\_points}, \text{l1\_handler\_entry\_points}, \text{constructor\_entry\_points}, \text{abi\_hash}, \text{sierra\_program\_hash})
$$
The hash of an entry point array is $h(\text{selector}_1,\text{index}_1,...,\text{selector}_n,\text{index}_n)$. The version hash uses the ASCII encoding of the string `CONTRACT_V0.1.0`.

#### Contract Interfaces

Interfaces define the blueprint of a contract, specifying exposed functions without bodies. They are defined by annotating a trait with `#[starknet::interface]`. All functions in the trait are public.

The `self` parameter in function signatures determines state access:
*   `ref self: TContractState`: Allows modification of the contract's storage variables.
*   `self: @TContractState`: Takes a snapshot, preventing state modification (the compiler enforces this).

The implementation must conform to the interface, or a compilation error results.

#### Constructors and Public Functions

1.  **Constructors**: Run once upon deployment to initialize state.
    *   Must be named `constructor` and annotated with `#[constructor]`.
    *   Must take `self` as the first argument, usually with the `ref` keyword to allow state modification.
    *   A contract can have only one constructor.

2.  **Public Functions**: Accessible from outside the contract.
    *   Defined inside an implementation block annotated with `#[abi(embed_v0)]`, which embeds the functions as implementations of the Starknet interface and potential entry points.
    *   Alternatively, they can be defined independently using the `#[external(v0)]` attribute.

#### Upgradeability

Starknet supports native upgradeability by replacing the contract's class hash via the `replace_class_syscall`. This syscall updates the contract source code.

To implement this, an entry point must be exposed that executes `replace_class_syscall` with the new class hash. The `ClassHash` type represents the hash of a contract class.

```rust
use core::num::traits::Zero;
use starknet::{ClassHash, syscalls};

fn upgrade(new_class_hash: ClassHash) {
    assert!(!new_class_hash.is_zero(), "Class hash cannot be zero");
    syscalls::replace_class_syscall(new_class_hash).unwrap();
}
```

---

Sources:

- https://www.starknet.io/cairo-book/ch101-02-contract-functions.html
- https://www.starknet.io/cairo-book/ch100-00-introduction-to-smart-contracts.html
- https://www.starknet.io/cairo-book/ch101-00-building-starknet-smart-contracts.html
- https://www.starknet.io/cairo-book/ch103-06-01-deploying-and-interacting-with-a-voting-contract.html

---

### Core Implementation Patterns (Traits, Functions, and State)

Starknet contracts encapsulate state and logic within a module annotated with `#[starknet::contract]`. The contract state is defined within a struct annotated with `#[storage]`, which is always initialized empty. Logic is defined by functions interacting with this state.

#### Simple Contract Structure Example

A basic contract defines storage and implements functions via an interface:

```rust
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

#### Interfaces and Implementation Blocks

Contracts use interfaces, defined with `#[starknet::interface]`, as blueprints for their public functions. Logic is provided in implementation blocks (`impl`).

#### Function Visibility and Self Parameter

Functions can be classified based on their visibility and how they handle the contract state (`ContractState`):

##### External Functions (State Modifying)
External functions are public functions exposed to the outside world that can mutate state. They must take `self` as the first argument, passed by reference using the `ref` keyword, granting read and write access to storage variables.

##### View Functions (Read-Only by Convention)
View functions are public, typically read-only functions. They must take `self` as the first argument, passed as a snapshot using the `@` modifier. This restricts storage write access via `self` at compile time.

##### State Mutability Warning
The read-only property of view functions is enforced only by the compiler. Starknet does not enforce this limitation; a transaction targeting a view function *can* change the state via direct system calls or calls to other contracts. Developers must not assume view functions are side-effect free.

##### Other Function Types

*   **Standalone Public Functions**: Public functions defined outside an implementation block using the `#[external(v0)]` attribute. They must take `self` as the first parameter.
*   **Private (Internal) Functions**: Functions not exposed externally. They can only be called from within the contract. They can be grouped using `#[generate_trait]` or defined as free functions within the module. Private functions do not require `self` as the first argument.

The `NameRegistry` contract demonstrates these patterns, including using `Map` storage types, constructor logic, public functions within an `impl` block, a standalone public function (`get_contract_name`), and internal functions grouped via `#[generate_trait]`.

```rust
#[starknet::interface]
pub trait INameRegistry<TContractState> {
    fn store_name(ref self: TContractState, name: felt252);
    fn get_name(self: @TContractState, address: ContractAddress) -> felt252;
}

#[starknet::contract]
mod NameRegistry {
    use starknet::storage::{
        Map, StoragePathEntry, StoragePointerReadAccess, StoragePointerWriteAccess,
    };
    use starknet::{ContractAddress, get_caller_address};

    #[storage]
    struct Storage {
        names: Map<ContractAddress, felt252>,
        total_names: u128,
    }

    #[derive(Drop, Serde, starknet::Store)]
    pub struct Person {
        address: ContractAddress,
        name: felt252,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: Person) {
        self.names.entry(owner.address).write(owner.name);
        self.total_names.write(1);
    }

    // Public functions inside an impl block
    #[abi(embed_v0)]
    impl NameRegistry of super::INameRegistry<ContractState> {
        fn store_name(ref self: ContractState, name: felt252) {
            let caller = get_caller_address();
            self._store_name(caller, name);
        }

        fn get_name(self: @ContractState, address: ContractAddress) -> felt252 {
            self.names.entry(address).read()
        }
    }

    // Standalone public function
    #[external(v0)]
    fn get_contract_name(self: @ContractState) -> felt252 {
        'Name Registry'
    }

    // Could be a group of functions about a same topic
    #[generate_trait]
    impl InternalFunctions of InternalFunctionsTrait {
        fn _store_name(ref self: ContractState, user: ContractAddress, name: felt252) {
            let total_names = self.total_names.read();

            self.names.entry(user).write(name);

            self.total_names.write(total_names + 1);
        }
    }

    // Free function (Private/Internal)
    fn get_total_names_storage_address(self: @ContractState) -> felt252 {
        self.total_names.__base_address__
    }
}
```

---

Sources:

- https://www.starknet.io/cairo-book/ch101-03-contract-events.html
- https://www.starknet.io/cairo-book/ch102-01-contract-class-abi.html
- https://www.starknet.io/cairo-book/appendix-02-operators-and-symbols.html
- https://www.starknet.io/cairo-book/ch101-01-starknet-types.html
- https://www.starknet.io/cairo-book/ch101-02-contract-functions.html

---

# Advanced Contract Elements (Events, ABI, and System Interaction)

### Contract Events

Events inform the outside world of changes during execution and are stored in transaction receipts.

#### Defining Events
Events are defined in an enum annotated with `#[event]`, which must be named `Event`. Each variant represents an event, and its data structure must derive `starknet::Event`.

```rust
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
    // ... struct/enum definitions for BookAdded, FieldUpdated, etc.

    #[abi(embed_v0)]
    impl EventExampleImpl of super::IEventExample<ContractState> {
        fn add_book(ref self: ContractState, id: u32, title: felt252, author: felt252) {
            // ... logic to add a book in the contract storage ...
            self.emit(BookAdded { id, title, author });
        }
        // ... other functions
    }
}
```

#### Event Data Fields and Keys
Each event data field can be annotated with `#[key]`. Key fields are stored separately for efficient filtering by external tools. The variant name is used internally as the first event key.

#### Flattening Nested Events with `#[flat]`
The `#[flat]` attribute can be used on an enum variant to flatten serialization. If `FieldUpdated` is annotated with `#[flat]`, emitting `FieldUpdated::Title(...)` results in the event name being `Title` instead of `FieldUpdated`.

```rust
// Example of #[flat] usage
#[derive(Drop, starknet::Event)]
pub enum FieldUpdated {
    Title: UpdatedTitleData,
    Author: UpdatedAuthorData,
}
```

#### Emitting Events
Events are emitted by calling `self.emit()` with an event data structure.

```rust
self.emit(BookAdded { id, title, author });
```

#### Contract Attributes Related to Events
| Attribute | Defines |
| :--- | :--- |
| `#[event]` | Defines an event in a smart contract |
| `#[key]` | Defines an indexed `Event` enum field |
| `#[flat]` | Defines an enum variant of the `Event` enum that is not nested, ignoring the variant name in serialization |

### Contract ABI and Entrypoints

The Contract Class ABI is the high-level specification describing callable functions, parameters, and return values, used for external interaction (via JSON representation) or contract-to-contract calls (via dispatcher pattern).

#### Entrypoints
Entrypoints are functions callable from outside the contract class:
1.  **Public functions**: Most common, exposed as `view` or `external`.
2.  **Constructor**: Called only once during deployment.
3.  **L1-Handlers**: Triggered by the sequencer after receiving a message from L1.

#### Function Selector
Entrypoints are identified by a *selector*, computed as `sn_keccak(function_name)`.

#### Encoding
All data must be serialized into `felt252` before execution at the CASM level, as specified by the ABI.

#### ABI Definition Attributes
| Attribute | Explanation |
| :--- | :--- |
| `#[abi(embed_v0)]` | Defines an implementation of a trait, exposing its functions as contract entrypoints. |
| `#[abi(per_item)]` | Allows individual definition of the entrypoint type of functions inside an impl. |
| `#[external(v0)]` | Defines an external function when `#[abi(per_item)]` is used. |
| `#[generate_trait]` | Generates a trait definition for the implementation block, often used for private impls or with `#[abi(per_item)]`. |

When using `#[abi(per_item)]`, public functions must be annotated with `#[external(v0)]` to be exposed; otherwise, they are considered private.

```rust
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

### System Interaction and Context Access

#### Class Hashes
Class hashes have the same value range as addresses `[0, 2^251)`. They uniquely identify a specific version of contract code and are used in deployment, proxy patterns, and upgrades.

#### Working with Block and Transaction Information
Starknet provides functions to access the current execution context:

```rust
#[starknet::interface]
pub trait IBlockInfo<TContractState> {
    fn get_block_info(self: @TContractState) -> (u64, u64);
    fn get_tx_info(self: @TContractState) -> (ContractAddress, felt252);
}

#[starknet::contract]
mod BlockInfoExample {
    use starknet::{get_block_info, get_tx_info};
    use super::ContractAddress;

    #[storage]
    struct Storage {}

    #[abi(embed_v0)]
    impl BlockInfoImpl of super::IBlockInfo<ContractState> {
        fn get_block_info(self: @ContractState) -> (u64, u64) {
            let block_info = get_block_info();
            (block_info.block_number, block_info.block_timestamp)
        }

        fn get_tx_info(self: @ContractState) -> (ContractAddress, felt252) {
            let tx_info = get_tx_info();

            // Access transaction details
            let sender = tx_info.account_contract_address;
            let tx_hash = tx_info.transaction_hash;

            (sender, tx_hash)
        }
    }
}
```
`get_block_info()` returns `BlockInfo` (block number, timestamp), and `get_tx_info()` returns `TxInfo` (sender address, transaction hash, fee details).

---

Sources:

- https://www.starknet.io/cairo-book/ch101-01-00-contract-storage.html
- https://www.starknet.io/cairo-book/ch101-01-02-storage-vecs.html
- https://www.starknet.io/cairo-book/ch101-01-01-storage-mappings.html
- https://www.starknet.io/cairo-book/ch103-01-optimizing-storage-costs.html
- https://www.starknet.io/cairo-book/ch03-02-dictionaries.html
- https://www.starknet.io/cairo-book/ch100-00-introduction-to-smart-contracts.html
- https://www.starknet.io/cairo-book/appendix-03-derivable-traits.html
- https://www.starknet.io/cairo-book/ch101-02-contract-functions.html
- https://www.starknet.io/cairo-book/ch101-03-contract-events.html

---

---

Sources:

- https://www.starknet.io/cairo-book/ch101-01-00-contract-storage.html
- https://www.starknet.io/cairo-book/ch100-00-introduction-to-smart-contracts.html
- https://www.starknet.io/cairo-book/ch101-02-contract-functions.html

---

## Defining and Interacting with Contract Storage

Contract storage is a persistent space on the blockchain, structured as a map with $2^{251}$ slots, where each slot is a `felt252` initialized to 0. Each slot is identified by a storage address, which is a `felt252` computed from the variable's name and type parameters.

### Declaring Storage Variables

Storage variables must be declared within a special struct named `Storage`, which requires the `#[storage]` attribute. This attribute instructs the compiler to generate the necessary code for state interaction. This struct can hold types implementing the `Store` trait, including structs, enums, Mappings, and Vectors.

```rust
#[storage]
struct Storage {
    owner: Person,
    expiration: Expiration,
}
```

### Accessing and Modifying State

Interaction with contract storage is primarily done through high-level storage variables using two methods:

1.  **`read()`**: Returns the value of a storage variable. It takes no arguments and is called on the variable itself.
    ```rust
    self.stored_data.read()
    ```
2.  **`write(value)`**: Writes a new value to the storage slot. For simple variables, it takes one argument (the value). For mappings, it may take more arguments (key and value).
    ```rust
    self.stored_data.write(x);
    ```

When accessing fields within a storage struct (e.g., `self.owner.name.read()`), the compiler transparently translates these accesses into underlying `StoragePointer` manipulations.

### Interacting via Contract Interface Implementation

When implementing a contract interface defined by a trait, the public functions must be defined in an implementation block. This block must use the `#[abi(embed_v0)]` attribute to expose its functions externally; otherwise, they will not be callable.

The `self` parameter in the trait methods **must** be of type `ContractState`, which is generated by the compiler and grants access to storage variables and allows event emission.

*   If `self` is passed by reference (`ref self: ContractState`), state modification is allowed.
*   If `self` is passed as a snapshot (`self: @ContractState`), only read access is permitted, and attempts to modify state will result in a compilation error.

For example, in the implementation of `ISimpleStorage`:

```rust
#[abi(embed_v0)]
impl SimpleCounterImpl of super::ISimpleStorage<ContractState> {
    fn get_owner(self: @ContractState) -> Person {
        self.owner.read()
    }

    fn change_expiration(ref self: ContractState, expiration: Expiration) {
        if get_caller_address() != self.owner.address.read() {
            panic!("Only the owner can change the expiration");
        }
        self.expiration.write(expiration);
    }
}
```

### View Functions

View functions are public functions where `self: ContractState` is passed as a snapshot (`@ContractState`). This configuration restricts state modification through `self` and marks the function's `state_mutability` as `view`.

---

Sources:

- https://www.starknet.io/cairo-book/ch101-01-00-contract-storage.html
- https://www.starknet.io/cairo-book/appendix-03-derivable-traits.html
- https://www.starknet.io/cairo-book/ch103-01-optimizing-storage-costs.html

---

## Storing Custom Types with the `Store` Trait

The `Store` trait, defined in the `starknet::storage_access` module, specifies how a type should be stored in storage. For a type to be stored in storage, it **must** implement the `Store` trait.

Most core library types implement `Store`. However, custom structs or enums require explicit implementation. This can be achieved by adding `#[derive(starknet::Store)]` on top of the definition, provided all members/variants also implement `Store`.

### Structs Storage Layout

On Starknet, structs are stored in storage as a sequence of primitive types, stored contiguously in the order they are defined. The first element is stored at the struct's base address (accessible via `var.__base_address__`).

For example, for a `Person` struct with `name` and `address`:

| Fields | Address |
| --- | --- |
| name | `owner.__base_address__` |
| address | `owner.__base_address__ + 1` |

### Enums Storage Layout

When storing an enum variant, you store the variant's index (starting at 0) and any associated values. The index is stored at the base address, and associated values follow contiguously.

For an enum `Expiration` with `Finite: u64` (index 0) and `Infinite` (index 1):

If `Finite` is stored:

| Element | Address |
| --- | --- |
| Variant index (0 for Finite) | `expiration.__base_address__` |
| Associated limit date | `expiration.__base_address__ + 1` |

If `Infinite` is stored:

| Element | Address |
| --- | --- |
| Variant index (1 for Infinite) | `expiration.__base_address__` |

Enums used in contract storage **must** define a default variant (using `#[default]`), which is returned when reading an uninitialized storage slot, preventing runtime errors.

Both `Drop` and `Serde` derivations are required for properly serializing arguments passed to entrypoints and deserializing their outputs.

### Accessing Members of Stored Custom Types

When working with compound types stored in storage, you can call `read` and `write` on specific members instead of the struct variable itself, minimizing storage operations. For instance, for a stored struct `owner`, you can access its member `name` via `self.owner.name.read()`.

### Starknet Storage with `starknet::Store`

The `starknet::Store` trait is relevant when building on Starknet. It automatically implements the necessary read and write functions for a type to be used in smart contract storage.

### Storage Nodes

A storage node is a special kind of struct that can contain storage-specific types like `Map` or `Vec`. They can only exist within contract storage and are defined with the `#[starknet::storage_node]` attribute. They help logically group related data and allow for sophisticated storage layouts.

When accessing a storage node, you cannot `read` or `write` it directly; you must access its individual members.

Example of defining and using a storage node:

```
#[starknet::contract]
mod VotingSystem {
    use starknet::storage::{
        Map, StoragePathEntry, StoragePointerReadAccess, StoragePointerWriteAccess,
    };
    use starknet::{ContractAddress, get_caller_address};

    #[storage]
    struct Storage {
        proposals: Map<u32, ProposalNode>,
        proposal_count: u32,
    }

    #[starknet::storage_node]
    struct ProposalNode {
        title: felt252,
        description: felt252,
        yes_votes: u32,
        no_votes: u32,
        voters: Map<ContractAddress, bool>,
    }

    #[external(v0)]
    fn create_proposal(ref self: ContractState, title: felt252, description: felt252) -> u32 {
        let mut proposal_count = self.proposal_count.read();
        let new_proposal_id = proposal_count + 1;

        let mut proposal = self.proposals.entry(new_proposal_id);
        proposal.title.write(title);
        proposal.description.write(description);
        proposal.yes_votes.write(0);
        proposal.no_votes.write(0);

        self.proposal_count.write(new_proposal_id);

        new_proposal_id
    }

    #[external(v0)]
    fn vote(ref self: ContractState, proposal_id: u32, vote: bool) {
        let mut proposal = self.proposals.entry(proposal_id);
        let caller = get_caller_address();
        let has_voted = proposal.voters.entry(caller).read();
        if has_voted {
            return;
        }
        proposal.voters.entry(caller).write(true);
    }
}
```

---

Sources:

- https://www.starknet.io/cairo-book/ch101-01-00-contract-storage.html

---

### Storage Layout and Address Computation

The calculation mechanism for storage addresses is modeled using `StoragePointers` and `StoragePaths`.

#### Modeling of the Contract Storage in the Core Library

Storage variables in Cairo are not stored contiguously. To manage retrieval, the core library models the contract storage using a system of `StoragePointers` and `StoragePaths`.

Each storage variable can be converted into a `StoragePointer`. This pointer comprises two primary fields:
*   The base address of the storage variable in the contract's storage.
*   The offset, relative to the base address, of the specific storage slot being pointed to.

#### Example of Storage Access

The following example demonstrates a contract structure and how storage addresses can be accessed programmatically:

```rust
#[starknet::interface]
pub trait ISimpleStorage<TContractState> {
    fn get_owner(self: @TContractState) -> SimpleStorage::Person;
    fn get_owner_name(self: @TContractState) -> felt252;
    fn get_expiration(self: @TContractState) -> SimpleStorage::Expiration;
    fn change_expiration(ref self: TContractState, expiration: SimpleStorage::Expiration);
}

#[starknet::contract]
mod SimpleStorage {
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use starknet::{ContractAddress, get_caller_address};

    #[storage]
    struct Storage {
        owner: Person,
        expiration: Expiration,
    }

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

    #[constructor]
    fn constructor(ref self: ContractState, owner: Person) {
        self.owner.write(owner);
    }

    #[abi(embed_v0)]
    impl SimpleCounterImpl of super::ISimpleStorage<ContractState> {
        fn get_owner(self: @ContractState) -> Person {
            self.owner.read()
        }

        fn get_owner_name(self: @ContractState) -> felt252 {
            self.owner.name.read()
        }

        fn get_expiration(self: @ContractState) -> Expiration {
            self.expiration.read()
        }

        fn change_expiration(ref self: ContractState, expiration: Expiration) {
            if get_caller_address() != self.owner.address.read() {
                panic!("Only the owner can change the expiration");
            }
            self.expiration.write(expiration);
        }
    }

    fn get_owner_storage_address(self: @ContractState) -> felt252 {
        self.owner.__base_address__
    }

    fn get_owner_name_storage_address(self: @ContractState) -> felt252 {
        self.owner.name.__storage_pointer_address__.into()
    }

}

#[cfg(test)]
mod tests;
```

---

Sources:

- https://www.starknet.io/cairo-book/ch101-01-01-storage-mappings.html
- https://www.starknet.io/cairo-book/ch101-01-00-contract-storage.html
- https://www.starknet.io/cairo-book/ch03-02-dictionaries.html

---

### Persistent Key-Value Storage: Mappings

#### Storage Mappings Fundamentals

Storage mappings provide a way to associate keys with values persistently in contract storage. They do not store the key data itself; instead, they use the hash of the key to compute the storage slot address for the corresponding value. Consequently, it is impossible to iterate over the keys of a storage mapping.

Mappings have no concept of length, and all values default to the zero value for their type (e.g., `0` for `u64`). The only way to remove an entry is to set its value to this default.

The `Map` type from `core::starknet::storage` must be used for persistent storage. The `Felt252Dict` type is a **memory** type and cannot be stored directly in contract storage. To manipulate `Map` contents in memory, elements must be copied to/from a `Felt252Dict` or similar structure. `Map` can only be used as a storage variable within a contract's storage struct.

#### Declaring and Using Storage Mappings

Mappings are declared in the `#[storage]` struct:

```rust
#[storage]
struct Storage {
    user_values: Map<ContractAddress, u64>,
}
```

To read a value, retrieve the storage pointer using `entry(key)` and then call `read()`:

```rust
fn get(self: @TState, address: ContractAddress) -> u64 {
    self.user_values.entry(address).read()
}
```

To write a value, retrieve the storage pointer and call `write(value)`:

```rust
fn set(ref self: ContractState, amount: u64) {
    let caller = get_caller_address();
    self.user_values.entry(caller).write(amount);
}
```

Mappings can also be members of storage nodes, such as tracking voters in a proposal structure:

```rust
#[starknet::storage_node]
struct ProposalNode {
    // ... other fields
    voters: Map<ContractAddress, bool>,
}
```

#### Nested Mappings

Mappings can contain other mappings, allowing for complex key structures, such as mapping a user address to their warehouse inventory: `Map<ContractAddress, Map<u64, u64>>`.

Accessing nested mappings requires traversing the keys sequentially using chained `entry()` calls:

```rust
#[storage]
struct Storage {
    user_warehouse: Map<ContractAddress, Map<u64, u64>>,
}

// Writing to a nested map
fn set_quantity(ref self: ContractState, item_id: u64, quantity: u64) {
    let caller = get_caller_address();
    self.user_warehouse.entry(caller).entry(item_id).write(quantity);
}

// Reading from a nested map
fn get_item_quantity(self: @ContractState, address: ContractAddress, item_id: u64) -> u64 {
    self.user_warehouse.entry(address).entry(item_id).read()
}
```

#### Storage Address Computation

The storage address for a value associated with key(s) in a mapping is computed based on the mapping variable's name and the key(s):

*   **Single Key ($k$):** The address is calculated as $h(\text{sn\_keccak}(\text{variable\_name}), k)$, where $h$ is the Pedersen hash. The result is taken modulo $2^{251} - 256$.
*   **Multiple Keys ($k_1, k_2, \dots, k_n$):** The address is computed iteratively: $h(\dots h(h(\text{sn\_keccak}(\text{variable\_name}), k_1), k_2), \dots, k_n)$.
*   If a key is a struct, each element of the struct is treated as a sequential key, provided the struct implements the `Hash` trait.

The base address of the storage variable can be accessed via the `__base_address__` attribute.

---

Sources:

- https://www.starknet.io/cairo-book/ch101-01-02-storage-vecs.html

---

# Dynamic Collections: Storage Vectors

## Storing Collections with Vectors

The `Vec` type, provided by `starknet::storage`, allows storing collections of values in contract storage. It is a phantom type designed for storage and cannot be instantiated as a regular variable, used as a function parameter, or included in regular structs. To work with its contents, elements must be copied to and from a memory `Array<T>`.

To use `Vec` operations, import `Vec`, `VecTrait`, `MutableVecTrait`, `StoragePointerReadAccess`, and `StoragePointerWriteAccess` from `starknet::storage`.

### Declaring and Using Storage Vectors

Storage Vectors are declared using the `Vec` type with angle brackets specifying the element type, e.g., `addresses: Vec<ContractAddress>` within the `Storage` struct.

**Adding Elements:** Use the `push` method to add an element to the end.

```rust
// Example of adding an element
self.addresses.push(caller);
```

**Retrieving Elements:**
*   Use indexing (`vec[index]`) or `get(index)` to obtain a storage pointer to the element. Call `.read()` on the pointer to get the value.
*   `get(index)` returns `Option<ContractAddress>`, returning `None` if the index is out of bounds. Indexing/`at` panics if out of bounds.

```rust
// Example of getting the n-th element safely
self.addresses.get(index).map(|ptr| ptr.read())
```

**Retrieving All Elements:** Iterate over the indices of the storage `Vec`, read each element, and append it to a memory `Array<T>`.

**Modifying Elements:** Get a mutable pointer to the storage pointer at the desired index and use the `write` method.

```rust
// Example of modifying the element at index
self.addresses[index].write(new_address);
```

**Removing Elements:** The `pop` method removes and returns the last element as `Some(value)`, or `None` if empty, updating the stored length.

```rust
// Example of popping the last element
self.addresses.pop()
```

### Storage Address Computation for Vecs

The storage address for elements in a `Vec` is computed as follows:

1.  The length of the `Vec` is stored at the base address, calculated as `sn_keccak(variable_name)`.
2.  The elements are stored at addresses computed as `h(base_address, i)`, where `i` is the element's index and `h` is the Pedersen hash function.

### Summary of Storage Vec Operations

*   Use the `Vec<T>` type for collections in storage.
*   Use `push` to add, `pop` to remove the last element, and `get`/indexing to read elements.
*   Use `[index].write(value)` to modify an element in place.
*   Address calculation involves `sn_keccak` for the base length address and Pedersen hashing for element addresses.

---

Sources:

- https://www.starknet.io/cairo-book/ch103-01-optimizing-storage-costs.html
- https://www.starknet.io/cairo-book/ch03-02-dictionaries.html

---

### Advanced Storage Structures and Optimization

#### Felt252Dict<T> Implementation and Dictionary Squashing

Implementing `Felt252Dict<T>` involves scanning the entire entry list during read/write operations to find the last entry with the same key to extract its `previous_value`. This results in a worst-case time complexity of $O(n)$, where $n$ is the number of entries.

This structure is necessary because Cairo proofs require "dictionary squashing" to verify computational integrity within STARK proof boundaries. Squashing verifies coherence by checking that for all entries with a key $k$, the $i$-th entry's `new_value` equals the $(i+1)$-th entry's `previous_value`, based on insertion order.

Example entry list progression for squashing:

| key | previous | new |
| --- | --- | --- |
| Alex | 0 | 150 |
| Maria | 0 | 100 |
| Charles | 0 | 70 |
| Maria | 100 | 250 |
| Alex | 150 | 40 |
| Alex | 40 | 300 |
| Maria | 250 | 190 |
| Alex | 300 | 90 |

After squashing, the entry list would be reduced to:

#### Storage Optimization via Bit-Packing

Optimizing storage usage is critical in Cairo smart contracts because most transaction costs relate to storage updates, where each slot write incurs gas. Bit-packing minimizes data size by using the fewest bits possible for storage.

The storage in a Starknet smart contract consists of a map with $2^{251}$ slots, each being a `felt252` initialized to 0. Packing multiple values into fewer slots reduces user gas costs.

##### Bitwise Operations for Packing

Packing combines several integers into a single larger integer if the container size accommodates the sum of the required bits (e.g., two `u8` and one `u16` into one `u32`). This requires bitwise operators:

*   **Shifting:** Multiplying or dividing an integer by a power of 2 shifts the value left or right, respectively.
*   **Masking (AND):** Applying an `AND` operator isolates specific bits.
*   **Combining (OR):** Adding (using `OR`) two integers combines their values.

Example of combining two `u8` into a `u16` (packing) and reversing it (unpacking):

Packing and unpacking integer values

##### Implementing StorePacking Trait

Storage optimization can be achieved by implementing the `StorePacking` trait. The compiler uses the `StoreUsingPacking` implementation of the `Store` trait to automatically pack data before writing to storage and unpack it after reading.

In this implementation:
*   `TWO_POW_8` and `TWO_POW_40` are used for left shifting in `pack` and right shifting in `unpack`.
*   `MASK_8` and `MASK_32` are used to isolate variables during `unpack`.
*   Variables are converted to `u128` to enable bitwise operations.

This technique applies to any group of fields whose total bit size fits within the packed storage type (e.g., packing fields summing to 256 bits into a `u256`). A crucial requirement is that the type produced by `StorePacking::pack` must also implement the `Store` trait for `StoreUsingPacking` to function correctly.

---

Sources:

- https://www.starknet.io/cairo-book/ch101-03-contract-events.html

---

### State Reading and Event Logging Layout

#### Event Structure When Using `#[flat]`

When an `Event` enum variant (like `FieldUpdated`) is annotated with `#[flat]`, the inner variant name (e.g., `Author`) is used as the event name for logging, instead of the outer variant name.

The resulting log structure for such an event is defined as follows:

*   **First Key:** Calculated using `selector!("Author")`.
*   **Second Key:** The value of the field annotated with `#[key]` (e.g., the `id` field).
*   **Data Field:** The serialized data of the remaining fields. For the example provided: `0x5374657068656e204b696e67` (representing 'Stephen King').

---

Sources:

- https://www.starknet.io/cairo-book/ch102-02-interacting-with-another-contract.html
- https://www.starknet.io/cairo-book/ch103-04-L1-L2-messaging.html
- https://www.starknet.io/cairo-book/ch102-03-executing-code-from-another-class.html
- https://www.starknet.io/cairo-book/ch103-06-01-deploying-and-interacting-with-a-voting-contract.html
- https://www.starknet.io/cairo-book/ch101-01-starknet-types.html
- https://www.starknet.io/cairo-book/ch101-03-contract-events.html
- https://www.starknet.io/cairo-book/ch102-00-starknet-contract-interactions.html
- https://www.starknet.io/cairo-book/ch102-04-serialization-of-cairo-types.html

---

---

Sources:

- https://www.starknet.io/cairo-book/ch101-01-starknet-types.html
- https://www.starknet.io/cairo-book/ch102-04-serialization-of-cairo-types.html

---

# Address Types and Data Serialization

## Contract and Storage Addresses

Contract addresses in Starknet have a value range of $[0, 2^{251})$, enforced by the type system. A `ContractAddress` can be created from a `felt252` using the `TryInto` trait.

### Storage Address

The `StorageAddress` type denotes the location of a value within a contract's storage. While usually handled internally by storage structures like Map and Vec, it's important for advanced patterns. Storage addresses share the same value range as contract addresses, $[0, 2^{251})$. The related `StorageBaseAddress` has a slightly smaller range of $[0, 2^{251} - 256)$ to accommodate offsets.

```rust
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

## Ethereum Addresses

The `EthAddress` type represents a 20-byte Ethereum address, primarily used for building cross-chain applications, L1-L2 messaging, and token bridges.

```rust
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
        assert!(from_address == self.l1_contract.read().into(), "Invalid L1 sender");
        // Process the message...
    }
}
```

## Data Serialization Overview

The field element (`felt252`), containing 252 bits, is the sole type in the Cairo VM. Data types that fit within 252 bits are represented by a single `felt`. Types larger than 252 bits are represented by a list of felts. Developers interacting with contracts must serialize arguments larger than 252 bits correctly for calldata formulation. Using Starknet SDKs or `sncast` is highly recommended to simplify this process.

### Data types using at most 252 bits

The following Cairo data types fit within 252 bits and are represented by a single felt:

*   `ContractAddress`
*   `EthAddress`
*   `StorageAddress`
*   `ClassHash`
*   Unsigned integers: `u8`, `u16`, `u32`, `u64`, `u128`, and `usize`
*   `bytes31`
*   `felt252`
*   Signed integers: `i8`, `i16`, `i32`, `i64`, and `i128`

Note that a negative value, $(-x)$, is serialized as $(P-x)$, where $P = 2^{251} + 17 \cdot 2^{192} + 1$.

---

Sources:

- https://www.starknet.io/cairo-book/ch103-06-01-deploying-and-interacting-with-a-voting-contract.html
- https://www.starknet.io/cairo-book/ch102-00-starknet-contract-interactions.html

---

### Fundamentals of Contract Interaction

#### Necessity and Scope of Contract Interaction
A smart contract requires an external trigger from an entity (user or another contract) to execute. The ability for contracts to interact facilitates the creation of complex applications where individual contracts handle specific functionalities. Key aspects of interaction include understanding the Application Binary Interface (ABI), how to call contracts, enabling inter-contract communication, and proper usage of classes as libraries.

#### Deploying and Interacting via `katana`
Interaction with Starknet contracts begins after deployment. For local development and testing, the `katana` local Starknet node is recommended over using testnets like Goerli.

To start the local node:
```bash
katana
```
This command starts the node with predeployed accounts, which are listed in the output, providing necessary addresses and private keys for testing interactions:
```
...
PREFUNDED ACCOUNTS
==================

| Account address |  0x03ee9e18edc71a6df30ac3aca2e0b02a198fbce19b7480a63a0d71cbd76652e0
| Private key     |  0x0300001800000000300000180000000000030000000000003006001800006600
| Public key      |  0x01b7b37a580d91bc3ad4f9933ed61f3a395e0e51c9dd5553323b8ca3942bb44e

| Account address |  0x033c627a3e5213790e246a917770ce23d7e562baa5b4d2917c23b1be6d91961c
| Private key     |  0x0333803103001800039980190300d206608b0070db0012135bd1fb5f6282170b
| Public key      |  0x04486e2308ef3513531042acb8ead377b887af16bd4cdd8149812dfef1ba924d

| Account address |  0x01d98d835e43b032254ffbef0f150c5606fa9c5c9310b1fae370ab956a7919f5
| Private key     |  0x07ca856005bee0329def368d34a6711b2d95b09ef9740ebf2c7c7e3b16c1ca9c
| Public key      |  0x07006c42b1cfc8bd45710646a0bb3534b182e83c313c7bc88ecf33b53ba4bcbc
...
```

#### Differentiating Call and Invoke Operations
Interacting with external functions is categorized based on state modification:
*   **Calling Contracts:** Used for external functions that only read from the state. These operations do not alter the network state, thus requiring no fees or signing.
*   **Invoking Contracts:** Used for external functions that write to the state. These operations alter the network state and mandate fees and signing.

#### Reading State with `starkli call`
Read functions are executed using the `starkli call` command. The general structure is: `starkli call [contract_address] [function] [input] --rpc [url]`.

The function `voter_can_vote` checks eligibility. If the input address corresponds to a registered voter who hasn't voted, the result is 1 (true):
```bash
starkli call 0x05ea3a690be71c7fcd83945517f82e8861a97d42fca8ec9a2c46831d11f33349 voter_can_vote 0x03ee9e18edc71a6df30ac3aca2e0b02a198fbce19b7480a63a0d71cbd76652e0 --rpc http://0.0.0.0:5050
```
Checking an unregistered account with `is_voter_registered` yields 0 (false):
```bash
starkli call 0x05ea3a690be71c7fcd83945517f82e8861a97d42fca8ec9a2c46831d11f33349 is_voter_registered 0x44444444444444444 --rpc http://0.0.0.0:5050
```
Functions that modify state, such as casting a vote via the `vote` function, necessitate the use of the `starknet invoke` command.

---

Sources:

- https://www.starknet.io/cairo-book/ch102-02-interacting-with-another-contract.html

---

# High-Level Dispatchers and Type-Safe Calling

The dispatcher pattern enables calling functions on another contract by utilizing a struct that wraps the contract address and implements the dispatcher trait generated by the compiler from the contract class ABI. This provides a type-safe method for contract interaction, abstracting the low-level `contract_call_syscall`.

### Types of Generated Dispatchers

When a contract interface is defined, the compiler automatically generates several dispatchers. Using `IERC20` as an example:

*   **Contract Dispatchers** (e.g., `IERC20Dispatcher`): Wrap a contract address and are used to call functions on other contracts.
*   **Library Dispatchers** (e.g., `IERC20LibraryDispatcher`): Wrap a class hash and are used to call functions on classes.
*   **'Safe' Dispatchers** (e.g., `IERC20SafeDispatcher`): Allow the caller to handle potential execution errors.

### The Dispatcher Pattern Implementation Details

The contract dispatcher struct wraps the contract address and implements the generated trait. For each function, the implementation involves: serializing arguments into `__calldata__`, executing `contract_call_syscall` with the address, selector, and calldata, and deserializing the return value.

The following listing shows the generated items for an `IERC20` interface:

```rust
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

### Calling Contracts Using the Contract Dispatcher

A wrapper contract can use the imported dispatcher struct to interact with another contract by wrapping the target contract's address.

The following example shows a `TokenWrapper` contract calling `name` and `transfer_from` on an ERC20 contract:

```rust
use starknet::ContractAddress;

#[starknet::interface]
trait IERC20<TContractState> {
    fn name(self: @TContractState) -> felt252;

    fn symbol(self: @TContractState) -> felt252;

    fn decimals(self: @TContractState) -> u8;

    fn total_supply(self: @TContractState) -> u256;

    fn balance_of(self: @TContractState, account: ContractAddress) -> u256;

    fn allowance(self: @TContractState, owner: ContractAddress, spender: ContractAddress) -> u256;

    fn transfer(ref self: TContractState, recipient: ContractAddress, amount: u256) -> bool;

    fn transfer_from(
        ref self: TContractState, sender: ContractAddress, recipient: ContractAddress, amount: u256,
    ) -> bool;

    fn approve(ref self: TContractState, spender: ContractAddress, amount: u256) -> bool;
}

#[starknet::interface]
trait ITokenWrapper<TContractState> {
    fn token_name(self: @TContractState, contract_address: ContractAddress) -> felt252;

    fn transfer_token(
        ref self: TContractState,
        address: ContractAddress,
        recipient: ContractAddress,
        amount: u256,
    ) -> bool;
}

//**** Specify interface here ****//
#[starknet::contract]
mod TokenWrapper {
    use starknet::{ContractAddress, get_caller_address};
    use super::ITokenWrapper;
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

#[cfg(test)]
mod tests;
```

### Handling Errors with Safe Dispatchers

Safe dispatchers (e.g., `IERC20SafeDispatcher`) return a `Result::Err` containing the panic reason if the called function fails, allowing for graceful error handling.

For a hypothetical `IFailableContract`:

```rust
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

---

Sources:

- https://www.starknet.io/cairo-book/ch102-02-interacting-with-another-contract.html

---

### Low-Level Contract Invocation via Syscalls

While safe dispatchers return a `Result<u32, Array<felt252>>` allowing for error handling (as detailed in Chapter 9: Error Handling), some scenarios still cause an immediate transaction revert, meaning the error cannot be caught by the caller using a safe dispatcher.

#### Scenarios Leading to Immediate Revert

The following cases are expected to be handled in future Starknet versions:

*   Failure in a Cairo Zero contract call.
*   Library call with a non-existent class hash.
*   Contract call to a non-existent contract address.
*   Failure within the `deploy` syscall (e.g., panic in the constructor, deploying to an existing address).
*   Using the `deploy` syscall with a non-existent class hash.
*   Using the `replace_class` syscall with a non-existent class hash.

#### Using `call_contract_syscall`

Another method for contract invocation is directly using the `call_contract_syscall`. This syscall provides greater control over serialization and deserialization compared to the dispatcher pattern.

To use this syscall, one must pass the contract address, the selector of the target function, and the call arguments serialized into a `Span<felt252>`. Serialization of arguments is achieved using the `Serde` trait, provided the types implement it. The call returns an array of serialized values, which must be deserialized by the caller.

Listing 16-4 demonstrates calling the `transfer_from` function of an `ERC20` contract:

```rust
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

Listing 16-4: A sample contract using `call_contract_sycall` syscall

---

Sources:

- https://www.starknet.io/cairo-book/ch102-03-executing-code-from-another-class.html

---

### Library Calls and Context Execution

Library calls allow a contract to execute the logic of another class within its own execution context, which means state updates affect the caller's storage, unlike contract calls.

#### Key Differences Between Contract Calls and Library Calls

| Feature | Contract Call (to deployed **contract**) | Library Call (to **class**)
| :--- | :--- |
| Execution Context | That of the called contract (B) | That of the caller (A)
| `get_caller_address()` in called logic | Address of A | Address of A's caller
| `get_contract_address()` in called logic | Address of B | Address of A
| Storage Updates | Update storage of B | Update storage of A

Library calls are performed using a class hash instead of a contract address when using the dispatcher pattern.

#### Library Dispatcher Implementation

The library dispatcher uses `starknet::syscalls::library_call_syscall` instead of `starknet::syscalls::call_contract_syscall`.

```
use starknet::ContractAddress;

trait IERC20DispatcherTrait<T> {
    fn name(self: T) -> felt252;
    fn transfer(self: T, recipient: ContractAddress, amount: u256);
}

#[derive(Copy, Drop, starknet::Store, Serde)]
struct IERC20LibraryDispatcher {
    class_hash: starknet::ClassHash,
}

impl IERC20LibraryDispatcherImpl of IERC20DispatcherTrait<IERC20LibraryDispatcher> {
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

#### Using the Library Dispatcher

To use library calls via the dispatcher, an instance of the library dispatcher (`IValueStoreLibraryDispatcher` in the example) is created, passing the `class_hash` of the target class. Functions called on this dispatcher execute in the caller's context.

In the example using `ValueStoreExecutor` calling `ValueStoreLogic`:

*   Calling `set_value` updates `ValueStoreExecutor`'s storage variable `value`.
*   Calling `get_value` reads `ValueStoreExecutor`'s storage variable `value`.

```
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

#### Calling Classes using Low-Level Calls

Directly using `library_call_syscall` offers more control over serialization and error handling.

Arguments must be serialized to a `Span<felt252>` (using `Serde` trait) and passed along with the class hash and function selector.

```
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
The call returns serialized values that must be deserialized manually.

---

Sources:

- https://www.starknet.io/cairo-book/ch103-04-L1-L2-messaging.html

---

### Starknet L1-L2 Messaging System

Starknet utilizes an **L1-L2 messaging system** to enable interaction between smart contracts on Layer 1 (L1) and Layer 2 (L2), facilitating cross-chain transactions like token bridging.

#### Overview and Properties

The messaging system is characterized by two key properties:

*   **Asynchronous**: Contract code (Solidity or Cairo) cannot await the result of a message sent on the other chain during its execution.
*   **Asymmetric**:
    *   `L1->L2`: Messages are automatically delivered to the target L2 contract by the Starknet sequencer.
    *   `L2->L1`: Only the hash of the message is sent to L1 by the sequencer; consumption must be done manually via a transaction on L1.

#### The StarknetMessaging Contract

The core component is the `StarknetMessaging` contract, part of the `StarknetCore` Solidity contracts deployed on Ethereum. It manages sending messages to L2, receiving messages from L2, and message cancellation.

The interface (`IStarknetMessaging`) includes:

```solidity
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

For `L1->L2` messages, the sequencer listens to logs emitted by `StarknetMessaging` and executes an `L1HandlerTransaction` to call the target L2 function.

#### Sending Messages from Ethereum to Starknet (L1 -> L2)

To send a message from L1, Solidity contracts must call `sendMessageToL2` on the `StarknetMessaging` contract.

1.  **Execution**: The call requires a value (`msg.value`) of at least 20,000 wei to register the message hash in Ethereum storage. Additionally, fees must be paid on L1 for the subsequent `L1HandlerTransaction` executed by the sequencer on L2.
2.  **Target Function**: The receiving function on Starknet must be annotated with `#[l1_handler]`. It is crucial to verify the `from_address` within the handler to ensure messages originate from a trusted L1 contract.

Example of sending a message with a single felt value from Solidity:

```solidity
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

Example of the corresponding Cairo handler function:

```rust
    #[l1_handler]
    fn msg_handler_felt(ref self: ContractState, from_address: felt252, my_felt: felt252) {
        assert!(from_address == self.allowed_message_sender.read(), "Invalid message sender");

        // You can now use the data, automatically deserialized from the message payload.
        assert!(my_felt == 123, "Invalid value");
    }
```

#### Sending Messages from Starknet to Ethereum (L2 -> L1)

Messages are initiated on Starknet using the `syscalls::send_message_to_l1_syscall` in Cairo contracts. The L1 contract must then manually consume this message by calling `consumeMessageFromL2` on the `StarknetMessaging` contract after the L2 block is verified on L1 (approx. 3-4 hours).

Cairo example using the syscall:

```rust
        fn send_message_felt(ref self: ContractState, to_address: EthAddress, my_felt: felt252) {
            // Note here, we "serialize" my_felt, as the payload must be
            // a `Span<felt252>`.
            syscalls::send_message_to_l1_syscall(to_address.into(), array![my_felt].span())
                .unwrap();
        }
```

Solidity example for consumption:

```solidity
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
The `consumeMessageFromL2` call validates the inputs (L2 contract address and payload) against the recorded message hash.

#### Cairo Serialization Considerations (Serde)

Data sent between L1 and L2 must be serialized as an array of `felt252`. Since `felt252` is smaller than Solidity's `uint256`, values exceeding the maximum `felt252` limit will cause the message to get stuck.

A Cairo `u256` struct (composed of `low: u128` and `high: u128`) serializes into **two** felts:

```rust
struct u256 {
    low: u128,
    high: u128,
}
```

To send a single `u256` value (e.g., value 1) from L1, the payload must contain two `uint256` elements in Solidity:

```solidity
uint256[] memory payload = new uint256[](2);
// Let's send the value 1 as a u256 in cairo: low = 1, high = 0.
payload[0] = 1;
payload[1] = 0;
```

---

Sources:

- https://www.starknet.io/cairo-book/ch103-06-01-deploying-and-interacting-with-a-voting-contract.html

---

### Practical Deployment and CLI Interaction

The class hash for the contract is: `0x06974677a079b7edfadcd70aa4d12aac0263a4cda379009fca125e0ab1a9ba52`. This hash can be used for declaration on Sepolia testnet.

#### Deployment using starkli

The `starkli deploy` command requires specifying the RPC endpoint via `--rpc` (e.g., `http://0.0.0.0:5050` for Katana) and the signing account via `--account` (e.g., `katana-0`). When using a local node like Katana, transactions finalize immediately.

The command deploys the contract and registers initial voters using constructor arguments:

```bash
starkli deploy <class_hash_of_the_contract_to_be_deployed> <voter_0_address> <voter_1_address> <voter_2_address> --rpc http://0.0.0.0:5050 --account katana-0
```

An example deployment command:

```bash
starkli deploy 0x06974677a079b7edfadcd70aa4d12aac0263a4cda379009fca125e0ab1a9ba52 0x03ee9e18edc71a6df30ac3aca2e0b02a198fbce19b7480a63a0d71cbd76652e0 0x033c627a3e5213790e246a917770ce23d7e562baa5b4d2917c23b1be6d91961c 0x01d98d835e43b032254ffbef0f150c5606fa9c5c9310b1fae370ab956a7919f5 --rpc http://0.0.0.0:5050 --account katana-0
```

The deployed contract address will be specific to your deployment, for example: `0x05ea3a690be71c7fcd83945517f82e8861a97d42fca8ec9a2c46831d11f33349`.

#### Reading Voter Eligibility

The contract includes external read functions to check eligibility without altering state: `voter_can_vote` and `is_voter_registered`.

#### Invoking Contract Functions (Voting)

The `invoke` command is used for state-changing operations, such as voting. Voting requires signing the transaction and incurs a fee. The input for the `vote` function is `1` (Yes) or `0` (No).

Voting Yes:
```bash
starkli invoke 0x05ea3a690be71c7fcd83945517f82e8861a97d42fca8ec9a2c46831d11f33349 vote 1 --rpc http://0.0.0.0:5050 --account katana-0
```

Voting No:
```bash
starkli invoke 0x05ea3a690be71c7fcd83945517f82e8861a97d42fca8ec9a2c46831d11f33349 vote 0 --rpc http://0.0.0.0:5050 --account katana-0
```

After submission, you receive a transaction hash, which can be queried for details:

```bash
starkli transaction <TRANSACTION_HASH> --rpc http://0.0.0.0:5050
```

The output provides details like transaction hash, max fee, and signature.

#### Error Handling

Attempting to vote twice with the same signer results in a generic error:
```
Error: code=ContractError, message="Contract error"
```
More detailed error reasons, such as `"USER_ALREADY_VOTED"`, can be found by inspecting the output logs of the running `katana` node.

---

Sources:

- https://www.starknet.io/cairo-book/ch101-03-contract-events.html

---

### Transaction Receipts and Event Handling

To understand what happens internally, transaction receipts show emitted events.

#### Example 1: Add a book

When invoking `add_book` (e.g., id=42, title='Misery', author='S. King'), the transaction receipt's "events" section contains serialized event data.

The structure observed in the receipt is:
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

Interpretation of the receipt fields for this event:
*   `from_address`: The smart contract's address.
*   `keys`: Contains serialized `felt252` key fields.
    *   The first key is the event selector, `selector!("BookAdded")`.
    *   The second key, `0x532e204b696e67` ('S. King'), corresponds to the `author` field defined with `#[key]`.
*   `data`: Contains serialized `felt252` data fields.
    *   `0x2a` (42) is the `id` data field.
    *   `0x4d6973657279` ('Misery') is the `title` data field.

#### Example 2: Update a book author

Invoking `change_book_author` (id=42, new\_author='Stephen King') emits a `FieldUpdated` event. The receipt structure reflects this:

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
This event structure corresponds to `FieldUpdated::Author(UpdatedAuthorData { id: 42, title: author: 'Stephen King' })`. The key includes the selector and the book ID (0x2a), while the data contains the new author name serialized.

---

Sources:

- https://www.starknet.io/cairo-book/ch103-02-00-composability-and-components.html
- https://www.starknet.io/cairo-book/ch103-05-02-randomness.html
- https://www.starknet.io/cairo-book/ch103-06-02-working-with-erc20-token.html
- https://www.starknet.io/cairo-book/ch12-11-offloading-computations-with-oracles.html
- https://www.starknet.io/cairo-book/ch103-02-01-under-the-hood.html
- https://www.starknet.io/cairo-book/ch103-02-02-component-dependencies.html
- https://www.starknet.io/cairo-book/ch103-05-01-price-feeds.html
- https://www.starknet.io/cairo-book/ch103-02-03-testing-components.html
- https://www.starknet.io/cairo-book/ch103-03-upgradeability.html
- https://www.starknet.io/cairo-book/appendix-05-common-error-messages.html
- https://www.starknet.io/cairo-book/ch101-02-contract-functions.html
- https://www.starknet.io/cairo-book/ch103-04-L1-L2-messaging.html
- https://www.starknet.io/cairo-book/ch103-05-oracle-interactions.html
- https://www.starknet.io/cairo-book/ch104-01-general-recommendations.html

---

---

Sources:

- https://www.starknet.io/cairo-book/ch103-02-00-composability-and-components.html
- https://www.starknet.io/cairo-book/ch103-06-02-working-with-erc20-token.html

---

# Cairo Components: Fundamentals and Implementation

## Components: Lego-Like Building Blocks

Components are modular add-ons that encapsulate reusable logic, storage, and events, allowing them to be incorporated into multiple contracts. They extend functionality without reimplementing shared logic. Think of them as Lego blocks that enrich contracts.

Unlike a contract, a component cannot be deployed on its own; its logic becomes part of the contract's bytecode when embedded.

### What's in a Component?

A component is similar to a contract and can contain:

*   Storage variables
*   Events
*   External and internal functions

## Creating Components

To create a component, define it in a module decorated with `#[starknet::component]`. Within this module, declare a `Storage` struct and an `Event` enum.

### Defining the Interface and Implementation

1.  **Interface**: Define the component interface by declaring a trait with the `#[starknet::interface]` attribute, specifying signatures for external access.
2.  **External Logic**: Implement the external logic in an `impl` block marked as `#[embeddable_as(name)]`, usually implementing the interface trait. `name` is the reference used in the contract.
3.  **Internal Logic**: Define internal functions by omitting the `#[embeddable_as(name)]` attribute above the `impl` block. These functions are usable within the embedding contract but are not part of its ABI.

Functions in these `impl` blocks are generic over the contract state, using arguments like `ref self: ComponentState<TContractState>` (for state modification) or `self: @ComponentState<TContractState>` (for view functions).

### Example: Ownable Component Interface

```
#[starknet::interface]
trait IOwnable<TContractState> {
    fn owner(self: @TContractState) -> ContractAddress;
    fn transfer_ownership(ref self: TContractState, new_owner: ContractAddress);
    fn renounce_ownership(ref self: TContractState);
}
```

### Example: Ownable Component Implementation

```
#[starknet::component]
pub mod OwnableComponent {
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
    pub impl InternalImpl<
        TContractState, +HasComponent<TContractState>,
    > of InternalTrait<TContractState> {
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

> Note: Follow OpenZeppelin’s pattern: keep the `Impl` suffix in the embeddable name and contract impl alias (e.g., `OwnableImpl`), while the local component impl is named after the trait without the suffix (e.g., `impl Ownable<...>`).

## Migrating a Contract to a Component

Migration requires minimal changes:

*   Add `#[starknet::component]` attribute to the module.
*   Add `#[embeddable_as(name)]` attribute to the `impl` block to be embedded.
*   Add generic parameters to the `impl` block: `TContractState` and the restriction `+HasComponent<TContractState>`.
*   Change the `self` argument type in functions from `ContractState` to `ComponentState<TContractState>`.

For traits generated via `#[generate_trait]`, the trait is generic over `TContractState` instead of `ComponentState<TContractState>`.

## Using Components Inside a Contract

To integrate a component, you must:

1.  Declare it using the `component!()` macro, specifying:
    *   The path to the component (`path::to::component`).
    *   The name of the storage variable (`ownable`).
    *   The name of the event enum variant (`OwnableEvent`).
2.  Add the path to the component's storage and events to the contract's storage and event definitions.

### Example: Basic ERC20 Contract Using Components

```
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

---

Sources:

- https://www.starknet.io/cairo-book/ch103-02-00-composability-and-components.html
- https://www.starknet.io/cairo-book/ch103-02-01-under-the-hood.html
- https://www.starknet.io/cairo-book/ch103-02-02-component-dependencies.html
- https://www.starknet.io/cairo-book/ch103-06-02-working-with-erc20-token.html
- https://www.starknet.io/cairo-book/ch103-02-03-testing-components.html
- https://www.starknet.io/cairo-book/ch103-03-upgradeability.html
- https://www.starknet.io/cairo-book/appendix-05-common-error-messages.html
- https://www.starknet.io/cairo-book/ch101-02-contract-functions.html
- https://www.starknet.io/cairo-book/ch104-01-general-recommendations.html

---

## Plugin Diagnostics for Component Integration

Cairo compiler provides helpful diagnostics when integrating components:

*   `Plugin diagnostic: name is not a substorage member in the contract's Storage. Consider adding to Storage: (...)`: Indicates that the component's storage was forgotten in the contract's `Storage`. Solution: Add the component's storage path annotated with `#[substorage(v0)]`.
*   `Plugin diagnostic: name is not a nested event in the contract's Event enum. Consider adding to the Event enum:`: Suggests missing component events. Solution: Add the path to the component's events in the contract's `Event` enum.

## Component Impl Structure and State Access

Components use generic `impl` blocks marked with `#[embeddable_as(<Name>)]` to define logic that can be embedded.

### The `#[embeddable_as]` Attribute

This attribute marks an impl as embeddable and specifies the name that will be used in the contract to refer to this component's exposed logic. For example, `#[embeddable_as(OwnableImpl)]` results in the component being referred to as `OwnableImpl`.

### Genericity and State Access

The implementation is typically generic over `ComponentState<TContractState>`, restricted by traits like `+HasComponent<TContractState>`.

Access to storage and events within the component implementation is done via the generic `ComponentState<TContractState>` type, using syntax like `self.storage_var_name.read()` or `self.emit(...)`, instead of the contract's `ContractState`.

## Contract Integration Steps

Integrating a component involves several steps within the host contract:

1.  **Declare Component:** Use the `component!(path: ComponentName, storage: storage_name, event: event_name);` macro.
2.  **Define Storage:** Declare the component's storage in the contract's `Storage` struct, annotated with `#[substorage(v0)]`.
3.  **Define Events:** Include the component's events in the contract's `Event` enum.
4.  **Embed Logic:** Instantiate the component's generic impl with the concrete `ContractState` using an impl alias, annotated with `#[abi(embed_v0)]` to expose public functions.

Internal methods meant only for internal use should be implemented in a separate impl block without `#[abi(embed_v0)]`.

### Example: Embedding the Ownable Component

The following example demonstrates embedding the `Ownable` component into an `OwnableCounter` contract:

```cairo
#[starknet::contract]
mod OwnableCounter {
    use listing_01_ownable::component::OwnableComponent;
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);

    #[abi(embed_v0)]
    impl OwnableImpl = OwnableComponent::OwnableImpl<ContractState>;

    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        counter: u128,
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        OwnableEvent: OwnableComponent::Event,
    }

    #[abi(embed_v0)]
    fn foo(ref self: ContractState) {
        self.ownable.assert_only_owner();
        self.counter.write(self.counter.read() + 1);
    }
}
```

This integration makes the component's logic seamlessly available in `OwnableCounter`. Functions exposed via `#[abi(embed_v0)]` can be called externally using the component's interface dispatcher.

---

Sources:

- https://www.starknet.io/cairo-book/ch103-05-02-randomness.html
- https://www.starknet.io/cairo-book/ch12-11-offloading-computations-with-oracles.html
- https://www.starknet.io/cairo-book/ch103-05-01-price-feeds.html
- https://www.starknet.io/cairo-book/ch103-05-oracle-interactions.html

---

# Cairo Contracts Integrations

### Oracles: Integrating External Data and Randomness

Oracles act as intermediaries to securely transmit external data (like asset prices) or offload computations to the Starknet blockchain. Pragma is presented as an example oracle service supporting both price feeds and verifiable random functions (VRFs).

#### Price Feeds

Price feeds provide real-time pricing data aggregated from trusted external sources. To integrate Pragma for price feeds:

1.  **Dependency**: Add `pragma_lib` to `Scarb.toml`:

```toml
[dependencies]
pragma_lib = { git = "https://github.com/astraly-labs/pragma-lib" }
```

2.  **Interface Definition**: Define an interface including the necessary view function, such as `get_asset_price`:

```cairo
#[starknet::interface]
pub trait IPriceFeedExample<TContractState> {
    fn buy_item(ref self: TContractState);
    fn get_asset_price(self: @TContractState, asset_id: felt252) -> u128;
}
```

3.  **Implementation**: The `get_asset_price` function interacts with the oracle:

```cairo
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

Pragma may return values with decimal factors of 6 or 8, requiring conversion by dividing by \({10^{n}}\).

An example application consuming this feed (`PriceFeedExample`) calculates required ETH based on the retrieved price:

```cairo
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

#### Verifiable Random Functions (VRFs)

Since blockchains are deterministic, generating truly unpredictable randomness requires Verifiable Random Functions (VRFs) provided by oracles. VRFs use a secret key and a nonce to generate a random number and a proof, ensuring the result cannot be predicted or tampered with.

Pragma provides VRF solutions on Starknet. The process involves:

1.  **Requesting Randomness**: Initiated via `request_randomness_from_pragma` which emits an event triggering off-chain generation and on-chain submission via a callback.
2.  **Callback**: The oracle submits results via the `receive_random_words` function.

Key inputs for `request_randomness_from_pragma` include:

*   `seed`: Unique value to initialize generation.
*   `callback_address`: Address of the contract implementing `receive_random_words`.
*   `callback_fee_limit`: Max gas willing to spend on the callback execution.
*   `publish_delay`: Minimum block delay before fulfillment.
*   `num_words`: Number of random `felt252` values requested.
*   `calldata`: Additional data passed to the callback.

**Dice Game Example using Pragma VRF**

This contract uses VRF to determine game winners. It requires defining interfaces for both the game logic (`IDiceGame`) and the oracle (`IPragmaVRF`).

Key entrypoints in `IPragmaVRF`:

*   `request_randomness_from_pragma`: Owner calls this to initiate the request.
*   `receive_random_words`: Called by the oracle to submit the results, which are stored in `last_random_number`.

The full contract implementation (`DiceGame`) demonstrates handling the request, approval of callback fees, and processing the result in `process_game_winners`:

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
        ContractAddress, contract_address_const,
        get_block_number, get_caller_address,
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
            assert!(self.game_window.read(), "GAME_INACTIVE");
            assert!(guess >= 1 && guess <= 6, "INVALID_GUESS");

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
            assert!(!self.game_window.read(), "GAME_ACTIVE");
            assert!(self.last_random_number.read() != 0, "NO_RANDOM_NUMBER_YET");

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
                contract_address: contract_address_const::<\n                    0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7,\n                >() // ETH Contract Address
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
            assert!(
                caller_address == self.pragma_vrf_contract_address.read(),
                "caller not randomness contract",
            );
            // and that the current block is within publish_delay of the request block
            let current_block_number = get_block_number();
            let min_block_number = self.min_block_number_storage.read();
            assert!(min_block_number <= current_block_number, "block number issue");

            let random_word = *random_words.at(0);
            self.last_random_number.write(random_word);
        }

        fn withdraw_extra_fee_fund(ref self: ContractState, receiver: ContractAddress) {
            self.ownable.assert_only_owner();
            let eth_dispatcher = ERC20ABIDispatcher {
                contract_address: contract_address_const::<\n                    0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7,\n                >() // ETH Contract Address
            };
            let balance = eth_dispatcher.balance_of(get_contract_address());
            eth_dispatcher.transfer(receiver, balance);
        }
    }
}
```

**Funding Requirement**: Contracts utilizing Pragma VRF must be funded with sufficient ETH post-deployment to cover both the randomness generation and the callback execution fees.

### External Computation and Off-Chain Interaction

---

Sources:

- https://www.starknet.io/cairo-book/ch103-04-L1-L2-messaging.html

---

## System-Level Patterns and Messaging
### Local Messaging System Testing
You can also find a detailed guide here to test the messaging system locally.

---

Sources:

- https://www.starknet.io/cairo-book/ch10-01-how-to-write-tests.html
- https://www.starknet.io/cairo-book/ch104-02-testing-smart-contracts.html
- https://www.starknet.io/cairo-book/ch09-02-recoverable-errors.html
- https://www.starknet.io/cairo-book/ch10-02-test-organization.html
- https://www.starknet.io/cairo-book/ch104-01-general-recommendations.html
- https://www.starknet.io/cairo-book/ch09-01-unrecoverable-errors-with-panic.html
- https://www.starknet.io/cairo-book/appendix-05-common-error-messages.html
- https://www.starknet.io/cairo-book/ch103-02-03-testing-components.html
- https://www.starknet.io/cairo-book/ch01-03-proving-a-prime-number.html
- https://www.starknet.io/cairo-book/ch09-00-error-handling.html
- https://www.starknet.io/cairo-book/ch10-00-testing-cairo-programs.html
- https://www.starknet.io/cairo-book/ch103-06-01-deploying-and-interacting-with-a-voting-contract.html
- https://www.starknet.io/cairo-book/ch104-00-starknet-smart-contracts-security.html
- https://www.starknet.io/cairo-book/ch104-03-static-analysis-tools.html

---

---

Sources:

- https://www.starknet.io/cairo-book/ch09-02-recoverable-errors.html
- https://www.starknet.io/cairo-book/ch09-01-unrecoverable-errors-with-panic.html
- https://www.starknet.io/cairo-book/appendix-05-common-error-messages.html
- https://www.starknet.io/cairo-book/ch01-03-proving-a-prime-number.html
- https://www.starknet.io/cairo-book/ch09-00-error-handling.html
- https://www.starknet.io/cairo-book/ch10-01-how-to-write-tests.html
- https://www.starknet.io/cairo-book/ch103-06-01-deploying-and-interacting-with-a-voting-contract.html
- https://www.starknet.io/cairo-book/ch104-01-general-recommendations.html

---

#### Error Handling and Program Robustness

In Cairo, error handling involves techniques to manage potential issues, ensuring programs are adaptable and maintainable. Approaches include pattern matching with `Result`, using the `?` operator for ergonomic propagation, and using `unwrap` or `expect` for handling recoverable errors.

## Unrecoverable Errors with `panic`

Unexpected issues can cause runtime errors, leading to program termination via `panic`. A panic can occur inadvertently (e.g., array out of bounds) or deliberately by invoking the `panic` function. When a panic occurs, it terminates execution, drops variables, and squashes dictionaries to ensure program soundness.

### Calling `panic`

The `panic` function takes an array as an argument:

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

Executing this produces output like:
```
$ scarb execute
   Compiling no_listing_01_panic v0.1.0 (listings/ch09-error-handling/no_listing_01_panic/Scarb.toml)
    Finished `dev` profile target(s) in 1 second
   Executing no_listing_01_panic
error: Panicked with 0x2.
```

### Alternatives to `panic`

1.  **`panic_with_felt252`**: A more idiomatic one-liner abstraction that takes a `felt252` error message:

    ```cairo
    use core::panic_with_felt252;

    #[executable]
    fn main() {
        panic_with_felt252(2);
    }
    ```

2.  **`panic!` Macro**: More convenient than `panic`, as it takes a string literal, allowing error messages longer than 31 bytes:

    ```cairo
    #[executable]
    fn main() {
        if true {
            panic!("2");
        }
        println!("This line isn't reached");
    }
    ```

### The `nopanic` Notation

The `nopanic` notation indicates a function will never panic, allowing it to be called only from other `nopanic` functions.

```cairo
fn function_never_panic() -> felt252 nopanic {
    42
}
```

If a function declared as `nopanic` calls a function that may panic (like `assert!`), compilation will fail:
```
error: Function is declared as nopanic but calls a function that may panic.
```

### `panic_with` Attribute

This attribute marks a function returning an `Option` or `Result`. It creates a wrapper that panics with a specified error reason if the original function returns `None` or `Err`.

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

## Recoverable Errors with `Result` and Propagation

Most errors are recoverable, allowing functions to return an error value instead of terminating.

### The `Result` Enum

The `Result<T, E>` enum signifies success or failure:

```cairo
enum Result<T, E> {
    Ok: T,
    Err: E,
}
```

### `ResultTrait` Methods

The `ResultTrait` provides methods for working with `Result<T, E>`:

| Method | Behavior on `Ok(x)` | Behavior on `Err(e)` |
| :--- | :--- | :--- |
| `unwrap()` | Returns `x` (panics with default message otherwise) | Panics |
| `expect(err)` | Returns `x` | Panics with custom message `err` |
| `unwrap_err()` | Panics | Returns `e` |
| `expect_err(err)` | Panics with custom message `err` | Returns `e` |
| `is_ok()` | Returns `true` | Returns `false` |
| `is_err()` | Returns `false` | Returns `true` |

These methods require generic type constraints, such as `<+Drop<E>>` for `unwrap`.

### Propagating Errors with the `?` Operator

Error propagation allows a function to return an error to its caller instead of handling it internally. This is commonly done using the `?` operator, which simplifies error handling boilerplate.

If a `Result` value has `Ok(x)`, `?` unwraps `x` and continues execution. If it has `Err(e)`, the `?` operator returns `Err(e)` early from the entire function, propagating the error to the caller.

The `?` operator can only be used in functions whose return type is compatible (e.g., returns `Result` or `Option`).

```cairo
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
    let input_to_u8: u8 = parse_u8(input)?;
    let res = input_to_u8 - 1;
    Ok(res)
}
```

If used incorrectly (e.g., in a function returning `()`), it results in:
```
error: `?` can only be used in a function with `Option` or `Result` return type.
```

## Common Error Messages

Encountering specific error messages can be resolved by checking the following:

*   **`Variable not dropped.`**: A variable of a non-`Drop`/non-`Destruct` type is going out of scope without being destroyed.
*   **`Variable was previously moved.`**: Attempting to use a variable whose ownership was transferred (if it doesn't implement `Copy`). Use `.clone()` to avoid this.
*   **`error: Trait has no implementation in context: core::fmt::Display...`**: Occurs when using `{}` for custom types in `print!`. Implement `Display` or use `derive(Debug)` and print with `{:?}`.
*   **`Got an exception while executing a hint: Hint Error: Failed to deserialize param #x.`**: An entrypoint was called without expected arguments. For `u256` (a struct of two `u128`), two values must be passed.
*   **`Item path::item is not visible in this context.`**: Visibility issue. Declare modules and items using `pub(crate)` or `pub`.
*   **`Identifier not found.`**: May mean a variable is used before declaration (`let`) or the path to an item is incorrect.

## Robustness and Security Considerations

Certain programming patterns can lead to vulnerabilities if not handled carefully:

### Operator Precedence
`&&` has higher precedence than `||`. Parentheses must be used to enforce correct precedence in combined boolean expressions:

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
Using an unsigned integer (`u32`) for a loop counter that is decremented past zero causes an underflow panic. Use signed integers (`i32`) for counters that might go below zero:

```cairo
// ✅ prefer signed counters or explicit break
let mut i: i32 = (n.try_into().unwrap()) - 1;
while i >= 0 { // This would never trigger if `i` was a u32.
    // ...
    i -= 1;
}
```

### Bit-Packing into `felt252`
Packing fields into a single `felt252` requires strict bounds checking. The sum of the sizes of packed values should not exceed 251 bits.

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

---

Sources:

- https://www.starknet.io/cairo-book/ch10-01-how-to-write-tests.html
- https://www.starknet.io/cairo-book/ch104-02-testing-smart-contracts.html
- https://www.starknet.io/cairo-book/ch10-02-test-organization.html
- https://www.starknet.io/cairo-book/ch103-02-03-testing-components.html
- https://www.starknet.io/cairo-book/ch10-00-testing-cairo-programs.html

---

## Cairo Testing Mechanics and Organization

Cairo includes support for writing tests to verify program correctness beyond what the type system can prove. Testing is complex, but Cairo provides specific annotations and macros to facilitate writing tests.

### Anatomy of a Test Function

Tests are Cairo functions annotated with the `#[test]` attribute. A typical test function performs three actions:

1.  Set up any needed data or state.
2.  Run the code you want to test.
3.  Assert the results are what you expect.

When running tests with `scarb test`, Scarb executes Starknet Foundry's test runner binary against these annotated functions.

Cairo features available for writing tests include:

*   `#[test]` attribute: Marks a function as a test.
*   Assertion macros: `assert!`, `assert_eq!`, `assert_ne!`, `assert_lt!`, `assert_le!`, `assert_gt!`, and `assert_ge!`.
*   `#[should_panic]` attribute: Marks a test that is expected to panic.

### The `tests` Module and Configuration

To contain unit tests within the same file as the code they test, a module named `tests` is conventionally created and annotated with `#[cfg(test)]`. This attribute ensures the test code is compiled and run only when tests are executed (e.g., via `scarb test`), saving compile time and space in the final artifact.

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

### Assertion Macros

Tests fail when code inside the function panics. Assertions are used to check conditions:

*   `assert!(condition, message)`: Fails if the condition evaluates to `false`.
*   `assert_eq!(left, right)` and `assert_ne!(left, right)`: Compare two arguments for equality or inequality, printing the values upon failure.
*   Comparison macros: `assert_lt!`, `assert_le!`, `assert_gt!`, and `assert_ge!` check relative ordering.

When assertions fail, custom failure messages can be added as optional arguments to these macros, which are passed to the `format!` macro.

### Test Organization

Tests are categorized into two main types:

#### Unit Tests

Unit tests are focused on testing one module in isolation, often including private functions. They reside in the `src` directory within the file they are testing, typically inside a `#[cfg(test)] mod tests` block.

#### Integration Tests

Integration tests verify that multiple parts of the library work together correctly, using only the public interface. They are placed in a top-level `tests` directory, where each file is compiled as an individual crate. To make the `tests` directory behave as a single crate, a `tests/lib.cairo` file can be added.

### Controlling Test Execution

*   **Filtering:** Running `scarb test <name>` runs only tests whose names match the provided string (or substring).
*   **Ignoring:** The `#[ignore]` attribute excludes a test from standard runs. It can be included later using `scarb test --include-ignored`.
*   **Gas Limits:** For recursive functions or loops, the execution gas can be overridden using `#[available_gas(<Number>)]` on the test function.

### Benchmarking

Starknet Foundry's profiling feature, used with `snforge test --build-profile`, generates execution traces for successful tests to analyze and optimize performance, visualized using tools like `go tool pprof`.

---

Sources:

- https://www.starknet.io/cairo-book/ch104-01-general-recommendations.html
- https://www.starknet.io/cairo-book/ch104-00-starknet-smart-contracts-security.html
- https://www.starknet.io/cairo-book/ch104-03-static-analysis-tools.html

---

### Security Best Practices and Contract Testing

#### General Recommendations and Focus Areas
Writing secure code is crucial. Focus areas derived from audits include:
*   Access control and upgrades.
*   Safe ERC20 token integrations.
*   Cairo-specific pitfalls.
*   Cross-domain/bridging safety.
*   Economic/Denial of Service (DoS) considerations.

#### Access Control, Upgrades & Initializers
The most common critical issues involve access control ("who can call this?") and re-initialization.

##### Own Your Privileged Paths
Ensure upgrades, pause/resume, bridge handling, and meta-execution are guarded, typically using `OwnableComponent`.

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

##### Initializers Must Be Idempotent
A publicly exposed initializer called post-deploy can lead to vulnerabilities if it can be called multiple times. Ensure initialization logic is idempotent by checking a flag first.

```cairo
#[storage]
struct Storage {
    _initialized: u8,
    // ...
}

fn initializer(ref self: ContractState, owner: ContractAddress) {
    assert!(self._initialized.read() == 0, "ALREADY_INIT");
    self._initialized.write(1);
    self.ownable.initialize(owner);
    // init the rest…
}
```
Rule: If a function must be external during deployment, ensure it can only be called once; otherwise, keep it internal.

##### Emit Events
Emit events for upgrades, configuration changes, pausing, liquidations, and any privileged action to aid incident response and indexers. Include addresses (e.g., token) to remove ambiguity.

#### Safe Token Integrations
##### Always Check Boolean Returns
Not all ERC20 implementations revert on failure; some return `false`. Verify the boolean flags returned by `transfer` and `transfer_from` to confirm success.

##### Naming Conventions
Most Starknet ERC20 tokens use `snake_case`. Be aware that legacy tokens might use `camelCase` entrypoints, requiring adaptation if interacting with them.

#### Cairo-Specific Pitfalls
##### `deploy_syscall(deploy_from_zero=true)` Collisions
Setting `deploy_from_zero` to `true` enables deterministic deployment, which can cause collisions if two contracts attempt deployment with the same calldata. Set this to `false` unless this behavior is explicitly desired.

##### Useless Zero-Address Checks
Checks like `get_caller_address().is_zero()` are inherited from Solidity but are useless on Starknet, as `get_caller_address()` is never the zero address.

#### Cross-Domain / Bridging Safety
L1-L2 interactions require specific validation.

##### L1 Handler Caller Validation
Entrypoints marked with `#[l1_handler]` must validate that the caller address originates from a trusted L1 contract.

```cairo
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

#### Economic/DoS & Griefing
##### Unbounded Loops
User-controlled iterations (e.g., batch withdrawals, order sweeps) can exceed Starknet's execution step limit if the list size is unbounded. Cap the number of iterations or implement a pagination pattern to split work across multiple transactions.

#### Static Analysis Tools (Contract Testing)
Static analysis examines code structure, syntax, and properties without execution to identify vulnerabilities or rule violations. Developers should use these tools to automatically check code against defined security guidelines.
Reference tools include:
*   Semgrep Cairo 1.0 support
*   Caracal, a Starknet static analyzer

---

Sources:

- https://www.starknet.io/cairo-book/appendix-02-operators-and-symbols.html
- https://www.starknet.io/cairo-book/appendix-01-keywords.html
- https://www.starknet.io/cairo-book/appendix-04-cairo-prelude.html
- https://www.starknet.io/cairo-book/appendix-00.html
- https://www.starknet.io/cairo-book/appendix-000.html
- https://www.starknet.io/cairo-book/appendix-06-useful-development-tools.html
- https://www.starknet.io/cairo-book/ch103-06-00-other-examples.html

---

---

Sources:

- https://www.starknet.io/cairo-book/appendix-00.html
- https://www.starknet.io/cairo-book/appendix-000.html

---

### Reference Material Overview

#### Appendix (Cairo)
The Cairo Programming Language appendix includes:
* Light
* Rust
* Coal
* Navy
* Ayu

The following sections contain reference material you may find useful in your Cairo journey.

#### Appendix (Starknet)
The following sections contain reference material you may find useful in your Starknet journey.
]]

---

Sources:

- https://www.starknet.io/cairo-book/appendix-01-keywords.html

---

### Cairo Keywords and Built-ins

The Cairo language keywords are divided into three reserved categories: strict, loose, and reserved. Additionally, built-in function names should not be used for other items as good practice.

#### Keyword Categories

Keywords fall into three categories: strict, loose, and reserved. A fourth category includes core library functions whose names are not reserved but are discouraged from reuse.

#### Strict Keywords

These keywords must only be used in their correct contexts and cannot serve as item names.

*   `as` - Rename import
*   `break` - Exit a loop immediately
*   `const` - Define constant items
*   `continue` - Continue to the next loop iteration
*   `else` - Fallback for `if` and `if let` control flow constructs
*   `enum` - Define an enumeration
*   `extern` - Function defined at the compiler level that can be compiled to CASM
*   `false` - Boolean false literal
*   `fn` - Define a function
*   `if` - Branch based on the result of a conditional expression
*   `impl` - Implement inherent or trait functionality
*   `implicits` - Special kind of function parameters that are required to perform certain actions
*   `let` - Bind a variable
*   `loop` - Loop unconditionally
*   `match` - Match a value to patterns
*   `mod` - Define a module
*   `mut` - Denote variable mutability
*   `nopanic` - Functions marked with this notation mean that the function will never panic.
*   `of` - Implement a trait
*   `pub` - Denote public visibility in items, such as struct and struct fields, enums, consts, traits and impl blocks, or modules
*   `ref` - Parameter passed implicitly returned at the end of a function
*   `return` - Return from function
*   `struct` - Define a structure
*   `trait` - Define a trait
*   `true` - Boolean true literal
*   `type` - Define a type alias
*   `use` - Bring symbols into scope
*   `while` - loop conditionally based on the result of an expression

#### Loose Keywords

These keywords are associated with specific behavior but can also be used to define items.

*   `self` - Method subject
*   `super` - Parent module of the current module

#### Reserved Keywords

These keywords are reserved for future use. While it is currently possible to use them to define items, doing so is highly discouraged to ensure forward compatibility.

*   `Self`
*   `do`
*   `dyn`
*   `for`
*   `hint`
*   `in`
*   `macro`
*   `move`
*   `static_assert`
*   `static`
*   `try`
*   `typeof`
*   `unsafe`
*   `where`
*   `with`
*   `yield`

#### Built-in Functions

These functions serve a special purpose in Cairo. Using their names for other items is not recommended.

*   `assert` - This function checks a boolean expression, and if it evaluates to false, it triggers the panic function.
*   `panic` - This function acknowledges the occurrence of an error and terminates the program.

---

Sources:

- https://www.starknet.io/cairo-book/appendix-02-operators-and-symbols.html

---

# Syntax Glossary and Symbols

This section provides a glossary of Cairo's syntax, including operators and other symbols used in paths, generics, macros, attributes, comments, tuples, and brackets.

## Operators

Table B-1 lists Cairo operators, their context, explanation, and overloadability details.

| Operator | Example | Explanation | Overloadable? |
| --- | --- | --- | --- |
| `!` | `!expr` | Logical complement | `Not` |
| `~` | `~expr` | Bitwise NOT | `BitNot` |
| `!=` | `expr != expr` | Non-equality comparison | `PartialEq` |
| `%` | `expr % expr` | Arithmetic remainder | `Rem` |
| `%=` | `var %= expr` | Arithmetic remainder and assignment | `RemEq` |
| `&` | `expr & expr` | Bitwise AND | `BitAnd` |
| `&&` | `expr && expr` | Short-circuiting logical AND |  |
| `*` | `expr * expr` | Arithmetic multiplication | `Mul` |
| `*=` | `var *= expr` | Arithmetic multiplication and assignment | `MulEq` |
| `@` | `@var` | Snapshot |  |
| `*` | `*var` | Desnap |  |
| `+` | `expr + expr` | Arithmetic addition | `Add` |
| `+=` | `var += expr` | Arithmetic addition and assignment | `AddEq` |
| `,` | `expr, expr` | Argument and element separator |  |
| `-` | `-expr` | Arithmetic negation | `Neg` |
| `-` | `expr - expr` | Arithmetic subtraction | `Sub` |
| `-=` | `var -= expr` | Arithmetic subtraction and assignment | `SubEq` |
| `->` | `fn(...) -> type`, `|...| -> type` | Function and closure return type |  |
| `.` | `expr.ident` | Member access |  |
| `/` | `expr / expr` | Arithmetic division | `Div` |
| `/=` | `var /= expr` | Arithmetic division and assignment | `DivEq` |
| `:` | `pat: type`, `ident: type` | Constraints |  |
| `:` | `ident: expr` | Struct field initializer |  |
| `;` | `expr;` | Statement and item terminator |  |
| `<` | `expr < expr` | Less than comparison | `PartialOrd` |
| `<=` | `expr <= expr` | Less than or equal to comparison | `PartialOrd` |
| `=` | `var = expr` | Assignment |  |
| `==` | `expr == expr` | Equality comparison | `PartialEq` |
| `=>` | `pat => expr` | Part of match arm syntax |  |
| `>` | `expr > expr` | Greater than comparison | `PartialOrd` |
| `>=` | `expr >= expr` | Greater than or equal to comparison | `PartialOrd` |
| `^` | `expr ^ expr` | Bitwise exclusive OR | `BitXor` |
| `|` | `expr | expr` | Bitwise OR | `BitOr` |
| `||` | `expr || expr` | Short-circuiting logical OR |  |
| `?` | `expr?` | Error propagation |  |

## Non-Operator Symbols

These symbols do not behave like a function or method call.

### Stand-Alone Syntax

| Symbol | Explanation |
| --- | --- |
| `..._u8`, `..._usize`, `..._bool`, etc. | Numeric literal of specific type |
| `\"...\"` | String literal |
| `'...'` | Short string, 31 ASCII characters maximum |
| `_` | “Ignored” pattern binding |

### Path-Related Syntax

Symbols used within the context of a module hierarchy path to access an item.

| Symbol | Explanation |
| --- | --- |
| `ident::ident` | Namespace path |
| `super::path` | Path relative to the parent of the current module |
| `trait::method(...)` | Disambiguating a method call by naming the trait that defines it |

### Generic Type Parameters

Symbols appearing in the context of using generic type parameters.

| Symbol | Explanation |
| --- | --- |
| `path<...>` | Specifies parameters to generic type in a type (e.g., `Array<u8>`) |

### Macros

| Symbol | Explanation |
| :--- | :--- |
| `get_dep_component_mut!` | Returns the requested component state from a reference of the state inside a component |
| `component!` | Macro used in Starknet contracts to embed a component inside a contract |

### Comments

Symbols that create comments.

| Symbol | Explanation |
| --- | --- |
| `//` | Line comment |

### Tuples

Symbols appearing in the context of using tuples.

| Symbol | Explanation |
| --- | --- |
| `()` | Empty tuple (aka unit), both literal and type |
| `(expr)` | Parenthesized expression |
| `(expr,)` | Single-element tuple expression |
| `(type,)` | Single-element tuple type |
| `(expr, ...)` | Tuple expression |
| `(type, ...)` | Tuple type |
| `expr(expr, ...)` | Function call expression; also used to initialize tuple `struct`s and tuple `enum` variants |

### Curly Braces

Contexts in which curly braces are used.

| Context | Explanation |
| --- | --- |
| `{...}` | Block expression |
| `Type {...}` | `struct` literal |

---

Sources:

- https://www.starknet.io/cairo-book/appendix-04-cairo-prelude.html

---

## Cairo Prelude and Editions

### The Cairo Prelude

The Cairo prelude is a collection of commonly used modules, functions, data types, and traits that are automatically brought into scope of every module in a Cairo crate without needing explicit import statements. It provides the basic building blocks for starting Cairo programs and writing smart contracts.

The core library prelude is defined in the *lib.cairo* file of the corelib crate and contains:
*   Data types: integers, bools, arrays, dicts, etc.
*   Traits: behaviors for arithmetic, comparison, and serialization operations.
*   Operators: arithmetic, logical, bitwise.
*   Utility functions - helpers for arrays, maps, boxing, etc.

Since the core library prelude is automatically imported, its contents are available for use in any Cairo crate without explicit imports. This allows usage like `ArrayTrait::append()` or the `Default` trait without explicit scoping.

### Cairo Editions

You can choose which prelude version to use by specifying the edition in the *Scarb.toml* configuration file. For example, adding `edition = "2024_07"` loads the prelude from July 2024. New projects created via `scarb new` automatically include `edition = "2024_07"`. Different prelude versions expose different functions and traits, making the specification of the correct edition important. Generally, new projects should start with the latest edition.

Here is the list of available Cairo editions (i.e prelude versions) with their details:

| Version | Details |
| --- | --- |
| `2024-07` | details for 2024-07 |
| `2023-11` | details for 2023-11 |
| `2023-10` / `2023-1` | details for 2023-10 |

---

Sources:

- https://www.starknet.io/cairo-book/appendix-06-useful-development-tools.html
- https://www.starknet.io/cairo-book/ch103-06-00-other-examples.html

---

## Development Tools and Examples

### Useful Development Tools

This section covers useful development tools provided by the Cairo project, including automatic formatting, quick warning fixes, a linter, and IDE integration.

#### Automatic Formatting with `scarb fmt`

Scarb projects can be formatted using the `scarb fmt` command. If using Cairo binaries directly, run `cairo-format`. This tool ensures consistent style across collaborative projects.

To format any Cairo project, run the following inside the project directory:
```
scarb fmt
```

To skip formatting for specific code sections, use `#[cairofmt::skip]`:
```
#[cairofmt::skip]
let table: Array<ByteArray> = array![
    "oxo",
    "xox",
    "oxo",
];
```

#### IDE Integration Using `cairo-language-server`

The Cairo community recommends using the `cairo-language-server` for IDE integration. This tool speaks the Language Server Protocol, enabling features like autocompletion, jump to definition, and inline errors when used with clients like the Cairo extension for Visual Studio Code.

Visit the `vscode-cairo` page to install it on VSCode.

> Note: If you have Scarb installed, it should work out of the box with the Cairo VSCode extension, without a manual installation of the language server.

### Other Examples

This section contains additional examples of Starknet smart contracts, utilizing various features of the Cairo programming language. Contributions of diverse examples are welcome.
