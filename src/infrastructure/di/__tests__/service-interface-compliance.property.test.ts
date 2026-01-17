/**
 * Property-Based Tests for Service Interface Compliance
 *
 * Feature: critical-fixes, Property 3: Repository Interface Compliance
 * **Validates: Requirements 2.1, 2.3**
 *
 * These tests verify that mock implementations satisfy all methods defined
 * in their corresponding interfaces with matching signatures.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  createMockUserRepository,
  createMockWorkspaceRepository,
  createMockDocumentRepository,
  createMockFileRepository,
  createMockConversationRepository,
  createMockMessageRepository,
  createMockPresetRepository,
  createMockFileStorage,
} from '../test-container';
import type { IUserRepository } from '@/domain/user/repositories/IUserRepository';
import type { IWorkspaceRepository } from '@/domain/workspace/repositories/IWorkspaceRepository';
import type { DocumentRepositoryInterface } from '@/domain/document/repositories/DocumentRepositoryInterface';
import type { FileRepositoryInterface } from '@/domain/file/repositories/FileRepositoryInterface';
import type { IConversationRepository } from '@/domain/conversation/repositories/IConversationRepository';
import type { IMessageRepository } from '@/domain/conversation/repositories/IMessageRepository';
import type { IPresetRepository } from '@/domain/preset/repositories/IPresetRepository';
import type { FileStorage } from '@/lib/storage';

/**
 * Helper to get all method names from an interface type
 */
function getMethodNames(obj: object): string[] {
  return Object.keys(obj).filter((key) => typeof (obj as any)[key] === 'function');
}

/**
 * Helper to verify a method is callable and returns a promise
 */
async function verifyAsyncMethod(
  obj: object,
  methodName: string,
  ...args: unknown[]
): Promise<boolean> {
  const method = (obj as any)[methodName];
  if (typeof method !== 'function') {
    return false;
  }
  try {
    const result = method.apply(obj, args);
    // Check if it returns a promise
    if (result && typeof result.then === 'function') {
      await result;
      return true;
    }
    // Some methods like getPublicUrl are synchronous
    return true;
  } catch {
    // Method exists and is callable, even if it throws
    return true;
  }
}

describe('Service Interface Compliance Property Tests', () => {
  /**
   * Property 3: Repository Interface Compliance
   * For any repository implementation, it should satisfy all methods
   * defined in its corresponding interface with matching signatures.
   */
  describe('IUserRepository Interface Compliance', () => {
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

    it('should implement all required methods from IUserRepository interface', () => {
      fc.assert(
        fc.property(fc.constant(createMockUserRepository()), (mockRepo) => {
          const implementedMethods = getMethodNames(mockRepo);
          
          for (const method of requiredMethods) {
            expect(implementedMethods).toContain(method);
            expect(typeof (mockRepo as any)[method]).toBe('function');
          }
          
          return true;
        }),
        { numRuns: 10 }
      );
    });

    it('should have async methods that return promises', async () => {
      const mockRepo = createMockUserRepository();
      
      // Test that async methods return promises
      expect(mockRepo.findById({} as any)).toBeInstanceOf(Promise);
      expect(mockRepo.findByEmail({} as any)).toBeInstanceOf(Promise);
      expect(mockRepo.save({} as any)).toBeInstanceOf(Promise);
      expect(mockRepo.delete({} as any)).toBeInstanceOf(Promise);
      expect(mockRepo.findAll()).toBeInstanceOf(Promise);
      expect(mockRepo.count()).toBeInstanceOf(Promise);
      expect(mockRepo.findByWorkspace('')).toBeInstanceOf(Promise);
      expect(mockRepo.existsByEmail({} as any)).toBeInstanceOf(Promise);
    });
  });

  describe('IWorkspaceRepository Interface Compliance', () => {
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

    it('should implement all required methods from IWorkspaceRepository interface', () => {
      fc.assert(
        fc.property(fc.constant(createMockWorkspaceRepository()), (mockRepo) => {
          const implementedMethods = getMethodNames(mockRepo);
          
          for (const method of requiredMethods) {
            expect(implementedMethods).toContain(method);
            expect(typeof (mockRepo as any)[method]).toBe('function');
          }
          
          return true;
        }),
        { numRuns: 10 }
      );
    });

    it('should have async methods that return promises', async () => {
      const mockRepo = createMockWorkspaceRepository();
      
      expect(mockRepo.findById('')).toBeInstanceOf(Promise);
      expect(mockRepo.save({} as any)).toBeInstanceOf(Promise);
      expect(mockRepo.delete('')).toBeInstanceOf(Promise);
      expect(mockRepo.findByOwnerId('')).toBeInstanceOf(Promise);
      expect(mockRepo.findByUserId('')).toBeInstanceOf(Promise);
      expect(mockRepo.updateCredits('', 0)).toBeInstanceOf(Promise);
      expect(mockRepo.existsByName('', '')).toBeInstanceOf(Promise);
      expect(mockRepo.addMember('', '')).toBeInstanceOf(Promise);
      expect(mockRepo.removeMember('', '')).toBeInstanceOf(Promise);
      expect(mockRepo.isMember('', '')).toBeInstanceOf(Promise);
      expect(mockRepo.getMembers('')).toBeInstanceOf(Promise);
    });
  });

  describe('DocumentRepositoryInterface Compliance', () => {
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

    it('should implement all required methods from DocumentRepositoryInterface', () => {
      fc.assert(
        fc.property(fc.constant(createMockDocumentRepository()), (mockRepo) => {
          const implementedMethods = getMethodNames(mockRepo);
          
          for (const method of requiredMethods) {
            expect(implementedMethods).toContain(method);
            expect(typeof (mockRepo as any)[method]).toBe('function');
          }
          
          return true;
        }),
        { numRuns: 10 }
      );
    });
  });

  describe('FileRepositoryInterface Compliance', () => {
    const requiredMethods: (keyof FileRepositoryInterface)[] = [
      'save',
      'findById',
      'findByWorkspaceId',
      'countByWorkspaceId',
      'delete',
      'exists',
    ];

    it('should implement all required methods from FileRepositoryInterface', () => {
      fc.assert(
        fc.property(fc.constant(createMockFileRepository()), (mockRepo) => {
          const implementedMethods = getMethodNames(mockRepo);
          
          for (const method of requiredMethods) {
            expect(implementedMethods).toContain(method);
            expect(typeof (mockRepo as any)[method]).toBe('function');
          }
          
          return true;
        }),
        { numRuns: 10 }
      );
    });
  });

  describe('IConversationRepository Interface Compliance', () => {
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

    it('should implement all required methods from IConversationRepository interface', () => {
      fc.assert(
        fc.property(fc.constant(createMockConversationRepository()), (mockRepo) => {
          const implementedMethods = getMethodNames(mockRepo);
          
          for (const method of requiredMethods) {
            expect(implementedMethods).toContain(method);
            expect(typeof (mockRepo as any)[method]).toBe('function');
          }
          
          return true;
        }),
        { numRuns: 10 }
      );
    });
  });

  describe('IMessageRepository Interface Compliance', () => {
    const requiredMethods: (keyof IMessageRepository)[] = [
      'create',
      'save',
      'findById',
      'findByConversationId',
      'deleteByConversationId',
      'delete',
    ];

    it('should implement all required methods from IMessageRepository interface', () => {
      fc.assert(
        fc.property(fc.constant(createMockMessageRepository()), (mockRepo) => {
          const implementedMethods = getMethodNames(mockRepo);
          
          for (const method of requiredMethods) {
            expect(implementedMethods).toContain(method);
            expect(typeof (mockRepo as any)[method]).toBe('function');
          }
          
          return true;
        }),
        { numRuns: 10 }
      );
    });
  });

  describe('IPresetRepository Interface Compliance', () => {
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

    it('should implement all required methods from IPresetRepository interface', () => {
      fc.assert(
        fc.property(fc.constant(createMockPresetRepository()), (mockRepo) => {
          const implementedMethods = getMethodNames(mockRepo);
          
          for (const method of requiredMethods) {
            expect(implementedMethods).toContain(method);
            expect(typeof (mockRepo as any)[method]).toBe('function');
          }
          
          return true;
        }),
        { numRuns: 10 }
      );
    });
  });

  describe('FileStorage Interface Compliance', () => {
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

    it('should implement all required methods from FileStorage interface', () => {
      fc.assert(
        fc.property(fc.constant(createMockFileStorage()), (mockStorage) => {
          const implementedMethods = getMethodNames(mockStorage);
          
          for (const method of requiredMethods) {
            expect(implementedMethods).toContain(method);
            expect(typeof (mockStorage as any)[method]).toBe('function');
          }
          
          return true;
        }),
        { numRuns: 10 }
      );
    });

    it('should have getPublicUrl as a synchronous method', () => {
      const mockStorage = createMockFileStorage();
      const result = mockStorage.getPublicUrl('test-key');
      
      // getPublicUrl should return a string directly, not a promise
      expect(typeof result).toBe('string');
    });

    it('should have async methods that return promises', async () => {
      const mockStorage = createMockFileStorage();
      
      expect(mockStorage.upload('', Buffer.from(''))).toBeInstanceOf(Promise);
      expect(mockStorage.download('')).toBeInstanceOf(Promise);
      expect(mockStorage.delete('')).toBeInstanceOf(Promise);
      expect(mockStorage.exists('')).toBeInstanceOf(Promise);
      expect(mockStorage.getMetadata('')).toBeInstanceOf(Promise);
      expect(mockStorage.getPresignedUploadUrl('')).toBeInstanceOf(Promise);
      expect(mockStorage.getPresignedDownloadUrl('')).toBeInstanceOf(Promise);
      expect(mockStorage.list()).toBeInstanceOf(Promise);
    });
  });

  describe('Mock Return Value Consistency', () => {
    /**
     * Property: Mock methods should return consistent default values
     * that match the expected return types of the interface.
     */
    it('should return null for findById methods when entity not found', async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), async (id) => {
          const userRepo = createMockUserRepository();
          const workspaceRepo = createMockWorkspaceRepository();
          const documentRepo = createMockDocumentRepository();
          const fileRepo = createMockFileRepository();
          const conversationRepo = createMockConversationRepository();
          const messageRepo = createMockMessageRepository();
          const presetRepo = createMockPresetRepository();

          // All findById methods should return null by default
          expect(await userRepo.findById({ getValue: () => id } as any)).toBeNull();
          expect(await workspaceRepo.findById(id)).toBeNull();
          expect(await documentRepo.findById(id)).toBeNull();
          expect(await fileRepo.findById(id)).toBeNull();
          expect(await conversationRepo.findById(id)).toBeNull();
          expect(await messageRepo.findById(id)).toBeNull();
          expect(await presetRepo.findById(id)).toBeNull();

          return true;
        }),
        { numRuns: 10 }
      );
    });

    it('should return empty arrays for list/find methods', async () => {
      const userRepo = createMockUserRepository();
      const workspaceRepo = createMockWorkspaceRepository();
      const documentRepo = createMockDocumentRepository();
      const fileRepo = createMockFileRepository();
      const conversationRepo = createMockConversationRepository();
      const presetRepo = createMockPresetRepository();

      expect(await userRepo.findAll()).toEqual([]);
      expect(await userRepo.findByWorkspace('')).toEqual([]);
      expect(await workspaceRepo.findByOwnerId('')).toEqual([]);
      expect(await workspaceRepo.findByUserId('')).toEqual([]);
      expect(await documentRepo.findByWorkspaceId('')).toEqual([]);
      expect(await fileRepo.findByWorkspaceId('')).toEqual([]);
      expect(await conversationRepo.findByWorkspaceId('')).toEqual([]);
      expect(await conversationRepo.list()).toEqual([]);
      expect(await presetRepo.findByWorkspaceId('')).toEqual([]);
      expect(await presetRepo.list()).toEqual([]);
    });

    it('should return zero for count methods', async () => {
      const userRepo = createMockUserRepository();
      const documentRepo = createMockDocumentRepository();
      const fileRepo = createMockFileRepository();
      const conversationRepo = createMockConversationRepository();

      expect(await userRepo.count()).toBe(0);
      expect(await documentRepo.countByWorkspaceId('')).toBe(0);
      expect(await fileRepo.countByWorkspaceId('')).toBe(0);
      expect(await conversationRepo.count()).toBe(0);
    });

    it('should return false for existence check methods', async () => {
      const userRepo = createMockUserRepository();
      const workspaceRepo = createMockWorkspaceRepository();
      const documentRepo = createMockDocumentRepository();
      const fileRepo = createMockFileRepository();
      const fileStorage = createMockFileStorage();

      expect(await userRepo.existsByEmail({} as any)).toBe(false);
      expect(await workspaceRepo.existsByName('', '')).toBe(false);
      expect(await workspaceRepo.isMember('', '')).toBe(false);
      expect(await documentRepo.exists('')).toBe(false);
      expect(await fileRepo.exists('')).toBe(false);
      expect(await fileStorage.exists('')).toBe(false);
    });
  });
});
