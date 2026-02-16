import { smithers, Workflow, Task, Ralph, ClaudeCodeAgent } from "smithers-orchestrator";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";
import React from "react";

const inputTable = sqliteTable("input", {
  runId: text("run_id").primaryKey(),
  specPath: text("spec_path").notNull(),
});

const planTable = sqliteTable(
  "plan",
  {
    runId: text("run_id").notNull(),
    nodeId: text("node_id").notNull(),
    iteration: integer("iteration").notNull().default(0),
    taskName: text("task_name").notNull(),
    research: text("research").notNull(),
    implementationPrompt: text("implementation_prompt").notNull(),
    filesToCreate: text("files_to_create", { mode: "json" }).$type<string[]>(),
    filesToModify: text("files_to_modify", { mode: "json" }).$type<string[]>(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.runId, t.nodeId, t.iteration] }) })
);

const implementTable = sqliteTable(
  "implement",
  {
    runId: text("run_id").notNull(),
    nodeId: text("node_id").notNull(),
    iteration: integer("iteration").notNull().default(0),
    summary: text("summary").notNull(),
    filesChanged: text("files_changed", { mode: "json" }).$type<string[]>(),
    testOutput: text("test_output").notNull(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.runId, t.nodeId, t.iteration] }) })
);

const reviewTable = sqliteTable(
  "review",
  {
    runId: text("run_id").notNull(),
    nodeId: text("node_id").notNull(),
    iteration: integer("iteration").notNull().default(0),
    lgtm: integer("lgtm", { mode: "boolean" }).notNull(),
    review: text("review").notNull(),
    issues: text("issues", { mode: "json" }).$type<string[]>(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.runId, t.nodeId, t.iteration] }) })
);

const fixTable = sqliteTable(
  "fix",
  {
    runId: text("run_id").notNull(),
    nodeId: text("node_id").notNull(),
    iteration: integer("iteration").notNull().default(0),
    summary: text("summary").notNull(),
    filesChanged: text("files_changed", { mode: "json" }).$type<string[]>(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.runId, t.nodeId, t.iteration] }) })
);

const outputTable = sqliteTable(
  "output",
  {
    runId: text("run_id").notNull(),
    nodeId: text("node_id").notNull(),
    totalTasks: integer("total_tasks").notNull(),
    finalStatus: text("final_status").notNull(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.runId, t.nodeId] }) })
);

export const schema = {
  input: inputTable,
  output: outputTable,
  plan: planTable,
  implement: implementTable,
  review: reviewTable,
  fix: fixTable,
};

export const db = drizzle(".smithers/workflow.db", { schema });

// Create tables
(db as any).$client.exec(`
  CREATE TABLE IF NOT EXISTS input (
    run_id TEXT PRIMARY KEY,
    spec_path TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS plan (
    run_id TEXT NOT NULL, node_id TEXT NOT NULL, iteration INTEGER NOT NULL DEFAULT 0,
    task_name TEXT NOT NULL, research TEXT NOT NULL, implementation_prompt TEXT NOT NULL,
    files_to_create TEXT, files_to_modify TEXT,
    PRIMARY KEY (run_id, node_id, iteration)
  );
  CREATE TABLE IF NOT EXISTS implement (
    run_id TEXT NOT NULL, node_id TEXT NOT NULL, iteration INTEGER NOT NULL DEFAULT 0,
    summary TEXT NOT NULL, files_changed TEXT, test_output TEXT NOT NULL,
    PRIMARY KEY (run_id, node_id, iteration)
  );
  CREATE TABLE IF NOT EXISTS review (
    run_id TEXT NOT NULL, node_id TEXT NOT NULL, iteration INTEGER NOT NULL DEFAULT 0,
    lgtm INTEGER NOT NULL, review TEXT NOT NULL, issues TEXT,
    PRIMARY KEY (run_id, node_id, iteration)
  );
  CREATE TABLE IF NOT EXISTS fix (
    run_id TEXT NOT NULL, node_id TEXT NOT NULL, iteration INTEGER NOT NULL DEFAULT 0,
    summary TEXT NOT NULL, files_changed TEXT,
    PRIMARY KEY (run_id, node_id, iteration)
  );
  CREATE TABLE IF NOT EXISTS output (
    run_id TEXT NOT NULL, node_id TEXT NOT NULL,
    total_tasks INTEGER NOT NULL, final_status TEXT NOT NULL,
    PRIMARY KEY (run_id, node_id)
  );
  CREATE TABLE IF NOT EXISTS state (
    key TEXT PRIMARY KEY, value TEXT NOT NULL,
    updated_at TEXT DEFAULT (datetime('now'))
  );
`);

function updateState(key: string, value: string) {
  (db as any).$client.run(
    "INSERT OR REPLACE INTO state (key, value, updated_at) VALUES (?, ?, datetime('now'))",
    [key, value]
  );
}

updateState("supervisor.status", "running");
updateState("supervisor.summary", "Workflow initialized");
updateState("supervisor.heartbeat", new Date().toISOString());

setInterval(() => {
  try {
    updateState("supervisor.heartbeat", new Date().toISOString());
  } catch (err) {
    console.error("Failed to write heartbeat:", err);
  }
}, 30000);

const cliEnv = { ANTHROPIC_API_KEY: "" };

const plannerAgent = new ClaudeCodeAgent({
  model: "sonnet",
  env: cliEnv,
  systemPrompt: "You are a senior software architect. Read the spec, examine the codebase, " +
    "and pick the NEXT highest-priority task. Produce a detailed implementation prompt. " +
    "Respond with ONLY a JSON object: " +
    '{ "taskName": "string", "research": "string", "implementationPrompt": "string", ' +
    '"filesToCreate": ["paths"], "filesToModify": ["paths"] }',
});

const implementAgent = new ClaudeCodeAgent({
  model: "sonnet",
  env: cliEnv,
  systemPrompt: "You are a senior TypeScript engineer. Implement the task described below. " +
    "After writing code, ALWAYS run tests to verify. " +
    "Respond with ONLY a JSON object: " +
    '{ "summary": "string", "filesChanged": ["paths"], "testOutput": "string" }',
});

const reviewAgent = new ClaudeCodeAgent({
  model: "sonnet",
  env: cliEnv,
  systemPrompt: "You are a senior code reviewer. Run type checker and tests. " +
    "Set lgtm=true ONLY if everything is correct. " +
    "Respond with ONLY a JSON object: " +
    '{ "lgtm": true/false, "review": "string", "issues": ["specific issues"] }',
});

const fixAgent = new ClaudeCodeAgent({
  model: "sonnet",
  env: cliEnv,
  systemPrompt: "You are a senior TypeScript engineer fixing code review issues. " +
    "After making changes, run tests and type checker. " +
    "Respond with ONLY a JSON object: " +
    '{ "summary": "string", "filesChanged": ["paths"] }',
});

type Phase = "plan" | "implement" | "review" | "fix";

function computePhase(plans: any[], impls: any[], reviews: any[], fixes: any[]): Phase {
  if (plans.length === 0) return "plan";
  if (impls.length < plans.length) return "implement";
  if (reviews.length < plans.length + fixes.length) return "review";
  const latestReview = reviews[reviews.length - 1];
  if (latestReview?.lgtm) return "plan";
  if (fixes.length >= reviews.filter((r: any) => !r.lgtm).length) return "review";
  if (fixes.length >= 3) return "plan";
  return "fix";
}

export default smithers(db, (ctx) => {
  const plans: any[] = ctx.outputs.plan ?? [];
  const impls: any[] = ctx.outputs.implement ?? [];
  const reviews: any[] = ctx.outputs.review ?? [];
  const fixes: any[] = ctx.outputs.fix ?? [];

  const phase = computePhase(plans, impls, reviews, fixes);
  const latestPlan = plans[plans.length - 1];
  const latestImpl = impls[impls.length - 1];
  const latestReview = reviews[reviews.length - 1];

  const completedTasks = reviews
    .filter((r: any) => r.lgtm)
    .map((_r: any, i: number) => plans[i]?.taskName)
    .filter(Boolean)
    .join(", ");

  updateState("supervisor.status", "running");
  updateState("supervisor.summary",
    "Phase: " + phase + " | Tasks done: " + reviews.filter((r: any) => r.lgtm).length);

  return (
    <Workflow name="my-workflow">
      <Ralph until={false} maxIterations={200} onMaxReached="return-last">
        <Task id="plan" output={schema.plan} agent={plannerAgent} skipIf={phase !== "plan"} retries={2}>
          {"Read the project spec at " + (ctx.input.specPath ?? "SPEC.md") + " and examine the codebase. Completed tasks: " + (completedTasks || "None yet") + ". Pick the NEXT task. Research what's needed. Write a detailed implementation prompt."}
        </Task>

        <Task id="implement" output={schema.implement} agent={implementAgent} skipIf={phase !== "implement"} retries={2}>
          {"TASK: " + (latestPlan?.taskName ?? "unknown") + " -- " + (latestPlan?.implementationPrompt ?? "No implementation prompt.") + " Files to create: " + JSON.stringify(latestPlan?.filesToCreate ?? []) + " Files to modify: " + JSON.stringify(latestPlan?.filesToModify ?? []) + " After implementing, run tests and report results."}
        </Task>

        <Task id="review" output={schema.review} agent={reviewAgent} skipIf={phase !== "review"} retries={2}>
          {"Review: " + (latestPlan?.taskName ?? "unknown") + " | Summary: " + (latestImpl?.summary ?? "No summary") + " | Files: " + JSON.stringify(latestImpl?.filesChanged ?? []) + " | Tests: " + (latestImpl?.testOutput ?? "No test output") + " -- Read ALL changed files. Run type checker and tests."}
        </Task>

        <Task id="fix" output={schema.fix} agent={fixAgent} skipIf={phase !== "fix"} retries={2}>
          {"Fix review issues for: " + (latestPlan?.taskName ?? "unknown") + " Issues: " + (latestReview?.issues?.map((issue: string, i: number) => (i + 1) + ". " + issue).join(", ") ?? "None") + " Fix each issue. Run tests after."}
        </Task>
      </Ralph>

      <Task id="done" output={schema.output}>
        {{ totalTasks: reviews.filter((r: any) => r.lgtm).length, finalStatus: "done" }}
      </Task>
    </Workflow>
  );
});

process.on("beforeExit", () => {
  try {
    updateState("supervisor.status", "done");
    updateState("supervisor.summary", "Workflow completed successfully");
  } catch (err) {
    console.error("Failed to update final state:", err);
  }
});
