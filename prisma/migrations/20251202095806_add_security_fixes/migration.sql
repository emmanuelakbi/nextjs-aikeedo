-- Add unique constraint to CreditTransaction to prevent duplicate processing
-- This fixes Issue #1: Webhook Idempotency Failure
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_referenceId_referenceType_key" UNIQUE ("referenceId", "referenceType");

-- Add version field to Subscription for optimistic locking
-- This fixes Issue #17: Subscription Status Update Race Condition
ALTER TABLE "subscriptions" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0;

-- Add trial tracking to User to prevent trial bypass
-- This fixes Issue #5: Trial Bypass Vulnerability
ALTER TABLE "users" ADD COLUMN "hasUsedTrial" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "trialUsedAt" TIMESTAMP(3);

-- Add check constraints for credit integrity
-- This fixes Issue #18: Workspace Credit Balance Inconsistency
-- Note: PostgreSQL check constraints
ALTER TABLE "workspaces" ADD CONSTRAINT "check_allocated_credits" 
CHECK ("allocatedCredits" >= 0 AND "allocatedCredits" <= "creditCount");

ALTER TABLE "workspaces" ADD CONSTRAINT "check_credit_count" 
CHECK ("creditCount" >= 0);
