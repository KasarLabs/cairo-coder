import marimo

__generated_with = "0.16.2"
app = marimo.App(width="medium")


@app.cell
def _():

    import os

    import dspy

    # Start mlflow for monitoring `mlflow ui --port 5000`
    from dspy.adapters.xml_adapter import XMLAdapter

    from cairo_coder.dspy.document_retriever import SourceFilteredPgVectorRM
    from cairo_coder.server.app import get_vector_store_config

    # Ensure the env var for optimizer is loaded (controls DB connection)
    if os.getenv("OPTIMIZER_RUN") is None:
        os.environ["OPTIMIZER_RUN"] = "true"
    assert os.getenv("OPTIMIZER_RUN") is not None, "OPTIMIZER_RUN should be active."

    # Ensure that LANGSMITH_TRACING is inactive (false)
    if os.getenv("LANGSMITH_TRACING"):
        os.environ["LANGSMITH_TRACING"] = "false"
    assert os.getenv("LANGSMITH_TRACING") != "true", "LANGSMITH_TRACING should be inactive."

    # mlflow.set_tracking_uri("http://127.0.0.1:5000")
    # mlflow.set_experiment("DSPy")
    # mlflow.dspy.autolog()

    ## Setup embedder and LM in dspy.configure
    embedder = dspy.Embedder("gemini/gemini-embedding-001", dimensions=3072, batch_size=512)
    lm = dspy.LM("gemini/gemini-flash-latest", max_tokens=30000, cache=False)
    dspy.configure(lm=lm, adapter=XMLAdapter(), embedder=embedder)

    ## Setup VectorDB for document retrieval - will use dspy.settings.embedder
    vector_store_config = get_vector_store_config()
    vector_db = SourceFilteredPgVectorRM(
        db_url=vector_store_config.dsn,
        pg_table_name=vector_store_config.table_name,
        content_field="content",
        fields=["id", "content", "metadata"],
        k=5,  # Default k, will be overridden by retriever
        include_similarity=True,
    )
    return XMLAdapter, dspy, os, vector_db, vector_store_config


@app.cell
def _(dspy, vector_db, vector_store_config):
    # Checking what responses look like without any Optimization / Training Set
    from cairo_coder.core.agent_factory import AgentFactory
    from cairo_coder.core.types import DocumentSource


    agent_factory = AgentFactory(vector_db=vector_db, vector_store_config=vector_store_config)
    documentation_fetcher = agent_factory.get_or_create_agent("dojo-agent", mcp_mode=True)

    # Why not using the RagPipeline directly? Because we want this optimizer run to focus only on the last part (program generation) without the module containing predictors related to fetching.

    class ProgramToOptimize(dspy.Module):
        def __init__(self):
            self.generation_program = documentation_fetcher.generation_program

        async def aforward(
            self,
            query: str,
            chat_history: list | None = None,
            mcp_mode: bool = False,
            sources: list[DocumentSource] | None = None,
        ) -> dspy.Prediction:
            context = await documentation_fetcher.aforward(query=query, mcp_mode=True)
            return await self.generation_program.aforward(
                query=query, context=context.answer, chat_history=None
            )

    generation_program = dspy.syncify(ProgramToOptimize())
    return ProgramToOptimize, generation_program


@app.cell
def _(dspy, os):
    import json
    import random
    dataset_path = f"{os.getcwd()}/optimizers/datasets/dojo_queries.json"
    with open(dataset_path, encoding="utf-8") as f:
        example_dataset = json.load(f)

    data = [dspy.Example({"query": d}).with_inputs("query") for d in example_dataset]

    # Take maximum 300 random values from the dataset
    random.seed(42)
    random.shuffle(data)
    data = data[0:min(300, len(data))]
    train_set = data[: int(len(data) * 0.33)]
    val_set = data[int(len(data) * 0.33) : int(len(data) * 0.66)]
    test_set = data[int(len(data) * 0.66) :]
    return data, test_set, train_set, val_set


@app.cell
def _(data, dspy, generation_program):
    # Extract cairo code from answer, if any

    # Selecting one example
    example = data[0]
    # Querying with the examples
    response = generation_program(example.query)
    print(response.answer)
    dspy.inspect_history(n=1)
    return


@app.cell
def _(XMLAdapter, dspy):
    # Defining our metrics here.
    from typing import Optional

    class AnswerRater(dspy.Signature):
        """
        Analyze the user's query and its generated response for Dojo development. Assign a score on how well the response answers the user's query, and provide feedback on what to improve based on your knowledge of Dojo, autonomous worlds, Cairo, and Starknet. Your analysis will be based on the following instructions:

        **Response Generation Guidelines:**

    1.  **Tone and Style:** Provide clear, practical responses focused on Dojo development. Use markdown
    formatting and code blocks (```cairo for Cairo code). Be concise but thorough, especially when
    explaining Dojo-specific concepts like Models, Systems, and World architecture.

    2.  **Context Grounding:** Base responses strictly on the provided Dojo documentation context.
    Do not introduce external knowledge or assumptions.

    3.  **Citations:**
        *   Cite sources using inline markdown links: `[descriptive text](url)`.
        *   Use URLs from the document headers or within the context.
        *   Never cite without a URL. If no URL is available, reference by name: "According to the Dojo Book..."
        *   Place citations naturally within sentences.

    4.  **Dojo-Specific Code Generation:**
        *   For Dojo models, show proper `#[dojo::model]` attributes and derive macros.
        *   For systems, demonstrate `#[dojo::contract]` with proper world dispatcher usage.
        *   Include necessary imports from `dojo::world::*`, `starknet::*`, etc.
        *   Show proper entity/component patterns using Dojo's ECS architecture.
        *   Demonstrate world configuration (dojo_*.toml) when relevant.
        *   Include Sozo CLI commands for deployment and interaction.
        *   NEVER include markdown links or citations inside code blocks.
        *   Keep comments minimal and focused on explaining the code.
        *   After code blocks, explain the Dojo-specific patterns used (Models, Systems, World, etc.)

    5.  **Dojo Concepts to Emphasize:**
        *   Models: Onchain state structures with `#[dojo::model]`
        *   Systems: Contract functions that modify world state
        *   World: Central registry and dispatcher for all Dojo contracts
        *   Entities: Unique identifiers for game objects
        *   ECS Architecture: Entity-Component-System pattern in Dojo
        *   Torii: Indexer for querying world state
        *   Katana: Local Starknet devnet for Dojo development
        *   Sozo: CLI tool for Dojo project management

    6.  **Dojo SDKs and Client Integration:**
        *   When relevant, mention appropriate Dojo SDKs for client-side integration:
        *   **JavaScript/TypeScript**: dojo.js SDK for web applications and Node.js
        *   **Unity**: Dojo Unity SDK for game development in Unity engine
        *   **Unreal Engine**: Dojo Unreal SDK for Unreal Engine games
        *   **Godot**: Dojo Godot SDK for Godot engine integration
        *   **Bevy**: Dojo Bevy SDK for Rust-based game engine
        *   **Rust**: Native Rust SDK for backend services and tooling
        *   **C**: Low-level C bindings for Dojo integration
        *   **Telegram**: SDK for building Telegram-based Dojo applications
        *   Show proper SDK usage patterns when queries involve client-world interaction
        *   Demonstrate how SDKs interact with Torii for querying and with World for transactions

    7.  **Out-of-Scope Queries:** If the query is unrelated to Dojo, onchain games, or autonomous worlds,
    respond appropriately.

    8.  **Insufficient Context:** If information is not in the provided context, state that clearly.

    9.  **User Satisfaction:** Provide helpful, practical answers. Respond in the same language as the query.

        """
        query: str = dspy.InputField(desc="The Dojo-related query of the user")
        answer: str = dspy.InputField(desc="The answer to the Dojo query")
        score: float = dspy.OutputField(
            desc="A confidence score in range [0, 1.0] on how precise, self-sufficient, and fully accurate the answer is for Dojo development. 0 means totally wrong or unhelpful; 0.5 means partially helpful but with issues (missing Dojo patterns, unclear ECS usage, wrong syntax); 1.0 means excellent Dojo answer with proper Models/Systems/World patterns, correct code, and helpful explanations."
        )
        feedback: Optional[str] = dspy.OutputField(
            desc="Textual feedback on how to improve the generated response for Dojo development. Focus on Dojo-specific patterns, ECS architecture, proper use of Models/Systems/World, and code quality."
        )

    ## Metrics for self-improvement: Rating whether the context provided can be used to answer the question properly or not.
    answer_rater = dspy.Predict(AnswerRater)

    def compute_metrics(gold, pred, trace=None) -> dict:
        with dspy.context(
            lm=dspy.LM("gemini/gemini-flash-lite-latest", max_tokens=30000), adapter=XMLAdapter()
        ):
            response_rating = answer_rater(
                query=gold.query,
                answer=pred.answer,
            )
        if response_rating.score > 1.0:
            response_rating.score /= 10

        return {"score": response_rating.score, "feedback": response_rating.feedback or ""}

    def compute_overall_score_with_feedback(
        gold, pred, trace=None, pred_name=None, pred_trace=None
    ):
        metrics = compute_metrics(gold, pred, trace)
        score = metrics["score"]
        llm_feedback = metrics["feedback"]
        if score < 0.2:
            import json
            from pathlib import Path

            # Create logs directory if it doesn't exist
            logs_dir = Path("optimizer_logs")
            logs_dir.mkdir(exist_ok=True)

            # Prepare data to save
            log_data = {
                "score": score,
                "gold": {"query": gold.query if hasattr(gold, "query") else str(gold)},
                "pred": {
                    "response": pred.answer
                },
                "feedback": llm_feedback,
            }

            # Save to JSON file with thread safety
            import threading
            log_file = logs_dir / "dojo_optimizer_logs.json"

            # Use a global lock for thread safety
            if not hasattr(compute_overall_score_with_feedback, '_log_lock'):
                compute_overall_score_with_feedback._log_lock = threading.Lock()

            with compute_overall_score_with_feedback._log_lock:
                # Load existing logs or create new list
                existing_logs = []
                if log_file.exists():
                    try:
                        with open(log_file) as f:
                            existing_logs = json.load(f)
                    except (json.JSONDecodeError, FileNotFoundError):
                        existing_logs = []

                # Append new log entry
                existing_logs.append(log_data)

                # Save updated logs
                with open(log_file, "w") as f:
                    json.dump(existing_logs, f, indent=2)
        feedback_text = f"The score assigned to this request is {score:.2f}. Here's an eventual associated feedback:\n {llm_feedback}"
        return dspy.Prediction(
            score=score,
            feedback=feedback_text,
        )
    return (compute_overall_score_with_feedback,)


@app.cell
def _(compute_overall_score_with_feedback, dspy, os):
    from dspy import GEPA
    gepa_run_dir = os.path.join(os.getcwd(), "./gepa-run-logs-dojo")
    prog_candidates_dir = os.path.join(gepa_run_dir, "prog_candidates")
    # Explicitly create inner prog_candidates to enable checkpoints
    os.makedirs(prog_candidates_dir, exist_ok=True)
    optimizer = GEPA(
        metric=compute_overall_score_with_feedback,
        max_metric_calls=500,
        num_threads=12,
        track_stats=True,
        log_dir="./gepa-run-logs-dojo",
        reflection_lm=dspy.LM(
            model="openai/gpt-5-codex", temperature=1.0, max_tokens=16000
        ),
    )
    return (optimizer,)


@app.cell
def _(generation_program, optimizer, train_set, val_set):
    optimized_program = optimizer.compile(
        generation_program,
        trainset=train_set,
        valset=val_set,
    )
    return (optimized_program,)


@app.cell
def _():
    return


@app.cell
def _(optimized_program):
    print(optimized_program)

    for name, pred in optimized_program.named_predictors():
        print("================================")
        print(f"Predictor: {name}")
        print("================================")
        print("Prompt:")
        print(pred.signature.instructions)
        print("*********************************")
    return


@app.cell
def _(optimized_program, os):
    os.makedirs("./optimizers/results", exist_ok=True)
    optimized_program.generation_program.save("./optimizers/results/optimized_generation_dojo-agent.json", save_program=False)
    return


@app.cell
def _(compute_overall_score_with_feedback, dspy, test_set):
    evaluate = dspy.Evaluate(
        devset=test_set,
        metric=compute_overall_score_with_feedback,
        num_threads=12,
        display_table=True,
        display_progress=True,
    )
    return (evaluate,)


@app.cell
def _(evaluate, generation_program):
    evaluate(generation_program)
    return


@app.cell
def _(evaluate, optimized_program):
    evaluate(optimized_program)
    return


@app.cell
def _(ProgramToOptimize, dspy, os):
    compiled_program_path = "./optimizers/results/optimized_generation_dojo-agent.json"
    if not os.path.exists(compiled_program_path):
        raise FileNotFoundError(f"{compiled_program_path} not found")

    loading_progr = dspy.syncify(ProgramToOptimize())
    loading_progr.generation_program.load(compiled_program_path)
    return (loading_progr,)


@app.cell
def _(evaluate, loading_progr):
    evaluate(loading_progr)
    return


@app.cell
def _():
    return


@app.cell
def _():
    return


if __name__ == "__main__":
    app.run()
