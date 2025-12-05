import { Workspace } from '../../../domain/workspace/entities/Workspace';
import { WorkspaceRepository } from '../../../infrastructure/repositories/WorkspaceRepository';
import { UserRepository } from '../../../infrastructure/repositories/UserRepository';
import { CreateWorkspaceCommand } from '../../commands/workspace/CreateWorkspaceCommand';

/**
 * CreateWorkspaceUseCase
 *
 * Handles creation of new workspaces.
 * Requirements: 8.1, 8.2
 */

export class CreateWorkspaceUseCase {
  constructor(
    private readonly workspaceRepository: WorkspaceRepository,
    private readonly userRepository: UserRepository
  ) {}

  async execute(command: CreateWorkspaceCommand): Promise<Workspace> {
    // Verify the user exists
    const user = await this.userRepository.findById(command.userId);
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
