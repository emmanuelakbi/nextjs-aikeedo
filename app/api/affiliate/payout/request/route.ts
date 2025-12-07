/**
 * Request Payout API Route
 * POST /api/affiliate/payout/request
 * Requirements: Affiliate 3 - Request payouts
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { RequestPayoutUseCase } from '@/application/use-cases/affiliate/request-payout';
import { PrismaAffiliateRepository } from '@/infrastructure/affiliate/prisma-affiliate-repository';
import { PrismaPayoutRepository } from '@/infrastructure/affiliate/prisma-payout-repository';
export const dynamic = 'force-dynamic';



export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { amount, method, notes } = body;

    // Validate input
    if (!amount || !method) {
      return NextResponse.json(
        { error: 'Amount and method are required' },
        { status: 400 }
      );
    }

    if (!['PAYPAL', 'STRIPE', 'BANK_TRANSFER'].includes(method)) {
      return NextResponse.json(
        { error: 'Invalid payout method' },
        { status: 400 }
      );
    }

    // Create use case
    const affiliateRepository = new PrismaAffiliateRepository();
    const payoutRepository = new PrismaPayoutRepository();
    const useCase = new RequestPayoutUseCase(
      affiliateRepository,
      payoutRepository
    );

    // Execute use case
    const result = await useCase.execute({
      userId: session.user.id,
      amount,
      method,
      notes,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(
      {
        success: true,
        data: result.payout,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Request payout error:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to request payout' },
      { status: 500 }
    );
  }
}
