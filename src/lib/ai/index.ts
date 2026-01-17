/**
 * AI Services Module
 *
 * Provides unified interfaces for interacting with multiple AI providers
 * including OpenAI, Anthropic, Google, and Mistral.
 */

// Export common types (excluding AIServiceError interface which conflicts with class)
export type {
  AIProvider,
  ImageSize,
  GenerationStatus,
  MessageRole,
  ResponseMetadata,
  TextGenerationResponse,
  TextStreamChunk,
  ImageGenerationResponse,
  SpeechSynthesisResponse,
  TranscriptionResponse,
  TranscriptionSegment,
} from './types';

// Export service interfaces
export * from './interfaces';

// Export provider implementations
export * from './providers';

// Export factory
export * from './factory';

// Export credit calculator
export * from './credit-calculator';

// Export streaming handler
export * from './streaming-handler';

// Export error handling (AIServiceError class takes precedence)
export * from './errors';
export * from './error-handler';

// Export retry logic
export * from './retry';

// Export circuit breaker
export * from './circuit-breaker';

// Export base provider
export * from './base-provider';
