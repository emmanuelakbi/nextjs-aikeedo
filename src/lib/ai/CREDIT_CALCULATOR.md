# Credit Calculator

The Credit Calculator provides a unified system for calculating credit costs across all AI operations in the platform.

## Overview

Credits are the internal currency used to track and bill AI usage. Different AI operations have different credit costs based on their resource consumption:

- **Text Generation**: Based on token count (input + output)
- **Image Generation**: Fixed cost per image based on resolution
- **Speech Synthesis**: Based on character count of input text
- **Transcription**: Based on audio duration in minutes

## Usage

### Basic Usage

```typescript
import { creditCalculator } from '@/lib/ai';

// Calculate credits for text generation
const textCredits = creditCalculator.calculateTextCredits(1000, 'gpt-4');
// Returns: 30 credits (1000 tokens at 30 credits per 1000 tokens)

// Calculate credits for image generation
const imageCredits = creditCalculator.calculateImageCredits('1024x1024');
// Returns: 40 credits

// Calculate credits for speech synthesis
const speechCredits = creditCalculator.calculateSpeechCredits('Hello, world!');
// Returns: 1 credit (13 characters, rounded up)

// Calculate credits for transcription
const transcriptionCredits = creditCalculator.calculateTranscriptionCredits(60);
// Returns: 3 credits (1 minute at 3 credits per minute)
```

### Helper Functions

For convenience, you can use the standalone helper functions:

```typescript
import {
  calculateTextCredits,
  calculateImageCredits,
  calculateSpeechCredits,
  calculateTranscriptionCredits,
} from '@/lib/ai';

const credits = calculateTextCredits(1000, 'gpt-4');
```

### Detailed Token Calculation

When you have separate input and output token counts:

```typescript
const credits = creditCalculator.calculateTextCreditsDetailed(
  500, // input tokens
  500, // output tokens
  'gpt-4'
);
// Returns: 30 credits (1000 total tokens)
```

### Token Estimation

When actual token counts are not available, you can estimate:

```typescript
const estimatedTokens = creditCalculator.estimateTokens('Hello, world!');
// Returns: ~4 tokens (rough estimate: 1 token per 4 characters)

const estimatedCredits = creditCalculator.estimateTextCredits(
  'Hello, world!',
  'gpt-4'
);
// Returns: estimated credit cost based on text length
```

## Credit Rates

### Text Generation (per 1000 tokens)

| Model             | Credits per 1K tokens |
| ----------------- | --------------------- |
| GPT-4             | 30                    |
| GPT-4 Turbo       | 20                    |
| GPT-4o            | 15                    |
| GPT-3.5 Turbo     | 2                     |
| Claude 3 Opus     | 30                    |
| Claude 3 Sonnet   | 15                    |
| Claude 3 Haiku    | 5                     |
| Gemini Pro        | 10                    |
| Gemini 1.5 Pro    | 15                    |
| Gemini 1.5 Flash  | 5                     |
| Mistral Large     | 20                    |
| Mistral Medium    | 10                    |
| Mistral Small     | 5                     |
| Default (unknown) | 10                    |

### Image Generation

| Size      | Credits |
| --------- | ------- |
| 256x256   | 10      |
| 512x512   | 20      |
| 1024x1024 | 40      |
| 1792x1024 | 60      |
| 1024x1792 | 60      |

### Speech Synthesis

- **5 credits per 1000 characters**

### Transcription

- **3 credits per minute** of audio

## Configuration

### Getting Current Rates

```typescript
// Get rate for a specific model
const rate = creditCalculator.getModelRate('gpt-4');
// Returns: 30

// Get all image pricing
const imagePricing = creditCalculator.getImagePricing();
// Returns: { '256x256': 10, '512x512': 20, ... }

// Get speech rate
const speechRate = creditCalculator.getSpeechRate();
// Returns: 5

// Get transcription rate
const transcriptionRate = creditCalculator.getTranscriptionRate();
// Returns: 3
```

### Updating Configuration

You can update credit rates at runtime:

```typescript
creditCalculator.updateConfig({
  textCreditsPerKToken: {
    'custom-model': 25,
  },
  imageCredits: {
    '1024x1024': 50,
  },
  speechCreditsPerKChar: 10,
  transcriptionCreditsPerMinute: 5,
});
```

### Custom Calculator Instance

Create a calculator with custom configuration:

```typescript
import { CreditCalculator } from '@/lib/ai';

const customCalculator = new CreditCalculator({
  textCreditsPerKToken: {
    'gpt-4': 40,
    default: 15,
  },
  imageCredits: {
    '256x256': 15,
    '512x512': 30,
    '1024x1024': 60,
    '1792x1024': 90,
    '1024x1792': 90,
  },
  speechCreditsPerKChar: 8,
  transcriptionCreditsPerMinute: 5,
});
```

## Integration with AI Services

The credit calculator integrates with AI service responses through the `ResponseMetadata` interface:

```typescript
import type { ResponseMetadata } from '@/lib/ai';

const response: TextGenerationResponse = {
  content: 'Generated text...',
  metadata: {
    model: 'gpt-4',
    provider: 'openai',
    tokens: {
      input: 100,
      output: 200,
      total: 300,
    },
    credits: calculateTextCredits(300, 'gpt-4'), // 9 credits
    finishReason: 'stop',
  },
};
```

## Credit Calculation Rules

### Rounding

All credit calculations round **up** to the nearest integer:

- 0.1 credits → 1 credit
- 1.5 credits → 2 credits
- 10.01 credits → 11 credits

This ensures users are always charged at least 1 credit for any operation (when usage > 0).

### Zero Usage

Operations with zero usage return 0 credits:

- 0 tokens → 0 credits
- Empty text → 0 credits
- 0 duration → 0 credits
- 0 images → 0 credits

### Error Handling

The calculator validates inputs and throws errors for:

- Negative values (tokens, duration, count)
- Non-finite numbers (Infinity, NaN)
- Invalid types (non-string text, non-integer counts)
- Unknown image sizes

## Best Practices

### 1. Calculate Before Deduction

Always calculate credits before making the API call:

```typescript
// Estimate credits first
const estimatedCredits = creditCalculator.estimateTextCredits(prompt, model);

// Check if workspace has enough credits
if (!workspace.hasAvailableCredits(estimatedCredits)) {
  throw new Error('Insufficient credits');
}

// Allocate credits
workspace.allocateCredits(estimatedCredits);

// Make API call
const response = await aiService.generateCompletion(prompt);

// Calculate actual credits from response
const actualCredits = calculateTextCredits(
  response.metadata.tokens.total,
  model
);

// Adjust allocation if needed
if (actualCredits !== estimatedCredits) {
  const difference = actualCredits - estimatedCredits;
  if (difference > 0) {
    workspace.allocateCredits(difference);
  } else {
    workspace.releaseCredits(Math.abs(difference));
  }
}

// Consume the credits
workspace.consumeCredits(actualCredits);
```

### 2. Handle Failures

Refund credits on failure:

```typescript
try {
  workspace.allocateCredits(estimatedCredits);
  const response = await aiService.generateCompletion(prompt);
  const actualCredits = calculateTextCredits(
    response.metadata.tokens.total,
    model
  );
  workspace.consumeCredits(actualCredits);
} catch (error) {
  // Release allocated credits on failure
  workspace.releaseCredits(estimatedCredits);
  throw error;
}
```

### 3. Track Usage

Log credit usage for auditing:

```typescript
const credits = calculateTextCredits(tokens, model);

await logUsage({
  workspaceId: workspace.getId().getValue(),
  userId: user.id,
  type: 'text-generation',
  model,
  tokens,
  credits,
  timestamp: new Date(),
});
```

## Testing

The credit calculator includes comprehensive tests covering:

- All calculation methods
- Edge cases (zero, negative, large values)
- Error handling
- Configuration updates
- Helper functions

Run tests:

```bash
npm test -- credit-calculator.test.ts
```

## Requirements

This implementation satisfies:

- **Requirement 2.4**: Credit deduction on generation completion
- **Requirement 7.1**: Credit calculation and deduction
- **Requirement 7.2**: Credit consumption display by service type
