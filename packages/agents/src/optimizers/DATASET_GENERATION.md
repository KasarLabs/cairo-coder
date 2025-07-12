# Starklings Dataset Generation

This document explains how to generate a real-world dataset from Starklings exercises for optimizing the Cairo code generation program.

## Prerequisites

1. **PostgreSQL with pgvector** must be running with ingested documentation:

   ```bash
   docker compose up postgres
   # In another terminal, run ingester if needed:
   docker compose up ingester
   ```

2. **Git** must be installed (to clone Starklings repository)

3. **Environment setup**:
   - Ensure `config.toml` exists with proper database configuration
   - **IMPORTANT**: If running locally, see [LOCAL_SETUP.md](./LOCAL_SETUP.md) for Docker PostgreSQL connection
   - Set `GEMINI_API_KEY` environment variable (for embeddings)

## Running the Dataset Generator

From the monorepo root:

```bash
cd packages/agents
pnpm generate-starklings-dataset
```

## What the Script Does

1. **Clones Starklings Repository**: Downloads the Cairo 1 Starklings exercises from GitHub
2. **Parses Exercises**: Reads the `info.toml` file to extract all exercise metadata
3. **Reads Exercise Code**: Uses the full exercise source code (with TODOs) as the query
4. **Retrieves Context**: For each exercise, performs vector search to find relevant Cairo documentation
5. **Summarizes Context**: Uses an AxProgram to condense raw documentation while preserving all important technical details
6. **Extracts Solutions**: Looks for solution files or complete implementations
7. **Creates Dataset**: Generates a TypeScript file with all examples

## Output

The script generates:

- `packages/agents/src/optimizers/datasets/generation.dataset.ts`

This file contains:

- Array of `GenerationExample` objects
- Each example includes:
  - `query`: The incomplete exercise code (with TODOs/FILL_ME markers) plus the hint
  - `context`: **Summarized** Cairo documentation focusing only on relevant technical details
  - `chat_history`: Empty string (for compatibility)
  - `expected.answer`: The solution code wrapped in markdown code blocks
- Metadata about the dataset generation

## Context Summarization

The script uses a dedicated AxProgram (`context-summarizer.program.ts`) to:

- **Preserve ALL important technical information**: Code examples, function signatures, syntax details
- **Remove redundant text**: Verbose explanations and irrelevant sections
- **Maintain code accuracy**: Exact import statements, error handling patterns, trait implementations
- **Focus on the query**: Only keep information relevant to the specific exercise

This results in more focused, information-dense context that enables better code generation while reducing token usage.

## Dataset Quality

The generated dataset includes:

- **Diverse exercises**: From basic syntax to complex contracts
- **Real documentation context**: Actual Cairo docs retrieved via vector search
- **Compilable solutions**: Only exercises with valid solutions are included
- **Natural queries**: Hints converted to questions users might ask

## Testing the Context Summarizer

You can test the context summarization independently:

```bash
cd packages/agents
pnpm test-context-summarizer
```

This will show:

- Original vs summarized context length
- Reduction percentage
- Whether important technical elements are preserved

## Troubleshooting

### "config.toml not found"

Create it from `sample.config.toml` with your database connection string.

### "Failed to connect to database"

Ensure PostgreSQL is running: `docker compose up postgres`

### "No solution found for exercise"

Some Starklings exercises don't have solutions. These are skipped automatically.

### "Context summarization failed"

The script falls back to raw context if summarization fails. Check your GEMINI_API_KEY.

### Rate limiting errors

The script processes exercises in batches with delays. If you still hit limits, reduce batch size in the script.

## Customization

To modify the dataset generation:

1. **Change sources**: Edit the `filter` in `getContextForQuery()` to use different documentation sources
2. **Adjust context size**: Modify the `k` parameter in `similaritySearch()`
3. **Filter exercises**: Add logic in `processExercise()` to skip certain types
4. **Add metadata**: Include additional fields in the `ProcessedExample` interface

## Integration with Optimizer

After generating the dataset:

1. The optimizer will automatically use the new dataset
2. Run `pnpm optimize-generation` to start optimization
3. The optimizer will evaluate how well the generation program produces code matching the Starklings solutions

## Example Generated Entry

````typescript
{
  query: "Complete the following Cairo code:\n\n```cairo\n// Exercise: Implement a function that adds two numbers\nfn add(a: u32, b: u32) -> u32 {\n    // TODO: Fill in the function body\n    ???\n}\n\n#[test]\nfn test_add() {\n    assert(add(2, 3) == 5, 'Should equal 5');\n}\n```\n\nHint: Return the sum of a and b",
  chat_history: "",
  context: "[Document 1 - CAIRO_BOOK: Functions]\nFunctions are declared with the fn keyword...",
  expected: {
    answer: "Here's a solution for the exercise:\n\n```cairo\nfn add(a: u32, b: u32) -> u32 {\n    a + b\n}\n```"
  }
}
````
