# Affiliate Use Case Tests

Comprehensive test suite for affiliate use cases covering all core functionality.

## Test Files

### create-affiliate.test.ts

Tests for creating affiliate accounts.

**Coverage:**

- ✓ Create affiliate with valid data
- ✓ Prevent duplicate affiliate accounts per user
- ✓ Prevent duplicate referral codes
- ✓ Auto-generate codes when not provided
- ✓ Use default commission rate

**Requirements:** Affiliate 1 - Generate unique referral codes

### track-referral.test.ts

Tests for tracking referral signups.

**Coverage:**

- ✓ Track new referrals
- ✓ Validate affiliate codes
- ✓ Check affiliate status
- ✓ Prevent duplicate referrals
- ✓ Prevent self-referrals

**Requirements:** Affiliate 1 - Track referral signups

### process-commission.test.ts

Tests for commission calculation and processing.

**Coverage:**

- ✓ Process commission for valid referrals
- ✓ Calculate commission based on rate
- ✓ Handle different transaction types
- ✓ Skip already converted referrals
- ✓ Update affiliate earnings

**Requirements:** Affiliate 2 - Calculate commissions on payment events

### request-payout.test.ts

Tests for payout request functionality.

**Coverage:**

- ✓ Create payout requests
- ✓ Validate affiliate status
- ✓ Check sufficient balance
- ✓ Enforce minimum payout amount ($50)
- ✓ Support multiple payout methods
- ✓ Update pending earnings

**Requirements:** Affiliate 3 - Request payouts

## Running Tests

```bash
# Run all affiliate use case tests
npm test src/application/use-cases/affiliate/__tests__/

# Run specific test file
npm test src/application/use-cases/affiliate/__tests__/create-affiliate.test.ts

# Run with coverage
npm test -- --coverage src/application/use-cases/affiliate/
```

## Test Patterns

### Unit Tests

- Mock repositories
- Test business logic in isolation
- Verify error handling
- Check edge cases

### Assertions

- Use descriptive test names
- Test both success and failure paths
- Verify repository method calls
- Check return values and side effects

## Mocking Strategy

All tests use mocked repositories to isolate business logic:

```typescript
vi.mock('@/infrastructure/affiliate/prisma-affiliate-repository');
```

This allows testing without database dependencies.
