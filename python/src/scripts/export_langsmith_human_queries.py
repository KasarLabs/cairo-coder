"""
Extract human queries from LangSmith runs and export to JSON.

Retrieves runs from LangSmith within a specified time window, extracts human
messages from various LangChain message formats, and outputs deduplicated
queries grouped by run.

Environment variables:
    LANGSMITH_API_KEY: Required for authentication
    LANGSMITH_PROJECT: Optional project name (default: "default")

Example usage:
    uv run export_langsmith_human_queries.py
    uv run export_langsmith_human_queries.py --days 7 --output queries.json
"""

from __future__ import annotations

import argparse
import json
import os
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from enum import Enum
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from langsmith import Client

load_dotenv("../.env")


@dataclass
class RunQueries:
    """Container for queries extracted from a single run."""
    run_id: str
    queries: list[str]
    mcp_mode: bool

    def to_dict(self) -> dict[str, Any]:
        return {"run_id": self.run_id, "queries": self.queries, "mcp_mode": self.mcp_mode}


@dataclass
class Config:
    """Script configuration."""
    output_path: Path
    days_back: int
    run_name_filters: list[str]
    project_name: str

    @classmethod
    def from_args(cls, args: argparse.Namespace) -> Config:
        project_name = os.getenv("LANGSMITH_PROJECT", "default")
        return cls(
            output_path=Path(args.output),
            days_back=args.days,
            run_name_filters=args.names,
            project_name=project_name,
        )


class RunDeduplicator:
    """Removes runs whose queries are prefixes of other runs."""

    def deduplicate(self, runs: list[RunQueries]) -> list[RunQueries]:
        """
        Remove runs that are prefixes of longer runs.

        Args:
            runs: List of run queries to deduplicate

        Returns:
            Filtered list with prefix runs removed
        """
        if not runs:
            return []

        # Sort by query count (longest first) while tracking original indices
        indexed_runs = list(enumerate(runs))
        indexed_runs.sort(key=lambda x: len(x[1].queries), reverse=True)

        kept_queries = []
        keep_indices = set()

        for idx, run in indexed_runs:
            # Skip if this run's queries are a prefix of any kept run
            if any(run.queries == kq[:len(run.queries)] for kq in kept_queries):
                continue

            keep_indices.add(idx)
            kept_queries.append(run.queries)

        # Restore original order
        return [run for idx, run in enumerate(runs) if idx in keep_indices]


class LangSmithExporter:
    """Exports human queries from LangSmith runs."""

    def __init__(self, config: Config):
        self.config = config
        self.client = Client()
        self.deduplicator = RunDeduplicator()

    def _get_time_range(self) -> tuple[datetime, datetime]:
        """Calculate start and end time for query."""
        end_time = datetime.now(timezone.utc)
        start_time = end_time - timedelta(days=self.config.days_back)
        return start_time, end_time

    def fetch_runs(self) -> list[RunQueries]:
        start_time, end_time = self._get_time_range()


        filter_clauses = [f'eq(name, "{name}")' for name in self.config.run_name_filters]
        query_params = {
            "start_time": start_time,
            "end_time": end_time,
            "filter": f'or({",".join(filter_clauses)})',
            "project_name": self.config.project_name,
        }

        runs = []
        all_runs = self.client.list_runs(**query_params)
        for run in all_runs:
            run_data = run.dict()
            inputs = run_data["inputs"]
            query = inputs["query"]
            chat_history = inputs["chat_history"]
            user_queries_in_history = [msg['content'] for msg in chat_history if msg["role"] == "user"]
            full_query = user_queries_in_history + [query]
            runs.append(RunQueries(run_id=str(run_data["id"]), queries=full_query, mcp_mode=inputs["mcp_mode"]))

        return runs

    def export(self) -> None:
        """Execute the full export pipeline and write results."""
        runs = self.fetch_runs()
        runs = self.deduplicator.deduplicate(runs)

        total_queries = sum(len(run.queries) for run in runs)

        output = {"runs": [run.to_dict() for run in runs]}

        self.config.output_path.write_text(
            json.dumps(output, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

        print(
            f"Exported {len(runs)} runs with {total_queries} queries "
            f"to {self.config.output_path}"
        )


def parse_arguments() -> argparse.Namespace:
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Export human queries from LangSmith runs to JSON",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )

    parser.add_argument(
        "--output",
        default="langsmith_human_queries_last2w.json",
        help="Output JSON file path (default: %(default)s)",
    )
    parser.add_argument(
        "--days",
        type=int,
        default=14,
        help="Number of days to look back (default: %(default)s)",
    )
    parser.add_argument(
        "--names",
        default=["RagPipeline", "RagPipelineStreaming"],
        nargs="+",
        help="Filter runs by names (default: %(default)s)",
    )

    return parser.parse_args()


def main() -> None:
    """Main entry point."""
    args = parse_arguments()
    config = Config.from_args(args)
    exporter = LangSmithExporter(config)
    exporter.export()


if __name__ == "__main__":
    main()
