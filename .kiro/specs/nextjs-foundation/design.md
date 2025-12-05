# Design Document

## Overview

This design document outlines the architecture and implementation approach for the Next.js foundation module of AIKEEDO. The foundation establishes the core infrastructure including authentication, user management, workspace multi-tenancy, and API patterns that all subsequent modules will build upon.

The design follows modern Next.js 14 patterns with App Router, server components, and server actions, while maintaining clean architecture principles similar to the original PHP DDD implementation.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  (React Components, Client Components, Forms)                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  (Server Components, API Routes, Server Actions)             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  (Use Cases, Commands, Validation, Business Logic)           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                       Domain Layer                           │
│  (Entities, Value Objects, Domain Logic)                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                       │
│  (Prisma ORM, Database, External Services, Email)            │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
nextjs-aikeedo/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/              # Auth routes group
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── verify-email/
│   │   ├── (dashboard)/         # Protected routes group
│   │   │   ├── dashboard/
│   │   │   ├── profile/
│   │   │   └── workspaces/
│   │   ├── api/                 # API routes
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   └── workspaces/
│   │   └── layout.tsx
│   ├── lib/                     # Core libraries
│   │   ├── auth/               # Authentication logic
│   │   ├── db/                 # Database client
│   │   ├── email/              # Email service
│   │   └── validation/         # Validation schemas
│   ├── domain/                  # Domain layer
│   │   ├── user/
│   │   │   ├── entities/
│   │   │   ├── value-objects/
│   │   │   └── repositories/
│   │   └── workspace/
│   ├── application/             # Application layer
│   │   ├── use-cases/
│   │   ├── commands/
│   │   └── queries/
│   ├── infrastructure/          # Infrastructure layer
│   │   ├── repositories/
│   │   ├── services/
│   │   └── adapters/
│   ├── components/              # React components
│   │   ├── ui/                 # Reusable UI components
│   │   ├── forms/              # Form components
│   │   └── layouts/            # Layout components
│   └── types/                   # TypeScript types
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
└── tests/
```

## Components and Interfaces

### Authentication System

**NextAuth.js Configuration**
- Provider: Credentials (email/password)
- Session strategy: Database sessions
- JWT for session tokens
- Custom pages for login, register, error

**Auth Middleware**
- Protects routes requiring authentication
- Redirects unauthenticated users to login
- Validates session on each request

**Password Hashing**
- Library: bcrypt
- Salt rounds: 12
- Comparison using constant-time algorithm

### User Management

**User Repository Interface**
```typescript
interface UserRepository {
  create(data: CreateUserData): Promise<User>
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  update(id: string, data: UpdateUserData): Promise<User>
  delete(id: string): Promise<void>
}
```

**User Service**
```typescript
interface UserService {
  register(email: string, password: string, firstName: string, lastName: string): Promise<User>
  verifyEmail(token: string): Promise<void>
  requestPasswordReset(email: string): Promise<void>
  resetPassword(token: string, newPassword: string): Promise<void>
  updateProfile(userId: string, data: ProfileData): Promise<User>
}
```

### Workspace Management

**Workspace Repository Interface**
```typescript
interface WorkspaceRepository {
  create(ownerId: string, name: string): Promise<Workspace>
  findById(id: string): Promise<Workspace | null>
  findByUserId(userId: string): Promise<Workspace[]>
  update(id: string, data: UpdateWorkspaceData): Promise<Workspace>
  addMember(workspaceId: string, userId: string): Promise<void>
  removeMember(workspaceId: string, userId: string): Promise<void>
}
```

## Data Models

### User Entity

```typescript
type User = {
  id: string                    // UUID
  email: string                 // Unique, validated email
  emailVerified: Date | null    // Timestamp of verification
  passwordHash: string          // Bcrypt hash
  firstName: string
  lastName: string
  phoneNumber: string | null
  language: string              // ISO language code
  role: 'USER' | 'ADMIN'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  apiKey: string | null         // For API access
  currentWorkspaceId: string    // Active workspace
  createdAt: Date
  updatedAt: Date
  lastSeenAt: Date | null
}
```

### Workspace Entity

```typescript
type Workspace = {
  id: string                    // UUID
  name: string
  ownerId: string               // User who owns workspace
  creditCount: number           // Available credits
  allocatedCredits: number      // Credits in use
  isTrialed: boolean            // Has used trial
  createdAt: Date
  updatedAt: Date
  creditsAdjustedAt: Date | null
}
```

### Session Entity

```typescript
type Session = {
  id: string                    // UUID
  sessionToken: string          // Unique token
  userId: string
  expires: Date
  createdAt: Date
  updatedAt: Date
}
```

### Account Entity (for OAuth future support)

```typescript
type Account = {
  id: string
  userId: string
  type: string                  // 'oauth' | 'email'
  provider: string              // 'google' | 'github' | 'credentials'
  providerAccountId: string
  refreshToken: string | null
  accessToken: string | null
  expiresAt: number | null
  tokenType: string | null
  scope: string | null
  idToken: string | null
  sessionState: string | null
}
```

### VerificationToken Entity

```typescript
type VerificationToken = {
  identifier: string            // Email address
  token: string                 // Unique token
  expires: Date
  type: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET'
  createdAt: Date
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Password hashing is irreversible
*For any* valid password string, after hashing, it should be impossible to retrieve the original password from the hash alone
**Validates: Requirements 3.4, 12.1**

### Property 2: Email uniqueness
*For any* two user registration attempts with the same email address, only the first should succeed and the second should fail with a unique constraint error
**Validates: Requirements 3.1**

### Property 3: Session token uniqueness
*For any* two session creation attempts, each should generate a unique session token that does not collide with existing tokens
**Validates: Requirements 6.1**

### Property 4: Password verification correctness
*For any* user with a stored password hash, verifying with the correct password should succeed and verifying with any incorrect password should fail
**Validates: Requirements 3.2, 3.3**

### Property 5: Email verification token expiration
*For any* verification token that has expired, attempting to verify an email with that token should fail regardless of whether the token is otherwise valid
**Validates: Requirements 4.3**

### Property 6: Session expiration enforcement
*For any* session that has passed its expiration date, authentication attempts using that session should fail
**Validates: Requirements 6.4, 6.5**

### Property 7: Workspace ownership
*For any* workspace, there should be exactly one owner at any given time, and the owner should be a valid user
**Validates: Requirements 8.2**

### Property 8: Default workspace creation
*For any* new user registration, the system should automatically create exactly one default workspace named "Personal" owned by that user
**Validates: Requirements 8.1**

### Property 9: Profile update requires authentication
*For any* profile update request, the request should only succeed if it includes a valid, non-expired session token for the user being updated
**Validates: Requirements 7.2**

### Property 10: Password change requires current password
*For any* password change request, the request should only succeed if the provided current password matches the stored password hash
**Validates: Requirements 7.4**

### Property 11: Email change triggers re-verification
*For any* email address change, the new email should be marked as unverified and a verification email should be sent
**Validates: Requirements 7.3**

### Property 12: Password reset invalidates sessions
*For any* successful password reset, all existing sessions for that user should be invalidated
**Validates: Requirements 5.5**

### Property 13: API error responses are consistent
*For any* API error, the response should include a consistent structure with status code, message, and optional field-specific errors
**Validates: Requirements 9.1, 9.2, 9.3**

### Property 14: Input validation prevents injection
*For any* user input containing special characters or SQL/script injection attempts, the validation layer should sanitize or reject the input before it reaches the database
**Validates: Requirements 12.4**

### Property 15: Workspace credit allocation
*For any* workspace, the sum of allocated credits should never exceed the total available credits
**Validates: Requirements 8.5**

## Error Handling

### Error Types

1. **ValidationError**: Input data fails validation rules
2. **AuthenticationError**: Invalid credentials or expired session
3. **AuthorizationError**: User lacks permission for action
4. **NotFoundError**: Requested resource doesn't exist
5. **ConflictError**: Resource already exists (e.g., duplicate email)
6. **ServerError**: Unexpected server-side error

### Error Response Format

```typescript
type ErrorResponse = {
  error: {
    code: string              // Machine-readable error code
    message: string           // Human-readable message
    fields?: {                // Field-specific errors
      [key: string]: string[]
    }
  }
}
```

### Error Handling Strategy

- All errors are caught at the API route level
- Validation errors return 400 with field details
- Authentication errors return 401
- Authorization errors return 403
- Not found errors return 404
- Server errors return 500 with generic message (details logged)
- All errors are logged with context for debugging

## Testing Strategy

### Unit Testing

**Framework**: Vitest

**Coverage Areas**:
- Value object validation (Email, Password, etc.)
- Domain entity business logic
- Use case command handlers
- Utility functions (password hashing, token generation)

**Example Tests**:
- Email value object rejects invalid formats
- Password hashing produces different hashes for same input
- User entity validates required fields
- Workspace credit calculations are accurate

### Property-Based Testing

**Framework**: fast-check

**Configuration**: Minimum 100 iterations per property test

**Property Tests** (matching correctness properties):
- Property 1: Password hashing irreversibility
- Property 2: Email uniqueness enforcement
- Property 3: Session token uniqueness
- Property 4: Password verification correctness
- Property 8: Default workspace creation
- Property 15: Workspace credit allocation constraints

Each property test will be tagged with:
```typescript
// Feature: nextjs-foundation, Property 1: Password hashing is irreversible
```

### Integration Testing

**Framework**: Playwright

**Coverage Areas**:
- Complete authentication flows (register → verify → login)
- Password reset flow
- Profile update flow
- Workspace creation and switching
- API endpoint responses

### End-to-End Testing

**Framework**: Playwright

**Critical Paths**:
- New user registration through first login
- Password recovery flow
- Multi-workspace navigation
- Session expiration handling

## Security Considerations

### Authentication Security

- Passwords hashed with bcrypt (12 rounds)
- Session tokens are cryptographically random
- Sessions stored server-side in database
- Cookies are httpOnly and secure (HTTPS only)
- CSRF protection on all mutations

### Input Validation

- All inputs validated with Zod schemas
- SQL injection prevented by Prisma parameterized queries
- XSS prevented by React's automatic escaping
- Email addresses validated against RFC 5322
- Phone numbers validated with libphonenumber-js

### Rate Limiting

- Login attempts: 5 per 15 minutes per IP
- Registration: 3 per hour per IP
- Password reset: 3 per hour per email
- API requests: 100 per minute per user

### Data Protection

- Sensitive data encrypted at rest (database level)
- TLS/HTTPS required for all connections
- Environment variables never exposed to client
- API keys stored hashed in database
- Audit logging for sensitive operations

## Performance Considerations

### Database Optimization

- Indexes on frequently queried fields (email, sessionToken)
- Connection pooling with Prisma
- Query optimization with select specific fields
- Pagination for list queries

### Caching Strategy

- Session data cached in Redis (optional)
- User profile cached for 5 minutes
- Workspace data cached for 1 minute
- Static assets cached with CDN

### Server Components

- Use React Server Components for data fetching
- Minimize client-side JavaScript
- Stream responses for better perceived performance
- Parallel data fetching where possible

## Deployment Considerations

### Environment Variables

Required:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Random secret for session encryption
- `NEXTAUTH_URL`: Application URL
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`: Email configuration

Optional:
- `REDIS_URL`: Redis connection for caching
- `SENTRY_DSN`: Error tracking
- `RATE_LIMIT_REDIS_URL`: Redis for rate limiting

### Database Migrations

- Use Prisma Migrate for schema changes
- Run migrations before deployment
- Backup database before migrations
- Test migrations in staging environment

### Monitoring

- Error tracking with Sentry
- Performance monitoring with Vercel Analytics
- Database query monitoring with Prisma
- Custom metrics for business KPIs

## Future Extensibility

### OAuth Providers

The Account entity is designed to support OAuth providers (Google, GitHub, etc.) in future iterations. The authentication system can be extended without breaking changes.

### API Versioning

API routes are structured to support versioning:
- `/api/v1/users`
- `/api/v2/users`

### Multi-Region Support

Database schema includes timezone-aware timestamps and can support multi-region deployment with read replicas.

### Microservices Migration

The clean architecture allows individual modules to be extracted into microservices if needed, with minimal refactoring.
