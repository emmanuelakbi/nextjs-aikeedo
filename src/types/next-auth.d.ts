import type { DefaultSession, DefaultUser } from 'next-auth';
import type { DefaultJWT } from 'next-auth/jwt';

/**
 * NextAuth type extensions
 *
 * Extends NextAuth types to include custom user properties.
 * Requirements: 3.1, 3.2, 3.4, 6.1, 6.2, 7.1
 */

/**
 * User role type - shared across all auth types
 */
export type UserRole = 'USER' | 'ADMIN';

/**
 * Extended user properties for session
 */
export interface ExtendedUser {
  id: string;
  role: UserRole;
  currentWorkspaceId: string | null;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

declare module 'next-auth' {
  /**
   * Extended Session type
   * Requirements: 3.1, 3.2
   */
  interface Session {
    user: ExtendedUser;
    expires: string;
  }

  /**
   * Extended User type
   * Requirements: 3.1, 3.2
   */
  interface User extends DefaultUser {
    id: string;
    role: UserRole;
    currentWorkspaceId: string | null;
  }
}

declare module 'next-auth/jwt' {
  /**
   * Extended JWT type
   * Requirements: 3.4, 3.5
   */
  interface JWT extends DefaultJWT {
    id: string;
    role: UserRole;
    currentWorkspaceId: string | null;
  }
}
