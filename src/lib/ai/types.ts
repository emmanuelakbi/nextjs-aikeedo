/**
 * Common types for AI services
 */

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'mistral' | 'openrouter';

export type ImageSize =
  | '256x256'
  | '512x512'
  | '1024x1024'
  | '1792x1024'
  | '1024x1792';

export type GenerationStatus = 'pending' | 'completed' | 'failed';

export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * Common response metadata
 */
export interface ResponseMetadata {
  model: string;
  provider: AIProvider;
  tokens?: {
    input: number;
    output: number;
    total: number;
  };
  credits: number;
  finishReason?: string;
}

/**
 * Text generation response
 */
export interface TextGenerationResponse {
  content: string;
  metadata: ResponseMetadata;
}

/**
 * Streaming chunk for text generation
 */
export interface TextStreamChunk {
  content: string;
  isComplete: boolean;
  metadata?: ResponseMetadata;
}

/**
 * Image generation response
 */
export interface ImageGenerationResponse {
  url: string;
  width: number;
  height: number;
  metadata: ResponseMetadata;
}

/**
 * Speech synthesis response
 */
export interface SpeechSynthesisResponse {
  url: string;
  format: string;
  duration: number;
  metadata: ResponseMetadata;
}

/**
 * Transcription response
 */
export interface TranscriptionResponse {
  text: string;
  language?: string;
  duration: number;
  segments?: TranscriptionSegment[];
  metadata: ResponseMetadata;
}

/**
 * Transcription segment with timestamp
 */
export interface TranscriptionSegment {
  text: string;
  start: number;
  end: number;
}

/**
 * Error response from AI services
 */
export interface AIServiceError {
  code: string;
  message: string;
  provider: AIProvider;
  retryable: boolean;
  details?: Record<string, unknown>;
}
