/**
 * Process Commission Use Case Tests
 * Requirements: Affiliate 2 - Calculate commissions on payment events
 * Requirements: 6.1, 6.5 - Test files must use properly typed mock objects
 *
 * Note: The ProcessCommissionUseCase directly uses Prisma for some operations
 * instead of the repository pattern. This test mocks both the repositories
 * and Prisma to handle this design.
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { ProcessCommissionUseCase } from '../process-commission';
import type {
  AffiliateRepository,
  ReferralRepository,
} from '@/domain/affiliate/repositories/affiliate-repository';
import type { Affiliate, Referral } from '@/types/affiliate';

// Mock Prisma - the use case directly uses prisma.affiliate.findUnique
vi.mock('@/lib/db/prisma', () => ({
  default: {
    affiliate: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    referral: {
      update: vi.fn(),
    },
    $transaction: vi.fn((callback: (tx: unknown) => Promise<void>) =>
      callback({
        referral: { update: vi.fn() },
        affiliate: { update: vi.fn() },
      })
    ),
  },
}));

// Import prisma after mocking
import prisma from '@/lib/db/prisma';

/**
 * Type-safe mock for ReferralRepository
 * Implements only the methods used by ProcessCommissionUseCase
 */
type MockReferralRepository = {
  findByReferredUserId: Mock<ReferralRepository['findByReferredUserId']>;
};

describe('ProcessCommissionUseCase', () => {
  let useCase: ProcessCommissionUseCase;
  let mockAffiliateRepository: AffiliateRepository;
  let mockReferralRepository: MockReferralRepository;

  beforeEach(() => {
    vi.clearAllMocks();

    // The use case doesn't actually use the affiliate repository for findById
    // It uses prisma directly, so we just need a minimal mock
    mockAffiliateRepository = {} as AffiliateRepository;
    mockReferralRepository = {
      findByReferredUserId: vi.fn(),
    };
    useCase = new ProcessCommissionUseCase(
      mockAffiliateRepository,
      mockReferralRepository as unknown as ReferralRepository
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
    expect(result.reason).toBe('User was not referred');
  });

  it('should not process commission if referral already converted', async () => {
    // Arrange
    const mockReferral: Partial<Referral> = {
      id: 'referral-123',
      affiliateId: 'affiliate-123',
      referredUserId: 'user-123',
      status: 'CONVERTED',
    };
    mockReferralRepository.findByReferredUserId.mockResolvedValue(
      mockReferral as Referral
    );

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

  it('should not process commission if referral is canceled', async () => {
    // Arrange
    const mockReferral: Partial<Referral> = {
      id: 'referral-123',
      affiliateId: 'affiliate-123',
      referredUserId: 'user-123',
      status: 'CANCELED',
    };
    mockReferralRepository.findByReferredUserId.mockResolvedValue(
      mockReferral as Referral
    );

    // Act
    const result = await useCase.execute({
      userId: 'user-123',
      amount: 10000,
      transactionType: 'credit_purchase',
      referenceId: 'txn-123',
    });

    // Assert
    expect(result.processed).toBe(false);
    expect(result.reason).toBe('Referral was canceled');
  });

  it('should not process commission if affiliate not found', async () => {
    // Arrange
    const mockReferral: Partial<Referral> = {
      id: 'referral-123',
      affiliateId: 'affiliate-123',
      referredUserId: 'user-123',
      status: 'PENDING',
    };
    mockReferralRepository.findByReferredUserId.mockResolvedValue(
      mockReferral as Referral
    );
    vi.mocked(prisma.affiliate.findUnique).mockResolvedValue(null);

    // Act
    const result = await useCase.execute({
      userId: 'user-123',
      amount: 10000,
      transactionType: 'credit_purchase',
      referenceId: 'txn-123',
    });

    // Assert
    expect(result.processed).toBe(false);
    expect(result.reason).toBe('Affiliate not found');
  });

  it('should not process commission if affiliate is not active', async () => {
    // Arrange
    const mockReferral: Partial<Referral> = {
      id: 'referral-123',
      affiliateId: 'affiliate-123',
      referredUserId: 'user-123',
      status: 'PENDING',
    };
    const mockAffiliate = {
      id: 'affiliate-123',
      userId: 'owner-123',
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
    mockReferralRepository.findByReferredUserId.mockResolvedValue(
      mockReferral as Referral
    );
    vi.mocked(prisma.affiliate.findUnique).mockResolvedValue(
      mockAffiliate as any
    );

    // Act
    const result = await useCase.execute({
      userId: 'user-123',
      amount: 10000,
      transactionType: 'credit_purchase',
      referenceId: 'txn-123',
    });

    // Assert
    expect(result.processed).toBe(false);
    expect(result.reason).toBe('Affiliate is not active');
  });

  it('should process commission for a valid referral', async () => {
    // Arrange
    const userId = 'user-123';
    const amount = 10000; // $100.00
    const mockReferral: Partial<Referral> = {
      id: 'referral-123',
      affiliateId: 'affiliate-123',
      referredUserId: userId,
      status: 'PENDING',
    };
    const mockAffiliate = {
      id: 'affiliate-123',
      userId: 'owner-123',
      code: 'TESTCODE',
      commissionRate: 0.2, // 20% as decimal
      tier: 1,
      status: 'ACTIVE',
      totalEarnings: 0,
      pendingEarnings: 0,
      paidEarnings: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockReferralRepository.findByReferredUserId.mockResolvedValue(
      mockReferral as Referral
    );
    vi.mocked(prisma.affiliate.findUnique).mockResolvedValue(
      mockAffiliate as any
    );

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
    expect(result.referralId).toBe('referral-123');
    expect(result.affiliateId).toBe('affiliate-123');
  });
});
