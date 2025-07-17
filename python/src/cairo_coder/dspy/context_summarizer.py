"""DSPy module for summarizing Cairo/Starknet documentation context."""

from typing import Optional
from cairo_coder.core.types import ProcessedQuery
import dspy
import structlog

logger = structlog.get_logger(__name__)


class CairoContextSummarization(dspy.Signature):
    """Summarize Cairo/Starknet documentation context while preserving ALL important technical details, code examples, and specific information relevant to the query.

    Key requirements:
    1. Keep ALL code examples, function signatures, and syntax details
    2. Preserve specific Cairo/Starknet terminology and concepts
    3. Maintain exact error handling patterns and best practices
    4. Remove only redundant explanatory text and irrelevant sections
    5. Ensure the summary contains sufficient detail for code generation
    6. Keep import statements, module paths, and dependency information
    7. Preserve trait implementations, storage patterns, and contract structures

    The goal is to create a focused, information-dense context that enables accurate Cairo code generation.
    """

    processed_query: ProcessedQuery = dspy.InputField(desc="The user's query that must be answered with Cairo code examples or solutions.")
    raw_context: str = dspy.InputField(desc="Documentation context containing relevant Cairo/Starknet information to inform the response to summarize.")
    summarized_context: str = dspy.OutputField(desc="The condensed summary preserving all technical details and code examples.")


# Example for few-shot learning
EXAMPLE = dspy.Example(
    query="Complete the following Cairo code and address the TODOs:\n\n```cairo\nfn add(a: felt252, b: felt252) -> felt252 {\n    // TODO: implement addition\n}\n```",
    raw_context="""# Functions in Cairo

Functions are defined using the `fn` keyword followed by the function name, parameters, and return type.

```cairo
fn add(a: felt252, b: felt252) -> felt252 {
    a + b
}
```

## Function Parameters
Parameters are specified in parentheses after the function name. Each parameter has a name and type.

## Return Values
The return type is specified after the `->` arrow. The last expression in the function body is returned.

## Example Usage
```cairo
let result = add(5, 3);
assert(result == 8, 'Addition failed');
```

## Error Handling
Always validate inputs and handle edge cases appropriately.

## Testing
Write tests for your functions:
```cairo
#[test]
fn test_add() {
    assert(add(2, 3) == 5, 'test failed');
}
```""",
    summarized_context="""# Functions in Cairo

```cairo
fn add(a: felt252, b: felt252) -> felt252 {
    a + b
}
```

Parameters: name and type in parentheses after `fn` keyword.
Return type: specified after `->` arrow, last expression returned.

Example usage:
```cairo
let result = add(5, 3);
assert(result == 8, 'Addition failed');
```

Testing:
```cairo
#[test]
fn test_add() {
    assert(add(2, 3) == 5, 'test failed');
}
```"""
).with_inputs("query", "raw_context")
