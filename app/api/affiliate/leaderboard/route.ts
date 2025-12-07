/**
 * Affiliate Leaderboard API Route
 * GET /api/affiliate/leaderboard
 * Requirements: Affiliate 4 - Display top performing affiliates
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db/prisma';
export const dynamic = 'force-dynamic';



export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const metric = searchParams.get('metric') || 'earnings'; // earnings, referrals, conversions
    const period = searchParams.get('period') || '30d'; // 7d, 30d, 90d, all
    const limit = parseInt(searchParams.get('limit') || '10');

    // Calculate date range
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case 'all':
        startDate = new Date(0);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get affiliates with their stats
    const affiliates = await prisma.affiliate.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        referrals: {
          where: {
            createdAt: { gte: startDate },
          },
        },
      },
    });

    // Calculate metrics for each affiliate
    const leaderboard = affiliates.map((affiliate) => {
      const totalReferrals = affiliate.referrals.length;
      const convertedReferrals = affiliate.referrals.filter(
        (r) => r.status === 'CONVERTED'
      ).length;
      const totalEarnings = affiliate.referrals
        .filter((r) => r.status === 'CONVERTED')
        .reduce((sum: number, r: any) => sum + (r.commission || 0), 0);
      const conversionRate =
        totalReferrals > 0 ? (convertedReferrals / totalReferrals) * 100 : 0;

      return {
        rank: 0, // Will be set after sorting
        affiliate: {
          id: affiliate.id,
          code: affiliate.code,
          tier: affiliate.tier,
          user: {
            name:
              `${affiliate.user.firstName || ''} ${affiliate.user.lastName || ''}`.trim() ||
              'Anonymous',
          },
        },
        metrics: {
          totalReferrals,
          convertedReferrals,
          totalEarnings,
          totalEarningsFormatted: `$${(totalEarnings / 100).toFixed(2)}`,
          conversionRate: conversionRate.toFixed(2),
        },
        sortValue:
          metric === 'earnings'
            ? totalEarnings
            : metric === 'conversions'
              ? convertedReferrals
              : totalReferrals,
      };
    });

    // Sort by selected metric
    leaderboard.sort((a, b) => b.sortValue - a.sortValue);

    // Assign ranks and limit results
    const topAffiliates = leaderboard.slice(0, limit).map((item, index) => ({
      ...item,
      rank: index + 1,
      sortValue: undefined, // Remove internal sort value
    }));

    // Find current user's rank
    const currentUserAffiliate = await prisma.affiliate.findFirst({
      where: { userId: session.user.id },
    });

    let currentUserRank = null;
    if (currentUserAffiliate) {
      const userIndex = leaderboard.findIndex(
        (item) => item.affiliate.id === currentUserAffiliate.id
      );
      if (userIndex !== -1) {
        currentUserRank = {
          rank: userIndex + 1,
          ...leaderboard[userIndex],
          sortValue: undefined,
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        leaderboard: topAffiliates,
        currentUserRank,
        period,
        metric,
        total: leaderboard.length,
      },
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);

    return NextResponse.json(
      { error: 'Failed to get leaderboard' },
      { status: 500 }
    );
  }
}
