#!/usr/bin/env python3
"""Starklings evaluation script for testing Cairo code generation.

This script evaluates the Cairo Coder's ability to solve Starklings exercises
by generating solutions and testing if they compile successfully.
"""

import asyncio
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

import click
import structlog

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from starklings_evaluation.evaluator import StarklingsEvaluator
from starklings_evaluation.models import ConsolidatedReport
from starklings_evaluation.report_generator import ReportGenerator

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.dev.ConsoleRenderer(colors=True),
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger(__name__)


@click.command()
@click.option("--runs", "-r", type=int, default=1, help="Number of evaluation runs to perform")
@click.option("--category", "-c", type=str, default=None, help="Filter exercises by category")
@click.option(
    "--output-dir",
    "-o",
    type=click.Path(path_type=Path),
    default="./starklings_results",
    help="Output directory for results",
)
@click.option(
    "--api-endpoint",
    "-a",
    type=str,
    default="http://localhost:3001",
    help="Cairo Coder API endpoint",
)
@click.option("--model", "-m", type=str, default="cairo-coder", help="Model name to use")
@click.option(
    "--starklings-path",
    "-s",
    type=click.Path(path_type=Path),
    default="./starklings-cairo1",
    help="Path to Starklings repository",
)
@click.option("--max-concurrent", type=int, default=5, help="Maximum concurrent API calls")
@click.option("--timeout", type=int, default=120, help="API timeout in seconds")
@click.option("--verbose", "-v", is_flag=True, help="Enable verbose logging")
def main(
    runs: int,
    category: str,
    output_dir: Path,
    api_endpoint: str,
    model: str,
    starklings_path: Path,
    max_concurrent: int,
    timeout: int,
    verbose: bool,
):
    """Evaluate Cairo Coder on Starklings exercises."""
    logger.info(
        "Starting Starklings evaluation",
        runs=runs,
        category=category,
        api_endpoint=api_endpoint,
        model=model,
    )

    # Set logging level
    if verbose:
        structlog.configure(
            wrapper_class=structlog.stdlib.BoundLogger,
            logger_factory=structlog.stdlib.LoggerFactory(),
            cache_logger_on_first_use=True,
        )
        import logging

        logging.basicConfig(
            format="%(message)s",
            stream=sys.stdout,
            level=logging.DEBUG,
        )

    logger.info(
        "Starting Starklings evaluation",
        runs=runs,
        category=category,
        api_endpoint=api_endpoint,
        model=model,
    )

    # Run evaluation
    asyncio.run(
        run_evaluation(
            runs=runs,
            category=category,
            output_dir=output_dir,
            api_endpoint=api_endpoint,
            model=model,
            starklings_path=starklings_path,
            max_concurrent=max_concurrent,
            timeout=timeout,
        )
    )


async def run_evaluation(
    runs: int,
    category: str,
    output_dir: Path,
    api_endpoint: str,
    model: str,
    starklings_path: Path,
    max_concurrent: int,
    timeout: int,
):
    """Run the evaluation process."""

    # Create output directory
    output_dir = Path(output_dir)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    run_output_dir = output_dir / f"run_{timestamp}"
    run_output_dir.mkdir(parents=True, exist_ok=True)

    # Initialize evaluator
    evaluator = StarklingsEvaluator(
        api_endpoint=api_endpoint,
        model=model,
        starklings_path=str(starklings_path),
        timeout=timeout,
    )

    # Setup Starklings
    if not evaluator.setup():
        logger.error("Failed to setup Starklings")
        sys.exit(1)

    # Run evaluations
    all_runs = []
    report_gen = ReportGenerator()

    for run_id in range(1, runs + 1):
        logger.info(f"Starting run {run_id}/{runs}")

        try:
            # Run evaluation
            run_result = await evaluator.run_evaluation(
                run_id=run_id,
                output_dir=run_output_dir,
                category_filter=category,
                max_concurrent=max_concurrent,
            )

            # Save individual run report
            report_gen.save_run_report(run_result, run_output_dir)
            all_runs.append(run_result)

            # Print progress
            logger.info(
                f"Completed run {run_id}/{runs}",
                success_rate=f"{run_result.overall_success_rate:.2%}",
                successful=run_result.successful_exercises,
                total=run_result.total_exercises,
            )

        except Exception as e:
            logger.error(f"Failed run {run_id}", error=str(e))
            import traceback

            traceback.print_exc()

    # Generate consolidated report if multiple runs
    if len(all_runs) > 0:
        consolidated = ConsolidatedReport(runs=all_runs)

        # Save reports
        report_gen.save_consolidated_report(consolidated, run_output_dir)
        report_gen.generate_summary_report(consolidated, run_output_dir)

        # Print summary
        report_gen.print_summary(consolidated)

        logger.info(
            "Evaluation complete",
            output_dir=str(run_output_dir),
            total_runs=len(all_runs),
            overall_success_rate=f"{consolidated.overall_success_rate:.2%}",
        )

    else:
        logger.error("No successful runs completed")
        sys.exit(1)
    # Clear starklings-cairo1 directory
    shutil.rmtree(starklings_path)


if __name__ == "__main__":
    main()
