"""Integration tests for configuration management."""

from pathlib import Path

import pytest

from cairo_coder.config.manager import ConfigManager


@pytest.fixture(scope="function", autouse=True)
def clear_env_vars(monkeypatch: pytest.MonkeyPatch):
    """Clear all environment variables before each test."""
    import os

    for var in [
        "POSTGRES_HOST",
        "POSTGRES_PORT",
        "POSTGRES_DB",
        "POSTGRES_USER",
        "POSTGRES_PASSWORD",
        "OPENAI_API_KEY",
        "ANTHROPIC_API_KEY",
        "GEMINI_API_KEY",
    ]:
        os.environ.pop(var, None)
        monkeypatch.delenv(var, raising=False)

    yield

class TestConfigIntegration:
    """Test configuration integration with real files and environment."""

    def test_load_full_configuration(
        self, sample_config_file: Path, clear_env_vars
    ) -> None:
        """Test loading a complete configuration file."""
        config = ConfigManager.load_config(sample_config_file)

        # Verify database settings
        assert config.vector_store.host == "test-db.example.com"
        assert config.vector_store.port == 5433
        assert config.vector_store.database == "test_cairo"
        assert config.vector_store.user == "test_user"
        assert config.vector_store.password == "test_password"
        assert config.vector_store.table_name == "test_documents"
        assert config.vector_store.similarity_measure == "cosine"

    def test_environment_override_integration(
        self, sample_config_file: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """Test that environment variables properly override config file values."""
        # Set environment overrides
        monkeypatch.setenv("POSTGRES_HOST", "env-override-host")
        monkeypatch.setenv("POSTGRES_PORT", "6543")
        monkeypatch.setenv("POSTGRES_PASSWORD", "env-password")
        monkeypatch.setenv("OPENAI_API_KEY", "env-openai-key")
        monkeypatch.setenv("ANTHROPIC_API_KEY", "env-anthropic-key")

        config = ConfigManager.load_config(sample_config_file)

        # Check environment overrides
        assert config.vector_store.host == "env-override-host"
        assert config.vector_store.port == 6543
        assert config.vector_store.password == "env-password"

        # Check non-overridden values remain
        assert config.vector_store.database == "test_cairo"

    def test_dsn_generation(self, sample_config_file: Path) -> None:
        """Test PostgreSQL DSN generation."""
        config = ConfigManager.load_config(sample_config_file)

        expected_dsn = "postgresql://test_user:test_password@test-db.example.com:5433/test_cairo"
        assert config.vector_store.dsn == expected_dsn

    @pytest.mark.asyncio
    async def test_missing_config_file(self) -> None:
        """Test behavior when config file doesn't exist."""
        with pytest.raises(FileNotFoundError):
            ConfigManager.load_config(Path("/nonexistent/config.toml"))
