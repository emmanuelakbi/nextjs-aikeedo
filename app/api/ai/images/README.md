# Image Generation API

## POST /api/ai/images

Generate images from text prompts using AI providers (OpenAI DALL-E, Google Imagen).

### Requirements

- Requirements: 4.1, 4.2, 4.3, 4.4

### Authentication

Requires valid session authentication.

### Headers

- `x-workspace-id` (optional): Workspace ID for the generation. Can also be provided in request body.

### Request Body

```typescript
{
  workspaceId?: string;      // Workspace ID (required if not in header)
  prompt: string;            // Text description of desired image (1-4000 chars)
  model: string;             // Model identifier (e.g., "dall-e-3", "dall-e-2")
  provider: "openai" | "google";
  size?: "256x256" | "512x512" | "1024x1024" | "1792x1024" | "1024x1792";
  style?: "natural" | "vivid" | "artistic" | "photographic";
  quality?: "standard" | "hd";
  n?: number;                // Number of images to generate (1-10, default: 1)
}
```

### Size Support by Provider

**OpenAI DALL-E 3:**

- `1024x1024` (default)
- `1792x1024` (landscape)
- `1024x1792` (portrait)

**OpenAI DALL-E 2:**

- `256x256`
- `512x512`
- `1024x1024`

**Google Imagen:**

- `1024x1024`
- `1792x1024`
- `1024x1792`

### Style Support

**OpenAI DALL-E 3:**

- `natural`: More natural, less hyper-real looking images
- `vivid`: Hyper-real and dramatic images (default)

**Mapping for other styles:**

- `artistic` → `vivid`
- `photographic` → `natural`

### Response

#### Single Image (n=1)

```typescript
{
  success: true,
  data: {
    id: string;           // Generation record ID
    url: string;          // Image URL
    width: number;        // Image width in pixels
    height: number;       // Image height in pixels
    model: string;        // Model used
    provider: string;     // Provider used
    credits: number;      // Credits consumed
  }
}
```

#### Multiple Images (n>1)

```typescript
{
  success: true,
  data: {
    images: Array<{
      id: string;
      url: string;
      width: number;
      height: number;
      model: string;
      provider: string;
      credits: number;
    }>;
    count: number;        // Number of images generated
    totalCredits: number; // Total credits consumed
  }
}
```

### Error Responses

#### 400 Bad Request - Validation Error

```typescript
{
  error: {
    code: "VALIDATION_ERROR",
    message: "Invalid input data",
    fields: {
      [fieldName]: string[]  // Array of error messages per field
    }
  }
}
```

#### 400 Bad Request - Missing Workspace

```typescript
{
  error: {
    code: "MISSING_WORKSPACE",
    message: "Workspace ID is required"
  }
}
```

#### 400 Bad Request - Invalid Size

```typescript
{
  error: {
    code: "INVALID_SIZE",
    message: "Size not supported by model"
  }
}
```

#### 401 Unauthorized

```typescript
{
  error: {
    code: "UNAUTHORIZED",
    message: "Authentication required"
  }
}
```

#### 402 Payment Required - Insufficient Credits

```typescript
{
  error: {
    code: "INSUFFICIENT_CREDITS",
    message: "Insufficient credits: required X, available Y",
    details: {
      required: number,
      available: number
    }
  }
}
```

#### 429 Too Many Requests

```typescript
{
  error: {
    code: "RATE_LIMIT_EXCEEDED",
    message: "Rate limit exceeded"
  }
}
```

#### 503 Service Unavailable

```typescript
{
  error: {
    code: "PROVIDER_UNAVAILABLE",
    message: "Provider error message"
  }
}
```

#### 500 Internal Server Error

```typescript
{
  error: {
    code: "INTERNAL_ERROR",
    message: "An error occurred while generating image"
  }
}
```

### Credit Costs

Image generation costs vary by size and quality:

| Size      | Standard Quality | HD Quality |
| --------- | ---------------- | ---------- |
| 256x256   | 3 credits        | N/A        |
| 512x512   | 5 credits        | N/A        |
| 1024x1024 | 10 credits       | 20 credits |
| 1792x1024 | 15 credits       | 30 credits |
| 1024x1792 | 15 credits       | 30 credits |

### Example Usage

#### Generate Single Image

```typescript
const response = await fetch('/api/ai/images', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-workspace-id': 'workspace-uuid',
  },
  body: JSON.stringify({
    prompt: 'A serene mountain landscape at sunset',
    model: 'dall-e-3',
    provider: 'openai',
    size: '1024x1024',
    style: 'natural',
    quality: 'standard',
  }),
});

const data = await response.json();
console.log(data.data.url); // Image URL
```

#### Generate Multiple Images

```typescript
const response = await fetch('/api/ai/images', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-workspace-id': 'workspace-uuid',
  },
  body: JSON.stringify({
    prompt: 'A futuristic city skyline',
    model: 'dall-e-2',
    provider: 'openai',
    size: '512x512',
    n: 4,
  }),
});

const data = await response.json();
console.log(data.data.images); // Array of 4 images
console.log(data.data.totalCredits); // Total credits used
```

### Rate Limiting

This endpoint is subject to rate limiting:

- Per-user: 60 requests/minute
- Per-workspace: 1000 requests/hour
- Per-IP: 100 requests/minute

Rate limit information is included in response headers:

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Time when limit resets (Unix timestamp)

### Notes

1. **Credit Management**: Credits are allocated before generation and consumed only on success. If generation fails, credits are automatically refunded.

2. **Storage**: Generated images are stored by the provider (OpenAI, Google) and URLs are returned. URLs may expire based on provider policies.

3. **Multiple Images**: When requesting multiple images (n>1), each image is generated sequentially to ensure proper credit management.

4. **Size Validation**: The API validates that the requested size is supported by the selected model. Unsupported sizes will return a 400 error.

5. **Style Mapping**: Generic style parameters are automatically mapped to provider-specific styles.

6. **Generation Records**: Each image generation creates a record in the database for tracking and auditing purposes.
