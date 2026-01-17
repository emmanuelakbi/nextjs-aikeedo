/**
 * Property-based tests for error handling type safety
 * Feature: critical-fixes, Property 9: Error Handling Type Safety
 * **Validates: Requirements 8.2, 8.4**
 *
 * Property 9: Error Handling Type Safety
 * For any error handling code, error types should be properly discriminated
 * and handled without type assertions. Error responses have consistent type structures.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ServerError,
  handleApiError,
  type ErrorResponse,
  type SimpleErrorResponse,
  type ApiErrorResponse,
  isStandardErrorResponse,
  isSimpleErrorResponse,
  createErrorResponse,
  createSimpleErrorResponse,
} from '../index';
import { ZodError, z } from 'zod';

/**
 * Arbitrary generator for AppError subclasses
 * Generates random error instances with valid properties
 */
const appErrorArbitrary = fc.oneof(
  fc.record({
    type: fc.constant('validation' as const),
    message: fc.string({ minLength: 1, maxLength: 100 }),
    fields: fc.option(
      fc.dictionary(
        fc.string({ minLength: 1, maxLength: 30 }),
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), {
          minLength: 1,
          maxLength: 3,
        })
      ),
      { nil: undefined }
    ),
  }),
  fc.record({
    type: fc.constant('authentication' as const),
    message: fc.string({ minLength: 1, maxLength: 100 }),
  }),
  fc.record({
    type: fc.constant('authorization' as const),
    message: fc.string({ minLength: 1, maxLength: 100 }),
  }),
  fc.record({
    type: fc.constant('notFound' as const),
    message: fc.string({ minLength: 1, maxLength: 100 }),
  }),
  fc.record({
    type: fc.constant('conflict' as const),
    message: fc.string({ minLength: 1, maxLength: 100 }),
    fields: fc.option(
      fc.dictionary(
        fc.string({ minLength: 1, maxLength: 30 }),
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), {
          minLength: 1,
          maxLength: 3,
        })
      ),
      { nil: undefined }
    ),
  }),
  fc.record({
    type: fc.constant('rateLimit' as const),
    message: fc.string({ minLength: 1, maxLength: 100 }),
    retryAfter: fc.option(fc.integer({ min: 1, max: 3600 }), { nil: undefined }),
  }),
  fc.record({
    type: fc.constant('server' as const),
    message: fc.string({ minLength: 1, maxLength: 100 }),
  })
);

/**
 * Helper function to create error instance from arbitrary data
 */
function createErrorFromArbitrary(
  data:
    | { type: 'validation'; message: string; fields?: Record<string, string[]> }
    | { type: 'authentication'; message: string }
    | { type: 'authorization'; message: string }
    | { type: 'notFound'; message: string }
    | { type: 'conflict'; message: string; fields?: Record<string, string[]> }
    | { type: 'rateLimit'; message: string; retryAfter?: number }
    | { type: 'server'; message: string }
): AppError {
  switch (data.type) {
    case 'validation':
      return new ValidationError(data.message, data.fields);
    case 'authentication':
      return new AuthenticationError(data.message);
    case 'authorization':
      return new AuthorizationError(data.message);
    case 'notFound':
      return new NotFoundError(data.message);
    case 'conflict':
      return new ConflictError(data.message, data.fields);
    case 'rateLimit':
      return new RateLimitError(data.message, data.retryAfter);
    case 'server':
      return new ServerError(data.message);
  }
}

describe('Property 9: Error Handling Type Safety', () => {
  /**
   * Property: Error type discrimination works without type assertions
   * For any AppError instance, we should be able to discriminate its type
   * using instanceof checks without needing type assertions
   * **Validates: Requirements 8.2**
   */
  it('should discriminate error types without type assertions', () => {
    fc.assert(
      fc.property(appErrorArbitrary, (errorData) => {
        const error = createErrorFromArbitrary(errorData);

        // Type discrimination should work via instanceof
        // This verifies that the error class hierarchy is properly set up
        expect(error instanceof AppError).toBe(true);
        expect(error instanceof Error).toBe(true);

        // Specific type discrimination
        if (error instanceof ValidationError) {
          // TypeScript should know error.fields is available here
          expect(error.code).toBe('VALIDATION_ERROR');
          expect(error.statusCode).toBe(400);
          // fields property should be accessible without type assertion
          const fields = error.fields;
          expect(fields === undefined || typeof fields === 'object').toBe(true);
        } else if (error instanceof AuthenticationError) {
          expect(error.code).toBe('AUTHENTICATION_ERROR');
          expect(error.statusCode).toBe(401);
        } else if (error instanceof AuthorizationError) {
          expect(error.code).toBe('AUTHORIZATION_ERROR');
          expect(error.statusCode).toBe(403);
        } else if (error instanceof NotFoundError) {
          expect(error.code).toBe('NOT_FOUND');
          expect(error.statusCode).toBe(404);
        } else if (error instanceof ConflictError) {
          expect(error.code).toBe('CONFLICT');
          expect(error.statusCode).toBe(409);
          // fields property should be accessible without type assertion
          const fields = error.fields;
          expect(fields === undefined || typeof fields === 'object').toBe(true);
        } else if (error instanceof RateLimitError) {
          expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
          expect(error.statusCode).toBe(429);
          // retryAfter property should be accessible without type assertion
          const retryAfter = error.retryAfter;
          expect(
            retryAfter === undefined || typeof retryAfter === 'number'
          ).toBe(true);
        } else if (error instanceof ServerError) {
          expect(error.code).toBe('INTERNAL_ERROR');
          expect(error.statusCode).toBe(500);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Error responses have consistent type structure
   * For any error, the toJSON() method should return a response
   * that conforms to the ErrorResponse type
   * **Validates: Requirements 8.4**
   */
  it('should produce type-safe error responses', () => {
    fc.assert(
      fc.property(appErrorArbitrary, (errorData) => {
        const error = createErrorFromArbitrary(errorData);
        const response: ErrorResponse = error.toJSON();

        // Response should conform to ErrorResponse type
        expect(response).toHaveProperty('error');
        expect(typeof response.error).toBe('object');
        expect(response.error).not.toBeNull();

        // Required properties
        expect(typeof response.error.code).toBe('string');
        expect(typeof response.error.message).toBe('string');
        expect(response.error.code.length).toBeGreaterThan(0);
        expect(response.error.message.length).toBeGreaterThan(0);

        // Optional fields property should be properly typed if present
        if ('fields' in response.error && response.error.fields !== undefined) {
          expect(typeof response.error.fields).toBe('object');
          // Each field should be an array of strings
          for (const [key, value] of Object.entries(response.error.fields)) {
            expect(typeof key).toBe('string');
            expect(Array.isArray(value)).toBe(true);
            for (const msg of value) {
              expect(typeof msg).toBe('string');
            }
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: handleApiError returns type-safe NextResponse
   * For any error passed to handleApiError, the response should
   * have the correct status code and body structure
   * **Validates: Requirements 8.2, 8.4**
   */
  it('should return type-safe responses from handleApiError', async () => {
    await fc.assert(
      fc.asyncProperty(appErrorArbitrary, async (errorData) => {
        const error = createErrorFromArbitrary(errorData);
        const response = handleApiError(error);

        // Response should have correct status code
        expect(response.status).toBe(error.statusCode);

        // Parse response body
        const text = await response.text();
        const body = JSON.parse(text) as ErrorResponse;

        // Body should conform to ErrorResponse type
        expect(body).toHaveProperty('error');
        expect(typeof body.error.code).toBe('string');
        expect(typeof body.error.message).toBe('string');

        // Code should match the error's code
        expect(body.error.code).toBe(error.code);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Type guards provide exhaustive type narrowing
   * For any ApiErrorResponse, exactly one type guard should return true
   * **Validates: Requirements 8.2, 8.4**
   */
  it('should have mutually exclusive type guards', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.record({
            type: fc.constant('standard' as const),
            code: fc.string({ minLength: 1, maxLength: 30 }),
            message: fc.string({ minLength: 1, maxLength: 100 }),
          }),
          fc.record({
            type: fc.constant('simple' as const),
            message: fc.string({ minLength: 1, maxLength: 100 }),
          })
        ),
        (data) => {
          let response: ApiErrorResponse;

          if (data.type === 'standard') {
            response = createErrorResponse(data.code, data.message);
          } else {
            response = createSimpleErrorResponse(data.message);
          }

          // Exactly one type guard should return true
          const isStandard = isStandardErrorResponse(response);
          const isSimple = isSimpleErrorResponse(response);

          // XOR: exactly one should be true
          expect(isStandard !== isSimple).toBe(true);

          // Type narrowing should work correctly
          if (isStandardErrorResponse(response)) {
            // TypeScript should know response.error is an object
            expect(typeof response.error).toBe('object');
            expect(response.error).toHaveProperty('code');
            expect(response.error).toHaveProperty('message');
          }

          if (isSimpleErrorResponse(response)) {
            // TypeScript should know response.error is a string
            expect(typeof response.error).toBe('string');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Error code and status code are always consistent
   * For any error type, the code and statusCode should be deterministic
   * based on the error class
   * **Validates: Requirements 8.4**
   */
  it('should have consistent code and statusCode per error type', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.constantFrom(
          'ValidationError',
          'AuthenticationError',
          'AuthorizationError',
          'NotFoundError',
          'ConflictError',
          'RateLimitError',
          'ServerError'
        ),
        (message, errorType) => {
          // Create two instances of the same error type
          let error1: AppError;
          let error2: AppError;

          switch (errorType) {
            case 'ValidationError':
              error1 = new ValidationError(message);
              error2 = new ValidationError('different message');
              break;
            case 'AuthenticationError':
              error1 = new AuthenticationError(message);
              error2 = new AuthenticationError('different message');
              break;
            case 'AuthorizationError':
              error1 = new AuthorizationError(message);
              error2 = new AuthorizationError('different message');
              break;
            case 'NotFoundError':
              error1 = new NotFoundError(message);
              error2 = new NotFoundError('different message');
              break;
            case 'ConflictError':
              error1 = new ConflictError(message);
              error2 = new ConflictError('different message');
              break;
            case 'RateLimitError':
              error1 = new RateLimitError(message);
              error2 = new RateLimitError('different message');
              break;
            case 'ServerError':
              error1 = new ServerError(message);
              error2 = new ServerError('different message');
              break;
          }

          // Code and statusCode should be the same for same error type
          expect(error1.code).toBe(error2.code);
          expect(error1.statusCode).toBe(error2.statusCode);
          expect(error1.isOperational).toBe(error2.isOperational);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Unknown errors are safely handled
   * For any unknown error type, handleApiError should return a safe ServerError
   * **Validates: Requirements 8.2**
   */
  it('should safely handle unknown error types', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          // String errors (common in JavaScript)
          fc.string({ minLength: 1, maxLength: 100 }),
          // Number errors (less common but possible)
          fc.integer(),
          // Null and undefined (edge cases)
          fc.constant(null),
          fc.constant(undefined),
          // Standard Error objects (most common)
          fc.string({ minLength: 1, maxLength: 100 }).map((msg) => new Error(msg)),
          // TypeError (common runtime error)
          fc.string({ minLength: 1, maxLength: 100 }).map((msg) => new TypeError(msg)),
          // RangeError (common runtime error)
          fc.string({ minLength: 1, maxLength: 100 }).map((msg) => new RangeError(msg))
        ),
        async (unknownError) => {
          const response = handleApiError(unknownError);

          // Should return 500 status for unknown errors
          expect(response.status).toBe(500);

          // Parse response body
          const text = await response.text();
          const body = JSON.parse(text) as ErrorResponse;

          // Should return a valid ErrorResponse
          expect(body).toHaveProperty('error');
          expect(body.error).toHaveProperty('code');
          expect(body.error).toHaveProperty('message');
          expect(body.error.code).toBe('INTERNAL_ERROR');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: ZodError is properly discriminated and converted
   * For any ZodError, handleApiError should convert it to a ValidationError
   * with proper field mapping
   * **Validates: Requirements 8.2, 8.4**
   */
  it('should properly discriminate and convert ZodError', async () => {
    // Create a schema for testing
    const testSchema = z.object({
      email: z.string().email(),
      age: z.number().min(0).max(150),
      name: z.string().min(1).max(100),
    });

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.string(),
          age: fc.oneof(fc.integer(), fc.string(), fc.constant(null)),
          name: fc.string(),
        }),
        async (data) => {
          try {
            testSchema.parse(data);
            // If validation passes, skip this test case
            return true;
          } catch (error) {
            if (!(error instanceof ZodError)) {
              return true;
            }

            const response = handleApiError(error);

            // Should return 400 status for validation errors
            expect(response.status).toBe(400);

            // Parse response body
            const text = await response.text();
            const body = JSON.parse(text) as ErrorResponse;

            // Should be a ValidationError response
            expect(body.error.code).toBe('VALIDATION_ERROR');

            // Should have fields if there were validation issues
            if (error.issues.length > 0) {
              expect(body.error).toHaveProperty('fields');
              expect(typeof body.error.fields).toBe('object');

              // Each field should map to an array of error messages
              if (body.error.fields) {
                for (const [, messages] of Object.entries(body.error.fields)) {
                  expect(Array.isArray(messages)).toBe(true);
                  for (const msg of messages) {
                    expect(typeof msg).toBe('string');
                  }
                }
              }
            }

            return true;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Error context is preserved through serialization
   * For any error with context, the context should be preserved
   * and accessible without type assertions
   * **Validates: Requirements 8.4**
   */
  it('should preserve error context through serialization', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.dictionary(
          fc.string({ minLength: 1, maxLength: 30 }),
          fc.oneof(
            fc.string(),
            fc.integer(),
            fc.boolean(),
            fc.constant(null)
          )
        ),
        (message, context) => {
          const error = new ValidationError(message, undefined, context);

          // Context should be accessible without type assertion
          expect(error.context).toEqual(context);

          // Context should be properly typed
          if (error.context) {
            expect(typeof error.context).toBe('object');
            for (const [key, value] of Object.entries(error.context)) {
              expect(typeof key).toBe('string');
              // Value can be string, number, boolean, or null
              expect(
                typeof value === 'string' ||
                  typeof value === 'number' ||
                  typeof value === 'boolean' ||
                  value === null
              ).toBe(true);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Error inheritance chain is type-safe
   * For any AppError subclass, the prototype chain should be correct
   * **Validates: Requirements 8.2**
   */
  it('should maintain type-safe inheritance chain', () => {
    fc.assert(
      fc.property(appErrorArbitrary, (errorData) => {
        const error = createErrorFromArbitrary(errorData);

        // Verify prototype chain
        expect(error instanceof Error).toBe(true);
        expect(error instanceof AppError).toBe(true);

        // Verify error properties are accessible
        expect(typeof error.message).toBe('string');
        expect(typeof error.name).toBe('string');
        expect(typeof error.code).toBe('string');
        expect(typeof error.statusCode).toBe('number');
        expect(typeof error.isOperational).toBe('boolean');

        // Stack trace should be available
        expect(typeof error.stack).toBe('string');

        // toJSON should be callable
        expect(typeof error.toJSON).toBe('function');
        const json = error.toJSON();
        expect(typeof json).toBe('object');
      }),
      { numRuns: 100 }
    );
  });
});

describe('Error Response Type Consistency', () => {
  /**
   * Property: All error responses can be safely serialized to JSON
   * **Validates: Requirements 8.4**
   */
  it('should produce JSON-serializable error responses', () => {
    fc.assert(
      fc.property(appErrorArbitrary, (errorData) => {
        const error = createErrorFromArbitrary(errorData);
        const response = error.toJSON();

        // Should be serializable without errors
        const serialized = JSON.stringify(response);
        expect(typeof serialized).toBe('string');

        // Should be deserializable back to the same structure
        const deserialized = JSON.parse(serialized);
        expect(deserialized).toEqual(response);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Error response structure is deterministic
   * For the same error input, toJSON should always produce the same output
   * **Validates: Requirements 8.4**
   */
  it('should produce deterministic error responses', () => {
    fc.assert(
      fc.property(appErrorArbitrary, (errorData) => {
        const error1 = createErrorFromArbitrary(errorData);
        const error2 = createErrorFromArbitrary(errorData);

        const response1 = error1.toJSON();
        const response2 = error2.toJSON();

        // Same input should produce same output
        expect(response1).toEqual(response2);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Error status codes are within valid HTTP range
   * **Validates: Requirements 8.4**
   */
  it('should have valid HTTP status codes', () => {
    fc.assert(
      fc.property(appErrorArbitrary, (errorData) => {
        const error = createErrorFromArbitrary(errorData);

        // Status code should be a valid HTTP error code (4xx or 5xx)
        expect(error.statusCode).toBeGreaterThanOrEqual(400);
        expect(error.statusCode).toBeLessThan(600);
      }),
      { numRuns: 100 }
    );
  });
});
