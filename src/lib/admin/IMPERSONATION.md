# Admin Impersonation Feature

## Overview

The impersonation feature allows administrators to temporarily access the application as another user for support and troubleshooting purposes. All impersonation sessions are time-limited and fully audited.

## Requirements

**Admin Dashboard 1 - User Management**: Impersonate users for support

## Features

- **Time-Limited Sessions**: Impersonation sessions automatically expire after 1 hour
- **Audit Logging**: All impersonation actions are logged with admin ID, target user, timestamps, and IP addresses
- **Security Restrictions**:
  - Only admins can impersonate users
  - Cannot impersonate other admin users
  - Cannot impersonate inactive users
- **Session Management**: Track and manage multiple active impersonation sessions

## Architecture

### Components

1. **Impersonation Service** (`src/lib/admin/impersonation.ts`)
   - Manages impersonation sessions in memory
   - Handles session creation, validation, and cleanup
   - Integrates with audit logging

2. **API Routes**
   - `POST /api/admin/users/:id/impersonate` - Start impersonation
   - `DELETE /api/admin/users/:id/impersonate` - End impersonation
   - `GET /api/admin/impersonation` - Get active sessions

3. **React Hook** (`src/lib/hooks/use-impersonation.ts`)
   - Provides client-side impersonation management
   - Handles loading states and errors

4. **UI Components**
   - `ImpersonationButton` - Button with confirmation dialog
   - `ActiveImpersonations` - Display active sessions

## Usage

### Starting Impersonation (API)

```typescript
import { startImpersonation } from '@/lib/admin/impersonation';

const session = await startImpersonation(
  adminId,
  targetUserId,
  ipAddress,
  userAgent
);

console.log('Session ID:', session.id);
console.log('Expires at:', session.expiresAt);
```

### Using the React Hook

```typescript
import { useImpersonation } from '@/lib/hooks/use-impersonation';

function AdminPanel() {
  const { startImpersonation, loading, error } = useImpersonation();

  const handleImpersonate = async (userId: string) => {
    const session = await startImpersonation(userId);
    if (session) {
      // Open in new tab
      window.open(`/dashboard?impersonation=${session.id}`, '_blank');
    }
  };

  return (
    <button onClick={() => handleImpersonate('user-id')}>
      Impersonate User
    </button>
  );
}
```

### Using the UI Component

```typescript
import { ImpersonationButton } from '@/components/ui/admin';

function UserManagement({ user }) {
  return (
    <ImpersonationButton
      userId={user.id}
      userEmail={user.email}
      userName={`${user.firstName} ${user.lastName}`}
      onSuccess={() => console.log('Impersonation started')}
    />
  );
}
```

### Displaying Active Sessions

```typescript
import { ActiveImpersonations } from '@/components/ui/admin';

function AdminDashboard() {
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <ActiveImpersonations />
      {/* Other admin content */}
    </div>
  );
}
```

## API Reference

### POST /api/admin/users/:id/impersonate

Starts an impersonation session.

**Request:**

- Method: `POST`
- Path: `/api/admin/users/:id/impersonate`
- Auth: Admin required

**Response:**

```json
{
  "success": true,
  "session": {
    "id": "imp_admin123_user456_1234567890",
    "targetUser": {
      "id": "user456",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "USER",
      "currentWorkspaceId": "workspace789"
    },
    "expiresAt": "2024-01-01T13:00:00.000Z"
  }
}
```

### DELETE /api/admin/users/:id/impersonate

Ends an impersonation session.

**Request:**

- Method: `DELETE`
- Path: `/api/admin/users/:id/impersonate?sessionId=imp_...`
- Auth: Admin required

**Response:**

```json
{
  "success": true,
  "message": "Impersonation session ended"
}
```

### GET /api/admin/impersonation

Gets all active impersonation sessions for the current admin.

**Request:**

- Method: `GET`
- Path: `/api/admin/impersonation`
- Auth: Admin required

**Response:**

```json
{
  "sessions": [
    {
      "id": "imp_admin123_user456_1234567890",
      "targetUser": {
        "id": "user456",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe"
      },
      "expiresAt": "2024-01-01T13:00:00.000Z",
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

## Security Considerations

1. **Audit Trail**: Every impersonation action is logged with:
   - Admin ID
   - Target user ID
   - Session ID
   - Start/end timestamps
   - IP address
   - User agent

2. **Time Limits**: Sessions automatically expire after 1 hour to minimize security risk

3. **Restrictions**:
   - Only users with ADMIN role can impersonate
   - Cannot impersonate other admins
   - Cannot impersonate inactive users

4. **Session Cleanup**: Expired sessions are automatically cleaned up every 5 minutes

## Audit Log Examples

### Impersonation Start

```json
{
  "adminId": "admin123",
  "action": "user.impersonate.start",
  "targetType": "user",
  "targetId": "user456",
  "changes": {
    "sessionId": "imp_admin123_user456_1234567890",
    "expiresAt": "2024-01-01T13:00:00.000Z"
  },
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

### Impersonation End

```json
{
  "adminId": "admin123",
  "action": "user.impersonate.end",
  "targetType": "user",
  "targetId": "user456",
  "changes": {
    "sessionId": "imp_admin123_user456_1234567890",
    "duration": 1800000
  },
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

## Future Enhancements

Potential improvements for the impersonation feature:

1. **Persistent Sessions**: Store sessions in database for persistence across server restarts
2. **Configurable Duration**: Allow admins to set custom session durations
3. **Notification System**: Notify users when they are being impersonated
4. **Session History**: View past impersonation sessions
5. **Permission Restrictions**: Limit what actions can be performed during impersonation
6. **Multi-Factor Authentication**: Require additional verification before impersonation
