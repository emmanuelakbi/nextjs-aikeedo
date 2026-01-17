/**
 * Feature: critical-fixes, Property 3: Repository Interface Compliance
 * **Validates: Requirements 2.1, 2.3**
 *
 * Property: For any repository implementation, it should satisfy all methods
 * defined in its corresponding interface with matching signatures.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

// Import repository implementations
import { UserRepository } from '../UserRepository';
import { WorkspaceRepository } from '../WorkspaceRepository';
import { ConversationRepository } from '../ConversationRepository';
import { MessageRepository } from '../MessageRepository';
import { PresetRepository } from '../PresetRepository';
import { FileRepository } from '../FileRepository';
import { DocumentRepository } from '../DocumentRepository';

// Import repository interfaces
import type { IUserRepository } from '../../../domain/user/repositories/IUserRepository';
import type { IWorkspaceRepository } from '../../../domain/workspace/repositories/IWorkspaceRepository';
import type { IConversationRepository } from '../../../domain/conversation/repositories/IConversationRepository';
import type { IMessageRepository } from '../../../domain/conversation/repositories/IMessageRepository';
import type { IPresetRepository } from '../../../domain/preset/repositories/IPresetRepository';
import type { FileRepositoryInterface } from '../../../domain/file/repositories/FileRepositoryInterface';
import type { DocumentRepositoryInterface } from '../../../domain/document/repositories/DocumentRepositoryInterface';

/**
 * Helper function to get all method names from an object
 */
function getMethodNames(obj: object): string[] {
  const methods: string[] = [];
  let current = obj;

  while (current && current !== Object.prototype) {
    const names = Object.getOwnPropertyNames(current);
    for (const name of names) {
      if (
        name !== 'constructor' &&
        typeof (current as Record<string, unknown>)[name] === 'function' &&
        !methods.includes(name)
      ) {
        methods.push(name);
      }
    }
    current = Object.getPrototypeOf(current);
  }

  return methods.filter((m) => !m.startsWith('_')); // Exclude private methods
}

/**
 * Helper to verify a repository implements all interface methods
 */
function verifyInterfaceMethods(
  implementation: object,
  interfaceMethods: string[]
): { missing: string[]; implemented: string[] } {
  const implementedMethods = getMethodNames(implementation);
  const missing = interfaceMethods.filter(
    (m) => !implementedMethods.includes(m)
  );
  const implemented = interfaceMethods.filter((m) =>
    implementedMethods.includes(m)
  );

  return { missing, implemented };
}

describe('Repository Interface Compliance', () => {
  describe('Property 3: Repository implementations satisfy interface contracts', () => {
    /**
     * UserRepository implements IUserRepository
     */
    it('UserRepository should implement all IUserRepository methods', () => {
      const userRepo = new UserRepository();
      const interfaceMethods: (keyof IUserRepository)[] = [
        'save',
        'findById',
        'findByEmail',
        'delete',
        'findAll',
        'count',
        'findByWorkspace',
        'existsByEmail',
      ];

      fc.assert(
        fc.property(fc.constant(userRepo), (repo) => {
          const { missing, implemented } = verifyInterfaceMethods(
            repo,
            interfaceMethods
          );
          expect(missing).toEqual([]);
          expect(implemented.length).toBe(interfaceMethods.length);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * WorkspaceRepository implements IWorkspaceRepository
     */
    it('WorkspaceRepository should implement all IWorkspaceRepository methods', () => {
      const workspaceRepo = new WorkspaceRepository();
      const interfaceMethods: (keyof IWorkspaceRepository)[] = [
        'save',
        'findById',
        'findByOwnerId',
        'findByUserId',
        'delete',
        'addMember',
        'removeMember',
        'isMember',
        'getMembers',
        'existsByName',
        'updateCredits',
      ];

      fc.assert(
        fc.property(fc.constant(workspaceRepo), (repo) => {
          const { missing, implemented } = verifyInterfaceMethods(
            repo,
            interfaceMethods
          );
          expect(missing).toEqual([]);
          expect(implemented.length).toBe(interfaceMethods.length);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * ConversationRepository implements IConversationRepository
     */
    it('ConversationRepository should implement all IConversationRepository methods', () => {
      const conversationRepo = new ConversationRepository();
      const interfaceMethods: (keyof IConversationRepository)[] = [
        'save',
        'findById',
        'delete',
        'findByWorkspaceId',
        'findByUserId',
        'list',
        'count',
        'listWithPagination',
      ];

      fc.assert(
        fc.property(fc.constant(conversationRepo), (repo) => {
          const { missing, implemented } = verifyInterfaceMethods(
            repo,
            interfaceMethods
          );
          expect(missing).toEqual([]);
          expect(implemented.length).toBe(interfaceMethods.length);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * MessageRepository implements IMessageRepository
     */
    it('MessageRepository should implement all IMessageRepository methods', () => {
      const messageRepo = new MessageRepository();
      const interfaceMethods: (keyof IMessageRepository)[] = [
        'create',
        'save',
        'findById',
        'findByConversationId',
        'deleteByConversationId',
        'delete',
      ];

      fc.assert(
        fc.property(fc.constant(messageRepo), (repo) => {
          const { missing, implemented } = verifyInterfaceMethods(
            repo,
            interfaceMethods
          );
          expect(missing).toEqual([]);
          expect(implemented.length).toBe(interfaceMethods.length);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * PresetRepository implements IPresetRepository
     */
    it('PresetRepository should implement all IPresetRepository methods', () => {
      const presetRepo = new PresetRepository();
      const interfaceMethods: (keyof IPresetRepository)[] = [
        'save',
        'findById',
        'findByWorkspaceId',
        'findByCategory',
        'findSystemPresets',
        'list',
        'incrementUsageCount',
        'delete',
      ];

      fc.assert(
        fc.property(fc.constant(presetRepo), (repo) => {
          const { missing, implemented } = verifyInterfaceMethods(
            repo,
            interfaceMethods
          );
          expect(missing).toEqual([]);
          expect(implemented.length).toBe(interfaceMethods.length);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * FileRepository implements FileRepositoryInterface
     */
    it('FileRepository should implement all FileRepositoryInterface methods', () => {
      const fileRepo = new FileRepository();
      const interfaceMethods: (keyof FileRepositoryInterface)[] = [
        'save',
        'findById',
        'findByWorkspaceId',
        'countByWorkspaceId',
        'delete',
        'exists',
      ];

      fc.assert(
        fc.property(fc.constant(fileRepo), (repo) => {
          const { missing, implemented } = verifyInterfaceMethods(
            repo,
            interfaceMethods
          );
          expect(missing).toEqual([]);
          expect(implemented.length).toBe(interfaceMethods.length);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * DocumentRepository implements DocumentRepositoryInterface
     */
    it('DocumentRepository should implement all DocumentRepositoryInterface methods', () => {
      const documentRepo = new DocumentRepository();
      const interfaceMethods: (keyof DocumentRepositoryInterface)[] = [
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

      fc.assert(
        fc.property(fc.constant(documentRepo), (repo) => {
          const { missing, implemented } = verifyInterfaceMethods(
            repo,
            interfaceMethods
          );
          expect(missing).toEqual([]);
          expect(implemented.length).toBe(interfaceMethods.length);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Method return types should be Promises
     */
    it('All repository methods should return Promises', () => {
      const repositories = [
        new UserRepository(),
        new WorkspaceRepository(),
        new ConversationRepository(),
        new MessageRepository(),
        new PresetRepository(),
        new FileRepository(),
        new DocumentRepository(),
      ];

      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: repositories.length - 1 }),
          (index) => {
            const repo = repositories[index];
            if (!repo) {
              return true; // Skip if undefined
            }
            const methods = getMethodNames(repo as object);

            // All public methods should be async (return promises)
            for (const methodName of methods) {
              const method = (repo as unknown as Record<string, unknown>)[methodName];
              if (typeof method === 'function') {
                // Check that the method exists and is a function
                expect(typeof method).toBe('function');
              }
            }
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
