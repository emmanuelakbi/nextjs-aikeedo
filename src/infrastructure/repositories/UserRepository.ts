import { User, UserProps } from '../../domain/user/entities/User';
import { Email } from '../../domain/user/value-objects/Email';
import { Id } from '../../domain/user/value-objects/Id';
import {
  IUserRepository,
  UserStatus,
  FindAllOptions,
} from '../../domain/user/repositories/IUserRepository';
import { prisma } from '../../lib/db';
import { Prisma } from '@prisma/client';

/**
 * UserRepository - Prisma implementation
 *
 * Handles persistence operations for User entities.
 * Implements IUserRepository interface for Clean Architecture compliance.
 * Requirements: 2.2, 3.1, 6.1, 8.2
 */

export interface CreateUserData {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  language?: string;
  role?: 'USER' | 'ADMIN';
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export interface UpdateUserData {
  email?: string;
  emailVerified?: Date | null;
  passwordHash?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string | null;
  language?: string;
  role?: 'USER' | 'ADMIN';
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  apiKey?: string | null;
  currentWorkspaceId?: string | null;
  lastSeenAt?: Date | null;
}

export class UserRepository implements IUserRepository {
  /**
   * Creates a new user in the database
   * Requirements: 3.1
   */
  async create(data: CreateUserData): Promise<User> {
    try {
      const user = await prisma.user.create({
        data: {
          email: data.email,
          passwordHash: data.passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          phoneNumber: data.phoneNumber ?? null,
          language: data.language ?? 'en-US',
          role: data.role ?? 'USER',
          status: data.status ?? 'ACTIVE',
        },
      });

      return this.toDomain(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new Error('A user with this email already exists');
        }
      }
      throw new Error(
        `Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Finds a user by ID
   * Requirements: 7.2
   */
  async findById(id: Id): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: id.getValue() },
      });

      return user ? this.toDomain(user) : null;
    } catch (error) {
      throw new Error(
        `Failed to find user by ID: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Finds a user by email address
   * Requirements: 3.1
   */
  async findByEmail(email: Email): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { email: email.getValue() },
      });

      return user ? this.toDomain(user) : null;
    } catch (error) {
      throw new Error(
        `Failed to find user by email: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Finds a user by API key
   */
  async findByApiKey(apiKey: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { apiKey },
      });

      return user ? this.toDomain(user) : null;
    } catch (error) {
      throw new Error(
        `Failed to find user by API key: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Updates a user
   * Requirements: 7.2
   */
  async update(id: string, data: UpdateUserData): Promise<User> {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });

      return this.toDomain(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new Error('A user with this email already exists');
        }
        if (error.code === 'P2025') {
          throw new Error('User not found');
        }
      }
      throw new Error(
        `Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Deletes a user
   */
  async delete(id: Id): Promise<void> {
    try {
      await prisma.user.delete({
        where: { id: id.getValue() },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new Error('User not found');
        }
      }
      throw new Error(
        `Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Find all users matching the given criteria
   * Requirements: 7.2
   */
  async findAll(options?: FindAllOptions): Promise<User[]> {
    try {
      const where: Prisma.UserWhereInput = {};

      if (options?.status) {
        where.status = options.status;
      }

      const users = await prisma.user.findMany({
        where,
        take: options?.limit,
        skip: options?.offset,
        orderBy: { createdAt: 'desc' },
      });

      return users.map((u) => this.toDomain(u));
    } catch (error) {
      throw new Error(
        `Failed to find all users: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Count users matching the given criteria
   * Requirements: 7.2
   */
  async count(filters?: { status?: UserStatus }): Promise<number> {
    try {
      const where: Prisma.UserWhereInput = {};

      if (filters?.status) {
        where.status = filters.status;
      }

      return await prisma.user.count({ where });
    } catch (error) {
      throw new Error(
        `Failed to count users: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Find all users belonging to a workspace
   * Requirements: 8.2
   */
  async findByWorkspace(workspaceId: string): Promise<User[]> {
    try {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { ownedWorkspaces: { some: { id: workspaceId } } },
            { workspaceMemberships: { some: { workspaceId } } },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });

      return users.map((u) => this.toDomain(u));
    } catch (error) {
      throw new Error(
        `Failed to find users by workspace: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check if a user exists with the given email
   * Requirements: 3.1
   */
  async existsByEmail(email: Email): Promise<boolean> {
    try {
      const count = await prisma.user.count({
        where: { email: email.getValue() },
      });

      return count > 0;
    } catch (error) {
      throw new Error(
        `Failed to check if user exists by email: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Saves a User entity (create or update)
   */
  async save(user: User): Promise<User> {
    const props = user.toPersistence();
    const id = props.id.getValue();

    try {
      // Use upsert to handle both create and update cases
      const saved = await prisma.user.upsert({
        where: { id },
        update: {
          email: props.email.getValue(),
          emailVerified: props.emailVerified,
          passwordHash: props.passwordHash,
          firstName: props.firstName,
          lastName: props.lastName,
          phoneNumber: props.phoneNumber,
          language: props.language,
          role: props.role,
          status: props.status,
          apiKey: props.apiKey,
          currentWorkspaceId: props.currentWorkspaceId,
          lastSeenAt: props.lastSeenAt,
          updatedAt: props.updatedAt,
        },
        create: {
          id,
          email: props.email.getValue(),
          emailVerified: props.emailVerified,
          passwordHash: props.passwordHash,
          firstName: props.firstName,
          lastName: props.lastName,
          phoneNumber: props.phoneNumber,
          language: props.language,
          role: props.role,
          status: props.status,
          apiKey: props.apiKey,
          currentWorkspaceId: props.currentWorkspaceId,
          lastSeenAt: props.lastSeenAt,
          createdAt: props.createdAt,
          updatedAt: props.updatedAt,
        },
      });

      return this.toDomain(saved);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new Error('A user with this email already exists');
        }
      }
      throw new Error(
        `Failed to save user: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Converts Prisma user model to domain User entity
   */
  private toDomain(prismaUser: any): User {
    const props: UserProps = {
      id: Id.fromString(prismaUser.id),
      email: Email.create(prismaUser.email),
      emailVerified: prismaUser.emailVerified,
      passwordHash: prismaUser.passwordHash,
      firstName: prismaUser.firstName,
      lastName: prismaUser.lastName,
      phoneNumber: prismaUser.phoneNumber,
      language: prismaUser.language,
      role: prismaUser.role,
      status: prismaUser.status,
      apiKey: prismaUser.apiKey,
      currentWorkspaceId: prismaUser.currentWorkspaceId,
      lastSeenAt: prismaUser.lastSeenAt,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    };

    return User.fromPersistence(props);
  }
}
