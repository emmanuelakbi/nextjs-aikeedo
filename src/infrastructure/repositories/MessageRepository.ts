import {
  Message,
  MessageProps,
  MessageRole,
} from '../../domain/conversation/entities/Message';
import {
  IMessageRepository,
  CreateMessageData,
} from '../../domain/conversation/repositories/IMessageRepository';
import { Id } from '../../domain/user/value-objects/Id';
import { prisma } from '../../lib/db';
import { Prisma } from '@prisma/client';

/**
 * MessageRepository - Prisma implementation
 *
 * Handles persistence operations for Message entities.
 * Requirements: 3.2, 3.3
 */

export class MessageRepository implements IMessageRepository {
  /**
   * Creates a new message in the database
   * Requirements: 3.2
   */
  async create(data: CreateMessageData): Promise<Message> {
    try {
      const message = await prisma.message.create({
        data: {
          conversationId: data.conversationId,
          role: data.role.toUpperCase() as 'USER' | 'ASSISTANT' | 'SYSTEM',
          content: data.content,
          tokens: data.tokens ?? 0,
          credits: data.credits ?? 0,
        },
      });

      return this.toDomain(message);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new Error('Conversation does not exist');
        }
      }
      throw new Error(
        `Failed to create message: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Finds a message by ID
   */
  async findById(id: string): Promise<Message | null> {
    try {
      const message = await prisma.message.findUnique({
        where: { id },
      });

      return message ? this.toDomain(message) : null;
    } catch (error) {
      throw new Error(
        `Failed to find message by ID: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Finds all messages in a conversation
   * Requirements: 3.3
   */
  async findByConversationId(conversationId: string): Promise<Message[]> {
    try {
      const messages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
      });

      return messages.map((m) => this.toDomain(m));
    } catch (error) {
      throw new Error(
        `Failed to find messages by conversation: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Deletes all messages in a conversation
   * Requirements: 3.5
   */
  async deleteByConversationId(conversationId: string): Promise<void> {
    try {
      await prisma.message.deleteMany({
        where: { conversationId },
      });
    } catch (error) {
      throw new Error(
        `Failed to delete messages: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Saves a Message entity
   */
  async save(message: Message): Promise<Message> {
    const props = message.toPersistence();
    const id = props.id.getValue();

    try {
      const existingMessage = await prisma.message.findUnique({
        where: { id },
      });

      if (existingMessage) {
        // Messages are immutable, so we just return the existing one
        return this.toDomain(existingMessage);
      } else {
        // Create new message
        const created = await prisma.message.create({
          data: {
            id,
            conversationId: props.conversationId,
            role: props.role.toUpperCase() as 'USER' | 'ASSISTANT' | 'SYSTEM',
            content: props.content,
            tokens: props.tokens,
            credits: props.credits,
            createdAt: props.createdAt,
          },
        });

        return this.toDomain(created);
      }
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new Error('Conversation does not exist');
        }
      }
      throw new Error(
        `Failed to save message: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Converts Prisma message model to domain Message entity
   */
  private toDomain(prismaMessage: any): Message {
    const props: MessageProps = {
      id: Id.fromString(prismaMessage.id),
      conversationId: prismaMessage.conversationId,
      role: prismaMessage.role.toLowerCase() as MessageRole,
      content: prismaMessage.content,
      tokens: prismaMessage.tokens,
      credits: prismaMessage.credits,
      createdAt: prismaMessage.createdAt,
    };

    return Message.fromPersistence(props);
  }
}
