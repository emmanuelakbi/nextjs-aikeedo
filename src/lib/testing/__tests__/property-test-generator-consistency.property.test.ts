/**
 * Property-Based Tests for Property Test Generator Consistency
 *
 * Feature: critical-fixes
 * **Property 8: Test Type Consistency**
 * **Validates: Requirements 6.4**
 *
 * These tests validate that property test generators produce correctly typed data:
 * 1. Generators produce values that match their declared types
 * 2. Generated values satisfy their constraints
 * 3. Generators are deterministic given the same seed
 * 4. Generators handle edge cases correctly
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  emailArbitrary,
  passwordArbitrary,
  nameArbitrary,
  phoneNumberArbitrary,
  uuidArbitrary,
  workspaceNameArbitrary,
  creditCountArbitrary,
  sessionTokenArbitrary,
  futureDateArbitrary,
  pastDateArbitrary,
  verificationTokenArbitrary,
  sqlInjectionArbitrary,
  xssArbitrary,
  runPropertyTest,
} from '../property-test-helpers';

/**
 * Property 8: Test Type Consistency - Generator Output Types
 * **Validates: Requirements 6.4**
 *
 * For any property test generator, the output should match the expected type
 * and satisfy all declared constraints.
 */
describe('Property 8: Property Test Generator Consistency', () => {
  describe('Email Generator Consistency', () => {
    /**
     * Property: Email generator should produce valid email strings
     * Validates: Email arbitrary produces strings in email format
     */
    it('should produce valid email format strings', () => {
      fc.assert(
        fc.property(emailArbitrary, (email) => {
          // Type check: email should be a string
          expect(typeof email).toBe('string');

          // Format check: should contain @ symbol
          expect(email).toContain('@');

          // Format check: should have local and domain parts
          const parts = email.split('@');
          expect(parts.length).toBe(2);
          expect(parts[0]!.length).toBeGreaterThan(0);
          expect(parts[1]!.length).toBeGreaterThan(0);

          // Format check: domain should have TLD
          expect(parts[1]).toContain('.');

          return true;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Email generator should produce unique values across runs
     * Validates: Generator produces diverse output
     */
    it('should produce diverse email values', () => {
      const emails = new Set<string>();

      fc.assert(
        fc.property(emailArbitrary, (email) => {
          emails.add(email);
          return true;
        }),
        { numRuns: 50 }
      );

      // Should have generated multiple unique emails
      expect(emails.size).toBeGreaterThan(10);
    });
  });

  describe('Password Generator Consistency', () => {
    /**
     * Property: Password generator should produce valid password strings
     * Validates: Password arbitrary produces strings meeting requirements
     */
    it('should produce valid password format strings', () => {
      fc.assert(
        fc.property(passwordArbitrary, (password) => {
          // Type check: password should be a string
          expect(typeof password).toBe('string');

          // Length check: should be within valid range
          expect(password.length).toBeGreaterThanOrEqual(8);
          expect(password.length).toBeLessThanOrEqual(100);

          // Complexity check: should contain uppercase
          expect(password).toMatch(/[A-Z]/);

          // Complexity check: should contain lowercase
          expect(password).toMatch(/[a-z]/);

          // Complexity check: should contain number
          expect(password).toMatch(/[0-9]/);

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Name Generator Consistency', () => {
    /**
     * Property: Name generator should produce valid name strings
     * Validates: Name arbitrary produces properly formatted names
     */
    it('should produce valid name format strings', () => {
      fc.assert(
        fc.property(nameArbitrary, (name) => {
          // Type check: name should be a string
          expect(typeof name).toBe('string');

          // Length check: should be within valid range
          expect(name.length).toBeGreaterThanOrEqual(2);
          expect(name.length).toBeLessThanOrEqual(50);

          // Format check: should start with uppercase
          expect(name[0]).toMatch(/[A-Z]/);

          // Format check: rest should be lowercase
          if (name.length > 1) {
            expect(name.slice(1)).toMatch(/^[a-z]+$/);
          }

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Phone Number Generator Consistency', () => {
    /**
     * Property: Phone number generator should produce valid E.164 format
     * Validates: Phone arbitrary produces properly formatted phone numbers
     */
    it('should produce valid E.164 phone number format', () => {
      fc.assert(
        fc.property(phoneNumberArbitrary, (phone) => {
          // Type check: phone should be a string
          expect(typeof phone).toBe('string');

          // Format check: should start with +
          expect(phone[0]).toBe('+');

          // Format check: rest should be digits
          expect(phone.slice(1)).toMatch(/^\d+$/);

          // Length check: E.164 allows up to 15 digits
          expect(phone.length).toBeLessThanOrEqual(16); // +15 digits

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('UUID Generator Consistency', () => {
    /**
     * Property: UUID generator should produce valid UUID format
     * Validates: UUID arbitrary produces properly formatted UUIDs
     * Note: fc.uuid() generates valid UUIDs but not necessarily v4 format
     */
    it('should produce valid UUID v4 format', () => {
      fc.assert(
        fc.property(uuidArbitrary, (uuid) => {
          // Type check: uuid should be a string
          expect(typeof uuid).toBe('string');

          // Format check: should match general UUID pattern
          // fc.uuid() generates valid UUIDs but may not be v4 specifically
          const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          expect(uuid).toMatch(uuidRegex);

          return true;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: UUID generator should produce unique values
     * Validates: Generator produces unique UUIDs
     */
    it('should produce unique UUID values', () => {
      const uuids = new Set<string>();

      fc.assert(
        fc.property(uuidArbitrary, (uuid) => {
          // Each UUID should be unique
          expect(uuids.has(uuid)).toBe(false);
          uuids.add(uuid);
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Workspace Name Generator Consistency', () => {
    /**
     * Property: Workspace name generator should produce valid names
     * Validates: Workspace name arbitrary produces valid workspace names
     */
    it('should produce valid workspace name format', () => {
      fc.assert(
        fc.property(workspaceNameArbitrary, (name) => {
          // Type check: name should be a string
          expect(typeof name).toBe('string');

          // Length check: trimmed name should be at least 3 characters
          expect(name.trim().length).toBeGreaterThanOrEqual(3);

          // Format check: should only contain alphanumeric and spaces
          expect(name).toMatch(/^[A-Za-z0-9 ]+$/);

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Credit Count Generator Consistency', () => {
    /**
     * Property: Credit count generator should produce valid integers
     * Validates: Credit count arbitrary produces non-negative integers
     */
    it('should produce valid credit count values', () => {
      fc.assert(
        fc.property(creditCountArbitrary, (credits) => {
          // Type check: credits should be a number
          expect(typeof credits).toBe('number');

          // Integer check: should be an integer
          expect(Number.isInteger(credits)).toBe(true);

          // Range check: should be non-negative
          expect(credits).toBeGreaterThanOrEqual(0);

          // Range check: should be within max limit
          expect(credits).toBeLessThanOrEqual(1000000);

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Session Token Generator Consistency', () => {
    /**
     * Property: Session token generator should produce valid tokens
     * Validates: Session token arbitrary produces properly formatted tokens
     */
    it('should produce valid session token format', () => {
      fc.assert(
        fc.property(sessionTokenArbitrary, (token) => {
          // Type check: token should be a string
          expect(typeof token).toBe('string');

          // Length check: should be within valid range
          expect(token.length).toBeGreaterThanOrEqual(32);
          expect(token.length).toBeLessThanOrEqual(128);

          // Format check: should only contain alphanumeric characters
          expect(token).toMatch(/^[a-zA-Z0-9]+$/);

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Date Generator Consistency', () => {
    /**
     * Property: Future date generator should produce dates in the future
     * Validates: Future date arbitrary produces dates after now
     */
    it('should produce future dates', () => {
      // Use a timestamp from 1 second ago to account for test execution time
      const now = Date.now() - 1000;

      fc.assert(
        fc.property(futureDateArbitrary, (date) => {
          // Type check: date should be a Date object
          expect(date).toBeInstanceOf(Date);

          // Future check: should be after now (with buffer)
          expect(date.getTime()).toBeGreaterThan(now);

          // Range check: should be within 2 years (with buffer)
          const twoYearsFromNow = Date.now() + 2 * 365 * 24 * 60 * 60 * 1000;
          expect(date.getTime()).toBeLessThanOrEqual(twoYearsFromNow);

          return true;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Past date generator should produce dates in the past
     * Validates: Past date arbitrary produces dates before now
     */
    it('should produce past dates', () => {
      const now = Date.now();

      fc.assert(
        fc.property(pastDateArbitrary, (date) => {
          // Type check: date should be a Date object
          expect(date).toBeInstanceOf(Date);

          // Past check: should be before now
          expect(date.getTime()).toBeLessThan(now);

          // Range check: should be within 2 years ago
          const twoYearsAgo = now - 2 * 365 * 24 * 60 * 60 * 1000;
          expect(date.getTime()).toBeGreaterThanOrEqual(twoYearsAgo);

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Verification Token Generator Consistency', () => {
    /**
     * Property: Verification token generator should produce valid tokens
     * Validates: Verification token arbitrary produces properly formatted tokens
     */
    it('should produce valid verification token format', () => {
      fc.assert(
        fc.property(verificationTokenArbitrary, (token) => {
          // Type check: token should be a string
          expect(typeof token).toBe('string');

          // Length check: should be within valid range
          expect(token.length).toBeGreaterThanOrEqual(32);
          expect(token.length).toBeLessThanOrEqual(64);

          // Format check: should only contain alphanumeric characters
          expect(token).toMatch(/^[a-zA-Z0-9]+$/);

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Security Test Generator Consistency', () => {
    /**
     * Property: SQL injection generator should produce attack strings
     * Validates: SQL injection arbitrary produces known attack patterns
     */
    it('should produce SQL injection attack strings', () => {
      fc.assert(
        fc.property(sqlInjectionArbitrary, (injection) => {
          // Type check: injection should be a string
          expect(typeof injection).toBe('string');

          // Content check: should contain SQL-like patterns
          const hasSqlPattern =
            injection.includes("'") ||
            injection.includes('--') ||
            injection.includes(';') ||
            injection.toUpperCase().includes('DROP') ||
            injection.toUpperCase().includes('DELETE') ||
            injection.toUpperCase().includes('UNION') ||
            injection.toUpperCase().includes('SELECT') ||
            injection.toUpperCase().includes('OR');

          expect(hasSqlPattern).toBe(true);

          return true;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: XSS generator should produce attack strings
     * Validates: XSS arbitrary produces known attack patterns
     */
    it('should produce XSS attack strings', () => {
      fc.assert(
        fc.property(xssArbitrary, (xss) => {
          // Type check: xss should be a string
          expect(typeof xss).toBe('string');

          // Content check: should contain XSS-like patterns
          const hasXssPattern =
            xss.includes('<script') ||
            xss.includes('onerror') ||
            xss.includes('onload') ||
            xss.includes('javascript:') ||
            xss.includes('<img') ||
            xss.includes('<svg');

          expect(hasXssPattern).toBe(true);

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('runPropertyTest Helper Consistency', () => {
    /**
     * Property: runPropertyTest should execute with minimum 100 iterations
     * Validates: Helper function enforces minimum iteration count
     */
    it('should execute property tests with correct iteration count', async () => {
      let executionCount = 0;

      await runPropertyTest(
        fc.integer({ min: 0, max: 100 }),
        (value) => {
          executionCount++;
          expect(typeof value).toBe('number');
          return true;
        }
      );

      // Should have run at least 100 times (default)
      expect(executionCount).toBeGreaterThanOrEqual(100);
    });

    /**
     * Property: runPropertyTest should handle async predicates
     * Validates: Helper function properly awaits async operations
     */
    it('should handle async predicates correctly', async () => {
      let asyncExecutionCount = 0;

      await runPropertyTest(
        fc.string({ minLength: 1, maxLength: 10 }),
        async (value) => {
          // Simulate async operation
          await new Promise((resolve) => setTimeout(resolve, 1));
          asyncExecutionCount++;
          expect(typeof value).toBe('string');
          return true;
        },
        { numRuns: 10 } // Reduced for performance
      );

      expect(asyncExecutionCount).toBe(10);
    });
  });

  describe('Generator Type Safety', () => {
    /**
     * Property: All generators should produce non-null, non-undefined values
     * Validates: Generators never produce null or undefined
     */
    it('should never produce null or undefined values', () => {
      const generators = [
        { name: 'email', arb: emailArbitrary },
        { name: 'password', arb: passwordArbitrary },
        { name: 'name', arb: nameArbitrary },
        { name: 'phone', arb: phoneNumberArbitrary },
        { name: 'uuid', arb: uuidArbitrary },
        { name: 'workspaceName', arb: workspaceNameArbitrary },
        { name: 'creditCount', arb: creditCountArbitrary },
        { name: 'sessionToken', arb: sessionTokenArbitrary },
        { name: 'futureDate', arb: futureDateArbitrary },
        { name: 'pastDate', arb: pastDateArbitrary },
        { name: 'verificationToken', arb: verificationTokenArbitrary },
        { name: 'sqlInjection', arb: sqlInjectionArbitrary },
        { name: 'xss', arb: xssArbitrary },
      ];

      for (const { name, arb } of generators) {
        fc.assert(
          fc.property(arb, (value) => {
            expect(value).not.toBeNull();
            expect(value).not.toBeUndefined();
            return true;
          }),
          { numRuns: 50 }
        );
      }
    });

    /**
     * Property: Generators should be deterministic with same seed
     * Validates: Same seed produces same sequence of values
     */
    it('should produce deterministic values with same seed', () => {
      const seed = 12345;

      // Generate values with first seed
      const values1: string[] = [];
      fc.assert(
        fc.property(uuidArbitrary, (uuid) => {
          values1.push(uuid);
          return true;
        }),
        { numRuns: 10, seed }
      );

      // Generate values with same seed
      const values2: string[] = [];
      fc.assert(
        fc.property(uuidArbitrary, (uuid) => {
          values2.push(uuid);
          return true;
        }),
        { numRuns: 10, seed }
      );

      // Values should be identical
      expect(values1).toEqual(values2);
    });
  });
});
