import {
  IVerificationTokenRepository,
  VerificationToken,
  VerificationTokenType,
  CreateVerificationTokenData,
} from '../../domain/auth/repositories/IVerificationTokenRepository';
import { prisma } from '../../lib/db';
import { Prisma } from '@prisma/client';

/**
 * VerificationTokenRepository - Prisma implementation
 *
 * Handles persistence operations for verification tokens.
 * Requirements: 4.1, 4.3, 5.1, 5.2
 */

export class VerificationTokenRepository implements IVerificationTokenRepository {
  /**
   * Creates a new verification token
   * Requirements: 4.1, 5.1
   */
  async create(data: CreateVerificationTokenData): Promise<VerificationToken> {
    try {
      const token = await prisma.verificationToken.create({
        data: {
          identifier: data.identifier,
          token: data.token,
          expires: data.expires,
          type: data.type,
        },
      });

      return token;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new Error('A token with this value already exists');
        }
      }
      throw new Error(
        `Failed to create verification token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Finds a verification token by token value
   * Requirements: 4.2, 5.2
   */
  async findByToken(token: string): Promise<VerificationToken | null> {
    try {
      const verificationToken = await prisma.verificationToken.findUnique({
        where: { token },
      });

      return verificationToken;
    } catch (error) {
      throw new Error(
        `Failed to find verification token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Finds a verification token by identifier and token
   * Requirements: 4.2, 5.2
   */
  async findByIdentifierAndToken(
    identifier: string,
    token: string
  ): Promise<VerificationToken | null> {
    try {
      const verificationToken = await prisma.verificationToken.findUnique({
        where: {
          identifier_token: {
            identifier,
            token,
          },
        },
      });

      return verificationToken;
    } catch (error) {
      throw new Error(
        `Failed to find verification token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Deletes a verification token
   * Requirements: 4.2, 5.3
   */
  async delete(identifier: string, token: string): Promise<void> {
    try {
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier,
            token,
          },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          // Token not found - this is okay
          return;
        }
      }
      throw new Error(
        `Failed to delete verification token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Deletes all tokens for an identifier
   * Requirements: 4.4, 5.2
   */
  async deleteAllForIdentifier(
    identifier: string,
    type?: VerificationTokenType
  ): Promise<void> {
    try {
      await prisma.verificationToken.deleteMany({
        where: {
          identifier,
          ...(type && { type }),
        },
      });
    } catch (error) {
      throw new Error(
        `Failed to delete verification tokens: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Deletes expired tokens
   * Requirements: 4.3, 5.2
   */
  async deleteExpired(): Promise<number> {
    try {
      const result = await prisma.verificationToken.deleteMany({
        where: {
          expires: {
            lt: new Date(),
          },
        },
      });

      return result.count;
    } catch (error) {
      throw new Error(
        `Failed to delete expired tokens: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
