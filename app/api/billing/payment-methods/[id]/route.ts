import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createPaymentMethodService } from '@/infrastructure/services/PaymentMethodService';
import { z } from 'zod';

/**
 * Individual Payment Method API Routes
 * 
 * Handles operations on specific payment methods
 * Requirements: 6.2, 6.3
 */

const updatePaymentMethodSchema = z.object({
  workspaceId: z.string().uuid(),
  setAsDefault: z.boolean(),
});

/**
 * PATCH /api/billing/payment-methods/[id]
 * Update a payment method (set as default)
 * Requirements: 6.2
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updatePaymentMethodSchema.parse(body);

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

    if (!workspace.subscription?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No subscription found for this workspace' },
        { status: 400 }
      );
    }

    const paymentMethodService = createPaymentMethodService(prisma);

    if (validatedData.setAsDefault) {
      const paymentMethod = await paymentMethodService.setDefaultPaymentMethod(
        params.id,
        validatedData.workspaceId,
        workspace.subscription.stripeCustomerId
      );

      return NextResponse.json({
        paymentMethod,
        message: 'Payment method set as default',
      });
    }

    return NextResponse.json(
      { error: 'No valid update operation specified' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating payment method:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to update payment method',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/billing/payment-methods/[id]
 * Remove a payment method
 * Requirements: 6.3
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { error: 'Workspace ID is required' },
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

    const paymentMethodService = createPaymentMethodService(prisma);
    await paymentMethodService.removePaymentMethod(params.id, workspaceId);

    return NextResponse.json({
      message: 'Payment method removed successfully',
    });
  } catch (error) {
    console.error('Error removing payment method:', error);

    return NextResponse.json(
      {
        error: 'Failed to remove payment method',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

