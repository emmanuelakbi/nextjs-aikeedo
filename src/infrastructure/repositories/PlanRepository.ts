import { Plan, PlanProps } from '../../domain/billing/entities/Plan';
import { Id } from '../../domain/user/value-objects/Id';
import {
  IPlanRepository,
  CreatePlanData,
  UpdatePlanData,
  ListPlansOptions,
} from '../../domain/billing/repositories/IPlanRepository';
import { PlanInterval } from '../../domain/billing/types';
import { prisma } from '../../lib/db';
import { Prisma, PlanInterval as PrismaPlanInterval } from '@prisma/client';

/**
 * PlanRepository - Prisma implementation
 *
 * Handles persistence operations for Plan entities.
 * Requirements: Billing 1.1, 1.2, 1.3, 1.4, 1.5
 */

export class PlanRepository implements IPlanRepository {
  /**
   * Creates a new plan in the database
   * Requirements: Billing 1.1, 1.2
   */
  async create(data: CreatePlanData): Promise<Plan> {
    try {
      const plan = await prisma.plan.create({
        data: {
          name: data.name,
          description: data.description,
          price: data.price,
          currency: data.currency || 'usd',
          interval: data.interval as PrismaPlanInterval,
          creditCount: data.creditCount,
          features: data.features || {},
          limits: data.limits || {},
          stripeProductId: data.stripeProductId,
          stripePriceId: data.stripePriceId,
          isActive: true,
        },
      });

      return this.toDomain(plan);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new Error(
            'Plan with this Stripe product or price ID already exists'
          );
        }
      }
      throw new Error(
        `Failed to create plan: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Finds a plan by ID
   * Requirements: Billing 1.5
   */
  async findById(id: string): Promise<Plan | null> {
    try {
      const plan = await prisma.plan.findUnique({
        where: { id },
      });

      return plan ? this.toDomain(plan) : null;
    } catch (error) {
      throw new Error(
        `Failed to find plan by ID: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Finds a plan by Stripe product ID
   * Requirements: Billing 1.1
   */
  async findByStripeProductId(stripeProductId: string): Promise<Plan | null> {
    try {
      const plan = await prisma.plan.findUnique({
        where: { stripeProductId },
      });

      return plan ? this.toDomain(plan) : null;
    } catch (error) {
      throw new Error(
        `Failed to find plan by Stripe product ID: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Finds a plan by Stripe price ID
   * Requirements: Billing 1.1
   */
  async findByStripePriceId(stripePriceId: string): Promise<Plan | null> {
    try {
      const plan = await prisma.plan.findUnique({
        where: { stripePriceId },
      });

      return plan ? this.toDomain(plan) : null;
    } catch (error) {
      throw new Error(
        `Failed to find plan by Stripe price ID: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Lists plans with optional filters
   * Requirements: Billing 1.5
   */
  async list(options: ListPlansOptions = {}): Promise<Plan[]> {
    try {
      const where: Prisma.PlanWhereInput = {};

      if (options.isActive !== undefined) {
        where.isActive = options.isActive;
      }

      if (options.interval) {
        where.interval = options.interval as PrismaPlanInterval;
      }

      const plans = await prisma.plan.findMany({
        where,
        orderBy: [{ price: 'asc' }, { createdAt: 'desc' }],
        take: options.limit,
        skip: options.offset,
      });

      return plans.map((p) => this.toDomain(p));
    } catch (error) {
      throw new Error(
        `Failed to list plans: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Finds all active plans
   * Requirements: Billing 1.4, 1.5
   */
  async findActivePlans(): Promise<Plan[]> {
    return this.list({ isActive: true });
  }

  /**
   * Finds active plans by interval
   * Requirements: Billing 1.5
   */
  async findActivePlansByInterval(interval: PlanInterval): Promise<Plan[]> {
    return this.list({ isActive: true, interval });
  }

  /**
   * Updates a plan
   * Requirements: Billing 1.3
   */
  async update(id: string, data: UpdatePlanData): Promise<Plan> {
    try {
      const plan = await prisma.plan.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });

      return this.toDomain(plan);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new Error('Plan not found');
        }
      }
      throw new Error(
        `Failed to update plan: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Deprecates a plan (sets isActive to false)
   * Requirements: Billing 1.4
   */
  async deprecate(id: string): Promise<Plan> {
    return this.update(id, { isActive: false });
  }

  /**
   * Activates a plan (sets isActive to true)
   * Requirements: Billing 1.4
   */
  async activate(id: string): Promise<Plan> {
    return this.update(id, { isActive: true });
  }

  /**
   * Deletes a plan
   * Note: This should only be used if there are no subscriptions
   * Requirements: Billing 1.4
   */
  async delete(id: string): Promise<void> {
    try {
      await prisma.plan.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new Error('Plan not found');
        }
        if (error.code === 'P2003') {
          throw new Error('Cannot delete plan with active subscriptions');
        }
      }
      throw new Error(
        `Failed to delete plan: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Saves a Plan entity (create or update)
   */
  async save(plan: Plan): Promise<Plan> {
    const props = plan.toPersistence();
    const id = props.id.getValue();

    try {
      const existingPlan = await prisma.plan.findUnique({
        where: { id },
      });

      if (existingPlan) {
        // Update existing plan
        const updated = await prisma.plan.update({
          where: { id },
          data: {
            name: props.name,
            description: props.description,
            price: props.price,
            currency: props.currency,
            interval: props.interval as PrismaPlanInterval,
            creditCount: props.creditCount,
            features: props.features,
            limits: props.limits,
            isActive: props.isActive,
            updatedAt: props.updatedAt,
          },
        });

        return this.toDomain(updated);
      } else {
        // Create new plan
        const created = await prisma.plan.create({
          data: {
            id,
            name: props.name,
            description: props.description,
            price: props.price,
            currency: props.currency,
            interval: props.interval as PrismaPlanInterval,
            creditCount: props.creditCount,
            features: props.features,
            limits: props.limits,
            stripeProductId: props.stripeProductId,
            stripePriceId: props.stripePriceId,
            isActive: props.isActive,
            createdAt: props.createdAt,
            updatedAt: props.updatedAt,
          },
        });

        return this.toDomain(created);
      }
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new Error(
            'Plan with this Stripe product or price ID already exists'
          );
        }
      }
      throw new Error(
        `Failed to save plan: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Converts Prisma plan model to domain Plan entity
   */
  private toDomain(prismaPlan: any): Plan {
    const props: PlanProps = {
      id: Id.fromString(prismaPlan.id),
      name: prismaPlan.name,
      description: prismaPlan.description,
      price: prismaPlan.price,
      currency: prismaPlan.currency,
      interval: prismaPlan.interval,
      creditCount: prismaPlan.creditCount,
      features: prismaPlan.features as Record<string, any>,
      limits: prismaPlan.limits as Record<string, any>,
      stripeProductId: prismaPlan.stripeProductId,
      stripePriceId: prismaPlan.stripePriceId,
      isActive: prismaPlan.isActive,
      createdAt: prismaPlan.createdAt,
      updatedAt: prismaPlan.updatedAt,
    };

    return Plan.fromPersistence(props);
  }
}
