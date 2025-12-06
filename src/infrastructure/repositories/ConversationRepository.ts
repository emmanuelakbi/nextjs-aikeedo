import {
  Conversation,
  ConversationProps,
} from '../../domain/conversation/entities/Conversation';
import { Id } from '../../domain/user/value-objects/Id';
import {
  IConversationRepository,
  ListConversationsOptions,
  ConversationPaginationResult,
} from '../../domain/conversation/repositories/IConversationRepository';
import { prisma } from '../../lib/db';
import { Prisma } from '@prisma/client';

/**
 * ConversationRepository - Prisma implementation
 *
 * Handles persistence operations for Conversation entities.
 * Implements IConversationRepository interface for Clean Architecture compliance.
 * Requirements: 3.1, 3.3, 3.4, 3.5
 */

export interface CreateConversationData {
  workspaceId: string;
  userId: string;
  title: string;
  model: string;
  provider: string;
}

export interface UpdateConversationData {
  title?: string;
}

export interface ListConversationsOptions {
  workspaceId?: string;
  userId?: string;
  limit?: number;
  offset?: number;
}

export class ConversationRepository implements IConversationRepository {
  /**
   * Creates a new conversation in the database
   * Requirements: 3.1
   */
  async create(data: CreateConversationData): Promise<Conversation> {
    try {
      const conversation = await prisma.conversation.create({
        data: {
          workspaceId: data.workspaceId,
          userId: data.userId,
          title: data.title,
          model: data.model,
          provider: data.provider,
        },
      });

      return this.toDomain(conversation);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new Error('Workspace or user does not exist');
        }
      }
      throw new Error(
        `Failed to create conversation: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Finds a conversation by ID
   * Requirements: 3.3
   */
  async findById(id: string): Promise<Conversation | null> {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id },
      });

      return conversation ? this.toDomain(conversation) : null;
    } catch (error) {
      throw new Error(
        `Failed to find conversation by ID: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Lists conversations with optional filters
   * Requirements: 3.4
   * Optimized: Added select to fetch only necessary fields, improved indexing
   */
  async list(options: ListConversationsOptions = {}): Promise<Conversation[]> {
    try {
      const where: Prisma.ConversationWhereInput = {};

      if (options.workspaceId) {
        where.workspaceId = options.workspaceId;
      }

      if (options.userId) {
        where.userId = options.userId;
      }

      const conversations = await prisma.conversation.findMany({
        where,
        select: {
          id: true,
          workspaceId: true,
          userId: true,
          title: true,
          model: true,
          provider: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: options.limit,
        skip: options.offset,
      });

      return conversations.map((c) => this.toDomain(c));
    } catch (error) {
      throw new Error(
        `Failed to list conversations: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Count conversations with optional filters
   * Optimized query for pagination
   */
  async count(options: ListConversationsOptions = {}): Promise<number> {
    try {
      const where: Prisma.ConversationWhereInput = {};

      if (options.workspaceId) {
        where.workspaceId = options.workspaceId;
      }

      if (options.userId) {
        where.userId = options.userId;
      }

      return await prisma.conversation.count({ where });
    } catch (error) {
      throw new Error(
        `Failed to count conversations: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * List conversations with pagination metadata
   * Optimized for lazy loading
   */
  async listWithPagination(
    options: ListConversationsOptions = {}
  ): Promise<ConversationPaginationResult> {
    const limit = options.limit || 20;
    const offset = options.offset || 0;

    const [conversations, total] = await Promise.all([
      this.list({ ...options, limit, offset }),
      this.count(options),
    ]);

    return {
      conversations,
      total,
      hasMore: offset + conversations.length < total,
    };
  }

  /**
   * Finds conversations by workspace ID
   * Requirements: 3.4
   */
  async findByWorkspaceId(workspaceId: string): Promise<Conversation[]> {
    return this.list({ workspaceId });
  }

  /**
   * Finds conversations by user ID
   * Requirements: 3.4
   */
  async findByUserId(userId: string): Promise<Conversation[]> {
    return this.list({ userId });
  }

  /**
   * Updates a conversation
   * Requirements: 3.1
   */
  async update(
    id: string,
    data: UpdateConversationData
  ): Promise<Conversation> {
    try {
      const conversation = await prisma.conversation.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });

      return this.toDomain(conversation);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new Error('Conversation not found');
        }
      }
      throw new Error(
        `Failed to update conversation: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Deletes a conversation
   * Requirements: 3.5
   */
  async delete(id: string): Promise<void> {
    try {
      await prisma.conversation.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new Error('Conversation not found');
        }
      }
      throw new Error(
        `Failed to delete conversation: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Saves a Conversation entity (create or update)
   */
  async save(conversation: Conversation): Promise<Conversation> {
    const props = conversation.toPersistence();
    const id = props.id.getValue();

    try {
      const existingConversation = await prisma.conversation.findUnique({
        where: { id },
      });

      if (existingConversation) {
        // Update existing conversation
        const updated = await prisma.conversation.update({
          where: { id },
          data: {
            title: props.title,
            updatedAt: props.updatedAt,
          },
        });

        return this.toDomain(updated);
      } else {
        // Create new conversation
        const created = await prisma.conversation.create({
          data: {
            id,
            workspaceId: props.workspaceId,
            userId: props.userId,
            title: props.title,
            model: props.model,
            provider: props.provider,
            createdAt: props.createdAt,
            updatedAt: props.updatedAt,
          },
        });

        return this.toDomain(created);
      }
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new Error('Workspace or user does not exist');
        }
      }
      throw new Error(
        `Failed to save conversation: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Converts Prisma conversation model to domain Conversation entity
   */
  private toDomain(prismaConversation: any): Conversation {
    const props: ConversationProps = {
      id: Id.fromString(prismaConversation.id),
      workspaceId: prismaConversation.workspaceId,
      userId: prismaConversation.userId,
      title: prismaConversation.title,
      model: prismaConversation.model,
      provider: prismaConversation.provider,
      createdAt: prismaConversation.createdAt,
      updatedAt: prismaConversation.updatedAt,
    };

    return Conversation.fromPersistence(props);
  }
}
