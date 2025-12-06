import { Workspace } from '../../../domain/workspace/entities/Workspace';
import { IWorkspaceRepository } from '../../../domain/workspace/repositories/IWorkspaceRepository';
import { IUserRepository } from '../../../domain/user/repositories/IUserRepository';
import { Id } from '../../../domain/user/value-objects/Id';
import { CreateWorkspaceCommand } from '../../commands/workspace/CreateWorkspaceCommand';

/**
 * CreateWorkspaceUseCase
 *
 * Handles creation of new workspaces.
 * Requirements: 8.1, 8.2
 */

export class CreateWorkspaceUseCase {
  constructor(
    private readonly workspaceRepository: IWorkspaceRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(command: CreateWorkspaceCommand): Promise<Workspace> {
    // Verify the user exists
    const userId = Id.fromString(command.userId);
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Create workspace entity
    // Requirements: 8.1, 8.2
    const workspace = Workspace.create({
      name: command.name,
      ownerId: command.userId,
      creditCount: command.creditCount,
      isTrialed: command.isTrialed,
    });

    // Save to database
    const savedWorkspace = await this.workspaceRepository.save(workspace);

    return savedWorkspace;
  }
}
