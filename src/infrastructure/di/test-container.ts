/**
 * Test Dependency Injection Container
 * 
 * Container implementation for testing that uses mock repositories.
 * Allows overriding specific bindings for test scenarios.
 * 
 * Requirements: 3.3, 3.5
 */

// Domain Repository Interfaces
import { IUserRepository } from '@/domain/user/repositories/IUserRepository';
import { IWorkspaceRepository } from '@/domain/workspace/repositories/IWorkspaceRepository';
import { DocumentRepositoryInterface } from '@/domain/document/repositories/DocumentRepositoryInterface';
import { FileRepositoryInterface } from '@/domain/file/repositories/FileRepositoryInterface';
import { IConversationRepository } from '@/domain/conversation/repositories/IConversationRepository';
import { IMessageRepository } from '@/domain/conversation/repositories/IMessageRepository';
import { IPresetRepository } from '@/domain/preset/repositories/IPresetRepository';

// Use Cases - User
import { UpdateProfileUseCase } from '@/application/use-cases/user/UpdateProfileUseCase';
import { GetUserUseCase } from '@/application/use-cases/user/GetUserUseCase';
import { UpdateEmailUseCase } from '@/application/use-cases/user/UpdateEmailUseCase';
import { UpdatePasswordUseCase } from '@/application/use-cases/user/UpdatePasswordUseCase';

// Use Cases - Workspace
import { CreateWorkspaceUseCase } from '@/application/use-cases/workspace/CreateWorkspaceUseCase';
import { ListWorkspacesUseCase } from '@/application/use-cases/workspace/ListWorkspacesUseCase';
import { UpdateWorkspaceUseCase } from '@/application/use-cases/workspace/UpdateWorkspaceUseCase';
import { SwitchWorkspaceUseCase } from '@/application/use-cases/workspace/SwitchWorkspaceUseCase';
import { TransferWorkspaceOwnershipUseCase } from '@/application/use-cases/workspace/TransferWorkspaceOwnershipUseCase';

// Use Cases - Document
import { CreateDocumentUseCase } from '@/application/use-cases/document/CreateDocumentUseCase';
import { GetDocumentUseCase } from '@/application/use-cases/document/GetDocumentUseCase';
import { ListDocumentsUseCase } from '@/application/use-cases/document/ListDocumentsUseCase';
import { SearchDocumentsUseCase } from '@/application/use-cases/document/SearchDocumentsUseCase';
import { UpdateDocumentUseCase } from '@/application/use-cases/document/UpdateDocumentUseCase';
import { DeleteDocumentUseCase } from '@/application/use-cases/document/DeleteDocumentUseCase';

// Use Cases - File
import { UploadFileUseCase } from '@/application/use-cases/file/UploadFileUseCase';
import { ListFilesUseCase } from '@/application/use-cases/file/ListFilesUseCase';
import { DeleteFileUseCase } from '@/application/use-cases/file/DeleteFileUseCase';

// Use Cases - Conversation
import { CreateConversationUseCase } from '@/application/use-cases/conversation/CreateConversationUseCase';
import { GetConversationUseCase } from '@/application/use-cases/conversation/GetConversationUseCase';
import { ListConversationsUseCase } from '@/application/use-cases/conversation/ListConversationsUseCase';
import { DeleteConversationUseCase } from '@/application/use-cases/conversation/DeleteConversationUseCase';
import { AddMessageUseCase } from '@/application/use-cases/conversation/AddMessageUseCase';

// Use Cases - Preset
import { CreatePresetUseCase } from '@/application/use-cases/preset/CreatePresetUseCase';
import { GetPresetUseCase } from '@/application/use-cases/preset/GetPresetUseCase';
import { ListPresetsUseCase } from '@/application/use-cases/preset/ListPresetsUseCase';
import { UpdatePresetUseCase } from '@/application/use-cases/preset/UpdatePresetUseCase';
import { DeletePresetUseCase } from '@/application/use-cases/preset/DeletePresetUseCase';

// Storage
import type { FileStorage } from '@/lib/storage';

/**
 * Mock repository factory functions
 * These create mock implementations of repository interfaces for testing
 */

export function createMockUserRepository(): IUserRepository {
  return {
    save: async (user) => user,
    findById: async () => null,
    findByEmail: async () => null,
    delete: async () => {},
    findAll: async () => [],
    count: async () => 0,
    findByWorkspace: async () => [],
    existsByEmail: async () => false,
  };
}

export function createMockWorkspaceRepository(): IWorkspaceRepository {
  return {
    save: async (workspace) => workspace,
    findById: async () => null,
    delete: async () => {},
    findByOwnerId: async () => [],
    findByUserId: async () => [],
    updateCredits: async () => {},
    existsByName: async () => false,
  };
}

export function createMockDocumentRepository(): DocumentRepositoryInterface {
  return {
    save: async (document) => document,
    findById: async () => null,
    delete: async () => {},
    findByWorkspace: async () => [],
    findByUser: async () => [],
    search: async () => [],
  };
}

export function createMockFileRepository(): FileRepositoryInterface {
  return {
    save: async (file) => file,
    findById: async () => null,
    delete: async () => {},
    findByWorkspace: async () => [],
    findByUser: async () => [],
    findUnused: async () => [],
  };
}

export function createMockConversationRepository(): IConversationRepository {
  return {
    save: async (conversation) => conversation,
    findById: async () => null,
    delete: async () => {},
    findByWorkspace: async () => [],
    findByUser: async () => [],
    addMessage: async (conversationId, message) => message,
    getMessages: async () => [],
  };
}

export function createMockMessageRepository(): IMessageRepository {
  return {
    save: async (message) => message,
    findById: async () => null,
    delete: async () => {},
    findByConversation: async () => [],
    deleteByConversation: async () => {},
  };
}

export function createMockPresetRepository(): IPresetRepository {
  return {
    save: async (preset) => preset,
    findById: async () => null,
    delete: async () => {},
    findByWorkspace: async () => [],
    findByUser: async () => [],
  };
}

export function createMockFileStorage(): FileStorage {
  return {
    upload: async () => 'mock-file-path',
    download: async () => Buffer.from(''),
    delete: async () => {},
    getPresignedUrl: async () => 'mock-presigned-url',
  };
}

/**
 * Test Container interface with binding override capabilities
 */
export interface TestContainer {
  // Repositories
  readonly userRepository: IUserRepository;
  readonly workspaceRepository: IWorkspaceRepository;
  readonly documentRepository: DocumentRepositoryInterface;
  readonly fileRepository: FileRepositoryInterface;
  readonly conversationRepository: IConversationRepository;
  readonly messageRepository: IMessageRepository;
  readonly presetRepository: IPresetRepository;

  // Override methods for testing
  setUserRepository(repository: IUserRepository): void;
  setWorkspaceRepository(repository: IWorkspaceRepository): void;
  setDocumentRepository(repository: DocumentRepositoryInterface): void;
  setFileRepository(repository: FileRepositoryInterface): void;
  setConversationRepository(repository: IConversationRepository): void;
  setMessageRepository(repository: IMessageRepository): void;
  setPresetRepository(repository: IPresetRepository): void;
  setFileStorage(storage: FileStorage): void;

  // Reset to default mocks
  reset(): void;

  // User Use Cases
  createUpdateProfileUseCase(): UpdateProfileUseCase;
  createGetUserUseCase(): GetUserUseCase;
  createUpdateEmailUseCase(): UpdateEmailUseCase;
  createUpdatePasswordUseCase(): UpdatePasswordUseCase;

  // Workspace Use Cases
  createCreateWorkspaceUseCase(): CreateWorkspaceUseCase;
  createListWorkspacesUseCase(): ListWorkspacesUseCase;
  createUpdateWorkspaceUseCase(): UpdateWorkspaceUseCase;
  createSwitchWorkspaceUseCase(): SwitchWorkspaceUseCase;
  createTransferWorkspaceOwnershipUseCase(): TransferWorkspaceOwnershipUseCase;

  // Document Use Cases
  createCreateDocumentUseCase(): CreateDocumentUseCase;
  createGetDocumentUseCase(): GetDocumentUseCase;
  createListDocumentsUseCase(): ListDocumentsUseCase;
  createSearchDocumentsUseCase(): SearchDocumentsUseCase;
  createUpdateDocumentUseCase(): UpdateDocumentUseCase;
  createDeleteDocumentUseCase(): DeleteDocumentUseCase;

  // File Use Cases
  createUploadFileUseCase(): UploadFileUseCase;
  createListFilesUseCase(): ListFilesUseCase;
  createDeleteFileUseCase(): DeleteFileUseCase;

  // Conversation Use Cases
  createCreateConversationUseCase(): CreateConversationUseCase;
  createGetConversationUseCase(): GetConversationUseCase;
  createListConversationsUseCase(): ListConversationsUseCase;
  createDeleteConversationUseCase(): DeleteConversationUseCase;
  createAddMessageUseCase(): AddMessageUseCase;

  // Preset Use Cases
  createCreatePresetUseCase(): CreatePresetUseCase;
  createGetPresetUseCase(): GetPresetUseCase;
  createListPresetsUseCase(): ListPresetsUseCase;
  createUpdatePresetUseCase(): UpdatePresetUseCase;
  createDeletePresetUseCase(): DeletePresetUseCase;
}

/**
 * Test Dependency Injection Container Implementation
 * 
 * Container for testing that uses mock repositories by default.
 * Allows overriding specific bindings for custom test scenarios.
 * 
 * Requirements: 3.3, 3.5
 * 
 * @example
 * ```typescript
 * // Create test container
 * const container = new TestDIContainer();
 * 
 * // Override a specific repository
 * const customMock = {
 *   findById: vi.fn().mockResolvedValue(mockUser),
 *   // ... other methods
 * };
 * container.setUserRepository(customMock);
 * 
 * // Create use case with custom mock
 * const useCase = container.createGetUserUseCase();
 * 
 * // Reset to default mocks
 * container.reset();
 * ```
 */
export class TestDIContainer implements TestContainer {
  // Repository instances (mock implementations)
  private _userRepository: IUserRepository;
  private _workspaceRepository: IWorkspaceRepository;
  private _documentRepository: DocumentRepositoryInterface;
  private _fileRepository: FileRepositoryInterface;
  private _conversationRepository: IConversationRepository;
  private _messageRepository: IMessageRepository;
  private _presetRepository: IPresetRepository;
  private _fileStorage: FileStorage;

  /**
   * Initialize container with default mock repositories
   */
  constructor() {
    this._userRepository = createMockUserRepository();
    this._workspaceRepository = createMockWorkspaceRepository();
    this._documentRepository = createMockDocumentRepository();
    this._fileRepository = createMockFileRepository();
    this._conversationRepository = createMockConversationRepository();
    this._messageRepository = createMockMessageRepository();
    this._presetRepository = createMockPresetRepository();
    this._fileStorage = createMockFileStorage();
  }

  // ============================================================================
  // Repository Getters
  // ============================================================================

  public get userRepository(): IUserRepository {
    return this._userRepository;
  }

  public get workspaceRepository(): IWorkspaceRepository {
    return this._workspaceRepository;
  }

  public get documentRepository(): DocumentRepositoryInterface {
    return this._documentRepository;
  }

  public get fileRepository(): FileRepositoryInterface {
    return this._fileRepository;
  }

  public get conversationRepository(): IConversationRepository {
    return this._conversationRepository;
  }

  public get messageRepository(): IMessageRepository {
    return this._messageRepository;
  }

  public get presetRepository(): IPresetRepository {
    return this._presetRepository;
  }

  // ============================================================================
  // Override Methods for Testing
  // ============================================================================

  /**
   * Override the user repository with a custom mock
   * @param repository Custom mock implementation
   */
  public setUserRepository(repository: IUserRepository): void {
    this._userRepository = repository;
  }

  /**
   * Override the workspace repository with a custom mock
   * @param repository Custom mock implementation
   */
  public setWorkspaceRepository(repository: IWorkspaceRepository): void {
    this._workspaceRepository = repository;
  }

  /**
   * Override the document repository with a custom mock
   * @param repository Custom mock implementation
   */
  public setDocumentRepository(repository: DocumentRepositoryInterface): void {
    this._documentRepository = repository;
  }

  /**
   * Override the file repository with a custom mock
   * @param repository Custom mock implementation
   */
  public setFileRepository(repository: FileRepositoryInterface): void {
    this._fileRepository = repository;
  }

  /**
   * Override the conversation repository with a custom mock
   * @param repository Custom mock implementation
   */
  public setConversationRepository(repository: IConversationRepository): void {
    this._conversationRepository = repository;
  }

  /**
   * Override the message repository with a custom mock
   * @param repository Custom mock implementation
   */
  public setMessageRepository(repository: IMessageRepository): void {
    this._messageRepository = repository;
  }

  /**
   * Override the preset repository with a custom mock
   * @param repository Custom mock implementation
   */
  public setPresetRepository(repository: IPresetRepository): void {
    this._presetRepository = repository;
  }

  /**
   * Override the file storage with a custom mock
   * @param storage Custom mock implementation
   */
  public setFileStorage(storage: FileStorage): void {
    this._fileStorage = storage;
  }

  /**
   * Reset all repositories to default mock implementations
   */
  public reset(): void {
    this._userRepository = createMockUserRepository();
    this._workspaceRepository = createMockWorkspaceRepository();
    this._documentRepository = createMockDocumentRepository();
    this._fileRepository = createMockFileRepository();
    this._conversationRepository = createMockConversationRepository();
    this._messageRepository = createMockMessageRepository();
    this._presetRepository = createMockPresetRepository();
    this._fileStorage = createMockFileStorage();
  }

  // ============================================================================
  // User Use Case Factory Methods
  // ============================================================================

  public createUpdateProfileUseCase(): UpdateProfileUseCase {
    return new UpdateProfileUseCase(this._userRepository);
  }

  public createGetUserUseCase(): GetUserUseCase {
    return new GetUserUseCase(this._userRepository);
  }

  public createUpdateEmailUseCase(): UpdateEmailUseCase {
    // Note: UpdateEmailUseCase requires VerificationTokenRepository
    // For testing, we'll need to handle this separately or mock it
    throw new Error('UpdateEmailUseCase requires VerificationTokenRepository - use custom mock');
  }

  public createUpdatePasswordUseCase(): UpdatePasswordUseCase {
    return new UpdatePasswordUseCase(this._userRepository);
  }

  // ============================================================================
  // Workspace Use Case Factory Methods
  // ============================================================================

  public createCreateWorkspaceUseCase(): CreateWorkspaceUseCase {
    return new CreateWorkspaceUseCase(
      this._workspaceRepository,
      this._userRepository
    );
  }

  public createListWorkspacesUseCase(): ListWorkspacesUseCase {
    return new ListWorkspacesUseCase(this._workspaceRepository);
  }

  public createUpdateWorkspaceUseCase(): UpdateWorkspaceUseCase {
    return new UpdateWorkspaceUseCase(this._workspaceRepository);
  }

  public createSwitchWorkspaceUseCase(): SwitchWorkspaceUseCase {
    return new SwitchWorkspaceUseCase(
      this._userRepository,
      this._workspaceRepository
    );
  }

  public createTransferWorkspaceOwnershipUseCase(): TransferWorkspaceOwnershipUseCase {
    return new TransferWorkspaceOwnershipUseCase(
      this._workspaceRepository,
      this._userRepository
    );
  }

  // ============================================================================
  // Document Use Case Factory Methods
  // ============================================================================

  public createCreateDocumentUseCase(): CreateDocumentUseCase {
    return new CreateDocumentUseCase(this._documentRepository);
  }

  public createGetDocumentUseCase(): GetDocumentUseCase {
    return new GetDocumentUseCase(this._documentRepository);
  }

  public createListDocumentsUseCase(): ListDocumentsUseCase {
    return new ListDocumentsUseCase(this._documentRepository);
  }

  public createSearchDocumentsUseCase(): SearchDocumentsUseCase {
    return new SearchDocumentsUseCase(this._documentRepository);
  }

  public createUpdateDocumentUseCase(): UpdateDocumentUseCase {
    return new UpdateDocumentUseCase(this._documentRepository);
  }

  public createDeleteDocumentUseCase(): DeleteDocumentUseCase {
    return new DeleteDocumentUseCase(this._documentRepository);
  }

  // ============================================================================
  // File Use Case Factory Methods
  // ============================================================================

  public createUploadFileUseCase(): UploadFileUseCase {
    return new UploadFileUseCase(this._fileRepository, this._fileStorage);
  }

  public createListFilesUseCase(): ListFilesUseCase {
    return new ListFilesUseCase(this._fileRepository);
  }

  public createDeleteFileUseCase(): DeleteFileUseCase {
    return new DeleteFileUseCase(this._fileRepository, this._fileStorage);
  }

  // ============================================================================
  // Conversation Use Case Factory Methods
  // ============================================================================

  public createCreateConversationUseCase(): CreateConversationUseCase {
    return new CreateConversationUseCase(
      this._conversationRepository,
      this._workspaceRepository,
      this._userRepository
    );
  }

  public createGetConversationUseCase(): GetConversationUseCase {
    return new GetConversationUseCase(
      this._conversationRepository,
      this._messageRepository
    );
  }

  public createListConversationsUseCase(): ListConversationsUseCase {
    return new ListConversationsUseCase(this._conversationRepository);
  }

  public createDeleteConversationUseCase(): DeleteConversationUseCase {
    return new DeleteConversationUseCase(
      this._conversationRepository,
      this._messageRepository
    );
  }

  public createAddMessageUseCase(): AddMessageUseCase {
    return new AddMessageUseCase(
      this._messageRepository,
      this._conversationRepository
    );
  }

  // ============================================================================
  // Preset Use Case Factory Methods
  // ============================================================================

  public createCreatePresetUseCase(): CreatePresetUseCase {
    return new CreatePresetUseCase(
      this._presetRepository,
      this._workspaceRepository
    );
  }

  public createGetPresetUseCase(): GetPresetUseCase {
    return new GetPresetUseCase(this._presetRepository);
  }

  public createListPresetsUseCase(): ListPresetsUseCase {
    return new ListPresetsUseCase(this._presetRepository);
  }

  public createUpdatePresetUseCase(): UpdatePresetUseCase {
    return new UpdatePresetUseCase(this._presetRepository);
  }

  public createDeletePresetUseCase(): DeletePresetUseCase {
    return new DeletePresetUseCase(this._presetRepository);
  }
}

/**
 * Create a new test container instance
 * 
 * @returns A new TestDIContainer instance with default mock repositories
 * 
 * @example
 * ```typescript
 * import { createTestContainer } from '@/infrastructure/di/test-container';
 * 
 * describe('MyUseCase', () => {
 *   let container: TestDIContainer;
 * 
 *   beforeEach(() => {
 *     container = createTestContainer();
 *   });
 * 
 *   it('should work with mocks', async () => {
 *     const useCase = container.createGetUserUseCase();
 *     // ... test logic
 *   });
 * });
 * ```
 */
export function createTestContainer(): TestDIContainer {
  return new TestDIContainer();
}
