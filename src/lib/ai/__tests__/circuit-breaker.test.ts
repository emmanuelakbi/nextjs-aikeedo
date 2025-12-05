/**
 * Tests for circuit breaker
 * Requirements: 11.1, 11.2
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CircuitBreaker, CircuitState } from '../circuit-breaker';
import { CircuitBreakerOpenError } from '../errors';
import { sleep } from '../retry';

describe('Circuit Breaker', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker({
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 100,
      monitoringPeriod: 1000,
    });
  });

  describe('CLOSED state', () => {
    it('should start in CLOSED state', () => {
      expect(breaker.getState('openai')).toBe(CircuitState.CLOSED);
    });

    it('should execute function successfully', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const result = await breaker.execute(fn, 'openai');

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
      expect(breaker.getState('openai')).toBe(CircuitState.CLOSED);
    });

    it('should remain CLOSED on single failure', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('failure'));

      await expect(breaker.execute(fn, 'openai')).rejects.toThrow('failure');

      expect(breaker.getState('openai')).toBe(CircuitState.CLOSED);
    });

    it('should transition to OPEN after threshold failures', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('failure'));

      // Fail 3 times (threshold)
      for (let i = 0; i < 3; i++) {
        await breaker.execute(fn, 'openai').catch(() => {});
      }

      expect(breaker.getState('openai')).toBe(CircuitState.OPEN);
    });

    it('should reset failure count on success', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('failure'))
        .mockRejectedValueOnce(new Error('failure'))
        .mockResolvedValueOnce('success')
        .mockRejectedValueOnce(new Error('failure'))
        .mockRejectedValueOnce(new Error('failure'));

      // 2 failures
      await breaker.execute(fn, 'openai').catch(() => {});
      await breaker.execute(fn, 'openai').catch(() => {});

      // Success resets count
      await breaker.execute(fn, 'openai');

      // 2 more failures (should not open)
      await breaker.execute(fn, 'openai').catch(() => {});
      await breaker.execute(fn, 'openai').catch(() => {});

      expect(breaker.getState('openai')).toBe(CircuitState.CLOSED);
    });
  });

  describe('OPEN state', () => {
    beforeEach(async () => {
      const fn = vi.fn().mockRejectedValue(new Error('failure'));

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await breaker.execute(fn, 'openai').catch(() => {});
      }
    });

    it('should reject immediately when OPEN', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      await expect(breaker.execute(fn, 'openai')).rejects.toThrow(
        CircuitBreakerOpenError
      );

      expect(fn).not.toHaveBeenCalled();
    });

    it('should transition to HALF_OPEN after timeout', async () => {
      // Wait for timeout
      await sleep(150);

      const fn = vi.fn().mockResolvedValue('success');
      await breaker.execute(fn, 'openai');

      expect(breaker.getState('openai')).toBe(CircuitState.HALF_OPEN);
    });

    it('should include next attempt time in error', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      try {
        await breaker.execute(fn, 'openai');
      } catch (error) {
        expect(error).toBeInstanceOf(CircuitBreakerOpenError);
        expect((error as CircuitBreakerOpenError).context).toHaveProperty(
          'nextAttemptTime'
        );
      }
    });
  });

  describe('HALF_OPEN state', () => {
    beforeEach(async () => {
      const fn = vi.fn().mockRejectedValue(new Error('failure'));

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await breaker.execute(fn, 'openai').catch(() => {});
      }

      // Wait for timeout to transition to HALF_OPEN
      await sleep(150);
    });

    it('should transition to CLOSED after success threshold', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      // Need 2 successes (successThreshold)
      await breaker.execute(fn, 'openai');
      expect(breaker.getState('openai')).toBe(CircuitState.HALF_OPEN);

      await breaker.execute(fn, 'openai');
      expect(breaker.getState('openai')).toBe(CircuitState.CLOSED);
    });

    it('should transition back to OPEN on failure', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('failure'));

      await breaker.execute(fn, 'openai').catch(() => {});

      expect(breaker.getState('openai')).toBe(CircuitState.OPEN);
    });
  });

  describe('Multiple providers', () => {
    it('should track state independently per provider', async () => {
      const failFn = vi.fn().mockRejectedValue(new Error('failure'));
      const successFn = vi.fn().mockResolvedValue('success');

      // Fail OpenAI
      for (let i = 0; i < 3; i++) {
        await breaker.execute(failFn, 'openai').catch(() => {});
      }

      // Succeed with Anthropic
      await breaker.execute(successFn, 'anthropic');

      expect(breaker.getState('openai')).toBe(CircuitState.OPEN);
      expect(breaker.getState('anthropic')).toBe(CircuitState.CLOSED);
    });
  });

  describe('Metrics', () => {
    it('should track failures and successes', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('failure'))
        .mockResolvedValueOnce('success');

      await breaker.execute(fn, 'openai').catch(() => {});
      await breaker.execute(fn, 'openai');

      const metrics = breaker.getProviderMetrics('openai');

      expect(metrics.failures).toBe(0); // Reset on success
      expect(metrics.successes).toBe(1);
      expect(metrics.state).toBe(CircuitState.CLOSED);
    });

    it('should track last failure time', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('failure'));

      const before = Date.now();
      await breaker.execute(fn, 'openai').catch(() => {});
      const after = Date.now();

      const metrics = breaker.getProviderMetrics('openai');

      expect(metrics.lastFailureTime).toBeGreaterThanOrEqual(before);
      expect(metrics.lastFailureTime).toBeLessThanOrEqual(after);
    });
  });

  describe('Reset', () => {
    it('should reset specific provider', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('failure'));

      // Open circuit
      for (let i = 0; i < 3; i++) {
        await breaker.execute(fn, 'openai').catch(() => {});
      }

      expect(breaker.getState('openai')).toBe(CircuitState.OPEN);

      breaker.reset('openai');

      expect(breaker.getState('openai')).toBe(CircuitState.CLOSED);
    });

    it('should reset all providers', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('failure'));

      // Open multiple circuits
      for (let i = 0; i < 3; i++) {
        await breaker.execute(fn, 'openai').catch(() => {});
        await breaker.execute(fn, 'anthropic').catch(() => {});
      }

      breaker.resetAll();

      expect(breaker.getState('openai')).toBe(CircuitState.CLOSED);
      expect(breaker.getState('anthropic')).toBe(CircuitState.CLOSED);
    });
  });

  describe('Monitoring period', () => {
    it('should reset failures after monitoring period', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 100,
        monitoringPeriod: 100, // Short period for testing
      });

      const fn = vi.fn().mockRejectedValue(new Error('failure'));

      // 2 failures
      await breaker.execute(fn, 'openai').catch(() => {});
      await breaker.execute(fn, 'openai').catch(() => {});

      // Wait for monitoring period to expire
      await sleep(150);

      // 2 more failures (should not open because previous failures expired)
      await breaker.execute(fn, 'openai').catch(() => {});
      await breaker.execute(fn, 'openai').catch(() => {});

      expect(breaker.getState('openai')).toBe(CircuitState.CLOSED);
    });
  });
});
