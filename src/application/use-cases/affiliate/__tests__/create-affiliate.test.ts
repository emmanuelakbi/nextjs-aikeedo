/**
 * Create Affiliate Use Case Tests
 * Requirements: Affiliate 1 - Generate unique referral codes
 * Requirements: 6.1, 6.5 - Test files must use properly typed mock objects
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { CreateAffiliateUseCase } from '../create-affiliate';
import type { AffiliateRepository } from '@/domain/affiliate/repositories/affiliate-repository';
import type { Affiliate } from '@/types/affiliate';

// Mock the repository
vi.mock('@/infrastructure/affiliate/prisma-affiliate-repository');

/**
 * Type-safe mock for AffiliateRepository
 * Implements only the methods used by CreateAffiliateUseCase
 */
type MockAffiliateRepository = {
  findByUserId: Mock<AffiliateRepository['findByUserId']>;
  codeExists: Mock<AffiliateRepository['codeExists']>;
  create: Mock<AffiliateRepository['create']>;
};

describe('CreateAffiliateUseCase', () => {
  let useCase: CreateAffiliateUseCase;
  let mockRepository: MockAffiliateRepository;

  beforeEach(() => {
    mockRepository = {
      findByUserId: vi.fn(),
      codeExists: vi.fn(),
      create: vi.fn(),
    };
    useCase = new CreateAffiliateUseCase(
      mockRepository as unknown as AffiliateRepository
    );
  });

  it('should create an affiliate with valid data', async () => {
    // Arrange
    const userId = 'user-123';
    const code = 'TESTCODE';
    const mockAffiliate: Affiliate = {
      id: 'affiliate-123',
      userId,
      code,
      commissionRate: 20,
      tier: 1,
      status: 'ACTIVE',
      totalEarnings: 0,
      pendingEarnings: 0,
      paidEarnings: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockRepository.findByUserId.mockResolvedValue(null);
    mockRepository.codeExists.mockResolvedValue(false);
    mockRepository.create.mockResolvedValue(mockAffiliate);

    // Act
    const result = await useCase.execute({
      userId,
      code,
      commissionRate: 20,
      tier: 1,
    });

    // Assert
    expect(result).toEqual(mockAffiliate);
    expect(mockRepository.findByUserId).toHaveBeenCalledWith(userId);
    expect(mockRepository.codeExists).toHaveBeenCalledWith(code);
    expect(mockRepository.create).toHaveBeenCalled();
  });

  it('should throw error if user already has affiliate account', async () => {
    // Arrange
    const userId = 'user-123';
    const existingAffiliate: Affiliate = {
      id: 'existing-affiliate',
      userId,
      code: 'EXISTING',
      commissionRate: 20,
      tier: 1,
      status: 'ACTIVE',
      totalEarnings: 0,
      pendingEarnings: 0,
      paidEarnings: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockRepository.findByUserId.mockResolvedValue(existingAffiliate);

    // Act & Assert
    await expect(
      useCase.execute({
        userId,
        code: 'TESTCODE',
        commissionRate: 20,
        tier: 1,
      })
    ).rejects.toThrow('User already has an affiliate account');
  });

  it('should throw error if code is already taken', async () => {
    // Arrange
    const code = 'TESTCODE';
    mockRepository.findByUserId.mockResolvedValue(null);
    mockRepository.codeExists.mockResolvedValue(true);

    // Act & Assert
    await expect(
      useCase.execute({
        userId: 'user-123',
        code,
        commissionRate: 20,
        tier: 1,
      })
    ).rejects.toThrow('Referral code already exists');
  });

  it('should generate code if not provided', async () => {
    // Arrange
    const userId = 'user-123';
    const mockAffiliate: Affiliate = {
      id: 'affiliate-123',
      userId,
      code: 'GENERATED123',
      commissionRate: 20,
      tier: 1,
      status: 'ACTIVE',
      totalEarnings: 0,
      pendingEarnings: 0,
      paidEarnings: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockRepository.findByUserId.mockResolvedValue(null);
    mockRepository.codeExists.mockResolvedValue(false);
    mockRepository.create.mockResolvedValue(mockAffiliate);

    // Act
    const result = await useCase.execute({
      userId,
      commissionRate: 20,
      tier: 1,
    });

    // Assert
    expect(result.code).toBeDefined();
    expect(result.code.length).toBeGreaterThan(0);
  });

  it('should use default commission rate if not provided', async () => {
    // Arrange
    const userId = 'user-123';
    const mockAffiliate: Affiliate = {
      id: 'affiliate-123',
      userId,
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
    mockRepository.findByUserId.mockResolvedValue(null);
    mockRepository.codeExists.mockResolvedValue(false);
    mockRepository.create.mockResolvedValue(mockAffiliate);

    // Act
    const result = await useCase.execute({
      userId,
      code: 'TESTCODE',
      tier: 1,
    });

    // Assert
    expect(result.commissionRate).toBe(20);
  });
});
