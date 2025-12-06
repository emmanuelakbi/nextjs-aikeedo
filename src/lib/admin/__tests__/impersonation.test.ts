import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  startImpersonation,
  endImpersonation,
  getImpersonationSession,
  isImpersonationSession,
  getAdminImpersonationSessions,
  cleanupExpiredSessions,
} from '../impersonation';
import prisma from '@/lib/db/prisma';

// Mock prisma
vi.mock('@/lib/db/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
    adminAction: {
      create: vi.fn(),
    },
  },
}));

describe('Impersonation Service', () => {
  const mockAdminId = 'admin-123';
  const mockUserId = 'user-456';
  const mockUser = {
    id: mockUserId,
    email: 'user@example.com',
    role: 'USER',
    status: 'ACTIVE',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up all sessions after each test
    const sessions = getAdminImpersonationSessions(mockAdminId);
    for (const session of sessions) {
      try {
        await endImpersonation(session.id);
      } catch (e) {
        // Ignore errors during cleanup
      }
    }
    // Also cleanup any other admin's sessions
    const otherSessions = getAdminImpersonationSessions('other-admin');
    for (const session of otherSessions) {
      try {
        await endImpersonation(session.id);
      } catch (e) {
        // Ignore errors during cleanup
      }
    }
  });

  describe('startImpersonation', () => {
    it('should create an impersonation session for valid user', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.adminAction.create).mockResolvedValue({} as any);

      const session = await startImpersonation(mockAdminId, mockUserId);

      expect(session).toBeDefined();
      expect(session.adminId).toBe(mockAdminId);
      expect(session.targetUserId).toBe(mockUserId);
      expect(session.id).toContain('imp_');
      expect(session.expiresAt).toBeInstanceOf(Date);
      expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('should throw error if user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(startImpersonation(mockAdminId, mockUserId)).rejects.toThrow(
        'Target user not found'
      );
    });

    it('should throw error if trying to impersonate admin', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        ...mockUser,
        role: 'ADMIN',
      } as any);

      await expect(startImpersonation(mockAdminId, mockUserId)).rejects.toThrow(
        'Cannot impersonate admin users'
      );
    });

    it('should throw error if user is inactive', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        ...mockUser,
        status: 'SUSPENDED',
      } as any);

      await expect(startImpersonation(mockAdminId, mockUserId)).rejects.toThrow(
        'Cannot impersonate inactive users'
      );
    });

    it('should log the impersonation start action', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.adminAction.create).mockResolvedValue({} as any);

      await startImpersonation(
        mockAdminId,
        mockUserId,
        '127.0.0.1',
        'test-agent'
      );

      expect(prisma.adminAction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            adminId: mockAdminId,
            action: 'user.impersonate.start',
            targetType: 'user',
            targetId: mockUserId,
            ipAddress: '127.0.0.1',
            userAgent: 'test-agent',
          }),
        })
      );
    });
  });

  describe('getImpersonationSession', () => {
    it('should return session if valid and not expired', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.adminAction.create).mockResolvedValue({} as any);

      const session = await startImpersonation(mockAdminId, mockUserId);
      const retrieved = getImpersonationSession(session.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(session.id);
    });

    it('should return null if session not found', () => {
      const retrieved = getImpersonationSession('invalid-session-id');
      expect(retrieved).toBeNull();
    });

    it('should return null and cleanup if session expired', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.adminAction.create).mockResolvedValue({} as any);

      const session = await startImpersonation(mockAdminId, mockUserId);

      // Manually expire the session
      session.expiresAt = new Date(Date.now() - 1000);

      const retrieved = getImpersonationSession(session.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('endImpersonation', () => {
    it('should end an active impersonation session', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.adminAction.create).mockResolvedValue({} as any);

      const session = await startImpersonation(mockAdminId, mockUserId);

      await endImpersonation(session.id);

      const retrieved = getImpersonationSession(session.id);
      expect(retrieved).toBeNull();
    });

    it('should throw error if session not found', async () => {
      await expect(endImpersonation('invalid-session-id')).rejects.toThrow(
        'Impersonation session not found'
      );
    });

    it('should log the impersonation end action', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.adminAction.create).mockResolvedValue({} as any);

      const session = await startImpersonation(mockAdminId, mockUserId);

      await endImpersonation(session.id, '127.0.0.1', 'test-agent');

      // Should be called twice: once for start, once for end
      expect(prisma.adminAction.create).toHaveBeenCalledTimes(2);
      expect(prisma.adminAction.create).toHaveBeenLastCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            adminId: mockAdminId,
            action: 'user.impersonate.end',
            targetType: 'user',
            targetId: mockUserId,
            ipAddress: '127.0.0.1',
            userAgent: 'test-agent',
          }),
        })
      );
    });
  });

  describe('isImpersonationSession', () => {
    it('should return true for impersonation session IDs', () => {
      expect(isImpersonationSession('imp_admin_user_123')).toBe(true);
    });

    it('should return false for regular session IDs', () => {
      expect(isImpersonationSession('regular-session-id')).toBe(false);
    });
  });

  describe('getAdminImpersonationSessions', () => {
    it('should return all active sessions for an admin', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.adminAction.create).mockResolvedValue({} as any);

      await startImpersonation(mockAdminId, 'user-1');
      await startImpersonation(mockAdminId, 'user-2');
      await startImpersonation('other-admin', 'user-3');

      const sessions = getAdminImpersonationSessions(mockAdminId);

      expect(sessions).toHaveLength(2);
      expect(sessions.every((s) => s.adminId === mockAdminId)).toBe(true);
    });

    it('should not return expired sessions', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.adminAction.create).mockResolvedValue({} as any);

      const session = await startImpersonation(mockAdminId, mockUserId);

      // Manually expire the session
      session.expiresAt = new Date(Date.now() - 1000);

      const sessions = getAdminImpersonationSessions(mockAdminId);
      expect(sessions).toHaveLength(0);
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should remove expired sessions', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.adminAction.create).mockResolvedValue({} as any);

      const session1 = await startImpersonation(mockAdminId, 'user-1');
      const session2 = await startImpersonation(mockAdminId, 'user-2');

      // Expire session1
      session1.expiresAt = new Date(Date.now() - 1000);

      cleanupExpiredSessions();

      expect(getImpersonationSession(session1.id)).toBeNull();
      expect(getImpersonationSession(session2.id)).toBeDefined();
    });
  });
});
