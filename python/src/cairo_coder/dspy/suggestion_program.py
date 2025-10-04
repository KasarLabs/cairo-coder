"""
DSPy Suggestion Program for Cairo Coder.

This module implements the SuggestionProgram that generates follow-up
suggestions based on chat history to help users continue their conversation.
"""


import dspy
import structlog

logger = structlog.get_logger(__name__)


class SuggestionGeneration(dspy.Signature):
    """
    Generate helpful follow-up suggestions based on a conversation history.

    Analyze the conversation and generate 4-5 relevant suggestions that the user
    might ask next. Suggestions should be medium-length, informative, and help
    the user explore related topics or dive deeper into the current discussion.
    """

    chat_history: str = dspy.InputField(
        desc="Previous conversation context to analyze for generating relevant follow-up suggestions"
    )

    suggestions: list[str] = dspy.OutputField(
        desc="A list of exactly 4-5 helpful follow-up questions or suggestions that are relevant to the conversation. Each suggestion should be a complete, medium-length question that the user could ask."
    )
