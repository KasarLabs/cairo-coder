"""
Centralized constants for Cairo Coder.

This module contains all magic values, thresholds, and default settings
to ensure consistency across the codebase.
"""

# =============================================================================
# Server Configuration
# =============================================================================
DEFAULT_HOST = "0.0.0.0"
DEFAULT_PORT = 3001

# =============================================================================
# Database Configuration
# =============================================================================
DEFAULT_POSTGRES_HOST = "postgres"
DEFAULT_POSTGRES_PORT = 5432
DEFAULT_POSTGRES_DB = "cairocoder"
DEFAULT_POSTGRES_USER = "cairocoder"
DEFAULT_POSTGRES_TABLE_NAME = "documents"

# =============================================================================
# RAG Pipeline Configuration
# =============================================================================
SIMILARITY_THRESHOLD = 0.4
MAX_SOURCE_COUNT = 5
DEFAULT_RETRIEVAL_K = 5

# =============================================================================
# Connection Pool Configuration
# =============================================================================
MIN_POOL_SIZE = 2
MAX_POOL_SIZE = 10
