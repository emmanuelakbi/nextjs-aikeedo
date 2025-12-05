# Admin API Routes

This directory contains all admin-only API routes for the AIKEEDO platform. All routes require admin authentication via the `requireAdmin()` middleware.

## Authentication

All admin routes require:
- Valid session with `role: 'ADMIN'`
- Routes automatically return 401 if user is not authenticated
- Routes automatically return 403 if user is not an admin

## Available Routes

### User Management

**GET /api/admin/users**
- List all users with search and filters
- Query params: `page`, `limit`, `search`, `status`, `role`, `sortBy`, `sortOrder`
- Returns: Paginated user list with counts

**GET /api/admin/users/:id**
- Get detailed user information
- Returns: User details with workspaces, affiliate info, and activity counts

**PATCH /api/admin/users/:id**
- Update user details (name, email, role, status)
- Body: `{ firstName?, lastName?, email?, role?, status?, phoneNumber?, language? }`
- Returns: Updated user

**DELETE /api/admin/users/:id**
- Delete a user (cannot delete self)
- Returns: Success confirmation

**POST /api/admin/users/:id/status**
- Update user status (activate/suspend)
- Body: `{ status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED', reason? }`
- Returns: Updated user

**GET /api/admin/users/:id/activity**
- Get user activity logs and statistics
- Query params: `limit`, `offset`
- Returns: Recent conversations, generations, files, documents, sessions

**POST /api/admin/users/:id/impersonate**
- Start impersonation session for user
- Returns: Impersonation session details

**DELETE /api/admin/users/:id/impersonate**
- End impersonation session
- Query params: `sessionId`
- Returns: Success confirmation

### Workspace Management

**GET /api/admin/workspaces**
- List all workspaces with search and filters
- Query params: `page`, `limit`, `search`, `sortBy`, `sortOrder`
- Returns: Paginated workspace list with owner and subscription info

**GET /api/admin/workspaces/:id**
- Get detailed workspace information
- Returns: Workspace details with members, subscription, credit transactions

**PATCH /api/admin/workspaces/:id**
- Update workspace details
- Body: `{ name?, ownerId? }`
- Returns: Updated workspace

**DELETE /api/admin/workspaces/:id**
- Delete a workspace
- Returns: Success confirmation

**POST /api/admin/workspaces/:id/credits**
- Adjust workspace credits
- Body: `{ amount: number, reason: string, type: 'add' | 'subtract' }`
- Returns: Updated workspace with adjustment details

**GET /api/admin/workspaces/:id/usage**
- Get workspace usage statistics
- Returns: Generation stats, credit transactions, recent activity

### Subscription Management

**GET /api/admin/subscriptions**
- List all subscriptions with filters
- Query params: `page`, `limit`, `search`, `status`, `sortBy`, `sortOrder`
- Returns: Paginated subscription list with workspace and plan info

**GET /api/admin/subscriptions/:id**
- Get detailed subscription information
- Returns: Subscription details with workspace, plan, and invoices

**POST /api/admin/subscriptions/:id/cancel**
- Cancel a subscription
- Body: `{ immediate: boolean, reason? }`
- Returns: Updated subscription

**POST /api/admin/subscriptions/:id/reactivate**
- Reactivate a canceled subscription
- Returns: Updated subscription

### Plan Management

**GET /api/admin/plans**
- List all subscription plans
- Query params: `isActive`, `interval`
- Returns: Plans with subscription counts

**POST /api/admin/plans**
- Create a new subscription plan
- Body: `{ name, description?, price, currency?, interval, creditCount, features?, isActive?, stripePriceId? }`
- Returns: Created plan

**GET /api/admin/plans/:id**
- Get plan details
- Returns: Plan with subscriptions

**PATCH /api/admin/plans/:id**
- Update plan details
- Body: `{ name?, description?, price?, creditCount?, features?, isActive? }`
- Returns: Updated plan

**DELETE /api/admin/plans/:id**
- Delete a plan (only if no active subscriptions)
- Returns: Success confirmation

### Payment & Billing

**GET /api/admin/payments**
- List all payments/invoices
- Query params: `page`, `limit`, `status`, `workspaceId`, `startDate`, `endDate`
- Returns: Paginated invoice list with statistics

**POST /api/admin/refunds**
- Process a refund
- Body: `{ invoiceId, amount?, reason }`
- Returns: Refund details and updated invoice

**GET /api/admin/refunds**
- List all refunded invoices
- Query params: `page`, `limit`
- Returns: Paginated refund list

### System Settings

**GET /api/admin/settings**
- Get all system settings
- Query params: `category`
- Returns: Settings grouped by category

**POST /api/admin/settings**
- Create or update a system setting
- Body: `{ key, value, description?, category?, isPublic? }`
- Returns: Created/updated setting

**GET /api/admin/settings/:key**
- Get a specific setting
- Returns: Setting details

**DELETE /api/admin/settings/:key**
- Delete a setting
- Returns: Success confirmation

### Analytics & Reporting

**GET /api/admin/analytics**
- Get comprehensive analytics data
- Query params: `period` (days, default: 30)
- Returns: User stats, workspace stats, subscription stats, revenue, AI usage

**GET /api/admin/reports**
- Generate various reports
- Query params: `type`, `startDate`, `endDate`, `format`
- Returns: Report data or downloadable file

### Content Moderation

**GET /api/admin/moderation/queue**
- Get moderation queue
- Query params: `type`, `status`, `limit`, `offset`
- Returns: Generations for review

**POST /api/admin/moderation/flag**
- Flag inappropriate content
- Body: `{ generationId, reason, action: 'flag' | 'remove' | 'ban_user' }`
- Returns: Action confirmation

**GET /api/admin/moderation/stats**
- Get moderation statistics
- Query params: `days`
- Returns: Moderation stats and top flagged users

### Support Tools

**GET /api/admin/announcements**
- List all announcements
- Query params: `isActive`
- Returns: Announcements list

**POST /api/admin/announcements**
- Create a new announcement
- Body: `{ title, content, type, isActive?, startDate?, endDate? }`
- Returns: Created announcement

**GET /api/admin/announcements/:id**
- Get announcement details
- Returns: Announcement

**PATCH /api/admin/announcements/:id**
- Update announcement
- Body: `{ title?, content?, type?, isActive?, startDate?, endDate? }`
- Returns: Updated announcement

**DELETE /api/admin/announcements/:id**
- Delete announcement
- Returns: Success confirmation

**GET /api/admin/error-logs**
- Get error logs from failed generations
- Query params: `page`, `limit`, `type`, `userId`, `workspaceId`, `startDate`, `endDate`
- Returns: Error logs with statistics

**GET /api/admin/system-health**
- Get system health metrics
- Returns: Database status, cache status, API health

### Audit Logging

**GET /api/admin/audit-logs**
- Get audit logs
- Query params: `adminId`, `targetType`, `targetId`, `action`, `limit`, `offset`
- Returns: Paginated audit logs

**GET /api/admin/audit-logs/export**
- Export audit logs
- Query params: `adminId`, `targetType`, `targetId`, `action`, `startDate`, `endDate`, `format`
- Returns: CSV file or JSON data

### Impersonation

**GET /api/admin/impersonation**
- Get active impersonation sessions
- Returns: List of active impersonation sessions

**POST /api/admin/impersonation**
- Start impersonation (alternative endpoint)
- Body: `{ userId }`
- Returns: Impersonation session

## Error Responses

All routes follow consistent error response format:

```json
{
  "error": "Error message",
  "details": [] // Optional validation errors
}
```

Common status codes:
- `400` - Bad request (validation errors)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (not admin)
- `404` - Not found
- `500` - Internal server error

## Audit Logging

All admin actions are automatically logged via the `logAdminAction()` function, including:
- Admin user ID
- Action type
- Target resource type and ID
- Changes made
- IP address
- User agent
- Timestamp

## Rate Limiting

Admin routes have higher rate limits than regular user routes but are still subject to rate limiting to prevent abuse.

## Testing

Test files are co-located with route files:
- `route.test.ts` - Unit tests for the route
- Use `requireAdmin()` mock in tests
- Test both success and error cases
- Verify audit logging

## Security Considerations

1. All routes require admin role
2. Sensitive operations (delete, suspend) have additional checks
3. Admins cannot perform certain actions on themselves (delete, suspend)
4. All actions are logged for audit trail
5. Input validation using Zod schemas
6. SQL injection protection via Prisma
7. XSS protection via proper output encoding
