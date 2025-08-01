"""Integration tests for configuration management."""

import pytest

from cairo_coder.config.manager import ConfigManager


class TestConfigIntegration:
    """Test configuration integration with environment variables."""

    def test_load_configuration_from_env(self, monkeypatch: pytest.MonkeyPatch) -> None:
        """Test loading configuration from environment variables."""
        # Set all environment variables
        monkeypatch.setenv("POSTGRES_HOST", "test-db.example.com")
        monkeypatch.setenv("POSTGRES_PORT", "5433")
        monkeypatch.setenv("POSTGRES_DB", "test_cairo")
        monkeypatch.setenv("POSTGRES_USER", "test_user")
        monkeypatch.setenv("POSTGRES_PASSWORD", "test_password")
        monkeypatch.setenv("POSTGRES_TABLE_NAME", "test_documents")
        monkeypatch.setenv("SIMILARITY_MEASURE", "cosine")
        monkeypatch.setenv("HOST", "localhost")
        monkeypatch.setenv("PORT", "8001")
        monkeypatch.setenv("DEBUG", "true")

        config = ConfigManager.load_config()

        # Verify all settings
        assert config.vector_store.host == "test-db.example.com"
        assert config.vector_store.port == 5433
        assert config.vector_store.database == "test_cairo"
        assert config.vector_store.user == "test_user"
        assert config.vector_store.password == "test_password"
        assert config.vector_store.table_name == "test_documents"
        assert config.vector_store.similarity_measure == "cosine"
        assert config.host == "localhost"
        assert config.port == 8001
        assert config.debug is True

    def test_partial_environment_config(self, monkeypatch: pytest.MonkeyPatch) -> None:
        """Test loading configuration with partial environment variables."""
        # Set only required variables
        monkeypatch.setenv("POSTGRES_PASSWORD", "test-password")
        # Override some defaults
        monkeypatch.setenv("POSTGRES_HOST", "custom-host")
        monkeypatch.setenv("PORT", "9000")

        config = ConfigManager.load_config()

        # Check overridden values
        assert config.vector_store.host == "custom-host"
        assert config.vector_store.password == "test-password"
        assert config.port == 9000

        # Check defaults
        assert config.vector_store.database == "cairocoder"
        assert config.vector_store.user == "cairocoder"
        assert config.vector_store.port == 5432
        assert config.host == "0.0.0.0"
        assert config.debug is False

    def test_dsn_generation(self, monkeypatch: pytest.MonkeyPatch) -> None:
        """Test PostgreSQL DSN generation."""
        monkeypatch.setenv("POSTGRES_USER", "test_user")
        monkeypatch.setenv("POSTGRES_PASSWORD", "test_password")
        monkeypatch.setenv("POSTGRES_HOST", "test-db.example.com")
        monkeypatch.setenv("POSTGRES_PORT", "5433")
        monkeypatch.setenv("POSTGRES_DB", "test_cairo")

        config = ConfigManager.load_config()

        expected_dsn = "postgresql://test_user:test_password@test-db.example.com:5433/test_cairo"
        assert config.vector_store.dsn == expected_dsn

    def test_missing_password_raises_error(self) -> None:
        """Test that missing password raises an error."""
        # No password set due to autouse fixture
        with pytest.raises(ValueError, match="Database password is required"):
            ConfigManager.load_config()
