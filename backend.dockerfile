FROM python:3.12-slim-bookworm

# Install UV
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Set working directory
WORKDIR /app

# Copy Python project files
COPY python/pyproject.toml python/uv.lock ./python/
COPY python/src ./python/src
COPY python/optimizers ./python/optimizers
COPY README.md ./python/

# For psycopg2
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies using UV
WORKDIR /app/python
RUN uv sync --frozen

# Expose the port the app runs on
EXPOSE 3001

# Run the application
CMD ["uv", "run", "cairo-coder"]
