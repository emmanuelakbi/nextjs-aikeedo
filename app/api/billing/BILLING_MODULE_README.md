# Billing Module

Complete billing and subscription management system for AIKEEDO Next.js.

## Overview

This module provides a production-ready billing system with:
- Stripe integration for payment processing
- Flexible subscription plans
- Credit-based usage tracking
- Automated invoice generation
- Webhook event handling
- Proration for plan changes
- Trial period support
- Refund processing

## Architecture

```
billing/
├── checkout/           # Stripe checkout sessions
├── credits/            # Credit purchases and transactions
├── dashboard/          # Billing dashboard data
├── invoices/           # Invoice management
├── payment-methods/    # Payment method management
├── plans/              # Subscription plan management
├── refunds/            # Refund processing
├── subscriptions/      # Subscription lifecycle
├── trial/              # Trial period management
└── usage/              # Usage tracking and overage
```

## Quick Links

- **[Full Documentation](../../../../docs/BILLING.md)** - Complete billing guide
- **[Quick Start](../../../../docs/BILLING_QUICK_START.md)** - 15-minute setup guide
- **[API Reference](./README.md)** - API endpoint documentation
- **[Plan Management](../../../../docs/PLAN_MANAGEMENT.md)** - Plan configuration guide
- **[Credit System](../../../../docs/CREDIT_SYSTEM.md)** - Credit calculation guide

## Key Features

### Subscription Management
- Create, upgrade, downgrade, and cancel subscriptions
- Automatic proration for plan changes
- Trial period support
- Scheduled plan changes

### Payment Processing
- Secure payment via Stripe Checkout
- Payment method management
- Failed payment handling
- Automatic retry logic

### Credit System
- Subscription-based credit allocation
- One-time credit purchases
- Real-time usage tracking
- Automatic refunds on failures

### Invoice Management
- Automatic invoice generation
- PDF download support
- Email delivery
- Itemized billing

### Webhook Processing
- Real-time event handling
- Idempotent processing
- Automatic retry support
- Error logging

## Getting Started

### 1. Environment Setup

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 2. Database Migration

```bash
npm run db:migrate
```

### 3. Create Plans

```bash
# See docs/BILLING_QUICK_START.md for detailed instructions
```

### 4. Test Integration

```bash
# Start dev server
npm run dev

# Forward webhooks (in another terminal)
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## API Endpoints

### Plans
```
GET    /api/billing/plans              # List plans
POST   /api/billing/plans              # Create plan (admin)
GET    /api/billing/plans/:id          # Get plan
PATCH  /api/billing/plans/:id          # Update plan (admin)
```

### Subscriptions
```
GET    /api/billing/subscriptions                    # Get subscription
POST   /api/billing/subscriptions/change-plan        # Change plan
POST   /api/billing/subscriptions/cancel             # Cancel
POST   /api/billing/subscriptions/reactivate         # Reactivate
GET    /api/billing/subscriptions/proration-preview  # Preview charges
```

### Checkout
```
POST   /api/billing/checkout         # Create checkout session
GET    /api/billing/checkout/success # Handle success
```

### Credits
```
POST   /api/billing/credits/checkout      # Purchase credits
GET    /api/billing/credits/transactions  # List transactions
```

### Invoices
```
GET    /api/billing/invoices       # List invoices
GET    /api/billing/invoices/:id   # Get invoice
```

### Payment Methods
```
GET    /api/billing/payment-methods     # List methods
DELETE /api/billing/payment-methods/:id # Remove method
```

### Usage
```
GET    /api/billing/usage          # Get usage stats
GET    /api/billing/usage/overage  # Check overage
```

### Dashboard
```
GET    /api/billing/dashboard  # Get billing overview
```

## Usage Examples

### Subscribe to a Plan

```typescript
// 1. Create checkout session
const response = await fetch('/api/billing/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    planId: 'plan_123',
    successUrl: 'https://app.com/billing/success',
    cancelUrl: 'https://app.com/billing/cancel'
  })
});

const { url } = await response.json();

// 2. Redirect to Stripe
window.location.href = url;

// 3. User completes payment on Stripe
// 4. Webhook creates subscription
// 5. User redirected to success URL
```

### Upgrade Subscription

```typescript
// 1. Preview proration
const preview = await fetch(
  `/api/billing/subscriptions/proration-preview?newPlanId=${newPlanId}`
);
const { proration } = await preview.json();

// 2. Show user the charges
console.log(`You'll be charged $${proration.immediateCharge / 100} today`);

// 3. Confirm upgrade
const response = await fetch('/api/billing/subscriptions/change-plan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ newPlanId })
});
```

### Purchase Credits

```typescript
const response = await fetch('/api/billing/credits/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 10000, // 10,000 credits
    successUrl: 'https://app.com/credits/success',
    cancelUrl: 'https://app.com/credits/cancel'
  })
});

const { url } = await response.json();
window.location.href = url;
```

### Check Usage

```typescript
const response = await fetch('/api/billing/usage');
const { usage } = await response.json();

console.log(`Credits used: ${usage.creditsUsed}`);
console.log(`Credits remaining: ${usage.creditsRemaining}`);
console.log(`Overage: ${usage.overage}`);
```

## Requirements Coverage

This module implements all requirements from the billing specification:

- ✅ **Requirement 1**: Subscription Plan Management
- ✅ **Requirement 2**: Subscription Creation
- ✅ **Requirement 3**: Subscription Management
- ✅ **Requirement 4**: Credit Purchase
- ✅ **Requirement 5**: Invoice Management
- ✅ **Requirement 6**: Payment Method Management
- ✅ **Requirement 7**: Webhook Processing
- ✅ **Requirement 8**: Trial Period Management
- ✅ **Requirement 9**: Proration and Billing Cycles
- ✅ **Requirement 10**: Usage-Based Billing
- ✅ **Requirement 11**: Refund Processing
- ✅ **Requirement 12**: Billing Dashboard

See [requirements.md](../../../../.kiro/specs/nextjs-billing/requirements.md) for details.

## Testing

### Unit Tests

```bash
npm test -- src/domain/billing
```

### Integration Tests

```bash
npm test -- src/app/api/billing
```

### E2E Tests

```bash
npm run test:e2e -- tests/e2e/billing
```

### Manual Testing

Use Stripe test cards:

| Card | Scenario |
|------|----------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 0002 | Decline |
| 4000 0000 0000 9995 | Insufficient funds |

## Monitoring

Key metrics to track:

- **Subscription Metrics**
  - New subscriptions per day
  - Churn rate
  - Upgrade/downgrade rate
  - Trial conversion rate

- **Payment Metrics**
  - Payment success rate
  - Failed payment rate
  - Retry success rate
  - Refund rate

- **Usage Metrics**
  - Average credits per user
  - Overage frequency
  - Credit purchase rate

- **Technical Metrics**
  - Webhook processing success rate
  - API response times
  - Error rates

## Troubleshooting

### Webhook Issues

**Problem**: Webhooks not being received

**Check**:
1. Webhook URL is correct and publicly accessible
2. `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
3. Events are selected in Stripe Dashboard
4. Application logs for webhook errors

**Solution**:
```bash
# Test locally with Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe
stripe trigger checkout.session.completed
```

### Credit Allocation Issues

**Problem**: Credits not allocated after payment

**Check**:
1. Webhook `invoice.payment_succeeded` processed
2. Plan has `creditCount` configured
3. Database credit transactions
4. Application logs for errors

**Solution**:
```sql
-- Check credit transactions
SELECT * FROM CreditTransaction 
WHERE workspaceId = 'workspace_id' 
ORDER BY createdAt DESC;
```

### Proration Issues

**Problem**: Incorrect proration amounts

**Check**:
1. Plan prices in database match Stripe
2. Subscription period dates are correct
3. Timezone handling

**Solution**: Review proration calculation in `SubscriptionService.ts`

## Security

### Best Practices

1. **Never store card details** - Use Stripe for all payment data
2. **Verify webhook signatures** - Always validate Stripe signatures
3. **Use HTTPS** - Required for production webhooks
4. **Rotate API keys** - Regularly rotate Stripe keys
5. **Monitor for fraud** - Use Stripe Radar

### PCI Compliance

This module is PCI compliant because:
- No card data stored locally
- All payment processing via Stripe
- Only Stripe IDs stored in database
- Stripe handles PCI compliance

## Performance

### Optimization Tips

1. **Cache plan data** - Plans change infrequently
2. **Async webhook processing** - Don't block responses
3. **Batch operations** - Group credit transactions
4. **Index queries** - Optimize subscription lookups

### Database Indexes

Ensure these indexes exist:
```sql
CREATE INDEX idx_subscription_workspace ON Subscription(workspaceId);
CREATE INDEX idx_subscription_stripe ON Subscription(stripeSubscriptionId);
CREATE INDEX idx_invoice_workspace ON Invoice(workspaceId);
CREATE INDEX idx_credit_transaction_workspace ON CreditTransaction(workspaceId);
```

## Contributing

When adding new features:

1. Update requirements document
2. Update design document
3. Implement feature
4. Add tests
5. Update documentation
6. Update API reference

## Support

- **Documentation**: [docs/BILLING.md](../../../../docs/BILLING.md)
- **Quick Start**: [docs/BILLING_QUICK_START.md](../../../../docs/BILLING_QUICK_START.md)
- **Stripe Docs**: [stripe.com/docs](https://stripe.com/docs)
- **Spec**: [.kiro/specs/nextjs-billing/](../../../../.kiro/specs/nextjs-billing/)

## License

Part of AIKEEDO Next.js - See root LICENSE file.

---

**Module**: Billing  
**Version**: 1.0.0  
**Last Updated**: November 2024  
**Status**: Production Ready ✅
