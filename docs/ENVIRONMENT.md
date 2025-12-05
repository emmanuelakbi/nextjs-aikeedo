# Environment Variables

This document provides detailed information about all environment variables used in the AIKEEDO Next.js foundation module.

## Overview

Environment variables are validated at application startup using Zod schemas. If any required variable is missing or invalid, the application will fail to start with a clear error message.

## Required Variables

### Node Environment

#### `NODE_ENV`

**Description:** Specifies the environment the application is running in.

**Type:** String (enum)

**Allowed Values:** `development`, `production`, `test`

**Default:** `development`

**Example:**

```env
NODE_ENV="production"
```

**Usage:**

- Controls logging verbosity
- Enables/disables development features
- Affects caching behavior
- Determines error message detail level

---

### Database Configuration

#### `DATABASE_URL`

**Description:** PostgreSQL database connection string.

**Type:** String (URL)

**Required:** Yes

**Format:** `postgresql://[user[:password]@][host][:port][/database][?parameters]`

**Example:**

```env
DATABASE_URL="postgresql://aikeedo_user:secure_password@localhost:5432/aikeedo"
```

**Connection String Components:**

- `user`: Database username
- `password`: Database password
- `host`: Database server hostname or IP
- `port`: Database server port (default: 5432)
- `database`: Database name
- `parameters`: Optional connection parameters (e.g., `?schema=public&connection_limit=5`)

**Cloud Provider Examples:**

**Vercel Postgres:**

```env
DATABASE_URL="postgres://default:password@ep-xxx.us-east-1.postgres.vercel-storage.com:5432/verceldb"
```

**Supabase:**

```env
DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"
```

**Railway:**

```env
DATABASE_URL="postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway"
```

**Neon:**

```env
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb"
```

---

### Authentication Configuration

#### `NEXTAUTH_SECRET`

**Description:** Secret key used to encrypt session tokens and cookies.

**Type:** String

**Required:** Yes

**Minimum Length:** 32 characters

**Example:**

```env
NEXTAUTH_SECRET="your-secret-key-here-at-least-32-characters-long"
```

**How to Generate:**

```bash
# Using OpenSSL (recommended)
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Security Notes:**

- Must be kept secret and never committed to version control
- Should be different for each environment (dev, staging, production)
- Rotate regularly in production (requires re-authentication of all users)
- Use a cryptographically secure random generator

---

#### `NEXTAUTH_URL`

**Description:** The canonical URL of your application.

**Type:** String (URL)

**Required:** Yes

**Example:**

```env
# Development
NEXTAUTH_URL="http://localhost:3000"

# Production
NEXTAUTH_URL="https://yourdomain.com"
```

**Usage:**

- Used for OAuth callback URLs
- Generates absolute URLs in emails
- Required for proper session management

**Important:**

- Must match the actual URL users access
- Include protocol (http:// or https://)
- No trailing slash
- Use HTTPS in production

---

### Email (SMTP) Configuration

#### `SMTP_HOST`

**Description:** SMTP server hostname.

**Type:** String

**Required:** Yes

**Example:**

```env
SMTP_HOST="smtp.gmail.com"
```

**Common SMTP Hosts:**

- Gmail: `smtp.gmail.com`
- Outlook: `smtp-mail.outlook.com`
- SendGrid: `smtp.sendgrid.net`
- Mailgun: `smtp.mailgun.org`
- Mailtrap (dev): `smtp.mailtrap.io`

---

#### `SMTP_PORT`

**Description:** SMTP server port.

**Type:** Number

**Required:** Yes

**Range:** 1-65535

**Common Ports:**

- `587`: TLS/STARTTLS (recommended)
- `465`: SSL
- `25`: Non-secure (not recommended)

**Example:**

```env
SMTP_PORT="587"
```

---

#### `SMTP_USER`

**Description:** SMTP authentication username.

**Type:** String

**Required:** Yes

**Example:**

```env
SMTP_USER="your-email@gmail.com"
```

**Notes:**

- Usually your email address
- For Gmail, use your full email address
- For SendGrid/Mailgun, use API username

---

#### `SMTP_PASSWORD`

**Description:** SMTP authentication password.

**Type:** String

**Required:** Yes

**Example:**

```env
SMTP_PASSWORD="your-app-password"
```

**Security Notes:**

- For Gmail, use an App Password (not your regular password)
- Never commit this to version control
- Use environment-specific passwords
- Rotate regularly

**Gmail App Password:**

1. Enable 2-factor authentication
2. Go to [Google Account Settings](https://myaccount.google.com/apppasswords)
3. Generate an App Password
4. Use the 16-character password

---

#### `SMTP_FROM`

**Description:** Email address to send emails from.

**Type:** String (email)

**Required:** Yes

**Example:**

```env
SMTP_FROM="noreply@aikeedo.com"
```

**Best Practices:**

- Use a no-reply address for automated emails
- Ensure the domain matches your SMTP configuration
- Use a professional email address
- Verify SPF/DKIM records for deliverability

---

## Optional Variables

### Application Configuration

#### `APP_URL`

**Description:** Application URL used for generating links in emails.

**Type:** String (URL)

**Required:** No

**Default:** Value of `NEXTAUTH_URL`

**Example:**

```env
APP_URL="https://app.yourdomain.com"
```

**When to Use:**

- When your app URL differs from auth URL
- For multi-domain setups
- For custom email link domains

---

### Session Configuration

#### `SESSION_MAX_AGE`

**Description:** Session expiration time in seconds.

**Type:** Number

**Required:** No

**Default:** `2592000` (30 days)

**Example:**

```env
# 7 days
SESSION_MAX_AGE="604800"

# 30 days (default)
SESSION_MAX_AGE="2592000"

# 90 days
SESSION_MAX_AGE="7776000"
```

**Common Values:**

- 1 day: `86400`
- 7 days: `604800`
- 30 days: `2592000`
- 90 days: `7776000`

**Considerations:**

- Shorter sessions = better security
- Longer sessions = better user experience
- Balance based on your security requirements

---

### Security Configuration

#### `BCRYPT_ROUNDS`

**Description:** Number of salt rounds for bcrypt password hashing.

**Type:** Number

**Required:** No

**Default:** `12`

**Range:** 10-15

**Example:**

```env
BCRYPT_ROUNDS="12"
```

**Performance vs Security:**

- `10`: Fast, minimum recommended
- `12`: Balanced (default)
- `14`: Slower, more secure
- `15`: Very slow, maximum security

**Notes:**

- Higher rounds = more secure but slower
- Each increment doubles the time
- Consider your server performance
- 12 is recommended for most applications

---

### Caching Configuration

#### `REDIS_URL`

**Description:** Redis connection string for caching.

**Type:** String (URL)

**Required:** No

**Example:**

```env
# Local Redis
REDIS_URL="redis://localhost:6379"

# Redis with password
REDIS_URL="redis://:password@localhost:6379"

# Redis Cloud
REDIS_URL="redis://default:password@redis-12345.c1.us-east-1-1.ec2.cloud.redislabs.com:12345"

# Upstash Redis
REDIS_URL="redis://default:password@us1-xxx.upstash.io:6379"
```

**When to Use:**

- Production environments with high traffic
- To reduce database load
- For session storage (optional)
- For rate limiting

**Benefits:**

- Faster response times
- Reduced database queries
- Better scalability

---

### Error Tracking

#### `SENTRY_DSN`

**Description:** Sentry Data Source Name for error tracking.

**Type:** String (URL)

**Required:** No

**Example:**

```env
SENTRY_DSN="https://examplePublicKey@o0.ingest.sentry.io/0"
```

**Setup:**

1. Create account at [sentry.io](https://sentry.io)
2. Create a new project
3. Copy the DSN from project settings
4. Add to environment variables

**Benefits:**

- Real-time error tracking
- Stack traces and context
- Performance monitoring
- User feedback

---

### Rate Limiting

#### `RATE_LIMIT_REDIS_URL`

**Description:** Redis connection string specifically for rate limiting.

**Type:** String (URL)

**Required:** No

**Example:**

```env
RATE_LIMIT_REDIS_URL="redis://localhost:6379/1"
```

**Notes:**

- Can be the same as `REDIS_URL`
- Use different database number (e.g., `/1`) to separate data
- Required for distributed rate limiting
- Falls back to in-memory if not provided

---

## Environment Files

### File Priority

Environment variables are loaded in the following order (later files override earlier ones):

1. `.env` - Default for all environments
2. `.env.local` - Local overrides (not committed)
3. `.env.development` - Development-specific
4. `.env.production` - Production-specific
5. `.env.test` - Test-specific

### File Usage

**`.env`**

- Committed to version control
- Contains default values
- No sensitive data

**`.env.local`**

- Not committed (in `.gitignore`)
- Contains sensitive local data
- Overrides `.env`

**`.env.development`**

- Development-specific settings
- Can be committed
- Used when `NODE_ENV=development`

**`.env.production`**

- Production-specific settings
- Can be committed (no secrets)
- Used when `NODE_ENV=production`

**`.env.test`**

- Test-specific settings
- Used during testing
- Often uses test database

---

## Validation

Environment variables are validated at startup using Zod schemas. The validation:

1. Checks all required variables are present
2. Validates data types and formats
3. Enforces constraints (min/max, regex patterns)
4. Provides clear error messages
5. Transforms values (e.g., string to number)

### Validation Errors

If validation fails, you'll see detailed error messages:

```
❌ Environment validation failed:

  - DATABASE_URL: Required
  - NEXTAUTH_SECRET: String must contain at least 32 character(s)
  - SMTP_PORT: SMTP_PORT must be a number

💡 Please check your .env file and ensure all required variables are set correctly.
```

---

## Best Practices

### Security

1. **Never commit sensitive data**
   - Use `.env.local` for secrets
   - Add `.env.local` to `.gitignore`

2. **Use strong secrets**
   - Generate with cryptographic tools
   - Minimum 32 characters for secrets

3. **Rotate credentials regularly**
   - Change passwords periodically
   - Update API keys when compromised

4. **Use environment-specific values**
   - Different secrets for dev/staging/prod
   - Separate databases per environment

### Organization

1. **Document all variables**
   - Add comments in `.env.example`
   - Explain purpose and format

2. **Group related variables**
   - Keep database config together
   - Group by service/feature

3. **Use consistent naming**
   - UPPERCASE_WITH_UNDERSCORES
   - Descriptive names

### Deployment

1. **Set variables in deployment platform**
   - Vercel: Project Settings → Environment Variables
   - Railway: Variables tab
   - Docker: Use `-e` flag or env file

2. **Verify before deploying**
   - Test with production-like values
   - Check all required variables are set

3. **Monitor and alert**
   - Set up alerts for missing variables
   - Log configuration errors

---

## Troubleshooting

### Variable Not Found

**Error:** `Environment validation failed: DATABASE_URL: Required`

**Solution:**

1. Check `.env` file exists
2. Verify variable name spelling
3. Ensure no extra spaces
4. Restart development server

### Invalid Format

**Error:** `DATABASE_URL must be a valid URL`

**Solution:**

1. Check URL format: `postgresql://user:pass@host:port/db`
2. Ensure no missing components
3. Escape special characters in password
4. Use quotes if value contains spaces

### Variable Not Loading

**Solution:**

1. Restart development server
2. Check file is in project root
3. Verify file name (`.env` not `env`)
4. Check file permissions

### Production Variables

**Issue:** Variables work locally but not in production

**Solution:**

1. Set variables in deployment platform
2. Don't rely on `.env` files in production
3. Verify variable names match exactly
4. Check for typos in platform settings

---

## Example Configurations

### Development

```env
NODE_ENV="development"
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/aikeedo_dev"
NEXTAUTH_SECRET="dev-secret-at-least-32-characters-long"
NEXTAUTH_URL="http://localhost:3000"
SMTP_HOST="smtp.mailtrap.io"
SMTP_PORT="2525"
SMTP_USER="your-mailtrap-user"
SMTP_PASSWORD="your-mailtrap-password"
SMTP_FROM="dev@aikeedo.local"
```

### Production

```env
NODE_ENV="production"
DATABASE_URL="postgresql://user:pass@prod-db.example.com:5432/aikeedo"
NEXTAUTH_SECRET="prod-secret-generated-with-openssl-rand-base64-32"
NEXTAUTH_URL="https://app.aikeedo.com"
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASSWORD="SG.xxx"
SMTP_FROM="noreply@aikeedo.com"
REDIS_URL="redis://default:pass@redis.example.com:6379"
SENTRY_DSN="https://xxx@sentry.io/xxx"
SESSION_MAX_AGE="2592000"
BCRYPT_ROUNDS="12"
```

### Testing

```env
NODE_ENV="test"
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/aikeedo_test"
NEXTAUTH_SECRET="test-secret-at-least-32-characters-long"
NEXTAUTH_URL="http://localhost:3000"
SMTP_HOST="localhost"
SMTP_PORT="1025"
SMTP_USER="test"
SMTP_PASSWORD="test"
SMTP_FROM="test@aikeedo.local"
```
