/**
 * Track Referral API Route
 * POST /api/affiliate/track
 * Requirements: Affiliate 1 - Track referral signups and conversions
 */

import { NextRequest, NextResponse } from 'next/server';
import { TrackReferralUseCase } from '@/application/use-cases/affiliate/track-referral';
import {
  PrismaAffiliateRepository,
  PrismaReferralRepository,
} from '@/infrastructure/affiliate/prisma-affiliate-repository';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { code, userId } = body;

    // Validate input
    if (!code) {
      return NextResponse.json(
        { error: 'Referral code is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Create use case
    const affiliateRepository = new PrismaAffiliateRepository();
    const referralRepository = new PrismaReferralRepository();
    const useCase = new TrackReferralUseCase(
      affiliateRepository,
      referralRepository
    );

    // Execute use case
    const referral = await useCase.execute({
      affiliateCode: code,
      referredUserId: userId,
    });

    return NextResponse.json({
      success: true,
      data: referral,
    });
  } catch (error) {
    console.error('Track referral error:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to track referral' },
      { status: 500 }
    );
  }
}
