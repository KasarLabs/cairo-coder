"""
DSPy Query Processor Program for Cairo Coder.

This module implements the QueryProcessorProgram that transforms user queries
into structured format for document retrieval, including search terms extraction
and resource identification.
"""

import os
from typing import Optional

import dspy
import structlog
from langsmith import traceable

from cairo_coder.core.types import DocumentSource, ProcessedQuery

logger = structlog.get_logger(__name__)

RESOURCE_DESCRIPTIONS = {
    DocumentSource.CAIRO_BOOK: "The Cairo Programming Language Book. Essential for core language syntax, semantics, types (felt252, structs, enums, Vec), traits, generics, control flow, memory management, writing tests, organizing a project, standard library usage, starknet interactions. Crucial for smart contract structure, storage, events, ABI, syscalls, contract deployment, interaction, L1<>L2 messaging, Starknet-specific attributes. Very important for interactions with the Starknet state and context (e.g. block, transaction) through syscalls.",
    DocumentSource.STARKNET_DOCS: "The Starknet Documentation. For the Starknet protocol, the STWO prover, architecture, APIs, syscalls, network interaction, deployment, ecosystem tools (Starkli, indexers, StarknetJS, wallets), general Starknet knowledge. This should not be included for Coding and Programming questions, but rather, only for questions about Starknet, Proving, ZK, STWO, SHARP itself.",
    DocumentSource.STARKNET_FOUNDRY: "The Starknet Foundry Documentation. For using the Foundry toolchain: `snforge` for writing, compiling, testing (unit tests, integration tests), and debugging Starknet contracts. `sncast` for deploying and interacting with contracts to Starknet.",
    DocumentSource.CAIRO_BY_EXAMPLE: "Cairo by Example Documentation. Provides practical Cairo code snippets for specific language features or common patterns. Useful for how-to syntax questions. This should not be included for Smart Contract questions, but for all other Cairo programming questions.",
    DocumentSource.OPENZEPPELIN_DOCS: "OpenZeppelin Cairo Contracts Documentation. For using the OZ library: standard implementations (ERC20, ERC721), access control, security patterns, contract upgradeability. Crucial for building standard-compliant contracts.",
    DocumentSource.CORELIB_DOCS: "Cairo Core Library Documentation. For using the Cairo core library: basic types, stdlib functions, stdlib structs, macros, and other core concepts. Essential for Cairo programming questions.",
    DocumentSource.SCARB_DOCS: "Scarb Documentation. For using the Scarb package manager: building, compiling, generating compilation artifacts, managing dependencies, configuration of Scarb.toml.",
    DocumentSource.STARKNET_JS: "StarknetJS Documentation. For using the StarknetJS library: interacting with Starknet contracts, (calls and transactions), deploying Starknet contracts, front-end APIs, javascript integration examples, guides, tutorials and general JS/TS documentation for starknet.",
    DocumentSource.STARKNET_BLOG: "Starknet Blog Documentation. For latest Starknet updates, announcements, feature releases, ecosystem developments, integration guides, and community updates. Useful for understanding recent Starknet innovations, new tools, partnerships, and protocol enhancements.",
    DocumentSource.DOJO_DOCS: "Dojo Documentation. For building onchain games and autonomous worlds using the Dojo framework: entity component system (ECS) patterns, world contracts, models, systems, events, indexing with Torii (GraphQL API, entity subscriptions, real-time state synchronization), SDKs and client libraries including dojo.js (TypeScript/JavaScript integration, entity queries, world interactions), Rust SDK (torii-client, world state queries, account management, transaction execution, real-time subscriptions), dojo.c (C bindings for native integrations, WASM32 support), dojo.unity (Unity C# SDK with codegen plugin, World Manager), dojo.godot (Godot integration with live testnet demos), Telegram bot SDK (@dojoengine packages), support for Unreal Engine modules, Sozo CLI tool (build, migration, deployment), Katana devnet, game development patterns on Starknet.",
    DocumentSource.CAIRO_SKILLS: "Cairo Ecosystem Skills. Curated, self-contained knowledge packages for specific Cairo tools and DeFi integrations. Includes: Cairo function benchmarking/profiling with cairo-profiler and pprof, Cairo coding patterns and best practices, Avnu SDK integration for Starknet DeFi (token swaps, DCA, staking, gasless transactions, paymaster), and Starknet DeFi operations (swap routing, lending, liquidity provision). Use when the query involves profiling, benchmarking, DeFi operations, DEX aggregation, or specific SDK integrations.",
}

# Ensure all DocumentSource variants are covered
_ALL_SOURCES = set(DocumentSource)
_COVERED_SOURCES = set(RESOURCE_DESCRIPTIONS.keys())
if _ALL_SOURCES != _COVERED_SOURCES:
    missing = _ALL_SOURCES - _COVERED_SOURCES
    extra = _COVERED_SOURCES - _ALL_SOURCES
    error_msg = []
    if missing:
        error_msg.append(f"Missing DocumentSource variants in RESOURCE_DESCRIPTIONS: {missing}")
    if extra:
        error_msg.append(f"Extra keys in RESOURCE_DESCRIPTIONS not in DocumentSource: {extra}")
    raise ValueError("; ".join(error_msg))


class CairoQueryAnalysis(dspy.Signature):
    """
    Analyze a Cairo programming query to extract search terms and identify relevant documentation sources.
    Your output must not contain any code; only an analysis of the query and the search queries to make.
    """

    chat_history: Optional[str] = dspy.InputField(
        desc="Previous conversation context for better understanding of the query. May be empty.",
        default="",
    )

    query: str = dspy.InputField(
        desc="User's Cairo/Starknet programming question or request that needs to be processed"
    )

    search_queries: list[str] = dspy.OutputField(
        desc="A list of __3__ specific semantic search queries to make to a vector store to find relevant documentation."
    )

    resources: list[str] = dspy.OutputField(
        desc="List of documentation sources. If unsure what to use or if the query is not clear, use all of the available sources. Available sources: "
        + ", ".join([f"{key.value}: {value}" for key, value in RESOURCE_DESCRIPTIONS.items()])
    )


class QueryProcessorProgram(dspy.Module):
    """
    DSPy module for processing user queries into structured format for retrieval.

    This module transforms natural language queries into ProcessedQuery objects
    that include search terms, resource identification, and query categorization.
    """

    def __init__(self):
        super().__init__()
        self.retrieval_program = dspy.Predict(CairoQueryAnalysis)

        # Validate that the file exists
        if not os.getenv("OPTIMIZER_RUN"):
            compiled_program_path = "optimizers/results/optimized_retrieval_program.json"
            if not os.path.exists(compiled_program_path):
                raise FileNotFoundError(f"{compiled_program_path} not found")
            self.retrieval_program.load(compiled_program_path)

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

    @traceable(name="QueryProcessorProgram", run_type="llm", metadata={"llm_provider": dspy.settings.lm})
    async def aforward(self, query: str, chat_history: Optional[str] = None) -> dspy.Prediction:
        """
        Process a user query into a structured format for document retrieval.

        Args:
            query: The user's Cairo/Starknet programming question
            chat_history: Previous conversation context (optional)

        Returns:
            dspy.Prediction containing processed_query and attached usage
        """
        # Execute the DSPy retrieval program
        result = await self.retrieval_program.acall(query=query, chat_history=chat_history)

        # Parse and validate the results
        search_queries = result.search_queries
        resources = self._validate_resources(result.resources)

        # Build structured query result
        processed_query = ProcessedQuery(
            original=query,
            search_queries=search_queries,
            is_contract_related=self._is_contract_query(query),
            is_test_related=self._is_test_query(query),
            resources=resources,
        )

        return dspy.Prediction(processed_query=processed_query)

    def _validate_resources(self, resources: list[str]) -> list[DocumentSource]:
        """
        Validate and convert resource strings to DocumentSource enum values.

        Args:
            resources_str: Comma-separated resource names from DSPy output

        Returns:
            List of valid DocumentSource enum values
        """
        if not resources or resources is None:
            return list(DocumentSource)  # Default fallback - return all sources

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
        return valid_resources if valid_resources else list(DocumentSource)

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
