/**
 * IVerificationTokenRepository - Domain interface for VerificationToken persistence
 *
 * Defines the contract for VerificationToken data access operations.
 * Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3
 */

export type VerificationTokenType = 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';

export interface VerificationToken {
  identifier: string;
  token: string;
  expires: Date;
  type: VerificationTokenType;
  createdAt: Date;
}

export interface CreateVerificationTokenData {
  identifier: string;
  token: string;
  expires: Date;
  type: VerificationTokenType;
}

export interface IVerificationTokenRepository {
  /**
   * Creates a new verification token
   * @param data - Token creation data
   * @returns The created VerificationToken
   */
  create(data: CreateVerificationTokenData): Promise<VerificationToken>;

  /**
   * Finds a verification token by token value
   * @param token - The token value
   * @returns The VerificationToken or null if not found
   */
  findByToken(token: string): Promise<VerificationToken | null>;

  /**
   * Finds a verification token by identifier and token
   * @param identifier - The identifier (usually email)
   * @param token - The token value
   * @returns The VerificationToken or null if not found
   */
  findByIdentifierAndToken(
    identifier: string,
    token: string
  ): Promise<VerificationToken | null>;

  /**
   * Deletes a verification token
   * @param identifier - The identifier (usually email)
   * @param token - The token value
   */
  delete(identifier: string, token: string): Promise<void>;

  /**
   * Deletes all tokens for an identifier
   * @param identifier - The identifier (usually email)
   * @param type - Optional token type filter
   */
  deleteAllForIdentifier(
    identifier: string,
    type?: VerificationTokenType
  ): Promise<void>;

  /**
   * Deletes expired tokens
   * @returns Number of tokens deleted
   */
  deleteExpired(): Promise<number>;
}
