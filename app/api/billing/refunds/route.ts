import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { stripeService } from '@/infrastructure/services/StripeService';
import { z } from 'zod';
export const dynamic = 'force-dynamic';


/**
 * Refund API Routes
 *
 * Handles refund requests for subscriptions and credit purchases
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 */

const createRefundSchema = z
  .object({
    paymentIntentId: z.string().optional(),
    chargeId: z.string().optional(),
    amount: z.number().positive().optional(),
    reason: z
      .enum(['duplicate', 'fraudulent', 'requested_by_customer'])
      .optional(),
    workspaceId: z.string().uuid(),
  })
  .refine((data) => data.paymentIntentId || data.chargeId, {
    message: 'Either paymentIntentId or chargeId must be provided',
  });

/**
 * POST /api/billing/refunds
 * Request a refund for a payment
 * Requirements: 11.1, 11.2
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createRefundSchema.parse(body);

    // Verify user has access to workspace
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: validatedData.workspaceId,
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
    });

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found or access denied' },
        { status: 404 }
      );
    }

    // Requirements: 11.1 - Process refund via Stripe
    const refund = await stripeService.createRefund({
      payment_intent: validatedData.paymentIntentId,
      charge: validatedData.chargeId,
      amount: validatedData.amount
        ? Math.round(validatedData.amount * 100)
        : undefined,
      reason: validatedData.reason,
      metadata: {
        workspaceId: validatedData.workspaceId,
        userId: session.user.id,
        requestedAt: new Date().toISOString(),
      },
    });

    // Requirements: 11.2 - Deduct credits proportionally if applicable
    if (refund.status === 'succeeded' && validatedData.paymentIntentId) {
      // Find the credit transaction associated with this payment
      const creditTransaction = await prisma.creditTransaction.findFirst({
        where: {
          referenceId: validatedData.paymentIntentId,
          referenceType: 'payment_intent',
          type: 'PURCHASE',
          workspaceId: validatedData.workspaceId,
        },
      });

      if (creditTransaction) {
        // Calculate proportional credit deduction
        const refundAmount = refund.amount / 100; // Convert from cents
        const originalAmount = creditTransaction.amount;
        const refundPercentage = validatedData.amount
          ? validatedData.amount / (refund.amount / 100)
          : 1;

        const creditsToDeduct = Math.floor(originalAmount * refundPercentage);

        // Deduct credits from workspace
        const currentWorkspace = await prisma.workspace.findUnique({
          where: { id: validatedData.workspaceId },
        });

        if (currentWorkspace) {
          const balanceBefore = currentWorkspace.creditCount;
          const balanceAfter = Math.max(0, balanceBefore - creditsToDeduct);

          await prisma.workspace.update({
            where: { id: validatedData.workspaceId },
            data: {
              creditCount: balanceAfter,
              creditsAdjustedAt: new Date(),
            },
          });

          // Log the refund transaction
          await prisma.creditTransaction.create({
            data: {
              workspaceId: validatedData.workspaceId,
              amount: -creditsToDeduct,
              type: 'REFUND',
              description: `Refund: ${creditsToDeduct} credits deducted (${refundPercentage * 100}% refund)`,
              referenceId: refund.id,
              referenceType: 'refund',
              balanceBefore,
              balanceAfter,
            },
          });
        }
      }
    }

    // Requirements: 11.3 - Send confirmation email
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { email: true, firstName: true },
      });

      if (user) {
        const { sendRefundConfirmation } = await import('@/lib/email');
        await sendRefundConfirmation(user.email, {
          firstName: user.firstName,
          refundAmount: refund.amount / 100,
          currency: refund.currency.toUpperCase(),
          refundId: refund.id,
          status: refund.status || 'pending',
        });
      }
    } catch (emailError) {
      // Log email error but don't fail the refund
      console.error('Failed to send refund confirmation email:', emailError);
    }

    return NextResponse.json({
      refund: {
        id: refund.id,
        amount: refund.amount / 100,
        currency: refund.currency,
        status: refund.status,
        reason: refund.reason,
        createdAt: new Date(refund.created * 1000).toISOString(),
      },
      message: 'Refund processed successfully',
    });
  } catch (error) {
    console.error('Error processing refund:', error);

    // Requirements: 11.4 - Notify administrator on failure
    if (error instanceof Error && error.message.includes('Stripe')) {
      // Log for admin review
      console.error('ADMIN ALERT: Refund failed', {
        error: error.message,
        userId: (await auth())?.user?.id,
        timestamp: new Date().toISOString(),
      });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to process refund',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/billing/refunds
 * List refunds for a workspace
 * Requirements: 11.1
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

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
    });

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found or access denied' },
        { status: 404 }
      );
    }

    // Get refund transactions from credit transactions
    const refundTransactions = await prisma.creditTransaction.findMany({
      where: {
        workspaceId,
        type: 'REFUND',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return NextResponse.json({
      refunds: refundTransactions,
      total: refundTransactions.length,
    });
  } catch (error) {
    console.error('Error listing refunds:', error);
    return NextResponse.json(
      {
        error: 'Failed to list refunds',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
