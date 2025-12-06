# Dependency Injection Container

This directory contains the Dependency Injection (DI) container implementation for the application. The container manages all dependencies and provides a centralized way to create use cases with their required dependencies.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Usage](#usage)
- [Available Repositories](#available-repositories)
- [Available Use Cases](#available-use-cases)
- [Testing](#testing)
- [Best Practices](#best-practices)

---

## Overview

The DI container implements the **Dependency Injection** pattern with:

- **Singleton Pattern**: Single container instance throughout the application
- **Lazy Loading**: Repositories created only when first accessed
- **Factory Methods**: Use cases created with proper dependencies injected
- **Type Safety**: Full TypeScript support with interfaces

### Benefits

- **Loose Coupling**: Components depend on abstractions, not concrete implementations
- **Testability**: Easy to swap real implementations with mocks
- **Maintainability**: Single place to manage all dependencies
- **Consistency**: All parts of the application use the same pattern

---

## Architecture

### Container Structure

```
DIContainer (Singleton)
├── Repository Instances (Lazy-loaded)
│   ├── userRepository: IUserRepository
│   ├── workspaceRepository: IWorkspaceRepository
│   ├── documentRepository: DocumentRepositoryInterface
│   ├── fileRepository: FileRepositoryInterface
│   ├── conversationRepository: IConversationRepository
│   ├── messageRepository: IMessageRepository
│   ├── presetRepository: IPresetRepository
│   └── verificationTokenRepository: VerificationTokenRepository
│
└── Use Case Factory Methods
    ├── User Use Cases (4 methods)
    ├── Workspace Use Cases (5 methods)
    ├── Document Use Cases (6 methods)
    ├── File Use Cases (3 methods)
    ├── Conversation Use Cases (5 methods)
    └── Preset Use Cases (5 methods)
```

### Dependency Flow

```
API Route
    ↓ imports
Container (singleton instance)
    ↓ calls factory method
Use Case (created with dependencies)
    ↓ uses
Repository Interface (domain)
    ↑ implemented by
Concrete Repository (infrastructure)
```

---

## Usage

### Basic Usage in API Routes

```typescript
import { container } from '@/infrastructure/di/container';

export async function GET(request: NextRequest) {
  // Get a use case from the container
  const useCase = container.createGetUserUseCase();

  // Execute the use case
  const user = await useCase.execute({ userId: '123' });

  return NextResponse.json({ data: user });
}
```

### Accessing Repositories Directly

While use cases are preferred, you can access repositories directly when needed:

```typescript
import { container } from '@/infrastructure/di/container';

// Access a repository
const user = await container.userRepository.findById(userId);
```

### Multiple Use Cases in One Route

```typescript
import { container } from '@/infrastructure/di/container';

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Create multiple use cases
  const getUserUseCase = container.createGetUserUseCase();
  const createWorkspaceUseCase = container.createCreateWorkspaceUseCase();

  // Execute them
  const user = await getUserUseCase.execute({ userId: body.userId });
  const workspace = await createWorkspaceUseCase.execute({
    userId: user.getId().getValue(),
    name: body.workspaceName,
  });

  return NextResponse.json({ data: workspace });
}
```

---

## Available Repositories

All repositories are lazy-loaded singletons accessed via getters:

### User Repository

```typescript
container.userRepository: IUserRepository
```

- `save(user: User): Promise<User>`
- `findById(id: Id): Promise<User | null>`
- `findByEmail(email: Email): Promise<User | null>`
- `delete(id: Id): Promise<void>`

### Workspace Repository

```typescript
container.workspaceRepository: IWorkspaceRepository
```

- `save(workspace: Workspace): Promise<Workspace>`
- `findById(id: string): Promise<Workspace | null>`
- `findByOwnerId(ownerId: string): Promise<Workspace[]>`
- `findByUserId(userId: string): Promise<Workspace[]>`
- `delete(id: string): Promise<void>`

### Document Repository

```typescript
container.documentRepository: DocumentRepositoryInterface
```

- `save(document: DocumentEntity): Promise<DocumentEntity>`
- `findById(id: string): Promise<DocumentEntity | null>`
- `findByWorkspaceId(workspaceId: string): Promise<DocumentEntity[]>`
- `delete(id: string): Promise<void>`

### File Repository

```typescript
container.fileRepository: FileRepositoryInterface
```

- `save(file: FileEntity): Promise<FileEntity>`
- `findById(id: string): Promise<FileEntity | null>`
- `findByWorkspaceId(workspaceId: string): Promise<FileEntity[]>`
- `delete(id: string): Promise<void>`

### Conversation Repository

```typescript
container.conversationRepository: IConversationRepository
```

- `save(conversation: Conversation): Promise<Conversation>`
- `findById(id: string): Promise<Conversation | null>`
- `list(options: ListConversationsOptions): Promise<Conversation[]>`
- `delete(id: string): Promise<void>`

### Message Repository

```typescript
container.messageRepository: IMessageRepository
```

- `create(data: CreateMessageData): Promise<Message>`
- `save(message: Message): Promise<Message>`
- `findById(id: string): Promise<Message | null>`
- `findByConversationId(conversationId: string): Promise<Message[]>`
- `deleteByConversationId(conversationId: string): Promise<void>`

### Preset Repository

```typescript
container.presetRepository: IPresetRepository
```

- `save(preset: Preset): Promise<Preset>`
- `findById(id: string): Promise<Preset | null>`
- `list(options: ListPresetsOptions): Promise<Preset[]>`
- `delete(id: string): Promise<void>`

### Verification Token Repository

```typescript
container.verificationTokenRepository: VerificationTokenRepository
```

- Used internally by UpdateEmailUseCase for email verification

---

## Available Use Cases

### User Use Cases

```typescript
// Get user by ID
container.createGetUserUseCase(): GetUserUseCase

// Update user profile
container.createUpdateProfileUseCase(): UpdateProfileUseCase

// Update user email (with verification)
container.createUpdateEmailUseCase(): UpdateEmailUseCase

// Update user password
container.createUpdatePasswordUseCase(): UpdatePasswordUseCase
```

### Workspace Use Cases

```typescript
// Create new workspace
container.createCreateWorkspaceUseCase(): CreateWorkspaceUseCase

// List user's workspaces
container.createListWorkspacesUseCase(): ListWorkspacesUseCase

// Update workspace
container.createUpdateWorkspaceUseCase(): UpdateWorkspaceUseCase

// Switch current workspace
container.createSwitchWorkspaceUseCase(): SwitchWorkspaceUseCase

// Transfer workspace ownership
container.createTransferWorkspaceOwnershipUseCase(): TransferWorkspaceOwnershipUseCase
```

### Document Use Cases

```typescript
// Create document
container.createCreateDocumentUseCase(): CreateDocumentUseCase

// Get document by ID
container.createGetDocumentUseCase(): GetDocumentUseCase

// List documents
container.createListDocumentsUseCase(): ListDocumentsUseCase

// Search documents
container.createSearchDocumentsUseCase(): SearchDocumentsUseCase

// Update document
container.createUpdateDocumentUseCase(): UpdateDocumentUseCase

// Delete document
container.createDeleteDocumentUseCase(): DeleteDocumentUseCase
```

### File Use Cases

```typescript
// Upload file
container.createUploadFileUseCase(): UploadFileUseCase

// List files
container.createListFilesUseCase(): ListFilesUseCase

// Delete file
container.createDeleteFileUseCase(): DeleteFileUseCase
```

### Conversation Use Cases

```typescript
// Create conversation
container.createCreateConversationUseCase(): CreateConversationUseCase

// Get conversation with messages
container.createGetConversationUseCase(): GetConversationUseCase

// List conversations
container.createListConversationsUseCase(): ListConversationsUseCase

// Delete conversation
container.createDeleteConversationUseCase(): DeleteConversationUseCase

// Add message to conversation
container.createAddMessageUseCase(): AddMessageUseCase
```

### Preset Use Cases

```typescript
// Create preset
container.createCreatePresetUseCase(): CreatePresetUseCase

// Get preset by ID
container.createGetPresetUseCase(): GetPresetUseCase

// List presets
container.createListPresetsUseCase(): ListPresetsUseCase

// Update preset
container.createUpdatePresetUseCase(): UpdatePresetUseCase

// Delete preset
container.createDeletePresetUseCase(): DeletePresetUseCase
```

---

## Testing

### Using the Test Container

The application provides a dedicated test container with mock repositories for easy testing:

```typescript
import { createTestContainer } from '@/infrastructure/di/test-container';

describe('Use Case Tests', () => {
  let container: TestDIContainer;

  beforeEach(() => {
    // Create fresh test container with default mocks
    container = createTestContainer();
  });

  it('should execute use case with mocks', async () => {
    const useCase = container.createGetUserUseCase();
    const result = await useCase.execute({ userId: '123' });
    // Test assertions
  });
});
```

### Overriding Specific Repositories

You can override specific repositories with custom mocks:

```typescript
import { createTestContainer } from '@/infrastructure/di/test-container';
import { vi } from 'vitest';

describe('Custom Mock Tests', () => {
  let container: TestDIContainer;

  beforeEach(() => {
    container = createTestContainer();
  });

  it('should use custom mock', async () => {
    // Create custom mock with specific behavior
    const mockUserRepo = {
      save: vi.fn().mockResolvedValue(mockUser),
      findById: vi.fn().mockResolvedValue(mockUser),
      findByEmail: vi.fn().mockResolvedValue(null),
      delete: vi.fn(),
      findAll: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      findByWorkspace: vi.fn().mockResolvedValue([]),
      existsByEmail: vi.fn().mockResolvedValue(false),
    };

    // Override the repository
    container.setUserRepository(mockUserRepo);

    // Use case will now use your custom mock
    const useCase = container.createGetUserUseCase();
    const result = await useCase.execute({ userId: '123' });

    expect(mockUserRepo.findById).toHaveBeenCalledWith('123');
    expect(result).toEqual(mockUser);
  });
});
```

### Resetting Test Container

Reset the container to default mocks between tests:

```typescript
describe('Multiple Tests', () => {
  let container: TestDIContainer;

  beforeEach(() => {
    container = createTestContainer();
  });

  afterEach(() => {
    // Reset to default mocks
    container.reset();
  });

  it('test 1', async () => {
    // Customize for this test
    container.setUserRepository(customMock1);
    // ... test logic
  });

  it('test 2', async () => {
    // Starts fresh with default mocks
    // ... test logic
  });
});
```

### Available Mock Factories

The test container provides factory functions for creating default mocks:

```typescript
import {
  createMockUserRepository,
  createMockWorkspaceRepository,
  createMockDocumentRepository,
  createMockFileRepository,
  createMockConversationRepository,
  createMockMessageRepository,
  createMockPresetRepository,
  createMockFileStorage,
} from '@/infrastructure/di/test-container';

// Create individual mocks
const mockUserRepo = createMockUserRepository();
const mockWorkspaceRepo = createMockWorkspaceRepository();
```

### Testing with Real Database

For integration tests that need a real database, use the production container:

```typescript
import { DIContainer } from '@/infrastructure/di/container';
import { setupTestDatabase, teardownTestDatabase } from '@/lib/testing/test-db';

describe('Integration Tests', () => {
  let container: DIContainer;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(() => {
    DIContainer.reset();
    container = DIContainer.getInstance();
  });

  it('should work with real database', async () => {
    const useCase = container.createGetUserUseCase();
    // Test with real database
  });
});
```

### Test Container Limitations

The test container has some limitations:

1. **UpdateEmailUseCase**: Requires `VerificationTokenRepository` which is not mocked by default. Override manually if needed.
2. **File Storage**: Uses a mock file storage. Override with a real implementation for file upload tests.

```typescript
// Example: Testing UpdateEmailUseCase
const mockVerificationTokenRepo = {
  create: vi.fn(),
  findByToken: vi.fn(),
  delete: vi.fn(),
};

// You'll need to create the use case manually
const useCase = new UpdateEmailUseCase(
  container.userRepository,
  mockVerificationTokenRepo
);
```

---

## Best Practices

### DO ✅

1. **Always use the container in API routes**

   ```typescript
   const useCase = container.createGetUserUseCase();
   ```

2. **Use factory methods for use cases**

   ```typescript
   // Good - dependencies injected automatically
   const useCase = container.createUpdateProfileUseCase();
   ```

3. **Access repositories through container**

   ```typescript
   const user = await container.userRepository.findById(userId);
   ```

4. **Reset container in tests for isolation**
   ```typescript
   beforeEach(() => {
     DIContainer.reset();
   });
   ```

### DON'T ❌

1. **Don't instantiate repositories directly**

   ```typescript
   // Bad - bypasses container
   const repo = new UserRepository();
   ```

2. **Don't instantiate use cases directly**

   ```typescript
   // Bad - manual dependency management
   const useCase = new GetUserUseCase(new UserRepository());
   ```

3. **Don't import concrete repositories in API routes**

   ```typescript
   // Bad - creates tight coupling
   import { UserRepository } from '@/infrastructure/repositories/UserRepository';
   ```

4. **Don't create multiple container instances**
   ```typescript
   // Bad - breaks singleton pattern
   const container1 = new DIContainer();
   const container2 = new DIContainer();
   ```

### Guidelines

- **Use cases are preferred**: Always use use cases instead of repositories directly when possible
- **Keep routes thin**: Routes should only handle HTTP concerns, delegate to use cases
- **Test through the container**: Tests should use the container to ensure realistic scenarios
- **Document new dependencies**: When adding new repositories or use cases, update this README

---

## Adding New Dependencies

### Adding a New Repository

1. **Create the repository interface** in the domain layer:

   ```typescript
   // src/domain/[domain]/repositories/I[Entity]Repository.ts
   export interface IEntityRepository {
     save(entity: Entity): Promise<Entity>;
     findById(id: string): Promise<Entity | null>;
   }
   ```

2. **Implement the repository** in the infrastructure layer:

   ```typescript
   // src/infrastructure/repositories/EntityRepository.ts
   export class EntityRepository implements IEntityRepository {
     async save(entity: Entity): Promise<Entity> {
       // Implementation
     }
   }
   ```

3. **Add to container**:

   ```typescript
   // In DIContainer class
   private _entityRepository?: IEntityRepository;

   public get entityRepository(): IEntityRepository {
     if (!this._entityRepository) {
       this._entityRepository = new EntityRepository();
     }
     return this._entityRepository;
   }
   ```

### Adding a New Use Case

1. **Create the use case** in the application layer:

   ```typescript
   // src/application/use-cases/[domain]/DoSomethingUseCase.ts
   export class DoSomethingUseCase {
     constructor(private readonly entityRepository: IEntityRepository) {}

     async execute(command: DoSomethingCommand): Promise<Result> {
       // Implementation
     }
   }
   ```

2. **Add factory method to container**:

   ```typescript
   // In DIContainer class
   public createDoSomethingUseCase(): DoSomethingUseCase {
     return new DoSomethingUseCase(this.entityRepository);
   }
   ```

3. **Update container interface**:
   ```typescript
   // In Container interface
   createDoSomethingUseCase(): DoSomethingUseCase;
   ```

---

## Troubleshooting

### Container not found error

**Error**: `Cannot find module '@/infrastructure/di/container'`

**Solution**: Ensure TypeScript path aliases are configured in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Repository returns undefined

**Error**: Repository method returns `undefined` instead of expected value

**Solution**: Check that:

1. Repository is properly implementing the interface
2. Database connection is established
3. Prisma client is generated: `npm run db:generate`

### Use case missing dependencies

**Error**: `Cannot read property 'X' of undefined` in use case

**Solution**: Ensure all required repositories are injected in the factory method:

```typescript
public createMyUseCase(): MyUseCase {
  return new MyUseCase(
    this.repository1,
    this.repository2  // Don't forget all dependencies!
  );
}
```

---

## Related Documentation

- [Architecture Documentation](../../../docs/ARCHITECTURE.md) - Overall architecture patterns
- [Repository Pattern](../../../docs/ARCHITECTURE.md#repository-pattern) - Repository implementation details
- [Use Cases](../../application/use-cases/README.md) - Use case documentation
- [Testing Guide](../../../docs/TESTING.md) - Testing strategies

---

## Version History

- **v1.0.0** (2024-12-06): Initial DI container implementation
  - Singleton pattern with lazy loading
  - 8 repositories managed
  - 28 use case factory methods
  - Full TypeScript support
