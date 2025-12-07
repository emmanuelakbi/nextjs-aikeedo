/**
 * Validate Referral Code API Route
 * GET /api/affiliate/validate?code=XXX
 * Requirements: Affiliate 1, 5 - Validate referral codes and detect fraud
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaAffiliateRepository } from '@/infrastructure/affiliate/prisma-affiliate-repository';
export const dynamic = 'force-dynamic';



export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: 'Referral code is required' },
        { status: 400 }
      );
    }

    // Find affiliate by code
    const affiliateRepository = new PrismaAffiliateRepository();
    const affiliate = await affiliateRepository.findByCode(code);

    if (!affiliate) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Invalid referral code',
        },
        { status: 404 }
      );
    }

    // Check if affiliate is active
    if (affiliate.status !== 'ACTIVE') {
      return NextResponse.json(
        {
          valid: false,
          error: 'Referral code is not active',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      data: {
        code: affiliate.code,
        tier: affiliate.tier,
        commissionRate: affiliate.commissionRate,
      },
    });
  } catch (error) {
    console.error('Validate referral code error:', error);

    return NextResponse.json(
      { error: 'Failed to validate referral code' },
      { status: 500 }
    );
  }
}
