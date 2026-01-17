/**
 * Input validation middleware
 *
 * Provides utilities for validating and sanitizing request inputs.
 * Requirements: 9.3, 12.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { ZodError, ZodSchema } from 'zod';
import {
  createErrorResponse,
  type ErrorResponse,
} from '../errors/base';

/**
 * Validation error response format
 * @deprecated Use ErrorResponse from '../errors/base' instead
 */
export interface ValidationErrorResponse {
  error: {
    code: 'VALIDATION_ERROR';
    message: string;
    fields: Record<string, string[]>;
  };
}

/**
 * Parse and validate request body against a Zod schema
 *
 * @param request Next.js request object
 * @param schema Zod schema to validate against
 * @returns Parsed and validated data
 * @throws ZodError if validation fails
 */
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON in request body');
    }
    throw error;
  }
}

/**
 * Format Zod validation errors into a consistent error response
 *
 * @param error Zod validation error
 * @returns Formatted error response
 */
export function formatValidationError(error: ZodError): ErrorResponse {
  const fieldErrors: Record<string, string[]> = {};

  error.issues.forEach((issue) => {
    const field = issue.path.join('.');
    if (!fieldErrors[field]) {
      fieldErrors[field] = [];
    }
    fieldErrors[field].push(issue.message);
  });

  return createErrorResponse('VALIDATION_ERROR', 'Invalid input data', fieldErrors);
}

/**
 * Create a validation error response
 *
 * @param error Zod validation error
 * @returns NextResponse with validation error
 */
export function validationErrorResponse(error: ZodError): NextResponse<ErrorResponse> {
  return NextResponse.json(formatValidationError(error), { status: 400 });
}

/**
 * Higher-order function to wrap API route handlers with validation
 *
 * @param handler API route handler
 * @param schema Zod schema to validate request body
 * @returns Wrapped handler with validation
 */
export function withValidation<T>(
  handler: (request: NextRequest, data: T) => Promise<NextResponse>,
  schema: ZodSchema<T>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const data = await validateRequestBody(request, schema);
      return handler(request, data);
    } catch (error) {
      if (error instanceof ZodError) {
        return validationErrorResponse(error);
      }

      if (error instanceof Error && error.message.includes('Invalid JSON')) {
        return NextResponse.json(
          createErrorResponse('INVALID_JSON', 'Request body must be valid JSON'),
          { status: 400 }
        );
      }

      throw error;
    }
  };
}

/**
 * Sanitize string input to prevent XSS and injection attacks
 * Removes potentially dangerous HTML/script tags and SQL injection patterns
 *
 * Requirements: 12.4
 *
 * @param input String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return input;
  }

  let sanitized = input;

  // Remove script tags (including incomplete ones)
  sanitized = sanitized.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ''
  );
  sanitized = sanitized.replace(/<script[^>]*>/gi, '');

  // Remove iframe tags (including incomplete ones)
  sanitized = sanitized.replace(
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    ''
  );
  sanitized = sanitized.replace(/<iframe[^>]*>/gi, '');

  // Remove object/embed tags
  sanitized = sanitized.replace(
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    ''
  );
  sanitized = sanitized.replace(/<object[^>]*>/gi, '');
  sanitized = sanitized.replace(
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
    ''
  );
  sanitized = sanitized.replace(/<embed[^>]*>/gi, '');

  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '');

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/vbscript:/gi, '');
  sanitized = sanitized.replace(/data:text\/html/gi, '');

  // Remove common SQL injection patterns (basic protection)
  // Remove SQL keywords when they appear in SQL-like contexts
  sanitized = sanitized.replace(
    /\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION)\b/gi,
    ''
  );

  // Remove SQL comment patterns and semicolons
  sanitized = sanitized.replace(/(--|;|\/\*|\*\/)/g, '');

  return sanitized.trim();
}

/**
 * Check if string contains potential injection attempts
 *
 * @param input String to check
 * @returns True if potential injection detected
 */
export function containsInjectionAttempt(input: string): boolean {
  if (typeof input !== 'string') {
    return false;
  }

  const injectionPatterns = [
    // XSS patterns
    /<script/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /javascript:/i,
    /on\w+\s*=/i,

    // SQL injection patterns
    /(\bSELECT\b.*\bFROM\b)/i,
    /(\bINSERT\b.*\bINTO\b)/i,
    /(\bUPDATE\b.*\bSET\b)/i,
    /(\bDELETE\b.*\bFROM\b)/i,
    /(\bDROP\b.*\bTABLE\b)/i,
    /(\bUNION\b.*\bSELECT\b)/i,

    // SQL comment-based injection
    /('.*--)/, // Single quote followed by SQL comment
    /(;.*--)/, // Semicolon followed by SQL comment
    /('.*;)/, // Single quote with semicolon

    // OR-based injection
    /('.*OR.*'.*=.*')/i,
    /(".*OR.*".*=.*")/i,
  ];

  return injectionPatterns.some((pattern) => pattern.test(input));
}

/**
 * Sanitize object recursively
 * Applies string sanitization to all string values
 *
 * @param obj Object to sanitize
 * @returns Sanitized object
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value)
    ) {
      sanitized[key] = sanitizeObject(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === 'string'
          ? sanitizeString(item)
          : typeof item === 'object' && item !== null
            ? sanitizeObject(item)
            : item
      );
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}
