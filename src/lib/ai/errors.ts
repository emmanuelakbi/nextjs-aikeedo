/**
 * AI Service Error Classes
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 *
 * Defines error types specific to AI service operations
 */

import { AppError } from '../errors/base';
import type { AIProvider } from './types';

/**
 * Base error for AI service operations
 */
export class AIServiceError extends AppError {
  public readonly provider: AIProvider;
  public readonly retryable: boolean;

  constructor(
    message: string,
    provider: AIProvider,
    statusCode: number = 500,
    retryable: boolean = false,
    context?: Record<string, unknown>
  ) {
    super(message, 'AI_SERVICE_ERROR', statusCode, true, context);
    this.provider = provider;
    this.retryable = retryable;
  }
}

/**
 * Rate limit error from AI provider
 */
export class AIRateLimitError extends AIServiceError {
  public readonly retryAfter?: number;

  constructor(
    provider: AIProvider,
    retryAfter?: number,
    context?: Record<string, unknown>
  ) {
    super(
      `Rate limit exceeded for ${provider}. Please try again later.`,
      provider,
      429,
      true,
      context
    );
    this.retryAfter = retryAfter;
  }
}

/**
 * Timeout error for AI operations
 */
export class AITimeoutError extends AIServiceError {
  constructor(provider: AIProvider, context?: Record<string, unknown>) {
    super(
      `Request to ${provider} timed out. Please try again.`,
      provider,
      408,
      true,
      context
    );
  }
}

/**
 * Provider unavailable error
 */
export class AIProviderUnavailableError extends AIServiceError {
  constructor(provider: AIProvider, context?: Record<string, unknown>) {
    super(
      `${provider} service is temporarily unavailable. Please try again later.`,
      provider,
      503,
      true,
      context
    );
  }
}

/**
 * Invalid API key or authentication error
 */
export class AIAuthenticationError extends AIServiceError {
  constructor(provider: AIProvider, context?: Record<string, unknown>) {
    super(
      `Authentication failed for ${provider}. Please check your API key.`,
      provider,
      401,
      false,
      context
    );
  }
}

/**
 * Invalid request error (non-retryable)
 */
export class AIInvalidRequestError extends AIServiceError {
  constructor(
    provider: AIProvider,
    message: string,
    context?: Record<string, unknown>
  ) {
    super(message, provider, 400, false, context);
  }
}

/**
 * Content filter/safety error
 */
export class AIContentFilterError extends AIServiceError {
  constructor(provider: AIProvider, context?: Record<string, unknown>) {
    super(
      `Content was filtered by ${provider} safety systems.`,
      provider,
      400,
      false,
      context
    );
  }
}

/**
 * Circuit breaker open error
 */
export class CircuitBreakerOpenError extends AIServiceError {
  constructor(provider: AIProvider, context?: Record<string, unknown>) {
    super(
      `Circuit breaker is open for ${provider}. Service temporarily disabled due to repeated failures.`,
      provider,
      503,
      false,
      context
    );
  }
}
