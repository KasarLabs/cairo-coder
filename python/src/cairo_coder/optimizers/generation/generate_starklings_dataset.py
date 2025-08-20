#!/usr/bin/env python3
"""Script to generate a dataset from Starklings exercises for optimization."""

import asyncio
import json
import os
import time
from dataclasses import asdict, dataclass
from pathlib import Path

import dspy
import structlog

from cairo_coder.config.manager import ConfigManager
from cairo_coder.dspy.context_summarizer import CairoContextSummarization
from cairo_coder.dspy.document_retriever import DocumentRetrieverProgram
from cairo_coder.dspy.query_processor import QueryProcessorProgram
from cairo_coder.optimizers.generation.starklings_helper import (
    StarklingsExercise,
    ensure_starklings_repo,
    parse_starklings_info,
)

logger = structlog.get_logger(__name__)


@dataclass
class GenerationExample:
    """A dataset entry for optimization."""

    query: str
    chat_history: str
    context: str
    expected: str


def get_context_for_query(full_query: str, config) -> str:
    """Get context using RAG and summarize it."""
    try:
        # Create instances per task to avoid shared state issues
        document_retriever = DocumentRetrieverProgram(vector_store_config=config.vector_store)
        query_processor = dspy.syncify(QueryProcessorProgram())
        context_summarizer = dspy.ChainOfThought(CairoContextSummarization)

        processed_query = query_processor.forward(query=full_query)

        # Get raw context from vector store with timeout
        raw_context = ""
        retrieved_docs = document_retriever.forward(processed_query)

        for doc in retrieved_docs:
            raw_context += doc.page_content

        if not raw_context:
            logger.warning("No context found for query", query=full_query[:100] + "...")
            return ""

        # Summarize the context with timeout
        summarized_response = context_summarizer.forward(
            processed_query=processed_query, raw_context=raw_context
        )
        return summarized_response.summarized_context
    except Exception as e:
        logger.error("Failed to get context", error=str(e), query=full_query[:100] + "...")
        return ""


def process_exercise(exercise: StarklingsExercise, config) -> GenerationExample | None:
    """Process a single exercise into a dataset example."""
    try:
        # Read exercise code
        exercise_path = Path("temp/starklings-cairo1") / exercise.path
        if not exercise_path.exists():
            logger.warning("Exercise file not found", path=str(exercise_path), name=exercise.name)
            return None

        # Read solution
        solution_path = Path("temp/starklings-cairo1") / exercise.path.replace(
            "exercises", "solutions"
        )
        if not solution_path.exists():
            logger.warning("Solution file not found", path=str(solution_path), name=exercise.name)
            return None

        # Read files with error handling
        try:
            with open(exercise_path, encoding="utf-8") as f:
                exercise_code = f.read().strip()
            with open(solution_path, encoding="utf-8") as f:
                solution_code = f.read().strip()
        except UnicodeDecodeError:
            logger.error("Failed to read files due to encoding issues", name=exercise.name)
            return None

        if not exercise_code or not solution_code:
            logger.warning("Empty exercise or solution code", name=exercise.name)
            return None

        # Format query
        query = f"Complete the following Cairo code and address the TODOs:\n\n```cairo\n{exercise_code}\n```\n\nHint: {exercise.hint}"

        # Get context with retry
        context = get_context_for_query(query, config)
        if not context:
            logger.warning("Skipping exercise due to missing context", name=exercise.name)
            return None

        # Create example
        return GenerationExample(
            query=query,
            chat_history="",
            context=context,
            expected=solution_code,
        )

    except Exception as e:
        logger.error("Failed to process exercise", name=exercise.name, error=str(e), traceback=True)
        return None


async def generate_dataset() -> list[GenerationExample]:
    """Generate the complete dataset from Starklings exercises."""
    # Load config once
    config = ConfigManager.load_config()

    # Ensure Starklings repo exists
    success = ensure_starklings_repo("temp/starklings-cairo1")
    if not success:
        raise RuntimeError("Failed to setup Starklings repository")

    # Parse exercises
    info_path = Path("temp/starklings-cairo1/info.toml")
    exercises = parse_starklings_info(str(info_path))
    logger.info("Found exercises", count=len(exercises))

    # Reduce concurrent operations to prevent database connection exhaustion
    max_concurrent = min(5, len(exercises))  # Reduced from 20 to 5
    semaphore = asyncio.Semaphore(max_concurrent)

    async def process_with_semaphore(exercise):
        async with semaphore:
            try:
                return await process_exercise(exercise, config)
            except Exception as e:
                logger.error("Exercise processing failed", exercise=exercise.name, error=str(e))
                return None

    # Process all exercises concurrently
    tasks = [process_with_semaphore(exercise) for exercise in exercises]
    results = await asyncio.gather(*tasks, return_exceptions=False)

    # Filter successful results
    examples = [result for result in results if result is not None]

    # Sort by exercise name (intro/00 first)
    examples.sort(key=lambda x: x.query)

    logger.info("Dataset generation completed", processed=len(examples), total=len(exercises))
    return examples


def save_dataset(examples: list[GenerationExample], output_path: str):
    """Save dataset to JSON file."""
    logger.info("Saving dataset", examples=examples, output_path=output_path)
    # Ensure output directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    # Prepare data for JSON serialization
    data = {
        "examples": [asdict(ex) for ex in examples],
        "metadata": {
            "count": len(examples),
            "source": "starklings",
            "generated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        },
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    logger.info("Dataset saved", path=output_path, count=len(examples))


async def main():
    """Main function to generate the dataset."""
    examples = await generate_dataset()
    output_path = "optimizers/datasets/generation_dataset.json"
    save_dataset(examples, output_path)

    logger.info("Dataset generation completed", count=len(examples))


def cli_main():
    """CLI entry point for dataset generation."""
    asyncio.run(main())


if __name__ == "__main__":
    cli_main()
