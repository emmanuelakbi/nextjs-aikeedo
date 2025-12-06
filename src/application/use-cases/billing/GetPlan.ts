import { Plan } from '../../../domain/billing/entities/Plan';
import { PlanRepository } from '../../../infrastructure/repositories/PlanRepository';

/**
 * Get Plan Use Case
 *
 * Retrieves a single subscription plan by ID.
 * Requirements: Billing 1.5
 */

export interface GetPlanInput {
  planId: string;
}

export interface GetPlanOutput {
  plan: Plan;
}

export class GetPlanUseCase {
  constructor(private readonly planRepository: PlanRepository) {}

  async execute(input: GetPlanInput): Promise<GetPlanOutput> {
    // Validate input
    if (!input.planId?.trim()) {
      throw new Error('Plan ID is required');
    }

    // Retrieve plan
    const plan = await this.planRepository.findById(input.planId);
    if (!plan) {
      throw new Error('Plan not found');
    }

    return { plan };
  }
}
