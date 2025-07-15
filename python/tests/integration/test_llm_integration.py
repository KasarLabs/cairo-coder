"""Integration tests for LLM provider router."""

import os
from unittest.mock import MagicMock, patch

import dspy
import pytest

from cairo_coder.core.config import LLMProviderConfig
from cairo_coder.core.llm import LLMRouter


class TestLLMIntegration:
    """Test LLM router integration with DSPy."""

    @pytest.fixture
    def mock_env_config(self, monkeypatch: pytest.MonkeyPatch) -> LLMProviderConfig:
        """Create config with environment variables."""
        # Set test API keys
        monkeypatch.setenv("OPENAI_API_KEY", "test-openai-key")
        monkeypatch.setenv("ANTHROPIC_API_KEY", "test-anthropic-key")
        monkeypatch.setenv("GEMINI_API_KEY", "test-gemini-key")

        return LLMProviderConfig(
            openai_api_key=os.getenv("OPENAI_API_KEY"),
            anthropic_api_key=os.getenv("ANTHROPIC_API_KEY"),
            gemini_api_key=os.getenv("GEMINI_API_KEY"),
            default_provider="openai",
        )

    @patch("dspy.LM")
    @patch("dspy.configure")
    def test_full_integration_with_all_providers(
        self,
        mock_configure: MagicMock,
        mock_lm: MagicMock,
        mock_env_config: LLMProviderConfig
    ) -> None:
        """Test complete integration with all providers configured."""
        # Create mock LM instances
        mock_openai = MagicMock(name="OpenAI_LM")
        mock_anthropic = MagicMock(name="Anthropic_LM")
        mock_gemini = MagicMock(name="Gemini_LM")

        mock_lm.side_effect = [mock_openai, mock_anthropic, mock_gemini]

        # Initialize router
        router = LLMRouter(mock_env_config)

        # Verify all providers initialized
        assert len(router.get_available_providers()) == 3

        # Verify initial configuration
        mock_configure.assert_called_once_with(lm=mock_openai)

        # Test provider switching
        router.set_active_provider("anthropic")
        assert mock_configure.call_count == 2
        mock_configure.assert_called_with(lm=mock_anthropic)

        router.set_active_provider("gemini")
        assert mock_configure.call_count == 3
        mock_configure.assert_called_with(lm=mock_gemini)

        # Switch back to OpenAI
        router.set_active_provider("openai")
        assert mock_configure.call_count == 4

    @patch("dspy.LM")
    def test_error_handling_with_invalid_provider_init(
        self,
        mock_lm: MagicMock,
        mock_env_config: LLMProviderConfig
    ) -> None:
        """Test error handling when provider initialization fails."""
        # Make OpenAI initialization fail
        mock_lm.side_effect = [
            Exception("OpenAI init failed"),
            MagicMock(name="Anthropic_LM"),
            MagicMock(name="Gemini_LM")
        ]

        # Should still initialize with other providers
        router = LLMRouter(mock_env_config)

        # OpenAI should not be available
        providers = router.get_available_providers()
        assert "openai" not in providers
        assert "anthropic" in providers
        assert "gemini" in providers

    @patch("dspy.LM")
    @patch("dspy.configure")
    @patch("dspy.settings")
    def test_provider_info_integration(
        self,
        mock_settings: MagicMock,
        mock_configure: MagicMock,
        mock_lm: MagicMock,
        mock_env_config: LLMProviderConfig
    ) -> None:
        """Test getting provider information in integration."""
        mock_openai = MagicMock(name="OpenAI_LM")
        mock_openai.model = "openai/gpt-4o"
        mock_anthropic = MagicMock(name="Anthropic_LM")
        mock_anthropic.model = "anthropic/claude-3-5-sonnet"

        mock_lm.side_effect = [mock_openai, mock_anthropic, MagicMock()]
        mock_settings.lm = mock_openai

        router = LLMRouter(mock_env_config)

        # Get info for active provider
        info = router.get_provider_info()
        assert info["provider"] == "openai"
        assert info["model"] == "openai/gpt-4o"
        assert info["active"] is True

        # Get info for inactive provider
        info = router.get_provider_info("anthropic")
        assert info["provider"] == "anthropic"
        assert info["model"] == "anthropic/claude-3-5-sonnet"
        assert info["active"] is False

    def test_real_dspy_integration_patterns(self) -> None:
        """Test patterns that would be used in real DSPy integration."""
        # This test demonstrates how the LLM router would be used with DSPy

        # 1. Define a simple DSPy signature
        class SimpleSignature(dspy.Signature):
            """A simple test signature."""
            input_text = dspy.InputField()
            output_text = dspy.OutputField()

        # 2. Create a module that would use the LLM
        class SimpleModule(dspy.Module):
            def __init__(self):
                super().__init__()
                self.predictor = dspy.Predict(SimpleSignature)

            def forward(self, input_text: str) -> str:
                result = self.predictor(input_text=input_text)
                return result.output_text

        # 3. Verify the module can be created (actual execution would require real LLM)
        module = SimpleModule()
        assert hasattr(module, 'predictor')

    @patch("dspy.inspect_history")
    def test_token_usage_tracking_integration(self, mock_inspect: MagicMock) -> None:
        """Test token usage tracking in integration context."""
        # Simulate multiple LLM calls with usage data
        history_data = [
            {
                "usage": {
                    "prompt_tokens": 150,
                    "completion_tokens": 75,
                    "total_tokens": 225
                }
            },
            {
                "usage": {
                    "prompt_tokens": 200,
                    "completion_tokens": 100,
                    "total_tokens": 300
                }
            }
        ]

        # Test getting last usage
        mock_inspect.return_value = [history_data[-1]]
        usage = LLMRouter.get_token_usage()

        assert usage["prompt_tokens"] == 200
        assert usage["completion_tokens"] == 100
        assert usage["total_tokens"] == 300

    def test_no_providers_available_error(self) -> None:
        """Test error when no providers can be initialized."""
        # Create config with no API keys
        config = LLMProviderConfig()

        with pytest.raises(ValueError, match="No LLM providers configured"):
            LLMRouter(config)

    @patch("dspy.LM")
    @patch("dspy.configure")
    def test_provider_fallback_mechanism(
        self,
        mock_configure: MagicMock,
        mock_lm: MagicMock
    ) -> None:
        """Test fallback mechanism when preferred provider is not available."""
        # Config requests OpenAI but only Anthropic is available
        config = LLMProviderConfig(
            anthropic_api_key="test-key",
            default_provider="openai"
        )

        mock_anthropic = MagicMock(name="Anthropic_LM")
        mock_lm.return_value = mock_anthropic

        router = LLMRouter(config)

        # Should fall back to Anthropic
        assert "anthropic" in router.get_available_providers()
        assert "openai" not in router.get_available_providers()
        mock_configure.assert_called_once_with(lm=mock_anthropic)
