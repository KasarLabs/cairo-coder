# GitHub Workflows

This directory contains GitHub Actions workflows for the Starknet Agent project.

## Workflows

### CI (ci.yml)

This workflow runs on push to the main branches and on pull requests. It builds the project to ensure everything compiles correctly.

### Trunk Check (trunk-check.yaml)

This workflow runs Trunk checks on the codebase to ensure code quality.

### Generate Embeddings (generate-embeddings.yml)

This workflow generates embeddings for the Starknet Agent's RAG system. It runs:

- Automatically once per week (Sunday at 00:00 UTC)
- Manually when triggered via the GitHub Actions UI

#### Required Secrets

The following secrets need to be configured in the repository settings for the Generate Embeddings workflow to function properly:

##### API Keys

- `OPENAI_API_KEY`: OpenAI API key

##### Vector Database

- `MONGODB_URI`: MongoDB connection URI
- `DB_NAME`: Database name
- `COLLECTION_NAME`: Collection name for storing embeddings

##### Model Configuration

- `DEFAULT_EMBEDDING_PROVIDER`: Default embedding provider (e.g., "openai")
- `DEFAULT_EMBEDDING_MODEL`: Default embedding model (e.g., "Text embedding 3 large")

## Setting Up Secrets

To set up the required secrets:

1. Go to your repository on GitHub
2. Navigate to Settings > Secrets and variables > Actions
3. Click on "New repository secret"
4. Add each of the secrets listed above with their appropriate values
