/**
 * Anthropic Provider Usage Examples
 *
 * This file demonstrates how to use the Anthropic text generation service.
 */

import { AnthropicTextGenerationService } from '../providers/anthropic-text-generation';

/**
 * Example 1: Basic text completion
 */
export async function basicCompletion() {
  const service = new AnthropicTextGenerationService(
    'claude-3-5-sonnet-20241022'
  );

  const response = await service.generateCompletion(
    'Write a haiku about programming',
    {
      temperature: 0.7,
      maxTokens: 100,
    }
  );

  console.log('Generated text:', response.content);
  console.log('Tokens used:', response.metadata.tokens?.total);
  console.log('Credits:', response.metadata.credits);
}

/**
 * Example 2: Chat completion with system message
 */
export async function chatWithSystem() {
  const service = new AnthropicTextGenerationService(
    'claude-3-5-sonnet-20241022'
  );

  const response = await service.generateChatCompletion([
    { role: 'system', content: 'You are a helpful coding assistant.' },
    { role: 'user', content: 'Explain what TypeScript is in one sentence.' },
  ]);

  console.log('Assistant:', response.content);
}

/**
 * Example 3: Multi-turn conversation
 */
export async function multiTurnChat() {
  const service = new AnthropicTextGenerationService(
    'claude-3-5-sonnet-20241022'
  );

  const response = await service.generateChatCompletion([
    { role: 'user', content: 'What is 2+2?' },
    { role: 'assistant', content: '2+2 equals 4.' },
    { role: 'user', content: 'What about 3+3?' },
  ]);

  console.log('Assistant:', response.content);
}

/**
 * Example 4: Streaming completion
 */
export async function streamingCompletion() {
  const service = new AnthropicTextGenerationService(
    'claude-3-5-sonnet-20241022'
  );

  console.log('Streaming response:');

  for await (const chunk of service.streamCompletion(
    'Tell me a short story about a robot',
    { maxTokens: 200 }
  )) {
    if (chunk.content) {
      process.stdout.write(chunk.content);
    }

    if (chunk.isComplete && chunk.metadata) {
      console.log('\n\nStream complete!');
      console.log('Total tokens:', chunk.metadata.tokens?.total);
      console.log('Credits:', chunk.metadata.credits);
    }
  }
}

/**
 * Example 5: Streaming chat with real-time display
 */
export async function streamingChat() {
  const service = new AnthropicTextGenerationService(
    'claude-3-5-sonnet-20241022'
  );

  const messages = [
    { role: 'system' as const, content: 'You are a creative writer.' },
    {
      role: 'user' as const,
      content: 'Write the opening line of a mystery novel.',
    },
  ];

  let fullResponse = '';

  for await (const chunk of service.streamChatCompletion(messages)) {
    if (chunk.content) {
      fullResponse += chunk.content;
      process.stdout.write(chunk.content);
    }

    if (chunk.isComplete) {
      console.log('\n\nFull response:', fullResponse);
    }
  }
}

/**
 * Example 6: Error handling with retries
 */
export async function errorHandling() {
  const service = new AnthropicTextGenerationService(
    'claude-3-5-sonnet-20241022',
    3
  );

  try {
    const response = await service.generateCompletion('Hello, world!');
    console.log('Success:', response.content);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Failed after retries:', error.message);
    }
  }
}

/**
 * Example 7: Using different Claude models
 */
export async function differentModels() {
  // Most capable model
  const sonnet = new AnthropicTextGenerationService(
    'claude-3-5-sonnet-20241022'
  );

  // Most intelligent model
  const opus = new AnthropicTextGenerationService('claude-3-opus-20240229');

  // Fastest model
  const haiku = new AnthropicTextGenerationService('claude-3-haiku-20240307');

  const prompt = 'What is the capital of France?';

  const [sonnetResponse, opusResponse, haikuResponse] = await Promise.all([
    sonnet.generateCompletion(prompt, { maxTokens: 50 }),
    opus.generateCompletion(prompt, { maxTokens: 50 }),
    haiku.generateCompletion(prompt, { maxTokens: 50 }),
  ]);

  console.log('Sonnet:', sonnetResponse.content);
  console.log('Opus:', opusResponse.content);
  console.log('Haiku:', haikuResponse.content);
}

/**
 * Example 8: Temperature and creativity control
 */
export async function temperatureControl() {
  const service = new AnthropicTextGenerationService(
    'claude-3-5-sonnet-20241022'
  );

  const prompt = 'Complete this sentence: The future of AI is';

  // Low temperature (more focused, deterministic)
  const focused = await service.generateCompletion(prompt, {
    temperature: 0.2,
    maxTokens: 50,
  });

  // High temperature (more creative, random)
  const creative = await service.generateCompletion(prompt, {
    temperature: 1.5,
    maxTokens: 50,
  });

  console.log('Focused (temp=0.2):', focused.content);
  console.log('Creative (temp=1.5):', creative.content);
}

// Run examples (uncomment to test)
// basicCompletion();
// chatWithSystem();
// multiTurnChat();
// streamingCompletion();
// streamingChat();
// errorHandling();
// differentModels();
// temperatureControl();
