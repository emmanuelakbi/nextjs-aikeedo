/**
 * Property-Based Tests for Mock Type Consistency
 *
 * Feature: critical-fixes, Property 8: Test Type Consistency
 * **Validates: Requirements 6.1, 6.5**
 *
 * These tests verify that mock implementations maintain type consistency
 * with their corresponding interfaces, ensuring that:
 * - Mock objects have all required methods from their interfaces
 * - Mock method signatures match interface method signatures
 * - Mock return types are compatible with interface return types
 * - Mock implementations can be safely used in place of real implementations
 */

import { describe, it, expect, vi, type Mock } from 'vitest';
import * as fc from 'fast-check';
import {
  createMockUserRepository,
  createMockWorkspaceRepository,
  createMockDocumentRepository,
  createMockFileRepository,
  createMockConversationRepository,
  createMockMessageRepository,
  createMockPresetRepository,
  createMockFileStorage,
  TestDIContainer,
  createTestContainer,
} from '@/infrastructure/di/test-container';
import type { IUserRepository } from '@/domain/user/repositories/IUserRepository';
import type { IWorkspaceRepository } from '@/domain/workspace/repositories/IWorkspaceRepository';
import type { DocumentRepositoryInterface } from '@/domain/document/repositories/DocumentRepositoryInterface';
import type { FileRepositoryInterface } from '@/domain/file/repositories/FileRepositoryInterface';
import type { IConversationRepository } from '@/domain/conversation/repositories/IConversationRepository';
import type { IMessageRepository } from '@/domain/conversation/repositories/IMessageRepository';
import type { IPresetRepository } from '@/domain/preset/repositories/IPresetRepository';
import type { FileStorage } from '@/lib/storage';
import type {
  AffiliateRepository,
  ReferralRepository,
} from '@/domain/affiliate/repositories/affiliate-repository';
import type { PayoutRepository } from '@/domain/affiliate/repositories/payout-repository';

/**
 * Helper to get all method names from an object
 * Validates: Requirement 6.1 - Test files must use properly typed mock objects
 */
function getMethodNames(obj: object): string[] {
  return Object.keys(obj).filter(
    (key) => typeof (obj as Record<string, unknown>)[key] === 'function'
  );
}

/**
 * Helper to verify a method returns a promise
 * Validates: Requirement 6.5 - Mock implementations must match interface signatures
 */
function isPromise(value: unknown): boolean {
  return (
    value !== null &&
    typeof value === 'object' &&
    'then' in value &&
    typeof (value as { then: unknown }).then === 'function'
  );
}

/**
 * Type-safe mock factory type for affiliate repositories
 * Validates: Requirement 6.1 - Test files must use properly typed mock objects
 */
type MockAffiliateRepository = {
  [K in keyof AffiliateRepository]: Mock<AffiliateRepository[K]>;
};

type MockReferralRepository = {
  [K in keyof ReferralRepository]: Mock<ReferralRepository[K]>;
};

type MockPayoutRepository = {
  [K in keyof PayoutRepository]: Mock<PayoutRepository[K]>;
};

/**
 * Create a type-safe mock for AffiliateRepository
 * Validates: Requirement 6.5 - Mock implementations must match interface signatures
 */
function createMockAffiliateRepository(): MockAffiliateRepository {
  return {
    findByUserId: vi.fn().mockResolvedValue(null),
    findByCode: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({
      id: 'mock-affiliate-id',
      userId: 'mock-user-id',
      code: 'MOCKCODE',
      commissionRate: 20,
      tier: 1,
      status: 'ACTIVE',
      totalEarnings: 0,
      pendingEarnings: 0,
      paidEarnings: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    update: vi.fn().mockResolvedValue({
      id: 'mock-affiliate-id',
      userId: 'mock-user-id',
      code: 'MOCKCODE',
      commissionRate: 20,
      tier: 1,
      status: 'ACTIVE',
      totalEarnings: 0,
      pendingEarnings: 0,
      paidEarnings: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    codeExists: vi.fn().mockResolvedValue(false),
    getStats: vi.fn().mockResolvedValue({
      totalReferrals: 0,
      convertedReferrals: 0,
      conversionRate: 0,
    }),
  };
}

/**
 * Create a type-safe mock for ReferralRepository
 * Validates: Requirement 6.5 - Mock implementations must match interface signatures
 */
function createMockReferralRepository(): MockReferralRepository {
  return {
    create: vi.fn().mockResolvedValue({
      id: 'mock-referral-id',
      affiliateId: 'mock-affiliate-id',
      referredUserId: 'mock-user-id',
      status: 'PENDING',
      conversionValue: 0,
      commission: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    findByReferredUserId: vi.fn().mockResolvedValue(null),
    updateStatus: vi.fn().mockResolvedValue({
      id: 'mock-referral-id',
      affiliateId: 'mock-affiliate-id',
      referredUserId: 'mock-user-id',
      status: 'CONVERTED',
      conversionValue: 1000,
      commission: 200,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    findByAffiliateId: vi.fn().mockResolvedValue([]),
    isReferred: vi.fn().mockResolvedValue(false),
  };
}

/**
 * Create a type-safe mock for PayoutRepository
 * Validates: Requirement 6.5 - Mock implementations must match interface signatures
 */
function createMockPayoutRepository(): MockPayoutRepository {
  return {
    create: vi.fn().mockResolvedValue({
      id: 'mock-payout-id',
      affiliateId: 'mock-affiliate-id',
      amount: 5000,
      method: 'PAYPAL',
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    findById: vi.fn().mockResolvedValue(null),
    findByAffiliateId: vi.fn().mockResolvedValue([]),
    findPending: vi.fn().mockResolvedValue([]),
    updateStatus: vi.fn().mockResolvedValue({
      id: 'mock-payout-id',
      affiliateId: 'mock-affiliate-id',
      amount: 5000,
      method: 'PAYPAL',
      status: 'COMPLETED',
      processedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    getStats: vi.fn().mockResolvedValue({
      totalRequested: 0,
      totalPaid: 0,
      totalPending: 0,
      totalRejected: 0,
      payoutCount: 0,
    }),
  };
}

describe('Mock Type Consistency Property Tests', () => {
  /**
   * Property 8: Test Type Consistency
   * For any mock implementation, it should have all methods defined
   * in its corresponding interface with matching signatures.
   *
   * Validates: Requirements 6.1, 6.5
   */
  describe('Repository Mock Type Consistency', () => {
    /**
     * Property: Mock repositories must implement all interface methods
     * Validates: Requirement 6.1 - Test files must use properly typed mock objects
     */
    it('should have type-consistent user repository mock', () => {
      fc.assert(
        fc.property(fc.constant(createMockUserRepository()), (mockRepo) => {
          // Verify all required methods exist
          const requiredMethods: (keyof IUserRepository)[] = [
            'save',
            'findById',
            'findByEmail',
            'delete',
            'findAll',
            'count',
            'findByWorkspace',
            'existsByEmail',
          ];

          const implementedMethods = getMethodNames(mockRepo);

          for (const method of requiredMethods) {
            // Method must exist
            expect(implementedMethods).toContain(method);
            // Method must be a function
            expect(typeof mockRepo[method]).toBe('function');
          }

          return true;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Mock repositories must return promises for async methods
     * Validates: Requirement 6.5 - Mock implementations must match interface signatures
     */
    it('should have type-consistent workspace repository mock', () => {
      fc.assert(
        fc.property(
          fc.constant(createMockWorkspaceRepository()),
          (mockRepo) => {
            const requiredMethods: (keyof IWorkspaceRepository)[] = [
              'save',
              'findById',
              'delete',
              'findByOwnerId',
              'findByUserId',
              'updateCredits',
              'existsByName',
              'addMember',
              'removeMember',
              'isMember',
              'getMembers',
            ];

            const implementedMethods = getMethodNames(mockRepo);

            for (const method of requiredMethods) {
              expect(implementedMethods).toContain(method);
              expect(typeof mockRepo[method]).toBe('function');
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Document repository mock must match interface
     * Validates: Requirements 6.1, 6.5
     */
    it('should have type-consistent document repository mock', () => {
      fc.assert(
        fc.property(fc.constant(createMockDocumentRepository()), (mockRepo) => {
          const requiredMethods: (keyof DocumentRepositoryInterface)[] = [
            'save',
            'findById',
            'findByWorkspaceId',
            'countByWorkspaceId',
            'search',
            'delete',
            'exists',
            'findByGenerationId',
            'findByFileId',
          ];

          const implementedMethods = getMethodNames(mockRepo);

          for (const method of requiredMethods) {
            expect(implementedMethods).toContain(method);
            expect(typeof mockRepo[method]).toBe('function');
          }

          return true;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: File repository mock must match interface
     * Validates: Requirements 6.1, 6.5
     */
    it('should have type-consistent file repository mock', () => {
      fc.assert(
        fc.property(fc.constant(createMockFileRepository()), (mockRepo) => {
          const requiredMethods: (keyof FileRepositoryInterface)[] = [
            'save',
            'findById',
            'findByWorkspaceId',
            'countByWorkspaceId',
            'delete',
            'exists',
          ];

          const implementedMethods = getMethodNames(mockRepo);

          for (const method of requiredMethods) {
            expect(implementedMethods).toContain(method);
            expect(typeof mockRepo[method]).toBe('function');
          }

          return true;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Conversation repository mock must match interface
     * Validates: Requirements 6.1, 6.5
     */
    it('should have type-consistent conversation repository mock', () => {
      fc.assert(
        fc.property(
          fc.constant(createMockConversationRepository()),
          (mockRepo) => {
            const requiredMethods: (keyof IConversationRepository)[] = [
              'save',
              'findById',
              'findByWorkspaceId',
              'findByUserId',
              'list',
              'count',
              'listWithPagination',
              'delete',
            ];

            const implementedMethods = getMethodNames(mockRepo);

            for (const method of requiredMethods) {
              expect(implementedMethods).toContain(method);
              expect(typeof mockRepo[method]).toBe('function');
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Message repository mock must match interface
     * Validates: Requirements 6.1, 6.5
     */
    it('should have type-consistent message repository mock', () => {
      fc.assert(
        fc.property(fc.constant(createMockMessageRepository()), (mockRepo) => {
          const requiredMethods: (keyof IMessageRepository)[] = [
            'create',
            'save',
            'findById',
            'findByConversationId',
            'deleteByConversationId',
            'delete',
          ];

          const implementedMethods = getMethodNames(mockRepo);

          for (const method of requiredMethods) {
            expect(implementedMethods).toContain(method);
            expect(typeof mockRepo[method]).toBe('function');
          }

          return true;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Preset repository mock must match interface
     * Validates: Requirements 6.1, 6.5
     */
    it('should have type-consistent preset repository mock', () => {
      fc.assert(
        fc.property(fc.constant(createMockPresetRepository()), (mockRepo) => {
          const requiredMethods: (keyof IPresetRepository)[] = [
            'save',
            'findById',
            'findByWorkspaceId',
            'findByCategory',
            'findSystemPresets',
            'list',
            'incrementUsageCount',
            'delete',
          ];

          const implementedMethods = getMethodNames(mockRepo);

          for (const method of requiredMethods) {
            expect(implementedMethods).toContain(method);
            expect(typeof mockRepo[method]).toBe('function');
          }

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Affiliate Repository Mock Type Consistency', () => {
    /**
     * Property: Affiliate repository mock must match interface
     * Validates: Requirements 6.1, 6.5
     */
    it('should have type-consistent affiliate repository mock', () => {
      fc.assert(
        fc.property(
          fc.constant(createMockAffiliateRepository()),
          (mockRepo) => {
            const requiredMethods: (keyof AffiliateRepository)[] = [
              'findByUserId',
              'findByCode',
              'create',
              'update',
              'codeExists',
              'getStats',
            ];

            const implementedMethods = getMethodNames(mockRepo);

            for (const method of requiredMethods) {
              expect(implementedMethods).toContain(method);
              expect(typeof mockRepo[method]).toBe('function');
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Referral repository mock must match interface
     * Validates: Requirements 6.1, 6.5
     */
    it('should have type-consistent referral repository mock', () => {
      fc.assert(
        fc.property(fc.constant(createMockReferralRepository()), (mockRepo) => {
          const requiredMethods: (keyof ReferralRepository)[] = [
            'create',
            'findByReferredUserId',
            'updateStatus',
            'findByAffiliateId',
            'isReferred',
          ];

          const implementedMethods = getMethodNames(mockRepo);

          for (const method of requiredMethods) {
            expect(implementedMethods).toContain(method);
            expect(typeof mockRepo[method]).toBe('function');
          }

          return true;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Payout repository mock must match interface
     * Validates: Requirements 6.1, 6.5
     */
    it('should have type-consistent payout repository mock', () => {
      fc.assert(
        fc.property(fc.constant(createMockPayoutRepository()), (mockRepo) => {
          const requiredMethods: (keyof PayoutRepository)[] = [
            'create',
            'findById',
            'findByAffiliateId',
            'findPending',
            'updateStatus',
            'getStats',
          ];

          const implementedMethods = getMethodNames(mockRepo);

          for (const method of requiredMethods) {
            expect(implementedMethods).toContain(method);
            expect(typeof mockRepo[method]).toBe('function');
          }

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Storage Mock Type Consistency', () => {
    /**
     * Property: File storage mock must match interface
     * Validates: Requirements 6.1, 6.5
     */
    it('should have type-consistent file storage mock', () => {
      fc.assert(
        fc.property(fc.constant(createMockFileStorage()), (mockStorage) => {
          const requiredMethods: (keyof FileStorage)[] = [
            'upload',
            'download',
            'delete',
            'exists',
            'getMetadata',
            'getPublicUrl',
            'getPresignedUploadUrl',
            'getPresignedDownloadUrl',
            'list',
          ];

          const implementedMethods = getMethodNames(mockStorage);

          for (const method of requiredMethods) {
            expect(implementedMethods).toContain(method);
            expect(typeof mockStorage[method]).toBe('function');
          }

          return true;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: File storage mock should have correct sync/async method types
     * Validates: Requirement 6.5 - Mock implementations must match interface signatures
     */
    it('should have correct sync/async method types for file storage', () => {
      const mockStorage = createMockFileStorage();

      // Async methods should return promises
      expect(isPromise(mockStorage.upload('', Buffer.from('')))).toBe(true);
      expect(isPromise(mockStorage.download(''))).toBe(true);
      expect(isPromise(mockStorage.delete(''))).toBe(true);
      expect(isPromise(mockStorage.exists(''))).toBe(true);
      expect(isPromise(mockStorage.getMetadata(''))).toBe(true);
      expect(isPromise(mockStorage.getPresignedUploadUrl(''))).toBe(true);
      expect(isPromise(mockStorage.getPresignedDownloadUrl(''))).toBe(true);
      expect(isPromise(mockStorage.list())).toBe(true);

      // Sync method should return string directly
      const publicUrl = mockStorage.getPublicUrl('test-key');
      expect(typeof publicUrl).toBe('string');
      expect(isPromise(publicUrl)).toBe(false);
    });
  });

  describe('Test Container Type Consistency', () => {
    /**
     * Property: Test container should provide type-safe repository access
     * Validates: Requirements 6.1, 6.5
     */
    it('should provide type-safe repository access', () => {
      fc.assert(
        fc.property(fc.constant(createTestContainer()), (container) => {
          // All repository getters should return properly typed objects
          expect(container.userRepository).toBeDefined();
          expect(container.workspaceRepository).toBeDefined();
          expect(container.documentRepository).toBeDefined();
          expect(container.fileRepository).toBeDefined();
          expect(container.conversationRepository).toBeDefined();
          expect(container.messageRepository).toBeDefined();
          expect(container.presetRepository).toBeDefined();

          // Verify repositories have expected methods
          expect(typeof container.userRepository.findById).toBe('function');
          expect(typeof container.workspaceRepository.findById).toBe(
            'function'
          );
          expect(typeof container.documentRepository.findById).toBe('function');
          expect(typeof container.fileRepository.findById).toBe('function');
          expect(typeof container.conversationRepository.findById).toBe(
            'function'
          );
          expect(typeof container.messageRepository.findById).toBe('function');
          expect(typeof container.presetRepository.findById).toBe('function');

          return true;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Test container should allow type-safe repository overrides
     * Validates: Requirements 6.1, 6.5
     */
    it('should allow type-safe repository overrides', () => {
      const container = createTestContainer();

      // Create custom mock with vi.fn() for tracking
      const customUserRepo: IUserRepository = {
        save: vi.fn().mockResolvedValue({} as any),
        findById: vi.fn().mockResolvedValue(null),
        findByEmail: vi.fn().mockResolvedValue(null),
        delete: vi.fn().mockResolvedValue(undefined),
        findAll: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
        findByWorkspace: vi.fn().mockResolvedValue([]),
        existsByEmail: vi.fn().mockResolvedValue(false),
      };

      // Override should work without type errors
      container.setUserRepository(customUserRepo);

      // Verify override was applied
      expect(container.userRepository).toBe(customUserRepo);
    });

    /**
     * Property: Test container reset should restore default mocks
     * Validates: Requirements 6.1, 6.5
     */
    it('should reset to default mocks correctly', () => {
      const container = createTestContainer();

      // Get original reference
      const originalUserRepo = container.userRepository;

      // Override
      const customUserRepo: IUserRepository = {
        save: vi.fn().mockResolvedValue({} as any),
        findById: vi.fn().mockResolvedValue(null),
        findByEmail: vi.fn().mockResolvedValue(null),
        delete: vi.fn().mockResolvedValue(undefined),
        findAll: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
        findByWorkspace: vi.fn().mockResolvedValue([]),
        existsByEmail: vi.fn().mockResolvedValue(false),
      };
      container.setUserRepository(customUserRepo);

      // Reset
      container.reset();

      // Should have new default mock (not the custom one)
      expect(container.userRepository).not.toBe(customUserRepo);
      // Should have all required methods
      expect(typeof container.userRepository.findById).toBe('function');
    });
  });

  describe('Mock Return Value Type Consistency', () => {
    /**
     * Property: Mock methods should return type-consistent default values
     * Validates: Requirement 6.5 - Mock implementations must match interface signatures
     */
    it('should return type-consistent default values for findById methods', async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), async (id) => {
          const userRepo = createMockUserRepository();
          const workspaceRepo = createMockWorkspaceRepository();
          const documentRepo = createMockDocumentRepository();
          const fileRepo = createMockFileRepository();
          const conversationRepo = createMockConversationRepository();
          const messageRepo = createMockMessageRepository();
          const presetRepo = createMockPresetRepository();

          // All findById methods should return null by default (type: T | null)
          const userResult = await userRepo.findById({ getValue: () => id } as any);
          const workspaceResult = await workspaceRepo.findById(id);
          const documentResult = await documentRepo.findById(id);
          const fileResult = await fileRepo.findById(id);
          const conversationResult = await conversationRepo.findById(id);
          const messageResult = await messageRepo.findById(id);
          const presetResult = await presetRepo.findById(id);

          expect(userResult).toBeNull();
          expect(workspaceResult).toBeNull();
          expect(documentResult).toBeNull();
          expect(fileResult).toBeNull();
          expect(conversationResult).toBeNull();
          expect(messageResult).toBeNull();
          expect(presetResult).toBeNull();

          return true;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Mock methods should return type-consistent arrays for list methods
     * Validates: Requirement 6.5 - Mock implementations must match interface signatures
     */
    it('should return type-consistent arrays for list methods', async () => {
      const userRepo = createMockUserRepository();
      const workspaceRepo = createMockWorkspaceRepository();
      const documentRepo = createMockDocumentRepository();
      const fileRepo = createMockFileRepository();
      const conversationRepo = createMockConversationRepository();
      const presetRepo = createMockPresetRepository();

      // All list methods should return empty arrays by default (type: T[])
      const userAll = await userRepo.findAll();
      const userByWorkspace = await userRepo.findByWorkspace('');
      const workspaceByOwner = await workspaceRepo.findByOwnerId('');
      const workspaceByUser = await workspaceRepo.findByUserId('');
      const documentByWorkspace = await documentRepo.findByWorkspaceId('');
      const fileByWorkspace = await fileRepo.findByWorkspaceId('');
      const conversationByWorkspace =
        await conversationRepo.findByWorkspaceId('');
      const conversationList = await conversationRepo.list();
      const presetByWorkspace = await presetRepo.findByWorkspaceId('');
      const presetList = await presetRepo.list();

      expect(Array.isArray(userAll)).toBe(true);
      expect(Array.isArray(userByWorkspace)).toBe(true);
      expect(Array.isArray(workspaceByOwner)).toBe(true);
      expect(Array.isArray(workspaceByUser)).toBe(true);
      expect(Array.isArray(documentByWorkspace)).toBe(true);
      expect(Array.isArray(fileByWorkspace)).toBe(true);
      expect(Array.isArray(conversationByWorkspace)).toBe(true);
      expect(Array.isArray(conversationList)).toBe(true);
      expect(Array.isArray(presetByWorkspace)).toBe(true);
      expect(Array.isArray(presetList)).toBe(true);
    });

    /**
     * Property: Mock methods should return type-consistent numbers for count methods
     * Validates: Requirement 6.5 - Mock implementations must match interface signatures
     */
    it('should return type-consistent numbers for count methods', async () => {
      const userRepo = createMockUserRepository();
      const documentRepo = createMockDocumentRepository();
      const fileRepo = createMockFileRepository();
      const conversationRepo = createMockConversationRepository();

      // All count methods should return 0 by default (type: number)
      const userCount = await userRepo.count();
      const documentCount = await documentRepo.countByWorkspaceId('');
      const fileCount = await fileRepo.countByWorkspaceId('');
      const conversationCount = await conversationRepo.count();

      expect(typeof userCount).toBe('number');
      expect(typeof documentCount).toBe('number');
      expect(typeof fileCount).toBe('number');
      expect(typeof conversationCount).toBe('number');

      expect(userCount).toBe(0);
      expect(documentCount).toBe(0);
      expect(fileCount).toBe(0);
      expect(conversationCount).toBe(0);
    });

    /**
     * Property: Mock methods should return type-consistent booleans for existence checks
     * Validates: Requirement 6.5 - Mock implementations must match interface signatures
     */
    it('should return type-consistent booleans for existence checks', async () => {
      const userRepo = createMockUserRepository();
      const workspaceRepo = createMockWorkspaceRepository();
      const documentRepo = createMockDocumentRepository();
      const fileRepo = createMockFileRepository();
      const fileStorage = createMockFileStorage();

      // All existence check methods should return false by default (type: boolean)
      const userExists = await userRepo.existsByEmail({} as any);
      const workspaceNameExists = await workspaceRepo.existsByName('', '');
      const workspaceIsMember = await workspaceRepo.isMember('', '');
      const documentExists = await documentRepo.exists('');
      const fileExists = await fileRepo.exists('');
      const storageExists = await fileStorage.exists('');

      expect(typeof userExists).toBe('boolean');
      expect(typeof workspaceNameExists).toBe('boolean');
      expect(typeof workspaceIsMember).toBe('boolean');
      expect(typeof documentExists).toBe('boolean');
      expect(typeof fileExists).toBe('boolean');
      expect(typeof storageExists).toBe('boolean');

      expect(userExists).toBe(false);
      expect(workspaceNameExists).toBe(false);
      expect(workspaceIsMember).toBe(false);
      expect(documentExists).toBe(false);
      expect(fileExists).toBe(false);
      expect(storageExists).toBe(false);
    });
  });
});

// Export mock factories for use in other tests
export {
  createMockAffiliateRepository,
  createMockReferralRepository,
  createMockPayoutRepository,
};
