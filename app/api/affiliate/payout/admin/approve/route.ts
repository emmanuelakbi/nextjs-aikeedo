/**
 * Approve Payout API Route (Admin)
 * POST /api/affiliate/payout/admin/approve
 * Requirements: Affiliate 3 - Approve/reject payouts
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ApprovePayoutUseCase } from '@/application/use-cases/affiliate/approve-payout';
import { PrismaPayoutRepository } from '@/infrastructure/affiliate/prisma-payout-repository';

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
    const { payoutId, notes } = body;

    // Validate input
    if (!payoutId) {
      return NextResponse.json(
        { error: 'Payout ID is required' },
        { status: 400 }
      );
    }

    // Create use case
    const payoutRepository = new PrismaPayoutRepository();
    const useCase = new ApprovePayoutUseCase(payoutRepository);

    // Execute use case
    const result = await useCase.execute({
      payoutId,
      notes,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result.payout,
    });
  } catch (error) {
    console.error('Approve payout error:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to approve payout' },
      { status: 500 }
    );
  }
}
