/**
 * Conversation Domain Exports
 *
 * Barrel file for conversation domain layer exports.
 */

// Entities
export { Conversation } from './entities/Conversation';
export type {
  ConversationProps,
  CreateConversationProps,
} from './entities/Conversation';
export { Message } from './entities/Message';
export type { MessageProps, MessageRole } from './entities/Message';

// Repository Interfaces
export { IConversationRepository } from './repositories/IConversationRepository';
export type {
  ListConversationsOptions,
  ConversationPaginationResult,
} from './repositories/IConversationRepository';
export { IMessageRepository } from './repositories/IMessageRepository';
export type { CreateMessageData } from './repositories/IMessageRepository';
