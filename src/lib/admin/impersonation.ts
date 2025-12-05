import prisma from '@/lib/db/prisma';
import { logAdminAction } from './audit-logger';

/**
 * Impersonation Service
 *
 * Requirements: Admin Dashboard 1 - User Management (Impersonate users for support)
 *
 * Allows administrators to impersonate users for support purposes with time limits
 * and comprehensive audit logging.
 */

export interface ImpersonationSession {
  id: string;
  adminId: string;
  targetUserId: string;
  expiresAt: Date;
  createdAt: Date;
}

const IMPERSONATION_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
const IMPERSONATION_SESSIONS = new Map<string, ImpersonationSession>();

/**
 * Starts an impersonation session
 *
 * @param adminId - The ID of the admin starting the impersonation
 * @param targetUserId - The ID of the user to impersonate
 * @param ipAddress - The IP address of the admin
 * @param userAgent - The user agent of the admin
 * @returns The impersonation session
 *
 * @throws Error if target user is not found or is an admin
 */
export async function startImpersonation(
  adminId: string,
  targetUserId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<ImpersonationSession> {
  // Verify target user exists and is not an admin
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, email: true, role: true, status: true },
  });

  if (!targetUser) {
    throw new Error('Target user not found');
  }

  if (targetUser.role === 'ADMIN') {
    throw new Error('Cannot impersonate admin users');
  }

  if (targetUser.status !== 'ACTIVE') {
    throw new Error('Cannot impersonate inactive users');
  }

  // Create impersonation session
  const sessionId = `imp_${adminId}_${targetUserId}_${Date.now()}`;
  const expiresAt = new Date(Date.now() + IMPERSONATION_DURATION);

  const session: ImpersonationSession = {
    id: sessionId,
    adminId,
    targetUserId,
    expiresAt,
    createdAt: new Date(),
  };

  IMPERSONATION_SESSIONS.set(sessionId, session);

  // Log the impersonation start
  await logAdminAction({
    adminId,
    action: 'user.impersonate.start',
    targetType: 'user',
    targetId: targetUserId,
    changes: {
      sessionId,
      expiresAt: expiresAt.toISOString(),
    },
    ipAddress,
    userAgent,
  });

  return session;
}

/**
 * Ends an impersonation session
 *
 * @param sessionId - The ID of the impersonation session
 * @param ipAddress - The IP address of the admin
 * @param userAgent - The user agent of the admin
 */
export async function endImpersonation(
  sessionId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const session = IMPERSONATION_SESSIONS.get(sessionId);

  if (!session) {
    throw new Error('Impersonation session not found');
  }

  // Remove session
  IMPERSONATION_SESSIONS.delete(sessionId);

  // Log the impersonation end
  await logAdminAction({
    adminId: session.adminId,
    action: 'user.impersonate.end',
    targetType: 'user',
    targetId: session.targetUserId,
    changes: {
      sessionId,
      duration: Date.now() - session.createdAt.getTime(),
    },
    ipAddress,
    userAgent,
  });
}

/**
 * Gets an active impersonation session
 *
 * @param sessionId - The ID of the impersonation session
 * @returns The impersonation session or null if not found or expired
 */
export function getImpersonationSession(
  sessionId: string
): ImpersonationSession | null {
  const session = IMPERSONATION_SESSIONS.get(sessionId);

  if (!session) {
    return null;
  }

  // Check if session is expired
  if (session.expiresAt < new Date()) {
    IMPERSONATION_SESSIONS.delete(sessionId);
    return null;
  }

  return session;
}

/**
 * Checks if a session ID is an impersonation session
 *
 * @param sessionId - The session ID to check
 * @returns True if the session is an impersonation session
 */
export function isImpersonationSession(sessionId: string): boolean {
  return sessionId.startsWith('imp_');
}

/**
 * Gets all active impersonation sessions for an admin
 *
 * @param adminId - The ID of the admin
 * @returns Array of active impersonation sessions
 */
export function getAdminImpersonationSessions(
  adminId: string
): ImpersonationSession[] {
  const sessions: ImpersonationSession[] = [];
  const now = new Date();

  for (const [sessionId, session] of IMPERSONATION_SESSIONS.entries()) {
    if (session.adminId === adminId && session.expiresAt > now) {
      sessions.push(session);
    }
  }

  return sessions;
}

/**
 * Cleans up expired impersonation sessions
 * Should be called periodically
 */
export function cleanupExpiredSessions(): void {
  const now = new Date();

  for (const [sessionId, session] of IMPERSONATION_SESSIONS.entries()) {
    if (session.expiresAt < now) {
      IMPERSONATION_SESSIONS.delete(sessionId);
    }
  }
}

// Cleanup expired sessions every 5 minutes
setInterval(cleanupExpiredSessions, 5 * 60 * 1000);
