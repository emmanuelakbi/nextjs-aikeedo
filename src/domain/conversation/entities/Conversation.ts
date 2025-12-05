import { Id } from '../../user/value-objects/Id';

/**
 * Conversation Entity
 *
 * Represents a chat conversation with message history.
 * Requirements: 3.1, 3.3
 */

export interface ConversationProps {
  id: Id;
  workspaceId: string;
  userId: string;
  title: string;
  model: string;
  provider: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateConversationProps {
  workspaceId: string;
  userId: string;
  title: string;
  model: string;
  provider: string;
}

export class Conversation {
  private readonly props: ConversationProps;

  private constructor(props: ConversationProps) {
    this.props = props;
  }

  /**
   * Creates a new Conversation entity
   * Requirements: 3.1
   */
  static create(createProps: CreateConversationProps): Conversation {
    // Validate required fields
    if (!createProps.workspaceId?.trim()) {
      throw new Error('Workspace ID is required');
    }

    if (!createProps.userId?.trim()) {
      throw new Error('User ID is required');
    }

    if (!createProps.title?.trim()) {
      throw new Error('Conversation title is required');
    }

    if (!createProps.model?.trim()) {
      throw new Error('Model is required');
    }

    if (!createProps.provider?.trim()) {
      throw new Error('Provider is required');
    }

    const now = new Date();
    const props: ConversationProps = {
      id: Id.generate(),
      workspaceId: createProps.workspaceId,
      userId: createProps.userId,
      title: createProps.title.trim(),
      model: createProps.model,
      provider: createProps.provider,
      createdAt: now,
      updatedAt: now,
    };

    return new Conversation(props);
  }

  /**
   * Reconstitutes a Conversation entity from persistence
   */
  static fromPersistence(props: ConversationProps): Conversation {
    return new Conversation(props);
  }

  /**
   * Updates the conversation title
   * Requirements: 3.1
   */
  updateTitle(title: string): void {
    const trimmed = title.trim();

    if (!trimmed) {
      throw new Error('Conversation title cannot be empty');
    }

    this.props.title = trimmed;
    this.props.updatedAt = new Date();
  }

  /**
   * Checks if a user owns this conversation
   * Requirements: 3.1
   */
  isOwnedBy(userId: string): boolean {
    return this.props.userId === userId;
  }

  /**
   * Checks if conversation belongs to a workspace
   * Requirements: 3.1
   */
  belongsToWorkspace(workspaceId: string): boolean {
    return this.props.workspaceId === workspaceId;
  }

  // Getters
  getId(): Id {
    return this.props.id;
  }

  getWorkspaceId(): string {
    return this.props.workspaceId;
  }

  getUserId(): string {
    return this.props.userId;
  }

  getTitle(): string {
    return this.props.title;
  }

  getModel(): string {
    return this.props.model;
  }

  getProvider(): string {
    return this.props.provider;
  }

  getCreatedAt(): Date {
    return this.props.createdAt;
  }

  getUpdatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Converts the entity to a plain object for persistence
   */
  toPersistence(): ConversationProps {
    return { ...this.props };
  }
}
