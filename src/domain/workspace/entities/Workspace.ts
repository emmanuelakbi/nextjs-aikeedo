import { Id } from '../../user/value-objects/Id';

/**
 * Workspace Entity
 *
 * Represents a multi-tenant workspace for organizing users and their data.
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

export interface WorkspaceProps {
  id: Id;
  name: string;
  ownerId: string;
  creditCount: number;
  allocatedCredits: number;
  isTrialed: boolean;
  createdAt: Date;
  updatedAt: Date;
  creditsAdjustedAt: Date | null;
}

export interface CreateWorkspaceProps {
  name: string;
  ownerId: string;
  creditCount?: number;
  isTrialed?: boolean;
}

export class Workspace {
  private readonly props: WorkspaceProps;

  private constructor(props: WorkspaceProps) {
    this.props = props;
  }

  /**
   * Creates a new Workspace entity
   * Requirements: 8.1, 8.2, 8.5
   */
  static create(createProps: CreateWorkspaceProps): Workspace {
    // Validate required fields
    if (!createProps.name?.trim()) {
      throw new Error('Workspace name is required');
    }

    if (!createProps.ownerId?.trim()) {
      throw new Error('Workspace owner ID is required');
    }

    const now = new Date();
    const props: WorkspaceProps = {
      id: Id.generate(),
      name: createProps.name.trim(),
      ownerId: createProps.ownerId,
      creditCount: createProps.creditCount ?? 0,
      allocatedCredits: 0,
      isTrialed: createProps.isTrialed ?? false,
      createdAt: now,
      updatedAt: now,
      creditsAdjustedAt: null,
    };

    return new Workspace(props);
  }

  /**
   * Reconstitutes a Workspace entity from persistence
   */
  static fromPersistence(props: WorkspaceProps): Workspace {
    return new Workspace(props);
  }

  /**
   * Adds credits to the workspace
   * Requirements: 8.5
   */
  addCredits(amount: number): void {
    if (amount <= 0) {
      throw new Error('Credit amount must be positive');
    }

    if (!Number.isInteger(amount)) {
      throw new Error('Credit amount must be an integer');
    }

    this.props.creditCount += amount;
    this.props.creditsAdjustedAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Removes credits from the workspace
   * Requirements: 8.5
   */
  removeCredits(amount: number): void {
    if (amount <= 0) {
      throw new Error('Credit amount must be positive');
    }

    if (!Number.isInteger(amount)) {
      throw new Error('Credit amount must be an integer');
    }

    if (this.props.creditCount < amount) {
      throw new Error('Insufficient credits');
    }

    this.props.creditCount -= amount;
    this.props.creditsAdjustedAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Allocates credits for use
   * Requirements: 8.5
   */
  allocateCredits(amount: number): void {
    if (amount <= 0) {
      throw new Error('Allocation amount must be positive');
    }

    if (!Number.isInteger(amount)) {
      throw new Error('Allocation amount must be an integer');
    }

    const availableCredits =
      this.props.creditCount - this.props.allocatedCredits;

    if (availableCredits < amount) {
      throw new Error('Insufficient available credits for allocation');
    }

    this.props.allocatedCredits += amount;
    this.props.updatedAt = new Date();
  }

  /**
   * Releases allocated credits back to available pool
   * Requirements: 8.5
   */
  releaseCredits(amount: number): void {
    if (amount <= 0) {
      throw new Error('Release amount must be positive');
    }

    if (!Number.isInteger(amount)) {
      throw new Error('Release amount must be an integer');
    }

    if (this.props.allocatedCredits < amount) {
      // Log the issue but release what we can instead of throwing
      console.warn(
        `[Workspace] Attempting to release ${amount} credits but only ${this.props.allocatedCredits} are allocated. ` +
          `Releasing ${this.props.allocatedCredits} instead. Workspace: ${this.props.id.getValue()}`
      );
      // Release all allocated credits instead of throwing
      this.props.allocatedCredits = 0;
    } else {
      this.props.allocatedCredits -= amount;
    }

    this.props.updatedAt = new Date();
  }

  /**
   * Consumes allocated credits (removes from both allocated and total)
   * Requirements: 8.5
   */
  consumeCredits(amount: number): void {
    if (amount <= 0) {
      throw new Error('Consumption amount must be positive');
    }

    if (!Number.isInteger(amount)) {
      throw new Error('Consumption amount must be an integer');
    }

    if (this.props.allocatedCredits < amount) {
      throw new Error('Cannot consume more credits than allocated');
    }

    if (this.props.creditCount < amount) {
      throw new Error('Insufficient total credits');
    }

    this.props.allocatedCredits -= amount;
    this.props.creditCount -= amount;
    this.props.creditsAdjustedAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Updates the workspace name
   * Requirements: 8.4
   */
  updateName(name: string): void {
    const trimmed = name.trim();

    if (!trimmed) {
      throw new Error('Workspace name cannot be empty');
    }

    this.props.name = trimmed;
    this.props.updatedAt = new Date();
  }

  /**
   * Transfers ownership to another user
   * Requirements: 8.2
   */
  transferOwnership(newOwnerId: string): void {
    if (!newOwnerId?.trim()) {
      throw new Error('New owner ID is required');
    }

    if (this.props.ownerId === newOwnerId) {
      return; // No change needed
    }

    this.props.ownerId = newOwnerId;
    this.props.updatedAt = new Date();
  }

  /**
   * Marks the workspace as having used its trial
   */
  markAsTrialed(): void {
    if (this.props.isTrialed) {
      return; // Already trialed
    }

    this.props.isTrialed = true;
    this.props.updatedAt = new Date();
  }

  /**
   * Gets available credits (total - allocated)
   * Requirements: 8.5
   */
  getAvailableCredits(): number {
    return this.props.creditCount - this.props.allocatedCredits;
  }

  /**
   * Checks if the workspace has sufficient available credits
   * Requirements: 8.5
   */
  hasAvailableCredits(amount: number): boolean {
    return this.getAvailableCredits() >= amount;
  }

  /**
   * Checks if a user is the owner of this workspace
   * Requirements: 8.2
   */
  isOwnedBy(userId: string): boolean {
    return this.props.ownerId === userId;
  }

  // Getters
  getId(): Id {
    return this.props.id;
  }

  getName(): string {
    return this.props.name;
  }

  getOwnerId(): string {
    return this.props.ownerId;
  }

  getCreditCount(): number {
    return this.props.creditCount;
  }

  getAllocatedCredits(): number {
    return this.props.allocatedCredits;
  }

  getIsTrialed(): boolean {
    return this.props.isTrialed;
  }

  getCreatedAt(): Date {
    return this.props.createdAt;
  }

  getUpdatedAt(): Date {
    return this.props.updatedAt;
  }

  getCreditsAdjustedAt(): Date | null {
    return this.props.creditsAdjustedAt;
  }

  /**
   * Converts the entity to a plain object for persistence
   */
  toPersistence(): WorkspaceProps {
    return { ...this.props };
  }
}
