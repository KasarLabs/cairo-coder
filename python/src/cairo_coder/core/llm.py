"""LLM provider router and integration for Cairo Coder."""

from typing import Any, Dict, Optional

import dspy

from ..utils.logging import get_logger
from .config import LLMProviderConfig

logger = get_logger(__name__)


import dspy
from dspy.utils.callback import BaseCallback

# 1. Define a custom callback class that extends BaseCallback class
class AgentLoggingCallback(BaseCallback):

    def on_module_start(
        self,
        call_id: str,
        instance: Any,
        inputs: Dict[str, Any],
    ):
        logger.info("Starting module", call_id=call_id, inputs=inputs)

    # 2. Implement on_module_end handler to run a custom logging code.
    def on_module_end(self, call_id, outputs, exception):
        step = "Reasoning" if self._is_reasoning_output(outputs) else "Acting"
        print(f"== {step} Step ===")
        for k, v in outputs.items():
            print(f"  {k}: {v}")
        print("\n")

    def _is_reasoning_output(self, outputs):
        return any(k.startswith("Thought") for k in outputs.keys())

class LLMRouter:
    """Routes requests to appropriate LLM providers."""

    def __init__(self, config: LLMProviderConfig):
        """
        Initialize LLM router with provider configuration.

        Args:
            config: LLM provider configuration.
        """
        self.config = config
        self.providers: Dict[str, dspy.LM] = {}
        self._initialize_providers()

    def _initialize_providers(self) -> None:
        """Initialize configured LLM providers."""
        # Initialize OpenAI
        if self.config.openai_api_key:
            try:
                self.providers["openai"] = dspy.LM(
                    model=f"openai/{self.config.openai_model}",
                    api_key=self.config.openai_api_key,
                )
                logger.info("OpenAI provider initialized", model=self.config.openai_model)
            except Exception as e:
                logger.error("Failed to initialize OpenAI provider", error=str(e))

        # Initialize Anthropic
        if self.config.anthropic_api_key:
            try:
                self.providers["anthropic"] = dspy.LM(
                    model=f"anthropic/{self.config.anthropic_model}",
                    api_key=self.config.anthropic_api_key,
                )
                logger.info("Anthropic provider initialized", model=self.config.anthropic_model)
            except Exception as e:
                logger.error("Failed to initialize Anthropic provider", error=str(e))

        # Initialize Google Gemini
        if self.config.gemini_api_key:
            try:
                self.providers["gemini"] = dspy.LM(
                    model=f"google/{self.config.gemini_model}",
                    api_key=self.config.gemini_api_key,
                )
                logger.info("Gemini provider initialized", model=self.config.gemini_model)
            except Exception as e:
                logger.error("Failed to initialize Gemini provider", error=str(e))

        # Set default provider
        if self.config.default_provider in self.providers:
            dspy.configure(lm=self.providers[self.config.default_provider])
            logger.info("Default LM provider set", provider=self.config.default_provider)
        elif self.providers:
            # Fallback to first available provider
            default = next(iter(self.providers.keys()))
            dspy.configure(lm=self.providers[default])
            logger.warning(
                "Default provider not available, using fallback",
                requested=self.config.default_provider,
                fallback=default
            )
        else:
            logger.error("No LLM providers available")
            raise ValueError("No LLM providers configured or available")

    def get_lm(self, provider: Optional[str] = None) -> dspy.LM:
        """
        Get LLM instance for specified provider.

        Args:
            provider: Provider name. Defaults to configured default.

        Returns:
            LLM instance.

        Raises:
            ValueError: If provider is not available.
        """
        if provider is None:
            provider = self.config.default_provider

        if provider not in self.providers:
            available = list(self.providers.keys())
            raise ValueError(
                f"Provider '{provider}' not available. Available providers: {available}"
            )

        return self.providers[provider]

    def set_active_provider(self, provider: str) -> None:
        """
        Set active provider for DSPy operations.

        Args:
            provider: Provider name to activate.

        Raises:
            ValueError: If provider is not available.
        """
        lm = self.get_lm(provider)
        dspy.configure(lm=lm)
        logger.info("Active LM provider changed", provider=provider)

    def get_available_providers(self) -> list[str]:
        """
        Get list of available providers.

        Returns:
            List of provider names.
        """
        return list(self.providers.keys())

    def get_active_provider(self) -> Optional[str]:
        """
        Get currently active provider name.

        Returns:
            Active provider name or None.
        """
        current_lm = dspy.settings.lm
        if current_lm:
            for name, provider in self.providers.items():
                if provider == current_lm:
                    return name
        return None

    def get_provider_info(self, provider: Optional[str] = None) -> Dict[str, Any]:
        """
        Get information about a provider.

        Args:
            provider: Provider name. Defaults to active provider.

        Returns:
            Provider information dictionary.
        """
        if provider is None:
            provider = self.get_active_provider()
            if provider is None:
                return {"error": "No active provider"}

        if provider not in self.providers:
            return {"error": f"Provider '{provider}' not found"}

        lm = self.providers[provider]

        # Extract model info from DSPy LM instance
        info = {
            "provider": provider,
            "model": getattr(lm, "model", "unknown"),
            "active": provider == self.get_active_provider()
        }

        return info

    @staticmethod
    def get_token_usage() -> Dict[str, int]:
        """
        Get token usage statistics from DSPy.

        Returns:
            Dictionary with token usage information.
        """
        # DSPy tracks usage internally
        history = dspy.inspect_history(n=1)
        if history:
            last_call = history[-1]
            usage = last_call.get("usage", {})
            return {
                "prompt_tokens": usage.get("prompt_tokens", 0),
                "completion_tokens": usage.get("completion_tokens", 0),
                "total_tokens": usage.get("total_tokens", 0)
            }
        return {
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "total_tokens": 0
        }
