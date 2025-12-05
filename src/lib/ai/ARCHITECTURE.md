# AI Services Error Handling Architecture

## System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         API Request                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BaseAIProvider                                │
│                 executeWithProtection()                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Circuit Breaker Check                          │
│                                                                   │
│  ┌──────────┐    ┌──────────┐    ┌──────────────┐              │
│  │  CLOSED  │───▶│   OPEN   │───▶│  HALF_OPEN   │              │
│  │ (Normal) │    │ (Reject) │    │  (Testing)   │              │
│  └──────────┘    └──────────┘    └──────────────┘              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Retry Logic                                   │
│                                                                   │
│  Attempt 1 ──┐                                                   │
│              │ Fail (Retryable)                                  │
│              ├──▶ Wait 1s ──▶ Attempt 2 ──┐                     │
│              │                             │ Fail (Retryable)    │
│              │                             ├──▶ Wait 2s ──▶      │
│              │                             │    Attempt 3 ──┐    │
│              │                             │                │    │
│              ▼                             ▼                ▼    │
│           Success                       Success          Fail    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Provider API Call                             │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  OpenAI  │  │Anthropic │  │  Google  │  │ Mistral  │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Error Handler                                 │
│                                                                   │
│  Transform provider errors → AI error classes                    │
│  - Rate Limit (429) → AIRateLimitError                          │
│  - Timeout (408) → AITimeoutError                               │
│  - Server Error (5xx) → AIProviderUnavailableError             │
│  - Auth Error (401) → AIAuthenticationError                     │
│  - Invalid Request (400) → AIInvalidRequestError                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Logger                                        │
│                                                                   │
│  Log all operations with structured data:                        │
│  - Start time                                                    │
│  - Retry attempts                                                │
│  - Success/failure                                               │
│  - Duration                                                      │
│  - Error details                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Component Interaction

```
┌──────────────────┐
│   Application    │
│      Code        │
└────────┬─────────┘
         │
         │ calls
         ▼
┌──────────────────┐
│  AI Provider     │◀─────────┐
│  (extends Base)  │          │
└────────┬─────────┘          │
         │                    │
         │ uses               │ inherits
         ▼                    │
┌──────────────────┐          │
│  BaseAIProvider  │──────────┘
└────────┬─────────┘
         │
         │ uses
         ▼
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Circuit Breaker │     │   Retry Logic    │     │  Error Handler   │
│                  │     │                  │     │                  │
│  - State mgmt    │     │  - Exponential   │     │  - Transform     │
│  - Metrics       │     │    backoff       │     │  - Categorize    │
│  - Thresholds    │     │  - Timeout       │     │  - Log           │
└──────────────────┘     └──────────────────┘     └──────────────────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │     Logger       │
                         │                  │
                         │  - Structured    │
                         │  - Contextual    │
                         │  - Levels        │
                         └──────────────────┘
```

## Error Flow

```
API Call
   │
   ▼
Try Execute
   │
   ├─ Success ──────────────────────────────────────┐
   │                                                 │
   └─ Error                                          │
      │                                              │
      ▼                                              │
   Is Retryable?                                     │
      │                                              │
      ├─ No ──▶ Transform Error ──▶ Throw ──────────┤
      │                                              │
      └─ Yes                                         │
         │                                           │
         ▼                                           │
   Retry Attempts Left?                              │
         │                                           │
         ├─ No ──▶ Transform Error ──▶ Throw ───────┤
         │                                           │
         └─ Yes                                      │
            │                                        │
            ▼                                        │
   Wait (Exponential Backoff)                        │
            │                                        │
            ▼                                        │
   Try Execute Again ──────────────────────┐         │
                                           │         │
                                           └─────────┤
                                                     │
                                                     ▼
                                              Return Result
```

## Circuit Breaker State Machine

```
                    ┌──────────────────────┐
                    │      CLOSED          │
                    │   (Normal State)     │
                    └──────────┬───────────┘
                               │
                               │ Failure count
                               │ >= threshold
                               ▼
                    ┌──────────────────────┐
                    │       OPEN           │
                    │  (Reject requests)   │
                    └──────────┬───────────┘
                               │
                               │ Timeout
                               │ expired
                               ▼
                    ┌──────────────────────┐
                    │     HALF_OPEN        │
                    │  (Test recovery)     │
                    └──────────┬───────────┘
                               │
                ┌──────────────┴──────────────┐
                │                             │
         Success count                    Any failure
         >= threshold                          │
                │                             │
                ▼                             ▼
         Back to CLOSED              Back to OPEN
```

## Retry Timing

```
Attempt 1: Immediate
   │
   │ Fail
   ▼
Wait: 1s (initialDelay × 2^0)
   │
   ▼
Attempt 2
   │
   │ Fail
   ▼
Wait: 2s (initialDelay × 2^1)
   │
   ▼
Attempt 3
   │
   │ Fail
   ▼
Wait: 4s (initialDelay × 2^2)
   │
   ▼
Attempt 4
   │
   │ Fail
   ▼
Max retries reached → Throw error
```

## Logging Timeline

```
Time: 0ms
┌─────────────────────────────────────────┐
│ INFO: Starting generateCompletion       │
│ - provider: openai                      │
│ - model: gpt-4o-mini                    │
└─────────────────────────────────────────┘

Time: 1000ms
┌─────────────────────────────────────────┐
│ WARN: Retry attempt 1                   │
│ - error: Rate limit exceeded            │
│ - delayMs: 1000                         │
└─────────────────────────────────────────┘

Time: 2000ms
┌─────────────────────────────────────────┐
│ WARN: Retry attempt 2                   │
│ - error: Rate limit exceeded            │
│ - delayMs: 2000                         │
└─────────────────────────────────────────┘

Time: 4000ms
┌─────────────────────────────────────────┐
│ INFO: generateCompletion completed      │
│ - durationMs: 4000                      │
│ - tokens: 150                           │
└─────────────────────────────────────────┘
```

## Error Categorization

```
Provider Error
      │
      ▼
┌─────────────────────────────────────────┐
│         Error Handler                   │
└─────────────────────────────────────────┘
      │
      ├─ Status 401 ──▶ AIAuthenticationError (Non-retryable)
      │
      ├─ Status 400 ──▶ AIInvalidRequestError (Non-retryable)
      │                 or AIContentFilterError (Non-retryable)
      │
      ├─ Status 408 ──▶ AITimeoutError (Retryable)
      │
      ├─ Status 429 ──▶ AIRateLimitError (Retryable)
      │
      ├─ Status 5xx ──▶ AIProviderUnavailableError (Retryable)
      │
      └─ Network ────▶ AIProviderUnavailableError (Retryable)
```

## Integration Example

```typescript
// 1. Define provider extending BaseAIProvider
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

  // 2. Use executeWithProtection for all operations
  async generate(prompt: string) {
    return this.executeWithProtection(
      async () => {
        // 3. Make API call
        const result = await this.client.generate(prompt);
        return result;
      },
      'generate',
      { promptLength: prompt.length }
    );
  }
}

// 4. Use provider in application
const provider = new MyProvider();

try {
  const result = await provider.generate('Hello');
  console.log(result);
} catch (error) {
  // 5. Handle specific error types
  if (error instanceof AIRateLimitError) {
    console.log(`Retry after ${error.retryAfter}ms`);
  } else if (error instanceof CircuitBreakerOpenError) {
    console.log('Service temporarily disabled');
  } else {
    console.error('Generation failed:', error.message);
  }
}
```
