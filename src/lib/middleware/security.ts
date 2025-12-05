/**
 * Comprehensive Security Middleware
 *
 * Combines CSRF protection, rate limiting, input sanitization, and security headers.
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { csrfProtection } from './csrf';
import { rateLimit, RateLimitConfig } from './rate-limit';
import { addSecurityHeaders } from './security-headers';
import { containsInjectionAttempt } from './validation';

/**
 * Security middleware configuration
 */
export interface SecurityConfig {
  csrf?: boolean;
  rateLimit?: RateLimitConfig | false;
  sanitize?: boolean;
  securityHeaders?: boolean;
  validateInjection?: boolean;
}

/**
 * Default security configuration
 */
const DEFAULT_CONFIG: SecurityConfig = {
  csrf: true,
  rateLimit: { windowMs: 60 * 1000, maxRequests: 100 },
  sanitize: true,
  securityHeaders: true,
  validateInjection: true,
};

/**
 * Apply security middleware to a request
 *
 * @param request Next.js request object
 * @param config Security configuration
 * @returns NextResponse with error if security check fails, null otherwise
 */
export async function applySecurity(
  request: NextRequest,
  config: SecurityConfig = DEFAULT_CONFIG
): Promise<NextResponse | null> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Apply rate limiting
  if (finalConfig.rateLimit) {
    const rateLimitResponse = await rateLimit(request, finalConfig.rateLimit);
    if (rateLimitResponse) {
      return addSecurityHeaders(rateLimitResponse);
    }
  }

  // Apply CSRF protection for mutation methods
  if (finalConfig.csrf) {
    const csrfResponse = csrfProtection(request);
    if (csrfResponse) {
      return addSecurityHeaders(csrfResponse);
    }
  }

  // Validate for injection attempts
  if (finalConfig.validateInjection) {
    try {
      const body = await request.clone().json();

      // Check all string values for injection attempts
      const checkForInjection = (obj: any): boolean => {
        if (typeof obj === 'string') {
          return containsInjectionAttempt(obj);
        }

        if (Array.isArray(obj)) {
          return obj.some(checkForInjection);
        }

        if (typeof obj === 'object' && obj !== null) {
          return Object.values(obj).some(checkForInjection);
        }

        return false;
      };

      if (checkForInjection(body)) {
        return addSecurityHeaders(
          NextResponse.json(
            {
              error: {
                code: 'INVALID_INPUT',
                message: 'Input contains potentially malicious content',
              },
            },
            { status: 400 }
          )
        );
      }
    } catch {
      // Not JSON or no body, skip injection check
    }
  }

  return null;
}

/**
 * Higher-order function to wrap API route handlers with comprehensive security
 *
 * @param handler API route handler
 * @param config Security configuration
 * @returns Wrapped handler with security middleware
 */
export function withSecurity(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config: SecurityConfig = DEFAULT_CONFIG
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Apply security checks
    const securityResponse = await applySecurity(request, config);

    if (securityResponse) {
      return securityResponse;
    }

    // Execute handler
    let response = await handler(request);

    // Add security headers to response
    if (config.securityHeaders !== false) {
      response = addSecurityHeaders(response);
    }

    return response;
  };
}

/**
 * Export individual middleware components
 */
export { csrfProtection, generateCsrfToken, setCsrfTokenCookie } from './csrf';
export { rateLimit, RATE_LIMITS } from './rate-limit';
export { addSecurityHeaders, secureResponse } from './security-headers';
export {
  sanitizeString,
  sanitizeObject,
  containsInjectionAttempt,
  validateRequestBody,
  formatValidationError,
} from './validation';
