import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
export const dynamic = 'force-dynamic';



/**
 * Billing Dashboard API Route
 *
 * Provides comprehensive billing information for dashboard display
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */

/**
 * GET /api/billing/dashboard
 * Get comprehensive billing dashboard data
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

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

    // Requirements: 12.1 - Show current plan and usage
    const currentPlan = workspace.subscription?.plan || null;
    const currentSubscription = workspace.subscription || null;

    // Get current period usage
    let currentPeriodUsage = 0;
    let usageByServiceType: any[] = [];

    if (currentSubscription) {
      const usageTransactions = await prisma.creditTransaction.findMany({
        where: {
          workspaceId,
          type: 'USAGE',
          createdAt: {
            gte: currentSubscription.currentPeriodStart,
            lte: currentSubscription.currentPeriodEnd,
          },
        },
      });

      currentPeriodUsage = usageTransactions.reduce(
        (sum, transaction) => sum + Math.abs(transaction.amount),
        0
      );

      // Requirements: 12.4 - Show breakdown by service type
      const serviceTypeMap = new Map<string, number>();
      usageTransactions.forEach((transaction) => {
        const serviceType = transaction.description?.split(':')[0] || 'Other';
        serviceTypeMap.set(
          serviceType,
          (serviceTypeMap.get(serviceType) || 0) + Math.abs(transaction.amount)
        );
      });

      usageByServiceType = Array.from(serviceTypeMap.entries()).map(
        ([type, usage]) => ({
          serviceType: type,
          usage,
          percentage:
            currentPeriodUsage > 0 ? (usage / currentPeriodUsage) * 100 : 0,
        })
      );
    }

    // Requirements: 12.2 - Show current period charges
    let currentPeriodCharges = 0;
    if (currentSubscription && currentPlan) {
      currentPeriodCharges = currentPlan.price;

      // Add overage charges if applicable
      const planLimit = currentPlan.creditCount;
      if (planLimit !== null && currentPeriodUsage > planLimit) {
        const overage = currentPeriodUsage - planLimit;
        const planLimitsData = currentPlan.limits as any;
        const overageRate = planLimitsData?.overageRate || 0.01;
        currentPeriodCharges += overage * overageRate;
      }
    }

    // Requirements: 12.3 - Display past 12 months history
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const invoices = await prisma.invoice.findMany({
      where: {
        workspaceId,
        createdAt: {
          gte: twelveMonthsAgo,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 12,
    });

    // Calculate monthly spending
    const monthlySpending = invoices.reduce(
      (acc, invoice) => {
        const month = new Date(invoice.createdAt).toISOString().slice(0, 7); // YYYY-MM
        acc[month] = (acc[month] || 0) + invoice.amount;
        return acc;
      },
      {} as Record<string, number>
    );

    // Requirements: 12.5 - Indicate remaining quota
    const creditLimit = currentPlan?.creditCount || null;
    const currentBalance = workspace.creditCount;
    const remainingQuota =
      creditLimit !== null
        ? Math.max(0, creditLimit - currentPeriodUsage)
        : null;

    // Get payment methods
    const paymentMethods = currentSubscription?.stripeCustomerId
      ? await getPaymentMethods(currentSubscription.stripeCustomerId)
      : [];

    // Calculate days until next billing
    let daysUntilNextBilling = null;
    if (currentSubscription) {
      const now = new Date();
      const nextBilling = new Date(currentSubscription.currentPeriodEnd);
      daysUntilNextBilling = Math.ceil(
        (nextBilling.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    return NextResponse.json({
      // Requirements: 12.1 - Current plan and usage
      currentPlan: currentPlan
        ? {
            id: currentPlan.id,
            name: currentPlan.name,
            description: currentPlan.description,
            price: currentPlan.price,
            currency: currentPlan.currency,
            interval: currentPlan.interval,
            creditCount: currentPlan.creditCount,
            features: currentPlan.features,
            limits: currentPlan.limits,
          }
        : null,

      subscription: currentSubscription
        ? {
            id: currentSubscription.id,
            status: currentSubscription.status,
            currentPeriodStart:
              currentSubscription.currentPeriodStart.toISOString(),
            currentPeriodEnd:
              currentSubscription.currentPeriodEnd.toISOString(),
            cancelAtPeriodEnd: currentSubscription.cancelAtPeriodEnd,
            trialEnd: currentSubscription.trialEnd?.toISOString() || null,
            daysUntilNextBilling,
          }
        : null,

      // Requirements: 12.2 - Current period charges
      currentPeriod: {
        charges: currentPeriodCharges,
        usage: currentPeriodUsage,
        start: currentSubscription?.currentPeriodStart.toISOString() || null,
        end: currentSubscription?.currentPeriodEnd.toISOString() || null,
      },

      // Requirements: 12.3 - Past 12 months history
      billingHistory: {
        invoices: invoices.map((invoice) => ({
          id: invoice.id,
          amount: invoice.amount,
          currency: invoice.currency,
          status: invoice.status,
          paidAt: invoice.paidAt?.toISOString() || null,
          invoiceUrl: invoice.invoiceUrl,
          createdAt: invoice.createdAt.toISOString(),
        })),
        monthlySpending,
        totalSpent: invoices.reduce((sum: number, inv: any) => sum + inv.amount, 0),
      },

      // Requirements: 12.4 - Usage breakdown by service type
      usage: {
        current: currentPeriodUsage,
        byServiceType: usageByServiceType,
      },

      // Requirements: 12.5 - Remaining quota
      credits: {
        current: currentBalance,
        limit: creditLimit,
        used: currentPeriodUsage,
        remaining: remainingQuota,
        percentageUsed:
          creditLimit !== null && creditLimit > 0
            ? (currentPeriodUsage / creditLimit) * 100
            : null,
      },

      paymentMethods,
    });
  } catch (error) {
    console.error('Error fetching billing dashboard:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch billing dashboard',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Helper function to get payment methods from Stripe
 */
async function getPaymentMethods(stripeCustomerId: string): Promise<any[]> {
  try {
    const { stripeService } =
      await import('@/infrastructure/services/StripeService');
    const paymentMethods =
      await stripeService.listPaymentMethods(stripeCustomerId);

    return paymentMethods.data.map((pm: any) => ({
      id: pm.id,
      type: pm.type,
      card: pm.card
        ? {
            brand: pm.card.brand,
            last4: pm.card.last4,
            expMonth: pm.card.exp_month,
            expYear: pm.card.exp_year,
          }
        : null,
      isDefault: pm.id === paymentMethods.data[0]?.id, // First one is typically default
    }));
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return [];
  }
}
