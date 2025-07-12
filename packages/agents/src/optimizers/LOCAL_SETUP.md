# Running Dataset Generation Locally with Docker PostgreSQL

This guide explains how to run the Starklings dataset generation script on your local machine while connecting to PostgreSQL running in Docker.

## Key Configuration Changes

When running the script locally (outside Docker), you need to update the database configuration to connect to the Docker PostgreSQL instance.

### 1. Update config.toml

The PostgreSQL container exposes port 5455 on your host machine (mapped from container's port 5432). Update your `packages/agents/config.toml`:

```toml
[VECTOR_DB]
POSTGRES_USER = "cairocoder"
POSTGRES_PASSWORD = "cairocoder"
POSTGRES_DB = "cairocoder"
POSTGRES_HOST = "localhost"    # Changed from "postgres" to "localhost"
POSTGRES_PORT = "5455"          # Changed from "5432" to "5455"
```

### 2. Start PostgreSQL and Ingest Data

```bash
# From the project root
docker compose up postgres

# Wait for PostgreSQL to be ready, then in another terminal:
# Ingest documentation (if not already done)
docker compose up ingester
```

### 3. Verify Database Connection

You can test the connection using psql or any PostgreSQL client:

```bash
# Using psql (if installed)
psql -h localhost -p 5455 -U cairocoder -d cairocoder

# Or using Docker
docker exec -it postgres psql -U cairocoder -d cairocoder
```

### 4. Run the Dataset Generator

```bash
cd packages/agents

# Ensure dependencies are installed
pnpm install

# Run the generator
pnpm generate-starklings-dataset
```

## Network Configuration Explanation

- **Inside Docker**: Services use the Docker network name `postgres` (hostname) on port `5432`
- **From Host**: Access via `localhost` on the exposed port `5455`

This is why:

- Backend service (running in Docker) uses: `POSTGRES_HOST="postgres"` and `POSTGRES_PORT="5432"`
- Local scripts use: `POSTGRES_HOST="localhost"` and `POSTGRES_PORT="5455"`

## Alternative: Run Script Inside Docker

If you prefer not to modify config.toml, you can run the script inside a Docker container:

```bash
# Create a temporary Dockerfile
cat > Dockerfile.dataset-gen << EOF
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache git
COPY . .
RUN cd packages/agents && npm install
WORKDIR /app/packages/agents
CMD ["npm", "run", "generate-starklings-dataset"]
EOF

# Build and run
docker build -f Dockerfile.dataset-gen -t dataset-gen .
docker run --rm \
  --network cairo-coder_cairo_coder \
  -e GEMINI_API_KEY="$GEMINI_API_KEY" \
  -v $(pwd)/packages/agents/src/optimizers/datasets:/app/packages/agents/src/optimizers/datasets \
  dataset-gen
```

## Troubleshooting

### "ENOTFOUND postgres" Error

- Ensure you've updated `POSTGRES_HOST` to `"localhost"` in config.toml
- Verify PostgreSQL is running: `docker ps | grep postgres`

### "Connection refused" Error

- Check if port 5455 is exposed: `docker port postgres`
- Ensure no firewall is blocking the connection
- Try: `telnet localhost 5455` to test connectivity

### "Database does not exist" Error

- The database might not be initialized. Check `.env` file in project root
- Ensure ingester has run at least once to create tables

### Port Already in Use

If port 5455 is already in use, you can change it in docker-compose.yml:

```yaml
ports:
  - 5456:5432 # Change to another port
```

Then update config.toml accordingly.

## Config Management Tip

To avoid modifying config.toml back and forth, you can create a local config:

```bash
# Create local config for dataset generation
cp config.toml config.local.toml

# Update config.local.toml with localhost settings
# Then temporarily use it:
mv config.toml config.docker.toml
mv config.local.toml config.toml
pnpm generate-starklings-dataset
mv config.toml config.local.toml
mv config.docker.toml config.toml
```

Or modify the script to accept a config path parameter.
