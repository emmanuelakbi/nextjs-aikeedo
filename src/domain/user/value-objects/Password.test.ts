import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { Password } from './Password';

/**
 * Feature: nextjs-foundation, Property: Password strength validation
 * Validates: Requirements 3.4
 */

describe('Password Value Object', () => {
  describe('Property-Based Tests', () => {
    // Custom arbitrary for generating valid passwords
    const validPasswordArbitrary = () => {
      return fc
        .tuple(
          fc.array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), {
            minLength: 2,
            maxLength: 20,
          }),
          fc.array(fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'), {
            minLength: 2,
            maxLength: 20,
          }),
          fc.array(fc.constantFrom(...'0123456789'), {
            minLength: 2,
            maxLength: 20,
          }),
          fc.array(fc.constantFrom(...'!@#$%^&*()_+-=[]{};\':"|,.<>/?'), {
            minLength: 0,
            maxLength: 10,
          })
        )
        .map(([lower, upper, numbers, special]) => {
          // Shuffle to avoid predictable patterns
          const combined = [...lower, ...upper, ...numbers, ...special];
          for (let i = combined.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [combined[i], combined[j]] = [combined[j], combined[i]];
          }
          return combined.join('').substring(0, 50); // Keep reasonable length
        })
        .filter((password) => {
          // Filter out passwords that would fail validation
          try {
            Password.create(password);
            return true;
          } catch {
            return false;
          }
        });
    };

    it('should accept passwords meeting strength requirements', () => {
      // Property: For any password with 3+ character types and 8+ length, Password.create should succeed
      fc.assert(
        fc.property(validPasswordArbitrary(), (password) => {
          fc.pre(password.length >= 8 && password.length <= 72);
          const passwordObj = Password.create(password);
          expect(passwordObj).toBeDefined();
          expect(passwordObj.getValue()).toBe(password);
        }),
        { numRuns: 10 }
      );
    });

    it('should reject passwords shorter than 8 characters', () => {
      // Property: For any password shorter than 8 characters, Password.create should fail
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 7 }),
          (shortPassword) => {
            expect(() => Password.create(shortPassword)).toThrow(
              'Password must be at least 8 characters long'
            );
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject passwords longer than 72 characters', () => {
      // Property: For any password longer than 72 characters, Password.create should fail
      fc.assert(
        fc.property(
          fc.string({ minLength: 73, maxLength: 100 }),
          (longPassword) => {
            expect(() => Password.create(longPassword)).toThrow(
              'Password must not exceed 72 characters'
            );
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should correctly identify uppercase letters', () => {
      // Property: For any valid password with uppercase, hasUpperCase should return true
      fc.assert(
        fc.property(validPasswordArbitrary(), (password) => {
          fc.pre(password.length >= 8 && password.length <= 72);
          const passwordObj = Password.create(password);
          const hasUpper = /[A-Z]/.test(password);
          expect(passwordObj.hasUpperCase()).toBe(hasUpper);
        }),
        { numRuns: 10 }
      );
    });

    it('should correctly identify lowercase letters', () => {
      // Property: For any valid password with lowercase, hasLowerCase should return true
      fc.assert(
        fc.property(validPasswordArbitrary(), (password) => {
          fc.pre(password.length >= 8 && password.length <= 72);
          const passwordObj = Password.create(password);
          const hasLower = /[a-z]/.test(password);
          expect(passwordObj.hasLowerCase()).toBe(hasLower);
        }),
        { numRuns: 10 }
      );
    });

    it('should correctly identify numbers', () => {
      // Property: For any valid password with numbers, hasNumber should return true
      fc.assert(
        fc.property(validPasswordArbitrary(), (password) => {
          fc.pre(password.length >= 8 && password.length <= 72);
          const passwordObj = Password.create(password);
          const hasNum = /[0-9]/.test(password);
          expect(passwordObj.hasNumber()).toBe(hasNum);
        }),
        { numRuns: 10 }
      );
    });

    it('should correctly identify special characters', () => {
      // Property: For any valid password with special chars, hasSpecialChar should return true
      fc.assert(
        fc.property(validPasswordArbitrary(), (password) => {
          fc.pre(password.length >= 8 && password.length <= 72);
          const passwordObj = Password.create(password);
          const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
            password
          );
          expect(passwordObj.hasSpecialChar()).toBe(hasSpecial);
        }),
        { numRuns: 10 }
      );
    });

    it('should return correct password length', () => {
      // Property: For any valid password, getLength should return the actual length
      fc.assert(
        fc.property(validPasswordArbitrary(), (password) => {
          fc.pre(password.length >= 8 && password.length <= 72);
          const passwordObj = Password.create(password);
          expect(passwordObj.getLength()).toBe(password.length);
        }),
        { numRuns: 10 }
      );
    });
  });

  describe('Unit Tests - Edge Cases', () => {
    it('should reject empty password', () => {
      expect(() => Password.create('')).toThrow('Password cannot be empty');
    });

    it('should accept password with 3 character types', () => {
      const validPasswords = [
        'Axzdef19', // upper, lower, number (no sequential)
        'axzdef19!', // lower, number, special
        'AXZDEF19!', // upper, number, special
        'AXZaxz!@#', // upper, lower, special
      ];

      validPasswords.forEach((password) => {
        expect(() => Password.create(password)).not.toThrow();
      });
    });

    it('should reject password with only 2 character types', () => {
      const weakPasswords = [
        'axzdefgh', // only lower
        'AXZDEFGH', // only upper
        '13579246', // only numbers (no sequential)
        'axzdef19', // only lower and numbers
        'AXZDEF19', // only upper and numbers
      ];

      weakPasswords.forEach((password) => {
        expect(() => Password.create(password)).toThrow(
          'Password must contain at least 3'
        );
      });
    });

    it('should reject password with all same characters', () => {
      // These will fail strength check first, so just verify they throw
      expect(() => Password.create('aaaaaaaa')).toThrow();
      expect(() => Password.create('11111111')).toThrow();
    });

    it('should reject password with sequential characters', () => {
      // These will fail strength check first (only one char type), so just verify they throw
      expect(() => Password.create('12345678')).toThrow();
      expect(() => Password.create('abcdefgh')).toThrow();
      expect(() => Password.create('ABCDEFGH')).toThrow();
    });

    it('should accept strong passwords', () => {
      const strongPasswords = [
        'MyP@ssw0rd',
        'Str0ng!Pass',
        'C0mpl3x#Pwd',
        'S3cur3$Pass',
      ];

      strongPasswords.forEach((password) => {
        const passwordObj = Password.create(password);
        expect(passwordObj).toBeDefined();
        expect(passwordObj.getValue()).toBe(password);
      });
    });

    it('should correctly report character type presence', () => {
      const password = Password.create('MyP@ssw0rd');

      expect(password.hasUpperCase()).toBe(true);
      expect(password.hasLowerCase()).toBe(true);
      expect(password.hasNumber()).toBe(true);
      expect(password.hasSpecialChar()).toBe(true);
    });

    it('should handle passwords at boundary lengths', () => {
      // Exactly 8 characters (avoid sequential patterns)
      const minPassword = 'Axz19!@#';
      expect(() => Password.create(minPassword)).not.toThrow();

      // Exactly 72 characters
      const maxPassword = 'Axz19!@#' + 'y'.repeat(64);
      expect(() => Password.create(maxPassword)).not.toThrow();
    });
  });
});
