/**
 * Process Commission Use Case Tests
 * Requirements: Affiliate 2 - Calculate commissions on payment events
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProcessCommissionUseCase } from '../process-commission';

// Mock the repositories
vi.mock('@/infrastructure/affiliate/prisma-affiliate-repository');

describe('ProcessCommissionUseCase', () => {
  let useCase: ProcessCommissionUseCase;
  let mockAffiliateRepository: any;
  let mockReferralRepository: any;

  beforeEach(() => {
    mockAffiliateRepository = {
      findById: vi.fn(),
      updateEarnings: vi.fn(),
    };
    mockReferralRepository = {
      findByReferredUserId: vi.fn(),
      updateCommission: vi.fn(),
    };
    useCase = new ProcessCommissionUseCase(
      mockAffiliateRepository,
      mockReferralRepository
    );
  });

  it('should process commission for a valid referral', async () => {
    // Arrange
    const userId = 'user-123';
    const amount = 10000; // $100.00
    const mockReferral = {
      id: 'referral-123',
      affiliateId: 'affiliate-123',
      referredUserId: userId,
      status: 'PENDING',
    };
    const mockAffiliate = {
      id: 'affiliate-123',
      commissionRate: 20, // 20%
      totalEarnings: 0,
      pendingEarnings: 0,
    };

    mockReferralRepository.findByReferredUserId.mockResolvedValue(mockReferral);
    mockAffiliateRepository.findById.mockResolvedValue(mockAffiliate);
    mockReferralRepository.updateCommission.mockResolvedValue(undefined);
    mockAffiliateRepository.updateEarnings.mockResolvedValue(undefined);

    // Act
    const result = await useCase.execute({
      userId,
      amount,
      transactionType: 'credit_purchase',
      referenceId: 'txn-123',
    });

    // Assert
    expect(result.processed).toBe(true);
    expect(result.commission).toBe(2000); // 20% of $100.00
    expect(mockReferralRepository.updateCommission).toHaveBeenCalledWith(
      mockReferral.id,
      expect.objectContaining({
        status: 'CONVERTED',
        commission: 2000,
        conversionValue: amount,
      })
    );
  });

  it('should not process commission if no referral exists', async () => {
    // Arrange
    mockReferralRepository.findByReferredUserId.mockResolvedValue(null);

    // Act
    const result = await useCase.execute({
      userId: 'user-123',
      amount: 10000,
      transactionType: 'credit_purchase',
      referenceId: 'txn-123',
    });

    // Assert
    expect(result.processed).toBe(false);
    expect(result.reason).toBe('No referral found');
  });

  it('should not process commission if referral already converted', async () => {
    // Arrange
    const mockReferral = {
      id: 'referral-123',
      affiliateId: 'affiliate-123',
      referredUserId: 'user-123',
      status: 'CONVERTED',
    };
    mockReferralRepository.findByReferredUserId.mockResolvedValue(mockReferral);

    // Act
    const result = await useCase.execute({
      userId: 'user-123',
      amount: 10000,
      transactionType: 'credit_purchase',
      referenceId: 'txn-123',
    });

    // Assert
    expect(result.processed).toBe(false);
    expect(result.reason).toBe('Referral already converted');
  });

  it('should calculate commission correctly based on rate', async () => {
    // Arrange
    const amount = 50000; // $500.00
    const commissionRate = 15; // 15%
    const mockReferral = {
      id: 'referral-123',
      affiliateId: 'affiliate-123',
      referredUserId: 'user-123',
      status: 'PENDING',
    };
    const mockAffiliate = {
      id: 'affiliate-123',
      commissionRate,
      totalEarnings: 0,
      pendingEarnings: 0,
    };

    mockReferralRepository.findByReferredUserId.mockResolvedValue(mockReferral);
    mockAffiliateRepository.findById.mockResolvedValue(mockAffiliate);
    mockReferralRepository.updateCommission.mockResolvedValue(undefined);
    mockAffiliateRepository.updateEarnings.mockResolvedValue(undefined);

    // Act
    const result = await useCase.execute({
      userId: 'user-123',
      amount,
      transactionType: 'subscription',
      referenceId: 'sub-123',
    });

    // Assert
    expect(result.commission).toBe(7500); // 15% of $500.00 = $75.00
  });

  it('should handle different transaction types', async () => {
    // Arrange
    const mockReferral = {
      id: 'referral-123',
      affiliateId: 'affiliate-123',
      referredUserId: 'user-123',
      status: 'PENDING',
    };
    const mockAffiliate = {
      id: 'affiliate-123',
      commissionRate: 20,
      totalEarnings: 0,
      pendingEarnings: 0,
    };

    mockReferralRepository.findByReferredUserId.mockResolvedValue(mockReferral);
    mockAffiliateRepository.findById.mockResolvedValue(mockAffiliate);
    mockReferralRepository.updateCommission.mockResolvedValue(undefined);
    mockAffiliateRepository.updateEarnings.mockResolvedValue(undefined);

    // Act - Test subscription
    const result1 = await useCase.execute({
      userId: 'user-123',
      amount: 10000,
      transactionType: 'subscription',
      referenceId: 'sub-123',
    });

    // Reset mocks
    mockReferralRepository.findByReferredUserId.mockResolvedValue({
      ...mockReferral,
      status: 'PENDING',
    });

    // Act - Test credit purchase
    const result2 = await useCase.execute({
      userId: 'user-123',
      amount: 10000,
      transactionType: 'credit_purchase',
      referenceId: 'txn-123',
    });

    // Assert
    expect(result1.processed).toBe(true);
    expect(result2.processed).toBe(true);
  });
});
