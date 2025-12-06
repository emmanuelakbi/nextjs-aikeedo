import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminAction } from '@/lib/admin';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';

/**
 * Admin Plans Management API
 *
 * Requirements: Admin Dashboard 4 - System Settings
 * - Manage subscription plans
 *
 * GET /api/admin/plans - List all subscription plans
 * POST /api/admin/plans - Create a new subscription plan
 */

const planSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  price: z.number().min(0),
  currency: z.string().length(3).default('usd'),
  interval: z.enum(['MONTH', 'YEAR']),
  creditCount: z.number().int().min(0),
  features: z.record(z.string(), z.boolean()).optional(),
  isActive: z.boolean().default(true),
  stripePriceId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);

    const isActive = searchParams.get('isActive');
    const interval = searchParams.get('interval');

    const where: any = {};

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    if (interval) {
      where.interval = interval;
    }

    const plans = await prisma.plan.findMany({
      where,
      include: {
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
      orderBy: [{ interval: 'asc' }, { price: 'asc' }],
    });

    return NextResponse.json({ plans });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await request.json();

    // Validate input
    const validatedData = planSchema.parse(body);

    // Create plan
    const plan = await prisma.plan.create({
      data: validatedData,
    });

    // Log the action
    await logAdminAction({
      adminId: session.user.id,
      action: 'plan.create',
      targetType: 'plan',
      targetId: plan.id,
      changes: {
        name: plan.name,
        price: plan.price,
        interval: plan.interval,
        creditCount: plan.creditCount,
      },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating plan:', error);
    return NextResponse.json(
      { error: 'Failed to create plan' },
      { status: 500 }
    );
  }
}
