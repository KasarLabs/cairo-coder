"""Configuration management for Cairo Coder."""

import os
from pathlib import Path
from typing import Any, Dict, Optional

import toml
from pydantic_settings import BaseSettings

from ..core.config import (
    AgentConfiguration,
    Config,
    LLMProviderConfig,
    VectorStoreConfig,
)
from ..core.types import DocumentSource


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

        # Load base configuration from TOML
        config_dict: Dict[str, Any] = {}
        if config_path:
            with open(config_path, "r") as f:
                config_dict = toml.load(f)

        # Create configuration objects
        config = Config()

        # Update server settings
        if "server" in config_dict:
            server = config_dict["server"]
            config.host = server.get("host", config.host)
            config.port = server.get("port", config.port)
            config.debug = server.get("debug", config.debug)

        # Update vector store settings
        if "vector_db" in config_dict:
            db = config_dict["vector_db"]
            config.vector_store = VectorStoreConfig(
                host=db.get("host", config.vector_store.host),
                port=db.get("port", config.vector_store.port),
                database=db.get("database", config.vector_store.database),
                user=db.get("user", config.vector_store.user),
                password=db.get("password", config.vector_store.password),
                table_name=db.get("table_name", config.vector_store.table_name),
                similarity_measure=db.get("similarity_measure", config.vector_store.similarity_measure),
            )

        # Override with environment variables if explicitly set
        if os.getenv("POSTGRES_HOST") is not None:
            config.vector_store.host = os.getenv("POSTGRES_HOST", config.vector_store.host)
        if os.getenv("POSTGRES_PORT") is not None:
            config.vector_store.port = int(os.getenv("POSTGRES_PORT", str(config.vector_store.port)))
        if os.getenv("POSTGRES_DB") is not None:
            config.vector_store.database = os.getenv("POSTGRES_DB", config.vector_store.database)
        if os.getenv("POSTGRES_USER") is not None:
            config.vector_store.user = os.getenv("POSTGRES_USER", config.vector_store.user)
        if os.getenv("POSTGRES_PASSWORD") is not None:
            config.vector_store.password = os.getenv("POSTGRES_PASSWORD", config.vector_store.password)

        # Update LLM provider settings
        if "providers" in config_dict:
            providers = config_dict["providers"]
            config.llm = LLMProviderConfig(
                openai_api_key=providers.get("openai", {}).get("api_key", config.llm.openai_api_key),
                openai_model=providers.get("openai", {}).get("model", config.llm.openai_model),
                anthropic_api_key=providers.get("anthropic", {}).get("api_key", config.llm.anthropic_api_key),
                anthropic_model=providers.get("anthropic", {}).get("model", config.llm.anthropic_model),
                gemini_api_key=providers.get("gemini", {}).get("api_key", config.llm.gemini_api_key),
                gemini_model=providers.get("gemini", {}).get("model", config.llm.gemini_model),
                default_provider=providers.get("default", config.llm.default_provider),
                temperature=providers.get("temperature", config.llm.temperature),
                max_tokens=providers.get("max_tokens", config.llm.max_tokens),
                streaming=providers.get("streaming", config.llm.streaming),
                embedding_model=providers.get("embedding_model", config.llm.embedding_model),
            )

        # Override with environment variables if explicitly set
        config.llm.openai_api_key = os.getenv("OPENAI_API_KEY", config.llm.openai_api_key)
        config.llm.anthropic_api_key = os.getenv("ANTHROPIC_API_KEY", config.llm.anthropic_api_key)
        config.llm.gemini_api_key = os.getenv("GEMINI_API_KEY", config.llm.gemini_api_key)

        # Load agent configurations
        if "agents" in config_dict:
            if not config.agents:
                config.agents = {}
            for agent_id, agent_data in config_dict["agents"].items():
                sources = []
                for source_str in agent_data.get("sources", []):
                    try:
                        sources.append(DocumentSource(source_str))
                    except ValueError:
                        raise ValueError(f"Invalid source: {source_str}")

                agent_config = AgentConfiguration(
                    id=agent_id,
                    name=agent_data.get("name", agent_id),
                    description=agent_data.get("description", ""),
                    sources=sources,
                    contract_template=agent_data.get("contract_template"),
                    test_template=agent_data.get("test_template"),
                    max_source_count=agent_data.get("max_source_count", 10),
                    similarity_threshold=agent_data.get("similarity_threshold", 0.4),
                    retrieval_program_name=agent_data.get("retrieval_program", "default"),
                    generation_program_name=agent_data.get("generation_program", "default"),
                )
                config.agents[agent_id] = agent_config

        # Update logging settings
        if "logging" in config_dict:
            logging = config_dict["logging"]
            config.log_level = logging.get("level", config.log_level)
            config.log_format = logging.get("format", config.log_format)

        # Update monitoring settings
        if "monitoring" in config_dict:
            monitoring = config_dict["monitoring"]
            config.enable_metrics = monitoring.get("enable_metrics", config.enable_metrics)
            config.metrics_port = monitoring.get("metrics_port", config.metrics_port)

        # Update optimization settings
        if "optimization" in config_dict:
            optimization = config_dict["optimization"]
            config.optimization_dir = optimization.get("dir", config.optimization_dir)
            config.enable_optimization = optimization.get("enable", config.enable_optimization)

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
        # Check for at least one LLM provider
        if not any([
            config.llm.openai_api_key,
            config.llm.anthropic_api_key,
            config.llm.gemini_api_key
        ]):
            raise ValueError("At least one LLM provider API key must be configured")

        # Check default provider is configured
        provider_map = {
            "openai": config.llm.openai_api_key,
            "anthropic": config.llm.anthropic_api_key,
            "gemini": config.llm.gemini_api_key,
        }

        if config.llm.default_provider not in provider_map:
            raise ValueError(f"Unknown default provider: {config.llm.default_provider}")

        if not provider_map[config.llm.default_provider]:
            raise ValueError(f"Default provider '{config.llm.default_provider}' has no API key configured")

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
