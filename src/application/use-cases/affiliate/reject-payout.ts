/**
 * Reject Payout Use Case
 * Requirements: Affiliate 3 - Approve/reject payouts
 */

import type { PayoutRepository } from '@/domain/affiliate/repositories/payout-repository';
import type { Payout } from '@/types/affiliate';

export interface RejectPayoutInput {
  payoutId: string;
  reason: string;
}

export interface RejectPayoutResult {
  success: boolean;
  payout?: Payout;
  error?: string;
}

export class RejectPayoutUseCase {
  constructor(private payoutRepository: PayoutRepository) {}

  async execute(input: RejectPayoutInput): Promise<RejectPayoutResult> {
    // Find payout
    const payout = await this.payoutRepository.findById(input.payoutId);

    if (!payout) {
      return {
        success: false,
        error: 'Payout not found',
      };
    }

    // Check if payout is pending
    if (payout.status !== 'PENDING') {
      return {
        success: false,
        error: `Payout is already ${payout.status.toLowerCase()}`,
      };
    }

    // Validate reason
    if (!input.reason || input.reason.trim().length === 0) {
      return {
        success: false,
        error: 'Rejection reason is required',
      };
    }

    // Update payout status to rejected
    const updatedPayout = await this.payoutRepository.updateStatus(
      payout.id,
      'REJECTED',
      new Date(),
      input.reason
    );

    return {
      success: true,
      payout: updatedPayout,
    };
  }
}
