import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  logAdminAction,
  getAuditLogs,
  getTargetAuditLogs,
  getAdminAuditLogs,
  withAuditLog,
} from '../audit-logger';
import prisma from '@/lib/db/prisma';

/**
 * Audit Logger Tests
 *
 * Requirements: Admin Dashboard 8 - Audit Logging
 */

vi.mock('@/lib/db/prisma', () => ({
  default: {
    adminAction: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe('Audit Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('logAdminAction', () => {
    it('should create an audit log entry', async () => {
      const mockLog = {
        id: 'log-1',
        adminId: 'admin-1',
        action: 'user.suspend',
        targetType: 'user',
        targetId: 'user-1',
        changes: { status: 'SUSPENDED' },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        createdAt: new Date(),
      };

      vi.mocked(prisma.adminAction.create).mockResolvedValue(mockLog as any);

      const result = await logAdminAction({
        adminId: 'admin-1',
        action: 'user.suspend',
        targetType: 'user',
        targetId: 'user-1',
        changes: { status: 'SUSPENDED' },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });

      expect(result).toEqual(mockLog);
      expect(prisma.adminAction.create).toHaveBeenCalledWith({
        data: {
          adminId: 'admin-1',
          action: 'user.suspend',
          targetType: 'user',
          targetId: 'user-1',
          changes: { status: 'SUSPENDED' },
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      });
    });

    it('should handle missing optional fields', async () => {
      const mockLog = {
        id: 'log-1',
        adminId: 'admin-1',
        action: 'user.view',
        targetType: 'user',
        targetId: 'user-1',
        changes: {},
        ipAddress: null,
        userAgent: null,
        createdAt: new Date(),
      };

      vi.mocked(prisma.adminAction.create).mockResolvedValue(mockLog as any);

      await logAdminAction({
        adminId: 'admin-1',
        action: 'user.view',
        targetType: 'user',
        targetId: 'user-1',
      });

      expect(prisma.adminAction.create).toHaveBeenCalledWith({
        data: {
          adminId: 'admin-1',
          action: 'user.view',
          targetType: 'user',
          targetId: 'user-1',
          changes: {},
          ipAddress: null,
          userAgent: null,
        },
      });
    });
  });

  describe('getAuditLogs', () => {
    it('should fetch audit logs with default options', async () => {
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

      vi.mocked(prisma.adminAction.findMany).mockResolvedValue(mockLogs as any);

      const result = await getAuditLogs();

      expect(result).toEqual(mockLogs);
      expect(prisma.adminAction.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          admin: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 50,
        skip: 0,
      });
    });

    it('should filter by adminId', async () => {
      vi.mocked(prisma.adminAction.findMany).mockResolvedValue([]);

      await getAuditLogs({ adminId: 'admin-1' });

      expect(prisma.adminAction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { adminId: 'admin-1' },
        })
      );
    });

    it('should filter by targetType', async () => {
      vi.mocked(prisma.adminAction.findMany).mockResolvedValue([]);

      await getAuditLogs({ targetType: 'user' });

      expect(prisma.adminAction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { targetType: 'user' },
        })
      );
    });

    it('should filter by targetId', async () => {
      vi.mocked(prisma.adminAction.findMany).mockResolvedValue([]);

      await getAuditLogs({ targetId: 'user-1' });

      expect(prisma.adminAction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { targetId: 'user-1' },
        })
      );
    });

    it('should filter by action', async () => {
      vi.mocked(prisma.adminAction.findMany).mockResolvedValue([]);

      await getAuditLogs({ action: 'user.suspend' });

      expect(prisma.adminAction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { action: 'user.suspend' },
        })
      );
    });

    it('should support pagination', async () => {
      vi.mocked(prisma.adminAction.findMany).mockResolvedValue([]);

      await getAuditLogs({ limit: 25, offset: 50 });

      expect(prisma.adminAction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 25,
          skip: 50,
        })
      );
    });

    it('should combine multiple filters', async () => {
      vi.mocked(prisma.adminAction.findMany).mockResolvedValue([]);

      await getAuditLogs({
        adminId: 'admin-1',
        targetType: 'user',
        action: 'user.suspend',
        limit: 10,
        offset: 20,
      });

      expect(prisma.adminAction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            adminId: 'admin-1',
            targetType: 'user',
            action: 'user.suspend',
          },
          take: 10,
          skip: 20,
        })
      );
    });
  });

  describe('getTargetAuditLogs', () => {
    it('should fetch audit logs for a specific target', async () => {
      vi.mocked(prisma.adminAction.findMany).mockResolvedValue([]);

      await getTargetAuditLogs('user', 'user-1');

      expect(prisma.adminAction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            targetType: 'user',
            targetId: 'user-1',
          },
        })
      );
    });
  });

  describe('getAdminAuditLogs', () => {
    it('should fetch audit logs for a specific admin', async () => {
      vi.mocked(prisma.adminAction.findMany).mockResolvedValue([]);

      await getAdminAuditLogs('admin-1');

      expect(prisma.adminAction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            adminId: 'admin-1',
          },
        })
      );
    });
  });

  describe('withAuditLog', () => {
    it('should wrap handler with audit logging', async () => {
      const mockHandler = vi.fn().mockResolvedValue({ success: true });
      const wrappedHandler = withAuditLog('user.suspend', 'user', mockHandler);

      vi.mocked(prisma.adminAction.create).mockResolvedValue({} as any);

      const result = await wrappedHandler('admin-1', 'user-1', {
        status: 'SUSPENDED',
      });

      expect(result).toEqual({ success: true });
      expect(mockHandler).toHaveBeenCalledWith('admin-1', 'user-1', {
        status: 'SUSPENDED',
      });
      expect(prisma.adminAction.create).toHaveBeenCalledWith({
        data: {
          adminId: 'admin-1',
          action: 'user.suspend',
          targetType: 'user',
          targetId: 'user-1',
          changes: { status: 'SUSPENDED' },
          ipAddress: null,
          userAgent: null,
        },
      });
    });

    it('should include request headers in audit log', async () => {
      const mockHandler = vi.fn().mockResolvedValue({ success: true });
      const wrappedHandler = withAuditLog('user.suspend', 'user', mockHandler);

      const mockRequest = {
        headers: {
          get: vi.fn((header: string) => {
            if (header === 'x-forwarded-for') return '192.168.1.1';
            if (header === 'user-agent') return 'Mozilla/5.0';
            return null;
          }),
        },
      } as any;

      vi.mocked(prisma.adminAction.create).mockResolvedValue({} as any);

      await wrappedHandler(
        'admin-1',
        'user-1',
        { status: 'SUSPENDED' },
        mockRequest
      );

      expect(prisma.adminAction.create).toHaveBeenCalledWith({
        data: {
          adminId: 'admin-1',
          action: 'user.suspend',
          targetType: 'user',
          targetId: 'user-1',
          changes: { status: 'SUSPENDED' },
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      });
    });

    it('should pass additional arguments to handler', async () => {
      const mockHandler = vi.fn().mockResolvedValue({ success: true });
      const wrappedHandler = withAuditLog('user.suspend', 'user', mockHandler);

      vi.mocked(prisma.adminAction.create).mockResolvedValue({} as any);

      await wrappedHandler(
        'admin-1',
        'user-1',
        { status: 'SUSPENDED' },
        undefined,
        'extra-arg-1',
        'extra-arg-2'
      );

      expect(mockHandler).toHaveBeenCalledWith(
        'admin-1',
        'user-1',
        { status: 'SUSPENDED' },
        'extra-arg-1',
        'extra-arg-2'
      );
    });
  });
});
