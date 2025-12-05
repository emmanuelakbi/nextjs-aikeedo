/**
 * Approve Payout Use Case
 * Requirements: Affiliate 3 - Approve/reject payouts
 */

import type { PayoutRepository } from '@/domain/affiliate/repositories/payout-repository';
import type { Payout } from '@/types/affiliate';

export interface ApprovePayoutInput {
  payoutId: string;
  notes?: string;
}

export interface ApprovePayoutResult {
  success: boolean;
  payout?: Payout;
  error?: string;
}

export class ApprovePayoutUseCase {
  constructor(private payoutRepository: PayoutRepository) {}

  async execute(input: ApprovePayoutInput): Promise<ApprovePayoutResult> {
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

    // Update payout status to approved
    const updatedPayout = await this.payoutRepository.updateStatus(
      payout.id,
      'APPROVED',
      undefined,
      input.notes
    );

    return {
      success: true,
      payout: updatedPayout,
    };
  }
}
