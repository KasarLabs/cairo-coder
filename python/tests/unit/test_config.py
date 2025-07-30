"""Tests for configuration management."""

from pathlib import Path

import pytest

from cairo_coder.config.manager import ConfigManager
from cairo_coder.core.config import AgentConfiguration
from cairo_coder.core.types import DocumentSource


class TestConfigManager:
    """Test configuration manager functionality."""

    def test_load_config_fails_if_no_config_file(self) -> None:
        """Test loading configuration with no config file."""
        with pytest.raises(FileNotFoundError, match="Configuration file not found at"):
            ConfigManager.load_config(Path("nonexistent.toml"))

    def test_load_toml_config(
        self, monkeypatch: pytest.MonkeyPatch, sample_config_file: Path
    ) -> None:
        """Test loading configuration from TOML file."""
        # Clear environment variables that might interfere
        monkeypatch.delenv("POSTGRES_HOST", raising=False)
        monkeypatch.delenv("POSTGRES_PORT", raising=False)
        monkeypatch.delenv("POSTGRES_DB", raising=False)
        monkeypatch.delenv("POSTGRES_USER", raising=False)
        monkeypatch.delenv("POSTGRES_PASSWORD", raising=False)
        monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
        monkeypatch.delenv("OPENAI_API_KEY", raising=False)
        monkeypatch.delenv("GOOGLE_API_KEY", raising=False)

        config = ConfigManager.load_config(sample_config_file)

        assert config.vector_store.host == "test-db.example.com"
        assert config.vector_store.port == 5433
        assert config.vector_store.database == "test_cairo"

    def test_environment_override(
        self, monkeypatch: pytest.MonkeyPatch, sample_config_file: Path
    ) -> None:
        """Test environment variable overrides."""
        # Set environment variables
        monkeypatch.setenv("POSTGRES_HOST", "env-host")
        monkeypatch.setenv("POSTGRES_PORT", "5555")
        monkeypatch.setenv("POSTGRES_DB", "env-db")
        monkeypatch.setenv("POSTGRES_USER", "env-user")
        monkeypatch.setenv("POSTGRES_PASSWORD", "env-pass")
        monkeypatch.setenv("OPENAI_API_KEY", "env-openai-key")
        monkeypatch.setenv("ANTHROPIC_API_KEY", "env-anthropic-key")
        monkeypatch.setenv("GEMINI_API_KEY", "env-gemini-key")

        config = ConfigManager.load_config(sample_config_file)

        # Check environment overrides
        assert config.vector_store.host == "env-host"
        assert config.vector_store.port == 5555
        assert config.vector_store.database == "env-db"
        assert config.vector_store.user == "env-user"
        assert config.vector_store.password == "env-pass"

    def test_get_agent_config(self, sample_config_file: Path) -> None:
        """Test retrieving agent configuration."""
        config = ConfigManager.load_config(sample_config_file)

        # Get default agent
        agent = ConfigManager.get_agent_config(config, "cairo-coder")
        assert agent.id == "cairo-coder"
        assert agent.name == "Cairo Coder"
        assert DocumentSource.CAIRO_BOOK in agent.sources

        # Get specific agent
        scarb_agent = ConfigManager.get_agent_config(config, "scarb-assistant")
        assert scarb_agent.id == "scarb-assistant"
        assert scarb_agent.name == "Scarb Assistant"
        assert DocumentSource.SCARB_DOCS in scarb_agent.sources

        # Get non-existent agent
        with pytest.raises(ValueError, match="Agent 'unknown' not found"):
            ConfigManager.get_agent_config(config, "unknown")

    def test_validate_config(self, sample_config_file: Path) -> None:
        """Test configuration validation."""
        # Valid config
        config = ConfigManager.load_config(sample_config_file)
        config.vector_store.password = "test-pass"
        ConfigManager.validate_config(config)

        # No database password
        config = ConfigManager.load_config(sample_config_file)
        config.vector_store.password = ""
        with pytest.raises(ValueError, match="Database password is required"):
            ConfigManager.validate_config(config)

        # Agent without sources
        config = ConfigManager.load_config(sample_config_file)
        config.vector_store.password = "test-pass"
        config.agents["test"] = AgentConfiguration(
            id="test", name="Test", description="Test agent", sources=[]
        )
        with pytest.raises(ValueError, match="has no sources configured"):
            ConfigManager.validate_config(config)

        # Invalid default agent
        config = ConfigManager.load_config(sample_config_file)
        config.vector_store.password = "test-pass"
        config.default_agent_id = "unknown"
        config.agents = {}  # No agents
        with pytest.raises(ValueError, match="Default agent 'unknown' not found"):
            ConfigManager.validate_config(config)

    def test_dsn_property(self, sample_config_file: Path) -> None:
        """Test PostgreSQL DSN generation."""
        config = ConfigManager.load_config(sample_config_file)
        config.vector_store.user = "testuser"
        config.vector_store.password = "testpass"
        config.vector_store.host = "testhost"
        config.vector_store.port = 5432
        config.vector_store.database = "testdb"

        expected_dsn = "postgresql://testuser:testpass@testhost:5432/testdb"
        assert config.vector_store.dsn == expected_dsn
