# User Management

## Overview

The User Management interface provides comprehensive tools for administrators to manage user accounts, permissions, and activity. This fulfills **Requirement 1: User Management** from the Admin Dashboard specification.

## Features

### User List View

**Location**: `/admin/users`

**Capabilities**:
- View all users in a paginated table
- Search by email or name
- Filter by status (ACTIVE, INACTIVE, SUSPENDED)
- Filter by role (USER, ADMIN)
- Sort by various fields (created date, last seen, name, email)
- Pagination with configurable page size

**Displayed Information**:
- User name and email
- Role badge (USER/ADMIN)
- Status badge (ACTIVE/INACTIVE/SUSPENDED)
- Created date
- Last seen timestamp
- Quick action buttons (View, Edit, Suspend/Activate)

### User Details View

**Location**: `/admin/users/[id]`

**Information Displayed**:

1. **Basic Information**
   - Full name (first and last)
   - Email address
   - Phone number
   - Language preference
   - Account creation date
   - Last seen timestamp

2. **Account Status**
   - Current status (ACTIVE, INACTIVE, SUSPENDED)
   - Role (USER, ADMIN)
   - Email verification status

3. **Workspaces**
   - List of owned workspaces
   - Workspace names and IDs
   - Credit balances
   - Member counts

4. **Affiliate Information** (if applicable)
   - Affiliate status
   - Referral code
   - Total earnings
   - Pending balance
   - Referral count

5. **Activity Statistics**
   - Total conversations
   - Total generations (text, image, speech, transcription)
   - Total files uploaded
   - Total documents created
   - Session count

6. **Recent Sessions**
   - Session timestamps
   - IP addresses
   - User agents (browser/device)
   - Session status

## User Actions

### Edit User

**Editable Fields**:
- First name
- Last name
- Email address
- Phone number
- Language preference
- Role (USER, ADMIN)
- Status (ACTIVE, INACTIVE, SUSPENDED)

**Validation**:
- Email must be unique
- Email must be valid format
- Role must be USER or ADMIN
- Status must be valid enum value

**API Endpoint**: `PATCH /api/admin/users/:id`

### Suspend User

**Purpose**: Temporarily disable user account access

**Effects**:
- User cannot log in
- Active sessions are invalidated
- API access is blocked
- User data is preserved

**Reason**: Optional reason for suspension (logged in audit trail)

**API Endpoint**: `POST /api/admin/users/:id/status`

**Body**:
```json
{
  "status": "SUSPENDED",
  "reason": "Policy violation"
}
```

### Activate User

**Purpose**: Re-enable a suspended or inactive user account

**Effects**:
- User can log in again
- Full platform access restored
- Previous data and settings preserved

**API Endpoint**: `POST /api/admin/users/:id/status`

**Body**:
```json
{
  "status": "ACTIVE"
}
```

### Delete User

**Purpose**: Permanently remove user account and associated data

**Effects**:
- User account is deleted
- All owned workspaces are deleted
- All user data is removed (GDPR compliance)
- Action is irreversible

**Restrictions**:
- Cannot delete yourself (current admin)
- Confirmation required
- All actions are logged

**API Endpoint**: `DELETE /api/admin/users/:id`

### Impersonate User

**Purpose**: Access platform as the user for support purposes

**Use Cases**:
- Troubleshoot user-reported issues
- Verify user experience
- Assist with account problems
- Test user-specific configurations

**Security**:
- Time-limited session (default: 1 hour)
- All actions logged with impersonation context
- Cannot impersonate other admins
- Automatic session cleanup

**API Endpoint**: `POST /api/admin/users/:id/impersonate`

**See**: [Impersonation Documentation](../../../../src/lib/admin/IMPERSONATION.md)

### View Activity

**Purpose**: Review user's platform activity and usage

**Information Shown**:
- Recent conversations and messages
- Recent AI generations (text, image, speech)
- Recent file uploads
- Recent document edits
- Session history
- Credit usage

**API Endpoint**: `GET /api/admin/users/:id/activity`

## Search and Filtering

### Search

Search users by:
- Email address (partial match)
- First name (partial match)
- Last name (partial match)

**Example**: Searching "john" will find:
- john@example.com
- John Doe
- Johnny Smith

### Filters

**Status Filter**:
- ACTIVE - Users who can access the platform
- INACTIVE - Users who haven't verified email or are disabled
- SUSPENDED - Users who have been suspended by admin

**Role Filter**:
- USER - Regular users
- ADMIN - Administrator users

**Combined Filters**: All filters can be combined for precise results

### Sorting

Sort users by:
- Created date (newest/oldest first)
- Last seen (most/least recent)
- Name (A-Z, Z-A)
- Email (A-Z, Z-A)

## API Endpoints

### List Users

```
GET /api/admin/users
```

**Query Parameters**:
- `page` (number): Page number (default: 1)
- `limit` (number): Results per page (default: 20)
- `search` (string): Search term for email/name
- `status` (string): Filter by status (ACTIVE, INACTIVE, SUSPENDED)
- `role` (string): Filter by role (USER, ADMIN)
- `sortBy` (string): Field to sort by (createdAt, lastSeen, name, email)
- `sortOrder` (string): Sort direction (asc, desc)

**Response**:
```json
{
  "users": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Get User Details

```
GET /api/admin/users/:id
```

**Response**:
```json
{
  "id": "user-123",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "USER",
  "status": "ACTIVE",
  "workspaces": [...],
  "affiliate": {...},
  "stats": {...}
}
```

### Update User

```
PATCH /api/admin/users/:id
```

**Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "newemail@example.com",
  "role": "ADMIN",
  "status": "ACTIVE"
}
```

### Delete User

```
DELETE /api/admin/users/:id
```

**Response**:
```json
{
  "message": "User deleted successfully"
}
```

## Security Considerations

### Access Control
- Only admins can access user management
- All endpoints protected by `requireAdmin()` middleware
- Admins cannot delete or suspend themselves

### Audit Logging
All user management actions are logged:
- User creation (via registration)
- User updates (field changes)
- Status changes (suspend, activate)
- User deletion
- Impersonation sessions

### Data Privacy
- Passwords are never exposed
- Sensitive data is appropriately filtered
- GDPR compliance for data deletion
- Audit trail for data access

## Usage Examples

### Find Suspended Users

1. Navigate to `/admin/users`
2. Select "SUSPENDED" from Status filter
3. Click "Apply Filters"
4. Review list of suspended users

### Reactivate a User

1. Find the user (search or filter)
2. Click "View" to see details
3. Click "Activate" button
4. Confirm action
5. User can now log in again

### Investigate User Activity

1. Navigate to user details page
2. Scroll to Activity Statistics section
3. Review generation counts and usage
4. Click "View Activity" for detailed logs
5. Check recent sessions for login history

### Support User via Impersonation

1. Find the user having issues
2. Click "Impersonate" button
3. Confirm impersonation
4. Platform loads as that user
5. Troubleshoot the issue
6. Click "End Impersonation" when done

## Performance Considerations

- User list is paginated for performance
- Search uses database indexes on email and name
- Activity queries are limited to recent records
- Consider caching for frequently accessed users

## Testing

```bash
# Run user management tests
npm test src/app/api/admin/users/route.test.ts
```

**Test Coverage**:
- List users with pagination
- Search and filter functionality
- User updates and validation
- Status changes
- User deletion
- Error handling

## Related Documentation

- [Admin Dashboard Overview](../README.md)
- [Admin API Documentation](../../../../src/app/api/admin/README.md)
- [Impersonation Feature](../../../../src/lib/admin/IMPERSONATION.md)
- [Audit Logging](../audit-logs/README.md)
