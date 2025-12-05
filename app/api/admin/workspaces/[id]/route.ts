import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminAction } from '@/lib/admin';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';

/**
 * Admin Workspace Management API - Individual Workspace
 *
 * Requirements: Admin Dashboard 2 - Workspace Management
 *
 * GET /api/admin/workspaces/[id] - Get workspace details
 * PATCH /api/admin/workspaces/[id] - Update workspace details
 * DELETE /api/admin/workspaces/[id] - Delete workspace
 */

const updateWorkspaceSchema = z.object({
  name: z.string().min(1).optional(),
  ownerId: z.string().uuid().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const workspaceId = params.id;

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            status: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        subscription: {
          include: {
            plan: true,
          },
        },
        creditTransactions: {
          take: 10,
          orderBy: {
            createdAt: 'desc',
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

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ workspace });
  } catch (error) {
    console.error('Error fetching workspace:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workspace' },
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
    const workspaceId = params.id;
    const body = await request.json();

    // Validate input
    const validatedData = updateWorkspaceSchema.parse(body);

    // Get current workspace data for audit log
    const currentWorkspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        name: true,
        ownerId: true,
      },
    });

    if (!currentWorkspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    // If changing owner, verify new owner exists
    if (validatedData.ownerId && validatedData.ownerId !== currentWorkspace.ownerId) {
      const newOwner = await prisma.user.findUnique({
        where: { id: validatedData.ownerId },
      });

      if (!newOwner) {
        return NextResponse.json(
          { error: 'New owner not found' },
          { status: 404 }
        );
      }
    }

    // Update workspace
    const updatedWorkspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: validatedData,
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Log the action
    await logAdminAction({
      adminId: session.user.id,
      action: 'workspace.update',
      targetType: 'workspace',
      targetId: workspaceId,
      changes: validatedData,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ workspace: updatedWorkspace });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating workspace:', error);
    return NextResponse.json(
      { error: 'Failed to update workspace' },
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
    const workspaceId = params.id;

    // Get workspace data before deletion for audit log
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        name: true,
        ownerId: true,
        owner: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    // Delete workspace (cascade will handle related records)
    await prisma.workspace.delete({
      where: { id: workspaceId },
    });

    // Log the action
    await logAdminAction({
      adminId: session.user.id,
      action: 'workspace.delete',
      targetType: 'workspace',
      targetId: workspaceId,
      changes: {
        name: workspace.name,
        ownerId: workspace.ownerId,
        ownerEmail: workspace.owner.email,
      },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting workspace:', error);
    return NextResponse.json(
      { error: 'Failed to delete workspace' },
      { status: 500 }
    );
  }
}
