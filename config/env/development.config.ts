/**
 * Development Environment Configuration
 *
 * Overrides for development environment
 */

import type { AppConfig } from '../app.config';

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export const developmentConfig: DeepPartial<AppConfig> = {
  // Enable all features in development
  features: {
    adminDashboard: true,
    userImpersonation: true,
    auditLogging: true,
  },

  // More generous rate limits for development
  rateLimits: {
    api: {
      default: 1000,
      ai: 100,
      upload: 50,
      auth: 50,
    },
  },

  // Faster circuit breaker recovery
  circuitBreaker: {
    timeout: 10000, // 10 seconds
  },

  // Less aggressive retry
  retry: {
    maxRetries: 2,
    initialDelay: 500,
  },

  // Development settings
  development: {
    debug: true,
    mockServices: false,
    autoSeed: false,
  },

  // Shorter cache TTL for development
  cache: {
    ttl: {
      session: 300, // 5 minutes
      user: 60, // 1 minute
      workspace: 60, // 1 minute
      usage: 30, // 30 seconds
    },
  },
};

export default developmentConfig;
