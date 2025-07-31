# Configuration Migration Guide

This guide helps you migrate from the old multi-file configuration system to the new centralized environment variable approach.

## What Changed

### Before (Multiple Config Files)

- `python/.env` - Python backend secrets
- `python/config.toml` - Python backend configuration
- `packages/agents/config.toml` - TypeScript ingester configuration
- `packages/backend/.env` - Backend service variables
- Manual host switching between `localhost` and `postgres`

### After (Single Source of Truth)

- `.env` - All configuration in one place
- Environment variables take precedence
- Automatic host detection for Docker vs local development
- No secrets in Docker images

## Migration Steps

1. **Backup your existing configuration**

   ```bash
   cp python/.env python/.env.backup
   cp python/config.toml python/config.toml.backup
   cp packages/agents/config.toml packages/agents/config.toml.backup
   ```

2. **Create the new .env file**

   ```bash
   cp .env.example .env
   ```

3. **Migrate your credentials**

   Copy these values from your old config files to the new `.env`:

   ```bash
   # From [VECTOR_DB] section
   POSTGRES_USER="your-value"
   POSTGRES_PASSWORD="your-value"
   POSTGRES_DB="your-value"
   POSTGRES_HOST="postgres"  # or "localhost" for local dev
   POSTGRES_PORT="5432"
   POSTGRES_TABLE_NAME="documents"

   # From [GENERAL] section
   PORT="3001"
   SIMILARITY_MEASURE="cosine"

   # From [PROVIDERS] section
   DEFAULT_CHAT_PROVIDER="gemini"
   DEFAULT_CHAT_MODEL="Gemini Flash 2.5"
   DEFAULT_FAST_CHAT_PROVIDER="gemini"
   DEFAULT_FAST_CHAT_MODEL="Gemini Flash 2.5"
   DEFAULT_EMBEDDING_PROVIDER="openai"
   DEFAULT_EMBEDDING_MODEL="Text embedding 3 large"

   # From [API_KEYS] section
   OPENAI_API_KEY="your-key"
   ANTHROPIC_API_KEY="your-key"
   GEMINI_API_KEY="your-key"
   DEEPSEEK_API_KEY="your-key"
   GROQ_API_KEY="your-key"

   # From [API_ENDPOINTS] section
   OLLAMA_ENDPOINT="your-endpoint"

   # From [VERSIONS] section
   STARKNET_FOUNDRY_VERSION="0.38.0"
   SCARB_VERSION="2.11.2"

   # From python/.env (if using LangSmith)
   LANGSMITH_API_KEY="your-key"
   ```

4. **Remove old configuration files**

   ```bash
   rm python/.env python/config.toml
   rm packages/agents/config.toml
   rm packages/backend/.env
   ```

5. **Update your Docker images**
   ```bash
   docker compose build --no-cache
   ```

## Key Differences

### Database Host Configuration

**Before:** Manual switching in config files

```toml
# For local development
POSTGRES_HOST = "localhost"

# For Docker
POSTGRES_HOST = "postgres"
```

**After:** Automatic detection

```bash
# .env file always uses "postgres"
POSTGRES_HOST="postgres"

# For local development, override with:
export POSTGRES_HOST=localhost
```

### API Keys

**Before:** Scattered across multiple files

- `python/.env`: Some keys
- `packages/agents/config.toml`: Other keys

**After:** All in one `.env` file

```bash
# All API keys in one place
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""
GEMINI_API_KEY=""
```

## Troubleshooting

### "Config file not found" warnings

These warnings are normal and can be ignored. The system now uses environment variables by default.

### Database connection issues

Ensure your `.env` file has the correct database credentials and that the `POSTGRES_HOST` is set correctly:

- Docker: `POSTGRES_HOST="postgres"`
- Local: `export POSTGRES_HOST=localhost`

### Missing API keys

Check that all required API keys are present in your `.env` file. The application will show clear error messages for missing keys.

## Benefits of the New System

1. **Security**: No secrets in Docker images
2. **Simplicity**: One file to configure everything
3. **Flexibility**: Easy to override with environment variables
4. **Consistency**: Same configuration approach across all services
