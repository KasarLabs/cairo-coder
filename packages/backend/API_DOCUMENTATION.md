# Cairo Coder API Documentation

## Overview

The Cairo Coder backend provides OpenAI-compatible chat completion endpoints with support for multiple specialized agents. Each agent can be configured with specific documentation sources, prompts, and parameters.

## Base URL

```text
http://localhost:3001/v1
```

## Endpoints

### 1. Legacy Chat Completions (Default Agent)

**Endpoint:** `POST /v1/chat/completions`

This endpoint maintains backward compatibility and uses the default "Cairo Coder" agent.

**Request Body:**

```json
{
  "model": "cairo-coder",
  "messages": [
    {
      "role": "user",
      "content": "How do I create a struct in Cairo?"
    }
  ],
  "stream": false,
  "temperature": 0.7
}
```

**Response:**

```json
{
  "id": "chatcmpl-123456",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "cairo-coder",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Here's how to create a struct in Cairo..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 50,
    "total_tokens": 60
  }
}
```

### 2. List Available Agents

**Endpoint:** `GET /v1/agents`

Returns a list of all available agents with their configurations.

**Response:**

```json
{
  "agents": [
    {
      "id": "cairo-coder",
      "name": "Cairo Coder",
      "description": "Default Cairo language and smart contract assistant with full documentation access",
      "pipeline": "rag",
      "sources": [
        "CAIRO_BOOK",
        "CAIRO_BY_EXAMPLE",
        "STARKNET_FOUNDRY",
        "CORELIB_DOCS",
        "OPENZEPPELIN_DOCS",
        "SCARB_DOCS"
      ]
    },
    {
      "id": "scarb-assistant",
      "name": "Scarb Assistant",
      "description": "Specialized Scarb build tool assistance",
      "pipeline": "rag",
      "sources": ["SCARB_DOCS"]
    }
  ],
  "total": 3
}
```

### 3. Agent-Specific Chat Completions

**Endpoint:** `POST /v1/agents/:agentId/chat/completions`

Use a specific agent for chat completions.

**Parameters:**

- `agentId` (path parameter): The ID of the agent to use (e.g., "cairo-coder", "scarb-assistant")

**Request Body:** Same as legacy endpoint

#### Example: Cairo Coder

```bash
curl -X POST http://localhost:3001/v1/agents/cairo-coder/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "How do I create a Vec in Cairo?"}
    ],
    "stream": false
  }'
```

#### Example: Scarb Assistant

```bash
curl -X POST http://localhost:3001/v1/agents/scarb-assistant/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "How do I add a dependency in Scarb?"}
    ],
    "stream": false
  }'
```

## Streaming Responses

All chat completion endpoints support streaming responses by setting `"stream": true` in the request body. When streaming is enabled, the response will be sent as Server-Sent Events (SSE).

**Example:**

```bash
curl -X POST http://localhost:3001/v1/agents/cairo-coder/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Explain Cairo arrays"}],
    "stream": true
  }'
```

**Streaming Response Format:**

```text
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1234567890,"model":"cairo-coder","choices":[{"index":0,"delta":{"content":"Arrays in Cairo"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1234567890,"model":"cairo-coder","choices":[{"index":0,"delta":{"content":" are..."},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1234567890,"model":"cairo-coder","choices":[{"index":0,"delta":{},"finish_reason":"stop"}],"usage":{"prompt_tokens":10,"completion_tokens":20,"total_tokens":30}}

data: [DONE]
```

## MCP Mode

All endpoints support Model Context Protocol (MCP) mode for retrieving raw documentation chunks without LLM generation. Enable MCP mode by adding the header `x-mcp-mode: true` or `mcp: true`.

**Example:**

```bash
curl -X POST http://localhost:3001/v1/agents/scarb-assistant/chat/completions \
  -H "Content-Type: application/json" \
  -H "x-mcp-mode: true" \
  -d '{
    "messages": [{"role": "user", "content": "Scarb workspace configuration"}]
  }'
```

In MCP mode, the response includes a `sources` field with retrieved documentation chunks.

## Error Handling

All endpoints return errors in OpenAI-compatible format:

```json
{
  "error": {
    "message": "Error description",
    "type": "error_type",
    "param": "parameter_name",
    "code": "error_code"
  }
}
```

Common error types:

- `invalid_request_error`: Invalid request parameters
- `server_error`: Internal server error
- `rate_limit_error`: Rate limit exceeded

HTTP Status Codes:

- `200`: Success
- `400`: Bad Request
- `404`: Agent not found
- `429`: Rate limit exceeded
- `500`: Internal server error

## Token Usage

All responses include token usage information in the `usage` field. Additionally, the total token count is returned in the `x-total-tokens` response header.

## Agent Configuration

Agents can be configured with:

- **Sources**: Specific documentation sources to search
- **Prompts**: Custom prompts for query processing and response generation
- **Parameters**: Search parameters like `maxSourceCount` and `similarityThreshold`
- **Pipeline**: Processing pipeline type (`rag`, `mcp`, or custom)

Agent configurations are loaded from TOML files and can be extended or modified without code changes.
