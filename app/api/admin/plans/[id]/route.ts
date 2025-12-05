import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminAction } from '@/lib/admin';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';

/**
 * Admin Plan Management API - Individual Plan
 *
 * Requirements: Admin Dashboard 4 - System Settings
 * - Manage subscription plans
 *
 * GET /api/admin/plans/[id] - Get plan details
 * PATCH /api/admin/plans/[id] - Update plan details
 * DELETE /api/admin/plans/[id] - Delete plan
 */

const updatePlanSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  price: z.number().min(0).optional(),
  creditCount: z.number().int().min(0).optional(),
  features: z.record(z.string(), z.boolean()).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const planId = params.id;

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      include: {
        subscriptions: {
          select: {
            id: true,
            status: true,
            workspace: {
              select: {
                id: true,
                name: true,
                owner: {
                  select: {
                    email: true,
                  },
                },
              },
            },
          },
          take: 10,
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    return NextResponse.json({ plan });
  } catch (error) {
    console.error('Error fetching plan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plan' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAdmin();
    const planId = params.id;
    const body = await request.json();

    // Validate input
    const validatedData = updatePlanSchema.parse(body);

    // Get current plan data for audit log
    const currentPlan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!currentPlan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Update plan
    const updatedPlan = await prisma.plan.update({
      where: { id: planId },
      data: validatedData,
    });

    // Log the action
    await logAdminAction({
      adminId: session.user.id,
      action: 'plan.update',
      targetType: 'plan',
      targetId: planId,
      changes: validatedData,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ plan: updatedPlan });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating plan:', error);
    return NextResponse.json(
      { error: 'Failed to update plan' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAdmin();
    const planId = params.id;

    // Get plan data before deletion for audit log
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      include: {
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Check if plan has active subscriptions
    if (plan._count.subscriptions > 0) {
      return NextResponse.json(
        { error: 'Cannot delete plan with active subscriptions' },
        { status: 400 }
      );
    }

    // Delete plan
    await prisma.plan.delete({
      where: { id: planId },
    });

    // Log the action
    await logAdminAction({
      adminId: session.user.id,
      action: 'plan.delete',
      targetType: 'plan',
      targetId: planId,
      changes: {
        name: plan.name,
        price: plan.price,
        interval: plan.interval,
      },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting plan:', error);
    return NextResponse.json(
      { error: 'Failed to delete plan' },
      { status: 500 }
    );
  }
}
