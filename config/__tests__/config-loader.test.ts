/**
 * Configuration Loader Tests
 */

import { describe, it, expect } from 'vitest';
import { appConfig } from '../app.config';

describe('Configuration System', () => {
  it('should have default configuration', () => {
    expect(appConfig).toBeDefined();
    expect(appConfig.features).toBeDefined();
    expect(appConfig.credits).toBeDefined();
    expect(appConfig.affiliate).toBeDefined();
  });

  it('should have correct default values', () => {
    expect(appConfig.credits.trialCredits).toBe(100);
    expect(appConfig.affiliate.commissionRate).toBe(0.2);
    expect(appConfig.rateLimits.api.default).toBe(60);
  });

  it('should have all required configuration sections', () => {
    const requiredSections = [
      'features',
      'aiProviders',
      'credits',
      'subscriptionPlans',
      'affiliate',
      'rateLimits',
      'circuitBreaker',
      'retry',
      'session',
      'security',
      'email',
      'pagination',
      'cache',
      'auditLog',
      'moderation',
      'ui',
      'development',
    ];

    requiredSections.forEach((section) => {
      expect(appConfig[section as keyof typeof appConfig]).toBeDefined();
    });
  });

  it('should have valid credit rates', () => {
    // All rates should be positive numbers
    Object.values(appConfig.credits.text).forEach((rate: any) => {
      expect(typeof rate).toBe('number');
      expect(rate).toBeGreaterThan(0);
    });

    Object.values(appConfig.credits.image).forEach((rate: any) => {
      expect(typeof rate).toBe('number');
      expect(rate).toBeGreaterThan(0);
    });
  });

  it('should have valid affiliate settings', () => {
    expect(appConfig.affiliate.commissionRate).toBeGreaterThan(0);
    expect(appConfig.affiliate.commissionRate).toBeLessThanOrEqual(1);
    expect(appConfig.affiliate.minimumPayout).toBeGreaterThan(0);
    expect(appConfig.affiliate.cookieDuration).toBeGreaterThan(0);
  });

  it('should have valid rate limits', () => {
    expect(appConfig.rateLimits.api.default).toBeGreaterThan(0);
    expect(appConfig.rateLimits.api.ai).toBeGreaterThan(0);
    expect(appConfig.rateLimits.upload.maxFileSize).toBeGreaterThan(0);
  });

  it('should have valid security settings', () => {
    expect(appConfig.security.bcryptRounds).toBeGreaterThanOrEqual(10);
    expect(appConfig.security.bcryptRounds).toBeLessThanOrEqual(15);
    expect(appConfig.security.passwordMinLength).toBeGreaterThan(0);
  });

  it('should have valid feature flags', () => {
    expect(typeof appConfig.features.authentication).toBe('boolean');
    expect(typeof appConfig.features.workspaces).toBe('boolean');
    expect(typeof appConfig.features.billing).toBe('boolean');
  });

  it('should have valid subscription plans', () => {
    expect(appConfig.subscriptionPlans.starter).toBeDefined();
    expect(appConfig.subscriptionPlans.starter.monthlyCredits).toBeGreaterThan(
      0
    );
    expect(appConfig.subscriptionPlans.starter.price).toBeGreaterThanOrEqual(0);
  });

  it('should have valid AI provider configuration', () => {
    expect(appConfig.aiProviders.fallbackOrder).toBeDefined();
    expect(Array.isArray(appConfig.aiProviders.fallbackOrder)).toBe(true);
    expect(appConfig.aiProviders.defaults).toBeDefined();
  });
});
