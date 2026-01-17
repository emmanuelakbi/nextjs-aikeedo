/**
 * Google Text Generation Service
 *
 * Implements text completion and chat capabilities using Google's Gemini API.
 * Supports both streaming and non-streaming responses with retry logic.
 */

import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';
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

export class GoogleTextGenerationService implements TextGenerationService {
  private client: GoogleGenerativeAI;
  private model: string;
  private maxRetries: number;
  private retryDelay: number;

  constructor(model: string = 'gemini-1.5-flash', maxRetries: number = 3) {
    const env = getEnv();

    if (!env.GOOGLE_AI_API_KEY) {
      throw new Error('GOOGLE_AI_API_KEY is not configured');
    }

    this.client = new GoogleGenerativeAI(env.GOOGLE_AI_API_KEY);
    this.model = model;
    this.maxRetries = maxRetries;
    this.retryDelay = 1000; // Start with 1 second
  }

  async generateCompletion(
    prompt: string,
    options?: TextGenerationOptions
  ): Promise<TextGenerationResponse> {
    return this.executeWithRetry(async () => {
      const model = this.client.getGenerativeModel({
        model: this.model,
        generationConfig: {
          maxOutputTokens: options?.maxTokens,
          temperature: options?.temperature,
          topP: options?.topP,
          stopSequences: options?.stopSequences,
        },
        safetySettings: this.getSafetySettings(),
      });

      const result = await model.generateContent(prompt);
      const response = result.response;

      if (!response.text()) {
        throw new Error('No content in Google AI response');
      }

      const content = response.text();
      const usageMetadata = response.usageMetadata;

      const metadata: ResponseMetadata = {
        model: this.model,
        provider: 'google',
        tokens: {
          input: usageMetadata?.promptTokenCount || 0,
          output: usageMetadata?.candidatesTokenCount || 0,
          total: usageMetadata?.totalTokenCount || 0,
        },
        credits: this.calculateCredits(usageMetadata?.totalTokenCount || 0),
        finishReason: this.mapFinishReason(
          response.candidates?.[0]?.finishReason
        ),
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
      const model = this.client.getGenerativeModel({
        model: this.model,
        generationConfig: {
          maxOutputTokens: options?.maxTokens,
          temperature: options?.temperature,
          topP: options?.topP,
          stopSequences: options?.stopSequences,
        },
        safetySettings: this.getSafetySettings(),
      });

      // Convert messages to Google's format
      // Google uses 'user' and 'model' roles, and system messages go in systemInstruction
      const systemMessages = messages.filter((msg) => msg.role === 'system');
      const conversationMessages = messages.filter(
        (msg) => msg.role !== 'system'
      );

      const systemInstruction =
        systemMessages.length > 0
          ? systemMessages.map((msg) => msg.content).join('\n\n')
          : undefined;

      // Create chat session
      const chat = model.startChat({
        history: conversationMessages.slice(0, -1).map((msg) => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        })),
        generationConfig: {
          maxOutputTokens: options?.maxTokens,
          temperature: options?.temperature,
          topP: options?.topP,
          stopSequences: options?.stopSequences,
        },
        safetySettings: this.getSafetySettings(),
      });

      // Send the last message
      const lastMessage = conversationMessages[conversationMessages.length - 1];
      if (!lastMessage) {
        throw new Error('No messages provided for chat completion');
      }
      const result = await chat.sendMessage(lastMessage.content);
      const response = result.response;

      if (!response.text()) {
        throw new Error('No content in Google AI response');
      }

      const content = response.text();
      const usageMetadata = response.usageMetadata;

      const metadata: ResponseMetadata = {
        model: this.model,
        provider: 'google',
        tokens: {
          input: usageMetadata?.promptTokenCount || 0,
          output: usageMetadata?.candidatesTokenCount || 0,
          total: usageMetadata?.totalTokenCount || 0,
        },
        credits: this.calculateCredits(usageMetadata?.totalTokenCount || 0),
        finishReason: this.mapFinishReason(
          response.candidates?.[0]?.finishReason
        ),
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
    const model = this.client.getGenerativeModel({
      model: this.model,
      generationConfig: {
        maxOutputTokens: options?.maxTokens,
        temperature: options?.temperature,
        topP: options?.topP,
        stopSequences: options?.stopSequences,
      },
      safetySettings: this.getSafetySettings(),
    });

    let totalContent = '';
    let totalTokens = 0;

    try {
      const result = await model.generateContentStream(prompt);

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        totalContent += chunkText;
        totalTokens += this.estimateTokens(chunkText);

        yield {
          content: chunkText,
          isComplete: false,
        };
      }

      // Send final chunk with metadata
      const finalResponse = await result.response;
      const usageMetadata = finalResponse.usageMetadata;

      yield {
        content: '',
        isComplete: true,
        metadata: {
          model: this.model,
          provider: 'google',
          tokens: {
            input: usageMetadata?.promptTokenCount || 0,
            output: usageMetadata?.candidatesTokenCount || 0,
            total: usageMetadata?.totalTokenCount || totalTokens,
          },
          credits: this.calculateCredits(
            usageMetadata?.totalTokenCount || totalTokens
          ),
          finishReason: this.mapFinishReason(
            finalResponse.candidates?.[0]?.finishReason
          ),
        },
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async *streamChatCompletion(
    messages: ChatMessage[],
    options?: TextGenerationOptions
  ): AsyncIterable<TextStreamChunk> {
    const model = this.client.getGenerativeModel({
      model: this.model,
      generationConfig: {
        maxOutputTokens: options?.maxTokens,
        temperature: options?.temperature,
        topP: options?.topP,
        stopSequences: options?.stopSequences,
      },
      safetySettings: this.getSafetySettings(),
    });

    // Convert messages to Google's format
    const systemMessages = messages.filter((msg) => msg.role === 'system');
    const conversationMessages = messages.filter(
      (msg) => msg.role !== 'system'
    );

    // Create chat session
    const chat = model.startChat({
      history: conversationMessages.slice(0, -1).map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      })),
      generationConfig: {
        maxOutputTokens: options?.maxTokens,
        temperature: options?.temperature,
        topP: options?.topP,
        stopSequences: options?.stopSequences,
      },
      safetySettings: this.getSafetySettings(),
    });

    let totalContent = '';
    let totalTokens = 0;

    try {
      const lastMessage = conversationMessages[conversationMessages.length - 1];
      if (!lastMessage) {
        throw new Error('No messages provided for chat completion');
      }
      const result = await chat.sendMessageStream(lastMessage.content);

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        totalContent += chunkText;
        totalTokens += this.estimateTokens(chunkText);

        yield {
          content: chunkText,
          isComplete: false,
        };
      }

      // Send final chunk with metadata
      const finalResponse = await result.response;
      const usageMetadata = finalResponse.usageMetadata;

      yield {
        content: '',
        isComplete: true,
        metadata: {
          model: this.model,
          provider: 'google',
          tokens: {
            input: usageMetadata?.promptTokenCount || 0,
            output: usageMetadata?.candidatesTokenCount || 0,
            total: usageMetadata?.totalTokenCount || totalTokens,
          },
          credits: this.calculateCredits(
            usageMetadata?.totalTokenCount || totalTokens
          ),
          finishReason: this.mapFinishReason(
            finalResponse.candidates?.[0]?.finishReason
          ),
        },
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  getModel(): string {
    return this.model;
  }

  getProvider(): string {
    return 'google';
  }

  /**
   * Get safety settings for content generation
   */
  private getSafetySettings() {
    return [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];
  }

  /**
   * Map Google's finish reason to our standard format
   */
  private mapFinishReason(reason: string | undefined): string | undefined {
    if (!reason) return undefined;

    const mapping: Record<string, string> = {
      STOP: 'stop',
      MAX_TOKENS: 'length',
      SAFETY: 'content_filter',
      RECITATION: 'content_filter',
      OTHER: 'other',
    };

    return mapping[reason] || reason.toLowerCase();
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
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      // Retry on rate limits, timeouts, and server errors
      return (
        message.includes('rate limit') ||
        message.includes('quota') ||
        message.includes('timeout') ||
        message.includes('503') ||
        message.includes('500') ||
        message.includes('unavailable')
      );
    }
    return false;
  }

  /**
   * Handle and transform errors
   */
  private handleError(error: unknown): Error {
    if (error instanceof Error) {
      return new Error(`Google AI Error: ${error.message}`);
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
