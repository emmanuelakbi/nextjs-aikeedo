import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import prisma from '@/lib/db/prisma';
export const dynamic = 'force-dynamic';



/**
 * Admin Workspace Usage Statistics API
 *
 * Requirements: Admin Dashboard 2 - Workspace Management
 *
 * GET /api/admin/workspaces/[id]/usage - Get workspace usage statistics
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const workspaceId = params.id;

    // Check if workspace exists
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        id: true,
        name: true,
        creditCount: true,
        allocatedCredits: true,
      },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    // Get usage statistics
    const [
      generationStats,
      conversationStats,
      creditTransactions,
      recentGenerations,
    ] = await Promise.all([
      // Generation statistics by type
      prisma.generation.groupBy({
        by: ['type', 'status'],
        where: { workspaceId },
        _sum: {
          credits: true,
          tokens: true,
        },
        _count: {
          id: true,
        },
      }),

      // Conversation statistics
      prisma.conversation.groupBy({
        by: ['provider'],
        where: { workspaceId },
        _count: {
          id: true,
        },
      }),

      // Recent credit transactions
      prisma.creditTransaction.findMany({
        where: { workspaceId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),

      // Recent generations
      prisma.generation.findMany({
        where: { workspaceId },
        select: {
          id: true,
          type: true,
          model: true,
          provider: true,
          status: true,
          credits: true,
          tokens: true,
          createdAt: true,
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    // Calculate total credits used
    const totalCreditsUsed = generationStats.reduce(
      (sum: number, stat: any) => sum + (stat._sum.credits || 0),
      0
    );

    // Calculate total tokens used
    const totalTokensUsed = generationStats.reduce(
      (sum, stat) => sum + (stat._sum.tokens || 0),
      0
    );

    // Calculate total generations
    const totalGenerations = generationStats.reduce(
      (sum, stat) => sum + stat._count.id,
      0
    );

    return NextResponse.json({
      workspace: {
        id: workspace.id,
        name: workspace.name,
        creditCount: workspace.creditCount,
        allocatedCredits: workspace.allocatedCredits,
      },
      statistics: {
        totalCreditsUsed,
        totalTokensUsed,
        totalGenerations,
        generationsByType: generationStats,
        conversationsByProvider: conversationStats,
      },
      recentActivity: {
        generations: recentGenerations,
        creditTransactions,
      },
    });
  } catch (error) {
    console.error('Error fetching workspace usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workspace usage' },
      { status: 500 }
    );
  }
}
