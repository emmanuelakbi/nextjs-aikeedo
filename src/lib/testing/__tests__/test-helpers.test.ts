import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../../db';
import {
  createTestUser,
  createTestWorkspace,
  createTestSession,
  createTestVerificationToken,
  cleanupTestData,
  randomEmail,
  randomString,
} from '../test-helpers';

describe('Test Helpers', () => {
  beforeEach(async () => {
    await cleanupTestData(prisma);
  });

  describe('createTestUser', () => {
    it('should create a user with default values', async () => {
      const { user, password } = await createTestUser(prisma);

      expect(user.id).toBeDefined();
      expect(user.email).toMatch(/@example\.com$/);
      expect(user.firstName).toBe('Test');
      expect(user.lastName).toBe('User');
      expect(user.passwordHash).toBeDefined();
      expect(password).toBeDefined();
    });

    it('should create a user with custom values', async () => {
      const customEmail = 'custom@example.com';
      const { user } = await createTestUser(prisma, {
        email: customEmail,
        firstName: 'Custom',
        lastName: 'Name',
      });

      expect(user.email).toBe(customEmail);
      expect(user.firstName).toBe('Custom');
      expect(user.lastName).toBe('Name');
    });
  });

  describe('createTestWorkspace', () => {
    it('should create a workspace for a user', async () => {
      const { user } = await createTestUser(prisma);
      const workspace = await createTestWorkspace(prisma, user.id);

      expect(workspace.id).toBeDefined();
      expect(workspace.ownerId).toBe(user.id);
      expect(workspace.creditCount).toBe(0);
      expect(workspace.allocatedCredits).toBe(0);
    });

    it('should create a workspace with custom values', async () => {
      const { user } = await createTestUser(prisma);
      const workspace = await createTestWorkspace(prisma, user.id, {
        name: 'Custom Workspace',
        creditCount: 100,
      });

      expect(workspace.name).toBe('Custom Workspace');
      expect(workspace.creditCount).toBe(100);
    });
  });

  describe('createTestSession', () => {
    it('should create a session for a user', async () => {
      const { user } = await createTestUser(prisma);
      const session = await createTestSession(prisma, user.id);

      expect(session.id).toBeDefined();
      expect(session.userId).toBe(user.id);
      expect(session.sessionToken).toBeDefined();
      expect(session.expires).toBeInstanceOf(Date);
    });
  });

  describe('createTestVerificationToken', () => {
    it('should create a verification token', async () => {
      const email = 'test@example.com';
      const token = await createTestVerificationToken(prisma, email);

      expect(token.identifier).toBe(email);
      expect(token.token).toBeDefined();
      expect(token.expires).toBeInstanceOf(Date);
      expect(token.type).toBe('EMAIL_VERIFICATION');
    });

    it('should create a password reset token', async () => {
      const email = 'test@example.com';
      const token = await createTestVerificationToken(prisma, email, {
        type: 'PASSWORD_RESET',
      });

      expect(token.type).toBe('PASSWORD_RESET');
    });
  });

  describe('randomEmail', () => {
    it('should generate a valid email', () => {
      const email = randomEmail();
      expect(email).toMatch(/@example\.com$/);
    });

    it('should generate unique emails', () => {
      const email1 = randomEmail();
      const email2 = randomEmail();
      expect(email1).not.toBe(email2);
    });
  });

  describe('randomString', () => {
    it('should generate a string of specified length', () => {
      const str = randomString(10);
      expect(str.length).toBeLessThanOrEqual(10);
    });

    it('should generate unique strings', () => {
      const str1 = randomString();
      const str2 = randomString();
      expect(str1).not.toBe(str2);
    });
  });
});
