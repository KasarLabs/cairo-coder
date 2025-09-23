#!/usr/bin/env python3

import argparse
import json
import os
import re
import sys
from collections.abc import Iterable, Iterator
from typing import Optional

import jsonlines


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


ANSWER_RE_SQ = re.compile(r"answer\s*=\s*'((?:\\'|[^'])*)'")
ANSWER_RE_DQ = re.compile(r'answer\s*=\s*"((?:\\"|[^"])*)"')
HAS_REASONING_RE = re.compile(r"reasoning=")


def extract_answer_fragment(s: str) -> Optional[str]:
    """Extract the quoted answer=... string from the Prediction-like output.

    Returns the unescaped string content if found, otherwise None.
    """
    m = ANSWER_RE_SQ.search(s)
    if m:
        raw = "'" + m.group(1) + "'"  # re-wrap for literal_eval
    else:
        m = ANSWER_RE_DQ.search(s)
        if not m:
            return None
        raw = '"' + m.group(1) + '"'

    try:
        import ast

        return ast.literal_eval(raw)
    except Exception:
        # Fallback: interpret common escapes
        try:
            return raw[1:-1].encode("utf-8").decode("unicode_escape")
        except Exception:
            return raw[1:-1]


def is_single_output(outputs: object) -> tuple[bool, Optional[str]]:
    """Check that outputs is a dict with a single key 'output' string.

    Returns (ok, output_string_or_None).
    """
    if not isinstance(outputs, dict):
        return False, None
    if set(outputs.keys()) != {"output"}:
        return False, None
    val = outputs.get("output")
    if not isinstance(val, str):
        return False, None
    return True, val


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Extract QA pairs from cc-dataset.jsonl. "
            "Use --only-mcp or --only-generated-answers to filter."
        )
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument(
        "--only-mcp",
        action="store_true",
        help=(
            "Extract traces with a single output whose string looks like "
            "'Prediction(\n    answer=...)' and does NOT contain 'reasoning='"
        ),
    )
    group.add_argument(
        "--only-generated-answers",
        action="store_true",
        help=(
            "Extract traces with a single output that DOES contain 'reasoning='"
        ),
    )
    parser.add_argument(
        "--input",
        default="cc-dataset.jsonl",
        help="Path to input JSONL file (default: cc-dataset.jsonl)",
    )
    parser.add_argument(
        "--output",
        default="qa_pairs_cairo_coder.json",
        help="Path to output JSON file (default: qa_pairs_cairo_coder.json)",
    )

    args = parser.parse_args()

    input_path = args.input
    if not os.path.exists(input_path):
        sys.stderr.write(f"Input file not found: {input_path}\n")
        sys.exit(1)

    results: list[dict] = []
    total = 0
    matched = 0
    skipped = 0

    # First try strict JSONL via jsonlines; if that fails, fall back to JSON stream.
    try:
        iterator: Iterable[dict] = _read_records_jsonl(input_path)
        had_any = False
        for rec in iterator:
            had_any = True
            total += 1
            ok, out_str = is_single_output(rec.get("outputs"))
            if not ok or out_str is None:
                skipped += 1
                continue

            has_reasoning = bool(HAS_REASONING_RE.search(out_str))
            looks_like_prediction = out_str.startswith("Prediction(") and ("answer=" in out_str)

            if args.only_mcp:
                if not looks_like_prediction or has_reasoning:
                    continue
            elif args.only_generated_answers and not has_reasoning:
                continue

            query = None
            try:
                inputs = rec.get("inputs")
                if isinstance(inputs, dict):
                    q = inputs.get("query")
                    if isinstance(q, str):
                        query = q
            except Exception:
                query = None

            if not query:
                skipped += 1
                continue

            answer = extract_answer_fragment(out_str)
            if not answer:
                skipped += 1
                continue

            results.append({"query": query, "answer": answer})
            matched += 1

        if not had_any:
            raise RuntimeError("jsonlines yielded no records; trying stream parser")
    except Exception:
        for rec in _read_records_json_stream(input_path):
            total += 1
            ok, out_str = is_single_output(rec.get("outputs"))
            if not ok or out_str is None:
                skipped += 1
                continue

            has_reasoning = bool(HAS_REASONING_RE.search(out_str))
            looks_like_prediction = out_str.startswith("Prediction(") and ("answer=" in out_str)

            if args.only_mcp:
                if not looks_like_prediction or has_reasoning:
                    continue
            elif args.only_generated_answers and not has_reasoning:
                continue

            query = None
            try:
                inputs = rec.get("inputs")
                if isinstance(inputs, dict):
                    q = inputs.get("query")
                    if isinstance(q, str):
                        query = q
            except Exception:
                query = None

            if not query:
                skipped += 1
                continue

            answer = extract_answer_fragment(out_str)
            if not answer:
                skipped += 1
                continue

            results.append({"query": query, "answer": answer})
            matched += 1

    # Write output JSON array
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False)

    print(
        json.dumps(
            {
                "input": input_path,
                "output": args.output,
                "total": total,
                "matched": matched,
                "skipped": skipped,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
