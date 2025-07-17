"""Integration tests for configuration management."""

import os
import tempfile
from pathlib import Path
from typing import Generator

import pytest
import toml

from cairo_coder.config.manager import ConfigManager
from cairo_coder.core.config import Config
from cairo_coder.utils.logging import setup_logging


class TestConfigIntegration:
    """Test configuration integration with real files and environment."""

    @pytest.fixture
    def sample_config_file(self) -> Generator[Path, None, None]:
        """Create a temporary config file for testing."""
        config_data = {
            "VECTOR_DB": {
                "POSTGRES_HOST": "test-db.example.com",
                "POSTGRES_PORT": 5433,
                "POSTGRES_DB": "test_cairo",
                "POSTGRES_USER": "test_user",
                "POSTGRES_PASSWORD": "test_password",
                "POSTGRES_TABLE_NAME": "test_documents",
                "SIMILARITY_MEASURE": "cosine"
            },
            "providers": {
                "default": "openai",
                "embedding_model": "text-embedding-3-large",
                "openai": {
                    "api_key": "test-openai-key",
                    "model": "gpt-4"
                },
                "anthropic": {
                    "api_key": "test-anthropic-key",
                    "model": "claude-3-sonnet"
                }
            },
            "logging": {
                "level": "DEBUG",
                "format": "json"
            },
            "monitoring": {
                "enable_metrics": True,
                "metrics_port": 9191
            },
            "agents": {
                "test-agent": {
                    "name": "Test Agent",
                    "description": "Integration test agent",
                    "sources": ["cairo_book", "starknet_docs"],
                    "max_source_count": 5,
                    "similarity_threshold": 0.5,
                    "contract_template": "Test contract template",
                    "test_template": "Test template"
                }
            }
        }

        with tempfile.NamedTemporaryFile(mode="w", suffix=".toml", delete=False) as f:
            toml.dump(config_data, f)
            temp_path = Path(f.name)

        yield temp_path

        # Cleanup
        os.unlink(temp_path)

    def test_load_full_configuration(self, sample_config_file: Path, monkeypatch: pytest.MonkeyPatch) -> None:
        """Test loading a complete configuration file."""
        # Clear any existing environment variables
        for var in ["POSTGRES_HOST", "POSTGRES_PORT", "POSTGRES_DB", "POSTGRES_USER", "POSTGRES_PASSWORD",
                    "OPENAI_API_KEY", "ANTHROPIC_API_KEY", "GEMINI_API_KEY"]:
            monkeypatch.delenv(var, raising=False)

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
        self,
        sample_config_file: Path,
        monkeypatch: pytest.MonkeyPatch
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
