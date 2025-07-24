"""Core evaluation logic for Starklings exercises."""

import asyncio
import time
from datetime import datetime, timezone
from pathlib import Path

import structlog

from cairo_coder.optimizers.generation import utils
from cairo_coder.optimizers.generation.starklings_helper import (
    StarklingsExercise,
    ensure_starklings_repo,
    parse_starklings_info,
)

from .api_client import CairoCoderAPIClient, extract_code_from_response
from .models import CategoryResult, EvaluationRun, StarklingsSolution

logger = structlog.get_logger(__name__)


class StarklingsEvaluator:
    """Evaluates Starklings exercises using Cairo Coder API."""

    def __init__(
        self,
        api_endpoint: str = "http://localhost:3001",
        model: str = "cairo-coder",
        starklings_path: str = "./starklings-cairo1",
        timeout: int = 120,
    ):
        """Initialize evaluator.

        Args:
            api_endpoint: Cairo Coder API endpoint
            model: Model name to use
            starklings_path: Path to Starklings repository
            timeout: API timeout in seconds
        """
        self.api_endpoint = api_endpoint
        self.model = model
        self.starklings_path = Path(starklings_path)
        self.timeout = timeout
        self.exercises: list[StarklingsExercise] = []
        self.exercises_by_category: dict[str, list[StarklingsExercise]] = {}

    def setup(self) -> bool:
        """Setup Starklings repository and parse exercises.

        Returns:
            True if setup successful
        """
        # Ensure repository exists
        if not ensure_starklings_repo(self.starklings_path):
            logger.error("Failed to setup Starklings repository")
            return False

        # Parse exercises
        info_path = self.starklings_path / "info.toml"
        self.exercises = parse_starklings_info(info_path)

        if not self.exercises:
            logger.error("No exercises found in info.toml")
            return False

        # Group by category
        self.exercises_by_category = {}
        for exercise in self.exercises:
            # Extract category from path (e.g., "exercises/intro/intro1.cairo" -> "intro")
            category = exercise.path.split("exercises/")[1].split("/")[0] if "exercises/" in exercise.path else "default"
            if category not in self.exercises_by_category:
                self.exercises_by_category[category] = []
            self.exercises_by_category[category].append(exercise)

        logger.info(
            "Starklings setup complete",
            total_exercises=len(self.exercises),
            categories=list(self.exercises_by_category.keys()),
        )
        return True

    def _create_prompt(self, exercise: StarklingsExercise, exercise_content: str, extra_msg: str | None = None) -> str:
        """Create prompt for the API.

        Args:
            exercise: Starklings exercise
            exercise_content: Content of the exercise file

        Returns:
            Formatted prompt
        """
        prompt = (
            f"Solve the following Cairo exercise named '{exercise.name}'. You have to make the code compile and pass the tests, if any.:\n\n"
            f"```cairo\n{exercise_content}\n```\n\n"
        )
        if extra_msg:
            prompt += f"Currently, the code is not compiling. The error is: {extra_msg}"

        if exercise.hint:
            prompt += f"Hint: {exercise.hint}\n\n"

        prompt += (
            "Please provide a complete, working solution that compiles successfully. "
            "Return only the Cairo code without any explanations."
        )

        return prompt

    def _read_exercise_file(self, exercise: StarklingsExercise) -> str | None:
        """Read exercise file content.

        Args:
            exercise: Starklings exercise

        Returns:
            File content or None if error
        """
        exercise_path = self.starklings_path / exercise.path

        try:
            return exercise_path.read_text(encoding="utf-8")
        except Exception as e:
            logger.error(
                "Failed to read exercise file",
                exercise=exercise.name,
                path=str(exercise_path),
                error=str(e),
            )
            return None

    def _save_debug_files(
        self,
        exercise: StarklingsExercise,
        generated_code: str,
        output_dir: Path,
        error: str | None = None,
    ) -> None:
        """Save debug files for an exercise.

        Args:
            exercise: Starklings exercise
            generated_code: Generated code
            output_dir: Output directory
            error: Optional error message
        """
        try:
            debug_dir = output_dir / "debug"
            debug_dir.mkdir(parents=True, exist_ok=True)

            # Save generated code
            if generated_code:
                code_file = debug_dir / f"{exercise.name}_generated.cairo"
                code_file.write_text(generated_code, encoding="utf-8")
                logger.debug("Saved generated code", exercise=exercise.name, file=str(code_file))

            # Save error if present
            if error:
                error_file = debug_dir / f"{exercise.name}_error.txt"
                error_file.write_text(error, encoding="utf-8")
                logger.debug("Saved error file", exercise=exercise.name, file=str(error_file))

        except Exception as e:
            logger.warning("Failed to save debug files", exercise=exercise.name, error=str(e))

    async def evaluate_exercise(
        self,
        exercise: StarklingsExercise,
        api_client: CairoCoderAPIClient,
        output_dir: Path,
    ) -> StarklingsSolution:
        """Evaluate a single exercise.

        Args:
            exercise: Exercise to evaluate
            api_client: API client instance
            output_dir: Output directory for debug files

        Returns:
            Solution result
        """
        logger.info("Evaluating exercise", exercise=exercise.name)

        # Read exercise file
        exercise_content = self._read_exercise_file(exercise)
        if not exercise_content:
            return StarklingsSolution(
                exercise=exercise,
                generated_code="",
                api_response={},
                compilation_result={"success": False, "error": "Failed to read exercise file"},
                success=False,
                error_message="Failed to read exercise file",
            )

        # Create prompt
        pre_compilation_result = utils.check_compilation(exercise_content, save_failed_code=False)
        prompt = self._create_prompt(exercise, exercise_content, pre_compilation_result.get("error"))

        # Call API
        try:
            api_result = await api_client.generate_solution(prompt)
            generation_time = api_result.get("generation_time", 0.0)

            # Extract code
            raw_response = extract_code_from_response(api_result)
            if not raw_response:
                raise Exception("No code in response")

            generated_code = utils.extract_cairo_code(raw_response)
            if not generated_code:
                raise Exception("Failed to extract Cairo code from response")

            # Save debug files
            self._save_debug_files(exercise, generated_code, output_dir)

            # Test compilation
            start_compile = time.time()
            compilation_result = utils.check_compilation(generated_code, save_failed_code=True)
            compilation_time = time.time() - start_compile

            success = compilation_result.get("success", False)

            return StarklingsSolution(
                exercise=exercise,
                generated_code=generated_code,
                api_response=api_result,
                compilation_result=compilation_result,
                success=success,
                error_message=compilation_result.get("error") if not success else None,
                generation_time=generation_time,
                compilation_time=compilation_time,
            )

        except Exception as e:
            logger.error("Failed to evaluate exercise", exercise=exercise.name, error=str(e))
            # Save error for debugging
            self._save_debug_files(exercise, "", output_dir, error=str(e))

            return StarklingsSolution(
                exercise=exercise,
                generated_code="",
                api_response={},
                compilation_result={"success": False, "error": str(e)},
                success=False,
                error_message=str(e),
            )

    async def evaluate_category(
        self,
        category: str,
        exercises: list[StarklingsExercise],
        api_client: CairoCoderAPIClient,
        output_dir: Path,
        max_concurrent: int = 5,
    ) -> CategoryResult:
        """Evaluate all exercises in a category.

        Args:
            category: Category name
            exercises: List of exercises
            api_client: API client instance
            output_dir: Output directory
            max_concurrent: Maximum concurrent evaluations

        Returns:
            Category results
        """
        logger.info("Evaluating category", category=category, exercises=len(exercises))

        result = CategoryResult(category=category)

        # Create semaphore for rate limiting
        semaphore = asyncio.Semaphore(max_concurrent)

        async def eval_with_semaphore(exercise: StarklingsExercise) -> StarklingsSolution:
            async with semaphore:
                return await self.evaluate_exercise(exercise, api_client, output_dir)

        # Evaluate all exercises concurrently
        tasks = [eval_with_semaphore(ex) for ex in exercises]
        solutions = await asyncio.gather(*tasks)

        result.exercises = solutions

        logger.info(
            "Category evaluation complete",
            category=category,
            success_rate=result.success_rate,
            successful=result.successful_exercises,
            total=result.total_exercises,
        )

        return result

    async def run_evaluation(
        self,
        run_id: int,
        output_dir: Path,
        category_filter: str | None = None,
        max_concurrent: int = 5,
    ) -> EvaluationRun:
        """Run a complete evaluation.

        Args:
            run_id: Run identifier
            output_dir: Output directory
            category_filter: Optional category to filter
            max_concurrent: Maximum concurrent evaluations

        Returns:
            Evaluation run results
        """
        logger.info("Starting evaluation run", run_id=run_id, category_filter=category_filter)

        run = EvaluationRun(
            run_id=run_id,
            timestamp=datetime.now(timezone.utc),
            api_endpoint=self.api_endpoint,
            model=self.model,
        )

        # Filter categories if needed
        categories_to_eval = self.exercises_by_category
        if category_filter:
            if category_filter in categories_to_eval:
                categories_to_eval = {category_filter: categories_to_eval[category_filter]}
            else:
                logger.warning(
                    "Category not found",
                    category=category_filter,
                    available=list(self.exercises_by_category.keys()),
                )
                return run

        # Evaluate each category
        async with CairoCoderAPIClient(
            base_url=self.api_endpoint, model=self.model, timeout=self.timeout
        ) as api_client:
            for category, exercises in categories_to_eval.items():
                category_result = await self.evaluate_category(
                    category, exercises, api_client, output_dir, max_concurrent
                )
                run.categories[category] = category_result

        logger.info(
            "Evaluation run complete",
            run_id=run_id,
            overall_success_rate=run.overall_success_rate,
            successful=run.successful_exercises,
            total=run.total_exercises,
            time=run.total_time,
        )

        return run
