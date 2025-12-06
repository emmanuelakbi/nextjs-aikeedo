/**
 * Process Commission Use Case
 * Requirements: Affiliate 2 - Calculate commissions on subscriptions and credit purchases
 */

import type {
import type { Prisma } from '@prisma/client';
  AffiliateRepository,
  ReferralRepository,
} from '@/domain/affiliate/repositories/affiliate-repository';
import { calculateCommission } from '@/domain/affiliate/services/commission-calculator';
import type { Prisma } from '@prisma/client';
import prisma from '@/lib/db/prisma';
import type { Prisma } from '@prisma/client';

export interface ProcessCommissionInput {
  userId: string; // User who made the purchase
  amount: number; // Purchase amount in cents
  transactionType: 'subscription' | 'credit_purchase';
  referenceId: string; // Invoice ID or transaction ID
}

export interface ProcessCommissionResult {
  processed: boolean;
  referralId?: string;
  affiliateId?: string;
  commission?: number;
  reason?: string;
}

export class ProcessCommissionUseCase {
  constructor(
    private affiliateRepository: AffiliateRepository,
    private referralRepository: ReferralRepository
  ) {}

  async execute(
    input: ProcessCommissionInput
  ): Promise<ProcessCommissionResult> {
    // Check if user was referred
    const referral = await this.referralRepository.findByReferredUserId(
      input.userId
    );

    if (!referral) {
      return {
        processed: false,
        reason: 'User was not referred',
      };
    }

    // Check if referral is already converted
    if (referral.status === 'CONVERTED') {
      return {
        processed: false,
        reason: 'Referral already converted',
      };
    }

    // Check if referral is canceled
    if (referral.status === 'CANCELED') {
      return {
        processed: false,
        reason: 'Referral was canceled',
      };
    }

    // Get affiliate by ID (not by userId)
    const affiliate = await prisma.affiliate.findUnique({
      where: { id: referral.affiliateId },
    });

    if (!affiliate) {
      return {
        processed: false,
        reason: 'Affiliate not found',
      };
    }

    // Check if affiliate is active
    if (affiliate.status !== 'ACTIVE') {
      return {
        processed: false,
        reason: 'Affiliate is not active',
      };
    }

    // Calculate commission
    const commissionResult = calculateCommission({
      amount: input.amount,
      commissionRate: affiliate.commissionRate,
      tier: affiliate.tier,
    });

    // Use transaction to ensure atomicity
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update referral status
      await tx.referral.update({
        where: { id: referral.id },
        data: {
          status: 'CONVERTED',
          conversionValue: input.amount,
          commission: commissionResult.commission,
          convertedAt: new Date(),
        },
      });

      // Update affiliate earnings
      await tx.affiliate.update({
        where: { id: affiliate.id },
        data: {
          totalEarnings: {
            increment: commissionResult.commission,
          },
          pendingEarnings: {
            increment: commissionResult.commission,
          },
        },
      });
    });

    return {
      processed: true,
      referralId: referral.id,
      affiliateId: affiliate.id,
      commission: commissionResult.commission,
    };
  }
}
