/**
 * Track Referral Use Case Tests
 * Requirements: Affiliate 1 - Track referral signups
 * Requirements: 6.1, 6.5 - Test files must use properly typed mock objects
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { TrackReferralUseCase } from '../track-referral';
import type {
  AffiliateRepository,
  ReferralRepository,
} from '@/domain/affiliate/repositories/affiliate-repository';
import type { Affiliate, Referral } from '@/types/affiliate';

// Mock the repositories
vi.mock('@/infrastructure/affiliate/prisma-affiliate-repository');

/**
 * Type-safe mock for AffiliateRepository
 * Implements only the methods used by TrackReferralUseCase
 */
type MockAffiliateRepository = {
  [K in keyof Pick<AffiliateRepository, 'findByCode'>]: Mock<
    AffiliateRepository[K]
  >;
};

/**
 * Type-safe mock for ReferralRepository
 * Implements only the methods used by TrackReferralUseCase
 */
type MockReferralRepository = {
  [K in keyof Pick<ReferralRepository, 'findByReferredUserId' | 'create'>]: Mock<
    ReferralRepository[K]
  >;
};

describe('TrackReferralUseCase', () => {
  let useCase: TrackReferralUseCase;
  let mockAffiliateRepository: MockAffiliateRepository;
  let mockReferralRepository: MockReferralRepository;

  beforeEach(() => {
    mockAffiliateRepository = {
      findByCode: vi.fn(),
    };
    mockReferralRepository = {
      findByReferredUserId: vi.fn(),
      create: vi.fn(),
    };
    useCase = new TrackReferralUseCase(
      mockAffiliateRepository as unknown as AffiliateRepository,
      mockReferralRepository as unknown as ReferralRepository
    );
  });

  it('should track a new referral', async () => {
    // Arrange
    const affiliateCode = 'TESTCODE';
    const referredUserId = 'user-123';
    const mockAffiliate: Affiliate = {
      id: 'affiliate-123',
      userId: 'affiliate-user-123',
      code: affiliateCode,
      commissionRate: 20,
      tier: 1,
      status: 'ACTIVE',
      totalEarnings: 0,
      pendingEarnings: 0,
      paidEarnings: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const mockReferral: Referral = {
      id: 'referral-123',
      affiliateId: mockAffiliate.id,
      referredUserId,
      status: 'PENDING',
      conversionValue: 0,
      commission: 0,
      convertedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockAffiliateRepository.findByCode.mockResolvedValue(mockAffiliate);
    mockReferralRepository.findByReferredUserId.mockResolvedValue(null);
    mockReferralRepository.create.mockResolvedValue(mockReferral);

    // Act
    const result = await useCase.execute({
      affiliateCode,
      referredUserId,
    });

    // Assert
    expect(result).toEqual(mockReferral);
    expect(mockAffiliateRepository.findByCode).toHaveBeenCalledWith(
      affiliateCode
    );
    expect(mockReferralRepository.findByReferredUserId).toHaveBeenCalledWith(
      referredUserId
    );
    expect(mockReferralRepository.create).toHaveBeenCalled();
  });

  it('should throw error if affiliate code is invalid', async () => {
    // Arrange
    mockAffiliateRepository.findByCode.mockResolvedValue(null);

    // Act & Assert
    await expect(
      useCase.execute({
        affiliateCode: 'INVALID',
        referredUserId: 'user-123',
      })
    ).rejects.toThrow('Invalid referral code');
  });

  it('should throw error if affiliate is not active', async () => {
    // Arrange
    const mockAffiliate: Affiliate = {
      id: 'affiliate-123',
      userId: 'affiliate-user-123',
      code: 'TESTCODE',
      commissionRate: 20,
      tier: 1,
      status: 'SUSPENDED',
      totalEarnings: 0,
      pendingEarnings: 0,
      paidEarnings: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockAffiliateRepository.findByCode.mockResolvedValue(mockAffiliate);

    // Act & Assert
    await expect(
      useCase.execute({
        affiliateCode: 'TESTCODE',
        referredUserId: 'user-123',
      })
    ).rejects.toThrow('Affiliate account is not active');
  });

  it('should throw error if user already has a referral', async () => {
    // Arrange
    const mockAffiliate: Affiliate = {
      id: 'affiliate-123',
      userId: 'affiliate-user-123',
      code: 'TESTCODE',
      commissionRate: 20,
      tier: 1,
      status: 'ACTIVE',
      totalEarnings: 0,
      pendingEarnings: 0,
      paidEarnings: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const existingReferral: Referral = {
      id: 'existing-referral',
      affiliateId: 'other-affiliate',
      referredUserId: 'user-123',
      status: 'PENDING',
      conversionValue: 0,
      commission: 0,
      convertedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockAffiliateRepository.findByCode.mockResolvedValue(mockAffiliate);
    mockReferralRepository.findByReferredUserId.mockResolvedValue(existingReferral);

    // Act & Assert
    await expect(
      useCase.execute({
        affiliateCode: 'TESTCODE',
        referredUserId: 'user-123',
      })
    ).rejects.toThrow('User was already referred');
  });

  it('should prevent self-referrals', async () => {
    // Arrange
    const mockAffiliate: Affiliate = {
      id: 'affiliate-123',
      userId: 'user-123',
      code: 'TESTCODE',
      commissionRate: 20,
      tier: 1,
      status: 'ACTIVE',
      totalEarnings: 0,
      pendingEarnings: 0,
      paidEarnings: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockAffiliateRepository.findByCode.mockResolvedValue(mockAffiliate);
    mockReferralRepository.findByReferredUserId.mockResolvedValue(null);

    // Act & Assert
    await expect(
      useCase.execute({
        affiliateCode: 'TESTCODE',
        referredUserId: 'user-123', // Same as affiliate's userId
      })
    ).rejects.toThrow('Self-referrals are not allowed');
  });
});
