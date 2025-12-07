/**
 * Reject Payout API Route (Admin)
 * POST /api/affiliate/payout/admin/reject
 * Requirements: Affiliate 3 - Approve/reject payouts
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { RejectPayoutUseCase } from '@/application/use-cases/affiliate/reject-payout';
import { PrismaPayoutRepository } from '@/infrastructure/affiliate/prisma-payout-repository';
export const dynamic = 'force-dynamic';


export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { payoutId, reason } = body;

    // Validate input
    if (!payoutId || !reason) {
      return NextResponse.json(
        { error: 'Payout ID and reason are required' },
        { status: 400 }
      );
    }

    // Create use case
    const payoutRepository = new PrismaPayoutRepository();
    const useCase = new RejectPayoutUseCase(payoutRepository);

    // Execute use case
    const result = await useCase.execute({
      payoutId,
      reason,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result.payout,
    });
  } catch (error) {
    console.error('Reject payout error:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to reject payout' },
      { status: 500 }
    );
  }
}
