/**
 * Conversation Repository Interface
 * 
 * Domain-level contract for conversation data access operations.
 * This interface defines all operations needed to persist and retrieve conversations
 * without exposing infrastructure implementation details.
 * 
 * @interface IConversationRepository
 */

import { Conversation } from '../entities/Conversation';
import { Id } from '../../user/value-objects/Id';

/**
 * Options for listing conversations
 */
export interface ListConversationsOptions {
  workspaceId?: string;
  userId?: string;
  limit?: number;
  offset?: number;
}

/**
 * Pagination result for conversations
 */
export interface ConversationPaginationResult {
  conversations: Conversation[];
  total: number;
  hasMore: boolean;
}

/**
 * Conversation Repository Interface
 * 
 * Defines the contract for conversation data access operations.
 * All implementations must provide these methods.
 */
export interface IConversationRepository {
  /**
   * Persist a conversation entity (create or update)
   * 
   * @param conversation - The conversation entity to save
   * @returns Promise resolving to the saved conversation
   */
  save(conversation: Conversation): Promise<Conversation>;

  /**
   * Find a conversation by its unique identifier
   * 
   * @param id - The conversation's unique identifier
   * @returns Promise resolving to the conversation or null if not found
   */
  findById(id: string): Promise<Conversation | null>;

  /**
   * Find conversations by workspace ID
   * 
   * @param workspaceId - The workspace identifier
   * @returns Promise resolving to array of conversations
   */
  findByWorkspaceId(workspaceId: string): Promise<Conversation[]>;

  /**
   * Find conversations by user ID
   * 
   * @param userId - The user identifier
   * @returns Promise resolving to array of conversations
   */
  findByUserId(userId: string): Promise<Conversation[]>;

  /**
   * List conversations with optional filters
   * 
   * @param options - Query options (workspaceId, userId, limit, offset)
   * @returns Promise resolving to array of conversations
   */
  list(options?: ListConversationsOptions): Promise<Conversation[]>;

  /**
   * Count conversations matching the given criteria
   * 
   * @param options - Query options (workspaceId, userId)
   * @returns Promise resolving to the count
   */
  count(options?: ListConversationsOptions): Promise<number>;

  /**
   * List conversations with pagination metadata
   * 
   * @param options - Query options (workspaceId, userId, limit, offset)
   * @returns Promise resolving to pagination result
   */
  listWithPagination(
    options?: ListConversationsOptions
  ): Promise<ConversationPaginationResult>;

  /**
   * Delete a conversation by its unique identifier
   * 
   * @param id - The conversation's unique identifier
   * @returns Promise resolving when deletion is complete
   */
  delete(id: string): Promise<void>;
}
