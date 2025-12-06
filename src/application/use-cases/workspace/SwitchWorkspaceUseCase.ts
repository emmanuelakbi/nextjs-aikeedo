import { User } from '../../../domain/user/entities/User';
import { IWorkspaceRepository } from '../../../domain/workspace/repositories/IWorkspaceRepository';
import { IUserRepository } from '../../../domain/user/repositories/IUserRepository';
import { Id } from '../../../domain/user/value-objects/Id';
import { SwitchWorkspaceCommand } from '../../commands/workspace/SwitchWorkspaceCommand';

/**
 * SwitchWorkspaceUseCase
 *
 * Handles switching the user's current workspace context.
 * Requirements: 8.3
 */

export class SwitchWorkspaceUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly workspaceRepository: IWorkspaceRepository
  ) {}

  async execute(command: SwitchWorkspaceCommand): Promise<User> {
    // Find the user
    const userId = Id.fromString(command.userId);
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify the workspace exists
    const workspace = await this.workspaceRepository.findById(
      command.workspaceId
    );
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // Verify the user has access to this workspace
    // User must be either the owner or a member
    const userWorkspaces = await this.workspaceRepository.findByUserId(
      command.userId
    );
    const hasAccess = userWorkspaces.some(
      (w) => w.getId().getValue() === command.workspaceId
    );

    if (!hasAccess) {
      throw new Error('User does not have access to this workspace');
    }

    // Update the user's current workspace
    // Requirements: 8.3
    user.setCurrentWorkspace(command.workspaceId);

    // Save to database
    const updatedUser = await this.userRepository.save(user);

    return updatedUser;
  }
}
