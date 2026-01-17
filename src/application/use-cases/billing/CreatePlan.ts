import { Plan } from '../../../domain/billing/entities/Plan';
import { PlanRepository } from '../../../infrastructure/repositories/PlanRepository';
import { PlanInterval } from '../../../domain/types';

/**
 * Create Plan Use Case
 *
 * Creates a new subscription plan.
 * Requirements: Billing 1.1, 1.2
 */

export interface CreatePlanInput {
  name: string;
  description: string;
  price: number;
  currency?: string;
  interval: PlanInterval;
  creditCount: number | null;
  features?: Record<string, any>;
  limits?: Record<string, any>;
  stripeProductId: string;
  stripePriceId: string;
}

export interface CreatePlanOutput {
  plan: Plan;
}

export class CreatePlanUseCase {
  constructor(private readonly planRepository: PlanRepository) {}

  async execute(input: CreatePlanInput): Promise<CreatePlanOutput> {
    // Validate input
    if (!input.name?.trim()) {
      throw new Error('Plan name is required');
    }

    if (!input.description?.trim()) {
      throw new Error('Plan description is required');
    }

    if (input.price < 0) {
      throw new Error('Plan price must be non-negative');
    }

    if (input.creditCount !== null && input.creditCount < 0) {
      throw new Error(
        'Credit count must be non-negative or null for unlimited'
      );
    }

    if (!input.stripeProductId?.trim()) {
      throw new Error('Stripe product ID is required');
    }

    if (!input.stripePriceId?.trim()) {
      throw new Error('Stripe price ID is required');
    }

    // Check if plan with same Stripe IDs already exists
    const existingByProduct = await this.planRepository.findByStripeProductId(
      input.stripeProductId
    );
    if (existingByProduct) {
      throw new Error('Plan with this Stripe product ID already exists');
    }

    const existingByPrice = await this.planRepository.findByStripePriceId(
      input.stripePriceId
    );
    if (existingByPrice) {
      throw new Error('Plan with this Stripe price ID already exists');
    }

    // Create plan entity
    const plan = Plan.create({
      name: input.name,
      description: input.description,
      price: input.price,
      currency: input.currency,
      interval: input.interval,
      creditCount: input.creditCount,
      features: input.features,
      limits: input.limits,
      stripeProductId: input.stripeProductId,
      stripePriceId: input.stripePriceId,
    });

    // Save to database
    const savedPlan = await this.planRepository.save(plan);

    return { plan: savedPlan };
  }
}
