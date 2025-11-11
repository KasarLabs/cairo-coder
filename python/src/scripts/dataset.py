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

from cairo_coder_tools.datasets.extractors import (
    extract_cairocoder_pairs,
)
from cairo_coder_tools.datasets.migrate_langsmith import migrate_runs


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
migrate_app = typer.Typer(
    cls=HelpOnInvalidCommand,
    help="Migrate historical data to PostgreSQL database",
    no_args_is_help=True,
)

app.add_typer(extract_app, name="extract")
app.add_typer(generate_app, name="generate")
app.add_typer(migrate_app, name="migrate")




@extract_app.command("cairo-coder")
def extract_cairo_coder(
    output: Path = typer.Option(
        Path("langsmith_human_queries_last2w.json"),
        "--output",
        help="Where to write the extracted runs with queries and outputs.",
    ),
    days: int = typer.Option(
        14,
        "--days",
        help="Number of days to look back for runs (default: 14)",
    ),
    names: list[str] = typer.Option(
        ["RagPipeline", "RagPipelineStreaming"],
        "--names",
        help="Filter runs by names (default: RagPipeline, RagPipelineStreaming)",
    ),
    project: str = typer.Option(
        None,
        "--project",
        help="LangSmith project name (default: from LANGSMITH_PROJECT env var or 'default')",
    ),
) -> None:
    """Extract query/output pairs from Cairo-Coder LangSmith runs.

    This command connects to LangSmith API and fetches runs from the specified
    project, then deduplicates and formats them as runs with queries and outputs.
    """
    # Call the new extractor that connects to LangSmith
    runs, stats = extract_cairocoder_pairs(
        days_back=days,
        run_name_filters=names,
        project_name=project,
    )

    # Prepare output in the expected format
    output_data = {"runs": runs}

    output = Path(output).expanduser()
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    total_queries = sum(len(run["queries"]) for run in runs)

    typer.echo(
        json.dumps(
            {
                "output": str(output),
                "runs": len(runs),
                "total_queries": total_queries,
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


@migrate_app.command("langsmith")
def migrate_langsmith(
    source: Path | None = typer.Option(
        None,
        "--source",
        help="JSON file with LangSmith runs (if not provided, fetches from API)",
    ),
    days: int = typer.Option(
        14,
        "--days",
        help="Number of days to look back for runs (only used when fetching from API)",
    ),
    names: list[str] = typer.Option(
        ["RagPipeline", "RagPipelineStreaming"],
        "--names",
        help="Filter runs by names (only used when fetching from API)",
    ),
    project: str = typer.Option(
        None,
        "--project",
        help="LangSmith project name (only used when fetching from API)",
    ),
) -> None:
    """
    Migrate LangSmith runs to PostgreSQL database.

    This command can either:
    1. Load runs from a JSON file (--source)
    2. Fetch runs from LangSmith API (if no --source provided)

    The migration uses upsert behavior - existing records will be updated
    with new data from the source, allowing you to refresh migrated data.
    """
    # Determine data source
    if source:
        # Load from file
        source = Path(source).expanduser()
        if not source.exists():
            typer.secho(f"Error: File not found: {source}", fg=typer.colors.RED, err=True)
            raise typer.Exit(1)

        with source.open("r", encoding="utf-8") as f:
            data = json.load(f)

        runs = data.get("runs", [])
        typer.echo(f"Loaded {len(runs)} runs from {source}")
    else:
        # Fetch from LangSmith API
        typer.echo("Fetching runs from LangSmith API...")
        runs, stats = extract_cairocoder_pairs(
            days_back=days,
            run_name_filters=names,
            project_name=project,
        )
        typer.echo(
            f"Fetched {len(runs)} runs (matched: {stats['matched']}, "
            f"skipped: {stats['skipped']}, total: {stats['total']})"
        )

    if not runs:
        typer.echo("No runs to migrate.")
        return

    # Migrate runs to database
    typer.echo("Migrating runs to database...")
    migration_stats = asyncio.run(migrate_runs(runs))

    # Display results
    typer.echo(
        json.dumps(
            {
                "status": "completed",
                **migration_stats,
            },
            indent=2,
        )
    )

    if migration_stats["failed"] > 0:
        typer.secho(
            f"Warning: {migration_stats['failed']} runs failed to migrate. Check logs for details.",
            fg=typer.colors.YELLOW,
        )


# Analyze command removed - analyze_dataset function doesn't exist in analysis.py
# TODO: Re-implement or remove if needed


if __name__ == "__main__":
    app()
