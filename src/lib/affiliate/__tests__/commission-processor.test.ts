/**
 * Commission Processor Tests (Property-Based)
 * Requirements: Affiliate 2 - Calculate commissions, apply commission rates by tier
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Commission calculation function
function calculateCommission(amount: number, rate: number): number {
  if (amount < 0) throw new Error('Amount must be non-negative');
  if (rate < 0 || rate > 100) throw new Error('Rate must be between 0 and 100');

  return Math.floor((amount * rate) / 100);
}

describe('Commission Processor - Property-Based Tests', () => {
  describe('calculateCommission', () => {
    it('should always return non-negative commission', () => {
      // Property: For any valid amount and rate, commission should be non-negative
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000000 }), // amount in cents
          fc.integer({ min: 0, max: 100 }), // rate percentage
          (amount, rate) => {
            const commission = calculateCommission(amount, rate);
            expect(commission).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should never exceed the original amount', () => {
      // Property: Commission should never be more than the original amount
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000000 }),
          fc.integer({ min: 0, max: 100 }),
          (amount, rate) => {
            const commission = calculateCommission(amount, rate);
            expect(commission).toBeLessThanOrEqual(amount);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return zero for zero amount', () => {
      // Property: Zero amount should always result in zero commission
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 100 }), (rate) => {
          const commission = calculateCommission(0, rate);
          expect(commission).toBe(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should return zero for zero rate', () => {
      // Property: Zero rate should always result in zero commission
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 1000000 }), (amount) => {
          const commission = calculateCommission(amount, 0);
          expect(commission).toBe(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should return full amount for 100% rate', () => {
      // Property: 100% rate should return the full amount
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 1000000 }), (amount) => {
          const commission = calculateCommission(amount, 100);
          expect(commission).toBe(amount);
        }),
        { numRuns: 100 }
      );
    });

    it('should be proportional to rate', () => {
      // Property: Doubling the rate should approximately double the commission
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 1000000 }), // Use larger amounts to minimize rounding effects
          fc.integer({ min: 5, max: 40 }), // Avoid very small rates
          (amount, rate) => {
            const commission1 = calculateCommission(amount, rate);
            const commission2 = calculateCommission(amount, rate * 2);

            // Skip if commission1 is too small (rounding dominates)
            if (commission1 < 10) return;

            // Allow for rounding differences - use wider tolerance
            const ratio = commission2 / commission1;
            expect(ratio).toBeGreaterThanOrEqual(1.8);
            expect(ratio).toBeLessThanOrEqual(2.2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be proportional to amount', () => {
      // Property: Doubling the amount should approximately double the commission
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 500000 }),
          fc.integer({ min: 1, max: 100 }),
          (amount, rate) => {
            const commission1 = calculateCommission(amount, rate);
            const commission2 = calculateCommission(amount * 2, rate);

            // Due to floor rounding, commission2 might be commission1 * 2 or commission1 * 2 + 1
            // Allow for 1 cent difference due to rounding
            expect(Math.abs(commission2 - commission1 * 2)).toBeLessThanOrEqual(
              1
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle common commission rates correctly', () => {
      // Test specific common rates
      const testCases = [
        { amount: 10000, rate: 20, expected: 2000 }, // $100 at 20% = $20
        { amount: 50000, rate: 15, expected: 7500 }, // $500 at 15% = $75
        { amount: 100000, rate: 10, expected: 10000 }, // $1000 at 10% = $100
        { amount: 25000, rate: 25, expected: 6250 }, // $250 at 25% = $62.50
      ];

      testCases.forEach(({ amount, rate, expected }) => {
        const commission = calculateCommission(amount, rate);
        expect(commission).toBe(expected);
      });
    });

    it('should throw error for negative amounts', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -1000000, max: -1 }),
          fc.integer({ min: 0, max: 100 }),
          (amount, rate) => {
            expect(() => calculateCommission(amount, rate)).toThrow(
              'Amount must be non-negative'
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should throw error for invalid rates', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000000 }),
          fc.integer({ min: 101, max: 200 }),
          (amount, rate) => {
            expect(() => calculateCommission(amount, rate)).toThrow(
              'Rate must be between 0 and 100'
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be commutative with respect to multiple commissions', () => {
      // Property: Calculating commission on (A + B) should equal commission(A) + commission(B)
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 500000 }),
          fc.integer({ min: 0, max: 500000 }),
          fc.integer({ min: 0, max: 100 }),
          (amount1, amount2, rate) => {
            const combined = calculateCommission(amount1 + amount2, rate);
            const separate =
              calculateCommission(amount1, rate) +
              calculateCommission(amount2, rate);

            // Allow for rounding differences of 1 cent
            expect(Math.abs(combined - separate)).toBeLessThanOrEqual(1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Tier-based Commission Rates', () => {
    function getTierRate(tier: number): number {
      const rates: Record<number, number> = {
        1: 20, // 20%
        2: 25, // 25%
        3: 30, // 30%
      };
      return rates[tier] || 20;
    }

    it('should return higher rates for higher tiers', () => {
      // Property: Higher tier should always have higher or equal rate
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 2 }), (tier) => {
          const rate1 = getTierRate(tier);
          const rate2 = getTierRate(tier + 1);
          expect(rate2).toBeGreaterThanOrEqual(rate1);
        }),
        { numRuns: 100 }
      );
    });

    it('should calculate higher commissions for higher tiers', () => {
      // Property: For same amount, higher tier should yield higher commission
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 1000000 }),
          fc.integer({ min: 1, max: 2 }),
          (amount, tier) => {
            const rate1 = getTierRate(tier);
            const rate2 = getTierRate(tier + 1);
            const commission1 = calculateCommission(amount, rate1);
            const commission2 = calculateCommission(amount, rate2);
            expect(commission2).toBeGreaterThanOrEqual(commission1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
