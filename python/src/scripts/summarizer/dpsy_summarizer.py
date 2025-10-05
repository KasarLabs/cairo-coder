import logging
import os
import re
from collections import Counter
from typing import Any, Dict, List, Optional, Tuple

import dotenv
import dspy
from dspy import Parallel as DSPyParallel
from dspy.signatures import make_signature

dotenv.load_dotenv()

logger = logging.getLogger(__name__)



# Initialize DSPy configuration
def configure_dspy(provider: str = "gemini", model: str = "gemini/gemini-flash-lite-latest", temperature: float = 0.50):
    """Configure DSPy with the specified provider and model"""
    lm = dspy.LM(model, max_tokens=30000, temperature=temperature)
    dspy.settings.configure(lm=lm)

class ProduceGist(dspy.Signature):
    """Produce a one- or two-sentence gist of what this chunk is about, so we can assign it to a class."""
    toc_path: list[str] = dspy.InputField(desc="path down which this chunk has traveled so far in the Table of Contents")
    chunk: str = dspy.InputField()
    gist: str = dspy.OutputField()

class ProduceHeaders(dspy.Signature):
    """Produce a list of headers (top-level Table of Contents) for structuring a report on *all* chunk contents.
    Make sure every chunk would belong to exactly one section."""
    toc_path: list[str] = dspy.InputField()
    chunk_summaries: str = dspy.InputField()
    headers: list[str] = dspy.OutputField()

class WriteSection(dspy.Signature):
    """Craft a Markdown section, given a path down the table of contents, which ends with this section's specific heading.
    Start the content right beneath that heading: use sub-headings of depth at least +1 relative to the ToC path.
    Ensure the section starts with a markdown heading with syntax "# <heading>" - with the right heading level.
    Your section's content is to be entirely derived from the given list of chunks. That content must be complete but very concise,
    with all necessary knowledge from the chunks reproduced and repetitions or irrelevant details
    omitted. Be straight to the point, minimize the amount of text while maximizing information.
    If the chunk contains code examples, make sure to include the _full original code_ in the section's content.
    """
    toc_path: list[str] = dspy.InputField()
    content_chunks: list[str] = dspy.InputField()
    section_content: str = dspy.OutputField()

def produce_gist(toc_path, chunks):
    parallelizer = DSPyParallel(num_threads=12)
    produce_gist = dspy.ChainOfThought(ProduceGist)
    chunk_summaries = parallelizer([(produce_gist, {"toc_path": toc_path, "chunk": chunk}) for chunk in chunks])
    return [summary.gist for summary in chunk_summaries]

def produce_headers(toc_path, chunk_summaries):
    produce_headers = dspy.ChainOfThought(ProduceHeaders)
    return produce_headers(toc_path=toc_path, chunk_summaries=chunk_summaries).headers

def classify_chunks(toc_path, chunks, headers):
    parallelizer = DSPyParallel(num_threads=12)
    classify = dspy.ChainOfThought(make_signature(f"toc_path: list[str], chunk -> topic: Literal{headers}"))
    return parallelizer([(classify, {"toc_path": toc_path, "chunk": chunk}) for chunk in chunks])

def group_sections(topics, chunks, headers):
    sections = {topic: [] for topic in headers}
    for topic, chunk in zip(topics, chunks, strict=False):
        sections[topic.topic].append(chunk)
    return sections

def summarize_sections(toc_path, sections: Dict[str, List[str]], sections_metas: Optional[Dict[str, List[Optional[dict]]]] = None):
    parallelizer = DSPyParallel(num_threads=12)
    tasks = []
    for topic, section_chunks in sections.items():
        metas = sections_metas.get(topic) if sections_metas else None
        tasks.append((massively_summarize, {"toc_path": toc_path + [topic], "chunks": section_chunks, "metas": metas}))
    return parallelizer(tasks)

def _aggregate_source_urls(metas: Optional[List[Optional[dict]]]) -> List[str]:
    """Aggregate and order source URLs by frequency (descending)."""
    if not metas:
        return []
    counter: Counter[str] = Counter()
    for m in metas:
        if not m:
            continue
        url = m.get("source_url")
        if url:
            counter[url] += 1
    # Sort by count desc, then by URL for stability
    ordered = sorted(counter.items(), key=lambda kv: (-kv[1], kv[0]))
    return [url for url, _ in ordered]


def _format_sources_block(urls: List[str]) -> str:
    if not urls:
        return ""
    bullets = "\n".join(f"- {u}" for u in urls)
    return f"---\n\nSources:\n\n{bullets}\n\n---\n\n"


def _group_sections_with_metas(topics, chunks: List[str], headers: List[str], metas: Optional[List[Optional[dict]]]):
    """Return (sections, sections_metas) grouped by topic."""
    sections: Dict[str, List[str]] = {topic: [] for topic in headers}
    sections_metas: Dict[str, List[Optional[dict]]] = {topic: [] for topic in headers}
    for topic, chunk, meta in zip(topics, chunks, metas or [None] * len(chunks), strict=False):
        sections[topic.topic].append(chunk)
        sections_metas[topic.topic].append(meta)
    return sections, sections_metas


def massively_summarize(
    toc_path: list | str,
    chunks: List[str],
    metas: Optional[List[Optional[dict]]] = None,
):
    # Normalize metas length
    if metas is None:
        metas = [None] * len(chunks)

    title = toc_path[-1]

    # Base case: small batch or deep depth → write a single section
    if len(chunks) < 5 or len(toc_path) >= 3:
        content = dspy.ChainOfThought(WriteSection)(toc_path=toc_path, content_chunks=chunks).section_content
        if content is None:
            # section = f"{title}\n\nNo content generated for this section."
            logger.warning(f"No content generated for this section: {title}")
            return ""
        else:
            section = f"{content}"
        urls = _aggregate_source_urls(metas)
        sources_block = _format_sources_block(urls)
        header = (sources_block if sources_block else "")
        return header + section

    # Recursive case: organize into headers and summarize subsections
    chunk_summaries = produce_gist(toc_path, chunks)
    headers = produce_headers(toc_path, chunk_summaries)
    topics = classify_chunks(toc_path, chunks, headers)
    sections, sections_metas = _group_sections_with_metas(topics, chunks, headers, metas)

    summarized_sections = summarize_sections(toc_path, sections, sections_metas)
    valid_sections = [section for section in summarized_sections if section is not None]
    if not valid_sections:
        logger.warning(f"No content generated for this section: {title}")
        return ""

    # Add a sources block for this ToC header (aggregate of all descendant chunks)
    urls = _aggregate_source_urls(metas)
    sources_block = _format_sources_block(urls)
    header = (sources_block if sources_block else "")
    return header + "\n\n".join(valid_sections)

def read_markdown_file(file_path: str) -> str:
    with open(file_path) as f:
        return f.read()

def merge_markdown_files(directory: str) -> str:
    """Merge all markdown files in a directory and return the content"""
    merged_content = []
    for filename in sorted(os.listdir(directory)):
        if filename.endswith('.md'):
            file_path = os.path.join(directory, filename)
            with open(file_path) as infile:
                merged_content.append(infile.read())
    return '\n\n'.join(merged_content)

def generate_markdown_toc(markdown_text: str, toc_path: list | None = None, max_level: int = 3) -> str:
    """Generate a Markdown Table of Contents for headings under toc_path up to max_level."""
    toc_lines = []
    current_path = []
    toc_path = toc_path or []
    for line in markdown_text.splitlines():
        match = re.match(fr'^(#{{1,{max_level}}})\s+(.*)', line)
        if match:
            level = len(match.group(1))
            title = match.group(2).strip()
            # Update current_path to match heading levels
            if len(current_path) < level:
                current_path.append(title)
            else:
                current_path = current_path[:level-1] + [title]
            # Only include headings that are descendants of toc_path
            if current_path[:len(toc_path)] == toc_path:
                anchor = re.sub(r'[^a-zA-Z0-9\- ]', '', title).replace(' ', '-').lower()
                indent = '  ' * (level - len(toc_path) - 1)
                toc_lines.append(f"{indent}- [{title}](#{anchor})")
    return '\n'.join(toc_lines)

def extract_headings(markdown_text: str, max_level: int = 3) -> list:
    """Extract headings up to max_level as a list of strings for LLM sidebar TOC."""
    headings = []
    for line in markdown_text.splitlines():
        match = re.match(fr'^(#{{1,{max_level}}})\s+(.*)', line)
        if match:
            title = match.group(2).strip()
            headings.append(title)
    return headings

def make_chunks(merged_content: str, target_chunk_size: int = 1000) -> list[str]:
    """
        Splits the merged content into chunks of roughly the same size.
        This ensures that code blocks are not split across chunks - meaning, a chunk with a code
        block might be bigger than the target chunk size.
    """
    chunks: list[str] = []
    current_chunk: str = ""
    is_in_code_block: bool = False

    lines = merged_content.splitlines()

    for line in lines:
        line_content = line  # The actual line content for logic
        line_to_add = line + "\\n"  # What gets added to the chunk, including newline

        if line_content.strip().startswith('```'):
            # This line is a code block delimiter
            # We are about to START a code block.
            # If current_chunk is not empty, and adding this delimiter line would make it exceed the target_chunk_size,
            # then the current_chunk (without this delimiter) should be saved as a separate chunk.
            if not is_in_code_block and current_chunk and (len(current_chunk) + len(line_to_add) > target_chunk_size):
                chunks.append(current_chunk)
                current_chunk = ""

            # Add the delimiter line to the current_chunk and toggle the state
            current_chunk += line_to_add
            is_in_code_block = not is_in_code_block

        elif is_in_code_block:
            # We are INSIDE a code block (and this line is not a delimiter). Always add the line.
            current_chunk += line_to_add

        else:
            # We are OUTSIDE a code block, and this is a normal line (not a delimiter).
            # If current_chunk is not empty and adding this line makes it too big, save current_chunk.
            if current_chunk and (len(current_chunk) + len(line_to_add) > target_chunk_size):
                chunks.append(current_chunk)
                current_chunk = ""
            current_chunk += line_to_add

    if current_chunk: # Add any remaining part
        chunks.append(current_chunk)

    return chunks
