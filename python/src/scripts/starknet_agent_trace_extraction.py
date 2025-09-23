import argparse
import json
import os
import re
from collections.abc import Iterable, Iterator

import jsonlines


def iter_chat_pairs(chat_history: list[dict]) -> Iterable[tuple[str, str]]:
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


def _read_records_jsonl(path: str) -> Iterator[dict]:
    """Try reading records assuming strict JSONL. Skips invalid lines."""
    with jsonlines.open(os.path.expanduser(path), mode="r") as reader:
        for obj in reader.iter(skip_invalid=True):
            if isinstance(obj, dict):
                yield obj


def _read_records_json_stream(path: str) -> Iterator[dict]:
    """Fallback: parse a stream of pretty-printed JSON objects concatenated.

    This supports files where objects are separated by whitespace/newlines but
    not necessarily one-object-per-line.
    """
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


def extract_pairs(input_path: str) -> list[dict[str, str]]:
    # Helpers for stronger deduplication
    ws_re = re.compile(r"\s+")
    cite_re = re.compile(r"\[(?:\d+(?:-\d+)?(?:,\s*)?)+\]")

    def normalize_text(s: str) -> str:
        if not s:
            return ""
        # Remove code-fence markers and backticks but keep content
        s = s.replace("```", "")
        s = s.replace("`", "")
        # Drop inline citation markers like [1], [1][4], [2-5]
        s = cite_re.sub("", s)
        # Lowercase and collapse whitespace
        s = s.lower().strip()
        return ws_re.sub(" ", s)

    # Map normalized query -> list of entries (norm_answer, original_q, original_a)
    grouped: dict[str, list[tuple[str, str, str]]] = {}

    # First attempt: JSONL
    try:
        iterator: Iterable[dict] = _read_records_jsonl(input_path)
        had_any = False
        for obj in iterator:
            had_any = True
            chat = obj.get("inputs", {}).get("chat_history")
            if not isinstance(chat, list):
                continue
            for q, a in iter_chat_pairs(chat):
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
                        # New answer is longer; replace existing shorter one
                        bucket[idx] = (na, q, a)
                        replaced = True
                        break
                    if ea.startswith(na):
                        # Existing answer is longer; drop new one
                        replaced = True
                        break
                if not replaced:
                    bucket.append((na, q, a))
        if had_any:
            # Flatten grouped into results
            out: list[dict[str, str]] = []
            for entries in grouped.values():
                for _, q, a in entries:
                    out.append({"query": q, "answer": a})
            return out
    except Exception:
        # Fall back to stream parser
        pass

    # Fallback: concatenated JSON objects (pretty-printed)
    for obj in _read_records_json_stream(input_path):
        chat = obj.get("inputs", {}).get("chat_history")
        if not isinstance(chat, list):
            continue
        for q, a in iter_chat_pairs(chat):
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


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Extract de-duplicated {query, answer} pairs from a JSONL dataset "
            "of LangChain-style chat histories."
        )
    )
    parser.add_argument(
        "--input",
        default="~/Downloads/dataset-starknet-agent.json",
        help="Path to the input JSONL file.",
    )
    parser.add_argument(
        "--output",
        default="qa_pairs.json",
        help="Path to write the resulting JSON file.",
    )
    args = parser.parse_args()

    pairs = extract_pairs(args.input)
    out_path = os.path.expanduser(args.output)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(pairs, f, ensure_ascii=False, indent=2)

    print(f"Wrote {len(pairs)} pairs to {out_path}")


if __name__ == "__main__":
    main()
