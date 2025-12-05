import { NextRequest, NextResponse } from 'next/server';
import { PlanRepository } from '@/infrastructure/repositories/PlanRepository';
import { DeprecatePlanUseCase } from '@/application/use-cases/billing/DeprecatePlan';

/**
 * POST /api/billing/plans/[id]/deprecate
 * Deprecates a subscription plan
 * Requirements: Billing 1.4
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const planRepository = new PlanRepository();
    const deprecatePlanUseCase = new DeprecatePlanUseCase(planRepository);

    const result = await deprecatePlanUseCase.execute({ planId: params.id });
    const plan = result.plan;

    return NextResponse.json({
      plan: {
        id: plan.getId().getValue(),
        name: plan.getName(),
        description: plan.getDescription(),
        price: plan.getPrice(),
        currency: plan.getCurrency(),
        interval: plan.getInterval(),
        creditCount: plan.getCreditCount(),
        features: plan.getFeatures(),
        limits: plan.getLimits(),
        stripeProductId: plan.getStripeProductId(),
        stripePriceId: plan.getStripePriceId(),
        isActive: plan.getIsActive(),
        createdAt: plan.getCreatedAt().toISOString(),
        updatedAt: plan.getUpdatedAt().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error deprecating plan:', error);
    const status = error instanceof Error && error.message === 'Plan not found' ? 404 : 400;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to deprecate plan' },
      { status }
    );
  }
}
