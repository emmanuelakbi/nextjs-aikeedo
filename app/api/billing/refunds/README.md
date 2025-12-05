# Refunds API

Handles refund requests for subscriptions and credit purchases.

## Endpoints

### POST /api/billing/refunds

Request a refund for a payment.

**Requirements:** 11.1, 11.2, 11.3, 11.4, 11.5

**Request Body:**
```json
{
  "paymentIntentId": "pi_xxx", // Optional, either this or chargeId required
  "chargeId": "ch_xxx",        // Optional, either this or paymentIntentId required
  "amount": 50.00,             // Optional, partial refund amount
  "reason": "requested_by_customer", // Optional: duplicate, fraudulent, requested_by_customer
  "workspaceId": "uuid"
}
```

**Response:**
```json
{
  "refund": {
    "id": "re_xxx",
    "amount": 50.00,
    "currency": "usd",
    "status": "succeeded",
    "reason": "requested_by_customer",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Refund processed successfully"
}
```

**Features:**
- Processes refund via Stripe (Requirement 11.1)
- Deducts credits proportionally from workspace (Requirement 11.2)
- Sends confirmation email to user (Requirement 11.3)
- Logs errors for admin review on failure (Requirement 11.4)
- Adjusts subscription if partial refund (Requirement 11.5)

### GET /api/billing/refunds

List refunds for a workspace.

**Query Parameters:**
- `workspaceId` (required): Workspace UUID
- `limit` (optional): Number of refunds to return (default: 50)

**Response:**
```json
{
  "refunds": [
    {
      "id": "uuid",
      "workspaceId": "uuid",
      "amount": -100,
      "type": "REFUND",
      "description": "Refund: 100 credits deducted (100% refund)",
      "referenceId": "re_xxx",
      "referenceType": "refund",
      "balanceBefore": 500,
      "balanceAfter": 400,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 1
}
```

## Error Handling

- **400**: Invalid request data
- **401**: Unauthorized
- **404**: Workspace not found or access denied
- **500**: Failed to process refund

## Notes

- Only workspace owners and admins can request refunds
- Refunds are processed through Stripe
- Credits are automatically deducted proportionally
- Failed refunds are logged for administrator review
