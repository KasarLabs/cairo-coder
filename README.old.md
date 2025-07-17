# Legacy TypeScript Backend Instructions

**Note:** These instructions are for the original TypeScript backend, which has been superseded by the Python implementation. The Python backend is now the recommended and default service. Use these instructions only if you need to run the legacy service for a specific reason.

## Installation (TypeScript)

1.  **Prerequisites**: Ensure Docker is installed and running.

2.  **Clone the Repository**:

    ```bash
    git clone https://github.com/KasarLabs/cairo-coder.git
    cd cairo-coder
    ```

3.  **Install Dependencies**:

    ```bash
    pnpm install
    ```

4.  **Configure Backend (`packages/agents/config.toml`)**:
    Inside the `packages/agents` package, copy `sample.config.toml` to `config.toml`. Fill in your OpenAI or Gemini API keys.

5.  **Configure PostgreSQL Database**:

    **a. Database Container Initialization (`.env` file):**
    Create a `.env` file in the root directory with the following PostgreSQL configuration:

    ```
    POSTGRES_USER="YOUR_POSTGRES_USER"
    POSTGRES_PASSWORD="YOUR_POSTGRES_PASSWORD"
    POSTGRES_DB="YOUR_POSTGRES_DB"
    ```

    **b. Application Connection Settings (`config.toml` file):**
    In `packages/agents/config.toml`, configure the database connection section to match the `.env` file:

    ```toml
    [VECTOR_DB]
    POSTGRES_USER="YOUR_POSTGRES_USER"
    POSTGRES_PASSWORD="YOUR_POSTGRES_PASSWORD"
    POSTGRES_DB="YOUR_POSTGRES_DB"
    POSTGRES_HOST="postgres"
    POSTGRES_PORT="5432"
    ```

6.  **Configure LangSmith (Optional)**:
    Create a `.env` file in `packages/backend` with your LangSmith credentials. See the main `README.md` for more details on the variables.

7.  **Run the Application**:
    ```bash
    docker compose up postgres backend
    ```
    The API will be available at `http://localhost:3001/v1/chat/completions`.

## Running the Ingester (TypeScript)

After you have the main application running, run the ingester to process and embed documentation from various sources.

```bash
docker compose --profile ingester up
```
