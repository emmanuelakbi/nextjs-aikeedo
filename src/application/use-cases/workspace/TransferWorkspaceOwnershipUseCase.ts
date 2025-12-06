import { Workspace } from '../../../domain/workspace/entities/Workspace';
import { IWorkspaceRepository } from '../../../domain/workspace/repositories/IWorkspaceRepository';
import { IUserRepository } from '../../../domain/user/repositories/IUserRepository';
import { Id } from '../../../domain/user/value-objects/Id';
import { TransferWorkspaceOwnershipCommand } from '../../commands/workspace/TransferWorkspaceOwnershipCommand';

/**
 * TransferWorkspaceOwnershipUseCase
 *
 * Handles transferring workspace ownership to another user.
 * Requirements: 8.2
 */

export class TransferWorkspaceOwnershipUseCase {
  constructor(
    private readonly workspaceRepository: IWorkspaceRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(
    command: TransferWorkspaceOwnershipCommand
  ): Promise<Workspace> {
    // Find the workspace
    const workspace = await this.workspaceRepository.findById(
      command.workspaceId
    );
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // Authorization check: Only the current owner can transfer ownership
    // Requirements: 8.2
    if (!workspace.isOwnedBy(command.currentOwnerId)) {
      throw new Error('Only the workspace owner can transfer ownership');
    }

    // Validate new owner exists
    const newOwnerId = Id.fromString(command.newOwnerId);
    const newOwner = await this.userRepository.findById(newOwnerId);
    if (!newOwner) {
      throw new Error('New owner user not found');
    }

    // Validate new owner is not the same as current owner
    if (command.currentOwnerId === command.newOwnerId) {
      throw new Error('New owner must be different from current owner');
    }

    // Transfer ownership
    workspace.transferOwnership(command.newOwnerId);

    // Save to database
    const updatedWorkspace = await this.workspaceRepository.save(workspace);

    return updatedWorkspace;
  }
}
