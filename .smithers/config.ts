export const MAX_PASSES = 5;

export const REPO_ROOT = process.cwd();

export const VERIFICATION_COMMANDS = {
  test: "cd python && uv run pytest -v",
  lint: "trunk check --fix",
} as const;
