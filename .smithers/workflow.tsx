import {
  createSmithers,
  Sequence,
  Ralph,
  renderMdx,
  zodSchemaToJsonExample,
} from "smithers-orchestrator";
import React from "react";
import { execSync } from "node:child_process";
import { planner, implementer, reviewer } from "./agents";
import { MAX_PASSES } from "./config";
import {
  PlanSchema,
  ImplementSchema,
  ReviewSchema,
  FixSchema,
  FinalReviewSchema,
  PassTrackerSchema,
} from "./schemas";

import PlanPrompt from "./prompts/plan.mdx";
import ImplementPrompt from "./prompts/implement.mdx";
import ReviewPrompt from "./prompts/review.mdx";
import FixPrompt from "./prompts/fix.mdx";
import FinalReviewPrompt from "./prompts/final-review.mdx";

// Use Workflow and Task from createSmithers — they include schema context
// and auto-inject outputSchema from the registry
const { smithers, tables, Workflow, Task, db } = createSmithers(
  {
    plan: PlanSchema,
    implement: ImplementSchema,
    review: ReviewSchema,
    fix: FixSchema,
    finalReview: FinalReviewSchema,
    passTracker: PassTrackerSchema,
  },
  { dbPath: ".smithers/workflow.db" },
);

// --- Supervisor state contract ---
// The takopi-smithers supervisor reads these keys from the `state` table
// to monitor health (heartbeat) and report status (Telegram updates).
(db as any).$client.exec(`
  CREATE TABLE IF NOT EXISTS state (
    key TEXT PRIMARY KEY, value TEXT NOT NULL,
    updated_at TEXT DEFAULT (datetime('now'))
  );
`);

function updateState(key: string, value: string) {
  (db as any).$client.run(
    "INSERT OR REPLACE INTO state (key, value, updated_at) VALUES (?, ?, datetime('now'))",
    [key, value],
  );
}

updateState("supervisor.status", "running");
updateState("supervisor.summary", "Workflow initialized");
updateState("supervisor.heartbeat", new Date().toISOString());

// Write heartbeat every 30s so the supervisor knows we're alive
setInterval(() => {
  try {
    updateState("supervisor.heartbeat", new Date().toISOString());
  } catch (err) {
    console.error("Failed to write heartbeat:", err);
  }
}, 30_000);

process.on("beforeExit", () => {
  try {
    updateState("supervisor.status", "done");
    updateState("supervisor.summary", "Workflow completed");
  } catch {}
});

function getWorkingTreeChangedFiles(): string[] {
  try {
    const status = execSync("git status --short", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });

    const files = status
      .split("\n")
      .map((line) => line.trimEnd())
      .filter(Boolean)
      .map((line) => line.slice(3).trim())
      .map((path) => {
        const renameParts = path.split(" -> ");
        return renameParts[renameParts.length - 1];
      });

    return [...new Set(files)].sort();
  } catch {
    return [];
  }
}

export default smithers((ctx) => {
  const specPath = ctx.input.specPath ?? "SPEC.md";

  // Read latest outputs
  const latestPlan = ctx.outputMaybe("plan", { nodeId: "plan" });
  const latestImpl = ctx.outputMaybe("implement", { nodeId: "implement" });
  const latestReview = ctx.outputMaybe("review", { nodeId: "review" });
  const latestFix = ctx.outputMaybe("fix", { nodeId: "fix" });
  const latestFinalReview = ctx.outputMaybe("finalReview", {
    nodeId: "final-review",
  });
  const passTracker = ctx.outputMaybe("passTracker", {
    nodeId: "pass-tracker",
  });

  const currentPass = passTracker?.totalIterations ?? 0;
  const done =
    (latestFinalReview?.readyToMoveOn ?? false) || currentPass >= MAX_PASSES;

  // Track completed tasks across passes
  const completedTasks = (passTracker?.tasksCompleted ?? []).join(", ");

  // Determine if we need fixes
  const needsFix =
    latestReview &&
    !latestReview.lgtm &&
    (latestReview.issues?.length ?? 0) > 0;

  const filesChangedForReview =
    (latestImpl?.filesChanged?.length ?? 0) > 0
      ? latestImpl!.filesChanged
      : getWorkingTreeChangedFiles();

  return (
    <Workflow name="cairo-coder-mcp-skill">
      <Ralph
        until={done}
        maxIterations={MAX_PASSES * 30}
        onMaxReached="return-last"
      >
        <Sequence>
          {/* 1. Plan — pick next atomic unit */}
          <Task
            id="plan"
            output={tables.plan}
            outputSchema={PlanSchema}
            agent={planner}
            retries={2}
          >
            {renderMdx(PlanPrompt, {
              specPath,
              completedTasks,
              pass: currentPass + 1,
              previousFeedback: latestFinalReview?.reasoning ?? null,
              schema: zodSchemaToJsonExample(PlanSchema),
            })}
          </Task>

          {/* 2. Implement — build it */}
          <Task
            id="implement"
            output={tables.implement}
            outputSchema={ImplementSchema}
            agent={implementer}
            retries={2}
          >
            {renderMdx(ImplementPrompt, {
              taskName: latestPlan?.taskName ?? "unknown",
              implementationPrompt: latestPlan?.implementationPrompt ?? "",
              filesToCreate: latestPlan?.filesToCreate ?? [],
              filesToModify: latestPlan?.filesToModify ?? [],
              previousWork: latestImpl,
              reviewFixes: latestFix?.summary ?? null,
              pass: currentPass + 1,
              schema: zodSchemaToJsonExample(ImplementSchema),
            })}
          </Task>

          {/* 3. Review — check quality */}
          <Task
            id="review"
            output={tables.review}
            outputSchema={ReviewSchema}
            agent={reviewer}
            retries={2}
          >
            {renderMdx(ReviewPrompt, {
              taskName: latestPlan?.taskName ?? "unknown",
              summary: latestImpl?.summary ?? "No summary",
              filesChanged: filesChangedForReview,
              testOutput: latestImpl?.testOutput ?? null,
              pass: currentPass + 1,
              schema: zodSchemaToJsonExample(ReviewSchema),
            })}
          </Task>

          {/* 4. Fix — address review issues (skip if lgtm) */}
          <Task
            id="fix"
            output={tables.fix}
            outputSchema={FixSchema}
            agent={implementer}
            retries={2}
            skipIf={!needsFix}
          >
            {renderMdx(FixPrompt, {
              taskName: latestPlan?.taskName ?? "unknown",
              issues: latestReview?.issues ?? [],
              reviewFeedback: latestReview?.review ?? null,
              pass: currentPass + 1,
              schema: zodSchemaToJsonExample(FixSchema),
            })}
          </Task>

          {/* 5. Final review gate — loop or done */}
          <Task
            id="final-review"
            output={tables.finalReview}
            outputSchema={FinalReviewSchema}
            agent={reviewer}
            retries={2}
          >
            {renderMdx(FinalReviewPrompt, {
              completedTasks,
              latestReview: latestReview?.review ?? null,
              pass: currentPass + 1,
              schema: zodSchemaToJsonExample(FinalReviewSchema),
            })}
          </Task>

          {/* Pass tracker */}
          <Task
            id="pass-tracker"
            output={tables.passTracker}
            outputSchema={PassTrackerSchema}
          >
            {{
              totalIterations: currentPass + 1,
              tasksCompleted: [
                ...(passTracker?.tasksCompleted ?? []),
                ...(latestFinalReview?.readyToMoveOn && latestPlan?.taskName
                  ? [latestPlan.taskName]
                  : []),
              ],
              summary: `Pass ${currentPass + 1} of ${MAX_PASSES} complete.`,
            }}
          </Task>
        </Sequence>
      </Ralph>
    </Workflow>
  );
});
