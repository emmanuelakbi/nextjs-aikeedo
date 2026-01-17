import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Session } from 'next-auth';

/**
 * Admin Guard Tests
 *
 * Requirements: Admin Dashboard 2 - Role-based access control
 * Requirements: 3.3 - Authentication test type alignment
 */

// Mock the auth module - factory must not reference external variables
vi.mock('../auth', () => ({
  auth: vi.fn(),
}));

// Import after mock setup
import {
  isAdminSession,
  checkIsAdmin,
  requireAdmin,
  getAdminSession,
  withAdminAuth,
  AdminAccessDeniedError,
} from '../admin-guard';
import { auth } from '../auth';

// Type the mocked auth function
const mockedAuth = auth as unknown as ReturnType<typeof vi.fn> & {
  mockResolvedValue: (value: Session | null) => void;
  mockClear: () => void;
};

describe('Admin Guard', () => {
  const mockAdminSession: Session = {
    user: {
      id: 'admin-1',
      email: 'admin@example.com',
      role: 'ADMIN',
      currentWorkspaceId: null,
      name: 'Admin User',
    },
    expires: new Date(Date.now() + 86400000).toISOString(),
  };

  const mockUserSession: Session = {
    user: {
      id: 'user-1',
      email: 'user@example.com',
      role: 'USER',
      currentWorkspaceId: null,
      name: 'Regular User',
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
          currentWorkspaceId: null,
        },
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as Session;
      expect(isAdminSession(sessionWithoutRole)).toBe(false);
    });
  });

  describe('checkIsAdmin', () => {
    it('should return true when user is admin', async () => {
      mockedAuth.mockResolvedValue(mockAdminSession);

      const result = await checkIsAdmin();

      expect(result).toBe(true);
    });

    it('should return false when user is not admin', async () => {
      mockedAuth.mockResolvedValue(mockUserSession);

      const result = await checkIsAdmin();

      expect(result).toBe(false);
    });

    it('should return false when no session', async () => {
      mockedAuth.mockResolvedValue(null);

      const result = await checkIsAdmin();

      expect(result).toBe(false);
    });
  });

  describe('requireAdmin', () => {
    it('should return session when user is admin', async () => {
      mockedAuth.mockResolvedValue(mockAdminSession);

      const result = await requireAdmin();

      expect(result).toEqual(mockAdminSession);
    });

    it('should throw AdminAccessDeniedError when user is not admin', async () => {
      mockedAuth.mockResolvedValue(mockUserSession);

      await expect(requireAdmin()).rejects.toThrow(AdminAccessDeniedError);
      await expect(requireAdmin()).rejects.toThrow('Admin access required');
    });

    it('should throw AdminAccessDeniedError when no session', async () => {
      mockedAuth.mockResolvedValue(null);

      await expect(requireAdmin()).rejects.toThrow(AdminAccessDeniedError);
      await expect(requireAdmin()).rejects.toThrow('Authentication required');
    });

    it('should throw AdminAccessDeniedError when session has no user', async () => {
      mockedAuth.mockResolvedValue({
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as Session);

      await expect(requireAdmin()).rejects.toThrow(AdminAccessDeniedError);
      await expect(requireAdmin()).rejects.toThrow('Authentication required');
    });
  });

  describe('getAdminSession', () => {
    it('should return session when user is admin', async () => {
      mockedAuth.mockResolvedValue(mockAdminSession);

      const result = await getAdminSession();

      expect(result).toEqual(mockAdminSession);
    });

    it('should return null when user is not admin', async () => {
      mockedAuth.mockResolvedValue(mockUserSession);

      const result = await getAdminSession();

      expect(result).toBeNull();
    });

    it('should return null when no session', async () => {
      mockedAuth.mockResolvedValue(null);

      const result = await getAdminSession();

      expect(result).toBeNull();
    });
  });

  describe('withAdminAuth', () => {
    it('should call handler when user is admin', async () => {
      mockedAuth.mockResolvedValue(mockAdminSession);

      const mockHandler = vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ success: true }), { status: 200 })
        );

      const wrappedHandler = withAdminAuth(mockHandler);
      const response = await wrappedHandler('arg1', 'arg2');

      expect(mockHandler).toHaveBeenCalledWith('arg1', 'arg2');
      expect(response.status).toBe(200);
    });

    it('should return 403 when user is not admin', async () => {
      mockedAuth.mockResolvedValue(mockUserSession);

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
      mockedAuth.mockResolvedValue(null);

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
      mockedAuth.mockResolvedValue(mockAdminSession);

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
