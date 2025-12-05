# Usage Tracking API

Handles usage tracking, overage calculations, and billing for usage-based charges.

## Endpoints

### GET /api/billing/usage

Get usage statistics for a workspace.

**Requirements:** 10.4, 12.1, 12.4

**Query Parameters:**
- `workspaceId` (required): Workspace UUID
- `startDate` (optional): Start date for usage period (ISO 8601)
- `endDate` (optional): End date for usage period (ISO 8601)

**Response:**
```json
{
  "usage": {
    "total": 1500,
    "limit": 1000,
    "remaining": 0,
    "currentBalance": 500,
    "overage": 500,
    "overageCharges": 5.00,
    "byServiceType": [
      {
        "service_type": "AI Completion",
        "total": 800
      },
      {
        "service_type": "Image Generation",
        "total": 700
      }
    ]
  },
  "transactions": [...],
  "period": {
    "start": "2024-01-01T00:00:00.000Z",
    "end": "2024-02-01T00:00:00.000Z"
  }
}
```

**Features:**
- Real-time usage tracking (Requirement 10.4)
- Overage calculation (Requirements 10.1, 10.2)
- Breakdown by service type (Requirement 12.4)
- Current balance and remaining quota

## Overage Endpoints

### POST /api/billing/usage/overage

Calculate and charge overage fees for a billing period.

**Requirements:** 10.1, 10.2, 10.3, 10.5

**Request Body:**
```json
{
  "workspaceId": "uuid",
  "billingPeriodStart": "2024-01-01T00:00:00.000Z", // Optional
  "billingPeriodEnd": "2024-02-01T00:00:00.000Z"    // Optional
}
```

**Response:**
```json
{
  "message": "Overage charges calculated and added to next invoice",
  "totalUsage": 1500,
  "limit": 1000,
  "overage": 500,
  "overageRate": 0.01,
  "charges": 5.00,
  "billingPeriod": {
    "start": "2024-01-01T00:00:00.000Z",
    "end": "2024-02-01T00:00:00.000Z"
  }
}
```

**Features:**
- Checks if usage exceeds plan limits (Requirement 10.1)
- Calculates charges using per-unit pricing (Requirement 10.2)
- Adds charges to next invoice (Requirement 10.3)
- Sends notification email to user (Requirement 10.5)

### GET /api/billing/usage/overage

Get current overage status for a workspace.

**Requirements:** 10.1, 10.4

**Query Parameters:**
- `workspaceId` (required): Workspace UUID

**Response:**
```json
{
  "hasOverage": true,
  "totalUsage": 1500,
  "limit": 1000,
  "overage": 500,
  "overageRate": 0.01,
  "estimatedCharges": 5.00,
  "currentPeriod": {
    "start": "2024-01-01T00:00:00.000Z",
    "end": "2024-02-01T00:00:00.000Z"
  }
}
```

## Error Handling

- **400**: Invalid request data or missing required parameters
- **401**: Unauthorized
- **404**: Workspace not found or access denied
- **500**: Failed to process request

## Notes

- Usage is tracked in real-time through credit transactions
- Overage charges are calculated based on plan limits
- Default overage rate is $0.01 per credit (configurable in plan limits)
- Overage charges are added as invoice items in Stripe
- Users are notified when overage occurs
- Only workspace owners can trigger overage calculations
