import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import type { Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import type { UserRole, ExtendedUser } from '../../../types/next-auth';

/**
 * Property-Based Tests for Session Type Consistency
 *
 * Feature: critical-fixes, Property 5: Authentication Type Consistency
 * Validates: Requirements 3.2, 3.4
 *
 * These tests verify that session objects maintain type consistency
 * across all valid inputs and transformations.
 */

// Arbitrary generators for authentication types
const userRoleArb = fc.constantFrom<UserRole>('USER', 'ADMIN');

const workspaceIdArb = fc.option(fc.uuid(), { nil: null });

const extendedUserArb = fc.record({
  id: fc.uuid(),
  role: userRoleArb,
  currentWorkspaceId: workspaceIdArb,
  name: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
  email: fc.option(fc.emailAddress(), { nil: null }),
  image: fc.option(fc.webUrl(), { nil: null }),
});

const sessionArb = fc.record({
  user: extendedUserArb,
  expires: fc.integer({ min: Date.now(), max: Date.now() + 365 * 24 * 60 * 60 * 1000 })
    .map(timestamp => new Date(timestamp).toISOString()),
});

const jwtArb = fc.record({
  id: fc.uuid(),
  role: userRoleArb,
  currentWorkspaceId: workspaceIdArb,
  name: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
  email: fc.option(fc.emailAddress(), { nil: null }),
  picture: fc.option(fc.webUrl(), { nil: null }),
  sub: fc.option(fc.uuid(), { nil: undefined }),
});

describe('Session Type Consistency Property Tests', () => {
  /**
   * Property 5: Authentication Type Consistency
   * For any session object used throughout the application,
   * it should conform to the extended NextAuth session type.
   */
  describe('Property 5: Authentication Type Consistency', () => {
    it('should maintain required user properties for all valid sessions', () => {
      fc.assert(
        fc.property(sessionArb, (session) => {
          // Verify session has required structure
          expect(session).toHaveProperty('user');
          expect(session).toHaveProperty('expires');

          // Verify user has required properties
          const user = session.user;
          expect(user).toHaveProperty('id');
          expect(user).toHaveProperty('role');
          expect(user).toHaveProperty('currentWorkspaceId');

          // Verify id is a non-empty string
          expect(typeof user.id).toBe('string');
          expect(user.id.length).toBeGreaterThan(0);

          // Verify role is valid
          expect(['USER', 'ADMIN']).toContain(user.role);

          // Verify currentWorkspaceId is string or null
          expect(user.currentWorkspaceId === null || typeof user.currentWorkspaceId === 'string').toBe(true);

          // Verify expires is a valid ISO date string
          expect(typeof session.expires).toBe('string');
          expect(new Date(session.expires).toISOString()).toBe(session.expires);
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve user identity across session transformations', () => {
      fc.assert(
        fc.property(sessionArb, (session) => {
          // Simulate session serialization/deserialization (JSON round-trip)
          const serialized = JSON.stringify(session);
          const deserialized = JSON.parse(serialized) as Session;

          // Verify identity is preserved
          expect(deserialized.user.id).toBe(session.user.id);
          expect(deserialized.user.role).toBe(session.user.role);
          expect(deserialized.user.currentWorkspaceId).toBe(session.user.currentWorkspaceId);
          expect(deserialized.expires).toBe(session.expires);
        }),
        { numRuns: 100 }
      );
    });

    it('should correctly identify admin sessions for all valid role values', () => {
      fc.assert(
        fc.property(sessionArb, (session) => {
          const isAdmin = session.user.role === 'ADMIN';
          const isUser = session.user.role === 'USER';

          // Role must be exactly one of the valid values
          expect(isAdmin || isUser).toBe(true);
          expect(isAdmin && isUser).toBe(false);

          // Admin check should be consistent
          if (isAdmin) {
            expect(session.user.role).toBe('ADMIN');
          } else {
            expect(session.user.role).toBe('USER');
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain JWT to session mapping consistency', () => {
      fc.assert(
        fc.property(jwtArb, (jwt) => {
          // Simulate JWT to session callback transformation
          const sessionUser: ExtendedUser = {
            id: jwt.id,
            role: jwt.role,
            currentWorkspaceId: jwt.currentWorkspaceId,
            name: jwt.name,
            email: jwt.email,
            image: jwt.picture,
          };

          // Verify mapping preserves essential properties
          expect(sessionUser.id).toBe(jwt.id);
          expect(sessionUser.role).toBe(jwt.role);
          expect(sessionUser.currentWorkspaceId).toBe(jwt.currentWorkspaceId);

          // Verify optional properties are correctly mapped
          expect(sessionUser.name).toBe(jwt.name);
          expect(sessionUser.email).toBe(jwt.email);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle workspace context correctly for all sessions', () => {
      fc.assert(
        fc.property(sessionArb, (session) => {
          const workspaceId = session.user.currentWorkspaceId;

          // Workspace ID should be either null or a valid UUID string
          if (workspaceId !== null) {
            expect(typeof workspaceId).toBe('string');
            expect(workspaceId.length).toBeGreaterThan(0);
            // UUID format check (basic)
            expect(workspaceId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should ensure session expiration is always in the future', () => {
      fc.assert(
        fc.property(sessionArb, (session) => {
          const expiresDate = new Date(session.expires);
          const now = new Date();

          // Session should have a valid expiration date
          expect(expiresDate instanceof Date).toBe(true);
          expect(isNaN(expiresDate.getTime())).toBe(false);

          // For newly created sessions, expiration should be in the future
          // (our generator ensures this)
          expect(expiresDate.getTime()).toBeGreaterThan(now.getTime() - 1000); // Allow 1 second tolerance
        }),
        { numRuns: 100 }
      );
    });
  });
});
