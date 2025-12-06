# Admin Role-Based Access Control (RBAC)

This module provides comprehensive role-based access control for admin features in the AIKEEDO platform.

**Requirements:** Admin Dashboard 2 - Role-based access control, Admin Dashboard 8 - Audit Logging

## Overview

The RBAC system ensures that only users with the `ADMIN` role can access administrative features. It provides utilities for both server-side and client-side access control, along with automatic audit logging of all admin actions.

## Features

- ✅ Server-side admin guards for API routes and pages
- ✅ Client-side hooks for conditional rendering
- ✅ Middleware protection for admin routes
- ✅ Automatic audit logging of admin actions
- ✅ Type-safe error handling
- ✅ Request context tracking (IP, user agent)

## Usage

### Server Components (Pages)

Use `requireAdminPage()` in server components to enforce admin access:

```typescript
// app/admin/page.tsx
import { requireAdminPage } from '@/lib/admin';

export default async function AdminPage() {
  // Redirects to /dashboard if not admin
  const session = await requireAdminPage();

  return <div>Welcome, Admin {session.user.name}</div>;
}
```

### API Routes

Use `requireAdmin()` or `withAdminAuth()` in API routes:

```typescript
// app/api/admin/users/route.ts
import { requireAdmin } from '@/lib/admin';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // Throws AdminAccessDeniedError if not admin
  const session = await requireAdmin();

  // Your admin logic here
  return Response.json({ users: [] });
}
```

Or use the higher-order function:

```typescript
import { withAdminAuth } from '@/lib/admin';

async function handler(request: NextRequest) {
  // Admin check is automatic
  return Response.json({ users: [] });
}

export const GET = withAdminAuth(handler);
```

### Server Actions

Use `requireAdmin()` in server actions:

```typescript
'use server';

import { requireAdmin, logAdminAction } from '@/lib/admin';

export async function suspendUser(userId: string) {
  const session = await requireAdmin();

  // Perform action
  await prisma.user.update({
    where: { id: userId },
    data: { status: 'SUSPENDED' },
  });

  // Log the action
  await logAdminAction({
    adminId: session.user.id,
    action: 'user.suspend',
    targetType: 'user',
    targetId: userId,
    changes: { status: 'SUSPENDED' },
  });
}
```

### Client Components

Use the `useAdmin()` hook for conditional rendering:

```typescript
'use client';

import { useAdmin } from '@/lib/hooks/use-admin';

export function AdminButton() {
  const { isAdmin, isLoading } = useAdmin();

  if (isLoading) return <Spinner />;
  if (!isAdmin) return null;

  return <button>Admin Action</button>;
}
```

### Layout Protection

Use `AdminLayout` to protect entire route groups:

```typescript
// app/admin/layout.tsx
import AdminLayout from '@/components/layouts/AdminLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
```

## Audit Logging

All admin actions should be logged for compliance and security:

### Manual Logging

```typescript
import { logAdminAction } from '@/lib/admin';

await logAdminAction({
  adminId: session.user.id,
  action: 'user.role.change',
  targetType: 'user',
  targetId: userId,
  changes: { role: 'ADMIN' },
  ipAddress: request.headers.get('x-forwarded-for'),
  userAgent: request.headers.get('user-agent'),
});
```

### Automatic Logging with Wrapper

```typescript
import { withAuditLog } from '@/lib/admin';

const updateUserRole = withAuditLog(
  'user.role.change',
  'user',
  async (adminId, targetId, changes) => {
    await prisma.user.update({
      where: { id: targetId },
      data: { role: changes.role },
    });
  }
);

// Usage
await updateUserRole(session.user.id, userId, { role: 'ADMIN' }, request);
```

### Querying Audit Logs

```typescript
import { getAuditLogs, getTargetAuditLogs } from '@/lib/admin';

// Get all audit logs
const logs = await getAuditLogs({ limit: 100 });

// Get logs for a specific user
const userLogs = await getTargetAuditLogs('user', userId);

// Get logs by a specific admin
const adminLogs = await getAdminAuditLogs(adminId);
```

## Action Naming Convention

Use a consistent naming convention for audit log actions:

- `{resource}.{action}` - e.g., `user.suspend`, `workspace.delete`
- `{resource}.{field}.{action}` - e.g., `user.role.change`, `workspace.credits.adjust`

Examples:

- `user.create`
- `user.suspend`
- `user.activate`
- `user.delete`
- `user.role.change`
- `workspace.create`
- `workspace.delete`
- `workspace.credits.adjust`
- `subscription.cancel`
- `subscription.refund`
- `settings.update`

## Error Handling

The system throws `AdminAccessDeniedError` when access is denied:

```typescript
import { requireAdmin, AdminAccessDeniedError } from '@/lib/admin';

try {
  await requireAdmin();
} catch (error) {
  if (error instanceof AdminAccessDeniedError) {
    return Response.json({ error: error.message }, { status: 403 });
  }
  throw error;
}
```

## Middleware

Admin routes are automatically protected by middleware:

- `/admin/*` - Admin dashboard pages
- `/api/admin/*` - Admin API routes

The middleware performs a lightweight session check and redirects unauthenticated users to login. Full role validation happens at the route level.

## Security Considerations

1. **Always validate on the server** - Never rely solely on client-side checks
2. **Log all admin actions** - Required for compliance and security auditing
3. **Include request context** - IP address and user agent help with security monitoring
4. **Use type-safe guards** - TypeScript ensures proper usage
5. **Handle errors gracefully** - Provide clear error messages without exposing sensitive info

## Testing

Test admin access control in your routes:

```typescript
import { requireAdmin } from '@/lib/admin';

describe('Admin API', () => {
  it('should deny access to non-admin users', async () => {
    // Mock session with non-admin user
    await expect(requireAdmin()).rejects.toThrow('Admin access required');
  });

  it('should allow access to admin users', async () => {
    // Mock session with admin user
    const session = await requireAdmin();
    expect(session.user.role).toBe('ADMIN');
  });
});
```

## API Reference

### Server-Side Functions

- `requireAdmin()` - Requires admin, throws error if not
- `requireAdminPage()` - Requires admin, redirects if not (for pages)
- `checkIsAdmin()` - Returns boolean, doesn't throw
- `getAdminSession()` - Returns session if admin, null otherwise
- `isAdminSession(session)` - Checks if a session is admin
- `withAdminAuth(handler)` - HOF to wrap API handlers

### Client-Side Hooks

- `useAdmin()` - Returns `{ isAdmin, isLoading, session }`
- `useRequireAdmin()` - Same as useAdmin but throws if not admin

### Audit Logging

- `logAdminAction(data)` - Logs an admin action
- `getAuditLogs(options)` - Queries audit logs
- `getTargetAuditLogs(type, id)` - Gets logs for a target
- `getAdminAuditLogs(adminId)` - Gets logs by admin
- `withAuditLog(action, type, handler)` - HOF with auto-logging

## Related Files

- `src/lib/auth/admin-guard.ts` - Server-side admin guards
- `src/lib/middleware/admin.ts` - Admin route middleware
- `src/lib/hooks/use-admin.ts` - Client-side hooks
- `src/lib/admin/audit-logger.ts` - Audit logging utilities
- `src/components/layouts/AdminLayout.tsx` - Admin layout component
