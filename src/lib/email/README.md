# Email Service

Email service for sending transactional emails using SMTP.

## Features

- ✅ SMTP configuration from environment variables
- ✅ Email templates for verification, password reset, and welcome emails
- ✅ HTML and plain text email support
- ✅ Error handling with secure error messages
- ✅ Connection verification
- ✅ Lazy initialization

## Configuration

Set the following environment variables in your `.env` file:

```env
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-email@example.com"
SMTP_PASSWORD="your-smtp-password"
SMTP_FROM="noreply@aikeedo.com"
```

## Usage

### Sending Verification Email

```typescript
import { sendVerificationEmail } from '@/lib/email';

await sendVerificationEmail('user@example.com', {
  firstName: 'John',
  verificationUrl: 'https://app.com/verify?token=abc123',
  appName: 'AIKEEDO', // optional, defaults to 'AIKEEDO'
});
```

### Sending Password Reset Email

```typescript
import { sendPasswordResetEmail } from '@/lib/email';

await sendPasswordResetEmail('user@example.com', {
  firstName: 'John',
  resetUrl: 'https://app.com/reset?token=xyz789',
  appName: 'AIKEEDO', // optional
});
```

### Sending Welcome Email

```typescript
import { sendWelcomeEmail } from '@/lib/email';

await sendWelcomeEmail('user@example.com', {
  firstName: 'John',
  appName: 'AIKEEDO', // optional
});
```

### Custom Email

```typescript
import { sendEmail } from '@/lib/email';

await sendEmail({
  to: 'user@example.com',
  subject: 'Custom Email',
  html: '<p>Your HTML content</p>',
  text: 'Your plain text content', // optional, auto-generated from HTML if not provided
});
```

### Using the Email Service Directly

```typescript
import { EmailService } from '@/lib/email';

const emailService = new EmailService();

// Verify SMTP connection
const isConnected = await emailService.verifyConnection();

// Send email
await emailService.sendEmail({
  to: 'user@example.com',
  subject: 'Test',
  html: '<p>Test</p>',
});

// Close connection when done
await emailService.close();
```

## Templates

All email templates include:

- Responsive HTML layout
- Plain text fallback
- Consistent styling
- Footer with copyright

### Available Templates

1. **Verification Email** - For email address verification
2. **Password Reset Email** - For password recovery
3. **Welcome Email** - For new user onboarding

## Error Handling

The email service handles errors gracefully:

- Logs detailed errors for debugging
- Returns generic error messages to prevent SMTP credential exposure
- Throws `Error` with message "Failed to send email. Please try again later."

## Testing

Run tests with:

```bash
npm test -- src/lib/email/__tests__
```

Tests cover:

- Template rendering
- Email content validation
- SMTP connection handling
- Error handling
- HTML stripping for plain text

## Requirements Validated

- ✅ 4.1: Email verification with unique token
- ✅ 4.4: New verification email generation
- ✅ 5.1: Password reset email with unique token
