import { Workspace } from '../../../domain/workspace/entities/Workspace';
import { WorkspaceRepository } from '../../../infrastructure/repositories/WorkspaceRepository';
import { ListWorkspacesQuery } from '../../queries/workspace/ListWorkspacesQuery';

/**
 * ListWorkspacesUseCase
 *
 * Handles retrieving all workspaces for a user (owned and member).
 * Requirements: 8.3, 8.4
 */

export class ListWorkspacesUseCase {
  constructor(private readonly workspaceRepository: WorkspaceRepository) {}

  async execute(query: ListWorkspacesQuery): Promise<Workspace[]> {
    // Get all workspaces where the user is owner or member
    // Requirements: 8.3, 8.4
    const workspaces = await this.workspaceRepository.findByUserId(
      query.userId
    );

    return workspaces;
  }
}
