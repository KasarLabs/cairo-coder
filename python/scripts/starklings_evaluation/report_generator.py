"""Report generation utilities for Starklings evaluation."""

import json
from datetime import datetime, timezone
from pathlib import Path

import structlog

from .models import ConsolidatedReport, EvaluationRun

logger = structlog.get_logger(__name__)


class ReportGenerator:
    """Generates evaluation reports in various formats."""

    @staticmethod
    def save_run_report(
        run: EvaluationRun, output_dir: Path, filename_prefix: str = "starklings_run"
    ) -> Path:
        """Save individual run report.

        Args:
            run: Evaluation run results
            output_dir: Output directory
            filename_prefix: Prefix for filename

        Returns:
            Path to saved report
        """
        output_dir.mkdir(parents=True, exist_ok=True)

        # Create filename with timestamp
        timestamp = run.timestamp.strftime("%Y%m%d_%H%M%S")
        filename = f"{filename_prefix}_{run.run_id}_{timestamp}.json"
        filepath = output_dir / filename

        # Save report
        with open(filepath, "w") as f:
            json.dump(run.to_dict(), f, indent=2)

        logger.info("Saved run report", path=str(filepath))
        return filepath

    @staticmethod
    def save_consolidated_report(
        consolidated: ConsolidatedReport,
        output_dir: Path,
        filename: str = "starklings_consolidated_report.json",
    ) -> Path:
        """Save consolidated report.

        Args:
            consolidated: Consolidated results
            output_dir: Output directory
            filename: Report filename

        Returns:
            Path to saved report
        """
        output_dir.mkdir(parents=True, exist_ok=True)
        filepath = output_dir / filename

        # Save report
        with open(filepath, "w") as f:
            json.dump(consolidated.to_dict(), f, indent=2)

        logger.info("Saved consolidated report", path=str(filepath))
        return filepath

    @staticmethod
    def generate_summary_report(
        consolidated: ConsolidatedReport, output_dir: Path, filename: str = "starklings_summary.md"
    ) -> Path:
        """Generate human-readable summary report.

        Args:
            consolidated: Consolidated results
            output_dir: Output directory
            filename: Report filename

        Returns:
            Path to saved report
        """
        output_dir.mkdir(parents=True, exist_ok=True)
        filepath = output_dir / filename

        # Generate markdown content
        content = ["# Starklings Evaluation Summary\n"]
        content.append(f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')}\n")
        content.append(f"Total Runs: {consolidated.total_runs}\n")
        content.append(f"Overall Success Rate: {consolidated.overall_success_rate:.2%}\n")

        # Exercise summary by category
        content.append("\n## Exercise Results by Category\n")

        exercise_summary = consolidated.to_dict()["exercise_summary"]

        for category, exercises in sorted(exercise_summary.items()):
            content.append(f"\n### {category}\n")
            content.append("| Exercise | Success Rate | Successful Runs | Total Runs |\n")
            content.append("|----------|--------------|-----------------|------------|\n")

            for ex_name, stats in sorted(exercises.items()):
                success_rate = stats["success_rate"]
                success_count = stats["success_count"]
                total_runs = stats["total_runs"]
                content.append(
                    f"| {ex_name} | {success_rate:.2%} | {success_count} | {total_runs} |\n"
                )

        # Run details
        if consolidated.runs:
            content.append("\n## Individual Run Results\n")

            for run in consolidated.runs:
                run_dict = run.to_dict()
                content.append(f"\n### Run {run.run_id}")
                content.append(f" - {run.timestamp.strftime('%Y-%m-%d %H:%M:%S')}\n")
                content.append(f"- Success Rate: {run_dict['overall_success_rate']:.2%}\n")
                content.append(f"- Total Time: {run_dict['total_time']:.2f}s\n")
                content.append(
                    f"- Exercises: {run_dict['successful_exercises']}/{run_dict['total_exercises']}\n"
                )

        # Write report
        with open(filepath, "w") as f:
            f.writelines(content)

        logger.info("Generated summary report", path=str(filepath))
        return filepath

    @staticmethod
    def print_summary(consolidated: ConsolidatedReport) -> None:
        """Print summary to console.

        Args:
            consolidated: Consolidated results
        """
        print("\n" + "=" * 60)
        print("STARKLINGS EVALUATION SUMMARY")
        print("=" * 60)
        print(f"Total Runs: {consolidated.total_runs}")
        print(f"Overall Success Rate: {consolidated.overall_success_rate:.2%}")

        # Category breakdown
        if consolidated.runs:
            print("\nCategory Breakdown (Average):")

            # Calculate average success rates by category
            category_totals = {}
            for run in consolidated.runs:
                for cat_name, category in run.categories.items():
                    if cat_name not in category_totals:
                        category_totals[cat_name] = {"success": 0, "total": 0}
                    category_totals[cat_name]["success"] += category.successful_exercises
                    category_totals[cat_name]["total"] += category.total_exercises

            for cat_name, totals in sorted(category_totals.items()):
                if totals["total"] > 0:
                    rate = totals["success"] / totals["total"]
                    print(f"  {cat_name}: {rate:.2%} ({totals['success']}/{totals['total']})")

        print("=" * 60 + "\n")
