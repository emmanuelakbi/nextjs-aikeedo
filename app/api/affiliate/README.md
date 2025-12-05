# Affiliate API Routes

Comprehensive API endpoints for the AIKEEDO affiliate system.

## Overview

The affiliate API provides endpoints for:
- Managing affiliate accounts
- Tracking referrals and conversions
- Processing commissions and payouts
- Generating reports and analytics
- Fraud detection and prevention
- Marketing materials

## Authentication

All endpoints require authentication via NextAuth session, except:
- `GET /api/affiliate/validate` - Public endpoint for validating referral codes

Admin-only endpoints (marked with 🔒):
- All endpoints under `/api/affiliate/payout/admin/*`
- `GET /api/affiliate/fraud`
- `POST /api/affiliate/fraud`

## Endpoints

### Affiliate Account Management

#### `GET /api/affiliate`
Get current user's affiliate account details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "affiliate_id",
    "userId": "user_id",
    "code": "MYCODE123",
    "commissionRate": 20,
    "tier": 1,
    "status": "ACTIVE",
    "totalEarnings": 50000,
    "pendingEarnings": 15000,
    "paidEarnings": 35000,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### `PATCH /api/affiliate`
Update affiliate account settings.

**Request:**
```json
{
  "payoutEmail": "payout@example.com",
  "payoutMethod": "PAYPAL",
  "notes": "Additional notes"
}
```

#### `POST /api/affiliate/create`
Create a new affiliate account.

**Request:**
```json
{
  "code": "MYCODE123",
  "commissionRate": 20,
  "tier": 1
}
```

### Referral Tracking

#### `POST /api/affiliate/track`
Track referral events (clicks, signups, conversions).

**Request:**
```json
{
  "code": "MYCODE123",
  "userId": "user_id",
  "eventType": "signup"
}
```

**Event Types:**
- `click` - Referral link clicked
- `signup` - User signed up with referral code
- `conversion` - User made a purchase

#### `GET /api/affiliate/referrals`
Get list of all referrals for current affiliate.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "referral_id",
      "status": "CONVERTED",
      "commission": 1000,
      "conversionValue": 5000,
      "convertedAt": "2024-01-15T00:00:00Z",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### `GET /api/affiliate/validate?code=MYCODE123`
Validate a referral code (public endpoint).

**Response:**
```json
{
  "valid": true,
  "data": {
    "code": "MYCODE123",
    "tier": 1,
    "commissionRate": 20
  }
}
```

### Statistics & Analytics

#### `GET /api/affiliate/stats`
Get affiliate statistics and performance metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalReferrals": 50,
    "convertedReferrals": 25,
    "conversionRate": "50.00",
    "totalEarnings": 50000,
    "pendingEarnings": 15000,
    "paidEarnings": 35000
  }
}
```

#### `GET /api/affiliate/conversions?status=CONVERTED&limit=50&offset=0`
Get detailed conversion data with pagination.

**Query Parameters:**
- `status` - Filter by status (PENDING, CONVERTED, CANCELED)
- `limit` - Results per page (default: 50)
- `offset` - Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "conversions": [...],
    "pagination": {
      "total": 100,
      "limit": 50,
      "offset": 0,
      "hasMore": true
    },
    "metrics": {
      "total": 100,
      "pending": 25,
      "converted": 50,
      "canceled": 25,
      "conversionRate": "50.00"
    }
  }
}
```

#### `GET /api/affiliate/leaderboard?metric=earnings&period=30d&limit=10`
Get top performing affiliates leaderboard.

**Query Parameters:**
- `metric` - Sort by: earnings, referrals, conversions (default: earnings)
- `period` - Time period: 7d, 30d, 90d, all (default: 30d)
- `limit` - Number of results (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "affiliate": {
          "code": "TOPAFFILIATE",
          "tier": 3
        },
        "metrics": {
          "totalReferrals": 100,
          "convertedReferrals": 75,
          "totalEarnings": 150000,
          "conversionRate": "75.00"
        }
      }
    ],
    "currentUserRank": {...},
    "period": "30d",
    "metric": "earnings"
  }
}
```

### Reports

#### `GET /api/affiliate/reports?type=summary&period=30d`
Generate affiliate reports.

**Query Parameters:**
- `type` - Report type: summary, detailed, earnings, conversions (default: summary)
- `period` - Time period: 7d, 30d, 90d, 1y, all (default: 30d)

**Report Types:**

**Summary Report:**
```json
{
  "success": true,
  "data": {
    "period": "30d",
    "type": "summary",
    "totalReferrals": 50,
    "convertedReferrals": 25,
    "conversionRate": "50.00",
    "totalCommission": 50000,
    "totalPayouts": 35000,
    "pendingEarnings": 15000
  }
}
```

**Earnings Report:**
```json
{
  "data": {
    "earningsByMonth": [
      {
        "month": "2024-01",
        "amount": 25000,
        "amountFormatted": "$250.00"
      }
    ]
  }
}
```

**Conversions Report:**
```json
{
  "data": {
    "byStatus": {
      "pending": 10,
      "converted": 25,
      "canceled": 5
    },
    "conversionsByWeek": [...]
  }
}
```

### Commission Processing

#### `POST /api/affiliate/commission/process`
Process commission for a transaction (manual/testing).

**Request:**
```json
{
  "userId": "user_id",
  "amount": 5000,
  "transactionType": "subscription",
  "referenceId": "sub_123"
}
```

#### `POST /api/affiliate/commission/refund`
Process refund and adjust commission.

**Request:**
```json
{
  "userId": "user_id",
  "referenceId": "sub_123",
  "type": "refund"
}
```

### Payout Management

#### `POST /api/affiliate/payout/request`
Request a payout.

**Request:**
```json
{
  "amount": 10000,
  "method": "PAYPAL",
  "notes": "Monthly payout"
}
```

**Methods:** PAYPAL, STRIPE, BANK_TRANSFER

#### `GET /api/affiliate/payout/list`
Get payout history for current affiliate.

**Response:**
```json
{
  "success": true,
  "data": {
    "payouts": [...],
    "stats": {
      "totalRequested": 50000,
      "totalPaid": 35000,
      "totalPending": 15000
    }
  }
}
```

### Admin Endpoints 🔒

#### `GET /api/affiliate/payout/admin/pending`
Get all pending payouts (admin only).

#### `POST /api/affiliate/payout/admin/approve`
Approve a payout request (admin only).

**Request:**
```json
{
  "payoutId": "payout_id",
  "notes": "Approved"
}
```

#### `POST /api/affiliate/payout/admin/reject`
Reject a payout request (admin only).

**Request:**
```json
{
  "payoutId": "payout_id",
  "reason": "Insufficient balance"
}
```

#### `POST /api/affiliate/payout/admin/process`
Process an approved payout (admin only).

**Request:**
```json
{
  "payoutId": "payout_id"
}
```

### Marketing Materials

#### `GET /api/affiliate/materials`
Get marketing materials and promotional content.

**Response:**
```json
{
  "success": true,
  "data": {
    "referralCode": "MYCODE123",
    "referralUrl": "https://aikeedo.com?ref=MYCODE123",
    "textSnippets": [...],
    "emailTemplates": [...],
    "banners": [...],
    "socialImages": [...],
    "trackingLinks": {...}
  }
}
```

### Fraud Detection 🔒

#### `GET /api/affiliate/fraud?affiliateId=xxx`
Get fraud detection report (admin only).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "affiliate": {...},
      "flags": [
        "Self-referrals detected: 3",
        "Unusually high conversion rate: 95.5%"
      ],
      "riskScore": 70,
      "riskLevel": "HIGH",
      "metrics": {...}
    }
  ]
}
```

#### `POST /api/affiliate/fraud`
Flag affiliate for fraud (admin only).

**Request:**
```json
{
  "affiliateId": "affiliate_id",
  "reason": "Self-referrals detected",
  "action": "SUSPEND"
}
```

**Actions:** SUSPEND, BAN, REVIEW

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message"
}
```

**Common Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden (admin only)
- `404` - Not Found
- `500` - Internal Server Error

## Integration Examples

### Track Referral Signup

```typescript
// When user signs up with referral code
const response = await fetch('/api/affiliate/track', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    code: referralCode,
    userId: newUser.id,
    eventType: 'signup'
  })
});
```

### Process Commission on Purchase

```typescript
// When user makes a purchase
const response = await fetch('/api/affiliate/commission/process', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: user.id,
    amount: purchaseAmount,
    transactionType: 'credit_purchase',
    referenceId: transactionId
  })
});
```

### Request Payout

```typescript
// When affiliate requests payout
const response = await fetch('/api/affiliate/payout/request', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 10000, // $100.00 in cents
    method: 'PAYPAL',
    notes: 'Monthly payout'
  })
});
```

## Related Documentation

- [Affiliate Schema](../../../../prisma/AFFILIATE_SCHEMA.md)
- [Commission Calculation](../../../../COMMISSION_CALCULATION_IMPLEMENTATION.md)
- [Payout System](../../../../PAYOUT_SYSTEM_IMPLEMENTATION.md)
- [Referral Tracking](../../../../REFERRAL_TRACKING_IMPLEMENTATION.md)
