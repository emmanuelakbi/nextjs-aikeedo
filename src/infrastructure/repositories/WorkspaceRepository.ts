import {
  Workspace,
  WorkspaceProps,
} from '../../domain/workspace/entities/Workspace';
import { Id } from '../../domain/user/value-objects/Id';
import { prisma } from '../../lib/db';
import { Prisma } from '@prisma/client';

/**
 * WorkspaceRepository - Prisma implementation
 *
 * Handles persistence operations for Workspace entities.
 * Requirements: 8.1, 8.2, 8.3
 */

export interface CreateWorkspaceData {
  name: string;
  ownerId: string;
  creditCount?: number;
  isTrialed?: boolean;
}

export interface UpdateWorkspaceData {
  name?: string;
  ownerId?: string;
  creditCount?: number;
  allocatedCredits?: number;
  isTrialed?: boolean;
  creditsAdjustedAt?: Date | null;
}

export class WorkspaceRepository {
  /**
   * Creates a new workspace in the database
   * Requirements: 8.1
   */
  async create(data: CreateWorkspaceData): Promise<Workspace> {
    try {
      const workspace = await prisma.workspace.create({
        data: {
          name: data.name,
          ownerId: data.ownerId,
          creditCount: data.creditCount ?? 0,
          allocatedCredits: 0,
          isTrialed: data.isTrialed ?? false,
        },
      });

      return this.toDomain(workspace);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new Error('Owner user does not exist');
        }
      }
      throw new Error(
        `Failed to create workspace: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Finds a workspace by ID
   * Requirements: 8.3
   */
  async findById(id: string): Promise<Workspace | null> {
    try {
      const workspace = await prisma.workspace.findUnique({
        where: { id },
      });

      return workspace ? this.toDomain(workspace) : null;
    } catch (error) {
      throw new Error(
        `Failed to find workspace by ID: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Finds all workspaces owned by a user
   * Requirements: 8.2
   */
  async findByOwnerId(ownerId: string): Promise<Workspace[]> {
    try {
      const workspaces = await prisma.workspace.findMany({
        where: { ownerId },
        orderBy: { createdAt: 'asc' },
      });

      return workspaces.map((w) => this.toDomain(w));
    } catch (error) {
      throw new Error(
        `Failed to find workspaces by owner: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Finds all workspaces where a user is a member (including owned)
   * Requirements: 8.3
   */
  async findByUserId(userId: string): Promise<Workspace[]> {
    try {
      const workspaces = await prisma.workspace.findMany({
        where: {
          OR: [{ ownerId: userId }, { members: { some: { userId } } }],
        },
        orderBy: { createdAt: 'asc' },
      });

      return workspaces.map((w) => this.toDomain(w));
    } catch (error) {
      throw new Error(
        `Failed to find workspaces by user: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Updates a workspace
   * Requirements: 8.4
   */
  async update(id: string, data: UpdateWorkspaceData): Promise<Workspace> {
    try {
      const workspace = await prisma.workspace.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });

      return this.toDomain(workspace);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new Error('Workspace not found');
        }
        if (error.code === 'P2003') {
          throw new Error('Owner user does not exist');
        }
      }
      throw new Error(
        `Failed to update workspace: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Deletes a workspace
   */
  async delete(id: string): Promise<void> {
    try {
      await prisma.workspace.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new Error('Workspace not found');
        }
      }
      throw new Error(
        `Failed to delete workspace: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Adds a member to a workspace
   * Requirements: 8.3
   */
  async addMember(
    workspaceId: string,
    userId: string,
    role: 'OWNER' | 'ADMIN' | 'MEMBER' = 'MEMBER'
  ): Promise<void> {
    try {
      await prisma.workspaceMember.create({
        data: {
          workspaceId,
          userId,
          role,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new Error('User is already a member of this workspace');
        }
        if (error.code === 'P2003') {
          throw new Error('Workspace or user does not exist');
        }
      }
      throw new Error(
        `Failed to add member to workspace: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Removes a member from a workspace
   * Requirements: 8.3
   */
  async removeMember(workspaceId: string, userId: string): Promise<void> {
    try {
      await prisma.workspaceMember.deleteMany({
        where: {
          workspaceId,
          userId,
        },
      });
    } catch (error) {
      throw new Error(
        `Failed to remove member from workspace: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Checks if a user is a member of a workspace
   * Requirements: 8.3
   */
  async isMember(workspaceId: string, userId: string): Promise<boolean> {
    try {
      const member = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId,
          userId,
        },
      });

      return member !== null;
    } catch (error) {
      throw new Error(
        `Failed to check workspace membership: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Gets all members of a workspace
   * Requirements: 8.3
   */
  async getMembers(
    workspaceId: string
  ): Promise<Array<{ userId: string; role: string }>> {
    try {
      const members = await prisma.workspaceMember.findMany({
        where: { workspaceId },
        select: {
          userId: true,
          role: true,
        },
      });

      return members;
    } catch (error) {
      throw new Error(
        `Failed to get workspace members: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Saves a Workspace entity (create or update)
   */
  async save(workspace: Workspace): Promise<Workspace> {
    const props = workspace.toPersistence();
    const id = props.id.getValue();

    try {
      const existingWorkspace = await prisma.workspace.findUnique({
        where: { id },
      });

      if (existingWorkspace) {
        // Update existing workspace
        const updated = await prisma.workspace.update({
          where: { id },
          data: {
            name: props.name,
            ownerId: props.ownerId,
            creditCount: props.creditCount,
            allocatedCredits: props.allocatedCredits,
            isTrialed: props.isTrialed,
            creditsAdjustedAt: props.creditsAdjustedAt,
            updatedAt: props.updatedAt,
          },
        });

        return this.toDomain(updated);
      } else {
        // Create new workspace
        const created = await prisma.workspace.create({
          data: {
            id,
            name: props.name,
            ownerId: props.ownerId,
            creditCount: props.creditCount,
            allocatedCredits: props.allocatedCredits,
            isTrialed: props.isTrialed,
            creditsAdjustedAt: props.creditsAdjustedAt,
            createdAt: props.createdAt,
            updatedAt: props.updatedAt,
          },
        });

        return this.toDomain(created);
      }
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new Error('Owner user does not exist');
        }
      }
      throw new Error(
        `Failed to save workspace: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Converts Prisma workspace model to domain Workspace entity
   */
  private toDomain(prismaWorkspace: any): Workspace {
    const props: WorkspaceProps = {
      id: Id.fromString(prismaWorkspace.id),
      name: prismaWorkspace.name,
      ownerId: prismaWorkspace.ownerId,
      creditCount: prismaWorkspace.creditCount,
      allocatedCredits: prismaWorkspace.allocatedCredits,
      isTrialed: prismaWorkspace.isTrialed,
      createdAt: prismaWorkspace.createdAt,
      updatedAt: prismaWorkspace.updatedAt,
      creditsAdjustedAt: prismaWorkspace.creditsAdjustedAt,
    };

    return Workspace.fromPersistence(props);
  }
}
