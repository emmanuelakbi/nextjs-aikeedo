# Affiliate Dashboard

Comprehensive affiliate dashboard for managing referrals, tracking earnings, and accessing marketing materials.

## Features

### 1. Affiliate Account Creation

- **Component**: `CreateAffiliateCard`
- Users can create an affiliate account with a custom referral code
- Default commission rate: 20%
- Default tier: 1
- Validates code length (4-20 characters)

### 2. Referral Code Display

- **Component**: `ReferralCodeCard`
- Displays referral code and full referral URL
- One-click copy functionality
- Shows commission rate and tier
- Status indicator (active/suspended)

### 3. Statistics Overview

- **Component**: `StatsCards`
- Total referrals count
- Conversion rate percentage
- Total earnings (all time)
- Pending earnings (available for payout)
- Visual cards with icons and color coding

### 4. Earnings Visualization

- **Component**: `EarningsChart`
- Bar chart showing earnings by month
- 90-day earnings history
- Total earnings summary
- Responsive design

### 5. Referrals List

- **Component**: `ReferralsList`
- Recent referrals table
- Status indicators (pending, converted, canceled)
- Commission and conversion value
- Date tracking
- Link to view all referrals

### 6. Payout Management

- **Component**: `PayoutHistory`
- Request payout functionality
- Minimum payout: $50.00
- Payout statistics (requested, paid, pending)
- Payout history table with status
- Support for PayPal and Stripe

### 7. Marketing Materials

- **Component**: `MarketingMaterials`
- Text snippets for sharing
- Email templates
- Tracking links for different sources
- Banner images (placeholder)
- Social media assets
- One-click copy functionality

## Routes

- `/affiliate` - Main affiliate dashboard
- `/affiliate/referrals` - Full referrals list (to be implemented)

## API Integration

The dashboard integrates with the following API endpoints:

- `GET /api/affiliate` - Get affiliate account
- `POST /api/affiliate/create` - Create affiliate account
- `GET /api/affiliate/stats` - Get statistics
- `GET /api/affiliate/referrals` - Get referrals list
- `GET /api/affiliate/reports` - Get earnings reports
- `GET /api/affiliate/payout/list` - Get payout history
- `POST /api/affiliate/payout/request` - Request payout
- `GET /api/affiliate/materials` - Get marketing materials

## Requirements Coverage

### Requirement 1: Referral Tracking ✓

- Generate unique referral codes
- Display referral code and URL
- Track referral signups and conversions

### Requirement 2: Commission Management ✓

- Display commission rates
- Show earnings breakdown
- Track lifetime value

### Requirement 3: Payout Processing ✓

- Request payouts
- View payout history
- Track payout status

### Requirement 4: Affiliate Dashboard ✓

- Show referral statistics
- Display earnings
- Track conversion rates
- View payout history
- Access marketing materials

## Styling

The dashboard uses:

- Tailwind CSS for styling
- Responsive grid layouts
- Color-coded status indicators
- Gradient backgrounds for emphasis
- Consistent spacing and typography

## User Experience

- Loading states with spinners
- Empty states with helpful messages
- Error handling with user-friendly messages
- Copy-to-clipboard feedback
- Responsive design for mobile and desktop

## Future Enhancements

- Advanced analytics and charts
- Downloadable reports
- Custom marketing material generator
- Real-time notifications
- Leaderboard integration
- Performance insights
