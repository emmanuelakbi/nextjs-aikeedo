import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import prisma from '@/lib/db/prisma';

/**
 * Admin System Health API
 *
 * Requirements: Admin Dashboard 7 - Support Tools
 * - Monitor system health
 */

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const startTime = Date.now();

    // Check database connectivity
    const dbHealthStart = Date.now();
    let dbHealth = 'healthy';
    let dbResponseTime = 0;
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbResponseTime = Date.now() - dbHealthStart;
      if (dbResponseTime > 1000) {
        dbHealth = 'slow';
      }
    } catch (error) {
      dbHealth = 'unhealthy';
      dbResponseTime = Date.now() - dbHealthStart;
    }

    // Get database statistics
    const [
      userCount,
      workspaceCount,
      activeSubscriptions,
      recentGenerations,
      recentErrors,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.workspace.count(),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.generation.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      }),
      prisma.generation.count({
        where: {
          status: 'FAILED',
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      }),
    ]);

    // Calculate error rate
    const errorRate =
      recentGenerations > 0 ? (recentErrors / recentGenerations) * 100 : 0;

    // Memory usage (Node.js process)
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024),
    };

    // System uptime
    const uptime = process.uptime();
    const uptimeFormatted = formatUptime(uptime);

    // Overall health status
    let overallHealth = 'healthy';
    if (dbHealth === 'unhealthy' || errorRate > 10) {
      overallHealth = 'unhealthy';
    } else if (dbHealth === 'slow' || errorRate > 5) {
      overallHealth = 'degraded';
    }

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      status: overallHealth,
      timestamp: new Date().toISOString(),
      responseTime,
      database: {
        status: dbHealth,
        responseTime: dbResponseTime,
        connections: {
          total: userCount + workspaceCount,
        },
      },
      statistics: {
        users: userCount,
        workspaces: workspaceCount,
        activeSubscriptions,
        recentGenerations,
        recentErrors,
        errorRate: errorRate.toFixed(2) + '%',
      },
      system: {
        uptime: uptimeFormatted,
        uptimeSeconds: Math.floor(uptime),
        memory: memoryUsageMB,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    });
  } catch (error) {
    console.error('Error checking system health:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Failed to check system health',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}
