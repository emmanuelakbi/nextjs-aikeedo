/**
 * Get Affiliate Referrals API Route
 * GET /api/affiliate/referrals
 * Requirements: Affiliate 4 - View referral history
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  PrismaAffiliateRepository,
  PrismaReferralRepository,
} from '@/infrastructure/affiliate/prisma-affiliate-repository';

export async function GET(_request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find affiliate
    const affiliateRepository = new PrismaAffiliateRepository();
    const affiliate = await affiliateRepository.findByUserId(session.user.id);

    if (!affiliate) {
      return NextResponse.json(
        { error: 'Affiliate account not found' },
        { status: 404 }
      );
    }

    // Get referrals
    const referralRepository = new PrismaReferralRepository();
    const referrals = await referralRepository.findByAffiliateId(affiliate.id);

    return NextResponse.json({
      success: true,
      data: referrals,
    });
  } catch (error) {
    console.error('Get referrals error:', error);

    return NextResponse.json(
      { error: 'Failed to get referrals' },
      { status: 500 }
    );
  }
}
