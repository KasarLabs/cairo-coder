import { ClaudeCodeAgent, CodexAgent } from "smithers-orchestrator";
import { REPO_ROOT } from "./config";

const SYSTEM_PROMPT_BASE = `You are working on Cairo Coder, a RAG-based Cairo code generation service.
Stack: Python/FastAPI backend, DSPy for LLM orchestration, PostgreSQL/pgvector.
Package manager: uv (NEVER pip/poetry).
Read CLAUDE.md for full project conventions before making any changes.

CRITICAL OUTPUT REQUIREMENT:
When you have completed your work, you MUST end your response with a JSON object
wrapped in a code fence. The JSON format is specified in your task prompt.`;

export const planner = new ClaudeCodeAgent({
  model: "opus",
  systemPrompt: SYSTEM_PROMPT_BASE,
  cwd: REPO_ROOT,
  permissionMode: "default",
});

export const implementer = new CodexAgent({
  model: "gpt-5.3-codex",
  dangerouslyBypassApprovalsAndSandbox: true,
  systemPrompt: SYSTEM_PROMPT_BASE,
  cwd: REPO_ROOT,
});

export const reviewer = new ClaudeCodeAgent({
  model: "opus",
  systemPrompt: SYSTEM_PROMPT_BASE,
  cwd: REPO_ROOT,
  permissionMode: "default",
});
