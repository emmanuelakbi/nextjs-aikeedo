# Invoice API Routes

This directory contains API routes for invoice management in the billing module.

## Requirements

Implements the following requirements from the billing specification:
- **5.1**: Generate invoice when payment occurs
- **5.2**: Display all past invoices
- **5.3**: Provide PDF format
- **5.4**: Include itemized charges
- **5.5**: Email invoice to billing email

## Routes

### GET /api/billing/invoices

List invoices for a workspace.

**Query Parameters:**
- `workspaceId` (required): Workspace ID
- `limit` (optional): Number of invoices to return (default: 50)
- `offset` (optional): Pagination offset (default: 0)
- `status` (optional): Filter by invoice status (DRAFT, OPEN, PAID, VOID, UNCOLLECTIBLE)

**Response:**
```json
{
  "invoices": [
    {
      "id": "invoice_id",
      "workspaceId": "workspace_id",
      "subscriptionId": "subscription_id",
      "stripeInvoiceId": "in_xxx",
      "amount": 2000,
      "currency": "usd",
      "status": "PAID",
      "paidAt": "2024-01-15T10:30:00Z",
      "invoiceUrl": "https://invoice.stripe.com/...",
      "invoicePdfUrl": "https://invoice.stripe.com/.../pdf",
      "description": "Subscription payment",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 10,
  "limit": 50,
  "offset": 0
}
```

### GET /api/billing/invoices/[id]

Get detailed invoice information including line items.

**Response:**
```json
{
  "invoice": {
    "id": "invoice_id",
    "workspaceId": "workspace_id",
    "subscriptionId": "subscription_id",
    "stripeInvoiceId": "in_xxx",
    "amount": 2000,
    "currency": "usd",
    "status": "PAID",
    "paidAt": "2024-01-15T10:30:00Z",
    "invoiceUrl": "https://invoice.stripe.com/...",
    "invoicePdfUrl": "https://invoice.stripe.com/.../pdf",
    "description": "Subscription payment",
    "lineItems": [
      {
        "description": "Pro Plan - Monthly",
        "amount": 2000,
        "quantity": 1,
        "unitAmount": 2000
      }
    ],
    "subtotal": 2000,
    "tax": 0,
    "total": 2000,
    "customerEmail": "user@example.com",
    "customerName": "John Doe",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### GET /api/billing/invoices/[id]/pdf

Get the PDF URL for an invoice.

**Response:**
```json
{
  "pdfUrl": "https://invoice.stripe.com/.../pdf"
}
```

### POST /api/billing/invoices/[id]/send

Send invoice email to the workspace owner.

**Response:**
```json
{
  "success": true,
  "message": "Invoice email sent successfully"
}
```

## Usage Examples

### List Invoices

```typescript
const response = await fetch(
  `/api/billing/invoices?workspaceId=${workspaceId}&limit=10`,
  {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  }
);

const { invoices, total } = await response.json();
```

### Get Invoice Details

```typescript
const response = await fetch(`/api/billing/invoices/${invoiceId}`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
});

const { invoice } = await response.json();
```

### Download Invoice PDF

```typescript
const response = await fetch(`/api/billing/invoices/${invoiceId}/pdf`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
});

const { pdfUrl } = await response.json();

// Redirect to PDF or open in new tab
window.open(pdfUrl, '_blank');
```

### Send Invoice Email

```typescript
const response = await fetch(`/api/billing/invoices/${invoiceId}/send`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
});

const { success, message } = await response.json();
```

## Authentication

All routes require authentication via NextAuth session. Users can only access invoices for workspaces they own or are members of.

## Error Handling

All routes return appropriate HTTP status codes:
- `200`: Success
- `400`: Bad request (missing parameters)
- `401`: Unauthorized (not authenticated)
- `403`: Forbidden (no access to workspace)
- `404`: Not found
- `500`: Internal server error

Error responses include a descriptive message:
```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```

## Integration with Stripe Webhooks

Invoices are automatically created and updated via Stripe webhooks:
- `invoice.created`: Creates invoice record
- `invoice.finalized`: Updates invoice with final details
- `invoice.payment_succeeded`: Marks invoice as paid and sends email
- `invoice.payment_failed`: Updates invoice status

See `/api/webhooks/stripe` for webhook implementation.
