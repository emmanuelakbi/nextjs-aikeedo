import { prisma } from '../../lib/db';
import { Prisma } from '@prisma/client';
import { SessionCacheService } from '../../lib/cache';

/**
 * SessionRepository - Prisma implementation with caching
 *
 * Handles persistence operations for user sessions.
 * Uses caching layer to reduce database load.
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, Performance considerations
 */

export interface Session {
  id: string;
  sessionToken: string;
  userId: string;
  expires: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSessionData {
  sessionToken: string;
  userId: string;
  expires: Date;
}

export class SessionRepository {
  /**
   * Creates a new session
   * Requirements: 6.1
   */
  async create(data: CreateSessionData): Promise<Session> {
    try {
      const session = await prisma.session.create({
        data: {
          sessionToken: data.sessionToken,
          userId: data.userId,
          expires: data.expires,
        },
      });

      // Cache the session
      await SessionCacheService.setSession(session);

      return session;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new Error('A session with this token already exists');
        }
        if (error.code === 'P2003') {
          throw new Error('User does not exist');
        }
      }
      throw new Error(
        `Failed to create session: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Finds a session by session token
   * Requirements: 6.2
   */
  async findByToken(sessionToken: string): Promise<Session | null> {
    try {
      // Try cache first
      const cached = await SessionCacheService.getSession(sessionToken);
      if (cached) {
        return cached;
      }

      // Fall back to database
      const session = await prisma.session.findUnique({
        where: { sessionToken },
      });

      // Cache the result if found
      if (session) {
        await SessionCacheService.setSession(session);
      }

      return session;
    } catch (error) {
      throw new Error(
        `Failed to find session: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Finds all sessions for a user
   * Requirements: 6.2
   */
  async findByUserId(userId: string): Promise<Session[]> {
    try {
      const sessions = await prisma.session.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      return sessions;
    } catch (error) {
      throw new Error(
        `Failed to find sessions by user: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Updates a session
   * Requirements: 6.2
   */
  async update(
    sessionToken: string,
    data: { expires?: Date }
  ): Promise<Session> {
    try {
      const session = await prisma.session.update({
        where: { sessionToken },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });

      return session;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new Error('Session not found');
        }
      }
      throw new Error(
        `Failed to update session: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Deletes a session
   * Requirements: 6.3
   */
  async delete(sessionToken: string): Promise<void> {
    try {
      await prisma.session.delete({
        where: { sessionToken },
      });

      // Remove from cache
      await SessionCacheService.deleteSession(sessionToken);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          // Session not found - this is okay
          await SessionCacheService.deleteSession(sessionToken);
          return;
        }
      }
      throw new Error(
        `Failed to delete session: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Deletes all sessions for a user
   * Requirements: 5.5, 6.3
   */
  async deleteAllForUser(userId: string): Promise<number> {
    try {
      const result = await prisma.session.deleteMany({
        where: { userId },
      });

      // Clear user sessions from cache
      await SessionCacheService.deleteUserSessions(userId);

      return result.count;
    } catch (error) {
      throw new Error(
        `Failed to delete user sessions: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Deletes expired sessions
   * Requirements: 6.4, 6.5
   */
  async deleteExpired(): Promise<number> {
    try {
      const result = await prisma.session.deleteMany({
        where: {
          expires: {
            lt: new Date(),
          },
        },
      });

      return result.count;
    } catch (error) {
      throw new Error(
        `Failed to delete expired sessions: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
