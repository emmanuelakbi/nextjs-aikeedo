/**
 * Google AI Provider Usage Examples
 *
 * This file demonstrates how to use the Google AI services
 * for text generation with Gemini models.
 */

import { GoogleTextGenerationService } from '../providers';
import type { ChatMessage } from '../interfaces/text-generation-service';

/**
 * Example 1: Simple text completion
 */
export async function simpleCompletion() {
  const service = new GoogleTextGenerationService('gemini-1.5-flash');

  const response = await service.generateCompletion(
    'Explain the concept of machine learning in simple terms.'
  );

  console.log('Response:', response.content);
  console.log('Tokens used:', response.metadata.tokens?.total);
  console.log('Credits:', response.metadata.credits);
}

/**
 * Example 2: Chat conversation
 */
export async function chatConversation() {
  const service = new GoogleTextGenerationService('gemini-1.5-pro');

  const response = await service.generateChatCompletion([
    { role: 'user', content: 'What is quantum computing?' },
    {
      role: 'assistant',
      content:
        'Quantum computing is a type of computing that uses quantum-mechanical phenomena...',
    },
    { role: 'user', content: 'Can you give me a simple analogy?' },
  ]);

  console.log('Assistant:', response.content);
}

/**
 * Example 3: Streaming text generation
 */
export async function streamingCompletion() {
  const service = new GoogleTextGenerationService('gemini-1.5-flash');

  console.log('Streaming response:');

  for await (const chunk of service.streamCompletion(
    'Write a short story about a robot learning to paint.'
  )) {
    if (!chunk.isComplete) {
      process.stdout.write(chunk.content);
    } else {
      console.log('\n\nMetadata:', chunk.metadata);
    }
  }
}

/**
 * Example 4: Streaming chat with system message
 */
export async function streamingChat() {
  const service = new GoogleTextGenerationService('gemini-1.5-flash');

  console.log('Streaming chat:');

  for await (const chunk of service.streamChatCompletion([
    { role: 'system', content: 'You are a helpful coding assistant.' },
    { role: 'user', content: 'How do I implement a binary search in Python?' },
  ])) {
    if (!chunk.isComplete) {
      process.stdout.write(chunk.content);
    } else {
      console.log('\n\nTokens:', chunk.metadata?.tokens);
    }
  }
}

/**
 * Example 5: Using generation options
 */
export async function withOptions() {
  const service = new GoogleTextGenerationService('gemini-1.5-flash');

  const response = await service.generateCompletion(
    'Write a creative product description for a smart water bottle.',
    {
      temperature: 0.9, // Higher temperature for more creativity
      maxTokens: 200, // Limit response length
      topP: 0.95, // Nucleus sampling
      stopSequences: ['\n\n'], // Stop at double newline
    }
  );

  console.log('Creative description:', response.content);
}

/**
 * Example 6: Error handling
 */
export async function withErrorHandling() {
  const service = new GoogleTextGenerationService('gemini-1.5-flash');

  try {
    const response = await service.generateCompletion(
      'Tell me about the latest developments in AI.'
    );
    console.log('Success:', response.content);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error:', error.message);

      // Handle specific error types
      if (error.message.includes('rate limit')) {
        console.log('Rate limit hit, waiting before retry...');
      } else if (error.message.includes('quota')) {
        console.log('Quota exceeded, please check your API limits');
      }
    }
  }
}

/**
 * Example 7: Multi-turn conversation with context
 */
export async function multiTurnConversation() {
  const service = new GoogleTextGenerationService('gemini-1.5-flash');

  const conversation: ChatMessage[] = [
    { role: 'user', content: 'I want to learn about TypeScript.' },
  ];

  // First turn
  let response = await service.generateChatCompletion(conversation);
  console.log('Assistant:', response.content);

  // Add to conversation
  conversation.push({ role: 'assistant', content: response.content });
  conversation.push({
    role: 'user',
    content: 'What are the main benefits?',
  });

  // Second turn
  response = await service.generateChatCompletion(conversation);
  console.log('Assistant:', response.content);

  // Add to conversation
  conversation.push({ role: 'assistant', content: response.content });
  conversation.push({
    role: 'user',
    content: 'Can you show me an example?',
  });

  // Third turn
  response = await service.generateChatCompletion(conversation);
  console.log('Assistant:', response.content);
}

/**
 * Example 8: Comparing different models
 */
export async function compareModels() {
  const prompt = 'Explain recursion in programming.';

  // Fast model
  const flashService = new GoogleTextGenerationService('gemini-1.5-flash');
  const flashResponse = await flashService.generateCompletion(prompt);

  console.log('Gemini 1.5 Flash:');
  console.log('Response:', flashResponse.content);
  console.log('Tokens:', flashResponse.metadata.tokens?.total);
  console.log('Credits:', flashResponse.metadata.credits);

  // Pro model (more capable but slower)
  const proService = new GoogleTextGenerationService('gemini-1.5-pro');
  const proResponse = await proService.generateCompletion(prompt);

  console.log('\nGemini 1.5 Pro:');
  console.log('Response:', proResponse.content);
  console.log('Tokens:', proResponse.metadata.tokens?.total);
  console.log('Credits:', proResponse.metadata.credits);
}

// Run examples (uncomment to test)
// simpleCompletion();
// chatConversation();
// streamingCompletion();
// streamingChat();
// withOptions();
// withErrorHandling();
// multiTurnConversation();
// compareModels();
