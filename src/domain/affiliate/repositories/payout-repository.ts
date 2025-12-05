/**
 * Payout Repository Interface
 * Requirements: Affiliate 3 - Payout Processing
 */

import type { Payout, PayoutMethod, PayoutStatus } from '@/types/affiliate';

export interface PayoutRepository {
  /**
   * Create a new payout request
   */
  create(data: {
    affiliateId: string;
    amount: number;
    method: PayoutMethod;
    notes?: string;
  }): Promise<Payout>;

  /**
   * Find payout by ID
   */
  findById(id: string): Promise<Payout | null>;

  /**
   * Find payouts by affiliate ID
   */
  findByAffiliateId(affiliateId: string): Promise<Payout[]>;

  /**
   * Find pending payouts
   */
  findPending(): Promise<Payout[]>;

  /**
   * Update payout status
   */
  updateStatus(
    id: string,
    status: PayoutStatus,
    processedAt?: Date,
    notes?: string
  ): Promise<Payout>;

  /**
   * Get payout statistics for affiliate
   */
  getStats(affiliateId: string): Promise<{
    totalRequested: number;
    totalPaid: number;
    totalPending: number;
    totalRejected: number;
    payoutCount: number;
  }>;
}
