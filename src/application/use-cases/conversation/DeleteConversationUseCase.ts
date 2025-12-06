import { IConversationRepository } from '../../../domain/conversation/repositories/IConversationRepository';
import { IMessageRepository } from '../../../domain/conversation/repositories/IMessageRepository';
import { DeleteConversationCommand } from '../../commands/conversation/DeleteConversationCommand';

/**
 * DeleteConversationUseCase
 *
 * Deletes a conversation and all its messages.
 * Requirements: 3.5
 */

export class DeleteConversationUseCase {
  constructor(
    private readonly conversationRepository: IConversationRepository,
    private readonly messageRepository: IMessageRepository
  ) {}

  async execute(command: DeleteConversationCommand): Promise<void> {
    // Find the conversation
    const conversation = await this.conversationRepository.findById(
      command.conversationId
    );
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Verify the user owns the conversation
    // Requirements: 3.5
    if (!conversation.isOwnedBy(command.userId)) {
      throw new Error(
        'Unauthorized: You do not have access to this conversation'
      );
    }

    // Delete all messages in the conversation
    // Requirements: 3.5
    await this.messageRepository.deleteByConversationId(command.conversationId);

    // Delete the conversation
    // Requirements: 3.5
    await this.conversationRepository.delete(command.conversationId);
  }
}
