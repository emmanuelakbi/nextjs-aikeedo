import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, POST } from './route';
import { NextRequest } from 'next/server';

/**
 * Admin Settings API Tests
 *
 * Requirements: Admin Dashboard 4 - System Settings
 */

vi.mock('@/lib/admin', () => ({
  requireAdmin: vi.fn().mockResolvedValue({
    user: { id: 'admin-1' },
    role: 'ADMIN',
  }),
  logAdminAction: vi.fn(),
}));

vi.mock('@/lib/db/prisma', () => ({
  default: {
    systemSetting: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

describe('Admin Settings API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/settings', () => {
    it('should fetch all settings', async () => {
      const mockSettings = [
        {
          key: 'site_name',
          value: 'AIKEEDO',
          description: 'Site name',
          category: 'general',
          isPublic: true,
          updatedBy: 'admin-1',
          updatedAt: new Date(),
          updater: {
            id: 'admin-1',
            email: 'admin@example.com',
            firstName: 'Admin',
            lastName: 'User',
          },
        },
        {
          key: 'openai_api_key',
          value: 'sk-xxx',
          description: 'OpenAI API Key',
          category: 'ai',
          isPublic: false,
          updatedBy: 'admin-1',
          updatedAt: new Date(),
          updater: {
            id: 'admin-1',
            email: 'admin@example.com',
            firstName: 'Admin',
            lastName: 'User',
          },
        },
      ];

      const prisma = (await import('@/lib/db/prisma')).default;
      vi.mocked(prisma.systemSetting.findMany).mockResolvedValue(
        mockSettings as any
      );

      const request = new NextRequest('http://localhost/api/admin/settings');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.settings).toHaveLength(2);
      expect(data.groupedSettings).toBeDefined();
      expect(data.groupedSettings.general).toHaveLength(1);
      expect(data.groupedSettings.ai).toHaveLength(1);
    });

    it('should filter settings by category', async () => {
      const prisma = (await import('@/lib/db/prisma')).default;
      vi.mocked(prisma.systemSetting.findMany).mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost/api/admin/settings?category=ai'
      );

      await GET(request);

      expect(prisma.systemSetting.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { category: 'ai' },
        })
      );
    });

    it('should handle errors gracefully', async () => {
      const prisma = (await import('@/lib/db/prisma')).default;
      vi.mocked(prisma.systemSetting.findMany).mockRejectedValue(
        new Error('Database error')
      );

      const request = new NextRequest('http://localhost/api/admin/settings');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch settings');
    });
  });

  describe('POST /api/admin/settings', () => {
    it('should create a new setting', async () => {
      const mockSetting = {
        key: 'new_setting',
        value: 'test_value',
        description: 'Test setting',
        category: 'general',
        isPublic: false,
        updatedBy: 'admin-1',
        updatedAt: new Date(),
        updater: {
          email: 'admin@example.com',
          firstName: 'Admin',
          lastName: 'User',
        },
      };

      const prisma = (await import('@/lib/db/prisma')).default;
      vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.systemSetting.upsert).mockResolvedValue(
        mockSetting as any
      );

      const request = new NextRequest('http://localhost/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify({
          key: 'new_setting',
          value: 'test_value',
          description: 'Test setting',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.setting.key).toBe('new_setting');
      expect(data.setting.value).toBe('test_value');
    });

    it('should update an existing setting', async () => {
      const existingSetting = {
        key: 'existing_setting',
        value: 'old_value',
        description: 'Old description',
        category: 'general',
        isPublic: false,
        updatedBy: 'admin-1',
        updatedAt: new Date(),
      };

      const updatedSetting = {
        ...existingSetting,
        value: 'new_value',
        description: 'New description',
        updater: {
          email: 'admin@example.com',
          firstName: 'Admin',
          lastName: 'User',
        },
      };

      const prisma = (await import('@/lib/db/prisma')).default;
      vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue(
        existingSetting as any
      );
      vi.mocked(prisma.systemSetting.upsert).mockResolvedValue(
        updatedSetting as any
      );

      const request = new NextRequest('http://localhost/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify({
          key: 'existing_setting',
          value: 'new_value',
          description: 'New description',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.setting.value).toBe('new_value');
    });

    it('should validate input', async () => {
      const request = new NextRequest('http://localhost/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify({
          key: '',
          value: 'test',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid input');
    });

    it('should log the action', async () => {
      const mockSetting = {
        key: 'test_setting',
        value: 'test_value',
        description: 'Test',
        category: 'general',
        isPublic: false,
        updatedBy: 'admin-1',
        updatedAt: new Date(),
        updater: {
          email: 'admin@example.com',
          firstName: 'Admin',
          lastName: 'User',
        },
      };

      const prisma = (await import('@/lib/db/prisma')).default;
      vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.systemSetting.upsert).mockResolvedValue(
        mockSetting as any
      );

      const { logAdminAction } = await import('@/lib/admin');

      const request = new NextRequest('http://localhost/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify({
          key: 'test_setting',
          value: 'test_value',
        }),
      });

      await POST(request);

      expect(logAdminAction).toHaveBeenCalledWith(
        expect.objectContaining({
          adminId: 'admin-1',
          action: 'settings.create',
          targetType: 'system_setting',
          targetId: 'test_setting',
        })
      );
    });
  });
});
