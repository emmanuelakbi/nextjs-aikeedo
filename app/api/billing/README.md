# Billing API

Complete billing and subscription management API for AIKEEDO Next.js.

## Overview

The Billing API provides comprehensive functionality for:

- Subscription plan management
- Stripe checkout and payment processing
- Subscription lifecycle management (create, upgrade, downgrade, cancel)
- Credit purchases and tracking
- Invoice generation and management
- Payment method management
- Webhook processing for Stripe events
- Usage tracking and overage billing
- Refund processing
- Billing dashboard data

## API Routes

### Plans

- `GET /api/billing/plans` - List all subscription plans
- `POST /api/billing/plans` - Create a new plan (admin)
- `GET /api/billing/plans/[id]` - Get plan details
- `PATCH /api/billing/plans/[id]` - Update plan (admin)
- `POST /api/billing/plans/[id]/activate` - Activate a plan (admin)
- `POST /api/billing/plans/[id]/deprecate` - Deprecate a plan (admin)

### Subscriptions

- `GET /api/billing/subscriptions` - Get current workspace subscription
- `POST /api/billing/subscriptions/cancel` - Cancel subscription
- `POST /api/billing/subscriptions/change-plan` - Upgrade/downgrade plan
- `POST /api/billing/subscriptions/reactivate` - Reactivate canceled subscription

### Checkout

- `POST /api/billing/checkout` - Create Stripe checkout session for subscription
- `GET /api/billing/checkout/success` - Handle successful checkout

### Credits

- `POST /api/billing/credits/checkout` - Create checkout session for credit purchase
- `GET /api/billing/credits/transactions` - List credit transactions

### Invoices

- `GET /api/billing/invoices` - List invoices for workspace
- `GET /api/billing/invoices/[id]` - Get invoice details
- `GET /api/billing/invoices/[id]/pdf` - Download invoice as PDF
- `POST /api/billing/invoices/[id]/send` - Send invoice via email

### Payment Methods

- `GET /api/billing/payment-methods` - List payment methods
- `POST /api/billing/payment-methods` - Add payment method
- `PATCH /api/billing/payment-methods/[id]` - Update payment method
- `DELETE /api/billing/payment-methods/[id]` - Remove payment method
- `GET /api/billing/payment-methods/expiring` - Get expiring payment methods

### Usage & Overage

- `GET /api/billing/usage` - Get usage statistics
- `GET /api/billing/usage/overage` - Get overage status
- `POST /api/billing/usage/overage` - Calculate and charge overage fees

### Refunds

- `GET /api/billing/refunds` - List refunds
- `POST /api/billing/refunds` - Request a refund

### Dashboard

- `GET /api/billing/dashboard` - Get comprehensive billing dashboard data

### Webhooks

- `POST /api/webhooks/stripe` - Handle Stripe webhook events

## Requirements Coverage

### Requirement 1: Subscription Plan Management

- ✅ 1.1: Multiple pricing tiers supported
- ✅ 1.2: Plans specify credits, features, and price
- ✅ 1.3: Plan updates apply to new subscriptions only
- ✅ 1.4: Deprecated plans prevent new subscriptions
- ✅ 1.5: Plans display features, limits, and pricing

### Requirement 2: Subscription Creation

- ✅ 2.1: Redirect to Stripe checkout
- ✅ 2.2: Create subscription on payment success
- ✅ 2.3: Show error and allow retry on failure
- ✅ 2.4: Offer trial period before charging
- ✅ 2.5: Send confirmation email

### Requirement 3: Subscription Management

- ✅ 3.1: Upgrade with proration and immediate limits
- ✅ 3.2: Downgrade at next billing cycle
- ✅ 3.3: Cancel with access until period end
- ✅ 3.4: Automatic renewal and charging
- ✅ 3.5: Retry failed payments and notify user

### Requirement 4: Credit Purchase

- ✅ 4.1: Process payment via Stripe
- ✅ 4.2: Add credits immediately on success
- ✅ 4.3: Show error without adding credits on failure
- ✅ 4.4: Send receipt email
- ✅ 4.5: Log transaction for auditing

### Requirement 5: Invoice Management

- ✅ 5.1: Generate invoice on payment
- ✅ 5.2: Display all past invoices
- ✅ 5.3: Provide PDF format
- ✅ 5.4: Include itemized charges
- ✅ 5.5: Email invoice to billing email

### Requirement 6: Payment Method Management

- ✅ 6.1: Store payment method securely in Stripe
- ✅ 6.2: Use new method for future charges
- ✅ 6.3: Prevent removal of only payment method
- ✅ 6.4: Notify user of expiring payment methods
- ✅ 6.5: Never store full card details locally

### Requirement 7: Webhook Processing

- ✅ 7.1: Verify webhook signature
- ✅ 7.2: Activate subscription on payment success
- ✅ 7.3: Update status on payment failure
- ✅ 7.4: Schedule deactivation on cancellation
- ✅ 7.5: Log errors for manual review

### Requirement 8: Trial Period Management

- ✅ 8.1: Activate features without charging
- ✅ 8.2: Charge first payment after trial
- ✅ 8.3: Don't charge if trial canceled
- ✅ 8.4: Prevent additional trials
- ✅ 8.5: Show remaining trial days

### Requirement 9: Proration and Billing Cycles

- ✅ 9.1: Prorate charges on upgrade
- ✅ 9.2: Apply credit on downgrade
- ✅ 9.3: Charge on same day each month
- ✅ 9.4: Use daily rate for proration
- ✅ 9.5: Show breakdown in invoice

### Requirement 10: Usage-Based Billing

- ✅ 10.1: Charge overage fees when limits exceeded
- ✅ 10.2: Use per-unit pricing for overage
- ✅ 10.3: Calculate total usage charges at period end
- ✅ 10.4: Update usage in real-time
- ✅ 10.5: Notify user of overage

### Requirement 11: Refund Processing

- ✅ 11.1: Process refund via Stripe
- ✅ 11.2: Deduct credits proportionally
- ✅ 11.3: Send confirmation email
- ✅ 11.4: Notify administrator on failure
- ✅ 11.5: Adjust subscription for partial refund

### Requirement 12: Billing Dashboard

- ✅ 12.1: Show current plan and usage
- ✅ 12.2: Show current period charges
- ✅ 12.3: Display past 12 months history
- ✅ 12.4: Show usage breakdown by service type
- ✅ 12.5: Indicate remaining quota

## Authentication

All billing API routes require authentication via NextAuth session. Users must be:

- Authenticated (have a valid session)
- Have access to the workspace (owner or member)
- Have appropriate role for admin operations (owner/admin)

## Error Handling

Standard HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (invalid data)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (no access to resource)
- `404` - Not Found
- `500` - Internal Server Error
- `503` - Service Unavailable (Stripe not configured)

## Stripe Integration

The billing API integrates with Stripe for:

- Payment processing
- Subscription management
- Invoice generation
- Webhook event handling
- Payment method storage
- Refund processing

### Required Environment Variables

```env
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Testing

See individual route README files for detailed testing information:

- [Plans API](./plans/README.md)
- [Subscriptions API](./subscriptions/README.md)
- [Checkout API](./checkout/README.md)
- [Credits API](./credits/README.md)
- [Invoices API](./invoices/README.md)
- [Payment Methods API](./payment-methods/README.md)
- [Usage API](./usage/README.md)
- [Refunds API](./refunds/README.md)
- [Dashboard API](./dashboard/README.md)

## Notes

- All monetary amounts are stored in the smallest currency unit (cents for USD)
- Dates are returned in ISO 8601 format
- Webhook events are processed idempotently
- Failed webhooks are automatically retried by Stripe
- Credit transactions are logged for auditing
- Payment methods are never stored locally (only Stripe IDs)
