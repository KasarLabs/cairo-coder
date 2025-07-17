import marimo

__generated_with = "0.14.11"
app = marimo.App(width="medium")


@app.cell
def _():
    """Import dependencies and configure DSPy."""
    import json
    import time
    from pathlib import Path
    from typing import List

    import dspy
    import structlog
    from dspy import MIPROv2

    from cairo_coder.dspy.generation_program import GenerationProgram
    from cairo_coder.optimizers.generation.utils import generation_metric

    logger = structlog.get_logger(__name__)


    """Optional: Set up MLflow tracking for experiment monitoring."""
    # Uncomment to enable MLflow tracking
    import mlflow
    mlflow.set_tracking_uri("http://127.0.0.1:5000")
    mlflow.set_experiment("DSPy-Generation")
    mlflow.dspy.autolog()

    # Configure DSPy with Gemini
    lm = dspy.LM("gemini/gemini-2.5-flash", max_tokens=30000)
    dspy.configure(lm=lm)
    logger.info("Configured DSPy with Gemini 2.5 Flash")

    return (
        GenerationProgram,
        List,
        MIPROv2,
        Path,
        dspy,
        generation_metric,
        json,
        lm,
        logger,
        time,
    )


@app.cell
def _(List, Path, dspy, json, logger):
    """Load the Starklings dataset."""

    def load_dataset(dataset_path: str) -> List[dspy.Example]:
        """Load dataset from JSON file."""
        with open(dataset_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        examples = []
        for ex in data["examples"]:
            example = dspy.Example(
                query=ex["query"],
                chat_history=ex["chat_history"],
                context=ex["context"],
                expected=ex["expected"],
            ).with_inputs("query", "chat_history", "context")
            examples.append(example)

        logger.info("Loaded dataset", count=len(examples))
        return examples

    # Load dataset
    dataset_path = "optimizers/datasets/generation_dataset.json"
    if not Path(dataset_path).exists():
        raise FileNotFoundError(
            "Dataset not found. Please run generate_starklings_dataset.py first."
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
def _(GenerationProgram):
    """Initialize the generation program."""
    # Initialize program
    program = GenerationProgram()
    return (program,)


@app.cell
def _(generation_metric, logger, program, trainset):
    """Evaluate baseline performance on first 5 examples."""

    def evaluate_baseline(examples):
        """Evaluate baseline performance on first 5 examples."""
        logger.info("Evaluating baseline performance")

        scores = []

        for i, example in enumerate(examples[:5]):
            try:
                prediction = program.forward(
                    query=example.query,
                    chat_history=example.chat_history,
                    context=example.context,
                )
                score = generation_metric(example, prediction)
                scores.append(score)
                logger.debug(
                    "Baseline evaluation",
                    example=i,
                    score=score,
                    query=example.query[:50] + "...",
                )
            except Exception as e:
                logger.error("Error in baseline evaluation", example=i, error=str(e))
                scores.append(0.0)

        avg_score = sum(scores) / len(scores) if scores else 0.0
        logger.info("Baseline evaluation complete", average_score=avg_score)
        return avg_score

    # Run baseline evaluation
    baseline_score = evaluate_baseline(trainset)
    print(f"Baseline score: {baseline_score:.3f}")

    return (baseline_score,)


@app.cell
def _(MIPROv2, generation_metric, logger, program, time, trainset, valset):
    """Run optimization using MIPROv2."""

    def run_optimization(trainset, valset):
        """Run the optimization process using MIPROv2."""
        logger.info("Starting optimization process")

        # Configure optimizer
        optimizer = MIPROv2(
            metric=generation_metric,
            auto="light",
            max_bootstrapped_demos=4,
            max_labeled_demos=4,
        )

        # Run optimization
        start_time = time.time()
        optimized_program = optimizer.compile(
            program,
            trainset=trainset,
            valset=valset,
            requires_permission_to_run=False
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
def _(generation_metric, logger, optimized_program, valset):
    """Evaluate optimized program performance on validation set."""
    # Evaluate final performance
    final_scores = []
    for i, example in enumerate(valset):
        try:
            prediction = optimized_program.forward(
                query=example.query,
                chat_history=example.chat_history,
                context=example.context,
            )
            score = generation_metric(example, prediction)
            final_scores.append(score)
        except Exception as e:
            logger.error("Error in final evaluation", example=i, error=str(e))
            final_scores.append(0.0)

    final_score = sum(final_scores) / len(final_scores) if final_scores else 0.0

    print(f"Final score on validation set: {final_score:.3f}")

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

    print(f"\nOptimization Summary:")
    print(f"Baseline Score: {baseline_score:.3f}")
    print(f"Final Score: {final_score:.3f}")
    print(f"Improvement: {improvement:.3f}")
    print(f"Duration: {optimization_duration:.2f}s")
    print(f"Estimated Cost: ${cost:.2f}")

    results = {
        "baseline_score": baseline_score,
        "final_score": final_score,
        "improvement": improvement,
        "duration": optimization_duration,
        "estimated_cost_usd": cost,
    }

    return (results,)


@app.cell
def _(Path, json, optimized_program, results):
    """Save optimized program and results."""
    # Ensure results directory exists
    Path("optimizers/results").mkdir(parents=True, exist_ok=True)

    # Save optimized program
    optimized_program.save("optimizers/results/optimized_generation_program.json")

    # Save results
    with open("optimizers/results/optimization_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print("\nOptimization complete. Results saved to optimizers/results/")

    return


@app.cell
def _(generation_metric, optimized_program, valset):
    """Evaluate system using DSPy Evaluate framework."""
    from dspy.evaluate import Evaluate

    # You can use this cell to run more comprehensive evaluation
    evaluator = Evaluate(devset=valset, num_threads=3, display_progress=True)
    evaluator(optimized_program, metric=generation_metric)

    return


@app.cell
def _(optimized_program):
    """Test the optimized program with a sample query."""
    # Test with a sample query
    test_query = "Write a simple Cairo contract that implements a counter"
    test_context = "Use the latest Cairo syntax and best practices"

    response = optimized_program(
        query=test_query,
        chat_history="",
        context=test_context
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
