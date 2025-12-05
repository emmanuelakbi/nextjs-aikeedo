/**
 * Security Headers Middleware
 *
 * Adds security-related HTTP headers to responses.
 * Requirements: 12.2, 12.5
 */

import { NextResponse } from 'next/server';

/**
 * Security headers configuration
 */
export const SECURITY_HEADERS = {
  // Prevent clickjacking attacks
  'X-Frame-Options': 'DENY',

  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // Enable XSS protection in older browsers
  'X-XSS-Protection': '1; mode=block',

  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Permissions policy (formerly Feature-Policy)
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',

  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-eval and unsafe-inline
    "style-src 'self' 'unsafe-inline'", // Tailwind requires unsafe-inline
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
  ].join('; '),

  // Strict Transport Security (HTTPS only)
  // Only set in production with HTTPS
  ...(process.env.NODE_ENV === 'production'
    ? {
        'Strict-Transport-Security':
          'max-age=31536000; includeSubDomains; preload',
      }
    : {}),
} as const;

/**
 * Add security headers to a response
 *
 * @param response NextResponse object
 * @returns Response with security headers added
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * Create a response with security headers
 *
 * @param body Response body
 * @param init Response init options
 * @returns NextResponse with security headers
 */
export function secureResponse(body: any, init?: ResponseInit): NextResponse {
  const response = NextResponse.json(body, init);
  return addSecurityHeaders(response);
}

/**
 * Higher-order function to wrap API route handlers with security headers
 *
 * @param handler API route handler
 * @returns Wrapped handler with security headers
 */
export function withSecurityHeaders(
  handler: (request: Request) => Promise<NextResponse>
) {
  return async (request: Request): Promise<NextResponse> => {
    const response = await handler(request);
    return addSecurityHeaders(response);
  };
}
