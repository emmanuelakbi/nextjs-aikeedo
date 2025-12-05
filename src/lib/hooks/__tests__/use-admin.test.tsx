import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * useAdmin Hook Tests
 *
 * Requirements: Admin Dashboard 2 - Role-based access control
 *
 * Note: These tests verify the hook logic by directly testing the implementation
 * without rendering React components.
 */

// Mock next-auth/react
const mockUseSession = vi.fn();
vi.mock('next-auth/react', () => ({
  useSession: () => mockUseSession(),
}));

describe('useAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return isAdmin true for admin user', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'admin-1',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
        expires: new Date(Date.now() + 86400000).toISOString(),
      },
      status: 'authenticated',
    });

    const { useAdmin } = await import('../use-admin');
    const result = useAdmin();

    expect(result.isAdmin).toBe(true);
    expect(result.isLoading).toBe(false);
    expect(result.session).toBeDefined();
  });

  it('should return isAdmin false for regular user', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'user-1',
          email: 'user@example.com',
          role: 'USER',
        },
        expires: new Date(Date.now() + 86400000).toISOString(),
      },
      status: 'authenticated',
    });

    const { useAdmin } = await import('../use-admin');
    const result = useAdmin();

    expect(result.isAdmin).toBe(false);
    expect(result.isLoading).toBe(false);
  });

  it('should return isAdmin false when no session', async () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    const { useAdmin } = await import('../use-admin');
    const result = useAdmin();

    expect(result.isAdmin).toBe(false);
    expect(result.isLoading).toBe(false);
    expect(result.session).toBeNull();
  });

  it('should return isLoading true when loading', async () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
    });

    const { useAdmin } = await import('../use-admin');
    const result = useAdmin();

    expect(result.isAdmin).toBe(false);
    expect(result.isLoading).toBe(true);
  });

  it('should handle session without role', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'user-1',
          email: 'user@example.com',
        },
        expires: new Date(Date.now() + 86400000).toISOString(),
      },
      status: 'authenticated',
    });

    const { useAdmin } = await import('../use-admin');
    const result = useAdmin();

    expect(result.isAdmin).toBe(false);
  });
});

describe('useRequireAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return session for admin user', async () => {
    const mockSession = {
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        role: 'ADMIN',
      },
      expires: new Date(Date.now() + 86400000).toISOString(),
    };

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    });

    const { useRequireAdmin } = await import('../use-admin');
    const result = useRequireAdmin();

    expect(result.isAdmin).toBe(true);
    expect(result.session).toEqual(mockSession);
  });

  it('should throw error for non-admin user', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'user-1',
          email: 'user@example.com',
          role: 'USER',
        },
        expires: new Date(Date.now() + 86400000).toISOString(),
      },
      status: 'authenticated',
    });

    const { useRequireAdmin } = await import('../use-admin');

    expect(() => {
      useRequireAdmin();
    }).toThrow('Admin access required');
  });

  it('should not throw error while loading', async () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
    });

    const { useRequireAdmin } = await import('../use-admin');
    const result = useRequireAdmin();

    expect(result.isLoading).toBe(true);
    expect(result.isAdmin).toBe(false);
  });

  it('should throw error when not authenticated', async () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    const { useRequireAdmin } = await import('../use-admin');

    expect(() => {
      useRequireAdmin();
    }).toThrow('Admin access required');
  });
});
