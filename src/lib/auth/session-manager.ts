import { SessionRepository } from '../../infrastructure/repositories/SessionRepository';
import { generateSessionToken } from './tokens';
import { env } from '../env';

/**
 * Session Manager
 *
 * Provides utilities for managing user sessions including "remember me" functionality.
 * Requirements: 6.2, 6.3, 6.4, 6.5
 */

export interface CreateSessionOptions {
  userId: string;
  rememberMe?: boolean;
}

export interface SessionInfo {
  sessionToken: string;
  expires: Date;
}

/**
 * Session duration constants
 */
const SESSION_DURATION = {
  DEFAULT: env.SESSION_MAX_AGE, // 30 days in seconds
  REMEMBER_ME: 90 * 24 * 60 * 60, // 90 days in seconds
  SHORT: 24 * 60 * 60, // 24 hours in seconds
};

/**
 * Creates a new session with optional "remember me" functionality
 * Requirements: 6.1, 6.2
 */
export async function createSession(
  options: CreateSessionOptions
): Promise<SessionInfo> {
  const sessionRepository = new SessionRepository();

  // Generate unique session token
  const sessionToken = generateSessionToken();

  // Calculate expiration based on "remember me" option
  const maxAge = options.rememberMe
    ? SESSION_DURATION.REMEMBER_ME
    : SESSION_DURATION.DEFAULT;

  const expires = new Date(Date.now() + maxAge * 1000);

  // Create session in database
  await sessionRepository.create({
    sessionToken,
    userId: options.userId,
    expires,
  });

  return {
    sessionToken,
    expires,
  };
}

/**
 * Extends an existing session's expiration time
 * Requirements: 6.2
 */
export async function extendSession(
  sessionToken: string,
  rememberMe: boolean = false
): Promise<Date> {
  const sessionRepository = new SessionRepository();

  // Calculate new expiration
  const maxAge = rememberMe
    ? SESSION_DURATION.REMEMBER_ME
    : SESSION_DURATION.DEFAULT;

  const newExpires = new Date(Date.now() + maxAge * 1000);

  // Update session expiration
  const session = await sessionRepository.update(sessionToken, {
    expires: newExpires,
  });

  return session.expires;
}

/**
 * Invalidates a specific session
 * Requirements: 6.3
 */
export async function invalidateSession(sessionToken: string): Promise<void> {
  const sessionRepository = new SessionRepository();
  await sessionRepository.delete(sessionToken);
}

/**
 * Invalidates all sessions for a user
 * Requirements: 5.5, 6.3
 */
export async function invalidateAllUserSessions(
  userId: string
): Promise<number> {
  const sessionRepository = new SessionRepository();
  return await sessionRepository.deleteAllForUser(userId);
}

/**
 * Checks if a session is valid (exists and not expired)
 * Requirements: 6.2, 6.4
 */
export async function isSessionValid(sessionToken: string): Promise<boolean> {
  const sessionRepository = new SessionRepository();
  const session = await sessionRepository.findByToken(sessionToken);

  if (!session) {
    return false;
  }

  // Check if session has expired
  if (session.expires < new Date()) {
    // Clean up expired session
    await sessionRepository.delete(sessionToken);
    return false;
  }

  return true;
}

/**
 * Cleans up expired sessions
 * Requirements: 6.4, 6.5
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const sessionRepository = new SessionRepository();
  return await sessionRepository.deleteExpired();
}

/**
 * Gets all active sessions for a user
 * Requirements: 6.2
 */
export async function getUserSessions(userId: string) {
  const sessionRepository = new SessionRepository();
  const sessions = await sessionRepository.findByUserId(userId);

  // Filter out expired sessions
  const now = new Date();
  return sessions.filter((session) => session.expires > now);
}

/**
 * Gets session duration options
 */
export function getSessionDurations() {
  return {
    default: SESSION_DURATION.DEFAULT,
    rememberMe: SESSION_DURATION.REMEMBER_ME,
    short: SESSION_DURATION.SHORT,
  };
}
