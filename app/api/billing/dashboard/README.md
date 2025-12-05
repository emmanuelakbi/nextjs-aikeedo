# Billing Dashboard API

Provides comprehensive billing information for dashboard display.

## Endpoints

### GET /api/billing/dashboard

Get comprehensive billing dashboard data for a workspace.

**Requirements:** 12.1, 12.2, 12.3, 12.4, 12.5

**Query Parameters:**
- `workspaceId` (required): Workspace UUID

**Response:**
```json
{
  "currentPlan": {
    "id": "uuid",
    "name": "Pro Plan",
    "description": "Professional tier with advanced features",
    "price": 49.99,
    "currency": "usd",
    "interval": "month",
    "creditCount": 1000,
    "features": {...},
    "limits": {...}
  },
  "subscription": {
    "id": "uuid",
    "status": "ACTIVE",
    "currentPeriodStart": "2024-01-01T00:00:00.000Z",
    "currentPeriodEnd": "2024-02-01T00:00:00.000Z",
    "cancelAtPeriodEnd": false,
    "trialEnd": null,
    "daysUntilNextBilling": 15
  },
  "currentPeriod": {
    "charges": 54.99,
    "usage": 1200,
    "start": "2024-01-01T00:00:00.000Z",
    "end": "2024-02-01T00:00:00.000Z"
  },
  "billingHistory": {
    "invoices": [
      {
        "id": "uuid",
        "amount": 49.99,
        "currency": "usd",
        "status": "PAID",
        "paidAt": "2024-01-01T00:00:00.000Z",
        "invoiceUrl": "https://...",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "monthlySpending": {
      "2024-01": 49.99,
      "2023-12": 49.99
    },
    "totalSpent": 599.88
  },
  "usage": {
    "current": 1200,
    "byServiceType": [
      {
        "serviceType": "AI Completion",
        "usage": 700,
        "percentage": 58.33
      },
      {
        "serviceType": "Image Generation",
        "usage": 500,
        "percentage": 41.67
      }
    ]
  },
  "credits": {
    "current": 300,
    "limit": 1000,
    "used": 1200,
    "remaining": 0,
    "percentageUsed": 120.0
  },
  "paymentMethods": [
    {
      "id": "pm_xxx",
      "type": "card",
      "card": {
        "brand": "visa",
        "last4": "4242",
        "expMonth": 12,
        "expYear": 2025
      },
      "isDefault": true
    }
  ]
}
```

## Features

### Current Plan and Usage (Requirement 12.1)
- Shows active subscription plan details
- Displays current usage statistics
- Indicates subscription status and trial information

### Current Period Charges (Requirement 12.2)
- Shows charges for the current billing period
- Includes base subscription cost
- Adds overage charges if applicable
- Displays period start and end dates

### Billing History (Requirement 12.3)
- Lists past 12 months of invoices
- Provides monthly spending breakdown
- Shows total amount spent
- Includes invoice URLs for downloads

### Usage Breakdown (Requirement 12.4)
- Shows usage by service type
- Calculates percentage of total usage per service
- Provides detailed usage statistics

### Remaining Quota (Requirement 12.5)
- Displays current credit balance
- Shows credit limit from plan
- Calculates remaining quota
- Indicates percentage of quota used
- Highlights overage situations

## Error Handling

- **400**: Missing workspaceId parameter
- **401**: Unauthorized
- **404**: Workspace not found or access denied
- **500**: Failed to fetch billing dashboard

## Notes

- All workspace members can view the billing dashboard
- Data is aggregated from multiple sources (subscriptions, invoices, usage, credits)
- Payment methods are fetched from Stripe in real-time
- Usage statistics are calculated for the current billing period
- Historical data covers the past 12 months
- Overage charges are included in current period costs
