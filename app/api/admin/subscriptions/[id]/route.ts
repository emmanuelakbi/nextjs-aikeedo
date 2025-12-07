import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import prisma from '@/lib/db/prisma';
export const dynamic = 'force-dynamic';


/**
 * Admin Subscription Management API - Individual Subscription
 *
 * Requirements: Admin Dashboard 3 - Subscription Management
 *
 * GET /api/admin/subscriptions/[id] - Get subscription details
 */

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const subscriptionId = params.id;

    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        workspace: {
          include: {
            owner: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                status: true,
              },
            },
          },
        },
        plan: true,
        invoices: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}
