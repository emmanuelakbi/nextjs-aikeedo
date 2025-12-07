/**
 * Get Affiliate Statistics API Route
 * GET /api/affiliate/stats
 * Requirements: Affiliate 4 - Show referral statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { GetAffiliateStatsUseCase } from '@/application/use-cases/affiliate/get-affiliate-stats';
import { PrismaAffiliateRepository } from '@/infrastructure/affiliate/prisma-affiliate-repository';
export const dynamic = 'force-dynamic';


export async function GET(_request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create use case
    const affiliateRepository = new PrismaAffiliateRepository();
    const useCase = new GetAffiliateStatsUseCase(affiliateRepository);

    // Execute use case
    const stats = await useCase.execute(session.user.id);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get affiliate stats error:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Failed to get affiliate statistics' },
      { status: 500 }
    );
  }
}
