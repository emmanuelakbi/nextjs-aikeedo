import { Conversation } from '../../../domain/conversation/entities/Conversation';
import { ConversationRepository } from '../../../infrastructure/repositories/ConversationRepository';
import { ListConversationsCommand } from '../../commands/conversation/ListConversationsCommand';

/**
 * ListConversationsUseCase
 *
 * Lists conversations with optional filters.
 * Requirements: 3.4
 */

export class ListConversationsUseCase {
  constructor(
    private readonly conversationRepository: ConversationRepository
  ) {}

  async execute(command: ListConversationsCommand): Promise<Conversation[]> {
    // List conversations with filters
    // Requirements: 3.4
    const conversations = await this.conversationRepository.list({
      workspaceId: command.workspaceId,
      userId: command.userId,
      limit: command.limit,
      offset: command.offset,
    });

    return conversations;
  }
}
