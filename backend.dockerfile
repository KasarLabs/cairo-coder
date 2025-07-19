FROM python:3.12-slim-bookworm

# Install UV
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Set working directory
WORKDIR /app

# Copy Python project files
COPY python/pyproject.toml python/uv.lock ./python/
COPY python/src ./python/src
COPY python/optimizers ./python/optimizers
COPY python/config.toml ./python/
COPY python/.env ./python/
COPY README.md ./python/

# For psycopg2
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev=15.8-0+deb12u1 \
    gcc=4:12.2.0-3 \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies using UV
WORKDIR /app/python
RUN uv sync --frozen

# Expose the port the app runs on
EXPOSE 3001

# Run the application
CMD ["uv", "run", "cairo-coder"]
