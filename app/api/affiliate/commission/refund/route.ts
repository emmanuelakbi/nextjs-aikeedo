/**
 * Process Refund API Route
 * POST /api/affiliate/commission/refund
 * Requirements: Affiliate 2 - Handle refunds and chargebacks
 *
 * Manual refund processing endpoint (for testing and admin use)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ProcessRefundUseCase } from '@/application/use-cases/affiliate/process-refund';
import {
  PrismaAffiliateRepository,
  PrismaReferralRepository,
} from '@/infrastructure/affiliate/prisma-affiliate-repository';

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
    const { userId, referenceId, type = 'refund' } = body;

    // Validate input
    if (!userId || !referenceId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['refund', 'chargeback'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid refund type' },
        { status: 400 }
      );
    }

    // Create use case
    const affiliateRepository = new PrismaAffiliateRepository();
    const referralRepository = new PrismaReferralRepository();
    const useCase = new ProcessRefundUseCase(
      affiliateRepository,
      referralRepository
    );

    // Execute use case
    const result = await useCase.execute({
      userId,
      referenceId,
      type,
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
        adjustment: result.adjustment,
        adjustmentFormatted: `$${(result.adjustment! / 100).toFixed(2)}`,
      },
    });
  } catch (error) {
    console.error('Process refund error:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to process refund' },
      { status: 500 }
    );
  }
}
