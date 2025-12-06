import { Conversation } from '../../../domain/conversation/entities/Conversation';
import { IConversationRepository } from '../../../domain/conversation/repositories/IConversationRepository';
import { IWorkspaceRepository } from '../../../domain/workspace/repositories/IWorkspaceRepository';
import { IUserRepository } from '../../../domain/user/repositories/IUserRepository';
import { Id } from '../../../domain/user/value-objects/Id';
import { CreateConversationCommand } from '../../commands/conversation/CreateConversationCommand';

/**
 * CreateConversationUseCase
 *
 * Handles creation of new conversations.
 * Requirements: 3.1
 */

export class CreateConversationUseCase {
  constructor(
    private readonly conversationRepository: IConversationRepository,
    private readonly workspaceRepository: IWorkspaceRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(command: CreateConversationCommand): Promise<Conversation> {
    // Verify the workspace exists
    const workspace = await this.workspaceRepository.findById(
      command.workspaceId
    );
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // Verify the user exists
    const userId = Id.fromString(command.userId);
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Create conversation entity
    // Requirements: 3.1
    const conversation = Conversation.create({
      workspaceId: command.workspaceId,
      userId: command.userId,
      title: command.title,
      model: command.model,
      provider: command.provider,
    });

    // Save to database
    const savedConversation =
      await this.conversationRepository.save(conversation);

    return savedConversation;
  }
}
