"""
DSPy Query Processor Program for Cairo Coder.

This module implements the QueryProcessorProgram that transforms user queries
into structured format for document retrieval, including search terms extraction
and resource identification.
"""

import structlog
import re
from typing import List, Optional

import dspy
from dspy import InputField, OutputField, Signature

from cairo_coder.core.types import DocumentSource, ProcessedQuery

logger = structlog.get_logger(__name__)

RESOURCE_DESCRIPTIONS = {
  "cairo_book":
    'The Cairo Programming Language Book. Essential for core language syntax, semantics, types (felt252, structs, enums, Vec), traits, generics, control flow, memory management, writing tests, organizing a project, standard library usage, starknet interactions. Crucial for smart contract structure, storage, events, ABI, syscalls, contract deployment, interaction, L1<>L2 messaging, Starknet-specific attributes.',
  "starknet_docs":
    'The Starknet Documentation. For Starknet protocol, architecture, APIs, syscalls, network interaction, deployment, ecosystem tools (Starkli, indexers), general Starknet knowledge.',
  "starknet_foundry":
    'The Starknet Foundry Documentation. For using the Foundry toolchain: writing, compiling, testing (unit tests, integration tests), and debugging Starknet contracts.',
  "cairo_by_example":
    'Cairo by Example Documentation. Provides practical Cairo code snippets for specific language features or common patterns. Useful for how-to syntax questions.',
  "openzeppelin_docs":
    'OpenZeppelin Cairo Contracts Documentation. For using the OZ library: standard implementations (ERC20, ERC721), access control, security patterns, contract upgradeability. Crucial for building standard-compliant contracts.',
  "corelib_docs":
    'Cairo Core Library Documentation. For using the Cairo core library: basic types, stdlib functions, stdlib structs, macros, and other core concepts. Essential for Cairo programming questions.',
  "scarb_docs":
    'Scarb Documentation. For using the Scarb package manager: building, compiling, generating compilation artifacts, managing dependencies, configuration of Scarb.toml.',
};

class CairoQueryAnalysis(Signature):
    """
    Analyze a Cairo programming query to extract search terms and identify relevant documentation sources.
    """

    chat_history: Optional[str] = InputField(
        desc="Previous conversation context for better understanding of the query. May be empty.",
        default=""
    )

    query: str = InputField(
        desc="User's Cairo/Starknet programming question or request that needs to be processed"
    )

    search_terms: str = OutputField(
        desc="List of specific search terms to find relevant documentation, separated by commas"
    )

    resources: str = OutputField(
        desc="List of documentation sources. Available sources: " + ", ".join([f"{key}: {value}" for key, value in RESOURCE_DESCRIPTIONS.items()])
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

        # Common keywords for query analysis
        self.contract_keywords = {
            'contract', 'interface', 'trait', 'impl', 'storage', 'starknet',
            'constructor', 'external', 'view', 'event', 'emit', 'component',
            'ownership', 'upgradeable', 'proxy', 'dispatcher', 'abi'
        }

        self.test_keywords = {
            'test', 'testing', 'assert', 'mock', 'fixture', 'unit', 'integration',
            'should_panic', 'expected', 'setup', 'teardown', 'coverage'
        }

    def forward(self, query: str, chat_history: Optional[str] = None) -> ProcessedQuery:
        """
        Process a user query into a structured format for document retrieval.

        Args:
            query: The user's Cairo/Starknet programming question
            chat_history: Previous conversation context (optional)

        Returns:
            ProcessedQuery with search terms, resource identification, and categorization
        """
        if chat_history is None:
            chat_history = ""

        # Execute the DSPy retrieval program
        result = self.retrieval_program.forward(
            query=query,
            chat_history=chat_history
        )

        # Parse and validate the results
        search_terms = self._parse_search_terms(result.search_terms)
        resources = self._validate_resources(result.resources)

        # Enhance search terms with keyword analysis
        enhanced_terms = self._enhance_search_terms(query, search_terms)

        # Build structured query result
        logger.info(f"Processed query: {query} \n"
                    f"Generated: search_terms={search_terms}, resources={resources}, enhanced_terms={enhanced_terms}")
        return ProcessedQuery(
            original=query,
            transformed=enhanced_terms,
            is_contract_related=self._is_contract_query(query),
            is_test_related=self._is_test_query(query),
            resources=resources
        )

    def _parse_search_terms(self, search_terms_str: str) -> List[str]:
        """
        Parse search terms string into a list of terms.

        Args:
            search_terms_str: Comma-separated search terms from DSPy output

        Returns:
            List of cleaned search terms
        """
        if not search_terms_str or search_terms_str is None:
            return []

        # Split by comma and clean each term
        terms = [term.strip() for term in str(search_terms_str).split(',')]

        # Filter out empty terms and normalize
        cleaned_terms = []
        for term in terms:
            if term and len(term) > 1:  # Skip single characters
                # Remove quotes if present
                term = term.strip('"\'')
                cleaned_terms.append(term)

        return cleaned_terms

    def _validate_resources(self, resources_str: str) -> List[DocumentSource]:
        """
        Validate and convert resource strings to DocumentSource enum values.

        Args:
            resources_str: Comma-separated resource names from DSPy output

        Returns:
            List of valid DocumentSource enum values
        """
        if not resources_str or resources_str is None:
            return [DocumentSource.CAIRO_BOOK]  # Default fallback

        # Parse resource names
        resource_names = [r.strip() for r in str(resources_str).split(',')]
        valid_resources = []

        for name in resource_names:
            if not name:
                continue

            # Try to match to DocumentSource enum
            try:
                # Handle different naming conventions
                normalized_name = name.lower().replace('-', '_').replace(' ', '_')
                source = DocumentSource(normalized_name)
                valid_resources.append(source)
            except ValueError:
                # Skip invalid source names
                continue

        # Return valid resources or default fallback
        return valid_resources if valid_resources else [DocumentSource.CAIRO_BOOK]

    def _enhance_search_terms(self, query: str, base_terms: List[str]) -> List[str]:
        """
        Enhance search terms with query-specific keywords and analysis.

        Args:
            query: Original user query
            base_terms: Base search terms from DSPy output

        Returns:
            Enhanced list of search terms
        """
        enhanced_terms = list(base_terms)
        query_lower = query.lower()

        # Add important keywords found in the query
        for word in re.findall(r'\b\w+\b', query_lower):
            if len(word) > 2 and word not in enhanced_terms:
                # Add technical terms
                if word in {'cairo', 'starknet', 'contract', 'storage', 'trait', 'impl'}:
                    enhanced_terms.append(word)

                # Add function/method names (likely in snake_case or camelCase)
                if '_' in word or any(c.isupper() for c in word[1:]):
                    enhanced_terms.append(word)

        # Remove duplicates while preserving order
        seen = set()
        unique_terms = []
        for term in enhanced_terms:
            if term.lower() not in seen:
                seen.add(term.lower())
                unique_terms.append(term)

        return unique_terms

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
