#!/usr/bin/env python3
import typer

app = typer.Typer(help="Cairo Coder ingestion utilities (legacy summarizer removed).")


@app.command()
def info() -> None:
    """Explain the removal of the legacy summarizer pipeline."""
    typer.echo("The legacy DSPy summarizer pipeline has been removed.")
    typer.echo("Use the TypeScript ingesters to generate the corelib API index.")


if __name__ == "__main__":
    app()
