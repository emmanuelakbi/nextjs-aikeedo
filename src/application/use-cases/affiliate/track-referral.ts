/**
 * Track Referral Use Case
 * Requirements: Affiliate 1 - Track referral signups
 */

import type {
  AffiliateRepository,
  ReferralRepository,
} from '@/domain/affiliate/repositories/affiliate-repository';
import type { Referral } from '@/types/affiliate';

export interface TrackReferralInput {
  affiliateCode: string;
  referredUserId: string;
}

export class TrackReferralUseCase {
  constructor(
    private affiliateRepository: AffiliateRepository,
    private referralRepository: ReferralRepository
  ) {}

  async execute(input: TrackReferralInput): Promise<Referral> {
    // Find affiliate by code
    const affiliate = await this.affiliateRepository.findByCode(
      input.affiliateCode
    );

    if (!affiliate) {
      throw new Error('Invalid referral code');
    }

    // Check if affiliate is active
    if (affiliate.status !== 'ACTIVE') {
      throw new Error('Affiliate account is not active');
    }

    // Check if user is trying to refer themselves
    if (affiliate.userId === input.referredUserId) {
      throw new Error('Self-referrals are not allowed');
    }

    // Check if user was already referred
    const existingReferral = await this.referralRepository.findByReferredUserId(
      input.referredUserId
    );

    if (existingReferral) {
      throw new Error('User was already referred');
    }

    // Create referral
    return await this.referralRepository.create({
      affiliateId: affiliate.id,
      referredUserId: input.referredUserId,
    });
  }
}
