/**
 * User Domain Barrel Export
 *
 * Exports all public interfaces, types, and entities from the user domain.
 */

// Entities
export { User } from './entities/User';

// Value Objects
export { Email } from './value-objects/Email';
export { Password } from './value-objects/Password';
export { Id } from './value-objects/Id';

// Repository Interface and Types
export type { IUserRepository, FindAllOptions } from './repositories/IUserRepository';
export { UserRole, UserStatus } from './repositories/IUserRepository';
