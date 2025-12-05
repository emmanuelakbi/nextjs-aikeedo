/**
 * Process Commission API Route
 * POST /api/affiliate/commission/process
 * Requirements: Affiliate 2 - Calculate commissions on payment events
 *
 * Manual commission processing endpoint (for testing and admin use)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ProcessCommissionUseCase } from '@/application/use-cases/affiliate/process-commission';
import {
  PrismaAffiliateRepository,
  PrismaReferralRepository,
} from '@/infrastructure/affiliate/prisma-affiliate-repository';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { userId, amount, transactionType, referenceId } = body;

    // Validate input
    if (!userId || !amount || !transactionType || !referenceId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be positive' },
        { status: 400 }
      );
    }

    if (!['subscription', 'credit_purchase'].includes(transactionType)) {
      return NextResponse.json(
        { error: 'Invalid transaction type' },
        { status: 400 }
      );
    }

    // Create use case
    const affiliateRepository = new PrismaAffiliateRepository();
    const referralRepository = new PrismaReferralRepository();
    const useCase = new ProcessCommissionUseCase(
      affiliateRepository,
      referralRepository
    );

    // Execute use case
    const result = await useCase.execute({
      userId,
      amount,
      transactionType,
      referenceId,
    });

    if (!result.processed) {
      return NextResponse.json(
        {
          success: false,
          reason: result.reason,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        referralId: result.referralId,
        affiliateId: result.affiliateId,
        commission: result.commission,
        commissionFormatted: `$${(result.commission! / 100).toFixed(2)}`,
      },
    });
  } catch (error) {
    console.error('Process commission error:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to process commission' },
      { status: 500 }
    );
  }
}
