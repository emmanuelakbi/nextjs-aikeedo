/**
 * Workspace Repository Interface
 *
 * Domain-level contract for workspace data access operations.
 * This interface defines all operations needed to persist and retrieve workspaces
 * without exposing infrastructure implementation details.
 *
 * @interface IWorkspaceRepository
 */

import { Workspace } from '../entities/Workspace';

/**
 * Workspace member role enumeration (domain-level)
 */
export enum WorkspaceMemberRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

/**
 * Workspace member information
 */
export interface WorkspaceMember {
  userId: string;
  role: WorkspaceMemberRole;
}

/**
 * Workspace Repository Interface
 *
 * Defines the contract for workspace data access operations.
 * All implementations must provide these methods.
 */
export interface IWorkspaceRepository {
  /**
   * Persist a workspace entity (create or update)
   *
   * @param workspace - The workspace entity to save
   * @returns Promise resolving to the saved workspace
   */
  save(workspace: Workspace): Promise<Workspace>;

  /**
   * Find a workspace by its unique identifier
   *
   * @param id - The workspace's unique identifier
   * @returns Promise resolving to the workspace or null if not found
   */
  findById(id: string): Promise<Workspace | null>;

  /**
   * Find all workspaces owned by a specific user
   *
   * @param ownerId - The owner's user identifier
   * @returns Promise resolving to array of workspaces
   */
  findByOwnerId(ownerId: string): Promise<Workspace[]>;

  /**
   * Find all workspaces where a user is a member (including owned)
   *
   * @param userId - The user's identifier
   * @returns Promise resolving to array of workspaces
   */
  findByUserId(userId: string): Promise<Workspace[]>;

  /**
   * Delete a workspace by its unique identifier
   *
   * @param id - The workspace's unique identifier
   * @returns Promise resolving when deletion is complete
   */
  delete(id: string): Promise<void>;

  /**
   * Add a member to a workspace
   *
   * @param workspaceId - The workspace identifier
   * @param userId - The user identifier to add
   * @param role - The role to assign (defaults to MEMBER)
   * @returns Promise resolving when member is added
   */
  addMember(
    workspaceId: string,
    userId: string,
    role?: WorkspaceMemberRole
  ): Promise<void>;

  /**
   * Remove a member from a workspace
   *
   * @param workspaceId - The workspace identifier
   * @param userId - The user identifier to remove
   * @returns Promise resolving when member is removed
   */
  removeMember(workspaceId: string, userId: string): Promise<void>;

  /**
   * Check if a user is a member of a workspace
   *
   * @param workspaceId - The workspace identifier
   * @param userId - The user identifier to check
   * @returns Promise resolving to true if member, false otherwise
   */
  isMember(workspaceId: string, userId: string): Promise<boolean>;

  /**
   * Get all members of a workspace
   *
   * @param workspaceId - The workspace identifier
   * @returns Promise resolving to array of workspace members
   */
  getMembers(workspaceId: string): Promise<WorkspaceMember[]>;

  /**
   * Check if a workspace exists with the given name for a specific owner
   *
   * @param name - The workspace name to check
   * @param ownerId - The owner's user identifier
   * @returns Promise resolving to true if exists, false otherwise
   */
  existsByName(name: string, ownerId: string): Promise<boolean>;

  /**
   * Update the credit count for a workspace
   *
   * @param id - The workspace's unique identifier
   * @param credits - The new credit count
   * @returns Promise resolving when update is complete
   */
  updateCredits(id: string, credits: number): Promise<void>;
}
