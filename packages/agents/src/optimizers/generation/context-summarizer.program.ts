import { AxAI, AxGen, AxSignature, f, s } from '@ax-llm/ax';
import { getAxRouter } from '../../config/llm';

/**
 * Program to summarize raw documentation context while preserving all important information
 * related to the specific Cairo/Starknet query.
 */

const signature = s`
query:${f.string("The user's query that must be answered with Cairo code examples or solutions.")}, rawContext:${f.string('Documentation context containing relevant Cairo/Starknet information to inform the response to summarize.')} ->
summarizedContext:string
`;

export const contextSummarizerProgram = new AxGen<
  { query: string; rawContext: string },
  { summarizedContext: string }
>(signature, {
  description: `Summarize Cairo/Starknet documentation context while preserving ALL important technical details, code examples, and specific information relevant to the query.

Key requirements:
1. Keep ALL code examples, function signatures, and syntax details
2. Preserve specific Cairo/Starknet terminology and concepts
3. Maintain exact error handling patterns and best practices
4. Remove only redundant explanatory text and irrelevant sections
5. Ensure the summary contains sufficient detail for code generation
6. Keep import statements, module paths, and dependency information
7. Preserve trait implementations, storage patterns, and contract structures

The goal is to create a focused, information-dense context that enables accurate Cairo code generation.`,
});

// Set examples to demonstrate proper summarization
contextSummarizerProgram.setExamples([
  {
    query: `Complete the following Cairo code:

\`\`\`cairo
// Exercise: Implement a function that adds two numbers
fn add(a: u32, b: u32) -> u32 {
    // TODO: Fill in the function body
    ???
}

#[test]
fn test_add() {
    assert(add(2, 3) == 5, 'Should equal 5');
}
\`\`\`

Hint: Return the sum of a and b`,
    rawContext: `[Document 1 - CAIRO_BOOK: Functions]
Functions in Cairo are declared using the fn keyword. Functions are the primary way to organize code in Cairo. A function declaration consists of the fn keyword, followed by the function name, parameters in parentheses, and the return type after an arrow ->. Functions can have parameters and return values. Parameters are specified inside parentheses after the function name. Each parameter must have a type annotation. The return type is specified after the -> symbol. Functions can return values using the return keyword or by omitting the semicolon from the last expression. Here's an example of a simple function:

\`\`\`cairo
fn add_two_numbers(x: u32, y: u32) -> u32 {
    x + y
}
\`\`\`

Functions can also be more complex and include multiple statements. You can call functions by using their name followed by parentheses containing the arguments. When calling a function, you must provide arguments that match the parameter types. Function calls are expressions and can be used anywhere an expression is expected. Functions are first-class values in Cairo, meaning they can be assigned to variables, passed as arguments to other functions, and returned from functions.

---

[Document 2 - CAIRO_BOOK: Basic Types]
Cairo has several built-in types. The u32 type represents a 32-bit unsigned integer. This type can hold values from 0 to 4,294,967,295. Unsigned integers are commonly used for representing positive numbers, counts, and array indices. The u32 type is one of several integer types available in Cairo, including u8, u16, u64, u128, and u256. Each type has a different range of values it can represent. When choosing an integer type, consider the range of values you need to store and the memory usage requirements of your application. Integer overflow is a common source of bugs in programs, so it's important to choose the appropriate type for your use case.

---

[Document 3 - CAIRO_BOOK: Testing]
Testing is an important part of Cairo development. Tests are written using the #[test] attribute. Test functions should not have parameters and should not return values. Tests can use the assert! macro to verify that conditions are true. If an assertion fails, the test will panic with the provided message. Here's an example of a simple test:

\`\`\`cairo
#[test]
fn test_addition() {
    let result = add(2, 3);
    assert!(result == 5, 'Addition should work correctly');
}
\`\`\`

Tests can be run using the Cairo test runner. The test runner will execute all functions marked with the #[test] attribute and report the results. You can also use more advanced testing features like setup and teardown functions, test fixtures, and parameterized tests. The Cairo testing framework provides many utilities for writing comprehensive test suites.

---

[Document 4 - CAIRO_BOOK: Error Handling]
Error handling in Cairo is done primarily through the panic! macro and the Result type. The panic! macro will immediately terminate the program with an error message. The Result type is used for functions that can fail and allows for more graceful error handling. When writing functions that can fail, consider returning a Result type instead of panicking. This allows callers to handle errors appropriately. The assert! macro is a special case that panics if the condition is false, which is useful for testing and debugging.`,
    summarizedContext: `Functions in Cairo are declared using the \`fn\` keyword, followed by the function name, parameters in parentheses (each with a type annotation), and the return type after an arrow \`->\`. Functions can return values by omitting the semicolon from the last expression in the function body. For example, a function to add two numbers can be written as:

\`\`\`cairo
fn add_two_numbers(x: u32, y: u32) -> u32 {
    x + y
}
\`\`\`

Cairo includes several built-in integer types, such as \`u32\`, which represents a 32-bit unsigned integer (values from 0 to 4,294,967,295).

Testing in Cairo is done using the \`#[test]\` attribute. Test functions should not have parameters or return values. The \`assert!\` macro can be used within tests to verify conditions; if an assertion fails, the test will panic with the provided message.

\`\`\`cairo
#[test]
fn test_addition() {
    let result = add(2, 3);
    assert!(result == 5, 'Addition should work correctly');
}
\`\`\`

Error handling primarily uses the \`panic!\` macro or the \`Result\` type. The \`assert!\` macro is a special case that panics if its condition is false.`,
  },
]);

export async function summarizeContext(
  query: string,
  rawContext: string,
): Promise<string> {
  const router = getAxRouter();

  try {
    const result = await contextSummarizerProgram.forward(
      router,
      { query, rawContext },
      { model: 'gemini-fast' }, // Use fast model for summarization
    );

    return result.summarizedContext;
  } catch (error) {
    console.warn('Context summarization failed, using raw context:', error);
    return rawContext; // Fallback to raw context if summarization fails
  }
}
