/**
 * Affiliate Reports API Route
 * GET /api/affiliate/reports
 * Requirements: Affiliate 3, 4 - Generate affiliate reports
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaAffiliateRepository } from '@/infrastructure/affiliate/prisma-affiliate-repository';
import prisma from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d'; // 7d, 30d, 90d, 1y, all
    const type = searchParams.get('type') || 'summary'; // summary, detailed, earnings, conversions

    // Find affiliate
    const affiliateRepository = new PrismaAffiliateRepository();
    const affiliate = await affiliateRepository.findByUserId(session.user.id);

    if (!affiliate) {
      return NextResponse.json(
        { error: 'Affiliate account not found' },
        { status: 404 }
      );
    }

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
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
        startDate = new Date(0); // Beginning of time
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Generate report based on type
    let reportData;

    switch (type) {
      case 'summary':
        reportData = await generateSummaryReport(affiliate.id, startDate);
        break;
      case 'detailed':
        reportData = await generateDetailedReport(affiliate.id, startDate);
        break;
      case 'earnings':
        reportData = await generateEarningsReport(affiliate.id, startDate);
        break;
      case 'conversions':
        reportData = await generateConversionsReport(affiliate.id, startDate);
        break;
      default:
        reportData = await generateSummaryReport(affiliate.id, startDate);
    }

    return NextResponse.json({
      success: true,
      data: {
        period,
        type,
        startDate,
        endDate: now,
        ...reportData,
      },
    });
  } catch (error) {
    console.error('Generate report error:', error);

    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

async function generateSummaryReport(affiliateId: string, startDate: Date) {
  const [referrals, payouts, affiliate] = await Promise.all([
    prisma.referral.findMany({
      where: {
        affiliateId,
        createdAt: { gte: startDate },
      },
    }),
    prisma.payout.findMany({
      where: {
        affiliateId,
        createdAt: { gte: startDate },
      },
    }),
    prisma.affiliate.findUnique({
      where: { id: affiliateId },
    }),
  ]);

  const totalReferrals = referrals.length;
  const convertedReferrals = referrals.filter(
    (r) => r.status === 'CONVERTED'
  ).length;
  const conversionRate =
    totalReferrals > 0 ? (convertedReferrals / totalReferrals) * 100 : 0;
  const totalCommission = referrals.reduce(
    (sum, r) => sum + (r.commission || 0),
    0
  );
  const totalPayouts = payouts
    .filter((p) => p.status === 'PAID')
    .reduce((sum, p) => sum + p.amount, 0);

  return {
    totalReferrals,
    convertedReferrals,
    conversionRate: conversionRate.toFixed(2),
    totalCommission,
    totalCommissionFormatted: `$${(totalCommission / 100).toFixed(2)}`,
    totalPayouts,
    totalPayoutsFormatted: `$${(totalPayouts / 100).toFixed(2)}`,
    pendingEarnings: affiliate?.pendingEarnings || 0,
    pendingEarningsFormatted: `$${((affiliate?.pendingEarnings || 0) / 100).toFixed(2)}`,
  };
}

async function generateDetailedReport(affiliateId: string, startDate: Date) {
  const referrals = await prisma.referral.findMany({
    where: {
      affiliateId,
      createdAt: { gte: startDate },
    },
    include: {
      referredUser: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return {
    referrals: referrals.map((r) => ({
      id: r.id,
      status: r.status,
      commission: r.commission,
      commissionFormatted: `$${((r.commission || 0) / 100).toFixed(2)}`,
      conversionValue: r.conversionValue,
      conversionValueFormatted: `$${((r.conversionValue || 0) / 100).toFixed(2)}`,
      convertedAt: r.convertedAt,
      createdAt: r.createdAt,
      user: r.referredUser,
    })),
  };
}

async function generateEarningsReport(affiliateId: string, startDate: Date) {
  const referrals = await prisma.referral.findMany({
    where: {
      affiliateId,
      createdAt: { gte: startDate },
      status: 'CONVERTED',
    },
    orderBy: { convertedAt: 'asc' },
  });

  // Group by month
  const earningsByMonth: Record<string, number> = {};
  
  referrals.forEach((r) => {
    const date = r.convertedAt || r.createdAt;
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    earningsByMonth[monthKey] = (earningsByMonth[monthKey] || 0) + (r.commission || 0);
  });

  return {
    earningsByMonth: Object.entries(earningsByMonth).map(([month, amount]) => ({
      month,
      amount,
      amountFormatted: `$${(amount / 100).toFixed(2)}`,
    })),
    totalEarnings: Object.values(earningsByMonth).reduce((sum, amt) => sum + amt, 0),
  };
}

async function generateConversionsReport(affiliateId: string, startDate: Date) {
  const referrals = await prisma.referral.findMany({
    where: {
      affiliateId,
      createdAt: { gte: startDate },
    },
  });

  const byStatus = {
    pending: referrals.filter((r) => r.status === 'PENDING').length,
    converted: referrals.filter((r) => r.status === 'CONVERTED').length,
    canceled: referrals.filter((r) => r.status === 'CANCELED').length,
  };

  // Group conversions by week
  const conversionsByWeek: Record<string, number> = {};
  
  referrals
    .filter((r) => r.status === 'CONVERTED' && r.convertedAt)
    .forEach((r) => {
      const date = r.convertedAt!;
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      conversionsByWeek[weekKey] = (conversionsByWeek[weekKey] || 0) + 1;
    });

  return {
    byStatus,
    conversionsByWeek: Object.entries(conversionsByWeek).map(([week, count]) => ({
      week,
      count,
    })),
    conversionRate:
      referrals.length > 0
        ? ((byStatus.converted / referrals.length) * 100).toFixed(2)
        : '0.00',
  };
}
