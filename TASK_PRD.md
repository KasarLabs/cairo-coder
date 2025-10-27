
## PRD: Stakeholder Query Insights Platform

### 1. Objective & Summary

This document outlines the requirements for a new **Query Insights Platform** for Cairo Coder. The platform's objective is to systematically capture, analyze, and surface user query data to provide actionable insights into developer trends, pain points, and areas of interest within the Cairo and Starknet ecosystem.

This will empower stakeholders in the Starknet ecosystem, from ecosystem managers to library developers, to make data-driven decisions that improve the overall developer and user experience on Starknet.

The project will be delivered in two phases:
1.  **Phase 1 (Data Persistence):** Establish a system for storing user interactions and LLM-generated analyses in our own database, creating a permanent and queryable record.
2.  **Phase 2 (Insight Delivery):** Expose this data through a set of API endpoints for raw data retrieval and access to persisted, on-demand analysis on the data to extract key topics, issues, pain points, and get insights into what people are building on Starknet.

### 2. Background & Strategic Fit

Currently, we keep persist LLM traces of every query within Langsmith traces for observability purposes. This makes it easy to monitor each internal component in the system and identify eventual bottlenecks in the latency / quality of answers, but it is difficult to answer critical questions about the developer and user journey, such as:

*   **For Documentation Teams:** *What are the biggest knowledge gaps in our current docs? Are users finding the information they need for core concepts related to cairo (storage, testing), integrations (starknetjs, frontend, indexers), blockchain (tx fees, account abstraction)?
*   **For Core Protocol & Tooling Teams:** *Which compiler errors are causing the most friction? How are developers adopting new features we've shipped? Where are the rough edges in our tooling (Scarb, Foundry) that cause confusion?*
*   **For the Ecosystem (e.g., Starknet Foundation):** *What are the emerging development patterns? Are more developers building DeFi, Gaming, or NFT projects? What topics are they most curious about this quarter?*

While this platform will not be able to spot all the things that work well *(people usually don't ask about things they understand, are clear, or simple!)*, they'll help catch everything that would benefit from being improved.

By building this platform, we transform Cairo Coder from just a developer assistance tool into a source of quantitative data, considerably helping gathering feedback to work on improvements for the entire Starknet ecosystem.

### 3. Personas & User Stories

| Persona                  | Description                                                                | User Stories                                                                                                                                                                                                                                                                                                                           |
| :----------------------- | :------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dana the Docs Writer** | Responsible for creating and maintaining Starknet and Cairo documentation. | 1. **As Dana**, I want to see the topic breakdown for the last month, so I can prioritize updates for the most frequently asked-about subjects.<br/>2. **As Dana**, I want to view the raw queries for the "Starknet/Prover" topic, so I can understand what's unclear about this topic                                                |
| **Charlie the Core Dev** | Works on the Cairo compiler and Starknet tooling.                          | 1. **As Charlie**, I want to filter queries by `agent_id='cairo-coder'` so I can see how developers are using (or misusing) specific language features.<br>2. **As Charlie**, I want to trigger a new analysis on last quarter's queries, so I can see if a recent library update has reduced the number of confusion about a feature. |
| **Alex the Analyst**     | An ecosystem manager.                                                      | 1. **As Alex**, I want to list all historical analyses, so I can find the Q3 2025 summary report.<br/>2. **As Alex**, I want to retrieve a specific, persisted analysis by its ID, so I can use its structured JSON data to build visualizations in my own BI tool.                                                                    |

### 4. Proposed Solution & Features

> Note: the following are internal technical data

#### Phase 1: Robust Data Persistence Layer

> Note: the database schema will be revisited upon implementation

1.  **Database Schema:**
    *   We will add two new tables to the existing Postgres database.

    *   **Table 1: `user_interactions`** (To store every interaction)
        ```sql
        CREATE TABLE user_interactions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            agent_id VARCHAR(50) NOT NULL,
            mcp_mode BOOLEAN NOT NULL DEFAULT FALSE,
            query_history JSONB,
            final_user_query TEXT NOT NULL,
            generated_answer TEXT,
            retrieved_sources JSONB,
            llm_usage JSONB
        );
        -- Indexes for efficient filtering
        CREATE INDEX idx_interactions_created_at ON user_interactions(created_at);
        CREATE INDEX idx_interactions_agent_id ON user_interactions(agent_id);
        ```
    *   **Table 2: `query_analyses`** (To store the results of analysis jobs)
        ```sql
        CREATE TABLE query_analyses (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, completed, failed
            analysis_parameters JSONB, -- { start_date, end_date, agent_id }
            analysis_result JSONB,     -- The full JSON output from the analysis script
            error_message TEXT         -- To log errors if the job fails
        );
        CREATE INDEX idx_analyses_created_at ON query_analyses(created_at);
        ```

2.  **Data Ingestion Logic:**
    *   The `_handle_chat_completion` function in `cairo_coder/server/app.py` will be modified.
    *   After a response is successfully generated, it will spawn a non-blocking background task to write the full interaction details into the `user_interactions` table. This ensures the logging does not add latency to user requests.

#### Phase 2: Insights API Endpoints

A new API router will be created at `/v1/insights`.

1.  **Get Raw Queries:** `GET /v1/insights/queries`
    *   **Description:** Provides paginated access to the raw interaction data.
    *   **Query Parameters:**
        *   `start_date` (ISO 8601, required)
        *   `end_date` (ISO 8601, required)
        *   `agent_id` (string, optional): Filters by a specific agent. If omitted, returns data for all agents.
        *   `limit` (integer, default: 100)
        *   `offset` (integer, default: 0)
    *   **Response:** A JSON object with a list of interaction records and pagination metadata.

2.  **Trigger a New Analysis:** `POST /v1/insights/analyze`
    *   **Description:** Kicks off an asynchronous LLM-based analysis job on a specified time range.
    *   **Request Body:**
        ```json
        {
          "start_date": "2025-10-01T00:00:00Z",
          "end_date": "2025-11-01T00:00:00Z",
          "agent_id": "starknet-agent" // Optional
        }
        ```
    *   **Logic:**
        1.  The endpoint immediately creates a new record in the `query_analyses` table with `status='pending'`.
        2.  It returns a `202 Accepted` response with the `analysis_id`.
        3.  A background worker fetches the corresponding interactions from `user_interactions` and runs them through the analysis logic from `cairo_coder_tools/datasets/analysis.py`.
        4.  Upon completion, the worker updates the `query_analyses` record with `status='completed'` and saves the resulting JSON in `analysis_result`. If it fails, the status is set to `failed` and an error is logged.
    *   **Response:**
        ```json
        {
          "analysis_id": "uuid-for-the-new-analysis-job",
          "status": "pending"
        }
        ```

3.  **List and Retrieve Analyses:**
    *   `GET /v1/insights/analyses`
        *   **Description:** Returns a list of all historical analysis jobs, most recent first.
        *   **Response:** A JSON list containing metadata for each analysis (`id`, `created_at`, `status`, `analysis_parameters`).
    *   `GET /v1/insights/analyses/{analysis_id}`
        *   **Description:** Retrieves the detailed result of a specific analysis job.
        *   **Response:** The full record from the `query_analyses` table, including the `analysis_result` JSON if the job is complete.

### 5. Non-Functional Requirements

*   **Asynchronicity:** The analysis endpoint (`POST /analyze`) must be fully asynchronous to handle potentially long-running LLM jobs without blocking the server.

### 6. Out of Scope for This Version

The following items are important but are explicitly deferred to future iterations to manage scope:

*   **API Authentication:** The initial version of the insights API will be deployed internally without an authentication layer. The auth layer builds on top of this API.
*   **PII Anonymization:** We will operate under the assumption that user queries do not contain PII. A formal PII scrubbing process is a future requirement.
*   **Data Retention Policy:** No automated data retention or cleanup will be implemented in this version.
*   **Frontend Dashboard:** A dedicated UI for visualizing these insights is a logical next step but is not part of this project.
