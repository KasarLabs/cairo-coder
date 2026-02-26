# Cairo Coder API

This document describes the HTTP API served by the Cairo Coder backend. The API is compatible with OpenAI's Chat Completions interface, with Cairo-specific extensions.

## Base URL

The service listens on `http://<host>:3001` by default.

## Authentication

No authentication is enforced by the server. Add your own gateway (API key, OAuth, etc.) if exposing publicly.

## Common Conventions

- **Content type**: `application/json` for non-streaming, `text/event-stream` for streaming
- **Charset**: UTF-8
- **Request body**: JSON-encoded payloads
- **Date & time**: Epoch seconds (`created` fields)

### Headers

| Header                | Required | Description                                                                                                                                                                        |
| --------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Content-Type`        | Yes      | `application/json` for JSON POSTs                                                                                                                                                  |
| `Accept`              | No       | `application/json` or `text/event-stream`                                                                                                                                          |
| `x-mcp-mode` or `mcp` | No       | When present, returns raw documentation snippets instead of synthesized answers                                                                                                    |
| `x-conversation-id`   | No       | Links multiple requests to the same conversation for analytics                                                                                                                     |
| `x-user-id`           | No       | Anonymous user identifier (hashed before storage)                                                                                                                                  |
| `x-api-key`           | No       | When present, hash is used as user identifier (takes precedence over `x-user-id`). If you are using a custom authentication system, you can forward this header to identify users. |

## Endpoints

### Health Check

```text
GET /
```

**Response** `200 OK`

```json
{ "status": "ok" }
```

### Agent Directory

```text
GET /v1/agents
```

Lists all registered agents.

**Response** `200 OK`

```json
[
  {
    "id": "cairo-coder",
    "name": "Cairo Coder",
    "description": "General Cairo programming assistant",
    "sources": ["cairo_book", "starknet_docs", "starknet_foundry", ...]
  },
  {
    "id": "starknet-agent",
    "name": "Starknet Agent",
    "description": "Assistant for the Starknet ecosystem (contracts, tools, docs).",
    "sources": ["cairo_book", "starknet_docs", ...]
  }
]
```

#### Available Documentation Sources

| Source ID           | Description                                |
| ------------------- | ------------------------------------------ |
| `cairo_book`        | Cairo book reference                       |
| `starknet_docs`     | Starknet official documentation            |
| `starknet_foundry`  | Starknet Foundry resources                 |
| `cairo_by_example`  | Cairo by Example guides                    |
| `openzeppelin_docs` | OpenZeppelin Cairo contracts documentation |
| `corelib_docs`      | Cairo core library docs                    |
| `scarb_docs`        | Scarb package manager documentation        |
| `starknet_js`       | StarknetJS guides and SDK documentation    |
| `starknet_blog`     | Starknet blog posts and announcements      |
| `dojo_docs`         | Dojo game engine documentation             |

### Chat Completions

Three route variants exist (all share the same behavior):

- `POST /v1/agents/{agent_id}/chat/completions` - Target a specific agent
- `POST /v1/chat/completions` - Default agent (`cairo-coder`)
- `POST /chat/completions` - Legacy alias

#### Request Schema

```json
{
  "model": "cairo-coder",
  "messages": [
    { "role": "system", "content": "Optional instructions" },
    { "role": "user", "content": "Your Cairo/StarkNet question" }
  ],
  "stream": false,
  "temperature": 0.2,
  "max_tokens": 1024
}
```

**Notes:**

- `messages` must contain at least one entry with the final message having `role: "user"`
- Roles accepted: `system`, `user`, `assistant`
- Set `stream: true` to receive Server-Sent Events (SSE) chunks
- History is implied by providing earlier messages; backend keeps the last 10 history items

#### Non-Streaming Response

```bash
curl -X POST http://localhost:3001/v1/agents/cairo-coder/chat/completions \
  -H 'Content-Type: application/json' \
  -d '{
    "messages": [
      {"role": "user", "content": "How do I define a storage variable?"}
    ]
  }'
```

**Response** `200 OK`

```json
{
  "id": "fa43012d-2d0c-4ad2-82c9-2e1ec7aaa43d",
  "object": "chat.completion",
  "created": 1718123456,
  "model": "cairo-coder",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "<answer text>"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 123,
    "completion_tokens": 512,
    "total_tokens": 635
  }
}
```

#### Streaming Response

Set `"stream": true` to receive Server-Sent Events (SSE).

```bash
curl -N -X POST http://localhost:3001/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -d '{
    "stream": true,
    "messages": [{"role": "user", "content": "Explain felt252 arithmetic."}]
  }'
```

**Stream format:**

```text
data: {"id":"...","object":"chat.completion.chunk","choices":[{"delta":{"role":"assistant"}}]}

data: {"id":"...","object":"chat.completion.chunk","choices":[{"delta":{"content":"Felt252 is..."}}]}

data: {"id":"...","object":"chat.completion.chunk","choices":[{"delta":{},"finish_reason":"stop"}]}

data: [DONE]
```

#### Custom Stream Events

In addition to OpenAI-compatible chunks, Cairo Coder emits custom events:

| Event Type       | Description                                                               |
| ---------------- | ------------------------------------------------------------------------- |
| `processing`     | Progress updates (e.g., "Processing query...", "Retrieving documents...") |
| `sources`        | Sources used to answer the query (emitted after retrieval)                |
| `reasoning`      | Optional model reasoning stream (token-level)                             |
| `final_response` | Full, final answer text                                                   |

**Example sources event:**

```json
{
  "type": "sources",
  "data": [
    {
      "metadata": {
        "title": "Introduction to Cairo",
        "url": "https://book.cairo-lang.org/..."
      }
    }
  ]
}
```

### Suggestions

```text
POST /v1/suggestions
```

Generate follow-up conversation suggestions based on chat history.

**Request:**

```json
{
  "chat_history": [
    { "role": "user", "content": "How do I create a Cairo contract?" },
    { "role": "assistant", "content": "Here's how..." }
  ]
}
```

**Response** `200 OK`

```json
{
  "suggestions": [
    "How do I deploy this contract to testnet?",
    "What are the best practices for contract security?",
    "Can you explain how storage works in Cairo contracts?",
    "How do I write tests for this contract?"
  ]
}
```

### Query Insights

```text
GET /v1/insights/queries
```

Fetch paginated user queries for analytics.

**Query Parameters:**

- `start_date` - ISO 8601, inclusive lower bound
- `end_date` - ISO 8601, inclusive upper bound
- `agent_id` - Filter by agent
- `query_text` - Filter by text (case-insensitive)
- `limit` - Maximum rows (default: 100)
- `offset` - Pagination offset (default: 0)
- `conversation_id` - Filter by conversation
- `user_id` - Filter by hashed user id

## MCP Mode

Setting `mcp` or `x-mcp-mode` headers triggers Model Context Protocol mode:

- Returns curated documentation blocks instead of synthesized answers
- Does not consume generation tokens
- Useful for integration with other tools needing Cairo documentation

```bash
curl -X POST http://localhost:3001/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -H 'x-mcp-mode: true' \
  -d '{"messages": [{"role": "user", "content": "Selectors"}]}'
```

## Error Handling

Errors return HTTP status codes with an OpenAI-compatible JSON envelope:

```json
{
  "error": {
    "message": "Agent 'foo' not found",
    "type": "invalid_request_error",
    "code": "agent_not_found",
    "param": "agent_id"
  }
}
```

| Status                      | Description            |
| --------------------------- | ---------------------- |
| `400 Bad Request`           | Validation failures    |
| `404 Not Found`             | Unknown agent id       |
| `422 Unprocessable Entity`  | Invalid message format |
| `500 Internal Server Error` | Backend issues         |
