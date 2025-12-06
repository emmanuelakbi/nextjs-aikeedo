# Subscription Management

## Overview

The Subscription Management interface provides tools for administrators to manage subscriptions, billing, and payments. This fulfills **Requirement 3: Subscription Management** from the Admin Dashboard specification.

## Features

### Subscription List View

**Location**: `/admin/subscriptions`

**Capabilities**:

- View all subscriptions in a paginated table
- Search by workspace name or owner email
- Filter by status (active, trialing, canceled, past_due, etc.)
- Sort by various fields (created date, renewal date, status)
- Pagination with configurable page size
- Quick access to subscription details

**Displayed Information**:

- Workspace name
- Owner name and email
- Plan name and pricing
- Status badge (color-coded)
- Current period dates
- Renewal date
- Quick action buttons (View, Cancel, Reactivate)

### Subscription Details View

**Location**: `/admin/subscriptions/[id]`

**Information Displayed**:

1. **Basic Information**
   - Subscription ID
   - Stripe subscription ID
   - Status (active, trialing, canceled, past_due, unpaid)
   - Created date
   - Last updated date

2. **Workspace Information**
   - Workspace name and ID
   - Owner name and email
   - Total credits available
   - Link to workspace details

3. **Plan Details**
   - Plan name
   - Price and currency
   - Billing interval (monthly/yearly)
   - Credit allocation per period
   - Plan features

4. **Billing Information**
   - Current period start and end
   - Next renewal date
   - Billing cycle anchor
   - Cancel at period end flag
   - Canceled at date (if applicable)

5. **Trial Information** (if applicable)
   - Trial start date
   - Trial end date
   - Days remaining in trial

6. **Invoice History**
   - List of all invoices
   - Invoice dates and amounts
   - Payment status
   - Download links (Stripe)

7. **Credit Allocations**
   - Allocation history
   - Dates and amounts
   - Current allocation status

## Subscription Actions

### Cancel Subscription

**Purpose**: Cancel a subscription immediately or at period end

**Options**:

1. **Cancel at Period End** (default)
   - Subscription remains active until current period ends
   - User retains access until renewal date
   - No refund issued
   - Credits remain available until period end

2. **Cancel Immediately**
   - Subscription is canceled immediately
   - User loses access immediately
   - Prorated refund may be issued
   - Credits are removed

**Parameters**:

- `immediate` (boolean): Cancel immediately or at period end
- `reason` (string, optional): Reason for cancellation

**API Endpoint**: `POST /api/admin/subscriptions/:id/cancel`

**Body**:

```json
{
  "immediate": false,
  "reason": "User requested cancellation"
}
```

### Reactivate Subscription

**Purpose**: Reactivate a canceled subscription

**Use Cases**:

- User changed their mind
- Cancellation was a mistake
- Support resolution

**Effects**:

- Subscription status changes to active
- Billing resumes on next cycle
- Credits are restored
- User regains full access

**Restrictions**:

- Can only reactivate canceled subscriptions
- Must be done before subscription fully expires
- Stripe subscription must still exist

**API Endpoint**: `POST /api/admin/subscriptions/:id/reactivate`

### View Payment History

**Purpose**: Review all payments and invoices for a subscription

**Information Shown**:

- Invoice ID and Stripe invoice ID
- Amount and currency
- Status (paid, open, void, uncollectible)
- Due date and paid date
- Payment method
- Download link (Stripe hosted invoice)

**API Endpoint**: Included in subscription details response

### Process Refund

**Purpose**: Issue a refund for a payment

**Location**: `/admin/subscriptions` (via payment history)

**Parameters**:

- Invoice ID
- Amount (full or partial)
- Reason (required)

**Effects**:

- Refund is processed via Stripe
- Invoice status is updated
- Credits may be adjusted
- Action is logged in audit trail

**See**: [Refund Processing](#refund-processing)

## Subscription Statuses

### Active

- Subscription is active and in good standing
- User has full access
- Billing is current
- Credits are allocated

### Trialing

- Subscription is in trial period
- User has full access
- No charges yet
- Trial credits allocated

### Canceled

- Subscription has been canceled
- May still be active until period end
- No future billing
- Credits expire at period end

### Past Due

- Payment failed
- User may have limited access
- Retry attempts in progress
- Requires payment method update

### Unpaid

- Multiple payment failures
- Subscription is suspended
- User has no access
- Requires manual intervention

### Incomplete

- Initial payment failed
- Subscription never activated
- User has no access
- Requires payment completion

### Incomplete Expired

- Initial payment failed and expired
- Subscription is canceled
- User has no access
- Cannot be recovered

## Search and Filtering

### Search

Search subscriptions by:

- Workspace name (partial match)
- Owner email (partial match)
- Owner name (partial match)

### Filters

**Status Filter**:

- Active - Currently active subscriptions
- Trialing - Subscriptions in trial period
- Canceled - Canceled subscriptions
- Past Due - Subscriptions with failed payments
- Unpaid - Subscriptions with multiple failures
- All - Show all subscriptions

### Sorting

Sort subscriptions by:

- Created date (newest/oldest first)
- Renewal date (soonest/latest first)
- Status (alphabetical)
- Plan name (A-Z, Z-A)

## API Endpoints

### List Subscriptions

```
GET /api/admin/subscriptions
```

**Query Parameters**:

- `page` (number): Page number (default: 1)
- `limit` (number): Results per page (default: 20)
- `search` (string): Search term for workspace/owner
- `status` (string): Filter by status
- `sortBy` (string): Field to sort by
- `sortOrder` (string): Sort direction (asc, desc)

**Response**:

```json
{
  "subscriptions": [
    {
      "id": "sub-123",
      "status": "active",
      "currentPeriodStart": "2024-01-01T00:00:00Z",
      "currentPeriodEnd": "2024-02-01T00:00:00Z",
      "cancelAtPeriodEnd": false,
      "workspace": {
        "id": "workspace-123",
        "name": "My Workspace",
        "owner": {
          "email": "owner@example.com",
          "firstName": "John",
          "lastName": "Doe"
        }
      },
      "plan": {
        "name": "Pro Plan",
        "price": 2900,
        "currency": "USD",
        "interval": "month"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

### Get Subscription Details

```
GET /api/admin/subscriptions/:id
```

**Response**:

```json
{
  "id": "sub-123",
  "stripeSubscriptionId": "sub_stripe123",
  "status": "active",
  "currentPeriodStart": "2024-01-01T00:00:00Z",
  "currentPeriodEnd": "2024-02-01T00:00:00Z",
  "trialStart": null,
  "trialEnd": null,
  "cancelAtPeriodEnd": false,
  "canceledAt": null,
  "workspace": {...},
  "plan": {...},
  "invoices": [...],
  "creditAllocations": [...]
}
```

### Cancel Subscription

```
POST /api/admin/subscriptions/:id/cancel
```

**Body**:

```json
{
  "immediate": false,
  "reason": "User requested cancellation"
}
```

**Response**:

```json
{
  "id": "sub-123",
  "status": "active",
  "cancelAtPeriodEnd": true,
  "canceledAt": "2024-01-15T10:30:00Z"
}
```

### Reactivate Subscription

```
POST /api/admin/subscriptions/:id/reactivate
```

**Response**:

```json
{
  "id": "sub-123",
  "status": "active",
  "cancelAtPeriodEnd": false,
  "canceledAt": null
}
```

## Payment Management

### View Payment History

**Location**: Subscription details page

**Information**:

- All invoices for the subscription
- Payment status and dates
- Amounts and currency
- Stripe invoice links

### Failed Payments

**Handling**:

1. Stripe automatically retries failed payments
2. Subscription status changes to `past_due`
3. User receives email notification
4. Admin can view failed payment details
5. Admin can contact user to update payment method

**Resolution**:

- User updates payment method in their account
- Stripe retries payment automatically
- Subscription returns to `active` status
- Admin monitors for resolution

### Refund Processing

**Location**: `/admin/subscriptions` or payment history

**Process**:

1. Navigate to subscription with payment to refund
2. Find the invoice in payment history
3. Click "Refund" button
4. Enter refund amount (full or partial)
5. Enter reason (required)
6. Confirm refund
7. Refund is processed via Stripe
8. Invoice status is updated
9. User is notified

**API Endpoint**: `POST /api/admin/refunds`

**Body**:

```json
{
  "invoiceId": "inv-123",
  "amount": 2900,
  "reason": "Service issue compensation"
}
```

## Credit Allocation

### Automatic Allocation

- Credits are automatically allocated when subscription is created
- Credits are renewed at the start of each billing period
- Unused subscription credits expire at period end
- Purchased credits never expire

### Manual Adjustment

If credit allocation fails or needs correction:

1. Navigate to workspace details
2. Use "Adjust Credits" feature
3. Add missing credits
4. Document reason in adjustment

**See**: [Workspace Management - Credit Adjustment](../workspaces/README.md#adjust-credits)

## Security Considerations

### Access Control

- Only admins can access subscription management
- All endpoints protected by `requireAdmin()` middleware
- Subscription owners cannot see admin functions

### Audit Logging

All subscription management actions are logged:

- Subscription cancellation (immediate or at period end)
- Subscription reactivation
- Refund processing
- Payment status changes

### Payment Security

- Payment data is handled by Stripe (PCI compliant)
- No credit card data is stored in database
- Stripe webhook validates payment events
- All payment actions are logged

## Usage Examples

### Cancel Subscription at User Request

1. Navigate to `/admin/subscriptions`
2. Search for user's subscription
3. Click "View" to see details
4. Click "Cancel Subscription"
5. Select "Cancel at Period End"
6. Enter reason: "User requested cancellation"
7. Click "Confirm"
8. User retains access until period end

### Handle Failed Payment

1. Filter subscriptions by "Past Due" status
2. Review failed payment details
3. Contact user to update payment method
4. Monitor for automatic retry success
5. If payment succeeds, status returns to active
6. If payment continues to fail, subscription becomes unpaid

### Process Refund for Service Issue

1. Find the subscription
2. View payment history
3. Locate the invoice to refund
4. Click "Refund"
5. Enter amount (full or partial)
6. Enter reason: "Compensation for service outage"
7. Confirm refund
8. Refund is processed via Stripe
9. User receives refund notification

### Reactivate Canceled Subscription

1. Find the canceled subscription
2. Verify it's still within grace period
3. Click "Reactivate"
4. Confirm reactivation
5. Subscription returns to active status
6. Billing resumes on next cycle

## Performance Considerations

- Subscription list is paginated for performance
- Search uses database indexes on workspace and owner
- Invoice history is limited to recent records
- Stripe API calls are cached when possible
- Consider background jobs for bulk operations

## Testing

```bash
# Run subscription management tests
npm test src/app/api/admin/subscriptions/route.test.ts
```

**Test Coverage**:

- List subscriptions with pagination
- Search and filter functionality
- Subscription cancellation
- Subscription reactivation
- Payment history retrieval
- Error handling

## Related Documentation

- [Admin Dashboard Overview](../README.md)
- [Admin API Documentation](../../../../src/app/api/admin/README.md)
- [Workspace Management](../workspaces/README.md)
- [Billing System](../../../../docs/BILLING.md)
- [Credit System](../../../../docs/CREDIT_SYSTEM.md)
- [Stripe Integration](../../../../src/infrastructure/services/STRIPE_INTEGRATION.md)
