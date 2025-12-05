# System Settings Management

## Overview

The System Settings interface provides tools for administrators to configure platform-wide settings, manage subscription plans, and control system behavior. This fulfills **Requirement 4: System Settings** from the Admin Dashboard specification.

## Features

### Settings Management

**Location**: `/admin/settings`

**Capabilities**:
- View all system settings organized by category
- Create new settings
- Update existing settings
- Delete settings
- Filter by category
- Search settings by key or description

### Setting Categories

1. **General**
   - Platform name
   - Contact email
   - Support URL
   - Terms of service URL
   - Privacy policy URL
   - Default language
   - Timezone

2. **AI Providers**
   - OpenAI API key
   - Anthropic API key
   - Google AI API key
   - Mistral API key
   - Default text model
   - Default image model
   - Default speech model
   - Model availability toggles

3. **Billing**
   - Default currency (USD, EUR, GBP)
   - Tax rate percentage
   - Invoice prefix
   - Payment methods enabled
   - Trial period duration
   - Minimum purchase amount

4. **Email**
   - SMTP host
   - SMTP port
   - SMTP username
   - SMTP password (encrypted)
   - From email address
   - From name
   - Email templates (welcome, verification, password reset)

5. **Security**
   - Session timeout duration
   - Password minimum length
   - Password require uppercase
   - Password require numbers
   - Password require special characters
   - Max login attempts
   - Account lockout duration
   - Two-factor authentication enabled

6. **Features**
   - User registration enabled
   - Email verification required
   - Affiliate program enabled
   - File upload enabled
   - Max file size
   - Allowed file types
   - Voice cloning enabled
   - Document editing enabled

7. **Rate Limiting**
   - API rate limit (requests per minute)
   - Generation rate limit
   - File upload rate limit
   - Email rate limit

## Setting Operations

### Create Setting

**Purpose**: Add a new system setting

**Required Fields**:
- `key` (string): Unique identifier (e.g., "platform.name")
- `value` (any): Setting value (string, number, boolean, object)
- `description` (string): Human-readable description
- `category` (string): Setting category
- `isPublic` (boolean): Whether setting is visible to non-admins

**API Endpoint**: `POST /api/admin/settings`

**Body**:
```json
{
  "key": "platform.name",
  "value": "AIKEEDO",
  "description": "Platform display name",
  "category": "general",
  "isPublic": true
}
```

### Update Setting

**Purpose**: Modify an existing setting value

**Editable Fields**:
- `value` - The setting value
- `description` - Setting description
- `category` - Setting category
- `isPublic` - Public visibility flag

**API Endpoint**: `POST /api/admin/settings` (upsert)

**Body**:
```json
{
  "key": "platform.name",
  "value": "AIKEEDO Platform",
  "description": "Updated platform name"
}
```

### Delete Setting

**Purpose**: Remove a setting from the system

**Effects**:
- Setting is permanently deleted
- Default values may be used if setting is required
- Action is logged in audit trail

**API Endpoint**: `DELETE /api/admin/settings/:key`

### Get Setting

**Purpose**: Retrieve a specific setting value

**API Endpoint**: `GET /api/admin/settings/:key`

**Response**:
```json
{
  "key": "platform.name",
  "value": "AIKEEDO",
  "description": "Platform display name",
  "category": "general",
  "isPublic": true,
  "updatedBy": "admin-123",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

## Plan Management

### Subscription Plans

**Purpose**: Manage subscription plans available to users

**Plan Fields**:
- Name (e.g., "Pro Plan")
- Description (optional)
- Price (in cents, e.g., 2900 = $29.00)
- Currency (USD, EUR, GBP)
- Interval (month, year)
- Credit count (credits allocated per period)
- Features (array of feature descriptions)
- Active status (whether plan is available for purchase)
- Stripe price ID (for Stripe integration)

### Create Plan

**API Endpoint**: `POST /api/admin/plans`

**Body**:
```json
{
  "name": "Pro Plan",
  "description": "Professional tier with advanced features",
  "price": 2900,
  "currency": "USD",
  "interval": "month",
  "creditCount": 10000,
  "features": [
    "10,000 credits per month",
    "All AI models",
    "Priority support",
    "Advanced analytics"
  ],
  "isActive": true,
  "stripePriceId": "price_stripe123"
}
```

### Update Plan

**API Endpoint**: `PATCH /api/admin/plans/:id`

**Body**:
```json
{
  "name": "Pro Plan Updated",
  "price": 3900,
  "creditCount": 15000,
  "isActive": true
}
```

**Note**: Changing price or credits does not affect existing subscriptions

### Delete Plan

**API Endpoint**: `DELETE /api/admin/plans/:id`

**Restrictions**:
- Cannot delete plan with active subscriptions
- Must deactivate plan first
- Wait for all subscriptions to end or migrate users

### List Plans

**API Endpoint**: `GET /api/admin/plans`

**Query Parameters**:
- `isActive` (boolean): Filter by active status
- `interval` (string): Filter by billing interval

**Response**:
```json
{
  "plans": [
    {
      "id": "plan-123",
      "name": "Pro Plan",
      "price": 2900,
      "currency": "USD",
      "interval": "month",
      "creditCount": 10000,
      "isActive": true,
      "_count": {
        "subscriptions": 25
      }
    }
  ]
}
```

## API Endpoints

### Settings Endpoints

```
GET /api/admin/settings
GET /api/admin/settings/:key
POST /api/admin/settings
DELETE /api/admin/settings/:key
```

### Plan Endpoints

```
GET /api/admin/plans
POST /api/admin/plans
GET /api/admin/plans/:id
PATCH /api/admin/plans/:id
DELETE /api/admin/plans/:id
```

## Security Considerations

### Access Control
- Only admins can access settings management
- All endpoints protected by `requireAdmin()` middleware
- Sensitive settings (API keys, passwords) are encrypted

### Audit Logging
All settings management actions are logged:
- Setting creation
- Setting updates (with old and new values)
- Setting deletion
- Plan creation and updates
- Plan deletion

### Sensitive Data
- API keys are encrypted at rest
- Passwords are never exposed in responses
- Sensitive settings are marked as non-public
- Environment variables override database settings

## Usage Examples

### Configure AI Provider

1. Navigate to `/admin/settings`
2. Find "AI Providers" category
3. Click "Edit" on OpenAI API key setting
4. Enter new API key
5. Click "Save"
6. API key is encrypted and stored
7. Platform can now use OpenAI services

### Create New Subscription Plan

1. Navigate to `/admin/settings`
2. Scroll to "Subscription Plans" section
3. Click "Create Plan"
4. Enter plan details:
   - Name: "Enterprise Plan"
   - Price: $99.00 (9900 cents)
   - Interval: Monthly
   - Credits: 50,000
   - Features: List of features
5. Click "Create"
6. Plan is now available for users to subscribe

### Update Platform Name

1. Navigate to `/admin/settings`
2. Find "General" category
3. Find "platform.name" setting
4. Click "Edit"
5. Enter new name
6. Click "Save"
7. Platform name is updated across the site

### Disable User Registration

1. Navigate to `/admin/settings`
2. Find "Features" category
3. Find "features.registration_enabled" setting
4. Toggle to "false"
5. Click "Save"
6. New user registration is now disabled

## Environment Variables vs Database Settings

### Priority

Environment variables take precedence over database settings:

1. Environment variable (highest priority)
2. Database setting
3. Default value (lowest priority)

### Best Practices

- Use environment variables for deployment-specific settings
- Use database settings for runtime-configurable options
- Use defaults for non-critical settings

### Example

```typescript
// Get setting with fallback
const apiKey = 
  process.env.OPENAI_API_KEY || 
  await getSetting('ai.openai_api_key') || 
  null;
```

## Setting Naming Convention

Settings follow a hierarchical naming pattern: `{category}.{name}`

**Examples**:
- `platform.name` - Platform name
- `ai.openai_api_key` - OpenAI API key
- `billing.default_currency` - Default currency
- `email.smtp_host` - SMTP host
- `security.session_timeout` - Session timeout duration
- `features.registration_enabled` - Registration enabled flag

## Performance Considerations

- Settings are cached in memory for fast access
- Cache is invalidated on setting updates
- Frequently accessed settings should use environment variables
- Consider using Redis for distributed caching

## Testing

```bash
# Run settings management tests
npm test src/app/api/admin/settings/route.test.ts
```

**Test Coverage**:
- List settings with filtering
- Create new settings
- Update existing settings
- Delete settings
- Get specific setting
- Plan CRUD operations
- Error handling

## Related Documentation

- [Admin Dashboard Overview](../README.md)
- [Admin API Documentation](../../../../src/app/api/admin/README.md)
- [Environment Variables](../../../../docs/ENVIRONMENT.md)
- [Billing System](../../../../docs/BILLING.md)
- [Plan Management](../../../../docs/PLAN_MANAGEMENT.md)
