import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT, DefaultJWT } from 'next-auth/jwt';

/**
 * NextAuth type extensions
 *
 * Extends NextAuth types to include custom user properties.
 * Requirements: 6.1, 6.2, 7.1
 */

declare module 'next-auth' {
  /**
   * Extended Session type
   */
  interface Session {
    user: {
      id: string;
      role: 'USER' | 'ADMIN';
      currentWorkspaceId: string | null;
    } & DefaultSession['user'];
  }

  /**
   * Extended User type
   */
  interface User extends DefaultUser {
    role: 'USER' | 'ADMIN';
    currentWorkspaceId: string | null;
  }
}

declare module 'next-auth/jwt' {
  /**
   * Extended JWT type
   */
  interface JWT extends DefaultJWT {
    id: string;
    role: 'USER' | 'ADMIN';
    currentWorkspaceId: string | null;
  }
}
