# AI Models API

This endpoint provides information about available AI models, their capabilities, and pricing.

## Endpoints

### GET /api/ai/models

Retrieve a list of available AI models with optional filtering.

**Requirements:** 8.1, 8.2, 8.3

**Authentication:** Required

**Query Parameters:**

- `capability` (optional): Filter by capability type
  - `text-generation` - Text completion and chat models
  - `image-generation` - Image generation models
  - `speech-synthesis` - Text-to-speech models
  - `transcription` - Speech-to-text models
- `provider` (optional): Filter by AI provider
  - `openai` - OpenAI models
  - `anthropic` - Anthropic models
  - `google` - Google models
  - `mistral` - Mistral AI models

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
    },
    {
      "id": "claude-3-5-sonnet-20241022",
      "name": "Claude 3.5 Sonnet",
      "provider": "anthropic",
      "capabilities": ["text-generation"],
      "description": "Most intelligent Claude model",
      "contextWindow": 200000,
      "maxOutputTokens": 8192,
      "pricing": {
        "input": 3.0,
        "output": 15.0
      },
      "available": true,
      "deprecated": false
    }
  ]
}
```

**Response Fields:**

- `id`: Unique model identifier
- `name`: Human-readable model name
- `provider`: AI provider (openai, anthropic, google, mistral)
- `capabilities`: Array of supported capabilities
- `description`: Model description
- `contextWindow`: Maximum context window size in tokens (for text models)
- `maxOutputTokens`: Maximum output tokens (for text models)
- `pricing`: Pricing information per 1M tokens
  - `input`: Cost per 1M input tokens (USD)
  - `output`: Cost per 1M output tokens (USD)
- `available`: Whether the provider is currently available (API key configured)
- `deprecated`: Whether the model is deprecated
- `replacementModel`: Suggested replacement model (if deprecated)

**Error Responses:**

- `401` - Unauthorized (authentication required)
- `500` - Internal server error

## Examples

### Get all available models

```bash
curl -X GET "https://api.example.com/api/ai/models" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get text generation models only

```bash
curl -X GET "https://api.example.com/api/ai/models?capability=text-generation" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get OpenAI models only

```bash
curl -X GET "https://api.example.com/api/ai/models?provider=openai" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get OpenAI text generation models

```bash
curl -X GET "https://api.example.com/api/ai/models?provider=openai&capability=text-generation" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### JavaScript/TypeScript Example

```typescript
// Fetch all models
const response = await fetch('/api/ai/models', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const { data: models } = await response.json();

// Filter for text generation models
const textModels = models.filter((m) =>
  m.capabilities.includes('text-generation')
);

// Find available models only
const availableModels = models.filter((m) => m.available);

// Get pricing for a specific model
const gpt4Mini = models.find((m) => m.id === 'gpt-4o-mini');
console.log(`Input: $${gpt4Mini.pricing.input}/1M tokens`);
console.log(`Output: $${gpt4Mini.pricing.output}/1M tokens`);
```

## Model Availability

The `available` field indicates whether a model's provider is currently configured and ready to use. A model is available when:

1. The provider is enabled in the system configuration
2. The provider's API key is configured in environment variables

If a model shows `available: false`, you need to configure the provider's API key:

- OpenAI: `OPENAI_API_KEY`
- Anthropic: `ANTHROPIC_API_KEY`
- Google: `GOOGLE_AI_API_KEY`
- Mistral: `MISTRAL_API_KEY`

## Pricing Information

Pricing is provided per 1 million tokens for text models. To calculate the cost of a request:

```typescript
const inputCost = (inputTokens / 1_000_000) * model.pricing.input;
const outputCost = (outputTokens / 1_000_000) * model.pricing.output;
const totalCost = inputCost + outputCost;
```

Note: Image generation, speech synthesis, and transcription models may have different pricing structures not reflected in the token-based pricing fields.

## Deprecated Models

When a model is deprecated:

- `deprecated` will be `true`
- `replacementModel` may suggest an alternative model to use
- The model may still be available but is not recommended for new projects

## Use Cases

### Building a Model Selector UI

```typescript
async function buildModelSelector() {
  const response = await fetch('/api/ai/models?capability=text-generation');
  const { data: models } = await response.json();

  return models
    .filter((m) => m.available && !m.deprecated)
    .map((m) => ({
      value: m.id,
      label: `${m.name} (${m.provider})`,
      description: m.description,
      pricing: `$${m.pricing.input}/$${m.pricing.output} per 1M tokens`,
    }));
}
```

### Checking Model Capabilities

```typescript
async function supportsStreaming(modelId: string): Promise<boolean> {
  const response = await fetch('/api/ai/models');
  const { data: models } = await response.json();

  const model = models.find((m) => m.id === modelId);
  return model?.capabilities.includes('text-generation') ?? false;
}
```

### Finding the Most Cost-Effective Model

```typescript
async function findCheapestModel(capability: string) {
  const response = await fetch(`/api/ai/models?capability=${capability}`);
  const { data: models } = await response.json();

  return models
    .filter((m) => m.available && !m.deprecated && m.pricing)
    .sort((a, b) => {
      const costA = a.pricing.input + a.pricing.output;
      const costB = b.pricing.input + b.pricing.output;
      return costA - costB;
    })[0];
}
```
