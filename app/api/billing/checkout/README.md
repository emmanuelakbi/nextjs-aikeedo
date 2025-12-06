# Billing Checkout API

This directory contains API routes for handling Stripe checkout flows for subscriptions and credit purchases.

## Requirements

Implements the following requirements from the billing specification:

- **2.1**: Redirect to Stripe checkout when user selects a plan
- **2.2**: Create subscription and activate features when payment succeeds
- **2.3**: Show error and allow retry when payment fails
- **2.4**: Offer trial period before charging when available
- **2.5**: Send confirmation email when subscription is created
- **4.1**: Process credit payment via Stripe
- **4.2**: Add credits to workspace immediately when purchase succeeds
- **4.3**: Show error without adding credits when purchase fails
- **8.4**: Only allow one trial per workspace lifetime

## Endpoints

### POST /api/billing/checkout

Creates a Stripe checkout session for subscription.

**Request Body:**

```json
{
  "planId": "uuid",
  "workspaceId": "uuid",
  "successUrl": "https://example.com/success?session_id={CHECKOUT_SESSION_ID}",
  "cancelUrl": "https://example.com/cancel",
  "trialDays": 14
}
```

**Response:**

```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/...",
  "trialOffered": true,
  "trialDays": 14
}
```

**Validation:**

- User must be authenticated
- User must have access to the workspace (owner or admin)
- Workspace must not have an active subscription
- Plan must exist and be active
- Trial is only offered if workspace hasn't used trial before

**Error Responses:**

- `401`: Unauthorized - user not authenticated
- `400`: Invalid request data or business rule violation
- `404`: Workspace or plan not found
- `503`: Stripe not configured

### GET /api/billing/checkout/success

Retrieves checkout session details after successful payment.

**Query Parameters:**

- `session_id`: Stripe checkout session ID

**Response:**

```json
{
  "success": true,
  "sessionId": "cs_test_...",
  "paymentStatus": "paid",
  "customerEmail": "user@example.com",
  "amountTotal": 2999,
  "currency": "usd",
  "subscription": {
    "id": "uuid",
    "status": "ACTIVE",
    "currentPeriodEnd": "2024-01-01T00:00:00Z",
    "trialEnd": null
  }
}
```

**Validation:**

- User must be authenticated
- Session must belong to the authenticated user
- Payment must be completed

**Error Responses:**

- `401`: Unauthorized
- `400`: Invalid session ID or payment not completed
- `404`: Session not found or access denied

### POST /api/billing/credits/checkout

Creates a Stripe checkout session for one-time credit purchase.

**Request Body:**

```json
{
  "workspaceId": "uuid",
  "creditAmount": 1000,
  "pricePerCredit": 0.01,
  "successUrl": "https://example.com/success?session_id={CHECKOUT_SESSION_ID}",
  "cancelUrl": "https://example.com/cancel"
}
```

**Response:**

```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/...",
  "creditAmount": 1000,
  "totalAmount": 10.0,
  "amountInCents": 1000
}
```

**Validation:**

- User must be authenticated
- User must have access to the workspace (owner or admin)
- Credit amount must be between 1 and 1,000,000
- Price per credit must be positive

**Error Responses:**

- `401`: Unauthorized
- `400`: Invalid request data
- `404`: Workspace not found
- `503`: Stripe not configured

## Usage Example

### Subscription Checkout

```typescript
// Client-side code
const response = await fetch('/api/billing/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    planId: 'plan-uuid',
    workspaceId: 'workspace-uuid',
    trialDays: 14,
  }),
});

const { url } = await response.json();

// Redirect to Stripe checkout
window.location.href = url;
```

### Credit Purchase

```typescript
// Client-side code
const response = await fetch('/api/billing/credits/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    workspaceId: 'workspace-uuid',
    creditAmount: 1000,
    pricePerCredit: 0.01,
  }),
});

const { url } = await response.json();

// Redirect to Stripe checkout
window.location.href = url;
```

### Handling Success

```typescript
// On success page
const searchParams = new URLSearchParams(window.location.search);
const sessionId = searchParams.get('session_id');

if (sessionId) {
  const response = await fetch(
    `/api/billing/checkout/success?session_id=${sessionId}`
  );
  const data = await response.json();

  if (data.success) {
    // Show success message
    console.log('Subscription created:', data.subscription);
  }
}
```

## Flow Diagram

```
User selects plan
       ↓
POST /api/billing/checkout
       ↓
Validate user & workspace
       ↓
Check trial eligibility
       ↓
Create Stripe checkout session
       ↓
Return checkout URL
       ↓
Redirect to Stripe
       ↓
User completes payment
       ↓
Stripe webhook (handled separately)
       ↓
Subscription created in database
       ↓
Redirect to success URL
       ↓
GET /api/billing/checkout/success
       ↓
Display confirmation
```

## Security

- All endpoints require authentication
- Workspace access is verified (owner or admin only)
- Stripe webhook signatures are verified (in webhook handler)
- Idempotency is handled by Stripe
- Sensitive data is never stored locally (only Stripe IDs)

## Testing

To test the checkout flow:

1. Ensure Stripe is configured with test keys
2. Create a test plan in the database
3. Call the checkout endpoint with valid data
4. Use Stripe test card numbers (e.g., 4242 4242 4242 4242)
5. Complete the checkout flow
6. Verify subscription is created via webhook

## Related Files

- `/api/billing/webhooks` - Handles Stripe webhook events
- `SubscriptionService.ts` - Business logic for subscriptions
- `StripeService.ts` - Stripe API wrapper
