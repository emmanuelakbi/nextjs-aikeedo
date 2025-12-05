# Architecture Documentation

This document describes the architecture, design patterns, and code organization of the AIKEEDO Next.js foundation module.

## Table of Contents

- [Overview](#overview)
- [Architecture Principles](#architecture-principles)
- [Layer Architecture](#layer-architecture)
- [Directory Structure](#directory-structure)
- [Design Patterns](#design-patterns)
- [Data Flow](#data-flow)
- [Authentication Flow](#authentication-flow)
- [Database Design](#database-design)
- [Testing Strategy](#testing-strategy)
- [Performance Considerations](#performance-considerations)

---

## Overview

The AIKEEDO Next.js foundation module follows **Clean Architecture** principles combined with **Domain-Driven Design (DDD)**. This architecture ensures:

- **Separation of Concerns**: Each layer has a specific responsibility
- **Testability**: Business logic is independent of frameworks
- **Maintainability**: Changes in one layer don't affect others
- **Scalability**: Easy to add new features without breaking existing code

### Key Technologies

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Prisma**: Type-safe ORM for database access
- **NextAuth.js**: Authentication solution
- **Zod**: Runtime validation and type inference
- **Tailwind CSS**: Utility-first styling

---

## Architecture Principles

### 1. Clean Architecture

The application is organized into concentric layers, with dependencies pointing inward:

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │  ← UI, API Routes, Components
├─────────────────────────────────────────┤
│         Application Layer               │  ← Use Cases, Commands, Queries
├─────────────────────────────────────────┤
│           Domain Layer                  │  ← Entities, Value Objects, Rules
├─────────────────────────────────────────┤
│       Infrastructure Layer              │  ← Database, External Services
└─────────────────────────────────────────┘
```

**Dependency Rule**: Inner layers never depend on outer layers.

### 2. Domain-Driven Design

- **Entities**: Objects with unique identity (User, Workspace)
- **Value Objects**: Immutable objects without identity (Email, Password)
- **Repositories**: Interfaces for data access
- **Use Cases**: Application-specific business rules
- **Domain Events**: Significant occurrences in the domain

### 3. SOLID Principles

- **Single Responsibility**: Each class has one reason to change
- **Open/Closed**: Open for extension, closed for modification
- **Liskov Substitution**: Subtypes must be substitutable for base types
- **Interface Segregation**: Many specific interfaces over one general
- **Dependency Inversion**: Depend on abstractions, not concretions

---

## Layer Architecture

### Domain Layer (`src/domain/`)

**Purpose**: Contains core business logic and rules.

**Components**:

- **Entities**: Business objects with identity
- **Value Objects**: Immutable domain concepts
- **Repository Interfaces**: Contracts for data access
- **Domain Events**: Business-significant occurrences
- **Exceptions**: Domain-specific errors

**Rules**:

- No dependencies on other layers
- Pure business logic only
- Framework-agnostic
- Highly testable

**Example Structure**:

```
src/domain/
├── user/
│   ├── entities/
│   │   └── User.ts
│   ├── value-objects/
│   │   ├── Email.ts
│   │   ├── Password.ts
│   │   └── PhoneNumber.ts
│   └── repositories/
│       └── UserRepository.ts (interface)
└── workspace/
    ├── entities/
    │   └── Workspace.ts
    └── repositories/
        └── WorkspaceRepository.ts (interface)
```

### Application Layer (`src/application/`)

**Purpose**: Orchestrates domain objects to fulfill use cases.

**Components**:

- **Use Cases**: Application-specific business rules
- **Commands**: Request objects for actions
- **Queries**: Request objects for data retrieval
- **Command Handlers**: Execute commands
- **Query Handlers**: Execute queries

**Rules**:

- Depends only on domain layer
- Coordinates domain objects
- No UI or infrastructure concerns
- Transaction boundaries

**Example Structure**:

```
src/application/
├── use-cases/
│   ├── auth/
│   │   ├── RegisterUser.ts
│   │   ├── LoginUser.ts
│   │   └── VerifyEmail.ts
│   └── user/
│       ├── UpdateProfile.ts
│       └── ChangePassword.ts
├── commands/
│   ├── RegisterUserCommand.ts
│   └── UpdateProfileCommand.ts
└── queries/
    ├── GetUserQuery.ts
    └── ListWorkspacesQuery.ts
```

### Infrastructure Layer (`src/infrastructure/`)

**Purpose**: Implements technical capabilities.

**Components**:

- **Repository Implementations**: Concrete data access
- **External Services**: Email, storage, APIs
- **Adapters**: Convert between layers
- **Database Clients**: Prisma, Redis

**Rules**:

- Implements domain interfaces
- Contains framework-specific code
- Handles external dependencies
- No business logic

**Example Structure**:

```
src/infrastructure/
├── repositories/
│   ├── PrismaUserRepository.ts
│   └── PrismaWorkspaceRepository.ts
├── services/
│   ├── EmailService.ts
│   └── TokenService.ts
└── adapters/
    └── PrismaAdapter.ts
```

### Presentation Layer (`src/app/`, `src/components/`)

**Purpose**: Handles user interaction and API endpoints.

**Components**:

- **Pages**: Next.js route components
- **API Routes**: Server-side endpoints
- **Components**: React UI components
- **Middleware**: Request/response processing

**Rules**:

- Depends on application layer
- Handles HTTP concerns
- Validates input
- Formats output

**Example Structure**:

```
src/app/
├── (auth)/
│   ├── login/
│   ├── register/
│   └── verify-email/
├── (dashboard)/
│   ├── dashboard/
│   ├── profile/
│   └── workspaces/
└── api/
    ├── auth/
    ├── users/
    └── workspaces/
```

---

## Directory Structure

### Complete Structure

```
nextjs-aikeedo/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth route group (no layout)
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   └── verify-email/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/              # Protected route group
│   │   │   ├── layout.tsx            # Dashboard layout
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── profile/
│   │   │   │   └── page.tsx
│   │   │   └── workspaces/
│   │   │       └── page.tsx
│   │   ├── api/                      # API routes
│   │   │   ├── auth/
│   │   │   │   ├── register/
│   │   │   │   ├── verify-email/
│   │   │   │   └── [...nextauth]/
│   │   │   ├── users/
│   │   │   │   └── me/
│   │   │   └── workspaces/
│   │   │       └── [id]/
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Home page
│   │
│   ├── lib/                          # Core libraries
│   │   ├── auth/                     # Authentication
│   │   │   ├── config.ts             # NextAuth config
│   │   │   └── session.ts            # Session utilities
│   │   ├── db/                       # Database
│   │   │   └── prisma.ts             # Prisma client
│   │   ├── email/                    # Email service
│   │   │   ├── EmailService.ts
│   │   │   └── templates/
│   │   ├── validation/               # Validation schemas
│   │   │   └── schemas.ts
│   │   └── env.ts                    # Environment config
│   │
│   ├── domain/                       # Domain layer
│   │   ├── user/
│   │   │   ├── entities/
│   │   │   │   └── User.ts
│   │   │   ├── value-objects/
│   │   │   │   ├── Email.ts
│   │   │   │   ├── Password.ts
│   │   │   │   └── PhoneNumber.ts
│   │   │   └── repositories/
│   │   │       └── UserRepository.ts
│   │   └── workspace/
│   │       ├── entities/
│   │       │   └── Workspace.ts
│   │       └── repositories/
│   │           └── WorkspaceRepository.ts
│   │
│   ├── application/                  # Application layer
│   │   ├── use-cases/
│   │   │   ├── auth/
│   │   │   │   ├── RegisterUser.ts
│   │   │   │   ├── VerifyEmail.ts
│   │   │   │   └── ResetPassword.ts
│   │   │   ├── user/
│   │   │   │   ├── UpdateProfile.ts
│   │   │   │   └── ChangePassword.ts
│   │   │   └── workspace/
│   │   │       ├── CreateWorkspace.ts
│   │   │       └── SwitchWorkspace.ts
│   │   ├── commands/
│   │   │   ├── RegisterUserCommand.ts
│   │   │   └── UpdateProfileCommand.ts
│   │   └── queries/
│   │       ├── GetUserQuery.ts
│   │       └── ListWorkspacesQuery.ts
│   │
│   ├── infrastructure/               # Infrastructure layer
│   │   ├── repositories/
│   │   │   ├── PrismaUserRepository.ts
│   │   │   └── PrismaWorkspaceRepository.ts
│   │   ├── services/
│   │   │   ├── EmailService.ts
│   │   │   └── TokenService.ts
│   │   └── adapters/
│   │       └── PrismaAdapter.ts
│   │
│   ├── components/                   # React components
│   │   ├── ui/                       # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Toast.tsx
│   │   ├── forms/                    # Form components
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   └── layouts/                  # Layout components
│   │       ├── Navbar.tsx
│   │       └── Sidebar.tsx
│   │
│   └── types/                        # TypeScript types
│       ├── next-auth.d.ts
│       └── index.ts
│
├── prisma/
│   ├── schema.prisma                 # Database schema
│   ├── migrations/                   # Database migrations
│   └── seed.ts                       # Seed script
│
├── tests/                            # Test files
│   ├── unit/                         # Unit tests
│   ├── integration/                  # Integration tests
│   └── e2e/                          # End-to-end tests
│
├── docs/                             # Documentation
│   ├── API.md
│   ├── SETUP.md
│   ├── ENVIRONMENT.md
│   └── ARCHITECTURE.md
│
└── public/                           # Static assets
    └── images/
```

---

## Design Patterns

### 1. Repository Pattern

**Purpose**: Abstracts data access logic.

**Implementation**:

```typescript
// Domain layer - Interface
interface UserRepository {
  create(data: CreateUserData): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
}

// Infrastructure layer - Implementation
class PrismaUserRepository implements UserRepository {
  async create(data: CreateUserData): Promise<User> {
    return await prisma.user.create({ data });
  }
  // ... other methods
}
```

**Benefits**:

- Decouples business logic from data access
- Easy to test with mock repositories
- Can swap implementations (Prisma → MongoDB)

### 2. Command Pattern

**Purpose**: Encapsulates requests as objects.

**Implementation**:

```typescript
// Command
class RegisterUserCommand {
  constructor(
    public email: string,
    public password: string,
    public firstName: string,
    public lastName: string
  ) {}
}

// Handler
class RegisterUserHandler {
  async execute(command: RegisterUserCommand): Promise<User> {
    // Validate, create user, send email
  }
}
```

**Benefits**:

- Separates request from execution
- Easy to add logging, validation
- Supports undo/redo operations

### 3. Value Object Pattern

**Purpose**: Represents domain concepts without identity.

**Implementation**:

```typescript
class Email {
  private constructor(private readonly value: string) {}

  static create(email: string): Email {
    if (!this.isValid(email)) {
      throw new Error('Invalid email');
    }
    return new Email(email);
  }

  private static isValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  toString(): string {
    return this.value;
  }
}
```

**Benefits**:

- Encapsulates validation
- Immutable and type-safe
- Self-documenting code

### 4. Factory Pattern

**Purpose**: Creates complex objects.

**Implementation**:

```typescript
class UserFactory {
  static createFromRegistration(
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ): User {
    return {
      id: generateId(),
      email: Email.create(email),
      password: Password.hash(password),
      firstName,
      lastName,
      role: 'USER',
      status: 'ACTIVE',
      createdAt: new Date(),
    };
  }
}
```

**Benefits**:

- Centralizes object creation
- Ensures valid object state
- Easy to modify creation logic

### 5. Middleware Pattern

**Purpose**: Processes requests in a pipeline.

**Implementation**:

```typescript
// Authentication middleware
export async function authMiddleware(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.redirect('/login');
  }
  return NextResponse.next();
}

// Rate limiting middleware
export async function rateLimitMiddleware(req: NextRequest) {
  const limited = await checkRateLimit(req.ip);
  if (limited) {
    return new NextResponse('Too many requests', { status: 429 });
  }
  return NextResponse.next();
}
```

**Benefits**:

- Separates cross-cutting concerns
- Reusable across routes
- Easy to compose

---

## Data Flow

### Request Flow

```
1. Client Request
   ↓
2. Next.js Middleware (auth, rate limit)
   ↓
3. API Route Handler
   ↓
4. Input Validation (Zod)
   ↓
5. Use Case / Command Handler
   ↓
6. Domain Logic (Entities, Value Objects)
   ↓
7. Repository (Data Access)
   ↓
8. Database (Prisma → PostgreSQL)
   ↓
9. Response Formatting
   ↓
10. Client Response
```

### Example: User Registration

```typescript
// 1. API Route (Presentation)
export async function POST(req: Request) {
  // 2. Validate input
  const body = await req.json();
  const validated = registerSchema.parse(body);

  // 3. Execute use case
  const useCase = new RegisterUserUseCase(userRepository, emailService);
  const user = await useCase.execute(validated);

  // 4. Return response
  return NextResponse.json({ data: { user } }, { status: 201 });
}

// Use Case (Application)
class RegisterUserUseCase {
  async execute(command: RegisterUserCommand): Promise<User> {
    // 5. Check if email exists
    const existing = await this.userRepository.findByEmail(command.email);
    if (existing) {
      throw new ConflictError('Email already exists');
    }

    // 6. Create user entity
    const user = User.create({
      email: Email.create(command.email),
      password: Password.hash(command.password),
      firstName: command.firstName,
      lastName: command.lastName,
    });

    // 7. Save to database
    const saved = await this.userRepository.create(user);

    // 8. Send verification email
    await this.emailService.sendVerificationEmail(saved);

    return saved;
  }
}

// Repository (Infrastructure)
class PrismaUserRepository {
  async create(user: User): Promise<User> {
    return await prisma.user.create({
      data: {
        id: user.id,
        email: user.email.toString(),
        passwordHash: user.password.hash,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  }
}
```

---

## Authentication Flow

### Registration Flow

```
1. User submits registration form
   ↓
2. POST /api/auth/register
   ↓
3. Validate input (email, password, names)
   ↓
4. Check email uniqueness
   ↓
5. Hash password with bcrypt
   ↓
6. Create user in database
   ↓
7. Create default workspace
   ↓
8. Generate verification token
   ↓
9. Send verification email
   ↓
10. Return success response
```

### Login Flow

```
1. User submits login form
   ↓
2. POST /api/auth/signin (NextAuth)
   ↓
3. Validate credentials
   ↓
4. Find user by email
   ↓
5. Verify password with bcrypt
   ↓
6. Create session in database
   ↓
7. Set session cookie
   ↓
8. Redirect to dashboard
```

### Session Management

```
1. User makes authenticated request
   ↓
2. Extract session cookie
   ↓
3. Validate session token
   ↓
4. Check session expiration
   ↓
5. Load user data
   ↓
6. Attach to request context
   ↓
7. Process request
```

---

## Database Design

### Entity Relationship Diagram

```
┌─────────────┐         ┌──────────────┐
│    User     │────────<│  Workspace   │
│             │  owns   │              │
│ - id        │         │ - id         │
│ - email     │         │ - name       │
│ - password  │         │ - ownerId    │
│ - firstName │         │ - credits    │
│ - lastName  │         └──────────────┘
│ - workspace │
└─────────────┘
      │
      │ has
      ↓
┌─────────────┐
│   Session   │
│             │
│ - id        │
│ - token     │
│ - userId    │
│ - expires   │
└─────────────┘
```

### Key Design Decisions

1. **UUIDs for IDs**: Better for distributed systems
2. **Timestamps**: All entities have createdAt/updatedAt
3. **Soft Deletes**: Not implemented (can be added)
4. **Indexes**: On frequently queried fields (email, sessionToken)
5. **Constraints**: Unique constraints on email, session tokens

---

## Testing Strategy

### Test Pyramid

```
        ┌─────────┐
        │   E2E   │  ← Few, slow, high confidence
        ├─────────┤
        │Integration│ ← Some, medium speed
        ├─────────┤
        │   Unit   │  ← Many, fast, focused
        └─────────┘
```

### Unit Tests

**What**: Individual functions, classes, components

**Tools**: Vitest, fast-check (property-based)

**Example**:

```typescript
describe('Email value object', () => {
  it('should create valid email', () => {
    const email = Email.create('test@example.com');
    expect(email.toString()).toBe('test@example.com');
  });

  it('should reject invalid email', () => {
    expect(() => Email.create('invalid')).toThrow();
  });
});
```

### Integration Tests

**What**: Multiple components working together

**Tools**: Vitest with test database

**Example**:

```typescript
describe('User registration', () => {
  it('should register user and create workspace', async () => {
    const result = await registerUser({
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'John',
      lastName: 'Doe',
    });

    expect(result.user).toBeDefined();
    expect(result.workspace.name).toBe('Personal');
  });
});
```

### End-to-End Tests

**What**: Complete user flows

**Tools**: Playwright

**Example**:

```typescript
test('user can register and login', async ({ page }) => {
  await page.goto('/register');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'Password123!');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/verify-email');
});
```

### Property-Based Tests

**What**: Test properties that should hold for all inputs

**Tools**: fast-check

**Example**:

```typescript
test('password hashing is irreversible', () => {
  fc.assert(
    fc.property(fc.string(), (password) => {
      const hash = Password.hash(password);
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(password.length);
    })
  );
});
```

---

## Performance Considerations

### Database Optimization

1. **Indexes**: On email, sessionToken, workspaceId
2. **Connection Pooling**: Prisma manages connections
3. **Query Optimization**: Select only needed fields
4. **Pagination**: Limit query results

### Caching Strategy

1. **Session Cache**: Redis for session data
2. **User Profile**: Cache for 5 minutes
3. **Workspace Data**: Cache for 1 minute
4. **Static Assets**: CDN caching

### Next.js Optimizations

1. **Server Components**: Reduce client JavaScript
2. **Streaming**: Stream responses for better UX
3. **Image Optimization**: Next.js Image component
4. **Code Splitting**: Automatic route-based splitting

### Monitoring

1. **Error Tracking**: Sentry for errors
2. **Performance**: Vercel Analytics
3. **Database**: Prisma query logging
4. **Custom Metrics**: Business KPIs

---

## Security Architecture

### Defense in Depth

```
┌─────────────────────────────────────┐
│  1. Network Layer (HTTPS, Firewall) │
├─────────────────────────────────────┤
│  2. Application Layer (Rate Limit)  │
├─────────────────────────────────────┤
│  3. Authentication (NextAuth)       │
├─────────────────────────────────────┤
│  4. Authorization (Middleware)      │
├─────────────────────────────────────┤
│  5. Input Validation (Zod)          │
├─────────────────────────────────────┤
│  6. Data Layer (Prisma, Encryption) │
└─────────────────────────────────────┘
```

### Security Measures

1. **Password Security**: bcrypt with 12 rounds
2. **Session Security**: httpOnly, secure cookies
3. **CSRF Protection**: Token validation
4. **Input Sanitization**: Zod validation
5. **SQL Injection**: Prisma parameterized queries
6. **XSS Protection**: React auto-escaping
7. **Rate Limiting**: Prevent brute force
8. **Audit Logging**: Track sensitive operations

---

## Scalability Considerations

### Horizontal Scaling

- **Stateless API**: Sessions in database, not memory
- **Load Balancing**: Multiple Next.js instances
- **Database Replication**: Read replicas for queries
- **CDN**: Static assets distributed globally

### Vertical Scaling

- **Database**: Increase PostgreSQL resources
- **Caching**: Add Redis for performance
- **Compute**: Increase server resources

### Future Enhancements

- **Microservices**: Extract modules to services
- **Event-Driven**: Use message queues
- **CQRS**: Separate read/write models
- **GraphQL**: Alternative to REST API

---

## Conclusion

This architecture provides a solid foundation for building scalable, maintainable, and testable applications. The clean separation of concerns and adherence to SOLID principles ensure the codebase remains flexible and easy to extend as requirements evolve.
