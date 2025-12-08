# Billing Database Schema

This document describes the database schema for the billing module.

## Overview

The billing schema supports subscription management, payment processing via Stripe, plan management, credit purchases, and invoice generation. It integrates with the existing workspace system to provide multi-tenant billing capabilities.

## Tables

### Plans

Stores subscription plan definitions with pricing, features, and limits.

**Fields:**
- `id` (UUID): Primary key
- `name` (String): Plan name (e.g., "Pro", "Business")
- `description` (Text): Plan description
- `price` (Integer): Price in cents
- `currency` (String): Currency code (default: "usd")
- `interval` (Enum): Billing interval (MONTH, YEAR)
- `creditCount` (Integer, nullable): Credits allocated per period (null = unlimited)
- `features` (JSON): Feature flags and settings
- `limits` (JSON): Usage limits (maxUsers, maxGenerations, etc.)
- `stripeProductId` (String, unique): Stripe product ID
- `stripePriceId` (String, unique): Stripe price ID
- `isActive` (Boolean): Whether plan is available for new subscriptions
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Indexes:**
- `isActive`
- `stripeProductId`
- `stripePriceId`

**Relations:**
- One-to-many with Subscriptions

### Subscriptions

Stores active and historical subscriptions for workspaces.

**Fields:**
- `id` (UUID): Primary key
- `workspaceId` (UUID, unique): Associated workspace
- `planId` (UUID): Associated plan
- `stripeSubscriptionId` (String, unique): Stripe subscription ID
- `stripeCustomerId` (String): Stripe customer ID
- `status` (Enum): Subscription status (ACTIVE, CANCELED, PAST_DUE, TRIALING, etc.)
- `currentPeriodStart` (DateTime): Current billing period start
- `currentPeriodEnd` (DateTime): Current billing period end
- `cancelAtPeriodEnd` (Boolean): Whether to cancel at period end
- `canceledAt` (DateTime, nullable): Cancellation timestamp
- `trialEnd` (DateTime, nullable): Trial period end
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Indexes:**
- `workspaceId`
- `planId`
- `stripeSubscriptionId`
- `stripeCustomerId`
- `status`

**Relations:**
- Many-to-one with Workspace (one subscription per workspace)
- Many-to-one with Plan
- One-to-many with Invoices

**Constraints:**
- One active subscription per workspace (enforced by unique constraint on workspaceId)

### Invoices

Stores payment invoices for subscriptions and one-time purchases.

**Fields:**
- `id` (UUID): Primary key
- `workspaceId` (UUID): Associated workspace
- `subscriptionId` (UUID, nullable): Associated subscription (null for one-time purchases)
- `stripeInvoiceId` (String, unique): Stripe invoice ID
- `amount` (Integer): Amount in cents
- `currency` (String): Currency code (default: "usd")
- `status` (Enum): Invoice status (DRAFT, OPEN, PAID, VOID, UNCOLLECTIBLE)
- `paidAt` (DateTime, nullable): Payment timestamp
- `invoiceUrl` (String, nullable): Stripe hosted invoice URL
- `invoicePdfUrl` (String, nullable): PDF download URL
- `description` (Text, nullable): Invoice description
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Indexes:**
- `workspaceId`
- `subscriptionId`
- `stripeInvoiceId`
- `status`
- `createdAt`

**Relations:**
- Many-to-one with Workspace
- Many-to-one with Subscription (optional)

### Payment Methods

Stores payment method information for workspaces.

**Fields:**
- `id` (UUID): Primary key
- `workspaceId` (UUID): Associated workspace
- `stripePaymentMethodId` (String, unique): Stripe payment method ID
- `type` (String): Payment method type (card, bank_account, etc.)
- `last4` (String, nullable): Last 4 digits of card/account
- `brand` (String, nullable): Card brand (Visa, Mastercard, etc.)
- `expiryMonth` (Integer, nullable): Card expiry month
- `expiryYear` (Integer, nullable): Card expiry year
- `isDefault` (Boolean): Whether this is the default payment method
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Indexes:**
- `workspaceId`
- `stripePaymentMethodId`
- `isDefault`

**Relations:**
- Many-to-one with Workspace

**Security:**
- Full card details are NEVER stored locally
- Only metadata from Stripe is stored

### Credit Transactions

Audit log for all credit additions and deductions.

**Fields:**
- `id` (UUID): Primary key
- `workspaceId` (UUID): Associated workspace
- `amount` (Integer): Credit amount (positive for additions, negative for deductions)
- `type` (Enum): Transaction type (PURCHASE, SUBSCRIPTION_ALLOCATION, USAGE, REFUND, ADJUSTMENT, OVERAGE)
- `description` (Text, nullable): Transaction description
- `referenceId` (String, nullable): Reference to related entity (invoice ID, generation ID, etc.)
- `referenceType` (String, nullable): Type of reference (invoice, generation, adjustment, etc.)
- `balanceBefore` (Integer): Credit balance before transaction
- `balanceAfter` (Integer): Credit balance after transaction
- `createdAt` (DateTime): Transaction timestamp

**Indexes:**
- `workspaceId`
- `type`
- `referenceId`
- `createdAt`

**Relations:**
- Many-to-one with Workspace

**Purpose:**
- Provides complete audit trail for credit changes
- Enables usage tracking and billing reconciliation
- Supports refund processing and adjustments

## Enums

### PlanInterval
- `MONTH`: Monthly billing
- `YEAR`: Annual billing

### SubscriptionStatus
- `ACTIVE`: Subscription is active and paid
- `CANCELED`: Subscription has been canceled
- `PAST_DUE`: Payment failed, retrying
- `TRIALING`: In trial period
- `INCOMPLETE`: Initial payment pending
- `INCOMPLETE_EXPIRED`: Initial payment failed
- `UNPAID`: Payment failed, no retry

### InvoiceStatus
- `DRAFT`: Invoice is being prepared
- `OPEN`: Invoice is awaiting payment
- `PAID`: Invoice has been paid
- `VOID`: Invoice has been voided
- `UNCOLLECTIBLE`: Invoice marked as uncollectible

### CreditTransactionType
- `PURCHASE`: One-time credit purchase
- `SUBSCRIPTION_ALLOCATION`: Credits allocated from subscription
- `USAGE`: Credits deducted for AI usage
- `REFUND`: Credits refunded
- `ADJUSTMENT`: Manual credit adjustment
- `OVERAGE`: Overage charges

## Relationships

```
Workspace (1) ─── (0..1) Subscription
Workspace (1) ─── (*) Invoice
Workspace (1) ─── (*) PaymentMethod
Workspace (1) ─── (*) CreditTransaction

Plan (1) ─── (*) Subscription

Subscription (1) ─── (*) Invoice
```

## Design Decisions

### One Subscription Per Workspace
Each workspace can have at most one active subscription. This simplifies billing logic and prevents conflicts. Historical subscriptions are preserved for audit purposes.

### Stripe as Source of Truth
Stripe IDs are stored for all billing entities. Stripe webhooks are used to synchronize state. Local data is primarily for quick access and audit trails.

### Credit System Integration
The billing module integrates with the existing workspace credit system. Subscriptions automatically allocate credits at the start of each billing period. Credit transactions provide a complete audit trail.

### Proration Support
The schema supports proration through the subscription's period dates and the credit transaction log. When plans change mid-cycle, proration is calculated based on remaining days.

### Trial Management
Trial periods are tracked via the `trialEnd` field on subscriptions. The `isTrialed` field on workspaces prevents multiple trials.

### Payment Security
Full payment details are never stored locally. Only Stripe IDs and metadata (last4, brand, expiry) are stored for display purposes.

## Migration Strategy

The billing schema is added as a new migration that:
1. Creates all billing tables and enums
2. Adds foreign key relationships to existing Workspace table
3. Preserves existing workspace data
4. Does not require data migration (new feature)

## Seed Data

The seed script includes four test plans:
- **Free**: $0/month, 100 credits
- **Pro**: $29/month, 1,000 credits
- **Business**: $99/month, 5,000 credits
- **Enterprise**: $299/month, unlimited credits

These plans use test Stripe IDs and should be replaced with real Stripe products in production.

## Future Considerations

### Potential Enhancements
- Add support for usage-based billing (metered pricing)
- Add support for add-ons and one-time purchases
- Add support for coupons and discounts
- Add support for multiple currencies
- Add support for tax calculation
- Add support for dunning management

### Scalability
- Credit transactions table will grow over time; consider partitioning by date
- Indexes are optimized for common queries (workspace lookups, date ranges)
- Consider archiving old invoices and transactions after retention period
