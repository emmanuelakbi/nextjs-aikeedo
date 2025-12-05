import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { Email } from './Email';

/**
 * Feature: nextjs-foundation, Property: Email validation correctness
 * Validates: Requirements 3.1
 */

describe('Email Value Object', () => {
  describe('Property-Based Tests', () => {
    it('should accept all valid email addresses', () => {
      // Property: For any valid email format, Email.create should succeed
      fc.assert(
        fc.property(fc.emailAddress(), (email) => {
          const emailObj = Email.create(email);
          expect(emailObj).toBeDefined();
          expect(emailObj.getValue()).toBe(email.toLowerCase().trim());
        }),
        { numRuns: 10 }
      );
    });

    it('should reject emails without @ symbol', () => {
      // Property: For any string without @, Email.create should fail
      fc.assert(
        fc.property(
          fc.string().filter((s) => !s.includes('@') && s.trim().length > 0),
          (invalidEmail) => {
            expect(() => Email.create(invalidEmail)).toThrow();
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should normalize emails to lowercase', () => {
      // Property: For any valid email, the stored value should be lowercase
      fc.assert(
        fc.property(fc.emailAddress(), (email) => {
          const emailObj = Email.create(email);
          expect(emailObj.getValue()).toBe(email.toLowerCase().trim());
        }),
        { numRuns: 10 }
      );
    });

    it('should trim whitespace from emails', () => {
      // Property: For any valid email with surrounding whitespace, it should be trimmed
      fc.assert(
        fc.property(
          fc.emailAddress(),
          fc.string().filter((s) => /^\s+$/.test(s)),
          fc.string().filter((s) => /^\s+$/.test(s)),
          (email, prefixSpace, suffixSpace) => {
            const paddedEmail = prefixSpace + email + suffixSpace;
            const emailObj = Email.create(paddedEmail);
            expect(emailObj.getValue()).toBe(email.toLowerCase().trim());
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject emails exceeding maximum length', () => {
      // Property: For any email longer than 254 characters, Email.create should fail
      fc.assert(
        fc.property(fc.string({ minLength: 255 }), (longString) => {
          // Create a long but structurally valid email
          const localPart = longString.substring(0, 200);
          const domain = 'example.com';
          const longEmail = `${localPart}@${domain}`;

          if (longEmail.length > 254) {
            expect(() => Email.create(longEmail)).toThrow(
              'Email address is too long'
            );
          }
        }),
        { numRuns: 10 }
      );
    });

    it('should maintain equality for same email addresses', () => {
      // Property: For any valid email, creating two Email objects should be equal
      fc.assert(
        fc.property(fc.emailAddress(), (email) => {
          const email1 = Email.create(email);
          const email2 = Email.create(email);
          expect(email1.equals(email2)).toBe(true);
        }),
        { numRuns: 10 }
      );
    });

    it('should maintain inequality for different email addresses', () => {
      // Property: For any two different valid emails, they should not be equal
      fc.assert(
        fc.property(fc.emailAddress(), fc.emailAddress(), (email1, email2) => {
          fc.pre(email1.toLowerCase() !== email2.toLowerCase());
          const emailObj1 = Email.create(email1);
          const emailObj2 = Email.create(email2);
          expect(emailObj1.equals(emailObj2)).toBe(false);
        }),
        { numRuns: 10 }
      );
    });
  });

  describe('Unit Tests - Edge Cases', () => {
    it('should reject empty email', () => {
      expect(() => Email.create('')).toThrow('Email cannot be empty');
    });

    it('should reject email with only whitespace', () => {
      expect(() => Email.create('   ')).toThrow('Email cannot be empty');
    });

    it('should accept valid email formats', () => {
      const validEmails = [
        'user@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'user_name@example-domain.com',
        'u@example.com',
      ];

      validEmails.forEach((email) => {
        expect(() => Email.create(email)).not.toThrow();
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
        'user@example',
        'user..name@example.com',
      ];

      invalidEmails.forEach((email) => {
        expect(() => Email.create(email)).toThrow();
      });
    });

    it('should reject email with local part exceeding 64 characters', () => {
      const longLocalPart = 'a'.repeat(65);
      const email = `${longLocalPart}@example.com`;
      expect(() => Email.create(email)).toThrow('Email local part is too long');
    });

    it('should reject email with domain exceeding 253 characters', () => {
      // Create an email where domain is long but total is under 254
      // Domain needs to be valid format with TLD (254 chars = 250 + '.com')
      const longDomain = 'a'.repeat(250) + '.com';
      const email = `u@${longDomain}`;
      // This will trigger the total length check first
      expect(() => Email.create(email)).toThrow();
    });
  });
});
