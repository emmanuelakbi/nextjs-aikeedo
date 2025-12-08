# Credit System Documentation

## Overview

The credit system is the internal currency used to track and manage AI service usage across the AIKEEDO platform. Credits are deducted from workspaces based on actual AI provider usage.

## Credit Calculation

### Text Generation

Credits for text generation are calculated based on token usage:

```
Credits = (Input Tokens × Input Rate) + (Output Tokens × Output Rate)
```

#### Token Rates by Model

| Model             | Input Rate (per 1K tokens) | Output Rate (per 1K tokens) |
| ----------------- | -------------------------- | --------------------------- |
| GPT-4             | 0.03 credits               | 0.06 credits                |
| GPT-4 Turbo       | 0.01 credits               | 0.03 credits                |
| GPT-3.5 Turbo     | 0.001 credits              | 0.002 credits               |
| Claude-3 Opus     | 0.015 credits              | 0.075 credits               |
| Claude-3 Sonnet   | 0.003 credits              | 0.015 credits               |
| Claude-3 Haiku    | 0.00025 credits            | 0.00125 credits             |
| Gemini Pro        | 0.0005 credits             | 0.0015 credits              |
| Gemini Pro Vision | 0.00025 credits            | 0.0005 credits              |
| Mistral Large     | 0.008 credits              | 0.024 credits               |
| Mistral Medium    | 0.0027 credits             | 0.0081 credits              |
| Mistral Small     | 0.001 credits              | 0.003 credits               |

#### Examples

**Example 1: GPT-4 Completion**

- Input: 100 tokens
- Output: 500 tokens
- Calculation: (100 × 0.03 / 1000) + (500 × 0.06 / 1000)
- Total: 0.003 + 0.03 = **0.033 credits**

**Example 2: Claude-3 Sonnet Chat**

- Input: 1,500 tokens (including conversation history)
- Output: 800 tokens
- Calculation: (1500 × 0.003 / 1000) + (800 × 0.015 / 1000)
- Total: 0.0045 + 0.012 = **0.0165 credits**

**Example 3: GPT-3.5 Turbo (Cost-Effective)**

- Input: 200 tokens
- Output: 1,000 tokens
- Calculation: (200 × 0.001 / 1000) + (1000 × 0.002 / 1000)
- Total: 0.0002 + 0.002 = **0.0022 credits**

### Image Generation

Credits for image generation are based on resolution and quality:

```
Credits = Base Rate × Resolution Multiplier × Quality Multiplier
```

#### Image Generation Rates

| Resolution | Standard Quality | HD Quality |
| ---------- | ---------------- | ---------- |
| 256×256    | 10 credits       | N/A        |
| 512×512    | 15 credits       | N/A        |
| 1024×1024  | 20 credits       | 40 credits |
| 1024×1792  | 30 credits       | 60 credits |
| 1792×1024  | 30 credits       | 60 credits |

#### Examples

**Example 1: Standard Square Image**

- Resolution: 1024×1024
- Quality: Standard
- Total: **20 credits**

**Example 2: HD Portrait Image**

- Resolution: 1024×1792
- Quality: HD
- Total: **60 credits**

**Example 3: Batch Generation**

- 5 images at 512×512
- Total: 5 × 15 = **75 credits**

### Speech Synthesis (Text-to-Speech)

Credits for speech synthesis are based on character count:

```
Credits = (Character Count / 1000) × 0.5
```

#### Speech Synthesis Rates

| Characters | Credits |
| ---------- | ------- |
| 1,000      | 0.5     |
| 5,000      | 2.5     |
| 10,000     | 5.0     |
| 50,000     | 25.0    |

#### Examples

**Example 1: Short Announcement**

- Text: "Welcome to our platform!" (26 characters)
- Calculation: (26 / 1000) × 0.5
- Total: **0.013 credits**

**Example 2: Article Narration**

- Text: 3,500 characters
- Calculation: (3500 / 1000) × 0.5
- Total: **1.75 credits**

**Example 3: Book Chapter**

- Text: 15,000 characters
- Calculation: (15000 / 1000) × 0.5
- Total: **7.5 credits**

### Audio Transcription

Credits for transcription are based on audio duration:

```
Credits = Duration (minutes) × 0.6
```

#### Transcription Rates

| Duration   | Credits |
| ---------- | ------- |
| 1 minute   | 0.6     |
| 5 minutes  | 3.0     |
| 10 minutes | 6.0     |
| 30 minutes | 18.0    |
| 60 minutes | 36.0    |

#### Examples

**Example 1: Short Voice Note**

- Duration: 2 minutes
- Calculation: 2 × 0.6
- Total: **1.2 credits**

**Example 2: Podcast Episode**

- Duration: 45 minutes
- Calculation: 45 × 0.6
- Total: **27 credits**

**Example 3: Meeting Recording**

- Duration: 90 minutes
- Calculation: 90 × 0.6
- Total: **54 credits**

## Credit Deduction Flow

### 1. Pre-Validation

Before any AI operation, the system validates:

```typescript
async function validateCredits(
  workspaceId: string,
  estimatedCost: number
): Promise<boolean> {
  const workspace = await getWorkspace(workspaceId);

  if (workspace.creditCount < estimatedCost) {
    throw new InsufficientCreditsError(
      `Insufficient credits. Required: ${estimatedCost}, Available: ${workspace.creditCount}`
    );
  }

  return true;
}
```

### 2. Generation

The AI operation is executed with the provider.

### 3. Actual Cost Calculation

After generation, calculate the actual cost based on provider response:

```typescript
async function calculateActualCost(
  type: 'text' | 'image' | 'speech' | 'transcription',
  usage: any
): Promise<number> {
  switch (type) {
    case 'text':
      return calculateTextCost(
        usage.inputTokens,
        usage.outputTokens,
        usage.model
      );
    case 'image':
      return calculateImageCost(usage.resolution, usage.quality);
    case 'speech':
      return calculateSpeechCost(usage.characterCount);
    case 'transcription':
      return calculateTranscriptionCost(usage.durationMinutes);
  }
}
```

### 4. Atomic Deduction

Credits are deducted atomically using database transactions:

```typescript
async function deductCredits(
  workspaceId: string,
  amount: number,
  generationId: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Deduct credits
    await tx.workspace.update({
      where: { id: workspaceId },
      data: {
        creditCount: {
          decrement: amount,
        },
      },
    });

    // Record usage
    await tx.creditUsage.create({
      data: {
        workspaceId,
        generationId,
        amount,
        timestamp: new Date(),
      },
    });
  });
}
```

### 5. Logging

All credit transactions are logged for auditing:

```typescript
interface CreditLog {
  id: string;
  workspaceId: string;
  userId: string;
  type: 'deduction' | 'refund' | 'purchase';
  amount: number;
  balance: number;
  generationId?: string;
  reason?: string;
  timestamp: Date;
}
```

## Credit Refund Policy

### Automatic Refunds

Credits are automatically refunded in these scenarios:

1. **Provider Error**: API returns 5xx error
2. **Timeout**: Request exceeds timeout limit
3. **Generation Failure**: Generation fails before completion
4. **Invalid Response**: Provider returns invalid or empty response

### Partial Refunds

For streaming operations that are cancelled:

```typescript
async function handleStreamCancellation(
  workspaceId: string,
  generationId: string,
  tokensGenerated: number,
  tokensRequested: number
): Promise<void> {
  const fullCost = calculateCost(tokensRequested);
  const actualCost = calculateCost(tokensGenerated);
  const refundAmount = fullCost - actualCost;

  if (refundAmount > 0) {
    await refundCredits(workspaceId, refundAmount, generationId);
  }
}
```

### Refund Process

```typescript
async function refundCredits(
  workspaceId: string,
  amount: number,
  generationId: string,
  reason: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Add credits back
    await tx.workspace.update({
      where: { id: workspaceId },
      data: {
        creditCount: {
          increment: amount,
        },
      },
    });

    // Log refund
    await tx.creditLog.create({
      data: {
        workspaceId,
        type: 'refund',
        amount,
        generationId,
        reason,
        timestamp: new Date(),
      },
    });
  });
}
```

## Credit Purchase and Management

### Adding Credits

Credits can be added to workspaces through:

1. **Direct Purchase**: Buy credit packages
2. **Subscription**: Monthly credit allocation
3. **Promotional**: Bonus credits from campaigns
4. **Admin Grant**: Manual credit addition by administrators

### Credit Packages

| Package      | Credits | Price  | Cost per Credit |
| ------------ | ------- | ------ | --------------- |
| Starter      | 1,000   | $10    | $0.01           |
| Professional | 10,000  | $80    | $0.008          |
| Business     | 50,000  | $350   | $0.007          |
| Enterprise   | 200,000 | $1,200 | $0.006          |

### Credit Expiration

- **Purchased Credits**: Never expire
- **Promotional Credits**: Expire after 90 days
- **Subscription Credits**: Expire at end of billing period (no rollover)

## Usage Tracking and Analytics

### Viewing Credit Usage

Users can view credit usage through the dashboard:

```typescript
// Get credit usage summary
GET /api/workspaces/:id/credits/usage

// Response
{
  "data": {
    "currentBalance": 5000,
    "usageThisMonth": 2500,
    "breakdown": {
      "text": 1200,
      "image": 800,
      "speech": 300,
      "transcription": 200
    },
    "topModels": [
      { "model": "gpt-4", "credits": 800 },
      { "model": "dall-e-3", "credits": 600 }
    ]
  }
}
```

### Usage Alerts

Configure alerts for credit thresholds:

```typescript
interface CreditAlert {
  workspaceId: string;
  threshold: number;
  enabled: boolean;
  notifyEmail: boolean;
  notifyInApp: boolean;
}

// Example: Alert when credits drop below 1000
{
  "threshold": 1000,
  "enabled": true,
  "notifyEmail": true,
  "notifyInApp": true
}
```

## Best Practices

### 1. Monitor Credit Balance

```typescript
// Check balance before expensive operations
async function checkBalance(workspaceId: string, estimatedCost: number) {
  const workspace = await getWorkspace(workspaceId);

  if (workspace.creditCount < estimatedCost * 2) {
    console.warn('Low credit balance. Consider adding more credits.');
  }
}
```

### 2. Estimate Costs

```typescript
// Provide cost estimates to users
function estimateCost(operation: string, params: any): number {
  switch (operation) {
    case 'text':
      return estimateTextCost(params.prompt, params.maxTokens, params.model);
    case 'image':
      return estimateImageCost(params.resolution, params.quality);
    case 'speech':
      return estimateSpeechCost(params.text);
    case 'transcription':
      return estimateTranscriptionCost(params.duration);
  }
}
```

### 3. Use Cost-Effective Models

Choose models based on requirements:

- **Simple tasks**: GPT-3.5 Turbo, Claude Haiku
- **Complex reasoning**: GPT-4, Claude Opus
- **Long context**: GPT-4 Turbo, Claude Sonnet
- **Budget-conscious**: Gemini Pro, Mistral Small

### 4. Optimize Token Usage

```typescript
// Reduce token usage
function optimizePrompt(prompt: string): string {
  return prompt
    .trim()
    .replace(/\s+/g, ' ') // Remove extra whitespace
    .substring(0, 4000); // Limit length
}

// Use appropriate maxTokens
const maxTokens = taskType === 'summary' ? 200 : 1000;
```

### 5. Implement Caching

```typescript
// Cache responses for repeated queries
const cache = new Map<string, any>();

async function generateWithCache(prompt: string, model: string) {
  const cacheKey = `${model}:${prompt}`;

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const result = await generate(prompt, model);
  cache.set(cacheKey, result);

  return result;
}
```

## Troubleshooting

### Issue: Credits Deducted but Generation Failed

**Solution**: Credits should be automatically refunded. If not:

1. Check credit logs: `GET /api/workspaces/:id/credits/logs`
2. Contact support with generation ID
3. Manual refund will be processed

### Issue: Unexpected High Credit Usage

**Solution**:

1. Review usage logs to identify expensive operations
2. Check for unintended loops or repeated calls
3. Optimize prompts and reduce maxTokens
4. Consider using cheaper models for non-critical tasks

### Issue: Credit Balance Not Updating

**Solution**:

1. Refresh the page
2. Check for pending transactions
3. Verify database connection
4. Contact support if issue persists

---

**Last Updated**: November 2024

**Version**: 1.0.0
