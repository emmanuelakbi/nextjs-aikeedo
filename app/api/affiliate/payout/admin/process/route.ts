/**
 * Process Payout API Route (Admin)
 * POST /api/affiliate/payout/admin/process
 * Requirements: Affiliate 3 - Process via PayPal/Stripe
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ProcessPayoutUseCase } from '@/application/use-cases/affiliate/process-payout';
import { PrismaAffiliateRepository } from '@/infrastructure/affiliate/prisma-affiliate-repository';
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
    const { payoutId } = body;

    // Validate input
    if (!payoutId) {
      return NextResponse.json(
        { error: 'Payout ID is required' },
        { status: 400 }
      );
    }

    // Create use case
    const affiliateRepository = new PrismaAffiliateRepository();
    const payoutRepository = new PrismaPayoutRepository();
    const useCase = new ProcessPayoutUseCase(
      affiliateRepository,
      payoutRepository
    );

    // Execute use case
    const result = await useCase.execute({
      payoutId,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result.payout,
    });
  } catch (error) {
    console.error('Process payout error:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to process payout' },
      { status: 500 }
    );
  }
}
