/**
 * Global error handler for API routes
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import {
  AppError,
  ValidationError,
  ServerError,
  type ErrorResponse,
} from './base';
import { logger } from './logger';

/**
 * Handle errors in API routes and return appropriate responses
 * This function provides consistent error handling across all API endpoints
 */
export function handleApiError(error: unknown): NextResponse<ErrorResponse> {
  // Handle custom application errors
  if (error instanceof AppError) {
    // Log operational errors at info level
    if (error.isOperational) {
      logger.info('Operational error occurred', {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
        context: error.context,
      });
    } else {
      // Log non-operational errors at error level
      logger.error('Non-operational error occurred', {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
        stack: error.stack,
        context: error.context,
      });
    }

    return NextResponse.json(error.toJSON(), { status: error.statusCode });
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};

    error.issues.forEach((issue) => {
      const field = issue.path.join('.');
      if (!fieldErrors[field]) {
        fieldErrors[field] = [];
      }
      fieldErrors[field].push(issue.message);
    });

    const validationError = new ValidationError(
      'Invalid input data',
      fieldErrors
    );

    logger.info('Validation error occurred', {
      fields: fieldErrors,
    });

    return NextResponse.json(validationError.toJSON(), {
      status: validationError.statusCode,
    });
  }

  // Handle Prisma unique constraint errors
  if (error instanceof Error && error.message.includes('Unique constraint')) {
    const conflictError = new ValidationError(
      'A resource with this value already exists',
      undefined,
      { originalError: error.message }
    );

    logger.info('Unique constraint violation', {
      message: error.message,
    });

    return NextResponse.json(conflictError.toJSON(), {
      status: 409,
    });
  }

  // Handle unknown errors
  logger.error('Unexpected error occurred', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });

  const serverError = new ServerError();
  return NextResponse.json(serverError.toJSON(), {
    status: serverError.statusCode,
  });
}

/**
 * Async error handler wrapper for API route handlers
 * Wraps async functions to catch and handle errors automatically
 */
export function withErrorHandler<T extends unknown[], R>(
  handler: (...args: T) => Promise<R>
): (...args: T) => Promise<R | NextResponse<ErrorResponse>> {
  return async (...args: T) => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
