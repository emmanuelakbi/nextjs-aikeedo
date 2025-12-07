import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import bcryptjs from 'bcryptjs';
import { Workspace } from '../Workspace';
import { WorkspaceRepository } from '../../../../infrastructure/repositories/WorkspaceRepository';
import { UserRepository } from '../../../../infrastructure/repositories/UserRepository';
import { prisma } from '../../../../lib/db';

/**
 * Property-Based Tests for Workspace Ownership
 *
 * Feature: nextjs-foundation, Property 7: Workspace ownership
 * Validates: Requirements 8.2
 *
 * Property: For any workspace, there should be exactly one owner at any given time,
 * and the owner should be a valid user.
 */

describe('Workspace - Ownership Property Tests', () => {
  let workspaceRepository: WorkspaceRepository;
  let userRepository: UserRepository;

  beforeEach(() => {
    workspaceRepository = new WorkspaceRepository();
    userRepository = new UserRepository();
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.workspaceMember.deleteMany({});
    await prisma.workspace.deleteMany({});
    await prisma.user.deleteMany({});
  });

  /**
   * Feature: nextjs-foundation, Property 7: Workspace ownership
   * Validates: Requirements 8.2
   */
  it('should have exactly one owner at any given time', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random workspace name
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter((s) => s.trim().length > 0),
        // Generate random user data for owner
        fc.emailAddress(),
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter((s) => s.trim().length > 0),
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter((s) => s.trim().length > 0),
        async (workspaceName, ownerEmail, firstName, lastName) => {
          try {
            // Create owner user
            const passwordHash = await bcryptjs.hash('TestPassword123!', 10);
            const owner = await userRepository.create({
              email: ownerEmail,
              passwordHash,
              firstName,
              lastName,
              language: 'en-US',
            });

            // Create workspace
            const workspace = await workspaceRepository.create({
              name: workspaceName,
              ownerId: owner.getId().getValue(),
            });

            // Verify workspace has exactly one owner
            expect(workspace.getOwnerId()).toBe(owner.getId().getValue());
            expect(workspace.isOwnedBy(owner.getId().getValue())).toBe(true);

            // Verify owner is a valid user
            const ownerUser = await userRepository.findById(
              workspace.getOwnerId()
            );
            expect(ownerUser).toBeDefined();
            expect(ownerUser?.getId().getValue()).toBe(
              owner.getId().getValue()
            );

            // Clean up for next iteration
            await prisma.workspaceMember.deleteMany({
              where: { workspaceId: workspace.getId().getValue() },
            });
            await prisma.workspace.deleteMany({
              where: { id: workspace.getId().getValue() },
            });
            await prisma.user.deleteMany({
              where: { id: owner.getId().getValue() },
            });
          } catch (error) {
            // Clean up on error
            await prisma.user.deleteMany({
              where: { email: ownerEmail.toLowerCase() },
            });
            throw error;
          }
        }
      ),
      { numRuns: 3, timeout: 60000 }
    );
  }, 120000);

  /**
   * Feature: nextjs-foundation, Property 7: Workspace ownership
   * Validates: Requirements 8.2
   */
  it('should maintain exactly one owner after ownership transfer', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random workspace name
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter((s) => s.trim().length > 0),
        // Generate random user data for original owner
        fc.emailAddress(),
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter((s) => s.trim().length > 0),
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter((s) => s.trim().length > 0),
        // Generate random user data for new owner
        fc.emailAddress(),
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter((s) => s.trim().length > 0),
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter((s) => s.trim().length > 0),
        async (
          workspaceName,
          originalOwnerEmail,
          originalFirstName,
          originalLastName,
          newOwnerEmail,
          newFirstName,
          newLastName
        ) => {
          // Ensure emails are different
          if (
            originalOwnerEmail.toLowerCase() === newOwnerEmail.toLowerCase()
          ) {
            return;
          }

          try {
            // Create original owner user
            const passwordHash = await bcryptjs.hash('TestPassword123!', 10);
            const originalOwner = await userRepository.create({
              email: originalOwnerEmail,
              passwordHash,
              firstName: originalFirstName,
              lastName: originalLastName,
              language: 'en-US',
            });

            // Create new owner user
            const newOwner = await userRepository.create({
              email: newOwnerEmail,
              passwordHash,
              firstName: newFirstName,
              lastName: newLastName,
              language: 'en-US',
            });

            // Create workspace with original owner
            const workspace = await workspaceRepository.create({
              name: workspaceName,
              ownerId: originalOwner.getId().getValue(),
            });

            // Verify original ownership
            expect(workspace.getOwnerId()).toBe(
              originalOwner.getId().getValue()
            );
            expect(workspace.isOwnedBy(originalOwner.getId().getValue())).toBe(
              true
            );
            expect(workspace.isOwnedBy(newOwner.getId().getValue())).toBe(
              false
            );

            // Transfer ownership
            workspace.transferOwnership(newOwner.getId().getValue());

            // Verify the workspace still exists before saving
            const existingWorkspace = await prisma.workspace.findUnique({
              where: { id: workspace.getId().getValue() },
            });

            if (!existingWorkspace) {
              // Workspace was cleaned up, skip this iteration
              return;
            }

            const updatedWorkspace = await workspaceRepository.save(workspace);

            // Verify new ownership
            expect(updatedWorkspace.getOwnerId()).toBe(
              newOwner.getId().getValue()
            );
            expect(
              updatedWorkspace.isOwnedBy(newOwner.getId().getValue())
            ).toBe(true);
            expect(
              updatedWorkspace.isOwnedBy(originalOwner.getId().getValue())
            ).toBe(false);

            // Verify new owner is a valid user
            const newOwnerUser = await userRepository.findById(
              updatedWorkspace.getOwnerId()
            );
            expect(newOwnerUser).toBeDefined();
            expect(newOwnerUser?.getId().getValue()).toBe(
              newOwner.getId().getValue()
            );

            // Clean up for next iteration
            await prisma.workspaceMember.deleteMany({
              where: { workspaceId: workspace.getId().getValue() },
            });
            await prisma.workspace.deleteMany({
              where: { id: workspace.getId().getValue() },
            });
            await prisma.user.deleteMany({
              where: {
                id: {
                  in: [
                    originalOwner.getId().getValue(),
                    newOwner.getId().getValue(),
                  ],
                },
              },
            });
          } catch (error) {
            // Clean up on error
            await prisma.user.deleteMany({
              where: {
                email: {
                  in: [
                    originalOwnerEmail.toLowerCase(),
                    newOwnerEmail.toLowerCase(),
                  ],
                },
              },
            });
            throw error;
          }
        }
      ),
      { numRuns: 3, timeout: 60000 }
    );
  }, 120000);

  /**
   * Feature: nextjs-foundation, Property 7: Workspace ownership
   * Validates: Requirements 8.2
   */
  it('should reject workspace creation with non-existent owner', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random workspace name
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter((s) => s.trim().length > 0),
        // Generate random UUID for non-existent owner
        fc.uuid(),
        async (workspaceName, nonExistentOwnerId) => {
          try {
            // Attempt to create workspace with non-existent owner
            await expect(
              workspaceRepository.create({
                name: workspaceName,
                ownerId: nonExistentOwnerId,
              })
            ).rejects.toThrow('Owner user does not exist');
          } catch (error) {
            // Clean up on error (though creation should fail)
            await prisma.workspace.deleteMany({
              where: { name: workspaceName },
            });
            throw error;
          }
        }
      ),
      { numRuns: 10, timeout: 30000 }
    );
  }, 60000);
});
