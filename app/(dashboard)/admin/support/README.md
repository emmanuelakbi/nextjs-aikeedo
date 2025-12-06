# Support Tools

## Overview

The Support Tools interface provides administrators with utilities for customer support, system monitoring, and platform management. This fulfills **Requirement 7: Support Tools** from the Admin Dashboard specification.

## Features

### 1. Announcements Management

**Purpose**: Create and manage system-wide announcements for users

**Location**: `/admin/support` - Announcements section

#### Announcement Types

- **Info** (Blue) - General information and updates
- **Warning** (Yellow) - Important notices requiring attention
- **Error** (Red) - Critical alerts and system issues

#### Announcement Fields

- Title (required)
- Content (required, supports markdown)
- Type (info, warning, error)
- Active status (show/hide)
- Start date (when to start showing)
- End date (when to stop showing, optional)

#### Operations

**Create Announcement**:

```
POST /api/admin/announcements
```

**Body**:

```json
{
  "title": "Scheduled Maintenance",
  "content": "The platform will be under maintenance on Jan 20, 2024 from 2-4 AM UTC.",
  "type": "warning",
  "isActive": true,
  "startDate": "2024-01-15T00:00:00Z",
  "endDate": "2024-01-20T04:00:00Z"
}
```

**Update Announcement**:

```
PATCH /api/admin/announcements/:id
```

**Delete Announcement**:

```
DELETE /api/admin/announcements/:id
```

**List Announcements**:

```
GET /api/admin/announcements?isActive=true
```

#### Display Behavior

- Active announcements are shown to all users
- Announcements appear at the top of the dashboard
- Users can dismiss announcements (stored in local storage)
- Announcements automatically hide after end date
- Multiple announcements can be active simultaneously

### 2. Error Logs

**Purpose**: Monitor and investigate failed AI generations and system errors

**Location**: `/admin/support` - Error Logs section

#### Error Information

- Error ID and timestamp
- User and workspace information
- Generation type (text, image, speech, transcription)
- AI provider and model
- Error message and details
- Request parameters
- Stack trace (if available)

#### Filtering Options

- By generation type
- By user ID
- By workspace ID
- By date range
- By AI provider

#### Error Statistics

- Total errors in period
- Errors by type
- Errors by provider
- Error rate trends
- Top error messages

#### API Endpoint

```
GET /api/admin/error-logs
```

**Query Parameters**:

- `page` (number): Page number
- `limit` (number): Results per page
- `type` (string): Filter by generation type
- `userId` (string): Filter by user
- `workspaceId` (string): Filter by workspace
- `startDate` (string): Start date (ISO format)
- `endDate` (string): End date (ISO format)

**Response**:

```json
{
  "logs": [
    {
      "id": "gen-123",
      "type": "text",
      "status": "failed",
      "error": "API rate limit exceeded",
      "provider": "openai",
      "model": "gpt-4",
      "user": {
        "id": "user-123",
        "email": "user@example.com"
      },
      "workspace": {
        "id": "workspace-123",
        "name": "My Workspace"
      },
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "stats": {
    "total": 150,
    "byType": {
      "text": 80,
      "image": 40,
      "speech": 20,
      "transcription": 10
    },
    "byProvider": {
      "openai": 100,
      "anthropic": 30,
      "google": 20
    }
  },
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

### 3. System Health Monitoring

**Purpose**: Monitor system health and connectivity

**Location**: `/admin/support` - System Health section

#### Health Checks

1. **Database Status**
   - Connection status (connected/disconnected)
   - Response time
   - Active connections
   - Last check timestamp

2. **Cache Status** (Redis)
   - Connection status
   - Response time
   - Memory usage
   - Hit rate
   - Last check timestamp

3. **API Health**
   - Overall status (healthy/degraded/down)
   - Response time
   - Error rate
   - Last check timestamp

#### Health Status Indicators

- **Healthy** (Green) - All systems operational
- **Degraded** (Yellow) - Some issues detected
- **Down** (Red) - Critical systems unavailable

#### API Endpoint

```
GET /api/admin/system-health
```

**Response**:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "database": {
    "status": "connected",
    "responseTime": 15,
    "activeConnections": 5
  },
  "cache": {
    "status": "connected",
    "responseTime": 2,
    "memoryUsage": "45%",
    "hitRate": "92%"
  },
  "api": {
    "status": "healthy",
    "responseTime": 120,
    "errorRate": "0.5%"
  }
}
```

### 4. User Impersonation

**Purpose**: Access user accounts for support and troubleshooting

**Location**: User management page or support tools

#### Use Cases

- Troubleshoot user-reported issues
- Verify user experience
- Assist with account problems
- Test user-specific configurations
- Investigate billing issues

#### Security Features

- Time-limited sessions (default: 1 hour)
- All actions logged with impersonation context
- Cannot impersonate other admins
- Automatic session cleanup
- Visible impersonation banner for admin

#### Starting Impersonation

**From User Management**:

1. Navigate to `/admin/users`
2. Find the user
3. Click "Impersonate"
4. Confirm impersonation
5. Platform loads as that user

**API Endpoint**:

```
POST /api/admin/impersonation
```

**Body**:

```json
{
  "userId": "user-123"
}
```

**Response**:

```json
{
  "sessionId": "imp-session-123",
  "userId": "user-123",
  "adminId": "admin-456",
  "expiresAt": "2024-01-15T11:30:00Z"
}
```

#### Ending Impersonation

**Manual**:

1. Click "End Impersonation" button in banner
2. Confirm action
3. Return to admin account

**Automatic**:

- Session expires after timeout (1 hour)
- Admin logs out
- Browser is closed

**API Endpoint**:

```
DELETE /api/admin/impersonation
```

**Query Parameters**:

- `sessionId` (string): Impersonation session ID

#### Active Sessions

View all active impersonation sessions:

```
GET /api/admin/impersonation
```

**Response**:

```json
{
  "sessions": [
    {
      "id": "imp-session-123",
      "adminId": "admin-456",
      "userId": "user-123",
      "startedAt": "2024-01-15T10:30:00Z",
      "expiresAt": "2024-01-15T11:30:00Z",
      "admin": {
        "email": "admin@example.com",
        "firstName": "Admin",
        "lastName": "User"
      },
      "user": {
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe"
      }
    }
  ]
}
```

## Security Considerations

### Access Control

- Only admins can access support tools
- All endpoints protected by `requireAdmin()` middleware
- Impersonation is restricted to non-admin users

### Audit Logging

All support tool actions are logged:

- Announcement creation, updates, deletion
- Error log viewing
- System health checks
- Impersonation sessions (start and end)

### Data Privacy

- Error logs may contain sensitive data
- Access should be restricted to authorized personnel
- Consider data retention policies
- Comply with GDPR and privacy regulations

### Impersonation Security

- Time-limited sessions prevent abuse
- All actions during impersonation are logged
- Cannot impersonate admins
- Visible banner prevents confusion
- Automatic cleanup on timeout

## Usage Examples

### Create Maintenance Announcement

1. Navigate to `/admin/support`
2. Scroll to Announcements section
3. Click "Create Announcement"
4. Fill in details:
   - Title: "Scheduled Maintenance"
   - Content: "Platform will be unavailable..."
   - Type: Warning
   - Start date: Tomorrow
   - End date: Tomorrow + 2 hours
5. Click "Create"
6. Announcement is shown to all users

### Investigate Error Spike

1. Navigate to `/admin/support`
2. Scroll to Error Logs section
3. Set date range to last 24 hours
4. Review error statistics
5. Filter by provider if needed
6. Click on specific errors for details
7. Identify common patterns
8. Take corrective action

### Check System Health

1. Navigate to `/admin/support`
2. Scroll to System Health section
3. Review status indicators
4. Check response times
5. If issues detected:
   - Check database connections
   - Verify Redis is running
   - Review API error logs
   - Contact infrastructure team

### Support User via Impersonation

1. User reports issue with generation
2. Navigate to `/admin/users`
3. Find the user
4. Click "Impersonate"
5. Confirm impersonation
6. Reproduce the issue
7. Identify the problem
8. Fix or document the issue
9. Click "End Impersonation"
10. Follow up with user

## Performance Considerations

- Error logs are paginated for performance
- System health checks are cached (30 seconds)
- Announcements are cached for fast display
- Consider archiving old error logs
- Monitor impersonation session count

## Testing

```bash
# Run support tools tests
npm test src/app/api/admin/announcements/route.test.ts
npm test src/app/api/admin/error-logs/route.test.ts
npm test src/app/api/admin/system-health/route.test.ts
npm test src/app/api/admin/impersonation/route.test.ts
```

## Related Documentation

- [Admin Dashboard Overview](../README.md)
- [Admin API Documentation](../../../../src/app/api/admin/README.md)
- [Impersonation Feature](../../../../src/lib/admin/IMPERSONATION.md)
- [Error Handling](../../../../src/lib/errors/USAGE.md)
- [Audit Logging](../audit-logs/README.md)
