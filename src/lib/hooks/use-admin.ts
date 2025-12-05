'use client';

import { useSession } from 'next-auth/react';

/**
 * Client-side hook for checking admin status
 *
 * Requirements: Admin Dashboard 2 - Role-based access control
 *
 * Use this hook in client components to check if the current user is an admin.
 */

export interface UseAdminResult {
  isAdmin: boolean;
  isLoading: boolean;
  session: ReturnType<typeof useSession>['data'];
}

/**
 * Hook to check if the current user is an admin
 *
 * @returns Object containing isAdmin flag, loading state, and session
 *
 * @example
 * ```tsx
 * function AdminButton() {
 *   const { isAdmin, isLoading } = useAdmin();
 *
 *   if (isLoading) return <Spinner />;
 *   if (!isAdmin) return null;
 *
 *   return <button>Admin Action</button>;
 * }
 * ```
 */
export function useAdmin(): UseAdminResult {
  const { data: session, status } = useSession();

  return {
    isAdmin: session?.user?.role === 'ADMIN',
    isLoading: status === 'loading',
    session,
  };
}

/**
 * Hook to require admin access
 * Throws an error if the user is not an admin
 *
 * @throws Error if user is not an admin
 *
 * @example
 * ```tsx
 * function AdminPanel() {
 *   const { session } = useRequireAdmin();
 *
 *   return <div>Welcome, Admin {session.user.name}</div>;
 * }
 * ```
 */
export function useRequireAdmin(): UseAdminResult {
  const result = useAdmin();

  if (!result.isLoading && !result.isAdmin) {
    throw new Error('Admin access required');
  }

  return result;
}
