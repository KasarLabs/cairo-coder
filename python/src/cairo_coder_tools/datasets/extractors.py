from __future__ import annotations

import json
import os
import re
from collections.abc import Iterator
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import jsonlines
from dotenv import load_dotenv
from langsmith import Client

# ------------------------------
# Generic JSONL/JSON stream utils
# ------------------------------

def _read_records_jsonl(path: str) -> Iterator[dict]:
    """Read objects using jsonlines, skipping invalid entries."""
    with jsonlines.open(os.path.expanduser(path), mode="r") as reader:
        for obj in reader.iter(skip_invalid=True):
            if isinstance(obj, dict):
                yield obj


def _read_records_json_stream(path: str) -> Iterator[dict]:
    """Fallback for files with concatenated pretty-printed JSON objects."""
    p = os.path.expanduser(path)
    with open(p, encoding="utf-8") as f:
        data = f.read()
    decoder = json.JSONDecoder()
    idx = 0
    n = len(data)
    while True:
        while idx < n and data[idx].isspace():
            idx += 1
        if idx >= n:
            break
        obj, end = decoder.raw_decode(data, idx)
        if isinstance(obj, dict):
            yield obj
        idx = end




# ------------------------------
# Cairo-Coder LangSmith extractor
# ------------------------------

# Regex patterns for extracting answer from Prediction output
ANSWER_RE_SQ = re.compile(r"answer\s*=\s*'((?:\\'|[^'])*)'", re.DOTALL)
ANSWER_RE_DQ = re.compile(r'answer\s*=\s*"((?:\\"|[^"])*)"', re.DOTALL)


def _extract_answer_from_prediction(output: str) -> str:
    """Extract the answer field from a Prediction output string.

    Handles both single and double quoted strings, with proper escape handling.
    Returns the raw output if extraction fails.

    Args:
        output: The Prediction output string

    Returns:
        The extracted and unescaped answer string, or the original output if extraction fails
    """
    # Try single quotes first
    m = ANSWER_RE_SQ.search(output)
    if m:
        raw = "'" + m.group(1) + "'"
    else:
        # Try double quotes
        m = ANSWER_RE_DQ.search(output)
        if not m:
            # If no match, return the original output
            return output
        raw = '"' + m.group(1) + '"'

    try:
        import ast
        # Use literal_eval to properly unescape the string
        return ast.literal_eval(raw)
    except Exception:
        # Fallback: try manual unescaping
        try:
            return raw[1:-1].encode("utf-8").decode("unicode_escape")
        except Exception:
            # Last resort: return the string without quotes
            return raw[1:-1]


@dataclass
class RunQueries:
    """Container for a single run from LangSmith.

    This represents a single query with its chat history, matching the format
    that LangSmith provides and the live server uses.
    """
    run_id: str
    query: str
    chat_history: list[dict[str, str]]
    output: str
    mcp_mode: bool
    created_at: datetime
    agent_id: str | None = None

    def to_dict(self) -> dict[str, Any]:
        result = {
            "run_id": self.run_id,
            "query": self.query,
            "chat_history": self.chat_history,
            "mcp_mode": self.mcp_mode,
            "output": self.output,
            "created_at": self.created_at.isoformat(),
        }
        if self.agent_id:
            result["agent_id"] = self.agent_id
        return result


def extract_cairocoder_pairs(
    *,
    days_back: int = 14,
    run_name_filters: list[str] | None = None,
    project_name: str | None = None,
) -> tuple[list[dict[str, Any]], dict[str, int]]:
    """Extract runs from LangSmith for Cairo-Coder.

    This function connects to LangSmith API and fetches runs from the specified
    project. Each run is returned as-is with its query, chat_history, and output,
    matching the format the live server uses.

    This replaces the old behavior of combining queries into arrays and deduplicating.
    Now every query creates a database entry, making all queries searchable.

    Args:
        days_back: Number of days to look back for runs (default: 14)
        run_name_filters: List of run names to filter by (default: ["RagPipeline", "RagPipelineStreaming"])
        project_name: LangSmith project name (default: from LANGSMITH_PROJECT env var or "default")

    Returns:
        A tuple of (runs, stats) where:
        - runs is a list of dicts, each containing {run_id, query, chat_history, output, mcp_mode, created_at}
        - stats contains total runs, matched runs, etc.
    """
    # Load environment variables
    load_dotenv(Path(__file__).parent.parent.parent.parent / ".env")

    if run_name_filters is None:
        run_name_filters = ["RagPipeline", "RagPipelineStreaming"]

    if project_name is None:
        project_name = os.getenv("LANGSMITH_PROJECT", "default")

    # Initialize LangSmith client
    client = Client()

    # Calculate time range
    end_time = datetime.now(timezone.utc)
    start_time = end_time - timedelta(days=days_back)

    # Build filter query
    filter_clauses = [f'eq(name, "{name}")' for name in run_name_filters]
    query_params = {
        "start_time": start_time,
        "end_time": end_time,
        "filter": f'or({",".join(filter_clauses)})',
        "project_name": project_name,
    }

    # Fetch runs from LangSmith
    runs = []
    total_runs = 0
    skipped = 0

    try:
        all_runs = client.list_runs(**query_params)
        for run in all_runs:
            total_runs += 1
            try:
                run_data = run.dict()
                inputs = run_data["inputs"]
                query = inputs["query"]
                chat_history = inputs.get("chat_history", [])
                output = run_data["outputs"]["output"]
                mcp_mode = inputs.get("mcp_mode", False)

                # Extract clean answer from Prediction output
                clean_output = _extract_answer_from_prediction(output)

                # Get timestamp (prefer start_time, fallback to end_time or now)
                run_timestamp = run_data.get("start_time") or run_data.get("end_time")
                if isinstance(run_timestamp, str):
                    run_timestamp = datetime.fromisoformat(run_timestamp.replace('Z', '+00:00'))
                elif not isinstance(run_timestamp, datetime):
                    run_timestamp = datetime.now(timezone.utc)

                # Pass through data as LangSmith provides it
                runs.append(RunQueries(
                    run_id=str(run_data["id"]),
                    query=query,
                    chat_history=chat_history,  # Keep full chat history with user+assistant messages
                    mcp_mode=mcp_mode,
                    output=clean_output,
                    created_at=run_timestamp,
                ))
            except (KeyError, TypeError):
                skipped += 1
                continue
    except Exception as e:
        # Return empty results with error stats if LangSmith fetch fails
        stats = {"total": 0, "matched": 0, "skipped": 0, "error": str(e)}
        return [], stats

    # Convert to output format
    results = [run.to_dict() for run in runs]

    stats = {
        "total": total_runs,
        "matched": len(results),
        "skipped": skipped
    }

    return results, stats
