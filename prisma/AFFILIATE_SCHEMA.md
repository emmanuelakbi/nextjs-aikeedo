# Affiliate Schema Documentation

## Overview

The affiliate schema manages referral tracking, commission calculations, and payout processing for the AIKEEDO affiliate program. It consists of three main entities: Affiliate, Referral, and Payout.

## Database Models

### Affiliate

Represents an affiliate user who can refer others and earn commissions.

**Fields:**
- `id` (UUID): Primary key
- `userId` (UUID): Foreign key to User, unique - one affiliate per user
- `code` (String): Unique referral code for tracking
- `commissionRate` (Float): Commission percentage (default: 0.1 = 10%)
- `tier` (Int): Affiliate tier level (default: 1)
- `status` (AffiliateStatus): Account status (ACTIVE, SUSPENDED, INACTIVE)
- `totalEarnings` (Int): Total lifetime earnings in cents
- `pendingEarnings` (Int): Earnings awaiting payout in cents
- `paidEarnings` (Int): Total paid out earnings in cents
- `createdAt` (DateTime): Account creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Relations:**
- One-to-one with User
- One-to-many with Referral
- One-to-many with Payout

**Indexes:**
- `userId` (unique)
- `code` (unique)
- `status`

### Referral

Tracks users referred by affiliates and their conversion status.

**Fields:**
- `id` (UUID): Primary key
- `affiliateId` (UUID): Foreign key to Affiliate
- `referredUserId` (UUID): Foreign key to User (the referred user)
- `status` (ReferralStatus): Referral status (PENDING, CONVERTED, CANCELED)
- `conversionValue` (Int): Value of conversion in cents
- `commission` (Int): Commission earned in cents
- `convertedAt` (DateTime?): Timestamp when referral converted
- `createdAt` (DateTime): Referral creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Relations:**
- Many-to-one with Affiliate
- Many-to-one with User (referred user)

**Indexes:**
- `affiliateId`
- `referredUserId`
- `status`
- `createdAt`

### Payout

Represents payout requests and their processing status.

**Fields:**
- `id` (UUID): Primary key
- `affiliateId` (UUID): Foreign key to Affiliate
- `amount` (Int): Payout amount in cents
- `method` (PayoutMethod): Payment method (PAYPAL, STRIPE, BANK_TRANSFER)
- `status` (PayoutStatus): Processing status (PENDING, APPROVED, PAID, REJECTED, FAILED)
- `processedAt` (DateTime?): Timestamp when payout was processed
- `notes` (Text?): Optional notes about the payout
- `createdAt` (DateTime): Request creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Relations:**
- Many-to-one with Affiliate

**Indexes:**
- `affiliateId`
- `status`
- `createdAt`

## Enums

### AffiliateStatus
- `ACTIVE`: Affiliate can earn commissions
- `SUSPENDED`: Temporarily blocked from earning
- `INACTIVE`: Account deactivated

### ReferralStatus
- `PENDING`: User signed up but hasn't converted
- `CONVERTED`: User made a qualifying purchase
- `CANCELED`: Referral was canceled (refund, fraud, etc.)

### PayoutMethod
- `PAYPAL`: PayPal transfer
- `STRIPE`: Stripe Connect payout
- `BANK_TRANSFER`: Direct bank transfer

### PayoutStatus
- `PENDING`: Awaiting admin approval
- `APPROVED`: Approved, awaiting processing
- `PAID`: Successfully paid out
- `REJECTED`: Request rejected
- `FAILED`: Payment processing failed

## Business Rules

### Commission Calculation
1. Commission is calculated as: `transactionAmount * commissionRate`
2. Commission rates can vary by tier
3. Commissions are tracked on both subscriptions and credit purchases
4. Refunds and chargebacks should reverse commissions

### Payout Processing
1. Minimum payout threshold should be enforced (e.g., $50)
2. Payouts can only be requested from `pendingEarnings`
3. Once approved, earnings move from `pendingEarnings` to `paidEarnings`
4. Failed payouts should return funds to `pendingEarnings`

### Fraud Prevention
1. Self-referrals should be detected and blocked
2. Suspicious patterns (same IP, rapid signups) should flag for review
3. Conversions should be validated before commission is awarded
4. Affiliates can be suspended for fraudulent activity

## Migration

The schema was created with migration: `20251201085119_add_affiliate_schema`

To apply the migration:
```bash
npx prisma migrate dev
```

To generate the Prisma client:
```bash
npx prisma generate
```

## Usage Example

```typescript
import { prisma } from '@/lib/prisma';

// Create an affiliate
const affiliate = await prisma.affiliate.create({
  data: {
    userId: 'user-uuid',
    code: 'UNIQUE-CODE',
    commissionRate: 0.15, // 15%
    tier: 1,
    status: 'ACTIVE',
  },
});

// Track a referral
const referral = await prisma.referral.create({
  data: {
    affiliateId: affiliate.id,
    referredUserId: 'referred-user-uuid',
    status: 'PENDING',
  },
});

// Convert a referral
await prisma.referral.update({
  where: { id: referral.id },
  data: {
    status: 'CONVERTED',
    conversionValue: 10000, // $100.00
    commission: 1500, // $15.00
    convertedAt: new Date(),
  },
});

// Update affiliate earnings
await prisma.affiliate.update({
  where: { id: affiliate.id },
  data: {
    totalEarnings: { increment: 1500 },
    pendingEarnings: { increment: 1500 },
  },
});

// Request a payout
const payout = await prisma.payout.create({
  data: {
    affiliateId: affiliate.id,
    amount: 5000, // $50.00
    method: 'PAYPAL',
    status: 'PENDING',
  },
});
```

## Next Steps

After implementing the schema, the following components need to be built:

1. **Referral Tracking Service**: Track referrals via cookies and URL parameters
2. **Commission Calculator**: Calculate commissions on payment events
3. **Payout Processor**: Process approved payouts via payment providers
4. **Fraud Detection**: Implement rules to detect and prevent fraud
5. **API Routes**: Create endpoints for affiliate operations
6. **Dashboard UI**: Build affiliate dashboard for viewing stats and requesting payouts
7. **Admin Interface**: Create admin tools for managing affiliates and payouts
8. **Reports**: Generate affiliate performance reports

## Requirements Coverage

This schema implements the following requirements from the affiliate module:

- **Requirement 1**: Referral Tracking - Affiliate and Referral models with unique codes
- **Requirement 2**: Commission Management - Commission rate, tier, and earnings tracking
- **Requirement 3**: Payout Processing - Payout model with status tracking
- **Requirement 4**: Affiliate Dashboard - Data structure supports statistics and history
- **Requirement 5**: Fraud Prevention - Status field allows suspension, referral tracking enables pattern detection
