"""Configuration data models for Cairo Coder."""

from dataclasses import dataclass


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
    host: str = "0.0.0.0"
    port: int = 3001
    debug: bool = False
