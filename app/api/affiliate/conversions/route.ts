/**
 * Affiliate Conversions API Route
 * GET /api/affiliate/conversions
 * Requirements: Affiliate 4 - Track conversion rates
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaAffiliateRepository } from '@/infrastructure/affiliate/prisma-affiliate-repository';
import prisma from '@/lib/db/prisma';
export const dynamic = 'force-dynamic';



export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // PENDING, CONVERTED, CANCELED
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Find affiliate
    const affiliateRepository = new PrismaAffiliateRepository();
    const affiliate = await affiliateRepository.findByUserId(session.user.id);

    if (!affiliate) {
      return NextResponse.json(
        { error: 'Affiliate account not found' },
        { status: 404 }
      );
    }

    // Build query
    const where: any = { affiliateId: affiliate.id };
    if (status && ['PENDING', 'CONVERTED', 'CANCELED'].includes(status)) {
      where.status = status;
    }

    // Get conversions with pagination
    const [conversions, total] = await Promise.all([
      prisma.referral.findMany({
        where,
        include: {
          referredUser: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.referral.count({ where }),
    ]);

    // Calculate conversion metrics
    const allReferrals = await prisma.referral.findMany({
      where: { affiliateId: affiliate.id },
      select: { status: true },
    });

    const metrics = {
      total: allReferrals.length,
      pending: allReferrals.filter((r) => r.status === 'PENDING').length,
      converted: allReferrals.filter((r) => r.status === 'CONVERTED').length,
      canceled: allReferrals.filter((r) => r.status === 'CANCELED').length,
      conversionRate:
        allReferrals.length > 0
          ? (
              (allReferrals.filter((r) => r.status === 'CONVERTED').length /
                allReferrals.length) *
              100
            ).toFixed(2)
          : '0.00',
    };

    return NextResponse.json({
      success: true,
      data: {
        conversions: conversions.map((c) => ({
          id: c.id,
          status: c.status,
          commission: c.commission,
          commissionFormatted: `$${((c.commission || 0) / 100).toFixed(2)}`,
          conversionValue: c.conversionValue,
          conversionValueFormatted: `$${((c.conversionValue || 0) / 100).toFixed(2)}`,
          convertedAt: c.convertedAt,
          createdAt: c.createdAt,
          user: c.referredUser,
        })),
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
        metrics,
      },
    });
  } catch (error) {
    console.error('Get conversions error:', error);

    return NextResponse.json(
      { error: 'Failed to get conversions' },
      { status: 500 }
    );
  }
}
