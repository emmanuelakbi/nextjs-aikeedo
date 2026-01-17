/**
 * Property-based tests for error response consistency
 * Feature: nextjs-foundation, Property 13: API error responses are consistent
 * Validates: Requirements 9.1, 9.2, 9.3
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ServerError,
  handleApiError,
  createErrorResponse,
  createSimpleErrorResponse,
  isStandardErrorResponse,
  isSimpleErrorResponse,
  type ErrorResponse,
  type SimpleErrorResponse,
  type ApiErrorResponse,
} from '../index';
import { ZodError, z } from 'zod';

describe('Property 13: API error responses are consistent', () => {
  /**
   * Property: All AppError instances produce consistent JSON structure
   * For any AppError subclass, the toJSON() method should return an object
   * with an 'error' property containing 'code' and 'message' fields
   */
  it('should produce consistent error structure for all AppError types', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.constantFrom(
          ValidationError,
          AuthenticationError,
          AuthorizationError,
          NotFoundError,
          ConflictError,
          RateLimitError,
          ServerError
        ),
        (message, ErrorClass) => {
          // Create error instance
          const error = new ErrorClass(message);

          // Convert to JSON
          const json = error.toJSON();

          // Verify structure
          expect(json).toHaveProperty('error');
          expect(json.error).toHaveProperty('code');
          expect(json.error).toHaveProperty('message');
          expect(typeof json.error.code).toBe('string');
          expect(typeof json.error.message).toBe('string');
          expect(json.error.code.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: ValidationError with fields includes fields in response
   * For any ValidationError with field errors, the JSON response should
   * include the fields property with the error details
   */
  it('should include field errors in ValidationError responses', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.dictionary(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.array(fc.string({ minLength: 1, maxLength: 100 }), {
            minLength: 1,
            maxLength: 5,
          })
        ),
        (message, fields) => {
          const error = new ValidationError(message, fields);
          const json = error.toJSON();

          // Verify base structure
          expect(json).toHaveProperty('error');
          expect(json.error).toHaveProperty('code');
          expect(json.error).toHaveProperty('message');

          // Verify fields are included
          if (Object.keys(fields).length > 0) {
            expect(json.error).toHaveProperty('fields');
            expect(json.error.fields).toEqual(fields);
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: ConflictError with fields includes fields in response
   * For any ConflictError with field errors, the JSON response should
   * include the fields property with the error details
   */
  it('should include field errors in ConflictError responses', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.dictionary(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.array(fc.string({ minLength: 1, maxLength: 100 }), {
            minLength: 1,
            maxLength: 5,
          })
        ),
        (message, fields) => {
          const error = new ConflictError(message, fields);
          const json = error.toJSON();

          // Verify base structure
          expect(json).toHaveProperty('error');
          expect(json.error).toHaveProperty('code');
          expect(json.error).toHaveProperty('message');

          // Verify fields are included
          if (Object.keys(fields).length > 0) {
            expect(json.error).toHaveProperty('fields');
            expect(json.error.fields).toEqual(fields);
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: handleApiError returns consistent NextResponse for all errors
   * For any error type, handleApiError should return a NextResponse with
   * consistent error structure and appropriate status code
   */
  it('should return consistent response structure from handleApiError', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.constantFrom(
          ValidationError,
          AuthenticationError,
          AuthorizationError,
          NotFoundError,
          ConflictError,
          ServerError
        ),
        async (message, ErrorClass) => {
          const error = new ErrorClass(message);
          const response = handleApiError(error);

          // Verify response is a NextResponse
          expect(response).toBeDefined();
          expect(response.status).toBe(error.statusCode);

          // Parse response body - NextResponse body is a ReadableStream
          const text = await response.text();
          const body = JSON.parse(text);

          // Verify structure
          expect(body).toHaveProperty('error');
          expect(body.error).toHaveProperty('code');
          expect(body.error).toHaveProperty('message');
          expect(typeof body.error.code).toBe('string');
          expect(typeof body.error.message).toBe('string');
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: handleApiError converts ZodError to consistent format
   * For any ZodError, handleApiError should convert it to a ValidationError
   * with consistent structure including field-level errors
   */
  it('should convert ZodError to consistent ValidationError format', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.string(),
          password: fc.string(),
          firstName: fc.string(),
        }),
        async (invalidData) => {
          // Create a schema that will fail validation
          const schema = z.object({
            email: z.string().email(),
            password: z.string().min(8),
            firstName: z.string().min(1),
          });

          try {
            schema.parse(invalidData);
            // If validation passes, skip this test case
            return true;
          } catch (error) {
            if (error instanceof ZodError) {
              const response = handleApiError(error);

              // Verify response status
              expect(response.status).toBe(400);

              // Parse response body
              const text = await response.text();
              const body = JSON.parse(text);

              // Verify structure
              expect(body).toHaveProperty('error');
              expect(body.error).toHaveProperty('code');
              expect(body.error).toHaveProperty('message');
              expect(body.error.code).toBe('VALIDATION_ERROR');

              // Verify fields are present if there were validation errors
              if (error.issues.length > 0) {
                expect(body.error).toHaveProperty('fields');
                expect(typeof body.error.fields).toBe('object');
              }
            }
            return true;
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: All error responses have the same top-level structure
   * For any error, the response should always have the same shape:
   * { error: { code, message, [fields] } }
   */
  it('should maintain consistent top-level structure across all error types', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (message) => {
          const errors = [
            new ValidationError(message),
            new AuthenticationError(message),
            new AuthorizationError(message),
            new NotFoundError(message),
            new ConflictError(message),
            new ServerError(message),
          ];

          for (const error of errors) {
            const response = handleApiError(error);
            const text = await response.text();
            const body = JSON.parse(text);

            // All responses should have exactly one top-level key: 'error'
            const keys = Object.keys(body);
            expect(keys).toEqual(['error']);

            // The error object should have at minimum 'code' and 'message'
            const errorKeys = Object.keys(body.error);
            expect(errorKeys).toContain('code');
            expect(errorKeys).toContain('message');
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Error codes are always uppercase with underscores
   * For any error, the code should follow the pattern: UPPERCASE_WITH_UNDERSCORES
   */
  it('should use consistent error code format', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 100 }), (message) => {
        const errors = [
          new ValidationError(message),
          new AuthenticationError(message),
          new AuthorizationError(message),
          new NotFoundError(message),
          new ConflictError(message),
          new RateLimitError(message),
          new ServerError(message),
        ];

        for (const error of errors) {
          const json = error.toJSON();
          const code = json.error.code;

          // Code should be uppercase with underscores (no lowercase, no spaces)
          expect(code).toMatch(/^[A-Z_]+$/);
          expect(code).not.toContain(' ');
          expect(code).not.toMatch(/[a-z]/);
        }
      }),
      { numRuns: 10 }
    );
  });
});

describe('Error response helper functions', () => {
  /**
   * Property: createErrorResponse produces valid ErrorResponse structure
   * **Validates: Requirements 8.2, 8.4**
   */
  it('should create valid ErrorResponse with createErrorResponse', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 200 }),
        (code, message) => {
          const response = createErrorResponse(code, message);

          // Verify structure
          expect(response).toHaveProperty('error');
          expect(response.error).toHaveProperty('code', code);
          expect(response.error).toHaveProperty('message', message);
          expect(isStandardErrorResponse(response)).toBe(true);
          expect(isSimpleErrorResponse(response)).toBe(false);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: createErrorResponse includes fields when provided
   * **Validates: Requirements 8.2, 8.4**
   */
  it('should include fields in ErrorResponse when provided', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.dictionary(
          fc.string({ minLength: 1, maxLength: 30 }),
          fc.array(fc.string({ minLength: 1, maxLength: 100 }), {
            minLength: 1,
            maxLength: 3,
          })
        ),
        (code, message, fields) => {
          const response = createErrorResponse(code, message, fields);

          // Verify structure
          expect(response).toHaveProperty('error');
          expect(response.error).toHaveProperty('code', code);
          expect(response.error).toHaveProperty('message', message);

          // Fields should be included only if non-empty
          if (Object.keys(fields).length > 0) {
            expect(response.error).toHaveProperty('fields');
            expect(response.error.fields).toEqual(fields);
          } else {
            expect(response.error.fields).toBeUndefined();
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: createSimpleErrorResponse produces valid SimpleErrorResponse
   * **Validates: Requirements 8.2, 8.4**
   */
  it('should create valid SimpleErrorResponse with createSimpleErrorResponse', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 200 }), (message) => {
        const response = createSimpleErrorResponse(message);

        // Verify structure
        expect(response).toHaveProperty('error', message);
        expect(typeof response.error).toBe('string');
        expect(isSimpleErrorResponse(response)).toBe(true);
        expect(isStandardErrorResponse(response)).toBe(false);
      }),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Type guards correctly identify response types
   * **Validates: Requirements 8.2, 8.4**
   */
  it('should correctly identify response types with type guards', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 200 }),
        (code, message) => {
          const standardResponse: ErrorResponse = createErrorResponse(
            code,
            message
          );
          const simpleResponse: SimpleErrorResponse =
            createSimpleErrorResponse(message);

          // Type guards should correctly identify each type
          expect(isStandardErrorResponse(standardResponse)).toBe(true);
          expect(isSimpleErrorResponse(standardResponse)).toBe(false);

          expect(isSimpleErrorResponse(simpleResponse)).toBe(true);
          expect(isStandardErrorResponse(simpleResponse)).toBe(false);

          // Both should be valid ApiErrorResponse
          const apiResponses: ApiErrorResponse[] = [
            standardResponse,
            simpleResponse,
          ];
          expect(apiResponses.length).toBe(2);
        }
      ),
      { numRuns: 20 }
    );
  });
});
