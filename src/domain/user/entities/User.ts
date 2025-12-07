import bcryptjs from 'bcryptjs';
import { Id } from '../value-objects/Id';
import { Email } from '../value-objects/Email';
import { Password } from '../value-objects/Password';

/**
 * User Entity
 *
 * Represents a user in the system with authentication and profile management.
 * Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 5.1
 */

export type UserRole = 'USER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface UserProps {
  id: Id;
  email: Email;
  emailVerified: Date | null;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  language: string;
  role: UserRole;
  status: UserStatus;
  apiKey: string | null;
  currentWorkspaceId: string | null;
  lastSeenAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserProps {
  email: Email;
  password: Password;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  language?: string;
  role?: UserRole;
  status?: UserStatus;
}

export class User {
  private readonly props: UserProps;
  private static readonly SALT_ROUNDS =
    process.env.NODE_ENV === 'test' ? 4 : 12;

  private constructor(props: UserProps) {
    this.props = props;
  }

  /**
   * Creates a new User entity
   * Requirements: 3.1, 3.4, 12.1
   */
  static async create(createProps: CreateUserProps): Promise<User> {
    // Validate required fields
    if (!createProps.firstName?.trim()) {
      throw new Error('First name is required');
    }

    if (!createProps.lastName?.trim()) {
      throw new Error('Last name is required');
    }

    // Hash the password
    const passwordHash = await User.hashPassword(createProps.password);

    const now = new Date();
    const props: UserProps = {
      id: Id.generate(),
      email: createProps.email,
      emailVerified: null,
      passwordHash,
      firstName: createProps.firstName.trim(),
      lastName: createProps.lastName.trim(),
      phoneNumber: createProps.phoneNumber?.trim() || null,
      language: createProps.language || 'en-US',
      role: createProps.role || 'USER',
      status: createProps.status || 'ACTIVE',
      apiKey: null,
      currentWorkspaceId: null,
      lastSeenAt: null,
      createdAt: now,
      updatedAt: now,
    };

    return new User(props);
  }

  /**
   * Reconstitutes a User entity from persistence
   */
  static fromPersistence(props: UserProps): User {
    return new User(props);
  }

  /**
   * Hashes a password using bcrypt
   * Requirements: 3.4, 12.1
   */
  static async hashPassword(password: Password): Promise<string> {
    return bcryptjs.hash(password.getValue(), User.SALT_ROUNDS);
  }

  /**
   * Verifies a password against the stored hash
   * Requirements: 3.2, 3.3
   */
  async verifyPassword(password: Password): Promise<boolean> {
    return bcryptjs.compare(password.getValue(), this.props.passwordHash);
  }

  /**
   * Updates the user's password
   * Requirements: 3.4, 7.4
   */
  async updatePassword(
    currentPassword: Password,
    newPassword: Password
  ): Promise<void> {
    // Verify current password
    const isValid = await this.verifyPassword(currentPassword);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash and update new password
    this.props.passwordHash = await User.hashPassword(newPassword);
    this.props.updatedAt = new Date();
  }

  /**
   * Resets the user's password (without requiring current password)
   * Used for password reset flow
   * Requirements: 5.3
   */
  async resetPassword(newPassword: Password): Promise<void> {
    this.props.passwordHash = await User.hashPassword(newPassword);
    this.props.updatedAt = new Date();
  }

  /**
   * Marks the user's email as verified
   * Requirements: 4.1, 4.2
   */
  verifyEmail(): void {
    if (this.props.emailVerified) {
      throw new Error('Email is already verified');
    }

    this.props.emailVerified = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Updates the user's email address
   * Requirements: 7.3
   */
  updateEmail(newEmail: Email): void {
    if (this.props.email.equals(newEmail)) {
      return; // No change needed
    }

    this.props.email = newEmail;
    this.props.emailVerified = null; // Require re-verification
    this.props.updatedAt = new Date();
  }

  /**
   * Updates the user's profile information
   * Requirements: 7.1, 7.2
   */
  updateProfile(data: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string | null;
    language?: string;
  }): void {
    if (data.firstName !== undefined) {
      const trimmed = data.firstName.trim();
      if (!trimmed) {
        throw new Error('First name cannot be empty');
      }
      this.props.firstName = trimmed;
    }

    if (data.lastName !== undefined) {
      const trimmed = data.lastName.trim();
      if (!trimmed) {
        throw new Error('Last name cannot be empty');
      }
      this.props.lastName = trimmed;
    }

    if (data.phoneNumber !== undefined) {
      this.props.phoneNumber = data.phoneNumber?.trim() || null;
    }

    if (data.language !== undefined) {
      this.props.language = data.language;
    }

    this.props.updatedAt = new Date();
  }

  /**
   * Sets the current workspace for the user
   * Requirements: 8.3
   */
  setCurrentWorkspace(workspaceId: string): void {
    this.props.currentWorkspaceId = workspaceId;
    this.props.updatedAt = new Date();
  }

  /**
   * Updates the last seen timestamp
   */
  updateLastSeen(): void {
    this.props.lastSeenAt = new Date();
  }

  /**
   * Suspends the user account
   */
  suspend(): void {
    if (this.props.status === 'SUSPENDED') {
      return;
    }

    this.props.status = 'SUSPENDED';
    this.props.updatedAt = new Date();
  }

  /**
   * Activates the user account
   */
  activate(): void {
    if (this.props.status === 'ACTIVE') {
      return;
    }

    this.props.status = 'ACTIVE';
    this.props.updatedAt = new Date();
  }

  /**
   * Deactivates the user account
   */
  deactivate(): void {
    if (this.props.status === 'INACTIVE') {
      return;
    }

    this.props.status = 'INACTIVE';
    this.props.updatedAt = new Date();
  }

  /**
   * Checks if the user's email is verified
   */
  isEmailVerified(): boolean {
    return this.props.emailVerified !== null;
  }

  /**
   * Checks if the user is active
   */
  isActive(): boolean {
    return this.props.status === 'ACTIVE';
  }

  /**
   * Checks if the user is an admin
   */
  isAdmin(): boolean {
    return this.props.role === 'ADMIN';
  }

  // Getters
  getId(): Id {
    return this.props.id;
  }

  getEmail(): Email {
    return this.props.email;
  }

  getEmailVerified(): Date | null {
    return this.props.emailVerified;
  }

  getPasswordHash(): string {
    return this.props.passwordHash;
  }

  getFirstName(): string {
    return this.props.firstName;
  }

  getLastName(): string {
    return this.props.lastName;
  }

  getFullName(): string {
    return `${this.props.firstName} ${this.props.lastName}`;
  }

  getPhoneNumber(): string | null {
    return this.props.phoneNumber;
  }

  getLanguage(): string {
    return this.props.language;
  }

  getRole(): UserRole {
    return this.props.role;
  }

  getStatus(): UserStatus {
    return this.props.status;
  }

  getApiKey(): string | null {
    return this.props.apiKey;
  }

  getCurrentWorkspaceId(): string | null {
    return this.props.currentWorkspaceId;
  }

  getLastSeenAt(): Date | null {
    return this.props.lastSeenAt;
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
  toPersistence(): UserProps {
    return { ...this.props };
  }
}
