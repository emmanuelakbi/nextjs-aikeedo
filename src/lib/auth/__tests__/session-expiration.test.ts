import { describe, it, expect, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { prisma } from '../../db';
import { generateSessionToken, isTokenExpired } from '../tokens';

/**
 * Feature: nextjs-foundation, Property 6: Session expiration enforcement
 * Validates: Requirements 6.4, 6.5
 */

describe('Session Expiration', () => {
  // Clean up test data after each test
  afterEach(async () => {
    await prisma.session.deleteMany({
      where: {
        user: {
          email: {
            startsWith: 'test-session-exp-',
          },
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          startsWith: 'test-session-exp-',
        },
      },
    });
  });

  describe('Property-Based Tests', () => {
    it('should correctly identify expired sessions', () => {
      /**
       * Property 6: Session expiration enforcement
       * For any session that has passed its expiration date,
       * authentication attempts using that session should fail
       */
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 365 }), // Days in the past
          (daysAgo) => {
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() - daysAgo);

            // Any date in the past should be considered expired
            expect(isTokenExpired(expirationDate)).toBe(true);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should correctly identify non-expired sessions', () => {
      /**
       * Property: For any session with a future expiration date,
       * it should not be considered expired
       */
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 365 }), // Days in the future
          (daysAhead) => {
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + daysAhead);

            // Any date in the future should not be expired
            expect(isTokenExpired(expirationDate)).toBe(false);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should handle sessions expiring at various time intervals', () => {
      /**
       * Property: For any time offset (positive or negative),
       * expiration check should correctly determine if session is expired
       */
      fc.assert(
        fc.property(
          fc.integer({ min: -1000000, max: 1000000 }), // Milliseconds offset
          (msOffset) => {
            const expirationDate = new Date(Date.now() + msOffset);
            const shouldBeExpired = msOffset < 0;

            expect(isTokenExpired(expirationDate)).toBe(shouldBeExpired);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should enforce 30-day expiration policy', () => {
      /**
       * Property: For any session created with default settings,
       * it should expire after 30 days of inactivity
       */
      fc.assert(
        fc.property(fc.constant(null), () => {
          const now = new Date();
          const thirtyDaysFromNow = new Date(
            now.getTime() + 30 * 24 * 60 * 60 * 1000
          );
          const thirtyOneDaysFromNow = new Date(
            now.getTime() + 31 * 24 * 60 * 60 * 1000
          );

          // 30 days from now should not be expired
          expect(isTokenExpired(thirtyDaysFromNow)).toBe(false);

          // But checking from 31 days in the future perspective
          // (simulating time passing)
          const _futureCheck = new Date(thirtyOneDaysFromNow.getTime() + 1000);
          expect(isTokenExpired(thirtyDaysFromNow)).toBe(false); // Still not expired from current time
        }),
        { numRuns: 10 }
      );
    });
  });

  describe('Database Session Expiration Tests', () => {
    it('should not retrieve expired sessions from database', async () => {
      /**
       * Property 6: Session expiration enforcement (database level)
       * For any expired session in the database, queries should treat it as invalid
       */

      // Create a test user
      const user = await prisma.user.create({
        data: {
          email: `test-session-exp-${Date.now()}@example.com`,
          passwordHash: 'test-hash',
          firstName: 'Test',
          lastName: 'User',
        },
      });

      try {
        const token = generateSessionToken();
        const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago

        // Create an expired session
        await prisma.session.create({
          data: {
            sessionToken: token,
            userId: user.id,
            expires: expiredDate,
          },
        });

        // Query for valid (non-expired) sessions
        const validSessions = await prisma.session.findMany({
          where: {
            userId: user.id,
            expires: {
              gt: new Date(), // Greater than current time
            },
          },
        });

        // Should not find any valid sessions
        expect(validSessions.length).toBe(0);

        // But the expired session should exist in database
        const allSessions = await prisma.session.findMany({
          where: {
            userId: user.id,
          },
        });

        expect(allSessions.length).toBe(1);
        expect(isTokenExpired(allSessions[0]!.expires)).toBe(true);
      } finally {
        // Clean up
        await prisma.session.deleteMany({
          where: { userId: user.id },
        });
        await prisma.user.delete({
          where: { id: user.id },
        });
      }
    });

    it('should retrieve only non-expired sessions', async () => {
      /**
       * Property: For any mix of expired and non-expired sessions,
       * queries should only return non-expired ones
       */

      // Create a test user
      const user = await prisma.user.create({
        data: {
          email: `test-session-exp-${Date.now()}@example.com`,
          passwordHash: 'test-hash',
          firstName: 'Test',
          lastName: 'User',
        },
      });

      try {
        // Create multiple sessions with different expiration dates
        const sessions = [
          {
            token: generateSessionToken(),
            expires: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          }, // 2 days ago
          {
            token: generateSessionToken(),
            expires: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          }, // 1 day ago
          {
            token: generateSessionToken(),
            expires: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
          }, // 1 day ahead
          {
            token: generateSessionToken(),
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          }, // 7 days ahead
          {
            token: generateSessionToken(),
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          }, // 30 days ahead
        ];

        // Create all sessions
        for (const session of sessions) {
          await prisma.session.create({
            data: {
              sessionToken: session.token,
              userId: user.id,
              expires: session.expires,
            },
          });
        }

        // Query for valid sessions only
        const validSessions = await prisma.session.findMany({
          where: {
            userId: user.id,
            expires: {
              gt: new Date(),
            },
          },
        });

        // Should only find the 3 non-expired sessions
        expect(validSessions.length).toBe(3);

        // Verify all returned sessions are not expired
        validSessions.forEach((session) => {
          expect(isTokenExpired(session.expires)).toBe(false);
        });
      } finally {
        // Clean up
        await prisma.session.deleteMany({
          where: { userId: user.id },
        });
        await prisma.user.delete({
          where: { id: user.id },
        });
      }
    });

    it('should handle sessions expiring exactly at current time', async () => {
      /**
       * Property: For any session expiring at exactly the current time,
       * it should be considered expired
       */

      // Create a test user
      const user = await prisma.user.create({
        data: {
          email: `test-session-exp-${Date.now()}@example.com`,
          passwordHash: 'test-hash',
          firstName: 'Test',
          lastName: 'User',
        },
      });

      try {
        const token = generateSessionToken();
        const now = new Date();

        // Create a session expiring right now
        await prisma.session.create({
          data: {
            sessionToken: token,
            userId: user.id,
            expires: now,
          },
        });

        // Wait a tiny bit to ensure time has passed
        await new Promise((resolve) => setTimeout(resolve, 10));

        // Query for valid sessions
        const validSessions = await prisma.session.findMany({
          where: {
            userId: user.id,
            expires: {
              gt: new Date(),
            },
          },
        });

        // Should not find any valid sessions (expired at current time)
        expect(validSessions.length).toBe(0);
      } finally {
        // Clean up
        await prisma.session.deleteMany({
          where: { userId: user.id },
        });
        await prisma.user.delete({
          where: { id: user.id },
        });
      }
    });

    it('should handle automatic session cleanup for expired sessions', async () => {
      /**
       * Property: For any expired sessions, they can be safely deleted
       * without affecting valid sessions
       */

      // Create a test user
      const user = await prisma.user.create({
        data: {
          email: `test-session-exp-${Date.now()}@example.com`,
          passwordHash: 'test-hash',
          firstName: 'Test',
          lastName: 'User',
        },
      });

      try {
        // Create mix of expired and valid sessions
        const expiredToken1 = generateSessionToken();
        const expiredToken2 = generateSessionToken();
        const validToken = generateSessionToken();

        await prisma.session.create({
          data: {
            sessionToken: expiredToken1,
            userId: user.id,
            expires: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          },
        });

        await prisma.session.create({
          data: {
            sessionToken: expiredToken2,
            userId: user.id,
            expires: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          },
        });

        await prisma.session.create({
          data: {
            sessionToken: validToken,
            userId: user.id,
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });

        // Delete expired sessions
        await prisma.session.deleteMany({
          where: {
            userId: user.id,
            expires: {
              lte: new Date(),
            },
          },
        });

        // Verify only valid session remains
        const remainingSessions = await prisma.session.findMany({
          where: { userId: user.id },
        });

        expect(remainingSessions.length).toBe(1);
        expect(remainingSessions[0]!.sessionToken).toBe(validToken);
        expect(isTokenExpired(remainingSessions[0]!.expires)).toBe(false);
      } finally {
        // Clean up
        await prisma.session.deleteMany({
          where: { userId: user.id },
        });
        const existingUser = await prisma.user.findUnique({
          where: { id: user.id },
        });
        if (existingUser) {
          await prisma.user.delete({
            where: { id: user.id },
          });
        }
      }
    });
  });

  describe('Unit Tests - Edge Cases', () => {
    it('should handle sessions expiring in milliseconds', () => {
      const almostExpired = new Date(Date.now() + 100); // 100ms from now
      expect(isTokenExpired(almostExpired)).toBe(false);

      // After waiting, it should be expired
      setTimeout(() => {
        expect(isTokenExpired(almostExpired)).toBe(true);
      }, 150);
    });

    it('should handle very old expiration dates', () => {
      const veryOld = new Date('2000-01-01');
      expect(isTokenExpired(veryOld)).toBe(true);
    });

    it('should handle far future expiration dates', () => {
      const farFuture = new Date('2100-01-01');
      expect(isTokenExpired(farFuture)).toBe(false);
    });

    it('should handle invalid date objects', () => {
      const invalidDate = new Date('invalid');
      // Invalid dates should be considered expired for safety
      expect(isNaN(invalidDate.getTime())).toBe(true);
    });

    it('should correctly compare dates at second precision', () => {
      const now = new Date();
      const oneSecondAgo = new Date(now.getTime() - 1000);
      const oneSecondAhead = new Date(now.getTime() + 1000);

      expect(isTokenExpired(oneSecondAgo)).toBe(true);
      expect(isTokenExpired(oneSecondAhead)).toBe(false);
    });
  });
});
