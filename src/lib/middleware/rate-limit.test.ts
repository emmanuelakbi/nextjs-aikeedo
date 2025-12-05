/**
 * Rate Limiting Tests
 *
 * Tests for Redis-based and in-memory rate limiting
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RedisRateLimiter } from './redis-rate-limiter';

describe('RedisRateLimiter', () => {
  let rateLimiter: RedisRateLimiter;

  beforeEach(() => {
    // Create a new instance for each test
    // Note: These tests will use in-memory fallback if Redis is not configured
    rateLimiter = new RedisRateLimiter();
  });

  afterEach(async () => {
    // Clean up
    if (rateLimiter) {
      await rateLimiter.disconnect();
    }
  });

  describe('Basic Rate Limiting', () => {
    it('should allow requests within limit', async () => {
      const config = { windowMs: 60000, maxRequests: 10 };
      const key = `test:allow:${Date.now()}`;

      const result = await rateLimiter.checkLimit(key, config);

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(10);
      expect(result.remaining).toBeGreaterThanOrEqual(0);
      expect(result.resetTime).toBeGreaterThan(Date.now());
    });

    it('should block requests exceeding limit', async () => {
      const config = { windowMs: 60000, maxRequests: 3 };
      const key = `test:block:${Date.now()}`;

      // Make requests up to limit
      await rateLimiter.checkLimit(key, config);
      await rateLimiter.checkLimit(key, config);
      await rateLimiter.checkLimit(key, config);

      // This should be blocked
      const result = await rateLimiter.checkLimit(key, config);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should reset after window expires', async () => {
      const config = { windowMs: 100, maxRequests: 2 }; // 100ms window
      const key = `test:reset:${Date.now()}`;

      // Use up the limit
      await rateLimiter.checkLimit(key, config);
      await rateLimiter.checkLimit(key, config);

      // Should be blocked
      const blocked = await rateLimiter.checkLimit(key, config);
      expect(blocked.allowed).toBe(false);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should be allowed again
      const allowed = await rateLimiter.checkLimit(key, config);
      expect(allowed.allowed).toBe(true);
    });
  });

  describe('Multi-level Rate Limiting', () => {
    it('should enforce per-user limits', async () => {
      const config = { windowMs: 60000, maxRequests: 5 };
      const identifiers = {
        userId: 'user-123',
        workspaceId: 'workspace-456',
        ip: '192.168.1.1',
      };

      const result = await rateLimiter.checkMultipleLimit(
        identifiers,
        { user: config },
        'test-endpoint'
      );

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(5);
    });

    it('should enforce per-workspace limits', async () => {
      const config = { windowMs: 60000, maxRequests: 10 };
      const identifiers = {
        workspaceId: 'workspace-789',
      };

      const result = await rateLimiter.checkMultipleLimit(
        identifiers,
        { workspace: config },
        'test-endpoint'
      );

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(10);
    });

    it('should enforce per-IP limits', async () => {
      const config = { windowMs: 60000, maxRequests: 20 };
      const identifiers = {
        ip: '10.0.0.1',
      };

      const result = await rateLimiter.checkMultipleLimit(
        identifiers,
        { ip: config },
        'test-endpoint'
      );

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(20);
    });

    it('should return most restrictive limit', async () => {
      const identifiers = {
        userId: `user-${Date.now()}`,
        workspaceId: `workspace-${Date.now()}`,
        ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
      };

      const configs = {
        user: { windowMs: 60000, maxRequests: 2 }, // Most restrictive
        workspace: { windowMs: 60000, maxRequests: 100 },
        ip: { windowMs: 60000, maxRequests: 50 },
      };

      // Use up user limit
      await rateLimiter.checkMultipleLimit(identifiers, configs, 'test');
      await rateLimiter.checkMultipleLimit(identifiers, configs, 'test');

      // Should be blocked by user limit
      const result = await rateLimiter.checkMultipleLimit(
        identifiers,
        configs,
        'test'
      );

      expect(result.allowed).toBe(false);
      expect(result.limit).toBe(2); // User limit
    });
  });

  describe('Rate Limit Status', () => {
    it('should get status without incrementing', async () => {
      const config = { windowMs: 60000, maxRequests: 10 };
      const key = `test:status:${Date.now()}`;

      // Make one request
      await rateLimiter.checkLimit(key, config);

      // Get status multiple times
      const status1 = await rateLimiter.getStatus(key, config);
      const status2 = await rateLimiter.getStatus(key, config);

      expect(status1.remaining).toBe(status2.remaining);
      expect(status1.remaining).toBe(9); // Should still be 9
    });
  });

  describe('Rate Limit Reset', () => {
    it('should reset rate limit for a key', async () => {
      const config = { windowMs: 60000, maxRequests: 2 };
      const key = `test:reset-key:${Date.now()}`;

      // Use up the limit
      await rateLimiter.checkLimit(key, config);
      await rateLimiter.checkLimit(key, config);

      // Should be blocked
      const blocked = await rateLimiter.checkLimit(key, config);
      expect(blocked.allowed).toBe(false);

      // Reset the limit
      await rateLimiter.resetLimit(key);

      // Should be allowed again
      const allowed = await rateLimiter.checkLimit(key, config);
      expect(allowed.allowed).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should fail open if Redis is unavailable', async () => {
      // Create limiter with invalid Redis URL
      const invalidLimiter = new RedisRateLimiter('redis://invalid:9999');

      const config = { windowMs: 60000, maxRequests: 10 };
      const key = `test:failopen:${Date.now()}`;

      // Should allow request even if Redis fails
      const result = await invalidLimiter.checkLimit(key, config);

      expect(result.allowed).toBe(true);

      await invalidLimiter.disconnect();
    });
  });

  describe('Sliding Window', () => {
    it('should implement sliding window correctly', async () => {
      const config = { windowMs: 1000, maxRequests: 3 }; // 3 per second
      const key = `test:sliding:${Date.now()}`;

      // Make 3 requests immediately
      const r1 = await rateLimiter.checkLimit(key, config);
      const r2 = await rateLimiter.checkLimit(key, config);
      const r3 = await rateLimiter.checkLimit(key, config);

      expect(r1.allowed).toBe(true);
      expect(r2.allowed).toBe(true);
      expect(r3.allowed).toBe(true);

      // 4th request should be blocked
      const r4 = await rateLimiter.checkLimit(key, config);
      expect(r4.allowed).toBe(false);

      // Wait 600ms (more than half the window)
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Should still be blocked (sliding window)
      const r5 = await rateLimiter.checkLimit(key, config);
      expect(r5.allowed).toBe(false);

      // Wait another 500ms (total 1100ms, first requests expired)
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Should be allowed now
      const r6 = await rateLimiter.checkLimit(key, config);
      expect(r6.allowed).toBe(true);
    });
  });
});
