import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { RegisterUserUseCase } from '../RegisterUserUseCase';
import { UserRepository } from '../../../../infrastructure/repositories/UserRepository';
import { WorkspaceRepository } from '../../../../infrastructure/repositories/WorkspaceRepository';
import { VerificationTokenRepository } from '../../../../infrastructure/repositories/VerificationTokenRepository';
import { prisma } from '../../../../lib/db';

/**
 * Property-Based Tests for RegisterUserUseCase
 *
 * Feature: nextjs-foundation, Property 2: Email uniqueness
 * Validates: Requirements 3.1
 *
 * Property: For any two user registration attempts with the same email address,
 * only the first should succeed and the second should fail with a unique constraint error.
 */

describe('RegisterUserUseCase - Property Tests', () => {
  let registerUserUseCase: RegisterUserUseCase;
  let userRepository: UserRepository;
  let workspaceRepository: WorkspaceRepository;
  let verificationTokenRepository: VerificationTokenRepository;

  beforeEach(() => {
    userRepository = new UserRepository();
    workspaceRepository = new WorkspaceRepository();
    verificationTokenRepository = new VerificationTokenRepository();
    registerUserUseCase = new RegisterUserUseCase(
      userRepository,
      workspaceRepository,
      verificationTokenRepository
    );
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.verificationToken.deleteMany({});
    await prisma.workspaceMember.deleteMany({});
    await prisma.workspace.deleteMany({});
    await prisma.user.deleteMany({});
  });

  /**
   * Feature: nextjs-foundation, Property 2: Email uniqueness
   * Validates: Requirements 3.1
   */
  it('should enforce email uniqueness - only first registration succeeds', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random valid email
        fc.emailAddress(),
        // Generate random user data
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter((s) => s.trim().length > 0),
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter((s) => s.trim().length > 0),
        fc.string({ minLength: 8, maxLength: 20 }).map((s) => s + 'Aa1!'), // Ensure password meets requirements
        async (email, firstName, lastName, password) => {
          try {
            // First registration should succeed
            const firstResult = await registerUserUseCase.execute({
              email,
              password,
              firstName,
              lastName,
              language: 'en-US',
            });

            expect(firstResult.user).toBeDefined();
            expect(firstResult.user.getEmail().getValue()).toBe(
              email.toLowerCase()
            );

            // Second registration with same email should fail
            await expect(
              registerUserUseCase.execute({
                email,
                password: password + 'Different',
                firstName: 'Different',
                lastName: 'Name',
                language: 'en-US',
              })
            ).rejects.toThrow('A user with this email already exists');

            // Clean up for next iteration
            await prisma.verificationToken.deleteMany({
              where: { identifier: email.toLowerCase() },
            });
            await prisma.workspaceMember.deleteMany({
              where: { userId: firstResult.user.getId().getValue() },
            });
            await prisma.workspace.deleteMany({
              where: { ownerId: firstResult.user.getId().getValue() },
            });
            await prisma.user.deleteMany({
              where: { email: email.toLowerCase() },
            });
          } catch (error) {
            // Clean up on error
            await prisma.verificationToken.deleteMany({
              where: { identifier: email.toLowerCase() },
            });
            await prisma.user.deleteMany({
              where: { email: email.toLowerCase() },
            });
            throw error;
          }
        }
      ),
      { numRuns: 3 } // Reduced for performance with database operations
    );
  }, 180000); // 180 second timeout for property test
});
