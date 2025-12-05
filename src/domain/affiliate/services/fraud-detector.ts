/**
 * Fraud Detection Service
 * Requirements: Affiliate 5 - Fraud Prevention
 *
 * Detects and prevents fraudulent affiliate activity
 */

import type { Affiliate, Referral } from '@/types/affiliate';

export interface FraudCheckResult {
  isFraudulent: boolean;
  riskScore: number; // 0-100, higher = more risky
  reasons: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ReferralFraudCheck {
  affiliateId: string;
  referredUserId: string;
  affiliateUserId: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface ConversionFraudCheck {
  referral: Referral;
  affiliate: Affiliate;
  conversionAmount: number;
  timeSinceReferral: number; // milliseconds
}

/**
 * Check if referral is self-referral
 */
export function isSelfReferral(
  affiliateUserId: string,
  referredUserId: string
): boolean {
  return affiliateUserId === referredUserId;
}

/**
 * Check for suspicious referral patterns
 */
export async function checkReferralFraud(
  check: ReferralFraudCheck
): Promise<FraudCheckResult> {
  const reasons: string[] = [];
  let riskScore = 0;

  // Check 1: Self-referral (Critical)
  if (isSelfReferral(check.affiliateUserId, check.referredUserId)) {
    reasons.push('Self-referral detected');
    riskScore += 100;
  }

  // Check 2: Same IP address (High risk)
  // TODO: Implement IP tracking and comparison
  // if (check.ipAddress && await isSameIPAsAffiliate(check.affiliateId, check.ipAddress)) {
  //   reasons.push('Same IP address as affiliate');
  //   riskScore += 40;
  // }

  // Check 3: Same user agent (Medium risk)
  // TODO: Implement user agent tracking
  // if (check.userAgent && await isSameUserAgentAsAffiliate(check.affiliateId, check.userAgent)) {
  //   reasons.push('Same user agent as affiliate');
  //   riskScore += 20;
  // }

  // Determine severity
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (riskScore >= 80) severity = 'critical';
  else if (riskScore >= 50) severity = 'high';
  else if (riskScore >= 25) severity = 'medium';

  return {
    isFraudulent: riskScore >= 50,
    riskScore: Math.min(riskScore, 100),
    reasons,
    severity,
  };
}

/**
 * Check for suspicious conversion patterns
 */
export function checkConversionFraud(
  check: ConversionFraudCheck
): FraudCheckResult {
  const reasons: string[] = [];
  let riskScore = 0;

  // Check 1: Immediate conversion (suspicious if < 5 minutes)
  const fiveMinutes = 5 * 60 * 1000;
  if (check.timeSinceReferral < fiveMinutes) {
    reasons.push('Suspiciously fast conversion (< 5 minutes)');
    riskScore += 30;
  }

  // Check 2: Unusually high conversion amount
  const averageConversion = 5000; // $50.00
  if (check.conversionAmount > averageConversion * 10) {
    reasons.push('Unusually high conversion amount');
    riskScore += 25;
  }

  // Check 3: Affiliate is suspended
  if (check.affiliate.status === 'SUSPENDED') {
    reasons.push('Affiliate account is suspended');
    riskScore += 100;
  }

  // Check 4: Referral already converted
  if (check.referral.status === 'CONVERTED') {
    reasons.push('Referral already converted');
    riskScore += 50;
  }

  // Determine severity
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (riskScore >= 80) severity = 'critical';
  else if (riskScore >= 50) severity = 'high';
  else if (riskScore >= 25) severity = 'medium';

  return {
    isFraudulent: riskScore >= 50,
    riskScore: Math.min(riskScore, 100),
    reasons,
    severity,
  };
}

/**
 * Check for rapid referral patterns (velocity check)
 */
export function checkReferralVelocity(
  referralCount: number,
  timeWindow: number // milliseconds
): FraudCheckResult {
  const reasons: string[] = [];
  let riskScore = 0;

  // Calculate referrals per hour
  const hoursInWindow = timeWindow / (60 * 60 * 1000);
  const referralsPerHour = referralCount / hoursInWindow;

  // Check for suspicious velocity
  if (referralsPerHour > 10) {
    reasons.push(`Suspicious referral velocity: ${referralsPerHour.toFixed(1)} per hour`);
    riskScore += 40;
  }

  if (referralsPerHour > 20) {
    reasons.push('Extremely high referral velocity');
    riskScore += 40;
  }

  // Determine severity
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (riskScore >= 80) severity = 'critical';
  else if (riskScore >= 50) severity = 'high';
  else if (riskScore >= 25) severity = 'medium';

  return {
    isFraudulent: riskScore >= 50,
    riskScore: Math.min(riskScore, 100),
    reasons,
    severity,
  };
}

/**
 * Check for duplicate email patterns
 */
export function checkEmailPattern(
  affiliateEmail: string,
  referredEmail: string
): FraudCheckResult {
  const reasons: string[] = [];
  let riskScore = 0;

  // Extract email username (before @)
  const affiliateUsername = affiliateEmail.split('@')[0].toLowerCase();
  const referredUsername = referredEmail.split('@')[0].toLowerCase();

  // Check for similar usernames
  if (affiliateUsername === referredUsername) {
    reasons.push('Identical email usernames');
    riskScore += 40;
  }

  // Check for plus addressing (email+tag@domain.com)
  const affiliateBase = affiliateUsername.split('+')[0];
  const referredBase = referredUsername.split('+')[0];

  if (affiliateBase === referredBase && affiliateUsername !== referredUsername) {
    reasons.push('Email plus addressing detected');
    riskScore += 50;
  }

  // Check for sequential patterns (user1, user2, user3)
  const affiliateMatch = affiliateUsername.match(/^(.+?)(\d+)$/);
  const referredMatch = referredUsername.match(/^(.+?)(\d+)$/);

  if (affiliateMatch && referredMatch) {
    const [, affiliateBase2, affiliateNum] = affiliateMatch;
    const [, referredBase2, referredNum] = referredMatch;

    if (affiliateBase2 === referredBase2) {
      const numDiff = Math.abs(parseInt(affiliateNum) - parseInt(referredNum));
      if (numDiff <= 5) {
        reasons.push('Sequential email pattern detected');
        riskScore += 35;
      }
    }
  }

  // Determine severity
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (riskScore >= 80) severity = 'critical';
  else if (riskScore >= 50) severity = 'high';
  else if (riskScore >= 25) severity = 'medium';

  return {
    isFraudulent: riskScore >= 50,
    riskScore: Math.min(riskScore, 100),
    reasons,
    severity,
  };
}

/**
 * Aggregate multiple fraud checks
 */
export function aggregateFraudChecks(
  checks: FraudCheckResult[]
): FraudCheckResult {
  const allReasons = checks.flatMap((c) => c.reasons);
  const maxRiskScore = Math.max(...checks.map((c) => c.riskScore));
  const isFraudulent = checks.some((c) => c.isFraudulent);

  let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (maxRiskScore >= 80) severity = 'critical';
  else if (maxRiskScore >= 50) severity = 'high';
  else if (maxRiskScore >= 25) severity = 'medium';

  return {
    isFraudulent,
    riskScore: maxRiskScore,
    reasons: allReasons,
    severity,
  };
}

/**
 * Calculate commission audit score
 * Returns 0-100, where 100 = perfect, 0 = suspicious
 */
export function auditCommissionCalculation(
  expectedCommission: number,
  actualCommission: number,
  tolerance: number = 1 // cents
): { isValid: boolean; difference: number } {
  const difference = Math.abs(expectedCommission - actualCommission);
  const isValid = difference <= tolerance;

  return {
    isValid,
    difference,
  };
}
