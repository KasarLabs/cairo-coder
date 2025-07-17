# Starklings Evaluation Script

A Python script for evaluating Cairo Coder's ability to solve Starklings exercises. This script automates the process of testing code generation quality by having the Cairo Coder solve programming exercises and verifying compilation.

## Features

- **Automated Exercise Evaluation**: Processes all Starklings exercises automatically
- **Category Filtering**: Evaluate specific exercise categories
- **Multiple Runs**: Support for multiple evaluation runs to measure consistency
- **Comprehensive Reports**: JSON and Markdown reports with detailed metrics
- **Concurrent Processing**: Efficient parallel API calls with rate limiting
- **Debug Output**: Saves generated code and errors for analysis
- **Flexible Configuration**: Environment variables and CLI options

## Installation

The script uses existing Cairo Coder dependencies. Ensure you have:

1. Cairo Coder backend running (`pnpm dev` in the main project)
2. Python environment with required packages
3. Scarb installed for Cairo compilation

## Usage

### Basic Usage

```bash
# Run evaluation with default settings
uv run starklings_evaluate

# Run 5 evaluation runs
uv run starklings_evaluate --runs 5

# Evaluate only "intro" category
uv run starklings_evaluate --category intro

# Verbose output
uv run starklings_evaluate --verbose
```

### CLI Options

```
Options:
  -r, --runs INTEGER          Number of evaluation runs to perform [default: 1]
  -c, --category TEXT         Filter exercises by category
  -o, --output-dir PATH       Output directory for results [default: ./starklings_results]
  -a, --api-endpoint TEXT     Cairo Coder API endpoint [default: http://localhost:3001]
  -m, --model TEXT            Model name to use [default: cairo-coder]
  -s, --starklings-path PATH  Path to Starklings repository [default: ./starklings-cairo1]
  --max-concurrent INTEGER    Maximum concurrent API calls [default: 5]
  --timeout INTEGER           API timeout in seconds [default: 120]
  -v, --verbose               Enable verbose logging
  --help                      Show this message and exit.
```

## Output Structure

```
starklings_results/
└── run_20240117_143022/
    ├── starklings_run_1_20240117_143022.json    # Individual run report
    ├── starklings_run_2_20240117_143122.json    # (if multiple runs)
    ├── starklings_consolidated_report.json       # Combined results
    ├── starklings_summary.md                     # Human-readable summary
    └── debug/
        ├── intro1_generated.cairo                # Generated solutions
        ├── intro1_error.txt                      # Errors (if any)
        └── ...
```

## Report Format

### Consolidated Report (JSON)
```json
{
  "total_runs": 3,
  "overall_success_rate": 0.85,
  "timestamp": "2024-01-17T14:30:22",
  "exercise_summary": {
    "intro": {
      "intro1": {
        "success_count": 3,
        "total_runs": 3,
        "success_rate": 1.0
      }
    }
  },
  "runs": [...]
}
```

### Summary Report (Markdown)
- Overall success rates
- Category breakdowns
- Exercise-level statistics
- Individual run details

## Implementation Details

### Architecture

```
starklings_evaluation/
├── __init__.py
├── models.py           # Data structures
├── api_client.py       # Cairo Coder API client
├── evaluator.py        # Core evaluation logic
├── report_generator.py # Report generation
└── config.py           # Configuration handling
```

### Key Components

1. **StarklingsEvaluator**: Main evaluation orchestrator
2. **CairoCoderAPIClient**: Async HTTP client for API calls
3. **ReportGenerator**: JSON and Markdown report generation
4. **Data Models**: Type-safe result structures

### Integration Points

- Uses existing `starklings_helper.py` for exercise parsing
- Leverages `utils.py` for code extraction and compilation
- Compatible with existing runner-crate infrastructure

## Comparison with Original Script

This Python implementation maintains compatibility with the original JavaScript version while adding:

- Better error handling and recovery
- Structured data models with type safety
- Async/concurrent processing
- More detailed debug output
- Flexible configuration options

## Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Ensure Cairo Coder backend is running
   - Check API endpoint configuration

2. **Starklings Repository Not Found**
   - Script will automatically clone the repository
   - Ensure git is installed and accessible

3. **Compilation Failures**
   - Check Scarb installation
   - Verify runner-crate fixtures are present

### Debug Mode

Use `--verbose` flag for detailed logging:
```bash
uv run starklings_evaluate --verbose
```

Check debug files in output directory for:
- Generated code for each exercise
- Detailed error messages
- API response data
