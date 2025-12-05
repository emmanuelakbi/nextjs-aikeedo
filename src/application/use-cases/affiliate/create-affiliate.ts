/**
 * Create Affiliate Use Case
 * Requirements: Affiliate 1 - Generate unique referral codes
 */

import type { AffiliateRepository } from '@/domain/affiliate/repositories/affiliate-repository';
import {
  generateReferralCode,
  isValidReferralCode,
} from '@/domain/affiliate/services/referral-tracker';
import type { Affiliate } from '@/types/affiliate';

export interface CreateAffiliateInput {
  userId: string;
  code?: string;
  commissionRate?: number;
  tier?: number;
}

export class CreateAffiliateUseCase {
  constructor(private affiliateRepository: AffiliateRepository) {}

  async execute(input: CreateAffiliateInput): Promise<Affiliate> {
    // Check if user already has an affiliate account
    const existing = await this.affiliateRepository.findByUserId(input.userId);
    if (existing) {
      throw new Error('User already has an affiliate account');
    }

    // Generate or validate referral code
    let code = input.code;
    if (code) {
      // Validate provided code
      if (!isValidReferralCode(code)) {
        throw new Error('Invalid referral code format');
      }

      // Check if code is already taken
      if (await this.affiliateRepository.codeExists(code)) {
        throw new Error('Referral code already exists');
      }
    } else {
      // Generate unique code
      code = await this.generateUniqueCode(input.userId);
    }

    // Create affiliate
    return await this.affiliateRepository.create({
      userId: input.userId,
      code,
      commissionRate: input.commissionRate,
      tier: input.tier,
    });
  }

  private async generateUniqueCode(userId: string): Promise<string> {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const code = generateReferralCode(userId);

      if (!(await this.affiliateRepository.codeExists(code))) {
        return code;
      }

      attempts++;
    }

    throw new Error('Failed to generate unique referral code');
  }
}
