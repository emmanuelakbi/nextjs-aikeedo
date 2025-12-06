/**
 * Dependency Injection Container
 *
 * Centralized container for managing dependencies and creating use cases.
 * Implements singleton pattern with lazy loading for optimal performance.
 *
 * Requirements: 3.1, 3.2, 3.4
 */

// Domain Repository Interfaces
import { IUserRepository } from '@/domain/user/repositories/IUserRepository';
import { IWorkspaceRepository } from '@/domain/workspace/repositories/IWorkspaceRepository';
import { DocumentRepositoryInterface } from '@/domain/document/repositories/DocumentRepositoryInterface';
import { FileRepositoryInterface } from '@/domain/file/repositories/FileRepositoryInterface';
import { IConversationRepository } from '@/domain/conversation/repositories/IConversationRepository';
import { IMessageRepository } from '@/domain/conversation/repositories/IMessageRepository';
import { IPresetRepository } from '@/domain/preset/repositories/IPresetRepository';

// Concrete Repository Implementations
import { UserRepository } from '../repositories/UserRepository';
import { WorkspaceRepository } from '../repositories/WorkspaceRepository';
import { DocumentRepository } from '../repositories/DocumentRepository';
import { FileRepository } from '../repositories/FileRepository';
import { ConversationRepository } from '../repositories/ConversationRepository';
import { MessageRepository } from '../repositories/MessageRepository';
import { PresetRepository } from '../repositories/PresetRepository';
import { VerificationTokenRepository } from '../repositories/VerificationTokenRepository';

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
import { getFileStorage } from '@/lib/storage';

/**
 * Container interface defining all available dependencies
 */
export interface Container {
  // Repositories
  readonly userRepository: IUserRepository;
  readonly workspaceRepository: IWorkspaceRepository;
  readonly documentRepository: DocumentRepositoryInterface;
  readonly fileRepository: FileRepositoryInterface;
  readonly conversationRepository: IConversationRepository;
  readonly messageRepository: IMessageRepository;
  readonly presetRepository: IPresetRepository;

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
 * Dependency Injection Container Implementation
 *
 * Singleton container that manages all application dependencies.
 * Uses lazy loading to instantiate repositories only when needed.
 *
 * Requirements: 3.1, 3.2, 3.4
 */
export class DIContainer implements Container {
  private static instance: DIContainer;

  // Repository instances (lazy-loaded singletons)
  private _userRepository?: IUserRepository;
  private _workspaceRepository?: IWorkspaceRepository;
  private _documentRepository?: DocumentRepositoryInterface;
  private _fileRepository?: FileRepositoryInterface;
  private _conversationRepository?: IConversationRepository;
  private _messageRepository?: IMessageRepository;
  private _presetRepository?: IPresetRepository;
  private _verificationTokenRepository?: VerificationTokenRepository;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}

  /**
   * Get the singleton instance of the container
   *
   * @returns The singleton DIContainer instance
   */
  public static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  /**
   * Reset the container instance (useful for testing)
   */
  public static reset(): void {
    DIContainer.instance = new DIContainer();
  }

  // ============================================================================
  // Repository Getters (Lazy-loaded Singletons)
  // ============================================================================

  public get userRepository(): IUserRepository {
    if (!this._userRepository) {
      this._userRepository = new UserRepository();
    }
    return this._userRepository;
  }

  public get workspaceRepository(): IWorkspaceRepository {
    if (!this._workspaceRepository) {
      this._workspaceRepository = new WorkspaceRepository();
    }
    return this._workspaceRepository;
  }

  public get documentRepository(): DocumentRepositoryInterface {
    if (!this._documentRepository) {
      this._documentRepository = new DocumentRepository();
    }
    return this._documentRepository;
  }

  public get fileRepository(): FileRepositoryInterface {
    if (!this._fileRepository) {
      this._fileRepository = new FileRepository();
    }
    return this._fileRepository;
  }

  public get conversationRepository(): IConversationRepository {
    if (!this._conversationRepository) {
      this._conversationRepository = new ConversationRepository();
    }
    return this._conversationRepository;
  }

  public get messageRepository(): IMessageRepository {
    if (!this._messageRepository) {
      this._messageRepository = new MessageRepository();
    }
    return this._messageRepository;
  }

  public get presetRepository(): IPresetRepository {
    if (!this._presetRepository) {
      this._presetRepository = new PresetRepository();
    }
    return this._presetRepository;
  }

  public get verificationTokenRepository(): VerificationTokenRepository {
    if (!this._verificationTokenRepository) {
      this._verificationTokenRepository = new VerificationTokenRepository();
    }
    return this._verificationTokenRepository;
  }

  // ============================================================================
  // User Use Case Factory Methods
  // ============================================================================

  public createUpdateProfileUseCase(): UpdateProfileUseCase {
    return new UpdateProfileUseCase(this.userRepository);
  }

  public createGetUserUseCase(): GetUserUseCase {
    return new GetUserUseCase(this.userRepository);
  }

  public createUpdateEmailUseCase(): UpdateEmailUseCase {
    return new UpdateEmailUseCase(
      this.userRepository,
      this.verificationTokenRepository
    );
  }

  public createUpdatePasswordUseCase(): UpdatePasswordUseCase {
    return new UpdatePasswordUseCase(this.userRepository);
  }

  // ============================================================================
  // Workspace Use Case Factory Methods
  // ============================================================================

  public createCreateWorkspaceUseCase(): CreateWorkspaceUseCase {
    return new CreateWorkspaceUseCase(
      this.workspaceRepository,
      this.userRepository
    );
  }

  public createListWorkspacesUseCase(): ListWorkspacesUseCase {
    return new ListWorkspacesUseCase(this.workspaceRepository);
  }

  public createUpdateWorkspaceUseCase(): UpdateWorkspaceUseCase {
    return new UpdateWorkspaceUseCase(this.workspaceRepository);
  }

  public createSwitchWorkspaceUseCase(): SwitchWorkspaceUseCase {
    return new SwitchWorkspaceUseCase(
      this.userRepository,
      this.workspaceRepository
    );
  }

  public createTransferWorkspaceOwnershipUseCase(): TransferWorkspaceOwnershipUseCase {
    return new TransferWorkspaceOwnershipUseCase(
      this.workspaceRepository,
      this.userRepository
    );
  }

  // ============================================================================
  // Document Use Case Factory Methods
  // ============================================================================

  public createCreateDocumentUseCase(): CreateDocumentUseCase {
    return new CreateDocumentUseCase(this.documentRepository);
  }

  public createGetDocumentUseCase(): GetDocumentUseCase {
    return new GetDocumentUseCase(this.documentRepository);
  }

  public createListDocumentsUseCase(): ListDocumentsUseCase {
    return new ListDocumentsUseCase(this.documentRepository);
  }

  public createSearchDocumentsUseCase(): SearchDocumentsUseCase {
    return new SearchDocumentsUseCase(this.documentRepository);
  }

  public createUpdateDocumentUseCase(): UpdateDocumentUseCase {
    return new UpdateDocumentUseCase(this.documentRepository);
  }

  public createDeleteDocumentUseCase(): DeleteDocumentUseCase {
    return new DeleteDocumentUseCase(this.documentRepository);
  }

  // ============================================================================
  // File Use Case Factory Methods
  // ============================================================================

  public createUploadFileUseCase(): UploadFileUseCase {
    const storage = getFileStorage();
    return new UploadFileUseCase(this.fileRepository, storage);
  }

  public createListFilesUseCase(): ListFilesUseCase {
    return new ListFilesUseCase(this.fileRepository);
  }

  public createDeleteFileUseCase(): DeleteFileUseCase {
    const storage = getFileStorage();
    return new DeleteFileUseCase(this.fileRepository, storage);
  }

  // ============================================================================
  // Conversation Use Case Factory Methods
  // ============================================================================

  public createCreateConversationUseCase(): CreateConversationUseCase {
    return new CreateConversationUseCase(
      this.conversationRepository,
      this.workspaceRepository,
      this.userRepository
    );
  }

  public createGetConversationUseCase(): GetConversationUseCase {
    return new GetConversationUseCase(
      this.conversationRepository,
      this.messageRepository
    );
  }

  public createListConversationsUseCase(): ListConversationsUseCase {
    return new ListConversationsUseCase(this.conversationRepository);
  }

  public createDeleteConversationUseCase(): DeleteConversationUseCase {
    return new DeleteConversationUseCase(
      this.conversationRepository,
      this.messageRepository
    );
  }

  public createAddMessageUseCase(): AddMessageUseCase {
    return new AddMessageUseCase(
      this.messageRepository,
      this.conversationRepository
    );
  }

  // ============================================================================
  // Preset Use Case Factory Methods
  // ============================================================================

  public createCreatePresetUseCase(): CreatePresetUseCase {
    return new CreatePresetUseCase(
      this.presetRepository,
      this.workspaceRepository
    );
  }

  public createGetPresetUseCase(): GetPresetUseCase {
    return new GetPresetUseCase(this.presetRepository);
  }

  public createListPresetsUseCase(): ListPresetsUseCase {
    return new ListPresetsUseCase(this.presetRepository);
  }

  public createUpdatePresetUseCase(): UpdatePresetUseCase {
    return new UpdatePresetUseCase(this.presetRepository);
  }

  public createDeletePresetUseCase(): DeletePresetUseCase {
    return new DeletePresetUseCase(this.presetRepository);
  }
}

/**
 * Export singleton instance for easy access throughout the application
 *
 * Usage:
 * ```typescript
 * import { container } from '@/infrastructure/di/container';
 *
 * const useCase = container.createGetUserUseCase();
 * const result = await useCase.execute({ userId: '123' });
 * ```
 */
export const container = DIContainer.getInstance();
