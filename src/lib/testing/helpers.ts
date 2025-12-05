/**
 * Testing Helpers
 *
 * Utility functions for testing and development.
 *
 * Requirements: 2.5
 */

import { PrismaClient } from '@prisma/client';
import { UserFactory } from './factories/user-factory';
import { WorkspaceFactory } from './factories/workspace-factory';

/**
 * Create factory instances for testing
 */
export function createFactories(prisma: PrismaClient) {
  return {
    user: new UserFactory(prisma),
    workspace: new WorkspaceFactory(prisma),
  };
}

/**
 * Clean up test data from database
 */
export async function cleanupTestData(prisma: PrismaClient) {
  // Delete in correct order to respect foreign key constraints
  await prisma.session.deleteMany({});
  await prisma.verificationToken.deleteMany({});
  await prisma.workspaceMember.deleteMany({});
  await prisma.workspace.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.user.deleteMany({});
}

/**
 * Reset database to clean state
 */
export async function resetDatabase(prisma: PrismaClient) {
  await cleanupTestData(prisma);
}

/**
 * Create a complete test scenario with users and workspaces
 */
export async function createTestScenario(prisma: PrismaClient) {
  const factories = createFactories(prisma);

  // Create admin user with workspace
  const admin = await factories.user.createWithWorkspace(
    {
      email: 'admin@test.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
    },
    {
      name: 'Admin Workspace',
      creditCount: 1000,
    }
  );

  // Create regular user with workspace
  const user = await factories.user.createWithWorkspace(
    {
      email: 'user@test.com',
      firstName: 'Test',
      lastName: 'User',
    },
    {
      name: 'Personal',
      creditCount: 100,
    }
  );

  // Create unverified user
  const unverified = await factories.user.createUnverified({
    email: 'unverified@test.com',
    firstName: 'Unverified',
    lastName: 'User',
  });

  // Create shared workspace
  const sharedWorkspace = await factories.workspace.create({
    name: 'Team Workspace',
    ownerId: admin.user.id,
    creditCount: 500,
  });

  // Add user as member of shared workspace
  await prisma.workspaceMember.create({
    data: {
      workspaceId: sharedWorkspace.id,
      userId: user.user.id,
      role: 'MEMBER',
    },
  });

  return {
    admin,
    user,
    unverified,
    sharedWorkspace,
  };
}
