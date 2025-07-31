"""Tests for configuration management."""


from cairo_coder.core.config import Config
import pytest

from cairo_coder.config.manager import ConfigManager


class TestConfigManager:
    """Test configuration manager functionality."""

    def test_load_config_requires_password(self) -> None:
        """Test loading configuration requires database password."""
        # No password set due to autouse fixture
        with pytest.raises(ValueError, match="Database password is required"):
            ConfigManager.load_config()

    def test_load_config_with_defaults(self, monkeypatch: pytest.MonkeyPatch) -> None:
        """Test loading configuration with default values."""
        # Set required password
        monkeypatch.setenv("POSTGRES_PASSWORD", "test-password")

        config = ConfigManager.load_config()

        # Check defaults
        assert config.vector_store.host == "postgres"
        assert config.vector_store.port == 5432
        assert config.vector_store.database == "cairocoder"
        assert config.vector_store.user == "cairocoder"
        assert config.vector_store.password == "test-password"
        assert config.vector_store.table_name == "documents"
        assert config.vector_store.similarity_measure == "cosine"
        assert config.host == "0.0.0.0"
        assert config.port == 3001
        assert config.debug is False

    def test_load_config_from_environment(self, monkeypatch: pytest.MonkeyPatch) -> None:
        """Test loading configuration from environment variables."""
        # Set all environment variables
        monkeypatch.setenv("POSTGRES_HOST", "env-host")
        monkeypatch.setenv("POSTGRES_PORT", "5555")
        monkeypatch.setenv("POSTGRES_DB", "env-db")
        monkeypatch.setenv("POSTGRES_USER", "env-user")
        monkeypatch.setenv("POSTGRES_PASSWORD", "env-pass")
        monkeypatch.setenv("POSTGRES_TABLE_NAME", "env-table")
        monkeypatch.setenv("SIMILARITY_MEASURE", "dot_product")
        monkeypatch.setenv("HOST", "127.0.0.1")
        monkeypatch.setenv("PORT", "8080")
        monkeypatch.setenv("DEBUG", "true")

        config = ConfigManager.load_config()

        # Check all values from environment
        assert config.vector_store.host == "env-host"
        assert config.vector_store.port == 5555
        assert config.vector_store.database == "env-db"
        assert config.vector_store.user == "env-user"
        assert config.vector_store.password == "env-pass"
        assert config.vector_store.table_name == "env-table"
        assert config.vector_store.similarity_measure == "dot_product"
        assert config.host == "127.0.0.1"
        assert config.port == 8080
        assert config.debug is True

    def test_get_agent_config(self, monkeypatch: pytest.MonkeyPatch) -> None:
        """Test retrieving agent configuration."""
        monkeypatch.setenv("POSTGRES_PASSWORD", "test-password")
        config = ConfigManager.load_config()

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

    def test_validate_config(self, monkeypatch: pytest.MonkeyPatch) -> None:
        """Test configuration validation."""
        # Valid config
        monkeypatch.setenv("POSTGRES_PASSWORD", "test-pass")
        config: Config = ConfigManager.load_config()
        ConfigManager.validate_config(config)

        # No database password
        config.vector_store.password = ""
        with pytest.raises(ValueError, match="Database password is required"):
            ConfigManager.validate_config(config)


    def test_dsn_property(self, monkeypatch: pytest.MonkeyPatch) -> None:
        """Test PostgreSQL DSN generation."""
        monkeypatch.setenv("POSTGRES_USER", "testuser")
        monkeypatch.setenv("POSTGRES_PASSWORD", "testpass")
        monkeypatch.setenv("POSTGRES_HOST", "testhost")
        monkeypatch.setenv("POSTGRES_PORT", "5432")
        monkeypatch.setenv("POSTGRES_DB", "testdb")

        config = ConfigManager.load_config()

        expected_dsn = "postgresql://testuser:testpass@testhost:5432/testdb"
        assert config.vector_store.dsn == expected_dsn
