/**
 * Base Provider Class with Error Handling and Retry Logic
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 *
 * Provides common functionality for all AI providers
 */

import { logger } from '../errors/logger';
import { handleAIError } from './error-handler';
import {
  executeWithRetry,
  type RetryConfig,
  DEFAULT_RETRY_CONFIG,
} from './retry';
import { globalCircuitBreaker } from './circuit-breaker';
import type { AIProvider } from './types';

export interface BaseProviderConfig {
  model: string;
  provider: AIProvider;
  maxRetries?: number;
  timeout?: number;
  enableCircuitBreaker?: boolean;
}

/**
 * Base class for AI service providers
 */
export abstract class BaseAIProvider {
  protected model: string;
  protected provider: AIProvider;
  protected retryConfig: RetryConfig;
  protected enableCircuitBreaker: boolean;

  constructor(config: BaseProviderConfig) {
    this.model = config.model;
    this.provider = config.provider;
    this.enableCircuitBreaker = config.enableCircuitBreaker ?? true;

    this.retryConfig = {
      ...DEFAULT_RETRY_CONFIG,
      maxRetries: config.maxRetries ?? DEFAULT_RETRY_CONFIG.maxRetries,
      timeout: config.timeout ?? DEFAULT_RETRY_CONFIG.timeout,
    };
  }

  /**
   * Execute a function with full error handling, retry, and circuit breaker
   */
  protected async executeWithProtection<T>(
    fn: () => Promise<T>,
    operationName: string,
    context?: Record<string, unknown>
  ): Promise<T> {
    const startTime = Date.now();

    try {
      logger.debug(`Starting ${operationName}`, {
        provider: this.provider,
        model: this.model,
        ...context,
      });

      // Wrap with circuit breaker if enabled
      const operation = this.enableCircuitBreaker
        ? () => globalCircuitBreaker.execute(fn, this.provider)
        : fn;

      // Execute with retry logic
      const result = await executeWithRetry(
        operation,
        {
          ...this.retryConfig,
          onRetry: (attempt, error) => {
            logger.warn(`Retry attempt ${attempt} for ${operationName}`, {
              provider: this.provider,
              model: this.model,
              error: error.message,
              ...context,
            });
          },
        },
        this.provider
      );

      const duration = Date.now() - startTime;
      logger.info(`${operationName} completed successfully`, {
        provider: this.provider,
        model: this.model,
        durationMs: duration,
        ...context,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`${operationName} failed`, {
        provider: this.provider,
        model: this.model,
        durationMs: duration,
        error: error instanceof Error ? error.message : String(error),
        ...context,
      });

      // Transform and throw the error
      handleAIError(error, this.provider, {
        operation: operationName,
        model: this.model,
        durationMs: duration,
        ...context,
      });
    }
  }

  /**
   * Get the model name
   */
  getModel(): string {
    return this.model;
  }

  /**
   * Get the provider name
   */
  getProvider(): string {
    return this.provider;
  }

  /**
   * Calculate credits based on token count
   * Override this in subclasses for provider-specific pricing
   */
  protected calculateCredits(tokens: number): number {
    // Default: 1 credit per 1000 tokens
    return Math.ceil(tokens / 1000);
  }

  /**
   * Estimate token count for text (rough approximation)
   */
  protected estimateTokens(text: string): number {
    // Rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4);
  }
}
