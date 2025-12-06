/**
 * Process Referral Helper
 * Requirements: Affiliate 1 - Track referral signups
 *
 * This helper should be called after user registration to process any pending referral
 */

import { TrackReferralUseCase } from '@/application/use-cases/affiliate/track-referral';
import {
  PrismaAffiliateRepository,
  PrismaReferralRepository,
} from '@/infrastructure/affiliate/prisma-affiliate-repository';
import {
  getReferralCookie,
  clearReferralCookie,
} from '@/domain/affiliate/services/referral-tracker';

/**
 * Process referral for a newly registered user
 * Call this after successful user registration
 */
export async function processReferralForNewUser(userId: string): Promise<void> {
  try {
    // Get referral data from cookie
    const referralData = await getReferralCookie();

    if (!referralData) {
      return; // No referral to process
    }

    // Create use case
    const affiliateRepository = new PrismaAffiliateRepository();
    const referralRepository = new PrismaReferralRepository();
    const useCase = new TrackReferralUseCase(
      affiliateRepository,
      referralRepository
    );

    // Track referral
    await useCase.execute({
      affiliateCode: referralData.code,
      referredUserId: userId,
    });

    // Clear referral cookie after successful tracking
    await clearReferralCookie();
  } catch (error) {
    // Log error but don't throw - referral tracking shouldn't block registration
    console.error('Failed to process referral:', error);
  }
}

/**
 * Check if a user has a pending referral
 */
export async function hasPendingReferral(): Promise<boolean> {
  const referralData = await getReferralCookie();
  return referralData !== null;
}

/**
 * Get pending referral code
 */
export async function getPendingReferralCode(): Promise<string | null> {
  const referralData = await getReferralCookie();
  return referralData?.code ?? null;
}
