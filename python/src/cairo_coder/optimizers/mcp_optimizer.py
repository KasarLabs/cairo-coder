import marimo

__generated_with = "0.14.12"
app = marimo.App(width="medium")


@app.cell
def _():
    """Import dependencies and configure DSPy."""
    import json
    import time
    from pathlib import Path

    import dspy
    import psycopg2
    import structlog
    from dspy import MIPROv2
    from psycopg2 import OperationalError

    from cairo_coder.config.manager import ConfigManager



    logger = structlog.get_logger(__name__)
    global_config = ConfigManager.load_config()
    postgres_config = global_config.vector_store
    try:
        # Attempt to connect to PostgreSQL
        conn = psycopg2.connect(
            host=postgres_config.host,
            port=postgres_config.port,
            database=postgres_config.database,
            user=postgres_config.user,
            password=postgres_config.password,
        )
        conn.close()
        logger.info("PostgreSQL connection successful")
    except OperationalError as e:
        raise Exception(f"PostgreSQL is not running or not accessible: {e}") from e

    """Optional: Set up MLflow tracking for experiment monitoring."""
    # Uncomment to enable MLflow tracking
    import mlflow

    mlflow.set_tracking_uri("http://127.0.0.1:5000")
    mlflow.set_experiment("DSPy-Generation")
    mlflow.dspy.autolog()

    # Configure DSPy with Gemini
    lm = dspy.LM("gemini/gemini-2.5-flash", max_tokens=30000)
    dspy.settings.configure(lm=lm)
    logger.info("Configured DSPy with Gemini 2.5 Flash")

    return ConfigManager, MIPROv2, Path, dspy, json, lm, logger, time


@app.cell
def _(Path, dspy, json, logger):
    # """Load the Starklings dataset - for rag pipeline, just keep the query and expected."""

    def load_dataset(dataset_path: str) -> list[dspy.Example]:
        """Load dataset from JSON file."""
        with open(dataset_path, encoding="utf-8") as f:
            data = json.load(f)

        examples = []
        for ex in data["examples"]:
            example = dspy.Example(
                query=ex["query"],
            ).with_inputs("query")
            examples.append(example)

        logger.info("Loaded dataset", count=len(examples))
        return examples

    # Load dataset
    dataset_path = "optimizers/datasets/mcp_dataset.json"
    if not Path(dataset_path).exists():
        raise FileNotFoundError(
            "Dataset not found. Please run uv run generate_starklings_dataset first."
        )

    examples = load_dataset(dataset_path)

    # Split dataset (70/30 for train/val)
    split_idx = int(0.7 * len(examples))
    trainset = examples[:split_idx]
    valset = examples[split_idx:]

    logger.info(
        "Dataset split",
        train_size=len(trainset),
        val_size=len(valset),
        total=len(examples),
    )

    return trainset, valset


@app.cell
def _(ConfigManager, dspy):
    """Initialize the generation program."""
    # Initialize program
    from cairo_coder.core.types import DocumentSource, Message
    from cairo_coder.dspy.document_retriever import DocumentRetrieverProgram
    from cairo_coder.dspy.query_processor import QueryProcessorProgram

    class QueryAndRetrieval(dspy.Module):
        def __init__(self):
            config = ConfigManager.load_config()

            self.processor = QueryProcessorProgram()
            self.processor.load("optimizers/results/optimized_mcp_program.json")
            self.document_retriever = DocumentRetrieverProgram(vector_store_config=config.vector_store)

        def forward(
            self,
            query: str,
            chat_history: list[Message] | None = None,
            sources: list[DocumentSource] | None = None,
        ) -> dspy.Prediction:

            processed_query = self.processor.forward(query=query, chat_history=chat_history)
            document_list = self.document_retriever.forward(processed_query=processed_query)

            return dspy.Prediction(answer=document_list)

    query_retrieval_program = QueryAndRetrieval()
    return (query_retrieval_program,)


@app.cell
def _(dspy):
    # Defining our metrics here.

    class RetrievalRecallPrecision(dspy.Signature):
        """
        Compare a system's retrieval response to the query and to compute recall and precision.
        If asked to reason, enumerate key ideas in each response, and whether they are present in the expected output.
        """

        query: str = dspy.InputField()
        system_resources: list[str] = dspy.InputField(desc="A list of concatenated resources")
        reasoning: str = dspy.OutputField(desc="A short sentence, on why a selected resource will be useful. If it's not selected, reason about why it's not going to be useful. Start by Resource <resource_title>...")
        resource_note: float = dspy.OutputField(desc="A note between 0 and 1.0 on how useful the resource is to directly answer the query. 0 being completely unrelated, 1.0 being very relevant, 0.5 being 'not directly relatd but still informative'.")

    class RetrievalF1(dspy.Module):
        def __init__(self, threshold=0.33, decompositional=False):
            self.threshold = threshold
            self.rater = dspy.Predict(RetrievalRecallPrecision)

        def forward(self, example, pred, trace=None):
            parallel = dspy.Parallel(num_threads=10)
            batches = []
            for resource in pred.answer:
                batches.append((self.rater, dspy.Example(query=example.query, system_resources=resource).with_inputs("query", "system_resources"))),

            result = parallel(batches)

            resources_notes = [pred.resource_note for pred in result]
            reasonings = [pred.reasoning for pred in result]

            score = sum(resources_notes) / len(resources_notes) if len(resources_notes) != 0 else 0
            print(example.query)
            for (note, reason) in zip(resources_notes, reasonings, strict=False):
                print(f"Note: {note}, reason: {reason}")
            return score if trace is None else score >= self.threshold

    return (RetrievalF1,)


@app.cell
def _(RetrievalF1, query_retrieval_program, valset):
    def _():
        """Evaluate system, pre-optimization, using DSPy Evaluate framework."""
        from dspy.evaluate import Evaluate
        metric = RetrievalF1()

        # You can use this cell to run more comprehensive evaluation
        evaluator__ = Evaluate(devset=valset, num_threads=12, display_progress=True)
        return evaluator__(query_retrieval_program, metric=metric)


    baseline_score = _()
    return (baseline_score,)


@app.cell
def _(
    MIPROv2,
    RetrievalF1,
    logger,
    query_retrieval_program,
    time,
    trainset,
    valset,
):
    """Run optimization using MIPROv2."""

    metric = RetrievalF1()


    def run_optimization(trainset, valset):
        """Run the optimization process using MIPROv2."""
        logger.info("Starting optimization process")

        # Configure optimizer
        optimizer = MIPROv2(
            metric=metric,
            auto="light",
            num_threads=12,

        )

        # Run optimization
        start_time = time.time()
        optimized_program = optimizer.compile(
            query_retrieval_program, trainset=trainset, valset=valset, requires_permission_to_run=False
        )
        duration = time.time() - start_time

        logger.info(
            "Optimization completed",
            duration=f"{duration:.2f}s",
        )

        return optimized_program, duration

    # Run the optimization
    optimized_program, optimization_duration = run_optimization(trainset, valset)

    return optimization_duration, optimized_program


@app.cell
def _(RetrievalF1, optimized_program, valset):
    def _():
        """Evaluate system, post-optimization, using DSPy Evaluate framework."""
        from dspy.evaluate import Evaluate
        metric = RetrievalF1()

        # You can use this cell to run more comprehensive evaluation
        evaluator__ = Evaluate(devset=valset, num_threads=12, display_progress=True)
        return evaluator__(optimized_program, metric=metric)


    final_score = _()
    return (final_score,)


@app.cell
def _(baseline_score, final_score, lm, logger, optimization_duration):
    """Calculate improvement and cost metrics."""
    improvement = final_score - baseline_score

    # Calculate costs (rough approximation)
    cost = sum(
        [x["cost"] for x in lm.history if x["cost"] is not None]
    )  # cost in USD, as calculated by LiteLLM for certain providers

    # Log results
    logger.info(
        "Optimization results",
        baseline_score=f"{baseline_score:.3f}",
        final_score=f"{final_score:.3f}",
        improvement=f"{improvement:.3f}",
        duration=f"{optimization_duration:.2f}s",
        estimated_cost_usd=cost,
    )

    print("\nOptimization Summary:")
    print(f"Baseline Score: {baseline_score:.3f}")
    print(f"Final Score: {final_score:.3f}")
    print(f"Improvement: {improvement:.3f}")
    print(f"Duration: {optimization_duration:.2f}s")
    print(f"Estimated Cost: ${cost:.2f}")


    return


@app.cell
def _(Path, optimized_program):
    """Save optimized program and results."""
    # Ensure results directory exists
    Path("optimizers/results").mkdir(parents=True, exist_ok=True)

    # Save optimized program
    optimized_program.save("optimizers/results/optimized_mcp_program.json")

    print(optimized_program)


    # # Save results
    # with open("optimizers/results/optimization_mcp_results.json", "w", encoding="utf-8") as f:
    #     json.dump(results, f, indent=2, ensure_ascii=False)

    print("\nOptimization complete. Results saved to optimizers/results/")

    return


@app.cell
def _(optimized_program):
    """Test the optimized program with a sample query."""
    # Test with a sample query
    test_query = "Write a simple Cairo contract that implements a counter"

    response = optimized_program(
        query=test_query,
        chat_history="",
    )

    print(f"Test Query: {test_query}")
    print(f"\nGenerated Answer:\n{response}")

    return


@app.cell
def _(dspy):
    """Inspect DSPy history for debugging."""
    # Uncomment to inspect the last few calls
    dspy.inspect_history(n=1)
    return


@app.cell
def _():
    return


if __name__ == "__main__":
    app.run()
