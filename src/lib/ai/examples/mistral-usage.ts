/**
 * Mistral Provider Usage Examples
 *
 * This file demonstrates how to use the Mistral text generation service.
 */

import { MistralTextGenerationService } from '../providers/mistral-text-generation';

/**
 * Example 1: Basic text completion
 */
export async function basicCompletion() {
  const service = new MistralTextGenerationService('mistral-small-latest');

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
 * Example 2: Chat completion with conversation history
 */
export async function chatCompletion() {
  const service = new MistralTextGenerationService('mistral-small-latest');

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
  const service = new MistralTextGenerationService('mistral-small-latest');

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
  const service = new MistralTextGenerationService('mistral-small-latest');

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
  const service = new MistralTextGenerationService('mistral-small-latest');

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
  const service = new MistralTextGenerationService('mistral-small-latest', 3);

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
 * Example 7: Using different Mistral models
 */
export async function differentModels() {
  // Small model (fast and efficient)
  const small = new MistralTextGenerationService('mistral-small-latest');

  // Medium model (balanced)
  const medium = new MistralTextGenerationService('mistral-medium-latest');

  // Large model (most capable)
  const large = new MistralTextGenerationService('mistral-large-latest');

  const prompt = 'What is the capital of France?';

  const [smallResponse, mediumResponse, largeResponse] = await Promise.all([
    small.generateCompletion(prompt, { maxTokens: 50 }),
    medium.generateCompletion(prompt, { maxTokens: 50 }),
    large.generateCompletion(prompt, { maxTokens: 50 }),
  ]);

  console.log('Small:', smallResponse.content);
  console.log('Medium:', mediumResponse.content);
  console.log('Large:', largeResponse.content);
}

/**
 * Example 8: Temperature and creativity control
 */
export async function temperatureControl() {
  const service = new MistralTextGenerationService('mistral-small-latest');

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

/**
 * Example 9: Using stop sequences
 */
export async function stopSequences() {
  const service = new MistralTextGenerationService('mistral-small-latest');

  const response = await service.generateCompletion(
    'List three programming languages:\n1.',
    {
      maxTokens: 100,
      stopSequences: ['\n4.'], // Stop after listing 3 items
    }
  );

  console.log('Response:', response.content);
}

/**
 * Example 10: Top-p (nucleus) sampling
 */
export async function topPSampling() {
  const service = new MistralTextGenerationService('mistral-small-latest');

  const prompt = 'Write a creative opening for a sci-fi story';

  // Low top-p (more focused on likely tokens)
  const focused = await service.generateCompletion(prompt, {
    topP: 0.5,
    maxTokens: 100,
  });

  // High top-p (more diverse token selection)
  const diverse = await service.generateCompletion(prompt, {
    topP: 0.95,
    maxTokens: 100,
  });

  console.log('Focused (top-p=0.5):', focused.content);
  console.log('Diverse (top-p=0.95):', diverse.content);
}

// Run examples (uncomment to test)
// basicCompletion();
// chatCompletion();
// multiTurnChat();
// streamingCompletion();
// streamingChat();
// errorHandling();
// differentModels();
// temperatureControl();
// stopSequences();
// topPSampling();
