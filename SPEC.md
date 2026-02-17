# SPEC: MCP Mode Skill Generation

## Summary

Replace MCP mode's raw document dump with an LLM-powered step that synthesizes retrieved docs into a Claude Code skill file (SKILL.md format). Instead of returning unstructured documentation, MCP mode will return precise, actionable LLM instructions that callers can use directly.

## Background

- MCP mode is triggered by the `x-mcp-mode` or `mcp` HTTP header
- Currently it skips LLM generation and returns raw docs formatted as markdown (title, source, URL, content)
- This is suboptimal: modern models work better with precise instructions in the skill format than with raw context dumps
- The skill format has YAML frontmatter (`name`, `description`) and a markdown body with instructions, examples, and code patterns

## Requirements

### 1. New DSPy Signature: `SkillGeneration`

**File:** `python/src/cairo_coder/dspy/generation_program.py`

Create a new DSPy Signature that takes a query and retrieved documents and produces a SKILL.md string.

**Inputs:**

- `query` (str): The original user query
- `context` (str): Retrieved documents formatted as context (reuse `_prepare_context()` from the pipeline)

**Output:**

- `skill` (str): A complete SKILL.md file content

The output must follow this structure:

```markdown
---
name: <kebab-case-name-derived-from-query>
description: <1-2 sentence description of what this skill does and when to use it>
---

<Markdown body with:>
- Clear instructions for the LLM
- Relevant code examples extracted from the retrieved docs
- Cairo/Starknet-specific patterns and best practices
- Source references where applicable
```

### 2. New DSPy Module: `SkillGenerationProgram`

**File:** `python/src/cairo_coder/dspy/generation_program.py`

Replace `McpGenerationProgram` with `SkillGenerationProgram`:

- Wraps the `SkillGeneration` signature in a `dspy.ChainOfThought` module
- Implements both `forward()` and `aforward()` (async)
- Uses the same LLM as the normal generation path

Update the factory function `create_mcp_generation_program()` to return a `SkillGenerationProgram` instance.

### 3. Update RAG Pipeline MCP Branch

**File:** `python/src/cairo_coder/core/rag_pipeline.py`

In both `aforward()` (line ~181) and `aforward_streaming()` (line ~260):

- The MCP branch currently calls `self.mcp_generation_program.acall(documents)`
- Change it to prepare context first (call `self._prepare_context(documents)`) and then call `self.mcp_generation_program.acall(query=query, context=context)`
- The response field changes from `result.answer` to `result.skill`

### 4. Update Tests

**Unit tests** in `python/tests/unit/test_generation_program.py`:

- Test `SkillGenerationProgram` produces valid SKILL.md output
- Test output contains YAML frontmatter with `name` and `description`
- Test output contains markdown body
- Test empty documents case

**Unit tests** in `python/tests/unit/test_rag_pipeline.py`:

- Update existing MCP mode tests to expect skill format instead of raw docs

### 5. Remove Dead Code

- Delete `McpGenerationProgram` class
- Delete old `create_mcp_generation_program()` factory (replace with new one)

## Out of Scope

- Saving generated skills to disk
- New HTTP headers or endpoints (still uses `x-mcp-mode`)
- Changes to the ingester or document retrieval pipeline
- Optimizing the skill generation prompt with DSPy optimizers (future work)

## Acceptance Criteria

1. `x-mcp-mode` requests return a valid SKILL.md string instead of raw docs
2. Output contains YAML frontmatter with `name` and `description` fields
3. Output contains actionable instructions (not just pasted docs)
4. All existing tests pass (updated for new format)
5. New unit tests for `SkillGenerationProgram`
6. `uv run pytest` passes from `python/` directory
7. `trunk check --fix` passes from repo root

## Verification Commands

```bash
cd python && uv run pytest -v
trunk check --fix
```
