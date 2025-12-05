import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { Password } from '../../domain/user/value-objects/Password';
import { env } from '../env';

/**
 * NextAuth.js Configuration
 *
 * Configures authentication with credentials provider and database sessions.
 * Requirements: 3.1, 3.2, 3.3, 6.1, 6.2
 */

// Login credentials schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      /**
       * Authorize function - validates credentials and returns user
       * Requirements: 3.2, 3.3
       */
      async authorize(credentials) {
        try {
          // Validate input
          const parsed = loginSchema.safeParse(credentials);
          if (!parsed.success) {
            return null;
          }

          const { email, password } = parsed.data;

          // Find user by email
          const userRepository = new UserRepository();
          const user = await userRepository.findByEmail(email);

          if (!user) {
            // User not found
            return null;
          }

          // Verify password (don't validate complexity during login, just check hash)
          const bcrypt = await import('bcrypt');
          const isValid = await bcrypt.compare(password, user.getPasswordHash());

          if (!isValid) {
            // Invalid password
            return null;
          }

          // Check if user is active
          if (!user.isActive()) {
            throw new Error('Account is not active');
          }

          // Update last seen
          user.updateLastSeen();
          await userRepository.save(user);

          // Return user data for session
          return {
            id: user.getId().getValue(),
            email: user.getEmail().getValue(),
            name: user.getFullName(),
            role: user.getRole(),
            emailVerified: user.getEmailVerified(),
            currentWorkspaceId: user.getCurrentWorkspaceId(),
          };
        } catch (error) {
          console.error('Authorization error:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/dashboard',
  },
  session: {
    strategy: 'jwt',
    maxAge: env.SESSION_MAX_AGE, // 30 days by default
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    /**
     * JWT callback - adds user data to token
     * Requirements: 6.1, 6.2
     */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.currentWorkspaceId = user.currentWorkspaceId;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    /**
     * Session callback - adds user data from token to session
     * Requirements: 6.1, 6.2
     */
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = (token.role as 'USER' | 'ADMIN') || 'USER';
        session.user.currentWorkspaceId = (token.currentWorkspaceId as
          | string
          | null) ?? null;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  events: {
    /**
     * Sign in event - update last seen timestamp
     */
    async signIn({ user }) {
      if (user.id) {
        const userRepository = new UserRepository();
        const userEntity = await userRepository.findById(user.id);
        if (userEntity) {
          userEntity.updateLastSeen();
          await userRepository.save(userEntity);
        }
      }
    },
  },
  debug: env.NODE_ENV === 'development',
};
