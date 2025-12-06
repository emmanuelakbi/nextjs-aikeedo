# Stripe Webhook Handler

This endpoint handles webhook events from Stripe for payment processing and subscription management.

## Endpoint

```
POST /api/webhooks/stripe
```

## Requirements

- Stripe webhook secret must be configured in environment variables (`STRIPE_WEBHOOK_SECRET`)
- Webhook must be configured in Stripe Dashboard to point to this endpoint
- Raw request body is required for signature verification

## Supported Events

### Checkout Events

- `checkout.session.completed` - Creates subscription when checkout is completed

### Invoice Events

- `invoice.created` - Records new invoice
- `invoice.finalized` - Updates invoice when finalized
- `invoice.payment_succeeded` - Activates subscription and allocates credits
- `invoice.payment_failed` - Updates subscription status to PAST_DUE

### Subscription Events

- `customer.subscription.created` - Creates subscription record
- `customer.subscription.updated` - Updates subscription details
- `customer.subscription.deleted` - Marks subscription as canceled

## Security

- **Signature Verification**: All webhooks are verified using Stripe signature (Requirements: 7.1)
- **Idempotency**: Webhook processing is idempotent to handle retries safely (Requirements: 7.4)
- **Error Handling**: Failed webhooks are logged for manual review (Requirements: 7.5)

## Webhook Processing Flow

### 1. Checkout Session Completed

```
checkout.session.completed
  → Verify session metadata (workspaceId, planId)
  → Retrieve full subscription from Stripe
  → Create subscription record
  → Mark workspace as trialed (if applicable)
```

### 2. Invoice Payment Succeeded

```
invoice.payment_succeeded
  → Update/create invoice record
  → Find associated subscription
  → Allocate credits to workspace (if plan has credits)
  → Create credit transaction
```

### 3. Invoice Payment Failed

```
invoice.payment_failed
  → Update invoice record
  → Update subscription status to PAST_DUE
```

### 4. Subscription Updated

```
customer.subscription.updated
  → Find existing subscription
  → Update with latest Stripe data
  → Sync status, periods, and cancellation info
```

### 5. Subscription Deleted

```
customer.subscription.deleted
  → Update subscription status to CANCELED
  → Set canceledAt timestamp
```

## Configuration

### Stripe Dashboard Setup

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events to listen for:
   - `checkout.session.completed`
   - `invoice.created`
   - `invoice.finalized`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET` environment variable

### Environment Variables

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Testing

### Using Stripe CLI

```bash
# Forward webhooks to local development
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger invoice.payment_succeeded
stripe trigger invoice.payment_failed
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
```

### Manual Testing

```bash
# Send test webhook (requires valid signature)
curl -X POST http://localhost:3000/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -H "stripe-signature: t=..." \
  -d @webhook-payload.json
```

## Error Handling

- **Invalid Signature**: Returns 400 with error message
- **Processing Error**: Returns 200 to acknowledge receipt, logs error for retry
- **Missing Metadata**: Logs warning and skips processing
- **Database Error**: Logs error and allows Stripe to retry

## Idempotency

The webhook handler is designed to be idempotent:

- Uses `upsert` operations for subscriptions and invoices
- Checks for existing records before creating
- Safe to process the same event multiple times

## Credit Allocation

When a payment succeeds:

1. Checks if plan has credit allocation (not unlimited)
2. Adds credits to workspace
3. Creates credit transaction record
4. Updates workspace `creditsAdjustedAt` timestamp

## Monitoring

Key metrics to monitor:

- Webhook processing success rate
- Failed webhook events (check logs)
- Credit allocation accuracy
- Subscription status synchronization

## Related Files

- `/src/infrastructure/services/StripeService.ts` - Stripe API wrapper
- `/src/infrastructure/services/SubscriptionService.ts` - Subscription management
- `/src/app/api/billing/checkout/route.ts` - Checkout session creation
- `/prisma/schema.prisma` - Database schema

## Requirements Coverage

- **7.1**: Webhook signature verification
- **7.2**: Activate subscription on payment success
- **7.3**: Update subscription status on payment failure
- **7.4**: Schedule deactivation on cancellation
- **7.5**: Log errors for manual review
- **2.2**: Create subscription and activate features
- **3.4**: Subscription renewal
- **4.2**: Add credits on purchase
- **5.1**: Generate invoice records
