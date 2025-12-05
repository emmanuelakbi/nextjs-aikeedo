import { Plan } from '../../../domain/billing/entities/Plan';
import { PlanRepository } from '../../../infrastructure/repositories/PlanRepository';

/**
 * Deprecate Plan Use Case
 * 
 * Deprecates a plan, preventing new subscriptions while maintaining existing ones.
 * Requirements: Billing 1.4
 */

export interface DeprecatePlanInput {
  planId: string;
}

export interface DeprecatePlanOutput {
  plan: Plan;
}

export class DeprecatePlanUseCase {
  constructor(private readonly planRepository: PlanRepository) {}

  async execute(input: DeprecatePlanInput): Promise<DeprecatePlanOutput> {
    // Validate input
    if (!input.planId?.trim()) {
      throw new Error('Plan ID is required');
    }

    // Find existing plan
    const plan = await this.planRepository.findById(input.planId);
    if (!plan) {
      throw new Error('Plan not found');
    }

    // Deprecate plan
    plan.deprecate();

    // Save to database
    const deprecatedPlan = await this.planRepository.save(plan);

    return { plan: deprecatedPlan };
  }
}
