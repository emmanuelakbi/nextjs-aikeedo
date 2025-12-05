import { Message } from '../../../domain/conversation/entities/Message';
import { ConversationRepository } from '../../../infrastructure/repositories/ConversationRepository';
import { MessageRepository } from '../../../infrastructure/repositories/MessageRepository';
import { AddMessageCommand } from '../../commands/conversation/AddMessageCommand';

/**
 * AddMessageUseCase
 *
 * Handles adding messages to conversations.
 * Requirements: 3.2
 */

export class AddMessageUseCase {
  constructor(
    private readonly messageRepository: MessageRepository,
    private readonly conversationRepository: ConversationRepository
  ) {}

  async execute(command: AddMessageCommand): Promise<Message> {
    // Verify the conversation exists
    const conversation = await this.conversationRepository.findById(
      command.conversationId
    );
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Create message entity
    // Requirements: 3.2
    const message = Message.create({
      conversationId: command.conversationId,
      role: command.role,
      content: command.content,
      tokens: command.tokens,
      credits: command.credits,
    });

    // Save to database
    const savedMessage = await this.messageRepository.save(message);

    return savedMessage;
  }
}
