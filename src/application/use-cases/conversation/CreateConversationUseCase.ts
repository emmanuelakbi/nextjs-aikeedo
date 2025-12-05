import { Conversation } from '../../../domain/conversation/entities/Conversation';
import { ConversationRepository } from '../../../infrastructure/repositories/ConversationRepository';
import { WorkspaceRepository } from '../../../infrastructure/repositories/WorkspaceRepository';
import { UserRepository } from '../../../infrastructure/repositories/UserRepository';
import { CreateConversationCommand } from '../../commands/conversation/CreateConversationCommand';

/**
 * CreateConversationUseCase
 *
 * Handles creation of new conversations.
 * Requirements: 3.1
 */

export class CreateConversationUseCase {
  constructor(
    private readonly conversationRepository: ConversationRepository,
    private readonly workspaceRepository: WorkspaceRepository,
    private readonly userRepository: UserRepository
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
    const user = await this.userRepository.findById(command.userId);
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
