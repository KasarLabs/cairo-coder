# AI Chat API Documentation

## Overview

This document outlines the API for interacting with our AI chat system. The system uses a combination of HTTP endpoints and WebSocket connections to provide real-time chat functionality with AI models.

## Authentication

Currently, the API does not require authentication. However, this may change in future versions.

## HTTP Endpoints

### 1. Get Available Models

- **URL**: `/models`
- **Method**: GET
- **Description**: Retrieves the list of available AI models for chat and embedding.
- **Response**: JSON object containing `chatModelProviders` and `embeddingModelProviders`.

**Example Response:**

```json
{
  "chatModelProviders": {
    "openai": {
      "gpt-4": {},
      "gpt-3.5-turbo": {}
    },
    "anthropic": {
      "Claude 3.5 Sonnet": {}
    }
  },
  "embeddingModelProviders": {
    "openai": {
      "text-embedding-ada-002": {}
    }
  }
}
```

### 3. Get Suggestions

- **URL**: `/suggestions`
- **Method**: POST
- **Description**: Generates chat suggestions based on the provided chat history.
- **Request Body**:
  ```json
  {
    "chat_history": Array,
    "chat_model": String,
    "chat_model_provider": String
  }
  ```
- **Response**: JSON array of suggestion strings.

**Example Request:**

```json
{
  "chat_history": [
    {
      "role": "user",
      "content": "Hello, how can you help me today?"
    },
    {
      "role": "assistant",
      "content": "Hello! I'm here to assist you with any questions or tasks you might have. How can I help you today?"
    },
    {
      "role": "user",
      "content": "I'm working on a Cairo project and need to understand Starknet better."
    }
  ],
  "chat_model": "Claude 3.5 Sonnet",
  "chat_model_provider": "anthropic"
}
```

**Example Response:**

```json
{
  "suggestions": [
    "Explain the key features and benefits of Starknet for Cairo projects",
    "What are the main differences between Starknet and other Layer 2 scaling solutions?",
    "Can you provide an overview of Cairo programming language and its use in Starknet?",
    "What are some popular tools and resources for developing on Starknet?",
    "How does Starknet integrate with Ethereum and other blockchain networks?"
  ]
}
```

## WebSocket Connection

### Connection URL

`ws://<server-url>/ws`

### Query Parameters

- `chatModel`: The selected chat model
- `chatModelProvider`: The provider of the chat model
- `embeddingModel`: The selected embedding model
- `embeddingModelProvider`: The provider of the embedding model
- `openAIApiKey`: (Optional) API key for custom OpenAI setup
- `openAIBaseURL`: (Optional) Base URL for custom OpenAI setup

**Example Connection URL:**

```
ws://api.example/ws?chatModel=Claude+3.5+Sonnet&chatModelProvider=anthropic&embeddingModel=Text+embedding+3+large&embeddingModelProvider=openai
```

### Message Format

Messages sent to the WebSocket should be JSON strings with the following structure:

```json
{
  "type": "message",
  "message": {
    "chatId": String,
    "content": String
  },
  "focusMode": String,
  "history": Array
}
```

**Example Message:**

```json
{
  "type": "message",
  "message": {
    "messageId": "unique-message-id-1",
    "chatId": "unique-chat-id-1",
    "content": "Hello! Can you help me understand how Cairo smart contracts work?"
  },
  "copilot": false,
  "focusMode": "cairoBookSearch",
  "history": [
    ["human", "Hello! I'm interested in learning about Cairo."],
    [
      "ai",
      "Hello! I'd be happy to help you learn about Cairo. Cairo is a programming language designed for writing provable programs, particularly smart contracts for the StarkNet platform. What specific aspect of Cairo would you like to know more about?"
    ],
    ["human", "Can you help me understand how Cairo smart contracts work?"]
  ]
}
```

### Server Responses

The server will send JSON messages with the following types:

1. `start`: Indicates the start of a response
2. `content`: Contains a chunk of the AI's response
3. `end`: Indicates the end of a response
4. `error`: Contains error information

**Example Server Responses:**

```json
{"type":"sources","data":[{"pageContent":"...","metadata":{"url":"https://book.cairo-lang.org/ch13-01-general-introduction-to-smart-contracts.html#general-introduction-to-smart-contracts"}}]}
{"type":"message","data":"Certainly! I","messageId":"e52729dfd0921e"}
{"type":"messageEnd","messageId":"e52729dfd0921e"}
```

### Error Handling

Error messages will be sent as JSON with the following structure:

```json
{
  "type": "error",
  "data": String,
  "key": String
}
```

**Example Error Message:**

```json
{
  "type": "error",
  "data": "Failed to connect to the specified chat model",
  "key": "MODEL_CONNECTION_ERROR"
}
```

## Usage Example

1. Fetch available models using the `/models` HTTP endpoint.
2. Establish a WebSocket connection with the appropriate query parameters.
3. Send a message to the WebSocket with the user's input and chat history.
4. Listen for responses from the server and handle them accordingly.

## Notes

- The system uses a focus mode to determine the context of the conversation. Ensure the correct focus mode is specified in each message.
- The chat history should be maintained on the client-side and sent with each message for context.
- Handle WebSocket disconnections gracefully and implement reconnection logic if necessary.

```

This formatted version of the document includes improved examples for each section, making it easier for external teams to understand and integrate with the AI chat system.
```
