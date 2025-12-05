# AI Services Error Handling and Retry System

## Overview

This document describes the comprehensive error handling, retry logic, and circuit breaker implementation for AI services.

**Requirements:** 11.1, 11.2, 11.3, 11.4, 11.5

## Components

### 1. Error Classes (`errors.ts`)

Custom error classes for AI service operations:

- **AIServiceError**: Base error for all AI operations
- **AIRateLimitError**: Rate limit exceeded (429)
- **AITimeoutError**: Request timeout (408)
- **AIProviderUnavailableError**: Service unavailable (503)
- **AIAuthenticationError**: Invalid API key (401)
- **AIInvalidRequestError**: Bad request (400)
- **AIContentFilterError**: Content filtered by safety systems
- **CircuitBreakerOpenError**: Circuit breaker is open

All errors include:

- Provider name
- Retryable flag
- HTTP status code
- Context information

### 2. Retry Logic (`retry.ts`)

Exponential backoff retry mechanism:

```typescript
const config: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  timeout: 60000, // 60 seconds
};

const result = await executeWithRetry(
  async () => provider.generate(prompt),
  config,
  'openai'
);
```

**Features:**

- Exponential backoff: 1s → 2s → 4s → 8s...
- Maximum delay cap
- Timeout support
- Automatic retry on retryable errors
- Retry callbacks for monitoring

**Retryable Errors:**

- Network errors (ECONNRESET, ENOTFOUND)
- Timeouts
- Rate limits (429)
- Server errors (500, 502, 503, 504)
- Service overload/capacity issues

### 3. Circuit Breaker (`circuit-breaker.ts`)

Prevents cascading failures by temporarily disabling failing services:

```typescript
const breaker = new CircuitBreaker({
  failureThreshold: 5, // Open after 5 failures
  successThreshold: 2, // Close after 2 successes
  timeout: 60000, // Wait 1 minute before retry
  monitoringPeriod: 120000, // 2 minute window
});

const result = await breaker.execute(
  async () => provider.generate(prompt),
  'openai'
);
```

**States:**

- **CLOSED**: Normal operation
- **OPEN**: All requests fail immediately
- **HALF_OPEN**: Testing if service recovered

**Behavior:**

1. After `failureThreshold` failures → OPEN
2. After `timeout` → HALF_OPEN
3. After `successThreshold` successes → CLOSED
4. Any failure in HALF_OPEN → OPEN

### 4. Error Handler (`error-handler.ts`)

Transforms provider-specific errors into our error types:

```typescript
try {
  const result = await openai.chat.completions.create(...);
} catch (error) {
  handleAIError(error, 'openai', { operation: 'chat' });
}
```

**Handles:**

- OpenAI API errors
- Anthropic API errors
- Google AI errors
- Mistral errors
- Network errors
- Timeout errors

### 5. Base Provider (`base-provider.ts`)

Base class with integrated error handling:

```typescript
class MyProvider extends BaseAIProvider {
  constructor() {
    super({
      model: 'gpt-4',
      provider: 'openai',
      maxRetries: 3,
      timeout: 60000,
      enableCircuitBreaker: true,
    });
  }

  async generate(prompt: string) {
    return this.executeWithProtection(
      async () => {
        // Your API call here
      },
      'generate',
      { promptLength: prompt.length }
    );
  }
}
```

**Features:**

- Automatic retry with exponential backoff
- Circuit breaker integration
- Comprehensive logging
- Error transformation
- Performance tracking

## Usage Examples

### Basic Usage

```typescript
import { OpenAITextGenerationServiceV2 } from '@/lib/ai';

const service = new OpenAITextGenerationServiceV2(
  'gpt-4o-mini',
  3, // max retries
  60000 // timeout
);

try {
  const result = await service.generateCompletion('Hello, world!');
  console.log(result.content);
} catch (error) {
  if (error instanceof AIRateLimitError) {
    console.log(`Rate limited. Retry after ${error.retryAfter}ms`);
  } else if (error instanceof CircuitBreakerOpenError) {
    console.log('Service temporarily disabled');
  } else {
    console.error('Generation failed:', error.message);
  }
}
```

### Custom Retry Configuration

```typescript
import { executeWithRetry } from '@/lib/ai';

const result = await executeWithRetry(
  async () => {
    return await someAIOperation();
  },
  {
    maxRetries: 5,
    initialDelay: 2000,
    maxDelay: 60000,
    backoffMultiplier: 2,
    timeout: 120000,
    onRetry: (attempt, error) => {
      console.log(`Retry ${attempt}: ${error.message}`);
    },
  },
  'openai'
);
```

### Circuit Breaker Management

```typescript
import { globalCircuitBreaker, CircuitState } from '@/lib/ai';

// Check circuit state
const state = globalCircuitBreaker.getState('openai');
if (state === CircuitState.OPEN) {
  console.log('OpenAI circuit is open');
}

// Get metrics
const metrics = globalCircuitBreaker.getProviderMetrics('openai');
console.log(`Failures: ${metrics.failures}`);
console.log(`State: ${metrics.state}`);

// Reset circuit
globalCircuitBreaker.reset('openai');

// Reset all circuits
globalCircuitBreaker.resetAll();
```

### Error Handling in API Routes

```typescript
import { handleApiError } from '@/lib/errors';
import { AIRateLimitError } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    const result = await aiService.generate(prompt);
    return NextResponse.json(result);
  } catch (error) {
    // Add retry-after header for rate limits
    if (error instanceof AIRateLimitError && error.retryAfter) {
      return NextResponse.json(
        { error: error.toJSON() },
        {
          status: error.statusCode,
          headers: {
            'Retry-After': String(Math.ceil(error.retryAfter / 1000)),
          },
        }
      );
    }

    return handleApiError(error);
  }
}
```

## Configuration

### Environment Variables

```env
# Timeouts (milliseconds)
AI_REQUEST_TIMEOUT=60000
AI_STREAMING_TIMEOUT=120000

# Retry configuration
AI_MAX_RETRIES=3
AI_INITIAL_RETRY_DELAY=1000
AI_MAX_RETRY_DELAY=30000

# Circuit breaker
AI_CIRCUIT_FAILURE_THRESHOLD=5
AI_CIRCUIT_SUCCESS_THRESHOLD=2
AI_CIRCUIT_TIMEOUT=60000
```

### Per-Provider Configuration

```typescript
const providers = {
  openai: {
    maxRetries: 3,
    timeout: 60000,
    enableCircuitBreaker: true,
  },
  anthropic: {
    maxRetries: 5,
    timeout: 90000,
    enableCircuitBreaker: true,
  },
  google: {
    maxRetries: 3,
    timeout: 60000,
    enableCircuitBreaker: false, // Disable for specific provider
  },
};
```

## Monitoring and Logging

All operations are logged with structured data:

```typescript
// Success
logger.info('generateCompletion completed successfully', {
  provider: 'openai',
  model: 'gpt-4o-mini',
  durationMs: 1234,
  promptLength: 100,
});

// Retry
logger.warn('Retry attempt 2 for generateCompletion', {
  provider: 'openai',
  model: 'gpt-4o-mini',
  error: 'Rate limit exceeded',
});

// Failure
logger.error('generateCompletion failed', {
  provider: 'openai',
  model: 'gpt-4o-mini',
  durationMs: 5678,
  error: 'Service unavailable',
});

// Circuit breaker
logger.error('Circuit breaker opened', {
  provider: 'openai',
  failures: 5,
  nextAttemptTime: '2024-01-01T12:00:00Z',
});
```

## Best Practices

1. **Always use the base provider class** for new implementations
2. **Set appropriate timeouts** based on operation type:
   - Text generation: 60s
   - Image generation: 120s
   - Transcription: 180s
3. **Enable circuit breaker** for production environments
4. **Monitor circuit breaker state** and reset if needed
5. **Handle rate limits gracefully** with retry-after headers
6. **Log all errors** with context for debugging
7. **Use streaming for long operations** to avoid timeouts
8. **Test error scenarios** in development

## Testing

```typescript
import { vi } from 'vitest';
import { executeWithRetry, CircuitBreaker } from '@/lib/ai';

describe('Error Handling', () => {
  it('should retry on retryable errors', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('503'))
      .mockResolvedValueOnce('success');

    const result = await executeWithRetry(fn, { maxRetries: 2 });
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should open circuit after threshold', async () => {
    const breaker = new CircuitBreaker({ failureThreshold: 3 });
    const fn = vi.fn().mockRejectedValue(new Error('500'));

    for (let i = 0; i < 3; i++) {
      await breaker.execute(fn, 'test').catch(() => {});
    }

    expect(breaker.getState('test')).toBe('open');
  });
});
```

## Migration Guide

To migrate existing providers to the new error handling system:

1. Extend `BaseAIProvider` instead of implementing interface directly
2. Replace manual retry logic with `executeWithProtection`
3. Remove custom error handling - use `handleAIError`
4. Update tests to use new error classes
5. Add circuit breaker monitoring

See `openai-text-generation-v2.ts` for a complete example.
