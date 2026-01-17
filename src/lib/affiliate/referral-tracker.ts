/**
 * Referral Tracking Service - Infrastructure Layer
 * Requirements: Affiliate 1 - Referral Tracking
 *
 * Handles tracking of referrals via cookies (Next.js specific)
 * This file contains framework-dependent code and belongs in the lib layer.
 */

import { cookies } from 'next/headers';

export const REFERRAL_COOKIE_NAME = 'aikeedo_ref';
export const REFERRAL_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

export interface ReferralData {
  code: string;
  timestamp: number;
  source?: string;
}

/**
 * Stores referral data in cookie
 */
export async function storeReferralCookie(
  code: string,
  source?: string
): Promise<void> {
  const cookieStore = await cookies();
  const referralData: ReferralData = {
    code,
    timestamp: Date.now(),
    source,
  };

  cookieStore.set(REFERRAL_COOKIE_NAME, JSON.stringify(referralData), {
    maxAge: REFERRAL_COOKIE_MAX_AGE,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

/**
 * Retrieves referral data from cookie
 */
export async function getReferralCookie(): Promise<ReferralData | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(REFERRAL_COOKIE_NAME);

  if (!cookie?.value) {
    return null;
  }

  try {
    const data = JSON.parse(cookie.value) as ReferralData;

    // Check if cookie is expired (30 days)
    const age = Date.now() - data.timestamp;
    if (age > REFERRAL_COOKIE_MAX_AGE * 1000) {
      await clearReferralCookie();
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

/**
 * Clears referral cookie
 */
export async function clearReferralCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(REFERRAL_COOKIE_NAME);
}

// Re-export pure domain functions for convenience
export {
  extractReferralCode,
  isValidReferralCode,
  generateReferralCode,
} from '@/domain/affiliate/services/referral-tracker';
