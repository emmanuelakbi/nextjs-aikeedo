import { Plan } from '../../../domain/billing/entities/Plan';
import { PlanRepository } from '../../../infrastructure/repositories/PlanRepository';

/**
 * Update Plan Use Case
 *
 * Updates an existing subscription plan.
 * Requirements: Billing 1.3
 */

export interface UpdatePlanInput {
  planId: string;
  name?: string;
  description?: string;
  price?: number;
  creditCount?: number | null;
  features?: Record<string, any>;
  limits?: Record<string, any>;
}

export interface UpdatePlanOutput {
  plan: Plan;
}

export class UpdatePlanUseCase {
  constructor(private readonly planRepository: PlanRepository) {}

  async execute(input: UpdatePlanInput): Promise<UpdatePlanOutput> {
    // Validate input
    if (!input.planId?.trim()) {
      throw new Error('Plan ID is required');
    }

    if (input.price !== undefined && input.price < 0) {
      throw new Error('Plan price must be non-negative');
    }

    if (
      input.creditCount !== undefined &&
      input.creditCount !== null &&
      input.creditCount < 0
    ) {
      throw new Error(
        'Credit count must be non-negative or null for unlimited'
      );
    }

    // Find existing plan
    const plan = await this.planRepository.findById(input.planId);
    if (!plan) {
      throw new Error('Plan not found');
    }

    // Update plan entity
    plan.update({
      name: input.name,
      description: input.description,
      price: input.price,
      creditCount: input.creditCount,
      features: input.features,
      limits: input.limits,
    });

    // Save to database
    const updatedPlan = await this.planRepository.save(plan);

    return { plan: updatedPlan };
  }
}
