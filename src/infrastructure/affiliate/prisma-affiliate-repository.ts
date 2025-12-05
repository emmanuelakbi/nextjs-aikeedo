/**
 * Prisma Affiliate Repository Implementation
 * Requirements: Affiliate 1, 2
 */

import prisma from '@/lib/db/prisma';
import type {
  AffiliateRepository,
  ReferralRepository,
} from '@/domain/affiliate/repositories/affiliate-repository';
import type { Affiliate, Referral } from '@/types/affiliate';

export class PrismaAffiliateRepository implements AffiliateRepository {
  async findByUserId(userId: string): Promise<Affiliate | null> {
    return await prisma.affiliate.findUnique({
      where: { userId },
    });
  }

  async findByCode(code: string): Promise<Affiliate | null> {
    return await prisma.affiliate.findUnique({
      where: { code },
    });
  }

  async create(data: {
    userId: string;
    code: string;
    commissionRate?: number;
    tier?: number;
  }): Promise<Affiliate> {
    return await prisma.affiliate.create({
      data: {
        userId: data.userId,
        code: data.code,
        commissionRate: data.commissionRate ?? 0.1,
        tier: data.tier ?? 1,
        status: 'ACTIVE',
      },
    });
  }

  async update(
    id: string,
    data: Partial<Omit<Affiliate, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Affiliate> {
    return await prisma.affiliate.update({
      where: { id },
      data,
    });
  }

  async codeExists(code: string): Promise<boolean> {
    const count = await prisma.affiliate.count({
      where: { code },
    });
    return count > 0;
  }

  async getStats(affiliateId: string): Promise<{
    totalReferrals: number;
    convertedReferrals: number;
    conversionRate: number;
  }> {
    const [totalReferrals, convertedReferrals] = await Promise.all([
      prisma.referral.count({
        where: { affiliateId },
      }),
      prisma.referral.count({
        where: {
          affiliateId,
          status: 'CONVERTED',
        },
      }),
    ]);

    const conversionRate =
      totalReferrals > 0 ? convertedReferrals / totalReferrals : 0;

    return {
      totalReferrals,
      convertedReferrals,
      conversionRate,
    };
  }
}

export class PrismaReferralRepository implements ReferralRepository {
  async create(data: {
    affiliateId: string;
    referredUserId: string;
  }): Promise<Referral> {
    return await prisma.referral.create({
      data: {
        affiliateId: data.affiliateId,
        referredUserId: data.referredUserId,
        status: 'PENDING',
      },
    });
  }

  async findByReferredUserId(userId: string): Promise<Referral | null> {
    return await prisma.referral.findFirst({
      where: { referredUserId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(
    id: string,
    status: 'PENDING' | 'CONVERTED' | 'CANCELED',
    conversionValue?: number,
    commission?: number
  ): Promise<Referral> {
    return await prisma.referral.update({
      where: { id },
      data: {
        status,
        conversionValue,
        commission,
        convertedAt: status === 'CONVERTED' ? new Date() : undefined,
      },
    });
  }

  async findByAffiliateId(affiliateId: string): Promise<Referral[]> {
    return await prisma.referral.findMany({
      where: { affiliateId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async isReferred(userId: string): Promise<boolean> {
    const count = await prisma.referral.count({
      where: { referredUserId: userId },
    });
    return count > 0;
  }
}
