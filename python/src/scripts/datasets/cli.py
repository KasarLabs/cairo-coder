from __future__ import annotations

import asyncio
import json
from pathlib import Path

import click
import typer
from typer.core import TyperGroup

from cairo_coder.datasets.extractors import (
    extract_cairocoder_pairs,
    extract_starknet_agent_pairs,
)


class HelpOnInvalidCommand(TyperGroup):
    def get_command(self, ctx, cmd_name):  # type: ignore[override]
        cmd = super().get_command(ctx, cmd_name)
        if cmd is None:
            typer.secho(f"Error: Unknown command '{cmd_name}'.", fg=typer.colors.RED, err=True)
            typer.echo()
            typer.echo(ctx.get_help())
            ctx.exit(2)
        return cmd

    def main(self, *args, **kwargs):  # type: ignore[override]
        # Ensure we handle errors ourselves to show full help
        kwargs.setdefault("standalone_mode", False)
        try:
            return super().main(*args, **kwargs)
        except click.exceptions.UsageError as e:  # missing option, bad invocation, etc.
            ctx = e.ctx or click.Context(self)
            # Show the specific command help if available
            typer.secho(f"Error: {e.format_message().strip()}", fg=typer.colors.RED, err=True)
            typer.echo()
            typer.echo(ctx.get_help())
            ctx.exit(2)

    def __call__(self, *args, **kwargs):  # type: ignore[override]
        # Force standalone_mode=False so exceptions propagate
        kwargs["standalone_mode"] = False
        try:
            return super().__call__(*args, **kwargs)
        except click.exceptions.UsageError as e:
            ctx = e.ctx or click.Context(self)
            typer.secho(f"Error: {e.format_message().strip()}", fg=typer.colors.RED, err=True)
            typer.echo()
            typer.echo(ctx.get_help())
            ctx.exit(2)


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
) -> None:
    """Extract de-duplicated QA pairs from a Starknet Agent chat dataset."""
    pairs = extract_starknet_agent_pairs(str(input))

    output = Path(output).expanduser()
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w", encoding="utf-8") as f:
        json.dump(pairs, f, ensure_ascii=False, indent=2)

    typer.echo(f"Wrote {len(pairs)} pairs to {output}")


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
) -> None:
    """Extract QA pairs from a Cairo-Coder LangSmith export with `outputs.output`.

    If neither filtering flag is used, extracts all matching records.
    """
    if only_mcp and only_generated_answers:
        raise typer.BadParameter("Choose at most one of --only-mcp or --only-generated-answers")

    pairs, stats = extract_cairocoder_pairs(
        str(input), only_mcp=only_mcp, only_generated_answers=only_generated_answers
    )

    output = Path(output).expanduser()
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w", encoding="utf-8") as f:
        json.dump(pairs, f, ensure_ascii=False, indent=2)

    typer.echo(
        json.dumps(
            {
                "input": str(Path(input).expanduser()),
                "output": str(output),
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


if __name__ == "__main__":
    app()
