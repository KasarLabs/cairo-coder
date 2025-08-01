"""Configuration management for Cairo Coder."""

import os

from ..core.config import (
    AgentConfiguration,
    Config,
    VectorStoreConfig,
)


class ConfigManager:
    """Manages application configuration from environment variables."""

    @staticmethod
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
            host=os.getenv("POSTGRES_HOST", "postgres"),
            port=int(os.getenv("POSTGRES_PORT", "5432")),
            database=os.getenv("POSTGRES_DB", "cairocoder"),
            user=os.getenv("POSTGRES_USER", "cairocoder"),
            password=os.getenv("POSTGRES_PASSWORD", ""),
            table_name=os.getenv("POSTGRES_TABLE_NAME", "documents"),
            similarity_measure=os.getenv("SIMILARITY_MEASURE", "cosine"),
        )

        # Validate essential configuration
        if not vector_store_config.password:
            raise ValueError(
                "Database password is required. Set POSTGRES_PASSWORD environment variable."
            )

        # Get server configuration from environment
        host = os.getenv("HOST", "0.0.0.0")
        port = int(os.getenv("PORT", "3001"))
        debug = os.getenv("DEBUG", "false").lower() == "true"

        return Config(
            vector_store=vector_store_config,
            host=host,
            port=port,
            debug=debug,
            default_agent_id="cairo-coder",
        )

    @staticmethod
    def get_agent_config(config: Config, agent_id: str | None = None) -> AgentConfiguration:
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
            raise ValueError(
                f"Default agent '{config.default_agent_id}' not found in configuration"
            )
