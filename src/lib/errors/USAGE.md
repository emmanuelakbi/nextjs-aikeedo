# Error Handling and Logging Usage Guide

This document provides examples of how to use the error handling and logging system in the Next.js AIKEEDO application.

## Overview

The error handling system provides:

- **Custom error classes** for different error types
- **Consistent error response format** across all API routes
- **Structured logging** with context support
- **Automatic error handling** with the `handleApiError` function

## Custom Error Classes

### Available Error Types

```typescript
import {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ServerError,
} from '@/lib/errors';
```

### Usage Examples

#### ValidationError

```typescript
// Simple validation error
throw new ValidationError('Invalid input data');

// With field-level errors
throw new ValidationError('Invalid input data', {
  email: ['Email is required', 'Email must be valid'],
  password: ['Password must be at least 8 characters'],
});
```

#### AuthenticationError

```typescript
throw new AuthenticationError('Invalid credentials');
```

#### AuthorizationError

```typescript
throw new AuthorizationError(
  'You do not have permission to access this resource'
);
```

#### NotFoundError

```typescript
throw new NotFoundError('User not found');
```

#### ConflictError

```typescript
throw new ConflictError('Email already exists', {
  email: ['A user with this email already exists'],
});
```

#### ServerError

```typescript
throw new ServerError('An unexpected error occurred');
```

## Using in API Routes

### Method 1: Using handleApiError (Recommended)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, NotFoundError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    // Your logic here
    const user = await findUser(id);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return NextResponse.json({ data: user });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Method 2: Using withErrorHandler Wrapper

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, NotFoundError } from '@/lib/errors';

async function handler(request: NextRequest) {
  const user = await findUser(id);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return NextResponse.json({ data: user });
}

export const GET = withErrorHandler(handler);
```

## Logging

### Basic Logging

```typescript
import { logger } from '@/lib/errors';

// Debug (only in development)
logger.debug('Processing request', { userId: '123' });

// Info
logger.info('User registered successfully', {
  userId: '123',
  email: 'user@example.com',
});

// Warning
logger.warn('Rate limit approaching', { userId: '123', requestCount: 95 });

// Error
logger.error('Database connection failed', {
  error: error.message,
  stack: error.stack,
});
```

### Logging with Context

```typescript
logger.info('Payment processed', {
  userId: user.id,
  amount: payment.amount,
  currency: payment.currency,
  transactionId: payment.id,
});
```

## Error Response Format

All errors return a consistent JSON structure:

```typescript
{
  error: {
    code: string;        // Machine-readable error code (e.g., "VALIDATION_ERROR")
    message: string;     // Human-readable error message
    fields?: {           // Optional field-level errors
      [key: string]: string[];
    }
  }
}
```

### Examples

#### Validation Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "fields": {
      "email": ["Email is required", "Email must be valid"],
      "password": ["Password must be at least 8 characters"]
    }
  }
}
```

#### Authentication Error Response

```json
{
  "error": {
    "code": "AUTHENTICATION_ERROR",
    "message": "Invalid credentials"
  }
}
```

#### Not Found Error Response

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "User not found"
  }
}
```

## Complete API Route Example

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  handleApiError,
  ValidationError,
  NotFoundError,
  AuthenticationError,
  logger,
} from '@/lib/errors';

// Define validation schema
const updateUserSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user
    const session = await getSession(request);
    if (!session) {
      throw new AuthenticationError('You must be logged in');
    }

    // Parse and validate request body
    const body = await request.json();
    const data = updateUserSchema.parse(body);

    // Find user
    const user = await findUserById(params.id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Update user
    const updatedUser = await updateUser(params.id, data);

    // Log success
    logger.info('User updated successfully', {
      userId: params.id,
      updatedBy: session.userId,
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
```

## Best Practices

1. **Always use try-catch blocks** in API routes
2. **Use specific error types** instead of generic Error
3. **Include context** when logging errors
4. **Provide field-level errors** for validation failures
5. **Don't expose sensitive information** in error messages
6. **Log operational errors at info level**, non-operational at error level
7. **Use handleApiError** for consistent error responses
