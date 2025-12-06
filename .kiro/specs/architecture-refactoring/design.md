# Architecture Refactoring Design Document

## Overview

This design document outlines the technical approach for refactoring the AIKEEDO codebase to achieve full compliance with Clean Architecture and Domain-Driven Design principles. The refactoring will be done incrementally to minimize risk and maintain system stability throughout the process.

The design focuses on establishing proper abstractions, implementing dependency inversion, and ensuring clear separation of concerns across all architectural layers.

## Architecture

### Current State

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│                  (API Routes, UI Components)                 │
│  - Directly instantiates repositories                        │
│  - Mixes infrastructure and application concerns             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│                      (Use Cases)                             │
│  - Imports concrete repository classes                       │
│  - Tight coupling to infrastructure                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      Domain Layer                            │
│              (Entities, Value Objects)                       │
│  ⚠️ Some Prisma types imported                               │
│  ⚠️ No repository interfaces defined                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Infrastructure Layer                        │
│         (Repositories, External Services)                    │
│  - Concrete implementations                                  │
│  - Some services in /lib/ instead                            │
└─────────────────────────────────────────────────────────────┘
```

### Target State

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│                  (API Routes, UI Components)                 │
│  ✓ Uses DI container for dependencies                        │
│  ✓ Depends on use cases only                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│                      (Use Cases)                             │
│  ✓ Depends on domain interfaces only                         │
│  ✓ Receives dependencies via constructor                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      Domain Layer                            │
│      (Entities, Value Objects, Interfaces)                   │
│  ✓ Zero infrastructure dependencies                          │
│  ✓ Repository interfaces defined                             │
│  ✓ Service interfaces for external concerns                  │
└─────────────────────────────────────────────────────────────┘
                            ↑
┌─────────────────────────────────────────────────────────────┐
│                  Infrastructure Layer                        │
│    (Repository Implementations, External Services)           │
│  ✓ Implements domain interfaces                              │
│  ✓ All infrastructure concerns properly located              │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Repository Interfaces (Domain Layer)

Each domain entity will have a corresponding repository interface.

#### User Repository Interface

```typescript
// src/domain/user/repositories/IUserRepository.ts
import { User } from '../entities/User';
import { Email } from '../value-objects/Email';
import { Id } from '../value-objects/Id';

export interface IUserRepository {
  // Core CRUD operations
  save(user: User): Promise<User>;
  findById(id: Id): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  delete(id: Id): Promise<void>;

  // Query operations
  findAll(options?: {
    limit?: number;
    offset?: number;
    status?: UserStatus;
  }): Promise<User[]>;

  count(filters?: { status?: UserStatus }): Promise<number>;

  // Specialized queries
  findByWorkspace(workspaceId: string): Promise<User[]>;
  existsByEmail(email: Email): Promise<boolean>;
}
```

#### Workspace Repository Interface

```typescript
// src/domain/workspace/repositories/IWorkspaceRepository.ts
import { Workspace } from '../entities/Workspace';
import { Id } from '../../user/value-objects/Id';

export interface IWorkspaceRepository {
  // Core CRUD operations
  save(workspace: Workspace): Promise<Workspace>;
  findById(id: Id): Promise<Workspace | null>;
  delete(id: Id): Promise<void>;

  // Query operations
  findByOwnerId(ownerId: string): Promise<Workspace[]>;
  findByUserId(userId: string): Promise<Workspace[]>;

  // Specialized operations
  updateCredits(id: Id, credits: number): Promise<void>;
  existsByName(name: string, ownerId: string): Promise<boolean>;
}
```

#### Document Repository Interface

```typescript
// src/domain/document/repositories/IDocumentRepository.ts
import { Document } from '../entities/Document';
import { Id } from '../../user/value-objects/Id';

export interface IDocumentRepository {
  save(document: Document): Promise<Document>;
  findById(id: Id): Promise<Document | null>;
  delete(id: Id): Promise<void>;

  findByWorkspace(
    workspaceId: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<Document[]>;

  findByUser(userId: string): Promise<Document[]>;
  search(query: string, workspaceId: string): Promise<Document[]>;
}
```

#### File Repository Interface

```typescript
// src/domain/file/repositories/IFileRepository.ts
import { File } from '../entities/File';
import { Id } from '../../user/value-objects/Id';

export interface IFileRepository {
  save(file: File): Promise<File>;
  findById(id: Id): Promise<File | null>;
  delete(id: Id): Promise<void>;

  findByWorkspace(workspaceId: string): Promise<File[]>;
  findByUser(userId: string): Promise<File[]>;
  findUnused(olderThan: Date): Promise<File[]>;
}
```

#### Conversation Repository Interface

```typescript
// src/domain/conversation/repositories/IConversationRepository.ts
import { Conversation } from '../entities/Conversation';
import { Message } from '../entities/Message';
import { Id } from '../../user/value-objects/Id';

export interface IConversationRepository {
  save(conversation: Conversation): Promise<Conversation>;
  findById(id: Id): Promise<Conversation | null>;
  delete(id: Id): Promise<void>;

  findByWorkspace(workspaceId: string): Promise<Conversation[]>;
  findByUser(userId: string): Promise<Conversation[]>;

  // Message operations
  addMessage(conversationId: Id, message: Message): Promise<Message>;
  getMessages(conversationId: Id, limit?: number): Promise<Message[]>;
}
```

### 2. Service Interfaces (Domain Layer)

For external concerns that represent domain concepts:

```typescript
// src/domain/services/IStorageService.ts
export interface IStorageService {
  upload(file: Buffer, path: string, contentType: string): Promise<string>;
  download(path: string): Promise<Buffer>;
  delete(path: string): Promise<void>;
  getPresignedUrl(path: string, expiresIn: number): Promise<string>;
}

// src/domain/services/IEmailService.ts
export interface IEmailService {
  sendVerificationEmail(to: string, token: string): Promise<void>;
  sendPasswordResetEmail(to: string, token: string): Promise<void>;
  sendWelcomeEmail(to: string, name: string): Promise<void>;
}

// src/domain/services/ICreditService.ts
export interface ICreditService {
  deduct(workspaceId: string, amount: number): Promise<void>;
  add(workspaceId: string, amount: number): Promise<void>;
  getBalance(workspaceId: string): Promise<number>;
}
```

### 3. Dependency Injection Container

```typescript
// src/infrastructure/di/container.ts
import { IUserRepository } from '@/domain/user/repositories/IUserRepository';
import { IWorkspaceRepository } from '@/domain/workspace/repositories/IWorkspaceRepository';
import { UserRepository } from '@/infrastructure/repositories/UserRepository';
import { WorkspaceRepository } from '@/infrastructure/repositories/WorkspaceRepository';

export interface Container {
  // Repositories
  userRepository: IUserRepository;
  workspaceRepository: IWorkspaceRepository;
  documentRepository: IDocumentRepository;
  fileRepository: IFileRepository;
  conversationRepository: IConversationRepository;

  // Services
  storageService: IStorageService;
  emailService: IEmailService;
  creditService: ICreditService;

  // Use Cases (optional, can be created on-demand)
  createUser: CreateUserUseCase;
  createWorkspace: CreateWorkspaceUseCase;
}

class DIContainer implements Container {
  private static instance: DIContainer;

  // Lazy-loaded singletons
  private _userRepository?: IUserRepository;
  private _workspaceRepository?: IWorkspaceRepository;

  private constructor() {}

  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  get userRepository(): IUserRepository {
    if (!this._userRepository) {
      this._userRepository = new UserRepository();
    }
    return this._userRepository;
  }

  get workspaceRepository(): IWorkspaceRepository {
    if (!this._workspaceRepository) {
      this._workspaceRepository = new WorkspaceRepository();
    }
    return this._workspaceRepository;
  }

  // Factory methods for use cases
  createUserUseCase(): CreateUserUseCase {
    return new CreateUserUseCase(this.userRepository);
  }

  createWorkspaceUseCase(): CreateWorkspaceUseCase {
    return new CreateWorkspaceUseCase(
      this.workspaceRepository,
      this.userRepository
    );
  }
}

export const container = DIContainer.getInstance();
```

## Data Models

### Domain Type Mappings

To remove Prisma dependencies from domain layer:

```typescript
// src/domain/billing/types.ts
export enum PlanInterval {
  MONTH = 'MONTH',
  YEAR = 'YEAR',
  WEEK = 'WEEK',
  DAY = 'DAY',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELED = 'CANCELED',
  PAST_DUE = 'PAST_DUE',
  TRIALING = 'TRIALING',
  INCOMPLETE = 'INCOMPLETE',
}

// src/infrastructure/repositories/mappers/PlanMapper.ts
import { PlanInterval as DomainPlanInterval } from '@/domain/billing/types';
import { PlanInterval as PrismaPlanInterval } from '@prisma/client';

export class PlanMapper {
  static toDomain(prismaInterval: PrismaPlanInterval): DomainPlanInterval {
    return prismaInterval as unknown as DomainPlanInterval;
  }

  static toPrisma(domainInterval: DomainPlanInterval): PrismaPlanInterval {
    return domainInterval as unknown as PrismaPlanInterval;
  }
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Repository Interface Import Purity

_For any_ use case file, all repository imports should come from `@/domain/` paths, not from `@/infrastructure/` paths.
**Validates: Requirements 1.2, 5.1, 5.5**

### Property 2: Domain Layer Import Purity

_For any_ file in `src/domain/`, it should not import from `@prisma/client`, `stripe`, or other infrastructure packages.
**Validates: Requirements 2.1, 2.4**

### Property 3: Repository Interface Completeness

_For any_ domain entity with a repository interface, the interface should include at minimum: `save()`, `findById()`, and `delete()` methods.
**Validates: Requirement 1.3**

### Property 4: Repository Implementation Location

_For any_ repository implementation, it should be located in `src/infrastructure/repositories/` and implement a corresponding domain interface.
**Validates: Requirement 1.4**

### Property 5: Use Case Constructor Injection

_For any_ use case class, repository dependencies should be declared as constructor parameters with domain interface types.
**Validates: Requirements 3.1, 5.2**

### Property 6: API Route DI Usage

_For any_ API route that uses a use case, it should obtain the use case instance from the DI container rather than instantiating it directly.
**Validates: Requirements 3.2, 6.1**

### Property 7: No Direct Repository Instantiation in API Routes

_For any_ API route, it should not contain `new *Repository()` instantiation calls.
**Validates: Requirement 6.2**

### Property 8: Use Case Service Interface Dependencies

_For any_ use case that depends on external services, it should depend on domain-level service interfaces (I\*Service) rather than concrete implementations.
**Validates: Requirements 5.3**

### Property 9: Infrastructure Service Interface Definition

_For any_ infrastructure service that represents a domain concept, a corresponding interface should exist in the domain layer.
**Validates: Requirement 4.5**

### Property 10: API Route Pattern Consistency

_For any_ API route, it should follow the pattern: authenticate → validate → execute use case → format response.
**Validates: Requirement 6.5**

### Property 11: Repository Interface No Infrastructure Types

_For any_ repository interface in the domain layer, it should not reference infrastructure-specific types (Prisma types, Stripe types, etc.).
**Validates: Requirement 1.5**

### Property 12: Use Case Import Restrictions

_For any_ use case, imports should only come from `@/domain/` or other use cases in `@/application/use-cases/`.
**Validates: Requirement 5.1**

### Property 13: Domain Value Object Purity

_For any_ value object in the domain layer, it should not import infrastructure packages and should be immutable.
**Validates: Requirement 2.5**

### Property 14: Use Case Composition via Injection

_For any_ use case that depends on another use case, the dependency should be injected through the constructor.
**Validates: Requirement 5.4**

### Property 15: API Backward Compatibility

_For any_ API endpoint, the response structure should remain the same before and after refactoring.
**Validates: Requirement 8.2**

### Property 16: Repository Interface Documentation

_For any_ repository interface, it should have JSDoc comments explaining the contract and usage.
**Validates: Requirement 9.3**

### Property 17: Domain Layer No Infrastructure Imports

_For any_ file in `src/domain/`, it should not import from `@/infrastructure/`.
**Validates: Requirement 2.1**

### Property 18: Test Coverage Maintenance

_For any_ use case, it should have corresponding test files with adequate coverage.
**Validates: Requirement 8.4**

### Property 19: Architecture Validation Rules

_For any_ commit, linting rules should verify that domain files don't import infrastructure packages.
**Validates: Requirements 10.2, 10.3**

### Property 20: Cross-Cutting Concerns Location

_For any_ file in `src/lib/`, it should contain only framework-agnostic utilities, not infrastructure-specific implementations.
**Validates: Requirement 4.4**

## Error Handling

### Domain Layer Errors

```typescript
// src/domain/errors/DomainError.ts
export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class EntityNotFoundError extends DomainError {
  constructor(entityName: string, id: string) {
    super(`${entityName} with id ${id} not found`);
  }
}

export class ValidationError extends DomainError {
  constructor(
    message: string,
    public readonly field?: string
  ) {
    super(message);
  }
}

export class BusinessRuleViolationError extends DomainError {
  constructor(rule: string) {
    super(`Business rule violated: ${rule}`);
  }
}
```

### Application Layer Error Handling

```typescript
// src/application/errors/ApplicationError.ts
export abstract class ApplicationError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class UnauthorizedError extends ApplicationError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends ApplicationError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

export class NotFoundError extends ApplicationError {
  constructor(resource: string) {
    super(`${resource} not found`, 404);
  }
}
```

### Error Handling in API Routes

```typescript
// app/api/workspaces/route.ts
import { container } from '@/infrastructure/di/container';
import { handleApiError } from '@/lib/errors/handler';

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    const body = await request.json();

    const useCase = container.createWorkspaceUseCase();
    const workspace = await useCase.execute(body);

    return NextResponse.json({ success: true, data: workspace });
  } catch (error) {
    return handleApiError(error);
  }
}
```

## Testing Strategy

### Unit Testing

**Domain Entities:**

```typescript
// src/domain/user/entities/__tests__/User.test.ts
import { describe, it, expect } from 'vitest';
import { User } from '../User';
import { Email } from '../../value-objects/Email';
import { Password } from '../../value-objects/Password';

describe('User Entity', () => {
  it('should create a valid user', async () => {
    const email = new Email('test@example.com');
    const password = await Password.create('SecurePass123!');

    const user = await User.create({
      email,
      password,
      firstName: 'John',
      lastName: 'Doe',
    });

    expect(user.getEmail()).toBe(email);
    expect(user.getFullName()).toBe('John Doe');
  });
});
```

**Use Cases with Mocked Repositories:**

```typescript
// src/application/use-cases/workspace/__tests__/CreateWorkspaceUseCase.test.ts
import { describe, it, expect, vi } from 'vitest';
import { CreateWorkspaceUseCase } from '../CreateWorkspaceUseCase';
import { IWorkspaceRepository } from '@/domain/workspace/repositories/IWorkspaceRepository';
import { IUserRepository } from '@/domain/user/repositories/IUserRepository';

describe('CreateWorkspaceUseCase', () => {
  it('should create a workspace', async () => {
    // Create mock repositories
    const mockWorkspaceRepo: IWorkspaceRepository = {
      save: vi.fn().mockResolvedValue(mockWorkspace),
      findById: vi.fn(),
      delete: vi.fn(),
      findByOwnerId: vi.fn(),
      findByUserId: vi.fn(),
      updateCredits: vi.fn(),
      existsByName: vi.fn().mockResolvedValue(false),
    };

    const mockUserRepo: IUserRepository = {
      findById: vi.fn().mockResolvedValue(mockUser),
      // ... other methods
    };

    const useCase = new CreateWorkspaceUseCase(mockWorkspaceRepo, mockUserRepo);

    const result = await useCase.execute({
      userId: 'user-123',
      name: 'Test Workspace',
    });

    expect(mockWorkspaceRepo.save).toHaveBeenCalled();
    expect(result.getName()).toBe('Test Workspace');
  });
});
```

### Integration Testing

**Repository Tests:**

```typescript
// src/infrastructure/repositories/__tests__/UserRepository.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { UserRepository } from '../UserRepository';
import { setupTestDatabase, teardownTestDatabase } from '@/lib/testing/test-db';

describe('UserRepository', () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    await teardownTestDatabase();
  });

  it('should save and retrieve a user', async () => {
    const repository = new UserRepository();
    const user = await User.create({
      email: new Email('test@example.com'),
      password: await Password.create('SecurePass123!'),
      firstName: 'John',
      lastName: 'Doe',
    });

    await repository.save(user);
    const retrieved = await repository.findById(user.getId());

    expect(retrieved).not.toBeNull();
    expect(retrieved?.getEmail().getValue()).toBe('test@example.com');
  });
});
```

### Property-Based Testing

```typescript
// src/domain/user/entities/__tests__/User.property.test.ts
import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { User } from '../User';
import { Email } from '../../value-objects/Email';
import { Password } from '../../value-objects/Password';

describe('User Entity Properties', () => {
  it('should maintain email immutability', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 8 }),
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        async (emailStr, passwordStr, firstName, lastName) => {
          const email = new Email(emailStr);
          const password = await Password.create(passwordStr);
          const user = await User.create({
            email,
            password,
            firstName,
            lastName,
          });

          const retrievedEmail = user.getEmail();
          return retrievedEmail.getValue() === emailStr;
        }
      )
    );
  });
});
```

### Architecture Testing

```typescript
// tests/architecture/layer-dependencies.test.ts
import { describe, it, expect } from 'vitest';
import { glob } from 'glob';
import fs from 'fs';

describe('Architecture Rules', () => {
  it('domain layer should not import from infrastructure', async () => {
    const domainFiles = await glob('src/domain/**/*.ts');

    for (const file of domainFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const hasInfraImport =
        content.includes("from '@/infrastructure/") ||
        content.includes("from '@prisma/client'") ||
        content.includes("from 'stripe'");

      expect(hasInfraImport).toBe(false);
    }
  });

  it('use cases should only import from domain', async () => {
    const useCaseFiles = await glob('src/application/use-cases/**/*.ts');

    for (const file of useCaseFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const hasInfraImport = content.includes("from '@/infrastructure/");

      expect(hasInfraImport).toBe(false);
    }
  });
});
```

## Migration Strategy

### Phase 1: Foundation (Core Domains)

**Week 1-2: Repository Interfaces**

1. Create repository interfaces for User and Workspace domains
2. Update existing repository implementations to implement interfaces
3. Add domain-level types to replace Prisma types
4. Create type mappers in infrastructure layer

**Deliverables:**

- `src/domain/user/repositories/IUserRepository.ts`
- `src/domain/workspace/repositories/IWorkspaceRepository.ts`
- `src/domain/billing/types.ts` (domain enums)
- `src/infrastructure/repositories/mappers/` (type mappers)

**Week 3: Use Case Refactoring**

1. Update User and Workspace use cases to depend on interfaces
2. Add constructor injection for repositories
3. Update tests to use mock repositories
4. Verify all tests pass

**Deliverables:**

- Refactored use cases with interface dependencies
- Updated test files with mocks
- Test coverage maintained or improved

### Phase 2: Dependency Injection

**Week 4: DI Container Implementation**

1. Create DI container in infrastructure layer
2. Implement lazy-loaded singletons for repositories
3. Add factory methods for use cases
4. Create test container for testing

**Deliverables:**

- `src/infrastructure/di/container.ts`
- `src/infrastructure/di/test-container.ts`
- Container documentation

**Week 5: API Route Migration**

1. Update User and Workspace API routes to use DI container
2. Remove direct repository instantiation
3. Update integration tests
4. Verify backward compatibility

**Deliverables:**

- Refactored API routes using DI
- Updated integration tests
- API compatibility verified

### Phase 3: Extended Domains

**Week 6-7: Additional Repository Interfaces**

1. Create interfaces for Document, File, Conversation domains
2. Implement interfaces in existing repositories
3. Update use cases to use interfaces
4. Update tests

**Deliverables:**

- Repository interfaces for all domains
- Updated use cases and tests
- All tests passing

**Week 8: Service Interfaces**

1. Create domain service interfaces (IStorageService, IEmailService, ICreditService)
2. Update infrastructure services to implement interfaces
3. Update use cases to depend on service interfaces
4. Update DI container with service bindings

**Deliverables:**

- Domain service interfaces
- Updated infrastructure services
- Updated DI container

### Phase 4: Infrastructure Reorganization

**Week 9: File Reorganization**

1. Move storage services from `src/lib/storage/` to `src/infrastructure/storage/`
2. Move email services from `src/lib/email/` to `src/infrastructure/email/`
3. Update imports across codebase
4. Verify all tests pass

**Deliverables:**

- Reorganized infrastructure layer
- Updated imports
- All tests passing

**Week 10: Cleanup**

1. Remove unused code from `src/lib/`
2. Update barrel exports
3. Run full test suite
4. Performance testing

**Deliverables:**

- Clean `src/lib/` directory
- Updated exports
- Performance benchmarks

### Phase 5: Quality & Documentation

**Week 11: Testing Infrastructure**

1. Create test factories for all domain entities
2. Create mock repositories for all interfaces
3. Add property-based test generators
4. Create architecture tests

**Deliverables:**

- `src/lib/testing/factories/` (entity factories)
- `src/lib/testing/mocks/` (mock repositories)
- `src/lib/testing/generators/` (PBT generators)
- `tests/architecture/` (architecture tests)

**Week 12: Documentation & Validation**

1. Update `/docs/ARCHITECTURE.md`
2. Update steering documents with new patterns
3. Add ESLint rules for architecture enforcement
4. Create migration guide
5. Final review and sign-off

**Deliverables:**

- Updated documentation
- ESLint architecture rules
- Migration guide
- Sign-off document

## Rollback Strategy

### Per-Phase Rollback

Each phase is designed to be independently rollbackable:

1. **Repository Interfaces**: Can coexist with concrete implementations
2. **DI Container**: Can be disabled with feature flag
3. **API Routes**: Can be reverted individually
4. **File Reorganization**: Git revert with import updates

### Feature Flags

```typescript
// src/lib/config.ts
export const config = {
  useDependencyInjection: process.env.USE_DI === 'true',
  useRepositoryInterfaces: process.env.USE_REPO_INTERFACES === 'true',
};

// Usage in API routes
if (config.useDependencyInjection) {
  const useCase = container.createWorkspaceUseCase();
} else {
  const useCase = new CreateWorkspaceUseCase(
    new WorkspaceRepository(),
    new UserRepository()
  );
}
```

### Monitoring

Track key metrics during migration:

- API response times
- Error rates
- Test execution time
- Memory usage
- Database query performance

Alert if any metric degrades by >10%.

## Performance Considerations

### DI Container Overhead

- Lazy initialization minimizes startup time
- Singleton pattern prevents repeated instantiation
- Benchmark: <1ms overhead per request

### Repository Interface Abstraction

- No runtime overhead (TypeScript interfaces compile away)
- Potential for better optimization through interface contracts

### Testing Performance

- Mock repositories significantly faster than real database
- Expected 50% reduction in test execution time
- Property-based tests may increase test time but improve coverage

## Security Considerations

### Dependency Injection Security

- Container should not be exposed to client
- Validate all container bindings at startup
- Prevent circular dependencies

### Repository Interface Security

- Interfaces should not expose sensitive operations
- Implement authorization at use case level
- Audit all data access through repositories

## Deployment Strategy

### Gradual Rollout

1. Deploy to staging with all phases complete
2. Run full test suite and performance benchmarks
3. Deploy to production with feature flags disabled
4. Enable feature flags gradually (10% → 50% → 100%)
5. Monitor metrics at each stage
6. Full rollout after 1 week of stable operation

### Rollback Plan

- Feature flags allow instant rollback
- Database schema unchanged (no migrations needed)
- API contracts maintained (backward compatible)
- Rollback window: 7 days

## Success Metrics

### Code Quality Metrics

- Zero infrastructure imports in domain layer
- 100% of use cases use dependency injection
- 100% of repositories implement domain interfaces
- Test coverage ≥ 90%
- Architecture tests passing

### Performance Metrics

- API response time unchanged (±5%)
- Test execution time reduced by 30-50%
- Memory usage unchanged (±10%)
- Zero production errors related to refactoring

### Developer Experience Metrics

- Time to add new use case: <30 minutes
- Time to add new repository: <1 hour
- Onboarding time for new developers: reduced by 25%
- Code review time: reduced by 20%

## Maintenance Plan

### Ongoing Validation

- Run architecture tests in CI/CD
- ESLint rules enforce layer boundaries
- Code review checklist includes architecture compliance
- Monthly architecture review meetings

### Documentation Updates

- Update architecture docs with each change
- Maintain migration guide for new patterns
- Keep steering documents current
- Document all architectural decisions (ADRs)

### Training

- Create video tutorials for new patterns
- Conduct team workshops on Clean Architecture
- Pair programming sessions for complex refactorings
- Regular architecture Q&A sessions
