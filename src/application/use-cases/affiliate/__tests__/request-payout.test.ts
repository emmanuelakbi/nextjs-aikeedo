/**
 * Request Payout Use Case Tests
 * Requirements: Affiliate 3 - Request payouts
 * Requirements: 6.1, 6.5 - Test files must use properly typed mock objects
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { RequestPayoutUseCase } from '../request-payout';
import type { AffiliateRepository } from '@/domain/affiliate/repositories/affiliate-repository';
import type { PayoutRepository } from '@/domain/affiliate/repositories/payout-repository';
import type { Affiliate, Payout, PayoutMethod } from '@/types/affiliate';

// Mock the repositories
vi.mock('@/infrastructure/affiliate/prisma-affiliate-repository');
vi.mock('@/infrastructure/affiliate/prisma-payout-repository');

/**
 * Type-safe mock for AffiliateRepository
 * Implements only the methods used by RequestPayoutUseCase
 */
type MockAffiliateRepository = {
  findByUserId: Mock<AffiliateRepository['findByUserId']>;
};

/**
 * Type-safe mock for PayoutRepository
 * Implements only the methods used by RequestPayoutUseCase
 */
type MockPayoutRepository = {
  create: Mock<PayoutRepository['create']>;
};

describe('RequestPayoutUseCase', () => {
  let useCase: RequestPayoutUseCase;
  let mockAffiliateRepository: MockAffiliateRepository;
  let mockPayoutRepository: MockPayoutRepository;

  beforeEach(() => {
    mockAffiliateRepository = {
      findByUserId: vi.fn(),
    };
    mockPayoutRepository = {
      create: vi.fn(),
    };
    useCase = new RequestPayoutUseCase(
      mockAffiliateRepository as unknown as AffiliateRepository,
      mockPayoutRepository as unknown as PayoutRepository
    );
  });

  it('should create payout request with valid data', async () => {
    // Arrange
    const userId = 'user-123';
    const amount = 10000; // $100.00
    const mockAffiliate: Affiliate = {
      id: 'affiliate-123',
      userId,
      code: 'TESTCODE',
      commissionRate: 20,
      tier: 1,
      status: 'ACTIVE',
      totalEarnings: 20000,
      pendingEarnings: 15000, // $150.00
      paidEarnings: 5000,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const mockPayout: Payout = {
      id: 'payout-123',
      affiliateId: mockAffiliate.id,
      amount,
      method: 'PAYPAL',
      status: 'PENDING',
      processedAt: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockAffiliateRepository.findByUserId.mockResolvedValue(mockAffiliate);
    mockPayoutRepository.create.mockResolvedValue(mockPayout);

    // Act
    const result = await useCase.execute({
      userId,
      amount,
      method: 'PAYPAL',
    });

    // Assert
    expect(result.success).toBe(true);
    expect(result.payout).toEqual(mockPayout);
    expect(mockPayoutRepository.create).toHaveBeenCalled();
  });

  it('should return error if affiliate not found', async () => {
    // Arrange
    mockAffiliateRepository.findByUserId.mockResolvedValue(null);

    // Act
    const result = await useCase.execute({
      userId: 'invalid-user',
      amount: 10000,
      method: 'PAYPAL',
    });

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBe('Affiliate account not found');
  });

  it('should return error if affiliate is not active', async () => {
    // Arrange
    const mockAffiliate: Affiliate = {
      id: 'affiliate-123',
      userId: 'user-123',
      code: 'TESTCODE',
      commissionRate: 20,
      tier: 1,
      status: 'SUSPENDED',
      totalEarnings: 20000,
      pendingEarnings: 15000,
      paidEarnings: 5000,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockAffiliateRepository.findByUserId.mockResolvedValue(mockAffiliate);

    // Act
    const result = await useCase.execute({
      userId: 'user-123',
      amount: 10000,
      method: 'PAYPAL',
    });

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBe('Affiliate account is not active');
  });

  it('should return error if insufficient balance', async () => {
    // Arrange
    const mockAffiliate: Affiliate = {
      id: 'affiliate-123',
      userId: 'user-123',
      code: 'TESTCODE',
      commissionRate: 20,
      tier: 1,
      status: 'ACTIVE',
      totalEarnings: 10000,
      pendingEarnings: 5000, // $50.00
      paidEarnings: 5000,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockAffiliateRepository.findByUserId.mockResolvedValue(mockAffiliate);

    // Act
    const result = await useCase.execute({
      userId: 'user-123',
      amount: 10000, // Requesting $100.00
      method: 'PAYPAL',
    });

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toContain('Insufficient pending earnings');
  });

  it('should enforce minimum payout amount', async () => {
    // Arrange
    const mockAffiliate: Affiliate = {
      id: 'affiliate-123',
      userId: 'user-123',
      code: 'TESTCODE',
      commissionRate: 20,
      tier: 1,
      status: 'ACTIVE',
      totalEarnings: 15000,
      pendingEarnings: 10000,
      paidEarnings: 5000,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockAffiliateRepository.findByUserId.mockResolvedValue(mockAffiliate);

    // Act
    const result = await useCase.execute({
      userId: 'user-123',
      amount: 1000, // $10.00 - below minimum
      method: 'PAYPAL',
    });

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toContain('Minimum payout amount');
  });

  it('should support different payout methods', async () => {
    // Arrange
    const mockAffiliate: Affiliate = {
      id: 'affiliate-123',
      userId: 'user-123',
      code: 'TESTCODE',
      commissionRate: 20,
      tier: 1,
      status: 'ACTIVE',
      totalEarnings: 20000,
      pendingEarnings: 15000,
      paidEarnings: 5000,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const mockPayout: Payout = {
      id: 'payout-123',
      affiliateId: 'affiliate-123',
      amount: 10000,
      method: 'STRIPE',
      status: 'PENDING',
      processedAt: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockAffiliateRepository.findByUserId.mockResolvedValue(mockAffiliate);
    mockPayoutRepository.create.mockResolvedValue(mockPayout);

    // Act
    const result = await useCase.execute({
      userId: 'user-123',
      amount: 10000,
      method: 'STRIPE',
    });

    // Assert
    expect(result.success).toBe(true);
    expect(result.payout?.method).toBe('STRIPE');
  });

  it('should create payout with correct affiliate ID', async () => {
    // Arrange
    const userId = 'user-123';
    const affiliateId = 'affiliate-123';
    const amount = 10000;
    const mockAffiliate: Affiliate = {
      id: affiliateId,
      userId,
      code: 'TESTCODE',
      commissionRate: 20,
      tier: 1,
      status: 'ACTIVE',
      totalEarnings: 20000,
      pendingEarnings: 15000,
      paidEarnings: 5000,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const mockPayout: Payout = {
      id: 'payout-123',
      affiliateId,
      amount,
      method: 'PAYPAL',
      status: 'PENDING',
      processedAt: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockAffiliateRepository.findByUserId.mockResolvedValue(mockAffiliate);
    mockPayoutRepository.create.mockResolvedValue(mockPayout);

    // Act
    await useCase.execute({
      userId,
      amount,
      method: 'PAYPAL',
    });

    // Assert
    expect(mockPayoutRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        affiliateId,
        amount,
        method: 'PAYPAL',
      })
    );
  });
});
