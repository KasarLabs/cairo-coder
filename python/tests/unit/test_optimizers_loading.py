"""Tests for optimizer artifact loading at sub-program level.

We validate that each component (query processor, retrieval judge, generation program flavors)
raises a FileNotFoundError when its corresponding optimized artifact is missing.
"""

from unittest.mock import patch

import pytest

from cairo_coder.agents.registry import AgentId
from cairo_coder.dspy.generation_program import GenerationProgram
from cairo_coder.dspy.query_processor import QueryProcessorProgram
from cairo_coder.dspy.retrieval_judge import RetrievalJudge


class TestOptimizersLoadingMissing:
    def test_query_processor_optimizer_missing(self):
        with (
            patch("cairo_coder.dspy.query_processor.os.path.exists", return_value=False),
            pytest.raises(FileNotFoundError, match="optimized_retrieval_program.json not found"),
        ):
            QueryProcessorProgram()

    def test_retrieval_judge_optimizer_missing(self):
        with (
            patch("cairo_coder.dspy.retrieval_judge.os.path.exists", return_value=False),
            pytest.raises(FileNotFoundError, match="optimized_rater.json not found"),
        ):
            RetrievalJudge()

    @pytest.mark.parametrize("agent_id", list(AgentId))
    def test_generation_program_optimizer_missing(self, agent_id):
        with patch("cairo_coder.dspy.generation_program.os.path.exists", return_value=False), pytest.raises(
                FileNotFoundError, match=f"optimized_generation_{agent_id.value}.json not found"
            ):
                GenerationProgram(program_type=agent_id)


class TestOptimizersLoading:
    @pytest.mark.parametrize("agent_id", list(AgentId))
    def test_generation_program_optimizer_exists(self, agent_id):
        GenerationProgram(program_type=agent_id)

    def test_retrieval_judge_optimizer_exists(self):
        RetrievalJudge()

    def test_query_processor_optimizer_exists(self):
        QueryProcessorProgram()
