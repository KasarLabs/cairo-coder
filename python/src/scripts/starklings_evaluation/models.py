"""Data models for Starklings evaluation."""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

from cairo_coder.optimizers.generation.starklings_helper import StarklingsExercise


@dataclass
class StarklingsSolution:
    """Represents a solution attempt for a Starklings exercise."""

    exercise: StarklingsExercise
    generated_code: str
    api_response: dict[str, Any]
    compilation_result: dict[str, Any]
    success: bool
    error_message: str | None = None
    generation_time: float = 0.0
    compilation_time: float = 0.0

    @property
    def total_time(self) -> float:
        """Total time for generation and compilation."""
        return self.generation_time + self.compilation_time


@dataclass
class CategoryResult:
    """Results for exercises in a specific category."""

    category: str
    exercises: list[StarklingsSolution] = field(default_factory=list)

    @property
    def success_rate(self) -> float:
        """Calculate success rate for this category."""
        if not self.exercises:
            return 0.0
        successful = sum(1 for ex in self.exercises if ex.success)
        return successful / len(self.exercises)

    @property
    def total_exercises(self) -> int:
        """Total number of exercises in category."""
        return len(self.exercises)

    @property
    def successful_exercises(self) -> int:
        """Number of successful exercises."""
        return sum(1 for ex in self.exercises if ex.success)

    @property
    def total_time(self) -> float:
        """Total time for all exercises."""
        return sum(ex.total_time for ex in self.exercises)


@dataclass
class EvaluationRun:
    """Results from a single evaluation run."""

    run_id: int
    timestamp: datetime
    categories: dict[str, CategoryResult] = field(default_factory=dict)
    api_endpoint: str = "http://localhost:3001/v1/chat/completions"
    model: str = "cairo-coder"

    @property
    def all_exercises(self) -> list[StarklingsSolution]:
        """Get all exercises across categories."""
        exercises = []
        for category in self.categories.values():
            exercises.extend(category.exercises)
        return exercises

    @property
    def overall_success_rate(self) -> float:
        """Calculate overall success rate."""
        all_ex = self.all_exercises
        if not all_ex:
            return 0.0
        successful = sum(1 for ex in all_ex if ex.success)
        return successful / len(all_ex)

    @property
    def total_exercises(self) -> int:
        """Total number of exercises."""
        return len(self.all_exercises)

    @property
    def successful_exercises(self) -> int:
        """Number of successful exercises."""
        return sum(1 for ex in self.all_exercises if ex.success)

    @property
    def total_time(self) -> float:
        """Total time for the run."""
        return sum(cat.total_time for cat in self.categories.values())

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "run_id": self.run_id,
            "timestamp": self.timestamp.isoformat(),
            "api_endpoint": self.api_endpoint,
            "model": self.model,
            "overall_success_rate": self.overall_success_rate,
            "total_exercises": self.total_exercises,
            "successful_exercises": self.successful_exercises,
            "total_time": self.total_time,
            "categories": {
                name: {
                    "success_rate": cat.success_rate,
                    "total_exercises": cat.total_exercises,
                    "successful_exercises": cat.successful_exercises,
                    "total_time": cat.total_time,
                    "exercises": [
                        {
                            "name": sol.exercise.name,
                            "success": sol.success,
                            "error_message": sol.error_message,
                            "generation_time": sol.generation_time,
                            "compilation_time": sol.compilation_time,
                            "total_time": sol.total_time,
                        }
                        for sol in cat.exercises
                    ],
                }
                for name, cat in self.categories.items()
            },
        }


@dataclass
class ConsolidatedReport:
    """Consolidated results from multiple evaluation runs."""

    runs: list[EvaluationRun] = field(default_factory=list)

    @property
    def total_runs(self) -> int:
        """Number of runs."""
        return len(self.runs)

    @property
    def overall_success_rate(self) -> float:
        """Average success rate across all runs."""
        if not self.runs:
            return 0.0
        return sum(run.overall_success_rate for run in self.runs) / len(self.runs)

    def get_exercise_success_counts(self) -> dict[str, dict[str, int]]:
        """Get success counts for each exercise across runs."""
        counts = {}
        for run in self.runs:
            for cat_name, category in run.categories.items():
                if cat_name not in counts:
                    counts[cat_name] = {}
                for solution in category.exercises:
                    ex_name = solution.exercise.name
                    if ex_name not in counts[cat_name]:
                        counts[cat_name][ex_name] = {"success": 0, "total": 0}
                    counts[cat_name][ex_name]["total"] += 1
                    if solution.success:
                        counts[cat_name][ex_name]["success"] += 1
        return counts

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        exercise_counts = self.get_exercise_success_counts()
        return {
            "total_runs": self.total_runs,
            "overall_success_rate": self.overall_success_rate,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "runs": [run.to_dict() for run in self.runs],
            "exercise_summary": {
                cat_name: {
                    ex_name: {
                        "success_count": counts["success"],
                        "total_runs": counts["total"],
                        "success_rate": counts["success"] / counts["total"]
                        if counts["total"] > 0
                        else 0,
                    }
                    for ex_name, counts in exercises.items()
                }
                for cat_name, exercises in exercise_counts.items()
            },
        }
