from __future__ import annotations

import json
import os
import re
from collections.abc import Iterable, Iterator
from typing import Optional

import jsonlines

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
# Starknet-Agent LangSmith extractor
# ------------------------------

def _iter_chat_pairs(chat_history: list[dict]) -> Iterable[tuple[str, str]]:
    """Yield (human, ai) pairs from a chat history list.

    The dataset alternates HumanMessage and AIMessage, starting with human.
    This function pairs messages two-by-two in that order. If the structure
    deviates, it will try to match by the `id` field's last segment.
    """

    def is_human(msg: dict) -> bool:
        try:
            return msg.get("id", [None, None, None])[-1] == "HumanMessage"
        except Exception:
            return False

    def is_ai(msg: dict) -> bool:
        try:
            return msg.get("id", [None, None, None])[-1] == "AIMessage"
        except Exception:
            return False

    i = 0
    n = len(chat_history)
    while i + 1 < n:
        h = chat_history[i]
        a = chat_history[i + 1]

        # Prefer strict alternating order, but fall back to type checks if needed
        if not (is_human(h) and is_ai(a)):
            # Try to advance to the next valid human-ai pair
            # Find next human
            while i < n and not is_human(chat_history[i]):
                i += 1
            if i + 1 >= n:
                break
            # Next should be AI
            if not is_ai(chat_history[i + 1]):
                i += 1
                continue
            h = chat_history[i]
            a = chat_history[i + 1]

        h_content = h.get("kwargs", {}).get("content", "")
        a_content = a.get("kwargs", {}).get("content", "")

        if h_content and a_content:
            yield h_content, a_content

        i += 2


def extract_starknet_agent_pairs(input_path: str) -> list[dict[str, str]]:
    """Extract de-duplicated {query, answer} pairs from a LangSmith JSONL export
    containing chat histories under `inputs.chat_history` with alternating
    HumanMessage/AIMessage entries.
    """
    # Helpers for stronger deduplication
    ws_re = re.compile(r"\s+")
    cite_re = re.compile(r"\[(?:\d+(?:-\d+)?(?:,\s*)?)+\]")

    def normalize_text(s: str) -> str:
        if not s:
            return ""
        # Remove code-fence markers and backticks but keep content
        s = s.replace("```", "").replace("`", "")
        # Drop inline citation markers like [1], [1][4], [2-5]
        s = cite_re.sub("", s)
        # Lowercase and collapse whitespace
        s = s.lower().strip()
        return ws_re.sub(" ", s)

    grouped: dict[str, list[tuple[str, str, str]]] = {}

    # Try JSONL first
    try:
        iterator: Iterable[dict] = _read_records_jsonl(input_path)
        had_any = False
        for obj in iterator:
            had_any = True
            chat = obj.get("inputs", {}).get("chat_history")
            if not isinstance(chat, list):
                continue
            for q, a in _iter_chat_pairs(chat):
                nq, na = normalize_text(q), normalize_text(a)
                if not nq or not na:
                    continue
                bucket = grouped.setdefault(nq, [])
                # Dedup within same query: drop prefixes, keep the longest
                replaced = False
                for idx, (ea, _oq, _oa) in enumerate(bucket):
                    if na == ea:
                        replaced = True
                        break
                    if na.startswith(ea):
                        bucket[idx] = (na, q, a)
                        replaced = True
                        break
                    if ea.startswith(na):
                        replaced = True
                        break
                if not replaced:
                    bucket.append((na, q, a))
        if had_any:
            out: list[dict[str, str]] = []
            for entries in grouped.values():
                for _, q, a in entries:
                    out.append({"query": q, "answer": a})
            return out
    except Exception:
        # fall through to stream parser
        pass

    # Fallback: concatenated JSON objects (pretty-printed)
    for obj in _read_records_json_stream(input_path):
        chat = obj.get("inputs", {}).get("chat_history")
        if not isinstance(chat, list):
            continue
        for q, a in _iter_chat_pairs(chat):
            nq, na = normalize_text(q), normalize_text(a)
            if not nq or not na:
                continue
            bucket = grouped.setdefault(nq, [])
            replaced = False
            for idx, (ea, _oq, _oa) in enumerate(bucket):
                if na == ea:
                    replaced = True
                    break
                if na.startswith(ea):
                    bucket[idx] = (na, q, a)
                    replaced = True
                    break
                if ea.startswith(na):
                    replaced = True
                    break
            if not replaced:
                bucket.append((na, q, a))

    out: list[dict[str, str]] = []
    for entries in grouped.values():
        for _, q, a in entries:
            out.append({"query": q, "answer": a})
    return out


# ------------------------------
# Cairo-Coder LangSmith extractor
# ------------------------------

ANSWER_RE_SQ = re.compile(r"answer\s*=\s*'((?:\\'|[^'])*)'")
ANSWER_RE_DQ = re.compile(r'answer\s*=\s*"((?:\\"|[^"])*)"')
HAS_REASONING_RE = re.compile(r"reasoning=")


def _extract_answer_fragment(s: str) -> Optional[str]:
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


def _is_single_output(outputs: object) -> tuple[bool, Optional[str]]:
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


def extract_cairocoder_pairs(
    input_path: str,
    *,
    only_mcp: bool,
    only_generated_answers: bool,
) -> tuple[list[dict[str, str]], dict[str, int]]:
    """Extract {query, answer} pairs from a LangSmith JSONL export for Cairo-Coder.

    The record format is expected to have `outputs: {"output": "Prediction(..."}`.
    Use `only_mcp=True` to keep Prediction outputs without `reasoning=`.
    Use `only_generated_answers=True` to keep outputs with `reasoning=`.

    Returns a tuple of (pairs, stats) where stats has total/matched/skipped.
    """
    results: list[dict] = []
    total = 0
    matched = 0
    skipped = 0

    # First try strict JSONL; if that fails, fall back to JSON stream.
    try:
        iterator: Iterable[dict] = _read_records_jsonl(input_path)
        had_any = False
        for rec in iterator:
            had_any = True
            total += 1
            ok, out_str = _is_single_output(rec.get("outputs"))
            if not ok or out_str is None:
                skipped += 1
                continue

            has_reasoning = bool(HAS_REASONING_RE.search(out_str))
            looks_like_prediction = out_str.startswith("Prediction(") and ("answer=" in out_str)

            if only_mcp:
                if not looks_like_prediction or has_reasoning:
                    continue
            elif only_generated_answers and not has_reasoning:
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

            answer = _extract_answer_fragment(out_str)
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
            ok, out_str = _is_single_output(rec.get("outputs"))
            if not ok or out_str is None:
                skipped += 1
                continue

            has_reasoning = bool(HAS_REASONING_RE.search(out_str))
            looks_like_prediction = out_str.startswith("Prediction(") and ("answer=" in out_str)

            if only_mcp:
                if not looks_like_prediction or has_reasoning:
                    continue
            elif only_generated_answers and not has_reasoning:
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

            answer = _extract_answer_fragment(out_str)
            if not answer:
                skipped += 1
                continue

            results.append({"query": query, "answer": answer})
            matched += 1

    stats = {"total": total, "matched": matched, "skipped": skipped}
    return results, stats

