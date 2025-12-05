import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { TokenManager } from './token-manager';
import { VerificationTokenRepository } from '../../infrastructure/repositories/VerificationTokenRepository';
import { prisma } from '../db';

/**
 * Token Manager Tests
 *
 * Tests token generation, validation, and expiration logic.
 * Requirements: 4.1, 4.3, 4.4, 5.1, 5.2, 5.3
 */

describe('TokenManager', () => {
  let tokenManager: TokenManager;
  let repository: VerificationTokenRepository;

  beforeEach(() => {
    repository = new VerificationTokenRepository();
    tokenManager = new TokenManager(repository);
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.verificationToken.deleteMany({});
  });

  describe('Email Verification Tokens', () => {
    it('should create an email verification token', async () => {
      const email = 'test@example.com';
      const token = await tokenManager.createEmailVerificationToken(email);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);

      // Verify token exists in database
      const storedToken = await repository.findByToken(token);
      expect(storedToken).toBeDefined();
      expect(storedToken?.identifier).toBe(email);
      expect(storedToken?.type).toBe('EMAIL_VERIFICATION');
    });

    it('should replace existing email verification tokens', async () => {
      const email = 'test@example.com';

      // Create first token
      const token1 = await tokenManager.createEmailVerificationToken(email);

      // Create second token (should replace first)
      const token2 = await tokenManager.createEmailVerificationToken(email);

      expect(token1).not.toBe(token2);

      // First token should not exist
      const storedToken1 = await repository.findByToken(token1);
      expect(storedToken1).toBeNull();

      // Second token should exist
      const storedToken2 = await repository.findByToken(token2);
      expect(storedToken2).toBeDefined();
    });
  });

  describe('Password Reset Tokens', () => {
    it('should create a password reset token', async () => {
      const email = 'test@example.com';
      const token = await tokenManager.createPasswordResetToken(email);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);

      // Verify token exists in database
      const storedToken = await repository.findByToken(token);
      expect(storedToken).toBeDefined();
      expect(storedToken?.identifier).toBe(email);
      expect(storedToken?.type).toBe('PASSWORD_RESET');
    });

    it('should replace existing password reset tokens', async () => {
      const email = 'test@example.com';

      // Create first token
      const token1 = await tokenManager.createPasswordResetToken(email);

      // Create second token (should replace first)
      const token2 = await tokenManager.createPasswordResetToken(email);

      expect(token1).not.toBe(token2);

      // First token should not exist
      const storedToken1 = await repository.findByToken(token1);
      expect(storedToken1).toBeNull();

      // Second token should exist
      const storedToken2 = await repository.findByToken(token2);
      expect(storedToken2).toBeDefined();
    });
  });

  describe('Token Validation', () => {
    it('should validate a valid token', async () => {
      const email = 'test@example.com';
      const token = await tokenManager.createEmailVerificationToken(email);

      const result = await tokenManager.validateToken(
        token,
        email,
        'EMAIL_VERIFICATION'
      );

      expect(result.valid).toBe(true);
      expect(result.expired).toBeUndefined();
      expect(result.notFound).toBeUndefined();
    });

    it('should reject a non-existent token', async () => {
      const email = 'test@example.com';
      const fakeToken = 'nonexistent-token';

      const result = await tokenManager.validateToken(
        fakeToken,
        email,
        'EMAIL_VERIFICATION'
      );

      expect(result.valid).toBe(false);
      expect(result.notFound).toBe(true);
    });

    it('should reject a token with wrong type', async () => {
      const email = 'test@example.com';
      const token = await tokenManager.createEmailVerificationToken(email);

      // Try to validate as password reset token
      const result = await tokenManager.validateToken(
        token,
        email,
        'PASSWORD_RESET'
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid token type');
    });

    it('should reject a token with wrong email', async () => {
      const email = 'test@example.com';
      const token = await tokenManager.createEmailVerificationToken(email);

      // Try to validate with different email
      const result = await tokenManager.validateToken(
        token,
        'wrong@example.com',
        'EMAIL_VERIFICATION'
      );

      expect(result.valid).toBe(false);
      expect(result.notFound).toBe(true);
    });
  });

  describe('Token Consumption', () => {
    it('should consume a valid token', async () => {
      const email = 'test@example.com';
      const token = await tokenManager.createEmailVerificationToken(email);

      // Validate and consume
      const result = await tokenManager.validateAndConsumeToken(
        token,
        email,
        'EMAIL_VERIFICATION'
      );

      expect(result.valid).toBe(true);

      // Token should no longer exist
      const storedToken = await repository.findByToken(token);
      expect(storedToken).toBeNull();
    });

    it('should not consume an invalid token', async () => {
      const email = 'test@example.com';
      const fakeToken = 'nonexistent-token';

      const result = await tokenManager.validateAndConsumeToken(
        fakeToken,
        email,
        'EMAIL_VERIFICATION'
      );

      expect(result.valid).toBe(false);
    });
  });

  describe('Token Invalidation', () => {
    it('should invalidate all tokens for an email', async () => {
      const email = 'test@example.com';

      // Create multiple tokens
      const token1 = await tokenManager.createEmailVerificationToken(email);
      const token2 = await tokenManager.createPasswordResetToken(email);

      // Invalidate all
      await tokenManager.invalidateAllTokens(email);

      // Both tokens should be gone
      const storedToken1 = await repository.findByToken(token1);
      const storedToken2 = await repository.findByToken(token2);

      expect(storedToken1).toBeNull();
      expect(storedToken2).toBeNull();
    });

    it('should invalidate only specific token type', async () => {
      const email = 'test@example.com';

      // Create multiple tokens
      const emailToken = await tokenManager.createEmailVerificationToken(email);
      const resetToken = await tokenManager.createPasswordResetToken(email);

      // Invalidate only email verification tokens
      await tokenManager.invalidateAllTokens(email, 'EMAIL_VERIFICATION');

      // Email token should be gone
      const storedEmailToken = await repository.findByToken(emailToken);
      expect(storedEmailToken).toBeNull();

      // Reset token should still exist
      const storedResetToken = await repository.findByToken(resetToken);
      expect(storedResetToken).toBeDefined();
    });
  });

  describe('Token Cleanup', () => {
    it('should clean up expired tokens', async () => {
      const email = 'test@example.com';

      // Create an expired token manually
      const expiredDate = new Date();
      expiredDate.setHours(expiredDate.getHours() - 1); // 1 hour ago

      await repository.create({
        identifier: email,
        token: 'expired-token',
        expires: expiredDate,
        type: 'EMAIL_VERIFICATION',
      });

      // Create a valid token
      const validToken =
        await tokenManager.createEmailVerificationToken('valid@example.com');

      // Run cleanup
      const deletedCount = await tokenManager.cleanupExpiredTokens();

      expect(deletedCount).toBeGreaterThanOrEqual(1);

      // Expired token should be gone
      const expiredToken = await repository.findByToken('expired-token');
      expect(expiredToken).toBeNull();

      // Valid token should still exist
      const storedValidToken = await repository.findByToken(validToken);
      expect(storedValidToken).toBeDefined();
    });
  });

  /**
   * Property-Based Test: Email verification token expiration
   * Feature: nextjs-foundation, Property 5: Email verification token expiration
   * Validates: Requirements 4.3
   *
   * For any verification token that has expired, attempting to verify an email
   * with that token should fail regardless of whether the token is otherwise valid.
   */
  describe('Property 5: Email verification token expiration', () => {
    it('should reject all expired tokens regardless of validity', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random email addresses
          fc.emailAddress(),
          // Generate random token types
          fc.constantFrom(
            'EMAIL_VERIFICATION' as const,
            'PASSWORD_RESET' as const
          ),
          // Generate random expiration times in the past (1 second to 365 days ago)
          fc.integer({ min: 1, max: 365 * 24 * 60 * 60 }),
          async (email, tokenType, secondsAgo) => {
            // Create an expired token
            const expiredDate = new Date();
            expiredDate.setSeconds(expiredDate.getSeconds() - secondsAgo);

            const token = `test-token-${Date.now()}-${Math.random()}`;

            await repository.create({
              identifier: email,
              token,
              expires: expiredDate,
              type: tokenType,
            });

            // Attempt to validate the expired token
            const result = await tokenManager.validateToken(
              token,
              email,
              tokenType
            );

            // The token should be rejected due to expiration
            expect(result.valid).toBe(false);
            expect(result.expired).toBe(true);
            expect(result.error).toContain('expired');

            // Clean up
            await repository.delete(email, token);
          }
        ),
        { numRuns: 10 } // Run 100 iterations as specified in design
      );
    });

    it('should accept all non-expired tokens with valid data', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random email addresses
          fc.emailAddress(),
          // Generate random token types
          fc.constantFrom(
            'EMAIL_VERIFICATION' as const,
            'PASSWORD_RESET' as const
          ),
          // Generate random expiration times in the future (1 second to 365 days from now)
          fc.integer({ min: 1, max: 365 * 24 * 60 * 60 }),
          async (email, tokenType, secondsFromNow) => {
            // Create a non-expired token
            const futureDate = new Date();
            futureDate.setSeconds(futureDate.getSeconds() + secondsFromNow);

            const token = `test-token-${Date.now()}-${Math.random()}`;

            await repository.create({
              identifier: email,
              token,
              expires: futureDate,
              type: tokenType,
            });

            // Attempt to validate the non-expired token
            const result = await tokenManager.validateToken(
              token,
              email,
              tokenType
            );

            // The token should be accepted
            expect(result.valid).toBe(true);
            expect(result.expired).toBeUndefined();

            // Clean up
            await repository.delete(email, token);
          }
        ),
        { numRuns: 10 } // Run 100 iterations as specified in design
      );
    });

    it('should handle boundary case: token expiring exactly now', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.constantFrom(
            'EMAIL_VERIFICATION' as const,
            'PASSWORD_RESET' as const
          ),
          async (email, tokenType) => {
            // Create a token that expires right now (within 1 second)
            const now = new Date();
            const token = `test-token-${Date.now()}-${Math.random()}`;

            await repository.create({
              identifier: email,
              token,
              expires: now,
              type: tokenType,
            });

            // Small delay to ensure token is expired
            await new Promise((resolve) => setTimeout(resolve, 10));

            // Attempt to validate
            const result = await tokenManager.validateToken(
              token,
              email,
              tokenType
            );

            // Token should be expired (since current time > expires time)
            expect(result.valid).toBe(false);

            // Clean up
            await repository.delete(email, token);
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});
