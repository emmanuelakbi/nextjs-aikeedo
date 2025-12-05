/**
 * Text Generation Service Interface
 *
 * Provides text completion and chat capabilities with AI models.
 * Supports both streaming and non-streaming responses.
 */

import type {
  TextGenerationResponse,
  TextStreamChunk,
  MessageRole,
} from '../types';

export interface TextGenerationOptions {
  /**
   * Maximum number of tokens to generate
   */
  maxTokens?: number;

  /**
   * Temperature for randomness (0.0 - 2.0)
   * Lower values make output more focused and deterministic
   */
  temperature?: number;

  /**
   * Top-p sampling (0.0 - 1.0)
   * Controls diversity via nucleus sampling
   */
  topP?: number;

  /**
   * Frequency penalty (-2.0 - 2.0)
   * Reduces repetition of token sequences
   */
  frequencyPenalty?: number;

  /**
   * Presence penalty (-2.0 - 2.0)
   * Encourages talking about new topics
   */
  presencePenalty?: number;

  /**
   * Stop sequences to end generation
   */
  stopSequences?: string[];

  /**
   * Enable streaming responses
   */
  stream?: boolean;
}

export interface ChatMessage {
  role: MessageRole;
  content: string;
}

export interface TextGenerationService {
  /**
   * Generate text completion from a prompt
   *
   * @param prompt - The input prompt
   * @param options - Generation options
   * @returns Promise resolving to the generated text and metadata
   */
  generateCompletion(
    prompt: string,
    options?: TextGenerationOptions
  ): Promise<TextGenerationResponse>;

  /**
   * Generate chat completion from conversation history
   *
   * @param messages - Array of chat messages
   * @param options - Generation options
   * @returns Promise resolving to the assistant's response
   */
  generateChatCompletion(
    messages: ChatMessage[],
    options?: TextGenerationOptions
  ): Promise<TextGenerationResponse>;

  /**
   * Stream text completion from a prompt
   *
   * @param prompt - The input prompt
   * @param options - Generation options
   * @returns AsyncIterable of text chunks
   */
  streamCompletion(
    prompt: string,
    options?: TextGenerationOptions
  ): AsyncIterable<TextStreamChunk>;

  /**
   * Stream chat completion from conversation history
   *
   * @param messages - Array of chat messages
   * @param options - Generation options
   * @returns AsyncIterable of text chunks
   */
  streamChatCompletion(
    messages: ChatMessage[],
    options?: TextGenerationOptions
  ): AsyncIterable<TextStreamChunk>;

  /**
   * Get the model identifier
   */
  getModel(): string;

  /**
   * Get the provider name
   */
  getProvider(): string;
}
