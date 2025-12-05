/**
 * Request Payout Use Case
 * Requirements: Affiliate 3 - Request payouts
 */

import type { AffiliateRepository } from '@/domain/affiliate/repositories/affiliate-repository';
import type { PayoutRepository } from '@/domain/affiliate/repositories/payout-repository';
import type { Payout, PayoutMethod } from '@/types/affiliate';

export interface RequestPayoutInput {
  userId: string;
  amount: number;
  method: PayoutMethod;
  notes?: string;
}

export interface RequestPayoutResult {
  success: boolean;
  payout?: Payout;
  error?: string;
}

export class RequestPayoutUseCase {
  constructor(
    private affiliateRepository: AffiliateRepository,
    private payoutRepository: PayoutRepository,
    private minPayoutAmount: number = 5000 // $50.00 minimum
  ) {}

  async execute(input: RequestPayoutInput): Promise<RequestPayoutResult> {
    // Find affiliate
    const affiliate = await this.affiliateRepository.findByUserId(input.userId);

    if (!affiliate) {
      return {
        success: false,
        error: 'Affiliate account not found',
      };
    }

    // Check if affiliate is active
    if (affiliate.status !== 'ACTIVE') {
      return {
        success: false,
        error: 'Affiliate account is not active',
      };
    }

    // Validate amount
    if (input.amount <= 0) {
      return {
        success: false,
        error: 'Payout amount must be positive',
      };
    }

    // Check minimum payout amount
    if (input.amount < this.minPayoutAmount) {
      return {
        success: false,
        error: `Minimum payout amount is $${(this.minPayoutAmount / 100).toFixed(2)}`,
      };
    }

    // Check if affiliate has sufficient pending earnings
    if (input.amount > affiliate.pendingEarnings) {
      return {
        success: false,
        error: `Insufficient pending earnings. Available: $${(affiliate.pendingEarnings / 100).toFixed(2)}`,
      };
    }

    // Create payout request
    const payout = await this.payoutRepository.create({
      affiliateId: affiliate.id,
      amount: input.amount,
      method: input.method,
      notes: input.notes,
    });

    return {
      success: true,
      payout,
    };
  }
}
