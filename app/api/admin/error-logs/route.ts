import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import prisma from '@/lib/db/prisma';
export const dynamic = 'force-dynamic';



/**
 * Admin Error Logs API
 *
 * Requirements: Admin Dashboard 7 - Support Tools
 * - View error logs
 * - Monitor system health
 *
 * GET /api/admin/error-logs - Get error logs from failed generations and system errors
 */

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    // const type = searchParams.get('type'); // generation, system - TODO: implement filtering
    const userId = searchParams.get('userId');
    const workspaceId = searchParams.get('workspaceId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const skip = (page - 1) * limit;

    // Build where clause for failed generations
    const where: any = {
      status: 'FAILED',
    };

    if (userId) {
      where.userId = userId;
    }

    if (workspaceId) {
      where.workspaceId = workspaceId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Get failed generations (these are our error logs)
    const [errors, total] = await Promise.all([
      prisma.generation.findMany({
        where,
        select: {
          id: true,
          type: true,
          model: true,
          provider: true,
          status: true,
          error: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          workspace: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.generation.count({ where }),
    ]);

    // Get error statistics
    const errorStats = await prisma.generation.groupBy({
      by: ['provider', 'type'],
      where: {
        status: 'FAILED',
        ...(startDate && { createdAt: { gte: new Date(startDate) } }),
      },
      _count: {
        id: true,
      },
    });

    // Get most common errors
    const errorMessages = await prisma.generation.findMany({
      where: {
        status: 'FAILED',
        error: { not: null },
        ...(startDate && { createdAt: { gte: new Date(startDate) } }),
      },
      select: {
        error: true,
      },
      take: 100,
    });

    // Count error occurrences
    const errorCounts: Record<string, number> = {};
    errorMessages.forEach((gen: { error: string | null }) => {
      if (gen.error) {
        // Extract first line of error for grouping
        const firstLine = gen.error.split('\n')[0];
        const errorKey = firstLine
          ? firstLine.substring(0, 100)
          : 'Unknown error';
        errorCounts[errorKey] = (errorCounts[errorKey] || 0) + 1;
      }
    });

    // Sort by frequency
    const topErrors = Object.entries(errorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([error, count]) => ({ error, count }));

    return NextResponse.json({
      errors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      statistics: {
        total,
        byProvider: errorStats,
        topErrors,
      },
    });
  } catch (error) {
    console.error('Error fetching error logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch error logs' },
      { status: 500 }
    );
  }
}
