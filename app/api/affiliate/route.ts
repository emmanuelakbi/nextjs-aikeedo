/**
 * Affiliate Account API Route
 * GET /api/affiliate - Get current user's affiliate account
 * PATCH /api/affiliate - Update affiliate settings
 * Requirements: Affiliate 1, 4 - Manage affiliate account
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaAffiliateRepository } from '@/infrastructure/affiliate/prisma-affiliate-repository';
import prisma from '@/lib/db/prisma';
export const dynamic = 'force-dynamic';


export async function GET() {
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

    return NextResponse.json({
      success: true,
      data: affiliate,
    });
  } catch (error) {
    console.error('Get affiliate error:', error);

    return NextResponse.json(
      { error: 'Failed to get affiliate account' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { payoutEmail, payoutMethod, notes } = body;

    // Find affiliate
    const affiliateRepository = new PrismaAffiliateRepository();
    const affiliate = await affiliateRepository.findByUserId(session.user.id);

    if (!affiliate) {
      return NextResponse.json(
        { error: 'Affiliate account not found' },
        { status: 404 }
      );
    }

    // Update affiliate settings
    const updated = await prisma.affiliate.update({
      where: { id: affiliate.id },
      data: {
        ...(payoutEmail && { payoutEmail }),
        ...(payoutMethod && { payoutMethod }),
        ...(notes && { notes }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Update affiliate error:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to update affiliate account' },
      { status: 500 }
    );
  }
}
