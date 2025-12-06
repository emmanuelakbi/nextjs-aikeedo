# Design Document - Affiliate Module

## Data Models

**Affiliate**

```typescript
type Affiliate = {
  id: string;
  userId: string;
  code: string;
  commissionRate: number;
  tier: number;
  status: 'active' | 'suspended';
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  createdAt: Date;
};
```

**Referral**

```typescript
type Referral = {
  id: string;
  affiliateId: string;
  referredUserId: string;
  status: 'pending' | 'converted' | 'canceled';
  conversionValue: number;
  commission: number;
  convertedAt: Date | null;
  createdAt: Date;
};
```

**Payout**

```typescript
type Payout = {
  id: string;
  affiliateId: string;
  amount: number;
  method: 'paypal' | 'stripe';
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  processedAt: Date | null;
  createdAt: Date;
};
```

## Implementation

- Track referrals via cookies and URL parameters
- Calculate commissions on payment events
- Use queue for payout processing
- Implement fraud detection rules
- Generate affiliate reports
