import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Authentication middleware
 *
 * Protects routes requiring authentication and redirects unauthenticated users.
 * Also handles referral tracking via URL parameters.
 * Requirements: 6.1, 6.2, 7.2, Affiliate 1, Admin Dashboard 2
 *
 * Note: This middleware runs in the Edge Runtime and cannot use Node.js modules.
 * Session validation is done at the page/API route level using NextAuth.
 */

const REFERRAL_COOKIE_NAME = 'aikeedo_ref';
const REFERRAL_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

/**
 * Protected route patterns
 */
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/workspaces',
  '/api/users',
  '/api/workspaces',
  '/admin',
  '/api/admin',
];

/**
 * Public route patterns (accessible without authentication)
 */
const publicRoutes = ['/login', '/register', '/auth', '/api/auth', '/'];

/**
 * Checks if a path matches any of the given patterns
 */
function matchesPattern(path: string, patterns: string[]): boolean {
  return patterns.some((pattern) => path.startsWith(pattern));
}

/**
 * Extracts referral code from URL parameters
 */
function extractReferralCode(url: URL): string | null {
  return (
    url.searchParams.get('ref') ||
    url.searchParams.get('referral') ||
    url.searchParams.get('affiliate') ||
    null
  );
}

/**
 * Validates referral code format
 */
function isValidReferralCode(code: string): boolean {
  return /^[A-Za-z0-9]{6,20}$/.test(code);
}

/**
 * Middleware function to protect routes and track referrals
 *
 * This is a lightweight check that redirects to login for protected routes.
 * Actual session validation happens at the page/API route level.
 * Also handles referral tracking via URL parameters.
 */
export async function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Handle referral tracking
  const referralCode = extractReferralCode(request.nextUrl);
  if (referralCode && isValidReferralCode(referralCode)) {
    // Store referral code in cookie
    const referralData = {
      code: referralCode,
      timestamp: Date.now(),
      source: pathname,
    };

    response.cookies.set(REFERRAL_COOKIE_NAME, JSON.stringify(referralData), {
      maxAge: REFERRAL_COOKIE_MAX_AGE,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }

  // Check if route is public
  if (matchesPattern(pathname, publicRoutes)) {
    return response;
  }

  // Check if route is protected
  if (matchesPattern(pathname, protectedRoutes)) {
    // Check for session cookie (lightweight check)
    const sessionToken =
      request.cookies.get('next-auth.session-token') ||
      request.cookies.get('__Secure-next-auth.session-token');

    if (!sessionToken) {
      // Redirect to login with callback URL
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

/**
 * Middleware configuration
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
