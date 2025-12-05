/**
 * Track Referral Use Case Tests
 * Requirements: Affiliate 1 - Track referral signups
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TrackReferralUseCase } from '../track-referral';

// Mock the repositories
vi.mock('@/infrastructure/affiliate/prisma-affiliate-repository');

describe('TrackReferralUseCase', () => {
  let useCase: TrackReferralUseCase;
  let mockAffiliateRepository: any;
  let mockReferralRepository: any;

  beforeEach(() => {
    mockAffiliateRepository = {
      findByCode: vi.fn(),
    };
    mockReferralRepository = {
      findByReferredUserId: vi.fn(),
      create: vi.fn(),
    };
    useCase = new TrackReferralUseCase(
      mockAffiliateRepository,
      mockReferralRepository
    );
  });

  it('should track a new referral', async () => {
    // Arrange
    const affiliateCode = 'TESTCODE';
    const referredUserId = 'user-123';
    const mockAffiliate = {
      id: 'affiliate-123',
      code: affiliateCode,
      status: 'ACTIVE',
    };
    const mockReferral = {
      id: 'referral-123',
      affiliateId: mockAffiliate.id,
      referredUserId,
      status: 'PENDING',
      conversionValue: 0,
      commission: 0,
      createdAt: new Date(),
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
    expect(mockAffiliateRepository.findByCode).toHaveBeenCalledWith(affiliateCode);
    expect(mockReferralRepository.findByReferredUserId).toHaveBeenCalledWith(referredUserId);
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
    const mockAffiliate = {
      id: 'affiliate-123',
      code: 'TESTCODE',
      status: 'SUSPENDED',
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
    const mockAffiliate = {
      id: 'affiliate-123',
      code: 'TESTCODE',
      status: 'ACTIVE',
    };
    mockAffiliateRepository.findByCode.mockResolvedValue(mockAffiliate);
    mockReferralRepository.findByReferredUserId.mockResolvedValue({
      id: 'existing-referral',
    });

    // Act & Assert
    await expect(
      useCase.execute({
        affiliateCode: 'TESTCODE',
        referredUserId: 'user-123',
      })
    ).rejects.toThrow('User already has a referral');
  });

  it('should prevent self-referrals', async () => {
    // Arrange
    const mockAffiliate = {
      id: 'affiliate-123',
      userId: 'user-123',
      code: 'TESTCODE',
      status: 'ACTIVE',
    };
    mockAffiliateRepository.findByCode.mockResolvedValue(mockAffiliate);
    mockReferralRepository.findByReferredUserId.mockResolvedValue(null);

    // Act & Assert
    await expect(
      useCase.execute({
        affiliateCode: 'TESTCODE',
        referredUserId: 'user-123', // Same as affiliate's userId
      })
    ).rejects.toThrow('Cannot refer yourself');
  });
});
