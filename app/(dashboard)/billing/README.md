# Billing Dashboard UI

## Overview

The Billing Dashboard provides a comprehensive view of billing information, subscription status, usage metrics, and payment history for workspace owners and administrators.

## Requirements Coverage

This implementation satisfies the following requirements from the billing module specification:

### Requirement 12.1: Current Plan and Usage Display
- **CurrentPlanCard**: Displays current subscription plan details including name, price, status, and renewal information
- **UsageCard**: Shows current credit balance and usage statistics

### Requirement 12.2: Current Period Charges
- **CurrentPeriodCard**: Displays estimated charges for the current billing period
- Shows period start/end dates and credits used

### Requirement 12.3: Past 12 Months History
- **BillingHistoryChart**: Visual bar chart showing monthly spending over the past 12 months
- **InvoicesList**: Table of recent invoices with status, amount, and download links
- Summary statistics including total spent and average monthly spending

### Requirement 12.4: Usage Breakdown by Service Type
- **UsageBreakdownChart**: Visual breakdown of credit usage by service type (text generation, image generation, speech synthesis, etc.)
- Shows both absolute numbers and percentages
- Color-coded bars for easy identification

### Requirement 12.5: Remaining Quota Indicator
- **UsageCard**: Progress bar showing usage percentage
- Color-coded warnings (red > 90%, yellow > 70%, blue otherwise)
- Displays remaining credits with visual emphasis when running low

## Components

### Main Components

#### `BillingDashboard.tsx`
Main dashboard component that fetches data from the API and orchestrates all sub-components.

**Props:**
- `workspaceId: string` - The workspace ID to fetch billing data for

**Data Source:**
- Fetches from `/api/billing/dashboard?workspaceId={workspaceId}`

#### `page.tsx`
Next.js page component that handles authentication and routing.

**Features:**
- Authentication check
- Workspace validation
- Success/cancel message display for credit purchases
- Loading skeleton

### Sub-Components

#### `CurrentPlanCard.tsx`
Displays current subscription plan information.

**Features:**
- Plan name and description
- Price and billing interval
- Credit allocation
- Subscription status badge
- Cancellation notice (if applicable)
- Days until next billing

#### `UsageCard.tsx`
Shows credit balance and usage metrics.

**Features:**
- Current credit balance (large, prominent display)
- Usage progress bar (if plan has limits)
- Remaining credits indicator
- Color-coded warnings for low balance
- Unlimited plan support

#### `CurrentPeriodCard.tsx`
Displays current billing period information.

**Features:**
- Estimated charges for current period
- Period start and end dates
- Credits used in current period

#### `UsageBreakdownChart.tsx`
Visual breakdown of usage by service type.

**Features:**
- Horizontal bar chart
- Color-coded service types
- Percentage and absolute values
- Total usage summary
- Legend for service types

#### `BillingHistoryChart.tsx`
Visual representation of billing history.

**Features:**
- Bar chart for last 12 months
- Hover tooltips showing exact amounts
- Summary statistics (total, average, last month)
- Responsive design

#### `InvoicesList.tsx`
Table of recent invoices.

**Features:**
- Invoice date, status, and amount
- Status badges with color coding
- Links to view/download invoices
- Responsive table design

## API Integration

The dashboard fetches data from the `/api/billing/dashboard` endpoint, which returns:

```typescript
{
  currentPlan: Plan | null,
  subscription: Subscription | null,
  currentPeriod: {
    charges: number,
    usage: number,
    start: string | null,
    end: string | null
  },
  billingHistory: {
    invoices: Invoice[],
    monthlySpending: Record<string, number>,
    totalSpent: number
  },
  usage: {
    current: number,
    byServiceType: Array<{
      serviceType: string,
      usage: number,
      percentage: number
    }>
  },
  credits: {
    current: number,
    limit: number | null,
    used: number,
    remaining: number | null,
    percentageUsed: number | null
  },
  paymentMethods: PaymentMethod[]
}
```

## Styling

All components use Tailwind CSS for styling with a consistent design system:

- **Colors**: Blue for primary actions, green for success, yellow for warnings, red for errors
- **Spacing**: Consistent padding and margins using Tailwind's spacing scale
- **Typography**: Clear hierarchy with appropriate font sizes and weights
- **Shadows**: Subtle shadows for card elevation
- **Responsive**: Mobile-first design with responsive grid layouts

## User Experience

### Visual Hierarchy
1. **Top Row**: Three key metrics cards (Plan, Usage, Current Period)
2. **Middle Section**: Visual charts for usage breakdown and billing history
3. **Bottom Section**: Credit purchase form, invoices list, and payment methods

### Color Coding
- **Green**: Healthy status, positive actions
- **Yellow**: Warnings, approaching limits
- **Red**: Critical status, exceeded limits
- **Blue**: Primary information, neutral status
- **Gray**: Inactive or secondary information

### Responsive Design
- **Desktop**: 3-column grid for metric cards, full-width charts
- **Tablet**: 2-column grid, adjusted chart sizes
- **Mobile**: Single column layout, stacked components

## Error Handling

- API errors display user-friendly error messages
- Loading states with skeleton screens
- Graceful degradation when data is missing
- Empty states for no invoices/transactions

## Future Enhancements

Potential improvements for future iterations:

1. **Export Functionality**: Download billing history as CSV/PDF
2. **Filtering**: Filter invoices by date range or status
3. **Notifications**: Email alerts for low credit balance
4. **Forecasting**: Predict future usage based on historical data
5. **Comparison**: Compare usage across different time periods
6. **Drill-down**: Click on service types to see detailed usage
7. **Budget Alerts**: Set spending limits and receive alerts

## Testing

To test the billing dashboard:

1. Ensure you have an active subscription
2. Generate some usage (create documents, images, etc.)
3. Navigate to `/billing` in the dashboard
4. Verify all components render correctly
5. Check that data updates in real-time

## Accessibility

- Semantic HTML structure
- Proper heading hierarchy
- Color contrast meets WCAG AA standards
- Keyboard navigation support
- Screen reader friendly labels
