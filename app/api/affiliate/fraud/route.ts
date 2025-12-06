/**
 * Fraud Detection API Route (Admin)
 * GET /api/affiliate/fraud - Get fraud detection reports
 * POST /api/affiliate/fraud - Flag affiliate for fraud
 * Requirements: Affiliate 5 - Detect and prevent fraud
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Check if user is admin
    // if (session.user.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const affiliateId = searchParams.get('affiliateId');

    // Detect suspicious patterns
    const suspiciousAffiliates = await detectSuspiciousPatterns(affiliateId);

    return NextResponse.json({
      success: true,
      data: suspiciousAffiliates,
    });
  } catch (error) {
    console.error('Fraud detection error:', error);

    return NextResponse.json(
      { error: 'Failed to detect fraud' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Check if user is admin
    // if (session.user.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    // Parse request body
    const body = await request.json();
    const { affiliateId, reason, action } = body;

    // Validate input
    if (!affiliateId || !reason || !action) {
      return NextResponse.json(
        { error: 'Affiliate ID, reason, and action are required' },
        { status: 400 }
      );
    }

    if (!['SUSPEND', 'BAN', 'REVIEW'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Update affiliate status
    const affiliate = await prisma.affiliate.update({
      where: { id: affiliateId },
      data: {
        status:
          action === 'BAN'
            ? 'SUSPENDED'
            : action === 'SUSPEND'
              ? 'SUSPENDED'
              : 'ACTIVE',
        updatedAt: new Date(),
      },
    });

    // Log fraud action
    // TODO: Create a separate FraudLog model for better tracking
    console.log(
      `Fraud action: ${action} for affiliate ${affiliateId}. Reason: ${reason}`
    );

    return NextResponse.json({
      success: true,
      data: affiliate,
    });
  } catch (error) {
    console.error('Flag fraud error:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to flag fraud' },
      { status: 500 }
    );
  }
}

async function detectSuspiciousPatterns(affiliateId?: string | null) {
  const suspiciousAffiliates = [];

  // Build query
  const where = affiliateId ? { id: affiliateId } : {};

  // Get all affiliates
  const affiliates = await prisma.affiliate.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      referrals: {
        include: {
          referredUser: true,
        },
      },
    },
  });

  for (const affiliate of affiliates) {
    const flags: string[] = [];
    let riskScore = 0;

    // Check for self-referrals
    const selfReferrals = affiliate.referrals.filter(
      (r) => r.referredUserId === affiliate.userId
    );
    if (selfReferrals.length > 0) {
      flags.push(`Self-referrals detected: ${selfReferrals.length}`);
      riskScore += 50;
    }

    // Check for same IP referrals (would need IP tracking)
    // This is a placeholder for IP-based detection

    // Check for rapid conversions (all conversions within 24 hours)
    const conversions = affiliate.referrals.filter(
      (r) => r.status === 'CONVERTED' && r.convertedAt
    );
    if (conversions.length > 5) {
      const timeSpan =
        conversions[conversions.length - 1].convertedAt!.getTime() -
        conversions[0].convertedAt!.getTime();
      const hoursSpan = timeSpan / (1000 * 60 * 60);

      if (hoursSpan < 24) {
        flags.push(
          `Rapid conversions: ${conversions.length} in ${hoursSpan.toFixed(1)} hours`
        );
        riskScore += 30;
      }
    }

    // Check for unusual conversion rate (>80%)
    const totalReferrals = affiliate.referrals.length;
    const convertedReferrals = conversions.length;
    const conversionRate =
      totalReferrals > 0 ? (convertedReferrals / totalReferrals) * 100 : 0;

    if (conversionRate > 80 && totalReferrals > 10) {
      flags.push(
        `Unusually high conversion rate: ${conversionRate.toFixed(1)}%`
      );
      riskScore += 20;
    }

    // Check for similar email patterns in referrals
    const emails = affiliate.referrals.map((r) => r.referredUser.email);
    const emailDomains = emails.map((e) => e.split('@')[1]);
    const uniqueDomains = new Set(emailDomains);

    if (uniqueDomains.size === 1 && emails.length > 5) {
      flags.push(
        `All referrals from same email domain: ${Array.from(uniqueDomains)[0]}`
      );
      riskScore += 25;
    }

    // Check for canceled referrals after payout
    const canceledAfterPayout = affiliate.referrals.filter(
      (r) => r.status === 'CANCELED' && r.convertedAt
    );
    if (canceledAfterPayout.length > 2) {
      flags.push(
        `Referrals canceled after conversion: ${canceledAfterPayout.length}`
      );
      riskScore += 40;
    }

    // If any flags, add to suspicious list
    if (flags.length > 0) {
      suspiciousAffiliates.push({
        affiliate: {
          id: affiliate.id,
          code: affiliate.code,
          status: affiliate.status,
          user: affiliate.user,
        },
        flags,
        riskScore,
        riskLevel:
          riskScore >= 70 ? 'HIGH' : riskScore >= 40 ? 'MEDIUM' : 'LOW',
        metrics: {
          totalReferrals,
          convertedReferrals,
          conversionRate: conversionRate.toFixed(2),
          totalEarnings: affiliate.totalEarnings,
          pendingEarnings: affiliate.pendingEarnings,
        },
      });
    }
  }

  // Sort by risk score
  suspiciousAffiliates.sort((a, b) => b.riskScore - a.riskScore);

  return suspiciousAffiliates;
}
