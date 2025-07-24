"""
DSPy Query Processor Program for Cairo Coder.

This module implements the QueryProcessorProgram that transforms user queries
into structured format for document retrieval, including search terms extraction
and resource identification.
"""

from typing import Optional

import dspy
import structlog
from dspy import InputField, OutputField, Signature
from langsmith import traceable

from cairo_coder.core.types import DocumentSource, ProcessedQuery

logger = structlog.get_logger(__name__)

RESOURCE_DESCRIPTIONS = {
    "cairo_book": "The Cairo Programming Language Book. Essential for core language syntax, semantics, types (felt252, structs, enums, Vec), traits, generics, control flow, memory management, writing tests, organizing a project, standard library usage, starknet interactions. Crucial for smart contract structure, storage, events, ABI, syscalls, contract deployment, interaction, L1<>L2 messaging, Starknet-specific attributes.",
    "starknet_docs": "The Starknet Documentation. For Starknet protocol, architecture, APIs, syscalls, network interaction, deployment, ecosystem tools (Starkli, indexers), general Starknet knowledge. This should not be included for Coding and Programming questions, but rather, only for questions about Starknet itself.",
    "starknet_foundry": "The Starknet Foundry Documentation. For using the Foundry toolchain: writing, compiling, testing (unit tests, integration tests), and debugging Starknet contracts.",
    "cairo_by_example": "Cairo by Example Documentation. Provides practical Cairo code snippets for specific language features or common patterns. Useful for how-to syntax questions. This should not be included for Smart Contract questions, but for all other Cairo programming questions.",
    "openzeppelin_docs": "OpenZeppelin Cairo Contracts Documentation. For using the OZ library: standard implementations (ERC20, ERC721), access control, security patterns, contract upgradeability. Crucial for building standard-compliant contracts.",
    "corelib_docs": "Cairo Core Library Documentation. For using the Cairo core library: basic types, stdlib functions, stdlib structs, macros, and other core concepts. Essential for Cairo programming questions.",
    "scarb_docs": "Scarb Documentation. For using the Scarb package manager: building, compiling, generating compilation artifacts, managing dependencies, configuration of Scarb.toml.",
}


class CairoQueryAnalysis(Signature):
    """
    Analyze a Cairo programming query to extract search terms and identify relevant documentation sources.
    """

    chat_history: Optional[str] = InputField(
        desc="Previous conversation context for better understanding of the query. May be empty.",
        default="",
    )

    query: str = InputField(
        desc="User's Cairo/Starknet programming question or request that needs to be processed"
    )

    search_queries: list[str] = OutputField(
        desc="A list of __3__ specific semantic search queries to make to a vector store to find relevant documentation."
    )

    resources: list[str] = OutputField(
        desc="List of documentation sources. Available sources: "
        + ", ".join([f"{key}: {value}" for key, value in RESOURCE_DESCRIPTIONS.items()])
    )


class QueryProcessorProgram(dspy.Module):
    """
    DSPy module for processing user queries into structured format for retrieval.

    This module transforms natural language queries into ProcessedQuery objects
    that include search terms, resource identification, and query categorization.
    """

    def __init__(self):
        super().__init__()
        self.retrieval_program = dspy.ChainOfThought(CairoQueryAnalysis)

        # TODO: only the main rag pipeline should be loaded - in one shot
        # # Validate that the file exists
        # compiled_program_path = "optimizers/results/optimized_retrieval_program.json"
        # if not os.path.exists(compiled_program_path):
        #     raise FileNotFoundError(f"{compiled_program_path} not found")
        # self.retrieval_program.load(compiled_program_path)

        # Common keywords for query analysis
        self.contract_keywords = {
            "contract",
            "interface",
            "trait",
            "impl",
            "storage",
            "starknet",
            "constructor",
            "external",
            "view",
            "event",
            "emit",
            "component",
            "ownership",
            "upgradeable",
            "proxy",
            "dispatcher",
            "abi",
        }

        self.test_keywords = {
            "test",
            "testing",
            "assert",
            "mock",
            "fixture",
            "unit",
            "integration",
            "should_panic",
            "expected",
            "setup",
            "teardown",
            "coverage",
            "foundry",
        }

    @traceable(name="QueryProcessorProgram", run_type="llm")
    def forward(self, query: str, chat_history: Optional[str] = None) -> ProcessedQuery:
        """
        Process a user query into a structured format for document retrieval.

        Args:
            query: The user's Cairo/Starknet programming question
            chat_history: Previous conversation context (optional)

        Returns:
            ProcessedQuery with search terms, resource identification, and categorization
        """
        # Execute the DSPy retrieval program
        result = self.retrieval_program.forward(query=query, chat_history=chat_history)

        # Parse and validate the results
        search_queries = result.search_queries
        resources = self._validate_resources(result.resources)

        # Build structured query result
        return ProcessedQuery(
            original=query,
            search_queries=search_queries,
            reasoning=result.reasoning,
            is_contract_related=self._is_contract_query(query),
            is_test_related=self._is_test_query(query),
            resources=resources,
        )

    @traceable(name="QueryProcessorProgram", run_type="llm")
    async def aforward(self, query: str, chat_history: Optional[str] = None) -> ProcessedQuery:
        """
        Process a user query into a structured format for document retrieval.

        Args:
            query: The user's Cairo/Starknet programming question
            chat_history: Previous conversation context (optional)

        Returns:
            ProcessedQuery with search terms, resource identification, and categorization
        """
        # Execute the DSPy retrieval program
        result = await self.retrieval_program.aforward(query=query, chat_history=chat_history)

        # Parse and validate the results
        search_queries = result.search_queries
        resources = self._validate_resources(result.resources)

        # Build structured query result
        return ProcessedQuery(
            original=query,
            search_queries=search_queries,
            reasoning=result.reasoning,
            is_contract_related=self._is_contract_query(query),
            is_test_related=self._is_test_query(query),
            resources=resources,
        )

    def _validate_resources(self, resources: list[str]) -> list[DocumentSource]:
        """
        Validate and convert resource strings to DocumentSource enum values.

        Args:
            resources_str: Comma-separated resource names from DSPy output

        Returns:
            List of valid DocumentSource enum values
        """
        if not resources or resources is None:
            return [DocumentSource.CAIRO_BOOK]  # Default fallback

        # Parse resource names
        valid_resources = []
        for name in resources:
            if not name:
                continue

            # Try to match to DocumentSource enum
            try:
                # Handle different naming conventions
                normalized_name = name.lower().replace("-", "_").replace(" ", "_")
                source = DocumentSource(normalized_name)
                valid_resources.append(source)
            except ValueError:
                # Skip invalid source names
                continue

        # Return valid resources or default fallback
        # TODO: Upon failure, this should return an error message to the user.
        return valid_resources if valid_resources else [DocumentSource.CAIRO_BOOK]

    def _is_contract_query(self, query: str) -> bool:
        """
        Check if query is related to smart contracts.

        Args:
            query: User query to analyze

        Returns:
            True if query appears to be contract-related
        """
        query_lower = query.lower()
        return any(keyword in query_lower for keyword in self.contract_keywords)

    def _is_test_query(self, query: str) -> bool:
        """
        Check if query is related to testing.

        Args:
            query: User query to analyze

        Returns:
            True if query appears to be test-related
        """
        query_lower = query.lower()
        return any(keyword in query_lower for keyword in self.test_keywords)


def create_query_processor() -> QueryProcessorProgram:
    """
    Factory function to create a QueryProcessorProgram instance.

    Returns:
        Configured QueryProcessorProgram instance
    """
    return QueryProcessorProgram()
