import { describe, it, expect, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { prisma } from '../../db';
import { generateSessionToken } from '../tokens';

/**
 * Feature: nextjs-foundation, Property 3: Session token uniqueness
 * Validates: Requirements 6.1
 */

describe('Session Token Generation', () => {
  // Clean up test data after each test
  afterEach(async () => {
    await prisma.session.deleteMany({
      where: {
        sessionToken: {
          startsWith: 'test-',
        },
      },
    });
  });

  describe('Property-Based Tests', () => {
    it('should generate unique session tokens across multiple invocations', () => {
      /**
       * Property 3: Session token uniqueness
       * For any two session creation attempts, each should generate a unique
       * session token that does not collide with existing tokens
       */
      fc.assert(
        fc.property(fc.integer({ min: 2, max: 100 }), (count) => {
          const tokens = new Set<string>();

          // Generate multiple tokens
          for (let i = 0; i < count; i++) {
            const token = generateSessionToken();

            // Each token should be unique
            expect(tokens.has(token)).toBe(false);
            tokens.add(token);
          }

          // Verify all tokens are unique
          expect(tokens.size).toBe(count);
        }),
        { numRuns: 10 }
      );
    });

    it('should generate tokens with sufficient entropy', () => {
      /**
       * Property: Session tokens should have sufficient length and randomness
       * For any generated token, it should be at least 32 characters (hex encoded)
       */
      fc.assert(
        fc.property(fc.constant(null), () => {
          const token = generateSessionToken();

          // Token should be at least 64 characters (32 bytes in hex)
          expect(token.length).toBeGreaterThanOrEqual(64);

          // Token should only contain hex characters
          expect(/^[0-9a-f]+$/.test(token)).toBe(true);
        }),
        { numRuns: 10 }
      );
    });

    it('should not generate predictable sequences', () => {
      /**
       * Property: Sequential token generation should not produce predictable patterns
       * For any sequence of tokens, they should not follow a predictable pattern
       */
      fc.assert(
        fc.property(fc.integer({ min: 10, max: 50 }), (count) => {
          const tokens: string[] = [];

          // Generate sequence of tokens
          for (let i = 0; i < count; i++) {
            tokens.push(generateSessionToken());
          }

          // Check that no two consecutive tokens are similar
          for (let i = 0; i < tokens.length - 1; i++) {
            const token1 = tokens[i];
            const token2 = tokens[i + 1];

            // Tokens should be completely different
            expect(token1).not.toBe(token2);

            // Calculate Hamming distance (should be high for random tokens)
            let differences = 0;
            const minLength = Math.min(token1.length, token2.length);
            for (let j = 0; j < minLength; j++) {
              if (token1[j] !== token2[j]) {
                differences++;
              }
            }

            // At least 50% of characters should be different
            expect(differences / minLength).toBeGreaterThan(0.5);
          }
        }),
        { numRuns: 10 }
      );
    });
  });

  describe('Database Uniqueness Tests', () => {
    it('should create sessions with unique tokens in database', async () => {
      /**
       * Property 3: Session token uniqueness (database level)
       * For any sessions created in the database, each should have a unique token
       */

      // Create a test user first with workspace
      const email = `test-${Date.now()}@example.com`;
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash: 'test-hash',
          firstName: 'Test',
          lastName: 'User',
        },
      });

      // Create workspace for user
      const workspace = await prisma.workspace.create({
        data: {
          name: 'Test Workspace',
          ownerId: user.id,
          creditCount: 0,
          allocatedCredits: 0,
          isTrialed: false,
        },
      });

      // Update user with workspace
      await prisma.user.update({
        where: { id: user.id },
        data: { currentWorkspaceId: workspace.id },
      });

      try {
        const sessionTokens = new Set<string>();
        const sessionCount = 10;

        // Create multiple sessions
        for (let i = 0; i < sessionCount; i++) {
          const token = generateSessionToken();
          sessionTokens.add(token);

          const session = await prisma.session.create({
            data: {
              sessionToken: token,
              userId: user.id,
              expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            },
          });

          expect(session.sessionToken).toBe(token);
        }

        // Verify all tokens are unique
        expect(sessionTokens.size).toBe(sessionCount);

        // Verify all sessions exist in database
        const sessions = await prisma.session.findMany({
          where: { userId: user.id },
        });

        expect(sessions.length).toBe(sessionCount);

        // Verify no duplicate tokens in database
        const dbTokens = sessions.map((s) => s.sessionToken);
        const uniqueDbTokens = new Set(dbTokens);
        expect(uniqueDbTokens.size).toBe(sessionCount);
      } finally {
        // Clean up - delete in order to respect foreign key constraints
        await prisma.session.deleteMany({
          where: { userId: user.id },
        });
        await prisma.workspace.deleteMany({
          where: { ownerId: user.id },
        });
        await prisma.user.deleteMany({
          where: { id: user.id },
        });
      }
    });

    it('should reject duplicate session tokens at database level', async () => {
      /**
       * Property: Database should enforce session token uniqueness constraint
       * For any attempt to create a session with an existing token, it should fail
       */

      // Create a test user with workspace
      const email = `test-${Date.now()}@example.com`;
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash: 'test-hash',
          firstName: 'Test',
          lastName: 'User',
        },
      });

      // Create workspace for user
      const workspace = await prisma.workspace.create({
        data: {
          name: 'Test Workspace',
          ownerId: user.id,
          creditCount: 0,
          allocatedCredits: 0,
          isTrialed: false,
        },
      });

      // Update user with workspace
      await prisma.user.update({
        where: { id: user.id },
        data: { currentWorkspaceId: workspace.id },
      });

      try {
        const token = generateSessionToken();

        // Create first session
        await prisma.session.create({
          data: {
            sessionToken: token,
            userId: user.id,
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });

        // Attempt to create second session with same token should fail
        await expect(
          prisma.session.create({
            data: {
              sessionToken: token, // Same token
              userId: user.id,
              expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          })
        ).rejects.toThrow();
      } finally {
        // Clean up - delete in order to respect foreign key constraints
        await prisma.session.deleteMany({
          where: { userId: user.id },
        });
        await prisma.workspace.deleteMany({
          where: { ownerId: user.id },
        });
        await prisma.user.deleteMany({
          where: { id: user.id },
        });
      }
    });
  });

  describe('Unit Tests - Edge Cases', () => {
    it('should generate non-empty tokens', () => {
      const token = generateSessionToken();
      expect(token).toBeTruthy();
      expect(token.length).toBeGreaterThan(0);
    });

    it('should generate tokens with consistent format', () => {
      const tokens = Array.from({ length: 10 }, () => generateSessionToken());

      tokens.forEach((token) => {
        // All tokens should be hex strings
        expect(/^[0-9a-f]+$/.test(token)).toBe(true);
        // All tokens should have same length
        expect(token.length).toBe(64); // 32 bytes = 64 hex chars
      });
    });

    it('should generate cryptographically random tokens', () => {
      // Generate many tokens and check distribution
      const tokens = Array.from({ length: 1000 }, () => generateSessionToken());
      const uniqueTokens = new Set(tokens);

      // All tokens should be unique (no collisions in 1000 attempts)
      expect(uniqueTokens.size).toBe(1000);
    });
  });
});
