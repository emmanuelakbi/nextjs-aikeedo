import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { stripeService } from '@/infrastructure/services/StripeService';
import { subscriptionService } from '@/infrastructure/services/SubscriptionService';
import { z } from 'zod';
export const dynamic = 'force-dynamic';



/**
 * GET /api/billing/checkout/success
 * Retrieves checkout session details after successful payment
 * Requirements: 2.2, 2.5
 */

const successQuerySchema = z.object({
  session_id: z.string(),
});

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const validationResult = successQuerySchema.safeParse({
      session_id: searchParams.get('session_id'),
    });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid session ID',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { session_id } = validationResult.data;

    // Retrieve checkout session from Stripe
    const checkoutSession =
      await stripeService.retrieveCheckoutSession(session_id);

    // Verify session belongs to the authenticated user
    const workspaceId = checkoutSession.metadata?.workspaceId;
    const userId = checkoutSession.metadata?.userId;

    if (!workspaceId || userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 404 }
      );
    }

    // Check if payment was successful
    if (
      checkoutSession.payment_status !== 'paid' &&
      checkoutSession.status !== 'complete'
    ) {
      return NextResponse.json(
        {
          error: 'Payment not completed',
          status: checkoutSession.payment_status,
          sessionStatus: checkoutSession.status,
        },
        { status: 400 }
      );
    }

    // Get subscription details
    let subscription = null;
    if (checkoutSession.subscription) {
      const stripeSubscriptionId =
        typeof checkoutSession.subscription === 'string'
          ? checkoutSession.subscription
          : checkoutSession.subscription.id;

      subscription =
        await subscriptionService.getSubscriptionByStripeId(
          stripeSubscriptionId
        );
    }

    return NextResponse.json({
      success: true,
      sessionId: checkoutSession.id,
      paymentStatus: checkoutSession.payment_status,
      customerEmail: checkoutSession.customer_email,
      amountTotal: checkoutSession.amount_total,
      currency: checkoutSession.currency,
      subscription: subscription
        ? {
            id: subscription.id,
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd,
            trialEnd: subscription.trialEnd,
          }
        : null,
    });
  } catch (error) {
    console.error('Error retrieving checkout session:', error);

    if (error instanceof Error) {
      if (error.message.includes('No such checkout.session')) {
        return NextResponse.json(
          { error: 'Checkout session not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to retrieve checkout session' },
      { status: 500 }
    );
  }
}
