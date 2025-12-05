# Security Middleware

This directory contains comprehensive security middleware for the Next.js application.

## Components

### CSRF Protection (`csrf.ts`)

Implements Cross-Site Request Forgery protection for mutation operations (POST, PUT, PATCH, DELETE).

**Requirements:** 12.3

**Usage:**

```typescript
import { withCsrfProtection, setCsrfTokenCookie } from '@/lib/middleware/csrf';

export const POST = withCsrfProtection(async (request: NextRequest) => {
  // Your handler logic
  return NextResponse.json({ success: true });
});
```

### Rate Limiting (`rate-limit.ts`, `redis-rate-limiter.ts`)

Implements distributed rate limiting with Redis support and automatic fallback to in-memory.

**Requirements:** 10.1, 10.2, 10.3, 10.4, 10.5

**Features:**

- Multi-level rate limiting (per-user, per-workspace, per-IP)
- Redis-based sliding window algorithm
- Automatic fallback to in-memory if Redis unavailable
- Standard rate limit headers in responses

**Usage:**

Simple rate limiting:

```typescript
import { withRateLimit, RATE_LIMITS } from '@/lib/middleware/rate-limit';

export const POST = withRateLimit(async (request: NextRequest) => {
  // Your handler logic
  return NextResponse.json({ success: true });
}, RATE_LIMITS.LOGIN);
```

AI service rate limiting (multi-level):

```typescript
import { withAIRateLimit } from '@/lib/middleware/rate-limit';

export const POST = withAIRateLimit(
  async (request: NextRequest) => {
    // Your AI service logic
    return NextResponse.json({ result: 'generated' });
  },
  'text-generation' // endpoint identifier
);
```

See [RATE_LIMITING.md](./RATE_LIMITING.md) for detailed documentation.

### Security Headers (`security-headers.ts`)

Adds security-related HTTP headers to responses.

**Requirements:** 12.2, 12.5

**Usage:**

```typescript
import {
  withSecurityHeaders,
  secureResponse,
} from '@/lib/middleware/security-headers';

export const GET = withSecurityHeaders(async (request: Request) => {
  return NextResponse.json({ data: 'value' });
});

// Or use secureResponse directly
export const POST = async (request: Request) => {
  return secureResponse({ success: true });
};
```

### Input Validation (`validation.ts`)

Provides utilities for validating and sanitizing request inputs.

**Requirements:** 9.3, 12.4

**Usage:**

```typescript
import { withValidation, sanitizeObject } from '@/lib/middleware/validation';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});

export const POST = withValidation(async (request: NextRequest, data) => {
  // data is validated and typed
  const sanitized = sanitizeObject(data);
  return NextResponse.json({ success: true });
}, schema);
```

### Comprehensive Security (`security.ts`)

Combines all security middleware into a single wrapper.

**Requirements:** 12.1, 12.2, 12.3, 12.4, 12.5

**Usage:**

```typescript
import { withSecurity } from '@/lib/middleware/security';

export const POST = withSecurity(
  async (request: NextRequest) => {
    // All security checks applied automatically
    return NextResponse.json({ success: true });
  },
  {
    csrf: true,
    rateLimit: { windowMs: 60000, maxRequests: 100 },
    sanitize: true,
    securityHeaders: true,
    validateInjection: true,
  }
);
```

## Security Features

### XSS Prevention

- Removes `<script>`, `<iframe>`, `<object>`, `<embed>` tags
- Removes event handlers (`onclick`, `onerror`, etc.)
- Removes `javascript:` and `vbscript:` protocols
- React's automatic escaping provides additional protection

### SQL Injection Prevention

- Detects common SQL injection patterns
- Removes SQL keywords in suspicious contexts
- Removes SQL comment patterns (`--`, `/* */`)
- Prisma's parameterized queries provide primary protection

### CSRF Protection

- Validates CSRF tokens on mutation requests
- Uses constant-time comparison to prevent timing attacks
- Tokens stored in httpOnly cookies

### Rate Limiting

- Configurable per-endpoint limits
- In-memory storage (use Redis for production)
- Automatic cleanup of expired entries

### Security Headers

- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Content-Security-Policy
- Strict-Transport-Security (production only)

## Testing

Property-based tests ensure the security middleware correctly:

- Detects XSS injection attempts
- Detects SQL injection attempts
- Sanitizes dangerous content
- Preserves safe content
- Handles edge cases without errors

Run tests:

```bash
npm test -- validation.test.ts
```

## Production Considerations

1. **Rate Limiting**: Use Redis for distributed rate limiting
2. **CSRF Tokens**: Ensure tokens are properly set on initial page load
3. **Security Headers**: Adjust CSP based on your specific needs
4. **Input Validation**: Always validate at both client and server
5. **Monitoring**: Log security events for analysis
