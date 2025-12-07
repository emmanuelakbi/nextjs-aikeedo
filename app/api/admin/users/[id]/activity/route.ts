import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import prisma from '@/lib/db/prisma';
export const dynamic = 'force-dynamic';



/**
 * Admin User Activity API
 *
 * Requirements: Admin Dashboard 1 - User Management
 *
 * GET /api/admin/users/[id]/activity - Get user activity logs
 */

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const userId = params.id;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's recent activity
    const [
      recentConversations,
      recentGenerations,
      recentFiles,
      recentDocuments,
      sessions,
    ] = await Promise.all([
      // Recent conversations
      prisma.conversation.findMany({
        where: { userId },
        select: {
          id: true,
          title: true,
          model: true,
          provider: true,
          createdAt: true,
          _count: {
            select: { messages: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),

      // Recent generations
      prisma.generation.findMany({
        where: { userId },
        select: {
          id: true,
          type: true,
          model: true,
          provider: true,
          status: true,
          credits: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),

      // Recent files
      prisma.file.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          type: true,
          size: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),

      // Recent documents
      prisma.document.findMany({
        where: { userId },
        select: {
          id: true,
          title: true,
          type: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),

      // Active sessions
      prisma.session.findMany({
        where: {
          userId,
          expires: { gt: new Date() },
        },
        select: {
          id: true,
          expires: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Get usage statistics
    const usageStats = await prisma.generation.groupBy({
      by: ['type'],
      where: { userId },
      _sum: {
        credits: true,
      },
      _count: {
        id: true,
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      activity: {
        conversations: recentConversations,
        generations: recentGenerations,
        files: recentFiles,
        documents: recentDocuments,
        sessions,
      },
      statistics: {
        usage: usageStats,
      },
    });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user activity' },
      { status: 500 }
    );
  }
}
