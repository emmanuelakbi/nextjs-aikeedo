import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

/**
 * Usage Tracking API Routes
 *
 * Handles usage tracking and overage calculations
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

/**
 * GET /api/billing/usage
 * Get usage statistics for a workspace
 * Requirements: 10.4 - Track usage in real-time, 12.1, 12.4
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    // Verify user has access to workspace
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        OR: [
          { ownerId: session.user.id },
          {
            members: {
              some: {
                userId: session.user.id,
              },
            },
          },
        ],
      },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found or access denied' },
        { status: 404 }
      );
    }

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    // Get usage data from credit transactions
    // Requirements: 10.4 - Track usage in real-time
    const usageTransactions = await prisma.creditTransaction.findMany({
      where: {
        workspaceId,
        type: 'USAGE',
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate total usage
    const totalUsage = usageTransactions.reduce(
      (sum, transaction) => sum + Math.abs(transaction.amount),
      0
    );

    // Get plan limits
    const planLimits = workspace.subscription?.plan?.creditCount || null;
    const currentBalance = workspace.creditCount;

    // Requirements: 10.1, 10.2 - Calculate overage
    let overage = 0;
    let overageCharges = 0;

    if (planLimits !== null && totalUsage > planLimits) {
      overage = totalUsage - planLimits;

      // Get overage pricing from plan limits
      const planLimitsData = workspace.subscription?.plan?.limits as any;
      const overageRate = planLimitsData?.overageRate || 0.01; // Default $0.01 per credit

      // Requirements: 10.2 - Use per-unit pricing
      overageCharges = overage * overageRate;
    }

    // Requirements: 12.4 - Show breakdown by service type
    const usageByType = await prisma.$queryRaw<
      Array<{ description: string; total: number }>
    >`
      SELECT 
        SUBSTRING_INDEX(description, ':', 1) as service_type,
        SUM(ABS(amount)) as total
      FROM CreditTransaction
      WHERE workspaceId = ${workspaceId}
        AND type = 'USAGE'
        ${Object.keys(dateFilter).length > 0 ? `AND createdAt >= ${dateFilter.gte || new Date(0)} AND createdAt <= ${dateFilter.lte || new Date()}` : ''}
      GROUP BY service_type
      ORDER BY total DESC
    `;

    return NextResponse.json({
      usage: {
        total: totalUsage,
        limit: planLimits,
        remaining:
          planLimits !== null ? Math.max(0, planLimits - totalUsage) : null,
        currentBalance,
        overage,
        overageCharges,
        byServiceType: usageByType,
      },
      transactions: usageTransactions.slice(0, 100), // Limit to recent 100
      period: {
        start:
          startDate ||
          workspace.subscription?.currentPeriodStart?.toISOString(),
        end: endDate || workspace.subscription?.currentPeriodEnd?.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch usage',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
