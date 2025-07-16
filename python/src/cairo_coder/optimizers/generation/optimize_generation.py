#!/usr/bin/env python3
"""Script to optimize the generation program using DSPy and the Starklings dataset."""

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

    logger.info("Loaded dataset", count=len(examples), examples=examples)
    return examples

def evaluate_baseline(examples: List[dspy.Example]) -> float:
    """Evaluate baseline performance on first 5 examples."""
    logger.info("Evaluating baseline performance")

    program = GenerationProgram()
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

def run_optimization(trainset: List[dspy.Example], valset: List[dspy.Example]) -> tuple:
    """Run the optimization process using MIPROv2."""
    logger.info("Starting optimization process")

    # Initialize program
    program = GenerationProgram()

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
        valset=valset,  # Use trainset for validation
    )
    duration = time.time() - start_time

    logger.info(
        "Optimization completed",
        duration=f"{duration:.2f}s",
    )

    return optimized_program, duration

def main():
    """Main optimization workflow."""
    logger.info("Starting generation program optimization")

    # Setup DSPy
    lm = dspy.LM("gemini/gemini-2.5-flash", max_tokens=30000)
    dspy.settings.configure(lm=lm)
    logger.info("Configured DSPy with Gemini 2.5 Flash")

    # Load dataset
    dataset_path = "optimizers/datasets/generation_dataset.json"
    if not Path(dataset_path).exists():
        logger.error("Dataset not found. Please run generate_starklings_dataset.py first.")
        return

    examples = load_dataset(dataset_path)

    # Split dataset (70/30 for train/val)
    split_idx = int(0.7* len(examples))
    trainset = examples
    trainset = examples[:split_idx]
    valset = examples[split_idx:]

    logger.info(
        "Dataset split",
        train_size=len(trainset),
        val_size=len(valset),
        total=len(examples),
    )

    # Evaluate baseline
    baseline_score = evaluate_baseline(trainset)

    # Run optimization
    optimized_program, duration = run_optimization(trainset, valset)

    # Save optimized program
    optimized_program.save("optimizers/results/optimized_generation_program.json")
    logger.info("Optimization complete. Results saved to optimizers/results/")



    # Evaluate final performance
    final_scores = []
    for example in valset:  # Test on validation set
        try:
            prediction = optimized_program.forward(
                query=example.query,
                chat_history=example.chat_history,
                context=example.context,
            )
            score = generation_metric(example, prediction)
            final_scores.append(score)
        except Exception as e:
            logger.error("Error in final evaluation", error=str(e))
            final_scores.append(0.0)

    final_score = sum(final_scores) / len(final_scores) if final_scores else 0.0
    improvement = final_score - baseline_score

    # Calculate costs (rough approximation)
    cost = sum([x['cost'] for x in lm.history if x['cost'] is not None])  # cost in USD, as calculated by LiteLLM for certain providers

    # Log results
    logger.info(
        "Optimization results",
        baseline_score=f"{baseline_score:.3f}",
        final_score=f"{final_score:.3f}",
        improvement=f"{improvement:.3f}",
        duration=f"{duration:.2f}s",
        estimated_cost_usd=cost,
    )

    # Save results
    results = {
        "baseline_score": baseline_score,
        "final_score": final_score,
        "improvement": improvement,
        "duration": duration,
        "estimated_cost_usd": cost,
    }

    # Ensure results directory exists
    Path("optimizers/results").mkdir(parents=True, exist_ok=True)

    with open("optimizers/results/optimization_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    main()
