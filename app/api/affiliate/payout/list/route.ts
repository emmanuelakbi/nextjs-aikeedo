/**
 * List Payouts API Route
 * GET /api/affiliate/payout/list
 * Requirements: Affiliate 3 - Track payout history
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaAffiliateRepository } from '@/infrastructure/affiliate/prisma-affiliate-repository';
import { PrismaPayoutRepository } from '@/infrastructure/affiliate/prisma-payout-repository';

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

    // Get payouts
    const payoutRepository = new PrismaPayoutRepository();
    const payouts = await payoutRepository.findByAffiliateId(affiliate.id);

    // Get payout statistics
    const stats = await payoutRepository.getStats(affiliate.id);

    return NextResponse.json({
      success: true,
      data: {
        payouts,
        stats,
      },
    });
  } catch (error) {
    console.error('List payouts error:', error);

    return NextResponse.json(
      { error: 'Failed to list payouts' },
      { status: 500 }
    );
  }
}
