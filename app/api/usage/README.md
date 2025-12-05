# Usage Tracking API

This directory contains API endpoints for tracking and analyzing AI service usage.

## Endpoints

### GET /api/usage

Get comprehensive usage statistics for the current workspace.

**Query Parameters:**

- `period` (optional): 'day' | 'week' | 'month' | 'year' - Get summary for a specific period
- `startDate` (optional): ISO date string - Start date for detailed statistics
- `endDate` (optional): ISO date string - End date for detailed statistics

**Response (with period):**

```json
{
  "period": "month",
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-01-31T23:59:59.999Z",
  "totalGenerations": 150,
  "totalCredits": 5000,
  "totalTokens": 250000,
  "averageCreditsPerGeneration": 33.33
}
```

**Response (detailed statistics):**

```json
{
  "totalGenerations": 150,
  "totalCredits": 5000,
  "totalTokens": 250000,
  "byType": [
    {
      "type": "TEXT",
      "count": 100,
      "credits": 3000,
      "tokens": 150000
    }
  ],
  "byModel": [
    {
      "model": "gpt-4",
      "count": 50,
      "credits": 2000,
      "tokens": 100000
    }
  ],
  "byProvider": [
    {
      "provider": "openai",
      "count": 120,
      "credits": 4000,
      "tokens": 200000
    }
  ],
  "dailyUsage": [
    {
      "date": "2024-01-01",
      "count": 10,
      "credits": 300,
      "tokens": 15000
    }
  ]
}
```

### GET /api/usage/activity

Get recent usage activity for the current workspace.

**Query Parameters:**

- `limit` (optional): number - Maximum number of records to return (default: 10, max: 100)

**Response:**

```json
[
  {
    "id": "gen_123",
    "type": "TEXT",
    "model": "gpt-4",
    "provider": "openai",
    "credits": 50,
    "tokens": 2500,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "status": "COMPLETED"
  }
]
```

### GET /api/usage/trend

Get credit usage trend over time for the current workspace.

**Query Parameters:**

- `days` (optional): number - Number of days to include in trend (default: 30, max: 365)

**Response:**

```json
[
  {
    "date": "2024-01-01",
    "credits": 300,
    "generations": 10
  },
  {
    "date": "2024-01-02",
    "credits": 450,
    "generations": 15
  }
]
```

## Requirements

All endpoints require authentication and will use the current workspace from the user's session.

## Implementation

The usage tracking system:

- Automatically logs usage when Generation records are created
- Provides aggregation and analytics through the UsageLoggingService
- Supports filtering by date range and period
- Tracks usage by type, model, and provider
- Maintains daily usage trends for visualization

## Related Files

- `src/infrastructure/services/UsageLoggingService.ts` - Core service for usage tracking
- `src/app/(dashboard)/usage/page.tsx` - Usage dashboard UI
- `prisma/schema.prisma` - Generation model for usage data

## Requirements Coverage

- **Requirement 7.1**: Credit calculation and deduction tracking
- **Requirement 7.2**: Usage statistics and analytics display
