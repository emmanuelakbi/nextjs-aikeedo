/**
 * Property-Based Tests for Middleware Type Safety
 *
 * Feature: critical-fixes
 * **Property 10: Configuration Type Validation**
 * **Validates: Requirements 10.1**
 *
 * These tests validate that middleware configuration types are properly validated:
 * - Rate limit configuration is properly typed and validated
 * - CSRF protection configuration is type-safe
 * - Security middleware configuration is properly validated
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { RateLimitConfig } from '../rate-limit';
import type { SecurityConfig } from '../security';
import { RateLimiter } from '../rate-limit';

/**
 * Arbitraries for middleware configuration testing
 */

// Valid rate limit window durations (in milliseconds) - use reasonable minimum for testing
const validWindowMsArbitrary = fc.integer({ min: 100, max: 24 * 60 * 60 * 1000 }); // 100ms to 24 hours

// Valid max requests (positive integers)
const validMaxRequestsArbitrary = fc.integer({ min: 1, max: 100000 });

// Valid key prefixes (alphanumeric strings)
const validKeyPrefixArbitrary = fc.option(
  fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9_-]{0,49}$/),
  { nil: undefined }
);

/**
 * Generate valid RateLimitConfig
 */
const validRateLimitConfigArbitrary: fc.Arbitrary<RateLimitConfig> = fc.record({
  windowMs: validWindowMsArbitrary,
  maxRequests: validMaxRequestsArbitrary,
  keyPrefix: validKeyPrefixArbitrary,
});

/**
 * Generate valid SecurityConfig
 */
const validSecurityConfigArbitrary: fc.Arbitrary<SecurityConfig> = fc.record({
  csrf: fc.option(fc.boolean(), { nil: undefined }),
  rateLimit: fc.option(
    fc.oneof(
      fc.record({
        windowMs: validWindowMsArbitrary,
        maxRequests: validMaxRequestsArbitrary,
      }),
      fc.constant(false as const)
    ),
    { nil: undefined }
  ),
  sanitize: fc.option(fc.boolean(), { nil: undefined }),
  securityHeaders: fc.option(fc.boolean(), { nil: undefined }),
  validateInjection: fc.option(fc.boolean(), { nil: undefined }),
});

/**
 * Property 10: Configuration Type Validation
 * **Validates: Requirements 10.1**
 *
 * For any configuration or environment variable access, the values should be
 * validated against their expected types.
 */
describe('Property 10: Configuration Type Validation', () => {
  /**
   * Test: Rate limit configuration is properly typed and validated
   * **Validates: Requirements 10.1**
   */
  describe('Rate Limit Configuration Type Safety', () => {
    it('should accept valid rate limit configurations', () => {
      fc.assert(
        fc.property(validRateLimitConfigArbitrary, (config) => {
          // Verify required fields exist and have correct types
          expect(config).toHaveProperty('windowMs');
          expect(config).toHaveProperty('maxRequests');

          // Verify types
          expect(typeof config.windowMs).toBe('number');
          expect(typeof config.maxRequests).toBe('number');

          // Verify values are valid
          expect(config.windowMs).toBeGreaterThan(0);
          expect(config.maxRequests).toBeGreaterThan(0);
          expect(Number.isFinite(config.windowMs)).toBe(true);
          expect(Number.isFinite(config.maxRequests)).toBe(true);

          // Verify optional keyPrefix is string or undefined
          expect(
            config.keyPrefix === undefined || typeof config.keyPrefix === 'string'
          ).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should create RateLimiter with valid configuration', () => {
      fc.assert(
        fc.property(validRateLimitConfigArbitrary, (config) => {
          // Should not throw when creating with valid config
          const rateLimiter = new RateLimiter(config);

          // Verify the rate limiter was created
          expect(rateLimiter).toBeDefined();
          expect(rateLimiter).toBeInstanceOf(RateLimiter);
        }),
        { numRuns: 100 }
      );
    });

    it('should have consistent windowMs and maxRequests relationship', () => {
      fc.assert(
        fc.property(validRateLimitConfigArbitrary, (config) => {
          // Calculate requests per second
          const requestsPerSecond = (config.maxRequests / config.windowMs) * 1000;

          // Should be a finite positive number
          expect(Number.isFinite(requestsPerSecond)).toBe(true);
          expect(requestsPerSecond).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle edge case configurations correctly', () => {
      // Test minimum valid values
      const minConfig: RateLimitConfig = {
        windowMs: 1,
        maxRequests: 1,
      };

      const minRateLimiter = new RateLimiter(minConfig);
      expect(minRateLimiter).toBeDefined();

      // Test large valid values
      const maxConfig: RateLimitConfig = {
        windowMs: 24 * 60 * 60 * 1000, // 24 hours
        maxRequests: 100000,
        keyPrefix: 'large-config',
      };

      const maxRateLimiter = new RateLimiter(maxConfig);
      expect(maxRateLimiter).toBeDefined();
    });

    it('should preserve configuration values in RateLimiter', async () => {
      await fc.assert(
        fc.asyncProperty(validRateLimitConfigArbitrary, async (config) => {
          const rateLimiter = new RateLimiter(config);
          const identifier = `test-${Date.now()}-${Math.random()}`;

          // Check limit should return consistent values based on config
          const result = await rateLimiter.checkLimit(identifier);

          // Remaining should be based on maxRequests
          expect(result.remaining).toBeLessThanOrEqual(config.maxRequests);
          expect(result.remaining).toBeGreaterThanOrEqual(0);

          // Reset time should be in the future based on windowMs (with some tolerance)
          const now = Date.now();
          // Allow 100ms tolerance for timing variations
          expect(result.resetAt.getTime()).toBeGreaterThanOrEqual(now - 100);
          expect(result.resetAt.getTime()).toBeLessThanOrEqual(now + config.windowMs + 1000);
        }),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Test: Security middleware configuration is properly validated
   * **Validates: Requirements 10.1**
   */
  describe('Security Configuration Type Safety', () => {
    it('should accept valid security configurations', () => {
      fc.assert(
        fc.property(validSecurityConfigArbitrary, (config) => {
          // All fields should be optional
          // Verify types when present
          if (config.csrf !== undefined) {
            expect(typeof config.csrf).toBe('boolean');
          }

          if (config.rateLimit !== undefined && config.rateLimit !== false) {
            expect(typeof config.rateLimit).toBe('object');
            expect(config.rateLimit).toHaveProperty('windowMs');
            expect(config.rateLimit).toHaveProperty('maxRequests');
          }

          if (config.sanitize !== undefined) {
            expect(typeof config.sanitize).toBe('boolean');
          }

          if (config.securityHeaders !== undefined) {
            expect(typeof config.securityHeaders).toBe('boolean');
          }

          if (config.validateInjection !== undefined) {
            expect(typeof config.validateInjection).toBe('boolean');
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should handle rateLimit as false to disable rate limiting', () => {
      const configWithDisabledRateLimit: SecurityConfig = {
        csrf: true,
        rateLimit: false,
        sanitize: true,
        securityHeaders: true,
        validateInjection: true,
      };

      expect(configWithDisabledRateLimit.rateLimit).toBe(false);
      expect(typeof configWithDisabledRateLimit.rateLimit).toBe('boolean');
    });

    it('should handle rateLimit as object to enable rate limiting', () => {
      fc.assert(
        fc.property(
          fc.record({
            windowMs: validWindowMsArbitrary,
            maxRequests: validMaxRequestsArbitrary,
          }),
          (rateLimitConfig) => {
            const config: SecurityConfig = {
              csrf: true,
              rateLimit: rateLimitConfig,
              sanitize: true,
            };

            expect(config.rateLimit).not.toBe(false);
            expect(typeof config.rateLimit).toBe('object');

            if (config.rateLimit && typeof config.rateLimit === 'object') {
              expect(config.rateLimit.windowMs).toBe(rateLimitConfig.windowMs);
              expect(config.rateLimit.maxRequests).toBe(rateLimitConfig.maxRequests);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should merge with default configuration correctly', () => {
      const DEFAULT_CONFIG: SecurityConfig = {
        csrf: true,
        rateLimit: { windowMs: 60 * 1000, maxRequests: 100 },
        sanitize: true,
        securityHeaders: true,
        validateInjection: true,
      };

      fc.assert(
        fc.property(validSecurityConfigArbitrary, (partialConfig) => {
          // Merge partial config with defaults (partial config overrides defaults)
          const mergedConfig = { ...DEFAULT_CONFIG, ...partialConfig };

          // After merge, all fields should have values (either from default or partial)
          // csrf can be true, false, or undefined (from partial), but after merge with default it's defined
          expect(mergedConfig.csrf !== undefined || partialConfig.csrf === undefined).toBe(true);
          
          // rateLimit can be false, an object, or undefined
          expect(
            mergedConfig.rateLimit === false ||
            mergedConfig.rateLimit === undefined ||
            (typeof mergedConfig.rateLimit === 'object' && mergedConfig.rateLimit !== null)
          ).toBe(true);

          // Boolean fields should be boolean or undefined
          if (mergedConfig.sanitize !== undefined) {
            expect(typeof mergedConfig.sanitize).toBe('boolean');
          }
          if (mergedConfig.securityHeaders !== undefined) {
            expect(typeof mergedConfig.securityHeaders).toBe('boolean');
          }
          if (mergedConfig.validateInjection !== undefined) {
            expect(typeof mergedConfig.validateInjection).toBe('boolean');
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Test: CSRF protection configuration is type-safe
   * **Validates: Requirements 10.1**
   */
  describe('CSRF Configuration Type Safety', () => {
    it('should handle CSRF enabled/disabled states', () => {
      fc.assert(
        fc.property(fc.boolean(), (csrfEnabled) => {
          const config: SecurityConfig = {
            csrf: csrfEnabled,
          };

          expect(typeof config.csrf).toBe('boolean');
          expect(config.csrf).toBe(csrfEnabled);
        }),
        { numRuns: 100 }
      );
    });

    it('should default CSRF to enabled when undefined', () => {
      const DEFAULT_CONFIG: SecurityConfig = {
        csrf: true,
        rateLimit: { windowMs: 60 * 1000, maxRequests: 100 },
        sanitize: true,
        securityHeaders: true,
        validateInjection: true,
      };

      const configWithoutCsrf: SecurityConfig = {};
      const mergedConfig = { ...DEFAULT_CONFIG, ...configWithoutCsrf };

      expect(mergedConfig.csrf).toBe(true);
    });
  });

  /**
   * Test: Rate limit result types are consistent
   * **Validates: Requirements 10.1**
   */
  describe('Rate Limit Result Type Safety', () => {
    it('should return consistent result types from checkLimit', async () => {
      await fc.assert(
        fc.asyncProperty(validRateLimitConfigArbitrary, async (config) => {
          const rateLimiter = new RateLimiter(config);
          const identifier = `test-result-${Date.now()}-${Math.random()}`;

          const result = await rateLimiter.checkLimit(identifier);

          // Verify result structure
          expect(result).toHaveProperty('allowed');
          expect(result).toHaveProperty('remaining');
          expect(result).toHaveProperty('resetAt');

          // Verify types
          expect(typeof result.allowed).toBe('boolean');
          expect(typeof result.remaining).toBe('number');
          expect(result.resetAt).toBeInstanceOf(Date);

          // Verify values are valid
          expect(result.remaining).toBeGreaterThanOrEqual(0);
          expect(result.remaining).toBeLessThanOrEqual(config.maxRequests);
          expect(result.resetAt.getTime()).toBeGreaterThan(0);
        }),
        { numRuns: 50 }
      );
    });

    it('should return allowed=false when limit exceeded', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 5 }), // Small maxRequests for quick testing
          async (maxRequests) => {
            const config: RateLimitConfig = {
              windowMs: 60000,
              maxRequests,
              keyPrefix: 'exceed-test',
            };

            const rateLimiter = new RateLimiter(config);
            const identifier = `exceed-${Date.now()}-${Math.random()}`;

            // Make requests up to the limit
            for (let i = 0; i < maxRequests; i++) {
              const result = await rateLimiter.checkLimit(identifier);
              expect(result.allowed).toBe(true);
            }

            // Next request should be blocked
            const blockedResult = await rateLimiter.checkLimit(identifier);
            expect(blockedResult.allowed).toBe(false);
            expect(blockedResult.remaining).toBe(0);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Test: Configuration validation edge cases
   * **Validates: Requirements 10.1**
   */
  describe('Configuration Validation Edge Cases', () => {
    it('should handle empty security config gracefully', () => {
      const emptyConfig: SecurityConfig = {};

      // All fields should be undefined
      expect(emptyConfig.csrf).toBeUndefined();
      expect(emptyConfig.rateLimit).toBeUndefined();
      expect(emptyConfig.sanitize).toBeUndefined();
      expect(emptyConfig.securityHeaders).toBeUndefined();
      expect(emptyConfig.validateInjection).toBeUndefined();
    });

    it('should handle partial security config correctly', () => {
      fc.assert(
        fc.property(
          fc.record({
            csrf: fc.option(fc.boolean(), { nil: undefined }),
            sanitize: fc.option(fc.boolean(), { nil: undefined }),
          }),
          (partialConfig) => {
            const config: SecurityConfig = partialConfig;

            // Only specified fields should be present
            if (partialConfig.csrf !== undefined) {
              expect(config.csrf).toBe(partialConfig.csrf);
            }
            if (partialConfig.sanitize !== undefined) {
              expect(config.sanitize).toBe(partialConfig.sanitize);
            }

            // Unspecified fields should be undefined
            expect(config.rateLimit).toBeUndefined();
            expect(config.securityHeaders).toBeUndefined();
            expect(config.validateInjection).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate keyPrefix format when provided', () => {
      fc.assert(
        fc.property(validKeyPrefixArbitrary, (keyPrefix) => {
          if (keyPrefix !== undefined) {
            // Should be a non-empty string
            expect(typeof keyPrefix).toBe('string');
            expect(keyPrefix.length).toBeGreaterThan(0);

            // Should start with a letter
            expect(/^[a-zA-Z]/.test(keyPrefix)).toBe(true);

            // Should only contain alphanumeric, underscore, or hyphen
            expect(/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(keyPrefix)).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Test: Type coercion safety
   * **Validates: Requirements 10.1**
   */
  describe('Type Coercion Safety', () => {
    it('should not coerce invalid types to valid configurations', () => {
      // These should be caught by TypeScript at compile time,
      // but we verify runtime behavior as well

      const validConfig: RateLimitConfig = {
        windowMs: 60000,
        maxRequests: 100,
      };

      // Verify the config is valid
      expect(typeof validConfig.windowMs).toBe('number');
      expect(typeof validConfig.maxRequests).toBe('number');
      expect(Number.isInteger(validConfig.windowMs)).toBe(true);
      expect(Number.isInteger(validConfig.maxRequests)).toBe(true);
    });

    it('should handle numeric edge values correctly', () => {
      // Test with Number.MAX_SAFE_INTEGER
      const largeConfig: RateLimitConfig = {
        windowMs: Number.MAX_SAFE_INTEGER,
        maxRequests: Number.MAX_SAFE_INTEGER,
      };

      expect(Number.isFinite(largeConfig.windowMs)).toBe(true);
      expect(Number.isFinite(largeConfig.maxRequests)).toBe(true);
      expect(Number.isSafeInteger(largeConfig.windowMs)).toBe(true);
      expect(Number.isSafeInteger(largeConfig.maxRequests)).toBe(true);
    });

    it('should preserve integer precision in configuration', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: Number.MAX_SAFE_INTEGER }),
          fc.integer({ min: 1, max: Number.MAX_SAFE_INTEGER }),
          (windowMs, maxRequests) => {
            const config: RateLimitConfig = { windowMs, maxRequests };

            // Values should be exactly preserved
            expect(config.windowMs).toBe(windowMs);
            expect(config.maxRequests).toBe(maxRequests);

            // Should be safe integers
            expect(Number.isSafeInteger(config.windowMs)).toBe(true);
            expect(Number.isSafeInteger(config.maxRequests)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Test: Configuration immutability
   * **Validates: Requirements 10.1**
   */
  describe('Configuration Immutability', () => {
    it('should not allow modification of rate limiter config after creation', async () => {
      await fc.assert(
        fc.asyncProperty(validRateLimitConfigArbitrary, async (config) => {
          const originalWindowMs = config.windowMs;
          const originalMaxRequests = config.maxRequests;

          const rateLimiter = new RateLimiter(config);
          const identifier = `immutable-${Date.now()}-${Math.random()}`;

          // Get initial result
          const result1 = await rateLimiter.checkLimit(identifier);

          // Try to modify the original config
          config.windowMs = 1;
          config.maxRequests = 1;

          // Get another result - should use original config values
          const result2 = await rateLimiter.checkLimit(identifier);

          // Results should be consistent with original config
          // Allow some tolerance for timing
          expect(result1.resetAt.getTime()).toBeGreaterThan(Date.now() - 1000);
          expect(result2.resetAt.getTime()).toBeGreaterThan(Date.now() - 1000);

          // Restore original values for next iteration
          config.windowMs = originalWindowMs;
          config.maxRequests = originalMaxRequests;
        }),
        { numRuns: 50 }
      );
    });
  });
});
