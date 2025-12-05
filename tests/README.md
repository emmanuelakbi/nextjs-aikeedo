# Testing Infrastructure

This directory contains the testing infrastructure for the Next.js AIKEEDO application.

## Overview

The testing infrastructure supports three types of tests:

1. **Unit Tests** - Test individual functions, classes, and modules in isolation
2. **Property-Based Tests** - Test universal properties across many generated inputs using fast-check
3. **End-to-End Tests** - Test complete user flows using Playwright

## Directory Structure

```
tests/
├── e2e/                    # Playwright end-to-end tests
│   └── example.spec.ts     # Example e2e test
└── README.md               # This file

src/lib/testing/            # Testing utilities (co-located with source)
├── test-helpers.ts         # Test data creation helpers
├── test-db.ts              # Database utilities for tests
├── property-test-helpers.ts # Property-based testing utilities
└── __tests__/              # Tests for testing utilities
```

## Running Tests

### Unit Tests (Vitest)

```bash
# Run all unit tests once
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### End-to-End Tests (Playwright)

```bash
# Run all e2e tests
npm run test:e2e

# Run e2e tests with UI
npm run test:e2e:ui

# Run e2e tests in debug mode
npm run test:e2e:debug
```

### All Tests

```bash
# Run both unit and e2e tests
npm run test:all
```

## Test Database Setup

The test database runs in a Docker container on port 5433 (separate from development database on 5432).

### Managing Test Database

```bash
# Start test database
npm run test-db:start

# Stop test database
npm run test-db:stop

# Restart test database
npm run test-db:restart

# Reset test database (delete all data and run migrations)
npm run test-db:reset

# Check test database status
npm run test-db:status

# View test database logs
npm run test-db:logs
```

### Test Database Connection

The test database connection string is:

```
postgresql://aikeedo:password@localhost:5433/aikeedo_dev
```

This is automatically configured in `vitest.setup.ts`.

## Writing Tests

### Unit Tests

Unit tests should be co-located with the code they test, using the `.test.ts` or `.spec.ts` suffix.

Example:

```typescript
// src/lib/auth/password.test.ts
import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './password';

describe('Password utilities', () => {
  it('should hash and verify passwords', async () => {
    const password = 'TestPassword123!';
    const hash = await hashPassword(password);

    expect(await verifyPassword(password, hash)).toBe(true);
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });
});
```

### Property-Based Tests

Property-based tests verify universal properties across many generated inputs. Each property test should run at least 100 iterations.

Example:

```typescript
// Feature: nextjs-foundation, Property 1: Password hashing is irreversible
import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { passwordArbitrary, runPropertyTest } from '@/lib/testing';
import { hashPassword } from './password';

describe('Password hashing properties', () => {
  it('Property 1: Password hashing is irreversible', async () => {
    await runPropertyTest(passwordArbitrary, async (password) => {
      const hash = await hashPassword(password);
      // Hash should not contain the original password
      return !hash.includes(password);
    });
  });
});
```

### End-to-End Tests

E2E tests should be placed in `tests/e2e/` and test complete user flows.

Example:

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should register a new user', async ({ page }) => {
    await page.goto('/register');

    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*verify-email/);
  });
});
```

## Testing Utilities

### Test Helpers

Located in `src/lib/testing/test-helpers.ts`:

- `createTestUser()` - Create a test user in the database
- `createTestWorkspace()` - Create a test workspace
- `createTestSession()` - Create a test session
- `createTestVerificationToken()` - Create a verification token
- `cleanupTestData()` - Clean up all test data
- `randomEmail()` - Generate a random email
- `randomString()` - Generate a random string
- `wait()` - Wait for a specified time

### Database Utilities

Located in `src/lib/testing/test-db.ts`:

- `getTestPrismaClient()` - Get a Prisma client for testing
- `closeTestPrismaClient()` - Close the test database connection
- `resetTestDatabase()` - Truncate all tables
- `withTransaction()` - Run a function in a transaction

### Property Test Helpers

Located in `src/lib/testing/property-test-helpers.ts`:

Arbitraries for generating test data:

- `emailArbitrary` - Valid email addresses
- `passwordArbitrary` - Strong passwords
- `weakPasswordArbitrary` - Weak passwords (for validation testing)
- `nameArbitrary` - Valid names
- `phoneNumberArbitrary` - Valid phone numbers
- `uuidArbitrary` - Valid UUIDs
- `workspaceNameArbitrary` - Valid workspace names
- `creditCountArbitrary` - Valid credit counts
- `sessionTokenArbitrary` - Valid session tokens
- `futureDateArbitrary` - Future dates
- `pastDateArbitrary` - Past dates
- `verificationTokenArbitrary` - Verification tokens
- `sqlInjectionArbitrary` - SQL injection attempts (for security testing)
- `xssArbitrary` - XSS attempts (for security testing)

Helper function:

- `runPropertyTest()` - Run a property test with standard configuration (100+ iterations)

## Best Practices

### Unit Tests

1. Test one thing per test
2. Use descriptive test names
3. Follow Arrange-Act-Assert pattern
4. Clean up test data in `afterEach` or `afterAll` hooks
5. Use test helpers to create test data
6. Mock external dependencies when appropriate

### Property-Based Tests

1. Each property test must run at least 100 iterations
2. Tag each property test with a comment referencing the design document:
   ```typescript
   // Feature: nextjs-foundation, Property 1: Password hashing is irreversible
   ```
3. Use appropriate arbitraries from `property-test-helpers.ts`
4. Ensure generators produce valid inputs for the domain
5. Test universal properties, not specific examples

### End-to-End Tests

1. Test complete user flows, not individual components
2. Use page object pattern for complex pages
3. Wait for elements to be visible before interacting
4. Use semantic selectors (role, label) over CSS selectors
5. Clean up test data after each test
6. Run against a clean test database

## Continuous Integration

Tests are designed to run in CI environments:

- Unit tests run on every commit
- E2E tests run on pull requests
- Test database is automatically set up in CI
- Coverage reports are generated and uploaded

## Troubleshooting

### Tests fail with database connection errors

1. Ensure test database is running: `npm run test-db:status`
2. Start test database if needed: `npm run test-db:start`
3. Check DATABASE_URL in `.env` file

### Property tests are slow

Property tests run 100+ iterations by default. This is intentional for thorough testing. If tests are too slow:

1. Reduce `numRuns` for development (but keep 100+ for CI)
2. Use more specific arbitraries to reduce invalid inputs
3. Optimize the property predicate function

### E2E tests are flaky

1. Add explicit waits for elements: `await page.waitForSelector()`
2. Use `waitForLoadState()` after navigation
3. Increase timeout for slow operations
4. Check for race conditions in the application

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [fast-check Documentation](https://fast-check.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Property-Based Testing Guide](https://fast-check.dev/docs/introduction/)
