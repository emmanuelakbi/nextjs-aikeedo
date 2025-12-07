import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import prisma from '@/lib/db/prisma';
export const dynamic = 'force-dynamic';


/**
 * Admin Analytics API
 *
 * Requirements: Admin Dashboard 5 - Analytics and Reporting
 *
 * GET /api/admin/analytics - Get analytics data
 */

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days

    const daysAgo = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Get user statistics
    const [totalUsers, activeUsers, newUsers, suspendedUsers, userGrowth] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { status: 'ACTIVE' } }),
        prisma.user.count({
          where: { createdAt: { gte: startDate } },
        }),
        prisma.user.count({ where: { status: 'SUSPENDED' } }),
        prisma.user.groupBy({
          by: ['createdAt'],
          where: { createdAt: { gte: startDate } },
          _count: true,
        }),
      ]);

    // Get workspace statistics
    const [totalWorkspaces, workspaceGrowth] = await Promise.all([
      prisma.workspace.count(),
      prisma.workspace.groupBy({
        by: ['createdAt'],
        where: { createdAt: { gte: startDate } },
        _count: true,
      }),
    ]);

    // Get subscription statistics
    const [
      totalSubscriptions,
      activeSubscriptions,
      trialingSubscriptions,
      canceledSubscriptions,
      subscriptionRevenue,
    ] = await Promise.all([
      prisma.subscription.count(),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.subscription.count({ where: { status: 'TRIALING' } }),
      prisma.subscription.count({ where: { status: 'CANCELED' } }),
      prisma.subscription.findMany({
        where: {
          status: 'ACTIVE',
          createdAt: { gte: startDate },
        },
        include: {
          plan: {
            select: {
              price: true,
              interval: true,
            },
          },
        },
      }),
    ]);

    // Calculate revenue
    const totalRevenue = subscriptionRevenue.reduce(
      (sum: number, sub: { plan: { price: number } }) => sum + sub.plan.price,
      0
    );

    // Get AI usage statistics
    const [
      totalGenerations,
      generationsByType,
      generationsByProvider,
      totalCreditsUsed,
    ] = await Promise.all([
      prisma.generation.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.generation.groupBy({
        by: ['type'],
        where: { createdAt: { gte: startDate } },
        _count: true,
        _sum: {
          credits: true,
        },
      }),
      prisma.generation.groupBy({
        by: ['provider'],
        where: { createdAt: { gte: startDate } },
        _count: true,
        _sum: {
          credits: true,
        },
      }),
      prisma.generation.aggregate({
        where: { createdAt: { gte: startDate } },
        _sum: {
          credits: true,
        },
      }),
    ]);

    // Get invoice statistics
    const [totalInvoices, paidInvoices, invoiceRevenue] = await Promise.all([
      prisma.invoice.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.invoice.count({
        where: {
          status: 'PAID',
          createdAt: { gte: startDate },
        },
      }),
      prisma.invoice.aggregate({
        where: {
          status: 'PAID',
          createdAt: { gte: startDate },
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    // Get credit transaction statistics
    const creditTransactions = await prisma.creditTransaction.groupBy({
      by: ['type'],
      where: { createdAt: { gte: startDate } },
      _sum: {
        amount: true,
      },
      _count: true,
    });

    return NextResponse.json({
      period: daysAgo,
      users: {
        total: totalUsers,
        active: activeUsers,
        new: newUsers,
        suspended: suspendedUsers,
        growth: userGrowth.length,
      },
      workspaces: {
        total: totalWorkspaces,
        growth: workspaceGrowth.length,
      },
      subscriptions: {
        total: totalSubscriptions,
        active: activeSubscriptions,
        trialing: trialingSubscriptions,
        canceled: canceledSubscriptions,
      },
      revenue: {
        total: totalRevenue,
        invoices: invoiceRevenue._sum.amount || 0,
        currency: 'usd',
      },
      aiUsage: {
        totalGenerations,
        totalCreditsUsed: totalCreditsUsed._sum.credits || 0,
        byType: generationsByType,
        byProvider: generationsByProvider,
      },
      invoices: {
        total: totalInvoices,
        paid: paidInvoices,
      },
      credits: {
        transactions: creditTransactions,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
