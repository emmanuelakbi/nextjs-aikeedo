/**
 * User Factory for Testing
 *
 * Provides utilities to create test users with various configurations.
 * Used in tests and development seeding.
 *
 * Requirements: 2.5
 */

import { PrismaClient } from '@prisma/client';
import { UserRole, UserStatus } from '@/domain/user';
import * as bcryptjs from 'bcryptjs';

export interface CreateUserOptions {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string | null;
  language?: string;
  role?: UserRole;
  status?: UserStatus;
  emailVerified?: boolean;
  apiKey?: string | null;
}

export class UserFactory {
  private prisma: PrismaClient;
  private counter = 0;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Create a user with default or custom attributes
   */
  async create(options: CreateUserOptions = {}) {
    this.counter++;

    const email = options.email || `user${this.counter}@test.com`;
    const password = options.password || 'password123';
    const passwordHash = await bcryptjs.hash(password, 12);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: options.firstName || `User${this.counter}`,
        lastName: options.lastName || 'Test',
        phoneNumber: options.phoneNumber,
        language: options.language || 'en-US',
        role: options.role || 'USER',
        status: options.status || 'ACTIVE',
        emailVerified: options.emailVerified ? new Date() : null,
        apiKey: options.apiKey,
      },
    });

    return { user, password };
  }

  /**
   * Create a verified user
   */
  async createVerified(options: CreateUserOptions = {}) {
    return this.create({
      ...options,
      emailVerified: true,
    });
  }

  /**
   * Create an unverified user
   */
  async createUnverified(options: CreateUserOptions = {}) {
    return this.create({
      ...options,
      emailVerified: false,
    });
  }

  /**
   * Create an admin user
   */
  async createAdmin(options: CreateUserOptions = {}) {
    return this.create({
      ...options,
      role: UserRole.ADMIN,
      emailVerified: true,
    });
  }

  /**
   * Create a suspended user
   */
  async createSuspended(options: CreateUserOptions = {}) {
    return this.create({
      ...options,
      status: UserStatus.SUSPENDED,
    });
  }

  /**
   * Create multiple users
   */
  async createMany(count: number, options: CreateUserOptions = {}) {
    const results = await Promise.all(
      Array.from({ length: count }, () => this.create(options))
    );
    return results;
  }

  /**
   * Create a user with a workspace
   */
  async createWithWorkspace(
    userOptions: CreateUserOptions = {},
    workspaceOptions: { name?: string; creditCount?: number } = {}
  ) {
    const { user: createdUser, password } = await this.create(userOptions);

    const workspace = await this.prisma.workspace.create({
      data: {
        name: workspaceOptions.name || 'Personal',
        ownerId: createdUser.id,
        creditCount: workspaceOptions.creditCount ?? 100,
        allocatedCredits: 0,
        isTrialed: false,
      },
    });

    // Update user's current workspace and refetch
    const user = await this.prisma.user.update({
      where: { id: createdUser.id },
      data: { currentWorkspaceId: workspace.id },
    });

    return { user, workspace, password };
  }

  /**
   * Reset the counter (useful for predictable test data)
   */
  resetCounter() {
    this.counter = 0;
  }
}
