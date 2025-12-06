# Admin Reporting System

## Overview

The Admin Reporting System provides comprehensive reporting and data export capabilities for system administrators. It fulfills **Requirement 5: Analytics and Reporting** from the Admin Dashboard specification.

## Features

### Report Types

1. **Revenue Report**
   - Total revenue breakdown (invoices + subscriptions)
   - Invoice details with workspace and owner information
   - Subscription revenue by plan
   - Credit purchase transactions
   - Summary metrics: total revenue, invoice count, subscription count

2. **User Growth Report**
   - New user registrations within date range
   - User status breakdown (active, suspended, inactive)
   - Daily growth metrics
   - User activity statistics (workspaces owned, generations created)
   - Last seen timestamps

3. **AI Usage Report**
   - Total generations by type (text, image, speech, transcription)
   - Usage by AI provider (OpenAI, Anthropic, Google, Mistral)
   - Credit and token consumption
   - Generation status breakdown (completed, failed, pending)
   - Detailed generation logs with workspace and user information

4. **Financial Report**
   - Comprehensive financial overview
   - Revenue vs. refunds analysis
   - Net revenue calculation
   - Credit transaction breakdown by type
   - Refund details with workspace information

5. **Subscription Report**
   - New subscriptions within date range
   - Churned subscriptions (canceled)
   - Churn rate calculation
   - Status breakdown (active, trialing, canceled, etc.)
   - Plan distribution analysis
   - Subscription lifecycle details

### Export Capabilities

- **JSON Format**: Structured data for programmatic analysis
- **CSV Export**: Spreadsheet-compatible format for Excel/Google Sheets
- Automatic filename generation with report type and date range
- Summary section with key metrics
- Detailed data tables for in-depth analysis

## API Endpoints

### GET /api/admin/reports

Generate and export reports with flexible parameters.

**Query Parameters:**

- `type` (required): Report type (`revenue`, `user-growth`, `ai-usage`, `financial`, `subscription`)
- `startDate` (required): Start date in ISO format (YYYY-MM-DD)
- `endDate` (required): End date in ISO format (YYYY-MM-DD)
- `format` (optional): Output format (`json` or `csv`, default: `json`)

**Example Requests:**

```bash
# Generate revenue report as JSON
GET /api/admin/reports?type=revenue&startDate=2024-01-01&endDate=2024-01-31

# Export user growth report as CSV
GET /api/admin/reports?type=user-growth&startDate=2024-01-01&endDate=2024-01-31&format=csv
```

**Response Structure (JSON):**

```json
{
  "summary": {
    "totalRevenue": 150000,
    "invoiceRevenue": 100000,
    "subscriptionRevenue": 50000,
    "invoiceCount": 25,
    "subscriptionCount": 10
  },
  "invoices": [...],
  "subscriptions": [...],
  "creditTransactions": [...]
}
```

## UI Components

### Reports Page (`/admin/reports`)

Interactive interface for generating and exporting reports:

1. **Report Configuration**
   - Report type selector
   - Date range picker (start and end dates)
   - Generate button
   - Export CSV button

2. **Report Display**
   - Summary cards with key metrics
   - Detailed data tables
   - Automatic formatting (currency, dates, numbers)
   - Pagination for large datasets (first 50 records shown)

3. **User Experience**
   - Loading states during report generation
   - Error handling with clear messages
   - Empty state when no report is generated
   - Responsive design for mobile and desktop

## Data Sources

Reports aggregate data from multiple database tables:

- **Users**: User accounts, roles, status
- **Workspaces**: Workspace ownership and credits
- **Subscriptions**: Active subscriptions and plans
- **Invoices**: Payment history and status
- **Generations**: AI service usage and credits
- **CreditTransactions**: Credit purchases, allocations, and usage

## Security

- **Admin-only access**: All endpoints require admin role
- **Audit logging**: Report generation is logged via admin actions
- **Data privacy**: Sensitive information is appropriately filtered
- **Rate limiting**: Standard API rate limits apply

## Usage Examples

### Generate Monthly Revenue Report

1. Navigate to `/admin/reports`
2. Select "Revenue Report" from dropdown
3. Set start date: `2024-01-01`
4. Set end date: `2024-01-31`
5. Click "Generate"
6. Review summary and detailed data
7. Click "Export CSV" to download

### Analyze User Growth

1. Select "User Growth Report"
2. Choose date range (e.g., last quarter)
3. Generate report
4. Review new user metrics
5. Export for further analysis in spreadsheet

### Monitor AI Usage

1. Select "AI Usage Report"
2. Set date range
3. Generate report
4. Review usage by type and provider
5. Analyze credit consumption patterns

## Performance Considerations

- Reports are generated on-demand (not cached)
- Large date ranges may take longer to process
- CSV exports are streamed for memory efficiency
- Database queries are optimized with indexes
- Consider running reports during off-peak hours for large datasets

## Future Enhancements

Potential improvements for future iterations:

- Scheduled report generation
- Email delivery of reports
- Custom report builder
- Data visualization (charts and graphs)
- Report templates
- Comparison reports (period over period)
- Real-time streaming reports
- Report caching for frequently accessed data

## Testing

The reporting system includes comprehensive unit tests:

```bash
npm test src/app/api/admin/reports/route.test.ts
```

Tests cover:

- Report generation for all types
- CSV export functionality
- Error handling (missing dates, invalid types)
- Data aggregation and formatting
- Summary calculations

## Related Documentation

- [Admin Dashboard Requirements](/.kiro/specs/nextjs-admin-dashboard/requirements.md)
- [Admin Dashboard Design](/.kiro/specs/nextjs-admin-dashboard/design.md)
- [Analytics Dashboard](</src/app/(dashboard)/admin/AnalyticsDashboard.tsx>)
- [API Documentation](/docs/API.md)
