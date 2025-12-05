# Stripe Integration

This document describes the Stripe integration setup for the AIKEEDO billing module.

## Overview

The Stripe integration provides a complete payment processing solution for:
- Subscription management
- One-time credit purchases
- Payment method management
- Invoice generation
- Webhook handling

## Configuration

### Environment Variables

Add the following environment variables to your `.env` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY="sk_test_your-stripe-secret-key-here"
STRIPE_PUBLISHABLE_KEY="pk_test_your-stripe-publishable-key-here"
STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret-here"
```

#### Getting Your Stripe Keys

1. **API Keys**: Get from [Stripe Dashboard > Developers > API Keys](https://dashboard.stripe.com/apikeys)
   - Use test keys (starting with `sk_test_` and `pk_test_`) for development
   - Use live keys (starting with `sk_live_` and `pk_live_`) for production

2. **Webhook Secret**: Get from [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/webhooks)
   - Create a new webhook endpoint
   - Copy the signing secret (starts with `whsec_`)

## Usage

### StripeService

The `StripeService` is a singleton that provides access to all Stripe operations:

```typescript
import { stripeService } from '@/infrastructure/services';

// Check if Stripe is configured
if (stripeService.isConfigured()) {
  // Create a customer
  const customer = await stripeService.createCustomer({
    email: 'user@example.com',
    name: 'John Doe',
    metadata: {
      workspaceId: 'workspace_123',
    },
  });

  // Create a checkout session
  const session = await stripeService.createCheckoutSession({
    customer: customer.id,
    mode: 'subscription',
    line_items: [
      {
        price: 'price_123',
        quantity: 1,
      },
    ],
    success_url: 'https://example.com/success',
    cancel_url: 'https://example.com/cancel',
  });
}
```

### Stripe Utilities

The `stripe.ts` module provides helpful utilities:

```typescript
import {
  formatAmountForStripe,
  formatAmountFromStripe,
  formatCurrency,
  getSubscriptionStatusText,
  isSubscriptionActive,
  calculateTrialDaysRemaining,
  generateIdempotencyKey,
  StripeWebhookEvents,
} from '@/lib/stripe';

// Convert dollars to cents for Stripe
const amountInCents = formatAmountForStripe(9.99); // 999

// Convert cents to dollars
const amountInDollars = formatAmountFromStripe(999); // 9.99

// Format currency for display
const formatted = formatCurrency(999); // "$9.99"

// Check subscription status
const isActive = isSubscriptionActive('active'); // true

// Calculate trial days remaining
const daysLeft = calculateTrialDaysRemaining(trialEndTimestamp);

// Generate idempotency key for safe retries
const idempotencyKey = generateIdempotencyKey('subscription');
```

## Key Features

### 1. Customer Management

```typescript
// Create a customer
const customer = await stripeService.createCustomer({
  email: 'user@example.com',
  name: 'John Doe',
  metadata: { workspaceId: 'workspace_123' },
});

// Update a customer
await stripeService.updateCustomer(customer.id, {
  name: 'Jane Doe',
});

// Retrieve a customer
const retrievedCustomer = await stripeService.retrieveCustomer(customer.id);
```

### 2. Subscription Management

```typescript
// Create a subscription
const subscription = await stripeService.createSubscription({
  customer: customerId,
  items: [{ price: priceId }],
  trial_period_days: 14,
});

// Update a subscription (upgrade/downgrade)
await stripeService.updateSubscription(subscriptionId, {
  items: [{ id: itemId, price: newPriceId }],
  proration_behavior: 'create_prorations',
});

// Cancel a subscription
await stripeService.cancelSubscription(subscriptionId, true); // Cancel at period end
```

### 3. Payment Methods

```typescript
// Attach a payment method
await stripeService.attachPaymentMethod(paymentMethodId, customerId);

// List payment methods
const paymentMethods = await stripeService.listPaymentMethods(customerId);

// Detach a payment method
await stripeService.detachPaymentMethod(paymentMethodId);
```

### 4. Checkout Sessions

```typescript
// Create a checkout session for subscription
const session = await stripeService.createCheckoutSession({
  customer: customerId,
  mode: 'subscription',
  line_items: [{ price: priceId, quantity: 1 }],
  success_url: 'https://example.com/success?session_id={CHECKOUT_SESSION_ID}',
  cancel_url: 'https://example.com/cancel',
});

// Redirect user to session.url
```

### 5. Webhook Handling

```typescript
import { StripeWebhookEvents } from '@/lib/stripe';

// Verify webhook signature
const event = stripeService.verifyWebhookSignature(
  requestBody,
  stripeSignature
);

// Handle events
switch (event.type) {
  case StripeWebhookEvents.CHECKOUT_SESSION_COMPLETED:
    // Handle successful checkout
    break;
  case StripeWebhookEvents.CUSTOMER_SUBSCRIPTION_UPDATED:
    // Handle subscription update
    break;
  case StripeWebhookEvents.INVOICE_PAYMENT_FAILED:
    // Handle payment failure
    break;
}
```

### 6. Invoice Management

```typescript
// Retrieve an invoice
const invoice = await stripeService.retrieveInvoice(invoiceId);

// List customer invoices
const invoices = await stripeService.listInvoices(customerId, {
  limit: 10,
});
```

### 7. Proration Calculation

```typescript
// Calculate proration for plan change
const upcomingInvoice = await stripeService.calculateProration(
  subscriptionId,
  newPriceId
);

// Check the proration amount
const prorationAmount = upcomingInvoice.amount_due;
```

## Error Handling

The service throws specific errors that you should handle:

```typescript
import { StripeNotConfiguredError } from '@/infrastructure/services';

try {
  const client = stripeService.getClient();
} catch (error) {
  if (error instanceof StripeNotConfiguredError) {
    console.error('Stripe is not configured');
  }
}
```

## Testing

The integration includes comprehensive tests:

```bash
# Run Stripe service tests
npm test -- src/infrastructure/services/__tests__/StripeService.test.ts

# Run Stripe utilities tests
npm test -- src/lib/__tests__/stripe.test.ts
```

## Best Practices

1. **Always use idempotency keys** for critical operations to prevent duplicate charges
2. **Store minimal data locally** - keep sensitive payment data in Stripe
3. **Use webhooks** for async event processing instead of polling
4. **Handle webhook retries** - Stripe will retry failed webhooks
5. **Verify webhook signatures** - always verify signatures to prevent fraud
6. **Use test mode** during development with test API keys
7. **Implement proper error handling** for all Stripe operations
8. **Use metadata** to link Stripe objects to your database records

## Security Considerations

- Never expose your secret key in client-side code
- Always verify webhook signatures
- Use HTTPS for all webhook endpoints
- Store API keys in environment variables, never in code
- Implement rate limiting on webhook endpoints
- Log all payment operations for audit trails

## Next Steps

After setting up the Stripe integration, you can proceed with:

1. Creating the billing database schema (Task 2)
2. Implementing plan management (Task 3)
3. Creating the subscription service (Task 4)
4. Building the checkout flow (Task 5)
5. Implementing webhook handlers (Task 6)

## Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Node.js Library](https://github.com/stripe/stripe-node)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
