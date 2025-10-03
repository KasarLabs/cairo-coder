FROM oven/bun:1 AS base

# Install common utilities
# hadolint ignore=DL3008
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    unzip \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy ingester files
COPY ingesters ./ingesters

# Copy .env file for configuration
COPY .env ./.env

# Copy ingester files generated from python
COPY python/src/scripts/summarizer/generated ./python/src/scripts/summarizer/generated

# Install dependencies
WORKDIR /app/ingesters
RUN bun install

# Install Antora globally
RUN bun add -g @antora/cli @antora/site-generator

# Install mdbook
RUN curl -L https://github.com/rust-lang/mdBook/releases/download/v0.4.48/mdbook-v0.4.48-x86_64-unknown-linux-gnu.tar.gz | tar xz && \
    mv mdbook /usr/local/bin/

# Set working directory to ingesters
WORKDIR /app/ingesters

# Run the ingestion script
CMD ["bun", "run", "generate-embeddings:yes"]
