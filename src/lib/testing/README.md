# Testing Utilities

This directory contains utilities for testing and development, including factories for creating test data and helper functions.

## Factories

Factories provide a convenient way to create test data with sensible defaults while allowing customization.

### UserFactory

Create test users with various configurations:

```typescript
import { prisma } from '@/lib/db';
import { UserFactory } from '@/lib/testing';

const factory = new UserFactory(prisma);

// Create a basic user
const { user, password } = await factory.create();

// Create a verified user
const { user, password } = await factory.createVerified({
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
});

// Create an admin user
const { user, password } = await factory.createAdmin();

// Create a user with a workspace
const { user, workspace, password } = await factory.createWithWorkspace();

// Create multiple users
const users = await factory.createMany(5);
```

### WorkspaceFactory

Create test workspaces with various configurations:

```typescript
import { prisma } from '@/lib/db';
import { WorkspaceFactory } from '@/lib/testing';

const factory = new WorkspaceFactory(prisma);

// Create a basic workspace
const workspace = await factory.create();

// Create a workspace with credits
const workspace = await factory.createWithCredits(1000);

// Create a workspace with members
const { workspace, members } = await factory.createWithMembers(3);

// Create a workspace for a specific user
const workspace = await factory.createForUser(userId, {
  name: 'My Workspace',
  creditCount: 500,
});
```

## Helpers

### createFactories

Get all factories in one object:

```typescript
import { prisma } from '@/lib/db';
import { createFactories } from '@/lib/testing';

const factories = createFactories(prisma);
const { user, password } = await factories.user.create();
const workspace = await factories.workspace.create();
```

### cleanupTestData

Remove all test data from the database:

```typescript
import { prisma } from '@/lib/db';
import { cleanupTestData } from '@/lib/testing';

await cleanupTestData(prisma);
```

### resetDatabase

Reset the database to a clean state:

```typescript
import { prisma } from '@/lib/db';
import { resetDatabase } from '@/lib/testing';

await resetDatabase(prisma);
```

### createTestScenario

Create a complete test scenario with multiple users and workspaces:

```typescript
import { prisma } from '@/lib/db';
import { createTestScenario } from '@/lib/testing';

const scenario = await createTestScenario(prisma);
// Returns: { admin, user, unverified, sharedWorkspace }
```

## Usage in Tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/db';
import { UserFactory, cleanupTestData } from '@/lib/testing';

describe('User Tests', () => {
  const factory = new UserFactory(prisma);

  beforeEach(async () => {
    await cleanupTestData(prisma);
  });

  it('should create a user', async () => {
    const { user, password } = await factory.create();
    expect(user.email).toBeDefined();
    expect(password).toBe('password123');
  });
});
```

## Development API Routes

Development-only API routes are available at `/api/dev/*` (only in development mode):

### POST /api/dev/seed

Seed the database with a complete test scenario:

```bash
curl -X POST http://localhost:3000/api/dev/seed
```

Response:

```json
{
  "success": true,
  "message": "Database seeded successfully",
  "data": {
    "admin": {
      "email": "admin@test.com",
      "password": "password123",
      "workspaceId": "..."
    },
    "user": {
      "email": "user@test.com",
      "password": "password123",
      "workspaceId": "..."
    }
  }
}
```

### POST /api/dev/reset

Reset the database to a clean state:

```bash
curl -X POST http://localhost:3000/api/dev/reset
```

### POST /api/dev/users

Create a test user:

```bash
curl -X POST http://localhost:3000/api/dev/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "role": "USER",
    "emailVerified": true,
    "withWorkspace": true
  }'
```

### POST /api/dev/workspaces

Create a test workspace:

```bash
curl -X POST http://localhost:3000/api/dev/workspaces \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Workspace",
    "ownerId": "user-id",
    "creditCount": 1000,
    "memberCount": 3
  }'
```

## Requirements

These utilities satisfy Requirement 2.5: Database seeding and test data management.
