"""Starklings helper utilities for dataset generation and optimization."""

import os
import subprocess
from dataclasses import dataclass

import structlog
import toml

logger = structlog.get_logger(__name__)


@dataclass
class StarklingsExercise:
    """Represents a single exercise from the Starklings repository."""

    name: str
    path: str
    hint: str
    mode: str | None = "compile"


def ensure_starklings_repo(target_path: str) -> bool:
    """Ensures the Starklings repository is available at the given path."""
    repo_url = "https://github.com/enitrat/starklings-cairo1.git"
    branch = "feat/upgrade-cairo-and-use-scarb"

    if os.path.exists(target_path):
        logger.info("Starklings repository already exists", target_path=target_path)
        # Check if it's a valid git repo
        try:
            subprocess.run(
                ["git", "rev-parse", "--git-dir"],
                cwd=target_path,
                check=True,
                capture_output=True,
                text=True,
            )
            return True
        except subprocess.CalledProcessError:
            logger.warning(
                "Directory exists but is not a valid git repository", target_path=target_path
            )
            return False

    logger.info("Cloning Starklings repository", target_path=target_path)
    try:
        # Clone the repository
        subprocess.run(
            ["git", "clone", repo_url, target_path], check=True, capture_output=True, text=True
        )

        # Checkout the desired branch
        subprocess.run(
            ["git", "checkout", branch], cwd=target_path, check=True, capture_output=True, text=True
        )

        logger.info("Successfully cloned Starklings repository", target_path=target_path)
        return True

    except subprocess.CalledProcessError as e:
        logger.error(
            "Failed to clone Starklings repository", target_path=target_path, error=e.stderr
        )
        return False


def parse_starklings_info(info_path: str) -> list[StarklingsExercise]:
    """Parses the info.toml file and extracts exercise details."""
    try:
        with open(info_path, encoding="utf-8") as f:
            data = toml.load(f)

        exercises = data.get("exercises", [])
        logger.info("Parsed info.toml", exercise_count=len(exercises))

        return [
            StarklingsExercise(
                name=ex.get("name", f"exercise_{i}"),
                path=ex["path"],
                hint=ex.get("hint", ""),
                mode=ex.get("mode", "compile"),
            )
            for i, ex in enumerate(exercises)
        ]

    except (FileNotFoundError, KeyError) as e:
        logger.error("Failed to parse info.toml", info_path=info_path, error=e)
        raise e
