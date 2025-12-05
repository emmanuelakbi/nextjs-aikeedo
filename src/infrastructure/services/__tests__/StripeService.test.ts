import { describe, it, expect, beforeEach } from 'vitest';
import {
  StripeService,
  StripeNotConfiguredError,
} from '../StripeService';

describe('StripeService', () => {
  let stripeService: StripeService;

  beforeEach(() => {
    stripeService = StripeService.getInstance();
  });

  describe('getInstance', () => {
    it('should return a singleton instance', () => {
      const instance1 = StripeService.getInstance();
      const instance2 = StripeService.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('isConfigured', () => {
    it('should return boolean indicating if Stripe is configured', () => {
      const isConfigured = stripeService.isConfigured();
      expect(typeof isConfigured).toBe('boolean');
    });
  });

  describe('getPublishableKey', () => {
    it('should return publishable key or undefined', () => {
      const key = stripeService.getPublishableKey();
      expect(key === undefined || typeof key === 'string').toBe(true);
    });
  });

  describe('getWebhookSecret', () => {
    it('should return webhook secret or undefined', () => {
      const secret = stripeService.getWebhookSecret();
      expect(secret === undefined || typeof secret === 'string').toBe(true);
    });
  });

  describe('getClient', () => {
    it('should throw StripeNotConfiguredError if Stripe is not configured', () => {
      if (!stripeService.isConfigured()) {
        expect(() => stripeService.getClient()).toThrow(
          StripeNotConfiguredError
        );
      }
    });

    it('should return Stripe client if configured', () => {
      if (stripeService.isConfigured()) {
        const client = stripeService.getClient();
        expect(client).toBeDefined();
        expect(client.customers).toBeDefined();
        expect(client.subscriptions).toBeDefined();
      }
    });
  });
});
