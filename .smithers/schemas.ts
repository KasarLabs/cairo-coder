import { z } from "zod";

export const PlanSchema = z.object({
  taskName: z.string().describe("Name of the next task to implement"),
  research: z
    .string()
    .describe("What was discovered by examining the codebase"),
  implementationPrompt: z
    .string()
    .describe("Detailed prompt for the implementer"),
  filesToCreate: z.array(z.string()).describe("Files that need to be created"),
  filesToModify: z.array(z.string()).describe("Files that need to be modified"),
  nextSmallestUnit: z
    .string()
    .nullable()
    .describe("Next smallest atomic unit after this task"),
});

export const ImplementSchema = z.object({
  summary: z.string().describe("What was implemented"),
  filesChanged: z
    .array(z.string())
    .describe("Files that were created or modified"),
  testOutput: z.string().describe("Output from running pytest"),
  commitMessage: z.string().describe("Git commit message for this change"),
  nextSmallestUnit: z
    .string()
    .nullable()
    .describe("Next smallest atomic unit to implement"),
});

export const ReviewSchema = z.object({
  lgtm: z.boolean().describe("true ONLY if ALL checks pass"),
  review: z.string().describe("Summary of the review findings"),
  issues: z.array(z.string()).describe("Specific issues found"),
});

export const FixSchema = z.object({
  summary: z.string().describe("What was fixed"),
  filesChanged: z.array(z.string()).describe("Files that were modified"),
});

export const FinalReviewSchema = z.object({
  readyToMoveOn: z.boolean().describe("true ONLY if all criteria met"),
  reasoning: z
    .string()
    .describe("Why ready or not ready — feeds back into next pass"),
  qualityScore: z.number().min(1).max(10).describe("Overall quality score"),
});

export const PassTrackerSchema = z.object({
  totalIterations: z.number(),
  tasksCompleted: z.array(z.string()),
  summary: z.string(),
});
