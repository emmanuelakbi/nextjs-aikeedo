/**
 * Base error classes for the application
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

/**
 * Base application error class
 * All custom errors should extend this class
 */
export abstract class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    statusCode: number,
    isOperational = true,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);

    // Set the prototype explicitly to maintain instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Convert error to JSON format for API responses
   */
  toJSON(): ErrorResponse {
    return {
      error: {
        code: this.code,
        message: this.message,
      },
    };
  }
}

/**
 * Validation error - input data fails validation rules
 * Status: 400 Bad Request
 */
export class ValidationError extends AppError {
  public readonly fields?: Record<string, string[]>;

  constructor(
    message: string,
    fields?: Record<string, string[]>,
    context?: Record<string, unknown>
  ) {
    super(message, 'VALIDATION_ERROR', 400, true, context);
    this.fields = fields;
  }

  override toJSON(): ErrorResponse {
    return {
      error: {
        code: this.code,
        message: this.message,
        fields: this.fields,
      },
    };
  }
}

/**
 * Authentication error - invalid credentials or expired session
 * Status: 401 Unauthorized
 */
export class AuthenticationError extends AppError {
  constructor(
    message = 'Authentication failed',
    context?: Record<string, unknown>
  ) {
    super(message, 'AUTHENTICATION_ERROR', 401, true, context);
  }
}

/**
 * Authorization error - user lacks permission for action
 * Status: 403 Forbidden
 */
export class AuthorizationError extends AppError {
  constructor(
    message = 'You do not have permission to perform this action',
    context?: Record<string, unknown>
  ) {
    super(message, 'AUTHORIZATION_ERROR', 403, true, context);
  }
}

/**
 * Not found error - requested resource doesn't exist
 * Status: 404 Not Found
 */
export class NotFoundError extends AppError {
  constructor(
    message = 'Resource not found',
    context?: Record<string, unknown>
  ) {
    super(message, 'NOT_FOUND', 404, true, context);
  }
}

/**
 * Conflict error - resource already exists
 * Status: 409 Conflict
 */
export class ConflictError extends AppError {
  public readonly fields?: Record<string, string[]>;

  constructor(
    message: string,
    fields?: Record<string, string[]>,
    context?: Record<string, unknown>
  ) {
    super(message, 'CONFLICT', 409, true, context);
    this.fields = fields;
  }

  override toJSON(): ErrorResponse {
    return {
      error: {
        code: this.code,
        message: this.message,
        fields: this.fields,
      },
    };
  }
}

/**
 * Rate limit error - too many requests
 * Status: 429 Too Many Requests
 */
export class RateLimitError extends AppError {
  public readonly retryAfter?: number;

  constructor(
    message = 'Too many requests. Please try again later.',
    retryAfter?: number,
    context?: Record<string, unknown>
  ) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429, true, context);
    this.retryAfter = retryAfter;
  }
}

/**
 * Server error - unexpected server-side error
 * Status: 500 Internal Server Error
 */
export class ServerError extends AppError {
  constructor(
    message = 'An unexpected error occurred. Please try again later.',
    context?: Record<string, unknown>
  ) {
    super(message, 'INTERNAL_ERROR', 500, false, context);
  }
}

/**
 * Error response format for API responses
 * This is the standard format used by handleApiError and all AppError subclasses
 */
export type ErrorResponse = {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string[]>;
  };
};

/**
 * Simple error response format for quick error responses
 * Use this for simple error messages without codes
 * Note: Prefer ErrorResponse for consistency across the API
 */
export type SimpleErrorResponse = {
  error: string;
};

/**
 * Union type for all possible API error response formats
 * This allows handlers to return either format while maintaining type safety
 */
export type ApiErrorResponse = ErrorResponse | SimpleErrorResponse;

/**
 * Type guard to check if an error response is a standard ErrorResponse
 */
export function isStandardErrorResponse(
  response: ApiErrorResponse
): response is ErrorResponse {
  return (
    typeof response.error === 'object' &&
    response.error !== null &&
    'code' in response.error &&
    'message' in response.error
  );
}

/**
 * Type guard to check if an error response is a SimpleErrorResponse
 */
export function isSimpleErrorResponse(
  response: ApiErrorResponse
): response is SimpleErrorResponse {
  return typeof response.error === 'string';
}

/**
 * Create a standard error response object
 * Use this helper to ensure consistent error response structure
 */
export function createErrorResponse(
  code: string,
  message: string,
  fields?: Record<string, string[]>
): ErrorResponse {
  const response: ErrorResponse = {
    error: {
      code,
      message,
    },
  };

  if (fields && Object.keys(fields).length > 0) {
    response.error.fields = fields;
  }

  return response;
}

/**
 * Create a simple error response object
 * Use this for quick error responses where a code is not needed
 */
export function createSimpleErrorResponse(message: string): SimpleErrorResponse {
  return { error: message };
}
