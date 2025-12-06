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
export {
  IWorkspaceRepository,
  WorkspaceMemberRole,
} from './repositories/IWorkspaceRepository';
export type { WorkspaceMember } from './repositories/IWorkspaceRepository';
