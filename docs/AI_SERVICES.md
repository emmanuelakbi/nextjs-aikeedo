# AI Services Documentation

## Overview

The AI Services module provides comprehensive integration with multiple AI providers (OpenAI, Anthropic, Google, Mistral) for text generation, image generation, speech synthesis, and transcription capabilities. This module is built on top of the Foundation module and implements a unified interface for all AI operations.

## Table of Contents

1. [Architecture](#architecture)
2. [Credit System](#credit-system)
3. [Rate Limiting](#rate-limiting)
4. [API Endpoints](#api-endpoints)
5. [Usage Examples](#usage-examples)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)

## Architecture

### Provider Abstraction

The AI Services module uses the Strategy pattern to abstract different AI providers:

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Service Interface                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────┬──────────────┬──────────────┬──────────────┐
│   OpenAI     │  Anthropic   │    Google    │   Mistral    │
│   Provider   │   Provider   │   Provider   │   Provider   │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

### Service Types

The module provides four main service types:

1. **Text Generation** - AI-powered text completion and chat
2. **Image Generation** - Text-to-image generation
3. **Speech Synthesis** - Text-to-speech conversion
4. **Transcription** - Audio-to-text transcription

### Data Models

#### Conversation

Represents a chat session with message history.

```typescript
type Conversation = {
  id: string;
  workspaceId: string;
  userId: string;
  title: string;
  model: string;
  provider: string;
  createdAt: Date;
  updatedAt: Date;
};
```

#### Message

Individual messages within a conversation.

```typescript
type Message = {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens: number;
  credits: number;
  createdAt: Date;
};
```

#### Generation

Tracks individual AI generation requests.

```typescript
type Generation = {
  id: string;
  workspaceId: string;
  userId: string;
  type: 'text' | 'image' | 'speech' | 'transcription';
  model: string;
  provider: string;
  prompt: string;
  result: string | null;
  tokens: number;
  credits: number;
  status: 'pending' | 'completed' | 'failed';
  error: string | null;
  createdAt: Date;
  completedAt: Date | null;
};
```

#### Preset

Pre-configured templates for common AI tasks.

```typescript
type Preset = {
  id: string;
  workspaceId: string | null; // null = system preset
  name: string;
  description: string;
  category: string;
  template: string;
  model: string;
  parameters: Json;
  isPublic: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
};
```

## Credit System

### Overview

The credit system manages AI usage costs across all services. Credits are deducted from workspaces based on actual usage.

### Credit Calculation

#### Text Generation

Credits are calculated based on token usage:

```
Credits = (Input Tokens + Output Tokens) × Token Rate
```

**Token Rates by Model:**

- GPT-4: 0.03 credits per 1K tokens (input), 0.06 credits per 1K tokens (output)
- GPT-3.5-Turbo: 0.001 credits per 1K tokens (input), 0.002 credits per 1K tokens (output)
- Claude-3-Opus: 0.015 credits per 1K tokens (input), 0.075 credits per 1K tokens (output)
- Claude-3-Sonnet: 0.003 credits per 1K tokens (input), 0.015 credits per 1K tokens (output)
- Gemini-Pro: 0.0005 credits per 1K tokens (input), 0.0015 credits per 1K tokens (output)
- Mistral-Large: 0.008 credits per 1K tokens (input), 0.024 credits per 1K tokens (output)

#### Image Generation

Credits are calculated based on image resolution:

```
Credits = Base Rate × Resolution Multiplier
```

**Resolution Rates:**

- 256x256: 10 credits
- 512x512: 15 credits
- 1024x1024: 20 credits
- 1024x1792 (HD): 40 credits
- 1792x1024 (HD): 40 credits

#### Speech Synthesis

Credits are calculated based on character count:

```
Credits = (Character Count / 1000) × 0.5
```

**Example:**

- 1,000 characters = 0.5 credits
- 5,000 characters = 2.5 credits

#### Transcription

Credits are calculated based on audio duration:

```
Credits = (Duration in Minutes) × 0.6
```

**Example:**

- 1 minute audio = 0.6 credits
- 10 minutes audio = 6 credits

### Credit Deduction Flow

1. **Pre-validation**: Check if workspace has sufficient credits
2. **Generation**: Execute AI request
3. **Calculation**: Calculate actual usage
4. **Deduction**: Atomically deduct credits from workspace
5. **Logging**: Record usage for auditing

### Credit Refund

Credits are automatically refunded if:

- Generation fails due to provider error
- Request times out
- Generation is cancelled by user
- Provider returns an error

**Note**: Partial generations (e.g., streaming cancelled mid-way) deduct credits proportional to usage.

## Rate Limiting

### Overview

Rate limiting prevents abuse and manages costs by restricting the number of requests per time period.

### Rate Limit Tiers

#### Per-User Limits

- **Text Generation**: 60 requests per minute
- **Image Generation**: 10 requests per minute
- **Speech Synthesis**: 20 requests per minute
- **Transcription**: 10 requests per minute

#### Per-Workspace Limits

- **All Services Combined**: 1,000 requests per hour
- **Daily Quota**: 10,000 requests per day (configurable per plan)

#### Per-IP Limits

- **All Endpoints**: 100 requests per minute
- **Authentication Endpoints**: 5 requests per 15 minutes

### Rate Limit Algorithm

The system uses a **sliding window** algorithm with Redis for distributed rate limiting:

```typescript
// Pseudo-code
function checkRateLimit(key: string, limit: number, window: number): boolean {
  const now = Date.now();
  const windowStart = now - window;

  // Remove old entries
  redis.zremrangebyscore(key, 0, windowStart);

  // Count current requests
  const count = redis.zcard(key);

  if (count >= limit) {
    return false; // Rate limit exceeded
  }

  // Add current request
  redis.zadd(key, now, `${now}-${randomId()}`);
  redis.expire(key, window);

  return true; // Request allowed
}
```

### Rate Limit Headers

All API responses include rate limit information:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1638360000
```

### Rate Limit Exceeded Response

When rate limit is exceeded, the API returns:

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again in 30 seconds.",
    "retryAfter": 30
  }
}
```

**Status Code**: `429 Too Many Requests`

### Bypassing Rate Limits

Enterprise plans can configure custom rate limits per workspace. Contact support for custom limits.

## API Endpoints

### Text Generation

#### Generate Completion

Generate text completion from a prompt.

**Endpoint**: `POST /api/ai/completions`

**Authentication**: Required

**Request Body**:

```json
{
  "prompt": "Write a short story about a robot",
  "model": "gpt-4",
  "provider": "openai",
  "temperature": 0.7,
  "maxTokens": 500,
  "topP": 1.0
}
```

**Parameters**:

- `prompt` (required): Input text prompt
- `model` (required): Model identifier (e.g., "gpt-4", "claude-3-opus")
- `provider` (optional): Provider name (auto-detected from model if not specified)
- `temperature` (optional): Randomness (0.0-2.0, default: 0.7)
- `maxTokens` (optional): Maximum output tokens (default: 1000)
- `topP` (optional): Nucleus sampling (0.0-1.0, default: 1.0)

**Success Response**: `200 OK`

```json
{
  "data": {
    "id": "gen_123",
    "text": "Once upon a time, there was a robot named...",
    "model": "gpt-4",
    "provider": "openai",
    "tokens": {
      "input": 10,
      "output": 150,
      "total": 160
    },
    "credits": 4.8,
    "finishReason": "stop"
  }
}
```

**Error Responses**:

- `400` - Invalid parameters or insufficient credits
- `429` - Rate limit exceeded
- `500` - Provider error

---

#### Generate Chat Completion (Streaming)

Generate streaming chat completion with conversation context.

**Endpoint**: `POST /api/ai/chat`

**Authentication**: Required

**Request Body**:

```json
{
  "conversationId": "conv_123",
  "message": "What is quantum computing?",
  "model": "gpt-4",
  "stream": true
}
```

**Parameters**:

- `conversationId` (optional): Existing conversation ID for context
- `message` (required): User message
- `model` (required): Model identifier
- `stream` (optional): Enable streaming (default: true)
- `temperature` (optional): Randomness (default: 0.7)
- `maxTokens` (optional): Maximum output tokens (default: 1000)

**Success Response**: `200 OK` (Server-Sent Events)

```
data: {"type":"start","conversationId":"conv_123"}

data: {"type":"chunk","content":"Quantum"}

data: {"type":"chunk","content":" computing"}

data: {"type":"chunk","content":" is"}

data: {"type":"done","messageId":"msg_456","tokens":{"input":20,"output":100},"credits":3.6}
```

**Event Types**:

- `start`: Stream started
- `chunk`: Text chunk
- `done`: Stream completed with metadata
- `error`: Error occurred

---

### Conversation Management

#### List Conversations

Get all conversations for the current workspace.

**Endpoint**: `GET /api/conversations`

**Authentication**: Required

**Query Parameters**:

- `limit` (optional): Number of results (default: 20, max: 100)
- `offset` (optional): Pagination offset (default: 0)
- `sortBy` (optional): Sort field (default: "updatedAt")
- `order` (optional): Sort order ("asc" or "desc", default: "desc")

**Success Response**: `200 OK`

```json
{
  "data": {
    "conversations": [
      {
        "id": "conv_123",
        "title": "Quantum Computing Discussion",
        "model": "gpt-4",
        "provider": "openai",
        "messageCount": 5,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T01:00:00.000Z"
      }
    ],
    "total": 42,
    "limit": 20,
    "offset": 0
  }
}
```

---

#### Create Conversation

Create a new conversation.

**Endpoint**: `POST /api/conversations`

**Authentication**: Required

**Request Body**:

```json
{
  "title": "My New Chat",
  "model": "gpt-4",
  "provider": "openai"
}
```

**Success Response**: `201 Created`

```json
{
  "data": {
    "conversation": {
      "id": "conv_456",
      "title": "My New Chat",
      "model": "gpt-4",
      "provider": "openai",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

#### Get Conversation

Get a specific conversation with all messages.

**Endpoint**: `GET /api/conversations/:id`

**Authentication**: Required

**Success Response**: `200 OK`

```json
{
  "data": {
    "conversation": {
      "id": "conv_123",
      "title": "Quantum Computing Discussion",
      "model": "gpt-4",
      "provider": "openai",
      "messages": [
        {
          "id": "msg_1",
          "role": "user",
          "content": "What is quantum computing?",
          "tokens": 5,
          "credits": 0.15,
          "createdAt": "2024-01-01T00:00:00.000Z"
        },
        {
          "id": "msg_2",
          "role": "assistant",
          "content": "Quantum computing is...",
          "tokens": 100,
          "credits": 3.0,
          "createdAt": "2024-01-01T00:00:30.000Z"
        }
      ],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:30.000Z"
    }
  }
}
```

---

#### Delete Conversation

Delete a conversation and all its messages.

**Endpoint**: `DELETE /api/conversations/:id`

**Authentication**: Required

**Success Response**: `200 OK`

```json
{
  "data": {
    "message": "Conversation deleted successfully"
  }
}
```

---

### Image Generation

#### Generate Image

Generate an image from a text prompt.

**Endpoint**: `POST /api/ai/images`

**Authentication**: Required

**Request Body**:

```json
{
  "prompt": "A serene mountain landscape at sunset",
  "model": "dall-e-3",
  "size": "1024x1024",
  "style": "vivid",
  "quality": "standard"
}
```

**Parameters**:

- `prompt` (required): Image description
- `model` (required): Model identifier (e.g., "dall-e-3", "imagen-2")
- `size` (optional): Image dimensions (default: "1024x1024")
  - Options: "256x256", "512x512", "1024x1024", "1024x1792", "1792x1024"
- `style` (optional): Image style (default: "vivid")
  - Options: "vivid", "natural"
- `quality` (optional): Image quality (default: "standard")
  - Options: "standard", "hd"

**Success Response**: `200 OK`

```json
{
  "data": {
    "id": "img_123",
    "url": "https://storage.example.com/images/img_123.png",
    "prompt": "A serene mountain landscape at sunset",
    "model": "dall-e-3",
    "size": "1024x1024",
    "credits": 20,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses**:

- `400` - Invalid parameters, insufficient credits, or content policy violation
- `429` - Rate limit exceeded
- `500` - Provider error

---

### Speech Synthesis

#### Generate Speech

Convert text to speech audio.

**Endpoint**: `POST /api/ai/speech`

**Authentication**: Required

**Request Body**:

```json
{
  "text": "Hello, welcome to our AI platform!",
  "model": "tts-1",
  "voice": "alloy",
  "speed": 1.0,
  "format": "mp3"
}
```

**Parameters**:

- `text` (required): Text to convert to speech (max 4096 characters)
- `model` (required): TTS model (e.g., "tts-1", "tts-1-hd")
- `voice` (optional): Voice identifier (default: "alloy")
  - Options: "alloy", "echo", "fable", "onyx", "nova", "shimmer"
- `speed` (optional): Playback speed (0.25-4.0, default: 1.0)
- `format` (optional): Audio format (default: "mp3")
  - Options: "mp3", "opus", "aac", "flac", "wav"

**Success Response**: `200 OK`

```json
{
  "data": {
    "id": "speech_123",
    "url": "https://storage.example.com/audio/speech_123.mp3",
    "text": "Hello, welcome to our AI platform!",
    "model": "tts-1",
    "voice": "alloy",
    "duration": 3.5,
    "credits": 0.017,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### Transcription

#### Transcribe Audio

Convert audio to text.

**Endpoint**: `POST /api/ai/transcribe`

**Authentication**: Required

**Request Body**: `multipart/form-data`

```
file: [audio file]
model: "whisper-1"
language: "en"
timestamps: true
```

**Parameters**:

- `file` (required): Audio file (mp3, mp4, mpeg, mpga, m4a, wav, webm)
- `model` (required): Transcription model (e.g., "whisper-1")
- `language` (optional): ISO 639-1 language code (default: auto-detect)
- `timestamps` (optional): Include word-level timestamps (default: false)

**Success Response**: `200 OK`

```json
{
  "data": {
    "id": "transcribe_123",
    "text": "Hello, this is a test transcription.",
    "language": "en",
    "duration": 5.2,
    "credits": 3.12,
    "timestamps": [
      {
        "word": "Hello",
        "start": 0.0,
        "end": 0.5
      },
      {
        "word": "this",
        "start": 0.6,
        "end": 0.8
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### Preset Management

#### List Presets

Get all available presets.

**Endpoint**: `GET /api/presets`

**Authentication**: Required

**Query Parameters**:

- `category` (optional): Filter by category
- `isPublic` (optional): Filter by public/private (default: all)

**Success Response**: `200 OK`

```json
{
  "data": {
    "presets": [
      {
        "id": "preset_123",
        "name": "Blog Post Writer",
        "description": "Generate engaging blog posts",
        "category": "content",
        "template": "Write a blog post about {topic}...",
        "model": "gpt-4",
        "parameters": {
          "temperature": 0.7,
          "maxTokens": 1000
        },
        "isPublic": true,
        "usageCount": 150
      }
    ]
  }
}
```

---

#### Create Preset

Create a new preset.

**Endpoint**: `POST /api/presets`

**Authentication**: Required

**Request Body**:

```json
{
  "name": "Email Writer",
  "description": "Write professional emails",
  "category": "business",
  "template": "Write a professional email about {subject}...",
  "model": "gpt-4",
  "parameters": {
    "temperature": 0.5,
    "maxTokens": 500
  },
  "isPublic": false
}
```

**Success Response**: `201 Created`

```json
{
  "data": {
    "preset": {
      "id": "preset_456",
      "name": "Email Writer",
      "description": "Write professional emails",
      "category": "business",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

### Model Registry

#### List Available Models

Get all available AI models.

**Endpoint**: `GET /api/ai/models`

**Authentication**: Required

**Query Parameters**:

- `capability` (optional): Filter by capability (text, image, speech, transcription)
- `provider` (optional): Filter by provider

**Success Response**: `200 OK`

```json
{
  "data": {
    "models": [
      {
        "id": "gpt-4",
        "name": "GPT-4",
        "provider": "openai",
        "capabilities": ["text", "chat"],
        "description": "Most capable GPT-4 model",
        "contextWindow": 8192,
        "pricing": {
          "input": 0.03,
          "output": 0.06,
          "unit": "per 1K tokens"
        },
        "isAvailable": true
      },
      {
        "id": "dall-e-3",
        "name": "DALL-E 3",
        "provider": "openai",
        "capabilities": ["image"],
        "description": "Advanced image generation",
        "pricing": {
          "base": 20,
          "unit": "per image (1024x1024)"
        },
        "isAvailable": true
      }
    ]
  }
}
```

---

## Usage Examples

### Example 1: Simple Text Completion

```typescript
// Generate a simple text completion
const response = await fetch('/api/ai/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    prompt: 'Write a haiku about programming',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 100,
  }),
});

const data = await response.json();
console.log(data.data.text);
// Output: "Code flows like water\nBugs hide in silent shadows\nDebug brings the light"
```

---

### Example 2: Streaming Chat

```typescript
// Create a streaming chat conversation
const eventSource = new EventSource('/api/ai/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'Explain quantum entanglement',
    model: 'gpt-4',
    stream: true,
  }),
});

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch (data.type) {
    case 'start':
      console.log('Stream started:', data.conversationId);
      break;
    case 'chunk':
      process.stdout.write(data.content);
      break;
    case 'done':
      console.log('\nCompleted. Credits used:', data.credits);
      eventSource.close();
      break;
    case 'error':
      console.error('Error:', data.error);
      eventSource.close();
      break;
  }
};
```

---

### Example 3: Image Generation

```typescript
// Generate an image
const response = await fetch('/api/ai/images', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    prompt: 'A futuristic city with flying cars at night',
    model: 'dall-e-3',
    size: '1024x1024',
    style: 'vivid',
    quality: 'hd',
  }),
});

const data = await response.json();
console.log('Image URL:', data.data.url);
console.log('Credits used:', data.data.credits);

// Download the image
const imageResponse = await fetch(data.data.url);
const blob = await imageResponse.blob();
// Save or display the image
```

---

### Example 4: Speech Synthesis

```typescript
// Convert text to speech
const response = await fetch('/api/ai/speech', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    text: 'Welcome to our AI-powered platform. We hope you enjoy your experience!',
    model: 'tts-1-hd',
    voice: 'nova',
    speed: 1.0,
    format: 'mp3',
  }),
});

const data = await response.json();
console.log('Audio URL:', data.data.url);
console.log('Duration:', data.data.duration, 'seconds');
console.log('Credits used:', data.data.credits);

// Play the audio
const audio = new Audio(data.data.url);
audio.play();
```

---

### Example 5: Audio Transcription

```typescript
// Transcribe an audio file
const formData = new FormData();
formData.append('file', audioFile);
formData.append('model', 'whisper-1');
formData.append('language', 'en');
formData.append('timestamps', 'true');

const response = await fetch('/api/ai/transcribe', {
  method: 'POST',
  body: formData,
});

const data = await response.json();
console.log('Transcription:', data.data.text);
console.log('Language:', data.data.language);
console.log('Duration:', data.data.duration, 'seconds');
console.log('Credits used:', data.data.credits);

// Display timestamps
data.data.timestamps.forEach(({ word, start, end }) => {
  console.log(`${word}: ${start}s - ${end}s`);
});
```

---

### Example 6: Using Presets

```typescript
// List available presets
const presetsResponse = await fetch('/api/presets?category=content');
const presetsData = await presetsResponse.json();
const blogPreset = presetsData.data.presets.find(
  (p) => p.name === 'Blog Post Writer'
);

// Use preset template
const prompt = blogPreset.template.replace(
  '{topic}',
  'artificial intelligence'
);

// Generate content with preset parameters
const response = await fetch('/api/ai/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    prompt,
    model: blogPreset.model,
    ...blogPreset.parameters,
  }),
});

const data = await response.json();
console.log('Generated blog post:', data.data.text);
```

---

### Example 7: Conversation Management

```typescript
// Create a new conversation
const createResponse = await fetch('/api/conversations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'AI Discussion',
    model: 'gpt-4',
    provider: 'openai',
  }),
});

const { conversation } = (await createResponse.json()).data;

// Send messages in the conversation
const chatResponse = await fetch('/api/ai/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    conversationId: conversation.id,
    message: 'What are the benefits of AI?',
    model: 'gpt-4',
  }),
});

// Get conversation history
const historyResponse = await fetch(`/api/conversations/${conversation.id}`);
const historyData = await historyResponse.json();
console.log('Messages:', historyData.data.conversation.messages);
```

---

## Error Handling

### Error Response Format

All errors follow a consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional context"
    }
  }
}
```

### Common Error Codes

#### AI Service Errors

| Code                       | Status | Description                        | Solution                                    |
| -------------------------- | ------ | ---------------------------------- | ------------------------------------------- |
| `INSUFFICIENT_CREDITS`     | 400    | Workspace has insufficient credits | Add credits to workspace                    |
| `INVALID_MODEL`            | 400    | Model not found or not supported   | Check available models via `/api/ai/models` |
| `INVALID_PROVIDER`         | 400    | Provider not configured or invalid | Verify provider API keys in environment     |
| `CONTENT_POLICY_VIOLATION` | 400    | Content violates provider policies | Modify prompt to comply with policies       |
| `RATE_LIMIT_EXCEEDED`      | 429    | Too many requests                  | Wait for rate limit reset (see headers)     |
| `PROVIDER_ERROR`           | 500    | External provider error            | Retry request or contact support            |
| `GENERATION_TIMEOUT`       | 500    | Request timed out                  | Reduce maxTokens or retry                   |
| `STREAMING_ERROR`          | 500    | Stream interrupted                 | Reconnect and retry                         |

#### Credit System Errors

| Code                      | Status | Description              | Solution                |
| ------------------------- | ------ | ------------------------ | ----------------------- |
| `CREDIT_DEDUCTION_FAILED` | 500    | Failed to deduct credits | Contact support         |
| `CREDIT_REFUND_FAILED`    | 500    | Failed to refund credits | Contact support         |
| `INVALID_CREDIT_AMOUNT`   | 400    | Invalid credit amount    | Check calculation logic |

#### Conversation Errors

| Code                         | Status | Description                | Solution                   |
| ---------------------------- | ------ | -------------------------- | -------------------------- |
| `CONVERSATION_NOT_FOUND`     | 404    | Conversation doesn't exist | Verify conversation ID     |
| `MESSAGE_NOT_FOUND`          | 404    | Message doesn't exist      | Verify message ID          |
| `CONVERSATION_ACCESS_DENIED` | 403    | No access to conversation  | Check workspace membership |

### Error Handling Best Practices

#### 1. Check Credits Before Generation

```typescript
// Check workspace credits before making request
const workspaceResponse = await fetch('/api/workspaces/current');
const workspace = (await workspaceResponse.json()).data.workspace;

if (workspace.creditCount < estimatedCost) {
  alert('Insufficient credits. Please add more credits.');
  return;
}

// Proceed with generation
const response = await fetch('/api/ai/completions', {
  /* ... */
});
```

#### 2. Handle Rate Limits Gracefully

```typescript
async function generateWithRetry(requestData, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch('/api/ai/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
    });

    if (response.status === 429) {
      const retryAfter = response.headers.get('X-RateLimit-Reset');
      const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000;

      console.log(`Rate limited. Retrying in ${waitTime}ms...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      continue;
    }

    return response;
  }

  throw new Error('Max retries exceeded');
}
```

#### 3. Handle Streaming Errors

```typescript
const eventSource = new EventSource('/api/ai/chat');
let reconnectAttempts = 0;
const maxReconnects = 3;

eventSource.onerror = (error) => {
  console.error('Stream error:', error);
  eventSource.close();

  if (reconnectAttempts < maxReconnects) {
    reconnectAttempts++;
    console.log(`Reconnecting... (${reconnectAttempts}/${maxReconnects})`);
    setTimeout(() => {
      // Recreate event source
      eventSource = new EventSource('/api/ai/chat');
    }, 1000 * reconnectAttempts);
  } else {
    console.error('Max reconnection attempts reached');
    // Fall back to non-streaming mode
  }
};
```

#### 4. Validate Input Before Sending

```typescript
function validateGenerationRequest(data) {
  const errors = [];

  if (!data.prompt || data.prompt.trim().length === 0) {
    errors.push('Prompt is required');
  }

  if (data.prompt && data.prompt.length > 10000) {
    errors.push('Prompt exceeds maximum length of 10,000 characters');
  }

  if (!data.model) {
    errors.push('Model is required');
  }

  if (data.temperature && (data.temperature < 0 || data.temperature > 2)) {
    errors.push('Temperature must be between 0 and 2');
  }

  if (data.maxTokens && data.maxTokens > 4096) {
    errors.push('Max tokens cannot exceed 4096');
  }

  return errors;
}

// Usage
const errors = validateGenerationRequest(requestData);
if (errors.length > 0) {
  console.error('Validation errors:', errors);
  return;
}
```

---

## Best Practices

### 1. Credit Management

#### Monitor Credit Balance

```typescript
// Check credits before expensive operations
async function checkCreditsBeforeGeneration(estimatedCost: number) {
  const response = await fetch('/api/workspaces/current');
  const { workspace } = (await response.json()).data;

  if (workspace.creditCount < estimatedCost) {
    throw new Error('Insufficient credits');
  }

  // Warn if credits are low
  if (workspace.creditCount < estimatedCost * 10) {
    console.warn('Credit balance is low. Consider adding more credits.');
  }
}
```

#### Estimate Costs

```typescript
// Estimate cost before generation
function estimateTextGenerationCost(
  prompt: string,
  maxTokens: number,
  model: string
): number {
  const inputTokens = Math.ceil(prompt.length / 4); // Rough estimate
  const outputTokens = maxTokens;

  const rates = {
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-3.5-turbo': { input: 0.001, output: 0.002 },
    'claude-3-opus': { input: 0.015, output: 0.075 },
  };

  const rate = rates[model] || rates['gpt-3.5-turbo'];
  return (inputTokens * rate.input + outputTokens * rate.output) / 1000;
}
```

### 2. Performance Optimization

#### Cache Model Information

```typescript
// Cache model list to reduce API calls
let modelCache: any[] | null = null;
let cacheExpiry: number = 0;

async function getModels(forceRefresh = false) {
  const now = Date.now();

  if (!forceRefresh && modelCache && now < cacheExpiry) {
    return modelCache;
  }

  const response = await fetch('/api/ai/models');
  const data = await response.json();

  modelCache = data.data.models;
  cacheExpiry = now + 3600000; // Cache for 1 hour

  return modelCache;
}
```

#### Debounce User Input

```typescript
// Debounce to reduce unnecessary API calls
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Usage
const debouncedGenerate = debounce(generateText, 500);
```

### 3. User Experience

#### Show Progress Indicators

```typescript
// Show loading state during generation
async function generateWithProgress(prompt: string) {
  const progressElement = document.getElementById('progress');
  progressElement.textContent = 'Generating...';
  progressElement.style.display = 'block';

  try {
    const response = await fetch('/api/ai/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, model: 'gpt-4' }),
    });

    const data = await response.json();
    return data.data.text;
  } finally {
    progressElement.style.display = 'none';
  }
}
```

#### Handle Streaming Gracefully

```typescript
// Display streaming responses smoothly
function displayStreamingResponse(elementId: string) {
  const element = document.getElementById(elementId);
  let buffer = '';

  const eventSource = new EventSource('/api/ai/chat');

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'chunk') {
      buffer += data.content;
      element.textContent = buffer;
      element.scrollTop = element.scrollHeight; // Auto-scroll
    }
  };

  return eventSource;
}
```

### 4. Security

#### Validate User Input

```typescript
// Sanitize and validate input
function sanitizePrompt(prompt: string): string {
  // Remove potentially harmful content
  const sanitized = prompt
    .trim()
    .replace(/[<>]/g, '') // Remove HTML tags
    .substring(0, 10000); // Limit length

  if (sanitized.length === 0) {
    throw new Error('Prompt cannot be empty');
  }

  return sanitized;
}
```

#### Implement Content Filtering

```typescript
// Check for inappropriate content before sending
function containsInappropriateContent(text: string): boolean {
  const blockedPatterns = [
    // Add patterns for content filtering
    /\b(spam|abuse|harmful)\b/i,
  ];

  return blockedPatterns.some((pattern) => pattern.test(text));
}

async function generateSafely(prompt: string) {
  if (containsInappropriateContent(prompt)) {
    throw new Error('Content violates usage policies');
  }

  return await fetch('/api/ai/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, model: 'gpt-4' }),
  });
}
```

### 5. Error Recovery

#### Implement Retry Logic

```typescript
// Retry with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      const delay = baseDelay * Math.pow(2, i);
      console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error('Max retries exceeded');
}

// Usage
const result = await retryWithBackoff(() =>
  fetch('/api/ai/completions', {
    /* ... */
  })
);
```

#### Graceful Degradation

```typescript
// Fall back to simpler model if primary fails
async function generateWithFallback(prompt: string) {
  const models = ['gpt-4', 'gpt-3.5-turbo', 'claude-3-sonnet'];

  for (const model of models) {
    try {
      const response = await fetch('/api/ai/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model }),
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn(`Failed with ${model}, trying next...`);
    }
  }

  throw new Error('All models failed');
}
```

---

## Troubleshooting

### Common Issues

#### Issue: "Insufficient Credits" Error

**Symptoms**: API returns 400 with `INSUFFICIENT_CREDITS` error code

**Solutions**:

1. Check workspace credit balance: `GET /api/workspaces/current`
2. Add credits to workspace through billing system
3. Reduce `maxTokens` parameter to lower cost
4. Use a cheaper model (e.g., gpt-3.5-turbo instead of gpt-4)

---

#### Issue: Rate Limit Exceeded

**Symptoms**: API returns 429 status code

**Solutions**:

1. Check rate limit headers in response
2. Implement exponential backoff retry logic
3. Reduce request frequency
4. Contact support for higher rate limits (enterprise plans)

---

#### Issue: Streaming Connection Drops

**Symptoms**: EventSource closes unexpectedly

**Solutions**:

1. Implement reconnection logic with exponential backoff
2. Check network stability
3. Verify server-side streaming implementation
4. Fall back to non-streaming mode if persistent

---

#### Issue: Provider API Key Invalid

**Symptoms**: API returns `INVALID_PROVIDER` error

**Solutions**:

1. Verify API key in environment variables
2. Check API key has not expired
3. Ensure API key has correct permissions
4. Test API key directly with provider's API

---

#### Issue: Content Policy Violation

**Symptoms**: API returns `CONTENT_POLICY_VIOLATION` error

**Solutions**:

1. Review and modify prompt to comply with provider policies
2. Remove potentially harmful or inappropriate content
3. Check provider's content policy documentation
4. Try a different provider if content is legitimate

---

#### Issue: Generation Timeout

**Symptoms**: API returns `GENERATION_TIMEOUT` error

**Solutions**:

1. Reduce `maxTokens` parameter
2. Simplify prompt
3. Try a faster model
4. Check provider status page for outages

---

## Performance Considerations

### Optimization Strategies

1. **Caching**: Cache model information and preset templates
2. **Lazy Loading**: Load conversations and messages on demand
3. **Virtual Scrolling**: Use virtual scrolling for long message lists
4. **Debouncing**: Debounce user input to reduce API calls
5. **Compression**: Enable gzip compression for API responses
6. **CDN**: Use CDN for static assets (images, audio files)
7. **Database Indexing**: Ensure proper indexes on frequently queried fields

### Monitoring

Track these metrics for optimal performance:

- Average response time per provider
- Credit consumption rate
- Rate limit hit rate
- Error rate by error type
- Cache hit rate
- Database query performance

---

## Additional Resources

### External Documentation

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Anthropic API Documentation](https://docs.anthropic.com/)
- [Google AI Documentation](https://ai.google.dev/docs)
- [Mistral AI Documentation](https://docs.mistral.ai/)

### Related Documentation

- [AI Provider Setup Guide](AI_PROVIDERS_SETUP.md)
- [API Documentation](API.md)
- [Architecture Documentation](ARCHITECTURE.md)
- [Environment Variables](ENVIRONMENT.md)

### Support

For additional help:

- Check the troubleshooting section above
- Review error codes and solutions
- Contact support team
- Check provider status pages

---

**Last Updated**: November 2024

**Version**: 1.0.0

**Module**: AI Services
