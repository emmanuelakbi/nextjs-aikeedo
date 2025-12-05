/**
 * Tests for retry logic
 * Requirements: 11.1, 11.2, 11.3
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  executeWithRetry,
  withTimeout,
  isRetryableError,
  sleep,
} from '../retry';

describe('Retry Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('executeWithRetry', () => {
    it('should return result on first success', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const result = await executeWithRetry(fn, { maxRetries: 3 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('503 Service Unavailable'))
        .mockRejectedValueOnce(new Error('Rate limit exceeded'))
        .mockResolvedValueOnce('success');

      const result = await executeWithRetry(fn, { maxRetries: 3 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw after max retries', async () => {
      const error = new Error('500 Internal Server Error');
      const fn = vi.fn().mockRejectedValue(error);

      await expect(
        executeWithRetry(fn, { maxRetries: 2, initialDelay: 10 })
      ).rejects.toThrow(error);

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should not retry non-retryable errors', async () => {
      const error = new Error('400 Bad Request');
      const fn = vi.fn().mockRejectedValue(error);

      await expect(executeWithRetry(fn, { maxRetries: 3 })).rejects.toThrow(
        error
      );

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should use exponential backoff', async () => {
      const delays: number[] = [];
      const fn = vi.fn().mockRejectedValue(new Error('503'));

      const config = {
        maxRetries: 3,
        initialDelay: 100,
        backoffMultiplier: 2,
        onRetry: (attempt: number) => {
          delays.push(attempt);
        },
      };

      await executeWithRetry(fn, config).catch(() => {});

      expect(delays).toEqual([1, 2]);
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should respect max delay', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('503'));

      const config = {
        maxRetries: 5,
        initialDelay: 1000,
        maxDelay: 2000,
        backoffMultiplier: 2,
      };

      const start = Date.now();
      await executeWithRetry(fn, config).catch(() => {});
      const duration = Date.now() - start;

      // Should not exceed max delay significantly
      // 2000ms (max) * 4 retries = 8000ms + some overhead
      expect(duration).toBeLessThan(10000);
    });

    it('should call onRetry callback', async () => {
      const onRetry = vi.fn();
      const error = new Error('503');
      const fn = vi
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success');

      await executeWithRetry(
        fn,
        { maxRetries: 2, initialDelay: 10, onRetry },
        'openai'
      );

      expect(onRetry).toHaveBeenCalledWith(1, error);
    });
  });

  describe('withTimeout', () => {
    it('should return result if completed within timeout', async () => {
      const fn = async () => {
        await sleep(10);
        return 'success';
      };

      const result = await withTimeout(fn(), 100);
      expect(result).toBe('success');
    });

    it('should throw timeout error if exceeded', async () => {
      const fn = async () => {
        await sleep(200);
        return 'success';
      };

      await expect(withTimeout(fn(), 50, 'openai')).rejects.toThrow(
        /timed out/i
      );
    });

    it('should include provider in timeout error', async () => {
      const fn = async () => {
        await sleep(200);
        return 'success';
      };

      await expect(withTimeout(fn(), 50, 'anthropic')).rejects.toThrow(
        /anthropic/i
      );
    });
  });

  describe('isRetryableError', () => {
    it('should identify network errors as retryable', () => {
      expect(isRetryableError(new Error('ECONNRESET'))).toBe(true);
      expect(isRetryableError(new Error('ENOTFOUND'))).toBe(true);
      expect(isRetryableError(new Error('network error'))).toBe(true);
    });

    it('should identify timeout errors as retryable', () => {
      const error = new Error('Request timeout');
      error.name = 'TimeoutError';
      expect(isRetryableError(error)).toBe(true);
    });

    it('should identify rate limit errors as retryable', () => {
      expect(isRetryableError(new Error('429 Rate limit'))).toBe(true);
      expect(isRetryableError(new Error('Too many requests'))).toBe(true);
    });

    it('should identify server errors as retryable', () => {
      expect(isRetryableError(new Error('500 Internal Server Error'))).toBe(
        true
      );
      expect(isRetryableError(new Error('503 Service Unavailable'))).toBe(true);
    });

    it('should identify client errors as non-retryable', () => {
      expect(isRetryableError(new Error('400 Bad Request'))).toBe(false);
      expect(isRetryableError(new Error('401 Unauthorized'))).toBe(false);
      expect(isRetryableError(new Error('404 Not Found'))).toBe(false);
    });
  });

  describe('sleep', () => {
    it('should wait for specified duration', async () => {
      const start = Date.now();
      await sleep(100);
      const duration = Date.now() - start;

      expect(duration).toBeGreaterThanOrEqual(90);
      expect(duration).toBeLessThan(150);
    });
  });
});
