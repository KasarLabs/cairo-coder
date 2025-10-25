#!/usr/bin/env python3
"""
Extract human queries from LangSmith runs and export to JSON.

Retrieves runs from LangSmith within a specified time window, extracts human
messages from various LangChain message formats, and outputs deduplicated
queries grouped by run.

Environment variables:
    LANGSMITH_API_KEY: Required for authentication
    LANGSMITH_PROJECT: Optional project name (default: "default")

Example usage:
    python extract_langsmith.py
    python extract_langsmith.py --days 7 --output queries.json
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


class MessageType(Enum):
    """Supported message types in LangChain format."""
    HUMAN = "human"
    HUMANMESSAGE = "humanmessage"
    CONSTRUCTOR = "constructor"


@dataclass
class RunQueries:
    """Container for queries extracted from a single run."""
    run_id: str
    queries: list[str]

    def to_dict(self) -> dict[str, Any]:
        return {"run_id": str(self.run_id), "queries": self.queries}


@dataclass
class Config:
    """Script configuration."""
    output_path: Path
    days_back: int
    run_name_filter: str
    project_name: str

    @classmethod
    def from_args(cls, args: argparse.Namespace) -> Config:
        project_name = os.getenv("LANGSMITH_PROJECT", "default")
        return cls(
            output_path=Path(args.output),
            days_back=args.days,
            run_name_filter=args.name,
            project_name=project_name,
        )


class HumanMessageExtractor:
    """Extracts human messages from LangChain message structures."""

    HUMAN_MESSAGE_KEYS = ["chat_history", "messages", "inputs", "input"]

    @staticmethod
    def _is_human_message_by_id(message: dict[str, Any]) -> bool:
        """Check if message is human type based on ID field."""
        msg_id = message["id"]
        if isinstance(msg_id, list) and msg_id:
            return str(msg_id[-1]).lower() == MessageType.HUMANMESSAGE.value
        return False

    @staticmethod
    def _is_human_message_by_type(message: dict[str, Any]) -> bool:
        """Check if message is human type based on type field."""
        msg_type = str(message["type"]).lower()
        return msg_type in {MessageType.HUMAN.value, MessageType.HUMANMESSAGE.value}

    def _process_message_object(self, obj: Any) -> list[str]:
        """Process a single message object and extract human content."""
        # Check if this is a human message
        is_human = (
            self._is_human_message_by_id(obj) or
            self._is_human_message_by_type(obj)
        )
        if not is_human:
            return []

        if "kwargs" not in obj or "content" not in obj["kwargs"]:
            raise ValueError(f"Expected kwargs and content in message object: {obj}")

        content = obj["kwargs"]["content"]
        return [content] if content else []

    def _process_value(self, value: Any) -> list[str]:
        if not isinstance(value, list):
            raise ValueError(f"Expected list, got {type(value)}: {value}")
        results = []
        for item in value:
            results.extend(self._process_message_object(item))
        return results

    def extract(self, inputs: dict[str, Any]) -> list[str]:
        """
        Extract human messages from LangChain inputs.

        Args:
            inputs: Dictionary containing message data in various formats

        Returns:
            List of unique human message strings in order of appearance
        """
        results = []

        for key in self.HUMAN_MESSAGE_KEYS:
            if key not in inputs:
                continue

            results.extend(self._process_value(inputs[key]))

        # Deduplicate while preserving order
        seen = set()
        unique_results = []
        for query in results:
            if query not in seen:
                unique_results.append(query)
                seen.add(query)

        return unique_results


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
        self.extractor = HumanMessageExtractor()
        self.deduplicator = RunDeduplicator()

    def _get_time_range(self) -> tuple[datetime, datetime]:
        """Calculate start and end time for query."""
        end_time = datetime.now(timezone.utc)
        start_time = end_time - timedelta(days=self.config.days_back)
        return start_time, end_time

    def fetch_runs(self) -> list[RunQueries]:
        start_time, end_time = self._get_time_range()

        query_params = {
            "start_time": start_time,
            "end_time": end_time,
            "filter": f'eq(name, "{self.config.run_name_filter}")',
            "project_name": self.config.project_name,
        }

        runs = []
        for run in self.client.list_runs(**query_params):
            run_data = run.dict()
            inputs = run_data["inputs"]

            queries = self.extractor.extract(inputs)
            if queries:
                runs.append(RunQueries(
                    run_id=run_data["id"],
                    queries=queries,
                ))

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
        "--name",
        default="RunnableSequence",
        help="Filter runs by name (default: %(default)s)",
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
