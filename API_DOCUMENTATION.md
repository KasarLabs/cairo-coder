# Cairo Coder API

This document describes the publicly exposed HTTP API served by the Cairo Coder backend. The API is intentionally compatible with OpenAI's Chat Completions interface, with a few Cairo-specific extensions.

## Base URL

The service listens on `http://<host>:3001` by default (see `uvicorn` invocation in `python/src/cairo_coder/server/app.py`). Adjust for your environment as needed.

## Authentication

No authentication is enforced by the server. Add your own gateway (API key, OAuth, etc.) if you are exposing Cairo Coder outside a trusted network.

## Common Conventions

- **Content type**: All non-streaming responses use `application/json`. Streaming responses use `text/event-stream`.
- **Charset**: UTF-8.
- **Request body**: JSON-encoded payloads.
- **Date & time**: Epoch seconds (`created` fields).
- **Errors**: Consistent JSON envelope described in [Error Handling](#error-handling).

### Headers

- `Content-Type: application/json` — required for JSON POSTs.
- `Accept: application/json` or `text/event-stream` depending on `stream` usage.
- `x-mcp-mode: true` or `mcp: true` — optional. When present (any value), the request runs in **MCP mode**, returning raw documentation snippets instead of synthesized answers. See [MCP Mode](#mcp-mode).

## Health Check

### `GET /`

Returns a basic readiness signal.

**Response** `200 OK`

```json
{ "status": "ok" }
```

## Agent Directory

### `GET /v1/agents`

Lists every agent registered in Cairo Coder.

**Response** `200 OK`

```json
[
  {
    "id": "cairo-coder",
    "name": "Cairo Coder",
    "description": "General Cairo programming assistant",
    "sources": [
      "cairo_book",
      "starknet_docs",
      "starknet_foundry",
      "cairo_by_example",
      "openzeppelin_docs",
      "corelib_docs",
      "scarb_docs",
      "starknet_js",
      "starknet_blog"
    ]
  },
  {
    "id": "starknet-agent",
    "name": "Starknet Agent",
    "description": "Assistant for the Starknet ecosystem (contracts, tools, docs).",
    "sources": [
      "cairo_book",
      "starknet_docs",
      "starknet_foundry",
      "cairo_by_example",
      "openzeppelin_docs",
      "corelib_docs",
      "scarb_docs",
      "starknet_js",
      "starknet_blog"
    ]
  }
]
```

`sources` values correspond to the internal `DocumentSource` enum:

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

## Chat Completions

Cairo Coder mirrors OpenAI's Chat Completions API. Three route variants exist for backward compatibility, sharing the same payload structure and behaviour:

- `POST /v1/agents/{agent_id}/chat/completions` — target a specific agent.
- `POST /v1/chat/completions` — default agent (`cairo-coder`).
- `POST /chat/completions` — legacy alias of the above.

### Request Schema

```json
{
  "model": "cairo-coder",
  "messages": [
    { "role": "system", "content": "Optional instructions" },
    { "role": "user", "content": "Your Cairo/StarkNet question" }
  ],
  "stream": false,
  "temperature": 0.2,
  "max_tokens": 1024,
  "top_p": 1.0,
  "n": 1,
  "stop": null,
  "presence_penalty": 0,
  "frequency_penalty": 0,
  "user": "optional-tracking-id"
}
```

Field notes:

- `messages` **must** contain at least one entry. The final message must have `role: "user"`; otherwise the server returns `400`.
- Roles accepted: `system`, `user`, `assistant`. Setting `name` on a message is optional.
- Only `stream`, `messages`, and the optional MCP headers influence behaviour today. Other OpenAI fields are accepted for compatibility but currently ignored.
- `model` defaults to `"cairo-coder"`. When using the agent-specific endpoint you can still pass the field; the server ignores mismatches and uses the `agent_id` route parameter.
- Set `stream: true` to receive Server-Sent Events (SSE) chunks. The default is `false` (single JSON response).
- `history` is implied by providing earlier `assistant`/`system` messages in `messages`; the backend keeps only the last 10 history items when rebuilding context.

### Non-Streaming Response

**Request**

```bash
curl -X POST http://localhost:3001/v1/agents/cairo-coder/chat/completions \
  -H 'Content-Type: application/json' \
  -d '{
    "messages": [
      {"role": "system", "content": "You are a Cairo mentor."},
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

`usage` fields are aggregated from all DSPy sub-modules. If usage data is unavailable the server returns zeros.

### Streaming Response

Set `"stream": true` to receive Server‑Sent Events (SSE). The stream contains:

- OpenAI‑compatible `chat.completion.chunk` frames for assistant text deltas
- Cairo Coder custom event frames with a top‑level `type` and `data` field

Each frame is sent as `data: {JSON}\n\n`, and the stream ends with `data: [DONE]\n\n`.

**Request**

```bash
curl -N -X POST http://localhost:3001/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -d '{
    "stream": true,
    "messages": [
      {"role": "user", "content": "Explain felt252 arithmetic."}
    ]
  }'
```

**Stream** (abridged)

```json
data: {"id":"...","object":"chat.completion.chunk","created":1718123456,"model":"cairo-coder","choices":[{"index":0,"delta":{"role":"assistant"},"finish_reason":null}]}

data: {"id":"...","object":"chat.completion.chunk","created":1718123456,"model":"cairo-coder","choices":[{"index":0,"delta":{"content":"Felt252 is the base field..."},"finish_reason":null}]}

data: {"id":"...","object":"chat.completion.chunk","created":1718123456,"model":"cairo-coder","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}

data: [DONE]
```

#### Custom Stream Events

In addition to OpenAI‑compatible chunks, Cairo Coder emits custom events to expose retrieval context, progress, and optional reasoning. These frames have the shape `{"type": string, "data": any}` and can appear interleaved with standard chunks.

- `type: "processing"` — High‑level progress updates.

  - Example frames:
    - `data: {"type":"processing","data":"Processing query..."}`
    - `data: {"type":"processing","data":"Retrieving relevant documents..."}`
    - `data: {"type":"processing","data":"Generating response..."}` (or `"Formatting documentation..."` in MCP mode)

- `type: "sources"` — Sources used to answer the query (emitted after retrieval).

  - Shape: `data: {"type":"sources","data":[{"metadata":{"title": string, "url": string}}, ...]}`
  - Example:
    - `data: {"type":"sources","data":[{"metadata":{"title":"Introduction to Cairo","url":"https://book.cairo-lang.org/ch01-00-getting-started.html"}}]}`
  - Notes:
    - Typically one `sources` frame per request, shortly after retrieval completes.
    - `url` maps to `metadata.sourceLink` when available.

- `type: "reasoning"` — Optional model reasoning stream (token‑level), when available.

  - Example frames:
    - `data: {"type":"reasoning","data":"Thinking about storage layout..."}`
  - Notes:
    - Emitted incrementally and may appear multiple times.
    - Not all models or modes include reasoning; absence is expected.

- `type: "final_response"` — Full, final answer text.
  - Example:
    - `data: {"type":"final_response","data":"<complete answer text>"}`
  - Notes:
    - Mirrors the final accumulated assistant content sent via OpenAI‑compatible chunks.

Client guidance:

- If you only want OpenAI‑compatible frames, ignore objects that include a top‑level `type` field.
- To build richer UIs, render `processing` as status badges, `sources` as link previews, and `reasoning` in a collapsible area.
- Streaming errors surface as OpenAI‑compatible chunks that contain `"delta": {"content": "\n\nError: ..."}` followed by a terminating chunk and `[DONE]`.

### Agent Selection

`POST /v1/agents/{agent_id}/chat/completions` validates that `{agent_id}` exists. Unknown IDs return `404 Not Found` with an OpenAI-style error payload. When the `agent_id` is omitted (`/v1/chat/completions` or `/chat/completions`) the server falls back to `cairo-coder`.

## Suggestions

### `POST /v1/suggestions`

Generate follow-up conversation suggestions based on chat history. This endpoint analyzes the conversation context and returns 4-5 relevant questions or topics the user might want to explore next.

#### Request Schema

```json
{
  "chat_history": [
    { "role": "user", "content": "How do I create a Cairo contract?" },
    {
      "role": "assistant",
      "content": "Here's how to create a Cairo contract using the #[starknet::contract] attribute..."
    }
  ]
}
```

Field notes:

- `chat_history` is an array of message objects with `role` and `content` fields.
- Roles accepted: `user`, `assistant`, `system`.
- Can be empty array (returns generic suggestions).

#### Response

`200 OK`

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

#### Example

```bash
curl -X POST http://localhost:3001/v1/suggestions \
  -H 'Content-Type: application/json' \
  -d '{
    "chat_history": [
      {"role": "user", "content": "How do I create a Cairo contract?"},
      {"role": "assistant", "content": "Use #[starknet::contract] attribute..."}
    ]
  }'
```

#### Errors

- `422 Unprocessable Entity` — validation error (missing `chat_history` or invalid message format).
- `500 Internal Server Error` — suggestion generation failure.

## MCP Mode

Setting either `mcp` or `x-mcp-mode` headers triggers **Model Context Protocol mode**, bypassing the LLM synthesiser:

- Non-streaming responses still use the standard `chat.completion` envelope, but `choices[0].message.content` contains curated documentation blocks instead of prose answers.
- Streaming responses emit the same SSE wrapper; the payloads contain the formatted documentation as incremental `delta.content` strings.
- Streaming also includes custom events: `processing` (e.g., "Formatting documentation...") and `sources` as described in Custom Stream Events. A `final_response` frame mirrors the full final text.
- MCP mode does not consume generation tokens (`usage.completion_tokens` reflects only retrieval/query processing).

Example non-streaming request:

```bash
curl -X POST http://localhost:3001/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -H 'x-mcp-mode: true' \
  -d '{"messages": [{"role": "user", "content": "Selectors"}]}'
```

## Error Handling

All errors return HTTP status codes with a JSON envelope compatible with OpenAI:

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

Common cases:

- `400 Bad Request` — validation failures (empty `messages`, last message not from `user`).
- `404 Not Found` — unknown agent id.
- `500 Internal Server Error` — unexpected backend issues.

## Query Insights

The Query Insights API exposes raw interaction logs and lightweight analytics for downstream processing.

### `GET /v1/insights/queries`

Fetch paginated user queries. If no date range is provided, returns the most recent queries ordered by creation time.

- `start_date` _(ISO 8601, optional)_ — inclusive lower bound for filtering by creation time.
- `end_date` _(ISO 8601, optional)_ — inclusive upper bound for filtering by creation time.
- `agent_id` _(optional)_ — filter by agent id when provided.
- `query_text` _(optional)_ — filter by text contained in the query (case-insensitive).
- `limit` _(default `100`)_ — maximum rows returned.
- `offset` _(default `0`)_ — pagination offset.

**Response** `200 OK`

```json
{
  "items": [
    {
      "id": "ad0c2b34-04ab-4d0a-9855-47c19f0f2830",
      "created_at": "2024-04-01T12:30:45.123456+00:00",
      "agent_id": "cairo-coder",
      "query": "How do I declare a storage variable in Cairo 1?",
      "chat_history": [
        { "role": "user", "content": "What is Cairo?" },
        { "role": "assistant", "content": "Cairo is a programming language..." }
      ],
      "output": "To declare a storage variable in Cairo 1, you use the #[storage] attribute..."
    }
  ],
  "total": 1,
  "limit": 100,
  "offset": 0
}
```

## Versioning & Compatibility

- Current API version: `1.0.0` (see FastAPI metadata).
- The server aims to stay wire-compatible with OpenAI's Chat Completions (`/v1/chat/completions`).
- `POST /chat/completions` exists for older clients; prefer `/v1/…` for new integrations.

## Production Checklist

1. Front the service with TLS and authentication if exposed publicly.
2. Monitor latency and token usage via the returned `usage` object and application logs.
3. Warm up the vector store connection (handled automatically by the FastAPI lifespan event) before routing traffic.
4. If you swap or add agents, ensure they are registered in `python/src/cairo_coder/agents/registry.py`; they appear immediately in `/v1/agents` responses.

## Support

For bugs or feature requests open an issue in the Cairo Coder repository. Mention the API version, endpoint, and reproduction steps.
