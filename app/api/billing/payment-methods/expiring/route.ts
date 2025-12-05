import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createPaymentMethodService } from '@/infrastructure/services/PaymentMethodService';

/**
 * Expiring Payment Methods API Route
 * 
 * Checks for payment methods that are expiring soon
 * Requirements: 6.4
 */

/**
 * GET /api/billing/payment-methods/expiring
 * Get expiring payment methods for a workspace
 * Requirements: 6.4
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
    const daysThreshold = parseInt(searchParams.get('days') || '30', 10);

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
    const expiringPaymentMethods =
      await paymentMethodService.getExpiringPaymentMethods(
        workspaceId,
        daysThreshold
      );

    return NextResponse.json({
      expiringPaymentMethods,
      count: expiringPaymentMethods.length,
      daysThreshold,
    });
  } catch (error) {
    console.error('Error checking expiring payment methods:', error);
    return NextResponse.json(
      {
        error: 'Failed to check expiring payment methods',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

