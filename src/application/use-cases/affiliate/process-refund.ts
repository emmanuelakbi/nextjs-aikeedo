/**
 * Process Refund Use Case
 * Requirements: Affiliate 2 - Handle refunds and chargebacks
 */

import type {
import type { Prisma } from '@prisma/client';
  AffiliateRepository,
  ReferralRepository,
} from '@/domain/affiliate/repositories/affiliate-repository';
import { calculateRefundAdjustment } from '@/domain/affiliate/services/commission-calculator';
import type { Prisma } from '@prisma/client';
import prisma from '@/lib/db/prisma';
import type { Prisma } from '@prisma/client';

export interface ProcessRefundInput {
  userId: string; // User who received the refund
  referenceId: string; // Original invoice/transaction ID
  type: 'refund' | 'chargeback';
}

export interface ProcessRefundResult {
  processed: boolean;
  referralId?: string;
  affiliateId?: string;
  adjustment?: number;
  reason?: string;
}

export class ProcessRefundUseCase {
  constructor(
    private affiliateRepository: AffiliateRepository,
    private referralRepository: ReferralRepository
  ) {}

  async execute(input: ProcessRefundInput): Promise<ProcessRefundResult> {
    // Find the referral for this user
    const referral = await this.referralRepository.findByReferredUserId(
      input.userId
    );

    if (!referral) {
      return {
        processed: false,
        reason: 'User was not referred',
      };
    }

    // Check if referral was converted
    if (referral.status !== 'CONVERTED') {
      return {
        processed: false,
        reason: 'Referral was not converted',
      };
    }

    // Get affiliate
    const affiliate = await prisma.affiliate.findUnique({
      where: { id: referral.affiliateId },
    });

    if (!affiliate) {
      return {
        processed: false,
        reason: 'Affiliate not found',
      };
    }

    // Calculate refund adjustment (negative commission)
    const adjustment = calculateRefundAdjustment(referral.commission);

    // Use transaction to ensure atomicity
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update referral status to canceled
      await tx.referral.update({
        where: { id: referral.id },
        data: {
          status: 'CANCELED',
        },
      });

      // Adjust affiliate earnings
      // Deduct from pending if not yet paid, otherwise from total
      const pendingAdjustment = Math.min(
        affiliate.pendingEarnings,
        referral.commission
      );
      const totalAdjustment = referral.commission;

      await tx.affiliate.update({
        where: { id: affiliate.id },
        data: {
          totalEarnings: {
            decrement: totalAdjustment,
          },
          pendingEarnings: {
            decrement: pendingAdjustment,
          },
        },
      });
    });

    return {
      processed: true,
      referralId: referral.id,
      affiliateId: affiliate.id,
      adjustment,
    };
  }
}
