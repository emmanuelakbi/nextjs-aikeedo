/**
 * Affiliate Repository Interface
 * Requirements: Affiliate 1, 2
 */

import type { Affiliate, Referral } from '@/types/affiliate';

export interface AffiliateRepository {
  /**
   * Find affiliate by user ID
   */
  findByUserId(userId: string): Promise<Affiliate | null>;

  /**
   * Find affiliate by referral code
   */
  findByCode(code: string): Promise<Affiliate | null>;

  /**
   * Create a new affiliate
   */
  create(data: {
    userId: string;
    code: string;
    commissionRate?: number;
    tier?: number;
  }): Promise<Affiliate>;

  /**
   * Update affiliate
   */
  update(
    id: string,
    data: Partial<Omit<Affiliate, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Affiliate>;

  /**
   * Check if referral code exists
   */
  codeExists(code: string): Promise<boolean>;

  /**
   * Get affiliate statistics
   */
  getStats(affiliateId: string): Promise<{
    totalReferrals: number;
    convertedReferrals: number;
    conversionRate: number;
  }>;
}

export interface ReferralRepository {
  /**
   * Create a new referral
   */
  create(data: {
    affiliateId: string;
    referredUserId: string;
  }): Promise<Referral>;

  /**
   * Find referral by referred user ID
   */
  findByReferredUserId(userId: string): Promise<Referral | null>;

  /**
   * Update referral status
   */
  updateStatus(
    id: string,
    status: 'PENDING' | 'CONVERTED' | 'CANCELED',
    conversionValue?: number,
    commission?: number
  ): Promise<Referral>;

  /**
   * Get referrals for affiliate
   */
  findByAffiliateId(affiliateId: string): Promise<Referral[]>;

  /**
   * Check if user was referred
   */
  isReferred(userId: string): Promise<boolean>;
}
