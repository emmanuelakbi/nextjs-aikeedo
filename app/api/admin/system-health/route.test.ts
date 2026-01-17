import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';

/**
 * Admin System Health API Tests
 *
 * Requirements: Admin Dashboard 7 - Support Tools
 */

vi.mock('@/lib/admin', () => ({
  requireAdmin: vi.fn().mockResolvedValue({ id: 'admin-1', role: 'ADMIN' }),
}));

vi.mock('@/lib/db/prisma', () => ({
  default: {
    $queryRaw: vi.fn(),
    user: {
      count: vi.fn(),
    },
    workspace: {
      count: vi.fn(),
    },
    subscription: {
      count: vi.fn(),
    },
    generation: {
      count: vi.fn(),
    },
  },
}));

describe('Admin System Health API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return system health status', async () => {
    const prisma = (await import('@/lib/db/prisma')).default;

    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ '?column?': 1 }]);
    vi.mocked(prisma.user.count).mockResolvedValue(100);
    vi.mocked(prisma.workspace.count).mockResolvedValue(50);
    vi.mocked(prisma.subscription.count).mockResolvedValue(30);
    vi.mocked(prisma.generation.count)
      .mockResolvedValueOnce(1000) // recent generations
      .mockResolvedValueOnce(10); // recent errors

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBeDefined();
    expect(data.database).toBeDefined();
    expect(data.database.status).toBe('healthy');
    expect(data.statistics).toBeDefined();
    expect(data.statistics.users).toBe(100);
    expect(data.statistics.workspaces).toBe(50);
    expect(data.statistics.activeSubscriptions).toBe(30);
    expect(data.system).toBeDefined();
    expect(data.system.uptime).toBeDefined();
    expect(data.system.memory).toBeDefined();
  });

  it('should detect unhealthy database', async () => {
    const prisma = (await import('@/lib/db/prisma')).default;

    vi.mocked(prisma.$queryRaw).mockRejectedValue(
      new Error('Connection failed')
    );
    vi.mocked(prisma.user.count).mockResolvedValue(0);
    vi.mocked(prisma.workspace.count).mockResolvedValue(0);
    vi.mocked(prisma.subscription.count).mockResolvedValue(0);
    vi.mocked(prisma.generation.count).mockResolvedValue(0);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.database.status).toBe('unhealthy');
    expect(data.status).toBe('unhealthy');
  });

  it('should calculate error rate correctly', async () => {
    const prisma = (await import('@/lib/db/prisma')).default;

    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ '?column?': 1 }]);
    vi.mocked(prisma.user.count).mockResolvedValue(100);
    vi.mocked(prisma.workspace.count).mockResolvedValue(50);
    vi.mocked(prisma.subscription.count).mockResolvedValue(30);
    vi.mocked(prisma.generation.count)
      .mockResolvedValueOnce(100) // recent generations
      .mockResolvedValueOnce(15); // recent errors (15%)

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.statistics.errorRate).toBe('15.00%');
    expect(data.status).toBe('unhealthy'); // > 10% error rate
  });

  it('should include system information', async () => {
    const prisma = (await import('@/lib/db/prisma')).default;

    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ '?column?': 1 }]);
    vi.mocked(prisma.user.count).mockResolvedValue(0);
    vi.mocked(prisma.workspace.count).mockResolvedValue(0);
    vi.mocked(prisma.subscription.count).mockResolvedValue(0);
    vi.mocked(prisma.generation.count).mockResolvedValue(0);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.system.nodeVersion).toBeDefined();
    expect(data.system.platform).toBeDefined();
    expect(data.system.arch).toBeDefined();
    expect(data.system.memory.rss).toBeGreaterThan(0);
    expect(data.system.memory.heapUsed).toBeGreaterThan(0);
  });
});
