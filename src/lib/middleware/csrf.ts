import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * CSRF Protection Middleware
 * Protects against Cross-Site Request Forgery attacks
 */

const CSRF_TOKEN_LENGTH = 32;
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_COOKIE_NAME = 'csrf-token';

export function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

export function validateCsrfToken(
  request: NextRequest,
  cookieToken?: string
): boolean {
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  
  if (!headerToken || !cookieToken) {
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(headerToken),
      Buffer.from(cookieToken)
    );
  } catch {
    return false;
  }
}

export async function withCsrfProtection(
  request: NextRequest
): Promise<NextResponse | null> {
  // Only check for state-changing methods
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    return null;
  }

  // Get CSRF token from cookie
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;

  if (!validateCsrfToken(request, cookieToken)) {
    return NextResponse.json(
      { error: 'Invalid CSRF token' },
      { status: 403 }
    );
  }

  return null; // Allow request
}

// Helper to set CSRF token in response
export function setCsrfTokenCookie(response: NextResponse): NextResponse {
  const token = generateCsrfToken();
  
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });

  return response;
}
