import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '../db';
import { authConfig } from './config';
import { env } from '../env';

/**
 * NextAuth.js instance with Prisma adapter
 *
 * Provides authentication with database sessions and Prisma ORM integration.
 * Requirements: 3.1, 3.2, 3.3, 6.1, 6.2
 */

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma) as any,
  ...authConfig,
  secret: env.NEXTAUTH_SECRET,
});
