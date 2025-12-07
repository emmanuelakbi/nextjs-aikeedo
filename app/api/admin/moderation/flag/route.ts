import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { logAdminAction } from '@/lib/admin/audit-logger';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';
export const dynamic = 'force-dynamic';


/**
 * Admin Content Flagging API
 *
 * Requirements: Admin Dashboard 6 - Content Moderation
 * - Flag inappropriate content
 */

const flagSchema = z.object({
  generationId: z.string().uuid(),
  reason: z.string().min(1).max(500),
  action: z.enum(['flag', 'remove', 'ban_user']),
});

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();

    const validated = flagSchema.parse(body);

    // Check if generation exists
    const generation = await prisma.generation.findUnique({
      where: { id: validated.generationId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            status: true,
          },
        },
      },
    });

    if (!generation) {
      return NextResponse.json(
        { error: 'Generation not found' },
        { status: 404 }
      );
    }

    let actionTaken = 'flagged';

    // Handle different actions
    switch (validated.action) {
      case 'flag':
        // Just log the flag for now
        actionTaken = 'flagged';
        break;

      case 'remove':
        // Mark generation as failed/removed
        await prisma.generation.update({
          where: { id: validated.generationId },
          data: {
            status: 'FAILED',
            error: `Content removed by admin: ${validated.reason}`,
          },
        });
        actionTaken = 'removed';
        break;

      case 'ban_user':
        // Suspend the user
        await prisma.user.update({
          where: { id: generation.userId },
          data: { status: 'SUSPENDED' },
        });

        // Also mark generation as failed
        await prisma.generation.update({
          where: { id: validated.generationId },
          data: {
            status: 'FAILED',
            error: `Content removed and user banned: ${validated.reason}`,
          },
        });
        actionTaken = 'banned_user';
        break;
    }

    // Log the moderation action
    await logAdminAction({
      adminId: admin.user.id,
      action: `moderation.${validated.action}`,
      targetType: 'generation',
      targetId: validated.generationId,
      changes: {
        reason: validated.reason,
        action: validated.action,
        userId: generation.userId,
        userEmail: generation.user.email,
      },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      action: actionTaken,
      generationId: validated.generationId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error flagging content:', error);
    return NextResponse.json(
      { error: 'Failed to flag content' },
      { status: 500 }
    );
  }
}
