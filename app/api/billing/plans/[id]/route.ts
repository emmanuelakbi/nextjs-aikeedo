import { NextRequest, NextResponse } from 'next/server';
import { PlanRepository } from '@/infrastructure/repositories/PlanRepository';
import { GetPlanUseCase } from '@/application/use-cases/billing/GetPlan';
import { UpdatePlanUseCase } from '@/application/use-cases/billing/UpdatePlan';

/**
 * GET /api/billing/plans/[id]
 * Gets a single subscription plan
 * Requirements: Billing 1.5
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const planRepository = new PlanRepository();
    const getPlanUseCase = new GetPlanUseCase(planRepository);

    const result = await getPlanUseCase.execute({ planId: params.id });
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
    console.error('Error getting plan:', error);
    const status = error instanceof Error && error.message === 'Plan not found' ? 404 : 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get plan' },
      { status }
    );
  }
}

/**
 * PATCH /api/billing/plans/[id]
 * Updates a subscription plan
 * Requirements: Billing 1.3
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const planRepository = new PlanRepository();
    const updatePlanUseCase = new UpdatePlanUseCase(planRepository);

    const result = await updatePlanUseCase.execute({
      planId: params.id,
      name: body.name,
      description: body.description,
      price: body.price,
      creditCount: body.creditCount,
      features: body.features,
      limits: body.limits,
    });

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
    console.error('Error updating plan:', error);
    const status = error instanceof Error && error.message === 'Plan not found' ? 404 : 400;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update plan' },
      { status }
    );
  }
}
