/**
 * Get Affiliate Statistics Use Case
 * Requirements: Affiliate 4 - Show referral statistics
 */

import type { AffiliateRepository } from '@/domain/affiliate/repositories/affiliate-repository';
import type { AffiliateStats } from '@/types/affiliate';

export class GetAffiliateStatsUseCase {
  constructor(private affiliateRepository: AffiliateRepository) {}

  async execute(userId: string): Promise<AffiliateStats> {
    // Find affiliate by user ID
    const affiliate = await this.affiliateRepository.findByUserId(userId);

    if (!affiliate) {
      throw new Error('Affiliate account not found');
    }

    // Get referral statistics
    const stats = await this.affiliateRepository.getStats(affiliate.id);

    // Calculate lifetime value (total earnings)
    const lifetimeValue = affiliate.totalEarnings;

    return {
      totalReferrals: stats.totalReferrals,
      convertedReferrals: stats.convertedReferrals,
      conversionRate: stats.conversionRate,
      totalEarnings: affiliate.totalEarnings,
      pendingEarnings: affiliate.pendingEarnings,
      paidEarnings: affiliate.paidEarnings,
      lifetimeValue,
    };
  }
}
