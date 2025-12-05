import { describe, it, expect } from 'vitest';
import { Plan } from './Plan';
import { PlanInterval } from '@prisma/client';

/**
 * Plan Entity Tests
 * Requirements: Billing 1.1, 1.2, 1.3, 1.4
 */

describe('Plan Entity', () => {
  describe('create', () => {
    it('should create a valid plan', () => {
      const plan = Plan.create({
        name: 'Basic Plan',
        description: 'A basic subscription plan',
        price: 999,
        interval: PlanInterval.MONTH,
        creditCount: 1000,
        stripeProductId: 'prod_test123',
        stripePriceId: 'price_test123',
      });

      expect(plan.getName()).toBe('Basic Plan');
      expect(plan.getDescription()).toBe('A basic subscription plan');
      expect(plan.getPrice()).toBe(999);
      expect(plan.getInterval()).toBe(PlanInterval.MONTH);
      expect(plan.getCreditCount()).toBe(1000);
      expect(plan.getIsActive()).toBe(true);
    });

    it('should create a plan with unlimited credits', () => {
      const plan = Plan.create({
        name: 'Unlimited Plan',
        description: 'An unlimited subscription plan',
        price: 4999,
        interval: PlanInterval.YEAR,
        creditCount: null,
        stripeProductId: 'prod_test456',
        stripePriceId: 'price_test456',
      });

      expect(plan.getCreditCount()).toBeNull();
      expect(plan.hasUnlimitedCredits()).toBe(true);
    });

    it('should throw error for empty name', () => {
      expect(() =>
        Plan.create({
          name: '',
          description: 'Test',
          price: 999,
          interval: PlanInterval.MONTH,
          creditCount: 1000,
          stripeProductId: 'prod_test',
          stripePriceId: 'price_test',
        })
      ).toThrow('Plan name is required');
    });

    it('should throw error for negative price', () => {
      expect(() =>
        Plan.create({
          name: 'Test Plan',
          description: 'Test',
          price: -100,
          interval: PlanInterval.MONTH,
          creditCount: 1000,
          stripeProductId: 'prod_test',
          stripePriceId: 'price_test',
        })
      ).toThrow('Plan price must be non-negative');
    });

    it('should throw error for negative credit count', () => {
      expect(() =>
        Plan.create({
          name: 'Test Plan',
          description: 'Test',
          price: 999,
          interval: PlanInterval.MONTH,
          creditCount: -100,
          stripeProductId: 'prod_test',
          stripePriceId: 'price_test',
        })
      ).toThrow('Credit count must be non-negative or null for unlimited');
    });
  });

  describe('update', () => {
    it('should update plan details', () => {
      const plan = Plan.create({
        name: 'Basic Plan',
        description: 'A basic subscription plan',
        price: 999,
        interval: PlanInterval.MONTH,
        creditCount: 1000,
        stripeProductId: 'prod_test123',
        stripePriceId: 'price_test123',
      });

      plan.update({
        name: 'Updated Plan',
        price: 1499,
        creditCount: 2000,
      });

      expect(plan.getName()).toBe('Updated Plan');
      expect(plan.getPrice()).toBe(1499);
      expect(plan.getCreditCount()).toBe(2000);
    });

    it('should throw error for empty name update', () => {
      const plan = Plan.create({
        name: 'Basic Plan',
        description: 'Test',
        price: 999,
        interval: PlanInterval.MONTH,
        creditCount: 1000,
        stripeProductId: 'prod_test',
        stripePriceId: 'price_test',
      });

      expect(() => plan.update({ name: '' })).toThrow('Plan name cannot be empty');
    });
  });

  describe('deprecate and activate', () => {
    it('should deprecate a plan', () => {
      const plan = Plan.create({
        name: 'Basic Plan',
        description: 'Test',
        price: 999,
        interval: PlanInterval.MONTH,
        creditCount: 1000,
        stripeProductId: 'prod_test',
        stripePriceId: 'price_test',
      });

      expect(plan.getIsActive()).toBe(true);
      expect(plan.isAvailableForSubscription()).toBe(true);

      plan.deprecate();

      expect(plan.getIsActive()).toBe(false);
      expect(plan.isAvailableForSubscription()).toBe(false);
    });

    it('should activate a deprecated plan', () => {
      const plan = Plan.create({
        name: 'Basic Plan',
        description: 'Test',
        price: 999,
        interval: PlanInterval.MONTH,
        creditCount: 1000,
        stripeProductId: 'prod_test',
        stripePriceId: 'price_test',
      });

      plan.deprecate();
      expect(plan.getIsActive()).toBe(false);

      plan.activate();
      expect(plan.getIsActive()).toBe(true);
      expect(plan.isAvailableForSubscription()).toBe(true);
    });
  });

  describe('getMonthlyEquivalentPrice', () => {
    it('should return price for monthly plan', () => {
      const plan = Plan.create({
        name: 'Monthly Plan',
        description: 'Test',
        price: 999,
        interval: PlanInterval.MONTH,
        creditCount: 1000,
        stripeProductId: 'prod_test',
        stripePriceId: 'price_test',
      });

      expect(plan.getMonthlyEquivalentPrice()).toBe(999);
    });

    it('should return monthly equivalent for yearly plan', () => {
      const plan = Plan.create({
        name: 'Yearly Plan',
        description: 'Test',
        price: 9990,
        interval: PlanInterval.YEAR,
        creditCount: 12000,
        stripeProductId: 'prod_test',
        stripePriceId: 'price_test',
      });

      expect(plan.getMonthlyEquivalentPrice()).toBe(833);
    });
  });
});
