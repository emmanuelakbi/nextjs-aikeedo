/**
 * Create Affiliate API Route
 * POST /api/affiliate/create
 * Requirements: Affiliate 1 - Generate unique referral codes
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { CreateAffiliateUseCase } from '@/application/use-cases/affiliate/create-affiliate';
import { PrismaAffiliateRepository } from '@/infrastructure/affiliate/prisma-affiliate-repository';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { code, commissionRate, tier } = body;

    // Create use case
    const affiliateRepository = new PrismaAffiliateRepository();
    const useCase = new CreateAffiliateUseCase(affiliateRepository);

    // Execute use case
    const affiliate = await useCase.execute({
      userId: session.user.id,
      code,
      commissionRate,
      tier,
    });

    return NextResponse.json(
      {
        success: true,
        data: affiliate,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create affiliate error:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to create affiliate account' },
      { status: 500 }
    );
  }
}
