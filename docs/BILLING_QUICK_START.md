# Billing Quick Start Guide

Get your billing system up and running in 15 minutes.

## Prerequisites

- [ ] Stripe account created
- [ ] Database migrations run
- [ ] Environment variables configured

## Step 1: Configure Stripe (5 minutes)

### 1.1 Get API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers → API keys**
3. Copy your keys:
   - **Publishable key**: `pk_test_...`
   - **Secret key**: `sk_test_...`

### 1.2 Add to Environment

```env
# .env
STRIPE_SECRET_KEY=sk_test_51...
STRIPE_PUBLISHABLE_KEY=pk_test_51...
```

## Step 2: Create Products in Stripe (3 minutes)

### 2.1 Create a Product

1. Go to **Products → Add Product**
2. Fill in:
   - **Name**: "Pro Plan"
   - **Description**: "Professional tier"
3. Click **Add pricing**:
   - **Price**: $29.99
   - **Billing period**: Monthly
4. Click **Save product**
5. Copy the **Product ID** (`prod_...`) and **Price ID** (`price_...`)

### 2.2 Repeat for Other Plans

Create additional plans as needed (Basic, Enterprise, etc.)

## Step 3: Configure Webhook (3 minutes)

### 3.1 Add Webhook Endpoint

1. Go to **Developers → Webhooks**
2. Click **Add endpoint**
3. Enter endpoint URL:
   ```
   https://yourdomain.com/api/webhooks/stripe
   ```
   For local development:
   ```
   Use Stripe CLI (see below)
   ```

### 3.2 Select Events

Select these events:
- ✅ `checkout.session.completed`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`

### 3.3 Get Signing Secret

1. Click on your webhook
2. Copy **Signing secret**: `whsec_...`
3. Add to environment:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

## Step 4: Create Plans in Database (2 minutes)

### Option A: Using API

```bash
curl -X POST http://localhost:3000/api/billing/plans \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pro Plan",
    "description": "Professional tier with advanced features",
    "price": 2999,
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
  }'
```

### Option B: Using Prisma Studio

```bash
npm run db:studio
```

Navigate to `Plan` model and add records manually.

## Step 5: Test the Integration (2 minutes)

### 5.1 Test Checkout Flow

```bash
# Start your dev server
npm run dev

# In another terminal, forward webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### 5.2 Create Test Subscription

1. Navigate to your app's pricing page
2. Click "Subscribe" on a plan
3. Use test card: `4242 4242 4242 4242`
4. Complete checkout
5. Verify subscription created in database

### 5.3 Verify Webhook Processing

Check your terminal for webhook events:
```
✓ checkout.session.completed
✓ invoice.payment_succeeded
✓ customer.subscription.created
```

## Verification Checklist

- [ ] Stripe API keys configured
- [ ] Products created in Stripe
- [ ] Webhook endpoint configured
- [ ] Plans created in database
- [ ] Test subscription successful
- [ ] Webhooks processing correctly
- [ ] Credits allocated after payment

## Next Steps

### Production Deployment

1. **Switch to Live Mode**
   ```env
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   ```

2. **Update Webhook URL**
   - Change to production URL
   - Get new signing secret
   - Update `STRIPE_WEBHOOK_SECRET`

3. **Create Live Products**
   - Recreate products in live mode
   - Update plan records with live IDs

### Customize Your Plans

Edit plan features and limits:

```typescript
{
  "features": {
    "aiGeneration": true,
    "imageGeneration": true,
    "voiceCloning": false,
    "apiAccess": true,
    "prioritySupport": true
  },
  "limits": {
    "maxUsers": 10,
    "maxGenerations": 1000,
    "maxStorage": 10737418240, // 10GB in bytes
    "maxApiCalls": 10000
  }
}
```

### Add More Plans

Create tiered pricing:

```typescript
// Basic Plan
{
  "name": "Basic",
  "price": 999,  // $9.99
  "creditCount": 1000
}

// Pro Plan
{
  "name": "Pro",
  "price": 2999,  // $29.99
  "creditCount": 10000
}

// Enterprise Plan
{
  "name": "Enterprise",
  "price": 9999,  // $99.99
  "creditCount": null  // unlimited
}
```

### Enable Annual Billing

Create annual pricing in Stripe:

```typescript
{
  "name": "Pro Plan (Annual)",
  "price": 29990,  // $299.90 (save 16%)
  "interval": "YEAR",
  "creditCount": 120000  // 10k × 12 months
}
```

## Troubleshooting

### Webhook Not Working

**Problem**: Subscriptions not created after checkout

**Solution**:
```bash
# Check webhook secret
echo $STRIPE_WEBHOOK_SECRET

# Test webhook locally
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test event
stripe trigger checkout.session.completed
```

### Credits Not Allocated

**Problem**: Payment succeeded but no credits added

**Solution**:
1. Check webhook logs for `invoice.payment_succeeded`
2. Verify plan has `creditCount` set
3. Check database for credit transactions
4. Review application logs for errors

### Payment Fails

**Problem**: Test payment not going through

**Solution**:
1. Use correct test card: `4242 4242 4242 4242`
2. Use any future expiry date
3. Use any 3-digit CVC
4. Use any ZIP code
5. Check Stripe Dashboard for error details

## Common Test Cards

| Card Number | Scenario |
|-------------|----------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 0002 | Card declined |
| 4000 0000 0000 9995 | Insufficient funds |
| 4000 0025 0000 3155 | Requires authentication (3D Secure) |

## Support

- **Documentation**: [Full Billing Guide](./BILLING.md)
- **Stripe Docs**: [stripe.com/docs](https://stripe.com/docs)
- **API Reference**: [Billing API](./BILLING.md#api-reference)

---

**Estimated Setup Time**: 15 minutes  
**Difficulty**: Beginner  
**Last Updated**: November 2024
