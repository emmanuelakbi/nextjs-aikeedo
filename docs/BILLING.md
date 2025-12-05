# Billing Module Documentation

## Overview

The Billing module provides comprehensive subscription management, payment processing, and credit tracking for AIKEEDO Next.js. It integrates with Stripe for secure payment processing and supports flexible subscription plans, credit purchases, usage tracking, and automated billing.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Subscription Management](#subscription-management)
- [Credit System](#credit-system)
- [Payment Processing](#payment-processing)
- [Invoicing](#invoicing)
- [Webhooks](#webhooks)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Features

### Core Capabilities

- **Subscription Plans**: Multiple pricing tiers with customizable features and limits
- **Stripe Integration**: Secure payment processing and PCI compliance
- **Flexible Billing**: Monthly and annual billing cycles
- **Trial Periods**: Free trial support with automatic conversion
- **Proration**: Fair billing for mid-cycle plan changes
- **Credit System**: Purchase and track AI service credits
- **Usage Tracking**: Monitor consumption and overage charges
- **Invoice Management**: Automated invoice generation and delivery
- **Payment Methods**: Secure storage and management via Stripe
- **Refund Processing**: Automated and manual refund handling
- **Webhook Processing**: Real-time event handling from Stripe

## Architecture

### Domain Model

The billing module follows Domain-Driven Design principles with clear separation of concerns:

```
src/domain/billing/
├── entities/
│   ├── Plan.ts              # Subscription plan entity
│   ├── Subscription.ts      # Subscription entity
│   └── Invoice.ts           # Invoice entity
├── repositories/
│   ├── PlanRepository.ts
│   ├── SubscriptionRepository.ts
│   └── InvoiceRepository.ts
└── services/
    ├── StripeService.ts     # Stripe API integration
    ├── SubscriptionService.ts
    └── InvoiceService.ts
```

### Data Flow

```
User Action → API Route → Service Layer → Stripe API
                ↓              ↓
           Database ← Webhook Handler ← Stripe Events
```

### Key Entities

#### Plan
```typescript
{
  id: string
  name: string
  description: string
  price: number              // in cents
  currency: string           // e.g., 'usd'
  interval: 'MONTH' | 'YEAR'
  creditCount: number | null // null = unlimited
  features: Json             // plan features
  limits: Json               // usage limits
  stripeProductId: string
  stripePriceId: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
```

#### Subscription
```typescript
{
  id: string
  workspaceId: string
  planId: string
  stripeSubscriptionId: string
  stripeCustomerId: string
  status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'TRIALING'
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  canceledAt: Date | null
  trialEnd: Date | null
  createdAt: Date
  updatedAt: Date
}
```

#### Invoice
```typescript
{
  id: string
  workspaceId: string
  stripeInvoiceId: string
  amount: number
  currency: string
  status: 'PAID' | 'OPEN' | 'VOID'
  paidAt: Date | null
  invoiceUrl: string
  createdAt: Date
}
```

## Getting Started

### Prerequisites

1. **Stripe Account**: Sign up at [stripe.com](https://stripe.com)
2. **Stripe API Keys**: Get from Stripe Dashboard → Developers → API keys
3. **Webhook Secret**: Configure webhook endpoint and get signing secret

### Environment Configuration

Add these variables to your `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...           # Your Stripe secret key
STRIPE_PUBLISHABLE_KEY=pk_test_...     # Your Stripe publishable key
STRIPE_WEBHOOK_SECRET=whsec_...        # Webhook signing secret

# Optional: Stripe API Version
STRIPE_API_VERSION=2023-10-16
```

### Database Setup

The billing schema is included in the main Prisma schema. Run migrations:

```bash
cd nextjs-aikeedo
npm run db:migrate
```

### Stripe Configuration

#### 1. Create Products and Prices

In Stripe Dashboard:
1. Go to Products → Add Product
2. Create products for each plan tier
3. Add pricing (monthly/annual)
4. Copy Product ID and Price ID

#### 2. Configure Webhook

1. Go to Developers → Webhooks → Add endpoint
2. Endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

#### 3. Create Plans in Database

Use the API or database seeding to create plans:

```typescript
POST /api/billing/plans
{
  "name": "Pro Plan",
  "description": "Professional tier with advanced features",
  "price": 2999,              // $29.99 in cents
  "currency": "usd",
  "interval": "MONTH",
  "creditCount": 10000,
  "features": {
    "aiGeneration": true,
    "imageGeneration": true,
    "voiceCloning": true
  },
  "limits": {
    "maxUsers": 10,
    "maxGenerations": 1000
  },
  "stripeProductId": "prod_...",
  "stripePriceId": "price_..."
}
```

## Subscription Management

### Creating a Subscription

#### Flow

1. User selects a plan
2. Frontend calls checkout API
3. User redirected to Stripe Checkout
4. Payment processed by Stripe
5. Webhook creates subscription
6. User redirected back with success

#### Implementation

```typescript
// Create checkout session
const response = await fetch('/api/billing/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    planId: 'plan_123',
    successUrl: 'https://yourdomain.com/billing/success',
    cancelUrl: 'https://yourdomain.com/billing/cancel'
  })
});

const { url } = await response.json();
window.location.href = url; // Redirect to Stripe
```

### Upgrading a Subscription

Upgrades are applied immediately with prorated charges:

```typescript
// Preview proration
const preview = await fetch(
  `/api/billing/subscriptions/proration-preview?newPlanId=${newPlanId}`
);
const { proration } = await preview.json();

// Show user the charges
console.log(`Immediate charge: $${proration.immediateCharge / 100}`);

// Confirm upgrade
const response = await fetch('/api/billing/subscriptions/change-plan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ newPlanId })
});
```

**Behavior:**
- New plan limits apply immediately
- Credits allocated based on new plan
- Prorated charge for remaining period
- Next billing at new plan price

### Downgrading a Subscription

Downgrades are scheduled for the next billing cycle:

```typescript
const response = await fetch('/api/billing/subscriptions/change-plan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ newPlanId: 'basic_plan_id' })
});

const { message } = await response.json();
// "Plan change scheduled for next billing cycle"
```

**Behavior:**
- Current plan remains active until period end
- No immediate charge
- Credits remain at current level
- New plan activates at renewal

### Canceling a Subscription

```typescript
// Cancel at period end (recommended)
await fetch('/api/billing/subscriptions/cancel', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    cancelAtPeriodEnd: true,
    reason: 'No longer needed'
  })
});

// Immediate cancellation
await fetch('/api/billing/subscriptions/cancel', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    cancelAtPeriodEnd: false
  })
});
```

### Reactivating a Subscription

```typescript
await fetch('/api/billing/subscriptions/reactivate', {
  method: 'POST'
});
```

**Requirements:**
- Subscription must be scheduled for cancellation
- Cannot reactivate already canceled subscriptions

### Trial Periods

#### Starting a Trial

Trials are configured per plan in Stripe. When a user subscribes:

1. Trial period starts automatically
2. Features activated immediately
3. No charge during trial
4. First payment at trial end

#### Checking Trial Status

```typescript
const response = await fetch('/api/billing/trial/status');
const { trial } = await response.json();

if (trial.isActive) {
  console.log(`${trial.daysRemaining} days remaining`);
}
```

#### Trial Eligibility

```typescript
const response = await fetch('/api/billing/trial/eligibility');
const { eligible, reason } = await response.json();

if (!eligible) {
  console.log(`Not eligible: ${reason}`);
}
```

**Rules:**
- One trial per workspace
- Tracked by workspace ID
- Cannot reuse trial with new account

## Credit System

### Overview

Credits are the internal currency for AI service usage. They are:
- Allocated via subscription plans
- Purchased separately
- Deducted based on actual usage
- Tracked for auditing

### Credit Allocation

#### Via Subscription

Credits are automatically allocated when:
- Subscription is created
- Subscription renews
- Plan is upgraded

```typescript
// Handled automatically via webhook
invoice.payment_succeeded → allocate credits
```

#### Via Purchase

```typescript
// Create credit purchase checkout
const response = await fetch('/api/billing/credits/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 10000, // 10,000 credits
    successUrl: 'https://yourdomain.com/credits/success',
    cancelUrl: 'https://yourdomain.com/credits/cancel'
  })
});

const { url } = await response.json();
window.location.href = url;
```

### Credit Usage

Credits are deducted automatically when using AI services:

```typescript
// Example: Text generation
POST /api/ai/completions
{
  "prompt": "Write a story",
  "model": "gpt-4",
  "maxTokens": 1000
}

// Response includes credit usage
{
  "completion": "...",
  "usage": {
    "inputTokens": 10,
    "outputTokens": 500,
    "creditsUsed": 0.033
  }
}
```

### Credit Transactions

View credit transaction history:

```typescript
const response = await fetch('/api/billing/credits/transactions');
const { transactions } = await response.json();

transactions.forEach(tx => {
  console.log(`${tx.type}: ${tx.amount} credits - ${tx.reason}`);
});
```

### Credit Refunds

Credits are automatically refunded when:
- AI generation fails
- Provider returns error
- Request times out
- Invalid response received

## Payment Processing

### Payment Methods

#### Adding a Payment Method

```typescript
// Stripe handles payment method collection
// Use Stripe Elements or Checkout
```

#### Listing Payment Methods

```typescript
const response = await fetch('/api/billing/payment-methods');
const { paymentMethods } = await response.json();
```

#### Updating Default Payment Method

```typescript
await fetch(`/api/billing/payment-methods/${methodId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ isDefault: true })
});
```

#### Removing a Payment Method

```typescript
await fetch(`/api/billing/payment-methods/${methodId}`, {
  method: 'DELETE'
});
```

**Note:** Cannot remove the only payment method on an active subscription.

### Expiring Payment Methods

Get notified of expiring cards:

```typescript
const response = await fetch('/api/billing/payment-methods/expiring');
const { expiringMethods } = await response.json();

// Returns methods expiring in next 30 days
```

### Failed Payments

When a payment fails:

1. Subscription status → `PAST_DUE`
2. User notified via email
3. Stripe retries automatically
4. Access maintained during retry period
5. Subscription canceled if all retries fail

## Invoicing

### Viewing Invoices

```typescript
const response = await fetch('/api/billing/invoices');
const { invoices } = await response.json();

invoices.forEach(invoice => {
  console.log(`${invoice.amount / 100} ${invoice.currency} - ${invoice.status}`);
});
```

### Invoice Details

```typescript
const response = await fetch(`/api/billing/invoices/${invoiceId}`);
const { invoice } = await response.json();

console.log(invoice.lineItems); // Itemized charges
```

### Downloading Invoices

```typescript
// Get PDF URL
const response = await fetch(`/api/billing/invoices/${invoiceId}`);
const { invoice } = await response.json();

// Download from Stripe
window.open(invoice.invoiceUrl, '_blank');
```

### Sending Invoices

```typescript
await fetch(`/api/billing/invoices/${invoiceId}/send`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'billing@company.com'
  })
});
```

## Webhooks

### Supported Events

The webhook handler processes these Stripe events:

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Create subscription |
| `invoice.payment_succeeded` | Activate subscription, allocate credits |
| `invoice.payment_failed` | Update status to PAST_DUE |
| `customer.subscription.updated` | Sync subscription changes |
| `customer.subscription.deleted` | Mark subscription as canceled |

### Security

- **Signature Verification**: All webhooks verified with Stripe signature
- **Idempotency**: Safe to process same event multiple times
- **Error Logging**: Failed events logged for manual review

### Testing Webhooks Locally

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger invoice.payment_succeeded
stripe trigger customer.subscription.updated
```

## API Reference

### Plans

```
GET    /api/billing/plans              # List all plans
POST   /api/billing/plans              # Create plan (admin)
GET    /api/billing/plans/:id          # Get plan details
PATCH  /api/billing/plans/:id          # Update plan (admin)
POST   /api/billing/plans/:id/activate # Activate plan (admin)
POST   /api/billing/plans/:id/deprecate # Deprecate plan (admin)
```

### Subscriptions

```
GET    /api/billing/subscriptions                    # Get current subscription
POST   /api/billing/subscriptions/change-plan        # Upgrade/downgrade
POST   /api/billing/subscriptions/cancel             # Cancel subscription
POST   /api/billing/subscriptions/reactivate         # Reactivate subscription
GET    /api/billing/subscriptions/proration-preview  # Preview proration
```

### Checkout

```
POST   /api/billing/checkout         # Create subscription checkout
GET    /api/billing/checkout/success # Handle success redirect
```

### Credits

```
POST   /api/billing/credits/checkout      # Create credit purchase checkout
GET    /api/billing/credits/transactions  # List credit transactions
```

### Invoices

```
GET    /api/billing/invoices           # List invoices
GET    /api/billing/invoices/:id       # Get invoice details
GET    /api/billing/invoices/:id/pdf   # Download PDF
POST   /api/billing/invoices/:id/send  # Send via email
```

### Payment Methods

```
GET    /api/billing/payment-methods            # List payment methods
POST   /api/billing/payment-methods            # Add payment method
PATCH  /api/billing/payment-methods/:id        # Update payment method
DELETE /api/billing/payment-methods/:id        # Remove payment method
GET    /api/billing/payment-methods/expiring   # Get expiring methods
```

### Usage & Billing

```
GET    /api/billing/usage                # Get usage statistics
GET    /api/billing/usage/overage        # Get overage status
POST   /api/billing/usage/overage        # Calculate overage charges
```

### Refunds

```
GET    /api/billing/refunds  # List refunds
POST   /api/billing/refunds  # Request refund
```

### Dashboard

```
GET    /api/billing/dashboard  # Get comprehensive billing data
```

### Webhooks

```
POST   /api/webhooks/stripe  # Stripe webhook handler
```

## Testing

### Unit Tests

```bash
# Run all billing tests
npm test -- src/domain/billing

# Run specific test file
npm test -- src/domain/billing/entities/Plan.test.ts
```

### Integration Tests

```bash
# Run subscription integration tests
npm test -- src/app/api/billing/subscriptions/__tests__
```

### E2E Tests

```bash
# Run end-to-end billing flow tests
npm run test:e2e -- tests/e2e/billing
```

### Test Credit Cards

Use Stripe test cards for testing:

| Card Number | Scenario |
|-------------|----------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 0002 | Decline |
| 4000 0000 0000 9995 | Insufficient funds |
| 4000 0025 0000 3155 | Requires authentication |

## Troubleshooting

### Common Issues

#### Webhook Not Receiving Events

**Symptoms:**
- Subscriptions not created after checkout
- Credits not allocated after payment

**Solutions:**
1. Verify webhook endpoint is publicly accessible
2. Check `STRIPE_WEBHOOK_SECRET` is correct
3. Verify webhook events are selected in Stripe Dashboard
4. Check application logs for webhook errors
5. Use Stripe CLI to test locally

#### Payment Fails but Subscription Created

**Symptoms:**
- Subscription exists but status is PAST_DUE
- No credits allocated

**Solutions:**
1. Check Stripe Dashboard for payment status
2. Verify webhook processed `invoice.payment_succeeded`
3. Manually trigger credit allocation if needed
4. Check for webhook processing errors in logs

#### Proration Calculation Incorrect

**Symptoms:**
- Unexpected charges on plan upgrade
- Wrong amount shown in preview

**Solutions:**
1. Verify plan prices are correct in database
2. Check Stripe subscription period dates
3. Ensure timezone handling is correct
4. Review proration calculation logic

#### Credits Not Deducted

**Symptoms:**
- AI services used but credits unchanged
- Credit balance incorrect

**Solutions:**
1. Check AI service integration
2. Verify credit deduction logic
3. Review credit transaction logs
4. Check for failed transactions

#### Trial Not Working

**Symptoms:**
- User charged immediately
- Trial period not showing

**Solutions:**
1. Verify trial period configured in Stripe
2. Check plan has trial enabled
3. Verify workspace hasn't used trial before
4. Review trial eligibility logic

### Debug Mode

Enable detailed logging:

```env
# Add to .env
DEBUG=billing:*
LOG_LEVEL=debug
```

### Support Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)

## Best Practices

### Security

1. **Never store card details locally** - Use Stripe for all payment data
2. **Verify webhook signatures** - Always validate Stripe signatures
3. **Use HTTPS** - Required for production webhooks
4. **Rotate API keys** - Regularly rotate Stripe keys
5. **Monitor for fraud** - Use Stripe Radar

### Performance

1. **Cache plan data** - Plans change infrequently
2. **Async webhook processing** - Don't block webhook responses
3. **Batch credit operations** - Group credit transactions
4. **Index database queries** - Optimize subscription lookups

### User Experience

1. **Show proration preview** - Let users see charges before upgrade
2. **Clear cancellation policy** - Explain when access ends
3. **Trial reminders** - Notify before trial ends
4. **Failed payment recovery** - Provide clear recovery path
5. **Invoice transparency** - Show itemized charges

### Monitoring

Track these metrics:

- Subscription creation rate
- Churn rate
- Failed payment rate
- Webhook processing success rate
- Credit allocation accuracy
- Average revenue per user (ARPU)

## Related Documentation

- [Plan Management](./PLAN_MANAGEMENT.md) - Detailed plan management guide
- [Credit System](./CREDIT_SYSTEM.md) - Credit calculation and usage
- [API Documentation](./API.md) - Complete API reference
- [Architecture](./ARCHITECTURE.md) - System architecture overview

---

**Last Updated**: November 2024  
**Version**: 1.0.0  
**Module**: Billing
