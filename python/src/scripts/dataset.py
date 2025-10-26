#!/usr/bin/env python3
"""Dataset CLI for Cairo Coder.

This module provides commands for extracting, generating, and analyzing datasets
for use with Cairo Coder.
"""

import asyncio
import json
from pathlib import Path

import click
import typer
from typer.core import TyperGroup

from cairo_coder_tools.datasets.analysis import analyze_dataset
from cairo_coder_tools.datasets.extractors import (
    extract_cairocoder_pairs,
    extract_starknet_agent_pairs,
)


class HelpOnInvalidCommand(TyperGroup):
    """Custom typer group that shows help on invalid commands."""

    def get_command(self, ctx, cmd_name):  # type: ignore[override]
        cmd = super().get_command(ctx, cmd_name)
        if cmd is None:
            # Show a friendly message and the group's help, then exit with code 2
            typer.secho(f"Error: Unknown command '{cmd_name}'.", fg=typer.colors.RED, err=True)
            typer.echo()
            typer.echo(ctx.get_help())
            # Use Click's normal control flow to avoid rich tracebacks
            raise click.exceptions.Exit(2)
        return cmd


app = typer.Typer(
    cls=HelpOnInvalidCommand,
    help="Cairo Coder Datasets CLI",
    no_args_is_help=True,
)

extract_app = typer.Typer(
    cls=HelpOnInvalidCommand,
    help="Extract QA pairs from LangSmith JSONL exports",
    no_args_is_help=True,
)
generate_app = typer.Typer(
    cls=HelpOnInvalidCommand,
    help="Generate synthetic datasets (no input required)",
    no_args_is_help=True,
)

app.add_typer(extract_app, name="extract")
app.add_typer(generate_app, name="generate")


@extract_app.command("starknet-agent")
def extract_starknet_agent(
    input: Path = typer.Option(
        ...,  # required
        "--input",
        help=(
            "Path to a LangSmith JSONL export. Each object should contain\n"
            "`inputs.chat_history` as a list alternating HumanMessage and AIMessage.\n"
            "Supports both strict JSONL and concatenated pretty-printed JSON objects."
        ),
    ),
    output: Path = typer.Option(
        Path("starknet_agentqa_pairs.json"),
        "--output",
        help="Where to write the extracted [{query, answer}] JSON array.",
    ),
    query_only: bool = typer.Option(
        False,
        "--query",
        help="Write only queries as a JSON array instead of [{query, answer}] objects.",
    ),
) -> None:
    """Extract de-duplicated QA pairs from a Starknet Agent chat dataset."""
    pairs = extract_starknet_agent_pairs(str(input))

    # De-duplicate pairs by (query, answer) while preserving order
    seen_pairs: set[tuple[str, str]] = set()
    unique_pairs: list[dict] = []
    for p in pairs:
        q = p.get("query")
        a = p.get("answer")
        key = (q, a)
        if key not in seen_pairs:
            seen_pairs.add(key)
            unique_pairs.append(p)

    if query_only:
        # De-duplicate queries while preserving order
        seen_queries: set[str] = set()
        queries_only: list[str] = []
        for p in unique_pairs:
            q = p.get("query")
            if q not in seen_queries:
                seen_queries.add(q)
                queries_only.append(q)
        data_to_write = queries_only
    else:
        data_to_write = unique_pairs

    output = Path(output).expanduser()
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w", encoding="utf-8") as f:
        json.dump(data_to_write, f, ensure_ascii=False, indent=2)

    if query_only:
        typer.echo(f"Wrote {len(data_to_write)} queries to {output}")
    else:
        typer.echo(f"Wrote {len(data_to_write)} pairs to {output}")


@extract_app.command("cairo-coder")
def extract_cairo_coder(
    input: Path = typer.Option(
        ...,  # required
        "--input",
        help=(
            "Path to a LangSmith JSONL export where each record has\n"
            "`outputs: {\"output\": \"Prediction(...\"}`. Use --only-mcp to keep\n"
            "Prediction(...) without reasoning=, or --only-generated-answers to keep\n"
            "outputs that contain reasoning=. If neither flag is provided, extracts\n"
            "all matching records. Supports JSONL and concatenated JSON."
        ),
    ),
    output: Path = typer.Option(
        Path("qa_pairs_cairo_coder.json"),
        "--output",
        help="Where to write the extracted [{query, answer}] JSON array.",
    ),
    only_mcp: bool = typer.Option(
        False,
        "--only-mcp",
        help=(
            "Extract traces with a single `outputs.output` string that looks like\n"
            "`Prediction(answer=...)` and does NOT contain `reasoning=`."
        ),
    ),
    only_generated_answers: bool = typer.Option(
        False,
        "--only-generated-answers",
        help=(
            "Extract traces with a single `outputs.output` string that DOES contain\n"
            "`reasoning=`."
        ),
    ),
    query_only: bool = typer.Option(
        False,
        "--query",
        help="Write only queries as a JSON array instead of [{query, answer}] objects.",
    ),
) -> None:
    """Extract QA pairs from a Cairo-Coder LangSmith export.

    If neither filtering flag is used, extracts all matching records.
    """
    if only_mcp and only_generated_answers:
        raise typer.BadParameter("Choose at most one of --only-mcp or --only-generated-answers")

    pairs, stats = extract_cairocoder_pairs(
        str(input), only_mcp=only_mcp, only_generated_answers=only_generated_answers
    )

    # De-duplicate pairs by (query, answer) while preserving order
    seen_pairs: set[tuple[str, str]] = set()
    unique_pairs: list[dict] = []
    for p in pairs:
        q = p.get("query")
        a = p.get("answer")
        key = (q, a)
        if key not in seen_pairs:
            seen_pairs.add(key)
            unique_pairs.append(p)

    if query_only:
        # De-duplicate queries while preserving order
        seen_queries: set[str] = set()
        queries_only: list[str] = []
        for p in unique_pairs:
            q = p.get("query")
            if q not in seen_queries:
                seen_queries.add(q)
                queries_only.append(q)
        data_to_write = queries_only
    else:
        data_to_write = unique_pairs

    output = Path(output).expanduser()
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w", encoding="utf-8") as f:
        json.dump(data_to_write, f, ensure_ascii=False, indent=2)

    typer.echo(
        json.dumps(
            {
                "input": str(Path(input).expanduser()),
                "output": str(output),
                "wrote": len(data_to_write),
                "format": "queries" if query_only else "pairs",
                **stats,
            },
            indent=2,
        )
    )


@generate_app.command("starklings")
def generate_starklings(
    output: Path = typer.Option(
        Path("optimizers/datasets/starklings_generation_dataset.json"),
        "--output",
        help=(
            "Output path for the generated dataset. No input is required; the command\n"
            "ensures Starklings is available locally, parses exercises from info.toml,\n"
            "and produces entries with {query, reference} code."
        ),
    ),
) -> None:
    """Generate a dataset of Starklings exercises and solutions."""
    # Lazy import to avoid loading heavy deps unless needed
    from cairo_coder.optimizers.generation.generate_starklings_dataset import (
        generate_dataset,
        save_dataset,
    )

    examples = asyncio.run(generate_dataset())
    output = Path(output).expanduser()
    output.parent.mkdir(parents=True, exist_ok=True)
    save_dataset(examples, str(output))
    typer.echo(f"Generated {len(examples)} examples to {output}")


@app.command("analyze")
def analyze(
    input: Path = typer.Option(
        Path("qa_pairs.json"),
        "--input",
        "-i",
        help="Path to the input dataset JSON file",
    ),
    output: Path = typer.Option(
        Path("analysis.json"),
        "--output",
        "-o",
        help="Path to save the analysis results",
    ),
    model: str = typer.Option(
        "openrouter/x-ai/grok-4-fast:free",
        "--model",
        "-m",
        help="Language model to use for analysis",
    ),
    max_tokens: int = typer.Option(
        30000,
        "--max-tokens",
        help="Maximum tokens for the LLM response",
    ),
) -> None:
    """Analyze a dataset of question-answer pairs using an LLM.

    This command uses an LLM to analyze the dataset and provide insights about:
    - Languages used in queries
    - Common topics and question categories
    - Overall quality and patterns in the dataset
    """
    typer.echo(f"Analyzing dataset from {input}...")
    typer.echo(f"Using model: {model}")

    try:
        result = analyze_dataset(
            dataset_path=input,
            output_path=output,
            lm_model=model,
            max_tokens=max_tokens,
        )

        typer.echo(typer.style("✓ Analysis complete!", fg=typer.colors.GREEN))
        typer.echo(f"Results saved to: {output}")
        typer.echo(f"\nFound {len(result.get('languages', []))} languages")
        typer.echo(f"Identified {len(result.get('topics', []))} topic categories")

    except Exception as e:
        import traceback

        traceback.print_exc()
        typer.echo(typer.style(f"✗ Error: {str(e)}", fg=typer.colors.RED), err=True)
        raise typer.Exit(code=1) from e


if __name__ == "__main__":
    app()
