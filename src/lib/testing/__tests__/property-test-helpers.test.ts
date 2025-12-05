import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  emailArbitrary,
  passwordArbitrary,
  weakPasswordArbitrary,
  nameArbitrary,
  phoneNumberArbitrary,
  uuidArbitrary,
  workspaceNameArbitrary,
  creditCountArbitrary,
  sessionTokenArbitrary,
  futureDateArbitrary,
  pastDateArbitrary,
  verificationTokenArbitrary,
  runPropertyTest,
} from '../property-test-helpers';

describe('Property Test Helpers - Arbitraries', () => {
  describe('emailArbitrary', () => {
    it('should generate valid email addresses', async () => {
      await fc.assert(
        fc.asyncProperty(emailArbitrary, async (email) => {
          // Basic email validation
          expect(email).toMatch(/^[a-z0-9]+@[a-z0-9]+\.(com|org|net|io|dev)$/);
          return true;
        }),
        { numRuns: 10 }
      );
    });
  });

  describe('passwordArbitrary', () => {
    it('should generate valid passwords', async () => {
      await fc.assert(
        fc.asyncProperty(passwordArbitrary, async (password) => {
          // Password should be 8-100 characters
          expect(password.length).toBeGreaterThanOrEqual(8);
          expect(password.length).toBeLessThanOrEqual(100);

          // Should contain at least one uppercase letter
          expect(password).toMatch(/[A-Z]/);

          // Should contain at least one lowercase letter
          expect(password).toMatch(/[a-z]/);

          // Should contain at least one number
          expect(password).toMatch(/[0-9]/);

          return true;
        }),
        { numRuns: 10 }
      );
    });
  });

  describe('weakPasswordArbitrary', () => {
    it('should generate weak passwords', async () => {
      await fc.assert(
        fc.asyncProperty(weakPasswordArbitrary, async (password) => {
          // Weak passwords should fail at least one strength criterion
          const isWeak =
            password.length < 8 ||
            !/[A-Z]/.test(password) ||
            !/[a-z]/.test(password) ||
            !/[0-9]/.test(password);

          expect(isWeak).toBe(true);
          return true;
        }),
        { numRuns: 10 }
      );
    });
  });

  describe('nameArbitrary', () => {
    it('should generate valid names', async () => {
      await fc.assert(
        fc.asyncProperty(nameArbitrary, async (name) => {
          // Name should start with uppercase
          expect(name[0]).toMatch(/[A-Z]/);

          // Name should be 2-50 characters
          expect(name.length).toBeGreaterThanOrEqual(2);
          expect(name.length).toBeLessThanOrEqual(50);

          return true;
        }),
        { numRuns: 10 }
      );
    });
  });

  describe('phoneNumberArbitrary', () => {
    it('should generate valid phone numbers', async () => {
      await fc.assert(
        fc.asyncProperty(phoneNumberArbitrary, async (phone) => {
          // Phone should start with +
          expect(phone).toMatch(/^\+[0-9]+$/);

          return true;
        }),
        { numRuns: 10 }
      );
    });
  });

  describe('uuidArbitrary', () => {
    it('should generate valid UUIDs', async () => {
      await fc.assert(
        fc.asyncProperty(uuidArbitrary, async (uuid) => {
          // UUID v4 format (fast-check's uuid() generates valid UUIDs)
          expect(uuid).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
          );

          return true;
        }),
        { numRuns: 10 }
      );
    });
  });

  describe('workspaceNameArbitrary', () => {
    it('should generate valid workspace names', async () => {
      await fc.assert(
        fc.asyncProperty(workspaceNameArbitrary, async (name) => {
          // Workspace name should be 3-50 characters
          expect(name.trim().length).toBeGreaterThanOrEqual(3);
          expect(name.length).toBeLessThanOrEqual(50);

          return true;
        }),
        { numRuns: 10 }
      );
    });
  });

  describe('creditCountArbitrary', () => {
    it('should generate valid credit counts', async () => {
      await fc.assert(
        fc.asyncProperty(creditCountArbitrary, async (count) => {
          // Credit count should be non-negative
          expect(count).toBeGreaterThanOrEqual(0);
          expect(count).toBeLessThanOrEqual(1000000);

          return true;
        }),
        { numRuns: 10 }
      );
    });
  });

  describe('sessionTokenArbitrary', () => {
    it('should generate valid session tokens', async () => {
      await fc.assert(
        fc.asyncProperty(sessionTokenArbitrary, async (token) => {
          // Session token should be 32-128 alphanumeric characters
          expect(token).toMatch(/^[a-zA-Z0-9]{32,128}$/);

          return true;
        }),
        { numRuns: 10 }
      );
    });
  });

  describe('futureDateArbitrary', () => {
    it('should generate future dates', async () => {
      const now = Date.now();

      await fc.assert(
        fc.asyncProperty(futureDateArbitrary, async (date) => {
          expect(date.getTime()).toBeGreaterThan(now);
          return true;
        }),
        { numRuns: 10 }
      );
    });
  });

  describe('pastDateArbitrary', () => {
    it('should generate past dates', async () => {
      const now = Date.now();

      await fc.assert(
        fc.asyncProperty(pastDateArbitrary, async (date) => {
          expect(date.getTime()).toBeLessThan(now);
          return true;
        }),
        { numRuns: 10 }
      );
    });
  });

  describe('verificationTokenArbitrary', () => {
    it('should generate valid verification tokens', async () => {
      await fc.assert(
        fc.asyncProperty(verificationTokenArbitrary, async (token) => {
          // Verification token should be 32-64 alphanumeric characters
          expect(token).toMatch(/^[a-zA-Z0-9]{32,64}$/);

          return true;
        }),
        { numRuns: 10 }
      );
    });
  });

  describe('runPropertyTest', () => {
    it('should run property tests with default configuration', async () => {
      let runCount = 0;

      await runPropertyTest(fc.integer({ min: 1, max: 100 }), (value) => {
        runCount++;
        return value > 0;
      });

      // Should run at least 100 times
      expect(runCount).toBeGreaterThanOrEqual(100);
    });
  });
});
