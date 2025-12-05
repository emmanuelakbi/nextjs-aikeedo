# Prisma Database Schema

This directory contains the Prisma schema and configuration for the AIKEEDO Next.js application.

## Schema Overview

The database schema includes the following models:

### User

- Core user entity with authentication and profile information
- Fields: email, passwordHash, firstName, lastName, phoneNumber, language, role, status, apiKey
- Relations: sessions, accounts, workspaces (owned and member)
- Requirements: 2.3, 3.1, 3.2, 3.4, 7.1

### Workspace

- Multi-tenant workspace entity for organizing users and data
- Fields: name, ownerId, creditCount, allocatedCredits, isTrialed
- Relations: owner, members, currentUsers
- Requirements: 2.3, 8.1, 8.2, 8.3, 8.4, 8.5

### WorkspaceMember

- Join table for workspace membership
- Fields: workspaceId, userId, role
- Requirements: 8.2, 8.3

### Session

- User session management for authentication
- Fields: sessionToken, userId, expires
- Requirements: 2.3, 6.1, 6.2, 6.4, 6.5

### Account

- OAuth and external authentication provider accounts
- Fields: provider, providerAccountId, accessToken, refreshToken, etc.
- Requirements: 2.3

### VerificationToken

- Email verification and password reset tokens
- Fields: identifier, token, expires, type
- Requirements: 2.3, 4.1, 4.3, 5.1, 5.2

## Performance Optimizations

The schema includes the following indexes for optimal query performance:

- User: email, apiKey, currentWorkspaceId
- Workspace: ownerId
- WorkspaceMember: workspaceId, userId, unique(workspaceId, userId)
- Session: sessionToken, userId, expires
- Account: userId, unique(provider, providerAccountId)
- VerificationToken: token, expires, unique(identifier, token)

## Commands

```bash
# Generate Prisma Client
npm run db:generate

# Create a new migration
npm run db:migrate

# Push schema changes to database (development only)
npm run db:push

# Open Prisma Studio (database GUI)
npm run db:studio

# Validate schema
npx prisma validate

# Format schema file
npx prisma format
```

## Configuration

Database connection is configured via `prisma.config.ts` which reads the `DATABASE_URL` environment variable.

## Usage

Import the Prisma client in your code:

```typescript
import { prisma } from '@/lib/db';

// Example: Find user by email
const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' },
});
```

## Notes

- All timestamps use UTC timezone
- UUIDs are used for all primary keys
- Cascade deletes are configured for related entities
- The schema follows the design document specifications
