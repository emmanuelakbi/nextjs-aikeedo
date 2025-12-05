# Design Document - Billing Module

## Overview

The Billing module integrates with Stripe for payment processing, subscription management, and invoice generation. It handles plan management, credit purchases, proration, and webhook processing.

## Data Models

**Plan**
```typescript
type Plan = {
  id: string
  name: string
  description: string
  price: number
  currency: string
  interval: 'month' | 'year'
  creditCount: number | null  // null = unlimited
  features: Json
  limits: Json
  stripeProductId: string
  stripePriceId: string
  isActive: boolean
  createdAt: Date
}
```

**Subscription**
```typescript
type Subscription = {
  id: string
  workspaceId: string
  planId: string
  stripeSubscriptionId: string
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  trialEnd: Date | null
  createdAt: Date
  updatedAt: Date
}
```

**Invoice**
```typescript
type Invoice = {
  id: string
  workspaceId: string
  stripeInvoiceId: string
  amount: number
  currency: string
  status: 'paid' | 'open' | 'void'
  paidAt: Date | null
  invoiceUrl: string
  createdAt: Date
}
```

## Correctness Properties

### Property 1: Payment atomicity
*For any* payment transaction, subscription activation should occur if and only if payment succeeds

### Property 2: Proration accuracy
*For any* plan change, prorated charges should be calculated correctly based on remaining days

### Property 3: Trial uniqueness
*For any* workspace, only one trial should be allowed per lifetime

### Property 4: Webhook idempotency
*For any* webhook event, processing should be idempotent to handle retries

### Property 5: Credit consistency
*For any* subscription, workspace credits should match plan allocation

## Implementation Strategy

- Use Stripe SDK for all payment operations
- Store minimal payment data locally (IDs only)
- Use webhooks for async event processing
- Implement idempotency keys for all Stripe requests
- Queue webhook processing for reliability
