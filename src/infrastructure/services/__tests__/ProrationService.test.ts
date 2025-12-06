import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prorationService, ProrationServiceError } from '../ProrationService';
import { prisma } from '../../../lib/db';
import { PlanInterval, SubscriptionStatus } from '@prisma/client';

/**
 * Unit Tests for ProrationService
 *
 * Tests proration calculations for subscription changes, including
 * upgrade charges and downgrade credits.
 *
 * Requirements: 9.1, 9.2, 9.4, 9.5
 */

describe('ProrationService', () => {
  let testPlanIds: string[] = [];
  let testWorkspaceIds: string[] = [];
  let testUserIds: string[] = [];
  let testSubscriptionIds: string[] = [];

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
  async function createTestWorkspace(ownerId: string) {
    const workspace = await prisma.workspace.create({
      data: {
        name: `Test Workspace ${Date.now()}`,
        ownerId,
        creditCount: 1000,
        allocatedCredits: 0,
      },
    });
    testWorkspaceIds.push(workspace.id);
    return workspace;
  }

  // Helper to create a test plan
  async function createTestPlan(
    price: number,
    interval: PlanInterval = PlanInterval.MONTH
  ) {
    const plan = await prisma.plan.create({
      data: {
        name: `Test Plan ${price}`,
        description: 'Test plan',
        price,
        currency: 'usd',
        interval,
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

  // Helper to create a test subscription
  async function createTestSubscription(
    workspaceId: string,
    planId: string,
    daysIntoMonth: number = 0
  ) {
    const now = new Date();
    const periodStart = new Date(
      now.getTime() - daysIntoMonth * 24 * 60 * 60 * 1000
    );
    const periodEnd = new Date(
      periodStart.getTime() + 30 * 24 * 60 * 60 * 1000
    );

    const subscription = await prisma.subscription.create({
      data: {
        workspaceId,
        planId,
        stripeSubscriptionId: `sub_test_${Date.now()}_${Math.random()}`,
        stripeCustomerId: `cus_test_${Date.now()}`,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
      },
    });
    testSubscriptionIds.push(subscription.id);
    return subscription;
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

  describe('calculateProration', () => {
    it('should calculate proration for upgrade', async () => {
      const user = await createTestUser();
      const workspace = await createTestWorkspace(user.id);
      const currentPlan = await createTestPlan(1000); // $10
      const newPlan = await createTestPlan(2000); // $20

      // Create subscription 10 days into the month
      const subscription = await createTestSubscription(
        workspace.id,
        currentPlan.id,
        10
      );

      const result = await prorationService.calculateProration({
        subscriptionId: subscription.id,
        newPlanId: newPlan.id,
      });

      expect(result.isUpgrade).toBe(true);
      expect(result.currentPlan.price).toBe(1000);
      expect(result.newPlan.price).toBe(2000);
      expect(result.immediateCharge).toBeGreaterThan(0);
      expect(result.calculation.proratedAmount).toBeGreaterThan(0);
      expect(result.calculation.creditAmount).toBe(0);
    });

    it('should calculate proration for downgrade', async () => {
      const user = await createTestUser();
      const workspace = await createTestWorkspace(user.id);
      const currentPlan = await createTestPlan(2000); // $20
      const newPlan = await createTestPlan(1000); // $10

      // Create subscription 10 days into the month
      const subscription = await createTestSubscription(
        workspace.id,
        currentPlan.id,
        10
      );

      const result = await prorationService.calculateProration({
        subscriptionId: subscription.id,
        newPlanId: newPlan.id,
      });

      expect(result.isUpgrade).toBe(false);
      expect(result.currentPlan.price).toBe(2000);
      expect(result.newPlan.price).toBe(1000);
      expect(result.immediateCharge).toBe(0);
      expect(result.calculation.proratedAmount).toBe(0);
      expect(result.calculation.creditAmount).toBeGreaterThan(0);
    });

    it('should calculate correct daily rate', async () => {
      const user = await createTestUser();
      const workspace = await createTestWorkspace(user.id);
      const currentPlan = await createTestPlan(3000); // $30 (3000 cents)
      const newPlan = await createTestPlan(6000); // $60 (6000 cents)

      // Create subscription exactly 15 days into a 30-day month
      const subscription = await createTestSubscription(
        workspace.id,
        currentPlan.id,
        15
      );

      const result = await prorationService.calculateProration({
        subscriptionId: subscription.id,
        newPlanId: newPlan.id,
      });

      // With 15 days remaining:
      // Current daily rate: 3000 / 30 = 100 cents/day
      // New daily rate: 6000 / 30 = 200 cents/day
      // Unused amount: 100 * 15 = 1500 cents
      // New period cost: 200 * 15 = 3000 cents
      // Prorated charge: 3000 - 1500 = 1500 cents ($15)

      expect(result.calculation.daysRemaining).toBeGreaterThanOrEqual(14);
      expect(result.calculation.daysRemaining).toBeLessThanOrEqual(16);
      expect(result.immediateCharge).toBeCloseTo(1500, 50); // Allow 50 cent tolerance
    });

    it('should throw error for non-existent subscription', async () => {
      const newPlan = await createTestPlan(2000);

      await expect(
        prorationService.calculateProration({
          subscriptionId: 'non-existent-id',
          newPlanId: newPlan.id,
        })
      ).rejects.toThrow(ProrationServiceError);
    });

    it('should throw error for non-existent plan', async () => {
      const user = await createTestUser();
      const workspace = await createTestWorkspace(user.id);
      const currentPlan = await createTestPlan(1000);
      const subscription = await createTestSubscription(
        workspace.id,
        currentPlan.id
      );

      await expect(
        prorationService.calculateProration({
          subscriptionId: subscription.id,
          newPlanId: 'non-existent-id',
        })
      ).rejects.toThrow(ProrationServiceError);
    });

    it('should throw error for inactive plan', async () => {
      const user = await createTestUser();
      const workspace = await createTestWorkspace(user.id);
      const currentPlan = await createTestPlan(1000);
      const newPlan = await createTestPlan(2000);

      // Deactivate the new plan
      await prisma.plan.update({
        where: { id: newPlan.id },
        data: { isActive: false },
      });

      const subscription = await createTestSubscription(
        workspace.id,
        currentPlan.id
      );

      await expect(
        prorationService.calculateProration({
          subscriptionId: subscription.id,
          newPlanId: newPlan.id,
        })
      ).rejects.toThrow('Plan is not active');
    });

    it('should throw error for interval mismatch', async () => {
      const user = await createTestUser();
      const workspace = await createTestWorkspace(user.id);
      const currentPlan = await createTestPlan(1000, PlanInterval.MONTH);
      const newPlan = await createTestPlan(10000, PlanInterval.YEAR);

      const subscription = await createTestSubscription(
        workspace.id,
        currentPlan.id
      );

      await expect(
        prorationService.calculateProration({
          subscriptionId: subscription.id,
          newPlanId: newPlan.id,
        })
      ).rejects.toThrow('Cannot change between different billing intervals');
    });

    it('should handle same-price plan change', async () => {
      const user = await createTestUser();
      const workspace = await createTestWorkspace(user.id);
      const currentPlan = await createTestPlan(1000);
      const newPlan = await createTestPlan(1000);

      const subscription = await createTestSubscription(
        workspace.id,
        currentPlan.id,
        10
      );

      const result = await prorationService.calculateProration({
        subscriptionId: subscription.id,
        newPlanId: newPlan.id,
      });

      // Same price means no upgrade or downgrade
      expect(result.isUpgrade).toBe(false);
      expect(result.immediateCharge).toBe(0);
      expect(result.calculation.proratedAmount).toBe(0);
      expect(result.calculation.creditAmount).toBe(0);
    });

    it('should handle proration at start of period', async () => {
      const user = await createTestUser();
      const workspace = await createTestWorkspace(user.id);
      const currentPlan = await createTestPlan(1000);
      const newPlan = await createTestPlan(2000);

      // Create subscription at start of period (0 days in)
      const subscription = await createTestSubscription(
        workspace.id,
        currentPlan.id,
        0
      );

      const result = await prorationService.calculateProration({
        subscriptionId: subscription.id,
        newPlanId: newPlan.id,
      });

      expect(result.isUpgrade).toBe(true);
      // Should charge for nearly full period
      expect(result.immediateCharge).toBeGreaterThan(900); // Close to $10 difference
    });

    it('should handle proration near end of period', async () => {
      const user = await createTestUser();
      const workspace = await createTestWorkspace(user.id);
      const currentPlan = await createTestPlan(1000);
      const newPlan = await createTestPlan(2000);

      // Create subscription 29 days into the month (1 day remaining)
      const subscription = await createTestSubscription(
        workspace.id,
        currentPlan.id,
        29
      );

      const result = await prorationService.calculateProration({
        subscriptionId: subscription.id,
        newPlanId: newPlan.id,
      });

      expect(result.isUpgrade).toBe(true);
      // Should charge for only 1 day
      expect(result.immediateCharge).toBeLessThan(100); // Less than $1
    });
  });

  describe('formatProrationBreakdown', () => {
    it('should format upgrade breakdown correctly', async () => {
      const user = await createTestUser();
      const workspace = await createTestWorkspace(user.id);
      const currentPlan = await createTestPlan(1000);
      const newPlan = await createTestPlan(2000);

      const subscription = await createTestSubscription(
        workspace.id,
        currentPlan.id,
        15
      );

      const details = await prorationService.calculateProration({
        subscriptionId: subscription.id,
        newPlanId: newPlan.id,
      });

      const breakdown = prorationService.formatProrationBreakdown(details);

      expect(breakdown.summary).toContain('Upgrading');
      expect(breakdown.summary).toContain(newPlan.name);
      expect(breakdown.items.length).toBeGreaterThan(0);
      expect(
        breakdown.items.some((item) => item.label.includes('Immediate Charge'))
      ).toBe(true);
    });

    it('should format downgrade breakdown correctly', async () => {
      const user = await createTestUser();
      const workspace = await createTestWorkspace(user.id);
      const currentPlan = await createTestPlan(2000);
      const newPlan = await createTestPlan(1000);

      const subscription = await createTestSubscription(
        workspace.id,
        currentPlan.id,
        15
      );

      const details = await prorationService.calculateProration({
        subscriptionId: subscription.id,
        newPlanId: newPlan.id,
      });

      const breakdown = prorationService.formatProrationBreakdown(details);

      expect(breakdown.summary).toContain('Downgrading');
      expect(breakdown.summary).toContain(newPlan.name);
      expect(breakdown.items.length).toBeGreaterThan(0);
      expect(
        breakdown.items.some((item) => item.label.includes('Credit Applied'))
      ).toBe(true);
    });

    it('should include days remaining in breakdown', async () => {
      const user = await createTestUser();
      const workspace = await createTestWorkspace(user.id);
      const currentPlan = await createTestPlan(1000);
      const newPlan = await createTestPlan(2000);

      const subscription = await createTestSubscription(
        workspace.id,
        currentPlan.id,
        10
      );

      const details = await prorationService.calculateProration({
        subscriptionId: subscription.id,
        newPlanId: newPlan.id,
      });

      const breakdown = prorationService.formatProrationBreakdown(details);

      expect(breakdown.summary).toContain('days');
      expect(
        breakdown.items.some((item) => item.description.includes('days'))
      ).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle very small price differences', async () => {
      const user = await createTestUser();
      const workspace = await createTestWorkspace(user.id);
      const currentPlan = await createTestPlan(1000);
      const newPlan = await createTestPlan(1001); // Only $0.01 difference

      const subscription = await createTestSubscription(
        workspace.id,
        currentPlan.id,
        15
      );

      const result = await prorationService.calculateProration({
        subscriptionId: subscription.id,
        newPlanId: newPlan.id,
      });

      expect(result.isUpgrade).toBe(true);
      expect(result.immediateCharge).toBeGreaterThanOrEqual(0);
      expect(result.immediateCharge).toBeLessThan(1); // Less than $0.01
    });

    it('should handle very large price differences', async () => {
      const user = await createTestUser();
      const workspace = await createTestWorkspace(user.id);
      const currentPlan = await createTestPlan(1000);
      const newPlan = await createTestPlan(100000); // $1000

      const subscription = await createTestSubscription(
        workspace.id,
        currentPlan.id,
        15
      );

      const result = await prorationService.calculateProration({
        subscriptionId: subscription.id,
        newPlanId: newPlan.id,
      });

      expect(result.isUpgrade).toBe(true);
      expect(result.immediateCharge).toBeGreaterThan(0);
      expect(result.calculation.proratedAmount).toBeGreaterThan(0);
    });

    it('should never produce negative proration amounts', async () => {
      const user = await createTestUser();
      const workspace = await createTestWorkspace(user.id);
      const currentPlan = await createTestPlan(5000);
      const newPlan = await createTestPlan(1000);

      const subscription = await createTestSubscription(
        workspace.id,
        currentPlan.id,
        20
      );

      const result = await prorationService.calculateProration({
        subscriptionId: subscription.id,
        newPlanId: newPlan.id,
      });

      expect(result.calculation.proratedAmount).toBeGreaterThanOrEqual(0);
      expect(result.calculation.creditAmount).toBeGreaterThanOrEqual(0);
      expect(result.immediateCharge).toBeGreaterThanOrEqual(0);
    });
  });
});
