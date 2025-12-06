/**
 * Unit Tests for Test DI Container
 *
 * Tests mock repository usage and binding override functionality
 * Requirements: 3.5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  TestDIContainer,
  createTestContainer,
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

describe('Test DI Container', () => {
  let container: TestDIContainer;

  beforeEach(() => {
    container = createTestContainer();
  });

  describe('Mock Repository Creation', () => {
    it('should create mock user repository with all required methods', () => {
      const mockRepo = createMockUserRepository();

      expect(mockRepo).toHaveProperty('save');
      expect(mockRepo).toHaveProperty('findById');
      expect(mockRepo).toHaveProperty('findByEmail');
      expect(mockRepo).toHaveProperty('delete');
      expect(mockRepo).toHaveProperty('findAll');
      expect(mockRepo).toHaveProperty('count');
      expect(mockRepo).toHaveProperty('findByWorkspace');
      expect(mockRepo).toHaveProperty('existsByEmail');
    });

    it('should create mock workspace repository with all required methods', () => {
      const mockRepo = createMockWorkspaceRepository();

      expect(mockRepo).toHaveProperty('save');
      expect(mockRepo).toHaveProperty('findById');
      expect(mockRepo).toHaveProperty('delete');
      expect(mockRepo).toHaveProperty('findByOwnerId');
      expect(mockRepo).toHaveProperty('findByUserId');
      expect(mockRepo).toHaveProperty('updateCredits');
      expect(mockRepo).toHaveProperty('existsByName');
    });

    it('should create mock document repository with all required methods', () => {
      const mockRepo = createMockDocumentRepository();

      expect(mockRepo).toHaveProperty('save');
      expect(mockRepo).toHaveProperty('findById');
      expect(mockRepo).toHaveProperty('delete');
      expect(mockRepo).toHaveProperty('findByWorkspace');
      expect(mockRepo).toHaveProperty('findByUser');
      expect(mockRepo).toHaveProperty('search');
    });

    it('should create mock file repository with all required methods', () => {
      const mockRepo = createMockFileRepository();

      expect(mockRepo).toHaveProperty('save');
      expect(mockRepo).toHaveProperty('findById');
      expect(mockRepo).toHaveProperty('delete');
      expect(mockRepo).toHaveProperty('findByWorkspace');
      expect(mockRepo).toHaveProperty('findByUser');
      expect(mockRepo).toHaveProperty('findUnused');
    });

    it('should create mock conversation repository with all required methods', () => {
      const mockRepo = createMockConversationRepository();

      expect(mockRepo).toHaveProperty('save');
      expect(mockRepo).toHaveProperty('findById');
      expect(mockRepo).toHaveProperty('delete');
      expect(mockRepo).toHaveProperty('findByWorkspace');
      expect(mockRepo).toHaveProperty('findByUser');
      expect(mockRepo).toHaveProperty('addMessage');
      expect(mockRepo).toHaveProperty('getMessages');
    });

    it('should create mock message repository with all required methods', () => {
      const mockRepo = createMockMessageRepository();

      expect(mockRepo).toHaveProperty('save');
      expect(mockRepo).toHaveProperty('findById');
      expect(mockRepo).toHaveProperty('delete');
      expect(mockRepo).toHaveProperty('findByConversation');
      expect(mockRepo).toHaveProperty('deleteByConversation');
    });

    it('should create mock preset repository with all required methods', () => {
      const mockRepo = createMockPresetRepository();

      expect(mockRepo).toHaveProperty('save');
      expect(mockRepo).toHaveProperty('findById');
      expect(mockRepo).toHaveProperty('delete');
      expect(mockRepo).toHaveProperty('findByWorkspace');
      expect(mockRepo).toHaveProperty('findByUser');
    });

    it('should create mock file storage with all required methods', () => {
      const mockStorage = createMockFileStorage();

      expect(mockStorage).toHaveProperty('upload');
      expect(mockStorage).toHaveProperty('download');
      expect(mockStorage).toHaveProperty('delete');
      expect(mockStorage).toHaveProperty('getPresignedUrl');
    });
  });

  describe('Container Initialization', () => {
    it('should initialize with default mock repositories', () => {
      expect(container.userRepository).toBeDefined();
      expect(container.workspaceRepository).toBeDefined();
      expect(container.documentRepository).toBeDefined();
      expect(container.fileRepository).toBeDefined();
      expect(container.conversationRepository).toBeDefined();
      expect(container.messageRepository).toBeDefined();
      expect(container.presetRepository).toBeDefined();
    });

    it('should provide repositories that implement domain interfaces', () => {
      // User repository
      expect(container.userRepository).toHaveProperty('findById');
      expect(container.userRepository).toHaveProperty('save');

      // Workspace repository
      expect(container.workspaceRepository).toHaveProperty('findById');
      expect(container.workspaceRepository).toHaveProperty('save');

      // Document repository
      expect(container.documentRepository).toHaveProperty('findById');
      expect(container.documentRepository).toHaveProperty('save');
    });

    it('should create new container instance via factory function', () => {
      const container1 = createTestContainer();
      const container2 = createTestContainer();

      // Each call should create a new container instance
      expect(container1).not.toBe(container2);
    });
  });

  describe('Repository Getters', () => {
    it('should return the same repository instance on multiple accesses', () => {
      const repo1 = container.userRepository;
      const repo2 = container.userRepository;

      expect(repo1).toBe(repo2);
    });

    it('should maintain repository instances across multiple getter calls', () => {
      const userRepo1 = container.userRepository;
      const workspaceRepo1 = container.workspaceRepository;
      const userRepo2 = container.userRepository;
      const workspaceRepo2 = container.workspaceRepository;

      expect(userRepo1).toBe(userRepo2);
      expect(workspaceRepo1).toBe(workspaceRepo2);
    });
  });

  describe('Binding Override Functionality', () => {
    it('should allow overriding user repository', () => {
      const customMock: IUserRepository = {
        save: vi.fn(),
        findById: vi.fn(),
        findByEmail: vi.fn(),
        delete: vi.fn(),
        findAll: vi.fn(),
        count: vi.fn(),
        findByWorkspace: vi.fn(),
        existsByEmail: vi.fn(),
      };

      container.setUserRepository(customMock);

      expect(container.userRepository).toBe(customMock);
    });

    it('should allow overriding workspace repository', () => {
      const customMock: IWorkspaceRepository = {
        save: vi.fn(),
        findById: vi.fn(),
        delete: vi.fn(),
        findByOwnerId: vi.fn(),
        findByUserId: vi.fn(),
        updateCredits: vi.fn(),
        existsByName: vi.fn(),
      };

      container.setWorkspaceRepository(customMock);

      expect(container.workspaceRepository).toBe(customMock);
    });

    it('should allow overriding document repository', () => {
      const customMock = createMockDocumentRepository();

      container.setDocumentRepository(customMock);

      expect(container.documentRepository).toBe(customMock);
    });

    it('should allow overriding file repository', () => {
      const customMock = createMockFileRepository();

      container.setFileRepository(customMock);

      expect(container.fileRepository).toBe(customMock);
    });

    it('should allow overriding conversation repository', () => {
      const customMock = createMockConversationRepository();

      container.setConversationRepository(customMock);

      expect(container.conversationRepository).toBe(customMock);
    });

    it('should allow overriding message repository', () => {
      const customMock = createMockMessageRepository();

      container.setMessageRepository(customMock);

      expect(container.messageRepository).toBe(customMock);
    });

    it('should allow overriding preset repository', () => {
      const customMock = createMockPresetRepository();

      container.setPresetRepository(customMock);

      expect(container.presetRepository).toBe(customMock);
    });

    it('should allow overriding file storage', () => {
      const customMock = createMockFileStorage();

      container.setFileStorage(customMock);

      // Note: fileStorage is private, so we verify by creating a use case
      const useCase = container.createUploadFileUseCase();
      expect(useCase).toBeDefined();
    });

    it('should use overridden repository in subsequently created use cases', () => {
      const customMock: IUserRepository = {
        save: vi.fn(),
        findById: vi.fn().mockResolvedValue({ id: 'test-user' }),
        findByEmail: vi.fn(),
        delete: vi.fn(),
        findAll: vi.fn(),
        count: vi.fn(),
        findByWorkspace: vi.fn(),
        existsByEmail: vi.fn(),
      };

      container.setUserRepository(customMock);

      // Create use case after override
      const useCase = container.createGetUserUseCase();

      expect(useCase).toBeDefined();
      expect(container.userRepository).toBe(customMock);
    });

    it('should allow multiple overrides on the same repository', () => {
      const mock1 = createMockUserRepository();
      const mock2 = createMockUserRepository();
      const mock3 = createMockUserRepository();

      container.setUserRepository(mock1);
      expect(container.userRepository).toBe(mock1);

      container.setUserRepository(mock2);
      expect(container.userRepository).toBe(mock2);

      container.setUserRepository(mock3);
      expect(container.userRepository).toBe(mock3);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset all repositories to default mocks', () => {
      const originalUserRepo = container.userRepository;
      const originalWorkspaceRepo = container.workspaceRepository;

      // Override repositories
      container.setUserRepository(createMockUserRepository());
      container.setWorkspaceRepository(createMockWorkspaceRepository());

      // Reset
      container.reset();

      // Should have new instances (not the originals, not the overrides)
      expect(container.userRepository).not.toBe(originalUserRepo);
      expect(container.workspaceRepository).not.toBe(originalWorkspaceRepo);
    });

    it('should reset user repository after override', () => {
      const customMock = createMockUserRepository();
      container.setUserRepository(customMock);

      expect(container.userRepository).toBe(customMock);

      container.reset();

      expect(container.userRepository).not.toBe(customMock);
      expect(container.userRepository).toBeDefined();
    });

    it('should reset workspace repository after override', () => {
      const customMock = createMockWorkspaceRepository();
      container.setWorkspaceRepository(customMock);

      expect(container.workspaceRepository).toBe(customMock);

      container.reset();

      expect(container.workspaceRepository).not.toBe(customMock);
      expect(container.workspaceRepository).toBeDefined();
    });

    it('should reset all repositories at once', () => {
      // Override multiple repositories
      container.setUserRepository(createMockUserRepository());
      container.setWorkspaceRepository(createMockWorkspaceRepository());
      container.setDocumentRepository(createMockDocumentRepository());

      const userRepoBeforeReset = container.userRepository;
      const workspaceRepoBeforeReset = container.workspaceRepository;
      const documentRepoBeforeReset = container.documentRepository;

      container.reset();

      // All should be new instances
      expect(container.userRepository).not.toBe(userRepoBeforeReset);
      expect(container.workspaceRepository).not.toBe(workspaceRepoBeforeReset);
      expect(container.documentRepository).not.toBe(documentRepoBeforeReset);
    });

    it('should maintain repository interface compliance after reset', () => {
      container.reset();

      expect(container.userRepository).toHaveProperty('findById');
      expect(container.userRepository).toHaveProperty('save');
      expect(container.workspaceRepository).toHaveProperty('findById');
      expect(container.workspaceRepository).toHaveProperty('save');
    });
  });

  describe('Use Case Factory Methods', () => {
    it('should create UpdateProfileUseCase with mock dependencies', () => {
      const useCase = container.createUpdateProfileUseCase();

      expect(useCase).toBeDefined();
      expect(useCase.constructor.name).toBe('UpdateProfileUseCase');
    });

    it('should create GetUserUseCase with mock dependencies', () => {
      const useCase = container.createGetUserUseCase();

      expect(useCase).toBeDefined();
      expect(useCase.constructor.name).toBe('GetUserUseCase');
    });

    it('should create UpdatePasswordUseCase with mock dependencies', () => {
      const useCase = container.createUpdatePasswordUseCase();

      expect(useCase).toBeDefined();
      expect(useCase.constructor.name).toBe('UpdatePasswordUseCase');
    });

    it('should create CreateWorkspaceUseCase with mock dependencies', () => {
      const useCase = container.createCreateWorkspaceUseCase();

      expect(useCase).toBeDefined();
      expect(useCase.constructor.name).toBe('CreateWorkspaceUseCase');
    });

    it('should create ListWorkspacesUseCase with mock dependencies', () => {
      const useCase = container.createListWorkspacesUseCase();

      expect(useCase).toBeDefined();
      expect(useCase.constructor.name).toBe('ListWorkspacesUseCase');
    });

    it('should create document use cases with mock dependencies', () => {
      const createUseCase = container.createCreateDocumentUseCase();
      const getUseCase = container.createGetDocumentUseCase();
      const listUseCase = container.createListDocumentsUseCase();

      expect(createUseCase).toBeDefined();
      expect(getUseCase).toBeDefined();
      expect(listUseCase).toBeDefined();
    });

    it('should create file use cases with mock dependencies', () => {
      const uploadUseCase = container.createUploadFileUseCase();
      const listUseCase = container.createListFilesUseCase();
      const deleteUseCase = container.createDeleteFileUseCase();

      expect(uploadUseCase).toBeDefined();
      expect(listUseCase).toBeDefined();
      expect(deleteUseCase).toBeDefined();
    });

    it('should create conversation use cases with mock dependencies', () => {
      const createUseCase = container.createCreateConversationUseCase();
      const getUseCase = container.createGetConversationUseCase();
      const listUseCase = container.createListConversationsUseCase();

      expect(createUseCase).toBeDefined();
      expect(getUseCase).toBeDefined();
      expect(listUseCase).toBeDefined();
    });

    it('should create preset use cases with mock dependencies', () => {
      const createUseCase = container.createCreatePresetUseCase();
      const getUseCase = container.createGetPresetUseCase();
      const listUseCase = container.createListPresetsUseCase();

      expect(createUseCase).toBeDefined();
      expect(getUseCase).toBeDefined();
      expect(listUseCase).toBeDefined();
    });

    it('should create new use case instances on each call', () => {
      const useCase1 = container.createGetUserUseCase();
      const useCase2 = container.createGetUserUseCase();

      expect(useCase1).not.toBe(useCase2);
    });

    it('should throw error for UpdateEmailUseCase (requires additional dependencies)', () => {
      expect(() => container.createUpdateEmailUseCase()).toThrow(
        'UpdateEmailUseCase requires VerificationTokenRepository'
      );
    });
  });

  describe('Use Case with Custom Mocks', () => {
    it('should use custom mock in created use cases', () => {
      const customMock: IUserRepository = {
        save: vi.fn(),
        findById: vi.fn().mockResolvedValue({ id: 'custom-user' }),
        findByEmail: vi.fn(),
        delete: vi.fn(),
        findAll: vi.fn(),
        count: vi.fn(),
        findByWorkspace: vi.fn(),
        existsByEmail: vi.fn(),
      };

      container.setUserRepository(customMock);

      const useCase = container.createGetUserUseCase();

      expect(useCase).toBeDefined();
      // Verify the custom mock is being used
      expect(container.userRepository).toBe(customMock);
    });

    it('should allow testing with custom mock behavior', async () => {
      const mockUser = { id: 'test-123', email: 'test@example.com' };

      const customMock: IUserRepository = {
        save: vi.fn().mockResolvedValue(mockUser),
        findById: vi.fn().mockResolvedValue(mockUser),
        findByEmail: vi.fn().mockResolvedValue(mockUser),
        delete: vi.fn(),
        findAll: vi.fn().mockResolvedValue([mockUser]),
        count: vi.fn().mockResolvedValue(1),
        findByWorkspace: vi.fn().mockResolvedValue([mockUser]),
        existsByEmail: vi.fn().mockResolvedValue(true),
      };

      container.setUserRepository(customMock);

      // Test that the mock is working
      const result = await container.userRepository.findById('test-123' as any);
      expect(result).toEqual(mockUser);
      expect(customMock.findById).toHaveBeenCalledWith('test-123');
    });

    it('should allow overriding multiple repositories for complex use cases', () => {
      const customUserMock = createMockUserRepository();
      const customWorkspaceMock = createMockWorkspaceRepository();

      container.setUserRepository(customUserMock);
      container.setWorkspaceRepository(customWorkspaceMock);

      const useCase = container.createCreateWorkspaceUseCase();

      expect(useCase).toBeDefined();
      expect(container.userRepository).toBe(customUserMock);
      expect(container.workspaceRepository).toBe(customWorkspaceMock);
    });
  });

  describe('Integration with Testing Workflow', () => {
    it('should support typical test setup pattern', () => {
      // Typical test setup
      const mockUser = { id: 'user-1', email: 'test@example.com' };

      const customMock: IUserRepository = {
        save: vi.fn(),
        findById: vi.fn().mockResolvedValue(mockUser),
        findByEmail: vi.fn(),
        delete: vi.fn(),
        findAll: vi.fn(),
        count: vi.fn(),
        findByWorkspace: vi.fn(),
        existsByEmail: vi.fn(),
      };

      container.setUserRepository(customMock);

      const useCase = container.createGetUserUseCase();

      expect(useCase).toBeDefined();
      expect(customMock.findById).toBeDefined();
    });

    it('should support test isolation through reset', () => {
      // Test 1: Override repository
      const mock1 = createMockUserRepository();
      container.setUserRepository(mock1);
      expect(container.userRepository).toBe(mock1);

      // Reset for test isolation
      container.reset();

      // Test 2: Should have fresh mocks
      const mock2 = createMockUserRepository();
      container.setUserRepository(mock2);
      expect(container.userRepository).toBe(mock2);
      expect(container.userRepository).not.toBe(mock1);
    });

    it('should support beforeEach pattern for test isolation', () => {
      // Simulate beforeEach
      const freshContainer = createTestContainer();

      expect(freshContainer.userRepository).toBeDefined();
      expect(freshContainer.workspaceRepository).toBeDefined();

      // Each test gets a fresh container
      const anotherContainer = createTestContainer();
      expect(anotherContainer).not.toBe(freshContainer);
    });
  });

  describe('Mock Repository Behavior', () => {
    it('should have mock methods that return default values', async () => {
      const result = await container.userRepository.findById('any-id' as any);
      expect(result).toBeNull();
    });

    it('should have mock save method that returns the input', async () => {
      const mockUser = { id: 'test' } as any;
      const result = await container.userRepository.save(mockUser);
      expect(result).toBe(mockUser);
    });

    it('should have mock findAll that returns empty array', async () => {
      const result = await container.userRepository.findAll();
      expect(result).toEqual([]);
    });

    it('should have mock count that returns zero', async () => {
      const result = await container.userRepository.count();
      expect(result).toBe(0);
    });

    it('should have mock existsByEmail that returns false', async () => {
      const result = await container.userRepository.existsByEmail(
        'test@example.com' as any
      );
      expect(result).toBe(false);
    });
  });
});
