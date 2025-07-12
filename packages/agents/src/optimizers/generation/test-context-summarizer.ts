#!/usr/bin/env tsx

import { summarizeContext } from './context-summarizer.program';

async function testContextSummarizer() {
  console.log('🧪 Testing Context Summarizer Program\n');

  const testQuery = `Complete the following Cairo code:

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

Hint: Return the sum of a and b`;

  const rawContext = `[Document 1 - CAIRO_BOOK: Functions]
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
Error handling in Cairo is done primarily through the panic! macro and the Result type. The panic! macro will immediately terminate the program with an error message. The Result type is used for functions that can fail and allows for more graceful error handling. When writing functions that can fail, consider returning a Result type instead of panicking. This allows callers to handle errors appropriately. The assert! macro is a special case that panics if the condition is false, which is useful for testing and debugging.`;

  console.log('📝 Original Query:');
  console.log(testQuery);
  console.log('\n📚 Raw Context Length:', rawContext.length, 'characters');

  console.log('\n🔄 Summarizing context...');

  try {
    const summarizedContext = await summarizeContext(testQuery, rawContext);

    console.log('\n✅ Summarized Context:');
    console.log(summarizedContext);
    console.log('\n📊 Summary Stats:');
    console.log(`- Original length: ${rawContext.length} characters`);
    console.log(`- Summarized length: ${summarizedContext.length} characters`);
    console.log(
      `- Reduction: ${Math.round((1 - summarizedContext.length / rawContext.length) * 100)}%`,
    );

    // Check if important elements are preserved
    const hasCodeExample = summarizedContext.includes('```cairo');
    const hasTestInfo =
      summarizedContext.includes('#[test]') ||
      summarizedContext.includes('assert');
    const hasTypeInfo = summarizedContext.includes('u32');
    const hasFunctionSyntax =
      summarizedContext.includes('fn ') && summarizedContext.includes('->');

    console.log('\n🔍 Important Elements Preserved:');
    console.log(`- Code examples: ${hasCodeExample ? '✅' : '❌'}`);
    console.log(`- Test information: ${hasTestInfo ? '✅' : '❌'}`);
    console.log(`- Type information: ${hasTypeInfo ? '✅' : '❌'}`);
    console.log(`- Function syntax: ${hasFunctionSyntax ? '✅' : '❌'}`);
  } catch (error) {
    console.error('❌ Summarization failed:', error);
  }
}

testContextSummarizer().catch(console.error);
