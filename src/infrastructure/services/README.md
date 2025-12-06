# Credit Deduction Service

The `CreditDeductionService` provides atomic credit management for AI generation operations with transaction support.

## Features

- **Atomic Operations**: All credit operations use database transactions to ensure consistency
- **Two-Phase Commit**: Allocate credits before generation, consume on success, release on failure
- **Credit Validation**: Validates sufficient credits before allocation
- **Refund Support**: Automatically refunds credits on generation failure
- **Race Condition Prevention**: Uses row-level locking to prevent concurrent credit issues

## Usage

### Basic Credit Deduction

```typescript
import { CreditDeductionService } from '@/infrastructure/services';

const service = new CreditDeductionService();

// Simple one-step deduction (allocate + consume)
const result = await service.deductCredits(workspaceId, 100);
console.log(`Remaining credits: ${result.remainingCredits}`);
```

### Two-Phase Commit (Recommended for AI Generation)

```typescript
const service = new CreditDeductionService();

// Step 1: Allocate credits before generation
const allocation = await service.allocateCredits(workspaceId, 100);

try {
  // Step 2: Perform AI generation
  const aiResult = await generateAIContent(prompt);

  // Step 3: Consume allocated credits on success
  await service.consumeCredits(workspaceId, 100);

  return aiResult;
} catch (error) {
  // Step 4: Release allocated credits on failure
  await service.releaseCredits(workspaceId, 100);
  throw error;
}
```

### Credit Validation

```typescript
// Check if workspace has sufficient credits before starting
const hasCredits = await service.validateCredits(workspaceId, 100);

if (!hasCredits) {
  throw new Error('Insufficient credits');
}
```

### Credit Refund

```typescript
// Refund credits after a failed generation
await service.refundCredits(workspaceId, 100);
```

### Get Credit Balance

```typescript
const balance = await service.getCreditBalance(workspaceId);
console.log(`Total: ${balance.total}`);
console.log(`Allocated: ${balance.allocated}`);
console.log(`Available: ${balance.available}`);
```

## Error Handling

### InsufficientCreditsError

Thrown when attempting to allocate more credits than available:

```typescript
try {
  await service.allocateCredits(workspaceId, 1000);
} catch (error) {
  if (error instanceof InsufficientCreditsError) {
    console.log(`Required: ${error.required}, Available: ${error.available}`);
  }
}
```

## Best Practices

1. **Always use two-phase commit for AI operations**: Allocate before generation, consume on success, release on failure
2. **Validate credits early**: Check credit availability before starting expensive operations
3. **Handle errors properly**: Always release or refund credits on failure
4. **Use transactions**: The service handles transactions internally, but be aware of transaction boundaries

## Requirements Validation

This service validates the following requirements:

- **Requirement 2.5**: Credits are deducted only on successful generation
- **Requirement 7.3**: Credit validation before generation
- **Requirement 7.4**: Credit refund on failure

## Correctness Properties

- **Property 1 (Credit deduction atomicity)**: Credits are deducted if and only if generation completes successfully
- **Property 7 (Credit refund on failure)**: Credits are refunded when generation fails

---

# Subscription Service

The `SubscriptionService` handles subscription lifecycle management including creation, updates, cancellation, and synchronization with Stripe.

## Features

- **Checkout Session Creation**: Create Stripe checkout sessions for new subscriptions
- **Subscription Sync**: Synchronize subscription data from Stripe webhooks
- **Plan Changes**: Handle upgrades and downgrades with proration
- **Cancellation**: Cancel subscriptions immediately or at period end
- **Trial Management**: Enforce one trial per workspace
- **Credit Allocation**: Automatically allocate credits when subscription activates

## Usage

### Create Checkout Session

```typescript
import { subscriptionService } from '@/infrastructure/services';

// Create a checkout session for a new subscription
const session = await subscriptionService.createCheckoutSession({
  workspaceId: 'workspace-123',
  planId: 'plan-456',
  email: 'user@example.com',
  successUrl: 'https://app.example.com/billing/success',
  cancelUrl: 'https://app.example.com/billing/cancel',
  trialDays: 14, // Optional trial period
  metadata: {
    customField: 'value',
  },
});

// Redirect user to Stripe checkout
window.location.href = session.url;
```

### Sync Subscription from Webhook

```typescript
// In your webhook handler
const stripeSubscription = event.data.object as Stripe.Subscription;

const subscription =
  await subscriptionService.syncSubscriptionFromStripe(stripeSubscription);

console.log(
  `Subscription ${subscription.id} synced with status: ${subscription.status}`
);
```

### Update Subscription (Upgrade/Downgrade)

```typescript
// Upgrade to a higher plan (immediate with proration)
const updatedSubscription = await subscriptionService.updateSubscription({
  subscriptionId: 'sub-123',
  newPlanId: 'plan-premium',
  prorationBehavior: 'create_prorations', // Optional, defaults based on upgrade/downgrade
});

// Downgrade to a lower plan (at period end)
const downgradedSubscription = await subscriptionService.updateSubscription({
  subscriptionId: 'sub-123',
  newPlanId: 'plan-basic',
  prorationBehavior: 'none',
});
```

### Cancel Subscription

```typescript
// Cancel at period end (default)
const canceledSubscription = await subscriptionService.cancelSubscription({
  subscriptionId: 'sub-123',
  cancelAtPeriodEnd: true,
  reason: 'User requested cancellation',
});

// Cancel immediately
const canceledSubscription = await subscriptionService.cancelSubscription({
  subscriptionId: 'sub-123',
  cancelAtPeriodEnd: false,
});
```

### Reactivate Subscription

```typescript
// Reactivate a subscription scheduled for cancellation
const reactivatedSubscription =
  await subscriptionService.reactivateSubscription('sub-123');
```

### Check Active Subscription

```typescript
// Check if workspace has an active subscription
const hasActive =
  await subscriptionService.hasActiveSubscription('workspace-123');

if (!hasActive) {
  console.log('Workspace does not have an active subscription');
}
```

### Get Subscription Details

```typescript
// Get subscription by workspace ID
const subscription =
  await subscriptionService.getSubscriptionByWorkspaceId('workspace-123');

// Get subscription by Stripe subscription ID
const subscription =
  await subscriptionService.getSubscriptionByStripeId('sub_1234567890');
```

## Error Handling

### SubscriptionServiceError

All service methods throw `SubscriptionServiceError` with specific error codes:

```typescript
try {
  await subscriptionService.createCheckoutSession(params);
} catch (error) {
  if (error instanceof SubscriptionServiceError) {
    switch (error.code) {
      case 'WORKSPACE_NOT_FOUND':
        console.log('Workspace does not exist');
        break;
      case 'SUBSCRIPTION_EXISTS':
        console.log('Workspace already has an active subscription');
        break;
      case 'PLAN_NOT_FOUND':
        console.log('Plan does not exist');
        break;
      case 'PLAN_INACTIVE':
        console.log('Plan is not available for subscription');
        break;
      default:
        console.log(`Error: ${error.message}`);
    }
  }
}
```

### Error Codes

- `WORKSPACE_NOT_FOUND`: Workspace does not exist
- `SUBSCRIPTION_EXISTS`: Workspace already has an active subscription
- `PLAN_NOT_FOUND`: Plan does not exist
- `PLAN_INACTIVE`: Plan is not available for subscription
- `SUBSCRIPTION_NOT_FOUND`: Subscription does not exist
- `INVALID_METADATA`: Missing required metadata in Stripe subscription
- `INVALID_SUBSCRIPTION`: Subscription has no items
- `NOT_SCHEDULED_FOR_CANCELLATION`: Subscription is not scheduled for cancellation
- `CHECKOUT_CREATION_FAILED`: Failed to create checkout session
- `SYNC_FAILED`: Failed to sync subscription from Stripe
- `UPDATE_FAILED`: Failed to update subscription
- `CANCEL_FAILED`: Failed to cancel subscription
- `REACTIVATE_FAILED`: Failed to reactivate subscription

## Subscription Lifecycle

1. **Creation**: User selects a plan and is redirected to Stripe checkout
2. **Activation**: Webhook receives `checkout.session.completed` event
3. **Sync**: Service syncs subscription data and allocates credits
4. **Updates**: User can upgrade/downgrade plans with proration
5. **Cancellation**: User can cancel immediately or at period end
6. **Renewal**: Stripe automatically renews subscription and sends webhook

## Trial Management

- Each workspace can only use one trial (enforced by `isTrialed` flag)
- Trial days are specified during checkout session creation
- Trial status is tracked in subscription `trialEnd` field
- Workspace is marked as trialed when subscription with trial is created

## Credit Allocation

When a subscription becomes active or trialing:

1. Service checks plan's `creditCount`
2. If not unlimited (null), allocates credits to workspace
3. Creates a credit transaction for audit trail
4. Updates workspace `creditCount` and `allocatedCredits`

## Requirements Validation

This service validates the following requirements:

- **Requirement 2.1**: Redirect to Stripe checkout for subscription
- **Requirement 2.2**: Create subscription and activate features on payment success
- **Requirement 2.4**: Offer trial period before charging
- **Requirement 3.1**: Prorate charges on upgrade, apply immediately
- **Requirement 3.2**: Apply downgrade at next billing cycle
- **Requirement 3.3**: Maintain access until period end on cancellation
- **Requirement 3.4**: Automatically renew subscription
- **Requirement 7.2**: Activate subscription on payment success webhook
- **Requirement 8.4**: Prevent additional trials per workspace

## Correctness Properties

- **Property 1 (Payment atomicity)**: Subscription activation occurs if and only if payment succeeds
- **Property 3 (Trial uniqueness)**: Only one trial is allowed per workspace lifetime
- **Property 5 (Credit consistency)**: Workspace credits match plan allocation when subscription is active

## Best Practices

1. **Always handle webhooks**: Subscription state changes come through webhooks
2. **Use idempotency**: Stripe webhooks may be delivered multiple times
3. **Validate workspace state**: Check for existing subscriptions before creating new ones
4. **Handle proration correctly**: Upgrades should prorate immediately, downgrades at period end
5. **Track trial usage**: Enforce one trial per workspace to prevent abuse
6. **Allocate credits on activation**: Ensure credits are allocated when subscription becomes active
7. **Handle errors gracefully**: Provide clear error messages and codes for debugging
