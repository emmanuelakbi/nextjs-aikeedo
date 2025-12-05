/**
 * AI Service Error Handler
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 *
 * Centralized error handling and transformation for AI services
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../errors/logger';
import {
  AIServiceError,
  AIRateLimitError,
  AITimeoutError,
  AIProviderUnavailableError,
  AIAuthenticationError,
  AIInvalidRequestError,
  AIContentFilterError,
} from './errors';
import type { AIProvider } from './types';

/**
 * Transform provider-specific errors into our error types
 */
export function handleAIError(
  error: unknown,
  provider: AIProvider,
  context?: Record<string, unknown>
): never {
  // Log the error
  logger.error('AI service error occurred', {
    provider,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context,
  });

  // Handle OpenAI errors
  if (error instanceof OpenAI.APIError) {
    throw transformOpenAIError(error, provider, context);
  }

  // Handle Anthropic errors
  if (error instanceof Anthropic.APIError) {
    throw transformAnthropicError(error, provider, context);
  }

  // Handle timeout errors
  if (error instanceof Error && error.name === 'TimeoutError') {
    throw new AITimeoutError(provider, context);
  }

  // Handle generic errors
  if (error instanceof Error) {
    // Check for network errors
    if (
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ENOTFOUND') ||
      error.message.includes('network')
    ) {
      throw new AIProviderUnavailableError(provider, {
        ...context,
        originalError: error.message,
      });
    }

    // Generic AI service error
    throw new AIServiceError(error.message, provider, 500, true, context);
  }

  // Unknown error type
  throw new AIServiceError(
    'An unknown error occurred',
    provider,
    500,
    false,
    context
  );
}

/**
 * Transform OpenAI API errors
 */
function transformOpenAIError(
  error: OpenAI.APIError,
  provider: AIProvider,
  context?: Record<string, unknown>
): AIServiceError {
  const errorContext = {
    ...context,
    status: error.status,
    code: error.code,
    type: error.type,
  };

  switch (error.status) {
    case 401:
      return new AIAuthenticationError(provider, errorContext);

    case 429:
      // Extract retry-after from headers if available
      const retryAfter = extractRetryAfter(error);
      return new AIRateLimitError(provider, retryAfter, errorContext);

    case 400:
      // Check if it's a content filter error
      if (
        error.message.includes('content_policy') ||
        error.message.includes('content_filter')
      ) {
        return new AIContentFilterError(provider, errorContext);
      }
      return new AIInvalidRequestError(provider, error.message, errorContext);

    case 408:
      return new AITimeoutError(provider, errorContext);

    case 500:
    case 502:
    case 503:
    case 504:
      return new AIProviderUnavailableError(provider, errorContext);

    default:
      return new AIServiceError(
        error.message,
        provider,
        error.status || 500,
        error.status ? error.status >= 500 : false,
        errorContext
      );
  }
}

/**
 * Transform Anthropic API errors
 */
function transformAnthropicError(
  error: Anthropic.APIError,
  provider: AIProvider,
  context?: Record<string, unknown>
): AIServiceError {
  const errorContext = {
    ...context,
    status: error.status,
    type: error.error?.type,
  };

  switch (error.status) {
    case 401:
      return new AIAuthenticationError(provider, errorContext);

    case 429:
      const retryAfter = extractRetryAfter(error);
      return new AIRateLimitError(provider, retryAfter, errorContext);

    case 400:
      return new AIInvalidRequestError(provider, error.message, errorContext);

    case 408:
      return new AITimeoutError(provider, errorContext);

    case 500:
    case 502:
    case 503:
    case 504:
      return new AIProviderUnavailableError(provider, errorContext);

    default:
      return new AIServiceError(
        error.message,
        provider,
        error.status || 500,
        error.status ? error.status >= 500 : false,
        errorContext
      );
  }
}

/**
 * Transform Google AI errors
 */
export function transformGoogleError(
  error: Error,
  provider: AIProvider,
  context?: Record<string, unknown>
): AIServiceError {
  const message = error.message.toLowerCase();
  const errorContext = { ...context, originalError: error.message };

  // Authentication errors
  if (message.includes('api key') || message.includes('authentication')) {
    return new AIAuthenticationError(provider, errorContext);
  }

  // Rate limit errors
  if (message.includes('quota') || message.includes('rate limit')) {
    return new AIRateLimitError(provider, undefined, errorContext);
  }

  // Content filter errors
  if (message.includes('safety') || message.includes('blocked')) {
    return new AIContentFilterError(provider, errorContext);
  }

  // Service unavailable
  if (
    message.includes('503') ||
    message.includes('unavailable') ||
    message.includes('500')
  ) {
    return new AIProviderUnavailableError(provider, errorContext);
  }

  // Invalid request
  if (message.includes('invalid') || message.includes('400')) {
    return new AIInvalidRequestError(provider, error.message, errorContext);
  }

  // Generic error
  return new AIServiceError(error.message, provider, 500, true, errorContext);
}

/**
 * Transform Mistral errors
 */
export function transformMistralError(
  error: Error,
  provider: AIProvider,
  context?: Record<string, unknown>
): AIServiceError {
  const message = error.message.toLowerCase();
  const errorContext = { ...context, originalError: error.message };

  // Authentication errors
  if (message.includes('unauthorized') || message.includes('401')) {
    return new AIAuthenticationError(provider, errorContext);
  }

  // Rate limit errors
  if (message.includes('rate limit') || message.includes('429')) {
    return new AIRateLimitError(provider, undefined, errorContext);
  }

  // Service unavailable
  if (
    message.includes('503') ||
    message.includes('unavailable') ||
    message.includes('500')
  ) {
    return new AIProviderUnavailableError(provider, errorContext);
  }

  // Invalid request
  if (message.includes('invalid') || message.includes('400')) {
    return new AIInvalidRequestError(provider, error.message, errorContext);
  }

  // Generic error
  return new AIServiceError(error.message, provider, 500, true, errorContext);
}

/**
 * Extract retry-after value from error headers
 */
function extractRetryAfter(error: any): number | undefined {
  try {
    if (error.headers?.['retry-after']) {
      const retryAfter = parseInt(error.headers['retry-after'], 10);
      return isNaN(retryAfter) ? undefined : retryAfter * 1000; // Convert to ms
    }
  } catch {
    // Ignore parsing errors
  }
  return undefined;
}

/**
 * Check if an error is retryable
 */
export function isRetryableAIError(error: unknown): boolean {
  if (error instanceof AIServiceError) {
    return error.retryable;
  }
  return false;
}
