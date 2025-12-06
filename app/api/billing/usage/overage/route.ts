import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { stripeService } from '@/infrastructure/services/StripeService';
import { z } from 'zod';

/**
 * Overage Billing API Routes
 * 
 * Handles overage fee calculations and charging
 * Requirements: 10.1, 10.2, 10.3, 10.5
 */

const calculateOverageSchema = z.object({
  workspaceId: z.string().uuid(),
  billingPeriodStart: z.string().datetime().optional(),
  billingPeriodEnd: z.string().datetime().optional(),
});

/**
 * POST /api/billing/usage/overage
 * Calculate and charge overage fees for a billing period
 * Requirements: 10.1, 10.2, 10.3
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = calculateOverageSchema.parse(body);

    // Verify user has access to workspace (admin only)
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: validatedData.workspaceId,
        OR: [
          { ownerId: session.user.id },
          {
            members: {
              some: {
                userId: session.user.id,
                role: 'OWNER',
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

    if (!workspace.subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 }
      );
    }

    // Determine billing period
    const periodStart = validatedData.billingPeriodStart
      ? new Date(validatedData.billingPeriodStart)
      : workspace.subscription.currentPeriodStart;
    
    const periodEnd = validatedData.billingPeriodEnd
      ? new Date(validatedData.billingPeriodEnd)
      : workspace.subscription.currentPeriodEnd;

    // Requirements: 10.3 - Calculate total usage charges for billing period
    const usageTransactions = await prisma.creditTransaction.findMany({
      where: {
        workspaceId: validatedData.workspaceId,
        type: 'USAGE',
        createdAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
    });

    const totalUsage = usageTransactions.reduce(
      (sum, transaction) => sum + Math.abs(transaction.amount),
      0
    );

    // Get plan limits
    const planLimits = workspace.subscription.plan.creditCount;
    
    if (planLimits === null) {
      return NextResponse.json({
        message: 'Plan has unlimited credits, no overage charges',
        totalUsage,
        overage: 0,
        charges: 0,
      });
    }

    // Requirements: 10.1 - Check if usage exceeds plan limits
    if (totalUsage <= planLimits) {
      return NextResponse.json({
        message: 'Usage within plan limits, no overage charges',
        totalUsage,
        limit: planLimits,
        overage: 0,
        charges: 0,
      });
    }

    // Calculate overage
    const overage = totalUsage - planLimits;
    
    // Get overage rate from plan limits
    const planLimitsData = workspace.subscription.plan.limits as any;
    const overageRate = planLimitsData?.overageRate || 0.01; // Default $0.01 per credit
    
    // Requirements: 10.2 - Use per-unit pricing
    const overageCharges = overage * overageRate;

    // Create invoice item in Stripe for overage charges
    if (workspace.subscription.stripeCustomerId && overageCharges > 0) {
      try {
        await stripeService.createInvoiceItem({
          customer: workspace.subscription.stripeCustomerId,
          amount: Math.round(overageCharges * 100), // Convert to cents
          currency: workspace.subscription.plan.currency,
          description: `Overage charges: ${overage} credits @ $${overageRate} per credit`,
          metadata: {
            workspaceId: validatedData.workspaceId,
            billingPeriodStart: periodStart.toISOString(),
            billingPeriodEnd: periodEnd.toISOString(),
            overage: overage.toString(),
            overageRate: overageRate.toString(),
          },
        });

        // Requirements: 10.5 - Notify user of overage
        try {
          const user = await prisma.user.findUnique({
            where: { id: workspace.ownerId },
            select: { email: true, firstName: true },
          });

          if (user) {
            const { sendOverageNotification } = await import('@/lib/email');
            await sendOverageNotification(user.email, {
              firstName: user.firstName,
              workspaceName: workspace.name,
              overage,
              overageCharges,
              totalUsage,
              planLimit: planLimits,
              billingPeriodEnd: periodEnd.toISOString(),
            });
          }
        } catch (emailError) {
          console.error('Failed to send overage notification:', emailError);
        }

        return NextResponse.json({
          message: 'Overage charges calculated and added to next invoice',
          totalUsage,
          limit: planLimits,
          overage,
          overageRate,
          charges: overageCharges,
          billingPeriod: {
            start: periodStart.toISOString(),
            end: periodEnd.toISOString(),
          },
        });
      } catch (stripeError) {
        console.error('Failed to create Stripe invoice item:', stripeError);
        return NextResponse.json(
          {
            error: 'Failed to charge overage fees',
            details: stripeError instanceof Error ? stripeError.message : 'Unknown error',
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      message: 'Overage calculated but not charged (no Stripe customer)',
      totalUsage,
      limit: planLimits,
      overage,
      overageRate,
      charges: overageCharges,
    });
  } catch (error) {
    console.error('Error calculating overage:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to calculate overage',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/billing/usage/overage
 * Get current overage status for a workspace
 * Requirements: 10.1, 10.4
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
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

    if (!workspace.subscription) {
      return NextResponse.json({
        hasOverage: false,
        message: 'No active subscription',
      });
    }

    // Get current period usage
    const usageTransactions = await prisma.creditTransaction.findMany({
      where: {
        workspaceId,
        type: 'USAGE',
        createdAt: {
          gte: workspace.subscription.currentPeriodStart,
          lte: workspace.subscription.currentPeriodEnd,
        },
      },
    });

    const totalUsage = usageTransactions.reduce(
      (sum, transaction) => sum + Math.abs(transaction.amount),
      0
    );

    const planLimits = workspace.subscription.plan.creditCount;
    
    if (planLimits === null) {
      return NextResponse.json({
        hasOverage: false,
        totalUsage,
        limit: null,
        message: 'Unlimited plan',
      });
    }

    const hasOverage = totalUsage > planLimits;
    const overage = hasOverage ? totalUsage - planLimits : 0;
    
    const planLimitsData = workspace.subscription.plan.limits as any;
    const overageRate = planLimitsData?.overageRate || 0.01;
    const overageCharges = overage * overageRate;

    return NextResponse.json({
      hasOverage,
      totalUsage,
      limit: planLimits,
      overage,
      overageRate,
      estimatedCharges: overageCharges,
      currentPeriod: {
        start: workspace.subscription.currentPeriodStart.toISOString(),
        end: workspace.subscription.currentPeriodEnd.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error checking overage status:', error);
    return NextResponse.json(
      {
        error: 'Failed to check overage status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
