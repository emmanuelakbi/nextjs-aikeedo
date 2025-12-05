# Affiliate Reports

Comprehensive reporting system for affiliates to track and analyze their performance.

## Features

### 1. Report Types

#### Summary Report
- **Component**: `SummaryReport`
- Total referrals count
- Converted referrals
- Conversion rate percentage
- Total commission earned
- Total payouts received
- Pending earnings
- Visual metric cards with icons

#### Earnings Report
- **Component**: `EarningsReport`
- Monthly earnings breakdown
- Bar chart visualization
- Total earnings for period
- Month-by-month comparison
- Gradient progress bars

#### Conversions Report
- **Component**: `ConversionsReport`
- Overall conversion rate
- Status breakdown (converted, pending, canceled)
- Percentage distribution
- Weekly conversion trends
- Visual charts and graphs

#### Detailed Report
- **Component**: `DetailedReport`
- Complete referral list
- User information
- Status tracking
- Commission amounts
- Conversion values
- Filterable by status
- Sortable table view

### 2. Report Filters

- **Component**: `ReportFilters`
- Report type selection (4 types)
- Time period selection:
  - Last 7 Days
  - Last 30 Days
  - Last 90 Days
  - Last Year
  - All Time
- Visual button interface
- Dropdown period selector

### 3. Export Functionality

- **Component**: `ExportButton`
- Export to CSV format
- Automatic filename generation
- Date-stamped exports
- Format-specific CSV generation:
  - Summary: Key metrics
  - Earnings: Monthly breakdown
  - Conversions: Status and weekly data
  - Detailed: Complete referral list
- One-click download

## User Interface

### Layout
- Clean, modern design
- Responsive grid layouts
- Color-coded metrics
- Visual charts and graphs
- Loading states
- Empty states

### Color Coding
- **Blue**: General metrics, conversions
- **Green**: Earnings, converted status
- **Yellow**: Pending status
- **Red**: Canceled status
- **Purple**: Commission metrics

### Interactive Elements
- Report type buttons
- Period dropdown
- Filter tabs (detailed report)
- Export button
- Hover effects
- Smooth transitions

## API Integration

The reports system integrates with:
- `GET /api/affiliate/reports?type={type}&period={period}`

### Query Parameters
- `type`: summary, earnings, conversions, detailed
- `period`: 7d, 30d, 90d, 1y, all

### Response Format
```json
{
  "success": true,
  "data": {
    "period": "30d",
    "type": "summary",
    "startDate": "2024-01-01",
    "endDate": "2024-01-31",
    // ... report-specific data
  }
}
```

## Requirements Coverage

### Requirement 3: Payout Processing ✓
- ✓ Generate payout reports
- ✓ Track payout history

### Requirement 4: Affiliate Dashboard ✓
- ✓ Show referral statistics
- ✓ Display earnings
- ✓ Track conversion rates

## Features Implemented

✓ **Multiple Report Types**
- Summary overview
- Earnings breakdown
- Conversion analysis
- Detailed referral list

✓ **Flexible Time Periods**
- 7 days to all-time
- Dynamic date ranges
- Period display

✓ **Data Visualization**
- Bar charts
- Progress bars
- Metric cards
- Status indicators

✓ **Export Capability**
- CSV format
- All report types
- Formatted data
- Automatic download

✓ **User Experience**
- Loading states
- Empty states
- Error handling
- Responsive design
- Smooth transitions

## Usage

### Viewing Reports

1. Navigate to `/affiliate/reports`
2. Select report type (Summary, Earnings, Conversions, Detailed)
3. Choose time period
4. View generated report

### Exporting Reports

1. Generate desired report
2. Click "Export CSV" button
3. File downloads automatically
4. Open in spreadsheet application

## Data Insights

### Summary Report
- Quick overview of performance
- Key metrics at a glance
- Period comparison

### Earnings Report
- Revenue trends
- Monthly patterns
- Growth tracking

### Conversions Report
- Success rates
- Status distribution
- Weekly trends

### Detailed Report
- Individual referrals
- User information
- Transaction details
- Filterable data

## Future Enhancements

- PDF export
- Email scheduled reports
- Custom date ranges
- Advanced filtering
- Comparison views
- Trend analysis
- Predictive analytics
- Chart customization
- Report templates
- Automated insights
