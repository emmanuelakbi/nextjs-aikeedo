import { redirect } from 'next/navigation';
import { auth } from './auth';
import type { Session } from 'next-auth';

/**
 * Admin Guard Utilities
 *
 * Requirements: Admin Dashboard 2 - Role-based access control
 *
 * Provides utilities for protecting admin routes and checking admin permissions.
 * Use these in server components, API routes, and server actions.
 */

/**
 * Error thrown when admin access is required but user is not an admin
 */
export class AdminAccessDeniedError extends Error {
  constructor(message = 'Admin access required') {
    super(message);
    this.name = 'AdminAccessDeniedError';
  }
}

/**
 * Checks if a session belongs to an admin user
 */
export function isAdminSession(session: Session | null): boolean {
  return session?.user?.role === 'ADMIN';
}

/**
 * Gets the current session and checks if user is an admin
 * Returns true if admin, false otherwise
 */
export async function checkIsAdmin(): Promise<boolean> {
  const session = await auth();
  return isAdminSession(session);
}

/**
 * Requires the current user to be an admin
 * Throws AdminAccessDeniedError if not an admin
 * Use this in API routes and server actions
 */
export async function requireAdmin(): Promise<Session> {
  const session = await auth();

  if (!session?.user) {
    throw new AdminAccessDeniedError('Authentication required');
  }

  if (!isAdminSession(session)) {
    throw new AdminAccessDeniedError('Admin access required');
  }

  return session;
}

/**
 * Requires the current user to be an admin
 * Redirects to /dashboard if not an admin
 * Use this in server components (pages)
 */
export async function requireAdminPage(): Promise<Session> {
  const session = await auth();

  if (!session?.user) {
    redirect('/login?error=AdminAccessRequired');
  }

  if (!isAdminSession(session)) {
    redirect('/dashboard?error=AdminAccessDenied');
  }

  return session;
}

/**
 * Checks if the current user has admin access
 * Returns the session if admin, null otherwise
 * Use this when you want to conditionally show admin features
 */
export async function getAdminSession(): Promise<Session | null> {
  const session = await auth();

  if (!session?.user || !isAdminSession(session)) {
    return null;
  }

  return session;
}

/**
 * Higher-order function to wrap API route handlers with admin check
 * Automatically returns 403 if user is not an admin
 */
export function withAdminAuth<T extends (...args: any[]) => Promise<Response>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      await requireAdmin();
      return await handler(...args);
    } catch (error) {
      if (error instanceof AdminAccessDeniedError) {
        return new Response(
          JSON.stringify({
            error: 'Forbidden',
            message: error.message,
          }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      throw error;
    }
  }) as T;
}
