"""Tests for LLM provider router."""

from unittest.mock import MagicMock, patch

import dspy
import pytest

from cairo_coder.core.config import LLMProviderConfig
from cairo_coder.core.llm import LLMRouter


class TestLLMRouter:
    """Test LLM router functionality."""

    @pytest.fixture
    def config(self) -> LLMProviderConfig:
        """Create test LLM configuration."""
        return LLMProviderConfig(
            openai_api_key="test-openai-key",
            openai_model="gpt-4",
            anthropic_api_key="test-anthropic-key",
            anthropic_model="claude-3",
            gemini_api_key="test-gemini-key",
            gemini_model="gemini-2.5-flash",
            default_provider="openai",
        )

    @patch("dspy.LM")
    @patch("dspy.configure")
    def test_initialize_providers(self, mock_configure: MagicMock, mock_lm: MagicMock, config: LLMProviderConfig) -> None:
        """Test provider initialization."""
        # Mock LM instances
        mock_openai = MagicMock()
        mock_anthropic = MagicMock()
        mock_gemini = MagicMock()

        mock_lm.side_effect = [mock_openai, mock_anthropic, mock_gemini]

        router = LLMRouter(config)

        # Check all providers were initialized
        assert len(router.providers) == 3
        assert "openai" in router.providers
        assert "anthropic" in router.providers
        assert "gemini" in router.providers

        # Check LM constructor calls
        assert mock_lm.call_count == 3

        # Check OpenAI initialization
        mock_lm.assert_any_call(
            model="openai/gpt-4",
            api_key="test-openai-key",
        )

        # Check default provider was configured
        mock_configure.assert_called_once_with(lm=mock_openai)

    @patch("dspy.LM")
    @patch("dspy.configure")
    def test_partial_initialization(self, mock_configure: MagicMock, mock_lm: MagicMock) -> None:
        """Test initialization with only some providers configured."""
        config = LLMProviderConfig(
            openai_api_key="test-key",
            default_provider="openai"
        )

        mock_openai = MagicMock()
        mock_lm.return_value = mock_openai

        router = LLMRouter(config)

        assert len(router.providers) == 1
        assert "openai" in router.providers
        assert "anthropic" not in router.providers
        assert "gemini" not in router.providers

    @patch("dspy.LM")
    def test_no_providers_error(self, mock_lm: MagicMock) -> None:
        """Test error when no providers are configured."""
        config = LLMProviderConfig()  # No API keys

        with pytest.raises(ValueError, match="No LLM providers configured"):
            LLMRouter(config)

    @patch("dspy.LM")
    @patch("dspy.configure")
    def test_fallback_provider(self, mock_configure: MagicMock, mock_lm: MagicMock) -> None:
        """Test fallback when default provider is not available."""
        config = LLMProviderConfig(
            anthropic_api_key="test-key",
            default_provider="openai"  # Not configured
        )

        mock_anthropic = MagicMock()
        mock_lm.return_value = mock_anthropic

        router = LLMRouter(config)

        # Should fall back to anthropic
        mock_configure.assert_called_once_with(lm=mock_anthropic)

    @patch("dspy.LM")
    @patch("dspy.configure")
    def test_get_lm(self, mock_configure: MagicMock, mock_lm: MagicMock, config: LLMProviderConfig) -> None:
        """Test getting specific LM instances."""
        mock_openai = MagicMock()
        mock_anthropic = MagicMock()
        mock_gemini = MagicMock()

        mock_lm.side_effect = [mock_openai, mock_anthropic, mock_gemini]

        router = LLMRouter(config)

        # Get default provider
        lm = router.get_lm()
        assert lm == mock_openai

        # Get specific providers
        assert router.get_lm("anthropic") == mock_anthropic
        assert router.get_lm("gemini") == mock_gemini

        # Get non-existent provider
        with pytest.raises(ValueError, match="Provider 'unknown' not available"):
            router.get_lm("unknown")

    @patch("dspy.LM")
    @patch("dspy.configure")
    def test_set_active_provider(self, mock_configure: MagicMock, mock_lm: MagicMock, config: LLMProviderConfig) -> None:
        """Test changing active provider."""
        mock_openai = MagicMock()
        mock_anthropic = MagicMock()
        mock_gemini = MagicMock()

        mock_lm.side_effect = [mock_openai, mock_anthropic, mock_gemini]

        router = LLMRouter(config)

        # Initial configuration call
        assert mock_configure.call_count == 1

        # Change to anthropic
        router.set_active_provider("anthropic")
        assert mock_configure.call_count == 2
        mock_configure.assert_called_with(lm=mock_anthropic)

        # Change to gemini
        router.set_active_provider("gemini")
        assert mock_configure.call_count == 3
        mock_configure.assert_called_with(lm=mock_gemini)

    @patch("dspy.LM")
    @patch("dspy.configure")
    def test_get_available_providers(self, mock_configure: MagicMock, mock_lm: MagicMock, config: LLMProviderConfig) -> None:
        """Test getting list of available providers."""
        mock_lm.side_effect = [MagicMock(), MagicMock(), MagicMock()]

        router = LLMRouter(config)

        providers = router.get_available_providers()
        assert set(providers) == {"openai", "anthropic", "gemini"}

    @patch("dspy.LM")
    @patch("dspy.configure")
    @patch("dspy.settings")
    def test_get_active_provider(self, mock_settings: MagicMock, mock_configure: MagicMock, mock_lm: MagicMock, config: LLMProviderConfig) -> None:
        """Test getting active provider name."""
        mock_openai = MagicMock()
        mock_anthropic = MagicMock()
        mock_gemini = MagicMock()

        mock_lm.side_effect = [mock_openai, mock_anthropic, mock_gemini]

        router = LLMRouter(config)

        # Mock current LM
        mock_settings.lm = mock_openai
        assert router.get_active_provider() == "openai"

        mock_settings.lm = mock_anthropic
        assert router.get_active_provider() == "anthropic"

        mock_settings.lm = None
        assert router.get_active_provider() is None

    @patch("dspy.LM")
    @patch("dspy.configure")
    @patch("dspy.settings")
    def test_get_provider_info(self, mock_settings: MagicMock, mock_configure: MagicMock, mock_lm: MagicMock, config: LLMProviderConfig) -> None:
        """Test getting provider information."""
        mock_openai = MagicMock()
        mock_openai.model = "openai/gpt-4"

        mock_lm.side_effect = [mock_openai, MagicMock(), MagicMock()]
        mock_settings.lm = mock_openai

        router = LLMRouter(config)

        # Get info for specific provider
        info = router.get_provider_info("openai")
        assert info["provider"] == "openai"
        assert info["model"] == "openai/gpt-4"
        assert info["active"] is True

        # Get info for non-existent provider
        info = router.get_provider_info("unknown")
        assert "error" in info

        # Get info for active provider
        info = router.get_provider_info()
        assert info["provider"] == "openai"

    @patch("dspy.inspect_history")
    def test_get_token_usage(self, mock_inspect: MagicMock) -> None:
        """Test getting token usage statistics."""
        # Mock usage data
        mock_inspect.return_value = [{
            "usage": {
                "prompt_tokens": 100,
                "completion_tokens": 50,
                "total_tokens": 150
            }
        }]

        usage = LLMRouter.get_token_usage()

        assert usage["prompt_tokens"] == 100
        assert usage["completion_tokens"] == 50
        assert usage["total_tokens"] == 150

        # Test with no history
        mock_inspect.return_value = []
        usage = LLMRouter.get_token_usage()

        assert usage["prompt_tokens"] == 0
        assert usage["completion_tokens"] == 0
        assert usage["total_tokens"] == 0
