/**
 * Referral Tracking Service - Domain Layer (Pure Functions)
 * Requirements: Affiliate 1 - Referral Tracking
 *
 * Contains pure, framework-agnostic functions for referral code handling.
 * Cookie-related functions are in src/lib/affiliate/referral-tracker.ts
 */

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
  const userPart = userId
    .replace(/[^A-Za-z0-9]/g, '')
    .substring(0, 6)
    .toUpperCase();
  return `${userPart}${random}`;
}
