import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminAction } from '@/lib/admin';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';
export const dynamic = 'force-dynamic';


/**
 * Admin User Management API - Individual User
 *
 * Requirements: Admin Dashboard 1 - User Management
 *
 * GET /api/admin/users/[id] - Get user details
 * PATCH /api/admin/users/[id] - Update user details
 * DELETE /api/admin/users/[id] - Delete user
 */

const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  phoneNumber: z.string().optional(),
  language: z.string().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const userId = params.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        ownedWorkspaces: {
          select: {
            id: true,
            name: true,
            creditCount: true,
            createdAt: true,
          },
        },
        workspaceMembers: {
          include: {
            workspace: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        affiliate: {
          select: {
            id: true,
            code: true,
            status: true,
            totalEarnings: true,
            pendingEarnings: true,
          },
        },
        _count: {
          select: {
            conversations: true,
            generations: true,
            files: true,
            documents: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Remove sensitive data
    const { passwordHash, apiKey, ...safeUser } = user;

    return NextResponse.json({ user: safeUser });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
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
    const userId = params.id;
    const body = await request.json();

    // Validate input
    const validatedData = updateUserSchema.parse(body);

    // Get current user data for audit log
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        phoneNumber: true,
        language: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if email is being changed and if it's already taken
    if (validatedData.email && validatedData.email !== currentUser.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 400 }
        );
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: validatedData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        phoneNumber: true,
        language: true,
        updatedAt: true,
      },
    });

    // Log the action
    await logAdminAction({
      adminId: session.user.id,
      action: 'user.update',
      targetType: 'user',
      targetId: userId,
      changes: validatedData,
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

    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
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
    const userId = params.id;

    // Prevent admin from deleting themselves
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Get user data before deletion for audit log
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id: userId },
    });

    // Log the action
    await logAdminAction({
      adminId: session.user.id,
      action: 'user.delete',
      targetType: 'user',
      targetId: userId,
      changes: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
