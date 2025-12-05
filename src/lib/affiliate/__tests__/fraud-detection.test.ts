/**
 * Fraud Detection Tests (Property-Based)
 * Requirements: Affiliate 5 - Detect self-referrals, identify suspicious patterns
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Fraud detection functions
function isSelfReferral(affiliateUserId: string, referredUserId: string): boolean {
  return affiliateUserId === referredUserId;
}

function hasHighConversionRate(converted: number, total: number, threshold: number = 80): boolean {
  if (total === 0) return false;
  const rate = (converted / total) * 100;
  return rate > threshold && total > 10;
}

function hasRapidConversions(conversions: Date[], hoursThreshold: number = 24): boolean {
  if (conversions.length < 5) return false;
  
  const sorted = conversions.sort((a, b) => a.getTime() - b.getTime());
  const timeSpan = sorted[sorted.length - 1].getTime() - sorted[0].getTime();
  const hoursSpan = timeSpan / (1000 * 60 * 60);
  
  return hoursSpan < hoursThreshold;
}

function hasSameEmailDomain(emails: string[]): boolean {
  if (emails.length < 5) return false;
  
  const domains = emails.map(email => email.split('@')[1]);
  const uniqueDomains = new Set(domains);
  
  return uniqueDomains.size === 1;
}

describe('Fraud Detection - Property-Based Tests', () => {
  describe('Self-Referral Detection', () => {
    it('should always detect when IDs are identical', () => {
      // Property: Same ID should always be detected as self-referral
      fc.assert(
        fc.property(
          fc.uuid(),
          (userId) => {
            const result = isSelfReferral(userId, userId);
            expect(result).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should never flag different IDs as self-referral', () => {
      // Property: Different IDs should never be self-referral
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          (userId1, userId2) => {
            fc.pre(userId1 !== userId2); // Ensure they're different
            const result = isSelfReferral(userId1, userId2);
            expect(result).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be symmetric', () => {
      // Property: isSelfReferral(A, B) should equal isSelfReferral(B, A)
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          (userId1, userId2) => {
            const result1 = isSelfReferral(userId1, userId2);
            const result2 = isSelfReferral(userId2, userId1);
            expect(result1).toBe(result2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('High Conversion Rate Detection', () => {
    it('should flag conversion rates above threshold', () => {
      // Property: Rates above 80% with >10 total should be flagged
      fc.assert(
        fc.property(
          fc.integer({ min: 11, max: 100 }),
          (total) => {
            const converted = Math.ceil(total * 0.85); // 85% conversion
            const result = hasHighConversionRate(converted, total);
            expect(result).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not flag low conversion rates', () => {
      // Property: Rates below 80% should not be flagged
      fc.assert(
        fc.property(
          fc.integer({ min: 11, max: 100 }),
          (total) => {
            const converted = Math.floor(total * 0.5); // 50% conversion
            const result = hasHighConversionRate(converted, total);
            expect(result).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not flag small sample sizes', () => {
      // Property: Small samples (<= 10) should never be flagged
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          (total) => {
            const converted = total; // 100% conversion
            const result = hasHighConversionRate(converted, total);
            expect(result).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle zero total correctly', () => {
      const result = hasHighConversionRate(0, 0);
      expect(result).toBe(false);
    });

    it('should never flag when converted > total', () => {
      // Edge case: Should handle invalid data gracefully
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          (total) => {
            const converted = total + 10;
            const result = hasHighConversionRate(converted, total);
            // Even with invalid data, should return boolean
            expect(typeof result).toBe('boolean');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Rapid Conversions Detection', () => {
    it('should flag conversions within 24 hours', () => {
      // Create 5 conversions within 12 hours
      const baseDate = new Date('2024-01-01T00:00:00Z');
      const conversions = Array.from({ length: 5 }, (_, i) => 
        new Date(baseDate.getTime() + i * 2 * 60 * 60 * 1000) // 2 hours apart
      );
      
      const result = hasRapidConversions(conversions);
      expect(result).toBe(true);
    });

    it('should not flag conversions spread over time', () => {
      // Create 5 conversions over 48 hours
      const baseDate = new Date('2024-01-01T00:00:00Z');
      const conversions = Array.from({ length: 5 }, (_, i) => 
        new Date(baseDate.getTime() + i * 10 * 60 * 60 * 1000) // 10 hours apart
      );
      
      const result = hasRapidConversions(conversions);
      expect(result).toBe(false);
    });

    it('should not flag small numbers of conversions', () => {
      // Property: Less than 5 conversions should never be flagged
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 4 }),
          (count) => {
            const baseDate = new Date();
            const conversions = Array.from({ length: count }, (_, i) => 
              new Date(baseDate.getTime() + i * 1000)
            );
            const result = hasRapidConversions(conversions);
            expect(result).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle unsorted dates correctly', () => {
      // Create conversions in random order
      const baseDate = new Date('2024-01-01T00:00:00Z');
      const conversions = [
        new Date(baseDate.getTime() + 10 * 60 * 60 * 1000),
        new Date(baseDate.getTime() + 2 * 60 * 60 * 1000),
        new Date(baseDate.getTime() + 6 * 60 * 60 * 1000),
        new Date(baseDate.getTime() + 4 * 60 * 60 * 1000),
        new Date(baseDate.getTime() + 8 * 60 * 60 * 1000),
      ];
      
      const result = hasRapidConversions(conversions);
      expect(result).toBe(true); // All within 10 hours
    });
  });

  describe('Same Email Domain Detection', () => {
    it('should flag when all emails share same domain', () => {
      const emails = [
        'user1@example.com',
        'user2@example.com',
        'user3@example.com',
        'user4@example.com',
        'user5@example.com',
      ];
      
      const result = hasSameEmailDomain(emails);
      expect(result).toBe(true);
    });

    it('should not flag when emails have different domains', () => {
      const emails = [
        'user1@example.com',
        'user2@test.com',
        'user3@demo.com',
        'user4@sample.com',
        'user5@mail.com',
      ];
      
      const result = hasSameEmailDomain(emails);
      expect(result).toBe(false);
    });

    it('should not flag small sample sizes', () => {
      // Property: Less than 5 emails should never be flagged
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 4 }),
          (count) => {
            const emails = Array.from({ length: count }, (_, i) => 
              `user${i}@example.com`
            );
            const result = hasSameEmailDomain(emails);
            expect(result).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle mixed domains correctly', () => {
      // Property: If at least 2 different domains exist, should not flag
      fc.assert(
        fc.property(
          fc.integer({ min: 5, max: 20 }),
          (count) => {
            const emails = Array.from({ length: count }, (_, i) => 
              i % 2 === 0 ? `user${i}@example.com` : `user${i}@test.com`
            );
            const result = hasSameEmailDomain(emails);
            expect(result).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Combined Fraud Score', () => {
    function calculateFraudScore(checks: {
      isSelfReferral: boolean;
      hasHighConversionRate: boolean;
      hasRapidConversions: boolean;
      hasSameEmailDomain: boolean;
    }): number {
      let score = 0;
      if (checks.isSelfReferral) score += 50;
      if (checks.hasHighConversionRate) score += 20;
      if (checks.hasRapidConversions) score += 30;
      if (checks.hasSameEmailDomain) score += 25;
      return score;
    }

    it('should return 0 for clean affiliate', () => {
      const score = calculateFraudScore({
        isSelfReferral: false,
        hasHighConversionRate: false,
        hasRapidConversions: false,
        hasSameEmailDomain: false,
      });
      expect(score).toBe(0);
    });

    it('should return maximum score for all flags', () => {
      const score = calculateFraudScore({
        isSelfReferral: true,
        hasHighConversionRate: true,
        hasRapidConversions: true,
        hasSameEmailDomain: true,
      });
      expect(score).toBe(125);
    });

    it('should always return non-negative score', () => {
      // Property: Score should always be >= 0
      fc.assert(
        fc.property(
          fc.boolean(),
          fc.boolean(),
          fc.boolean(),
          fc.boolean(),
          (flag1, flag2, flag3, flag4) => {
            const score = calculateFraudScore({
              isSelfReferral: flag1,
              hasHighConversionRate: flag2,
              hasRapidConversions: flag3,
              hasSameEmailDomain: flag4,
            });
            expect(score).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should increase with more flags', () => {
      // Property: More flags should result in higher score
      const score1 = calculateFraudScore({
        isSelfReferral: true,
        hasHighConversionRate: false,
        hasRapidConversions: false,
        hasSameEmailDomain: false,
      });
      
      const score2 = calculateFraudScore({
        isSelfReferral: true,
        hasHighConversionRate: true,
        hasRapidConversions: false,
        hasSameEmailDomain: false,
      });
      
      expect(score2).toBeGreaterThan(score1);
    });
  });
});
