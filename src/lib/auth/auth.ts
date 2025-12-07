import NextAuth from 'next-auth';
import { authConfig } from './config';
import { env } from '../env';

/**
 * NextAuth.js instance
 *
 * Provides authentication with JWT sessions.
 * Requirements: 3.1, 3.2, 3.3, 6.1, 6.2
 */

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  secret: env.NEXTAUTH_SECRET,
});
