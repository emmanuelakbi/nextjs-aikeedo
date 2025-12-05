# Admin Dashboard Module

## Overview

The Admin Dashboard provides a comprehensive interface for system administrators to manage users, workspaces, subscriptions, system settings, and monitor platform health. This module implements all administrative capabilities required for the AIKEEDO platform.

## Table of Contents

- [Features](#features)
- [Access Control](#access-control)
- [Dashboard Sections](#dashboard-sections)
- [Getting Started](#getting-started)
- [Security](#security)
- [API Documentation](#api-documentation)
- [Testing](#testing)

## Features

### Core Capabilities

1. **User Management** - View, edit, suspend, and manage user accounts
2. **Workspace Management** - Manage workspaces, credits, and ownership
3. **Subscription Management** - Handle subscriptions, payments, and refunds
4. **System Settings** - Configure platform-wide settings and plans
5. **Analytics Dashboard** - Monitor key metrics and system health
6. **Reporting System** - Generate and export comprehensive reports
7. **Audit Logging** - Track all administrative actions
8. **Support Tools** - Manage announcements, error logs, and system health
9. **Content Moderation** - Review and moderate generated content
10. **Impersonation** - Securely access user accounts for support

## Access Control

### Requirements

- User must have `role: 'ADMIN'` in the database
- Valid authenticated session
- All admin routes are protected by `requireAdmin()` middleware

### Setting Admin Role

```sql
-- Update user to admin role
UPDATE "User" SET role = 'ADMIN' WHERE email = 'admin@example.com';
```

### Access Denied Handling

- Non-admin users are redirected to `/dashboard`
- Unauthorized API requests return `403 Forbidden`
- All access attempts are logged for security monitoring

## Dashboard Sections

### 1. Analytics Dashboard (`/admin`)

**Purpose**: Overview of key platform metrics and quick actions

**Features**:
- User statistics (total, active, new this month)
- Workspace statistics (total, active)
- Subscription statistics (active, MRR, churn rate)
- Revenue metrics (total, this month)
- AI usage statistics (generations, credits consumed)
- Quick action cards for common tasks

**Key Metrics**:
- Monthly Recurring Revenue (MRR)
- Churn Rate
- Active Users
- Credit Consumption
- Generation Success Rate

### 2. User Management (`/admin/users`)

**Purpose**: Manage user accounts and permissions

**Features**:
- Search users by email or name
- Filter by status (active, suspended, inactive) and role
- Sort by various fields (created date, last seen, etc.)
- View detailed user information
- Edit user details (name, email, role, status)
- Suspend/activate user accounts
- View user activity logs
- Impersonate users for support
- Delete user accounts

**User Details Include**:
- Basic information (name, email, phone)
- Account status and role
- Workspaces owned
- Affiliate information
- Activity statistics (conversations, generations, files)
- Recent sessions

**Documentation**: See [API Documentation](../../../api/admin/README.md#user-management)

### 3. Workspace Management (`/admin/workspaces`)

**Purpose**: Manage workspaces and credit allocations

**Features**:
- Search workspaces by name
- View workspace details and members
- Adjust workspace credits (add/subtract)
- Transfer workspace ownership
- View usage statistics
- Delete workspaces

**Workspace Details Include**:
- Owner information
- Member list
- Credit balance (subscription + purchased)
- Active subscription
- Usage statistics
- Recent credit transactions

**Documentation**: See [API Documentation](../../../api/admin/README.md#workspace-management)

### 4. Subscription Management (`/admin/subscriptions`)

**Purpose**: Manage subscriptions and billing

**Features**:
- View all subscriptions with filters
- Filter by status (active, trialing, canceled, etc.)
- View subscription details and history
- Cancel subscriptions (immediate or at period end)
- Reactivate canceled subscriptions
- View payment history
- Process refunds

**Subscription Details Include**:
- Workspace and owner information
- Plan details and pricing
- Billing cycle and renewal date
- Status and trial information
- Invoice history
- Credit allocations

**Related Features**:
- Payment history viewing
- Refund processing
- Failed payment handling

**Documentation**: See [API Documentation](../../../api/admin/README.md#subscription-management)

### 5. System Settings (`/admin/settings`)

**Purpose**: Configure platform-wide settings

**Features**:
- View all system settings by category
- Create new settings
- Update existing settings
- Delete settings
- Manage subscription plans
- Configure AI provider settings
- Set rate limits
- Manage email templates

**Setting Categories**:
- General (platform name, contact email)
- AI Providers (API keys, default models)
- Billing (currency, tax rates)
- Email (SMTP settings, templates)
- Security (session timeout, password policy)
- Features (enable/disable features)

**Plan Management**:
- Create subscription plans
- Update plan pricing and features
- Activate/deactivate plans
- View plan subscription counts
- Delete unused plans

**Documentation**: See [API Documentation](../../../api/admin/README.md#system-settings)

### 6. Reports (`/admin/reports`)

**Purpose**: Generate comprehensive reports for analysis

**Report Types**:
1. **Revenue Report** - Invoice and subscription revenue breakdown
2. **User Growth Report** - New user registrations and activity
3. **AI Usage Report** - Generation statistics by type and provider
4. **Financial Report** - Revenue, refunds, and net income
5. **Subscription Report** - New subscriptions, churn, and lifecycle

**Features**:
- Date range selection
- JSON and CSV export formats
- Summary metrics
- Detailed data tables
- Automatic filename generation

**Documentation**: See [Reports README](./reports/README.md)

### 7. Audit Logs (`/admin/audit-logs`)

**Purpose**: Track all administrative actions for compliance

**Features**:
- View all admin actions with pagination
- Filter by admin, target type, target ID, action
- Export audit logs as CSV
- View detailed action information
- Monitor security events
- Track data changes

**Logged Information**:
- Admin user ID and details
- Action type (e.g., user.suspend)
- Target resource type and ID
- Changes made (JSON)
- IP address
- User agent
- Timestamp

**Documentation**: See [Audit Logs README](./audit-logs/README.md)

### 8. Support Tools (`/admin/support`)

**Purpose**: Tools for customer support and system monitoring

**Features**:
- **Announcements**: Create and manage system-wide announcements
- **Error Logs**: View failed generations and system errors
- **System Health**: Monitor database, cache, and API health
- **Impersonation**: Access user accounts for support

**Announcement Types**:
- Info (blue) - General information
- Warning (yellow) - Important notices
- Error (red) - Critical alerts

**System Health Checks**:
- Database connectivity
- Cache availability (Redis)
- API response times
- Error rates

**Documentation**: See [API Documentation](../../../api/admin/README.md#support-tools)

### 9. Content Moderation (`/admin/moderation`)

**Purpose**: Review and moderate user-generated content

**Features**:
- View moderation queue
- Filter by content type and status
- Flag inappropriate content
- Remove content
- Ban users for violations
- View moderation statistics
- Track top flagged users

**Moderation Actions**:
- Flag content for review
- Remove content from platform
- Ban user account
- Add moderation notes

**Statistics**:
- Total flagged content
- Content by type
- Top flagged users
- Moderation trends

**Documentation**: See [API Documentation](../../../api/admin/README.md#content-moderation)

### 10. Affiliate Management (`/admin/affiliate`)

**Purpose**: Manage affiliate program and payouts

**Features**:
- View affiliate statistics
- Manage payout requests
- Approve/reject payouts
- Process approved payouts
- Monitor fraud indicators
- View affiliate performance

**Payout Workflow**:
1. Affiliate requests payout
2. Admin reviews request
3. Admin approves or rejects
4. Admin processes approved payout
5. Payment sent to affiliate

**Documentation**: See [Affiliate Documentation](../../../../AFFILIATE_MODULE.md)

## Getting Started

### Prerequisites

1. Admin role assigned to user account
2. Valid authentication session
3. Proper environment variables configured

### Accessing the Admin Dashboard

1. Log in to your account
2. Navigate to `/admin`
3. If you don't have admin access, contact a system administrator

### First-Time Setup

1. **Configure System Settings**
   - Go to `/admin/settings`
   - Set up AI provider API keys
   - Configure email settings
   - Set platform name and contact information

2. **Create Subscription Plans**
   - Go to `/admin/settings`
   - Navigate to Plans section
   - Create plans with pricing and features
   - Activate plans for user selection

3. **Review System Health**
   - Go to `/admin/support`
   - Check system health status
   - Verify database and cache connectivity

4. **Set Up Announcements**
   - Go to `/admin/support`
   - Create welcome announcement
   - Set active dates

## Security

### Authentication & Authorization

- All routes require admin role
- Session-based authentication via NextAuth
- Automatic session validation on each request
- Failed auth attempts are logged

### Audit Logging

Every admin action is automatically logged with:
- Admin user ID
- Action type
- Target resource
- Changes made
- IP address
- User agent
- Timestamp

### Data Protection

- Sensitive data is encrypted at rest
- API keys are never exposed in responses
- Password hashes are never returned
- PII is handled according to GDPR requirements

### Rate Limiting

- Admin routes have higher rate limits than user routes
- Still subject to rate limiting to prevent abuse
- Configurable per-endpoint limits

### Impersonation Security

- Time-limited sessions (default: 1 hour)
- All actions logged with impersonation context
- Cannot impersonate other admins
- Automatic session cleanup

## API Documentation

### Base URL

All admin API routes are prefixed with `/api/admin`

### Authentication

Include session cookie in all requests. The API will automatically validate admin role.

### Response Format

**Success Response**:
```json
{
  "data": {},
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

**Error Response**:
```json
{
  "error": "Error message",
  "details": []
}
```

### Complete API Reference

See [Admin API Documentation](../../../api/admin/README.md) for complete endpoint reference.

## Testing

### Running Tests

```bash
# Run all admin tests
npm test src/app/api/admin

# Run specific test file
npm test src/app/api/admin/users/route.test.ts

# Run with coverage
npm run test:coverage
```

### Test Coverage

- Unit tests for all API routes
- Integration tests for complex workflows
- E2E tests for critical user flows
- Property-based tests for data validation

### Existing Tests

- ✅ User management API (8 tests)
- ✅ Workspace management API (6 tests)
- ✅ System settings API (5 tests)
- ✅ Audit logs API (5 tests)
- ✅ Reports API (6 tests)
- ✅ System health API (4 tests)

## Performance Considerations

### Optimization Strategies

1. **Pagination**: All list endpoints use pagination
2. **Selective Fields**: Only fetch needed data from database
3. **Indexes**: Database indexes on frequently queried fields
4. **Caching**: Consider caching for analytics endpoints
5. **Batch Operations**: Use transactions for multi-step operations

### Monitoring

- Track API response times
- Monitor error rates
- Track admin action frequency
- Monitor system health metrics

## Compliance

The admin dashboard helps meet various compliance requirements:

### GDPR (General Data Protection Regulation)
- Audit trail for data access and modifications
- User data deletion capabilities
- Data export functionality
- Consent tracking

### SOC 2 (Service Organization Control 2)
- Security monitoring and logging
- Access control enforcement
- Audit trail for all changes
- System health monitoring

### PCI DSS (Payment Card Industry Data Security Standard)
- Secure payment data handling
- Access logging and monitoring
- Regular security reviews
- Incident response capabilities

## Troubleshooting

### Common Issues

**Issue**: Cannot access admin dashboard
- **Solution**: Verify user has ADMIN role in database
- **Check**: `SELECT role FROM "User" WHERE email = 'your@email.com'`

**Issue**: API returns 403 Forbidden
- **Solution**: Ensure valid session and admin role
- **Check**: Session cookie is present and valid

**Issue**: Audit logs not appearing
- **Solution**: Verify `logAdminAction()` is called in route handlers
- **Check**: Database connection and AdminAction table

**Issue**: Reports generation fails
- **Solution**: Check date range format (YYYY-MM-DD)
- **Check**: Database connectivity and query performance

## Related Documentation

- [Admin API Routes](../../../api/admin/README.md)
- [Audit Logging System](./audit-logs/README.md)
- [Reporting System](./reports/README.md)
- [Impersonation Feature](../../../../src/lib/admin/IMPERSONATION.md)
- [Admin Utilities](../../../../src/lib/admin/README.md)
- [Requirements Document](../../../../.kiro/specs/nextjs-admin-dashboard/requirements.md)
- [Design Document](../../../../.kiro/specs/nextjs-admin-dashboard/design.md)

## Support

For technical support or questions:
- Review the documentation above
- Check the [API documentation](../../../api/admin/README.md)
- Review audit logs for error details
- Contact the development team

## Future Enhancements

Potential improvements for future iterations:

- Real-time dashboard updates via WebSockets
- Advanced analytics with charts and graphs
- Bulk operations for users and workspaces
- Scheduled report generation and email delivery
- Custom dashboard widgets
- Role-based admin permissions (super admin, support admin, etc.)
- API key management for integrations
- Webhook management for system events
- Advanced search with full-text queries
- Mobile app for admin dashboard
