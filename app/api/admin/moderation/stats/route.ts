import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import prisma from '@/lib/db/prisma';

/**
 * Admin Moderation Statistics API
 *
 * Requirements: Admin Dashboard 6 - Content Moderation
 * - View moderation statistics
 */

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get generation statistics
    const [
      totalGenerations,
      failedGenerations,
      generationsByType,
      suspendedUsers,
      recentModerationActions,
    ] = await Promise.all([
      prisma.generation.count({
        where: {
          createdAt: { gte: startDate },
        },
      }),
      prisma.generation.count({
        where: {
          status: 'FAILED',
          createdAt: { gte: startDate },
        },
      }),
      prisma.generation.groupBy({
        by: ['type'],
        where: {
          createdAt: { gte: startDate },
        },
        _count: true,
      }),
      prisma.user.count({
        where: {
          status: 'SUSPENDED',
        },
      }),
      prisma.adminAction.count({
        where: {
          action: {
            startsWith: 'moderation.',
          },
          createdAt: { gte: startDate },
        },
      }),
    ]);

    // Get top flagged users (users with most failed generations)
    const topFlaggedUsers = await prisma.generation.groupBy({
      by: ['userId'],
      where: {
        status: 'FAILED',
        createdAt: { gte: startDate },
      },
      _count: true,
      orderBy: {
        _count: {
          userId: 'desc',
        },
      },
      take: 10,
    });

    // Get user details for top flagged users
    const userIds = topFlaggedUsers.map((u: { userId: string }) => u.userId);
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
      },
    });

    const topFlaggedUsersWithDetails = topFlaggedUsers.map((item: { userId: string; _count: { id: number } }) => {
      const user = users.find((u: { id: string }) => u.id === item.userId);
      return {
        userId: item.userId,
        flagCount: item._count,
        user,
      };
    });

    return NextResponse.json({
      period: days,
      statistics: {
        totalGenerations,
        failedGenerations,
        failureRate:
          totalGenerations > 0
            ? ((failedGenerations / totalGenerations) * 100).toFixed(2) + '%'
            : '0%',
        suspendedUsers,
        moderationActions: recentModerationActions,
      },
      generationsByType,
      topFlaggedUsers: topFlaggedUsersWithDetails,
    });
  } catch (error) {
    console.error('Error fetching moderation stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch moderation statistics' },
      { status: 500 }
    );
  }
}
