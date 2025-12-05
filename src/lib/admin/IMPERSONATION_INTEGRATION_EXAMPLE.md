# Impersonation Feature - Integration Example

## Example: Adding Impersonation to User Management Page

Here's how to integrate the impersonation feature into an existing admin user management page:

### 1. Update User Management Page

```typescript
// src/app/(dashboard)/admin/users/page.tsx
import { requireAdminPage } from '@/lib/auth/admin-guard';
import { ImpersonationButton, ActiveImpersonations } from '@/components/ui/admin';
import prisma from '@/lib/db/prisma';

export default async function AdminUsersPage() {
  // Ensure admin access
  await requireAdminPage();

  // Fetch users
  const users = await prisma.user.findMany({
    where: {
      role: 'USER', // Only show non-admin users
      status: 'ACTIVE',
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      status: true,
      createdAt: true,
      lastSeenAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>

      {/* Show active impersonation sessions */}
      <ActiveImpersonations />

      {/* User list */}
      <div className="bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Last Seen
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.lastSeenAt
                    ? new Date(user.lastSeenAt).toLocaleDateString()
                    : 'Never'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <ImpersonationButton
                    userId={user.id}
                    userEmail={user.email}
                    userName={`${user.firstName} ${user.lastName}`}
                    onSuccess={() => {
                      // Optional: Show success toast
                      console.log('Impersonation started');
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### 2. Add to User Detail Page

```typescript
// src/app/(dashboard)/admin/users/[id]/page.tsx
import { requireAdminPage } from '@/lib/auth/admin-guard';
import { ImpersonationButton } from '@/components/ui/admin';
import prisma from '@/lib/db/prisma';
import { notFound } from 'next/navigation';

export default async function AdminUserDetailPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAdminPage();

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      ownedWorkspaces: true,
      workspaceMembers: {
        include: {
          workspace: true,
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-gray-500">{user.email}</p>
          </div>

          {user.role !== 'ADMIN' && user.status === 'ACTIVE' && (
            <ImpersonationButton
              userId={user.id}
              userEmail={user.email}
              userName={`${user.firstName} ${user.lastName}`}
            />
          )}
        </div>

        {/* User details */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Role</h3>
            <p className="mt-1">{user.role}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Status</h3>
            <p className="mt-1">{user.status}</p>
          </div>
          {/* More user details... */}
        </div>
      </div>
    </div>
  );
}
```

### 3. Create Admin Dashboard Widget

```typescript
// src/components/ui/admin/ImpersonationWidget.tsx
'use client';

import { useEffect, useState } from 'react';
import { useImpersonation, ImpersonationSession } from '@/lib/hooks/use-impersonation';

export function ImpersonationWidget() {
  const [sessions, setSessions] = useState<ImpersonationSession[]>([]);
  const { getActiveSessions } = useImpersonation();

  useEffect(() => {
    const loadSessions = async () => {
      const activeSessions = await getActiveSessions();
      setSessions(activeSessions);
    };

    loadSessions();
    const interval = setInterval(loadSessions, 30000);
    return () => clearInterval(interval);
  }, []);

  if (sessions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-3">Active Impersonations</h3>
      <p className="text-sm text-gray-600 mb-2">
        You have {sessions.length} active impersonation session(s)
      </p>
      <div className="space-y-2">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="text-sm p-2 bg-yellow-50 rounded border border-yellow-200"
          >
            <span className="font-medium">
              {session.targetUser.firstName} {session.targetUser.lastName}
            </span>
            <span className="text-gray-500 ml-2">
              ({session.targetUser.email})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 4. API Usage in Server Actions

```typescript
// src/app/(dashboard)/admin/actions.ts
'use server';

import { requireAdmin } from '@/lib/auth/admin-guard';
import { startImpersonation, endImpersonation } from '@/lib/admin';
import { revalidatePath } from 'next/cache';

export async function impersonateUser(userId: string) {
  const session = await requireAdmin();

  try {
    const impersonationSession = await startImpersonation(
      session.user.id,
      userId
    );

    revalidatePath('/admin/users');

    return {
      success: true,
      sessionId: impersonationSession.id,
      expiresAt: impersonationSession.expiresAt,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function stopImpersonation(sessionId: string) {
  await requireAdmin();

  try {
    await endImpersonation(sessionId);
    revalidatePath('/admin/users');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

### 5. Add to Admin Navigation

```typescript
// src/components/layouts/AdminNav.tsx
import { ImpersonationWidget } from '@/components/ui/admin/ImpersonationWidget';

export function AdminNav() {
  return (
    <nav className="bg-gray-800 text-white">
      <div className="container mx-auto px-4">
        {/* Navigation items */}
        <div className="py-4">
          <ImpersonationWidget />
        </div>
      </div>
    </nav>
  );
}
```

## Testing the Integration

### Manual Testing Steps

1. **Start Impersonation**:
   - Log in as an admin
   - Navigate to `/admin/users`
   - Click "Impersonate User" on any active user
   - Confirm the action in the dialog
   - New tab opens with impersonation session

2. **View Active Sessions**:
   - Check the "Active Impersonation Sessions" widget
   - Verify session details and expiration time

3. **End Impersonation**:
   - Click "End Session" in the active sessions widget
   - Verify session is removed

4. **Verify Audit Logs**:
   - Navigate to `/admin/audit-logs`
   - Search for "user.impersonate.start" and "user.impersonate.end" actions
   - Verify all details are logged correctly

### Security Testing

1. **Non-Admin Access**:
   - Try accessing impersonation API as non-admin user
   - Should receive 403 Forbidden

2. **Admin Impersonation**:
   - Try to impersonate another admin user
   - Should receive error "Cannot impersonate admin users"

3. **Inactive User**:
   - Try to impersonate suspended/inactive user
   - Should receive error "Cannot impersonate inactive users"

4. **Session Expiration**:
   - Start impersonation session
   - Wait for expiration (or manually expire in code)
   - Verify session is automatically cleaned up

## Monitoring and Maintenance

### Audit Log Queries

```typescript
// Get all impersonation actions
const impersonationLogs = await prisma.adminAction.findMany({
  where: {
    action: {
      startsWith: 'user.impersonate',
    },
  },
  include: {
    admin: {
      select: {
        email: true,
        firstName: true,
        lastName: true,
      },
    },
  },
  orderBy: {
    createdAt: 'desc',
  },
});

// Get impersonation actions for specific user
const userImpersonations = await prisma.adminAction.findMany({
  where: {
    targetType: 'user',
    targetId: userId,
    action: {
      startsWith: 'user.impersonate',
    },
  },
});
```

### Session Monitoring

```typescript
import { getAdminImpersonationSessions } from '@/lib/admin';

// Get all active sessions for an admin
const adminSessions = getAdminImpersonationSessions(adminId);

// Monitor session count
console.log(`Admin has ${adminSessions.length} active impersonation sessions`);
```

## Best Practices

1. **Always Show Active Sessions**: Display active impersonation sessions prominently in the admin UI
2. **Confirm Before Impersonating**: Always show a confirmation dialog with user details
3. **Open in New Tab**: Open impersonation sessions in new tabs to avoid losing admin context
4. **Monitor Audit Logs**: Regularly review impersonation audit logs for security
5. **Set Reasonable Time Limits**: 1 hour is a good default, adjust based on needs
6. **Notify Users (Future)**: Consider notifying users when they're being impersonated
7. **Document Usage**: Keep records of why impersonation was needed for compliance
