import { describe, it, expect } from 'vitest';
import {
  formatAmountForStripe,
  formatAmountFromStripe,
  formatCurrency,
  getSubscriptionStatusText,
  isSubscriptionActive,
  calculateTrialDaysRemaining,
  generateIdempotencyKey,
  StripeWebhookEvents,
} from '../stripe';

describe('Stripe Utilities', () => {
  describe('formatAmountForStripe', () => {
    it('should convert dollars to cents', () => {
      expect(formatAmountForStripe(10)).toBe(1000);
      expect(formatAmountForStripe(9.99)).toBe(999);
      expect(formatAmountForStripe(0.5)).toBe(50);
    });

    it('should round to nearest cent', () => {
      expect(formatAmountForStripe(9.999)).toBe(1000);
      expect(formatAmountForStripe(9.994)).toBe(999);
    });
  });

  describe('formatAmountFromStripe', () => {
    it('should convert cents to dollars', () => {
      expect(formatAmountFromStripe(1000)).toBe(10);
      expect(formatAmountFromStripe(999)).toBe(9.99);
      expect(formatAmountFromStripe(50)).toBe(0.5);
    });
  });

  describe('formatCurrency', () => {
    it('should format amount as currency', () => {
      const formatted = formatCurrency(1000);
      expect(formatted).toContain('10');
      expect(formatted).toContain('$');
    });

    it('should handle different currencies', () => {
      const formatted = formatCurrency(1000, 'EUR');
      expect(formatted).toContain('10');
    });
  });

  describe('getSubscriptionStatusText', () => {
    it('should return human-readable status text', () => {
      expect(getSubscriptionStatusText('active')).toBe('Active');
      expect(getSubscriptionStatusText('canceled')).toBe('Canceled');
      expect(getSubscriptionStatusText('trialing')).toBe('Trial');
      expect(getSubscriptionStatusText('past_due')).toBe('Past Due');
    });

    it('should return original status for unknown statuses', () => {
      expect(getSubscriptionStatusText('unknown_status')).toBe(
        'unknown_status'
      );
    });
  });

  describe('isSubscriptionActive', () => {
    it('should return true for active statuses', () => {
      expect(isSubscriptionActive('active')).toBe(true);
      expect(isSubscriptionActive('trialing')).toBe(true);
    });

    it('should return false for inactive statuses', () => {
      expect(isSubscriptionActive('canceled')).toBe(false);
      expect(isSubscriptionActive('past_due')).toBe(false);
      expect(isSubscriptionActive('unpaid')).toBe(false);
    });
  });

  describe('calculateTrialDaysRemaining', () => {
    it('should return 0 for null trial end', () => {
      expect(calculateTrialDaysRemaining(null)).toBe(0);
    });

    it('should calculate days remaining correctly', () => {
      const now = Math.floor(Date.now() / 1000);
      const threeDaysFromNow = now + 3 * 24 * 60 * 60;

      const daysRemaining = calculateTrialDaysRemaining(threeDaysFromNow);
      expect(daysRemaining).toBeGreaterThanOrEqual(2);
      expect(daysRemaining).toBeLessThanOrEqual(3);
    });

    it('should return 0 for past trial end dates', () => {
      const now = Math.floor(Date.now() / 1000);
      const yesterday = now - 24 * 60 * 60;

      expect(calculateTrialDaysRemaining(yesterday)).toBe(0);
    });
  });

  describe('generateIdempotencyKey', () => {
    it('should generate unique keys', () => {
      const key1 = generateIdempotencyKey();
      const key2 = generateIdempotencyKey();

      expect(key1).not.toBe(key2);
    });

    it('should include prefix', () => {
      const key = generateIdempotencyKey('test');
      expect(key).toContain('test_');
    });

    it('should use default prefix', () => {
      const key = generateIdempotencyKey();
      expect(key).toContain('idem_');
    });
  });

  describe('StripeWebhookEvents', () => {
    it('should have checkout events', () => {
      expect(StripeWebhookEvents.CHECKOUT_SESSION_COMPLETED).toBe(
        'checkout.session.completed'
      );
      expect(StripeWebhookEvents.CHECKOUT_SESSION_EXPIRED).toBe(
        'checkout.session.expired'
      );
    });

    it('should have subscription events', () => {
      expect(StripeWebhookEvents.CUSTOMER_SUBSCRIPTION_CREATED).toBe(
        'customer.subscription.created'
      );
      expect(StripeWebhookEvents.CUSTOMER_SUBSCRIPTION_UPDATED).toBe(
        'customer.subscription.updated'
      );
      expect(StripeWebhookEvents.CUSTOMER_SUBSCRIPTION_DELETED).toBe(
        'customer.subscription.deleted'
      );
    });

    it('should have invoice events', () => {
      expect(StripeWebhookEvents.INVOICE_PAID).toBe('invoice.paid');
      expect(StripeWebhookEvents.INVOICE_PAYMENT_FAILED).toBe(
        'invoice.payment_failed'
      );
    });
  });
});
