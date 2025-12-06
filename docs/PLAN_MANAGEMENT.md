# Plan Management

This document describes the plan management functionality for the billing module.

## Overview

The plan management system allows administrators to create, update, and manage subscription plans. Each plan defines pricing, features, limits, and credit allocations for workspaces.

## Features

- **Create Plans**: Define new subscription plans with pricing and features
- **Update Plans**: Modify existing plan details (applies to new subscriptions only)
- **Deprecate Plans**: Prevent new subscriptions while maintaining existing ones
- **Activate Plans**: Re-enable deprecated plans for new subscriptions
- **List Plans**: Retrieve all plans with optional filtering

## Domain Model

### Plan Entity

The `Plan` entity represents a subscription plan with the following properties:

- `id`: Unique identifier
- `name`: Plan name
- `description`: Plan description
- `price`: Price in cents
- `currency`: Currency code (default: 'usd')
- `interval`: Billing interval (MONTH or YEAR)
- `creditCount`: Number of credits (null for unlimited)
- `features`: JSON object of plan features
- `limits`: JSON object of plan limits
- `stripeProductId`: Stripe product identifier
- `stripePriceId`: Stripe price identifier
- `isActive`: Whether plan is available for new subscriptions
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

## API Endpoints

### List Plans

```
GET /api/billing/plans
```

Query parameters:

- `isActive` (boolean): Filter by active status
- `interval` (string): Filter by interval (MONTH or YEAR)
- `limit` (number): Maximum number of results
- `offset` (number): Pagination offset

Response:

```json
{
  "plans": [
    {
      "id": "uuid",
      "name": "Basic Plan",
      "description": "A basic subscription plan",
      "price": 999,
      "currency": "usd",
      "interval": "MONTH",
      "creditCount": 1000,
      "features": {},
      "limits": {},
      "stripeProductId": "prod_xxx",
      "stripePriceId": "price_xxx",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 1
}
```

### Get Plan

```
GET /api/billing/plans/:id
```

Response:

```json
{
  "plan": {
    "id": "uuid",
    "name": "Basic Plan",
    ...
  }
}
```

### Create Plan

```
POST /api/billing/plans
```

Request body:

```json
{
  "name": "Basic Plan",
  "description": "A basic subscription plan",
  "price": 999,
  "currency": "usd",
  "interval": "MONTH",
  "creditCount": 1000,
  "features": {
    "aiGeneration": true,
    "imageGeneration": false
  },
  "limits": {
    "maxUsers": 5,
    "maxGenerations": 100
  },
  "stripeProductId": "prod_xxx",
  "stripePriceId": "price_xxx"
}
```

Response: 201 Created with plan object

### Update Plan

```
PATCH /api/billing/plans/:id
```

Request body (all fields optional):

```json
{
  "name": "Updated Plan Name",
  "description": "Updated description",
  "price": 1499,
  "creditCount": 2000,
  "features": {},
  "limits": {}
}
```

Response: 200 OK with updated plan object

### Deprecate Plan

```
POST /api/billing/plans/:id/deprecate
```

Response: 200 OK with deprecated plan object

### Activate Plan

```
POST /api/billing/plans/:id/activate
```

Response: 200 OK with activated plan object

## Use Cases

### CreatePlanUseCase

Creates a new subscription plan. Validates input and ensures Stripe IDs are unique.

### UpdatePlanUseCase

Updates an existing plan. Changes only apply to new subscriptions.

### ListPlansUseCase

Retrieves a list of plans with optional filtering.

### GetPlanUseCase

Retrieves a single plan by ID.

### DeprecatePlanUseCase

Deprecates a plan, preventing new subscriptions while maintaining existing ones.

### ActivatePlanUseCase

Activates a deprecated plan, allowing new subscriptions.

## Repository

The `PlanRepository` handles all database operations for plans:

- `create(data)`: Creates a new plan
- `findById(id)`: Finds a plan by ID
- `findByStripeProductId(id)`: Finds a plan by Stripe product ID
- `findByStripePriceId(id)`: Finds a plan by Stripe price ID
- `list(options)`: Lists plans with optional filters
- `findActivePlans()`: Finds all active plans
- `findActivePlansByInterval(interval)`: Finds active plans by interval
- `update(id, data)`: Updates a plan
- `deprecate(id)`: Deprecates a plan
- `activate(id)`: Activates a plan
- `delete(id)`: Deletes a plan (only if no subscriptions exist)
- `save(plan)`: Saves a plan entity (create or update)

## Requirements Mapping

This implementation satisfies the following requirements:

- **Billing 1.1**: Support multiple pricing tiers
- **Billing 1.2**: Specify credits, features, and price
- **Billing 1.3**: Apply changes to new subscriptions only
- **Billing 1.4**: Prevent new subscriptions but maintain existing ones
- **Billing 1.5**: Show features, limits, and pricing clearly

## Testing

Unit tests are provided for:

- Plan entity creation and validation
- Plan entity updates
- Plan deprecation and activation
- Repository operations

Run tests with:

```bash
npm test -- src/domain/billing/entities/Plan.test.ts
npm test -- src/infrastructure/repositories/PlanRepository.test.ts
```

## Next Steps

The following features will be implemented in subsequent tasks:

- Subscription creation and management
- Stripe checkout flow integration
- Webhook handling for payment events
- Credit allocation and tracking
