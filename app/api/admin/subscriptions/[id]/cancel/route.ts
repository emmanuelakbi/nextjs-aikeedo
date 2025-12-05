import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminAction } from '@/lib/admin';
import prisma from '@/lib/db/prisma';
import { getStripeClient } from '@/lib/stripe';
import { z } from 'zod';

/**
 * Admin Subscription Cancellation API
 *
 * Requirements: Admin Dashboard 3 - Subscription Management
 *
 * POST /api/admin/subscriptions/[id]/cancel - Cancel a subscription
 */

const cancelSchema = z.object({
  immediate: z.boolean().default(false),
  reason: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAdmin();
    const subscriptionId = params.id;
    const body = await request.json();

    // Validate input
    const { immediate, reason } = cancelSchema.parse(body);

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

    // Cancel in Stripe
    const stripe = getStripeClient();
    const stripeSubscription = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        cancel_at_period_end: !immediate,
        ...(immediate && { cancel_at: 'now' }),
      }
    );

    // Update in database
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        cancelAtPeriodEnd: !immediate,
        ...(immediate && {
          status: 'CANCELED',
          canceledAt: new Date(),
        }),
      },
    });

    // Log the action
    await logAdminAction({
      adminId: session.user.id,
      action: immediate ? 'subscription.cancel.immediate' : 'subscription.cancel.end_of_period',
      targetType: 'subscription',
      targetId: subscriptionId,
      changes: {
        immediate,
        reason,
        workspaceName: subscription.workspace.name,
      },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      subscription: updatedSubscription,
      message: immediate
        ? 'Subscription canceled immediately'
        : 'Subscription will cancel at end of period',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error canceling subscription:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
