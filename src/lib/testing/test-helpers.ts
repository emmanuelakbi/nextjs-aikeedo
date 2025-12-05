/**
 * Test Helpers
 *
 * Utility functions for testing across the application
 */

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

/**
 * Create a test user in the database
 */
export async function createTestUser(
  prisma: PrismaClient,
  overrides: {
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    emailVerified?: Date | null;
  } = {}
) {
  const email = overrides.email || `test-${Date.now()}@example.com`;
  const password = overrides.password || 'TestPassword123!';
  const passwordHash = await hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName: overrides.firstName || 'Test',
      lastName: overrides.lastName || 'User',
      emailVerified: overrides.emailVerified || null,
      language: 'en',
      role: 'USER',
      status: 'ACTIVE',
    },
  });

  return { user, password };
}

/**
 * Create a test workspace in the database
 */
export async function createTestWorkspace(
  prisma: PrismaClient,
  ownerId: string,
  overrides: {
    name?: string;
    creditCount?: number;
  } = {}
) {
  return await prisma.workspace.create({
    data: {
      name: overrides.name || `Test Workspace ${Date.now()}`,
      ownerId,
      creditCount: overrides.creditCount || 0,
      allocatedCredits: 0,
      isTrialed: false,
    },
  });
}

/**
 * Create a test session in the database
 */
export async function createTestSession(
  prisma: PrismaClient,
  userId: string,
  overrides: {
    sessionToken?: string;
    expires?: Date;
  } = {}
) {
  const sessionToken =
    overrides.sessionToken || `test-session-${Date.now()}-${Math.random()}`;
  const expires =
    overrides.expires || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  return await prisma.session.create({
    data: {
      sessionToken,
      userId,
      expires,
    },
  });
}

/**
 * Create a test verification token in the database
 */
export async function createTestVerificationToken(
  prisma: PrismaClient,
  identifier: string,
  overrides: {
    token?: string;
    expires?: Date;
    type?: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';
  } = {}
) {
  const token = overrides.token || `test-token-${Date.now()}-${Math.random()}`;
  const expires =
    overrides.expires || new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  return await prisma.verificationToken.create({
    data: {
      identifier,
      token,
      expires,
      type: overrides.type || 'EMAIL_VERIFICATION',
    },
  });
}

/**
 * Clean up test data from the database
 */
export async function cleanupTestData(prisma: PrismaClient) {
  // Delete in order to respect foreign key constraints
  await prisma.session.deleteMany({});
  await prisma.verificationToken.deleteMany({});
  await prisma.workspace.deleteMany({});
  await prisma.user.deleteMany({});
}

/**
 * Clean up a specific user and all their dependent records
 */
export async function cleanupTestUser(prisma: PrismaClient, userId: string) {
  try {
    // Delete in order to respect foreign key constraints
    await prisma.session.deleteMany({ where: { userId } });
    await prisma.verificationToken.deleteMany({
      where: { identifier: { contains: userId } },
    });
    await prisma.workspaceMember.deleteMany({ where: { userId } });
    await prisma.workspace.deleteMany({ where: { ownerId: userId } });
    await prisma.user.delete({ where: { id: userId } });
  } catch (error) {
    // Ignore errors if user doesn't exist
    console.error(`Error cleaning up user ${userId}:`, error);
  }
}

/**
 * Create a test user with workspace (complete setup)
 */
export async function createTestUserWithWorkspace(
  prisma: PrismaClient,
  overrides: {
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    workspaceName?: string;
  } = {}
) {
  const email =
    overrides.email || `test-${Date.now()}-${Math.random()}@example.com`;
  const password = overrides.password || 'TestPassword123!';
  const passwordHash = await hash(password, 12);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName: overrides.firstName || 'Test',
      lastName: overrides.lastName || 'User',
      emailVerified: null,
      language: 'en',
      role: 'USER',
      status: 'ACTIVE',
    },
  });

  // Create workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: overrides.workspaceName || 'Personal',
      ownerId: user.id,
      creditCount: 0,
      allocatedCredits: 0,
      isTrialed: false,
    },
  });

  // Update user with workspace
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { currentWorkspaceId: workspace.id },
  });

  return { user: updatedUser, workspace, password };
}

/**
 * Generate a random email address for testing
 */
export function randomEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
}

/**
 * Generate a random string for testing
 */
export function randomString(length: number = 10): string {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length);
}

/**
 * Wait for a specified amount of time (useful for testing time-based features)
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
