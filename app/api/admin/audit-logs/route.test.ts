import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';

/**
 * Admin Audit Logs API Tests
 *
 * Requirements: Admin Dashboard 8 - Audit Logging
 */

vi.mock('@/lib/admin', () => ({
  requireAdmin: vi.fn().mockResolvedValue({ id: 'admin-1', role: 'ADMIN' }),
}));

vi.mock('@/lib/admin/audit-logger', () => ({
  getAuditLogs: vi.fn(),
}));

vi.mock('@/lib/db/prisma', () => ({
  default: {
    adminAction: {
      count: vi.fn(),
    },
  },
}));

describe('Admin Audit Logs API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch audit logs with default pagination', async () => {
    const mockLogs = [
      {
        id: 'log-1',
        adminId: 'admin-1',
        action: 'user.suspend',
        targetType: 'user',
        targetId: 'user-1',
        changes: { status: 'SUSPENDED' },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        createdAt: new Date('2024-01-15'),
        admin: {
          id: 'admin-1',
          email: 'admin@example.com',
          firstName: 'Admin',
          lastName: 'User',
        },
      },
    ];

    const { getAuditLogs } = await import('@/lib/admin/audit-logger');
    vi.mocked(getAuditLogs).mockResolvedValue(mockLogs as any);

    const prisma = (await import('@/lib/db/prisma')).default;
    vi.mocked(prisma.adminAction.count).mockResolvedValue(1);

    const request = new NextRequest('http://localhost/api/admin/audit-logs');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.logs).toHaveLength(1);
    expect(data.logs[0].action).toBe('user.suspend');
    expect(data.pagination).toBeDefined();
    expect(data.pagination.total).toBe(1);
    expect(data.pagination.limit).toBe(50);
    expect(data.pagination.offset).toBe(0);
  });

  it('should filter audit logs by admin ID', async () => {
    const mockLogs = [
      {
        id: 'log-1',
        adminId: 'admin-1',
        action: 'user.suspend',
        targetType: 'user',
        targetId: 'user-1',
        changes: {},
        ipAddress: null,
        userAgent: null,
        createdAt: new Date(),
        admin: {
          id: 'admin-1',
          email: 'admin@example.com',
          firstName: 'Admin',
          lastName: 'User',
        },
      },
    ];

    const { getAuditLogs } = await import('@/lib/admin/audit-logger');
    vi.mocked(getAuditLogs).mockResolvedValue(mockLogs as any);

    const prisma = (await import('@/lib/db/prisma')).default;
    vi.mocked(prisma.adminAction.count).mockResolvedValue(1);

    const request = new NextRequest(
      'http://localhost/api/admin/audit-logs?adminId=admin-1'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(getAuditLogs).toHaveBeenCalledWith(
      expect.objectContaining({
        adminId: 'admin-1',
      })
    );
  });

  it('should filter audit logs by target type', async () => {
    const { getAuditLogs } = await import('@/lib/admin/audit-logger');
    vi.mocked(getAuditLogs).mockResolvedValue([]);

    const prisma = (await import('@/lib/db/prisma')).default;
    vi.mocked(prisma.adminAction.count).mockResolvedValue(0);

    const request = new NextRequest(
      'http://localhost/api/admin/audit-logs?targetType=user'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(getAuditLogs).toHaveBeenCalledWith(
      expect.objectContaining({
        targetType: 'user',
      })
    );
  });

  it('should support pagination', async () => {
    const { getAuditLogs } = await import('@/lib/admin/audit-logger');
    vi.mocked(getAuditLogs).mockResolvedValue([]);

    const prisma = (await import('@/lib/db/prisma')).default;
    vi.mocked(prisma.adminAction.count).mockResolvedValue(100);

    const request = new NextRequest(
      'http://localhost/api/admin/audit-logs?limit=25&offset=50'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.pagination.limit).toBe(25);
    expect(data.pagination.offset).toBe(50);
    expect(data.pagination.total).toBe(100);
    expect(data.pagination.hasMore).toBe(true);
  });

  it('should handle errors gracefully', async () => {
    const { getAuditLogs } = await import('@/lib/admin/audit-logger');
    vi.mocked(getAuditLogs).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/admin/audit-logs');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch audit logs');
  });
});
