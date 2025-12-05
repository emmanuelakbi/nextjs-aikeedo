import crypto from 'crypto';

/**
 * Token generation utilities
 *
 * Provides secure token generation for verification and authentication.
 * Requirements: 4.1, 5.1, 6.1
 */

/**
 * Generates a cryptographically secure random token
 * Requirements: 4.1, 5.1
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generates a verification token with expiration
 * Requirements: 4.1, 4.3
 */
export function generateVerificationToken(): { token: string; expires: Date } {
  const token = generateToken(32);
  const expires = new Date();
  expires.setHours(expires.getHours() + 24); // 24 hours expiration

  return { token, expires };
}

/**
 * Generates a password reset token with expiration
 * Requirements: 5.1, 5.2
 */
export function generatePasswordResetToken(): { token: string; expires: Date } {
  const token = generateToken(32);
  const expires = new Date();
  expires.setHours(expires.getHours() + 1); // 1 hour expiration

  return { token, expires };
}

/**
 * Generates a session token
 * Requirements: 6.1
 */
export function generateSessionToken(): string {
  return generateToken(32);
}

/**
 * Checks if a token has expired
 * Requirements: 4.3, 5.2, 6.4
 */
export function isTokenExpired(expires: Date): boolean {
  return new Date() > expires;
}
