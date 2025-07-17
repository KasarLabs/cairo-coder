"""Configuration management for Cairo Coder."""

import os
from pathlib import Path
from typing import Any, Dict, Optional

import toml
from pydantic_settings import BaseSettings

from ..core.config import (
    AgentConfiguration,
    Config,
    VectorStoreConfig,
)

class ConfigManager:
    """Manages application configuration from TOML files and environment variables."""

    @staticmethod
    def load_config(config_path: Optional[Path] = None) -> Config:
        """
        Load configuration from TOML file and environment variables.

        Args:
            config_path: Path to configuration file. Defaults to config.toml in project root.

        Returns:
            Loaded configuration object.
        """
        if config_path is None:
            config_path = Path("config.toml")
            if not config_path.exists():
                raise FileNotFoundError(f"Configuration file not found at {config_path}")

        # Check if config file exists when explicitly provided
        if config_path and not config_path.exists():
            raise FileNotFoundError(f"Configuration file not found at {config_path}")

        # Validate config

        # Load base configuration from TOML
        config_dict: Dict[str, Any] = {}
        if config_path:
            with open(config_path, "r") as f:
                config_dict = toml.load(f)


        if not "VECTOR_DB" in config_dict:
            raise ValueError("VECTOR_DB section is required in config.toml")

        # Update vector store settings
        vector_db_config = config_dict["VECTOR_DB"]
        vector_store_config = VectorStoreConfig(
            host=vector_db_config["POSTGRES_HOST"],
            port=vector_db_config["POSTGRES_PORT"],
            database=vector_db_config["POSTGRES_DB"],
            user=vector_db_config["POSTGRES_USER"],
            password=vector_db_config["POSTGRES_PASSWORD"],
            table_name=vector_db_config["POSTGRES_TABLE_NAME"],
            similarity_measure=vector_db_config["SIMILARITY_MEASURE"],
        )

        # Override with environment variables if explicitly set
        if os.getenv("POSTGRES_HOST") is not None:
            vector_store_config.host = os.getenv("POSTGRES_HOST", vector_store_config.host)
        if os.getenv("POSTGRES_PORT") is not None:
            vector_store_config.port = int(os.getenv("POSTGRES_PORT", str(vector_store_config.port)))
        if os.getenv("POSTGRES_DB") is not None:
            vector_store_config.database = os.getenv("POSTGRES_DB", vector_store_config.database)
        if os.getenv("POSTGRES_USER") is not None:
            vector_store_config.user = os.getenv("POSTGRES_USER", vector_store_config.user)
        if os.getenv("POSTGRES_PASSWORD") is not None:
            vector_store_config.password = os.getenv("POSTGRES_PASSWORD", vector_store_config.password)

        config = Config(
            vector_store=vector_store_config,
            default_agent_id="cairo-coder",
        )

        return config

    @staticmethod
    def get_agent_config(config: Config, agent_id: Optional[str] = None) -> AgentConfiguration:
        """
        Get agent configuration by ID.

        Args:
            config: Application configuration.
            agent_id: Agent ID to retrieve. Defaults to default agent.

        Returns:
            Agent configuration.

        Raises:
            ValueError: If agent ID is not found.
        """
        if agent_id is None:
            agent_id = config.default_agent_id

        if agent_id not in config.agents:
            raise ValueError(f"Agent '{agent_id}' not found in configuration")

        return config.agents[agent_id]

    @staticmethod
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

        # Check agents have valid sources
        for agent_id, agent in config.agents.items():
            if not agent.sources:
                raise ValueError(f"Agent '{agent_id}' has no sources configured")

        # Check default agent exists
        if config.default_agent_id not in config.agents:
            raise ValueError(f"Default agent '{config.default_agent_id}' not found in configuration")
