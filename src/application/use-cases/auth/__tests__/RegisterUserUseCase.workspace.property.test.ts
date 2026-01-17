import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { RegisterUserUseCase } from '../RegisterUserUseCase';
import { UserRepository } from '../../../../infrastructure/repositories/UserRepository';
import { WorkspaceRepository } from '../../../../infrastructure/repositories/WorkspaceRepository';
import { VerificationTokenRepository } from '../../../../infrastructure/repositories/VerificationTokenRepository';
import { prisma } from '../../../../lib/db';

/**
 * Property-Based Tests for Default Workspace Creation
 *
 * Feature: nextjs-foundation, Property 8: Default workspace creation
 * Validates: Requirements 8.1
 *
 * Property: For any new user registration, the system should automatically create
 * exactly one default workspace named "Personal" owned by that user.
 */

describe('RegisterUserUseCase - Default Workspace Property Tests', () => {
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
    // Note: Cleanup is done within each property test iteration
    // to avoid interfering with concurrent test runs
  });

  /**
   * Feature: nextjs-foundation, Property 8: Default workspace creation
   * Validates: Requirements 8.1
   */
  it('should create exactly one default "Personal" workspace for any new user', async () => {
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
        // Generate a valid password that avoids sequential characters
        fc.integer({ min: 1000, max: 9999 }).map((n) => `Test${n}Pass!`),
        async (email, firstName, lastName, password) => {
          try {
            // Register user
            const result = await registerUserUseCase.execute({
              email,
              password,
              firstName,
              lastName,
              language: 'en-US',
            });

            // Verify workspace was created
            expect(result.workspace).toBeDefined();
            expect(result.workspace.getName()).toBe('Personal');
            expect(result.workspace.getOwnerId()).toBe(
              result.user.getId().getValue()
            );

            // Verify user's current workspace is set to the created workspace
            expect(result.user.getCurrentWorkspaceId()).toBe(
              result.workspace.getId().getValue()
            );

            // Verify exactly one workspace exists for this user
            const userWorkspaces = await workspaceRepository.findByUserId(
              result.user.getId().getValue()
            );
            expect(userWorkspaces).toHaveLength(1);
            const firstWorkspace = userWorkspaces[0];
            expect(firstWorkspace).toBeDefined();
            expect(firstWorkspace!.getName()).toBe('Personal');
            expect(firstWorkspace!.getOwnerId()).toBe(
              result.user.getId().getValue()
            );

            // Verify workspace has default settings
            expect(result.workspace.getCreditCount()).toBe(0);
            expect(result.workspace.getAllocatedCredits()).toBe(0);
            expect(result.workspace.getIsTrialed()).toBe(false);

            // Clean up for next iteration
            await prisma.verificationToken.deleteMany({
              where: { identifier: email.toLowerCase() },
            });
            await prisma.workspaceMember.deleteMany({
              where: { userId: result.user.getId().getValue() },
            });
            await prisma.workspace.deleteMany({
              where: { ownerId: result.user.getId().getValue() },
            });
            await prisma.user.deleteMany({
              where: { email: email.toLowerCase() },
            });
          } catch (error) {
            // Clean up on error - delete in order to respect foreign key constraints
            try {
              const user = await prisma.user.findUnique({
                where: { email: email.toLowerCase() },
              });
              if (user) {
                await prisma.session.deleteMany({ where: { userId: user.id } });
                await prisma.verificationToken.deleteMany({
                  where: { identifier: email.toLowerCase() },
                });
                await prisma.workspaceMember.deleteMany({
                  where: { userId: user.id },
                });
                await prisma.workspace.deleteMany({
                  where: { ownerId: user.id },
                });
                await prisma.user.deleteMany({
                  where: { email: email.toLowerCase() },
                });
              }
            } catch (cleanupError) {
              // Ignore cleanup errors
            }
            throw error;
          }
        }
      ),
      { numRuns: 3, timeout: 120000 } // Reduced runs due to bcrypt overhead in registration
    );
  }, 180000); // 180 second timeout for property test
});
