/**
 * Create Affiliate Use Case Tests
 * Requirements: Affiliate 1 - Generate unique referral codes
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateAffiliateUseCase } from '../create-affiliate';
import { PrismaAffiliateRepository } from '@/infrastructure/affiliate/prisma-affiliate-repository';

// Mock the repository
vi.mock('@/infrastructure/affiliate/prisma-affiliate-repository');

describe('CreateAffiliateUseCase', () => {
  let useCase: CreateAffiliateUseCase;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = {
      findByUserId: vi.fn(),
      findByCode: vi.fn(),
      create: vi.fn(),
    };
    useCase = new CreateAffiliateUseCase(mockRepository);
  });

  it('should create an affiliate with valid data', async () => {
    // Arrange
    const userId = 'user-123';
    const code = 'TESTCODE';
    const mockAffiliate = {
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
    };

    mockRepository.findByUserId.mockResolvedValue(null);
    mockRepository.findByCode.mockResolvedValue(null);
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
    expect(mockRepository.findByCode).toHaveBeenCalledWith(code);
    expect(mockRepository.create).toHaveBeenCalled();
  });

  it('should throw error if user already has affiliate account', async () => {
    // Arrange
    const userId = 'user-123';
    mockRepository.findByUserId.mockResolvedValue({ id: 'existing-affiliate' });

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
    mockRepository.findByCode.mockResolvedValue({ id: 'existing-affiliate' });

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
    mockRepository.findByUserId.mockResolvedValue(null);
    mockRepository.findByCode.mockResolvedValue(null);
    mockRepository.create.mockResolvedValue({
      id: 'affiliate-123',
      userId,
      code: expect.any(String),
      commissionRate: 20,
      tier: 1,
      status: 'ACTIVE',
      totalEarnings: 0,
      pendingEarnings: 0,
      paidEarnings: 0,
      createdAt: new Date(),
    });

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
    mockRepository.findByUserId.mockResolvedValue(null);
    mockRepository.findByCode.mockResolvedValue(null);
    mockRepository.create.mockResolvedValue({
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
    });

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
