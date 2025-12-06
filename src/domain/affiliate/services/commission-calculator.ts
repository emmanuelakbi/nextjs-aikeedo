/**
 * Commission Calculator Service
 * Requirements: Affiliate 2 - Commission Management
 *
 * Calculates commissions on subscriptions and credit purchases
 */

export interface CommissionCalculationInput {
  amount: number; // Amount in cents
  commissionRate: number; // Rate as decimal (0.1 = 10%)
  tier?: number; // Affiliate tier (for future tier-based rates)
}

export interface CommissionResult {
  commission: number; // Commission amount in cents
  rate: number; // Applied rate
  amount: number; // Original amount
}

/**
 * Calculate commission for a transaction
 */
export function calculateCommission(
  input: CommissionCalculationInput
): CommissionResult {
  const { amount, commissionRate, tier = 1 } = input;

  // Apply tier-based rate adjustments (future enhancement)
  const adjustedRate = getTierAdjustedRate(commissionRate, tier);

  // Calculate commission (rounded to nearest cent)
  const commission = Math.round(amount * adjustedRate);

  return {
    commission,
    rate: adjustedRate,
    amount,
  };
}

/**
 * Get tier-adjusted commission rate
 * Higher tiers can have higher commission rates
 */
function getTierAdjustedRate(baseRate: number, tier: number): number {
  // Tier multipliers (can be configured)
  const tierMultipliers: Record<number, number> = {
    1: 1.0, // 100% of base rate
    2: 1.1, // 110% of base rate
    3: 1.2, // 120% of base rate
    4: 1.3, // 130% of base rate
    5: 1.5, // 150% of base rate
  };

  const multiplier = tierMultipliers[tier] || 1.0;
  return Math.min(baseRate * multiplier, 0.5); // Cap at 50%
}

/**
 * Calculate commission for subscription payment
 */
export function calculateSubscriptionCommission(
  subscriptionAmount: number,
  commissionRate: number,
  tier?: number
): CommissionResult {
  return calculateCommission({
    amount: subscriptionAmount,
    commissionRate,
    tier,
  });
}

/**
 * Calculate commission for credit purchase
 */
export function calculateCreditPurchaseCommission(
  purchaseAmount: number,
  commissionRate: number,
  tier?: number
): CommissionResult {
  return calculateCommission({
    amount: purchaseAmount,
    commissionRate,
    tier,
  });
}

/**
 * Calculate refund adjustment
 * Returns negative commission to reverse the original commission
 */
export function calculateRefundAdjustment(originalCommission: number): number {
  return -originalCommission;
}

/**
 * Calculate chargeback adjustment
 * Returns negative commission to reverse the original commission
 */
export function calculateChargebackAdjustment(
  originalCommission: number
): number {
  return -originalCommission;
}

/**
 * Validate commission calculation
 */
export function isValidCommission(commission: number, amount: number): boolean {
  // Commission should not be negative
  if (commission < 0) return false;

  // Commission should not exceed the original amount
  if (commission > amount) return false;

  return true;
}

/**
 * Format commission for display
 */
export function formatCommission(commission: number): string {
  return `$${(commission / 100).toFixed(2)}`;
}

/**
 * Calculate lifetime commission value for an affiliate
 */
export function calculateLifetimeValue(
  totalEarnings: number,
  pendingEarnings: number,
  paidEarnings: number
): number {
  return totalEarnings;
}
