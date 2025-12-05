/**
 * Request Payout Use Case Tests
 * Requirements: Affiliate 3 - Request payouts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RequestPayoutUseCase } from '../request-payout';

// Mock the repositories
vi.mock('@/infrastructure/affiliate/prisma-affiliate-repository');
vi.mock('@/infrastructure/affiliate/prisma-payout-repository');

describe('RequestPayoutUseCase', () => {
  let useCase: RequestPayoutUseCase;
  let mockAffiliateRepository: any;
  let mockPayoutRepository: any;

  beforeEach(() => {
    mockAffiliateRepository = {
      findById: vi.fn(),
      updateEarnings: vi.fn(),
    };
    mockPayoutRepository = {
      create: vi.fn(),
    };
    useCase = new RequestPayoutUseCase(
      mockAffiliateRepository,
      mockPayoutRepository
    );
  });

  it('should create payout request with valid data', async () => {
    // Arrange
    const affiliateId = 'affiliate-123';
    const amount = 10000; // $100.00
    const mockAffiliate = {
      id: affiliateId,
      pendingEarnings: 15000, // $150.00
      status: 'ACTIVE',
    };
    const mockPayout = {
      id: 'payout-123',
      affiliateId,
      amount,
      method: 'PAYPAL',
      status: 'PENDING',
      createdAt: new Date(),
    };

    mockAffiliateRepository.findById.mockResolvedValue(mockAffiliate);
    mockPayoutRepository.create.mockResolvedValue(mockPayout);
    mockAffiliateRepository.updateEarnings.mockResolvedValue(undefined);

    // Act
    const result = await useCase.execute({
      affiliateId,
      amount,
      method: 'PAYPAL',
    });

    // Assert
    expect(result.success).toBe(true);
    expect(result.payout).toEqual(mockPayout);
    expect(mockPayoutRepository.create).toHaveBeenCalled();
  });

  it('should throw error if affiliate not found', async () => {
    // Arrange
    mockAffiliateRepository.findById.mockResolvedValue(null);

    // Act & Assert
    await expect(
      useCase.execute({
        affiliateId: 'invalid-id',
        amount: 10000,
        method: 'PAYPAL',
      })
    ).rejects.toThrow('Affiliate not found');
  });

  it('should throw error if affiliate is not active', async () => {
    // Arrange
    const mockAffiliate = {
      id: 'affiliate-123',
      pendingEarnings: 15000,
      status: 'SUSPENDED',
    };
    mockAffiliateRepository.findById.mockResolvedValue(mockAffiliate);

    // Act & Assert
    await expect(
      useCase.execute({
        affiliateId: 'affiliate-123',
        amount: 10000,
        method: 'PAYPAL',
      })
    ).rejects.toThrow('Affiliate account is not active');
  });

  it('should throw error if insufficient balance', async () => {
    // Arrange
    const mockAffiliate = {
      id: 'affiliate-123',
      pendingEarnings: 5000, // $50.00
      status: 'ACTIVE',
    };
    mockAffiliateRepository.findById.mockResolvedValue(mockAffiliate);

    // Act & Assert
    await expect(
      useCase.execute({
        affiliateId: 'affiliate-123',
        amount: 10000, // Requesting $100.00
        method: 'PAYPAL',
      })
    ).rejects.toThrow('Insufficient balance');
  });

  it('should enforce minimum payout amount', async () => {
    // Arrange
    const mockAffiliate = {
      id: 'affiliate-123',
      pendingEarnings: 10000,
      status: 'ACTIVE',
    };
    mockAffiliateRepository.findById.mockResolvedValue(mockAffiliate);

    // Act & Assert
    await expect(
      useCase.execute({
        affiliateId: 'affiliate-123',
        amount: 1000, // $10.00 - below minimum
        method: 'PAYPAL',
      })
    ).rejects.toThrow('Minimum payout amount is $50.00');
  });

  it('should support different payout methods', async () => {
    // Arrange
    const mockAffiliate = {
      id: 'affiliate-123',
      pendingEarnings: 15000,
      status: 'ACTIVE',
    };
    mockAffiliateRepository.findById.mockResolvedValue(mockAffiliate);
    mockPayoutRepository.create.mockResolvedValue({
      id: 'payout-123',
      affiliateId: 'affiliate-123',
      amount: 10000,
      method: 'STRIPE',
      status: 'PENDING',
      createdAt: new Date(),
    });
    mockAffiliateRepository.updateEarnings.mockResolvedValue(undefined);

    // Act
    const result = await useCase.execute({
      affiliateId: 'affiliate-123',
      amount: 10000,
      method: 'STRIPE',
    });

    // Assert
    expect(result.success).toBe(true);
    expect(result.payout?.method).toBe('STRIPE');
  });

  it('should update affiliate pending earnings after payout request', async () => {
    // Arrange
    const affiliateId = 'affiliate-123';
    const amount = 10000;
    const mockAffiliate = {
      id: affiliateId,
      pendingEarnings: 15000,
      status: 'ACTIVE',
    };
    mockAffiliateRepository.findById.mockResolvedValue(mockAffiliate);
    mockPayoutRepository.create.mockResolvedValue({
      id: 'payout-123',
      affiliateId,
      amount,
      method: 'PAYPAL',
      status: 'PENDING',
      createdAt: new Date(),
    });
    mockAffiliateRepository.updateEarnings.mockResolvedValue(undefined);

    // Act
    await useCase.execute({
      affiliateId,
      amount,
      method: 'PAYPAL',
    });

    // Assert
    expect(mockAffiliateRepository.updateEarnings).toHaveBeenCalledWith(
      affiliateId,
      expect.objectContaining({
        pendingEarnings: 5000, // 15000 - 10000
      })
    );
  });
});
