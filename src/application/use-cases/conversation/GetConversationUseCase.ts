import { Conversation } from '../../../domain/conversation/entities/Conversation';
import { Message } from '../../../domain/conversation/entities/Message';
import { ConversationRepository } from '../../../infrastructure/repositories/ConversationRepository';
import { MessageRepository } from '../../../infrastructure/repositories/MessageRepository';
import { GetConversationCommand } from '../../commands/conversation/GetConversationCommand';

/**
 * GetConversationUseCase
 *
 * Retrieves a conversation with its messages.
 * Requirements: 3.3
 */

export interface ConversationWithMessages {
  conversation: Conversation;
  messages: Message[];
}

export class GetConversationUseCase {
  constructor(
    private readonly conversationRepository: ConversationRepository,
    private readonly messageRepository: MessageRepository
  ) {}

  async execute(
    command: GetConversationCommand
  ): Promise<ConversationWithMessages> {
    // Find the conversation
    const conversation = await this.conversationRepository.findById(
      command.conversationId
    );
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Verify the user owns the conversation
    // Requirements: 3.3
    if (!conversation.isOwnedBy(command.userId)) {
      throw new Error(
        'Unauthorized: You do not have access to this conversation'
      );
    }

    // Get all messages in the conversation
    // Requirements: 3.3
    const messages = await this.messageRepository.findByConversationId(
      command.conversationId
    );

    return {
      conversation,
      messages,
    };
  }
}
