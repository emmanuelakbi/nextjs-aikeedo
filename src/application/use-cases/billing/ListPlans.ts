import { Plan } from '../../../domain/billing/entities/Plan';
import { PlanRepository } from '../../../infrastructure/repositories/PlanRepository';
import { PlanInterval } from '@prisma/client';

/**
 * List Plans Use Case
 *
 * Retrieves a list of subscription plans.
 * Requirements: Billing 1.5
 */

export interface ListPlansInput {
  isActive?: boolean;
  interval?: PlanInterval;
  limit?: number;
  offset?: number;
}

export interface ListPlansOutput {
  plans: Plan[];
  total: number;
}

export class ListPlansUseCase {
  constructor(private readonly planRepository: PlanRepository) {}

  async execute(input: ListPlansInput = {}): Promise<ListPlansOutput> {
    // Validate input
    if (input.limit !== undefined && input.limit < 0) {
      throw new Error('Limit must be non-negative');
    }

    if (input.offset !== undefined && input.offset < 0) {
      throw new Error('Offset must be non-negative');
    }

    // Retrieve plans
    const plans = await this.planRepository.list({
      isActive: input.isActive,
      interval: input.interval,
      limit: input.limit,
      offset: input.offset,
    });

    return {
      plans,
      total: plans.length,
    };
  }
}
