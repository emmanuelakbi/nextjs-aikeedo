/**
 * Retry Logic with Exponential Backoff
 * Requirements: 11.1, 11.2, 11.3
 *
 * Provides configurable retry logic for AI service operations
 */

import { logger } from '../errors/logger';
import type { AIProvider } from './types';

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  timeout?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Load default retry configuration from centralized config
 */
function loadDefaultRetryConfig(): RetryConfig {
  try {
    const { config } = require('../../../config/config-loader');
    return {
      maxRetries: config.retry.maxRetries,
      initialDelay: config.retry.initialDelay,
      maxDelay: config.retry.maxDelay,
      backoffMultiplier: config.retry.backoffMultiplier,
      timeout: config.retry.timeout,
    };
  } catch {
    // Fallback if config not available
    return {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      timeout: 60000,
    };
  }
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = loadDefaultRetryConfig();

/**
 * Execute a function with exponential backoff retry logic
 */
export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  provider?: AIProvider
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error;

  for (let attempt = 1; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      // Wrap in timeout if configured
      if (finalConfig.timeout) {
        return await withTimeout(fn(), finalConfig.timeout, provider);
      }
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry if this is the last attempt
      if (attempt >= finalConfig.maxRetries) {
        logger.error('Max retries exceeded', {
          provider,
          attempt,
          error: lastError.message,
        });
        throw lastError;
      }

      // Check if error is retryable
      if (!isRetryableError(lastError)) {
        logger.info('Non-retryable error encountered', {
          provider,
          attempt,
          error: lastError.message,
        });
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        finalConfig.initialDelay *
          Math.pow(finalConfig.backoffMultiplier, attempt - 1),
        finalConfig.maxDelay
      );

      logger.info('Retrying after error', {
        provider,
        attempt,
        nextAttempt: attempt + 1,
        delayMs: delay,
        error: lastError.message,
      });

      // Call retry callback if provided
      if (finalConfig.onRetry) {
        finalConfig.onRetry(attempt, lastError);
      }

      // Wait before retrying
      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Wrap a promise with a timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  provider?: AIProvider
): Promise<T> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      const error = new Error(
        `Operation timed out after ${timeoutMs}ms${provider ? ` for ${provider}` : ''}`
      );
      error.name = 'TimeoutError';
      reject(error);
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId!);
  }
}

/**
 * Determine if an error is retryable
 */
export function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  // Network errors
  if (
    name.includes('networkerror') ||
    message.includes('network') ||
    message.includes('econnreset') ||
    message.includes('enotfound') ||
    message.includes('etimedout')
  ) {
    return true;
  }

  // Timeout errors
  if (name.includes('timeout') || message.includes('timeout')) {
    return true;
  }

  // Rate limit errors
  if (
    message.includes('rate limit') ||
    message.includes('429') ||
    message.includes('too many requests')
  ) {
    return true;
  }

  // Server errors (5xx)
  if (
    message.includes('500') ||
    message.includes('502') ||
    message.includes('503') ||
    message.includes('504') ||
    message.includes('internal server error') ||
    message.includes('service unavailable') ||
    message.includes('bad gateway')
  ) {
    return true;
  }

  // Provider-specific retryable errors
  if (
    message.includes('overloaded') ||
    message.includes('capacity') ||
    message.includes('quota')
  ) {
    return true;
  }

  return false;
}

/**
 * Sleep utility for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Add jitter to delay to prevent thundering herd
 */
export function addJitter(delay: number, jitterFactor: number = 0.1): number {
  const jitter = delay * jitterFactor * Math.random();
  return delay + jitter;
}
