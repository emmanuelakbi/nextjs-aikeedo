/**
 * Factory Tests
 *
 * Tests for user and workspace factories.
 *
 * Requirements: 2.5
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/db';
import { UserFactory } from '../factories/user-factory';
import { WorkspaceFactory } from '../factories/workspace-factory';
import { cleanupTestData } from '../test-helpers';

describe('UserFactory', () => {
  const factory = new UserFactory(prisma);

  beforeEach(async () => {
    await cleanupTestData(prisma);
    factory.resetCounter();
  });

  it('should create a basic user', async () => {
    const { user, password } = await factory.create();

    expect(user.id).toBeDefined();
    expect(user.email).toMatch(/user\d+@test\.com/);
    expect(user.firstName).toBeDefined();
    expect(user.lastName).toBe('Test');
    expect(password).toBe('password123');
  });

  it('should create a verified user', async () => {
    const { user } = await factory.createVerified();

    expect(user.emailVerified).toBeDefined();
    expect(user.emailVerified).toBeInstanceOf(Date);
  });

  it('should create an unverified user', async () => {
    const { user } = await factory.createUnverified();

    expect(user.emailVerified).toBeNull();
  });

  it('should create an admin user', async () => {
    const { user } = await factory.createAdmin();

    expect(user.role).toBe('ADMIN');
    expect(user.emailVerified).toBeDefined();
  });

  it('should create a user with custom attributes', async () => {
    const { user } = await factory.create({
      email: 'custom@test.com',
      firstName: 'Custom',
      lastName: 'User',
    });

    expect(user.email).toBe('custom@test.com');
    expect(user.firstName).toBe('Custom');
    expect(user.lastName).toBe('User');
  });

  it('should create a user with workspace', async () => {
    const { user, workspace, password } = await factory.createWithWorkspace();

    expect(user.id).toBeDefined();
    expect(workspace.id).toBeDefined();
    expect(workspace.ownerId).toBe(user.id);
    expect(workspace.name).toBe('Personal');
    expect(user.currentWorkspaceId).toBe(workspace.id);
    expect(password).toBe('password123');
  });

  it('should create multiple users', async () => {
    const users = await factory.createMany(3);

    expect(users).toHaveLength(3);
    expect(users[0]!.user.email).not.toBe(users[1]!.user.email);
  });
});

describe('WorkspaceFactory', () => {
  const factory = new WorkspaceFactory(prisma);

  beforeEach(async () => {
    await cleanupTestData(prisma);
    factory.resetCounter();
  });

  it('should create a basic workspace', async () => {
    const workspace = await factory.create();

    expect(workspace.id).toBeDefined();
    expect(workspace.name).toMatch(/Workspace \d+/);
    expect(workspace.ownerId).toBeDefined();
    expect(workspace.creditCount).toBe(100);
  });

  it('should create a workspace with credits', async () => {
    const workspace = await factory.createWithCredits(500);

    expect(workspace.creditCount).toBe(500);
  });

  it('should create a trialed workspace', async () => {
    const workspace = await factory.createTrialed();

    expect(workspace.isTrialed).toBe(true);
  });

  it('should create a workspace with custom attributes', async () => {
    const workspace = await factory.create({
      name: 'Custom Workspace',
      creditCount: 1000,
      allocatedCredits: 100,
    });

    expect(workspace.name).toBe('Custom Workspace');
    expect(workspace.creditCount).toBe(1000);
    expect(workspace.allocatedCredits).toBe(100);
  });

  it('should create a workspace with members', async () => {
    const { workspace, members } = await factory.createWithMembers(3);

    expect(workspace.id).toBeDefined();
    expect(members).toHaveLength(3);

    // Verify members are in the workspace
    const workspaceMembers = await prisma.workspaceMember.findMany({
      where: { workspaceId: workspace.id },
    });
    expect(workspaceMembers).toHaveLength(3);
  });

  it('should create multiple workspaces', async () => {
    const workspaces = await factory.createMany(3);

    expect(workspaces).toHaveLength(3);
    expect(workspaces[0]!.id).not.toBe(workspaces[1]!.id);
  });
});
