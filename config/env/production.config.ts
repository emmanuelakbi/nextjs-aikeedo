/**
 * Production Environment Configuration
 *
 * Overrides for production environment
 */

import type { AppConfig } from '../app.config';

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export const productionConfig: DeepPartial<AppConfig> = {
  // Stricter rate limits for production
  rateLimits: {
    api: {
      default: 60,
      ai: 20,
      upload: 10,
      auth: 5,
    },
  },

  // Production circuit breaker settings
  circuitBreaker: {
    failureThreshold: 5,
    timeout: 60000, // 1 minute
  },

  // Production retry settings
  retry: {
    maxRetries: 3,
    initialDelay: 1000,
  },

  // Disable development features
  development: {
    debug: false,
    mockServices: false,
    autoSeed: false,
  },

  // Longer cache TTL for production
  cache: {
    ttl: {
      session: 3600, // 1 hour
      user: 300, // 5 minutes
      workspace: 300, // 5 minutes
      usage: 60, // 1 minute
    },
    enabled: true,
  },

  // Stricter security
  security: {
    bcryptRounds: 12,
    csrfEnabled: true,
    cspEnabled: true,
  },
};

export default productionConfig;
