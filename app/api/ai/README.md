# AI API Routes

This directory contains API routes for AI text generation services.

## Endpoints

### POST /api/ai/completions

Generate text completions from a prompt.

**Requirements:** 2.1, 2.3

**Authentication:** Required

**Rate Limiting:**

- 60 requests per minute per user
- 1000 requests per hour per workspace
- 100 requests per minute per IP

**Headers:**

- `Authorization`: Bearer token (handled by NextAuth)
- `x-workspace-id`: Workspace ID (optional, can be in body)

**Request Body:**

```json
{
  "workspaceId": "uuid",
  "prompt": "Your prompt here",
  "model": "gpt-4o-mini",
  "provider": "openai",
  "maxTokens": 1000,
  "temperature": 0.7,
  "topP": 1.0,
  "frequencyPenalty": 0,
  "presencePenalty": 0,
  "stopSequences": []
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "content": "Generated text...",
    "model": "gpt-4o-mini",
    "provider": "openai",
    "tokens": {
      "input": 10,
      "output": 50,
      "total": 60
    },
    "credits": 2
  }
}
```

**Error Responses:**

- `400` - Validation error
- `401` - Unauthorized
- `402` - Insufficient credits
- `429` - Rate limit exceeded
- `500` - Internal server error
- `503` - Provider unavailable

---

### POST /api/ai/chat

Generate chat completions with optional streaming support.

**Requirements:** 2.1, 2.2, 2.3

**Authentication:** Required

**Rate Limiting:** Same as completions endpoint

**Headers:**

- `Authorization`: Bearer token (handled by NextAuth)
- `x-workspace-id`: Workspace ID (optional, can be in body)

**Request Body:**

```json
{
  "workspaceId": "uuid",
  "messages": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hi there!" },
    { "role": "user", "content": "How are you?" }
  ],
  "model": "gpt-4o-mini",
  "provider": "openai",
  "stream": false,
  "maxTokens": 1000,
  "temperature": 0.7,
  "topP": 1.0,
  "frequencyPenalty": 0,
  "presencePenalty": 0,
  "stopSequences": []
}
```

**Non-Streaming Response:**

```json
{
  "success": true,
  "data": {
    "content": "I'm doing well, thank you!",
    "model": "gpt-4o-mini",
    "provider": "openai",
    "tokens": {
      "input": 25,
      "output": 10,
      "total": 35
    },
    "credits": 1
  }
}
```

**Streaming Response:**

When `stream: true`, the response is sent as Server-Sent Events (SSE):

```
Content-Type: text/event-stream

data: {"content":"I'm","isComplete":false}

data: {"content":" doing","isComplete":false}

data: {"content":" well","isComplete":false}

data: {"content":"!","isComplete":true,"metadata":{...}}
```

**Error Responses:**

- `400` - Validation error
- `401` - Unauthorized
- `402` - Insufficient credits
- `429` - Rate limit exceeded
- `500` - Internal server error
- `503` - Provider unavailable

---

## Credit Management

Both endpoints automatically:

1. Validate sufficient credits before generation
2. Allocate estimated credits
3. Generate the completion
4. Release estimated credits
5. Consume actual credits based on usage
6. Refund credits on failure

## Supported Providers

- `openai` - OpenAI (GPT models)
- `anthropic` - Anthropic (Claude models)
- `google` - Google (Gemini models)
- `mistral` - Mistral AI

## Supported Models

See the [GET /api/ai/models](#get-apiai-models) endpoint for a complete list of supported models and their capabilities.

---

### GET /api/ai/models

Retrieve available AI models with filtering and pricing information.

**Requirements:** 8.1, 8.2, 8.3

**Authentication:** Required

**Query Parameters:**

- `capability` (optional): Filter by capability (`text-generation`, `image-generation`, `speech-synthesis`, `transcription`)
- `provider` (optional): Filter by provider (`openai`, `anthropic`, `google`, `mistral`)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "gpt-4o-mini",
      "name": "GPT-4o Mini",
      "provider": "openai",
      "capabilities": ["text-generation"],
      "description": "Affordable and fast GPT-4 model",
      "contextWindow": 128000,
      "maxOutputTokens": 16384,
      "pricing": {
        "input": 0.15,
        "output": 0.6
      },
      "available": true,
      "deprecated": false
    }
  ]
}
```

**Response Fields:**

- `id`: Model identifier for API requests
- `name`: Human-readable model name
- `provider`: AI provider
- `capabilities`: Array of supported capabilities
- `description`: Model description
- `contextWindow`: Maximum context window (tokens)
- `maxOutputTokens`: Maximum output tokens
- `pricing`: Cost per 1M tokens (input/output)
- `available`: Whether provider is configured
- `deprecated`: Whether model is deprecated

**Error Responses:**

- `401` - Unauthorized
- `500` - Internal server error

**Example Usage:**

```typescript
// Get all text generation models
const response = await fetch('/api/ai/models?capability=text-generation');
const { data: models } = await response.json();

// Get OpenAI models only
const response = await fetch('/api/ai/models?provider=openai');
const { data: models } = await response.json();

// Get available models for a specific use case
const response = await fetch(
  '/api/ai/models?provider=openai&capability=text-generation'
);
const { data: models } = await response.json();
const availableModels = models.filter((m) => m.available);
```

See [models/README.md](./models/README.md) for detailed documentation.

---

## Example Usage

### JavaScript/TypeScript

```typescript
// Non-streaming completion
const response = await fetch('/api/ai/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-workspace-id': workspaceId,
  },
  body: JSON.stringify({
    prompt: 'Write a haiku about coding',
    model: 'gpt-4o-mini',
    provider: 'openai',
    temperature: 0.7,
  }),
});

const data = await response.json();
console.log(data.data.content);

// Streaming chat
const response = await fetch('/api/ai/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-workspace-id': workspaceId,
  },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Tell me a story' }],
    model: 'gpt-4o-mini',
    provider: 'openai',
    stream: true,
  }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\n\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      console.log(data.content);
    }
  }
}
```

## Testing

Run the test suite:

```bash
npm run test -- src/application/use-cases/ai/__tests__/text-generation-use-cases.test.ts
```
