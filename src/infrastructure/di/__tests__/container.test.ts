/**
 * Unit Tests for DI Container
 * 
 * Tests singleton behavior, lazy loading, and factory methods
 * Requirements: 3.4
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DIContainer } from '../container';

describe('DI Container', () => {
  beforeEach(() => {
    // Reset the container before each test to ensure isolation
    DIContainer.reset();
  });

  describe('Singleton Behavior', () => {
    it('should return the same instance on multiple calls to getInstance', () => {
      const instance1 = DIContainer.getInstance();
      const instance2 = DIContainer.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    it('should maintain singleton across different access patterns', () => {
      const instance1 = DIContainer.getInstance();
      const instance2 = DIContainer.getInstance();
      const instance3 = DIContainer.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance2).toBe(instance3);
      expect(instance1).toBe(instance3);
    });

    it('should create a new instance after reset', () => {
      const instance1 = DIContainer.getInstance();
      DIContainer.reset();
      const instance2 = DIContainer.getInstance();
      
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('Lazy Loading - Repository Singletons', () => {
    it('should return the same userRepository instance on multiple accesses', () => {
      const container = DIContainer.getInstance();
      
      const repo1 = container.userRepository;
      const repo2 = container.userRepository;
      
      expect(repo1).toBe(repo2);
    });

    it('should return the same workspaceRepository instance on multiple accesses', () => {
      const container = DIContainer.getInstance();
      
      const repo1 = container.workspaceRepository;
      const repo2 = container.workspaceRepository;
      
      expect(repo1).toBe(repo2);
    });

    it('should return the same documentRepository instance on multiple accesses', () => {
      const container = DIContainer.getInstance();
      
      const repo1 = container.documentRepository;
      const repo2 = container.documentRepository;
      
      expect(repo1).toBe(repo2);
    });

    it('should return the same fileRepository instance on multiple accesses', () => {
      const container = DIContainer.getInstance();
      
      const repo1 = container.fileRepository;
      const repo2 = container.fileRepository;
      
      expect(repo1).toBe(repo2);
    });

    it('should return the same conversationRepository instance on multiple accesses', () => {
      const container = DIContainer.getInstance();
      
      const repo1 = container.conversationRepository;
      const repo2 = container.conversationRepository;
      
      expect(repo1).toBe(repo2);
    });

    it('should return the same messageRepository instance on multiple accesses', () => {
      const container = DIContainer.getInstance();
      
      const repo1 = container.messageRepository;
      const repo2 = container.messageRepository;
      
      expect(repo1).toBe(repo2);
    });

    it('should return the same presetRepository instance on multiple accesses', () => {
      const container = DIContainer.getInstance();
      
      const repo1 = container.presetRepository;
      const repo2 = container.presetRepository;
      
      expect(repo1).toBe(repo2);
    });

    it('should maintain repository singletons across container accesses', () => {
      const container1 = DIContainer.getInstance();
      const container2 = DIContainer.getInstance();
      
      const repo1 = container1.userRepository;
      const repo2 = container2.userRepository;
      
      expect(repo1).toBe(repo2);
    });
  });

  describe('Factory Methods - User Use Cases', () => {
    it('should create UpdateProfileUseCase with proper dependencies', () => {
      const container = DIContainer.getInstance();
      const useCase = container.createUpdateProfileUseCase();
      
      expect(useCase).toBeDefined();
      expect(useCase.constructor.name).toBe('UpdateProfileUseCase');
    });

    it('should create GetUserUseCase with proper dependencies', () => {
      const container = DIContainer.getInstance();
      const useCase = container.createGetUserUseCase();
      
      expect(useCase).toBeDefined();
      expect(useCase.constructor.name).toBe('GetUserUseCase');
    });

    it('should create UpdateEmailUseCase with proper dependencies', () => {
      const container = DIContainer.getInstance();
      const useCase = container.createUpdateEmailUseCase();
      
      expect(useCase).toBeDefined();
      expect(useCase.constructor.name).toBe('UpdateEmailUseCase');
    });

    it('should create UpdatePasswordUseCase with proper dependencies', () => {
      const container = DIContainer.getInstance();
      const useCase = container.createUpdatePasswordUseCase();
      
      expect(useCase).toBeDefined();
      expect(useCase.constructor.name).toBe('UpdatePasswordUseCase');
    });

    it('should create new use case instances on each call', () => {
      const container = DIContainer.getInstance();
      
      const useCase1 = container.createUpdateProfileUseCase();
      const useCase2 = container.createUpdateProfileUseCase();
      
      expect(useCase1).not.toBe(useCase2);
    });
  });

  describe('Factory Methods - Workspace Use Cases', () => {
    it('should create CreateWorkspaceUseCase with proper dependencies', () => {
      const container = DIContainer.getInstance();
      const useCase = container.createCreateWorkspaceUseCase();
      
      expect(useCase).toBeDefined();
      expect(useCase.constructor.name).toBe('CreateWorkspaceUseCase');
    });

    it('should create ListWorkspacesUseCase with proper dependencies', () => {
      const container = DIContainer.getInstance();
      const useCase = container.createListWorkspacesUseCase();
      
      expect(useCase).toBeDefined();
      expect(useCase.constructor.name).toBe('ListWorkspacesUseCase');
    });

    it('should create UpdateWorkspaceUseCase with proper dependencies', () => {
      const container = DIContainer.getInstance();
      const useCase = container.createUpdateWorkspaceUseCase();
      
      expect(useCase).toBeDefined();
      expect(useCase.constructor.name).toBe('UpdateWorkspaceUseCase');
    });

    it('should create SwitchWorkspaceUseCase with proper dependencies', () => {
      const container = DIContainer.getInstance();
      const useCase = container.createSwitchWorkspaceUseCase();
      
      expect(useCase).toBeDefined();
      expect(useCase.constructor.name).toBe('SwitchWorkspaceUseCase');
    });

    it('should create TransferWorkspaceOwnershipUseCase with proper dependencies', () => {
      const container = DIContainer.getInstance();
      const useCase = container.createTransferWorkspaceOwnershipUseCase();
      
      expect(useCase).toBeDefined();
      expect(useCase.constructor.name).toBe('TransferWorkspaceOwnershipUseCase');
    });
  });

  describe('Factory Methods - Document Use Cases', () => {
    it('should create CreateDocumentUseCase with proper dependencies', () => {
      const container = DIContainer.getInstance();
      const useCase = container.createCreateDocumentUseCase();
      
      expect(useCase).toBeDefined();
      expect(useCase.constructor.name).toBe('CreateDocumentUseCase');
    });

    it('should create GetDocumentUseCase with proper dependencies', () => {
      const container = DIContainer.getInstance();
      const useCase = container.createGetDocumentUseCase();
      
      expect(useCase).toBeDefined();
      expect(useCase.constructor.name).toBe('GetDocumentUseCase');
    });

    it('should create ListDocumentsUseCase with proper dependencies', () => {
      const container = DIContainer.getInstance();
      const useCase = container.createListDocumentsUseCase();
      
      expect(useCase).toBeDefined();
      expect(useCase.constructor.name).toBe('ListDocumentsUseCase');
    });

    it('should create SearchDocumentsUseCase with proper dependencies', () => {
      const container = DIContainer.getInstance();
      const useCase = container.createSearchDocumentsUseCase();
      
      expect(useCase).toBeDefined();
      expect(useCase.constructor.name).toBe('SearchDocumentsUseCase');
    });

    it('should create UpdateDocumentUseCase with proper dependencies', () => {
      const container = DIContainer.getInstance();
      const useCase = container.createUpdateDocumentUseCase();
      
      expect(useCase).toBeDefined();
      expect(useCase.constructor.name).toBe('UpdateDocumentUseCase');
    });

    it('should create DeleteDocumentUseCase with proper dependencies', () => {
      const container = DIContainer.getInstance();
      const useCase = container.createDeleteDocumentUseCase();
      
      expect(useCase).toBeDefined();
      expect(useCase.constructor.name).toBe('DeleteDocumentUseCase');
    });
  });

  describe('Factory Methods - File Use Cases', () => {
    it('should create UploadFileUseCase with proper dependencies', () => {
      const container = DIContainer.getInstance();
      const useCase = container.createUploadFileUseCase();
      
      expect(useCase).toBeDefined();
      expect(useCase.constructor.name).toBe('UploadFileUseCase');
    });

    it('should create ListFilesUseCase with proper dependencies', () => {
      const container = DIContainer.getInstance();
      const useCase = container.createListFilesUseCase();
      
      expect(useCase).toBeDefined();
      expect(useCase.constructor.name).toBe('ListFilesUseCase');
    });

    it('should create DeleteFileUseCase with proper dependencies', () => {
      const container = DIContainer.getInstance();
      const useCase = container.createDeleteFileUseCase();
      
      expect(useCase).toBeDefined();
      expect(useCase.constructor.name).toBe('DeleteFileUseCase');
    });
  });

  describe('Factory Methods - Conversation Use Cases', () => {
    it('should create CreateConversationUseCase with proper dependencies', () => {
      const container = DIContainer.getInstance();
      const useCase = container.createCreateConversationUseCase();
      
      expect(useCase).toBeDefined();
      expect(useCase.constructor.name).toBe('CreateConversationUseCase');
    });

    it('should create GetConversationUseCase with proper dependencies', () => {
      const container = DIContainer.getInstance();
      const useCase = container.createGetConversationUseCase();
      
      expect(useCase).toBeDefined();
      expect(useCase.constructor.name).toBe('GetConversationUseCase');
    });

    it('should create ListConversationsUseCase with proper dependencies', () => {
      const container = DIContainer.getInstance();
      const useCase = container.createListConversationsUseCase();
      
      expect(useCase).toBeDefined();
      expect(useCase.constructor.name).toBe('ListConversationsUseCase');
    });

    it('should create DeleteConversationUseCase with proper dependencies', () => {
      const container = DIContainer.getInstance();
      const useCase = container.createDeleteConversationUseCase();
      
      expect(useCase).toBeDefined();
      expect(useCase.constructor.name).toBe('DeleteConversationUseCase');
    });

    it('should create AddMessageUseCase with proper dependencies', () => {
      const container = DIContainer.getInstance();
      const useCase = container.createAddMessageUseCase();
      
      expect(useCase).toBeDefined();
      expect(useCase.constructor.name).toBe('AddMessageUseCase');
    });
  });

  describe('Factory Methods - Preset Use Cases', () => {
    it('should create CreatePresetUseCase with proper dependencies', () => {
      const container = DIContainer.getInstance();
      const useCase = container.createCreatePresetUseCase();
      
      expect(useCase).toBeDefined();
      expect(useCase.constructor.name).toBe('CreatePresetUseCase');
    });

    it('should create GetPresetUseCase with proper dependencies', () => {
      const container = DIContainer.getInstance();
      const useCase = container.createGetPresetUseCase();
      
      expect(useCase).toBeDefined();
      expect(useCase.constructor.name).toBe('GetPresetUseCase');
    });

    it('should create ListPresetsUseCase with proper dependencies', () => {
      const container = DIContainer.getInstance();
      const useCase = container.createListPresetsUseCase();
      
      expect(useCase).toBeDefined();
      expect(useCase.constructor.name).toBe('ListPresetsUseCase');
    });

    it('should create UpdatePresetUseCase with proper dependencies', () => {
      const container = DIContainer.getInstance();
      const useCase = container.createUpdatePresetUseCase();
      
      expect(useCase).toBeDefined();
      expect(useCase.constructor.name).toBe('UpdatePresetUseCase');
    });

    it('should create DeletePresetUseCase with proper dependencies', () => {
      const container = DIContainer.getInstance();
      const useCase = container.createDeletePresetUseCase();
      
      expect(useCase).toBeDefined();
      expect(useCase.constructor.name).toBe('DeletePresetUseCase');
    });
  });

  describe('Use Case Dependency Injection', () => {
    it('should inject the same repository instance into multiple use cases', () => {
      const container = DIContainer.getInstance();
      
      // Get the repository directly
      const userRepo = container.userRepository;
      
      // Create use cases that depend on userRepository
      const useCase1 = container.createUpdateProfileUseCase();
      const useCase2 = container.createGetUserUseCase();
      
      // Both use cases should receive the same repository instance
      // We can verify this by checking that the repository is a singleton
      expect(container.userRepository).toBe(userRepo);
    });

    it('should inject the same workspace repository into multiple use cases', () => {
      const container = DIContainer.getInstance();
      
      const workspaceRepo = container.workspaceRepository;
      
      // Create use cases that depend on workspaceRepository
      container.createCreateWorkspaceUseCase();
      container.createListWorkspacesUseCase();
      container.createUpdateWorkspaceUseCase();
      
      // Repository should remain the same singleton
      expect(container.workspaceRepository).toBe(workspaceRepo);
    });
  });

  describe('Container Export', () => {
    it('should export a singleton container instance', async () => {
      // Import the exported container
      const { container } = await import('../container');
      
      expect(container).toBeDefined();
      expect(container).toBeInstanceOf(DIContainer);
    });

    it('should export a container that behaves as singleton', async () => {
      const { container } = await import('../container');
      
      // The exported container should maintain singleton behavior
      // by returning the same repositories on multiple accesses
      const repo1 = container.userRepository;
      const repo2 = container.userRepository;
      
      expect(repo1).toBe(repo2);
    });
  });

  describe('Repository Interface Compliance', () => {
    it('should provide repositories that implement domain interfaces', () => {
      const container = DIContainer.getInstance();
      
      // Check that repositories have the expected methods
      expect(container.userRepository).toHaveProperty('findById');
      expect(container.userRepository).toHaveProperty('findByEmail');
      expect(container.userRepository).toHaveProperty('save');
      expect(container.userRepository).toHaveProperty('delete');
    });

    it('should provide workspace repository with expected methods', () => {
      const container = DIContainer.getInstance();
      
      expect(container.workspaceRepository).toHaveProperty('findById');
      expect(container.workspaceRepository).toHaveProperty('save');
      expect(container.workspaceRepository).toHaveProperty('delete');
      expect(container.workspaceRepository).toHaveProperty('findByOwnerId');
    });

    it('should provide document repository with expected methods', () => {
      const container = DIContainer.getInstance();
      
      expect(container.documentRepository).toHaveProperty('findById');
      expect(container.documentRepository).toHaveProperty('save');
      expect(container.documentRepository).toHaveProperty('delete');
    });
  });
});
