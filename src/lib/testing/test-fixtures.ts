/**
 * Test Fixtures Helper
 * Creates proper database fixtures for tests
 */

import { prisma } from '../db';
import bcrypt from 'bcrypt';

export interface TestUser {
  id: string;
  email: string;
  name: string;
  password: string;
}

export interface TestWorkspace {
  id: string;
  name: string;
  ownerId: string;
  credits: number;
}

export interface TestFixtures {
  user: TestUser;
  workspace: TestWorkspace;
  cleanup: () => Promise<void>;
}

/**
 * Create a test user and workspace with proper relationships
 */
export async function createTestFixtures(
  overrides?: Partial<{ user: Partial<TestUser>; workspace: Partial<TestWorkspace> }>
): Promise<TestFixtures> {
  const userId = crypto.randomUUID();
  const workspaceId = crypto.randomUUID();

  const hashedPassword = await bcrypt.hash('Test123!@#', 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      id: userId,
      email: overrides?.user?.email || `test-${userId}@example.com`,
      firstName: overrides?.user?.name?.split(' ')[0] || 'Test',
      lastName: overrides?.user?.name?.split(' ')[1] || 'User',
      passwordHash: hashedPassword,
      emailVerified: new Date(),
    },
  });

  // Create workspace
  const workspace = await prisma.workspace.create({
    data: {
      id: workspaceId,
      name: overrides?.workspace?.name || 'Test Workspace',
      ownerId: userId,
      creditCount: overrides?.workspace?.credits ?? 1000,
    },
  });

  const cleanup = async () => {
    // Delete in correct order to respect foreign keys
    await prisma.document.deleteMany({ where: { workspaceId } });
    await prisma.preset.deleteMany({ where: { workspaceId } });
    await prisma.workspace.deleteMany({ where: { id: workspaceId } });
    await prisma.user.deleteMany({ where: { id: userId } });
  };

  return {
    user: {
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      password: 'Test123!@#',
    },
    workspace: {
      id: workspace.id,
      name: workspace.name,
      ownerId: workspace.ownerId,
      credits: workspace.creditCount,
    },
    cleanup,
  };
}

/**
 * Create a minimal test user (without workspace)
 */
export async function createTestUser(email?: string): Promise<{ id: string; email: string; cleanup: () => Promise<void> }> {
  const userId = crypto.randomUUID();
  const hashedPassword = await bcrypt.hash('Test123!@#', 10);

  const user = await prisma.user.create({
    data: {
      id: userId,
      email: email || `test-${userId}@example.com`,
      firstName: 'Test',
      lastName: 'User',
      passwordHash: hashedPassword,
      emailVerified: new Date(),
    },
  });

  const cleanup = async () => {
    await prisma.user.deleteMany({ where: { id: userId } });
  };

  return {
    id: user.id,
    email: user.email,
    cleanup,
  };
}

/**
 * Create a test workspace for an existing user
 */
export async function createTestWorkspace(
  ownerId: string,
  name?: string
): Promise<{ id: string; name: string; cleanup: () => Promise<void> }> {
  const workspaceId = crypto.randomUUID();

  const workspace = await prisma.workspace.create({
    data: {
      id: workspaceId,
      name: name || 'Test Workspace',
      ownerId,
      creditCount: 1000,
    },
  });

  const cleanup = async () => {
    await prisma.workspace.deleteMany({ where: { id: workspaceId } });
  };

  return {
    id: workspace.id,
    name: workspace.name,
    cleanup,
  };
}
