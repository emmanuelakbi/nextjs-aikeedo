/**
 * Workspace Domain Exports
 *
 * Barrel file for workspace domain layer exports.
 */

// Entities
export { Workspace } from './entities/Workspace';
export type {
  WorkspaceProps,
  CreateWorkspaceProps,
} from './entities/Workspace';

// Repository Interface
export type { IWorkspaceRepository } from './repositories/IWorkspaceRepository';
export { WorkspaceMemberRole } from './repositories/IWorkspaceRepository';
export type { WorkspaceMember } from './repositories/IWorkspaceRepository';
