/**
 * Workspace Factory for Testing
 *
 * Provides utilities to create test workspaces with various configurations.
 * Used in tests and development seeding.
 *
 * Requirements: 2.5
 */

import { PrismaClient } from '@prisma/client';

export interface CreateWorkspaceOptions {
  name?: string;
  ownerId?: string;
  creditCount?: number;
  allocatedCredits?: number;
  isTrialed?: boolean;
}

export class WorkspaceFactory {
  private prisma: PrismaClient;
  private counter = 0;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Create a workspace with default or custom attributes
   */
  async create(options: CreateWorkspaceOptions = {}) {
    this.counter++;

    // If no ownerId provided, create a test user
    let ownerId = options.ownerId;
    if (!ownerId) {
      const user = await this.prisma.user.create({
        data: {
          email: `workspace-owner${this.counter}@test.com`,
          passwordHash: 'dummy-hash',
          firstName: 'Owner',
          lastName: `${this.counter}`,
          emailVerified: new Date(),
        },
      });
      ownerId = user.id;
    }

    const workspace = await this.prisma.workspace.create({
      data: {
        name: options.name || `Workspace ${this.counter}`,
        ownerId,
        creditCount: options.creditCount ?? 100,
        allocatedCredits: options.allocatedCredits ?? 0,
        isTrialed: options.isTrialed ?? false,
      },
    });

    return workspace;
  }

  /**
   * Create a workspace with credits
   */
  async createWithCredits(
    credits: number,
    options: CreateWorkspaceOptions = {}
  ) {
    return this.create({
      ...options,
      creditCount: credits,
    });
  }

  /**
   * Create a trialed workspace
   */
  async createTrialed(options: CreateWorkspaceOptions = {}) {
    return this.create({
      ...options,
      isTrialed: true,
    });
  }

  /**
   * Create a workspace with members
   */
  async createWithMembers(
    memberCount: number,
    options: CreateWorkspaceOptions = {}
  ) {
    const workspace = await this.create(options);

    const members = [];
    for (let i = 0; i < memberCount; i++) {
      const user = await this.prisma.user.create({
        data: {
          email: `member${this.counter}-${i}@test.com`,
          passwordHash: 'dummy-hash',
          firstName: `Member${i}`,
          lastName: 'Test',
          emailVerified: new Date(),
        },
      });

      await this.prisma.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: user.id,
          role: 'MEMBER',
        },
      });

      members.push(user);
    }

    return { workspace, members };
  }

  /**
   * Create multiple workspaces
   */
  async createMany(count: number, options: CreateWorkspaceOptions = {}) {
    const workspaces = [];
    for (let i = 0; i < count; i++) {
      workspaces.push(await this.create(options));
    }
    return workspaces;
  }

  /**
   * Create a workspace for a specific user
   */
  async createForUser(userId: string, options: CreateWorkspaceOptions = {}) {
    return this.create({
      ...options,
      ownerId: userId,
    });
  }

  /**
   * Reset the counter (useful for predictable test data)
   */
  resetCounter() {
    this.counter = 0;
  }
}
