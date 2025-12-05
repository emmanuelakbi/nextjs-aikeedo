import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminAction } from '@/lib/admin';
import prisma from '@/lib/db/prisma';
import { UserStatus } from '@/domain/user';
import { z } from 'zod';

/**
 * Admin User Status Management API
 *
 * Requirements: Admin Dashboard 1 - User Management
 *
 * POST /api/admin/users/[id]/status - Update user status (suspend/activate)
 */

const statusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
  reason: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAdmin();
    const userId = params.id;
    const body = await request.json();

    // Validate input
    const { status, reason } = statusSchema.parse(body);

    // Prevent admin from suspending themselves
    if (userId === session.user.id && status === 'SUSPENDED') {
      return NextResponse.json(
        { error: 'Cannot suspend your own account' },
        { status: 400 }
      );
    }

    // Get current user status
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { status: true, email: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        updatedAt: true,
      },
    });

    // Log the action
    const actionMap = {
      ACTIVE: 'user.activate',
      INACTIVE: 'user.deactivate',
      SUSPENDED: 'user.suspend',
    };

    await logAdminAction({
      adminId: session.user.id,
      action: actionMap[status],
      targetType: 'user',
      targetId: userId,
      changes: {
        previousStatus: currentUser.status,
        newStatus: status,
        reason,
      },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating user status:', error);
    return NextResponse.json(
      { error: 'Failed to update user status' },
      { status: 500 }
    );
  }
}
