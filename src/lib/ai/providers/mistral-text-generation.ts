/**
 * Mistral Text Generation Service
 *
 * Implements text completion and chat capabilities using Mistral AI's API.
 * Supports both streaming and non-streaming responses with retry logic.
 */

import { Mistral } from '@mistralai/mistralai';
import type {
  TextGenerationService,
  TextGenerationOptions,
  ChatMessage,
} from '../interfaces/text-generation-service';
import type {
  TextGenerationResponse,
  TextStreamChunk,
  ResponseMetadata,
} from '../types';
import { getEnv } from '@/lib/env';

export class MistralTextGenerationService implements TextGenerationService {
  private client: Mistral;
  private model: string;
  private maxRetries: number;
  private retryDelay: number;

  constructor(model: string = 'mistral-small-latest', maxRetries: number = 3) {
    const env = getEnv();

    if (!env.MISTRAL_API_KEY) {
      throw new Error('MISTRAL_API_KEY is not configured');
    }

    this.client = new Mistral({
      apiKey: env.MISTRAL_API_KEY,
    });
    this.model = model;
    this.maxRetries = maxRetries;
    this.retryDelay = 1000; // Start with 1 second
  }

  async generateCompletion(
    prompt: string,
    options?: TextGenerationOptions
  ): Promise<TextGenerationResponse> {
    return this.executeWithRetry(async () => {
      const response = await this.client.chat.complete({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        maxTokens: options?.maxTokens,
        temperature: options?.temperature,
        topP: options?.topP,
        stop: options?.stopSequences,
      });

      const choice = response.choices?.[0];
      if (!choice?.message?.content) {
        throw new Error('No content in Mistral response');
      }

      const metadata: ResponseMetadata = {
        model: response.model || this.model,
        provider: 'mistral',
        tokens: {
          input: response.usage?.promptTokens || 0,
          output: response.usage?.completionTokens || 0,
          total: response.usage?.totalTokens || 0,
        },
        credits: this.calculateCredits(response.usage?.totalTokens || 0),
        finishReason: choice.finishReason || undefined,
      };

      return {
        content: choice.message.content,
        metadata,
      };
    });
  }

  async generateChatCompletion(
    messages: ChatMessage[],
    options?: TextGenerationOptions
  ): Promise<TextGenerationResponse> {
    return this.executeWithRetry(async () => {
      const response = await this.client.chat.complete({
        model: this.model,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        maxTokens: options?.maxTokens,
        temperature: options?.temperature,
        topP: options?.topP,
        stop: options?.stopSequences,
      });

      const choice = response.choices?.[0];
      if (!choice?.message?.content) {
        throw new Error('No content in Mistral response');
      }

      const metadata: ResponseMetadata = {
        model: response.model || this.model,
        provider: 'mistral',
        tokens: {
          input: response.usage?.promptTokens || 0,
          output: response.usage?.completionTokens || 0,
          total: response.usage?.totalTokens || 0,
        },
        credits: this.calculateCredits(response.usage?.totalTokens || 0),
        finishReason: choice.finishReason || undefined,
      };

      return {
        content: choice.message.content,
        metadata,
      };
    });
  }

  async *streamCompletion(
    prompt: string,
    options?: TextGenerationOptions
  ): AsyncIterable<TextStreamChunk> {
    const stream = await this.client.chat.stream({
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      maxTokens: options?.maxTokens,
      temperature: options?.temperature,
      topP: options?.topP,
      stop: options?.stopSequences,
    });

    let totalContent = '';
    let inputTokens = 0;
    let outputTokens = 0;
    let totalTokens = 0;

    try {
      for await (const chunk of stream) {
        const delta = chunk.data.choices?.[0]?.delta;
        const content = delta?.content || '';

        if (content) {
          totalContent += content;
        }

        // Update token counts if available
        if (chunk.data.usage) {
          inputTokens = chunk.data.usage.promptTokens || 0;
          outputTokens = chunk.data.usage.completionTokens || 0;
          totalTokens = chunk.data.usage.totalTokens || 0;
        }

        const isComplete =
          chunk.data.choices?.[0]?.finishReason !== null &&
          chunk.data.choices?.[0]?.finishReason !== undefined;

        yield {
          content,
          isComplete,
          metadata: isComplete
            ? {
                model: chunk.data.model || this.model,
                provider: 'mistral',
                tokens: {
                  input: inputTokens,
                  output: outputTokens,
                  total: totalTokens,
                },
                credits: this.calculateCredits(totalTokens),
                finishReason:
                  chunk.data.choices?.[0]?.finishReason || undefined,
              }
            : undefined,
        };

        if (isComplete) {
          break;
        }
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async *streamChatCompletion(
    messages: ChatMessage[],
    options?: TextGenerationOptions
  ): AsyncIterable<TextStreamChunk> {
    const stream = await this.client.chat.stream({
      model: this.model,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      maxTokens: options?.maxTokens,
      temperature: options?.temperature,
      topP: options?.topP,
      stop: options?.stopSequences,
    });

    let totalContent = '';
    let inputTokens = 0;
    let outputTokens = 0;
    let totalTokens = 0;

    try {
      for await (const chunk of stream) {
        const delta = chunk.data.choices?.[0]?.delta;
        const content = delta?.content || '';

        if (content) {
          totalContent += content;
        }

        // Update token counts if available
        if (chunk.data.usage) {
          inputTokens = chunk.data.usage.promptTokens || 0;
          outputTokens = chunk.data.usage.completionTokens || 0;
          totalTokens = chunk.data.usage.totalTokens || 0;
        }

        const isComplete =
          chunk.data.choices?.[0]?.finishReason !== null &&
          chunk.data.choices?.[0]?.finishReason !== undefined;

        yield {
          content,
          isComplete,
          metadata: isComplete
            ? {
                model: chunk.data.model || this.model,
                provider: 'mistral',
                tokens: {
                  input: inputTokens,
                  output: outputTokens,
                  total: totalTokens,
                },
                credits: this.calculateCredits(totalTokens),
                finishReason:
                  chunk.data.choices?.[0]?.finishReason || undefined,
              }
            : undefined,
        };

        if (isComplete) {
          break;
        }
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  getModel(): string {
    return this.model;
  }

  getProvider(): string {
    return 'mistral';
  }

  /**
   * Execute a function with exponential backoff retry logic
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    attempt: number = 1
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= this.maxRetries) {
        throw this.handleError(error);
      }

      // Check if error is retryable
      if (!this.isRetryableError(error)) {
        throw this.handleError(error);
      }

      // Exponential backoff: 1s, 2s, 4s, etc.
      const delay = this.retryDelay * Math.pow(2, attempt - 1);
      await this.sleep(delay);

      return this.executeWithRetry(fn, attempt + 1);
    }
  }

  /**
   * Determine if an error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    // Check for common HTTP error status codes
    if (error && typeof error === 'object' && 'status' in error) {
      const status = (error as { status: number }).status;
      // Retry on rate limits, timeouts, and server errors
      return (
        status === 429 || // Rate limit
        status === 408 || // Timeout
        status === 503 || // Service unavailable
        status === 500 // Internal server error
      );
    }

    // Check for network errors
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('timeout') ||
        message.includes('network') ||
        message.includes('econnreset') ||
        message.includes('econnrefused')
      );
    }

    return false;
  }

  /**
   * Handle and transform errors
   */
  private handleError(error: unknown): Error {
    if (error && typeof error === 'object') {
      if ('status' in error && 'message' in error) {
        const status = (error as { status: number }).status;
        const message = (error as { message: string }).message;
        return new Error(`Mistral API Error (${status}): ${message}`);
      }
    }

    if (error instanceof Error) {
      return error;
    }

    return new Error('Unknown error occurred');
  }

  /**
   * Calculate credits based on token count
   * This is a simplified calculation - adjust based on your pricing model
   */
  private calculateCredits(tokens: number): number {
    // Example: 1 credit per 1000 tokens
    return Math.ceil(tokens / 1000);
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
