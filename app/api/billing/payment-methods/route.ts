import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createPaymentMethodService } from '@/infrastructure/services/PaymentMethodService';
import { z } from 'zod';

/**
 * Payment Methods API Routes
 * 
 * Handles listing and adding payment methods for workspaces
 * Requirements: 6.1, 6.2
 */

const addPaymentMethodSchema = z.object({
  workspaceId: z.string().uuid(),
  paymentMethodId: z.string(),
  setAsDefault: z.boolean().optional().default(false),
});

/**
 * GET /api/billing/payment-methods
 * List payment methods for a workspace
 * Requirements: 6.1
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
    const paymentMethods = await paymentMethodService.listPaymentMethods(
      workspaceId
    );

    return NextResponse.json({
      paymentMethods,
    });
  } catch (error) {
    console.error('Error listing payment methods:', error);
    return NextResponse.json(
      {
        error: 'Failed to list payment methods',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/billing/payment-methods
 * Add a new payment method to a workspace
 * Requirements: 6.1
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
    const validatedData = addPaymentMethodSchema.parse(body);

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

    // Get or create Stripe customer ID
    let stripeCustomerId = workspace.subscription?.stripeCustomerId;

    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: 'No subscription found for this workspace' },
        { status: 400 }
      );
    }

    const paymentMethodService = createPaymentMethodService(prisma);
    const paymentMethod = await paymentMethodService.addPaymentMethod(
      validatedData.workspaceId,
      validatedData.paymentMethodId,
      stripeCustomerId,
      validatedData.setAsDefault
    );

    return NextResponse.json({
      paymentMethod,
      message: 'Payment method added successfully',
    });
  } catch (error) {
    console.error('Error adding payment method:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to add payment method',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

