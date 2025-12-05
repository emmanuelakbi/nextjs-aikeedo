# Rate Limiting Documentation

## Overview

Rate limiting protects the AIKEEDO platform from abuse, ensures fair resource allocation, and manages costs by restricting the number of requests users can make within specific time windows.

## Rate Limit Tiers

### Per-User Limits

Rate limits applied to individual authenticated users:

| Service                 | Limit        | Window     |
| ----------------------- | ------------ | ---------- |
| Text Generation         | 60 requests  | per minute |
| Image Generation        | 10 requests  | per minute |
| Speech Synthesis        | 20 requests  | per minute |
| Transcription           | 10 requests  | per minute |
| Conversation Management | 100 requests | per minute |
| Preset Management       | 50 requests  | per minute |

### Per-Workspace Limits

Rate limits applied to entire workspaces:

| Limit Type          | Free Plan  | Pro Plan   | Business Plan | Enterprise Plan |
| ------------------- | ---------- | ---------- | ------------- | --------------- |
| Total Requests      | 1,000/hour | 5,000/hour | 20,000/hour   | Custom          |
| Daily Quota         | 10,000/day | 50,000/day | 200,000/day   | Custom          |
| Concurrent Requests | 5          | 20         | 50            | Custom          |

### Per-IP Limits

Rate limits applied to IP addresses (prevents abuse):

| Endpoint Type     | Limit        | Window         |
| ----------------- | ------------ | -------------- |
| All API Endpoints | 100 requests | per minute     |
| Authentication    | 5 requests   | per 15 minutes |
| Registration      | 3 requests   | per hour       |
| Password Reset    | 3 requests   | per hour       |

## Rate Limit Algorithm

### Sliding Window Implementation

The system uses a sliding window algorithm with Redis for distributed rate limiting:

```typescript
interface RateLimitConfig {
  key: string; // Unique identifier (userId, workspaceId, IP)
  limit: number; // Maximum requests allowed
  window: number; // Time window in seconds
}

async function checkRateLimit(
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = now - config.window * 1000;
  const key = `ratelimit:${config.key}`;

  // Remove old entries outside the window
  await redis.zremrangebyscore(key, 0, windowStart);

  // Count requests in current window
  const count = await redis.zcard(key);

  if (count >= config.limit) {
    const oldestEntry = await redis.zrange(key, 0, 0, 'WITHSCORES');
    const resetTime = parseInt(oldestEntry[1]) + config.window * 1000;

    return {
      allowed: false,
      limit: config.limit,
      remaining: 0,
      reset: Math.ceil(resetTime / 1000),
    };
  }

  // Add current request
  await redis.zadd(key, now, `${now}-${randomUUID()}`);
  await redis.expire(key, config.window);

  return {
    allowed: true,
    limit: config.limit,
    remaining: config.limit - count - 1,
    reset: Math.ceil((now + config.window * 1000) / 1000),
  };
}
```

### Rate Limit Response

```typescript
interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
}
```

## HTTP Headers

All API responses include rate limit information in headers:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1638360000
X-RateLimit-Window: 60
```

### Header Descriptions

- `X-RateLimit-Limit`: Maximum requests allowed in the window
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Unix timestamp when the limit resets
- `X-RateLimit-Window`: Window duration in seconds

## Rate Limit Exceeded Response

When rate limit is exceeded, the API returns:

**Status Code**: `429 Too Many Requests`

**Response Body**:

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again in 30 seconds.",
    "retryAfter": 30,
    "limit": 60,
    "window": "1 minute"
  }
}
```

**Headers**:

```
Retry-After: 30
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1638360030
```

## Implementation Examples

### Client-Side Rate Limit Handling

#### Basic Retry Logic

```typescript
async function makeRequestWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, options);

    if (response.status !== 429) {
      return response;
    }

    // Rate limited - check retry-after header
    const retryAfter = response.headers.get('Retry-After');
    const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000;

    console.log(`Rate limited. Retrying in ${waitTime}ms...`);
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }

  throw new Error('Max retries exceeded');
}
```

#### Exponential Backoff

```typescript
async function makeRequestWithBackoff(
  url: string,
  options: RequestInit
): Promise<Response> {
  let attempt = 0;
  const maxAttempts = 5;

  while (attempt < maxAttempts) {
    const response = await fetch(url, options);

    if (response.status !== 429) {
      return response;
    }

    attempt++;
    const backoffTime = Math.min(1000 * Math.pow(2, attempt), 32000);

    console.log(
      `Attempt ${attempt}/${maxAttempts}. Waiting ${backoffTime}ms...`
    );
    await new Promise((resolve) => setTimeout(resolve, backoffTime));
  }

  throw new Error('Rate limit exceeded after multiple attempts');
}
```

#### Rate Limit Aware Client

```typescript
class RateLimitedClient {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private requestsThisMinute = 0;
  private minuteStart = Date.now();
  private readonly maxRequestsPerMinute = 60;

  async request(url: string, options: RequestInit): Promise<Response> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const response = await this.executeRequest(url, options);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async executeRequest(
    url: string,
    options: RequestInit
  ): Promise<Response> {
    // Reset counter if minute has passed
    const now = Date.now();
    if (now - this.minuteStart >= 60000) {
      this.requestsThisMinute = 0;
      this.minuteStart = now;
    }

    // Wait if we've hit the limit
    if (this.requestsThisMinute >= this.maxRequestsPerMinute) {
      const waitTime = 60000 - (now - this.minuteStart);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      this.requestsThisMinute = 0;
      this.minuteStart = Date.now();
    }

    this.requestsThisMinute++;
    return fetch(url, options);
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const request = this.queue.shift();
      if (request) {
        await request();
      }
    }

    this.processing = false;
  }
}

// Usage
const client = new RateLimitedClient();
const response = await client.request('/api/ai/completions', {
  method: 'POST',
  body: JSON.stringify({ prompt: 'Hello', model: 'gpt-4' }),
});
```
