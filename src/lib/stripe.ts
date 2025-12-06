/**
 * Stripe utilities and helpers
 * Provides convenient access to Stripe service and related utilities
 */

import {
  stripeService,
  StripeService,
} from '../infrastructure/services/StripeService';
import {
  subscriptionService,
  SubscriptionService,
} from '../infrastructure/services/SubscriptionService';
import { stripeConfig } from './config';

/**
 * Get the Stripe service instance
 */
export function getStripeService(): StripeService {
  return stripeService;
}

/**
 * Get the Stripe client instance
 * Alias for getStripeService for backward compatibility
 */
export function getStripeClient(): StripeService {
  return stripeService;
}

/**
 * Get the Subscription service instance
 */
export function getSubscriptionService(): SubscriptionService {
  return subscriptionService;
}

/**
 * Check if Stripe is configured
 */
export function isStripeConfigured(): boolean {
  return stripeService.isConfigured();
}

/**
 * Get Stripe publishable key for client-side usage
 */
export function getStripePublishableKey(): string | undefined {
  return stripeConfig.publishableKey();
}

/**
 * Stripe webhook event types
 */
export const StripeWebhookEvents = {
  // Checkout events
  CHECKOUT_SESSION_COMPLETED: 'checkout.session.completed',
  CHECKOUT_SESSION_EXPIRED: 'checkout.session.expired',

  // Payment events
  PAYMENT_INTENT_SUCCEEDED: 'payment_intent.succeeded',
  PAYMENT_INTENT_FAILED: 'payment_intent.payment_failed',
  PAYMENT_INTENT_CANCELED: 'payment_intent.canceled',

  // Subscription events
  CUSTOMER_SUBSCRIPTION_CREATED: 'customer.subscription.created',
  CUSTOMER_SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
  CUSTOMER_SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
  CUSTOMER_SUBSCRIPTION_TRIAL_WILL_END: 'customer.subscription.trial_will_end',

  // Invoice events
  INVOICE_CREATED: 'invoice.created',
  INVOICE_FINALIZED: 'invoice.finalized',
  INVOICE_PAID: 'invoice.paid',
  INVOICE_PAYMENT_FAILED: 'invoice.payment_failed',
  INVOICE_PAYMENT_SUCCEEDED: 'invoice.payment_succeeded',

  // Customer events
  CUSTOMER_CREATED: 'customer.created',
  CUSTOMER_UPDATED: 'customer.updated',
  CUSTOMER_DELETED: 'customer.deleted',

  // Payment method events
  PAYMENT_METHOD_ATTACHED: 'payment_method.attached',
  PAYMENT_METHOD_DETACHED: 'payment_method.detached',
  PAYMENT_METHOD_UPDATED: 'payment_method.updated',
} as const;

export type StripeWebhookEvent =
  (typeof StripeWebhookEvents)[keyof typeof StripeWebhookEvents];

/**
 * Format amount for Stripe (convert to cents)
 * Stripe expects amounts in the smallest currency unit (cents for USD)
 *
 * @param amount - Amount in dollars
 * @returns Amount in cents
 */
export function formatAmountForStripe(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Format amount from Stripe (convert from cents)
 *
 * @param amount - Amount in cents
 * @returns Amount in dollars
 */
export function formatAmountFromStripe(amount: number): number {
  return amount / 100;
}

/**
 * Format currency for display
 *
 * @param amount - Amount in cents
 * @param currency - Currency code (default: USD)
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD'
): string {
  const dollars = formatAmountFromStripe(amount);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(dollars);
}

/**
 * Get subscription status display text
 *
 * @param status - Stripe subscription status
 * @returns Human-readable status text
 */
export function getSubscriptionStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    active: 'Active',
    canceled: 'Canceled',
    incomplete: 'Incomplete',
    incomplete_expired: 'Incomplete (Expired)',
    past_due: 'Past Due',
    trialing: 'Trial',
    unpaid: 'Unpaid',
    paused: 'Paused',
  };

  return statusMap[status] || status;
}

/**
 * Check if subscription is active
 *
 * @param status - Stripe subscription status
 * @returns True if subscription is active
 */
export function isSubscriptionActive(status: string): boolean {
  return status === 'active' || status === 'trialing';
}

/**
 * Calculate days remaining in trial
 *
 * @param trialEnd - Trial end timestamp (seconds)
 * @returns Days remaining in trial
 */
export function calculateTrialDaysRemaining(trialEnd: number | null): number {
  if (!trialEnd) return 0;

  const now = Math.floor(Date.now() / 1000);
  const secondsRemaining = trialEnd - now;
  const daysRemaining = Math.ceil(secondsRemaining / (60 * 60 * 24));

  return Math.max(0, daysRemaining);
}

/**
 * Generate idempotency key for Stripe requests
 * Ensures requests are idempotent and can be safely retried
 *
 * @param prefix - Prefix for the key
 * @returns Idempotency key
 */
export function generateIdempotencyKey(prefix: string = 'idem'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${prefix}_${timestamp}_${random}`;
}
