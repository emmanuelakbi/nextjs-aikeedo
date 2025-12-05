import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import prisma from '@/lib/db/prisma';

/**
 * Admin Reports API
 *
 * Requirements: Admin Dashboard 5 - Analytics and Reporting
 * - Generate financial reports
 * - Export data for analysis
 */

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'revenue';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const format = searchParams.get('format') || 'json';

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    let reportData;

    switch (reportType) {
      case 'revenue':
        reportData = await generateRevenueReport(start, end);
        break;
      case 'user-growth':
        reportData = await generateUserGrowthReport(start, end);
        break;
      case 'ai-usage':
        reportData = await generateAIUsageReport(start, end);
        break;
      case 'financial':
        reportData = await generateFinancialReport(start, end);
        break;
      case 'subscription':
        reportData = await generateSubscriptionReport(start, end);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        );
    }

    if (format === 'csv') {
      const csv = convertToCSV(reportData);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${reportType}-report-${startDate}-${endDate}.csv"`,
        },
      });
    }

    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

async function generateRevenueReport(startDate: Date, endDate: Date) {
  const [invoices, subscriptions, creditTransactions] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        status: 'PAID',
        paidAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            owner: {
              select: {
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        paidAt: 'asc',
      },
    }),
    prisma.subscription.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        plan: {
          select: {
            name: true,
            price: true,
            interval: true,
          },
        },
        workspace: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.creditTransaction.findMany({
      where: {
        type: 'PURCHASE',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        workspace: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  const totalInvoiceRevenue = invoices.reduce(
    (sum: number, invoice: { amount: number }) => sum + invoice.amount,
    0
  );

  const totalSubscriptionRevenue = subscriptions.reduce(
    (sum: number, sub: { plan: { price: number } }) => sum + sub.plan.price,
    0
  );

  const totalCreditPurchases = creditTransactions.reduce(
    (sum: number, tx: { amount: number }) => sum + tx.amount,
    0
  );

  return {
    summary: {
      totalRevenue: totalInvoiceRevenue + totalSubscriptionRevenue,
      invoiceRevenue: totalInvoiceRevenue,
      subscriptionRevenue: totalSubscriptionRevenue,
      creditPurchases: totalCreditPurchases,
      invoiceCount: invoices.length,
      subscriptionCount: subscriptions.length,
      creditTransactionCount: creditTransactions.length,
    },
    // @ts-ignore - Complex Prisma types
    invoices: invoices.map((invoice) => ({
      id: invoice.id,
      workspaceName: invoice.workspace.name,
      ownerEmail: invoice.workspace.owner.email,
      amount: invoice.amount,
      currency: invoice.currency,
      paidAt: invoice.paidAt,
      description: invoice.description,
    })),
    // @ts-ignore - Complex Prisma types
    subscriptions: subscriptions.map((sub) => ({
      id: sub.id,
      workspaceName: sub.workspace.name,
      planName: sub.plan.name,
      price: sub.plan.price,
      interval: sub.plan.interval,
      status: sub.status,
      createdAt: sub.createdAt,
    })),
    // @ts-ignore - Complex Prisma types
    creditTransactions: creditTransactions.map((tx) => ({
      id: tx.id,
      workspaceName: tx.workspace.name,
      amount: tx.amount,
      description: tx.description,
      createdAt: tx.createdAt,
    })),
  };
}

async function generateUserGrowthReport(startDate: Date, endDate: Date) {
  const users = await prisma.user.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      createdAt: true,
      lastSeenAt: true,
      _count: {
        select: {
          ownedWorkspaces: true,
          generations: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  const dailyGrowth = await prisma.user.groupBy({
    by: ['createdAt'],
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    _count: true,
  });

  const statusBreakdown = await prisma.user.groupBy({
    by: ['status'],
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    _count: true,
  });

  return {
    summary: {
      totalNewUsers: users.length,
      dailyGrowth: dailyGrowth.length,
      statusBreakdown,
    },
    // @ts-ignore - Complex Prisma types
    users: users.map((user) => ({
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
      status: user.status,
      workspaceCount: user._count.ownedWorkspaces,
      generationCount: user._count.generations,
      createdAt: user.createdAt,
      lastSeenAt: user.lastSeenAt,
    })),
  };
}

async function generateAIUsageReport(startDate: Date, endDate: Date) {
  const generations = await prisma.generation.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      workspace: {
        select: {
          name: true,
        },
      },
      user: {
        select: {
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  const byType = await prisma.generation.groupBy({
    by: ['type'],
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    _count: true,
    _sum: {
      credits: true,
      tokens: true,
    },
  });

  const byProvider = await prisma.generation.groupBy({
    by: ['provider'],
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    _count: true,
    _sum: {
      credits: true,
      tokens: true,
    },
  });

  const byStatus = await prisma.generation.groupBy({
    by: ['status'],
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    _count: true,
  });

  const totalCredits = generations.reduce((sum: number, gen: { credits: number }) => sum + gen.credits, 0);
  const totalTokens = generations.reduce((sum: number, gen: { tokens: number }) => sum + gen.tokens, 0);

  return {
    summary: {
      totalGenerations: generations.length,
      totalCredits,
      totalTokens,
      byType,
      byProvider,
      byStatus,
    },
    // @ts-ignore - Complex Prisma types
    generations: generations.map((gen) => ({
      id: gen.id,
      workspaceName: gen.workspace.name,
      userEmail: gen.user.email,
      type: gen.type,
      provider: gen.provider,
      model: gen.model,
      credits: gen.credits,
      tokens: gen.tokens,
      status: gen.status,
      createdAt: gen.createdAt,
      completedAt: gen.completedAt,
    })),
  };
}

async function generateFinancialReport(startDate: Date, endDate: Date) {
  const [revenueData, expenses, creditData] = await Promise.all([
    generateRevenueReport(startDate, endDate),
    prisma.creditTransaction.findMany({
      where: {
        type: 'REFUND',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        workspace: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.creditTransaction.groupBy({
      by: ['type'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
      _count: true,
    }),
  ]);

  const totalRefunds = expenses.reduce((sum: number, tx: { amount: number }) => sum + Math.abs(tx.amount), 0);

  return {
    summary: {
      totalRevenue: revenueData.summary.totalRevenue,
      totalRefunds,
      netRevenue: revenueData.summary.totalRevenue - totalRefunds,
      creditTransactions: creditData,
    },
    revenue: revenueData,
    // @ts-ignore - Complex Prisma types
    refunds: expenses.map((tx) => ({
      id: tx.id,
      workspaceName: tx.workspace.name,
      amount: Math.abs(tx.amount),
      description: tx.description,
      createdAt: tx.createdAt,
    })),
  };
}

async function generateSubscriptionReport(startDate: Date, endDate: Date) {
  const subscriptions = await prisma.subscription.findMany({
    where: {
      OR: [
        {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        {
          canceledAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      ],
    },
    include: {
      plan: {
        select: {
          name: true,
          price: true,
          interval: true,
        },
      },
      workspace: {
        select: {
          name: true,
          owner: {
            select: {
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  const statusBreakdown = await prisma.subscription.groupBy({
    by: ['status'],
    _count: true,
  });

  const planBreakdown = await prisma.subscription.groupBy({
    by: ['planId'],
    _count: true,
  });

  const churnedSubscriptions = subscriptions.filter(
    (sub: { canceledAt: Date | null }) => sub.canceledAt && sub.canceledAt >= startDate && sub.canceledAt <= endDate
  );

  const newSubscriptions = subscriptions.filter(
    (sub: { createdAt: Date }) => sub.createdAt >= startDate && sub.createdAt <= endDate
  );

  return {
    summary: {
      totalSubscriptions: subscriptions.length,
      newSubscriptions: newSubscriptions.length,
      churnedSubscriptions: churnedSubscriptions.length,
      churnRate: subscriptions.length > 0
        ? (churnedSubscriptions.length / subscriptions.length) * 100
        : 0,
      statusBreakdown,
      planBreakdown,
    },
    subscriptions: subscriptions.map((sub) => ({
      id: sub.id,
      workspaceName: sub.workspace.name,
      ownerEmail: sub.workspace.owner.email,
      planName: sub.plan.name,
      price: sub.plan.price,
      interval: sub.plan.interval,
      status: sub.status,
      createdAt: sub.createdAt,
      canceledAt: sub.canceledAt,
      currentPeriodStart: sub.currentPeriodStart,
      currentPeriodEnd: sub.currentPeriodEnd,
    })),
  };
}

function convertToCSV(data: any): string {
  if (!data || typeof data !== 'object') {
    return '';
  }

  const rows: string[] = [];

  // Add summary section
  if (data.summary) {
    rows.push('SUMMARY');
    rows.push('');
    Object.entries(data.summary).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        rows.push(`${key}:`);
        if (Array.isArray(value)) {
          value.forEach((item: any) => {
            rows.push(`  ${JSON.stringify(item)}`);
          });
        } else {
          Object.entries(value).forEach(([k, v]) => {
            rows.push(`  ${k},${v}`);
          });
        }
      } else {
        rows.push(`${key},${value}`);
      }
    });
    rows.push('');
  }

  // Add detailed data sections
  const detailSections = Object.keys(data).filter((key) => key !== 'summary');

  detailSections.forEach((section) => {
    const items = data[section];
    if (Array.isArray(items) && items.length > 0) {
      rows.push(section.toUpperCase());
      rows.push('');

      // Add headers
      const headers = Object.keys(items[0]);
      rows.push(headers.join(','));

      // Add data rows
      items.forEach((item: any) => {
        const values = headers.map((header) => {
          const value = item[header];
          if (value === null || value === undefined) {
            return '';
          }
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value;
        });
        rows.push(values.join(','));
      });

      rows.push('');
    }
  });

  return rows.join('\n');
}
