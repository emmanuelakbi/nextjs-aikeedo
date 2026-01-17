import { VerificationTokenRepository } from '../../infrastructure/repositories/VerificationTokenRepository';
import type { VerificationTokenType } from '../../domain/auth/repositories/IVerificationTokenRepository';
import {
  generateVerificationToken,
  generatePasswordResetToken,
  isTokenExpired,
} from './tokens';

/**
 * Token Management Service
 *
 * Provides high-level token management operations including generation,
 * validation, and cleanup.
 * Requirements: 4.1, 4.3, 4.4, 5.1, 5.2, 5.3
 */

export interface TokenValidationResult {
  valid: boolean;
  expired?: boolean;
  notFound?: boolean;
  error?: string;
}

export class TokenManager {
  private repository: VerificationTokenRepository;

  constructor(repository?: VerificationTokenRepository) {
    this.repository = repository || new VerificationTokenRepository();
  }

  /**
   * Creates an email verification token
   * Requirements: 4.1, 4.4
   *
   * @param email - Email address to verify
   * @returns Token string
   */
  async createEmailVerificationToken(email: string): Promise<string> {
    // Delete any existing email verification tokens for this email
    await this.repository.deleteAllForIdentifier(email, 'EMAIL_VERIFICATION');

    // Generate new token
    const { token, expires } = generateVerificationToken();

    // Store in database
    await this.repository.create({
      identifier: email,
      token,
      expires,
      type: 'EMAIL_VERIFICATION',
    });

    return token;
  }

  /**
   * Creates a password reset token
   * Requirements: 5.1, 5.2
   *
   * @param email - Email address for password reset
   * @returns Token string
   */
  async createPasswordResetToken(email: string): Promise<string> {
    // Delete any existing password reset tokens for this email
    await this.repository.deleteAllForIdentifier(email, 'PASSWORD_RESET');

    // Generate new token
    const { token, expires } = generatePasswordResetToken();

    // Store in database
    await this.repository.create({
      identifier: email,
      token,
      expires,
      type: 'PASSWORD_RESET',
    });

    return token;
  }

  /**
   * Validates a verification token
   * Requirements: 4.3, 5.2
   *
   * @param token - Token to validate
   * @param email - Email address associated with token
   * @param type - Type of token to validate
   * @returns Validation result
   */
  async validateToken(
    token: string,
    email: string,
    type: VerificationTokenType
  ): Promise<TokenValidationResult> {
    try {
      // Find token in database
      const verificationToken = await this.repository.findByIdentifierAndToken(
        email,
        token
      );

      if (!verificationToken) {
        return {
          valid: false,
          notFound: true,
          error: 'Token not found',
        };
      }

      // Check token type matches
      if (verificationToken.type !== type) {
        return {
          valid: false,
          error: 'Invalid token type',
        };
      }

      // Check if token is expired
      if (isTokenExpired(verificationToken.expires)) {
        return {
          valid: false,
          expired: true,
          error: 'Token has expired',
        };
      }

      return {
        valid: true,
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Validates and consumes a verification token
   * Requirements: 4.2, 4.3
   *
   * @param token - Token to validate and consume
   * @param email - Email address associated with token
   * @param type - Type of token
   * @returns Validation result
   */
  async validateAndConsumeToken(
    token: string,
    email: string,
    type: VerificationTokenType
  ): Promise<TokenValidationResult> {
    const result = await this.validateToken(token, email, type);

    if (result.valid) {
      // Delete the token after successful validation
      await this.repository.delete(email, token);
    }

    return result;
  }

  /**
   * Invalidates all tokens for an identifier
   * Requirements: 4.4, 5.3
   *
   * @param email - Email address
   * @param type - Optional token type to filter by
   */
  async invalidateAllTokens(
    email: string,
    type?: VerificationTokenType
  ): Promise<void> {
    await this.repository.deleteAllForIdentifier(email, type);
  }

  /**
   * Cleans up expired tokens
   * Requirements: 4.3, 5.2
   *
   * @returns Number of tokens deleted
   */
  async cleanupExpiredTokens(): Promise<number> {
    return await this.repository.deleteExpired();
  }
}

/**
 * Default token manager instance
 */
export const tokenManager = new TokenManager();
