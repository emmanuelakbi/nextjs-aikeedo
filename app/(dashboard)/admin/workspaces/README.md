# Workspace Management

## Overview

The Workspace Management interface provides tools for administrators to manage workspaces, credit allocations, and ownership. This fulfills **Requirement 2: Workspace Management** from the Admin Dashboard specification.

## Features

### Workspace List View

**Location**: `/admin/workspaces`

**Capabilities**:
- View all workspaces in a paginated table
- Search by workspace name
- Sort by various fields (created date, name, credits)
- Pagination with configurable page size
- Quick access to workspace details

**Displayed Information**:
- Workspace name
- Owner name and email
- Total credits (subscription + purchased)
- Member count
- Active subscription status
- Created date
- Quick action buttons (View, Edit, Delete)

### Workspace Details View

**Location**: `/admin/workspaces/[id]`

**Information Displayed**:

1. **Basic Information**
   - Workspace name
   - Workspace ID
   - Created date
   - Last updated date

2. **Owner Information**
   - Owner name
   - Owner email
   - Owner ID
   - Link to owner's user profile

3. **Credit Information**
   - Subscription credits (from active plan)
   - Purchased credits (one-time purchases)
   - Total available credits
   - Credit usage history

4. **Subscription Details** (if active)
   - Plan name and pricing
   - Billing interval (monthly/yearly)
   - Status (active, trialing, canceled, etc.)
   - Current period start and end
   - Renewal date
   - Link to subscription details

5. **Members**
   - List of workspace members
   - Member names and emails
   - Member roles
   - Join dates

6. **Usage Statistics**
   - Total generations by type
   - Total credits consumed
   - Total files uploaded
   - Total documents created
   - Recent activity

7. **Credit Transactions**
   - Transaction history
   - Transaction types (allocation, purchase, usage, adjustment)
   - Amounts and dates
   - Reasons for adjustments

## Workspace Actions

### Edit Workspace

**Editable Fields**:
- Workspace name
- Owner (transfer ownership)

**Validation**:
- Name must not be empty
- Owner must be a valid user ID
- Owner must not already own the workspace

**API Endpoint**: `PATCH /api/admin/workspaces/:id`

**Body**:
```json
{
  "name": "New Workspace Name",
  "ownerId": "user-123"
}
```

### Adjust Credits

**Purpose**: Manually add or subtract credits from a workspace

**Use Cases**:
- Compensate for service issues
- Apply promotional credits
- Correct billing errors
- Remove fraudulent credits

**Parameters**:
- Amount (positive or negative number)
- Type (add or subtract)
- Reason (required for audit trail)

**Effects**:
- Credits are immediately added/subtracted
- Transaction is recorded in credit history
- Action is logged in audit trail
- Owner is notified (optional)

**API Endpoint**: `POST /api/admin/workspaces/:id/credits`

**Body**:
```json
{
  "amount": 1000,
  "type": "add",
  "reason": "Compensation for service outage"
}
```

### Transfer Ownership

**Purpose**: Change the owner of a workspace

**Use Cases**:
- User requests ownership transfer
- Account consolidation
- Business ownership changes
- Support escalations

**Effects**:
- New owner gains full workspace access
- Previous owner becomes a regular member
- All workspace data is preserved
- Subscription remains active

**Restrictions**:
- New owner must be a valid user
- New owner cannot already own the workspace
- Action is logged in audit trail

**API Endpoint**: `PATCH /api/admin/workspaces/:id`

**Body**:
```json
{
  "ownerId": "new-owner-user-id"
}
```

### Delete Workspace

**Purpose**: Permanently remove a workspace and all associated data

**Effects**:
- Workspace is deleted
- All members are removed
- All workspace data is deleted (conversations, generations, files, documents)
- Credit transactions are preserved for audit
- Subscription is canceled (if active)
- Action is irreversible

**Restrictions**:
- Confirmation required
- All actions are logged
- Cannot be undone

**API Endpoint**: `DELETE /api/admin/workspaces/:id`

### View Usage Statistics

**Purpose**: Review workspace's platform usage and credit consumption

**Information Shown**:
- Generation statistics by type (text, image, speech, transcription)
- Credit consumption over time
- Recent generations with details
- File upload statistics
- Document creation statistics
- Member activity

**API Endpoint**: `GET /api/admin/workspaces/:id/usage`

## Search and Filtering

### Search

Search workspaces by:
- Workspace name (partial match)
- Owner email (partial match)
- Owner name (partial match)

**Example**: Searching "acme" will find:
- Workspace named "Acme Corp"
- Workspace owned by acme@example.com
- Workspace owned by "Acme Admin"

### Sorting

Sort workspaces by:
- Created date (newest/oldest first)
- Name (A-Z, Z-A)
- Credits (highest/lowest first)
- Member count (most/least members)

## API Endpoints

### List Workspaces

```
GET /api/admin/workspaces
```

**Query Parameters**:
- `page` (number): Page number (default: 1)
- `limit` (number): Results per page (default: 20)
- `search` (string): Search term for name/owner
- `sortBy` (string): Field to sort by (createdAt, name, credits)
- `sortOrder` (string): Sort direction (asc, desc)

**Response**:
```json
{
  "workspaces": [
    {
      "id": "workspace-123",
      "name": "My Workspace",
      "subscriptionCredits": 5000,
      "purchasedCredits": 1000,
      "owner": {
        "id": "user-123",
        "email": "owner@example.com",
        "firstName": "John",
        "lastName": "Doe"
      },
      "subscription": {
        "id": "sub-123",
        "status": "active",
        "plan": {
          "name": "Pro Plan"
        }
      },
      "_count": {
        "members": 5
      },
      "createdAt": "2024-01-01T00:00:00Z"
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

### Get Workspace Details

```
GET /api/admin/workspaces/:id
```

**Response**:
```json
{
  "id": "workspace-123",
  "name": "My Workspace",
  "subscriptionCredits": 5000,
  "purchasedCredits": 1000,
  "owner": {...},
  "subscription": {...},
  "members": [...],
  "creditTransactions": [...],
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### Update Workspace

```
PATCH /api/admin/workspaces/:id
```

**Body**:
```json
{
  "name": "New Workspace Name",
  "ownerId": "new-owner-user-id"
}
```

**Response**:
```json
{
  "id": "workspace-123",
  "name": "New Workspace Name",
  "ownerId": "new-owner-user-id",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### Adjust Credits

```
POST /api/admin/workspaces/:id/credits
```

**Body**:
```json
{
  "amount": 1000,
  "type": "add",
  "reason": "Promotional credits"
}
```

**Response**:
```json
{
  "workspace": {
    "id": "workspace-123",
    "subscriptionCredits": 5000,
    "purchasedCredits": 2000
  },
  "transaction": {
    "id": "txn-123",
    "amount": 1000,
    "type": "ADMIN_ADJUSTMENT",
    "reason": "Promotional credits",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### Get Usage Statistics

```
GET /api/admin/workspaces/:id/usage
```

**Response**:
```json
{
  "generations": {
    "text": 150,
    "image": 50,
    "speech": 30,
    "transcription": 20
  },
  "creditsConsumed": 3500,
  "filesUploaded": 45,
  "documentsCreated": 12,
  "recentGenerations": [...],
  "creditTransactions": [...]
}
```

### Delete Workspace

```
DELETE /api/admin/workspaces/:id
```

**Response**:
```json
{
  "message": "Workspace deleted successfully"
}
```

## Credit Management

### Credit Types

1. **Subscription Credits**
   - Allocated from active subscription plan
   - Renewed each billing cycle
   - Cannot be transferred between workspaces
   - Expire at end of billing period (if not used)

2. **Purchased Credits**
   - One-time credit purchases
   - Never expire
   - Can be manually adjusted by admin
   - Persist across subscription changes

### Credit Transaction Types

- `ALLOCATION` - Credits allocated from subscription
- `PURCHASE` - Credits purchased by user
- `USAGE` - Credits consumed by AI generation
- `ADMIN_ADJUSTMENT` - Manual adjustment by admin
- `REFUND` - Credits refunded from canceled generation
- `EXPIRATION` - Unused subscription credits expired

### Credit Adjustment Best Practices

1. **Always provide a reason** - Required for audit trail
2. **Use appropriate amounts** - Match the issue or promotion
3. **Document the context** - Include ticket numbers or references
4. **Notify the user** - Inform them of the adjustment
5. **Monitor for abuse** - Track frequent adjustments

## Security Considerations

### Access Control
- Only admins can access workspace management
- All endpoints protected by `requireAdmin()` middleware
- Workspace owners cannot see admin functions

### Audit Logging
All workspace management actions are logged:
- Workspace creation
- Workspace updates (name, owner)
- Credit adjustments (amount, reason)
- Workspace deletion
- Usage queries

### Data Privacy
- Workspace data is isolated between workspaces
- Members can only see their workspace data
- Admins can see all workspace data
- Deletion is permanent and GDPR compliant

## Usage Examples

### Compensate User for Service Issue

1. Navigate to `/admin/workspaces`
2. Search for the affected workspace
3. Click "View" to see details
4. Click "Adjust Credits"
5. Enter amount (e.g., 1000)
6. Select "Add"
7. Enter reason: "Compensation for API outage on 2024-01-15"
8. Click "Adjust"
9. Credits are immediately added

### Transfer Workspace Ownership

1. Find the workspace
2. Click "Edit"
3. Search for new owner by email
4. Select new owner from results
5. Click "Save"
6. Ownership is transferred
7. Previous owner becomes regular member

### Investigate High Credit Usage

1. Navigate to workspace details
2. Click "View Usage"
3. Review generation statistics
4. Check recent generations for anomalies
5. Review credit transaction history
6. Contact owner if suspicious activity found

### Delete Inactive Workspace

1. Find the workspace
2. Verify it's inactive (no recent activity)
3. Check if subscription is canceled
4. Click "Delete"
5. Confirm deletion
6. Workspace and all data are removed

## Performance Considerations

- Workspace list is paginated for performance
- Search uses database indexes on name and owner
- Usage queries are limited to recent records
- Credit transactions are paginated
- Consider caching for frequently accessed workspaces

## Testing

```bash
# Run workspace management tests
npm test src/app/api/admin/workspaces/route.test.ts
```

**Test Coverage**:
- List workspaces with pagination
- Search and filter functionality
- Workspace updates and validation
- Credit adjustments
- Ownership transfer
- Workspace deletion
- Error handling

## Related Documentation

- [Admin Dashboard Overview](../README.md)
- [Admin API Documentation](../../../../src/app/api/admin/README.md)
- [Subscription Management](../subscriptions/README.md)
- [Credit System](../../../../docs/CREDIT_SYSTEM.md)
- [Audit Logging](../audit-logs/README.md)
