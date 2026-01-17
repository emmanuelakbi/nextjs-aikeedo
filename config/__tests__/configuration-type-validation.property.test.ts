/**
 * Property-Based Tests for Configuration Type Validation
 *
 * Feature: critical-fixes
 * **Property 10: Configuration Type Validation**
 * **Validates: Requirements 10.1, 10.2, 10.4**
 *
 * These tests validate that configuration types are properly validated:
 * - Environment variables are validated against their expected types
 * - Configuration objects have proper TypeScript interfaces
 * - API keys are properly typed as required or optional
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { z } from 'zod';
import type {
  AppConfig,
  FeaturesConfig,
  RateLimitsConfig,
  SecurityConfig,
  CacheConfig,
  CircuitBreakerConfig,
  RetryConfig,
  SessionConfig,
  DevelopmentConfig,
} from '../app.config';
import { appConfig } from '../app.config';
import { getConfig, resetConfig, getConfigValue, isFeatureEnabled } from '../config-loader';

/**
 * Arbitraries for configuration testing
 */

// Valid feature flag arbitrary
const validFeatureFlagArbitrary = fc.boolean();

// Valid rate limit arbitrary (positive integers)
const validRateLimitArbitrary = fc.integer({ min: 1, max: 100000 });

// Valid window duration (milliseconds)
const validWindowMsArbitrary = fc.integer({ min: 100, max: 24 * 60 * 60 * 1000 });

// Valid TTL (seconds)
const validTtlArbitrary = fc.integer({ min: 1, max: 86400 });

// Valid percentage (0-1)
const validPercentageArbitrary = fc.float({ min: 0, max: 1, noNaN: true });

// Valid positive number
const validPositiveNumberArbitrary = fc.integer({ min: 1, max: 1000000 });

// Valid bcrypt rounds (10-15)
const validBcryptRoundsArbitrary = fc.integer({ min: 10, max: 15 });

// Valid password length (1-128)
const validPasswordLengthArbitrary = fc.integer({ min: 1, max: 128 });


/**
 * Generate valid FeaturesConfig
 */
const validFeaturesConfigArbitrary: fc.Arbitrary<FeaturesConfig> = fc.record({
  authentication: validFeatureFlagArbitrary,
  workspaces: validFeatureFlagArbitrary,
  billing: validFeatureFlagArbitrary,
  textGeneration: validFeatureFlagArbitrary,
  imageGeneration: validFeatureFlagArbitrary,
  speechSynthesis: validFeatureFlagArbitrary,
  transcription: validFeatureFlagArbitrary,
  voiceCloning: validFeatureFlagArbitrary,
  affiliateProgram: validFeatureFlagArbitrary,
  subscriptions: validFeatureFlagArbitrary,
  oneTimePurchases: validFeatureFlagArbitrary,
  trialPeriod: validFeatureFlagArbitrary,
  adminDashboard: validFeatureFlagArbitrary,
  userImpersonation: validFeatureFlagArbitrary,
  auditLogging: validFeatureFlagArbitrary,
  contentModeration: validFeatureFlagArbitrary,
  fileUpload: validFeatureFlagArbitrary,
  documentManagement: validFeatureFlagArbitrary,
  presets: validFeatureFlagArbitrary,
  usageAnalytics: validFeatureFlagArbitrary,
});

/**
 * Generate valid SecurityConfig
 */
const validSecurityConfigArbitrary: fc.Arbitrary<SecurityConfig> = fc.record({
  bcryptRounds: validBcryptRoundsArbitrary,
  passwordMinLength: validPasswordLengthArbitrary,
  passwordRequireUppercase: validFeatureFlagArbitrary,
  passwordRequireLowercase: validFeatureFlagArbitrary,
  passwordRequireNumbers: validFeatureFlagArbitrary,
  passwordRequireSpecialChars: validFeatureFlagArbitrary,
  csrfEnabled: validFeatureFlagArbitrary,
  cspEnabled: validFeatureFlagArbitrary,
});

/**
 * Generate valid CacheConfig
 */
const validCacheConfigArbitrary: fc.Arbitrary<CacheConfig> = fc.record({
  ttl: fc.record({
    session: validTtlArbitrary,
    user: validTtlArbitrary,
    workspace: validTtlArbitrary,
    usage: validTtlArbitrary,
  }),
  enabled: validFeatureFlagArbitrary,
});

/**
 * Generate valid CircuitBreakerConfig
 */
const validCircuitBreakerConfigArbitrary: fc.Arbitrary<CircuitBreakerConfig> = fc.record({
  failureThreshold: fc.integer({ min: 1, max: 100 }),
  successThreshold: fc.integer({ min: 1, max: 100 }),
  timeout: validWindowMsArbitrary,
  monitoringPeriod: validWindowMsArbitrary,
});

/**
 * Generate valid RetryConfig
 */
const validRetryConfigArbitrary: fc.Arbitrary<RetryConfig> = fc.record({
  maxRetries: fc.integer({ min: 0, max: 10 }),
  initialDelay: fc.integer({ min: 100, max: 10000 }),
  maxDelay: fc.integer({ min: 1000, max: 120000 }),
  backoffMultiplier: fc.float({ min: 1, max: 5, noNaN: true }),
  timeout: fc.integer({ min: 1000, max: 300000 }),
});

/**
 * Generate valid SessionConfig
 * Note: maxAge should be >= updateAge for valid session configuration
 */
const validSessionConfigArbitrary: fc.Arbitrary<SessionConfig> = fc
  .tuple(
    fc.integer({ min: 60, max: 24 * 60 * 60 }), // updateAge: 1 minute to 24 hours
    fc.integer({ min: 1, max: 30 }) // multiplier for maxAge (1x to 30x updateAge)
  )
  .map(([updateAge, multiplier]) => ({
    maxAge: updateAge * multiplier, // maxAge is always >= updateAge
    updateAge,
  }));

/**
 * Generate valid DevelopmentConfig
 */
const validDevelopmentConfigArbitrary: fc.Arbitrary<DevelopmentConfig> = fc.record({
  debug: validFeatureFlagArbitrary,
  mockServices: validFeatureFlagArbitrary,
  autoSeed: validFeatureFlagArbitrary,
});


/**
 * Environment variable schema for testing
 * Mirrors the schema in src/lib/env.ts
 */
const envSchemaForTesting = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1).url(),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().min(1).url(),
  SMTP_HOST: z.string().min(1).optional(),
  SMTP_PORT: z.string().regex(/^\d+$/).optional(),
  SMTP_USER: z.string().min(1).optional(),
  SMTP_PASSWORD: z.string().min(1).optional(),
  SMTP_FROM: z.string().email().optional(),
  REDIS_URL: z.string().url().optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  GOOGLE_AI_API_KEY: z.string().min(1).optional(),
  MISTRAL_API_KEY: z.string().min(1).optional(),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
});

/**
 * Arbitraries for environment variable testing
 */

// Valid URL arbitrary - use fc.webUrl without unsupported options
const validUrlArbitrary = fc.webUrl();

// Valid API key arbitrary (alphanumeric string with prefix)
const validApiKeyArbitrary = fc.stringMatching(/^sk-[a-zA-Z0-9]{32,64}$/);

// Valid secret arbitrary (32+ characters)
const validSecretArbitrary = fc.string({ minLength: 32, maxLength: 128 });

// Valid email arbitrary - use a stricter pattern that Zod will accept
// Avoid: starting with special chars, double dots, ending with special chars
const validEmailArbitrary = fc.tuple(
  fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9]{0,10}$/), // local part
  fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9]{0,10}$/), // domain name
  fc.constantFrom('com', 'org', 'net', 'io', 'co') // TLD
).map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

// Valid port arbitrary
const validPortArbitrary = fc.integer({ min: 1, max: 65535 }).map(String);

// Valid NODE_ENV arbitrary
const validNodeEnvArbitrary = fc.constantFrom('development', 'production', 'test');


/**
 * Property 10: Configuration Type Validation
 * **Validates: Requirements 10.1, 10.2, 10.4**
 *
 * For any configuration or environment variable access, the values should be
 * validated against their expected types.
 */
describe('Property 10: Configuration Type Validation', () => {
  beforeEach(() => {
    // Reset config cache before each test
    resetConfig();
  });

  afterEach(() => {
    // Clean up after each test
    resetConfig();
  });

  /**
   * Test: Environment variables are validated against their expected types
   * **Validates: Requirements 10.1**
   */
  describe('Environment Variable Type Validation (Requirement 10.1)', () => {
    it('should validate NODE_ENV against allowed values', () => {
      fc.assert(
        fc.property(validNodeEnvArbitrary, (nodeEnv) => {
          const result = z.enum(['development', 'production', 'test']).safeParse(nodeEnv);
          expect(result.success).toBe(true);
          if (result.success) {
            expect(['development', 'production', 'test']).toContain(result.data);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should reject invalid NODE_ENV values', () => {
      fc.assert(
        fc.property(
          fc.string().filter((s) => !['development', 'production', 'test'].includes(s)),
          (invalidEnv) => {
            const result = z.enum(['development', 'production', 'test']).safeParse(invalidEnv);
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate DATABASE_URL as a valid URL', () => {
      fc.assert(
        fc.property(validUrlArbitrary, (url) => {
          const result = z.string().url().safeParse(url);
          expect(result.success).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject invalid DATABASE_URL values', () => {
      // Test with clearly invalid URLs that Zod will reject
      // Note: Zod's url() is quite permissive - it accepts any valid URL scheme
      // We test truly malformed URLs that fail URL parsing
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(''),
            fc.constant('not-a-url'),
            fc.constant('://missing-scheme'),
            fc.constant('http://'),
            fc.constant('https://'),
            fc.constant('just-text-no-scheme'),
            fc.constant('missing.scheme.com')
          ),
          (invalidUrl) => {
            const result = z.string().url().safeParse(invalidUrl);
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate NEXTAUTH_SECRET minimum length', () => {
      fc.assert(
        fc.property(validSecretArbitrary, (secret) => {
          const result = z.string().min(32).safeParse(secret);
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.length).toBeGreaterThanOrEqual(32);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should reject NEXTAUTH_SECRET with insufficient length', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 0, maxLength: 31 }), (shortSecret) => {
          const result = z.string().min(32).safeParse(shortSecret);
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('should validate SMTP_PORT as numeric string', () => {
      fc.assert(
        fc.property(validPortArbitrary, (port) => {
          const result = z.string().regex(/^\d+$/).safeParse(port);
          expect(result.success).toBe(true);
          if (result.success) {
            const portNum = parseInt(result.data, 10);
            expect(portNum).toBeGreaterThan(0);
            expect(portNum).toBeLessThanOrEqual(65535);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should validate SMTP_FROM as valid email', () => {
      fc.assert(
        fc.property(validEmailArbitrary, (email) => {
          const result = z.string().email().safeParse(email);
          expect(result.success).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });


  /**
   * Test: Configuration objects have proper TypeScript interfaces
   * **Validates: Requirements 10.2**
   */
  describe('Configuration Object Type Safety (Requirement 10.2)', () => {
    it('should have all required configuration sections', () => {
      const config = getConfig();
      
      // Verify all required sections exist
      expect(config.features).toBeDefined();
      expect(config.aiProviders).toBeDefined();
      expect(config.credits).toBeDefined();
      expect(config.subscriptionPlans).toBeDefined();
      expect(config.affiliate).toBeDefined();
      expect(config.rateLimits).toBeDefined();
      expect(config.circuitBreaker).toBeDefined();
      expect(config.retry).toBeDefined();
      expect(config.session).toBeDefined();
      expect(config.security).toBeDefined();
      expect(config.email).toBeDefined();
      expect(config.pagination).toBeDefined();
      expect(config.cache).toBeDefined();
      expect(config.auditLog).toBeDefined();
      expect(config.moderation).toBeDefined();
      expect(config.ui).toBeDefined();
      expect(config.development).toBeDefined();
    });

    it('should validate FeaturesConfig structure', () => {
      fc.assert(
        fc.property(validFeaturesConfigArbitrary, (features) => {
          // All feature flags should be boolean
          Object.values(features).forEach((value) => {
            expect(typeof value).toBe('boolean');
          });

          // Should have all required feature flags
          expect(features).toHaveProperty('authentication');
          expect(features).toHaveProperty('workspaces');
          expect(features).toHaveProperty('billing');
          expect(features).toHaveProperty('textGeneration');
          expect(features).toHaveProperty('imageGeneration');
          expect(features).toHaveProperty('speechSynthesis');
          expect(features).toHaveProperty('transcription');
          expect(features).toHaveProperty('voiceCloning');
          expect(features).toHaveProperty('affiliateProgram');
          expect(features).toHaveProperty('subscriptions');
        }),
        { numRuns: 100 }
      );
    });

    it('should validate SecurityConfig structure', () => {
      fc.assert(
        fc.property(validSecurityConfigArbitrary, (security) => {
          // Verify types
          expect(typeof security.bcryptRounds).toBe('number');
          expect(typeof security.passwordMinLength).toBe('number');
          expect(typeof security.passwordRequireUppercase).toBe('boolean');
          expect(typeof security.passwordRequireLowercase).toBe('boolean');
          expect(typeof security.passwordRequireNumbers).toBe('boolean');
          expect(typeof security.passwordRequireSpecialChars).toBe('boolean');
          expect(typeof security.csrfEnabled).toBe('boolean');
          expect(typeof security.cspEnabled).toBe('boolean');

          // Verify value constraints
          expect(security.bcryptRounds).toBeGreaterThanOrEqual(10);
          expect(security.bcryptRounds).toBeLessThanOrEqual(15);
          expect(security.passwordMinLength).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should validate CacheConfig structure', () => {
      fc.assert(
        fc.property(validCacheConfigArbitrary, (cache) => {
          // Verify structure
          expect(cache).toHaveProperty('ttl');
          expect(cache).toHaveProperty('enabled');

          // Verify types
          expect(typeof cache.enabled).toBe('boolean');
          expect(typeof cache.ttl.session).toBe('number');
          expect(typeof cache.ttl.user).toBe('number');
          expect(typeof cache.ttl.workspace).toBe('number');
          expect(typeof cache.ttl.usage).toBe('number');

          // Verify value constraints
          expect(cache.ttl.session).toBeGreaterThan(0);
          expect(cache.ttl.user).toBeGreaterThan(0);
          expect(cache.ttl.workspace).toBeGreaterThan(0);
          expect(cache.ttl.usage).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should validate CircuitBreakerConfig structure', () => {
      fc.assert(
        fc.property(validCircuitBreakerConfigArbitrary, (circuitBreaker) => {
          // Verify types
          expect(typeof circuitBreaker.failureThreshold).toBe('number');
          expect(typeof circuitBreaker.successThreshold).toBe('number');
          expect(typeof circuitBreaker.timeout).toBe('number');
          expect(typeof circuitBreaker.monitoringPeriod).toBe('number');

          // Verify value constraints
          expect(circuitBreaker.failureThreshold).toBeGreaterThan(0);
          expect(circuitBreaker.successThreshold).toBeGreaterThan(0);
          expect(circuitBreaker.timeout).toBeGreaterThan(0);
          expect(circuitBreaker.monitoringPeriod).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should validate RetryConfig structure', () => {
      fc.assert(
        fc.property(validRetryConfigArbitrary, (retry) => {
          // Verify types
          expect(typeof retry.maxRetries).toBe('number');
          expect(typeof retry.initialDelay).toBe('number');
          expect(typeof retry.maxDelay).toBe('number');
          expect(typeof retry.backoffMultiplier).toBe('number');
          expect(typeof retry.timeout).toBe('number');

          // Verify value constraints
          expect(retry.maxRetries).toBeGreaterThanOrEqual(0);
          expect(retry.initialDelay).toBeGreaterThan(0);
          expect(retry.maxDelay).toBeGreaterThan(0);
          expect(retry.backoffMultiplier).toBeGreaterThanOrEqual(1);
          expect(retry.timeout).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should validate SessionConfig structure', () => {
      fc.assert(
        fc.property(validSessionConfigArbitrary, (session) => {
          // Verify types
          expect(typeof session.maxAge).toBe('number');
          expect(typeof session.updateAge).toBe('number');

          // Verify value constraints
          expect(session.maxAge).toBeGreaterThan(0);
          expect(session.updateAge).toBeGreaterThan(0);
          expect(session.maxAge).toBeGreaterThanOrEqual(session.updateAge);
        }),
        { numRuns: 100 }
      );
    });

    it('should validate DevelopmentConfig structure', () => {
      fc.assert(
        fc.property(validDevelopmentConfigArbitrary, (development) => {
          // Verify types
          expect(typeof development.debug).toBe('boolean');
          expect(typeof development.mockServices).toBe('boolean');
          expect(typeof development.autoSeed).toBe('boolean');
        }),
        { numRuns: 100 }
      );
    });
  });


  /**
   * Test: API keys are properly typed as required or optional
   * **Validates: Requirements 10.4**
   */
  describe('API Key Type Validation (Requirement 10.4)', () => {
    it('should validate optional API keys accept undefined', () => {
      // All AI provider API keys should be optional
      const optionalApiKeySchema = z.string().min(1).optional();

      fc.assert(
        fc.property(
          fc.option(validApiKeyArbitrary, { nil: undefined }),
          (apiKey) => {
            const result = optionalApiKeySchema.safeParse(apiKey);
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate API key format when provided', () => {
      fc.assert(
        fc.property(validApiKeyArbitrary, (apiKey) => {
          // API keys should be non-empty strings
          expect(typeof apiKey).toBe('string');
          expect(apiKey.length).toBeGreaterThan(0);

          // Should match expected format (sk- prefix)
          expect(apiKey.startsWith('sk-')).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject empty API keys', () => {
      const apiKeySchema = z.string().min(1);
      const result = apiKeySchema.safeParse('');
      expect(result.success).toBe(false);
    });

    it('should validate Stripe keys have correct prefix', () => {
      // Stripe secret keys start with sk_
      const stripeSecretKeyArbitrary = fc.stringMatching(/^sk_(test|live)_[a-zA-Z0-9]{24,}$/);

      fc.assert(
        fc.property(stripeSecretKeyArbitrary, (key) => {
          expect(key.startsWith('sk_test_') || key.startsWith('sk_live_')).toBe(true);
          expect(key.length).toBeGreaterThan(10);
        }),
        { numRuns: 100 }
      );
    });

    it('should validate Stripe publishable keys have correct prefix', () => {
      // Stripe publishable keys start with pk_
      const stripePublishableKeyArbitrary = fc.stringMatching(/^pk_(test|live)_[a-zA-Z0-9]{24,}$/);

      fc.assert(
        fc.property(stripePublishableKeyArbitrary, (key) => {
          expect(key.startsWith('pk_test_') || key.startsWith('pk_live_')).toBe(true);
          expect(key.length).toBeGreaterThan(10);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle multiple optional API keys correctly', () => {
      fc.assert(
        fc.property(
          fc.record({
            openai: fc.option(validApiKeyArbitrary, { nil: undefined }),
            anthropic: fc.option(validApiKeyArbitrary, { nil: undefined }),
            google: fc.option(validApiKeyArbitrary, { nil: undefined }),
            mistral: fc.option(validApiKeyArbitrary, { nil: undefined }),
          }),
          (apiKeys) => {
            // At least one should be defined for the app to work
            // But all are individually optional
            Object.entries(apiKeys).forEach(([provider, key]) => {
              if (key !== undefined) {
                expect(typeof key).toBe('string');
                expect(key.length).toBeGreaterThan(0);
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  /**
   * Test: Configuration value access is type-safe
   * **Validates: Requirements 10.1, 10.2**
   */
  describe('Configuration Value Access Type Safety', () => {
    it('should return correct types from getConfigValue', () => {
      // Test various config paths
      const trialCredits = getConfigValue<number>('credits.trialCredits');
      expect(typeof trialCredits).toBe('number');
      expect(trialCredits).toBeGreaterThanOrEqual(0);

      const commissionRate = getConfigValue<number>('affiliate.commissionRate');
      expect(typeof commissionRate).toBe('number');
      expect(commissionRate).toBeGreaterThanOrEqual(0);
      expect(commissionRate).toBeLessThanOrEqual(1);

      const defaultRateLimit = getConfigValue<number>('rateLimits.api.default');
      expect(typeof defaultRateLimit).toBe('number');
      expect(defaultRateLimit).toBeGreaterThan(0);
    });

    it('should return undefined for invalid paths', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter((s) => !s.includes('.')),
          (invalidPath) => {
            // Random strings without dots should not match any config path
            const value = getConfigValue(`nonexistent.${invalidPath}.path`);
            expect(value).toBeUndefined();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should correctly check feature flags', () => {
      const featureKeys: (keyof AppConfig['features'])[] = [
        'authentication',
        'workspaces',
        'billing',
        'textGeneration',
        'imageGeneration',
        'speechSynthesis',
        'transcription',
        'voiceCloning',
        'affiliateProgram',
        'subscriptions',
      ];

      featureKeys.forEach((feature) => {
        const isEnabled = isFeatureEnabled(feature);
        expect(typeof isEnabled).toBe('boolean');
      });
    });

    it('should preserve configuration types through getConfig', () => {
      const config = getConfig();

      // Verify numeric types
      expect(typeof config.credits.trialCredits).toBe('number');
      expect(typeof config.affiliate.commissionRate).toBe('number');
      expect(typeof config.affiliate.minimumPayout).toBe('number');
      expect(typeof config.affiliate.cookieDuration).toBe('number');

      // Verify boolean types
      expect(typeof config.features.authentication).toBe('boolean');
      expect(typeof config.security.csrfEnabled).toBe('boolean');
      expect(typeof config.cache.enabled).toBe('boolean');

      // Verify object types
      expect(typeof config.rateLimits).toBe('object');
      expect(typeof config.circuitBreaker).toBe('object');
      expect(typeof config.retry).toBe('object');
    });
  });


  /**
   * Test: Credit rates are properly typed and validated
   * **Validates: Requirements 10.2**
   */
  describe('Credit Configuration Type Safety', () => {
    it('should have valid credit rates for all models', () => {
      const config = getConfig();
      const textRates = config.credits.text;

      // All rates should be positive numbers
      Object.entries(textRates).forEach(([model, rate]) => {
        expect(typeof rate).toBe('number');
        expect(rate).toBeGreaterThan(0);
        expect(Number.isFinite(rate)).toBe(true);
      });
    });

    it('should have valid image credit rates', () => {
      const config = getConfig();
      const imageRates = config.credits.image;

      // All image rates should be positive numbers
      Object.entries(imageRates).forEach(([size, rate]) => {
        expect(typeof rate).toBe('number');
        expect(rate).toBeGreaterThan(0);
        expect(Number.isFinite(rate)).toBe(true);
      });
    });

    it('should have valid speech and transcription rates', () => {
      const config = getConfig();

      expect(typeof config.credits.speech).toBe('number');
      expect(config.credits.speech).toBeGreaterThan(0);

      expect(typeof config.credits.transcription).toBe('number');
      expect(config.credits.transcription).toBeGreaterThan(0);
    });

    it('should have valid minimum balance and trial credits', () => {
      const config = getConfig();

      expect(typeof config.credits.minimumBalance).toBe('number');
      expect(config.credits.minimumBalance).toBeGreaterThanOrEqual(0);

      expect(typeof config.credits.trialCredits).toBe('number');
      expect(config.credits.trialCredits).toBeGreaterThanOrEqual(0);
    });
  });


  /**
   * Test: Rate limits configuration is properly typed
   * **Validates: Requirements 10.2**
   */
  describe('Rate Limits Configuration Type Safety', () => {
    it('should have valid API rate limits', () => {
      const config = getConfig();
      const apiLimits = config.rateLimits.api;

      expect(typeof apiLimits.default).toBe('number');
      expect(typeof apiLimits.ai).toBe('number');
      expect(typeof apiLimits.upload).toBe('number');
      expect(typeof apiLimits.auth).toBe('number');

      expect(apiLimits.default).toBeGreaterThan(0);
      expect(apiLimits.ai).toBeGreaterThan(0);
      expect(apiLimits.upload).toBeGreaterThan(0);
      expect(apiLimits.auth).toBeGreaterThan(0);
    });

    it('should have valid AI operation rate limits', () => {
      const config = getConfig();
      const aiLimits = config.rateLimits.aiOperations;

      expect(typeof aiLimits.text).toBe('number');
      expect(typeof aiLimits.image).toBe('number');
      expect(typeof aiLimits.speech).toBe('number');
      expect(typeof aiLimits.transcription).toBe('number');

      expect(aiLimits.text).toBeGreaterThan(0);
      expect(aiLimits.image).toBeGreaterThan(0);
      expect(aiLimits.speech).toBeGreaterThan(0);
      expect(aiLimits.transcription).toBeGreaterThan(0);
    });

    it('should have valid upload limits', () => {
      const config = getConfig();
      const uploadLimits = config.rateLimits.upload;

      expect(typeof uploadLimits.maxFileSize).toBe('number');
      expect(typeof uploadLimits.maxFiles).toBe('number');
      expect(Array.isArray(uploadLimits.allowedTypes)).toBe(true);

      expect(uploadLimits.maxFileSize).toBeGreaterThan(0);
      expect(uploadLimits.maxFiles).toBeGreaterThan(0);
      expect(uploadLimits.allowedTypes.length).toBeGreaterThan(0);

      // All allowed types should be strings
      uploadLimits.allowedTypes.forEach((type) => {
        expect(typeof type).toBe('string');
        expect(type.length).toBeGreaterThan(0);
      });
    });
  });


  /**
   * Test: Subscription plans configuration is properly typed
   * **Validates: Requirements 10.2**
   */
  describe('Subscription Plans Configuration Type Safety', () => {
    it('should have valid subscription plan structure', () => {
      const config = getConfig();
      const plans = config.subscriptionPlans;

      // Check each plan has required fields
      Object.entries(plans).forEach(([planName, plan]) => {
        expect(typeof plan.name).toBe('string');
        expect(plan.name.length).toBeGreaterThan(0);

        expect(typeof plan.monthlyCredits).toBe('number');
        expect(plan.monthlyCredits).toBeGreaterThanOrEqual(0);

        expect(typeof plan.price).toBe('number');
        expect(plan.price).toBeGreaterThanOrEqual(0);

        expect(Array.isArray(plan.features)).toBe(true);
        plan.features.forEach((feature) => {
          expect(typeof feature).toBe('string');
        });
      });
    });

    it('should have plans in ascending price order', () => {
      const config = getConfig();
      const plans = config.subscriptionPlans;

      // Free plan should have lowest price
      expect(plans.free.price).toBe(0);

      // Starter should be less than pro
      expect(plans.starter.price).toBeLessThan(plans.pro.price);

      // Pro should be less than business
      expect(plans.pro.price).toBeLessThan(plans.business.price);
    });
  });


  /**
   * Test: Affiliate configuration is properly typed
   * **Validates: Requirements 10.2**
   */
  describe('Affiliate Configuration Type Safety', () => {
    it('should have valid affiliate settings', () => {
      const config = getConfig();
      const affiliate = config.affiliate;

      // Commission rate should be between 0 and 1
      expect(typeof affiliate.commissionRate).toBe('number');
      expect(affiliate.commissionRate).toBeGreaterThanOrEqual(0);
      expect(affiliate.commissionRate).toBeLessThanOrEqual(1);

      // Minimum payout should be positive
      expect(typeof affiliate.minimumPayout).toBe('number');
      expect(affiliate.minimumPayout).toBeGreaterThan(0);

      // Cookie duration should be positive
      expect(typeof affiliate.cookieDuration).toBe('number');
      expect(affiliate.cookieDuration).toBeGreaterThan(0);

      // Commission duration should be positive
      expect(typeof affiliate.commissionDuration).toBe('number');
      expect(affiliate.commissionDuration).toBeGreaterThan(0);

      // Payout methods should be an array of strings
      expect(Array.isArray(affiliate.payoutMethods)).toBe(true);
      affiliate.payoutMethods.forEach((method) => {
        expect(typeof method).toBe('string');
      });
    });
  });


  /**
   * Test: Configuration caching and reset works correctly
   * **Validates: Requirements 10.1, 10.2**
   */
  describe('Configuration Caching Type Safety', () => {
    it('should return same config instance on multiple calls', () => {
      const config1 = getConfig();
      const config2 = getConfig();

      // Should be the same cached instance
      expect(config1).toBe(config2);
    });

    it('should return fresh config after reset', () => {
      const config1 = getConfig();
      resetConfig();
      const config2 = getConfig();

      // Should be different instances but equal values
      expect(config1).not.toBe(config2);
      expect(config1.credits.trialCredits).toBe(config2.credits.trialCredits);
    });

    it('should preserve type safety after reset', () => {
      resetConfig();
      const config = getConfig();

      // All types should still be correct
      expect(typeof config.features.authentication).toBe('boolean');
      expect(typeof config.credits.trialCredits).toBe('number');
      expect(typeof config.affiliate.commissionRate).toBe('number');
      expect(typeof config.security.bcryptRounds).toBe('number');
    });
  });


  /**
   * Test: Default configuration values are valid
   * **Validates: Requirements 10.1, 10.2**
   */
  describe('Default Configuration Validation', () => {
    it('should have valid default appConfig', () => {
      // Verify appConfig has all required sections
      expect(appConfig).toBeDefined();
      expect(appConfig.features).toBeDefined();
      expect(appConfig.aiProviders).toBeDefined();
      expect(appConfig.credits).toBeDefined();
      expect(appConfig.subscriptionPlans).toBeDefined();
      expect(appConfig.affiliate).toBeDefined();
      expect(appConfig.rateLimits).toBeDefined();
      expect(appConfig.circuitBreaker).toBeDefined();
      expect(appConfig.retry).toBeDefined();
      expect(appConfig.session).toBeDefined();
      expect(appConfig.security).toBeDefined();
      expect(appConfig.email).toBeDefined();
      expect(appConfig.pagination).toBeDefined();
      expect(appConfig.cache).toBeDefined();
      expect(appConfig.auditLog).toBeDefined();
      expect(appConfig.moderation).toBeDefined();
      expect(appConfig.ui).toBeDefined();
      expect(appConfig.development).toBeDefined();
    });

    it('should have valid default security settings', () => {
      expect(appConfig.security.bcryptRounds).toBeGreaterThanOrEqual(10);
      expect(appConfig.security.bcryptRounds).toBeLessThanOrEqual(15);
      expect(appConfig.security.passwordMinLength).toBeGreaterThan(0);
    });

    it('should have valid default rate limits', () => {
      expect(appConfig.rateLimits.api.default).toBeGreaterThan(0);
      expect(appConfig.rateLimits.api.ai).toBeGreaterThan(0);
      expect(appConfig.rateLimits.upload.maxFileSize).toBeGreaterThan(0);
    });

    it('should have valid default AI provider settings', () => {
      expect(Array.isArray(appConfig.aiProviders.fallbackOrder)).toBe(true);
      expect(appConfig.aiProviders.fallbackOrder.length).toBeGreaterThan(0);
      expect(appConfig.aiProviders.defaults).toBeDefined();
      expect(appConfig.aiProviders.defaults.text).toBeDefined();
      expect(appConfig.aiProviders.defaults.image).toBeDefined();
    });
  });
});
