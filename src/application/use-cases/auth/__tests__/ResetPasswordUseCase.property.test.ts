import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { prisma } from '../../../../lib/db';
import { ResetPasswordUseCase } from '../ResetPasswordUseCase';
import { UserRepository } from '../../../../infrastructure/repositories/UserRepository';
import { VerificationTokenRepository } from '../../../../infrastructure/repositories/VerificationTokenRepository';
import { SessionRepository } from '../../../../infrastructure/repositories/SessionRepository';
import type { ResetPasswordCommand } from '../../../commands/auth/ResetPasswordCommand';
import {
  generatePasswordResetToken,
  generateSessionToken,
} from '../../../../lib/auth/tokens';

/**
 * Feature: nextjs-foundation, Property 12: Password reset invalidates sessions
 * Validates: Requirements 5.5
 */

describe('ResetPasswordUseCase - Session Invalidation', () => {
  let userRepository: UserRepository;
  let verificationTokenRepository: VerificationTokenRepository;
  let sessionRepository: SessionRepository;
  let resetPasswordUseCase: ResetPasswordUseCase;

  beforeEach(() => {
    userRepository = new UserRepository();
    verificationTokenRepository = new VerificationTokenRepository();
    sessionRepository = new SessionRepository();
    resetPasswordUseCase = new ResetPasswordUseCase(
      userRepository,
      verificationTokenRepository,
      sessionRepository
    );
  });

  // Clean up test data after each test
  afterEach(async () => {
    await prisma.session.deleteMany({
      where: {
        user: {
          email: {
            startsWith: 'test-reset-',
          },
        },
      },
    });
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: {
          startsWith: 'test-reset-',
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          startsWith: 'test-reset-',
        },
      },
    });
  });

  describe('Property-Based Tests', () => {
    it('should invalidate all user sessions when password is reset', async () => {
      /**
       * Property 12: Password reset invalidates sessions
       * For any successful password reset, all existing sessions for that user should be invalidated
       */
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10 }), // Number of sessions to create
          async (sessionCount) => {
            // Generate a valid password that meets requirements
            const newPassword = `Test${sessionCount}Pass!`;
            // Create a test user
            const email = `test-reset-${Date.now()}-${Math.random()}@example.com`;
            const user = await prisma.user.create({
              data: {
                email,
                passwordHash: 'old-hash',
                firstName: 'Test',
                lastName: 'User',
              },
            });

            try {
              // Create multiple sessions for the user
              const sessionTokens: string[] = [];
              for (let i = 0; i < sessionCount; i++) {
                const token = generateSessionToken();
                sessionTokens.push(token);

                await prisma.session.create({
                  data: {
                    sessionToken: token,
                    userId: user.id,
                    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                  },
                });
              }

              // Verify all sessions exist
              const sessionsBeforeReset = await prisma.session.findMany({
                where: { userId: user.id },
              });
              expect(sessionsBeforeReset.length).toBe(sessionCount);

              // Create a password reset token
              const { token, expires } = generatePasswordResetToken();
              await prisma.verificationToken.create({
                data: {
                  identifier: email,
                  token,
                  expires,
                  type: 'PASSWORD_RESET',
                },
              });

              // Reset password
              const command: ResetPasswordCommand = { token, newPassword };
              await resetPasswordUseCase.execute(command);

              // Verify all sessions have been invalidated
              const sessionsAfterReset = await prisma.session.findMany({
                where: { userId: user.id },
              });

              // All sessions should be deleted
              expect(sessionsAfterReset.length).toBe(0);

              // Verify each specific session token no longer exists
              for (const sessionToken of sessionTokens) {
                const session = await prisma.session.findUnique({
                  where: { sessionToken },
                });
                expect(session).toBeNull();
              }
            } finally {
              // Clean up - delete in order to respect foreign key constraints
              await prisma.session.deleteMany({
                where: { userId: user.id },
              });
              await prisma.verificationToken.deleteMany({
                where: { identifier: email },
              });
              await prisma.workspace.deleteMany({
                where: { ownerId: user.id },
              });
              await prisma.user.deleteMany({
                where: { id: user.id },
              });
            }
          }
        ),
        { numRuns: 5 } // Reduced for performance with database operations
      );
    }, 60000); // 60 second timeout for property test with database operations
  });
});
