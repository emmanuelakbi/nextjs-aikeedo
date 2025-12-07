/**
 * List Pending Payouts API Route (Admin)
 * GET /api/affiliate/payout/admin/pending
 * Requirements: Affiliate 3 - Track payout history
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db/prisma';
export const dynamic = 'force-dynamic';



export async function GET(_request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Check if user is admin
    // if (session.user.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    // Get pending payouts with affiliate information
    const payouts = await prisma.payout.findMany({
      where: { status: 'PENDING' },
      include: {
        affiliate: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: payouts,
    });
  } catch (error) {
    console.error('List pending payouts error:', error);

    return NextResponse.json(
      { error: 'Failed to list pending payouts' },
      { status: 500 }
    );
  }
}
