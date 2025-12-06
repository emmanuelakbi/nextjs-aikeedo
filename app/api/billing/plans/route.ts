import { NextRequest, NextResponse } from 'next/server';
import { PlanRepository } from '@/infrastructure/repositories/PlanRepository';
import { CreatePlanUseCase } from '@/application/use-cases/billing/CreatePlan';
import { ListPlansUseCase } from '@/application/use-cases/billing/ListPlans';
import { PlanInterval } from '@/domain/types';

/**
 * GET /api/billing/plans
 * Lists all subscription plans
 * Requirements: Billing 1.5
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const isActive = searchParams.get('isActive');
    const interval = searchParams.get('interval') as PlanInterval | null;
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    const planRepository = new PlanRepository();
    const listPlansUseCase = new ListPlansUseCase(planRepository);

    const result = await listPlansUseCase.execute({
      isActive: isActive ? isActive === 'true' : undefined,
      interval: interval || undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });

    return NextResponse.json({
      plans: result.plans.map((plan) => ({
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
      })),
      total: result.total,
    });
  } catch (error) {
    console.error('Error listing plans:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to list plans',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/billing/plans
 * Creates a new subscription plan
 * Requirements: Billing 1.1, 1.2
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const planRepository = new PlanRepository();
    const createPlanUseCase = new CreatePlanUseCase(planRepository);

    const result = await createPlanUseCase.execute({
      name: body.name,
      description: body.description,
      price: body.price,
      currency: body.currency,
      interval: body.interval,
      creditCount: body.creditCount,
      features: body.features,
      limits: body.limits,
      stripeProductId: body.stripeProductId,
      stripePriceId: body.stripePriceId,
    });

    const plan = result.plan;

    return NextResponse.json(
      {
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
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating plan:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create plan',
      },
      { status: 400 }
    );
  }
}
