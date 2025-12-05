# AI Service Factory

The AI Service Factory provides centralized creation and management of AI service instances with support for multiple providers (OpenAI, Anthropic, Google, Mistral).

## Features

- **Provider Selection**: Automatically route requests to the appropriate AI provider
- **Model Registry**: Comprehensive catalog of available models with metadata
- **Provider Validation**: Verify API keys and provider availability before use
- **Fallback Handling**: Automatic failover to alternative providers
- **Type Safety**: Full TypeScript support with strict typing

## Requirements

This implementation satisfies the following requirements:

- **1.2**: User can select a model and system routes to appropriate provider
- **1.4**: System returns clear error when provider is unavailable
- **8.1**: Display all available models with descriptions
- **8.2**: Show model capabilities and pricing

## Basic Usage

```typescript
import { getAIServiceFactory } from '@/lib/ai';

// Get the default factory instance
const factory = getAIServiceFactory();

// Create a text generation service
const textService = factory.createTextService('openai', 'gpt-4o-mini');

// Generate text
const response = await textService.generateCompletion(
  'Write a haiku about programming',
  { temperature: 0.7, maxTokens: 100 }
);

console.log(response.content);
console.log('Credits used:', response.metadata.credits);
```

## Model Registry

### Querying Available Models

```typescript
// Get all available models
const allModels = factory.getAvailableModels();

// Get models by capability
const textModels = factory.getAvailableModels('text-generation');
const imageModels = factory.getAvailableModels('image-generation');

// Get models by provider
const openaiModels = factory.getModelsByProvider('openai');
const anthropicModels = factory.getModelsByProvider(
  'anthropic',
  'text-generation'
);

// Get specific model info
const modelInfo = factory.getModelInfo('gpt-4o-mini');
console.log(modelInfo?.pricing); // { input: 0.15, output: 0.6 }
```

### Registering Custom Models

```typescript
factory.registerModel({
  id: 'custom-model-v1',
  name: 'Custom Model V1',
  provider: 'openai',
  capabilities: ['text-generation'],
  description: 'Custom fine-tuned model',
  contextWindow: 8192,
  maxOutputTokens: 2048,
  pricing: { input: 1.0, output: 2.0 },
});
```

## Provider Management

### Checking Provider Availability

```typescript
// Check if a provider is available
const isAvailable = factory.isProviderAvailable('openai');

// Check all providers
const providers = ['openai', 'anthropic', 'google', 'mistral'];
for (const provider of providers) {
  console.log(`${provider}: ${factory.isProviderAvailable(provider)}`);
}
```

### Custom Provider Configuration

```typescript
import { AIServiceFactory } from '@/lib/ai';

const factory = new AIServiceFactory({
  providers: [
    { provider: 'anthropic', enabled: true, priority: 1 }, // Prefer Anthropic
    { provider: 'openai', enabled: true, priority: 2 },
    { provider: 'google', enabled: false, priority: 3 }, // Disable Google
    { provider: 'mistral', enabled: true, priority: 4 },
  ],
  enableFallback: true,
  maxRetries: 5,
});
```

### Updating Provider Configuration

```typescript
// Disable a provider at runtime
factory.updateProviderConfig('mistral', {
  provider: 'mistral',
  enabled: false,
  priority: 10,
});
```

## Fallback Handling

The factory can automatically fall back to alternative providers when the primary provider is unavailable:

```typescript
// Enable fallback (enabled by default)
const factory = getAIServiceFactory({ enableFallback: true });

// Try to create a service with automatic fallback
const textService = factory.createTextServiceWithFallback(
  'openai',
  'gpt-4o-mini'
);

// If OpenAI is unavailable, it will try:
// 1. Anthropic (priority 2)
// 2. Google (priority 3)
// 3. Mistral (priority 4)
```

## Service Creation

### Text Generation

```typescript
const textService = factory.createTextService('openai', 'gpt-4o-mini');
const response = await textService.generateCompletion('Hello, world!');
```

### Image Generation

```typescript
const imageService = factory.createImageService('openai', 'dall-e-3');
const image = await imageService.generateImage('A sunset over mountains');
```

### Speech Synthesis

```typescript
const speechService = factory.createSpeechService('openai', 'tts-1');
const audio = await speechService.synthesizeSpeech('Hello, world!');
```

### Transcription

```typescript
const transcriptionService = factory.createTranscriptionService('openai');
const transcript = await transcriptionService.transcribeAudio(audioFile);
```

## Error Handling

The factory provides comprehensive validation:

```typescript
try {
  // Invalid model
  const service = factory.createTextService('openai', 'non-existent-model');
} catch (error) {
  console.error('Model not found:', error);
}

try {
  // Unavailable provider
  const service = factory.createTextService('disabled-provider', 'model');
} catch (error) {
  console.error('Provider not available:', error);
}

try {
  // Wrong capability
  const service = factory.createImageService('anthropic', 'claude-3-5-sonnet');
} catch (error) {
  console.error('Provider does not support this capability:', error);
}
```

## Model Information

Each model in the registry includes:

```typescript
interface ModelInfo {
  id: string; // Model identifier
  name: string; // Display name
  provider: AIProvider; // Provider (openai, anthropic, google, mistral)
  capabilities: ServiceCapability[]; // Supported capabilities
  description?: string; // Model description
  contextWindow?: number; // Maximum context tokens
  maxOutputTokens?: number; // Maximum output tokens
  pricing?: {
    input: number; // Cost per 1M input tokens
    output: number; // Cost per 1M output tokens
  };
  deprecated?: boolean; // Whether model is deprecated
  replacementModel?: string; // Suggested replacement if deprecated
}
```

## Default Models

### OpenAI

- **gpt-4o**: Most capable GPT-4 model with vision
- **gpt-4o-mini**: Affordable and fast GPT-4 model
- **gpt-4-turbo**: High-performance GPT-4 model
- **dall-e-3**: Advanced image generation
- **tts-1**: Text-to-speech
- **whisper-1**: Speech-to-text

### Anthropic

- **claude-3-5-sonnet-20241022**: Most intelligent Claude model
- **claude-3-opus-20240229**: Powerful model for complex tasks
- **claude-3-haiku-20240307**: Fast and affordable

### Google

- **gemini-1.5-pro**: Advanced reasoning with 2M context window
- **gemini-1.5-flash**: Fast and efficient
- **imagen-3**: High-quality image generation

### Mistral

- **mistral-large-latest**: Flagship model for complex tasks
- **mistral-small-latest**: Cost-effective model

## Singleton Pattern

The factory uses a singleton pattern for the default instance:

```typescript
// Get the default instance (creates if doesn't exist)
const factory1 = getAIServiceFactory();
const factory2 = getAIServiceFactory();
console.log(factory1 === factory2); // true

// Reset the singleton (useful for testing)
resetAIServiceFactory();
const factory3 = getAIServiceFactory();
console.log(factory1 === factory3); // false
```

## Testing

The factory includes comprehensive tests covering:

- Model registry operations
- Provider validation
- Service creation
- Fallback handling
- Configuration management

Run tests with:

```bash
npm test -- src/lib/ai/__tests__/factory.test.ts
```

## Architecture

The factory implements the Factory pattern with:

- **Strategy Pattern**: Different providers implement common interfaces
- **Registry Pattern**: Centralized model catalog
- **Chain of Responsibility**: Fallback provider selection
- **Singleton Pattern**: Default factory instance

## Best Practices

1. **Use the default factory**: `getAIServiceFactory()` for most use cases
2. **Enable fallback**: Keep `enableFallback: true` for production reliability
3. **Validate early**: Check provider availability before creating services
4. **Handle errors**: Always wrap service creation in try-catch blocks
5. **Register custom models**: Add your fine-tuned models to the registry
6. **Monitor pricing**: Use model pricing info for cost estimation

## Future Enhancements

Potential improvements:

- Dynamic model discovery from provider APIs
- Cost tracking and budgeting
- Model performance metrics
- A/B testing support
- Custom routing strategies
- Provider health monitoring
