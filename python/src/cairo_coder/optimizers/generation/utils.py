"""Utility functions for code extraction and compilation verification."""

import re
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Any

import dspy
import structlog

logger = structlog.get_logger(__name__)


def extract_cairo_code(answer: str) -> str | None:
    """Extract Cairo code from a string, handling code blocks and plain code."""
    if not answer:
        return None

    # Try to extract code blocks first
    code_blocks = re.findall(r"```(?:cairo|rust)?\n([\s\S]*?)```", answer)
    if code_blocks:
        return "\n".join(block.strip() for block in code_blocks)

    # Fallback: check if it looks like code
    answer = answer.strip()
    if any(keyword in answer for keyword in ["mod ", "fn ", "#[", "use ", "struct ", "enum "]):
        return answer

    return None


def check_compilation(code: str) -> dict[str, Any]:
    """Check if Cairo code compiles using Scarb."""
    temp_dir = None
    try:
        # Create temporary directory
        temp_dir = tempfile.mkdtemp(prefix="cairo_compile_")

        # Copy runner crate template
        runner_crate_path = Path("../fixtures/runner_crate")
        if not runner_crate_path.exists():
            raise FileNotFoundError(
                f"Runner crate template not found at absolute path: {runner_crate_path.absolute()}"
            )

        project_dir = Path(temp_dir) / "test_project"
        shutil.copytree(runner_crate_path, project_dir)

        # Write code to lib.cairo
        lib_file = project_dir / "src" / "lib.cairo"
        lib_file.write_text(code, encoding="utf-8")

        # Run scarb build
        result = subprocess.run(
            ["scarb", "build"], cwd=project_dir, capture_output=True, text=True, timeout=30
        )

        if result.returncode == 0:
            return {"success": True}
        error_msg = result.stderr or result.stdout or "Compilation failed"

        # Save failed code for debugging
        error_logs_dir = Path("error_logs")
        error_logs_dir.mkdir(exist_ok=True)

        next_index = len(list(error_logs_dir.glob("run_*.cairo")))
        failed_file = error_logs_dir / f"run_{next_index}.cairo"

        # Append error message as comment to the code
        error_lines = error_msg.split("\n")
        commented_error = "\n".join(f"// {line}" for line in error_lines)
        code_with_error = f"{commented_error}\n\n{code}"
        failed_file.write_text(code_with_error, encoding="utf-8")

        logger.debug("Saved failed compilation code", file=str(failed_file))
        return {"success": False, "error": error_msg}

    except subprocess.TimeoutExpired:
        return {"success": False, "error": "Compilation timed out"}
    except Exception as e:
        logger.error("Compilation check failed", error=str(e))
        return {"success": False, "error": str(e)}
    finally:
        # Clean up temporary directory
        if temp_dir and Path(temp_dir).exists():
            shutil.rmtree(temp_dir, ignore_errors=True)


def generation_metric(expected: dspy.Example, predicted: str, trace=None) -> float:
    """DSPy-compatible metric for generation optimization based on code presence and compilation."""
    try:
        expected_answer = expected.expected.strip()

        # Extract code from both
        predicted_code = extract_cairo_code(predicted)
        extract_cairo_code(expected_answer)
        # Calculate compilation score

        compile_result = check_compilation(predicted_code)
        score = 1.0 if compile_result["success"] else 0.0

        logger.debug("Generation metric calculated", score=score)

        # For optimizer use (trace parameter)
        if trace is not None:
            return score >= 0.5

        return score

    except Exception as e:
        import traceback

        logger.error("Error in generation metric", error=str(e), traceback=traceback.format_exc())
        logger.error("Error in generation metric", error=str(e))
        return 0.0
