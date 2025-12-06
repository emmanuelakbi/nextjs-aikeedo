/**
 * User Repository Interface
 *
 * Domain-level contract for user data access operations.
 * This interface defines all operations needed to persist and retrieve users
 * without exposing infrastructure implementation details.
 *
 * @interface IUserRepository
 */

import { User } from '../entities/User';
import { Email } from '../value-objects/Email';
import { Id } from '../value-objects/Id';

/**
 * User status enumeration (domain-level)
 */
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

/**
 * User role enumeration (domain-level)
 */
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

/**
 * Options for querying users
 */
export interface FindAllOptions {
  limit?: number;
  offset?: number;
  status?: UserStatus;
}

/**
 * User Repository Interface
 *
 * Defines the contract for user data access operations.
 * All implementations must provide these methods.
 */
export interface IUserRepository {
  /**
   * Persist a user entity
   *
   * @param user - The user entity to save
   * @returns Promise resolving to the saved user
   */
  save(user: User): Promise<User>;

  /**
   * Find a user by their unique identifier
   *
   * @param id - The user's unique identifier
   * @returns Promise resolving to the user or null if not found
   */
  findById(id: Id): Promise<User | null>;

  /**
   * Find a user by their email address
   *
   * @param email - The user's email address
   * @returns Promise resolving to the user or null if not found
   */
  findByEmail(email: Email): Promise<User | null>;

  /**
   * Delete a user by their unique identifier
   *
   * @param id - The user's unique identifier
   * @returns Promise resolving when deletion is complete
   */
  delete(id: Id): Promise<void>;

  /**
   * Find all users matching the given criteria
   *
   * @param options - Query options (limit, offset, status filter)
   * @returns Promise resolving to array of users
   */
  findAll(options?: FindAllOptions): Promise<User[]>;

  /**
   * Count users matching the given criteria
   *
   * @param filters - Optional status filter
   * @returns Promise resolving to the count
   */
  count(filters?: { status?: UserStatus }): Promise<number>;

  /**
   * Find all users belonging to a workspace
   *
   * @param workspaceId - The workspace identifier
   * @returns Promise resolving to array of users
   */
  findByWorkspace(workspaceId: string): Promise<User[]>;

  /**
   * Check if a user exists with the given email
   *
   * @param email - The email address to check
   * @returns Promise resolving to true if exists, false otherwise
   */
  existsByEmail(email: Email): Promise<boolean>;
}
