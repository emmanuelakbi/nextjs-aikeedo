import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';

/**
 * Admin Users API Tests
 *
 * Requirements: Admin Dashboard 1 - User Management
 */

vi.mock('@/lib/admin', () => ({
  requireAdmin: vi.fn().mockResolvedValue({ id: 'admin-1', role: 'ADMIN' }),
  logAdminAction: vi.fn(),
}));

vi.mock('@/lib/db/prisma', () => ({
  default: {
    user: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe('Admin Users API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch users with default pagination', async () => {
    const mockUsers = [
      {
        id: 'user-1',
        email: 'user1@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER',
        status: 'ACTIVE',
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSeenAt: new Date(),
        _count: {
          ownedWorkspaces: 2,
          conversations: 5,
          generations: 10,
        },
      },
    ];

    const prisma = (await import('@/lib/db/prisma')).default;
    vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as any);
    vi.mocked(prisma.user.count).mockResolvedValue(1);

    const request = new NextRequest('http://localhost/api/admin/users');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.users).toHaveLength(1);
    expect(data.users[0].email).toBe('user1@example.com');
    expect(data.pagination).toBeDefined();
    expect(data.pagination.page).toBe(1);
    expect(data.pagination.limit).toBe(20);
    expect(data.pagination.total).toBe(1);
  });

  it('should filter users by search query', async () => {
    const prisma = (await import('@/lib/db/prisma')).default;
    vi.mocked(prisma.user.findMany).mockResolvedValue([]);
    vi.mocked(prisma.user.count).mockResolvedValue(0);

    const request = new NextRequest(
      'http://localhost/api/admin/users?search=john'
    );

    await GET(request);

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { email: { contains: 'john', mode: 'insensitive' } },
            { firstName: { contains: 'john', mode: 'insensitive' } },
            { lastName: { contains: 'john', mode: 'insensitive' } },
          ]),
        }),
      })
    );
  });

  it('should filter users by status', async () => {
    const prisma = (await import('@/lib/db/prisma')).default;
    vi.mocked(prisma.user.findMany).mockResolvedValue([]);
    vi.mocked(prisma.user.count).mockResolvedValue(0);

    const request = new NextRequest(
      'http://localhost/api/admin/users?status=ACTIVE'
    );

    await GET(request);

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'ACTIVE',
        }),
      })
    );
  });

  it('should filter users by role', async () => {
    const prisma = (await import('@/lib/db/prisma')).default;
    vi.mocked(prisma.user.findMany).mockResolvedValue([]);
    vi.mocked(prisma.user.count).mockResolvedValue(0);

    const request = new NextRequest(
      'http://localhost/api/admin/users?role=ADMIN'
    );

    await GET(request);

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          role: 'ADMIN',
        }),
      })
    );
  });

  it('should support pagination', async () => {
    const prisma = (await import('@/lib/db/prisma')).default;
    vi.mocked(prisma.user.findMany).mockResolvedValue([]);
    vi.mocked(prisma.user.count).mockResolvedValue(100);

    const request = new NextRequest(
      'http://localhost/api/admin/users?page=3&limit=10'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 20,
        take: 10,
      })
    );

    expect(data.pagination.page).toBe(3);
    expect(data.pagination.limit).toBe(10);
    expect(data.pagination.total).toBe(100);
    expect(data.pagination.totalPages).toBe(10);
  });

  it('should support sorting', async () => {
    const prisma = (await import('@/lib/db/prisma')).default;
    vi.mocked(prisma.user.findMany).mockResolvedValue([]);
    vi.mocked(prisma.user.count).mockResolvedValue(0);

    const request = new NextRequest(
      'http://localhost/api/admin/users?sortBy=email&sortOrder=asc'
    );

    await GET(request);

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: {
          email: 'asc',
        },
      })
    );
  });

  it('should handle errors gracefully', async () => {
    const prisma = (await import('@/lib/db/prisma')).default;
    vi.mocked(prisma.user.findMany).mockRejectedValue(
      new Error('Database error')
    );

    const request = new NextRequest('http://localhost/api/admin/users');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch users');
  });
});
