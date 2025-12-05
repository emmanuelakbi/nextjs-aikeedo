import { Workspace } from '../../../domain/workspace/entities/Workspace';
import { WorkspaceRepository } from '../../../infrastructure/repositories/WorkspaceRepository';
import { UpdateWorkspaceCommand } from '../../commands/workspace/UpdateWorkspaceCommand';

/**
 * UpdateWorkspaceUseCase
 *
 * Handles updating workspace information.
 * Requirements: 8.4
 */

export class UpdateWorkspaceUseCase {
  constructor(private readonly workspaceRepository: WorkspaceRepository) {}

  async execute(command: UpdateWorkspaceCommand): Promise<Workspace> {
    // Find the workspace
    const workspace = await this.workspaceRepository.findById(
      command.workspaceId
    );
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // Authorization check: Only the owner can update the workspace
    // Requirements: 8.2, 8.4
    if (!workspace.isOwnedBy(command.userId)) {
      throw new Error('Only the workspace owner can update workspace settings');
    }

    // Update workspace data
    if (command.name !== undefined) {
      workspace.updateName(command.name);
    }

    // Save to database
    const updatedWorkspace = await this.workspaceRepository.save(workspace);

    return updatedWorkspace;
  }
}
