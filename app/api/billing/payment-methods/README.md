# Payment Methods API

This API handles payment method management for workspaces, including adding, updating, removing, and checking expiring payment methods.

## Requirements

Implements the following requirements from the billing module:

- **6.1**: Add and list payment methods
- **6.2**: Update payment methods (set as default)
- **6.3**: Remove payment methods
- **6.4**: Check for expiring payment methods
- **6.5**: Never store full card details locally (only Stripe IDs and metadata)

## Endpoints

### List Payment Methods

```
GET /api/billing/payment-methods?workspaceId={workspaceId}
```

Lists all payment methods for a workspace.

**Query Parameters:**

- `workspaceId` (required): Workspace ID

**Response:**

```json
{
  "paymentMethods": [
    {
      "id": "pm_123",
      "workspaceId": "ws_123",
      "stripePaymentMethodId": "pm_stripe_123",
      "type": "card",
      "last4": "4242",
      "brand": "visa",
      "expiryMonth": 12,
      "expiryYear": 2025,
      "isDefault": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Add Payment Method

```
POST /api/billing/payment-methods
```

Adds a new payment method to a workspace.

**Request Body:**

```json
{
  "workspaceId": "ws_123",
  "paymentMethodId": "pm_stripe_123",
  "setAsDefault": false
}
```

**Response:**

```json
{
  "paymentMethod": {
    "id": "pm_123",
    "workspaceId": "ws_123",
    "stripePaymentMethodId": "pm_stripe_123",
    "type": "card",
    "last4": "4242",
    "brand": "visa",
    "expiryMonth": 12,
    "expiryYear": 2025,
    "isDefault": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Payment method added successfully"
}
```

### Update Payment Method

```
PATCH /api/billing/payment-methods/{id}
```

Updates a payment method (currently only supports setting as default).

**Request Body:**

```json
{
  "workspaceId": "ws_123",
  "setAsDefault": true
}
```

**Response:**

```json
{
  "paymentMethod": {
    "id": "pm_123",
    "isDefault": true,
    ...
  },
  "message": "Payment method set as default"
}
```

### Remove Payment Method

```
DELETE /api/billing/payment-methods/{id}?workspaceId={workspaceId}
```

Removes a payment method from a workspace.

**Query Parameters:**

- `workspaceId` (required): Workspace ID

**Response:**

```json
{
  "message": "Payment method removed successfully"
}
```

**Note:** Cannot remove the only payment method for a workspace.

### Check Expiring Payment Methods

```
GET /api/billing/payment-methods/expiring?workspaceId={workspaceId}&days={days}
```

Gets payment methods that are expiring within the specified threshold.

**Query Parameters:**

- `workspaceId` (required): Workspace ID
- `days` (optional): Days threshold (default: 30)

**Response:**

```json
{
  "expiringPaymentMethods": [
    {
      "id": "pm_123",
      "expiryMonth": 12,
      "expiryYear": 2024,
      ...
    }
  ],
  "count": 1,
  "daysThreshold": 30
}
```

## Security

- All endpoints require authentication via NextAuth session
- Users must be workspace owners or admins to manage payment methods
- Full card details are never stored locally (only Stripe IDs and metadata)
- Payment method operations are performed through Stripe API

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200`: Success
- `400`: Bad request (invalid parameters)
- `401`: Unauthorized (not authenticated)
- `404`: Not found (workspace or payment method)
- `500`: Internal server error

Error responses include:

```json
{
  "error": "Error message",
  "details": "Detailed error information"
}
```

## Usage Example

```typescript
import {
  listPaymentMethods,
  addPaymentMethod,
  setDefaultPaymentMethod,
  removePaymentMethod,
  getExpiringPaymentMethods,
} from '@/lib/billing/payment-methods';

// List payment methods
const { paymentMethods } = await listPaymentMethods({
  workspaceId: 'ws_123',
});

// Add payment method
const { paymentMethod } = await addPaymentMethod({
  workspaceId: 'ws_123',
  paymentMethodId: 'pm_stripe_123',
  setAsDefault: true,
});

// Set as default
await setDefaultPaymentMethod('pm_123', 'ws_123');

// Remove payment method
await removePaymentMethod({
  paymentMethodId: 'pm_123',
  workspaceId: 'ws_123',
});

// Check expiring payment methods
const { expiringPaymentMethods } = await getExpiringPaymentMethods({
  workspaceId: 'ws_123',
  daysThreshold: 30,
});
```
