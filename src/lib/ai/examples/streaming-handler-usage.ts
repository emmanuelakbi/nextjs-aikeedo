/**
 * Streaming Handler Usage Examples
 *
 * Demonstrates how to use the streaming handler for various scenarios.
 */

import {
  StreamingHandler,
  aggregateStream,
  toReadableStream,
  parseSSEStream,
  type StreamProgress,
  type StreamResult,
  type StreamError,
} from '../streaming-handler';
import { OpenAITextGenerationService } from '../providers/openai-text-generation';
import type { TextStreamChunk } from '../types';

/**
 * Example 1: Basic streaming with progress tracking
 */
export async function basicStreamingExample() {
  const service = new OpenAITextGenerationService('gpt-4o-mini');

  const handler = new StreamingHandler({
    onChunk: (chunk) => {
      console.log('Received chunk:', chunk);
    },
    onProgress: (progress: StreamProgress) => {
      console.log(
        `Progress: ${progress.chunksReceived} chunks, ${progress.estimatedTokens} tokens`
      );
    },
    onComplete: (result: StreamResult) => {
      console.log('Stream completed:', result.content);
      console.log('Total time:', result.totalTime, 'ms');
    },
    onError: (error: StreamError) => {
      console.error('Stream error:', error.message);
      if (error.partialContent) {
        console.log('Partial content:', error.partialContent);
      }
    },
  });

  const stream = service.streamCompletion('Tell me a short story');
  const result = await handler.processStream(stream);

  return result.content;
}

/**
 * Example 2: Streaming with cancellation
 */
export async function streamingWithCancellationExample() {
  const service = new OpenAITextGenerationService('gpt-4o-mini');
  const handler = new StreamingHandler({
    onChunk: (chunk) => {
      console.log('Chunk:', chunk);
    },
  });

  const stream = service.streamCompletion('Write a long essay about AI');

  // Cancel after 5 seconds
  setTimeout(() => {
    console.log('Cancelling stream...');
    handler.cancel();
  }, 5000);

  try {
    const result = await handler.processStream(stream);
    console.log('Completed:', result.content);
  } catch (error) {
    console.log('Stream was cancelled');
    console.log('Partial content:', handler.getAggregatedContent());
  }
}

/**
 * Example 3: Simple aggregation without callbacks
 */
export async function simpleAggregationExample() {
  const service = new OpenAITextGenerationService('gpt-4o-mini');
  const stream = service.streamCompletion('What is TypeScript?');

  // Simple aggregation - just get the final content
  const content = await aggregateStream(stream);
  console.log('Final content:', content);

  return content;
}

/**
 * Example 4: Chat streaming with context
 */
export async function chatStreamingExample() {
  const service = new OpenAITextGenerationService('gpt-4o-mini');

  const messages = [
    { role: 'system' as const, content: 'You are a helpful assistant.' },
    { role: 'user' as const, content: 'What is the capital of France?' },
  ];

  let fullResponse = '';

  const handler = new StreamingHandler({
    onChunk: (chunk) => {
      fullResponse += chunk;
      // Update UI in real-time
      console.log('Current response:', fullResponse);
    },
    onComplete: (result) => {
      console.log('Chat completed:', result.metadata);
    },
  });

  const stream = service.streamChatCompletion(messages);
  const result = await handler.processStream(stream);

  return result;
}

/**
 * Example 5: HTTP streaming response (for API routes)
 */
export async function httpStreamingExample(prompt: string): Promise<Response> {
  const service = new OpenAITextGenerationService('gpt-4o-mini');
  const stream = service.streamCompletion(prompt);

  // Convert to ReadableStream for HTTP response
  const readableStream = toReadableStream(stream);

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

/**
 * Example 6: Client-side SSE parsing
 */
export async function clientSideSSEExample(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  let fullContent = '';

  for await (const chunk of parseSSEStream(response)) {
    fullContent += chunk.content;
    console.log('Received:', chunk.content);

    if (chunk.isComplete) {
      console.log('Stream complete!');
      console.log('Metadata:', chunk.metadata);
      break;
    }
  }

  return fullContent;
}

/**
 * Example 7: Error handling and retry
 */
export async function errorHandlingExample() {
  const service = new OpenAITextGenerationService('gpt-4o-mini');

  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const handler = new StreamingHandler({
        timeout: 30000, // 30 second timeout
        onError: (error) => {
          console.error(`Attempt ${attempt + 1} failed:`, error.message);
        },
      });

      const stream = service.streamCompletion('Generate a poem');
      const result = await handler.processStream(stream);

      console.log('Success on attempt', attempt + 1);
      return result.content;
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) {
        throw new Error('Max retries exceeded');
      }

      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

/**
 * Example 8: Progress tracking with UI updates
 */
export async function progressTrackingExample(
  onProgressUpdate: (progress: number) => void
) {
  const service = new OpenAITextGenerationService('gpt-4o-mini');

  const handler = new StreamingHandler({
    onProgress: (progress) => {
      // Calculate progress percentage (rough estimate)
      const estimatedTotal = 1000; // Estimated total tokens
      const percentage = Math.min(
        (progress.estimatedTokens / estimatedTotal) * 100,
        99
      );
      onProgressUpdate(percentage);
    },
    onComplete: () => {
      onProgressUpdate(100);
    },
  });

  const stream = service.streamCompletion(
    'Write a detailed explanation of quantum computing'
  );
  const result = await handler.processStream(stream);

  return result;
}

/**
 * Example 9: Multiple concurrent streams
 */
export async function concurrentStreamsExample() {
  const service = new OpenAITextGenerationService('gpt-4o-mini');

  const prompts = ['What is JavaScript?', 'What is Python?', 'What is Rust?'];

  const results = await Promise.all(
    prompts.map(async (prompt) => {
      const handler = new StreamingHandler({
        onChunk: (chunk) => {
          console.log(`[${prompt.slice(0, 20)}...]: ${chunk}`);
        },
      });

      const stream = service.streamCompletion(prompt);
      return handler.processStream(stream);
    })
  );

  return results.map((r) => r.content);
}

/**
 * Example 10: Custom chunk processing
 */
export async function customChunkProcessingExample() {
  const service = new OpenAITextGenerationService('gpt-4o-mini');

  // Custom processing: extract code blocks
  const codeBlocks: string[] = [];
  let currentBlock = '';
  let inCodeBlock = false;

  const handler = new StreamingHandler({
    onChunk: (chunk) => {
      currentBlock += chunk;

      // Detect code block markers
      if (chunk.includes('```')) {
        if (inCodeBlock) {
          // End of code block
          codeBlocks.push(currentBlock);
          currentBlock = '';
        }
        inCodeBlock = !inCodeBlock;
      }
    },
  });

  const stream = service.streamCompletion(
    'Write a TypeScript function to calculate fibonacci numbers'
  );

  await handler.processStream(stream);

  console.log('Extracted code blocks:', codeBlocks);
  return codeBlocks;
}
