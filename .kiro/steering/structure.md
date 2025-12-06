# Project Structure

## Architecture Pattern

The project follows **Clean Architecture** with **Domain-Driven Design (DDD)** principles:

```
Presentation Layer (UI/API) → Application Layer (Use Cases) → Domain Layer (Business Logic) → Infrastructure Layer (Database/External Services)
```

**Key principle**: Inner layers never depend on outer layers. Dependencies point inward.

## Directory Organization

### `/app/` - Next.js App Router (Presentation Layer)

- **`(auth)/`**: Authentication routes (login, register, logout)
  - `auth/`: NextAuth.js callback routes
  - `login/`: Login page
  - `logout/`: Logout page
  - `register/`: Registration page
  - `layout.tsx`: Auth-specific layout (no navigation)
- **`(dashboard)/`**: Protected dashboard routes with shared layout
  - `admin/`: Admin dashboard (impersonation, audit logs, content moderation, reporting)
  - `affiliate/`: Affiliate dashboard and payout management
  - `billing/`: Billing, subscriptions, invoices, and payment methods
  - `chat/`: AI chat interface with streaming support
  - `dashboard/`: Main dashboard home page
  - `documents/`: Document management and editing
  - `files/`: File upload and management
  - `generate/`: AI text generation interface
  - `images/`: AI image generation interface
  - `presets/`: Prompt presets management
  - `profile/`: User profile settings
  - `settings/`: User and workspace settings
  - `speech/`: Text-to-speech generation
  - `transcribe/`: Audio transcription
  - `usage/`: Usage statistics and history
  - `voices/`: Voice cloning management
  - `workspaces/`: Workspace management
  - `layout.tsx`: Dashboard layout with navigation and sidebar
  - `error.tsx`: Dashboard error boundary
- **`api/`**: API route handlers organized by resource
  - `admin/`: Admin operations (impersonation, audit logs, moderation, reporting)
  - `affiliate/`: Affiliate and payout endpoints
  - `ai/`: AI service endpoints (chat, generate, images, speech, transcribe)
  - `auth/`: Authentication endpoints (NextAuth.js routes)
  - `billing/`: Billing, subscriptions, invoices, payment methods
  - `conversations/`: Chat conversation management
  - `dev/`: Development utilities and testing endpoints
  - `documents/`: Document CRUD operations
  - `files/`: File upload and management
  - `media/`: Media processing and optimization
  - `presets/`: Preset management
  - `usage/`: Usage tracking and statistics
  - `users/`: User management and profile updates
  - `voices/`: Voice cloning operations
  - `webhooks/`: Stripe webhook handlers
  - `workspaces/`: Workspace CRUD operations
- **`fonts/`**: Custom font files (Geist, Geist Mono)
- **Root files**:
  - `layout.tsx`: Root layout with providers and global styles
  - `page.tsx`: Landing page
  - `error.tsx`: Global error boundary
  - `not-found.tsx`: 404 page
  - `globals.css`: Global styles and Tailwind imports

**Route Groups**: `(auth)` and `(dashboard)` don't affect URL structure but allow different layouts and shared components.

### `/src/domain/` - Domain Layer

Core business logic, framework-agnostic:

- **`entities/`**: Business objects with identity (User, Workspace, etc.)
- **`value-objects/`**: Immutable domain concepts (Email, Password, etc.)
- **`repositories/`**: Interfaces for data access (no implementations)

**Rules**:

- No dependencies on other layers
- Pure TypeScript, no framework code
- Highly testable

### `/src/application/` - Application Layer

Orchestrates domain objects to fulfill use cases:

- **`use-cases/`**: Business operations organized by domain (auth, user, workspace, billing, etc.)
- **`commands/`**: Request objects for write operations
- **`queries/`**: Request objects for read operations

**Rules**:

- Depends only on domain layer
- Coordinates domain entities
- Defines transaction boundaries

### `/src/infrastructure/` - Infrastructure Layer

Technical implementations:

- **`repositories/`**: Concrete implementations of domain repository interfaces (Prisma)
- **`services/`**: External service integrations (email, storage, Stripe, AI providers)
- **`adapters/`**: Convert between layers

**Rules**:

- Implements domain interfaces
- Contains framework-specific code
- No business logic

### `/src/lib/` - Shared Libraries

Cross-cutting concerns and utilities:

- **`admin/`**: Admin tools (impersonation, audit logging, support utilities)
- **`affiliate/`**: Affiliate tracking, commission calculation, referral processing
- **`ai/`**: AI provider factory, base classes, error handling, circuit breaker, retry logic, streaming handler, credit calculator
- **`auth/`**: NextAuth configuration, session management, token handling, admin guards, cleanup utilities
- **`billing/`**: Checkout, payment methods, credit management, subscription handling
- **`cache/`**: Cache manager, session cache, route cache, Redis integration
- **`db/`**: Prisma client, query optimizer, connection pooling, test database utilities
- **`email/`**: Email service, templates, SMTP configuration, helpers
- **`errors/`**: Custom error classes, error handler, logger, error boundaries
- **`hooks/`**: React hooks for common operations (admin, checkout, impersonation, lazy loading)
- **`middleware/`**: Rate limiting (Redis & in-memory), CSRF protection, validation, security headers, admin guards, workspace ownership
- **`performance/`**: Component optimization, lazy loading, preloading, performance middleware
- **`security/`**: Input sanitization, XSS prevention
- **`storage/`**: File storage abstraction (S3, local), presigned URLs
- **`testing/`**: Test helpers, factories, property-based testing utilities, test fixtures, test database
- **`validation/`**: Zod schemas for all inputs, credit validation
- **Root utilities**:
  - `api-client.ts`: Type-safe API client with React Query
  - `config.ts`: Configuration loader and manager
  - `env.ts`: Environment variable validation
  - `query-client.tsx`: React Query client configuration
  - `stripe.ts`: Stripe client initialization
  - `component-preloader.ts`: Component preloading utilities
  - `lazy-loading.tsx`: Lazy loading components
  - `performance.ts`: Performance monitoring
  - `init.ts`: Application initialization

### `/src/components/` - React Components

- **`ui/`**: Reusable UI components (Button, Input, Toast, Modal, Card, etc.)
- **`forms/`**: Form components with validation
- **`layouts/`**: Layout components (Header, Sidebar, Footer)
- **`documents/`**: Document-specific components (editor, viewer)
- **`[feature]/`**: Feature-specific component groups

**Component Guidelines**:

- Use Server Components by default, Client Components only when needed
- Co-locate styles with components using Tailwind
- Export components as named exports
- Include TypeScript prop types
- Add JSDoc comments for complex components

### `/src/types/` - TypeScript Types

Global type definitions and type augmentations:

- `next-auth.d.ts`: NextAuth type extensions
- `billing.ts`: Billing-related types
- `affiliate.ts`: Affiliate system types
- `redis.d.ts`: Redis type definitions

### `/prisma/` - Database

- **`schema.prisma`**: Database schema definition
- **`migrations/`**: Database migration files
- **`seed.ts`**: Database seeding script

### `/tests/` - Tests

- **`e2e/`**: Playwright end-to-end tests
- Unit/integration tests are co-located with source files (`.test.ts`, `.spec.ts`)

### `/docs/` - Documentation

Comprehensive documentation:

- `SETUP.md`: Installation and setup guide
- `API.md`: Complete API endpoint reference
- `ARCHITECTURE.md`: System architecture and design patterns
- `ENVIRONMENT.md`: Environment variables reference
- `CONFIGURATION.md`: Configuration system guide
- `ADMIN_DASHBOARD.md`: Admin features and tools
- `AI_PROVIDERS_SETUP.md`: AI provider configuration
- `AI_SERVICES.md`: AI service integration guide
- `BILLING.md`: Billing system documentation
- `BILLING_QUICK_START.md`: Quick start for billing
- `CONTENT_MANAGEMENT.md`: Content management features
- `CREDIT_SYSTEM.md`: Credit system details
- `PLAN_MANAGEMENT.md`: Subscription plan management
- `RATE_LIMITING.md`: Rate limiting configuration
- `VOICE_CLONING.md`: Voice cloning features
- `INDEX.md`: Documentation index
- `README.md`: Documentation overview

### `/config/` - Configuration System

Centralized configuration management:

- **`app.config.ts`**: Default application configuration
- **`config-loader.ts`**: Configuration loading and merging logic
- **`custom.config.example.ts`**: Example custom configuration
- **`env/`**: Environment-specific configurations
- **`QUICK_REFERENCE.md`**: Quick reference for common tasks
- **`README.md`**: Configuration system documentation

### `/scripts/` - Utility Scripts

Development and testing utilities:

- `test-db.sh`: Docker test database management (start, stop, restart, reset, logs, status)
- `verify-setup.js`: Setup verification script
- `config-manager.ts`: Configuration management CLI
- `demo-config.ts`: Configuration demo script
- `find-hardcoded-values.ts`: Find hardcoded values in code
- `dev-utils-demo.ts`: Development utilities demo
- `test-*.ts`: Feature testing scripts

## Path Aliases

TypeScript path aliases are configured in `tsconfig.json`:

```typescript
import { User } from '@/domain/user/entities/User';
import { prisma } from '@/lib/db/prisma';
import { Button } from '@/components/ui/Button';
```

Available aliases:

- `@/*` → `./src/*`
- `@/app/*` → `./app/*`
- `@/components/*` → `./src/components/*`
- `@/lib/*` → `./src/lib/*`
- `@/domain/*` → `./src/domain/*`
- `@/application/*` → `./src/application/*`
- `@/infrastructure/*` → `./src/infrastructure/*`
- `@/types/*` → `./src/types/*`

## File Naming Conventions

- **Components**: PascalCase (e.g., `Button.tsx`, `UserProfile.tsx`)
- **Utilities/Services**: kebab-case (e.g., `email-service.ts`, `query-optimizer.ts`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth.ts`, `useCheckout.ts`)
- **Types**: PascalCase for interfaces/types (e.g., `User.ts`, `Workspace.ts`)
- **Constants**: UPPER_SNAKE_CASE in `constants.ts` files
- **Tests**: Same name as file with `.test.ts` or `.spec.ts` suffix
- **API Routes**: kebab-case folders with `route.ts` file
- **Pages**: `page.tsx` in folder matching route
- **Layouts**: `layout.tsx` in folder
- **Loading States**: `loading.tsx` in folder
- **Error Boundaries**: `error.tsx` in folder
- **Not Found**: `not-found.tsx` in folder

**Examples**:

- Component: `src/components/ui/Button.tsx`
- Service: `src/lib/email/email-service.ts`
- Hook: `src/lib/hooks/useAuth.ts`
- Type: `src/types/User.ts`
- Test: `src/lib/email/email-service.test.ts`
- API Route: `app/api/users/[id]/route.ts`
- Page: `app/(dashboard)/billing/page.tsx`

## Code Organization Patterns

### API Routes

```
src/app/api/
├── [resource]/
│   ├── route.ts              # GET /api/resource, POST /api/resource
│   └── [id]/
│       ├── route.ts          # GET /api/resource/:id, PATCH, DELETE
│       └── [action]/
│           └── route.ts      # POST /api/resource/:id/action
```

### Domain Organization

```
src/domain/[domain-name]/
├── entities/
│   └── [EntityName].ts
├── value-objects/
│   └── [ValueObjectName].ts
├── repositories/
│   └── [EntityName]Repository.ts    # Interface only
└── __tests__/
    └── [EntityName].test.ts
```

### Use Cases

```
src/application/use-cases/[domain]/
├── [ActionName].ts           # Use case implementation
└── __tests__/
    └── [ActionName].test.ts
```

### Infrastructure

```
src/infrastructure/
├── repositories/
│   └── Prisma[EntityName]Repository.ts    # Implementation
└── services/
    └── [ServiceName]Service.ts
```

## Import Order Convention

Follow this order for imports:

1. **React and Next.js**: `react`, `react-dom`, `next/*`
2. **External packages**: Third-party libraries (alphabetically)
3. **Internal aliases**: `@/domain/*`, `@/application/*`, `@/infrastructure/*`, `@/lib/*`, `@/components/*`
4. **Relative imports**: `./`, `../`
5. **Type imports**: Separate type-only imports when possible
6. **Styles**: CSS/SCSS imports last

**Example**:

```typescript
import { useState } from 'react';
import { redirect } from 'next/navigation';

import { prisma } from '@/lib/db/prisma';
import { Button } from '@/components/ui/Button';

import { formatDate } from './utils';

import type { User } from '@/domain/user/entities/User';
```

## Testing Strategy

- **Unit tests**: Co-located with source files (`.test.ts` or `.spec.ts`)
- **Integration tests**: In `__tests__` folders within feature directories
- **E2E tests**: In `/tests/e2e/` directory using Playwright
- **Property-based tests**: Use fast-check for domain logic and edge cases
- **Test Database**: Docker-based PostgreSQL for isolated testing

**Testing Best Practices**:

- Write tests for all business logic
- Use property-based testing for domain entities
- Mock external services (AI providers, Stripe, email)
- Use test factories for consistent test data
- Run tests before committing code

## Documentation Location

- **Feature docs**: In feature directory (e.g., `src/lib/admin/README.md`)
- **Architecture docs**: In `/docs/` directory
- **API docs**: In `/docs/API.md`
- **Configuration docs**: In `/config/` and `/docs/CONFIGURATION.md`
- **Implementation summaries**: Co-located with features (e.g., `IMPLEMENTATION_SUMMARY.md`)
- **Inline docs**: JSDoc comments for complex functions and components

## Best Practices & Conventions

### Code Organization

- Keep files focused and single-purpose
- Co-locate related files (components, tests, styles)
- Use barrel exports (`index.ts`) for clean imports
- Organize by feature, not by file type

### TypeScript

- Enable strict mode (already configured)
- Use explicit return types for functions
- Prefer interfaces over types for object shapes
- Use type guards for runtime type checking
- Avoid `any` - use `unknown` if type is truly unknown

### React & Next.js

- Use Server Components by default
- Add `'use client'` only when needed (hooks, events, browser APIs)
- Prefer async Server Components over `useEffect` for data fetching
- Use Next.js Image component for all images
- Implement proper loading and error states

### API Routes

- Validate all inputs with Zod schemas
- Use proper HTTP status codes
- Return consistent error responses
- Implement rate limiting on public endpoints
- Add authentication checks at the route level

### Database

- Use Prisma transactions for multi-step operations
- Implement proper indexes for query performance
- Use connection pooling in production
- Avoid N+1 queries with proper includes
- Use soft deletes for important data

### Security

- Validate and sanitize all user inputs
- Use parameterized queries (Prisma handles this)
- Implement CSRF protection on mutations
- Set secure cookie flags
- Add rate limiting to prevent abuse
- Log security-relevant events

### Performance

- Lazy load components not needed on initial render
- Preload critical routes and components
- Implement proper caching strategies
- Optimize images and assets
- Use React Query for data caching
- Monitor bundle sizes

### Error Handling

- Use custom error classes for different error types
- Log errors with context
- Return user-friendly error messages
- Implement error boundaries in React
- Handle async errors properly

### Git Workflow

- Use conventional commit messages
- Keep commits atomic and focused
- Write descriptive commit messages
- Review changes before committing
- Run tests before pushing

## Common Patterns

### API Route Pattern

```typescript
// app/api/resource/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

const schema = z.object({
  name: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Validation
    const body = await request.json();
    const data = schema.parse(body);

    // 3. Business logic
    const result = await createResource(data);

    // 4. Response
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    // 5. Error handling
    return handleApiError(error);
  }
}
```

### Server Component Pattern

```typescript
// app/(dashboard)/page.tsx
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

export default async function DashboardPage() {
  // 1. Authentication
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }

  // 2. Data fetching
  const data = await prisma.workspace.findMany({
    where: { userId: session.user.id },
  });

  // 3. Render
  return <div>{/* Component JSX */}</div>;
}
```

### Client Component Pattern

```typescript
// components/InteractiveButton.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function InteractiveButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClick = async () => {
    setLoading(true);
    try {
      await performAction();
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return <button onClick={handleClick}>{/* Button content */}</button>;
}
```

### Use Case Pattern

```typescript
// src/application/use-cases/user/CreateUser.ts
import type { UserRepository } from '@/domain/user/repositories/UserRepository';
import { User } from '@/domain/user/entities/User';
import { Email } from '@/domain/user/value-objects/Email';
import { Password } from '@/domain/user/value-objects/Password';

export class CreateUser {
  constructor(private userRepository: UserRepository) {}

  async execute(data: { email: string; password: string }): Promise<User> {
    // 1. Create value objects
    const email = new Email(data.email);
    const password = await Password.create(data.password);

    // 2. Check business rules
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // 3. Create entity
    const user = User.create({ email, password });

    // 4. Persist
    await this.userRepository.save(user);

    return user;
  }
}
```

### Repository Pattern

```typescript
// src/infrastructure/repositories/PrismaUserRepository.ts
import { prisma } from '@/lib/db/prisma';
import type { UserRepository } from '@/domain/user/repositories/UserRepository';
import type { User } from '@/domain/user/entities/User';
import type { Email } from '@/domain/user/value-objects/Email';

export class PrismaUserRepository implements UserRepository {
  async findByEmail(email: Email): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { email: email.value },
    });
    return user ? this.toDomain(user) : null;
  }

  async save(user: User): Promise<void> {
    await prisma.user.create({
      data: this.toPersistence(user),
    });
  }

  private toDomain(raw: any): User {
    // Convert database model to domain entity
  }

  private toPersistence(user: User): any {
    // Convert domain entity to database model
  }
}
```

### Error Handling Pattern

```typescript
// src/lib/errors/handler.ts
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export function handleApiError(error: unknown) {
  // Validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: 'Validation failed', details: error.errors },
      { status: 400 }
    );
  }

  // Database errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Resource already exists' },
        { status: 409 }
      );
    }
  }

  // Custom errors
  if (error instanceof CustomError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }

  // Unknown errors
  console.error('Unexpected error:', error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
```

## Troubleshooting Common Issues

### Database Connection Issues

- Verify `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running
- Check network connectivity
- Verify database exists
- Run `npm run db:generate` after schema changes

### Build Errors

- Clear `.next` folder: `rm -rf .next`
- Regenerate Prisma client: `npm run db:generate`
- Check TypeScript errors: `npm run type-check`
- Verify all dependencies installed: `npm install`

### Authentication Issues

- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your domain
- Clear browser cookies
- Check session expiration settings

### AI Provider Errors

- Verify API keys are correct
- Check API key permissions
- Monitor rate limits
- Check provider status pages
- Review error logs for details

### Performance Issues

- Enable Redis caching
- Check database query performance
- Review bundle size: `npm run build`
- Enable production optimizations
- Monitor server resources

### Test Failures

- Start test database: `npm run test-db:start`
- Reset test database: `npm run test-db:reset`
- Check test isolation
- Review test logs
- Run tests individually to isolate issues
