/**
 * Anthropic Text Generation Service
 *
 * Implements text completion and chat capabilities using Anthropic's Claude API.
 * Supports both streaming and non-streaming responses with retry logic.
 */

import Anthropic from '@anthropic-ai/sdk';
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

export class AnthropicTextGenerationService implements TextGenerationService {
  private client: Anthropic;
  private model: string;
  private maxRetries: number;
  private retryDelay: number;

  constructor(
    model: string = 'claude-3-5-sonnet-20241022',
    maxRetries: number = 3
  ) {
    const env = getEnv();

    if (!env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    this.client = new Anthropic({
      apiKey: env.ANTHROPIC_API_KEY,
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
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: options?.maxTokens || 1024,
        messages: [{ role: 'user', content: prompt }],
        temperature: options?.temperature,
        top_p: options?.topP,
        stop_sequences: options?.stopSequences,
      });

      const content = this.extractContent(response);

      const metadata: ResponseMetadata = {
        model: response.model,
        provider: 'anthropic',
        tokens: {
          input: response.usage.input_tokens,
          output: response.usage.output_tokens,
          total: response.usage.input_tokens + response.usage.output_tokens,
        },
        credits: this.calculateCredits(
          response.usage.input_tokens + response.usage.output_tokens
        ),
        finishReason: response.stop_reason || undefined,
      };

      return {
        content,
        metadata,
      };
    });
  }

  async generateChatCompletion(
    messages: ChatMessage[],
    options?: TextGenerationOptions
  ): Promise<TextGenerationResponse> {
    return this.executeWithRetry(async () => {
      // Anthropic requires at least one message and alternating roles
      // Extract system messages and convert to system parameter
      const systemMessages = messages.filter((msg) => msg.role === 'system');
      const conversationMessages = messages.filter(
        (msg) => msg.role !== 'system'
      );

      const systemPrompt =
        systemMessages.length > 0
          ? systemMessages.map((msg) => msg.content).join('\n\n')
          : undefined;

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: options?.maxTokens || 1024,
        messages: conversationMessages.map((msg) => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        })),
        system: systemPrompt,
        temperature: options?.temperature,
        top_p: options?.topP,
        stop_sequences: options?.stopSequences,
      });

      const content = this.extractContent(response);

      const metadata: ResponseMetadata = {
        model: response.model,
        provider: 'anthropic',
        tokens: {
          input: response.usage.input_tokens,
          output: response.usage.output_tokens,
          total: response.usage.input_tokens + response.usage.output_tokens,
        },
        credits: this.calculateCredits(
          response.usage.input_tokens + response.usage.output_tokens
        ),
        finishReason: response.stop_reason || undefined,
      };

      return {
        content,
        metadata,
      };
    });
  }

  async *streamCompletion(
    prompt: string,
    options?: TextGenerationOptions
  ): AsyncIterable<TextStreamChunk> {
    const stream = await this.client.messages.create({
      model: this.model,
      max_tokens: options?.maxTokens || 1024,
      messages: [{ role: 'user', content: prompt }],
      temperature: options?.temperature,
      top_p: options?.topP,
      stop_sequences: options?.stopSequences,
      stream: true,
    });

    let totalContent = '';
    let inputTokens = 0;
    let outputTokens = 0;

    try {
      for await (const event of stream) {
        if (event.type === 'message_start') {
          inputTokens = event.message.usage.input_tokens;
        } else if (event.type === 'content_block_delta') {
          if (event.delta.type === 'text_delta') {
            const content = event.delta.text;
            totalContent += content;

            yield {
              content,
              isComplete: false,
            };
          }
        } else if (event.type === 'message_delta') {
          outputTokens = event.usage.output_tokens;
        } else if (event.type === 'message_stop') {
          const totalTokens = inputTokens + outputTokens;

          yield {
            content: '',
            isComplete: true,
            metadata: {
              model: this.model,
              provider: 'anthropic',
              tokens: {
                input: inputTokens,
                output: outputTokens,
                total: totalTokens,
              },
              credits: this.calculateCredits(totalTokens),
            },
          };
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
    // Extract system messages and convert to system parameter
    const systemMessages = messages.filter((msg) => msg.role === 'system');
    const conversationMessages = messages.filter(
      (msg) => msg.role !== 'system'
    );

    const systemPrompt =
      systemMessages.length > 0
        ? systemMessages.map((msg) => msg.content).join('\n\n')
        : undefined;

    const stream = await this.client.messages.create({
      model: this.model,
      max_tokens: options?.maxTokens || 1024,
      messages: conversationMessages.map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      })),
      system: systemPrompt,
      temperature: options?.temperature,
      top_p: options?.topP,
      stop_sequences: options?.stopSequences,
      stream: true,
    });

    let totalContent = '';
    let inputTokens = 0;
    let outputTokens = 0;

    try {
      for await (const event of stream) {
        if (event.type === 'message_start') {
          inputTokens = event.message.usage.input_tokens;
        } else if (event.type === 'content_block_delta') {
          if (event.delta.type === 'text_delta') {
            const content = event.delta.text;
            totalContent += content;

            yield {
              content,
              isComplete: false,
            };
          }
        } else if (event.type === 'message_delta') {
          outputTokens = event.usage.output_tokens;
        } else if (event.type === 'message_stop') {
          const totalTokens = inputTokens + outputTokens;

          yield {
            content: '',
            isComplete: true,
            metadata: {
              model: this.model,
              provider: 'anthropic',
              tokens: {
                input: inputTokens,
                output: outputTokens,
                total: totalTokens,
              },
              credits: this.calculateCredits(totalTokens),
            },
          };
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
    return 'anthropic';
  }

  /**
   * Extract text content from Anthropic response
   */
  private extractContent(response: Anthropic.Message): string {
    const textBlocks = response.content.filter(
      (block): block is Anthropic.TextBlock => block.type === 'text'
    );

    if (textBlocks.length === 0) {
      throw new Error('No text content in Anthropic response');
    }

    return textBlocks.map((block) => block.text).join('');
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
    if (error instanceof Anthropic.APIError) {
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
    if (error instanceof Anthropic.APIError) {
      return new Error(
        `Anthropic API Error (${error.status}): ${error.message}`
      );
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
