# Admin Audit Logging System

## Overview

The Admin Audit Logging System provides comprehensive tracking and monitoring of all administrative actions performed in the system. It fulfills **Requirement 8: Audit Logging** from the Admin Dashboard specification.

## Features

### Core Capabilities

1. **Automatic Action Logging**
   - All admin actions are automatically logged
   - Captures admin identity, action type, target, and changes
   - Records IP address and user agent for security tracking
   - Timestamps for precise audit trails

2. **Comprehensive Filtering**
   - Filter by admin user ID
   - Filter by target type (user, workspace, subscription, etc.)
   - Filter by target ID
   - Filter by action type
   - Date range filtering for exports

3. **Audit Log Viewing**
   - Paginated list view with 50 records per page
   - Detailed view modal for individual log entries
   - Color-coded action badges for quick identification
   - Real-time updates

4. **Export Functionality**
   - CSV export for compliance and analysis
   - Filtered exports based on current search criteria
   - Includes all relevant audit information
   - Automatic filename generation with date

5. **Security Monitoring**
   - Track security-sensitive actions (suspensions, deletions)
   - Monitor admin behavior patterns
   - IP address tracking for location analysis
   - User agent tracking for device identification

## Data Model

### AdminAction

```typescript
{
  id: string;              // Unique identifier
  adminId: string;         // ID of admin who performed action
  action: string;          // Action type (e.g., 'user.suspend')
  targetType: string;      // Type of target (e.g., 'user', 'workspace')
  targetId: string;        // ID of the target entity
  changes: Json;           // Object containing the changes made
  ipAddress: string | null; // IP address of the admin
  userAgent: string | null; // Browser/client user agent
  createdAt: Date;         // Timestamp of the action
}
```

## API Endpoints

### GET /api/admin/audit-logs

Fetch audit logs with optional filtering and pagination.

**Query Parameters:**
- `adminId` (optional): Filter by admin user ID
- `targetType` (optional): Filter by target type
- `targetId` (optional): Filter by target ID
- `action` (optional): Filter by action type
- `limit` (optional): Number of records per page (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "logs": [
    {
      "id": "log-123",
      "adminId": "admin-456",
      "action": "user.suspend",
      "targetType": "user",
      "targetId": "user-789",
      "changes": { "status": "SUSPENDED" },
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2024-01-15T10:30:00Z",
      "admin": {
        "id": "admin-456",
        "email": "admin@example.com",
        "firstName": "John",
        "lastName": "Doe"
      }
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

### GET /api/admin/audit-logs/export

Export audit logs as CSV.

**Query Parameters:**
- Same as GET /api/admin/audit-logs
- `format` (optional): Export format (default: 'csv')
- `startDate` (optional): Filter logs from this date
- `endDate` (optional): Filter logs until this date

**Response:**
- CSV file download with all matching audit logs

## Utility Functions

### logAdminAction

Manually log an admin action.

```typescript
import { logAdminAction } from '@/lib/admin/audit-logger';

await logAdminAction({
  adminId: session.user.id,
  action: 'user.suspend',
  targetType: 'user',
  targetId: userId,
  changes: { status: 'SUSPENDED', reason: 'Policy violation' },
  ipAddress: request.headers.get('x-forwarded-for'),
  userAgent: request.headers.get('user-agent'),
});
```

### withAuditLog

Higher-order function to automatically wrap actions with audit logging.

```typescript
import { withAuditLog } from '@/lib/admin/audit-logger';

const suspendUser = withAuditLog(
  'user.suspend',
  'user',
  async (adminId, targetId, changes) => {
    await prisma.user.update({
      where: { id: targetId },
      data: { status: 'SUSPENDED' },
    });
  }
);

// Usage
await suspendUser(
  session.user.id,
  userId,
  { status: 'SUSPENDED' },
  request
);
```

### getAuditLogs

Retrieve audit logs with filtering.

```typescript
import { getAuditLogs } from '@/lib/admin/audit-logger';

const logs = await getAuditLogs({
  adminId: 'admin-123',
  targetType: 'user',
  limit: 100,
  offset: 0,
});
```

### getTargetAuditLogs

Get all audit logs for a specific target.

```typescript
import { getTargetAuditLogs } from '@/lib/admin/audit-logger';

const userLogs = await getTargetAuditLogs('user', userId);
```

### getAdminAuditLogs

Get all actions performed by a specific admin.

```typescript
import { getAdminAuditLogs } from '@/lib/admin/audit-logger';

const adminActions = await getAdminAuditLogs(adminId);
```

## Action Naming Convention

Actions follow a consistent naming pattern: `{entity}.{operation}`

**Examples:**
- `user.create` - User account created
- `user.update` - User details updated
- `user.suspend` - User account suspended
- `user.activate` - User account activated
- `user.delete` - User account deleted
- `workspace.create` - Workspace created
- `workspace.update` - Workspace updated
- `workspace.delete` - Workspace deleted
- `workspace.credits.adjust` - Workspace credits adjusted
- `subscription.create` - Subscription created
- `subscription.cancel` - Subscription canceled
- `subscription.reactivate` - Subscription reactivated
- `setting.update` - System setting updated
- `announcement.create` - Announcement created
- `announcement.update` - Announcement updated

## UI Components

### Audit Logs Page (`/admin/audit-logs`)

Interactive interface for viewing and filtering audit logs:

1. **Filter Panel**
   - Admin ID input
   - Target type dropdown
   - Target ID input
   - Action input
   - Apply/Clear filter buttons
   - Export CSV button

2. **Audit Logs Table**
   - Timestamp column
   - Admin information (name and email)
   - Action badge (color-coded)
   - Target information (type and ID)
   - IP address
   - Details button

3. **Details Modal**
   - Full audit log information
   - Formatted changes object
   - Complete user agent string
   - All metadata

4. **Pagination**
   - Previous/Next buttons
   - Record count display
   - Automatic page management

## Security Considerations

### Access Control
- Only users with ADMIN role can access audit logs
- All endpoints protected by `requireAdmin()` middleware
- Audit log viewing is itself logged

### Data Retention
- Audit logs are stored indefinitely by default
- Consider implementing retention policies for compliance
- Regular backups recommended for audit trail preservation

### Privacy
- IP addresses and user agents are stored for security
- Sensitive data in changes should be sanitized
- Export functionality should be restricted to authorized personnel

## Compliance

The audit logging system helps meet various compliance requirements:

### GDPR (General Data Protection Regulation)
- Tracks data access and modifications
- Provides audit trail for data subject requests
- Records consent and deletion actions

### SOC 2 (Service Organization Control 2)
- Demonstrates security monitoring
- Tracks administrative access
- Provides evidence of security controls

### HIPAA (Health Insurance Portability and Accountability Act)
- Audit trail for protected health information access
- Tracks administrative actions
- Supports security incident investigation

### PCI DSS (Payment Card Industry Data Security Standard)
- Tracks access to cardholder data
- Monitors administrative actions
- Supports forensic analysis

## Usage Examples

### View Recent Admin Actions

1. Navigate to `/admin/audit-logs`
2. View the default list of recent actions
3. Click "View Details" on any log entry for more information

### Find All Actions by a Specific Admin

1. Go to `/admin/audit-logs`
2. Enter the admin ID in the "Admin ID" filter
3. Click "Apply Filters"
4. Review all actions performed by that admin

### Export User Suspension Logs

1. Navigate to `/admin/audit-logs`
2. Select "user" in the Target Type dropdown
3. Enter "suspend" in the Action filter
4. Click "Export CSV"
5. Open the downloaded file in Excel or Google Sheets

### Monitor Security Events

1. Go to `/admin/audit-logs`
2. Look for red-badged actions (deletions, suspensions)
3. Review IP addresses for unusual patterns
4. Click "View Details" to see full context

## Performance Considerations

- Audit logs table is indexed on key fields (adminId, targetType, targetId, createdAt)
- Pagination limits query size for better performance
- Export functionality has a 10,000 record limit
- Consider archiving old logs for long-term storage

## Testing

The audit logging system includes comprehensive unit tests:

```bash
npm test src/app/api/admin/audit-logs/route.test.ts
```

Tests cover:
- Fetching logs with default pagination
- Filtering by admin ID, target type, and action
- Pagination functionality
- Error handling

## Future Enhancements

Potential improvements for future iterations:

- Real-time audit log streaming
- Advanced search with full-text queries
- Anomaly detection for suspicious patterns
- Automated alerts for critical actions
- Integration with SIEM systems
- Audit log retention policies
- Automated compliance reports
- Audit log integrity verification (checksums)
- Role-based audit log access (view only certain types)

## Related Documentation

- [Admin Dashboard Requirements](/.kiro/specs/nextjs-admin-dashboard/requirements.md)
- [Admin Dashboard Design](/.kiro/specs/nextjs-admin-dashboard/design.md)
- [Audit Logger Utility](/src/lib/admin/audit-logger.ts)
- [Admin API Documentation](/docs/API.md)
