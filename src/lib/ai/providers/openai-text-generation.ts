/**
 * OpenAI Text Generation Service
 *
 * Implements text completion and chat capabilities using OpenAI's API.
 * Supports both streaming and non-streaming responses with retry logic.
 */

import OpenAI from 'openai';
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

export class OpenAITextGenerationService implements TextGenerationService {
  private client: OpenAI;
  private model: string;
  private maxRetries: number;
  private retryDelay: number;

  constructor(model: string = 'gpt-4o-mini', maxRetries: number = 3) {
    const env = getEnv();

    if (!env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    this.client = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
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
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options?.maxTokens,
        temperature: options?.temperature,
        top_p: options?.topP,
        frequency_penalty: options?.frequencyPenalty,
        presence_penalty: options?.presencePenalty,
        stop: options?.stopSequences,
        stream: false,
      });

      const choice = response.choices[0];
      if (!choice?.message.content) {
        throw new Error('No content in OpenAI response');
      }

      const metadata: ResponseMetadata = {
        model: response.model,
        provider: 'openai',
        tokens: {
          input: response.usage?.prompt_tokens || 0,
          output: response.usage?.completion_tokens || 0,
          total: response.usage?.total_tokens || 0,
        },
        credits: this.calculateCredits(response.usage?.total_tokens || 0),
        finishReason: choice.finish_reason || undefined,
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
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        max_tokens: options?.maxTokens,
        temperature: options?.temperature,
        top_p: options?.topP,
        frequency_penalty: options?.frequencyPenalty,
        presence_penalty: options?.presencePenalty,
        stop: options?.stopSequences,
        stream: false,
      });

      const choice = response.choices[0];
      if (!choice?.message.content) {
        throw new Error('No content in OpenAI response');
      }

      const metadata: ResponseMetadata = {
        model: response.model,
        provider: 'openai',
        tokens: {
          input: response.usage?.prompt_tokens || 0,
          output: response.usage?.completion_tokens || 0,
          total: response.usage?.total_tokens || 0,
        },
        credits: this.calculateCredits(response.usage?.total_tokens || 0),
        finishReason: choice.finish_reason || undefined,
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
    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: options?.maxTokens,
      temperature: options?.temperature,
      top_p: options?.topP,
      frequency_penalty: options?.frequencyPenalty,
      presence_penalty: options?.presencePenalty,
      stop: options?.stopSequences,
      stream: true,
    });

    let totalContent = '';
    let tokenCount = 0;

    try {
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        const content = delta?.content || '';

        if (content) {
          totalContent += content;
          tokenCount += this.estimateTokens(content);
        }

        const isComplete = chunk.choices[0]?.finish_reason !== null;

        yield {
          content,
          isComplete,
          metadata: isComplete
            ? {
                model: chunk.model,
                provider: 'openai',
                tokens: {
                  input: tokenCount,
                  output: tokenCount,
                  total: tokenCount,
                },
                credits: this.calculateCredits(tokenCount),
                finishReason: chunk.choices[0]?.finish_reason || undefined,
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
    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      max_tokens: options?.maxTokens,
      temperature: options?.temperature,
      top_p: options?.topP,
      frequency_penalty: options?.frequencyPenalty,
      presence_penalty: options?.presencePenalty,
      stop: options?.stopSequences,
      stream: true,
    });

    let totalContent = '';
    let tokenCount = 0;

    try {
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        const content = delta?.content || '';

        if (content) {
          totalContent += content;
          tokenCount += this.estimateTokens(content);
        }

        const isComplete = chunk.choices[0]?.finish_reason !== null;

        yield {
          content,
          isComplete,
          metadata: isComplete
            ? {
                model: chunk.model,
                provider: 'openai',
                tokens: {
                  input: tokenCount,
                  output: tokenCount,
                  total: tokenCount,
                },
                credits: this.calculateCredits(tokenCount),
                finishReason: chunk.choices[0]?.finish_reason || undefined,
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
    return 'openai';
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
    if (error instanceof OpenAI.APIError) {
      // Retry on rate limits, timeouts, and server errors
      return (
        error.status === 429 || // Rate limit
        error.status === 408 || // Timeout
        error.status === 503 || // Service unavailable
        error.status === 500 // Internal server error
      );
    }
    return false;
  }

  /**
   * Handle and transform errors
   */
  private handleError(error: unknown): Error {
    if (error instanceof OpenAI.APIError) {
      return new Error(`OpenAI API Error (${error.status}): ${error.message}`);
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
   * Estimate token count for streaming (rough approximation)
   */
  private estimateTokens(text: string): number {
    // Rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
