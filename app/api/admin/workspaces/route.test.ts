import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';

/**
 * Admin Workspaces API Tests
 *
 * Requirements: Admin Dashboard 2 - Workspace Management
 */

vi.mock('@/lib/admin', () => ({
  requireAdmin: vi.fn().mockResolvedValue({ id: 'admin-1', role: 'ADMIN' }),
}));

vi.mock('@/lib/db/prisma', () => ({
  default: {
    workspace: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe('Admin Workspaces API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch workspaces with default pagination', async () => {
    const mockWorkspaces = [
      {
        id: 'ws-1',
        name: 'Test Workspace',
        creditCount: 1000,
        allocatedCredits: 500,
        isTrialed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        owner: {
          id: 'user-1',
          email: 'owner@example.com',
          firstName: 'John',
          lastName: 'Doe',
        },
        subscription: {
          id: 'sub-1',
          status: 'ACTIVE',
          plan: {
            name: 'Pro Plan',
          },
        },
        _count: {
          members: 3,
          conversations: 10,
          generations: 50,
          files: 20,
        },
      },
    ];

    const prisma = (await import('@/lib/db/prisma')).default;
    vi.mocked(prisma.workspace.findMany).mockResolvedValue(mockWorkspaces as any);
    vi.mocked(prisma.workspace.count).mockResolvedValue(1);

    const request = new NextRequest('http://localhost/api/admin/workspaces');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.workspaces).toHaveLength(1);
    expect(data.workspaces[0].name).toBe('Test Workspace');
    expect(data.pagination).toBeDefined();
    expect(data.pagination.page).toBe(1);
    expect(data.pagination.limit).toBe(20);
  });

  it('should filter workspaces by search query', async () => {
    const prisma = (await import('@/lib/db/prisma')).default;
    vi.mocked(prisma.workspace.findMany).mockResolvedValue([]);
    vi.mocked(prisma.workspace.count).mockResolvedValue(0);

    const request = new NextRequest(
      'http://localhost/api/admin/workspaces?search=test'
    );

    await GET(request);

    expect(prisma.workspace.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { name: { contains: 'test', mode: 'insensitive' } },
            { owner: { email: { contains: 'test', mode: 'insensitive' } } },
          ]),
        }),
      })
    );
  });

  it('should support pagination', async () => {
    const prisma = (await import('@/lib/db/prisma')).default;
    vi.mocked(prisma.workspace.findMany).mockResolvedValue([]);
    vi.mocked(prisma.workspace.count).mockResolvedValue(50);

    const request = new NextRequest(
      'http://localhost/api/admin/workspaces?page=2&limit=15'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(prisma.workspace.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 15,
        take: 15,
      })
    );

    expect(data.pagination.page).toBe(2);
    expect(data.pagination.limit).toBe(15);
    expect(data.pagination.total).toBe(50);
    expect(data.pagination.totalPages).toBe(4);
  });

  it('should support sorting', async () => {
    const prisma = (await import('@/lib/db/prisma')).default;
    vi.mocked(prisma.workspace.findMany).mockResolvedValue([]);
    vi.mocked(prisma.workspace.count).mockResolvedValue(0);

    const request = new NextRequest(
      'http://localhost/api/admin/workspaces?sortBy=name&sortOrder=asc'
    );

    await GET(request);

    expect(prisma.workspace.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: {
          name: 'asc',
        },
      })
    );
  });

  it('should handle errors gracefully', async () => {
    const prisma = (await import('@/lib/db/prisma')).default;
    vi.mocked(prisma.workspace.findMany).mockRejectedValue(
      new Error('Database error')
    );

    const request = new NextRequest('http://localhost/api/admin/workspaces');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch workspaces');
  });
});
