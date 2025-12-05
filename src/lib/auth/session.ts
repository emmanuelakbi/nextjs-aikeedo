import { auth } from './auth';
import { redirect } from 'next/navigation';

/**
 * Session management utilities
 *
 * Provides helper functions for authentication checks in server components and API routes.
 * Requirements: 6.1, 6.2, 7.2
 */

/**
 * Gets the current session or throws an error if not authenticated
 * Use this in server components and API routes that require authentication
 */
export async function requireAuth() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return session;
}

/**
 * Gets the current session or returns null if not authenticated
 * Use this when authentication is optional
 */
export async function getSession() {
  return await auth();
}

/**
 * Gets the current user or throws an error if not authenticated
 */
export async function getCurrentUser() {
  const session = await requireAuth();
  return session.user;
}

/**
 * Checks if the current user is an admin
 * @deprecated Use checkIsAdmin from admin-guard.ts instead
 */
export async function isAdmin() {
  const session = await getSession();
  return session?.user?.role === 'ADMIN';
}

/**
 * Requires the current user to be an admin
 * @deprecated Use requireAdmin from admin-guard.ts instead
 */
export async function requireAdmin() {
  const session = await requireAuth();

  if (session.user.role !== 'ADMIN') {
    throw new Error('Admin access required');
  }

  return session;
}

/**
 * Checks if a user ID matches the current authenticated user
 */
export async function isCurrentUser(userId: string): Promise<boolean> {
  const session = await getSession();
  return session?.user?.id === userId;
}

/**
 * Requires that the user ID matches the current authenticated user
 */
export async function requireCurrentUser(userId: string) {
  const session = await requireAuth();

  if (session.user.id !== userId) {
    throw new Error('Unauthorized: You can only access your own data');
  }

  return session;
}
