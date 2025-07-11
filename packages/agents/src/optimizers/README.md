# Cairo Code Generation Optimizer

This directory contains the optimization infrastructure for improving the Cairo code generation quality using AX-LLM's MiPRO optimizer.

## Overview

The optimizer automatically improves the generation program by:
- Learning from examples to select optimal demonstrations
- Refining prompts for better code generation
- Validating generated code through compilation

## Files

- `optimize-generation.ts` - Main optimizer script
- `datasets/generation.dataset.ts` - Training examples for the optimizer
- `test-generation-metric.ts` - Test script for the metric function
- `optimized-generation-demos.json` - Output file with optimized demonstrations (created after running)

## Usage

### Prerequisites

1. Ensure Scarb is installed (v2.11.4+):
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://docs.swmansion.com/scarb/install.sh | sh
   ```

2. Start the database (required for context retrieval):
   ```bash
   docker compose up postgres backend
   ```

3. Set up environment variables:
   ```bash
   export GEMINI_API_KEY=your_api_key_here
   ```

### Running the Optimizer

1. Test the metric function:
   ```bash
   pnpm test-generation-metric
   ```

2. Run the optimization:
   ```bash
   pnpm optimize-generation
   ```

   This will:
   - Use the generation dataset to train the optimizer
   - Test each generated code sample for compilation
   - Save optimized demonstrations to `optimized-generation-demos.json`
   - Log progress and final scores

3. Apply the optimized demos:
   - Uncomment the demo loading code in `generation.program.ts`
   - The optimized demos will be automatically loaded on next run

### Expected Results

- **Target Score**: 0.5 (50% compilation success rate)
- **Duration**: 1-5 minutes per trial (8 trials total)
- **Cost**: < $1.0 with token limit of 300K

### Metrics

The optimizer uses a weighted scoring system:
- **50%** - Code compilation success
- **30%** - Presence of code when expected
- **20%** - Following response guidelines

### Troubleshooting

1. **Compilation timeouts**: Increase timeout in `checkCompilation()` function
2. **Low scores**: Add more diverse examples to the dataset
3. **High costs**: Reduce `numTrials` in optimizer options
4. **Scarb not found**: Ensure Scarb is in PATH

## Dataset Guidelines

When adding examples to `generation.dataset.ts`:
- Include diverse query types (simple functions, contracts, error handling)
- Provide realistic context (simulated RAG output)
- Ensure expected answers compile successfully
- Include non-Cairo queries to test rejection handling

## Future Improvements

- Add semantic correctness checks beyond compilation
- Integrate Starklings exercises for comprehensive testing
- Support for multi-file projects
- Execution testing for generated contracts