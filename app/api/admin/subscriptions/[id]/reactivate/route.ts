import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminAction } from '@/lib/admin';
import prisma from '@/lib/db/prisma';
import { getStripeClient } from '@/lib/stripe';
export const dynamic = 'force-dynamic';


/**
 * Admin Subscription Reactivation API
 *
 * Requirements: Admin Dashboard 3 - Subscription Management
 *
 * POST /api/admin/subscriptions/[id]/reactivate - Reactivate a canceled subscription
 */

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAdmin();
    const subscriptionId = params.id;

    // Get subscription
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        workspace: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    if (!subscription.cancelAtPeriodEnd) {
      return NextResponse.json(
        { error: 'Subscription is not scheduled for cancellation' },
        { status: 400 }
      );
    }

    // Reactivate in Stripe
    const stripeService = getStripeClient();
    const stripe = stripeService.getClient();
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    // Update in database
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        cancelAtPeriodEnd: false,
        canceledAt: null,
      },
    });

    // Log the action
    await logAdminAction({
      adminId: session.user.id,
      action: 'subscription.reactivate',
      targetType: 'subscription',
      targetId: subscriptionId,
      changes: {
        workspaceName: subscription.workspace.name,
      },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      subscription: updatedSubscription,
      message: 'Subscription reactivated successfully',
    });
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to reactivate subscription' },
      { status: 500 }
    );
  }
}
