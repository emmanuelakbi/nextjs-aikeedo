import { Plan } from '../../../domain/billing/entities/Plan';
import { PlanRepository } from '../../../infrastructure/repositories/PlanRepository';

/**
 * Activate Plan Use Case
 * 
 * Activates a deprecated plan, allowing new subscriptions.
 * Requirements: Billing 1.4
 */

export interface ActivatePlanInput {
  planId: string;
}

export interface ActivatePlanOutput {
  plan: Plan;
}

export class ActivatePlanUseCase {
  constructor(private readonly planRepository: PlanRepository) {}

  async execute(input: ActivatePlanInput): Promise<ActivatePlanOutput> {
    // Validate input
    if (!input.planId?.trim()) {
      throw new Error('Plan ID is required');
    }

    // Find existing plan
    const plan = await this.planRepository.findById(input.planId);
    if (!plan) {
      throw new Error('Plan not found');
    }

    // Activate plan
    plan.activate();

    // Save to database
    const activatedPlan = await this.planRepository.save(plan);

    return { plan: activatedPlan };
  }
}
