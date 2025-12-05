/**
 * Tests for AI error classes
 * Requirements: 11.1, 11.2, 11.4, 11.5
 */

import { describe, it, expect } from 'vitest';
import {
  AIServiceError,
  AIRateLimitError,
  AITimeoutError,
  AIProviderUnavailableError,
  AIAuthenticationError,
  AIInvalidRequestError,
  AIContentFilterError,
  CircuitBreakerOpenError,
} from '../errors';

describe('AI Error Classes', () => {
  describe('AIServiceError', () => {
    it('should create error with correct properties', () => {
      const error = new AIServiceError('Test error', 'openai', 500, true, {
        detail: 'test',
      });

      expect(error.message).toBe('Test error');
      expect(error.provider).toBe('openai');
      expect(error.statusCode).toBe(500);
      expect(error.retryable).toBe(true);
      expect(error.context).toEqual({ detail: 'test' });
      expect(error.code).toBe('AI_SERVICE_ERROR');
    });

    it('should be instance of Error', () => {
      const error = new AIServiceError('Test', 'openai', 500);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AIServiceError);
    });

    it('should have stack trace', () => {
      const error = new AIServiceError('Test', 'openai', 500);

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('errors.test.ts');
    });
  });

  describe('AIRateLimitError', () => {
    it('should create rate limit error', () => {
      const error = new AIRateLimitError('openai', 60000);

      expect(error.message).toContain('Rate limit exceeded');
      expect(error.message).toContain('openai');
      expect(error.provider).toBe('openai');
      expect(error.statusCode).toBe(429);
      expect(error.retryable).toBe(true);
      expect(error.retryAfter).toBe(60000);
    });

    it('should work without retry-after', () => {
      const error = new AIRateLimitError('anthropic');

      expect(error.retryAfter).toBeUndefined();
      expect(error.retryable).toBe(true);
    });
  });

  describe('AITimeoutError', () => {
    it('should create timeout error', () => {
      const error = new AITimeoutError('google');

      expect(error.message).toContain('timed out');
      expect(error.message).toContain('google');
      expect(error.provider).toBe('google');
      expect(error.statusCode).toBe(408);
      expect(error.retryable).toBe(true);
    });
  });

  describe('AIProviderUnavailableError', () => {
    it('should create unavailable error', () => {
      const error = new AIProviderUnavailableError('mistral');

      expect(error.message).toContain('unavailable');
      expect(error.message).toContain('mistral');
      expect(error.provider).toBe('mistral');
      expect(error.statusCode).toBe(503);
      expect(error.retryable).toBe(true);
    });
  });

  describe('AIAuthenticationError', () => {
    it('should create authentication error', () => {
      const error = new AIAuthenticationError('openai');

      expect(error.message).toContain('Authentication failed');
      expect(error.message).toContain('openai');
      expect(error.provider).toBe('openai');
      expect(error.statusCode).toBe(401);
      expect(error.retryable).toBe(false);
    });
  });

  describe('AIInvalidRequestError', () => {
    it('should create invalid request error', () => {
      const error = new AIInvalidRequestError(
        'anthropic',
        'Invalid parameter: temperature'
      );

      expect(error.message).toBe('Invalid parameter: temperature');
      expect(error.provider).toBe('anthropic');
      expect(error.statusCode).toBe(400);
      expect(error.retryable).toBe(false);
    });
  });

  describe('AIContentFilterError', () => {
    it('should create content filter error', () => {
      const error = new AIContentFilterError('google');

      expect(error.message).toContain('filtered');
      expect(error.message).toContain('google');
      expect(error.provider).toBe('google');
      expect(error.statusCode).toBe(400);
      expect(error.retryable).toBe(false);
    });
  });

  describe('CircuitBreakerOpenError', () => {
    it('should create circuit breaker error', () => {
      const error = new CircuitBreakerOpenError('openai', {
        nextAttemptTime: Date.now() + 60000,
      });

      expect(error.message).toContain('Circuit breaker is open');
      expect(error.message).toContain('openai');
      expect(error.provider).toBe('openai');
      expect(error.statusCode).toBe(503);
      expect(error.retryable).toBe(false);
      expect(error.context).toHaveProperty('nextAttemptTime');
    });
  });

  describe('Error serialization', () => {
    it('should serialize to JSON', () => {
      const error = new AIServiceError('Test error', 'openai', 500);

      const json = error.toJSON();

      expect(json).toEqual({
        error: {
          code: 'AI_SERVICE_ERROR',
          message: 'Test error',
        },
      });
    });

    it('should include context in error object', () => {
      const error = new AIServiceError('Test', 'openai', 500, true, {
        operation: 'generate',
        model: 'gpt-4',
      });

      expect(error.context).toEqual({
        operation: 'generate',
        model: 'gpt-4',
      });
    });
  });

  describe('Error inheritance', () => {
    it('should maintain instanceof checks', () => {
      const error = new AIRateLimitError('openai');

      expect(error instanceof AIRateLimitError).toBe(true);
      expect(error instanceof AIServiceError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });

    it('should work with try-catch', () => {
      try {
        throw new AITimeoutError('anthropic');
      } catch (error) {
        expect(error).toBeInstanceOf(AITimeoutError);
        expect(error).toBeInstanceOf(AIServiceError);

        if (error instanceof AITimeoutError) {
          expect(error.provider).toBe('anthropic');
          expect(error.retryable).toBe(true);
        }
      }
    });
  });
});
