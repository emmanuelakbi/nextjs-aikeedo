# Design Document - AI Services Module

## Overview

The AI Services module provides a unified interface for interacting with multiple AI providers (OpenAI, Anthropic, Google, Mistral) for text generation, image generation, speech synthesis, and transcription. It implements the Strategy pattern for provider abstraction and includes credit management, rate limiting, and comprehensive error handling.

## Architecture

### Provider Abstraction Layer

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

### Data Models

**Conversation Entity**

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

**Message Entity**

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

**Generation Entity**

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

**Preset Entity**

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

## Correctness Properties

### Property 1: Credit deduction atomicity

_For any_ AI generation request, credits should be deducted if and only if the generation completes successfully

### Property 2: Provider failover

_For any_ provider failure, the system should attempt retry before returning error to user

### Property 3: Rate limit enforcement

_For any_ user making requests, the system should enforce rate limits consistently across all endpoints

### Property 4: Conversation context preservation

_For any_ conversation, messages should maintain chronological order and complete context

### Property 5: Token calculation accuracy

_For any_ generation, the calculated tokens should match the provider's reported usage within 5% margin

### Property 6: Streaming response completeness

_For any_ streaming generation, all chunks should be delivered in order without loss

### Property 7: Credit refund on failure

_For any_ failed generation, credits should be refunded to the workspace

### Property 8: Model availability validation

_For any_ model selection, the system should verify the model is available before accepting requests

## Implementation Details

### AI Service Factory

```typescript
interface AIServiceFactory {
  createTextService(provider: string, model: string): TextGenerationService;
  createImageService(provider: string, model: string): ImageGenerationService;
  createSpeechService(provider: string, model: string): SpeechSynthesisService;
  createTranscriptionService(provider: string): TranscriptionService;
}
```

### Credit Calculation

- Text: Based on tokens (input + output)
- Images: Fixed per image based on resolution
- Speech: Based on character count
- Transcription: Based on audio duration

### Rate Limiting Strategy

- Per-user: 60 requests/minute
- Per-workspace: 1000 requests/hour
- Per-IP: 100 requests/minute
- Sliding window algorithm with Redis

### Error Handling

- Retry logic: 3 attempts with exponential backoff
- Timeout: 60 seconds for text, 120 seconds for images
- Circuit breaker: Open after 5 consecutive failures
- Fallback: Queue for later processing if all retries fail
