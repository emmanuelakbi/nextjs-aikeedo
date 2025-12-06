/**
 * Test Environment Configuration
 *
 * Overrides for test environment
 */

import type { AppConfig } from '../app.config';

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export const testConfig: DeepPartial<AppConfig> = {
  // Disable external services in tests
  features: {
    affiliateProgram: true,
    subscriptions: true,
  },

  // No rate limits in tests
  rateLimits: {
    api: {
      default: 10000,
      ai: 10000,
      upload: 10000,
      auth: 10000,
    },
  },

  // Fast circuit breaker for tests
  circuitBreaker: {
    failureThreshold: 3,
    timeout: 1000, // 1 second
    monitoringPeriod: 5000, // 5 seconds
  },

  // Minimal retry in tests
  retry: {
    maxRetries: 1,
    initialDelay: 100,
    maxDelay: 1000,
  },

  // Short session for tests
  session: {
    maxAge: 3600, // 1 hour
  },

  // Fast bcrypt for tests
  security: {
    bcryptRounds: 10, // Minimum for speed
  },

  // Disable caching in tests
  cache: {
    enabled: false,
    ttl: {
      session: 60,
      user: 60,
      workspace: 60,
      usage: 60,
    },
  },

  // Test settings
  development: {
    debug: false,
    mockServices: true,
    autoSeed: false,
  },
};

export default testConfig;
