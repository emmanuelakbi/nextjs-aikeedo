import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PlanRepository } from './PlanRepository';
import { Plan } from '../../domain/billing/entities/Plan';
import { PlanInterval } from '@prisma/client';
import { prisma } from '../../lib/db';

/**
 * Plan Repository Tests
 * Requirements: Billing 1.1, 1.2, 1.3, 1.4, 1.5
 */

describe('PlanRepository', () => {
  let repository: PlanRepository;
  let testPlanIds: string[] = [];

  beforeEach(() => {
    repository = new PlanRepository();
  });

  afterEach(async () => {
    // Clean up test plans
    if (testPlanIds.length > 0) {
      await prisma.plan.deleteMany({
        where: {
          id: {
            in: testPlanIds,
          },
        },
      });
      testPlanIds = [];
    }
  });

  describe('create', () => {
    it('should create a new plan', async () => {
      const plan = await repository.create({
        name: 'Test Plan',
        description: 'A test subscription plan',
        price: 999,
        interval: PlanInterval.MONTH,
        creditCount: 1000,
        stripeProductId: `prod_test_${Date.now()}`,
        stripePriceId: `price_test_${Date.now()}`,
      });

      testPlanIds.push(plan.getId().getValue());

      expect(plan.getName()).toBe('Test Plan');
      expect(plan.getPrice()).toBe(999);
      expect(plan.getIsActive()).toBe(true);
    });

    it('should throw error for duplicate Stripe product ID', async () => {
      const stripeProductId = `prod_test_${Date.now()}`;
      const stripePriceId = `price_test_${Date.now()}`;

      const plan1 = await repository.create({
        name: 'Plan 1',
        description: 'Test',
        price: 999,
        interval: PlanInterval.MONTH,
        creditCount: 1000,
        stripeProductId,
        stripePriceId,
      });

      testPlanIds.push(plan1.getId().getValue());

      await expect(
        repository.create({
          name: 'Plan 2',
          description: 'Test',
          price: 1999,
          interval: PlanInterval.MONTH,
          creditCount: 2000,
          stripeProductId,
          stripePriceId: `price_test_${Date.now()}_2`,
        })
      ).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should find a plan by ID', async () => {
      const created = await repository.create({
        name: 'Find Test Plan',
        description: 'Test',
        price: 999,
        interval: PlanInterval.MONTH,
        creditCount: 1000,
        stripeProductId: `prod_test_${Date.now()}`,
        stripePriceId: `price_test_${Date.now()}`,
      });

      testPlanIds.push(created.getId().getValue());

      const found = await repository.findById(created.getId().getValue());

      expect(found).not.toBeNull();
      expect(found?.getName()).toBe('Find Test Plan');
    });

    it('should return null for non-existent plan', async () => {
      const found = await repository.findById('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('findByStripeProductId', () => {
    it('should find a plan by Stripe product ID', async () => {
      const stripeProductId = `prod_test_${Date.now()}`;

      const created = await repository.create({
        name: 'Stripe Test Plan',
        description: 'Test',
        price: 999,
        interval: PlanInterval.MONTH,
        creditCount: 1000,
        stripeProductId,
        stripePriceId: `price_test_${Date.now()}`,
      });

      testPlanIds.push(created.getId().getValue());

      const found = await repository.findByStripeProductId(stripeProductId);

      expect(found).not.toBeNull();
      expect(found?.getStripeProductId()).toBe(stripeProductId);
    });
  });

  describe('list', () => {
    it('should list all plans', async () => {
      const plan1 = await repository.create({
        name: 'List Test Plan 1',
        description: 'Test',
        price: 999,
        interval: PlanInterval.MONTH,
        creditCount: 1000,
        stripeProductId: `prod_test_${Date.now()}_1`,
        stripePriceId: `price_test_${Date.now()}_1`,
      });

      const plan2 = await repository.create({
        name: 'List Test Plan 2',
        description: 'Test',
        price: 1999,
        interval: PlanInterval.YEAR,
        creditCount: 12000,
        stripeProductId: `prod_test_${Date.now()}_2`,
        stripePriceId: `price_test_${Date.now()}_2`,
      });

      testPlanIds.push(plan1.getId().getValue(), plan2.getId().getValue());

      const plans = await repository.list();

      expect(plans.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter plans by active status', async () => {
      const activePlan = await repository.create({
        name: 'Active Plan',
        description: 'Test',
        price: 999,
        interval: PlanInterval.MONTH,
        creditCount: 1000,
        stripeProductId: `prod_test_${Date.now()}_active`,
        stripePriceId: `price_test_${Date.now()}_active`,
      });

      testPlanIds.push(activePlan.getId().getValue());

      const inactivePlan = await repository.create({
        name: 'Inactive Plan',
        description: 'Test',
        price: 1999,
        interval: PlanInterval.MONTH,
        creditCount: 2000,
        stripeProductId: `prod_test_${Date.now()}_inactive`,
        stripePriceId: `price_test_${Date.now()}_inactive`,
      });

      testPlanIds.push(inactivePlan.getId().getValue());

      await repository.deprecate(inactivePlan.getId().getValue());

      const activePlans = await repository.findActivePlans();

      expect(activePlans.every((p) => p.getIsActive())).toBe(true);
    });
  });

  describe('update', () => {
    it('should update a plan', async () => {
      const plan = await repository.create({
        name: 'Update Test Plan',
        description: 'Original description',
        price: 999,
        interval: PlanInterval.MONTH,
        creditCount: 1000,
        stripeProductId: `prod_test_${Date.now()}`,
        stripePriceId: `price_test_${Date.now()}`,
      });

      testPlanIds.push(plan.getId().getValue());

      const updated = await repository.update(plan.getId().getValue(), {
        name: 'Updated Plan Name',
        price: 1499,
      });

      expect(updated.getName()).toBe('Updated Plan Name');
      expect(updated.getPrice()).toBe(1499);
    });
  });

  describe('deprecate and activate', () => {
    it('should deprecate a plan', async () => {
      const plan = await repository.create({
        name: 'Deprecate Test Plan',
        description: 'Test',
        price: 999,
        interval: PlanInterval.MONTH,
        creditCount: 1000,
        stripeProductId: `prod_test_${Date.now()}`,
        stripePriceId: `price_test_${Date.now()}`,
      });

      testPlanIds.push(plan.getId().getValue());

      const deprecated = await repository.deprecate(plan.getId().getValue());

      expect(deprecated.getIsActive()).toBe(false);
    });

    it('should activate a plan', async () => {
      const plan = await repository.create({
        name: 'Activate Test Plan',
        description: 'Test',
        price: 999,
        interval: PlanInterval.MONTH,
        creditCount: 1000,
        stripeProductId: `prod_test_${Date.now()}`,
        stripePriceId: `price_test_${Date.now()}`,
      });

      testPlanIds.push(plan.getId().getValue());

      await repository.deprecate(plan.getId().getValue());
      const activated = await repository.activate(plan.getId().getValue());

      expect(activated.getIsActive()).toBe(true);
    });
  });

  describe('save', () => {
    it('should save a new plan entity', async () => {
      const plan = Plan.create({
        name: 'Save Test Plan',
        description: 'Test',
        price: 999,
        interval: PlanInterval.MONTH,
        creditCount: 1000,
        stripeProductId: `prod_test_${Date.now()}`,
        stripePriceId: `price_test_${Date.now()}`,
      });

      const saved = await repository.save(plan);

      testPlanIds.push(saved.getId().getValue());

      expect(saved.getName()).toBe('Save Test Plan');
    });

    it('should update an existing plan entity', async () => {
      const plan = Plan.create({
        name: 'Save Update Test',
        description: 'Test',
        price: 999,
        interval: PlanInterval.MONTH,
        creditCount: 1000,
        stripeProductId: `prod_test_${Date.now()}`,
        stripePriceId: `price_test_${Date.now()}`,
      });

      const saved = await repository.save(plan);
      testPlanIds.push(saved.getId().getValue());

      saved.update({ name: 'Updated via Save' });
      const updated = await repository.save(saved);

      expect(updated.getName()).toBe('Updated via Save');
    });
  });
});
