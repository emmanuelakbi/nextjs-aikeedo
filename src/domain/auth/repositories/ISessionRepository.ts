/**
 * ISessionRepository - Domain interface for Session persistence
 *
 * Defines the contract for Session data access operations.
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
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

export interface ISessionRepository {
  /**
   * Creates a new session
   * @param data - Session creation data
   * @returns The created Session
   */
  create(data: CreateSessionData): Promise<Session>;

  /**
   * Finds a session by session token
   * @param sessionToken - The session token
   * @returns The Session or null if not found
   */
  findByToken(sessionToken: string): Promise<Session | null>;

  /**
   * Finds all sessions for a user
   * @param userId - The user ID
   * @returns Array of Sessions for the user
   */
  findByUserId(userId: string): Promise<Session[]>;

  /**
   * Updates a session
   * @param sessionToken - The session token
   * @param data - Session update data
   * @returns The updated Session
   */
  update(sessionToken: string, data: { expires?: Date }): Promise<Session>;

  /**
   * Deletes a session
   * @param sessionToken - The session token
   */
  delete(sessionToken: string): Promise<void>;

  /**
   * Deletes all sessions for a user
   * @param userId - The user ID
   * @returns Number of sessions deleted
   */
  deleteAllForUser(userId: string): Promise<number>;

  /**
   * Deletes expired sessions
   * @returns Number of sessions deleted
   */
  deleteExpired(): Promise<number>;
}
