# API Documentation

This document provides comprehensive documentation for all API endpoints in the AIKEEDO Next.js foundation module.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Most endpoints require authentication using NextAuth.js session cookies. The session cookie is automatically set after successful login and included in subsequent requests.

### Authentication Flow

1. Register a new user: `POST /api/auth/register`
2. Verify email: `POST /api/auth/verify-email`
3. Login: `POST /api/auth/signin` (handled by NextAuth)
4. Access protected endpoints with session cookie

## Response Format

### Success Response

```json
{
  "data": {
    // Response data
  }
}
```

### Error Response

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "fields": {
      "fieldName": ["Error message for this field"]
    }
  }
}
```

## HTTP Status Codes

- `200 OK` - Request succeeded
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid input or validation error
- `401 Unauthorized` - Authentication required or invalid credentials
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists (e.g., duplicate email)
- `500 Internal Server Error` - Server error

---

## Authentication Endpoints

### Register User

Create a new user account.

**Endpoint:** `POST /api/auth/register`

**Authentication:** Not required

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Validation Rules:**

- `email`: Valid email format, unique
- `password`: Minimum 8 characters, at least one uppercase, one lowercase, one number
- `firstName`: 1-50 characters
- `lastName`: 1-50 characters

**Success Response:** `201 Created`

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "emailVerified": null
    },
    "message": "Registration successful. Please check your email to verify your account."
  }
}
```

**Error Responses:**

- `400` - Validation error
- `409` - Email already exists

---

### Verify Email

Verify user email address with token.

**Endpoint:** `POST /api/auth/verify-email`

**Authentication:** Not required

**Request Body:**

```json
{
  "token": "verification-token-from-email"
}
```

**Success Response:** `200 OK`

```json
{
  "data": {
    "message": "Email verified successfully. You can now log in."
  }
}
```

**Error Responses:**

- `400` - Invalid or expired token
- `404` - Token not found

---

### Request Password Reset

Request a password reset email.

**Endpoint:** `POST /api/auth/request-reset`

**Authentication:** Not required

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Success Response:** `200 OK`

```json
{
  "data": {
    "message": "If an account exists with this email, a password reset link has been sent."
  }
}
```

**Note:** Always returns success to prevent email enumeration attacks.

---

### Reset Password

Reset password using token from email.

**Endpoint:** `POST /api/auth/reset-password`

**Authentication:** Not required

**Request Body:**

```json
{
  "token": "reset-token-from-email",
  "password": "NewSecurePassword123!"
}
```

**Validation Rules:**

- `password`: Minimum 8 characters, at least one uppercase, one lowercase, one number

**Success Response:** `200 OK`

```json
{
  "data": {
    "message": "Password reset successfully. You can now log in with your new password."
  }
}
```

**Error Responses:**

- `400` - Invalid or expired token, or validation error
- `404` - Token not found

**Side Effects:**

- All existing sessions for the user are invalidated

---

### Logout

Logout the current user and invalidate session.

**Endpoint:** `POST /api/auth/logout`

**Authentication:** Required

**Request Body:** None

**Success Response:** `200 OK`

```json
{
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

## User Management Endpoints

### Get Current User

Get the authenticated user's profile.

**Endpoint:** `GET /api/users/me`

**Authentication:** Required

**Success Response:** `200 OK`

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "emailVerified": "2024-01-01T00:00:00.000Z",
      "firstName": "John",
      "lastName": "Doe",
      "phoneNumber": "+1234567890",
      "language": "en",
      "role": "USER",
      "status": "ACTIVE",
      "currentWorkspaceId": "workspace-uuid",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Error Responses:**

- `401` - Not authenticated

---

### Update Profile

Update the authenticated user's profile information.

**Endpoint:** `PATCH /api/users/me`

**Authentication:** Required

**Request Body:**

```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "phoneNumber": "+1234567890",
  "language": "en"
}
```

**Validation Rules:**

- `firstName`: 1-50 characters (optional)
- `lastName`: 1-50 characters (optional)
- `phoneNumber`: Valid phone number format (optional)
- `language`: ISO 639-1 language code (optional)

**Success Response:** `200 OK`

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "phoneNumber": "+1234567890",
      "language": "en"
    }
  }
}
```

**Error Responses:**

- `400` - Validation error
- `401` - Not authenticated

---

### Update Password

Change the authenticated user's password.

**Endpoint:** `PATCH /api/users/me/password`

**Authentication:** Required

**Request Body:**

```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewSecurePassword123!"
}
```

**Validation Rules:**

- `currentPassword`: Required, must match current password
- `newPassword`: Minimum 8 characters, at least one uppercase, one lowercase, one number

**Success Response:** `200 OK`

```json
{
  "data": {
    "message": "Password updated successfully"
  }
}
```

**Error Responses:**

- `400` - Validation error or incorrect current password
- `401` - Not authenticated

---

### Update Email

Change the authenticated user's email address.

**Endpoint:** `PATCH /api/users/me/email`

**Authentication:** Required

**Request Body:**

```json
{
  "email": "newemail@example.com"
}
```

**Validation Rules:**

- `email`: Valid email format, unique

**Success Response:** `200 OK`

```json
{
  "data": {
    "message": "Email updated. Please check your new email to verify it."
  }
}
```

**Error Responses:**

- `400` - Validation error
- `401` - Not authenticated
- `409` - Email already in use

**Side Effects:**

- Email verification status is reset to unverified
- Verification email sent to new address

---

## Workspace Management Endpoints

### List Workspaces

Get all workspaces the user owns or is a member of.

**Endpoint:** `GET /api/workspaces`

**Authentication:** Required

**Success Response:** `200 OK`

```json
{
  "data": {
    "workspaces": [
      {
        "id": "uuid",
        "name": "Personal",
        "ownerId": "user-uuid",
        "creditCount": 1000,
        "allocatedCredits": 250,
        "isTrialed": false,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

**Error Responses:**

- `401` - Not authenticated

---

### Create Workspace

Create a new workspace.

**Endpoint:** `POST /api/workspaces`

**Authentication:** Required

**Request Body:**

```json
{
  "name": "My Team Workspace"
}
```

**Validation Rules:**

- `name`: 1-100 characters

**Success Response:** `201 Created`

```json
{
  "data": {
    "workspace": {
      "id": "uuid",
      "name": "My Team Workspace",
      "ownerId": "user-uuid",
      "creditCount": 0,
      "allocatedCredits": 0,
      "isTrialed": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Error Responses:**

- `400` - Validation error
- `401` - Not authenticated

---

### Update Workspace

Update workspace details.

**Endpoint:** `PATCH /api/workspaces/:id`

**Authentication:** Required (must be workspace owner)

**Request Body:**

```json
{
  "name": "Updated Workspace Name"
}
```

**Validation Rules:**

- `name`: 1-100 characters (optional)

**Success Response:** `200 OK`

```json
{
  "data": {
    "workspace": {
      "id": "uuid",
      "name": "Updated Workspace Name",
      "ownerId": "user-uuid",
      "creditCount": 1000,
      "allocatedCredits": 250
    }
  }
}
```

**Error Responses:**

- `400` - Validation error
- `401` - Not authenticated
- `403` - Not workspace owner
- `404` - Workspace not found

---

### Switch Workspace

Switch the user's current active workspace.

**Endpoint:** `POST /api/workspaces/:id/switch`

**Authentication:** Required

**Request Body:** None

**Success Response:** `200 OK`

```json
{
  "data": {
    "message": "Workspace switched successfully",
    "workspaceId": "uuid"
  }
}
```

**Error Responses:**

- `401` - Not authenticated
- `403` - Not a member of this workspace
- `404` - Workspace not found

---

### Transfer Workspace Ownership

Transfer ownership of a workspace to another user.

**Endpoint:** `POST /api/workspaces/:id/transfer-ownership`

**Authentication:** Required (must be workspace owner)

**Request Body:**

```json
{
  "newOwnerId": "user-uuid"
}
```

**Success Response:** `200 OK`

```json
{
  "data": {
    "message": "Workspace ownership transferred successfully",
    "workspace": {
      "id": "uuid",
      "name": "Workspace Name",
      "ownerId": "new-owner-uuid"
    }
  }
}
```

**Error Responses:**

- `400` - Validation error
- `401` - Not authenticated
- `403` - Not workspace owner
- `404` - Workspace or new owner not found

---

## Development Endpoints

**Note:** These endpoints are only available in development mode (`NODE_ENV=development`).

### Seed Database

Seed the database with test data.

**Endpoint:** `POST /api/dev/seed`

**Authentication:** Not required (dev only)

**Success Response:** `200 OK`

```json
{
  "data": {
    "message": "Database seeded successfully",
    "users": 5,
    "workspaces": 5
  }
}
```

---

### Reset Database

Reset the database (delete all data).

**Endpoint:** `POST /api/dev/reset`

**Authentication:** Not required (dev only)

**Success Response:** `200 OK`

```json
{
  "data": {
    "message": "Database reset successfully"
  }
}
```

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Authentication endpoints**: 5 requests per 15 minutes per IP
- **Registration**: 3 requests per hour per IP
- **Password reset**: 3 requests per hour per email
- **General API**: 100 requests per minute per authenticated user

When rate limit is exceeded, the API returns:

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later."
  }
}
```

**Status Code:** `429 Too Many Requests`

---

## Error Codes

| Code                      | Description                    |
| ------------------------- | ------------------------------ |
| `VALIDATION_ERROR`        | Input validation failed        |
| `AUTHENTICATION_REQUIRED` | User must be authenticated     |
| `INVALID_CREDENTIALS`     | Email or password is incorrect |
| `EMAIL_ALREADY_EXISTS`    | Email is already registered    |
| `INVALID_TOKEN`           | Token is invalid or expired    |
| `NOT_FOUND`               | Resource not found             |
| `FORBIDDEN`               | Insufficient permissions       |
| `RATE_LIMIT_EXCEEDED`     | Too many requests              |
| `SERVER_ERROR`            | Internal server error          |

---

## Examples

### Complete Registration Flow

```bash
# 1. Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe"
  }'

# 2. Verify email (use token from email)
curl -X POST http://localhost:3000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "token": "verification-token-from-email"
  }'

# 3. Login (handled by NextAuth UI)
# Visit: http://localhost:3000/login

# 4. Get user profile (with session cookie)
curl -X GET http://localhost:3000/api/users/me \
  -H "Cookie: next-auth.session-token=your-session-token"
```

### Password Reset Flow

```bash
# 1. Request password reset
curl -X POST http://localhost:3000/api/auth/request-reset \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'

# 2. Reset password (use token from email)
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "reset-token-from-email",
    "password": "NewSecurePass123!"
  }'
```

### Workspace Management

```bash
# Create workspace
curl -X POST http://localhost:3000/api/workspaces \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=your-session-token" \
  -d '{
    "name": "My Team"
  }'

# List workspaces
curl -X GET http://localhost:3000/api/workspaces \
  -H "Cookie: next-auth.session-token=your-session-token"

# Switch workspace
curl -X POST http://localhost:3000/api/workspaces/workspace-id/switch \
  -H "Cookie: next-auth.session-token=your-session-token"
```
