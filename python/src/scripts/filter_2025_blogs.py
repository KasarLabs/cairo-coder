#!/usr/bin/env python3
"""
Filter doc_dump.md to keep only blog entries published in 2025.

Reads the doc_dump.md file, identifies individual pages separated by "---",
and filters to keep only those containing blog entries with 2025 dates.
"""

import re
from pathlib import Path


def is_2025_blog_entry(content: str) -> bool:
    """
    Check if content contains a blog entry from 2025.

    Looks for patterns like:
    Home  /  Blog
    Feb 5, 2023 ·    2 min read

    Returns True if the date is from 2025.
    """
    # Look for the blog pattern with date
    # Pattern: Month Day, Year · time min read
    blog_pattern = r'Home\s+/\s+Blog.*?(\w+\s+\d+,\s+(\d{4}))\s+·'

    matches = re.findall(blog_pattern, content, re.DOTALL | re.IGNORECASE)

    for match in matches:
        year = match[1]
        if year == '2025':
            return True

    return False


def filter_doc_dump(input_file: Path, output_file: Path):
    """
    Read doc_dump.md and filter to keep only 2025 blog entries.
    Supports both old format (single Sources block) and new format (individual Sources blocks).
    """
    with open(input_file, encoding='utf-8') as f:
        content = f.read()

    filtered_pages = []
    total_pages = 0
    kept_pages = 0
    document_header = ""

    # Try new format first (individual Sources blocks)
    page_pattern = r'(---\s*\nSources:\s*\n\s*-\s*[^\n]+\n---\s*\n+##[^#].*?)(?=\n---\s*\nSources:|\Z)'
    matches = list(re.finditer(page_pattern, content, re.DOTALL))

    if matches:
        # New format detected
        print("Detected new format (individual Sources blocks)")

        # Keep document header if present
        header_match = re.match(r'^(.*?)(?=\n---\s*\nSources:)', content, re.DOTALL)
        document_header = header_match.group(1).strip() if header_match else ""

        for match in matches:
            page = match.group(1)
            if not page.strip():
                continue

            total_pages += 1

            # Check if this is a 2025 blog entry
            if is_2025_blog_entry(page):
                filtered_pages.append(page.strip())
                kept_pages += 1

                # Extract URL for logging (from Sources block)
                url_match = re.search(r'Sources:\s*\n\s*-\s*(.+)', page)
                if url_match:
                    print(f"Keeping: {url_match.group(1)}")
    else:
        # Fall back to old format (**Source URL:** markers)
        print("Detected old format (**Source URL:** markers)")

        pattern = re.compile(r'^\*\*Source URL:\*\*\s+(\S+)', re.MULTILINE)
        page_matches = list(pattern.finditer(content))

        for i, m in enumerate(page_matches):
            url = m.group(1)
            start = m.end()
            end = page_matches[i + 1].start() if i + 1 < len(page_matches) else len(content)
            page_content = content[start:end].strip()

            # Remove surrounding '---' separators
            lines = page_content.splitlines()
            while lines and lines[0].strip() == '---':
                lines.pop(0)
            while lines and lines[-1].strip() == '---':
                lines.pop()
            page_content = "\n".join(lines).strip()

            total_pages += 1

            if is_2025_blog_entry(page_content):
                # Convert to new format
                new_format_page = f"---\nSources:\n  - {url}\n---\n\n{page_content}"
                filtered_pages.append(new_format_page)
                kept_pages += 1
                print(f"Keeping: {url}")

    # Construct output with header and filtered pages
    output_parts = []
    if document_header:
        output_parts.append(document_header)
        output_parts.append("")
        output_parts.append("")

    output_parts.extend(filtered_pages)
    output_content = '\n\n'.join(output_parts)

    # Write to output file
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(output_content)

    print(f"\n{'-'*60}")
    print(f"Total pages processed: {total_pages}")
    print(f"Pages kept (2025 blogs): {kept_pages}")
    print(f"Pages removed: {total_pages - kept_pages}")
    print(f"Output written to: {output_file}")


def main():
    # Paths
    script_dir = Path(__file__).parent
    python_dir = script_dir.parent.parent
    input_file = python_dir / "doc_dump.md"
    output_file = python_dir / "doc_dump_2025_blogs.md"

    if not input_file.exists():
        print(f"Error: Input file not found: {input_file}")
        return

    print(f"Reading from: {input_file}")
    print("Filtering for 2025 blog entries...\n")

    filter_doc_dump(input_file, output_file)


if __name__ == "__main__":
    main()
