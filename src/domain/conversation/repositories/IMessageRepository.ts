/**
 * Message Repository Interface
 *
 * Domain-level contract for message data access operations.
 * This interface defines all operations needed to persist and retrieve messages
 * without exposing infrastructure implementation details.
 *
 * @interface IMessageRepository
 */

import { Message, MessageRole } from '../entities/Message';

/**
 * Data required to create a new message
 */
export interface CreateMessageData {
  conversationId: string;
  role: MessageRole;
  content: string;
  tokens?: number;
  credits?: number;
}

/**
 * Message Repository Interface
 *
 * Defines the contract for message data access operations.
 * All implementations must provide these methods.
 */
export interface IMessageRepository {
  /**
   * Create a new message
   *
   * @param data - The message data
   * @returns Promise resolving to the created message
   */
  create(data: CreateMessageData): Promise<Message>;

  /**
   * Persist a message entity (create or update)
   *
   * @param message - The message entity to save
   * @returns Promise resolving to the saved message
   */
  save(message: Message): Promise<Message>;

  /**
   * Find a message by its unique identifier
   *
   * @param id - The message's unique identifier
   * @returns Promise resolving to the message or null if not found
   */
  findById(id: string): Promise<Message | null>;

  /**
   * Find all messages in a conversation
   *
   * @param conversationId - The conversation's unique identifier
   * @returns Promise resolving to array of messages ordered by creation time
   */
  findByConversationId(conversationId: string): Promise<Message[]>;

  /**
   * Delete all messages in a conversation
   *
   * @param conversationId - The conversation's unique identifier
   * @returns Promise resolving when deletion is complete
   */
  deleteByConversationId(conversationId: string): Promise<void>;

  /**
   * Delete a message by its unique identifier
   *
   * @param id - The message's unique identifier
   * @returns Promise resolving when deletion is complete
   */
  delete(id: string): Promise<void>;
}
