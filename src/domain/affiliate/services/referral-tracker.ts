/**
 * Referral Tracking Service
 * Requirements: Affiliate 1 - Referral Tracking
 *
 * Handles tracking of referrals via cookies and URL parameters
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
 * Extracts referral code from URL parameters
 */
export function extractReferralCode(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return (
      urlObj.searchParams.get('ref') ||
      urlObj.searchParams.get('referral') ||
      urlObj.searchParams.get('affiliate') ||
      null
    );
  } catch {
    return null;
  }
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

/**
 * Validates referral code format
 */
export function isValidReferralCode(code: string): boolean {
  // Code should be alphanumeric, 6-20 characters
  return /^[A-Za-z0-9]{6,20}$/.test(code);
}

/**
 * Generates a unique referral code
 */
export function generateReferralCode(userId: string): string {
  // Create a code from user ID and random string
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  // Remove any non-alphanumeric characters from user ID
  const userPart = userId.replace(/[^A-Za-z0-9]/g, '').substring(0, 6).toUpperCase();
  return `${userPart}${random}`;
}
