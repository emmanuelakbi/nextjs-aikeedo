import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isAdminSession,
  checkIsAdmin,
  requireAdmin,
  getAdminSession,
  withAdminAuth,
  AdminAccessDeniedError,
} from '../admin-guard';
import type { Session } from 'next-auth';

/**
 * Admin Guard Tests
 *
 * Requirements: Admin Dashboard 2 - Role-based access control
 */

vi.mock('../auth', () => ({
  auth: vi.fn(),
}));

describe('Admin Guard', () => {
  const mockAdminSession: Session = {
    user: {
      id: 'admin-1',
      email: 'admin@example.com',
      role: 'ADMIN',
      firstName: 'Admin',
      lastName: 'User',
    },
    expires: new Date(Date.now() + 86400000).toISOString(),
  };

  const mockUserSession: Session = {
    user: {
      id: 'user-1',
      email: 'user@example.com',
      role: 'USER',
      firstName: 'Regular',
      lastName: 'User',
    },
    expires: new Date(Date.now() + 86400000).toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isAdminSession', () => {
    it('should return true for admin session', () => {
      expect(isAdminSession(mockAdminSession)).toBe(true);
    });

    it('should return false for user session', () => {
      expect(isAdminSession(mockUserSession)).toBe(false);
    });

    it('should return false for null session', () => {
      expect(isAdminSession(null)).toBe(false);
    });

    it('should return false for session without user', () => {
      const invalidSession = {
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as Session;
      expect(isAdminSession(invalidSession)).toBe(false);
    });

    it('should return false for session without role', () => {
      const sessionWithoutRole = {
        user: {
          id: 'user-1',
          email: 'user@example.com',
        },
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as Session;
      expect(isAdminSession(sessionWithoutRole)).toBe(false);
    });
  });

  describe('checkIsAdmin', () => {
    it('should return true when user is admin', async () => {
      const { auth } = await import('../auth');
      vi.mocked(auth).mockResolvedValue(mockAdminSession);

      const result = await checkIsAdmin();

      expect(result).toBe(true);
    });

    it('should return false when user is not admin', async () => {
      const { auth } = await import('../auth');
      vi.mocked(auth).mockResolvedValue(mockUserSession);

      const result = await checkIsAdmin();

      expect(result).toBe(false);
    });

    it('should return false when no session', async () => {
      const { auth } = await import('../auth');
      vi.mocked(auth).mockResolvedValue(null);

      const result = await checkIsAdmin();

      expect(result).toBe(false);
    });
  });

  describe('requireAdmin', () => {
    it('should return session when user is admin', async () => {
      const { auth } = await import('../auth');
      vi.mocked(auth).mockResolvedValue(mockAdminSession);

      const result = await requireAdmin();

      expect(result).toEqual(mockAdminSession);
    });

    it('should throw AdminAccessDeniedError when user is not admin', async () => {
      const { auth } = await import('../auth');
      vi.mocked(auth).mockResolvedValue(mockUserSession);

      await expect(requireAdmin()).rejects.toThrow(AdminAccessDeniedError);
      await expect(requireAdmin()).rejects.toThrow('Admin access required');
    });

    it('should throw AdminAccessDeniedError when no session', async () => {
      const { auth } = await import('../auth');
      vi.mocked(auth).mockResolvedValue(null);

      await expect(requireAdmin()).rejects.toThrow(AdminAccessDeniedError);
      await expect(requireAdmin()).rejects.toThrow('Authentication required');
    });

    it('should throw AdminAccessDeniedError when session has no user', async () => {
      const { auth } = await import('../auth');
      vi.mocked(auth).mockResolvedValue({
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as Session);

      await expect(requireAdmin()).rejects.toThrow(AdminAccessDeniedError);
      await expect(requireAdmin()).rejects.toThrow('Authentication required');
    });
  });

  describe('getAdminSession', () => {
    it('should return session when user is admin', async () => {
      const { auth } = await import('../auth');
      vi.mocked(auth).mockResolvedValue(mockAdminSession);

      const result = await getAdminSession();

      expect(result).toEqual(mockAdminSession);
    });

    it('should return null when user is not admin', async () => {
      const { auth } = await import('../auth');
      vi.mocked(auth).mockResolvedValue(mockUserSession);

      const result = await getAdminSession();

      expect(result).toBeNull();
    });

    it('should return null when no session', async () => {
      const { auth } = await import('../auth');
      vi.mocked(auth).mockResolvedValue(null);

      const result = await getAdminSession();

      expect(result).toBeNull();
    });
  });

  describe('withAdminAuth', () => {
    it('should call handler when user is admin', async () => {
      const { auth } = await import('../auth');
      vi.mocked(auth).mockResolvedValue(mockAdminSession);

      const mockHandler = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );

      const wrappedHandler = withAdminAuth(mockHandler);
      const response = await wrappedHandler('arg1', 'arg2');

      expect(mockHandler).toHaveBeenCalledWith('arg1', 'arg2');
      expect(response.status).toBe(200);
    });

    it('should return 403 when user is not admin', async () => {
      const { auth } = await import('../auth');
      vi.mocked(auth).mockResolvedValue(mockUserSession);

      const mockHandler = vi.fn();
      const wrappedHandler = withAdminAuth(mockHandler);
      const response = await wrappedHandler();

      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data.error).toBe('Forbidden');
      expect(data.message).toBe('Admin access required');
    });

    it('should return 403 when no session', async () => {
      const { auth } = await import('../auth');
      vi.mocked(auth).mockResolvedValue(null);

      const mockHandler = vi.fn();
      const wrappedHandler = withAdminAuth(mockHandler);
      const response = await wrappedHandler();

      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data.error).toBe('Forbidden');
      expect(data.message).toBe('Authentication required');
    });

    it('should propagate non-AdminAccessDeniedError errors', async () => {
      const { auth } = await import('../auth');
      vi.mocked(auth).mockResolvedValue(mockAdminSession);

      const mockError = new Error('Database error');
      const mockHandler = vi.fn().mockRejectedValue(mockError);

      const wrappedHandler = withAdminAuth(mockHandler);

      await expect(wrappedHandler()).rejects.toThrow('Database error');
    });
  });

  describe('AdminAccessDeniedError', () => {
    it('should create error with default message', () => {
      const error = new AdminAccessDeniedError();

      expect(error.message).toBe('Admin access required');
      expect(error.name).toBe('AdminAccessDeniedError');
      expect(error).toBeInstanceOf(Error);
    });

    it('should create error with custom message', () => {
      const error = new AdminAccessDeniedError('Custom message');

      expect(error.message).toBe('Custom message');
      expect(error.name).toBe('AdminAccessDeniedError');
    });
  });
});
