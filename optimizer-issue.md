# Issue: Optimize Generation Program Using AX-LLM for Improved Cairo Code Quality

## What
Implement an optimizer for the `generation.program.ts` using the AX-LLM library's MiPRO optimizer to automatically improve the prompt, select optimal demonstrations (demos), and enhance the overall performance of the code generation program. This includes:
- Creating a new dataset (`generation.dataset.ts`) with examples derived from Starklings exercises or similar Cairo coding challenges, where each example includes `chat_history`, `query`, `context` (simulated RAG output), and expected `answer` (valid, compilable Cairo code).
- Defining a quality metric function that primarily checks if the generated code compiles successfully (using Scarb or Starknet Foundry compilation tools), with potential extensions for semantic correctness.
- Setting up the optimizer script (`optimize-generation.ts`) similar to `optimize-retrieval.ts`, incorporating teacher-student model setup for cost efficiency, cost tracking, and checkpointing for fault tolerance.
- Integrating the Starklings evaluation script (from the provided source code) as part of the metric to automate compilation and testing against known exercises.
- Running the optimization process to generate optimized demos, saving them to a file (`optimized-generation-demos.json`), and updating `generationProgram.setDemos()` in `generation.program.ts`.
- Ensuring the optimizer targets a baseline score (e.g., 0.5 or 50% compilation success rate) and stops based on cost/token limits.

The output should be a fully functional optimizer that boosts the generation program's accuracy from potentially low baseline (e.g., 70% compilable code) to higher (e.g., 90%+), while reducing reliance on expensive models.

## Why
The current generation program relies on manual examples and prompts, which may lead to inconsistent or non-compilable Cairo code outputs, especially for complex Starknet contracts or language features. Optimizing it will:
- Improve code quality and reliability, ensuring generated Cairo/Starknet code is idiomatic, compilable, and adheres to best practices (e.g., proper traits, storage, imports).
- Align with the overall agent graph (Input → Retrieval → RAG → Generation), where optimized retrieval feeds into better generation, ultimately enhancing end-to-end performance.
- Reduce costs by using a cheaper "student" model (e.g., Gemini Flash) trained via a "teacher" model (e.g., Gemini Pro or GPT-4o), as per AX-LLM's teacher-student setup, potentially saving 50x on API calls.
- Enable data-driven improvements without manual prompt engineering, leveraging AX-LLM's automatic prompt refinement and demo selection.
- Facilitate evaluation against real-world benchmarks like Starklings, which provides a suite of exercises testing Cairo fundamentals (e.g., syntax, storage, testing), ensuring the optimizer focuses on compilable and functionally correct code.
- Prepare for future extensions, such as multi-objective metrics (e.g., compilation + execution success + code style), as the initial compilation metric is a simple starting point for measurable gains.

This step builds on the successful retrieval optimization, moving towards a fully optimized RAG-based Cairo code agent.

## How
Follow AX-LLM's optimization process step-by-step, drawing from the documentation's quick start, teacher-student setup, metrics, and checkpointing guidelines. Use Context7 to get the AX-LLM documentation on optimizers, and `optimize-retrieval.ts` as a base inspiration.

### Step 1: Create the Dataset (`generation.dataset.ts`)
- **What to do**: Export a `generationDataset` array of type `GenerationExample` (define an interface similar to `RetrievalExample` in `optimize-retrieval.ts`), each with `{ chat_history: string; query: string; context: string; expected: { answer: string } }`.
- **Sources**: Derive examples from Starklings exercises (clone the repo if needed, parse `info.toml` for hints and paths). Repo URL: https://github.com/enitrat/starklings-cairo1/tree/feat/upgrade-cairo-and-use-scarb. For each exercise:
  - `query`: Rephrase the exercise description as a user query (e.g., "How do I implement a simple counter contract?").
  - `context`: Get some RAG Context by doing a manual vector search in your script with our postgres DB. Note: you'll need to  `docker compose up postgres backend` to spin up the postgres DB with content. Concatenating relevant docs retrieved (see retrieval in RagPipeline)
  - `chat_history`: empty string
  - `expected.answer`: The correct, compilable solution code from Starklings solutions (in the repo, if available) or manually verified.
- **Quantity**: Start with 10 diverse examples covering categories like basic syntax, contracts, testing, etc. Ensure diversity (e.g., simple vs. complex, positive/negative cases where code should/shouldn't compile).
- **Why diverse**: AX-LLM docs emphasize "Good examples (diverse): 10 diverse examples beat 100 similar ones" for better generalization.
- **Output**: A file like:
  ```ts
  export interface GenerationExample { /* ... */ }
  export const generationDataset: GenerationExample[] = [ /* examples */ ];
  ```

### Step 2: Define the Metric Function
- **What to do**: Create `generationMetricFn: AxMetricFn` in `optimize-generation.ts`.
- **Initial Metric**: Focus on compilation success (1 if compiles, 0 otherwise).
  - Take inspiration from the provided Starklings script (`starklings-evaluate.js`) to build a new, senior-level Typescript script as inspiration: Integrate a function that writes the predicted `answer` to a temp file, runs `scarb build` or `snforge test` (via child_process.execSync), and checks exit code.
  - Handle edge cases: Clean up files, timeout (e.g., 10s), log errors.
- **Extensions**: Weighted score, e.g., 0.8 for compilation + 0.2 for matching expected output semantically (use string similarity or execution results).
- **Implementation**:
  ```ts
  const generationMetricFn: AxMetricFn = async ({ prediction, example }) => {
    // Write prediction.answer to temp cairo file
    // Run compilation command
    // Return 1 if success, 0 otherwise
  };
  ```
- **AX-LLM Tip**: Metrics define success; start simple (exact match) then nuance (e.g., add logging for debugging as in troubleshooting guide).

### Step 3: Set Up the Optimizer Script (`optimize-generation.ts`)
- **AI Setup**: Use teacher-student per AX-LLM docs for cost savings.
  - Student: Cheaper model (e.g., Gemini Flash via `AxAI` with `getGeminiApiKey()`).
  - Teacher: Optional expensive model (e.g., Gemini Pro or OpenAI GPT-4o) to generate better instructions.
- **Cost Tracking**: Use `AxDefaultCostTracker` with limits (e.g., maxTokens: 200000, maxCost: 0.5) to stop early.
- **Checkpointing**: Implement `checkpointSave` and `checkpointLoad` functions (JSON serialize to file/DB) for fault tolerance, with `checkpointInterval: 10`.
- **Optimizer Instantiation**: `AxMiPRO` as in retrieval optimizer.
  - Params: `studentAI`, `examples: generationDataset`, `targetScore: 0.5`, `verbose: true`, `costTracker`.
  - Options: `maxBootstrappedDemos: 15`, `maxLabeledDemos: 10`, `numTrials: 8` for thoroughness (scale from quick start's defaults).
- **Execution**: In `main()`, run `optimizer.compile(generationProgram, generationMetricFn)`, log results (duration, bestScore, stats), save demos to `optimized-generation-demos.json`.
- **Integration**: Update `generation.program.ts` to load and set demos:
  ```ts
  const generationDemos = JSON.parse(fs.readFileSync(path.join(__dirname, 'optimized-generation-demos.json'), 'utf8'));
  generationProgram.setDemos(generationDemos);
  ```
- **AX-LLM Process**: Follow quick start: Define program (existing `generationProgram`), provide examples, define metric, run optimizer, apply demos.

### Step 4: Integrate Starklings Script for Robust Testing
- **What to do**: Adapt the provided `starklings-evaluate.js` into a reusable Node module.
  - Functions: `parseInfoToml()`, `testExercise()` (modified to take code as input and return { success: boolean, error: string }).
  - Use in metric: For dataset examples tied to Starklings, run full evaluation (compilation + run).
- **Setup**: Ensure Scarb/Starknet Foundry installed in dev env; handle in CI via workflows (reference provided `starklings.yml` for GitHub Actions).
- **Debugging**: Enable `SAVE_RESPONSES` for logging generated code/errors.

### Step 5: Testing and Iteration
- **Baseline Run**: Before optimization, evaluate `generationProgram` on dataset to get initial score.
- **Run Optimization**: Expect 1-5 minutes per trial; monitor via `verbose: true`.
- **Post-Optimization**: Test on holdout examples; if score < target, add more diverse examples or adjust metric.
- **Troubleshooting (from AX-LLM docs)**: If low score, check example diversity; if expensive, lower `numTrials`; for inconsistency, set `temperature: 0.1`.

### Dependencies and Tools
- AX-LLM: Ensure `@ax-llm/ax` installed.
- Compilation: `scarb` (v2.11.4), Starknet Foundry.
- FS/Exec: Node's `fs`, `child_process`.

### Acceptance Criteria
- Optimizer script runs without errors, produces `optimized-generation-demos.json`.
- Best score >= target (e.g., 0.5), with logs showing improvement.
- Generated code in demos compiles successfully.
- Integration tested with 5-10 manual queries post-optimization.

Assign to: Dev team member familiar with AX-LLM and Cairo.
Estimated Effort: 2-3 days (dataset: 1 day, metric/script: 1 day, optimizer: 0.5 day).
