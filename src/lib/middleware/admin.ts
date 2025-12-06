import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Admin middleware for protecting admin routes
 *
 * Requirements: Admin Dashboard 2 - Role-based access control
 *
 * This middleware ensures only users with ADMIN role can access admin routes.
 * It runs in the Edge Runtime and performs lightweight checks.
 */

/**
 * Admin route patterns
 */
export const adminRoutes = ['/admin', '/api/admin'];

/**
 * Checks if a path is an admin route
 */
export function isAdminRoute(path: string): boolean {
  return adminRoutes.some((pattern) => path.startsWith(pattern));
}

/**
 * Admin middleware function
 *
 * This performs a lightweight check for admin routes.
 * Actual role validation happens at the API route/page level.
 */
export async function adminMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if this is an admin route
  if (!isAdminRoute(pathname)) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionToken =
    request.cookies.get('next-auth.session-token') ||
    request.cookies.get('__Secure-next-auth.session-token');

  if (!sessionToken) {
    // Redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Session exists, but we can't validate role in Edge Runtime
  // Role validation will happen at the page/API route level
  return NextResponse.next();
}
