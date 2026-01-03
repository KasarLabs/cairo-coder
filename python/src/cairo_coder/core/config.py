"""
Configuration management for Cairo Coder.

This module provides centralized configuration using dataclasses
with environment variable loading and validation.
"""

import os
from dataclasses import dataclass

from cairo_coder.core.constants import (
    DEFAULT_HOST,
    DEFAULT_PORT,
    DEFAULT_POSTGRES_DB,
    DEFAULT_POSTGRES_HOST,
    DEFAULT_POSTGRES_PORT,
    DEFAULT_POSTGRES_TABLE_NAME,
    DEFAULT_POSTGRES_USER,
)


@dataclass
class VectorStoreConfig:
    """Configuration for vector store connection."""

    host: str
    port: int
    database: str
    user: str
    password: str
    table_name: str

    @property
    def dsn(self) -> str:
        """Get PostgreSQL connection string."""
        return f"postgresql://{self.user}:{self.password}@{self.host}:{self.port}/{self.database}"


@dataclass
class Config:
    """Main application configuration."""

    # Database
    vector_store: VectorStoreConfig

    # Server settings
    host: str = DEFAULT_HOST
    port: int = DEFAULT_PORT
    debug: bool = False


def load_config() -> Config:
    """
    Load configuration from environment variables.

    Returns:
        Loaded configuration object.

    Raises:
        ValueError: If required environment variables are missing.
    """
    # Get vector store configuration from environment variables
    vector_store_config = VectorStoreConfig(
        host=os.getenv("POSTGRES_HOST", DEFAULT_POSTGRES_HOST),
        port=int(os.getenv("POSTGRES_PORT", str(DEFAULT_POSTGRES_PORT))),
        database=os.getenv("POSTGRES_DB", DEFAULT_POSTGRES_DB),
        user=os.getenv("POSTGRES_USER", DEFAULT_POSTGRES_USER),
        password=os.getenv("POSTGRES_PASSWORD", ""),
        table_name=os.getenv("POSTGRES_TABLE_NAME", DEFAULT_POSTGRES_TABLE_NAME),
    )

    # Validate essential configuration
    if not vector_store_config.password:
        raise ValueError(
            "Database password is required. Set POSTGRES_PASSWORD environment variable."
        )

    # Get server configuration from environment
    host = os.getenv("HOST", DEFAULT_HOST)
    port = int(os.getenv("PORT", str(DEFAULT_PORT)))
    debug = os.getenv("DEBUG", "false").lower() == "true"

    return Config(
        vector_store=vector_store_config,
        host=host,
        port=port,
        debug=debug,
    )


def validate_config(config: Config) -> None:
    """
    Validate configuration for required fields and consistency.

    Args:
        config: Configuration to validate.

    Raises:
        ValueError: If configuration is invalid.
    """
    # Check database configuration
    if not config.vector_store.password:
        raise ValueError("Database password is required")


# Backwards compatibility alias
class ConfigManager:
    """
    Backwards compatibility wrapper for configuration management.

    This class is deprecated. Use `load_config()` and `validate_config()` directly.
    """

    @staticmethod
    def load_config() -> Config:
        """Load configuration from environment variables."""
        return load_config()

    @staticmethod
    def validate_config(config: Config) -> None:
        """Validate configuration for required fields and consistency."""
        validate_config(config)
