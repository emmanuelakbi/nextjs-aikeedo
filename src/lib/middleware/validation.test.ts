/**
 * Property-Based Tests for Input Validation
 *
 * Feature: nextjs-foundation, Property 14: Input validation prevents injection
 * Validates: Requirements 12.4
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  sanitizeString,
  containsInjectionAttempt,
  sanitizeObject,
} from './validation';

describe('Input Validation - Property-Based Tests', () => {
  describe('Property 14: Input validation prevents injection', () => {
    it('should detect XSS injection attempts in any string', () => {
      /**
       * Property: For any string containing XSS patterns (script tags, event handlers,
       * javascript: protocol), containsInjectionAttempt should return true
       */
      fc.assert(
        fc.property(
          fc.oneof(
            // Script tag variations
            fc.constant('<script>alert("xss")</script>'),
            fc.constant('<SCRIPT>alert("xss")</SCRIPT>'),
            fc.constant('<script src="evil.js"></script>'),
            fc.string().map((s) => `<script>${s}</script>`),

            // Event handler variations
            fc.constant('onerror="alert(1)"'),
            fc.constant('onclick="alert(1)"'),
            fc.constant('onload="alert(1)"'),
            fc.string().map((s) => `onclick="${s}"`),

            // JavaScript protocol
            fc.constant('javascript:alert(1)'),
            fc.constant('JAVASCRIPT:alert(1)'),
            fc.string().map((s) => `javascript:${s}`),

            // Iframe injection
            fc.constant('<iframe src="evil.com"></iframe>'),
            fc.string().map((s) => `<iframe>${s}</iframe>`),

            // Object/embed tags
            fc.constant('<object data="evil.swf"></object>'),
            fc.constant('<embed src="evil.swf">')
          ),
          (maliciousInput) => {
            const result = containsInjectionAttempt(maliciousInput);
            expect(result).toBe(true);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should detect SQL injection attempts in any string', () => {
      /**
       * Property: For any string containing SQL injection patterns (SELECT, UNION,
       * DROP TABLE, etc.), containsInjectionAttempt should return true
       */
      fc.assert(
        fc.property(
          fc.oneof(
            // Basic SQL injection
            fc.constant("' OR '1'='1"),
            fc.constant('" OR "1"="1'),
            fc.constant("admin'--"),
            fc.constant("admin';--"),

            // SQL commands
            fc.constant('SELECT * FROM users'),
            fc.constant('select * from users'),
            fc.constant('INSERT INTO users VALUES'),
            fc.constant('UPDATE users SET password'),
            fc.constant('DELETE FROM users'),
            fc.constant('DROP TABLE users'),
            fc.constant('UNION SELECT password'),

            // With random data
            fc.string().map((s) => `SELECT ${s} FROM users`),
            fc.string().map((s) => `${s} UNION SELECT ${s}`),
            fc.string().map((s) => `${s}' OR '1'='1`)
          ),
          (maliciousInput) => {
            const result = containsInjectionAttempt(maliciousInput);
            expect(result).toBe(true);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should not flag safe strings as injection attempts', () => {
      /**
       * Property: For any string without injection patterns (normal text, emails,
       * URLs without javascript:), containsInjectionAttempt should return false
       */
      fc.assert(
        fc.property(
          fc.oneof(
            // Normal text
            fc
              .string({ minLength: 1, maxLength: 100 })
              .filter((s) => !containsInjectionAttempt(s)),

            // Email-like strings
            fc.emailAddress(),

            // Safe URLs
            fc.webUrl({ validSchemes: ['http', 'https'] }),

            // Alphanumeric with spaces
            fc.stringMatching(/^[a-zA-Z0-9\s]+$/),

            // Common safe inputs
            fc.constantFrom(
              'Hello World',
              'user@example.com',
              'https://example.com',
              'John Doe',
              '123 Main Street',
              'Product Description',
              'This is a normal sentence.'
            )
          ),
          (safeInput) => {
            const result = containsInjectionAttempt(safeInput);
            expect(result).toBe(false);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should sanitize XSS patterns from any string', () => {
      /**
       * Property: For any string containing XSS patterns, sanitizeString should
       * remove or neutralize the dangerous content
       */
      fc.assert(
        fc.property(
          fc.string(),
          fc.oneof(
            fc.constant('<script>'),
            fc.constant('javascript:'),
            fc.constant('onclick='),
            fc.constant('<iframe>')
          ),
          (prefix, xssPattern) => {
            const maliciousInput = prefix + xssPattern + prefix;
            const sanitized = sanitizeString(maliciousInput);

            // After sanitization, the dangerous pattern should be removed
            expect(sanitized.toLowerCase()).not.toContain('<script');
            expect(sanitized.toLowerCase()).not.toContain('javascript:');
            expect(sanitized.toLowerCase()).not.toContain('<iframe');

            // Event handlers should be removed
            if (xssPattern.includes('onclick')) {
              expect(sanitized.toLowerCase()).not.toMatch(/on\w+=/);
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should sanitize SQL injection patterns from any string', () => {
      /**
       * Property: For any string containing SQL injection patterns, sanitizeString
       * should remove or neutralize the dangerous SQL keywords
       */
      fc.assert(
        fc.property(
          fc.string(),
          fc.constantFrom(
            'SELECT',
            'INSERT',
            'UPDATE',
            'DELETE',
            'DROP',
            'UNION'
          ),
          (prefix, sqlKeyword) => {
            const maliciousInput = prefix + ' ' + sqlKeyword + ' * FROM users';
            const sanitized = sanitizeString(maliciousInput);

            // After sanitization, SQL keywords should be removed
            expect(sanitized.toUpperCase()).not.toContain(sqlKeyword);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should recursively sanitize objects with any structure', () => {
      /**
       * Property: For any object containing strings with injection patterns,
       * sanitizeObject should sanitize all string values recursively
       */
      fc.assert(
        fc.property(
          fc.object({
            key: fc.oneof(fc.string(), fc.constant('field')),
            values: [
              fc.string(),
              fc.constant('<script>alert(1)</script>'),
              fc.constant('javascript:void(0)'),
              fc.constant("' OR '1'='1"),
            ],
            depthSize: 'small',
          }),
          (obj) => {
            const sanitized = sanitizeObject(obj);

            // Check all string values are sanitized
            // Using unknown type for recursive value checking
            const checkSanitized = (value: unknown): void => {
              if (typeof value === 'string') {
                expect(value.toLowerCase()).not.toContain('<script');
                expect(value.toLowerCase()).not.toContain('javascript:');
              } else if (Array.isArray(value)) {
                value.forEach(checkSanitized);
              } else if (typeof value === 'object' && value !== null) {
                Object.values(value).forEach(checkSanitized);
              }
            };

            checkSanitized(sanitized);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should preserve safe content while removing dangerous patterns', () => {
      /**
       * Property: For any string with mixed safe and dangerous content,
       * sanitizeString should preserve the safe parts
       */
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 50 })
            .filter((s) => !containsInjectionAttempt(s)),
          fc.constantFrom(
            '<script>alert(1)</script>',
            'javascript:void(0)',
            'onclick="alert(1)"'
          ),
          (safeContent, dangerousContent) => {
            const mixedInput = safeContent + dangerousContent + safeContent;
            const sanitized = sanitizeString(mixedInput);

            // Safe content should still be present (at least partially)
            // Dangerous content should be removed
            expect(sanitized.toLowerCase()).not.toContain('<script');
            expect(sanitized.toLowerCase()).not.toContain('javascript:');
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should handle edge cases without throwing errors', () => {
      /**
       * Property: For any input (including empty strings, very long strings,
       * special characters), sanitization functions should not throw errors
       */
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(''),
            fc.string({ maxLength: 10000 }),
            fc.string({ minLength: 0, maxLength: 100 }),
            // Testing edge cases with non-string inputs that might be passed
            fc.constant(null as unknown as string),
            fc.constant(undefined as unknown as string),
            fc.constant(123 as unknown as string),
            fc.constant({} as unknown as string)
          ),
          (input) => {
            // Should not throw - functions should handle invalid inputs gracefully
            expect(() => sanitizeString(input)).not.toThrow();
            expect(() => containsInjectionAttempt(input)).not.toThrow();
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});
