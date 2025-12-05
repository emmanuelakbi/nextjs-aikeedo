# Environment Configuration Usage Examples

This document provides examples of how to use the type-safe environment configuration throughout the application.

## Basic Usage

### Importing Environment Variables

```typescript
// Import the env object for direct access
import { env } from '@/lib/config';

// Access environment variables with full type safety
const databaseUrl = env.DATABASE_URL;
const smtpPort = env.SMTP_PORT; // Already parsed as number
const sessionMaxAge = env.SESSION_MAX_AGE; // Already parsed as number
```

### Using Configuration Helpers

```typescript
// Import specific configuration helpers
import { authConfig, emailConfig, dbConfig } from '@/lib/config';

// Authentication configuration
const secret = authConfig.secret();
const authUrl = authConfig.url();
const sessionMaxAge = authConfig.sessionMaxAge();
const bcryptRounds = authConfig.bcryptRounds();

// Email configuration
const smtpHost = emailConfig.host();
const smtpPort = emailConfig.port();
const smtpUser = emailConfig.user();
const smtpPassword = emailConfig.password();
const smtpFrom = emailConfig.from();

// Database configuration
const dbUrl = dbConfig.url();
```

### Environment Checks

```typescript
import { isProduction, isDevelopment, isTest } from '@/lib/config';

if (isDevelopment) {
  console.log('Running in development mode');
}

if (isProduction) {
  // Enable production optimizations
}

if (isTest) {
  // Use test database
}
```

## Real-World Examples

### Database Connection

```typescript
// src/lib/db/client.ts
import { PrismaClient } from '@prisma/client';
import { dbConfig, isDevelopment } from '@/lib/config';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: dbConfig.url(),
      },
    },
    log: isDevelopment ? ['query', 'error', 'warn'] : ['error'],
  });

if (isDevelopment) globalForPrisma.prisma = prisma;
```

### Email Service

```typescript
// src/lib/email/client.ts
import nodemailer from 'nodemailer';
import { emailConfig } from '@/lib/config';

export const emailTransporter = nodemailer.createTransport({
  host: emailConfig.host(),
  port: emailConfig.port(),
  secure: emailConfig.port() === 465, // true for 465, false for other ports
  auth: {
    user: emailConfig.user(),
    pass: emailConfig.password(),
  },
});

export async function sendEmail(to: string, subject: string, html: string) {
  await emailTransporter.sendMail({
    from: emailConfig.from(),
    to,
    subject,
    html,
  });
}
```

### NextAuth Configuration

```typescript
// src/lib/auth/config.ts
import { NextAuthOptions } from 'next-auth';
import { authConfig } from '@/lib/config';

export const authOptions: NextAuthOptions = {
  secret: authConfig.secret(),
  session: {
    strategy: 'database',
    maxAge: authConfig.sessionMaxAge(),
  },
  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/auth/error',
  },
  // ... other NextAuth configuration
};
```

### Password Hashing

```typescript
// src/lib/auth/password.ts
import bcrypt from 'bcrypt';
import { authConfig } from '@/lib/config';

export async function hashPassword(password: string): Promise<string> {
  const rounds = authConfig.bcryptRounds();
  return bcrypt.hash(password, rounds);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### Optional Services

```typescript
// src/lib/cache/redis.ts
import { Redis } from 'ioredis';
import { servicesConfig } from '@/lib/config';

let redis: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (!servicesConfig.redis.isEnabled()) {
    return null;
  }

  if (!redis) {
    redis = new Redis(servicesConfig.redis.url()!);
  }

  return redis;
}

// Usage
const redisClient = getRedisClient();
if (redisClient) {
  await redisClient.set('key', 'value');
}
```

### Error Tracking with Sentry

```typescript
// src/lib/monitoring/sentry.ts
import * as Sentry from '@sentry/nextjs';
import { servicesConfig, isProduction } from '@/lib/config';

export function initializeSentry() {
  if (!servicesConfig.sentry.isEnabled()) {
    return;
  }

  Sentry.init({
    dsn: servicesConfig.sentry.dsn(),
    environment: isProduction ? 'production' : 'development',
    tracesSampleRate: isProduction ? 0.1 : 1.0,
  });
}
```

### API Route with Environment Variables

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { env, isDevelopment } from '@/lib/config';

export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  };

  // Only expose detailed info in development
  if (isDevelopment) {
    return NextResponse.json({
      ...health,
      config: {
        database: 'connected',
        smtp: `${env.SMTP_HOST}:${env.SMTP_PORT}`,
        redis: env.REDIS_URL ? 'enabled' : 'disabled',
        sentry: env.SENTRY_DSN ? 'enabled' : 'disabled',
      },
    });
  }

  return NextResponse.json(health);
}
```

### Server Action with Configuration

```typescript
// app/actions/send-verification-email.ts
'use server';

import { appConfig, emailConfig } from '@/lib/config';
import { sendEmail } from '@/lib/email/client';

export async function sendVerificationEmail(
  email: string,
  token: string
): Promise<void> {
  const verificationUrl = `${appConfig.url()}/verify-email?token=${token}`;

  const html = `
    <h1>Verify Your Email</h1>
    <p>Click the link below to verify your email address:</p>
    <a href="${verificationUrl}">${verificationUrl}</a>
  `;

  await sendEmail(email, 'Verify Your Email', html);
}
```

## Testing with Environment Variables

### Unit Tests

```typescript
// __tests__/example.test.ts
import { describe, it, expect, beforeEach } from '@jest/globals';

describe('Feature with environment', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should work with test environment', () => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
    // ... set other required env vars

    const { env } = require('@/lib/config');
    expect(env.NODE_ENV).toBe('test');
  });
});
```

### Integration Tests

```typescript
// tests/integration/setup.ts
import { env } from '@/lib/config';

// Ensure we're using test database
if (!env.DATABASE_URL.includes('test')) {
  throw new Error('Integration tests must use test database');
}

// Setup test database
export async function setupTestDatabase() {
  // Run migrations, seed data, etc.
}
```

## Best Practices

1. **Always use the config module**: Never access `process.env` directly

   ```typescript
   // ❌ Bad
   const dbUrl = process.env.DATABASE_URL;

   // ✅ Good
   import { env } from '@/lib/config';
   const dbUrl = env.DATABASE_URL;
   ```

2. **Use configuration helpers for organized access**

   ```typescript
   // ✅ Good - organized and clear
   import { authConfig } from '@/lib/config';
   const secret = authConfig.secret();
   ```

3. **Check optional services before using them**

   ```typescript
   // ✅ Good
   if (servicesConfig.redis.isEnabled()) {
     const redis = getRedisClient();
     // Use redis
   }
   ```

4. **Use environment checks for conditional logic**

   ```typescript
   // ✅ Good
   import { isDevelopment } from '@/lib/config';

   if (isDevelopment) {
     console.log('Debug info');
   }
   ```

5. **Never commit .env files**
   - Keep `.env` in `.gitignore`
   - Use `.env.example` as a template
   - Document all required variables

6. **Validate early**
   - Environment validation happens on application startup
   - Fail fast if configuration is invalid
   - Provide clear error messages

## Troubleshooting

### Environment not loading

```typescript
// Check if environment is loaded
import { env } from '@/lib/config';
console.log('Environment loaded:', env.NODE_ENV);
```

### Type errors

```typescript
// Ensure you're importing from the right place
import { env } from '@/lib/config'; // ✅ Correct
import { env } from '@/lib/env'; // ✅ Also correct
```

### Validation errors

Check the console output on application startup for detailed validation errors:

```
❌ Environment validation failed:

  - DATABASE_URL: DATABASE_URL is required
  - NEXTAUTH_SECRET: NEXTAUTH_SECRET must be at least 32 characters

💡 Please check your .env file and ensure all required variables are set correctly.
```
