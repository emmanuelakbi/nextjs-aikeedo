# Admin Dashboard Documentation

## Overview

The Admin Dashboard is a comprehensive administrative interface for managing the AIKEEDO platform. It provides tools for user management, workspace administration, subscription handling, system configuration, analytics, reporting, and content moderation.

## Quick Links

- [Admin Dashboard Overview](<../src/app/(dashboard)/admin/README.md>)
- [Admin API Reference](../src/app/api/admin/README.md)
- [Requirements Document](../.kiro/specs/nextjs-admin-dashboard/requirements.md)
- [Design Document](../.kiro/specs/nextjs-admin-dashboard/design.md)
- [Implementation Tasks](../.kiro/specs/nextjs-admin-dashboard/tasks.md)

## Documentation Index

### Core Documentation

1. **[Admin Dashboard Overview](<../src/app/(dashboard)/admin/README.md>)**
   - Complete overview of admin dashboard features
   - Access control and security
   - Getting started guide
   - Troubleshooting

2. **[Admin API Reference](../src/app/api/admin/README.md)**
   - Complete API endpoint documentation
   - Request/response formats
   - Authentication and authorization
   - Error handling

### Feature Documentation

3. **[User Management](<../src/app/(dashboard)/admin/users/README.md>)**
   - User list and search
   - User details and editing
   - Account suspension and activation
   - User deletion
   - Activity monitoring
   - Impersonation

4. **[Workspace Management](<../src/app/(dashboard)/admin/workspaces/README.md>)**
   - Workspace list and search
   - Workspace details
   - Credit management and adjustments
   - Ownership transfer
   - Usage statistics
   - Workspace deletion

5. **[Subscription Management](<../src/app/(dashboard)/admin/subscriptions/README.md>)**
   - Subscription list and filtering
   - Subscription details
   - Cancellation and reactivation
   - Payment history
   - Refund processing
   - Failed payment handling

6. **[System Settings](<../src/app/(dashboard)/admin/settings/README.md>)**
   - Settings management by category
   - Subscription plan management
   - AI provider configuration
   - Email and security settings
   - Feature toggles

7. **[Reports](<../src/app/(dashboard)/admin/reports/README.md>)**
   - Revenue reports
   - User growth reports
   - AI usage reports
   - Financial reports
   - Subscription reports
   - Export functionality

8. **[Audit Logs](<../src/app/(dashboard)/admin/audit-logs/README.md>)**
   - Audit log viewing and filtering
   - Export functionality
   - Security monitoring
   - Compliance tracking

9. **[Support Tools](<../src/app/(dashboard)/admin/support/README.md>)**
   - Announcements management
   - Error log monitoring
   - System health checks
   - User impersonation

10. **[Content Moderation](<../src/app/(dashboard)/admin/moderation/README.md>)**
    - Moderation queue
    - Content flagging and removal
    - User banning
    - Moderation statistics
    - Policy enforcement

### Technical Documentation

11. **[Impersonation Feature](../src/lib/admin/IMPERSONATION.md)**
    - Impersonation implementation
    - Security considerations
    - Usage examples

12. **[Admin Utilities](../src/lib/admin/README.md)**
    - Admin helper functions
    - Audit logging utilities
    - Access control functions

## Getting Started

### Prerequisites

1. **Admin Role Assignment**

   ```sql
   UPDATE "User" SET role = 'ADMIN' WHERE email = 'admin@example.com';
   ```

2. **Environment Variables**
   - Ensure all required environment variables are set
   - See [Environment Documentation](./ENVIRONMENT.md)

3. **Database Setup**
   - Run migrations: `npm run db:migrate`
   - Verify admin schema exists

### First-Time Setup

1. **Access the Dashboard**
   - Navigate to `/admin`
   - Log in with admin credentials

2. **Configure System Settings**
   - Go to `/admin/settings`
   - Set up AI provider API keys
   - Configure email settings
   - Set platform name and branding

3. **Create Subscription Plans**
   - Navigate to settings
   - Create plans with pricing and features
   - Activate plans for users

4. **Review System Health**
   - Go to `/admin/support`
   - Verify all systems are operational

## Key Features

### User Management

- Search and filter users
- Edit user details and roles
- Suspend/activate accounts
- View activity logs
- Impersonate for support

### Workspace Management

- View all workspaces
- Adjust credits manually
- Transfer ownership
- Monitor usage
- Delete workspaces

### Subscription Management

- View all subscriptions
- Cancel/reactivate subscriptions
- Process refunds
- Handle failed payments
- View payment history

### Analytics & Reporting

- Real-time analytics dashboard
- Generate comprehensive reports
- Export data (JSON/CSV)
- Track key metrics (MRR, churn, usage)

### Content Moderation

- Review generated content
- Flag inappropriate content
- Remove policy violations
- Ban users for violations
- Track moderation statistics

### System Administration

- Configure platform settings
- Manage subscription plans
- Monitor system health
- View error logs
- Create announcements

## Security

### Access Control

- Admin role required for all features
- Session-based authentication
- Automatic authorization checks
- Failed access attempts logged

### Audit Logging

- All admin actions logged
- Includes admin ID, action, target, changes
- IP address and user agent tracked
- Exportable for compliance

### Data Protection

- Sensitive data encrypted at rest
- API keys never exposed
- GDPR compliant data handling
- Secure impersonation with time limits

## API Overview

### Base URL

```
/api/admin
```

### Authentication

All endpoints require:

- Valid session cookie
- User role: ADMIN

### Response Format

**Success**:

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

**Error**:

```json
{
  "error": "Error message",
  "details": []
}
```

### Rate Limiting

- Admin routes have higher limits than user routes
- Still subject to rate limiting
- Configurable per-endpoint

## Testing

### Running Tests

```bash
# Run all admin tests
npm test src/app/api/admin

# Run specific feature tests
npm test src/app/api/admin/users
npm test src/app/api/admin/workspaces
npm test src/app/api/admin/subscriptions

# Run with coverage
npm run test:coverage
```

### Test Coverage

- ✅ User management (8 tests)
- ✅ Workspace management (6 tests)
- ✅ Subscription management (5 tests)
- ✅ System settings (5 tests)
- ✅ Audit logs (5 tests)
- ✅ Reports (6 tests)
- ✅ System health (4 tests)

Total: 39+ tests passing

## Compliance

### GDPR (General Data Protection Regulation)

- Audit trail for data access
- User data deletion capabilities
- Data export functionality
- Consent tracking

### SOC 2 (Service Organization Control 2)

- Security monitoring and logging
- Access control enforcement
- Audit trail for all changes
- System health monitoring

### PCI DSS (Payment Card Industry Data Security Standard)

- Secure payment data handling via Stripe
- Access logging and monitoring
- No credit card data stored locally
- Regular security reviews

## Performance

### Optimization Strategies

- Pagination on all list endpoints
- Database indexes on frequently queried fields
- Selective field fetching
- Caching for analytics data
- Background jobs for heavy operations

### Monitoring

- Track API response times
- Monitor error rates
- Track admin action frequency
- System health metrics

## Troubleshooting

### Common Issues

**Cannot access admin dashboard**

- Verify user has ADMIN role in database
- Check session is valid
- Verify environment variables

**API returns 403 Forbidden**

- Ensure user is authenticated
- Verify admin role is set
- Check session cookie

**Reports generation fails**

- Verify date format (YYYY-MM-DD)
- Check database connectivity
- Review query performance

**Impersonation not working**

- Verify target user is not admin
- Check session timeout settings
- Review impersonation logs

## Support

### Getting Help

1. Review relevant documentation section
2. Check API documentation for endpoint details
3. Review audit logs for error details
4. Check system health status
5. Contact development team

### Reporting Issues

- Include error messages
- Provide steps to reproduce
- Check audit logs for context
- Note affected users/workspaces

## Future Enhancements

Potential improvements:

- Real-time dashboard updates (WebSockets)
- Advanced analytics with charts
- Bulk operations for users/workspaces
- Scheduled report generation
- Custom dashboard widgets
- Role-based admin permissions
- API key management
- Webhook management
- Advanced search capabilities
- Mobile admin app

## Related Documentation

- [Architecture Overview](./ARCHITECTURE.md)
- [API Documentation](./API.md)
- [Billing System](./BILLING.md)
- [Credit System](./CREDIT_SYSTEM.md)
- [Environment Variables](./ENVIRONMENT.md)
- [Setup Guide](./SETUP.md)

## Changelog

### Version 1.0.0 (Initial Release)

- User management interface
- Workspace management
- Subscription management
- System settings
- Analytics dashboard
- Reporting system
- Audit logging
- Support tools
- Content moderation
- Impersonation feature

## License

Copyright © 2024 AIKEEDO. All rights reserved.
