import { Id } from '../../user/value-objects/Id';

/**
 * Message Entity
 *
 * Represents a message in a conversation.
 * Requirements: 3.1, 3.3
 */

export type MessageRole = 'user' | 'assistant' | 'system';

export interface MessageProps {
  id: Id;
  conversationId: string;
  role: MessageRole;
  content: string;
  tokens: number;
  credits: number;
  createdAt: Date;
}

export interface CreateMessageProps {
  conversationId: string;
  role: MessageRole;
  content: string;
  tokens?: number;
  credits?: number;
}

export class Message {
  private readonly props: MessageProps;

  private constructor(props: MessageProps) {
    this.props = props;
  }

  /**
   * Creates a new Message entity
   * Requirements: 3.2
   */
  static create(createProps: CreateMessageProps): Message {
    // Validate required fields
    if (!createProps.conversationId?.trim()) {
      throw new Error('Conversation ID is required');
    }

    if (!createProps.content?.trim()) {
      throw new Error('Message content is required');
    }

    if (!['user', 'assistant', 'system'].includes(createProps.role)) {
      throw new Error('Invalid message role');
    }

    const props: MessageProps = {
      id: Id.generate(),
      conversationId: createProps.conversationId,
      role: createProps.role,
      content: createProps.content.trim(),
      tokens: createProps.tokens ?? 0,
      credits: createProps.credits ?? 0,
      createdAt: new Date(),
    };

    return new Message(props);
  }

  /**
   * Reconstitutes a Message entity from persistence
   */
  static fromPersistence(props: MessageProps): Message {
    return new Message(props);
  }

  /**
   * Checks if message belongs to a conversation
   * Requirements: 3.2
   */
  belongsToConversation(conversationId: string): boolean {
    return this.props.conversationId === conversationId;
  }

  // Getters
  getId(): Id {
    return this.props.id;
  }

  getConversationId(): string {
    return this.props.conversationId;
  }

  getRole(): MessageRole {
    return this.props.role;
  }

  getContent(): string {
    return this.props.content;
  }

  getTokens(): number {
    return this.props.tokens;
  }

  getCredits(): number {
    return this.props.credits;
  }

  getCreatedAt(): Date {
    return this.props.createdAt;
  }

  /**
   * Converts the entity to a plain object for persistence
   */
  toPersistence(): MessageProps {
    return { ...this.props };
  }
}
