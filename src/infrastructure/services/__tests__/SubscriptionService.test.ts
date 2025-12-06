import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  subscriptionService,
  SubscriptionServiceError,
} from '../SubscriptionService';
import { prisma } from '../../../lib/db';
import { PlanInterval, SubscriptionStatus } from '@prisma/client';

/**
 * Unit Tests for SubscriptionService
 *
 * Tests subscription lifecycle management including creation, updates,
 * cancellation, and synchronization with Stripe.
 *
 * Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 7.2, 8.3, 8.4
 */

describe('SubscriptionService', () => {
  let testPlanIds: string[] = [];
  let testWorkspaceIds: string[] = [];
  let testUserIds: string[] = [];
  let testSubscriptionIds: string[] = [];

  // Helper to create a test user
  async function createTestUser(email?: string) {
    const user = await prisma.user.create({
      data: {
        email: email || `test-${Date.now()}-${Math.random()}@example.com`,
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
  async function createTestPlan(
    price: number = 999,
    creditCount: number | null = 1000
  ) {
    const plan = await prisma.plan.create({
      data: {
        name: `Test Plan ${Date.now()}`,
        description: 'Test plan',
        price,
        currency: 'usd',
        interval: PlanInterval.MONTH,
        creditCount,
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

  describe('createCheckoutSession', () => {
    it('should validate workspace exists', async () => {
      const plan = await createTestPlan();

      await expect(
        subscriptionService.createCheckoutSession({
          workspaceId: 'non-existent-id',
          planId: plan.id,
          email: 'test@example.com',
          successUrl: 'http://localhost:3000/success',
          cancelUrl: 'http://localhost:3000/cancel',
        })
      ).rejects.toThrow(SubscriptionServiceError);
    });

    it('should validate plan exists', async () => {
      const user = await createTestUser();
      const workspace = await createTestWorkspace(user.id);

      await expect(
        subscriptionService.createCheckoutSession({
          workspaceId: workspace.id,
          planId: 'non-existent-id',
          email: 'test@example.com',
          successUrl: 'http://localhost:3000/success',
          cancelUrl: 'http://localhost:3000/cancel',
        })
      ).rejects.toThrow(SubscriptionServiceError);
    });

    it('should reject inactive plans', async () => {
      const user = await createTestUser();
      const workspace = await createTestWorkspace(user.id);
      const plan = await createTestPlan();

      // Deactivate the plan
      await prisma.plan.update({
        where: { id: plan.id },
        data: { isActive: false },
      });

      await expect(
        subscriptionService.createCheckoutSession({
          workspaceId: workspace.id,
          planId: plan.id,
          email: 'test@example.com',
          successUrl: 'http://localhost:3000/success',
          cancelUrl: 'http://localhost:3000/cancel',
        })
      ).rejects.toThrow('Plan is not available for subscription');
    });

    it('should reject workspace with existing active subscription', async () => {
      const user = await createTestUser();
      const workspace = await createTestWorkspace(user.id);
      const plan = await createTestPlan();

      // Create an active subscription
      const subscription = await prisma.subscription.create({
        data: {
          workspaceId: workspace.id,
          planId: plan.id,
          stripeSubscriptionId: `sub_test_${Date.now()}`,
          stripeCustomerId: `cus_test_${Date.now()}`,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          cancelAtPeriodEnd: false,
        },
      });
      testSubscriptionIds.push(subscription.id);

      await expect(
        subscriptionService.createCheckoutSession({
          workspaceId: workspace.id,
          planId: plan.id,
          email: 'test@example.com',
          successUrl: 'http://localhost:3000/success',
          cancelUrl: 'http://localhost:3000/cancel',
        })
      ).rejects.toThrow('Workspace already has an active subscription');
    });
  });

  describe('syncSubscriptionFromStripe', () => {
    it('should create new subscription from Stripe data', async () => {
      const user = await createTestUser();
      const workspace = await createTestWorkspace(user.id);
      const plan = await createTestPlan();

      const stripeSubscription = {
        id: `sub_test_${Date.now()}`,
        customer: `cus_test_${Date.now()}`,
        status: 'active' as const,
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(
          (Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000
        ),
        cancel_at_period_end: false,
        canceled_at: null,
        trial_end: null,
        metadata: {
          workspaceId: workspace.id,
          planId: plan.id,
        },
      } as any;

      const result =
        await subscriptionService.syncSubscriptionFromStripe(
          stripeSubscription
        );
      testSubscriptionIds.push(result.id);

      expect(result.workspaceId).toBe(workspace.id);
      expect(result.planId).toBe(plan.id);
      expect(result.status).toBe(SubscriptionStatus.ACTIVE);
      expect(result.stripeSubscriptionId).toBe(stripeSubscription.id);
    });

    it('should update existing subscription from Stripe data', async () => {
      const user = await createTestUser();
      const workspace = await createTestWorkspace(user.id);
      const plan = await createTestPlan();

      const stripeSubId = `sub_test_${Date.now()}`;

      // Create initial subscription
      const initial = await prisma.subscription.create({
        data: {
          workspaceId: workspace.id,
          planId: plan.id,
          stripeSubscriptionId: stripeSubId,
          stripeCustomerId: `cus_test_${Date.now()}`,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          cancelAtPeriodEnd: false,
        },
      });
      testSubscriptionIds.push(initial.id);

      // Update via Stripe sync
      const stripeSubscription = {
        id: stripeSubId,
        customer: initial.stripeCustomerId,
        status: 'past_due' as const,
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(
          (Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000
        ),
        cancel_at_period_end: true,
        canceled_at: Math.floor(Date.now() / 1000),
        trial_end: null,
        metadata: {
          workspaceId: workspace.id,
          planId: plan.id,
        },
      } as any;

      const result =
        await subscriptionService.syncSubscriptionFromStripe(
          stripeSubscription
        );

      expect(result.id).toBe(initial.id);
      expect(result.status).toBe(SubscriptionStatus.PAST_DUE);
      expect(result.cancelAtPeriodEnd).toBe(true);
    });

    it('should allocate credits for active subscriptions', async () => {
      const user = await createTestUser();
      const workspace = await createTestWorkspace(user.id);
      const plan = await createTestPlan(999, 5000);

      const stripeSubscription = {
        id: `sub_test_${Date.now()}`,
        customer: `cus_test_${Date.now()}`,
        status: 'active' as const,
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(
          (Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000
        ),
        cancel_at_period_end: false,
        canceled_at: null,
        trial_end: null,
        metadata: {
          workspaceId: workspace.id,
          planId: plan.id,
        },
      } as any;

      const result =
        await subscriptionService.syncSubscriptionFromStripe(
          stripeSubscription
        );
      testSubscriptionIds.push(result.id);

      // Verify credits were allocated
      const updatedWorkspace = await prisma.workspace.findUnique({
        where: { id: workspace.id },
      });

      expect(updatedWorkspace?.creditCount).toBe(5000);
      expect(updatedWorkspace?.allocatedCredits).toBe(5000);
    });

    it('should mark workspace as trialed when trial ends', async () => {
      const user = await createTestUser();
      const workspace = await createTestWorkspace(user.id, false);
      const plan = await createTestPlan();

      const trialEnd = Math.floor(
        (Date.now() + 14 * 24 * 60 * 60 * 1000) / 1000
      );

      const stripeSubscription = {
        id: `sub_test_${Date.now()}`,
        customer: `cus_test_${Date.now()}`,
        status: 'trialing' as const,
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(
          (Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000
        ),
        cancel_at_period_end: false,
        canceled_at: null,
        trial_end: trialEnd,
        metadata: {
          workspaceId: workspace.id,
          planId: plan.id,
        },
      } as any;

      const result =
        await subscriptionService.syncSubscriptionFromStripe(
          stripeSubscription
        );
      testSubscriptionIds.push(result.id);

      // Verify workspace is marked as trialed
      const updatedWorkspace = await prisma.workspace.findUnique({
        where: { id: workspace.id },
      });

      expect(updatedWorkspace?.isTrialed).toBe(true);
    });

    it('should throw error for missing metadata', async () => {
      const stripeSubscription = {
        id: `sub_test_${Date.now()}`,
        customer: `cus_test_${Date.now()}`,
        status: 'active' as const,
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(
          (Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000
        ),
        cancel_at_period_end: false,
        canceled_at: null,
        trial_end: null,
        metadata: {}, // Missing workspaceId and planId
      } as any;

      await expect(
        subscriptionService.syncSubscriptionFromStripe(stripeSubscription)
      ).rejects.toThrow('Missing workspace or plan ID');
    });
  });

  describe('hasActiveSubscription', () => {
    it('should return true for active subscription', async () => {
      const user = await createTestUser();
      const workspace = await createTestWorkspace(user.id);
      const plan = await createTestPlan();

      const subscription = await prisma.subscription.create({
        data: {
          workspaceId: workspace.id,
          planId: plan.id,
          stripeSubscriptionId: `sub_test_${Date.now()}`,
          stripeCustomerId: `cus_test_${Date.now()}`,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          cancelAtPeriodEnd: false,
        },
      });
      testSubscriptionIds.push(subscription.id);

      const hasActive = await subscriptionService.hasActiveSubscription(
        workspace.id
      );
      expect(hasActive).toBe(true);
    });

    it('should return true for trialing subscription', async () => {
      const user = await createTestUser();
      const workspace = await createTestWorkspace(user.id);
      const plan = await createTestPlan();

      const subscription = await prisma.subscription.create({
        data: {
          workspaceId: workspace.id,
          planId: plan.id,
          stripeSubscriptionId: `sub_test_${Date.now()}`,
          stripeCustomerId: `cus_test_${Date.now()}`,
          status: SubscriptionStatus.TRIALING,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          cancelAtPeriodEnd: false,
          trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      });
      testSubscriptionIds.push(subscription.id);

      const hasActive = await subscriptionService.hasActiveSubscription(
        workspace.id
      );
      expect(hasActive).toBe(true);
    });

    it('should return false for canceled subscription', async () => {
      const user = await createTestUser();
      const workspace = await createTestWorkspace(user.id);
      const plan = await createTestPlan();

      const subscription = await prisma.subscription.create({
        data: {
          workspaceId: workspace.id,
          planId: plan.id,
          stripeSubscriptionId: `sub_test_${Date.now()}`,
          stripeCustomerId: `cus_test_${Date.now()}`,
          status: SubscriptionStatus.CANCELED,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          cancelAtPeriodEnd: false,
        },
      });
      testSubscriptionIds.push(subscription.id);

      const hasActive = await subscriptionService.hasActiveSubscription(
        workspace.id
      );
      expect(hasActive).toBe(false);
    });

    it('should return false for workspace without subscription', async () => {
      const user = await createTestUser();
      const workspace = await createTestWorkspace(user.id);

      const hasActive = await subscriptionService.hasActiveSubscription(
        workspace.id
      );
      expect(hasActive).toBe(false);
    });
  });

  describe('getSubscriptionByWorkspaceId', () => {
    it('should return subscription for workspace', async () => {
      const user = await createTestUser();
      const workspace = await createTestWorkspace(user.id);
      const plan = await createTestPlan();

      const subscription = await prisma.subscription.create({
        data: {
          workspaceId: workspace.id,
          planId: plan.id,
          stripeSubscriptionId: `sub_test_${Date.now()}`,
          stripeCustomerId: `cus_test_${Date.now()}`,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          cancelAtPeriodEnd: false,
        },
      });
      testSubscriptionIds.push(subscription.id);

      const result = await subscriptionService.getSubscriptionByWorkspaceId(
        workspace.id
      );

      expect(result).not.toBeNull();
      expect(result?.id).toBe(subscription.id);
      expect(result?.workspaceId).toBe(workspace.id);
    });

    it('should return null for workspace without subscription', async () => {
      const user = await createTestUser();
      const workspace = await createTestWorkspace(user.id);

      const result = await subscriptionService.getSubscriptionByWorkspaceId(
        workspace.id
      );
      expect(result).toBeNull();
    });
  });

  describe('getSubscriptionByStripeId', () => {
    it('should return subscription by Stripe ID', async () => {
      const user = await createTestUser();
      const workspace = await createTestWorkspace(user.id);
      const plan = await createTestPlan();

      const stripeSubId = `sub_test_${Date.now()}`;

      const subscription = await prisma.subscription.create({
        data: {
          workspaceId: workspace.id,
          planId: plan.id,
          stripeSubscriptionId: stripeSubId,
          stripeCustomerId: `cus_test_${Date.now()}`,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          cancelAtPeriodEnd: false,
        },
      });
      testSubscriptionIds.push(subscription.id);

      const result =
        await subscriptionService.getSubscriptionByStripeId(stripeSubId);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(subscription.id);
      expect(result?.stripeSubscriptionId).toBe(stripeSubId);
    });

    it('should return null for non-existent Stripe ID', async () => {
      const result =
        await subscriptionService.getSubscriptionByStripeId('sub_nonexistent');
      expect(result).toBeNull();
    });
  });
});
