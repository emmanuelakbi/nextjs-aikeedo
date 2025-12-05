/**
 * Affiliate Module Type Definitions
 * Requirements: Affiliate 1, 2, 3, 4, 5
 */

import { AffiliateStatus, ReferralStatus, PayoutMethod, PayoutStatus } from '@prisma/client';

/**
 * Affiliate Entity
 * Represents an affiliate user who can refer others and earn commissions
 */
export type Affiliate = {
  id: string;
  userId: string;
  code: string;
  commissionRate: number;
  tier: number;
  status: AffiliateStatus;
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Referral Entity
 * Tracks users referred by affiliates and their conversion status
 */
export type Referral = {
  id: string;
  affiliateId: string;
  referredUserId: string;
  status: ReferralStatus;
  conversionValue: number;
  commission: number;
  convertedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Payout Entity
 * Represents payout requests and their processing status
 */
export type Payout = {
  id: string;
  affiliateId: string;
  amount: number;
  method: PayoutMethod;
  status: PayoutStatus;
  processedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Affiliate Statistics
 * Aggregated statistics for affiliate dashboard
 */
export type AffiliateStats = {
  totalReferrals: number;
  convertedReferrals: number;
  conversionRate: number;
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  lifetimeValue: number;
};

/**
 * Payout Request Input
 * Data required to request a payout
 */
export type PayoutRequest = {
  amount: number;
  method: PayoutMethod;
  notes?: string;
};

/**
 * Affiliate Creation Input
 * Data required to create a new affiliate
 */
export type CreateAffiliateInput = {
  userId: string;
  code?: string; // Optional, will be generated if not provided
  commissionRate?: number;
  tier?: number;
};

/**
 * Referral Tracking Input
 * Data captured when tracking a referral
 */
export type TrackReferralInput = {
  affiliateCode: string;
  referredUserId: string;
};

/**
 * Commission Calculation Input
 * Data needed to calculate commission
 */
export type CalculateCommissionInput = {
  affiliateId: string;
  transactionAmount: number;
  transactionType: 'subscription' | 'credit_purchase';
};

export { AffiliateStatus, ReferralStatus, PayoutMethod, PayoutStatus };
