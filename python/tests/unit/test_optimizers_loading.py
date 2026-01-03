"""Tests for optimizer artifact loading at sub-program level."""

import os
from unittest.mock import patch

import pytest

from cairo_coder.agents.registry import AgentId
from cairo_coder.dspy.generation_program import GenerationProgram
from cairo_coder.dspy.query_processor import QueryProcessorProgram
from cairo_coder.dspy.retrieval_judge import RetrievalJudge


class TestOptimizersLoadingWithOptimizerRun:
    def test_query_processor_skips_missing_optimizer(self, monkeypatch):
        monkeypatch.setenv("OPTIMIZER_RUN", "1")
        with patch("cairo_coder.dspy.query_processor.os.path.exists", return_value=False):
            QueryProcessorProgram()

    def test_retrieval_judge_skips_missing_optimizer(self, monkeypatch):
        monkeypatch.setenv("OPTIMIZER_RUN", "1")
        with patch("cairo_coder.dspy.retrieval_judge.os.path.exists", return_value=False):
            RetrievalJudge()

    @pytest.mark.parametrize("agent_id", list(AgentId))
    def test_generation_program_skips_missing_optimizer(self, agent_id, monkeypatch):
        monkeypatch.setenv("OPTIMIZER_RUN", "1")
        with patch("cairo_coder.dspy.generation_program.os.path.exists", return_value=False):
            GenerationProgram(program_type=agent_id)


class TestOptimizersLoading:
    @pytest.mark.parametrize("agent_id", list(AgentId))
    def test_generation_program_optimizer_exists(self, agent_id, monkeypatch):
        monkeypatch.delenv("OPTIMIZER_RUN", raising=False)
        artifact_path = f"optimizers/results/optimized_generation_{agent_id.value}.json"
        if not os.path.exists(artifact_path):
            pytest.skip(f"Missing optimizer artifact: {artifact_path}")
        GenerationProgram(program_type=agent_id)

    def test_retrieval_judge_optimizer_exists(self, monkeypatch):
        monkeypatch.delenv("OPTIMIZER_RUN", raising=False)
        artifact_path = "optimizers/results/optimized_rater.json"
        if not os.path.exists(artifact_path):
            pytest.skip(f"Missing optimizer artifact: {artifact_path}")
        RetrievalJudge()

    def test_query_processor_optimizer_exists(self, monkeypatch):
        monkeypatch.delenv("OPTIMIZER_RUN", raising=False)
        artifact_path = "optimizers/results/optimized_retrieval_program.json"
        if not os.path.exists(artifact_path):
            pytest.skip(f"Missing optimizer artifact: {artifact_path}")
        QueryProcessorProgram()
