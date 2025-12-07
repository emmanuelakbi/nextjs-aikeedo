import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminAction } from '@/lib/admin';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';
import { CreditTransactionType } from '@/domain/types';
import type { PrismaClient } from '@prisma/client';

/**
 * Admin Workspace Credits Management API
 *
 * Requirements: Admin Dashboard 2 - Workspace Management
 *
 * POST /api/admin/workspaces/[id]/credits - Adjust workspace credits
 */

const adjustCreditsSchema = z.object({
  amount: z.number().int(),
  reason: z.string().min(1),
  type: z.enum(['add', 'subtract']),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAdmin();
    const workspaceId = params.id;
    const body = await request.json();

    // Validate input
    const { amount, reason, type } = adjustCreditsSchema.parse(body);

    // Get current workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        creditCount: true,
        name: true,
      },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    // Calculate new credit amount
    const adjustmentAmount = type === 'add' ? amount : -amount;
    const newCreditCount = workspace.creditCount + adjustmentAmount;

    // Prevent negative credits
    if (newCreditCount < 0) {
      return NextResponse.json(
        { error: 'Cannot reduce credits below zero' },
        { status: 400 }
      );
    }

    // Update workspace credits and create transaction in a transaction
    const result = await prisma.$transaction(async (tx: PrismaClient) => {
      // Update workspace credits
      const updatedWorkspace = await tx.workspace.update({
        where: { id: workspaceId },
        data: {
          creditCount: newCreditCount,
          creditsAdjustedAt: new Date(),
        },
      });

      // Create credit transaction record
      await tx.creditTransaction.create({
        data: {
          workspaceId,
          amount: adjustmentAmount,
          type: CreditTransactionType.ADJUSTMENT,
          description: `Admin adjustment: ${reason}`,
          referenceType: 'admin_adjustment',
          balanceBefore: workspace.creditCount,
          balanceAfter: newCreditCount,
        },
      });

      return updatedWorkspace;
    });

    // Log the action
    await logAdminAction({
      adminId: session.user.id,
      action: 'workspace.credits.adjust',
      targetType: 'workspace',
      targetId: workspaceId,
      changes: {
        previousCredits: workspace.creditCount,
        newCredits: newCreditCount,
        adjustment: adjustmentAmount,
        reason,
      },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      workspace: result,
      adjustment: {
        amount: adjustmentAmount,
        previousBalance: workspace.creditCount,
        newBalance: newCreditCount,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error adjusting credits:', error);
    return NextResponse.json(
      { error: 'Failed to adjust credits' },
      { status: 500 }
    );
  }
}
