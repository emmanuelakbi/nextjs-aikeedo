/**
 * User Domain Types
 *
 * Type-only exports that can be safely imported in client components.
 * These types don't have any runtime dependencies on Node.js modules.
 */

// Re-export enums from repository interface
export {
  UserRole,
  UserStatus,
  type FindAllOptions,
} from './repositories/IUserRepository';

// Type-only exports (no runtime code)
export type { IUserRepository } from './repositories/IUserRepository';
