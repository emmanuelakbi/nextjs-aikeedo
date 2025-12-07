import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { subscriptionService } from '@/infrastructure/services/SubscriptionService';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import {
export const dynamic = 'force-dynamic';


  withRateLimit,
  checkoutRateLimiter,
} from '@/lib/middleware/rate-limit';

/**
 * POST /api/billing/checkout
 * Creates a Stripe checkout session for subscription
 * Requirements: 2.1, 2.2, 2.4
 */

const createCheckoutSchema = z.object({
  planId: z.string().uuid(),
  workspaceId: z.string().uuid(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
  trialDays: z.number().int().min(0).max(90).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // FIX: Apply rate limiting per user
    const rateLimitResponse = await withRateLimit(
      request,
      checkoutRateLimiter,
      session.user.id
    );
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createCheckoutSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { planId, workspaceId, successUrl, cancelUrl, trialDays } =
      validationResult.data;

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
                role: { in: ['OWNER', 'ADMIN'] },
              },
            },
          },
        ],
      },
      include: {
        subscription: true,
      },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found or access denied' },
        { status: 404 }
      );
    }

    // Check if workspace already has active subscription
    if (
      workspace.subscription &&
      (workspace.subscription.status === 'ACTIVE' ||
        workspace.subscription.status === 'TRIALING')
    ) {
      return NextResponse.json(
        { error: 'Workspace already has an active subscription' },
        { status: 400 }
      );
    }

    // Verify plan exists and is active
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    if (!plan.isActive) {
      return NextResponse.json(
        { error: 'Plan is not available for subscription' },
        { status: 400 }
      );
    }

    // Determine trial eligibility
    // Requirements: 8.4 - Only one trial per workspace
    // FIX: Check if user has ever used a trial, not just this workspace
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { hasUsedTrial: true },
    });

    const hasUserUsedTrial = user?.hasUsedTrial || workspace.isTrialed;
    const effectiveTrialDays =
      trialDays && !hasUserUsedTrial ? trialDays : undefined;

    // Build success and cancel URLs
    const baseUrl =
      process.env.NEXTAUTH_URL ||
      process.env.APP_URL ||
      'http://localhost:3000';
    const defaultSuccessUrl = `${baseUrl}/dashboard/billing?success=true&session_id={CHECKOUT_SESSION_ID}`;
    const defaultCancelUrl = `${baseUrl}/dashboard/billing?canceled=true`;

    // Create checkout session
    const checkoutSession = await subscriptionService.createCheckoutSession({
      workspaceId,
      planId,
      email: session.user.email,
      successUrl: successUrl || defaultSuccessUrl,
      cancelUrl: cancelUrl || defaultCancelUrl,
      trialDays: effectiveTrialDays,
      metadata: {
        userId: session.user.id,
        userEmail: session.user.email,
      },
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
      trialOffered: !!effectiveTrialDays,
      trialDays: effectiveTrialDays,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Stripe is not configured')) {
        return NextResponse.json(
          { error: 'Payment processing is not configured' },
          { status: 503 }
        );
      }

      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
