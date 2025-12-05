# AI Provider Services

This directory contains implementations of AI service providers for text generation, image generation, speech synthesis, and transcription.

## Available Providers

### OpenAI

- **Text Generation**: `OpenAITextGenerationService` - GPT-4, GPT-3.5, etc.
- **Image Generation**: `OpenAIImageGenerationService` - DALL-E 2, DALL-E 3
- **Speech Synthesis**: `OpenAISpeechSynthesisService` - TTS-1, TTS-1-HD
- **Transcription**: `OpenAITranscriptionService` - Whisper

### Anthropic

- **Text Generation**: `AnthropicTextGenerationService` - Claude 3.5 Sonnet, Claude 3 Opus, etc.

### Google

- **Text Generation**: `GoogleTextGenerationService` - Gemini 1.5 Flash, Gemini 1.5 Pro
- **Image Generation**: `GoogleImageGenerationService` - Placeholder for Imagen (requires Vertex AI)

### Mistral

- **Text Generation**: `MistralTextGenerationService` - Mistral Small, Medium, Large

## Usage Examples

### Text Generation

```typescript
import { OpenAITextGenerationService } from '@/lib/ai/providers';

const service = new OpenAITextGenerationService('gpt-4o-mini');

// Simple completion
const response = await service.generateCompletion('Write a haiku about coding');
console.log(response.content);

// Chat completion
const chatResponse = await service.generateChatCompletion([
  { role: 'user', content: 'Hello!' },
  { role: 'assistant', content: 'Hi! How can I help you?' },
  { role: 'user', content: 'Tell me a joke' },
]);

// Streaming
for await (const chunk of service.streamCompletion('Write a story')) {
  if (!chunk.isComplete) {
    process.stdout.write(chunk.content);
  }
}
```

### Google Text Generation

```typescript
import { GoogleTextGenerationService } from '@/lib/ai/providers';

const service = new GoogleTextGenerationService('gemini-1.5-flash');

// Simple completion
const response = await service.generateCompletion('Explain quantum computing');
console.log(response.content);

// Chat with streaming
for await (const chunk of service.streamChatCompletion([
  { role: 'user', content: 'What is AI?' },
])) {
  if (!chunk.isComplete) {
    process.stdout.write(chunk.content);
  }
}
```

### Mistral Text Generation

```typescript
import { MistralTextGenerationService } from '@/lib/ai/providers';

const service = new MistralTextGenerationService('mistral-small-latest');

// Simple completion
const response = await service.generateCompletion(
  'Write a poem about technology'
);
console.log(response.content);

// Chat with streaming
for await (const chunk of service.streamChatCompletion([
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'What is machine learning?' },
])) {
  if (!chunk.isComplete) {
    process.stdout.write(chunk.content);
  }
}
```

### Image Generation

```typescript
import { OpenAIImageGenerationService } from '@/lib/ai/providers';

const service = new OpenAIImageGenerationService('dall-e-3');

const image = await service.generateImage('A serene mountain landscape', {
  size: '1024x1024',
  quality: 'hd',
  style: 'natural',
});

console.log(image.url);
```

## Configuration

All services require appropriate API keys to be configured in environment variables:

- `OPENAI_API_KEY` - For OpenAI services
- `ANTHROPIC_API_KEY` - For Anthropic services
- `GOOGLE_AI_API_KEY` - For Google AI services
- `MISTRAL_API_KEY` - For Mistral services

## Error Handling

All services implement:

- **Retry logic** with exponential backoff (3 retries by default)
- **Error transformation** to provide consistent error messages
- **Retryable error detection** for rate limits, timeouts, and server errors

## Features

### Common Features

- Type-safe interfaces
- Streaming support for text generation
- Token counting and credit calculation
- Comprehensive error handling
- Configurable retry logic

### Provider-Specific Features

#### OpenAI

- Multiple model support (GPT-4, GPT-3.5, DALL-E, Whisper)
- Advanced parameters (temperature, top_p, frequency_penalty, etc.)
- Multiple image sizes and quality settings
- Voice selection for TTS
- Language detection for transcription

#### Anthropic

- Claude 3.5 Sonnet and other Claude models
- System message support
- Streaming with detailed token usage

#### Google

- Gemini 1.5 models (Flash, Pro)
- Safety settings configuration
- Streaming support
- Note: Image generation requires Google Cloud Vertex AI setup

#### Mistral

- Mistral Small, Medium, and Large models
- Streaming support with real-time token usage
- System message support
- Advanced parameters (temperature, top_p, stop sequences)

## Testing

Each provider has comprehensive unit tests:

- `openai-providers.test.ts`
- `anthropic-providers.test.ts`
- `google-providers.test.ts`
- `mistral-providers.test.ts`

Run tests with:

```bash
npm test
```

## Notes

### Google Image Generation

The Google image generation service is currently a placeholder. Google's `@google/generative-ai` SDK doesn't support image generation directly. To use Google's Imagen for image generation, you need to:

1. Set up Google Cloud Vertex AI
2. Use the Vertex AI API directly
3. Or use another provider like OpenAI for image generation

The service is structured to make future integration easier when Google adds image generation support to their SDK or when Vertex AI integration is implemented.

## Future Enhancements

- [x] Mistral provider implementation
- [ ] Google Vertex AI integration for image generation
- [ ] Batch processing support
- [ ] Advanced caching strategies
- [ ] Provider fallback mechanisms
- [ ] Cost optimization features
