import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { trialService, TrialServiceError } from '../TrialService';
import { prisma } from '../../../lib/db';
import { SubscriptionStatus } from '@prisma/client';

/**
 * Unit Tests for TrialService
 *
 * Tests trial period management and eligibility checks
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

describe('TrialService', () => {
  let testWorkspaceIds: string[] = [];
  let testUserIds: string[] = [];
  let testSubscriptionIds: string[] = [];
  let testPlanIds: string[] = [];

  // Helper to create a test user
  async function createTestUser() {
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}-${Math.random()}@example.com`,
        passwordHash: '$2a$10$dummyhashfortest',
        firstName: 'Test',
        lastName: 'User',
        emailVerified: new Date(),
      },
    });
    testUserIds.push(user.id);
    return user;
  }

  // Helper to create a test workspace
  async function createTestWorkspace(
    ownerId: string,
    isTrialed: boolean = false
  ) {
    const workspace = await prisma.workspace.create({
      data: {
        name: `Test Workspace ${Date.now()}`,
        ownerId,
        creditCount: 0,
        allocatedCredits: 0,
        isTrialed,
      },
    });
    testWorkspaceIds.push(workspace.id);
    return workspace;
  }

  // Helper to create a test plan
  async function createTestPlan() {
    const plan = await prisma.plan.create({
      data: {
        name: `Test Plan ${Date.now()}`,
        description: 'Test plan',
        price: 999,
        currency: 'usd',
        interval: 'MONTH',
        creditCount: 1000,
        features: {},
        limits: {},
        stripeProductId: `prod_test_${Date.now()}_${Math.random()}`,
        stripePriceId: `price_test_${Date.now()}_${Math.random()}`,
        isActive: true,
      },
    });
    testPlanIds.push(plan.id);
    return plan;
  }

  afterEach(async () => {
    // Clean up in reverse order of dependencies
    if (testSubscriptionIds.length > 0) {
      await prisma.subscription.deleteMany({
        where: { id: { in: testSubscriptionIds } },
      });
      testSubscriptionIds = [];
    }

    if (testWorkspaceIds.length > 0) {
      await prisma.workspace.deleteMany({
        where: { id: { in: testWorkspaceIds } },
      });
      testWorkspaceIds = [];
    }

    if (testPlanIds.length > 0) {
      await prisma.plan.deleteMany({
        where: { id: { in: testPlanIds } },
      });
      testPlanIds = [];
    }

    if (testUserIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: testUserIds } },
      });
      testUserIds = [];
    }
  });

  describe('checkTrialEligibility', () => {
    it('should return eligible for new workspace', async () => {
      const user = await createTestUser();
      const workspace = await createTestWorkspace(user.id, false);

      const result = await trialService.checkTrialEligibility(workspace.id);

      expect(result.isEligible).toBe(true);
      expect(result.hasUsedTrial).toBe(false);
      expect(result.reason).toBeUndefined();
    });

    it('should return not eligible for workspace that used trial', async () => {
      const user = await createTestUser();
      const workspace = await createTestWorkspace(user.id, true);

      const result = await trialService.checkTrialEligibility(workspace.id);

      expect(result.isEligible).toBe(false);
      expect(result.hasUsedTrial).toBe(true);
      expect(result.reason).toContain('already used trial');
    });

    it('should return not eligible for workspace with active subscription', async () => {
      const user = await createTestUser();
      const workspace = await createTestWorkspace(user.id, false);
      const plan = await createTestPlan();

      // Create active subscription
      const subscription = await prisma.subscription.create({
        data: {
          workspaceId: workspace.id,
          planId: plan.id,
          stripeSubscriptionId: `sub_test_${Date.now()}_${Math.random()}`,
          stripeCustomerId: `cus_test_${Date.now()}_${Math.random()}`,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          cancelAtPeriodEnd: false,
        },
      });
      testSubscriptionIds.push(subscription.id);

      const result = await trialService.checkTrialEligibility(workspace.id);

      expect(result.isEligible).toBe(false);
      expect(result.reason).toContain('already has an active subscription');
    });

    it('should return not eligible for workspace with trialing subscription', async () => {
      const user = await createTestUser();
      const workspace = await createTestWorkspace(user.id, false);
      const plan = await createTestPlan();

      // Create trialing subscription
      const subscription = await prisma.subscription.create({
        data: {
          workspaceId: workspace.id,
          planId: plan.id,
          stripeSubscriptionId: `sub_test_${Date.now()}_${Math.random()}`,
          stripeCustomerId: `cus_test_${Date.now()}_${Math.random()}`,
          status: SubscriptionStatus.TRIALING,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          cancelAtPeriodEnd: false,
          trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      });
      testSubscriptionIds.push(subscription.id);

      const result = await trialService.checkTrialEligibility(workspace.id);

      expect(result.isEligible).toBe(false);
      expect(result.reason).toContain('already has an active subscription');
    });

    it('should return eligible for workspace with canceled subscription', async () => {
      const user = await createTestUser();
      const workspace = await createTestWorkspace(user.id, false);
      const plan = await createTestPlan();

      // Create canceled subscription
      const subscription = await prisma.subscription.create({
        data: {
          workspaceId: workspace.id,
          planId: plan.id,
          stripeSubscriptionId: `sub_test_${Date.now()}_${Math.random()}`,
          stripeCustomerId: `cus_test_${Date.now()}_${Math.random()}`,
          status: SubscriptionStatus.CANCELED,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          cancelAtPeriodEnd: false,
        },
      });
      testSubscriptionIds.push(subscription.id);

      const result = await trialService.checkTrialEligibility(workspace.id);

      expect(result.isEligible).toBe(true);
      expect(result.hasUsedTrial).toBe(false);
    });

    it('should throw error for non-existent workspace', async () => {
      await expect(
        trialService.checkTrialEligibility('non-existent-id')
      ).rejects.toThrow(TrialServiceError);
    });
  });

  describe('getTrialStatus', () => {
    it('should return inactive status for workspace without subscription', async () => {
      const user = await createTestUser();
      const workspace = await createTestWorkspace(user.id);

      const result = await trialService.getTrialStatus(workspace.id);

      expect(result.isActive).toBe(false);
      expect(result.daysRemaining).toBeNull();
      expect(result.trialEnd).toBeNull();
    });

    it('should return inactive status for workspace with active subscription', async () => {
      const user = await createTestUser();
      const workspace = await createTestWorkspace(user.id);
      const plan = await createTestPlan();

      const subscription = await prisma.subscription.create({
        data: {
          workspaceId: workspace.id,
          planId: plan.id,
          stripeSubscriptionId: `sub_test_${Date.now()}_${Math.random()}`,
          stripeCustomerId: `cus_test_${Date.now()}_${Math.random()}`,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          cancelAtPeriodEnd: false,
        },
      });
      testSubscriptionIds.push(subscription.id);

      const result = await trialService.getTrialStatus(workspace.id);

      expect(result.isActive).toBe(false);
      expect(result.daysRemaining).toBeNull();
      expect(result.trialEnd).toBeNull();
    });

    it('should return active status for workspace with trialing subscription', async () => {
      const user = await createTestUser();
      const workspace = await createTestWorkspace(user.id);
      const plan = await createTestPlan();

      const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

      const subscription = await prisma.subscription.create({
        data: {
          workspaceId: workspace.id,
          planId: plan.id,
          stripeSubscriptionId: `sub_test_${Date.now()}_${Math.random()}`,
          stripeCustomerId: `cus_test_${Date.now()}_${Math.random()}`,
          status: SubscriptionStatus.TRIALING,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          cancelAtPeriodEnd: false,
          trialEnd,
        },
      });
      testSubscriptionIds.push(subscription.id);

      const result = await trialService.getTrialStatus(workspace.id);

      expect(result.isActive).toBe(true);
      expect(result.daysRemaining).toBeGreaterThan(0);
      expect(result.daysRemaining).toBeLessThanOrEqual(14);
      expect(result.trialEnd).toEqual(trialEnd);
    });

    it('should return 0 days remaining for expired trial', async () => {
      const user = await createTestUser();
      const workspace = await createTestWorkspace(user.id);
      const plan = await createTestPlan();

      // Trial ended 1 day ago
      const trialEnd = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);

      const subscription = await prisma.subscription.create({
        data: {
          workspaceId: workspace.id,
          planId: plan.id,
          stripeSubscriptionId: `sub_test_${Date.now()}_${Math.random()}`,
          stripeCustomerId: `cus_test_${Date.now()}_${Math.random()}`,
          status: SubscriptionStatus.TRIALING,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          cancelAtPeriodEnd: false,
          trialEnd,
        },
      });
      testSubscriptionIds.push(subscription.id);

      const result = await trialService.getTrialStatus(workspace.id);

      expect(result.isActive).toBe(true);
      expect(result.daysRemaining).toBe(0);
      expect(result.trialEnd).toEqual(trialEnd);
    });

    it('should calculate correct days remaining', async () => {
      const user = await createTestUser();
      const workspace = await createTestWorkspace(user.id);
      const plan = await createTestPlan();

      // Trial ends in exactly 7 days
      const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const subscription = await prisma.subscription.create({
        data: {
          workspaceId: workspace.id,
          planId: plan.id,
          stripeSubscriptionId: `sub_test_${Date.now()}_${Math.random()}`,
          stripeCustomerId: `cus_test_${Date.now()}_${Math.random()}`,
          status: SubscriptionStatus.TRIALING,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          cancelAtPeriodEnd: false,
          trialEnd,
        },
      });
      testSubscriptionIds.push(subscription.id);

      const result = await trialService.getTrialStatus(workspace.id);

      expect(result.isActive).toBe(true);
      expect(result.daysRemaining).toBeGreaterThanOrEqual(6);
      expect(result.daysRemaining).toBeLessThanOrEqual(8);
    });
  });

  describe('markTrialAsUsed', () => {
    it('should mark workspace as trialed', async () => {
      const user = await createTestUser();
      const workspace = await createTestWorkspace(user.id, false);

      await trialService.markTrialAsUsed(workspace.id);

      const updatedWorkspace = await prisma.workspace.findUnique({
        where: { id: workspace.id },
      });

      expect(updatedWorkspace?.isTrialed).toBe(true);
    });

    it('should be idempotent', async () => {
      const user = await createTestUser();
      const workspace = await createTestWorkspace(user.id, false);

      // Mark as trialed twice
      await trialService.markTrialAsUsed(workspace.id);
      await trialService.markTrialAsUsed(workspace.id);

      const updatedWorkspace = await prisma.workspace.findUnique({
        where: { id: workspace.id },
      });

      expect(updatedWorkspace?.isTrialed).toBe(true);
    });

    it('should throw error for non-existent workspace', async () => {
      await expect(
        trialService.markTrialAsUsed('non-existent-id')
      ).rejects.toThrow(TrialServiceError);
    });
  });

  describe('calculateDaysRemaining', () => {
    it('should calculate positive days remaining', () => {
      const trialEnd = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
      const result = trialService.calculateDaysRemaining(trialEnd);

      expect(result).toBeGreaterThanOrEqual(9);
      expect(result).toBeLessThanOrEqual(11);
    });

    it('should return 0 for expired trial', () => {
      const trialEnd = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      const result = trialService.calculateDaysRemaining(trialEnd);

      expect(result).toBe(0);
    });

    it('should return 0 for trial ending today', () => {
      const trialEnd = new Date(Date.now() - 1000); // 1 second ago
      const result = trialService.calculateDaysRemaining(trialEnd);

      expect(result).toBe(0);
    });

    it('should round up partial days', () => {
      // Trial ends in 1.5 days
      const trialEnd = new Date(Date.now() + 1.5 * 24 * 60 * 60 * 1000);
      const result = trialService.calculateDaysRemaining(trialEnd);

      expect(result).toBe(2); // Should round up to 2
    });

    it('should handle very long trial periods', () => {
      const trialEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      const result = trialService.calculateDaysRemaining(trialEnd);

      expect(result).toBeGreaterThanOrEqual(364);
      expect(result).toBeLessThanOrEqual(366);
    });
  });

  describe('edge cases', () => {
    it('should handle workspace that was trialed but has no subscription', async () => {
      const user = await createTestUser();
      const workspace = await createTestWorkspace(user.id, true);

      const eligibility = await trialService.checkTrialEligibility(
        workspace.id
      );
      const status = await trialService.getTrialStatus(workspace.id);

      expect(eligibility.isEligible).toBe(false);
      expect(eligibility.hasUsedTrial).toBe(true);
      expect(status.isActive).toBe(false);
    });

    it('should handle workspace with past_due subscription', async () => {
      const user = await createTestUser();
      const workspace = await createTestWorkspace(user.id, false);
      const plan = await createTestPlan();

      const subscription = await prisma.subscription.create({
        data: {
          workspaceId: workspace.id,
          planId: plan.id,
          stripeSubscriptionId: `sub_test_${Date.now()}_${Math.random()}`,
          stripeCustomerId: `cus_test_${Date.now()}_${Math.random()}`,
          status: SubscriptionStatus.PAST_DUE,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          cancelAtPeriodEnd: false,
        },
      });
      testSubscriptionIds.push(subscription.id);

      const result = await trialService.checkTrialEligibility(workspace.id);

      // Past due subscription should not prevent trial eligibility
      expect(result.isEligible).toBe(true);
    });

    it('should handle trial ending in less than 1 hour', async () => {
      const user = await createTestUser();
      const workspace = await createTestWorkspace(user.id);
      const plan = await createTestPlan();

      // Trial ends in 30 minutes
      const trialEnd = new Date(Date.now() + 30 * 60 * 1000);

      const subscription = await prisma.subscription.create({
        data: {
          workspaceId: workspace.id,
          planId: plan.id,
          stripeSubscriptionId: `sub_test_${Date.now()}_${Math.random()}`,
          stripeCustomerId: `cus_test_${Date.now()}_${Math.random()}`,
          status: SubscriptionStatus.TRIALING,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          cancelAtPeriodEnd: false,
          trialEnd,
        },
      });
      testSubscriptionIds.push(subscription.id);

      const result = await trialService.getTrialStatus(workspace.id);

      expect(result.isActive).toBe(true);
      expect(result.daysRemaining).toBe(1); // Should round up to 1 day
    });
  });
});
